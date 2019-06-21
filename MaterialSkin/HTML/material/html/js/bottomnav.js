/**
 * LMS-Material
 *
 * Copyright (c) 2018-2019 Craig Drummond <craig.p.drummond@gmail.com>
 * MIT license.
 */
 
Vue.component('lms-bottomnav', {
    template: `
<v-footer height="auto" class="lms-footer">
 <v-bottom-nav class="lms-bottom-nav" :active="activeBtn">
  <template v-for="(item, index) in items">
   <v-btn v-if="index==0" flat class="lms-bottom-nav-button" v-longpress="browsePressed" v-bind:class="{'inactive-nav': activeBtn!=index}" id="browse-nav-btn">
    <span>{{item.text}}</span>
    <v-icon>{{item.icon}}</v-icon>
   </v-btn>
   <v-btn v-else-if="index==1" flat class="lms-bottom-nav-button" v-longpress="npPressed" v-bind:class="{'inactive-nav': activeBtn!=index}" id="browse-nav-btn">
    <span>{{item.text}}</span>
    <v-icon>{{item.icon}}</v-icon>
   </v-btn>
   <v-btn v-else flat class="lms-bottom-nav-button" v-longpress="queuePressed" v-bind:class="{'inactive-nav': activeBtn!=index}" id="browse-nav-btn">
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
                          { text: i18n('Browse'),  icon: 'music_note',          page: 'browse' },
                          { text: i18n('Playing'), icon: 'play_circle_outline', page: 'now-playing' },
                          { text: i18n('Queue'),   icon: 'queue_music',         page: 'queue' },
                         ];
        },
        setPage(page, longPress) {
            if (page!=this.$store.state.page) {
                this.$store.commit('setPage', page);
            } else {
                bus.$emit('nav', page, longPress);
            }
        },
        browsePressed(longPress) {
            this.setPage(this.items[0].page, longPress);
        },
        npPressed(longPress) {
            this.setPage(this.items[1].page, longPress);
        },
        queuePressed(longPress) {
            this.setPage(this.items[2].page, longPress);
        }
    },
    computed: {
        activeBtn() {
            if (this.items[0].page==this.$store.state.page) {
                return 0;
            }
            if (this.items[1].page==this.$store.state.page) {
                return 1;
            }
            return 2;
        }
    }
})

