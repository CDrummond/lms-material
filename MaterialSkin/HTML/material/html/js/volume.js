/*
 * LMS-Material
 *
 * Copyright (c) 2018 Craig Drummond <craig.p.drummond@gmail.com>
 * MIT license.
 */

Vue.component('lms-volume', {
    template: `
        <v-dialog v-model="show" width=500> <!-- class="volume-popup"> -->
          <v-card>
            <v-container grid-list-md text-xs-center>
              <v-layout row wrap>
                <v-flex xs12>{{playerVolume}} %</v-flex>
                <v-flex xs12>
                  <v-layout>
                    <v-btn flat icon @click.stop="volumeDown" class="vol-btn"><v-icon>volume_down</v-icon></v-btn>
                    <v-slider step="5" v-model="playerVolume" class="vol-slider"></v-slider>
                    <v-btn flat icon @click.stop="volumeUp" class="vol-btn"><v-icon>volume_up</v-icon></v-btn>
                  </v-layout>
                </v-flex>
              </v-layout>
            </v-container>
            <v-card-actions>
              <v-spacer></v-spacer>
              <v-btn flat @click.native="show = false">Close</v-btn>
            </v-card-actions>
          </v-card>
        </v-dialog>
    `,
    props: [],
    data() {
        return { 
                 show: false,
                 playerVolume:-1,
               }
    },
    mounted() {
        this.playerVolumeCurrent = -1;
        this.playerVolumePrev = -1;
        bus.$on('playerStatus', function(playerStatus) {
            if (playerStatus.volume!=this.playerVolume && playerStatus.volume!=this.playerVolumePrev) {
                this.playerVolume = playerStatus.volume;
            }
        }.bind(this));
        
        bus.$on('volume', function() {
            lmsCommand(this.$store.state.player.id, ["mixer", "volume", "?"]).then(({data}) => {
                if (data && data.result && data.result._volume) {
                    var vol = parseInt(data.result._volume);
                    if (vol>=0) {
                        this.playerVolumeCurrent = vol;
                        this.playerVolumePrev = vol;
                        this.playerVolume = vol;
                        this.show = true;
                    }
                }
            });
        }.bind(this));
    },
    methods: {
        volumeDown() {
            if (this.playerVolume<=5) {
                this.playerVolume = 0;
            } else {
                this.playerVolume -= 5;
            }
        },
        volumeUp() {
            if (this.playerVolume>=95) {
                this.playerVolume = 100;
            } else {
                this.playerVolume += 5;
            }
        },
        i18n(str) {
            if (this.show) {
                return i18n(str);
            } else {
                return str;
            }
        }
    },
    watch: {
        'playerVolume': function(newVal) {
            if (this.show && newVal>=0 && this.playerVolumeCurrent !== newVal) {
                this.playerVolumePrev = this.playerVolumeCurrent;
                this.playerVolumeCurrent = newVal;
                bus.$emit('playerCommand', ["mixer", "volume", newVal]);
            }
        }
    }
})
