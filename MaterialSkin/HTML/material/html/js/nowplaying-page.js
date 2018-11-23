/**
 * LMS-Material
 *
 * Copyright (c) 2018 Craig Drummond <craig.p.drummond@gmail.com>
 * MIT license.
 */

const BIO_TAB = 0;
const REVIEW_TAB = 1;
const LYRICS_TAB = 2;

var lmsNowPlaying = Vue.component("lms-now-playing", {
    template: `
<div v-if="desktop" class="np-bar noselect">

 <v-layout row class="np-controls">
  <v-flex xs4>
   <v-btn flat icon @click="doAction(['button', 'jump_rew'])"><v-icon large>skip_previous</v-icon></v-btn>
  </v-flex>
  <v-flex xs4>
   <v-btn flat icon large v-if="playerStatus.isplaying" @click="doAction(['pause'])" class="np-playpause"><v-icon x-large>pause_circle_outline</v-icon></v-btn>
   <v-btn flat icon large v-else @click="doAction(['play'])" class="np-playpause"><v-icon x-large>play_circle_outline</v-icon></v-btn>
  </v-flex>
  <v-flex xs4>
   <v-btn flat icon @click="doAction(['playlist', 'index', '+1'])"><v-icon large>skip_next</v-icon></v-btn>
  </v-flex>
 </v-layout>
 <img :src="cover" class="np-image" @click="infoPlugin && playerStatus.current.artist ? info.show=!info.show : undefined" v-bind:class="{'cursor' : infoPlugin}"></img>
 <div>
  <p class="np-text ellipsis" v-if="playerStatus.current.title">{{playerStatus.current.title}}</p>
  <p class="np-text" v-else>&nbsp;</p>
  <p class="np-text-sub subtext ellipsis" v-if="playerStatus.current.artist && playerStatus.current.album">{{playerStatus.current.artist}} - {{playerStatus.current.album}}</p>
  <p class="np-text-sub subtext ellipsis" v-else-if="playerStatus.current.artist">{{playerStatus.current.artist}}</p>
  <p class="np-text subtext ellipsis" v-else-if="playerStatus.current.album">{{playerStatus.current.album}}</p>
  <p class="np-text" v-else>&nbsp;</p>
  <p class="np-text np-tech">{{playerStatus.current.technicalInfo}}</p>
  <p class="np-text np-time cursor" @click="toggleTime()">{{formattedTime}}</p>
  <v-slider id="pos-slider" v-if="playerStatus.current.duration>0" class="np-slider" :value='playerStatus.current.time' :max='playerStatus.current.duration' @click.native="sliderChanged($event)"></v-slider>
 </div>
 <div v-if="info.show" class="np-info np-info-cover" id="np-info">
  <v-tabs centered v-model="info.tab" v-if="info.showTabs" style="np-info-tab-cover">
   <template v-for="(tab, index) in info.tabs">
    <v-tab :key="index">{{tab.title}}</v-tab>
    <v-tab-item :key="index" transition="" reverse-transition=""> <!-- background image causes glitches with transitions -->
     <v-card flat class="np-info-card-cover">
      <v-card-text class="np-info-text" v-bind:class="{'np-info-lyrics': LYRICS_TAB==index}" v-html="tab.text"></v-card-text>
     </v-card>
    </v-tab-item>
   </template>
  </v-tabs>
  <div v-else>
   <v-layout row>
    <template v-for="(tab, index) in info.tabs">
     <v-flex xs4>
      <v-card flat class="np-info-card-cover">
       <v-card-title><p>{{tab.title}}</p></v-card-title>
       <v-card-text class="np-info-text-full" v-bind:class="{'np-info-lyrics': LYRICS_TAB==index}" v-html="tab.text"></v-card-text>
      </v-card>
     </v-flex>
    </template>
   </v-layout>
  </div>
  <v-card class="np-info-card-cover">
   <v-card-actions>
    <v-spacer></v-spacer>
    <v-btn flat v-if="info.showTabs" @click="toggleTabs()">{{trans.expand}}</v-btn>
    <v-btn flat v-else @click="toggleTabs()">{{trans.collapse}}</v-btn>
    <v-btn flat @click="info.show = false">{{trans.close}}</v-btn>
    <v-spacer></v-spacer>
   </v-card-actions>
  </v-card>
 </div>
</div>
<div class="np-page" v-else-if="playerStatus.ison">
 <div v-if="info.show" class="np-info np-info-cover" id="np-info">
  <v-tabs centered v-model="info.tab" class="np-info-tab-cover">
   <template v-for="(tab, index) in info.tabs">
    <v-tab :key="index">{{tab.title}}</v-tab>
    <v-tab-item :key="index" transition="" reverse-transition=""> <!-- background image causes glitches with transitions -->
     <v-card flat class="np-info-card-cover">
      <v-card-text class="np-info-text" v-bind:class="{'np-info-lyrics': LYRICS_TAB==index}" v-html="tab.text"></v-card-text>
     </v-card>
    </v-tab-item>
   </template>
  </v-tabs>
  <v-card class="np-info-card-cover">
   <v-card-actions>
    <v-spacer></v-spacer>
    <v-btn flat @click="info.show = false">{{trans.close}}</v-btn>
    <v-spacer></v-spacer>
   </v-card-actions>
  </v-card>
 </div>
 <div v-else>
  <p class="np-text ellipsis" v-if="playerStatus.current.title">{{playerStatus.current.title}}</p>
  <p class="np-text" v-else>&nbsp;</p>
  <p class="np-text subtext ellipsis" v-if="playerStatus.current.artist">{{playerStatus.current.artist}}</p>
  <p class="np-text" v-else>&nbsp;</p>
  <p class="np-text subtext ellipsis" v-if="playerStatus.current.album">{{playerStatus.current.album}}</p>
  <p class="np-text" v-else>&nbsp;</p>
  <img v-if="!info.show" :src="cover" class="np-image" @contextmenu="showMenu"></img>
  <v-menu v-model="menu.show" :position-x="menu.x" :position-y="menu.y" absolute offset-y>
   <v-list>
    <v-list-tile>
     <v-list-tile-title @click="info.show=true">{{menu.text}}</v-list-tile-title>
    </v-list-tile>
   </v-list>
  </v-menu>

  <v-layout text-xs-center row wrap class="np-controls">
   <v-flex xs3 class="np-pos" v-if="!info.show">{{playerStatus.current.time | displayTime}}</v-flex>
   <v-flex xs6 class="np-tech">{{playerStatus.current.technicalInfo}}</v-flex>
   <v-flex xs3 class="np-duration cursor" v-if="!info.show && (showTotal || !playerStatus.current.time)" @click="toggleTime()">{{playerStatus.current.duration | displayTime}}</v-flex>
   <v-flex xs3 class="np-duration cursor" v-else-if="!info.show && !showTotal" @click="toggleTime()">-{{playerStatus.current.duration-playerStatus.current.time | displayTime}}</v-flex>
   <v-flex xs12 v-if="!info.show && playerStatus.current.duration>0"><v-slider id="pos-slider" class="np-slider" :value='playerStatus.current.time' :max='playerStatus.current.duration' @click.native="sliderChanged($event)"></v-slider></v-flex>
   <v-flex xs4>
    <v-layout text-xs-center>
     <v-flex xs6>
      <v-btn :title="trans.repeatOne" flat icon v-if="playerStatus.playlist.repeat===1" @click="doAction(['playlist', 'repeat', 0])"><v-icon>repeat_one</v-icon></v-btn>
      <v-btn :title="trans.repeatAll" flat icon v-else-if="playerStatus.playlist.repeat===2" @click="doAction(['playlist', 'repeat', 1])"><v-icon>repeat</v-icon></v-btn>
      <v-btn :title="trans.repeatOff" flat icon v-else @click="doAction(['playlist', 'repeat', 2])" class="dimmed"><v-icon>repeat</v-icon></v-btn>
     </v-flex>
     <v-flex xs6><v-btn flat icon @click="doAction(['button', 'jump_rew'])"><v-icon large>skip_previous</v-icon></v-btn></v-flex>
    </v-layout>
   </v-flex>
   <v-flex xs4>
    <v-btn flat icon large v-if="playerStatus.isplaying" @click="doAction(['pause'])" class="np-playpause"><v-icon x-large>pause_circle_outline</v-icon></v-btn>
    <v-btn flat icon large v-else @click="doAction(['play'])" class="np-playpause"><v-icon x-large>play_circle_outline</v-icon></v-btn>
   </v-flex>
   <v-flex xs4>
    <v-layout text-xs-center>
     <v-flex xs6><v-btn flat icon @click="doAction(['playlist', 'index', '+1'])"><v-icon large>skip_next</v-icon></v-btn></v-flex>
     <v-flex xs6>
      <v-btn :title="trans.shuffleAlbums" flat icon v-if="playerStatus.playlist.shuffle===2" @click="doAction(['playlist', 'shuffle', 0])"><v-icon class="shuffle-albums">shuffle</v-icon></v-btn>
      <v-btn :title="trans.shuffleAll" flat icon v-else-if="playerStatus.playlist.shuffle===1" @click="doAction(['playlist', 'shuffle', 2])"><v-icon>shuffle</v-icon></v-btn>
      <v-btn :title="trans.shuffleOff" flat icon v-else @click="doAction(['playlist', 'shuffle', 1])" class="dimmed"><v-icon>shuffle</v-icon></v-btn>
     </v-flex>
    </v-layout>
   </v-flex>
  </v-layout>
 </div>
</div>
`,
    props: [ 'desktop' ],
    data() {
        return { desktop:false,
                 cover:undefined,
                 coverFromPlayer:undefined,
                 playerStatus: {
                    ison: 1,
                    isplaying: 1,
                    current: { canseek:1, artwork_url:undefined, coverid: undefined, duration:0, time:0, title:undefined, artist:undefined, 
                               album:undefined, albumName:undefined, technicalInfo: "" },
                    playlist: { shuffle:0, repeat: 0 },
                 },
                 info: { show: false, tab:LYRICS_TAB, showTabs:false,
                         tabs: [ { title:undefined, text:undefined }, { title:undefined, text:undefined }, { title:undefined, text:undefined } ] },
                 menu: { show: false, x:0, y:0, text: undefined },
                 trans: { close: undefined, expand:undefined, collapse:undefined,
                          repeatAll:undefined, repeatOne:undefined, repeatOff:undefined,
                          shuffleAll:undefined, shuffleAlbums:undefined, shuffleOff:undefined },
                 showTotal: true
                };
    },
    mounted() {
        if (this.desktop) {
            this.info.showTabs=getLocalStorageBool("showTabs", false);
        }
        bus.$on('playerStatus', function(playerStatus) {
            // Has cover changed?
            if (playerStatus.playlist.count == 0) {
                if (undefined===this.coverFromInfo || this.coverFromInfo) {
                    this.cover=resolveImage("music/0/cover");
                    this.coverFromInfo = false;
                }
            } else if (playerStatus.current.artwork_url!=this.playerStatus.current.artwork_url ||
                playerStatus.current.coverid!=this.playerStatus.current.coverid ||
                this.coverFromPlayer!=this.$store.state.player.id) {
                this.playerStatus.current.artwork_url = playerStatus.current.artwork_url;
                this.playerStatus.current.coverid = playerStatus.current.coverid;
                this.coverFromPlayer = this.$store.state.player.id

                this.cover = undefined;
                if (this.playerStatus.current.artwork_url) {
                    this.cover=resolveImage(null, this.playerStatus.current.artwork_url);
                }
                if (undefined==this.cover && this.playerStatus.current.coverid) {
                    this.cover=lmsServerAddress+"/music/"+this.playerStatus.current.coverid+"/cover.jpg";
                }
                if (undefined==this.cover) {
                    this.cover=lmsServerAddress+"/music/current/cover.jpg?player=" + this.$store.state.player.id;
                }
                this.coverFromInfo = true;
            }

            var playStateChanged = false;
            var trackChanged = false;
            // Have other items changed
            if (playerStatus.ison!=this.playerStatus.ison) {
                this.playerStatus.ison = playerStatus.ison;
            }
            if (playerStatus.isplaying!=this.playerStatus.isplaying) {
                this.playerStatus.isplaying = playerStatus.isplaying;
                playStateChanged = true;
            }
            if (playerStatus.current.canseek!=this.playerStatus.current.canseek) {
                this.playerStatus.current.canseek = playerStatus.current.canseek;
            }
            if (playerStatus.current.duration!=this.playerStatus.current.duration) {
                this.playerStatus.current.duration = playerStatus.current.duration;
            }
            if (playerStatus.current.time!=this.playerStatus.current.time) {
                this.playerStatus.current.time = playerStatus.current.time;
            }
            if (playerStatus.current.title!=this.playerStatus.current.title) {
                this.playerStatus.current.title = playerStatus.current.title;
                trackChanged = true;
            }
            if (playerStatus.current.artist!=this.playerStatus.current.artist ||
                playerStatus.current.trackartist!=this.playerStatus.current.trackartist ||
                playerStatus.current.artist_id!=this.playerStatus.current.artist_id) {
                this.playerStatus.current.artist = playerStatus.current.artist ? playerStatus.current.artist : playerStatus.current.trackartist;
                this.playerStatus.current.artist_id = playerStatus.current.artist_id;
                trackChanged = true;
            }
            if (playerStatus.current.album!=this.playerStatus.current.albumName ||
                playerStatus.current.album_id!=this.playerStatus.current.album_id) {
                this.playerStatus.current.albumName = playerStatus.current.album;
                this.playerStatus.current.album_id = playerStatus.current.album_id;
                if (playerStatus.current.year && playerStatus.current.year>0) {
                    this.playerStatus.current.album = this.playerStatus.current.albumName+" ("+ playerStatus.current.year+")";
                } else {
                    this.playerStatus.current.album = this.playerStatus.current.albumName;
                }
                trackChanged = true;
            }
            if (playerStatus.playlist.shuffle!=this.playerStatus.playlist.shuffle) {
                this.playerStatus.playlist.shuffle = playerStatus.playlist.shuffle;
            }
            if (playerStatus.playlist.repeat!=this.playerStatus.playlist.repeat) {
                this.playerStatus.playlist.repeat = playerStatus.playlist.repeat;
            }
            var technical = [];
            if (playerStatus.current.bitrate) {
                technical.push(playerStatus.current.bitrate);
            }
            if (playerStatus.current.type) {
                technical.push(playerStatus.current.type);
            }
            technical=technical.join(", ");
            if (technical!=this.playerStatus.current.technicalInfo) {
                this.playerStatus.current.technicalInfo = technical;
            }

            if (playStateChanged) {
                if (this.playerStatus.isplaying) {
                    if (trackChanged) {
                        this.stopPositionInterval();
                    }
                    this.startPositionInterval();
                } else {
                    this.stopPositionInterval();
                }
            } else if (this.playerStatus.isplaying && trackChanged) {
                this.stopPositionInterval();
                this.startPositionInterval();
            }
        }.bind(this));
        // Refresh status now, in case we were mounted after initial status call
        bus.$emit('refreshStatus');

        bus.$on('langChanged', function() {
            this.initItems();
        }.bind(this));
        this.initItems();

        bus.$on('info', function() {
            if (this.playerStatus && this.playerStatus.current && this.playerStatus.current.artist) {
                this.info.show=!this.info.show;
            }
        }.bind(this));

        this.showTotal = getLocalStorageBool('showTotal', true);
    },
    methods: {
        initItems() {
            this.trans = { close:i18n("Close"), expand:i18n("Expand"), collapse:i18n("Collapse"),
                           repeatAll:i18n("Repeat queue"), repeatOne:i18n("Repeat single track"), repeatOff:i18n("No repeat"),
                           shuffleAll:i18n("Shuffle tracks"), shuffleAlbums:i18n("Shuffle albums"), shuffleOff:i18n("No shuffle")};
            this.menu.text=i18n("Show information");
            this.info.tabs[LYRICS_TAB].title=i18n("Lyrics");
            this.info.tabs[BIO_TAB].title=i18n("Artist Biography");
            this.info.tabs[REVIEW_TAB].title=i18n("Album Review");
        },
        showMenu(event) {
            event.preventDefault();
            if (this.$store.state.infoPlugin && this.playerStatus.current.title && this.playerStatus.current.artist) {
                this.menu.show = false;
                this.menu.x = event.clientX;
                this.menu.y = event.clientY;
                this.$nextTick(() => {
                    this.menu.show = true;
                });
            }
        },
        doAction(command) {
            bus.$emit('playerCommand', command);
        },
        sliderChanged(e) {
            if (this.playerStatus.current.canseek && this.playerStatus.current.duration>3) {
                const rect = document.getElementById("pos-slider").getBoundingClientRect();
                const pos = e.clientX - rect.x;
                const width = rect.width;
                this.doAction(['time', Math.floor(this.playerStatus.current.duration * pos / rect.width)]);
            }
        },
        toggleTabs() {
            this.info.showTabs = !this.info.showTabs;
            setLocalStorageVal("showTabs", this.info.showTabs);
        },
        fetchLyrics() {
            if (this.info.tabs[LYRICS_TAB].songartist!=this.playerStatus.current.artist || this.info.tabs[LYRICS_TAB].songtitle!=this.playerStatus.current.title ||
                (this.playerStatus.current.artist_id && this.info.tabs[LYRICS_TAB].songartist_id!=this.playerStatus.current.artist_id)) {
                this.info.tabs[LYRICS_TAB].text=i18n("Fetching...");
                this.info.tabs[LYRICS_TAB].songartist=this.playerStatus.current.artist;
                this.info.tabs[LYRICS_TAB].songartist_id=this.playerStatus.current.artist_id;
                this.info.tabs[LYRICS_TAB].songtitle=this.playerStatus.current.title;
                var command = ["musicartistinfo", "lyrics", "title:"+this.playerStatus.current.title, "artist:"+this.playerStatus.current.artist, "html:1"];
                if (this.playerStatus.current.artist_id) {
                    command.push("artist_id:"+this.playerStatus.current.artist_id);
                }
                lmsCommand("", command).then(({data}) => {
                    if (data && data.result && (data.result.lyrics || data.result.error)) {
                        this.info.tabs[LYRICS_TAB].text=data.result.lyrics ? replaceNewLines(data.result.lyrics) : data.result.error;
                    }
                });
            }
        },
        fetchBio() {
            if (this.info.tabs[BIO_TAB].songartist!=this.playerStatus.current.artist ||
                (this.playerStatus.current.artist_id && this.info.tabs[BIO_TAB].songartist_id!=this.playerStatus.current.artist_id)) {
                this.info.tabs[BIO_TAB].text=i18n("Fetching...");
                this.info.tabs[BIO_TAB].songartist=this.playerStatus.current.artist;
                this.info.tabs[BIO_TAB].songartist_id=this.playerStatus.current.artist_id;
                var command = ["musicartistinfo", "biography", "artist:"+this.playerStatus.current.artist, "html:1"];
                if (this.playerStatus.current.artist_id) {
                    command.push("artist_id:"+this.playerStatus.current.artist_id);
                }
                lmsCommand("", command).then(({data}) => {
                    if (data && data.result && (data.result.biography || data.result.error)) {
                        this.info.tabs[BIO_TAB].text=data.result.biography ? replaceNewLines(data.result.biography) : data.result.error;
                    }
                });
            }
        },
        fetchReview() {
            if (this.info.tabs[REVIEW_TAB].songartist!=this.playerStatus.current.artist || this.info.tabs[REVIEW_TAB].songalbum!=this.playerStatus.current.album ||
                (this.playerStatus.current.artist_id && this.info.tabs[REVIEW_TAB].songartist_id!=this.playerStatus.current.artist_id) ||
                (this.playerStatus.current.album_id && this.info.tabs[REVIEW_TAB].songalbum_id!=this.playerStatus.current.album_id)) {
                this.info.tabs[REVIEW_TAB].text=i18n("Fetching...");
                this.info.tabs[REVIEW_TAB].songartist=this.playerStatus.current.artist;
                this.info.tabs[REVIEW_TAB].songalbum=this.playerStatus.current.album;
                this.info.tabs[REVIEW_TAB].songartist_id=this.playerStatus.current.artist_id;
                this.info.tabs[REVIEW_TAB].songalbum_id=this.playerStatus.current.album_id;
                var command = ["musicartistinfo", "albumreview", "artist:"+this.playerStatus.current.artist, "album:"+this.playerStatus.current.album, "html:1"];
                if (this.playerStatus.current.artist_id) {
                    command.push("artist_id:"+this.playerStatus.current.artist_id);
                }
                if (this.playerStatus.current.album_id) {
                    command.push("album_id:"+this.playerStatus.current.album_id);
                }
                lmsCommand("", command).then(({data}) => {
                    if (data && data.result && (data.result.albumreview || data.result.error)) {
                        this.info.tabs[REVIEW_TAB].text=data.result.albumreview ? replaceNewLines(data.result.albumreview) : data.result.error;
                    }
                });
            }
        },
        showInfo() {
            this.$nextTick(function () {
                var elem = document.getElementById("np-info");
                if (elem) {
                    elem.style.backgroundImage = "url('"+this.cover+"')";
                }
            });
            if (this.desktop && !this.showTabs) {
                this.fetchLyrics();
                this.fetchBio();
                this.fetchReview();
            } else if (LYRICS_TAB==this.info.tab) {
                this.fetchLyrics();
            } else if (BIO_TAB==this.info.tab) {
                this.fetchBio();
            } else {
                this.fetchReview();
            }
        },
        startPositionInterval() {
            this.positionInterval = setInterval(function () {
                if (undefined!=this.playerStatus.current.time && this.playerStatus.current.time>=0) {
                    this.playerStatus.current.time += 0.5;
                }
            }.bind(this), 500);
        },
        stopPositionInterval() {
            if (undefined!==this.positionInterval) {
                clearInterval(this.positionInterval);
                this.positionInterval = undefined;
            }
        },
        toggleTime() {
            this.showTotal = !this.showTotal;
            setLocalStorageVal("showTotal", this.showTotal);
        }
    },
    filters: {
        displayTime: function (value) {
            if (undefined==value || value<=0) {
                return '';
            }
            return formatSeconds(Math.floor(value));
        }
    },
    watch: {
        'info.show': function(val) {
            // Indicate that dialog is/isn't shown, so that swipe is controlled
            bus.$emit('dialog', 'info-dialog', val);
            this.showInfo();
        },
        'info.tab': function(tab) {
            this.showInfo();
        }
    },
    computed: {
        infoPlugin() {
            return this.$store.state.infoPlugin
        },
        formattedTime() {
            return this.playerStatus && this.playerStatus.current
                        ? !this.showTotal && this.playerStatus.current.time && this.playerStatus.current.duration
                            ? formatSeconds(Math.floor(this.playerStatus.current.time))+" / -"+
                              formatSeconds(Math.floor(this.playerStatus.current.duration-this.playerStatus.current.time))
                            : (this.playerStatus.current.time ? formatSeconds(Math.floor(this.playerStatus.current.time)) : "") +
                              (this.playerStatus.current.time && this.playerStatus.current.duration ? " / " : "") +
                              (this.playerStatus.current.duration ? formatSeconds(Math.floor(this.playerStatus.current.duration)) : "")
                        : undefined;
        }
    },
    beforeDestroy() {
        this.stopPositionInterval();
    }
});
