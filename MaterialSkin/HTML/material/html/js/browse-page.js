/**
 * LMS-Material
 *
 * Copyright (c) 2018-2019 Craig Drummond <craig.p.drummond@gmail.com>
 * MIT license.
 */

var PLAY_ACTION             = {cmd:"play",       icon:"play_circle_outline"};
var PLAY_ALBUM_ACTION       = {cmd:"play_album", icon:"album"};
var PLAY_ALL_ACTION         = {cmd:"playall",    icon:"play_circle_outline"};
var ADD_ACTION              = {cmd:"add",        icon:"add_circle_outline"};
var ADD_ALL_ACTION          = {cmd:"addall",     icon:"add_circle_outline"};
var INSERT_ACTION           = {cmd:"add-hold",   icon:"format_indent_increase"};
var MORE_ACTION             = {cmd:"more",       svg: "more"};
var MORE_LIB_ACTION         = {cmd:"lib-more",   svg: "more"};
var ADD_RANDOM_ALBUM_ACTION = {cmd:"random",     icon:"album"};
var RENAME_PL_ACTION        = {cmd:"rename-pl",  icon:"edit"};
var RENAME_FAV_ACTION       = {cmd:"rename-fav", icon:"edit"};
var EDIT_FAV_ACTION         = {cmd:"edit-fav",   icon:"edit"};
var ADD_FAV_ACTION          = {cmd:"add-fav",    icon:"favorite_border"};
var DELETE_ACTION           = {cmd:"delete",     icon:"delete"};
var ADD_TO_FAV_ACTION       = {cmd:"addfav",     icon:"favorite_border"};
var REMOVE_FROM_FAV_ACTION  = {cmd:"removefav",  icon:"delete_outline"};
var PIN_ACTION              = {cmd:"pin",        svg: "pin"};
var UNPIN_ACTION            = {cmd:"unpin",      svg: "unpin"};
var SELECT_ACTION           = {cmd:"select",     icon:"check_box_outline_blank"};
var UNSELECT_ACTION         = {cmd:"unselect",   icon:"check_box"};

const MAX_GRID_TEXT_LEN = 80;
const DIVIDER = {divider:true};
const TERM_PLACEHOLDER        = "__TAGGEDINPUT__";
const ALBUM_SORT_PLACEHOLDER  = "__ALBUM_SORT__";
const ARTIST_ALBUM_SORT_PLACEHOLDER = "__ARTIST_ALBUM_SORT__";
const TOP_ID_PREFIX = "top:/";
const TOP_MMHDR_ID = TOP_ID_PREFIX+"mmh";
const TOP_SEARCH_ID = TOP_ID_PREFIX+"search";
const TOP_PLAYLISTS_ID = TOP_ID_PREFIX+"pl";
const TOP_FAVORITES_ID = TOP_ID_PREFIX+"fav";
const TOP_MORE_ID = TOP_ID_PREFIX+"more";
const TOP_RANDOM_ALBUMS_ID = TOP_ID_PREFIX+"rnda";
const TOP_RANDOM_MIX_ID = TOP_ID_PREFIX+"rndm";
const TOP_DYNAMIC_PLAYLISTS_ID = TOP_ID_PREFIX+"dpl";
const TOP_NEW_MUSIC_ID = TOP_ID_PREFIX+"new";
const TOP_APPS_ID  = TOP_ID_PREFIX+"apps";
const TOP_RADIO_ID  = TOP_ID_PREFIX+"ra";
const TOP_REMOTE_ID = TOP_ID_PREFIX+"rml";
const ALBUM_TAGS = "tags:jlya";
const TRACK_TAGS = "tags:ACdt";
const SECTION_APPS = 1;
const SECTION_FAVORITES = 2;
const SECTION_RADIO = 3;
const GROUP_PINNED = 0;
const GROUP_MY_MUSIC = 1;
const GROUP_OTHER_MUSIC = 2;

function isLocalLibCommand(command) {
    return command.command && command.command.length>0 &&
           (command.command[0]=="artists" || command.command[0]=="albums" || command.command[0]=="tracks" ||
            command.command[0]=="genres" || command.command[0]=="playlists" || "browselibrary"==command.command[0]);
}

