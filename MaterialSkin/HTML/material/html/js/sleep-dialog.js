/**
 * LMS-Material
 *
 * Copyright (c) 2018-2019 Craig Drummond <craig.p.drummond@gmail.com>
 * MIT license.
 */

Vue.component('lms-sleep-dialog', {
    template: `
<v-dialog v-model="show" width="600" persistent class="lms-dialog">
 <v-card>
  <v-card-text>
   <v-container grid-list-md>
    <v-layout wrap>
     <v-flex xs12 v-if="undefined==player">{{i18n("Set sleep time for all players.")}}</v-flex>
     <v-flex xs12 v-else>{{i18n("Set sleep time for '%1'.", player.name)}}</v-flex>
     <v-flex xs12>
      <v-select :items="items" :label="i18n('Sleep in')" v-model="duration" item-text="label" item-value="duration"></v-select>
     </v-flex>
     <v-flex xs12 v-if="undefined!=sleepTime">{{i18n("%1 until sleep", formatSeconds(sleepTime))}}</v-flex>
    </v-layout>
   </v-container>
  </v-card-text>
  <v-card-actions>
   <v-spacer></v-spacer>
   <v-btn flat @click.native="cancel()">{{i18n('Cancel')}}</v-btn>
   <v-btn flat @click.native="set()">{{i18n('Set')}}</v-btn>
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
            duration: 0,
            sleepTime :undefined
        }
    },
    mounted() {
        bus.$on('sleep.open', function(player) {
            this.player = player;
            this.sleepTime = undefined;
            if (undefined!=this.player) {
                this.show = true;
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
        set() {
            if (undefined==this.player) {
                this.$store.state.players.forEach(p => {
                    lmsCommand(p.id, -1==this.duration ? ["jiveendoftracksleep"] : ["sleep", this.duration]).then(({data}) => {
                        bus.$emit('updatePlayer', p.id);
                    });
                });
            } else {
                lmsCommand(this.player.id, -1==this.duration ? ["jiveendoftracksleep"] : ["sleep", this.duration]).then(({data}) => {
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

