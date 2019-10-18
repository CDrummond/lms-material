/**
 * LMS-Material
 *
 * Copyright (c) 2018-2019 Craig Drummond <craig.p.drummond@gmail.com>
 * MIT license.
 */

Vue.component('lms-podcast-add-dialog', {
    template: `
<v-dialog v-model="show" v-if="show" persistent scrollable width="600">
 <v-card>
  <v-card-title>{{i18n("Add podcast")}}</v-card-title>
  <v-form ref="form" v-model="valid" lazy-validation>
   <v-list two-line>
    <v-list-tile>
     <v-list-tile-content>
      <v-text-field clearable v-if="show" :label="i18n('Name')" v-model="name" class="lms-search"></v-text-field>
     </v-list-tile-content>
    </v-list-tile>
    <v-list-tile>
     <v-list-tile-content>
      <v-text-field clearable autofocus :label="i18n('URL')" v-model="url" class="lms-search"></v-text-field>
     </v-list-tile-content>
     <v-list-tile-action><v-btn flat @click="validate">{{i18n('Validate')}}</v-btn></v-list-tile-action>
    </v-list-tile>
    <v-list-tile v-if="error">
     <p style="color:red">{{error}}</p>
    </v-list-tile>
   </v-list>
  </v-form>
  <v-card-actions>
   <v-spacer></v-spacer>
   <v-btn flat @click.native="cancel()">{{i18n('Cancel')}}</v-btn>
   <v-btn flat @click.native="add()">{{i18n('Add')}}</v-btn>
  </v-card-actions>
 </v-card>
</v-dialog>
`,
    props: [],
    data() {
        return {
            valid: false,
            show: false,
            name: "",
            url: "",
            item: undefined,
            error: undefined
        }
    },
    mounted() {
        bus.$on('podcastadd.open', function() {
            this.url = "";
            this.name = "";
            this.show = true;
        }.bind(this));
        bus.$on('esc', function() {
            if (this.$store.state.activeDialog == 'podcastadd') {
                this.show=false;
            }
        }.bind(this));
    },
    methods: {
        cancel() {
            this.show=false;
            this.cancelErrorTimer();
            this.parser=undefined;
        },
        validate() {
            var url = this.url ? this.url.trim() : "";
            if (url.length>4) {
                this.error = undefined;
                this.cancelErrorTimer();
                axios.get(url).then(({data}) => {
                    this.parseResp(data);
                }).catch(err => {
                    // CORS error?
                    axios.get('https://cors-anywhere.herokuapp.com/'+url).then(({data}) => {
                        this.parseResp(data);
                    }).catch(err2 => {
                        this.showError(err2);
                    });
                });
            } else {
                this.showError(i18n("Invalid URL"));
            }
        },
        parseResp(data) {
            try {
                if (undefined==this.parser) {
                    this.parser = new DOMParser();
                }
                var xmlDoc = this.parser.parseFromString(data, "text/xml");
                this.name = xmlDoc.getElementsByTagName("title")[0].childNodes[0].nodeValue;
            } catch(e) {
                this.showError(i18n("Failed to parse feed"));
            }            
        },
        add() {
            var url = this.url ? this.url.trim() : "";
            var name = this.name ? this.name.trim() : "";
            if (url.length<1 || name.length<1) {
                return;
            }
            lmsCommand("", ["material-skin", "add-podcast", "url:"+url, "name:"+name]).then(({datax}) => {
                bus.$emit('refreshList', SECTION_PODCASTS);
                this.show=false;
            }).catch(err => {
                this.showError(i18n("Failed add podcast"));
            });
        },
        showError(str) {
            this.error = str;
            this.cancelErrorTimer();
            this.errorTimer = setTimeout(function () {
                this.error = undefined;
                this.errorTimer = undefined;
            }.bind(this), 2500);
        },
        cancelErrorTimer() {
            if (undefined!=this.errorTimer) {
                this.errorTimer = undefined;
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
            this.$store.commit('dialogOpen', {name:'podcastadd', shown:val});
        }
    },
    beforeDestroy() {
        this.cancelErrorTimer();
    }
})

