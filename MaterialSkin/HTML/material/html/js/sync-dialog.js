/**
 * LMS-Material
 *
 * Copyright (c) 2018-2022 Craig Drummond <craig.p.drummond@gmail.com>
 * MIT license.
 */
'use strict';

Vue.component('lms-sync-dialog', {
    template: `
<v-dialog v-model="show" v-if="show" persistent width="600" class="lms-dialog">
 <v-card v-if="player">
  <v-card-text>
   <v-container grid-list-md style="padding: 4px">
    <v-layout wrap>
     <v-flex xs12>{{i18n("Select which players you would like to synchronise with '%1':", player.name)}}</v-flex>
     <v-flex xs12>
      <v-list class="sleep-list dialog-main-list">
       <v-list-tile @click="toggleAll()">
        <v-list-tile-avatar :tile="true" class="lms-avatar"><v-icon>{{selectAllIcon}}</v-icon></v-list-tile-avatar>
        <v-list-tile-title class="sleep-item">{{i18n('Select All')}}</v-list-tile-title>
       </v-list-tile>
       <v-divider></v-divider>
       <template v-for="(p, index) in players">
        <v-list-tile @click="p.synced=!p.synced; numSync+=(p.synced ? 1 : -1)">
         <v-list-tile-avatar :tile="true" class="lms-avatar"><v-icon>{{p.synced ? 'check_box' : 'check_box_outline_blank'}}</v-icon></v-list-tile-avatar>
         <v-list-tile-title class="sleep-item">{{p.name}}</v-list-tile-title>
        </v-list-tile>
        <v-divider></v-divider>
       </template>
      </v-list>
     </v-flex>
    </v-layout>
   </v-container>
  </v-card-text>
  <v-card-actions>
   <p style="margin-left:10px" class="dimmed">{{i18np("1 Player", "%1 Players", numSync)}}</p>
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
            numSync:0
        }
    },
    computed: {
        selectAllIcon () {
            if (this.numSync==this.players.length) {
                return "check_box";
            }
            if (this.numSync>0) {
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
            this.numSync = 0;
            lmsCommand(this.player.id, ["sync", "?"]).then(({data}) => {
                if (data && data.result && undefined!=data.result._sync) {
                    let sync = data.result._sync.split(",");
                    this.origSync = sync.length>0 && sync[0]!="-" ? new Set(sync) : new Set();
                    this.players=[];
                    let numOtherStdPlayers = 0;
                    this.$store.state.players.forEach(p => {
                        if (p.id!==this.player.id && !p.isgroup) {
                            let synced = this.origSync.has(p.id);
                            let play = {id:p.id, name:p.name, synced:synced};
                            this.players.push(play);
                            numOtherStdPlayers++;
                            if (synced) {
                                this.numSync++;
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
            for (let i=0, len=this.players.length; i<len; ++i) {
                if (this.players[i].synced) {
                    newSync.add(this.players[i].id);
                }
            }

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
        toggleAll() {
            let sel = this.numSync!=this.players.length;
            for (let i=0, len=this.players.length; i<len; ++i) {
                this.players[i].synced = sel;
            }
            this.numSync = sel ? this.players.length : 0;
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

