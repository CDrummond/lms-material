/**
 * LMS-Material
 *
 * Copyright (c) 2018-2019 Craig Drummond <craig.p.drummond@gmail.com>
 * MIT license.
 */

var TB_UI_SETTINGS     = {id:"tb:settings",       icon: "settings" };
var TB_PLAYER_SETTINGS = {id:"tb:playersettings", icon: "speaker" };
var TB_INFO            = {id:"tb:info",           icon: "info" };
var TB_MANAGE_PLAYERS  = {id:"tb-manageplayers",  icon: "speaker_group" };
var TB_MINI_PLAYER     = {id:"tb:mini",           icon: "open_in_new" };
var toolbarComponent;
var mediaAudio = undefined;
var mediaStarted = false;

function initMediaSessionAudio() {
    if (mediaAudio == undefined) {
        mediaAudio = document.createElement('audio');
        //window.removeEventListener('touchend', initMediaSessionAudio);
        window.removeEventListener('click', initMediaSessionAudio);
        setTimeout(function () {
            toolbarComponent.updateMediaSession(toolbarComponent.playerStatus.current, true);
        }, 500);
    }
}

function startMediaSession() {
    if (!mediaAudio || mediaStarted) {
        return;
    }
    mediaAudio.src = "html/audio/silence.ogg";
    mediaAudio.play().then(_ => {
        mediaAudio.currentTime = 0; // Go back to start
        mediaAudio.pause();
        toolbarComponent.updateMediaSession(toolbarComponent.playerStatus.current, true);
        navigator.mediaSession.playbackState = toolbarComponent.playerStatus && toolbarComponent.playerStatus.isplaying ? "playing" : "paused";
        mediaStarted = true;
    }).catch(err => {
    });
}

