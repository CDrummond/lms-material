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
   <p v-if="item.link" class="item-info-text"><a class="lms-link" :href="item.text" target="_blank">{{item.text}}</a></p>
   <p v-else class="item-info-text">{{item.text}}</p>
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
            if (item.version) {
                this.details.push({title: i18n("Version"), text: item.version});
            }
            if (item.creator) {
                this.details.push({title: i18n("Creator"), text: item.creator});
            }
            if (item.email) {
                this.details.push({title: i18n("E-Mail"), text: item.email});
            }
            if (item.url) {
                this.details.push({title: i18n("URL"), text: item.url});
            } else if (undefined!=item.id && item.id.startsWith("http")) {
                this.details.push({title: i18n("URL"), text: item.id, link:true});
            } else if (item.homepage) {
                this.details.push({title: i18n("Homepage"), text: item.homepage, link:true});
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

