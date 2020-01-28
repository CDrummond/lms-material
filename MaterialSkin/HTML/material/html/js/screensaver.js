/**
 * LMS-Material
 *
 * Copyright (c) 2018-2019 Craig Drummond <craig.p.drummond@gmail.com>
 * MIT license.
 */

var screensaver;
function resetScreensaver(ev) {
    screensaver.resetTimer(ev);
}

Vue.component('lms-screensaver', {
    template: `
<v-dialog v-model="show" v-if="show" scrollable fullscreen>
 <v-card class="screesaver-bgnd" v-on:mousemove="resetTimer($event)" v-on:touchstart="resetTimer($event)" id="screensaver">

   <p class="screesaver-time ellipsis">{{time}}</p>
   <p class="screesaver-date ellipsis">{{date}}</p>
   <p class="screesaver-name ellipsis">{{playerName}}</p>

 </v-card>
</v-dialog>
`,
    props: [],
    data () {
        return { enabled: false,
                 show: false,
                 date: "date",
                 time: "time"}
    },
    computed: {
        playerName () {
            return this.$store.state.player ? this.$store.state.player.name : "";
        }
    },
    mounted() {
        screensaver = this;
        this.playing = false;
        this.enabled = this.$store.state.screensaver;
        this.control();
        this.toggleHandlers();
        this.state = 'hidden';
        bus.$on('screensaverDisplayChanged', function() {
            if (this.enabled != this.$store.state.screensaver) {
                this.enabled = this.$store.state.screensaver;
                this.toggleHandlers();
                if (this.enabled) {
                    if (!this.playing) {
                        this.control();
                    }
                } else {
                    this.cancelAll(false);
                }
            }
        }.bind(this));
        bus.$on('playerStatus', function(playerStatus) {
            if (playerStatus.isplaying != this.playing) {
                // Player state changed
                this.playing = playerStatus.isplaying;
                this.control();
            }
        }.bind(this));
        bus.$on('hasFocus', function() {
            if (this.enabled) {
                this.resetTimer();
            }
        }.bind(this));
    },
    methods: {
        control() {
            if (this.enabled) {
                if (this.playing) {
                    this.cancelAll(true);
                } else {
                    this.resetTimer();
                }
            }
        },
        updateDateAndTime() {
            var date = new Date();
            this.date = date.toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric', year: undefined });
            this.time = date.toLocaleTimeString(undefined, { hour: 'numeric', minute: 'numeric' });

            if (undefined!==this.updateTimer) {
                clearTimeout(this.updateTimer);
            }
            var next = 60-date.getSeconds();
            this.updateTimer = setInterval(function () {
                this.updateDateAndTime();
            }.bind(this), (next*1000)+25);
        },
        cancelAll(doFade) {
            if (undefined!==this.showTimer) {
                clearTimeout(this.showTimer);
                this.showTimer = undefined;
            }
            if (undefined!==this.updateTimer) {
                clearTimeout(this.updateTimer);
                this.updateTimer = undefined;
            }
            if (doFade && this.state=='hidding') {
                return;
            }
            if (undefined!==this.fadeInterval) {
                clearInterval(this.fadeInterval);
                this.fadeInterval = undefined;
                this.state = this.show ? "shown" : "hidden";
            }

            if (doFade) {
                this.fade(document.getElementById('screensaver'), false);
            } else {
                if (this.elem) {
                    this.elem.style.opacity=1.0;
                }
                this.show = false;
                this.state = this.show ? "shown" : "hidden";
            }
        },
        fade(elem, fadeIn) {
            if (undefined==elem) {
                this.show = false;
                return;
            }
            if ( (fadeIn && (this.state=='shown' || this.state=='showing')) ||
                 (!fadeIn && (this.state=='hidden' || this.state=='hidding')) ) {
                return;
            }
            if (undefined!==this.fadeInterval) {
                clearInterval(this.fadeInterval);
            }
            this.elem = elem;
            var val = fadeIn  ? 0 : 1.0;
            elem.style.opacity = val;
            this.state = fadeIn ? 'showing' : 'hidding';
            this.fadeInterval = setInterval(function () {
                val += fadeIn ? 0.025 : -0.1;
                elem.style.opacity = val; 
                if (fadeIn ? val >= 1.0 : val<=0.0) {
                    elem.style.opacity = fadeIn ? 1.0 : 0.0;
                    if (!fadeIn) {
                        this.show = false;
                    }
                    this.state = fadeIn ? 'shown' : 'hidden';
                    var interval = this.fadeInterval;
                    this.fadeInterval = undefined;
                    clearInterval(interval);
                }
            }.bind(this), 50);
        },
        toggleHandlers() {
            if (this.enabled) {
                if (!this.installedHandlers) {
                    window.addEventListener('touchstart', resetScreensaver);
                    window.addEventListener('click', resetScreensaver);
                    window.addEventListener('wheel', resetScreensaver);
                    window.addEventListener('keydown', resetScreensaver);
                    this.installedHandlers = true;
                }
            } else if (this.installedHandlers) {
                window.removeEventListener('touchstart', resetScreensaver);
                window.removeEventListener('click', resetScreensaver);
                window.removeEventListener('wheel', resetScreensaver);
                window.removeEventListener('keydown', resetScreensaver);
                this.installedHandlers = false;
            }
        },
        resetTimer(ev) {
            this.cancelAll(true);
            if (!this.playing) {
                this.showTimer = setTimeout(function () {
                    this.show = true;
                    this.updateDateAndTime();
                    this.$nextTick(function () {
                        this.fade(document.getElementById('screensaver'), true);
                    });
                }.bind(this), 60*1000);
            }
        }
    },
    beforeDestroy() {
        this.cancelAll(false);
    }
})

