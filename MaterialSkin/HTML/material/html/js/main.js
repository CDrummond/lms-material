/**
 * LMS-Material
 *
 * Copyright (c) 2018-2019 Craig Drummond <craig.p.drummond@gmail.com>
 * MIT license.
 */

Vue.use(VueLazyload, {error:LMS_BLANK_COVER});

var app = new Vue({
    el: '#app',
    data() {
        return { dialogs: { uisettings: false, playersettings: false, info: false, sync: false, group: false,
                            volume: false, manage: false, rndmix: false, favorite: false, rating: false, 
                            sleep: false, search: false, movequeue:false } }
    },
    created() {
        parseQueryParams();
        this.$store.commit('initUiSettings');

        bus.$on('dlg.open', function(name, a, b, c) {
            this.dialogs[name] = true; // Mount
            this.$nextTick(function () {
                bus.$emit(name+".open", a, b, c);
            });
        }.bind(this));

        initApp(this);
        this.openDialogs = new Set();

        bus.$on('dialogOpen', function(name, open) {
            if (open) {
                this.openDialogs.add(name);
            } else {
                this.openDialogs.delete(name);
            }
        }.bind(this));
    },
    computed: {
        darkUi() {
            return this.$store.state.darkUi;
        },
        lang() {
            return this.$store.state.lang;
        },
        page() {
            return this.$store.state.page;
        }
    },
    methods: {
        swipe(ev, direction) {
            if (this.$store.state.visibleMenus.size>0) {
                return;
            }
            if (this.openDialogs.size>1 ||
                (this.openDialogs.size==1 && (this.$store.state.page=='now-playing' ||
                                              (!this.openDialogs.has('np-viewer') && !this.openDialogs.has('info-dialog'))))) {
                return;
            }
            if (this.$store.state.page=='now-playing') {
                // Ignore swipes on position slider...
                var elem = document.getElementById("pos-slider");
                if (elem) {
                    var rect = elem.getBoundingClientRect();
                    if ((rect.x-4)<=ev.touchstartX && (rect.x+rect.width+8)>=ev.touchstartX &&
                        (rect.y-4)<=ev.touchstartY && (rect.y+rect.height+8)>=ev.touchstartY) {
                        return;
                    }
                }
            }
            if (Math.abs(ev.touchstartX-ev.touchendX)<75) {
                return;
            }
            if ('l'==direction) {
                if (this.$store.state.page=='browse') {
                    this.$store.commit('setPage', 'now-playing');
                } else if (this.$store.state.page=='now-playing') {
                    this.$store.commit('setPage', 'queue');
                } else if (this.$store.state.page=='queue') {
                    this.$store.commit('setPage', 'browse');
                }
            } else if ('r'==direction) {
                if (this.$store.state.page=='browse') {
                    this.$store.commit('setPage', 'queue');
                } else if (this.$store.state.page=='now-playing') {
                    this.$store.commit('setPage', 'browse');
                } else if (this.$store.state.page=='queue') {
                    this.$store.commit('setPage', 'now-playing');
                }
            }
        }
    },
    store,
    lmsServer
})

