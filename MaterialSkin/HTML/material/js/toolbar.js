/*
 * LMS-Material
 *
 * Copyright (c) 2018 Craig Drummond <craig.p.drummond@gmail.com>
 * MIT license.
 */

const TB_UI_SETTINGS     = {id:'tb:settings',       title:'Settings'};
const TB_PLAYER_SETTINGS = {id:"tb:playersettings", title:'Player Settings'};
const TB_SERVER_SETTINGS = {id:"tb:serversettings", title:'Server Settings', href:'../Default/settings/index.html'};
const TB_MENU_ITEMS = [ TB_UI_SETTINGS, TB_PLAYER_SETTINGS, TB_SERVER_SETTINGS ];

Vue.component('lms-toolbar', {
    template: `
        <v-toolbar fixed dense app class="lms-toolbar">
          <v-menu bottom class="toolbar-menu">
            <v-toolbar-title slot="activator">
              {{player ? player.name : 'No Player'}} <v-icon>arrow_drop_down</v-icon>
              <div class="toolbar-subtitle">{{songInfo}}</div>
            </v-toolbar-title>
       
            <v-list>
              <template v-for="(item, index) in players">
                <v-divider v-if="item.isgroup && index>0 && !players[index-1].isgroup" ></v-divider>
                <v-list-tile @click="setPlayer(item.id)">
                  <v-list-tile-content>
                    <v-list-tile-title>
                      <v-icon small v-if="player && item.id === player.id && players && players.length>1">radio_button_checked</v-icon>
                      <v-icon small v-else-if="players && players.length>1">radio_button_unchecked</v-icon>
                      <v-icon v-if="item.isgroup">speaker_group</v-icon>
                      <v-icon v-else>speaker</v-icon>&nbsp;{{item.name}}</v-list-tile-title>
                  </v-list-tile-content>
                </v-list-tile>
              </template>
              <v-divider></v-divider>
              <v-list-tile @click="togglePower()">
                <v-list-tile-content v-if="player && player.ison">
                  <v-list-tile-title class="pm-icon-indent"><v-icon color="primary">power_settings_new</v-icon>&nbsp;Switch off</v-list-tile-title>
                </v-list-tile-content>
                <v-list-tile-content v-else>
                  <v-list-tile-title class="pm-icon-indent"><v-icon class="dimmed-icon">power_settings_new</v-icon>&nbsp;Switch on</v-list-tile-title>
                </v-list-tile-content>
              </v-list-tile>

              <v-divider v-if="players && players.length>1" ></v-divider>
              <v-list-tile v-if="playerGroups && players && players.length>1" @click="bus.$emit('manageGroups')">
                <v-list-tile-content><v-list-tile-title class="pm-noicon-indent">&nbsp;Manage player groups</v-list-tile-title></v-list-tile-content>
              </v-list-tile>
              <v-list-tile v-else-if="players && players.length>1" @click="bus.$emit('synchronise')">
                <v-list-tile-content><v-list-tile-title class="pm-icon-indent"><v-icon>link</v-icon>&nbsp;Synchronise</v-list-tile-title></v-list-tile-content>
              </v-list-tile>
            </v-list>
          </v-menu>
          <v-spacer></v-spacer>
          <v-btn icon v-if="playerStatus && playerStatus.isOn && playerStatus.isPlaying" @click.native="doAction(['pause', '1'])" class="toolbar-button">
            <v-icon>pause_circle_outline</v-icon>
          </v-btn>
          <v-btn icon v-else-if="playerStatus && playerStatus.isOn" @click.native="doAction(['play'])" class="toolbar-button">
            <v-icon>play_circle_outline</v-icon>
          </v-btn>
          <v-menu v-if="playerStatus && playerStatus.isOn" @click.native="setVolumeSlider">
            <v-btn slot="activator" icon flat class="toolbar-button">
              <v-icon v-if="playerStatus.volume>0">volume_up</v-icon>
              <v-icon v-else="playerStatus.volume===0">volume_mute</v-icon>
            </v-btn>
 
            <v-card class="volume-popup">
              <v-container grid-list-md text-xs-center>
                <v-layout row wrap>
                <v-flex xs12>{{playerVolume}} %</v-flex>
                <v-flex xs12>
                <v-layout>
                  <v-btn flat icon @click.stop="volumeDown" class="vol-btn"><v-icon>volume_down</v-icon></v-btn>
                  <v-slider step="5" v-model="playerVolume" class="vol-slider"></v-slider>
                  <v-btn flat icon @click.stop="volumeUp" class="vol-btn"><v-icon>volume_up</v-icon></v-btn>
                </v-layout>
                </v-flex>
              </v-list>
            </v-card>
          </v-menu>
            <v-menu bottom left>
            <v-btn slot="activator" icon>
              <v-icon>more_vert</v-icon>
            </v-btn>
            <v-list>
              <template v-for="(item, index) in menuItems">
                <v-list-tile v-if="item.href" :href="item.href" target="_blank">
                  <v-list-tile-title>{{item.title}}</v-list-tile-title>
                </v-list-tile>
                <v-list-tile v-else @click="menuAction(item.id)">
                  <v-list-tile-title>{{item.title}}</v-list-tile-title>
                </v-list-tile>
              </template>
            </v-list>
          </v-menu>
        </v-toolbar>
    `,
    props: [],
    data() {
        return { playerVolume:-1, 
                 playerVolumeCurrent:-1,
                 playerGroups: false,
                 menuItems: TB_MENU_ITEMS
               }
    },
    mounted() {
        bus.$on('addToolbarActions', function(actions) {
            actions.forEach(i => {
                this.menuItems.push(i);
            });
        }.bind(this));
        bus.$on('removeToolbarActions', function(actions) {
            actions.forEach(i => {
                var index = this.menuItems.indexOf(i);
                if (index > -1) {
                    this.menuItems.splice(index, 1);
                }
            });
        }.bind(this));
        bus.$on('playerGroups', function(playerGroups) {
            this.playerGroups = playerGroups;
        }.bind(this));
    },
    methods: {
        setPlayer(name) {
            this.$store.commit('setPlayer', name);
        },
        doAction(command) {
            bus.$emit('playerCommand', command);
        },
        setVolumeSlider() {
            this.playerVolumeCurrent = this.$store.state.playerStatus.volume;
            this.playerVolume = this.playerVolumeCurrent;
        },
        menuAction(id) {
            bus.$emit('toolbarAction', id);
        },
        volumeDown() {
            if (this.playerVolume<=5) {
                this.playerVolume = 0;
            } else {
                this.playerVolume -= 5;
            }
        },
        volumeUp() {
            if (this.playerVolume>=95) {
                this.playerVolume = 100;
            } else {
                this.playerVolume += 5;
            }
        },
        togglePower() {
            if (this.$store.state.player.ison) {
                this.$confirm("Switch off '"+this.$store.state.player.name+"'?", {buttonTrueText: 'Switch Off', buttonFalseText: 'Cancel'}).then(res => {
                    if (res) {
                        bus.$emit('power', "1");
                    }
                });
            } else {
                bus.$emit('power', "0");
            }
        }
    },
    watch: {
        'playerVolume': function(newVal) {
            if (this.playerVolumeCurrent !== newVal) {
                this.playerVolumeCurrent = newVal;
                bus.$emit('playerCommand', ["mixer", "volume", newVal]);
            }
        }
    },
    computed: {
        player () {
            return this.$store.state.player
        },
        players () {
            return this.$store.state.players
        },
        playerStatus () {
            return this.$store.state.playerStatus
        },
        songInfo() {
            if (this.$store.state.playerStatus && this.$store.state.playerStatus.current) {
                if (this.$store.state.playerStatus.current.title) {
                    if (this.$store.state.playerStatus.current.artist) {
                        return this.$store.state.playerStatus.current.title+" - "+this.$store.state.playerStatus.current.artist;
                    } else {
                        return this.$store.state.playerStatus.current.title;
                    }
                } else if (this.$store.state.playerStatus.current.artist) {
                    return this.$store.state.playerStatus.current.artist;
                }
            }
            return "Nothing playing";
        },
    }
})
