/**
 * LMS-Material
 *
 * Copyright (c) 2018 Craig Drummond <craig.p.drummond@gmail.com>
 * MIT license.
 */
 
Vue.component('lms-bottomnav', {
    template: `
<v-footer height="auto" class="lms-footer">
 <v-bottom-nav class="lms-bottom-nav" :active.sync="route">
  <template v-for="(item, index) in items">
   <v-btn flat :to="item.route" class="lms-bottom-nav-button">
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
            items: [],
            route: undefined
        }
    },
    created() {
        bus.$on('langChanged', function() {
            this.initItems();
        }.bind(this));
        this.initItems();
        // Work-around: Sometmes when play a track and route is changed programatically from browse->now playing, both
        // browse and nowplaying tabs are shown as active. Also, when using back button previous tab can sometimes be shown
        // as active.
        bus.$on('routeChanged', function(from, to) {
            for (var i=0; i<this.items.length; ++i) {
                if (this.items[i].route==to) {
                    this.route=i;
                }
            }
        }.bind(this));
    },
    methods: {
        initItems() {
            this.items = [
                          { text: i18n('Browse'),  icon: 'music_note',          route: '/browse' },
                          { text: i18n('Playing'), icon: 'play_circle_outline', route: '/nowplaying' },
                          { text: i18n('Queue'),   icon: 'list',                route: '/queue' },
                         ];
        }
    }
})

