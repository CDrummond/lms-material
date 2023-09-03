/**
 * LMS-Material
 *
 * Copyright (c) 2018-2023 Craig Drummond <craig.p.drummond@gmail.com>
 * MIT license.
 */
'use strict';

//const PLAYER_STATUS_TAGS = "tags:cdegiloqrstuyAABEIKNST";
const PLAYER_STATUS_TAGS = "tags:cdegiloqrstuyAABGIKNST";
const STATUS_UPDATE_MAX_TIME = 4000;

function updateMskLinks(str) {
    // Replace href links in notificaitons with javascript so that we can intercept
    // custom action IDs, or open new windows, etc.
    let start = str.indexOf('href="');
    if (start>0) {
        let end = str.indexOf('"', start+6);
        if (end>0) {
            let sub = str.substring(start+6, end);
            return str.substring(0, start) + 'href="javascript:handle(\'' + sub + '\')' + str.substring(end);
        }
    }
    return str;
}

function handle(link) {
    if (link.startsWith('msk:')) {
        bus.$emit('doMskNotificationAction', link.split(':')[1]);
    } else {
        window.open(link);
    }
    // This call i sused to close the prompt dialog
    bus.$emit('notificationLinkActivated');
}

function showLastNotif(text, cancelable) {
    try {
        if (cancelable) {
            showAlert(text, i18n('Cancel')).then(res => {
                lmsCommand("", ["material-skin", "send-notif", "type:alert", "msg:-"]);
            });
        } else {
            showAlert(text);
        }
    } catch(e) { // Not loaded yet??
        setTimeout(function() { showLastNotif(text, cancelable); }, 500);
    }
}

function logString(val) {
    return undefined==val ? "" : val;
}

function updateNative(status) {
    if (1==queryParams.nativeStatus) {
        try {
            NativeReceiver.updateStatus(JSON.stringify(status));
        } catch (e) {
        }
    } else if (2==queryParams.nativeStatus) {
        if (undefined==status.current) {
            console.log("MATERIAL-STATUS");
        } else {
            console.log("MATERIAL-STATUS" +
                        "\nPLAYING "+status.isplaying +
                        "\nVOLUME "+logString(status.volume) +
                        "\nCOUNT "+logString(status.playlist.count) +
                        "\nSHUFFLE "+logString(status.playlist.shuffle) +
                        "\nREPEAT "+logString(status.playlist.repeat) +
                        "\nTITLE "+logString(status.current.title) +
                        "\nARTIST "+logString(buildArtistLine(status.current, 'status', true)) +
                        "\nALBUM "+logString(buildAlbumLine(status.current, 'status', true)) +
                        "\nDURATION "+logString(status.current.duration) +
                        "\nTIME "+logString(status.current.time) +
                        "\nTRACKID "+logString(status.current.id));
        }
    }
}

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
// Every 2 seconds check time, if gap is more than 4 seconds then we were probably
// asleep - so refresh status.
var lastTime = (new Date()).getTime();

setInterval(function() {
    var currentTime = (new Date()).getTime();
    if (currentTime > (lastTime + 4000)) {
        bus.$emit('refreshStatus');
        bus.$emit('checkNotifications');
        // Hacky work-around for #589
        var isDesktopLayout = store.state.desktopLayout;
        if (IS_IOS && isDesktopLayout && currentTime >= (lastTime + 15000)) {
            bus.$emit('changeLayout', !isDesktopLayout);
            requestAnimationFrame(() => { bus.$emit('changeLayout', isDesktopLayout); });
        }
    }
    lastTime = currentTime;
}, 2000);

var lmsFavorites = new Set();
var lmsLastScan = undefined;

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
                if (undefined!=lmsIsConnected && !lmsIsConnected) {
                    bus.$emit("reconnect");
                }
            }, 250);
        } else if (IS_MOBILE) { // If we become visibile, refresh player status
            bus.$emit('refreshStatus');
        }
    }
}

function lmsCommand(playerid, command, commandId, timeout) {
    const URL = "/jsonrpc.js";
    var data = { id: undefined==commandId ? 0 : commandId, method: "slim.request", params: [playerid, command]};

    logJsonMessage("REQ", data.params);
    if (undefined!=timeout) {
        return axios.post(URL, data, { timeout: timeout});
    } else {
        return axios.post(URL, data);
    }
}

