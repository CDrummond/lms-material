/**
 * LMS-Material
 *
 * Copyright (c) 2018-2019 Craig Drummond <craig.p.drummond@gmail.com>
 * MIT license.
 */

const TERM_FIELD = "%TERM%";
const COUNTRY_FIELD = "%COUNTRY%";
const GPODDER_URL = "http://gpodder.net/search.json?q="+TERM_FIELD;
const ITUNES_URL = "http://ax.phobos.apple.com.edgesuite.net/WebObjects/MZStoreServices.woa/wa/wsSearch?media=podcast&format=json&country="+COUNTRY_FIELD+"&term="+TERM_FIELD;

const COUNTRIES = [
    { key:'ae', value:'United Arab Emirates' },
    { key:'ag', value:'Antigua and Barbuda' },
    { key:'ai', value:'Anguilla' },
    { key:'al', value:'Albania' },
    { key:'am', value:'Armenia' },
    { key:'ao', value:'Angola' },
    { key:'ar', value:'Argentina' },
    { key:'at', value:'Austria' },
    { key:'au', value:'Australia' },
    { key:'az', value:'Azerbaijan' },
    { key:'bb', value:'Barbados' },
    { key:'be', value:'Belgium' },
    { key:'bf', value:'Burkina-Faso' },
    { key:'bg', value:'Bulgaria' },
    { key:'bh', value:'Bahrain' },
    { key:'bj', value:'Benin' },
    { key:'bm', value:'Bermuda' },
    { key:'bn', value:'Brunei Darussalam' },
    { key:'bo', value:'Bolivia' },
    { key:'br', value:'Brazil' },
    { key:'bs', value:'Bahamas' },
    { key:'bt', value:'Bhutan' },
    { key:'bw', value:'Botswana' },
    { key:'by', value:'Belarus' },
    { key:'bz', value:'Belize' },
    { key:'ca', value:'Canada' },
    { key:'cg', value:'Democratic Republic of the Congo' },
    { key:'ch', value:'Switzerland' },
    { key:'cl', value:'Chile' },
    { key:'cn', value:'China' },
    { key:'co', value:'Colombia' },
    { key:'cr', value:'Costa Rica' },
    { key:'cv', value:'Cape Verde' },
    { key:'cy', value:'Cyprus' },
    { key:'cz', value:'Czech Republic' },
    { key:'de', value:'Germany' },
    { key:'dk', value:'Denmark' },
    { key:'dm', value:'Dominica' },
    { key:'do', value:'Dominican Republic' },
    { key:'dz', value:'Algeria' },
    { key:'ec', value:'Ecuador' },
    { key:'ee', value:'Estonia' },
    { key:'eg', value:'Egypt' },
    { key:'es', value:'Spain' },
    { key:'fi', value:'Finland' },
    { key:'fj', value:'Fiji' },
    { key:'fm', value:'Federated States of Micronesia' },
    { key:'fr', value:'France' },
    { key:'gb', value:'United Kingdom' },
    { key:'gd', value:'Grenada' },
    { key:'gh', value:'Ghana' },
    { key:'gm', value:'Gambia' },
    { key:'gr', value:'Greece' },
    { key:'gt', value:'Guatemala' },
    { key:'gw', value:'Guinea Bissau' },
    { key:'gy', value:'Guyana' },
    { key:'hk', value:'Hong Kong' },
    { key:'hn', value:'Honduras' },
    { key:'hr', value:'Croatia' },
    { key:'hu', value:'Hungary' },
    { key:'id', value:'Indonesia' },
    { key:'ie', value:'Ireland' },
    { key:'il', value:'Israel' },
    { key:'in', value:'India' },
    { key:'is', value:'Iceland' },
    { key:'it', value:'Italy' },
    { key:'jm', value:'Jamaica' },
    { key:'jo', value:'Jordan' },
    { key:'jp', value:'Japan' },
    { key:'ke', value:'Kenya' },
    { key:'kg', value:'Krygyzstan' },
    { key:'kh', value:'Cambodia' },
    { key:'kn', value:'Saint Kitts and Nevis' },
    { key:'kr', value:'South Korea' },
    { key:'kw', value:'Kuwait' },
    { key:'ky', value:'Cayman Islands' },
    { key:'kz', value:'Kazakhstan' },
    { key:'la', value:'Laos' },
    { key:'lb', value:'Lebanon' },
    { key:'lc', value:'Saint Lucia' },
    { key:'lk', value:'Sri Lanka' },
    { key:'lr', value:'Liberia' },
    { key:'lt', value:'Lithuania' },
    { key:'lu', value:'Luxembourg' },
    { key:'lv', value:'Latvia' },
    { key:'md', value:'Moldova' },
    { key:'mg', value:'Madagascar' },
    { key:'mk', value:'Macedonia' },
    { key:'ml', value:'Mali' },
    { key:'mn', value:'Mongolia' },
    { key:'mo', value:'Macau' },
    { key:'mr', value:'Mauritania' },
    { key:'ms', value:'Montserrat' },
    { key:'mt', value:'Malta' },
    { key:'mu', value:'Mauritius' },
    { key:'mw', value:'Malawi' },
    { key:'mx', value:'Mexico' },
    { key:'my', value:'Malaysia' },
    { key:'mz', value:'Mozambique' },
    { key:'na', value:'Namibia' },
    { key:'ne', value:'Niger' },
    { key:'ng', value:'Nigeria' },
    { key:'ni', value:'Nicaragua' },
    { key:'nl', value:'Netherlands' },
    { key:'np', value:'Nepal' },
    { key:'no', value:'Norway' },
    { key:'nz', value:'New Zealand' },
    { key:'om', value:'Oman' },
    { key:'pa', value:'Panama' },
    { key:'pe', value:'Peru' },
    { key:'pg', value:'Papua New Guinea' },
    { key:'ph', value:'Philippines' },
    { key:'pk', value:'Pakistan' },
    { key:'pl', value:'Poland' },
    { key:'pt', value:'Portugal' },
    { key:'pw', value:'Palau' },
    { key:'py', value:'Paraguay' },
    { key:'qa', value:'Qatar' },
    { key:'ro', value:'Romania' },
    { key:'ru', value:'Russia' },
    { key:'sa', value:'Saudi Arabia' },
    { key:'sb', value:'Soloman Islands' },
    { key:'sc', value:'Seychelles' },
    { key:'se', value:'Sweden' },
    { key:'sg', value:'Singapore' },
    { key:'si', value:'Slovenia' },
    { key:'sk', value:'Slovakia' },
    { key:'sl', value:'Sierra Leone' },
    { key:'sn', value:'Senegal' },
    { key:'sr', value:'Suriname' },
    { key:'st', value:'Sao Tome e Principe' },
    { key:'sv', value:'El Salvador' },
    { key:'sz', value:'Swaziland' },
    { key:'tc', value:'Turks and Caicos Islands' },
    { key:'td', value:'Chad' },
    { key:'th', value:'Thailand' },
    { key:'tj', value:'Tajikistan' },
    { key:'tm', value:'Turkmenistan' },
    { key:'tn', value:'Tunisia' },
    { key:'tr', value:'Turkey' },
    { key:'tt', value:'Republic of Trinidad and Tobago' },
    { key:'tw', value:'Taiwan' },
    { key:'tz', value:'Tanzania' },
    { key:'ua', value:'Ukraine' },
    { key:'ug', value:'Uganda' },
    { key:'us', value:'United States of America' },
    { key:'uy', value:'Uruguay' },
    { key:'uz', value:'Uzbekistan' },
    { key:'vc', value:'Saint Vincent and the Grenadines' },
    { key:'ve', value:'Venezuela' },
    { key:'vg', value:'British Virgin Islands' },
    { key:'vn', value:'Vietnam' },
    { key:'ye', value:'Yemen' },
    { key:'za', value:'South Africa' },
    { key:'zw', value:'Zimbabwe' }
];

