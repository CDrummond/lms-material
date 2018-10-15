/*
 * LMS-Material
 *
 * Copyright (c) 2018 Craig Drummond <craig.p.drummond@gmail.com>
 * MIT license.
 */

const DAYS_OF_WEEK = ['Mon', 'Tues', 'Weds', 'Thurs', 'Fri', 'Sat', 'Sun'];

Vue.component('lms-player-settings', {
    template: `
      <v-dialog v-model="show" fullscreen app>
        <v-card>
          <v-toolbar color="primary" dark app class="lms-toolbar">
            <v-btn flat icon @click.native="close"><v-icon>arrow_back</b-icon></v-btn>
            <v-toolbar-title>'{{playerName}}' Settings</v-toolbar-title>
          </v-toolbar>
          <div class="settings-toolbar-pad"></div>
          <v-list three-line subheader class="settings-list">
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
              <v-list-tile style="width:100%; float:left; height:64px">
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
            alarmSounds:[]
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
                        this.fade=1==data.result._p2;
                    }
                });
                lmsCommand(this.playerId, ["playerpref", "alarmTimeoutSeconds", "?"]).then(({data}) => {
                    if (data && data.result && undefined!=data.result._p2) {
                        this.timeout=data.result._p2;
                    }
                });
                lmsCommand(this.playerId, ["playerpref", "alarmSnoozeSeconds", "?"]).then(({data}) => {
                    if (data && data.result && undefined!=data.result._p2) {
                        this.snooze=data.result._p2;
                    }
                });
                lmsCommand(this.playerId, ["playerpref", "alarmsEnabled", "?"]).then(({data}) => {
                    if (data && data.result && undefined!=data.result._p2) {
                        this.on=1==data.result._p2;
                    }
                });
                lmsCommand(this.playerId, ["playerpref", "alarmDefaultVolume", "?"]).then(({data}) => {
                    if (data && data.result && undefined!=data.result._p2) {
                        this.volume=data.result._p2;
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

                    lmsList(this.playerId, ["alarms", 0, 100], undefined, 0).then(({data}) => {
                        if (data && data.result && data.result.alarms_loop) {
                            data.result.alarms_loop.forEach(i => {
                                this.alarms.scheduled.push(i);
                            });
                        }
                    });
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
            lmsCommand(this.playerId, ["playerpref", "alarmTimeoutSeconds", this.alarms.timeout]);
            lmsCommand(this.playerId, ["playerpref", "alarmSnoozeSeconds", this.alarms.snooze]);
            lmsCommand(this.playerId, ["playerpref", "alarmsEnabled", this.alarms.on]);
            lmsCommand(this.playerId, ["playerpref", "alarmDefaultVolume", this.alarms.volume]);
            this.playerId = undefined;
        },
        toggleAlarm(alarm) {
             lmsCommand(this.playerId, ["alarm", "enabled:"+alarm.enabled, "id:"+alarm.id]);
        },
        addAlarm() {
        },
        editAlarm(alarm) {
        },
        deleteAlarm(alarm) {
            this.$confirm("Delete alarm?",
                          {buttonTrueText: 'Delete', buttonFalseText: 'Cancel'}).then(res => {
                if (res) {
                    lmsCommand(this.playerId, ["alarm", "delete", "id:"+alarm.id]);
                }
            });
        }
    },
    filters: {
        formatAlarm: function (value) {
            var days=[];
            value.dow.split(",").forEach(d => {
                days.push(DAYS_OF_WEEK[parseInt(d)]);
            });
            return formatTime(value.time)+" "+days.join(", ");
        }
    },
})

