/**
 * LMS-Material
 *
 * Copyright (c) 2018-2022 Craig Drummond <craig.p.drummond@gmail.com>
 * MIT license.
 */
'use strict';

const SEARCH_OTHER = new Set(['bbc sounds', 'deezer', 'qobuz', 'spotty', 'tidal', 'youtube']);

function buildSearchResp(results) {
    let items=[];
    let total=0;
    for (let i=0, len=results.length; i<len; ++i) {
        let all = [];
        let numItems = results[i].resp.items.length;
        let clamped = 5!=results[i].command.cat && numItems>LMS_INITIAL_SEARCH_RESULTS
        let limit = clamped ? LMS_INITIAL_SEARCH_RESULTS : numItems;
        let titleParam = clamped ? limit+" / "+numItems : numItems;
        let filter = undefined;

        total+=numItems;
        if (1==results[i].command.cat) {
            filter = FILTER_PREFIX+"artist";
            items.push({title: i18np("1 Artist", "%1 Artists", titleParam), id:filter, header:true, hidesub:true,
                        allItems: all, subtitle: i18np("1 Artist", "%1 Artists", numItems)});
        } else if (2==results[i].command.cat) {
            filter = FILTER_PREFIX+"album";
            items.push({title: i18np("1 Album", "%1 Albums", titleParam), id:filter, header:true, hidesub:true,
                        allItems: all, subtitle: i18np("1 Album", "%1 Albums", numItems),
                        menu:[PLAY_ALL_ACTION, INSERT_ALL_ACTION, ADD_ALL_ACTION]});
        } else if (3==results[i].command.cat) {
            filter = FILTER_PREFIX+"track";
            items.push({title: i18np("1 Track", "%1 Tracks", titleParam), id:filter, header:true, hidesub:true,
                        allItems: all, subtitle: i18np("1 Track", "%1 Tracks", numItems),
                        menu:queryParams.party ? [] : [PLAY_ALL_ACTION, INSERT_ALL_ACTION, ADD_ALL_ACTION]});
        } else if (4==results[i].command.cat) {
            filter = FILTER_PREFIX+"playlist";
            items.push({title: i18np("1 Playlist", "%1 Playlists", titleParam), id:filter, header:true, hidesub:true,
                        allItems: all, subtitle: i18np("1 Playlist", "%1 Playlists", numItems),
                        menu:[PLAY_ALL_ACTION, INSERT_ALL_ACTION, ADD_ALL_ACTION]});
        } else if (5==results[i].command.cat) {
            items.push({title: i18n("Search on..."), id:"search.other", header:true});
        }
        for (let idx=0, loop=results[i].resp.items; idx<numItems; ++idx) {
            let itm = loop[idx];
            itm.filter=filter;
            if (idx<limit) {
                items.push(itm);
            }
            if (clamped) {
                all.push(itm);
            }
        }
    }
    return items;
}

