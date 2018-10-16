/*
 * LMS-Material
 *
 * Copyright (c) 2018 Craig Drummond <craig.p.drummond@gmail.com>
 * MIT license.
 */

const DAYS_OF_WEEK = ['Mon', 'Tues', 'Weds', 'Thurs', 'Fri', 'Sat', 'Sun'];

Vue.component('lms-player-settings', {
    template: `
    <div>
      <v-dialog v-model="show" fullscreen app>
        <v-card>
          <v-toolbar color="primary" dark app class="lms-toolbar">
            <v-btn flat icon @click.native="close"><v-icon>arrow_back</b-icon></v-btn>
            <v-toolbar-title>'{{playerName}}' Settings</v-toolbar-title>
          </v-toolbar>
          <div class="settings-toolbar-pad"></div>
          <v-list two-line subheader class="settings-list">
            <v-header>Audio</v-header>
            <v-list-tile>
              <v-select :items="crossfadeItems" label="On song change" v-model="crossfade" item-text="label" item-value="key"></v-select>
            </v-list-tile>
            <v-list-tile>
              <v-select :items="replaygainItems" label="Volume gain" v-model="replaygain" item-text="label" item-value="key"></v-select>
            </v-list-tile>
            <v-list-tile vi-f="dstmItems && dstmItems.length>1">
              <v-select :items="dstmItems" label="Don't Stop The Music" v-model="dstm" item-text="label" item-value="key"></v-select>
            </v-list-tile>

            <v-header>Alarms</v-header>
            <v-list-tile>
              <v-switch v-model="alarms.on" label="Enable alarms"></v-switch>
            </v-list-tile>

            <v-subheader>Scheduled alarms</v-subheader>
            <template v-for="(item, index) in alarms.scheduled">
              <v-list-tile class="alarm-entry">
                <v-switch v-model="item.enabled" :label="item | formatAlarm" @click.stop="toggleAlarm(item)"></v-switch>
                <v-btn flat icon @click.stop="editAlarm(item)" class="toolbar-button" style="margin-top:-22px"><v-icon>edit</v-icon></v-btn>
                <v-btn flat icon @click.stop="deleteAlarm(item)" class="toolbar-button" style="margin-top:-22px"><v-icon>delete</v-icon></v-btn>
              </v-list-tile>
              <v-divider v-if="(index+1 < alarms.scheduled.length)"></v-divider>
            </template>
            <v-btn flat icon @click.stop="addAlarm()"><v-icon>alarm_add</v-icon></v-btn>
            <v-subheader>Alarm settings</v-subheader>
            <v-list-tile>
              <v-text-field label="Volume (%)" v-model="alarms.volume" type="number"></v-text-field>
            </v-list-tile>
            <v-list-tile>
              <v-text-field label="Snooze (minutes)" v-model="alarms.snooze" type="number"></v-text-field>
            </v-list-tile>
            <v-list-tile>
              <v-text-field label="Timeout (minutes)" v-model="alarms.timeout" type="number"></v-text-field>
            </v-list-tile>
          </v-list>
        </v-card>
      </v-dialog>

      <v-dialog v-model="alarmDialog.show" width="500">
        <v-card>
          <v-card-title>{{alarmDialog.id ? "Edit Alarm" : "Create Alarm"}}</v-card-title>
          <v-list two-line subheader class="settings-list">
            <v-list-tile>
              <v-dialog ref="dialog" :close-on-content-click="false" v-model="alarmDialog.timepicker" :return-value.sync="alarmDialog.time"
                        persistent lazy full-width max-width="290px">
                <v-text-field slot="activator" v-model="formattedTime" label="Start time" prepend-icon="access_time" readonly></v-text-field>
                <v-time-picker v-if="alarmDialog.timepicker" v-model="alarmDialog.time" full-width>
                  <v-spacer></v-spacer>
                  <v-btn flat @click="alarmDialog.timepicker = false">Cancel</v-btn>
                  <v-btn flat @click="$refs.dialog.save(alarmDialog.time)">OK</v-btn>
                </v-time-picker>
              </v-dialog>
            </v-list-tile>
            <v-subheader>Days</v-subheader>
            <v-list-tile>
             <v-flex xs6><v-switch v-model="alarmDialog.dow" label="Monday" value="1"></v-switch></v-flex>
             <v-flex xs6><v-switch v-model="alarmDialog.dow" label="Tuesday" value="2"></v-switch></v-flex>
            </v-list-tile>
            <v-list-tile>
             <v-flex xs6><v-switch v-model="alarmDialog.dow" label="Wednesday" value="3"></v-switch></v-flex>
             <v-flex xs6><v-switch v-model="alarmDialog.dow" label="Thursday" value="4"></v-switch></v-flex>
            </v-list-tile>
            <v-list-tile><v-switch v-model="alarmDialog.dow" label="Friday" value="5"></v-switch></v-list-tile>
            <v-list-tile>
             <v-flex xs6><v-switch v-model="alarmDialog.dow" label="Saturday" value="6"></v-switch></v-flex>
             <v-flex xs6><v-switch v-model="alarmDialog.dow" label="Sunday" value="0"></v-switch></v-flex>
            </v-list-tile>
            <v-subheader>Options</v-subheader>
            <v-list-tile>
              <v-select :items="alarmSounds" label="Sound" v-model="alarmDialog.url" item-text="label" item-value="key"></v-select>
            </v-list-tile>
            <!-- TODO ????
            <v-list-tile>
              <v-select :items="alarmShuffeItems" label="Shuffle" v-model="alarmDialog.shuffle" item-text="label" item-value="key"></v-select>
            </v-list-tile>
            -->
            <v-list-tile><v-switch v-model="alarmDialog.repeat" label="Repeat"></v-switch></v-list-tile>
          </v-list>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn flat @click="alarmDialog.show = false">Cancel</v-btn>
            <v-btn flat @click="saveAlarm()">{{alarmDialog.id ? "Save" : "Create"}}</v-btn>
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
            dstmItems: [],
            alarms: {
                on: true,
                volume: 100,
                snooze: 9,
                timeout: 60,
                fade: true,
                scheduled: []
            },
            alarmShuffeItems:[
                { key:'0', label:"Don't shuffle"},
                { key:'1', label:"Shuffle by song"},
                { key:'2', label:"Shuffle by album"},
                ],
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
        bus.$on('toolbarAction', function(act) {
            if (act==TB_PLAYER_SETTINGS.id && this.$store.state.player) {
                this.dstmItems=[];
                this.crossfade='0';
                this.replaygain='0';
                this.playerId = this.$store.state.player.id;
                this.playerName = this.$store.state.player.name;
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
                lmsCommand(this.playerId, ["playerpref", "replayGainMode", "?"]).then(({data}) => {
                    if (data && data.result && undefined!=data.result._p2) {
                        this.replaygain=data.result._p2;
                    }
                });

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
                                this.alarmSounds.push({key:'CURRENT_PLAYLIST', label:'Current play queue'});
                            } else {
                                this.alarmSounds.push({key:i.url, label:i.category+": "+i.title});
                            }
                        });
                    }
                    if (this.alarmSounds.length<1) {
                        this.alarmSounds.push({key:'CURRENT_PLAYLIST', label:'Current play queue'});
                    }

                    this.loadAlarms();
                 });
                this.show = true;
            }
        }.bind(this));
    },
    methods: {
        close() {
            this.show=false;
            if (this.dstmItems.length>1) {
                lmsCommand(this.playerId, ["playerpref", "plugin.dontstopthemusic:provider", this.dstm]);
            }
            lmsCommand(this.playerId, ["playerpref", "transitionType", this.crossfade]);
            lmsCommand(this.playerId, ["playerpref", "replayGainMode", this.replaygain]);
            lmsCommand(this.playerId, ["playerpref", "alarmfadeseconds", this.alarms.fade ? 1 : 0]);
            lmsCommand(this.playerId, ["playerpref", "alarmTimeoutSeconds", this.alarms.timeout*60]);
            lmsCommand(this.playerId, ["playerpref", "alarmSnoozeSeconds", this.alarms.snooze*60]);
            lmsCommand(this.playerId, ["playerpref", "alarmsEnabled", this.alarms.on ? 1 : 0]);
            lmsCommand(this.playerId, ["playerpref", "alarmDefaultVolume", this.alarms.volume]);
            this.playerId = undefined;
        },
        loadAlarms() {
            lmsList(this.playerId, ["alarms", 0, 100], undefined, 0).then(({data}) => {
                if (data && data.result && data.result.alarms_loop) {
                    this.alarms.scheduled = [];
                    data.result.alarms_loop.forEach(i => {
                        this.alarms.scheduled.push(i);
                    });
                }
           });
        },
        toggleAlarm(alarm) {
             lmsCommand(this.playerId, ["alarm", "enabled:"+alarm.enabled, "id:"+alarm.id]).then(({data}) => {
                this.loadAlarms();
            });
        },
        addAlarm() {
            this.alarmDialog = { show: true, id: undefined, time: "00:00", dow:["0", "1", "2", "3", "4"], repeat: false,
                                 url: 'CURRENT_PLAYLIST', shuffle: this.alarmShuffeItems[0].key };
        },
        editAlarm(alarm) {
            this.alarmDialog = { show: true, id: alarm.id, time: formatTime(alarm.time, true), dow: alarm.dow.split(","),
                                 repeat: 1==alarm.repeat ? true : false, url: alarm.url, enabled: 1==alarm.enabled };
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
            this.$confirm("Delete alarm?",
                          {buttonTrueText: 'Delete', buttonFalseText: 'Cancel'}).then(res => {
                if (res) {
                    lmsCommand(this.playerId, ["alarm", "delete", "id:"+alarm.id]).then(({data}) => {
                        this.loadAlarms();
                    });
                }
            });
        }
    },
    filters: {
        formatAlarm: function (value) {
            var days=[];
            value.dow.split(",").forEach(d => {
                // LMS has Sun->Sat, but I prefer Mon->Sun
                var day = parseInt(d);
                if (day == 0) {
                    day = 6;
                } else {
                    day--;
                }
                days.push(DAYS_OF_WEEK[day]);
            });
            return formatTime(value.time, false)+" "+days.join(", ");
        }
    },
})

