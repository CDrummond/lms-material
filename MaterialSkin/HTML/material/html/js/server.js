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

//const CancelToken = axios.CancelToken;
//var lmsListSource = undefined;

function lmsCommand(playerid, command, isList) {
//    var canCancel = (isList && command.length>0 && command[0]!="libraries" && command[0]!="favorites") ||
//                    (!isList && command.length>1 && (command[0]=='menu' || command[1]=='items'));

    const URL = "/jsonrpc.js"
    var data = { id: 1, method: "slim.request", params: [playerid, command]};

    logJsonMessage("REQ", data.params);
//    if (canCancel) {
//        lmsListSource = CancelToken.source();
//        return axios.post(URL, data, {cancelToken: lmsListSource.token}).finally(() => {
//            lmsListSource = undefined;
//        });
//    } else {
        return axios.post(URL, data);
//    }
}

async function lmsListFragment(playerid, command, params, start, fagmentSize, batchSize, accumulated) {
    var cmdParams = command.slice();
    cmdParams = [].concat(cmdParams, [start, fagmentSize]);
    if (params && params.length>0) {
        cmdParams = [].concat(cmdParams, params);
    }
    return lmsCommand(playerid, cmdParams).then(({data}) => {
        logJsonMessage("RESP", data);
        if (data && data.result && data.result.item_loop) {
            if (undefined==accumulated) {
                accumulated = data;
            } else {
                accumulated.result.item_loop.push.apply(accumulated.result.item_loop, data.result.item_loop);
            }
            if (accumulated.result.item_loop.length>=data.result.count) {
                return new Promise(function(resolve, reject) {
                    resolve({data:accumulated});
                });
            } else {
                return lmsListFragment(playerid, command, params, start+fagmentSize, fagmentSize, batchSize, accumulated);
            }
        }
    });
}

