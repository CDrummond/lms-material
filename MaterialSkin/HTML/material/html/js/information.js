/**
 * LMS-Material
 *
 * Copyright (c) 2018 Craig Drummond <craig.p.drummond@gmail.com>
 * MIT license.
 */

Vue.component('lms-information-dialog', {
    template: `
<v-dialog v-model="show" scrollable fullscreen>
 <v-card>
  <v-card-title class="settings-title">
   <v-toolbar color="primary" dark app class="lms-toolbar">
    <v-btn flat icon @click.native="close()"><v-icon>arrow_back</b-icon></v-btn>
    <v-toolbar-title>{{title}}</v-toolbar-title>
   </v-toolbar>
  </v-card-title>
  <v-card-text class="settings-list">
   <p class="about-header">{{i18n('Library')}}</p>
   <ul>
    <template v-for="(item, index) in library"><li>{{item}}</li></template>
   </ul>
   <v-menu bottom left v-if="!scanning">
    <v-btn slot="activator" flat>{{i18n('Rescan')}} <v-icon>arrow_drop_down</v-icon></v-btn>
    <v-list>
     <template v-for="(item, index) in rescans">
      <v-list-tile @click="initiateScan(item.prompt, item.command)">
       <v-list-tile-title>{{item.title}}</v-list-tile-title>
      </v-list-tile>
     </template>
    </v-list>
   </v-menu>
   <div style="height:24px"></div>

   <p class="about-header">{{i18n('Players')}}</p>
   <ul>
    <template v-for="(item, index) in players">
     <li>{{item.name}}
      <ul>
       <template v-for="(info, index) in item.info"><li>{{info}}</li></template>
      </ul>
     </li>
    </template>
   </ul>
   <div style="height:24px"></div>

   <p class="about-header">{{i18n('Plugins')}}</p>
   <p v-if="updates.plugins.length>0">{{i18n('The following plugins have updates available:')}}</p>
   <p v-else-if="undefined!=updates.error">{{updates.error}}</p>
   <p v-else>{{i18n('All plugins up to date.')}}</p>
   <ul>
    <template v-for="(info, index) in updates.plugins"><li>{{info.title}}</li></template>
   </ul>
   <v-btn v-if="updates.plugins.length>0" href="../Default/settings/index.html" flat>{{i18n('Server Settings')}}</v-btn>
  </v-card-text>
 </v-card>
</v-dialog>
`,
    props: [],
    data() {
        return {
            show: false,
            title: "Information", // i18n not rquired, as should not be seen
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
        bus.$on('toolbarAction', function(act) {
            if (act==TB_INFO.id) {
                bus.$emit('dialog', 'information', true);
                this.update();
                this.timer = setInterval(function () {
                    this.update();
                }.bind(this), 2000);
                this.show = true;
                axios.get(location.protocol+'//'+location.hostname+(location.port ? ':'+location.port: '')+"/updateinfo.json?=time"+(new Date().getTime())).then(function (resp) {
                    this.updates = eval(resp.data);
                }).catch(err => {
                    this.updates.error=i18n('Failed to determine plugin status.');
                    logError(err);
                });
            }
        }.bind(this));

        bus.$on('closeDialog', function() {
            if (this.show) {
                this.close();
            }
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
                    this.players = [];
                    if (data.result.players_loop) {
                         data.result.players_loop.forEach(i => {
                            var info = [ i18n("Model: %1", i.modelname),
                                         i18n("Type: %1", i.model),
                                         i18n("Firmware: %1", i.firmware),
                                         i18n("IP: %1", i.ip.split(':')[0]),
                                         i18n("Mac Address: %1", i.playerid) ];

                            this.players.push({name: i.name, info: info});
                        });
                    }

                    this.scanning = undefined==data.result.lastscan || 1==data.result.scanning;
                    this.library=[ i18n("Total genres: %1", data.result["info total genres"]),
                                   i18n("Total artists: %1", data.result["info total artists"]),
                                   i18n("Total albums: %1", data.result["info total albums"]),
                                   i18n("Total songs: %1", data.result["info total songs"]),
                                   i18n("Total duration: %1", formatSeconds(data.result["info total duration"])),
                                   i18n("Last scan: %1", this.scanning ? i18n("In progress") : formatDate(data.result.lastscan))];

                    if (data.result.lastscanfailed) {
                        this.library.push("Last scan failure: %1", data.result.lastscanfailed);
                    }

                    this.title=i18n("Logitech Media Server v%1", data.result.version);
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
    }
})

