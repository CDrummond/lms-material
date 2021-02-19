/**
 * LMS-Material
 *
 * Copyright (c) 2018-2021 Craig Drummond <craig.p.drummond@gmail.com>
 * MIT license.
 */
'use strict';

const ADVS_ANY_GENRE = -3;
const ADVS_IN_GENRE = -1;
const ADVS_NOT_IN_GENRE = -2;
const ADVS_ANY_CONTENT_TYPE = "*";

Vue.component('lms-advancedsearch-dialog', {
    template: `
<v-dialog v-model="show" v-if="show" persistent scrollable width="700">
 <v-card>
  <v-card-title>{{i18n("Advanced search")}}</v-card-title>
  <v-card-text>

   <v-layout class="avs-section" wrap>
    <v-flex xs12 sm2><div class="avs-title">{{i18n('Track')}}</div></v-flex>
    <v-flex xs12 sm4><v-select :items="textOps" v-model="params.me_titlesearch.op" item-text="label" item-value="key"></v-select></v-flex>
    <v-flex xs12 sm6><v-text-field clearable v-model="params.me_titlesearch.val" class="lms-search" ref="entry"></v-text-field></v-flex>
   </v-layout>

   <v-layout class="avs-section" wrap>
    <v-flex xs12 sm2><div class="avs-title">{{i18n('Artist')}}</div></v-flex>
    <v-flex xs12 sm4><v-select :items="textOps" v-model="params.contributor_namesearch.op" item-text="label" item-value="key"></v-select></v-flex>
    <v-flex xs12 sm6><v-text-field clearable v-model="params.contributor_namesearch.val" class="lms-search"></v-text-field></v-flex>
    <v-flex xs12 sm2></v-flex>
    <v-flex xs12 sm10>
     <v-select chips deletable-chips multiple :items="artistTypes" v-model="params.contributor_namesearch.types" item-text="label" item-value="key"></v-select>
    </v-flex>
   </v-layout>

   <v-layout class="avs-section" wrap>
    <v-flex xs12 sm2><div class="avs-title">{{i18n('Album')}}</div></v-flex>
    <v-flex xs12 sm4><v-select :items="textOps" v-model="params.album_titlesearch.op" item-text="label" item-value="key"></v-select></v-flex>
    <v-flex xs12 sm6><v-text-field clearable v-model="params.album_titlesearch.val" class="lms-search"></v-text-field></v-flex>
   </v-layout>
  
   <v-layout class="avs-section" wrap>
    <v-flex xs12 sm2><div class="avs-title">{{i18n('Genre')}}</div></v-flex>
    <v-flex xs12 sm4><v-select :items="genres" v-model="params.genre" item-text="label" item-value="key"></v-select></v-flex>
    <v-flex xs12 sm6><v-text-field clearable v-model="params.genre_name" class="lms-search" :disabled="params.genre!=ADVS_IN_GENRE && params.genre!=ADVS_NOT_IN_GENRE"></v-text-field></v-flex>
   </v-layout>

   <v-layout class="avs-section" wrap>
    <v-flex xs12 sm2><div class="avs-title">{{i18n('Duration')}}</div></v-flex>
    <v-flex xs12 sm4><v-select :items="fullRangeOps" v-model="params.secs.op" item-text="label" item-value="key"></v-select></v-flex>
    <v-flex xs12 sm6><v-text-field clearable v-model="params.secs.val" class="lms-search" :placeholder="i18n('seconds')"></v-text-field></v-flex>
   </v-layout>

   <v-layout class="avs-section" wrap>
    <v-flex xs12 sm2><div class="avs-title">{{i18n('Track#')}}</div></v-flex>
    <v-flex xs12 sm4><v-select :items="rangeOps" v-model="params.tracknum.op" item-text="label" item-value="key"></v-select></v-flex>
    <v-flex xs12 sm6><v-text-field clearable v-model="params.tracknum.val" class="lms-search"></v-text-field></v-flex>
   </v-layout>

   <v-layout class="avs-section" wrap>
    <v-flex xs12 sm2><div class="avs-title">{{i18n('Year')}}</div></v-flex>
    <v-flex xs12 sm4><v-select :items="fullRangeOps" v-model="params.year.op" item-text="label" item-value="key"></v-select></v-flex>
    <v-flex xs12 sm6><v-text-field clearable v-model="params.year.val" class="lms-search"></v-text-field></v-flex>
   </v-layout>

   <v-layout class="avs-section" wrap v-show="stats && sections.stats.visible">
    <v-flex xs12 sm2><div class="avs-title">{{i18n('Play count')}}</div></v-flex>
    <v-flex xs12 sm4><v-select :items="fullRangeOps" v-model="params.persistent_playcount.op" item-text="label" item-value="key"></v-select></v-flex>
    <v-flex xs12 sm6><v-text-field clearable v-model="params.persistent_playcount.val" class="lms-search"></v-text-field></v-flex>
   </v-layout>

   <v-layout class="avs-section" wrap v-show="stats && sections.stats.visible">
    <v-flex xs12 sm2><div class="avs-title">{{i18n('Rating')}}</div></v-flex>
    <v-flex xs12 sm4><v-select :items="fullRangeOps" v-model="params.persistent_rating.op" item-text="label" item-value="key"></v-select></v-flex>
    <v-flex xs12 sm6><v-text-field clearable v-model="params.persistent_rating.val" class="lms-search"></v-text-field></v-flex>
   </v-layout>
   
   <v-layout class="avs-section" wrap v-show="sections.tech.visible">
    <v-flex xs12 sm2><div class="avs-title">{{i18n('Bitrate')}}</div></v-flex>
    <v-flex xs12 sm4><v-select :items="rangeOps" v-model="params.bitrate.op" item-text="label" item-value="key"></v-select></v-flex>
    <v-flex xs12 sm6><v-select :items="bitrates" v-model="params.bitrate.val" item-text="label" item-value="key"></v-select ></v-flex>
   </v-layout>

   <v-layout class="avs-section" wrap v-show="sections.tech.visible">
    <v-flex xs12 sm2><div class="avs-title">{{i18n('Sample rate')}}</div></v-flex>
    <v-flex xs12 sm4><v-select :items="rangeOps" v-model="params.samplerate.op" item-text="label" item-value="key"></v-select></v-flex>
    <v-flex xs12 sm6><v-select :items="sampleRates" v-model="params.samplerate.val" item-text="label" item-value="key"></v-select ></v-flex>
   </v-layout>

   <v-layout class="avs-section" wrap v-show="sections.tech.visible">
    <v-flex xs12 sm2><div class="avs-title">{{i18n('Sample size')}}</div></v-flex>
    <v-flex xs12 sm4><v-select :items="rangeOps" v-model="params.samplesize.op" item-text="label" item-value="key"></v-select></v-flex>
    <v-flex xs12 sm6><v-select :items="sampleSizes" v-model="params.samplesize.val" item-text="label" item-value="key"></v-select ></v-flex>
   </v-layout>

   <v-layout class="avs-section" wrap v-show="sections.file.visible">
    <v-flex xs12 sm2><div class="avs-title">{{i18n('Date modified')}}</div></v-flex>
    <v-flex xs12 sm4><v-select :items="dateOps" v-model="params.timestamp.op" item-text="label" item-value="key"></v-select></v-flex>
    <v-flex xs12 sm6><v-text-field clearable v-model="params.timestamp.val" class="lms-search" placeholder="mm/dd/yyyy"></v-text-field></v-flex>
   </v-layout>

   <v-layout class="avs-section" wrap v-show="sections.file.visible">
    <v-flex xs12 sm2><div class="avs-title">{{i18n('File format')}}</div></v-flex>
    <v-flex xs12 sm10><v-select :items="fileFormats" v-model="params.content_type" item-text="label" item-value="key"></v-select></v-flex>
   </v-layout>

   <v-layout class="avs-section" wrap v-show="sections.file.visible">
    <v-flex xs12 sm2><div class="avs-title">{{i18n('Path')}}</div></v-flex>
    <v-flex xs12 sm4><v-select :items="textOps" v-model="params.url.op" item-text="label" item-value="key"></v-select></v-flex>
    <v-flex xs12 sm6><v-text-field clearable v-model="params.url.val" class="lms-search"></v-text-field></v-flex>
   </v-layout>

  <v-layout class="avs-section" wrap v-show="sections.file.visible">
    <v-flex xs12 sm2><div class="avs-title">{{i18n('File size')}}</div></v-flex>
    <v-flex xs12 sm4><v-select :items="fullRangeOps" v-model="params.filesize.op" item-text="label" item-value="key"></v-select></v-flex>
    <v-flex xs12 sm6><v-text-field clearable v-model="params.filesize.val" class="lms-search" :placeholder="i18n('bytes')"></v-text-field></v-flex>
   </v-layout>

   <v-layout class="avs-section" wrap>
    <v-flex xs12 sm2><div class="avs-title">{{i18n('Comment')}}</div></v-flex>
    <v-flex xs12 sm4><v-select :items="textOps" v-model="params.comments_value.op" item-text="label" item-value="key"></v-select></v-flex>
    <v-flex xs12 sm6><v-text-field clearable v-model="params.comments_value.val" class="lms-search"></v-text-field></v-flex>
   </v-layout>

   <v-layout class="avs-section" wrap>
    <v-flex xs12 sm2><div class="avs-title">{{i18n('Lyrics')}}</div></v-flex>
    <v-flex xs12 sm4><v-select :items="textOps" v-model="params.lyrics.op" item-text="label" item-value="key"></v-select></v-flex>
    <v-flex xs12 sm6><v-text-field clearable v-model="params.lyrics.val" class="lms-search"></v-text-field></v-flex>
   </v-layout>

  </v-card-text>

  <v-card-actions>
   <div v-if="searching" style="padding-left:8px">{{i18n('Searching...')}}</div>
   <v-menu v-else top v-model="showMenu">
   <v-btn icon slot="activator"><v-icon>settings</v-icon></v-btn>
   <v-list>
    <template v-for="(sect, index) in sections">
     <v-list-tile @click="sect.visible=!sect.visible" v-if="stats || !sect.isstats">
      <v-list-tile-avatar><v-icon>{{sect.visible ? 'check_box' : 'check_box_outline_blank'}}</v-icon></v-list-tile-avatar>
      <v-list-tile-content><v-list-tile-title>{{sect.label}}</v-list-tile-title></v-list-tile-content>
     </v-list-tile>
    </template>
   </v-list>
   </v-menu>
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
            show: false,
            showMenu: false,
            searching: false,
            textOps: [],
            rangeOps: [],
            fullRangeOps: [],
            dateOps: [],
            contentTypes: [],
            sampleRates: [],
            sampleSizes: [],
            bitrates: [],
            fileFormats: [],
            artistTypes: [],
            genres: [],
            params: {
                me_titlesearch: {val:undefined, op:"LIKE"},
                contributor_namesearch: {val:undefined, op:"LIKE", types:[1, 5]},
                album_titlesearch: {val:undefined, op:"LIKE"},
                genre: ADVS_ANY_GENRE,
                genre_name: undefined,
                secs: {val:undefined, op:">"},
                tracknum: {val:undefined, op:"="},
                year: {val:undefined, op:">"},
                persistent_playcount: {val:undefined, op:">"},
                persistent_rating: {val:undefined, op:"="},
                timestamp: {val:undefined, op:"="},
                bitrate: {val:0, op:">"},
                samplerate: {val:0, op:">"},
                samplesize: {val:0, op:">"},
                content_type: ADVS_ANY_CONTENT_TYPE,
                url: {val:undefined, op:"LIKE"},
                filesize: {val:undefined, op:">"},
                comments_value: {val:undefined, op:"LIKE"},
                lyrics: {val:undefined, op:"LIKE"}
            },
            sections: {
                tech:{visible: getLocalStorageBool('advs.tech', false), label:""},
                file:{visible: getLocalStorageBool('advs.file', false), label:""},
                stats:{visible: getLocalStorageBool('advs.stats', false), label:"", isstats: true}
            },
            stats: true
        }
    },
    mounted() {
        bus.$on('advancedsearch.open', function(reset) {
            this.textOps=[{key:"LIKE", label:i18n("contains")},
                          {key:"NOT LIKE", label:i18n("doesn't contain")},
                          {key:"STARTS WITH", label:i18n("starts with")},
                          {key:"STARTS NOT WITH", label:i18n("does not start with")}];
            this.rangeOps=[{key:"=", label:i18n("equals")},
                          {key:"<", label:i18n("less than")},
                          {key:">", label:i18n("greater than")},
                          {key:"!=", label:i18n("not")}];
            this.fullRangeOps=[{key:"=", label:i18n("equals")},
                          {key:"<", label:i18n("less than")},
                          {key:">", label:i18n("greater than")},
                          {key:"!=", label:i18n("not equal")},
                          {key:"BETWEEN", label:i18n("in range")},
                          {key:"NOT BETWEEN", label:i18n("not in range")}];
            this.dateOps=[{key:"=", label:i18n("is")},
                          {key:"<", label:i18n("before")},
                          {key:">", label:i18n("after")},
                          {key:"!=", label:i18n("is not")}];
            this.sampleRates=[{key:0, label:i18n('any')}];
            this.sampleSizes=[{key:0, label:i18n('any')}];
            this.bitrates=[{key:0, label:i18n('any')},
                           {key:32, label:'32 kbps'},
                           {key:48, label:'48 kbps'},
                           {key:64, label:'64 kbps'},
                           {key:96, label:'96 kbps'},
                           {key:128, label:'128 kbps'},
                           {key:160, label:'160 kbps'},
                           {key:192, label:'192 kbps'},
                           {key:224, label:'224 kbps'},
                           {key:320, label:'320 kbps'}];
            this.fileFormats=[{key:ADVS_ANY_CONTENT_TYPE, label:i18n('any')}];
            this.artistTypes=[{key:1, label:i18n('Artist')},
                             {key:5, label:i18n('Album artist')},
                             {key:6, label:i18n('Track artist')},
                             {key:2, label:i18n('Composer')},
                             {key:3, label:i18n('Conductor')},
                             {key:4, label:i18n('Band')}];
            this.genres=[{key:ADVS_ANY_GENRE, label:i18n('any genre')},
                         {key:ADVS_IN_GENRE, label:i18n('contains')},
                         {key:ADVS_NOT_IN_GENRE, label:i18n("doesn't contain")}];
            this.sections.tech.label=i18n('Technical');
            this.sections.file.label=i18n('File');
            this.sections.stats.label=i18n('Stats');

            if (reset) {
                this.params.me_titlesearch= {val:undefined, op:"LIKE"};
                this.params.contributor_namesearch= {val:undefined, op:"LIKE", types:[1, 5]};
                this.params.album_titlesearch= {val:undefined, op:"LIKE"};
                this.params.genre= ADVS_ANY_GENRE;
                this.params.genre_name= undefined;
                this.params.secs= {val:undefined, op:">"};
                this.params.tracknum= {val:undefined, op:"="};
                this.params.year= {val:undefined, op:">"};
                this.params.persistent_playcount= {val:undefined, op:">"};
                this.params.persistent_rating= {val:undefined, op:"="};
                this.params.timestamp= {val:undefined, op:"="};
                this.params.bitrate= {val:0, op:">"};
                this.params.samplerate= {val:0, op:">"};
                this.params.samplesize= {val:0, op:">"};
                this.params.content_type= ADVS_ANY_CONTENT_TYPE;
                this.params.url= {val:undefined, op:"LIKE"};
                this.params.filesize= {val:undefined, op:">"};
                this.params.comments_value= {val:undefined, op:"LIKE"};
                this.params.lyrics= {val:undefined, op:"LIKE"};
            }

            lmsCommand("", ["material-skin", "adv-search-params"]).then(({data}) => {
                if (data && data.result) {
                    if (data.result.genres_loop) {
                        this.genres=[{key:ADVS_ANY_GENRE, label:i18n('any genre')},
                                     {key:ADVS_IN_GENRE, label:i18n('contains')},
                                     {key:ADVS_NOT_IN_GENRE, label:i18n("doesn't contain")}];
                        for (var idx=0, loop=data.result.genres_loop, loopLen=loop.length; idx<loopLen; ++idx) {
                            this.genres.push({key:loop[idx].id, label:loop[idx].genre});
                        }
                    }
                    if (data.result.filetypes_loop) {
                        this.fileFormats=[{key:ADVS_ANY_CONTENT_TYPE, label:i18n('any')}];
                        for (var idx=0, loop=data.result.filetypes_loop, loopLen=loop.length; idx<loopLen; ++idx) {
                            this.fileFormats.push({key:loop[idx].id, label:loop[idx].name});
                        }
                    }
                    if (data.result.samplerates_loop) {
                        this.sampleRates=[{key:0, label:i18n('any')}];
                        console.log(JSON.stringify(data.result.samplerates_loop));
                        for (var idx=0, loop=data.result.samplerates_loop, loopLen=loop.length; idx<loopLen; ++idx) {
                            this.sampleRates.push({key:loop[idx].rate, label:((loop[idx].rate/1000.0).toFixed(1)+" kHz")});
                        }
                    }
                    if (data.result.samplesizes_loop) {
                        this.sampleSizes=[{key:0, label:i18n('any')}];
                        for (var idx=0, loop=data.result.samplesizes_loop, loopLen=loop.length; idx<loopLen; ++idx) {
                            this.sampleSizes.push({key:loop[idx].size, label:""+loop[idx].size});
                        }
                    }
                    this.stats = 1 == parseInt(data.result.statistics);
                }
            });
            this.show = true;
            focusEntry(this);
        }.bind(this));
        bus.$on('esc', function() {
            if (this.$store.state.activeDialog == 'advancedsearch') {
                this.close();
            }
        }.bind(this));
    },
    methods: {
        cancel() {
            if (this.searching) {
                this.searching=false;
            } else {
                this.close();
            }
        },
        close() {
            this.show=false;
            this.searching=false;
            setLocalStorageVal('advs.tech', this.sections.tech.visible);
            setLocalStorageVal('advs.file', this.sections.file.visible);
            setLocalStorageVal('advs.stats', this.sections.stats.visible);
        },
        search() {
            this.searching = true;
            var ops = ['me_titlesearch', 'contributor_namesearch', 'album_titlesearch', 'secs', 'tracknum', 'year', 'persistent_playcount', 'persistent_rating', 'timestamp', 'url', 'filesize', 'comments_value', 'lyrics'];
            var intOps = ['bitrate', 'samplerate', 'samplesize'];
            var command = ["material-skin", "adv-search"];

            for (var i=0, len=ops.length; i<len; ++i) {
                var val = undefined==this.params[ops[i]].val ? "" : (""+this.params[ops[i]].val).trim();
                if (val.length>0) {
                    command.push(ops[i]+":"+val);
                    command.push(ops[i]+".op:"+this.params[ops[i]].op);
                }
            }
            for (var i=0, len=intOps.length; i<len; ++i) {
                var val = undefined==this.params[intOps[i]].val ? 0 : parseInt((""+this.params[intOps[i]].val).trim());
                if (val!=0) {
                    command.push(intOps[i]+":"+val);
                    command.push(intOps[i]+".op:"+this.params[intOps[i]].op);
                }
            }
            for (var i=0, loop=this.params.contributor_namesearch.types, len=loop.length; i<len; ++i) {
                command.push("contributor_namesearch.active"+loop[i]+":1");
            }
            if (this.params.content_type!=ADVS_ANY_CONTENT_TYPE) {
                command.push("content_type:"+this.params.content_type);
            }
            if (this.params.genre==ADVS_IN_GENRE || this.params.genre==ADVS_NOT_IN_GENRE) {
                var val = undefined==this.params.genre_name ? "" : this.params.genre_name.trim();
                if (val.length>0) {
                    command.push("genre_name:"+val);
                    command.push("genre:"+this.params.genre);
                }
            } else if (this.params.genre!=ADVS_ANY_GENRE) {
                command.push("genre:"+this.params.genre);
            }

            lmsCommand("", command).then(({data}) => {
                if (!this.searching) {
                    return;
                }
                let results = [];
                let total = 0;

                //parseBrowseResp looks for albums_loop before titles_loop, so must get albums first
                if (data.result.albums_loop) {
                    let resp = parseBrowseResp(data, undefined, { artistImages: setLocalStorageVal('artistImages', true), isSearch:true});
                    data.result.albums_loop = undefined;
                    if (undefined!=resp) {
                        results.push({resp:resp, command:{cat:2}});
                        total+=resp.items.length;
                    }
                }
                if (data.result.titles_loop) {
                    let resp = parseBrowseResp(data, undefined, { artistImages: setLocalStorageVal('artistImages', true), isSearch:true});
                    if (undefined!=resp) {
                        results.push({resp:resp, command:{cat:3}});
                        total+=resp.items.length;
                    }
                }
                let item = {cancache:false, title:i18n("Advanced search results"), id:ADV_SEARCH_ID, type:"search", libsearch:true};
                bus.$emit('advSearchResults', item, {command:command, params:[]},
                          { items:buildSearchResp(results), baseActions:[], canUseGrid: false, jumplist:[], subtitle:i18np("1 Item", "%1 Items", total)});
                this.searching = false;
                this.close();
            }).catch(err => {
                this.searching = false;
                logError(err);
            });
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
            this.$store.commit('dialogOpen', {name:'advancedsearch', shown:val});
        }
    }
})

