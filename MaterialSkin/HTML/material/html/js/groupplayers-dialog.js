/**
 * LMS-Material
 *
 * Copyright (c) 2018-2024 Craig Drummond <craig.p.drummond@gmail.com>
 * MIT license.
 */
'use strict';

Vue.component('lms-groupplayers-dialog', {
    template: `
<v-dialog v-model="show" v-if="show" scrollable width="600" class="lms-dialog">
 <v-card>
  <v-card-title>{{player ? i18n("Edit group player") : i18n("Create group player")}}</v-card-title>
  <v-card-text>
   <v-list two-line>
    <v-list-tile>
     <v-list-tile-content>
      <v-text-field clearable autocorrect="off" :label="i18n('Name')" v-model="name" class="lms-search" ref="entry"></v-text-field>
     </v-list-tile-content>
    </v-list-tile>
    <v-list-tile>
     <v-select chips deletable-chips multiple :items="players" :label="i18n('Group members')" v-model="chosenPlayers" item-text="label" item-value="id">
      <v-list-tile slot="prepend-item" @click="togglePlayers()" v-if="players.length>1">
       <v-list-tile-action><v-icon>{{selectAllIcon}}</v-icon></v-list-tile-action>
       <v-list-tile-title>{{i18n('Select All')}}</v-list-tile-title>
      </v-list-tile>
      <v-divider slot="prepend-item"></v-divider>
     </v-select>
    </v-list-tile>
    <v-list-tile>
     <v-list-tile-content @click="options.powerMaster = !options.powerMaster" class="switch-label">
      <v-list-tile-title>{{i18n('Power on/off all')}}</v-list-tile-title>
      <v-list-tile-sub-title>{{i18n("Use group player's power settings to control power of all members.")}}</v-list-tile-sub-title>
     </v-list-tile-content>
     <v-list-tile-action><m3-switch v-model="options.powerMaster"></m3-switch></v-list-tile-action>
    </v-list-tile>
    <v-divider></v-divider>
    <v-list-tile>
     <v-list-tile-content @click="options.powerPlay = !options.powerPlay" class="switch-label">
      <v-list-tile-title>{{i18n('Power on all upon play')}}</v-list-tile-title>
      <v-list-tile-sub-title>{{i18n('Power on all group members when playing to group.')}}</v-list-tile-sub-title>
     </v-list-tile-content>
     <v-list-tile-action><m3-switch v-model="options.powerPlay"></m3-switch></v-list-tile-action>
    </v-list-tile>
    <v-list-tile>
     <v-list-tile-content @click="options.greedy = !options.greedy" class="switch-label">
      <v-list-tile-title>{{i18n('Always synchronize all members')}}</v-list-tile-title>
      <v-list-tile-sub-title>{{i18n('Always force members synchronization.')}}</v-list-tile-sub-title>
     </v-list-tile-content>
     <v-list-tile-action><m3-switch v-model="options.greedy"></m3-switch></v-list-tile-action>
    </v-list-tile>
    <v-list-tile>
     <v-list-tile-content @click="options.weakVolume = !options.weakVolume" class="switch-label">
      <v-list-tile-title>{{i18n('Do not set volume')}}</v-list-tile-title>
      <v-list-tile-sub-title>{{i18n("Leave individual player's volume.")}}</v-list-tile-sub-title>
     </v-list-tile-content>
     <v-list-tile-action><m3-switch v-model="options.weakVolume"></m3-switch></v-list-tile-action>
    </v-list-tile>
   </v-list>
  </v-card-text>
  <v-card-actions v-if="queryParams.altBtnLayout">
   <v-spacer></v-spacer>
   <v-btn flat v-if="player" @click.native="update()">{{i18n('Update')}}</v-btn>
   <v-btn flat v-else @click.native="create()">{{i18n('Create')}}</v-btn>
   <v-btn flat @click.native="close()">{{i18n('Cancel')}}</v-btn>
  </v-card-actions>
  <v-card-actions v-else>
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
            options: { powerMaster: true, powerPlay: true, greedy: false, weakVolume: false },
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
        bus.$on('group.open', function(mode, player) {
            if ('edit'==mode) {
                this.setDefaults();
                this.player = player;
                this.name = player.name;
                this.prevName = player.name;
                this.unknownIds = [];

                lmsCommand(this.player.id, ["playergroup", 0, 255]).then(({data}) => {
                    if (data && data.result) {
                        this.options.powerMaster = 1 == parseInt(data.result.powerMaster);
                        this.options.powerPlay = 1 == parseInt(data.result.powerPlay);
                        this.options.weakVolume = 1 == parseInt(data.result.weakVolume);
                        this.options.greedy = 1 == parseInt(data.result.greedy);
                        if (data.result.players_loop) {
                            data.result.players_loop.forEach(p => {
                                if (this.playerIds.has(p.id)) {
                                    this.chosenPlayers.push(p.id);
                                } else {
                                    // Chosen player ID is not connected, or unknown?
                                    // Save, so that we re-add when updating
                                    this.unknownIds.push(p.id);
                                }
                            });
                        }
                        this.show = true;
                        focusEntry(this);
                    }
                });
            } else if ('create'==mode) {
                this.setDefaults();
                this.show = true;
                focusEntry(this);
            }
        }.bind(this));
        bus.$on('noPlayers', function() {
            this.show=false;
        }.bind(this));
        bus.$on('closeDialog', function(dlg) {
            if (dlg == 'group') {
                this.show=false;
            }
        }.bind(this));
    },
    methods: {
        setDefaults() {
            this.name = undefined;
            this.prevName = undefined;
            this.player = undefined;
            this.chosenPlayers = [];
            this.options = { powerMaster: true, powerPlay: true, greedy: false, weakVolume: false };
			this.players = [];
            this.playerIds = new Set();
            this.$store.state.players.forEach(p => {
                if (!p.isgroup) {
                    this.players.push({id:p.id, label:p.name});
                    this.playerIds.add(p.id);
                }
            });
        },
        close() {
            this.show=false;
        },
        update() {
            var name = undefined==this.name ? "" : this.name.trim();
            if (name.length<1) {
                return;
            }
            var members = [];
            this.chosenPlayers.forEach(p => { members.push(p); } );
            this.unknownIds.forEach(p => { members.push(p); } );

            var cmd = ['playergroups', 'update', 'id:'+this.player.id, "members:"+(members.length>0 ? members.join(",") : "-"),
                       'powerMaster:'+(this.options.powerMaster ? 1 : 0),
                       'powerPlay:'+(this.options.powerPlay ? 1 : 0),
                       'greedy:'+(this.options.greedy ? 1 : 0),
                       'weakVolume:'+(this.options.greedy ? 1 : 0)
                      ];

            if (this.prevName != name) {
                // Change name first
                lmsCommand(this.player.id, ['name', name]).then(({data}) => {
                    lmsCommand("", cmd).then(({data}) => {
                        bus.$emit('refreshServerStatus');
                        lmsCommand(this.player.id, ["material-skin-group", "set-modes"]);
                        this.show=false;
                    });
                });
            } else {
                lmsCommand("", cmd).then(({data}) => {
                    lmsCommand(this.player.id, ["material-skin-group", "set-modes"]);
                    this.show=false;
                });
            }
        },
        create() {
            var name = undefined==this.name ? "" : this.name.trim();
            if (name.length<1) {
                return;
            }
            lmsCommand("", ['playergroups', 'add', 'name:'+name, 'members:'+this.chosenPlayers.join(','),
                            'powerMaster:'+(this.options.powerMaster ? 1 : 0),
                            'powerPlay:'+(this.options.powerPlay ? 1 : 0),
                            'greedy:'+(this.options.greedy ? 1 : 0),
                            'weakVolume:'+(this.options.weakVolume ? 1 : 0)]).then(({data}) => {
                bus.$emit('refreshServerStatus', 1000);
                if (data && data.result && data.result.id) {
                    lmsCommand(data.result.id, ["material-skin-group", "set-modes"]);
                }
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
    },
    watch: {
        'show': function(val) {
            this.$store.commit('dialogOpen', {name:'group', shown:val});
        }
    }
})

