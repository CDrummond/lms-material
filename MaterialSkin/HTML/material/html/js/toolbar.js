/**
 * LMS-Material
 *
 * Copyright (c) 2018-2024 Craig Drummond <craig.p.drummond@gmail.com>
 * MIT license.
 */
'use strict';

var TB_SETTINGS        = {id:0, hdr: true };
var TB_UI_SETTINGS     = {id:1, svg:  "ui-settings" };
var TB_PLAYER_SETTINGS = {id:2, svg:  "player-settings" };
var TB_SERVER_SETTINGS = {id:3, svg:  "server-settings" };
var TB_APP_SETTINGS    = {id:4, svg:  "app-settings" };
var TB_INFO            = {id:5, icon: "info" };
var TB_HELP            = {id:6, icon: "help" };
var TB_MANAGE_PLAYERS  = {id:7, svg:  "player-manager" };
var TB_APP_QUIT        = {id:8, icon: "power_settings_new" }
var TB_START_PLAYER    = {id:9, icon: "surround_sound" }

const TB_CUSTOM_SETTINGS_ACTIONS = {id:20};
const TB_CUSTOM_ACTIONS = {id:21};

Vue.component('lms-toolbar', {
    template: `
<div style="z-index:2"> <!-- Prevent np-cover leak -->
<v-toolbar fixed dense app class="lms-toolbar noselect" v-bind:class="{'lms-toolbar-no-menu':connected && !showMenuButton}" @mousedown="mouseDown" id="main-toolbar">
<div class="drag-area-left"></div>
<div v-if="showClock" class="toolbar-clock">
 <div class="maintoolbar-title">{{time}}</div>
 <div class="maintoolbar-subtitle subtext">{{date}}</div>
</div>

 <v-btn v-if="!noPlayer && powerButton" icon class="toolbar-button maintoolbar-player-power-button" v-longpress:stop="handlePlayerToolbarButton" :title="playerStatus.ison ? i18n('Switch off %1', player.name) : i18n('Switch on %1', player.name)"><v-icon v-bind:class="{'dimmed': !playerStatus.ison}">power_settings_new</v-icon></v-btn>
 <v-btn v-else-if="!noPlayer" icon class="toolbar-button maintoolbar-player-power-button" v-longpress:stop="handlePlayerToolbarButton" :title="player.name"><v-icon v-if="player.icon.icon" class="maintoolbar-player-icon" v-bind:class="{'dimmed': !playerStatus.ison}">{{player.icon.icon}}</v-icon><img v-else class="svg-img maintoolbar-player-icon" v-bind:class="{'dimmed': !playerStatus.ison}" :src="player.icon.svg | svgIcon(darkUi, false, true, coloredToolbars)"></img></v-btn>

 <v-menu bottom :disabled="!connected" class="ellipsis" v-model="showPlayerMenu">
  <v-toolbar-title slot="activator" v-bind:class="{'link-item':!coloredToolbars && (!queryParams.single || !powerButton), 'link-item-ct': coloredToolbars && (!queryParams.single || !powerButton), 'maintoolbar-title-clock':showClock}">
   <v-icon v-if="noPlayer" class="maintoolbar-player-icon amber">warning</v-icon>
   <div class="maintoolbar-title ellipsis" v-bind:class="{'dimmed': !playerStatus.ison}">
    {{noPlayer ? trans.noplayer : player.name}}<v-icon v-if="playerStatus.sleepTime" class="player-status-icon dimmed">hotel</v-icon><v-icon v-if="playerStatus.alarmStr" class="player-status-icon dimmed">alarm</v-icon><v-icon v-if="playerStatus.synced" class="player-status-icon dimmed">link</v-icon></div>
   <div v-if="!desktopLayout && !noPlayer && MBAR_NONE==mobileBar" class="maintoolbar-subtitle subtext ellipsis" v-bind:class="{'dimmed' : !playerStatus.ison}">{{playerStatus.count<1 ? trans.nothingplaying : isNowPlayingPage ? queueInfo : npInfo}}</div>
  </v-toolbar-title>
       
  <v-list class="toolbar-player-list" v-bind:class="{'toolbar-player-list-desktop': !IS_MOBILE && desktopLayout}" v-if="!queryParams.single || !powerButton">
   <template v-for="(item, index) in players">
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
  </v-list>
 </v-menu>
 <v-spacer class="drag-area"></v-spacer>
 <div v-if="updateProgress.show && showUpdateProgress && downloadCount<=0" class="ellipsis subtext">{{updateProgress.text}}</div>
 <v-btn v-if="downloadCount>0" icon flat @click="bus.$emit('dlg.open', 'downloadstatus')" :title="trans.downloading"><v-icon class="pulse">cloud_download</v-icon></v-btn>
 <v-btn v-else-if="updateProgress.show" icon flat @click="bus.$emit('showMessage', updateProgress.text)" :title="updateProgress.text"><v-icon class="pulse">update</v-icon></v-btn>
 <v-btn v-show="playerStatus.synced && showVolumeSlider" icon flat class="toolbar-button hide-for-mini" id="vol-group-btn" :title="trans.groupVol" @click="bus.$emit('dlg.open', 'groupvolume', playerStatus)"><v-icon>speaker_group</v-icon></v-btn>
 <volume-control class="vol-full-slider" v-show="showVolumeSlider" :value="playerVolume" :muted="playerMuted" :playing="playerStatus.isplaying" :dvc="playerDvc" :layout="1" @inc="volumeUp" @dec="volumeDown" @changed="setVolume" @toggleMute="toggleMute"></volume-control>
 <v-btn v-show="playerDvc!=VOL_HIDDEN && !showVolumeSlider" v-bind:class="{'disabled':noPlayer,'pulse':!noPlayer && playerStatus.volume==0 && playerStatus.isplaying}" icon flat class="toolbar-button" v-longpress="volumeBtn" @click.middle="toggleMute" @wheel="volWheel($event)" id="vol-btn" :title="trans.showVol">
  <v-icon>{{playerMuted ? 'volume_off' : playerStatus.volume>0 ? 'volume_up' : 'volume_down'}}</v-icon>
  <div v-if="VOL_FIXED!=playerDvc" v-bind:class="{'disabled':noPlayer,'vol-btn-label':!desktopLayout||!showVolumeSlider,'dimmed':playerMuted}" >{{playerStatus.volume|displayVolume(playerDvc)}}</div>
 </v-btn>
 <v-btn icon :title="trans.info | tooltip(LMS_TRACK_INFO_KEYBOARD,keyboardControl)" v-if="!desktopLayout && (MBAR_THICK==mobileBar || isNowPlayingPage)" @click.native="emitInfo" class="toolbar-button hide-for-mini" id="inf" v-bind:class="{'disabled':!LMS_P_MAI || (playerStatus.count<1 && !infoOpen)}">
  <v-icon>{{infoOpen ? 'info' : 'info_outline'}}</v-icon>
 </v-btn>
 <v-btn icon v-if="!desktopLayout && MBAR_THICK!=mobileBar && !isNowPlayingPage" v-longpress="playPauseButton" class="toolbar-button hide-for-mini" id="pp" :title="playerStatus.isplaying ? trans.pause : trans.play" v-bind:class="{'disabled':!LMS_P_MAI || (playerStatus.count<1 && !infoOpen)}">
  <v-icon>{{playerStatus.isplaying ? 'pause_circle_filled' : 'play_circle_filled'}}</v-icon>
 </v-btn>
 <v-btn icon :title="trans.info | tooltip(LMS_TRACK_INFO_KEYBOARD,keyboardControl)" v-if="desktopLayout" @click.native="emitInfo" class="toolbar-button hide-for-mini" v-bind:class="{'disabled':!LMS_P_MAI || (playerStatus.count<1 && !infoOpen)}" id="info-btn">
  <v-icon id="info-icon">{{infoOpen ? 'info' : 'info_outline'}}</v-icon>
 </v-btn>
 <v-btn icon :title="(nowPlayingExpanded ? trans.hideLarge : trans.showLarge) | tooltip(LMS_EXPAND_NP_KEYBOARD,keyboardControl,true)" v-if="desktopLayout" @click.native="expandNowPlaying()" class="toolbar-button hide-for-mini" v-bind:class="{'disabled':playerStatus.count<1 && !nowPlayingExpanded}" id="np-expand">
  <v-icon>{{nowPlayingExpanded ? 'fullscreen_exit' : 'fullscreen'}}</v-icon>
 </v-btn>
 <v-btn icon :title="trans.toggleQueue | tooltip(LMS_TOGGLE_QUEUE_KEYBOARD,keyboardControl,true)" v-if="desktopLayout" @click.native.stop="toggleQueue()" class="toolbar-button hide-for-mini">
  <v-icon v-if="showQueue">queue_music</v-icon>
  <img v-else class="svg-img" :src="'queue_music_outline' | svgIcon(darkUi, false, true, coloredToolbars)"></img>
 </v-btn>
 <v-menu v-if="connected && showMenuButton" class="hide-for-mini" bottom left v-model="showMainMenu">
  <v-btn slot="activator" icon :title="trans.mainMenu"><img v-if="updatesAvailable" class="svg-badge" :src="'update' | svgIcon(darkUi, true, true, coloredToolbars)"></img><img v-else-if="restartRequired" class="svg-badge" :src="'restart' | svgIcon(darkUi, true, true, coloredToolbars)"></img><v-icon>more_vert</v-icon></v-btn>
  <v-list>
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
     <v-list-tile-avatar><v-icon>{{TB_APP_QUIT.icon}}</v-icon></v-list-tile-avatar>
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
 </v-menu>
 <v-menu v-else-if="!connected && (undefined!=queryParams.appSettings || undefined!=appQuit)" bottom left v-model="showErrorMenu">
  <v-btn slot="activator" icon :title="trans.mainMenu"><v-icon class="red">error</v-icon></v-btn>
  <v-list>
   <v-list-tile @click="bus.$emit('showError', undefined, trans.connectionLost)">
    <v-list-tile-avatar><v-icon>error</v-icon></v-btn></v-list-tile-avatar>
    <v-list-tile-content><v-list-tile-title>{{trans.connectionLost}}</v-list-tile-title></v-list-tile-content>
   </v-list-tile>
   <v-list-tile :href="queryParams.appSettings" v-if="undefined!=queryParams.appSettings">
    <v-list-tile-avatar><img class="svg-img" :src="TB_APP_SETTINGS.svg | svgIcon(darkUi)"></img></v-list-tile-avatar>
    <v-list-tile-content><v-list-tile-title>{{TB_APP_SETTINGS.title}}</v-list-tile-title></v-list-tile-content>
   </v-list-tile>
   <v-divider v-if="undefined!=appQuit"></v-divider>
   <v-list-tile :href="appQuit" v-if="undefined!=appQuit">
    <v-list-tile-avatar><v-icon>{{TB_APP_QUIT.icon}}</v-icon></v-list-tile-avatar>
    <v-list-tile-title>{{TB_APP_QUIT.title}}</v-list-tile-title>
   </v-list-tile>
  </v-list>
 </v-menu>
 <v-btn v-else-if="!connected" icon :title="trans.connectionLost" @click.native="bus.$emit('showError', undefined, trans.connectionLost)">
  <v-icon class="red">error</v-icon>
 </v-btn>
 <div class="drag-area-right"></div>
 <lms-windowcontrols v-if="queryParams.nativeTitlebar"></lms-windowcontrols>
</v-toolbar>
</div>
    `,
    data() {
        return { playlist: { count: "", duration: "" },
                 playerStatus: { ison: 1, isplaying: false, volume: 0, synced: false, sleepTime: undefined, count:0, alarm: undefined, alarmStr: undefined },
                 npInfo: "...",
                 queueInfo: "...",
                 menuItems: [],
                 customActions:undefined,
                 customSettingsActions:undefined,
                 customPlayerActions:undefined,
                 showPlayerMenu: false,
                 showMainMenu: false,
                 showErrorMenu: false,
                 trans:{noplayer:undefined, nothingplaying:undefined, info:undefined, connectionLost:undefined, showLarge:undefined,
                        hideLarge:undefined, groupPlayers:undefined, standardPlayers:undefined, otherServerPlayers:undefined,
                        updatesAvailable:undefined, showVol:undefined, downloading:undefined, mainMenu: undefined, play:undefined,
                        pause:undefined, toggleQueue:undefined, groupVol:undefined, restartRequired:undefined},
                 infoOpen: false,
                 nowPlayingExpanded: false,
                 playerVolume: 0,
                 playerMuted: false,
                 playerDvc: VOL_STD,
                 connected: true,
                 width: 100,
                 height: 300,
                 updateProgress: {show:false, text:undefined},
                 date: undefined,
                 time: undefined,
                 appQuit: queryParams.appQuit,
                 appLaunchPlayer: queryParams.appLaunchPlayer
               }
    },
    mounted() {
        if (queryParams.nativeTitlebar) {
            document.documentElement.style.setProperty('--drag-area-height', '0px');
        }
        setTimeout(function () {
            this.width = Math.floor(window.innerWidth/50)*50;
            this.height = Math.floor(window.innerHeight/50)*50;
        }.bind(this), 1000);
        bus.$on('windowWidthChanged', function() {
            this.width = Math.floor(window.innerWidth/50)*50;
        }.bind(this));
        bus.$on('windowHeightChanged', function() {
            this.height = Math.floor(window.innerHeight/50)*50;
        }.bind(this));

        bus.$on('scanProgress', function(text) {
            if (undefined!=text) {
                this.updateProgress.show=true;
                this.updateProgress.text=text=='?' ? i18n("In progress") : text;
            } else if (this.updateProgress.show) {
                this.updateProgress.show=false;
                this.updateProgress.text=undefined;
            }
        }.bind(this));

        bus.$on('queueStatus', function(count, duration) {
            this.queueInfo = (count>0 ? i18np("1 Track", "%1 Tracks", count) : "") + (duration>0 ? (SEPARATOR + formatSeconds(Math.floor(duration))) : "")
            if (isEmpty(this.queueInfo)) {
                this.queueInfo = "...";
            }
        }.bind(this));
        bus.$on('nowPlayingBrief', function(np) {
            this.npInfo = isEmpty(np) ? "..." : np;
        }.bind(this));
        bus.$on('playerStatus', function(playerStatus) {
            if (playerStatus.ison!=this.playerStatus.ison) {
                this.playerStatus.ison = playerStatus.ison;
            }
            if (playerStatus.isplaying!=this.playerStatus.isplaying) {
                this.playerStatus.isplaying = playerStatus.isplaying;
            }
            if (playerStatus.volume!=this.playerStatus.volume) {
                this.playerStatus.volume = playerStatus.volume;
            }
            this.controlSleepTimer(playerStatus.will_sleep_in);
            if (playerStatus.synced!=this.playerStatus.synced) {
                this.playerStatus.synced = playerStatus.synced;
            }
            if (playerStatus.syncmaster!=this.playerStatus.syncmaster) {
                this.playerStatus.syncmaster = playerStatus.syncmaster;
            }
            if (playerStatus.syncslaves!=this.playerStatus.syncslaves) {
                this.playerStatus.syncslaves = playerStatus.syncslaves;
            }
            this.playerStatus.count=playerStatus.playlist ? playerStatus.playlist.count : 0;
            this.playerDvc = playerStatus.dvc;
            this.playerMuted = playerStatus.muted;
            var vol = playerStatus.volume;
            if (vol != this.playerVolume) {
                this.playerVolume = vol;
            }
            this.playerId = ""+this.$store.state.player.id;
            if (this.playerStatus.alarm!=playerStatus.alarm) {
                if (undefined==playerStatus.alarm) {
                    this.playerStatus.alarmStr = undefined;
                } else {
                    let alarmDate = new Date(playerStatus.alarm*1000);
                    this.playerStatus.alarmStr = dateStr(alarmDate, this.$store.state.lang)+" "+timeStr(alarmDate, this.$store.state.lang);
                }
                this.playerStatus.alarm=playerStatus.alarm;
            }
        }.bind(this));
        
        bus.$on('langChanged', function() {
            this.initItems();
        }.bind(this));
        this.initItems();

        bus.$on('closeMenu', function() {
            this.showPlayerMenu = false;
            this.showMainMenu = false;
            this.showErrorMenu = false;
        }.bind(this));
        bus.$on('infoDialog', function(val) {
            this.infoOpen = val;
            this.initItems();
        }.bind(this));
        bus.$on('nowPlayingExpanded', function(val) {
            this.nowPlayingExpanded = val;
        }.bind(this));

        bus.$on('playerChanged', function() {
            // Ensure we update volume when player changes.
            this.playerVolume = undefined;
        }.bind(this));

        bus.$on('nowPlayingClockChanged', function() {
            this.controlClock();
        }.bind(this));
        this.controlClock();

        bus.$on('networkStatus', function(connected) {
            if (connected) {
                this.connected = true;
                this.cancelDisconnectedTimer();
            } else if (this.connected && !this.disconnectedTimer) {
                // Delay showing warning for 5s
                this.disconnectedTimer = setInterval(function () {
                    this.connected = false;
                }.bind(this), 5000);
            }
        }.bind(this));
        bus.$on('customActions', function() {
            if (undefined==this.customActions) {
                this.customActions = getCustomActions(undefined, this.$store.state.unlockAll);
                this.customSettingsActions = getCustomActions("settings", this.$store.state.unlockAll);
                this.customPlayerActions = getCustomActions("players", this.$store.state.unlockAll);
            }
        }.bind(this));
        bus.$on('lockChanged', function() {
            this.customActions = getCustomActions(undefined, this.$store.state.unlockAll);
            this.customSettingsActions = getCustomActions("settings", this.$store.state.unlockAll);
        }.bind(this));
        this.customActions = getCustomActions(undefined, this.$store.state.unlockAll);
        this.customSettingsActions = getCustomActions("settings", this.$store.state.unlockAll);

        if (!IS_MOBILE && !LMS_KIOSK_MODE) {
            bindKey(LMS_UI_SETTINGS_KEYBOARD, 'mod');
            bindKey(LMS_PLAYER_SETTINGS_KEYBOARD, 'mod');
            bindKey(LMS_SERVER_SETTINGS_KEYBOARD, 'mod');
            bindKey(LMS_INFORMATION_KEYBOARD, 'mod');
            bindKey(LMS_MANAGEPLAYERS_KEYBOARD, 'mod');
            bindKey(LMS_TOGGLE_QUEUE_KEYBOARD, 'mod+shift');
            for (var i=0; i<=9; ++i) {
                bindKey(''+i, 'alt');
            }
            bus.$on('keyboard', function(key, modifier) {
                if (this.$store.state.openDialogs.length>1 || (1==this.$store.state.openDialogs.length && this.$store.state.openDialogs[0]!='info-dialog')) {
                    return;
                }
                if ('mod'==modifier) {
                    if (this.$store.state.visibleMenus.size==1 && this.$store.state.visibleMenus.has('main')) {
                        if (LMS_UI_SETTINGS_KEYBOARD==key || LMS_PLAYER_SETTINGS_KEYBOARD==key ||  LMS_SERVER_SETTINGS_KEYBOARD==key || LMS_INFORMATION_KEYBOARD==key) {
                            this.menuAction(LMS_UI_SETTINGS_KEYBOARD==key ? TB_UI_SETTINGS.id : LMS_PLAYER_SETTINGS_KEYBOARD==key ? TB_PLAYER_SETTINGS.id : 
                                            LMS_SERVER_SETTINGS_KEYBOARD==key ? TB_SERVER_SETTINGS.id : TB_INFO.id);
                            this.showMainMenu = false;
                        }
                    } else if (this.$store.state.visibleMenus.size==1 && this.$store.state.visibleMenus.has('player')) {
                        if (LMS_MANAGEPLAYERS_KEYBOARD==key && this.$store.state.players.length>1) {
                            this.menuAction(TB_MANAGE_PLAYERS.id);
                            this.showPlayerMenu = false;
                        }
                    } else if (this.$store.state.visibleMenus.size==0) {
                        if (LMS_UI_SETTINGS_KEYBOARD==key || LMS_PLAYER_SETTINGS_KEYBOARD==key || LMS_SERVER_SETTINGS_KEYBOARD==key || LMS_INFORMATION_KEYBOARD==key ||
                            (LMS_MANAGEPLAYERS_KEYBOARD==key && this.$store.state.players.length>1)) {
                            this.menuAction(LMS_UI_SETTINGS_KEYBOARD==key ? TB_UI_SETTINGS.id : LMS_PLAYER_SETTINGS_KEYBOARD==key ? TB_PLAYER_SETTINGS.id :
                                            LMS_SERVER_SETTINGS_KEYBOARD==key ? TB_SERVER_SETTINGS.id :
                                            LMS_INFORMATION_KEYBOARD==key ? TB_INFO.id : TB_MANAGE_PLAYERS.id);
                        }
                    }
                } else if ('alt'==modifier && 1==key.length && !isNaN(key)) {
                    var player = parseInt(key);
                    if (player==0) {
                        player=10;
                    } else {
                        player=player-1;
                    }
                    if (player<this.$store.state.players.length) {
                        var id = this.$store.state.players[player].id;
                        if (id!=this.$store.state.player.id) {
                            this.setPlayer(id);
                        }
                    }
                } else if ('mod+shift'==modifier && LMS_TOGGLE_QUEUE_KEYBOARD==key && this.$store.state.desktopLayout) {
                    this.toggleQueue();
                }
            }.bind(this));
        }
    },
    methods: {
        initItems() {
            TB_SETTINGS.title=i18n('Settings');
            TB_UI_SETTINGS.title=i18n('Interface settings');
            TB_UI_SETTINGS.stitle=i18n('Interface');
            TB_UI_SETTINGS.shortcut=shortcutStr(LMS_UI_SETTINGS_KEYBOARD);
            TB_PLAYER_SETTINGS.title=i18n('Player settings');
            TB_PLAYER_SETTINGS.stitle=i18n('Player');
            TB_PLAYER_SETTINGS.shortcut=shortcutStr(LMS_PLAYER_SETTINGS_KEYBOARD);
            TB_SERVER_SETTINGS.title=i18n('Server settings');
            TB_SERVER_SETTINGS.stitle=i18n('Server');
            TB_SERVER_SETTINGS.shortcut=shortcutStr(LMS_SERVER_SETTINGS_KEYBOARD);
            TB_INFO.title=i18n('Information');
            TB_INFO.shortcut=shortcutStr(LMS_INFORMATION_KEYBOARD);
            TB_HELP.title=i18n('Help');
            TB_MANAGE_PLAYERS.title=i18n('Manage players');
            TB_MANAGE_PLAYERS.shortcut=shortcutStr(LMS_MANAGEPLAYERS_KEYBOARD);
            TB_APP_SETTINGS.title=i18n('Application settings');
            TB_APP_SETTINGS.stitle=i18n('Application');
            TB_APP_QUIT.title=i18n('Quit');
            TB_START_PLAYER.title=i18n('Start player');
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
            this.trans = {noplayer:i18n('No Player'), nothingplaying:i18n('Nothing playing'), info:i18n("Show current track information"),
                          showLarge:i18n("Expand now playing"), hideLarge:i18n("Collapse now playing"), connectionLost:i18n('Server connection lost!'),
                          groupPlayers:i18n("Group Players"), standardPlayers:i18n("Standard Players"), updatesAvailable:i18n('Updates available'),
                          showVol:i18n("Show volume"), mainMenu: i18n("Main menu"), play:i18n("Play"), pause:i18n("Pause"),
                          toggleQueue:i18n('Toggle queue'), downloading:i18n('Downloading'), groupVol:i18n('Adjust volume of associated players'),
                          restartRequired:i18n('Restart required')};
        },
        setPlayer(id) {
            if (id != this.$store.state.player.id) {
                this.$store.commit('setPlayer', id);
            }
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
        menuAction(id) {
            if (TB_UI_SETTINGS.id==id) {
                bus.$emit('dlg.open', 'uisettings');
            } else if (TB_PLAYER_SETTINGS.id==id) {
                bus.$emit('dlg.open', 'playersettings');
            } else if (TB_SERVER_SETTINGS.id==id) {
                if (this.$store.state.unlockAll) {
                    lmsCommand("", ["material-skin", "server"]).then(({data}) => {
                        if (data && data.result) {
                            openServerSettings(data.result.libraryname, 0);
                        }
                    }).catch(err => {
                    });
                }
            } else if (TB_INFO.id==id) {
                bus.$emit('dlg.open', 'info');
            } else if (TB_HELP.id==id) {
                bus.$emit('dlg.open', 'iframe', '/material/html/material-skin/index.html', TB_HELP.title, undefined, 0);
            } else if (TB_MANAGE_PLAYERS.id==id) {
                bus.$emit('dlg.open', 'manage');
            } else {
                bus.$emit('toolbarAction', id);
            }
        },
        emitInfo() {
            if (this.$store.state.visibleMenus.size>0) {
                return;
            }
            if (LMS_P_MAI) {
                bus.$emit('info');
                if (!this.$store.state.desktopLayout) {
                    this.$store.commit('setPage', 'now-playing');
                }
            }
        },
        expandNowPlaying() {
            if (this.$store.state.visibleMenus.size>0) {
                return;
            }
            if (!this.nowPlayingExpanded && this.playerStatus.count<1) {
                return;
            }
            bus.$emit('expandNowPlaying', !this.nowPlayingExpanded);
            if (!this.$store.state.pinQueue && this.$store.state.showQueue) {
                this.$store.commit('setShowQueue', false);
            }
        },
        handlePlayerToolbarButton(longPress, el, event) {
            if (queryParams.party) {
                return;
            }
            storeClickOrTouchPos(event);
            // Dont react to presses for 0.5s after dialog closed. The button is very close to where
            // a dialogs back button is and user might accidentaly presss twice...
            if (undefined!=this.$store.state.lastDialogClose && new Date().getTime()-this.$store.state.lastDialogClose<500) {
                return;
            }
            if (this.$store.state.powerButton) {
                this.togglePlayerPower(this.$store.state.player, longPress);
            } else {
                if (longPress) {
                    this.showPlayerMenu = false;
                    bus.$emit('dlg.open', 'sync', this.$store.state.player);
                } else {
                    this.showPlayerMenu = !this.showPlayerMenu;
                }
            }
        },
        togglePlayerPower(player, longPress) {
            if (queryParams.party) {
                return;
            }
            if (longPress) {
                this.showPlayerMenu = false;
                bus.$emit('dlg.open', 'sleep', player);
            } else {
                let ison = this.$store.state.player.id == player.id ? this.playerStatus.ison : player.ison;
                if (1==queryParams.nativePlayerPower) {
                    try {
                        if (1==NativeReceiver.controlLocalPlayerPower(player.id, player.ip, ison ? 0 : 1)) {
                            setTimeout(function () {
                                bus.$emit('refreshServerStatus');
                                setTimeout(function () { bus.$emit('refreshServerStatus');}.bind(this), 1000);
                            }.bind(this), 500);
                            return;
                        }
                    } catch (e) {
                    }
                } else if (queryParams.nativePlayerPower>0) {
                    emitNative("MATERIAL-PLAYERPOWER\nID " + player.id+"\nIP "+player.ip+"\nSTATE "+(ison ? 0 : 1), queryParams.nativePlayerPower);
                }
                lmsCommand(player.id, ["power", ison ? "0" : "1"]).then(({data}) => {
                    bus.$emit('refreshStatus', player.id);
                    // Status seems to take while to update, so check again 1/2 second later...
                    setTimeout(function () {
                        bus.$emit('refreshStatus', player.id);
                        // And after a further second?
                        setTimeout(function () { bus.$emit('refreshStatus', player.id); }.bind(this), 1000);
                    }.bind(this), 500);
                });
            }
        },
        togglePower(longPress, el, event) {
            storeClickOrTouchPos(event);
            if (queryParams.party) {
                return;
            }
            let idx = parseInt(el.id.split("-")[0]);
            if (idx>=0 && idx<=this.$store.state.players.length) {
                this.togglePlayerPower(this.$store.state.players[idx], longPress);
            }
        },
        volumeBtn(longPress, el) {
            if (this.$store.state.visibleMenus.size>0 || this.noPlayer || undefined==el || undefined==el.id || queryParams.party) {
                return;
            }
            if (this.playerMuted) {
                bus.$emit('playerCommand', ['mixer', 'muting', 0]);
            } else if (longPress && VOL_FIXED!=this.playerDvc) {
                bus.$emit('playerCommand', ['mixer', 'muting', 1]);
            } else {
                bus.$emit('dlg.open', window.innerHeight>=250 && this.playerStatus.synced && !queryParams.single ? 'groupvolume' : 'volume', this.playerStatus, true);
            }
        },
        setVolume(val) {
            if (queryParams.party) {
                return;
            }
            this.playerVolume = val;
            bus.$emit('playerCommand', ["mixer", "volume", this.playerVolume]);
        },
        toggleMute() {
            if (this.noPlayer || VOL_STD!=this.playerDvc || queryParams.party || this.$store.state.visibleMenus.size>0) {
                return;
            }
            bus.$emit('playerCommand', ['mixer', 'muting', this.playerMuted ? 0 : 1]);
        },
        volumeUp() {
            if (queryParams.party || this.$store.state.visibleMenus.size>0) {
                return;
            }
            bus.$emit('playerCommand', ["mixer", "volume", "+"+lmsOptions.volumeStep]);
        },
        volumeDown() {
            if (queryParams.party || this.$store.state.visibleMenus.size>0) {
                return;
            }
            bus.$emit('playerCommand', ["mixer", "volume", "-"+lmsOptions.volumeStep]);
        },
        volWheel(event) {
            if (event.deltaY<0) {
                this.volumeUp();
            } else if (event.deltaY>0) {
                this.volumeDown();
            }
        },
        playPauseButton(long) {
            if (this.$store.state.visibleMenus.size>0 || this.noPlayer) {
                return;
            }
            if (long) {
                bus.$emit('dlg.open', 'sleep', this.$store.state.player);
            } else {
                bus.$emit('playerCommand', [this.playerStatus.isplaying ? 'pause' : 'play']);
            }
        },
        showSleep() {
            if (this.$store.state.visibleMenus.size>0 || this.noPlayer) {
                return;
            }
            bus.$emit('dlg.open', 'sleep', this.$store.state.player);
        },
        cancelSleepTimer() {
            this.playerStatus.sleepTime = undefined;
            if (undefined!==this.playerStatus.sleepTimer) {
                clearInterval(this.playerStatus.sleepTimer);
                this.playerStatus.sleepTimer = undefined;
            }
        },
        controlSleepTimer(timeLeft) {
            if (undefined!=timeLeft && timeLeft>1) {
                timeLeft = Math.floor(timeLeft);
                if (this.playerStatus.sleepTimeLeft!=timeLeft) {
                    this.cancelSleepTimer();
                    this.playerStatus.sleepTime = timeLeft;
                    this.playerStatus.sleepTimeLeft = this.playerStatus.sleepTime;
                    this.playerStatus.sleepStart = new Date();

                    this.playerStatus.sleepTimer = setInterval(function () {
                        var current = new Date();
                        var diff = (current.getTime()-this.playerStatus.sleepStart.getTime())/1000.0;
                        this.playerStatus.sleepTime = this.playerStatus.sleepTimeLeft - diff;
                        if (this.playerStatus.sleepTime<=0) {
                            this.playerStatus.sleepTime = undefined;
                                this.cancelSleepTimer();
                        }
                    }.bind(this), 1000);
                }
            } else {
                this.cancelSleepTimer();
            }
        },
        cancelDisconnectedTimer() {
            if (undefined!==this.disconnectedTimer) {
                clearInterval(this.disconnectedTimer);
                this.disconnectedTimer = undefined;
            }
        },
        controlClock() {
            if (this.$store.state.nowPlayingClock) {
                if (undefined==this.clockTimer) {
                    this.updateClock();
                }
            } else {
                this.cancelClockTimer();
            }
        },
        cancelClockTimer() {
            if (undefined!==this.clockTimer) {
                clearTimeout(this.clockTimer);
                this.clockTimer = undefined;
            }
        },
        updateClock() {
            var date = new Date();
            this.date = dateStr(date, this.$store.state.lang);
            this.time = timeStr(date, this.$store.state.lang);
            if (undefined!==this.clockTimer) {
                clearTimeout(this.clockTimer);
            }
            var next = 60-date.getSeconds();
            this.clockTimer = setTimeout(function () {
                this.updateClock();
            }.bind(this), (next*1000)+25);
        },
        startStatusTimer() {
            // Have player menu open, so poll LMS server for updates in case another player starts or stops playback
            if (undefined==this.statusTimer) {
                this.statusTimer = setInterval(function () {
                    if (this.$store.state.players && this.$store.state.players.length>1) {
                        bus.$emit('refreshServerStatus');
                    }
                }.bind(this), 2500);
            }
        },
        cancelStatusTimer() {
            if (undefined!==this.statusTimer) {
                clearInterval(this.statusTimer);
                this.statusTimer = undefined;
            }
        },
        doCustomAction(action) {
            performCustomAction(action, this.$store.state.player);
        },
        toggleQueue() {
            if (!this.$store.state.pinQueue) {
                this.$store.commit('setShowQueue', !this.$store.state.showQueue);
            } else {
                let showQ = this.infoOpen || this.nowPlayingExpanded;
                if (showQ) {
                    bus.$emit('npclose');
                }
                this.$store.commit('setShowQueue', showQ || !this.$store.state.showQueue);
            }
        },
        mouseDown(ev) {
            toolbarMouseDown(ev);
        }
    },
    computed: {
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
        isNowPlayingPage() {
            return this.$store.state.page == 'now-playing'
        },
        currentPage() {
            return this.$store.state.desktopLayout ? this.nowPlayingExpanded ? 'now-playing' : this.showQueue ? 'queue' : 'other' : this.$store.state.page
        },
        mobileBar() {
            return this.$store.state.mobileBar
        },
        noPlayer () {
            return !this.$store.state.players || this.$store.state.players.length<1
        },
        darkUi () {
            return this.$store.state.darkUi
        },
        menuVisible() {
            return this.$store.state.visibleMenus.size>0
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
        },
        desktopLayout() {
            return this.$store.state.desktopLayout
        },
        showQueue() {
            return this.$store.state.showQueue
        },
        showVolumeSlider() {
            return VOL_HIDDEN!=this.playerDvc && this.width>=(this.$store.state.desktopLayout ? (this.height>=200 ? 750 : 600) : (this.$store.state.nowPlayingClock ? 1300 : (this.$store.state.mobileBar==MBAR_NONE ? 850 : 750)))
        },
        showUpdateProgress() {
            return (!this.$store.state.nowPlayingClock || (this.$store.state.desktopLayout ? !this.nowPlayingExpanded : (this.$store.state.page != 'now-playing'))) && this.width>=1050
        },
        showClock() {
            return this.$store.state.nowPlayingClock && (this.$store.state.desktopLayout
                                                            ? (this.nowPlayingExpanded && this.width>=1300) : (this.$store.state.page == 'now-playing' && this.width>=500))
        },
        powerButton() {
            return this.$store.state.powerButton
        },
        downloadCount() {
            return this.$store.state.downloadStatus.length
        },
        coloredToolbars() {
            return this.$store.state.coloredToolbars
        },
        showMenuButton() {
            return !LMS_KIOSK_MODE || (undefined!=this.customSettingsActions && this.customSettingsActions.length>0) || (undefined!=this.customActions && this.customActions.length>0)
        }
    },
    filters: {
        displayTime: function (value) {
            if (undefined==value) {
                return '';
            }
            return formatSeconds(Math.floor(value));
        },
        displayVolume: function (value, dvc) {
            if (undefined==value || VOL_STD!=dvc) {
                return '';
            }
            return (isNaN(value) ? 0 : value)+"%";
        },
        svgIcon: function (name, dark, badge, toolbar, coloredToolbars) {
            return "/material/svg/"+name+"?c="+(badge ? toolbar ? (coloredToolbars ? "fff" : LMS_UPDATE_SVG) : LMS_UPDATE_SVG : (dark || (toolbar && coloredToolbars) ? LMS_DARK_SVG : LMS_LIGHT_SVG))+"&r="+LMS_MATERIAL_REVISION;
        },
        tooltip: function (str, shortcut, showShortcut, shift) {
            return showShortcut ? ttShortcutStr(str, shortcut, shift) : str;
        },
        playerShortcut: function(index) {
            return IS_APPLE ? ("⌥+"+(9==index ? 0 : index+1)) : i18n("Alt+%1", 9==index ? 0 : index+1);
        }
    },
    watch: {
        'showPlayerMenu': function(newVal) {
            this.$store.commit('menuVisible', {name:'player', shown:newVal});
            if (newVal) {
                bus.$emit('refreshServerStatus');
                this.startStatusTimer();
            } else {
                this.cancelStatusTimer();
            }
        },
        'showMainMenu': function(newVal) {
            this.$store.commit('menuVisible', {name:'main', shown:newVal});
        },
        'showErrorMenu': function(newVal) {
            this.$store.commit('menuVisible', {name:'error', shown:newVal});
        }
    },
    beforeDestroy() {
        this.cancelSleepTimer();
        this.cancelDisconnectedTimer();
        this.cancelClockTimer();
        this.cancelStatusTimer();
    }
})
