/**
 * LMS-Material
 *
 * Copyright (c) 2018-2020 Craig Drummond <craig.p.drummond@gmail.com>
 * MIT license.
 */

Vue.component('lms-search-dialog', {
    template: `
<v-dialog v-model="show" v-if="show" persistent scrollable width="600">
 <v-card>
  <v-card-title>{{i18n("Search library")}}</v-card-title>
  <v-form ref="form" v-model="valid" lazy-validation>
   <v-list two-line>
    <v-list-tile>
     <v-text-field :label="i18n('Term')" clearable v-model="term" class="lms-search" @keyup.enter="search()" ref="entry"></v-text-field>
    </v-list-tile>
    <v-list-tile>
     <v-select :label="i18n('Category')" :items="categories" v-model="category" item-text="label" item-value="value"></v-select>
    </v-list-tile>
   </v-list>
  </v-form>
  <v-card-actions>
   <v-btn flat @click.native="advanced()" id="advanced-search-btn">{{i18n('Advanced')}}</v-btn>
   <v-spacer></v-spacer>
   <v-btn flat @click.native="cancel()">{{i18n('Cancel')}}</v-btn>
   <v-btn flat @click.native="search()">{{i18n('Search')}}</v-btn
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
            term: ""
        }
    },
    mounted() {
        bus.$on('search.open', function() {
            this.term = "";
            this.show = true;
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
            this.show=false;
        },
        advanced() {
            this.cancel();
            bus.$emit('dlg.open', 'iframe', '/material/advanced_search.html?player='+this.$store.state.player.id, i18n('Advanced search'));
        },
        search() {
            var str = this.term.trim();
            if (str.length>1) {
                this.show=false;
                var command=[];
                var params=[];
                if (0==this.category) {
                    command=["search"]; params=["tags:jlyAdt", "extended:1", "term:"+str];
                } else if (1==this.category) {
                    command=["artists"]; params=["tags:s", "search:"+str];
                } else if (2==this.category) {
                    command=["albums"]; params=[ALBUM_TAGS, "search:"+str];
                } else if (3==this.category) {
                    command=["tracks"]; params=[TRACK_TAGS, "search:"+str];
                } else if (4==this.category) {
                   command=["playlists"]; params=["tags:su", "search:"+str];
                } else {
                    return;
                }
                var libId = this.$store.state.library ? this.$store.state.library : LMS_DEFAULT_LIBRARY;
                if (libId) {
                     params.push("library_id:"+libId);
                }
                bus.$emit('searchLib', command, params, str);
                this.show=false;
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

