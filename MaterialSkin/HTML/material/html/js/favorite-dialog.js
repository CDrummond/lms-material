/**
 * LMS-Material
 *
 * Copyright (c) 2018-2019 Craig Drummond <craig.p.drummond@gmail.com>
 * MIT license.
 */

Vue.component('lms-favorite', {
    template: `
<v-dialog scrollable v-model="show" persistent width="600">
 <v-card>
  <v-card-title>{{isAdd ? (isPreset ? i18n("Add Preset") : i18n("Add Favorite")) : (isPreset ? i18n("Edit Preset") : i18n("Edit Favorite"))}}</v-card-title>
  <v-form ref="form" v-model="valid" lazy-validation>
   <v-list two-line>
    <v-list-tile>
     <v-list-tile-content>
      <v-text-field clearable autofocus v-if="show" :label="i18n('Name')" v-model="name" class="lms-search" :rules="nameRules" required></v-text-field>
     </v-list-tile-content>
    </v-list-tile>
    <v-list-tile>
     <v-list-tile-content>
      <v-text-field clearable :label="i18n('URL')" v-model="url" class="lms-search" :rules="urlRules" required></v-text-field>
     </v-list-tile-content>
    </v-list-tile>
    <v-list-tile v-if="isPreset && isAdd">
     <v-list-tile-content>
      <v-select :items="positions" label="Position" v-model="pos" item-text="label" item-value="key"></v-select>
     </v-list-tile-content>
    </v-list-tile>
   </v-list>
  </v-form>
  <v-card-actions>
   <v-spacer></v-spacer>
   <v-btn flat @click.native="cancel()">{{i18n('Cancel')}}</v-btn>
   <v-btn flat @click.native="update()" v-if="!isAdd">{{i18n('Update')}}</v-btn>
   <v-btn flat @click.native="add()" v-if="isAdd">{{i18n('Add')}}</v-btn>
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
            isPreset: false,
            isAdd: true,
            pos: 1,
            positions: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
            nameRules: [
                v => !!v || i18n('Name is required'),
                v => (v && v.trim().length > 0) || i18n('Name is required')
            ],
            urlRules: [
                v => !!v || i18n('URL is required'),
                v => (v && v.trim().length > 0) || i18n('URL is required')
            ]
        }
    },
    mounted() {
        bus.$on('favorite.open', function(mode, item, isPreset) {
            this.isPreset = isPreset;
            this.item = item;
            if ('edit'==mode) {
                this.playerId = this.$store.state.player ? this.$store.state.player.id : "";
                this.name = isPreset ? item.text : item.title;
                this.url = isPreset 
                            ? item.url
                                ? item.url
                                : item.favUrl 
                                    ? item.favUrl
                                    : item.presetParams
                                        ? item.presetParams.favorites_url
                                        : undefined
                            : item.presetParams
                                ? item.presetParams.favorites_url
                                : undefined;
                this.isAdd=false;
                this.show=true;
            } else if ('add'==mode) {
                this.playerId = this.$store.state.player ? this.$store.state.player.id : "";
                this.name = "";
                this.url = "";
                this.isAdd=true;
                this.show=true;
            }
        }.bind(this));
        bus.$on('noPlayers', function() {
            this.show=false;
        }.bind(this));
        bus.$on('esc', function() {
            this.show=false;
        }.bind(this));
    },
    methods: {
        cancel() {
            this.show=false;
        },
        update() {
            var url = this.url ? this.url.trim() : "";
            var name = this.name ? this.name.trim() : "";
            if (url.length<1 || name.length<1) {
                return;
            }
            if (this.isPreset) {
                lmsCommand(this.playerId, ["material-skin-presets", "set", "num:"+this.item.num, "url:"+url, "text:"+name]).then(({data})=> {
                    bus.$emit('refreshList', SECTION_PRESETS);
                });
            } else {
                if (url == (this.item.presetParams ? this.item.presetParams.favorites_url : undefined)) {
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
                            if (this.item.presetParams.icon) {
                                command.push("icon:"+this.item.presetParams.icon);
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
                        lmsCommand(this.playerId, command).then(({datax})=> {
                            bus.$emit('refreshFavorites');
                        });
                    });
                }
            }
            this.show=false;
        },
        add() {
            var url = this.url ? this.url.trim() : "";
            var name = this.name ? this.name.trim() : "";
            if (url.length<1 || name.length<1) {
                return;
            }
            if (this.isPreset) {
                lmsCommand(this.playerId, ["material-skin-presets", "set", "num:"+this.pos, "url:"+url, "text:"+name]).then(({data})=> {
                    bus.$emit('refreshList', SECTION_PRESETS);
                });
            } else {
                lmsCommand(this.playerId, ["favorites", "exists", url]).then(({data})=> {
                    if (data && data.result && data.result.exists==1) {
                        bus.$emit('showMessage', i18n("Already in favorites"));
                    } else {
                        lmsCommand(this.playerId, ["favorites", "add", "url:"+url, "title:"+name, this.item.id]).then(({datax})=> {
                            bus.$emit('refreshFavorites');
                        });
                    }
                });
            }
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
            bus.$emit('dialogOpen', 'favorite', val);
        }
    }
})

