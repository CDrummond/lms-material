/**
 * LMS-Material
 *
 * Copyright (c) 2018-2023 Craig Drummond <craig.p.drummond@gmail.com>
 * MIT license.
 */
'use strict';

function grpVolSort(a, b) {
    if (a.isgroup!=b.isgroup) {
        return a.isgroup ? -1 : 1;
    }
    var nameA = a.name.toLowerCase();
    var nameB = b.name.toLowerCase();
    if (nameA < nameB) {
        return -1;
    }
    if (nameA > nameB) {
        return 1;
    }
    return 0;
}

Vue.component('lms-groupvolume', {
    template: `
<v-sheet v-model="show" v-if="show" elevation="5" class="vol-sheet group-vol noselect">
 <v-container grid-list-md text-xs-center id="gv-container">
  <v-layout row wrap>
   <div v-for="(player, index) in players" style="width:100%" :key="player.id" v-bind:class="{'active-player':currentPlayer && currentPlayer.id === player.id}" :id="currentPlayer && currentPlayer.id === player.id ? 'gv-active' : ('gv-'+index)">
    <v-flex :disabled="VOL_HIDDEN==player.dvc" xs12 style="height:8px"></v-flex>
    <volume-control :value="player.volume" :muted="player.muted" :playing="player.isplaying" :dvc="player.dvc" :layout="0" :name="player.name" :id="player.id" @inc="volumeUp" @dec="volumeDown" @changed="setVolume" @moving="movingSlider" @toggleMute="toggleMute"></volume-control>
    <v-flex xs12 style="height:16px"></v-flex>
   </div>
  </v-layout>
 </v-container>
 <div class="padding"></div>
 <v-card-actions>
  <v-btn flat icon @click="sync=!sync;resetCloseTimer()" :title="sync ? i18n('Synchronize volume changes') : i18n('Change volumes independently')"><v-icon>{{sync ? 'link' : 'link_off'}}</v-icon></v-btn>
  <v-spacer></v-spacer>
  <v-btn flat @click.native="show = false">{{i18n('Close')}}</v-btn>
 </v-card-actions>
</v-sheet>
    `,
    props: [],
    data() {
        return { 
                 show: false,
                 playing: false,
                 sync: false,
                 players: [],
               }
    },
    mounted() {
        this.closeTimer = undefined;
        bus.$on('groupvolume.open', function(playerStatus, scrollCurrent) {
            if (queryParams.party || queryParams.single) {
                return;
            }
            if (this.show) {
                this.close();
                return;
            }
            this.sync = getLocalStorageBool('groupVolSync', this.sync);
            var pMap = {};
            for (var p=0, len=this.$store.state.players.length; p<len; ++p) {
                pMap[this.$store.state.players[p].id]={name: this.$store.state.players[p].name, isgroup: this.$store.state.players[p].isgroup};
            }
            this.players = [{id: playerStatus.syncmaster, master:true, name:pMap[playerStatus.syncmaster].name, isgroup:pMap[playerStatus.syncmaster].isgroup, 
                             volume:undefined, dvc:VOL_STD, muted:false}];
            if (this.$store.state.player.id==playerStatus.syncmaster) {
                this.players[0].volume = playerStatus.volume;
            }
            for (var p=0, len=playerStatus.syncslaves.length; p<len; ++p) {
                if (pMap[playerStatus.syncslaves[p]]==undefined) {
                    continue;
                }
                this.players.push({id: playerStatus.syncslaves[p], master:false, name:pMap[playerStatus.syncslaves[p]].name, isgroup:pMap[playerStatus.syncslaves[p]].isgroup,
                                   volume:undefined, dvc:VOL_STD, muted:false, isplaying:false});
                if (this.$store.state.player.id==playerStatus.syncslaves[p]) {
                    this.players[this.players.length-1].volume = playerStatus.volume;
                }
            }
            this.players.sort(grpVolSort);
            this.playerMap={};
            for (var p=0, len=this.players.length; p<len; ++p) {
                this.playerMap[this.players[p].id]=p;
                this.refreshPlayer(this.players[p]);
            }

            if (scrollCurrent) {
                // Scroll current player's volume into view
                var scrollChecks = 0;
                var scrollInterval = setInterval(function() {
                    var current = document.getElementById('gv-active');
                    if (undefined!=current) {
                        document.getElementById('gv-container').scrollTop = current.offsetTop;
                        clearInterval(scrollInterval);
                    } else if (scrollChecks<50) {
                        scrollChecks++;
                    } else {
                        clearInterval(scrollInterval);
                    }
                }, 10);
            }
            this.show=true;
        }.bind(this));
        bus.$on('noPlayers', function() {
            this.close();
        }.bind(this));
        bus.$on('esc', function() {
            if (this.$store.state.activeDialog == 'groupvolume') {
                this.close();
            }
        }.bind(this));
        bus.$on('dialogOpen', function(name, open) {
            if (open && name!='groupvolume') {
                this.close();
            }
        }.bind(this));
        bus.$on('menuOpen', function() {
            this.close();
        }.bind(this));
        bus.$on('playerStatus', function(player) {
            this.updatePlayer(player);
        }.bind(this));

        bus.$on('otherPlayerStatus', function(player) {
            this.updatePlayer(player);
        }.bind(this));
        bus.$on('adjustVolume', function() {
            if (this.show) {
                this.cancelUpdateTimer();
                this.updateTimer = setTimeout(function() { this.refreshAll(); }.bind(this), 100);
            }
        }.bind(this));
    },
    beforeDestroy() {
        this.cancelCloseTimer();
    },
    methods: {
        close() {
            this.show=false;
            this.showing=false;
            setLocalStorageVal('groupVolSync', this.sync);
            this.cancelCloseTimer();
        },
        i18n(str) {
            if (this.show) {
                return i18n(str);
            } else {
                return str;
            }
        },
        refreshPlayer(player) {
            bus.$emit('refreshStatus', player.id);
        },
        refreshAll() {
            if (!this.show) {
                return;
            }
            for (var i=0, len=this.players.length; i<len; ++i) {
                this.refreshPlayer(this.players[i]);
            }
        },
        updatePlayer(player) {
            if (!this.show) {
                return;
            }
            var idx = this.playerMap[player.id];
            if (undefined==idx) {
                return;
            }
            if (this.$store.state.player && this.$store.state.player.id==player.id && !player.synced) {
                // Current player no longer is sync group? Then close dialog.
                this.show = false;
            }
            this.players[idx].dvc = player.dvc;
            this.players[idx].muted = player.muted;
            this.players[idx].volume = player.volume;
            this.players[idx].isplaying = player.isplaying;
        },
        volumeUp(id) {
            this.adjustVolume(id, true)
        },
        volumeDown(id) {
            this.adjustVolume(id, false)
        },
        movingSlider(moving) {
            if (moving) {
                this.cancelCloseTimer();
            } else {
                this.resetCloseTimer();
            }
        },
        idList() {
            let ids = [];
            for (let i=0, len=this.players.length; i<len; ++i) {
                ids.push(this.players[i].id);
            }
            return ids.join(",");
        },
        adjustVolume(id, inc) {
            if (!this.show || this.$store.state.visibleMenus.size>0) {
                return;
            }
            var idx = this.playerMap[id];
            if (undefined==idx || idx<0 || idx>=this.players.length) {
                return;
            }
            let player = this.players[idx];
            if (VOL_HIDDEN==player.dvc) {
                return;
            }
            this.resetCloseTimer();
            if (player.muted) {
                this.toggleMute(id);
            } else {
                let pid = this.sync ? "" : player.id;
                let cmd = this.sync
                            ? ["material-skin", "mixer", "cmd:adjust", "val:"+(inc ? "+" : "-")+lmsOptions.volumeStep, "players:"+this.idList()]
                            : ["mixer", "volume", (inc ? "+" : "-")+lmsOptions.volumeStep];
                lmsCommand(pid, cmd).then(({data}) => {
                    this.refreshAll();
                });
            }
        },
        setVolume(vol, id) {
            if (!this.show) {
                return;
            }
            var idx = this.playerMap[id];
            if (undefined==idx || idx<0 || idx>=this.players.length) {
                return;
            }
            let player = this.players[idx];
            if (VOL_STD!=player.dvc) {
                player.volume = 100;
                return;
            }
            this.resetCloseTimer();
            let pid = this.sync ? "" : player.id;
            let cmd = this.sync
                        ? ["material-skin", "mixer", "cmd:set", "val:"+vol, "players:"+this.idList()]
                        : ["mixer", "volume", vol];
            lmsCommand(pid, cmd).then(({data}) => {
                player.volume = vol;
                player.muted = vol<0;
                this.refreshAll();
            }).catch(err => {
                this.refreshAll();
            });
        },
        toggleMute(id) {
            var idx = this.playerMap[id];
            if (undefined==idx || idx<0 || idx>=this.players.length) {
                return;
            }
            let player = this.players[idx];
            if (VOL_STD!=player.dvc || !this.show) {
                return;
            }
            this.resetCloseTimer();
            let pid = this.sync ? "" : player.id;
            let cmd = this.sync
                        ? ["material-skin", "mixer", "cmd:mute", "val:"+(player.muted ? 0 : 1), "players:"+this.idList()]
                        : ['mixer', 'muting', player.muted ? 0 : 1];
            lmsCommand(pid, cmd).then(({data}) => {
                this.refreshAll();
                // Status seems to take while to update, so check again 1/2 second later...
                setTimeout(function () {
                    this.refreshAll();
                }.bind(this), 500);
            }).catch(err => {
                this.refreshAll();
            });
        },
        cancelCloseTimer() {
            if (undefined!==this.closeTimer) {
                clearTimeout(this.closeTimer);
                this.closeTimer = undefined;
            }
        },
        resetCloseTimer() {
            this.cancelCloseTimer();
            this.closeTimer = setTimeout(function () {
                this.close();
            }.bind(this), LMS_VOLUME_CLOSE_TIMEOUT);
        },
        cancelUpdateTimer() {
            if (undefined!==this.updateTimer) {
                clearTimeout(this.updateTimer);
                this.updateTimer = undefined;
            }
        }
    },
    watch: {
        'show': function(val) {
            this.$store.commit('dialogOpen', {name:'groupvolume', shown:val});
            this.resetCloseTimer();
            this.cancelUpdateTimer();
            bus.$emit('subscribeAll', val);
        }
    },
    computed: {
        currentPlayer () {
            return this.$store.state.player
        }
    }
})
