/*
 * LMS-Material
 *
 * Copyright (c) 2018 Craig Drummond <craig.p.drummond@gmail.com>
 * MIT license.
 */
 
var lmsNowPlaying = Vue.component("LmsNowPlaying", {
    template: `
      <div class="np-page" v-if="playerStatus  && playerStatus.isOn">
        <p class="np-text ellipsis" v-if="playerStatus.current && playerStatus.current.title">{{playerStatus.current.title}}</p>
        <p class="np-text" v-else>&nbsp;</p>
        <p class="np-subtext ellipsis" v-if="playerStatus.current && playerStatus.current.artist">{{playerStatus.current.artist}}</p>
        <p class="np-subtext" v-else>&nbsp;</p>
        <p class="np-subtext ellipsis" v-if="playerStatus.current && playerStatus.current.album">{{playerStatus.current.album}}</p>
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
               <v-btn flat icon v-else @click="doAction(['playlist', 'repeat', 2])" style="opacity:0.5"><v-icon>repeat</v-icon></v-btn>
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
                <v-btn flat icon v-else @click="doAction(['playlist', 'shuffle', 1])" style="opacity:0.5"><v-icon>shuffle</v-icon></v-btn>
              </v-flex>
            </v-layout>
          </v-flex>
        </v-layout>
      </div>
`,
    props: [],
    data() {
        return { }
    },
    created() {
    },
    methods: {
        doAction(command) {
            bus.$emit('playerCommand', command);
        },
        sliderChanged(e) {
            if (this.$store.state.playerStatus && this.$store.state.playerStatus.current && 
                this.$store.state.playerStatus.current.canseek && this.$store.state.playerStatus.current.duration>3) {
                const rect = document.getElementById("pos-slider").getBoundingClientRect();
                const pos = e.clientX - rect.x;
                const width = rect.width;
                this.doAction(['time', Math.floor(this.$store.state.playerStatus.current.duration * pos / rect.width)]);
            }
        }
    },
    computed: {
        cover() {
            if (this.$store.state.playerStatus && this.$store.state.playerStatus.current) {
                if (this.$store.state.playerStatus.current.artwork_url) {
                    return resolveImage(null, this.$store.state.playerStatus.current.artwork_url);
                }
                if (this.$store.state.playerStatus.current.coverid) {
                    return lmsServerAddress+"/music/"+this.$store.state.playerStatus.current.coverid+"/cover.jpg";
                }
            }
            if (this.$store.state.player&& this.$store.state.player.id) {
                return lmsServerAddress+"/music/current/cover.jpg?player=" + this.$store.state.player.id;
            }
            return "images/nocover.jpg";
        },
        playerStatus () {;
            return this.$store.state.playerStatus
        }
    },
    filters: {
        displayTime: function (value) {
            if (!value) {
                return '';
            }
            return formatSeconds(Math.floor(value));
        }
    }
});
