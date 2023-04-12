/**
 * LMS-Material
 *
 * Copyright (c) 2018-2023 Craig Drummond <craig.p.drummond@gmail.com>
 * MIT license.
 */
'use strict';

const NAV_SVGS = [
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath d='M4,6H2V20A2,2 0 0,0 4,22H18V20H4M18,7H15V12.5A2.5,2.5 0 0,1 12.5,15A2.5,2.5 0 0,1 10,12.5A2.5,2.5 0 0,1 12.5,10C13.07,10 13.58,10.19 14,10.5V5H18M20,2H8A2,2 0 0,0 6,4V16A2,2 0 0,0 8,18H20A2,2 0 0,0 22,16V4A2,2 0 0,0 20,2Z' fill='%23000'/%3E%3C/svg%3E%0A",
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath d='M12 3V13.55C11.41 13.21 10.73 13 10 13C7.79 13 6 14.79 6 17S7.79 21 10 21 14 19.21 14 17V7H18V3H12Z' fill='%23000'/%3E%3C/svg%3E%0A",
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath d='M15,6H3V8H15V6M15,10H3V12H15V10M3,16H11V14H3V16M17,6V14.18C16.69,14.07 16.35,14 16,14A3,3 0 0,0 13,17A3,3 0 0,0 16,20A3,3 0 0,0 19,17V8H22V6H17Z' fill='%23000'/%3E%3C/svg%3E%0A"];

Vue.component('lms-bottomnav', {
    template: `
<v-footer class="lms-footer" id="nav-bar">
 <v-bottom-nav class="lms-bottom-nav" :active="activeBtn">
  <template v-for="(item, index) in items">
   <v-btn v-if="index==0" flat class="lms-bottom-nav-button" v-longpress:nomove="browsePressed" v-bind:class="{'active-nav': activeBtn==index, 'inactive-nav': activeBtn!=index}" id="browse-nav-btn">
    <span>{{item.text}}</span>
    <img v-if="activeBtn==index" class="nav-svg-img" :src="svgs[index]" oncontextmenu="return false;"></img>
    <img v-else class="nav-svg-img" :src="'library-music-outline' | svgIcon(darkUi)" oncontextmenu="return false;"></img>
   </v-btn>
   <v-btn v-else-if="index==1" flat class="lms-bottom-nav-button" @click="npPressed" v-bind:class="{'active-nav': activeBtn==index, 'inactive-nav': activeBtn!=index}" id="browse-nav-btn">
    <span>{{item.text}}</span>
    <img v-if="activeBtn==index" class="nav-svg-img" :src="svgs[index]" oncontextmenu="return false;"></img>
    <img v-else class="nav-svg-img" :src="'music-note-outline' | svgIcon(darkUi)" oncontextmenu="return false;"></img>
   </v-btn>
   <v-btn v-else flat class="lms-bottom-nav-button" v-longpress:nomove="queuePressed" v-bind:class="{'active-nav': activeBtn==index, 'inactive-nav': activeBtn!=index}" id="browse-nav-btn">
    <span>{{item.text}}</span>
    <img v-if="activeBtn==index" class="nav-svg-img" :src="svgs[index]" oncontextmenu="return false;"></img>
    <img v-else class="nav-svg-img" :src="'queue_music_outline' | svgIcon(darkUi)" oncontextmenu="return false;"></img>
   </v-btn>
  </template>
 </v-bottom-nav>
</v-footer>
`,
    props: [],
    data() {
        return {
            items: [],
            svgs: [ getLocalStorageVal("nav-svg-0", undefined),
                    getLocalStorageVal("nav-svg-1", undefined),
                    getLocalStorageVal("nav-svg-2", undefined)]
        }
    },
    created() {
        bus.$on('langChanged', function() {
            this.initItems();
        }.bind(this));
        this.initItems();
        this.colorSvgs();
        bus.$on('themeChanged', function() {
            this.colorSvgs();
        }.bind(this));

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
    mounted() {
        this.colorSvgs();
    },
    methods: {
        initItems() {
            this.items = [
                          { text: i18n('Browse'),  page: 'browse' },
                          { text: i18n('Playing'), page: 'now-playing' },
                          { text: i18n('Queue'),   page: 'queue' },
                         ];
        },
        colorSvgs(count) {
            if (undefined==count) {
                count=0;
            }
            let activeColor = getComputedStyle(document.documentElement).getPropertyValue('--active-nav-btn-color');
            let inactiveColor = getComputedStyle(document.documentElement).getPropertyValue('--bottom-toolbar-text-color');

            if (getLocalStorageVal('theme', 'x').endsWith('-colored')) {
                activeColor = inactiveColor = getComputedStyle(document.documentElement).getPropertyValue('--light-text-color');
            }

            // Check if properties have been set yet, if not try again a bit later...
            if (""==activeColor || ""==inactiveColor) {
                if (undefined!=this.colorTimer) {
                    clearTimeout(this.colorTimer);
                }
                this.colorTimer = undefined;
                if (count<200) {
                    this.colorTimer = setTimeout(function () {
                        this.colorSvgs(count+1);
                    }.bind(this), 10);
                }
                return;
            }

            if (getLocalStorageVal('theme', 'x').endsWith('-colored')) {
                activeColor = inactiveColor;
            }
            for (let i=0; i<3; ++i) {
                let svg = NAV_SVGS[i].replace('%23000', '%23'+activeColor.replace('#', ''));
                if (svg!=this.svgs[i]) {
                    this.svgs[i] = svg;
                    setLocalStorageVal("nav-svg-"+i, this.svgs[i]);
                }
            }
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
        }
    },
    filters: {
        svgIcon: function (name, dark) {
            return "/material/svg/"+name+"?c="+(dark ? LMS_DARK_SVG : LMS_LIGHT_SVG)+"&r="+LMS_MATERIAL_REVISION;
        }
    }
})

