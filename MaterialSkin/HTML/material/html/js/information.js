/**
 * LMS-Material
 *
 * Copyright (c) 2018-2023 Craig Drummond <craig.p.drummond@gmail.com>
 * MIT license.
 */
'use strict';

Vue.component('lms-information-dialog', {
    template: `
<v-dialog v-model="show" v-if="show" persistent no-click-animation scrollable fullscreen>
 <v-card>
  <v-card-title class="settings-title">
   <v-toolbar app class="dialog-toolbar">
    <v-btn flat icon v-longpress:stop="close" :title="ttShortcutStr(i18n('Go back'), 'esc')"><v-icon>arrow_back</v-icon></v-btn>
    <v-toolbar-title>
     <div>{{i18n('Information')+serverName}}</div>
    </v-toolbar-title>
   </v-toolbar>
  </v-card-title>
  <div class="ios-vcard-text-workaround"><div class="infodetails" id="info-page">

   <div v-if="server.length>0">
    <p class="about-header">{{i18n('Server')}}</p>
    <p v-if="updates.server"><b @click="showUpdateInfo" class="link-item">{{i18n('New version available')}}</b></p>
    <ul>
     <template v-for="(info, index) in server"><li>{{info.label}}: {{info.text}}</li></template>
    </ul>
    <v-btn @click="openServerSettings(serverName, 2)" v-if="unlockAll" flat><img class="btn-icon svg-img" :src="TB_SERVER_SETTINGS.svg | svgIcon(darkUi)"></img>{{TB_SERVER_SETTINGS.title}}</v-btn>
    <div class="dialog-padding"></div>
   </div>

   <p class="about-header">{{i18n('Library')}}</p>
   <ul>
    <template v-for="(item, index) in library"><li>{{item}}</li></template>
    <li v-if="scanning"><v-icon class="pulse">update</v-icon> {{scanInfo}}</li>
    <li v-else-if="undefined!=scanInfo">{{scanInfo}}</li>
   </ul>
   <v-menu bottom v-if="!scanning && unlockAll">
    <v-btn slot="activator" flat><v-icon class="btn-icon">refresh</v-icon>{{i18n('Rescan')}} <v-icon>arrow_drop_down</v-icon></v-btn>
    <v-list>
     <template v-for="(item, index) in rescans">
      <v-list-tile @click="rescan(item)">
       <v-list-tile-title>{{item.name}}</v-list-tile-title>
      </v-list-tile>
     </template>
    </v-list>
   </v-menu>
   <div class="dialog-padding" id="info-plugins"></div>

   <p class="about-header">{{i18n('Plugins')}}</p>
   <p v-if="'idle'==pluginStatus && updates.details.length>0">{{i18n('The following plugins have updates available:')}}</p>
   <p v-if="'needs_restart'==pluginStatus && updates.details.length>0">{{i18n('The following plugins have been updated:')}}</p>
   <ul v-if="'downloading'!=pluginStatus && updates.details.length>0">
    <template v-for="(plug, index) in updates.details"><li><object @click="pluginInfo(plug)" class="link-item">{{plug.title}} {{plug.version}}</object></li></template>
   </ul>
   <v-btn v-if="updates.details.length>0 && 'idle'==pluginStatus && unlockAll" @click="updatePlugins" flat><img class="svg-img btn-icon" :src="'update' | svgIcon(darkUi)">{{i18n('Update plugins')}}</v-btn>
   <p v-if="updates.details.length>0 && 'idle'==pluginStatus && unlockAll" style="padding-top:16px" class="subtext cursor link-item" @click='openPluginSettings'>{{i18n("For more fine-grained control over plugins please visit the 'Plugins' section of 'Server settings'")}}</p>

   <p v-if="'downloading'==pluginStatus"><v-icon class="pulse">cloud_download</v-icon> {{i18n('Downloading plugin updates')}}</p>
   <v-btn v-if="'needs_restart'==pluginStatus && unlockAll" @click="restartServer" flat><img class="svg-img btn-icon" :src="'restart' | svgIcon(darkUi)">{{i18n('Restart server')}}</v-btn>
   <p v-if="'downloading'!=pluginStatus && updates.details.length>0" style="padding-top:16px">{{i18n('The following plugins are up to date:')}}</p>
   <ul>
    <template v-for="(plug, index) in plugins.details"><li v-if="'downloading'==pluginStatus || !updates.names.has(plug.name)"><object class="link-item" @click="pluginInfo(plug)">{{plug.title}} {{plug.version}}</object></li></template>
   </ul>
   <div class="dialog-padding"></div>

   <p class="about-header">{{i18n('Players')}}</p>
   <div v-for="(item, index) in players">
    <v-icon v-if="item.icon.icon" style="margin-top:-4px">{{item.icon.icon}}</v-icon><img v-else class="svg-img" style="margin-top:-4px" :src="item.icon.svg | svgIcon(darkUi)"></img> {{item.name}}
    <ul>
     <template v-for="(info, index) in item.info"><li v-if="info!=''">{{info}}</li></template>
    </ul>
   </li>
   <v-btn @click="openPlayerSettings(item)" flat><img class="btn-icon svg-img" :src="TB_PLAYER_SETTINGS.svg | svgIcon(darkUi)"></img>{{TB_PLAYER_SETTINGS.title}}</v-btn>
  </div>

   <div class="dialog-padding"></div>

   <p class="about-header">{{i18n('About')}}</p>
   <p>{{i18n('Material Skin is a HTML5 WebApp for LMS. For support, to report bugs, or ask for new features, please visit one of the following links:')}}
    <ul>
     <li><a class="lms-link" href="https://cdn.statically.io/gh/d6jg/material-documentation/master/html/Material%20Skin.html" target="_blank">{{i18n('User guide')}}</a></li>
     <li><a class="lms-link" href="https://forums.slimdevices.com/showthread.php?109624-Announce-Material-Skin" target="_blank">{{i18n('LMS support forums')}}</a></li>
     <li><div class="lms-link cursor" @click="openTechInfo">{{i18n('LMS technical information')}}</div></li>
     <li><a class="lms-link" href="https://github.com/CDrummond/lms-material" target="_blank">{{i18n('GitHub development page')}}</a></li>
    </ul>
   </p>

   <p>{{i18n('Material Skin is developed purely for fun, and no donations are required. However, if you wish to make a donation, please use the button below:')}}</p>
   <v-btn @click="openWindow('https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=2X2CTDUH27V9L&source=url')" flat><img class="svg-img btn-icon" :src="'paypal' | svgIcon(darkUi)"></img>{{i18n('Donate')}}</v-btn>

   <div class="dialog-padding"></div>
   <v-divider></v-divider>
   <div class="dialog-padding"></div>
   <p>© 2018-2023 Craig Drummond</p>
   <div class="dialog-padding"></div>
  </div></div>
 </v-card>

</v-dialog>
`,
    props: [],
    data() {
        return {
            show: false,
            server: [],
            library: [],
            scanInfo: undefined,
            players: [],
            plugins: {names: new Set(), details: []},
            updates: {names: new Set(), details: [], server:false},
            pluginStatus:'idle',
            rescans: [ ],
            scanning: false,
            serverName: ""
        }
    },
    mounted() {
        bus.$on('info.open', function(act) {
            this.openTime = new Date().getTime();
            lmsCommand("", ["material-skin", "info"]).then(({data}) => {
                if (data && data.result && data.result.info) {
                    var inf = JSON.parse(data.result.info);
                    if (inf && inf.server) {
                        this.server=inf.server;
                    }
                }
            });
            lmsCommand("", ["material-skin", "scantypes"]).then(({data}) => {
                if (data && data.result && data.result.item_loop) {
                   this.rescans=data.result.item_loop;
                }
            });
            lmsCommand("", ["material-skin", "server"]).then(({data}) => {
                if (data && data.result) {
                    this.serverName=undefined==data.result.libraryname ? "" : (SEPARATOR+data.result.libraryname);
                }
            }).catch(err => {
            });
            this.update();
            this.timer = setInterval(function () {
                this.update();
            }.bind(this), 2000);
            this.show = true;
            var scrolled = this.scrollToPlugins();
            lmsCommand("", ["material-skin", "plugins"]).then(({data}) => {
                var hadPlugins = this.plugins.names.length>0 || this.updates.names.length>0;
                this.plugins.names.clear();
                this.plugins.details = [];
                if (data && data.result && data.result.plugins_loop) {
                    for (var i=0, len=data.result.plugins_loop.length; i<len; ++i) {
                        this.plugins.names.add(data.result.plugins_loop[i].name);
                    }
                    this.plugins.details = data.result.plugins_loop;
                    this.plugins.details.sort(titleSort);
                }
            });
            if (this.$store.state.unlockAll) {
                this.updates.server = this.$store.state.updatesAvailable.has("server");
                axios.get(location.protocol+'//'+location.hostname+(location.port ? ':'+location.port : '')+"/updateinfo.json?x=time"+(new Date().getTime())).then((resp) => {
                    var hadServer = this.updates.server;
                    var hadPlugins = this.plugins.names.length>0 || this.updates.names.length>0;
                    var updates = eval(resp.data);
                    this.updates.names.clear();
                    this.updates.details = [];
                    this.updates.server = updates && updates.server;
                    if (updates && updates.plugins && updates.plugins.length>0) {
                        for (var i=0, len=updates.plugins.length; i<len; ++i) {
                            if (updates.plugins[i]!=null) {
                                this.updates.names.add(updates.plugins[i].name);
                                this.updates.details.push(updates.plugins[i]);
                            }
                        }
                        this.updates.details.sort(titleSort);
                        this.$forceUpdate();
                    }
                    var avail = new Set();
                    if (this.updates.server) {
                        avail.add("server");
                    }
                    if (this.updates.names.size>0) {
                        avail.add("plugins");
                    }
                    this.$store.commit('setUpdatesAvailable', avail);
                    if (!scrolled && (new Date().getTime() - this.openTime)<1500) {
                        this.scrollToPlugins();
                    }
                }).catch(err => {
                    this.updates.names.clear();
                    logError(err);
                });
            } else {
                this.pluginStatus = 'idle';
                this.updates={names: new Set(), details: [], server:false};
            }
        }.bind(this));

        bus.$on('esc', function() {
            if (this.$store.state.activeDialog == 'info') {
                this.show = false;
            }
        }.bind(this));
    },
    methods: {
        scrollToPlugins() {
            if (!this.$store.state.unlockAll) {
                return false;
            }
            if (this.$store.state.restartRequired || (this.$store.state.updatesAvailable.has("plugins") && !this.$store.state.updatesAvailable.has("server"))) {
                var plugins = document.getElementById("info-plugins");
                if (plugins) {
                    setTimeout(function () {
                        plugins.scrollIntoView({ block: 'start',  behavior: 'smooth' });
                    }, 25);
                    return true;
                }
            }
            return false;
        },
        update() {
            if (!this.show) {
                return;
            }
            if (this.$store.state.unlockAll) {
                lmsCommand("", ["material-skin", "plugins-status"]).then(({data}) => {
                    if (data && data.result) {
                        var status='idle';
                        if (1 == parseInt(data.result.downloading)) {
                            status='downloading';
                        } else if (1 == parseInt(data.result.needs_restart)) {
                            status='needs_restart';
                        }
                        if (status!=this.pluginStatus) {
                            this.pluginStatus = status;
                        }
                        this.$store.commit('setRestartRequired', 1 == parseInt(data.result.needs_restart));
                    }
                });
            }
            lmsCommand("", ["serverstatus", 0, LMS_MAX_PLAYERS]).then(({data}) => {
                if (data && data.result) {
                    var prevStrengths={};
                    var prevVoltages={};
                    for (var j=0, plen=this.players.length; j<plen; ++j) {
                        var p = this.players[j];
                        if (p.sigStrength>0) {
                            prevStrengths[p.id]=p.sigStrength;
                        }
                        if (p.voltage>=0) {
                            prevVoltages[p.id]=p.voltage;
                        }
                    }
                    this.players = [];
                    if (data.result.players_loop) {
                        for (var i=0, len=data.result.players_loop.length; i<len; ++i) {
                            var player = data.result.players_loop[i];
                            var isgroup = 'group'===player.model;
                            var info = [ i18n("Model: %1", player.modelname),
                                         i18n("Type: %1", player.model),
                                         i18n("Firmware: %1", player.firmware),
                                         i18n("IP: %1", player.ip.split(':')[0]),
                                         i18n("MAC Address: %1", player.playerid),
                                         "",
                                         "" ];
                            if (undefined!=prevStrengths[player.playerid]) {
                                info[5]=i18n("Signal Strength: %1%", prevStrengths[player.playerid]);
                            }
                            if (undefined!=prevVoltages[player.playerid]) {
                                info[6]=i18n("Voltage: %1", prevVoltages[player.playerid]);
                            }
                            this.players.push({name: player.name, id: player.playerid, info: info, isgroup: isgroup, icon:mapPlayerIcon(player),
                                               link: ("squeezelite"==player.model && player.firmware && player.firmware.endsWith("-pCP")) ||      "squeezeesp32"==player.model
                                                   ? "http://"+player.ip.split(':')[0] : undefined});
                        }

                        lmsCommand("", ["material-skin", "players-extra-info"]).then(({data}) => {
                            if (data && data.result && data.result.players) {
                                let map = {};
                                for (var i=0, loop=data.result.players, len=loop.length; i<len; ++i) {
                                    map[loop[i].id]={sig:loop[i].signalstrength, volt:loop[i].voltage};
                                }

                                for (var j=0, plen=this.players.length; j<plen; ++j) {
                                    var p = this.players[j];
                                    var info = map[p.id];
                                    if (undefined!=info) {
                                        if (info.sig>0) {
                                            p.info[5]=i18n("Signal Strength: %1%", info.sig);
                                            p.sigStrength = info.sig;
                                        }
                                        if (info.volt>=0) {
                                            p.info[6]=i18n("Voltage: %1", info.volt);
                                            p.voltage = info.volt;
                                        }
                                        this.$set(this.players, j, p);
                                    }
                                }
                            }
                        });
                    }
                    this.players.sort(playerSort);

                    let wasScanning = this.scanning;
                    this.scanning = undefined==data.result.lastscan || 1==data.result.scanning || 1==data.result.scan;
                    let progressInfo = undefined;
                    if (this.scanning && undefined!=data.result.progressname) {
                        let total = undefined!=data.result.progresstotal ? parseInt(data.result.progresstotal) : undefined;
                        let done = undefined!=data.result.progressdone ? parseInt(data.result.progressdone) : undefined;
                        progressInfo = data.result.progressname+(undefined!=done && undefined!=total
                                                                    ? ' ('+done+(total>=done ? '/'+total : '')+')'
                                                                    : '');
                    }
                    this.library=[ i18n("Total genres: %1", data.result["info total genres"]),
                                   i18n("Total artists: %1", data.result["info total artists"]),
                                   i18n("Total albums: %1", data.result["info total albums"]),
                                   i18n("Total songs: %1", data.result["info total songs"])];
                    if (undefined!=data.result["info total duration"]) {
                        this.library.push(i18n("Total duration: %1", formatSeconds(data.result["info total duration"], true)));
                    }
                    this.scanInfo=undefined!=progressInfo ? progressInfo : this.scanning ? i18n("In progress") : undefined==data.result.lastscan || data.result.lastscan<=0 ? undefined : i18n("Last scan: %1", formatDate(data.result.lastscan));

                    // Noticed a scan has started, so get server class to also poll for changes - so that icon in main toolbar is updated...
                    if (this.scanning && !wasScanning) {
                        bus.$emit('refreshServerStatus');
                    }
                    if (data.result.lastscanfailed) {
                        this.library.push("Last scan failure: %1", data.result.lastscanfailed);
                    }
                }
            });
        },
        close() {
            this.show = false;
            this.scanning = false;
            this.pluginStatus = 'idle';
            if (this.timer) {
                clearInterval(this.timer);
                this.timer = undefined;
            }
        },
        pluginInfo(plugin) {
            bus.$emit('dlg.open', 'iteminfo', plugin);
        },
        updatePlugins() {
            let updates = [];
            for (let i=0, loop=this.updates.details, len=loop.length; i<len; ++i) {
                updates.push({name:loop[i].name, url:loop[i].url, sha:loop[i].sha});
            }
            lmsCommand("", ["material-skin", "plugins-update", "plugins:"+JSON.stringify(updates)]).then(({data}) => {
                if (data && data.result && undefined!=data.result.updating && parseInt(data.result.updating)>0) {
                    bus.$emit('showMessage', i18n('Updating plugins.'));
                    this.update();
                }
            });
        },
        restartServer() {
            lmsCommand("", ["restartserver"]).then(({data}) => {
                this.close();
                bus.$emit('showMessage', i18n('Server is being restarted.'));
                setTimeout(function () {
                    location.reload();
                }, 2500);
            }).catch(err => {
                this.close();
                bus.$emit('showMessage', i18n('Server is being restarted.'));
            });
        },
        i18n(str) {
            if (this.show) {
                return i18n(str);
            } else {
                return str;
            }
        },
        openPlayerSettings(player) {
            bus.$emit('dlg.open', 'playersettings', player, undefined, 2);
        },
        openPluginSettings() {
            openServerSettings(this.serverName, 0, '/material/plugins/Extensions/settings/basic.html');
            this.close();
        },
        openTechInfo() {
            bus.$emit('dlg.open', 'iframe', '/material/html/docs/index.html', i18n('LMS technical information'), undefined, IFRAME_HOME_CLOSES_DIALOGS);
        },
        rescan(item) {
            bus.$emit('showMessage', item.name);
            lmsCommand('', item.cmd);
        },
        showUpdateInfo() {
            bus.$emit('dlg.open', 'iframe', '/material/updateinfo.html', i18n('Update information'), undefined, IFRAME_HOME_CLOSES_DIALOGS);
        }
    },
    beforeDestroy() {
        if (undefined!==this.timer) {
            clearInterval(this.timer);
            this.timer = undefined;
        }
    },
    watch: {
        'show': function(val) {
            this.$store.commit('dialogOpen', {name:'info', shown:val});
        }
    },
    computed: {
        darkUi () {
            return this.$store.state.darkUi
        },
        unlockAll() {
            return this.$store.state.unlockAll
        }
    },
    filters: {
        svgIcon: function (name, dark) {
            return "/material/svg/"+name+"?c="+(dark ? LMS_DARK_SVG : LMS_LIGHT_SVG)+"&r="+LMS_MATERIAL_REVISION;
        }
    }
})

