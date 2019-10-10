/**
 * LMS-Material
 *
 * Copyright (c) 2018-2019 Craig Drummond <craig.p.drummond@gmail.com>
 * MIT license.
 */

Vue.component('lms-volume', {
    template: `
<v-sheet v-model="show" v-if="show" elevation="5" class="vol-sheet">
 <v-container grid-list-md text-xs-center>
  <v-layout row wrap>
   <v-flex xs12 class="vol-text">{{playerVolume}}%</v-flex xs12>
   <v-flex xs12>
    <v-layout>
     <v-btn flat icon @click.stop="volumeDown" class="vol-btn"><v-icon>{{muted ? 'volume_off' : 'volume_down'}}</v-icon></v-btn>
     <v-slider step="1" v-model="playerVolume" @click.stop="setVolume" class="vol-slider" @start="volumeSliderStart" @end="volumeSliderEnd"></v-slider>
     <v-btn flat icon @click.stop="volumeUp" class="vol-btn"><v-icon>{{muted ? 'volume_off' : 'volume_up'}}</v-icon></v-btn>
    </v-layout>
   </v-flex>
  </v-layout>
 </v-container>
 <v-card-actions>
  <v-btn flat @click.native="toggleMute()">{{muted ? i18n('Unmute') : i18n('Mute')}}</v-btn>
  <v-spacer></v-spacer>
  <v-btn flat @click.native="show = false">{{i18n('Close')}}</v-btn>
 </v-card-actions>
</v-sheet>
    `,
    props: [],
    data() {
        return { 
                 show: false,
                 playerVolume:0,
                 muted: false
               }
    },
    mounted() {
        this.closeTimer = undefined;
        bus.$on('playerStatus', function(playerStatus) {
            if (this.show && !this.movingVolumeSlider) {
                this.muted = playerStatus.volume<0;
                var vol = Math.abs(playerStatus.volume);
                if (vol!=this.playerVolume) {
                    this.playerVolume = vol;
                }
            }
        }.bind(this));
        
        bus.$on('volume.open', function() {
            if (this.show) {
                this.close();
                return;
            }
            lmsCommand(this.$store.state.player.id, ["mixer", "volume", "?"]).then(({data}) => {
                if (data && data.result && data.result._volume) {
                    var vol = parseInt(data.result._volume);
                    this.muted = vol<0;
                    vol = Math.abs(vol);
                    this.playerVolume = vol;
                    this.movingVolumeSlider = false;
                    this.show = true;
                    this.resetCloseTimer();
                }
            });
        }.bind(this));
        bus.$on('noPlayers', function() {
            this.close();
        }.bind(this));
        bus.$on('esc', function() {
            if (this.$store.state.activeDialog == 'volume') {
                this.show=false;
            }
        }.bind(this));
        bus.$on('dialogOpen', function(name, open) {
            if (open && name!='volume') {
                this.close();
            }
        }.bind(this));
        bus.$on('menuOpen', function() {
            this.close();
        }.bind(this));
    },
    beforeDestroy() {
        this.cancelCloseTimer();
    },
    methods: {
        close() {
            this.show=false;
            this.cancelCloseTimer();
        },
        volumeDown() {
            bus.$emit('playerCommand', ["mixer", "volume", adjustVolume(Math.abs(this.playerVolume), false)]);
            this.resetCloseTimer();
        },
        volumeUp() {
            bus.$emit('playerCommand', ["mixer", "volume", adjustVolume(Math.abs(this.playerVolume), true)]);
            this.resetCloseTimer();
        },
        setVolume() {
            bus.$emit('playerCommand', ["mixer", "volume", this.playerVolume]);
            this.resetCloseTimer();
        },
        toggleMute() {
            bus.$emit('playerCommand', ['mixer', 'muting', 'toggle']);
            this.resetCloseTimer();
        },
        i18n(str) {
            if (this.show) {
                return i18n(str);
            } else {
                return str;
            }
        },
        volumeSliderStart() {
            this.movingVolumeSlider=true;
            this.cancelCloseTimer();
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
            this.resetCloseTimer();
            this.cancelSendVolumeTimer();
        },
        cancelCloseTimer() {
            if (undefined!==this.closeTimer) {
                clearTimeout(this.closeTimer);
                this.closeTimer = undefined;
            }
        },
        resetCloseTimer() {
            this.cancelCloseTimer();
            this.closeTimer = setTimeout(function () {
                this.show = false;
            }.bind(this), LMS_VOLUME_CLOSE_TIMEOUT);
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
    watch: {
        'playerVolume': function(newVal) {
            if (this.show && newVal>=0) {
                if (!this.movingVolumeSlider) {
                    this.resetCloseTimer();
                }
                this.resetSendVolumeTimer();
            }
        },
        'show': function(val) {
            this.$store.commit('dialogOpen', {name:'volume', shown:val});
            this.resetCloseTimer();
            this.cancelSendVolumeTimer();
        }
    }
})
