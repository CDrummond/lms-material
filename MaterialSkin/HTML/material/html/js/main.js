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

Vue.use(VueLazyload);

var app = new Vue({
    el: '#app',
    data() {
    },
    created() {
        // For testing, allow pages to be served by (e.g.) python -m SimpleHTTPServer. Use http://localhost:8000/mobile.html?lms=<real address of LMS>
        var res = RegExp('[?&]lms=([^&#]*)').exec(window.location.href);
        if (res && 2==res.length) {
            lmsServerAddress = "http://"+res[1]+":9000";
        }
        this.$store.commit('initUiSettings');

        this.openDialogs = [];
        bus.$on('dialog', function(name, open) {
            if (open) {
                this.openDialogs.push(name);
            } else {
                var index = this.openDialogs.indexOf(name);
                if (index>=0) {
                    this.openDialogs.splice(index, 1);
                }
            }
        }.bind(this));

        initApp(this);
    },
    computed: {
        darkUi() {
            return this.$store.state.darkUi;
        },
        lang() {
            return this.$store.state.lang;
        }
    },
    store,
    router,
    lmsServer
})

