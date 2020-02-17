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
    <v-list-tile>
     <v-text-field :disabled="searching" :label="i18n('Term')" clearable v-model="term" class="lms-search" @keyup.enter="search()" ref="entry"></v-text-field>
    </v-list-tile>
    <v-list-tile>
     <v-select :disabled="searching" :label="i18n('Category')" :items="categories" v-model="category" item-text="label" item-value="value"></v-select>
    </v-list-tile>
   </v-list>
  </v-form>
  <v-card-actions>
   <div v-if="searching" style="padding-left:8px">{{i18n('Searching...')}}</div>
   <v-btn flat v-else @click.native="advanced()" id="advanced-search-btn">{{i18n('Advanced')}}</v-btn>
   <v-spacer></v-spacer>
   <v-btn flat @click.native="cancel()">{{i18n('Cancel')}}</v-btn>
   <v-btn flat v-if="!searching" @click.native="search()">{{i18n('Search')}}</v-btn
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
                              { label:i18n("Tracks"), value: 3 },
                              { label:i18n("Playlists"), value: 4 } ];
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
            bus.$emit('dlg.open', 'iframe', '/material/advanced_search.html?player='+this.$store.state.player.id, i18n('Advanced search'));
        },
        search() {
            this.str = this.term.trim();
            if (this.str.length>1) {
                this.commands=[];
                if (0==this.category || 1==this.category) {
                    this.commands.push({cat:1, command:["artists"], params:["tags:s", "search:"+this.str]});
                }
                if (0==this.category || 2==this.category) {
                    this.commands.push({cat:2, command:["albums"], params:[ALBUM_TAGS, "sort:album", "search:"+this.str]});
                }
                if (0==this.category || 3==this.category) {
                    this.commands.push({cat:3, command:["tracks"], params:[TRACK_TAGS+"elcy", "search:"+this.str]});
                }
                if (0==this.category || 4==this.category) {
                   this.commands.push({cat:4, command:["playlists"], params:["tags:su", "search:"+this.str]});
                }
                if (this.commands.length<1) {
                    return;
                }
                var libId = this.$store.state.library ? this.$store.state.library : LMS_DEFAULT_LIBRARY;
                if (libId) {
                    for (var i=0, len=this.commands.length; i<len; ++i) {
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
                var item = {cancache:false, title:i18n("Search") + SEPARATOR + this.str, id:SEARCH_ID, type:"search", libsearch:true};
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
                    var items=[];
                    var total=0;
                    for (var i=0, len=this.results.length; i<len; ++i) {
                        var all = [];
                        var numItems = this.results[i].resp.items.length;
                        var clamped = numItems>LMS_INITIAL_SEARCH_RESULTS
                        var limit = clamped ? LMS_INITIAL_SEARCH_RESULTS : numItems;
                        var titleParam = clamped ? limit+" / "+numItems : numItems;

                        total+=numItems;
                        if (1==this.results[i].command.cat) {
                            items.push({title: i18np("1 Artist", "%1 Artists", titleParam), id:"search.artists", header:true,
                                        allSearchResults: all, subtitle: i18np("1 Artist", "%1 Artists", numItems)});
                        } else if (2==this.results[i].command.cat) {
                            items.push({title: i18np("1 Album", "%1 Albums", titleParam), id:"search.albums", header:true,
                                        allSearchResults: all, subtitle: i18np("1 Album", "%1 Albums", numItems),
                                        menu:[PLAY_ALL_ACTION, INSERT_ALL_ACTION, ADD_ALL_ACTION]});
                        } else if (3==this.results[i].command.cat) {
                            items.push({title: i18np("1 Track", "%1 Tracks", titleParam), id:"search.tracks", header:true,
                                        allSearchResults: all, subtitle: i18np("1 Track", "%1 Tracks", numItems),
                                        menu:[PLAY_ALL_ACTION, INSERT_ALL_ACTION, ADD_ALL_ACTION]});
                        } else if (4==this.results[i].command.cat) {
                            items.push({title: i18np("1 Playlist", "%1 Playlists", titleParam), id:"search.playlists", header:true,
                                        allSearchResults: all, subtitle: i18np("1 Playlist", "%1 Playlists", numItems)});
                        }
                        for (var idx=0, loop=this.results[i].resp.items; idx<numItems; ++idx) {
                            if (idx<limit) {
                                items.push(loop[idx]);
                            }
                            if (clamped) {
                                all.push(loop[idx]);
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
                var command = this.commands.shift();
                lmsList("", command.command, command.params, 0, LMS_SEARCH_LIMIT, false).then(({data}) => {
                    var resp = parseBrowseResp(data, undefined, { artistImages: setLocalStorageVal('artistImages', true)});
                    if (resp.items.length>0) {
                        this.results.push({command:command, params:command.params, resp:resp});
                    }
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

