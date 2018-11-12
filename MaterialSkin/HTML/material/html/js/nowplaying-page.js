/**
 * LMS-Material
 *
 * Copyright (c) 2018 Craig Drummond <craig.p.drummond@gmail.com>
 * MIT license.
 */
 
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
   <v-flex xs6><v-btn flat icon @click="doAction(['playlist', 'index', '+1'])"><v-icon large>skip_next</v-icon></v-btn></v-flex>
  </v-flex>
 </v-layout>
 <img :src="cover" class="np-image" @click="infoPlugin ? info.show=!info.show : undefined" v-bind:class="{'cursor' : infoPlugin}"></img>
 <div>
  <p class="np-text ellipsis" v-if="playerStatus.current.title">{{playerStatus.current.title}}</p>
  <p class="np-text" v-else>&nbsp;Title</p>
  <p class="np-subtext ellipsis" v-if="playerStatus.current.artist && playerStatus.current.album">{{playerStatus.current.artist}} - {{playerStatus.current.album}}</p>
  <p class="np-subtext ellipsis" v-else-if="playerStatus.current.artist">{{playerStatus.current.artist}}</p>
  <p class="np-subtext ellipsis" v-else-if="playerStatus.current.album">{{playerStatus.current.album}}</p>
  <p class="np-subtext" v-else>&nbsp;Artist - Album</p>
  <p class="np-subtext np-time ">{{formattedTime}}</p>
  <v-slider id="pos-slider" class="np-slider" :value='playerStatus.current.time' :max='playerStatus.current.duration' @click.native="sliderChanged($event)"></v-slider>
 </div>
 <div v-if="info.show" class="np-info">
  <v-tabs centered v-model="info.tab">
   <template v-for="(tab, index) in info.tabs">
    <v-tab :key="index">{{tab.title}}</v-tab>
    <v-tab-item :key="index">
     <v-card flat>
      <v-card-text class="np-info-text" v-bind:class="{'np-info-lyrics': 0==index}" v-html="tab.text"></v-card-text>
     </v-card>
    </v-tab-item>
   </template>
  </v-tabs>
  <v-card>
   <v-card-actions>
    <v-spacer></v-spacer>
    <v-btn flat @click="info.show = false">{{trans.close}}</v-btn>
    <v-spacer></v-spacer>
   </v-card-actions>
  </v-card>
 </div>
