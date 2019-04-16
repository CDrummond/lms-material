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
  </table>
 </v-card>
</v-dialog>
`,
    props: [],
    data () {
        return { status:false, show:false }
    },
    computed: {
        noNetwork () {
            return this.$store.state.noNetwork
        }
    },
    mounted() {
        bus.$on('networkStatus', function(connected) {
            if (connected!=this.status) { // Only act if state changed
                this.cancelTimers();
                this.status = connected;
                this.show = false;

                if (!this.status) {
                    // Don't show dialog until 15 seconds after network disconnect, as
                    // might reconnect quickly
                    this.initialTimer = setTimeout(function () {
                        this.show = true;
                        this.initialTimer = undefined;
                    }.bind(this), 15000);
                }
            }
        }.bind(this));
    },
    beforeDestroy() {
        this.cancelTimers();
    },
    methods: {
        i18n(str) {
            return this.show ? i18n(str) : str;
        },
        cancelTimers() {
            if (undefined!==this.initialTimer) {
                clearTimeout(this.initialTimer);
                this.initialTimer = undefined;
            }
        }
    }
})
