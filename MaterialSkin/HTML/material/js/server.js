/*
 * LMS-Material
 *
 * Copyright (c) 2018 Craig Drummond <craig.p.drummond@gmail.com>
 * MIT license.
 */

var lmsServerAddress = "";

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
    //console.log("CALL", args);
    return axios(args);
}

function lmsList(playerid, command, params, start, batchSize) {
    var cmdParams = command.slice();
    cmdParams = [].concat(cmdParams, [start, start+(undefined===batchSize ? LMS_BATCH_SIZE : batchSize)]);
    if (params && params.length>0) {
        cmdParams = [].concat(cmdParams, params);
    }
    return lmsCommand(playerid, cmdParams)   
}

var lmsServer = Vue.component('lms-server', {
    template: `<div/>`,
    data() {
        return {
        };
    },
    methods: {
        scheduleNextStatusUpdate: function(nextInterval) {
            // Schedule next timer
            this.statusRefreshTimer = setTimeout(function () {
                this.refreshStatus();
            }.bind(this), nextInterval);
        },
        refreshServerStatus: function () {
            //console.log("Refresh");
            lmsCommand("", ["serverstatus", 0, LMS_MAX_PLAYERS]).then(({data}) => {
                if (data && data.result && data.result.players_loop) {
                    var players = [];
                    data.result.players_loop.forEach(i => {
                        players.push({ id: i.playerid,
                                       name: i.name,
                                       canpoweroff: 1===i.canpoweroff,
                                       ison: 1===i.power,
                                       isconnected: 1===i.connected,
                                       isgroup: 'group'===i.model
                                      });
                    });
                    this.$store.commit('setPlayers', players.sort(function(a, b) {
                                                                        if (a.isgroup!=b.isgroup) {
                                                                            return a.isgroup ? 1 : -1;
                                                                        }
                                                                        var nameA = a.name.toUpperCase();
                                                                        var nameB = b.name.toUpperCase();
                                                                        if (nameA < nameB) {
                                                                            return -1;
                                                                        }
                                                                        if (nameA > nameB) {
                                                                            return 1;
                                                                        }
                                                                        return 0;
                                                                   }));
                }
            }).catch(err => {
                window.console.error(err);
            });
        },
        refreshStatus: function() {
            if (undefined!==this.statusRefreshTimer) {
                clearTimeout(this.statusRefreshTimer);
            }
            var nextInterval = LMS_STATUS_REFRESH_MAX;
            if (this.$store.state.players && this.$store.state.players.length>0 && this.$store.state.player.id) {
                lmsCommand(this.$store.state.player.id, ["status", "-", 1, "tags:adclK"]).then(({data}) => {
                    var nextInterval = LMS_STATUS_REFRESH_MAX;
                    if (data && data.result) {
                        var player = {};
                        player.isOn = data.result.power === 1 ? true : false;
                        player.isPlaying = data.result.mode === "play" && !data.result.waitingToPlay;
                        
                        if (player.isOn) {
                            player.volume = data.result["mixer volume"];
                            player.isPlaying = data.result.mode === "play" && !data.result.waitingToPlay;
                            player.playlist = { shuffle: data.result["playlist shuffle"],
                                                repeat: data.result["playlist repeat"],
                                                duration: data.result["playlist duration"],
                                                name: data.result.playlist_name,
                                                current: undefined==data.result.playlist_cur_index ? -1 : data.result.playlist_cur_index,
                                                count: data.result.playlist_tracks
                                              };
                            bus.$emit('playListDetails', player.playlist.current, undefined===data.result.playlist_timestamp ? 0 : data.result.playlist_timestamp);
                            if (data.result.playlist_loop && data.result.playlist_loop.length>0) {
                                player.current = data.result.playlist_loop[0];
                                player.current.time = data.result.time;
                                player.current.canseek = data.result.can_seek;
                            } else {
                                player.current = { canseek: 0, time: 0, duration: 0 };
                            }
                        }

                        this.$store.commit('setPlayerStatus', player);
                        if (player.isPlaying) {
                            nextInterval = LMS_STATUS_REFRESH_MIN;
                        }
                    }
                    this.scheduleNextStatusUpdate(nextInterval);
                }).catch(err => {
                    window.console.error(err);
                    this.scheduleNextStatusUpdate(LMS_STATUS_REFRESH_MIN);
                });
            } else {
                this.scheduleNextStatusUpdate(LMS_STATUS_REFRESH_MAX);
            }
        },
    },
    created: function() {    
        this.refreshServerStatus();

        setInterval(function () {
            this.refreshServerStatus();
        }.bind(this), LMS_SERVER_STATUS_REFRESH);
        this.statusRefreshTimer = setTimeout(function () {
            this.refreshStatus();
        }.bind(this), LMS_STATUS_REFRESH_MAX);
    },
    mounted: function() {
        bus.$on('refreshStatus', function() {
	        this.refreshStatus();
        }.bind(this));
        bus.$on('playerCommand', function(command) {
            lmsCommand(this.$store.state.player.id, command).then(({data}) => {
                this.refreshStatus();
            });
        }.bind(this));
        
        // All Artists + Album Artists, or just Artists?
        lmsCommand("", ["pref", "useUnifiedArtistsList", "?"]).then(({data}) => {
            if (data && data.result && data.result._p2) {
                bus.$emit('useUnifiedArtistsList', 1==data.result._p2);
            }
        });
        
        // Artist images?
        lmsCommand("", ["pref", "plugin.musicartistinfo:browseArtistPictures", "?"]).then(({data}) => {
            if (data && data.result && data.result._p2) {
                bus.$emit('artistImages', 1==data.result._p2);
            }
        });

        // Player groups plugin
        lmsCommand("", ["can", "playergroups", "items", "?"]).then(({data}) => {
            if (data && data.result && data.result._can) {
                bus.$emit('playerGroups', 1==data.result._can);
            }
        });
    },
    watch: {
        '$store.state.player': function (newVal) {
            bus.$emit("playerChanged");
            this.refreshStatus();
        }
    }
});
