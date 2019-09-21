/**
 * LMS-Material
 *
 * Copyright (c) 2018-2019 Craig Drummond <craig.p.drummond@gmail.com>
 * MIT license.
 */

Vue.component('lms-info-dialog', {
    template: `
<v-dialog scrollable v-model="show" persistent width="600">
 <v-card>
  <v-card-text>
  <template v-for="(item, index) in details">
   <v-header class="item-info-header">{{item.title}}</v-header>
   <p class="item-info-text">{{item.text}}</p>
   </template>
  </v-card-text>
  <v-card-actions>
   <v-spacer></v-spacer>
   <v-btn flat @click.native="close()">{{i18n('Close')}}</v-btn>
  </v-card-actions>
 </v-card>
</v-dialog>
`,
    props: [],
    data() {
        return {
            show: false,
            title: undefined,
            details: []
        }
    },
    mounted() {
        bus.$on('iteminfo.open', function(item) {
            this.details = [];
            this.details.push({title: i18n("Title"), text: item.title});
            if (item.descr) {
                this.details.push({title: i18n("Description"), text: item.descr});
            }
            if (item.url) {
                this.details.push({title: i18n("URL"), text: item.url});
            } else if (item.id.startsWith("http")) {
                this.details.push({title: i18n("URL"), text: item.id});
            }
            this.show=true
        }.bind(this));
        bus.$on('esc', function() {
            this.close();
        }.bind(this));
    },
    methods: {
        close() {
            this.details = [];
            this.show=false;
        },
        i18n(str) {
            if (this.show) {
                return i18n(str);
            } else {
                return str;
            }
        }
    },
    watch: {
        'show': function(val) {
            bus.$emit('dialogOpen', 'iteminfo', val);
        }
    }
})

