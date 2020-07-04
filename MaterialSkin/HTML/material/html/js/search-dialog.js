/**
 * LMS-Material
 *
 * Copyright (c) 2018-2020 Craig Drummond <craig.p.drummond@gmail.com>
 * MIT license.
 */
'use strict';

Vue.component('lms-search-dialog', {
    template: `
<v-dialog v-model="show" v-if="show" persistent scrollable width="600">
 <v-card>
  <v-card-title>{{i18n("Search library")}}</v-card-title>
  <v-form ref="form" v-model="valid" lazy-validation>
   <v-list two-line>
    <v-list-item>
     <v-text-field :disabled="searching" :label="i18n('Term')" clearable v-model="term" class="lms-search" @keyup.enter="search()" ref="entry"></v-text-field>
    </v-list-item>
    <v-list-item>
     <v-select :disabled="searching" :label="i18n('Category')" :items="categories" v-model="category" item-text="label" item-value="value"></v-select>
    </v-list-item>
   </v-list>
  </v-form>
  <v-card-actions>
   <div v-if="searching" style="padding-left:8px">{{i18n('Searching...')}}</div>
   <v-btn text v-else @click.native="advanced()" id="advanced-search-btn">{{i18n('Advanced')}}</v-btn>
   <v-spacer></v-spacer>
   <v-btn text @click.native="cancel()">{{i18n('Cancel')}}</v-btn>
   <v-btn text v-if="!searching" @click.native="search()">{{i18n('Search')}}</v-btn
  </v-card-actions>
 </v-card>
</v-dialog>
`,
    props: [],
    data() {
        return {
            valid:false,
            categories: [],
            show: false,
            category: 0,
            term: "",
            searching: false
        }
    },
    mounted() {
        bus.$on('search.open', function() {
            this.term = "";
            this.show = true;
            this.commands=[];
            this.results=[];
            this.searching=false;
            focusEntry(this);
        }.bind(this));
        bus.$on('langChanged', function() {
            this.initItems();
        }.bind(this));
        this.initItems();
        bus.$on('esc', function() {
            if (this.$store.state.activeDialog == 'search') {
                this.show=false;
            }
        }.bind(this));
    },
    methods: {
        initItems() {
            this.categories=[ { label:i18n("All"), value: 0},
                              { label:i18n("Artists"), value: 1 },
                              { label:i18n("Albums"), value: 2 },
                              { label:i18n("Tracks"), value: 3 } ];
        },
        cancel() {
            if (this.searching) {
                this.commands=[];
                this.results=[];
                this.searching=false;
            } else {
                this.show=false;
            }
        },
        advanced() {
            this.cancel();
            bus.$emit('dlg.open', 'iframe', '/material/advanced_search.html?player='+this.$store.state.player.id, i18n('Advanced search')+SEPARATOR+this.$store.state.player.name);
        },
        search() {
            this.str = this.term.trim();
            if (this.str.length>1) {
                this.commands=[];
                if (0==this.category || 1==this.category) {
                    this.commands.push({cat:1, command:["artists"], params:["tags:s", "search:"+this.str]});
                }
                if (0==this.category || 2==this.category) {
                    this.commands.push({cat:2, command:["albums"], params:[ALBUM_TAGS+(lmsOptions.serviceEmblems ? "E" : ""), "sort:album", "search:"+this.str]});
                }
                if (0==this.category || 3==this.category) {
                    this.commands.push({cat:3, command:["tracks"], params:[TRACK_TAGS+"elcy"+(this.$store.state.ratingsSupport ? "R" : "")+
                                                                                             (lmsOptions.serviceEmblems ? "E" : ""), "search:"+this.str]});
                }
                if (this.commands.length<1) {
                    return;
                }
                let libId = this.$store.state.library ? this.$store.state.library : LMS_DEFAULT_LIBRARY;
                if (libId) {
                    for (let i=0, len=this.commands.length; i<len; ++i) {
                        this.commands[i].params.push("library_id:"+libId);
                    }
                }
                this.searching = true;
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
                    bus.$emit('libSeachResults', item, {command:[], params:[]}, {items: [], baseActions:[], canUseGrid: false, jumplist:[] });
                } else if (1==this.results.length) {
                    item.id = SEARCH_ID+":"+this.results[0].command.command[0];
                    bus.$emit('libSeachResults', item,
                                {command: this.results[0].command.command, params:this.results[0].command.params},
                                this.results[0].resp);
                } else {
                    this.results.sort(function(a, b) { return a.command.cat<b.command.cat ? -1 : 1; });
                    item.id = SEARCH_ID+":all";
                    let items=[];
                    let total=0;
                    for (let i=0, len=this.results.length; i<len; ++i) {
                        let all = [];
                        let numItems = this.results[i].resp.items.length;
                        let clamped = numItems>LMS_INITIAL_SEARCH_RESULTS
                        let limit = clamped ? LMS_INITIAL_SEARCH_RESULTS : numItems;
                        let titleParam = clamped ? limit+" / "+numItems : numItems;
                        let filter = undefined;

                        total+=numItems;
                        if (1==this.results[i].command.cat) {
                            filter = FILTER_PREFIX+"artist";
                            items.push({title: i18np("1 Artist", "%1 Artists", titleParam), id:filter, header:true,
                                        allSearchResults: all, subtitle: i18np("1 Artist", "%1 Artists", numItems)});
                        } else if (2==this.results[i].command.cat) {
                            filter = FILTER_PREFIX+"album";
                            items.push({title: i18np("1 Album", "%1 Albums", titleParam), id:filter, header:true,
                                        allSearchResults: all, subtitle: i18np("1 Album", "%1 Albums", numItems),
                                        menu:[PLAY_ALL_ACTION, INSERT_ALL_ACTION, ADD_ALL_ACTION]});
                        } else if (3==this.results[i].command.cat) {
                            filter = FILTER_PREFIX+"track";
                            items.push({title: i18np("1 Track", "%1 Tracks", titleParam), id:filter, header:true,
                                        allSearchResults: all, subtitle: i18np("1 Track", "%1 Tracks", numItems),
                                        menu:[PLAY_ALL_ACTION, INSERT_ALL_ACTION, ADD_ALL_ACTION]});
                        }
                        for (let idx=0, loop=this.results[i].resp.items; idx<numItems; ++idx) {
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
                    bus.$emit('libSeachResults', item, {command:[], params:[]},
                              { items:items, baseActions:[], canUseGrid: false, jumplist:[]});
                }
                this.commands=[];
                this.results=[];
                this.searching=false;
                this.show = false;
            } else {
                let command = this.commands.shift();
                lmsList("", command.command, command.params, 0, LMS_SEARCH_LIMIT, false).then(({data}) => {
                    let resp = parseBrowseResp(data, undefined, { artistImages: setLocalStorageVal('artistImages', true)});
                    if (resp.items.length>0) {
                        this.results.push({command:command, params:command.params, resp:resp});
                    }
                    this.doSearch();
                }).catch(err => {
                    this.doSearch();
                });
            }
        },
        i18n(str) {
            if (this.show) {
                return i18n(str);
            } else {
                return str;
            }
        }
    },
    watch: {
        'show': function(val) {
            this.$store.commit('dialogOpen', {name:'search', shown:val});
        }
    }
})

