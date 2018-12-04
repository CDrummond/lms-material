/**
 * LMS-Material
 *
 * Copyright (c) 2018 Craig Drummond <craig.p.drummond@gmail.com>
 * MIT license.
 */

Vue.component('lms-groupplayers-dialog', {
    template: `
<v-dialog v-model="show" width="450" persistent class="lms-dialog">
 <v-card>
  <v-card-title>{{player ? i18n("Edit Group Player") : i18n("Create Group Player")}}</v-card-title>
  <v-list two-line>
   <v-list-tile>
    <v-list-tile-content>
     <v-text-field single-line clearable :label="i18n('Name')" v-model="name" class="lms-search"></v-text-field>
    </v-list-tile-content>
   </v-list-tile>
   <v-divider></v-divider>
   <v-list-tile>
    <v-select chips deletable-chips multiple :items="players" :label="i18n('Group members')" v-model="chosenPlayers" item-text="label" item-value="id">
     <v-list-tile slot="prepend-item" @click="togglePlayers()" v-if="players.length>1">
      <v-list-tile-action><v-icon>{{selectAllIcon}}</v-icon></v-list-tile-action>
      <v-list-tile-title>{{i18n('Select All')}}</v-list-tile-title>
     </v-list-tile>
     <v-divider slot="prepend-item"></v-divider>
    </v-select>
   </v-list-tile>
   <v-divider></v-divider>
   <v-list-tile>
    <v-list-tile-content @click="options.powerMaster = !options.powerMaster" class="switch-label">
     <v-list-tile-title>{{i18n('Power on/off all')}}</v-list-tile-title>
     <v-list-tile-sub-title>{{i18n("Use group player's power settings to control power of all members.")}}</v-list-tile-title>
    </v-list-tile-content>
    <v-list-tile-action><v-switch v-model="options.powerMaster"></v-switch></v-list-tile-action>
   </v-list-tile>
   <v-divider></v-divider>
   <v-list-tile>
    <v-list-tile-content @click="options.powerPlay = !options.powerPlay" class="switch-label">
     <v-list-tile-title>{{i18n('Power on all on play')}}</v-list-tile-title>
     <v-list-tile-sub-title>{{i18n('Power on all group members when playing to group.')}}</v-list-tile-title>
    </v-list-tile-content>
    <v-list-tile-action><v-switch v-model="options.powerPlay"></v-switch></v-list-tile-action>
   </v-list-tile>
  </v-list>
  <v-card-actions>
   <v-spacer></v-spacer>
   <v-btn flat @click.native="close()">{{i18n('Cancel')}}</v-btn>
   <v-btn flat v-if="player" @click.native="update()">{{i18n('Update')}}</v-btn>
   <v-btn flat v-else @click.native="create()">{{i18n('Create')}}</v-btn>
  </v-card-actions>
 </v-card>
</v-dialog>
`,
    props: [],
    data() {
        return {
            show: false,
            player: undefined,
            name: undefined,
            options: { powerMaster: true, powerPlay: true },
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
        bus.$on('editGroup', function(player) {
            this.setDefaults();
            this.player = player;
            this.name = player.name;

            lmsCommand(this.player.id, ["playergroup", 0, 255]).then(({data}) => {
                if (data && data.result) {
                    this.options.powerMaster = 1 == parseInt(data.result.powerMaster);
                    this.options.powerPlay = 1 == parseInt(data.result.powerPlay);
                    if (data.result.players_loop) {
                        data.result.players_loop.forEach(p => { this.chosenPlayers.push(p.id); } );
                    }
                    this.show = true;
                }
            });
        }.bind(this));
        bus.$on('createGroup', function() {
            this.setDefaults();
            this.show = true;
        }.bind(this));
    },
    methods: {
        setDefaults() {
            this.name = undefined;
            this.player = undefined;
            this.chosenPlayers = [];
            this.options = { powerMaster: true, powerPlay: true };
            this.$store.state.players.forEach(p => {
                if (!p.isgroup) {
                    this.players.push({id:p.id, label:p.name});
                }
            });
        },
        close() {
            this.show=false;
        },
        update() {
            var name = this.name.trim();
            if (name.length<1) {
                return;
            }
            lmsCommand("", ['playergroups', 'update', 'id:'+player.id, 'name:'+name, 'players:'+this.chosenPlayers.join(','), 
                            'powerMaster:'+this.options.powerMaster, 'powerPlay:'+this.options.powerPlay]).then(({data}) => {
                bus.$emit('updateServerStatus');
                this.show=false;
            });
        },
        create() {
            var name = this.name.trim();
            if (name.length<1) {
                return;
            }
            lmsCommand("", ['playergroups', 'create', 'id:'+player.id, 'name:'+name, 'players:'+this.chosenPlayers.join(','), 
                            'powerMaster:'+this.options.powerMaster, 'powerPlay:'+this.options.powerPlay]).then(({data}) => {
                bus.$emit('updateServerStatus');
                this.show=false;
            });
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