async function lmsListFragment(playerid, command, params, start, fagmentSize, batchSize, commandId, accumulated) {
    var cmdParams = command.slice();
    cmdParams = [].concat(cmdParams, [start, fagmentSize]);
    if (params && params.length>0) {
        cmdParams = [].concat(cmdParams, params);
    }
    return lmsCommand(playerid, cmdParams, commandId).then(({data}) => {
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
                return lmsListFragment(playerid, command, params, start+fagmentSize, fagmentSize, batchSize, commandId, accumulated);
            }
        } else {
            return new Promise(function(resolve, reject) {
                resolve({data:accumulated});
            });
        }
    });
}

async function lmsList(playerid, command, params, start, batchSize, cancache, commandId) {
    var count = undefined===batchSize ? LMS_BATCH_SIZE : Math.max(batchSize, 50);

    if (command.length>1 && command[0]=="custombrowse" && (command[1]=="browsejive" || command[1]=="browse") && count>999) {
        return lmsListFragment(playerid, command, params, 0, 999, count, commandId);
    }

    var cmdParams = command.slice();
    cmdParams = [].concat(cmdParams, [undefined==start ? 0 : start, count]);
    if (params && params.length>0) {
        cmdParams = [].concat(cmdParams, params);
    }
    if (cancache && canUseCache) { // canUseCache defined in utils.js
        return idbKeyval.get(cacheKey(command, params, start, batchSize)).then(val => {
            if (undefined==val) {
                return lmsCommand(playerid, cmdParams, commandId);
            }
            return new Promise(function(resolve, reject) {
                val.id=undefined==commandId ? 0 : commandId;
                resolve({data:val});
            });
        });
    } else {
        return lmsCommand(playerid, cmdParams, commandId);
    }
}

var lmsLastKeyPress = undefined;

