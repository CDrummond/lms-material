/**
 * LMS-Material
 *
 * Copyright (c) 2018-2021 Craig Drummond <craig.p.drummond@gmail.com>
 * MIT license.
 */
'use strict';

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
  
   <!--
   genre
   -->
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

   <v-layout class="avs-section" wrap>
    <v-flex xs12 sm2><div class="avs-title">{{i18n('Play count')}}</div></v-flex>
    <v-flex xs12 sm4><v-select :items="fullRangeOps" v-model="params.persistent_playcount.op" item-text="label" item-value="key"></v-select></v-flex>
    <v-flex xs12 sm6><v-text-field clearable v-model="params.persistent_playcount.val" class="lms-search"></v-text-field></v-flex>
   </v-layout>

   <v-layout class="avs-section" wrap>
    <v-flex xs12 sm2><div class="avs-title">{{i18n('Rating')}}</div></v-flex>
    <v-flex xs12 sm4><v-select :items="fullRangeOps" v-model="params.persistent_rating.op" item-text="label" item-value="key"></v-select></v-flex>
    <v-flex xs12 sm6><v-text-field clearable v-model="params.persistent_rating.val" class="lms-search"></v-text-field></v-flex>
   </v-layout>

  <v-layout class="avs-section" wrap>
    <v-flex xs12 sm2><div class="avs-title">{{i18n('Date modified')}}</div></v-flex>
    <v-flex xs12 sm4><v-select :items="dateOps" v-model="params.timestamp.op" item-text="label" item-value="key"></v-select></v-flex>
    <v-flex xs12 sm6><v-text-field clearable v-model="params.timestamp.val" class="lms-search" placeholder="mm/dd/yyyy"></v-text-field></v-flex>
   </v-layout>
   
   <v-layout class="avs-section" wrap>
    <v-flex xs12 sm2><div class="avs-title">{{i18n('Bitrate')}}</div></v-flex>
    <v-flex xs12 sm4><v-select :items="rangeOps" v-model="params.bitrate.op" item-text="label" item-value="key"></v-select></v-flex>
    <v-flex xs12 sm6><v-select :items="bitrates" v-model="params.bitrate.val" item-text="label" item-value="key"></v-select ></v-flex>
   </v-layout>

   <v-layout class="avs-section" wrap>
    <v-flex xs12 sm2><div class="avs-title">{{i18n('Sample rate')}}</div></v-flex>
    <v-flex xs12 sm4><v-select :items="rangeOps" v-model="params.samplerate.op" item-text="label" item-value="key"></v-select></v-flex>
    <v-flex xs12 sm6><v-select :items="sampleRates" v-model="params.samplerate.val" item-text="label" item-value="key"></v-select ></v-flex>
   </v-layout>

   <v-layout class="avs-section" wrap>
    <v-flex xs12 sm2><div class="avs-title">{{i18n('Sample size')}}</div></v-flex>
    <v-flex xs12 sm4><v-select :items="rangeOps" v-model="params.samplesize.op" item-text="label" item-value="key"></v-select></v-flex>
    <v-flex xs12 sm6><v-select :items="sampleSizes" v-model="params.samplesize.val" item-text="label" item-value="key"></v-select ></v-flex>
   </v-layout>

  <v-layout class="avs-section" wrap>
    <v-flex xs12 sm2><div class="avs-title">{{i18n('File format')}}</div></v-flex>
    <v-flex xs12 sm10><v-select :items="fileFormats" v-model="params.content_type" item-text="label" item-value="key"></v-select></v-flex>
   </v-layout>

   <v-layout class="avs-section" wrap>
    <v-flex xs12 sm2><div class="avs-title">{{i18n('Path')}}</div></v-flex>
    <v-flex xs12 sm4><v-select :items="textOps" v-model="params.url.op" item-text="label" item-value="key"></v-select></v-flex>
    <v-flex xs12 sm6><v-text-field clearable v-model="params.url.val" class="lms-search"></v-text-field></v-flex>
   </v-layout>

  <v-layout class="avs-section" wrap>
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

  <v-card-text>

  <v-card-actions>
   <div v-if="searching" style="padding-left:8px">{{i18n('Searching...')}}</div>
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
            params: {
                me_titlesearch: {val:undefined, op:"LIKE"},
                contributor_namesearch: {val:undefined, op:"LIKE", types:[1, 5]},
                album_titlesearch: {val:undefined, op:"LIKE"},
                secs: {val:undefined, op:">"},
                tracknum: {val:undefined, op:"="},
                year: {val:undefined, op:">"},
                persistent_playcount: {val:undefined, op:">"},
                persistent_rating: {val:undefined, op:"="},
                timestamp: {val:undefined, op:"="},
                bitrate: {val:0, op:">"},
                samplerate: {val:0, op:">"},
                samplesize: {val:0, op:">"},
                content_type: "-",
                url: {val:undefined, op:"LIKE"},
                filesize: {val:undefined, op:">"},
                comments_value: {val:undefined, op:"LIKE"},
                lyrics: {val:undefined, op:"LIKE"}
            }
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
            this.sampleRates=[{key:0, label:i18n('Any')},
                              {key:44100, label:"44.1 kHz"},
                              {key:48000, label:"48 kHz"},
                              {key:96000, label:"96 kHz"},
                              {key:192000, label:"192 kHz"}];
            this.sampleSizes=[{key:0, label:i18n('Any')},
                              {key:16, label:'16'},
                              {key:24, label:'24'}];
            this.bitrates=[{key:0, label:i18n('Any')},
                           {key:32, label:'32 kbps'},
                           {key:48, label:'48 kbps'},
                           {key:64, label:'64 kbps'},
                           {key:96, label:'96 kbps'},
                           {key:128, label:'128 kbps'},
                           {key:160, label:'160 kbps'},
                           {key:192, label:'192 kbps'},
                           {key:224, label:'224 kbps'},
                           {key:320, label:'320 kbps'}];
            this.fileFormats=[{key:"-", label:i18n('Any')},
                           {key:'acc', label:'AAC'},
                           {key:'flc', label:'FLC'},
                           {key:'mp3', label:'MP3'},
                           {key:'m4a', label:'M4A'}];
            this.artistTypes=[{key:1, label:i18n('Artist')},
                             {key:5, label:i18n('Album artist')},
                             {key:6, label:i18n('Track artist')},
                             {key:2, label:i18n('Composer')},
                             {key:3, label:i18n('Conductor')},
                             {key:4, label:i18n('Band')}];

            if (reset) {
                this.params.me_titlesearch= {val:undefined, op:"LIKE"};
                this.params.contributor_namesearch= {val:undefined, op:"LIKE", types:[1, 5]};
                this.params.album_titlesearch= {val:undefined, op:"LIKE"};
                this.params.secs= {val:undefined, op:">"};
                this.params.tracknum= {val:undefined, op:"="};
                this.params.year= {val:undefined, op:">"};
                this.params.persistent_playcount= {val:undefined, op:">"};
                this.params.persistent_rating= {val:undefined, op:"="};
                this.params.timestamp= {val:undefined, op:"="};
                this.params.bitrate= {val:0, op:">"};
                this.params.samplerate= {val:0, op:">"};
                this.params.samplesize= {val:0, op:">"};
                this.params.content_type= "-";
                this.params.url= {val:undefined, op:"LIKE"};
                this.params.filesize= {val:undefined, op:">"};
                this.params.comments_value= {val:undefined, op:"LIKE"};
                this.params.lyrics= {val:undefined, op:"LIKE"};
            }
            this.show = true;
            focusEntry(this);
        }.bind(this));
        bus.$on('esc', function() {
            if (this.$store.state.activeDialog == 'advancedsearch') {
                this.show=false;
            }
        }.bind(this));
    },
    methods: {
        cancel() {
            if (this.searching) {
                this.searching=false;
            } else {
                this.show=false;
            }
        },
        search() {
            this.searching = true;
            var command = ["material-skin", "adv-search"];
            // TODO: Genre
            var ops = ['me_titlesearch', 'contributor_namesearch', 'album_titlesearch', 'secs', 'tracknum', 'year', 'persistent_playcount', 'persistent_rating', 'timestamp', 'url', 'filesize', 'comments_value', 'lyrics'];
            var intOps = ['bitrate', 'samplerate', 'samplesize'];

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
            if (this.params.content_type!="-") {
                command.push("content_type:"+this.params.content_type);
            }

            lmsCommand("", command).then(({data}) => {
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
                this.show = false;
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

