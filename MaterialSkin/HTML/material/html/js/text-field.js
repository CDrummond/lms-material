/**
 * LMS-Material
 *
 * Copyright (c) 2018-2022 Craig Drummond <craig.p.drummond@gmail.com>
 * MIT license.
 */
'use strict';

Vue.component('text-field', {
    template: `
 <v-text-field :label="title" :autofocus="focus" v-model.lazy="term" single-line clearable class="lms-search" @input="textChanged($event)" v-on:keyup.enter="emitValue" :append-icon="IS_MOBILE && term && type=='search' ? 'search' : ''" @click:append="emitValue" @blur="stopDebounce"></v-text-field>
`,
    props: ['title', 'focus', 'type'],
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
            this.debounceTimer = setTimeout(function () {
                this.emitValue();
            }.bind(this), 500);
        },
        emitValue() {
            this.stopDebounce();
            let str = this.term.trim();
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

