/**
 * LMS-Material
 *
 * Copyright (c) 2018 Craig Drummond <craig.p.drummond@gmail.com>
 * MIT license.
 */

Vue.component('lms-manage-players', {
    template: `
<v-dialog v-model="show" scrollable fullscreen>
 <v-card>
  <v-card-title class="settings-title">
   <v-toolbar color="primary" dark app class="lms-toolbar">
    <v-btn flat icon @click.native="close"><v-icon>arrow_back</b-icon></v-btn>
    <v-toolbar-title>{{i18n('Manage Players')}}</v-toolbar-title>
   </v-toolbar>
  </v-card-title>

  <v-card-text class="pmgr-card-text">
   <v-container grid-list-md class="pmgr-container">
    <v-layout row wrap>
     <template v-for="(player, index) in players">
      <v-flex xs12>
       <v-list class="pmgr-playerlist">
        <v-list-tile>
         <v-list-tile-avatar v-if="player.image" :tile="true">
          <img :src="player.image">
         </v-list-tile-avatar>
         <v-list-tile-content>
          <v-list-tile-title  style="cursor:pointer" @click="setActive(player.id)"><v-icon small class="lms-small-menu-icon">{{currentPlayer && currentPlayer.id==player.id ? 'radio_button_checked' : 'radio_button_unchecked'}}</v-icon>&nbsp;{{player.name}}</v-list-tile-title>
          <v-list-tile-sub-title>{{player.track}}</v-list-tile-sub-title>
         </v-list-tile-content>
         <v-list-tile-action v-if="player.playIcon" class="pmgr-btn" @click="prevTrack(index)">
          <v-btn icon><v-icon>skip_previous</v-icon></v-btn>
         </v-list-tile-action>
         <v-list-tile-action v-if="player.playIcon" class="pmgr-btn" @click="playPause(index)">
           <v-btn icon><v-icon>{{player.playIcon}}</v-icon></v-btn>
         </v-list-tile-action>
         <v-list-tile-action v-if="player.playIcon" class="pmgr-btn" @click="nextTrack(index)">
          <v-btn icon><v-icon>skip_next</v-icon></v-btn>
          </v-list-tile-action>
         <v-list-tile-action class="pmgr-btn" :title="i18n('Synchronise')" @click="bus.$emit('synchronise', player)">
          <v-btn icon><v-icon>{{player.synced ? 'link' : 'link_off'}}</v-icon></v-btn>
         </v-list-tile-action>
        </v-list-tile>
       </v-list>
      </v-flex xs12>
       <v-flex xs12>
       <v-layout>
        <v-btn flat icon @click.stop="volumeDown(index)" class="pmgr-btn"><v-icon>volume_down</v-icon></v-btn>
        <v-slider @change="volumeChanged(index)" step="1" v-model="player.volume" class="pmgr-vol-slider"></v-slider>
        <v-btn flat icon @click.stop="volumeUp(index)" class="pmgr-btn"><v-icon>volume_up</v-icon></v-btn>
        <p class="pmgr-vol">{{player.volume}} %</p>
        <v-btn flat icon @click.stop="togglePower(index)" class="pmgr-btn" v-bind:class="{'dimmed': !player.ison}"><v-icon>power_settings_new</v-icon></v-btn>
       </v-layout>
      </v-flex>
      <v-flex xs12 v-if="index+1<players.length && players[index+1].isgroup && !players[index].isgroup" class="pmgr-grp-title ellipsis">{{i18n('Group Players')}}</v-flex>
     </template>
    </v-layout>
   </v-container>
  </v-card-text>
 </v-card>
 </v-dialog>
`,
    props: [],
    data() {
        return {
            show: false,
            players: []
        }
    },
    mounted() {
        bus.$on('toolbarAction', function(act) {
            if (act==TB_MANAGE_PLAYERS.id) {
                bus.$emit('dialog', 'manage-players', true);
                this.players = [];
                this.$store.state.players.forEach(i => {
                    i.track="...";
                    this.players.push(i);
                });
                
                this.updateAll();
                this.timer = setInterval(function () {
                    this.updateAll();
                }.bind(this), 2000);
                this.show = true;
            }
        }.bind(this));

        bus.$on('closeDialog', function() {
            if (this.show) {
                this.close();
            }
        }.bind(this));

        bus.$on('syncChanged', function() {
            this.updateAll();
        }.bind(this));
    },
    methods: {
        close() {
            this.show=false;
            if (this.timer) {
                clearInterval(this.timer);
                this.timer = undefined;
            }
            bus.$emit('dialog', 'manage-players', false);
        },
        i18n(str) {
            if (this.show) {
                return i18n(str);
            } else {
                return str;
            }
        },
        volumeDown(index) {
            if (!this.show) {
                return;
            }
            if (this.players[index].volume<=5) {
                this.setVolume(index, 0);
            } else {
                this.setVolume(index, Math.floor((this.players[index].volume-5)/5)*5);
            }
        },
        volumeUp(index) {
            if (!this.show) {
                return;
            }
            // Always send volume up, even if at 100% already. Some users trap LMS
            // volume commands and forward on
            this.setVolume(index, Math.floor((this.players[index].volume+5)/5)*5);
        },
        setVolume(index, vol) {
            if (!this.show) {
                return;
            }
            lmsCommand(this.players[index].id, ["mixer", "volume", vol]).then(({data}) => {
                this.players[index].volume = vol;
            });
        },
        volumeChanged(index) {
            this.setVolume(index, this.players[index].volume);
        },
        togglePower(index) {
            if (!this.show) {
                return;
            }
            lmsCommand(this.players[index].id, ["power", this.players[index].ison ? "0" : "1"]).then(({data}) => {
                updatePlayer(index);
            });
        },
        playPause(index) {
            if (!this.show) {
                return;
            }
            lmsCommand(this.players[index].id, this.players[index].isplaying ? ['pause', '1'] : ['play']).then(({data}) => {
                updatePlayer(index);
            });
        },
        prevTrack(index) {
            if (!this.show) {
                return;
            }
            lmsCommand(this.players[index].id, ['button', 'jump_rew']).then(({data}) => {
                updatePlayer(index);
            });
        },
        nextTrack(index) {
            if (!this.show) {
                return;
            }
            lmsCommand(this.players[index].id, ['playlist', 'index', '+1']).then(({data}) => {
                updatePlayer(index);
            });
        },
        setActive(id) {
            if (id != this.$store.state.player.id) {
                this.$store.commit('setPlayer', id);
            }
        },
        updateAll() {
            for (var i=0; i<this.players.length; ++i) {
                if (!this.players[i].updating && (undefined==this.players[i].lastUpdate || ((new Date())-this.players[i].lastUpdate)>500)) {
                    this.updatePlayer(i);
                }
            }
        },
        updatePlayer(i) {
            this.players[i].updating=true;
            lmsCommand(this.players[i].id, ["status", "-", 1, "tags:adclK"]).then(({data}) => {
                this.players[i].updating=false;
                this.players[i].ison = 1==data.result.power;
                this.players[i].isplaying = data.result.mode === "play" && !data.result.waitingToPlay;
                this.players[i].volume = data.result["mixer volume"] ? data.result["mixer volume"] : 0;
                this.players[i].synced = undefined!==data.result.sync_master || undefined!==data.result.sync_slaves;
                if (data.result.playlist_loop && data.result.playlist_loop.length>0) {
                    this.players[i].playIcon = this.players[i].isplaying ? "pause_circle_outline" : "play_circle_outline";
                    if (data.result.playlist_loop[0].title) {
                        if (data.result.playlist_loop[0].artist) {
                            this.players[i].track=data.result.playlist_loop[0].title+" - "+data.result.playlist_loop[0].artist;
                        } else {
                            this.players[i].track=data.result.playlist_loop[0].title;
                        }
                    } else if (data.result.playlist_loop[0].artist) {
                        this.players[i].track=data.result.playlist_loop[0].artist;
                    } else {
                        this.players[i].track=i18n("Unknown");
                    }

                    this.players[i].image = undefined;
                    if (data.result.playlist_loop[0].artwork_url) {
                        this.players[i].image=resolveImage(null, data.result.playlist_loop[0].artwork_url);
                    }
                    if (undefined==this.players[i].image && data.result.playlist_loop[0].coverid) {
                        this.players[i].image=lmsServerAddress+"/music/"+data.result.playlist_loop[0].coverid+"/cover.jpg";
                    }
                    if (undefined==this.players[i].image) {
                        this.players[i].image=lmsServerAddress+"/music/current/cover.jpg?player=" + this.players[i].id;
                    }
                } else {
                    this.players[i].image = resolveImage("music/0/cover_50x50");
                    this.players[i].track = i18n('Nothing playing');
                    this.players[i].playIcon = undefined;
                }
            
                this.players[i].lastUpdate = new Date();
                // Cause view to update
                this.$set(this.players, i, this.players[i]);
            }).catch(err => {
                window.console.error(err);
                this.players[i].updating=false;
            });
        }
    },
    computed: {
        currentPlayer() {
            return this.$store.state.player
        }
    },
    beforeDestroy() {
        if (undefined!==this.timer) {
            clearInterval(this.timer);
            this.timer = undefined;
        }
    }
})

