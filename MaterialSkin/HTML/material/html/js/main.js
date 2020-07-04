/**
 * LMS-Material
 *
 * Copyright (c) 2018-2020 Craig Drummond <craig.p.drummond@gmail.com>
 * MIT license.
 */
'use strict';

Vue.use(VueLazyload, {error:LMS_BLANK_COVER});

function getTouchPos(ev) {
    if (undefined==ev) {
        return undefined;
    }
    if (undefined==ev.touches || ev.touches.length<1) {
        if (undefined!=ev.changedTouches && ev.changedTouches.length>0) {
            return {x:ev.changedTouches[0].clientX, y:ev.changedTouches[0].clientY};
        }
        return undefined;
    }
    return {x:ev.touches[0].clientX, y:ev.touches[0].clientY};
}

var app = new Vue({
    el: '#app',
    data() {
        return { dialogs: { uisettings: false, playersettings: false, info: false, sync: false, group: false, volume: false,
                            manage: false, rndmix: false, favorite: false, rating: false, sleep: false, search: false,
                            movequeue: false, podcastadd: false, podcastsearch: false, iteminfo: false, iframe: false,
                            dstm: false, savequeue: false, icon: false, confirm:false } }
    },
    created() {
        this.autoLayout = true;
        this.splitterPercent = parseInt(getLocalStorageVal("splitter", "50"));
        this.splitter = this.splitterPercent;
        document.documentElement.style.setProperty('--splitter-pc', this.splitter);
        this.$store.commit('initUiSettings');

        if (queryParams.player) {
            document.title += SEPARATOR + unescape(queryParams.player);
        }

        let chosenLayout = undefined;
        if (undefined!=queryParams.layout) {
            chosenLayout = queryParams.layout;
        } else {
            chosenLayout = getLocalStorageVal("layout", undefined);
        }

        if (chosenLayout=='desktop') {
            this.setLayout(true);
        } else if (chosenLayout=='mobile') {
            this.setLayout(false);
        } else {
            this.setLayout();
        }

        var storedTrans = getLocalStorageVal('translation', undefined);
        if (storedTrans!=undefined) {
            setTranslation(JSON.parse(storedTrans));
        }

        if (IS_MOBILE) {
            try { // Fails on mobile Firefox - "addRule is not a function"
                document.styleSheets[0].addRule("::-webkit-scrollbar", "max-height: 0px !important; max-width: 0px !important;");
            } catch(e) {
            }
        }

        initIconMap();
        initEmblems();
        initCustomActions();
        lmsCommand("", ["pref", "language", "?"]).then(({data}) => {
            if (data && data.result && data.result._p2) {
                var lang = data.result._p2.toLowerCase();

                // Set page to LMS's language
                axios.defaults.headers.common['Accept-Language'] = lang;
                document.querySelector('html').setAttribute('lang', lang);
                if (lang == 'en') {
                    // LMS is set to 'en'. Check if browser is (e.g.) 'en-gb', and if so use that as the
                    // language for Material. We only consider 'en*' here - so that LMS 'en' is not mixed
                    // with browser (e.g.) 'de'
                    var browserLang = (window.navigator.userLanguage || window.navigator.language).toLowerCase();
                    if (browserLang.startsWith('en')) {
                        lang = browserLang;
                    }
                }
                if (lang == 'en' || lang == 'en-us') {
                    if (storedTrans!=undefined) {
                        removeLocalStorage('translation');
                        setTranslation(undefined);
                        bus.$emit('langChanged');
                    }
                } else {
                    if (!LMS_SKIN_LANGUAGES.has(lang)) {
                        lang = lang.substr(0, 2);
                    }
                    axios.get("html/lang/"+lang+".json?r=" + LMS_MATERIAL_REVISION).then(function (resp) {
                        var trans = eval(resp.data);
                        setLocalStorageVal('translation', JSON.stringify(trans));
                        setTranslation(trans);
                        bus.$emit('langChanged');
                     }).catch(err => {
                        window.console.error(err);
                    });
                }
            }
        });

        lmsCommand("", ["pref", "plugin.material-skin:composergenres", "?"]).then(({data}) => {
            if (data && data.result && data.result._p2 != null) {
                var genres = splitString(data.result._p2.split("\r").join("").split("\n").join(","));
                if (genres.length>0) {
                    LMS_COMPOSER_GENRES = new Set(genres);
                    logJsonMessage("COMPOSER_GENRES", genres);
                }
            }
        });
        lmsCommand("", ["pref", "plugin.material-skin:conductorgenres", "?"]).then(({data}) => {
            if (data && data.result && data.result._p2 != null) {
                var genres = splitString(data.result._p2.split("\r").join("").split("\n").join(","));
                if (genres.length>0) {
                    LMS_CONDUCTOR_GENRES = new Set(genres);
                    logJsonMessage("CONDUCTOR_GENRES", genres);
                }
            }
        });

        // Work-around 100vh behaviour in mobile chrome
        // See https://css-tricks.com/the-trick-to-viewport-units-on-mobile/
        let vh = window.innerHeight * 0.01;
        let lastWinHeight = window.innerHeight;
        let lastWinWidth = window.innerWidth;
        let timeout = undefined;
        let lmsApp = this;
        document.documentElement.style.setProperty('--vh', `${vh}px`);
        window.addEventListener('resize', () => {
            if (timeout) {
                clearTimeout(timeout);
            }
            timeout = setTimeout(function () {
                // Only update if changed
                if (Math.abs(lastWinHeight-window.innerHeight)!=0) {
                    let vh = window.innerHeight * 0.01;
                    document.documentElement.style.setProperty('--vh', `${vh}px`);
                    lastWinHeight = window.innerHeight;
                }
                timeout = undefined;
                if (Math.abs(lastWinWidth-window.innerWidth)>=3) {
                    lastWinWidth = window.innerWidth;
                    lmsApp.checkLayout();
                    bus.$emit('windowWidthChanged');
                }

                // Check entries are visible
                if (IS_MOBILE && (document.activeElement.tagName=="INPUT" || document.activeElement.tagName=="TEXTAREA")) {
                    ensureVisible(document.activeElement);
                }
            }, 50);
        }, false);

        // https://stackoverflow.com/questions/43329654/android-back-button-on-a-progressive-web-thislication-closes-de-this
        window.addEventListener('load', function() {
            window.history.pushState({ noBackExitsApp: true }, '');
        }, false);

        window.addEventListener('popstate', function(event) {
            if (event.state && event.state.noBackExitsApp) {
                window.history.pushState({ noBackExitsApp: true }, '');
                bus.$emit('esc');
            }
        }, false);

        // https://github.com/timruffles/mobile-drag-drop/issues/77
        window.addEventListener( 'touchmove', function() {});

        window.addEventListener('keyup', function(event) {
            if (event.keyCode === 27) {
                bus.$emit('esc');
            }
        });

        bus.$on('dialogOpen', function(name, val) {
            this.$store.commit('dialogOpen', {name:name, shown:val});
        }.bind(this));

        bus.$on('dlg.open', function(name, a, b, c, d) {
            this.dialogs[name] = true; // Mount
            this.$nextTick(function () {
                bus.$emit(name+".open", a, b, c, d);
            });
        }.bind(this));
        if (queryParams.actions.length>0) {
            this.$nextTick(function () {
                this.doQueryActions(false);
            });
            bus.$on('playerListChanged', function () {
                this.doQueryActions(true);
            }.bind(this));
        }

        bus.$on('changeLayout', function(layout) {
            this.setLayout(layout);
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
        },
        desktopLayout() {
            return this.$store.state.desktopLayout
        }
    },
    methods: {
        touchStart(ev) {
            this.touch=getTouchPos(ev);
            this.touchValid=false;
        },
        touchEnd(ev) {
            if (undefined!=this.touch) {
                let end=getTouchPos(ev);
                this.touchValid=Math.abs(this.touch.x-end.x)>75 && Math.abs(this.touch.y-end.y)<50;
                this.touch=undefined;
            }
        },
        swipe(direction, ev) {
            if (!this.touchValid || this.$store.state.visibleMenus.size>0 || this.$store.state.desktopLayout) {
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
            if (this.$store.state.openDialogs.length>0) {
                if (this.$store.state.openDialogs.length==1) {
                    // Info dialog is open. If not on now-playing, can still swipe to change main nav.
                    // ...if in now-playing, then use to change info tab.
                    if ('info-dialog'==this.$store.state.openDialogs[0]) {
                        if (this.$store.state.page=='now-playing') {
                            bus.$emit('info-swipe', direction);
                            return;
                        }
                    } else {
                        return;
                    }
                } else {
                    return;
                }
            }
            if ('left'==direction) {
                if (this.$store.state.page=='browse') {
                    this.$store.commit('setPage', 'now-playing');
                } else if (this.$store.state.page=='now-playing') {
                    this.$store.commit('setPage', 'queue');
                } else if (this.$store.state.page=='queue') {
                    this.$store.commit('setPage', 'browse');
                }
            } else if ('right'==direction) {
                if (this.$store.state.page=='browse') {
                    this.$store.commit('setPage', 'queue');
                } else if (this.$store.state.page=='now-playing') {
                    this.$store.commit('setPage', 'browse');
                } else if (this.$store.state.page=='queue') {
                    this.$store.commit('setPage', 'now-playing');
                }
            }
        },
        splitterResized(val) {
            if (!this.$store.state.desktopLayout) {
                return;
            }
            var f = Math.floor(val/2)*2;
            if (f!=this.splitter) {
                setLocalStorageVal("splitter", f);
                document.documentElement.style.setProperty('--splitter-pc', f);
                this.splitter=f;
                if (!this.splitterChangedAnimationFrameReq) {
                    this.scrollAnimationFrameReq = window.requestAnimationFrame(() => {
                        bus.$emit('splitterChanged');
                        this.scrollAnimationFrameReq = undefined;
                    });
                }
            }
        },
        doQueryActions(actOnPlayers) {
            for (var i=0; i<queryParams.actions.length; ) {
                if ( (actOnPlayers && queryParams.actions[i].startsWith("dlg.")) || (!actOnPlayers && !queryParams.actions[i].startsWith("dlg."))) {
                    var act = queryParams.actions[i];
                    var parts = act.split('/');
                    var params = [];
                    if (parts.length>1) {
                        params = parts[1].split(',');
                    }
                    if (parts.length>2) { // Check required player exists
                        var playerId = parts[2];
                        var found = false;
                        for (var j=0, len=this.$store.state.players.length; j<len && !found; ++j) {
                            if (this.$store.state.players[j].id == playerId || this.$store.state.players[j].name == playerId) {
                                found = true;
                            }
                        }
                        if (!found) {
                            i++;
                            continue;
                        }
                    }

                    bus.$emit(parts[0], params.length>0 ? params[0] : undefined, params.length>1 ? params[1] : undefined, params.length>2 ? params[2] : undefined);
                    queryParams.actions.splice(i, 1);
                } else {
                    i++;
                }
            }
        },
        checkLayout() {
            if (this.autoLayout &&
                 ( (window.innerWidth<LMS_MIN_DESKTOP_WIDTH && this.$store.state.desktopLayout && window.innerHeight>180 /*Don't swap to mobile if mini*/) ||
                     (window.innerWidth>=LMS_MIN_DESKTOP_WIDTH && !this.$store.state.desktopLayout)) ) {
                this.setLayout();
            }
        },
        setLayout(forceDesktop) {
            this.autoLayout = undefined==forceDesktop;
            this.$store.commit('setDesktopLayout', undefined==forceDesktop ? window.innerWidth>=LMS_MIN_DESKTOP_WIDTH : forceDesktop);
        }
    },
    components: {
        VueSplitter: VueSplitter
    },
    store,
    lmsServer
})

