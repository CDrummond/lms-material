
Vue.component('lms-player-settings', {
    template: `
      <v-dialog v-model="show" fullscreen transition="dialog-bottom-transition" app>
        <v-card>
          <v-toolbar color="primary" dark app class="lms-toolbar">
            <v-btn flat icon @click.native="close"><v-icon>arrow_back</b-icon></v-btn>
            <v-toolbar-title>'{{player ? player.name : 'No Player'}}' Settings</v-toolbar-title>
          </v-toolbar>
          <div class="lms-toolbar"></div>
          <v-list three-line subheader>
            <v-subheader>Audio</v-subheader>
            <v-list-tile avatar class="settings-select">
              <v-select :items="crossfadeItems" label="On song change" v-model="crossfade" item-text="label" item-value="key"></v-select>
            </v-list-tile>
            <v-list-tile avatar class="settings-select">
              <v-select :items="replaygainItems" label="Volume gain" v-model="replaygain" item-text="label" item-value="key"></v-select>
            </v-list-tile>
            <v-list-tile avatar class="settings-select" vi-f="dstmItems && dstmItems.length>1">
              <v-select :items="dstmItems" label="Don't Stop The Music" v-model="dstm" item-text="label" item-value="key"></v-select>
             </v-list-tile>
          </v-list>
        </v-card>
      </v-dialog>
`,
    props: [],
    data() {
        return {
            show: false,
            crossfade: undefined,
            replaygain: undefined,
            dstm: undefined,
            
            crossfadeItems:[
                { key:'0', label:"No fade"},
                { key:'1', label:"Crossfade"},
                { key:'2', label:"Fade in"},
                { key:'3', label:"Fade out"},
                { key:'4', label:"Fade in and out"}
                ],
            replaygainItems:[
                { key:'0', label:"None"},
                { key:'1', label:"Track gain"},
                { key:'2', label:"Album gain"},
                { key:'3', label:"Smart gain"}
                ],
            dstmItems: []
        }
    },
    mounted() {
        bus.$on('toolbarAction', function(act) {
            if (act==TB_PLAYER_SETTINGS.id) {
                this.dstmItems=[];
                this.crossfade='0';
                this.replaygain='0';
                lmsCommand(this.playerId(), ["dontstopthemusicsetting"]).then(({data}) => {
                    if (data.result && data.result.item_loop) {
                        data.result.item_loop.forEach(i => {
                            if (i.actions && i.actions.do && i.actions.do.cmd) {
                                this.dstmItems.push({key: i.actions.do.cmd[2], label:i.text});
                                if (1===i.radio) {
                                    this.dstm = i.actions.do.cmd[2];
                                }
                            }
                        });
                    }
                });
                lmsCommand(this.playerId(), ["playerpref", "transitionType", "?"]).then(({data}) => {
                    if (data && data.result && undefined!=data.result._p2) {
                        this.crossfade=data.result._p2;
                    }
                });
                lmsCommand(this.playerId(), ["playerpref", "replayGainMode", "?"]).then(({data}) => {
                    if (data && data.result && undefined!=data.result._p2) {
                        this.replaygain=data.result._p2;
                    }
                });
                this.show = true;
            }
        }.bind(this));
    },
    methods: {
        close() {
            this.show=false;
            if (this.dstmItems.length>1) {
                lmsCommand(this.playerId(), ["playerpref", "plugin.dontstopthemusic:provider", this.dstm]);
            }
            lmsCommand(this.playerId(), ["playerpref", "transitionType", this.crossfade]);
            lmsCommand(this.playerId(), ["playerpref", "replayGainMode", this.replaygain]);
        },
        playerId() {
            return this.$store.state.player ? this.$store.state.player.id : "";
        }
    },
    computed: {
        player () {
            return this.$store.state.player
        }
    }
})

