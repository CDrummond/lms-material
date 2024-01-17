/**
 * LMS-Material
 *
 * Copyright (c) 2018-2024 Craig Drummond <craig.p.drummond@gmail.com>
 * MIT license.
 */
'use strict';

function searchListFlatten(item) {
    if (Array.isArray(item)) {
        let vals = [];
        for (let i=0, len=item.length; i<len; ++i) {
            vals.push(stripTags(""+item[i]).toLowerCase());
        }
        return vals.join(" ");
    }
    return stripTags(""+item).toLowerCase();
}

function searchListHasStr(a, b) {
    if (undefined==a) {
        return false;
    }
    if (undefined==a.string_search_cache) {
        let strings = [];
        if (undefined!=a.title) {
            strings.push(searchListFlatten(a.title));
        }
        if (undefined!=a.subtitle) {
            strings.push(searchListFlatten(a.subtitle));
        }
        if (undefined!=a.artistAlbum) {
            strings.push(searchListFlatten(a.artistAlbum));
        }
        a.string_search_cache = strings.join(" ");
    }
    return a.string_search_cache.indexOf(b)>=0;
}

Vue.component('lms-search-list', {
    template: `
<v-layout>
 <v-text-field :label="notFoundTimer ? i18n('Not found') : ACTIONS[SEARCH_LIST_ACTION].title" persistent-hint :error="notFoundTimer" :single-line="!notFoundTimer" clearable autocorrect="off" v-model.lazy="term" class="lms-search lib-search" @input="textChanged($event)" @blur="stopDebounce" v-on:keyup.enter="searchNow(false)" @click:clear="cleared" ref="entry"></v-text-field>
 <v-btn flat v-if="!empty" icon :title="i18n('Previous match')" :disabled="notFoundTimer" style="margin-right:-6px!important" class="toolbar-button" @click="searchNow(true)"><v-icon>arrow_upward</v-icon></v-btn>
 <v-btn flat v-if="!empty" icon :title="i18n('Next match')" :disabled="notFoundTimer" style="margin-right:-6px!important" class="toolbar-button" @click="searchNow(false)"><v-icon>arrow_downward</v-icon></v-btn>
 <v-btn flat v-if="msearch" icon :title="i18n('Search library')" :disabled="notFoundTimer" class="toolbar-button" @click="searchMusic"><img class="svg-img" :src="'search-library' | svgIcon(darkUi)"></img></v-btn>
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
        this.lastSearch = undefined;
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
        searchFor(str, start, backwards) {
            for (let idx = start, loop=this.view.items, len=loop.length; backwards ? idx>=0 : idx<len; idx+=(backwards ? -1 : 1)) {
                if (searchListHasStr(this.view.items[idx], str)) {
                    this.currentIndex = idx;
                    this.$emit('scrollTo', idx);
                    this.lastSearch = str;
                    return true;
                }
            }
            return false;
        },
        cleared() {
            this.lastSearch = undefined;
            this.currentIndex = -1;
            this.$emit('scrollTo', this.currentIndex);
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
                if (this.searchFor(str, start, backwards)) {
                    return;
                }
                if (str!=this.lastSearch) {
                    this.lastSearch = str;
                    if (this.searchFor(str, 0, false)) {
                        return;
                    }
                }
                this.notFoundTimer = setTimeout(function () {
                    this.notFoundTimer = undefined;
                    focusEntry(this);
                }.bind(this), 1000);
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
        for (let idx = 0, loop=this.view.items, len=loop.length; idx<len; idx++) {
            if (undefined!=loop[idx].string_search_cache) {
                delete loop[idx].string_search_cache;
            }
        }
    }
})