var lmsBrowse = Vue.component("lms-browse", {
    template: `
<div>

 <div class="pswp" tabindex="-1" role="dialog" aria-hidden="true">
  <div class="pswp__bg"></div>
  <div class="pswp__scroll-wrap">
   <div class="pswp__container">
    <div class="pswp__item"></div>
    <div class="pswp__item"></div>
    <div class="pswp__item"></div>
   </div>
   <div class="pswp__ui pswp__ui--hidden">
    <div class="pswp__top-bar">
     <div class="pswp__counter"></div>
     <button class="pswp__button pswp__button--close"></button>
     <button class="pswp__button pswp__button--fs"></button>
     <button class="pswp__button pswp__button--zoom"></button>
     <div class="pswp__preloader">
      <div class="pswp__preloader__icn">
       <div class="pswp__preloader__cut">
        <div class="pswp__preloader__donut"></div>
       </div>
      </div>
     </div>
    </div>
    <div class="pswp__share-modal pswp__share-modal--hidden pswp__single-tap">
     <div class="pswp__share-tooltip"></div>
    </div>
    <button class="pswp__button pswp__button--arrow--left"></button>
    <button class="pswp__button pswp__button--arrow--right"></button>
    <div class="pswp__caption">
     <div class="pswp__caption__center"></div>
    </div>
   </div>
  </div>
 </div>

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
 <div v-if="headerTitle" class="subtoolbar noselect">
  <v-layout v-if="selection.length>0">
   <v-layout row wrap>
    <v-flex xs12 class="ellipsis subtoolbar-title">{{trans.selectMultiple}}</v-flex>
    <v-flex xs12 class="ellipsis subtoolbar-subtitle subtext">{{selection.length | displaySelectionCount}}</v-flex>
   </v-layout>
   <v-spacer></v-spacer>
   <v-btn :title="trans.addall" flat icon class="toolbar-button" @click="addSelectedItems()"><v-icon>add_circle_outline</v-icon></v-btn>
   <v-btn :title="trans.playall" flat icon class="toolbar-button" @click="playSelectedItems()"><v-icon>play_circle_outline</v-icon></v-btn>
   <v-btn :title="trans.cancel" flat icon class="toolbar-button" @click="clearSelection()"><v-icon>cancel</v-icon></v-btn>
  </v-layout>
  <v-layout v-else>
   <v-btn flat icon @click="goHome()" class="toolbar-button"><v-icon>home</v-icon></v-btn>
   <v-btn flat icon @click="goBack()" class="toolbar-button"><v-icon>arrow_back</v-icon></v-btn>
   <v-layout row wrap @click="showHistory($event)">
    <v-flex xs12 class="ellipsis subtoolbar-title">{{headerTitle}}</v-flex>
    <v-flex xs12 v-if="headerSubTitle" class="ellipsis subtoolbar-subtitle subtext">{{headerSubTitle}}</v-flex>
   </v-layout>
   <v-spacer></v-spacer>
   <template v-for="(action, index) in menuActions">
    <v-btn flat icon @click.stop="headerAction(action.cmd)" class="toolbar-button" :title="action.title"><v-icon>{{action.icon}}</v-icon></v-btn>
   </template>
  </v-layout>
 </div>
 <v-progress-circular class="browse-progress" v-if="fetchingItems" color="primary" size=72 width=6 indeterminate></v-progress-circular>
 <div v-show="showLetter" id="letterOverlay"></div>

 <v-list v-if="useGrid" class="lms-image-grid noselect bgnd-cover" id="browse-grid">
  <div v-for="(item, index) in items" :key="item.id" :id="'item'+index">
   <v-card flat tile :title="item | tooltip">
    <v-card-text v-if="item.type=='image'" class="image-grid-item">
     <v-img :src="item.thumb" :lazy-src="item.thumb" aspect-ratio="1" @click="showImage(index)"></v-img>
     {{item.caption}}
    </v-card-text>
    <v-card-text v-else class="image-grid-item" v-bind:class="{'radio-image': SECTION_RADIO==item.section}" @click="click(item, index, $event)">
     <v-btn icon color="primary" v-if="selection.length>0" class="image-grid-select-btn" @click.stop="select(item, index)">
      <v-icon>{{item.selected ? 'check_box' : 'check_box_outline_blank'}}</v-icon>
     </v-btn>
     <img v-lazy="item.image"></img>
     <div class="image-grid-text truncate-multiline">{{item.title | clampText}}</div>
     <div class="image-grid-text truncate-multiline subtext">{{item.subtitle | clampText}}</div>
     <v-btn flat icon @click.stop="itemMenu(item, index, $event)" class="image-grid-btn">
      <v-icon v-if="item.menuActions && item.menuActions.length>1">more_vert</v-icon>
      <v-icon v-else-if="item.menuActions && item.menuActions.length===1 && undefined==item.menuActions[0].svg" :title="item.menuActions[0].title">{{item.menuActions[0].icon}}</v-icon>
      <img v-else-if="item.menuActions && item.menuActions.length===1" :title="item.menuActions[0].title" class="svg-img" :src="item.menuActions[0].svg | svgIcon(darkUi)"></img>
     </v-btn>
    </v-card-text>
   </v-card>
  </div>
 </v-list>

 <v-list v-else class="noselect bgnd-cover" v-bind:class="{'lms-list': !headerTitle, 'lms-list-sub': headerTitle}" id="browse-list">
  <v-subheader v-if="isTop && pinned.length>0" @click="toggleGroup(GROUP_PINNED)"><v-icon>{{collapsed[GROUP_PINNED] ? 'arrow_right' : 'arrow_drop_down'}}</v-icon>{{ trans.pinned }}</v-subheader>
  <template v-if="isTop" v-for="(item, index) in pinned">
   <v-divider v-if="index>0 && pinned.length>index && !collapsed[GROUP_PINNED]"></v-divider>

   <v-list-tile v-if="!collapsed[GROUP_PINNED]" avatar @click="click(item, index, $event)" :key="item.id">
    <v-list-tile-avatar v-if="item.image" :tile="true">
     <img v-lazy="item.image">
    </v-list-tile-avatar>
    <v-list-tile-avatar v-else-if="item.icon" :tile="true">
     <v-icon>{{item.icon}}</v-icon>
    </v-list-tile-avatar>
    <v-list-tile-avatar v-else-if="item.svg" :tile="true">
      <img class="svg-list-img" :src="item.svg | svgIcon(darkUi)"></img>
    </v-list-tile-avatar>

    <v-list-tile-content>
     <v-list-tile-title v-html="item.title"></v-list-tile-title>
    </v-list-tile-content>

    <v-list-tile-action :title="UNPIN_ACTION.title" @click.stop="itemAction(UNPIN_ACTION.cmd, item, index)">
     <v-btn icon>
      <img class="svg-img" :src="UNPIN_ACTION.svg | svgIcon(darkUi)"></img>
     </v-btn>
    </v-list-tile-action>

   </v-list-tile>
  </template>

  <template v-for="(item, index) in items">
  <!-- TODO: Fix and re-use virtual scroller -->
  <!-- <template><recycle-list :items="items" :item-height="56" page-mode><div slot-scope="{item, index}">-->
   <v-subheader v-if="item.header" @click="toggleGroup(item.group)"><v-icon>{{undefined!=item.group && collapsed[item.group] ? 'arrow_right' : 'arrow_drop_down'}}</v-icon>{{ libraryName && item.id==TOP_MMHDR_ID ? item.header +" ("+libraryName+")" : item.header }}</v-subheader>

   <v-divider v-else-if="!item.disabled && (undefined==item.group || !collapsed[item.group]) && index>0 && items.length>index && !items[index-1].header" :inset="item.inset"></v-divider>
   <v-list-tile v-if="item.type=='text' && canClickText(item)" avatar @click="click(item, index, $event)" v-bind:class="{'error-text': item.id==='error'}">
    <v-list-tile-content>
     <v-list-tile-title v-html="item.title"></v-list-tile-title>
     <v-list-tile-sub-title v-html="item.subtitle"></v-list-tile-sub-title>
    </v-list-tile-content>
   </v-list-tile>
   <p v-else-if="item.type=='text'" class="browse-text" v-html="item.title"></p>
   <v-list-tile v-else-if="!item.disabled && (undefined==item.group || !collapsed[item.group]) && !item.header" avatar @click="click(item, index, $event)" :key="item.id" @dragstart="dragStart(index, $event)" @dragover="dragOver($event)" @drop="drop(index, $event)" :draggable="!item.selected && item.canDrag">
    <v-list-tile-avatar v-if="item.selected" :tile="true">
     <v-icon>check_box</v-icon>
    </v-list-tile-avatar>
    <v-list-tile-avatar v-else-if="item.image" :tile="true" v-bind:class="{'radio-image': SECTION_RADIO==item.section}">
     <img v-lazy="item.image"></img>
    </v-list-tile-avatar>
    <v-list-tile-avatar v-else-if="item.icon" :tile="true">
     <v-icon>{{item.icon}}</v-icon>
    </v-list-tile-avatar>
    <v-list-tile-avatar v-else-if="item.svg" :tile="true">
      <img class="svg-list-img" :src="item.svg | svgIcon(darkUi)"></img>
    </v-list-tile-avatar>
    <v-list-tile-avatar v-else-if="selection.length>0" :tile="true">
     <v-icon>check_box_outline_blank</v-icon>
    </v-list-tile-avatar>

    <v-list-tile-content v-if="item.type=='search'">
     <v-text-field single-line clearable class="lms-search" :label="item.title" v-on:keyup.enter="search($event, item)"></v-text-field>
    </v-list-tile-content>

    <v-list-tile-content v-else-if="item.type=='entry'">
     <v-text-field single-line clearable class="lms-search" :label="item.title" v-on:keyup.enter="entry($event, item)"></v-text-field>
    </v-list-tile-content>

    <v-list-tile-content v-else>
     <v-list-tile-title v-html="item.title"></v-list-tile-title>
     <v-list-tile-sub-title v-html="item.subtitle"></v-list-tile-sub-title>
    </v-list-tile-content>

    <v-list-tile-action v-if="item.menuActions && item.menuActions.length>1" @click.stop="itemMenu(item, index, $event)">
     <v-btn icon>
      <v-icon>more_vert</v-icon>
     </v-btn>
    </v-list-tile-action>
    <v-list-tile-action v-else-if="item.menuActions && item.menuActions.length===1" :title="item.menuActions[0].title" @click.stop="itemAction(item.menuActions[0].cmd, item, index)">
     <v-btn icon>
      <v-icon v-if="undefined==item.menuActions[0].svg">{{item.menuActions[0].icon}}</v-icon>
      <img v-else class="svg-img" :title="item.menuActions[0].title" :src="item.menuActions[0].svg | svgIcon(darkUi)"></img>
     </v-btn>
    </v-list-tile-action>
   </v-list-tile>
  <!-- </div></recycle-list></template> -->
  </template>
  <v-list-tile class="lms-list-pad"></v-list-tile>
 </v-list>

 <v-menu offset-y v-model="menu.show" :position-x="menu.x" :position-y="menu.y">
  <v-list v-if="menu.item">
   <template v-for="(action, index) in menu.item.menuActions">
    <v-divider v-if="action.divider"></v-divider>
    <v-list-tile v-else @click="itemAction(action.cmd, menu.item, menu.index)">
     <v-list-tile-title>
       <div v-if="undefined==action.svg"><v-icon>{{action.icon}}</v-icon>&nbsp;&nbsp;{{action.title}}</div>
       <div v-else><img class="svg-img" :src="action.svg | svgIcon(darkUi)"></img>&nbsp;&nbsp;{{action.title}}</div>
     </v-list-tile-title>
    </v-list-tile>
   </template>
  </v-list>
  <v-list v-if="menu.history">
   <template v-for="(item, index) in menu.history">
    <v-list-tile @click="goTo(index)">
     <v-list-tile-title>{{item}}</v-list-tile-title>
    </v-list-tile>
   </template>
  </v-list>
 </v-menu>

 <lms-randommix></lms-randommix>
 <lms-favorite></lms-favorite>
</div>
      `,
    props: [ 'desktop' ],
    data() {
        return {
            desktop: false,
            items: [],
            grid: false,
            fetchingItems: false,
            dialog: { show:false, title:undefined, hint:undefined, ok: undefined, cancel:undefined, command:undefined},
            trans: { ok:undefined, cancel: undefined, selectMultiple:undefined, addall:undefined, playall:undefined },
            menu: { show:false, item: undefined, x:0, y:0},
            isTop: true,
            pinned: [],
            libraryName: undefined,
            selection: [],
            collapsed: [false, false, false]
            showLetter: false,                             //toggles display of overlay when scrolling  
    }
    },
    computed: {
        darkUi () {
            return this.$store.state.darkUi
        }
    },
    created() {
        this.history=[];
        this.fetchingItems = false;
        this.current = null;
        this.headerTitle = null;
        this.headerSubTitle=null;
        this.menuActions=[];
        var col=getLocalStorageVal('collapsed', "").split(",");
        for (i=0; i<col.length && i<this.collapsed.length; ++i) {
           this.collapsed[i] = "true" == col[i];
        }
        this.options={artistImages: getLocalStorageBool('artistImages', false),
                      noGenreFilter: getLocalStorageBool('noGenreFilter', false),
                      noRoleFilter: getLocalStorageBool('noRoleFilter', false),
                      pinned: new Set(),
                      useGrid: this.$store.state.useGrid,
                      sortFavorites: this.$store.state.sortFavorites};
        this.separateArtists=getLocalStorageBool('separateArtists', false);
        this.randomMix=getLocalStorageBool('randomMix', true);
        this.dynamicPlaylists=getLocalStorageBool('dynamicPlaylists', false);
        this.remoteLibraries=getLocalStorageBool('remoteLibraries', true);
        this.previousScrollPos=0;
        this.pinned = JSON.parse(getLocalStorageVal("pinned", "[]"));

        if (this.pinned.length==0) {
            lmsCommand("", ["pref", LMS_MATERIAL_DEFAULT_PINNED_PREF, "?"]).then(({data}) => {
                if (data && data.result && data.result._p2) {
                    this.pinned = JSON.parse(data.result._p2);
                    this.addPinned();
                }
            });
        } else {
            this.addPinned();
        }
        this.useGrid=false;

        if (!this.desktop) {
            // As we scroll the whole page, we need to remember the current position when changing to (e.g.) queue
            // page, so that it can be restored when going back here.
            bus.$on('routeChange', function(from, to) {
                if (to=='/browse') {
                    setTimeout(function () {
                        setScrollTop(this.scrollElement, this.previousScrollPos>0 ? this.previousScrollPos : 0);
                    }.bind(this), 100);
                } else if (from=='/browse') {
                    this.previousScrollPos = this.scrollElement.scrollTop;
                }
            }.bind(this));
        }

        bus.$on('langChanged', function() {
            this.initItems();
        }.bind(this));

        this.initItems();

        bus.$on('playerChanged', function() {
            if (this.$store.state.serverMenus) {
                this.playerMenu();
            }
        }.bind(this));

        bus.$on('trackInfo', function(item) {
            this.itemAction(MORE_LIB_ACTION.cmd, item);
        }.bind(this));

        bus.$on('refreshFavorites', function() {
            if (this.current && SECTION_FAVORITES==this.current.section) {
                this.refreshList();
            }
        }.bind(this));
    },
    methods: {
        initItems() {
            PLAY_ACTION.title=PLAY_ALL_ACTION.title=i18n("Play now");
            PLAY_ALBUM_ACTION.title=i18n("Play album starting at track");
            ADD_ACTION.title=ADD_ALL_ACTION.title=i18n("Append to queue");
            ADD_RANDOM_ALBUM_ACTION.title=i18n("Append random album to queue");
            INSERT_ACTION.title=i18n("Play next");
            MORE_ACTION.title=i18n("More");
            MORE_LIB_ACTION.title=i18n("More");
            RENAME_PL_ACTION.title=i18n("Rename");
            RENAME_FAV_ACTION.title=i18n("Rename");
            EDIT_FAV_ACTION.title=i18n("Edit");
            ADD_FAV_ACTION.title=i18n("Add favorite");
            DELETE_ACTION.title=i18n("Delete");
            ADD_TO_FAV_ACTION.title=i18n("Add to favorites");
            REMOVE_FROM_FAV_ACTION.title=i18n("Remove from favorites");
            PIN_ACTION.title=i18n("Pin to main page");
            UNPIN_ACTION.title=i18n("Un-pin from main page");
            SELECT_ACTION.title=i18n("Select");
            UNSELECT_ACTION.title=i18n("Un-select");
            this.trans= { ok:i18n('OK'), cancel: i18n('Cancel'), pinned: i18n('Pinned Items'), selectMultiple:i18n("Select multiple items"),
                          addall:i18n("Add selection to queue"), playall:i18n("Play selection") };

            this.top = [
                { header: i18n("My Music"), id: TOP_MMHDR_ID, group: GROUP_MY_MUSIC },
                { title: this.separateArtists ? i18n("All Artists") : i18n("Artists"),
                  command: ["artists"],
                  params: [],
                  icon: "group",
                  type: "group",
                  group: GROUP_MY_MUSIC,
                  id: TOP_ID_PREFIX+"ar" },
                { title: i18n("Albums"),
                  command: ["albums"],
                  params: [ALBUM_TAGS, "sort:"+ALBUM_SORT_PLACEHOLDER],
                  icon: "album",
                  type: "group",
                  group: GROUP_MY_MUSIC,
                  id: TOP_ID_PREFIX+"al" },
                { title: i18n("Genres"),
                  command: ["genres"],
                  params: [],
                  icon: "label",
                  type: "group",
                  group: GROUP_MY_MUSIC,
                  id: TOP_ID_PREFIX+"ge" },
                { title: i18n("Playlists"),
                  command: ["playlists"],
                  params: [],
                  icon: "list",
                  type: "group",
                  group: GROUP_MY_MUSIC,
                  id: TOP_PLAYLISTS_ID }
                ];
            this.addExtraItems(this.top, true);
            if (this.separateArtists) {
                this.top.splice(2, 0, { title: i18n("Album Artists"),
                                        command: ["artists"],
                                        params: ["role_id:ALBUMARTIST"],
                                        icon: "group",
                                        type: "group",
                                        group: GROUP_MY_MUSIC,
                                        id: TOP_ID_PREFIX+"aar" });
            }

            var otherPrev = [];
            if (this.other) {
                if (this.other.length>6) {
                    for (var i=0; i<this.other.length-7; ++i) {
                        otherPrev.unshift(this.other[i]);
                    }
                }
            }
            this.other = [
                { title: i18n("Compilations"),
                  command: ["albums"],
                  params: ["compilation:1", ALBUM_TAGS, "sort:"+ALBUM_SORT_PLACEHOLDER],
                  icon: "album",
                  type: "group",
                  id: TOP_ID_PREFIX+"co" },
                { title: i18n("Random Albums"),
                  command: ["albums"],
                  params: [ALBUM_TAGS, "sort:random"],
                  svg: "dice-album",
                  type: "group",
                  id: TOP_RANDOM_ALBUMS_ID },
                { title: i18n("Random Mix"),
                  svg: "dice-multiple",
                  id: TOP_RANDOM_MIX_ID,
                  disabled: !this.randomMix },
                { title: i18n("Dynamic Playlists"),
                  command: ["dynamicplaylist", "browsejive"],
                  params: [],
                  svg: "dice-list",
                  id: TOP_DYNAMIC_PLAYLISTS_ID,
                  disabled: !this.dynamicPlaylists },
                { title: i18n("Years"),
                  command: ["years"],
                  params: [],
                  icon: "date_range",
                  type: "group",
                  id: TOP_ID_PREFIX+"yr" },
                { title: i18n("New Music"),
                  command: ["albums"],
                  params: [ALBUM_TAGS, "sort:new"],
                  icon: "new_releases",
                  type: "group",
                  id: TOP_NEW_MUSIC_ID },
                { title: i18n("Music Folder"),
                  command: ["musicfolder"],
                  params: ["type:audio", "tags:d"],
                  icon: "folder",
                  type: "group",
                  id: TOP_ID_PREFIX+"f" }
                ];
            otherPrev.forEach(i=> {
                this.other.unshift(i);
            });
            if (undefined!=this.serverTop && this.serverTop.length>0) {
                this.serverTop[0].title=this.top[0].title;
            } else {
                this.serverTop=[this.top[0]];
            }
            if (this.history.length<1) {
                this.items = this.getTop();
                this.listSize = this.items.length;
            } else if (1==this.history.length && this.current && this.current.id===TOP_MORE_ID) {
                this.items = this.other;
                this.listSize = this.items.length;
            }
        },
        playerId() {
            return this.$store.state.player ? this.$store.state.player.id : "";
        },
        addHistory() {
            var prev = {};
            prev.items = this.items;
            prev.baseActions = this.baseActions;
            prev.listSize = this.listSize;
            prev.current = this.current;
            prev.currentBaseActions = this.currentBaseActions;
            prev.headerTitle = this.headerTitle;
            prev.headerSubTitle = this.headerSubTitle;
            prev.menuActions = this.menuActions;
            prev.pos = this.scrollElement.scrollTop;
            prev.useGrid = this.useGrid;
            prev.command = this.command;
            this.history.push(prev);
        },
        fetchItems(command, item, batchSize) {
            if (this.fetchingItems) {
                return;
            }

            this.fetchingItems = true;
            //console.log("FETCH command:" + command.command + " params:" + command.params);
            var start = item.range ? item.range.start : 0;
            var count = item.range ? item.range.count < LMS_BATCH_SIZE ? item.range.count : LMS_BATCH_SIZE : batchSize;
            lmsList(this.playerId(), command.command, command.params, start, count).then(({data}) => {
                var resp = parseBrowseResp(data, item, this.options, 0);
                this.handleListResponse(item, command, data, resp);
                this.fetchingItems = false;
            }).catch(err => {
                this.fetchingItems = false;
                bus.$emit('showError', err);
                logError(err);
            });
        },
        handleListResponse(item, command, data, resp) {
            if (resp && resp.items && (resp.items.length>0 || (command.command.length==1 && ("artists"==command.command[0] || "albums"==command.command[0])))) {
                this.addHistory();
                this.command = command;
                this.current = item;
                this.currentBaseActions = this.baseActions;
                this.headerTitle=item.title ? item.title : "?";
                this.listSize = item.range ? item.range.count : data.result.count;
                this.items=resp.items;
                this.baseActions=resp.baseActions;
                this.menuActions=[];
                this.isTop = false;
                var changedView = this.useGrid != resp.useGrid;
                this.useGrid = resp.useGrid;

                if (this.current && this.current.menuActions) {
                    this.current.menuActions.forEach(i => {
                        if (i.cmd==ADD_ACTION.cmd || i.cmd==PLAY_ACTION.cmd) {
                            this.menuActions=[ADD_ACTION, PLAY_ACTION];
                            return;
                        }
                    });
                }
                // No menu actions? If first item is playable, add a PlayAll/AddAll to toolbar...
                if ((!item.id || !item.id.startsWith(TOP_ID_PREFIX)) && this.menuActions.length==0 && this.items.length>0 && this.items[0].menuActions &&
                   !(this.command.command.length>0 && (this.command.command[0]=="trackinfo" || this.command.command[0]=="artistinfo" ||
                                                       this.command.command[0]=="albuminfo"))) {
                    this.items[0].menuActions.forEach(i => {
                        if (i.cmd==ADD_ACTION.cmd || i.cmd==PLAY_ACTION.cmd) {
                            this.menuActions=[ADD_ALL_ACTION, PLAY_ALL_ACTION];
                            return;
                        }
                    });
                }
                if (this.menuActions.length==0 && SECTION_FAVORITES==this.current.section) {
                    this.menuActions=[ADD_FAV_ACTION];
                }
                if (this.listSize<0) {
                    this.listSize=this.items.length;
                }
                if (resp.subtitle) {
                    this.headerSubTitle=resp.subtitle;
                } else if (1==this.items.length && "text"==this.items[0].type) {
                    this.headerSubTitle = undefined;
                } else {
                    this.headerSubTitle=i18np("1 Item", "%1 Items", this.listSize);
                }
                this.sortItems();
                this.$nextTick(function () {
                    if (changedView) {
                        this.setScrollElement();
                    }
                    this.setGridAlignment();
                    this.setBgndCover();
                    setScrollTop(this.scrollElement, 0);
                });
            }
        },
        toggleGroup(group) {
            this.$set(this.collapsed, group, !this.collapsed[group]);
            setLocalStorageVal('collapsed', this.collapsed.join(","));
        },
        handleTextClickResponse(item, command, data) {
            var resp = parseBrowseResp(data, this.current, this.options);
            var nextWindow = item.nextWindow
                                ? item.nextWindow
                                : item.actions && item.actions.go && item.actions.go.nextWindow
                                    ? item.actions.go.nextWindow
                                    : undefined;

            if (nextWindow) {
                nextWindow=nextWindow.toLowerCase();
                var message = resp.items && 1==resp.items.length && "text"==resp.items[0].type && resp.items[0].title
                                ? resp.items[0].title : item.title;
                if (nextWindow=="refresh") {
                    bus.$emit('showMessage', message);
                    this.refreshList();
                } else if (nextWindow=="parent" && this.history.length>0) {
                    bus.$emit('showMessage', message);
                    this.goBack(true);
                } else if (nextWindow=="grandparent" && this.history.length>1) {
                    bus.$emit('showMessage', message);
                    this.history.pop();
                    this.goBack(true);
                }
            } else {
                this.handleListResponse(item, command, data, resp);
            }
        },
        canClickText(item) {
            return (item.style && item.style.startsWith('item') && item.style!='itemNoAction') || (!item.style && item.actions && item.actions.go);
        },
        doTextClick(item) {
            var command = this.buildCommand(item);
            command.params.forEach(p => {
                command.command.push(p);
            });
            if (command.command.length==2 && "items"==command.command[1]) {
                lmsList(this.playerId(), command.command, command.params, start, count).then(({data}) => {
                    this.handleTextClickResponse(item, command, data);
                });
            } else {
                lmsCommand(this.playerId(), command.command).then(({data}) => {
                    this.handleTextClickResponse(item, command, data);
                });
            }
        },
        click(item, index, event) {
            if (this.selection.length>0) {
                this.select(item, index);
                return;
            }
            if ("search"==item.type || "entry"==item.type) {
                return;
            }
            if ("text"==item.type) {
                if (this.canClickText(item)) {
                    this.doTextClick(item);
                }
                return;
            }

            if ("audio"==item.type  || "track"==item.type /*|| "itemplay"==item.style || "item_play"==item.style*/ ||
                (item.goAction && (item.goAction == "playControl" || item.goAction == "play"))) {
                if (this.$store.state.showMenuAudio) {
                    this.itemMenu(item, index, event);
                }
                return;
            }

            if (TOP_MORE_ID===item.id) {
                if (this.fetchingItems) {
                    return;
                }
                this.addHistory();
                this.items = this.other;
                this.headerTitle = item.title;
                this.headerSubTitle = i18n("Extra browse modes");
                this.listSize = this.items.length;
                setScrollTop(this.scrollElement, 0);
                this.isTop = false;
            } else if (TOP_RANDOM_MIX_ID==item.id) {
                bus.$emit('randomMix');
            } else if (!item.genreArtists && item.command && 1==item.command.length && 1==item.params.length &&
                       "artists"==item.command[0] && item.params[0].startsWith("genre_id:")) {
                if (this.fetchingItems) {
                    return;
                }
                // When listing a genre's items, ask whether to list Artists or Albums
                this.addHistory();
                this.items=[{ title: i18n("Artists"),
                              command: ["artists"],
                              params: [item.params[0]],
                              icon: "group",
                              type: "group",
                              id: item.id+"artists",
                              genreArtists:true },
                            { title: i18n("Albums"),
                              command: ["albums"],
                              params: [item.params[0], ALBUM_TAGS, "sort:"+ALBUM_SORT_PLACEHOLDER],
                              icon: "album",
                              type: "group",
                              id: item.id+"albums"}];
                this.headerTitle = item.title;
                this.headerSubTitle = i18n("Show artists or albums?");
                this.listSize = this.items.length;
                setScrollTop(this.scrollElement, 0);
                this.isTop = false;
            } else if (this.$store.state.splitArtistsAndAlbums && item.id && item.id.startsWith(TOP_ID_PREFIX) &&
                       item.id!=TOP_RANDOM_ALBUMS_ID && item.id!=TOP_NEW_MUSIC_ID &&
                       item.command && (item.command[0]=="artists" || item.command[0]=="albums")) {
                var command = { command: item.command, params: ["tags:CCZs"]};
                if (item.params) {
                    item.params.forEach(p => { if (!p.startsWith("tags:")) { command.params.push(p); } } );
                }
                this.fetchItems(this.replaceCommandTerms(command), item, 5);
            } else if (item.weblink) {
                window.open(item.weblink);
            } else {
                var command = this.buildCommand(item);
                if (command.command.length>2 && command.command[1]=="playlist") {
                    // TODO: Is not a browse command
                    if (this.$store.state.showMenuAudio) {
                        this.itemMenu(item, index, event);
                    }
                    return;
                }
                this.fetchItems(command, item);
            }
        },
        showImage(index) {
            var that = this;
            this.gallery = new PhotoSwipe(document.querySelectorAll('.pswp')[0], PhotoSwipeUI_Default, this.items, {index: index});
            this.gallery.listen('gettingData', function (index, item) {
                if (item.w < 1 || item.h < 1) {
                    var img = new Image();
                    img.onload = function () {
                        item.w = this.width;
                        item.h = this.height;
                        that.gallery.updateSize(true);
                    };
                    img.src = item.src;
                }
            });
            this.gallery.init();
            bus.$emit('dialogOpen', true);
            this.gallery.listen('close', function() { bus.$emit('dialogOpen', false); });
        },
        search(event, item) {
            if (this.fetchingItems) {
                return;
            }
            this.enteredTerm = event.target._value;
            this.fetchItems(this.buildCommand(item), item);
        },
        entry(event, item) {
            if (this.fetchingItems) {
                return;
            }
            this.enteredTerm = event.target._value;
            this.doTextClick(item);
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
                        bus.$emit('showError', err, dialog.command.length>2 && dialog.command[1]==='rename' ? i18n("Rename failed") : i18n("Failed"));
                        logError(err);
                    });
                }
            }
        },
        itemAction(act, item, index, suppressNotification) {
            if (act===RENAME_PL_ACTION.cmd) {
                this.dialog = { show:true, title:i18n("Rename playlist"), hint:item.value, value:item.title, ok: i18n("Rename"), cancel:undefined,
                                command:["playlists", "rename", item.id, "newname:"+TERM_PLACEHOLDER]};
            } else if (act==RENAME_FAV_ACTION.cmd) {
                this.dialog = { show:true, title:i18n("Rename favorite"), hint:item.value, value:item.title, ok: i18n("Rename"), cancel:undefined,
                                command:["favorites", "rename", removeUniqueness(item.id), "title:"+TERM_PLACEHOLDER]};
            } else if (act==ADD_FAV_ACTION.cmd) {
                bus.$emit('addFavorite');
            } else if (act==EDIT_FAV_ACTION.cmd) {
                bus.$emit('editFavorite', item);
            } else if (act===DELETE_ACTION.cmd) {
                this.$confirm(i18n("Delete '%1'?", item.title), {buttonTrueText: i18n('Delete'), buttonFalseText: i18n('Cancel')}).then(res => {
                    if (res) {
                        if (item.id.startsWith("playlist_id:")) {
                            lmsCommand(this.playerId(), ["playlists", "delete", item.id]).then(({datax}) => {
                                this.refreshList();
                            }).catch(err => {
                                bus.$emit('showError', err, i18n("Failed to delete playlist!"));
                                logError(err);
                            });
                        }
                    }
                });
            } else if (act===ADD_TO_FAV_ACTION.cmd) {
                var favUrl = item.favUrl ? item.favUrl : item.url;
                var favIcon = item.favIcon;
                var favType = "audio";
                var favTitle = item.origTitle ? item.origTitle : item.title;

                if (item.presetParams && item.presetParams.favorites_url) {
                    favUrl = item.presetParams.favorites_url;
                    favIcon = item.presetParams.icon;
                    favType = item.presetParams.favorites_type;
                    if (item.presetParams.favorites_title) {
                        favTitle = item.presetParams.favorites_title;
                    }
                } else if (item.id.startsWith("genre_id:")) {
                    favUrl="db:genre.name="+encodeURIComponent(favTitle);
                    favIcon="html/images/genres.png";
                } else if (item.id.startsWith("artist_id:")) {
                    favUrl="db:contributor.name="+encodeURIComponent(favTitle);
                } else if (item.id.startsWith("album_id:")) {
                    favUrl="db:album.title="+encodeURIComponent(favTitle);
                } else if (item.id.startsWith("year:")) {
                    favUrl="db:year.id="+encodeURIComponent(favTitle);
                    favIcon="html/images/years.png";
                } else if (item.id.startsWith("playlist:")) {
                    favIcon="html/images/playlists.png";
                }

                if (!favIcon && item.image) {
                    favIcon = item.image;
                }

                lmsCommand(this.playerId(), ["favorites", "exists", favUrl]).then(({data})=> {
                    if (data && data.result && data.result.exists==1) {
                        bus.$emit('showMessage', i18n("Already in favorites"));
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
                            bus.$emit('showMessage', i18n("Added to favorites"));
                        }).catch(err => {
                            bus.$emit('showError', err, i18n("Failed to add to favorites!"));
                            logError(err);
                        });
                    }
                }).catch(err => {
                    bus.$emit('showMessage', i18n("Failed to add to favorites!"));
                    logError(err);
                });
            } else if (act===REMOVE_FROM_FAV_ACTION.cmd) {
                this.$confirm(i18n("Remove '%1' from favorites?", item.title), {buttonTrueText: i18n('Remove'), buttonFalseText: i18n('Cancel')}).then(res => {
                    if (res) {
                        lmsCommand(this.playerId(), ["favorites", "delete", removeUniqueness(item.id)]).then(({datax}) => {
                            this.refreshList();
                        }).catch(err => {
                            bus.$emit('showError', err, i18n("Failed to remove favorite!"));
                            logError(err);
                        });
                    }
                });
            } else if (act===ADD_RANDOM_ALBUM_ACTION.cmd) {
                var params = [];
                item.params.forEach(p => { params.push(p); });
                params.push("sort:random");
                lmsList(this.playerId(), ["albums"], params, 0, 1).then(({data}) => {
                    var resp = parseBrowseResp(data, this.current, this.options);
                    if (1===resp.items.length && resp.items[0].id) {
                        var item = resp.items[0];
                        lmsCommand(this.playerId(), ["playlistcontrol", "cmd:add", item.id]).then(({data}) => {
                            bus.$emit('refreshStatus');
                            bus.$emit('showMessage', i18n("Appended '%1' to the play queue", item.title));
                        }).catch(err => {
                            bus.$emit('showError', err);
                            logError(err);
                        });
                    } else {
                        bus.$emit('showError', undefined, i18n("Failed to find an album!"));
                    }
                }).catch(err => {
                    bus.$emit('showError', err);
                    logError(err);
                });
            } else if (act===MORE_ACTION.cmd) {
                this.fetchItems(this.buildCommand(item, act), item);
            } else if (act===MORE_LIB_ACTION.cmd) {
                if (item.id) {
                    this.goHome();
                    if (item.id.startsWith("artist_id:")) {
                        this.fetchItems({command: ["artistinfo", "items"], params: ["menu:1", item.id, "html:1"]}, item);
                    } else if (item.id.startsWith("album_id:")) {
                        this.fetchItems({command: ["albuminfo", "items"], params: ["menu:1", item.id, "html:1"]}, item);
                    } else if (item.id.startsWith("track_id:")) {
                        this.fetchItems({command: ["trackinfo", "items"], params: ["menu:1", item.id, "html:1"]}, item);
                    } else if (item.id.startsWith("genre_id:")) {
                        this.fetchItems({command: ["genreinfo", "items"], params: ["menu:1", item.id, "html:1"]}, item);
                    }
                }
            } else if (act===PIN_ACTION.cmd) {
                this.pin(item, true);
            } else if (act===UNPIN_ACTION.cmd) {
                this.pin(item, false);
            } else if (SELECT_ACTION.cmd===act) {
                var idx=this.selection.indexOf(index);
                if (idx<0) {
                    this.selection.push(index);
                    item.selected = true;
                    idx = item.menuActions.indexOf(SELECT_ACTION);
                    if (idx>-1) {
                        item.menuActions[idx]=UNSELECT_ACTION;
                    }
                }
            } else if (UNSELECT_ACTION.cmd===act) {
                var idx=this.selection.indexOf(index);
                if (idx>-1) {
                    this.selection.splice(idx, 1);
                    item.selected = false;
                    idx = item.menuActions.indexOf(UNSELECT_ACTION);
                    if (idx>-1) {
                        item.menuActions[idx]=SELECT_ACTION;
                    }
                }
            } else {
                var command = this.buildFullCommand(item, act, index);
                if (command.command.length===0) {
                    bus.$emit('showError', undefined, i18n("Don't know how to handle this!"));
                    return;
                }

                //console.log("ACTION", command.command);
                lmsCommand(this.playerId(), command.command).then(({data}) => {
                    bus.$emit('refreshStatus');
                    if (!this.desktop) {
                        if (act===PLAY_ACTION.cmd) {
                            this.$router.push('/nowplaying');
                        } else if (act==PLAY_ALBUM_ACTION.cmd || act==PLAY_ALBUM_ACTION.cmd) {
                            this.$router.push('/nowplaying');
                        } else if (act===ADD_ACTION.cmd && (undefined==suppressNotification || !suppressNotification)) {
                            bus.$emit('showMessage', i18n("Appended '%1' to the play queue", item.title));
                        } else if (act==="insert") {
                            bus.$emit('showMessage', i18n("Inserted '%1' into the play queue", item.title));
                        }
                    }
                }).catch(err => {
                    bus.$emit('showError', err);
                    logError(err);
                });
            }
        },
        itemMenu(item, index, event) {
            if (!item.menuActions) {
                return;
            }
            if (1==item.menuActions.length && item.menuActions[0].cmd==MORE_ACTION.cmd) {
                // Only have 'More' - dont display menu, just activate action...
                this.itemAction(MORE_ACTION.cmd, item);
            } else if (1==item.menuActions.length && item.menuActions[0].cmd==MORE_LIB_ACTION.cmd) {
                // Only have 'More' - dont display menu, just activate action...
                this.itemAction(MORE_LIB_ACTION.cmd, item);
            } else {
                this.menu={show:true, item:item, x:event.clientX, y:event.clientY, index:index};
            }
        },
        showHistory(event) {
            if (this.history.length>1) {
                var history=[];
                this.history.forEach(h => {
                    history.push(h.headerTitle ? h.headerTitle : i18n("Home"));
                });
                this.menu={show:true, x:event.clientX, y:event.clientY, history:history};
            }
        },
        headerAction(act) {
            this.itemAction(act, this.current);
        },
        refreshList() {
            this.clearSelection();
            var pos=this.scrollElement.scrollTop;
            this.fetchingItems = true;
            lmsList(this.playerId(), this.command.command, this.command.params, 0, this.items.length>LMS_BATCH_SIZE ? this.items.length : LMS_BATCH_SIZE).then(({data}) => {
                var resp = parseBrowseResp(data, this.current, this.options, 0);
                this.items=resp.items;
                if (data && data.result) {
                    this.listSize = data.result.count;
                } else {
                    this.listSize = 0;
                }
                if (this.listSize<0) {
                    this.listSize=this.items.length;
                }
                if (resp.subtitle) {
                    this.headerSubTitle=resp.subtitle;
                } else {
                    this.headerSubTitle=i18np("1 Item", "%1 Items", this.listSize);
                }
                this.sortItems();
                this.$nextTick(function () {
                    setScrollTop(this.scrollElement, pos>0 ? pos : 0);
                });
                this.fetchingItems = false;
            }).catch(err => {
                this.fetchingItems = false;
                bus.$emit('showError', err);
                logError(err);
            });
        },
        sortItems() {
            if (this.current && this.listSize == this.items.length) {
                if (this.current.id == TOP_APPS_ID) {
                    this.items.sort(titleSort);
                } else if (SECTION_FAVORITES==this.current.section && this.$store.state.sortFavorites) {
                    this.items.sort(favSort);
                }
            }
        },
        goHome() {
            if (this.fetchingItems) {
                return;
            }
            var prev = this.history.length>0 ? this.history[0].pos : 0;
            this.items = this.getTop();
            this.listSize = this.items.length;
            this.history=[];
            this.current = null;
            this.headerTitle = null;
            this.headerSubTitle=null;
            this.menuActions=[];
            this.isTop = true;
            var changedView = this.useGrid;
            this.useGrid = false;
            this.command = undefined;
            this.$nextTick(function () {
                if (changedView) {
                    this.setScrollElement();
                }
                this.setBgndCover();
                setScrollTop(this.scrollElement, prev.pos>0 ? prev.pos : 0);
            });
        },
        goTo(index) {
            if (index>=this.history.length) {
                return;
            }
            if (0==index) {
                this.goHome();
            } else {
                while (index<this.history.length-1) {
                    this.history.pop();
                }
                this.goBack();
            }
        },
        goBack(refresh) {
            if (this.fetchingItems) {
                return;
            }
            if (this.history.length<2) {
                this.goHome();
                return;
            }
            var prev = this.history.pop();
            var changedView = this.useGrid != prev.useGrid;
            this.items = prev.items;
            this.useGrid = prev.useGrid;
            this.baseActions = prev.baseActions;
            this.listSize = prev.listSize;
            this.current = prev.current;
            this.currentBaseActions = prev.currentBaseActions;
            this.headerTitle = prev.headerTitle;
            this.headerSubTitle = prev.headerSubTitle;
            this.menuActions = prev.menuActions;
            this.command = prev.command;
            if (refresh) {
                this.refreshList();
            } else {
                this.$nextTick(function () {
                    if (changedView) {
                        this.setScrollElement();
                    }
                    this.setGridAlignment();
                    this.setBgndCover();
                    setScrollTop(this.scrollElement, prev.pos>0 ? prev.pos : 0);
                });
            }
        },
        buildCommand(item, commandName, doReplacements) {
            var origCommand = undefined;

            // Faking addall/playall, so build add/play command for first item...
            if (PLAY_ALL_ACTION.cmd==commandName || ADD_ALL_ACTION.cmd==commandName) {
                item = this.items[0];
                origCommand = commandName;
                commandName = PLAY_ALL_ACTION.cmd==commandName ? "play" : "add";
            }

            var cmd = {command: [], params: [] };

            if (undefined===item || null===item) {
                console.error("Null item passed to buildCommand????");
                return cmd;
            }

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
                                        ? this.baseActions[commandName]
                                        : "go" == commandName && this.baseActions["do"]
                                            ? this.baseActions["do"]
                                            : undefined
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

                // Convert local browse commands into their non-SlimBrowse equivalents, so that sort and tags can be applied
                if (cmd.command.length==2 && "browselibrary"==cmd.command[0] && "items"==cmd.command[1]) {
                    var p=[];
                    var c=[];
                    var canReplace = true;
                    var mode = undefined;
                    var hasSort = false;
                    var hasTags = false;
                    var hasArtistId = false;

                    cmd.params.forEach(i => {
                        if (i.startsWith("mode:")) {
                            mode = i.split(":")[1];
                            if (mode.startsWith("myMusicArtists")) {
                                mode="artists";
                            } else if (mode.startsWith("myMusicAlbums") || mode=="randomalbums") {
                                mode="albums";
                            } else if (mode=="vaalbums") {
                                mode="albums";
                                p.push("compilation:1");
                            } else if (mode=="bmf") {
                                mode="musicfolder"
                                p.push("type:audio");
                                p.push("tags:d");
                            } else if (mode!="artists" && mode!="albums" && mode!="years" && mode!="genres" && mode!="tracks" && mode!="playlists") {
                                canReplace = false;
                                return;
                            }
                            c.push(mode);
                        } else if (!i.startsWith("menu:")) {
                            p.push(i);
                            if (i.startsWith("sort:")) {
                                hasSort = true;
                            } else if (i.startsWith("tags:")) {
                                hasTags = true;
                            } else if (i.startsWith("artist_id:")) {
                                hasArtistId = true;
                            }
                        }
                    });

                    if (canReplace && c.length==1 && mode) {
                        if (mode=="tracks") {
                            if (!hasTags) {
                                p.push(TRACK_TAGS);
                            }
                            if (!hasSort) {
                                p.push("sort:tracknum");
                            }
                        } else if (mode=="albums") {
                            if (!hasTags) {
                                p.push(ALBUM_TAGS);
                            }
                            if (!hasSort) {
                                p.push("sort:"+(hasArtistId ? ARTIST_ALBUM_SORT_PLACEHOLDER : ALBUM_SORT_PLACEHOLDER));
                            }
                        }
                        cmd = {command: c, params: p};
                    }
                }
            }

            if (undefined==doReplacements || doReplacements) {
                cmd=this.replaceCommandTerms(cmd);
            }

            // If this *was* playall/addall, then need to convert back and set ID to parent
            if (origCommand && (PLAY_ALL_ACTION.cmd==origCommand || ADD_ALL_ACTION.cmd==origCommand)) {
                var c={command:[], params:[]};
                cmd.command.forEach(p=> {
                    if (p=="play" || p=="add") {
                        c.command.push(origCommand);
                    } else {
                        c.command.push(p);
                    }
                });
                cmd.params.forEach(p=> {
                    if (p.startsWith("item_id:")) {
                        c.params.push(this.current.id);
                    } else {
                        c.params.push(p);
                    }
                });
                cmd=c;
            }
            //console.log("COMMAND", cmd.command, cmd.params);
            return cmd;
        },
        buildFullCommand(item, act, index) {
            var command = this.buildCommand(item, act);
            if (command.command.length<1) { // Non slim-browse command
                if (INSERT_ACTION.cmd==act) {
                    act="insert";
                }
                if (item.url) {
                    command.command = ["playlist", act, item.url, item.title];
                } else if (item.app && item.id) {
                    command.command = [item.app, "playlist", act, item.id];
                } else if (item.id) {
                    var itemId = item.id;
                    var loadingItem = item;
                    command.command = ["playlistcontrol", "cmd:"+(act==PLAY_ACTION.cmd || act==PLAY_ALBUM_ACTION.cmd ? "load" : act)];

                    // NOTE(a): Play whole album, starting at selected track. First load album, then play track at index
                    if (undefined!==index && PLAY_ALBUM_ACTION.cmd == act && item.id.startsWith("track_id:") && this.current && 
                        this.current.id && this.current.id.startsWith("album_id:") ) {
                        loadingItem = this.current;
                        command.command.push("play_index:"+index);
                    }

                    if (loadingItem.id.startsWith("album_id:")  || loadingItem.id.startsWith("artist_id:")) {
                        loadingItem.params.forEach(p => {
                            if ( (!this.options.noRoleFilter && (p.startsWith("role_id:") || p.startsWith("artist_id:"))) ||
                                 (!this.options.noGenreFilter && p.startsWith("genre_id:"))) {
                                command.command.push(p);
                            }
                        });
                    }

                    command.command.push(loadingItem.id);
                }
            }

            if (command.command.length===0) {
                return command;
            }

            // Add params onto command...
            if (command.params.length>0) {
                command.params.forEach(i => {
                     command.command.push(i);
                });
            }
            return command;
        },
        replaceCommandTerms(cmd) {
            if (this.$store.state.library && LMS_DEFAULT_LIBRARY!=this.$store.state.library && isLocalLibCommand(cmd)) {
                var haveLibId = false;
                    cmd.params.forEach(p => {
                    if (p.startsWith("library_id:")) {
                        haveLibId = true;
                        return;
                    }
                });
                 if (!haveLibId) {
                    cmd.params.push("library_id:"+this.$store.state.library);
                }
            }

            // Replace sort and search terms
            if (cmd.params.length>0) {
                var modifiedParams = [];
                cmd.params.forEach(p => { modifiedParams.push(p.replace(ALBUM_SORT_PLACEHOLDER, this.$store.state.albumSort)
                                                               .replace(ARTIST_ALBUM_SORT_PLACEHOLDER, this.$store.state.artistAlbumSort)
                                                               .replace(TERM_PLACEHOLDER, this.enteredTerm)); });
                cmd.params = modifiedParams;
            }
            return cmd;
        },
        setLibrary() {
            this.libraryName = undefined;
            this.top[0].header=i18n("My Music");
            if (0==this.history.length) {
                this.items[0].header=this.top[0].header;
            }
            lmsList("", ["libraries"]).then(({data}) => {
                if (data && data.result && data.result.folder_loop && data.result.folder_loop.length>0) {
                    data.result.folder_loop.forEach(i => {
                        if (i.id == this.$store.state.library) {
                            if (i.id!=LMS_DEFAULT_LIBRARY) {
                                this.libraryName=i.name;
                            }
                            return;
                        }
                    });
                }
            });
        },
        getTop() {
            return this.$store.state.serverMenus ? this.serverTop : this.top;
        },
        addExtraItems(list, addMore) {
            list.push({ title: i18n("Search"),
                        command: ["search"],
                        params: ["tags:jlyAdt", "extended:1", "term:"+TERM_PLACEHOLDER],
                        icon: "search",
                        type: "search",
                        group: GROUP_MY_MUSIC,
                        id: TOP_SEARCH_ID });
            if (addMore) {
                list.push({ title: i18n("More"),
                            icon: "more_horiz",
                            group: GROUP_MY_MUSIC,
                            id: TOP_MORE_ID,
                            type: "group" });
            }
            list.push({ header: i18n("Other Music"), id:"omh", group: GROUP_OTHER_MUSIC });
            list.push({ title: i18n("Radio"),
                        command: ["radios"],
                        params: ["menu:radio"],
                        icon: "radio",
                        type: "group",
                        group: GROUP_OTHER_MUSIC,
                        id: TOP_RADIO_ID,
                        section: SECTION_RADIO });
            list.push({ title: i18n("Favorites"),
                        command: ["favorites", "items"],
                        params: ["menu:favorites", "menu:1"],
                        icon: "favorite",
                        type: "favorites",
                        app: "favorites",
                        group: GROUP_OTHER_MUSIC,
                        id: TOP_FAVORITES_ID,
                        section: SECTION_FAVORITES });
            list.push({ title: i18n("Apps"),
                        command: ["myapps", "items"],
                        params: ["menu:1"],
                        icon: "apps",
                        type: "group",
                        group: GROUP_OTHER_MUSIC,
                        id: TOP_APPS_ID,
                        section: SECTION_APPS });
            list.push({ title: i18n("Remote Libraries"),
                        command: ["selectRemoteLibrary", "items"],
                        params: ["menu:selectRemoteLibrary", "menu:1"],
                        icon: "cloud",
                        type: "group",
                        group: GROUP_OTHER_MUSIC,
                        id: TOP_REMOTE_ID,
                        disabled:!this.remoteLibraries });
        },
        playerMenu() {
            if (this.serverTop.length>0 && this.serverTop[0].player==this.playerId()) {
                return;
            }

            if (this.fetchingItems) {
                if (this.playerMenuTimeout) {
                    clearTimeout(this.playerMenuTimeout);
                }
                this.playerMenuTimeout = setTimeout(function () {
                    this.playerMenu();
                }.bind(this), 250);
                return;
            }

            this.fetchingItems=true;
            lmsList(this.playerId(), ["menu", "items"], ["direct:1"]).then(({data}) => {
                if (data && data.result && data.result.item_loop) {
                    this.serverTop = [];
                    this.serverTop.push({ header: i18n("My Music"), id: TOP_MMHDR_ID, weight:0, group: GROUP_MY_MUSIC} );
                    data.result.item_loop.forEach(c => {
                        if (c.node=="myMusic" && c.id) {
                            if (c.id=="randomplay") {
                                this.serverTop.push({ title: i18n("Random Mix"),
                                                      svg: "dice-multiple",
                                                      id: TOP_RANDOM_MIX_ID,
                                                      group: GROUP_MY_MUSIC,
                                                      weight: c.weight ? parseFloat(c.weight) : 100 });
                            } else if (!c.id.startsWith("myMusicSearch") && !c.id.startsWith("opmlselect")) {
                                var command = this.buildCommand(c, "go", false);
                                var item = { title: c.text,
                                             command: command.command ,
                                             params: command.params,
                                             weight: c.weight ? parseFloat(c.weight) : 100,
                                             group: GROUP_MY_MUSIC,
                                             id: TOP_ID_PREFIX+c.id,
                                            };

                                if (c.id.startsWith("myMusicArtists")) {
                                    item.icon = "group";
                                } else if (c.id.startsWith("myMusicAlbums")) {
                                    item.icon = "album";
                                } else if (c.id.startsWith("myMusicGenres")) {
                                    item.icon = "label";
                                } else if (c.id == "myMusicPlaylists") {
                                    item.icon = "list";
                                    item.id = TOP_PLAYLISTS_ID;
                                } else if (c.id.startsWith("myMusicYears")) {
                                    item.icon = "date_range";
                                } else if (c.id == "myMusicNewMusic") {
                                    item.icon = "new_releases";
                                    item.id=TOP_NEW_MUSIC_ID;
                                } else if (c.id.startsWith("myMusicMusicFolder")) {
                                    item.icon = "folder";
                                } else if (c.id.startsWith("myMusicFileSystem")) {
                                    item.icon = "computer";
                                } else if (c.id == "myMusicRandomAlbums") {
                                    item.svg = "dice-album";
                                    item.id=TOP_RANDOM_ALBUMS_ID;
                                } else if (c.id.startsWith("myMusicTopTracks")) {
                                    item.icon = "arrow_upward";
                                } else if (c.id.startsWith("myMusicFlopTracks")) {
                                    item.icon = "arrow_downward";
                                } else if (c.id == "dynamicplaylist") {
                                    item.svg = "dice-list";
                                } else {
                                    item.icon = "music_note";
                                }
                                this.serverTop.push(item);
                            }
                        }
                    });
                    this.serverTop.sort(function(a, b) { return a.weight!=b.weight ? a.weight<b.weight ? -1 : 1 : titleSort(a, b); });
                    this.addExtraItems(this.serverTop, false);
                    this.serverTop[0].player=this.playerId();
                    if (this.$store.state.serverMenus && 0==this.history.length) {
                        this.items = this.serverTop;
                    }
                }
                this.fetchingItems=false;
            }).catch(err => {
                this.fetchingItems = false;
                bus.$emit('showError', err);
                logError(err);
            });
        },
        addPinned() {
            this.pinned.forEach( p => {
                if (undefined==p.command && undefined==p.params) { // Previous pinned apps
                    var command = this.buildCommand(p.item);
                    p.params = command.params;
                    p.command = command.command;
                    p.image = p.item.image;
                    p.icon = p.item.icon;
                    p.item = undefined;
                }
                p.group = GROUP_PINNED;
                this.options.pinned.add(p.id);
            });
        },
        pin(item, add) {
            var index = -1;
            for (var i=0; i<this.pinned.length; ++i) {
                if (this.pinned[i].id == item.id) {
                    index = i;
                    break;
                }
            }

            if (add && index==-1) {
                var command = this.buildCommand(item);
                this.pinned.push({id: item.id, title: item.title, image: item.image, icon: item.icon,
                                  command: command.command, params: command.params, group: GROUP_PINNED});
                this.options.pinned.add(item.id);
                bus.$emit('showMessage', i18n("Pinned '%1' to the browse page.", item.title));
                for (var i=0; i<item.menuActions.length; ++i) {
                    if (item.menuActions[i].cmd == PIN_ACTION.cmd) {
                        item.menuActions[i] = UNPIN_ACTION;
                        break;
                    }
                }
                this.pinned.sort(titleSort);
                setLocalStorageVal('pinned', JSON.stringify(this.pinned));
                this.$forceUpdate();
            } else if (!add && index!=-1) {
                this.$confirm(i18n("Un-pin '%1'?", item.title), {buttonTrueText: i18n('Un-pin'), buttonFalseText: i18n('Cancel')}).then(res => {
                    if (res) {
                        this.pinned.splice(index, 1);
                        this.options.pinned.delete(item.id);
                        this.pinned.sort(titleSort);
                        setLocalStorageVal('pinned', JSON.stringify(this.pinned));
                        this.$forceUpdate();

                        for (var i=0; i<item.menuActions.length; ++i) {
                            if (item.menuActions[i].cmd == UNPIN_ACTION.cmd) {
                                item.menuActions[i] = PIN_ACTION;
                                break;
                            }
                        }
                    }
                });
            }
        },
        clearSelection() {
            this.selection.forEach(index => {
                if (index>-1 && index<this.items.length) {
                    var idx = this.items[index].menuActions.indexOf(UNSELECT_ACTION);
                    if (idx>-1) {
                        this.items[index].menuActions[idx]=SELECT_ACTION;
                        this.items[index].selected = false;
                    }
                }
            });

            this.selection = [];
        },
        select(item, index) {
            if (this.selection.length>0) {
                this.itemAction(this.selection.indexOf(index)<0 ? SELECT_ACTION.cmd : UNSELECT_ACTION.cmd, item, index);
            }
        },
        addSelectedItems() {
            var commands=[]
            this.selection.sort(function(a, b) { return a<b ? -1 : 1; });
            this.selection.forEach(idx => {
                if (idx>-1 && idx<this.items.length) {
                    commands.push({act:ADD_ACTION.cmd, item:this.items[idx], idx:idx});
                }
            });
            this.doCommands(commands);
            this.clearSelection();
        },
        playSelectedItems() {
            var commands=[]
            this.selection.sort(function(a, b) { return a<b ? -1 : 1; });
            for (var i=0; i<this.selection.length; ++i) {
                var idx = this.selection[i];
                if (idx>-1 && idx<this.items.length) {
                    commands.push({act:0==i ? PLAY_ACTION.cmd : ADD_ACTION.cmd, item:this.items[idx], idx:idx});
                }
            }
            this.doCommands(commands);
            this.clearSelection();
        },
        doCommands(commands) {
            if (commands.length>0) {
                var cmd = commands.shift();
                var command = this.buildFullCommand(cmd.item, cmd.act, cmd.idx);
                if (command.command.length===0) {
                    bus.$emit('showError', undefined, i18n("Don't know how to handle this!"));
                    return;
                }

                lmsCommand(this.playerId(), command.command).then(({data}) => {
                    this.doCommands(commands);
                });
            }
        },
        setScrollElement() {
            this.scrollElement = document.getElementById(this.useGrid ? "browse-grid" : "browse-list");
            var isScrolling;
            this.scrollElement.addEventListener('scroll', () => {
                // display a letter as overlay whilst scrolling - displays first letter of item at top of screen

                window.clearTimeout(isScrolling);                            // Clear a timeout if still scrolling
                isScrolling =  setTimeout( () => {                           // Show the overlay for 0.5 sec after scrolling...
                               this.showLetter = false;
                               },500);

                const scrollY = this.scrollElement.scrollTop;
                const visible = this.scrollElement.clientHeight;
                const pageHeight = this.scrollElement.scrollHeight;
                const pad = (visible*2.5);

                const bottomOfPage = (visible + scrollY) >= (pageHeight-(pageHeight>pad ? pad : 300));

                const numPages =  Math.floor(scrollY/visible)+1;            // Calculate number of pages scrolled
                var stopWordsRE = /(?:^|\s+)(?:the|The|El)(?=\s+|$)/gi;     // Pathetic attempt at stop word removal (needs to be a parameter)
	 
 
                if (this.useGrid) {                                         // Grid Display, 
                    var elem = document.getElementById("item0");
                    var rows = Math.round( scrollY / elem.offsetHeight); 
                    var colsPerPage  =   Math.floor(this.scrollElement.clientWidth / elem.offsetWidth) ; 
                    var itemNum = "item"+ Math.floor(rows*colsPerPage);
                    var classname = "v-card v-card--flat v-card--tile theme--" + ( this.$store.state.darkUi ? "dark" : "light"); 
                    elem = document.getElementById(itemNum).getElementsByClassName(classname)[0];
                    var  overlayHTML = elem.title.replace(stopWordsRE,"").trim().charAt(0).toUpperCase();
		}else {                                                     // List display 
                    var classname = "v-list__tile v-list__tile--link v-list__tile--avatar theme--" + (this.$store.state.darkUi ? "dark" : "light");
                    var elem = document.getElementsByClassName(classname);
                    var  rows  =   Math.round( scrollY / elem[0].offsetHeight); 
                    var  overlayText = elem[rows].getElementsByClassName("v-list__tile__content")[0].getElementsByClassName("v-list__tile__title")[0].innerHTML;
                    var  overlayHTML = overlayText.replace(stopWordsRE,"").trim().charAt(0).toUpperCase();
                }
                // Displau the overlay, larger than normal (could be a parameter)
                this.showLetter = true; 
                document.getElementById("letterOverlay").style.transform = "scale(10,10)"
                document.getElementById("letterOverlay").innerHTML = overlayHTML

 
                if (this.fetchingItems || this.listSize<=this.items.length) {
                    return;
                }



                if (bottomOfPage || pageHeight < visible) {
                    this.fetchingItems = true;
                    var start = this.current.range ? this.current.range.start+this.items.length : this.items.length;
                    var count = this.current.range ? (this.current.range.count-this.items.length) < LMS_BATCH_SIZE ? (this.current.range.count-this.items.length) : LMS_BATCH_SIZE : LMS_BATCH_SIZE;

                    lmsList(this.playerId(), this.command.command, this.command.params, start, count).then(({data}) => {
                        var resp = parseBrowseResp(data, this.current, this.options, this.items.length);
                        if (resp && resp.items) {
                            resp.items.forEach(i => {
                                this.items.push(i);
                            });
                        }
                        if (data && data.result && data.result.count) {
                            this.listSize = data.result.count;
                        }
                        this.fetchingItems = false;
                    }).catch(err => {
                        this.fetchingItems = false;
                        logError(err);
                    });
                }
            });
        },
        setGridAlignment() {
            if (!this.useGrid) {
                return;
            }
            var justify = this.listSize>7;
            if (!justify && this.listSize>1) {
                var elem = document.getElementById("item0");
                justify = elem && (this.scrollElement.scrollWidth/elem.scrollWidth)<(this.listSize*1.15);
            }

            if (justify) {
                if (this.scrollElement.classList.contains("lms-image-grid-few")) {
                    this.scrollElement.classList.remove("lms-image-grid-few");
                }
            } else if (!this.scrollElement.classList.contains("lms-image-grid-few")) {
                this.scrollElement.classList.add("lms-image-grid-few");
            }
        },
        dragStart(which, ev) {
            ev.dataTransfer.dropEffect = 'move';
            ev.dataTransfer.setData('Text', this.id);
            this.dragIndex = which;
            this.stopScrolling = false;
            //if (this.selection.length>0 && this.selection.indexOf(which)<0) {
                this.clearSelection();
            //}
        },
        dragOver(ev) {
            // Drag over item at top/bottom of list to start scrolling
            this.stopScrolling = true;
            if (ev.clientY < 110) {
                this.stopScrolling = false;
                this.scrollList(-5)
            }

            if (ev.clientY > (window.innerHeight - 70)) {
                this.stopScrolling = false;
                this.scrollList(5)
            }
            ev.preventDefault(); // Otherwise drop is never called!
        },
        scrollList(step) {
            setScrollTop(this.scrollElement, this.scrollElement.scrollTop + step);
            if (!this.stopScrolling) {
                setTimeout(function () {
                    this.scrollList(step);
                }.bind(this), 100);
            }
        },
        drop(to, ev) {
            this.stopScrolling = true;
            ev.preventDefault();
            if (this.dragIndex!=undefined && to!=this.dragIndex && this.dragIndex<this.items.length && to<this.items.length) {;
                var fromId = removeUniqueness(this.items[this.dragIndex].id).replace("item_id:", "from_id:");
                var toId = removeUniqueness(this.items[to].id).replace("item_id:", "to_id:");

                lmsCommand(this.playerId(), ["favorites", "move", fromId, toId]).then(({data}) => {
                    this.refreshList();
                }).catch(err => {
                    logError(err);
                });
                /*if (this.selection.length>0) {
                    if (this.selection.indexOf(to)<0) {
                        bus.$emit('moveQueueItems', this.selection.sort(function(a, b) { return a<b ? -1 : 1; }), to);
                    }
                } else {
                    bus.$emit('playerCommand', ["playlist", "move", this.dragIndex, to]);
                }
                this.clearSelection();
                */
            }
            this.dragIndex = undefined;
        },
        setBgndCover() {
            var url = this.$store.state.browseBackdrop && this.current && this.current.image && !this.current.image.startsWith("/plugins/") ? this.current.image : undefined;

            if (url) {
                if (url.endsWith(LMS_LIST_IMAGE_SIZE+".png")) {
                    url = url.replace(LMS_LIST_IMAGE_SIZE+".png", ".png");
                } else if (url.endsWith(LMS_GRID_IMAGE_SIZE+".png")) {
                    url = url.replace(LMS_GRID_IMAGE_SIZE+".png", ".png");
                } else if (url.endsWith(LMS_LIST_IMAGE_SIZE)) {
                    url = url.substring(0, url.length - LMS_LIST_IMAGE_SIZE.length);
                } else if (url.endsWith(LMS_GRID_IMAGE_SIZE)) {
                    url = url.substring(0, url.length - LMS_GRID_IMAGE_SIZE.length);
                }
            }
            setBgndCover(this.scrollElement, url, this.$store.state.darkUi);
        }
    },
    mounted() {
        // Get server prefs  for:
        //   All Artists + Album Artists, or just Artists?
        //   Filer albums/tracks on genre?
        //   Filter album/tracks on role?
        lmsCommand("", ["serverstatus", 0, 0, "prefs:useUnifiedArtistsList,noGenreFilter,noRoleFilter"]).then(({data}) => {
            if (data && data.result) {
                this.separateArtists = 1!=parseInt(data.result.useUnifiedArtistsList);
                setLocalStorageVal('separateArtists', this.separateArtists);
                this.options.noGenreFilter = 1==parseInt(data.result.noGenreFilter);
                setLocalStorageVal('noGenreFilter', this.options.noGenreFilter);
                this.options.noRoleFilter = 1==parseInt(data.result.noRoleFilter);
                setLocalStorageVal('noRoleFilter', this.options.noRoleFilter);
            }
        });
        // Artist images?
        lmsCommand("", ["pref", "plugin.musicartistinfo:browseArtistPictures", "?"]).then(({data}) => {
            if (data && data.result && data.result._p2 != null) {
                this.options.artistImages = 1==data.result._p2;
                setLocalStorageVal('artistImages', this.options.artistImages);
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

        lmsCommand("", ["can", "dynamicplaylist", "browsejive", "?"]).then(({data}) => {
            if (data && data.result && undefined!=data.result._can) {
                var can = 1==data.result._can;
                if (can!=this.dynamicPlaylists) {
                    this.dynamicPlaylists = can;
                    setLocalStorageVal('dynamicPlaylists', this.dynamicPlaylists);
                    this.other.forEach(i => {
                        if (i.id == TOP_DYNAMIC_PLAYLISTS_ID) {
                            i.disabled = !this.randomMix;
                            return;
                        }
                    });
                }
            }
        });

        lmsCommand("", ["can", "selectRemoteLibrary", "items", "?"]).then(({data}) => {
            if (data && data.result && undefined!=data.result._can) {
                var can = 1==data.result._can;
                if (can!=this.remoteLibraries) {
                    this.remoteLibraries = can;
                    setLocalStorageVal('remoteLibraries', this.remoteLibraries);
                    this.top.forEach(i => {
                        if (i.id == TOP_REMOTE_ID) {
                            i.disabled = !this.remoteLibraries;
                            return;
                        }
                    });
                }
            }
        });

        bus.$on('browseDisplayChanged', function(act) {
            this.options.useGrid=this.$store.state.useGrid;
            this.options.sortFavorites=this.$store.state.sortFavorites;
            if (this.playerId() && this.$store.state.serverMenus) {
                this.playerMenu();
            }
            this.goHome();
        }.bind(this));
        bus.$on('libraryChanged', function(act) {
            this.goHome();
            this.setLibrary();
        }.bind(this));
        this.setLibrary();

        if (this.playerId() && this.$store.state.serverMenus) {
            this.playerMenu();
        }

        this.setScrollElement();
        this.$nextTick(function () {
            setScrollTop(this.scrollElement, 0);
        });

        bus.$on('splitterChanged', function(act) {
            this.setGridAlignment();
        }.bind(this));

        bus.$on('themeChanged', function() {
            this.setBgndCover();
        }.bind(this));
        this.setBgndCover();
    },
    filters: {
        tooltip: function (item) {
            if (undefined==item ) {
                return '';
            }
            if (item.title && item.subtitle) {
                return item.title+"\n"+item.subtitle;
            }
            return item.title;
        },
        displaySelectionCount: function (value) {
            if (!value) {
                return '';
            }
            return i18np("1 Selected Item", "%1 Selected Items", value);
        },
        svgIcon: function (name, dark) {
            return "html/images/"+name+(dark ? "-dark" : "-light")+".svg?r=" + LMS_MATERIAL_REVISION;
        },
        clampText: function(str) {
            if (!str || str.length<MAX_GRID_TEXT_LEN) {
                return str;
            }
            return str.substring(0, MAX_GRID_TEXT_LEN) + "...";
        }
    },
});
