/**
 * LMS-Material
 *
 * Copyright (c) 2018-2022 Craig Drummond <craig.p.drummond@gmail.com>
 * MIT license.
 */
'use strict';

const LIBRARY_SVG = "data:image/svg+xml,%3Csvg width='24' height='24' version='1.1' viewBox='0 0 24 24' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M20,2H8A2,2 0 0,0 6,4V16A2,2 0 0,0 8,18H20A2,2 0 0,0 22,16V4A2,2 0 0,0 20,2M20,16H8V4H20M12.5,15A2.5,2.5 0 0,0 15,12.5V7H18V5H14V10.5C13.58,10.19 13.07,10 12.5,10A2.5,2.5 0 0,0 10,12.5A2.5,2.5 0 0,0 12.5,15M4,6H2V20A2,2 0 0,0 4,22H18V20H4' fill='%23000'/%3E%3C/svg%3E%0A";

Vue.component('lms-bottomnav', {
    template: `
<v-footer class="lms-footer" id="nav-bar">
 <v-bottom-nav class="lms-bottom-nav" :active="activeBtn">
  <template v-for="(item, index) in items">
   <v-btn v-if="index==0" flat class="lms-bottom-nav-button" v-longpress:nomove="browsePressed" v-bind:class="{'active-nav': activeBtn==index, 'inactive-nav': activeBtn!=index}" id="browse-nav-btn">
    <span>{{item.text}}</span>
    <img class="nav-svg-img" :src="activeBtn==index ? libraryActiveSvg : libraryInactiveSvg" oncontextmenu="return false;"></img>
   </v-btn>
   <v-btn v-else-if="index==1" flat class="lms-bottom-nav-button" @click="npPressed" v-bind:class="{'active-nav': activeBtn==index, 'inactive-nav': activeBtn!=index}" id="browse-nav-btn">
    <span>{{item.text}}</span>
    <v-icon>{{item.icon}}</v-icon>
   </v-btn>
   <v-btn v-else flat class="lms-bottom-nav-button" v-longpress:nomove="queuePressed" v-bind:class="{'active-nav': activeBtn==index, 'inactive-nav': activeBtn!=index}" id="browse-nav-btn">
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
            libraryActiveSvg: getLocalStorageVal("lib-active-svg", undefined),
            libraryInactiveSvg: getLocalStorageVal("lib-inactive-svg", undefined)
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
                          { text: i18n('Browse'),  svg:  'library-music-outline', page: 'browse' },
                          { text: i18n('Playing'), icon: 'music_note',            page: 'now-playing' },
                          { text: i18n('Queue'),   icon: 'queue_music',           page: 'queue' },
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
            let libraryActiveSvg = LIBRARY_SVG.replace('%23000', '%23'+activeColor.replace('#', ''));
            let libraryInactiveSvg = LIBRARY_SVG.replace('%23000', '%23'+inactiveColor.replace('#', ''))

            if (libraryActiveSvg!=this.libraryActiveSvg) {
                this.libraryActiveSvg = libraryActiveSvg;
                setLocalStorageVal("lib-active-svg", this.libraryActiveSvg);
            }
            if (libraryInactiveSvg!=this.libraryInactiveSvg) {
                this.libraryInactiveSvg = libraryInactiveSvg;
                setLocalStorageVal("lib-inactive-svg", this.libraryInactiveSvg);
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