</div>
<div class="np-page" v-else-if="playerStatus.ison">
 <div v-if="info.show" class="np-info">
  <v-tabs centered v-model="info.tab">
   <template v-for="(tab, index) in info.tabs">
    <v-tab :key="index">{{tab.title}}</v-tab>
    <v-tab-item :key="index">
     <v-card flat>
      <v-card-text class="np-info-text" v-bind:class="{'np-info-lyrics': 0==index}" v-html="tab.text"></v-card-text>
     </v-card>
    </v-tab-item>
   </template>
  </v-tabs>
  <v-card>
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
  <p class="np-subtext ellipsis" v-if="playerStatus.current.artist">{{playerStatus.current.artist}}</p>
  <p class="np-subtext" v-else>&nbsp;</p>
  <p class="np-subtext ellipsis" v-if="playerStatus.current.album">{{playerStatus.current.album}}</p>
  <p class="np-subtext" v-else>&nbsp;</p>
  <img v-if="!info.show" :src="cover" class="np-image" @contextmenu="showMenu"></img>
  <v-menu v-model="menu.show" :position-x="menu.x" :position-y="menu.y" absolute offset-y>
   <v-list>
    <v-list-tile>
     <v-list-tile-title @click="info.show=true">{{menu.text}}</v-list-tile-title>
    </v-list-tile>
   </v-list>
  </v-menu>

  <v-layout text-xs-center row wrap class="np-controls">
   <v-flex xs6 class="np-pos" v-if="!info.show && playerStatus.current.duration>0">{{playerStatus.current.time | displayTime}}</v-flex>
   <v-flex xs12 class="np-pos" style="text-align:center" v-else-if="!info.show && playerStatus.current.time>0">{{playerStatus.current.time | displayTime}}</v-flex>
   <v-flex xs6 class="np-duration" v-if="!info.show && playerStatus.current.duration>0">{{playerStatus.current.duration | displayTime}}</v-flex>
   <v-flex xs12 v-if="!info.show && playerStatus.current.duration>0"><v-slider id="pos-slider" class="np-slider" :value='playerStatus.current.time' :max='playerStatus.current.duration' @click.native="sliderChanged($event)"></v-slider></v-flex>
   <v-flex xs4>
    <v-layout text-xs-center>
     <v-flex xs6>
      <v-btn flat icon v-if="playerStatus.playlist.repeat===1" @click="doAction(['playlist', 'repeat', 0])"><v-icon>repeat_one</v-icon></v-btn>
      <v-btn flat icon v-else-if="playerStatus.playlist.repeat===2" @click="doAction(['playlist', 'repeat', 1])"><v-icon>repeat</v-icon></v-btn>
      <v-btn flat icon v-else @click="doAction(['playlist', 'repeat', 2])" class="dimmed"><v-icon>repeat</v-icon></v-btn>
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
      <v-btn flat icon v-if="playerStatus.playlist.shuffle===2" @click="doAction(['playlist', 'shuffle', 0])"><v-icon class="shuffle-albums">shuffle</v-icon></v-btn>
      <v-btn flat icon v-else-if="playerStatus.playlist.shuffle===1" @click="doAction(['playlist', 'shuffle', 2])"><v-icon>shuffle</v-icon></v-btn>
      <v-btn flat icon v-else @click="doAction(['playlist', 'shuffle', 1])" class="dimmed"><v-icon>shuffle</v-icon></v-btn>
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
                    current: { canseek:1, artwork_url:undefined, coverid: undefined, duration:0, time:0, title:undefined, artist:undefined, album:undefined },
                    playlist: { shuffle:0, repeat: 0 },
                 },
                 info: { show: false, tab:0,
                         tabs: [ { title:undefined, text:undefined }, { title:undefined, text:undefined }, { title:undefined, text:undefined } ] },
                 menu: { show: false, x:0, y:0, text: undefined },
                 trans: { close: undefined }
                };
    },
    mounted() {

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

            // Have other items changed
            if (playerStatus.ison!=this.playerStatus.ison) {
                this.playerStatus.ison = playerStatus.ison;
            }
            if (playerStatus.isplaying!=this.playerStatus.isplaying) {
                this.playerStatus.isplaying = playerStatus.isplaying;
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
            }
            if (playerStatus.current.artist!=this.playerStatus.current.artist) {
                this.playerStatus.current.artist = playerStatus.current.artist;
            }
            if (playerStatus.current.album!=this.playerStatus.current.album) {
                this.playerStatus.current.album = playerStatus.current.album;
            }
            if (playerStatus.playlist.shuffle!=this.playerStatus.playlist.shuffle) {
                this.playerStatus.playlist.shuffle = playerStatus.playlist.shuffle;
            }
            if (playerStatus.playlist.repeat!=this.playerStatus.playlist.repeat) {
                this.playerStatus.playlist.repeat = playerStatus.playlist.repeat;
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
    },
    methods: {
        initItems() {
            this.trans.close=i18n("Close");
            this.menu.text=i18n("Show information");
            this.info.tabs[0].title=i18n("Lyrics");
            this.info.tabs[1].title=i18n("Artist Biography");
            this.info.tabs[2].title=i18n("Album Review");
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
        fetchLyrics() {
            if (this.info.tabs[0].songartist!=this.playerStatus.current.artist || this.info.tabs[0].songtitle!=this.playerStatus.current.title) {
                this.info.tabs[0].text=i18n("Fetching...");
                lmsCommand("", ["musicartistinfo", "lyrics", "artist:"+this.playerStatus.current.artist, "title:"+this.playerStatus.current.title]).then(({data}) => {
                    if (data && data.result && (data.result.lyrics || data.result.error) && data.result.artist==this.playerStatus.current.artist &&
                        data.result.title==this.playerStatus.current.title) {
                        this.info.tabs[0].text=data.result.lyrics ? replaceNewLines(data.result.lyrics) : data.result.error;
                        this.info.tabs[0].songartist=this.playerStatus.current.artist;
                        this.info.tabs[0].songtitle=this.playerStatus.current.title;
                    }
                });
            }
        },
        fetchBio() {
            if (this.info.tabs[1].songartist!=this.playerStatus.current.artist) {
                this.info.tabs[1].text=i18n("Fetching...");
                lmsCommand("", ["musicartistinfo", "biography", "artist:"+this.playerStatus.current.artist]).then(({data}) => {
                    if (data && data.result && (data.result.biography || data.result.error) && data.result.artist==this.playerStatus.current.artist) {
                        this.info.tabs[1].text=data.result.biography ? replaceNewLines(data.result.biography) : data.result.error;
                        this.info.tabs[1].songartist=this.playerStatus.current.artist;
                    }
                });
            }
        },
        fetchReview() {
            if (this.info.tabs[2].songartist!=this.playerStatus.current.artist || this.info.tabs[2].songalbum!=this.playerStatus.current.album) {
                this.info.tabs[2].text=i18n("Fetching...");
                lmsCommand("", ["musicartistinfo", "albumreview", "artist:"+this.playerStatus.current.artist, "album:"+this.playerStatus.current.album]).then(({data}) => {
                    if (data && data.result && (data.result.albumreview || data.result.error) && data.result.artist==this.playerStatus.current.artist &&
                        data.result.album==this.playerStatus.current.album) {
                        this.info.tabs[2].text=data.result.albumreview ? replaceNewLines(data.result.albumreview) : data.result.error;
                        this.info.tabs[2].songartist=this.playerStatus.current.artist;
                        this.info.tabs[2].songalbum=this.playerStatus.current.album;
                    }
                });
            }
        },
        showInfo() {
            if (0==this.info.tab) {
                this.fetchLyrics();
            } else if (1==this.info.tab) {
                this.fetchBio();
            } else {
                this.fetchReview();
            }
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
                        ? (this.playerStatus.current.time ? formatSeconds(Math.floor(this.playerStatus.current.time)) : "") +
                          (this.playerStatus.current.time && this.playerStatus.current.duration ? " / " : "") +
                          (this.playerStatus.current.duration ? formatSeconds(Math.floor(this.playerStatus.current.duration)) : "")
                        : undefined;
        }
    },
});
