/**
 * LMS-Material
 *
 * Copyright (c) 2018-2026 Craig Drummond <craig.p.drummond@gmail.com>
 * MIT license.
 */
'use strict';

var screensaver;
function resetScreensaver() {
    screensaver.resetTimers();
}

const NP_SCREENSAVER_TIMEOUT    = 5*60*1000;

Vue.component('lms-screensaver', {
    template: `
<v-dialog v-model="showClock" v-if="showClock" scrollable fullscreen>
 <v-card class="screensaver-bgnd" v-on:mousemove="resetTimers()" v-on:touchstart="resetTimers()" id="screensaver">
  <div :style="{ marginLeft: marginLeft + 'px', marginTop: marginTop + 'px' }" id="screensaver-contents" v-if="screensaverType!=3">
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
        return { screensaverType: 0,
                 npSwitchEnabled: false,
                 showClock: false,
                 npSwitched: false,
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
        this.screensaverType = this.$store.state.screensaver;
        this.npSwitchEnabled = this.$store.state.screensaverNp;
        this.controlScreensaver();
        this.controlNp();
        this.toggleHandlers();
        this.state = 'hidden';
        this.alarmTime = 0;
        this.nowPlayingIsExpanded = false;
        this.nowPlayingWasExpanded = false;
        bus.$on('nowPlayingExpanded', function(val) {
            this.nowPlayingIsExpanded = val;
        }.bind(this));
        bus.$on('screensaverDisplayChanged', function() {
            if (this.screensaverType!=this.$store.state.screensaver || this.npSwitchEnabled!=this.$store.state.screensaverNp) {
                this.screensaverType = this.$store.state.screensaver;
                this.npSwitchEnabled = this.$store.state.screensaverNp;
                this.toggleHandlers();
                if (this.screensaverType>0) {
                    if (!this.playing) {
                        this.controlScreensaver();
                    }
                } else {
                    this.cancelAllClock(false);
                }
                if (this.npSwitchEnabled) {
                    this.controlNp();
                } else {
                    this.cancelAllNp();
                }
            }
            this.resetTimers();
        }.bind(this));
        bus.$on('playerStatus', function(playerStatus) {
            if (playerStatus.isplaying != this.playing) {
                // Player state changed
                this.playing = playerStatus.isplaying;
                this.updateAlarm(playerStatus);
                this.controlScreensaver();
            }
        }.bind(this));
    },
    methods: {
        controlScreensaver() {
            if (this.screensaverType>0) {
                if (this.playing) {
                    if ('shown'==this.state) {
                        if (this.$store.state.desktopLayout) {
                            if (!this.nowPlayingIsExpanded) {
                                bus.$emit('expandNowPlaying', true);
                            }
                        } else {
                            this.$store.commit('setPage', 'now-playing');
                        }
                    }
                    this.cancelAllClock(true);
                } else {
                    this.resetClockTimer();
                }
            }
        },
        controlNp() {
            if (this.npSwitchEnabled) {
                this.resetNpTimer();
            }
        },
        updateDateAndTime() {
            if (this.screensaverType<=0 || this.screensaverType==3) {
                return;
            }
            let date = new Date();
            this.date = dateStr(date, this.$store.state.lang);
            this.time = timeStr(date, this.$store.state.lang);

            if (undefined!==this.updateClockTimer) {
                clearTimeout(this.updateClockTimer);
            }
            let next = 60-date.getSeconds();
            this.updateClockTimer = setTimeout(function () {
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
            if (this.screensaverType<=0 || this.screensaverType==3) {
                return;
            }
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
        cancelAllClock(doFade) {
            if (undefined!==this.showClockTimer) {
                clearTimeout(this.showClockTimer);
                this.showClockTimer = undefined;
            }
            if (undefined!==this.updateClockTimer) {
                clearTimeout(this.updateClockTimer);
                this.updateClockTimer = undefined;
            }
            if (undefined!==this.moveClockTimer) {
                clearTimeout(this.moveClockTimer);
                this.moveClockTimer = undefined;
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
                this.state = this.showClock ? "shown" : "hidden";
            }

            if (doFade) {
                this.fade(document.getElementById('screensaver'), false);
            } else {
                if (this.elem) {
                    this.elem.style.opacity=1.0;
                }
                this.showClock = false;
                this.state = this.showClock ? "shown" : "hidden";
            }
        },
        cancelAllNp() {
            if (undefined!==this.showNpTimer) {
                clearTimeout(this.showNpTimer);
                this.showNpTimer = undefined;
            }
        },
        fade(elem, fadeIn) {
            if (undefined==elem) {
                this.showClock = false;
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
                        this.showClock = false;
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
            clearInterval(this.moveClockTimer);
            if (this.screensaverType==1) {
                this.moveClockTimer = setInterval(function () {
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
            }
        },
        toggleHandlers() {
            if (this.screensaverType>0 || this.npSwitchEnabled) {
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
        resetTimers() {
            this.resetClockTimer();
            this.resetNpTimer();
        },
        resetClockTimer() {
            this.cancelAllClock(true);
            if (this.screensaverType>0 && lmsOptions.screensaverTimeout>0) {
                if (!this.playing) {
                    this.showClockTimer = setTimeout(function () {
                        this.showClock = true;
                        this.updateDateAndTime();
                        this.$nextTick(function () {
                            this.startDisplay();
                        });
                    }.bind(this), lmsOptions.screensaverTimeout*1000);
                }
            }
        },
        resetNpTimer() {
            this.cancelAllNp();
            if (this.npSwitchEnabled && lmsOptions.npSwitchTimeout>0) {
                if (this.npSwitched) {
                    changeLink("", "oled");
                    this.npSwitched = false;
                    if (this.$store.state.desktopLayout) {
                        if (!this.nowPlayingWasExpanded) {
                            bus.$emit('expandNowPlaying', false);
                        }
                    } else {
                        this.$store.commit('setPage', this.prevPage);
                    }
                } else {
                    this.showNpTimer = setTimeout(function () {
                        if (this.$store.state.desktopLayout) {
                            this.nowPlayingWasExpanded = this.nowPlayingIsExpanded;
                            if (!this.nowPlayingWasExpanded) {
                                bus.$emit('expandNowPlaying', true);
                            }
                        } else {
                            this.prevPage = this.$store.state.page;
                            this.$store.commit('setPage', 'now-playing');
                        }
                        this.npSwitched = true;
                        changeLink("html/css/other/np-only.css?r=" + LMS_MATERIAL_REVISION, "oled", true);
                    }.bind(this), lmsOptions.npSwitchTimeout*1000);
                }
            }
        }
    },
    beforeDestroy() {
        this.cancelAllClock(false);
        this.cancelAllNp();
    }
})
