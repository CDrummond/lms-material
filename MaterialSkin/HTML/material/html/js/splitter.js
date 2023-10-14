/**
 * LMS-Material
 *
 * This code is a modified version of https://github.com/rmp135/vue-splitter
 */
'use strict';

Vue.component('lms-splitter', {
    template: `
  <div class="lms-splitter" @mouseup="onUp" @mousemove="onMouseMove" @touchmove="onMove" @touchend="onUp">
    <div :style="leftPaneStyle" class="left-pane splitter-pane">
      <slot name="left-pane"></slot>
    </div>
    <div class="splitter" v-bind:class="{'active':active}" @mousedown="onDown" @touchstart.prevent="onDown"></div>
    <div :style="rightPaneStyle" class="right-pane splitter-pane">
      <slot name="right-pane"></slot>
    </div>
  </div>
`,
    props: ['margin'],
    data () {
        return {
            horizontal: false,
            active: false,
            percent: 70,
        }
    },
    computed: {
        leftPaneStyle () {
            return { width: (this.$store.state.pinQueue ? this.pc : 100) + '%' }
        },
        rightPaneStyle () {
            return { width: (this.$store.state.pinQueue ? 100-this.pc : 0 )+ '%' }
        },
        pc() {
            return this.$store.state.desktopLayout ? this.$store.state.showQueue ? this.percent : 100 : 0
        }
    },
    created () {
        this.percent = this.lastUpdate = parseInt(getLocalStorageVal("splitter", "70"));
        document.documentElement.style.setProperty('--splitter-pc', this.percent);
    },
    mounted() {
        bus.$on('setSplitter', function(val) {
            this.percent = this.lastUpdate = val;
            document.documentElement.style.setProperty('--splitter-pc', this.percent);
        }.bind(this));
    },
    methods: {
        onDown (e) {
            this.active = true;
        },
        onUp () {
            setLocalStorageVal("splitter", this.percent);
            this.active = false;
        },
        onMove (e) {
            if (this.active && this.$store.state.desktopLayout && this.$store.state.showQueue) {
                let offset = 0;
                let target = e.currentTarget;
                let pageX = e['pageX'] || e.clientX;
                if (pageX==undefined && e.touches) {
                    pageX = e.touches[0].pageX;
                }

                while (target) {
                    offset += target.offsetLeft;
                    target = target.offsetParent;
                }
                let percent = Math.floor(((pageX - offset) / e.currentTarget.offsetWidth)*10000)/100;
                if (percent > this.margin && percent < (100 - this.margin)) {
                    this.percent = percent;
                    var f = Math.round(this.percent);
                    if (f != this.lastUpdate) {
                        this.lastUpdate = f;
                        if (!this.splitterChangedAnimationFrameReq) {
                            this.splitterChangedAnimationFrameReq = window.requestAnimationFrame(() => {
                                document.documentElement.style.setProperty('--splitter-pc', this.lastUpdate);
                                bus.$emit('splitterChanged');
                                this.splitterChangedAnimationFrameReq = undefined;
                            });
                        }
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

