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
    }
}

function startMediaSession() {
    if (!mediaAudio || mediaInterval) {
        return true;
    }
    mediaAudio.src = (lmsServerAddress.length>0 ? lmsServerAddress + "/material/" : "") + "html/audio/silence.ogg";
    // Repeatedly play/pause so that sesssion persists
    mediaAudio.play().then(_ => {
        mediaAudio.currentTime = 0; // Go back to start
        mediaAudio.pause();
        toolbarComponent.updateMediaSession(toolbarComponent.media, true);
        navigator.mediaSession.playbackState = toolbarComponent.playerStatus && toolbarComponent.playerStatus.isplaying ? "playing" : "paused";
        mediaInterval = setInterval(function() {
            mediaAudio.play().then(_ => {
                mediaAudio.currentTime = 0; // Go back to start
                mediaAudio.pause();
                navigator.mediaSession.playbackState = toolbarComponent.playerStatus && toolbarComponent.playerStatus.isplaying ? "playing" : "paused";
            });
        }, 15*1000);
    });
    return false;
}

function stopMediaSession() {
    if (!mediaInterval) {
        return;
    }
    if (mediaInterval) {
        clearInterval(mediaInterval);
        mediaInterval = undefined;
    }
    if (mediaAudio.src) {
        mediaAudio.src = undefined;
    }
    navigator.mediaSession.metadata = undefined;
}

