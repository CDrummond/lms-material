/**
 * LMS-Material
 *
 * Copyright (c) 2018 Craig Drummond <craig.p.drummond@gmail.com>
 * MIT license.
 */

var PMGR_EDIT_GROUP_ACTION   = {cmd:"edit",     icon:"edit"};
var PMGR_DELETE_GROUP_ACTION = {cmd:"delete",   icon:"delete"};
var PMGR_SYNC_ACTION         = {cmd:"sync",     icon:"link"};
var PMGR_SETTINGS_ACTION     = {cmd:"settings", icon:"settings"};
var PMGR_POWER_ON_ACTION     = {cmd:"on",       icon:"power_settings_new", dimmed:true};
var PMGR_POWER_OFF_ACTION    = {cmd:"off",      icon:"power_settings_new"};

Vue.component('lms-manage-players', {
    template: `
<v-dialog v-model="show" scrollable fullscreen>
 <v-card>
  <v-card-title class="settings-title">
   <v-toolbar color="primary" dark app class="lms-toolbar">
    <v-btn flat icon @click.native="close"><v-icon>arrow_back</b-icon></v-btn>
    <v-toolbar-title>{{TB_MANAGE_PLAYERS.title}}</v-toolbar-title>
   </v-toolbar>
  </v-card-title>

  <v-card-text class="pmgr-card-text">
   <v-container grid-list-md class="pmgr-container">
    <v-layout row wrap>
     <template v-for="(player, index) in players" :key="player.id">
      <v-flex xs12 v-if="0==index && (manageGroups || player.isgroup)" class="pmgr-grp-title ellipsis">{{i18n('Group Players')}}</v-flex>
      <v-flex xs12 v-if="manageGroups && !player.isgroup && (0==index || players[index-1].isgroup)"><v-btn flat icon @click="bus.$emit('createGroup')" :title="i18n('Create group')"><v-icon>add_circle_outline</v-icon></v-btn></v-flex>
      <v-flex xs12 v-if="(manageGroups && 0==index && !player.isgroup) || (index>0 && players[index-1].isgroup && !player.isgroup)" class="pmgr-grp-title ellipsis">{{i18n('Standard Players')}}</v-flex>
      <v-flex xs12>
       <v-list class="pmgr-playerlist">
        <v-list-tile>
         <v-list-tile-avatar v-if="player.image" :tile="true" v-bind:class="{'dimmed': !player.ison}">
          <img :src="player.image">
         </v-list-tile-avatar>
         <v-list-tile-content>
          <v-list-tile-title style="cursor:pointer" @click="setActive(player.id)"><v-icon small class="lms-small-menu-icon">{{currentPlayer && currentPlayer.id==player.id ? 'radio_button_checked' : 'radio_button_unchecked'}}</v-icon>&nbsp;&nbsp;&nbsp;{{player.name}}</v-list-tile-title>
          <v-list-tile-sub-title v-bind:class="{'dimmed': !player.ison}">{{player.track}}</v-list-tile-sub-title>
         </v-list-tile-content>
         <v-list-tile-action v-if="player.playIcon && showAllButtons" class="pmgr-btn" @click="prevTrack(player)">
          <v-btn icon><v-icon>skip_previous</v-icon></v-btn>
         </v-list-tile-action>
         <v-list-tile-action v-if="player.playIcon" class="pmgr-btn" @click="playPause(player)">
           <v-btn icon><v-icon>{{player.playIcon}}</v-icon></v-btn>
         </v-list-tile-action>
         <v-list-tile-action v-if="player.playIcon && showAllButtons && stopButton" class="pmgr-btn" @click="stop(player)">
           <v-btn icon><v-icon>stop</v-icon></v-btn>
         </v-list-tile-action>
         <v-list-tile-action v-if="player.playIcon && showAllButtons" class="pmgr-btn" @click="nextTrack(player)">
          <v-btn icon><v-icon>skip_next</v-icon></v-btn>
         </v-list-tile-action>
        </v-list-tile>
       </v-list>
      </v-flex xs12>
       <v-flex xs12>
       <v-layout>
        <v-btn flat icon @click.stop="volumeDown(player)" class="pmgr-btn"><v-icon>volume_down</v-icon></v-btn>
        <v-slider @change="volumeChanged(player)" step="1" v-model="player.volume" class="pmgr-vol-slider"></v-slider>
        <v-btn flat icon @click.stop="volumeUp(player)" class="pmgr-btn"><v-icon>volume_up</v-icon></v-btn>
        <p class="pmgr-vol">{{player.volume}} %</p>
        <v-btn icon @click.stop="playerMenu(player, $event)" class="pmgr-btn"><v-icon>more_vert</v-icon></v-btn>
       </v-layout>
      </v-flex>
     </template>
    </v-layout>
   </v-container>
  </v-card-text>
 </v-card>

 <v-menu offset-y v-model="menu.show" :position-x="menu.x" :position-y="menu.y">
  <v-list>
   <template v-for="(action, index) in menu.actions">
    <v-divider v-if="action.divider"></v-divider>
    <v-list-tile v-else @click="playerAction(menu.player, action.cmd)">
     <v-list-tile-title><v-icon v-bind:class="{'dimmed': action.dimmed}">{{action.icon}}</v-icon>&nbsp;&nbsp;{{action.title}}</v-list-tile-title>
    </v-list-tile>
   </template>
  </v-list>
 </v-menu>
</v-dialog>
`,
    props: [],
    data() {
        return {
            show: false,
            showAllButtons: true,
            players: [],
            manageGroups: false,
            menu: { show:false, player:undefined, actions:[], x:0, y:0 }
        }
    },
    mounted() {
        bus.$on('toolbarAction', function(act) {
            if (act==TB_MANAGE_PLAYERS.id) {
                this.getPlayerList();
                this.show = true;
                bus.$emit('dialogOpen', this.show);

                // Check to see if we can manage groups...
                this.manageGroups = getLocalStorageBool('manageGroups', false);
                lmsCommand("", ["can", "playergroups", "items", "?"]).then(({data}) => {
                    if (data && data.result && undefined!=data.result._can && 1==data.result._can) {
                        lmsCommand("", ["playergroups", "can-manage"]).then(({data}) => {
                            this.manageGroups = undefined!=data.result && 1==data.result['can-manage'];
                            setLocalStorageVal('manageGroups', this.manageGroups);
                        }).catch(err => {
                            this.manageGroups = false;
                            setLocalStorageVal('manageGroups', this.manageGroups);
                        });
                    } else {
                        this.manageGroups = false;
                        setLocalStorageVal('manageGroups', this.manageGroups);
                    }
                });
            }
        }.bind(this));

        bus.$on('syncChanged', function() {
            this.updateAll();
        }.bind(this));

        this.showAllButtons = window.innerWidth>=500;
        this.$nextTick(() => {
            window.addEventListener('resize', () => {
                this.showAllButtons = window.innerWidth>=500;
            });
        });

        bus.$on('langChanged', function() {
            this.initItems();
        }.bind(this));

        this.initItems();
    },
    methods: {
        initItems() {
            PMGR_EDIT_GROUP_ACTION.title=i18n("Edit");
            PMGR_DELETE_GROUP_ACTION.title=i18n("Delete");
            PMGR_SYNC_ACTION.title=i18n("Synchronise");
            PMGR_SETTINGS_ACTION.title=i18n("Settings");
            PMGR_POWER_ON_ACTION.title=i18n("Switch On");
            PMGR_POWER_OFF_ACTION.title=i18n("Switch Off");
        },
        playerMenu(player, event) {
            PMGR_SYNC_ACTION.icon = player.synced ? "link" : "link_off";
            this.menu.actions=[PMGR_SYNC_ACTION, PMGR_SETTINGS_ACTION, player.ison ? PMGR_POWER_OFF_ACTION : PMGR_POWER_ON_ACTION];
            this.menu.x=event.clientX;
            this.menu.y=event.clientY;
            this.menu.player=player;

            if (player.isgroup) {
                this.menu.actions.push(DIVIDER);
                this.menu.actions.push(PMGR_EDIT_GROUP_ACTION);
                this.menu.actions.push(PMGR_DELETE_GROUP_ACTION);
            }
            this.menu.show = true;
        },
        playerAction(player, cmd) {
            if (PMGR_EDIT_GROUP_ACTION.cmd==cmd) {
                bus.$emit('editGroup', player);
            } else if (PMGR_DELETE_GROUP_ACTION.cmd==cmd) {
                this.deleteGroup(player);
            } else if (PMGR_SYNC_ACTION.cmd==cmd) {
                bus.$emit('synchronise', player);
            } else if (PMGR_SETTINGS_ACTION.cmd==cmd) {
                bus.$emit('playerSettings', player);
            } else if (PMGR_POWER_ON_ACTION.cmd==cmd || PMGR_POWER_OFF_ACTION.cmd==cmd) {
                this.togglePower(player);
            }
        },
        getPlayerList() {
            var players = [];
            this.$store.state.players.forEach(p => {
                // Do we know this player already?
                var existing = undefined;
                // First, quick check on position (saves search)
                if (players.length<this.players.length && this.players[players.length].id==p.id) {
                    existing = this.players[players.length];
                }
                if (!existing) { // Nope, so iterate through list...
                    for (var i=0; i<this.players.length; ++i) {
                        if (this.players[i].id==p.id) {
                            existing = this.players[i];
                        }
                    }
                }

                if (existing) {
                    existing.name = p.name; // Might have changed
                    existing.index = players.length; // Save index for quick lookups
                    players.push(existing);
                } else {
                    p.track="...";
                    p.index = players.length; // Save index for quick lookups
                    players.push(p);
                }
            });

            this.players = players;
            this.updateAll();
            this.timer = setInterval(function () {
                this.updateAll();
            }.bind(this), 2000);
        },
        close() {
            this.show=false;
            bus.$emit('dialogOpen', this.show);
            if (this.timer) {
                clearInterval(this.timer);
                this.timer = undefined;
            }
        },
        i18n(str) {
            if (this.show) {
                return i18n(str);
            } else {
                return str;
            }
        },
        volumeDown(player) {
            if (!this.show) {
                return;
            }
            this.setVolume(player, adjustVolume(player.volume, false));
        },
        volumeUp(player) {
            if (!this.show) {
                return;
            }
            this.setVolume(player, adjustVolume(player.volume, true));
        },
        setVolume(player, vol) {
            if (!this.show) {
                return;
            }
            lmsCommand(player.id, ["mixer", "volume", vol]).then(({data}) => {
                player.volume = vol;
            });
        },
        volumeChanged(player) {
            this.setVolume(player, player.volume);
        },
        togglePower(player) {
            if (!this.show) {
                return;
            }
            lmsCommand(player.id, ["power", player.ison ? "0" : "1"]).then(({data}) => {
                updatePlayer(player);
            });
        },
        playPause(player) {
            if (!this.show) {
                return;
            }
            lmsCommand(player.id, player.isplaying ? ['pause', '1'] : ['play']).then(({data}) => {
                updatePlayer(player);
            });
        },
        stop(player) {
            if (!this.show) {
                return;
            }
            lmsCommand(player.id, ['stop']).then(({data}) => {
                updatePlayer(player);
            });
        },
        prevTrack(player) {
            if (!this.show) {
                return;
            }
            lmsCommand(player.id, ['button', 'jump_rew']).then(({data}) => {
                updatePlayer(player);
            });
        },
        nextTrack(player) {
            if (!this.show) {
                return;
            }
            lmsCommand(player.id, ['playlist', 'index', '+1']).then(({data}) => {
                updatePlayer(player);
            });
        },
        setActive(id) {
            if (id != this.$store.state.player.id) {
                this.$store.commit('setPlayer', id);
            }
        },
        deleteGroup(player) {
            this.$confirm(i18n("Delete '%1'?", player.name), {buttonTrueText: i18n('Delete'), buttonFalseText: i18n('Cancel')}).then(res => {
                if (res) {
                    lmsCommand("", ['playergroups', 'delete', 'id:'+player.id]).then(({data}) => {
                        bus.$emit('updateServerStatus');
                    });
                }
            });
        },
        updateAll() {
            this.players.forEach(p => {
                if (!p.updating && (undefined==p.lastUpdate || ((new Date())-p.lastUpdate)>500)) {
                    this.updatePlayer(p);
                }
            });
        },
        updatePlayer(player) {
            player.updating=true;
            lmsCommand(player.id, ["status", "-", 1, "tags:adclK"]).then(({data}) => {
                player.updating=false;
                if (!this.show) {
                    return;
                }
                player.ison = 1==data.result.power;
                player.isplaying = data.result.mode === "play" && !data.result.waitingToPlay;
                player.volume = data.result["mixer volume"] ? data.result["mixer volume"] : 0;
                player.synced = undefined!==data.result.sync_master || undefined!==data.result.sync_slaves;
                if (data.result.playlist_loop && data.result.playlist_loop.length>0) {
                    player.playIcon = player.isplaying ? "pause_circle_outline" : "play_circle_outline";
                    if (data.result.playlist_loop[0].title) {
                        if (data.result.playlist_loop[0].artist) {
                            player.track=data.result.playlist_loop[0].title+" - "+data.result.playlist_loop[0].artist;
                        } else {
                            player.track=data.result.playlist_loop[0].title;
                        }
                    } else if (data.result.playlist_loop[0].artist) {
                        player.track=data.result.playlist_loop[0].artist;
                    } else {
                        player.track=i18n("Unknown");
                    }

                    player.image = undefined;
                    if (data.result.playlist_loop[0].artwork_url) {
                        player.image=resolveImage(null, data.result.playlist_loop[0].artwork_url);
                    }
                    if (undefined==player.image && data.result.playlist_loop[0].coverid) {
                        player.image=lmsServerAddress+"/music/"+data.result.playlist_loop[0].coverid+"/cover.jpg";
                    }
                    if (undefined==player.image) {
                        player.image=lmsServerAddress+"/music/current/cover.jpg?player=" + player.id;
                    }
                } else {
                    player.image = resolveImage("music/0/cover_50x50");
                    player.track = i18n('Nothing playing');
                    player.playIcon = undefined;
                }
            
                player.lastUpdate = new Date();
                // Cause view to update
                if (player.index<this.players.length && this.players[player.index].id==player.id) {
                    this.$set(this.players, player.index, player);
                } else {
                    for (var i=0; i<this.players.length; ++i) {
                        if (this.players[i].id == player.id) {
                            player.index = i;
                            this.$set(this.players, i, player);
                            break;
                        }
                    }
                }
            }).catch(err => {
                window.console.error(err);
                player.updating=false;
            });
        }
    },
    computed: {
        currentPlayer() {
            return this.$store.state.player
        },
        stopButton() {
            return this.$store.state.stopButton
        }
    },
    watch: {
        '$store.state.players': function () {
            if (!this.show) {
                return;
            }
            this.getPlayerList();
        }
    },
    beforeDestroy() {
        if (undefined!==this.timer) {
            clearInterval(this.timer);
            this.timer = undefined;
        }
    }
})

