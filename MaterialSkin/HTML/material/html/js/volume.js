/**
 * LMS-Material
 *
 * Copyright (c) 2018-2021 Craig Drummond <craig.p.drummond@gmail.com>
 * MIT license.
 */
'use strict';

Vue.component('lms-volume', {
    template: `
<v-sheet v-model="show" v-if="show" elevation="5" class="vol-sheet">
 <v-container grid-list-md text-xs-center>
  <v-layout row wrap>
   <v-flex xs12><p class="vol-text">{{playerVolume|displayVolume(dvc)}}</p></v-flex>
   <v-flex xs12>
    <v-layout>
     <v-btn flat icon @wheel="volWheel($event)" v-longpress:true="volumeDown" class="vol-btn"><v-icon>{{muted ? 'volume_off' : 'volume_down'}}</v-icon></v-btn>
     <v-slider step="1" :disabled="!dvc" v-model="playerVolume" @wheel.native="volWheel($event)" @click.stop="setVolume" class="vol-slider" @start="volumeSliderStart" @end="volumeSliderEnd"></v-slider>
     <v-btn flat icon @wheel="volWheel($event)" v-longpress:true="volumeUp" class="vol-btn"><v-icon>{{muted ? 'volume_off' : 'volume_up'}}</v-icon></v-btn>
    </v-layout>
   </v-flex>
  </v-layout>
 </v-container>
 <v-card-actions>
  <v-btn flat v-if="dvc" @click.native="toggleMute()">{{muted ? i18n('Unmute') : i18n('Mute')}}</v-btn>
  <v-spacer></v-spacer>
  <v-btn flat @click.native="show = false">{{i18n('Close')}}</v-btn>
 </v-card-actions>
</v-sheet>
    `,
    props: [],
    data() {
        return { 
                 show: false,
                 playerVolume: 0,
                 muted: false,
                 dvc: true
               }
    },
    mounted() {
        this.closeTimer = undefined;
        bus.$on('playerStatus', function(playerStatus) {
            if ((this.show || this.showing) && !this.movingVolumeSlider) {
                this.muted = playerStatus.volume<0;
                var vol = Math.abs(playerStatus.volume);
                if (vol!=this.playerVolume) {
                    this.playerVolume = vol;
                }
                this.dvc = playerStatus.dvc;
                if (this.showing) {
                    this.showing = false;
                    this.movingVolumeSlider = false;
                    this.show = true;
                    this.resetCloseTimer();
                }
            }
        }.bind(this));
        
        bus.$on('volume.open', function() {
            if (this.show) {
                this.close();
                return;
            }
            this.showing=true;
            bus.$emit('refreshStatus');
        }.bind(this));
        bus.$on('noPlayers', function() {
            this.close();
        }.bind(this));
        bus.$on('esc', function() {
            if (this.$store.state.activeDialog == 'volume') {
                this.close();
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
            this.showing=false;
            this.cancelCloseTimer();
        },
        volumeDown() {
            bus.$emit('playerCommand', ["mixer", "volume", "-"+lmsOptions.volumeStep]);
            this.resetCloseTimer();
        },
        volumeUp() {
            bus.$emit('playerCommand', ["mixer", "volume", "+"+lmsOptions.volumeStep]);
            this.resetCloseTimer();
        },
        setVolume() {
            bus.$emit('playerCommand', ["mixer", "volume", this.playerVolume]);
            this.resetCloseTimer();
        },
        toggleMute() {
            bus.$emit('playerCommand', ['mixer', 'muting', this.muted ? 0 : 1]);
            this.resetCloseTimer();
        },
        volWheel(event) {
            if (event.deltaY<0) {
                this.volumeUp();
            } else if (event.deltaY>0) {
                this.volumeDown();
            }
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
    },
    filters: {
        displayVolume: function (value, dvc) {
            return dvc ? value+'%' : '';
        },
    }
})
