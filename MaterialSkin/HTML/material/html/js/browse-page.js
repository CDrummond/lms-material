/**
 * LMS-Material
 *
 * Copyright (c) 2018-2024 Craig Drummond <craig.p.drummond@gmail.com>
 * MIT license.
 */
'use strict';

var B_ALBUM_SORTS=[ ];
var B_TRACK_SORTS=[ ];
const ALLOW_ADD_ALL = new Set(['trackinfo', 'youtube', 'spotty', 'qobuz', 'tidal', 'wimp' /*is Tidal*/, 'deezer', 'tracks', 'musicip', 'musicsimilarity', 'blissmixer', 'bandcamp']); // Allow add-all/play-all from 'trackinfo', as Spotty's 'Top Titles' access via 'More' needs this
const ALLOW_FAKE_ALL_TRACKS_ITEM = new Set(['youtube', 'qobuz']); // Allow using 'fake' add all item
const MIN_WIDTH_FOR_DETAILED_SUB = 350;
const MIN_WIDTH_FOR_HBTNS = 500;
const MIN_WIDTH_INDENT_LEFT = 550;
const MIN_WIDTH_FOR_COVER = 650;
const MIN_WIDTH_FOR_MIX_BTN = 800;
const MIN_WIDTH_FOR_COVER_INDENT = 1000;
const MIN_WIDTH_FOR_BOTH_INDENT = 1300;
const MIN_HEIGHT_FOR_DETAILED_SUB = 400;
const JUMP_LIST_WIDTH = 32;

const WIDE_BOTH = 7;
const WIDE_SUB_TEXT = 7;
const WIDE_COVER_IDENT = 6;
const WIDE_MIX_BTN = 5;
const WIDE_COVER = 4;
const WIDE_INDENT_L = 3;
const WIDE_HBTNS = 2;
const WIDE_DETAILED_SUB = 1;
const WIDE_NONE = 0;

const MIN_WIDTH_FOR_TRACK_FOUR = 500;
const MIN_WIDTH_FOR_TRACK_THREE = 410;
const MIN_WIDTH_FOR_TRACK_TWO = 320;

const TRACK_WIDE_FOUR = 3
const TRACK_WIDE_THREE = 2
const TRACK_WIDE_TWO = 1
const TRACK_WIDE_ONE = 0

