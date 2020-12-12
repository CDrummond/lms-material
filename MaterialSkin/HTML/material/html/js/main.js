/**
 * LMS-Material
 *
 * Copyright (c) 2018-2020 Craig Drummond <craig.p.drummond@gmail.com>
 * MIT license.
 */
'use strict';

Vue.use(VueLazyload, {error:LMS_BLANK_COVER});

// Disable ripple effect on buttons
const VBtn = Vue.component('VBtn')
VBtn.options.props.ripple.default = false;

var app = new Vue({
    el: '#app',
    data() {
        return { dialogs: { uisettings: false, playersettings: false, info: false, sync: false, group: false, volume: false,
                            manage: false, rndmix: false, favorite: false, rating: false, sleep: false, movequeue: false,
                            podcast: false, podcastsearch: false, iteminfo: false, iframe: false, dstm: false, savequeue: false,
                            icon: false, prompt:false, addtoplaylist: false, file: false } }
    },
    created() {
        this.autoLayout = true;
        this.splitterPercent = parseInt(getLocalStorageVal("splitter", "50"));
        this.splitter = this.splitterPercent;
        document.documentElement.style.setProperty('--splitter-pc', this.splitter);
        this.$store.commit('initUiSettings');
        this.$store.commit('setShowQueue', getLocalStorageBool('showQueue', true));
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
                    var browserLang = this.$store.state.lang.toLowerCase();
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
                    if (getLocalStorageVal("lang", "")!=(lang+"@"+LMS_MATERIAL_REVISION)) {
                        axios.get("html/lang/"+lang+".json?r=" + LMS_MATERIAL_REVISION).then(function (resp) {
                            var trans = eval(resp.data);
                            setLocalStorageVal('translation', JSON.stringify(trans));
                            setLocalStorageVal('lang', lang+"@"+LMS_MATERIAL_REVISION);
                            setTranslation(trans);
                            bus.$emit('langChanged');
                         }).catch(err => {
                            window.console.error(err);
                        });
                    }
                }
            }
        });

        var genres = splitString(getLocalStorageVal("composergenres", ""));
        if (genres.length>0) {
            LMS_COMPOSER_GENRES = new Set(genres);
        }
        genres = splitString(getLocalStorageVal("conductorgenres", ""));
        if (genres.length>0) {
            LMS_CONDUCTOR_GENRES = new Set(genres);
        }
        genres = splitString(getLocalStorageVal("bandgenres", ""));
        if (genres.length>0) {
            LMS_BAND_GENRES = new Set(genres);
        }
        lmsCommand("", ["pref", "plugin.material-skin:composergenres", "?"]).then(({data}) => {
            if (data && data.result && data.result._p2 != null) {
                var genres = splitString(data.result._p2.split("\r").join("").split("\n").join(","));
                if (genres.length>0) {
                    LMS_COMPOSER_GENRES = new Set(genres);
                    logJsonMessage("COMPOSER_GENRES", genres);
                    setLocalStorageVal("composergenres", data.result._p2);
                }
            }
        });
        lmsCommand("", ["pref", "plugin.material-skin:conductorgenres", "?"]).then(({data}) => {
            if (data && data.result && data.result._p2 != null) {
                var genres = splitString(data.result._p2.split("\r").join("").split("\n").join(","));
                if (genres.length>0) {
                    LMS_CONDUCTOR_GENRES = new Set(genres);
                    logJsonMessage("CONDUCTOR_GENRES", genres);
                    setLocalStorageVal("conductorgenres", data.result._p2);
                }
            }
        });
        lmsCommand("", ["pref", "plugin.material-skin:bandgenres", "?"]).then(({data}) => {
            if (data && data.result && data.result._p2 != null) {
                var genres = splitString(data.result._p2.split("\r").join("").split("\n").join(","));
                if (genres.length>0) {
                    LMS_BAND_GENRES = new Set(genres);
                    logJsonMessage("BAND_GENRES", genres);
                    setLocalStorageVal("bandgenres", data.result._p2);
                }
            }
        });

        // Work-around 100vh behaviour in mobile chrome
        // See https://css-tricks.com/the-trick-to-viewport-units-on-mobile/
        let vh = window.innerHeight * 0.01;
        let lastWinHeight = window.innerHeight;
        let LastReportedHeight = lastWinHeight;
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
                if (Math.abs(LastReportedHeight-window.innerHeight)>=3) {
                    LastReportedHeight = window.innerHeight;
                    bus.$emit('windowHeightChanged');
                }

                // Check entries are visible
                if (IS_MOBILE && (document.activeElement.tagName=="INPUT" || document.activeElement.tagName=="TEXTAREA")) {
                    let elem = document.activeElement;
                    let found = false;
                    let makeVisible = true;
                    for (let i=0; i<10 && !found && elem; ++i) {
                        if (elem.classList.contains("lms-list-item")) {
                            found = true;
                        } else if (elem.classList.contains("subtoolbar")) {
                            // No need to scroll an input field in subtoolbar into view - see #342
                            found = true;
                            makeVisible = false;
                        } else {
                            elem = elem.parentElement;
                        }
                    }
                    if (makeVisible) {
                        ensureVisible(found ? elem : document.activeElement);
                    }
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

        if (document.addEventListener) {
            document.addEventListener('click', this.clickListener);
        } else if (document.attachEvent) {
            document.attachEvent('onclick', this.clickListener);
        }

        bindKey('backspace');
        bus.$on('keyboard', function(key, modifier) {
            if (!modifier && 'backspace'==key) {
                bus.$emit('esc');
            }
        }.bind(this));

        bus.$on('dialogOpen', function(name, val) {
            this.$store.commit('dialogOpen', {name:name, shown:val});
        }.bind(this));

        bus.$on('dlg.open', function(name, a, b, c, d, e, f, g, h) {
            if (typeof DEFERRED_LOADED != 'undefined') {
                this.dialogs[name] = true; // Mount
                this.$nextTick(function () {
                    bus.$emit(name+".open", a, b, c, d, e, f, g, h);
                });
            } else {
                console.warn("Ignoring dialog request, as deferred JS files not yet loaded");
            }
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

        bus.$on('setSplitter', function(pc) {
            this.splitterPercent = pc;
            this.splitter = this.splitterPercent;
            document.documentElement.style.setProperty('--splitter-pc', this.splitter);
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
        },
        showQueue() {
            return this.$store.state.showQueue
        }
    },
    methods: {
        touchStart(ev) {
            this.touch = getTouchPos(ev);
            this.touchValid=false;
        },
        touchEnd(ev) {
            if (undefined!=this.touch) {
                let end = getTouchPos(ev);
                this.touchValid = Math.abs(this.touch.x-end.x)>75 && Math.abs(this.touch.y-end.y)<50;
                if (this.touchValid && this.$store.state.page=='now-playing') {
                    // Ignore swipes on position slider...
                    var elem = document.getElementById("pos-slider");
                    if (elem) {
                        var rect = elem.getBoundingClientRect();
                        if ((rect.x-16)<=this.touch.x && (rect.x+rect.width+16)>=this.touch.x &&
                            (rect.y-32)<=this.touch.y && (rect.y+rect.height+32)>=this.touch.y) {
                            this.touchValid = false;
                        }
                    }
                }
                this.touch = undefined;
            }
        },
        swipe(direction, ev) {
            if (!this.touchValid || this.$store.state.visibleMenus.size>0 || this.$store.state.desktopLayout) {
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
            if (!this.$store.state.desktopLayout || !this.$store.state.showQueue) {
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
        },
        clickListener(event) {
            if (this.$store.state.visibleMenus.size>0) {
                return;
            }
            if (this.$store.state.openDialogs.length>1) {
                return;
            }
            let page = undefined;
            if (this.$store.state.desktopLayout) {
                page = this.$store.state.openDialogs.length==0 ? 'browse' : (this.$store.state.openDialogs[0]=='info-dialog' ? 'now-playing' : undefined);
            } else {
                page = this.$store.state.page=='now-playing'
                            ? this.$store.state.openDialogs.length==1 && 'info-dialog'==this.$store.state.openDialogs[0] ? this.$store.state.page : undefined
                            : this.$store.state.page=='browse' ? this.$store.state.page : undefined;
            }

            if (undefined!=page) {
                let target = event.target || event.srcElement;
                if (target.tagName === 'A') {
                    let href = target.getAttribute('href');
                    if (undefined!=href && null!=href && href.length>10) { // 10 = http://123
                        let text = target.text;
                        if (undefined==text || text.length<1) {
                            text = target.textContent;
                        }
                        if (undefined!=text && text.length>0) {
                            let menu = [{title:ACTIONS[FOLLOW_LINK_ACTION].title, icon:ACTIONS[FOLLOW_LINK_ACTION].icon, act:FOLLOW_LINK_ACTION, link:href},
                                        {title:ACTIONS[SEARCH_TEXT_ACTION].title+SEPARATOR+text, icon:ACTIONS[SEARCH_TEXT_ACTION].icon, act:SEARCH_TEXT_ACTION, text:text}]
                            bus.$emit('showLinkMenu.'+page, event.clientX, event.clientY, menu);
                            event.preventDefault();
                        }
                    }
                }
            }
        }
    },
    components: {
        VueSplitter: VueSplitter
    },
    store,
    lmsServer
})

