/**
 * LMS-Material
 *
 * Copyright (c) 2018-2024 Craig Drummond <craig.p.drummond@gmail.com>
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
  <div :style="{ marginLeft: marginLeft + 'px', marginTop: marginTop + 'px' }" id="screensaver-contents">
   <p class="screensaver-time ellipsis">{{time}}</p>
   <p class="screensaver-date ellipsis">{{date}}</p>
   <p v-if="undefined!=alarm" class="screensaver-alarm ellipsis"><v-icon>alarm</v-icon> {{alarm}}</p>
   <p v-else class="screensaver-alarm ellipsis">&nbsp;</p>
   <p class="screensaver-name ellipsis">{{playerName}}</p>
  </div>
 </v-card>
</v-dialog>
`,
    props: [],
    data () {
        return { enabled: false,
                 show: false,
                 date: "date",
                 time: "time",
                 alarm: undefined,
                 marginLeft: 0,
                 marginTop: 0
        }
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
                this.updateAlarm(playerStatus);
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
            this.date = dateStr(date, this.$store.state.lang);
            this.time = timeStr(date, this.$store.state.lang);

            if (undefined!==this.updateTimer) {
                clearTimeout(this.updateTimer);
            }
            let next = 60-date.getSeconds();
            this.updateTimer = setTimeout(function () {
                this.updateDateAndTime();
            }.bind(this), (next*1000)+25);

            if (LMS_VERSION<80500) {
                if (undefined!=this.$store.state.player) {
                    lmsCommand(this.$store.state.player.id, ["material-skin-client", "get-alarm"]).then(({data}) => {
                        let alarmTime = 0;
                        if (undefined!=data.result && undefined!=data.result.alarm) {
                            alarmTime = parseInt(data.result.alarm);
                        }
                        if (alarmTime>0) {
                            if (this.alarmTime!=alarmTime) {
                                let alarmDate = new Date(alarmTime*1000);
                                this.alarm = dateStr(alarmDate, this.$store.state.lang)+" "+timeStr(alarmDate, this.$store.state.lang);
                            }
                        } else {
                            this.alarm = undefined;
                        }
                        this.alarmTime = alarmTime;
                    });
                } else {
                    this.alarm = undefined;
                    this.alarmTime = 0;
                }
            }
        },
        updateAlarm(status) {
            if (this.alarmTime!=status.alarm) {
                if (undefined==status.alarm) {
                    this.alarm = undefined;
                } else {
                    let alarmDate = new Date(status.alarm*1000);
                    this.alarm = dateStr(alarmDate, this.$store.state.lang)+" "+timeStr(alarmDate, this.$store.state.lang);
                }
                this.alarmTime=status.alarm;
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
            if (undefined!==this.moveTimer) {
                clearTimeout(this.moveTimer);
                this.moveTimer = undefined;
            }
            if (undefined!==this.changePosInterval) {
                clearInterval(this.changePosInterval);
                this.changePosInterval = undefined;
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
                    if (0!=queryParams.nativeColors) {
                        if (fadeIn) {
                            emitToolbarColors();
                        } else {
                            emitToolbarColorsFromState(this.$store.state);
                        }
                    }
                }
            }.bind(this), 50);
        },
        changePos(elem, newLeft, newTop) {
            let fadeOut = true
            var val = fadeOut  ? 1.0 : 0.0;
            this.changePosInterval = setInterval(function () {
                val += fadeOut ? -0.05 : 0.05;
                elem.style.opacity = val;
                if (fadeOut && val<=0.0) {
                    this.marginLeft = newLeft;
                    this.marginTop = newTop;
                    fadeOut = false;
                } else if (!fadeOut && val>=1.0) {
                    var interval = this.changePosInterval;
                    this.changePosInterval = undefined;
                    clearInterval(interval);
                }
            }.bind(this), 75);
        },
        startDisplay() {
            this.fade(document.getElementById('screensaver'), true);
            let e = document.getElementById('screensaver-contents');
            if (undefined!=e) {
                let rect = e.getBoundingClientRect();
                this.diffs = [window.innerWidth - rect.width, window.innerHeight - rect.height];
                this.currentPos = this.prevPos = [0, 0];
                this.marginLeft = this.diffs[0] * this.currentPos[0];
                this.marginTop = this.diffs[1] * this.currentPos[1];
                this.startMoving();
            }
        },
        startMoving() {
            clearInterval(this.moveTimer);
            this.moveTimer = setInterval(function () {
                let factors = [-1, -0.75, -0.5, -0.25, 0, 0.25, 0.5, 0.75, 1.0];
                let newPos = [0, 0];
                for (let i=0; i<500; ++i) {
                    newPos=[ factors[Math.floor(Math.random() * factors.length)],
                             factors[Math.floor(Math.random() * factors.length)] ];
                    if ( (newPos[0]!=this.currentPos[0] || newPos[1]!=this.currentPos[1]) &&
                         (newPos[0]!=this.prevPos[0] || newPos[1]!=this.prevPos[1]) ) {
                        this.prevPos = this.currentPos;
                        this.currentPos = newPos;
                    }
                }
                this.changePos(document.getElementById('screensaver-contents'),
                               (this.diffs[0] * this.currentPos[0]) + (this.currentPos[0]>0 ? -32 : this.currentPos[0]<0 ? 32 : 0),
                               (this.diffs[1] * this.currentPos[1]) + (this.currentPos[1]>0 ? -32 : this.currentPos[1]<0 ? 32 : 0));
            }.bind(this), 5*60*1000); // Move every Xminutes
        },
        toggleHandlers() {
            if (this.enabled) {
                if (!this.installedHandlers) {
                    window.addEventListener('touchstart', resetScreensaver);
                    window.addEventListener('mousedown', resetScreensaver);
                    window.addEventListener('mousemove', resetScreensaver);
                    window.addEventListener('click', resetScreensaver);
                    window.addEventListener('wheel', resetScreensaver);
                    window.addEventListener('keydown', resetScreensaver);
                    this.installedHandlers = true;
                }
            } else if (this.installedHandlers) {
                window.removeEventListener('touchstart', resetScreensaver);
                window.removeEventListener('mousedown', resetScreensaver);
                window.removeEventListener('mousemove', resetScreensaver);
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
                        this.startDisplay();
                    });
                }.bind(this), 60*1000);
            }
        }
    },
    beforeDestroy() {
        this.cancelAll(false);
    }
})

