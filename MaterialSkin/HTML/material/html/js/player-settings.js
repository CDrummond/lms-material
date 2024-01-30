/**
 * LMS-Material
 *
 * Copyright (c) 2018-2024 Craig Drummond <craig.p.drummond@gmail.com>
 * MIT license.
 */
'use strict';

var DAYS_OF_WEEK = ['Sun', 'Mon', 'Tues', 'Weds', 'Thurs', 'Fri', 'Sat'];

Vue.component('lms-player-settings', {
    template: `
<div>
 <v-dialog v-model="show" v-if="show" persistent no-click-animation scrollable fullscreen>
  <v-card>
   <v-card-title class="settings-title">
    <v-toolbar app-data class="dialog-toolbar" @mousedown="mouseDown" id="playersettings-toolbar">
     <div class="drag-area-left"></div>
     <v-btn flat icon v-longpress:stop="close" :title="ttShortcutStr(i18n('Go back'), 'esc')"><v-icon>arrow_back</v-icon></v-btn>
     <v-btn v-if="showHome && homeButton" flat icon @click="goHome" :title="ttShortcutStr(i18n('Go home'), 'home')"><v-icon>home</v-icon></v-btn>
     <v-toolbar-title v-if="numPlayers>1" @click="openPlayerMenu" class="pointer">{{TB_PLAYER_SETTINGS.title+SEPARATOR+playerName}}</v-toolbar-title>
     <v-toolbar-title v-else>{{TB_PLAYER_SETTINGS.title+SEPARATOR+playerName}}</v-toolbar-title>
     <v-spacer class="drag-area"></v-spacer>
     <v-menu bottom left v-model="showMenu">
      <v-btn icon slot="activator"><v-icon>more_vert</v-icon></v-btn>
      <v-list>
       <template v-for="(action, index) in customActions">
        <v-list-tile @click="doCustomAction(action, {id:playerId, name:playerName})">
         <v-list-tile-avatar><v-icon v-if="action.icon">{{action.icon}}</v-icon><img v-else-if="action.svg" class="svg-img" :src="action.svg | svgIcon(darkUi)"></img></v-list-tile-avatar>
         <v-list-tile-content><v-list-tile-title>{{action.title}}</v-list-tile-title></v-list-tile-content>
        </v-list-tile>
       </template>
       <v-divider v-if="customActions && customActions.length>0"></v-divider>
       <v-list-tile @click="setSleep">
        <v-list-tile-avatar><v-icon class="btn-icon">hotel</v-icon></v-list-tile-avatar>
        <v-list-tile-content><v-list-tile-title>{{i18n('Sleep')}}</v-list-tile-title></v-list-tile-content>
       </v-list-tile>
       <v-list-tile v-if="showSync" @click="bus.$emit('dlg.open', 'sync', {id:playerId, isgroup:false, name:playerName})">
        <v-list-tile-avatar><v-icon class="btn-icon">link</v-icon></v-list-tile-avatar>
        <v-list-tile-content><v-list-tile-title>{{i18n('Synchronize')}}</v-list-tile-title></v-list-tile-content>
       </v-list-tile>
       <v-list-tile v-if="unlockAll" @click="showExtraSettings">
        <v-list-tile-avatar><img class="svg-img" :src="'configure'| svgIcon(darkUi)"></img></v-list-tile-avatar>
        <v-list-tile-content><v-list-tile-title>{{i18n('Extra settings')}}</v-list-tile-title></v-list-tile-content>
       </v-list-tile>
       <v-list-tile v-if="unlockAll && playerLink" @click="showConfig">
        <v-list-tile-avatar><v-icon>build</v-icon></v-list-tile-avatar>
        <v-list-tile-content><v-list-tile-title>{{i18n('Configuration')}}</v-list-tile-title></v-list-tile-content>
       </v-list-tile>
       <v-list-tile v-for="(plugin, index) in plugins" @click="showPlugin(index)">
        <v-list-tile-avatar>
         <img v-if="plugin.svg" class="svg-img" :src="plugin.svg| svgIcon(darkUi)"></img>
         <v-icon v-else-if="plugin.icon">{{plugin.icon}}</v-icon>
         <img v-else-if="plugin.image" class="svg-img" :key="plugin.image" v-lazy="plugin.image">
        </v-list-tile-avatar>
        <v-list-tile-content><v-list-tile-title>{{plugin.title}}</v-list-tile-title></v-list-tile-content>
       </v-list-tile>
      </v-list>
     </v-menu>
     <div class="drag-area-right"></div>
     <lms-windowcontrols v-if="queryParams.nativeTitlebar"></lms-windowcontrols>
    </v-toolbar>
   </v-card-title>

  <v-card-text>
   <v-list two-line subheader class="settings-list">
    <v-header class="dialog-section-header" v-if="unlockAll">{{i18n('General')}}</v-header>
    <v-list-tile v-if="unlockAll">
     <v-list-tile-content>
      <v-text-field clearable autocorrect="off" :label="i18n('Name')" v-model="playerName" class="lms-search"></v-text-field>
     </v-list-tile-content>
     <v-list-tile-action><v-btn icon flat @click="setIcon" style="margin-top:-18px"><v-icon v-if="playerIcon.icon">{{playerIcon.icon}}</v-icon><img v-else class="svg-img" :src="playerIcon.svg | svgIcon(darkUi)"></img></v-btn></v-list-tile-action>
    </v-list-tile>
    <div class="dialog-padding" v-if="unlockAll"></div>
    <v-header class="dialog-section-header">{{i18n('Audio')}}</v-header>
    <v-list-tile>
     <v-select :items="crossfadeItems" :label="i18n('On song change')" v-model="crossfade" item-text="label" item-value="key"></v-select>
    </v-list-tile>
    <v-divider></v-divider>
    <v-list-tile :disabled="0==crossfade" v-bind:class="{'disabled':0==crossfade}">
     <v-list-tile-content @click="smartCrossfade = !smartCrossfade" class="switch-label">
      <v-list-tile-title>{{i18n('Smart crossfade')}}</v-list-tile-title>
      <v-list-tile-sub-title>{{i18n("Do not crossfade successive tracks from the same album.")}}</v-list-tile-sub-title>
     </v-list-tile-content>
     <v-list-tile-action><m3-switch v-model="smartCrossfade"></m3-switch></v-list-tile-action>
    </v-list-tile>
    <v-divider></v-divider>
    <v-list-tile>
     <v-select :items="replaygainItems" :label="i18n('Volume gain')" v-model="replaygain" item-text="label" item-value="key"></v-select>
    </v-list-tile>
    <v-divider v-if="dstmItems && dstmItems.length>1"></v-divider>
    <v-list-tile v-if="dstmItems && dstmItems.length>1">
     <v-select :items="dstmItems" :label="trans.dstm" v-model="dstm" item-text="label" item-value="key"></v-select>
    </v-list-tile>
     
    <div class="dialog-padding" v-if="unlockAll"></div>
    <v-header class="dialog-section-header" v-if="unlockAll" id="alarms">{{i18n('Alarms')}}</v-header>
     <v-list-tile v-if="unlockAll">
      <v-list-tile-content @click="alarms.on=!alarms.on;toggleAllAlarms()" class="switch-label">
       <v-list-tile-title>{{i18n('Enable alarms')}}</v-list-tile-title>
       <v-list-tile-sub-title>{{i18n('Enable alarm functionality.')}}</v-list-tile-sub-title>
      </v-list-tile-content>
      <v-list-tile-action><m3-switch v-model="alarms.on" @click="toggleAllAlarms()"></m3-switch></v-list-tile-action>
     </v-list-tile>
     <v-divider v-if="showAlarms"></v-divider>
     <div class="settings-sub-pad" v-if="showAlarms"></div>
     <v-header class="alarm-sched-header" v-if="showAlarms">{{i18n('Scheduled alarms')}}</v-header>
     <template v-for="(item, index) in alarms.scheduled" v-if="showAlarms">
      <v-list-tile class="alarm-entry">
       <v-checkbox v-model="item.enabled" :label="item | formatAlarm(twentyFourHour)" @click.stop="toggleAlarm(item)"></v-checkbox>
       <v-btn flat icon @click.stop="editAlarm(item)" class="toolbar-button"><v-icon>edit</v-icon></v-btn>
       <v-btn flat icon @click.stop="deleteAlarm(item)" class="toolbar-button"><v-icon>delete</v-icon></v-btn>
      </v-list-tile>
      <v-divider v-if="(index+1 < alarms.scheduled.length)" class="alarm-divider"></v-divider>
     </template>
     <v-list-tile v-if="showAlarms"><v-btn flat @click.stop="addAlarm()" class="alarm-add"><v-icon class="btn-icon">alarm_add</v-icon>{{i18n("Add alarm")}}</v-btn></v-list-tile>
     <div class="settings-sub-pad" v-if="showAlarms"></div>
     <v-header v-if="showAlarms">{{i18n('Alarm settings')}}</v-header>
     <v-list-tile v-if="showAlarms">
      <v-text-field :label="i18n('Volume (%)')" v-model="alarms.volume" type="number"></v-text-field>
     </v-list-tile>
     <v-divider v-if="showAlarms"></v-divider>
     <v-list-tile v-if="showAlarms">
      <v-text-field :label="i18n('Snooze (minutes)')" v-model="alarms.snooze" type="number"></v-text-field>
     </v-list-tile>
     <v-divider v-if="showAlarms"></v-divider>
     <v-list-tile v-if="showAlarms">
      <v-text-field :label="i18n('Timeout (minutes)')" v-model="alarms.timeout" type="number"></v-text-field>
     </v-list-tile>
     <v-divider v-if="showAlarms"></v-divider>
     <v-list-tile v-if="showAlarms">
      <v-list-tile-content @click="alarms.fade=!alarms.fade" class="switch-label">
       <v-list-tile-title>{{i18n('Fade in')}}</v-list-tile-title>
       <v-list-tile-sub-title>{{i18n('Fade in alarms when starting.')}}</v-list-tile-sub-title>
      </v-list-tile-content>
      <v-list-tile-action><m3-switch v-model="alarms.fade"></m3-switch></v-list-tile-action>
     </v-list-tile>

     <div v-if="libraries.length>1" class="dialog-padding"></div>
     <v-header v-if="libraries.length>1" class="dialog-section-header">{{i18n('Library')}}</v-header>
     <v-list-tile class="settings-note" v-if="libraries.length>1"><p>{{i18n("Each player may be assigned a 'virtual' library. If set then this will be used to restrict song selection for 'Random Mix' (only songs from the chosen library will be used), and other modes. This setting might also affect library browsing with other LMS control points (such as the default web UI).")}}<br/><br/>{{i18n("Please note, the setting here will not affect this control point. To change the library of this control point you need to use the context menu button for 'My Music', or use the 'Change library' button when browsing 'My Music'")}}</p></v-list-tile>
     <v-list-tile v-if="libraries.length>1">
      <v-select :items="libraries" :label="i18n('Library')" v-model="library" item-text="name" item-value="id"></v-select>
     </v-list-tile>

     <div class="dialog-padding"></div>
     <v-header>{{i18n('Other settings')}}</v-header>
     <v-list-tile class="other-setting">
      <v-list-tile-content>
       <v-list-tile-title><v-btn flat @click="setSleep"><v-icon class="btn-icon">hotel</v-icon>{{i18n('Sleep')}} {{sleepTime | displayTime}}</v-btn></v-list-tile-title>
       <v-list-tile-sub-title>{{i18n("Control when player should 'sleep'.")}}</v-list-tile-sub-title>
      </v-list-tile-content>
     </v-list-tile>
     <v-list-tile v-if="showSync" class="other-setting">
      <v-list-tile-content>
       <v-list-tile-title><v-btn flat @click="bus.$emit('dlg.open', 'sync', {id:playerId, isgroup:false, name:playerName})"><v-icon class="btn-icon">link</v-icon>{{i18n('Synchronize')}}</v-btn></v-list-tile-title>
       <v-list-tile-sub-title>{{isSynced ? i18n('Synchronized with other players.') : i18n('Not currently synchronised with any other player.')}}</v-list-tile-sub-title>
      </v-list-tile-content>
     </v-list-tile>
     <v-list-tile v-if="unlockAll" class="other-setting">
      <v-list-tile-content>
       <v-list-tile-title><v-btn flat @click="showExtraSettings"><img class="svg-img btn-icon" :src="'configure'| svgIcon(darkUi)"></img>{{i18n('Extra settings')}}</v-btn></v-list-tile-title>
       <v-list-tile-sub-title>{{i18n('Extra player settings, such as synchronization options, player specific plugin settings, etc.')}}</v-list-tile-sub-title>
      </v-list-tile-content>
     </v-list-tile>
     <v-list-tile v-if="unlockAll && playerLink" class="other-setting">
      <v-list-tile-content>
       <v-list-tile-title><v-btn flat @click="showConfig"><v-icon class="btn-icon">build</v-icon>{{i18n('Configuration')}}</v-btn></v-list-tile-title>
       <v-list-tile-sub-title>{{i18n('Player specific configuration UI, such as piCorePlayer or SqueezeAMP.')}}</v-list-tile-sub-title>
      </v-list-tile-content>
     </v-list-tile>
     <v-list-tile v-for="(plugin, index) in plugins" class="other-setting">
      <v-list-tile-content>
       <v-list-tile-title><v-btn flat v-longpress="pluginPressed" @contextmenu.prevent="" :id="index+'-ps-plugin'">
        <img v-if="plugin.svg" class="svg-img btn-icon" :src="plugin.svg| svgIcon(darkUi)"></img>
        <v-icon v-else-if="plugin.icon">{{plugin.icon}}</v-icon>
        <img v-else-if="plugin.image" class="svg-img btn-icon" :key="plugin.image" v-lazy="plugin.image">
        {{plugin.title}}<img v-if="plugin.pinned" class="svg-img" style="padding-left:8px" :src="'pin'| svgIcon(darkUi)"></img>
       </v-list-tile-title>
      </v-list-tile-content>
     </v-list-tile>
       
     <div class="dialog-padding"></div>

    </v-list>
   </v-card-text>
  </v-card>
 </v-dialog>

 <v-dialog v-model="alarmDialog.show" width="500" persistent>
  <v-card>
  <v-card-title>{{alarmDialog.id ? i18n("Edit alarm") : i18n("Add alarm")}}</v-card-title>
  <v-container>
   <v-list two-line subheader class="settings-list dialog-main-list">
    <v-list-tile class="settings-compact-row">
     <v-dialog ref="dialog" :close-on-content-click="false" v-model="alarmDialog.timepicker" :return-value.sync="alarmDialog.time"
               persistent lazy full-width max-width="290px">
      <v-text-field slot="activator" v-model="formattedTime" :label="i18n('Start time')" prepend-icon="access_time" readonly></v-text-field>
      <v-time-picker v-if="alarmDialog.timepicker" v-model="alarmDialog.time" full-width :format="twentyFourHour?'24hr':'ampm'">
       <v-spacer></v-spacer>
       <v-btn flat v-if="!queryParams.altBtnLayout" @click="alarmDialog.timepicker = false">{{i18n('Cancel')}}</v-btn>
       <v-btn flat @click="$refs.dialog.save(alarmDialog.time)">{{i18n('OK')}}</v-btn>
       <v-btn flat v-if="queryParams.altBtnLayout" @click="alarmDialog.timepicker = false">{{i18n('Cancel')}}</v-btn>
      </v-time-picker>
     </v-dialog>
    </v-list-tile>
    <div class="dialog-padding"></div>
    <v-list-tile class="settings-compact-row" v-if="wide>0">
     <v-flex xs6><v-checkbox class="ellipsis" v-model="alarmDialog.dow" :label="i18n('Monday')" value="1"></v-checkbox></v-flex>
     <v-flex xs6><v-checkbox class="ellipsis" v-model="alarmDialog.dow" :label="i18n('Tuesday')" value="2"></v-checkbox></v-flex>
    </v-list-tile>
    <v-list-tile class="settings-compact-row" v-if="wide>0">
     <v-flex xs6><v-checkbox class="ellipsis" v-model="alarmDialog.dow" :label="i18n('Wednesday')" value="3"></v-checkbox></v-flex>
     <v-flex xs6><v-checkbox class="ellipsis" v-model="alarmDialog.dow" :label="i18n('Thursday')" value="4"></v-checkbox></v-flex>
    </v-list-tile>
    <v-list-tile class="settings-compact-row"><v-checkbox class="ellipsis" v-model="alarmDialog.dow" :label="i18n('Friday')" value="5"></v-checkbox></v-list-tile>
    <v-list-tile class="settings-compact-row" v-if="wide>0">
     <v-flex xs6><v-checkbox class="ellipsis" v-model="alarmDialog.dow" :label="i18n('Saturday')" value="6"></v-checkbox></v-flex>
     <v-flex xs6><v-checkbox class="ellipsis" v-model="alarmDialog.dow" :label="i18n('Sunday')" value="0"></v-checkbox></v-flex>
    </v-list-tile>
    <v-list-tile class="settings-compact-row" v-if="wide==0"><v-checkbox class="ellipsis" v-model="alarmDialog.dow" :label="i18n('Monday')" value="1"></v-checkbox></v-list-tile>
    <v-list-tile class="settings-compact-row" v-if="wide==0"><v-checkbox class="ellipsis" v-model="alarmDialog.dow" :label="i18n('Tuesday')" value="2"></v-checkbox></v-list-tile>
    <v-list-tile class="settings-compact-row" v-if="wide==0"><v-checkbox class="ellipsis" v-model="alarmDialog.dow" :label="i18n('Wednesday')" value="3"></v-checkbox></v-list-tile>
    <v-list-tile class="settings-compact-row" v-if="wide==0"><v-checkbox class="ellipsis" v-model="alarmDialog.dow" :label="i18n('Thursday')" value="4"></v-checkbox></v-list-tile>
    <v-list-tile class="settings-compact-row" v-if="wide==0"><v-checkbox class="ellipsis" v-model="alarmDialog.dow" :label="i18n('Friday')" value="5"></v-checkbox></v-list-tile>
    <v-list-tile class="settings-compact-row" v-if="wide==0"><v-checkbox class="ellipsis" v-model="alarmDialog.dow" :label="i18n('Saturday')" value="6"></v-checkbox></v-list-tile>
    <v-list-tile class="settings-compact-row" v-if="wide==0"><v-checkbox class="ellipsis" v-model="alarmDialog.dow" :label="i18n('Sunday')" value="0"></v-checkbox></v-list-tile>
    <div class="dialog-padding"></div>

    <v-list-tile>
     <v-select :items="alarmSounds" :label="i18n('Sound')" v-model="alarmDialog.url" item-text="label" item-value="key"></v-select>
    </v-list-tile>

    <!-- TODO ????
    <v-list-tile class="settings-compact-row">
     <v-select :items="alarmShuffeItems" :label="i18n('Shuffle')" v-model="alarmDialog.shuffle" item-text="label" item-value="key"></v-select>
    </v-list-tile>
    -->
    <v-list-tile>
     <v-list-tile-content @click="alarmDialog.repeat = !alarmDialog.repeat" class="switch-label">
      <v-list-tile-title>{{i18n('Repeat')}}</v-list-tile-title>
      <v-list-tile-sub-title>{{i18n('Should alarms repeat')}}</v-list-tile-sub-title>
     </v-list-tile-content>
     <v-list-tile-action><m3-switch v-model="alarmDialog.repeat"></m3-switch></v-list-tile-action>
    </v-list-tile>
   </v-list>
  </v-container>
  <div class="dialog-padding"></div>
  <v-card-actions v-if="queryParams.altBtnLayout">
   <v-spacer></v-spacer>
   <v-btn flat @click="saveAlarm()">{{alarmDialog.id ? i18n("Save") : i18n("Create")}}</v-btn>
   <v-btn flat @click="alarmDialog.show = false">{{i18n('Cancel')}}</v-btn>
   </v-card-actions>
  <v-card-actions v-else>
   <v-spacer></v-spacer>
   <v-btn flat @click="alarmDialog.show = false">{{i18n('Cancel')}}</v-btn>
   <v-btn flat @click="saveAlarm()">{{alarmDialog.id ? i18n("Save") : i18n("Create")}}</v-btn>
   </v-card-actions>
  </v-card>
 </v-dialog>

 <v-menu v-model="playerMenu.show" :position-x="playerMenu.x" :position-y="10" style="z-index:1000">
  <v-list>
   <template v-for="(player, index) in players">
    <v-list-tile @click="setPlayer(player)" :disabled="player.id==playerId" v-bind:class="{'disabled':player.id==playerId}">
     <v-list-tile-avatar>
      <v-icon v-if="player.icon.icon">{{player.icon.icon}}</v-icon><img v-else class="svg-img" :src="player.icon.svg | svgIcon(darkUi)"></img>
     </v-list-tile-avatar>
     <v-list-tile-content><v-list-tile-title>{{player.name}}</v-list-tile-title></v-list-tile-content>
    </v-list-tile>
   </template>
  </v-list>
 </v-menu>

</div>
`,
    props: [],
    data() {
        return {
            show: false,
            playerMenu: {show:false, x:0},
            playerId: undefined,
            playerName: undefined,
            playerIcon: undefined,
            playerLink: undefined,
            isGroup: false,
            isSynced: false,
            crossfade: undefined,
            smartCrossfade: false,
            replaygain: undefined,
            dstm: undefined,
            crossfadeItems:[],
            replaygainItems:[],
            dstmItems: [],
            alarms: {
                on: true,
                volume: 100,
                snooze: 9,
                timeout: 60,
                fade: true,
                scheduled: []
            },
            sleepTime: undefined,
            alarmShuffeItems:[],
            alarmSounds:[],
            alarmDialog: {
                show: false,
                id: undefined,
                time: undefined,
                dow: [],
                repeat: false,
                url: undefined,
                shuffle: undefined
            },
            wide:1,
            trans:{dstm:undefined},
            libraries:[],
            library:undefined,
            customActions:undefined,
            showHome:false,
            plugins:[]
        }
    },
    computed: {
        formattedTime() {
            if (!this.alarmDialog.time) {
                return "";
            }
            var parts = this.alarmDialog.time.split(":");
            return formatTime((parseInt(parts[0])*60*60)+(parseInt(parts[1])*60), this.$store.state.twentyFourHour);
        },
        unlockAll() {
            return this.$store.state.unlockAll
        },
        showAlarms() {
            return this.$store.state.unlockAll && this.alarms.on
        },
        darkUi () {
            return this.$store.state.darkUi
        },
        twentyFourHour() {
            return this.$store.state.twentyFourHour
        },
        homeButton() {
            return this.$store.state.homeButton
        },
        showSync() {
            if (!this.isGroup && this.$store.state.players) {
                var len = this.$store.state.players.length;
                return len>1 && !this.$store.state.players[0].isgroup && !this.$store.state.players[1].isgroup;
            }
            return false;
        },
        numPlayers() {
            return this.$store.state.players ? this.$store.state.players.length : 0
        },
        players() {
            return this.$store.state.players
        }
    },
    mounted() {
        bus.$on('langChanged', function() {
            this.initItems();
        }.bind(this));
        this.initItems();
        bus.$on('pinnedChanged', function(playerStatus) {
            if (this.show) {
                this.setPinned();
            }
        }.bind(this));
        bus.$on('playerStatus', function(playerStatus) {
            if (this.show) {
                this.handlePlayerStatus(playerStatus);
            }
        }.bind(this));
        bus.$on('otherPlayerStatus', function(playerStatus) {
            if (this.show && this.playerId == playerStatus.id) {
                this.handlePlayerStatus(playerStatus);
            }
        }.bind(this));

        bus.$on('playersettings.open', function(player, section, showHome) {
            if (queryParams.party) {
                return;
            }
            // Check if called via actions URL query. If so, need to map from mac/name to player instance
            if (typeof player === 'string' || player instanceof String) {
                if ('-'==player) {
                    player=undefined;
                } else {
                    var found = false;
                    for (var i=0, len=this.$store.state.players.length; i<len && !found; ++i) {
                        if (this.$store.state.players[i].id == player || this.$store.state.players[i].name == player) {
                            player = this.$store.state.players[i];
                            found = true;
                        }
                    }
                    if (!found) {
                        bus.$emit('showError', undefined, i18n("Player not found"));
                        return;
                    }
                }
            }
            if (undefined==player && this.$store.state.player && !this.show) {
                this.playerSettings(this.$store.state.player, section);
            } else if (undefined!=player && !this.show) {
                this.playerSettings(player, section);
            } else if (!this.$store.state.player) {
                bus.$emit('showError', undefined, i18n("No Player"));
            }
            this.showHome=showHome;
            this.fetchPlugins();
        }.bind(this));
        bus.$on('noPlayers', function() {
            this.show=this.alarmDialog.show=false;
        }.bind(this));
        this.sleepOpen = false;
        bus.$on('dialogOpen', function(name, open) {
            if (name=='sleep') {
                this.sleepOpen = open;
            }
        }.bind(this));
        bus.$on('closeMenu', function() {
            if (this.showMenu) {
                this.showMenu = false;
            }
            if (this.playersMenu.show) {
                this.playersMenu.show = false;
            }
        }.bind(this));
        bus.$on('closeDialog', function(dlg) {
            if (dlg == 'alarm') {
                this.alarmDialog.show=false;
            } else if (dlg == 'playersettings') {
                this.close();
            }
        }.bind(this));
        bus.$on('iframeClosed', function(isPlayer) {
            if (isPlayer) { // update any settings that might have changed
                this.update(true);
            }
        }.bind(this));
        bus.$on('playerIconSet', function(playerId, icon) {
            if (playerId==this.playerId) {
                this.playerIcon = icon;
            }
        }.bind(this));
    },
    methods: {
        handlePlayerStatus(playerStatus) {
            this.controlSleepTimer(playerStatus.will_sleep_in);
            this.isSynced = playerStatus.synced;
        },
        playerSettings(player, section) {
            bus.$emit('refreshStatus', player.id);
            this.wide = window.innerWidth >= 700 ? 2 : window.innerWidth >= (this.$store.state.largeFonts ? 400 : 350) ? 1 : 0;
            this.cancelSleepTimer();
            this.dstmItems=[];
            this.crossfade='0';
            this.replaygain='0';
            this.playerId = player.id;
            this.playerName = player.name;
            this.playerIcon = player.icon;
            this.playerLink = player.link;
            this.isGroup = player.isgroup;
            this.isSynced = false;
            this.orig = { player: {name:player.name, icon:player.icon}, dstm:"",
                          alarms: { fade:false, timeout:0, snooze:0, on:false, volume:0 },
                          library:"", crossfade:"0", smartCrossfade:false, replaygain:"" };
            this.customActions = getCustomActions(player.id, this.$store.state.unlockAll);
            if (LMS_P_DSTM) {
                lmsCommand(this.playerId, ["dontstopthemusicsetting"]).then(({data}) => {
                    if (data.result && data.result.item_loop) {
                        for (let i=0, loop=data.result.item_loop, len=loop.length; i<len; ++i) {
                            if (loop[i].actions && loop[i].actions.do && loop[i].actions.do.cmd) {
                                this.dstmItems.push({key: loop[i].actions.do.cmd[2], label:loop[i].text});
                                if (1===loop[i].radio) {
                                    this.dstm = this.orig.dstm = loop[i].actions.do.cmd[2];
                                }
                            }
                        }
                    }
                });
            }

            this.alarms.on=true;
            this.alarms.volume=100;
            this.alarms.snooze=0;
            this.alarms.timeout=0;
            this.alarms.fade=true;
            lmsCommand(this.playerId, ["playerpref", "alarmfadeseconds", "?"]).then(({data}) => {
                if (data && data.result && undefined!=data.result._p2) {
                    this.alarms.fade=this.orig.alarms.fade=1==data.result._p2;
                }
            });
            lmsCommand(this.playerId, ["playerpref", "alarmTimeoutSeconds", "?"]).then(({data}) => {
                if (data && data.result && undefined!=data.result._p2) {
                    this.alarms.timeout=this.orig.alarms.timeout=Math.floor(parseInt(data.result._p2)/60);
                }
            });
            lmsCommand(this.playerId, ["playerpref", "alarmSnoozeSeconds", "?"]).then(({data}) => {
                if (data && data.result && undefined!=data.result._p2) {
                    this.alarms.snooze=this.orig.alarms.snooze=Math.floor(parseInt(data.result._p2)/60);
                }
            });
            lmsCommand(this.playerId, ["playerpref", "alarmsEnabled", "?"]).then(({data}) => {
                if (data && data.result && undefined!=data.result._p2) {
                    this.alarms.on=this.orig.alarms.on=1==data.result._p2;
                }
            });
            lmsCommand(this.playerId, ["playerpref", "alarmDefaultVolume", "?"]).then(({data}) => {
                if (data && data.result && undefined!=data.result._p2) {
                    this.alarms.volume=this.orig.alarms.volume=data.result._p2;
                }
            });
            this.alarmSounds=[];
            this.alarms.scheduled=[];
            lmsList(this.playerId, ["alarm", "playlists"], undefined, 0).then(({data}) => {
                if (data && data.result && data.result.item_loop) {
                    data.result.item_loop.forEach(i => {
                        if (!i.url) {
                            this.alarmSounds.push({key:'CURRENT_PLAYLIST', label:i18n('Current play queue')});
                        } else {
                            this.alarmSounds.push({key:i.url, label:i.category+": "+i.title});
                        }
                    });
                }
                if (this.alarmSounds.length<1) {
                    this.alarmSounds.push({key:'CURRENT_PLAYLIST', label:i18n('Current play queue')});
                }
                this.loadAlarms();
            });
            lmsCommand(this.playerId, ["sleep", "?"]).then(({data}) => {
                if (data && data.result && data.result._sleep) {
                    this.controlSleepTimer(parseInt(data.result._sleep));
                }
            });
            lmsList("", ["libraries"]).then(({data}) => {
                if (data && data.result && data.result.folder_loop && data.result.folder_loop.length>0) {
                    this.libraries = [];
                    for (var i=0, len=data.result.folder_loop.length; i<len; ++i) {
                        data.result.folder_loop[i].name = data.result.folder_loop[i].name.replace(SIMPLE_LIB_VIEWS, "");
                        this.libraries.push(data.result.folder_loop[i]);
                    }
                    this.libraries.sort(nameSort);
                    this.libraries.unshift({name: i18n("All"), id:LMS_DEFAULT_LIBRARY});
                    this.library=this.libraries[0].id;
                    lmsCommand(this.playerId, ["libraries", "getid"]).then(({data}) => {
                        if (data && data.result) {
                            for (var i=0, len=this.libraries.length; i<len; ++i) {
                                if (this.libraries[i].id==data.result.id) {
                                    this.library=this.orig.library=this.libraries[i].id;
                                    break;
                                }
                            }
                        }
                    });
                }
            });
            this.update(false);
            this.show = true;
            this.showMenu = false;
            this.playerMenu = {show:false, x:this.playerMenu.x}
            if (undefined!=section) {
                this.$nextTick(function () {
                    var elem = document.getElementById(section);
                    if (elem) {
                        elem.scrollIntoView(true);
                    }
                });
            }
        },
        initItems() {
            this.crossfadeItems=[
                { key:0, label:i18n("No fade")},
                { key:1, label:i18n("Crossfade")},
                { key:2, label:i18n("Fade in")},
                { key:3, label:i18n("Fade out")},
                { key:4, label:i18n("Fade in and out")}
                ];
            this.replaygainItems=[
                { key:0, label:i18n("None")},
                { key:1, label:i18n("Track gain")},
                { key:2, label:i18n("Album gain")},
                { key:3, label:i18n("Smart gain")}
                ];
            this.alarmShuffeItems=[
                { key:0, label:i18n("Don't shuffle")},
                { key:1, label:i18n("Shuffle by song")},
                { key:2, label:i18n("Shuffle by album")},
                ];
            DAYS_OF_WEEK = [i18n('Sun'), i18n('Mon'), i18n('Tues'), i18n('Weds'), i18n('Thurs'), i18n('Fri'), i18n('Sat')];
            this.trans={dstm:i18n("Don't Stop The Music")};
        },
        update(readName) {
            if (readName) {
                lmsCommand(this.playerId, ["playerpref", "playername", "?"]).then(({data}) => {
                    if (data && data.result && undefined!=data.result._p2 && this.playerName!=data.result._p2) {
                        this.playerName=this.orig.playerName=data.result._p2;
                    }
                });
            }
            lmsCommand(this.playerId, ["playerpref", "transitionType", "?"]).then(({data}) => {
                if (data && data.result && undefined!=data.result._p2) {
                    this.crossfade=this.orig.crossfade=parseInt(data.result._p2);
                }
            });
            lmsCommand(this.playerId, ["playerpref", "transitionSmart", "?"]).then(({data}) => {
                if (data && data.result && undefined!=data.result._p2) {
                    this.smartCrossfade=this.orig.smartCrossfade=1==parseInt(data.result._p2);
                }
            });
            lmsCommand(this.playerId, ["playerpref", "replayGainMode", "?"]).then(({data}) => {
                if (data && data.result && undefined!=data.result._p2) {
                    this.replaygain=this.orig.replaygain=parseInt(data.result._p2);
                }
            });
        },
        goHome() {
            this.close();
            this.$store.commit('closeAllDialogs', true);
        },
        close(longpress) {
            if (longpress && this.showHome) {
                this.goHome();
                return;
            }
            this.show=false;
            this.showMenu = false;
            if (this.dstmItems.length>1 && this.dstm!=this.orig.dstm && !isNull(this.dstm)) {
                bus.$emit("dstm", this.playerId, this.dstm);
            }
            if (this.orig.library!=this.library && !isNull(this.library)) {
                lmsCommand(this.playerId, ["material-skin-client", "set-lib", "id:"+this.library]);
            }
            if (this.orig.crossfade!=this.crossfade && !isNull(this.crossfade)) {
                lmsCommand(this.playerId, ["playerpref", "transitionType", this.crossfade]);
            }
            if (this.orig.smartCrossfade!=this.smartCrossfade && !isNull(this.smartCrossfade)) {
                lmsCommand(this.playerId, ["playerpref", "transitionSmart", this.smartCrossfade ? 1 : 0]);
            }
            if (this.orig.replaygain!=this.replaygain && !isNull(this.replaygain)) {
                lmsCommand(this.playerId, ["playerpref", "replayGainMode", this.replaygain]);
            }
            if (this.orig.alarms.fade!=this.alarms.fade && !isNull(this.alarms.fade)) {
                lmsCommand(this.playerId, ["playerpref", "alarmfadeseconds", this.alarms.fade ? 1 : 0]);
            }
            if (this.orig.alarms.timeout!=this.alarms.timeout && !isNull(this.alarms.timeout)) {
                lmsCommand(this.playerId, ["playerpref", "alarmTimeoutSeconds", this.alarms.timeout*60]);
            }
            if (this.orig.alarms.snooze!=this.alarms.snooze && !isNull(this.alarms.snooze)) {
                lmsCommand(this.playerId, ["playerpref", "alarmSnoozeSeconds", this.alarms.snooze*60]);
            }
            if (this.orig.alarms.volume!=this.alarms.volume && !isNull(this.alarms.volume)) {
                lmsCommand(this.playerId, ["playerpref", "alarmDefaultVolume", this.alarms.volume]);
            }

            if (this.orig.player.name!=this.playerName && !isEmpty(this.playerName)) {
                lmsCommand(this.playerId, ['name', this.playerName]).then(({data}) => {
                    bus.$emit('refreshServerStatus');
                });
            }

            if (this.orig.player.icon.icon!=this.playerIcon.icon || this.orig.player.icon.svg!=this.playerIcon.svg) {
                lmsCommand(this.playerId, ["playerpref", "plugin.material-skin:icon", JSON.stringify(this.playerIcon)]);
                this.$store.commit('setIcon', {id:this.playerId, icon:this.playerIcon});
                // From icon-mapping.js
                playerIdIconMap[this.playerId]=this.playerIcon;
                setLocalStorageVal("playerIdIconMap", JSON.stringify(playerIdIconMap));
            }

            this.playerIconUpdate = undefined;
            this.playerId = undefined;
        },
        loadAlarms() {
            lmsList(this.playerId, ["alarms"], ["filter:all"], 0).then(({data}) => {
                this.alarms.scheduled = [];
                if (data && data.result && data.result.alarms_loop) {
                    data.result.alarms_loop.forEach(i => {
                        i.enabled = 1 == i.enabled;
                        i.origEnabled = 1 == i.enabled;
                        i.repeat = 1 == i.repeat;
                        this.alarms.scheduled.push(i);
                    });
                }
           });
        },
        toggleAllAlarms() {
            lmsCommand(this.playerId, ["playerpref", "alarmsEnabled", this.alarms.on ? 1 : 0]).then(({data}) => {
                lmsCommand(this.playerId, ["playerpref", "alarmsEnabled", "?"]).then(({data}) => {
                    if (data && data.result && undefined!=data.result._p2) {
                        this.alarms.on=this.orig.alarms.on=1==data.result._p2;
                    }
                });
            });
        },
        toggleAlarm(alarm) {
             lmsCommand(this.playerId, ["alarm", "update", "enabled:"+(alarm.origEnabled ? 0 : 1), "id:"+alarm.id]).then(({data}) => {
                this.loadAlarms();
            });
        },
        addAlarm() {
            this.alarmDialog = { show: true, id: undefined, time: "00:00", dow:["1", "2", "3", "4", "5"], repeat: false,
                                 url: 'CURRENT_PLAYLIST', shuffle: this.alarmShuffeItems[0].key };
        },
        editAlarm(alarm) {
            this.alarmDialog = { show: true, id: alarm.id, time: formatTime(alarm.time, true), dow: alarm.dow.split(","),
                                 repeat: alarm.repeat, url: alarm.url, enabled: alarm.enabled };
        },
        saveAlarm() {
            var parts = this.alarmDialog.time.split(":");
            var time = (parseInt(parts[0])*60*60)+(parseInt(parts[1])*60);
            var cmd = ["alarm"];
            if (this.alarmDialog.id) {
                cmd.push("update");
                cmd.push("id:"+this.alarmDialog.id);
                cmd.push("enabled:"+(this.alarmDialog.enabled ? 1 : 0));
            } else {
                cmd.push("add");
                cmd.push("enabled:1");
            }

            cmd.push("time:"+time);
            cmd.push("dow:"+this.alarmDialog.dow.join(","));
            cmd.push("url:"+this.alarmDialog.url); // TODO CHECK!!!
            cmd.push("repeat:"+(this.alarmDialog.repeat ? 1 : 0));
            // TODO: shuffle???
            lmsCommand(this.playerId, cmd).then(({data}) => {
                this.loadAlarms();
            });
            this.alarmDialog.show = false;
        },
        deleteAlarm(alarm) {
            confirm(i18n("Delete alarm?"), i18n('Delete')).then(res => {
                if (res) {
                    lmsCommand(this.playerId, ["alarm", "delete", "id:"+alarm.id]).then(({data}) => {
                        this.loadAlarms();
                    });
                }
            });
        },
        i18n(str) {
            if (this.show) {
                return i18n(str);
            } else {
                return str;
            }
        },
        setSleep(duration) {
            bus.$emit('dlg.open', 'sleep', {id: this.playerId, name: this.playerName});
        },
        setIcon() {
            bus.$emit('dlg.open', 'icon', {id: this.playerId, name: this.playerName, icon:this.playerIcon});
        },
        cancelSleepTimer() {
            this.sleepTime = undefined;
            if (undefined!==this.sleepTimer) {
                clearInterval(this.sleepTimer);
                this.sleepTimer = undefined;
            }
        },
        controlSleepTimer(timeLeft) {
            if (undefined!=timeLeft && timeLeft>1) {
                timeLeft = Math.floor(timeLeft);
                if (this.timeLeft!=timeLeft) {
                    this.cancelSleepTimer();
                    this.sleepTime = timeLeft;
                    this.timeLeft = this.sleepTime;
                    this.start = new Date();

                    this.sleepTimer = setInterval(function () {
                        var current = new Date();
                        var diff = (current.getTime()-this.start.getTime())/1000.0;
                        this.sleepTime = this.timeLeft - diff;
                        if (this.sleepTime<=0) {
                            this.sleepTime = undefined;
                                this.cancelSleepTimer();
                        }
                    }.bind(this), 1000);
                }
            } else {
                this.cancelSleepTimer();
            }
        },
        showExtraSettings() {
            this.showMenu = false;
            bus.$emit('dlg.open', 'iframe', '/material/settings/player/basic.html?player='+this.playerId, i18n('Extra player settings')+SEPARATOR+this.playerName, undefined, IFRAME_HOME_CLOSES_DIALOGS, this.playerId);
        },
        showConfig() {
            this.showMenu = false;
            bus.$emit('dlg.open', 'iframe', this.playerLink, i18n("Configuration")+SEPARATOR+this.playerName, undefined, IFRAME_HOME_CLOSES_DIALOGS);
        },
        doCustomAction(action, player) {
            performCustomAction(action, player);
        },
        fetchPlugins() {
            this.plugins=[];
            lmsList(this.playerId, ["menu", "items"], ["direct:1"]).then(({data}) => {
                if (data && data.result && data.result.item_loop) {
                    logJsonMessage("RESP", data);
                    for (var idx=0, loop=data.result.item_loop, loopLen=loop.length; idx<loopLen; ++idx) {
                        let item = loop[idx];
                        if (item.node=="settingsPlayer") {
                            // With Denon plugin, only want this section for players with this enabled. As a work-around for now,
                            // the plugin will set actions.go.player to an array of enabled player IDs.
                            // So if this is not an array (i.e. some other plugin), or this array contains playerId then use
                            // See #583
                            if (undefined==item.actions || undefined==item.actions.go || undefined==item.actions.go.player || !Array.isArray(item.actions.go.player) || item.actions.go.player.indexOf(this.playerId)>=0) {
                                item.title=item.text;
                                item.text=undefined;
                                item.pinned=false;
                                mapIcon(item);
                                this.plugins.push(item);
                            }
                        }
                    }
                    this.setPinned();
                }
            });
        },
        pluginPressed(longpress, el) {
            let i = parseInt(el.id.split("-")[0]);
            if (i>=0 && i<=this.plugins.length) {
                if (longpress) {
                    let item = this.plugins[i];
                    let copy = JSON.parse(JSON.stringify(item));
                    copy.type = "settingsPlayer";
                    copy.players = undefined==item.actions.go || undefined==item.actions.go.player || !Array.isArray(item.actions.go.player)
                        ? undefined : item.actions.go.player;
                    bus.$emit("pin", copy, !this.plugins[i].pinned);
                } else {
                    this.showPlugin(i);
                }
            }
        },
        showPlugin(idx) {
            this.showMenu = false;
            bus.$emit('dlg.open', 'playersettingsplugin', this.playerId, this.playerName, this.plugins[idx], this.showHome);
        },
        setPinned() {
            if (this.plugins.length<1) {
                return;
            }
            let browseTop = JSON.parse(getLocalStorageVal("topItems", "[]"));
            let ids = new Set();
            for (let i=0, len=browseTop.length; i<len; ++i) {
                ids.add(browseTop[i].id);
            }
            for (let i=0, len=this.plugins.length; i<len; ++i) {
                this.plugins[i].pinned=ids.has(this.plugins[i].id);
            }
        },
        openPlayerMenu(event) {
            this.playerMenu={show:true, x:event.clientX};
        },
        setPlayer(player) {
            if (player.id==this.playerId) {
                return;
            }
            this.playerSettings(player);
        },
        mouseDown(ev) {
            toolbarMouseDown(ev);
        }
    },
    filters: {
        formatAlarm: function (value, twentyFourHour) {
            var days=[];
            // LMS has Sun->Sat, but I prefer Mon->Sun. So, if Sun is used, place at end
            var haveSun=false;
            value.dow.split(",").sort().forEach(d => {
                if (d==='0') {
                    haveSun=true;
                } else {
                    days.push(DAYS_OF_WEEK[d]);
                }
            });
            if (haveSun) {
                days.push(DAYS_OF_WEEK[0]);
            }
            return formatTime(value.time, twentyFourHour)+" "+days.join(", ")+(value.repeat ? " (" + i18n("Repeat") + ")" : "");
        },
        displayTime: function (value) {
            if (undefined==value) {
                return '';
            }
            return '('+formatSeconds(Math.floor(value))+')';
        },
        svgIcon: function (name, dark) {
            return "/material/svg/"+name+"?c="+(dark ? LMS_DARK_SVG : LMS_LIGHT_SVG)+"&r="+LMS_MATERIAL_REVISION;
        }
    },
    watch: {
        'show': function(val) {
            this.$store.commit('dialogOpen', {name:'playersettings', shown:val});
        },
        'alarmDialog.show': function(val) {
            this.$store.commit('dialogOpen', {name:'alarm', shown:val});
        },
        'showMenu': function(val) {
            this.$store.commit('menuVisible', {name:'playersettings', shown:val});
        },
        'playerMenu.show': function(val) {
            this.$store.commit('menuVisible', {name:'playersettings-player', shown:val});
        }
    }
})

