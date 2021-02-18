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
    <v-flex xs12 sm4><v-select :items="textOps" v-model="params.track.op" item-text="label" item-value="key"></v-select></v-flex>
    <v-flex xs12 sm6><v-text-field clearable v-model="params.track.val" class="lms-search" ref="entry"></v-text-field></v-flex>
   </v-layout>

   <v-layout class="avs-section" wrap>
    <v-flex xs12 sm2><div class="avs-title">{{i18n('Artist')}}</div></v-flex>
    <v-flex xs12 sm4><v-select :items="textOps" v-model="params.artist.op" item-text="label" item-value="key"></v-select></v-flex>
    <v-flex xs12 sm6><v-text-field clearable v-model="params.artist.val" class="lms-search"></v-text-field></v-flex>
    <!--
    artist types
    -->
   </v-layout>

   <v-layout class="avs-section" wrap>
    <v-flex xs12 sm2><div class="avs-title">{{i18n('Album')}}</div></v-flex>
    <v-flex xs12 sm4><v-select :items="textOps" v-model="params.album.op" item-text="label" item-value="key"></v-select></v-flex>
    <v-flex xs12 sm6><v-text-field clearable v-model="params.album.val" class="lms-search"></v-text-field></v-flex>
   </v-layout>
  
   <!--
   genre
   -->
   <v-layout class="avs-section" wrap>
    <v-flex xs12 sm2><div class="avs-title">{{i18n('Duration')}}</div></v-flex>
    <v-flex xs12 sm4><v-select :items="fullRangeOps" v-model="params.duration.op" item-text="label" item-value="key"></v-select></v-flex>
    <v-flex xs12 sm6><v-text-field clearable v-model="params.duration.val" class="lms-search" :placeholder="i18n('seconds')"></v-text-field></v-flex>
   </v-layout>

   <v-layout class="avs-section" wrap>
    <v-flex xs12 sm2><div class="avs-title">{{i18n('Track#')}}</div></v-flex>
    <v-flex xs12 sm4><v-select :items="rangeOps" v-model="params.tracknumber.op" item-text="label" item-value="key"></v-select></v-flex>
    <v-flex xs12 sm6><v-text-field clearable v-model="params.tracknumber.val" class="lms-search"></v-text-field></v-flex>
   </v-layout>

   <v-layout class="avs-section" wrap>
    <v-flex xs12 sm2><div class="avs-title">{{i18n('Year')}}</div></v-flex>
    <v-flex xs12 sm4><v-select :items="fullRangeOps" v-model="params.year.op" item-text="label" item-value="key"></v-select></v-flex>
    <v-flex xs12 sm6><v-text-field clearable v-model="params.year.val" class="lms-search"></v-text-field></v-flex>
   </v-layout>

   <v-layout class="avs-section" wrap>
    <v-flex xs12 sm2><div class="avs-title">{{i18n('Play count')}}</div></v-flex>
    <v-flex xs12 sm4><v-select :items="fullRangeOps" v-model="params.playcount.op" item-text="label" item-value="key"></v-select></v-flex>
    <v-flex xs12 sm6><v-text-field clearable v-model="params.playcount.val" class="lms-search"></v-text-field></v-flex>
   </v-layout>

   <v-layout class="avs-section" wrap>
    <v-flex xs12 sm2><div class="avs-title">{{i18n('Rating')}}</div></v-flex>
    <v-flex xs12 sm4><v-select :items="fullRangeOps" v-model="params.rating.op" item-text="label" item-value="key"></v-select></v-flex>
    <v-flex xs12 sm6><v-text-field clearable v-model="params.rating.val" class="lms-search"></v-text-field></v-flex>
   </v-layout>

  <v-layout class="avs-section" wrap>
    <v-flex xs12 sm2><div class="avs-title">{{i18n('Date modified')}}</div></v-flex>
    <v-flex xs12 sm4><v-select :items="dateOps" v-model="params.datemodified.op" item-text="label" item-value="key"></v-select></v-flex>
    <v-flex xs12 sm6><v-text-field clearable v-model="params.datemodified.val" class="lms-search" placeholder="mm/dd/yyyy"></v-text-field></v-flex>
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
    <v-flex xs12 sm10><v-select :items="fileFormats" v-model="params.fileformat" item-text="label" item-value="key"></v-select></v-flex>
   </v-layout>

   <v-layout class="avs-section" wrap>
    <v-flex xs12 sm2><div class="avs-title">{{i18n('Path')}}</div></v-flex>
    <v-flex xs12 sm4><v-select :items="textOps" v-model="params.path.op" item-text="label" item-value="key"></v-select></v-flex>
    <v-flex xs12 sm6><v-text-field clearable v-model="params.path.val" class="lms-search"></v-text-field></v-flex>
   </v-layout>

  <v-layout class="avs-section" wrap>
    <v-flex xs12 sm2><div class="avs-title">{{i18n('File size')}}</div></v-flex>
    <v-flex xs12 sm4><v-select :items="fullRangeOps" v-model="params.filelength.op" item-text="label" item-value="key"></v-select></v-flex>
    <v-flex xs12 sm6><v-text-field clearable v-model="params.filelength.val" class="lms-search" :placeholder="i18n('bytes')"></v-text-field></v-flex>
   </v-layout>

   <v-layout class="avs-section" wrap>
    <v-flex xs12 sm2><div class="avs-title">{{i18n('Comment')}}</div></v-flex>
    <v-flex xs12 sm4><v-select :items="textOps" v-model="params.comment.op" item-text="label" item-value="key"></v-select></v-flex>
    <v-flex xs12 sm6><v-text-field clearable v-model="params.comment.val" class="lms-search"></v-text-field></v-flex>
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
            params: {
                track: {val:undefined, op:"LIKE"},
                artist: {val:undefined, op:"LIKE", artist:true, albumartist:true, conductor:false, composer:false, band:false, trackartist:false},
                album: {val:undefined, op:"LIKE"},
                duration: {val:undefined, op:">"},
                tracknumber: {val:undefined, op:"="},
                year: {val:undefined, op:">"},
                playcount: {val:undefined, op:">"},
                rating: {val:undefined, op:"="},
                datemodified: {val:undefined, op:"="},
                bitrate: {val:0, op:">"},
                samplerate: {val:0, op:">"},
                samplesize: {val:0, op:">"},
                fileformat: "-",
                path: {val:undefined, op:"LIKE"},
                filelength: {val:undefined, op:">"},
                comment: {val:undefined, op:"LIKE"},
                lyrics: {val:undefined, op:"LIKE"}
            }
        }
    },
    mounted() {
        bus.$on('advancedsearch.open', function() {
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
                this.results=[];
                this.searching=false;
            } else {
                this.show=false;
            }
        },
        search() {
            this.searching = true;
            var command = ["material-skin", "adv-search"];
            lmsCommand("", command).then(({data}) => {
                this.searching = false;
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

