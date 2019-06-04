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
  <v-card-title>{{item ? i18n("Edit Favorite") : i18n("Add Favorite")}}</v-card-title>
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
   </v-list>
  </v-form>
  <v-card-actions>
   <v-spacer></v-spacer>
   <v-btn flat @click.native="cancel()">{{i18n('Cancel')}}</v-btn>
   <v-btn flat @click.native="update()" v-if="item">{{i18n('Update')}}</v-btn>
   <v-btn flat @click.native="add()" v-if="!item">{{i18n('Add')}}</v-btn>
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
        bus.$on('favorite.open', function(mode, item) {
            if ('edit'==mode) {
                this.playerId = this.$store.state.player ? this.$store.state.player.id : "";
                this.item = item;
                this.name = item.title;
                this.url = item.presetParams ? item.presetParams.favorites_url : undefined;
                this.show = true;
            } else if ('add'==mode) {
                this.playerId = this.$store.state.player ? this.$store.state.player.id : "";
                this.item = undefined;
                this.name = "";
                this.url = "";
                this.show=true;
            }
        }.bind(this));
        bus.$on('noPlayers', function() {
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
            if (url == (this.item.presetParams ? this.item.presetParams.favorites_url : undefined)) {
                if (name == this.item.title) {
                    return;
                }
                lmsCommand(this.playerId, ["favorites", "rename", this.item.id, "title:"+name]).then(({data})=> {
                    bus.$emit('refreshFavorites');
                });
            } else {
                lmsCommand(this.playerId, ["favorites", "delete", this.item.id]).then(({data})=> {
                    lmsCommand(this.playerId, ["favorites", "add", "url:"+url, "title:"+name]).then(({datax})=> {
                        bus.$emit('refreshFavorites');
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
                    lmsCommand(this.playerId, ["favorites", "add", "url:"+url, "title:"+name]).then(({datax})=> {
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
            bus.$emit('dialogOpen', 'favorite', val);
        }
    }
})

