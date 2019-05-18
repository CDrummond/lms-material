/**
 * LMS-Material
 *
 * Copyright (c) 2018-2019 Craig Drummond <craig.p.drummond@gmail.com>
 * MIT license.
 */

const DIVIDER                 = -1;
const PLAY_ACTION             = 0;
const PLAY_ALBUM_ACTION       = 1;
const PLAY_ALL_ACTION         = 2;
const ADD_ACTION              = 3;
const ADD_ALL_ACTION          = 4;
const INSERT_ACTION           = 5;
const MORE_ACTION             = 6;
const MORE_LIB_ACTION         = 7;
const ADD_RANDOM_ALBUM_ACTION = 8;
const RENAME_PL_ACTION        = 9;
const RENAME_FAV_ACTION       = 10;
const EDIT_FAV_ACTION         = 11;
const ADD_FAV_ACTION          = 12;
const DELETE_ACTION           = 13;
const ADD_TO_FAV_ACTION       = 14;
const REMOVE_FROM_FAV_ACTION  = 15;
const PIN_ACTION              = 16;
const UNPIN_ACTION            = 17;
const SELECT_ACTION           = 18;
const UNSELECT_ACTION         = 19;
const RATING_ACTION           = 20;
const SEARCH_LIB_ACTION       = 21;
const USE_GRID_ACTION         = 22;
const USE_LIST_ACTION         = 23;
const GRID_SIZES = [ {iw:133, ih:185, clz:"image-grid-a"},
                     {iw:138, ih:190, clz:"image-grid-b"},
                     {iw:143, ih:195, clz:"image-grid-c"},
                     {iw:148, ih:200, clz:"image-grid-d"},
                     {iw:153, ih:205, clz:"image-grid-e"},
                     {iw:158, ih:210, clz:"image-grid-f"},
                     {iw:163, ih:215, clz:"image-grid-g"},
                     {iw:168, ih:220, clz:"image-grid-h"},
                     {iw:173, ih:225, clz:"image-grid-i"},
                     {iw:178, ih:230, clz:"image-grid-j"} ];

var B_ACTIONS=[
    {cmd:"play",       icon:"play_circle_outline"},
    {cmd:"play_album", icon:"album"},
    {cmd:"playall",    icon:"play_circle_outline"},
    {cmd:"add",        icon:"add_circle_outline"},
    {cmd:"addall",     icon:"add_circle_outline"},
    {cmd:"add-hold",   icon:"format_indent_increase"},
    {cmd:"more",       svg: "more"},
    {cmd:"lib-more",   svg: "more"},
    {cmd:"random",     icon:"album"},
    {cmd:"rename-pl",  icon:"edit"},
    {cmd:"rename-fav", icon:"edit"},
    {cmd:"edit-fav",   icon:"edit"},
    {cmd:"add-fav",    svg:"add-favorite"},
    {cmd:"delete",     icon:"delete"},
    {cmd:"addfav",     svg:"add-favorite"},
    {cmd:"removefav",  svg:"remove-favorite"},
    {cmd:"pin",        svg: "pin"},
    {cmd:"unpin",      svg: "unpin"},
    {cmd:"select",     icon:"check_box_outline_blank"},
    {cmd:"unselect",   icon:"check_box"},
    {cmd:"rating",     icon:"stars"},
    {cmd:"search-lib", icon:"search"},
    {cmd:"use-grid",   icon:"grid_on"},
    {cmd:"use-list",   icon:"grid_off"}
];

const MAX_GRID_TEXT_LEN = 80;
const TERM_PLACEHOLDER        = "__TAGGEDINPUT__";
const ALBUM_SORT_PLACEHOLDER  = "AS";
const ARTIST_ALBUM_SORT_PLACEHOLDER = "AAS";
const TOP_ID_PREFIX = "top:/";
const TOP_MMHDR_ID = TOP_ID_PREFIX+"mmh";
const TOP_SEARCH_ID = TOP_ID_PREFIX+"search";
const TOP_GENRES_ID = TOP_ID_PREFIX+"genre";
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
const TOP_CDPLAYER_ID = TOP_ID_PREFIX+"cdda";
const ALBUM_TAGS = "tags:jlyasS";
const TRACK_TAGS = "tags:ACdts";
const SORT_KEY = "sort:";
const SECTION_APPS = 1;
const SECTION_FAVORITES = 2;
const SECTION_RADIO = 3;
const SECTION_PLAYLISTS = 4;
const GROUP_PINNED = 0;
const GROUP_MY_MUSIC = 1;
const GROUP_OTHER_MUSIC = 2;
const CONDUCTOR_GENRES = new Set(["Classical", "Avant-Garde", "Baroque", "Chamber Music", "Chant", "Choral", "Classical Crossover",
                                  "Early Music",  "High Classical", "Impressionist", "Medieval", "Minimalism","Modern Composition",
                                  "Opera", "Orchestral", "Renaissance", "Romantic", "Wedding Music"]);
const COMPOSER_GENRES = new Set(["Jazz"]);

