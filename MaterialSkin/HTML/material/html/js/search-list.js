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
            if (stripTags(""+a[i]).toLowerCase().indexOf(b)>=0) {
                return true;
            }
        }
        return false;
    }
    return stripTags(""+a).toLowerCase().indexOf(b)>=0;
}

Vue.component('lms-search-list', {
    template: `
<v-layout>
 <v-text-field :label="notFoundTimer ? i18n('Not Found') : ACTIONS[SEARCH_LIST_ACTION].title" persistent-hint :error="notFoundTimer" :single-line="!notFoundTimer" clearable autocorrect="off" v-model.lazy="term" class="lms-search lib-search" @input="textChanged($event)" @blur="stopDebounce" v-on:keyup.enter="searchNow(false)" ref="entry"></v-text-field>
 <v-btn flat v-if="msearch && !empty" icon :title="i18n('Search library')" :disabled="notFoundTimer || empty" style="margin-right:-6px!important" class="toolbar-button" @click="searchMusic"><img class="svg-img" :src="'search-library' | svgIcon(darkUi)"></img></v-btn>
 <v-btn flat icon :title="i18n('Previous match')" :disabled="notFoundTimer || empty" class="toolbar-button" @click="searchNow(true)"><v-icon>arrow_upward</v-icon></v-btn>
 <v-btn flat icon :title="i18n('Next match')" :disabled="notFoundTimer || empty" style="margin-left:-6px!important" class="toolbar-button" @click="searchNow(false)"><v-icon>arrow_downward</v-icon></v-btn>
</v-layout>
`,
    props: {
        view: {
            type: Object,
            required: true
        },
        msearch: {
            type: Boolean,
            required: false
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
    filters: {
        svgIcon: function (name, dark) {
            return "/material/svg/"+name+"?c="+(dark ? LMS_DARK_SVG : LMS_LIGHT_SVG)+"&r="+LMS_MATERIAL_REVISION;
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
        searchMusic() {
            bus.$emit('browse-search', this.term.trim().replace(/\s+/g, " "));
        },
        i18n(str) {
            return i18n(str);
        }
    },
    beforeDestroy() {
        this.cancel();
    }
})

