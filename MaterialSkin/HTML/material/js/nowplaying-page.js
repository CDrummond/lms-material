/*
 * LMS-Material
 *
 * Copyright (c) 2018 Craig Drummond <craig.p.drummond@gmail.com>
 * MIT license.
 */
 
var lmsNowPlaying = Vue.component("LmsNowPlaying", {
    template: `
      <div class="np-page" v-if="playerStatus.isOn">
        <p class="np-text ellipsis" v-if="playerStatus.current.title">{{playerStatus.current.title}}</p>
        <p class="np-text" v-else>&nbsp;</p>
        <p class="np-subtext ellipsis" v-if="playerStatus.current.artist">{{playerStatus.current.artist}}</p>
        <p class="np-subtext" v-else>&nbsp;</p>
        <p class="np-subtext ellipsis" v-if="playerStatus.current.album">{{playerStatus.current.album}}</p>
        <p class="np-subtext" v-else>&nbsp;</p>
        <img :src="cover" class="np-image"></img>

        <v-layout text-xs-center row wrap class="np-controls">
          <v-flex xs6 class="np-pos">{{playerStatus.current.time | displayTime}}</v-flex>
          <v-flex xs6 class="np-duration">{{playerStatus.current.duration | displayTime}}</v-flex>
          <v-flex xs12><v-slider id="pos-slider" class="np-slider" :value='playerStatus.current.time' :max='playerStatus.current.duration' @click.native="sliderChanged($event)"></v-slider></v-flex>
          <v-flex xs4>
            <v-layout text-xs-center>
              <v-flex xs6>
               <v-btn flat icon v-if="playerStatus.playlist.repeat===1" @click="doAction(['playlist', 'repeat', 0])"><v-icon>repeat_one</v-icon></v-btn>
               <v-btn flat icon v-else-if="playerStatus.playlist.repeat===2" @click="doAction(['playlist', 'repeat', 1])"><v-icon>repeat</v-icon></v-btn>
               <v-btn flat icon v-else @click="doAction(['playlist', 'repeat', 2])" class="dimmed-icon"><v-icon>repeat</v-icon></v-btn>
              </v-flex>
              <v-flex xs6><v-btn flat icon @click="doAction(['button', 'jump_rew'])"><v-icon large>skip_previous</v-icon></v-btn></v-flex>
            </v-layout>
          </v-flex>
          <v-flex xs4>
            <v-btn flat icon large v-if="playerStatus.isPlaying" @click="doAction(['pause'])"><v-icon x-large>pause_circle_outline</v-icon></v-btn>
            <v-btn flat icon large v-else @click="doAction(['play'])"><v-icon x-large>play_circle_outline</v-icon></v-btn>
          </v-flex>          
          <v-flex xs4>
            <v-layout text-xs-center>
              <v-flex xs6><v-btn flat icon @click="doAction(['playlist', 'index', '+1'])"><v-icon large>skip_next</v-icon></v-btn></v-flex>
              <v-flex xs6>
                <v-btn flat icon v-if="playerStatus.playlist.shuffle===2" @click="doAction(['playlist', 'shuffle', 0])"><v-icon class="shuffle-albums">shuffle</v-icon></v-btn>
                <v-btn flat icon v-else-if="playerStatus.playlist.shuffle===1" @click="doAction(['playlist', 'shuffle', 2])"><v-icon>shuffle</v-icon></v-btn>
                <v-btn flat icon v-else @click="doAction(['playlist', 'shuffle', 1])" class="dimmed-icon"><v-icon>shuffle</v-icon></v-btn>
              </v-flex>
            </v-layout>
          </v-flex>
        </v-layout>
      </div>
`,
    props: [],
    data() {
        return { cover:undefined,
                 coverFromPlayer:undefined,
                 playerStatus: {
                    isOn: 1,
                    isPlaying: 1,
                    current: { canseek:1, artwork_url:undefined, coverid: undefined, duration:0, time:0, title:undefined, artist:undefined, album:undefined },
                    playlist: { shuffle:0, repeat: 0 },
                 }
                };
    },
    mounted() {
        bus.$on('playerStatus', function(playerStatus) {
            // Has cover changed?
            if (playerStatus.current.artwork_url!=this.playerStatus.current.artwork_url ||
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
            }

            // Have other items changed
            if (playerStatus.isOn!=this.playerStatus.isOn) {
                this.playerStatus.isOn = playerStatus.isOn;
            }
            if (playerStatus.isPlaying!=this.playerStatus.isPlaying) {
                this.playerStatus.isPlaying = playerStatus.isPlaying;
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
    },
    methods: {
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
        }
    },
    filters: {
        displayTime: function (value) {
            if (undefined==value) {
                return '';
            }
            return formatSeconds(Math.floor(value));
        }
    }
});
