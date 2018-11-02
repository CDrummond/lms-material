/**
 * LMS-Material
 *
 * Copyright (c) 2018 Craig Drummond <craig.p.drummond@gmail.com>
 * MIT license.
 */

Vue.component('lms-sync-dialog', {
    template: `
      <v-dialog v-model="show" width="450" class="lms-dialog">
        <v-card>
          <v-card-text>
            <v-container grid-list-md>
              <v-layout wrap>
                <v-flex xs12>{{i18n('Select which other player you would like to synchronise playback with.')}}</v-flex>
                <v-flex xs12>
                  <v-select :items="players" :label="i18n('Synchronise with')" v-model="sync" item-text="label" item-value="key"></v-select>
                </v-flex>
              </v-layout>
            </v-container>
          </v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn flat @click.native="close()">{{i18n('Close')}}</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
`,
    props: [],
    data() {
        return {
            show: false,
            sync: undefined,
            players: []
        }
    },
    mounted() {
        bus.$on('synchronise', function() {
            this.playerId = this.$store.state.player.id;
            lmsCommand(this.playerId, ["sync", "?"]).then(({data}) => {
                if (data && data.result && undefined!=data.result._sync) {
                    this.sync=this.syncOrig=data.result._sync;
                    this.players=[];
                    this.players.push({key:"-", label:i18n("Do not sync")});
                    this.$store.state.players.forEach(i => {
                        if (i.id!==this.playerId) {
                            this.players.push({key:i.id, label:i.name});
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
            if (this.sync!==this.syncOrig) {
                lmsCommand(this.playerId, ["sync", this.sync]);
            }
        },
        i18n(str) {
            if (this.show) {
                return i18n(str);
            } else {
                return str;
            }
        }
    }
})

