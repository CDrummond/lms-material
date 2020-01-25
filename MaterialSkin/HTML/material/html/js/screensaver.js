/**
 * LMS-Material
 *
 * Copyright (c) 2018-2019 Craig Drummond <craig.p.drummond@gmail.com>
 * MIT license.
 */
 
Vue.component('lms-screensaver', {
    template: `
<v-dialog v-model="show" v-if="show" scrollable fullscreen>
 <v-card class="screesaver-bgnd" v-on:mousemove="cancel" v-on:touchstart="cancel" id="screensaver">

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
        this.playing = false;
        this.enabled = this.$store.state.screensaver;
        bus.$on('screensaverDisplayChanged', function() {
            if (this.enabled != this.$store.state.screensaver) {
                this.enabled = this.$store.state.screensaver;
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
            this.playing = playerStatus.isplaying;
            this.control();
        }.bind(this));
    },
    methods: {
        control() {
            if (this.enabled) {
                if (this.playing) {
                    this.show = false;
                } else if (undefined==this.showTimer) {
                    this.showTimer = setTimeout(function () {
                        this.show = true;
                        this.$nextTick(function () {
                            this.fade(document.getElementById('screensaver'), true);
                            this.setDate();
                            this.timeInterval = setInterval(function () {
                                this.setDate();
                            }.bind(this), 1000);
                        });
                    }.bind(this), 60*1000);
                }
            }
        },
        setDate() {
            var date = new Date();
            this.date = date.toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric', year: undefined });
            this.time = date.toLocaleTimeString(undefined, { hour: 'numeric', minute: 'numeric' });
        },
        cancel() {
            if (this.fadeIn!=false) {
                this.cancelAll(true);
            }
            if (!this.playing) {
                this.control();
            }
        },
        cancelAll(doFade) {
            if (undefined!==this.showTimer) {
                clearTimeout(this.showTimer);
                this.showTimer = undefined;
            }
            if (undefined!==this.timeInterval) {
                clearInterval(this.timeInterval);
                this.timeInterval = undefined;
            }
            if (undefined!==this.fadeInterval) {
                clearInterval(this.fadeInterval);
                this.fadeInterval = undefined;
                this.elem.style.opacity=1.0;
            }
            if (doFade) {
                this.fade(document.getElementById('screensaver'), false);
            } else {
                this.show = false;
            }
        },
        fade(elem, fadeIn) {
            if (this.fadeIn==fadeIn) {
                return;
            }
            this.fadeIn = fadeIn;
            if (undefined!==this.fadeInterval) {
                clearInterval(this.fadeInterval);
            }
            var steps = 10;
            var val = fadeIn ? 0.0 : 1.0;
            this.elem = elem;
            elem.style.opacity = val;
            this.fadeInterval = setInterval(function () {
                val += fadeIn ? 0.1 : -0.1;
                elem.style.opacity = val; 
                if (fadeIn ? val >= 1.0 : val<=0.0) {
                    elem.style.opacity = fadeIn ? 1.0 : 0.0;
                    if (!fadeIn) {
                        this.show=false;
                    }
                    var interval = this.fadeInterval;
                    this.fadeInterval = undefined;
                    clearInterval(interval);
                }
            }.bind(this), 50);
        }
    },
    beforeDestroy() {
        this.cancelAll(false);
    }
})

