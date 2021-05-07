/**
 * LMS-Material
 *
 * Copyright (c) 2018-2021 Craig Drummond <craig.p.drummond@gmail.com>
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
<v-sheet v-model="show" v-if="show" elevation="5" class="vol-sheet group-vol">
 <v-container grid-list-md text-xs-center id="gv-container">
  <v-layout row wrap>
   <div v-for="(player, index) in players" style="width:100%" :key="player.id" v-bind:class="{'active-player':currentPlayer && currentPlayer.id === player.id}" :id="currentPlayer && currentPlayer.id === player.id ? 'gv-active' : ('gv-'+index)">
    <v-flex v-if="VOL_HIDDEN!=player.dvc" xs12 style="height:8px"></v-flex>
    <v-flex v-if="VOL_HIDDEN!=player.dvc" xs12 class="vol-label link-item" v-bind:class="{'pulse':0==player.volume && player.isplaying}" @click.middle="toggleMute(player)" v-longpress="toggleMuteLabel" :id="index+'-grpvol-label'">
     {{player.name}}{{player.volume|displayVolume(player.dvc)}}
    </v-flex>
    <v-flex v-if="VOL_HIDDEN!=player.dvc" xs12 style="height:16px"></v-flex>
    <v-flex v-if="VOL_HIDDEN!=player.dvc" xs12>
     <v-layout>
      <v-btn flat icon class="vol-btn vol-left" @click="adjustVolume(player, false)"><v-icon>{{player.muted ? 'volume_off' : 'volume_down'}}</v-icon></v-btn>
      <v-slider :disabled="VOL_FIXED==player.dvc" @change="volumeChanged(player)" @wheel.native="volWheel(player, $event)"  step="1" v-model="player.volume" class="vol-slider" v-bind:class="{'dimmed': !player.ison}"></v-slider>
      <v-btn flat icon @click="adjustVolume(player, true)" class="vol-btn vol-right"><v-icon>{{player.muted ? 'volume_off' : 'volume_up'}}</v-icon></v-btn>
     </v-layout>
    </v-flex>
    <v-flex v-if="VOL_HIDDEN!=player.dvc" xs12 style="height:16px"></v-flex>
   </div>
  </v-layout>
 </v-container>
 <div class="padding"></div>
 <v-card-actions>
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
                 players: []
               }
    },
    mounted() {
        this.closeTimer = undefined;
        bus.$on('groupvolume.open', function(playerStatus, scrollCurrent) {
            if (this.show) {
                this.close();
                return;
            }
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
    },
    beforeDestroy() {
        this.cancelCloseTimer();
    },
    methods: {
        close() {
            this.show=false;
            this.showing=false;
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
            this.players[idx].dvc = player.dvc;
            this.players[idx].muted = player.muted;
            this.players[idx].volume = player.volume;
            this.players[idx].isplaying = player.isplaying;
        },
        adjustVolume(player, inc) {
            if (!this.show || this.$store.state.visibleMenus.size>0) {
                return;
            }
            this.resetCloseTimer();
            if (player.muted) {
                this.toggleMute(player);
            } else {
                lmsCommand(player.id, ["mixer", "volume", (inc ? "+" : "-")+lmsOptions.volumeStep]).then(({data}) => {
                    this.refreshAll();
                });
            }
        },
        volumeChanged(player) {
            this.setVolume(player, player.volume);
        },
        setVolume(player, vol) {
            if (!this.show) {
                return;
            }
            this.resetCloseTimer();
            lmsCommand(player.id, ["mixer", "volume", vol]).then(({data}) => {
                player.volume = vol;
                player.muted = vol<0;
                this.refreshAll();
            });
        },
        volWheel(player, event) {
            if (event.deltaY<0) {
                this.adjustVolume(player, true);
            } else if (event.deltaY>0) {
                this.adjustVolume(player, false);
            }
        },
        toggleMute(player) {
            this.resetCloseTimer();
            lmsCommand(player.id, ['mixer', 'muting', player.muted ? 0 : 1]).then(({data}) => {
                this.refreshAll();
                // Status seems to take while to update, so check again 1/2 second later...
                setTimeout(function () {
                    this.refreshAll();
                }.bind(this), 500);
            });
        },
        toggleMuteLabel(longPress, el) {
            let idx = parseInt(el.id.split("-")[0]);
            if (idx>=0 && idx<=this.players.length) {
                let player = this.players[idx];
                if (longPress || player.muted) {
                    this.toggleMute(player);
                }
            }
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
                this.show = false;
            }.bind(this), LMS_VOLUME_CLOSE_TIMEOUT);
        }
    },
    watch: {
        'show': function(val) {
            this.$store.commit('dialogOpen', {name:'groupvolume', shown:val});
            this.resetCloseTimer();
            bus.$emit('subscribeAll', val);
        }
    },
    computed: {
        currentPlayer () {
            return this.$store.state.player
        }
    },
    filters: {
        displayVolume: function (value, dvc) {
            return VOL_FIXED!=dvc ? ': ' +value+'%' : '';
        },
    }
})