var lmsBrowse = Vue.component("lms-browse", {
    template: `
<div id="browse-view">
 <v-dialog v-model="dialog.show" persistent max-width="500px">
  <v-card>
   <v-card-text>
    <span v-if="dialog.title">{{dialog.title}}</span>
    <v-container grid-list-md>
     <v-layout wrap>
      <v-flex xs12>
       <v-text-field single-line v-if="dialog.show" :label="dialog.hint" v-model="dialog.value" autofocus @keyup.enter="dialogResponse(true);"></v-text-field>
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
   <v-btn v-if="current && current.section==SECTION_PLAYLISTS" :title="trans.deleteall" flat icon class="toolbar-button" @click="deleteSelectedItems()"><v-icon>delete</v-icon></v-btn>
   <v-btn v-else-if="current && current.section==SECTION_FAVORITES" :title="trans.removeall" flat icon class="toolbar-button" @click="deleteSelectedItems()"><v-icon>delete_outline</v-icon></v-btn>
   <v-divider vertical v-if="current && (current.section==SECTION_PLAYLISTS || current.section==SECTION_FAVORITES)"></v-divider>
   <v-btn :title="trans.addall" flat icon class="toolbar-button" @click="addSelectedItems()"><v-icon>add_circle_outline</v-icon></v-btn>
   <v-btn :title="trans.playall" flat icon class="toolbar-button" @click="playSelectedItems()"><v-icon>play_circle_outline</v-icon></v-btn>
   <v-divider vertical></v-divider>
   <v-btn :title="trans.cancel" flat icon class="toolbar-button" @click="clearSelection()"><v-icon>cancel</v-icon></v-btn>
  </v-layout>
  <v-layout v-else>
   <v-btn flat icon v-longpress="backBtnPressed" class="toolbar-button"><v-icon>arrow_back</v-icon></v-btn>
   <v-layout row wrap @click="showHistory($event)" v-if="headerSubTitle" v-bind:class="{pointer : history.length>1}">
    <v-flex xs12 class="ellipsis subtoolbar-title">{{headerTitle}}</v-flex>
    <v-flex xs12 class="ellipsis subtoolbar-subtitle subtext">{{headerSubTitle}}</v-flex>
   </v-layout>
   <div class="ellipsis subtoolbar-title subtoolbar-title-single" v-else>{{headerTitle}}</div>
   <v-spacer></v-spacer>
   <v-btn flat icon v-if="showRatingButton && items.length>1" @click.stop="setAlbumRating()" class="toolbar-button" :title="trans.albumRating"><v-icon>stars</v-icon></v-btn>
   <template v-for="(action, index) in tbarActions">
    <v-btn flat icon @click.stop="headerAction(action)" class="toolbar-button" :title="B_ACTIONS[action].title">
      <img v-if="B_ACTIONS[action].svg" class="svg-img" :src="B_ACTIONS[action].svg | svgIcon(darkUi)"></img>
      <v-icon v-else>{{B_ACTIONS[action].icon}}</v-icon>
    </v-btn>
   </template>
  </v-layout>
 </div>
 <v-progress-circular class="browse-progress" v-if="fetchingItems" color="primary" size=72 width=6 indeterminate></v-progress-circular>
 <div v-show="letter" id="letterOverlay"></div>

 <div v-if="grid.use">
  <div class="noselect bgnd-cover lms-jumplist" v-if="filteredJumplist.length>1 && items.length>10">
   <template v-for="(item) in filteredJumplist">
    <div @click="jumpTo(item)">{{item.key==' ' || item.key=='' ? '?' : item.key}}</div>
   </template>
  </div>
  <div class="lms-image-grid noselect bgnd-cover" id="browse-grid" style="overflow:auto;" v-bind:class="{'lms-image-grid-jump': filteredJumplist.length>1 && items.length>10}">
  <RecycleScroller v-if="items.length>LMS_MIN_GRID_SCROLLER_ITEMS" :items="grid.rows" :item-size="GRID_SIZES[grid.size].ih" page-mode key-field="id">
   <table slot-scope="{item, index}" :class="['full-width', GRID_SIZES[grid.size].clz]">
    <td align="center" style="vertical-align: top" v-for="(col, cidx) in item.cols" :key="col.id"><v-card flat align="left" class="image-grid-item">
     <div v-if="col.blank" class="image-grid-item"></div>
     <div v-else class="image-grid-item" @click="click(items[col.id], col.id, $event)" :title="items[col.id] | tooltip">
      <v-btn icon color="primary" v-if="selection.length>0" class="image-grid-select-btn" @click.stop="select(items[col.id], col.id)">
       <v-icon>{{items[col.id].selected ? 'check_box' : 'check_box_outline_blank'}}</v-icon>
      </v-btn>
      <img :key="items[col.id].image" :src="items[col.id].image" class="image-grid-item-img"></img>
      <div class="image-grid-text">{{items[col.id].title}}</div>
      <div class="image-grid-text subtext" @click.stop="clickSubtitle(items[col.id], col.id, $event)">{{items[col.id].subtitle}}</div>
      <v-btn flat icon @click.stop="itemMenu(items[col.id], col.id, $event)" class="image-grid-btn">
       <v-icon>more_vert</v-icon>
      </v-btn>
     </div>
    </v-card></td>
   </table>
  </RecycleScroller>
  <table v-else v-for="(row, ridx) in grid.rows" :key="row.id" :class="[grid.few ? '' : 'full-width', GRID_SIZES[grid.size].clz]">
   <td align="center" style="vertical-align: top" v-for="(col, cidx) in row.cols" :key="col.id"><v-card flat align="left" class="image-grid-item">
    <div v-if="col.blank" class="image-grid-item"></div>
    <div v-else-if="items[col.id].type=='image'" class="image-grid-item" v-bind:class="{'image-grid-item-few': grid.few}" :title="items[col.id] | tooltip">
     <v-img :src="items[col.id].thumb" :lazy-src="items[col.id].thumb" aspect-ratio="1" class="image-grid-item-img" @click="showImage(col.id)"></v-img>
     {{items[col.id].caption}}
    </div>
    <div v-else :class="['image-grid-item', SECTION_RADIO==items[col.id].section ? 'radio-image' : '', grid.few ? 'image-grid-item-few' : '']" @click="click(items[col.id], col.id, $event)" :title="items[col.id] | tooltip">
     <v-btn icon color="primary" v-if="selection.length>0" class="image-grid-select-btn" @click.stop="select(items[col.id], col.id)">
      <v-icon>{{items[col.id].selected ? 'check_box' : 'check_box_outline_blank'}}</v-icon>
     </v-btn>
     <img v-lazy="items[col.id].image" class="image-grid-item-img"></img>
     <div class="image-grid-text">{{items[col.id].title}}</div>
     <div class="image-grid-text subtext" @click.stop="clickSubtitle(items[col.id], col.id, $event)">{{items[col.id].subtitle}}</div>
     <v-btn flat icon v-if="items[col.id].menu && items[col.id].menu.length>0" @click.stop="itemMenu(items[col.id], col.id, $event)" class="image-grid-btn">
      <v-icon v-if="items[col.id].menu && items[col.id].menu.length>1">more_vert</v-icon>
      <v-icon v-else-if="items[col.id].menu && items[col.id].menu.length===1 && undefined==B_ACTIONS[items[col.id].menu[0]].svg" :title="B_ACTIONS[items[col.id].menu[0]].title">{{B_ACTIONS[items[col.id].menu[0]].icon}}</v-icon>
      <img v-else-if="items[col.id].menu && items[col.id].menu.length===1" :title="B_ACTIONS[items[col.id].menu[0]].title" class="svg-img" :src="B_ACTIONS[items[col.id].menu[0]].svg | svgIcon(darkUi)"></img>
     </v-btn>
    </div>
   </v-card></td>
  </table>
 </div></div>
 <div v-else>

 <div class="noselect bgnd-cover lms-jumplist" v-if="filteredJumplist.length>1 && items.length>10">
  <template v-for="(item) in filteredJumplist">
   <div @click="jumpTo(item)">{{item.key==' ' || item.key=='' ? '?' : item.key}}</div>
  </template>
 </div>

 <v-list class="noselect bgnd-cover" v-bind:class="{'lms-list': !headerTitle, 'lms-list-sub': headerTitle, 'lms-list-jump': filteredJumplist.length>1 && items.length>10}" id="browse-list">
  <v-subheader v-if="isTop && pinned.length>0" @click="toggleGroup(GROUP_PINNED)"><v-icon>{{collapsed[GROUP_PINNED] ? 'arrow_right' : 'arrow_drop_down'}}</v-icon>{{ trans.pinned }}</v-subheader>
  <template v-if="isTop" v-for="(item, index) in pinned">
   <v-divider v-if="index>0 && pinned.length>index && !collapsed[GROUP_PINNED]"></v-divider>

   <v-list-tile v-if="!collapsed[GROUP_PINNED]" avatar @click="click(item, index, $event)" :key="item.id">
    <v-list-tile-avatar v-if="item.image" :tile="true" class="lms-avatar">
     <img v-lazy="item.image">
    </v-list-tile-avatar>
    <v-list-tile-avatar v-else-if="item.icon" :tile="true" class="lms-avatar">
     <v-icon>{{item.icon}}</v-icon>
    </v-list-tile-avatar>
    <v-list-tile-avatar v-else-if="item.svg" :tile="true" class="lms-avatar">
      <img class="svg-list-img" :src="item.svg | svgIcon(darkUi)"></img>
    </v-list-tile-avatar>

    <v-list-tile-content>
     <v-list-tile-title v-html="item.title"></v-list-tile-title>
    </v-list-tile-content>

    <v-list-tile-action :title="B_ACTIONS[UNPIN_ACTION].title" @click.stop="itemAction(UNPIN_ACTION, item, index)">
     <v-btn icon>
      <img class="svg-img" :src="B_ACTIONS[UNPIN_ACTION].svg | svgIcon(darkUi)"></img>
     </v-btn>
    </v-list-tile-action>

   </v-list-tile>
  </template>

  <RecycleScroller v-if="items.length>=LMS_MIN_LIST_SCROLLER_ITEMS" :items="items" :item-size="LMS_LIST_ELEMENT_SIZE" page-mode key-field="id">
   <v-list-tile avatar @click="click(item, index, $event)" slot-scope="{item, index}">
    <v-list-tile-avatar v-if="item.selected || item.image" :tile="true" class="lms-avatar">
     <v-icon v-if="item.selected">check_box</v-icon>
     <img v-else :key="item.image" :src="item.image"></img>
    </v-list-tile-avatar>

    <!-- TODO: Do we have search fields with large lists?? -->
    <v-subheader v-if="item.header">{{item.header}}</v-subheader>
    <v-list-tile-content v-else>
     <v-list-tile-title>{{item.title}}</v-list-tile-title>
      <v-list-tile-sub-title v-html="item.subtitle" @click.stop="clickSubtitle(item, index, $event, $event)"></v-list-tile-sub-title>
    </v-list-tile-content>

    <v-list-tile-action v-if="item.menu" @click.stop="itemMenu(item, index, $event)">
     <v-btn icon>
      <v-icon>more_vert</v-icon>
     </v-btn>
    </v-list-tile-action>
   </v-list-tile>
  </RecycleScroller>

  <template v-else v-for="(item, index) in items">
   <v-subheader v-if="item.header" @click="toggleGroup(item.group)" style="width:100%"><v-icon v-if="undefined!=item.group">{{collapsed[item.group] ? 'arrow_right' : 'arrow_drop_down'}}</v-icon>{{ libraryName && item.id==TOP_MMHDR_ID ? item.header +" ("+libraryName+")" : item.header }}
    <div v-if="item.action" :title="item.action.title" style="margin-left:auto; margin-right:-16px" @click.stop="itemAction(item.action, item, index)">
     <v-btn icon><v-icon>{{B_ACTIONS[item.action].icon}}</v-icon></v-btn>
    </div>
   </v-subheader>

   <v-divider v-else-if="!current && !item.disabled && (undefined==item.group || !collapsed[item.group]) && index>0 && items.length>index && !items[index-1].header" :inset="item.inset"></v-divider>
   <v-list-tile v-if="item.type=='text' && canClickText(item)" avatar @click="click(item, index, $event)" v-bind:class="{'error-text': item.id==='error'}" class="lms-avatar">
    <v-list-tile-content>
     <v-list-tile-title v-html="item.title"></v-list-tile-title>
     <v-list-tile-sub-title v-html="item.subtitle"></v-list-tile-sub-title>
    </v-list-tile-content>
   </v-list-tile>
   <p v-else-if="item.type=='text'" class="browse-text" v-html="item.title"></p>
   <v-list-tile v-else-if="!item.disabled && (undefined==item.group || !collapsed[item.group]) && !item.header" avatar @click="click(item, index, $event)" :key="item.id" class="lms-avatar" :id="'item'+index">
    <v-list-tile-avatar v-if="item.selected" :tile="true" class="lms-avatar">
     <v-icon>check_box</v-icon>
    </v-list-tile-avatar>
    <v-list-tile-avatar v-else-if="item.image" :tile="true" v-bind:class="{'radio-image': SECTION_RADIO==item.section}" class="lms-avatar">
     <img v-lazy="item.image"></img>
    </v-list-tile-avatar>
    <v-list-tile-avatar v-else-if="item.icon" :tile="true" class="lms-avatar">
     <v-icon>{{item.icon}}</v-icon>
    </v-list-tile-avatar>
    <v-list-tile-avatar v-else-if="item.svg" :tile="true" class="lms-avatar">
      <img class="svg-list-img" :src="item.svg | svgIcon(darkUi)"></img>
    </v-list-tile-avatar>
    <v-list-tile-avatar v-else-if="selection.length>0" :tile="true" class="lms-avatar">
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
     <v-list-tile-sub-title v-html="item.subtitle" @click.stop="clickSubtitle(item, index, $event)"></v-list-tile-sub-title>
    </v-list-tile-content>

    <v-list-tile-action v-if="item.menu && item.menu.length>1" @click.stop="itemMenu(item, index, $event)">
     <v-btn icon>
      <v-icon>more_vert</v-icon>
     </v-btn>
    </v-list-tile-action>
    <v-list-tile-action v-else-if="item.menu && item.menu.length===1" :title="B_ACTIONS[item.menu[0]].title" @click.stop="itemAction(item.menu[0], item, index)">
     <v-btn icon>
      <v-icon v-if="undefined==B_ACTIONS[item.menu[0]].svg">{{B_ACTIONS[item.menu[0]].icon}}</v-icon>
      <img v-else class="svg-img" :title="B_ACTIONS[item.menu[0]].title" :src="B_ACTIONS[item.menu[0]].svg | svgIcon(darkUi)"></img>
     </v-btn>
    </v-list-tile-action>
   </v-list-tile>
   <v-divider v-if="current"></v-divider>
  </template>

  <v-list-tile class="lms-list-pad"></v-list-tile>
 </v-list>
 </div>

 <v-menu v-model="menu.show" :position-x="menu.x" :position-y="menu.y">
  <v-list v-if="menu.item">
   <template v-for="(action, index) in menu.item.menu">
    <v-divider v-if="DIVIDER==action"></v-divider>
    <v-list-tile v-else-if="action==ADD_TO_FAV_ACTION && isInFavorites(menu.item)" @click="itemAction(REMOVE_FROM_FAV_ACTION, menu.item, menu.index)">
     <v-list-tile-title>
      <div v-if="undefined==B_ACTIONS[REMOVE_FROM_FAV_ACTION].svg"><v-icon>{{B_ACTIONS[REMOVE_FROM_FAV_ACTION].icon}}</v-icon>&nbsp;&nbsp;{{B_ACTIONS[REMOVE_FROM_FAV_ACTION].title}}</div>
      <div v-else><img class="svg-img" :src="B_ACTIONS[REMOVE_FROM_FAV_ACTION].svg | svgIcon(darkUi)"></img>&nbsp;&nbsp;{{B_ACTIONS[REMOVE_FROM_FAV_ACTION].title}}</div>
     </v-list-tile-title>
    </v-list-tile>
    <v-list-tile v-else @click="itemAction(action, menu.item, menu.index)">
     <v-list-tile-title>
      <div v-if="undefined==B_ACTIONS[action].svg"><v-icon>{{B_ACTIONS[action].icon}}</v-icon>&nbsp;&nbsp;{{B_ACTIONS[action].title}}</div>
      <div v-else><img class="svg-img" :src="B_ACTIONS[action].svg | svgIcon(darkUi)"></img>&nbsp;&nbsp;{{B_ACTIONS[action].title}}</div>
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
</div>
      `,
    props: [ 'desktop' ],
    data() {
        return {
            current: undefined,
            items: [],
            grid: {use:false, numColumns:0, size:GRID_SIZES.length-1, rows:[], few:false},
            fetchingItems: false,
            dialog: { show:false, title:undefined, hint:undefined, ok: undefined, cancel:undefined, command:undefined},
            trans: { ok:undefined, cancel: undefined, selectMultiple:undefined, addall:undefined, playall:undefined, albumRating:undefined,
                     deleteall:undefined, removeall:undefined },
            menu: { show:false, item: undefined, x:0, y:0},
            isTop: true,
            pinned: [],
            libraryName: undefined,
            selection: [],
            collapsed: [false, false, false],
            showRatingButton: false,
            section: undefined,
            letter: undefined,
            filteredJumplist: []
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
        this.currentLibId = null;
        this.headerTitle = null;
        this.headerSubTitle=null;
        this.tbarActions=[];
        var col=getLocalStorageVal('collapsed', "").split(",");
        for (var i=0, len=col.length, tlen=this.collapsed.length; i<len && i<tlen; ++i) {
           this.collapsed[i] = "true" == col[i];
        }
        this.options={artistImages: getLocalStorageBool('artistImages', false),
                      noGenreFilter: getLocalStorageBool('noGenreFilter', false),
                      noRoleFilter: getLocalStorageBool('noRoleFilter', false),
                      pinned: new Set()};
        this.separateArtists=getLocalStorageBool('separateArtists', false);
        this.randomMix=getLocalStorageBool('randomMix', true);
        this.dynamicPlaylists=getLocalStorageBool('dynamicPlaylists', false);
        this.remoteLibraries=getLocalStorageBool('remoteLibraries', true);
        this.cdPlayer=getLocalStorageBool('cdPlayer', false);
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
        this.grid = {use:false, numColumns:0, size:GRID_SIZES.length-1, rows:[], few:false};

        if (!this.desktop) {
            this.isActive = this.$store.state.page=='browse';
            // Clicking on 'browse' nav button whilst in browse page goes back.
            bus.$on('nav', function(page) {
                if ('browse'==page) {
                    if (!this.isActive) {
                        this.isActive = true;
                    } else if (this.history.length>0) {
                        this.goBack();
                    }
                } else {
                    this.isActive = false;
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
            this.goHome();
            this.itemAction(MORE_LIB_ACTION, item);
        }.bind(this));

        bus.$on('browse', function(cmd, params, title) {
            this.goHome();
            this.fetchItems(this.replaceCommandTerms({command:cmd, params:params}), {cancache:false, id:"<>", title:title});
        }.bind(this));

        bus.$on('refreshList', function(section) {
            if (this.current && this.current.section==section) {
                this.refreshList();
            }
        }.bind(this));
        bus.$on('ratingsSet', function(ids, value) {
            if (ids.length>1) {
                this.getRatings();
            } else {
                this.items.forEach(i=>{
                    if (i.id==ids[0]) {
                        i.rating = value;
                        i.subtitle = ratingString(i.subtitle, i.rating);
                    }
                });
            }
        }.bind(this));
    },
    methods: {
        initItems() {
            B_ACTIONS[PLAY_ACTION].title=B_ACTIONS[PLAY_ALL_ACTION].title=i18n("Play now");
            B_ACTIONS[PLAY_ALBUM_ACTION].title=i18n("Play album starting at track");
            B_ACTIONS[ADD_ACTION].title=B_ACTIONS[ADD_ALL_ACTION].title=i18n("Append to queue");
            B_ACTIONS[ADD_RANDOM_ALBUM_ACTION].title=i18n("Append random album to queue");
            B_ACTIONS[INSERT_ACTION].title=i18n("Play next");
            B_ACTIONS[MORE_ACTION].title=i18n("More");
            B_ACTIONS[MORE_LIB_ACTION].title=i18n("More");
            B_ACTIONS[RENAME_PL_ACTION].title=i18n("Rename");
            B_ACTIONS[RENAME_FAV_ACTION].title=i18n("Rename");
            B_ACTIONS[EDIT_FAV_ACTION].title=i18n("Edit");
            B_ACTIONS[ADD_FAV_ACTION].title=i18n("Add favorite");
            B_ACTIONS[DELETE_ACTION].title=i18n("Delete");
            B_ACTIONS[ADD_TO_FAV_ACTION].title=i18n("Add to favorites");
            B_ACTIONS[REMOVE_FROM_FAV_ACTION].title=i18n("Remove from favorites");
            B_ACTIONS[PIN_ACTION].title=i18n("Pin to main page");
            B_ACTIONS[UNPIN_ACTION].title=i18n("Un-pin from main page");
            B_ACTIONS[SELECT_ACTION].title=i18n("Select");
            B_ACTIONS[UNSELECT_ACTION].title=i18n("Un-select");
            B_ACTIONS[RATING_ACTION].title=i18n("Set rating");
            B_ACTIONS[SEARCH_LIB_ACTION].title=i18n("Search");
            B_ACTIONS[USE_GRID_ACTION].title=B_ACTIONS[USE_LIST_ACTION].title=i18n("Toggle view");
            this.trans= { ok:i18n('OK'), cancel: i18n('Cancel'), pinned: i18n('Pinned Items'), selectMultiple:i18n("Select multiple items"),
                          addall:i18n("Add selection to queue"), playall:i18n("Play selection"), albumRating:i18n("Set rating for all tracks"),
                          deleteall:i18n("Delete all selected items"), removeall:i18n("Remove all selected items") };

            this.top = [
                { header: i18n("My Music"), id: TOP_MMHDR_ID, group: GROUP_MY_MUSIC, action:SEARCH_LIB_ACTION },
                { title: this.separateArtists ? i18n("All Artists") : i18n("Artists"),
                  command: ["artists"],
                  params: ["tags:s"],
                  cancache: true,
                  icon: "group",
                  type: "group",
                  group: GROUP_MY_MUSIC,
                  id: TOP_ID_PREFIX+"ar" },
                { title: i18n("Albums"),
                  command: ["albums"],
                  params: [ALBUM_TAGS, SORT_KEY+ALBUM_SORT_PLACEHOLDER],
                  cancache: true,
                  icon: "album",
                  type: "group",
                  group: GROUP_MY_MUSIC,
                  id: TOP_ID_PREFIX+"al" },
                { title: i18n("Genres"),
                  command: ["genres"],
                  params: ["tags:s"],
                  cancache: true,
                  icon: "label",
                  type: "group",
                  group: GROUP_MY_MUSIC,
                  id: TOP_GENRES_ID },
                { title: i18n("Playlists"),
                  command: ["playlists"],
                  params: ["tags:s"],
                  icon: "list",
                  type: "group",
                  group: GROUP_MY_MUSIC,
                  id: TOP_PLAYLISTS_ID,
                  section: SECTION_PLAYLISTS }
                ];
            this.addExtraItems(this.top, true);
            if (this.separateArtists) {
                this.top.splice(1, 0, { title: i18n("Album Artists"),
                                        command: ["artists"],
                                        params: ["role_id:ALBUMARTIST", "tags:s"],
                                        cancache: true,
                                        icon: "group",
                                        type: "group",
                                        group: GROUP_MY_MUSIC,
                                        id: TOP_ID_PREFIX+"aar" });
            }

            var otherPrev = [];
            if (this.other) {
                if (this.other.length>6) {
                    for (var i=0, len=this.other.length-7; i<len; ++i) {
                        otherPrev.unshift(this.other[i]);
                    }
                }
            }
            this.other = [
                { title: i18n("Compilations"),
                  command: ["albums"],
                  params: ["compilation:1", ALBUM_TAGS, SORT_KEY+ALBUM_SORT_PLACEHOLDER],
                  cancache: true,
                  icon: "album",
                  type: "group",
                  id: TOP_ID_PREFIX+"co" },
                { title: i18n("Random Albums"),
                  command: ["albums"],
                  params: [ALBUM_TAGS, SORT_KEY+"random"],
                  svg: "dice-album",
                  type: "group",
                  id: TOP_RANDOM_ALBUMS_ID },
                { title: i18n("Random Mix"),
                  svg: "dice-multiple",
                  id: TOP_RANDOM_MIX_ID,
                  type: "app",
                  disabled: !this.randomMix },
                { title: i18n("Dynamic Playlists"),
                  command: ["dynamicplaylist", "browsejive"],
                  params: [],
                  svg: "dice-list",
                  type: "group",
                  id: TOP_DYNAMIC_PLAYLISTS_ID,
                  disabled: !this.dynamicPlaylists },
                { title: i18n("Years"),
                  command: ["years"],
                  params: [],
                  cancache: true,
                  icon: "date_range",
                  type: "group",
                  id: TOP_ID_PREFIX+"yr" },
                { title: i18n("New Music"),
                  command: ["albums"],
                  params: [ALBUM_TAGS, SORT_KEY+"new"],
                  icon: "new_releases",
                  type: "group",
                  id: TOP_NEW_MUSIC_ID }
                ];
            otherPrev.forEach(i=> {
                this.other.unshift(i);
            });
            if (undefined!=this.serverTop && this.serverTop.length>0) {
                this.serverTop[0].title=this.top[0].title;
            } else {
                this.serverTop=this.top;
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
            prev.jumplist = this.jumplist;
            prev.baseActions = this.baseActions;
            prev.listSize = this.listSize;
            prev.current = this.current;
            prev.currentLibId = this.currentLibId;
            prev.currentBaseActions = this.currentBaseActions;
            prev.headerTitle = this.headerTitle;
            prev.headerSubTitle = this.headerSubTitle;
            prev.tbarActions = this.tbarActions;
            prev.pos = this.scrollElement.scrollTop;
            prev.grid = this.grid;
            prev.command = this.command;
            prev.showRatingButton = this.showRatingButton;
            this.history.push(prev);
        },
        fetchItems(command, item, batchSize) {
            if (this.fetchingItems) {
                return;
            }

            this.fetchingItems = true;
            var start = item.range ? item.range.start : 0;
            var count = undefined!=batchSize && batchSize>0 ? batchSize : (item.range && item.range.count < LMS_BATCH_SIZE ? item.range.count : LMS_BATCH_SIZE);
            lmsList(this.playerId(), command.command, command.params, start, count, item.cancache).then(({data}) => {
                this.options.ratingsSupport=this.$store.state.ratingsSupport;
                var resp = parseBrowseResp(data, item, this.options, 0, item.cancache ? cacheKey(command.command, command.params, start, count) : undefined);
                this.handleListResponse(item, command, resp);
                this.fetchingItems = false;
                this.getRatings();
            }).catch(err => {
                this.fetchingItems = false;
                if (!axios.isCancel(err)) {
                    logAndShowError(err, undefined, command.command, command.params, start, count);
                }
            });
        },
        handleListResponse(item, command, resp) {
            if (resp && resp.items && (resp.items.length>0 || (command.command.length==1 && ("artists"==command.command[0] || "albums"==command.command[0])))) {
                this.addHistory();
                this.command = command;
                this.currentBaseActions = this.baseActions;
                this.headerTitle=item.title ? (item.range && this.current && this.current.title ? this.current.title+": "+item.title : item.title) : "?";
                this.current = item;
                this.currentLibId = command.libraryId;
                this.listSize = item.range ? item.range.count : resp.total;
                this.items=resp.items;
                this.jumplist=resp.jumplist;
                this.filteredJumplist = [];
                this.baseActions=resp.baseActions;
                this.tbarActions=[];
                this.isTop = false;
                var changedView = this.grid.use != resp.useGrid;
                this.grid = {use: resp.canUseGrid && isSetToUseGrid(command), numColumns:0, size:GRID_SIZES.length-1, rows:[], few:false};

                if (this.current && this.current.menu) {
                    for (var i=0, len=this.current.menu.length; i<len; ++i) {
                        if (this.current.menu[i]==ADD_ACTION || this.current.menu[i]==PLAY_ACTION) {
                            this.tbarActions=[ADD_ACTION, PLAY_ACTION];
                            break;
                        }
                    }
                }

                // Select track -> More -> Album:AlbumTitle -> Tracks
                if (this.tbarActions.length==0 && this.current && this.current.actions && this.current.actions.play) {
                    this.tbarActions=[ADD_ACTION, PLAY_ACTION];
                }
                // No menu actions? If first item is playable, add a PlayAll/AddAll to toolbar...
                if (this.tbarActions.length==0 && !item.range && (!item.id || !item.id.startsWith(TOP_ID_PREFIX)) && this.items.length>0 && this.items[0].menu &&
                   !(this.command.command.length>0 && (this.command.command[0]=="trackinfo" || this.command.command[0]=="artistinfo" ||
                                                       this.command.command[0]=="albuminfo") || this.command.command[0]=="genreinfo")) {
                    for (var i=0, len=this.items[0].menu.length; i<len; ++i) {
                        if (this.items[0].menu[i]==ADD_ACTION || this.items[0].menu[i]==PLAY_ACTION) {
                            this.tbarActions=[ADD_ALL_ACTION, PLAY_ALL_ACTION];
                            // If first item's id is xx.yy.zz then use xx.yy as playall/addall id
                            if (this.items[0].params && this.items[0].params.item_id) {
                                var parts = this.items[0].params.item_id.split(".");
                                if (parts.length>1) {
                                    parts.pop();
                                    this.current.allid = "item_id:"+parts.join(".");
                                }
                            }
                            break;
                        }
                    }
                }
                if (this.tbarActions.length==0 && SECTION_FAVORITES==this.current.section && this.current.isFavFolder) {
                    this.tbarActions=[ADD_FAV_ACTION];
                }
                if (resp.canUseGrid) {
                    this.tbarActions.unshift(this.grid.use ? USE_GRID_ACTION : USE_LIST_ACTION);
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
                this.$nextTick(function () {
                    if (changedView) {
                        this.setScrollElement();
                    }
                    this.setBgndCover();
                    this.filterJumplist();
                    this.layoutGrid();
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
                var message = resp.items && 1==resp.items.length && "text"==resp.items[0].type && resp.items[0].title && resp.items[0].id!='empty'
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
            } else if (command.command.length>3 && command.command[1]=="playlist" && command.command[2]=="play") {
                bus.$emit('showMessage', item.title);
                this.goBack(true);
            } else {
                this.handleListResponse(item, command, resp);
            }
        },
        canClickText(item) {
            return (item.style && item.style.startsWith('item') && item.style!='itemNoAction') || (!item.style && ( (item.actions && item.actions.go) || item.nextWindow || item.params /*CustomBrowse*/));
        },
        doTextClick(item) {
            var command = this.buildCommand(item);
            if (command.command.length==2 && ("items"==command.command[1] || "browsejive"==command.command[1] || "jiveplaylistparameters"==command.command[1])) {
                this.fetchingItems = true;
                lmsList(this.playerId(), command.command, command.params, 0, LMS_BATCH_SIZE).then(({data}) => {
                    this.fetchingItems = false;
                    this.handleTextClickResponse(item, command, data);
                }).catch(err => {
                    this.fetchingItems = false;
                    logError(err, command.command, command.params);
                });
            } else if (command.command.length>0) {
                if (command.params) {
                    command.params.forEach(p => {
                        command.command.push(p);
                    });
                }
                lmsCommand(this.playerId(), command.command).then(({data}) => {
                    bus.$emit('refreshStatus');
                    logJsonMessage("RESP", data);
                    this.handleTextClickResponse(item, command, data);
                }).catch(err => {
                    logError(err, command.command);
                });
            }
        },
        click(item, index, event) {
            if (this.fetchingItems) {
                 return;
            }
            if (this.selection.length>0) {
                this.select(item, index);
                return;
            }
            if ("search"==item.type || "entry"==item.type) {
                return;
            }
            if ("audio"==item.type  || "track"==item.type ||
                ( ("itemplay"==item.style || "item_play"==item.style) && item.menu && item.menu.length>0) || // itemplay for dynamic playlists
                (item.goAction && (item.goAction == "playControl" || item.goAction == "play"))) {
                if (this.$store.state.showMenuAudio) {
                    this.itemMenu(item, index, event);
                }
                return;
            }
            if (isTextItem(item)) {
                if (this.canClickText(item)) {
                    this.doTextClick(item);
                }
                return;
            }

            if (TOP_MORE_ID===item.id) {
                this.addHistory();
                this.items = this.other;
                this.headerTitle = item.title;
                this.headerSubTitle = i18n("Extra browse modes");
                this.listSize = this.items.length;
                setScrollTop(this.scrollElement, 0);
                this.isTop = false;
            } else if (TOP_RANDOM_MIX_ID==item.id) {
                bus.$emit('dlg.open', 'rndmix');
            } else if (!item.genreArtists && item.command && 1==item.command.length && 1==item.params.length &&
                       "artists"==item.command[0] && item.params[0].startsWith("genre_id:") &&
                       this.current && this.current.id==TOP_GENRES_ID) {
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
                              params: [item.params[0], ALBUM_TAGS, SORT_KEY+ALBUM_SORT_PLACEHOLDER],
                              icon: "album",
                              type: "group",
                              id: item.id+"albums"}];
                this.headerTitle = item.title;
                if (CONDUCTOR_GENRES.has(item.title)) {
                    this.items.splice(0, 0, { title: i18n("Conductors"),
                                        command: ["artists"],
                                        params: ["role_id:CONDUCTOR", item.params[0]],
                                        cancache: true,
                                        icon: "group",
                                        type: "group",
                                        group: GROUP_MY_MUSIC,
                                        id: item.id+"conductors"});
                }
                if (COMPOSER_GENRES.has(item.title) || CONDUCTOR_GENRES.has(item.title)) {
                    this.items.splice(0, 0, { title: i18n("Composers"),
                                        command: ["artists"],
                                        params: ["role_id:COMPOSER", item.params[0]],
                                        cancache: true,
                                        icon: "group",
                                        type: "group",
                                        group: GROUP_MY_MUSIC,
                                        id: item.id+"composers"});
                }
                this.headerSubTitle = i18n("Select category")
                this.listSize = this.items.length;
                setScrollTop(this.scrollElement, 0);
                this.isTop = false;
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
            var browsePage = this;
            this.gallery = new PhotoSwipe(document.querySelectorAll('.pswp')[0], PhotoSwipeUI_Default, this.items, {index: index});
            this.gallery.listen('gettingData', function (index, item) {
                if (item.w < 1 || item.h < 1) {
                    var img = new Image();
                    img.onload = function () {
                        item.w = this.width;
                        item.h = this.height;
                        browsePage.gallery.updateSize(true);
                    };
                    img.src = item.src;
                }
            });
            this.gallery.init();
            bus.$emit('dialogOpen', 'browse-viewer', true);
            this.gallery.listen('close', function() { bus.$emit('dialogOpen', 'browse-viewer', false); });
        },
        search(event, item) {
            if (this.fetchingItems) {
                return;
            }
            this.enteredTerm = event.target._value;
            if (undefined==this.enteredTerm) {
                return
            }
            this.enteredTerm=this.enteredTerm.trim();
            if (isEmpty(this.enteredTerm)) {
                return;
            }
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

                    if (this.dialog.params) {
                        var params = [];
                        this.dialog.params.forEach(p => { params.push(p.replace(TERM_PLACEHOLDER, str)); });
                        this.fetchItems({command: command, params: params}, this.dialog.item);
                    } else {
                        lmsCommand(this.playerId(), command).then(({datax}) => {
                            logJsonMessage("RESP", datax);
                            this.refreshList();
                        }).catch(err => {
                            logAndShowError(err, this.dialog.command.length>2 && this.dialog.command[1]==='rename' ? i18n("Rename failed") : i18n("Failed"), command);
                        });
                    }
                }
                this.dialog = {};
            }
        },
        itemAction(act, item, index, suppressNotification) {
            if (!this.playerId()) {
                bus.$emit('showError', undefined, i18n("No Player"));
                return;
            }

            if (act===RENAME_PL_ACTION) {
                this.dialog = { show:true, title:i18n("Rename playlist"), hint:item.value, value:item.title, ok: i18n("Rename"), cancel:undefined,
                                command:["playlists", "rename", item.id, "newname:"+TERM_PLACEHOLDER]};
            } else if (act==RENAME_FAV_ACTION) {
                this.dialog = { show:true, title:i18n("Rename favorite"), hint:item.value, value:item.title, ok: i18n("Rename"), cancel:undefined,
                                command:["favorites", "rename", item.id, "title:"+TERM_PLACEHOLDER]};
            } else if (act==SEARCH_LIB_ACTION) {
                this.dialog = { show:true, title:i18n("Search library"), ok: i18n("Search"), cancel:undefined,
                                command:["search"], params:["tags:jlyAdt", "extended:1", "term:"+TERM_PLACEHOLDER], item:{title:i18n("Search"), id:TOP_SEARCH_ID}};
            } else if (act==ADD_FAV_ACTION) {
                bus.$emit('dlg.open', 'favorite', 'add');
            } else if (act==EDIT_FAV_ACTION) {
                bus.$emit('dlg.open', 'favorite', 'edit', item);
            } else if (act===DELETE_ACTION) {
                this.$confirm(i18n("Delete '%1'?", item.title), {buttonTrueText: i18n('Delete'), buttonFalseText: i18n('Cancel')}).then(res => {
                    if (res) {
                        if (item.id.startsWith("playlist_id:")) {
                            this.clearSelection();
                            var command = ["playlists", "delete", item.id];
                            lmsCommand(this.playerId(), command).then(({datax}) => {
                                logJsonMessage("RESP", datax);
                                this.refreshList();
                            }).catch(err => {
                                logAndShowError(err, i18n("Failed to delete playlist!"), command);
                            });
                        }
                    }
                });
            } else if (act===ADD_TO_FAV_ACTION) {
                updateItemFavorites(item);
                var favUrl = item.favUrl ? item.favUrl : item.url;
                var favIcon = item.favIcon;
                var favType = "audio";
                var favTitle = item.favTitle;

                if (item.presetParams && item.presetParams.favorites_url) {
                    favUrl = item.presetParams.favorites_url;
                    favIcon = item.presetParams.icon;
                    favType = item.presetParams.favorites_type;
                    if (item.presetParams.favorites_title) {
                        favTitle = item.presetParams.favorites_title;
                    }
                }

                var command = ["favorites", "exists", favUrl];
                lmsCommand(this.playerId(), command).then(({data})=> {
                    logJsonMessage("RESP", data);
                    if (data && data.result && data.result.exists==1) {
                        bus.$emit('showMessage', i18n("Already in favorites"));
                    } else {
                        command = ["favorites", "add", "url:"+favUrl, "title:"+favTitle];
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
                            logJsonMessage("RESP", data);
                            bus.$emit('showMessage', i18n("Added to favorites"));
                        }).catch(err => {
                            logAndShowError(err, i18n("Failed to add to favorites!"), command);
                        });
                    }
                }).catch(err => {
                    bus.$emit('showMessage', i18n("Failed to add to favorites!"));
                    logError(err, command);
                });
            } else if (act===REMOVE_FROM_FAV_ACTION) {
                var id = SECTION_FAVORITES==this.current.section ? item.id : lmsFavorites[item.presetParams && item.presetParams.favorites_url ? item.presetParams.favorites_url : item.favUrl].id;
                if (undefined==id) {
                    return;
                }
                this.$confirm(i18n("Remove '%1' from favorites?", item.title), {buttonTrueText: i18n('Remove'), buttonFalseText: i18n('Cancel')}).then(res => {
                    if (res) {
                        this.clearSelection();
                        var command = ["favorites", "delete", id];
                        lmsCommand(this.playerId(), command).then(({datax}) => {
                            logJsonMessage("RESP", datax);
                            this.refreshList();
                        }).catch(err => {
                            logAndShowError(err, i18n("Failed to remove favorite!"), command);
                        });
                    }
                });
            } else if (act===ADD_RANDOM_ALBUM_ACTION) {
                var params = [];
                item.params.forEach(p => { params.push(p); });
                params.push(SORT_KEY+"random");
                lmsList(this.playerId(), ["albums"], params, 0, 1).then(({data}) => {
                    var resp = parseBrowseResp(data, this.current, this.options);
                    if (1===resp.items.length && resp.items[0].id) {
                        var item = resp.items[0];
                        var command = ["playlistcontrol", "cmd:add", item.id];
                        lmsCommand(this.playerId(), command).then(({data}) => {
                            bus.$emit('refreshStatus');
                            bus.$emit('showMessage', i18n("Appended '%1' to the play queue", item.title));
                        }).catch(err => {
                            bus.$emit('showError', err);
                            logError(err, command);
                        });
                    } else {
                        bus.$emit('showError', undefined, i18n("Failed to find an album!"));
                    }
                }).catch(err => {
                    logAndShowError(err, undefined, ["albums"], params, 0, 1);
                });
            } else if (act===MORE_ACTION) {
                this.fetchItems(this.buildCommand(item, B_ACTIONS[act].cmd), item);
            } else if (act===MORE_LIB_ACTION) {
                if (item.id) {
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
            } else if (act===PIN_ACTION) {
                this.pin(item, true);
            } else if (act===UNPIN_ACTION) {
                this.pin(item, false);
            } else if (SELECT_ACTION===act) {
                var idx=this.selection.indexOf(index);
                if (idx<0) {
                    this.selection.push(index);
                    item.selected = true;
                    idx = item.menu.indexOf(SELECT_ACTION);
                    if (idx>-1) {
                        item.menu[idx]=UNSELECT_ACTION;
                    }
                }
            } else if (UNSELECT_ACTION===act) {
                var idx=this.selection.indexOf(index);
                if (idx>-1) {
                    this.selection.splice(idx, 1);
                    item.selected = false;
                    idx = item.menu.indexOf(UNSELECT_ACTION);
                    if (idx>-1) {
                        item.menu[idx]=SELECT_ACTION;
                    }
                }
            } else if (RATING_ACTION==act) {
                bus.$emit('dlg.open', 'rating', [item.id], item.rating);
            } else if (PLAY_ALBUM_ACTION==act) {
                var command = this.buildFullCommand(this.current, PLAY_ACTION, index);
                command.command.push("play_index:"+index);
                lmsCommand(this.playerId(), command.command).then(({data}) => {
                    logJsonMessage("RESP", data);
                    bus.$emit('refreshStatus');
                    if (!this.desktop) {
                        this.$store.commit('setPage', 'now-playing');
                    }
                }).catch(err => {
                    logAndShowError(err, undefined, command.command);
                });
            } else {
                var command = this.buildFullCommand(item, act, index);
                if (command.command.length===0) {
                    bus.$emit('showError', undefined, i18n("Don't know how to handle this!"));
                    return;
                }
                lmsCommand(this.playerId(), command.command).then(({data}) => {
                    logJsonMessage("RESP", data);
                    bus.$emit('refreshStatus');
                    if (!this.desktop) {
                        if (act===PLAY_ACTION) {
                            this.$store.commit('setPage', 'now-playing');
                        } else if (act===ADD_ACTION && (undefined==suppressNotification || !suppressNotification)) {
                            bus.$emit('showMessage', i18n("Appended '%1' to the play queue", item.title));
                        } else if (act==="insert") {
                            bus.$emit('showMessage', i18n("Inserted '%1' into the play queue", item.title));
                        }
                    }
                }).catch(err => {
                    logAndShowError(err, undefined, command.command);
                });
            }
        },
        itemMenu(item, index, event) {
            if (!item.menu) {
                return;
            }
            if (1==item.menu.length && item.menu[0]==MORE_ACTION) {
                // Only have 'More' - dont display menu, just activate action...
                this.itemAction(MORE_ACTION, item);
            } else if (1==item.menu.length && item.menu[0]==MORE_LIB_ACTION) {
                // Only have 'More' - dont display menu, just activate action...
                this.itemAction(MORE_LIB_ACTION, item);
            } else {
                this.menu={show:true, item:item, x:event.clientX, y:event.clientY, index:index};
            }
        },
        clickSubtitle(item, index, event) {
            if (!IS_MOBILE && item.id && item.artist_id && item.id.startsWith("album_id:")) {
                this.fetchItems(this.replaceCommandTerms({command:["albums"], params:["artist_id:"+item.artist_id, "tags:jlys", SORT_KEY+ARTIST_ALBUM_SORT_PLACEHOLDER]}),
                                {cancache:false, id:item.id, title:item.subtitle});
            } else {
                this.click(item, index, event);
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
            if (USE_LIST_ACTION==act) {
                this.changeLayout(true);
            } else if (USE_GRID_ACTION==act) {
                this.changeLayout(false);
            } else {
                this.itemAction(act, this.current);
            }
        },
        changeLayout(useGrid) {
            if (this.grid.use!=useGrid) {
                this.grid.use=useGrid;
                this.$nextTick(function () {
                    this.setScrollElement();
                    this.setBgndCover();
                    this.layoutGrid();
                    changeImageUrls(this.items, this.grid.use);
                    setUseGrid(this.command, this.grid.use);
                    var af = this.grid.use ? USE_LIST_ACTION : USE_GRID_ACTION;
                    var at = this.grid.use ? USE_GRID_ACTION : USE_LIST_ACTION;
                    for (var i=0, len=this.tbarActions.length; i<len; ++i) {
                        if (this.tbarActions[i] == af) {
                            this.tbarActions[i] = at;
                            break;
                        }
                    }
                    this.$forceUpdate(); // Otherwise tbarActions update is not always noticed
                });
            }
        },
        refreshList() {
            this.clearSelection();
            var pos=this.scrollElement.scrollTop;
            this.fetchingItems = true;
            lmsList(this.playerId(), this.command.command, this.command.params).then(({data}) => {
                var resp = parseBrowseResp(data, this.current, this.options, 0);
                this.items=resp.items;
                this.jumplist=resp.jumplist;
                this.filteredJumplist = [];
                if (resp && resp.total) {
                    this.listSize = resp.total;
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
                this.$nextTick(function () {
                    setScrollTop(this.scrollElement, pos>0 ? pos : 0);
                    this.filterJumplist();
                });
                this.fetchingItems = false;
            }).catch(err => {
                if (!axios.isCancel(err)) {
                    logAndShowError(err, undefined, this.command.command, this.command.params);
                }
                this.fetchingItems = false;
            });
        },
        goHome() {
            if (this.fetchingItems) {
                if (lmsListSource) {
                    this.fetchingItems = false;
                    lmsListSource.cancel(i18n('Operation cancelled by the user.'));
                } else {
                    return;
                }
            }
            var prev = this.history.length>0 ? this.history[0].pos : 0;
            this.items = this.getTop();
            this.jumplist = [];
            this.filteredJumplist = [];
            this.listSize = this.items.length;
            this.history=[];
            this.current = null;
            this.currentLibId = null;
            this.headerTitle = null;
            this.headerSubTitle=null;
            this.tbarActions=[];
            this.isTop = true;
            this.grid = {use:false, numColumns:0, size:GRID_SIZES.length-1, rows:[], few:false};
            this.command = undefined;
            this.showRatingButton = false;
            this.$nextTick(function () {
                this.setScrollElement();
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
        backBtnPressed(home) {
            if (home) {
                this.goHome();
            } else {
                this.goBack();
            }
        },
        goBack(refresh) {
            if (this.fetchingItems) {
                if (lmsListSource) {
                    this.fetchingItems = false;
                    lmsListSource.cancel(i18n('Operation cancelled by the user.'));
                }
                return;
            }
            if (this.history.length<2) {
                this.goHome();
                return;
            }
            var prev = this.history.pop();
            var changedView = this.grid.use != prev.grid.use;
            this.items = prev.items;
            this.jumplist = prev.jumplist;
            this.filteredJumplist = [];
            this.grid = prev.grid;
            this.baseActions = prev.baseActions;
            this.listSize = prev.listSize;
            this.current = prev.current;
            this.currentBaseActions = prev.currentBaseActions;
            this.headerTitle = prev.headerTitle;
            this.headerSubTitle = prev.headerSubTitle;
            this.tbarActions = prev.tbarActions;
            this.command = prev.command;
            this.showRatingButton = prev.showRatingButton;
            if (refresh) {
                this.refreshList();
            } else {
                this.$nextTick(function () {
                    if (changedView) {
                        this.setScrollElement();
                    }
                    this.setBgndCover();
                    this.filterJumplist();
                    this.layoutGrid();
                    setScrollTop(this.scrollElement, prev.pos>0 ? prev.pos : 0);
                });
            }
        },
        buildCommand(item, commandName, doReplacements) {
            var origCommand = undefined;

            // Faking addall/playall, so build add/play command for first item...
            if (B_ACTIONS[PLAY_ALL_ACTION].cmd==commandName || B_ACTIONS[ADD_ALL_ACTION].cmd==commandName) {
                item = this.items[0];
                origCommand = commandName;
                commandName = B_ACTIONS[PLAY_ALL_ACTION].cmd==commandName ? "play" : "add";
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
                var baseActions = this.current == item ? this.currentBaseActions : this.baseActions;
                var command = item.actions && item.actions[commandName]
                            ? item.actions[commandName]
                            : "go" == commandName && item.actions && item.actions["do"]
                                ? item.actions["do"]
                                : baseActions
                                    ? baseActions[commandName]
                                        ? baseActions[commandName]
                                        : "go" == commandName && baseActions["do"]
                                            ? baseActions["do"]
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
                    var addedParams = new Set();
                    if (command.params) {
                        for(var key in command.params) {
                            var param = key+":"+command.params[key];
                            cmd.params.push(param);
                            addedParams.add(param);
                        }
                    }
                    var isMore = "more" == commandName;
                    if (command.itemsParams && item[command.itemsParams]) {
                        for(var key in item[command.itemsParams]) {
                            if (/*!isMore ||*/ ("touchToPlaySingle"!=key && "touchToPlay"!=key)) {
                                var param = key+":"+item[command.itemsParams][key];
                                if (!addedParams.has(param)) {
                                    cmd.params.push(param);
                                }
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

                    for (var i=0, params=cmd.params, len=params.length; i<len; ++i) {
                        if (params[i].startsWith("mode:")) {
                            mode = params[i].split(":")[1];
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
                                p.push("tags:ds");
                            } else if (mode!="artists" && mode!="albums" && mode!="years" && mode!="genres" && mode!="tracks" && mode!="playlists" && mode!="vaalbums") {
                                canReplace = false;
                                break;
                            }
                            c.push(mode);
                        } else if (!params[i].startsWith("menu:")) {
                            if (params[i].startsWith("tags:")) {
                                if (params[i].split(":")[1].indexOf('s')<0) {
                                    i+='s';
                                }
                                p.push(params[i]);
                                hasTags = true;
                            } else {
                                p.push(params[i]);
                                if (params[i].startsWith(SORT_KEY)) {
                                    hasSort = true;
                                } else if (params[i].startsWith("artist_id:")) {
                                    hasArtistId = true;
                                }
                            }
                        }
                    }

                    if (canReplace && c.length==1 && mode) {
                        if (mode=="tracks") {
                            if (!hasTags) {
                                p.push(TRACK_TAGS);
                            }
                            if (!hasSort) {
                                p.push(SORT_KEY+"tracknum");
                            }
                        } else if (mode=="albums") {
                            if (!hasTags) {
                                p.push(ALBUM_TAGS);
                            }
                            if (!hasSort) {
                                p.push(SORT_KEY+(hasArtistId ? ARTIST_ALBUM_SORT_PLACEHOLDER : ALBUM_SORT_PLACEHOLDER));
                            }
                        } else if (!hasTags && (mode=="artists" || mode=="years" || mode=="genres" || mode=="playlists" || mode=="vaalbums")) {
                            p.push("tags:s");
                        }
                        cmd = {command: c, params: p};
                    }
                }
            }

            if (undefined==doReplacements || doReplacements) {
                cmd=this.replaceCommandTerms(cmd);
            }

            // If this *was* playall/addall, then need to convert back and set ID to parent
            if (origCommand && (B_ACTIONS[PLAY_ALL_ACTION].cmd==origCommand || B_ACTIONS[ADD_ALL_ACTION].cmd==origCommand)) {
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
                        c.params.push(undefined==this.current.allid ? this.current.id : this.current.allid);
                    } else {
                        c.params.push(p);
                    }
                });
                cmd=c;
            }
            return cmd;
        },
        buildFullCommand(item, act, index) {
            var command = this.buildCommand(item, B_ACTIONS[act].cmd);
            if (command.command.length<1) { // Non slim-browse command
                if (item.url) {
                    command.command = ["playlist", INSERT_ACTION==act ? "insert" : B_ACTIONS[act].cmd, item.url, item.title];
                } else if (item.app && item.id) {
                    command.command = [item.app, "playlist", INSERT_ACTION==act ? "insert" :B_ACTIONS[act].cmd, item.id];
                } else if (item.id) {
                    command.command = ["playlistcontrol", "cmd:"+(act==PLAY_ACTION ? "load" : INSERT_ACTION==act ? "insert" :B_ACTIONS[act].cmd)];

                    if (item.id.startsWith("album_id:")  || item.id.startsWith("artist_id:")) {
                        item.params.forEach(p => {
                            if ( (!this.options.noRoleFilter && (p.startsWith("role_id:") || p.startsWith("artist_id:"))) ||
                                 (!this.options.noGenreFilter && p.startsWith("genre_id:"))) {
                                if (!item.id.startsWith("artist_id:") || !p.startsWith("artist_id:")) {
                                    command.command.push(p);
                                }
                            }
                        });
                    }

                    command.command.push(originalId(item.id));
                }
                command=this.replaceCommandTerms(command);
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
            if (shouldAddLibraryId(cmd)) {
                // Check if command already has library_id
                var haveLibId = false;
                for (var i=0, len=cmd.params.length; i<len; ++i) {
                    if (cmd.params[i].startsWith("library_id:")) {
                        haveLibId = true;
                        cmd.libraryId = cmd.params[i].split(":")[1];
                        break;
                    }
                }
                if (!haveLibId) { // Command does not have libraey_id. Use lib from parent command (if set), or user's chosen library
                    var libId = this.currentLibId ? this.currentLibId : this.$store.state.library ? this.$store.state.library : LMS_DEFAULT_LIBRARY;
                    if (libId) {
                        cmd.params.push("library_id:"+libId);
                        cmd.libraryId = libId;
                    }
                }
            }

            // Replace sort and search terms
            if (cmd.params.length>0) {
                var modifiedParams = [];
                cmd.params.forEach(p => { modifiedParams.push(p.replace(SORT_KEY+ALBUM_SORT_PLACEHOLDER, SORT_KEY+this.$store.state.albumSort)
                                                               .replace(SORT_KEY+ARTIST_ALBUM_SORT_PLACEHOLDER, SORT_KEY+this.$store.state.artistAlbumSort)
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
                    for (var i=0, loop=data.result.folder_loop, len=loop.length; i<len; ++i) {
                        if (loop[i].id == this.$store.state.library) {
                            if (loop[i].id!=LMS_DEFAULT_LIBRARY) {
                                this.libraryName=loop[i].name;
                            }
                            break;
                        }
                    }
                }
            });
        },
        getTop() {
            return this.$store.state.serverMenus ? this.serverTop : this.top;
        },
        addExtraItems(list, addMore) {
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
                        section: SECTION_FAVORITES,
                        isFavFolder: true });
            list.push({ title: i18n("Apps"),
                        command: ["myapps", "items"],
                        params: ["menu:1"],
                        icon: "apps",
                        type: "group",
                        group: GROUP_OTHER_MUSIC,
                        id: TOP_APPS_ID,
                        section: SECTION_APPS });
            list.push({ title: i18n("CD Player"),
                        command: ["cdplayer", "items"],
                        params: [],
                        svg: "cd-player",
                        type: "group",
                        group: GROUP_OTHER_MUSIC,
                        id: TOP_CDPLAYER_ID,
                        disabled:!this.cdPlayer });
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
                    this.playerMenuTimeout = undefined;
                }
                this.playerMenuTimeout = setTimeout(function () {
                    this.playerMenuTimeout = undefined;
                    this.playerMenu();
                }.bind(this), 250);
                return;
            }

            this.fetchingItems=true;
            lmsList(this.playerId(), ["menu", "items"], ["direct:1"]).then(({data}) => {
                if (data && data.result && data.result.item_loop) {
                    this.serverTop = [];
                    this.serverTop.push({ header: i18n("My Music"), id: TOP_MMHDR_ID, weight:0, group: GROUP_MY_MUSIC, action:SEARCH_LIB_ACTION} );
                    data.result.item_loop.forEach(c => {
                        if (c.node=="myMusic" && c.id) {
                            if (c.id=="randomplay") {
                                this.serverTop.push({ title: i18n("Random Mix"),
                                                      svg: "dice-multiple",
                                                      id: TOP_RANDOM_MIX_ID,
                                                      group: GROUP_MY_MUSIC,
                                                      type: "app",
                                                      weight: c.weight ? parseFloat(c.weight) : 100 });
                            } else if (!c.id.startsWith("myMusicSearch") && !c.id.startsWith("opmlselect")) {
                                var command = this.buildCommand(c, "go", false);
                                var item = { title: c.text,
                                             command: command.command ,
                                             params: command.params,
                                             weight: c.weight ? parseFloat(c.weight) : 100,
                                             group: GROUP_MY_MUSIC,
                                             id: TOP_ID_PREFIX+c.id,
                                             type: "group",
                                             icon: "music_note"
                                            };

                                if (c.id.startsWith("myMusicArtists")) {
                                    item.icon = "group";
                                    item.cancache = true;
                                } else if (c.id.startsWith("myMusicAlbums")) {
                                    item.icon = "album";
                                    item.cancache = true;
                                } else if (c.id.startsWith("myMusicGenres")) {
                                    item.icon = "label";
                                    item.cancache = true;
                                    item.id = TOP_GENRES_ID;
                                } else if (c.id == "myMusicPlaylists") {
                                    item.icon = "list";
                                    item.id = TOP_PLAYLISTS_ID;
                                } else if (c.id.startsWith("myMusicYears")) {
                                    item.icon = "date_range";
                                    item.cancache = true;
                                } else if (c.id == "myMusicNewMusic") {
                                    item.icon = "new_releases";
                                    item.id=TOP_NEW_MUSIC_ID;
                                } else if (c.id.startsWith("myMusicMusicFolder")) {
                                    item.icon = "folder";
                                } else if (c.id.startsWith("myMusicFileSystem")) {
                                    item.icon = "computer";
                                } else if (c.id == "myMusicRandomAlbums") {
                                    item.svg = "dice-album";
                                    item.icon = undefined;
                                    item.id = TOP_RANDOM_ALBUMS_ID;
                                } else if (c.id.startsWith("myMusicTopTracks")) {
                                    item.icon = "arrow_upward";
                                } else if (c.id.startsWith("myMusicFlopTracks")) {
                                    item.icon = "arrow_downward";
                                } else if (c.id == "dynamicplaylist") {
                                    item.svg = "dice-list";
                                    item.icon = undefined;
                                } else if (c.id.startsWith("trackstat")) {
                                    item.icon = "bar_chart";
                                } else if (c.id == "custombrowse" || (c.menuIcon && c.menuIcon.endsWith("/custombrowse.png"))) {
                                    item.icon = "library_music";
                                } else if (c.icon) {
                                    if (c.icon.endsWith("/albums.png")) {
                                        item.icon = "album";
                                    } else if (c.icon.endsWith("/artists.png")) {
                                        item.icon = "group";
                                    } else if (c.icon.endsWith("/genres.png")) {
                                        item.icon = "label";
                                    }
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
                logAndShowError(err);
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
            for (var i=0, len=this.pinned.length; i<len; ++i) {
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
                if (item.menu) {
                    for (var i=0, len=item.menu.length; i<len; ++i) {
                        if (item.menu[i] == PIN_ACTION) {
                            item.menu[i] = UNPIN_ACTION;
                            break;
                        }
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

                        if (item.menu) {
                            for (var i=0, len=item.menu.length; i<len; ++i) {
                                if (item.menu[i] == UNPIN_ACTION) {
                                    item.menu[i] = PIN_ACTION;
                                    break;
                                }
                            }
                        }
                    }
                });
            }
        },
        clearSelection() {
            for (var i=0, len=this.selection.length; i<len; ++i) {
                var index = this.selection[i];
                if (index>-1 && index<this.items.length) {
                    var idx = this.items[index].menu.indexOf(UNSELECT_ACTION);
                    if (idx>-1) {
                        this.items[index].menu[idx]=SELECT_ACTION;
                        this.items[index].selected = false;
                    }
                }
            }
            this.selection = [];
        },
        select(item, index) {
            if (this.selection.length>0) {
                this.itemAction(this.selection.indexOf(index)<0 ? SELECT_ACTION : UNSELECT_ACTION, item, index);
            }
        },
        deleteSelectedItems() {
            if (1==this.selection.length) {
                this.itemAction(SECTION_FAVORITES==this.current.section ? REMOVE_FROM_FAV_ACTION : DELETE_ACTION, this.items[this.selection[0]], this.selection[0]);
            } else {
                this.$confirm(SECTION_FAVORITES==this.current.section ? i18n("Remove the selected items?") : i18n("Delete the selected items?"),
                             {buttonTrueText: SECTION_FAVORITES==this.current.section ? i18n("Remove") : i18n("Delete"),
                              buttonFalseText: i18n('Cancel')}).then(res => {
                    if (res) {
                        var ids=[];
                        this.selection.forEach(idx => {ids.push(this.items[idx].id)});
                        ids.sort(function(a, b) { return a<b ? 1 : -1; });
                        bus.$emit('doAllList', ids, this.current.section==SECTION_PLAYLISTS ? ["playlists", "delete"] : ["favorites", "delete"],
                                  this.current.section);
                        this.clearSelection();
                    }
                });
            }
        },
        addSelectedItems() {
            var commands=[]
            this.selection.sort(function(a, b) { return a<b ? -1 : 1; });
            for (var i=0, len=this.selection.length; i<len; ++i) {
                var idx = this.selection[i];
                if (idx>-1 && idx<this.items.length) {
                    commands.push({act:ADD_ACTION, item:this.items[idx], idx:idx});
                }
            }
            this.doCommands(commands);
            this.clearSelection();
        },
        playSelectedItems() {
            var commands=[]
            this.selection.sort(function(a, b) { return a<b ? -1 : 1; });
            for (var i=0, len=this.selection.length; i<len; ++i) {
                var idx = this.selection[i];
                if (idx>-1 && idx<this.items.length) {
                    commands.push({act:0==i ? PLAY_ACTION : ADD_ACTION, item:this.items[idx], idx:idx});
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
                    logJsonMessage("RESP", data);
                    this.doCommands(commands);
                }).catch(err => {
                    logError(err, command.command);
                });
            } else {
                bus.$emit('refreshStatus');
            }
        },
        setScrollElement() {
            this.scrollElement = document.getElementById(this.grid.use ? "browse-grid" : "browse-list");
            this.scrollElement.removeEventListener('scroll', this.handleScroll);
            if (this.$store.state.letterOverlay) {
                this.scrollElement.addEventListener('scroll', this.handleScroll);
            }
        },
        handleScroll() {
            if (undefined!=this.jumplist && this.jumplist.length>1 && !this.scrollAnimationFrameReq) {
                this.scrollAnimationFrameReq = window.requestAnimationFrame(() => { 
                    this.scrollAnimationFrameReq = undefined;
                    if (undefined!==this.letterTimeout) {
                        clearTimeout(this.letterTimeout);
                    }
                    var index = this.grid.use
                                    ? Math.floor((this.scrollElement.scrollTop / GRID_SIZES[this.grid.size].ih)*this.grid.numColumns)
                                    : Math.floor(this.scrollElement.scrollTop / LMS_LIST_ELEMENT_SIZE);
                    if (index>=0 && index<this.items.length) {
                        var letter = this.items[index].textkey;
                        if (this.letter!=letter) {
                            this.letter = letter;
                            this.letterOverlay.innerHTML = letter;
                        }
                        this.letterTimeout = setTimeout(function () {
                            this.letter = undefined;
                        }.bind(this), 500);
                    } else {
                        this.letter = undefined;
                    }
                });
            }
        },
        layoutGrid() {
            if (!this.grid.use) {
                return;
            }

            var changed = false;
            var listWidth = this.pageElement.scrollWidth- ((/*scrollbar*/ this.mobileBrowser ? 0 : 20) + (/*jumplist*/ this.filteredJumplist.length>1 && this.items.length>10 ? 32 :0) + /*padding-right*/16);

            // Calculate what grid item size we should use...
            var size = 0;
            for (var i=1; i<GRID_SIZES.length && listWidth>((GRID_SIZES[i].iw*2)+8); ++i) {
                size = i;
            }

            // How many columns?
            var numColumns = Math.min(Math.floor(listWidth/GRID_SIZES[size].iw), this.items.length);
            if (numColumns != this.grid.numColumns) { // Need to re-layout...
                changed = true;
                this.grid.rows=[];
                for (var i=0; i<this.items.length; i+=numColumns) {
                    var cols=[]
                    for (var j=0; j<numColumns; ++j) {
                        cols.push({id:i+j, blank:(i+j)>=this.items.length});
                    }
                    this.grid.rows.push({id:"row."+i+"."+numColumns, cols:cols});
                }
                this.grid.numColumns = numColumns;
            }

            if (this.grid.size != size) {
                this.grid.size = size;
                changed = true;
            }
            var few = 1==this.grid.rows.length && (1==this.items.length || ((this.items.length*GRID_SIZES[size].iw)*1.20)<listWidth);
            if (this.grid.few != few) {
                this.grid.few = few;
                changed = true;
            }
            if (changed) {
                this.$forceUpdate();
            }
        },
        setBgndCover() {
            var url = this.$store.state.browseBackdrop && this.current && this.current.image && !this.current.image.startsWith("/plugins/") ? this.current.image : undefined;

            if (url) {
               url=removeImageSizing(url);
            }
            setBgndCover(this.scrollElement, url, this.$store.state.darkUi);
        },
        getRatings() {
            this.showRatingButton = false;
            if (this.$store.state.ratingsSupport && this.listSize<=100 && this.items.length>1 && this.items.length==this.listSize &&
                !(this.current && this.current.id && this.current.id.startsWith("playlist_id:")) &&
                !(this.current && this.current.actions && this.current.actions.go && this.current.actions.go.cmd &&
                  this.current.actions.go.cmd.length>1 && this.current.actions.go.cmd[0]=="trackstat") &&
                this.items[0].id && this.items[0].id.startsWith("track_id:") &&
                this.items[this.items.length-1].id && this.items[this.items.length-1].id.startsWith("track_id:")) {
                this.showRatingButton = true;
                this.items.forEach(i => {
                    lmsCommand("", ["trackstat", "getrating", i.id.split(":")[1]]).then(({data}) => {
                        if (data && data.result && undefined!=data.result.ratingpercentage) {
                            i.rating = adjustRatingFromServer(data.result.ratingpercentage);
                            i.subtitle = ratingString(i.subtitle, i.rating);
                        }
                    });
                });
            }
        },
        setAlbumRating() {
            var ids = [];
            var rating = 0;
            var count = 0;
            this.items.forEach(i => {
                ids.push(i.id);
                if (i.rating && i.rating>0) {
                    rating+=i.rating;
                    count++;
                }
            });
            bus.$emit('dlg.open', 'rating', ids, Math.ceil(rating/count));
        },
        checkFeature(command, key, id) {
            lmsCommand("", command).then(({data}) => {
                if (data && data.result && undefined!=data.result._can) {
                    var can = 1==data.result._can;
                    if (can!=this[key]) {
                        this[key] = can;
                        setLocalStorageVal(key, this[key]);
                        for (var i=0, len=this.other.length; i<len; ++i) {
                            if (this.other[i].id == id) {
                                this.other[i].disabled = !this[key];
                            }
                        }
                    }
                }
            });
        },
        jumpTo(item) {
            var pos = this.grid.use
                        ? Math.floor(item.index/this.grid.numColumns)*GRID_SIZES[this.grid.size].ih
                        : item.index*LMS_LIST_ELEMENT_SIZE;
            setScrollTop(this.scrollElement, pos>0 ? pos : 0);
        },
        filterJumplist() {
            if (this.jumplist.length<=1) {
                return;
            }
            var maxItems = Math.floor((this.scrollElement.clientHeight-(16))/20);
            this.filteredJumplist = shrinkAray(this.jumplist, maxItems);
        }
    },
    mounted() {
        this.mobileBrowser = isMobile();
        this.pageElement = document.getElementById("browse-view");
        let timeout = undefined;
        window.addEventListener('resize', () => {
            if (this.items.length>=(this.grid.use ? LMS_MIN_GRID_SCROLLER_ITEMS : LMS_MIN_LIST_SCROLLER_ITEMS)) {
                if (timeout) {
                    clearTimeout(timeout);
                }
                timeout = setTimeout(() => {
                    this.filterJumplist();
                }, 50);
            }
        }, false);
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

        this.checkFeature(["can", "randomplay", "?"], "randomMix", TOP_RANDOM_MIX_ID);
        this.checkFeature(["can", "dynamicplaylist", "browsejive", "?"], "dynamicPlaylists", TOP_DYNAMIC_PLAYLISTS_ID);
        this.checkFeature(["can", "selectRemoteLibrary", "items", "?"], "remoteLibraries", TOP_REMOTE_ID);
        this.checkFeature(["can", "cdplayer", "items", "?"], "cdPlayer", TOP_CDPLAYER_ID);

        bus.$on('browseDisplayChanged', function(act) {
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

        bus.$on('splitterChanged', function() {
            this.layoutGrid();
        }.bind(this));
        bus.$on('windowWidthChanged', function() {
            this.layoutGrid();
        }.bind(this));
        bus.$on('themeChanged', function() {
            this.setBgndCover();
        }.bind(this));
        this.setBgndCover();
        this.letterOverlay=document.getElementById("letterOverlay");
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
        }
    },
    beforeDestroy() {
        if (this.playerMenuTimeout) {
            clearTimeout(this.playerMenuTimeout);
            this.playerMenuTimeout = undefined;
        }
    }
});
