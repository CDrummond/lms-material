/**
 * LMS-Material
 *
 * Copyright (c) 2018 Craig Drummond <craig.p.drummond@gmail.com>
 * MIT license.
 */
 
Vue.component('lms-bottomnav', {
    template: `
        <v-footer height="auto" class="lms-footer">
          <v-bottom-nav class="lms-bottom-nav" active.sync>
            <template v-for="(item, index) in items">
              <v-btn flat :to="item.type" class="lms-bottom-nav-button">
                <span>{{item.text}}</span>
                <v-icon>{{item.icon}}</v-icon>
              </v-btn>
            </template>
          </v-bottom-nav>
        </v-footer>
`,
    props: [],
    data() {
        return {
            items: []
        }
    },
    created() {
        bus.$on('langChanged', function() {
            this.initItems();
        }.bind(this));
        this.initItems();
    },
    methods: {
        initItems() {
            this.items = [
                          { text: i18n('Browse'),  icon: 'music_note',          type: 'browse' },
                          { text: i18n('Playing'), icon: 'play_circle_outline', type: 'nowplaying' },
                          { text: i18n('Queue'),   icon: 'list',                type: 'queue' },
                         ];
        }
    }
})

