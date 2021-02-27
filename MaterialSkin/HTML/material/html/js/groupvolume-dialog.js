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
<v-sheet v-model="show" v-if="show" elevation="5" class="vol-sheet">
 <v-container grid-list-md text-xs-center>
  <v-layout row wrap>
   <div v-for="(player, index) in players" style="width:100%" :key="player.id" v-bind:class="{'active-player':currentPlayer && currentPlayer.id === player.id}">
    <v-flex xs12 style="height:8px"></v-flex>
    <v-flex xs12 class="vol-label link-item" @click.middle="toggleMute(player)" v-longpress="toggleMuteLabel" :id="index+'-grpvol-label'">
     {{player.name}}{{player.volume|displayVolume(player.dvc)}}
    </v-flex>
    <v-flex xs12 style="height:16px"></v-flex>
    <v-flex xs12>
     <v-layout>
      <v-btn flat icon class="vol-btn vol-left" @click="adjustVolume(player, false)"><v-icon>{{player.muted ? 'volume_off' : 'volume_down'}}</v-icon></v-btn>
      <v-slider :disabled="!player.dvc" @change="volumeChanged(player)" step="1" v-model="player.volume" class="vol-slider" v-bind:class="{'dimmed': !player.ison}"></v-slider>
      <v-btn flat icon @click="adjustVolume(player, true)" class="vol-btn vol-right"><v-icon>{{player.muted ? 'volume_off' : 'volume_up'}}</v-icon></v-btn>
     </v-layout>
    </v-flex>
    <v-flex xs12 style="height:16px"></v-flex>
   </div>
   <v-flex xs12 class="padding"></v-flex>
  </v-layout>
 </v-container>
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
                 players: []
               }
    },
    mounted() {
        this.closeTimer = undefined;
        bus.$on('groupvolume.open', function(playerStatus) {
            if (this.show) {
                this.close();
                return;
            }
            var pMap = {};
            for (var p=0, len=this.$store.state.players.length; p<len; ++p) {
                pMap[this.$store.state.players[p].id]={name: this.$store.state.players[p].name, isgroup: this.$store.state.players[p].isgroup};
            }
            this.players = [{id: playerStatus.syncmaster, master:true, name:pMap[playerStatus.syncmaster].name, isgroup:pMap[playerStatus.syncmaster].isgroup, 
                             volume:undefined, dvc:true, muted:false}];
            if (this.$store.state.player.id==playerStatus.syncmaster) {
                this.players[0].volume = playerStatus.volume;
            }
            for (var p=0, len=playerStatus.syncslaves.length; p<len; ++p) {
                this.players.push({id: playerStatus.syncslaves[p], master:false, name:pMap[playerStatus.syncslaves[p]].name, isgroup:pMap[playerStatus.syncslaves[p]].isgroup,
                                   volume:undefined, dvc:true, muted:false});
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
        },
        adjustVolume(player, inc) {
            if (!this.show || this.$store.state.visibleMenus.size>0) {
                return;
            }
            if (player.muted) {
                this.toggleMute(player);
            } else {
                lmsCommand(player.id, ["mixer", "volume", (inc ? "+" : "-")+lmsOptions.volumeStep]).then(({data}) => {
                    this.refreshPlayer(player);
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
            lmsCommand(player.id, ["mixer", "volume", vol]).then(({data}) => {
                player.volume = vol;
                player.muted = vol<0;
            });
        },
        toggleMute(player) {
            lmsCommand(player.id, ['mixer', 'muting', player.muted ? 0 : 1]).then(({data}) => {
                this.refreshPlayer(player);
                // Status seems to take while to update, so chaeck again 1/2 second later...
                setTimeout(function () {
                    this.refreshPlayer(player);
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
            return dvc ? ': ' +value+'%' : '';
        },
    }
})