Vue.component('lms-toolbar', {
    template: `
<div>
<v-toolbar fixed dense app class="lms-toolbar noselect">
 <v-menu bottom class="toolbar-menu">
  <v-toolbar-title slot="activator">
   <div class="maintoolbar-title ellipsis">
    <v-icon v-if="playerStatus.sleepTimer" class="player-icon-pad">hotel</v-icon>
    <v-icon v-else-if="!playerStatus.ison" class="dimmed player-icon-pad">power_settings_new</v-icon>
    <v-icon v-if="playerStatus.ison && playerStatus.synced" class="player-icon-pad">link</v-icon>{{player ? player.name : trans.noplayer}} <v-icon>arrow_drop_down</v-icon></div>
   <div v-if="!desktop" class="maintoolbar-subtitle subtext ellipsis">{{undefined===songInfo ? trans.nothingplaying : (!desktop && $route.path=='/nowplaying') ? playlist.count+playlist.duration : songInfo}}</div>
  </v-toolbar-title>
       
  <v-list class="toolbar-player-list">
   <template v-for="(item, index) in players">
    <v-list-tile @click="setPlayer(item.id)">
     <v-list-tile-content>
     <v-list-tile-title>
      <v-icon small class="lms-small-menu-icon" v-if="player && item.id === player.id && players && players.length>1">radio_button_checked</v-icon>
      <v-icon small class="lms-small-menu-icon" v-else-if="players && players.length>1">radio_button_unchecked</v-icon>
      <v-icon v-if="item.isgroup" v-bind:class="{'dimmed': !item.ison || (item.id === player.id && !playerStatus.ison)}">speaker_group</v-icon>
      <v-icon v-else v-bind:class="{'dimmed': !item.ison || (item.id === player.id && !playerStatus.ison)}">speaker</v-icon>&nbsp;{{item.name}}</v-list-tile-title>
     </v-list-tile-content>
    </v-list-tile>
   </template>

   <v-divider v-if="(player && player.canpoweroff) || (players && players.length>1) || playerStatus.sleepTimer"></v-divider>
   <v-list-tile v-if="player && player.canpoweroff" @click="togglePower()">
    <v-list-tile-content v-if="playerStatus.ison">
     <v-list-tile-title v-bind:class="{'pm-icon-indent' : players && players.length>1}"><v-icon>power_settings_new</v-icon>&nbsp;{{trans.switchoff}}</v-list-tile-title>
    </v-list-tile-content>
    <v-list-tile-content v-else>
     <v-list-tile-title v-bind:class="{'pm-icon-indent' : players && players.length>1}"><v-icon class="dimmed">power_settings_new</v-icon>&nbsp;{{trans.switchon}}</v-list-tile-title>
    </v-list-tile-content>
   </v-list-tile>

   <v-list-tile v-if="!playerGroups && players && players.length>1" @click="bus.$emit('synchronise', player)">
    <v-list-tile-content><v-list-tile-title class="pm-icon-indent"><v-icon>link</v-icon>&nbsp;{{trans.synchronise}}</v-list-tile-title></v-list-tile-content>
   </v-list-tile>

   <v-list-tile v-if="players && players.length>1" @click="menuAction(TB_MANAGE_PLAYERS.id)">
     <v-list-tile-title v-bind:class="{'pm-icon-indent' : players && players.length>0}"><v-icon>speaker_group</v-icon>&nbsp{{TB_MANAGE_PLAYERS.title}}</v-list-tile-title>
   </v-list-tile>
   <v-list-tile v-if="playerStatus.sleepTimer">
    <v-list-tile-content>
     <v-list-tile-title class="pm-icon-indent dimmed"><v-icon>hotel</v-icon>&nbsp;{{playerStatus.sleepTimer | displayTime}}</v-list-tile-title>
    </v-list-tile-content>
   </v-list-tile>
  </v-list>
 </v-menu>
 <v-spacer></v-spacer>
 <v-btn icon :title="trans.info" v-if="!desktop && infoPlugin && !infoOpen && $route.path=='/nowplaying'" @click.native="bus.$emit('info')" class="toolbar-button">
  <v-icon>info</v-icon>
 </v-btn>
 <v-btn icon v-else-if="!desktop && playerStatus.isplaying" @click.native="bus.$emit('playerCommand', ['pause', '1'])" class="toolbar-button">
  <v-icon>pause_circle_outline</v-icon>
 </v-btn>
 <v-btn icon v-else-if="!desktop" @click.native="bus.$emit('playerCommand', ['play'])" class="toolbar-button">
  <v-icon>play_circle_outline</v-icon>
 </v-btn>
 <v-btn v-if="desktop && playerStatus.ison" icon flat class="toolbar-button" v-longpress="volumeDown"><v-icon>{{playerVolume.muted ? 'volume_off' : 'volume_down'}}</v-icon></v-btn>
 <v-slider v-if="desktop && playerStatus.ison" step="1" v-model="playerVolume.val" class="vol-slider"></v-slider>
 <v-btn v-if="desktop && playerStatus.ison" icon flat class="toolbar-button" v-longpress="volumeUp"><v-icon>{{playerVolume.muted ? 'volume_off' : 'volume_up'}}</v-icon></v-btn>
 <p v-if="desktop && playerStatus.ison" class="vol-label">{{playerVolume.val}}%</p>
 <v-btn v-else-if="!desktop && playerStatus.ison" icon flat class="toolbar-button" v-longpress="volumeClick">
  <v-icon v-if="playerStatus.volume>0">volume_up</v-icon>
  <v-icon v-else-if="playerStatus.volume==0">volume_down</v-icon>
  <v-icon v-else>volume_off</v-icon>
 </v-btn>
 <div class="vol-label" v-if="!desktop && playerStatus && playerStatus.ison">{{playerStatus.volume}}%</div>
 <v-btn icon :title="trans.info" v-if="desktop && infoPlugin" @click.native="bus.$emit('info')" class="toolbar-button">
  <v-icon>info</v-icon>
 </v-btn>
 <v-btn icon :title="trans.showLarge" v-if="desktop && !largeView" @click.native="bus.$emit('largeView', true)" class="toolbar-button">
  <v-icon>fullscreen</v-icon>
 </v-btn>
 <v-btn icon :title="trans.hideLarge" v-if="desktop && largeView" @click.native="bus.$emit('largeView', false)" class="toolbar-button">
  <v-icon>fullscreen_exit</v-icon>
 </v-btn>
 <v-menu bottom left>
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
  </v-list>
 </v-menu>
</v-toolbar>
<v-snackbar v-model="snackbar.show" :multi-line="true" :timeout="2500" :color="snackbar.color" top>{{ snackbar.msg }}</v-snackbar>
</div>
    `,
    props: ['desktop'],
    data() {
        return { desktop:false,
                 songInfo:undefined,
                 playlist: { count: undefined, duration: undefined, timestamp: undefined },
                 playerStatus: { ison: 1, isplaying: false, volume: 0, current: { title:undefined, artist:undefined }, sleepTimer: undefined },
                 playerGroups: false,
                 menuItems: [],
                 trans:{noplayer:undefined, nothingplaying:undefined, synchronise:undefined, info:undefined,
                        switchoff:undefined, switchon:undefined, showLarge:undefined, hideLarge:undefined, startPlayer:undefined},
                 infoOpen: false,
                 largeView: false,
                 playerVolume: {val: -1, current:-1, prev:-1, lastUpdate:undefined, muted:false},
                 snackbar:{ show: false, msg: undefined}
               }
    },
    mounted() {
        /*
        bus.$on('addToolbarActions', function(actions) {
            actions.forEach(i => {
                this.menuItems.push(i);
            });
        }.bind(this));
        bus.$on('removeToolbarActions', function(actions) {
            actions.forEach(i => {
                var index = this.menuItems.indexOf(i);
                if (index > -1) {
                    this.menuItems.splice(index, 1);
                }
            });
        }.bind(this));
        */

        lmsCommand("", ["can", "playergroups", "items", "?"]).then(({data}) => {
            this.playerGroups = data && data.result && undefined!=data.result._can && 1==data.result._can;
        });
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
            if (playerStatus.will_sleep_in!=this.playerStatus.sleepTimer) {
                this.playerStatus.sleepTimer = playerStatus.will_sleep_in;
            }
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

        bus.$on('dialogOpen', function(val, name) {
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
            var info = {msg: (msg ? msg : i18n("Something went wrong!")) + (err ? " (" + err+")" : ""), show: true, color: 'error' };
            if (undefined!=err && undefined==msg && !err.response) {
                // If this is a network error, check if connection is up...
                var that = this;
                axios.get("html/css/blank.css?r"+(new Date().getTime())).then(function (resp) {
                    that.snackbar = info;
                 }).catch(err => {
                    bus.$emit('noNetwork');
                });
            } else {
                this.snackbar = info;
            }
        }.bind(this));
        bus.$on('showMessage', function(msg) {
            this.snackbar = {msg: msg, show: true };
        }.bind(this));

        if ('mediaSession' in navigator) {
            toolbarComponent = this;
            window.addEventListener('touchend', initMediaSessionAudio);
            this.media={title:undefined, artist:undefined, album:undefined, cover:undefined};
            navigator.mediaSession.setActionHandler('play', function() {
                bus.$emit('playerCommand', ['play']);
            });
            navigator.mediaSession.setActionHandler('pause', function() {
                bus.$emit('playerCommand', ['pause', '1']);
            });
            navigator.mediaSession.setActionHandler('previoustrack', function() {
                bus.$emit('playerCommand', ['button', 'jump_rew']);
            });
            navigator.mediaSession.setActionHandler('nexttrack', function() {
                bus.$emit('playerCommand', ['playlist', 'index', '+1']);
            });
            bus.$on('currentCover', function(coverUrl) {
                this.media.cover = coverUrl;
                this.updateMediaSession(this.media, true);
            }.bind(this));
            bus.$emit('getCurrentCover');
        }
    },
    methods: {
        updateMediaSession(track, force) {
            if (!mediaAudio) {
                return;
            }
            if ('mediaSession' in navigator) {
                if (undefined==track || (isEmpty(track.title) && isEmpty(track.trackartist) && isEmpty(track.artist) && isEmpty(track.album))) {
                    stopMediaSession();
                    this.media.title = undefined;
                    this.media.artist = undefined;
                    this.media.album = undefined;
                } else if (startMediaSession()) {
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
            TB_PLAYER_SETTINGS.title=i18n('Player Settings');
            TB_SERVER_SETTINGS.title=i18n('Server Settings');
            TB_INFO.title=i18n('Information');
            TB_MANAGE_PLAYERS.title=i18n('Manage Players');
            this.menuItems = [ TB_UI_SETTINGS, TB_PLAYER_SETTINGS, TB_SERVER_SETTINGS, TB_INFO ];
            this.trans = {noplayer:i18n('No Player'), nothingplaying:i18n('Nothing playing'), synchronise:i18n('Synchronise'),
                          info:i18n("Show current track information"), switchoff:i18n('Switch Off'), switchon:i18n('Switch On'),
                          showLarge:i18n("Expand now playing"), hideLarge:i18n("Collapse now playing"),
                          startPlayer:i18n("Start player")};
        },
        setPlayer(id) {
            if (id != this.$store.state.player.id) {
                this.$store.commit('setPlayer', id);
            }
        },
        menuAction(id) {
            if (TB_SERVER_SETTINGS.id==id) {
                serverSettings();
            } else {
                bus.$emit('toolbarAction', id);
            }
        },
        togglePower() {
            bus.$emit("power", this.playerStatus.ison ? "0" : "1");
        },
        volumeDown(toggleMute) {
            if (toggleMute) {
                bus.$emit('playerCommand', ['mixer', 'muting', 'toggle']);
            } else {
                this.playerVolume.val = adjustVolume(this.playerVolume.val, false);
            }
        },
        volumeUp(toggleMute) {
            if (toggleMute) {
                bus.$emit('playerCommand', ['mixer', 'muting', 'toggle']);
            } else {
                this.playerVolume.val = adjustVolume(this.playerVolume.val, true);
            }
        },
        volumeClick(toggleMute) {
            if (toggleMute) {
                bus.$emit('playerCommand', ['mixer', 'muting', 'toggle']);
            } else if (this.playerStatus.volume<0) {
                bus.$emit('playerCommand', ['mixer', 'muting', 0]);
            } else {
                bus.$emit('volume');
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
        }
    },
    filters: {
        displayTime: function (value) {
            if (undefined==value) {
                return '';
            }
            return formatSeconds(Math.floor(value));
        }
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
