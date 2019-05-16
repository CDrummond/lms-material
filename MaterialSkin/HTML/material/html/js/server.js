/**
 * LMS-Material
 *
 * Copyright (c) 2018-2019 Craig Drummond <craig.p.drummond@gmail.com>
 * MIT license.
 */

const PLAYER_STATUS_TAGS = "tags:cdegloyrstAKNS";

function getHiddenProp(){
    var prefixes = ['webkit','moz','ms','o'];
    
    // if 'hidden' is natively supported just return it
    if ('hidden' in document) {
        return 'hidden';
    }
    
    // otherwise loop over all the known prefixes until we find one
    for (var i = 0, len=prefixes.length; i < len; i++) {
        if ((prefixes[i] + 'Hidden') in document)  {
            return prefixes[i] + 'Hidden';
        }
    }

    // otherwise it's not supported
    return null;
}

// Attempt to detect when computer wakes from sleep.
// Eveery 2 seconds check time, if gap is more than 4 seconds then we were probably
// asleep - so refresh status.
var lastTime = (new Date()).getTime();

setInterval(function() {
    var currentTime = (new Date()).getTime();
    if (currentTime > (lastTime + (2000*2))) {
        bus.$emit('refreshStatus');
    }
    lastTime = currentTime;
}, 2000);

function isHidden() {
    var prop = getHiddenProp();
    return prop ? document[prop] : false;
}

/* If we become visibilty, refresh player status */
function visibilityChanged() {
    if (!isHidden()) {
        bus.$emit('refreshStatus');
    }
}
      
var lmsFavorites = new Set();
var lmsLastScan = undefined;
var haveLocalAndroidPlayer = false;

var currentIpAddress = undefined;
if (isAndroid()) { // currently only need to check current IP address to detect SB player, and this is Android only.
    try {
        var RTCPeerConnection = window.RTCPeerConnection || window.webkitRTCPeerConnection || window.mozRTCPeerConnection;
        if (RTCPeerConnection)(function() {
            var rtc = new RTCPeerConnection({iceServers:[]});
            rtc.createDataChannel('', {reliable: false});
            rtc.onicecandidate = function(evt) {
                if (evt.candidate) {
                    grepSdp(evt.candidate.candidate);
                }
            };

            rtc.createOffer(function(offerDesc) {
                rtc.setLocalDescription(offerDesc);
            }, function(e) { console.warn("Failed to get IP address", e); });

            function grepSdp(sdp) {
                var ip = /(192\.168\.(0|\d{0,3})\.(0|\d{0,3}))/i;
                sdp.split('\r\n').forEach(function(line) {
                    if (line.match(ip)) {
                        currentIpAddress = line.match(ip)[0];
                    }
                });
            }
        })();
    } catch(e) {
    }
}

const CancelToken = axios.CancelToken;
var lmsListSource = undefined;

function lmsCommand(playerid, command, isList) {
    var canCancel = isList && !(command.length>2 && command[0]=='menu' || command[1]=='items');

    if (canCancel) {
        lmsListSource = CancelToken.source();
    }
    var args = {
            method: "post",
            url: "/jsonrpc.js",
            headers: {'Content-Type': 'text/plain'},
            data: {
                id: 1,
                method: "slim.request",
                params: [playerid, command]
            },
            cancelToken: canCancel ? lmsListSource.token : undefined };
    if (debug && command && command.length>0 && command[0]!="status" && command[0]!="serverstatus") {
        logJsonMessage("REQ", args.data.params);
    }
    /* CometD does not seem to sent status messages (at least not quickly) when updates are made via JSONRPC. So, to
       work-around, we can manually update on each player message. */
    /* NOTE: Disabled for now, and status requests are sent when required. This saves multiple status messages being
             sent when a list of actions is performed. Left here in case needed later...
    if (playerid && !isList && command && command.length>0 && command[0]!="status" && command[0]!="serverstatus") {
        return axios(args).finally(() => {
            bus.$emit("updatePlayer", playerid);
        });
    }
    */
    if (canCancel) {
        return axios(args).finally(() => {
            lmsListSource = undefined;
        });
    } else {
        return axios(args);
    }
}

