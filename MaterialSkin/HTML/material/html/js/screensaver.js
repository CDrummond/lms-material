/**
 * LMS-Material
 *
 * Copyright (c) 2018-2022 Craig Drummond <craig.p.drummond@gmail.com>
 * MIT license.
 */
'use strict';

var screensaver;
function resetScreensaver(ev) {
    screensaver.resetTimer(ev);
}

Vue.component('lms-screensaver', {
    template: `
<v-dialog v-model="show" v-if="show" scrollable fullscreen>
 <v-card class="screensaver-bgnd" v-on:mousemove="resetTimer($event)" v-on:touchstart="resetTimer($event)" id="screensaver">
  <p class="screensaver-time ellipsis">{{time}}</p>
  <p class="screensaver-date ellipsis">{{date}}</p>
  <p v-if="undefined!=alarm" class="screensaver-alarm ellipsis"><v-icon>alarm</v-icon> {{alarm}}</p>
  <p class="screensaver-name ellipsis">{{playerName}}</p>
 </v-card>
</v-dialog>
`,
    props: [],
    data () {
        return { enabled: false,
                 show: false,
                 date: "date",
                 time: "time",
                 alarm: undefined}
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
        this.alarmTime = 0;
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
            let date = new Date();
            this.date = date.toLocaleDateString(this.$store.state.lang, { weekday: 'short', month: 'short', day: 'numeric', year: undefined }).replace(", ", "  ");
            this.time = date.toLocaleTimeString(this.$store.state.lang, { hour: 'numeric', minute: 'numeric' });

            if (undefined!==this.updateTimer) {
                clearTimeout(this.updateTimer);
            }
            let next = 60-date.getSeconds();
            this.updateTimer = setTimeout(function () {
                this.updateDateAndTime();
            }.bind(this), (next*1000)+25);

            if (undefined!=this.$store.state.player) {
                lmsCommand(this.$store.state.player.id, ["material-skin-client", "get-alarm"]).then(({data}) => {
                    let alarmTime = 0;
                    if (undefined!=data.result && undefined!=data.result.alarm) {
                        alarmTime = parseInt(data.result.alarm);
                    }
                    this.alarm = undefined;
                    if (this.alarmTime!=alarmTime && alarmTime>0) {
                        this.alarmTime = alarmTime;
                        let alarmDate = new Date(this.alarmTime*1000);
                        let day = alarmDate.toLocaleDateString(this.$store.state.lang, { weekday: 'short', month: undefined, day: undefined, year: undefined }).replace(", ", "  ");
                        let time = alarmDate.toLocaleTimeString(this.$store.state.lang, { hour: 'numeric', minute: 'numeric' });
                        this.alarm = day+" "+time;
                    }
                });
            } else {
                this.alarm = undefined;
            }
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
                    window.addEventListener('mousedown', resetScreensaver);
                    window.addEventListener('click', resetScreensaver);
                    window.addEventListener('wheel', resetScreensaver);
                    window.addEventListener('keydown', resetScreensaver);
                    this.installedHandlers = true;
                }
            } else if (this.installedHandlers) {
                window.removeEventListener('touchstart', resetScreensaver);
                window.removeEventListener('mousedown', resetScreensaver);
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

