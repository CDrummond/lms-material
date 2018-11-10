/**
 * LMS-Material
 *
 * Copyright (c) 2018 Craig Drummond <craig.p.drummond@gmail.com>
 * MIT license.
 */
 
const routes = [
    {
      path: '/',
      redirect: getLocalStorageVal('path', '/browse')
    },
    {
        path: '/browse',
        component: lmsBrowse
    },
    {
        path: '/nowplaying',
        component: lmsNowPlaying
    },
    {
        path: '/queue',
        component: lmsQueue
    }
]

let router = new VueRouter({
    routes // short for `routes: routes`
})

router.beforeEach((to, from, next) => {
    // Inform that we are about to change page (from->to) and indicate current scroll position
    // Position is required so that browse/queue can restore their current scroll on page change
    bus.$emit('routeChange', from.path, to.path);
    setLocalStorageVal('path', to.path);
    next()
})

// Work-around for bottomnav issue - see bottomnav.js
router.afterEach((to, from) => {
    bus.$emit('routeChanged', from.path, to.path);
})

function changeCss(cssFile, index) {
    var oldlink = document.getElementsByTagName("link").item(index);
    var newlink = document.createElement("link");
    newlink.setAttribute("rel", "stylesheet");
    newlink.setAttribute("type", "text/css");
    newlink.setAttribute("href", cssFile);
    document.getElementsByTagName("head").item(0).replaceChild(newlink, oldlink);
}

function setTheme(dark) {
    if (!isMobile()) {
        if (dark) {
            changeCss("html/css/dark-scrollbar.css", 0);
        } else {
            changeCss("html/css/light-scrollbar.css", 0);
        }
    }
}

const store = new Vuex.Store({
    state: {
        players: null, // List of players
        player: null, // Current player (from list)
        darkUi: true,
        artistAlbumSort:'yearalbum',
        albumSort:'album',
        splitArtistsAndAlbums:false,
        sortFavorites:false,
        showMenuAudio:true,
        serverMenus:false,
        autoScrollQueue:true,
        library: null,
        infoPlugin: false
    },
    mutations: {
        setPlayers(state, players) {
            var changed = !state.players || state.players.length!=players.length;
            if (!changed) {
                for (i=0; i<state.players.length; ++i) {
                    var a = state.players[i];
                    var b = players[i];
                    if (a.id!=b.id || a.name!=b.name || a.canpoweroff!=b.canpoweroff ||  a.ison!=b.ison ||  a.isconnected!=b.isconnected ||  a.isgroup!=b.isgroup) {
                        changed = true;
                        break;
                    }
                }
            }

            if (!changed) {
                return;
            }

            state.players=players;
            if (state.player) {
                // Check current player is still valid
                var found = false;
                if (players) {
                    for (i=0; i<state.players.length; ++i) {
                        if (state.players[i].id === state.player.id) {
                            found = true;
                            break;
                        }
                    }
                }
                if (!found) {
                    state.player = null;
                }
            }

            if (players && !state.player) {
                var config = getLocalStorageVal('player');
                if (config) {
                    state.players.forEach(p => {
                        if (p.id === config) {
                            state.player = p;   
                        }
                    });
                }
                if (!state.player) { /* Choose first powered on player */
                    for (i=0; i<state.players.length; ++i) {
                        if (state.players[i].ison) {
                            state.player=state.players[i];
                            setLocalStorageVal('player', state.player.id);
                            break;
                        }
                    }
                }
                if (!state.player) { /* Choose first connected on player */
                    for (i=0; i<state.players.length; ++i) {
                        if (state.players[i].isconnected) {
                            state.player=state.players[i];
                            setLocalStorageVal('player', state.player.id);
                            break;
                        }
                    }
                }
                if (!state.player && state.players.length>0) { /* Choose first player */
                    state.player=state.players[0];
                    setLocalStorageVal('player', state.player.id);
                }
            }
        },
        setPlayer(state, id) {
            if (state.players) {
                for (i=0; i<state.players.length; ++i) {
                    if (state.players[i].id === id) {
                        state.player = state.players[i];
                        setLocalStorageVal('player', id);
                        break;
                    }
                }
            }
        },
        setUiSettings(state, val) {
            var browseDisplayChanged = false;
            if (state.darkUi!=val.darkUi) {
                state.darkUi = val.darkUi;
                setLocalStorageVal('darkUi', state.darkUi);
                setTheme(state.darkUi);
            }
            if (state.artistAlbumSort!=val.artistAlbumSort) {
                state.artistAlbumSort = val.artistAlbumSort;
                setLocalStorageVal('artistAlbumSort', state.artistAlbumSort);
                browseDisplayChanged = true;
            }
            if (state.albumSort!=val.albumSort) {
                state.albumSort = val.albumSort;
                setLocalStorageVal('albumSort', state.albumSort);
                browseDisplayChanged = true;
            }
            if (state.splitArtistsAndAlbums!=val.splitArtistsAndAlbums) {
                state.splitArtistsAndAlbums = val.splitArtistsAndAlbums;
                setLocalStorageVal('splitArtistsAndAlbums', state.splitArtistsAndAlbums);
                browseDisplayChanged = true;
            }
            if (state.sortFavorites!=val.sortFavorites) {
                state.sortFavorites = val.sortFavorites;
                setLocalStorageVal('sortFavorites', state.sortFavorites);
                browseDisplayChanged = true;
            }
            if (state.autoScrollQueue!=val.autoScrollQueue) {
                state.autoScrollQueue = val.autoScrollQueue;
                setLocalStorageVal('autoScrollQueue', state.autoScrollQueue);
            }
            if (state.showMenuAudio!=val.showMenuAudio) {
                state.showMenuAudio = val.showMenuAudio;
                setLocalStorageVal('showMenuAudio', state.showMenuAudio);
            }
            if (state.serverMenus!=val.serverMenus) {
                state.serverMenus = val.serverMenus;
                setLocalStorageVal('serverMenus', state.serverMenus);
                browseDisplayChanged = true;
            }
            bus.$emit('browseDisplayChanged');
        },
        initUiSettings(state) {
            state.darkUi = getLocalStorageBool('darkUi', state.darkUi);
            state.artistAlbumSort = getLocalStorageVal('artistAlbumSort', state.artistAlbumSort);
            state.albumSort = getLocalStorageVal('albumSort', state.albumSort);
            state.autoScrollQueue = getLocalStorageBool('autoScrollQueue', state.autoScrollQueue);
            state.library = getLocalStorageVal('library', state.library);
            state.splitArtistsAndAlbums = getLocalStorageBool('splitArtistsAndAlbums', state.splitArtistsAndAlbums);
            state.sortFavorites = getLocalStorageBool('sortFavorites', state.sortFavorites);
            state.showMenuAudio = getLocalStorageBool('showMenuAudio', state.showMenuAudio);
            state.serverMenus = getLocalStorageBool('serverMenus', state.serverMenus);
            state.infoPlugin = getLocalStorageBool('infoPlugin', state.infoPlugin);
            setTheme(state.darkUi);
        },
        setLibrary(state, lib) {
            if (state.library!=lib) {
                state.library = lib;
                setLocalStorageVal('library', state.library);
                bus.$emit('libraryChanged');
            }
        },
        setInfoPlugin(state, val) {
            state.infoPlugin = val;
            setLocalStorageVal('infoPlugin', val);
        }
    }
})