async function lmsList(playerid, command, params, start, batchSize, cancache) {
    var cmdParams = command.slice();
    cmdParams = [].concat(cmdParams, [undefined==start ? 0 : start, undefined===batchSize ? LMS_BATCH_SIZE : batchSize]);
    if (params && params.length>0) {
        cmdParams = [].concat(cmdParams, params);
    }
    if (cancache && canUseCache) { // canUseCache defined in utils.js
        return idbKeyval.get(cacheKey(command, params, start, batchSize)).then(val => {
            if (undefined==val) {
                return lmsCommand(playerid, cmdParams);
            }
            return new Promise(function(resolve, reject) {
                resolve({data:val});
            });
        });
    } else {
        return lmsCommand(playerid, cmdParams, true);
    }
}

var lmsServer = Vue.component('lms-server', {
    template: `<div/>`,
    data() {
        return {
        };
    },
    methods: {
        removeFromQueue(indexes) {
            if (indexes.length>0) {
                var index = indexes.shift();
                lmsCommand(this.$store.state.player.id, ["playlist", "delete", index]).then(({data}) => {
                    if (indexes.length>0) {
                        this.removeFromQueue(indexes);
                    }
                });
            } else {
                this.updateCurrentPlayer();
            }
        },
        moveQueueItems(indexes, to, movedBefore, movedAfter) {
            if (indexes.length>0) {
                var index = indexes.shift();
                lmsCommand(this.$store.state.player.id, ["playlist", "move", index<to ? index-movedBefore : index,
                                                         index>to ? to+movedAfter+(movedBefore>0 ? 1 : 0) : to]).then(({data}) => {
                    if (indexes.length>0) {
                        this.moveQueueItems(indexes, to, index<to ? movedBefore+1 : movedBefore,
                                                         index>to ? movedAfter+1 : movedAfter);
                    }
                });
            } else {
                this.updateCurrentPlayer();
            }
        },
        doAllList(ids, command, section) {
            if (ids.length>0) {
                var id = ids.shift();
                var cmd = command.slice();
                cmd.push(id);
                lmsCommand(this.$store.state.player.id, cmd).then(({data}) => {
                    if (ids.length>0) {
                        this.doAllList(ids, command, section);
                    } else {
                        bus.$emit('refreshList', section);
                    }
                }).catch(err => {
                    bus.$emit('refreshList', section);
                });
            }
        },
        scheduleNextPlayerStatusUpdate: function(timeout) {
            this.cancelPlayerStatusTimer();
            if (timeout) {
                // CometD updates can be delayed, so poll near end of song so that we notice changes
                logCometdDebug("Schedule next player poll in: "+timeout+"ms");
                this.playerStatusTimer = setTimeout(function () {
                    this.updateCurrentPlayer();
                }.bind(this), timeout<250 ? 250 : timeout);
            }
        },
        connectToCometD() {
            if (this.cometd) {
                this.cometd.disconnect();
            }
            this.cancelServerStatusTimer();
            this.subscribedPlayers = new Set();
            this.cometd = new org.cometd.CometD();
            this.cometd.setMaxBackoff(5000); // Max of 5 seconds between retries
            this.cometd.init({url: '/cometd', logLevel:'off'});

            this.cometd.addListener('/meta/handshake', (message) => {
                if (eval(message).successful) {
                    bus.$emit("networkStatus", true);
                    this.subscribedPlayers = new Set();
                    this.cometd.subscribe('/'+this.cometd.getClientId()+'/**', (res) => { this.handleCometDMessage(res); });
                    this.cometd.subscribe('/slim/subscribe',
                                    function(res) { },
                                    {data:{response:'/'+this.cometd.getClientId()+'/slim/serverstatus', request:['', ['serverstatus', 0, LMS_MAX_PLAYERS, 'subscribe:60']]}});
                    this.cometd.subscribe('/slim/subscribe',
                                    function(res) { },
                                    {data:{response:'/'+this.cometd.getClientId()+'/slim/favorites', request:['favorites', ['changed']]}});
                    this.updateFavorites();
                    // If we don't get a status update within 5 seconds, assume something wrong and reconnect
                    this.serverStatusTimer = setTimeout(function () {
                        this.serverStatusTimer = undefined;
                        this.connectToCometD();
                    }.bind(this), 5000);
                }
            });
        },
        handleCometDMessage(msg) {
            if (!msg.channel || !msg.data) {
                return;
            }
            if (msg.channel.endsWith("/slim/serverstatus")) {
                this.handleServerStatus(msg.data);
            } else if (msg.channel.indexOf('/slim/playerstatus/')>0) {
                this.handlePlayerStatus(msg.channel.split('/').pop(), msg.data);
            } else if (msg.channel.endsWith("/slim/favorites")) {
                this.handleFavoritesUpdate();
            } else {
                logCometdDebug("ERROR: Unexpected channel:"+msg.channel);
            }
        },
        handleServerStatus(data) {
            logCometdMessage("SERVER", data);
            this.cancelServerStatusTimer();
            var players = [];
            if (lmsLastScan!=data.lastscan) {
                lmsLastScan = data.lastscan;
                clearListCache();
            }
            if (data.players_loop) {
                var localAndroidPlayer = false;
                data.players_loop.forEach(i => {
                    if (1==parseInt(i.connected)) { // Only list/use connected players...
                        players.push({ id: i.playerid,
                                       name: i.name,
                                       canpoweroff: 1==parseInt(i.canpoweroff),
                                       ison: 1==parseInt(i.power),
                                       isgroup: 'group'===i.model
                                      });
                        // Check if we have a local SB Player - if so, can't use MediaSession
                        if (!localAndroidPlayer && currentIpAddress && 'SB Player' ===i.modelname && i.ip.split(':')[0] == currentIpAddress) {
                            localAndroidPlayer = true;
                        }
                    }
                });
                if (localAndroidPlayer != haveLocalAndroidPlayer) {
                    haveLocalAndroidPlayer = localAndroidPlayer;
                    if (haveLocalAndroidPlayer) {
                        bus.$emit('haveLocalAndroidPlayer');
                    }
                }
                this.$store.commit('setPlayers', players.sort(playerSort));

                if (0==this.subscribedPlayers.size) {
                    // Upon reconnect, will will need to re-sub to current player...
                    if (this.subscribeAll) {
                        for (var i=0, len=players.length; i<len; ++i) {
                            this.subscribe(players[i].id);
                        }
                    } else if (this.$store.state.player && this.$store.state.player.id) {
                        this.subscribe(this.$store.state.player.id);
                    }
                }
            }
        },
        handlePlayerStatus(playerId, data, forced) {
            logCometdMessage("PLAYER ("+playerId+(forced ? " [forced]" : "")+")", data);
            var isCurrent = this.$store.state.player && playerId==this.$store.state.player.id;
            var player = { ison: 1==parseInt(data.power),
                           isplaying: data.mode === "play" && !data.waitingToPlay,
                           volume: -1,
                           playlist: { shuffle:0, repeat: 0, duration:0, name:'', current: -1, count:0, timestamp:0},
                           current: { canseek: 0, time: undefined, duration: undefined },
                           will_sleep_in: data.will_sleep_in,
                           synced: data.sync_master || data.sync_slaves,
                           issyncmaster: data.sync_master == playerId,
                           syncmaster: data.sync_master,
                           id: playerId,
                           name: data.player_name
                         };

            player.volume = undefined==data["mixer volume"] ? 0.0 : Math.round(parseFloat(data["mixer volume"]));

            // Store volume, so that it can be accessed in 'adjustVolume' handler
            if (isCurrent) {
                this.volume = player.volume;
            }
            player.playlist = { shuffle: parseInt(data["playlist shuffle"]),
                                repeat: parseInt(data["playlist repeat"]),
                                duration: undefined==data["playlist duration"] ? undefined : parseFloat(data["playlist duration"]),
                                name: data.playlist_name,
                                current: undefined==data.playlist_cur_index ? -1 : parseInt(data.playlist_cur_index),
                                count: undefined==data.playlist_tracks ? 0 : parseInt(data.playlist_tracks),
                                timestamp: undefined===data.playlist_timestamp ? 0.0 : parseFloat(data.playlist_timestamp)
                              };
            if (data.playlist_loop && data.playlist_loop.length>0) {
                player.current = data.playlist_loop[0];
                player.current.time = undefined==data.time ? undefined : parseFloat(data.time);
                player.current.canseek = parseInt(data.can_seek);
                player.current.remote_title = checkRemoteTitle(player.current);
                // BBC iPlayer Extras streams can change duration. *But* on the duration in data seems to
                // get updated. So, if there is a duration there, use that as the current tracks duration.
                if (data.duration) {
                    player.current.duration = parseFloat(data.duration);
                }
            }

            bus.$emit(isCurrent ? 'playerStatus' : 'otherPlayerStatus', player);
            if (isCurrent) {
                this.scheduleNextPlayerStatusUpdate(data.mode === "play"
                                                        ? data.waitingToPlay
                                                            ? 1000 // Just starting to play? Poll in 1 second
                                                            : undefined!=player.current.duration
                                                                ? undefined!=player.current.time
                                                                    ? (player.current.duration-player.current.time)<2.5
                                                                        ? 500 // Near end, every 5 seconds
                                                                        : (player.current.duration-(player.current.time+2))*1000 // 2 seconds before end
                                                                    : player.current.time<5 // For streams, poll for the first 5 seconds
                                                                        ? 1000
                                                                        : undefined
                                                                : undefined
                                                        : undefined); // Not playing?
            }
        },
        handleFavoritesUpdate() {
            logCometdDebug("FAVORITES");
            // 'Debounce' favorites updates...
            this.cancelFavoritesTimer();
            this.favoritesTimer = setTimeout(function () {
                this.updateFavorites();
            }.bind(this), 500);
        },
        updateFavorites() { // Update set of favorites URLs
            lmsList("", ["favorites", "items"], ["menu:favorites", "menu:1"]).then(({data}) => {
                if (data && data.result && data.result.item_loop) {
                    var loop = data.result.item_loop;
                    var favs = {};
                    for (var i=0, len=loop.length; i<len; ++i) {
                        if (loop[i].presetParams && loop[i].presetParams.favorites_url && loop[i].params) {
                            var url = loop[i].presetParams.favorites_url;
                            var lib = url.indexOf("libraryTracks.library=");
                            if (lib>0) {
                                url=url.substring(0, lib-1);
                            }
                            favs[url]= { id:"item_id:"+loop[i].params.item_id,
                                         text:loop[i].text };
                        }
                    }
                    if (JSON.stringify(lmsFavorites) !== JSON.stringify(favs)) {
                        lmsFavorites = favs;
                        bus.$emit('refreshList', SECTION_FAVORITES);
                    }
                } 
            });
        },
        updatePlayer(id) {
            lmsCommand(id, ["status", "-", 1, PLAYER_STATUS_TAGS]).then(({data}) => {
                if (data && data.result) {
                    this.handlePlayerStatus(id, data.result, true);
                }
            });
        },
        updateCurrentPlayer() {
            if (this.$store.state.player) {
                this.updatePlayer(this.$store.state.player.id);
            }
        },
        subscribe(id) {
            if (!this.subscribedPlayers.has(id)) {
                logCometdDebug("Subscribe: "+id);
                this.cometd.subscribe('/slim/subscribe', function(res) { },
                    {data:{response:'/'+this.cometd.getClientId()+'/slim/playerstatus/'+id, request:[id, ["status", "-", 1, PLAYER_STATUS_TAGS, "subscribe:30"]]}});
                this.subscribedPlayers.add(id);
            }
        },
        unsubscribe(id) {
            if (this.subscribedPlayers.has(id)) {
                logCometdDebug("Unsubscribe: "+id);
                this.cometd.subscribe('/slim/subscribe', function(res) { },
                    {data:{response:'/'+this.cometd.getClientId()+'/slim/playerstatus/'+id, request:[id, ["status", "-", 1, "subscribe:-"]]}});
                this.subscribedPlayers.delete(id);
            }
        },
        playerChanged() {
            if (this.$store.state.player && !this.subscribedPlayers.has(this.$store.state.player.id)) {
                if (!this.subscribeAll) {
                    // If not subscribing to all, remove other subscriptions...
                    var subedPlayers = Array.from(this.subscribedPlayers);
                    for (var i=0, len=subedPlayers.length; i<len; ++i) {
                        this.unsubscribe(subedPlayers[i]);
                    }
                }
                this.subscribe(this.$store.state.player.id);
            } else {
                this.updateCurrentPlayer();
            }
        },
        refreshServerStatus() {
            lmsCommand("", ["serverstatus", 0, LMS_MAX_PLAYERS]).then(({data}) => {
                if (data && data.result) {
                    this.handleServerStatus(data.result);
                }
            });
        },
        cancelServerStatusTimer() {
            if (undefined!==this.serverStatusTimer) {
                clearTimeout(this.serverStatusTimer);
                this.serverStatusTimer = undefined;
            }
        },
        cancelPlayerStatusTimer() {
            if (undefined!==this.playerStatusTimer) {
                clearTimeout(this.playerStatusTimer);
                this.playerStatusTimer = undefined;
            }
        },
        cancelFavoritesTimer() {
            if (undefined!==this.favoritesTimer) {
                clearTimeout(this.favoritesTimer);
                this.favoritesTimer = undefined;
            }
        }
    },
    created: function() {
        this.subscribeAll = false;
        this.connectToCometD();
    },
    mounted: function() {
        bus.$on('reconnect', function() {
            this.connectToCometD();
        }.bind(this));
        bus.$on('refreshStatus', function(id) {
            var player = id ? id : (this.$store.state.player ? this.$store.state.player.id : undefined);
            if (player) {
                this.updatePlayer(player);
            }
        }.bind(this));
        bus.$on('refreshServerStatus', function() {
            this.refreshServerStatus();
        }.bind(this));
        bus.$on('refreshFavorites', function() {
            this.updateFavorites();
        }.bind(this));
        bus.$on('playerCommand', function(command) {
            if (this.$store.state.player) {
                lmsCommand(this.$store.state.player.id, command).then(({data}) => {
                    this.updateCurrentPlayer();
                });
            }
        }.bind(this));
        bus.$on('updatePlayer', function(id) {
            this.updatePlayer(id);
        }.bind(this));
        bus.$on('removeFromQueue', function(indexes) {
            if (this.$store.state.player) {
                this.removeFromQueue(indexes);
            }
        }.bind(this));
        bus.$on('moveQueueItems', function(indexes, to) {
            if (this.$store.state.player) {
                this.moveQueueItems(indexes, to, 0, 0);
            }
        }.bind(this));
        bus.$on('doAllList', function(ids, command, section) {
            if (this.$store.state.player) {
                this.doAllList(ids, command, section);
            }
        }.bind(this));
        bus.$on('power', function(state) {
            lmsCommand(this.$store.state.player.id, ["power", state]).then(({data}) => {
                this.updateCurrentPlayer();
            });
        }.bind(this));
        bus.$on('adjustVolume', function(inc) {
            if (this.$store.state.player) {
                lmsCommand(this.$store.state.player.id, ["mixer", "volume", adjustVolume(this.volume, inc)]).then(({data}) => {
                    this.updateCurrentPlayer();
                });
            }
        }.bind(this));
        bus.$on('subscribeAll', function(all) {
            if (all==this.subscribeAll) {
                return;
            }
            this.subscribeAll = all;
            if (all) {
                this.updateCurrentPlayer();
            }
            for (var i=0, len=this.$store.state.players.length; i<len; ++i) {
                if (all && this.$store.state.players[i].id!=this.$store.state.player.id) {
                    this.subscribe(this.$store.state.players[i].id);
                } else if (!all && this.$store.state.players[i].id!=this.$store.state.player.id) {
                    this.unsubscribe(this.$store.state.players[i].id);
                }
            }
        }.bind(this));

        /* Add an event handler to be called when visibiity changes - so that we can immediately refresh status */
        if (IS_MOBILE) {
            var prop = getHiddenProp();
            if (prop) {
                document.addEventListener(prop.replace(/[H|h]idden/,'') + 'visibilitychange', visibilityChanged);
            }
        }
    },
    beforeDestroy() {
        this.cancelServerStatusTimer();
        this.cancelPlayerStatusTimer();
        this.cancelFavoritesTimer();
    },
    watch: {
        '$store.state.player': function (newVal) {
            bus.$emit("playerChanged");
            this.playerChanged()
        }
    }
});
