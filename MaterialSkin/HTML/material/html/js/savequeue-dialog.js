/**
 * LMS-Material
 *
 * Copyright (c) 2018-2019 Craig Drummond <craig.p.drummond@gmail.com>
 * MIT license.
 */

Vue.component('lms-savequeue', {
    template: `
<v-dialog v-model="show" v-if="show" persistent width="600">
 <v-card>
  <v-card-title>{{i18n('Save play queue')}}</v-card-title>
  <v-form>
   <v-list two-line>
    <v-list-tile>
     <v-list-tile-content>
      <v-text-field clearable :label="i18n('Name')" v-model="name" class="lms-search" ref="entry" :rules="[checkExists]" :error-messages="errorMessages"></v-text-field>
     </v-list-tile-content>
    </v-list-tile>
   </v-list>
  </v-form>
  <v-card-actions>
   <v-spacer></v-spacer>
   <v-btn flat @click.native="cancel()">{{i18n('Cancel')}}</v-btn>
   <v-btn flat @click.native="save()">{{nameExists ? i18n('Overwrite') : i18n('Save')}}</v-btn>
  </v-card-actions>
 </v-card>
</v-dialog>
`,
    props: [],
    data() {
        return {
            show: false,
            name: "",
            nameExists: false,
            errorMessages: undefined
        }
    },
    mounted() {
        this.existing = new Set();
        bus.$on('savequeue.open', function(name) {
            this.show = true;
            this.name = name;
            this.errorMessages = undefined;
            focusEntry(this);
            this.checkExists();
            lmsCommand("", ["playlists", 0, 10000]).then(({data})=>{
                if (data && data.result && data.result.playlists_loop) {
                    var loop = data.result.playlists_loop;
                    var names = new Set();
                    for (var i=0, len=loop.length; i<len; ++i) {
                        names.add(loop[i].playlist);
                    }
                    this.existing = names;
                    this.checkExists();
                }
            });
        }.bind(this));
        bus.$on('noPlayers', function() {
            this.show=false;
        }.bind(this));
        bus.$on('esc', function() {
            if (this.$store.state.activeDialog == 'savequeue') {
                this.show=false;
            }
        }.bind(this));
    },
    methods: {
        checkExists() {
            var name = this.name ? this.name.trim() : "";
            this.nameExists = this.existing.has(name);
            this.errorMessages = this.nameExists ? i18n("A playlist with this name already exists") : "";
            return this.nameExists;
        },
        cancel() {
            this.show=false;
        },
        save() {
            var name = this.name ? this.name.trim() : "";
            if (name.length<1) {
                return;
            }
            this.show=false;
            lmsCommand(this.$store.state.player.id, ["playlist", "save", name]).then(({data})=>{
                bus.$emit('refreshPlaylist', name);
            }).catch(err => {
                bus.$emit('showError', err, i18n("Failed to save play queue!"));
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
            this.$store.commit('dialogOpen', {name:'savequeue', shown:val});
        }
    }
})

