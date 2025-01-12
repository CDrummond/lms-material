/**
 * LMS-Material
 *
 * Copyright (c) 2018-2024 Craig Drummond <craig.p.drummond@gmail.com>
 * MIT license.
 */
'use strict';

Vue.component('lms-randommix', {
    template: `
<v-dialog v-model="show" v-if="show" scrollable width="600">
 <v-card>
  <v-card-text>
   <v-text-field v-if="!controlMix" :label="i18n('Name')" v-model="name" type="string"></v-text-field>
   <v-select :items="mixes" :label="i18n('Mix Type')" v-model="chosenMix" item-text="label" item-value="key"></v-select>
   <div class="dialog-main-list">
   <v-select chips deletable-chips multiple :items="genres" :label="i18n('Selected Genres')" v-model="chosenGenres">
    <v-list-tile slot="prepend-item" @click="toggleGenres()">
     <v-list-tile-action><v-icon>{{selectAllIcon}}</v-icon></v-list-tile-action>
     <v-list-tile-title>{{i18n('Select All')}}</v-list-tile-title>
    </v-list-tile>
    <v-divider slot="prepend-item"></v-divider>
    <template v-slot:selection="{ item, index }">
      <v-chip v-if="(index < 5) || chosenGenres.length==6" close @input="chosenGenres.splice(index, 1)">
        <span>{{ item }}</span>
      </v-chip>
      <span v-if="index == 5 && chosenGenres.length>6" class="subtext">{{i18n("(+%1 others)", chosenGenres.length - 5) }}</span>
    </template>
   </v-select>
   <v-select v-if="libraries.length>1 && showAll" menu-props="auto" :items="libraries" :label="i18n('Library')" v-model="library" item-text="name" item-value="id"></v-select>
   <v-checkbox v-if="showAll" v-model="continuous" :label="i18n('Continuous')"></v-checkbox>
   <v-text-field v-if="showAll" :label="i18n('Historic track count')" v-model="oldTracks" type="number"></v-text-field>
   <v-text-field v-if="showAll" :label="i18n('Upcoming track count')" v-model="newTracks" type="number"></v-text-field>
   </div>
  </v-card-text>
  <v-card-actions>
   <v-menu top v-model="showMenu">
    <v-btn icon slot="activator" style="position:absolute; bottom:8px"><v-icon>more_vert</v-icon></v-btn>
    <v-list>
     <v-list-tile @click.native="showAll=!showAll">
      <v-list-tile-avatar><v-icon>{{showAll ? 'check_box' : 'check_box_outline_blank'}}</v-icon></v-list-tile-avatar>
      <v-list-tile-content><v-list-tile-title>{{i18n('All options')}}</v-list-tile-title></v-list-tile-content>
     </v-list-tile>
     <v-list-tile @click.native="togglePin">
      <v-list-tile-avatar><img class="svg-img" :src="ACTIONS[pinned ? UNPIN_ACTION : PIN_ACTION].svg | svgIcon(darkUi)"></img></v-list-tile-avatar>
      <v-list-tile-content><v-list-tile-title>{{ACTIONS[pinned ? UNPIN_ACTION : PIN_ACTION].title}}</v-list-tile-title></v-list-tile-content>
     </v-list-tile>
    </v-list>
   </v-menu>
   <v-spacer></v-spacer>

   <table v-if="narrow" style="text-align: center">
    <tr>
     <td><v-btn flat v-if="controlMix" @click.native="stop()" v-bind:class="{'disabled':!isActive}">{{i18n('Stop')}}</v-btn></td>
     <td><v-btn flat @click.native="start()">{{i18n('Start')}}</v-btn></td>
    </tr>
    <tr style="height:16px"></tr>
    <tr v-if="queryParams.altBtnLayout">
     <td><v-btn flat @click.native="save()">{{i18n('Save')}}</v-btn></td>
     <td><v-btn flat @click.native="close()">{{i18n('Cancel')}}</v-btn></td>
    </tr>
    <tr v-else>
     <td><v-btn flat @click.native="close()">{{i18n('Cancel')}}</v-btn></td>
     <td><v-btn flat @click.native="save()">{{i18n('Save')}}</v-btn></td>
    </tr>
   </table>
   <div v-else-if="queryParams.altBtnLayout">
    <v-btn flat v-if="controlMix" @click.native="stop()" v-bind:class="{'disabled':!isActive}">{{i18n('Stop')}}</v-btn>
    <v-btn flat @click.native="start()">{{i18n('Start')}}</v-btn>
    <v-btn flat @click.native="save()">{{i18n('Save')}}</v-btn>
    <v-btn flat @click.native="close()">{{i18n('Cancel')}}</v-btn>
   </div>
   <div v-else>
    <v-btn flat @click.native="close()">{{i18n('Cancel')}}</v-btn>
    <v-btn flat @click.native="save()">{{i18n('Save')}}</v-btn>
    <v-btn flat v-if="controlMix" @click.native="stop()" v-bind:class="{'disabled':!isActive}">{{i18n('Stop')}}</v-btn>
    <v-btn flat @click.native="start()">{{i18n('Start')}}</v-btn>
   </div>
  </v-card-actions>
 </v-card>
</v-dialog>
`,
    props: [],
    data() {
        return {
            show: false,
            showAll: false,
            showMenu: false,
            name: undefined,
            genres: [],
            chosenGenres: [],
            mixes: [],
            chosenMix: "tracks",
            libraries: [],
            library: undefined,
            continuous: true,
            oldTracks: 10,
            newTracks: 10,
            isWide: true,
            controlMix: false,
            isActive: false,
            pinned: false,
            narrow: false
        }
    },
    computed: {
        selectAllIcon () {
            if (this.chosenGenres.length==this.genres.length) {
                return "check_box";
            }
            if (this.chosenGenres.length>0) {
                return "indeterminate_check_box";
            }
            return "check_box_outline_blank";
        },
        darkUi () {
            return this.$store.state.darkUi
        }
    },
    mounted() {
        bus.$on('rndmix.open', function(existingName, controlMix, playMix) {
            this.controlMix = undefined!=controlMix && controlMix;
            this.name = undefined;
            this.origName = undefined;
            this.pinnedItemName = undefined;
            this.showAll = getLocalStorageBool("rndmix.showAll", false);
            this.playerId = this.$store.state.player.id;
            this.chosenMix = "track";
            this.mixes=[{key:"track", label:i18n("Tracks")},
                        {key:"album", label:lmsOptions.supportReleaseTypes ? i18n("Releases") : i18n("Albums")},
                        {key:"contributor", label:i18n("Artists")},
                        {key:"year", label:i18n("Years")}];
            if (LMS_VERSION>=90000) {
                this.mixes.push({key:"work", label:i18n("Works")});
            }

            if (undefined!=existingName) {
                this.loadSavedMixParams(existingName, playMix);
                this.origName = existingName;
            } else {
                if (this.controlMix) {
                    lmsCommand(this.playerId, ["randomplayisactive"]).then(({data}) => {
                        if (data && data.result && !isEmpty(data.result._randomplayisactive)) {
                            this.chosenMix = data.result._randomplayisactive;
                            this.isActive = true;
                        } else {
                            this.isActive = false;
                            this.chosenMix = "track";
                        }
                        this.initGenres();
                        this.initLibraries();
                        this.initConfig();
                    });
                } else {
                    this.initGenres();
                    this.initLibraries();
                    this.initConfig();
                }
            }
            this.pinned = lmsOptions.randomMixDialogPinned;
            this.checkWidth();
        }.bind(this));
        bus.$on('noPlayers', function() {
            this.show=false;
        }.bind(this));
        bus.$on('closeDialog', function(dlg) {
            if (dlg == 'rndmix') {
                this.show=false;
            }
        }.bind(this));
        this.isWide = window.innerWidth>=450;
        bus.$on('windowWidthChanged', function() {
            this.isWide = window.innerWidth>=450;
        }.bind(this));
        bus.$on('pinnedChanged', function(item, state) {
            if (this.show && item.id==START_RANDOM_MIX_ID) {
                this.pinned = state;
                this.pinnedItemName = state ? item.title : undefined;
            }
        }.bind(this));
        bus.$on('windowWidthChanged', function() {
            if (this.show) {
                this.checkWidth();
            }
        }.bind(this));
    },
    methods: {
        checkWidth() {
            this.narrow=window.innerWidth<=(this.controlMix ? 500 : 400);
        },
        initGenres() {
            this.chosenGenres = [];
            this.genres = [];
            // If player is set to a virtual library then set to default, read genre list, and then reset.
            // Otherwise just read genre list
            // NOTE: Not 100% sure if this is required, but does no harm?
            lmsCommand(this.playerId, ["libraries", "getid"]).then(({data}) => {
                let playerLibId = undefined==data.result.id ? LMS_DEFAULT_LIBRARY : (""+data.result.id);
                if (!LMS_DEFAULT_LIBRARIES.has(playerLibId)) {
                    lmsCommand(this.playerId, ["material-skin-client", "set-lib", "id:"+LMS_DEFAULT_LIBRARY]).then(({datax}) => {
                        this.getGenreList(playerLibId);
                    });
                } else {
                    this.getGenreList(undefined);
                }
            });
        },
        getGenreList(playerLibId) {
            lmsList(this.playerId, ["randomplaygenrelist"], undefined, 0, 2500).then(({data}) => {
                if (undefined!=playerLibId) {
                    // Re-set playerId
                    lmsCommand(this.playerId, ["material-skin-client", "set-lib", "id:"+playerLibId])
                }
                if (data && data.result && data.result.item_loop) {
                    let used = new Set();
                    for (let idx=0, loop=data.result.item_loop, loopLen=loop.length; idx<loopLen; ++idx) {
                        let item = loop[idx];
    
                        if (undefined!=item.checkbox && item.actions && item.actions.on && item.actions.on.cmd) {
                            let name = item.actions.on.cmd[1];
                            if (!used.has(name)) {
                                this.genres.push(name);
                                used.add(name);
                                if (item.checkbox==1) {
                                    this.chosenGenres.push(name);
                                }
                            }
                        }
                    }
                }
                this.show=true;
            });
        },
        initLibraries() {
            lmsList(this.playerId, ["randomplaylibrarylist"], undefined, 0, 500).then(({data}) => {
                if (data && data.result && data.result.item_loop && data.result.item_loop.length>0) {
                    this.libraries = [];
                    this.library = undefined;
                    for (var i=0, len=data.result.item_loop.length; i<len; ++i) {
                        var id = data.result.item_loop[i].actions.do.cmd[1];
                        if (undefined!=id && (""+id).length>2) {
                            this.libraries.push({name:data.result.item_loop[i].text.replace(SIMPLE_LIB_VIEWS, ""), id:""+id});
                            if (parseInt(data.result.item_loop[i].radio)==1) {
                                this.library = ""+id;
                            }
                        }
                    }
                    this.libraries.sort(nameSort);
                    this.libraries.unshift({name: i18n("All"), id:LMS_DEFAULT_LIBRARY});
                    if (undefined==this.library || LMS_DEFAULT_LIBRARIES.has(this.library)) {
                        this.library = LMS_DEFAULT_LIBRARY;
                    }
                }
            });
        },
        initConfig() {
            lmsCommand("", ["pref", "plugin.randomplay:continuous", "?"]).then(({data}) => {
                if (data && data.result && data.result._p2 != null) {
                    this.continuous = 1 == parseInt(data.result._p2);
                }
            });
            lmsCommand("", ["pref", "plugin.randomplay:newtracks", "?"]).then(({data}) => {
                if (data && data.result && data.result._p2 != null) {
                    this.newTracks = parseInt(data.result._p2);
                }
            });
            lmsCommand("", ["pref", "plugin.randomplay:oldtracks", "?"]).then(({data}) => {
               if (data && data.result && data.result._p2 != null) {
                    this.oldTracks = parseInt(data.result._p2);
                }
            });
        },
        loadSavedMixParams(name, andPlay) {
            this.genres = [];
            this.chosenGenres = [];
            this.oldTracks = this.newTracks = 10;
            this.continuous = true;
            this.chosenMix = "tracks";
            this.library = LMS_DEFAULT_LIBRARY;
            this.libraries = [];

            let loaded = 0;
            lmsCommand("", ["genres", 0, 2500]).then(({data}) => {
                if (data && data.result && data.result && data.result.genres_loop) {
                    for (let i=0, list=data.result.genres_loop, len=list.length; i<len; ++i) {
                        this.genres.push(list[i].genre);
                    }
                }
                loaded++;
                if (andPlay && 3==loaded) {
                    this.start();
                }
            });
            lmsList("", ["libraries"]).then(({data}) => {
                if (data && data.result && data.result.folder_loop && data.result.folder_loop.length>0) {
                    for (var i=0, list=data.result.folder_loop, len=list.length; i<len; ++i) {
                        list[i].name = list[i].name.replace(SIMPLE_LIB_VIEWS, "");
                        this.libraries.push(list[i]);
                    }
                    this.libraries.sort(nameSort);
                    this.libraries.unshift({name: i18n("All"), id:LMS_DEFAULT_LIBRARY});
                }
                loaded++;
                if (andPlay && 3==loaded) {
                    this.start();
                }
            });
            lmsCommand("", ["material-skin", "rndmix", "name:"+name, "act:read"]).then(({data}) => {
                if (data && data.result && data.result) {
                    this.name = name;
                    if (undefined!=data.result.mix) {
                        this.chosenMix = data.result.mix;
                    }
                    if (undefined!=data.result.genres) {
                        this.chosenGenres = data.result.genres.split(",");
                    }
                    if (this.chosenGenres.length==0 || this.chosenGenres.length==this.genres.length) {
                        this.chosenGenres = [].concat(this.genres);
                    }
                    if (undefined!=data.result.continuous) {
                        this.continuous = 1==parseInt(data.result.continuous);
                    }
                    if (undefined!=data.result.oldtracks) {
                        this.oldTracks = parseInt(data.result.oldtracks);
                        if (this.oldTracks<1 || this.oldTracks>1000) {
                            this.oldTracks = 10;
                        }
                    }
                    if (undefined!=data.result.newtracks) {
                        this.newTracks = parseInt(data.result.newtracks);
                        if (this.newTracks<1 || this.newTracks>1000) {
                            this.newTracks = 10;
                        }
                    }
                    if (undefined!=data.result.library) {
                        this.library = data.result.library;
                    }
                    if (undefined==this.library || LMS_DEFAULT_LIBRARIES.has(this.library)) {
                        this.library = LMS_DEFAULT_LIBRARY;
                    }
                    if (andPlay) {
                        loaded++;
                        if (3==loaded) {
                            this.start();
                        }
                    } else {
                        this.show=true;
                    }
                }
            });
        },
        close() {
            this.show=false;
            setLocalStorageVal("rndmix.showAll", this.showAll);
        },
        start() {
            this.saveSettings(true);
        },
        saveSettings(activateMix) {
            this.close();
            lmsCommand("", ["pref", "plugin.randomplay:continuous", this.continuous ? 1 : 0]);
            lmsCommand("", ["pref", "plugin.randomplay:newtracks", this.newTracks]);
            lmsCommand("", ["pref", "plugin.randomplay:oldtracks", this.oldTracks]);
            let libId = this.library;
            if (libId==LMS_DEFAULT_LIBRARY && LMS_VERSION<80502) {
                libId=LMS_DEFAULT_LIBRARY_PREV;
            }
            lmsCommand(this.playerId, ["randomplaychooselibrary", libId]).then(({data}) => {
                if (this.chosenGenres.length==0) {
                    lmsCommand(this.playerId, ["randomplaygenreselectall", "0"]).then(({data}) => {
                        if (activateMix) {
                            this.startMix();
                        }
                    });
                } else if (this.chosenGenres.length==this.genres.length) {
                    lmsCommand(this.playerId, ["randomplaygenreselectall", "1"]).then(({data}) => {
                        if (activateMix) {
                            this.startMix();
                        }
                    });
                } else {
                    lmsCommand(this.playerId, ["randomplaygenreselectall", "0"]).then(({data}) => {
                        this.addGenre(activateMix);
                    });
                }
            });
        },
        startMix() {
            lmsCommand(this.playerId, ["randomplay", this.chosenMix]).then(({data}) => {
                bus.$emit('refreshStatus');
            });
        },
        stop() {
            if (this.isActive) {
                this.close();
                lmsCommand(this.playerId, ["randomplay", "disable"]);
            }
        },
        save() {
            let name = this.name ? this.name.trim() : "";
            let replace = "?<>\\:*|/";
            for (let r=0, len=replace.length; r<len; ++r) {
                name = name.replaceAll(replace[r], "_");
            }
            let remove = ";\"'\t\n";
            for (let r=0, len=remove.length; r<len; ++r) {
                name = name.replaceAll(remove[r], "");
            }
            if (isEmpty(name)) {
                if (isEmpty(this.origName)) {
                    this.saveSettings(false);
                }
                return;
            }
            this.name = name;
            lmsCommand("", ["material-skin", "rndmix", "act:save",
                            "name:"+name,
                            "mix:"+this.chosenMix,
                            "genres:"+(this.chosenGenres.length==this.genres.length ? "" : this.chosenGenres.join(",")),
                            "continuous:"+(this.continuous ? 1 : 0),
                            "oldtracks:"+this.oldTracks,
                            "newtracks:"+this.newTracks,
                            "library:"+this.library]).then(({data}) => {
                if (this.origName!=undefined && name!=this.origName) {
                    lmsCommand("", ["material-skin", "rndmix", "act:delete", "name:"+this.origName]).then(({data}) => {
                        bus.$emit('refreshList');
                        this.close();
                    });
                } else {
                    bus.$emit('refreshList');
                    this.close();
                }
            });
        },
        addGenre(activateMix) {
            if (0==this.chosenGenres.length) {
                if (activateMix) {
                    this.startMix();
                }
            } else {
                lmsCommand(this.playerId, ["randomplaychoosegenre", this.chosenGenres.shift(), "1"]).then(({data}) => {
                    this.addGenre(activateMix);
                });
            }
        },
        toggleGenres() {
            if (this.chosenGenres.length==this.genres.length) {
                this.chosenGenres = [];
            } else {
                this.chosenGenres = this.genres.slice();
            }
        },
        i18n(str, val) {
            if (this.show) {
                return i18n(str, val);
            } else {
                return str;
            }
        },
        togglePin() {
            bus.$emit('browse-pin', {id: START_RANDOM_MIX_ID, title: undefined==this.pinnedItemName ? i18n("Random Mix") : this.pinnedItemName, svg: "dice-play"}, !this.pinned);
        }
    },
    watch: {
        'show': function(val) {
            this.$store.commit('dialogOpen', {name:'rndmix', shown:val});
        }
    },
    filters: {
        svgIcon: function (name, dark) {
            return "/material/svg/"+name+"?c="+(dark ? LMS_DARK_SVG : LMS_LIGHT_SVG)+"&r="+LMS_MATERIAL_REVISION;
        }
    }
})
