/**
 * LMS-Material
 *
 * Copyright (c) 2018-2023 Craig Drummond <craig.p.drummond@gmail.com>
 * MIT license.
 */
'use strict';

Vue.component('lms-bottomnav', {
    template: `
<v-footer class="lms-footer" id="nav-bar">
 <v-bottom-nav class="lms-bottom-nav" :active="activeBtn">
  <template v-for="(item, index) in items">
   <v-btn v-if="index==0" flat class="lms-bottom-nav-button" v-longpress:nomove="browsePressed" v-bind:class="{'active-nav': activeBtn==index, 'inactive-nav': activeBtn!=index}" id="browse-nav-btn">
    <span>{{item.text}}</span>
    <div class="pill" v-bind:class="{'pill-ct':coloredToolbars}" v-if="activeBtn==index"></div>
    <v-icon v-if="activeBtn==index">library_music</v-icon>
    <img v-else class="nav-svg-img" :src="'library-music-outline' | svgIcon(darkUi|coloredToolbars)" oncontextmenu="return false;"></img>
   </v-btn>
   <v-btn v-else-if="index==1" flat class="lms-bottom-nav-button" @click="npPressed" v-bind:class="{'active-nav': activeBtn==index, 'inactive-nav': activeBtn!=index}" id="browse-nav-btn">
    <span>{{item.text}}</span>
    <div class="pill" v-bind:class="{'pill-ct':coloredToolbars}" v-if="activeBtn==index"></div>
    <v-icon v-if="activeBtn==index">music_note</v-icon>
    <img v-else class="nav-svg-img" :src="'music-note-outline' | svgIcon(darkUi|coloredToolbars)" oncontextmenu="return false;"></img>
   </v-btn>
   <v-btn v-else flat class="lms-bottom-nav-button" v-longpress:nomove="queuePressed" v-bind:class="{'active-nav': activeBtn==index, 'inactive-nav': activeBtn!=index}" id="browse-nav-btn">
    <span>{{item.text}}</span>
    <div class="pill" v-bind:class="{'pill-ct':coloredToolbars}" v-if="activeBtn==index"></div>
    <v-icon v-if="activeBtn==index">queue_music</v-icon>
    <img v-else class="nav-svg-img" :src="'queue_music_outline' | svgIcon(darkUi|coloredToolbars)" oncontextmenu="return false;"></img>
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

        if (!IS_MOBILE) {
            bindKey('f1');
            bindKey('f2');
            bindKey('f3');
            bus.$on('keyboard', function(key, modifier) {
                if (!this.$store.state.keyboardControl || undefined!=modifier || this.$store.state.openDialogs.length>0 || this.$store.state.visibleMenus.size>0) {
                    return;
                }
                if ('f1'==key && this.$store.state.page!="browse") {
                    this.browsePressed(false);
                } else if ('f2'==key && this.$store.state.page!="now-playing") {
                    this.npPressed(false);
                } else if ('f3'==key && this.$store.state.page!="queue") {
                    this.queuePressed(false);
                }
            }.bind(this));
        }
    },
    methods: {
        initItems() {
            this.items = [
                          { text: i18n('Browse'),  page: 'browse' },
                          { text: i18n('Playing'), page: 'now-playing' },
                          { text: i18n('Queue'),   page: 'queue' },
                         ];
        },
        setPage(page, longPress) {
            if (this.$store.state.visibleMenus.size>0) {
                return;
            }
            if (page!=this.$store.state.page) {
                this.$store.commit('setPage', page);
            } else {
                bus.$emit('nav', page, longPress);
            }
        },
        browsePressed(longPress) {
            this.setPage(this.items[0].page, longPress);
        },
        npPressed() {
            this.setPage(this.items[1].page, false);
        },
        queuePressed(longPress) {
            this.setPage(this.items[2].page, false);
        }
    },
    computed: {
        darkUi () {
            return this.$store.state.darkUi
        },
        activeBtn() {
            if (this.items[0].page==this.$store.state.page) {
                return 0;
            }
            if (this.items[1].page==this.$store.state.page) {
                return 1;
            }
            return 2;
        },
        coloredToolbars() {
            return this.$store.state.coloredToolbars
        }
    },
    filters: {
        svgIcon: function (name, dark) {
            return "/material/svg/"+name+"?c="+(dark ? LMS_DARK_SVG : LMS_LIGHT_SVG)+"&r="+LMS_MATERIAL_REVISION;
        }
    }
})