Vue.component('lms-podcast-search-dialog', {
    template: `
<v-dialog scrollable v-model="show" persistent width="600">
 <v-card>
  <v-card-title>{{i18n("Search for podcasts")}}</v-card-title>
  <v-form ref="form" v-model="valid" lazy-validation>
   <v-list two-line>
    <v-list-tile>
     <v-text-field :label="i18n('Term')" clearable v-if="show" v-model="term" class="lms-search" autofocus @keyup.enter="search()"></v-text-field>
    </v-list-tile>
    <v-list-tile>
     <v-flex xs6><v-select :items="providers" :label="i18n('Provider')" v-model="provider" item-text="value" item-value="key"></v-select></v-flex>
     <v-flex xs6><v-select :items="countries" :label="i18n('Country')" v-model="country" item-text="value" item-value="key" style="padding-left:8px" v-if="provider=='itunes'"></v-select></v-flex>
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
            valid: false,
            provider: undefined,
            country: undefined,
            providers: [ {key: 'itunes', value: 'iTunes' },
                         {key: 'gpodder', value: 'GPodder'} ],
            countries: COUNTRIES,
            term: ""
        }
    },
    mounted() {
        bus.$on('podcastsearch.open', function() {
            this.provider = getLocalStorageVal('podcasts-provider', 'itunes');
            this.country = getLocalStorageVal('podcasts-country', 'us');
            this.show=true;
        }.bind(this));
        bus.$on('esc', function() {
            if (this.$store.state.activeDialog == 'podcastsearch') {
                this.show=false;
            }
        }.bind(this));
    },
    methods: {
        cancel() {
            this.show=false;
        },
        search() {
            var str = this.term.trim();
            if (str.length>1) {
                var url = (this.provider=='itunes' ? ITUNES_URL : GPODDER_URL).replace(COUNTRY_FIELD, this.country).replace(TERM_FIELD, encodeURIComponent(this.term));
                bus.$emit('searchPodcasts', url, str, this.provider);
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

