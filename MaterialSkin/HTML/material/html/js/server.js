/**
 * LMS-Material
 *
 * Copyright (c) 2018-2019 Craig Drummond <craig.p.drummond@gmail.com>
 * MIT license.
 */

const PLAYER_STATUS_TAGS = "tags:cdeloyrstAKNS";

var lmsServerAddress = "";
var lmsLastScan = undefined;
var haveLocalAndroidPlayer = false;

var currentIpAddress = undefined;
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

function lmsCheckConnection() {
    var url = (lmsServerAddress.length>0 ? lmsServerAddress + "/material/" : "") + "html/css/blank.css?r"+(new Date().getTime());
    return axios({ method: "get", url: url, timeout: 1000});
}

window.addEventListener('unhandledrejection', function(event) {
    lmsCheckConnection().then((resp) => {
    }).catch(err => {
        bus.$emit('noNetwork');
    });
});

function lmsCommand(playerid, command) {
    var args = {
            method: "post",
            url: lmsServerAddress+"/jsonrpc.js",
            headers: {'Content-Type': 'text/plain'},
            data: {
                id: 1,
                method: "slim.request",
                params: [playerid, command]
           }};
    if (debug && command && command.length>0 && command[0]!="status" && command[0]!="serverstatus") {
        logJsonMessage("REQ", args.data.params);
    }
    return axios(args);
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
        return lmsCommand(playerid, cmdParams);
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
        connectToCometD() {
            this.disconnectFromCometD();
            this.cometd = new org.cometd.CometD();
            this.cometd.init({url: lmsServerAddress + '/cometd', logLevel:'off'});

            this.cometd.addListener('/meta/handshake', (message) => {
                if (eval(message).successful) {
                    this.subscribedPlayers = new Set();
                    this.cometd.subscribe('/'+this.cometd.getClientId()+'/**', (res) => { this.handleCometDMessage(res); });
                    this.cometd.subscribe('/slim/subscribe',
                                    function(res) { },
                                    {data:{response:'/'+this.cometd.getClientId()+'/slim/serverstatus', request:['', ['serverstatus', 0, 100, 'subscribe:60']]}});
                }
            });
        },
        disconnectFromCometD() {
            if (undefined!=this.cometd) {
                var subedPlayers = Array.from(this.subscribedPlayers);
                for (var i=0; i<subedPlayers.length; ++i) {
                    this.unsubscribe(subedPlayers[i]);
                }
                this.cometd.clearListeners();
                this.cometd.disconnect();
            }
            this.subscribedPlayers = new Set();
        },
        handleCometDMessage(msg) {
            if (!msg.channel || !msg.data) {
                return;
            }
            if (msg.channel.endsWith("/slim/serverstatus")) {
                this.handleServerStatus(msg.data);
            } else if (msg.channel.indexOf('/slim/playerstatus/')>0) {
                this.handlePlayerStatus(msg.channel.split('/').pop(), msg.data);
            }
        },
        handleServerStatus(data) {
            var players = [];
            if (lmsLastScan!=data.lastscan) {
                lmsLastScan = data.lastscan;
                clearListCache();
            }
            if (data.players_loop) {
                var localAndroidPlayer = false;
                data.players_loop.forEach(i => {
                    if (1==parseInt(i.connected)) {
                        players.push({ id: i.playerid,
                                       name: i.name,
                                       canpoweroff: 1==parseInt(i.canpoweroff),
                                       ison: 1==parseInt(i.power),
                                       isconnected: 1==parseInt(i.connected),
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
                        for (var i=0; i<players.length; ++i) {
                            this.subscribe(players[i].id);
                        }
                    } else if (this.$store.state.player && this.$store.state.player.id) {
                        this.subscribe(this.$store.state.player.id);
                    }
                }
            }
        },
        handlePlayerStatus(playerId, data) {
            var player = { ison: parseInt(data.power),
                           isplaying: data.mode === "play" && !data.waitingToPlay,
                           volume: -1,
                           playlist: { shuffle:0, repeat: 0, duration:0, name:'', current: -1, count:0, timestamp:0},
                           current: { canseek: 0, time: 0, duration: 0 },
                           will_sleep_in: data.will_sleep_in,
                           synced: data.sync_master || data.sync_slaves,
                           issyncmaster: data.sync_master == playerId,
                           syncmaster: data.sync_master,
                           id: playerId,
                           name: data.player_name
                         };

            player.volume = undefined==data["mixer volume"] ? 0.0 : Math.round(parseFloat(data["mixer volume"]));
            // Store volume, so that it can be accessed in 'adjustVolume' handler

            if (player.current) {
                this.volume = player.volume;
            }
            player.playlist = { shuffle: parseInt(data["playlist shuffle"]),
                                repeat: parseInt(data["playlist repeat"]),
                                duration: undefined==data["playlist duration"] ? undefined : parseFloat(data["playlist duration"]),
                                name: data.playlist_name,
                                current: undefined==data.playlist_cur_index ? -1 : parseInt(data.playlist_cur_index),
                                count: parseInt(data.playlist_tracks),
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

            if (player.current) {
                bus.$emit('playerStatus', player);
            } else {
                bus.$emit('otherPlayerStatus', player);
            }
        },
        updateCurrentPlayer() {
            if (this.$store.state.player) {
                var id = this.$store.state.player.id;
                lmsCommand(id, ["status", "-", 1, PLAYER_STATUS_TAGS]).then(({data}) => {
                    if (data && data.result) {
                        this.handlePlayerStatus(id, data.result);
                    }
                });
            }
        },
        subscribe(id) {
            if (!this.subscribedPlayers.has(id)) {
                this.cometd.subscribe('/slim/subscribe', function(res) { },
                    {data:{response:'/'+this.cometd.getClientId()+'/slim/playerstatus/'+id, request:[id, ["status", "-", 1, PLAYER_STATUS_TAGS, "subscribe:60"]]}});
                this.subscribedPlayers.add(id);
            }
        },
        unsubscribe(id) {
            if (this.subscribedPlayers.has(id)) {
                this.cometd.subscribe('/slim/subscribe', function(res) { },
                    {data:{response:'/'+this.cometd.getClientId()+'/slim/playerstatus/'+id, request:[id, ["status", "-", 1, PLAYER_STATUS_TAGS, "subscribe:"]]}});
                this.subscribedPlayers.delete(id);
            }
        },
        playerChanged() {
            if (this.$store.state.player && !this.subscribedPlayers.has(this.$store.state.player.id)) {
                if (!this.subscribeAll) {
                    // If not subscribing to all, remove other subscriptions...
                    var subedPlayers = Array.from(this.subscribedPlayers);
                    for (var i=0; i<subedPlayers.length; ++i) {
                        this.unsubscribe(subedPlayers[i]);
                    }
                }
                this.subscribe(this.$store.state.player.id);
            } else {
                this.updateCurrentPlayer();
            }
        }
    },
    created: function() {
        this.subscribeAll = false;
        this.connectToCometD();
    },
    mounted: function() {
        bus.$on('refreshStatus', function() {
            this.updateCurrentPlayer();
        }.bind(this));
        bus.$on('playerCommand', function(command) {
            if (this.$store.state.player) {
                lmsCommand(this.$store.state.player.id, command);
            }
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
            lmsCommand(this.$store.state.player.id, ["power", state]);
        }.bind(this));
        bus.$on('networkReconnected', function() {
            this.connectToCometD();
        }.bind(this));
        bus.$on('adjustVolume', function(inc) {
            if (this.$store.state.player) {
                lmsCommand(this.$store.state.player.id, ["mixer", "volume", adjustVolume(this.volume, inc)]);
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
            for (var i=0; i<this.$store.state.players.length; ++i) {
                if (all && this.$store.state.players[i].id!=this.$store.state.player.id) {
                    this.subscribe(this.$store.state.players[i].id);
                } else if (!all && this.$store.state.players[i].id!=this.$store.state.player.id) {
                    this.unsubscribe(this.$store.state.players[i].id);
                }
            }
        }.bind(this));
    },
    watch: {
        '$store.state.player': function (newVal) {
            bus.$emit("playerChanged");
            this.playerChanged()
        }
    }
});
