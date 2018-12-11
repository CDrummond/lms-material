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
    methods: {
        swipe(ev, direction) {
            if (this.$route.path=='/nowplaying') {
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
            if (this.openDialogs.length!=0) {
                if ('r'==direction) {
                    bus.$emit('closeDialog', this.openDialogs[this.openDialogs.length-1]);
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

