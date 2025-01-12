/**
 * LMS-Material
 *
 * Copyright (c) 2018-2024 Craig Drummond <craig.p.drummond@gmail.com>
 * MIT license.
 */
'use strict';

Vue.component('lms-sleep-dialog', {
    template: `
<v-dialog v-model="show" v-if="show" persistent width="450" class="lms-dialog" v-clickoutside="outsideClick">
 <v-card>
  <v-card-text>
   <v-container grid-list-md style="padding: 4px">
    <v-layout wrap>
     <v-flex xs12 class="dlgtitle" v-if="undefined==player">{{i18n("Set sleep time for all players")}}</v-flex>
     <v-flex xs12 class="dlgtitle" v-else>{{i18n("Set sleep time for '%1'", player.name)}}</v-flex>
     <v-flex xs12>
      <v-list class="sleep-list dialog-main-list">
       <template v-for="(item, index) in items">
        <v-list-tile @click="setSleep(item.duration)" @mousedown="selectDown(item.duration)" @touchstart="selectDown(item.duration)">
         <div :tile="true" v-if="boundKeys" class="choice-key">{{9==index ? 0 : index+1}}</div>
         <v-list-tile-title>{{item.label}}</v-list-tile-title>
        </v-list-tile>
        <v-divider></v-divider>
        </template>
      </v-list>
     </v-flex>
    </v-layout>
   </v-container>
  </v-card-text>
  <v-card-actions>
   <p v-if="undefined!=sleepTime" style="margin-left:10px" class="dimmed">{{i18n("%1 until sleep", formatSeconds(sleepTime))}}</p>
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
            player: undefined,
            items: [],
            sleepTime :undefined
        }
    },
    mounted() {
        bus.$on('sleep.open', function(player) {
            if (queryParams.party) {
                return;
            }
            this.lastClickedDuration = undefined;
            this.boundKeys = false;
            bindNumeric(this);
            this.player = player;
            this.sleepTime = undefined;
            this.show = true;
            if (undefined!=this.player) {
                lmsCommand(this.player.id, ["sleep", "?"]).then(({data}) => {
                    if (data && data.result && data.result._sleep) {
                        this.sleepTime = parseInt(data.result._sleep);
                        this.timeLeft = this.sleepTime;
                        this.start = new Date();

                        this.timer = setInterval(function () {
                            var current = new Date();
                            var diff = (current.getTime()-this.start.getTime())/1000.0;
                            this.sleepTime = this.timeLeft - diff;
                            if (this.sleepTime<=0) {
                                this.sleepTime = undefined;
                                this.cancelTimer();
                            }
                        }.bind(this), 1000);
                    }
                });
            }
        }.bind(this));
        bus.$on('langChanged', function() {
            this.initItems();
        }.bind(this));
        this.initItems();
        bus.$on('noPlayers', function() {
            this.cancel();
        }.bind(this));
        bus.$on('closeDialog', function(dlg) {
            if (dlg == 'sleep') {
                this.cancel();
            }
        }.bind(this));
        handleNumeric(this, this.setSleep, 'duration');
    },
    methods: {
        initItems() {
            this.items=[
                { duration: 0,     label:i18n("Do not sleep")},
                { duration: 15*60, label:i18n("%1 minutes", 15)},
                { duration: 30*60, label:i18n("%1 minutes", 30)},
                { duration: 45*60, label:i18n("%1 minutes", 45)},
                { duration: 60*60, label:i18n("%1 minutes", 60)},
                { duration: 90*60, label:i18n("%1 minutes", 90)},
                { duration: -1,    label:i18n("Remaining duration of current track")}/*,
                { duration: -2,    label:xxx("Remaining duration of play queue")} */
                ];
        },
        outsideClick() {
            setTimeout(function () { this.cancel(); }.bind(this), 50);
        },
        cancel() {
            this.show=false;
            this.cancelTimer();
            unbindNumeric(this);
        },
        selectDown(duration) {
            this.lastClickedDuration = duration;
        },
        setSleep(duration) {
            if (this.lastClickedDuration!=duration) {
                this.lastClickedDuration = undefined;
                return;
            }
            this.lastClickedDuration=undefined;
            if (undefined==this.player) {
                this.$store.state.players.forEach(p => {
                    if (!p.isgroup) {
                        lmsCommand(p.id, -1==duration ? ["jiveendoftracksleep"] : ["sleep", duration]).then(({data}) => {
                            bus.$emit('updatePlayer', p.id);
                        });
                    }
                });
            } else {
                lmsCommand(this.player.id, -1==duration ? ["jiveendoftracksleep"] : ["sleep", duration]).then(({data}) => {
                    bus.$emit('updatePlayer', this.player.id);
                });
            }
            this.show=false;
            this.cancelTimer();
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
    beforeDestroy() {
        this.cancelTimer();
    },
    watch: {
        'show': function(val) {
            this.$store.commit('dialogOpen', {name:'sleep', shown:val});
        }
    }
})

