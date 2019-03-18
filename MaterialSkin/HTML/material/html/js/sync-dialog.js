/**
 * LMS-Material
 *
 * Copyright (c) 2018-2019 Craig Drummond <craig.p.drummond@gmail.com>
 * MIT license.
 */

Vue.component('lms-sync-dialog', {
    template: `
<v-dialog v-model="show" width="600" persistent class="lms-dialog">
 <v-card v-if="player">
  <v-card-text>
   <v-container grid-list-md>
    <v-layout wrap>
     <v-flex xs12>{{i18n("Select which players you would like to synchronise with '%1'.", player.name)}}</v-flex>
     <v-flex xs12>
      <v-select chips deletable-chips multiple :items="players" :label="i18n('Synchronise players')" v-model="chosenPlayers" item-text="label" item-value="id">
       <v-list-tile slot="prepend-item" @click="togglePlayers()" v-if="players.length>1">
        <v-list-tile-action><v-icon>{{selectAllIcon}}</v-icon></v-list-tile-action>
        <v-list-tile-title>{{i18n('Select All')}}</v-list-tile-title>
       </v-list-tile>
       <v-divider slot="prepend-item"></v-divider>
      </v-select>
     </v-flex>
    </v-layout>
   </v-container>
  </v-card-text>
  <v-card-actions>
   <v-spacer></v-spacer>
   <v-btn flat @click.native="close()">{{i18n('Cancel')}}</v-btn>
   <v-btn flat @click.native="sync()">{{i18n('Sync')}}</v-btn>
  </v-card-actions>
 </v-card>
</v-dialog>
`,
    props: [],
    data() {
        return {
            show: false,
            player: undefined,
            players: [],
            chosenPlayers: []
        }
    },
    computed: {
        selectAllIcon () {
            if (this.chosenPlayers.length==this.players.length) {
                return "check_box";
            }
            if (this.chosenPlayers.length>0) {
                return "indeterminate_check_box";
            }
            return "check_box_outline_blank";
        }
    },
    mounted() {
        bus.$on('sync.open', function(player) {
            this.player = player;
            lmsCommand(this.player.id, ["sync", "?"]).then(({data}) => {
                if (data && data.result && undefined!=data.result._sync) {
                    var sync = data.result._sync.split(",");
                    this.origSync = sync.length>0 && sync[0]!="-" ? new Set(sync) : new Set();
                    this.players=[];
                    this.chosenPlayers=[];
                    this.$store.state.players.forEach(p => {
                        if (p.id!==this.player.id) {
                            var play = {id:p.id, label:p.name};
                            this.players.push(play);
                            if (this.origSync.has(play.id)) {
                                this.chosenPlayers.push(play.id);
                            }
                        }
                    });
                    this.show = true;
                }
            });
        }.bind(this));
    },
    methods: {
        close() {
            this.show=false;
        },
        sync() {
            this.show=false;
            var newSync = new Set();
            this.chosenPlayers.forEach(p => { newSync.add(p); } );

            this.origSync.forEach(p => {
                if (!newSync.has(p)) {
                    lmsCommand(p, ["sync", "-"]);
                }
            });

            newSync.forEach(p => {
                lmsCommand(this.player.id, ["sync", p]);
            });
            bus.$emit('syncChanged');
        },
        togglePlayers() {
            if (this.chosenPlayers.length==this.players.length) {
                this.chosenPlayers = [];
            } else {
                this.chosenPlayers = [];
                this.players.forEach(p => { this.chosenPlayers.push(p.id); } );
            }
        },
        i18n(str, arg) {
            if (this.show) {
                return i18n(str, arg);
            } else {
                return str;
            }
        }
    }
})

