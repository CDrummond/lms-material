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

const store = new Vuex.Store({
    state: {
        players: null, // List of players
        player: null, // Current player (from list)
        playerStatus: null, // Status of current player
        unifiedArtistsList: true
    },
    mutations: {
        setPlayers(state, players) {
            state.players=players;
            if (players && !state.player) {
                var config = localStorage.getItem('player');
                if (config) {
                    state.players.forEach(p => {
                        if (p.id === config) {
                            state.player = p;   
                        }
                    });
                }
                if (!state.player) {
                    state.player=state.players[0];
                    localStorage.setItem('player', state.player.id);
                }
            }
        },
        setPlayer(state, id) {
            if (state.players) {
                for (i=0; i<state.players.length; ++i) {
                    if (state.players[i].id === id) {
                        state.player = state.players[i];
                        localStorage.setItem('player', id);
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
        }
    }
})

Vue.use(VueLazyload);

var app = new Vue({
    el: '#app',
    data() {
        return { useDark: true }
    },
    created() {
        // For testing, allow pages to be served p by (e.g.) python -m SimpleHTTPServer. Use http://localhost:8000/?lms=<reall address of LMS>
        var res = RegExp('[?&]lms=([^&#]*)').exec(window.location.href);
        if (res && 2==res.length) {
            lmsServerAddress = "http://"+res[1]+":9000";
        }
    },
    store,
    router,
    lmsServer
})

