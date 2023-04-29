/**
 * LMS-Material
 *
 * Copyright (c) 2018-2023 Craig Drummond <craig.p.drummond@gmail.com>
 * MIT license.
 */
'use strict';

Vue.component('volume-control', {
    template: `
<v-layout row wrap :class="'vol-control-'+layout">
 <v-flex xs12 v-if="layout==0"><p class="vol-text link-item noselect" v-bind:class="{'pulse':!noPlayer && value==0 && playing}" @click.middle="toggleMute" v-longpress="toggleMuteLabel">{{value|displayVal(dvc, name)}}</p></v-flex>
 <v-flex :disabled="VOL_HIDDEN==dvc" xs12>
  <v-layout>
   <v-btn flat icon @wheel="wheel($event)" @click.middle="toggleMute" v-longpress:repeat="dec" class="vol-btn vol-left"><v-icon>{{muted ? 'volume_off' : 'volume_down'}}</v-icon></v-btn>
   <v-slider :disabled="VOL_FIXED==dvc || noPlayer || queryParams.party" step="1" v-model="value" @wheel.native="wheel($event)" @click.middle="toggleMute" class="vol-slider" @start="start" @end="end"></v-slider>
   <v-btn flat icon @wheel="wheel($event)" @click.middle="toggleMute" v-longpress:repeat="inc" class="vol-btn vol-right"><v-icon>{{muted ? 'volume_off' : 'volume_up'}}</v-icon></v-btn>
   <p v-if="layout==1" class="vol-full-label" v-bind:class="{'link-item-ct':coloredToolbars,'link-item':!coloredToolbars,'disabled':noPlayer,'dimmed':muted,'pulse':!noPlayer && value==0 && playing}" @click.middle="toggleMute" v-longpress="toggleMuteLabel" id="vol-label">{{value|displayVal(dvc)}}</p>
   <p v-if="layout==2 && VOL_STD==dvc" class="pmgr-vol link-item noselect" v-bind:class="{'pulse':value==0 && playing}" @click.middle="toggleMute" v-longpress="toggleMuteLabel">{{value|displayVal(dvc)}}</p>
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
    mounted() {
        this.moving = false;
        this.lastTime = undefined;
        this.lastEmittedValue = -1;
    },
    beforeDestroy() {
        this.cancelTimer();
    },
    methods: {
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
        start() {
            this.lastEmittedValue = this.value;
            this.$emit('moving', true);
        },
        end() {
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
        }
    },
    watch: {
        'value': function(newVal) {
            if (newVal>=0) {
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
            return VOL_FIXED==dvc ? '' : ((undefined!=name ? name+': ' : '') + value+'%');
        }
    }
})
