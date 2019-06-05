/**
 * LMS-Material
 *
 * Copyright (c) 2018-2019 Craig Drummond <craig.p.drummond@gmail.com>
 * MIT license.
 */

var TB_UI_SETTINGS     = {id:'tb:settings'       };
var TB_PLAYER_SETTINGS = {id:"tb:playersettings" };
var TB_SERVER_SETTINGS = {id:"tb:serversettings" };
var TB_INFO            = {id:"tb:info"           };
var TB_MANAGE_PLAYERS  = {id:"tb-manageplayers"  };

var toolbarComponent;
var mediaAudio = undefined;
var mediaInterval = undefined;

function initMediaSessionAudio() {
    if (mediaAudio == undefined) {
        mediaAudio = document.createElement('audio');
        window.removeEventListener('touchend', initMediaSessionAudio);
        setTimeout(function () {
            toolbarComponent.updateMediaSession(toolbarComponent.playerStatus.current, true);
        }, 500);
    }
}

function startMediaSession() {
    if (!mediaAudio || mediaInterval) {
        return;
    }
    mediaAudio.src = "html/audio/silence.ogg";
    // Repeatedly play/pause so that sesssion persists
    mediaAudio.play().then(_ => {
        mediaAudio.currentTime = 0; // Go back to start
        mediaAudio.pause();
        toolbarComponent.updateMediaSession(toolbarComponent.playerStatus.current, true);
        navigator.mediaSession.playbackState = /*toolbarComponent.playerStatus && toolbarComponent.playerStatus.isplaying ? "playing" :*/ "paused";
        mediaInterval = setInterval(function() {
            mediaAudio.play().then(_ => {
                mediaAudio.currentTime = 0; // Go back to start
                mediaAudio.pause();
                navigator.mediaSession.playbackState = /*toolbarComponent.playerStatus && toolbarComponent.playerStatus.isplaying ? "playing" :*/ "paused";
            });
        }, 15*1000);
    }).catch(err => {
    });
}

function stopMediaSession() {
    if (!mediaInterval) {
        return;
    }
    clearInterval(mediaInterval);
    mediaInterval = undefined;
    if (mediaAudio.src) {
        mediaAudio.src = undefined;
    }
    navigator.mediaSession.metadata = undefined;
}