Vue.use(VueLazyload);

var app = new Vue({
    el: '#app',
    data() {
        return { screenHeight:0, debugHeight:false } // set debugHeight to display screen height in toolbar
    },
    created() {
        // For testing, allow pages to be served p by (e.g.) python -m SimpleHTTPServer. Use http://localhost:8000/?lms=<reall address of LMS>
        var res = RegExp('[?&]lms=([^&#]*)').exec(window.location.href);
        if (res && 2==res.length) {
            lmsServerAddress = "http://"+res[1]+":9000";
        }
        this.$store.commit('initUiSettings');

        this.openDialogs = new Set();
        bus.$on('dialog', function(name, open) {
            if (open) {
                this.openDialogs.add(name);
            } else {
                this.openDialogs.delete(name);
            }
        }.bind(this));

        var that = this;
        var t = getLocalStorageVal('translation', undefined);
        if (t!=undefined) {
            setTranslation(JSON.parse(t));
        }
        lmsCommand("", ["pref", "language", "?"]).then(({data}) => {
            if (data && data.result && data.result._p2) {
                var lang = data.result._p2.toLowerCase();
                if (lang == 'en') {
                    var language = (window.navigator.userLanguage || window.navigator.language).toLowerCase();
                    if (language != 'en-us') {
                        lang = language;
                    }
                }
                if (lang != 'en') {
                    if (!LMS_SKIN_LANGUAGES.includes(lang)) {
                        lang = lang.substr(0, 2);
                    }
                    
                    axios.get("html/lang/"+lang+".json").then(function (resp) {
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

        // Music and Artist info plugin installled?
        lmsCommand("", ["musicartistinfo", "localfiles", 0, 0]).then(({data}) => {
            this.$store.commit('setInfoPlugin', data && data.result && data.result.window);
        }).catch(err => {
            this.$store.commit('setInfoPlugin', false);
        });

        // Work-around 100vh behaviour in mobile chrome
        // See https://css-tricks.com/the-trick-to-viewport-units-on-mobile/
        let vh = window.innerHeight * 0.01;
        let lastWinHeight = window.innerHeight;
        let timeout = undefined;
        that.screenHeight = lastWinHeight;
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
                    that.screenHeight = lastWinHeight;
                }
                timeout = undefined;
            }.bind(that), 50);
        }, false);

        // https://stackoverflow.com/questions/43329654/android-back-button-on-a-progressive-web-application-closes-de-app
        window.addEventListener('load', function() {
            window.history.pushState({ noBackExitsApp: true }, '')
        }, false);

        window.addEventListener('popstate', function(event) {
            if (event.state && event.state.noBackExitsApp) {
                window.history.pushState({ noBackExitsApp: true }, '');
            }
        }, false);

        // https://github.com/timruffles/mobile-drag-drop/issues/77
        window.addEventListener( 'touchmove', function() {});

        // Use Escape to close dialogs
        document.onkeydown = function(evt) {
            evt = evt || window.event;
            if (evt.keyCode == 27) {
                bus.$emit('closeDialog');
            }
        };
    },
    computed: {
        darkUi() {
            return this.$store.state.darkUi;
        },
        lang() {
            return this.$store.state.lang;
        }
    },
    methods: {
        swipe(direction) {
            if (this.openDialogs.length!=0) {
                if ('r'==direction) {
                    bus.$emit('closeDialog');
                }
                return;
            }
            if ('l'==direction) {
                if (this.$route.path=='/browse') {
                    this.$router.push('/nowplaying');
                } else if (this.$route.path=='/nowplaying') {
                    this.$router.push('/queue');
                } else if (this.$route.path=='/queue') {
                    this.$router.push('/browse');
                }
            } else if ('r'==direction) {
                if (this.$route.path=='/browse') {
                    this.$router.push('/queue');
                } else if (this.$route.path=='/nowplaying') {
                    this.$router.push('/browse');
                } else if (this.$route.path=='/queue') {
                    this.$router.push('/nowplaying');
                }
            }
        }
    },
    store,
    router,
    lmsServer
})

