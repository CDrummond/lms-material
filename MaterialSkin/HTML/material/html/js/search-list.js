/**
 * LMS-Material
 *
 * Copyright (c) 2018-2026 Craig Drummond <craig.p.drummond@gmail.com>
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
 <v-text-field :label="notFoundTimer ? i18n('Not found') : ACTIONS[SEARCH_LIST_ACTION].title+(undefined==title ? '' : SEPARATOR+title)" persistent-hint :error="notFoundTimer" clearable autocorrect="off" v-model.lazy="term" class="lms-search lib-search" @input="textChanged($event)" @blur="stopDebounce" v-on:keyup.enter="searchNow(false)" @click:clear="cleared" ref="entry"></v-text-field>
 <v-btn flat v-if="!empty" icon :title="i18n('Previous match')" :disabled="notFoundTimer" style="margin-right:-6px!important" class="toolbar-button" @click="searchNow(true)"><v-icon>arrow_upward</v-icon></v-btn>
 <v-btn flat v-if="!empty" icon :title="i18n('Next match')" :disabled="notFoundTimer" style="margin-right:-6px!important" class="toolbar-button" @click="searchNow(false)"><v-icon>arrow_downward</v-icon></v-btn>
 <v-btn flat v-if="msearch" icon :title="ACTIONS[SEARCH_LIB_ACTION].title" :disabled="notFoundTimer" class="toolbar-button" @click="searchMusic"><img class="svg-img" :src="ACTIONS[SEARCH_LIB_ACTION].svg | svgIcon(darkUi)"></img></v-btn>
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
        },
        title: {
            type: String
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
        this.lastSearch = undefined;
        this.commands = [];
        this.searching = false;
        this.currentIndex = -1;

        this.indexes = [];
        if (this.view.items.length>0 && undefined!=this.view.items[0].searchcat) {
            for (let i=0, loop=this.view.items, len=loop.length; i<len; ++i) {
                if (undefined!=loop[i].items) {
                    for (let j=0, jlen=loop[i].items.length; j<jlen; ++j) {
                        this.indexes.push([i, j]);
                    }
                } else {
                    this.indexes.push([i, -1]);
                }
            }
        }

        // On mobile devices delay focus in case invoked from menu
        if (IS_MOBILE) {
            setTimeout(function() { focusEntry(this) }.bind(this), 150);
        } else {
            focusEntry(this);
        }
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
        getItem(idx) {
            let item = this.view.items[idx[0]];
            if (undefined==item.items || idx[1]<0) {
                return item;
            }
            return item.items[idx[1]];
        },
        searchFor(str, start, backwards) {
            if (this.indexes.length>0) {
                for (let idx = start, loop=this.indexes, len=loop.length; backwards ? idx>=0 : idx<len; idx+=(backwards ? -1 : 1)) {
                    if (!this.view.items[this.indexes[idx][0]].header && searchListHasStr(this.getItem(this.indexes[idx]), str)) {
                        this.currentIndex = idx;
                        this.$emit('scrollTo', this.indexes[idx][0], this.indexes[idx][1]);
                        this.lastSearch = str;
                        return true;
                    }
                }
            } else {
                for (let idx = start, loop=this.view.items, len=loop.length; backwards ? idx>=0 : idx<len; idx+=(backwards ? -1 : 1)) {
                    if (!this.view.items[idx].header && searchListHasStr(this.view.items[idx], str)) {
                        this.currentIndex = idx;
                        this.$emit('scrollTo', this.currentIndex, -1);
                        this.lastSearch = str;
                        return true;
                    }
                }
            }
            return false;
        },
        cleared() {
            this.lastSearch = undefined;
            this.currentIndex = -1;
            this.$emit('scrollTo', -1, -1);
        },
        searchNow(backwards) {
            this.cancel();
            if (undefined==this.term) {
                return;
            }
            let str = this.term.trim().replace(/\s+/g, " ");
            if (!isEmpty(str)) {
                str = str.toLowerCase();
                let loop = this.indexes.length>0 ? this.indexes : this.view.items;
                let len = loop.length;
                let start = -1==this.currentIndex || this.currentIndex>=len ? backwards ? len-1 : 0 : (backwards ? (this.currentIndex-1) : (this.currentIndex+1));
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
                }.bind(this), 1000);
            }
        },
        searchMusic() {
            bus.$emit('browse-search', undefined==this.term ? "" : this.term.trim().replace(/\s+/g, " "));
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
            if (undefined!=loop[idx].items) {
                for (let j = 0, jloop=loop[idx].items, jlen=jloop.length; j<jlen; j++) {
                    if (undefined!=jloop[j].string_search_cache) {
                        delete jloop[j].string_search_cache;
                    }
                }
            }
        }
    }
})

