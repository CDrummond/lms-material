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
var TB_MANAGE_PLAYERS  = {id:6, svg:  "player-manager" };
var TB_APP_QUIT        = {id:7, svg:  "close" }
var TB_START_PLAYER    = {id:8, icon: "surround_sound" }

const TB_CUSTOM_SETTINGS_ACTIONS = {id:20};
const TB_CUSTOM_ACTIONS = {id:21};

Vue.component('lms-navdrawer', {
    template: `
<v-navigation-drawer v-model="show" absolute temporary :width="maxWidth" style="display:flex;flex-direction:column" id="nd-list">
 <v-list class="nd-list py-0">
  <div class="nd-top"></div>
  <div v-if="windowControlsOnLeft" style="height:var(--main-toolbar-height); width:100%"></div>
  <v-list-tile @click.prevent="show=false" style="margin-top:-2px">
   <v-list-tile-avatar><v-btn icon flat @click="show=false"><v-icon>arrow_back<v-icon></v-btn></v-list-tile-avatar>
   <div class="lyrion-logo" v-longpress:nomove="clickLogo"><img :src="'lyrion' | svgIcon(darkUi)"></img></div>
  </v-list-tile>
  <v-list-tile v-if="!connected" @click="bus.$emit('showError', undefined, trans.connectionLost)">
   <v-list-tile-avatar><v-icon class="red">error</v-icon></v-list-tile-avatar>
   <v-list-tile-content><v-list-tile-title>{{trans.connectionLost}}</v-list-tile-title></v-list-tile-content>
  </v-list-tile>
  <template v-for="(item, index) in players" v-if="connected">
   <v-subheader v-if="index==0 && !item.isgroup && players[players.length-1].isgroup">{{trans.standardPlayers}}</v-subheader>
   <v-subheader v-else-if="index>0 && item.isgroup && !players[index-1].isgroup">{{trans.groupPlayers}}</v-subheader>
   <v-list-tile @click="setPlayer(item.id)" v-bind:class="{'nd-active-player':player && item.id === player.id}" :id="'nd-player-'+index">
    <v-list-tile-avatar v-longpress:nomove="syncPlayer" :id="index+'-icon'">
     <v-icon v-if="item.isplaying" class="playing-badge">play_arrow</v-icon>
     <v-icon v-if="item.icon.icon">{{item.icon.icon}}</v-icon><img v-else class="svg-img" :src="item.icon.svg | svgIcon(darkUi)"></img>
    </v-list-tile-avatar>
    <v-list-tile-content>
     <v-list-tile-title>{{item.name}}</v-list-tile-title>
    </v-list-tile-content>
     <v-list-tile-action v-if="index<10 && keyboardControl" class="menu-shortcut" v-bind:class="{'menu-shortcut-player':item.canpoweroff,'menu-shortcut-player-apple':IS_APPLE && item.canpoweroff}">{{index|playerShortcut}}</v-list-tile-action>
     <v-list-tile-action>
      <v-btn v-if="item.canpoweroff" icon style="float:right" v-longpress:nomove="togglePower" :id="index+'-power-btn'" :title="(item.id==player.id && playerStatus.ison) || item.ison ? i18n('Switch off %1', item.name) : i18n('Switch on %1', item.name)"><v-icon v-bind:class="{'dimmed': (item.id==player.id ? !playerStatus.ison : !item.ison)}">power_settings_new</v-icon></v-btn>
     </v-list-tile-action>
   </v-list-tile>
   <v-list-tile v-if="connected && player && item.id === player.id && (playerStatus.sleepTime || playerStatus.alarmStr)" class="hide-for-mini status">
    <div v-if="playerStatus.sleepTime" class="link-item" @click="show=false; bus.$emit('dlg.open', 'sleep', player)"><v-icon class="player-status-icon">hotel</v-icon> {{playerStatus.sleepTime | displayTime}}</div>
    <div v-if="playerStatus.alarmStr" class="link-item" @click="show=false; bus.$emit('dlg.open', 'playersettings', undefined, 'alarms')"><v-icon class="player-status-icon">alarm</v-icon> {{playerStatus.alarmStr}}</div>
   </v-list-tile>
  </template>

  <v-divider v-if="playersDivider" class="hide-for-mini"></v-divider>

  <v-list-tile v-if="showManagePlayers" v-longpress:nomove="managePlayers" class="hide-for-mini noselect">
   <v-list-tile-avatar><img class="svg-img" :src="TB_MANAGE_PLAYERS.svg | svgIcon(darkUi)"></img></v-list-tile-avatar>
   <v-list-tile-content><v-list-tile-title>{{TB_MANAGE_PLAYERS.title}}</v-list-tile-title></v-list-tile-content>
   <v-list-tile-action v-if="TB_MANAGE_PLAYERS.shortcut && keyboardControl" class="menu-shortcut player-menu-shortcut">{{TB_MANAGE_PLAYERS.shortcut}}</v-list-tile-action>
  </v-list-tile>

  <v-list-tile :href="appLaunchPlayer" v-if="undefined!=appLaunchPlayer" @click="show=false">
   <v-list-tile-avatar><v-icon>{{TB_START_PLAYER.icon}}</v-icon></v-list-tile-avatar>
   <v-list-tile-title>{{TB_START_PLAYER.title}}</v-list-tile-title>
  </v-list-tile>

  <template v-if="showCustomActions" v-for="(action, index) in customPlayerActions">
   <v-list-tile @click="doCustomAction(action)" v-if="undefined==action.players || action.players.indexOf(player.id)>=0">
    <v-list-tile-avatar><v-icon v-if="action.icon">{{action.icon}}</v-icon><img v-else-if="action.svg" class="svg-img" :src="action.svg | svgIcon(darkUi)"></img></v-list-tile-avatar>
    <v-list-tile-content><v-list-tile-title>{{action.title}}</v-list-tile-title></v-list-tile-content>
   </v-list-tile>
  </template>

  <v-divider v-if="playerSectionsDivider"></v-divider>
 </v-list>
 <v-spacer></v-spacer>

 <div v-if="showShortcuts">
  <v-subheader>{{trans.shortcuts}}</v-subheader>
  <ul class="nd-shortuts" v-bind:class="{'nd-shortuts-wide':maxWidth>320, 'nd-shortuts-1':2==ndShortcuts}">
   <li v-for="(item, index) in shortcuts">
    <v-btn icon class="toolbar-button" @click="show=false; bus.$emit('browse-shortcut', item.id)">
     <v-icon v-if="undefined!=item.icon">{{item.icon}}</v-icon>
     <img v-else class="svg-img" :src="item.svg | svgIcon(darkUi)"></img>
    </v-btn>
   </li>
  </ul>
 </div>

 <v-list class="nd-list py-0">
  <template v-for="(item, index) in menuItems">
   <v-divider v-if="item===DIVIDER"></v-divider>
   <v-subheader v-else-if="item.hdr">{{item.title}}</v-subheader>
   <v-list-tile @click="menuAction(item.id)" v-else-if="(TB_UI_SETTINGS.id==item.id) || (TB_PLAYER_SETTINGS.id==item.id && player && connected) || (TB_SERVER_SETTINGS.id==item.id && unlockAll && connected) || (TB_INFO.id==item.id)">
    <v-list-tile-avatar><img v-if="TB_INFO.id==item.id && updatesAvailable" class="svg-img" :src="'update' | svgIcon(darkUi, true)"></img><img v-else-if="TB_INFO.id==item.id && restartRequired" class="svg-img" :src="'restart' | svgIcon(darkUi, true)"><img v-else-if="item.svg" class="svg-img" :src="item.svg | svgIcon(darkUi)"><v-icon v-else>{{item.icon}}</v-icon></v-list-tile-avatar>
    <v-list-tile-content>
     <v-list-tile-title>{{item.stitle ? item.stitle : item.title}}</v-list-tile-title>
     <v-list-tile-sub-title v-if="TB_INFO.id==item.id && updatesAvailable">{{trans.updatesAvailable}}</v-list-tile-sub-title>
     <v-list-tile-sub-title v-else-if="TB_INFO.id==item.id && restartRequired">{{trans.restartRequired}}</v-list-tile-sub-title>
    </v-list-tile-content>
    <v-list-tile-action v-if="item.shortcut && keyboardControl" class="menu-shortcut">{{item.shortcut}}</v-list-tile-action>
   </v-list-tile>
   <v-list-tile :href="queryParams.appSettings" v-else-if="TB_APP_SETTINGS.id==item.id && undefined!=queryParams.appSettings" @click="show=false">
    <v-list-tile-avatar><img class="svg-img" :src="TB_APP_SETTINGS.svg | svgIcon(darkUi)"></img></v-list-tile-avatar>
    <v-list-tile-content><v-list-tile-title>{{TB_APP_SETTINGS.stitle}}</v-list-tile-title></v-list-tile-content>
   </v-list-tile>
   <v-list-tile :href="appQuit" v-else-if="TB_APP_QUIT.id==item.id" @click="show=false">
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
  <div class="nd-bottom"></div>
 </v-list>
</v-navigation-drawer>
`,
    props: [],
    data() {
        return {
            show: false,
            trans:{groupPlayers:undefined, standardPlayers:undefined, connectionLost:undefined, updatesAvailable:undefined, restartRequired:undefined, shortcuts:undefined },
            menuItems: [],
            shortcuts: [],
            customActions:undefined,
            customSettingsActions:undefined,
            customPlayerActions:undefined,
            playerStatus: { ison: 1, isplaying: false, volume: 0, synced: false, sleepTime: undefined, count:0, alarm: undefined, alarmStr: undefined },
            appQuit: queryParams.appQuit,
            appLaunchPlayer: queryParams.appLaunchPlayer,
            maxWidth: 300,
            connected: true,
            windowControlsOnLeft: false
        }
    },
    created() {
        try {
            let tbRect = window.navigator.windowControlsOverlay.getTitlebarAreaRect();
            this.windowControlsOnLeft = tbRect.left>32;
        } catch (e) { }
        bus.$on('langChanged', function() {
            this.initItems();
        }.bind(this));
        bus.$on('homeScreenItems', function(view) {
            this.updateShortcuts(view);
        }.bind(this));
        this.initItems();
        bus.$on('navDrawer', function() {
            this.show = true;
            addBrowserHistoryItem();
            if (this.$store.state.player) {
                for (let i=0, loop=this.$store.state.players, len=loop.length; i<len; ++i) {
                    if (loop[i].id==this.$store.state.player.id) {
                        let adjust = (loop[i].isgroup ? 2 : 1);
                        let maxVis = Math.floor(window.innerHeight/48)-(1+adjust);
                        if (i>=maxVis || ((i+(adjust + 2))*48)>=window.innerHeight) {
                            this.$nextTick(function () {
                                ensureVisible(document.getElementById('nd-player-'+(i>=maxVis ? i-maxVis : (i>0 ? i-adjust : 0))));
                            });
                        } else {
                            setElemScrollTop(document.getElementById('nd-list', 0));
                        }
                        break;
                    }
                }
            }
        }.bind(this));
        this.maxWidth = window.innerWidth>500 ? 400 : 300;
        bus.$on('windowWidthChanged', function() {
            this.maxWidth = window.innerWidth>500 ? 400 : 300;
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
        bus.$on('closeMenu', function() {
            this.show = false;
        }.bind(this));
        bus.$on('networkStatus', function(connected) {
            this.connected=connected;
        }.bind(this));
        bus.$on('playerStatus', function(playerStatus) {
            if (playerStatus.ison!=this.playerStatus.ison) {
                this.playerStatus.ison = playerStatus.ison;
            }
            if (playerStatus.isplaying!=this.playerStatus.isplaying) {
                this.playerStatus.isplaying = playerStatus.isplaying;
            }
            this.controlSleepTimer(playerStatus.will_sleep_in);
            if (playerStatus.synced!=this.playerStatus.synced) {
                this.playerStatus.synced = playerStatus.synced;
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
                    if (this.$store.state.visibleMenus.size==0 || (this.$store.state.visibleMenus.size==1 && this.$store.state.visibleMenus.has('navdrawer'))) {
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
            TB_MANAGE_PLAYERS.title=i18n('Manage players');
            TB_MANAGE_PLAYERS.shortcut=shortcutStr(LMS_MANAGEPLAYERS_KEYBOARD);
            TB_APP_SETTINGS.title=i18n('Application settings');
            TB_APP_SETTINGS.stitle=i18n('Application');
            TB_APP_QUIT.title=i18n('Quit');
            TB_START_PLAYER.title=i18n('Start player');
            this.trans = { groupPlayers:i18n("Group Players"), standardPlayers:i18n("Standard Players"), connectionLost:i18n('Server connection lost!'),
                           updatesAvailable:i18n('Updates available'), restartRequired:i18n('Restart required'), shortcuts:i18n('Shortcuts') };
            if (LMS_KIOSK_MODE) {
                this.menuItems = LMS_KIOSK_MODE==2
                                   ? [TB_SETTINGS, TB_CUSTOM_SETTINGS_ACTIONS, DIVIDER, TB_CUSTOM_ACTIONS]
                                   : [TB_CUSTOM_SETTINGS_ACTIONS, TB_CUSTOM_ACTIONS]
            } else {
                if (queryParams.party) {
                    this.menuItems = [TB_APP_SETTINGS, TB_UI_SETTINGS, DIVIDER, TB_INFO];
                } else {
                    this.menuItems = [TB_SETTINGS, TB_APP_SETTINGS, TB_UI_SETTINGS, TB_PLAYER_SETTINGS, TB_SERVER_SETTINGS, TB_CUSTOM_SETTINGS_ACTIONS, DIVIDER];
                    this.menuItems=this.menuItems.concat([TB_INFO, TB_CUSTOM_ACTIONS]);
                }
                if (queryParams.appQuit) {
                    this.menuItems.push(TB_APP_QUIT)
                }
            }
        },
        updateShortcuts(view) {
            this.shortcuts = [];
            if (undefined!=view && undefined!=view.top) {
                for (let i=0, items=view.top, len=items.length; i<len; ++i) {
                    let item = items[i];
                    if ((undefined==item.menu || item.menu.length<1 || item.menu[0]!=PLAY_ACTION) && item.stdItem!=STD_ITEM_RANDOM_MIX && !view.hidden.has(item.id) && (item.id!=TOP_RADIO_ID || !lmsOptions.combineAppsAndRadio)) {
                        this.shortcuts.push({id:item.id, icon:item.icon, svg:item.svg});
                    }
                }
                if (this.shortcuts.length>0) {
                    this.shortcuts.unshift({id:'-', icon:'home'});
                }
            }
        },
        setPlayer(id) {
            if (id != this.$store.state.player.id) {
                this.$store.commit('setPlayer', id);
            }
            this.show = false;
        },
        managePlayers(longPress, el, event) {
            if (event) {
                event.preventDefault();
                event.stopPropagation();
            }
            if (longPress) {
                // Leave menu open for 1/4 of a second so that it captures the
                // click/touch end event. If we close immediately then the element
                // that long-press was bound to no longer exists so it can't stop
                // the event => sometimes na entry in the sync-dialog gets this
                // and toggles its setting.
                setTimeout(function () {
                    this.show = false;
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
                if (this.connected) {
                    bus.$emit('dlg.open', 'playersettings');
                }
            } else if (TB_SERVER_SETTINGS.id==id) {
                if (this.$store.state.unlockAll && this.connected) {
                    lmsCommand("", ["material-skin", "server"]).then(({data}) => {
                        if (data && data.result) {
                            openServerSettings(data.result.libraryname, 0);
                        }
                    }).catch(err => {
                    });
                }
            } else if (TB_INFO.id==id) {
                bus.$emit('dlg.open', 'info');
            } else if (TB_MANAGE_PLAYERS.id==id) {
                if (this.connected) {
                    bus.$emit('dlg.open', 'manage');
                }
            } else {
                bus.$emit('toolbarAction', id);
            }
            this.show = false;
        },
        togglePlayerPower(player, longPress) {
            if (queryParams.party) {
                return;
            }
            if (longPress) {
                this.show = false;
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
        syncPlayer(longPress, el, event) {
            storeClickOrTouchPos(event);
            event.preventDefault();
            event.stopPropagation();
            let idx = parseInt(el.id.split("-")[0]);
            if (idx>=0 && idx<=this.$store.state.players.length) {
                if (longPress) {
                    this.show = false;
                    bus.$emit('dlg.open', 'sync', this.$store.state.players[idx]);
                } else {
                    this.setPlayer(this.$store.state.players[idx].id);
                }
            }
        },
        togglePower(longPress, el, event) {
            storeClickOrTouchPos(event);
            event.preventDefault();
            event.stopPropagation();
            if (queryParams.party) {
                return;
            }
            let idx = parseInt(el.id.split("-")[0]);
            if (idx>=0 && idx<=this.$store.state.players.length) {
                this.togglePlayerPower(this.$store.state.players[idx], longPress);
            }
        },
        clickLogo(longPress) {
            this.show = false;
            if (longPress) {
                window.open("https://lyrion.org", "_blank").focus();
            }
        },
        doCustomAction(action) {
            this.show = false;
            performCustomAction(action, this.$store.state.player);
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
        },
        showManagePlayers() {
            return this.connected && ((this.players && this.players.length>1) || this.otherPlayers.length>0) && !queryParams.party
        },
        showCustomActions() {
            return !this.noPlayer && this.customPlayerActions && this.customPlayerActions.length>0
        },
        playersDivider() {
            return this.showManagePlayers || undefined!=this.appLaunchPlayer || this.showCustomActions
        },
        playerSectionsDivider() {
            return !this.noPlayer && this.players && (this.players.length>1 || this.playerStatus.sleepTime || this.playerStatus.alarmStr)
        },
        showShortcuts() {
            return this.$store.state.ndShortcuts>0 && this.shortcuts.length>0
        },
        ndShortcuts() {
            return this.$store.state.ndShortcuts
        }
    },
    filters: {
        svgIcon: function (name, dark, updateIcon) {
            return "/material/svg/"+name+"?c="+(updateIcon ? LMS_UPDATE_SVG : dark ? LMS_DARK_SVG : LMS_LIGHT_SVG)+"&r="+LMS_MATERIAL_REVISION;
        },
        playerShortcut: function(index) {
            return IS_APPLE ? ("⌥+"+(9==index ? 0 : index+1)) : i18n("Alt+%1", 9==index ? 0 : index+1);
        },
        displayTime: function (value) {
            if (undefined==value) {
                return '';
            }
            return formatSeconds(Math.floor(value));
        }
    },
    watch: {
        'show': function(newVal) {

            bus.$emit('navdrawer', newVal);
            this.$store.commit('menuVisible', {name:'navdrawer', shown:newVal});
            if (newVal) {
                bus.$emit('refreshServerStatus');
                this.startStatusTimer();
            } else {
                this.cancelStatusTimer();
            }
        }
    },
    beforeDestroy() {
        this.cancelSleepTimer();
        this.cancelStatusTimer();
    }
})

