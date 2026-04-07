/**
 * LMS-Material
 *
 * Copyright (c) 2018-2026 Craig Drummond <craig.p.drummond@gmail.com>
 * MIT license.
 */
'use strict';

Vue.component('lms-playerlist-dialog', {
    template: `
<v-dialog v-model="show" :width="550" persistent style="overflow:hidden" v-if="show">
 <v-card>
  <v-card-title>{{i18n("Player list")}}</v-card-title>
  <v-list-tile-sub-title style="padding-left:16px;padding-right:16px">{{i18n("Select favourite players, these will always be visible.")}}</v-list-tile-sub-title>
  <v-list class="dialog-main-list">
   <template v-for="(item, index) in players" :key="item.id">
    <v-subheader v-if="index==0 && players.length>1 && players[players.length-1].isgroup">
     {{i18n("Standard Players")}}
    </v-subheader>
    <v-subheader v-else-if="index>0 && item.isgroup && !players[index-1].isgroup">
     {{i18n("Group Players")}}
    </v-subheader>
    <v-list-tile class="settings-list-thin-item" @dragstart.native="dragStart(index, $event)" @dragenter.prevent="" @dragend.native="dragEnd()" @dragover.native="dragOver(index, $event)" @drop.native="drop(index, $event)" draggable v-bind:class="{'highlight-drop':dropIndex==index, 'highlight-drag':dragIndex==index&&!show}">
     <v-checkbox v-model="item.enabled" style="display:flex" :id="item.id">
      <template v-slot:label>
       <v-list-tile-avatar v-bind:class="{'dimmed':item.disconnected}">
        <v-icon v-if="undefined!=item.icon.icon">{{item.icon.icon}}</v-icon>
        <img v-else-if="item.icon.svg" class="svg-img" :src="item.icon.svg | svgIcon(darkUi)"></img>
       </v-list-tile-avatar>
       <v-list-tile-content v-bind:class="{'dimmed':item.disconnected}">
        <div v-if="item.disconnected">{{item.name}} ({{i18n("Disconnected")}})</div>
        <div v-else>{{item.name}}</div>
       </v-list-tile-content>
      </template>
     </v-checkbox>
    </v-list-tile>
   </template>
  </v-list>
  <v-divider></v-divider>
  <div style="height:8px"></div>
  <v-list-tile>
   <v-list-tile-content @click="alpha=!alpha" class="switch-label">
    <v-list-tile-title class="ellipsis">{{i18n('Sort alphabetically')}}</v-list-tile-title>
    <v-list-tile-sub-title class="ellipsis">{{i18n("Always sort players by name.")}}</v-list-tile-sub-title>
   </v-list-tile-content>
   <v-list-tile-action><m3-switch v-model="alpha"></m3-switch></v-list-tile-action>
  </v-list-tile>
  <div class="dialog-padding"></div>
  <v-card-actions>
   <v-spacer></v-spacer>
   <v-btn flat @click="close">{{i18n('Close')}}</v-btn>
  </v-card-actions>
 </v-card>
</v-dialog>
`,
    props: [],
    data() {
        return {
            show: false,
            players: [],
            alpha: true,
            dragIndex: undefined,
            dropIndex: undefined
        }
    },
    computed: {
        darkUi () {
            return this.$store.state.darkUi
        }
    },
    mounted() {
        bus.$on('playerlist.open', function() {
            let ids = new Set();
            this.players = [];
            for (let p=0, loop=this.$store.state.players, len=loop.length; p<len; ++p) {
                this.players.push(loop[p]);
                ids.add(loop[p].id);
            }
            this.alpha=lmsOptions.playersAlphaSort;
            this.show=true;
            lmsCommand("", ["material-skin", "player-list"]).then(({data}) => {
                if (data.result && data.result.players_loop && this.show) {
                    for (let p=0, loop=data.result.players_loop, len=loop.length; p<len; ++p) {
                        if (1==loop[p].connected && ids.has(loop[p].id)) {
                            continue;
                        }
                        loop[p].playerid = loop[p].id; // For icon mapping
                        let weight = lmsOptions.playerWeightMap[loop[p].id];
                        this.players.push({
                            id:loop[p].id,
                            name:loop[p].name,
                            isgroup:'group'==loop[p].model,
                            disconnected:true,
                            icon:mapPlayerIcon(loop[p]),
                            weight:undefined==weight ? -1 : weight,
                            enabled:!lmsOptions.disabledPlayers.has(loop[p].id)
                        });
                    }
                    this.players.sort(playerSort);
                }
            }).catch(err => {
            });
        }.bind(this));
        bus.$on('closeDialog', function(dlg) {
            if (dlg == 'playerlist') {
                this.show=false;
            }
        }.bind(this));
    },
    methods: {
        close() {
            lmsOptions.playerWeightMap = {};
            let disabled = []
            let connectedPlayers = [];
            for (let p=0, loop=this.players, len=loop.length; p<len; ++p) {
                loop[p].weight = p;
                lmsOptions.playerWeightMap[loop[p].id] = p;
                if (!loop[p].enabled) {
                    disabled.push(loop[p].id);
                }
                if (!loop[p].disconnected) {
                    connectedPlayers.push(loop[p]);
                }
            }
            lmsOptions.playersAlphaSort=this.alpha;
            setLocalStorageVal('playersAlphaSort', lmsOptions.playersAlphaSort);
            if (!this.alpha) {
                setLocalStorageVal('playerWeightMap', JSON.stringify(lmsOptions.playerWeightMap));
            }
            setLocalStorageVal('disabledPlayers', disabled.join(','));
            lmsOptions.disabledPlayers = new Set(disabled);

            this.$store.commit('setPlayers', connectedPlayers.sort(playerSort));
            this.$store.commit('setPlayer', this.$store.state.player.id);
            this.players = [];
            this.show=false;
            bus.$emit('refreshServerStatus');
            bus.$emit('playerlistChanged');
        },
        i18n(str) {
            if (this.show) {
                return i18n(str);
            } else {
                return str;
            }
        },
        dragStart(which, ev) {
            ev.dataTransfer.dropEffect = 'move';
            ev.dataTransfer.setData('text/plain', "dth:"+which);
            this.dragIndex = which;
            this.dropIndex = undefined;
        },
        dragEnd() {
            this.dragIndex = undefined;
            this.dropIndex = undefined;
        },
        dragOver(index, ev) {
            if (index!=this.dragIndex) {
                this.dropIndex = index;
            }
            ev.preventDefault(); // Otherwise drop is never called!
        },
        drop(to, ev) {
            ev.preventDefault();
            if (to!=this.dragIndex) {
                this.players = arrayMove(this.players, this.dragIndex, to);
            }
            this.dragIndex = undefined;
            this.dropIndex = undefined;
        }
    },
    watch: {
        'show': function(val) {
            this.$store.commit('dialogOpen', {name:'playerlist', shown:val});
        },
        'alpha': function(val) {
            lmsOptions.playersAlphaSort = this.alpha;
            this.players.sort(playerSort);
        }
    }
})
