/**
 * LMS-Material
 *
 * Copyright (c) 2018-2023 Craig Drummond <craig.p.drummond@gmail.com>
 * MIT license.
 */
'use strict';

Vue.component('text-field', {
    template: `
 <v-text-field :label="title" :autofocus="focus" v-model.lazy="term" single-line clearable class="lms-search" @input="textChanged($event)" v-on:keyup.enter="emitValue" :append-icon="IS_MOBILE && undefined!=term && term.length>0 ? (type=='search' ? 'search' : 'check') : ''" @click:append="emitValue" @blur="stopDebounce"></v-text-field>
`,
    props: {
        title:String,
        focus:Boolean,
        type:String,
        debounce:Number
    },
    data() {
        return {
            term: ""
        }
    },
    mounted() {
        this.term = "";
    },
    methods: {
        stopDebounce() {
            if (undefined!=this.debounceTimer) {
                clearTimeout(this.debounceTimer);
                this.debounceTimer = undefined;
            }
        },
        textChanged(event) {
            this.stopDebounce();
            if (undefined!=this.debounce && this.debounce>0) {
                this.debounceTimer = setTimeout(function () {
                    this.emitValue();
                }.bind(this), this.debounce);
            }
        },
        emitValue() {
            this.stopDebounce();
            let str = undefined==this.term ? "" : this.term.trim();
            if (!isEmpty(str)) {
                this.$emit('value', str);
            }
        },
        i18n(str) {
            return i18n(str);
        }
    },
    beforeDestroy() {
        this.stopDebounce();
    }
})

