/**
 * LMS-Material
 *
 * Copyright (c) 2018-2024 Craig Drummond <craig.p.drummond@gmail.com>
 * MIT license.
 */
'use strict';

Vue.component('lms-bottomnav', {
    template: `
<v-footer class="lms-footer" id="nav-bar">
 <v-bottom-nav class="lms-bottom-nav" :active="activeBtn">
  <template v-for="(item, index) in items">
   <v-btn flat class="lms-bottom-nav-button" v-longpress:nomove="btnPressed" v-bind:class="{'active-nav': activeBtn==index, 'inactive-nav': activeBtn!=index}" :id="'navbtn-'+index">
    <span>{{item.text}}</span>
    <div class="pill" v-bind:class="{'pill-ct':coloredToolbars}" v-if="activeBtn==index"></div>
    <v-icon v-if="activeBtn==index">{{item.active}}</v-icon>
    <img v-else class="nav-svg-img" :src="item.inactive | svgIcon(darkUi|coloredToolbars)" oncontextmenu="return false;"></img>
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
                if (2==key.length && 'f'==key[0]) {
                    let idx = parseInt(key[1])-1;
                    if (idx>=0 && idx<this.items.length) {
                        if (this.$store.state.page!=this.items[idx].page) {
                            this.tabPressed(this.items[idx].page, false);
                            return;
                        }
                    }
                }
            }.bind(this));
        }
    },
    methods: {
        initItems() {
            this.items = [
                          { text: i18n('Browse'),  page: 'browse',      active:'library_music', inactive:'library-music-outline'},
                          { text: i18n('Playing'), page: 'now-playing', active:'music_note',    inactive:'music-note-outline' },
                          { text: i18n('Queue'),   page: 'queue',       active:'queue_music',   inactive:'queue_music_outline' },
                         ];
        },
        btnPressed(longPress, el) {
            if (this.$store.state.visibleMenus.size>0) {
                return;
            }
            let idx = parseInt(el.id.split("-")[1]);
            if (idx<0 || idx>this.items.length) {
                return;
            }
            this.tabPressed(this.items[idx].page, longPress)
        },
        tabPressed(page, longPress) {
            if (page!=this.$store.state.page) {
                this.$store.commit('setPage', page);
            } else {
                bus.$emit('nav', page, longPress);
            }
        }
    },
    computed: {
        darkUi () {
            return this.$store.state.darkUi
        },
        activeBtn() {
            for (let i=0; i<this.items.length; ++i) {
                if (this.items[i].page==this.$store.state.page) {
                    return i;
                }
            }
            return 0;
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

