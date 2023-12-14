/**
 * LMS-Material
 *
 * Copyright (c) 2018-2023 Craig Drummond <craig.p.drummond@gmail.com>
 * MIT license.
 */
'use strict';

Vue.component('lms-favorite', {
    template: `
<v-dialog v-model="show" v-if="show" persistent width="600">
 <v-card>
  <v-card-title>{{isAdd ? i18n("Add favorite") : i18n("Edit favorite")}}</v-card-title>
  <v-form ref="form" v-model="valid" lazy-validation>
   <v-list two-line>
    <v-list-tile>
     <v-list-tile-content>
      <v-text-field clearable autocorrect="off" :label="i18n('Name')" v-model="name" class="lms-search" ref="entry"></v-text-field>
     </v-list-tile-content>
    </v-list-tile>
    <v-list-tile>
     <v-list-tile-content>
      <v-text-field clearable autocorrect="off" :label="i18n('URL')" v-model="url" class="lms-search"></v-text-field>
     </v-list-tile-content>
    </v-list-tile>
    <v-list-tile>
     <v-list-tile-content>
      <v-text-field clearable autocorrect="off" :label="i18n('Icon')" v-model="icon" class="lms-search"></v-text-field>
     </v-list-tile-content>
    </v-list-tile>
   </v-list>
  </v-form>
  <v-card-actions v-if="queryParams.altBtnLayout">
   <v-spacer></v-spacer>
   <v-btn flat @click.native="add()" v-if="isAdd">{{i18n('Add')}}</v-btn>
   <v-btn flat @click.native="update()" v-else>{{i18n('Update')}}</v-btn>
   <v-btn flat @click.native="cancel()">{{i18n('Cancel')}}</v-btn>
  </v-card-actions>
  <v-card-actions v-else>
   <v-spacer></v-spacer>
   <v-btn flat @click.native="cancel()">{{i18n('Cancel')}}</v-btn>
   <v-btn flat @click.native="add()" v-if="isAdd">{{i18n('Add')}}</v-btn>
   <v-btn flat @click.native="update()" v-else>{{i18n('Update')}}</v-btn>
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
            icon: "",
            item: undefined,
            isAdd: true,
            pos: 1,
            positions: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
        }
    },
    mounted() {
        bus.$on('favorite.open', function(mode, item) {
            this.item = item;
            if ('edit'==mode) {
                this.playerId = this.$store.state.player ? this.$store.state.player.id : "";
                this.name = item.title;
                this.url = item.presetParams ? item.presetParams.favorites_url : undefined;
                if (this.url) {
                    var lib = this.url.indexOf("libraryTracks.library=");
                    if (lib>0) {
                        this.url=this.url.substring(0, lib-1);
                    }
                }
                this.icon = item.presetParams ? item.presetParams.icon : undefined;
                this.isAdd=false;
                this.show=true;
                focusEntry(this);
            } else if ('add'==mode) {
                this.playerId = this.$store.state.player ? this.$store.state.player.id : "";
                this.name = "";
                this.url = "";
                this.icon = "";
                this.isAdd=true;
                this.show=true;
                focusEntry(this);
            }
        }.bind(this));
        bus.$on('noPlayers', function() {
            this.show=false;
        }.bind(this));
        bus.$on('closeDialog', function(dlg) {
            if (dlg == 'favorite') {
                this.show=false;
            }
        }.bind(this));
    },
    methods: {
        cancel() {
            this.show=false;
        },
        update() {
            var url = this.url ? this.url.trim() : "";
            var name = this.name ? this.name.trim() : "";
            var icon = this.icon ? this.icon.trim() : "";
            if (url.length<1 || name.length<1) {
                return;
            }
            if ((url == (this.item.presetParams ? this.item.presetParams.favorites_url : undefined)) &&
                (icon == (this.item.presetParams ? this.item.presetParams.icon : undefined)) )  {
                if (name == this.item.title) {
                    return;
                }
                lmsCommand(this.playerId, ["favorites", "rename", this.item.id, "title:"+name]).then(({data})=> {
                    bus.$emit('refreshFavorites');
                    bus.$emit('refreshList', SECTION_FAVORITES);
                });
            } else {
                lmsCommand(this.playerId, ["favorites", "delete", this.item.id]).then(({data})=> {
                    var command = ["favorites", "add", "url:"+url, "title:"+name, this.item.id];
                    if (this.item.presetParams) {
                        if (icon) {
                            command.push("icon:"+icon);
                        }
                        if (this.item.presetParams.favorites_type) {
                            command.push("type:"+this.item.presetParams.favorites_type);
                        }
                        if ((this.item.presetParams.favorites_url &&
                             (this.item.presetParams.favorites_url.startsWith("db:contributor") ||
                              this.item.presetParams.favorites_url.startsWith("db:genre") ||
                              this.item.presetParams.favorites_url.startsWith("db:album") ||
                              this.item.presetParams.favorites_url.startsWith("db:year"))) ||
                            (this.item['icon-id'] && this.item['icon-id']=="html/images/playlists.png")) {
                            command.push("hasitems:1");
                        }
                    }
                    lmsCommand(this.playerId, command).then(({data})=> {
                        bus.$emit('refreshFavorites');
                        bus.$emit('refreshList', SECTION_FAVORITES);
                    });
                });
            }
            this.show=false;
        },
        add() {
            var url = this.url ? this.url.trim() : "";
            var name = this.name ? this.name.trim() : "";
            if (url.length<1 || name.length<1) {
                return;
            }
            lmsCommand(this.playerId, ["favorites", "exists", url]).then(({data})=> {
                if (data && data.result && data.result.exists==1) {
                    bus.$emit('showMessage', i18n("Already in favorites"));
                } else {
                    lmsCommand(this.playerId, ["favorites", "add", "url:"+url, "title:"+name, this.item.id]).then(({data})=> {
                        bus.$emit('refreshFavorites');
                    });
                }
            });
            this.show=false;
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
            this.$store.commit('dialogOpen', {name:'favorite', shown:val});
        }
    }
})

