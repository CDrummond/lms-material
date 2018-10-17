/*
 * LMS-Material
 *
 * Copyright (c) 2018 Craig Drummond <craig.p.drummond@gmail.com>
 * MIT license.
 */

const PLAY_ACTION             = {title:"Play now",                     cmd:"load",       icon:"play_circle_outline"};
const ADD_ACTION              = {title:"Append to queue",              cmd:"add",        icon:"add_circle_outline"};
const ADD_RANDOM_ALBUM_ACTION = {title:"Append random album to queue", cmd:"random",     icon:"help_outline"};
const RENAME_PL_ACTION        = {title:"Rename",                       cmd:"rename-pl",  icon:"edit"};
const RENAME_FAV_ACTION       = {title:"Rename",                       cmd:"rename-fav", icon:"edit"};
const DELETE_ACTION           = {title:"Delete",                       cmd:"delete",     icon:"delete"};
const ADD_TO_FAV_ACTION       = {title:"Add to favourites",            cmd:"addfav",     icon:"favorite_border"};
const REMOVE_FROM_FAV_ACTION  = {title:"Remove from favourites",       cmd:"removefav",  icon:"delete_outline"};
const DIVIDER                 = {divider:true};
const TERM_PLACEHOLDER        = "-XXXXXX-";
const ALBUM_SORT_PLACEHOLDER  = "-XXXASXXX-";
const ARTIST_ALBUM_SORT_PLACEHOLDER = "-XXXAASXXX-";

