/**
 * LMS-Material
 *
 * Copyright (c) 2018-2021 Craig Drummond <craig.p.drummond@gmail.com>
 * MIT license.
 */
'use strict';

Vue.component('lms-volumeoverlay', {
    template: `
   <div v-show="show && volume>-1 && dvc" id="keyboardVolumeOverlay">{{volume}}%</div>
`,
    props: [],
    data() {
        return {
            volume: -1,
            dvc: true,
            show: false
        }
    },
    mounted() {
        if (!IS_MOBILE) {
            bindKey('up', 'alt');
            bindKey('down', 'alt');
            bus.$on('keyboard', function(key, modifier) {
                if (!this.$store.state.player || this.$store.state.visibleMenus.size>0 || (this.$store.state.openDialogs.length>0 && this.$store.state.openDialogs[0]!='info-dialog'))  {
                    return;
                }
                if ('alt'==modifier && (key=='up' || key=='down')) {
                    this.startTimeout();
                }
            }.bind(this));
        }
        bus.$on('adjustVolume', function(inc) {
            this.startTimeout();
        }.bind(this));
        bus.$on('playerStatus', function(playerStatus) {
            this.dvc = playerStatus.dvc;
            var vol = playerStatus.volume;
            if (vol!=this.volume) {
                this.volume = vol;
            }
        }.bind(this));
    },
    methods: {
        startTimeout() {
            this.show=true;
            this.stopTimeout();
            this.hideTimer = setTimeout(function () {
                this.show=false;
                this.hideTimer = undefined;
            }.bind(this), 1500);
        },
        stopTimeout() {
            if (this.hideTimer) {
                clearTimeout(this.hideTimer);
                this.hideTimer = undefined;
            }
        }
    },
    beforeDestroy() {
        this.stopTimeout();
    }
})
