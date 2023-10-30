/**
 * LMS-Material
 *
 * Copyright (c) 2018-2023 Craig Drummond <craig.p.drummond@gmail.com>
 * MIT license.
 */
'use strict';

var PMGR_EDIT_GROUP_ACTION       = {cmd:"edit",     icon:"edit"};
var PMGR_DELETE_GROUP_ACTION     = {cmd:"delete",   icon:"delete"};
var PMGR_SYNC_ACTION             = {cmd:"sync",     icon:"link"};
var PMGR_SETTINGS_ACTION         = {cmd:"settings", svg:"player-settings"};
var PMGR_POWER_ON_ACTION         = {cmd:"on",       icon:"power_settings_new", dimmed:true};
var PMGR_POWER_OFF_ACTION        = {cmd:"off",      icon:"power_settings_new", active:true};
var PMGR_SLEEP_ACTION            = {cmd:"sleep",    icon:"hotel"};
var PMGR_SET_DEF_PLAYER_ACTION   = {cmd:"sdp",      icon:"check_box_outline_blank"};
var PMGR_UNSET_DEF_PLAYER_ACTION = {cmd:"usdp",     icon:"check_box", active:true};
const PMGR_GROUP_MEMBER_ID_MOD = 1000;

var playerMap = {};

function getSyncMaster(player) {
    if (undefined==player.syncmaster || player.syncmaster.length<1) {
        return {name:player.name.toLowerCase(), isgroup:player.isgroup};
    }
    let master = playerMap[player.syncmaster];
    return undefined==master ? {name:"", isgroup:false} : {name:master.name.toLowerCase(), isgroup:master.isgroup};
}

