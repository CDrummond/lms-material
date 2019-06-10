/**
 * LMS-Material
 *
 * Copyright (c) 2018-2019 Craig Drummond <craig.p.drummond@gmail.com>
 * MIT license.
 */

Vue.use(VueLazyload, {error:LMS_BLANK_COVER});

var app = new Vue({
    el: '#app',
    data() {
        return { dialogs: { uisettings: false, playersettings: false, info: false, sync: false, group: false,
                            manage: false, rndmix: false, favorite: false, rating: false, sleep: false, search: false }}
    },
    created() {
        parseQueryParams();
        this.$store.commit('initUiSettings');
        this.splitterPercent = parseInt(getLocalStorageVal("splitter", "50"));
        this.splitter = this.splitterPercent;
        document.documentElement.style.setProperty('--splitter-pc', this.splitter);
        initApp(this);
        bus.$on('dlg.open', function(name, a, b) {
            this.dialogs[name] = true; // Mount
            this.$nextTick(function () {
                bus.$emit(name+".open", a, b);
            });
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
    components: {
        VueSplitter
    },
    methods: {
        splitterResized(val) {
            var f = Math.floor(val/2)*2;
            if (f!=this.splitter) {
                setLocalStorageVal("splitter", f);
                document.documentElement.style.setProperty('--splitter-pc', f);
                this.splitter=f;
                if (!this.splitterChangedAnimationFrameReq) {
                    this.scrollAnimationFrameReq = window.requestAnimationFrame(() => {
                        bus.$emit('splitterChanged');
                        this.scrollAnimationFrameReq = undefined;
                    });
                }
            }
        }
    },
    store,
    lmsServer
})

