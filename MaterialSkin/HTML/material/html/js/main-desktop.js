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
    },
    created() {
        // For testing, allow pages to be served by (e.g.) python -m SimpleHTTPServer. Use http://localhost:8000/?lms=<real address of LMS>
        var res = RegExp('[?&]lms=([^&#]*)').exec(window.location.href);
        if (res && 2==res.length) {
            lmsServerAddress = "http://"+res[1]+":9000";
        }
        this.$store.commit('initUiSettings', true);
        initApp(true);
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
    store,
    lmsServer
})