Vue.component('lms-toolbar', {
    template: `
<div>
<v-toolbar fixed dense app class="lms-toolbar noselect">
 <v-btn v-if="noPlayer" icon class="toolbar-button">
  <v-progress-circular color="primary" size=22 width=3 indeterminate></v-progress-circular>
 </v-btn>
 <v-menu bottom class="toolbar-menu" :disabled="!connected">
  <v-toolbar-title slot="activator">
   <div class="maintoolbar-title ellipsis" v-bind:class="{'slightly-dimmed': !playerStatus.ison}">
    <v-icon v-if="playerStatus.sleepTime" class="player-icon-pad">hotel</v-icon>
    <v-icon v-if="playerStatus.synced" class="player-icon-pad">link</v-icon>{{player ? player.name : trans.noplayer}} <v-icon>arrow_drop_down</v-icon></div>
   <div v-if="!desktop" class="maintoolbar-subtitle subtext ellipsis" v-bind:class="{'dimmed' : !playerStatus.ison}">{{undefined===songInfo ? trans.nothingplaying : (!desktop && isNowPlayingPage) ? playlist.count+playlist.duration : songInfo}}</div>
  </v-toolbar-title>
       
  <v-list class="toolbar-player-list">
   <template v-for="(item, index) in players">
    <v-subheader v-if="0==index && item.isgroup">{{trans.groupPlayers}}</v-subheader>
    <v-subheader v-else-if="index>0 && !item.isgroup && players[index-1].isgroup">{{trans.standardPlayers}}</v-subheader>
    <v-list-tile @click="setPlayer(item.id)">
     <v-list-tile-avatar>
      <v-icon small v-if="players && players.length>1">{{player && item.id === player.id ? 'radio_button_checked' :'radio_button_unchecked'}}</v-icon>
     </v-list-tile-avatar>
     <v-list-tile-content>
      <v-list-tile-title>{{item.name}}</v-list-tile-title>
     </v-list-tile-content>
      <v-list-tile-action>
       <v-btn icon><v-icon v-if="item.canpoweroff" style="float:right" v-bind:class="{'dimmed': !item.ison}" @click.stop="togglePower(item)">power_settings_new</v-icon></
      </v-list-tile-action>
    </v-list-tile>
   </template>

   <v-divider v-if="(players && players.length>1) || playerStatus.sleepTime"></v-divider>

   <v-list-tile v-if="players && players.length>1" @click="bus.$emit('dlg.open', 'sync', player)">
    <v-list-tile-avatar><v-icon>link</v-icon></v-list-tile-avatar>
    <v-list-tile-content><v-list-tile-title>{{trans.synchronise}}</v-list-tile-title></v-list-tile-content>
   </v-list-tile>

   <v-list-tile v-if="players && players.length>1" @click="menuAction(TB_MANAGE_PLAYERS.id)">
    <v-list-tile-avatar><v-icon>speaker_group</v-icon></v-list-tile-avatar>
     <v-list-tile-title>{{TB_MANAGE_PLAYERS.title}}</v-list-tile-title>
   </v-list-tile>

   <v-list-tile v-if="playerStatus.sleepTime" @click="bus.$emit('dlg.open', 'sleep', player)">
    <v-list-tile-avatar><v-icon>hotel</v-icon></v-list-tile-avatar>
    <v-list-tile-content>
     <v-list-tile-title>{{playerStatus.sleepTime | displayTime}}</v-list-tile-title>
    </v-list-tile-content>
   </v-list-tile>
  </v-list>
 </v-menu>
 <v-spacer></v-spacer>
 <v-btn icon :title="trans.info" v-if="!desktop && infoPlugin && !infoOpen && isNowPlayingPage" @click.stop="bus.$emit('info')" class="toolbar-button" id="inf">
  <v-icon>info</v-icon>
 </v-btn>
 <v-btn icon v-else-if="!desktop" @click.stop="playPauseButton" class="toolbar-button" id="pp">
  <v-icon v-if="playerStatus.isplaying">pause_circle_outline</v-icon>
  <v-icon v-else>play_circle_outline</v-icon>
 </v-btn>
 <v-btn v-if="desktop" :disabled="!playerStatus.ison || noPlayer" icon flat class="toolbar-button" v-longpress="volumeDown" @click.middle="toggleMute" id="vol-down-btn"><v-icon>{{playerVolume.muted ? 'volume_off' : 'volume_down'}}</v-icon></v-btn>
 <v-slider v-if="desktop" :disabled="!playerStatus.ison || noPlayer" step="1" v-model="playerVolume.val" class="vol-slider" @click.middle="toggleMute" id="vol-slider"></v-slider>
 <v-btn v-if="desktop" :disabled="!playerStatus.ison || noPlayer" icon flat class="toolbar-button" v-longpress="volumeUp" @click.middle="toggleMute" id="vol-up-btn"><v-icon>{{playerVolume.muted ? 'volume_off' : 'volume_up'}}</v-icon></v-btn>
 <p v-if="desktop" :disabled="!playerStatus.ison || noPlayer" class="vol-label" @click.middle="toggleMute">{{playerVolume.val|displayVolume}}%</p>
 <v-btn v-else-if="!desktop" :disabled="!playerStatus.ison || noPlayer" icon flat class="toolbar-button" v-longpress="volumeClick" @click.middle="toggleMute" id="vol-btn">
  <v-icon v-if="playerStatus.volume>0">volume_up</v-icon>
  <v-icon v-else-if="playerStatus.volume==0">volume_down</v-icon>
  <v-icon v-else>volume_off</v-icon>
 </v-btn>
 <div class="vol-label" v-if="!desktop" :disabled="!playerStatus.ison || noPlayer">{{playerStatus.volume|displayVolume}}%</div>
 <v-btn icon :title="trans.info" v-if="desktop && infoPlugin" @click.native="bus.$emit('info')" class="toolbar-button">
  <v-icon>info</v-icon>
 </v-btn>
 <v-btn icon :title="trans.showLarge" v-if="desktop && !largeView" @click.native="bus.$emit('largeView', true)" class="toolbar-button">
  <v-icon>fullscreen</v-icon>
 </v-btn>
 <v-btn icon :title="trans.hideLarge" v-if="desktop && largeView" @click.native="bus.$emit('largeView', false)" class="toolbar-button">
  <v-icon>fullscreen_exit</v-icon>
 </v-btn>
 <v-menu v-if="connected" bottom left>
  <v-btn slot="activator" icon><v-icon>more_vert</v-icon></v-btn>
  <v-list>
   <template v-for="(item, index) in menuItems">
    <v-list-tile v-if="item.href" :href="item.href" target="_blank">
     <v-list-tile-title>{{item.title}}</v-list-tile-title>
    </v-list-tile>
    <v-list-tile v-else @click="menuAction(item.id)">
     <v-list-tile-title>{{item.title}}</v-list-tile-title>
    </v-list-tile>
   </template>
   <v-list-tile v-if="showPlayerMenuEntry" href="intent://sbplayer/#Intent;scheme=angrygoat;package=com.angrygoat.android.sbplayer;end">{{trans.startPlayer}}</v-list-tile>
   <v-divider v-if="!desktop && browseMenuItems && browseMenuItems.length>0 && isBrowsePage"></v-divider>
   <template v-if="!desktop && browseMenuItems && browseMenuItems.length>0 && isBrowsePage" v-for="(action, index) in browseMenuItems">
    <v-list-tile @click="bus.$emit('browseAction', action)">
     <v-list-tile-avatar>
      <v-icon>{{B_ACTIONS[action].icon}}</v-icon>
     </v-list-tile-avatar>
     <v-list-tile-content><v-list-tile-title>{{B_ACTIONS[action].title}}</v-list-tile-title></v-list-tile-content>
    </v-list-tile>
   </template>
  </v-list>
 </v-menu>
 <v-btn v-else icon :title="trans.connectionLost" @click.native="bus.$emit('showError', undefined, trans.connectionLost);" class="toolbar-button">
  <v-progress-circular color="primary" size=22 width=3 indeterminate></v-progress-circular>
 </v-btn>
</v-toolbar>
<v-snackbar v-model="snackbar.show" :multi-line="true" :timeout="snackbar.timeout ? snackbar.timeout : 2500" :color="snackbar.color" top>{{ snackbar.msg }}</v-snackbar>
</div>
    `,
    props: ['desktop'],
    data() {
        return { songInfo:undefined,
                 playlist: { count: undefined, duration: undefined, timestamp: undefined },
                 playerStatus: { ison: 1, isplaying: false, volume: 0, current: { title:undefined, artist:undefined, album:undefined }, sleepTime: undefined },
                 menuItems: [],
                 browseMenuItems:[],
                 trans:{noplayer:undefined, nothingplaying:undefined, synchronise:undefined, info:undefined, connectionLost:undefined,
                        switchoff:undefined, switchon:undefined, showLarge:undefined, hideLarge:undefined, startPlayer:undefined,
                        groupPlayers:undefined, standardPlayers:undefined},
                 infoOpen: false,
                 largeView: false,
                 playerVolume: {val: -1, current:-1, prev:-1, lastUpdate:undefined, muted:false},
                 snackbar:{ show: false, msg: undefined},
                 connected: true
               }
    },
    mounted() {
        bus.$on('settingsMenuActions', function(actions, page) {
            if ('browse'==page) {
                this.browseMenuItems=[];
                for (var i=0, len=actions.length; i<len; ++i) {
                    this.$set(this.browseMenuItems, i, actions[i]);
                }
            }
        }.bind(this));
        bus.$on('removeToolbarActions', function(actions) {
            actions.forEach(i => {
                var index = this.menuItems.indexOf(i);
                if (index > -1) {
                    this.menuItems.splice(index, 1);
                }
            });
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

            if (!this.desktop) {
                if (playerStatus.playlist && playerStatus.playlist.count) {
                    this.playlist.count = i18np("1 Track", "%1 Tracks", playerStatus.playlist.count);
                } else {
                    this.playlist.count = undefined;
                }
                if (!this.playlist.timestamp || this.playlist.timestamp!=playerStatus.playlist.timestamp) {
                    this.playlist.timestamp = playerStatus.playlist.timestamp;
                    lmsCommand(this.$store.state.player.id, ["status", "-", 1, "tags:DD"]).then(({data}) => {
                        var duration = data.result && data.result["playlist duration"] ? parseFloat(data.result["playlist duration"]) : 0.0;
                        if (duration>0) {
                            this.playlist.duration=" (" + formatSeconds(Math.floor(duration)) + ")";
                        } else {
                            this.playlist.duration="";
                        }
                    });
                }
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

            if (this.desktop) {
                var muted = playerStatus.volume < 0;
                var val = playerStatus.volume<0 ? -1*playerStatus.volume : playerStatus.volume;
                if (undefined==this.playerVolume.id ||
                     this.$store.state.player.id!=this.playerVolume.id ||
                     this.playerVolume.muted != muted ||
                    ((val!=this.playerVolume.val && val!=this.playerVolume.prev &&
                    (!this.playerVolume.lastUpdate || ((new Date())-this.playerVolume.lastUpdate)>500)))) {
                    this.playerVolume.current = val;
                    this.playerVolume.val = val;
                    this.playerVolume.muted = muted;
                    this.playerVolume.lastUpdate = new Date();
                    this.playerVolume.id = this.$store.state.player.id;
                }
            }
            this.updateMediaSession(playerStatus.current);
        }.bind(this));
        
        bus.$on('langChanged', function() {
            this.initItems();
        }.bind(this));
        this.initItems();

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

        if ('mediaSession' in navigator) {
            toolbarComponent = this;
            window.addEventListener('touchend', initMediaSessionAudio);
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
            this.connected = connected;
        }.bind(this));

        if (!isMobile()) {
            if (this.desktop) {
                this.addMouseWheelhandler("vol-down-btn");
                this.addMouseWheelhandler("vol-slider");
                this.addMouseWheelhandler("vol-up-btn");
            } else {
                this.addMouseWheelhandler("vol-btn");
            }
        }
    },
    methods: {
        addMouseWheelhandler(id) {
            var elem = document.getElementById(id);
            if (elem) {
                elem.addEventListener('mousewheel', function(event) {
                    event.preventDefault();
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
                    navigator.mediaSession.playbackState = /*this.playerStatus && this.playerStatus.isplaying ? "playing" :*/ "paused";
                    var title = this.playerStatus && this.playerStatus.isplaying ? track.title : ("\u23f8 "+track.title);
                    var artist = track.trackartist ? track.trackartist : track.artist;
                    if (force || title!=this.media.title || artist!=this.media.artist || track.album!=this.media.album) {
                        this.media.title = title;
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
            TB_PLAYER_SETTINGS.title=i18n('Player Settings');
            TB_SERVER_SETTINGS.title=i18n('Server Settings');
            TB_INFO.title=i18n('Information');
            TB_MANAGE_PLAYERS.title=i18n('Manage Players');
            this.menuItems = [ TB_UI_SETTINGS, TB_PLAYER_SETTINGS, TB_SERVER_SETTINGS, TB_INFO ];
            this.trans = {noplayer:i18n('No Player'), nothingplaying:i18n('Nothing playing'), synchronise:i18n('Synchronise'),
                          info:i18n("Show current track information"), switchoff:i18n('Switch Off'), switchon:i18n('Switch On'),
                          showLarge:i18n("Expand now playing"), hideLarge:i18n("Collapse now playing"),
                          startPlayer:i18n("Start Player"), connectionLost:i18n('Server connection lost...'),
                          groupPlayers:("Group Players"), standardPlayers:i18n("Standard Players")};
        },
        setPlayer(id) {
            if (id != this.$store.state.player.id) {
                this.$store.commit('setPlayer', id);
            }
        },
        menuAction(id) {
            if (TB_SERVER_SETTINGS.id==id) {
                serverSettings();
            } else if (TB_UI_SETTINGS.id==id) {
                bus.$emit('dlg.open', 'uisettings');
            } else if (TB_PLAYER_SETTINGS.id==id) {
                bus.$emit('dlg.open', 'playersettings');
            } else if (TB_INFO.id==id) {
                bus.$emit('dlg.open', 'info');
            } else if (TB_MANAGE_PLAYERS.id==id) {
                bus.$emit('dlg.open', 'manage');
            } else {
                bus.$emit('toolbarAction', id);
            }
        },
        togglePower(player, state) {
            lmsCommand(player.id, ["power", player.ison ? "0" : "1"]).then(({data}) => {
                bus.$emit('refreshStatus', player.id);
            });
        },
        volumeDown(toggleMute) {
            if (toggleMute) {
                bus.$emit('playerCommand', ['mixer', 'muting', 'toggle']);
            } else {
                this.playerVolume.val = adjustVolume(Math.abs(this.playerVolume.val), false);
            }
        },
        volumeUp(toggleMute) {
            if (toggleMute) {
                bus.$emit('playerCommand', ['mixer', 'muting', 'toggle']);
            } else {
                this.playerVolume.val = adjustVolume(Math.abs(this.playerVolume.val), true);
            }
        },
        volumeClick(toggleMute) {
            if (toggleMute) {
                bus.$emit('playerCommand', ['mixer', 'muting', 'toggle']);
            } else if (this.playerStatus.volume<0) {
                bus.$emit('playerCommand', ['mixer', 'muting', 0]);
            } else {
                bus.$emit('dlg.open', 'volume');
            }
        },
        toggleMute() {
            bus.$emit('playerCommand', ['mixer', 'muting', 'toggle']);
        },
        playPauseButton() {
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
        }
    },
    computed: {
        player () {
            return this.$store.state.player
        },
        players () {
            return this.$store.state.players
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
        isBrowsePage() {
            return this.$store.state.page == 'browse'
        },
        noPlayer () {
            return !this.$store.state.players || this.$store.state.players.length<1
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
    },
    watch: {
        'playerVolume.val': function(newVal) {
            if (this.desktop && newVal>=0 && this.playerVolume.current !== newVal) {
                this.playerVolume.prev = this.playerVolume.current;
                this.playerVolume.current = newVal;
                this.playerVolume.lastUpdate = new Date();
                bus.$emit('playerCommand', ["mixer", "volume", newVal]);
            }
        }
    }
})
