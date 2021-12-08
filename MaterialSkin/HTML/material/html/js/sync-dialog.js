/**
 * LMS-Material
 *
 * Copyright (c) 2018-2021 Craig Drummond <craig.p.drummond@gmail.com>
 * MIT license.
 */
'use strict';

Vue.component('lms-sync-dialog', {
    template: `
<v-dialog v-model="show" v-if="show" persistent width="600" class="lms-dialog">
 <v-card v-if="player">
  <v-card-text>
   <v-container grid-list-md>
    <v-layout wrap>
     <v-flex xs12>{{i18n("Select which players you would like to synchronise with '%1':", player.name)}}</v-flex>
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
            if (player.isgroup) {
                return;
            }
            this.player = player;
            lmsCommand(this.player.id, ["sync", "?"]).then(({data}) => {
                if (data && data.result && undefined!=data.result._sync) {
                    var sync = data.result._sync.split(",");
                    this.origSync = sync.length>0 && sync[0]!="-" ? new Set(sync) : new Set();
                    this.players=[];
                    this.chosenPlayers=[];
                    var numOtherStdPlayers = 0;
                    this.$store.state.players.forEach(p => {
                        if (p.id!==this.player.id && !p.isgroup) {
                            var play = {id:p.id, label:p.name};
                            this.players.push(play);
                            numOtherStdPlayers++;
                            if (this.origSync.has(play.id)) {
                                this.chosenPlayers.push(play.id);
                            }
                        }
                    });
                    if (numOtherStdPlayers>0) {
                        this.show = true;
                    }
                }
            });
        }.bind(this));
        bus.$on('noPlayers', function() {
            this.show=false;
        }.bind(this));
        bus.$on('esc', function() {
            if (this.$store.state.activeDialog == 'sync') {
                this.show=false;
            }
        }.bind(this));
    },
    methods: {
        close() {
            this.show=false;
        },
        sync() {
            var newSync = new Set();
            this.chosenPlayers.forEach(p => { newSync.add(p); } );

            // Build list of commands to execute...
            var commands = [];
            // ...first remove any previosuly synced players that will no longer be synced
            this.origSync.forEach(p => {
                if (!newSync.has(p)) {
                    commands.push({player:p, command:["sync", "-"]});
                }
            });
            // ...now add any new players
            newSync.forEach(p => {
                if (!this.origSync.has(p)) {
                    commands.push({player:this.player.id, command:["sync", p]});
                }
            });
            if (0==commands.length) {
                // No changes!
                this.show=false;
            } else {
                this.doCommands(commands);
            }
        },
        doCommands(commands) {
            if (!this.show) {
                return;
            }
            if (0==commands.length) {
                this.show=false;
                bus.$emit('refreshStatus', this.player.id);
                bus.$emit('syncChanged');
            } else {
                let command = commands.shift();
                logJsonMessage("SYNC", command);
                lmsCommand(command.player, command.command).then(({data}) => {
                    this.doCommands(commands);
                });
            }
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
    },
    watch: {
        'show': function(val) {
            this.$store.commit('dialogOpen', {name:'sync', shown:val});
        }
    }
})

