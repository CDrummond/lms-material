/**
 * LMS-Material
 *
 * Copyright (c) 2018-2019 Craig Drummond <craig.p.drummond@gmail.com>
 * MIT license.
 */

const PLAYER_STATUS_TAGS = "tags:cdegloyrstABKNS";
var lmsOptions = {noGenreFilter: getLocalStorageBool('noGenreFilter', false),
                  noRoleFilter: getLocalStorageBool('noRoleFilter', false)};

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

function isHidden() {
    var prop = getHiddenProp();
    return prop ? document[prop] : false;
}

var lmsIsConnected = undefined;
var lmsConnectionCheckDelay = undefined;
var lmsLastFocusOrVisibilityChange = undefined;

function visibilityOrFocusChanged() {
    lmsLastFocusOrVisibilityChange = (new Date()).getTime();

    if (document.hasFocus() || !isHidden()) {
        // 250ms after we get focus, check that we are connected, if not try to connect
        if (!lmsIsConnected) {
            if (undefined!=lmsConnectionCheckDelay) {
                clearTimeout(lmsConnectionCheckDelay);
            }
            lmsConnectionCheckDelay = setTimeout(function () {
                lmsConnectionCheckDelay = undefined;
                if (!lmsIsConnected) {
                    bus.$emit("reconnect");
                }
            }, 250);
        } else if (IS_MOBILE) { // If we become visibilty, refresh player status
            bus.$emit('refreshStatus');
        }
    }
}

var lmsListSource = undefined;
var lmsListId = 0;

function lmsCommand(playerid, command, isList) {
    var canCancel = (isList && command.length>0 && command[0]!="libraries" && command[0]!="favorites") ||
                    (!isList && command.length>1 && (command[0]=='menu' || command[1]=='items'));

    const URL = "/jsonrpc.js"
    var data = { id: 1, method: "slim.request", params: [playerid, command]};

    logJsonMessage("REQ", data.params);
    if (canCancel) {
        lmsListSource = axios.CancelToken.source();
        lmsListId++;
        return axios.post(URL+"?id="+lmsListId, data, {cancelToken: lmsListSource.token}).finally(() => {
            lmsListSource = undefined;
        });
    } else {
        return axios.post(URL, data);
    }
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
        } else {
            return new Promise(function(resolve, reject) {
                resolve({data:accumulated});
            });
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
            lmsIsConnected = undefined; // Not connected, or disconnected...
            this.cancelServerStatusTimer();
            this.subscribedPlayers = new Set();
            if (this.cometd) {
                logCometdMessage("RECONNECT");
                this.cometd.clearSubscriptions();
                this.cometd.disconnect((message) => {
                    logCometdMessage("DISCONNECTED");
                    this.cometd.handshake(); // Reconnect
                });
            } else {
                logCometdMessage("CONNECT");
                this.cometd = new org.cometd.CometD();
                this.cometd.setMaxBackoff(10000); // Max seconds between retries
                this.cometd.init({url: '/cometd', logLevel:'off'});
                this.cometd.addListener('/meta/handshake', (message) => {
                    if (eval(message).successful) {
                        logCometdMessage("ADD_SUBSCRIPTIONS");
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
                            logCometdMessage("STATUS_ERROR");
                            this.serverStatusTimer = undefined;
                            this.connectToCometD();
                        }.bind(this), 5000);
                    }
                });
            }
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
                           syncslaves: data.sync_slaves ? data.sync_slaves.split(",") : [],
                           id: playerId,
                           name: data.player_name
                         };

            if (isCurrent) {
                player.isgroup = this.$store.state.player.isgroup;
                this.isPlaying = player.isplaying;
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
        },
        checkPluginUpdates() {
            axios.get(location.protocol+'//'+location.hostname+(location.port ? ':'+location.port : '')+"/updateinfo.json?s=time"+(new Date().getTime())).then((resp) => {
                var updates = eval(resp.data);
                this.$store.commit('setPluginUpdatesAvailable', updates && updates.plugins && updates.plugins.length>0);
            }).catch(err => {
                logError(err);
            });
        },
        cancelUpdatesTimer() {
            if (undefined!==this.updatesTimer) {
                clearInterval(this.updatesTimer);
                this.updatesTimer = undefined;
            }
        },
        startUpdatesTimer() {
            this.cancelUpdatesTimer();
            setTimeout(function () {
                this.checkPluginUpdates();
                this.updatesTimer = setInterval(function () {
                    this.checkPluginUpdates();
                }.bind(this), 1000 * 60 * 30); // Check every 1/2 hour
            }.bind(this), 500);
        },
        adjustVolume(inc, steps) {
            if (this.$store.state.player) {
                if (undefined==steps) {
                    steps = 1;
                }
                var val = this.volume;
                for (var i=0; i<steps; ++i) {
                    val = adjustVolume(val, inc);
                }
                lmsCommand(this.$store.state.player.id, ["mixer", "volume", val]).then(({data}) => {
                    this.updateCurrentPlayer();
                });
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
        bus.$on('adjustVolume', function(inc, steps) {
            this.adjustVolume(inc, steps);
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

        // Add event listners for focus change, so that we can do an immediate reconect
        var prop = getHiddenProp();
        if (prop) {
            document.addEventListener(prop.replace(/[H|h]idden/,'') + 'visibilitychange', visibilityOrFocusChanged);
        }
        window.addEventListener("focus", visibilityOrFocusChanged);

        // Store connection state, so that focus handler can act accordingly
        bus.$on('networkStatus', function(connected) {
            var statusChanged = lmsIsConnected!=connected;

            // Store connection state, so that visibility handler can act accordingly
            lmsIsConnected = connected;

            if (statusChanged) {
                if (connected) {
                    this.startUpdatesTimer();
                } else {
                    this.cancelUpdatesTimer();
                }
            }

            // Force reconnect if disconnect received between .25 and 1.5s after visibility change
            if (statusChanged && !lmsIsConnected && undefined!=lmsLastFocusOrVisibilityChange) {
                var currentTime = (new Date()).getTime();
                if (currentTime > (lmsLastFocusOrVisibilityChange+250) && currentTime < (lmsLastFocusOrVisibilityChange + 1500)) {
                    this.connectToCometD();
                }
            }
        }.bind(this));

        if (!IS_MOBILE) {
            bindKey('up');
            bindKey('down');
            bindKey('space');
            bindKey('left');
            bindKey('right');
            bus.$on('keyboard', function(key) {
                if (!this.$store.state.keyboardControl || !this.$store.state.player || this.$store.state.visibleMenus.size>0 || (this.$store.state.openDialogs.length>0 && this.$store.state.openDialogs[0]!='info-dialog'))  {
                    return;
                }
                var command = undefined;
                if (key=='up') {
                    this.adjustVolume(true);
                } else if (key=='down') {
                    this.adjustVolume(false);
                } else if (key=='left') {
                    command=['button', 'jump_rew'];
                } else if (key=='right') {
                    command=['playlist', 'index', '+1'];
                } else if (key=='space') {
                    command=[this.isPlaying ? 'pause' : 'play']
                }

                if (command) {
                    lmsCommand(this.$store.state.player.id, command).then(({data}) => {
                        this.updateCurrentPlayer();
                    });
                }
            }.bind(this));
        }
    },
    beforeDestroy() {
        this.cancelServerStatusTimer();
        this.cancelPlayerStatusTimer();
        this.cancelFavoritesTimer();
        this.cancelMoveTimer();
        this.cancelUpdatesTimer();
    },
    watch: {
        '$store.state.player': function (newVal) {
            bus.$emit("playerChanged");
            this.playerChanged()
        }
    }
});