var lmsServer = Vue.component('lms-server', {
    template: `<div/>`,
    data() {
        return {
        };
    },
    methods: {
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
        doAllList(ids, command, section, msg) {
            if (ids.length>0) {
                var id = ids.shift();
                var cmd = command.slice();
                cmd.push(id);
                lmsCommand(this.$store.state.player.id, cmd).then(({data}) => {
                    if (ids.length>0) {
                        this.doAllList(ids, command, section, msg);
                    } else {
                        bus.$emit('refreshList', section);
                        if (undefined!=msg) {
                            bus.$emit('showMessage', msg);
                        }
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
        scheduleNextServerStatus: function(timeout) {
            this.cancelServerStatusTimer();
            if (timeout>0) {
                logCometdDebug("Schedule next server status poll in: "+timeout+"ms");
                this.serverStatusTimer = setTimeout(function () {
                    this.refreshServerStatus();
                }.bind(this), timeout);
            }
        },
        reConnectToCometD() {
            if (!lmsIsConnected && this.cometd) {
                this.cometd.connectNow();
            }
        },
        connectToCometD() {
            lmsIsConnected = undefined; // Not connected, or disconnected...
            this.subscribedPlayers = new Set();
            logCometdDebug("CONNECT");
            this.cometd = new org.cometd.CometD();
            this.cometd.setMaxBackoff(10000); // Max seconds between retries
            this.cometd.init({url: '/cometd', logLevel:queryParams.debug.has('libcometd') ? 'debug' : 'off'});
            this.cometd.addListener('/meta/connect', (message) => {
                var connected = eval(message).successful;
                if (connected!=lmsIsConnected) {
                    lmsIsConnected = connected;
                    if (!connected) {
                        this.cancelConnectionFailureTimer();
                        // Delay showing red 'i' icon for 2 seconds - incase of itermittent failures
                        this.connectionFailureTimer = setTimeout(function () {
                            this.connectionFailureTimer = undefined;
                            bus.$emit("networkStatus", lmsIsConnected);
                        }.bind(this), 2000);
                    } else {
                        this.refreshServerStatus();
                        this.scheduleNextPlayerStatusUpdate(500);
                        bus.$emit("networkStatus", lmsIsConnected);
                        bus.$emit('checkNotifications');
                    }
                }
            });
            this.cometd.addListener('/meta/handshake', (message) => {
                if (eval(message).successful) {
                    logCometdDebug("ADD_SUBSCRIPTIONS");
                    this.subscribedPlayers = new Set();
                    this.cometd.subscribe('/'+this.cometd.getClientId()+'/**', (res) => { this.handleCometDMessage(res); });
                    this.cometd.subscribe('/slim/subscribe',
                                    function(res) { },
                                    {data:{response:'/'+this.cometd.getClientId()+'/slim/serverstatus', request:['', ['serverstatus', 0, LMS_MAX_PLAYERS, 'subscribe:60']]}});
                    this.cometd.subscribe('/slim/subscribe',
                                    function(res) { },
                                    {data:{response:'/'+this.cometd.getClientId()+'/slim/favorites', request:['favorites', ['changed']]}});
                    this.cometd.subscribe('/slim/subscribe',
                                    function(res) { },
                                    {data:{response:'/'+this.cometd.getClientId()+'/slim/serverprefs', request:[['prefset']]}});
                    this.cometd.subscribe('/slim/subscribe',
                                    function(res) { },
                                    {data:{response:'/'+this.cometd.getClientId()+'/slim/material-skin', request:['material-skin', ['notification']]}});
                    this.updateFavorites();
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
            } else if (msg.channel.indexOf('/slim/playerprefs/')>0) {
                this.handlePlayerPrefs(msg.channel.split('/').pop(), msg.data);
            } else if (msg.channel.endsWith('/slim/serverprefs')) {
                this.handleServerPrefs(msg.data);
            } else if (msg.channel.endsWith('/slim/material-skin')) {
                this.handleNotification(msg.data);
            } else {
                logCometdDebug("ERROR: Unexpected channel:"+msg.channel);
            }
        },
        handleServerStatus(data) {
            logCometdMessage("SERVER", data);
            var players = [];
            var otherPlayers = [];
            var ids = new Set();
            if (lmsLastScan!=data.lastscan) {
                lmsLastScan = data.lastscan;
                clearListCache();
            }

            if (undefined!=data.rescan && 1==parseInt(data.rescan)) {
                let total = undefined!=data.progresstotal ? parseInt(data.progresstotal) : undefined;
                let done = undefined!=data.progressdone ? parseInt(data.progressdone) : undefined;
                bus.$emit("scanProgress", (undefined==data.progressname ? '?' : data.progressname)+
                            (undefined!=done && undefined!=total
                                ? ' ('+done+(total>=done ? '/'+total : '')+')'
                                : ''));
                // Scan in progress, so poll every 2 seconds for updates...
                this.scheduleNextServerStatus(2000);
                this.scanInProgress = true;
            } else if (this.scanInProgress) {
                bus.$emit("scanProgress", undefined);
                this.scheduleNextServerStatus(0);
                this.scanInProgress = false;
                bus.$emit('refreshList', SECTION_NEWMUSIC);
            }

            if (data.players_loop) {
                // if ?player=x&single is passed as a query param, then we only care about that single player
                var checkPlayer = queryParams.single && undefined!=queryParams.player ? queryParams.player : undefined;
                for (var idx=0, len=data.players_loop.length; idx<len; ++idx) {
                    var i = data.players_loop[idx];
                    if (1==parseInt(i.connected) && // Only list/use connected players...
                        (undefined==checkPlayer || (checkPlayer==i.playerid || checkPlayer==i.name))) {
                        players.push({ id: i.playerid,
                                       name: i.name,
                                       canpoweroff: 1==parseInt(i.canpoweroff),
                                       ison: undefined==i.power || 1==parseInt(i.power),
                                       isgroup: 'group'===i.model,
                                       model: i.modelname,
                                       ip: i.ip,
                                       icon: mapPlayerIcon(i),
                                       link: ("squeezelite"==i.model && i.firmware && i.firmware.endsWith("-pCP")) || "squeezeesp32"==i.model
                                             ? "http://"+i.ip.split(':')[0] : undefined
                                      });
                        ids.add(i.playerid);
                    }
                }
            }
            if (!queryParams.single && !LMS_KIOSK_MODE) {
                if (data.other_players_loop) {
                    for (var idx=0, len=data.other_players_loop.length; idx<len; ++idx) {
                        var i = data.other_players_loop[idx];
                        if (!ids.has(i.playerid) && 'group'!==i.model) {
                            otherPlayers.push({id: i.playerid, name: i.name, server: i.server, serverurl: i.serverurl, icon: mapPlayerIcon(i)});
                        }
                    }
                }
                if (data.sn_players_loop) {
                    for (var idx=0, len=data.sn_players_loop.length; idx<len; ++idx) {
                        var i = data.sn_players_loop[idx];
                        if (!ids.has(i.playerid) && 'group'!==i.model) {
                            otherPlayers.push({id: i.playerid, name: i.name, server:'mysqueezebox.com', serverurl:'http://www.mysqueezebox.com', icon: mapPlayerIcon(i)});
                        }
                    }
                }
            }
            this.$store.commit('setPlayers', players.sort(playerSort));
            if (!queryParams.single) {
                this.$store.commit('setOtherPlayers', otherPlayers.sort(otherPlayerSort));
            }

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
            return otherPlayers;
        },
        handlePlayerStatus(playerId, data, forced) {
            if (forced) {
                logJsonMessage("PLAYER ("+playerId+")", data);
            } else {
                logCometdMessage("PLAYER ("+playerId+")", data);
            }
            var isCurrent = this.$store.state.player && playerId==this.$store.state.player.id;
            var dvc = 1==parseInt(data.digital_volume_control);
            var player = { ison: undefined==data.power || 1==parseInt(data.power),
                           isplaying: data.mode === "play" && !data.waitingToPlay,
                           volume: -1,
                           // If 'respectFixedVol' is 0, then we treat fixed-volume players as normal - and enable all volume controls.
                           dvc: VOL_STD==lmsOptions.respectFixedVol || dvc ? VOL_STD : VOL_HIDDEN==lmsOptions.respectFixedVol && !dvc ? VOL_HIDDEN : VOL_FIXED,
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
                player.icon = this.$store.state.player.icon;
                player.link = this.$store.state.player.link;
                player.model = this.$store.state.player.model;
                this.isPlaying = player.isplaying;
            } else {
                let found = false;
                for (var i=0, len=this.$store.state.players.length; i<len; ++i) {
                    if (this.$store.state.players[i].id == playerId) {
                        player.isgroup = this.$store.state.players[i].isgroup;
                        player.icon = this.$store.state.players[i].icon;
                        player.link = this.$store.state.players[i].link;
                        player.model = this.$store.state.players[i].model;
                        found = true;
                        break;
                    }
                }
                // Ignore status for players that we don't know about. When deleting a group player in 'Manage players' we get
                // a status message for this removed player, whcich causes it to be re-added...
                if (!found) {
                    return;
                }
            }

            player.volume = VOL_STD!=player.dvc ? 100 : undefined==data["mixer volume"] ? 0.0 : Math.round(parseFloat(data["mixer volume"]));
            player.muted = VOL_STD==player.dvc && player.volume<0;
            player.volume = Math.abs(player.volume);

            player.playlist = { shuffle: parseInt(data["playlist shuffle"]),
                                repeat: parseInt(data["playlist repeat"]),
                                duration: undefined==data["playlist duration"] ? undefined : parseFloat(data["playlist duration"]),
                                name: data.playlist_name,
                                modified: undefined==data.playlist_modified ? false : (1==parseInt(data.playlist_modified)),
                                current: undefined==data.playlist_cur_index ? -1 : parseInt(data.playlist_cur_index),
                                count: undefined==data.playlist_tracks ? 0 : parseInt(data.playlist_tracks),
                                timestamp: undefined==data.playlist_timestamp ? 0.0 : parseFloat(data.playlist_timestamp)
                              };
            if (data.playlist_loop && data.playlist_loop.length>0) {
                player.current = data.playlist_loop[0];
                splitMultiples(player.current);
                player.current.time = undefined==data.time ? undefined : "stop"==data.mode ? 0 : parseFloat(data.time);
                player.current.canseek = parseInt(data.can_seek);
                player.current.remote_title = checkRemoteTitle(player.current);
                //player.current.emblem = getEmblem(player.current.extid, player.current.url);

                // BBC iPlayer Extras streams can change duration. *But* only the duration in data seems to
                // get updated. So, if there is a duration there, use that as the current track's duration.
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

            if (player.isgroup && data.members) {
                player.members=data.members.split(',');
            }
            bus.$emit(isCurrent ? 'playerStatus' : 'otherPlayerStatus', player);
            this.$store.commit('updatePlayer', player);
            if (isCurrent) {
                updateNative(player);
                this.scheduleNextPlayerStatusUpdate(data.mode === "play"
                                                        // Playing a track
                                                        ? data.waitingToPlay
                                                            // Just starting to play?
                                                            ? 2000 // Poll every 2 seconds
                                                            // Playback has started
                                                            : (undefined!=player.current.duration && player.current.duration>0)
                                                                // Have duration
                                                                ? undefined!=player.current.time
                                                                    ? (player.current.duration-player.current.time)<=3
                                                                        ? 1000 // Near end, every second
                                                                        : (player.current.duration-player.current.time)<=5 || player.current.time<=6
                                                                            ? 2000 // Every 2 seconds (5 seconds to end, or 6 from start)
                                                                            : (player.current.duration-player.current.time)<=10
                                                                                ? 5000 // Every 5 seconds
                                                                                : 10000 // Every 10 seconds...
                                                                    : undefined
                                                                // No duration, stream?
                                                                : (undefined!=player.current.time && player.current.time<=5)
                                                                    ? 2000       // For streams, poll for the first 5 seconds
                                                                    : undefined  // Stream playing for longer than 5 seconds
                                                        // Not playing
                                                        : undefined);
            }
        },
        handlePlayerPrefs(playerId, data) {
            if (data.length<4 || data[0]!="prefset") {
                return;
            }
            var isCurrent = this.$store.state.player && playerId==this.$store.state.player.id;
            if (!isCurrent) {
                return;
            }
            logCometdMessage("PLAYERPREFS ("+playerId+")", data);
            if (data[1]=="plugin.dontstopthemusic" && data[2]=="provider") {
                bus.$emit("prefset", data[1]+":"+data[2], data[3], playerId);
            } else if (data[1]=="plugin.material-skin") {
                if (data[2]=="password") {
                    this.$store.commit('checkPassword', data[3]);
                } else {
                    let found = false;
                    for (var t=0, len=SKIN_GENRE_TAGS.length; t<len; ++t ) {
                        if (data[2]==(SKIN_GENRE_TAGS[t]+'genres')) {
                            var genres = splitString(data[3].split("\r").join("").split("\n").join(","));
                            lmsOptions[SKIN_GENRE_TAGS[t]+'Genres'] = new Set(genres);
                            setLocalStorageVal(SKIN_GENRE_TAGS[t]+"genres", data[3]);
                            found=true;
                            break;
                        }
                    }
                    if (!found) {
                        for (var i=0, len=SKIN_BOOL_OPTS.length; i<len; ++i) {
                            if (data[2]==SKIN_BOOL_OPTS[i]) {
                                lmsOptions[SKIN_BOOL_OPTS[i]] = 1 == parseInt(data[3]);
                                setLocalStorageVal(SKIN_BOOL_OPTS[i], lmsOptions[SKIN_BOOL_OPTS[i]]);
                                found=true;
                                break;
                            }
                        }
                    }
                    if (!found) {
                        for (var i=0, len=SKIN_INT_OPTS.length; i<len; ++i) {
                            if (data[2]==SKIN_INT_OPTS[i]) {
                                lmsOptions[SKIN_INT_OPTS[i]] = parseInt(data[3]);
                                setLocalStorageVal(SKIN_INT_OPTS[i], lmsOptions[SKIN_INT_OPTS[i]]);
                                found=true;
                                break;
                            }
                        }
                    }
                }
            }
        },
        getPlayerPrefs() {
            if (undefined!=this.$store.state.player) {
                bus.$emit("prefset", "plugin.dontstopthemusic:provider", 0, this.$store.state.player.id); // reset
                if (this.$store.state.dstmPlugin && this.$store.state.player) {
                    lmsCommand(this.$store.state.player.id, ["playerpref", "plugin.dontstopthemusic:provider", "?"]).then(({data}) => {
                        if (data && data.result && undefined!=data.result._p2) {
                            bus.$emit("prefset", "plugin.dontstopthemusic:provider", data.result._p2, this.$store.state.player.id);
                        }
                    });
                }
            }
        },
        handleServerPrefs(data) {
            if (data.length<4 || data[0]!="prefset") {
                return;
            }
            if (data[1]=="server" && data[2]=="useUnifiedArtistsList") {
                bus.$emit("prefset", data[1]+":"+data[2], data[3]);
            }
        },
        handleNotification(data) {
            if (data.length>=4) {
                if (data[2]=='info') {
                    if (data.length<6 || undefined==data[5] || data[5].length<1 || data[5]==this.$store.state.player.id) {
                        bus.$emit('showMessage', data[3], data.length>6 ? parseInt(data[6]) : 0);
                    }
                } else if (data[2]=='error') {
                    if (data.length<6 || undefined==data[5] || data[5].length<1 || data[5]==this.$store.state.player.id) {
                        bus.$emit('showError', undefined, data[3], data.length>6 ? parseInt(data[6]) : 0);
                    }
                } else if (data[2]=='alert') {
                    if (data.length>4 && parseInt(data[4])==1) {
                        showAlert(data[3], i18n('Cancel')).then(res => {
                            lmsCommand("", ["material-skin", "send-notif", "type:alert", "msg:-"]);
                        });
                    } else {
                        showAlert(updateMskLinks(data[3]));
                    }
                } else if (data[2]=='update') {
                    this.$store.commit('setUpdateNotif', {msg:updateMskLinks(data[3]), title:data[4]});
                } else if (data[2]=='notif' && data.length>6) {
                    this.$store.commit('setNotification', {msg:updateMskLinks(data[3]), title:data[4], id:data[5], cancelable:data.length>=7 && 1==parseInt(data[6])});
                } else if (data[2]=='internal') {
                    if (data[3]=='vlib') {
                        bus.$emit('libraryChanged');
                    }
                }
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
        parseFavouritesLoop(loop, favs, changed) {
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
                if (loop[i].items) {
                    this.parseFavouritesLoop(loop[i].items, favs, changed);
                }
            }
        },
        updateFavorites() { // Update set of favorites URLs
            lmsList("", ["favorites", "items"], ["want_url:1", "feedMode:1"]).then(({data}) => {
                logJsonMessage("RESP", data);
                if (data && data.result) {
                    var favs = new Set();
                    var changed = false;
                    if (data.result.items) {
                        this.parseFavouritesLoop(data.result.items, favs, changed);
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
            let now = new Date().getTime();
            if (this.playerStatusMessages.has(id) && (now-this.playerStatusMessages.get(id))<STATUS_UPDATE_MAX_TIME) {
                logJsonMessage("NOT UPDATING ("+id+")");
                return;
            }
            logJsonMessage("UPDATING ("+id+")");
            this.playerStatusMessages.set(id, now);
            let tags = PLAYER_STATUS_TAGS +
                         (this.$store.state.showRating ? "R" : "") +
                         (lmsOptions.showComment ? "k" : "");
            lmsCommand(id, ["status", "-", 1, tags], undefined, STATUS_UPDATE_MAX_TIME).then(({data}) => {
                this.playerStatusMessages.delete(id);
                if (data && data.result) {
                    this.handlePlayerStatus(id, data.result, true);
                }
            }).catch(err => {
                this.playerStatusMessages.delete(id);
                logJsonMessage("STATUS TIMEOUT  ("+id+")");
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
                let tags = PLAYER_STATUS_TAGS +
                         (this.$store.state.showRating ? "R" : "") +
                         (lmsOptions.showComment ? "k" : "");
                this.cometd.subscribe('/slim/subscribe', function(res) { },
                    {data:{response:'/'+this.cometd.getClientId()+'/slim/playerstatus/'+id, request:[id, ["status", "-", 1, tags, "subscribe:30"]]}});
                this.cometd.subscribe('/slim/subscribe',
                                    function(res) { },
                                    {data:{response:'/'+this.cometd.getClientId()+'/slim/playerprefs/'+id, request:[id, ['prefset']]}});
                this.subscribedPlayers.add(id);
            }
        },
        unsubscribe(id) {
            if (this.subscribedPlayers.has(id)) {
                logCometdDebug("Unsubscribe: "+id);
                this.cometd.subscribe('/slim/subscribe', function(res) { },
                    {data:{response:'/'+this.cometd.getClientId()+'/slim/playerstatus/'+id, request:[id, ["status", "-", 1, "subscribe:-"]]}});
                this.cometd.subscribe('/slim/subscribe', function(res) { },
                    {data:{response:'/'+this.cometd.getClientId()+'/slim/playerprefs/'+id, request:[id, []]}});
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
            this.getPlayerPrefs();
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
        cancelConnectionFailureTimer() {
            if (undefined!==this.connectionFailureTimer) {
                clearTimeout(this.connectionFailureTimer);
                this.connectionFailureTimer = undefined;
            }
        },
        cancelPlayerStatusTimer() {
            if (undefined!==this.playerStatusTimer) {
                clearTimeout(this.playerStatusTimer);
                this.playerStatusTimer = undefined;
            }
        },
        cancelServerStatusTimer() {
            if (undefined!==this.serverStatusTimer) {
                clearTimeout(this.serverStatusTimer);
                this.serverStatusTimer = undefined;
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
            if (!this.$store.state.unlockAll || LMS_KIOSK_MODE) {
                return;
            }
            axios.get(location.protocol+'//'+location.hostname+(location.port ? ':'+location.port : '')+"/updateinfo.json?s=time"+(new Date().getTime())).then((resp) => {
                var updates = eval(resp.data);
                var avail = new Set();
                if (updates && updates.server) {
                    avail.add("server");
                }
                if (updates && updates.plugins && updates.plugins.length>0 && (updates.plugins.length>1 || updates.plugins[0]!=null)) {
                    avail.add("plugins");
                }
                this.$store.commit('setUpdatesAvailable', avail);
            }).catch(err => {
                logError(err);
            });
            lmsCommand("", ["material-skin", "plugins-status"]).then(({data}) => {
                if (data && data.result) {
                    this.$store.commit('setRestartRequired', 1 == parseInt(data.result.needs_restart));
                }
            })
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
        adjustVolume(inc) {
            if (this.$store.state.player) {
                lmsCommand(this.$store.state.player.id, ["mixer", "volume", (inc ? "+" : "-")+lmsOptions.volumeStep]).then(({data}) => {
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
        // Hold map of <player id> -> <time of last status message>
        this.playerStatusMessages = new Map();
        this.moving=[];
        bus.$on('networkStatus', function(connected) {
            this.playerStatusMessages.clear();
            if (connected) {
                this.startUpdatesTimer();
            } else {
                this.cancelUpdatesTimer();
            }
        }.bind(this));
        bus.$on('reconnect', function() {
            this.playerStatusMessages.clear();
            this.reConnectToCometD();
        }.bind(this));
        bus.$on('lockChanged', function() {
            this.checkPluginUpdates();
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
                    if (command.length>2 && command[0]=='mixer' && command[1]=='muting') { // Muting can be slow? Check after 1/2 second
                        setTimeout(function () { this.updateCurrentPlayer(); }.bind(this), 500);
                    }
                    this.updateCurrentPlayer();
                });
            }
        }.bind(this));
        bus.$on('updatePlayer', function(id) {
            this.updatePlayer(id);
        }.bind(this));
        bus.$on('moveQueueItems', function(indexes, to) {
            if (this.$store.state.player) {
                this.moveQueueItems(indexes, to, 0, 0);
            }
        }.bind(this));
        bus.$on('movePlaylistItems', function(playlist, indexes, to) {
            this.movePlaylistItems(playlist, indexes, to, 0, 0);
        }.bind(this));
        bus.$on('doAllList', function(ids, command, section, msg) {
            if (this.$store.state.player) {
                this.doAllList(ids, command, section, msg);
            }
        }.bind(this));
        bus.$on('movePlayer', function(player) {
            let url = new URL(player.serverurl);
            lmsCommand("", ["disconnect", player.id, url.hostname]).then(({data}) => {
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
            this.adjustVolume(inc);
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
                    this.playerStatusMessages.delete(players[i]);
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

        // Set DSTM. If player is synced, then set for all others in sync group...
        bus.$on('dstm', function(player, value) {
            lmsCommand(player, ["status", "-", 1, PLAYER_STATUS_TAGS + (this.$store.state.showRating ? "R" : "")]).then(({data}) => {
                if (data && data.result) {
                    if (data.result.sync_master && data.result.sync_master!=player) {
                        lmsCommand(data.result.sync_master, ["playerpref", "plugin.dontstopthemusic:provider", value]).then(({data}) => {
                            bus.$emit("prefset", "plugin.dontstopthemusic:provider", value, data.result.sync_master);
                        });
                    }
                    if (data.result.sync_slaves) {
                        for (let i=0, loop=data.result.sync_slaves.split(","), len=loop.length; i<len; ++i) {
                            if (loop[i]!=player && loop[i]!=data.result.sync_master) {
                                lmsCommand(loop[i], ["playerpref", "plugin.dontstopthemusic:provider", value]).then(({data}) => {
                                    bus.$emit("prefset", "plugin.dontstopthemusic:provider", value, loop[i]);
                                });
                            }
                        }
                    }
                    this.handlePlayerStatus(player, data.result, true);
                }
                lmsCommand(player, ["playerpref", "plugin.dontstopthemusic:provider", value]).then(({data}) => {
                    bus.$emit("prefset", "plugin.dontstopthemusic:provider", value, player);
                });
            });
        }.bind(this));

        // Check Perl side to see if any notifications registered
        bus.$on('checkNotifications', function() {
            lmsCommand("", ["material-skin", "get-notifs"]).then(({data}) => {
                if (data && data.result) {
                    if (data.result.alertmsg) {
                        showLastNotif(updateMskLinks(data.result.alertmsg), data.result.alertcancelable);
                    }
                    if (data.result.updatemsg) {
                        this.$store.commit('setUpdateNotif', {msg:updateMskLinks(data.result.updatemsg), title:data.result.updatetitle});
                    }
                    if (data.result.notifications) {
                        let notifs = [];
                        for (let i=0, loop=data.result.notifications, len=loop.length; i<len; ++i) {
                            loop[i].msg = updateMskLinks(loop[i].msg);
                            notifs.push(loop[i]);
                        }
                        this.$store.commit('setNotifications', notifs);
                    }
                }
            });
        }.bind(this));

        bus.$on('doMskNotificationAction', function(act) {
            let customActions = getCustomActions("notifications", this.$store.state.unlockAll);
            if (undefined!=customActions) {
                for (let i=0, len=customActions.length; i<len; ++i) {
                    if (customActions[i].id==act) {
                        performCustomAction(customActions[i], this.$store.state.player);
                        break;
                    }
                }
            }
        }.bind(this));

        // Add event listners for focus change, so that we can do an immediate reconect
        var prop = getHiddenProp();
        if (prop) {
            document.addEventListener(prop.replace(/[H|h]idden/,'') + 'visibilitychange', visibilityOrFocusChanged);
        }
        window.addEventListener("focus", visibilityOrFocusChanged);

        if (!IS_MOBILE) {
            Mousetrap.addKeycodes({ // Codes from https://github.com/wesbos/keycodes/blob/gh-pages/scripts.js
                174: 'decvol',
                175: 'incvol',
                182: 'decvolfirefox',
                183: 'incvolfirefox'
            })
            bindKey('up', 'alt', true);
            bindKey('down', 'alt', true);
            bindKey('space');
            bindKey('decvol', undefined, true);
            bindKey('incvol', undefined, true);
            bindKey('decvolfirefox', undefined, true);
            bindKey('incvolfirefox', undefined, true);
            bindKey('left', 'alt', true);
            bindKey('right', 'alt', true);
            bus.$on('keyboard', function(key, modifier) {
                if (!this.$store.state.player || this.$store.state.visibleMenus.size>0 || (this.$store.state.openDialogs.length>0 && this.$store.state.openDialogs[0]!='info-dialog'))  {
                    return;
                }
                var command = undefined;
                if (undefined==modifier) {
                    if (key=='space') {
                        // Ignore 'space' if browse view is currently jumping to an item via text entry
                        if (undefined==lmsLastKeyPress || ((new Date().getTime())-lmsLastKeyPress.time)>=1000) {
                            lmsLastKeyPress = undefined;
                            command=[this.isPlaying ? 'pause' : 'play']
                        }
                    } else if (key=='incvol' || key=='incvolfirefox') {
                        this.adjustVolume(true);
                    } else if (key=='decvol' || key=='decvolfirefox') {
                        this.adjustVolume(false);
                    }
                } else if ('alt'==modifier) {
                    if (key=='up') {
                        this.adjustVolume(true);
                    } else if (key=='down') {
                        this.adjustVolume(false);
                    } else if (key=='left' && !queryParams.party) {
                        command=['button', 'jump_rew'];
                    } else if (key=='right' && !queryParams.party) {
                        command=['playlist', 'index', '+1'];
                    }
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
        this.cancelConnectionFailureTimer();
        this.cancelPlayerStatusTimer();
        this.cancelServerStatusTimer();
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
