/**
 * LMS-Material
 *
 * Copyright (c) 2018-2019 Craig Drummond <craig.p.drummond@gmail.com>
 * MIT license.
 */

var TB_UI_SETTINGS     = {id:"tb:settings",       icon: "settings" };
var TB_PLAYER_SETTINGS = {id:"tb:playersettings", icon: "speaker" };
var TB_SERVER_SETTINGS = {id:"tb:serversettings", icon: "dns" };
var TB_INFO            = {id:"tb:info",           icon: "info" };
var TB_MANAGE_PLAYERS  = {id:"tb-manageplayers",  icon: "speaker_group" };
var TB_MINI_PLAYER     = {id:"tb:mini",           icon: "open_in_new" };

Vue.component('lms-toolbar', {
    template: `
<div>
<v-toolbar fixed dense app class="lms-toolbar noselect">
 <v-icon v-if="noPlayer" color="orange darken-2" class="toolbar-button">warning</v-icon>
 <div v-if="noPlayer && otherPlayers.length<1" class="noplayer-title ellipsis">{{trans.noplayer}}</div>
 <v-menu v-else bottom :disabled="!connected" class="ellipsis" v-model="showPlayerMenu">
  <v-toolbar-title slot="activator">
   <div class="maintoolbar-title ellipsis" v-bind:class="{'dimmed': !playerStatus.ison}">
    {{noPlayer ? trans.noplayer : player.name}}<v-icon v-if="playerStatus.sleepTime" class="player-status-icon">hotel</v-icon><v-icon v-if="playerStatus.synced" class="player-status-icon">link</v-icon></div>
   <div v-if="!desktop && !noPlayer" class="maintoolbar-subtitle subtext ellipsis" v-bind:class="{'dimmed' : !playerStatus.ison}">{{undefined===songInfo ? trans.nothingplaying : (!desktop && isNowPlayingPage && (!infoPlugin || !infoOpen)) ? playlist.count+playlist.duration : songInfo}}</div>
  </v-toolbar-title>
       
  <v-list class="toolbar-player-list">
   <template v-for="(item, index) in players">
    <v-subheader v-if="index==0 && !item.isgroup && (players[players.length-1].isgroup || otherPlayers.length>0)">{{trans.standardPlayers}}</v-subheader>
    <v-subheader v-else-if="index>0 && item.isgroup && !players[index-1].isgroup">{{trans.groupPlayers}}</v-subheader>
    <v-list-tile @click="setPlayer(item.id)">
     <v-list-tile-avatar v-if="players && players.length>1 || otherPlayers.length>0">
      <v-icon small v-if="players && players.length>1">{{player && item.id === player.id ? 'radio_button_checked' :'radio_button_unchecked'}}</v-icon>
      <v-icon small v-else></v-icon>
     </v-list-tile-avatar>
     <v-list-tile-content>
      <v-list-tile-title>{{item.name}}</v-list-tile-title>
     </v-list-tile-content>
      <v-list-tile-action v-if="index<10 && keyboardControl" class="menu-shortcut" v-bind:class="{'menu-shortcut-player':item.canpoweroff}">{{index|playerShortcut}}</v-list-tile-action>
      <v-list-tile-action>
       <v-btn icon><v-icon v-if="item.canpoweroff" style="float:right" v-bind:class="{'dimmed': (item.id==player.id ? !playerStatus.ison : !item.ison), 'active-btn':(item.id==player.id ? playerStatus.ison : item.ison) }" @click.stop="togglePower(item)">power_settings_new</v-icon></v-btn>
      </v-list-tile-action>
    </v-list-tile>
   </template>
   <template v-if="!mini && !nowplaying" v-for="(item, index) in otherPlayers">
    <v-subheader v-if="0==index || item.server!=otherPlayers[index-1].server">{{item.server}}</v-subheader>
    <v-list-tile @click="movePlayer(item)">
     <v-list-tile-avatar><v-icon small></v-icon></v-list-tile-avatar>
     <v-list-tile-content>
      <v-list-tile-title>{{item.name}}</v-list-tile-title>
     </v-list-tile-content>
    </v-list-tile>
   </template>

   <v-divider v-if="!mini && !nowplaying && ((players && players.length>1) || playerStatus.sleepTime)"></v-divider>

   <v-list-tile v-if="!mini && !nowplaying && multipleStandardPlayers" @click="bus.$emit('dlg.open', 'sync', player)">
    <v-list-tile-avatar v-if="menuIcons"><v-icon>link</v-icon></v-list-tile-avatar>
    <v-list-tile-content><v-list-tile-title>{{trans.synchronise}}</v-list-tile-title></v-list-tile-content>
    <v-list-tile-action v-if="keyboardControl" class="menu-shortcut player-menu-shortcut">{{trans.syncShortcut}}</v-list-tile-action>
   </v-list-tile>

   <v-list-tile v-if="!mini && !nowplaying && players && players.length>1" @click="menuAction(TB_MANAGE_PLAYERS.id)">
    <v-list-tile-avatar v-if="menuIcons"><v-icon>{{TB_MANAGE_PLAYERS.icon}}</v-icon></v-list-tile-avatar>
    <v-list-tile-content><v-list-tile-title>{{TB_MANAGE_PLAYERS.title}}</v-list-tile-title></v-list-tile-content>
    <v-list-tile-action v-if="TB_MANAGE_PLAYERS.shortcut && keyboardControl" class="menu-shortcut player-menu-shortcut">{{TB_MANAGE_PLAYERS.shortcut}}</v-list-tile-action>
   </v-list-tile>

   <v-list-tile v-if="!mini && !nowplaying && playerStatus.sleepTime" @click="bus.$emit('dlg.open', 'sleep', player)">
    <v-list-tile-avatar><v-icon>hotel</v-icon></v-list-tile-avatar>
    <v-list-tile-content>
     <v-list-tile-title>{{playerStatus.sleepTime | displayTime}}</v-list-tile-title>
    </v-list-tile-content>
   </v-list-tile>
  </v-list>
 </v-menu>
 <v-spacer></v-spacer>
 <v-btn v-show="desktop || wide" :disabled="!playerStatus.ison || noPlayer" icon flat class="toolbar-button" v-longpress="volumeDown" @click.middle="toggleMute" id="vol-down-btn"><v-icon>{{playerMuted ? 'volume_off' : 'volume_down'}}</v-icon></v-btn>
 <v-slider v-show="desktop || wide" :disabled="!playerDvc || !playerStatus.ison || noPlayer" step="1" v-model="playerVolume" class="vol-slider vol-full-slider" @click.stop="setVolume" @click.middle="toggleMute" id="vol-slider" @start="volumeSliderStart" @end="volumeSliderEnd"></v-slider>
 <div v-show="!playerDvc && (desktop || wide)" :class="['vol-fixed-label', !desktop || !infoPlugin ? 'vol-fixed-label-noinf' : '', nowplaying ? 'vol-fixed-label-np' : '', mini ? 'vol-fixed-label-mini' : '']">{{trans.fixedVol}}</div>
 <v-btn v-show="desktop || wide" :disabled="!playerStatus.ison || noPlayer" icon flat class="toolbar-button" v-longpress="volumeUp" @click.middle="toggleMute" id="vol-up-btn"><v-icon>{{playerMuted ? 'volume_off' : 'volume_up'}}</v-icon></v-btn>
 <p v-show="desktop || wide" class="vol-full-label" v-bind:class="{'vol-full-label-np': nowplaying, 'dimmed':!playerStatus.ison || noPlayer}" @click.middle="toggleMute">{{playerVolume|displayVolume}}%</p>
 <v-btn v-show="!(desktop || wide)" :disabled="!playerStatus.ison || noPlayer" icon flat class="toolbar-button" v-longpress="volumeClick" @click.middle="toggleMute" id="vol-btn">
  <v-icon v-if="playerStatus.volume>0">volume_up</v-icon>
  <v-icon v-else-if="playerStatus.volume==0">volume_down</v-icon>
  <v-icon v-else>volume_off</v-icon>
 </v-btn>
 <div class="vol-label" v-if="!(desktop || wide)" v-bind:class="{'dimmed':!playerStatus.ison || noPlayer}">{{playerStatus.volume|displayVolume}}%</div>
 <v-btn icon :title="trans.info | tooltip(trans.infoShortcut,keyboardControl)" v-if="!desktop && infoPlugin && isNowPlayingPage && !infoOpen" @click.stop="bus.$emit('info')" class="toolbar-button" id="inf">
  <v-icon>info_outline</v-icon>
 </v-btn>
 <v-btn icon v-if="!desktop && ( (isNowPlayingPage && (infoOpen || !infoPlugin)) || !isNowPlayingPage)" v-longpress="playPauseButton" @click.middle="showSleep" class="toolbar-button" id="pp">
  <v-icon>{{playerStatus.isplaying ? 'pause_circle_outline' : 'play_circle_outline'}}</v-icon>
 </v-btn>
 <v-btn icon :title="trans.info | tooltip(trans.infoShortcut,keyboardControl)" v-if="desktop && infoPlugin && !mini && !nowplaying" @click.native="emitInfo" class="toolbar-button">
  <v-icon>info_outline</v-icon>
 </v-btn>
 <v-btn icon :title="trans.showLarge | tooltip(trans.showLargeShortcut,keyboardControl)" v-if="desktop && !largeView && !mini && !nowplaying" @click.native="toggleLargeView(true)" class="toolbar-button">
  <v-icon>fullscreen</v-icon>
 </v-btn>
 <v-btn icon :title="trans.hideLarge | tooltip(trans.showLargeShortcut,keyboardControl)" v-if="desktop && largeView && !mini && !nowplaying" @click.native="toggleLargeView(false)" class="toolbar-button">
  <v-icon>fullscreen_exit</v-icon>
 </v-btn>
 <v-menu v-if="connected && !mini && !nowplaying" bottom left v-model="showMainMenu">
  <v-btn slot="activator" icon><img v-if="pluginUpdatesAvailable" class="svg-img" :src="'update' | svgIcon(darkUi, true)"></img><v-icon v-else>more_vert</v-icon></v-btn>
  <v-list>
   <template v-for="(item, index) in menuItems">
    <v-divider v-if="item===DIVIDER"></v-divider>
    <v-list-tile v-else-if="item.id!=TB_SERVER_SETTINGS.id || unlockAll" @click="menuAction(item.id)">
     <v-list-tile-avatar v-if="menuIcons"><img v-if="TB_INFO.id==item.id && pluginUpdatesAvailable" class="svg-img" :src="'update' | svgIcon(darkUi, true)"></img><v-icon v-else>{{item.icon}}</v-icon></v-list-tile-avatar>
     <v-list-tile-content>
      <v-list-tile-title>{{item.title}}</v-list-tile-title>
      <v-list-tile-sub-title v-if="TB_INFO.id==item.id && pluginUpdatesAvailable">{{trans.pluginUpdatesAvailable}}</v-list-tile-sub-title>
     </v-list-tile-content>
     <v-list-tile-action v-if="item.shortcut && keyboardControl" class="menu-shortcut">{{item.shortcut}}</v-list-tile-action>
    </v-list-tile>
   </template>
   <v-list-tile v-if="showPlayerMenuEntry" href="intent://sbplayer/#Intent;scheme=angrygoat;package=com.angrygoat.android.sbplayer;end">
    <v-list-tile-avatar v-if="menuIcons"><v-icon>surround_sound</v-icon></v-list-tile-avatar>
    <v-list-tile-title>{{trans.startPlayer}}</v-list-tile-title>
   </v-list-tile>
   <v-divider v-if="!desktop && otherMenuItems[currentPage] && otherMenuItems[currentPage].length>0"></v-divider>
   <template v-if="!desktop && otherMenuItems[currentPage] && otherMenuItems[currentPage].length>0" v-for="(action, index) in otherMenuItems[currentPage]">
    <v-list-tile @click="bus.$emit('settingsMenuAction:'+currentPage, action)">
     <v-list-tile-avatar v-if="menuIcons">
      <img v-if="ACTIONS[action].svg" class="svg-img" :src="ACTIONS[action].svg | svgIcon(darkUi)"></img>
      <v-icon v-else>{{ACTIONS[action].icon}}</v-icon>
     </v-list-tile-avatar>
     <v-list-tile-content><v-list-tile-title>{{ACTIONS[action].title}}</v-list-tile-title></v-list-tile-content>
     <v-list-tile-action v-if="ACTIONS[action].key && keyboardControl" class="menu-shortcut">{{shortcutStr(ACTIONS[action].key)}}</v-list-tile-action>
    </v-list-tile>
   </template>
  </v-list>
 </v-menu>
 <v-btn v-else-if="!mini && !nowplaying" icon :title="trans.connectionLost" @click.native="bus.$emit('showError', undefined, trans.connectionLost);">
  <v-icon color="red">error</v-icon>
 </v-btn>
</v-toolbar>
<v-snackbar v-model="snackbar.show" :multi-line="true" :timeout="snackbar.timeout ? snackbar.timeout : 2500" :color="snackbar.color" top>{{ snackbar.msg }}</v-snackbar>
</div>
    `,
    props: ['desktop', 'nowplaying', 'mini'],
    data() {
        return { songInfo:undefined,
                 playlist: { count: "", duration: "" },
                 playerStatus: { ison: 1, isplaying: false, volume: 0, synced: false, sleepTime: undefined,
                                 current: { title:undefined, artist:undefined, album:undefined } },
                 menuItems: [],
                 showPlayerMenu: false,
                 showMainMenu: false,
                 otherMenuItems:{},
                 trans:{noplayer:undefined, nothingplaying:undefined, synchronise:undefined, syncShortcut:undefined, info:undefined, infoShortcut:undefined,
                        connectionLost:undefined, showLarge:undefined, showLargeShortcut:undefined, hideLarge:undefined, 
                        startPlayer:undefined, groupPlayers:undefined, standardPlayers:undefined, otherServerPlayers:undefined,
                        pluginUpdatesAvailable:undefined, fixedVol:undefined},
                 infoOpen: false,
                 largeView: false,
                 playerVolume: 0,
                 playerMuted: false,
                 playerDvc: true,
                 snackbar:{ show: false, msg: undefined},
                 connected: true,
                 wide: false
               }
    },
    mounted() {
        if (!this.mini && !this.desktop) {
            setInterval(function () {
                this.wide = window.innerWidth>=900;
            }.bind(this), 1000);
            bus.$on('windowWidthChanged', function() {
                this.wide = window.innerWidth>=900;
            }.bind(this));
        }

        bus.$on('settingsMenuActions', function(actions, page) {
            this.otherMenuItems[page]=[];
            for (var i=0, len=actions.length; i<len; ++i) {
                this.$set(this.otherMenuItems[page], i, actions[i]);
            }
            this.$forceUpdate();
        }.bind(this));

        if (!this.desktop) {
            bus.$on('queueStatus', function(count, duration) {
                if (count>0) {
                    this.playlist.count = i18np("1 Track", "%1 Tracks", count);
                } else {
                    this.playlist.count = "";
                }
                if (duration>0) {
                    this.playlist.duration=" (" + formatSeconds(Math.floor(duration)) + ")";
                } else {
                    this.playlist.duration="";
                }
            }.bind(this));
        }

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
            if (playerStatus.current.title!=this.playerStatus.current.title ||
                (playerStatus.current.artist && playerStatus.current.artist!=this.playerStatus.current.artist) ||
                (playerStatus.current.trackartist && playerStatus.current.trackartist!=this.playerStatus.current.artist) ) {
                this.playerStatus.current.title=playerStatus.current.title;
                this.playerStatus.current.artist=playerStatus.current.artist ? playerStatus.current.artist : playerStatus.current.trackartist;
                this.playerStatus.current.album=playerStatus.current.album;

                if (this.playerStatus.current.title) {
                    if (this.playerStatus.current.artist) {
                        this.songInfo=this.playerStatus.current.title+SEPARATOR+this.playerStatus.current.artist;
                    } else {
                        this.songInfo=this.playerStatus.current.title;
                    }
                } else if (this.playerStatus.current.artist) {
                    this.songInfo=this.playerStatus.current.artist;
                } else {
                    this.songInfo=undefined;
                }
            }

            this.playerDvc = playerStatus.dvc;
            if (!this.movingVolumeSlider) {
                this.playerMuted = playerStatus.volume<0;
                var vol = Math.abs(playerStatus.volume);
                if (vol!=this.playerVolume) {
                    this.playerVolume = vol;
                }
            }
        }.bind(this));
        
        bus.$on('langChanged', function() {
            this.initItems();
        }.bind(this));
        this.initItems();

        bus.$on('esc', function() {
            this.showPlayerMenu = false;
        }.bind(this));
        bus.$on('hideMenu', function(name) {
            if (name=='main') {
                this.showMainMenu = false;
            } else if (name=='player') {
                this.showPlayerMenu = false;
            }
        }.bind(this));

        bus.$on('dialogOpen', function(name, val) {
            if (name=='info-dialog') {
                this.infoOpen = val;
            }
            this.initItems();
        }.bind(this));
        bus.$on('largeViewVisible', function(val) {
            this.largeView = val;
        }.bind(this));

        if (this.desktop) {
            bus.$on('playerChanged', function() {
                // Ensure we update volume when player changes.
                this.playerVolume.id = undefined;
            }.bind(this));
        }

        bus.$on('showError', function(err, msg) {
            this.snackbar = {msg: (msg ? msg : i18n("Something went wrong!")) + (err ? " (" + err+")" : ""),
                             show: true, color: 'error' };
        }.bind(this));
        bus.$on('showMessage', function(msg) {
            this.snackbar = {msg: msg, show: true };
        }.bind(this));

        bus.$on('networkStatus', function(connected) {
            if (connected) {
                this.connected = true;
                this.cancelDisconnectedTimer();
            } else if (this.connected && !this.disconnectedTimer) {
                // Delay showing wanring for 1.5s
                this.disconnectedTimer = setInterval(function () {
                    this.connected = false;
                }.bind(this), 1500);
            }
        }.bind(this));

        if (!IS_MOBILE) {
            if (this.desktop) {
                this.addMouseWheelhandler("vol-down-btn");
                this.addMouseWheelhandler("vol-slider");
                this.addMouseWheelhandler("vol-up-btn");
            } else {
                this.addMouseWheelhandler("vol-btn");
            }

            if (!this.mini && !this.nowplaying) {
                bindKey(LMS_SETTINGS_KEYBOARD, 'mod');
                bindKey(LMS_PLAYER_SETTINGS_KEYBOARD, 'mod');
                bindKey(LMS_SERVER_SETTINGS_KEYBOARD, 'mod');
                bindKey(LMS_INFORMATION_KEYBOARD, 'mod');
                bindKey(LMS_MANAGEPLAYERS_KEYBOARD, 'mod');
                bindKey(LMS_SYNC_KEYBOARD, 'mod');
                bindKey('1', 'alt');
                bindKey('2', 'alt');
                bindKey('3', 'alt');
                bindKey('4', 'alt');
                bindKey('5', 'alt');
                bindKey('6', 'alt');
                bindKey('7', 'alt');
                bindKey('8', 'alt');
                bindKey('9', 'alt');
                bindKey('0', 'alt');
                bus.$on('keyboard', function(key, modifier) {
                    if (this.$store.state.openDialogs.length>0) {
                        return;
                    }
                    if ('mod'==modifier) {
                        if (this.$store.state.visibleMenus.size==1 && this.$store.state.visibleMenus.has('main')) {
                            if (LMS_SETTINGS_KEYBOARD==key || LMS_PLAYER_SETTINGS_KEYBOARD==key ||  LMS_SERVER_SETTINGS_KEYBOARD==key || LMS_INFORMATION_KEYBOARD==key) {
                                this.menuAction(LMS_SETTINGS_KEYBOARD==key ? TB_UI_SETTINGS.id : LMS_PLAYER_SETTINGS_KEYBOARD==key ? TB_PLAYER_SETTINGS.id : 
                                                LMS_SERVER_SETTINGS_KEYBOARD==key ? TB_SERVER_SETTINGS.id : TB_INFO.id);
                                bus.$emit('hideMenu', 'main');
                            }
                        } else if (this.$store.state.visibleMenus.size==1 && this.$store.state.visibleMenus.has('player')) {
                            if (LMS_MANAGEPLAYERS_KEYBOARD==key && this.$store.state.players.length>1) {
                                this.menuAction(TB_MANAGE_PLAYERS.id);
                                bus.$emit('hideMenu', 'player');
                            } else if (LMS_SYNC_KEYBOARD==key && this.$store.state.players && this.$store.state.players.length>1 && !this.$store.state.players[1].isgroup) {
                                bus.$emit('dlg.open', 'sync', this.$store.state.player);
                                bus.$emit('hideMenu', 'player');
                            }
                        } else if (this.$store.state.visibleMenus.size==0) {
                            if (LMS_SETTINGS_KEYBOARD==key || LMS_PLAYER_SETTINGS_KEYBOARD==key || LMS_SERVER_SETTINGS_KEYBOARD==key || LMS_INFORMATION_KEYBOARD==key ||
                                (LMS_MANAGEPLAYERS_KEYBOARD==key && this.$store.state.players.length>1)) {
                                this.menuAction(LMS_SETTINGS_KEYBOARD==key ? TB_UI_SETTINGS.id : LMS_PLAYER_SETTINGS_KEYBOARD==key ? TB_PLAYER_SETTINGS.id :
                                                LMS_SERVER_SETTINGS_KEYBOARD==key ? TB_SERVER_SETTINGS.id : LMS_INFORMATION_KEYBOARD==key ? TB_INFO.id : TB_MANAGE_PLAYERS.id);
                            } else if (LMS_SYNC_KEYBOARD==key && this.$store.state.players && this.$store.state.players.length>1 && !this.$store.state.players[1].isgroup) {
                                bus.$emit('dlg.open', 'sync', this.$store.state.player);
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
                    }
                }.bind(this));
            }
        }
    },
    methods: {
        addMouseWheelhandler(id) {
            var elem = document.getElementById(id);
            if (elem) {
                elem.addEventListener('mousewheel', function(event) {
                    if (event.wheelDeltaY<0) {
                        this.volumeDown();
                    } else if (event.wheelDeltaY>0) {
                        this.volumeUp();
                    }
                    return false;
                }.bind(this), { passive: true });
            }
        },
        initItems() {
            TB_UI_SETTINGS.title=i18n('Settings');
            TB_UI_SETTINGS.shortcut=shortcutStr(LMS_SETTINGS_KEYBOARD);
            TB_PLAYER_SETTINGS.title=i18n('Player settings');
            TB_PLAYER_SETTINGS.shortcut=shortcutStr(LMS_PLAYER_SETTINGS_KEYBOARD);
            TB_SERVER_SETTINGS.title=i18n('Server settings');
            TB_SERVER_SETTINGS.shortcut=shortcutStr(LMS_SERVER_SETTINGS_KEYBOARD);
            TB_INFO.title=i18n('Information');
            TB_INFO.shortcut=shortcutStr(LMS_INFORMATION_KEYBOARD);
            TB_MANAGE_PLAYERS.title=i18n('Manage players');
            TB_MANAGE_PLAYERS.shortcut=shortcutStr(LMS_MANAGEPLAYERS_KEYBOARD);
            TB_MINI_PLAYER.title=i18n('Open mini-player');
            this.menuItems = [ TB_UI_SETTINGS, TB_PLAYER_SETTINGS, TB_SERVER_SETTINGS, TB_INFO ];
            if (this.desktop && !this.mini & !IS_MOBILE) {
                this.menuItems.push(DIVIDER);
                this.menuItems.push(TB_MINI_PLAYER);
            }
            this.trans = {noplayer:i18n('No Player'), nothingplaying:i18n('Nothing playing'), synchronise:i18n('Synchronise'), syncShortcut:shortcutStr(LMS_SYNC_KEYBOARD),
                          info:i18n("Show current track information"), infoShortcut:shortcutStr(LMS_TRACK_INFO_KEYBOARD), 
                          showLarge:i18n("Expand now playing"), showLargeShortcut:shortcutStr(LMS_EXPAND_NP_KEYBOARD, true),
                          hideLarge:i18n("Collapse now playing"), startPlayer:i18n("Start player"), connectionLost:i18n('Server connection lost...'),
                          groupPlayers:("Group Players"), standardPlayers:i18n("Standard Players"), pluginUpdatesAvailable:i18n('Plugin updates available'),
                          fixedVol:i18n("Fixed Volume")};
        },
        setPlayer(id) {
            if (id != this.$store.state.player.id) {
                this.$store.commit('setPlayer', id);
            }
        },
        menuAction(id) {
            if (TB_UI_SETTINGS.id==id) {
                bus.$emit('dlg.open', 'uisettings');
            } else if (TB_PLAYER_SETTINGS.id==id) {
                bus.$emit('dlg.open', 'playersettings');
            } else if (TB_SERVER_SETTINGS.id==id) {
                if (this.$store.state.unlockAll) {
                    bus.$emit('dlg.open', 'iframe', '/material/settings/server/basic.html', TB_SERVER_SETTINGS.title);
                }
            } else if (TB_INFO.id==id) {
                bus.$emit('dlg.open', 'info');
            } else if (TB_MANAGE_PLAYERS.id==id) {
                bus.$emit('dlg.open', 'manage');
            } else if (TB_MINI_PLAYER.id==id) {
                // Height should be 112, but on my system sometimes its too small? Added 6 pix to give some padding...
                window.open("mini", "MiniPlayer", 'width=600,height=118,status=no,menubar=no,toolbar=no,location=no');
            } else {
                bus.$emit('toolbarAction', id);
            }
        },
        emitInfo() {
            if (this.$store.state.visibleMenus.size>0) {
                return;
            }
            bus.$emit('info');
        },
        toggleLargeView(on) {
            if (this.$store.state.visibleMenus.size>0) {
                return;
            }
            bus.$emit('largeView', on);
        },
        togglePower(player, state) {
            var ison = this.$store.state.player.id == player.id ? this.playerStatus.ison : player.ison;
            lmsCommand(player.id, ["power", ison ? "0" : "1"]).then(({data}) => {
                bus.$emit('refreshStatus', player.id);
            });
        },
        volumeDown(toggleMute) {
            if (this.$store.state.visibleMenus.size>0) {
                return;
            }
            if (toggleMute && this.playerDvc) {
                bus.$emit('playerCommand', ['mixer', 'muting', 'toggle']);
            } else {
                bus.$emit('playerCommand', ["mixer", "volume", adjustVolume(Math.abs(this.playerVolume), false)]);
            }
        },
        volumeUp(toggleMute) {
            if (this.$store.state.visibleMenus.size>0) {
                return;
            }
            if (toggleMute && this.playerDvc) {
                bus.$emit('playerCommand', ['mixer', 'muting', 'toggle']);
            } else {
                bus.$emit('playerCommand', ["mixer", "volume", adjustVolume(Math.abs(this.playerVolume), true)]);
            }
        },
        volumeClick(toggleMute) {
            if (this.$store.state.visibleMenus.size>0) {
                return;
            }
            if (toggleMute && this.playerDvc) {
                bus.$emit('playerCommand', ['mixer', 'muting', 'toggle']);
            } else if (this.playerMuted) {
                bus.$emit('playerCommand', ['mixer', 'muting', 0]);
            } else {
                bus.$emit('dlg.open', 'volume');
            }
        },
        setVolume() {
            bus.$emit('playerCommand', ["mixer", "volume", this.playerVolume]);
        },
        toggleMute() {
            bus.$emit('playerCommand', ['mixer', 'muting', 'toggle']);
        },
        playPauseButton(long) {
            if (this.$store.state.visibleMenus.size>0) {
                return;
            }
            if (long) {
                bus.$emit('dlg.open', 'sleep', this.$store.state.player);
            } else {
                bus.$emit('playerCommand', [this.playerStatus.isplaying ? 'pause' : 'play']);
            }
        },
        showSleep() {
            if (this.$store.state.visibleMenus.size>0) {
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
        movePlayer(player) {
            this.$confirm(i18n("Move '%1' from '%2' to this server?", player.name, player.server), {buttonTrueText: i18n('Move'), buttonFalseText: i18n('Cancel')}).then(res => {
                if (res) {
                    bus.$emit('movePlayer', player);
                }
            });
        },
        volumeSliderStart() {
            this.movingVolumeSlider=true;
        },
        volumeSliderEnd() {
            if (this.$store.state.player) {
                lmsCommand(this.$store.state.player.id, ["mixer", "volume", this.playerVolume]).then(({data}) => {
                    bus.$emit('updatePlayer', this.$store.state.player.id);
                    this.movingVolumeSlider=false;
                }).catch(err => {
                    bus.$emit('updatePlayer', this.$store.state.player.id);
                    this.movingVolumeSlider=false;
                });
            } else {
                this.movingVolumeSlider=false;
            }
            this.cancelSendVolumeTimer();
        },
        cancelSendVolumeTimer() {
            if (undefined!==this.sendVolumeTimer) {
                clearTimeout(this.sendVolumeTimer);
                this.sendVolumeTimer = undefined;
            }
        },
        resetSendVolumeTimer() {
            this.cancelSendVolumeTimer();
            this.sendVolumeTimer = setTimeout(function () {
                bus.$emit('playerCommand', ["mixer", "volume", this.playerVolume]);
            }.bind(this), LMS_VOLUME_DEBOUNCE);
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
        infoPlugin () {
            return this.$store.state.infoPlugin
        },
        showPlayerMenuEntry () {
            return IS_ANDROID && this.$store.state.showPlayerMenuEntry
        },
        isNowPlayingPage() {
            return this.$store.state.page == 'now-playing'
        },
        currentPage() {
            return this.$store.state.page
        },
        noPlayer () {
            return !this.$store.state.players || this.$store.state.players.length<1
        },
        darkUi () {
            return this.$store.state.darkUi
        },
        menuIcons() {
            return this.$store.state.menuIcons
        },
        menuVisible() {
            return this.$store.state.visibleMenus.size>0
        },
        pluginUpdatesAvailable() {
            return this.$store.state.pluginUpdatesAvailable
        },
        keyboardControl() {
            return this.$store.state.keyboardControl && !IS_MOBILE
        },
        unlockAll() {
            return this.$store.state.unlockAll
        }
    },
    filters: {
        displayTime: function (value) {
            if (undefined==value) {
                return '';
            }
            return formatSeconds(Math.floor(value));
        },
        displayVolume: function (value) {
            if (undefined==value) {
                return '';
            }
            return value<0 ? -1*value : value;
        },
        svgIcon: function (name, dark, update) {
            return "/material/svg/"+name+"?c="+(update ? LMS_UPDATE_SVG : (dark ? LMS_DARK_SVG : LMS_LIGHT_SVG))+"&r="+LMS_MATERIAL_REVISION;
        },
        tooltip: function (str, shortcut, showShortcut) {
            return showShortcut ? str+SEPARATOR+shortcut : str;
        },
        playerShortcut: function(index) {
            return i18n("Alt+%1", 9==index ? 0 : index+1);
        }
    },
    watch: {
        'playerVolume': function(newVal) {
            if (newVal>=0) {
                this.resetSendVolumeTimer();
            }
        },
        'showPlayerMenu': function(newVal) {
            this.$store.commit('menuVisible', {name:'player', shown:newVal});
            if (newVal) {
                bus.$emit('refreshServerStatus');
            }
        },
        'showMainMenu': function(newVal) {
            this.$store.commit('menuVisible', {name:'main', shown:newVal});
        }
    },
    beforeDestroy() {
        this.cancelSleepTimer();
        this.cancelDisconnectedTimer();
    }
})
