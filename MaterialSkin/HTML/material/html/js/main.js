/**
 * LMS-Material
 *
 * Copyright (c) 2018-2019 Craig Drummond <craig.p.drummond@gmail.com>
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
        return { dialogs: { uisettings: false, playersettings: false, info: false, sync: false, group: false,
                            volume: false, manage: false, rndmix: false, favorite: false, rating: false, sleep: false }}
    },
    created() {
        parseQueryParams();
        this.$store.commit('initUiSettings');

        bus.$on('dlg.open', function(name, a, b) {
            this.dialogs[name] = true; // Mount
            this.$nextTick(function () {
                bus.$emit(name+".open", a, b);
            });
        }.bind(this));

        initApp(this);
        this.openDialogs = 0;

        bus.$on('dialogOpen', function(name, open) {
            this.dialogs['name']=open;
            if (open) {
                this.$nextTick(function () {
                    bus.$emit(name+".open");
                });
            }
            if (open) {
                this.openDialogs++;
            } else if (this.openDialogs>0) {
                this.openDialogs--;
            }
        }.bind(this));
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
            if (this.openDialogs>0) {
                return;
            }
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

