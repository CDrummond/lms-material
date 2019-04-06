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
   <tr><td style="text-align: center;"><v-btn @click="reconnect()">{{i18n('Reconnect'}}</v-btn></td></tr>
  </table>
 </v-card>
</v-dialog>
`,
    props: [],
    data () {
        return { show:false }
    },
    computed: {
        noNetwork () {
            return this.$store.state.noNetwork
        }
    },
    mounted() {
        bus.$on('networkStatus', function(connected) {
            this.show = !connected;
        }.bind(this));
    },
    methods: {
        i18n(str) {
            return this.show ? i18n(str) : str;
        },
        reconnect() {
            bus.$emit("reconnect");
        }
    }
})
