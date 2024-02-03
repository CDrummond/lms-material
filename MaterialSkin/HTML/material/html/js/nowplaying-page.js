/**
 * LMS-Material
 *
 * Copyright (c) 2018-2024 Craig Drummond <craig.p.drummond@gmail.com>
 * MIT license.
 */
'use strict';

const ARTIST_TAB = 0;
const ALBUM_TAB = 1;
const TRACK_TAB = 2;

const NP_PIC_ACT = 1;
const NP_INFO_ACT = 2;
const NP_BROWSE_CMD = 3;
const NP_COPY_DETAILS_CMD = 4;
const NP_TOGGLE_ACT = 5;
const NP_SHOW_IN_TABS_ACT = 6;
const NP_SYNC_ACT = 7;
const NP_LYRICS_SCROLL_ACT = 8;
const NP_LYRICS_HIGHLIGHT_ACT = 9;
const NP_COPY_ACT = 10;
const NP_SEARCH_ACT = 11;
const NP_CUSTOM = 100;
const NP_ITEM_ACT = 200;
const NP_MIN_WIDTH_FOR_FULL = 780;

var currentPlayingTrackPosition = 0;

var lmsNowPlaying = Vue.component("lms-now-playing", {
    template: `
<div>
 <div v-show="(!desktopLayout && page=='now-playing') || (desktopLayout && (info.show || largeView))" class="np-bgnd">
  <div class="np-bgnd" v-bind:class="[(info.show ? drawInfoBgndImage||drawInfoBackdrop : drawBgndImage||drawBackdrop) ? 'np-bgnd-cover':'np-bgnd-cover-none', (info.show ? drawInfoBackdrop : drawBackdrop) ? 'np-backdrop-blur':'']" id="np-bgnd"></div>
 </div>
 <v-tooltip top :position-x="timeTooltip.x" :position-y="timeTooltip.y" v-model="timeTooltip.show">{{timeTooltip.text}}</v-tooltip>
 <v-menu v-model="menu.show" :position-x="menu.x" :position-y="menu.y" absolute offset-y>
  <v-list>
   <template v-for="(item, index) in menu.items">
    <v-divider v-if="item.divider"></v-divider>
    <v-subheader v-else-if="item.header" style="padding-top:16px">{{item.title}}</v-subheader>
    <v-list-tile v-else-if="undefined==item.title" @click="menuStdAction(item)" >
     <v-list-tile-avatar :tile="true" class="lms-avatar"><v-icon v-if="ACTIONS[item].icon">{{ACTIONS[item].icon}}</v-icon><img v-else-if="ACTIONS[item].svg" class="svg-img" :src="ACTIONS[item].svg | svgIcon(darkUi)"></img></v-list-tile-avatar>
     <v-list-tile-title>{{ACTIONS[item].title}}</v-list-tile-title>
    </v-list-tile>
    <v-list-tile v-else @click="menuAction(item)">
     <v-list-tile-avatar v-if="undefined!=item.check"><v-icon>{{item.check ? 'check_box' : 'check_box_outline_blank'}}</v-icon></v-list-tile-avatar>
     <v-list-tile-avatar v-if="undefined!=item.radio"><v-icon>{{item.radio ? 'radio_button_checked' : 'radio_button_unchecked'}}</v-icon></v-list-tile-avatar>
     <v-list-tile-avatar v-else-if="menu.icons" :tile="true" class="lms-avatar"><v-icon v-if="item.icon">{{item.icon}}</v-icon><img v-else-if="item.svg" class="svg-img" :src="item.svg | svgIcon(darkUi)"></img></v-list-tile-avatar>
     <v-list-tile-title>{{item.title}}</v-list-tile-title>
    </v-list-tile>
   </template>
  </v-list>
 </v-menu>

 <div v-if="info.show && (desktopLayout || page=='now-playing')" class="np-info" id="np-info">
  <v-btn fab small flat top right absolute class="np-menu-fab" @click="showConfigMenu"><v-icon class="np-menu-icn">settings</v-icon></v-btn>
  <v-tabs centered v-model="info.tab" v-if="info.showTabs || windowWidth<NP_MIN_WIDTH_FOR_FULL" style="np-info-tab-cover" @change="tabChanged">
   <template v-for="(tab, index) in info.tabs">
    <v-tab :key="index">{{tab.title}}</v-tab>
    <v-tab-item :key="index" :transition="false" :reverse-transition="false">
     <v-card flat class="np-info-card-cover selectable" @touchend="tabTextEnd" @mouseup="tabTextEnd" @contextmenu="event.preventDefault()">
      <v-card-text :class="['np-info-text', TRACK_TAB==index || tab.isMsg ? 'np-info-lyrics' : '', ALBUM_TAB==index ? 'np-info-review' : '']" :id="'np-tab'+index">
       <div v-if="TRACK_TAB==index && tab.texttitle" v-html="tab.texttitle" class="np-info-title" v-bind:class="{'lyrics-current-line':tab.highlight && undefined!=playerStatus.current.time && tab.lines && tab.lines[0].time>playerStatus.current.time}"></div>
       <div v-else-if="TRACK_TAB!=index && tab.texttitle" v-html="tab.texttitle" class="np-info-title"></div>
       <img v-if="tab.image" :src="tab.image" loading="lazy" class="np-mai-img"></img>
       <div v-if="TRACK_TAB==index && tab.lines">
        <template v-for="(line, lindex) in tab.lines">
         <obj :id="'np-lyrics-'+lindex" v-bind:class="{'lyrics-current-line':tab.highlight && undefined!=playerStatus.current.time && playerStatus.current.time>=line.time && playerStatus.current.time<((lindex+1)<tab.lines.length ? tab.lines[lindex+1].time : 86400)}">{{line.text.length<1 ? '&nbsp;' : line.text}}</obj></br/>
        </template>
       </div>
       <div v-else-if="tab.text" v-bind:class="{'text':TRACK_TAB!=index}" v-html="tab.text"></div>
       <template v-for="(sect, sindex) in tab.sections">
        <div class="np-sect-title" v-if="(undefined!=sect.items && sect.items.length>=sect.min) || undefined!=sect.html">{{sect.title}}<v-btn flat icon class="np-sect-toggle" v-if="undefined!=sect.grid" @click="toggleGrid(index, sindex)"><v-icon>{{ACTIONS[sect.grid ? USE_LIST_ACTION : USE_GRID_ACTION].icon}}</v-icon></v-btn></div>
        <v-list v-if="undefined!=sect.items && !sect.grid && sect.items.length>=sect.min" class="lms-list">
         <template v-for="(item, iindex) in sect.items">
          <v-list-tile class="lms-list-item" v-bind:class="{'pq-current': (ALBUM_TAB==index && item.id==('track_id:'+infoTrack.track_id)) || (ARTIST_TAB==index && item.id==('album_id:'+infoTrack.album_id)), 'list-active':menu.show && index==menu.tab && sindex==menu.section && iindex==menu.index, 'browse-header' : item.header}" @click.stop="itemClicked(index, sindex, iindex, $event)">
           <v-list-tile-avatar v-if="item.image" :tile="true" class="lms-avatar">
            <img :key="item.image" v-lazy="item.image"></img>
           </v-list-tile-avatar>
           <v-list-tile-content>
            <v-list-tile-title v-if="ALBUM_TAB==index" v-html="item.title"></v-list-tile-title>
            <v-list-tile-title v-else>{{item.title}}</v-list-tile-title>
            <v-list-tile-sub-title v-if="item.subtitleContext && windowWidth>=600" v-html="item.subtitleContext"></v-list-tile-sub-title>
            <v-list-tile-sub-title v-else v-html="item.subtitle"></v-list-tile-sub-title>
           </v-list-tile-content>
           <v-list-tile-action v-if="ALBUM_TAB==index && undefined!=item.durationStr" class="np-list-time">{{item.durationStr}}</v-list-tile-action>
           <div class="emblem" v-if="item.emblem" :style="{background: item.emblem.bgnd}">
            <img :src="item.emblem | emblem()" loading="lazy"></img>
           </div>
          </v-list-tile>
         </template>
         <v-list-tile v-if="undefined!=sect.more" @click="moreClicked(index, sindex)"><v-list-tile-content><v-list-tile-title>{{sect.more}}</v-list-tile-title></v-list-tile-content></v-list-tile>
        </v-list>
        <div class="np-grid-sect" v-else-if="undefined!=sect.items && sect.grid && sect.items.length>=sect.min">
         <template v-for="(item, iindex) in sect.items">
          <div v-if="!item.header" class="np-grid-item" v-bind:class="{'pq-current': (ALBUM_TAB==index && item.id==('track_id:'+infoTrack.track_id)) || (ARTIST_TAB==index && item.id==('album_id:'+infoTrack.album_id)), 'list-active':menu.show && index==menu.tab && sindex==menu.section && iindex==menu.index, 'np-grid-item-nosub':ARTIST_TAB==index && !sect.haveSub}" @click.stop="itemClicked(index, sindex, iindex, $event)">
           <img :key="item.image" v-lazy="item.image"></img>
           <v-list-tile-title>{{item.title}}</v-list-tile-title>
           <v-list-tile-sub-title v-html="item.subtitle"></v-list-tile-sub-title>
           <div class="emblem" v-if="item.emblem" :style="{background: item.emblem.bgnd}">
            <img :src="item.emblem | emblem()" loading="lazy"></img>
           </div>
          </div>
         </template>
         <div v-if="undefined!=sect.more && undefined!=sect.items && sect.grid && sect.items.length>=sect.min" class="np-grid-more link-item" @click="moreClicked(index, sindex)">{{sect.more}}</div>
        </div>
        <div v-else-if="undefined!=sect.html" v-html="sect.html"></div>
       </template>
       <div class="np-spacer"></div>
      </v-card-text>
     </v-card>
    </v-tab-item>
   </template>
  </v-tabs>
  <div v-else>
   <v-layout row>
    <template v-for="(tab, index) in info.tabs">
     <v-flex xs4>
      <v-card flat class="np-info-card-cover selectable" @touchend="tabTextEnd" @mouseup="tabTextEnd" @contextmenu="event.preventDefault()">
       <v-card-text :class="['np-info-text-full', TRACK_TAB==index || tab.isMsg ? 'np-info-lyrics' : '', ALBUM_TAB==index ? 'np-info-review' : '']" :id="'np-tab'+index">
        <div v-if="TRACK_TAB==index && tab.texttitle" v-html="tab.texttitle" class="np-info-title" v-bind:class="{'lyrics-current-line':tab.highlight && undefined!=playerStatus.current.time && tab.lines && tab.lines[0].time>playerStatus.current.time}"></div>
        <div v-else-if="TRACK_TAB!=index && tab.texttitle" v-html="tab.texttitle" class="np-info-title"></div>
        <img v-if="tab.image" :src="tab.image" loading="lazy" class="np-mai-img"></img>
        <div v-if="TRACK_TAB==index && tab.lines">
         <template v-for="(line, lindex) in tab.lines">
          <obj :id="'np-lyrics-'+lindex" v-bind:class="{'lyrics-current-line':tab.highlight && undefined!=playerStatus.current.time && playerStatus.current.time>line.time && playerStatus.current.time<((lindex+1)<tab.lines.length ? tab.lines[lindex+1].time : 86400)}">{{line.text.length<1 ? '&nbsp;' : line.text}}</obj></br/>
         </template>
        </div>
        <div v-else-if="tab.text" v-bind:class="{'text':TRACK_TAB!=index}" v-html="tab.text"></div>
        <template v-for="(sect, sindex) in tab.sections">
         <div class="np-sect-title" v-if="(undefined!=sect.items && sect.items.length>=sect.min) || undefined!=sect.html">{{sect.title}}<v-btn flat icon class="np-sect-toggle" v-if="undefined!=sect.grid" @click="toggleGrid(index, sindex)"><v-icon>{{ACTIONS[sect.grid ? USE_LIST_ACTION : USE_GRID_ACTION].icon}}</v-icon></v-btn></div>
         <v-list v-if="undefined!=sect.items && !sect.grid && sect.items.length>=sect.min" class="lms-list">
          <template v-for="(item, iindex) in sect.items">
           <v-list-tile class="lms-list-item" v-bind:class="{'pq-current': (ALBUM_TAB==index && item.id==('track_id:'+infoTrack.track_id)) || (ARTIST_TAB==index && item.id==('album_id:'+infoTrack.album_id)), 'list-active':menu.show && index==menu.tab && sindex==menu.section && iindex==menu.index, 'browse-header' : item.header}" @click.stop="itemClicked(index, sindex, iindex, $event)">
            <v-list-tile-avatar v-if="item.image" :tile="true" class="lms-avatar">
             <img :key="item.image" v-lazy="item.image"></img>
            </v-list-tile-avatar>
            <v-list-tile-content>
             <v-list-tile-title v-if="ALBUM_TAB==index" v-html="item.title"></v-list-tile-title>
             <v-list-tile-title v-else>{{item.title}}</v-list-tile-title>
             <v-list-tile-sub-title v-if="item.subtitleContext && windowWidth>=1500" v-html="item.subtitleContext"></v-list-tile-sub-title>
             <v-list-tile-sub-title v-else v-html="item.subtitle"></v-list-tile-sub-title>
            </v-list-tile-content>
            <v-list-tile-action v-if="ALBUM_TAB==index && undefined!=item.durationStr" class="np-list-time">{{item.durationStr}}</v-list-tile-action>
            <div class="emblem" v-if="item.emblem" :style="{background: item.emblem.bgnd}">
             <img :src="item.emblem | emblem()" loading="lazy"></img>
            </div>
           </v-list-tile>
          </template>
          <v-list-tile v-if="undefined!=sect.more" @click="moreClicked(index, sindex)"><v-list-tile-content><v-list-tile-title>{{sect.more}}</v-list-tile-title></v-list-tile-content></v-list-tile>
         </v-list>
         <div class="np-grid-sect" v-else-if="undefined!=sect.items && sect.grid && sect.items.length>=sect.min">
          <template v-for="(item, iindex) in sect.items">
           <div v-if="!item.header" class="np-grid-item" v-bind:class="{'pq-current': (ALBUM_TAB==index && item.id==('track_id:'+infoTrack.track_id)) || (ARTIST_TAB==index && item.id==('album_id:'+infoTrack.album_id)), 'list-active':menu.show && index==menu.tab && sindex==menu.section && iindex==menu.index, 'browse-header' : item.header, 'np-grid-item-nosub':ARTIST_TAB==index && !sect.haveSub}" @click.stop="itemClicked(index, sindex, iindex, $event)">
            <img :key="item.image" v-lazy="item.image"></img>
            <v-list-tile-title>{{item.title}}</v-list-tile-title>
            <v-list-tile-sub-title v-html="item.subtitle"></v-list-tile-sub-title>
            <div class="emblem" v-if="item.emblem" :style="{background: item.emblem.bgnd}">
             <img :src="item.emblem | emblem()" loading="lazy"></img>
            </div>
           </div>
          </template>
          <div v-if="undefined!=sect.more && undefined!=sect.items && sect.grid && sect.items.length>=sect.min" class="np-grid-more link-item" @click="moreClicked(index, sindex)">{{sect.more}}</div>
         </div>
         <div v-else-if="undefined!=sect.html" v-html="sect.html"></div>
        </template>
        <div class="np-spacer"></div>
       </v-card-text>
      </v-card>
     </v-flex>
    </template>
   </v-layout>
  </div>
 </div>

 <div v-if="desktopLayout || (info.show ? MBAR_NONE!=mobileBar : (page=='now-playing' || MBAR_NONE!=mobileBar))">
 <div v-if="(desktopLayout && !largeView) || (!desktopLayout && (info.show || page!='now-playing'))" class="np-bar" id="np-bar" v-bind:class="{'mobile':!desktopLayout, 'np-bar-mob-thick':!desktopLayout && MBAR_THIN!=mobileBar}" @click="barClicked">
  <v-layout row class="np-bar-controls" v-if="desktopLayout || MBAR_NONE!=mobileBar">
   <v-flex xs4>
    <v-btn flat icon id="np-bar-prev" v-bind:class="{'disabled':disablePrev}" v-longpress:repeat="prevButton" class="np-std-button" :title="trans.prev | tooltip('left', keyboardControl)"><v-icon large class="media-icon">skip_previous</v-icon></v-btn>
   </v-flex>
   <v-flex xs4>
    <v-btn flat icon v-if="playerStatus.playlist.count>0" v-longpress="playPauseButton" @click.middle="showSleep" id="playPauseB" class="np-playpause" :title="(playerStatus.isplaying ? trans.pause : trans.play) | tooltip('space', keyboardControl)" v-bind:class="{'disabled':disableBtns}"><v-icon x-large class="media-icon">{{ playerStatus.isplaying ? 'pause_circle_filled' : 'play_circle_filled'}}</v-icon></v-btn>
   </v-flex>
   <v-flex xs4>
    <v-btn flat icon id="np-bar-next" v-bind:class="{'disabled':disableNext}" v-longpress:repeat="nextButton" class="np-std-button" :title="trans.next | tooltip('right', keyboardControl)"><v-icon large class="media-icon">skip_next</v-icon></v-btn>
   </v-flex>
  </v-layout>
  <div v-if="!largeView && !disableBtns && (desktopLayout || MBAR_NONE!=mobileBar)" class="np-bar-image">
  <img :key="coverUrl" :src="coverUrl" loading="lazy" onerror="this.src=DEFAULT_COVER" @contextmenu="showMenu" @click="clickImage(event)" class="np-cover" v-bind:class="{'np-trans':transCvr}"></img>
  </div>
  <div v-if="!desktopLayout && MBAR_THIN==mobileBar" class="np-bar-details-mobile ellipsis">{{mobileBarText}}</div>
  <v-list two-line subheader class="np-bar-details noselect" v-else-if="playerStatus.playlist.count>0 && (desktopLayout || MBAR_NONE!=mobileBar)">
   <v-list-tile style>
    <v-list-tile-content>
     <v-list-tile-title v-if="playerStatus.current.title">{{title}}</v-list-tile-title>
     <v-list-tile-sub-title v-if="barInfoWithContext" v-html="barInfoWithContext"></v-list-tile-sub-title>
     <v-list-tile-sub-title v-else-if="playerStatus.current.artistAndComposer && playerStatus.current.albumLine"><object v-html="playerStatus.current.artistAndComposer"/>{{SEPARATOR}}<object v-html="playerStatus.current.albumLine"/></v-list-tile-sub-title>
     <v-list-tile-sub-title v-else-if="playerStatus.current.artistAndComposer" v-html="playerStatus.current.artistAndComposer"></v-list-tile-sub-title>
     <v-list-tile-sub-title v-else-if="playerStatus.current.albumLine" v-html="playerStatus.current.albumLine"></v-list-tile-sub-title>
     <v-list-tile-sub-title v-else-if="playerStatus.current.title">&#x22ef;</v-list-tile-sub-title>
    </v-list-tile-content>
    <v-list-tile-action v-if="desktopLayout">
     <div v-if="playerStatus.playlist.count>1 && (npBarRatings || techInfo)" class="np-bar-time " v-bind:class="{'np-bar-time-r': techInfo || npBarRatings}"><obj v-bind:class="{'link-item-ct':coloredToolbars,'link-item':!coloredToolbars}" @click="toggleTime()">{{formattedTime}}</obj>{{SEPARATOR}}<obj v-bind:class="{'link-item':totalTogglesQueue && !coloredToolbars, 'link-item-ct':totalTogglesQueue && coloredToolbars}" @click.stop="trackCountClicked">{{playerStatus.playlist.current | trackCount(playerStatus.playlist.count)}}</obj></div>
     <div v-else class="np-bar-time" v-bind:class="{'link-item-ct':coloredToolbars,'link-item':!coloredToolbars,'np-bar-time-r': techInfo || npBarRatings}" @click="toggleTime()">{{formattedTime}}</div>
     <div v-if="techInfo" class="np-bar-tech ellipsis">{{technicalInfo}}</div>
     <div v-else-if="npBarRatings && (repAltBtn.show || shuffAltBtn.show)" class="np-bar-rating np-thumbs-desktop"><v-btn v-if="repAltBtn.show" :title="repAltBtn.tooltip" flat icon v-longpress="repeatClicked" @contextmenu.prevent="" class="np-std-button" v-bind:class="{'disabled':noPlayer}"><v-icon v-if="repAltBtn.icon" class="media-icon">{{repAltBtn.icon}}</v-icon><img v-else :src="repAltBtn.image" class="btn-img"></img></v-btn><v-btn v-if="shuffAltBtn.show" :title="shuffAltBtn.tooltip" flat icon @click="shuffleClicked" class="np-std-button"><v-icon v-if="shuffAltBtn.icon" class="media-icon">{{shuffAltBtn.icon}}</v-icon><img v-else :src="shuffAltBtn.image" class="btn-img"></img></v-btn></div>
     <v-rating v-else-if="showRatings" class="np-bar-rating" v-model="rating.value" half-increments hover clearable @click.native="setRating(true)" :readonly="undefined==LMS_P_RP"></v-rating>
     <div v-else-if="playerStatus.playlist.count>1" class="np-bar-tech" v-bind:class="{'link-item':totalTogglesQueue && !coloredToolbars, 'link-item-ct':totalTogglesQueue && coloredToolbars}" @click.stop="trackCountClicked">{{playerStatus.playlist.current | trackCount(playerStatus.playlist.count)}}</div>
     <div v-else class="np-bar-tech">&nbsp;</div>
    </v-list-tile-action>
   </v-list-tile>
  </v-list>
  <v-progress-linear height="5" id="pos-slider" v-if="IS_MOBILE && playerStatus.playlist.count>0" :disabled="playerStatus.current.duration>0" class="np-slider np-bar-slider" :value="playerStatus.current.pospc"></v-progress-linear>
  <v-progress-linear height="5" id="pos-slider" v-else-if="playerStatus.playlist.count>0" :disabled="playerStatus.current.duration>0" class="np-slider np-bar-slider" :value="playerStatus.current.pospc" v-on:click="sliderChanged($event, false)" @mouseover="showTimeTooltip" @mouseout="hideTimeTooltip" @mousemove="moveTimeTooltip" @touchstart.passive="touchSliderStart" @touchend.passive="touchSliderEnd" @touchmove.passive="moveTimeTooltipTouch"></v-progress-linear>
 </div>
 
 <div class="np-page" v-else id="np-page">
  <div>
   <div v-show="overlayVolume>-1 && VOL_STD==playerStatus.dvc" id="volumeOverlay">{{overlayVolume}}%</div>
   <div v-if="landscape" v-touch:start="touchStart" v-touch:end="touchEnd" v-touch:moving="touchMoving">
    <div v-if="!info.show" class="np-image-landscape" v-bind:class="{'np-image-landscape-wide':landscape && wide>1}">
     <img :key="coverUrl" :src="coverUrl" loading="lazy" onerror="this.src=DEFAULT_COVER" @contextmenu="showMenu" @click="clickImage(event)" class="np-cover" v-touch:start="touchStart" v-touch:end="touchEnd" v-touch:moving="touchMoving" v-bind:class="{'np-trans':transCvr, 'np-cover-dim':showOverlay}"></img>
     <div class="np-emblem" v-if="playerStatus.current.emblem" @click="emblemClicked" :style="{background:playerStatus.current.emblem.bgnd}" v-bind:class="{'np-cover-dim':showOverlay}">
      <img :src="playerStatus.current.emblem | emblem()" loading="lazy"></img>
     </div>
     <div class="np-menu" :title="trans.menu" @click="showMenu" v-if="showOverlay && playerStatus.playlist.count>0" v-bind:class="{'np-skip-elevate':showOverlay}"></div>
     <table class="np-skip" v-if="showOverlay">
      <tr>
       <td><v-btn icon outline @click.stop="skipBack" class="np-std-button" v-bind:class="{'disabled':disableBtns}"><img class="svg-img" :src="'rewind-'+skipBSeconds | svgIcon(true)"></img></v-btn></td>
       </td>
       <td><v-btn icon outline @click.stop="skipForward" class="np-std-button" v-bind:class="{'disabled':disableBtns}"><img class="svg-img" :src="'fast-forward-'+skipFSeconds | svgIcon(true)"></img></v-btn></td>
      </tr>
     </table>
    </div>
    <div class="np-details-landscape" v-bind:class="{'np-details-landscape-wide': landscape && wide>1}">

     <div class="np-landscape-song-info hide-scrollbar fade-both">
      <div>
       <p class="np-title-landscape np-title" v-if="playerStatus.current.title">{{title}}</p>
       <p class="np-text-landscape subtext" v-if="artistAndComposerLine" v-html="artistAndComposerLine"></p>
       <p class="np-text-landscape subtext" v-if="albumLine" v-html="albumLine"></p>
       <v-rating v-if="showRatings" class="np-text-landscape subtext" v-model="rating.value" half-increments hover clearable @click.native="setRating(true)" :readonly="undefined==LMS_P_RP"></v-rating>
      </div>
     </div>
     <div v-if="wide>1">

      <v-layout text-xs-center row wrap class="np-controls-wide">
       <v-flex xs12 class="np-tech ellipsis" v-if="techInfo || playerStatus.playlist.count>1">{{techInfo ? technicalInfo : ""}}{{playerStatus.playlist.current | trackCount(playerStatus.playlist.count, techInfo ? SEPARATOR : undefined)}}</v-flex>
       <v-flex xs12 v-if="!info.show && undefined!=playerStatus.current.time">
        <v-layout class="np-time-layout">
         <p class="np-pos" v-bind:class="{'np-pos-center': playerStatus.current.duration<=0}">{{playerStatus.current.time | displayTime}}</p>
         <v-progress-linear height="5" v-if="playerStatus.current.duration>0" id="pos-slider" class="np-slider" :value="playerStatus.current.pospc" v-on:click="sliderChanged($event)" @mouseover="showTimeTooltip" @mouseout="hideTimeTooltip" @mousemove="moveTimeTooltip" @touchstart.passive="touchSliderStart" @touchend.passive="touchSliderEnd" @touchmove.passive="moveTimeTooltipTouch"></v-progress-linear>
         <p class="np-duration link-item" v-if="(showTotal || undefined==playerStatus.current.time) && playerStatus.current.duration>0" @click="toggleTime()">{{playerStatus.current.duration | displayTime}}</p>
         <p class="np-duration link-item" v-else-if="playerStatus.current.duration>0" @click="toggleTime()">-{{playerStatus.current.duration-playerStatus.current.time | displayTime}}</p>
        </v-layout>
       </v-flex>
       <v-flex xs12 v-else-if="!info.show"><div style="height:31px"></div></v-flex>
       <v-flex xs12>
        <v-layout text-xs-center class="np-playback">
         <v-flex xs4>
          <v-layout text-xs-center>
           <v-flex xs6>
            <v-btn v-if="repAltBtn.show" :title="repAltBtn.tooltip" flat icon v-longpress="repeatClicked" class="np-std-button" v-bind:class="{'disabled':noPlayer}"><v-icon v-if="repAltBtn.icon" class="media-icon">{{repAltBtn.icon}}</v-icon><img v-else :src="repAltBtn.image" class="btn-img"></img></v-btn>
            <v-btn :title="trans.repeatOne" flat icon v-else-if="playerStatus.playlist.repeat===1" v-longpress="repeatClicked" class="np-std-button" v-bind:class="{'disabled':noPlayer}"><v-icon class="media-icon">repeat_one</v-icon></v-btn>
            <v-btn :title="trans.repeatAll" flat icon v-else-if="playerStatus.playlist.repeat===2" v-longpress="repeatClicked" class="np-std-button" v-bind:class="{'disabled':noPlayer}"><v-icon class="media-icon">repeat</v-icon></v-btn>
            <v-btn :title="trans.dstm" flat icon v-else-if="dstm" v-longpress="repeatClicked" class="np-std-button"><v-icon class="media-icon">all_inclusive</v-icon></v-btn>
            <v-btn :title="trans.repeatOff" flat icon v-else v-longpress="repeatClicked" @contextmenu.prevent="" class="dimmed np-std-button" v-bind:class="{'disabled':noPlayer}"><img class="svg-img media-icon" :src="'repeat-off' | svgIcon(darkUi)"></img></v-btn>
           </v-flex>
           <v-flex xs6><v-btn flat icon v-longpress:repeat="prevButton" class="np-std-button" v-bind:class="{ 'disabled':disablePrev}" :title="trans.prev | tooltip('left', keyboardControl)"><v-icon large class="media-icon">skip_previous</v-icon></v-btn></v-flex>
          </v-layout>
         </v-flex>
         <v-flex xs4>
          <v-btn flat icon large v-longpress="playPauseButton" @click.middle="showSleep" id="playPauseD" class="np-playpause" :title="(playerStatus.isplaying ? trans.pause : trans.play) | tooltip('space', keyboardControl)" v-bind:class="{'disabled':disableBtns}"><v-icon x-large class="media-icon">{{ playerStatus.isplaying ? 'pause_circle_filled' : 'play_circle_filled'}}</v-icon></v-btn>
         </v-flex>
          <v-flex xs4>
          <v-layout text-xs-center>
            <v-flex xs6><v-btn flat icon v-longpress:repeat="nextButton" class="np-std-button" v-bind:class="{ 'disabled':disableNext}" :title="trans.next | tooltip('right', keyboardControl)"><v-icon large class="media-icon">skip_next</v-icon></v-btn></v-flex>
           <v-flex xs6>
            <v-btn v-if="shuffAltBtn.show" :title="shuffAltBtn.tooltip" flat icon @click="shuffleClicked" class="np-std-button"><v-icon v-if="shuffAltBtn.icon" class="media-icon">{{shuffAltBtn.icon}}</v-icon><img v-else :src="shuffAltBtn.image" class="btn-img"></img></v-btn>
            <v-btn :title="trans.shuffleAlbums" flat icon v-else-if="playerStatus.playlist.shuffle===2" @click="shuffleClicked" class="np-std-button" v-bind:class="{'disabled':noPlayer}"><img class="svg-img media-icon" :src="'shuffle-albums' | svgIcon(darkUi)"></img></v-btn>
            <v-btn :title="trans.shuffleAll" flat icon v-else-if="playerStatus.playlist.shuffle===1" @click="shuffleClicked" class="np-std-button" v-bind:class="{'disabled':noPlayer}"><v-icon class="media-icon">shuffle</v-icon></v-btn>
            <v-btn :title="trans.shuffleOff" flat icon v-else @click="shuffleClicked" class="dimmed np-std-button" v-bind:class="{'disabled':noPlayer}"><img class="svg-img media-icon" :src="'shuffle-off' | svgIcon(darkUi)"></img></v-btn>
           </v-flex>
          </v-layout>
         </v-flex>
        <v-layout>
       <v-flex>
      </v-layout>

     </div>
    </div>
   </div>
   <div v-else>
    <div v-if="!info.show" class="np-image">
     <img :key="coverUrl" :src="coverUrl" loading="lazy" onerror="this.src=DEFAULT_COVER" @contextmenu="showMenu" @click="clickImage(event)" v-touch:start="touchStart" v-touch:end="touchEnd" v-touch:moving="touchMoving" class="np-cover" v-bind:class="{'np-trans':transCvr, 'np-cover-dim':showOverlay}"></img>
     <div class="np-emblem" v-if="playerStatus.current.emblem" @click="emblemClicked" :style="{background: playerStatus.current.emblem.bgnd}" v-bind:class="{'np-cover-dim':showOverlay}">
      <img :src="playerStatus.current.emblem | emblem()" loading="lazy"></img>
     </div>
     <div class="np-menu" :title="trans.menu" @click="showMenu" v-if="showOverlay && playerStatus.playlist.count>0" v-bind:class="{'np-skip-elevate':showOverlay}"></div>
     <div class="np-close" :title="trans.collapseNp" @click="largeView=false" v-if="showOverlay" v-bind:class="{'np-skip-elevate':showOverlay}"></div>
     <table class="np-skip" v-if="showOverlay">
      <tr>
       <td><v-btn icon outline @click.stop="skipBack" class="np-std-button" v-bind:class="{'disabled':disableBtns}"><img class="svg-img" :src="'rewind-'+skipBSeconds | svgIcon(true)"></img></v-btn></td>
       </td>
       <td><v-btn icon outline @click.stop="skipForward" class="np-std-button" v-bind:class="{'disabled':disableBtns}"><img class="svg-img" :src="'fast-forward-'+skipFSeconds | svgIcon(true)"></img></v-btn></td>
      </tr>
     </table>
    </div>
    <div class="np-portrait-song-info hide-scrollbar fade-both">
     <div>
      <p class="np-title" v-if="playerStatus.current.title">{{title}}</p>
      <p class="np-text subtext" v-if="artistAndComposerLine" v-html="artistAndComposerLine"></p>
      <p class="np-text subtext" v-if="albumLine" v-html="albumLine"></p>
      <v-rating v-if="showRatings" class="np-text subtext" v-model="rating.value" half-increments hover clearable @click.native="setRating(true)" :readonly="undefined==LMS_P_RP"></v-rating>
     </div>
    </div>
   </div>
   <v-layout text-xs-center row wrap class="np-controls" v-if="!(landscape && wide>1)">
    <v-flex xs12 class="np-tech ellipsis" v-if="techInfo || playerStatus.playlist.count>1">{{techInfo ? technicalInfo : ""}}{{playerStatus.playlist.current | trackCount(playerStatus.playlist.count, techInfo ? SEPARATOR : undefined)}}</v-flex>

    <v-flex xs12><div class="np-portrait-thin-pad"></div></v-flex>

    <v-flex xs12 v-if="!info.show && undefined!=playerStatus.current.time">
     <v-layout>
      <p class="np-pos" v-bind:class="{'np-pos-center': playerStatus.current.duration<=0}">{{playerStatus.current.time | displayTime}}</p>
      <v-progress-linear height="5" v-if="playerStatus.current.duration>0" id="pos-slider" class="np-slider" :value="playerStatus.current.pospc" v-on:click="sliderChanged($event, false)" @mouseover="showTimeTooltip" @mouseout="hideTimeTooltip" @mousemove="moveTimeTooltip" @touchstart.passive="touchSliderStart" @touchend.passive="touchSliderEnd" @touchmove.passive="moveTimeTooltipTouch"></v-progress-linear>
      <p class="np-duration link-item" v-if="(showTotal || undefined==playerStatus.current.time) && playerStatus.current.duration>0" @click="toggleTime()">{{playerStatus.current.duration | displayTime}}</p>
      <p class="np-duration link-item" v-else-if="playerStatus.current.duration>0" @click="toggleTime()">-{{playerStatus.current.duration-playerStatus.current.time | displayTime}}</p>
     </v-layout>
    </v-flex>
    <v-flex xs12 v-else-if="!info.show"><div style="height:31px"></div></v-flex>

    <v-flex xs12><div class="np-portrait-thin-pad"></div></v-flex>

    <v-flex xs12>
     <v-layout text-xs-center class="np-playback">
      <v-flex xs4 class="no-control-adjust">
       <v-layout text-xs-center>
        <v-flex xs6>
         <v-btn v-if="repAltBtn.show" :title="repAltBtn.tooltip" flat icon v-longpress="repeatClicked" @contextmenu.prevent="" class="np-std-button" v-bind:class="{'disabled':noPlayer}"><v-icon v-if="repAltBtn.icon" class="media-icon">{{repAltBtn.icon}}</v-icon><img v-else :src="repAltBtn.image" class="btn-img"></img></v-btn>
         <v-btn :title="trans.repeatOne" flat icon v-else-if="playerStatus.playlist.repeat===1" v-longpress="repeatClicked" class="np-std-button" v-bind:class="{'disabled':noPlayer}"><v-icon class="media-icon">repeat_one</v-icon></v-btn>
         <v-btn :title="trans.repeatAll" flat icon v-else-if="playerStatus.playlist.repeat===2" v-longpress="repeatClicked" class="np-std-button" v-bind:class="{'disabled':noPlayer}"><v-icon class="media-icon">repeat</v-icon></v-btn>
         <v-btn :title="trans.dstm" flat icon v-else-if="dstm" v-longpress="repeatClicked" class="np-std-button"><v-icon class="media-icon">all_inclusive</v-icon></v-btn>
         <v-btn :title="trans.repeatOff" flat icon v-else v-longpress="repeatClicked" class="dimmed np-std-button" v-bind:class="{'disabled':noPlayer}"><img class="svg-img media-icon" :src="'repeat-off' | svgIcon(darkUi)"></img></v-btn>
        </v-flex>
        <v-flex xs6><v-btn flat icon v-longpress:repeat="prevButton" class="np-std-button" v-bind:class="{ 'disabled':disablePrev}" :title="trans.prev | tooltip('left', keyboardControl)"><v-icon large class="media-icon">skip_previous</v-icon></v-btn></v-flex>
       </v-layout>
      </v-flex>
      <v-flex xs4 class="no-control-adjust">
       <v-btn flat icon large v-longpress="playPauseButton" @click.middle="showSleep" id="playPauseF" class="np-playpause" :title="(playerStatus.isplaying ? trans.pause : trans.play) | tooltip('space', keyboardControl)" v-bind:class="{'disabled':disableBtns}"><v-icon x-large class="media-icon">{{ playerStatus.isplaying ? 'pause_circle_filled' : 'play_circle_filled'}}</v-icon></v-btn>
      </v-flex>
      <v-flex xs4 class="no-control-adjust">
       <v-layout text-xs-center>
         <v-flex xs6><v-btn flat icon v-longpress:repeat="nextButton" class="np-std-button" v-bind:class="{ 'disabled':disableNext}" :title="trans.next | tooltip('right', keyboardControl)"><v-icon large class="media-icon">skip_next</v-icon></v-btn></v-flex>
        <v-flex xs6>
         <v-btn v-if="shuffAltBtn.show" :title="shuffAltBtn.tooltip" flat icon @click="shuffleClicked" class="np-std-button"><v-icon v-if="shuffAltBtn.icon" class="media-icon">{{shuffAltBtn.icon}}</v-icon><img v-else :src="shuffAltBtn.image" class="btn-img"></img></v-btn>
         <v-btn :title="trans.shuffleAlbums" flat icon v-else-if="playerStatus.playlist.shuffle===2" @click="shuffleClicked" class="np-std-button" v-bind:class="{'disabled':noPlayer}"><img class="svg-img media-icon" :src="'shuffle-albums' | svgIcon(darkUi)"></v-btn>
         <v-btn :title="trans.shuffleAll" flat icon v-else-if="playerStatus.playlist.shuffle===1" @click="shuffleClicked" class="np-std-button" v-bind:class="{'disabled':noPlayer}"><v-icon class="media-icon">shuffle</v-icon></v-btn>
         <v-btn :title="trans.shuffleOff" flat icon v-else @click="shuffleClicked" class="dimmed np-std-button" v-bind:class="{'disabled':noPlayer}"><img class="svg-img media-icon" :src="'shuffle-off' | svgIcon(darkUi)"></img></v-btn>
        </v-flex>
       </v-layout>
      </v-flex>
     <v-layout>
    <v-flex>
   </v-layout>
  </div>
 </div>
 </div>
</div>
`,
    data() {
        return { coverUrl:DEFAULT_COVER,
                 playerStatus: {
                    isplaying: false,
                    sleepTimer: false,
                    dvc: VOL_STD,
                    current: { canseek:1, duration:0, time:undefined, title:undefined, artist:undefined, artistAndComposer: undefined, artistAndComposerWithContext:undefined,
                               album:undefined, albumName:undefined, albumLine:undefined, technicalInfo:undefined, pospc:0.0, tracknum:undefined,
                               disc:0, year:0, url:undefined, comment:undefined, source: {local:true, text:undefined},
                               emblem: undefined },
                    playlist: { shuffle:0, repeat: 0, current:0, count:0 },
                 },
                 mobileBarText: undefined,
                 info: { show: false, tab:parseInt(getLocalStorageVal("nptab", TRACK_TAB)), showTabs:false, sync: true,
                         tabs: [ { value:ARTIST_TAB, title:undefined, text:undefined, reqId:0, image: undefined,
                                   sections:[ { title:undefined, items:[], min:1, more:undefined, grid:getLocalStorageBool("np-tabs-"+ARTIST_TAB+"-0-grid", false) },
                                              { title:undefined, html:undefined } ] },
                                 { value:ALBUM_TAB, title:undefined, text:undefined, reqId:0, image: undefined,
                                   sections:[ { title:undefined, items:[], min:2, more:undefined } ] },
                                 { value: TRACK_TAB, title:undefined, text:undefined, lines:undefined, scroll:false, highlight:false, reqId:0, image: undefined,
                                   sections:[ { title:undefined, html:undefined } ] } ] },
                 infoTrack: {album_id:undefined, track_id:undefined},
                 trans: { expand:undefined, collapse:undefined, sync:undefined, unsync:undefined, more:undefined, dstm:undefined,
                          repeatAll:undefined, repeatOne:undefined, repeatOff:undefined, shuffleAll:undefined, shuffleAlbums:undefined, shuffleOff:undefined,
                          play:undefined, pause:undefined, prev:undefined, next:undefined, collapseNp:undefined, expandNp:undefined, menu:undefined },
                 showTotal: true,
                 landscape: false,
                 wide: 0,
                 windowWidth: 10,
                 barInfoWithContextWidth: 10,
                 largeView: false,
                 menu: { show: false, x:0, y:0, items: [], icons:false, tab:undefined, section:undefined, index:undefined },
                 rating: {value:0, setting:0},
                 timeTooltip: {show: false, x:0, y:0, text:undefined},
                 overlayVolume: -1,
                 repAltBtn:{show:false, command:[], icon:undefined, image:undefined, tooltip:undefined},
                 shuffAltBtn:{show:false, command:[], icon:undefined, image:undefined, tooltip:undefined},
                 disableBtns:true,
                 disablePrev:true,
                 disableNext:true,
                 dstm:false,
                 showOverlay:false,
                 showOverlayTimer:undefined
                };
    },
    mounted() {
        this.showNpBar = undefined;
        this.desktopBarHeight = getComputedStyle(document.documentElement).getPropertyValue('--desktop-npbar-height');
        this.desktopBarThinHeight = getComputedStyle(document.documentElement).getPropertyValue('--desktop-npbar-height-thin');
        this.mobileBarThinHeight = getComputedStyle(document.documentElement).getPropertyValue('--mobile-npbar-height-thin');
        this.mobileBarThickHeight = getComputedStyle(document.documentElement).getPropertyValue('--mobile-npbar-height-thick');
        this.controlBar();
        this.info.tabs[TRACK_TAB].scroll=getLocalStorageBool("npScrollLyrics", true);
        this.info.tabs[TRACK_TAB].highlight=getLocalStorageBool("npHighlightLyrics", true);

        bus.$on('mobileBarChanged', function() {
            this.controlBar(true);
        }.bind(this));
        bus.$on('customActions', function(val) {
            this.customActions = getCustomActions("track", false);
        }.bind(this));

        this.info.showTabs=getLocalStorageBool("showTabs", false);
        bus.$on('closeNowPlaying', function() {
            if (this.info.show) {
                bus.$emit('info');
            }
            this.largeView = false;
        }.bind(this));
        bus.$on('expandNowPlaying', function(val) {
            if (window.innerHeight>=LMS_MIN_NP_LARGE_INFO_HEIGHT) {
                if (val) {
                    this.info.show = false;
                }
                this.largeView = val;
            }
        }.bind(this));

        bus.$on('pageChanged', function(page) {
            if (page=='now-playing') {
                if (!this.info.show) {
                    this.$forceUpdate();
                }
            }
        }.bind(this));

        bus.$on('info-swipe', function(d, ev) {
            if (this.info.show) {
                if ('left'==d) {
                    if (this.info.tab==2) {
                        this.info.tab=0;
                    } else {
                        this.info.tab++;
                    }
                } else if ('right'==d) {
                    if (this.info.tab==0) {
                        this.info.tab=2;
                    } else {
                        this.info.tab--;
                    }
                } else if ('down'==d && this.info.show && undefined!=ev && undefined!=ev.target && 'np-mai-img'==ev.target.className) {
                    bus.$emit('info');
                }
            }
        }.bind(this));
        bus.$on('swipeUp', function() {
            if (this.$store.state.desktopLayout && !this.$store.state.pinQueue && this.$store.state.showQueue) {
                return;
            }
            if ((this.largeView || !this.$store.state.desktopLayout) && !this.info.show) {
                bus.$emit('info');
            }
        }.bind(this));
        bus.$on('swipeDown', function() {
            if (this.largeView && this.$store.state.desktopLayout && (this.$store.state.pinQueue || !this.$store.state.showQueue)) {
                this.largeView=false;
            }
        }.bind(this));
        var npView = this;
        this.sizeCheckDelay = 0; // How many resize events have we seen before size checked?
        window.addEventListener('resize', () => {
            if (npView.resizeTimeout) {
                clearTimeout(npView.resizeTimeout);
            }
            npView.sizeCheckDelay++;
            if (npView.sizeCheckDelay>=10) {
                npView.checkWindowSize();
            } else {
                npView.resizeTimeout = setTimeout(function () {
                    npView.resizeTimeout = undefined;
                    npView.checkWindowSize();
                }, 50);
            }
        }, false);

        // Long-press on 'now playing' nav button whilst in now-playing shows track info
        bus.$on('nav', function(page, longPress) {
            if ('now-playing'==page) {
                if (longPress && undefined!=this.$store.state.player) {
                    bus.$emit('dlg.open', 'sleep', this.$store.state.player);
                } else if (LMS_P_MAI && this.playerStatus && this.playerStatus.current && this.playerStatus.current.artist) {
                    this.largeView = false;
                    this.info.show = !this.info.show;
                } else if (this.info.show) {
                    this.info.show = false;
                }
            }
        }.bind(this));

        this.info.sync=getLocalStorageBool("syncInfo", true);
        bus.$on('playerStatus', function(playerStatus) {
            try {
                nowplayingOnPlayerStatus(this, playerStatus); // can be called before deferred JS is loaded...
            } catch (e) { // If error, get status 1 second later...
                setTimeout(function () { bus.$emit('refreshStatus', this.$store.state.player.id); }.bind(this), 1000);
            }
        }.bind(this));

        // Refresh status now, in case we were mounted after initial status call
        bus.$emit('refreshStatus');

        this.bgndElement = document.getElementById("np-bgnd");
        this.page = document.getElementById("np-page");
        bus.$on('themeChanged', function() {
            this.setBgndCover();
        }.bind(this));

        this.checkLandscape();
        setTimeout(function () {
            this.checkLandscape();
        }.bind(this), 1000);

        bus.$on('currentCover', function(coverUrl) {
            this.coverUrl = undefined==coverUrl ? DEFAULT_COVER : coverUrl;
            this.setBgndCover();
        }.bind(this));
        bus.$emit('getCurrentCover');
        bus.$on('setBgndCover', function() {
            this.setBgndCover();
        }.bind(this));
        bus.$on('langChanged', function() {
            this.initItems();
        }.bind(this));
        this.initItems();

        bus.$on('closeMenu', function() {
            if (this.menu.show) {
                this.menu.show = false;
            }
        }.bind(this));

        bus.$on('closeDialog', function(dlg) {
            if (dlg == 'info-dialog') {
                this.info.show = false;
            }
        }.bind(this));

        bus.$on('escPressed', function() {
            if (this.$store.state.openDialogs.length==0 && this.$store.state.visibleMenus.size<=0 &&
                       this.largeView && this.$store.state.desktopLayout) {
                this.largeView = false;
            }
        }.bind(this));

        bus.$on('info', function() {
            if ((window.innerHeight>=LMS_MIN_NP_LARGE_INFO_HEIGHT && this.playerStatus.playlist.count>0) || this.info.show) {
                this.largeView = false;
                this.info.show = !this.info.show;
            }
        }.bind(this));
        bus.$on('npclose', function() {
            this.close();
        }.bind(this));
        bus.$on('linkClicked', function() {
            this.close();
        }.bind(this));

        bus.$on('prefset', function(pref, value, player) {
            if ("plugin.dontstopthemusic:provider"==pref && player==this.$store.state.player.id) {
                this.dstm = (""+value)!="0";
            }
        }.bind(this));

        bus.$on('showLinkMenu.now-playing', function(x, y, menu) {
            showMenu(this, {items: menu, x:x, y:y, show:true, icons:true});
        }.bind(this));

        this.showTotal = getLocalStorageBool('showTotal', true);
        if (!IS_MOBILE) {
            bindKey(LMS_TRACK_INFO_KEYBOARD, 'mod');
            bindKey(LMS_EXPAND_NP_KEYBOARD, 'mod+shift');
            if (undefined!=LMS_P_RP) {
                for (var i=0; i<=6; ++i) {
                    bindKey(''+i, 'mod+shift');
                }
            }
            bus.$on('keyboard', function(key, modifier) {
                if (this.$store.state.visibleMenus.size>0 || this.$store.state.openDialogs.length>1 || (!this.$store.state.desktopLayout && this.$store.state.page!="now-playing")) {
                    return;
                }
                if ('mod'==modifier && LMS_TRACK_INFO_KEYBOARD==key && LMS_P_MAI && (this.$store.state.openDialogs.length==0 || this.$store.state.openDialogs[0]=='info-dialog') && (window.innerHeight>=LMS_MIN_NP_LARGE_INFO_HEIGHT || this.info.show)) {
                    this.largeView = false;
                    this.info.show = !this.info.show;
                } else if ('mod+shift'==modifier) {
                    if (LMS_EXPAND_NP_KEYBOARD==key && this.$store.state.desktopLayout && (window.innerHeight>=LMS_MIN_NP_LARGE_INFO_HEIGHT || this.largeView)) {
                        this.info.show = false;
                        this.largeView = !this.largeView;
                    } else if (1==key.length && !isNaN(key) && undefined!=LMS_P_RP && this.$store.state.showRating) {
                        this.rating.value = parseInt(key);
                        this.setRating();
                    }
                }
            }.bind(this));
        }
    },
    methods: {
        initItems() {
            this.trans = { dstm:i18n("Don't Stop The Music"), repeatAll:i18n("Repeat queue"), repeatOne:i18n("Repeat single track"),
                           repeatOff:i18n("No repeat"), shuffleAll:i18n("Shuffle tracks"), shuffleAlbums:i18n("Shuffle albums"),
                           shuffleOff:i18n("No shuffle"), play:i18n("Play"), pause:i18n("Pause"), prev:i18n("Previous track"),
                           next:i18n("Next track"), collapseNp:i18n("Collapse now playing"), expandNp:i18n("Expand now playing"), menu:i18n("Menu") };
            this.info.tabs[TRACK_TAB].title=i18n("Track");
            this.info.tabs[ARTIST_TAB].title=i18n("Artist");
            this.info.tabs[ALBUM_TAB].title=i18n("Album");
            this.info.tabs[ARTIST_TAB].sections[0].title=i18n("Albums");
            this.info.tabs[ARTIST_TAB].sections[1].title=i18n("Similar artists");
            this.info.tabs[ALBUM_TAB].sections[0].title=i18n("Tracks");
            this.info.tabs[TRACK_TAB].sections[0].title=i18n("Details");
        },
        showMenu(event) {
            nowplayingShowMenu(this, event);
        },
        emblemClicked() {
            if (this.playerStatus.current.source && this.playerStatus.current.source.url) {
                openWindow(this.playerStatus.current.source.url);
            }
        },
        trackCountClicked() {
            if (this.totalTogglesQueue) {
                this.$store.commit('setShowQueue', !this.$store.state.showQueue);
            }
        },
        menuAction(item) {
            nowplayingMenuAction(this, item);
        },
        menuStdAction(item) {
            nowplayingMenuStdAction(this, item);
        },
        showPic() {
            bus.$emit('dlg.open', 'gallery', [this.coverUrl], 0, true);
        },
        doAction(command) {
            if (this.$store.state.visibleMenus.size>0) {
                return;
            }
            bus.$emit('playerCommand', command);
        },
        setPosition() {
            var pc = this.playerStatus.current && undefined!=this.playerStatus.current.time && undefined!=this.playerStatus.current.duration &&
                     this.playerStatus.current.duration>0 ? 100*Math.floor(this.playerStatus.current.time*1000/this.playerStatus.current.duration)/1000 : 0.0;

            if (pc!=this.playerStatus.current.pospc) {
                this.playerStatus.current.pospc = pc;
            }
            this.updateLyricsPosition();
        },
        updateLyricsPosition() {
            if (this.info.show && this.info.tabs[TRACK_TAB].lines && this.info.tabs[TRACK_TAB].scroll && this.playerStatus.current && undefined!=this.playerStatus.current.time) {
                let pos = undefined;
                for (let i=0, loop=this.info.tabs[TRACK_TAB].lines, len=loop.length; i<len; ++i) {
                    if (loop[i].time<=this.playerStatus.current.time) {
                        pos = i;
                    } else {
                        break;
                    }
                }
                if (pos!=undefined) {
                    if (pos==this.info.tabs[TRACK_TAB].pos) {
                        return;
                    }
                    let tab = document.getElementById("np-tab"+TRACK_TAB);
                    if (tab) {
                        if (tab.offsetHeight>600) {
                            pos = Math.max(0, pos-7);
                        } else if (tab.offsetHeight>300) {
                            pos = Math.max(0, pos-4);
                        }
                    }
                    if (pos==this.info.tabs[TRACK_TAB].pos) {
                        return;
                    }

                    this.info.tabs[TRACK_TAB].pos=pos;
                    if (0==pos && tab) {
                        setElemScrollTop(tab, 0);
                    } else {
                        let adjust = tab ? tab.offsetHeight>700 ? 5 : tab.offsetHeight>350 ? 3 : 2 : 2;
                        let elem = document.getElementById("np-lyrics-"+(pos-(adjust<pos ? adjust : 0)));
                        if (undefined!=elem) {
                            ensureVisible(elem, 0, {block: "center"});
                        }
                    }
                }
            }
        },
        sliderChanged(e, isTouch) {
            if (this.playerStatus.current.canseek && this.playerStatus.current.duration>3) {
                const rect = document.getElementById("pos-slider").getBoundingClientRect();
                const evPos = isTouch ? getTouchPos(e) : {x:e.clientX, y:e.clientY};
                let pos = evPos.x - rect.x;
                if (isTouch && ( (evPos.x < (rect.x - 8)) || (evPos.x > (rect.x+rect.width + 8)) ||
                                 (evPos.y < (rect.y - 8)) || (evPos.y > (rect.y+rect.height + 8))) ) {
                    return;
                }
                // Try to detect up-swipes on desktop layout on mobile devices, e.g. newer Android where swipe up to
                // show navigation bar.
                if (isTouch && this.$store.state.desktopLayout && !this.largeView && undefined!=this.touchStartPos &&
                    (window.innerHeight-8)<=this.touchStartPos.y && this.touchStartPos.y>evPos.y && (this.touchStartPos.y-evPos.y)>4) {
                    return;
                }
                pos = Math.min(Math.max(0, pos), rect.width);
                let val = Math.floor(this.playerStatus.current.duration * pos / rect.width);

                // On touch devices we get a sliderChanged event from touchSliderEnd and the one from the slider
                // So, ignore events too close together. See #672
                if (undefined!=this.lastTimeEvent && this.lastTimeEvent.isTouch!=isTouch && this.lastTimeEvent.val==val && ((new Date().getTime())-this.lastTimeEvent.time)<250) {
                    return;
                }
                this.doAction(['time', val]);
                this.lastTimeEvent = {time: new Date().getTime(), val: val, isTouch: isTouch};
            }
        },
        moveTimeTooltipTouch(e) {
            this.moveTimeTooltip(getTouchPos(e), true);
        },
        moveTimeTooltip(e, isTouch) {
            if (this.timeTooltip.show) {
                if (this.playerStatus.current.duration<=1) {
                    this.hideTimeTooltip();
                    return;
                }
                this.timeTooltip.x = e.x
                const rect = document.getElementById("pos-slider").getBoundingClientRect();
                this.timeTooltip.y = rect.y - (isTouch ? 32 : 0);
                let pos = e.x - rect.x;
                pos = Math.min(Math.max(0, pos), rect.width);
                this.timeTooltip.text=""+formatSeconds(Math.floor(this.playerStatus.current.duration * pos / rect.width));
                this.startTooltipTimeout();
            }
        },
        touchSliderStart(e) {
            this.showTimeTooltip();
            this.touchStartPos = getTouchPos(e);
        },
        touchSliderEnd(e) {
            if (this.timeTooltip.show) {
                this.sliderChanged(e, true);
                this.hideTimeTooltip();
            }
            this.touchStartPos = undefined;
        },
        setInfoTrack() {
            this.infoTrack={ title: this.playerStatus.current.title,
                             track_id: this.playerStatus.current.id,
                             artist: this.playerStatus.current.artist,
                             artist_id: this.playerStatus.current.artist_ids
                                ? this.playerStatus.current.artist_ids[0]
                                : this.playerStatus.current.artist_id,
                             artist_ids: this.playerStatus.current.artist_ids,
                             albumartist: this.playerStatus.current.albumartist,
                             albumartist_ids: this.playerStatus.current.albumartist_ids,
                             album: this.playerStatus.current.albumName,
                             album_id: this.playerStatus.current.album_id,
                             url: this.playerStatus.current.url };
            this.infoTrack.empty=undefined==this.infoTrack.title &&
                                 undefined==this.infoTrack.track_id &&
                                 undefined==this.infoTrack.artist &&
                                 undefined==this.infoTrack.artist_id &&
                                 undefined==this.infoTrack.artist_ids &&
                                 undefined==this.infoTrack.albumartist &&
                                 undefined==this.infoTrack.albumartist_ids &&
                                 undefined==this.infoTrack.album &&
                                 undefined==this.infoTrack.url;
        },
        trackInfo() {
            if (undefined==this.playerStatus.current.id) {
                bus.$emit('showMessage', i18n('Nothing playing'));
                return;
            }
            this.close();
            bus.$emit('trackInfo', {id: "track_id:"+this.playerStatus.current.id, title:this.playerStatus.current.title, image: this.coverUrl},
                      this.playerStatus.playlist.current, NP_INFO);
        },
        fetchTrackInfo() {
            nowplayingFetchTrackInfo(this);
        },
        fetchArtistInfo() {
            nowplayingFetchArtistInfo(this);
        },
        fetchAlbumInfo() {
            nowplayingFetchAlbumInfo(this);
        },
        isCurrent(data, tab) {
            return data.id==this.info.tabs[tab].reqId;
        },
        showInfo() {
            if (!this.info.show || !this.infoTrack) {
                return;
            }
            if (!this.showTabs) {
                this.fetchTrackInfo();
                this.fetchArtistInfo();
                this.fetchAlbumInfo();
                this.updateLyricsPosition();
            } else if (TRACK_TAB==this.info.tab) {
                this.fetchTrackInfo();
                this.updateLyricsPosition();
            } else if (ARTIST_TAB==this.info.tab) {
                this.fetchArtistInfo();
            } else {
                this.fetchAlbumInfo();
            }
        },
        close() {
            if (this.$store.state.desktopLayout) {
                this.info.show=false;
                this.largeView=false;
            }
        },
        startPositionInterval() {
            this.stopPositionInterval();
            this.positionInterval = setInterval(function () {
                if (undefined!=this.playerStatus.current.time && this.playerStatus.current.time>=0) {
                    var current = new Date();
                    var diff = (current.getTime()-this.playerStatus.current.updated.getTime())/1000.0;
                    this.playerStatus.current.time = this.playerStatus.current.origTime + diff;
                    currentPlayingTrackPosition = this.playerStatus.current.time;
                    this.setPosition();
                    if (this.playerStatus.current.duration && this.playerStatus.current.duration>0 &&
                        this.playerStatus.current.time>=(this.playerStatus.current.duration+2)) {
                        bus.$emit('refreshStatus');
                    }
                }
            }.bind(this), 1000);
        },
        stopPositionInterval() {
            if (undefined!==this.positionInterval) {
                clearInterval(this.positionInterval);
                this.positionInterval = undefined;
            }
        },
        toggleTime() {
            if (this.$store.state.visibleMenus.size>0) {
                return;
            }
            this.showTotal = !this.showTotal;
            setLocalStorageVal("showTotal", this.showTotal);
        },
        setBgndCover() {
            var url = this.coverUrl;
            if ((!url || url==DEFAULT_COVER) && (this.drawBackdrop || this.drawInfoBackdrop)) {
                url='material/backdrops/nowplaying.jpg';
            }
            setBgndCover(this.bgndElement, url);
        },
        playPauseButton(longPress) {
            if (this.$store.state.visibleMenus.size>0) {
                return;
            }
            if (longPress) {
                this.doAction(['stop']);
                bus.$emit('showMessage', i18n('Stop'), 500);
            } else {
                this.doAction([this.playerStatus.isplaying ? 'pause' : 'play']);
            }
        },
        prevButton(skip) {
            if (this.$store.state.visibleMenus.size>0 || queryParams.party) {
                return;
            }
            if (!this.disablePrev) {
                if (skip && this.playerStatus.current.time>=this.$store.state.skipBSeconds) {
                    this.doAction(['time', this.playerStatus.current.time-this.$store.state.skipBSeconds]);
                } else {
                    this.doAction(['button', 'jump_rew']);
                }
            }
        },
        nextButton(skip) {
            if (this.$store.state.visibleMenus.size>0 || queryParams.party) {
                return;
            }
            if (!this.disableNext) {
                if (skip && (this.playerStatus.current.time+this.$store.state.skipFSeconds)<this.playerStatus.current.duration) {
                    this.doAction(['time', this.playerStatus.current.time+this.$store.state.skipFSeconds]);
                } else {
                    this.doAction(['playlist', 'index', '+1']);
                }
            }
        },
        skipBack() {
            this.resetShowOverlayTimeout();
            this.prevButton(true);
        },
        skipForward() {
            this.resetShowOverlayTimeout();
            this.nextButton(true);
        },
        shuffleClicked() {
            if (this.$store.state.visibleMenus.size>0 || queryParams.party) {
                return;
            }
            if (this.shuffAltBtn.show) {
                this.doCommand(this.shuffAltBtn.command, this.shuffAltBtn.tooltip);
            } else if (this.playerStatus.playlist.shuffle===2) {
                this.doAction(['playlist', 'shuffle', 0]);
            } else if (this.playerStatus.playlist.shuffle===1) {
                this.doAction(['playlist', 'shuffle', 2]);
            } else {
                this.doAction(['playlist', 'shuffle', 1]);
            }
        },
        repeatClicked(longPress) {
            if (this.$store.state.visibleMenus.size>0 || queryParams.party) {
                return;
            }
            if (this.repAltBtn.show) {
                this.doCommand(this.repAltBtn.command, this.repAltBtn.tooltip);
            } else {
                if (this.playerStatus.playlist.repeat===0) {
                    if (LMS_P_DSTM) {
                        if (longPress) {
                            bus.$emit('dlg.open', 'dstm');
                        } else if (this.dstm) {
                            lmsCommand(this.$store.state.player.id, ["material-skin-client", "save-dstm"]).then(({data}) => {
                                bus.$emit("dstm", this.$store.state.player.id, 0);
                            });
                        } else {
                            bus.$emit('playerCommand', ['playlist', 'repeat', 2]);
                        }
                    } else {
                        bus.$emit('playerCommand', ['playlist', 'repeat', 2]);
                    }
                } else if (this.playerStatus.playlist.repeat===1) {
                    bus.$emit('playerCommand', ['playlist', 'repeat', 0]);
                } else if (this.playerStatus.playlist.repeat===2) {
                    bus.$emit('playerCommand', ['playlist', 'repeat', 1]);
                    if (LMS_P_DSTM) {
                        lmsCommand(this.$store.state.player.id, ["material-skin-client", "get-dstm"]).then(({data}) => {
                            if (data && data.result && undefined!=data.result.provider) {
                                bus.$emit("dstm", this.$store.state.player.id, data.result.provider);
                            }
                        });
                    }
                }
            }
        },
        showSleep() {
            if (this.$store.state.visibleMenus.size>0 || queryParams.party) {
                return;
            }
            bus.$emit('dlg.open', 'sleep', this.$store.state.player);
        },
        setRating(allowReset) {
            var val = allowReset && this.rating.value==this.rating.setting && this.rating.value<=1 ? 0 : this.rating.value;
            // this.rating.value is updated *before* this setRating click handler is called, so we can use its model value to update LMS
            this.rating.track_id = this.playerStatus.current.id;
            this.rating.album_id = this.playerStatus.current.album_id;
            lmsCommand(this.$store.state.player.id, [LMS_P_RP, "setrating", this.playerStatus.current.id, val]).then(({data}) => {
                if (allowReset && this.rating.track_id==this.playerStatus.current.id) {
                    this.rating.value=val;
                }
                logJsonMessage("RESP", data);
                bus.$emit('refreshStatus');
                bus.$emit('ratingChanged', this.rating.track_id, this.rating.album_id);
            });
        },
        doCommand(command, msg) {
            lmsCommand(this.$store.state.player.id, command).then(({data}) => {
                if (undefined!=msg) {
                    bus.$emit('showMessage', msg);
                }
            });
        },
        clickImage(event) {
            if (this.menu.show) {
                this.menu.show = false;
                return;
            }
            if (this.$store.state.visibleMenus.size>0) {
                return;
            }
            if (!this.desktopLayout && this.$store.state.page!='now-playing') {
                return;
            }
            if (!this.clickTimer) {
                this.clickTimer = setTimeout(function () {
                    this.clearClickTimeout();
                    if (this.$store.state.desktopLayout && !this.largeView) {
                        bus.$emit('expandNowPlaying', true);
                    } else if (this.playerStatus.playlist.count>0) {
                        this.resetShowOverlayTimeout();
                    }
                }.bind(this), LMS_DOUBLE_CLICK_TIMEOUT);
            } else {
                this.clearClickTimeout();
                this.showPic();
            }
        },
        barClicked(ev) {
            if (IS_MOBILE && ev && ev.target && ev.target.className && !ev.target.className.includes('v-icon')) {
                if (!this.desktopLayout) {
                    let touch = getTouchPos(ev);
                    let x = undefined==touch ? ev.x : touch.x;
                    if (MBAR_THICK==this.$store.state.mobileBar && x<(window.innerWidth-50)) {
                        this.$store.commit('setPage', 'now-playing');
                    }
                } else if (window.innerWidth<550 && (ev.x<(window.innerWidth-(window.innerWidth>420 ? 90 : 60)))) {
                    bus.$emit('expandNowPlaying', true);
                }
            }
        },
        clearClickTimeout() {
            if (this.clickTimer) {
                clearTimeout(this.clickTimer);
                this.clickTimer = undefined;
            }
        },
        stopShowOverlayTimeout() {
            clearTimeout(this.showOverlayTimer);
            this.showOverlayTimer=undefined;
        },
        resetShowOverlayTimeout() {
            this.showOverlay = true;
            clearTimeout(this.showOverlayTimer);
            this.showOverlayTimer = setTimeout(function () {
                this.clearShowOverlayTimeout();
            }.bind(this), 3*1000);
        },
        clearShowOverlayTimeout() {
            if (this.showOverlayTimer) {
                clearTimeout(this.showOverlayTimer);
                this.showOverlayTimer = undefined;
                this.showOverlay = false;
            }
        },
        touchStart(event) {
            if (event.srcElement.classList.contains("np-title") || event.srcElement.classList.contains("np-text") || event.srcElement.classList.contains("np-text-landscape")) {
                return;
            }
            if (this.$store.state.swipeVolume && !this.menu.show && event.touches && event.touches.length>0 && VOL_STD==this.playerStatus.dvc) {
                this.touch={x:event.touches[0].clientX, y:event.touches[0].clientY, moving:false};
                this.lastSentVolume=-1;
            }
        },
        touchEnd() {
            if (this.touch && this.touch.moving && this.overlayVolume>=0 && this.overlayVolume!=this.lastSentVolume && VOL_STD==this.playerStatus.dvc) {
                bus.$emit('playerCommand', ["mixer", "volume", this.overlayVolume]);
            }
            this.touch=undefined;
            this.overlayVolume=-1;
            this.lastSentVolume=-1;
            this.cancelSendVolumeTimer();
        },
        touchMoving(event) {
            if (undefined!=this.touch && VOL_STD==this.playerStatus.dvc) {
                if (Math.abs(event.touches[0].clientX-this.touch.x)<48) {
                    if (!this.touch.moving && Math.abs(event.touches[0].clientY-this.touch.y)>10) {
                        this.touch.moving=true;
                        this.overlayVolume=Math.abs(this.volume);
                        this.lastSentVolume=this.overlayVolume;
                    }
                    const VOL_STEP_PX = 25;
                    if (Math.abs(event.touches[0].clientY-this.touch.y)>=VOL_STEP_PX) {
                        var steps = Math.floor(Math.abs(event.touches[0].clientY-this.touch.y) / VOL_STEP_PX);
                        if (steps>0) {
                            var inc = event.touches[0].clientY<this.touch.y;
                            for (var i=0; i<steps; ++i) {
                                this.overlayVolume = adjustVolume(Math.abs(this.overlayVolume), inc);
                                if (this.overlayVolume<0) {
                                    this.overlayVolume=0;
                                    break;
                                } else if (this.overlayVolume>100) {
                                    this.overlayVolume=100;
                                    break;
                                }
                            }
                            this.touch.y += steps*VOL_STEP_PX*(inc ? -1 : 1);
                            this.resetSendVolumeTimer();
                        }
                    }
                }
            }
        },
        cancelSendVolumeTimer() {
            if (undefined!==this.sendVolumeTimer) {
                clearTimeout(this.sendVolumeTimer);
                this.sendVolumeTimer = undefined;
            }
        },
        resetSendVolumeTimer() {
            this.cancelSendVolumeTimer();
            this.sendVolumeTimer = setTimeout(function () {
                if (this.overlayVolume!=this.lastSentVolume) {
                    bus.$emit('playerCommand', ["mixer", "volume", this.overlayVolume]);
                    this.lastSentVolume=this.overlayVolume;
                }
            }.bind(this), LMS_VOLUME_DEBOUNCE);
        },
        checkWindowSize() {
            this.checkLandscape();
            this.sizeCheckDelay = 0;
            if (window.innerHeight<LMS_MIN_NP_LARGE_INFO_HEIGHT) {
                this.largeView = false;
                this.info.show = false;
            }
        },
        checkLandscape() {
            // wide=0 => controls under whole width
            // wide=2 => controls under text only
            if (undefined==this.navPad) {
                let val = parseInt(window.getComputedStyle(document.documentElement).getPropertyValue('--sab').replace('px', ''));
                this.navPad = undefined==val || isNaN(val) ? 0 : val;
            }
            let maxImgHeight = window.innerHeight - (this.$store.state.desktopLayout ? 50 : (this.navPad + 102));
            let maxImgWidth = (window.innerWidth/2.0)-32;
            this.landscape = window.innerWidth >= (window.innerHeight*queryParams.npRatio) && window.innerWidth>=450;
            this.wide = window.innerWidth>=600 &&
                        window.innerWidth>=(window.innerHeight*1.25) &&
                        maxImgWidth>=maxImgHeight
                            ? 2 /*: window.innerHeight>340 ? 1*/ : 0;
            this.windowWidth = Math.floor(window.innerWidth / 25) * 25;
            bus.$emit('nowPlayingWide', this.wide);
        },
        itemClicked(tab, section, index, event) {
            nowplayingItemClicked(this, tab, section, index, event);
        },
        moreClicked(tab, section) {
            nowplayingMoreClicked(this, tab, section);
        },
        toggleGrid(tab, section) {
            nowplayingToggleGrid(this, tab, section);
        },
        controlBar(force) {
            let showNpBar = !this.disableBtns;
            if (showNpBar!=this.showNpBar || force) {
                let mbar = this.$store.state.mobileBar;
                document.documentElement.style.setProperty('--desktop-npbar-height', !showNpBar ? '0px' : this.desktopBarHeight);
                document.documentElement.style.setProperty('--desktop-npbar-height-thin', !showNpBar ? '0px' : this.desktopBarThinHeight);
                document.documentElement.style.setProperty('--mobile-npbar-height', !showNpBar || MBAR_NONE==mbar ? '0px' : (MBAR_THIN==mbar ? this.mobileBarThinHeight : this.mobileBarThickHeight));
                document.documentElement.style.setProperty('--npbar-border-color', !showNpBar ? 'transparent' : 'var(--bottom-toolbar-border-color)');
            }
        },
        showTimeTooltip() {
            this.startTooltipTimeout();
            this.timeTooltip.show = true;
        },
        hideTimeTooltip() {
            this.timeTooltip.show = false;
            this.cancelTooltipTimeout();
        },
        startTooltipTimeout() {
            this.cancelTooltipTimeout();
            this.timeTooltip.timeout = setTimeout(function () {
                this.hideTimeTooltip();
            }.bind(this), 2000);
        },
        cancelTooltipTimeout() {
            if (undefined!==this.timeTooltip.timeout) {
                clearTimeout(this.timeTooltip.timeout);
                this.timeTooltip.timeout = undefined;
            }
        },
        tabChanged(tab) {
            setLocalStorageVal("nptab", tab);
        },
        showConfigMenu(event) {
            nowPlayingConfigMenu(this, event);
        },
        tabTextEnd(event) {
            this.clearClickTimeout();
            viewHandleSelectedText(this, event);
        }
    },
    filters: {
        displayTime: function (value) {
            if (undefined==value || value<0) {
                return '';
            }
            return formatSeconds(Math.floor(value));
        },
        svgIcon: function (name, dark) {
            return "/material/svg/"+name+"?c="+(dark ? LMS_DARK_SVG : LMS_LIGHT_SVG)+"&r="+LMS_MATERIAL_REVISION;
        },
        emblem: function (e) {
            return "/material/svg/"+e.name+"?c="+e.color.substr(1)+"&r="+LMS_MATERIAL_REVISION;
        },
        limitStr: function(str) {
            if (undefined==str || str.length<80) {
                return str;
            }
            return str.substring(0, 80) + "\u2026";
        },
        trackCount(current, total, sep) {
            if (undefined==current || undefined==total || total<2) {
                return "";
            }
            return (undefined==sep ? "" : sep)+i18n("%1 of %2", (current+1), total);
        },
        tooltip: function (str, key, showShortcut) {
            return showShortcut && undefined!=key ? ttShortcutStr(str, key, false, true) : str;
        }
    },
    watch: {
        'info.show': function(val) {
            // Indicate that dialog is/isn't shown, so that swipe is controlled
            bus.$emit('infoDialog', val);
            this.$store.commit('dialogOpen', {name:'info-dialog', shown:val});
            this.setInfoTrack();
            this.showInfo();
        },
        'info.tab': function(tab) {
            this.showInfo();
        },
        'info.showTabs': function() {
            setLocalStorageVal("showTabs", this.info.showTabs);
        },
        'info.sync': function() {
            setLocalStorageVal("syncInfo", this.info.sync);
            if (this.info.sync) {
                this.setInfoTrack();
                this.showInfo();
            }
        },
        'largeView': function(val) {
            if (val) {
                // Save current style so can reset when largeview disabled
                if (!this.before) {
                    var elem = document.getElementById("np-bar");
                    if (elem) {
                        this.before = elem.style;
                    }
                }
                this.$nextTick(function () {
                    this.page = document.getElementById("np-page");
                });
            } else {
                if (this.before) {
                    this.$nextTick(function () {
                        var elem = document.getElementById("np-bar");
                        if (elem) {
                            elem.style = this.before;
                        }
                    });
                }
                this.page = undefined;
            }
            bus.$emit('nowPlayingExpanded', val);
        },
        'menu.show': function(newVal) {
            this.$store.commit('menuVisible', {name:'nowplaying', shown:newVal});
            if (newVal) {
                this.stopShowOverlayTimeout();
            } else {
                this.menu.selection = undefined;
                clearTextSelection();
                if (this.showOverlay) {
                    this.resetShowOverlayTimeout();
                }
            }
        },
        'disableBtns': function(newVal) {
            this.controlBar();
        },
        '$store.state.desktopLayout': function(newVal) {
            this.controlBar(true);
        }
    },
    computed: {
        mobileBar() {
            return this.$store.state.mobileBar
        },
        page() {
            return this.$store.state.page;
        },
        techInfo() {
            return this.$store.state.techInfo &&
                   ( !this.$store.state.desktopLayout || this.largeView || !this.showRatings) &&
                   ( (!this.repAltBtn.show && !this.shuffAltBtn.show) || !this.$store.state.desktopLayout || this.largeView )
        },
        technicalInfo() {
            return undefined==this.playerStatus.current.technicalInfo || this.playerStatus.current.length==0
                ? undefined
                : undefined==this.playerStatus.current.source || this.playerStatus.current.source.other || undefined==this.playerStatus.current.source.text || this.playerStatus.current.source.text.length<1
                    ? this.playerStatus.current.technicalInfo
                    : (this.playerStatus.current.source.text+SEPARATOR+this.playerStatus.current.technicalInfo);
        },
        formattedTime() {
            return this.playerStatus && this.playerStatus.current
                        ? !this.showTotal && undefined!=this.playerStatus.current.time && this.playerStatus.current.duration>0
                            ? formatSeconds(Math.floor(this.playerStatus.current.time))+" / -"+
                              formatSeconds(Math.floor(this.playerStatus.current.duration-this.playerStatus.current.time))
                            : (undefined!=this.playerStatus.current.time ? formatSeconds(Math.floor(this.playerStatus.current.time)) : "") +
                              (undefined!=this.playerStatus.current.time && this.playerStatus.current.duration>0 ? " / " : "") +
                              (this.playerStatus.current.duration>0 ? formatSeconds(Math.floor(this.playerStatus.current.duration)) : "")
                        : undefined;
        },
        darkUi() {
            return this.$store.state.darkUi
        },
        npBarRatings() {
            if (!this.playerStatus || !this.playerStatus.current) {
                return false;
            }
            if (this.repAltBtn.show || this.shuffAltBtn.show) {
                return true; // Use same space for these...
            }
            return this.showRatings;
        },
        showRatings() {
            return this.$store.state.showRating && this.playerStatus && this.playerStatus.current &&
                   this.playerStatus.current.duration && this.playerStatus.current.duration>0 && undefined!=this.playerStatus.current.id &&
                   !(""+this.playerStatus.current.id).startsWith("-");
        },
        maxRating() {
            return this.$store.state.maxRating
        },
        title() {
            if (this.$store.state.nowPlayingTrackNum && this.playerStatus.current.tracknum) {
                return formatTrackNum(this.playerStatus.current)+SEPARATOR+this.playerStatus.current.title;
            }
            return this.playerStatus.current.title;
        },
        desktopLayout() {
            return this.$store.state.desktopLayout
        },
        totalTogglesQueue() {
            return this.$store.state.desktopLayout && !this.$store.state.pinQueue
        },
        noPlayer() {
            return !this.$store.state.player
        },
        drawBgndImage() {
            return this.$store.state.nowPlayingBackdrop && undefined!=this.coverUrl && LMS_BLANK_COVER!=this.coverUrl && DEFAULT_COVER!=this.coverUrl && DEFAULT_RADIO_COVER!=this.coverUrl
        },
        drawBackdrop() {
            return !this.drawBgndImage && this.$store.state.nowPlayingBackdrop && this.$store.state.useDefaultBackdrops
        },
        drawInfoBgndImage() {
            return this.$store.state.infoBackdrop && undefined!=this.coverUrl && LMS_BLANK_COVER!=this.coverUrl && DEFAULT_COVER!=this.coverUrl && DEFAULT_RADIO_COVER!=this.coverUrl
        },
        drawInfoBackdrop() {
            return !this.drawInfoBgndImage && this.$store.state.infoBackdrop && this.$store.state.useDefaultBackdrops
        },
        coloredToolbars() {
            return this.$store.state.desktopLayout && this.$store.state.coloredToolbars
        },
        keyboardControl() {
            return this.$store.state.keyboardControl && !IS_MOBILE
        },
        transCvr() {
            return undefined!=this.coverUrl && (this.coverUrl.includes(DEFAULT_COVER) || this.coverUrl.includes(LMS_BLANK_COVER) || this.coverUrl.includes(DEFAULT_RADIO_COVER))
        },
        artistAndComposerLine() {
            return this.$store.state.nowPlayingContext && undefined!=this.playerStatus.current.artistAndComposerWithContext ? this.playerStatus.current.artistAndComposerWithContext : this.playerStatus.current.artistAndComposer
        },
        albumLine() {
            return this.$store.state.nowPlayingContext && undefined!=this.playerStatus.current.artistAndComposerWithContext && !isEmpty(this.playerStatus.current.albumLine) ? i18n('<obj>from</obj> %1', this.playerStatus.current.albumLine).replaceAll("<obj>", "<obj class=\"ext-details\">") : this.playerStatus.current.albumLine
        },
        barInfoWithContext() {
            if (this.$store.state.nowPlayingContext && this.windowWidth-380>this.barInfoWithContextWidth && undefined!=this.playerStatus.current.artistAndComposerWithContext && this.albumLine) {
                return replaceBr(this.artistAndComposerLine, " ")+" " + this.albumLine
            }
            return undefined;
        },
        skipBSeconds() {
            return this.$store.state.skipBSeconds
        },
        skipFSeconds() {
            return this.$store.state.skipFSeconds
        }
    },
    beforeDestroy() {
        this.stopPositionInterval();
        this.clearClickTimeout();
        this.cancelTooltipTimeout();
        this.clearShowOverlayTimeout();
    }
});
