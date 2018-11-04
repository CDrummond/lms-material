/**
 * LMS-Material
 *
 * Copyright (c) 2018 Craig Drummond <craig.p.drummond@gmail.com>
 * MIT license.
 */

var PLAY_ACTION             = {cmd:"play",       icon:"play_circle_outline"};
var ADD_ACTION              = {cmd:"add",        icon:"add_circle_outline"};
var INSERT_ACTION           = {cmd:"add-hold",   icon:"format_indent_increase"};
var MORE_ACTION             = {cmd:"more",       icon:"more_horiz"};
var ADD_RANDOM_ALBUM_ACTION = {cmd:"random",     icon:"album"};
var RENAME_PL_ACTION        = {cmd:"rename-pl",  icon:"edit"};
var RENAME_FAV_ACTION       = {cmd:"rename-fav", icon:"edit"};
var DELETE_ACTION           = {cmd:"delete",     icon:"delete"};
var ADD_TO_FAV_ACTION       = {cmd:"addfav",     icon:"favorite_border"};
var REMOVE_FROM_FAV_ACTION  = {cmd:"removefav",  icon:"delete_outline"};

const DIVIDER = {divider:true};
const TERM_PLACEHOLDER        = "__TAGGEDINPUT__";
const ALBUM_SORT_PLACEHOLDER  = "__ALBUM_SORT__";
const ARTIST_ALBUM_SORT_PLACEHOLDER = "__ARTIST_ALBUM_SORT__";
const TOP_ID_PREFIX = "top:/";
const TOP_ARTISTS_ID = TOP_ID_PREFIX+"ar";
const TOP_ALBUM_ARTISTS_ID = TOP_ID_PREFIX+"aar";
const TOP_ALBUMS_ID = TOP_ID_PREFIX+"al";
const TOP_MORE_ID = TOP_ID_PREFIX+"more";
const TOP_RANDOM_ALBUMS_ID = TOP_ID_PREFIX+"rnda";
const TOP_RANDOM_MIX_ID = TOP_ID_PREFIX+"rndm";
const TOP_NEW_MUSIC_ID = TOP_ID_PREFIX+"new";
const TOP_SEARCH_ID = TOP_ID_PREFIX+"search";
const TOP_FAV_ID = TOP_ID_PREFIX+"fav";
const TOP_PLAYLISTS_ID  = TOP_ID_PREFIX+"pl";
const TOP_APPS_ID  = TOP_ID_PREFIX+"apps";

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
                <v-btn flat @click.native="dialog.show = false; dialogResponse(false);">{{undefined===dialog.cancel ? trans.cancel : dialog.cancel}}</v-btn>
                <v-btn flat @click.native="dialogResponse(true);">{{undefined===dialog.ok ? trans.ok : dialog.ok}}</v-btn>
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
              <template v-for="(action, index) in menuActions">
                <v-btn flat icon @click.stop="headerAction(action.cmd)" class="toolbar-button"><v-icon>{{action.icon}}</v-icon></v-btn>
              </template>
            </v-layout>
          </v-card>
          <div v-if="headerTitle" class="subtoolbar-pad"></div>
          <table class="browse-progress" v-if="fetchingItems">
            <tr>
              <td style="text-align: center;">
                <v-progress-circular color="primary" size=72 width=6 indeterminate></v-progress-circular>
              </td>
            </tr>
          </table>
          <v-list>
            <template v-for="(item, index) in items">
            <!-- TODO: Fix and re-use virtual scroller -->
            <!-- <template><recycle-list :items="items" :item-height="56" page-mode><div slot-scope="{item, index}">-->
              <v-subheader v-if="item.header">{{ item.header }}</v-subheader>

              <v-divider v-else-if="!item.disabled && index>0 && items.length>index && !items[index-1].header" :inset="item.inset"></v-divider>

              <p v-if="item.type=='text'" class="browse-text" v-html="item.title"></p>
              <v-list-tile v-else-if="!item.disabled && !item.header" avatar @click="click(item, $event)" :key="item.id">
                <v-list-tile-avatar v-if="item.image" :tile="true">
                  <img v-lazy="item.image">
                </v-list-tile-avatar>
                <v-list-tile-avatar v-else-if="item.icon" :tile="true">
                  <v-icon>{{item.icon}}</v-icon>
                </v-list-tile-avatar>

                <v-list-tile-content v-if="item.type=='search'">
                  <v-text-field single-line clearable class="lms-search" :label="item.title" v-on:keyup.enter="search($event, item)"></v-text-field>
                </v-list-tile-content>

                <v-list-tile-content v-else>
                  <v-list-tile-title v-html="item.title"></v-list-tile-title>
                  <v-list-tile-sub-title v-html="item.subtitle"></v-list-tile-sub-title>
                </v-list-tile-content>
                
                <!--
                <v-list-tile-action v-if="item.menuActions && 1===item.menuActions.length" @click.stop="itemAction(item.menuActions[0].cmd, item)">
                  <v-btn icon>
                    <v-icon>{{item.menuActions[0].icon}}</v-icon>
                  </v-btn>
                </v-list-tile-action>
                -->
                <v-list-tile-action v-if="item.menuActions && item.menuActions.length>0" @click.stop="itemMenu(item, $event)">
                  <v-btn icon>
                    <v-icon>more_vert</v-icon>
                  </v-btn>
                </v-list-tile-action>
              </v-list-tile>
            <!-- </div></recycle-list></template> -->
            </v-template>
          </v-list>

          <v-menu offset-y v-model="menu.show" :position-x="menu.x" :position-y="menu.y">
            <v-list v-if="menu.item">
              <template v-for="(action, index) in menu.item.menuActions">
                <v-divider v-if="action.divider"></v-divider>
                <v-list-tile v-else @click="itemAction(action.cmd, menu.item)">
                  <v-list-tile-title><v-icon>{{action.icon}}</v-icon>&nbsp;&nbsp;{{action.title}}</v-list-tile-title>
                </v-list-tile>
              </template>
            </v-list>
          </v-menu>

          <lms-randommix></lms-randommix>
       </div>
      `,
    props: [],
    data() {
        return {
            items: [],
            fetchingItems: false,
            snackbar:{ show: false, msg: undefined},
            dialog: { show:false, title:undefined, hint:undefined, ok: undefined, cancel:undefined, command:undefined},
            trans: { ok:undefined, cancel: undefined },
            menu: { show:false, item: undefined, x:0, y:0}
        }
    },
    created() {
        this.history=[];
        this.fetchingItems = false;
        this.current = null;
        this.headerTitle = null;
        this.headerSubTitle=null;
        this.menuActions=[];
        this.artistImages=getLocalStorageBool('artistImages', false);
        this.separateArtists=getLocalStorageBool('separateArtists', false);
        this.randomMix=getLocalStorageBool('randomMix', true);
        this.previousScrollPos=0;

        // As we scroll the whole page, we need to remember the current position when changing to (e.g.) queue
        // page, so that it can be restored when going back here.
        bus.$on('routeChange', function(from, to, pos) {
            if (to=='/browse') {
                setTimeout(function () {
                    setScrollTop(this.previousScrollPos>0 ? this.previousScrollPos : 0);
                }.bind(this), 100);
            } else if (from=='/browse') {
                this.previousScrollPos = pos;
            }
        }.bind(this));

        bus.$on('langChanged', function() {
            this.initItems();
        }.bind(this));
        this.initItems();
        this.$nextTick(function () {
            setScrollTop(0);
        });

        window.addEventListener('scroll', () => {
            if (this.fetchingItems || this.listSize<=this.items.length || this.$route.path!='/browse') {
                return;
            }
            const scrollY = window.scrollY;
            const el = getScrollElement();
            const visible = el.clientHeight;
            const pageHeight = el.scrollHeight;
            const pad = (visible*2.5);
            const bottomOfPage = visible + scrollY >= (pageHeight-(pageHeight>pad ? pad : 300));

            if (bottomOfPage || pageHeight < visible) {
                this.fetchingItems = true;
                var command = this.buildCommand(this.current);
                var start = this.current.range ? this.current.range.start+this.items.length : this.items.length;
                var count = this.current.range ? (item.range.count-this.items.length) < LMS_BATCH_SIZE ? (item.range.count-this.items.length) : LMS_BATCH_SIZE : LMS_BATCH_SIZE;

                lmsList(this.playerId(), command.command, command.params, start, count).then(({data}) => {
                    this.fetchingItems = false;
                    var resp = parseBrowseResp(data, this.current, this.artistImages, this.items.length);
                    if (resp && resp.items) {
                        resp.items.forEach(i => {
                            this.items.push(i);
                        });
                    }
                    if (data && data.result && data.result.count) {
                        this.listSize = data.result.count;
                    }
                }).catch(err => {
                    this.fetchingItems = false;
                });
            }
        });
    },
    methods: {
        initItems() {
            PLAY_ACTION.title=i18n("Play now");
            ADD_ACTION.title=i18n("Append to queue");
            ADD_RANDOM_ALBUM_ACTION.title=i18n("Append random album to queue");
            INSERT_ACTION.title=i18n("Play next");
            MORE_ACTION.title=i18n("More");
            RENAME_PL_ACTION.title=i18n("Rename");
            RENAME_FAV_ACTION.title=i18n("Rename");
            DELETE_ACTION.title=i18n("Delete");
            ADD_TO_FAV_ACTION.title=i18n("Add to favorites");
            REMOVE_FROM_FAV_ACTION.title=i18n("Remove from favorites");
            this.trans= { ok:i18n('OK'), cancel: i18n('Cancel') };

            this.top = [
            { header: i18n("My Music"), id: TOP_ID_PREFIX+"mmh" },
            {
                title: this.separateArtists ? i18n("All Artists") : i18n("Artists"),
                // SlimBrowse method - disabled for now
                //command: ["browselibrary", "items"],
                //params: ["menu:1", "mode:artists"],
                command: ["artists"],
                params: [],
                icon: "group",
                type: "group",
                id: TOP_ARTISTS_ID,
            },
            {
                title: i18n("Albums"),
                // SlimBrowse method - disabled for now
                //command: ["browselibrary", "items"],
                //params: ["menu:1", "mode:albums", "sort:"+ALBUM_SORT_PLACEHOLDER],
                command: ["albums"],
                params: ["tags:jlya", "sort:"+ALBUM_SORT_PLACEHOLDER],
                icon: "album",
                type: "group",
                id: TOP_ALBUMS_ID
            },
            {
                title: i18n("Genres"),
                // SlimBrowse method - disabled for now
                //command: ["browselibrary", "items"],
                //params: ["menu:1", "mode:genres"],
                command: ["genres"],
                params: [],
                icon: "label",
                type: "group",
                id: TOP_ID_PREFIX+"ge"
            },
            {
                title: i18n("Playlists"),
                // SlimBrowse method - disabled for now
                //command: ["browselibrary", "items"],
                //params: ["menu:1", "mode:playlists"],
                command: ["playlists"],
                params: [],
                icon: "list",
                type: "group",
                id: TOP_PLAYLISTS_ID
            },
            {
                title: i18n("Search"),
                // SlimBrowse method - TODO
                // command: [],
                // params: [],
                command: ["search"],
                params: ["tags:jlyAdt", "extended:1", "term:"+TERM_PLACEHOLDER],
                icon: "search",
                type: "search",
                id: TOP_SEARCH_ID
            },
            {
                title: i18n("More"),
                icon: "more_horiz",
                id: TOP_MORE_ID,
                type: "group",
            },
            { header: i18n("Other Music"), id:"omh" },
            {
                title: i18n("Radio"),
                command: ["radios"],
                params: ["menu:radio"],
                // Non-SlimBrowse
                //command: ["radios"],
                //params: ["want_url:1"],
                icon: "radio",
                type: "group",
                id: TOP_ID_PREFIX+"ra"
            },
            {
                title: i18n("Favorites"),
                command: ["favorites", "items"],
                params: ["menu:favorites", "menu:1"],
                // Non-SlimBrowse
                //command: ["favorites", "items"],
                //params: ["want_url:1"],
                icon: "favorite",
                type: "favorites",
                app: "favorites",
                id: TOP_FAV_ID,
                isFavFolder: true
            },
            {
                title: i18n("Apps"),
                command: ["myapps", "items"],
                params: ["menu:1"],
                // Non-SlimBrowse
                //command: ["apps"],
                //params: ["want_url:1"],
                icon: "apps",
                type: "group",
                id: TOP_APPS_ID
            }
            ];
            if (this.separateArtists) {
                this.top.splice(2, 0,
                            {
                                title: i18n("Album Artists"),
                                // SlimBrowse method - disabled for now
                                //command: ["browselibrary", "items"],
                                //params: ["menu:1", "mode:artists", "role_id:ALBUMARTIST"],
                                command: ["artists"],
                                params: ["role_id:ALBUMARTIST"],
                                icon: "group",
                                type: "group",
                                id: TOP_ALBUM_ARTISTS_ID
                            });
            }

            var otherPrev = [];
            if (this.other) {
                if (this.other.length>6) {
                    for (var i=0; i<this.other.length-6; ++i) {
                        otherPrev.unshift(this.other[i]);
                    }
                }
            }
            this.other = [
            {
                title: i18n("Compilations"),
                // SlimBrowse method - TODO
                //command: ["albums"],
                //params: [???]
                command: ["albums"],
                params: ["compilation:1", "tags:jlya", "sort:"+ALBUM_SORT_PLACEHOLDER],
                icon: "album",
                type: "group",
                id: TOP_ID_PREFIX+"co",
            },
            {
                title: i18n("Random Albums"),
                command: ["albums"],
                params: ["tags:jlya", "sort:random"],
                icon: "shuffle",
                type: "group",
                id: TOP_RANDOM_ALBUMS_ID
            },
            {
                title: i18n("Years"),
                // SlimBrowse method - disabled for now
                //command: ["browselibrary", "items"],
                //params: ["menu:1", "mode:years"],
                command: ["years"],
                params: [],
                icon: "date_range",
                type: "group",
                id: TOP_ID_PREFIX+"yr"
            },
            {
                title: i18n("New Music"),
                // SlimBrowse method - disabled for now
                //command: ["browselibrary", "items"],
                //params: ["menu:1", "mode:albums", "sort:new"],
                command: ["albums"],
                params: ["tags:jlya", "sort:new"],
                icon: "new_releases",
                type: "group",
                id: TOP_NEW_MUSIC_ID
            },
            {
                title: i18n("Random Mix"),
                icon: "shuffle",
                id: TOP_RANDOM_MIX_ID,
                disabled: !this.randomMix
            },
            {
                title: i18n("Music Folder"),
                command: ["musicfolder"],
                params: ["type:audio", "tags:d"],
                icon: "folder",
                type: "group",
                id: TOP_ID_PREFIX+"f"
            },
            ];
            otherPrev.forEach(i=> {
                this.other.unshift(i);
            });
            if (this.history.length<1) {
                this.items = this.top;
                this.listSize = this.items.length;
            } else if (1==this.history.length && this.current && this.current.id===TOP_MORE_ID) {
                this.items = this.other;
                this.listSize = this.items.length;
            }
        },
        playerId() {
            return this.$store.state.player ? this.$store.state.player.id : "";
        },
        showError(err, msg) {
            this.snackbar = {msg: (msg ? msg : i18n("Something went wrong!")) + (err ? " (" + err+")" : ""), show: true, color: 'error' };
        },
        showMessage(msg) {
            this.snackbar = {msg: msg, show: true };
        },
        fetchItems(command, item, batchSize) {
            this.fetchingItems = true;

            // Is this a browselibrary from favourites? If so, convert to non-SlimBrowse
            if (command.command.length==2 && "browselibrary"==command.command[0] && "items"==command.command[1]) {
                var p=[];
                var c=[];
                command.params.forEach(i => {
                    if (i.startsWith("mode:")) {
                        var mode = i.split(":")[1];
                        c.push(mode);
                        if (mode=="tracks") {
                            p.push("tags:Adt");
                            p.push("sort:tracknum");
                        } else if (mode=="albums") {
                            p.push("tags:jlya");
                        }
                    } else if (!i.startsWith("menu:")) {
                        p.push(i);
                    }
                });
                if (c.length==1 && p.length>0) {
                    command.command = c;
                    command.params = p;
                }
            }

            //console.log("FETCH command:" + command.command + " params:" + command.params);
            var start = item.range ? item.range.start : 0;
            var count = item.range ? item.range.count < LMS_BATCH_SIZE ? item.range.count : LMS_BATCH_SIZE : batchSize;
            lmsList(this.playerId(), command.command, command.params, start, count).then(({data}) => {
                this.fetchingItems = false;
                var resp = parseBrowseResp(data, item, this.artistImages, 0);

                if (resp && resp.items && resp.items.length>0) {
                    var prev = {};
                    prev.items = this.items;
                    prev.baseActions = this.baseActions;
                    prev.listSize = this.listSize;
                    prev.current = this.current;
                    prev.currentBaseActions = this.currentBaseActions;
                    prev.headerTitle = this.headerTitle;
                    prev.headerSubTitle = this.headerSubTitle;
                    prev.menuActions = this.menuActions;
                    prev.pos=getScrollTop();
                    this.current = item;
                    this.currentBaseActions = this.baseActions;
                    this.history.push(prev);
                    this.headerTitle=item.title;
                    this.listSize = item.range ? item.range.count : data.result.count;
                    this.items=resp.items;
                    this.baseActions=resp.baseActions;
                    this.menuActions=[];

                    if (this.current && this.current.menuActions) {
                        this.current.menuActions.forEach(i => {
                            if (i.cmd==ADD_ACTION.cmd || i.cmd==PLAY_ACTION.cmd) {
                                this.menuActions=[ADD_ACTION, PLAY_ACTION];
                                return;
                            }
                        });
                    }
                    if (resp.subtitle) {
                        this.headerSubTitle=resp.subtitle;
                    } else {
                        this.headerSubTitle=i18np("1 Item", "%1 Items", this.listSize);
                    }
                    this.sortItems();
                    setScrollTop(0);
                }
            }).catch(err => {
                this.fetchingItems = false;
                this.showError(err);
            });
        },
        click(item, event) {
            if ("search"==item.type) {
                if (/Android|webOS|iPhone|iPad|BlackBerry|Windows Phone|Opera Mini|IEMobile|Mobile/i.test(navigator.userAgent)) {
                    event.target.scrollIntoView();
                    //window.scrollBy(0, -64);
                }
                return;
            }
            if ("text"==item.type) {
                return;
            }

            if ("audio"==item.type  || "track"==item.type /*|| "itemplay"==item.style || "item_play"==item.style ||
                (item.goAction && (item.goAction == "playControl" || item.goAction == "play"))*/) {
                if (this.$store.state.showMenuAudio) {
                    this.itemMenu(item, event);
                }
                return;
            }

            if (TOP_MORE_ID===item.id) {
                var prev = {};
                prev.items = this.items;
                prev.listSize = this.listSize;
                prev.current = this.current;
                prev.headerTitle = this.headerTitle;
                prev.headerSubTitle = this.headerSubTitle;
                prev.menuActions = this.menuActions;
                prev.pos=getScrollTop();
                this.history.push(prev);
                this.items = this.other;
                this.headerTitle = item.title;
                this.headerSubTitle = i18n("Extra browse modes");
                this.listSize = this.items.length;
                setScrollTop(0);
            } else if (TOP_RANDOM_MIX_ID==item.id) {
                bus.$emit('randomMix');
            } else if (this.$store.state.splitArtistsAndAlbums && item.id && item.id.startsWith(TOP_ID_PREFIX) &&
                       item.id!=TOP_RANDOM_ALBUMS_ID && item.id!=TOP_NEW_MUSIC_ID &&
                       item.command && (item.command[0]=="artists" || item.command[0]=="albums")) {
                var command = { command: [ item.command[0] ], params: ["tags:CCZs"]};
                item.params.forEach(i => {
                    if (i.startsWith("sort:")) {
                        command.params.push(i.replace(ALBUM_SORT_PLACEHOLDER, this.$store.state.albumSort));
                    } else if (!i.startsWith("tags:")) {
                        command.params.push(i);
                    }
                });
                this.fetchItems(command, item, 5);
            } else {
                var command = this.buildCommand(item);
                if (command.command.length>2 && command.command[1]=="playlist") {
                    // TODO: Is not a browse command
                    if (this.$store.state.showMenuAudio) {
                        this.itemMenu(item, event);
                    }
                    return;
                }
                this.fetchItems(command, item);
            }
        },
        search(event, item) {
            if (this.fetchingItems) {
                return;
            }
            this.searchTerm = event.target._value;
            this.fetchItems(this.buildCommand(item), item);
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
                        this.showError(err, dialog.command.length>2 && dialog.command[1]==='rename' ? i18n("Renamed failed") : i18n("Failed"));
                    });
                }
            }
        },
        itemAction(act, item) {
            if (act===RENAME_PL_ACTION.cmd) {
                this.dialog = { show:true, title:i18n("Rename playlist"), hint:item.value, value:item.title, ok: i18n("Rename"), cancel:undefined,
                                command:["playlists", "rename", item.id, "newname:"+TERM_PLACEHOLDER]};
            } else if (act==RENAME_FAV_ACTION.cmd) {
                this.dialog = { show:true, title:i18n("Rename favorite"), hint:item.value, value:item.title, ok: i18n("Rename"), cancel:undefined,
                                command:["favorites", "rename", item.id, "title:"+TERM_PLACEHOLDER]};
            } else if (act===DELETE_ACTION.cmd) {
                this.$confirm(i18n("Delete '%1'?", item.title), {buttonTrueText: i18n('Delete'), buttonFalseText: i18n('Cancel')}).then(res => {
                    if (res) {
                        if (item.id.startsWith("playlist_id:")) {
                            lmsCommand(this.playerId(), ["playlists", "delete", item.id]).then(({datax}) => {
                                this.refreshList();
                            }).catch(err => {
                                this.showError(err, i18n("Failed to delete playlist!"));
                            });
                        }
                    }
                });
            } else if (act===ADD_TO_FAV_ACTION.cmd) {
                var favUrl = item.url;
                var favIcon = item.favIcon;
                var favType = "audio";
                var favTitle = item.title;

                if (item.presetParams && item.presetParams.favorites_url) {
                    favUrl = item.presetParams.favorites_url;
                    favIcon = item.presetParams.icon;
                    favType = item.presetParams.favorites_type;
                    if (item.presetParams.favorites_title) {
                        favTitle = item.presetParams.favorites_title;
                    }
                } else if (item.id.startsWith("genre_id:")) {
                    favUrl="db:genre.name="+encodeURI(item.title);
                    favIcon="html/images/genres.png";
                } else if (item.id.startsWith("artist_id:")) {
                    favUrl="db:contributor.name="+encodeURI(item.title);
                } else if (item.id.startsWith("album_id:")) {
                    favUrl="db:album.name="+encodeURI(item.title);
                } else if (item.id.startsWith("year:")) {
                    favUrl="db:year.id="+encodeURI(item.title);
                    favIcon="html/images/years.png";
                } else if (item.id.startsWith("playlist_id:")) {
                    favIcon="html/images/playlists.png";
                }

                if (!favIcon && item.image) {
                    favIcon = item.image;
                }

                lmsCommand(this.playerId(), ["favorites", "exists", favUrl]).then(({data})=> {
                    if (data && data.result && data.result.exists==1) {
                        this.showMessage(i18n("Already in favorites"));
                    } else {
                        var command = ["favorites", "add", "url:"+favUrl, "title:"+favTitle];
                        if (favType) {
                            command.push("type:"+favType);
                        }
                        if ("group"==item.type) {
                            command.push("hasitems:1");
                        }
                        if (favIcon) {
                            command.push("icon:"+favIcon);
                        }
                        lmsCommand(this.playerId(), command).then(({data})=> {
                            this.showMessage(i18n("Added to favorites"));
                        }).catch(err => {
                            this.showError(err, i18n("Failed to add to favorites!"));
                        });
                    }
                }).catch(err => {
                        this.showMessage(i18n("Failed to add to favorites!"));
                });
            } else if (act===REMOVE_FROM_FAV_ACTION.cmd) {
                this.$confirm(i18n("Remove '%1' from favorites?", item.title), {buttonTrueText: i18n('Remove'), buttonFalseText: i18n('Cancel')}).then(res => {
                    if (res) {
                        lmsCommand(this.playerId(), ["favorites", "delete", item.id]).then(({datax}) => {
                            this.refreshList();
                        }).catch(err => {
                            this.showError(err, i18n("Failed to remove favorite!"));
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
                    if (1===resp.items.length && resp.items[0].id) {
                        var item = resp.items[0];
                        this.fetchingItems = true;
                        lmsCommand(this.playerId(), ["playlistcontrol", "cmd:add", item.id]).then(({data}) => {
                            this.fetchingItems = false;
                            bus.$emit('refreshStatus');
                            this.showMessage(i18n("Appended '%1' to the play queue", item.title));
                        }).catch(err => {
                            this.fetchingItems = false;
                            this.showError(err);
                        });
                    } else {
                        this.showError(undefined, i18n("Failed to find an album!"));
                    }
                }).catch(err => {
                    this.fetchingItems = false;
                    this.showError(err);
                });
            } else if (act===MORE_ACTION.cmd) {
                this.fetchItems(this.buildCommand(item, act), item);
            } else {
                var command = this.buildCommand(item, act);
                if (command.command.length<1) {
                    // Non slim-browse command
                    if (INSERT_ACTION.cmd==act) {
                        act="insert";
                    }
                    if (item.url) {
                        command.command = ["playlist", act, item.url, item.title];
                    } else if (item.app && item.id) {
                        command.command = [item.app, "playlist", act, item.id];
                    } else if (item.id) {
                        command.command = ["playlistcontrol", "cmd:"+(act=="play" ? "load" : act), item.id];
                    }
                }

                if (command.command.length===0) {
                    this.showError(undefined, i18n("Don't know how to handle this!"));
                    return;
                }

                // Add params onto command...
                if (command.params.length>0) {
                    command.params.forEach(i => {
                        command.command.push(i);
                    });
                }

                //console.log("ACTION", command.command);
                lmsCommand(this.playerId(), command.command).then(({data}) => {
                    bus.$emit('refreshStatus');
                    if (act===PLAY_ACTION.cmd) {
                        this.$router.push('/nowplaying');
                    } else if (act===ADD_ACTION.cmd) {
                        this.showMessage(i18n("Appended '%1' to the play queue", item.title));
                    } else if (act==="insert") {
                        this.showMessage(i18n("Inserted '%1' into the play queue", item.title));
                    }
                }).catch(err => {
                    this.showError(err);
                });
            }
        },
        itemMenu(item, event) {
            if (!item.menuActions) {
                return;
            }
            if (1==item.menuActions.length && item.menuActions[0].cmd==MORE_ACTION.cmd) {
                // Only have 'More' - dont display menu, just activate action...
                this.itemAction(MORE_ACTION.cmd, item);
            } else {
                this.menu={show:true, item:item, x:event.clientX, y:event.clientY};
            }
        },
        headerAction(act) {
            this.itemAction(act, this.current);
        },
        refreshList() {
            var pos=getScrollTop();
            this.fetchingItems = true;
            var command = this.buildCommand(this.current);
            lmsList(this.playerId(), command.command, command.params, 0).then(({data}) => {
                this.fetchingItems = false;
                var resp = parseBrowseResp(data, this.current, this.artistImages, 0);
                this.items=resp.items;
                if (resp.subtitle) {
                    this.headerSubTitle=resp.subtitle;
                } else {
                    this.headerSubTitle=i18np("1 Item", "%1 Items", this.listSize);
                }
                if (data && data.result) {
                    this.listSize = data.result.count;
                } else {
                    this.listize = 0;
                }
                this.sortItems();
                this.$nextTick(function () {
                    setScrollTop(pos>0 ? pos : 0);
                });
            }).catch(err => {
                this.fetchingItems = false;
                this.showError(err);
            });
        },
        sortItems() {
            if (this.current && this.listSize == this.items.length) {
                if (this.current.id == TOP_APPS_ID) {
                    this.items.sort(titleSort);
                } else if (this.current.isFavFolder && this.$store.state.sortFavorites) {
                    this.items.sort(favSort);
                }
            }
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
            this.menuActions=[];
            this.$nextTick(function () {
                setScrollTop(prev>0 ? prev : 0);
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
            this.baseActions = prev.baseActions;
            this.listSize = prev.listSize;
            this.current = prev.current;
            this.currentBaseActions = prev.currentBaseActions;
            this.headerTitle = prev.headerTitle;
            this.headerSubTitle = prev.headerSubTitle;
            this.menuActions = prev.menuActions;
            this.$nextTick(function () {
                setScrollTop(prev.pos>0 ? prev.pos : 0);
            });
        },
        buildCommand(item, commandName) {
            var cmd = {command: [], params: [] };

            if (undefined==commandName) {
                if (item.command && item.command.length>0) {
                    item.command.forEach(i => {
                        cmd.command.push(i);
                    });
                }
                if (item.params && item.params.length>0) {
                    item.params.forEach(i => {
                        cmd.params.push(i);
                    });
                }
            }

            if (cmd.command.length<1) { // Build SlimBrowse command
                if (undefined==commandName) {
                    commandName = "go";
                }
                command = item.actions && item.actions[commandName]
                            ? item.actions[commandName]
                            : "go" == commandName && item.actions && item.actions["do"]
                                ? item.actions["do"]
                                : this.baseActions
                                    ? this.baseActions[commandName]
                                    : "go" == commandName && this.baseActions["do"]
                                        ? this.baseActions["do"]
                                        : undefined;

                if (command) {
                    cmd.command = [];
                    if (command.cmd) {
                        command.cmd.forEach(i => {
                            cmd.command.push(i);
                        });
                    }
                    cmd.params = [];
                    if (command.params) {
                        for(var key in command.params) {
                            cmd.params.push(key+":"+command.params[key]);
                        }
                    }
                    var isMore = "more" == commandName;
                    if (command.itemsParams && item[command.itemsParams]) {
                        for(var key in item[command.itemsParams]) {
                            if (/*!isMore ||*/ ("touchToPlaySingle"!=key && "touchToPlay"!=key)) {
                                cmd.params.push(key+":"+item[command.itemsParams][key]);
                            }
                        }
                    }
                }
            }

            // Add library id, if set TODO: Is this OK for all commands???
            if (this.$store.state.library && LMS_DEFAULT_LIBRARY!=this.$store.state.library) {
                cmd.params.push("library_id:"+this.$store.state.library);
            }

            // Replace sort and search terms
            if (cmd.params.length>0) {
                var modifiedParams = [];
                cmd.params.forEach(p => { modifiedParams.push(p.replace(ALBUM_SORT_PLACEHOLDER, this.$store.state.albumSort)
                                                               .replace(ARTIST_ALBUM_SORT_PLACEHOLDER, this.$store.state.artistAlbumSort)
                                                               .replace(TERM_PLACEHOLDER, this.searchTerm)); });
                cmd.params = modifiedParams;
            }
            //console.log("COMMAND", cmd.command, cmd.params);
            return cmd;
        },
        setLibrary() {
            this.top[0].header=i18n("My Music");
            if (0==this.history.length) {
                this.items[0].header=this.top[0].header;
            }
            lmsList("", ["libraries"]).then(({data}) => {
                if (data && data.result && data.result.folder_loop && data.result.folder_loop.length>0) {
                    data.result.folder_loop.forEach(i => {
                        if (i.id == this.$store.state.library) {
                            if (i.id!=LMS_DEFAULT_LIBRARY) {
                                this.top[0].header=i.name;
                                if (0==this.history.length) {
                                    this.items[0].header=this.top[0].header;
                                }
                            }
                            return;
                        }
                    });
                }
            });
        }
    },
    mounted() {
        // All Artists + Album Artists, or just Artists?
        lmsCommand("", ["pref", "useUnifiedArtistsList", "?"]).then(({data}) => {
            if (data && data.result && data.result._p2) {
                this.separateArtists = 1!= data.result._p2;
                setLocalStorageVal('separateArtists', this.separateArtists);
                this.initItems();
            }
        });

        // Artist images?
        lmsCommand("", ["pref", "plugin.musicartistinfo:browseArtistPictures", "?"]).then(({data}) => {
            if (data && data.result && data.result._p2) {
                this.artistImages = 1==data.result._p2;
                setLocalStorageVal('artistImages', this.artistImages);
            }
        });

        // Additional browse modes?
        lmsCommand("", ["pref", "plugin.extendedbrowsemodes:additionalMenuItems", "?"]).then(({data}) => {
            var haveExtra = false;
            if (data && data.result && data.result._p2 && data.result._p2.length>0) {
                haveExtra = true;
                for (var i = data.result._p2.length; i-- > 0; ) {
                    var item = { title: data.result._p2[i].name,
                                 // SlimBrowse method - disabled for now
                                 //command: ["browselibrary", "items"],
                                 //params: ["menu:1", "mode:"+data.result._p2[i].feed],
                                 command: [data.result._p2[i].feed],
                                 params: [],
                                 id: TOP_ID_PREFIX+"ebm-"+data.result._p2[i].id,
                                 type: "group",
                                 icon: "artists"==data.result._p2[i].feed ? "group" : "album"
                               };

                    if (data.result._p2[i].params) {
                        if (data.result._p2[i].params.role_id) {
                            item.params.push("role_id:"+data.result._p2[i].params.role_id);
                        }
                        if (data.result._p2[i].params.genre_id) {
                            item.params.push("genre_id:"+data.result._p2[i].params.genre_id);
                        }
                    }
                    this.other.unshift(item);
                }
            }

            if (haveExtra && 1==this.history.length && this.current && this.current.id===TOP_MORE_ID) {
                this.items = this.other;
                this.listSize = this.items.length;
            }
        });

        lmsCommand("", ["can", "randomplay", "?"]).then(({data}) => {
            if (data && data.result && undefined!=data.result._can) {
                var can = 1==data.result._can;
                if (can!=this.randomMix) {
                    this.randomMix = can;
                    setLocalStorageVal('randomMix', this.randomMix);
                    this.other.forEach(i => {
                        if (i.id == TOP_RANDOM_MIX_ID) {
                            i.disabled = !this.randomMix;
                            return;
                        }
                    });
                }
            }
        });

        bus.$on('browseDisplayChanged', function(act) {
            this.goHome();
        }.bind(this));
        bus.$on('libraryChanged', function(act) {
            this.goHome();
            this.setLibrary();
        }.bind(this));
        this.setLibrary();
    }
});
