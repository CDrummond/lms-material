/**
 * LMS-Material
 *
 * Copyright (c) 2018-2019 Craig Drummond <craig.p.drummond@gmail.com>
 * MIT license.
 */

Vue.component('lms-sleep-dialog', {
    template: `
<v-dialog v-model="show" v-if="show" width="450" persistent class="lms-dialog">
 <v-card>
  <v-card-text>
   <v-container grid-list-md style="padding: 4px">
    <v-layout wrap>
     <v-flex xs12 v-if="undefined==player">{{i18n("Set sleep time for all players.")}}</v-flex>
     <v-flex xs12 v-else>{{i18n("Set sleep time for '%1'.", player.name)}}</v-flex>
     <v-flex xs12>
      <v-list class="sleep-list">
       <template v-for="(item, index) in items">
        <v-list-tile @click="setSleep(item.duration)">
         <v-list-tile-title class="sleep-item">{{item.label}}</v-list-tile-title>
        </v-list-tile>
        <v-divider></v-divider>
        </template>
      </v-list>
     </v-flex>
    </v-layout>
   </v-container>
  </v-card-text>
  <v-card-actions>
   <p v-if="undefined!=sleepTime">{{i18n("%1 until sleep", formatSeconds(sleepTime))}}</p>
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
            this.show=false;
        }.bind(this));
        bus.$on('esc', function() {
            this.show=false;
        }.bind(this));
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
        cancel() {
            this.show=false;
            this.cancelTimer();
        },
        setSleep(duration) {
            if (undefined==this.player) {
                this.$store.state.players.forEach(p => {
                    lmsCommand(p.id, -1==duration ? ["jiveendoftracksleep"] : ["sleep", duration]).then(({data}) => {
                        bus.$emit('updatePlayer', p.id);
                    });
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
            bus.$emit('dialogOpen', 'sleep', val);
        }
    }
})

