/**
 * LMS-Material
 *
 * Copyright (c) 2018-2019 Craig Drummond <craig.p.drummond@gmail.com>
 * MIT license.
 */
 
Vue.component('lms-noconnection', {
    template: `
<v-dialog v-model="noNetwork" persistent fullscreen>
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
        return { }
    },
    computed: {
        noNetwork () {
            return this.$store.state.noNetwork
        }
    },
    mounted() {
        bus.$on('noNetwork', function() {
            this.cancelInterval();
            this.$store.commit('setNoNetwork', true);
            this.refreshInterval = setInterval(function () {
                var that = this;
                lmsCheckConnection().then(function (resp) {
                    that.$store.commit('setNoNetwork', false);
                    bus.$emit('networkReconnected');
                    that.cancelInterval();
                });
            }.bind(this), 1500);
        }.bind(this));
    },
    methods: {
        i18n(str) {
            return i18n(str);
        },
        cancelInterval() {
            if (undefined!==this.refreshInterval) {
                clearInterval(this.refreshInterval);
                this.refreshInterval = undefined;
            }
        }
    },
    beforeDestroy() {
        this.cancelInterval();
    }
})
