/**
 * LMS-Material
 *
 * Copyright (c) 2018-2019 Craig Drummond <craig.p.drummond@gmail.com>
 * MIT license.
 */
 
Vue.component('lms-noconnection', {
    template: `
<v-dialog v-model="show" persistent fullscreen>
 <v-card style="width:100%; height:100%; display: flex; justify-content: center; align-items: center;">
  <table>
   <tr><td style="text-align: center; padding-bottom: 32px;"><h2>{{i18n('Server connection lost...')}}</h2></td></tr>
   <tr><td style="text-align: center;"><v-progress-circular color="primary" size=72 width=6 indeterminate></v-progress-circular></td></tr>
   <tr><td style="text-align: center;padding-top:16px"><v-btn @click="reconnect()" :disabled="disableBtn" flat>{{i18n('Reconnect')}}</v-btn></td></tr>
  </table>
 </v-card>
</v-dialog>
`,
    props: [],
    data () {
        return { show:false, disableBtn:false }
    },
    computed: {
        noNetwork () {
            return this.$store.state.noNetwork
        }
    },
    mounted() {
        this.pressTimer = undefined;
        bus.$on('networkStatus', function(connected) {
            if (connected==this.show) { // Only act if state changed
                this.disableBtn = true;
                this.cancelPressTimer();
                this.show = !connected;

                // Don't enable reconnect button until 30 seconds after
                // initially showing
                if (this.show) {
                    this.initialTimer = setTimeout(function () {
                        this.initialTimer = undefined;
                        this.disableBtn = false;
                    }.bind(this), 30000);
                } else {
                    this.cancelInitialTimer();
                }
            }
        }.bind(this));
    },
    beforeDestroy() {
        this.cancelInitialTimer();
        this.cancelPressTimer();
    },
    methods: {
        i18n(str) {
            return this.show ? i18n(str) : str;
        },
        reconnect() {
            if (!this.disableBtn) {
                bus.$emit("reconnect");
                // Disable reconnect button for 10 seconds after pressed
                this.disableBtn = true;
                this.pressTimer = setTimeout(function () {
                    this.pressTimer = undefined;
                    this.disableBtn = false;
                }.bind(this), 10000);
            }
        },
        cancelInitialTimer() {
             if (undefined!==this.initialTimer) {
                clearTimeout(this.initialTimer);
                this.initialTimer = undefined;
                this.disableBtn = false;
            }
        },
        cancelPressTimer() {
             if (undefined!==this.pressTimer) {
                clearTimeout(this.pressTimer);
                this.pressTimer = undefined;
                this.disableBtn = false;
            }
        }
    }
})
