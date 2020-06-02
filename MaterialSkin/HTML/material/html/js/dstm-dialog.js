/**
 * LMS-Material
 *
 * Copyright (c) 2018-2020 Craig Drummond <craig.p.drummond@gmail.com>
 * MIT license.
 */
'use strict';

Vue.component('lms-dstm-dialog', {
    template: `
<v-dialog v-model="show" v-if="show" persistent width="450" class="lms-dialog">
 <v-card>
  <v-card-text>
   <v-container grid-list-md style="padding: 4px">
    <v-layout wrap>
     <v-flex xs12>{{i18n("Don't Stop The Music")}}</v-flex>
     <v-flex xs12>
      <v-list class="sleep-list dialog-main-list">
       <template v-for="(item, index) in items">
        <v-list-tile @click="setDstm(item.key)">
         <v-list-tile-avatar><v-icon small>{{item.selected ? 'radio_button_checked' :'radio_button_unchecked'}}</v-icon></v-list-tile-avatar>
         <v-list-tile-content>{{item.label}}</v-list-tile-content> 
        </v-list-tile>
        <v-divider></v-divider>
       </template>
      </v-list>
     </v-flex>
    </v-layout>
   </v-container>
  </v-card-text>
  <v-card-actions>
   <v-spacer></v-spacer>
   <v-btn flat @click.native="cancel()">{{i18n('Cancel')}}</v-btn>
  </v-card-actions>
 </v-card>
</v-dialog>
`,
    props: [],
    data() {
        return {
            show: false,
            items:[]
        }
    },
    mounted() {
        bus.$on('dstm.open', function() {
            if (this.$store.state.dstmPlugin) {
                lmsCommand(this.$store.state.player.id, ["dontstopthemusicsetting"]).then(({data}) => {
                    if (data.result && data.result.item_loop) {
                        this.items=[];
                        for (let i=0, loop=data.result.item_loop, len=loop.length; i<len; ++i) {
                            if (loop[i].actions && loop[i].actions.do && loop[i].actions.do.cmd) {
                                this.items.push({key: loop[i].actions.do.cmd[2], label:loop[i].text, selected:1===loop[i].radio});
                            }
                        }
                        this.show=true;
                    }
                });
            }
        }.bind(this));
        bus.$on('noPlayers', function() {
            this.show=false;
        }.bind(this));
        bus.$on('esc', function() {
            if (this.$store.state.activeDialog == 'dstm') {
                this.show=false;
            }
        }.bind(this));
    },
    methods: {
        cancel() {
            this.show=false;
        },
        setDstm(value) {
            lmsCommand(this.$store.state.player.id, ["playerpref", "plugin.dontstopthemusic:provider", value]).then(({data}) => {
                bus.$emit("prefset", "plugin.dontstopthemusic:provider", value, this.$store.state.player.id);
            });
            this.show=false;
        },
        i18n(str, arg) {
            if (this.show) {
                return i18n(str, arg);
            } else {
                return str;
            }
        },
        cancelTimer() {
            if (undefined!==this.timer) {
                clearInterval(this.timer);
                this.timer = undefined;
            }
        }
    },
    watch: {
        'show': function(val) {
            this.$store.commit('dialogOpen', {name:'dstm', shown:val});
        }
    }
})

