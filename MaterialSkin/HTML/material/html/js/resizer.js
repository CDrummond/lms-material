/**
 * LMS-Material
 *
 * Copyright (c) 2018-2023 Craig Drummond <craig.p.drummond@gmail.com>
 * MIT license.
 */
'use strict';

let resizerActive = false;
Vue.component('lms-resizer', {
    template: `
<div class="lms-resizer" @mousedown="onDown" @touchstart.prevent="onDown"></div>
`,
    props: {
        varname: {
            type: String,
            required: true
        }
    },
    data () {
        return {
            active: false,
        }
    },
    mounted() {
        let val = getLocalStorageVal(this.varname, 0);
        if (val>=380 && val<=1200) {
            let current = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--'+this.varname).replace('px', ''));
            if (val!=current) {
                document.documentElement.style.setProperty('--'+this.varname, val+"px");
            }
        }
    },
    methods: {
        onDown(e) {
            if (this.active) {
                return;
            }
            this.active = resizerActive = true;
            this.width = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--'+this.varname).replace('px', ''));
            this.origWidth = this.width;
            this.updated = undefined;
            this.pos = e['pageX'] || e.clientX;
            if (this.pos==undefined && e.touches) {
                this.pos = e.touches[0].pageX;
            }
            window.addEventListener('mousemove', this.onMove, PASSIVE_SUPPORTED ? { passive: true } : false);
            window.addEventListener('touchmove', this.onMove, PASSIVE_SUPPORTED ? { passive: true } : false);
            window.addEventListener('mouseup', this.cancel, PASSIVE_SUPPORTED ? { passive: true } : false);
            window.addEventListener('touchend', this.cancel, PASSIVE_SUPPORTED ? { passive: true } : false);
            window.addEventListener('touchcancel', this.cancel, PASSIVE_SUPPORTED ? { passive: true } : false);
        },
        cancel() {
            if (!this.active) {
                return;
            }
            window.removeEventListener('mousemove', this.onMove);
            window.removeEventListener('touchmove', this.onMove);
            window.removeEventListener('mouseup', this.cancel);
            window.removeEventListener('touchend', this.cancel);
            window.removeEventListener('touchcancel', this.cancel);
            this.active = false;
            setTimeout(function () { resizerActive = this.active; }.bind(this), 100);
            if (undefined!=this.updated && this.updated!=this.origWidth) {
                setLocalStorageVal(this.varname, this.updated);
            }
        },
        onMove(e) {
            if (!this.active) {
                return;
            }
            let pageX = e['pageX'] || e.clientX;
            if (pageX==undefined && e.touches) {
                pageX = e.touches[0].pageX;
            }

            let diff = this.pos - pageX;
            if (0!=diff) {
                let updated = this.width + diff;
                if (updated>=380 && updated<=1200) {
                    this.updated = updated;
                    if (!this.animationFrameReq) {
                        this.animationFrameReq = window.requestAnimationFrame(() => {
                            document.documentElement.style.setProperty('--'+this.varname, this.updated+"px");
                            this.animationFrameReq = undefined;
                        });
                    }
                }
            }
        },
        onMouseMove (e) {
            if (e.buttons === 0 || e.which === 0) {
                this.active = false;
            } else {
                this.onMove(e);
            }
        }
    }
});
