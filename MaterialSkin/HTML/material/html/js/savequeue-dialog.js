/**
 * LMS-Material
 *
 * Copyright (c) 2018-2021 Craig Drummond <craig.p.drummond@gmail.com>
 * MIT license.
 */
'use strict';

Vue.component('lms-savequeue', {
    template: `
<v-dialog v-model="show" v-if="show" persistent width="600">
 <v-card>
  <v-card-title>{{i18n('Save play queue')}}</v-card-title>
  <v-form class="save-queue-dialog">
   <v-list two-line>
    <v-list-tile>
     <v-list-tile-content>
      <v-combobox v-model="name" :items="existing" :label="i18n('Name')" class="lms-search" ref="entry" id="savequeue-name"></v-combobox>
     </v-list-tile-content>
    </v-list-tile>
   </v-list>
  </v-form>
  <v-card-actions>
   <v-spacer></v-spacer>
   <v-btn flat @click.native="cancel()">{{i18n('Cancel')}}</v-btn>
   <v-btn flat @click.native="save()">{{i18n('Save')}}</v-btn>
  </v-card-actions>
 </v-card>
</v-dialog>
`,
    props: [],
    data() {
        return {
            show: false,
            name: "",
            existing: []
        }
    },
    mounted() {
        bus.$on('savequeue.open', function(name) {
            this.show = true;
            this.name = name;
            this.currentName = ""+name;
            focusEntry(this);
            lmsCommand("", ["playlists", 0, 10000]).then(({data})=>{
                if (data && data.result && data.result.playlists_loop) {
                    var loop = data.result.playlists_loop;
                    this.existing = [];
                    for (var i=0, len=loop.length; i<len; ++i) {
                        this.existing.push(loop[i].playlist);
                    }
                    this.existing.sort();
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
        cancel() {
            this.show=false;
        },
        save() {
            // For some reason 'this.name' is not updated if the combo has focus when the
            // button is pressed. Work-around this by getting the element's value...
            var elem = document.getElementById('savequeue-name');
            var name = elem && elem.value ? elem.value.trim() : "";
            if (name.length<1) {
                return;
            }
            this.show=false;
            lmsCommand(this.$store.state.player.id, ["playlist", "save", name]).then(({data})=>{
                if (data && data.result && data.result.writeError && 1==parseInt(data.result.writeError)) {
                    bus.$emit('showError', undefined, i18n("Failed to save play queue!"));
                }
                bus.$emit('refreshPlaylist', name);
                if (this.currentName!=name) {
                    // Refresh status to pick up new name quicker...
                    bus.$emit('refreshStatus', this.$store.state.player.id);
                }
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

