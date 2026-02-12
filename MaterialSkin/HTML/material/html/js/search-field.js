/**
 * LMS-Material
 *
 * Copyright (c) 2018-2026 Craig Drummond <craig.p.drummond@gmail.com>
 * MIT license.
 */
'use strict';

const SEARCH_OTHER = {
    "band's campout":{svg:"bandcamp"},
    "bbc sounds":{svg:"bbc-sounds"},
    "deezer":{svg:"deezer"},
    "qobuz":{svg:"qobuz"},
    "spotty":{svg:"spotify"},
    "tidal":{svg:"tidal"},
    "youtube":{svg:"youtube"},
    "wefunk radio":{svg:"radio-station"}
}

const SEARCH_CLAMPED_MENU = [PLAY_ALL_ACTION, INSERT_ALL_ACTION, ADD_ALL_ACTION, DIVIDER, MORE_ACTION];
const SEARCH_MENU = [PLAY_ALL_ACTION, INSERT_ALL_ACTION, ADD_ALL_ACTION];

function buildSearchResp(results) {
    let items=[];
    let total=0;
    let otherList = !getLocalStorageBool('other-grid', true);
    for (let i=0, len=results.length; i<len; ++i) {
        let all = [];
        let cat = results[i].command.cat;
        let numItems = results[i].resp.items.length;
        let clamped = SEARCH_OTHER_CAT!=cat && numItems>LMS_INITIAL_SEARCH_RESULTS
        let limit = clamped ? LMS_INITIAL_SEARCH_RESULTS : numItems;
        let titleParam = clamped ? limit+" / "+numItems : numItems;
        let filter = undefined;
        let useList = SEARCH_TRACKS_CAT==cat || (SEARCH_PLAYLISTS_CAT==cat && !lmsOptions.playlistImages) || otherList;

        total+=numItems;
        if (SEARCH_ARTISTS_CAT==cat) {
            //useList = !getLocalStorageBool('artists-grid', true);
            filter = FILTER_PREFIX+"artist";
            items.push({title: i18n("Artists") + " ("+titleParam+")", id:filter, header:true, hidesub:true, svg:"artist",
                        allItems: clamped ? all : undefined, subtitle: i18np("1 Artist", "%1 Artists", numItems), searchcat:cat, useList:useList});
        } else if (SEARCH_ALBUMS_CAT==cat) {
            //useList = !getLocalStorageBool('albums-grid', true);
            filter = FILTER_PREFIX+"album";
            items.push({title: (lmsOptions.supportReleaseTypes ? i18n("Releases") : i18n("Albums")) + " ("+titleParam+")",
                        id:filter, header:true, hidesub:true, svg: lmsOptions.supportReleaseTypes ? "release" : undefined,
                        icon: lmsOptions.supportReleaseTypes ? undefined : "album",
                        allItems: clamped ? all : undefined, subtitle:lmsOptions.supportReleaseTypes ? i18np("1 Release", "%1 Releases", numItems) : i18np("1 Album", "%1 Albums", numItems),
                        menu:queryParams.party ? undefined : clamped ? SEARCH_CLAMPED_MENU : SEARCH_MENU, searchcat:cat, useList:useList});
        } else if (SEARCH_WORKS_CAT==cat) {
            if (numItems>0) {
                //useList = !getLocalStorageBool('works-grid', true);
                filter = FILTER_PREFIX+"work";
                items.push({title: i18n("Works") + " ("+titleParam+")",
                            id:filter, header:true, hidesub:true, svg: "classical-work",
                            allItems: clamped ? all : undefined, subtitle:i18np("1 Work", "%1 Works", numItems),
                            menu:queryParams.party ? undefined : clamped ? SEARCH_CLAMPED_MENU : SEARCH_MENU, searchcat:cat, useList:useList});
            }
        } else if (SEARCH_TRACKS_CAT==cat) {
            filter = FILTER_PREFIX+"track";
            items.push({title: i18n("Tracks", titleParam) + " ("+titleParam+")", id:filter, header:true, hidesub:true,
                        allItems: clamped ? all : undefined, subtitle: i18np("1 Track", "%1 Tracks", numItems),
                        icon: "music_note",
                        menu:queryParams.party ? undefined : clamped ? SEARCH_CLAMPED_MENU : SEARCH_MENU, searchcat:cat, useList:useList});
        } else if (SEARCH_PLAYLISTS_CAT==cat) {
            //useList = !lmsOptions.playlistImages || !getLocalStorageBool('playlists-grid', true);
            filter = FILTER_PREFIX+"playlist";
            items.push({title: i18n("Playlists") + " ("+titleParam+")", id:filter, header:true, hidesub:true, icon:"list",
                        allItems: clamped ? all : undefined, subtitle: i18np("1 Playlist", "%1 Playlists", numItems),
                        menu:queryParams.party ? undefined : clamped ? SEARCH_CLAMPED_MENU : SEARCH_MENU, searchcat:cat, useList:useList});
        } else if (SEARCH_OTHER_CAT==cat) {
            //useList = !getLocalStorageBool('other-grid', true);
            items.push({title: i18n("Search on..."), id:"search.other", header:true, icon:"search", searchcat:cat, useList:useList});
        }
        let list = useList ? items : [];
        for (let idx=0, loop=results[i].resp.items; idx<numItems; ++idx) {
            let itm = loop[idx];
            itm.filter=filter;
            if (idx<limit) {
                list.push(itm);
            }
            if (clamped) {
                all.push(itm);
            }
        }
        if (!useList) {
            items.push({items: list, searchcat:cat});
        }
    }
    return items;
}

