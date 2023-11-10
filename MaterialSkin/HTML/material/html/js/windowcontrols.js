/**
 * LMS-Material
 *
 * Copyright (c) 2018-2023 Craig Drummond <craig.p.drummond@gmail.com>
 * MIT license.
 */
'use strict';

Vue.component('lms-windowcontrols', {
    template: `
<v-layout row wrap class="wc">
 <v-flex xs4><v-btn flat icon class="wc-btn" @click="sendButton('min')"><v-icon class="wc-icn">remove</v-icon></v-btn></v-flex>
 <v-flex xs4><v-btn flat icon class="wc-btn" @click="sendButton('max')"><v-icon class="wc-icn">add</v-icon></v-btn></v-flex>
 <v-flex xs4><v-btn flat icon class="wc-btn wc-close" @click="sendButton('close')"><v-icon class="wc-icn">close</v-icon></v-btn></v-flex>
</v-layout>
`,
    data () {
        return {
        }
    },
    mounted() {
        document.documentElement.style.setProperty("--window-controls-space", "94px");
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
            } else if (2==queryParams.nativeTitlebar) {
                console.log("MATERIAL-TITLEBAR\nNAME " + btn);
            }
        }
    }
});
