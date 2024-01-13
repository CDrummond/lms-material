/**
 * LMS-Material
 *
 * Copyright (c) 2018-2024 Craig Drummond <craig.p.drummond@gmail.com>
 * MIT license.
 */
'use strict';

function searchListHasStr(a, b) {
    if (undefined==a) {
        return false;
    }
    if (Array.isArray(a)) {
        for (let i=0, len=a.length; i<len; ++i) {
            if (a[i].toLowerCase().indexOf(b)>=0) {
                return true;
            }
        }
        return false;
    }
    return a.toLowerCase().indexOf(b)>=0;
}

Vue.component('lms-search-list', {
    template: `
<v-layout>
 <div v-if="notFoundTimer" style="padding-top:12px; width:100%">{{i18n("Not Found")}}</div>
 <v-text-field v-else :label="ACTIONS[SEARCH_LIST_ACTION].title" single-line clearable autocorrect="off" v-model.lazy="term" class="lms-search lib-search" @input="textChanged($event)" @blur="stopDebounce" v-on:keyup.enter="searchNow(false)" ref="entry"></v-text-field>
 <v-btn flat icon :disabled="notFoundTimer || empty" class="toolbar-button" @click="searchNow(true)"><v-icon>arrow_upward</v-icon></v-btn>
 <v-btn flat icon :disabled="notFoundTimer || empty" style="margin-left:-12px!important" class="toolbar-button" @click="searchNow(false)"><v-icon>arrow_downward</v-icon></v-btn>
</v-layout>
`,
    props: {
        view: {
            type: Object,
            required: true
        }
    },
    data() {
        return {
            term: "",
            notFoundTimer: undefined
        }
    },
    computed: {
        darkUi() {
            return this.$store.state.darkUi
        },
        empty() {
            return null==this.term || undefined==this.term || isEmpty(this.term.trim())
        }
    },
    mounted() {
        this.term = "";
        this.commands = [];
        this.searching = false;
        this.currentIndex = -1;
        focusEntry(this);
    },
    methods: {
        cancel() {
            this.stopDebounce();
            this.stopNotFound();
        },
        stopDebounce() {
            if (undefined!=this.debounceTimer) {
                clearTimeout(this.debounceTimer);
                this.debounceTimer = undefined;
            }
        },
        stopNotFound() {
            if (undefined!=this.notFoundTimer) {
                clearTimeout(this.notFoundTimer);
                this.notFoundTimer = undefined;
            }
        },
        textChanged(event) {
            this.stopDebounce();
            this.debounceTimer = setTimeout(function () {
                this.searchNow(false);
            }.bind(this), 500);
        },
        searchNow(backwards) {
            this.cancel();
            if (undefined==this.term) {
                return;
            }
            let str = this.term.trim().replace(/\s+/g, " ");
            if (!isEmpty(str)) {
                str = str.toLowerCase();
                let len = this.view.items.length;
                let start = -1==this.currentIndex || this.currentIndex>=this.view.items.length ? backwards ? len-1 : 0 : (backwards ? (this.currentIndex-1) : (this.currentIndex+1));
                for (let idx = start; backwards ? idx>=0 : idx<len; idx+=(backwards ? -1 : 1)) {
                    if (searchListHasStr(this.view.items[idx].title, str) || 
                        searchListHasStr(this.view.items[idx].subtitle, str) ||
                        searchListHasStr(this.view.items[idx].artistAlbum, str)) {
                        this.currentIndex = idx;
                        this.$emit('scrollTo', idx);
                        return;
                    }
                }
                this.notFoundTimer = setTimeout(function () {
                    this.notFoundTimer = undefined;
                    focusEntry(this);
                }.bind(this), 1000);
                this.currentIndex = -1;
            }
        },
        i18n(str) {
            return i18n(str);
        }
    },
    beforeDestroy() {
        this.cancel();
    }
})

