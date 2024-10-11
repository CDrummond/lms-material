/**
 * LMS-Material
 *
 * Copyright (c) 2018-2024 Craig Drummond <craig.p.drummond@gmail.com>
 * MIT license.
 */
'use strict';

Vue.component('lms-windowcontrols', {
    template: `
<v-layout row wrap class="wc">
 <v-flex v-for="(btn, index) in btns" xs4><v-btn icon class="wc-btn wc-btn-r" v-bind:class="{'wc-close':'close'==btn}" @click="sendButton(btn)"><v-icon class="wc-icn" v-bind:class="{'wc-res':btn=='max'&&maximized}">{{btn=='max' ? (maximized ? 'filter_none' : 'crop_square') : btn=='min' ? 'remove' : 'close'}}</v-icon></v-btn></v-flex>
</v-layout>
`,
    data () {
        return {
            maximized:false,
            btns:[]
        }
    },
    mounted() {
        if (undefined==queryParams.tbarBtnsRight) {
            if (undefined==queryParams.tbarBtns) {
                queryParams.tbarBtnsRight=['min', 'max', 'close'];
            } else {
                queryParams.tbarBtnsRight=queryParams.tbarBtns.split(',');
            }
        }
        this.btns = queryParams.tbarBtnsRight;
        let space = this.btns.length==1 ? 16 : 0;
        document.documentElement.style.setProperty("--window-controls-padr", space+"px");
        document.documentElement.style.setProperty("--window-controls-space", ((this.btns.length*32)+space)+"px");
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
