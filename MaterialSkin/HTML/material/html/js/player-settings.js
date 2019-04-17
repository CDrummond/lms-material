/**
 * LMS-Material
 *
 * Copyright (c) 2018-2019 Craig Drummond <craig.p.drummond@gmail.com>
 * MIT license.
 */

var DAYS_OF_WEEK = ['Sun', 'Mon', 'Tues', 'Weds', 'Thurs', 'Fri', 'Sat'];

Vue.component('lms-player-settings', {
    template: `
<div>
 <v-dialog v-model="show" scrollable fullscreen>
  <v-card>
   <v-card-title class="settings-title">
    <v-toolbar color="primary" dark app class="lms-toolbar">
     <v-btn flat icon @click.native="close"><v-icon>arrow_back</v-icon></v-btn>
    <v-toolbar-title>{{TB_PLAYER_SETTINGS.title}}</v-toolbar-title>
   </v-toolbar>
  </v-card-title>

  <v-card-text>
   <v-list two-line subheader class="settings-list">
    <v-header>{{i18n('General')}}</v-header>
    <v-list-tile>
     <v-text-field clearable :label="i18n('Name')" v-model="playerName" class="lms-search"></v-text-field>
    </v-list-tile>
    <div class="dialog-padding"></div>
    <v-header>{{i18n('Audio')}}</v-header>
    <v-list-tile>
     <v-select :items="crossfadeItems" label="On song change" v-model="crossfade" item-text="label" item-value="key"></v-select>
    </v-list-tile>
    <v-list-tile>
     <v-select :items="replaygainItems" label="Volume gain" v-model="replaygain" item-text="label" item-value="key"></v-select>
    </v-list-tile>
    <v-list-tile v-if="dstmItems && dstmItems.length>1">
     <v-select :items="dstmItems" label="Don't Stop The Music" v-model="dstm" item-text="label" item-value="key"></v-select>
    </v-list-tile>

    <div class="dialog-padding"></div>
    <v-header>{{i18n('Sleep')}} {{sleepTime | displayTime}}</v-header>

    <v-list-tile>
     <v-btn @click="setSleep()" flat>{{i18n('Set sleep timer')}}</v-btn>
    </v-list-tile>
    <div class="dialog-padding"></div>
    <v-header>{{i18n('Alarms')}}</v-header>
     <v-list-tile>
      <v-list-tile-content @click="alarms.on = !alarms.on" class="switch-label">
       <v-list-tile-title>{{i18n('Enable alarms')}}</v-list-tile-title>
       <v-list-tile-sub-title>{{i18n('Enable alarm fuctionality.')}}</v-list-tile-sub-title>
      </v-list-tile-content>
      <v-list-tile-action><v-switch v-model="alarms.on"></v-switch></v-list-tile-action>
     </v-list-tile>
      <div class="settings-sub-pad"></div>
     <v-subheader class="alarm-sched-header">{{i18n('Scheduled alarms')}}</v-subheader>
     <template v-for="(item, index) in alarms.scheduled">
      <v-list-tile class="alarm-entry">
       <v-checkbox v-model="item.enabled" :label="item | formatAlarm" @click.stop="toggleAlarm(item)"></v-checkbox>
       <v-btn flat icon @click.stop="editAlarm(item)" class="toolbar-button"><v-icon>edit</v-icon></v-btn>
       <v-btn flat icon @click.stop="deleteAlarm(item)" class="toolbar-button"><v-icon>delete</v-icon></v-btn>
      </v-list-tile>
      <v-divider v-if="(index+1 < alarms.scheduled.length)" class="alarm-divider"></v-divider>
     </template>
     <v-btn flat icon @click.stop="addAlarm()" class="alarm-add"><v-icon>alarm_add</v-icon></v-btn>
     <div class="settings-sub-pad"></div>
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
     <div class="dialog-padding"></div>
    </v-list>
   </v-card-text>
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
   <div class="dialog-padding"></div>
   <v-subheader>{{i18n('Days')}}</v-subheader>
   <v-list-tile class="settings-compact-row">
    <v-flex xs6><v-checkbox v-model="alarmDialog.dow" :label="i18n('Monday')" value="1"></v-checkbox></v-flex>
    <v-flex xs6><v-checkbox v-model="alarmDialog.dow" :label="i18n('Tuesday')" value="2"></v-checkbox></v-flex>
   </v-list-tile>
   <v-list-tile class="settings-compact-row">
    <v-flex xs6><v-checkbox v-model="alarmDialog.dow" :label="i18n('Wednesday')" value="3"></v-checkbox></v-flex>
    <v-flex xs6><v-checkbox v-model="alarmDialog.dow" :label="i18n('Thursday')" value="4"></v-checkbox></v-flex>
   </v-list-tile>
   <v-list-tile class="settings-compact-row"><v-checkbox v-model="alarmDialog.dow" :label="i18n('Friday')" value="5"></v-checkbox></v-list-tile>
   <v-list-tile class="settings-compact-row">
    <v-flex xs6><v-checkbox v-model="alarmDialog.dow" :label="i18n('Saturday')" value="6"></v-checkbox></v-flex>
    <v-flex xs6><v-checkbox v-model="alarmDialog.dow" :label="i18n('Sunday')" value="0"></v-checkbox></v-flex>
   </v-list-tile>
   <div class="dialog-padding"></div>
   <v-subheader>{{i18n('Options')}}</v-subheader>
   <v-list-tile>
    <v-select :items="alarmSounds" :label="i18n('Sound')" v-model="alarmDialog.url" item-text="label" item-value="key"></v-select>
   </v-list-tile>

   <!-- TODO ????
   <v-list-tile class="settings-compact-row">
    <v-select :items="alarmShuffeItems" :label="i18n('Shuffle')" v-model="alarmDialog.shuffle" item-text="label" item-value="key"></v-select>
   </v-list-tile>
   -->
   <v-list-tile>
    <v-list-tile-content @click="alarmDialog.repeat = !alarmDialog.repeat" class="switch-label">
     <v-list-tile-title>{{i18n('Repeat')}}</v-list-tile-title>
     <v-list-tile-sub-title>{{i18n('Should alarms repeat')}}</v-list-tile-sub-title>
    </v-list-tile-content>
    <v-list-tile-action><v-switch v-model="alarmDialog.repeat"></v-switch></v-list-tile-action>
   </v-list-tile>
  </v-list>
  <div class="dialog-padding"></div>
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
            sleepTime: undefined,
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
            this.handlePlayerStatus(playerStatus);
        }.bind(this));
        bus.$on('otherPlayerStatus', function(playerStatus) {
            if (this.player.id == playerStatus.id) {
                this.handlePlayerStatus(playerStatus);
            }
        }.bind(this));

        bus.$on('playersettings.open', function(player) {
            if (undefined==player && this.$store.state.player && !this.show) {
                this.playerSettings(this.$store.state.player);
            } else if (undefined!=player && !this.show) {
                this.playerSettings(player);
            }
        }.bind(this));
    },
    methods: {
        handlePlayerStatus(playerStatus) {
            this.controlSleepTimer(playerStatus.will_sleep_in);
        },
        playerSettings(player) {
            this.cancelSleepTimer();
            this.dstmItems=[];
            this.crossfade='0';
            this.replaygain='0';
            this.player = player;
            this.playerName = player.name;
            this.playerOrigName = player.name;
            lmsCommand("", ["pref", "plugin.state:DontStopTheMusic", "?"]).then(({data}) => {
                if (data && data.result && data.result._p2 && "disabled"!=data.result._p2) {
                    lmsCommand(this.player.id, ["dontstopthemusicsetting"]).then(({data}) => {
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
                }
            });
            lmsCommand(this.player.id, ["playerpref", "transitionType", "?"]).then(({data}) => {
                if (data && data.result && undefined!=data.result._p2) {
                    this.crossfade=data.result._p2;
                }
            });
            lmsCommand(this.player.id, ["playerpref", "replayGainMode", "?"]).then(({data}) => {
                if (data && data.result && undefined!=data.result._p2) {
                    this.replaygain=data.result._p2;
                }
            });

            this.alarms.on=true;
            this.alarms.volume=100;
            this.alarms.snooze=0;
            this.alarms.timeout=0;
            this.alarms.fade=true;
            lmsCommand(this.player.id, ["playerpref", "alarmfadeseconds", "?"]).then(({data}) => {
                if (data && data.result && undefined!=data.result._p2) {
                    this.alarms.fade=1==data.result._p2;
                }
            });
            lmsCommand(this.player.id, ["playerpref", "alarmTimeoutSeconds", "?"]).then(({data}) => {
                if (data && data.result && undefined!=data.result._p2) {
                    this.alarms.timeout=Math.floor(parseInt(data.result._p2)/60);
                }
            });
            lmsCommand(this.player.id, ["playerpref", "alarmSnoozeSeconds", "?"]).then(({data}) => {
                if (data && data.result && undefined!=data.result._p2) {
                    this.alarms.snooze=Math.floor(parseInt(data.result._p2)/60);
                }
            });
            lmsCommand(this.player.id, ["playerpref", "alarmsEnabled", "?"]).then(({data}) => {
                if (data && data.result && undefined!=data.result._p2) {
                    this.alarms.on=1==data.result._p2;
                }
            });
            lmsCommand(this.player.id, ["playerpref", "alarmDefaultVolume", "?"]).then(({data}) => {
                if (data && data.result && undefined!=data.result._p2) {
                    this.alarms.volume=data.result._p2;
                }
            });
            this.alarmSounds=[];
            this.alarms.scheduled=[];
            lmsList(this.player.id, ["alarm", "playlists"], undefined, 0).then(({data}) => {
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
            lmsCommand(this.player.id, ["sleep", "?"]).then(({data}) => {
                if (data && data.result && data.result._sleep) {
                    this.controlSleepTimer(parseInt(data.result._sleep));
                }
            });
            this.show=true;
            bus.$emit('dialogOpen', this.show);
        },
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
        },
        close() {
            this.show=false;
            bus.$emit('dialogOpen', this.show);
            if (this.dstmItems.length>1) {
                lmsCommand(this.player.id, ["playerpref", "plugin.dontstopthemusic:provider", this.dstm]);
            }
            lmsCommand(this.player.id, ["playerpref", "transitionType", this.crossfade]);
            lmsCommand(this.player.id, ["playerpref", "replayGainMode", this.replaygain]);
            lmsCommand(this.player.id, ["playerpref", "alarmfadeseconds", this.alarms.fade ? 1 : 0]);
            lmsCommand(this.player.id, ["playerpref", "alarmTimeoutSeconds", this.alarms.timeout*60]);
            lmsCommand(this.player.id, ["playerpref", "alarmSnoozeSeconds", this.alarms.snooze*60]);
            lmsCommand(this.player.id, ["playerpref", "alarmsEnabled", this.alarms.on ? 1 : 0]);
            lmsCommand(this.player.id, ["playerpref", "alarmDefaultVolume", this.alarms.volume]);
            if (this.playerOrigName!=this.playerName) {
                lmsCommand(this.player.id, ['name', this.playerName]).then(({data}) => {
                    bus.$emit('refreshServerStatus');
                });
            }
            this.player.id = undefined;
        },
        loadAlarms() {
            lmsList(this.player.id, ["alarms"], ["filter:all"], 0).then(({data}) => {
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
             lmsCommand(this.player.id, ["alarm", "update", "enabled:"+(alarm.enabled ? 0 : 1), "id:"+alarm.id]).then(({data}) => {
                this.loadAlarms();
            });
        },
        addAlarm() {
            this.alarmDialog = { show: true, id: undefined, time: "00:00", dow:["1", "2", "3", "4", "5"], repeat: false,
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
            lmsCommand(this.player.id, cmd).then(({data}) => {
                this.loadAlarms();
            });
            this.alarmDialog.show = false;
        },
        deleteAlarm(alarm) {
            this.$confirm(i18n("Delete alarm?"),
                          {buttonTrueText: i18n('Delete'), buttonFalseText: i18n('Cancel')}).then(res => {
                if (res) {
                    lmsCommand(this.player.id, ["alarm", "delete", "id:"+alarm.id]).then(({data}) => {
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
        setSleep(duration) {
            bus.$emit('dlg.open', 'sleep', this.player);
        },
        cancelSleepTimer() {
            this.sleepTime = undefined;
            if (undefined!==this.sleepTimer) {
                clearInterval(this.sleepTimer);
                this.sleepTimer = undefined;
            }
        },
        controlSleepTimer(timeLeft) {
            if (undefined!=timeLeft && timeLeft>1) {
                timeLeft = Math.floor(timeLeft);
                if (this.timeLeft!=timeLeft) {
                    this.sleepTime = timeLeft;
                    this.timeLeft = this.sleepTime;
                    this.start = new Date();

                    this.sleepTimer = setInterval(function () {
                        var current = new Date();
                        var diff = (current.getTime()-this.start.getTime())/1000.0;
                        this.sleepTime = this.timeLeft - diff;
                        if (this.sleepTime<=0) {
                            this.sleepTime = undefined;
                                this.cancelSleepTimer();
                        }
                    }.bind(this), 1000);
                }
            } else {
                this.cancelSleepTimer();
            }
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
            return formatTime(value.time, false)+" "+days.join(", ")+(value.repeat ? " (" + i18n("Repeat") + ")" : "");
        },
        displayTime: function (value) {
            if (undefined==value) {
                return '';
            }
            return '('+formatSeconds(Math.floor(value))+')';
        }
    },
})

