/**
 * LMS-Material
 *
 * Copyright (c) 2018 Craig Drummond <craig.p.drummond@gmail.com>
 * MIT license.
 */

Vue.use(VueLazyload);

var app = new Vue({
    el: '#app',
    data() {
        splitterPercent:50
    },
    created() {
        // For testing, allow pages to be served by (e.g.) python -m SimpleHTTPServer. Use http://localhost:8000/?lms=<real address of LMS>
        var res = RegExp('[?&]lms=([^&#]*)').exec(window.location.href);
        if (res && 2==res.length) {
            lmsServerAddress = "http://"+res[1]+":9000";
        }
        this.$store.commit('initUiSettings');
        this.splitterPercent = parseInt(getLocalStorageVal("splitter", "50"));
        this.splitter = this.splitterPercent;
        document.documentElement.style.setProperty('--splitter-pc', this.splitter);
        initApp();
    },
    computed: {
        darkUi() {
            return this.$store.state.darkUi;
        },
        lang() {
            return this.$store.state.lang;
        }
    },
    components: {
        VueSplitter
    },
    methods: {
        splitteResized(val) {
            var f = Math.floor(val/2)*2;
            if (f!=this.splitter) {
                setLocalStorageVal("splitter", f);
                document.documentElement.style.setProperty('--splitter-pc', f);
                this.splitter=f;
            }
        }
    },
    store,
    lmsServer
})

