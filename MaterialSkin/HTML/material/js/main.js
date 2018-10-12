/*
 * LMS-Material
 *
 * Copyright (c) 2018 Craig Drummond <craig.p.drummond@gmail.com>
 * MIT license.
 */
 
const routes = [
    {
      path: '/',
      redirect: '/browse'
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
    next()
})

const LS_PREFIX="lms-material::";

const store = new Vuex.Store({
    state: {
        players: null, // List of players
        player: null, // Current player (from list)
        playerStatus: null, // Status of current player
        unifiedArtistsList: true,
        darkUi: true,
        artistAlbumSort:'yearalbum',
        albumSort:'album',
        autoScrollQueue:true
    },
    mutations: {
        setPlayers(state, players) {
            state.players=players;
            if (state.player) {
                // Cehck current player is still valid
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
                var config = localStorage.getItem(LS_PREFIX+'player');
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
                            localStorage.setItem(LS_PREFIX+'player', state.player.id);
                            break;
                        }
                    }
                }
                if (!state.player) { /* Choose first connected on player */
                    for (i=0; i<state.players.length; ++i) {
                        if (state.players[i].isconnected) {
                            state.player=state.players[i];
                            localStorage.setItem(LS_PREFIX+'player', state.player.id);
                            break;
                        }
                    }
                }
                if (!state.player && state.players.length>0) { /* Choose first player */
                    state.player=state.players[0];
                    localStorage.setItem(LS_PREFIX+'player', state.player.id);
                }
            }
        },
        setPlayer(state, id) {
            if (state.players) {
                for (i=0; i<state.players.length; ++i) {
                    if (state.players[i].id === id) {
                        state.player = state.players[i];
                        localStorage.setItem(LS_PREFIX+'player', id);
                        break;
                    }
                }
            }
        },
        setPlayerStatus(state, status) {
            state.playerStatus=status;
        },
        setUseUnifiedArtistsList(state, val) {
            state.unifiedArtistsList = val;
        },
        setUiSettings(state, val) {
            if (state.darkUi!=val.darkUi) {
                state.darkUi = val.darkUi;
                localStorage.setItem(LS_PREFIX+'darkUi', state.darkUi);
            }
            if (state.artistAlbumSort!=val.artistAlbumSort) {
                state.artistAlbumSort = val.artistAlbumSort;
                localStorage.setItem(LS_PREFIX+'artistAlbumSort', state.artistAlbumSort);
                bus.$emit('albumSortChanged');
            }
            if (state.albumSort!=val.albumSort) {
                state.albumSort = val.albumSort;
                localStorage.setItem(LS_PREFIX+'albumSort', state.albumSort);
                bus.$emit('albumSortChanged');
            }
            if (state.autoScrollQueue!=val.autoScrollQueue) {
                state.autoScrollQueue = val.autoScrollQueue;
                localStorage.setItem(LS_PREFIX+'autoScrollQueue', state.autoScrollQueue);
            }
        },
        initUiSettings(state) {
            var val = localStorage.getItem(LS_PREFIX+'darkUi');
            if (undefined!=val) {
                state.darkUi = true == val;
            }
            val = localStorage.getItem(LS_PREFIX+'artistAlbumSort');
            if (undefined!=val) {
                state.artistAlbumSort = val;
            }
            val = localStorage.getItem(LS_PREFIX+'albumSort');
            if (undefined!=val) {
                state.albumSort = val;
            }
            val = localStorage.getItem(LS_PREFIX+'autoScrollQueue');
            if (undefined!=val) {
                state.autoScrollQueue = true == val;
            }
        }
    }
})

Vue.use(VueLazyload);

var app = new Vue({
    el: '#app',
    data() {
        return { }
    },
    created() {
        // For testing, allow pages to be served p by (e.g.) python -m SimpleHTTPServer. Use http://localhost:8000/?lms=<reall address of LMS>
        var res = RegExp('[?&]lms=([^&#]*)').exec(window.location.href);
        if (res && 2==res.length) {
            lmsServerAddress = "http://"+res[1]+":9000";
        }
        this.$store.commit('initUiSettings');
    },
    computed: {
        darkUi() {
            return this.$store.state.darkUi;
        }
    },
    store,
    router,
    lmsServer
})