function playerSyncSort(a, b) {
    var masterA = getSyncMaster(a);
    var masterB = getSyncMaster(b);

    if (masterA.isgroup!=masterB.isgroup) {
        return masterA.isgroup ? 1 : -1;
    }
    if (masterA.name < masterB.name) {
        return -1;
    }
    if (masterA.name > masterB.name) {
        return 1;
    }
    if (masterA.name.length>0) {
        if (a.issyncmaster && !b.issyncmaster) {
            return -1;
        }
        if (!a.issyncmaster && b.issyncmaster) {
            return 1;
        }
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

function playerIdSort(a, b) {
    var mapA = playerMap[a];
    var mapB = playerMap[b];
    var nameA = mapA ? mapA.name.toLowerCase() : a;
    var nameB = mapB ? mapB.name.toLowerCase() : b;
    if (nameA < nameB) {
        return -1;
    }
    if (nameA > nameB) {
        return 1;
    }
    return 0;
}

Vue.component('lms-manage-players', {
    template: `
<v-dialog v-model="show" v-if="show" persistent no-click-animation scrollable fullscreen>
 <v-card>
  <v-card-title class="settings-title">
   <v-toolbar app-data class="dialog-toolbar" @drop.native="drop(-1, $event)" @dragover.native="dragOver($event)">
    <v-btn flat v-if="!draggingSyncedPlayer" icon v-longpress:stop="close" :title="ttShortcutStr(i18n('Go back'), 'esc')"><v-icon>arrow_back</v-icon></v-btn>
    <v-toolbar-title class="ellipsis" style="width:100%; text-align:center" v-if="draggingSyncedPlayer">{{i18n('Drop here to remove from group')}}</v-toolbar-title>
    <v-toolbar-title class="ellipsis" v-else>{{TB_MANAGE_PLAYERS.title}}</v-toolbar-title>
    <v-spacer v-if="!draggingSyncedPlayer"></v-spacer>
    <v-menu v-if="!draggingSyncedPlayer" bottom left v-model="showMenu">
     <v-btn icon slot="activator"><v-icon>more_vert</v-icon></v-btn>
     <v-list>
      <v-list-tile @click="sleepAll">
       <v-list-tile-avatar><v-icon>hotel</v-icon></v-list-tile-avatar>
       <v-list-tile-content><v-list-tile-title>{{i18n('Set sleep time for all players')}}</v-list-tile-title></v-list-tile-content>
      </v-list-tile>
      <v-list-tile @click="createGroup" v-if="manageGroups && unlockAll">
       <v-list-tile-avatar><v-icon>add_circle_outline</v-icon></v-list-tile-avatar>
       <v-list-tile-content><v-list-tile-title>{{i18n("Create group player")}}</v-list-tile-title></v-list-tile-content>
      </v-list-tile>
     </v-list>
    </v-menu>
   </v-toolbar>
  </v-card-title>

  <div class="ios-vcard-text-workaround">
   <v-container v-if="players.length<1 && otherPlayers.length<1">
    <b>{{trans.noplayer}}</b>
   </v-container>
   <v-container v-else grid-list-md class="pmgr-container" id="player-manager-list">
    <v-layout row wrap>
     <div v-for="(player, index) in players" :key="player.id" style="width:100%">
      <v-flex xs12 v-if="0==index && !player.isgroup && manageGroups && firstGroupIndex>=0" class="pmgr-title ellipsis">{{i18n('Standard Players')}}</v-flex>
      <v-flex xs12 v-else-if="player.isgroup && index==firstGroupIndex" class="pmgr-title ellipsis">{{i18n('Group Players')}}</v-flex>
      <v-flex xs12 v-bind:class="{'pmgr-sync':!isMainPlayer(player), 'active-player':currentPlayer && currentPlayer.id === player.id}">
       <v-flex xs12>
        <v-list class="pmgr-playerlist">
         <v-list-tile @dragstart.native="dragStart(index, $event)" @dragend.native="dragEnd()" @dragover.native="dragOver($event)" @drop.native="drop(index, $event)" :draggable="!player.isgroup" v-bind:class="{'highlight-drop':dropId==('pmgr-player-'+index), 'highlight-drag':dragIndex==index}" :id="'tile-pmgr-player-'+index">
          <v-list-tile-avatar v-if="player.image && isMainPlayer(player)" :tile="true" class="pmgr-cover" v-bind:class="{'dimmed': !player.ison}">
           <img :key="player.image" v-lazy="player.image" v-bind:class="{'dimmed':player.image==DEFAULT_COVER || player.image==DEFAULT_RADIO_COVER}"></img>
          </v-list-tile-avatar>
          <v-list-tile-content v-if="isMainPlayer(player)" v-bind:class="{'dimmed': !player.ison}">
           <v-list-tile-title class="ellipsis cursor link-item" @click="setActive(player.id)"><obj :id="'pmgr-player-'+index"><v-icon v-if="player.icon.icon" class="pmgr-icon">{{player.icon.icon}}</v-icon><img v-else class="pmgr-icon svg-img" :src="player.icon.svg | svgIcon(darkUi)"></img>
           <font v-bind:class="{'active-player-title':currentPlayer && currentPlayer.id === player.id}">{{player.name}}</font></obj><v-icon v-if="player.id==defaultPlayer" class="player-status-icon dimmed">check</v-icon><v-icon v-if="player.will_sleep_in" class="player-status-icon dimmed">hotel</v-icon></v-list-tile-title>
           <v-list-tile-sub-title class="ellipsis">{{player.track}}</v-list-tile-sub-title>
          </v-list-tile-content>
          <v-list-tile-content v-else v-bind:class="{'dimmed': !player.ison}">
           <v-list-tile-title class="ellipsis cursor link-item" @click="setActive(player.id)"><obj :id="'pmgr-player-'+index"><v-icon v-if="player.icon.icon" class="pmgr-icon">{{player.icon.icon}}</v-icon><img v-else class="pmgr-icon svg-img" :src="player.icon.svg | svgIcon(darkUi)"></img>
           <font v-bind:class="{'active-player-title':currentPlayer && currentPlayer.id === player.id}">{{player.name}}</font></obj><v-icon v-if="player.id==defaultPlayer" class="player-status-icon dimmed">check</v-icon><v-icon v-if="player.will_sleep_in" class="player-status-icon dimmed">hotel</v-icon></v-list-tile-title>
          </v-list-tile-content>
          <v-list-tile-action v-if="player.playIcon && showAllButtons && isMainPlayer(player)" class="pmgr-btn pmgr-btn-control" v-bind:class="{'disabled':!player.hasTrack, 'dimmed':!player.ison}" @click="prevTrack(player)" :title="trans.prev + ' ('+player.name+')'">
           <v-btn icon><v-icon>skip_previous</v-icon></v-btn>
          </v-list-tile-action>
          <v-list-tile-action v-if="player.playIcon && isMainPlayer(player)" class="pmgr-btn pmgr-btn-control" v-bind:class="{'disabled':!player.hasTrack, 'dimmed':!player.ison}" v-longpress:stop="playPause" :id="index+'-pmgr-pp-btn'" :title="(player.isplaying ? trans.pause : trans.play) + ' ('+player.name+')'">
            <v-btn icon><v-icon>{{player.playIcon}}</v-icon></v-btn>
          </v-list-tile-action>
          <v-list-tile-action v-if="player.playIcon && showAllButtons && isMainPlayer(player)" class="pmgr-btn pmgr-btn-control" @click="nextTrack(player)" v-bind:class="{'disabled':!player.hasTrack, 'dimmed':!player.ison}" :title="trans.next + ' ('+player.name+')'">
           <v-btn icon><v-icon>skip_next</v-icon></v-btn>
          </v-list-tile-action>
         </v-list-tile>
        </v-list>
       </v-flex xs12>
       <v-flex xs12>
        <v-layout v-if="VOL_HIDDEN!=player.dvc">
         <volume-control :value="player.volume" :muted="player.muted" :playing="player.isplaying" :dvc="player.dvc" :id="player.id" :name="player.name" :layout="2" @inc="volumeUp" @dec="volumeDown" @changed="setVolume" @toggleMute="toggleMute" v-bind:class="{'dimmed':!player.ison}"></volume-control>
         <v-btn icon @click.stop="playerMenu(player, $event)" class="pmgr-btn" :title="trans.menu + ' ('+player.name+')'"><v-icon>more_vert</v-icon></v-btn>
        </v-layout>
        <v-layout v-else>
         <v-spacer></v-spacer>
         <v-btn icon @click.stop="playerMenu(player, $event)" class="pmgr-btn" :title="trans.menu + ' ('+player.name+')'"><v-icon>more_vert</v-icon></v-btn>
        </v-layout>
       </v-flex>
       <v-flex xs12 v-if="player.isgroup && player.members && player.members.length>0 && (!player.syncmaster || player.syncmaster.length<1)">
        <div class="pmgr-member-list ellipsis">
         <template v-for="(member, idx) in player.members">
         <obj @dragstart="dragStart(((index+1)*PMGR_GROUP_MEMBER_ID_MOD)+idx, $event)" @dragend="dragEnd()" :draggable="true" :id="'pmgr-player-'+(((index+1)*PMGR_GROUP_MEMBER_ID_MOD)+idx)" class="cursor link-item">{{playerMap[member] ? playerMap[member].name : member}}</obj><obj>{{idx==player.members.length-1 ? "" : ", "}}</obj>
         </template>
        </div>
       </v-flex>
      </v-flex>
     </div>
     
    <div v-for="(player, index) in otherPlayers" :key="player.id" style="width:100%">
     <v-flex xs12 v-if="0==index || player.server!=otherPlayers[index-1].server" v-bind:class="{'pmgr-other-title':players.length>0,'pmgr-title':0==players.length}" class="ellipsis">{{player.server}}</v-flex>
      <v-flex xs12 style="padding:0px;">
      <v-list style="padding:0px;">
       <v-list-tile @click="movePlayer(player)" class="pmgr-other-player">
        <v-list-tile-content>
         <v-list-tile-title><v-icon v-if="player.icon.icon">{{player.icon.icon}}</v-icon><img v-else class="svg-img" :src="player.icon.svg | svgIcon(darkUi)"></img>
         {{player.name}}</v-list-tile-title>
        </v-list-tile-content>
       </v-list-tile>
       </v-list>
      </v-flex>
     </div>

    </v-layout>
   </v-container>
  </div>
  <div class="dialog-padding"></div>
 </v-card>

 <v-menu offset-y v-model="menu.show" :position-x="menu.x" :position-y="menu.y">
  <v-list>
   <template v-for="(action, index) in menu.actions">
    <v-divider v-if="DIVIDER===action"></v-divider>
    <v-list-tile v-else-if="!((LMS_KIOSK_MODE && PMGR_SETTINGS_ACTION==action) || (PMGR_SYNC_ACTION==action && !multipleStandardPlayers))" @click="playerAction(menu.player, action.cmd)">
     <v-list-tile-avatar><v-icon v-if="action.icon" v-bind:class="{'dimmed': action.dimmed, 'active-btn': action.active}">{{action.icon}}</v-icon><img v-else-if="action.svg" class="svg-img" :src="action.svg | svgIcon(darkUi)"></img></v-list-tile-avatar>
     <v-list-tile-title>{{action.title}}</v-list-tile-title>
    </v-list-tile>
   </template>
   <v-divider v-if="menu.customActions && menu.customActions.length>0"></v-divider>
   <template v-if="menu.customActions && menu.customActions.length>0" v-for="(action, index) in menu.customActions">
    <v-list-tile @click="doCustomAction(action, menu.player)">
     <v-list-tile-avatar><v-icon v-if="action.icon">{{action.icon}}</v-icon><img v-else-if="action.svg" class="svg-img" :src="action.svg | svgIcon(darkUi)"></img></v-list-tile-avatar>
     <v-list-tile-content><v-list-tile-title>{{action.title}}</v-list-tile-title></v-list-tile-content>
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
            showMenu: false,
            showAllButtons: true,
            players: [],
            manageGroups: false,
            firstGroupIndex: -1,
            menu: { show:false, player:undefined, actions:[], x:0, y:0, customActions:undefined },
            trans: { play:undefined, pause:undefined, stop:undefined, prev:undefined, next:undefined, menu:undefined, drop:undefined, noplayer:undefined },
            draggingSyncedPlayer: false,
            dropId: undefined,
            dragIndex: undefined,
        }
    },
    mounted() {
        bus.$on('manage.open', function(act) {
            this.players = [];
            this.show = true;
            this.openDialogs = 0;

            if (this.$store.state.players) {
                for (let i=0, loop=this.$store.state.players, len=loop.length; i<len; ++i) {
                    playerMap[loop[i].id]={name:loop[i].name, isgroup:loop[i].isgroup};
                }
            }

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
        }.bind(this));

        bus.$on('syncChanged', function() {
            this.updateAll();
        }.bind(this));

        this.showAllButtons = window.innerWidth>=500;
        bus.$on('windowWidthChanged', function() {
            this.showAllButtons = window.innerWidth>=500;
        }.bind(this));

        bus.$on('langChanged', function() {
            this.initItems();
        }.bind(this));
        this.initItems();

        bus.$on('closeMenu', function() {
            // Try to ignore 'esc' if we were dragging, as use this to stop drag
            if (undefined!=this.dragEndTime && ((new Date().getTime()-this.dragEndTime)<=250)) {
                return;
            }
            if (this.showMenu) {
                this.showMenu = false;
            } else if (this.menu.show) {
                this.menu.show = false;
            }
        }.bind(this));
        bus.$on('closeDialog', function(dlg) {
            if (undefined!=this.dragEndTime && ((new Date().getTime()-this.dragEndTime)<=250)) {
                return;
            }
            if (dlg == 'manage') {
                this.close();
            }
        }.bind(this));

        bus.$on('playerStatus', function(player) {
            this.updatePlayer(player);
        }.bind(this));

        bus.$on('otherPlayerStatus', function(player) {
            this.updatePlayer(player);
        }.bind(this));

        bus.$on('noPlayers', function() {
            this.showMenu = false;
        }.bind(this));

        bus.$on('playersRemoved', function(players) {
            if (this.show) {
                for (var i=0, len=players.length; i<len; ++i) {
                    for (var j=0, jlen=this.players.length; j<jlen; ++j) {
                        if (this.players[j].id==players[i]) {
                            this.players.splice(j, 1);
                            break;
                        }
                    }
                }
            }
        }.bind(this));

        bus.$on('playerIconSet', function(playerId, icon) {
            if (playerId==this.playerId) {
                this.playerIcon = icon;
            }
            for (var i=0, len=this.players.length; i<len; ++i) {
                if (this.players[i].id==playerId) {
                    let p = this.players[i];
                    p.icon = icon;
                    this.$set(this.players, i, p);
                    break;
                }
            }
        }.bind(this));

        bus.$on('adjustVolume', function() {
            if (this.show) {
                this.cancelUpdateTimer();
                this.updateTimer = setTimeout(function() { this.updateAll(); }.bind(this), 100);
            }
        }.bind(this));
    },
    methods: {
        initItems() {
            PMGR_EDIT_GROUP_ACTION.title=i18n("Edit");
            PMGR_DELETE_GROUP_ACTION.title=i18n("Delete");
            PMGR_SYNC_ACTION.title=i18n("Synchronize");
            PMGR_SETTINGS_ACTION.title=i18n("Player settings");
            PMGR_POWER_ON_ACTION.title=i18n("Switch on");
            PMGR_POWER_OFF_ACTION.title=i18n("Switch off");
            PMGR_SLEEP_ACTION.title=i18n("Sleep");
            PMGR_SET_DEF_PLAYER_ACTION.title=PMGR_UNSET_DEF_PLAYER_ACTION.title=i18n("Default player");
            this.trans = { play:i18n("Play"), pause:i18n("Pause"), stop:i18n("Stop"), prev:i18n("Previous track"), next:i18n("Next track"),
                           menu:i18n("Menu"), noplayer:i18n('No Player')  };
        },
        playerMenu(player, event) {
            this.menu.actions=player.isgroup
                                ? this.$store.state.unlockAll
                                    ? [PMGR_SETTINGS_ACTION, player.ison ? PMGR_POWER_OFF_ACTION : PMGR_POWER_ON_ACTION, PMGR_SLEEP_ACTION, DIVIDER, PMGR_EDIT_GROUP_ACTION, PMGR_DELETE_GROUP_ACTION]
                                    : [PMGR_SETTINGS_ACTION, player.ison ? PMGR_POWER_OFF_ACTION : PMGR_POWER_ON_ACTION, PMGR_SLEEP_ACTION]
                                : [PMGR_SETTINGS_ACTION, player.ison ? PMGR_POWER_OFF_ACTION : PMGR_POWER_ON_ACTION, PMGR_SLEEP_ACTION, PMGR_SYNC_ACTION];
            this.menu.x=event.clientX;
            this.menu.y=event.clientY;
            this.menu.player=player;

            if (!queryParams.hide.has('defplayer') && !LMS_KIOSK_MODE) {
                this.menu.actions.push(DIVIDER);
                this.menu.actions.push(player.id == this.$store.state.defaultPlayer ? PMGR_UNSET_DEF_PLAYER_ACTION : PMGR_SET_DEF_PLAYER_ACTION);
            }
            this.menu.customActions = getCustomActions(player.id, this.$store.state.unlockAll);
            this.menu.show = true;
        },
        createGroup() {
            bus.$emit('dlg.open', 'group', 'create');
        },
        sleepAll() {
            bus.$emit('dlg.open', 'sleep');
        },
        playerAction(player, cmd) {
            if (PMGR_EDIT_GROUP_ACTION.cmd==cmd) {
                bus.$emit('dlg.open', 'group', 'edit', player);
            } else if (PMGR_DELETE_GROUP_ACTION.cmd==cmd) {
                this.deleteGroup(player);
            } else if (PMGR_SYNC_ACTION.cmd==cmd) {
                bus.$emit('dlg.open', 'sync', player);
            } else if (PMGR_SETTINGS_ACTION.cmd==cmd) {
                bus.$emit('dlg.open', 'playersettings', player, undefined, true);
            } else if (PMGR_POWER_ON_ACTION.cmd==cmd || PMGR_POWER_OFF_ACTION.cmd==cmd) {
                this.togglePower(player);
            } else if (PMGR_SLEEP_ACTION.cmd==cmd) {
                bus.$emit('dlg.open', 'sleep', player);
            } else if (PMGR_SET_DEF_PLAYER_ACTION.cmd==cmd) {
                this.$store.commit('setDefaultPlayer', player.id);
            } else if (PMGR_UNSET_DEF_PLAYER_ACTION.cmd==cmd) {
                this.$store.commit('setDefaultPlayer', undefined);
            }
        },
        close() {
            this.menu.show=false;
            this.show=false;
            this.showMenu = false;
            this.scrollElement = undefined;
            this.stopScrolling = true;
            this.draggingSyncedPlayer = false;
            this.dragIndex = undefined;
            if (undefined!=this.groupRefreshTimer) {
                clearTimeout(this.groupRefreshTimer);
                this.groupRefreshTimer = undefined;
            }
        },
        i18n(str) {
            if (this.show) {
                return i18n(str);
            } else {
                return str;
            }
        },
        getPlayer(id) {
            for (let i=0, loop=this.players, len=loop.length; i<len; ++i) {
                if (loop[i].id==id) {
                    return loop[i];
                }
            }
            return undefined;
        },
        volumeUp(id) {
            this.adjustVolume(id, true);
        },
        volumeDown(id) {
            this.adjustVolume(id, false);
        },
        adjustVolume(id, inc) {
            if (!this.show || this.$store.state.visibleMenus.size>0) {
                return;
            }
            let player = this.getPlayer(id);
            if (undefined==player) {
                return;
            }
            lmsCommand(player.id, ["mixer", "volume", (inc ? "+" : "-")+lmsOptions.volumeStep]).then(({data}) => {
                this.refreshAllMembers(player);
            });
        },
        setVolume(vol, id) {
            if (!this.show) {
                return;
            }
            let player = this.getPlayer(id);
            if (undefined==player) {
                return;
            }
            player.volume = vol;
            player.muted = vol<0;
            lmsCommand(player.id, ["mixer", "volume", vol]).then(({data}) => {
                this.refreshAllMembers(player);
            });
        },
        toggleMute(id) {
            if (!this.show || this.$store.state.visibleMenus.size>0) {
                return;
            }
            let player = this.getPlayer(id);
            if (undefined==player) {
                return;
            }
            lmsCommand(player.id, ['mixer', 'muting', player.muted ? 0 : 1]).then(({data}) => {
                this.refreshAllMembers(player);
                // Status seems to take while to update, so chaeck again 1/2 second later...
                setTimeout(function () {
                    this.refreshAllMembers(player);
                }.bind(this), 500);
            });
        },
        togglePower(player) {
            if (!this.show) {
                return;
            }
            lmsCommand(player.id, ["power", player.ison ? "0" : "1"]).then(({data}) => {
                this.refreshPlayer(player);
            });
        },
        playPause(longPress, el) {
            if (!this.show || this.$store.state.visibleMenus.size>0) {
                return;
            }
            let idx = parseInt(el.id.split("-")[0]);
            console.log(idx, this.players.length, longPress);
            if (idx<0 || idx>this.players.length) {
                return;
            }
            let player = this.players[idx];
            if (longPress) {
                bus.$emit('showMessage', i18n('Stop'), 500);
            }
            lmsCommand(player.id, longPress ? ['stop'] : player.isplaying ? ['pause', '1'] : ['play']).then(({data}) => {
                this.refreshPlayer(player, true);
            });
        },
        stop(player) {
            if (!this.show || this.$store.state.visibleMenus.size>0 || !player.hasTrack) {
                return;
            }
            lmsCommand(player.id, ['stop']).then(({data}) => {
                this.refreshPlayer(player, true);
            });
        },
        prevTrack(player) {
            if (!this.show || this.$store.state.visibleMenus.size>0 || !player.hasTrack) {
                return;
            }
            lmsCommand(player.id, ['button', 'jump_rew']).then(({data}) => {
                this.refreshPlayer(player);
            });
        },
        nextTrack(player) {
            if (!this.show || this.$store.state.visibleMenus.size>0 || !player.hasTrack) {
                return;
            }
            lmsCommand(player.id, ['playlist', 'index', '+1']).then(({data}) => {
                this.refreshPlayer(player);
            });
        },
        setActive(id) {
            if (id != this.$store.state.player.id && this.$store.state.visibleMenus.size<=0) {
                this.$store.commit('setPlayer', id);
            }
        },
        refreshAllMembers(player) {
            this.refreshPlayer(player);
            if (player.syncslaves) {
                for (var i=0, len=player.syncslaves.length; i<len; ++i) {
                    if (player.syncslaves[i].id!=player.id) {
                        bus.$emit('refreshStatus', player.syncslaves[i]);
                    }
                }
            }
            if (player.syncmaster && player.syncmaster.id!=player.id) {
                bus.$emit('refreshStatus', player.syncmaster);
            }
        },
        refreshPlayer(player, canChangeGroup, i) {
            bus.$emit('refreshStatus', player.id);
            // If a group we need to refresh all members
            if (player.isgroup && player.syncslaves && canChangeGroup) {
                for (var j=0, len=player.syncslaves.length; j<len; ++j) {
                    bus.$emit('refreshStatus', player.syncslaves[j]);
                }
                if (undefined==i) {
                    i = 0;
                }
                if (i<4) {
                    this.groupRefreshTimer = setTimeout(function () {
                        this.groupRefreshTimer = undefined;
                        this.refreshPlayer(player, canChangeGroup, i+1);
                    }.bind(this), 250);
                }
            }
        },
        deleteGroup(player) {
            confirm(i18n("Delete '%1'?", player.name), i18n('Delete')).then(res => {
                if (res) {
                    lmsCommand("", ['playergroups', 'delete', 'id:'+player.id]).then(({data}) => {
                        // If server status is refreshed straight away, group player comes back (in listing). Delaying for 1/4 seems to
                        // work-around this. Perhaps deletion is slow?
                        setTimeout(function () {
                            bus.$emit('refreshServerStatus');
                            // Just in case the 1/4 second was not enough, refresh agian in 100ms
                            setTimeout(function () {
                                bus.$emit('refreshServerStatus');
                            }.bind(this), 100);
                        }.bind(this), 250);
                    });
                }
            });
        },
        updateAll() {
            if (!this.show) {
                return;
            }
            for (let i=0, len=this.players.length; i<len; ++i) {
                bus.$emit('refreshStatus', this.players[i].id);
            }
        },
        updatePlayer(player) {
            if (!this.show) {
                return;
            }
            playerMap[player.id]={name:player.name, isgroup:player.isgroup, dvc:player.dvc};

            player.playIcon = player.isplaying ? "pause_circle_filled" : "play_circle_filled";
            player.hasTrack = true;
            if (player.current.title) {
                if (player.current.artist) {
                    player.track=player.current.title+SEPARATOR+player.current.artist;
                } else if (player.current.trackartist) {
                    player.track=player.current.title+SEPARATOR+player.current.trackartist;
                } else {
                    player.track=player.current.title;
                }
            } else if (player.current.artist) {
                player.track=player.current.artist;
            } else if (player.current.trackartist) {
                player.track=player.current.trackartist;
            } else {
                player.track="...";
                player.hasTrack = false;
            }

            player.image = undefined;
            if (player.current) {
                if (player.current.artwork_url) {
                    player.image=resolveImageUrl(player.current.artwork_url);
                }
                if (undefined==player.image && player.current.coverid) {
                    player.image=resolveImageUrl("/music/"+player.current.coverid+"/cover.jpg");
                }
                if (undefined==player.image && player.hasTrack) {
                    player.image=resolveImageUrl("/music/current/cover.jpg?player=" + player.id);
                }
            }
            if (undefined==player.image) {
                player.image = DEFAULT_COVER;
            }

            if (player.isgroup && player.members) {
                player.members.sort(playerIdSort);
            }
            var found = false;
            var prevSlaves = undefined;
            for (var i=0, len=this.players.length; i<len; ++i) {
                if (this.players[i].id==player.id) {
                    found=true;
                    prevSlaves = this.players[i].syncslaves;
                    this.$set(this.players, i, player);
                    break;
                }
            }
            if (!found) {
                this.players.push(player);
            }
            this.players.sort(playerSyncSort);

            this.firstGroupIndex=-1;
            for (var i=0, len=this.players.length; i<len; ++i) {
                if (this.players[i].isgroup) {
                    this.firstGroupIndex = i;
                    break;
                }
            }

            // Group changed? Update slaves...
            if (found && ( (prevSlaves && player.syncslaves && player.syncslaves.length!=prevSlaves.length) || (!prevSlaves && player.syncslaves) || (prevSlaves && !player.syncslaves))) {
                var refreshed = new Set();
                if (prevSlaves) {
                    for (var i=0, len=prevSlaves.length; i<len; ++i) {
                        bus.$emit('refreshStatus', prevSlaves[i]);
                        refreshed.add(prevSlaves[i]);
                    }
                }
                if (player.syncslaves) {
                    for (var i=0, len=player.syncslaves.length; i<len; ++i) {
                        if (!refreshed.has(player.syncslaves[i])) {
                            bus.$emit('refreshStatus', player.syncslaves[i]);
                        }
                    }
                }
            }
        },
        isMainPlayer(player) {
            return player.isgroup || player.issyncmaster || !player.syncslaves || player.syncslaves.length<1;
        },
        movePlayer(player) {
            confirm(i18n("Move '%1' from '%2' to this server?", player.name, player.server), i18n('Move')).then(res => {
                if (res) {
                    bus.$emit('movePlayer', player);
                }
            });
        },
        dragStart(which, ev) {
            ev.dataTransfer.dropEffect = 'move';
            ev.dataTransfer.setData('Text', "player:"+which);
            ev.dataTransfer.setDragImage(which<PMGR_GROUP_MEMBER_ID_MOD
                                            ? document.getElementById("pmgr-player-"+which).parentNode.parentNode.parentNode
                                            : document.getElementById("pmgr-player-"+which),
                                         0, 0);
            this.dragIndex = which;
            this.stopScrolling = false;
            this.draggingSyncedPlayer = which>PMGR_GROUP_MEMBER_ID_MOD || this.players[which].issyncmaster || undefined!=this.players[which].syncmaster;
        },
        dragEnd() {
            this.dragEndTime = new Date().getTime();
            this.stopScrolling = true;
            this.dragIndex = undefined;
            this.draggingSyncedPlayer = false;
            this.dropId = undefined;
        },
        dragOver(ev) {
            this.dropId=undefined;
            if (undefined!=ev.target && this.dragIndex<PMGR_GROUP_MEMBER_ID_MOD) {
                let elem = ev.target;
                let dropId = undefined;
                for (let level=0; level<5 & undefined!=elem && undefined==dropId; ++level) {
                    if (elem.id) {
                        if (elem.id.startsWith("pmgr-")) {
                            dropId=elem.id
                        } else if (elem.id.startsWith("tile-pmgr-")) {
                            dropId=elem.id.substring(5);
                        }
                    }
                    elem=elem.parentNode;
                }
                if (undefined!=dropId) {
                    let index=parseInt(dropId.split('-').slice(-1)[0]);
                    if (index>=0 && index<this.players.length) {
                        let player = this.players[index];
                        let dragPlayer = this.players[this.dragIndex];
                        let playerMaster = player.syncmaster ? player.syncmaster : "A";
                        let dragPlayerMaster = dragPlayer.syncmaster ? dragPlayer.syncmaster : "B";
                        if (player.id!=dragPlayer.id && player.id!=dragPlayerMaster && playerMaster!=dragPlayerMaster) {
                            this.dropId=dropId;
                        }
                    }
                }
            }
            // Drag over item at top/bottom of list to start scrolling
            this.stopScrolling = true;
            if (ev.clientY < 110) {
                this.stopScrolling = false;
                this.scrollList(-5)
            }

            if (ev.clientY > (window.innerHeight - 70)) {
                this.stopScrolling = false;
                this.scrollList(5)
            }
            ev.preventDefault(); // Otherwise drop is never called!
        },
        scrollList(step) {
            if (this.stopScrolling) {
                return;
            }
            if (undefined==this.scrollElement) {
                this.scrollElement = document.getElementById("player-manager-list");
            }
            var pos = this.scrollElement.scrollTop + step;
            setScrollTop(this, pos);
            if (pos<=0 || pos>=this.scrollElement.scrollTopMax) {
                this.stopScrolling = true;
            }
            if (!this.stopScrolling) {
                setTimeout(function () {
                    this.scrollList(step);
                }.bind(this), 100);
            }
        },
        drop(to, ev) {
            this.stopScrolling = true;
            ev.preventDefault();
            if (this.dragIndex!=undefined && to!=this.dragIndex && to<PMGR_GROUP_MEMBER_ID_MOD) {
                if (this.dragIndex>=PMGR_GROUP_MEMBER_ID_MOD) {
                    // Dragging a group member out of group
                    if (-1==to) {
                        let grp = Math.floor(this.dragIndex/PMGR_GROUP_MEMBER_ID_MOD);
                        let member = this.dragIndex-(grp*PMGR_GROUP_MEMBER_ID_MOD);
                        grp--; // We add 1 before multiplying by PMGR_GROUP_MEMBER_ID_MOD
                        if (grp>=0 && member>=0 && grp<=this.players.length && this.players[grp].isgroup && this.players[grp].members && member<this.players[grp].members.length) {
                            this.updateGroup(this.players[grp], this.players[grp].members[member], false);
                        }
                    }
                } else {
                    let playerId = this.players[this.dragIndex].id;
                    let from = this.players[this.dragIndex].syncmaster;
                    if (-1==to) {
                        // Remove player
                        let group = undefined;
                        for (let i=0, len=this.players.length; i<len; ++i) {
                            if (this.players[i].id==from) {
                                group = this.players[i];
                                break;
                            }
                        }
                        lmsCommand(playerId, ["sync", "-"]).then(({data}) => {
                            bus.$emit('refreshStatus', playerId);
                            bus.$emit('refreshStatus', from);
                            this.updateGroup(group, playerId, false);
                        });
                    } else {
                        // Add player
                        let target = this.players[to];
                        if (target.isgroup) {
                            this.updateGroup(target, playerId, true);
                        } else {
                            let dest = target.syncmaster ? target.syncmaster : target.id;
                            if (dest!=from) {
                                lmsCommand(dest, ["sync", this.players[this.dragIndex].id]).then(({data}) => {
                                    bus.$emit('refreshStatus', playerId);
                                    if (undefined!=from) {
                                        bus.$emit('refreshStatus', from);
                                    }
                                    bus.$emit('refreshStatus', dest);
                                });
                            }
                        }
                    }
                }
            }
            this.dragIndex = undefined;
        },
        doCustomAction(action, player) {
            performCustomAction(action, player);
        },
        updateGroup(group, player, addPlayer) {
            if (undefined!=group && group.isgroup) {
                let index = group.members ? group.members.indexOf(player) : -1;
                if (addPlayer && group.members && index>=0) {
                    return;
                }
                lmsCommand("", ['playergroups', 'update', 'id:'+group.id, 'members:'+(addPlayer ? '+' : '-')+player]).then(({data}) => {
                    lmsCommand(group.id, ["material-skin-group", "set-modes"]);
                    bus.$emit('refreshServerStatus', 1000);
                    if (undefined==group.members) {
                        group.members=[];
                    }
                    if (addPlayer) {
                        group.members.push(player);
                        group.members.sort(playerIdSort);
                    } else {
                        group.members.splice(index, 1);
                    }
                });
            }
        },
        cancelUpdateTimer() {
            if (undefined!==this.updateTimer) {
                clearTimeout(this.updateTimer);
                this.updateTimer = undefined;
            }
        }
    },
    computed: {
        currentPlayer() {
            return this.$store.state.player
        },
        defaultPlayer() {
            return this.$store.state.defaultPlayer
        },
        otherPlayers () {
            return this.$store.state.otherPlayers
        },
        multipleStandardPlayers () {
            if (this.$store.state.players) {
                var len = this.$store.state.players.length;
                return len>1 && !this.$store.state.players[0].isgroup && !this.$store.state.players[1].isgroup;
            }
            return false;
        },
        darkUi () {
            return this.$store.state.darkUi
        },
        unlockAll() {
            return this.$store.state.unlockAll
        }
    },
    filters: {
        svgIcon: function (name, dark, active) {
            return "/material/svg/"+name+"?c="+(active ? getComputedStyle(document.documentElement).getPropertyValue("--active-color").replace("#", "") : dark ? LMS_DARK_SVG : LMS_LIGHT_SVG)+"&r="+LMS_MATERIAL_REVISION;
        }
    },
    watch: {
        'show': function(val) {
            this.$store.commit('dialogOpen', {name:'manage', shown:val});
            bus.$emit('subscribeAll', val);
            this.cancelUpdateTimer();
        },
        'menu.show': function(val) {
            this.$store.commit('menuVisible', {name:'manage', shown:val});
        },
        'showMenu': function(val) {
            this.$store.commit('menuVisible', {name:'manage-menu', shown:val});
        }
    }
})

