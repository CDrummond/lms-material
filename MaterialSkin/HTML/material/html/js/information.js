/**
 * LMS-Material
 *
 * Copyright (c) 2018-2019 Craig Drummond <craig.p.drummond@gmail.com>
 * MIT license.
 */

Vue.component('lms-information-dialog', {
    template: `
<v-dialog v-model="show" v-if="show" scrollable fullscreen persistent>
 <v-card>
  <v-card-title class="settings-title">
   <v-toolbar color="primary" dark app class="lms-toolbar">
    <v-btn flat icon @click.native="close()"><v-icon>arrow_back</v-icon></v-btn>
    <v-toolbar-title>
     <div>{{i18n('Information')}}</div>
    </v-toolbar-title>
   </v-toolbar>
  </v-card-title>
  <div class="ios-vcard-text-workaround"><div class="infodetails" id="info-page">

   <div v-if="server.length>0">
    <p class="about-header">{{i18n('Server')}}</p>
    <ul>
     <template v-for="(info, index) in server"><li>{{info.label}}: {{info.text}}</li></template>
    </ul>
    <v-btn @click="openSettings" flat><v-icon class="btn-icon">dns</v-icon>{{i18n('Server Settings')}}</v-btn>
    <div class="dialog-padding"></div>
   </div>

   <p class="about-header">{{i18n('Library')}}</p>
   <ul>
    <template v-for="(item, index) in library"><li>{{item}}</li></template>
   </ul>
   <v-menu bottom v-if="!scanning">
    <v-btn slot="activator" flat><v-icon class="btn-icon">refresh</v-icon>{{i18n('Rescan')}} <v-icon>arrow_drop_down</v-icon></v-btn>
    <v-list>
     <template v-for="(item, index) in rescans">
      <v-list-tile @click="initiateScan(item.prompt, item.command)">
       <v-list-tile-title>{{item.title}}</v-list-tile-title>
      </v-list-tile>
     </template>
    </v-list>
   </v-menu>
   <div class="dialog-padding" id="info-plugins"></div>

   <p class="about-header">{{i18n('Plugins')}}</p>
   <p v-if="'idle'==pluginStatus && updates.details.length>0">{{i18n('The following plugins have updates available:')}}</p>
   <p v-if="'needs_restart'==pluginStatus && updates.details.length>0">{{i18n('The following plugins have been updated:')}}</p>
   <ul v-if="'downloading'!=pluginStatus && updates.details.length>0">
    <template v-for="(plug, index) in updates.details"><li>{{plug.title}} {{plug.version}}<v-btn flat icon style="margin-top:2px;height:18px;width:18px" @click="pluginInfo(plug)"><v-icon small>help_outline</v-icon></v-btn></li></template>
   </ul>
   <v-btn v-if="updates.details.length>0 && 'idle'==pluginStatus" @click="updatePlugins" flat><img class="svg-img btn-icon" :src="'update' | svgIcon(darkUi)">{{i18n('Update plugins')}}</v-btn>
   <p v-if="'downloading'==pluginStatus">{{i18n('Downloading plugin updates')}}</p>
   <v-btn v-if="'needs_restart'==pluginStatus" @click="restartServer" flat>{{i18n('Restart server')}}</v-btn>
   <p v-if="'downloading'!=pluginStatus && updates.details.length>0" style="padding-top:16px">{{i18n('The following plugins are up to date:')}}</p>
   <ul>
    <template v-for="(plug, index) in plugins.details"><li v-if="'downloading'==pluginStatus || !updates.names.has(plug.name)">{{plug.title}} {{plug.version}}<v-btn flat icon style="margin-top:2px;height:18px;width:18px" @click="pluginInfo(plug)"><v-icon small>help_outline</v-icon></v-btn></li></template>
   </ul>
   <div class="dialog-padding"></div>

   <p class="about-header">{{i18n('Players')}}</p>
   <ul>
    <template v-for="(item, index) in players">
     <li>{{item.name}}
      <ul>
       <template v-for="(info, index) in item.info"><li v-if="info!=''">{{info}}</li></template>
      </ul>
     </li>
    </template>
   </ul>

   <div class="dialog-padding"></div>

   <p class="about-header">{{i18n('About')}}</p>
   <p>{{i18n('Material Skin is a HTML5 WebApp for LMS. For support, to report bugs, or ask for new features, please visit one of the following links:')}}
    <ul>
     <li><a class="lms-link" href="https://forums.slimdevices.com/showthread.php?109624-Announce-Material-Skin" target="_blank">{{i18n('LMS support forums')}}</a></li>
     <li><a class="lms-link" href="https://github.com/CDrummond/lms-material" target="_blank">{{i18n('GitHub development page')}}</a></li>
    </ul>
   </p>

   <p>{{i18n('Material Skin is developed purely for fun, and no donations are required. However, if you wish to make a donation, please use the button below:')}}</p>
   <v-btn @click="openWindow('https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=2X2CTDUH27V9L&source=url')" flat><img class="svg-img btn-icon" :src="'paypal' | svgIcon(darkUi)"></img>{{i18n('Donate')}}</v-btn>

   <div class="dialog-padding"></div>
   <v-divider></v-divider>
   <div class="dialog-padding"></div>
   <p>© 2018-2019 Craig Drummond</p>
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
            players: [],
            plugins: {names: new Set(), details: []},
            updates: {names: new Set(), details: []},
            pluginStatus:'idle',
            rescans: [ {title:undefined, prompt:undefined, command: ["wipecache"]},
                       {title:undefined, prompt:undefined, command: ["rescan"]},
                       {title:undefined, prompt:undefined, command: ["rescan", "playlists"]} ],
            scanning: false
        }
    },
    mounted() {
        bus.$on('info.open', function(act) {
            lmsCommand("", ["material-skin", "info"]).then(({data}) => {
                if (data && data.result && data.result.info) {
                    var inf = JSON.parse(data.result.info);
                    if (inf && inf.server) {
                        this.server=inf.server;
                    }
                }
            });
            this.update();
            this.timer = setInterval(function () {
                this.update();
            }.bind(this), 2000);
            this.show = true;
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
                if (!hadPlugins && this.$store.state.pluginUpdatesAvailable) {
                    this.scrollToPlugins();
                }
            });
            axios.get(location.protocol+'//'+location.hostname+(location.port ? ':'+location.port : '')+"/updateinfo.json?x=time"+(new Date().getTime())).then((resp) => {
                var hadPlugins = this.plugins.names.length>0 || this.updates.names.length>0;
                var updates = eval(resp.data);
                this.updates.names.clear();
                this.updates.details = [];
                if (updates && updates.plugins) {
                    for (var i=0, len=updates.plugins.length; i<len; ++i) {
                        this.updates.names.add(updates.plugins[i].name);
                    }
                    this.updates.details = updates.plugins;
                    this.updates.details.sort(titleSort);
                    this.$forceUpdate();
                }
                this.$store.commit('setPluginUpdatesAvailable', updates && updates.plugins && updates.plugins.length>0);
                if (!hadPlugins && this.$store.state.pluginUpdatesAvailable) {
                    this.scrollToPlugins();
                }
            }).catch(err => {
                this.updates.names.clear();
                logError(err);
            });
            this.scrollToPlugins();
        }.bind(this));

        bus.$on('langChanged', function() {
            this.initItems();
        }.bind(this));
        this.initItems();

        bus.$on('esc', function() {
            if (this.$store.state.activeDialog == 'info') {
                this.show=false;
            }
        }.bind(this));
    },
    methods: {
        initItems() {
            this.rescans[0].title=i18n("Full rescan");
            this.rescans[0].prompt=i18n("Clear library, and rescan everything?");
            this.rescans[1].title=i18n("Update rescan");
            this.rescans[1].prompt=i18n("Look for new, and modified, files?");
            this.rescans[2].title=i18n("Update playlists");
            this.rescans[2].prompt=i18n("Rescan for playlist changes?");
        },
        scrollToPlugins() {
            if (this.$store.state.pluginUpdatesAvailable) {
                var plugins = document.getElementById("info-plugins");
                if (plugins) {
                    plugins.scrollIntoView(true);
                }
            }
        },
        update() {
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
                }
            });
            lmsCommand("", ["serverstatus", 0, LMS_MAX_PLAYERS]).then(({data}) => {
                if (data && data.result) {
                    var prevStrengths={};
                    for (var j=0, plen=this.players.length; j<plen; ++j) {
                        var p = this.players[j];
                        if (p.sigStrength>0) {
                            prevStrengths[p.id]=p.sigStrength;
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
                                         "" ];
                            if (undefined!=prevStrengths[player.playerid]) {
                                info[5]=i18n("Signal Strength: %1%", prevStrengths[player.playerid]);
                            }

                            this.players.push({name: player.name, id: player.playerid, info: info, isgroup: isgroup});
                            if (!isgroup) {
                                lmsCommand(player.playerid, ["signalstrength" ,"?"]).then(({data}) => {
                                    if (data && data.result && data.result._signalstrength>0) {
                                        for (var j=0, plen=this.players.length; j<plen; ++j) {
                                            var p = this.players[j];
                                            if (p.id==data.params[0]) {
                                                p.info[5]=i18n("Signal Strength: %1%", data.result._signalstrength);
                                                p.sigStrength = data.result._signalstrength;
                                            }
                                        }
                                    }
                                });
                            }
                        }
                    }
                    this.players.sort(playerSort);

                    this.scanning = undefined==data.result.lastscan || 1==data.result.scanning;
                    this.library=[ i18n("Total genres: %1", data.result["info total genres"]),
                                   i18n("Total artists: %1", data.result["info total artists"]),
                                   i18n("Total albums: %1", data.result["info total albums"]),
                                   i18n("Total songs: %1", data.result["info total songs"]),
                                   i18n("Total duration: %1", formatSeconds(data.result["info total duration"], true)),
                                   i18n("Last scan: %1", this.scanning ? i18n("In progress") : formatDate(data.result.lastscan))];

                    if (data.result.lastscanfailed) {
                        this.library.push("Last scan failure: %1", data.result.lastscanfailed);
                    }
                }
            });
        },
        close() {
            this.show = false;
            if (this.timer) {
                clearInterval(this.timer);
                this.timer = undefined;
            }
        },
        initiateScan(prompt, command) {
            this.$confirm(prompt, {buttonTrueText: i18n('Rescan'), buttonFalseText: i18n('Cancel')}).then(res => {
                if (res) {
                    lmsCommand("", command)
                }
            });
        },
        pluginInfo(plugin) {
            bus.$emit('dlg.open', 'iteminfo', plugin);
        },
        updatePlugins() {
            lmsCommand("", ["material-skin", "plugins-update", "plugins:"+JSON.stringify(this.updates.details)]).then(({data}) => {
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
        openSettings() {
            bus.$emit('dlg.open', 'iframe', '/material/settings/server/basic.html?darkUi=' + (this.$store.state.darkUi ? 1 : 0), i18n('Server settings'));
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
        }
    },
    filters: {
        svgIcon: function (name, dark) {
            return "/material/svg/"+name+"?c="+(dark ? LMS_DARK_SVG : LMS_LIGHT_SVG)+"&r="+LMS_MATERIAL_REVISION;
        }
    }
})