var lmsBrowse = Vue.component("lms-browse", {
    template: `
<div id="browse-view" v-bind:class="{'detailed-sub':showDetailedSubtoolbar, 'indent-both':showDetailedSubtoolbar && isTrackList && wide>WIDE_COVER_IDENT && (!desktopLayout || !pinQueue), 'indent-right':showDetailedSubtoolbar && isTrackList && wide==WIDE_COVER_IDENT && (!desktopLayout || !pinQueue), 'indent-left':showDetailedSubtoolbar && wide>=WIDE_INDENT_L && (!desktopLayout || !pinQueue), 'detailed-img-track-list':showDetailedSubtoolbar&&isImageTrackList}">
 <div class="noselect" v-bind:class="{'subtoolbar-cover':showDetailedSubtoolbar&&drawBgndImage,'subtoolbar-tracklist':showTrackListCommands}">
 <div class="subtoolbar" v-bind:class="{'toolbar-blur':showDetailedSubtoolbar&&drawBgndImage}">
  <img v-if="currentImage && isTrackList && showDetailedSubtoolbar && wide<WIDE_COVER" :src="currentImage" class="sub-cover-fade sub-cover-track pointer"></img>
  <img v-else-if="currentImage && showDetailedSubtoolbar && wide<WIDE_COVER" :src="currentImage" class="sub-cover-fade sub-cover-right pointer"></img>
  <v-layout v-if="selection.size>0">
   <div class="toolbar-nobtn-pad"></div>
   <v-layout row wrap>
    <v-flex xs12 class="ellipsis subtoolbar-title subtoolbar-pad">{{trans.selectMultiple}}</v-flex>
    <v-flex xs12 class="ellipsis subtoolbar-subtitle subtext">{{selection.size | displaySelectionCount}}<obj class="mat-icon">check_box</obj>{{selectionDuration | displayTime}}</v-flex>
   </v-layout>
   <v-spacer></v-spacer>
   <v-btn v-if="current && current.section==SECTION_PLAYLISTS && current.id.startsWith('playlist_id:')" :title="trans.removeall" flat icon class="toolbar-button" @click="deleteSelectedItems(REMOVE_ACTION, $event)"><v-icon>{{ACTIONS[REMOVE_ACTION].icon}}</v-icon></v-btn>
   <v-btn v-else-if="current && current.section==SECTION_PLAYLISTS" :title="trans.deletesel" flat icon class="toolbar-button" @click="deleteSelectedItems(DELETE_ACTION, $event)"><v-icon>delete</v-icon></v-btn>
   <v-btn v-else-if="current && current.section==SECTION_FAVORITES" :title="trans.removeall" flat icon class="toolbar-button" @click="deleteSelectedItems(REMOVE_FROM_FAV_ACTION, $event)"><v-icon>delete_outline</v-icon></v-btn>
   <v-btn v-if="items[0].stdItem==STD_ITEM_TRACK || items[0].stdItem==STD_ITEM_ALBUM_TRACK || items[0].saveableTrack || (items[0].header && items.length>1 && items[1].stdItem==STD_ITEM_ALBUM_TRACK)" :title="ACTIONS[ADD_TO_PLAYLIST_ACTION].title" flat icon class="toolbar-button" @click="actionSelectedItems(ADD_TO_PLAYLIST_ACTION, $event)"><v-icon>{{ACTIONS[ADD_TO_PLAYLIST_ACTION].icon}}</v-icon></v-btn>
   <v-btn :title="trans.addsel" flat icon class="toolbar-button" @click="actionSelectedItems(ADD_ACTION, $event)"><v-icon>add_circle_outline</v-icon></v-btn>
   <v-btn :title="trans.shufflesel" v-if="allowShuffle(items[items.length>1 && items[0].header ? 1 : 0])" flat icon class="toolbar-button" @click="actionSelectedItems(PLAY_SHUFFLE_ACTION, $event)"><img class="svg-img" :src="ACTIONS[PLAY_SHUFFLE_ACTION].svg | svgIcon(darkUi)"></img></v-btn>
   <v-btn :title="trans.playsel" flat icon class="toolbar-button" @click="actionSelectedItems(PLAY_ACTION, $event)"><v-icon>play_circle_outline</v-icon></v-btn>
   <v-divider vertical></v-divider>
   <v-btn :title="trans.invertSelect" flat icon class="toolbar-button" @click="invertSelection()"><img :src="'invert-select' | svgIcon(darkUi)"></img></v-btn>
   <v-btn :title="trans.cancel" flat icon class="toolbar-button" @click="clearSelection()"><v-icon>cancel</v-icon></v-btn>
  </v-layout>
  <v-layout v-else-if="searchActive">
   <v-btn flat icon @click="closeSearch" class="toolbar-button back-button" id="close-search-button" :title="trans.close"><v-icon>arrow_back</v-icon></v-btn>
   <lms-search-field v-if="searchActive==1" @results="handleListResponse"></lms-search-field>
   <lms-search-list v-else @scrollTo="highlightItem" :view="this" :msearch="true" :title="toolbarTitle"></lms-search-list>
  </v-layout>
  <v-layout v-else-if="history.length>0">
   <v-btn flat icon v-longpress:stop="backBtnPressed" class="toolbar-button" v-bind:class="{'back-button':!homeButton || history.length<2}" id="back-button" :title="trans.goBack | tooltipStr('esc', keyboardControl)"><v-icon>arrow_back</v-icon></v-btn>
   <v-btn v-if="history.length>1 && homeButton" flat icon @click="homeBtnPressed()" class="toolbar-button" id="home-button" v-bind:class="{'dst-home':showDetailedSubtoolbar}" :title="trans.goHome | tooltipStr('home', keyboardControl)"><v-icon>home</v-icon></v-btn>
   <div v-if="wide>=WIDE_COVER && currentImages" @click="showHistory($event)" class="sub-cover pointer">
    <div class="mi" :class="'mi'+currentImages.length">
     <img v-for="(mic, midx) in currentImages" :class="'mi-'+midx" :key="mic" :src="mic" loading="lazy"></img>
    </div>
   </div>
   <img v-else-if="wide>=WIDE_COVER && currentImage" :src="current && currentImage" @click="showHistory($event)" class="sub-cover pointer"></img>
   <v-layout row wrap v-if="showDetailedSubtoolbar">
    <v-layout @click="showHistory($event)" class="link-item row wrap browse-title">
     <v-flex xs12 class="ellipsis subtoolbar-title subtoolbar-pad" v-bind:class="{'subtoolbar-title-single':undefined==toolbarSubTitle}">{{toolbarTitle}}</v-flex>
     <v-flex xs12 class="ellipsis subtoolbar-subtitle subtext" v-html="detailedSubTop"></v-flex>
    </v-layout>
    <v-flex xs12 v-if="detailedSubExtra" class="ellipsis subtoolbar-subtitle subtext" v-html="detailedSubExtra[0]"></v-flex>
    <v-flex xs12 v-else class="ellipsis subtoolbar-subtitle subtext">&nbsp;</v-flex>
    <v-flex xs12 class="ellipsis subtoolbar-subtitle subtext" v-html="detailedSubBot"></v-flex>
   </v-layout>
   <v-layout row wrap v-else @click="showHistory($event)" class="browse-title" v-bind:class="{'pointer link-item': history.length>0}">
    <v-flex xs12 class="ellipsis subtoolbar-title subtoolbar-pad" v-bind:class="{'subtoolbar-title-single':undefined==toolbarSubTitle}">{{toolbarTitle}}</v-flex>
    <v-flex xs12 class="ellipsis subtoolbar-subtitle subtext" v-if="undefined!=toolbarSubTitle" v-html="toolbarSubTitle"></v-flex>
   </v-layout>
   <v-spacer style="flex-grow: 10!important"></v-spacer>
   <table class="browse-commands" v-if="!showDetailedSubtoolbar || !isTrackList || wide>=WIDE_MIX_BTN">
    <tr align="right">
     <v-btn @click.stop="currentActionsMenu($event)" flat icon class="toolbar-button" :title="trans.actions" id="tbar-actions" v-if="currentActions.length>0 && numCurrentActionsInToolbar<currentActions.length && (!showDetailedSubtoolbar || wide>=WIDE_HBTNS)"><v-icon>more_vert</v-icon></v-btn>
     <template v-for="(action, index) in currentActions" v-if="numCurrentActionsInToolbar>0">
      <v-btn @click.stop="currentAction(action, index, $event)" flat icon class="toolbar-button" :title="undefined==action.action ? action.title : ACTIONS[action.action].title" :id="'tbar-actions'+action.action" v-if="index<numCurrentActionsInToolbar && (action.action!=VLIB_ACTION || libraryName)">
       <img v-if="undefined!=action.action && ACTIONS[action.action].svg" class="svg-img" :src="ACTIONS[action.action].svg | svgIcon(darkUi)"></img>
       <v-icon v-else-if="undefined!=action.action">{{ACTIONS[action.action].icon}}</v-icon>
       <img v-else-if="action.svg" class="svg-img" :src="action.svg | svgIcon(darkUi)"></img>
       <v-icon v-else>{{action.icon}}</v-icon>
      </v-btn>
     </template>
     <template v-for="(action, index) in tbarActions">
      <v-btn flat :icon="wide<WIDE_MIX_BTN" v-if="showDetailedSubtoolbar && wide>=WIDE_MIX_BTN && (action==PLAY_ACTION || action==PLAY_ALL_ACTION) && !allowShuffle(current)" @click.stop="headerAction(action==PLAY_ACTION ? INSERT_ACTION : INSERT_ALL_ACTION, $event)" v-bind:class="{'context-button':wide>=WIDE_MIX_BTN, 'toolbar-button':wide<WIDE_MIX_BTN}" :title="INSERT_ACTION | tooltip(keyboardControl)" :id="'tbar-actions'+action">
       <img class="svg-img" :src="ACTIONS[INSERT_ACTION].svg | svgIcon(darkUi)"></img><obj v-if="wide>=WIDE_MIX_BTN">&nbsp;{{ACTIONS[INSERT_ACTION].short}}</obj>
      </v-btn>
      <v-btn flat :icon="wide<WIDE_MIX_BTN" v-if="showDetailedSubtoolbar && wide>=WIDE_MIX_BTN && (action==PLAY_ACTION || action==PLAY_ALL_ACTION) && allowShuffle(current)" @click.stop="headerAction(action==PLAY_ACTION ? PLAY_SHUFFLE_ACTION : PLAY_SHUFFLE_ALL_ACTION, $event)" v-bind:class="{'context-button':wide>=WIDE_MIX_BTN, 'toolbar-button':wide<WIDE_MIX_BTN}" :title="PLAY_SHUFFLE_ACTION | tooltip(keyboardControl)" :id="'tbar-actions'+action">
       <img class="svg-img" :src="ACTIONS[PLAY_SHUFFLE_ACTION].svg | svgIcon(darkUi)"></img><obj v-if="wide>=WIDE_MIX_BTN">&nbsp;{{ACTIONS[PLAY_SHUFFLE_ACTION].short}}</obj>
      </v-btn>

      <!-- for non-text buttons, if 'play shuffled' enabled then show its button instead of append -->
      <v-btn flat v-if="(wide<WIDE_MIX_BTN || !showDetailedSubtoolbar) && (action==ADD_ACTION || action==ADD_ALL_ACTION) && allowShuffle(current) && (!queryParams.party || !HIDE_FOR_PARTY.has(PLAY_SHUFFLE_ACTION)) && (!LMS_KIOSK_MODE || !HIDE_FOR_KIOSK.has(PLAY_SHUFFLE_ACTION))" flat icon @click.stop="headerAction(action==ADD_ACTION ? PLAY_SHUFFLE_ACTION : PLAY_SHUFFLE_ALL_ACTION, $event)" class="toolbar-button" :title="(action==ADD_ACTION ? PLAY_SHUFFLE_ACTION : PLAY_SHUFFLE_ALL_ACTION) | tooltip(keyboardControl)" :id="'tbar-actions'+PLAY_SHUFFLE_ACTION">
       <img class="svg-img" :src="ACTIONS[PLAY_SHUFFLE_ACTION].svg | svgIcon(darkUi)"></img>
      </v-btn>

      <v-btn flat :icon="wide<WIDE_MIX_BTN || !ACTIONS[action].short || !showDetailedSubtoolbar" @click.stop="headerAction(action, $event)" v-bind:class="{'context-button':wide>=WIDE_MIX_BTN && undefined!=ACTIONS[action].short && showDetailedSubtoolbar, 'toolbar-button':wide<WIDE_MIX_BTN || !ACTIONS[action].short || !showDetailedSubtoolbar}" :title="action | tooltip(keyboardControl)" :id="'tbar-actions'+action" v-else-if="(!queryParams.party || !HIDE_FOR_PARTY.has(action)) && (!LMS_KIOSK_MODE || !HIDE_FOR_KIOSK.has(action))">
       <img v-if="ACTIONS[action].svg" class="svg-img" :src="ACTIONS[action].svg | svgIcon(darkUi)"></img>
       <v-icon v-else>{{ACTIONS[action].icon}}</v-icon>
       <obj v-if="wide>=WIDE_MIX_BTN && ACTIONS[action].short && showDetailedSubtoolbar">&nbsp;{{ACTIONS[action].short}}</obj>
      </v-btn>
     </template>
    </tr>
    <tr v-if="showMixButton || showMaiButton || (showDetailedSubtoolbar && wide<WIDE_HBTNS)" align="right">
     <v-btn @click.stop="currentActionsMenu($event)" flat icon class="toolbar-button" :title="trans.actions" id="tbar-actions" v-if="wide<WIDE_HBTNS && currentActions.length>0 && numCurrentActionsInToolbar<currentActions.length"><v-icon>more_vert</v-icon></v-btn>
     <v-btn flat v-if="showMixButton" class="context-button" @click="doContext(STD_ITEM_MIX)"><img class="svg-img" :src="'music-mix' | svgIcon(darkUi)"></img>&nbsp;{{i18n('Create mix')}}</v-btn>
     <v-btn flat v-if="showMaiButton" class="context-button" @click="doContext(STD_ITEM_MAI)"><v-icon v-if="current.stdItem==STD_ITEM_ALBUM">album</v-icon><img v-else class="svg-img" :src="'artist' | svgIcon(darkUi)"></img>&nbsp;{{i18n('Information')}}</v-btn>
    </tr>
    <tr v-else><obj>&nbsp;</obj></tr>
   </table>
  </v-layout>
  <v-layout v-else class="pointer link-item">
   <div class="toolbar-nobtn-pad"></div>

   <v-layout @click="sourcesClicked" class="link-item row wrap browse-title">
    <v-flex xs12 class="ellipsis subtoolbar-title subtoolbar-pad" v-bind:class="{'subtoolbar-title-single':!allowVLibOnHome || !showLibName}">{{trans.home}}</v-flex>
    <v-flex xs12 class="ellipsis subtoolbar-subtitle subtext" v-html="libraryName" v-if="allowVLibOnHome && showLibName"></v-flex>
   </v-layout>

   <v-spacer @click="itemAction(SEARCH_LIB_ACTION, undefined, undefined, $event)" class="pointer"></v-spacer>

   <template v-for="(item, index) in currentActions">
    <v-btn @click.stop="currentAction(item, index, $event)" flat icon class="toolbar-button" :title="undefined==item.action ? item.title : ACTIONS[item.action].title" id="tbar-actions"
           v-if="undefined==item.action || (VLIB_ACTION==item.action ? allowVLibOnHome : (USE_GRID_ACTION==item.action || USE_LIST_ACTION==item.action) ? allowListOnHome : true)">
     <img v-if="undefined!=item.action && ACTIONS[item.action].svg" class="svg-img" :src="ACTIONS[item.action].svg | svgIcon(darkUi)"></img>
     <v-icon v-else-if="undefined!=item.action">{{ACTIONS[item.action].icon}}</v-icon>
    </v-btn>
   </template>

   <v-btn :title="SEARCH_LIB_ACTION | tooltip(keyboardControl)" flat icon class="toolbar-button" @click.stop="itemAction(SEARCH_LIB_ACTION, undefined, undefined, $event)"><img class="svg-img" :src="ACTIONS[SEARCH_LIB_ACTION].svg | svgIcon(darkUi)"></img></v-btn>
  </v-layout>
  <v-layout class="browse-tracklist-commands" v-if="isTrackList && showDetailedSubtoolbar && wide<WIDE_MIX_BTN">
   <v-btn flat @click.stop="headerAction(PLAY_ALL_ACTION, $event)" class="context-button" :title="PLAY_ACTION | tooltip(keyboardControl)" :id="'tbar-actions'+PLAY_ACTION"><v-icon>{{ACTIONS[PLAY_ACTION].icon}}</v-icon>&nbsp;{{ACTIONS[PLAY_ACTION].short}}</v-btn>
   <v-btn flat @click.stop="headerAction(PLAY_SHUFFLE_ALL_ACTION, $event)" v-if="allowShuffle(current) && trackWide>=TRACK_WIDE_TWO" class="context-button" :title="PLAY_SHUFFLE_ACTION | tooltip(keyboardControl)" :id="'tbar-actions'+PLAY_SHUFFLE_ACTION"><img class="svg-img" :src="ACTIONS[PLAY_SHUFFLE_ACTION].svg | svgIcon(darkUi)"></img>&nbsp;{{ACTIONS[PLAY_SHUFFLE_ACTION].short}}</v-btn>
   <v-btn flat @click.stop="headerAction(ADD_ALL_ACTION, $event)" v-if="trackWide>=(allowShuffle(current) ? TRACK_WIDE_THREE : TRACK_WIDE_TWO)" class="context-button" :title="ADD_ACTION | tooltip(keyboardControl)" :id="'tbar-actions'+ADD_ACTION""><v-icon>{{ACTIONS[ADD_ACTION].icon}}</v-icon></img>&nbsp;{{ACTIONS[ADD_ACTION].short}}</v-btn>
   <v-spacer></v-spacer>
   <v-btn flat v-if="showMaiButton && current.stdItem==STD_ITEM_ALBUM" class="context-button" @click="doContext(STD_ITEM_MAI)"><v-icon>album</v-icon>&nbsp;{{i18n('Information')}}</v-btn>
   <v-btn @click.stop="currentActionsMenu($event)" flat icon class="toolbar-button" :title="trans.actions" id="tbar-actions"><v-icon>more_vert</v-icon></v-btn>
  </v-layout>
 </div>
 </div>
 <v-icon class="browse-progress" v-if="fetchingItem!=undefined" color="primary">more_horiz</v-icon>
 <div class="lms-list bgnd-cover" v-bind:style="{'background-image':'url('+currentBgndUrl+')'}" v-bind:class="{'browse-backdrop-cover':drawBackdrop, 'tint-bgnd-cover':tint&&!drawBgndImage, 'browse-track-list':showTrackListCommands}">
  <div class="noselect lms-jumplist" v-bind:class="{'bgnd-blur':drawBgndImage,'backdrop-blur':drawBackdrop, 'lms-jumplist-h':filteredJumplist[0].header}" v-if="filteredJumplist.length>1">
   <div class="jl-inner" v-bind:style="{'max-height':(filteredJumplist.length*50)+'px'}">
    <template v-for="(item, index) in filteredJumplist">
     <div v-if="item.icon" @click="jumpTo(item.index)" class="jl-divider" :title="items[item.index].title">
      <img v-if="item.icon.svg" :src="item.icon.svg | svgIcon(darkUi)" loading="lazy"></img>
      <v-icon v-else class="jl-icon">{{item.icon.icon}}</v-icon>
     </div>
     <div v-else-if="item.key==SECTION_JUMP" @click="jumpTo(item.index)" class="jl-divider" :title="items[item.index].title">{{item.key}}</div>
     <div v-else @click="jumpTo(item.index)" v-bind:class="{'jl-divider':item.key==SECTION_JUMP}">{{item.key==' ' || item.key=='' ? '?' : item.key}}</div>
    </template>
   </div>
  </div>
  <div class="lms-list" id="browse-list" style="overflow:auto;" v-bind:class="{'lms-image-grid':grid.allowed&&grid.use,'lms-grouped-image-grid':grid.allowed&&grid.use && variableGridHeight,'lms-image-grid-jump':grid.allowed&&grid.use && filteredJumplist.length>1,'lms-list-jump':!(grid.allowed&&grid.use) && filteredJumplist.length>1,'bgnd-blur':drawBgndImage,'backdrop-blur':drawBackdrop, 'browse-track-list':showTrackListCommands}">

   <RecycleScroller v-if="grid.allowed&&grid.use" :items="grid.rows" :item-size="variableGridHeight ? null : GRID_TEXT_ONLY==grid.type ? grid.ih : (grid.ih - (grid.haveSubtitle || isTop || current.id.startsWith(TOP_ID_PREFIX) ? 0 : GRID_SINGLE_LINE_DIFF))" page-mode key-field="id" :buffer="LMS_SCROLLER_GRID_BUFFER">
    <div slot-scope="{item}" :class="[grid.few?'image-grid-few':'image-grid-full-width', GRID_TEXT_ONLY==grid.type && items.length>0 && items[0].stdItem==STD_ITEM_GENRE ? 'genre-grid' : '', GRID_TEXT_ONLY!=grid.type && (variableGridHeight ? item.hasSub : grid.haveSubtitle)?'image-grid-with-sub':'',grid.type==GRID_ICON_ONLY_ONLY?'icon-only':'',item.ihe&&!item.header&&!item.spacer?'grid-scroll':'']">

     <div v-if="item.spacer"></div>

     <v-list-tile v-if="GRID_TEXT_ONLY==grid.type && item.header && item.item" class="grid-header no-hover">
      <v-list-tile-avatar v-if="item.item.icon" :tile="true" class="lms-avatar">
       <v-icon>{{item.item.icon}}</v-icon>
      </v-list-tile-avatar>
      <v-list-tile-avatar v-else-if="item.item.svg" :tile="true" class="lms-avatar">
       <img :class="['hdr-'+hRgb, 'svg-list-img']" :src="item.item.svg | svgIcon(darkUi, undefined, true)" loading="lazy" @dragstart.prevent="" @dragenter.prevent=""></img>
      </v-list-tile-avatar>
      <v-list-tile-content>
       <v-list-tile-title>{{item.item.title}}</v-list-tile-title>
      </v-list-tile-content>
      <v-list-tile-action class="browse-action" v-if="undefined!=item.item.menu && item.item.menu.length>0">
       <div class="grid-btn list-btn hover-btn menu-btn" @click.stop="itemMenu(item.item, item.rs, $event)" :title="i18n('%1 (Menu)', stripLinkTags(item.item.title))"></div>
      </v-list-tile-action>
     </v-list-tile>
     <div v-else-if="GRID_TEXT_ONLY==grid.type" align="center" style="vertical-align: top" v-for="(citem, col) in item.items" @contextmenu.prevent="contextMenu(citem, isTop ? citem.gidx : (item.rs+col), $event)">
      <div v-if="undefined==citem" class="text-grid-item defcursor"></div>
      <div v-else class="text-grid-item" @click="click(citem, isTop ? citem.gidx : (item.rs+col), $event)" :title="citem | itemTooltip">
       <div v-if="selection.size>0 && browseCanSelect(citem)" class="check-btn grid-btn image-grid-select-btn" @click.stop="select(citem, isTop ? citem.gidx : (item.rs+col), $event)" :title="ACTIONS[citem.selected ? UNSELECT_ACTION : SELECT_ACTION].title" v-bind:class="{'check-btn-checked':citem.selected}"></div>
       <div v-bind:class="{'search-highlight':highlightIndex==(isTop ? citem.gidx : (item.rs+col)), 'list-active': (menu.show && (isTop ? citem.gidx : (item.rs+col))==menu.index) || (fetchingItem==item.id)}">
         <div class="stripe" :style="{background: citem.color}"></div>
         <div>{{citem.title}}</div></div>
        <div class="grid-btn image-grid-btn hover-btn menu-btn" v-if="(undefined!=citem.stdItem && citem.stdItem<=STD_ITEM_MAX) || (citem.menu && citem.menu.length>0)" @click.stop="itemMenu(citem, isTop ? citem.gidx : (item.rs+col), $event)" :title="i18n('%1 (Menu)', stripLinkTags(citem.title))"></div>
      </div>
     </div>

     <v-list-tile v-else-if="item.header && item.item" class="grid-header" @click.stop="click(item.item, undefined, $event)" v-bind:class="{'search-highlight':highlightIndex==(item.rs)}">
      <v-list-tile-avatar v-if="item.item.icon" :tile="true" class="lms-avatar">
       <v-icon>{{item.item.icon}}</v-icon>
      </v-list-tile-avatar>
      <v-list-tile-avatar v-else-if="item.item.svg" :tile="true" class="lms-avatar">
       <img :class="['hdr-'+hRgb, 'svg-list-img']" :src="item.item.svg | svgIcon(darkUi, undefined, true)" loading="lazy" @dragstart.prevent="" @dragenter.prevent=""></img>
      </v-list-tile-avatar>
      <v-list-tile-content>
       <v-list-tile-title>{{item.item.title}}</v-list-tile-title>
      </v-list-tile-content>
      <v-list-tile-action class="browse-action" v-if="undefined!=item.item.menu && item.item.menu.length>0">
       <div class="grid-btn list-btn hover-btn menu-btn" @click.stop="itemMenu(item.item, undefined, $event)" :title="i18n('%1 (Menu)', stripLinkTags(item.item.title))"></div>
      </v-list-tile-action>
      <v-list-tile-action class="browse-action browse-more" v-else-if="undefined!=item.item.morecmd || undefined!=item.item.allItems">
       <div class="link-item" :title="i18n('More')" @click="showMore(item.item)">{{i18n('More')}}</div>
      </v-list-tile-action>
      <div v-if="hoverBtns && 0==selection.size && (item.item.menu && (item.item.menu[0]==PLAY_ACTION || item.item.menu[0]==PLAY_ALL_ACTION))" class="list-btns">
       <img v-if="!LMS_KIOSK_MODE || !HIDE_FOR_KIOSK.has(ADD_ACTION)" class="other-btn grid-btn" @click.stop="itemAction(ADD_ALL_ACTION, item.item, undefined, $event)" :title="ACTIONS[ADD_ACTION].title" :src="'hover-add' | svgIcon(darkUi, false)"></img>
       <img v-if="!queryParams.party && (!LMS_KIOSK_MODE || !HIDE_FOR_KIOSK.has(INSERT_ACTION))" class="other-btn grid-btn" @click.stop="itemAction(INSERT_ALL_ACTION, item.item, undefined, $event)" :title="ACTIONS[INSERT_ACTION].title" :src="'hover-playnext' | svgIcon(darkUi, false)"></img>
       <img v-if="allowShuffle(item.item)" class="other-btn grid-btn" @click.stop="itemAction(PLAY_SHUFFLE_ALL_ACTION, item.item, undefined, $event)" :title="ACTIONS[PLAY_SHUFFLE_ACTION].title" :src="'hover-shuffle' | svgIcon(darkUi, false)"></img>
       <img v-if="!queryParams.party && (!LMS_KIOSK_MODE || !HIDE_FOR_KIOSK.has(PLAY_ACTION))" class="main-btn grid-btn" @click.stop="itemAction(PLAY_ALL_ACTION, item.item, undefined, $event)" :title="ACTIONS[PLAY_ACTION].title" :src="'hover-play' | svgIcon(darkUi, false)"></img>
      </div>
     </v-list-tile>

     <div v-else align="center" style="vertical-align: top" v-for="(citem, col) in item.items" @contextmenu.prevent="contextMenu(citem, isTop ? citem.gidx : (item.rs+col), $event)">
      <div v-if="undefined==citem" class="image-grid-item defcursor"></div>
      <div v-else class="image-grid-item" @click="click(citem, isTop ? citem.gidx : (item.rs+col), $event)" :title="citem | itemTooltip" :draggable="citem.draggable || isTop" @dragstart="dragStart(isTop ? citem.gidx : (item.rs+col), $event)" @dragenter.prevent="" @dragend="dragEnd()" @dragover="dragOver(isTop ? citem.gidx : (item.rs+col), $event)" @drop="drop(isTop ? citem.gidx : (item.rs+col), $event)" v-bind:class="{'search-highlight':highlightIndex==(isTop ? citem.gidx : (item.rs+col)), 'list-active': (menu.show && (isTop ? citem.gidx : (item.rs+col))==menu.index) || (fetchingItem==item.id), 'drop-target':dragActive && (isTop ? citem.gidx : (item.rs+col))==dropIndex}">
       <div v-if="selection.size>0 && browseCanSelect(citem)" class="check-btn grid-btn image-grid-select-btn" @click.stop="select(citem, isTop ? citem.gidx : (item.rs+col), $event)" :title="ACTIONS[citem.selected ? UNSELECT_ACTION : SELECT_ACTION].title" v-bind:class="{'check-btn-checked':citem.selected}"></div>
       <img v-else-if="citem.multi" class="multi-disc" :src="(1==citem.multi ? 'group-multi' : 'album-multi') | svgIcon(true)" loading="lazy"></img>
       <img v-else-if="citem.overlay" class="multi-disc" :src="citem.overlay | svgIcon(true)" loading="lazy"></img>
       <div v-if="citem.images" :tile="true" class="image-grid-item-img">
        <div class="mi" :class="'mi'+citem.images.length">
         <img v-for="(mic, midx) in citem.images" :class="'mi-'+midx" :key="mic" :src="mic|gridImageSize" loading="lazy"></img>
        </div>
       </div>
       <img v-else-if="citem.image" :key="citem.image" :src="citem.image|gridImageSize" onerror="this.src=DEFAULT_COVER" v-bind:class="{'radio-img': SECTION_RADIO==citem.section || SECTION_APPS==citem.section || citem.isRadio, 'circular':citem.stdItem==STD_ITEM_ARTIST || citem.stdItem==STD_ITEM_ONLINE_ARTIST || citem.stdItem==STD_ITEM_WORK_COMPOSER}" class="image-grid-item-img" loading="lazy"></img>
       <div class="image-grid-item-icon" v-else>
        <v-icon v-if="citem.icon" class="image-grid-item-img image-grid-item-icon">{{citem.icon}}</v-icon>
        <img v-else-if="citem.svg" class="image-grid-item-svg" :src="citem.svg | svgIcon(darkUi)" loading="lazy"></img>
        <img v-else class="image-grid-item-svg" :src="'image' | svgIcon(darkUi)" loading="lazy"></img>
       </div>
       <div v-if="citem.image" class="image-grid-text" @click.stop="itemMenu(citem, isTop ? citem.gidx : (item.rs+col), $event)">{{citem.title}}</div>
       <div v-else class="image-grid-text">{{citem.title}}</div>
       <div class="image-grid-text subtext" v-if="citem.libname">{{citem.libname}}</div>
       <div class="image-grid-text subtext" v-else v-html="citem.subtitle" v-bind:class="{'link-item':subtitlesClickable}" @click.stop="clickSubtitle(citem, isTop ? citem.gidx : (item.rs+col), $event)"></div>
       <div class="grid-btn image-grid-btn hover-btn menu-btn" v-if="(undefined!=citem.stdItem && citem.stdItem<=STD_ITEM_MAX) || (citem.menu && citem.menu.length>0 && (!citem.isPinned || (!queryParams.party && (!LMS_KIOSK_MODE || !HIDE_FOR_KIOSK.has(PIN_ACTION)))))" @click.stop="itemMenu(citem, isTop ? citem.gidx : (item.rs+col), $event)" :title="i18n('%1 (Menu)', stripLinkTags(citem.title))"></div>
       <div class="emblem" v-if="citem.emblem" :style="{background: citem.emblem.bgnd}">
        <img :src="citem.emblem | emblem()" loading="lazy"></img>
       </div>
       <div v-if="hoverBtns && selection.size==0 && ((undefined!=citem.stdItem && citem.stdItem<=STD_ITEM_MAX) || (citem.menu && citem.menu.length>0 && (citem.menu[0]==PLAY_ACTION || citem.menu[0]==PLAY_ALL_ACTION)))" class="grid-btns">
        <img v-if="(!LMS_KIOSK_MODE || !HIDE_FOR_KIOSK.has(ADD_ACTION)) && allowAdd(citem)" class="other-btn grid-btn" @click.stop="itemAction(ADD_ACTION, citem, isTop ? citem.gidx : (item.rs+col), $event)" :title="ACTIONS[ADD_ACTION].title" :src="'hover-add' | svgIcon(darkUi, true)"></img>
        <img v-if="!queryParams.party && (!LMS_KIOSK_MODE || !HIDE_FOR_KIOSK.has(INSERT_ACTION)) && allowInsert(citem)" class="other-btn grid-btn" @click.stop="itemAction(INSERT_ACTION, citem, isTop ? citem.gidx : (item.rs+col), $event)" :title="ACTIONS[INSERT_ACTION].title" :src="'hover-playnext' | svgIcon(darkUi, true)"></img>
        <img v-if="allowShuffle(citem) && grid.ih>=180" class="other-btn grid-btn" @click.stop="itemAction(PLAY_SHUFFLE_ACTION, citem, isTop ? citem.gidx : (item.rs+col), $event)" :title="ACTIONS[PLAY_SHUFFLE_ACTION].title" :src="'hover-shuffle' | svgIcon(darkUi, true)"></img>
        <img v-if="!queryParams.party && (!LMS_KIOSK_MODE || !HIDE_FOR_KIOSK.has(PLAY_ACTION))" class="main-btn grid-btn" @click.stop="itemAction(PLAY_ACTION, citem, isTop ? citem.gidx : (item.rs+col), $event)" :title="ACTIONS[PLAY_ACTION].title" :src="'hover-play' | svgIcon(darkUi, true)"></img>
       </div>
       <div v-if="hoverBtns && selection.size==0 && citem.image" class="grid-btns grid-btn-left"><img class="other-btn grid-btn" @click.stop="itemAction(SHOW_IMAGE_ACTION, citem, item.rs+col, $event)" :title="ACTIONS[SHOW_IMAGE_ACTION].title" :src="'hover-expand' | svgIcon(darkUi, true)"></img>
       </div>
      </div>
     </div>
    </div>
   </RecycleScroller>

   <RecycleScroller v-else-if="useRecyclerForLists" :items="items" :item-size="LMS_LIST_ELEMENT_SIZE" page-mode key-field="id" :buffer="LMS_SCROLLER_LIST_BUFFER">
    <v-list-tile avatar @click="click(item, index, $event)" slot-scope="{item, index}" @dragstart="dragStart(index, $event)" @dragenter.prevent="" @dragend="dragEnd()" @dragover="dragOver(index, $event)" @drop="drop(index, $event)" :draggable="item.draggable && (current.section!=SECTION_FAVORITES || 0==selection.size)" v-bind:class="{'browse-header':item.header, 'search-highlight':highlightIndex==index, 'highlight':item.highlight, 'list-active': (menu.show && index==menu.index) || (fetchingItem==item.id), 'drop-target':dragActive && index==dropIndex}" @contextmenu.prevent="contextMenu(item, index, $event)">
     <img v-if="!item.selected && item.id==currentTrack" class="browse-current-indicator" :src="'pq-current' | indIcon"></img>
     <v-list-tile-avatar v-if="item.selected" :tile="true" class="lms-avatar">
      <v-icon>check_box</v-icon>
     </v-list-tile-avatar>
     <v-list-tile-avatar v-else-if="item.images" :tile="true" class="mi lms-avatar" :class="'mi'+item.images.length">
      <img v-for="(mic, midx) in item.images" :class="'mi-'+midx" :key="mic" :src="mic" loading="lazy"></img>
     </v-list-tile-avatar>
     <v-list-tile-avatar v-else-if="item.image" :tile="true" v-bind:class="{'radio-image': SECTION_RADIO==item.section || SECTION_APPS==item.section || item.isRadio}" class="lms-avatar">
      <img :key="item.image" :src="item.image" onerror="this.src=DEFAULT_COVER" class="allow-drag" v-bind:class="{'circular':item.stdItem==STD_ITEM_ARTIST || item.stdItem==STD_ITEM_ONLINE_ARTIST || item.stdItem==STD_ITEM_WORK_COMPOSER}" loading="lazy"></img>
     </v-list-tile-avatar>
     <v-list-tile-avatar v-else-if="item.icon" :tile="true" class="lms-avatar">
      <v-icon>{{item.icon}}</v-icon>
     </v-list-tile-avatar>
     <v-list-tile-avatar v-else-if="item.svg" :tile="true" class="lms-avatar">
      <img :class="['hdr-'+hRgb, 'svg-list-img']" :src="item.svg | svgIcon(darkUi, undefined, item.header)" loading="lazy" @dragstart.prevent="" @dragenter.prevent=""></img>
     </v-list-tile-avatar>

     <v-list-tile-avatar v-else-if="undefined!=item.tracknum" class="tnum">{{item.tracknum}}</v-list-tile-avatar>

     <!-- TODO: Do we have search fields with large lists?? -->
     <v-list-tile-content v-if="item.header" @click.stop="click(item, index, $event)">
      <v-list-tile-title>{{item.title}}</v-list-tile-title>
      <v-list-tile-sub-title v-if="item.subtitle && !item.hidesub">{{item.subtitle}}</v-list-tile-sub-title>
     </v-list-tile-content>
     <v-list-tile-content v-else-if="item.type=='html' || item.type=='text'" class="browse-text-inrecycler">
      <v-list-tile-title v-html="item.title" @touchend="textSelectEnd" @mouseup="textSelectEnd" @contextmenu="event.preventDefault()"></v-list-tile-title>
     </v-list-tile-content>
     <v-list-tile-content v-else>
      <v-list-tile-title v-html="item.title" v-bind:class="{'browse-no-sub':!item.subtitle}"></v-list-tile-title>
      <v-list-tile-sub-title v-if="wide>WIDE_NONE && item.subtitleContext" v-html="item.subtitleContext"></v-list-tile-sub-title>
      <v-list-tile-sub-title v-else v-html="item.subtitleLinks ? item.subtitleLinks : item.subtitle"></v-list-tile-sub-title>
     </v-list-tile-content>

     <v-list-tile-action v-if="undefined!=item.durationStr" class="browse-time">{{item.durationStr}}</v-list-tile-action>
     <v-list-tile-action class="browse-action" v-if="((undefined!=item.stdItem && item.stdItem<=STD_ITEM_MAX) && item.stdItem<=STD_ITEM_MAX) || (item.menu && item.menu.length>0)">
      <div class="grid-btn list-btn hover-btn menu-btn" @click.stop="itemMenu(item, index, $event)" :title="i18n('%1 (Menu)', stripLinkTags(item.title))"></div>
     </v-list-tile-action>
     <v-list-tile-action class="browse-action browse-more" v-else-if="undefined!=item.morecmd || undefined!=item.allItems">
      <div class="link-item" :title="i18n('More')" @click="showMore(item)">{{i18n('More')}}</div>
     </v-list-tile-action>
     <div v-if="hoverBtns && 0==selection.size && ((undefined!=item.stdItem && item.stdItem<=STD_ITEM_MAX) || (item.menu && (item.menu[0]==PLAY_ACTION || item.menu[0]==PLAY_ALL_ACTION)))" class="list-btns" v-bind:class="{'list-btns-track':item.durationStr}">
      <img v-if="(!LMS_KIOSK_MODE || !HIDE_FOR_KIOSK.has(ADD_ACTION)) && allowAdd(item)" class="other-btn grid-btn" @click.stop="itemAction(item.header ? ADD_ALL_ACTION : ADD_ACTION, item, index, $event)" :title="ACTIONS[ADD_ACTION].title" :src="'hover-add' | svgIcon(darkUi, true)"></img>
      <img v-if="!queryParams.party && (!LMS_KIOSK_MODE || !HIDE_FOR_KIOSK.has(INSERT_ACTION)) && allowInsert(item)" class="other-btn grid-btn" @click.stop="itemAction( item.header ? INSERT_ALL_ACTION : INSERT_ACTION, item, index, $event)" :title="ACTIONS[INSERT_ACTION].title" :src="'hover-playnext' | svgIcon(darkUi, true)"></img>
      <img v-if="allowShuffle(item)" class="other-btn grid-btn" @click.stop="itemAction(item.header ? PLAY_SHUFFLE_ALL_ACTION : PLAY_SHUFFLE_ACTION, item, index, $event)" :title="ACTIONS[PLAY_SHUFFLE_ACTION].title" :src="'hover-shuffle' | svgIcon(darkUi, true)"></img>
      <img v-if="!queryParams.party && (!LMS_KIOSK_MODE || !HIDE_FOR_KIOSK.has(PLAY_ACTION))" class="main-btn grid-btn" @click.stop="itemAction(item.header ? PLAY_ALL_ACTION : PLAY_ACTION, item, index, $event)" :title="ACTIONS[PLAY_ACTION].title" :src="'hover-play' | svgIcon(darkUi, true)"></img>
     </div>
     <div class="emblem" v-if="item.emblem" :style="{background: item.emblem.bgnd}">
      <img :src="item.emblem | emblem()" loading="lazy"></img>
     </div>
    </v-list-tile>
   </RecycleScroller>

   <div v-else-if="items.length==1 && items[0].type=='html'" class="lms-list-item browse-html" v-html="items[0].title" @touchend="textSelectEnd" @mouseup="textSelectEnd" @contextmenu="event.preventDefault()"></div>
   <template v-else v-for="(item, index) in items">
    <v-list-tile v-if="item.type=='text' && canClickText(item)" avatar @click="click(item, index, $event)" v-bind:class="{'error-text': item.id==='error'}" class="lms-avatar lms-list-item" @contextmenu.prevent="contextMenu(item, index, $event)">
     <v-list-tile-content>
      <v-list-tile-title>{{item.title}}</v-list-tile-title>
      <v-list-tile-sub-title v-html="item.subtitle"></v-list-tile-sub-title>
     </v-list-tile-content>
    </v-list-tile>
    <v-list-tile v-else-if="item.type=='html' || item.type=='text'" class="lms-list-item browse-text">
     <v-list-tile-content>
     <v-list-tile-title v-html="item.title" @touchend="textSelectEnd" @mouseup="textSelectEnd" @contextmenu="event.preventDefault()"></v-list-tile-title>
    </v-list-tile-content>
   </v-list-tile>
    <v-list-tile v-else-if="item.header" class="lms-list-item" v-bind:class="{'browse-header':item.header,'search-highlight':highlightIndex==index}" @click="click(item, index, $event)">
     <v-list-tile-avatar v-if="item.icon" :tile="true" class="lms-avatar">
      <v-icon>{{item.icon}}</v-icon>
     </v-list-tile-avatar>
     <v-list-tile-avatar v-else-if="item.svg" :tile="true" class="lms-avatar">
      <img :class="['hdr-'+hRgb, 'svg-list-img']" :src="item.svg | svgIcon(darkUi, undefined, true)" loading="lazy" @dragstart.prevent="" @dragenter.prevent=""></img>
     </v-list-tile-avatar>
     <v-list-tile-content>
      <v-list-tile-title>{{item.title}}</v-list-tile-title>
      <v-list-tile-sub-title v-if="item.subtitle && !item.hidesub">{{item.subtitle}}</v-list-tile-sub-title>
     </v-list-tile-content>
     <v-list-tile-action v-if="undefined!=item.durationStr" class="browse-time">{{item.durationStr}}</v-list-tile-action>
     <v-list-tile-action class="browse-action" v-if="(undefined!=item.stdItem && item.stdItem<=STD_ITEM_MAX) || (item.menu && item.menu.length>0)">
      <div class="grid-btn list-btn hover-btn menu-btn" @click.stop="itemMenu(item, index, $event)" :title="i18n('%1 (Menu)', stripLinkTags(item.title))"></div>
     </v-list-tile-action>
     <v-list-tile-action class="browse-action browse-more" v-else-if="undefined!=item.morecmd || undefined!=item.allItems">
      <div class="link-item" :title="i18n('More')" @click="showMore(item)">{{i18n('More')}}</div>
     </v-list-tile-action>
     <div v-if="hoverBtns && 0==selection.size && ((undefined!=item.stdItem && item.stdItem<=STD_ITEM_MAX) || (item.menu && (item.menu[0]==PLAY_ACTION || item.menu[0]==PLAY_ALL_ACTION)))" class="list-btns" v-bind:class="{'list-btns-track':item.durationStr}">
      <img v-if="(!LMS_KIOSK_MODE || !HIDE_FOR_KIOSK.has(ADD_ACTION)) && allowAdd(item)" class="other-btn grid-btn" @click.stop="itemAction(ADD_ALL_ACTION, item, index, $event)" :title="ACTIONS[ADD_ACTION].title" :src="'hover-add' | svgIcon(darkUi, false)"></img>
      <img v-if="!queryParams.party && (!LMS_KIOSK_MODE || !HIDE_FOR_KIOSK.has(INSERT_ACTION)) && allowInsert(item)" class="other-btn grid-btn" @click.stop="itemAction(INSERT_ALL_ACTION, item, index, $event)" :title="ACTIONS[INSERT_ACTION].title" :src="'hover-playnext' | svgIcon(darkUi, false)"></img>
      <img v-if="allowShuffle(item)" class="other-btn grid-btn" @click.stop="itemAction(PLAY_SHUFFLE_ALL_ACTION, item, index, $event)" :title="ACTIONS[PLAY_SHUFFLE_ACTION].title" :src="'hover-shuffle' | svgIcon(darkUi, false)"></img>
      <img v-if="!queryParams.party && (!LMS_KIOSK_MODE || !HIDE_FOR_KIOSK.has(PLAY_ACTION))" class="main-btn grid-btn" @click.stop="itemAction(PLAY_ALL_ACTION, item, index, $event)" :title="ACTIONS[PLAY_ACTION].title" :src="'hover-play' | svgIcon(darkUi, false)"></img>
     </div>
    </v-list-tile>
    <v-list-tile v-else-if="item.type=='search' || item.type=='entry' || undefined!=item.input" avatar :key="item.id" class="lms-avatar lms-list-item" :id="'item'+index" v-bind:class="{'list-active': (menu.show && index==menu.index) || (fetchingItem==item.id)}">
     <v-list-tile-content>
      <text-field :focus="index==0 && !IS_MOBILE" :title="item.title" :type="item.type" @value="entry(item, $event)"></text-field>
     </v-list-tile-content>
    </v-list-tile>
    <v-list-tile v-else-if="!(isTop && (disabled.has(item.id) || hidden.has(item.id) || (item.id==TOP_RADIO_ID && lmsOptions.combineAppsAndRadio)) || (queryParams.party && HIDE_TOP_FOR_PARTY.has(item.id)))" avatar @click="click(item, index, $event)" :key="item.id" class="lms-avatar lms-list-item" :id="'item'+index" @dragstart="dragStart(index, $event)" @dragenter.prevent="" @dragend="dragEnd()" @dragover="dragOver(index, $event)" @drop="drop(index, $event)" :draggable="isTop || (item.draggable && (current.section!=SECTION_FAVORITES || 0==selection.size))" @contextmenu.prevent="contextMenu(item, index, $event)" v-bind:class="{'drop-target': dragActive && index==dropIndex, 'search-highlight':highlightIndex==index, 'highlight':item.highlight, 'list-active': (menu.show && index==menu.index) || (fetchingItem==item.id)}">
     <img v-if="!item.selected && item.id==currentTrack" class="browse-current-indicator" :src="'pq-current' | indIcon"></img>
     <v-list-tile-avatar v-if="item.selected" :tile="true" class="lms-avatar">
      <v-icon>check_box</v-icon>
     </v-list-tile-avatar>
     <v-list-tile-avatar v-else-if="item.images" :tile="true" class="mi lms-avatar" :class="'mi'+item.images.length">
      <img v-for="(mic, midx) in item.images" :class="'mi-'+midx" :key="mic" :src="mic" loading="lazy"></img>
     </v-list-tile-avatar>
     <v-list-tile-avatar v-else-if="item.image" :tile="true" class="lms-avatar" v-bind:class="{'radio-image': SECTION_RADIO==item.section || SECTION_APPS==item.section || item.isRadio}">
      <img :key="item.image" v-lazy="item.image" class="allow-drag" v-bind:class="{'circular':item.stdItem==STD_ITEM_ARTIST || item.stdItem==STD_ITEM_ONLINE_ARTIST || item.stdItem==STD_ITEM_WORK_COMPOSER}" onerror="this.src=DEFAULT_COVER"></img>
     </v-list-tile-avatar>
     <v-list-tile-avatar v-else-if="item.icon" :tile="true" class="lms-avatar">
      <v-icon>{{item.icon}}</v-icon>
     </v-list-tile-avatar>
     <v-list-tile-avatar v-else-if="item.svg" :tile="true" class="lms-avatar">
      <img class="svg-list-img" :src="item.svg | svgIcon(darkUi)" @dragstart.prevent="" @dragenter.prevent=""></img>
     </v-list-tile-avatar>
     <v-list-tile-avatar v-else-if="selection.size>0 && browseCanSelect(item)" :tile="true" class="lms-avatar">
      <v-icon>check_box_outline_blank</v-icon>
     </v-list-tile-avatar>

     <v-list-tile-avatar v-else-if="undefined!=item.tracknum" class="tnum">{{item.tracknum}}</v-list-tile-avatar>

     <v-list-tile-content>
      <v-list-tile-title v-html="item.title" v-if="undefined!=item.stdItem && (item.stdItem==STD_ITEM_TRACK || item.stdItem==STD_ITEM_ALBUM_TRACK || item.stdItem==STD_ITEM_PLAYLIST_TRACK || item.stdItem==STD_ITEM_REMOTE_PLAYLIST_TRACK)" v-bind:class="{'browse-no-sub':!item.subtitle}"></v-list-tile-title>
      <v-list-tile-title v-else>{{item.title}}<b class="vlib-name" v-if="isTop && item.libname" v-bind:class="{'browse-no-sub':!item.subtitle}">{{SEPARATOR+item.libname}}</b></v-list-tile-title>
      <v-list-tile-sub-title v-if="wide>WIDE_NONE && item.subtitleContext" v-html="item.subtitleContext"></v-list-tile-sub-title>
      <v-list-tile-sub-title v-else v-html="item.subtitleLinks ? item.subtitleLinks : item.subtitle"></v-list-tile-sub-title>
     </v-list-tile-content>

     <v-list-tile-action v-if="undefined!=item.durationStr" class="browse-time">{{item.durationStr}}</v-list-tile-action>
     <v-list-tile-action class="browse-action" v-if="(undefined!=item.stdItem && item.stdItem<=STD_ITEM_MAX) || (item.menu && item.menu.length>0 && (!item.isPinned || (!queryParams.party && (!LMS_KIOSK_MODE || !HIDE_FOR_KIOSK.has(PIN_ACTION)))))">
      <div class="grid-btn list-btn hover-btn menu-btn" @click.stop="itemMenu(item, index, $event)" :title="i18n('%1 (Menu)', stripLinkTags(item.title))"></div>
     </v-list-tile-action>
     <div v-if="hoverBtns && 0==selection.size && ((undefined!=item.stdItem && item.stdItem<=STD_ITEM_MAX) || (item.menu && (item.menu[0]==PLAY_ACTION || item.menu[0]==PLAY_ALL_ACTION)))" class="list-btns" v-bind:class="{'list-btns-track':item.durationStr}">
      <img v-if="(!LMS_KIOSK_MODE || !HIDE_FOR_KIOSK.has(ADD_ACTION)) && allowAdd(item)" class="other-btn grid-btn" @click.stop="itemAction(ADD_ACTION, item, index, $event)" :title="ACTIONS[ADD_ACTION].title" :src="'hover-add' | svgIcon(darkUi, false)"></img>
      <img v-if="!queryParams.party && (!LMS_KIOSK_MODE || !HIDE_FOR_KIOSK.has(INSERT_ACTION)) && allowInsert(item)" class="other-btn grid-btn" @click.stop="itemAction(INSERT_ACTION, item, index, $event)" :title="ACTIONS[INSERT_ACTION].title" :src="'hover-playnext' | svgIcon(darkUi, false)"></img>
      <img v-if="allowShuffle(item)" class="other-btn grid-btn" @click.stop="itemAction(PLAY_SHUFFLE_ACTION, item, index, $event)" :title="ACTIONS[PLAY_SHUFFLE_ACTION].title" :src="'hover-shuffle' | svgIcon(darkUi, false)"></img>
      <img v-if="!queryParams.party" class="main-btn grid-btn" @click.stop="itemAction(PLAY_ACTION, item, index, $event)" :title="ACTIONS[PLAY_ACTION].title" :src="'hover-play' | svgIcon(darkUi, false)"></img>
     </div>
     <div class="emblem" v-if="item.emblem" :style="{background: item.emblem.bgnd}">
      <img :src="item.emblem | emblem()" loading="lazy"></img>
     </div>
    </v-list-tile>
   </template>
   <div style="height:20px; background:transparent"></div> <!-- add padding -->
  </div>
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
    <div style="height:0px!important" v-if="(queryParams.party && HIDE_FOR_PARTY.has(action)) || (isTop && action==SELECT_ACTION) || (LMS_KIOSK_MODE && HIDE_FOR_KIOSK.has(action)) || ((PLAY_SHUFFLE_ACTION==action || PLAY_SHUFFLE_ALL_ACTION==action) && !allowShuffle(menu.item))"></div>
    <v-divider v-else-if="DIVIDER==action"></v-divider>
    <template v-for="(cact, cindex) in itemCustomActions" v-else-if="CUSTOM_ACTIONS==action">
     <v-list-tile @click="itemCustomAction(cact, menu.item, menu.index)">
      <v-list-tile-avatar>
       <v-icon v-if="undefined==cact.svg">{{cact.icon}}</v-icon>
       <img v-else class="svg-img" :src="cact.svg | svgIcon(darkUi)"></img>
      </v-list-tile-avatar>
      <v-list-tile-title>{{cact.title}}</v-list-tile-title>
     </v-list-tile>
    </template>
    <v-list-tile v-else-if="action==ADD_TO_FAV_ACTION && isInFavorites(menu.item)" @click="menuItemAction(REMOVE_FROM_FAV_ACTION, menu.item, menu.index, $event)">
     <v-list-tile-avatar>
      <v-icon v-if="undefined==ACTIONS[REMOVE_FROM_FAV_ACTION].svg">{{ACTIONS[REMOVE_FROM_FAV_ACTION].icon}}</v-icon>
      <img v-else class="svg-img" :src="ACTIONS[REMOVE_FROM_FAV_ACTION].svg | svgIcon(darkUi)"></img>
     </v-list-tile-avatar>
     <v-list-tile-title>{{ACTIONS[REMOVE_FROM_FAV_ACTION].title}}</v-list-tile-title>
    </v-list-tile>
    <v-list-tile v-else-if="action==SELECT_ACTION && menu.item.selected" @click="menuItemAction(UNSELECT_ACTION, menu.item, menu.index, $event)">
     <v-list-tile-avatar>
      <v-icon>{{ACTIONS[UNSELECT_ACTION].icon}}</v-icon>
     </v-list-tile-avatar>
     <v-list-tile-title>{{ACTIONS[UNSELECT_ACTION].title}}</v-list-tile-title>
    </v-list-tile>
    <v-list-tile v-else-if="action==BR_COPY_ACTION ? queueSelection : action==MOVE_HERE_ACTION ? (selection.size>0 && !menu.item.selected) : action==DOWNLOAD_ACTION ? lmsOptions.allowDownload && undefined==menu.item.emblem : action==PLAY_DISC_ACTION ? undefined!=menu.item.disc : (action!=RATING_ACTION || showRating)" @click="menuItemAction(action, menu.item, menu.index, $event)">
     <v-list-tile-avatar>
      <v-icon v-if="undefined==ACTIONS[action].svg">{{ACTIONS[action].icon}}</v-icon>
      <img v-else class="svg-img" :src="ACTIONS[action].svg | svgIcon(darkUi)"></img>
     </v-list-tile-avatar>
     <v-list-tile-title>{{ACTIONS[action].title}}</v-list-tile-title>
    </v-list-tile>
    <v-list-tile v-if="action==COPY_DETAILS_ACTION && undefined!=menu.item.image && (index==menu.itemMenu.length-1 || menu.itemMenu[index+1]!=SHOW_IMAGE_ACTION)" @click="menuItemAction(SHOW_IMAGE_ACTION, menu.item, menu.index, $event)">
     <v-list-tile-avatar>
      <img class="svg-img" :src="ACTIONS[SHOW_IMAGE_ACTION].svg | svgIcon(darkUi)"></img>
     </v-list-tile-avatar>
     <v-list-tile-title>{{ACTIONS[SHOW_IMAGE_ACTION].title}}</v-list-tile-title>
    </v-list-tile>
   </template>
  </v-list>
  <v-list v-else-if="menu.history">
   <template v-for="(item, index) in menu.history">
    <v-list-tile @click="goTo(index)">
     <v-list-tile-avatar>
      <v-icon v-if="undefined!=item.icon">{{item.icon}}</v-icon>
      <img v-else-if="undefined!=item.svg" class="svg-img" :src="item.svg | svgIcon(darkUi)"></img>
      <img v-else-if="undefined!=item.image" class="svg-img menu-image" :src="item.image"></img>
     </v-list-tile-avatar>
     <v-list-tile-content><v-list-tile-title>{{item.title}}</v-list-tile-title></v-list-tile-content>
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
  <v-list v-else-if="menu.items">
   <template v-for="(item, index) in menu.items">
    <v-list-tile @click="menuItemAction(item, undefined, undefined, $event)" v-if="undefined==item.title">
     <v-list-tile-avatar :tile="true" class="lms-avatar"><v-icon v-if="ACTIONS[item].icon">{{ACTIONS[item].icon}}</v-icon><img v-else-if="ACTIONS[item].svg" class="svg-img" :src="ACTIONS[item].svg | svgIcon(darkUi)"></img></v-list-tile-avatar>
     <v-list-tile-title>{{ACTIONS[item].title}}</v-list-tile-title>
    </v-list-tile>
   </template>
  </v-list>
  <v-list v-else-if="menu.currentActions">
   <template v-for="(item, index) in menu.currentActions">
    <v-divider v-if="DIVIDER==item.action"></v-divider>
    <v-subheader v-else-if="HEADER==item.action">{{item.title}}</v-subheader>
    <div v-else-if="GROUP==item.action">
     <v-list-group v-model="item.expanded" @click.stop="">
      <template v-slot:activator><v-list-tile><v-list-tile-content><v-list-tile-title>{{item.title}}</v-list-tile-title></v-list-tile-content><v-list-tile></template>
      <v-list-tile v-for="(subItem, subIndex) in item.actions" @click="currentAction(subItem, index+subIndex, $event)">
       <v-list-tile-avatar>
        <v-icon v-if="undefined==subItem.svg">{{subItem.icon}}</v-icon>
        <img v-else class="svg-img" :src="subItem.svg | svgIcon(darkUi)"></img>
       </v-list-tile-avatar>
       <v-list-tile-content><v-list-tile-title>{{subItem.title}}</v-list-tile-title></v-list-tile-content>
      </v-list-tile>
     </v-list-group>
     <v-divider></v-divider>
    </div>
    <div v-else-if="GOTO_ARTIST_ACTION==item.action && history.length>1 && history[history.length-1].current.stdItem==STD_ITEM_ARTIST"></div>
    <v-list-tile v-else-if="!item.isListItemInMenu && item.action==ADD_TO_FAV_ACTION && isInFavorites(current)" @click="menuItemAction(REMOVE_FROM_FAV_ACTION, current, undefined, $event)">
     <v-list-tile-avatar>
      <v-icon v-if="undefined==ACTIONS[REMOVE_FROM_FAV_ACTION].svg">{{ACTIONS[REMOVE_FROM_FAV_ACTION].icon}}</v-icon>
      <img v-else class="svg-img" :src="ACTIONS[REMOVE_FROM_FAV_ACTION].svg | svgIcon(darkUi)"></img>
     </v-list-tile-avatar>
     <v-list-tile-title>{{ACTIONS[REMOVE_FROM_FAV_ACTION].title}}</v-list-tile-title>
    </v-list-tile>
    <v-list-tile v-else-if="!item.isListItemInMenu && undefined!=item.action" @click="menuItemAction(item.action, current, undefined, $event)">
     <v-list-tile-avatar>
      <v-icon v-if="undefined==ACTIONS[item.action].svg">{{ACTIONS[item.action].icon}}</v-icon>
      <img v-else class="svg-img" :src="ACTIONS[item.action].svg | svgIcon(darkUi)"></img>
     </v-list-tile-avatar>
     <v-list-tile-content><v-list-tile-title>{{ACTIONS[item.action].title}}</v-list-tile-title></v-list-tile-content>
    </v-list-tile>
    <v-list-tile v-else-if="item.isListItemInMenu && 'itemNoAction'==item.style" class="nonclick-menu-item">
     <v-list-tile-avatar>
      <v-icon v-if="undefined==item.svg">{{item.icon}}</v-icon>
      <img v-else class="svg-img" :src="item.svg | svgIcon(darkUi)"></img>
     </v-list-tile-avatar>
     <v-list-tile-content><v-list-tile-title>{{item.title}}</v-list-tile-title></v-list-tile-content>
    </v-list-tile>
    <v-list-tile v-else @click="currentAction(item, index, $event)">
     <v-list-tile-avatar>
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
     <v-list-tile-avatar>
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
            current: {image: undefined},
            currentActions: [],
            currentItemImage: undefined, // image set in broweResp - currently only for album track lists
            currentBgndUrl: "",
            showBgnd: true,
            headerTitle: undefined,
            headerSubTitle: undefined,
            detailedSubInfo: undefined,
            detailedSubExtra: undefined,
            items: [],
            topExtra: [],
            topExtraCfg: {val:0, order:[]},
            grid: {allowed:true, use:getLocalStorageBool('grid', true), numItems:0, numColumns:0, ih:GRID_MIN_HEIGHT, rows:[], few:false, haveSubtitle:true, multiSize:false, type:GRID_STANDARD},
            fetchingItem:undefined,
            hoverBtns: !IS_MOBILE,
            trans: { ok:undefined, cancel: undefined, close: undefined, selectMultiple:undefined, addsel:undefined, playsel:undefined,shufflesel:undefined,
                     deletesel:undefined, removeall:undefined, invertSelect:undefined, choosepos:undefined, goHome:undefined, goBack:undefined,
                     select:undefined, unselect:undefined, sources: undefined, desc: undefined, actions:undefined },
            menu: { show:false, item: undefined, x:0, y:0, index:-1},
            isTop: true,
            libraryName: undefined, // Name of currently chosen library
            pinnedItemLibName: undefined, // Name of library from pinned item - if saved with pinned item
            selection: new Set(),
            selectionDuration: 0,
            section: undefined,
            letter: undefined,
            filteredJumplist: [],
            tbarActions: [],
            itemCustomActions: [],
            subtitleClickable: false,
            disabled: new Set(),
            wide: WIDE_NONE,
            trackWide: TRACK_WIDE_ONE,
            searchActive: 0,
            dragActive: false,
            dropIndex: -1,
            highlightIndex: -1,
            hRgb: "000",
            tall: window.innerHeight>=MIN_HEIGHT_FOR_DETAILED_SUB ? 1 : 0,
            currentTrack: undefined
        }
    },
    computed: {
        numCurrentActionsInToolbar() {
            if (this.tbarActions.length<3 && this.currentActions.length>0) {
                let slots = 3 - this.tbarActions.length;
                if (this.currentActions.length>slots) {
                    return slots - 1;
                }
                return this.currentActions.length;
            }
            return 0;
        },
        darkUi() {
            return this.$store.state.darkUi
        },
        hidden() {
            return this.$store.state.hidden
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
        homeButton() {
            return this.$store.state.homeButton
        },
        useRecyclerForLists() {
            return !this.isTop && this.items.length>LMS_MAX_NON_SCROLLER_ITEMS
        },
        currentImage() {
            if (this.current) {
                if (this.current.image) {
                    return this.current.image;
                }
                if (this.currentItemImage) {
                    return this.currentItemImage;
                }
                let stdItem = this.current.stdItem ? this.current.stdItem : this.current.altStdItem;
                if ((stdItem==STD_ITEM_ONLINE_ARTIST_CATEGORY || stdItem==STD_ITEM_WORK) && this.history.length>0) {
                    let prev = this.history[this.history.length-1];
                    if (prev.current.image) {
                        return prev.current.image;
                    }
                    if (prev.currentItemImage) {
                        return prev.currentItemImage;
                    }
                }
            }
            return undefined
        },
        currentImages() {
            if (this.current) {
                if (this.current.images) {
                    return this.current.images;
                }
                let stdItem = this.current.stdItem ? this.current.stdItem : this.current.altStdItem;
                if ((stdItem==STD_ITEM_ONLINE_ARTIST_CATEGORY || stdItem==STD_ITEM_WORK) && this.history.length>0) {
                    let prev = this.history[this.history.length-1];
                    if (prev.current.images) {
                        return prev.current.images;
                    }
                }
            }
            return undefined
        },
        currentImageUrl() {
            let url = this.currentImage;
            if (undefined==url && this.history.length>0) {
                let prev = this.history[this.history.length-1]
                if (i18n("Select category")==prev.headerSubTitle) {
                    url = prev.current && prev.current.image ? prev.current.image : prev.currentItemImage;
                }
            }
            return url;
        },
        bgndUrl() {
            return this.$store.state.browseBackdrop ? this.currentImageUrl : undefined
        },
        drawBgndImage() {
            return undefined!=this.bgndUrl && this.showBgnd
        },
        drawBackdrop() {
            return !this.drawBgndImage && this.$store.state.browseBackdrop && this.$store.state.useDefaultBackdrops && this.showBgnd
        },
        toolbarTitle() {
            let stdItem = this.current ? this.current.stdItem ? this.current.stdItem : this.current.altStdItem : undefined;
            return this.headerTitle + (this.current && stdItem==STD_ITEM_ALBUM && this.current.subIsYear ? " (" + this.current.subtitle + ")" : "");
        },
        toolbarSubTitle() {
            if (undefined!=this.current && this.current.id==TOP_MYMUSIC_ID) {
                return this.showLibName ? this.libraryName : undefined;
            }
            let stdItem = this.current ? this.current.stdItem ? this.current.stdItem : this.current.altStdItem : undefined;
            if (undefined!=this.current && (stdItem==STD_ITEM_ALBUM || stdItem==STD_ITEM_ALL_TRACKS || stdItem==STD_ITEM_COMPOSITION_TRACKS || stdItem==STD_ITEM_WORK || stdItem==STD_ITEM_CLASSICAL_WORKS)) {
                let albumArtst = this.current.subIsYear ? undefined : this.current.subtitle;
                if (lmsOptions.noArtistFilter && this.current.compilation && this.items.length>0 && undefined!=this.items[0].compilationAlbumArtist) {
                    albumArtst = this.items[0].compilationAlbumArtist;
                }
                if (undefined!=albumArtst) {
                    return albumArtst + ' (' + this.headerSubTitle + ')';
                }
                for (let loop=this.history, i=loop.length-1; i>=0 && undefined!=loop[i].current; --i) {
                    if (STD_ITEM_ALBUM==loop[i].current.stdItem && undefined!=loop[i].current.subtitle) {
                        return loop[i].current.subtitle + ' (' + this.headerSubTitle + ')';
                    } else if (STD_ITEM_ARTIST==loop[i].current.stdItem || STD_ITEM_WORK_COMPOSER==loop[i].current.stdItem) {
                        return (loop[i].current.noReleaseGrouping ? loop[i].current.title.split(SEPARATOR)[0] : loop[i].current.title) + ' (' + this.headerSubTitle + ')';
                    }
                }
            }
            return this.headerSubTitle ? this.headerSubTitle : undefined;
        },
        showDetailedSubtoolbar() {
            if (this.tall>0) { //} && (undefined!=this.detailedSubExtra || this.detailedSubBot || this.wide>=WIDE_COVER)) {
                let stdItem = this.current ? this.current.stdItem ? this.current.stdItem : this.current.altStdItem : undefined;
                return this.wide>WIDE_NONE && this.current && undefined!=stdItem &&
                       (this.currentImage || stdItem==STD_ITEM_ONLINE_ARTIST_CATEGORY) &&
                       ( stdItem==STD_ITEM_ARTIST || stdItem==STD_ITEM_WORK_COMPOSER || stdItem==STD_ITEM_ALBUM ||
                         stdItem==STD_ITEM_WORK || stdItem==STD_ITEM_CLASSICAL_WORKS || stdItem>=STD_ITEM_MAI ||
                         ((stdItem==STD_ITEM_PLAYLIST || stdItem==STD_ITEM_REMOTE_PLAYLIST) && lmsOptions.playlistImages) ||
                         (this.wide>=WIDE_COVER && (stdItem==STD_ITEM_ONLINE_ARTIST || stdItem==STD_ITEM_ONLINE_ALBUM ||
                            stdItem==STD_ITEM_ONLINE_ARTIST_CATEGORY)));
            }
            return false;
        },
        detailedSubTop() {
            let stdItem = this.current.stdItem ? this.current.stdItem : this.current.altStdItem;
            if (stdItem==STD_ITEM_ARTIST || stdItem==STD_ITEM_WORK_COMPOSER) {
                return this.detailedSubInfo;
            }
            if (stdItem==STD_ITEM_PLAYLIST) {
                return i18n("Local Playlist");
            }
            if (stdItem==STD_ITEM_REMOTE_PLAYLIST) {
                return i18n("Remote Playlist");
            }
            if (stdItem==STD_ITEM_WORK) {
                return undefined!=this.current.composer ? this.current.composer : this.current.subtitle;
            }
            if (stdItem==STD_ITEM_ALBUM || (stdItem==STD_ITEM_ONLINE_ALBUM && this.current.sbMeta) ||
                stdItem==STD_ITEM_ALL_TRACKS || stdItem==STD_ITEM_COMPOSITION_TRACKS || stdItem==STD_ITEM_MIX ||
                stdItem==STD_ITEM_CLASSICAL_WORKS) {
                let albumArtst = this.current.subIsYear ? undefined : this.current.subtitle;
                if (lmsOptions.noArtistFilter && this.current.compilation && this.items.length>0 && undefined!=this.items[0].compilationAlbumArtist) {
                    albumArtst = this.items[0].compilationAlbumArtist;
                }
                if (undefined!=albumArtst) {
                    return albumArtst;
                }
                for (let loop=this.history, i=loop.length-1; i>=0 && undefined!=loop[i].current; --i) {
                    if (STD_ITEM_ALBUM==loop[i].current.stdItem && undefined!=loop[i].current.subtitle) {
                        return loop[i].current.subtitle;
                    } else if (STD_ITEM_ARTIST==loop[i].current.stdItem || STD_ITEM_WORK_COMPOSER==loop[i].current.stdItem) {
                        return loop[i].current.title;
                    }
                }
                return "&nbsp;";
            }
            return this.headerSubTitle
        },
        detailedSubBot() {
            if (!this.current) {
                return false;
            }
            let stdItem = this.current.stdItem ? this.current.stdItem : this.current.altStdItem;
            if (stdItem==STD_ITEM_ARTIST || stdItem==STD_ITEM_WORK_COMPOSER || stdItem==STD_ITEM_WORK || stdItem==STD_ITEM_CLASSICAL_WORKS || stdItem==STD_ITEM_PLAYLIST || stdItem==STD_ITEM_REMOTE_PLAYLIST) {
                return this.headerSubTitle;
            }
            if (stdItem==STD_ITEM_ALBUM || (stdItem==STD_ITEM_ONLINE_ALBUM && this.current.sbMeta) || stdItem==STD_ITEM_MIX || stdItem==STD_ITEM_ALL_TRACKS || stdItem==STD_ITEM_COMPOSITION_TRACKS) {
                return this.detailedSubInfo;
            }
        },
        showMaiButton() {
            if (this.isTrackList ? this.trackWide<(this.allowShuffle(this.current) ? TRACK_WIDE_FOUR : TRACK_WIDE_THREE) : this.wide<WIDE_HBTNS) {
                return false;
            }
            let stdItem = this.current.stdItem ? this.current.stdItem : this.current.altStdItem;
            if (LMS_P_MAI && this.showDetailedSubtoolbar && (stdItem==STD_ITEM_ARTIST || stdItem==STD_ITEM_WORK_COMPOSER || stdItem==STD_ITEM_ALBUM)) {
                if (stdItem==STD_ITEM_ARTIST || stdItem==STD_ITEM_WORK_COMPOSER) {
                    // 'Various Artists' will not have biography entry in its menu. So, if
                    // this item is not found then we don't show toolbar button...
                    for (let i=0, loop=this.currentActions, len=loop.length; i<len; ++i) {
                        if (loop[i].stdItem==STD_ITEM_MAI) {
                            return true;
                        }
                    }
                    return false;
                }
                return true;
            }
            return false;
        },
        showMixButton() {
            if (LMS_P_BMIX && this.wide>=WIDE_MIX_BTN && this.showDetailedSubtoolbar && (this.current.stdItem==STD_ITEM_ARTIST || this.current.stdItem==STD_ITEM_WORK_COMPOSER ||this.current.stdItem==STD_ITEM_ALBUM)) {
                for (let i=0, loop=this.currentActions, len=loop.length; i<len; ++i) {
                    if (loop[i].stdItem==STD_ITEM_MIX) {
                        return true;
                    }
                }
            }
            return false;
        },
        pinQueue() {
            return this.$store.state.pinQueue
        },
        showRating() {
            return undefined!=LMS_P_RP && this.$store.state.showRating
        },
        tint() {
            return this.$store.state.tinted && this.$store.state.cMixSupported
        },
        variableGridHeight() {
            return (this.isTop && this.$store.state.detailedHome>0 && undefined!=this.topExtra && this.topExtra.length>0) || this.grid.multiSize
        },
        allowListOnHome() {
            return this.$store.state.detailedHome<=0
        },
        allowVLibOnHome() {
            return undefined!=this.libraryName
        },
        showLibName() {
            return undefined!=this.libraryName && undefined!=this.$store.state.library && !LMS_DEFAULT_LIBRARIES.has(this.$store.state.library)
        },
        subtitlesClickable() {
            return this.subtitleClickable || (this.isTop && this.$store.state.detailedHome>0 && undefined!=this.topExtra && this.topExtra.length>0)
        },
        isTrackList() {
            return undefined!=this.current && (STD_ITEM_ALBUM==this.current.stdItem || STD_ITEM_PLAYLIST==this.current.stdItem || STD_ITEM_REMOTE_PLAYLIST==this.current.stdItem || this.current.stdItem==STD_ITEM_ALL_TRACKS || STD_ITEM_ONLINE_ALBUM==this.current.stdItem || STD_ITEM_REMOTE_PLAYLIST==this.current.stdItem)
        },
        isImageTrackList() {
            return undefined!=this.current && (STD_ITEM_PLAYLIST==this.current.stdItem || STD_ITEM_REMOTE_PLAYLIST==this.current.stdItem || this.current.stdItem==STD_ITEM_ALL_TRACKS || this.current.stdItem==STD_ITEM_REMOTE_PLAYLIST)
        },
        showTrackListCommands() {
            return this.wide<WIDE_MIX_BTN && this.isTrackList && this.showDetailedSubtoolbar
        }
    },
    created() {
        if (!IS_MOBILE) {
            let browse = this;
            document.onkeyup = function(event) {
                try { browseHandleKey(browse, event); } catch(e) { }
            };
        }
        this.reqId = 0;
        this.myMusic=[];
        this.history=[];
        this.fetchingItem = undefined;
        this.current = null;
        this.currentLibId = null;
        this.headerTitle = null;
        this.headerSubTitle=null;
        this.tbarActions=[];
        this.options={pinned: new Set(),
                      sortFavorites: this.$store.state.sortFavorites};
        this.previousScrollPos=0;
        this.grid = {allowed:true, use:this.$store.state.detailedHome || (this.$store.state.gridPerView ? isSetToUseGrid(GRID_TOP) : getLocalStorageBool('grid', true)), numItems:0, numColumns:0, ih:GRID_MIN_HEIGHT, rows:[], few:false, haveSubtitle:true, multiSize:false, type:GRID_STANDARD};
        this.currentActions=[{action:VLIB_ACTION}, {action:(this.grid.use ? USE_LIST_ACTION : USE_GRID_ACTION)}];
        this.canDrop = true;

        if (!IS_MOBILE) {
            bindKey('home');
            bindKey(LMS_SEARCH_KEYBOARD, 'mod');
            bindKey(LMS_SEARCH_KEYBOARD, 'alt');
            bindKey(LMS_PLAY_KEYBOARD, 'mod+shift');
            bindKey(LMS_APPEND_KEYBOARD, 'mod+shift');
            bindKey(LMS_ADD_ITEM_ACTION_KEYBOARD, 'mod+shift');
            bindKey(LMS_CREATE_FAV_FOLDER_KEYBOARD, 'mod+shift');
            bindKey('pageup', undefined, true);
            bindKey('pagedown', undefined, true);
            bus.$on('keyboard', function(key, modifier) {
                if (this.$store.state.openDialogs.length>0 || this.$store.state.visibleMenus.size>0 || (!this.$store.state.desktopLayout && this.$store.state.page!="browse")) {
                    return;
                }
                if ('mod'==modifier) {
                    if (LMS_SEARCH_KEYBOARD==key) {
                        if (this.selection.size<=0) {
                            if (this.isTop || (this.current && (this.current.id==TOP_MYMUSIC_ID || this.current.id.startsWith(SEARCH_ID)))) {
                                this.itemAction(SEARCH_LIB_ACTION);
                            } else if (this.currentActions.indexOf(SEARCH_LIST_ACTION)) {
                                this.itemAction(SEARCH_LIST_ACTION);
                            }
                        }
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
                } else if ('alt'==modifier) {
                    if (LMS_SEARCH_KEYBOARD==key && this.selection.size<=0) {
                        bus.$emit('dlg.open', 'advancedsearch', true, this.$store.state.library ? this.$store.state.library : LMS_DEFAULT_LIBRARY);
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
        bus.$on('releaseSupportChanged', function() {
            this.updateSortStrings();
        }.bind(this));
        this.queueEmpty = true;
        bus.$on('queueStatus', function(size) {
            this.queueEmpty = size<1;
        }.bind(this));
        bus.$on('customActions', function() {
            this.loadCustomPinned(this);
        }.bind(this));
    },
    methods: {
        updateSortStrings() {
            B_ALBUM_SORTS=[
                { key:"album",           label:lmsOptions.supportReleaseTypes ? i18n("Release") : i18n("Album")},
                { key:"artistalbum",     label:lmsOptions.supportReleaseTypes ? i18n("Artist, Release") : i18n("Artist, Album")},
                { key:"artflow",         label:lmsOptions.supportReleaseTypes ? i18n("Artist, Year, Release") : i18n("Artist, Year, Album")},
                { key:"yearalbum",       label:lmsOptions.supportReleaseTypes ? i18n("Year, Release") : i18n("Year, Album")},
                { key:"yearartistalbum", label:lmsOptions.supportReleaseTypes ? i18n("Year, Artist, Release") : i18n("Year, Artist, Album")},
                { key:"new",             label:i18n("Newest")} ];
            B_TRACK_SORTS=[
                { key:"title",           label:i18n("Title")},
                { key:"tracknum",        label:i18n("Track Number")},
                { key:"albumtrack",      label:lmsOptions.supportReleaseTypes ? i18n("Release, Track Number") : i18n("Album, Track Number")},
                { key:"yearalbumtrack",  label:lmsOptions.supportReleaseTypes ? i18n("Year, Release, Track Number") : i18n("Year, Album, Track Number")},
                { key:"artisttitle",     label:i18n("Artist, Title")},
                { key:"yeartitle",       label:i18n("Year, Title")} ];
        },
        initItems() {
            updateActionStrings();
            this.updateSortStrings();

            this.trans= { ok:i18n('OK'), cancel: i18n('Cancel'), close: i18n('Close'), selectMultiple:i18n("Select multiple items"),
                          addsel:i18n("Add selection to queue"),  playsel:i18n("Play selection"), shufflesel:i18n("Play selection shuffled"),
                          deletesel:i18n("Delete all selected items"), invertSelect:i18n("Invert selection"),
                          removeall:i18n("Remove all selected items"), choosepos:i18n("Choose position"), goHome:i18n("Go home"),
                          goBack:i18n("Go back"),  home:i18n("Home"), desc:i18n("Descending"), actions:i18n("Actions")
            };

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
                              id: TOP_EXTRAS_ID }];
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
                                        : this.top[i].title;
            }

            bus.$emit('homeScreenItems', this);
            if (this.history.length<1) {
                this.items = this.top;
                this.layoutGrid(true);
            }
            this.getHomeExtra();
        },
        autoExpand() {
            if (queryParams.expand.length>0) {
                let idx = -1;
                for (let i=0, loop=this.top, len=loop.length; i<len; ++i) {
                    if (loop[i].title==queryParams.expand[0]) {
                        queryParams.expand.shift();
                        idx = i;
                        break;
                    }
                }
                if (idx<0) {
                    queryParams.expand = [];
                } else {
                    this.autoClick(idx, 0);
                }
            }
        },
        autoClick(idx, attempt) {
            if (attempt>=20) {
                queryParams.expand = [];
                return;
            }
            try {
                browseClick(this, this.items[idx], idx);
            } catch(e) {
                setTimeout(function () { this.autoClick(idx, attempt+1); }.bind(this), 100);
            }
        },
        playerId() {
            return this.$store.state.player ? this.$store.state.player.id : "";
        },
        playerName() {
            return this.$store.state.player ? this.$store.state.player.name : "";
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
        fetchItems(command, item, prevPage, startIndex) {
            if (this.fetchingItem!=undefined) {
                return;
            }

            this.fetchingItem = item.id;
            var count = item.stdItem==STD_ITEM_PLAYLIST ? lmsOptions.pagedBatchSize : (item.limit ? item.limit : LMS_BATCH_SIZE);
            lmsList(this.playerId(), command.command, command.params, undefined==startIndex ? 0 : startIndex, count, item.cancache, this.nextReqId()).then(({data}) => {
                if (this.isCurrentReq(data)) {
                    var resp = parseBrowseResp(data, item, this.options, item.cancache && browseCanUseCache(this) ? cacheKey(command.command, command.params, 0, count) : undefined);
                    this.fetchingItem = undefined;
                    this.handleListResponse(item, command, resp, prevPage, startIndex>0);
                }
            }).catch(err => {
                this.fetchingItem = undefined;
                this.handleListResponse(item, command, {items: []});
                logError(err, command.command, command.params, 0, count);
                logNoPlayerError(this);
            });
        },
        getHomeExtra() {
            this.topExtraCfg={val: this.$store.state.detailedHome, order: this.$store.state.detailedHomeOrder};
            if (this.$store.state.detailedHome>0) {
                let cmd = ["material-skin", "home-extra"];
                if (this.$store.state.detailedHome&DETAILED_HOME_NEW) {
                    cmd.push("new:1");
                }
                if (this.$store.state.detailedHome&DETAILED_HOME_MOST && LMS_VERSION>=90100 && LMS_STATS_ENABLED) {
                    cmd.push("most:1");
                }
                if (this.$store.state.detailedHome&DETAILED_HOME_RECENT && LMS_VERSION>=90100 && LMS_STATS_ENABLED) {
                    cmd.push("recent:1");
                }
                if (this.$store.state.detailedHome&DETAILED_HOME_RANDOM) {
                    cmd.push("random:1");
                }
                if (this.$store.state.detailedHome&DETAILED_HOME_RADIOS) {
                    cmd.push("radios:1");
                }
                if (this.$store.state.detailedHome&DETAILED_HOME_PLAYLISTS && lmsOptions.playlistImages) {
                    cmd.push("playlists:1");
                }
                if (this.$store.state.detailedHome&DETAILED_HOME_UPDATED) {
                    cmd.push("changed:1");
                }
                cmd.push("library_id:"+this.$store.state.library);
                lmsCommand("", cmd, this.nextReqId()).then(({data}) => {
                    if (this.isCurrentReq(data)) {
                        this.handleHomeExtra(data);
                    }
                }).catch(err => {
                    logError(err);
                });
            }
        },
        handleHomeExtra(data) {
            try {
                let resp = parseBrowseResp(data, undefined, {order:this.$store.state.detailedHomeOrder});
                this.fetchingItem = undefined;
                if (undefined!=resp && undefined!=resp.items) {
                    if (undefined==this.topExtra || !arraysEqual(this.topExtra, resp.items)) {
                        this.topExtra = resp.items;
                        if (this.isTop && this.$store.state.detailedHome>0) {
                            this.grid.use = true;
                            this.setLayoutAction();
                            this.items = this.topExtra.concat(this.top);
                            this.layoutGrid(true);
                        }
                    }
                }
            } catch (e) {
                setTimeout(function () { this.handleHomeExtra(data); }.bind(this), 50);
            }
        },
        handleListResponse(item, command, resp, prevPage, appendItems) {
            browseHandleListResponse(this, item, command, resp, prevPage, appendItems);
        },
        handleTextClickResponse(item, command, data, isMoreMenu) {
            browseHandleTextClickResponse(this, item, command, data, isMoreMenu);
        },
        canClickText(item) {
            return canClickItem(item);
        },
        doTextClick(item, isMoreMenu) {
            var command = this.buildCommand(item);
            if ((command.command.length==2 && ("items"==command.command[1] || "browsejive"==command.command[1] || "jiveplaylistparameters"==command.command[1])) ||
                (command.command.length==1 && "albums"==command.command[0])) {
                this.fetchingItem = item.id;
                lmsList(this.playerId(), command.command, command.params, 0, LMS_BATCH_SIZE, undefined, this.nextReqId()).then(({data}) => {
                    if (this.isCurrentReq(data)) {
                        this.fetchingItem = undefined;
                        this.handleTextClickResponse(item, command, data, isMoreMenu);
                    }
                }).catch(err => {
                    this.fetchingItem = undefined;
                    logError(err, command.command, command.params);
                    logNoPlayerError(this);
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
                    logNoPlayerError(this);
                });
            }
        },
        click(item, index, event) {
            storeClickOrTouchPos(event, this.menu);
            browseClick(this, item, index, event);
        },
        entry(item, text) {
            if (this.fetchingItem!=undefined) {
                return;
            }
            this.enteredTerm = text;
            if (undefined==this.enteredTerm) {
                return
            }
            this.enteredTerm=this.enteredTerm.trim();
            if (isEmpty(this.enteredTerm)) {
                return;
            }
            if (item.type=='search') {
                this.fetchItems(this.buildCommand(item), item);
            } else {
                this.doTextClick(item);
            }
        },
        itemMoreMenu(item, queueIndex, page) {
            if (undefined!=queueIndex) {
                this.fetchItems({command: ["trackinfo", "items"], params: ["playlist_index:"+queueIndex, "menu:1", "html:1"], ismore:true}, item, page);
            } else if (item.id) {
                var params=[originalId(item.id), "menu:1", "html:1"];
                if (item.id.startsWith("artist_id:")) {
                    this.fetchItems({command: ["artistinfo", "items"], params: params, ismore:true}, {id:originalId(item.id), title:item.title}, page);
                } else if (item.id.startsWith("album_id:")) {
                    this.fetchItems({command: ["albuminfo", "items"], params: params, ismore:true}, {id:originalId(item.id), title:item.title}, page);
                } else if (item.id.startsWith("track_id:")) {
                    this.fetchItems({command: ["trackinfo", "items"], params: params, ismore:true}, item, page);
                } else if (item.id.startsWith("genre_id:")) {
                    this.fetchItems({command: ["genreinfo", "items"], params: params, ismore:true}, item, page);
                } else if (item.id.startsWith("year:")) {
                    this.fetchItems({command: ["yearinfo", "items"], params: params, ismore:true}, item, page);
                } else if (item.id.startsWith("playlist_id:")) {
                    this.fetchItems({command: ["playlistinfo", "items"], params: params, ismore:true}, item, page);
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
            storeClickOrTouchPos(event, this.menu);
            if (act==ALBUM_SORTS_ACTION || act==TRACK_SORTS_ACTION || act==USE_GRID_ACTION || act==USE_LIST_ACTION) {
                browseHeaderAction(this, act, event, true);
            } else {
                // If this is from 'Radios' scrolled list, try to convert from URL to favourite ID
                if (undefined!=item && item.ihe && item.id.startsWith("radio.")) {
                    lmsCommand("", ["favorites", "exists", item.url]).then(({data}) => {
                        if (data && data.result && 1==parseInt(data.result.exists)) {
                            let copy = JSON.parse(JSON.stringify(item));
                            copy.id = "item_id:"+data.result.index;
                            copy.params = {id: data.result.index};
                            this.baseActions = RADIOS_BASE_ACTIONS;
                            browsePerformAction(this, copy, act);
                            this.baseActions=undefined;
                        } else {
                            browseItemAction(this, act, item, index, event);
                        }
                    }).catch(err => {
                        browseItemAction(this, act, item, index, event);
                    });
                } else {
                    browseItemAction(this, act, item, index, event);
                }
            }
        },
        menuItemAction(act, item, index, event) {
            if (act==SELECT_ACTION && this.searchActive) {
                this.searchActive = 0;
                this.highlightIndex = -1;
            }
            storeClickOrTouchPos(event, this.menu);
            let itm = undefined!=this.current && item.id==this.current.id && item.stdItem==STD_ITEM_MAI ? this.history[this.history.length-1].current : item;
            this.itemAction(act, itm, index, this.menu ? {clientX:this.menu.x, clientY:this.menu.y} : event);
        },
        itemMoreAction(item, index) {
            this.doTextClick(item.moremenu[index], true);
        },
        itemMenu(item, index, event) {
            browseItemMenu(this, item, index, event);
        },
        contextMenu(item, index, event) {
            if (!IS_MOBILE) {
                this.itemMenu(item, index, event);
            }
        },
        showMore(item) {
            if (item.morecmd) {
                let command = JSON.parse(JSON.stringify(item.morecmd));
                browseReplaceCommandTerms(this, command, item);
                this.fetchItems(command, {cancache:false, id:item.id, title: item.title, limit:100});
            } else if (item.allItems) {
                this.addHistory();
                this.items = item.allItems;
                this.headerSubTitle = item.subtitle;
                this.current = item;
                this.searchActive = 0;
                if (item.menu && item.menu.length>0 && item.menu[0]==PLAY_ALL_ACTION) {
                    this.tbarActions=[ADD_ALL_ACTION, PLAY_ALL_ACTION];
                }
                browseSetScroll(this);
            }
        },
        currentActionsMenu(event) {
            if (this.$store.state.visibleMenus.size>0 && undefined!=this.menu && undefined!=this.menu.currentActions) {
                return;
            }
            let actions = [];
            for (let i=0, loop=this.currentActions, len=loop.length; i<len; ++i) {
                if ( (queryParams.party && HIDE_FOR_PARTY.has(loop[i].action)) ||
                     (LMS_KIOSK_MODE && HIDE_FOR_KIOSK.has(loop[i].action)) ||
                     (PLAY_SHUFFLE_ACTION==loop[i].action && (!lmsOptions.playShuffle || (this.wide>=WIDE_MIX_BTN && this.showDetailedSubtoolbar))) ||
                     (INSERT_ACTION==loop[i].action && this.wide>=WIDE_MIX_BTN && this.showDetailedSubtoolbar && !lmsOptions.playShuffle) ||
                     (this.tbarActions.length<2 && (i<(this.tbarActions.length<2 ? 2 : 1))) ||
                     ((ALBUM_SORTS_ACTION==loop[i].action || TRACK_SORTS_ACTION==loop[i].action) && this.items.length<2) ||
                     ((ALBUM_SORTS_ACTION==loop[i].action || ADD_RANDOM_ALBUM_ACTION==loop[i].action) && this.current && this.current.stdItem==STD_ITEM_WORK) ||
                     (SCROLL_TO_ACTION==loop[i].action &&
                        (!this.items[0].id.startsWith(FILTER_PREFIX) ||
                         (this.items.length < (this.grid.allowed && this.grid.use ? (this.grid.numColumns*10) : 50) ) ) ) ||
                     (((loop[i].stdItem==STD_ITEM_MAI && this.showMaiButton) || (loop[i].stdItem==STD_ITEM_MIX && this.wide>=WIDE_MIX_BTN)) && this.showDetailedSubtoolbar) ||
                     (loop[i].action==DIVIDER && (0==actions.length || actions[actions.length-1].action==DIVIDER))) {
                    continue;
                }
                if (loop[i].action>-0 && undefined!=document.getElementById("tbar-actions"+loop[i].action)) {
                    // With detailed sub-toolbar sometime we show 'Play', and have 'Play Shuffled' instead of 'Append to queue'.
                    // This is not in currentActions, so its now missing. Therefore, if we have a 'Play Shuffled' toolbutton
                    // visible but not a 'Append to queue' button - add 'Append to queue' where 'Play shuffled' would have ben
                    // in menu.
                    if (loop[i].action==PLAY_SHUFFLE_ACTION && undefined==document.getElementById("tbar-actions"+ADD_ACTION)) {
                        actions.push({action:ADD_ACTION});
                    }
                    continue;
                }
                actions.push(loop[i]);
            }
            showMenu(this, {show:true, currentActions:actions, x:event.clientX, y:event.clientY});
        },
        doContext(type) {
            for (let i=0, loop=this.currentActions, len=loop.length; i<len; ++i) {
                if (loop[i].stdItem==type) {
                    this.currentAction(loop[i]);
                    return;
                }
            }
        },
        currentAction(act, index, event) {
            storeClickOrTouchPos(event, this.menu);
            let stdItem = this.current ? (this.current.stdItem ? this.current.stdItem : this.current.altStdItem) : undefined;
            let item = undefined!=this.current && stdItem==STD_ITEM_MAI ? this.history[this.history.length-1].current : this.current;
            if (undefined!=act.action) {
                browseHeaderAction(this, act.action, event)
            } else if (act.isListItemInMenu) {
                this.click(act);
            } else if (act.albumRating) {
                this.setAlbumRating();
            } else if (act.custom) {
                let browseCmd = performCustomAction(act, this.$store.state.player, item);
                if (undefined!=browseCmd) {
                    this.fetchItems(browseCmd, {cancache:false, id:"currentaction:"+index, title:act.title+SEPARATOR+item.title});
                }
            } else if (undefined!=act.do) {
                let title = item.origTitle ? item.origTitle : item.title;
                let origTitle = (act.stdItem==STD_ITEM_ALL_TRACKS || act.stdItem==STD_ITEM_COMPOSITION_TRACKS || act.stdItem==STD_ITEM_CLASSICAL_WORKS ? undefined : (item.noReleaseGrouping ? title.split(SEPARATOR)[0] : title));
                let command = act.stdItem==STD_ITEM_ALL_TRACKS || act.stdItem==STD_ITEM_COMPOSITION_TRACKS || act.stdItem==STD_ITEM_CLASSICAL_WORKS || act.stdItem==STD_ITEM_ARTIST ? browseReplaceCommandTerms(this, act.do, item) : act.do;

                // If navigating via a user-defined role can go artist->guitarist->vocals->guitarist->vocals, etc, and don't want a massive history!
                if (undefined!=act.udr && this.history.length>0) {
                    for (let loop=this.history, i=loop.length-1; i>=0; --i) {
                        if (undefined!=loop[i].command && undefined!=loop[i].command.command && undefined!=loop[i].command.params && arraysEqual(loop[i].command.command, command.command) && arraysEqual(loop[i].command.params, command.params)) {
                            this.goTo(i);
                            break;
                        }
                    }
                }

                this.fetchItems(command,
                                {cancache:false, id:"currentaction:"+index, title:act.udr && origTitle ? origTitle : act.title+(origTitle ? SEPARATOR+origTitle : ""), subtitle:act.subtitle, origTitle:origTitle,
                                 image:act.stdItem ? this.currentImage : undefined, stdItem:act.stdItem});
                if (STD_ITEM_MAI==act.stdItem) {
                    browseFetchExtra(this, act.do.command[1]=="biography");
                }
            } else {
                var cmd = {command:["browseonlineartist", "items"], params:["service_id:"+act.id, "artist_id:"+act.artist_id, "menu:1"]};
                this.fetchItems(cmd, {cancache:false, id:act.id, title:act.title+SEPARATOR+item.title, command:cmd.command, params:cmd.params});
            }
        },
        itemCustomAction(act, item, index) {
            let browseCmd = performCustomAction(act, this.$store.state.player, item);
            if (undefined!=browseCmd) {
                this.fetchItems(browseCmd, {cancache:false, id:"itemCustomAction:"+item.id+"-"+index, title:act.title+SEPARATOR+item.title});
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
            storeClickOrTouchPos(event, this.menu);
            if (this.selection.size>0) {
                this.select(item, index, event);
                return;
            }
            if ((IS_MOBILE && !lmsOptions.touchLinks) && this.grid.allowed && this.grid.use) {
                this.itemMenu(item, index, event);
            } else if ((!IS_MOBILE || lmsOptions.touchLinks) && this.subtitlesClickable && item.id && item.artist_id && item.id.startsWith("album_id:")) {
                if (item.subIsYear) {
                    bus.$emit("browse", "year", item.subtitle, item.subtitle, "browse");
                    return;
                }
                browseItemAction(this, GOTO_ARTIST_ACTION, item, null, event);
            } else {
                this.click(item, index, event);
            }
        },
        showHistory(event) {
            if (this.history.length>0) {
                let history=[];
                for (let i=0, loop=this.history, len=loop.length; i<len; ++i) {
                    let hi = {title:0==i ? i18n("Home") : (loop[i].headerTitle + (loop[i].current && loop[i].current.stdItem==STD_ITEM_ALBUM && loop[i].current.subIsYear ? " (" + loop[i].current.subtitle + ")" : "") )};
                    if (undefined!=loop[i].historyExtra) {
                        hi.title += SEPARATOR + loop[i].historyExtra;
                    }
                    if (0==i) {
                        hi.icon = 'home';
                    } else if (undefined!=loop[i].current) {
                        hi.svg = loop[i].current.svg;
                        hi.icon = undefined==loop[i].current.icon && 'search'==loop[i].current.type ? 'search' : loop[i].current.icon;
                        hi.image = loop[i].current.image;
                    }
                    history.push(hi);
                }
                showMenu(this, {show:true, x:event.clientX, y:event.clientY, history:history});
            }
        },
        showLibMenu(event, index) {
            lmsList("", ["libraries"]).then(({data}) => {
                if (data && data.result && data.result.folder_loop && data.result.folder_loop.length>0) {
                    var libraries = [];
                    for (var i=0, len=data.result.folder_loop.length; i<len; ++i) {
                        data.result.folder_loop[i].name = data.result.folder_loop[i].name.replace(SIMPLE_LIB_VIEWS, "");
                        libraries.push(data.result.folder_loop[i]);
                    }
                    libraries.sort(nameSort);
                    libraries.unshift({name: i18n("All"), id:LMS_DEFAULT_LIBRARY});
                    showMenu(this, {show:true, x:event.clientX, y:event.clientY, libraries:libraries, index:index});
                }
            });
        },
        selectLibrary(id) {
            this.$store.commit('setLibrary', id);
            if (this.isTop) {
                this.getHomeExtra();
            }
        },
        deleteLibrary(lib) {
            confirm(i18n("Delete '%1'?", lib.name)+addNote(i18n("This will remove the 'virtual library', but will not delete the actual music files contained within.")), i18n('Delete')).then(res => {
                if (res) {
                    lmsCommand("", ["material-skin", "delete-vlib", "id:"+lib.id]).then(({data}) => {
                        if (this.$store.state.library==lib.id) {
                            this.$store.commit('setLibrary', LMS_DEFAULT_LIBRARY);
                            if (this.isTop) {
                               this.getHomeExtra();
                            }
                        }
                    });
                }
            });
        },
        headerAction(act, event) {
            storeClickOrTouchPos(event, this.menu);
            browseHeaderAction(this, act, event);
        },
        changeLayout(useGrid) {
            if (!this.grid.allowed) {
                useGrid = false;
            }
            if (this.grid.use!=useGrid) {
                this.grid.use=useGrid;
                this.$nextTick(function () {
                    this.setBgndCover();
                    this.layoutGrid(true);
                    if (this.$store.state.gridPerView) {
                        setUseGrid(gridCommand(this), this.grid.use, this.current);
                    } else {
                        setLocalStorageVal('grid', useGrid);
                    }
                    this.setLayoutAction();
                    this.$forceUpdate();
                    // Scroll to top. Without this, on iPad with iOS12 at least, grid->list scroll becomes slugish.
                    // But if user clicks on jumplist (which would call setScrollTop) then scrolling improves???
                    setScrollTop(this, 0);
                });
            }
        },
        setLayoutAction() {
            var af = this.grid.use ? USE_GRID_ACTION : USE_LIST_ACTION;
            var at = this.grid.use ? USE_LIST_ACTION : USE_GRID_ACTION;
            for (var i=0, loop=this.currentActions, len=loop.length; i<len; ++i) {
                if (loop[i].action == af) {
                    loop[i].action = at;
                    break;
                }
            }
        },
        refreshList(restorePosition) {
            if (this.isTop) {
                if (this.$store.state.detailedHome>0) {
                    this.getHomeExtra();
                }
                return;
            }
            this.clearSelection();
            // Only need to reload   list if we had one already...
            var refreshWorks = this.items.length>0 && this.items[0].isWorksCat;
            var pos = undefined==restorePosition || restorePosition ? this.scrollElement.scrollTop : 0;
            var stdItem = this.current ? (this.current.stdItem ? this.current.stdItem : this.current.altStdItem) : undefined;
            var count = stdItem==STD_ITEM_PLAYLIST ? this.items.length : LMS_BATCH_SIZE;
            this.fetchingItem = this.current.id;
            // Slow to load large playlists, so limit refresh length for these...
            if (stdItem==STD_ITEM_PLAYLIST && count>LMS_MAX_PLAYLIST_EDIT_SIZE) {
                return;
            }
            lmsList(this.playerId(), this.command.command, this.command.params, 0, count, this.current.cancache).then(({data}) => {
                var resp = parseBrowseResp(data, this.current, this.options, this.current.cancache && browseCanUseCache(this) ? cacheKey(this.command.command, this.command.params, 0, LMS_BATCH_SIZE) : undefined);
                this.items=resp.items;
                this.listSize=resp.listSize;
                this.jumplist=resp.jumplist;
                this.filteredJumplist = [];
                this.layoutGrid(true);
                if (resp.subtitle) {
                    this.headerSubTitle = resp.subtitle;
                    this.detailedSubInfo = resp.plainsubtitle ? resp.plainsubtitle : resp.years ? resp.years : "&nbsp;";
                } else {
                    this.headerSubTitle=0==this.items.length ? i18n("Empty") : i18np("1 Item", "%1 Items", this.items.length);
                }
                this.$nextTick(function () {
                    setScrollTop(this, pos>0 ? pos : 0);
                    this.filterJumplist();
                });
                this.fetchingItem = undefined;
                if (refreshWorks) {
                    browseAddWorks(this, this.current);
                }
            }).catch(err => {
                logAndShowError(err, undefined, this.command.command, this.command.params);
                this.fetchingItem = undefined;
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
        closeSearch() {
            this.goBack();
        },
        backBtnPressed(longPress) {
            if (this.$store.state.visibleMenus.size<1) {
                this.backBtnPressTime = new Date().getTime(); // See sourcesClicked
                if (longPress || (undefined!=this.lastBackBtnPress && (this.backBtnPressTime-this.lastBackBtnPress)<=LMS_DOUBLE_CLICK_TIMEOUT)) {
                    this.goHome();
                } else {
                    this.goBack();
                }
                this.lastBackBtnPress = this.backBtnPressTime;
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
                            this.libraryName=LMS_DEFAULT_LIBRARIES.has(""+loop[i]) ? i18n("All") : loop[i].name.replace(SIMPLE_LIB_VIEWS, "");
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
            this.myMusic.sort(weightSort);
            for (var i=0, len=this.myMusic.length; i<len; ++i) {
                this.myMusic[i].menu=[this.options.pinned.has(this.myMusic[i].id) ? UNPIN_ACTION : PIN_ACTION];
            }
            if (this.current && TOP_MYMUSIC_ID==this.current.id) {
                this.items = this.myMusic;
                this.grid = {allowed:true, use:this.$store.state.gridPerView ? isSetToUseGrid(GRID_OTHER) : getLocalStorageBool('grid', true), numItems:0, numColumns:0, ih:GRID_MIN_HEIGHT, rows:[], few:false, haveSubtitle:true, multiSize:false, type:GRID_STANDARD};
                this.tbarActions=[];
                this.currentActions=[{action:VLIB_ACTION}, {action:(this.grid.use ? USE_LIST_ACTION : USE_GRID_ACTION)}, {action:SEARCH_LIB_ACTION}];
                this.layoutGrid(true);
            } else if (this.history.length>1 && this.history[1].current && this.history[1].current.id==TOP_MYMUSIC_ID) {
                this.history[1].items = this.myMusic;
            }
        },
        updateTopList(items) {
            let updated = false;
            let extras = undefined;
            for (let i=0, len=this.top.length; i<len && undefined==extras; ++i) {
                if (this.top[i].id==TOP_EXTRAS_ID) {
                    extras = this.top[i];
                }
            }
            this.top=[];
            lmsOptions.randomMixDialogPinned = false;
            for (let i=0, len=items.length; i<len; ++i) {
                if (items[i].id==TOP_CDPLAYER_ID || items[i].id==TOP_REMOTE_ID) {
                    updated = true; // No longer show CD Player, or Remote Libraries, so want list saved to remove this
                } else {
                    this.top.push(items[i]);
                    if (items[i].id==START_RANDOM_MIX_ID) {
                        lmsOptions.randomMixDialogPinned = true;
                    }
                }
            }
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
            if (updated) {
                this.saveTopList();
            }
        },
        saveTopList() {
            setLocalStorageVal("topItems", JSON.stringify(this.top));
            removeLocalStorage("pinned");
            bus.$emit('homeScreenItems', this);
        },
        addPinned(pinned) {
            browseAddPinned(this, pinned);
        },
        pin(item, add, mapped) {
            browsePin(this, item, add, mapped);
        },
        invertSelection() {
            if (this.selection.size==this.items.length) {
                this.clearSelection();
                return;
            }
            this.selection = new Set();
            this.selectionDuration = 0;
            for (var i=0, len=this.items.length; i<len; ++i) {
                let item = this.items[i];
                if (!item.header && browseCanSelect(item)) {
                    if (item.selected) {
                        item.selected = false;
                    } else {
                        this.selection.add(i);
                        item.selected = true;
                        this.selectionDuration += itemDuration(item);
                    }
                }
            }
        },
        clearSelection() {
            var selection = Array.from(this.selection);
            var numSelected = selection.length;
            for (var i=0, len=numSelected; i<len; ++i) {
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
            this.selectionDuration = 0;
            this.lastSelect = undefined;
            bus.$emit('browseSelection', false);
            if (numSelected>0) {
                refreshViewItems(this);
            }
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
        deleteSelectedItems(act, event) {
            storeClickOrTouchPos(event, this.menu);
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
        actionSelectedItems(act, event) {
            storeClickOrTouchPos(event, this.menu);
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
        doList(list, act, index) {
            browseDoList(this, list, act, index);
        },
        handleScroll() {
            this.menu.show = false;
            if (undefined==this.scrollAnim) {
                this.scrollAnim = requestAnimationFrame(() => {
                    this.scrollAnim = undefined;
                    if (undefined!=this.current && STD_ITEM_PLAYLIST==(this.current.stdItem ? this.current.stdItem : this.current.altStdItem)) {
                        // Fetch more items?
                        if (undefined!=this.fetchingItem || this.listSize<=this.items.length) {
                            return;
                        }
                        const scrollY = this.scrollElement.scrollTop;
                        const visible = this.scrollElement.clientHeight;
                        const pageHeight = this.scrollElement.scrollHeight;
                        const pad = (visible*2.5);
                        const bottomOfPage = (visible + scrollY) >= (pageHeight-(pageHeight>pad ? pad : 300));

                        if (bottomOfPage || pageHeight < visible) {
                            this.fetchItems(this.command, this.current, undefined, this.items.length);
                        }
                    }
                });
            }
            msHandleScrollEvent(this);
        },
        calcSizes(quantity, listWidth, maxItemWidth, adjust) {
            var width = (this.grid.type == GRID_ICON_ONLY_ONLY ? GRID_MIN_WIDTH_NARROW_ICON_ONLY : window.innerWidth<=NARROW_WIDTH ? GRID_MIN_WIDTH_NARROW : GRID_MIN_WIDTH)-adjust;
            var height = (this.grid.type == GRID_ICON_ONLY_ONLY ? GRID_MIN_HEIGHT_NARROW_ICON_ONLY : window.innerWidth<=NARROW_WIDTH ? GRID_MIN_HEIGHT_NARROW : GRID_MIN_HEIGHT)-adjust;
            var steps = 0;
            if (0!=quantity) {
                while (listWidth>=((width+GRID_STEP)*quantity) && (width+GRID_STEP)<=maxItemWidth) {
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
            if (!this.grid.allowed || !this.grid.use) {
                return;
            }
            const LEFT_PADDING = 4;
            const RIGHT_PADDING = 4;
            var changed = false;
            var haveSubtitle = false;
            var thisWidth = this.$store.state.desktopLayout ? this.pageElement.scrollWidth : window.innerWidth;
            var listWidth = thisWidth - ((/*scrollbar*/ IS_MOBILE ? 0 : 20) + (/*this.filteredJumplist.length>1 && this.items.length>10 ? */JUMP_LIST_WIDTH/* :0*/) + LEFT_PADDING + RIGHT_PADDING);
            var sz = undefined;
            let type = this.grid.type;
            if (GRID_TEXT_ONLY == this.grid.type) {
                var width = this.items.length>0 && this.items[0].stdItem==STD_ITEM_GENRE ? 150 : 100;
                var height = 64;
                var maxColumns = Math.floor(listWidth / width);
                var numColumns = Math.max(Math.min(maxColumns, 20), 1);
                var extra = Math.floor(((listWidth - (width*numColumns))/numColumns)/5);
                sz = {w: width+(extra*5), h: height, s:extra, mc:maxColumns, nc:numColumns};
            } else {
                let iconOnly = this.isTop || this.items.length<=200;
                if (iconOnly && !this.isTop) {
                    for (let i=0, len=this.items.length; i<len && iconOnly; ++i) {
                        // ihe == is home extra item (e.g recentply layed list, etc...)
                        if (undefined==this.items[i].ihe && undefined==this.items[i].icon && undefined==this.items[i].svg) {
                            iconOnly = false;
                        }
                    }
                }
                let smallIconOnly = iconOnly && lmsOptions.smallIconOnlyGrid && window.innerWidth<=440;
                var GRID_MAX_WIDTH = smallIconOnly
                                          ? 100 :
                                       window.innerWidth>3500
                                          ? (iconOnly ? 255 : 283) :
                                       window.innerWidth>2500
                                          ? (iconOnly ? 210 : 233) :
                                       window.innerWidth>1750
                                          ? (iconOnly ? 190 : 208) :
                                            (iconOnly ? 165 : 183) ;
                var preferredColumns = smallIconOnly ? 3 : 4;
                this.grid.type = smallIconOnly ? GRID_ICON_ONLY_ONLY : GRID_STANDARD;
                for (var i=preferredColumns; i>=1; --i) {
                    sz = this.calcSizes(i, listWidth, GRID_MAX_WIDTH, 0);
                    if (sz.mc>=i) {
                        break;
                    }
                }
                if (sz.nc==1) {
                    var altsz = this.calcSizes(2, listWidth, GRID_MAX_WIDTH, 2*GRID_STEP);
                    if (altsz.nc>sz.nc) {
                        sz=altsz;
                    }
                }
            }
            if (force || sz.nc != this.grid.numColumns || type!=this.grid.type) { // Need to re-layout...
                changed = true;
                this.grid.rows = [];
                this.grid.multiSize = false;
                var items = [];
                var topExtraItems = [];
                if (this.isTop) {
                    for (var i=0, len=this.items.length; i<len; ++i) {
                        if (undefined!=this.items[i].ihe) {
                            topExtraItems.push(this.items[i]);
                        } else if (!this.disabled.has(this.items[i].id) && !(this.hidden.has(this.items[i].id)  || (this.items[i].id==TOP_RADIO_ID && lmsOptions.combineAppsAndRadio)) && (!queryParams.party || !HIDE_TOP_FOR_PARTY.has(this.items[i].id))) {
                            items.push(this.items[i]);
                        }
                        this.items[i].gidx = i;
                    }
                } else {
                    items=this.items;
                }
                this.grid.numItems=items.length+topExtraItems.length;
                let rs = 0;
                let row = 0;
                for (var i=0, len=topExtraItems.length; i<len; ++row) {
                    var rowHasSubtitle = false;
                    var rowItems=[];
                    if (i<topExtraItems.length && topExtraItems[i].header) {
                        this.grid.multiSize=true;
                        this.grid.rows.push({item: topExtraItems[i], header:true, size:48, r:row, id:"row.extra.header."+i, rs:rs, ihe:true});
                        i+=1;
                        rs+=1;
                    } else {
                        let used = 0;
                        for (var j=0; j<10; ++j) {
                            var idx = i+j;
                            if (idx<topExtraItems.length && topExtraItems[idx].header) {
                                break;
                            } else {
                                rowItems.push(idx<topExtraItems.length ? topExtraItems[idx] : undefined);
                                let haveSub = idx<topExtraItems.length && topExtraItems[idx].subtitle;
                                if (haveSub) {
                                    haveSubtitle = true;
                                    rowHasSubtitle = true;
                                }
                                used++;
                            }
                        }
                        this.grid.rows.push({id:"row."+row+"."+sz.nc, items:rowItems, r:row, rs:rs, size:(rowHasSubtitle ? sz.h : (sz.h - GRID_SINGLE_LINE_DIFF))+(IS_MOBILE ? 0 : 10)+8, numStd:used, hasSub:rowHasSubtitle, ihe:true});
                        i+=used;
                        rs+=used;
                    }
                }
                for (var i=0, len=items.length; i<len; ++row) {
                    var rowHasSubtitle = this.isTop; // Always allow for subtitle with home items to make space for virtual library name
                    var rowItems=[];
                    if (i<items.length && items[i].header) {
                        this.grid.multiSize=true;
                        if (this.grid.type!=GRID_TEXT_ONLY && this.grid.rows.length>0 && !this.grid.rows[this.grid.rows.length-1].hasSub && !this.grid.rows[this.grid.rows.length-1].ihe) {
                            this.grid.rows.push({spacer:true, size:24, id:"row.extra.spacer."+i, ihe:true, rs:rs});
                        }
                        this.grid.rows.push({item: items[i], header:true, size:48, r:row, id:"row.header."+i, rs:rs});
                        i+=1;
                        rs+=1;
                    } else {
                        let used = 0;
                        for (var j=0; j<sz.nc; ++j) {
                            var idx = i+j;
                            if (idx<items.length && items[idx].header) {
                                for (; j<sz.nc; ++j) {
                                    rowItems.push(undefined);
                                }
                                break;
                            } else {
                                rowItems.push(idx<items.length ? items[idx] : undefined);
                                if (GRID_TEXT_ONLY != this.grid.type) {
                                    let haveSub = idx<items.length && items[idx].subtitle;
                                    if (haveSub) {
                                        haveSubtitle = true;
                                        rowHasSubtitle = true;
                                    }
                                }
                                used++;
                            }
                        }
                        if (GRID_TEXT_ONLY == this.grid.type) {
                            this.grid.rows.push({id:"row."+row+"."+sz.nc, items:rowItems, r:row, rs:rs, size:this.grid.multiSize ? sz.h : undefined, numStd:used, hasSub:undefined});
                        } else {
                            this.grid.rows.push({id:"row."+row+"."+sz.nc, items:rowItems, r:row, rs:rs, size:this.grid.multiSize ? (rowHasSubtitle ? sz.h : (sz.h - GRID_SINGLE_LINE_DIFF)) : undefined, numStd:used, hasSub:this.grid.multiSize ? rowHasSubtitle : undefined});
                        }
                        i+=used;
                        rs+=used;
                    }
                }
                this.grid.numColumns = sz.nc;
            } else { // Need to check if have subtitles...
                for (var i=0; i<this.items.length && !haveSubtitle; ++i) {
                    if (this.items[i].subtitle) {
                        haveSubtitle = true;
                    }
                }
                if (this.grid.multiSize && this.grid.ih != sz.h) {
                    for (let list = this.grid.rows, i=0, len=list.length; i<len; ++i) {
                        if (!list[i].header) {
                            list[i].size = list[i].hasSub ? sz.h : (sz.h - GRID_SINGLE_LINE_DIFF);
                        }
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
            var count = 0==this.grid.numItems ? this.items.length : this.grid.numItems;
            var few = 1==this.grid.rows.length && (1==count || ((count*sz.w)*1.3333)<listWidth);
            // For multi, we need to check the count of each section.
            if (!few && this.grid.multiSize && (sz.nc*sz.w)<(listWidth*0.6)) {
                few = true;
                let startOfItems = 0;
                if (this.grid.rows[0].header && this.grid.rows[0].ihe) {
                    for (let loop=this.grid.rows, len=loop.length; startOfItems<len; ++startOfItems) {
                        if (!loop[startOfItems].ihe) {
                            break;
                        }
                    }
                }
                for (let r=startOfItems, loop=this.grid.rows, len=loop.length; r<len; ++r) {
                    if (!loop[r].header && ((loop[r].items.length*sz.w)*1.3333)>=listWidth) {
                        few = false;
                        break;
                    }
                }
            }
            // Hacky work-around. Noticed sometimes if we only have 1 grid row then *only* that row's background is blurred???
            if (1==this.grid.rows.length) {
                let prev = this.grid.rows[0];
                this.grid.rows.push({id:"row.dummy."+(this.current ? this.current.id : "x"), items:[], r:prev.r+1, rs:prev.rs, size:prev.size, numStd:0, hasSub:false});
            }
            if (this.grid.few != few) {
                this.grid.few = few;
                changed = true;
            }
            if (changed) {
                this.$forceUpdate();
            }
        },
        setBgndCover() {
            var url = this.bgndUrl;
            if (url) {
                url=changeImageSizing(url, LMS_IMAGE_SIZE);
                document.documentElement.style.setProperty('--subtoolbar-image-url', 'url(' + changeImageSizing(url, LMS_TBAR_BGND_IMAGE_SIZE) + ')');
            } else {
                var img = this.currentImageUrl;
                if (img) {
                    document.documentElement.style.setProperty('--subtoolbar-image-url', 'url(' + changeImageSizing(img, LMS_TBAR_BGND_IMAGE_SIZE) + ')');
                } else {
                    document.documentElement.style.setProperty('--subtoolbar-image-url', 'url()');
                }
                if (this.drawBackdrop) {
                    url='material/backdrops/browse.jpg';
                }
            }
            if (undefined==url || url.endsWith(DEFAULT_COVER) || url.endsWith("/music/undefined/cover")) {
                url = "";
            }
            updateBgndImage(this, url);
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
        jumpTo(index) {
            let pos = 0;
            if (this.grid.allowed && this.grid.use && this.items.length>0 && this.grid.multiSize) {
                for (let r=0, loop=this.grid.rows, len=loop.length-1; r<len && loop[r+1].rs<=index; ++r) {
                    pos += loop[r].size;
                }
            } else if (this.grid.allowed && this.grid.use && this.grid.numColumns>0) {
                pos = Math.floor(index/this.grid.numColumns)*(this.grid.ih-(this.grid.haveSubtitle || GRID_TEXT_ONLY==this.grid.type ? 0 : GRID_SINGLE_LINE_DIFF));
            } else {
                let elems = getElementsByClassName(this.scrollElement, "div", "lms-list-item");
                let itemSize = LMS_LIST_ELEMENT_SIZE;
                if (undefined!=elems && elems.length>0) {
                    itemSize = elems[0].getBoundingClientRect().height;
                }
                pos = index*itemSize;
            }
            setScrollTop(this, pos>0 ? pos : 0);
        },
        highlightItem(index) {
            this.highlightIndex = index;
            if (index>=0 && index<this.items.length) {
                this.jumpTo(index);
            }
        },
        filterJumplist() {
            let prev = getComputedStyle(document.body).getPropertyValue('--jump-list-adjust');
            if (this.items.length>25 && this.items.length==this.listSize && undefined!=this.jumplist && this.jumplist.length>1) {
                if (this.jumplist.headerOnly && this.items.length>(this.jumplist.length*5)) {
                    this.filteredJumplist = this.jumplist;
                } else if (!this.jumplist.headerOnly && this.jumplist.length>=4) {
                    let maxItems = Math.floor((this.scrollElement.clientHeight-(16))/20);
                    this.filteredJumplist = shrinkJumplist(this.jumplist, maxItems, this.items.length);
                }
            }
            let now = (undefined!=this.jumplist && undefined!=this.filteredJumplist && this.filteredJumplist.length>1 ? JUMP_LIST_WIDTH : 0)+'px';
            if (prev!=now) {
                document.documentElement.style.setProperty('--jump-list-adjust', now);
            }
        },
        dragStart(which, ev) {
            if (undefined==which || queryParams.party || (LMS_KIOSK_MODE && HIDE_FOR_KIOSK.has(ADD_TO_FAV_ACTION)) ||
                (!this.$store.state.desktopLayout && this.items[0].stdItem==STD_ITEM_PLAYLIST_TRACK && this.listSize>LMS_MAX_PLAYLIST_EDIT_SIZE) ||
                ((!this.$store.state.desktopLayout || !this.$store.state.showQueue) && !this.canDrop) ||
                // For some reason drag is accessible in 'My Music'??? The following stops this...
                (this.grid.allowed && this.grid.use && !this.isTop && !this.items[which].draggable)) {
                ev.preventDefault();
                ev.stopPropagation();
                return;
            }
            bus.$emit('dragActive', true);
            ev.dataTransfer.dropEffect = 'move';
            ev.dataTransfer.setData('text/plain', this.items[which].title);
            window.mskBrowseDrag=which;
            if (this.grid.allowed && this.grid.use) {
                this.dragElem = ev.target.nodeName=='IMG' ? ev.srcElement.parentNode.parentNode : ev.srcElement;
                setListElemClass(this.dragElem, 'dragging', true);
                ev.dataTransfer.setDragImage(this.dragElem, 0, 0);
            } else {
                this.dragElem = ev.target.nodeName=='IMG' ? ev.srcElement.parentNode.parentNode.parentNode : ev.srcElement;
                setListElemClass(this.dragElem, 'dragging', true);
                ev.dataTransfer.setDragImage(this.dragElem, 0, 0);
            }
            this.dragIndex = which;
            this.stopScrolling = false;
            if (this.selection.size>0 && (!this.selection.has(which) || this.current.isFavFolder)) {
                this.clearSelection();
            }
        },
        dragEnd() {
            setListElemClass(this.dragElem, 'dragging', false);
            this.dragElem = undefined;
            this.stopScrolling = true;
            this.dragIndex = undefined;
            this.dropIndex = -1;
            window.mskBrowseDrag = undefined;
            // Delay setting drag inactive so that we ignore a potential 'Esc' that cancelled drag
            setTimeout(function () { bus.$emit('dragActive', false); }.bind(this), 250);
        },
        dragOver(index, ev) {
            if (index!=this.dropIndex && undefined!=index) {
                if (this.items[0].stdItem==STD_ITEM_PLAYLIST_TRACK && this.listSize>LMS_MAX_PLAYLIST_EDIT_SIZE) {
                    return;
                }
                if ( ((this.canDrop && undefined!=window.mskBrowseDrag) || (undefined!=window.mskQueueDrag && this.current.section==SECTION_PLAYLISTS)) &&
                (!this.current || !this.current.isFavFolder || !this.options.sortFavorites || this.items[index].isFavFolder)) {
                    this.dropIndex = index;
                    // Drag over item at top/bottom of list to start scrolling
                    this.stopScrolling = true;
                    if (ev.clientY < (queryParams.topPad + 110)) {
                        this.stopScrolling = false;
                        this.scrollList(-5)
                    }

                    let distance = 28 + queryParams.botPad + this.queueEmpty ? 0 :
                        (this.$store.state.desktopLayout
                            ? 72
                            : (52 +
                                (this.$store.state.mobileBar==MBAR_NONE
                                    ? 0
                                    : this.$store.state.mobileBar==MBAR_THIN
                                        ? 22
                                        : this.$store.state.mobileBar==MBAR_THICK
                                        ? 48
                                            : 0)));
                    if (ev.clientY > (window.innerHeight - distance)) {
                        this.stopScrolling = false;
                        this.scrollList(5)
                    }
                } else {
                    this.dropIndex = undefined;
                }
            }
            ev.preventDefault(); // Otherwise drop is never called!
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
            bus.$emit('dragActive', false);
            if (this.dragIndex!=undefined && to!=this.dragIndex) {
                var item = this.items[this.dragIndex];
                if (this.isTop || (this.current && (this.current.section==SECTION_FAVORITES || (this.current.section==SECTION_PLAYLISTS && item.stdItem==STD_ITEM_PLAYLIST_TRACK)))) {
                    var sel = Array.from(this.selection);
                    this.clearSelection();
                    if (sel.length>0) {
                        if (this.current.section!=SECTION_FAVORITES && sel.indexOf(to)<0) {
                            bus.$emit('movePlaylistItems', this.current.id, sel.sort(function(a, b) { return a<b ? -1 : 1; }), to);
                            if (lmsOptions.playlistImages && this.history.length>0) {
                                this.history[this.history.length-1].needsRefresh = true;
                            }
                        }
                    } else if (this.isTop) {
                        let drgIdx = this.dragIndex;
                        if (undefined!=this.items[0].ihe) {
                            to-=this.topExtra.length;
                            drgIdx-=this.topExtra.length;
                        }
                        this.top = arrayMove(this.top, drgIdx, to);
                        this.items = this.$store.state.detailedHome>0 ? this.topExtra.concat(this.top) : this.top;
                        this.saveTopList();
                        this.layoutGrid(true);
                    } else if (this.current) {
                        if (this.current.section==SECTION_FAVORITES) {
                            if (this.$store.state.sortFavorites && !this.items[to].isFavFolder) {
                                return;
                            }
                            var fromId = originalId(this.items[this.dragIndex].id.startsWith("item_id:")
                                            ? this.items[this.dragIndex].id.replace("item_id:", "from_id:")
                                            : "from_id:"+this.items[this.dragIndex].params.item_id);
                            var toId =originalId( this.items[to].id.startsWith("item_id:")
                                            ? this.items[to].id.replace("item_id:", "to_id:")
                                            : "to_id:"+this.items[to].params.item_id);
                            if (this.items[to].isFavFolder) {
                                if (this.$store.state.sortFavorites) {
                                    lmsCommand(this.playerId(), ["favorites", "move", fromId, toId+".0"]).then(({data}) => {
                                        this.refreshList();
                                    });
                                } else {
                                    let choices = [
                                        {val:1, title:i18n("Move into '%1'", this.items[to].title), svg:"folder-favorite"},
                                        {val:2, title:i18n("Move position"), icon:ACTIONS[SCROLL_TO_ACTION].icon, svg:ACTIONS[SCROLL_TO_ACTION].svg}
                                    ]
                                    choose(i18n("Move '%1'", this.items[this.dragIndex].title), choices).then(choice => {
                                        if (undefined!=choice && choice.val>0) {
                                            lmsCommand(this.playerId(), ["favorites", "move", fromId, toId+(1==choice.val ? ".0" : "")]).then(({data}) => {
                                                this.refreshList();
                                            });
                                        }
                                    });
                                }
                            } else {
                                lmsCommand(this.playerId(), ["favorites", "move", fromId, toId]).then(({data}) => {
                                    this.refreshList();
                                });
                            }
                        } else if (this.current.section==SECTION_PLAYLISTS) {
                            lmsCommand(this.playerId(), ["playlists", "edit", "cmd:move", originalId(this.current.id), "index:"+this.dragIndex, "toindex:"+to]).then(({data}) => {
                                this.refreshList();
                                if (lmsOptions.playlistImages && this.history.length>0) {
                                    this.history[this.history.length-1].needsRefresh = true;
                                }
                            });
                        }
                    }
                }
            } else if (ev.dataTransfer) {
                if (undefined!=window.mskQueueDrag && this.current.section==SECTION_PLAYLISTS) {
                    if (this.current.id.startsWith("playlist_id")) {
                        browseAddToPlaylist(this, window.mskQueueDrag, originalId(this.current.id), to, this.items.length);
                    } else {
                        browseAddToPlaylist(this, window.mskQueueDrag, originalId(this.items[to].id));
                    }
                }
            }
            this.dragIndex = undefined;
        },
        setWide() {
            let viewWidth = this.$store.state.desktopLayout ? this.pageElement.scrollWidth : window.innerWidth;
            this.wide = viewWidth>=MIN_WIDTH_FOR_BOTH_INDENT
                            ? WIDE_BOTH
                            : viewWidth>=MIN_WIDTH_FOR_COVER_INDENT
                                ? WIDE_COVER_IDENT
                                : viewWidth>=MIN_WIDTH_FOR_MIX_BTN
                                    ? WIDE_MIX_BTN
                                    : viewWidth>=MIN_WIDTH_FOR_COVER
                                        ? WIDE_COVER
                                        : viewWidth>=MIN_WIDTH_INDENT_LEFT
                                            ? WIDE_INDENT_L
                                            : viewWidth>=MIN_WIDTH_FOR_HBTNS
                                                ? WIDE_HBTNS
                                                : viewWidth>=MIN_WIDTH_FOR_DETAILED_SUB
                                                    ? WIDE_DETAILED_SUB
                                                    : WIDE_NONE;
            this.trackWide = viewWidth>=MIN_WIDTH_FOR_TRACK_FOUR
                                ? TRACK_WIDE_FOUR
                                : viewWidth>=MIN_WIDTH_FOR_TRACK_THREE
                                    ? TRACK_WIDE_THREE
                                    : viewWidth>=MIN_WIDTH_FOR_TRACK_TWO
                                        ? TRACK_WIDE_TWO
                                        : TRACK_WIDE_ONE
        },
        textSelectEnd(event) {
            if (!this.current.slimbrowse) { // DynamicPlaylists have a blank line that when double-clicked shows a menu!
                viewHandleSelectedText(this, event);
            }
        },
        allowShuffle(item) {
            if (lmsOptions.playShuffle) {
                if (item.header && undefined!=item.menu && item.menu.length>2 && item.menu[2]==PLAY_SHUFFLE_ALL_ACTION) {
                    return true;
                }
                let itm = item.header ? this.current : item;
                return undefined!=itm && undefined!=itm.stdItem &&
                        (itm.stdItem==STD_ITEM_ARTIST || itm.stdItem==STD_ITEM_ALBUM ||
                         itm.stdItem==STD_ITEM_PLAYLIST || itm.stdItem==STD_ITEM_WORK || itm.stdItem==STD_ITEM_REMOTE_PLAYLIST ||
                         itm.stdItem==STD_ITEM_GENRE || itm.stdItem==STD_ITEM_YEAR ||
                         itm.stdItem==STD_ITEM_ONLINE_ARTIST || itm.stdItem==STD_ITEM_ONLINE_ALBUM);
            }
            return false;
        },
        allowAdd(item) {
            return undefined==item.stdItem || STD_ITEM_RANDOM_MIX!=item.stdItem;
        },
        allowInsert(item) {
            return undefined==item.stdItem || STD_ITEM_RANDOM_MIX!=item.stdItem;
        },
        loadCustomPinned() {
            let actions = getCustomActions("pinned");
            if (undefined!=actions) {
                let customPinned = new Set();
                let lastPinnedIndex = -1;
                for (let i=0, len=this.top.length; i<len; ++i) {
                    if (this.top[i].custom) {
                        customPinned.add(this.top[i].id);
                    }
                    if (!this.top[i].id.startsWith(TOP_ID_PREFIX)) {
                        lastPinnedIndex = i;
                    }
                }
                for (let i=0, len=actions.length; i<len; ++i) {
                    if (actions[i].iframe!=undefined || actions[i].weblink!=undefined) {
                        let id = undefined==actions[i].iframe ? actions[i].weblink : actions[i].iframe;
                        if (!customPinned.has(id)) {
                            this.top.splice(lastPinnedIndex+1, 0,
                                    {id: id, title: actions[i].title, icon: actions[i].icon, svg: actions[i].svg, isPinned: true,
                                     weblink: actions[i].weblink, iframe: actions[i].iframe, menu: [RENAME_ACTION, UNPIN_ACTION], custom: true});
                            lastPinnedIndex++;
                        }
                    }
                }
                if (lastPinnedIndex>=0) {
                    this.layoutGrid(true);
                    this.saveTopList();
                }
            }
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

        bus.$on('langChanged', function() {
            this.initItems();
        }.bind(this));
        this.initItems();
        bus.$on('playerChanged', function() {
            try { browsePlayerChanged(this); } catch (e) {}
        }.bind(this));
        bus.$on('playerStatus', function(playerStatus) {
            this.currentTrack = playerStatus && playerStatus.current ? "track_id:"+playerStatus.current.id : undefined;
        }.bind(this));
        var savedItems = JSON.parse(getLocalStorageVal("topItems", "[]"));
        if (savedItems.length==0) {
            savedItems = JSON.parse(getLocalStorageVal("pinned", "[]"));
            if (savedItems.length==0) {
                lmsCommand("", ["pref", LMS_MATERIAL_DEFAULT_ITEMS_PREF, "?"]).then(({data}) => {
                    if (data && data.result && data.result._p2) {
                        this.updateTopList(JSON.parse(data.result._p2));
                        this.saveTopList();
                        this.autoExpand();
                    } else {
                        lmsCommand("", ["pref", LMS_MATERIAL_DEFAULT_PINNED_PREF, "?"]).then(({data}) => {
                            if (data && data.result && data.result._p2) {
                                this.addPinned(JSON.parse(data.result._p2));
                            }
                            this.autoExpand();
                        }).catch(err => {
                            this.autoExpand();
                        });
                    }
                }).catch(err => {
                    this.autoExpand();
                });
            } else {
                this.addPinned(savedItems);
                this.autoExpand();
            }
        } else {
            this.updateTopList(savedItems);
            this.autoExpand();
        }

        this.nowPlayingExpanded = false; // Keep track so that we know when to ignore 'esc'=>goback
        bus.$on('nowPlayingExpanded', function(val) {
            this.nowPlayingExpanded = val;
        }.bind(this));

        bus.$on('closeMenu', function() {
            this.menu.show = false;
        }.bind(this));

        bus.$on('escPressed', function() {
            if (this.dragActive) {
                return;
            }
            if (this.$store.state.desktopLayout ? !this.nowPlayingExpanded : this.$store.state.page=='browse') {
                if (this.selection.size>0) {
                    this.clearSelection();
                } else if (this.history.length>0) {
                    this.goBack();
                } else {
                    this.$store.commit('setPage', this.$store.state.prevPage);
                }
            }
        }.bind(this));

        bus.$on('browse-home', function() {
            this.goHome();
        }.bind(this));
        bus.$on('browse-action', function(act, idx) {
            if (idx>=0 && idx<this.items.length) {
                this.itemAction(act, this.items[idx], idx, undefined);
            }
        }.bind(this));
        bus.$on('browse-shortcut', function(id) {
            if (this.$store.state.desktopLayout) {
                bus.$emit('npclose');
            } else {
                this.$store.commit('setPage', 'browse');
            }
            if (this.current && id==this.current.id) {
                return;
            }
            this.goHome();
            if (id!='-') {
                for (let i=0, len=this.items.length; i<len; ++i) {
                    if (this.items[i].id==id) {
                        this.$nextTick(function () { this.$nextTick(function () { browseClick(this, this.items[i], i, undefined, true); }) });
                        break;
                    }
                }
            }
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
            this.searchActive = 1;
            this.$nextTick(function () {
                bus.$emit('search-for', text, page);
            });
        }.bind(this));
        bus.$on('browse-pin', function(item, add) {
            browsePin(this, item, add);
        }.bind(this));
        bus.$on('browse', function(cmd, params, title, page, clearHistory, subtitle) {
            browseGoToItem(this, cmd, params, title, page, clearHistory, subtitle);
        }.bind(this));

        bus.$on('refreshList', function(section) {
            if (undefined==section || section==SECTION_PODCASTS || (this.current && this.current.section==section)) {
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
        bus.$on('showLinkMenu.browse', function(x, y, menu) {
            showMenu(this, {linkItems: menu, x:x, y:y, show:true});
        }.bind(this));
        bus.$on('windowHeightChanged', function() {
            this.filterJumplist();
        }.bind(this));
        bus.$on('showQueue', function(val) {
            if (this.$store.state.pinQueue) {
                this.$nextTick(function () { this.layoutGrid(); });
            }
        }.bind(this));

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
            this.goHome();
            if (this.$store.state.detailedHome>0 && this.isTop) {
                this.grid.use = true;
                this.setLayoutAction();
            }
            if (this.$store.state.detailedHome>0 && (this.topExtraCfg.val!=this.$store.state.detailedHome || !arraysEqual(this.topExtraCfg.order, this.$store.state.detailedHomeOrder))) {
                this.getHomeExtra();
            } else {
                this.items = this.$store.state.detailedHome>0 ? this.topExtra.concat(this.top) : this.top;
                this.layoutGrid(true);
            }
        }.bind(this));
        bus.$on('setBgndCover', function() {
           this.setBgndCover();
        }.bind(this));
        bus.$on('libraryChanged', function() {
            this.setLibrary();
        }.bind(this));
        this.setLibrary();

        this.scrollElement = document.getElementById("browse-list");
        this.scrollElement.addEventListener("scroll", this.handleScroll, PASSIVE_SUPPORTED ? { passive: true } : false);
        msRegister(this, this.scrollElement);
        bus.$on('splitterChanged', function() {
            this.setWide();
            this.layoutGrid();
        }.bind(this));
        bus.$on('relayoutGrid', function() {
            this.layoutGrid();
        }.bind(this));
        bus.$on('layoutChanged', function() {
            this.$nextTick(function () {
                this.layoutGrid(true);
            });
        }.bind(this));
        this.setWide();
        setTimeout(function () {
            this.setWide();
            this.tall = window.innerHeight>=MIN_HEIGHT_FOR_DETAILED_SUB ? 1 : 0
        }.bind(this), 1000);
        bus.$on('windowWidthChanged', function() {
            this.setWide();
            this.layoutGrid();
        }.bind(this));
        bus.$on('windowHeightChanged', function() {
            this.tall = window.innerHeight>=MIN_HEIGHT_FOR_DETAILED_SUB ? 1 : 0
        }.bind(this));
        bus.$on('themeChanged', function() {
            this.setBgndCover();
        }.bind(this));
        bus.$on('colorChanged', function(col) {
            this.hRgb = col;
        }.bind(this));
        this.setBgndCover();
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
        this.queueSelection=false;
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
        bus.$on('pin', function(item, add) {
            this.pin(item, add);
        }.bind(this));
    },
    filters: {
        itemTooltip: function (item) {
            if (undefined==item ) {
                return '';
            }
            if (item.title && item.subtitle) {
                return stripTags(item.title)+"\n"+stripTags(item.subtitle);
            }
            return stripTags(item.title);
        },
        displaySelectionCount: function (value) {
            return value ? value : 0;
        },
        svgIcon: function (name, dark, hoverInGrid, header) {
            if (undefined!=hoverInGrid) {
                return "/material/svg/"+name+"?c="+(dark||hoverInGrid ? LMS_DARK_SVG : LMS_LIGHT_SVG)+"&c2="+(dark||hoverInGrid ? "333" : "eee")+"&r="+LMS_MATERIAL_REVISION;
            }
            if (undefined!=header) {
                return "/material/svg/"+name+"?c="+getComputedStyle(document.getElementById("browse-view")).getPropertyValue("--active-color").replace("#", "")+"&r="+LMS_MATERIAL_REVISION;
            }
            return "/material/svg/"+name+"?c="+(dark ? LMS_DARK_SVG : LMS_LIGHT_SVG)+"&r="+LMS_MATERIAL_REVISION;
        },
        indIcon: function (name) {
            return "/material/svg/"+name+"?c="+getComputedStyle(document.documentElement).getPropertyValue("--primary-color").replace("#", "")+"&c2="+LMS_DARK_SVG+"&r="+LMS_MATERIAL_REVISION;
        },
        emblem: function (e) {
            return "/material/svg/"+e.name+"?c="+e.color.substr(1)+"&r="+LMS_MATERIAL_REVISION;
        },
        tooltip: function (act, showShortcut) {
            return showShortcut && ACTIONS[act].key
                        ? ttShortcutStr(ACTIONS[act].title, ACTIONS[act].key)
                            : showShortcut && ACTIONS[act].skey
                                ? ttShortcutStr(ACTIONS[act].title, ACTIONS[act].skey, true)
                                : ACTIONS[act].title;
        },
        tooltipStr(str, val, showShortcut) {
            return showShortcut ? ttShortcutStr(str, val) : str;
        },
        gridImageSize(str) {
            return toggleBrowseImageSize(str, true);
        }
    },
    watch: {
        'menu.show': function(newVal) {
            this.$store.commit('menuVisible', {name:'browse-'+this.menu.name, shown:newVal});
            if (!newVal) {
                this.menu.selection = undefined;
                clearTextSelection();
                this.menu.closed = new Date().getTime();
                if (undefined!=this.menu.currentActions) {
                    for (let i=0, loop=this.menu.currentActions, len=loop.length; i<len; ++i) {
                        if (undefined!=loop[i].expanded && undefined!=loop[i].key) {
                            setLocalStorageVal(loop[i].key+'-expanded', loop[i].expanded);
                        }
                    }
                }
            }
        },
        '$store.state.pinQueue': function() {
            this.setWide();
            this.layoutGrid();
        },
        'searchActive': function(newVal) {
            if (2!=newVal) {
                this.highlightIndex = -1;
            }
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

