/*
 * LMS-Material
 *
 * Copyright (c) 2018 Craig Drummond <craig.p.drummond@gmail.com>
 * MIT license.
 */

var DAYS_OF_WEEK = ['Sun', 'Mon', 'Tues', 'Weds', 'Thurs', 'Fri', 'Sat'];

Vue.component('lms-player-settings', {
    template: `
    <div>
      <v-dialog v-model="show" fullscreen app>
        <v-card>
          <v-toolbar color="primary" dark app class="lms-toolbar">
            <v-btn flat icon @click.native="close"><v-icon>arrow_back</b-icon></v-btn>
            <v-toolbar-title>{{playerName}}</v-toolbar-title>
          </v-toolbar>
          <div class="settings-toolbar-pad"></div>
          <v-list two-line subheader class="settings-list">
            <v-header>{{i18n('Audio')}}</v-header>
            <v-list-tile>
              <v-select :items="crossfadeItems" label="On song change" v-model="crossfade" item-text="label" item-value="key"></v-select>
            </v-list-tile>
            <v-list-tile v-if="!isgroup">
              <v-select :items="replaygainItems" label="Volume gain" v-model="replaygain" item-text="label" item-value="key"></v-select>
            </v-list-tile>
            <v-list-tile vi-f="dstmItems && dstmItems.length>1">
              <v-select :items="dstmItems" label="Don't Stop The Music" v-model="dstm" item-text="label" item-value="key"></v-select>
            </v-list-tile>

            <div class="settings-pad"></div>
            <v-header>{{i18n('Sleep')}} {{sleep.timeLeft | displayTime}}</v-header>

            <v-list-tile v-if="sleep.timeLeft">
              <v-btn flat @click="cancelSleep()">{{i18n('Cancel Sleep')}}</v-btn>
            </v-list-tile>
            <v-list-tile v-else>
              <v-menu bottom left>
                <v-btn slot="activator" flat>Sleep in... <v-icon>arrow_drop_down</v-icon></v-btn>
                <v-list>
                  <template v-for="(item, index) in sleep.items">
                    <v-list-tile @click="setSleepTimer(item.duration)"">
                      <v-list-tile-title>{{item.label}}</v-list-tile-title>
                    </v-list-tile>
                  </template>
                </v-list>
              </v-menu>
            </v-list-tile>

            <div class="settings-pad"></div>
            <v-header>{{i18n('Alarms')}}</v-header>
            <v-list-tile>
              <v-switch v-model="alarms.on" label="Enable alarms"></v-switch>
            </v-list-tile>

            <v-subheader class="alarm-sched-header">{{i18n('Scheduled alarms')}}</v-subheader>
            <template v-for="(item, index) in alarms.scheduled">
              <v-list-tile class="alarm-entry">
                <v-switch v-model="item.enabled" :label="item | formatAlarm" @click.stop="toggleAlarm(item)"></v-switch>
                <v-btn flat icon @click.stop="editAlarm(item)" class="toolbar-button"><v-icon>edit</v-icon></v-btn>
                <v-btn flat icon @click.stop="deleteAlarm(item)" class="toolbar-button"><v-icon>delete</v-icon></v-btn>
              </v-list-tile>
              <v-divider v-if="(index+1 < alarms.scheduled.length)" class="alarm-divider"></v-divider>
            </template>
            <v-btn flat icon @click.stop="addAlarm()" class="alarm-add"><v-icon>alarm_add</v-icon></v-btn>
            <v-subheader>{{i18n('Alarm settings')}}</v-subheader>
            <v-list-tile>
              <v-text-field :label="i18n('Volume (%)')" v-model="alarms.volume" type="number"></v-text-field>
            </v-list-tile>
            <v-list-tile>
              <v-text-field :label="i18n('Snooze (minutes)')" v-model="alarms.snooze" type="number"></v-text-field>
            </v-list-tile>
            <v-list-tile>
              <v-text-field :label="i18n('Timeout (minutes)')" v-model="alarms.timeout" type="number"></v-text-field>
            </v-list-tile>
          </v-list>
        </v-card>
      </v-dialog>

      <v-dialog v-model="alarmDialog.show" width="500">
        <v-card>
          <v-card-title>{{alarmDialog.id ? i18n("Edit Alarm") : i18n("Create Alarm")}}</v-card-title>
          <v-list two-line subheader class="settings-list">
            <v-list-tile class="settings-compact-row">
              <v-dialog ref="dialog" :close-on-content-click="false" v-model="alarmDialog.timepicker" :return-value.sync="alarmDialog.time"
                        persistent lazy full-width max-width="290px">
                <v-text-field slot="activator" v-model="formattedTime" :label="i18n('Start time')" prepend-icon="access_time" readonly></v-text-field>
                <v-time-picker v-if="alarmDialog.timepicker" v-model="alarmDialog.time" full-width>
                  <v-spacer></v-spacer>
                  <v-btn flat @click="alarmDialog.timepicker = false">{{i18n('Cancel')}}</v-btn>
                  <v-btn flat @click="$refs.dialog.save(alarmDialog.time)">{{i18n('OK')}}</v-btn>
                </v-time-picker>
              </v-dialog>
            </v-list-tile>
            <v-subheader>{{i18n('Days')}}</v-subheader>
            <v-list-tile class="settings-compact-row">
             <v-flex xs6><v-switch v-model="alarmDialog.dow" :label="i18n('Monday')" value="1"></v-switch></v-flex>
             <v-flex xs6><v-switch v-model="alarmDialog.dow" :label="i18n('Tuesday')" value="2"></v-switch></v-flex>
            </v-list-tile>
            <v-list-tile class="settings-compact-row">
             <v-flex xs6><v-switch v-model="alarmDialog.dow" :label="i18n('Wednesday')" value="3"></v-switch></v-flex>
             <v-flex xs6><v-switch v-model="alarmDialog.dow" :label="i18n('Thursday')" value="4"></v-switch></v-flex>
            </v-list-tile>
            <v-list-tile class="settings-compact-row"><v-switch v-model="alarmDialog.dow" :label="i18n('Friday')" value="5"></v-switch></v-list-tile>
            <v-list-tile class="settings-compact-row">
             <v-flex xs6><v-switch v-model="alarmDialog.dow" :label="i18n('Saturday')" value="6"></v-switch></v-flex>
             <v-flex xs6><v-switch v-model="alarmDialog.dow" :label="i18n('Sunday')" value="0"></v-switch></v-flex>
            </v-list-tile>
            <v-subheader>{{i18n('Options')}}</v-subheader>
            <v-list-tile class="settings-compact-row">
              <v-select :items="alarmSounds" :label="i18n('Sound')" v-model="alarmDialog.url" item-text="label" item-value="key"></v-select>
            </v-list-tile>
            <!-- TODO ????
            <v-list-tile class="settings-compact-row">
              <v-select :items="alarmShuffeItems" :label="i18n('Shuffle')" v-model="alarmDialog.shuffle" item-text="label" item-value="key"></v-select>
            </v-list-tile>
            -->
            <v-list-tile class="settings-compact-row"><v-switch v-model="alarmDialog.repeat" :label="i18n('Repeat')"></v-switch></v-list-tile>
          </v-list>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn flat @click="alarmDialog.show = false">{{i18n('Cancel')}}</v-btn>
            <v-btn flat @click="saveAlarm()">{{alarmDialog.id ? i18n("Save") : i18n("Create")}}</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
    </div>
`,
    props: [],
    data() {
        return {
            show: false,
            playerName: undefined,
            isgroup: false,
            crossfade: undefined,
            replaygain: undefined,
            dstm: undefined,
            crossfadeItems:[],
            replaygainItems:[],
            dstmItems: [],
            alarms: {
                on: true,
                volume: 100,
                snooze: 9,
                timeout: 60,
                fade: true,
                scheduled: []
            },
            sleep: {
                timeLeft:undefined,
                items:[]
            },
            alarmShuffeItems:[],
            alarmSounds:[],
            alarmDialog: {
                show: false,
                id: undefined,
                time: undefined,
                dow: [],
                repeat: false,
                url: undefined,
                shuffle: undefined
            }
        }
    },
    computed: {
        formattedTime() {
            if (!this.alarmDialog.time) {
                return "";
            }
            var parts = this.alarmDialog.time.split(":");
            return formatTime((parseInt(parts[0])*60*60)+(parseInt(parts[1])*60), false);
        }
    },
    mounted() {
        bus.$on('langChanged', function() {
            this.initItems();
        }.bind(this));
        this.initItems();

        bus.$on('playerStatus', function(playerStatus) {
            if (playerStatus.will_sleep_in!=this.sleep.timeLeft) {
                this.sleep.timeLeft = playerStatus.will_sleep_in;
            }
        }.bind(this));

        bus.$on('toolbarAction', function(act) {
            if (act==TB_PLAYER_SETTINGS.id && this.$store.state.player) {
                bus.$emit('dialog', 'player-settings', true);
                this.dstmItems=[];
                this.crossfade='0';
                this.replaygain='0';
                this.playerId = this.$store.state.player.id;
                this.playerName = this.$store.state.player.name;
                this.isgroup = this.$store.state.player.isgroup;
                lmsCommand(this.playerId, ["dontstopthemusicsetting"]).then(({data}) => {
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
                lmsCommand(this.playerId, ["playerpref", "transitionType", "?"]).then(({data}) => {
                    if (data && data.result && undefined!=data.result._p2) {
                        this.crossfade=data.result._p2;
                    }
                });
                if (!this.isgroup) {
                    lmsCommand(this.playerId, ["playerpref", "replayGainMode", "?"]).then(({data}) => {
                        if (data && data.result && undefined!=data.result._p2) {
                            this.replaygain=data.result._p2;
                        }
                    });
                }

                this.alarms.on=true;
                this.alarms.volume=100;
                this.alarms.snooze=0;
                this.alarms.timeout=0;
                this.alarms.fade=true;
                lmsCommand(this.playerId, ["playerpref", "alarmfadeseconds", "?"]).then(({data}) => {
                    if (data && data.result && undefined!=data.result._p2) {
                        this.alarms.fade=1==data.result._p2;
                    }
                });
                lmsCommand(this.playerId, ["playerpref", "alarmTimeoutSeconds", "?"]).then(({data}) => {
                    if (data && data.result && undefined!=data.result._p2) {
                        this.alarms.timeout=Math.floor(parseInt(data.result._p2)/60);
                    }
                });
                lmsCommand(this.playerId, ["playerpref", "alarmSnoozeSeconds", "?"]).then(({data}) => {
                    if (data && data.result && undefined!=data.result._p2) {
                        this.alarms.snooze=Math.floor(parseInt(data.result._p2)/60);
                    }
                });
                lmsCommand(this.playerId, ["playerpref", "alarmsEnabled", "?"]).then(({data}) => {
                    if (data && data.result && undefined!=data.result._p2) {
                        this.alarms.on=1==data.result._p2;
                    }
                });
                lmsCommand(this.playerId, ["playerpref", "alarmDefaultVolume", "?"]).then(({data}) => {
                    if (data && data.result && undefined!=data.result._p2) {
                        this.alarms.volume=data.result._p2;
                    }
                });
                this.alarmSounds=[];
                this.alarms.scheduled=[];
                lmsList(this.playerId, ["alarm", "playlists"], undefined, 0).then(({data}) => {
                    if (data && data.result && data.result.item_loop) {
                        data.result.item_loop.forEach(i => {
                            if (!i.url) {
                                this.alarmSounds.push({key:'CURRENT_PLAYLIST', label:i18n('Current play queue')});
                            } else {
                                this.alarmSounds.push({key:i.url, label:i.category+": "+i.title});
                            }
                        });
                    }
                    if (this.alarmSounds.length<1) {
                        this.alarmSounds.push({key:'CURRENT_PLAYLIST', label:i18n('Current play queue')});
                    }

                    this.loadAlarms();
                });
                this.show = true;
            }
        }.bind(this));

        bus.$on('closeDialog', function() {
            if (this.show && !this.alarmDialog.show) {
                this.close();
            }
        }.bind(this));
    },
    methods: {
        initItems() {
            this.crossfadeItems=[
                { key:'0', label:i18n("No fade")},
                { key:'1', label:i18n("Crossfade")},
                { key:'2', label:i18n("Fade in")},
                { key:'3', label:i18n("Fade out")},
                { key:'4', label:i18n("Fade in and out")}
                ];
            this.replaygainItems=[
                { key:'0', label:i18n("None")},
                { key:'1', label:i18n("Track gain")},
                { key:'2', label:i18n("Album gain")},
                { key:'3', label:i18n("Smart gain")}
                ];
            this.alarmShuffeItems=[
                { key:'0', label:i18n("Don't shuffle")},
                { key:'1', label:i18n("Shuffle by song")},
                { key:'2', label:i18n("Shuffle by album")},
                ];
            DAYS_OF_WEEK = [i18n('Sun'), i18n('Mon'), i18n('Tues'), i18n('Weds'), i18n('Thurs'), i18n('Fri'), i18n('Sat')];
            this.sleep.items=[
                { duration: 15*60, label:i18n("%1 minutes", 15)},
                { duration: 30*60, label:i18n("%1 minutes", 30)},
                { duration: 45*60, label:i18n("%1 minutes", 45)},
                { duration: 60*60, label:i18n("%1 minutes", 60)},
                { duration: 90*60, label:i18n("%1 minutes", 90)},
                ];
        },
        close() {
            bus.$emit('dialog', 'player-settings', false);
            this.show=false;
            if (this.dstmItems.length>1) {
                lmsCommand(this.playerId, ["playerpref", "plugin.dontstopthemusic:provider", this.dstm]);
            }
            lmsCommand(this.playerId, ["playerpref", "transitionType", this.crossfade]);
            if (!this.isgroup) {
                lmsCommand(this.playerId, ["playerpref", "replayGainMode", this.replaygain]);
            }
            lmsCommand(this.playerId, ["playerpref", "alarmfadeseconds", this.alarms.fade ? 1 : 0]);
            lmsCommand(this.playerId, ["playerpref", "alarmTimeoutSeconds", this.alarms.timeout*60]);
            lmsCommand(this.playerId, ["playerpref", "alarmSnoozeSeconds", this.alarms.snooze*60]);
            lmsCommand(this.playerId, ["playerpref", "alarmsEnabled", this.alarms.on ? 1 : 0]);
            lmsCommand(this.playerId, ["playerpref", "alarmDefaultVolume", this.alarms.volume]);
            this.playerId = undefined;
        },
        loadAlarms() {
            lmsList(this.playerId, ["alarms"], ["filter:all"], 0).then(({data}) => {
                this.alarms.scheduled = [];
                if (data && data.result && data.result.alarms_loop) {
                    data.result.alarms_loop.forEach(i => {
                        i.enabled = 1 == i.enabled;
                        i.repeat = 1 == i.repeat;
                        this.alarms.scheduled.push(i);
                    });
                }
           });
        },
        toggleAlarm(alarm) {
             lmsCommand(this.playerId, ["alarm", "update", "enabled:"+(alarm.enabled ? 0 : 1), "id:"+alarm.id]).then(({data}) => {
                this.loadAlarms();
            });
        },
        addAlarm() {
            this.alarmDialog = { show: true, id: undefined, time: "00:00", dow:["0", "1", "2", "3", "4"], repeat: false,
                                 url: 'CURRENT_PLAYLIST', shuffle: this.alarmShuffeItems[0].key };
        },
        editAlarm(alarm) {
            this.alarmDialog = { show: true, id: alarm.id, time: formatTime(alarm.time, true), dow: alarm.dow.split(","),
                                 repeat: alarm.repeat, url: alarm.url, enabled: alarm.enabled };
        },
        saveAlarm() {
            var parts = this.alarmDialog.time.split(":");
            var time = (parseInt(parts[0])*60*60)+(parseInt(parts[1])*60);
            var cmd = ["alarm"];
            if (this.alarmDialog.id) {
                cmd.push("update");
                cmd.push("id:"+this.alarmDialog.id);
                cmd.push("enabled:"+(this.alarmDialog.enabled ? 1 : 0));
            } else {
                cmd.push("add");
                cmd.push("enabled:1");
            }

            cmd.push("time:"+time);
            cmd.push("dow:"+this.alarmDialog.dow.join(","));
            cmd.push("url:"+this.alarmDialog.url); // TODO CHECK!!!
            cmd.push("repeat:"+(this.alarmDialog.repeat ? 1 : 0));
            // TODO: shuffle???
            lmsCommand(this.playerId, cmd).then(({data}) => {
                this.loadAlarms();
            });
            this.alarmDialog.show = false;
        },
        deleteAlarm(alarm) {
            this.$confirm(i18n("Delete alarm?"),
                          {buttonTrueText: i18n('Delete'), buttonFalseText: i18n('Cancel')}).then(res => {
                if (res) {
                    lmsCommand(this.playerId, ["alarm", "delete", "id:"+alarm.id]).then(({data}) => {
                        this.loadAlarms();
                    });
                }
            });
        },
        i18n(str) {
            if (this.show) {
                return i18n(str);
            } else {
                return str;
            }
        },
        setSleepTimer(duration) {
            bus.$emit('playerCommand', ["sleep", duration]);
        },
        cancelSleep() {
            bus.$emit('playerCommand', ["sleep", 0]);
        }
    },
    filters: {
        formatAlarm: function (value) {
            var days=[];
            // LMS has Sun->Sat, but I prefer Mon->Sun. So, if Sun is used, place at end
            var haveSun=false;
            value.dow.split(",").sort().forEach(d => {
                if (d==='0') {
                    haveSun=true;
                } else {
                    days.push(DAYS_OF_WEEK[d]);
                }
            });
            if (haveSun) {
                days.push(DAYS_OF_WEEK[0]);
            }
            return formatTime(value.time, false)+" "+days.join(", ");
        },
        displayTime: function (value) {
            if (undefined==value) {
                return '';
            }
            return '('+formatSeconds(Math.floor(value))+')';
        }
    },
})

