/**
 * LMS-Material
 *
 * Copyright (c) 2018-2020 Craig Drummond <craig.p.drummond@gmail.com>
 * MIT license.
 */
'use strict';

const TERM_FIELD = "%TERM%";
const COUNTRY_FIELD = "%COUNTRY%";

Vue.component('lms-podcast-search-dialog', {
    template: `
<v-dialog v-model="show" v-if="show" persistent scrollable width="600">
 <v-card>
  <v-card-title>{{i18n("Search for podcasts")}}</v-card-title>
  <v-form ref="form">
   <v-list two-line>
    <v-list-tile>
     <v-text-field :label="i18n('Term')" clearable v-model="term" class="lms-search" @keyup.enter="search()" ref="entry"></v-text-field>
    </v-list-tile>
    <v-list-tile>
     <v-select :items="providers" :label="i18n('Provider')" v-model="provider" item-text="name" item-value="key"></v-select>
    </v-list-tile>
    <v-list-tile v-if="provider && hasCountry.has(provider)">
     <v-select :items="countries" :label="i18n('Country')" v-model="country" item-text="value" item-value="key"></v-select>
    </v-list-tile>
   </v-list>
  </v-form>
  <v-card-actions>
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
            show: false,
            provider: undefined,
            country: undefined,
            providers: [ ],
            countries: [ ],
            term: "",
            hasCountry: new Set()
        }
    },
    mounted() {
        bus.$on('podcastsearch.open', function() {
            if (this.providers.length<1) {
                let psd = this;
                axios.get("html/misc/podcast-sites.json?r=" + LMS_MATERIAL_REVISION).then(function (resp) {
                    var data = eval(resp.data);
                    psd.providers = data.providers;
                    psd.countries = data.countries;
                    for (let i=0, len=psd.providers.length; i<len; ++i) {
                        if (psd.providers[i].countries) {
                            psd.hasCountry.add(psd.providers[i].key);
                        }
                    }
                    psd.init();
                 }).catch(err => {
                    window.console.error(err);
                });
            } else {
                this.init();
            }
        }.bind(this));
        bus.$on('esc', function() {
            if (this.$store.state.activeDialog == 'podcastsearch') {
                this.show=false;
            }
        }.bind(this));
    },
    methods: {
        init() {
            this.provider = getLocalStorageVal('podcasts-provider', 'itunes');
            this.country = getLocalStorageVal('podcasts-country', 'us');
            this.show=true;
            focusEntry(this);
        },
        cancel() {
            this.show=false;
        },
        search() {
            var str = this.term.trim();
            if (str.length>1) {
                let provider = 0;
                for (let i=0, len=this.providers.length; i<len; ++i) {
                    if (this.provider == this.providers[i].key) {
                        provider=i;
                        break;
                    }
                }
                var url = this.providers[provider].url.replace(COUNTRY_FIELD, this.country).replace(TERM_FIELD, encodeURIComponent(this.term));
                bus.$emit('searchPodcasts', url, str, this.providers[provider]);
                setLocalStorageVal('podcasts-provider', this.provider);
                setLocalStorageVal('podcasts-country', this.country);
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
            this.$store.commit('dialogOpen', {name:'podcastsearch', shown:val});
        }
    }
})