async function lmsList(playerid, command, params, start, batchSize, cancache) {
    var count = undefined===batchSize ? LMS_BATCH_SIZE : batchSize;

    if (command.length>1 && command[0]=="custombrowse" && (command[1]=="browsejive" || command[1]=="browse") && count>999) {
        return lmsListFragment(playerid, command, params, 0, 999, count);
    }

    var cmdParams = command.slice();
    cmdParams = [].concat(cmdParams, [undefined==start ? 0 : start, count]);
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
                var command = ["playlist", "move", index<to ? index-movedBefore : index,
                                                   index>to ? to+movedAfter+(movedBefore>0 ? 1 : 0) : to];
                lmsCommand(this.$store.state.player.id, command).then(({data}) => {
                    this.moveQueueItems(indexes, to, index<to ? movedBefore+1 : movedBefore,
                                                     index>to ? movedAfter+1 : movedAfter);
                }).catch(err => {
                    logError(err, command);
                    this.updateCurrentPlayer();
                });
            } else {
                this.updateCurrentPlayer();
            }
        },
        movePlaylistItems(playlist, indexes, to, movedBefore, movedAfter) {
            if (indexes.length>0) {
                var index = indexes.shift();
                var command = ["playlists", "edit", "cmd:move", playlist, "index:"+(index<to ? index-movedBefore : index),
                               "toindex:"+(index>to ? to+movedAfter+(movedBefore>0 ? 1 : 0) : to)];
                console.log(JSON.stringify(command));
                lmsCommand(this.$store.state.player.id, command).then(({data}) => {
                    this.movePlaylistItems(playlist, indexes, to, index<to ? movedBefore+1 : movedBefore,
                                                                  index>to ? movedAfter+1 : movedAfter);
                }).catch(err => {
                    logError(err, command);
                    bus.$emit('refreshList', SECTION_PLAYLISTS);
                });
            } else {
                bus.$emit('refreshList', SECTION_PLAYLISTS);
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
                if (msg.data && msg.data.length>1 && msg.data[0]=="favorites" && msg.data[1]=="changed") {
                   this.handleFavoritesUpdate();
                }
            } else {
                logCometdDebug("ERROR: Unexpected channel:"+msg.channel);
            }
        },
        handleServerStatus(data) {
            logCometdMessage("SERVER", data);
            this.cancelServerStatusTimer();
            var players = [];
            var otherPlayers = [];
            if (lmsLastScan!=data.lastscan) {
                lmsLastScan = data.lastscan;
                clearListCache();
            }
            if (data.players_loop) {
                var localAndroidPlayer = false;
                var ids = new Set();
                for (var idx=0, len=data.players_loop.length; idx<len; ++idx) {
                    var i = data.players_loop[idx];
                    if (1==parseInt(i.connected)) { // Only list/use connected players...
                        players.push({ id: i.playerid,
                                       name: i.name,
                                       canpoweroff: 1==parseInt(i.canpoweroff),
                                       ison: undefined==i.power || 1==parseInt(i.power),
                                       isgroup: 'group'===i.model
                                      });
                        // Check if we have a local SB Player - if so, can't use MediaSession
                        if (!localAndroidPlayer && currentIpAddress && 'SB Player' ===i.modelname && i.ip.split(':')[0] == currentIpAddress) {
                            localAndroidPlayer = true;
                        }
                        ids.add(i.playerid);
                    }
                }
                if (data.other_players_loop) {
                    for (var idx=0, len=data.other_players_loop.length; idx<len; ++idx) {
                        var i = data.other_players_loop[idx];
                        if (!ids.has(i.playerid)) {
                            otherPlayers.push({id: i.playerid, name: i.name, server: i.server, serverurl: i.serverurl});
                        }
                    }
                }
                if (localAndroidPlayer != haveLocalAndroidPlayer) {
                    haveLocalAndroidPlayer = localAndroidPlayer;
                    if (haveLocalAndroidPlayer) {
                        bus.$emit('haveLocalAndroidPlayer');
                    }
                }
                this.$store.commit('setPlayers', players.sort(playerSort));
                this.$store.commit('setOtherPlayers', otherPlayers.sort(otherPlayerSort));

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
            return otherPlayers;
        },
        handlePlayerStatus(playerId, data, forced) {
            if (forced) {
                logJsonMessage("PLAYER ("+playerId+")", data);
            } else {
                logCometdMessage("PLAYER ("+playerId+")", data);
            }
            // Get status message after unsubscribe!!!
            if (!this.subscribedPlayers.has(playerId)) {
                return;
            }
            var isCurrent = this.$store.state.player && playerId==this.$store.state.player.id;
            var player = { ison: undefined==data.power || 1==parseInt(data.power),
                           isplaying: data.mode === "play" && !data.waitingToPlay,
                           volume: -1,
                           digital_volume_control: 1==parseInt(data.digital_volume_control),
                           playlist: { shuffle:0, repeat: 0, duration:0, name:'', current: -1, count:0, timestamp:0},
                           current: { canseek: 0, time: undefined, duration: undefined },
                           will_sleep_in: data.will_sleep_in,
                           synced: data.sync_master || data.sync_slaves,
                           issyncmaster: data.sync_master == playerId,
                           syncmaster: data.sync_master,
                           id: playerId,
                           name: data.player_name
                         };

            if (isCurrent) {
                player.isgroup = this.$store.state.player.isgroup;
            } else {
                for (var i=0, len=this.$store.state.players.length; i<len; ++i) {
                    if (this.$store.state.players[i].id == playerId) {
                        player.isgroup = this.$store.state.players[i].isgroup;
                    }
                }
            }

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
                if (undefined!=player.current.rating) {
                    player.current.rating=parseInt(player.current.rating);
                    if (player.current.rating<0) {
                        player.current.rating = 0;
                    } else if (player.current.rating>100) {
                        player.current.rating = 100;
                    }
                }
            }

            bus.$emit(isCurrent ? 'playerStatus' : 'otherPlayerStatus', player);
            if (isCurrent) {
                this.scheduleNextPlayerStatusUpdate(data.mode === "play"
                                                        ? data.waitingToPlay
                                                            ? 1000 // Just starting to play? Poll in 1 second
                                                            : undefined!=player.current.duration && 0!=player.current.duration
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
            lmsCommand("", ["material-skin", "favorites"]).then(({data}) => {
                if (data && data.result && data.result.favs_loop) {
                    var loop = data.result.favs_loop;
                    var favs = new Set();
                    var changed = false;
                    for (var i=0, len=loop.length; i<len; ++i) {
                        if (loop[i].url) {
                            var url = loop[i].url;
                            var lib = url.indexOf("libraryTracks.library=");
                            if (lib>0) {
                                url=url.substring(0, lib-1);
                            }
                            favs.add(url);
                            if (!changed && !lmsFavorites.has(url)) {
                               changed = true;
                            }
                        }
                    }
                    if (changed || lmsFavorites.size!=favs.size) {
                        lmsFavorites = favs;
                        bus.$emit('refreshList', SECTION_FAVORITES);
                    }
                } 
            }).catch(err => {
            });
        },
        updatePlayer(id) {
            logJsonMessage("UPDATING ("+id+")");
            lmsCommand(id, ["status", "-", 1, PLAYER_STATUS_TAGS + (this.$store.state.ratingsSupport ? "R" : "")]).then(({data}) => {
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
                    {data:{response:'/'+this.cometd.getClientId()+'/slim/playerstatus/'+id, request:[id, ["status", "-", 1, PLAYER_STATUS_TAGS + (this.$store.state.ratingsSupport ? "R" : ""), "subscribe:30"]]}});
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
        checkForMovedPlayer(id, attempts) {
            lmsCommand("", ["serverstatus", 0, LMS_MAX_PLAYERS]).then(({data}) => {
                if (data && data.result) {
                    var otherPlayers = this.handleServerStatus(data.result);
                    var found = false;
                    for (var i=0, len=otherPlayers.length; i<len && !found; ++i) {
                        if (otherPlayers[i].id==id) {
                            found = true;
                        }
                    }
                    attempts--;
                    if (!found) { // No longer in other players, so hopefully moved to this server. So, try an activate.
                        this.$store.commit('setPlayer', id);
                    } else if (attempts>=0) {
                        this.moveTimer = setTimeout(function () {
                            this.checkForMovedPlayer(id, attempts);
                        }.bind(this), 500);
                    }
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
        },
        cancelMoveTimer() {
            if (undefined!==this.moveTimer) {
                clearTimeout(this.moveTimer);
                this.moveTimer = undefined;
            }
        }
    },
    created: function() {
        this.subscribeAll = false;
        this.connectToCometD();
    },
    mounted: function() {
        this.moving=[];
        bus.$on('reconnect', function() {
            this.connectToCometD();
        }.bind(this));
        bus.$on('refreshStatus', function(id) {
            var player = id ? id : (this.$store.state.player ? this.$store.state.player.id : undefined);
            if (player) {
                this.updatePlayer(player);
            }
        }.bind(this));
        bus.$on('refreshServerStatus', function(delay) {
            this.refreshServerStatus();
            if (undefined!=delay && delay>50 && delay<10000) {
                setTimeout(function () {
                    this.refreshServerStatus();
                }.bind(this), delay);
            }
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
        bus.$on('movePlaylistItems', function(playlist, indexes, to) {
            this.movePlaylistItems(playlist, indexes, to, 0, 0);
        }.bind(this));
        bus.$on('doAllList', function(ids, command, section) {
            if (this.$store.state.player) {
                this.doAllList(ids, command, section);
            }
        }.bind(this));
        bus.$on('movePlayer', function(player) {
            lmsCommand("", ["material-skin", "moveplayer", "id:"+player.id, "serverurl:"+player.serverurl]).then(({data}) => {
                this.checkForMovedPlayer(player.id, 8);
            }).catch(err => {
                bus.$emit('showError', undefined, i18n("Failed to move '%1'", player.name));
            });
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

        bus.$on('playersRemoved', function(players) {
            if (this.subscribeAll) {
                for (var i=0, len=players.length; i<len; ++i) {
                    this.unsubscribe(players[i]);
                }
            }
        }.bind(this));
        bus.$on('playersAdded', function(players) {
            if (this.subscribeAll) {
                for (var i=0, len=players.length; i<len; ++i) {
                    this.subscribe(players[i]);
                }
            }
        }.bind(this));
    },
    beforeDestroy() {
        this.cancelServerStatusTimer();
        this.cancelPlayerStatusTimer();
        this.cancelFavoritesTimer();
        this.cancelMoveTimer();
    },
    watch: {
        '$store.state.player': function (newVal) {
            bus.$emit("playerChanged");
            this.playerChanged()
        }
    }
});
