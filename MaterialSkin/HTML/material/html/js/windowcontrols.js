/**
 * LMS-Material
 *
 * Copyright (c) 2018-2024 Craig Drummond <craig.p.drummond@gmail.com>
 * MIT license.
 */
'use strict';

Vue.component('lms-windowcontrols', {
    template: `
<v-layout row wrap :class="['wc', 'wc-style-'+queryParams.tbarBtnsStyle]">
 <v-flex v-for="(btn, index) in btns" xs4><div :class="['wc-btn', 'wc-btn-'+queryParams.tbarBtnsPos, 'wc-btn-'+btn]" @click="sendButton(btn)"><v-icon class="wc-icn" v-bind:class="{'wc-res':btn=='max'&&maximized, 'wc-min':'min'==btn}">{{btn=='max' ? (maximized ? 'filter_none' : 'crop_square') : btn=='min' ? 'remove' : 'close'}}</v-icon></div></v-flex>
</v-layout>
`,
    data () {
        return {
            maximized:false,
            btns:[]
        }
    },
    mounted() {
        if (undefined==window.mskTitlebarControls) {
            if (undefined==queryParams.tbarBtns) {
                window.mskTitlebarControls=queryParams.tbarBtnsPos=='l' ? ['close', 'min', 'max'] : ['min', 'max', 'close'];
            } else {
                window.mskTitlebarControls=queryParams.tbarBtns.split(',');
            }
            if ('win'==queryParams.tbarBtnsStyle) {
                let space = 8;
                document.documentElement.style.setProperty("--window-controls-padr", space+"px");
                document.documentElement.style.setProperty("--window-controls-space", ((window.mskTitlebarControls.length*48)+space)+"px");
            } else {
                let space = window.mskTitlebarControls.length==1 ? 16 : 0;
                document.documentElement.style.setProperty("--window-controls-padr", space+"px");
                document.documentElement.style.setProperty("--window-controls-space", ((window.mskTitlebarControls.length*32)+space)+"px");
            }
        }
        this.btns = window.mskTitlebarControls;
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
    }
});
