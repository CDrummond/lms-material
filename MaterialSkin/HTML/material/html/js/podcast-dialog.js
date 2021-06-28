/**
 * LMS-Material
 *
 * Copyright (c) 2018-2021 Craig Drummond <craig.p.drummond@gmail.com>
 * MIT license.
 */
'use strict';

Vue.component('lms-podcast-dialog', {
    template: `
<v-dialog v-model="show" v-if="show" persistent scrollable width="600">
 <v-card>
  <v-card-title>{{isEdit ? i18n("Edit podcast") : i18n("Add podcast")}}</v-card-title>
  <v-form ref="form" v-model="valid" lazy-validation>
   <v-list two-line>
    <v-list-tile>
     <v-list-tile-content>
      <v-text-field clearable :label="i18n('Name')" v-model="name" class="lms-search" ref="entry"></v-text-field>
     </v-list-tile-content>
    </v-list-tile>
    <v-list-tile>
     <v-list-tile-content>
      <v-text-field clearable :label="i18n('URL')" v-model="url" class="lms-search"></v-text-field>
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
   <v-btn flat @click.native="save()">{{isEdit ? i18n('Update') : i18n('Add')}}</v-btn>
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
        bus.$on('podcast.open', function(mode, item) {
            this.isEdit = 'edit' == mode;
            if (this.isEdit) {
                this.item = item;
                if (this.item) {
                    lmsCommand("", ["material-skin", "podcast-url", "pos:"+item.index, "name:"+item.title]).then(({data}) => {
                        if (data.result.url) {
                            this.url = data.result.url;
                            this.origUrl = ""+data.result.url;
                            this.name = ""+item.title;
                            this.show = true;
                        } else {
                            bus.$emit('showError', i18n('Failed to fetch podcast URL'));
                        }
                    }).catch(err => {
                        bus.$emit('showError', i18n('Failed to fetch podcast URL'));
                    });
                }
            } else {
                this.item = undefined;
                this.url = "";
                this.name = "";
                this.show = true;
                focusEntry(this);
            }
        }.bind(this));
        bus.$on('esc', function() {
            if (this.$store.state.activeDialog == 'podcast') {
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
                lmsCommand("", ["material-skin", "geturl", "url:"+url]).then(({data}) => {
                    if (data.result.content) {
                        this.parseResp(data.result.content);
                    } else {
                        this.showError(i18n("Invalid URL"));
                    }
                }).catch(err => {
                    this.showError(i18n("Invalid URL"));
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
        save() {
            var url = this.url ? this.url.trim() : "";
            var name = this.name ? this.name.trim() : "";
            if (url.length<1 || name.length<1) {
                return;
            }
            if (this.isEdit && this.item.title == name && this.origUrl == url) {
                // No change...
                return;
            }

            lmsCommand("", this.isEdit
                            ? ["material-skin", "edit-podcast", "newurl:"+url, "newname:"+name, "oldname:"+this.item.title, "oldurl:"+this.origUrl, "pos:"+this.item.index]
                            : ["material-skin", "add-podcast", "url:"+url, "name:"+name]).then(({data}) => {
                bus.$emit('refreshList', SECTION_PODCASTS);
                this.show=false;
            }).catch(err => {
                this.showError(this.isEdit ? i18n("Failed edit podcast") : i18n("Failed to add podcast!"));
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
            this.$store.commit('dialogOpen', {name:'podcast', shown:val});
        }
    },
    beforeDestroy() {
        this.cancelErrorTimer();
    }
})

