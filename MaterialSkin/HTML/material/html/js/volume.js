/**
 * LMS-Material
 *
 * Copyright (c) 2018-2019 Craig Drummond <craig.p.drummond@gmail.com>
 * MIT license.
 */

Vue.component('lms-volume', {
    template: `
<v-dialog v-model="show" v-if="show" width=500>
 <v-card>
  <v-container grid-list-md text-xs-center>
   <v-layout row wrap>
    <v-flex xs12 class="vol-text">{{playerVolume}}%</v-flex xs12>
    <v-flex xs12>
     <v-layout>
      <v-btn flat icon @click.stop="volumeDown" class="vol-btn"><v-icon>{{muted ? 'volume_off' : 'volume_down'}}</v-icon></v-btn>
      <v-slider step="1" v-model="playerVolume" class="vol-slider"></v-slider>
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
 </v-card>
</v-dialog>
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
        this.playerVolumeCurrent = -1;
        this.playerVolumePrev = -1;
        bus.$on('playerStatus', function(playerStatus) {
            if (this.show) {
                this.muted = playerStatus.volume<0;
                var vol = Math.abs(playerStatus.volume);
                if (vol!=this.playerVolume && vol!=this.playerVolumePrev && (!this.lastUpdate || ((new Date())-this.lastUpdate)>500)) {
                    this.playerVolume = vol;
                    this.lastUpdate = new Date();
                }
            }
        }.bind(this));
        
        bus.$on('volume.open', function() {
            lmsCommand(this.$store.state.player.id, ["mixer", "volume", "?"]).then(({data}) => {
                if (data && data.result && data.result._volume) {
                    var vol = parseInt(data.result._volume);
                    this.muted = vol<0;
                    vol = Math.abs(vol);
                    this.playerVolumeCurrent = vol;
                    this.playerVolumePrev = vol;
                    this.playerVolume = vol;
                    this.show = true;
                    this.resetCloseTimer();
                }
            });
        }.bind(this));
        bus.$on('noPlayers', function() {
            this.show=false;
            this.cancelCloseTimer();
        }.bind(this));
    },
    beforeDestroy() {
        this.cancelCloseTimer();
    },
    methods: {
        volumeDown() {
            this.playerVolume = adjustVolume(Math.abs(this.playerVolume), false);
        },
        volumeUp() {
            this.playerVolume = adjustVolume(Math.abs(this.playerVolume), true);
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
        }
    },
    watch: {
        'playerVolume': function(newVal) {
            if (this.show && newVal>=0 && this.playerVolumeCurrent !== newVal) {
                this.resetCloseTimer();
                this.playerVolumePrev = this.playerVolumeCurrent;
                this.playerVolumeCurrent = newVal;
                this.lastUpdate = new Date();
                bus.$emit('playerCommand', ["mixer", "volume", newVal]);
            }
        },
        'show': function(val) {
            bus.$emit('dialogOpen', 'volume', val);
        }
    }
})
