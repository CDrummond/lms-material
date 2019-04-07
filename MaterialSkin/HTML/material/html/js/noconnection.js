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
   <tr><td style="text-align: center;"><v-btn @click="reconnect()" :disabled="disabled">{{i18n('Reconnect'}}</v-btn></td></tr>
  </table>
 </v-card>
</v-dialog>
`,
    props: [],
    data () {
        return { show:false, disabled:false }
    },
    computed: {
        noNetwork () {
            return this.$store.state.noNetwork
        }
    },
    mounted() {
        this.pressTimer = undefined;
        bus.$on('networkStatus', function(connected) {
            this.disabled = false;
            this.cancelTimer();
            this.show = !connected;
        }.bind(this));
    },
    beforeDestroy() {
        this.cancelTimer();
    },
    methods: {
        i18n(str) {
            return this.show ? i18n(str) : str;
        },
        reconnect() {
            if (undefined==this.pressTimer) {
                bus.$emit("reconnect");
                this.disabled = true;
                this.pressTimer = setTimeout(function () {
                    this.pressTimer = undefined;
                    this.disabled = false;
                }.bind(this), 10*1000);
            }
        },
        cancelTimer() {
             if (undefined!==this.pressTimer) {
                clearTimeout(this.pressTimer);
                this.pressTimer = undefined;
                this.disabled = false;
            }
        }
    }
})
