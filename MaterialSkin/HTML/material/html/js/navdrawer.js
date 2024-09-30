/**
 * LMS-Material
 *
 * Copyright (c) 2018-2024 Craig Drummond <craig.p.drummond@gmail.com>
 * MIT license.
 */
'use strict';

Vue.component('lms-navdrawer', {
    template: `
<v-navigation-drawer v-model="show" absolute temporary :width="maxWidth">
   <v-list style="padding:0px!important">
   <v-list-tile >
   <v-list-tile-avatar><v-btn icon flat @click="show=false"><v-icon>arrow_back<v-icon></v-btn></v-list-tile-avatar>
   <a class="lyrion-logo" href="https://lyrion.org" target="_blank"><img :src="'lyrion' | svgIcon(darkUi)"></img></a>
  </v-list-tile>
   <template v-for="(item, index) in players"  v-if="!queryParams.single">
    <v-subheader v-if="index==0 && !item.isgroup && players[players.length-1].isgroup">{{trans.standardPlayers}}</v-subheader>
    <v-subheader v-else-if="index>0 && item.isgroup && !players[index-1].isgroup">{{trans.groupPlayers}}</v-subheader>
    <v-list-tile @click="setPlayer(item.id)" v-bind:class="{'active-player':player && item.id === player.id}">
     <v-list-tile-avatar>
      <v-icon v-if="item.isplaying" class="playing-badge">play_arrow</v-icon>
      <v-icon v-if="item.icon.icon">{{item.icon.icon}}</v-icon><img v-else class="svg-img" :src="item.icon.svg | svgIcon(darkUi)"></img>
      <div v-if="player && item.id === player.id" class="active-player"></div>
     </v-list-tile-avatar>
     <v-list-tile-content>
      <v-list-tile-title v-bind:class="{'active-player-title':player && item.id === player.id}">{{item.name}}</v-list-tile-title>
     </v-list-tile-content>
      <v-list-tile-action v-if="index<10 && keyboardControl" class="menu-shortcut" v-bind:class="{'menu-shortcut-player':item.canpoweroff,'menu-shortcut-player-apple':IS_APPLE && item.canpoweroff}">{{index|playerShortcut}}</v-list-tile-action>
      <v-list-tile-action>
       <v-btn v-if="item.canpoweroff" icon style="float:right" v-longpress:stop="togglePower" :id="index+'-power-btn'" :title="(item.id==player.id && playerStatus.ison) || item.ison ? i18n('Switch off %1', item.name) : i18n('Switch on %1', item.name)"><v-icon v-bind:class="{'dimmed': (item.id==player.id ? !playerStatus.ison : !item.ison)}">power_settings_new</v-icon></v-btn>
      </v-list-tile-action>
    </v-list-tile>
   </template>

   <v-divider v-if="!noPlayer && (((players && players.length>1) || playerStatus.sleepTime || otherPlayers.length>0))" class="hide-for-mini"></v-divider>

   <v-list-tile v-if="((players && players.length>1) || otherPlayers.length>0) && !queryParams.party" v-longpress="managePlayers" class="hide-for-mini noselect">
    <v-list-tile-avatar><img class="svg-img" :src="TB_MANAGE_PLAYERS.svg | svgIcon(darkUi)"></img></v-list-tile-avatar>
    <v-list-tile-content><v-list-tile-title>{{TB_MANAGE_PLAYERS.title}}</v-list-tile-title></v-list-tile-content>
    <v-list-tile-action v-if="TB_MANAGE_PLAYERS.shortcut && keyboardControl" class="menu-shortcut player-menu-shortcut">{{TB_MANAGE_PLAYERS.shortcut}}</v-list-tile-action>
   </v-list-tile>

   <template v-if="!noPlayer && customPlayerActions && customPlayerActions.length>0" v-for="(action, index) in customPlayerActions">
    <v-list-tile @click="doCustomAction(action)" v-if="undefined==action.players || action.players.indexOf(player.id)>=0">
     <v-list-tile-avatar><v-icon v-if="action.icon">{{action.icon}}</v-icon><img v-else-if="action.svg" class="svg-img" :src="action.svg | svgIcon(darkUi)"></img></v-list-tile-avatar>
     <v-list-tile-content><v-list-tile-title>{{action.title}}</v-list-tile-title></v-list-tile-content>
    </v-list-tile>
   </template>

   <v-list-tile v-if="playerStatus.sleepTime" @click="bus.$emit('dlg.open', 'sleep', player)" class="hide-for-mini">
    <v-list-tile-avatar><v-icon>hotel</v-icon></v-list-tile-avatar>
    <v-list-tile-content>
     <v-list-tile-title>{{playerStatus.sleepTime | displayTime}}</v-list-tile-title>
    </v-list-tile-content>
   </v-list-tile>
   <v-list-tile v-if="playerStatus.alarmStr" @click="bus.$emit('dlg.open', 'playersettings', undefined, 'alarms')" class="hide-for-mini">
    <v-list-tile-avatar><v-icon>alarm</v-icon></v-list-tile-avatar>
    <v-list-tile-content>
     <v-list-tile-title>{{playerStatus.alarmStr}}</v-list-tile-title>
    </v-list-tile-content>
   </v-list-tile>

   <v-divider v-if="!noPlayer"></v-divider>
   <template v-for="(item, index) in menuItems">
   <v-divider v-if="item===DIVIDER"></v-divider>
   <v-subheader v-else-if="item.hdr">{{item.title}}</v-subheader>
   <v-list-tile @click="menuAction(item.id)" v-else-if="(TB_UI_SETTINGS.id==item.id) || (TB_PLAYER_SETTINGS.id==item.id && player) || (TB_SERVER_SETTINGS.id==item.id && unlockAll) || (TB_HELP.id==item.id) || (TB_INFO.id==item.id)">
    <v-list-tile-avatar><img v-if="TB_INFO.id==item.id && updatesAvailable" class="svg-img" :src="'update' | svgIcon(darkUi, true)"></img><img v-else-if="TB_INFO.id==item.id && restartRequired" class="svg-img" :src="'restart' | svgIcon(darkUi, true)"><img v-else-if="item.svg" class="svg-img" :src="item.svg | svgIcon(darkUi)"><v-icon v-else>{{item.icon}}</v-icon></v-list-tile-avatar>
    <v-list-tile-content>
     <v-list-tile-title>{{item.stitle ? item.stitle : item.title}}</v-list-tile-title>
     <v-list-tile-sub-title v-if="TB_INFO.id==item.id && updatesAvailable">{{trans.updatesAvailable}}</v-list-tile-sub-title>
     <v-list-tile-sub-title v-else-if="TB_INFO.id==item.id && restartRequired">{{trans.restartRequired}}</v-list-tile-sub-title>
    </v-list-tile-content>
    <v-list-tile-action v-if="item.shortcut && keyboardControl" class="menu-shortcut">{{item.shortcut}}</v-list-tile-action>
   </v-list-tile>
   <v-list-tile :href="queryParams.appSettings" v-else-if="TB_APP_SETTINGS.id==item.id && undefined!=queryParams.appSettings">
    <v-list-tile-avatar><img class="svg-img" :src="TB_APP_SETTINGS.svg | svgIcon(darkUi)"></img></v-list-tile-avatar>
    <v-list-tile-content><v-list-tile-title>{{TB_APP_SETTINGS.stitle}}</v-list-tile-title></v-list-tile-content>
   </v-list-tile>
   <v-list-tile :href="appLaunchPlayer" v-else-if="TB_START_PLAYER.id==item.id">
    <v-list-tile-avatar><v-icon>{{TB_START_PLAYER.icon}}</v-icon></v-list-tile-avatar>
    <v-list-tile-title>{{TB_START_PLAYER.title}}</v-list-tile-title>
   </v-list-tile>
   <v-list-tile :href="appQuit" v-else-if="TB_APP_QUIT.id==item.id">
    <v-list-tile-avatar><img class="svg-img" :src="TB_APP_QUIT.svg | svgIcon(darkUi)"></img></v-list-tile-avatar>
    <v-list-tile-title>{{TB_APP_QUIT.title}}</v-list-tile-title>
   </v-list-tile>
   <template v-else-if="(TB_CUSTOM_SETTINGS_ACTIONS.id==item.id && undefined!=customSettingsActions && customSettingsActions.length>0) || (TB_CUSTOM_ACTIONS.id==item.id && undefined!=customActions && customActions.length>0)" v-for="(action, actIndex) in (TB_CUSTOM_SETTINGS_ACTIONS.id==item.id ? customSettingsActions : customActions)">
    <v-list-tile @click="doCustomAction(action)">
     <v-list-tile-avatar><v-icon v-if="action.icon">{{action.icon}}</v-icon><img v-else-if="action.svg" class="svg-img" :src="action.svg | svgIcon(darkUi)"></img></v-list-tile-avatar>
     <v-list-tile-content><v-list-tile-title>{{action.title}}</v-list-tile-title></v-list-tile-content>
    </v-list-tile>
   </template>
  </template>


  </v-list>


</v-navigation-drawer>
`,
    props: [],
    data() {
        return {
            show: false,
            trans:{groupPlayers:undefined, standardPlayers:undefined},
            menuItems: [],
            customActions:undefined,
            customSettingsActions:undefined,
            customPlayerActions:undefined,
            playerStatus: { ison: 1, isplaying: false, volume: 0, synced: false, sleepTime: undefined, count:0, alarm: undefined, alarmStr: undefined },
            appQuit: queryParams.appQuit,
            appLaunchPlayer: queryParams.appLaunchPlayer,
            maxWidth: 300
        }
    },
    created() {
        bus.$on('langChanged', function() {
            this.initItems();
        }.bind(this));
        this.initItems();
        bus.$on('navDrawer', function() {
            this.show = true;
        }.bind(this));
        this.maxWidth = window.innerWidth>500 ? 400 : 300;
        bus.$on('windowWidthChanged', function() {
            this.maxWidth = window.innerWidth>500 ? 400 : 300;
        }.bind(this));
    },
    methods: {
        initItems() {
            this.trans = {groupPlayers:i18n("Group Players"), standardPlayers:i18n("Standard Players")};
            if (LMS_KIOSK_MODE) {
                this.menuItems = LMS_KIOSK_MODE==2
                                   ? [TB_SETTINGS, TB_CUSTOM_SETTINGS_ACTIONS, DIVIDER, TB_CUSTOM_ACTIONS]
                                   : [TB_CUSTOM_SETTINGS_ACTIONS, TB_CUSTOM_ACTIONS]
            } else {
                if (queryParams.party) {
                    this.menuItems = [TB_APP_SETTINGS, TB_UI_SETTINGS, DIVIDER, TB_INFO, TB_HELP];
                } else {
                    this.menuItems = [TB_SETTINGS, TB_APP_SETTINGS, TB_UI_SETTINGS, TB_PLAYER_SETTINGS, TB_SERVER_SETTINGS, TB_CUSTOM_SETTINGS_ACTIONS, DIVIDER];
                    if (queryParams.appLaunchPlayer) {
                        this.menuItems.push(TB_START_PLAYER);
                    }
                    this.menuItems=this.menuItems.concat([TB_INFO, TB_HELP, TB_CUSTOM_ACTIONS]);
                }
                if (queryParams.appQuit) {
                    this.menuItems.push(DIVIDER);
                    this.menuItems.push(TB_APP_QUIT)
                }
            }
        },
        setPlayer(id) {
            if (id != this.$store.state.player.id) {
                this.$store.commit('setPlayer', id);
            }
            this.show = false;
        },
        managePlayers(longPress) {
            if (longPress) {
                // Leave menu open for 1/4 of a second so that it captures the
                // click/touch end event. If we close immediately then the element
                // that long-press was bound to no longer exists so it can't stop
                // the event => sometimes na entry in the sync-dialog gets this
                // and toggles its setting.
                setTimeout(function () {
                    this.showPlayerMenu = false;
                    bus.$emit('dlg.open', 'sync', this.$store.state.player);
                }.bind(this), 250);
            } else {
                this.menuAction(TB_MANAGE_PLAYERS.id);
            }
        },
        togglePower() {

        }
    },
    computed: {
        darkUi () {
            return this.$store.state.darkUi
        },
        player () {
            return this.$store.state.player
        },
        players () {
            return this.$store.state.players
        },
        otherPlayers () {
            return this.$store.state.otherPlayers
        },
        multipleStandardPlayers () {
            return this.$store.state.players && this.$store.state.players.length>1 && !this.$store.state.players[1].isgroup
        },
        noPlayer () {
            return !this.$store.state.players || this.$store.state.players.length<1
        },
        updatesAvailable() {
            return this.$store.state.unlockAll && this.$store.state.updatesAvailable.size>0
        },
        restartRequired() {
            return this.$store.state.unlockAll && this.$store.state.restartRequired
        },
        keyboardControl() {
            return this.$store.state.keyboardControl && !IS_MOBILE
        },
        unlockAll() {
            return this.$store.state.unlockAll
        }
    },
    filters: {
        svgIcon: function (name, dark) {
            return "/material/svg/"+name+"?c="+(dark ? LMS_DARK_SVG : LMS_LIGHT_SVG)+"&r="+LMS_MATERIAL_REVISION;
        },
        playerShortcut: function(index) {
            return IS_APPLE ? ("⌥+"+(9==index ? 0 : index+1)) : i18n("Alt+%1", 9==index ? 0 : index+1);
        }
    }
})