let seachReqId = 0;
Vue.component('lms-search-field', {
    template: `
<v-layout>
 <v-text-field :label="ACTIONS[SEARCH_LIB_ACTION].title" clearable autocorrect="off" v-model.lazy="term" class="lms-search lib-search" @input="textChanged($event)" @blur="stopDebounce" v-on:keyup.enter="searchNow" ref="entry"></v-text-field>
 <v-icon v-if="searching" class="toolbar-button pulse">search</v-icon>
 <v-btn v-if="!searching && !queryParams.party && history.length>0 && (history.length>1 || history[0]!=term)" flat icon class="toolbar-button" @click="showHistory()"><v-icon>history</v-icon></v-btn>
 <v-btn v-if="!searching && !queryParams.party" :title="ACTIONS[ADV_SEARCH_ACTION].title" flat icon class="toolbar-button" @click="advanced()"><img :src="ACTIONS[ADV_SEARCH_ACTION].svg | svgIcon(darkUi)"></img></v-btn>
</v-layout>
`,
    props: [],
    data() {
        return {
            term: "",
            searching: false,
            history: []
        }
    },
    computed: {
        darkUi() {
            return this.$store.state.darkUi
        }
    },
    mounted() {
        this.term = getLocalStorageVal('search', '');
        this.history = JSON.parse(getLocalStorageVal('searchHistory', '[]'));
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
            bus.$emit('dlg.open', 'advancedsearch', true, this.$store.state.library ? this.$store.state.library : LMS_DEFAULT_LIBRARY);
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
                this.addToHistory(str);
                this.commands=[];
                if (!queryParams.party) {
                    this.commands.push({cat:SEARCH_ARTISTS_CAT, command:["artists"], params:["tags:s", "search:"+this.str]});
                    this.commands.push({cat:SEARCH_ALBUMS_CAT, command:["albums"], params:[(lmsOptions.showAllArtists ? ALBUM_TAGS_ALL_ARTISTS : ALBUM_TAGS).replace("W", "")+(lmsOptions.serviceEmblems ? "E" : ""), "search:"+this.str]});
                    this.commands.push({cat:SEARCH_WORKS_CAT, command:["works"], params:["search:"+this.str]});
                }
                this.commands.push({cat:SEARCH_TRACKS_CAT, command:["tracks"], params:[SEARCH_TRACK_TAGS+"elcy"+
                                                                       (this.$store.state.showRating ? "R" : "")+
                                                                       (lmsOptions.serviceEmblems ? "E" : "")+
                                                                       (lmsOptions.techInfo ? TECH_INFO_TAGS : ""), "search:"+this.str]});
                if (!queryParams.party) {
                    this.commands.push({cat:SEARCH_PLAYLISTS_CAT, command:["playlists"], params:["tags:su", "search:"+this.str]});
                    this.commands.push({cat:SEARCH_OTHER_CAT, command:["globalsearch", "items"], params:["menu:1", "search:"+this.str]});
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
        addToHistory(str) {
            for (let i=0, len=this.history.length; i<len; ++i) {
                if (str==this.history[i]) {
                    this.history.splice(i, 1);
                    break;
                }
            }
            this.history.unshift(str);
            if (this.history.length>20) {
                this.history = this.history.slice(0, 20);
            }
            setLocalStorageVal('searchHistory', JSON.stringify(this.history));
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
                lmsList(SEARCH_OTHER_CAT==command.cat && this.$store.state.player ? this.$store.state.player.id : "", command.command, command.params, 5==command.cat ? 1 : 0, LMS_SEARCH_LIMIT, false, seachReqId).then(({data}) => {
                    if (data.id == seachReqId && this.searching) {
                        let resp = parseBrowseResp(data, undefined, {isSearch:true});
                        if (SEARCH_OTHER_CAT==command.cat) {
                            // Only want to show music sources...
                            let items = resp.items;
                            resp.items = [];
                            for (let i=0, len=items.length; i<len; ++i) {
                                let icon = SEARCH_OTHER[items[i].title.toLowerCase()];
                                if (undefined!=icon) {
                                    items[i].icon = icon.icon;
                                    items[i].svg = icon.svg;
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
        },
        showHistory() {
            let items = [];
            for (let i=0, len=this.history.length; i<len; ++i) {
                items.push({id:i, title:this.history[i], canremove:1});
            }
            let numItems = items.length;
            choose("Select previous search term", items).then(resp => {
                if (undefined!=resp) {
                    if (numItems!=resp.items.length) {
                        let history = [];
                        for (let i=0, len=resp.items.length; i<len; ++i) {
                            history.push(resp.items[i].title);
                        }
                        this.history = history;
                        setLocalStorageVal('searchHistory', JSON.stringify(this.history));
                    }
                    if (undefined!=resp.item) {
                        this.term = resp.item.title;
                        this.searchNow();
                    }
                }
            });
        }
    },
    beforeDestroy() {
        this.cancel();
    }
})

