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
        parseQueryParams();
        this.$store.commit('initUiSettings');
        this.splitterPercent = parseInt(getLocalStorageVal("splitter", "50"));
        this.splitter = this.splitterPercent;
        document.documentElement.style.setProperty('--splitter-pc', this.splitter);
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
                bus.$emit('splitterChanged');
            }
        }
    },
    store,
    lmsServer
})