let seachReqId = 0;
Vue.component('lms-search-field', {
    template: `
<v-layout>
 <v-text-field :label="i18n('Search')" single-line clearable v-model.lazy="term" class="lms-search lib-search" @input="textChanged($event)" @blur="stopDebounce" v-on:keyup.enter="searchNow" ref="entry"></v-text-field>
 <v-icon v-if="searching" class="toolbar-button pulse">search</v-icon>
 <v-btn v-else-if="!queryParams.party" :title="ACTIONS[ADV_SEARCH_ACTION].title" flat icon class="toolbar-button" @click="advanced()"><img :src="ACTIONS[ADV_SEARCH_ACTION].svg | svgIcon(darkUi)"></img></v-btn>
</v-layout>
`,
    props: [],
    data() {
        return {
            term: "",
            searching: false
        }
    },
    computed: {
        darkUi() {
            return this.$store.state.darkUi
        }
    },
    mounted() {
        this.term = getLocalStorageVal('search', '');
        this.commands=[];
        this.results=[];
        this.searching=false;
        this.str = "";
        this.prevPage = undefined;
        // If term stored in local storage then search must have happened, user browsed into results
        // and then back. If so, don't focus search field - as it causes on-screen keyboard to be shown
        // the hidde, which flickers.
        if (undefined==this.term || this.term.length<1) {
            focusEntry(this);
        }
        bus.$on('search-for', function(text, prevPage) {
            this.term = text;
            this.prevPage = prevPage;
            this.searchNow();
        }.bind(this));
    },
    methods: {
        cancel() {
            this.stopDebounce();
            if (this.searching) {
                this.commands=[];
                this.results=[];
                this.searching=false;
                seachReqId++;
            }
        },
        stopDebounce() {
            if (undefined!=this.debounceTimer) {
                clearTimeout(this.debounceTimer);
                this.debounceTimer = undefined;
            }
        },
        advanced() {
            bus.$emit('closeLibSearch');
            bus.$emit('dlg.open', 'advancedsearch', true);
        },
        textChanged(event) {
            this.stopDebounce();
            this.debounceTimer = setTimeout(function () {
                this.searchNow();
            }.bind(this), 500);
        },
        searchNow() {
            this.cancel();
            if (undefined==this.term) {
                return;
            }
            let str = this.term.trim().replace(/\s+/g, " ");
            if (str.length>1 && str!=this.str) {
                this.str = str;
                setLocalStorageVal('search', this.str);
                this.commands=[];
                if (!queryParams.party) {
                    this.commands.push({cat:1, command:["artists"], params:["tags:s", "search:"+this.str]});
                    this.commands.push({cat:2, command:["albums"], params:[(lmsOptions.showAllArtists ? ALBUM_TAGS_ALL_ARTISTS : ALBUM_TAGS)+(lmsOptions.serviceEmblems ? "E" : ""), "sort:album", "search:"+this.str]});
                }
                this.commands.push({cat:3, command:["tracks"], params:[TRACK_TAGS+"elcy"+(this.$store.state.showRating ? "R" : "")+
                                                                                         (lmsOptions.serviceEmblems ? "E" : ""), "search:"+this.str]});
                if (!queryParams.party) {
                    this.commands.push({cat:4, command:["playlists"], params:["tags:su", "search:"+this.str]});
                    this.commands.push({cat:5, command:["globalsearch", "items"], params:["menu:1", "search:"+this.str]});
                }
                let libId = this.$store.state.library ? this.$store.state.library : LMS_DEFAULT_LIBRARY;
                if (libId) {
                    for (let i=0, len=this.commands.length; i<len; ++i) {
                        this.commands[i].params.push("library_id:"+libId);
                    }
                }
                this.searching = true;
                seachReqId++;
                this.doSearch();
            }
        },
        doSearch() {
            if (!this.searching) {
                return;
            }
            if (0==this.commands.length) {
                let item = {cancache:false, title:i18n("Search") + SEPARATOR + this.str, id:SEARCH_ID, type:"search", libsearch:true};
                if (0==this.results.length) {
                    bus.$emit('showMessage', i18n('No results found'));
                } else {
                    this.results.sort(function(a, b) { return a.command.cat<b.command.cat ? -1 : 1; });
                    this.$emit('results', item, {command:[], params:[]}, { items:buildSearchResp(this.results), baseActions:[], canUseGrid: false, jumplist:[]}, this.prevPage);
                }
                this.commands=[];
                this.results=[];
                this.searching=false;
            } else {
                let command = this.commands.shift();
                lmsList(5==command.cat && this.$store.state.player ? this.$store.state.player.id : "", command.command, command.params, 5==command.cat ? 1 : 0, LMS_SEARCH_LIMIT, false, seachReqId).then(({data}) => {
                    if (data.id == seachReqId && this.searching) {
                        let resp = parseBrowseResp(data, undefined, { artistImages: setLocalStorageVal('artistImages', true), isSearch:true});
                        if (5==command.cat) {
                            // Only want to show music sources...
                            let items = resp.items;
                            resp.items = [];
                            for (let i=0, len=items.length; i<len; ++i) {
                                if (SEARCH_OTHER.has(items[i].title.toLowerCase())) {
                                    resp.items.push(items[i]);
                                }
                            }
                        }
                        if (resp.items.length>0) {
                            this.results.push({command:command, params:command.params, resp:resp});
                        }
                        this.doSearch();
                    }
                }).catch(err => {
                    this.doSearch();
                });
            }
        },
        i18n(str) {
            return i18n(str);
        }
    },
    beforeDestroy() {
        this.cancel();
    },
    filters: {
        svgIcon: function (name, dark) {
            return "/material/svg/"+name+"?c="+(dark ? LMS_DARK_SVG : LMS_LIGHT_SVG)+"&r="+LMS_MATERIAL_REVISION;
        }
    }
})

