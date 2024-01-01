/**
 * LMS-Material
 *
 * Copyright (c) 2018-2024 Craig Drummond <craig.p.drummond@gmail.com>
 * MIT license.
 */
'use strict';

Vue.component('lms-volume', {
    template: `
<v-sheet v-model="show" v-if="show" elevation="5" class="vol-sheet noselect">
 <v-container grid-list-md text-xs-center>
  <volume-control
  <v-layout row wrap>
   <v-flex xs12>
    <volume-control :value="playerVolume" :muted="muted" :playing="true" :dvc="dvc" :layout="0" @inc="volumeUp" @dec="volumeDown" @changed="setVolume" @moving="movingSlider" @toggleMute="toggleMute()"></volume-control>
   </v-flex>
   <v-flex xs12 class="padding hide-for-mini"></v-flex>
  </v-layout>
 </v-container>
 <v-card-actions>
  <v-btn flat v-if="dvc==VOL_STD" @click.native="toggleMute()">{{muted ? i18n('Unmute') : i18n('Mute')}}</v-btn>
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
                 dvc: VOL_STD
               }
    },
    mounted() {
        this.closeTimer = undefined;
        bus.$on('playerStatus', function(playerStatus) {
            if ((this.show || this.showing) && !this.movingVolumeSlider) {
                this.muted = playerStatus.muted;
                var vol = playerStatus.volume;
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
            if (queryParams.party) {
                return;
            }
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
        bus.$on('closeDialog', function(dlg) {
            if (dlg == 'volume') {
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
        bus.$on('adjustVolume', function() {
            if (this.show) {
                this.cancelUpdateTimer();
                this.updateTimer = setTimeout(function() { bus.$emit('refreshStatus'); }.bind(this), 100);
            }
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
        setVolume(val) {
            if (!this.show) {
                return;
            }
            this.playerVolume = val;
            bus.$emit('playerCommand', ["mixer", "volume", this.playerVolume]);
            this.resetCloseTimer();
        },
        toggleMute() {
            if (!this.show) {
                return;
            }
            bus.$emit('playerCommand', ['mixer', 'muting', this.muted ? 0 : 1]);
            this.resetCloseTimer();
        },
        i18n(str) {
            if (this.show) {
                return i18n(str);
            } else {
                return str;
            }
        },
        movingSlider(moving) {
            this.movingVolumeSlider=moving;
            if (moving) {
                this.cancelCloseTimer();
            } else {
                this.resetCloseTimer();
            }
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
        cancelUpdateTimer() {
            if (undefined!==this.updateTimer) {
                clearTimeout(this.updateTimer);
                this.updateTimer = undefined;
            }
        }
    },
    watch: {
        'show': function(val) {
            this.$store.commit('dialogOpen', {name:'volume', shown:val});
            this.resetCloseTimer();
            this.cancelUpdateTimer();
        }
    }
})
