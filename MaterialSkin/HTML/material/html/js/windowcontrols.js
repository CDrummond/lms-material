/**
 * LMS-Material
 *
 * Copyright (c) 2018-2024 Craig Drummond <craig.p.drummond@gmail.com>
 * MIT license.
 */
'use strict';

Vue.component('lms-windowcontrols', {
    template: `
<v-layout v-if="queryParams.tbarBtns>0" row wrap class="wc">
 <v-flex xs4 v-if="queryParams.tbarBtns&1"><v-btn outline icon class="wc-btn-o" @click="sendButton('min')"><img :src="'minimize' | svgIcon(dark)"></img></v-btn></v-flex>
 <v-flex xs4 v-if="queryParams.tbarBtns&2"><v-btn outline icon class="wc-btn-o" @click="sendButton('max')"><img :src="maximized ? 'restore': 'maximize' | svgIcon(dark)"></img></v-btn></v-flex>
 <v-flex xs4 v-if="queryParams.tbarBtns&4"><v-btn outline icon class="wc-btn-o wc-close" @click="sendButton('close')"><img :src="'close' | svgIcon(dark)"></img></v-btn></v-flex>
</v-layout>
<v-layout v-else row wrap class="wc">
 <v-flex xs4><v-btn flat icon class="wc-btn" @click="sendButton('min')"><v-icon class="wc-icn">remove</v-icon></v-btn></v-flex>
 <v-flex xs4><v-btn flat icon class="wc-btn" @click="sendButton('max')"><v-icon class="wc-icn">add</v-icon></v-btn></v-flex>
 <v-flex xs4><v-btn flat icon class="wc-btn wc-close" @click="sendButton('close')"><v-icon class="wc-icn">close</v-icon></v-btn></v-flex>
</v-layout>
`,
    data () {
        return {
            maximized:false
        }
    },
    mounted() {
        let numBtns = 3;
        if (queryParams.tbarBtns>0) {
            numBtns = ((queryParams.tbarBtns&1) ? 1 : 0) + ((queryParams.tbarBtns&2) ? 1 : 0) + ((queryParams.tbarBtns&4) ? 1 : 0)
        }
        document.documentElement.style.setProperty("--window-controls-space", ((numBtns*36)+12)+"px");
        bus.$on('windowMaximized', function(isMax) {
            this.maximized = isMax;
        }.bind(this));
    },
    methods: {
        sendButton(btn) {
            if (1==queryParams.nativeTitlebar) {
                bus.$nextTick(function () {
                    try {
                        NativeReceiver.windowControlPressed(btn);
                    } catch (e) {
                    }
                });
            } else if (queryParams.nativeTitlebar>0) {
                emitNative("MATERIAL-TITLEBAR\nNAME " + btn, queryParams.nativeTitlebar);
            }
        }
    },
    computed: {
        dark () {
            return this.$store.state.darkUi || this.$store.state.coloredToolbar
        }
    },
    filters: {
        svgIcon: function (name, dark) {
            return "/material/svg/window-"+name+"?c="+(dark ? LMS_DARK_SVG : LMS_LIGHT_SVG)+"&r="+LMS_MATERIAL_REVISION;
        }
    },
});
