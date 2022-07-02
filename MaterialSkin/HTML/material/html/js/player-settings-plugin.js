/**
 * LMS-Material
 *
 * Copyright (c) 2018-2022 Craig Drummond <craig.p.drummond@gmail.com>
 * MIT license.
 */
'use strict';

const LMS_PLAYER_SETTINGS_PLUGIN_MAX_ITEMS = 300;

Vue.component('lms-player-settings-plugin', {
     template: `
 <div>
  <v-dialog v-model="show" v-if="show" scrollable fullscreen>
   <v-card>
    <v-card-title class="settings-title">
     <v-toolbar app-data class="dialog-toolbar">
      <v-btn flat icon v-longpress:stop="goBack" :title="i18n('Go back')"><v-icon>arrow_back</v-icon></v-btn>
      <v-btn v-if="showHome && homeButton" flat icon @click="goHome" :title="i18n('Go home')"><v-icon>home</v-icon></v-btn>
      <v-toolbar-title>{{title}}</v-toolbar-title>
      <v-spacer></v-spacer> 
     </v-toolbar>
    </v-card-title>
    <v-card-text>
     <v-list id="player-settings-plugin-list">
      <v-list-tile v-for="(item, index) in items" @click="fetch(item)" class="lms-list-item">
       <v-list-tile-avatar :tile="true" class="lms-avatar" v-if="undefined!=item.radio"><v-icon>{{1==item.radio ? "radio_button_checked" : "radio_button_unchecked" }}</v-icon></v-list-tile-avatar>
       <v-list-tile-avatar :tile="true" class="lms-avatar" v-else-if="item.icon"><img class="svg-img" :key="item.icon" v-lazy="item.icon"></img></v-list-tile-avatar>
       <v-list-tile-content>
        <v-list-tile-title>{{item.title}}</v-list-tile-title>
        <v-list-tile-sub-title v-if="item.subtitle">{{item.subtitle}}</v-list-tile-sub-title>
       </v-list-tile-content> 
      </v-list-tile>
     </v-list>
    </v-card-text>
   </v-card>
  </v-dialog>
 </div>
 `,
     props: [],
     data() {
         return {
             show: false,
             showHome: false,
             playerId: undefined,
             title: undefined,
             items: []
         }
     },
     mounted() {
        this.fetching=false;
        bus.$on('playersettingsplugin.open', function(playerId, playerName, plugin, showHome) {
            this.playerId=playerId;
            this.playerName=playerName;
            this.title=plugin.title+SEPARATOR+playerName
            this.showHome=showHome;
            this.show=true;
            this.current=[];
            this.history=[];
            this.fetch(plugin);
        }.bind(this));
        bus.$on('noPlayers', function() {
            this.show=false;
        }.bind(this));
        bus.$on('esc', function() {
            if (this.$store.state.activeDialog == 'playersettingsplugin') {
                this.close();
            }
        }.bind(this));
     },
     methods: {
        goBack(longpress) {
            if (longpress && this.showHome) {
                this.goHome();
            } else if (this.history.length>0) {
                let prev = this.history.pop();
                this.title=prev.title;
                this.items=prev.items;
                this.current=prev.current;
                if (undefined!=this.getScrollElement()) {
                    setScrollTop(this, prev.pos>0 ? prev.pos : 0);
                }
            } else {
                this.close();
            }
        },
        goHome() {
            this.close();
            this.$store.commit('closeAllDialogs', true);
        },
        close() {
            this.show=false;
            this.playerId = undefined;
            this.history=[];
            this.items=[];
            this.fetching=false;
            this.scrollElement = undefined;
        },
        i18n(str) {
            if (this.show) {
                return i18n(str);
            } else {
                return str;
            }
        },
        fetch(item, isRefresh) {
            if (this.fetching) {
                return;
            }
            let cmd = browseBuildCommand(this, item, "go", false);
            if (0==cmd.command.length && 0==cmd.params.length) {
                return;
            }
            this.fetching = true;
            lmsList(this.playerId, cmd.command, cmd.params, 0, LMS_PLAYER_SETTINGS_PLUGIN_MAX_ITEMS).then(({data}) => {
                this.fetching = false;
                var resp = parseBrowseResp(data, this.current, {allowNoTitle:true});
                if (resp.items.length>0) {
                    if (2==resp.items.length && undefined!=resp.items[0].title && undefined==resp.items[1].title) {
                        this.handleControl(item, resp.items);
                    } else if (isRefresh) {
                        let se = this.getScrollElement();
                        let prevPos = undefined!=se ? se.scrollTop : -1;
                        this.items = resp.items;
                        if (se!=undefined) {
                            setScrollTop(this, prevPos>0 ? prevPos : 0);
                        }
                    } else {
                        if (this.items.length>0) {
                            let se = this.getScrollElement();
                            let prev = { title:this.title,
                                         items:this.items,
                                         current:this.current,
                                         pos:undefined==se ? 0 : se.scrollTop
                                       };
                            this.history.push(prev);
                        }
                        this.items=resp.items;
                        this.current=item;
                        this.title=item.title+SEPARATOR+this.playerName;
                    }
                } else {

                    this.fetch(this.current, true);
                }
            }).catch(err => {
                this.fetching = false;
                logError(err, cmd.command, cmd.params, 0, LMS_PLAYER_SETTINGS_PLUGIN_MAX_ITEMS);
            });
        },
        handleControl(clicked, items) {
            if (1==items[1].slider) {
                let si = items[1];
                let slider = { step:undefined==si.step ? 1 : parseInt(si.step),
                               min:undefined==si.min ? 0 : parseInt(si.min),
                               max:undefined==si.max ? 100 : parseInt(si.max),
                               value:undefined==si.value ? 0 : parseInt(si.value) };
                promptSlider(clicked.title, slider).then(resp => {
                    if (resp.ok) {
                        let cmd = browseBuildCommand(this, items[1], "go", false);
                        for (var i=0, len=cmd.params.length; i<len; ++i) {
                            cmd.params[i]=cmd.params[i].replace(":value", ":"+resp.value);
                        }
                        lmsCommand(this.playerId, cmd.command.concat(cmd.params));
                    }
                });
            }
        },
        getScrollElement() {
            if (undefined==this.scrollElement) {
                this.scrollElement = document.getElementById("player-settings-plugin-list");
            }
            return this.scrollElement;
        }
     },
     watch: {
        'show': function(val) {
             this.$store.commit('dialogOpen', {name:'playersettingsplugin', shown:val});
        }
     }
})
