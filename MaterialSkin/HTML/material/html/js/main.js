/**
 * LMS-Material
 *
 * Copyright (c) 2018-2023 Craig Drummond <craig.p.drummond@gmail.com>
 * MIT license.
 */
'use strict';

Vue.use(VueLazyload, {error:DEFAULT_COVER});

var app = new Vue({
    el: '#app',
    data() {
        return { dialogs: { uisettings: false, playersettings: false, info: false, sync: false, group: false, volume: false,
                            manage: false, rndmix: false, favorite: false, rating: false, sleep: false,
                            iteminfo: false, iframe: false, dstm: false, savequeue: false, icon: false, prompt:false,
                            addtoplaylist: false, file: false, groupvolume: false, advancedsearch: false, downloadstatus:false,
                            gallery: false, choice: false, playersettingsplugin: false
                          },
                 loaded: false }
    },
    created() {
        if (IS_MOBILE) {
            // Disable hover effects for buttons in mobile, as these can get 'stuck'. This /should/ be automatic, but
            // is failing. Placing in "@media (hover: none)" did not seem to work. So, apply here for just mobile...
            var s = document.createElement("style");
            s.innerHTML = ".v-btn:hover:before {background-color:transparent!important;}" +
                          ".lms-list .v-list__tile--link:hover,.dialog-main-list .v-list__tile--link:hover {background:transparent!important};";
            document.getElementsByTagName("head")[0].appendChild(s);
            document.getElementsByTagName("body")[0].classList.add("msk-is-touch");
        } else {
            document.getElementsByTagName("body")[0].classList.add("msk-is-non-touch");
        }
        if (queryParams.addpad || (IS_IOS && (window.matchMedia('(display-mode: standalone)').matches || window.matchMedia('(display-mode: fullscreen)').matches))) {
            document.documentElement.style.setProperty('--bottom-nav-pad', '12px');
        }
        this.autoLayout = true;
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

        initIconMap();
        initEmblems();
        initCustomActions();
        initTrackSources();

        // Ensure LMS's lang is <lowercase>[-<uppercase>]
        var lang = ""+LMS_LANG;
        let parts = lang.split('_'); // lms uses (e.g.) en_gb, want en-GB
        if (parts.length>1) {
            lang = parts[0].toLowerCase()+'-'+parts[1].toUpperCase();
        } else {
            lang = lang.toLowerCase();
        }

        if (lang == '?') {
            lang = 'en';
        }
        if (lang == 'en') {
            // LMS is set to 'en'. Check if browser is (e.g.) 'en-gb', and if so use that as the
            // language for Material. We only consider 'en*' here - so that LMS 'en' is not mixed
            // with browser (e.g.) 'de'
            var browserLang = window.navigator.userLanguage || window.navigator.language;
            if (undefined!=browserLang) {
                let parts = browserLang.split('-');
                if (parts.length>1) {
                    browserLang = parts[0].toLowerCase()+'-'+parts[1].toUpperCase();
                } else {
                    browserLang = browserLang.toLowerCase();
                }
                if (browserLang.startsWith('en')) {
                    lang = browserLang;
                }
            }
        }

        this.$store.commit('setLang', lang);
        if (lang == 'en' || lang == 'en-US') {
            // All strings are en-US by default, so remove any previous translation
            // from storage.
            if (storedTrans!=undefined) {
                removeLocalStorage('translation');
                removeLocalStorage('lang');
                setTranslation(undefined);
                bus.$emit('langChanged');
                lmsOptions.lang = undefined;
            }
        } else {
            lmsOptions.lang = lang;

            // Get translation files - these are all lowercase
            let lowerLang = lang.toLowerCase();
            if (!LMS_SKIN_LANGUAGES.has(lowerLang)) {
                let mainLang = lowerLang.substr(0, 2);
                if (LMS_SKIN_LANGUAGES.has(mainLang)) {
                    lowerLang = mainLang;
                }
            }
            if (getLocalStorageVal("lang", "")!=(lowerLang+"@"+LMS_MATERIAL_REVISION)) {
                axios.get("html/lang/"+lowerLang+".json?r=" + LMS_MATERIAL_REVISION).then(function (resp) {
                    var trans = eval(resp.data);
                    setLocalStorageVal('translation', JSON.stringify(trans));
                    setLocalStorageVal('lang', lowerLang+"@"+LMS_MATERIAL_REVISION);
                    setTranslation(trans);
                    bus.$emit('langChanged');
                }).catch(err => {
                    window.console.error(err);
                });
            }
        }

        lmsOptions.conductorGenres = new Set(["Classical", "Avant-Garde", "Baroque", "Chamber Music", "Chant", "Choral", "Classical Crossover",
                                              "Early Music", "High Classical", "Impressionist", "Medieval", "Minimalism","Modern Composition",
                                              "Opera", "Orchestral", "Renaissance", "Romantic", "Symphony", "Wedding Music"]);
        lmsOptions.composerGenres = new Set([...new Set(["Jazz"]), ...lmsOptions.conductorGenres]);

        if (lmsOptions.allowDownload && queryParams.download!='browser' && queryParams.download!='native') {
            lmsOptions.allowDownload = false;
        }
        lmsCommand("", ["material-skin", "prefs"]).then(({data}) => {
            if (data && data.result) {
                for (var t=0, len=SKIN_GENRE_TAGS.length; t<len; ++t ) {
                    if (data.result[SKIN_GENRE_TAGS[t]+'genres']) {
                        var genres = splitString(data.result[SKIN_GENRE_TAGS[t]+'genres'].split("\r").join("").split("\n").join(","));
                        if (genres.length>0) {
                            lmsOptions[SKIN_GENRE_TAGS[t]+'Genres'] = new Set(genres);
                            logJsonMessage(SKIN_GENRE_TAGS[t].toUpperCase()+"_GENRES", genres);
                            setLocalStorageVal(SKIN_GENRE_TAGS[t]+"genres", data.result[SKIN_GENRE_TAGS[t]+'genres']);
                        }
                    }
                }
                for (var i=0, len=SKIN_BOOL_OPTS.length; i<len; ++i) {
                    if (undefined!=data.result[SKIN_BOOL_OPTS[i]]) {
                        lmsOptions[SKIN_BOOL_OPTS[i]] = 1 == parseInt(data.result[SKIN_BOOL_OPTS[i]]);
                        setLocalStorageVal(SKIN_BOOL_OPTS[i], lmsOptions[SKIN_BOOL_OPTS[i]]);
                    }
                }
                for (var i=0, len=SKIN_INT_OPTS.length; i<len; ++i) {
                    if (undefined!=data.result[SKIN_INT_OPTS[i]]) {
                        lmsOptions[SKIN_INT_OPTS[i]] = parseInt(data.result[SKIN_INT_OPTS[i]]);
                        setLocalStorageVal(SKIN_INT_OPTS[i], lmsOptions[SKIN_INT_OPTS[i]]);
                    }
                }
                if (lmsOptions.allowDownload && queryParams.download!='browser' && queryParams.download!='native') {
                    lmsOptions.allowDownload = false;
                    setLocalStorageVal('allowDownload', false);
                }
                if (undefined!=data.result['releaseTypeOrder']) {
                    let arr = splitString(data.result['releaseTypeOrder'].split("\r").join("").split("\n").join(","));
                    lmsOptions.releaseTypeOrder = arr.length>0 ? arr : undefined;
                }
            }
        });

        setTimeout(function () {
            this.loaded = true;
        }.bind(this), 500);

        // Work-around 100vh behaviour in mobile chrome
        // See https://css-tricks.com/the-trick-to-viewport-units-on-mobile/
        let vh = window.innerHeight * 0.01;
        let lastWinHeight = window.innerHeight;
        let lastReportedHeight = lastWinHeight;
        let lastWinWidth = window.innerWidth;
        let timeout = undefined;
        let lmsApp = this;
        this.bottomBar = {height: undefined, shown:true, desktop:this.$store.state.desktopLayout};
        document.documentElement.style.setProperty('--vh', `${vh}px`);
        window.addEventListener('resize', () => {
            if (timeout) {
                clearTimeout(timeout);
            }
            timeout = setTimeout(function () {
                let heightChange = 0;
                let widthChange = 0;
                // Only update if changed
                if (Math.abs(lastWinHeight-window.innerHeight)!=0) {
                    let vh = window.innerHeight * 0.01;
                    document.documentElement.style.setProperty('--vh', `${vh}px`);
                    heightChange = lastWinHeight - window.innerHeight;
                    lastWinHeight = window.innerHeight;
                }
                timeout = undefined;
                if (Math.abs(lastWinWidth-window.innerWidth)>=3) {
                    widthChange = lastWinWidth - window.innerWidth;
                    lastWinWidth = window.innerWidth;
                    lmsApp.checkLayout();
                    bus.$emit('windowWidthChanged');
                }
                if (Math.abs(lastReportedHeight-window.innerHeight)>=3) {
                    lastReportedHeight = window.innerHeight;
                    bus.$emit('windowHeightChanged');
                }

                // Check entries are visible
                if (IS_MOBILE) {
                    if (undefined==lmsApp.bottomBar.height || lmsApp.desktop!=lmsApp.$store.state.desktopLayout) {
                        lmsApp.bottomBar.height = getComputedStyle(document.documentElement).getPropertyValue('--bottom-toolbar-height');
                        lmsApp.desktop=lmsApp.$store.state.desktopLayout;
                    }
                    var keyboardShown = 0==widthChange && heightChange>100;
                    if (keyboardShown == lmsApp.bottomBar.shown) {
                        var elem = document.getElementById('np-bar');
                        if (!elem) {
                            elem = document.getElementById('nav-bar');
                        }
                        if (elem) {
                            elem.style.display = keyboardShown ? 'none' : 'block';
                            document.documentElement.style.setProperty('--bottom-toolbar-height', keyboardShown ? '0px' : lmsApp.bottomBar.height);
                            lmsApp.bottomBar.shown = !keyboardShown;
                        }
                    }
                    if (document.activeElement.tagName=="INPUT" || document.activeElement.tagName=="TEXTAREA") {
                        let elem = document.activeElement;
                        let found = false;
                        let foundListItem = false;
                        let makeVisible = true;
                        for (let i=0; i<10 && !found && elem; ++i) {
                            if (elem.classList.contains("lms-list-item")) {
                                found = foundListItem = true;
                            } else if (elem.classList.contains("subtoolbar")) {
                                // No need to scroll an input field in subtoolbar into view - see #342
                                found = true;
                                makeVisible = false;
                            } else {
                                elem = elem.parentElement;
                            }
                        }
                        if (makeVisible) {
                            window.requestAnimationFrame(function () {
                                if (lmsApp.$store.state.desktopLayout && foundListItem) {
                                    if (isVisible(elem)) {
                                        return;
                                    }
                                    let list = elem.parentElement;
                                    while (undefined!=list) {
                                        if (list.classList.contains("lms-list")) {
                                            list.scrollTop = elem.offsetTop - list.offsetTop;
                                            return;
                                        } else {
                                            list = list.parentElement;
                                        }
                                    }
                                }
                                ensureVisible(found ? elem : document.activeElement);
                            });
                        }
                    }
                }
            }, 50);
        }, false);

        // https://stackoverflow.com/questions/43329654/android-back-button-on-a-progressive-web-thislication-closes-de-this
        window.addEventListener('load', function() {
            window.history.pushState({ }, '');
        }, false);
        window.addEventListener('popstate', function(event) {
            window.history.pushState({ }, '');
            bus.$emit('esc');
            event.preventDefault();
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

        try {
            window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', () => {
                if (this.$store.state.chosenTheme.startsWith(AUTO_THEME)) {
                    this.$store.commit('toggleDarkLight');
                }
            }, false);
        } catch (e) {
            // Old WebKit on iOS?
        }

        bindKey('backspace');
        bus.$on('keyboard', function(key, modifier) {
            if (!modifier && 'backspace'==key) {
                bus.$emit('esc');
            }
        }.bind(this));
        bus.$on('esc', function() {
            this.handleEsc();
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
        bus.$store = this.$store;

        bus.$on('setPlayer', function(id) {
            this.$store.commit('setPlayer', id);
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
        mobileBar() {
            return this.$store.state.mobileBar
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
                this.touchValid = Math.abs(this.touch.x-end.x)>30 && Math.abs(this.touch.y-end.y)<50;
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
            if (!this.touchValid || this.$store.state.visibleMenus.size>0) {
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
            if (this.$store.state.swipeChangeTrack && undefined!=ev.target && ev.target.className.startsWith('np-cover')) {
                if (queryParams.party) {
                    return;
                }
                if ('left'==direction) {
                    bus.$emit('playerCommand', ['playlist', 'index', '+1']);
                } else {
                    bus.$emit('playerCommand', ['button', 'jump_rew']);
                }
                return;
            }
            if (this.$store.state.desktopLayout) {
                if (!this.$store.state.pinQueue) {
                    this.$store.commit('setShowQueue', 'left'==direction);
                }
            } else {
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
                    let follow = target.getAttribute('follow');
                    if (undefined!=href && null!=href && href.length>10) { // 10 = http://123
                        if (undefined!=follow) {
                            openWindow(href);
                            event.preventDefault();
                            return;
                        }
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
        },
        handleEsc() {
            // Can receive 'esc' 120ish milliseconds after dialog was closed with 'esc' - so filter out
            if (undefined!=this.$store.state.lastDialogClose && (new Date().getTime()-this.$store.state.lastDialogClose)<=250) {
                return;
            }
            if (this.$store.state.visibleMenus.size>0) {
                bus.$emit('closeMenu');
                return;
            }
            // Hide queue if visible, unpinned, and no current dialog or current dialog is info-dialog
            if (this.$store.state.desktopLayout && !this.$store.state.pinQueue && this.$store.state.showQueue &&
                (undefined==this.$store.state.activeDialog || 'info-dialog'==this.$store.state.activeDialog)) {
                this.$store.commit('setShowQueue', false);
                return;
            }
            if (undefined!=this.$store.state.activeDialog) {
                bus.$emit('closeDialog', this.$store.state.activeDialog);
                return;
            }
            bus.$emit('escPressed');
        }
    },
    store,
    lmsServer
})

