/*
 * LMS-Material
 *
 * Copyright (c) 2018 Craig Drummond <craig.p.drummond@gmail.com>
 * MIT license.
 */

const TB_MENU_ITEMS = [ {id:'tb:settings', title:'Settings'}];

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
                <v-list-tile @click="setPlayer(item.id)">
                  <v-list-tile-content>
                    <v-list-tile-title v-if="player && item.id === player.id"><v-icon>check</v-icon> {{item.name}}</v-list-tile-title>
                    <v-list-tile-title v-else><v-icon>speaker</v-icon> {{item.name}}</v-list-tile-title>
                  </v-list-tile-content>
                </v-list-tile>
              </template>
              <v-divider></v-divider>
              <v-list-tile>
                <v-list-tile-title><v-icon>link</v-icon> Synchronise</v-list-tile-title> <!-- TODO -->
              </v-list-tile>
            </v-list>
          </v-menu>
          <v-spacer></v-spacer>
          <v-btn icon v-if="playerStatus && playerStatus.isOn && playerStatus.isPlaying" @click.native="doAction(['pause', '1'])">
            <v-icon>pause_circle_outline</v-icon>
          </v-btn>
          <v-btn icon v-else-if="playerStatus && playerStatus.isOn" @click.native="doAction(['play'])">
            <v-icon>play_circle_outline</v-icon>
          </v-btn>
          <v-menu v-if="playerStatus && playerStatus.isOn" @click.native="setVolumeSlider">
            <v-btn slot="activator" icon flat>
              <v-icon v-if="playerStatus.volume>0">volume_up</v-icon>
              <v-icon v-else="playerStatus.volume===0">volume_mute</v-icon>
            </v-btn>
 
            <v-card class="volume-popup">
              <v-list>
                <b>Volume: {{playerVolume}} %</b>
                <v-slider step="5" v-model="playerVolume"></v-slider>
              </v-list>
            </v-card>
          </v-menu>
            <v-menu bottom left>
            <v-btn slot="activator" icon>
              <v-icon>more_vert</v-icon>
            </v-btn>
            <v-list>
              <template v-for="(item, index) in menuItems">
                <v-list-tile @click="menuAction(item.id)">
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
            if (id===TB_MENU_ITEMS[0]) {
                // TODO show settings dialog
            } else {
                bus.$emit('toolbarAction', id);
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
        }
    }
})