function stopMediaSession() {
    if (!mediaStarted) {
        return;
    }
    mediaStarted = false;
    if (mediaAudio.src) {
        mediaAudio.src = undefined;
    }
    navigator.mediaSession.metadata = undefined;
}

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
       <v-btn icon><v-icon v-if="item.canpoweroff" style="float:right" v-bind:class="{'dimmed': (item.id==player.id ? !playerStatus.ison : !item.ison), 'active-btn':(item.id==player.id ? playerStatus.ison : item.ison) }" @click.stop="togglePower(item)">power_settings_new</v-icon></
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
    <v-list-tile-action v-if="keyboardControl" class="menu-shortcut">{{trans.syncShortcut}}</v-list-tile-action>
   </v-list-tile>

   <v-list-tile v-if="!mini && !nowplaying && players && players.length>1" @click="menuAction(TB_MANAGE_PLAYERS.id)">
    <v-list-tile-avatar v-if="menuIcons"><v-icon>{{TB_MANAGE_PLAYERS.icon}}</v-icon></v-list-tile-avatar>
    <v-list-tile-content><v-list-tile-title>{{TB_MANAGE_PLAYERS.title}}</v-list-tile-title></v-list-tile-content>
    <v-list-tile-action v-if="TB_MANAGE_PLAYERS.shortcut && keyboardControl" class="menu-shortcut">{{TB_MANAGE_PLAYERS.shortcut}}</v-list-tile-action>
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
 <v-btn v-show="(desktop || wide) && playerStatus.digital_volume_control" :disabled="!playerStatus.ison || noPlayer" icon flat class="toolbar-button" v-longpress="volumeDown" @click.middle="toggleMute" id="vol-down-btn"><v-icon>{{playerMuted ? 'volume_off' : 'volume_down'}}</v-icon></v-btn>
 <v-slider v-show="(desktop || wide) && playerStatus.digital_volume_control" :disabled="!playerStatus.ison || noPlayer" step="1" v-model="playerVolume" class="vol-slider vol-full-slider" @click.stop="setVolume" @click.middle="toggleMute" id="vol-slider" @start="volumeSliderStart" @end="volumeSliderEnd"></v-slider>
 <v-btn v-show="(desktop || wide) && playerStatus.digital_volume_control" :disabled="!playerStatus.ison || noPlayer" icon flat class="toolbar-button" v-longpress="volumeUp" @click.middle="toggleMute" id="vol-up-btn"><v-icon>{{playerMuted ? 'volume_off' : 'volume_up'}}</v-icon></v-btn>
 <p v-show="(desktop || wide) && playerStatus.digital_volume_control" class="vol-full-label" v-bind:class="{'vol-full-label-np': nowplaying, 'dimmed':!playerStatus.ison || noPlayer}" @click.middle="toggleMute">{{playerVolume|displayVolume}}%</p>
 <v-btn v-show="!(desktop || wide) && playerStatus.digital_volume_control" :disabled="!playerStatus.ison || noPlayer" icon flat class="toolbar-button" v-longpress="volumeClick" @click.middle="toggleMute" id="vol-btn">
  <v-icon v-if="playerStatus.volume>0">volume_up</v-icon>
  <v-icon v-else-if="playerStatus.volume==0">volume_down</v-icon>
  <v-icon v-else>volume_off</v-icon>
 </v-btn>
 <div class="vol-label" v-if="!(desktop || wide) && playerStatus.digital_volume_control" v-bind:class="{'dimmed':!playerStatus.ison || noPlayer}">{{playerStatus.volume|displayVolume}}%</div>
 <v-btn icon :title="trans.info | tooltip(trans.infoShortcut,keyboardControl)" v-if="!desktop && infoPlugin && isNowPlayingPage && !infoOpen" @click.stop="bus.$emit('info')" class="toolbar-button" id="inf">
  <v-icon>info_outline</v-icon>
 </v-btn>
 <v-btn icon v-if="!desktop && ( (isNowPlayingPage && (infoOpen || !infoPlugin)) || !isNowPlayingPage)" @click.stop="playPauseButton" class="toolbar-button" id="pp">
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
    <v-list-tile v-else @click="menuAction(item.id)">
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
                 playerStatus: { ison: 1, isplaying: false, volume: 0, digital_volume_control: true, synced: false,
                                 current: { title:undefined, artist:undefined, album:undefined }, sleepTime: undefined },
                 menuItems: [],
                 showPlayerMenu: false,
                 showMainMenu: false,
                 otherMenuItems:{},
                 trans:{noplayer:undefined, nothingplaying:undefined, synchronise:undefined, syncShortcut:undefined, info:undefined, infoShortcut:undefined,
                        connectionLost:undefined, showLarge:undefined, showLargeShortcut:undefined, hideLarge:undefined, 
                        startPlayer:undefined, groupPlayers:undefined, standardPlayers:undefined, otherServerPlayers:undefined,
                        pluginUpdatesAvailable:undefined},
                 infoOpen: false,
                 largeView: false,
                 playerVolume: 0,
                 playerMuted: false,
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
            if (playerStatus.digital_volume_control!=this.playerStatus.digital_volume_control) {
                this.playerStatus.digital_volume_control = playerStatus.digital_volume_control;
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

            if (!this.movingVolumeSlider) {
                this.playerMuted = playerStatus.volume<0;
                var vol = Math.abs(playerStatus.volume);
                if (vol!=this.playerVolume) {
                    this.playerVolume = vol;
                }
            }
            this.updateMediaSession(playerStatus.current);
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

        if ('mediaSession' in navigator && IS_MOBILE) {
            toolbarComponent = this;
            //window.addEventListener('touchend', initMediaSessionAudio);
            window.addEventListener('click', initMediaSessionAudio);
            this.media={title:undefined, artist:undefined, album:undefined, cover:undefined};
            navigator.mediaSession.setActionHandler('play', () => {
                if (this.playerStatus && this.playerStatus.isplaying) {
                    bus.$emit('playerCommand', ['pause']);
                } else {
                    bus.$emit('playerCommand', ['play']);
                }
            });
            navigator.mediaSession.setActionHandler('pause', function() {
                bus.$emit('playerCommand', ['pause']);
            });
            navigator.mediaSession.setActionHandler('previoustrack', function() {
                bus.$emit('playerCommand', ['button', 'jump_rew']);
            });
            navigator.mediaSession.setActionHandler('nexttrack', function() {
                bus.$emit('playerCommand', ['playlist', 'index', '+1']);
            });
            bus.$on('currentCover', function(coverUrl) {
                this.media.cover = coverUrl;
                this.updateMediaSession(this.playerStatus.current, true);
            }.bind(this));
            bus.$emit('getCurrentCover');
            bus.$on('haveLocalAndroidPlayer', function(coverUrl) {
                this.updateMediaSession(undefined, true);
            }.bind(this));
            bus.$on('lsAndNotifChanged', function(coverUrl) {
                this.updateMediaSession(this.playerStatus.current, true);
            }.bind(this));
        }
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
                    if (!this.$store.state.keyboardControl || this.$store.state.openDialogs.length>0) {
                        return;
                    }
                    if ('mod'==modifier) {
                        if (this.$store.state.visibleMenus.size==1 && this.$store.state.visibleMenus.has('main')) {
                            if (LMS_SETTINGS_KEYBOARD==key || LMS_PLAYER_SETTINGS_KEYBOARD==key || LMS_INFORMATION_KEYBOARD==key) {
                                this.menuAction(LMS_SETTINGS_KEYBOARD==key ? TB_UI_SETTINGS.id : LMS_PLAYER_SETTINGS_KEYBOARD==key ? TB_PLAYER_SETTINGS.id : TB_INFO.id);
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
                            if (LMS_SETTINGS_KEYBOARD==key || LMS_PLAYER_SETTINGS_KEYBOARD==key || LMS_INFORMATION_KEYBOARD==key ||
                                (LMS_MANAGEPLAYERS_KEYBOARD==key && this.$store.state.players.length>1)) {
                                this.menuAction(LMS_SETTINGS_KEYBOARD==key ? TB_UI_SETTINGS.id : LMS_PLAYER_SETTINGS_KEYBOARD==key ? TB_PLAYER_SETTINGS.id :
                                                LMS_INFORMATION_KEYBOARD==key ? TB_INFO.id : TB_MANAGE_PLAYERS.id);
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
        updateMediaSession(track, force) {
            if (!mediaAudio) {
                return;
            }
            if ('mediaSession' in navigator) {
                if (haveLocalAndroidPlayer || 'never'==this.$store.state.lsAndNotif ||
                    ('playing'==this.$store.state.lsAndNotif &&
                              (undefined==track || (isEmpty(track.title) && isEmpty(track.trackartist) && isEmpty(track.artist) && isEmpty(track.album)) ) ) ) {
                    stopMediaSession();
                    this.media.title = undefined;
                    this.media.artist = undefined;
                    this.media.album = undefined;
                } else {
                    startMediaSession();
                    navigator.mediaSession.playbackState = this.playerStatus && this.playerStatus.isplaying ? "playing" : "paused";
                    var artist = track.trackartist ? track.trackartist : track.artist;
                    if (force || track.title!=this.media.title || artist!=this.media.artist || track.album!=this.media.album) {
                        this.media.title = track.title;
                        this.media.artist = artist;
                        this.media.album = track.album;
                        navigator.mediaSession.metadata = new MediaMetadata({
                            title: this.media.title,
                            artist: this.media.artist,
                            album: this.media.album,
                            artwork: [ {src: ""+this.media.cover, type: 'image/jpeg'}]
                        });
                    }
                }
            }
        },
        initItems() {
            TB_UI_SETTINGS.title=i18n('Settings');
            TB_UI_SETTINGS.shortcut=shortcutStr(LMS_SETTINGS_KEYBOARD);
            TB_PLAYER_SETTINGS.title=i18n('Player settings');
            TB_PLAYER_SETTINGS.shortcut=shortcutStr(LMS_PLAYER_SETTINGS_KEYBOARD);
            TB_INFO.title=i18n('Information');
            TB_INFO.shortcut=shortcutStr(LMS_INFORMATION_KEYBOARD);
            TB_MANAGE_PLAYERS.title=i18n('Manage players');
            TB_MANAGE_PLAYERS.shortcut=shortcutStr(LMS_MANAGEPLAYERS_KEYBOARD);
            TB_MINI_PLAYER.title=i18n('Open mini-player');
            this.menuItems = [ TB_UI_SETTINGS, TB_PLAYER_SETTINGS, TB_INFO ];
            if (this.desktop && !this.mini & !IS_MOBILE) {
                this.menuItems.push(DIVIDER);
                this.menuItems.push(TB_MINI_PLAYER);
            }
            this.trans = {noplayer:i18n('No Player'), nothingplaying:i18n('Nothing playing'), synchronise:i18n('Synchronise'), syncShortcut:shortcutStr(LMS_SYNC_KEYBOARD),
                          info:i18n("Show current track information"), infoShortcut:shortcutStr(LMS_TRACK_INFO_KEYBOARD), 
                          showLarge:i18n("Expand now playing"), showLargeShortcut:shortcutStr(LMS_EXPAND_NP_KEYBOARD),
                          hideLarge:i18n("Collapse now playing"), startPlayer:i18n("Start player"), connectionLost:i18n('Server connection lost...'),
                          groupPlayers:("Group Players"), standardPlayers:i18n("Standard Players"), pluginUpdatesAvailable:i18n('Plugin updates available')};
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
            if (toggleMute) {
                bus.$emit('playerCommand', ['mixer', 'muting', 'toggle']);
            } else {
                bus.$emit('playerCommand', ["mixer", "volume", adjustVolume(Math.abs(this.playerVolume), false)]);
            }
        },
        volumeUp(toggleMute) {
            if (this.$store.state.visibleMenus.size>0) {
                return;
            }
            if (toggleMute) {
                bus.$emit('playerCommand', ['mixer', 'muting', 'toggle']);
            } else {
                bus.$emit('playerCommand', ["mixer", "volume", adjustVolume(Math.abs(this.playerVolume), true)]);
            }
        },
        volumeClick(toggleMute) {
            if (this.$store.state.visibleMenus.size>0) {
                return;
            }
            if (toggleMute) {
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
        playPauseButton() {
            if (this.$store.state.visibleMenus.size>0) {
                return;
            }
            bus.$emit('playerCommand', [this.playerStatus.isplaying ? 'pause' : 'play']);
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
            return isAndroid() && this.$store.state.showPlayerMenuEntry
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
