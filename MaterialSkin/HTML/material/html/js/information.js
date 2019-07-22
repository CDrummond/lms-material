/**
 * LMS-Material
 *
 * Copyright (c) 2018-2019 Craig Drummond <craig.p.drummond@gmail.com>
 * MIT license.
 */

Vue.component('lms-information-dialog', {
    template: `
<v-dialog v-model="show" v-if="show" scrollable fullscreen>
 <v-card>
  <v-card-title class="settings-title">
   <v-toolbar color="primary" dark app class="lms-toolbar">
    <v-btn flat icon @click.native="close()"><v-icon>arrow_back</v-icon></v-btn>
    <v-toolbar-title>
     <div>{{i18n('Information')}}</div>
    </v-toolbar-title>
   </v-toolbar>
  </v-card-title>
  <div class="ios-vcard-text-workaround"><div class="infodetails">

   <div v-if="server.length>0">
    <p class="about-header">{{i18n('Server')}}</p>
    <ul>
     <template v-for="(info, index) in server"><li>{{info.label}}: {{info.text}}</li></template>
    </ul>
    <div class="dialog-padding"></div>
   </div>

   <p class="about-header">{{i18n('Library')}}</p>
   <ul>
    <template v-for="(item, index) in library"><li>{{item}}</li></template>
   </ul>
   <v-menu bottom v-if="!scanning">
    <v-btn slot="activator" flat>{{i18n('Rescan')}} <v-icon>arrow_drop_down</v-icon></v-btn>
    <v-list>
     <template v-for="(item, index) in rescans">
      <v-list-tile @click="initiateScan(item.prompt, item.command)">
       <v-list-tile-title>{{item.title}}</v-list-tile-title>
      </v-list-tile>
     </template>
    </v-list>
   </v-menu>
   <div class="dialog-padding"></div>

   <p class="about-header">{{i18n('Plugins')}}</p>
   <p v-if="updates.plugins.length>0">{{i18n('The following plugins have updates available:')}}</p>
   <p v-else-if="undefined!=updates.error">{{updates.error}}</p>
   <p v-else>{{i18n('All plugins up to date.')}}</p>
   <ul v-if="updates.plugins.length>0">
    <template v-for="(plug, index) in updates.plugins"><li v-if="plug">{{plug.title}}</li></template>
   </ul>
   <v-btn v-if="updates.plugins.length>0" @click="serverSettings('SETUP_PLUGINS')" flat>{{i18n('Server Settings')}}</v-btn>
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
   <v-btn @click="openWindow('https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=2X2CTDUH27V9L&source=url')" flat><img class="svg-img" :src="'paypal' | svgIcon(darkUi)"></img>&nbsp;{{i18n('Donate')}}</v-btn>

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
            rescans: [ {title:undefined, prompt:undefined, command: ["wipecache"]},
                       {title:undefined, prompt:undefined, command: ["rescan"]},
                       {title:undefined, prompt:undefined, command: ["rescan", "playlists"]} ],
            scanning: false,
            updates: { plugins: [], error:undefined }
        }
    },
    mounted() {
        bus.$on('info.open', function(act) {
            lmsCommand("", ["material-skin", "info"]).then(({data}) => {
                if (data && data.result && data.result.info) {
                    var inf = JSON.parse(data.result.info);
                    if (inf && inf.server) {
                        this.server=inf.server;
                        this.server.push({ label: i18n('Material Skin'), text:""+LMS_MATERIAL_REVISION});
                    }
                }
            });
            this.update();
            this.timer = setInterval(function () {
                this.update();
            }.bind(this), 2000);
            this.show = true;
            axios.get(location.protocol+'//'+location.hostname+(location.port ? ':'+location.port : '')+"/updateinfo.json?x=time"+(new Date().getTime())).then((resp) => {
                this.updates = eval(resp.data);
                if (!this.updates || !this.updates.plugins) {
                    this.updates = { plugins: [] };
                } else if (this.updates && this.updates.plugins && 1==this.updates.plugins.length && null==this.updates.plugins[0]) {
                    this.updates.plugins=[];
                    this.updates.error=i18n('Failed to determine plugin status.');
                }
            }).catch(err => {
                this.updates.error=i18n('Failed to determine plugin status.');
                logError(err);
            });
        }.bind(this));

        bus.$on('langChanged', function() {
            this.initItems();
        }.bind(this));
        this.initItems();
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
        update() {
            lmsCommand("", ["serverstatus", 0, LMS_MAX_PLAYERS]).then(({data}) => {
                if (data && data.result) {
                    var prevStrengths={};
                    this.players.forEach(p=>{
                        if (p.sigStrength>0) {
                            prevStrengths[p.id]=p.sigStrength;
                        }
                    });
                    this.players = [];
                    if (data.result.players_loop) {
                         data.result.players_loop.forEach(i => {
                            var info = [ i18n("Model: %1", i.modelname),
                                         i18n("Type: %1", i.model),
                                         i18n("Firmware: %1", i.firmware),
                                         i18n("IP: %1", i.ip.split(':')[0]),
                                         i18n("MAC Address: %1", i.playerid),
                                         "" ];
                            if (undefined!=prevStrengths[i.playerid]) {
                                info[5]=i18n("Signal Strength: %1%", prevStrengths[i.playerid]);
                            }

                            this.players.push({name: i.name, id: i.playerid, info: info});
                            if ("group" != i.model) {
                                lmsCommand(i.playerid, ["signalstrength" ,"?"]).then(({data}) => {
                                    if (data && data.result && data.result._signalstrength>0) {
                                        this.players.forEach(p=>{
                                            if (p.id==data.params[0]) {
                                                p.info[5]=i18n("Signal Strength: %1%", data.result._signalstrength);
                                                p.sigStrength = data.result._signalstrength;
                                            }
                                        });
                                    }
                                });
                            }
                        });
                    }

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
        i18n(str) {
            if (this.show) {
                return i18n(str);
            } else {
                return str;
            }
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
            bus.$emit('dialogOpen', 'info', val);
        }
    },
    computed: {
            darkUi () {
            return this.$store.state.darkUi
        }
    },
    filters: {
        svgIcon: function (name, dark) {
            return "svg/"+name+"?c="+(dark ? LMS_DARK_SVG : LMS_LIGHT_SVG)+"&r="+LMS_MATERIAL_REVISION;
        }
    }
})