var lmsBrowse = Vue.component("LmsBrowse", {
    template: `
        <div class="lms-list-page">
          <v-dialog v-model="dialog.show" persistent max-width="500px">
            <v-card>
              <v-card-text>
                <span v-if="dialog.title">{{dialog.title}}</span>
                <v-container grid-list-md>
                  <v-layout wrap>
                    <v-flex xs12>
                      <v-text-field :label="dialog.hint" v-model="dialog.value"></v-text-field>
                    </v-flex>
                  </v-layout>
                </v-container>
              </v-card-text>
              <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn flat @click.native="dialog.show = false; dialogResponse(false);">{{undefined===dialog.cancel ? 'Cancel' : dialog.cancel}}</v-btn>
                <v-btn flat @click.native="dialogResponse(true);">{{undefined===dialog.ok ? 'OK' : dialog.ok}}</v-btn>
              </v-card-actions>
            </v-card>
          </v-dialog>
          <v-snackbar v-model="snackbar.show" :multi-line="true" :timeout="2500" :color="snackbar.color" top>{{ snackbar.msg }}</v-snackbar>
          <v-card v-if="headerTitle" class="subtoolbar">
            <v-layout>
              <v-btn flat icon @click="goHome()" class="toolbar-button"><v-icon>home</v-icon></v-btn>
              <v-btn flat icon @click="goBack()" class="toolbar-button"><v-icon>arrow_back</v-icon></v-btn>
              <v-layout row wrap class="subtoolbar-title">
                <v-flex class="xs12 toolbar-title">{{headerTitle}}</v-flex>
                <div class="toolbar-subtitle">{{headerSubTitle}}</div>
              </v-layout>
              <v-spacer></v-spacer>
              <template v-for="(action, index) in actions">
                <v-btn flat icon @click.stop="headerAction(action.cmd)" class="toolbar-button"><v-icon>{{action.icon}}</v-icon></v-btn>
              </template>
            </v-layout>
          </v-card>
          <div v-if="headerTitle" class="subtoolbar-pad"></div>
          <v-progress-linear v-if="fetchingItems" :indeterminate="true"></v-progress-linear>
          <v-list>
            <template v-for="(item, index) in items">
              <v-subheader v-if="item.header">{{ item.header }}</v-subheader>

              <v-divider v-else-if="index>0 && !items[index-1].header && (undefined===item.separateArtists || item.separateArtists==separateArtists)" :inset="item.inset"></v-divider>

              <p v-if="item.type=='text'" class="browse-text">
                {{item.title}}
              </p>
              <v-list-tile v-else-if="!item.header && (undefined===item.separateArtists || item.separateArtists==separateArtists)" avatar @click="browse(item)" :key="item.url">
                <v-list-tile-avatar v-if="item.image" :tile="true">
                  <img v-lazy="item.image">
                </v-list-tile-avatar>
                <v-list-tile-avatar v-else-if="item.icon" :tile="true">
                  <v-icon>{{item.icon}}</v-icon>
                </v-list-tile-avatar>

                <v-list-tile-content v-if="item.type!='search' && item.type!='xmlsearch'">
                  <v-list-tile-title>{{item.title}}</v-list-tile-title>
                  <v-list-tile-sub-title>{{item.subtitle}}</v-list-tile-sub-title>
                </v-list-tile-content>

                <v-list-tile-content v-else>
                  <v-text-field single-line clearable :label="item.title" v-on:keyup.enter="search($event, item)"></v-text-field>
                </v-list-tile-content>
                
                <v-list-tile-action v-if="item.actions && 1===item.actions.length" @click.stop="itemAction(item.actions[0].cmd, item)">
                  <v-btn icon ripple>
                    <v-icon>{{item.actions[0].icon}}</v-icon>
                  </v-btn>
                </v-list-tile-action>
                <v-list-tile-action v-if="item.actions && item.actions.length>1" @click.stop=""> <!-- @click.stop stops even going to list item (navigate) -->
                  <v-menu offset-y>
                    <v-btn icon ripple slot="activator">
                      <v-icon>more_vert</v-icon>
                    </v-btn>
                    <v-list>
                      <template v-for="(action, index) in item.actions">
                        <v-divider v-if="action.divider"></v-divider>
                        <v-list-tile v-else @click="itemAction(action.cmd, item)">
                          <v-list-tile-title><v-icon>{{action.icon}}</v-icon>&nbsp;&nbsp;{{i18n(action.title)}}</v-list-tile-title>
                        </v-list-tile>
                      </template>
                    </v-list>
                  </v-menu>
                </v-list-tile-action>
              </v-list-tile>
            </template>
          </v-list>
        </div>
      `,
    props: [],
    data() {
        return {
            items: [],
            fetchingItems: false,
            snackbar:{ show: false, msg: undefined},
            dialog: { show:false, title:undefined, hint:undefined, ok: undefined, cancel:undefined, command:undefined},
            separateArtists: false
        }
    },
    created() {
        this.history=[];
        this.fetchingItems = false;
        this.current = null;
        this.headerTitle = null;
        this.headerSubTitle=null;
        this.actions=[];
        this.artistImages=false;
        this.previousScrollPos=0;
        this.initItems();

        // As we scroll the whole page, we need to remember the current position when changing to (e.g.) queue
        // page, so that it can be restored when going back here.
        bus.$on('routeChange', function(from, to, pos) {
            if (to=='/browse') {
                this.$nextTick(function () {
                    document.documentElement.scrollTop=this.previousScrollPos>0 ? this.previousScrollPos : 0;
                });
            } else if (from=='/browse') {
                this.previousScrollPos = pos;
            }
        }.bind(this));
        this.$nextTick(function () {
            document.documentElement.scrollTop=0;
        });

        bus.$on('langChanged', function() {
            this.initItems();
        }.bind(this));
    },
    methods: {
        initItems() {
        this.top = [
            { header: i18n("My Music"), url: "top:/mmh" },
            {
                title: i18n("Artists"),
                command: ["artists"],
                params: [],
                icon: "group",
                type: "group",
                url: "top:/ar",
            },
            {
                title: i18n("Album Artists"),
                command: ["artists"],
                params: ["role_id:ALBUMARTIST"],
                icon: "group",
                type: "group",
                url: "top:/aar",
                separateArtists: true
            },
            {
                title: i18n("Albums"),
                command: ["albums"],
                params: ["tags:jlya", "sort:"+ALBUM_SORT_PLACEHOLDER],
                icon: "album",
                type: "group",
                url: "top:/al"
            },
            {
                title: i18n("Genres"),
                command: ["genres"],
                icon: "label",
                type: "group",
                url: "top:/ge"
            },
            {
                title: i18n("Playlists"),
                command: ["playlists"],
                icon: "list",
                type: "group",
                url: "top:/pl"
            },
            {
                title: i18n("Search"),
                command: ["search"],
                params: ["tags:jlyAdt", "extended:1", "term:"+TERM_PLACEHOLDER],
                icon: "search",
                type: "search",
                url: "top:/sr"
            },
            {
                title: i18n("More"),
                icon: "more_horiz",
                url: "top:/more",
                type: "group",
            },
            { header: i18n("Other Music"), id:"omh" },
            {
                title: i18n("Radio"),
                command: ["radios"],
                params: ["want_url:1"],
                icon: "radio",
                type: "group",
                url: "top:/ra"
            },
            {
                title: i18n("Favourites"),
                command: ["favorites", "items"],
                params: ["want_url:1"],
                icon: "favorite",
                type: "favorites",
                batchsize: 250,
                url: "top:/fa"
            },
            {
                title: i18n("Apps"),
                command: ["apps"],
                params: ["want_url:1"],
                icon: "apps",
                type: "group",
                url: "top:/ap"
            }
        ];
        this.other = [
            {
                title: i18n("Compilations"),
                command: ["albums"],
                params: ["compilation:1", "tags:jlya", "sort:"+ALBUM_SORT_PLACEHOLDER],
                icon: "album",
                type: "group",
                url: "more:/co",
            },
            {
                title: i18n("Years"),
                command: ["years"],
                icon: "date_range",
                type: "group",
                url: "more:/yr"
            },
            {
                title: i18n("New Music"),
                command: "albums",
                params: ["tags:jlya", "sort:new"],
                icon: "new_releases",
                type: "group",
                url: "more:/nm"
            },
            /*
            {
                title: i18n("Random Mix"),
                command: ["random-mix"],
                icon: "shuffle",
                type: "group",
                url: "more:/rm"
            },*/
            ];
            if (this.history.length<1) {
                this.items = this.top;
                this.listSize = this.top.length;
            }
        },
        playerId() {
            return this.$store.state.player ? this.$store.state.player.id : "";
        },
        showMessage(msg, color) {
            this.snackbar = {msg: msg ? msg : i18n("Something went wrong!"), show: true, color: undefined==color ? 'error' : color };
        },
        fetchItems(item, params) {
            this.fetchingItems = true;
            this.current = item;
            //console.log("FETCH command:" + item.command + " params:" + params + " batchsize:" + item.batchsize);
            lmsList(this.playerId(), item.command, params, 0, item.batchsize).then(({data}) => {
                this.fetchingItems = false;
                var resp = parseBrowseResp(data, item, this.artistImages);

                var prev = {};
                prev.items = this.items;
                prev.listSize = this.listSize;
                prev.current = this.current;
                prev.headerTitle = this.headerTitle;
                prev.headerSubTitle = this.headerSubTitle;
                prev.actions = this.actions;
                prev.pos=document.documentElement.scrollTop;
                this.history.push(prev);
                this.headerTitle=item.title;
                
                if (data && data.result) {
                    this.listSize = data.result.count;
                } else {
                    this.listize = 0;
                }
                this.items=resp.items;
                this.actions=resp.actions;
                if (resp.subtitle) {
                    this.headerSubTitle=resp.subtitle;
                } else {
                    this.headerSubTitle=i18n("Total: %1", this.listSize);
                }
                document.documentElement.scrollTop=0;
            }).catch(err => {
                this.fetchingItems = false;
                this.showMessage();
            });
        },
        browse(item) {
            if ("group"!==item.type && "playlist"!==item.type && "favorites"!==item.type) {
                return;
            }
            if ("top:/more"===item.url) {
                var prev = {};
                prev.items = this.items;
                prev.listSize = this.listSize;
                prev.current = this.current;
                prev.headerTitle = this.headerTitle;
                prev.headerSubTitle = this.headerSubTitle;
                prev.actions = this.actions;
                prev.pos=document.documentElement.scrollTop;
                this.history.push(prev);
                this.items = this.other;
                this.headerTitle = item.title;
                this.headerSubTitle = i18n("Extra browse modes");
                this.listSize = this.items.length;
                document.documentElement.scrollTop=0;
                return;
            }
            this.fetchItems(item, this.adjustParams(item.params));
        },
        search(event, item) {
            if (this.fetchingItems) {
                return;
            }
            var params = [];
            item.params.forEach(p => { params.push(p.replace(TERM_PLACEHOLDER, event.target._value)); });
            this.fetchItems(item, params);
        },
        dialogResponse(val) {
            if (val && this.dialog.value) {
                var str = this.dialog.value.trim();
                if (str.length>1 && str!==this.dialog.hint) {
                    this.dialog.show = false;
                    var command = [];
                    this.dialog.command.forEach(p => { command.push(p.replace(TERM_PLACEHOLDER, str)); });
                    lmsCommand(this.playerId(), command).then(({datax}) => {
                        this.refreshList();
                    }).catch(err => {
                        this.showMessage(dialog.command.length>2 && dialog.command[1]==='rename' ? i18n("Renamed failed") : i18n("Failed"));
                    });
                }
            }
        },
        itemAction(act, item) {
            if (act===RENAME_PL_ACTION.cmd) {
                this.dialog = { show:true, title:i18n("Rename playlist"), hint:item.value, value:item.title, ok: i18n("Rename"), cancel:undefined,
                                command:["playlists", "rename", item.url, "newname:"+TERM_PLACEHOLDER]};
            } else if (act==RENAME_FAV_ACTION.cmd) {
                this.dialog = { show:true, title:i18n("Rename favorite"), hint:item.value, value:item.title, ok: i18n("Rename"), cancel:undefined,
                                command:["favorites", "rename", "item_id:"+item.id, "title:"+TERM_PLACEHOLDER]};
            } else if (act===DELETE_ACTION.cmd) {
                this.$confirm(i18n("Delete '%1'?", item.title), {buttonTrueText: i18n('Delete'), buttonFalseText: i18n('Cancel')}).then(res => {
                    if (res) {
                        if (item.url.startsWith("playlist_id:")) {
                            lmsCommand(this.playerId(), ["playlists", "delete", item.url]).then(({datax}) => {
                                this.refreshList();
                            }).catch(err => {
                                this.showMessage(i18n("Failed to delete playlist"));
                            });
                        }
                    }
                });
            } else if (act===ADD_TO_FAV_ACTION.cmd) {
                var url = item.url;
                if (item.url.startsWith("genre_id:")) {
                    url="db:genre.name="+encodeURI(item.title);
                } else if (item.url.startsWith("artist_id:")) {
                    url="db:contributor.name="+encodeURI(item.title);
                } else if (item.url.startsWith("album_id:")) {
                    url="db:album.name="+encodeURI(item.title);
                } else if (item.url.startsWith("year:")) {
                    url="db:year.id="+encodeURI(item.title);
                }

                lmsCommand(this.playerId(), ["favorites", "add", "url:"+url, "title:"+item.title]).then(({data})=> {
                    this.showMessage(i18n("Added to favorites!"), '');
                }).catch(err => {
                    this.showMessage(i18n("Failed to add to favorites!"));
                });
            } else if (act===REMOVE_FROM_FAV_ACTION.cmd) {
                this.$confirm(i18n("Remove '%1' from favourites?", item.title), {buttonTrueText: i18n('Remove'), buttonFalseText: i18n('Cancel')}).then(res => {
                    if (res) {
                        lmsCommand(this.playerId(), ["favorites", "delete", "item_id:"+item.id]).then(({datax}) => {
                            this.refreshList();
                        }).catch(err => {
                            this.showMessage(i18n("Failed to remove favourite"));
                        });
                    }
                });
            } else if (act===ADD_RANDOM_ALBUM_ACTION.cmd) {
                this.fetchingItems = true;
                var params = [];
                item.params.forEach(p => { params.push(p); });
                params.push("sort:random");
                lmsList(this.playerId(), ["albums"], params, 0, 1).then(({data}) => {
                    this.fetchingItems = false;
                    var resp = parseBrowseResp(data, this.current, this.artistImages);
                    if (1===resp.items.length) {
                        var item = resp.items[0];
                        var command = [];
                        if (item.url) {
                            command = ["playlistcontrol", "cmd:add", item.url];
                        } else if (item.app && item.id) {
                            command = [item.app, "playlist", act, "item_id:"+item.id];
                        }
                        this.fetchingItems = true;
                        lmsCommand(this.playerId(), command).then(({data}) => {
                            this.fetchingItems = false;
                            bus.$emit('refreshStatus');
                            this.showMessage(i18n("Appended '%1' to the play queue", item.title), '');
                        }).catch(err => {
                            this.fetchingItems = false;
                            this.showMessage();
                        });
                    } else {
                        this.showMessage(i18n("Failed to find an album!"));
                    }
                }).catch(err => {
                    this.fetchingItems = false;
                    this.showMessage();
                });
            } else {
                var command = [];
                if (item.url) {
                    command = ["playlistcontrol", "cmd:"+act, item.url];
                } else if (item.app && item.id) {
                    command = [item.app, "playlist", act, "item_id:"+item.id];
                }

                if (command.length===0) {
                    this.showMessage(i18n("Don't know how to handle this!"));
                    return;
                }
                lmsCommand(this.playerId(), command).then(({data}) => {
                    bus.$emit('refreshStatus');
                    if (act===PLAY_ACTION.cmd) {
                        this.$router.push('/nowplaying');
                    } else {
                        this.showMessage(i18n("Appended '%1' to the play queue", item.title), '');
                    }
                }).catch(err => {
                    this.fetchingItems = false;
                    this.showMessage();
                });
            }
        },
        headerAction(act) {
            this.itemAction(act, this.current);
        },
        refreshList() {
            var pos=document.documentElement.scrollTop;
            this.fetchingItems = true;
            lmsList(this.playerId(), this.current.command, this.adjustParams(this.current.params), 0, this.current.batchsize).then(({data}) => {
                this.fetchingItems = false;
                var resp = parseBrowseResp(data, this.current, this.artistImages);
                this.headerSubTitle="Total: "+this.listSize;
                if (data && data.result) {
                    this.listSize = data.result.count;
                } else {
                    this.listize = 0;
                }
                this.items=resp.items;
                if (resp.subtitle) {
                    this.headerSubTitle=resp.subtitle;
                }
                
                this.$nextTick(function () {
                    document.documentElement.scrollTop=pos>0 ? pos : 0;
                });
            }).catch(err => {
                this.fetchingItems = false;
                this.showMessage();
            });
        },
        goHome() {
            if (this.fetchingItems) {
                return;
            }
            var prev = this.history.length>0 ? this.history[0].pos : 0;
            this.items = this.top;
            this.listSize = this.top.length;
            this.history=[];
            this.current = null;
            this.headerTitle = null;
            this.headerSubTitle=null;
            this.actions=[];
            this.$nextTick(function () {
                document.documentElement.scrollTop=prev>0 ? prev : 0 ;
            });
        },
        goBack() {
            if (this.fetchingItems) {
                return;
            }
            if (this.history.length<2) {
                this.goHome();
                return;
            }
            var prev = this.history.pop();
            this.items = prev.items;
            this.listSize = prev.listSize;
            this.current = prev.current;
            this.headerTitle = prev.headerTitle;
            this.headerSubTitle = prev.headerSubTitle;
            this.actions = prev.actions;
            this.$nextTick(function () {
                document.documentElement.scrollTop=prev.pos>0 ? prev.pos : 0;
            });
        },
        scroll () { // Infinite scroll...
            window.onscroll = () => {
                if (this.fetchingItems || !this.items || !this.current || this.listSize<=this.items.length) {
                    return;
                }
                let bottomOfWindow = (document.documentElement.scrollTop + window.innerHeight) >= (document.documentElement.offsetHeight-300);

                if (bottomOfWindow) {
                    this.fetchingItems = true;
                    lmsList(this.playerId(), this.current.command, this.adjustParams(this.current.params), this.items.length).then(({data}) => {
                        this.fetchingItems = false;
                        var resp = parseBrowseResp(data, this.current, this.artistImages);
                        if (resp && resp.items) {
                            resp.items.forEach(i => {
                                this.items.push(i);
                            });
                        }
                    }).catch(err => {
                        this.fetchingItems = false;
                    });
                }
            };
        },
        adjustParams(origParams) {
            if (undefined!=origParams) {
                var params = [];
                origParams.forEach(p => { params.push(p.replace(ALBUM_SORT_PLACEHOLDER, this.$store.state.albumSort)
                                                       .replace(ARTIST_ALBUM_SORT_PLACEHOLDER, this.$store.state.artistAlbumSort)); });
                return params;
            } else {
                return origParams;
            }
        },
        i18n(str) {
            return i18n(str);
        }
    },
    mounted() {
        this.scroll();

        // All Artists + Album Artists, or just Artists?
        lmsCommand("", ["pref", "useUnifiedArtistsList", "?"]).then(({data}) => {
            if (data && data.result && data.result._p2) {
                this.separateArtists = 1!= data.result._p2;
            }
        });

        // Artist images?
        lmsCommand("", ["pref", "plugin.musicartistinfo:browseArtistPictures", "?"]).then(({data}) => {
            if (data && data.result && data.result._p2) {
                this.artistImages = 1==data.result._p2;
            }
        });

        // Additional browse modes?
        lmsCommand("", ["pref", "plugin.extendedbrowsemodes:additionalMenuItems", "?"]).then(({data}) => {
            var haveExtra = false;
            if (data && data.result && data.result._p2 && data.result._p2.length>0) {
                haveExtra = true;
                for (var i = data.result._p2.length; i-- > 0; ) {
                    var item = { title: data.result._p2[i].name,
                                 command: [data.result._p2[i].feed],
                                 url: "ebm:/"+data.result._p2[i].id,
                                 type: "group",
                                 icon: "artists"==data.result._p2[i].feed ? "group" : "album"
                               };

                    if (data.result._p2[i].params) {
                        var params=[];
                        if (data.result._p2[i].params.role_id) {
                            params.push("role_id:"+data.result._p2[i].params.role_id);
                        }
                        if (data.result._p2[i].params.genre_id) {
                            params.push("genre_id:"+data.result._p2[i].params.genre_id);
                        }
                        if (params.length>0) {
                            item.params = params;
                        }
                    }
                    this.other.unshift(item);
                }
            }

            if (!haveExtra) {
                this.other.unshift({
                                    title: i18n("Conductors"),
                                    command: ["artists"],
                                    params: ["role_id:CONDUCTOR"],
                                    icon: "group",
                                    type: "group",
                                    url: "more:/cond"
                                   });
                this.other.unshift({
                                    title: i18n("Composers"),
                                    command: ["artists"],
                                    params: ["role_id:COMPOSER"],
                                    icon: "group",
                                    type: "group",
                                    url: "more:/comp"
                                   });
            }
        });

        bus.$on('albumSortChanged', function(act) {
            this.goHome();
        }.bind(this));
    }
});
