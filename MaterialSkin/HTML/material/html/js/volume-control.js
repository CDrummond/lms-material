/**
 * LMS-Material
 *
 * Copyright (c) 2018-2024 Craig Drummond <craig.p.drummond@gmail.com>
 * MIT license.
 */
'use strict';

Vue.component('volume-control', {
    template: `
<v-layout row wrap :class="'vol-control-'+layout">
 <v-flex xs12 v-if="layout==0"><p class="vol-text link-item noselect" @click.middle="toggleMute" v-longpress="toggleMuteLabel">{{value|displayVal(dvc, name)}}</p></v-flex>
 <v-flex xs12>
  <v-layout>
   <v-btn flat icon :disabled="VOL_HIDDEN==dvc" @wheel="wheel($event)" @click.middle="toggleMute" v-longpress:repeat="dec" class="vol-btn vol-left" :title="decTooltip | tooltip('down', displayKeyboardShortcut)"><v-icon>{{muted ? 'volume_off' : 'volume_down'}}</v-icon></v-btn>
   <v-slider :disabled="VOL_HIDDEN==dvc || VOL_FIXED==dvc || noPlayer || queryParams.party" step="1" v-model="value" @wheel.native="wheel($event)" @click.middle="toggleMute" class="vol-slider" @start="start" @end="end" @change="changed"></v-slider>
   <v-btn flat icon :disabled="VOL_HIDDEN==dvc" @wheel="wheel($event)" @click.middle="toggleMute" v-longpress:repeat="inc" class="vol-btn vol-right" :title="incTooltip | tooltip('up', displayKeyboardShortcut)"><v-icon>{{muted ? 'volume_off' : 'volume_up'}}</v-icon></v-btn>
   <p v-if="layout==1" :disabled="VOL_HIDDEN==dvc" class="vol-full-label" v-bind:class="{'link-item-ct':coloredToolbars,'link-item':!coloredToolbars,'disabled':noPlayer,'dimmed':muted}" @click.middle="toggleMute" v-longpress="toggleMuteLabel" id="vol-label">{{value|displayVal(dvc)}}</p>
   <p v-else-if="layout==2 && VOL_STD==dvc" class="pmgr-vol link-item noselect" @click.middle="toggleMute" v-longpress="toggleMuteLabel">{{value|displayVal(dvc)}}</p>
  </v-layout>
 </v-flex>
</v-layout>
    `,
    props: {
        value: {
            type: Number,
            required: true
        },
        muted: {
            type: Boolean,
            required: true
        },
        playing: {
            type: Boolean,
            required: true
        },
        dvc: {
            type: Number,
            required: true
        },
        layout: {
            type: Number, // 0 = label above, 1=label left (toolbar), 2=label left (manage players)
            required: true
        },
        name: {
            type: String,
            required: false
        },
        id: {
            type: String,
            required: false
        }
    },
    data() {
        return {
            trans:{ decVol:undefined, incVol:undefined }
        }
    },
    mounted() {
        this.moving = false;
        this.lastTime = undefined;
        this.lastEmittedValue = -1;
        bus.$on('langChanged', function() {
            this.initItems();
        }.bind(this));
        this.initItems();
    },
    beforeDestroy() {
        this.cancelTimer();
    },
    methods: {
        initItems() {
            this.trans = { decVol:i18n("Decrease volume"), incVol:i18n("Increase volume") };
        },
        wheel(event) {
            if (event.deltaY<0) {
                this.inc();
            } else if (event.deltaY>0) {
                this.dec();
            }
        },
        inc() {
            this.$emit('inc', this.id);
        },
        dec() {
            this.$emit('dec', this.id);
        },
        changed() {
            if (this.moving || this.lastEmittedValue == this.value) {
                return;
            }
            this.$emit('changed', this.value, this.id);
            this.lastEmittedValue = this.value;
        },
        start() {
            this.lastEmittedValue = this.value;
            this.moving=true;
            this.$emit('moving', true);
        },
        end() {
            this.moving=false;
            this.$emit('moving', false);
        },
        toggleMute() {
            this.$emit('toggleMute', this.id);
        },
        toggleMuteLabel(longPress) {
            if (longPress || this.muted) {
                this.toggleMute();
            }
        },
        cancelTimer() {
            if (undefined!==this.timer) {
                clearTimeout(this.timer);
                this.timer = undefined;
            }
        },
        resetTimer() {
            this.cancelTimer();
            this.timer = setTimeout(function () {
                if (this.value!=this.lastEmittedValue) {
                    this.$emit('changed', this.value, this.id);
                }
                this.lastEmittedValue = this.value;
            }.bind(this), MIN_TIME_BETWEEN_VOL_UPDATES);
        },
    },
    computed: {
        noPlayer () {
            return !this.$store.state.players || this.$store.state.players.length<1
        },
        coloredToolbars() {
            return this.$store.state.coloredToolbars
        },
        incTooltip() {
            return this.trans.incVol + (undefined==this.name ? '' : (' (' + this.name + ')'))
        },
        decTooltip() {
            return this.trans.decVol + (undefined==this.name ? '' : (' (' + this.name + ')'))
        },
        displayKeyboardShortcut() {
            return this.$store.state.keyboardControl && !IS_MOBILE && undefined==this.id
        },
    },
    watch: {
        'value': function(newVal) {
            if (newVal>=0 && this.moving) {
                let time = new Date().getTime();
                if (undefined==this.lastTime || time-this.lastTime>=MIN_TIME_BETWEEN_VOL_UPDATES) {
                    this.$emit('changed', newVal, this.id);
                    this.lastTime = time;
                    this.lastEmittedValue = newVal;
                    this.cancelTimer();
                } else {
                    this.resetTimer();
                }
            }
        }
    },
    filters: {
        displayVal: function (value, dvc, name) {
            return VOL_FIXED==dvc ? undefined!=name ? name : '' : ((undefined!=name ? name+': ' : '') + (isNaN(value) ? 0 : value)+'%');
        },
        tooltip: function (str, key, showShortcut) {
            return showShortcut && undefined!=key? ttShortcutStr(str, key, false, true) : str;
        }
    }
})
