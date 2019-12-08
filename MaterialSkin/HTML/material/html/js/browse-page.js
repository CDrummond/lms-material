/**
 * LMS-Material
 *
 * Copyright (c) 2018-2019 Craig Drummond <craig.p.drummond@gmail.com>
 * MIT license.
 */

var B_ALBUM_SORTS=[ ];

var lmsBrowse = Vue.component("lms-browse", {
    template: `
<div id="browse-view">
 <v-dialog v-model="dialog.show" v-if="dialog.show" persistent max-width="500px">
  <v-card>
   <v-card-title>{{dialog.title}}</v-card-title>
   <v-card-text>
    <v-text-field single-line :label="dialog.hint" v-model="dialog.value" @keyup.enter="dialogResponse(true);" ref="entry"></v-text-field>
   </v-card-text>
  <v-card-actions>
   <v-spacer></v-spacer>
   <v-btn flat @click.native="dialog.show = false; dialogResponse(false);">{{undefined===dialog.cancel ? trans.cancel : dialog.cancel}}</v-btn>
   <v-btn flat @click.native="dialogResponse(true);">{{undefined===dialog.ok ? trans.ok : dialog.ok}}</v-btn>
  </v-card-actions>
  </v-card>
 </v-dialog>
 <div v-if="headerTitle" class="subtoolbar noselect" v-bind:class="{'list-details' : selection.size>0}">
  <v-layout v-if="selection.size>0">
   <v-layout row wrap>
    <v-flex xs12 class="ellipsis subtoolbar-title subtoolbar-pad">{{trans.selectMultiple}}</v-flex>
    <v-flex xs12 class="ellipsis subtoolbar-subtitle subtext">{{selection.size | displaySelectionCount}}</v-flex>
   </v-layout>
   <v-spacer></v-spacer>
   <v-btn v-if="current && current.section==SECTION_PLAYLISTS && current.id.startsWith('playlist_id:')" :title="trans.removeall" flat icon class="toolbar-button" @click="deleteSelectedItems(REMOVE_ACTION)"><v-icon>{{ACTIONS[REMOVE_ACTION].icon}}</v-icon></v-btn>
   <v-btn v-else-if="current && current.section==SECTION_PLAYLISTS" :title="trans.deleteall" flat icon class="toolbar-button" @click="deleteSelectedItems(DELETE_ACTION)"><v-icon>delete</v-icon></v-btn>
   <v-btn v-else-if="current && current.section==SECTION_FAVORITES" :title="trans.removeall" flat icon class="toolbar-button" @click="deleteSelectedItems(REMOVE_FROM_FAV_ACTION)"><v-icon>delete_outline</v-icon></v-btn>
   <v-divider vertical v-if="current && (current.section==SECTION_PLAYLISTS || current.section==SECTION_FAVORITES)"></v-divider>
   <v-btn :title="trans.addall" flat icon class="toolbar-button" @click="addSelectedItems()"><v-icon>add_circle_outline</v-icon></v-btn>
   <v-btn :title="trans.playall" flat icon class="toolbar-button" @click="playSelectedItems()"><v-icon>play_circle_outline</v-icon></v-btn>
   <v-divider vertical></v-divider>
   <v-btn :title="trans.invertSelect" flat icon class="toolbar-button" @click="invertSelection()"><img :src="'invert-select' | svgIcon(darkUi)"></img></v-btn>
   <v-btn :title="trans.cancel" flat icon class="toolbar-button" @click="clearSelection()"><v-icon>cancel</v-icon></v-btn>
  </v-layout>
  <v-layout v-else>
   <v-btn flat icon @click="homeBtnPressed()" class="toolbar-button" id="home-button"><v-icon>home</v-icon></v-btn>
   <v-btn flat icon v-longpress="backBtnPressed" class="toolbar-button" id="back-button"><v-icon>arrow_back</v-icon></v-btn>
   <v-layout row wrap @click="showHistory($event)" v-if="headerSubTitle" v-bind:class="{pointer : history.length>1}">
    <v-flex xs12 class="ellipsis subtoolbar-title subtoolbar-pad">{{headerTitle}}</v-flex>
    <v-flex xs12 class="ellipsis subtoolbar-subtitle subtext">{{current && current.id==TOP_MYMUSIC_ID && libraryName ? libraryName : headerSubTitle}}</v-flex>
   </v-layout>
   <div class="ellipsis subtoolbar-title subtoolbar-title-single pointer" @click="showHistory($event)" v-else-if="history.length>1">{{headerTitle}}</div>
   <div class="ellipsis subtoolbar-title subtoolbar-title-single" v-else>{{headerTitle}}</div>
   <v-spacer style="flex-grow: 10!important"></v-spacer>
   <v-btn flat icon v-if="showRatingButton && items.length>1" @click.stop="setAlbumRating()" class="toolbar-button" :title="trans.albumRating"><v-icon>stars</v-icon></v-btn>
   <template v-if="desktop" v-for="(action, index) in settingsMenuActions">
    <v-btn flat icon @click.stop="headerAction(action, $event)" class="toolbar-button" :title="ACTIONS[action].title" :id="'tbar'+index">
      <img v-if="ACTIONS[action].svg" class="svg-img" :src="ACTIONS[action].svg | svgIcon(darkUi)"></img>
      <v-icon v-else>{{ACTIONS[action].icon}}</v-icon>
    </v-btn>
   </template>
   <v-divider vertical v-if="tbarActions.length>0 && ((showRatingButton && items.length>1) || (desktop && settingsMenuActions && settingsMenuActions.length>0))"></v-divider>
   <template v-for="(action, index) in tbarActions">
    <v-btn flat icon @click.stop="headerAction(action, $event)" class="toolbar-button" :title="action | tooltip(keyboardControl)" :id="'tbar'+index" v-if="action!=VLIB_ACTION || libraryName">
      <img v-if="ACTIONS[action].svg" class="svg-img" :src="ACTIONS[action].svg | svgIcon(darkUi)"></img>
      <v-icon v-else>{{ACTIONS[action].icon}}</v-icon>
    </v-btn>
   </template>
  </v-layout>
 </div>
 <v-progress-circular class="browse-progress" v-if="fetchingItems" color="primary" size=72 width=6 indeterminate></v-progress-circular>
 <div v-show="letter" id="letterOverlay"></div>

 <div v-if="grid.use">
  <div class="noselect bgnd-cover lms-jumplist" v-bind:class="{'lms-jumplist-wide':jumplistWide}" v-if="filteredJumplist.length>1">
   <template v-for="(item, index) in filteredJumplist">
    <div @click="jumpTo(item)" v-bind:class="{'active-btn' : jumplistActive==index}">{{item.key==' ' || item.key=='' ? '?' : item.key}}</div>
   </template>
  </div>
  <div class="lms-image-grid noselect bgnd-cover" id="browse-grid" style="overflow:auto;" v-bind:class="{'lms-image-grid-jump': filteredJumplist.length>1}">
  <RecycleScroller :items="grid.rows" :item-size="GRID_SIZES[grid.size].ih - (grid.haveSubtitle ? 0 : GRID_SINGLE_LINE_DIFF)" page-mode key-field="id">
   <table slot-scope="{item, index}" :class="[grid.few ? '' : 'full-width', GRID_SIZES[grid.size].clz]">
    <td align="center" style="vertical-align: top" v-for="(idx, cidx) in item.indexes"><v-card flat align="left" class="image-grid-item">
     <div v-if="idx>=items.length" class="image-grid-item"></div>
     <div v-else class="image-grid-item" v-bind:class="{'image-grid-item-few': grid.few}" @click="click(items[idx], idx, $event)" :title="items[idx] | itemTooltip">
      <v-btn icon color="primary" v-if="selection.size>0" class="image-grid-select-btn" @click.stop="select(items[idx], idx, $event)">
       <v-icon>{{items[idx].selected ? 'check_box' : 'check_box_outline_blank'}}</v-icon>
      </v-btn>
      <img :key="items[idx].image" :src="items[idx].image" v-bind:class="{'radio-img': SECTION_RADIO==items[idx].section}" class="image-grid-item-img"></img>
      <div class="image-grid-text">{{items[idx].title}}</div>
      <div class="image-grid-text subtext" v-bind:class="{'clickable':subtitleClickable}" @click.stop="clickSubtitle(items[idx], idx, $event)">{{items[idx].subtitle}}</div>
      <v-btn flat icon v-if="items[idx].menu && items[idx].menu.length>0" @click.stop="itemMenu(items[idx], idx, $event)" class="image-grid-btn">
       <v-icon>more_vert</v-icon>
      </v-btn>
     </div>
    </v-card></td>
   </table>
  </RecycleScroller>
 </div></div>
 <div v-else>

 <div class="noselect bgnd-cover lms-jumplist" v-bind:class="{'lms-jumplist-wide':jumplistWide}" v-if="filteredJumplist.length>1">
  <template v-for="(item, index) in filteredJumplist">
   <div @click="jumpTo(item)" v-bind:class="{'active-btn' : jumplistActive==index}">{{item.key==' ' || item.key=='' ? '?' : item.key}}</div>
  </template>
 </div>

 <v-list class="bgnd-cover" v-bind:class="{'lms-list': !headerTitle, 'lms-list-sub': headerTitle, 'lms-list-jump': filteredJumplist.length>1}" id="browse-list">
  <RecycleScroller v-if="!isTop && ((grid.allowed && current.id!=TOP_RADIO_ID && current.id!=TOP_APPS_ID) || items.length>LMS_MAX_NON_SCROLLER_ITEMS)" :items="items" :item-size="LMS_LIST_ELEMENT_SIZE" page-mode key-field="id">
   <v-list-tile avatar @click="click(item, index, $event)" slot-scope="{item, index}" @dragstart="dragStart(index, $event)" @dragend="dragEnd()" @dragover="dragOver($event)" @drop="drop(index, $event)" :draggable="item.draggable && (current.section!=SECTION_FAVORITES || 0==selection.size)">
    <v-list-tile-avatar v-if="item.selected" :tile="true" class="lms-avatar">
     <v-icon>check_box</v-icon>
    </v-list-tile-avatar>
    <v-list-tile-avatar v-else-if="item.image" :tile="true" v-bind:class="{'radio-image': SECTION_RADIO==item.section}" class="lms-avatar">
     <img :key="item.image" :src="item.image"></img>
    </v-list-tile-avatar>
    <v-list-tile-avatar v-else-if="item.icon" :tile="true" class="lms-avatar">
     <v-icon>{{item.icon}}</v-icon>
    </v-list-tile-avatar>
    <v-list-tile-avatar v-else-if="item.svg" :tile="true" class="lms-avatar">
      <img class="svg-list-img" :src="item.svg | svgIcon(darkUi)"></img>
    </v-list-tile-avatar>

    <!-- TODO: Do we have search fields with large lists?? -->
    <v-list-tile-content v-if="item.header" @click="click(item, index, $event)"><v-list-tile-title class="browse-header">{{item.title}}</v-list-tile-title></v-list-tile-content>
    <v-list-tile-content v-else>
     <v-list-tile-title>{{item.title}}</v-list-tile-title>
      <v-list-tile-sub-title v-html="item.subtitle" v-bind:class="{'clickable':subtitleClickable}" @click.stop="clickSubtitle(item, index, $event, $event)"></v-list-tile-sub-title>
    </v-list-tile-content>

    <v-list-tile-action class="browse-action" v-if="item.menu && item.menu.length>0">
     <v-btn icon @click.stop="itemMenu(item, index, $event)">
      <v-icon>more_vert</v-icon>
     </v-btn>
    </v-list-tile-action>
   </v-list-tile>
  </RecycleScroller>

  <template v-else v-for="(item, index) in items">
   <v-list-tile v-if="item.type=='text' && canClickText(item)" avatar @click="click(item, index, $event)" v-bind:class="{'error-text': item.id==='error'}" class="lms-avatar lms-list-item">
    <v-list-tile-content>
     <v-list-tile-title>{{item.title}}</v-list-tile-title>
     <v-list-tile-sub-title v-html="item.subtitle"></v-list-tile-sub-title>
    </v-list-tile-content>
   </v-list-tile>
   <v-list-tile v-else-if="item.type=='html'" class="lms-list-item browse-html" v-html="item.title"></v-list-tile>
   <v-list-tile v-else-if="item.type=='text'" class="lms-list-item browse-text">{{item.title}}</v-list-tile>
   <v-list-tile v-else-if="item.header" class="lms-list-item" @click="click(item, index, $event)"><v-list-tile-content><v-list-tile-title class="browse-header">{{item.title}}</v-list-tile-title></v-list-tile-content>
    <v-list-tile-action class="browse-action" v-if="item.menu && item.menu.length>0">
     <v-btn icon @click.stop="itemMenu(item, index, $event)">
      <v-icon>more_vert</v-icon>
     </v-btn>
    </v-list-tile-action>
   </v-list-tile>
   <v-list-tile v-else-if="!(isTop && (disabled.has(item.id) || hidden.has(item.id)))" avatar @click="click(item, index, $event)" :key="item.id" class="lms-avatar lms-list-item" :id="'item'+index" @dragstart="dragStart(index, $event)" @dragend="dragEnd()" @dragover="dragOver($event)" @drop="drop(index, $event)" :draggable="(isTop && !sortHome) || (item.draggable && (current.section!=SECTION_FAVORITES || 0==selection.size))">
    <v-list-tile-avatar v-if="item.selected" :tile="true" class="lms-avatar">
     <v-icon>check_box</v-icon>
    </v-list-tile-avatar>
    <v-list-tile-avatar v-else-if="item.image" :tile="true" v-bind:class="{'radio-image': SECTION_RADIO==item.section, 'lms-avatar-small': isTop || (current && (current.id==TOP_RADIO_ID || current.id==TOP_APPS_ID)), 'lms-avatar': current && current.id!=TOP_RADIO_ID && current.id!=TOP_APPS_ID}">
     <img :key="item.image" v-lazy="item.image"></img>
    </v-list-tile-avatar>
    <v-list-tile-avatar v-else-if="item.icon" :tile="true" class="lms-avatar">
     <v-icon>{{item.icon}}</v-icon>
    </v-list-tile-avatar>
    <v-list-tile-avatar v-else-if="item.svg" :tile="true" class="lms-avatar">
      <img class="svg-list-img" :src="item.svg | svgIcon(darkUi)"></img>
    </v-list-tile-avatar>
    <v-list-tile-avatar v-else-if="selection.size>0" :tile="true" class="lms-avatar">
     <v-icon>check_box_outline_blank</v-icon>
    </v-list-tile-avatar>

    <v-list-tile-content v-if="item.type=='search'">
     <v-text-field single-line clearable class="lms-search" :label="item.title" v-on:keyup.enter="search($event, item)"></v-text-field>
    </v-list-tile-content>

    <v-list-tile-content v-else-if="item.type=='entry'">
     <v-text-field single-line clearable class="lms-search" :label="item.title" v-on:keyup.enter="entry($event, item)"></v-text-field>
    </v-list-tile-content>

    <v-list-tile-content v-else>
     <v-list-tile-title>{{item.title}}</v-list-tile-title>
     <v-list-tile-sub-title v-html="item.subtitle" v-bind:class="{'clickable':subtitleClickable}" @click.stop="clickSubtitle(item, index, $event)"></v-list-tile-sub-title>
    </v-list-tile-content>

    <v-list-tile-action class="browse-action" v-if="item.menu && item.menu.length>0">
     <v-btn flat icon v-if="item.menu.length==1 && item.menu[0]==SEARCH_LIB_ACTION" @click.stop="itemAction(item.menu[0], item, index, $event)">
      <img v-if="ACTIONS[item.menu[0]].svg" :src="ACTIONS[item.menu[0]].svg | svgIcon(darkUi)"></img>
      <v-icon v-else>{{ACTIONS[item.menu[0]].icon}}</v-icon>
     </v-btn>
     <v-btn icon v-else @click.stop="itemMenu(item, index, $event)">
      <v-icon>more_vert</v-icon>
     </v-btn>
    </v-list-tile-action>

   </v-list-tile>
  </template>

  <v-list-tile class="lms-list-pad"></v-list-tile>
 </v-list>
 </div>

 <v-menu v-model="menu.show" :position-x="menu.x" :position-y="menu.y">
  <v-list v-if="menu.presets">
   <v-list-tile><v-list-tile-title><b>{{trans.choosepos}}</b></v-list-tile-title></v-list-tile>
   <v-divider></v-divider>
   <template v-for="(p, index) in menu.presets">
    <v-list-tile @click="savePreset(menu.item, p)">
     <v-list-tile-content><v-list-tile-title>{{p}}</v-list-tile-title></v-list-tile-content>
    </v-list-tile>
   </template>
   <v-divider></v-divider>
   <v-list-tile @click="menu.show = false">
     <v-list-tile-content><v-list-tile-title>{{trans.cancel}}</v-list-tile-title></v-list-tile-content>
    </v-list-tile>
  </v-list>
  <v-list v-else-if="menu.item && menu.item.moremenu">
   <template v-for="(entry, index) in menu.item.moremenu">
    <v-list-tile @click="itemMoreAction(menu.item, index)">
     <v-list-tile-title>{{entry.title}}</v-list-tile-title>
    </v-list-tile>
   </template>
  </v-list>
  <v-list v-else-if="menu.item">
   <template v-for="(action, index) in menu.item.menu">
    <v-divider v-if="DIVIDER==action"></v-divider>
    <v-list-tile v-else-if="action==ADD_TO_FAV_ACTION && isInFavorites(menu.item)" @click="itemAction(REMOVE_FROM_FAV_ACTION, menu.item, menu.index, $event)">
     <v-list-tile-avatar v-if="menuIcons">
      <v-icon v-if="undefined==ACTIONS[REMOVE_FROM_FAV_ACTION].svg">{{ACTIONS[REMOVE_FROM_FAV_ACTION].icon}}</v-icon>
      <img v-else class="svg-img" :src="ACTIONS[REMOVE_FROM_FAV_ACTION].svg | svgIcon(darkUi)"></img>
     </v-list-tile-avatar>
     <v-list-tile-title>{{ACTIONS[REMOVE_FROM_FAV_ACTION].title}}</v-list-tile-title>
    </v-list-tile>
    <v-list-tile v-else @click="itemAction(action, menu.item, menu.index, $event)">
     <v-list-tile-avatar v-if="menuIcons">
      <v-icon v-if="undefined==ACTIONS[action].svg">{{ACTIONS[action].icon}}</v-icon>
      <img v-else class="svg-img" :src="ACTIONS[action].svg | svgIcon(darkUi)"></img>
     </v-list-tile-avatar>
     <v-list-tile-title>{{ACTIONS[action].title}}</v-list-tile-title>
    </v-list-tile>
   </template>
  </v-list>
  <v-list v-else-if="menu.history">
   <template v-for="(item, index) in menu.history">
    <v-list-tile @click="goTo(index)">
     <v-list-tile-title>{{item}}</v-list-tile-title>
    </v-list-tile>
   </template>
  </v-list>
  <v-list v-else-if="menu.libraries">
   <template v-for="(item, index) in menu.libraries">
    <v-list-tile @click="selectLibrary(item.id)">
     <v-list-tile-avatar><v-icon small>{{item.name==libraryName ? 'radio_button_checked' :'radio_button_unchecked'}}</v-icon></v-list-tile-avatar>
     <v-list-tile-content><v-list-tile-title>{{item.name}}</v-list-tile-title></v-list-tile-content>
     <v-list-tile-action @click="deleteLibrary(item)" v-if="index>0"><v-btn icon><v-icon>delete_outline</v-icon></v-btn></v-list-tile-action>
    </v-list-tile>
   </template>
  </v-list>
  <v-list v-else-if="menu.albumSorts">
   <template v-for="(item, index) in menu.albumSorts">
    <v-list-tile @click="sortAlbums(item)">
     <v-list-tile-avatar><v-icon small>{{item.selected ? 'radio_button_checked' :'radio_button_unchecked'}}</v-icon></v-list-tile-avatar>
     <v-list-tile-content><v-list-tile-title>{{item.label}}</v-list-tile-title></v-list-tile-content>
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
            grid: {allowed:false, use:false, numColumns:0, size:GRID_SIZES.length-1, rows:[], few:false, haveSubtitle:true},
            fetchingItems: false,
            dialog: { show:false, title:undefined, hint:undefined, ok: undefined, cancel:undefined, command:undefined},
            trans: { ok:undefined, cancel: undefined, selectMultiple:undefined, addall:undefined, playall:undefined, albumRating:undefined,
                     deleteall:undefined, removeall:undefined, invertSelect:undefined, choosepos:undefined },
            menu: { show:false, item: undefined, x:0, y:0},
            isTop: true,
            libraryName: undefined,
            selection: new Set(),
            showRatingButton: false,
            section: undefined,
            letter: undefined,
            filteredJumplist: [],
            jumplistActive: 0,
            jumplistWide: false,
            tbarActions: [],
            settingsMenuActions: [],
            subtitleClickable: false,
            disabled: new Set()
        }
    },
    computed: {
        darkUi() {
            return this.$store.state.darkUi
        },
        menuIcons() {
            return this.$store.state.menuIcons
        },
        hidden() {
            return this.$store.state.hidden
        },
        sortHome() {
            return this.$store.state.sortHome
        },
        keyboardControl() {
            return this.$store.state.keyboardControl && !IS_MOBILE
        }
    },
    created() {
        this.serverMyMusic=[];
        this.history=[];
        this.fetchingItems = false;
        this.current = null;
        this.currentLibId = null;
        this.headerTitle = null;
        this.headerSubTitle=null;
        this.tbarActions=[];
        this.settingsMenuActions=[];
        this.mediaDirs=[];
        this.options={artistImages: getLocalStorageBool('artistImages', false),
                      pinned: new Set(),
                      sortFavorites: this.$store.state.sortFavorites,
                      showPresets: !this.$store.state.hidden.has(TOP_PRESETS_ID)};
        this.previousScrollPos=0;
        this.grid = {allowed:false, use:false, numColumns:0, size:GRID_SIZES.length-1, rows:[], few:false, haveSubtitle:true};

        if (!this.desktop) {
            // Clicking on 'browse' nav button whilst in browse page goes back.
            bus.$on('nav', function(page, longPress) {
                if ('browse'==page && this.history.length>0) {
                    if (longPress) {
                        this.goHome();
                    } else {
                        this.goBack();
                    }
                }
            }.bind(this));
            bus.$on('settingsMenuAction:browse', function(action) {
                this.headerAction(action);
            }.bind(this));
        }

        bus.$on('langChanged', function() {
            this.initItems();
        }.bind(this));
        this.initItems();

        var savedItems = JSON.parse(getLocalStorageVal("topItems", "[]"));
        if (savedItems.length==0) {
            savedItems = JSON.parse(getLocalStorageVal("pinned", "[]"));
            if (savedItems.length==0) {
                lmsCommand("", ["pref", LMS_MATERIAL_DEFAULT_ITEMS_PREF, "?"]).then(({data}) => {
                    if (data && data.result && data.result._p2) {
                        this.updateTopList(JSON.parse(data.result._p2));
                        this.saveTopList();
                    } else {
                        lmsCommand("", ["pref", LMS_MATERIAL_DEFAULT_PINNED_PREF, "?"]).then(({data}) => {
                            if (data && data.result && data.result._p2) {
                                this.addPinned(JSON.parse(data.result._p2));
                            }
                        });
                    }
                });
            } else {
                this.addPinned(savedItems);
            }
        } else {
            this.updateTopList(savedItems);
        }

        this.disabled = new Set(JSON.parse(getLocalStorageVal("disabledItems", JSON.stringify([TOP_CDPLAYER_ID, TOP_REMOTE_ID]))));

        bus.$on('esc', function() {
            this.menu.show = false;
        }.bind(this));

        bus.$on('playerChanged', function() {
            if (this.current && this.current.section == SECTION_PRESETS) {
                this.refreshList();
            } else if ((this.current && this.current.id == TOP_MYMUSIC_ID) ||
                       (this.history.length>1 && this.history[1].current && this.history[1].current.id==TOP_MYMUSIC_ID)) {
                this.serverMyMusicMenu();
            }
        }.bind(this));

        bus.$on('trackInfo', function(item, index, page) {
            if (!this.desktop) {
                this.$store.commit('setPage', 'browse');
            }
            if (this.history.length>=50) {
                this.goHome();
            }
            this.itemMoreMenu(item, index, page);
        }.bind(this));

        bus.$on('browse', function(cmd, params, title) {
            if (!this.desktop) {
                this.$store.commit('setPage', 'browse');
            }
            this.goHome();
            this.fetchItems(this.replaceCommandTerms({command:cmd, params:params}), {cancache:false, id:"<>", title:title});
        }.bind(this));

        bus.$on('refreshList', function(section) {
            if (section==SECTION_PODCASTS || (this.current && this.current.section==section)) {
                this.refreshList();
            }
        }.bind(this));
        bus.$on('refreshPlaylist', function(name) {
            if (this.current && this.current.section==SECTION_PLAYLISTS) {
                if (this.current.id.startsWith(MUSIC_ID_PREFIX) || this.current.title==name) {
                    this.refreshList();
                }
                if (!this.current.id.startsWith(MUSIC_ID_PREFIX) && this.history.length>0) {
                    this.history[this.history.length-1].needsRefresh = true;
                }
            }
        }.bind(this));
        bus.$on('ratingsSet', function(ids, value) {
            this.refreshList();
        }.bind(this));
        bus.$on('ratingChanged', function(track, album) {
            if (this.current && this.current.id==("album_id:"+album)) {
                this.refreshList();
            }
        }.bind(this));
        bus.$on('searchLib', function(command, params, term) {
            this.enteredTerm = term;
            this.fetchItems({command: command, params: params}, {cancache:false, title:i18n("Search"), id:"search"==command[0] ? SEARCH_ID : SEARCH_ID+":"+command[0], type:"search", libsearch:true});
        }.bind(this));
        bus.$on('searchPodcasts', function(url, term, provider) {
            this.enteredTerm = term;
            this.fetchUrlItems(url, provider);
        }.bind(this));
        bus.$on('playerMenuUpdated', function() {
            this.goHome()
            this.serverMyMusic=[];
        }.bind(this));
        if (!IS_MOBILE && !this.mini && !this.nowplaying) {
            bindKey('home');
            bindKey(LMS_SEARCH_KEYBOARD, 'mod');
            bindKey(LMS_PLAY_KEYBOARD, 'mod+shift');
            bindKey(LMS_APPEND_KEYBOARD, 'mod+shift');
            bindKey(LMS_ADD_ITEM_ACTION_KEYBOARD, 'mod');
            bindKey(LMS_CREATE_FAV_FOLDER_KEYBOARD, 'mod+shift');
            bindKey('left', 'mod');
            bus.$on('keyboard', function(key, modifier) {
                if (this.$store.state.openDialogs.length>0 || this.$store.state.visibleMenus.size>0 || (!this.desktop && this.$store.state.page!="browse")) {
                    return;
                }
                if ('mod'==modifier) {
                    if (LMS_SEARCH_KEYBOARD==key) {
                        if ((this.history.length==0 && !this.$store.state.hidden.has(TOP_MYMUSIC_ID)) || (this.current && (this.current.id==TOP_MYMUSIC_ID || this.current.id.startsWith(SEARCH_ID)))) {
                            bus.$emit('dlg.open', 'search');
                        } else if (this.current && this.current.id==PODCASTS_ID) {
                            bus.$emit('dlg.open', 'podcastsearch');
                        }
                    } else if ('left'==key) {
                        this.goBack();
                    } else {
                        for (var i=0, len=this.tbarActions.length; i<len; ++i) {
                            if (ACTIONS[this.tbarActions[i]].key==key) {
                                this.headerAction(this.tbarActions[i], undefined);
                                break;
                            }
                        }
                    }
                } else if ('mod+shift'==modifier) {
                    for (var i=0, len=this.tbarActions.length; i<len; ++i) {
                        if (ACTIONS[this.tbarActions[i]].skey==key) {
                            if (LMS_PLAY_KEYBOARD==key && this.selection.size>0) {
                                this.playSelectedItems();
                            } else if (LMS_APPEND_KEYBOARD==key && this.selection.size>0) {
                                this.addSelectedItems();
                            } else {
                                this.headerAction(this.tbarActions[i], undefined);
                            }
                            break;
                        }
                    }
                } else if (!modifier) {
                    if ('home'==key) {
                        this.goHome();
                    }
                }
            }.bind(this));
        }
    },
    methods: {
        initItems() {
            updateActionStrings();
            B_ALBUM_SORTS=[ { key:"album",           label:i18n("Album")},
                            { key:"artistalbum",     label:i18n("Artist, Album")},
                            { key:"artflow",         label:i18n("Artist, Year, Album")},
                            { key:"yearalbum",       label:i18n("Year, Album")},
                            { key:"yearartistalbum", label:i18n("Year, Artist, Album")} ];
            this.trans= { ok:i18n('OK'), cancel: i18n('Cancel'), selectMultiple:i18n("Select multiple items"),
                          addall:i18n("Add selection to queue"), playall:i18n("Play selection"), albumRating:i18n("Set rating for all tracks"),
                          deleteall:i18n("Delete all selected items"), invertSelect:i18n("Invert selection"), removeall:i18n("Remove all selected items"),
                          choosepos:i18n("Choose position") };

            if (undefined==this.top || this.top.length==0) {
                this.top = [{ command: [],
                              params: [],
                              icon: "library_music",
                              type: "group",
                              weight: 0,
                              menu: [SEARCH_LIB_ACTION],
                              id: TOP_MYMUSIC_ID },
                            { command: ["radios"],
                              params: ["menu:radio"],
                              icon: "radio",
                              type: "group",
                              weight: 1,
                              id: TOP_RADIO_ID,
                              section: SECTION_RADIO },
                            { command: ["favorites", "items"],
                              params: ["menu:favorites", "menu:1"],
                              icon: "favorite",
                              type: "favorites",
                              app: "favorites",
                              weight: 2,
                              id: TOP_FAVORITES_ID,
                              section: SECTION_FAVORITES,
                              isFavFolder: true },
                            { command: ["material-skin-presets", "list"],
                              icon: "ballot",
                              type: "presets",
                              app: "presets",
                              weight: 3,
                              id: TOP_PRESETS_ID,
                              section: SECTION_PRESETS },
                            { command: ["myapps", "items"],
                              params: ["menu:1"],
                              icon: "apps",
                              type: "group",
                              weight: 4,
                              id: TOP_APPS_ID,
                              section: SECTION_APPS },
                            { command: ["cdplayer", "items"],
                              params: ["menu:1"],
                              svg: "cd-player",
                              type: "group",
                              weight: 5,
                              id: TOP_CDPLAYER_ID },
                            { command: ["selectRemoteLibrary", "items"],
                              params: ["menu:selectRemoteLibrary", "menu:1"],
                              icon: "cloud",
                              type: "group",
                              weight: 6,
                              id: TOP_REMOTE_ID }
                           ];
            }
            for (var i=0, len=this.top.length; i<len; ++i) {
                this.top[i].title= this.top[i].id==TOP_MYMUSIC_ID
                        ? i18n("My Music")
                        : this.top[i].id==TOP_RADIO_ID
                            ? i18n("Radio")
                            : this.top[i].id==TOP_FAVORITES_ID
                                ? i18n("Favorites")
                                : this.top[i].id==TOP_PRESETS_ID
                                    ? i18n("Presets")
                                    : this.top[i].id==TOP_APPS_ID
                                        ? i18n("Apps")
                                        : this.top[i].id==TOP_CDPLAYER_ID
                                            ? i18n("CD Player")
                                            : this.top[i].id==TOP_REMOTE_ID
                                                ? i18n("Remote Libraries")
                                                : this.top[i].title;
            }

            if (this.history.length<1) {
                this.items = this.top;
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
            prev.current = this.current;
            prev.currentLibId = this.currentLibId;
            prev.currentBaseActions = this.currentBaseActions;
            prev.headerTitle = this.headerTitle;
            prev.headerSubTitle = this.headerSubTitle;
            prev.tbarActions = this.tbarActions;
            prev.settingsMenuActions = this.settingsMenuActions;
            prev.pos = this.scrollElement.scrollTop;
            prev.grid = this.grid;
            prev.command = this.command;
            prev.showRatingButton = this.showRatingButton;
            prev.subtitleClickable = this.subtitleClickable;
            prev.prevPage = this.prevPage;
            prev.allSearchResults = this.allSearchResults;
            this.prevPage = undefined;
            this.history.push(prev);
        },
        fetchItems(command, item, prevPage) {
            if (this.fetchingItems) {
                return;
            }

            this.fetchingItems = true;
            var count = item.limit ? item.limit : LMS_BATCH_SIZE;
            lmsList(this.playerId(), command.command, command.params, 0, count, item.cancache).then(({data}) => {
                this.options.ratingsSupport=this.$store.state.ratingsSupport;
                var resp = parseBrowseResp(data, item, this.options, item.cancache ? cacheKey(command.command, command.params, 0, count) : undefined);
                this.handleListResponse(item, command, resp);
                this.prevPage = prevPage;
                this.fetchingItems = false;
                this.enableRatings();
            }).catch(err => {
                this.fetchingItems = false;
                if (!axios.isCancel(err)) {
                    this.handleListResponse(item, command, {items: [{title:i18n("Empty"), type: 'text', id:'empty'}]});
                    logError(err, command.command, command.params, 0, count);
                }
            });
        },
        fetchUrlItems(url, provider) {
            if (this.fetchingItems) {
                return;
            }

            this.fetchingItems = true;
            axios.get(url).then(({data}) => {
                var resp = parseBrowseUrlResp(data, provider);
                this.handleListResponse({title:i18n("Search"), type:'search'}, {command:[], params:[]}, resp);
                this.fetchingItems = false;
            }).catch(err => {
                this.fetchingItems = false;
                if (!axios.isCancel(err)) {
                    this.handleListResponse({title:i18n("Search"), type:'search'}, {command:[], params:[]}, {items: [{title:i18n("Empty"), type: 'text', id:'empty'}]});
                    logError(err, command.command, command.params);
                }
            });
        },
        handleListResponse(item, command, resp) {
            if (resp && resp.items && (resp.items.length>0 || (command.command.length==1 && ("artists"==command.command[0] || "albums"==command.command[0])))) {
                if (!item.id.startsWith(SEARCH_ID) || this.history.length<1 || !this.current || !this.current.id.startsWith(SEARCH_ID)) {
                    this.addHistory();
                }
                this.command = command;
                this.currentBaseActions = this.baseActions;
                this.headerTitle=item.title
                                    ? (item.type=="search" || item.type=="entry") && undefined!=this.enteredTerm
                                        ? item.title+SEPARATOR+this.enteredTerm
                                        : item.title
                                    : "?";
                this.current = item;
                this.currentLibId = command.libraryId;
                this.items=resp.items;
                this.jumplist=resp.jumplist;
                this.filteredJumplist = [];
                this.baseActions=resp.baseActions;
                this.tbarActions=[];
                this.settingsMenuActions=[];
                this.isTop = false;
                this.subtitleClickable = !IS_MOBILE && this.items.length>0 && this.items[0].id && this.items[0].artist_id && this.items[0].id.startsWith("album_id:");
                var changedView = this.grid.use != resp.useGrid;
                this.grid = {allowed:resp.canUseGrid, use: resp.canUseGrid && (resp.forceGrid || isSetToUseGrid(command)), numColumns:0, size:GRID_SIZES.length-1, rows:[], few:false, haveSubtitle:true};
                this.jumplistActive=0;

                if (item.id.startsWith(SEARCH_ID)) {
                    this.tbarActions=[SEARCH_LIB_ACTION];
                } else if (SECTION_FAVORITES==this.current.section && this.current.isFavFolder) {
                    this.tbarActions=[ADD_FAV_FOLDER_ACTION, ADD_FAV_ACTION];
                } else if (SECTION_PRESETS==this.current.section) {
                    this.tbarActions=[ADD_PRESET_ACTION];
                } else if (command.command.length==2 && command.command[0]=="podcasts" && command.command[1]=="items" && command.params.length==1 && command.params[0]=="menu:podcasts") {
                    this.tbarActions=[ADD_PODCAST_ACTION, SEARCH_PODCAST_ACTION];
                } else if (addAndPlayAllActions(command)) {
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
                    if (this.tbarActions.length==0 && this.items.length>1 && this.items[0].menu && this.items[0].menu.length>0 &&
                        (this.items[0].menu[0]==ADD_ACTION || this.items[0].menu[0]==PLAY_ACTION) && (!item.id || !item.id.startsWith(TOP_ID_PREFIX)) &&
                        // Allow add-all/play-all from 'trackinfo', as Spotty's 'Top Titles' access via 'More' needs this
                        !(this.command.command.length>0 && (/*this.command.command[0]=="trackinfo" || */this.command.command[0]=="artistinfo" ||
                                                            this.command.command[0]=="albuminfo") || this.command.command[0]=="genreinfo")) {
                        this.tbarActions=[ADD_ALL_ACTION, PLAY_ALL_ACTION];
                        // If first item's id is xx.yy.zz then use xx.yy as playall/addall id
                        if (this.items[0].params && this.items[0].params.item_id) {
                            var parts = this.items[0].params.item_id.split(".");
                            if (parts.length>1) {
                                parts.pop();
                                this.current.allid = "item_id:"+parts.join(".");
                            }
                        }
                    }
                }
                if (resp.canUseGrid && !resp.forceGrid) {
                    this.settingsMenuActions.unshift(this.grid.use ? USE_LIST_ACTION : USE_GRID_ACTION);
                }
                if (this.command.command.length>0 && this.command.command[0]=="albums") {
                    var addSort=true;
                    for (var i=0, len=this.command.params.length; i<len; ++i) {
                        if (this.command.params[i].startsWith(SORT_KEY)) {
                            var sort=this.command.params[i].split(":")[1];
                            addSort=sort!="new" && sort!="random";
                            break;
                        }
                    }
                    if (addSort) {
                        this.settingsMenuActions.unshift(ALBUM_SORTS_ACTION);
                    }
                }
                bus.$emit('settingsMenuActions', this.settingsMenuActions, 'browse');
                if (resp.subtitle) {
                    this.headerSubTitle=resp.subtitle;
                } else if (1==this.items.length && "text"==this.items[0].type) {
                    this.headerSubTitle = undefined;
                } else {
                    this.headerSubTitle=i18np("1 Item", "%1 Items", this.items.length);
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
        handleTextClickResponse(item, command, data, isMoreMenu) {
            var resp = parseBrowseResp(data, item, this.options);
            var nextWindow = item.nextWindow
                                ? item.nextWindow
                                : item.actions && item.actions.go && item.actions.go.nextWindow
                                    ? item.actions.go.nextWindow
                                    : undefined;
            if (nextWindow) {
                nextWindow=nextWindow.toLowerCase();
                var message = resp.items && 1==resp.items.length && "text"==resp.items[0].type && resp.items[0].title && resp.items[0].id!='empty'
                                ? resp.items[0].title : item.title;
                if (nextWindow=="refresh" || (isMoreMenu && nextWindow=="parent")) {
                    bus.$emit('showMessage', message);
                    this.refreshList();
                } else if (this.history.length>0 && (nextWindow=="parent" || (isMoreMenu && nextWindow=="grandparent"))) {
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
            } else if (1==resp.items.length && resp.items[0].id=="empty") {
                // Dont show 'Empty' no point! #196
                //bus.$emit('showMessage', item.title);
            } else {
                this.handleListResponse(item, command, resp);
            }
        },
        canClickText(item) {
            return (item.style && item.style.startsWith('item') && item.style!='itemNoAction') || (!item.style && ( (item.actions && item.actions.go) || (item.actions && item.actions.do) ||item.nextWindow || item.params /*CustomBrowse*/));
        },
        doTextClick(item, isMoreMenu) {
            var command = this.buildCommand(item);
            if (command.command.length==2 && ("items"==command.command[1] || "browsejive"==command.command[1] || "jiveplaylistparameters"==command.command[1])) {
                this.fetchingItems = true;
                lmsList(this.playerId(), command.command, command.params, 0, LMS_BATCH_SIZE).then(({data}) => {
                    this.fetchingItems = false;
                    this.handleTextClickResponse(item, command, data, isMoreMenu);
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
                    this.handleTextClickResponse(item, command, data, isMoreMenu);
                }).catch(err => {
                    logError(err, command.command);
                });
            }
        },
        click(item, index, event) {
            if (this.fetchingItems || "search"==item.type || "entry"==item.type || "html"==item.type) {
                 return;
            }
            if (this.menu.show) {
                this.menu.show=false;
                return;
            }
            if (this.$store.state.visibleMenus.size>0) {
                return;
            }
            if (item.header) {
                if (item.allSearchResults && item.allSearchResults.length>0) { // Clicking on 'X Artists' / 'X Albums' / 'X Tracks' search header
                    this.addHistory();
                    this.items = item.allSearchResults;
                    this.headerSubTitle = item.subtitle;
                    this.current = item;
                    if ((this.items[0].id.startsWith("album_id") && this.items.length<=50) || this.items[0].id.startsWith("track_id")) {
                        this.tbarActions=[ADD_ALL_ACTION, PLAY_ALL_ACTION];
                    }
                }
                return;
            }
            if (this.selection.size>0) {
                this.select(item, index, event);
                return;
            }
            if ((item.section == SECTION_PRESETS && item.id!=TOP_PRESETS_ID) || (item.isPinned && undefined!=item.url)) { // Radio
                this.itemMenu(item, index, event);
                return;
            }
            if ("image"==item.type) {
                this.showImage(index);
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
            if (isTextItem(item) && !item.id.startsWith(TOP_ID_PREFIX) && !item.id.startsWith(MUSIC_ID_PREFIX)) {
                if (this.canClickText(item)) {
                    this.doTextClick(item);
                }
                return;
            }

            if (TOP_MYMUSIC_ID==item.id) {
                this.addHistory();
                this.items = this.serverMyMusic;
                this.serverMyMusicMenu();
                this.headerTitle = item.title;
                this.headerSubTitle = i18n("Browse music library");
                this.current = item;
                setScrollTop(this.scrollElement, 0);
                this.isTop = false;
                this.tbarActions=[VLIB_ACTION, SEARCH_LIB_ACTION];
            } else if (RANDOM_MIX_ID==item.id) {
                bus.$emit('dlg.open', 'rndmix');
            } else if (!item.genreArtists && item.command && 1==item.command.length && 1==item.params.length &&
                       "artists"==item.command[0] && item.params[0].startsWith("genre_id:") &&
                       this.current && this.current.id==GENRES_ID) {
                this.addHistory();
                this.items=[{ title: i18n("Artists"),
                              command: ["artists"],
                              params: [item.params[0]],
                              svg: "artist",
                              type: "group",
                              id: uniqueId(item.id, 0),
                              genreArtists:true },
                            { title: i18n("Albums"),
                              command: ["albums"],
                              params: [item.params[0], ALBUM_TAGS, SORT_KEY+ALBUM_SORT_PLACEHOLDER],
                              menu: [PLAY_ACTION, INSERT_ACTION, ADD_ACTION],
                              icon: "album",
                              type: "group",
                              id: uniqueId(item.id, 1)}];
                if (LMS_COMPOSER_GENRES.has(item.title)) {
                    this.items.push({ title: i18n("Composers"),
                                        command: ["artists"],
                                        params: ["role_id:COMPOSER", item.params[0]],
                                        cancache: true,
                                        svg: "composer",
                                        type: "group",
                                        id: uniqueId(item.id, 2)});
                }
                if (LMS_CONDUCTOR_GENRES.has(item.title)) {
                    this.items.push({ title: i18n("Conductors"),
                                        command: ["artists"],
                                        params: ["role_id:CONDUCTOR", item.params[0]],
                                        cancache: true,
                                        svg: "conductor",
                                        type: "group",
                                        id: uniqueId(item.id, 3)});
                }
                this.headerTitle = item.title;
                this.headerSubTitle = i18n("Select category");
                setScrollTop(this.scrollElement, 0);
                this.isTop = false;
            } else if (item.weblink) {
                window.open(item.weblink);
            } else {
                var command = this.buildCommand(item);
                if (command.command.length>2 && command.command[1]=="playlist") {
                    if (!item.menu || item.menu.length<1) { // No menu? Dynamic playlist? Just run command...
                        lmsCommand(this.playerId(), command.params ? command.command.concat(command.params) : command.command).then(({data}) => {
                            bus.$emit('showMessage', item.title);
                        });
                    } else if (this.$store.state.showMenuAudio) {
                        this.itemMenu(item, index, event);
                    }
                    return;
                }

                if (item.mapgenre) {
                    var field = getField(command, "genre:");
                    if (field>=0) {
                        lmsCommand("", ["material-skin", "map", command.params[field]]).then(({data}) => {
                            if (data.result.genre_id) {
                                command.params[field]="genre_id:"+data.result.genre_id;
                                this.fetchItems(command, item);
                            }
                        });
                        return;
                    }
                }
                this.fetchItems(command, item);
            }
        },
        showImage(index) {
            var browsePage = this;
            var images = [];
            for (var i=0; i<this.items.length; ++i) {
                images.push({src:changeImageSizing(this.items[i].src), w:0, h:0});
            }
            this.gallery = new PhotoSwipe(document.querySelectorAll('.pswp')[0], PhotoSwipeUI_Default, images, {index: index});
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
            this.$store.commit('dialogOpen', {name:'browse-viewer', shown:true});
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
                if (str.length>0 && str!==this.dialog.hint) {
                    this.dialog.show = false;
                    if (this.dialog.item && this.dialog.item.isPinned) {
                        this.dialog.item.title=str;
                        this.saveTopList();
                    } else {
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
                }
                this.dialog = {};
            }
        },
        itemMoreMenu(item, queueIndex, page) {
            if (undefined!=queueIndex) {
                this.fetchItems({command: ["trackinfo", "items"], params: ["playlist_index:"+queueIndex, "menu:1", "html:1"]}, item, page);
            } else if (item.id) {
                var params=[item.id, "menu:1", "html:1"];
                if (item.id.startsWith("artist_id:")) {
                    this.fetchItems({command: ["artistinfo", "items"], params: params}, item, page);
                } else if (item.id.startsWith("album_id:")) {
                    this.fetchItems({command: ["albuminfo", "items"], params: params}, item, page);
                } else if (item.id.startsWith("track_id:")) {
                    this.fetchItems({command: ["trackinfo", "items"], params: params}, item, page);
                } else if (item.id.startsWith("genre_id:")) {
                    this.fetchItems({command: ["genreinfo", "items"], params: params}, item, page);
                }
            }
        },
        itemAction(act, item, index, event) {
            if (act==SEARCH_LIB_ACTION) {
                if (this.$store.state.visibleMenus.size<1) {
                    bus.$emit('dlg.open', 'search');
                }
            } else if (act===MORE_ACTION) {
                if (item.isPodcast) {
                    bus.$emit('dlg.open', 'iteminfo', item);
                } else {
                    this.fetchItems(this.buildCommand(item, ACTIONS[act].cmd), item);
                }
            } else if (act===MORE_LIB_ACTION) {
                this.itemMoreMenu(item);
            } else if (act===PIN_ACTION) {
                this.pin(item, true);
            } else if (act===UNPIN_ACTION) {
                this.pin(item, false);
            } else if (!this.playerId()) {  // *************** NO PLAYER ***************
                bus.$emit('showError', undefined, i18n("No Player"));
            } else if (act===RENAME_ACTION) {
                this.dialog = this.isTop || item.isPinned
                                ? { show:true, title:i18n("Rename item"), hint:item.title, value:item.title, ok: i18n("Rename"), cancel:undefined, item:item,}
                                : SECTION_PLAYLISTS==item.section
                                    ? { show:true, title:i18n("Rename playlist"), hint:item.title, value:item.title, ok: i18n("Rename"), cancel:undefined,
                                        command:["playlists", "rename", item.id, "newname:"+TERM_PLACEHOLDER]}
                                    : { show:true, title:i18n("Rename favorite"), hint:item.title, value:item.title, ok: i18n("Rename"), cancel:undefined,
                                        command:["favorites", "rename", item.id, "title:"+TERM_PLACEHOLDER]};
                focusEntry(this);
            } else if (act==ADD_FAV_ACTION || act==ADD_PRESET_ACTION) {
                bus.$emit('dlg.open', 'favorite', 'add', {id:(this.current.id.startsWith("item_id:") ? this.current.id+"." : "item_id:")+this.items.length}, act==ADD_PRESET_ACTION);
            } else if (act==EDIT_ACTION) { // NOTE: Also edits presets!
                bus.$emit('dlg.open', 'favorite', 'edit', item, SECTION_PRESETS==item.section);
            } else if (act==ADD_FAV_FOLDER_ACTION) {
                this.dialog = { show:true, title:ACTIONS[ADD_FAV_FOLDER_ACTION].title, ok: i18n("Create"), cancel:undefined,
                                command:["favorites", "addlevel", "title:"+TERM_PLACEHOLDER, (this.current.id.startsWith("item_id:") ? this.current.id+"." : "item_id:")+this.items.length] };
                focusEntry(this);
            } else if (act==SAVE_PRESET_ACTION || act==MOVE_PRESET_ACTION) {
                showMenu(this, { show: true, item: item, x:this.menu.x, y:0, presets:[1, 2, 3, 4, 5, 6, 7, 8, 9, 10]});
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
            } else if (act==REMOVE_ACTION) {
                this.$confirm(i18n("Remove '%1'?", item.title), {buttonTrueText: i18n('Remove'), buttonFalseText: i18n('Cancel')}).then(res => {
                    if (res) {
                        this.clearSelection();
                        lmsCommand(this.playerId(), SECTION_PRESETS==item.section
                                                    ? ["material-skin-presets", "clear", "num:"+item.num]
                                                    : ["playlists", "edit", "cmd:delete", this.current.id, "index:"+index]).then(({datax}) => {
                            logJsonMessage("RESP", datax);
                            this.refreshList();
                        }).catch(err => {
                            logAndShowError(err, i18n("Failed to remove '%1'!", item.title), command);
                        });
                    }
                });
            } else if (act==ADD_TO_FAV_ACTION) {
                updateItemFavorites(item);
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
            } else if (act===REMOVE_FROM_FAV_ACTION || act==DELETE_FAV_FOLDER_ACTION) {
                var id = SECTION_FAVORITES==this.current.section ? item.id : "url:"+(item.presetParams && item.presetParams.favorites_url ? item.presetParams.favorites_url : item.favUrl);
                if (undefined==id) {
                    return;
                }
                this.$confirm(act===REMOVE_FROM_FAV_ACTION ? i18n("Remove '%1' from favorites?", item.title)
                                                           : i18n("Delete '%1' (and all its contents)?", item.title),
                              {buttonTrueText: act===REMOVE_FROM_FAV_ACTION ? i18n('Remove') : i18n("Delete"), buttonFalseText: i18n('Cancel')}).then(res => {
                    if (res) {
                        this.clearSelection();
                        var command = ["favorites", "delete", id];
                        lmsCommand(this.playerId(), command).then(({datax}) => {
                            logJsonMessage("RESP", datax);
                            if (SECTION_FAVORITES==this.current.section) {
                                this.refreshList();
                            }
                        }).catch(err => {
                            logAndShowError(err, i18n("Failed to remove favorite!"), command);
                        });
                    }
                });
            } else if (act===MOVE_FAV_TO_PARENT_ACTION) {
                this.clearSelection();
                var parent = item.id.replace("item_id:", "").split(".");
                parent.pop();
                parent.pop();
                if (parent.length>0) {
                    parent=parent.join(".");
                    parent+=".0";
                } else {
                    parent="0";
                }
                var command = ["favorites", "move", item.id.replace("item_id:", "from_id:"), "to_id:"+parent];
                lmsCommand(this.playerId(), command).then(({data}) => {
                    logJsonMessage("RESP", data);
                    this.goBack(true);
                }).catch(err => {
                    logAndShowError(err, i18n("Failed to move favorite!"), command);
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
            } else if (SELECT_ACTION===act) {
                if (!this.selection.has(index)) {
                    this.selection.add(index);
                    item.selected = true;
                    var idx = item.menu.indexOf(SELECT_ACTION);
                    if (idx>-1) {
                        item.menu[idx]=UNSELECT_ACTION;
                    }
                    forceItemUpdate(this, item);
                    if (event && event.shiftKey) {
                        if (undefined!=this.selectStart) {
                            for (var i=this.selectStart<index ? this.selectStart : index, stop=this.selectStart<index ? index : this.selectStart, len=this.items.length; i<=stop && i<len; ++i) {
                                this.itemAction(SELECT_ACTION, this.items[i], i);
                            }
                            this.selectStart = undefined;
                        } else {
                            this.selectStart = index;
                        }
                    } else {
                        this.selectStart = undefined;
                    }
                } else {
                    this.selectStart = undefined;
                }
            } else if (UNSELECT_ACTION===act) {
                this.selectStart = undefined;
                if (this.selection.has(index)) {
                    this.selection.delete(index);
                    item.selected = false;
                    var idx = item.menu.indexOf(UNSELECT_ACTION);
                    if (idx>-1) {
                        item.menu[idx]=SELECT_ACTION;
                    }
                    forceItemUpdate(this, item);
                }
            } else if (RATING_ACTION==act) {
                bus.$emit('dlg.open', 'rating', [item.id], item.rating);
            } else if (PLAY_ALBUM_ACTION==act) {
                var command = this.buildFullCommand(this.current, PLAY_ACTION);
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
            } else if (SEARCH_PODCAST_ACTION==act) {
                bus.$emit('dlg.open', 'podcastsearch');
            } else if (ADD_PODCAST_ACTION==act) {
                if (item.isPodcast) {
                    lmsCommand("", ["material-skin", "add-podcast", "url:"+item.id, "name:"+item.title]).then(({datax}) => {
                        this.history[this.history.length-1].needsRefresh = true;
                        bus.$emit('showMessage', i18n("Added '%1'", item.title));
                    }).catch(err => {
                        logAndShowError(err, i18n("Failed to remove favorite!"), command);
                    });
                } else {
                    bus.$emit('dlg.open', 'podcastadd');
                }
            } else if (REMOVE_PODCAST_ACTION==act) {
                    this.$confirm(i18n("Remove '%1'?", item.title), {buttonTrueText: i18n("Remove"), buttonFalseText: i18n('Cancel')}).then(res => {
                    if (res) {
                        lmsCommand("", ["material-skin", "delete-podcast", "pos:"+item.id.split(":")[1].split(".")[1]]).then(({datax}) => {
                            this.refreshList();
                        }).catch(err => {
                            logAndShowError(err, i18n("Failed to remove favorite!"), command);
                        });
                    }
                });
            } else if ((ADD_ALL_ACTION==act || PLAY_ALL_ACTION==act) && (item.id.startsWith("search:") || item.id.startsWith("search.") || item.id==SEARCH_ID)) {
                // Can't use standard add/play-all for search results, so just add each item...
                var commands=[];
                var check = item.id.endsWith("tracks") || (SEARCH_ID==item.id && this.items[0].id.startsWith("track")) ? "track_id" : "album_id";
                var list = item.allSearchResults ? item.allSearchResults : this.items;
                for (var i=0, len=list.length; i<len; ++i) {
                    if (list[i].id.startsWith(check)) {
                        commands.push({act:PLAY_ALL_ACTION==act && 0==i ? PLAY_ACTION : ADD_ACTION, item:list[i], idx:i});
                    } else if (commands.length>0) {
                        break;
                    }
                }
                bus.$emit('showMessage', item.id.endsWith("tracks") ? i18n("Adding tracks...") : i18n("Adding albums..."));
                this.doCommands(commands, PLAY_ALL_ACTION==act);
            } else {
                var command = this.buildFullCommand(item, act);
                if (command.command.length===0) {
                    bus.$emit('showError', undefined, i18n("Don't know how to handle this!"));
                    return;
                }
                lmsCommand(this.playerId(), command.command).then(({data}) => {
                    logJsonMessage("RESP", data);
                    bus.$emit('refreshStatus');
                    this.clearSelection();
                    if (!this.desktop) {
                        if (act===PLAY_ACTION || act===PLAY_ALL_ACTION) {
                            this.$store.commit('setPage', 'now-playing');
                        } else if (act===ADD_ACTION || act===ADD_ALL_ACTION) {
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
        itemMoreAction(item, index) {
            this.doTextClick(item.moremenu[index], true);
        },
        itemMenu(item, index, event) {
            if (!item.menu) {
                return;
            }
            if (1==item.menu.length && MORE_ACTION==item.menu[0]) {
                if (item.moremenu) {
                    showMenu(this, {show:true, item:item, x:event.clientX, y:event.clientY, index:index});
                } else {
                    var command = this.buildFullCommand(item, item.menu[0]);
                    lmsList(this.playerId(), command.command, command.params, 0, 100, false).then(({data}) => {
                        var resp = parseBrowseResp(data, item, this.options, undefined);
                        if (resp.items.length>0) {
                            item.moremenu = resp.items;
                            showMenu(this, {show:true, item:item, x:event.clientX, y:event.clientY, index:index});
                        }
                    });
                }
            } else {
                showMenu(this, {show:true, item:item, x:event.clientX, y:event.clientY, index:index});
            }
        },
        savePreset(item, pos) {
            var url = item.url ? item.url : (item.favUrl ? item.favUrl : (item.presetParams ? item.presetParams.favorites_url : undefined));
            var command = ["material-skin-presets", "set", "num:"+pos, "url:"+url, "text:"+(item.section==SECTION_PRESETS ? item.text : item.title)];
            if (item.section==SECTION_PRESETS) {
                if (pos==item.num) {
                    return;
                } else {
                    command.push("prev:"+item.num);
                }
            }
            lmsCommand(this.playerId(), command).then(({data}) => {
                if (item.section==SECTION_PRESETS) {
                    this.refreshList();
                } else {
                    bus.$emit('showMessage', i18n("Set preset"));
                }
            });
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
                showMenu(this, {show:true, x:event.clientX, y:event.clientY, history:history});
            }
        },
        showLibMenu(event) {
            lmsList("", ["libraries"]).then(({data}) => {
                if (data && data.result && data.result.folder_loop && data.result.folder_loop.length>0) {
                    var libraries = [];
                    for (var i=0, len=data.result.folder_loop.length; i<len; ++i) {
                        data.result.folder_loop[i].name = data.result.folder_loop[i].name.replace(SIMPLE_LIB_VIEWS, "");
                        libraries.push(data.result.folder_loop[i]);
                    }
                    libraries.sort(nameSort);
                    libraries.unshift({name: i18n("All"), id:LMS_DEFAULT_LIBRARY});
                    showMenu(this, {show:true, x:event.clientX, y:event.clientY, libraries:libraries});
                }
            });
        },
        selectLibrary(id) {
            this.$store.commit('setLibrary', id);
        },
        deleteLibrary(lib) {
            this.$confirm(i18n("Delete '%1'?", lib.name), {buttonTrueText: i18n('Delete'), buttonFalseText: i18n('Cancel')}).then(res => {
                if (res) {
                    lmsCommand("", ["material-skin", "delete-vlib", "id:"+lib.id]).then(({data}) => {
                        if (this.$store.state.library==lib.id) {
                            this.$store.commit('setLibrary', LMS_DEFAULT_LIBRARY);
                        }
                    });
                }
            });
        },
        sortAlbums(sort) {
            if (!sort.selected) {
                for (var i=0, len=this.command.params.length; i<len; ++i) {
                    if (this.command.params[i].startsWith(SORT_KEY)) {
                        this.command.params[i]=SORT_KEY+sort.key;
                        break;
                    }
                }
                setAlbumSort(this.command, sort.key);
                this.refreshList(false);
            }
        },
        headerAction(act, event) {
            if (this.$store.state.visibleMenus.size>0 && (this.desktop || this.settingsMenuActions.indexOf(act)<0)) {
                return;
            }
            if (USE_LIST_ACTION==act) {
                this.changeLayout(false);
            } else if (USE_GRID_ACTION==act) {
                this.changeLayout(true);
            } else if (ALBUM_SORTS_ACTION==act) {
                var sort="";
                for (var i=0, len=this.command.params.length; i<len; ++i) {
                    if (this.command.params[i].startsWith(SORT_KEY)) {
                        sort=this.command.params[i].split(":")[1];
                        break;
                    }
                }
                var albumSorts=[];
                for (var i=0,len=B_ALBUM_SORTS.length; i<len; ++i) {
                    albumSorts.push({key:B_ALBUM_SORTS[i].key, label:B_ALBUM_SORTS[i].label, selected:sort==B_ALBUM_SORTS[i].key});
                }
                showMenu(this, {show:true, x:event ? event.clientX : window.innerWidth, y:event ? event.clientY :0, albumSorts:albumSorts});
            } else if (VLIB_ACTION==act) {
                this.showLibMenu(event);
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
                    setUseGrid(this.command, this.grid.use);
                    var af = this.grid.use ? USE_GRID_ACTION : USE_LIST_ACTION;
                    var at = this.grid.use ? USE_LIST_ACTION : USE_GRID_ACTION;
                    for (var i=0, len=this.settingsMenuActions.length; i<len; ++i) {
                        if (this.settingsMenuActions[i] == af) {
                            this.settingsMenuActions[i] = at;
                            break;
                        }
                    }
                    bus.$emit('settingsMenuActions', this.settingsMenuActions, 'browse');
                    this.$forceUpdate();
                });
            }
        },
        refreshList(restorePosition) {
            this.clearSelection();
            var pos=undefined==restorePosition || restorePosition ? this.scrollElement.scrollTop : 0;
            this.fetchingItems = true;
            lmsList(this.playerId(), this.command.command, this.command.params, 0, LMS_BATCH_SIZE, this.current.cancache).then(({data}) => {
                var resp = parseBrowseResp(data, this.current, this.options, this.current.cancache ? cacheKey(this.command.command, this.command.params, 0, LMS_BATCH_SIZE) : undefined);
                this.items=resp.items;
                this.jumplist=resp.jumplist;
                this.filteredJumplist = [];
                if (resp.subtitle) {
                    this.headerSubTitle=resp.subtitle;
                } else {
                    this.headerSubTitle=i18np("1 Item", "%1 Items", this.items.length);
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
        homeBtnPressed() {
            if (this.$store.state.visibleMenus.size<1) {
                this.goHome();
            }
        },
        goHome() {
            if (this.history.length==0) {
                return;
            }
            if (this.fetchingItems) {
                if (lmsListSource) {
                    this.fetchingItems = false;
                    lmsListSource.cancel(i18n('Operation cancelled by the user.'));
                } else {
                    return;
                }
            }
            this.selection = new Set();
            var prev = this.history.length>0 ? this.history[0].pos : 0;
            this.items = this.top;
            this.jumplist = [];
            this.filteredJumplist = [];
            this.history=[];
            this.current = null;
            this.currentLibId = null;
            this.headerTitle = null;
            this.headerSubTitle=null;
            this.baseActions=[];
            this.currentBaseActions=[];
            this.tbarActions=[];
            this.settingsMenuActions=[];
            this.isTop = true;
            this.grid = {allowed:false, use:false, numColumns:0, size:GRID_SIZES.length-1, rows:[], few:false, haveSubtitle:true};
            this.command = undefined;
            this.showRatingButton = false;
            this.subtitleClickable = false;
            this.$nextTick(function () {
                this.setScrollElement();
                this.setBgndCover();
                setScrollTop(this.scrollElement, prev.pos>0 ? prev.pos : 0);
            });
            bus.$emit('settingsMenuActions', this.settingsMenuActions, 'browse');
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
        backBtnPressed(long) {
            if (this.$store.state.visibleMenus.size<1) {
                if (long) {
                    this.goHome();
                } else {
                    this.goBack();
                }
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
            if (this.prevPage && !this.desktop) {
                var nextPage = ""+this.prevPage;
                this.$nextTick(function () { this.$nextTick(function () { this.$store.commit('setPage', nextPage); }); });
            }
            if (this.history.length<2) {
                this.goHome();
                return;
            }
            this.selection = new Set();
            var prev = this.history.pop();
            var changedView = this.grid.use != prev.grid.use;
            this.items = prev.items;
            this.jumplist = prev.jumplist;
            this.filteredJumplist = [];
            this.grid = prev.grid;
            this.baseActions = prev.baseActions;
            this.current = prev.current;
            this.currentBaseActions = prev.currentBaseActions;
            this.headerTitle = prev.headerTitle;
            this.headerSubTitle = prev.headerSubTitle;
            this.tbarActions = prev.tbarActions;
            this.settingsMenuActions = prev.settingsMenuActions;
            this.command = prev.command;
            this.showRatingButton = prev.showRatingButton;
            this.subtitleClickable = prev.subtitleClickable;
            this.prevPage = prev.prevPage;
            this.allSearchResults = prev.allSearchResults;
            if (refresh || prev.needsRefresh) {
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
            bus.$emit('settingsMenuActions', this.settingsMenuActions, 'browse');
        },
        buildCommand(item, commandName, doReplacements) {
            var origCommand = undefined;

            // Faking addall/playall, so build add/play command for first item...
            if (ACTIONS[PLAY_ALL_ACTION].cmd==commandName || ACTIONS[ADD_ALL_ACTION].cmd==commandName) {
                item = this.items[0];
                origCommand = commandName;
                commandName = ACTIONS[PLAY_ALL_ACTION].cmd==commandName ? "play" : "add";
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
                        for (var key in command.params) {
                            if (command.params[key]!=undefined && command.params[key]!=null) {
                                var param = key+":"+command.params[key];
                                cmd.params.push(param);
                                addedParams.add(param);
                             }
                        }
                    }
                    if (command.itemsParams && item[command.itemsParams]) {
                        /*var isMore = "more" == commandName;*/
                        for(var key in item[command.itemsParams]) {
                            if (/* !isMore || */ ("touchToPlaySingle"!=key && "touchToPlay"!=key)) {
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
                            } else if (mode=="years") {
                                p.push("hasAlbums:1");
                            } else if (mode!="artists" && mode!="albums" && mode!="genres" && mode!="tracks" && mode!="playlists") {
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
                                p.push(hasArtistId ? ARTIST_ALBUM_TAGS : ALBUM_TAGS);
                            }
                            if (!hasSort) {
                                p.push(SORT_KEY+(hasArtistId ? ARTIST_ALBUM_SORT_PLACEHOLDER : ALBUM_SORT_PLACEHOLDER));
                            }
                        } else if (mode=="playlists") {
                            if (!hasTags) {
                                p.push(PLAYLIST_TAGS);
                            }
                        } else if (!hasTags && (mode=="artists" || mode=="years" || mode=="genres" || mode=="vaalbums")) {
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
            if (origCommand && (ACTIONS[PLAY_ALL_ACTION].cmd==origCommand || ACTIONS[ADD_ALL_ACTION].cmd==origCommand)) {
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
        buildFullCommand(item, act) {
            var command = this.buildCommand(item, ACTIONS[act].cmd);
            if (command.command.length<1) { // Non slim-browse command
                if (item.url && ((item.section && item.section == SECTION_PRESETS) || !item.id || !item.id.startsWith("playlist_id:"))) {
                    command.command = ["playlist", INSERT_ACTION==act ? "insert" : ACTIONS[act].cmd, item.url, item.title];
                } else if (item.app && item.id) {
                    command.command = [item.app, "playlist", INSERT_ACTION==act ? "insert" :ACTIONS[act].cmd, item.id];
                } else if (item.isFolderItem) {
                    command.command = ["playlist", INSERT_ACTION==act ? "insert" : ACTIONS[act].cmd, item.id];
                } else if (item.id) {
                    command.command = ["playlistcontrol", "cmd:"+(act==PLAY_ACTION ? "load" : INSERT_ACTION==act ? "insert" :ACTIONS[act].cmd)];

                    if (item.id.startsWith("album_id:")  || item.id.startsWith("artist_id:")) {
                        item.params.forEach(p => {
                            if ( (!lmsOptions.noRoleFilter && (p.startsWith("role_id:"))) ||
                                 (!lmsOptions.noGenreFilter && p.startsWith("genre_id:")) ||
                                 p.startsWith("artist_id:")) {
                                if (!item.id.startsWith("artist_id:") || !p.startsWith("artist_id:")) {
                                    command.command.push(p);
                                }
                                if (p.startsWith("artist_id:")) {
                                    command.params.push(SORT_KEY+ARTIST_ALBUM_SORT_PLACEHOLDER);
                                }
                            }
                        });
                    } else if (item.id.startsWith("genre_id:")) {
                        command.params.push(SORT_KEY+ALBUM_SORT_PLACEHOLDER);
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
                var albumSort=getAlbumSort(cmd);
                cmd.params.forEach(p => {
                    r=p.replace(SORT_KEY+ALBUM_SORT_PLACEHOLDER, SORT_KEY+albumSort)
                       .replace(SORT_KEY+ARTIST_ALBUM_SORT_PLACEHOLDER, SORT_KEY+albumSort)
                       .replace(TERM_PLACEHOLDER, this.enteredTerm)
                    if (this.$store.state.ratingsSupport && p==TRACK_TAGS) {
                        r=TRACK_TAGS+"R";
                    }
                    modifiedParams.push(r);
                });
                cmd.params = modifiedParams;
            }
            return cmd;
        },
        setLibrary() {
            this.libraryName = undefined;
            lmsList("", ["libraries"]).then(({data}) => {
                if (data && data.result && data.result.folder_loop && data.result.folder_loop.length>0) {
                    for (var i=0, loop=data.result.folder_loop, len=loop.length; i<len; ++i) {
                        if (loop[i].id == this.$store.state.library) {
                            this.libraryName=loop[i].id!=LMS_DEFAULT_LIBRARY ? loop[i].name.replace(SIMPLE_LIB_VIEWS, "") : i18n("All");
                            break;
                        }
                    }
                    if (undefined==this.libraryName) {
                        this.libraryName=i18n("All");
                    }
                }
            });
        },
        serverMyMusicMenu() {
            if (this.serverMyMusic.length>0 && this.serverMyMusic[0].player==this.playerId()) {
                return;
            }

            this.fetchingItems=true;
            lmsList(this.playerId(), ["menu", "items"], ["direct:1"]).then(({data}) => {
                if (data && data.result && data.result.item_loop) {
                    this.serverMyMusic = [];
                    for (var idx=0, loop=data.result.item_loop, loopLen=loop.length; idx<loopLen; ++idx) {
                        var c = loop[idx];
                        if (c.node=="myMusic" && c.id) {
                            if (c.id=="randomplay") {
                                this.serverMyMusic.push({ title: i18n("Random Mix"),
                                                      svg: "dice-multiple",
                                                      id: RANDOM_MIX_ID,
                                                      type: "app",
                                                      weight: c.weight ? parseFloat(c.weight) : 100 });
                            } else if (!c.id.startsWith("myMusicSearch") && !c.id.startsWith("opmlselect")) {
                                var command = this.buildCommand(c, "go", false);
                                var item = { title: c.text,
                                             command: command.command ,
                                             params: command.params,
                                             weight: c.weight ? parseFloat(c.weight) : 100,
                                             id: MUSIC_ID_PREFIX+c.id,
                                             type: "group",
                                             icon: "music_note"
                                            };
                                if (c.id.startsWith("myMusicArtists")) {
                                    mapArtistIcon(command.params, item);
                                    item.cancache = true;
                                } else if (c.id.startsWith("myMusicAlbumsVariousArtists")) {
                                    item.icon = undefined;
                                    item.svg = "album-multi";
                                    item.cancache = true;
                                } else if (c.id.startsWith("myMusicAlbums")) {
                                    item.icon = "album";
                                    item.cancache = true;
                                } else if (c.id.startsWith("myMusicGenres")) {
                                    item.icon = "label";
                                    item.cancache = true;
                                    item.id = GENRES_ID;
                                } else if (c.id == "myMusicPlaylists" || c.id.startsWith("playlists")) {
                                    item.icon = "list";
                                    item.section = SECTION_PLAYLISTS;
                                } else if (c.id.startsWith("myMusicYears")) {
                                    item.icon = "date_range";
                                    item.cancache = true;
                                } else if (c.id == "myMusicNewMusic") {
                                    item.icon = "new_releases";
                                } else if (c.id.startsWith("myMusicMusicFolder")) {
                                    item.icon = "folder";
                                } else if (c.id.startsWith("myMusicFileSystem")) {
                                    item.icon = "computer";
                                } else if (c.id == "myMusicRandomAlbums") {
                                    item.svg = "dice-album";
                                    item.icon = undefined;
                                } else if (c.id.startsWith("myMusicTopTracks")) {
                                    item.icon = "arrow_upward";
                                } else if (c.id.startsWith("myMusicFlopTracks")) {
                                    item.icon = "arrow_downward";
                                } else if (c.id == "dynamicplaylist") {
                                    item.svg = "dice-list";
                                    item.icon = undefined;
                                } else if (c.id.startsWith("trackstat")) {
                                    item.icon = "bar_chart";
                                } else if (c.id.startsWith("artist")) {
                                    item.svg = "artist";
                                    item.icon = undefined;
                                } else if (c.id == "custombrowse" || (c.menuIcon && c.menuIcon.endsWith("/custombrowse.png"))) {
                                    if (command.params.length==1 && command.params[0].startsWith("hierarchy:new")) {
                                        item.limit=undefined==this.newMusicLimit ? 100 :this.newMusicLimit;
                                    }
                                    if (c.id.startsWith("artist")) {
                                        item.svg = "artist";
                                        item.icon = undefined;
                                    } else {
                                        item.icon = c.id.startsWith("new") ? "new_releases" :
                                                    c.id.startsWith("album") ? "album" :
                                                    c.id.startsWith("artist") ? "group" :
                                                    c.id.startsWith("decade") || c.id.startsWith("year") ? "date_range" :
                                                    c.id.startsWith("genre") ? "label" :
                                                    c.id.startsWith("playlist") ? "list" :
                                                    c.id.startsWith("ratedmysql") ? "star" :
                                                    "music_note";
                                    }
                                } else if (c.icon) {
                                    if (c.icon.endsWith("/albums.png")) {
                                        item.icon = "album";
                                    } else if (c.icon.endsWith("/artists.png")) {
                                        item.svg = "artist";
                                    } else if (c.icon.endsWith("/genres.png")) {
                                        item.icon = "label";
                                    }
                                }
                                if (getField(item, "genre_id:")>=0) {
                                    item['mapgenre']=true;
                                }
                                this.serverMyMusic.push(item);
                            }
                        }
                    }
                    this.serverMyMusic.sort(function(a, b) { return a.weight!=b.weight ? a.weight<b.weight ? -1 : 1 : titleSort(a, b); });
                    this.serverMyMusic[0].player=this.playerId();
                    for (var i=0, len=this.serverMyMusic.length; i<len; ++i) {
                        this.serverMyMusic[i].menu=[this.options.pinned.has(this.serverMyMusic[i].id) ? UNPIN_ACTION : PIN_ACTION];
                    }
                    if (this.current && TOP_MYMUSIC_ID==this.current.id) {
                        this.items = this.serverMyMusic;
                    } else if (this.history.length>1 && this.history[1].current && this.history[1].current.id==TOP_MYMUSIC_ID) {
                        this.history[1].items = this.serverMyMusic;
                    }
                }
                this.fetchingItems=false;
            }).catch(err => {
                this.fetchingItems = false;
                logAndShowError(err);
            });
        },
        updateTopList(items) {
            this.top=items;
            this.initItems();
            for (var i=0, len=this.top.length; i<len; ++i) {
                if (!this.top[i].id.startsWith(TOP_ID_PREFIX)) {
                    this.options.pinned.add(this.top[i].id);
                } else if (this.top[i].id==TOP_CDPLAYER_ID && this.top[i].params.length==0) {
                    this.top[i].params.push("menu:1");
                }
            }
            if (this.$store.state.sortHome) {
                this.top.sort(homeScreenSort);
            }
        },
        saveTopList() {
            if (this.$store.state.sortHome) {
                this.top.sort(homeScreenSort);
            }
            setLocalStorageVal("topItems", JSON.stringify(this.top));
            removeLocalStorage("pinned");
        },
        addPinned(pinned) {
            for (var len=pinned.length, i=len-1; i>=0; --i) {
                if (undefined==pinned[i].command && undefined==pinned[i].params && undefined!=pinned[i].item) { // Previous pinned apps
                    var command = this.buildCommand(pinned[i].item);
                    pinned[i].params = command.params;
                    pinned[i].command = command.command;
                    pinned[i].image = pinned[i].item.image;
                    pinned[i].icon = pinned[i].item.icon;
                    pinned[i].item = undefined;
                }
                pinned[i].menu = undefined == pinned[i].url ? [RENAME_ACTION, UNPIN_ACTION] : [PLAY_ACTION, INSERT_ACTION, ADD_ACTION, DIVIDER, RENAME_ACTION, UNPIN_ACTION];
                this.options.pinned.add(pinned[i].id);
                this.top.unshift(pinned[i]);
            }
            if (this.history.length<1) {
                this.items = this.top;
            }
            for (var i=0, len=this.serverMyMusic.length; i<len; ++i) {
                this.serverMyMusic[i].menu=[this.options.pinned.has(this.serverMyMusic[i].id) ? UNPIN_ACTION : PIN_ACTION];
            }
            this.saveTopList();
            removeLocalStorage("pinned");
        },
        pin(item, add, mapped) {
            var index = -1;
            var lastPinnedIndex = -1;
            for (var i=0, len=this.top.length; i<len; ++i) {
                if (this.top[i].id == item.id) {
                    index = i;
                    break;
                } else if (!this.top[i].id.startsWith(TOP_ID_PREFIX)) {
                    lastPinnedIndex = i;
                }
            }

            if (add && index==-1) {
                if (item.mapgenre && !mapped) {
                    var field = getField(item, "genre_id:");
                    if (field>=0) {
                        lmsCommand("", ["material-skin", "map", item.params[field]]).then(({data}) => {
                           if (data.result.genre) {
                                item.params[field]="genre:"+data.result.genre;
                                this.pin(item, add, true);
                            }
                        });
                        return;
                    }
                }
                if (item.isRadio) {
                    this.top.splice(lastPinnedIndex+1, 0,
                                    {id: item.presetParams.favorites_url, title: item.title, image: item.image, icon: item.icon, svg: item.svg, isPinned: true,
                                     url: item.presetParams.favorites_url, menu: [PLAY_ACTION, INSERT_ACTION, ADD_ACTION, DIVIDER, RENAME_ACTION, UNPIN_ACTION],
                                     weight: undefined==item.weight ? 10000 : item.weight});
                } else {
                    var command = this.buildCommand(item, undefined, false);
                    this.top.splice(lastPinnedIndex+1, 0,
                                    {id: item.id, title: item.title, image: item.image, icon: item.icon, svg: item.svg, mapgenre: item.mapgenre,
                                     command: command.command, params: command.params, isPinned: true, menu: [RENAME_ACTION, UNPIN_ACTION],
                                     weight: undefined==item.weight ? 10000 : item.weight, section: item.section, cancache: item.cancache});
                }
                this.options.pinned.add(item.id);
                this.updateItemPinnedState(item);
                this.saveTopList();
                bus.$emit('showMessage', i18n("Pinned '%1' to home screen.", item.title));
            } else if (!add && index!=-1) {
                this.$confirm(i18n("Un-pin '%1'?", item.title), {buttonTrueText: i18n('Un-pin'), buttonFalseText: i18n('Cancel')}).then(res => {
                    if (res) {
                        this.top.splice(index, 1);
                        this.options.pinned.delete(item.id);
                        this.updateItemPinnedState(item);
                        this.saveTopList();
                    }
                });
            }
        },
        updateItemPinnedState(item) {
            if (item.menu) {
                for (var i=0, len=item.menu.length; i<len; ++i) {
                    if (item.menu[i] == PIN_ACTION || item.menu[i] == UNPIN_ACTION) {
                        item.menu[i] = item.menu[i] == PIN_ACTION ? UNPIN_ACTION : PIN_ACTION;
                        break;
                    }
                }
                if (item.id.startsWith(TOP_ID_PREFIX)) {
                    for (var i=0, len=this.serverMyMusic.length; i<len; ++i) {
                        this.serverMyMusic[i].menu=[this.options.pinned.has(this.serverMyMusic[i].id) ? UNPIN_ACTION : PIN_ACTION];
                    }
                }
            }
        },
        invertSelection() {
            if (this.selection.size==this.items.length) {
                this.clearSelection();
                return;
            }
            this.selection = new Set();
            for (var i=0, len=this.items.length; i<len; ++i) {
                if (this.items[i].selected) {
                    this.items[i].selected = false;
                } else {
                    this.selection.add(i);
                    this.items[i].selected = true;
                }
            }
        },
        clearSelection() {
            var selection = Array.from(this.selection);
            for (var i=0, len=selection.length; i<len; ++i) {
                var index = selection[i];
                if (index>-1 && index<this.items.length) {
                    var idx = this.items[index].menu.indexOf(UNSELECT_ACTION);
                    if (idx>-1) {
                        this.items[index].menu[idx]=SELECT_ACTION;
                    }
                    this.items[index].selected = false;
                }
            }
            if (selection.length>0 && (this.items.length>LMS_MAX_NON_SCROLLER_ITEMS || this.grid.use)) {
                this.$nextTick(function () {
                    this.items = JSON.parse(JSON.stringify(this.items));
                });
            }
            this.selection = new Set();
            this.selectStart = undefined;
        },
        select(item, index, event) {
            if (this.selection.size>0) {
                this.itemAction(this.selection.has(index) ? UNSELECT_ACTION : SELECT_ACTION, item, index, event);
            }
        },
        deleteSelectedItems(act) {
            var selection = Array.from(this.selection);
            if (1==selection.size) {
                this.itemAction(act, this.items[selection[0]], selection[0]);
            } else {
                this.$confirm(REMOVE_ACTION==act || REMOVE_FROM_FAV_ACTION==act ? i18n("Remove the selected items?") : i18n("Delete the selected items?"),
                             {buttonTrueText: REMOVE_ACTION==act || REMOVE_FROM_FAV_ACTION==act ? i18n("Remove") : i18n("Delete"),
                              buttonFalseText: i18n('Cancel')}).then(res => {
                    if (res) {
                        var ids=[];
                        selection.sort((a, b) => (undefined!=this.items[b].realIndex ? this.items[b].realIndex : b) - (undefined!=this.items[b].realIndex ? this.items[a].realIndex : a));
                        if (REMOVE_ACTION==act) {
                            selection.forEach(idx => {ids.push("index:"+idx)});
                            bus.$emit('doAllList', ids, ["playlists", "edit", "cmd:delete", this.current.id], this.current.section);
                        } else {
                            selection.forEach(idx => {ids.push(this.items[idx].id)});
                            bus.$emit('doAllList', ids, this.current.section==SECTION_PLAYLISTS ? ["playlists", "delete"] : ["favorites", "delete"],
                                      this.current.section);
                        }
                        this.clearSelection();
                    }
                });
            }
        },
        addSelectedItems() {
            var commands=[];
            var selection = Array.from(this.selection);
            selection.sort(function(a, b) { return a<b ? -1 : 1; });
            for (var i=0, len=selection.length; i<len; ++i) {
                var idx = selection[i];
                if (idx>-1 && idx<this.items.length) {
                    commands.push({act:ADD_ACTION, item:this.items[idx], idx:idx});
                }
            }
            this.doCommands(commands, false);
            this.clearSelection();
        },
        playSelectedItems() {
            var commands=[];
            var selection = Array.from(this.selection);
            selection.sort(function(a, b) { return a<b ? -1 : 1; });
            for (var i=0, len=selection.length; i<len; ++i) {
                var idx = selection[i];
                if (idx>-1 && idx<this.items.length) {
                    commands.push({act:0==i ? PLAY_ACTION : ADD_ACTION, item:this.items[idx], idx:idx});
                }
            }
            this.doCommands(commands, true);
            this.clearSelection();
        },
        doCommands(commands, npAfterLast) {
            if (commands.length>0) {
                var cmd = commands.shift();
                var command = this.buildFullCommand(cmd.item, cmd.act);
                if (command.command.length===0) {
                    bus.$emit('showError', undefined, i18n("Don't know how to handle this!"));
                    return;
                }

                lmsCommand(this.playerId(), command.command).then(({data}) => {
                    logJsonMessage("RESP", data);
                    if (npAfterLast && 0==commands.length && !this.desktop) {
                        this.$store.commit('setPage', 'now-playing');
                    }
                    this.doCommands(commands, npAfterLast);
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
            this.scrollElement.addEventListener('scroll', this.handleScroll);
        },
        handleScroll() {
            this.menu.show = false;
            if (undefined!=this.filteredJumplist && this.filteredJumplist.length>1 && !this.scrollAnimationFrameReq) {
                this.scrollAnimationFrameReq = window.requestAnimationFrame(() => { 
                    this.scrollAnimationFrameReq = undefined;
                    if (undefined!==this.letterTimeout) {
                        clearTimeout(this.letterTimeout);
                    }
                    var subMod = this.grid.haveSubtitle ? 0 : GRID_SINGLE_LINE_DIFF;
                    var index = this.grid.use                                // Add 50 to take into account text size
                                    ? Math.floor((this.scrollElement.scrollTop+(50-subMod)) / (GRID_SIZES[this.grid.size].ih-subMod))*this.grid.numColumns
                                    : Math.floor(this.scrollElement.scrollTop / LMS_LIST_ELEMENT_SIZE);
                    if (this.$store.state.letterOverlay) {
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
                        this.letterTimeout = setTimeout(function () {
                            this.letter = undefined;
                        }.bind(this), 500);
                    } else {
                        this.letter = undefined;
                    }
                    this.jumplistActive = 0;
                    for (var i=0, len=this.filteredJumplist.length; i<len; ++i) {
                        if (this.filteredJumplist[i].index<=index) {
                            this.jumplistActive = i;
                        } else {
                            break;
                        }
                    }
                });
            }
        },
        layoutGrid() {
            if (!this.grid.use) {
                return;
            }

            const ITEM_BORDER = 8;
            const JUMP_LIST_WIDTH = 32;
            const VIEW_RIGHT_PADDING = 4;
            var changed = false;
            var listWidth = this.pageElement.scrollWidth- ((/*scrollbar*/ IS_MOBILE ? 0 : 20) + (this.filteredJumplist.length>1 && this.items.length>10 ? JUMP_LIST_WIDTH :0) + VIEW_RIGHT_PADDING);

            // Calculate what grid item size we should use...
            var size = 0;
            for (var i=1; i<GRID_SIZES.length && listWidth>((GRID_SIZES[i].iw+ITEM_BORDER)*2); ++i) {
                size = i;
            }

            var haveSubtitle = false;
            // How many columns?
            var numColumns = Math.max(Math.min(Math.floor(listWidth/(GRID_SIZES[size].iw+ITEM_BORDER)), this.items.length), 1);
            if (numColumns != this.grid.numColumns) { // Need to re-layout...
                changed = true;
                this.grid.rows=[];
                for (var i=0; i<this.items.length; i+=numColumns) {
                    var indexes=[]
                    for (var j=0; j<numColumns; ++j) {
                        indexes.push(i+j);
                        if (!haveSubtitle && (i+j)<this.items.length && this.items[i+j].subtitle) {
                            haveSubtitle = true;
                        }
                    }
                    this.grid.rows.push({id:"row."+i+"."+numColumns, indexes:indexes});
                }
                this.grid.numColumns = numColumns;
            } else { // Need to check if have subtitles...
                for (var i=0; i<this.items.length && !haveSubtitle; ++i) {
                    if (this.items[i].subtitle) {
                        haveSubtitle = true;
                    }
                }
            }

            if (this.grid.haveSubtitle != haveSubtitle) {
                this.grid.haveSubtitle = haveSubtitle;
                changed = true;
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
               url=changeImageSizing(url, LMS_CURRENT_IMAGE_SIZE);
            }
            setBgndCover(this.scrollElement, url, this.$store.state.darkUi);
        },
        enableRatings() {
            this.showRatingButton = (this.$store.state.ratingsSupport &&
                !(this.current && this.current.id && this.current.id.startsWith("playlist_id:")) &&
                !(this.current && this.current.actions && this.current.actions.go && this.current.actions.go.cmd &&
                  this.current.actions.go.cmd.length>1 && this.current.actions.go.cmd[0]=="trackstat") &&
                this.items[0].id && this.items[0].id.startsWith("track_id:") &&
                this.items[this.items.length-1].id && this.items[this.items.length-1].id.startsWith("track_id:"));
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
        checkFeature(command, id) {
            lmsCommand("", command).then(({data}) => {
                if (data && data.result && undefined!=data.result._can) {
                    var can = 1==data.result._can;
                    if (can && this.disabled.has(id)) {
                        this.disabled.delete(id);
                        setLocalStorageVal("disabledItems", JSON.stringify(Array.from(this.disabled)));
                    } else if (!can && !this.disabled.has(id)) {
                        this.disabled.add(id);
                        setLocalStorageVal("disabledItems", JSON.stringify(Array.from(this.disabled)));
                    }
                }
            });
        },
        jumpTo(item) {
            var pos = this.grid.use
                        ? Math.floor(item.index/this.grid.numColumns)*(GRID_SIZES[this.grid.size].ih-(this.grid.haveSubtitle ? 0 : GRID_SINGLE_LINE_DIFF))
                        : item.index*LMS_LIST_ELEMENT_SIZE;
            setScrollTop(this.scrollElement, pos>0 ? pos : 0);
        },
        filterJumplist() {
            if (this.items.length<=25) {
                return;
            }
            if (IS_MOBILE && (undefined==this.jumplist || this.jumplist.length<1)) {
                this.jumplist = [];
                var jump = this.items.length/100.0;
                for (var i=0; i<100; ++i) {
                    this.jumplist.push({key:'\u2022', index: Math.round(i*jump)});
                }
            }
            if (undefined==this.jumplist || this.jumplist.length<1) {
                return;
            }
            var maxItems = Math.floor((this.scrollElement.clientHeight-(16))/20);
            this.filteredJumplist = shrinkAray(this.jumplist, maxItems);
            this.jumplistWide = this.filteredJumplist[this.filteredJumplist.length-1].key.length>1;
            if (this.$store.state.largeFonts && this.jumplistWide) {
                for(var i=0, len=this.filteredJumplist.length; i<len; ++i) {
                    if (this.filteredJumplist[i].key.length>=4) {
                        this.filteredJumplist[i].key=this.filteredJumplist[i].key.slice(-2);
                    }
                }
            }
        },
        dragStart(which, ev) {
            ev.dataTransfer.dropEffect = 'move';
            ev.dataTransfer.setData('Text', this.id);
            this.dragIndex = which;
            this.stopScrolling = false;
            if (this.selection.size>0 && (!this.selection.has(which) || this.current.isFavFolder)) {
                this.clearSelection();
            }
        },
        dragEnd() {
            this.stopScrolling = true;
            this.dragIndex = undefined;
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
            var pos = this.scrollElement.scrollTop + step;
            setScrollTop(this.scrollElement, pos);
            if (pos<=0 || pos>=this.scrollElement.scrollTopMax) {
                this.stopScrolling = true;
            }
            if (!this.stopScrolling) {
                setTimeout(function () {
                    this.scrollList(step);
                }.bind(this), 100);
            }
        },
        drop(to, ev) {
            this.stopScrolling = true;
            ev.preventDefault();
            if (this.dragIndex!=undefined && to!=this.dragIndex) {
                var sel = Array.from(this.selection);
                this.clearSelection();
                if (sel.length>0) {
                    if (this.current.section!=SECTION_FAVORITES && sel.indexOf(to)<0) {
                        bus.$emit('movePlaylistItems', this.current.id, sel.sort(function(a, b) { return a<b ? -1 : 1; }), to);
                    }
                } else if (this.isTop) {
                    this.items = arrayMove(this.top, this.dragIndex, to);
                    this.saveTopList();
                } else if (this.current && (this.current.section==SECTION_FAVORITES || this.current.section==SECTION_PLAYLISTS)) {
                    var command = this.current.section==SECTION_FAVORITES
                                    ? ["favorites", "move", this.items[this.dragIndex].id.replace("item_id:", "from_id:"),
                                           this.items[to].id.replace("item_id:", "to_id:")+(this.items[to].isFavFolder ? ".0" : "")]
                                    : ["playlists", "edit", "cmd:move", this.current.id, "index:"+this.dragIndex, "toindex:"+to];
                    lmsCommand(this.playerId(), command).then(({datax}) => {
                        this.refreshList();
                    });
                }
            }
            this.dragIndex = undefined;
        },
    },
    mounted() {
        this.pageElement = document.getElementById("browse-view");
        let timeout = undefined;
        window.addEventListener('resize', () => {
            if (this.items.length>LMS_MAX_NON_SCROLLER_ITEMS || this.grid.use) {
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
        lmsCommand("", ["serverstatus", 0, 0, "prefs:useUnifiedArtistsList,noGenreFilter,noRoleFilter,browseagelimit,mediadirs,useLocalImageproxy"]).then(({data}) => {
            if (data && data.result) {
                var separateArtists = 1!=parseInt(data.result.useUnifiedArtistsList);
                if (separateArtists!=getLocalStorageBool('separateArtists', false)) {
                    setLocalStorageVal('separateArtists', separateArtists);
                    clearListCache(true);
                }

                lmsOptions.noGenreFilter = 1==parseInt(data.result.noGenreFilter);
                setLocalStorageVal('noGenreFilter', lmsOptions.noGenreFilter);
                lmsOptions.noRoleFilter = 1==parseInt(data.result.noRoleFilter);
                setLocalStorageVal('noRoleFilter', lmsOptions.noRoleFilter);
                if (undefined!=data.result.browseagelimit) {
                    this.newMusicLimit = parseInt(data.result.browseagelimit);
                }
                this.mediaDirs=data.result.mediadirs;
                // useMySqueezeboxImageProxy defined in utils.js
                useMySqueezeboxImageProxy = undefined==data.result.useLocalImageproxy || 0 == parseInt(data.result.useLocalImageproxy);
            }
        });
        // Artist images?
        lmsCommand("", ["pref", "plugin.musicartistinfo:browseArtistPictures", "?"]).then(({data}) => {
            if (data && data.result && data.result._p2 != null) {
                this.options.artistImages = 1==data.result._p2;
                setLocalStorageVal('artistImages', this.options.artistImages);
            }
        });

        this.checkFeature(["can", "selectRemoteLibrary", "items", "?"], TOP_REMOTE_ID);
        this.checkFeature(["can", "cdplayer", "items", "?"], TOP_CDPLAYER_ID);

        bus.$on('browseDisplayChanged', function() {
            this.options.sortFavorites=this.$store.state.sortFavorites;
            this.options.showPresets=this.$store.state.hidden.has(TOP_PRESETS_ID);
            if (this.$store.state.sortHome) {
                this.saveTopList();
            }
            this.goHome();
        }.bind(this));
        bus.$on('libraryChanged', function() {
            this.setLibrary();
        }.bind(this));
        this.setLibrary();

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
        itemTooltip: function (item) {
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
            return "/material/svg/"+name+"?c="+(dark ? LMS_DARK_SVG : LMS_LIGHT_SVG)+"&r="+LMS_MATERIAL_REVISION;
        },
        tooltip: function (act, showShortcut) {
            return showShortcut && ACTIONS[act].key
                        ? ACTIONS[act].title+SEPARATOR+shortcutStr(ACTIONS[act].key)
                            : showShortcut && ACTIONS[act].skey
                                ? ACTIONS[act].title+SEPARATOR+shortcutStr(ACTIONS[act].skey, true)
                                : ACTIONS[act].title;
        }
    },
    watch: {
        'menu.show': function(newVal) {
            this.$store.commit('menuVisible', {name:'browse', shown:newVal});
        }
    }
});
