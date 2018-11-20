/**
 * LMS-Material
 *
 * Copyright (c) 2018 Craig Drummond <craig.p.drummond@gmail.com>
 * MIT license.
 */

var TB_UI_SETTINGS     = {id:'tb:settings'       };
var TB_PLAYER_SETTINGS = {id:"tb:playersettings" };
var TB_SERVER_SETTINGS = {id:"tb:serversettings", href:'../Default/settings/index.html'};
var TB_INFO            = {id:"tb:info"           };
var TB_MANAGE_PLAYERS  = {id:"tb-manageplayers"  };

Vue.component('lms-toolbar', {
    template: `
<div>
<v-toolbar fixed dense app class="lms-toolbar">
 <v-menu bottom class="toolbar-menu">
  <v-toolbar-title slot="activator">
   <div class="maintoolbar-title"><v-icon v-if="playerStatus.sleepTimer" style="padding-right: 8px">hotel</v-icon>{{player ? player.name : trans.noplayer}} <v-icon>arrow_drop_down</v-icon></div>
   <div v-if="!desktop" class="maintoolbar-subtitle subtext">{{undefined===songInfo ? trans.nothingplaying : songInfo}}</div>
  </v-toolbar-title>
       
  <v-list class="toolbar-player-list">
   <template v-for="(item, index) in players">
    <v-divider v-if="item.isgroup && index>0 && !players[index-1].isgroup" ></v-divider>
    <v-list-tile @click="setPlayer(item.id)">
     <v-list-tile-content>
     <v-list-tile-title>
      <v-icon small class="lms-small-menu-icon" v-if="player && item.id === player.id && players && players.length>1">radio_button_checked</v-icon>
      <v-icon small class="lms-small-menu-icon" v-else-if="players && players.length>1">radio_button_unchecked</v-icon>
      <v-icon v-if="item.isgroup" v-bind:class="{'dimmed': !item.ison || (item.id === player.id && !playerStatus.ison)}">speaker_group</v-icon>
      <v-icon v-else v-bind:class="{'dimmed': !item.ison || (item.id === player.id && !playerStatus.ison)}">speaker</v-icon>&nbsp;{{item.name}}</v-list-tile-title>
     </v-list-tile-content>
    </v-list-tile>
   </template>

   <v-divider v-if="(player && player.canpoweroff) || (players && players.length>1) || playerStatus.sleepTimer"></v-divider>
   <v-list-tile v-if="player && player.canpoweroff" @click="togglePower()">
    <v-list-tile-content v-if="playerStatus.ison">
     <v-list-tile-title v-bind:class="{'pm-icon-indent' : players && players.length>1}"><v-icon>power_settings_new</v-icon>&nbsp;{{trans.switchoff}}</v-list-tile-title>
    </v-list-tile-content>
    <v-list-tile-content v-else>
     <v-list-tile-title v-bind:class="{'pm-icon-indent' : players && players.length>1}"><v-icon class="dimmed">power_settings_new</v-icon>&nbsp;{{trans.switchon}}</v-list-tile-title>
    </v-list-tile-content>
   </v-list-tile>

   <v-list-tile v-if="playerGroups && players && players.length>1" @click="bus.$emit('manageGroups')">
    <v-list-tile-content><v-list-tile-title class="pm-noicon-indent">&nbsp;{{trans.managegroups}}</v-list-tile-title></v-list-tile-content>
   </v-list-tile>
   <v-list-tile v-else-if="players && players.length>1" @click="bus.$emit('synchronise')">
    <v-list-tile-content><v-list-tile-title class="pm-icon-indent"><v-icon>link</v-icon>&nbsp;{{trans.synchronise}}</v-list-tile-title></v-list-tile-content>
   </v-list-tile>
   <v-list-tile v-if="playerStatus.sleepTimer">
    <v-list-tile-content>
     <v-list-tile-title class="pm-icon-indent dimmed"><v-icon>hotel</v-icon>&nbsp;{{playerStatus.sleepTimer | displayTime}}</v-list-tile-title>
    </v-list-tile-content>
   </v-list-tile>
  </v-list>
 </v-menu>
 <v-spacer></v-spacer>
 <v-btn icon :title="trans.info"  v-if="!desktop && infoPlugin && !infoOpen && $route.path=='/nowplaying'" @click.native="bus.$emit('info')" class="toolbar-button">
  <v-icon>info</v-icon>
 </v-btn>
 <v-btn icon v-else-if="!desktop && playerStatus.ison && playerStatus.isplaying" @click.native="doAction(['pause', '1'])" class="toolbar-button">
  <v-icon>pause_circle_outline</v-icon>
 </v-btn>
 <v-btn icon v-else-if="!desktop && playerStatus.ison" @click.native="doAction(['play'])" class="toolbar-button">
  <v-icon>play_circle_outline</v-icon>
 </v-btn>
 <v-btn v-if="desktop && playerStatus.ison" icon flat class="toolbar-button" @click="volumeDown"><v-icon>volume_down</v-icon></v-btn>
 <v-slider v-if="desktop && playerStatus.ison" step="1" v-model="playerVolume.val" class="vol-slider"></v-slider>
 <v-btn v-if="desktop && playerStatus.ison" icon flat class="toolbar-button" @click="volumeUp"><v-icon>volume_up</v-icon></v-btn>
 <p v-if="desktop && playerStatus.ison" class="vol-label">{{playerVolume.val}} %</p>
 <v-btn v-else-if="!desktop && playerStatus.ison" icon flat class="toolbar-button" v-bind:class="{'dimmed': playerStatus.volume<0}" @click="bus.$emit('volume')">
  <v-icon v-if="playerStatus.volume>0">volume_up</v-icon>
  <v-icon v-else="playerStatus.volume<=0">volume_mute</v-icon>
 </v-btn>
 <v-btn icon :title="trans.info" v-if="desktop && infoPlugin" @click.native="bus.$emit('info')" class="toolbar-button">
  <v-icon>info</v-icon>
 </v-btn>
 <v-menu bottom left>
  <v-btn slot="activator" icon><v-icon>more_vert</v-icon></v-btn>
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
<v-snackbar v-model="snackbar.show" :multi-line="true" :timeout="2500" :color="snackbar.color" top>{{ snackbar.msg }}</v-snackbar>
</div>
    `,
    props: ['desktop'],
    data() {
        return { desktop:false,
                 songInfo:undefined,
                 playerStatus: { ison: 1, isplaying: false, volume: 0, current: { title:undefined, artist:undefined }, sleepTimer: undefined },
                 playerGroups: false,
                 menuItems: [],
                 trans:{noplayer:undefined, synchronise:undefined,managegroups:undefined,nothingplaying:undefined, info:undefined,
                        switchoff:undefined, switchon:undefined},
                 infoOpen: false,
                 playerVolume: {val: -1, current:-1, prev:-1, lastUpdate:undefined},
                 snackbar:{ show: false, msg: undefined}
               }
    },
    mounted() {
        /*
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
        */

        // Player groups plugin
        /* TODO: Enable, and implement!
        lmsCommand("", ["can", "playergroups", "items", "?"]).then(({data}) => {
            if (data && data.result && data.result._can) {
                this.playerGroups = 1==data.result._can;
            }
        });
        */

        bus.$on('playerStatus', function(playerStatus) {
            if (playerStatus.ison!=this.playerStatus.ison) {
                this.playerStatus.ison = playerStatus.ison;
            }
            if (playerStatus.isplaying!=this.playerStatus.isplaying) {
                this.playerStatus.isplaying = playerStatus.isplaying;
            }
            if (playerStatus.volume!=this.playerStatus.volume) {
                this.playerStatus.volume = playerStatus.volume;
            }
            if (playerStatus.will_sleep_in!=this.playerStatus.sleepTimer) {
                this.playerStatus.sleepTimer = playerStatus.will_sleep_in;
            }

            if (playerStatus.current.title!=this.playerStatus.current.title ||
                (playerStatus.current.artist && playerStatus.current.artist!=this.playerStatus.current.artist) ||
                (playerStatus.current.trackartist && playerStatus.current.trackartist!=this.playerStatus.current.artist) ) {
                this.playerStatus.current.title=playerStatus.current.title;
                this.playerStatus.current.artist=playerStatus.current.artist ? playerStatus.current.artist : playerStatus.current.trackartist;

                if (this.playerStatus.current.title) {
                    if (this.playerStatus.current.artist) {
                        this.songInfo=this.playerStatus.current.title+" - "+this.playerStatus.current.artist;
                    } else {
                        this.songInfo=this.playerStatus.current.title;
                    }
                } else if (this.playerStatus.current.artist) {
                    this.songInfo=this.playerStatus.current.artist;
                } else {
                    this.songInfo=undefined;
                }
            }
        }.bind(this));
        
        bus.$on('langChanged', function() {
            this.initItems();
        }.bind(this));
        this.initItems();

        bus.$on('dialog', function(name, val) {
            if (name=='info-dialog') {
                this.infoOpen = val;
            }
            this.initItems();
        }.bind(this));

        if (this.desktop) {
            bus.$on('playerStatus', function(playerStatus) {
                if (playerStatus.volume!=this.playerVolume.val && playerStatus.volume!=this.playerVolume.prev &&
                    (!this.playerVolume.lastUpdate || ((new Date())-this.playerVolume.lastUpdate)>500)) {
                    this.playerVolume.val = playerStatus.volume;
                    this.playerVolume.lastUpdate = new Date();
                }
            }.bind(this));
        }

        bus.$on('showError', function(err, msg) {
            this.snackbar = {msg: (msg ? msg : i18n("Something went wrong!")) + (err ? " (" + err+")" : ""), show: true, color: 'error' };
        }.bind(this));
        bus.$on('showMessage', function(msg) {
console.log("Show message:"+msg);
            this.snackbar = {msg: msg, show: true };
        }.bind(this));
    },
    methods: {
        initItems() {
            TB_UI_SETTINGS.title=i18n('Settings');
            TB_PLAYER_SETTINGS.title=i18n('Player Settings');
            TB_SERVER_SETTINGS.title=i18n('Server Settings');
            TB_INFO.title=i18n('Information');
            TB_MANAGE_PLAYERS.title=i18n('Manage Players');
            this.menuItems = [ TB_UI_SETTINGS, TB_PLAYER_SETTINGS, TB_SERVER_SETTINGS, TB_MANAGE_PLAYERS, TB_INFO ];
            this.trans = {noplayer:i18n('No Player'), synchronise:i18n('Synchronise'),
                          managegroups:i18n('Manage player groups'), nothingplaying:i18n('Nothing playing'),
                          info:i18n("Show current track information"), switchoff:i18n('Switch Off'), switchon:i18n('Switch On')};
        },
        setPlayer(id) {
            if (id != this.$store.state.player.id) {
                this.$store.commit('setPlayer', id);
            }
        },
        doAction(command) {
            bus.$emit('playerCommand', command);
        },
        menuAction(id) {
            bus.$emit('toolbarAction', id);
        },
        togglePower() {
            bus.$emit("power", this.playerStatus.ison ? "0" : "1");
        },
        volumeDown() {
            if (this.playerVolume.val<=5) {
                this.playerVolume.val = 0;
            } else {
                this.playerVolume.val = Math.floor((this.playerVolume.val-5)/5)*5;
            }
        },
        volumeUp() {
            // Always send volume up, even if at 100% already. Some users trap LMS
            // volume commands and forward on
            this.playerVolume.val = Math.floor((this.playerVolume.val+5)/5)*5;
        }
    },
    computed: {
        player () {
            return this.$store.state.player
        },
        players () {
            return this.$store.state.players
        },
        infoPlugin () {
            return this.$store.state.infoPlugin
        }
    },
    filters: {
        displayTime: function (value) {
            if (undefined==value) {
                return '';
            }
            return formatSeconds(Math.floor(value));
        }
    },
    watch: {
        'playerVolume.val': function(newVal) {
            if (this.desktop && newVal>=0 && this.playerVolume.current !== newVal) {
                this.playerVolume.prev = this.playerVolume.current;
                this.playerVolume.current = newVal;
                this.playerVolume.lastUpdate = new Date();
                bus.$emit('playerCommand', ["mixer", "volume", newVal]);
            }
        }
    }
})
