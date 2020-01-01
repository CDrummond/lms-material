/**
 * LMS-Material
 *
 * Copyright (c) 2018-2020 Craig Drummond <craig.p.drummond@gmail.com>
 * MIT license.
 */

Vue.use(VueLazyload, {error:LMS_BLANK_COVER});

var autoLayout = false;
function checkLayout() {
    if (autoLayout && !IS_MOBILE) { // auto-layout broken on iPad #109
        var changeTo=undefined;
        if (window.innerWidth<600 && window.location.href.indexOf("/desktop")>1) {
            changeTo = "mobile";
        } else if (window.innerWidth>=600 && /*(!IS_MOBILE || window.innerHeight>=600) &&*/ window.location.href.indexOf("/mobile")>1) {
            changeTo = "desktop";
        }
        if (undefined!=changeTo) {
            // Auto-changing view, so don't see default player!
            setLocalStorageVal("useLastPlayer", true);
            window.location.href = changeTo;
        }
    }
}

function setAutoLayout(al) {
    autoLayout = al;
    checkLayout();
}

function checkEntryFocus() {
    if (IS_MOBILE && (document.activeElement.tagName=="INPUT" || document.activeElement.tagName=="TEXTAREA")) {
        ensureVisible(document.activeElement);
    }
}

var app = new Vue({
    el: '#app',
    data() {
        return { dialogs: { uisettings: false, playersettings: false, info: false, sync: false, group: false, volume: false,
                            manage: false, rndmix: false, favorite: false, rating: false, sleep: false, search: false,
                            movequeue: false, podcastadd: false, podcastsearch: false, iteminfo: false, iframe: false,
                            dstm: false, savequeue: false } }
    },
    created() {
        if (window.location.href.indexOf("/desktop")>1) {
            this.splitterPercent = parseInt(getLocalStorageVal("splitter", "50"));
            this.splitter = this.splitterPercent;
            document.documentElement.style.setProperty('--splitter-pc', this.splitter);
        }
        parseQueryParams();
        this.$store.commit('initUiSettings');

        lmsUseLastPlayer = false;
        if (window.location.href.indexOf('/mini')>=0) {
            lmsUseLastPlayer = true;
        } else if (pageWasReloaded()) {
            lmsUseLastPlayer = true;
        } else {
            lmsUseLastPlayer = getLocalStorageBool('useLastPlayer', lmsUseLastPlayer);
            removeLocalStorage('useLastPlayer');
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

        lmsCommand("", ["pref", "language", "?"]).then(({data}) => {
            if (data && data.result && data.result._p2) {
                var lang = data.result._p2.toLowerCase();
                if (lang == 'en') {
                    lang = (window.navigator.userLanguage || window.navigator.language).toLowerCase();
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
                        axios.defaults.headers.common['Accept-Language'] = lang;
                        document.querySelector('html').setAttribute('lang', lang);
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

        if (window.location.href.indexOf('/mini')<0 && window.location.href.indexOf('/now-playing')<0 && window.location.href.indexOf('auto=false')<0 ) {
            setAutoLayout(getLocalStorageVal("layout", "auto") == "auto");
        }

        // Work-around 100vh behaviour in mobile chrome
        // See https://css-tricks.com/the-trick-to-viewport-units-on-mobile/
        let vh = window.innerHeight * 0.01;
        let lastWinHeight = window.innerHeight;
        let lastWinWidth = window.innerWidth;
        let timeout = undefined;
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
                    checkLayout();
                    bus.$emit('windowWidthChanged');
                }
                checkEntryFocus();
            }, 50);
        }, false);

        // https://stackoverflow.com/questions/43329654/android-back-button-on-a-progressive-web-thislication-closes-de-this
        window.addEventListener('load', function() {
            window.history.pushState({ noBackExitsApp: true }, '');
        }, false);

        window.addEventListener('popstate', function(event) {
            if (event.state && event.state.noBackExitsApp) {
                window.history.pushState({ noBackExitsApp: true }, '');
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

        bus.$on('dlg.open', function(name, a, b, c) {
            this.dialogs[name] = true; // Mount
            this.$nextTick(function () {
                bus.$emit(name+".open", a, b, c);
            });
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
        swipeLeft(ev) {
            this.swipe(ev, 'l');
        },
        swipeRight(ev) {
            this.swipe(ev, 'r');
        },
        swipe(ev, direction) {
            if (this.$store.state.visibleMenus.size>0) {
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
        },
        splitterResized(val) {
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
        }
    },
    components: {
        VueSplitter: window.location.href.indexOf("/desktop")>1 ? VueSplitter : undefined
    },
    store,
    lmsServer
})

