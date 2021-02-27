/**
 * LMS-Material
 *
 * Copyright (c) 2018-2021 Craig Drummond <craig.p.drummond@gmail.com>
 * MIT license.
 */
'use strict';

var B_ALBUM_SORTS=[ ];
const ALLOW_ADD_ALL = new Set(['trackinfo', 'youtube', 'spotty', 'qobuz', 'tidal', 'wimp' /*is Tidal*/, 'deezer', 'tracks', 'musicip', 'musicsimilarity', 'bandcamp']); // Allow add-all/play-all from 'trackinfo', as Spotty's 'Top Titles' access via 'More' needs this

var lmsBrowse = Vue.component("lms-browse", {
    template: `
<div id="browse-view">
 <div class="subtoolbar noselect" v-bind:class="{'list-details' : selection.size>0}">
  <v-layout v-if="selection.size>0">
   <div class="toolbar-nobtn-pad"></div>
   <v-layout row wrap>
    <v-flex xs12 class="ellipsis subtoolbar-title subtoolbar-pad">{{trans.selectMultiple}}</v-flex>
    <v-flex xs12 class="ellipsis subtoolbar-subtitle subtext">{{selection.size | displaySelectionCount}}</v-flex>
   </v-layout>
   <v-spacer></v-spacer>
   <v-btn v-if="current && current.section==SECTION_PLAYLISTS && current.id.startsWith('playlist_id:')" :title="trans.removeall" flat icon class="toolbar-button" @click="deleteSelectedItems(REMOVE_ACTION)"><v-icon>{{ACTIONS[REMOVE_ACTION].icon}}</v-icon></v-btn>
   <v-btn v-else-if="current && current.section==SECTION_PLAYLISTS" :title="trans.deleteall" flat icon class="toolbar-button" @click="deleteSelectedItems(DELETE_ACTION)"><v-icon>delete</v-icon></v-btn>
   <v-btn v-else-if="current && current.section==SECTION_FAVORITES" :title="trans.removeall" flat icon class="toolbar-button" @click="deleteSelectedItems(REMOVE_FROM_FAV_ACTION)"><v-icon>delete_outline</v-icon></v-btn>
   <v-divider vertical v-if="current && (current.section==SECTION_PLAYLISTS || current.section==SECTION_FAVORITES)"></v-divider>
   <v-btn :title="trans.addall" flat icon class="toolbar-button" @click="actionSelectedItems(ADD_ACTION)"><v-icon>add_circle_outline</v-icon></v-btn>
   <v-btn :title="trans.playall" flat icon class="toolbar-button" @click="actionSelectedItems(PLAY_ACTION)"><v-icon>play_circle_outline</v-icon></v-btn>
   <v-btn v-if="items[0].stdItem==STD_ITEM_TRACK || items[0].stdItem==STD_ITEM_ALBUM_TRACK || (items[0].header && items.length>1 && items[1].stdItem==STD_ITEM_ALBUM_TRACK)" :title="ACTIONS[ADD_TO_PLAYLIST_ACTION].title" flat icon class="toolbar-button" @click="actionSelectedItems(ADD_TO_PLAYLIST_ACTION)"><v-icon>{{ACTIONS[ADD_TO_PLAYLIST_ACTION].icon}}</v-icon></v-btn>
   <v-divider vertical></v-divider>
   <v-btn :title="trans.invertSelect" flat icon class="toolbar-button" @click="invertSelection()"><img :src="'invert-select' | svgIcon(darkUi)"></img></v-btn>
   <v-btn :title="trans.cancel" flat icon class="toolbar-button" @click="clearSelection()"><v-icon>cancel</v-icon></v-btn>
  </v-layout>
  <v-layout v-else-if="searchActive">
   <v-btn flat icon v-longpress="backBtnPressed" class="toolbar-button back-button" id="back-button" :title="trans.goBack"><v-icon>arrow_back</v-icon></v-btn>
   <lms-search-field @results="handleListResponse"></lms-search-field>
  </v-layout>
  <v-layout v-else-if="headerTitle">
   <v-btn flat icon v-longpress="backBtnPressed" class="toolbar-button" v-bind:class="{'back-button':!homeButton || history.length<2}" id="back-button" :title="trans.goBack"><v-icon>arrow_back</v-icon></v-btn>
   <v-btn v-if="history.length>1 && homeButton" flat icon @click="homeBtnPressed()" class="toolbar-button" id="home-button" :title="trans.goHome"><v-icon>home</v-icon></v-btn>
   <v-layout row wrap @click="showHistory($event)" v-if="headerSubTitle" v-bind:class="{pointer : history.length>1}">
    <v-flex xs12 class="ellipsis subtoolbar-title subtoolbar-pad">{{headerTitle}}</v-flex>
    <v-flex xs12 class="ellipsis subtoolbar-subtitle subtext">{{current && current.id==TOP_MYMUSIC_ID && libraryName ? libraryName : headerSubTitle}}<small v-if="current && current.id!=TOP_MYMUSIC_ID && (libraryName || pinnedItemLibName) && showLibraryName">{{SEPARATOR+(pinnedItemLibName ? pinnedItemLibName : libraryName)}}</small></v-flex>
   </v-layout>
   <div class="ellipsis subtoolbar-title subtoolbar-title-single pointer" @click="showHistory($event)" v-else-if="history.length>1">{{headerTitle}}</div>
   <div class="ellipsis subtoolbar-title subtoolbar-title-single" v-else>{{headerTitle}}</div>
   <v-spacer style="flex-grow: 10!important"></v-spacer>
   <template v-if="desktopLayout" v-for="(action, index) in settingsMenuActions">
    <v-btn flat icon @click.stop="headerAction(action, $event)" class="toolbar-button" :title="ACTIONS[action].title" :id="'tbar'+index">
      <img v-if="ACTIONS[action].svg" class="svg-img" :src="ACTIONS[action].svg | svgIcon(darkUi)"></img>
      <v-icon v-else>{{ACTIONS[action].icon}}</v-icon>
    </v-btn>
   </template>

   <v-btn @click.stop="currentActionsMenu($event)" flat icon class="toolbar-button" :title="trans.plugins" id="tbar-actions" v-if="currentActions.show && currentActions.items.length>1">
    <img class="svg-img" :src="ACTIONS[MORE_LIB_ACTION].svg | svgIcon(darkUi)"></img>
   </v-btn>
   <v-btn @click.stop="currentAction(currentActions.items[0], 0)" flat icon class="toolbar-button" :title="currentActions.items[0].title" id="tbar-actions" v-else-if="currentActions.show && currentActions.items.length==1">
    <img v-if="currentActions.items[0].svg" class="svg-img" :src="currentActions.items[0].svg | svgIcon(darkUi)"></img>
    <v-icon v-else>{{currentActions.items[0].icon}}</v-icon>
   </v-btn>
   <v-btn v-if="items.length>0 && items[0].saveableTrack" :title="ACTIONS[ADD_TO_PLAYLIST_ACTION].title" flat icon class="toolbar-button" @click.stop="headerAction(ADD_TO_PLAYLIST_ACTION, $event)"><v-icon>{{ACTIONS[ADD_TO_PLAYLIST_ACTION].icon}}</v-icon></v-btn>
   <v-divider vertical v-if="tbarActions.length>0 && (currentActions.show || (items.length>0 && items[0].musicip) || (desktopLayout && settingsMenuActions.length>0))"></v-divider>
   <template v-for="(action, index) in tbarActions">
    <v-btn flat icon @click.stop="headerAction(action, $event)" class="toolbar-button" :title="action | tooltip(keyboardControl)" :id="'tbar'+index" v-if="action!=VLIB_ACTION || libraryName">
      <img v-if="ACTIONS[action].svg" class="svg-img" :src="ACTIONS[action].svg | svgIcon(darkUi)"></img>
      <v-icon v-else>{{ACTIONS[action].icon}}</v-icon>
    </v-btn>
   </template>
  </v-layout>
  <v-layout v-else>
   <div class="toolbar-nobtn-pad"></div>
   <div @click="sourcesClicked" class="ellipsis subtoolbar-title subtoolbar-title-single pointer">{{trans.sources}}</div>
   <v-spacer @click="itemAction(SEARCH_LIB_ACTION, $event)" class="pointer"></v-spacer>
   <template v-if="desktopLayout" v-for="(action, index) in settingsMenuActions">
    <v-btn flat icon @click.stop="headerAction(action, $event)" class="toolbar-button" :title="ACTIONS[action].title" :id="'tbar'+index">
      <img v-if="ACTIONS[action].svg" class="svg-img" :src="ACTIONS[action].svg | svgIcon(darkUi)"></img>
      <v-icon v-else>{{ACTIONS[action].icon}}</v-icon>
    </v-btn>
   </template>
   <v-divider vertical v-if="desktopLayout && settingsMenuActions.length>0"></v-divider>
   <v-btn :title="ACTIONS[SEARCH_LIB_ACTION].title" flat icon class="toolbar-button" @click.stop="itemAction(SEARCH_LIB_ACTION, $event)"><v-icon>{{ACTIONS[SEARCH_LIB_ACTION].icon}}</v-icon></v-btn>
  </v-layout>
 </div>
 <v-icon class="browse-progress" v-if="fetchingItems" color="primary">refresh</v-icon>
 <div v-show="letter" id="letterOverlay"></div>

 <div class="noselect bgnd-cover lms-jumplist" v-if="filteredJumplist.length>1">
  <template v-for="(item, index) in filteredJumplist">
   <div @click="jumpTo(item)" v-bind:class="{'active-btn' : jumplistActive==index}">{{jumplistActive!=index && item.alt ? item.alt : (item.key==' ' || item.key=='' ? '?' : item.key)}}</div>
  </template>
 </div>
 <div class="lms-list bgnd-cover" id="browse-list" style="overflow:auto;" v-bind:class="{'lms-image-grid': grid.use, 'lms-image-grid-jump':grid.use && filteredJumplist.length>1, 'lms-list-jump':!grid.use && filteredJumplist.length>1}">

  <RecycleScroller :items="grid.rows" :item-size="grid.ih - (grid.haveSubtitle || isTop || current.id.startsWith(TOP_ID_PREFIX) ? 0 : GRID_SINGLE_LINE_DIFF)" page-mode key-field="id" :buffer="LMS_SCROLLER_GRID_BUFFER" v-if="grid.use">
   <div slot-scope="{item}" :class="[grid.few?'image-grid-few':'image-grid-full-width', grid.haveSubtitle?'image-grid-with-sub':'']">
    <div align="center" style="vertical-align: top" v-for="(citem, col) in item.items" @contextmenu.prevent="itemMenu(citem, item.rs+col, $event)">
     <div v-if="undefined==citem" class="image-grid-item defcursor"></div>
     <div v-else class="image-grid-item" @click="click(citem, item.rs+col, $event)" :title="citem | itemTooltip" :draggable="item.draggable && current.section!=SECTION_FAVORITES" @dragstart="dragStart(item.rs+col, $event)" @dragend="dragEnd()">
      <div v-if="selection.size>0" class="check-btn grid-btn image-grid-select-btn" @click.stop="select(citem, item.rs+col, $event)" :title="ACTIONS[citem.selected ? UNSELECT_ACTION : SELECT_ACTION].title" v-bind:class="{'check-btn-checked':citem.selected}"></div>
      <img v-if="citem.image" :key="citem.image" :src="citem.image" onerror="this.src='html/images/radio.png'" v-bind:class="{'radio-img': SECTION_RADIO==citem.section}" class="image-grid-item-img" loading="lazy"></img>
      <div class="image-grid-item-icon" v-else>
       <v-icon v-if="citem.icon" class="image-grid-item-img image-grid-item-icon">{{citem.icon}}</v-icon>
       <img v-else-if="citem.svg" class="image-grid-item-svg" :src="citem.svg | svgIcon(darkUi)" loading="lazy"></img>
       <img v-else class="image-grid-item-svg" :src="'image' | svgIcon(darkUi)" loading="lazy"></img>
      </div>
      <div v-if="citem.image" class="image-grid-text" @click.stop="itemMenu(citem, item.rs+col, $event)">{{citem.title}}</div>
      <div v-else class="image-grid-text">{{citem.title}}</div>
      <div class="image-grid-text subtext" v-bind:class="{'link-item':subtitleClickable}" @click.stop="clickSubtitle(citem, item.rs+col, $event)">{{isTop && libraryName && citem.id==TOP_MYMUSIC_ID ? libraryName : citem.libname ? citem.libname : citem.subtitle}}</div>
      <div class="menu-btn grid-btn image-grid-btn" v-if="undefined!=citem.stdItem || (citem.menu && citem.menu.length>0) || (isTop && libraryName && citem.id==TOP_MYMUSIC_ID)" @click.stop="itemMenu(citem, item.rs+col, $event)" :title="i18n('%1 (Menu)', citem.title)"></div>
      <div class="emblem" v-if="citem.emblem" :style="{background: citem.emblem.bgnd}">
       <img :src="citem.emblem | emblem()" loading="lazy"></img>
      </div>
      <div v-if="hoverBtns && selection.size==0 && (undefined!=citem.stdItem || (citem.menu && citem.menu.length>0 && (citem.menu[0]==PLAY_ACTION || citem.menu[0]==PLAY_ALL_ACTION)))" class="grid-btns">
       <div class="play-btn grid-btn" @click.stop="itemAction(PLAY_ACTION, citem, item.rs+col, $event)" :title="ACTIONS[PLAY_ACTION].title"></div>
       <div class="add-btn grid-btn" @click.stop="itemAction(ADD_ACTION, citem, item.rs+col, $event)" :title="ACTIONS[ADD_ACTION].title"></div>
      </div>
     </div>
    </div>
   </div>
  </RecycleScroller>

  <RecycleScroller v-else-if="useRecyclerForLists" :items="items" :item-size="LMS_LIST_ELEMENT_SIZE" page-mode key-field="id" :buffer="LMS_SCROLLER_LIST_BUFFER">
   <v-list-tile avatar @click="click(item, index, $event)" slot-scope="{item, index}" @dragstart="dragStart(index, $event)" @dragend="dragEnd()" @dragover="dragOver(index, $event)" @drop="drop(index, $event)" :draggable="item.draggable && (current.section!=SECTION_FAVORITES || 0==selection.size)" v-bind:class="{'browse-header' : item.header, 'drop-target':dragActive && index==dropIndex}" @contextmenu.prevent="itemMenu(item, index, $event)">
    <v-list-tile-avatar v-if="item.selected" :tile="true" class="lms-avatar">
     <v-icon>check_box</v-icon>
    </v-list-tile-avatar>
    <v-list-tile-avatar v-else-if="item.image && (artwork || isTop)" :tile="true" v-bind:class="{'radio-image': SECTION_RADIO==item.section}" class="lms-avatar">
     <img :key="item.image" :src="item.image" onerror="this.src='html/images/radio.png'" loading="lazy"></img>
    </v-list-tile-avatar>
    <v-list-tile-avatar v-else-if="item.icon && !item.icon.startsWith('http')" :tile="true" class="lms-avatar">
     <v-icon>{{item.icon}}</v-icon>
    </v-list-tile-avatar>
    <v-list-tile-avatar v-else-if="item.svg" :tile="true" class="lms-avatar">
      <img class="svg-list-img" :src="item.svg | svgIcon(darkUi)" loading="lazy"></img>
    </v-list-tile-avatar>

    <!-- TODO: Do we have search fields with large lists?? -->
    <v-list-tile-content v-if="item.header" @click="click(item, index, $event)"><v-list-tile-title>{{item.title}}</v-list-tile-title></v-list-tile-content>
    <v-list-tile-content v-else>
     <v-list-tile-title>{{item.title}}</v-list-tile-title>
      <v-list-tile-sub-title v-html="item.subtitle" v-bind:class="{'link-item':subtitleClickable}" @click.stop="clickSubtitle(item, index, $event, $event)"></v-list-tile-sub-title>
    </v-list-tile-content>

    <v-list-tile-action class="browse-action" v-if="undefined!=item.stdItem || (item.menu && item.menu.length>0)">
     <div v-if="hoverBtns && 0==selection.size && (undefined!=item.stdItem || item.menu[0]==PLAY_ACTION || item.menu[0]==PLAY_ALL_ACTION)" class="list-btns">
      <div class="play-btn grid-btn" @click.stop="itemAction(item.header ? PLAY_ALL_ACTION : PLAY_ACTION, item, index, $event)" :title="ACTIONS[PLAY_ACTION].title"></div>
      <div class="add-btn grid-btn" @click.stop="itemAction(item.header ? ADD_ALL_ACTION : ADD_ACTION, item, index, $event)" :title="ACTIONS[ADD_ACTION].title"></div>
     </div>
     <div class="menu-btn grid-btn list-btn" @click.stop="itemMenu(item, index, $event)" :title="i18n('%1 (Menu)', item.title)"></div>
    </v-list-tile-action>
    <div class="emblem" v-if="item.emblem && artwork" :style="{background: item.emblem.bgnd}">
     <img :src="item.emblem | emblem()" loading="lazy"></img>
    </div>
   </v-list-tile>
  </RecycleScroller>

  <template v-else v-for="(item, index) in items">
   <v-list-tile v-if="item.type=='text' && canClickText(item)" avatar @click="click(item, index, $event)" v-bind:class="{'error-text': item.id==='error'}" class="lms-avatar lms-list-item" @contextmenu.prevent="itemMenu(item, index, $event)">
    <v-list-tile-content>
     <v-list-tile-title>{{item.title}}</v-list-tile-title>
     <v-list-tile-sub-title v-html="item.subtitle"></v-list-tile-sub-title>
    </v-list-tile-content>
   </v-list-tile>
   <v-list-tile v-else-if="item.type=='html'" class="lms-list-item browse-html" v-html="item.title"></v-list-tile>
   <v-list-tile v-else-if="item.type=='text'" class="lms-list-item browse-text">{{item.title}}</v-list-tile>
   <v-list-tile v-else-if="item.header" class="lms-list-item browse-header" @click="click(item, index, $event)"><v-list-tile-content><v-list-tile-title>{{item.title}}</v-list-tile-title></v-list-tile-content>
    <v-list-tile-action class="browse-action" v-if="undefined!=item.stdItem || (item.menu && item.menu.length>0)" :title="i18n('%1 (Menu)', item.title)">
     <div v-if="hoverBtns && 0==selection.size && (undefined!=item.stdItem || item.menu[0]==PLAY_ACTION || item.menu[0]==PLAY_ALL_ACTION)" class="list-btns">
      <div class="play-btn grid-btn" @click.stop="itemAction(PLAY_ALL_ACTION, item, index, $event)" :title="ACTIONS[PLAY_ACTION].title"></div>
      <div class="add-btn grid-btn" @click.stop="itemAction(ADD_ALL_ACTION, item, index, $event)" :title="ACTIONS[ADD_ACTION].title"></div>
     </div>
     <div class="menu-btn grid-btn list-btn" @click.stop="itemMenu(item, index, $event)" :title="i18n('%1 (Menu)', item.title)"></div>
    </v-list-tile-action>
   </v-list-tile>
   <v-list-tile v-else-if="!(isTop && (disabled.has(item.id) || hidden.has(item.id)))" avatar @click="click(item, index, $event)" :key="item.id" class="lms-avatar lms-list-item" :id="'item'+index" @dragstart="dragStart(index, $event)" @dragend="dragEnd()" @dragover="dragOver(index, $event)" @drop="drop(index, $event)" :draggable="(isTop && !sortHome) || (item.draggable && (current.section!=SECTION_FAVORITES || 0==selection.size))" @contextmenu.prevent="itemMenu(item, index, $event)" v-bind:class="{'drop-target': dragActive && index==dropIndex}">
    <v-list-tile-avatar v-if="item.selected" :tile="true" class="lms-avatar">
     <v-icon>check_box</v-icon>
    </v-list-tile-avatar>
    <v-list-tile-avatar v-else-if="item.image && (isTop || artwork)" :tile="true" v-bind:class="{'radio-image': SECTION_RADIO==item.section, 'lms-avatar-small': isTop || (current && (current.id==TOP_RADIO_ID || current.id==TOP_APPS_ID)), 'lms-avatar': current && current.id!=TOP_RADIO_ID && current.id!=TOP_APPS_ID}">
     <img :key="item.image" v-lazy="item.image" onerror="this.src='html/images/radio.png'"></img>
    </v-list-tile-avatar>
    <v-list-tile-avatar v-else-if="item.icon && !item.icon.startsWith('http')" :tile="true" class="lms-avatar">
     <v-icon>{{item.icon}}</v-icon>
    </v-list-tile-avatar>
    <v-list-tile-avatar v-else-if="item.svg" :tile="true" class="lms-avatar">
      <img class="svg-list-img" :src="item.svg | svgIcon(darkUi)"></img>
    </v-list-tile-avatar>
    <v-list-tile-avatar v-else-if="selection.size>0" :tile="true" class="lms-avatar">
     <v-icon>check_box_outline_blank</v-icon>
    </v-list-tile-avatar>

    <v-list-tile-content v-if="item.type=='search'">
     <v-text-field :autofocus="index==0 && !IS_MOBILE" single-line clearable class="lms-search" :label="item.title" v-on:keyup.enter="search($event, item)"></v-text-field>
    </v-list-tile-content>

    <v-list-tile-content v-else-if="item.type=='entry'">
     <v-text-field :autofocus="index==0 && !IS_MOBILE" single-line clearable class="lms-search" :label="item.title" v-on:keyup.enter="entry($event, item)"></v-text-field>
    </v-list-tile-content>

    <v-list-tile-content v-else>
     <v-list-tile-title>{{item.title}}<b class="vlib-name" v-if="isTop && (item.libname || (libraryName && item.id==TOP_MYMUSIC_ID))">{{SEPARATOR+(item.libname ? item.libname : libraryName)}}</b></v-list-tile-title>
     <v-list-tile-sub-title v-html="item.subtitle" v-bind:class="{'link-item':subtitleClickable}" @click.stop="clickSubtitle(item, index, $event)"></v-list-tile-sub-title>
    </v-list-tile-content>

    <v-list-tile-action class="browse-action" v-if="undefined!=item.stdItem || (item.menu && item.menu.length>0) || (isTop && libraryName && item.id==TOP_MYMUSIC_ID)">
     <div v-if="hoverBtns && 0==selection.size && (undefined!=item.stdItem || item.menu[0]==PLAY_ACTION || item.menu[0]==PLAY_ALL_ACTION)" class="list-btns">
      <div class="play-btn grid-btn" @click.stop="itemAction(PLAY_ACTION, item, index, $event)" :title="ACTIONS[PLAY_ACTION].title"></div>
      <div class="add-btn grid-btn" @click.stop="itemAction(ADD_ACTION, item, index, $event)" :title="ACTIONS[ADD_ACTION].title"></div>
     </div>
     <div class="menu-btn grid-btn list-btn" @click.stop="itemMenu(item, index, $event)" :title="i18n('%1 (Menu)', item.title)"></div>
    </v-list-tile-action>
    <div class="emblem" v-if="item.emblem && artwork" :style="{background: item.emblem.bgnd}">
     <img :src="item.emblem | emblem()" loading="lazy"></img>
    </div>
   </v-list-tile>
  </template>

 </div>

 <v-menu v-model="menu.show" :position-x="menu.x" :position-y="menu.y">
  <v-list v-if="menu.item && menu.item.moremenu">
   <template v-for="(entry, index) in menu.item.moremenu">
    <v-list-tile @click="itemMoreAction(menu.item, index)">
     <v-list-tile-title>{{entry.title}}</v-list-tile-title>
    </v-list-tile>
   </template>
  </v-list>
  <v-list v-else-if="menu.item">
   <template v-for="(action, index) in menu.itemMenu">
    <v-divider v-if="DIVIDER==action"></v-divider>
    <v-list-tile v-else-if="action==ADD_TO_FAV_ACTION && isInFavorites(menu.item)" @click="itemAction(REMOVE_FROM_FAV_ACTION, menu.item, menu.index, $event)">
     <v-list-tile-avatar v-if="menuIcons">
      <v-icon v-if="undefined==ACTIONS[REMOVE_FROM_FAV_ACTION].svg">{{ACTIONS[REMOVE_FROM_FAV_ACTION].icon}}</v-icon>
      <img v-else class="svg-img" :src="ACTIONS[REMOVE_FROM_FAV_ACTION].svg | svgIcon(darkUi)"></img>
     </v-list-tile-avatar>
     <v-list-tile-title>{{ACTIONS[REMOVE_FROM_FAV_ACTION].title}}</v-list-tile-title>
    </v-list-tile>
    <v-list-tile v-else-if="action==SELECT_ACTION && menu.item.selected" @click="itemAction(UNSELECT_ACTION, menu.item, menu.index, $event)">
     <v-list-tile-avatar v-if="menuIcons">
      <v-icon>{{ACTIONS[UNSELECT_ACTION].icon}}</v-icon>
     </v-list-tile-avatar>
     <v-list-tile-title>{{ACTIONS[UNSELECT_ACTION].title}}</v-list-tile-title>
    </v-list-tile>
    <v-list-tile v-else-if="action==BR_COPY_ACTION ? queueSelection : action==MOVE_HERE_ACTION ? (selection.size>0 && !menu.item.selected) : action==RATING_ACTION ? undefined!=ratingsPlugin : true" @click="itemAction(action, menu.item, menu.index, $event)">
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
  <v-list class="vlib-menu" v-else-if="menu.libraries">
   <template v-for="(item, index) in menu.libraries">
    <v-list-tile @click="selectLibrary(item.id)">
     <v-list-tile-avatar><v-icon small>{{item.name==libraryName ? 'radio_button_checked' :'radio_button_unchecked'}}</v-icon></v-list-tile-avatar>
     <v-list-tile-content><v-list-tile-title>{{item.name}}</v-list-tile-title></v-list-tile-content>
     <v-list-tile-action @click="deleteLibrary(item)" v-if="index>0 && unlockAll" :title="i18n('Delete %1', item.name)"><v-btn icon><v-icon>delete_outline</v-icon></v-btn></v-list-tile-action>
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
  <v-list v-else-if="menu.currentActions">
   <template v-for="(item, index) in menu.currentActions">
    <v-divider v-if="DIVIDER==item.action"></v-divider>
    <v-list-tile v-else-if="item.action==ADD_TO_FAV_ACTION && isInFavorites(current)" @click="itemAction(REMOVE_FROM_FAV_ACTION, current, undefined, $event)">
     <v-list-tile-avatar v-if="menuIcons">
      <v-icon v-if="undefined==ACTIONS[REMOVE_FROM_FAV_ACTION].svg">{{ACTIONS[REMOVE_FROM_FAV_ACTION].icon}}</v-icon>
      <img v-else class="svg-img" :src="ACTIONS[REMOVE_FROM_FAV_ACTION].svg | svgIcon(darkUi)"></img>
     </v-list-tile-avatar>
     <v-list-tile-title>{{ACTIONS[REMOVE_FROM_FAV_ACTION].title}}</v-list-tile-title>
    </v-list-tile>
    <v-list-tile v-else-if="undefined!=item.action" @click="itemAction(item.action, current, undefined, $event)">
     <v-list-tile-avatar v-if="menuIcons">
      <v-icon v-if="undefined==ACTIONS[item.action].svg">{{ACTIONS[item.action].icon}}</v-icon>
      <img v-else class="svg-img" :src="ACTIONS[item.action].svg | svgIcon(darkUi)"></img>
     </v-list-tile-avatar>
     <v-list-tile-content><v-list-tile-title>{{ACTIONS[item.action].title}}</v-list-tile-title></v-list-tile-content>
    </v-list-tile>
    <v-list-tile v-else @click="currentAction(item, index)">
     <v-list-tile-avatar v-if="menuIcons">
      <v-icon v-if="undefined==item.svg">{{item.icon}}</v-icon>
      <img v-else class="svg-img" :src="item.svg | svgIcon(darkUi)"></img>
     </v-list-tile-avatar>
     <v-list-tile-content><v-list-tile-title>{{item.title}}</v-list-tile-title></v-list-tile-content>
    </v-list-tile>
   </template>
  </v-list>
  <v-list v-else-if="menu.linkItems">
   <template v-for="(item, index) in menu.linkItems">
    <v-list-tile @click="linkAction(item)">
     <v-list-tile-avatar v-if="menuIcons">
      <v-icon v-if="undefined==item.svg">{{item.icon}}</v-icon>
      <img v-else class="svg-img" :src="item.svg | svgIcon(darkUi)"></img>
     </v-list-tile-avatar>
     <v-list-tile-content><v-list-tile-title>{{item.title}}</v-list-tile-title></v-list-tile-content>
    </v-list-tile>
   </template>
  </v-list>
 </v-menu>
</div>
      `,
    data() {
        return {
            current: undefined,
            currentActions: {show:false, items:[]},
            items: [],
            grid: {allowed:true, use:false, numColumns:0, ih:GRID_MIN_HEIGHT, rows:[], few:false, haveSubtitle:true},
            fetchingItems: false,
            hoverBtns: false,
            trans: { ok:undefined, cancel: undefined, selectMultiple:undefined, addall:undefined, playall:undefined,
                     deleteall:undefined, removeall:undefined, invertSelect:undefined, choosepos:undefined, goHome:undefined, goBack:undefined,
                     select:undefined, unselect:undefined, sources: undefined },
            menu: { show:false, item: undefined, x:0, y:0},
            isTop: true,
            libraryName: undefined, // Name of currently chosen library
            pinnedItemLibName: undefined, // Name of library from pinned item - if saved with pinned item
            selection: new Set(),
            section: undefined,
            letter: undefined,
            filteredJumplist: [],
            jumplistActive: 0,
            tbarActions: [],
            settingsMenuActions: [],
            subtitleClickable: false,
            disabled: new Set(),
            wide: false,
            searchActive: false,
            dragActive: false,
            dropIndex: -1
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
        artwork() {
            return this.$store.state.showArtwork
        },
        keyboardControl() {
            return this.$store.state.keyboardControl && !IS_MOBILE
        },
        desktopLayout() {
            return this.$store.state.desktopLayout
        },
        unlockAll() {
            return this.$store.state.unlockAll
        },
        showLibraryName() {
            return this.pinnedItemLibName ||
                   ( this.$store.state.library && this.$store.state.library!=LMS_DEFAULT_LIBRARY &&
                    ( (this.current && this.current.id.startsWith(MUSIC_ID_PREFIX)) ||
                      (this.history.length>1 && this.history[1].current && this.history[1].current.id.startsWith(MUSIC_ID_PREFIX)) ||
                      (this.history.length>2 && this.history[2].current && this.history[2].current.id.startsWith(MUSIC_ID_PREFIX)) ) )
        },
        ratingsPlugin() {
            return this.$store.state.ratingsPlugin
        },
        homeButton() {
            return this.$store.state.homeButton
        },
        useRecyclerForLists() {
            return !this.isTop && this.items.length>LMS_MAX_NON_SCROLLER_ITEMS
        }
    },
    created() {
        if (!IS_MOBILE) {
            let browse = this;
            document.onkeyup = function(event) {
                if (!event.ctrlKey && !event.altKey && !event.metaKey && undefined!=browse.jumplist && browse.jumplist.length>1 &&
                    browse.$store.state.openDialogs.length<1 && browse.$store.state.visibleMenus.size<1 && (browse.$store.state.desktopLayout || browse.$store.state.page=="browse")) {
                    let key = event.key.toUpperCase();
                    if ('#'==key) {
                        browse.jumpTo(browse.jumplist[0]);
                    } else {
                        for (let i=0, loop=browse.jumplist, len=loop.length; i<len; ++i) {
                            if (loop[i].key == key) {
                                browse.jumpTo(loop[i]);
                                break;
                            }
                        }
                    }
                }
            };
        }
        this.reqId = 0;
        this.myMusic=[];
        this.history=[];
        this.fetchingItems = false;
        this.current = null;
        this.currentLibId = null;
        this.headerTitle = null;
        this.headerSubTitle=null;
        this.tbarActions=[];
        this.options={pinned: new Set(),
                      sortFavorites: this.$store.state.sortFavorites};
        this.previousScrollPos=0;
        this.grid = {allowed:true, use:isSetToUseGrid(GRID_OTHER), numColumns:0, ih:GRID_MIN_HEIGHT, rows:[], few:false, haveSubtitle:true};
        this.settingsMenuActions=[this.grid.use ? USE_LIST_ACTION : USE_GRID_ACTION];
        this.canDrop = true;

        if (!IS_MOBILE) {
            bindKey('home');
            bindKey(LMS_SEARCH_KEYBOARD, 'mod');
            bindKey(LMS_PLAY_KEYBOARD, 'mod+shift');
            bindKey(LMS_APPEND_KEYBOARD, 'mod+shift');
            bindKey(LMS_ADD_ITEM_ACTION_KEYBOARD, 'mod+shift');
            bindKey(LMS_CREATE_FAV_FOLDER_KEYBOARD, 'mod+shift');
            bindKey('pageup');
            bindKey('pagedown');
            bindKey('left', 'mod');
            bus.$on('keyboard', function(key, modifier) {
                if (this.$store.state.openDialogs.length>0 || this.$store.state.visibleMenus.size>0 || (!this.$store.state.desktopLayout && this.$store.state.page!="browse")) {
                    return;
                }
                if ('mod'==modifier) {
                    if (LMS_SEARCH_KEYBOARD==key) {
                        if ((this.history.length==0 && !this.$store.state.hidden.has(TOP_MYMUSIC_ID)) || (this.current && (this.current.id==TOP_MYMUSIC_ID || this.current.id.startsWith(SEARCH_ID)))) {
                            this.itemAction(SEARCH_LIB_ACTION);
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
                                this.actionSelectedItems(PLAY_ACTION);
                            } else if (LMS_APPEND_KEYBOARD==key && this.selection.size>0) {
                                this.actionSelectedItems(ADD_ACTION);
                            } else {
                                this.headerAction(this.tbarActions[i], undefined);
                            }
                            break;
                        }
                    }
                } else if (!modifier) {
                    if ('home'==key) {
                        this.goHome();
                    } else if ('pageup'==key) {
                        this.scrollElement.scrollBy(0, -1*this.scrollElement.clientHeight);
                    } else if ('pagedown'==key) {
                        this.scrollElement.scrollBy(0, this.scrollElement.clientHeight);
                    }
                }
            }.bind(this));
        }
        bus.$on('advSearchResults', function(item, command, resp) {
            this.handleListResponse(item, command, resp);
            this.tbarActions.unshift(ADV_SEARCH_ACTION);
            if (this.items.length>0) {
                this.tbarActions.unshift(SAVE_VLIB_ACTION);
            }
        }.bind(this));
    },
    methods: {
        initItems() {
            updateActionStrings();
            B_ALBUM_SORTS=[ { key:"album",           label:i18n("Album")},
                            { key:"artistalbum",     label:i18n("Artist, Album")},
                            { key:"artflow",         label:i18n("Artist, Year, Album")},
                            { key:"yearalbum",       label:i18n("Year, Album")},
                            { key:"yearartistalbum", label:i18n("Year, Artist, Album")} ];
            this.trans= { ok:i18n('OK'), cancel: i18n('Cancel'), selectMultiple:i18n("Select multiple items"), addall:i18n("Add selection to queue"),
                          playall:i18n("Play selection"), deleteall:i18n("Delete all selected items"),
                          invertSelect:i18n("Invert selection"), removeall:i18n("Remove all selected items"), choosepos:i18n("Choose position"), 
                          goHome:i18n("Go home"), goBack:i18n("Go back"), sources:i18n("Music sources") };

            if (undefined==this.top || this.top.length==0) {
                this.top = [{ command: [],
                              params: [],
                              icon: "library_music",
                              type: "group",
                              weight: 0,
                              id: TOP_MYMUSIC_ID },
                            { command: ["radios"],
                              params: ["menu:radio"],
                              svg: "radio-tower",
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
                            { command: ["myapps", "items"],
                              params: ["menu:1"],
                              icon: "apps",
                              type: "group",
                              weight: 4,
                              id: TOP_APPS_ID,
                              section: SECTION_APPS },
                            { command: ["material-skin", "extras"],
                              params: [],
                              icon: "extension",
                              type: "group",
                              weight: 5,
                              id: TOP_EXTRAS_ID },
                            { command: ["cdplayer", "items"],
                              params: ["menu:1"],
                              svg: "cd-player",
                              type: "group",
                              weight: 6,
                              id: TOP_CDPLAYER_ID },
                            { command: ["selectRemoteLibrary", "items"],
                              params: ["menu:selectRemoteLibrary", "menu:1"],
                              icon: "cloud",
                              type: "group",
                              weight: 7,
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
                                : this.top[i].id==TOP_APPS_ID
                                    ? i18n("Apps")
                                    : this.top[i].id==TOP_EXTRAS_ID
                                        ? i18n("Extras")
                                        :this.top[i].id==TOP_CDPLAYER_ID
                                            ? i18n("CD Player")
                                            : this.top[i].id==TOP_REMOTE_ID
                                                ? i18n("Remote Libraries")
                                                : this.top[i].title;
            }

            if (this.history.length<1) {
                this.items = this.top;
                this.layoutGrid(true);
            }
        },
        playerId() {
            return this.$store.state.player ? this.$store.state.player.id : "";
        },
        addHistory() {
            browseAddHistory(this);
        },
        nextReqId() {
            this.reqId++;
            if (this.reqId>65535) {
                this.reqId=1;
            }
            return this.reqId;
        },
        isCurrentReq(data) {
            return data.id==this.reqId;
        },
        fetchItems(command, item, prevPage) {
            if (this.fetchingItems) {
                return;
            }

            this.fetchingItems = true;
            var count = item.limit ? item.limit : LMS_BATCH_SIZE;
            lmsList(this.playerId(), command.command, command.params, 0, count, item.cancache, this.nextReqId()).then(({data}) => {
                if (this.isCurrentReq(data)) {
                    var resp = parseBrowseResp(data, item, this.options, item.cancache ? cacheKey(command.command, command.params, 0, count) : undefined, this.command, this.inGenre);
                    this.handleListResponse(item, command, resp, prevPage);
                    this.fetchingItems = false;
                }
            }).catch(err => {
                this.fetchingItems = false;
                this.handleListResponse(item, command, {items: []});
                logError(err, command.command, command.params, 0, count);
            });
        },
        fetchUrlItems(url, provider, item) {
            if (this.fetchingItems) {
                return;
            }

            this.fetchingItems = true;
            lmsCommand("", ["material-skin", "geturl", "url:"+url]).then(({data}) => {
                this.fetchingItems = false;
                this.handleListResponse(item ? item : {title:i18n("Search"), type:'search', id:"search-resp"}, {command:[], params:[]}, parseBrowseUrlResp(data, provider));
            }).catch(err => {
                this.fetchingItems = false;
                this.handleListResponse(item ? item : {title:i18n("Search"), type:'search', id:"search-resp"}, {command:[], params:[]}, {items: []});
                logError(err);
            });
        },
        handleListResponse(item, command, resp, prevPage) {
            browseHandleListResponse(this, item, command, resp, prevPage);
        },
        handleTextClickResponse(item, command, data, isMoreMenu) {
            browseHandleTextClickResponse(this, item, command, data, isMoreMenu);
        },
        canClickText(item) {
            return (item.style && item.style.startsWith('item') && item.style!='itemNoAction') ||
                   // Some items have style=itemNoAction, but we have an action??? DynamicPlaylists...
                   (/*!item.style &&*/ ( (item.actions && (item.actions.go || item.actions.do)) || item.nextWindow || item.params /*CustomBrowse*/));
        },
        doTextClick(item, isMoreMenu) {
            var command = this.buildCommand(item);
            if ((command.command.length==2 && ("items"==command.command[1] || "browsejive"==command.command[1] || "jiveplaylistparameters"==command.command[1])) ||
                (command.command.length==1 && "albums"==command.command[0])) {
                this.fetchingItems = true;
                lmsList(this.playerId(), command.command, command.params, 0, LMS_BATCH_SIZE, undefined, this.nextReqId()).then(({data}) => {
                    if (this.isCurrentReq(data)) {
                        this.fetchingItems = false;
                        this.handleTextClickResponse(item, command, data, isMoreMenu);
                    }
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
            browseClick(this, item, index, event);
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
            // PhotoSwipe seems to emit an 'esc' when closed, which causes us to navigate back. If we delay emitting
            // dialogOpen.browse-viewer.false by 1/2 second the code looking for 'esc' still thinks this dialog is open, and
            // so ignores the event. Hacky, but works.
            this.gallery.listen('close', function() { setTimeout(function () { bus.$emit('dialogOpen', 'browse-viewer', false); }, 500); });
        },
        search(event, item, text) {
            if (this.fetchingItems) {
                return;
            }
            this.enteredTerm = undefined==event ? text : event.target._value;
            if (undefined==this.enteredTerm) {
                return
            }
            this.enteredTerm=this.enteredTerm.trim();
            if (isEmpty(this.enteredTerm)) {
                return;
            }
            this.fetchItems(this.buildCommand(item), item);
        },
        entry(event, item, text) {
            if (this.fetchingItems) {
                return;
            }
            this.enteredTerm = undefined==event ? text : event.target._value;
            this.doTextClick(item);
        },
        itemMoreMenu(item, queueIndex, page) {
            if (undefined!=queueIndex) {
                this.fetchItems({command: ["trackinfo", "items"], params: ["playlist_index:"+queueIndex, "menu:1", "html:1"]}, item, page);
            } else if (item.id) {
                var params=[item.id, "menu:1", "html:1"];
                if (item.id.startsWith("artist_id:")) {
                    this.fetchItems({command: ["artistinfo", "items"], params: params}, {id:item.id, title:item.title}, page);
                } else if (item.id.startsWith("album_id:")) {
                    this.fetchItems({command: ["albuminfo", "items"], params: params}, {id:item.id, title:item.title}, page);
                } else if (item.id.startsWith("track_id:")) {
                    this.fetchItems({command: ["trackinfo", "items"], params: params}, item, page);
                } else if (item.id.startsWith("genre_id:")) {
                    this.fetchItems({command: ["genreinfo", "items"], params: params}, item, page);
                }
            }
        },
        sourcesClicked() {
            // This timeout is a hacky fix for touch devices. When search is opened from home page (where 'Music sources' reacts
            // to clicks) and the back button is clicked to close - then the click 'seems' to fall through to 'Music sources' and
            // the search widget re-shown! Therefore, ingore click events on 'Music sources' for the first 750ms it is shown.
            if (undefined==this.backBtnPressTime || (new Date().getTime()-this.backBtnPressTime)>750) {
                browseItemAction(this, SEARCH_LIB_ACTION);
            }
        },
        itemAction(act, item, index, event) {
            browseItemAction(this, act, item, index, event);
        },
        itemMoreAction(item, index) {
            this.doTextClick(item.moremenu[index], true);
        },
        itemMenu(item, index, event) {
            browseItemMenu(this, item, index, event);
        },
        currentActionsMenu(event) {
            showMenu(this, {show:true, currentActions:this.currentActions.items, x:event.clientX, y:event.clientY});
        },
        currentAction(act, index) {
            if (act.albumRating) {
                this.setAlbumRating();
            } else if (act.custom) {
                doCustomAction(act, this.$store.state.player, this.current);
            } else if (undefined!=act.do) {
                this.fetchItems(act.do, {cancache:false, id:"currentaction:"+index, title:act.title+SEPARATOR+this.current.title});
            } else {
                var cmd = {command:["browseonlineartist", "items"], params:["service_id:"+act.id, this.current.id, "menu:1"]};
                this.fetchItems(cmd, {cancache:false, id:act.id, title:act.title+SEPARATOR+this.current.title, command:cmd.command, params:cmd.params});
            }
        },
        linkAction(item) {
            if (FOLLOW_LINK_ACTION==item.act) {
                openWindow(item.link);
            } else if (SEARCH_TEXT_ACTION==item.act) {
                bus.$emit('browse-search', item.text);
            }
        },
        clickSubtitle(item, index, event) {
            if (this.selection.size>0) {
                this.select(item, index, event);
                return;
            }
            if (IS_MOBILE && this.grid.use) {
                this.itemMenu(item, index, event);
            } else if (!IS_MOBILE && this.subtitleClickable && item.id && item.artist_id && item.id.startsWith("album_id:")) {
                if (undefined!=item.artist_ids && item.artist_ids.length>1) {
                    var entries = [];
                    console.log(item.artist_ids, item.artist_ids.length);
                    for (var i=0, len=item.artist_ids.length; i<len; ++i) {
                        entries.push({id:"artist_id:"+item.artist_ids[i], title:item.artists[i], stdItem:STD_ITEM_ARTIST});
                    }
                    showMenu(this, {show:true, x:event.clientX, y:event.clientY, item:{moremenu:entries}});
                } else {
                    this.fetchItems(this.replaceCommandTerms({command:["albums"], params:["artist_id:"+item.artist_id, ARTIST_ALBUM_TAGS, SORT_KEY+ARTIST_ALBUM_SORT_PLACEHOLDER]}),
                                    {cancache:false, id:"artist_id:"+item.artist_id, title:item.subtitle, stdItem:STD_ITEM_ARTIST});
                }
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
            confirm(i18n("Delete '%1'?", lib.name)+addNote(i18n("This will remove the 'virtual library', but will not delete the actual music files contained within.")), i18n('Delete')).then(res => {
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
                setAlbumSort(this.command, this.inGenre, sort.key);
                this.refreshList(false);
            }
        },
        headerAction(act, event) {
            browseHeaderAction(this, act, event);
        },
        changeLayout(useGrid) {
            if (this.grid.use!=useGrid) {
                this.grid.use=useGrid;
                this.$nextTick(function () {
                    this.setBgndCover();
                    this.layoutGrid(true);
                    setUseGrid(this.isTop || (this.current && this.current.id!=TOP_FAVORITES_ID && (this.current.id.startsWith(TOP_ID_PREFIX) || this.current.id==GENRES_ID)) ? GRID_OTHER : this.command, this.grid.use);
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
                    // Scroll to top. Without this, on iPad with iOS12 at least, grid->list scroll becomes slugish.
                    // But if user clicks on jumplist (which would call setScrollTop) then scrolling improves???
                    setScrollTop(this, 0);
                });
            }
        },
        refreshList(restorePosition) {
            this.clearSelection();
            var pos=undefined==restorePosition || restorePosition ? this.scrollElement.scrollTop : 0;
            this.fetchingItems = true;
            lmsList(this.playerId(), this.command.command, this.command.params, 0, LMS_BATCH_SIZE, this.current.cancache).then(({data}) => {
                var resp = parseBrowseResp(data, this.current, this.options, this.current.cancache ? cacheKey(this.command.command, this.command.params, 0, LMS_BATCH_SIZE) : undefined, this.command, this.inGenre);
                this.items=resp.items;
                this.jumplist=resp.jumplist;
                this.filteredJumplist = [];
                this.layoutGrid(true);
                if (resp.subtitle) {
                    this.headerSubTitle=resp.subtitle;
                } else {
                    this.headerSubTitle=0==this.items.length ? i18n("Empty") : i18np("1 Item", "%1 Items", this.items.length);
                }
                this.$nextTick(function () {
                    setScrollTop(this, pos>0 ? pos : 0);
                    this.filterJumplist();
                });
                this.fetchingItems = false;
            }).catch(err => {
                logAndShowError(err, undefined, this.command.command, this.command.params);
                this.fetchingItems = false;
            });
        },
        homeBtnPressed() {
            if (this.$store.state.visibleMenus.size<1) {
                this.goHome();
            }
        },
        goHome() {
            try { browseGoHome(this); } catch (e) {} // goHome can be called (due to initUiSettings) before deferred JS is loaded...
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
        backBtnPressed(longPress) {
            if (this.$store.state.visibleMenus.size<1) {
                this.backBtnPressTime = new Date().getTime(); // See sourcesClicked
                if (longPress && !this.$store.state.homeButton) {
                    this.goHome();
                } else {
                    this.goBack();
                }
            }
        },
        goBack(refresh) {
            browseGoBack(this, refresh);
        },
        buildCommand(item, commandName, doReplacements) {
            return browseBuildCommand(this, item, commandName, doReplacements);
        },
        replaceCommandTerms(cmd, item) {
            return browseReplaceCommandTerms(this, cmd, item);
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
        myMusicMenu() {
            browseMyMusicMenu(this);
        },
        processMyMusicMenu() {
            this.myMusic.sort(function(a, b) { return a.weight!=b.weight ? a.weight<b.weight ? -1 : 1 : titleSort(a, b); });
            for (var i=0, len=this.myMusic.length; i<len; ++i) {
                this.myMusic[i].menu=[this.options.pinned.has(this.myMusic[i].id) ? UNPIN_ACTION : PIN_ACTION];
            }
            if (this.current && TOP_MYMUSIC_ID==this.current.id) {
                this.items = this.myMusic;
                this.grid = {allowed:true, use:isSetToUseGrid(GRID_OTHER), numColumns:0, ih:GRID_MIN_HEIGHT, rows:[], few:false, haveSubtitle:true};
                this.settingsMenuActions=[this.grid.use ? USE_LIST_ACTION : USE_GRID_ACTION];
                this.layoutGrid(true);
                bus.$emit('settingsMenuActions', this.settingsMenuActions, 'browse');
            } else if (this.history.length>1 && this.history[1].current && this.history[1].current.id==TOP_MYMUSIC_ID) {
                this.history[1].items = this.myMusic;
            }
        },
        updateTopList(items) {
            let updated = false;
            let extras = undefined;
            for (let i=0; len=this.top.length && undefined==extras; ++i) {
                if (this.top[i].id==TOP_EXTRAS_ID) {
                    extras = this.top[i];
                }
            }
            this.top=items;
            this.initItems();
            let hasExtras = false;
            for (var i=0, len=this.top.length; i<len; ++i) {
                if (!this.top[i].id.startsWith(TOP_ID_PREFIX)) {
                    // Check for previously pinned item with library name, and try to separate
                    if (!this.top[i].libname && this.top[i].params && this.top[i].params.length>0 && this.top[i].params[this.top[i].params.length-1].startsWith('library_id:')) {
                        var parts = this.top[i].title.split(SEPARATOR);
                        if (2==parts.length) {
                            this.top[i].title = parts[0];
                            this.top[i].libname = parts[1];
                            updated = true;
                        }
                    }
                    this.options.pinned.add(this.top[i].id);
                } else if (this.top[i].id==TOP_CDPLAYER_ID && this.top[i].params.length==0) {
                    this.top[i].params.push("menu:1");
                } else if (this.top[i].id==TOP_RADIO_ID) {
                    this.top[i].icon=undefined; this.top[i].svg="radio-tower";
                } else if (this.top[i].id==TOP_MYMUSIC_ID) {
                    this.top[i].menu=undefined;
                } else if (this.top[i].id==TOP_EXTRAS_ID) {
                    hasExtras = true;
                }
            }
            if (!hasExtras && undefined!=extras) {
                this.top.push(extras);
            }
            for (var i=0, len=this.top.length; i<len; ++i) {
                if (this.top[i].id==TOP_ID_PREFIX+"ps") {
                    this.top.splice(i, 1);
                    break;
                }
            }
            if (this.$store.state.sortHome) {
                this.top.sort(homeScreenSort);
            }
            if (updated) {
                this.saveTopList();
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
            browseAddPinned(this, pinned);
        },
        pin(item, add, mapped) {
            browsePin(this, item, add, mapped);
        },
        updateItemPinnedState(item) {
            browseUpdateItemPinnedState(this, item);
        },
        invertSelection() {
            if (this.selection.size==this.items.length) {
                this.clearSelection();
                return;
            }
            this.selection = new Set();
            for (var i=0, len=this.items.length; i<len; ++i) {
                if (!this.items[i].header) {
                    if (this.items[i].selected) {
                        this.items[i].selected = false;
                    } else {
                        this.selection.add(i);
                        this.items[i].selected = true;
                    }
                }
            }
        },
        clearSelection() {
            var selection = Array.from(this.selection);
            for (var i=0, len=selection.length; i<len; ++i) {
                var index = selection[i];
                if (index>-1 && index<this.items.length) {
                    if (this.items[index].menu) {
                        var idx = this.items[index].menu.indexOf(UNSELECT_ACTION);
                        if (idx>-1) {
                            this.items[index].menu[idx]=SELECT_ACTION;
                        }
                    }
                    this.items[index].selected = false;
                }
            }
            this.selection = new Set();
            this.selectStart = undefined;
            bus.$emit('browseSelection', false);
        },
        select(item, index, event) {
            if (this.selection.size>0) {
                if (item.header) {
                    var haveSel = false;
                    var haveUnsel = false;

                    for (var i=index+1, len=this.items.length; i<len && this.items[i].filter==item.id && (!haveSel || !haveUnsel); ++i) {
                        if (this.selection.has(i)) {
                            haveSel = true;
                        } else {
                            haveUnsel = true;
                        }
                    }
                    for (var i=index+1, len=this.items.length; i<len && this.items[i].filter==item.id; ++i) {
                        if (haveUnsel && !this.selection.has(i)) {
                            this.itemAction(SELECT_ACTION, this.items[i], i, event);
                        } else if (!haveUnsel && haveSel && this.selection.has(i)) {
                            this.itemAction(UNSELECT_ACTION, this.items[i], i, event);
                        }
                    }
                } else {
                    this.itemAction(this.selection.has(index) ? UNSELECT_ACTION : SELECT_ACTION, item, index, event);
                }
                this.$forceUpdate();
            }
        },
        deleteSelectedItems(act) {
            var selection = Array.from(this.selection);
            if (1==selection.size) {
                this.itemAction(act, this.items[selection[0]], selection[0]);
            } else {
                confirm(REMOVE_ACTION==act || REMOVE_FROM_FAV_ACTION==act ? i18n("Remove the selected items?") : i18n("Delete the selected items?"),
                        REMOVE_ACTION==act || REMOVE_FROM_FAV_ACTION==act ? i18n("Remove") : i18n("Delete")).then(res => {
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
        actionSelectedItems(act) {
            var selection = Array.from(this.selection);
            var itemList = [];
            selection.sort(function(a, b) { return a<b ? -1 : 1; });
            for (var i=0, len=selection.length; i<len; ++i) {
                itemList.push(this.items[selection[i]]);
            }
            if (ADD_TO_PLAYLIST_ACTION==act) {
                bus.$emit('dlg.open', 'addtoplaylist', itemList);
            } else {
                this.doList(itemList, act);
            }
            this.clearSelection();
        },
        doList(list, act/*, index*/) {
            browseDoList(this, list, act/*, index*/);
        },
        doCommands(commands, npAfterLast, clearSent, actionedCount) {
            browseDoCommands(this, commands, npAfterLast, clearSent, actionedCount);
        },
        handleScroll() {
            this.menu.show = false;
            if (undefined==this.scrollAnim) {
                this.scrollAnim = requestAnimationFrame(() => {
                    this.scrollAnim = undefined;
                    if (undefined!=this.filteredJumplist && this.filteredJumplist.length>1) {
                        if (undefined!==this.letterTimeout) {
                            clearTimeout(this.letterTimeout);
                        }
                        var subMod = this.grid.haveSubtitle ? 0 : GRID_SINGLE_LINE_DIFF;
                        var index = this.grid.use                                // Add 50 to take into account text size
                                        ? Math.floor((this.scrollElement.scrollTop+(50-subMod)) / (this.grid.ih-subMod))*this.grid.numColumns
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
                    }
                });
            }
        },
        calcSizes(quantity, listWidth) {
            var width = GRID_MIN_WIDTH;
            var height = GRID_MIN_HEIGHT;
            var steps = 0;
            if (0!=quantity) {
                while (listWidth>=((width+GRID_STEP)*quantity) && (width+GRID_STEP)<=GRID_MAX_WIDTH) {
                    width += GRID_STEP;
                    height += GRID_STEP;
                    steps++;
                }
            }
            // How many columns?
            var maxColumns = Math.floor(listWidth / width);
            var numColumns = Math.max(Math.min(maxColumns, 20), 1);
            return {w: width, h: height, s: steps, mc: maxColumns, nc: numColumns}
        },
        layoutGrid(force) {
            if (!this.grid.use) {
                return;
            }

            const JUMP_LIST_WIDTH = 32;
            const RIGHT_PADDING = 4;
            var changed = false;
            var haveSubtitle = false;
            var thisWidth = this.$store.state.desktopLayout ? this.pageElement.scrollWidth : window.innerWidth;
            var listWidth = thisWidth - ((/*scrollbar*/ IS_MOBILE ? 0 : 20) + (/*this.filteredJumplist.length>1 && this.items.length>10 ? */JUMP_LIST_WIDTH/* :0*/) + RIGHT_PADDING);

            // Calculate what grid item size we should use...
            var sz = undefined;
            for (var i=4; i>=1; --i) {
                sz = this.calcSizes(i, listWidth);
                if (sz.mc>=i) {
                    break;
                }
            }
            if (force || sz.nc != this.grid.numColumns) { // Need to re-layout...
                changed = true;
                this.grid.rows=[];
                var items = [];
                if (this.isTop) {
                    for (var i=0, len=this.items.length; i<len; ++i) {
                        if (!this.disabled.has(this.items[i].id) && !this.hidden.has(this.items[i].id)) {
                            items.push(this.items[i]);
                        }
                    }
                } else {
                    items=this.items;
                }
                for (var i=0, row=0, len=items.length; i<len; i+=sz.nc, ++row) {
                    var rowItems=[]
                    for (var j=0; j<sz.nc; ++j) {
                        rowItems.push((i+j)<items.length ? items[i+j] : undefined);
                        if (!haveSubtitle && (i+j)<items.length && items[i+j].subtitle) {
                            haveSubtitle = true;
                        }
                    }
                    this.grid.rows.push({id:"row."+i+"."+sz.nc, items:rowItems, r:row, rs:sz.nc*row});
                }
                this.grid.numColumns = sz.nc;
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
            if (this.grid.ih != sz.h) {
                this.grid.ih = sz.h;
                changed = true;
                document.documentElement.style.setProperty('--image-grid-factor', sz.s);
            } else if (parseInt(getComputedStyle(document.documentElement).getPropertyValue('--image-grid-factor'))!=sz.s) {
                changed = true;
                document.documentElement.style.setProperty('--image-grid-factor', sz.s);
            }
            var few = 1==this.grid.rows.length && (1==this.items.length || ((this.items.length*sz.w)*1.20)<listWidth);
            if (this.grid.few != few) {
                this.grid.few = few;
                changed = true;
            }
            if (changed) {
                this.$forceUpdate();
            }
        },
        setBgndCover() {
            var url = this.$store.state.browseBackdrop && this.current && this.current.image ? this.current.image : undefined;
            if (url) {
               url=changeImageSizing(url, LMS_CURRENT_IMAGE_SIZE);
            }
            setBgndCover(this.scrollElement, url);
        },
        setAlbumRating() {
            var ids = [];
            var rating = 0;
            var count = 0;
            this.items.forEach(i => {
                if (!i.header) {
                    ids.push(i.id);
                    if (i.rating && i.rating>0) {
                        rating+=i.rating;
                        count++;
                    }
                }
            });
            bus.$emit('dlg.open', 'rating', ids, Math.ceil(rating/count));
        },
        checkFeature(command, id) {
            lmsCommand("", command).then(({data}) => {
                logJsonMessage("RESP", data);
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
                        ? Math.floor(item.index/this.grid.numColumns)*(this.grid.ih-(this.grid.haveSubtitle ? 0 : GRID_SINGLE_LINE_DIFF))
                        : item.index*LMS_LIST_ELEMENT_SIZE;
            setScrollTop(this, pos>0 ? pos : 0);
        },
        filterJumplist() {
            if (this.items.length<=25) {
                return;
            }
            if (IS_MOBILE && (undefined==this.jumplist || this.jumplist.length<1)) {
                if (this.items.length <= (this.grid.allowed ? 50 : 150)) {
                    return;
                }
                this.jumplist = [];
                var jump = this.items.length/10.0;
                for (var i=0; i<10; ++i) {
                    this.jumplist.push({key:'\u25cf', alt:'\u26ac', index: Math.round(i*jump)});
                }
            }
            if (undefined==this.jumplist || this.jumplist.length<1) {
                return;
            }
            var maxItems = Math.floor((this.scrollElement.clientHeight-(16))/20);
            this.filteredJumplist = shrinkAray(this.jumplist, maxItems);
        },
        dragStart(which, ev) {
            bus.$emit('dragActive', true);
            ev.dataTransfer.dropEffect = 'move';
            ev.dataTransfer.setData('Text', this.items[which].title);
            window.mskBrowseDrag=which;
            if (!this.grid.use) {
                ev.dataTransfer.setDragImage(ev.target.nodeName=='IMG' ? ev.srcElement.parentNode.parentNode.parentNode : ev.srcElement, 0, 0);
            }
            this.dragIndex = which;
            this.stopScrolling = false;
            if (this.selection.size>0 && (!this.selection.has(which) || this.current.isFavFolder)) {
                this.clearSelection();
            }
        },
        dragEnd() {
            this.stopScrolling = true;
            this.dragIndex = undefined;
            this.dropIndex = -1;
            window.mskBrowseDrag = undefined;
            bus.$emit('dragActive', false);
        },
        dragOver(index, ev) {
            if ( ((this.canDrop && undefined!=window.mskBrowseDrag) || (undefined!=window.mskQueueDrag && this.current.section==SECTION_PLAYLISTS)) && (!this.current || !this.current.isFavFolder || !this.options.sortFavorites)) {
                this.dropIndex = index;
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
            }
        },
        scrollList(step) {
            var pos = this.scrollElement.scrollTop + step;
            setScrollTop(this, pos);
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
                var item = this.items[this.dragIndex];
                if (this.isTop || (this.current && (this.current.section==SECTION_FAVORITES || (this.current.section==SECTION_PLAYLISTS && item.stdItem==STD_ITEM_PLAYLIST_TRACK)))) {
                    var sel = Array.from(this.selection);
                    this.clearSelection();
                    if (sel.length>0) {
                        if (this.current.section!=SECTION_FAVORITES && sel.indexOf(to)<0) {
                            bus.$emit('movePlaylistItems', this.current.id, sel.sort(function(a, b) { return a<b ? -1 : 1; }), to);
                        }
                    } else if (this.isTop) {
                        this.items = arrayMove(this.top, this.dragIndex, to);
                        this.saveTopList();
                    } else if (this.current) {
                        var command = [];
                        if (this.current.section==SECTION_FAVORITES) {
                            var fromId = this.items[this.dragIndex].id.startsWith("item_id:")
                                            ? this.items[this.dragIndex].id.replace("item_id:", "from_id:")
                                            : "from_id:"+this.items[this.dragIndex].params.item_id;
                            var toId = this.items[to].id.startsWith("item_id:")
                                            ? this.items[to].id.replace("item_id:", "to_id:")
                                            : "to_id:"+this.items[to].params.item_id;
                            command = ["favorites", "move", fromId, toId+(this.items[to].isFavFolder ? ".0" : "")];
                        } else if (this.current.section==SECTION_PLAYLISTS) {
                            command = ["playlists", "edit", "cmd:move", this.current.id, "index:"+this.dragIndex, "toindex:"+to];
                        }
                        if (command.length>0) {
                            lmsCommand(this.playerId(), command).then(({data}) => {
                                this.refreshList();
                            });
                        }
                    }
                }
            } else if (ev.dataTransfer) {
                if (undefined!=window.mskQueueDrag && this.current.section==SECTION_PLAYLISTS) {
                    if (this.current.id.startsWith("playlist_id")) {
                        browseAddToPlaylist(this, window.mskQueueDrag, this.current.id, to, this.items.length);
                    } else {
                        browseAddToPlaylist(this, window.mskQueueDrag, this.items[to].id);
                    }
                }
            }
            this.dragIndex = undefined;
        }
    },
    mounted() {
        this.pageElement = document.getElementById("browse-view");

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

        bus.$on('langChanged', function() {
            this.initItems();
        }.bind(this));
        this.initItems();
        bus.$on('playerChanged', function() {
            try { browsePlayerChanged(this); } catch (e) {}
        }.bind(this));

        this.disabled = new Set(JSON.parse(getLocalStorageVal("disabledItems", JSON.stringify([TOP_CDPLAYER_ID, TOP_REMOTE_ID]))));
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

        this.nowPlayingExpanded = false; // Keep track so that we know when to ignore 'esc'=>goback
        bus.$on('nowPlayingExpanded', function(val) {
            this.nowPlayingExpanded = val;
        }.bind(this));
        bus.$on('esc', function() {
            if (this.$store.state.openDialogs.length>0 || this.$store.state.visibleMenus.size>0) {
                this.menu.show = false;
            } else if ( (this.$store.state.desktopLayout ? !this.nowPlayingExpanded : this.$store.state.page=='browse') &&
                        // Can receive 'esc' 120ish milliseconds after dialog was closed with 'esc' - so filter out
                        (undefined==this.$store.state.lastDialogClose || (new Date().getTime()-this.$store.state.lastDialogClose)>250) ) {
                this.goBack();
            }
        }.bind(this));
        bus.$on('browse-home', function() {
            this.goHome();
        }.bind(this));

        bus.$on('prefset', function(pref, value) {
            if (this.myMusic.length>0 && ('plugin.material-skin:enabledBrowseModes'==pref || 'server:useUnifiedArtistsList'==pref)) {
                this.myMusic[0].needsUpdating=true;
            }
        }.bind(this));

        bus.$on('trackInfo', function(item, index, page) {
            if (!this.$store.state.desktopLayout) {
                this.$store.commit('setPage', 'browse');
            }
            if (this.history.length>=50) {
                this.goHome();
            }
            this.itemMoreMenu(item, index, page);
        }.bind(this));
        bus.$on('browse-search', function(text, page) {
            if (!this.$store.state.desktopLayout) {
                this.$store.commit('setPage', 'browse');
            }
            if (this.history.length>=50) {
                this.goHome();
            }
            this.searchActive = true;
            this.$nextTick(function () {
                bus.$emit('search-for', text, page);
            });
        }.bind(this));

        bus.$on('browse', function(cmd, params, title, page) {
            if (!this.$store.state.desktopLayout) {
                this.$store.commit('setPage', 'browse');
            }
            this.goHome();
            this.fetchItems(this.replaceCommandTerms({command:cmd, params:params}), {cancache:false, id:params[0], title:title, stdItem:params[0].startsWith("artist_id:") ? STD_ITEM_ARTIST : STD_ITEM_ALBUM}, page);
        }.bind(this));

        bus.$on('refreshList', function(section) {
            if (section==SECTION_PODCASTS || (this.current && this.current.section==section)) {
                this.refreshList();
            }
        }.bind(this));
        bus.$on('refreshPlaylist', function(name) {
            if (this.current && this.current.section==SECTION_PLAYLISTS) {
                if (this.current.id.startsWith(MUSIC_ID_PREFIX) || undefined==name || this.current.title==name) {
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
        bus.$on('closeLibSearch', function() {
            this.goBack();
        }.bind(this));
        bus.$on('searchPodcasts', function(url, term, provider) {
            this.enteredTerm = term;
            this.fetchUrlItems(url, provider);
        }.bind(this));
        bus.$on('showLinkMenu.browse', function(x, y, menu) {
            showMenu(this, {linkItems: menu, x:x, y:y, show:true});
        }.bind(this));
        bus.$on('windowHeightChanged', function() {
            this.filterJumplist();
        }.bind(this));
        bus.$on('showQueue', function(val) {
            this.$nextTick(function () {this.layoutGrid(); });
        }.bind(this));

        this.checkFeature(["can", "selectRemoteLibrary", "items", "?"], TOP_REMOTE_ID);
        this.checkFeature(["can", "cdplayer", "items", "?"], TOP_CDPLAYER_ID);
        this.onlineServices=[];
        lmsCommand("", ["browseonlineartist", "services"]).then(({data}) => {
            logJsonMessage("RESP", data);
            if (data && data.result && data.result.services) {
                this.onlineServices=data.result.services;
            }
        });

        bus.$on('browseDisplayChanged', function() {
            if (this.myMusic.length>0) {
                this.myMusic[0].needsUpdating=true;
            }
            this.options.sortFavorites=this.$store.state.sortFavorites;
            if (this.$store.state.sortHome) {
                this.saveTopList();
            }
            this.goHome();
            if (this.grid.use) {
                this.layoutGrid(true);
            }
        }.bind(this));
        bus.$on('libraryChanged', function() {
            this.setLibrary();
        }.bind(this));
        this.setLibrary();

        this.scrollElement = document.getElementById("browse-list");
        this.scrollElement.addEventListener('scroll', this.handleScroll);
        this.$nextTick(function () {
            setScrollTop(this, 0);
            bus.$emit('settingsMenuActions', this.settingsMenuActions, 'browse');
        });

        bus.$on('splitterChanged', function() {
            this.layoutGrid();
        }.bind(this));
        bus.$on('layoutChanged', function() {
            this.$nextTick(function () {
                this.layoutGrid(true);
            });
        }.bind(this));
        this.wide = window.innerWidth>=800;
        setTimeout(function () {
            this.wide = window.innerWidth>=800;
        }.bind(this), 1000);
        bus.$on('windowWidthChanged', function() {
            this.wide = window.innerWidth>=800;
            this.layoutGrid();
        }.bind(this));
        bus.$on('themeChanged', function() {
            this.setBgndCover();
        }.bind(this));
        this.setBgndCover();
        this.letterOverlay=document.getElementById("letterOverlay");
        bus.$on('browseQueueDrop', function(browseIndex, queueIndex, queueSize) {
            if ((browseIndex>=0 && browseIndex<this.items.length) || (-1==browseIndex && this.selection.size>0)) {
                browseInsertQueue(this, browseIndex, queueIndex, queueSize);
            }
        }.bind(this));
        bus.$on('dragActive', function(act) {
            this.dragActive = act;
            if (!act) {
                this.dropIndex = -1;
            }
        }.bind(this));
        this.browseSelection=false;
        bus.$on('queueSelection', function(sel) {
            this.queueSelection=sel;
        }.bind(this));
        bus.$on('queueSelectedUrls', function(urls, index, id) {
            if (this.current.section==SECTION_PLAYLISTS) {
                if (id.startsWith("playlist_id")) {
                    browseAddToPlaylist(this, urls, id);
                } else {
                    browseAddToPlaylist(this, urls, this.current.id, index, this.items.length);
                }
            }
        }.bind(this));
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
        emblem: function (e) {
            return "/material/svg/"+e.name+"?c="+e.color.substr(1)+"&r="+LMS_MATERIAL_REVISION;
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
    },
    beforeDestroy() {
        if (undefined!==this.updateTimer) {
            clearTimeout(this.updateTimer);
            this.updateTimer = undefined;
        }
        if (undefined!=this.scrollElement) {
            this.scrollElement.removeEventListener("scroll", this.handleScroll);
        }
    }
});
