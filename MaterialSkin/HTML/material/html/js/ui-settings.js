/**
 * LMS-Material
 *
 * Copyright (c) 2018-2026 Craig Drummond <craig.p.drummond@gmail.com>
 * MIT license.
 */
'use strict';

Vue.component('lms-ui-settings', {
    template: `
<div>
<v-dialog v-model="show" v-if="show" persistent no-click-animation scrollable fullscreen>
 <v-card>
  <v-card-title class="settings-title">
   <v-toolbar app-data class="dialog-toolbar" @mousedown="mouseDown" id="uisettings-toolbar">
    <lms-windowcontrols v-if="queryParams.nativeTitlebar && queryParams.tbarBtnsPos=='l'"></lms-windowcontrols>
    <div class="drag-area-left"></div>
    <v-btn flat icon @click="close" :title="ttShortcutStr(i18n('Go back'), 'esc')"><v-icon>arrow_back</v-icon></v-btn>
    <v-toolbar-title>{{width>=450 ? TB_UI_SETTINGS.title+serverName : TB_UI_SETTINGS.title}}</v-toolbar-title>
    <v-spacer class="drag-area"></v-spacer>
    <lms-windowcontrols v-if="queryParams.nativeTitlebar && queryParams.tbarBtnsPos=='r'"></lms-windowcontrols>
   </v-toolbar>
  </v-card-title>
  <v-card-text>
   <v-list two-line subheader class="settings-list">
    <v-header class="dialog-section-header">{{i18n('General')}}</v-header>

    <v-list-tile>
     <v-select menu-props="auto" :items="themes" :label="i18n('Theme')" v-model="theme" item-text="label" item-value="key"></v-select>
    </v-list-tile>
    <v-divider></v-divider>
    <v-list-tile>
     <v-list-tile-content>
      <v-select style="width:100%" menu-props="auto" :items="colorUsages" :label="i18n('Color')" v-model="colorUsage" item-text="label" item-value="key" @change="if(colorUsage==COLOR_USE_STANDARD) color=LMS_DEFAULT_COLOR"></v-select>
      <div class="color-grid" v-if="colorUsage==COLOR_USE_STANDARD">
       <template v-for="(item, index) in colorList.colors">
        <div v-if="item.lcolor" @click="setColor(item.key)" :style="{'background':'linear-gradient(to right,'+item.lcolor+' 0%, '+item.lcolor+' 50%, '+item.color+' 50%, '+item.color+' 100%)'}" class="color-circle" v-bind:class="{'selected-color-circle':item.key==color}"></div>
        <div v-else-if="item.color" @click="setColor(item.key)" :style="{'background-color':item.color}" class="color-circle" v-bind:class="{'selected-color-circle':item.key==color}"></div>
       </template>
       <div v-for="(item, index) in userColors" @click="setColor(item.key)" :style="{'background-color':item.color}" class="color-circle" v-bind:class="{'selected-color-circle':item.key==color}"></div>
      </div>
     </v-list-tile-content>
    </v-list-tile>
    <v-divider></v-divider>

    <v-list-tile>
     <v-list-tile-content @click="colorToolbars = !colorToolbars" class="switch-label">
      <v-list-tile-title>{{i18n('Color toolbars')}}</v-list-tile-title>
      <v-list-tile-sub-title>{{i18n('Use chosen color for toolbars.')}}</v-list-tile-sub-title>
     </v-list-tile-content>
     <v-list-tile-action><m3-switch v-model="colorToolbars"></m3-switch></v-list-tile-action>
    </v-list-tile>
    <v-divider></v-divider>

    <v-list-tile v-if="cMixSupported && allowTint">
    <v-list-tile-content @click="tinted = !tinted" class="switch-label">
     <v-list-tile-title>{{i18n('Tint background')}}</v-list-tile-title>
     <v-list-tile-sub-title>{{i18n('Tint background with chosen color.')}}</v-list-tile-sub-title>
    </v-list-tile-content>
    <v-list-tile-action><m3-switch v-model="tinted"></m3-switch></v-list-tile-action>
   </v-list-tile>
   <v-divider v-if="cMixSupported && allowTint"></v-divider>

    <v-list-tile v-if="allowLayoutAdjust">
     <v-select :items="layoutItems" :label="i18n('Application layout')" v-model="layout" item-text="label" item-value="key"></v-select>
    </v-list-tile>
    <v-divider v-if="allowLayoutAdjust"></v-divider>

    <v-list-tile>
     <v-select :items="mobileBars" :label="i18n('Mobile layout now-playing bar')" v-model="mobileBar" item-text="label" item-value="key"></v-select>
    </v-list-tile>
    <v-divider></v-divider>

    <v-list-tile>
     <v-select :items="fontSizes" :label="i18n('Font size')" v-model="fontSize" item-text="label" item-value="key"></v-select>
    </v-list-tile>
    <v-divider></v-divider>

    <v-list-tile>
     <v-select :items="volumeSteps" :label="i18n('Volume step')" v-model="volumeStep" item-text="label" item-value="value"></v-select>
    </v-list-tile>
    <v-divider></v-divider>

    <v-list-tile v-if="mediaControlsSupported">
     <v-list-tile-content @click="mediaControls = !mediaControls" class="switch-label">
      <v-list-tile-title>{{IS_MOBILE ? i18n('Lock screen and notifications') : i18n('Media keys and notifications')}}</v-list-tile-title>
      <v-list-tile-sub-title>{{IS_MOBILE ? i18n('Show playback controls on lock screen and in notification area.') : i18n('Allow control via media keys.')}} <v-btn flat icon style="margin-top:4px;height:18px;width:18px; opacity:var(--sub-opacity)" @click.stop="mediaControlsInfo($event)"><v-icon small>help_outline</v-icon></v-btn</v-list-tile-sub-title>
     </v-list-tile-content>
     <v-list-tile-action><m3-switch v-model="mediaControls"></m3-switch></v-list-tile-action>
    </v-list-tile>
    <v-divider v-if="mediaControlsSupported"></v-divider>

    <v-list-tile v-if="!IS_MOBILE">
     <v-list-tile-content @click="keyboardControl = !keyboardControl" class="switch-label">
      <v-list-tile-title>{{i18n('Keyboard shortcuts')}}</v-list-tile-title>
      <v-list-tile-sub-title>{{i18n("Enable keyboard shortcuts.")}} <v-btn flat icon style="margin-top:4px;height:18px;width:18px; opacity:var(--sub-opacity)" @click.stop="keyboardInfo($event)"><v-icon small>help_outline</v-icon></v-btn</v-list-tile-sub-title>
     </v-list-tile-content>
     <v-list-tile-action><m3-switch v-model="keyboardControl"></m3-switch></v-list-tile-action>
    </v-list-tile>
    <v-divider v-if="!IS_MOBILE"></v-divider>

    <v-list-tile>
     <v-list-tile-content @click="roundCovers = !roundCovers" class="switch-label">
      <v-list-tile-title>{{i18n('Round covers')}}</v-list-tile-title>
      <v-list-tile-sub-title>{{i18n('Round the corners of cover-art, etc.')}}</v-list-tile-sub-title>
     </v-list-tile-content>
     <v-list-tile-action><m3-switch v-model="roundCovers"></m3-switch></v-list-tile-action>
    </v-list-tile>
    <v-divider></v-divider>

    <v-list-tile>
     <v-list-tile-content @click="useDefaultBackdrops = !useDefaultBackdrops" class="switch-label">
      <v-list-tile-title>{{i18n('Use default backgrounds')}}</v-list-tile-title>
      <v-list-tile-sub-title>{{i18n('If background images have been enabled (see options below), then use a default image if there is no current image.')}}</v-list-tile-sub-title>
     </v-list-tile-content>
     <v-list-tile-action><m3-switch v-model="useDefaultBackdrops"></m3-switch></v-list-tile-action>
    </v-list-tile>
    <v-divider></v-divider>

    <v-list-tile v-if="LMS_STATS_ENABLED">
     <v-list-tile-content @click="showRating = !showRating" class="switch-label">
      <v-list-tile-title>{{i18n('Show rating')}}</v-list-tile-title>
      <v-list-tile-sub-title>{{i18n('Display rating stars.')}}{{undefined==LMS_P_RP  ? (" "+i18n("NOTE: Changing ratings requires an additional plugin.")) : ""}}</v-list-tile-sub-title>
     </v-list-tile-content>
     <v-list-tile-action><m3-switch v-model="showRating"></m3-switch></v-list-tile-action>
    </v-list-tile>

    <v-divider v-if="LMS_STATS_ENABLED"></v-divider>
    <v-list-tile>
     <v-select :items="homeButtonValues" :label="i18n('Show home button')" v-model="homeButton" item-text="label" item-value="key"></v-select>
    </v-list-tile>
    <v-list-tile-sub-title style="padding-bottom:16px">{{i18n("When navigating into lists, show a home button to quickly navigate to the main (home) screen. Otherwise you can click on the title to show a menu that contains 'Home'.")}}</v-list-tile-sub-title>
    <v-divider></v-divider>

    <v-divider v-if="showMoveDialogs"></v-divider>
    <v-list-tile v-if="showMoveDialogs">
     <v-list-tile-content @click="moveDialogs = !moveDialogs" class="switch-label">
      <v-list-tile-title>{{i18n('Reposition dialogs')}}</v-list-tile-title>
      <v-list-tile-sub-title>{{i18n('On larger displays, attempt to move dialogs closer to the associated item.')}}</v-list-tile-sub-title>
     </v-list-tile-content>
     <v-list-tile-action><m3-switch v-model="moveDialogs"></m3-switch></v-list-tile-action>
    </v-list-tile>

    <v-divider v-if="hasPassword"></v-divider>
    <v-list-tile v-if="hasPassword">
     <v-text-field :label="i18n('Settings password')" clearable autocorrect="off" v-model="password" class="lms-search" :append-icon="showPassword ? 'visibility_off' : 'visibility'" @click:append="() => (showPassword = !showPassword)" :type="showPassword ? 'text' : 'password'"></v-text-field>
    </v-list-tile>

    <div class="dialog-padding"></div>
    <v-header class="dialog-section-header">{{i18n('Browse')}}</v-header>

    <v-list-tile>
     <v-list-tile-content @click="sortFavorites = !sortFavorites" class="switch-label">
      <v-list-tile-title>{{i18n('Sort favorites list')}}</v-list-tile-title>
      <v-list-tile-sub-title>{{i18n('Alphabetically sort favorites, rather than server supplied order.')}}</v-list-tile-sub-title>
     </v-list-tile-content>
     <v-list-tile-action><m3-switch v-model="sortFavorites"></m3-switch></v-list-tile-action>
    </v-list-tile>
    <v-divider></v-divider>

    <v-list-tile>
     <v-list-tile-content @click="browseBackdrop = !browseBackdrop" class="switch-label">
      <v-list-tile-title>{{i18n('Draw background')}}</v-list-tile-title>
      <v-list-tile-sub-title>{{i18n('Use artist or cover images as background.')}}</v-list-tile-sub-title>
     </v-list-tile-content>
     <v-list-tile-action><m3-switch v-model="browseBackdrop"></m3-switch></v-list-tile-action>
    </v-list-tile>
    <v-divider></v-divider>

    <v-list-tile>
     <v-list-tile-content @click="browseTechInfo = !browseTechInfo" class="switch-label">
      <v-list-tile-title>{{i18n('Display technical info')}}</v-list-tile-title>
      <v-list-tile-sub-title>{{i18n('Show file type, bitrate, etc.')}}</v-list-tile-sub-title>
     </v-list-tile-content>
     <v-list-tile-action><m3-switch v-model="browseTechInfo"></m3-switch></v-list-tile-action>
    </v-list-tile>
    <v-divider></v-divider>

    <v-list-tile>
     <v-list-tile-content @click="browseContext = !browseContext" class="switch-label">
      <v-list-tile-title>{{i18n('Show artist context, etc.')}}</v-list-tile-title>
      <v-list-tile-sub-title>{{i18n("Show 'performed by', 'from', etc. when listing track details (e.g. Title by Artist from Album).")}}</v-list-tile-sub-title>
     </v-list-tile-content>
    <v-list-tile-action><m3-switch v-model="browseContext"></m3-switch></v-list-tile-action>
    </v-list-tile>
    <v-divider></v-divider>

    <v-list-tile>
     <v-list-tile-content @click="gridPerView = !gridPerView" class="switch-label">
      <v-list-tile-title>{{i18n('Save list/grid per view')}}</v-list-tile-title>
      <v-list-tile-sub-title>{{i18n('Save the choice of list or grid separately per view type (home screen, artists, etc.), otherwise the same setting will be used for all applicable views.')}}</v-list-tile-sub-title>
     </v-list-tile-content>
     <v-list-tile-action><m3-switch v-model="gridPerView"></m3-switch></v-list-tile-action>
    </v-list-tile>
    <v-divider></v-divider>

    <v-list-tile>
     <v-list-tile-content class="switch-label">
      <v-list-tile-title>{{i18n('Home screen items')}}</v-list-tile-title>
      <v-list-tile-sub-title>{{i18n("Check the standard items which you wish to appear on the home screen.")}} {{i18n("The order of 'Scrollable list' items can be changed, here, by drag and drop.")}} {{i18n("(NOTE: These lists are only shown when using the grid view. If 'Explore' is not selected, then it will appear as a standard grid at the end. 'Categories' configures the standard items shown in 'Explore'.)")}}</v-list-tile-sub-title>
     <v-list-tile-content/>
    </v-list-tile>

    <div style="padding-left:12px">{{i18n('Scrollable lists')}} <v-btn @click.stop="showDetailedHomeDialog($event)" flat icon class="settings-list-checkbox-action"><v-icon>settings</v-icon></v-btn></div>
    <div v-if="haveScrollableLists">
     <v-list-tile v-for="(item, index) in detailedHomeItems" class="settings-list-thin-item" @dragstart.native="dragStart(index, $event)" @dragenter.prevent="" @dragend.native="dragEnd()" @dragover.native="dragOver(index, $event)" @drop.native="drop(index, $event)" draggable v-bind:class="{'highlight-drop':dropIndex==index, 'highlight-drag':dragIndex==index}">
      <v-avatar>
       <v-icon v-if="undefined!=detailedHomeValues[item].icon">{{detailedHomeValues[item].icon}}</v-icon>
       <img v-else-if="detailedHomeValues[item].svg" class="svg-img" :src="detailedHomeValues[item].svg | svgIcon(darkUi)"></img>
      </v-avatar>
      <div>{{detailedHomeValues[item].title}}</div>
     </v-list-tile>
    </div>
    <v-list-tile-sub-title v-else style="padding-left:12px">{{i18n("No scrollable lists have been enabled. Use the 'cog' icon (above) to select the lists you would like to appear on the home screen.")}}</v-list-tile-sub-title>
    <div class="dialog-padding"></div>
    <div style="padding-left:12px">{{i18n('Categories')}}</div>
    <template v-for="(item, index) in showItems">
     <div style="display:flex" v-if="item.id!=TOP_RADIO_ID || !lmsOptions.combineAppsAndRadio">
      <v-checkbox v-model="item.show" :label="item.name" class="settings-list-checkbox"></v-checkbox>
      <v-btn v-if="item.id==TOP_MYMUSIC_ID" @click.stop="showBrowseModesDialog($event)" flat icon class="settings-list-checkbox-action"><v-icon>settings</v-icon></v-btn>
     </div>
    </template>

    <div class="dialog-padding"></div>
    <v-header class="dialog-section-header">{{i18n('Now Playing')}}</v-header>

    <v-list-tile>
     <v-list-tile-content @click="nowPlayingTrackNum = !nowPlayingTrackNum" class="switch-label">
      <v-list-tile-title>{{i18n('Show track number')}}</v-list-tile-title>
      <v-list-tile-sub-title>{{i18n("Show track number next to title.")}}</v-list-tile-sub-title>
     </v-list-tile-content>
     <v-list-tile-action><m3-switch v-model="nowPlayingTrackNum"></m3-switch></v-list-tile-action>
    </v-list-tile>
    <v-divider></v-divider>

    <v-list-tile v-if="SUPPORTS_TOUCH">
     <v-list-tile-content @click="swipeChangeTrack = !swipeChangeTrack" class="switch-label">
      <v-list-tile-title>{{i18n('Swipe to change track')}}</v-list-tile-title>
      <v-list-tile-sub-title>{{i18n("Swipe left and right (on cover in mobile layout) to change track.")}}</v-list-tile-sub-title>
     </v-list-tile-content>
     <v-list-tile-action><m3-switch v-model="swipeChangeTrack"></m3-switch></v-list-tile-action>
    </v-list-tile>
    <v-divider v-if="SUPPORTS_TOUCH"></v-divider>

    <v-list-tile v-if="SUPPORTS_TOUCH">
     <v-list-tile-content @click="swipeVolume = !swipeVolume" class="switch-label">
      <v-list-tile-title>{{i18n('Swipe to change volume')}}</v-list-tile-title>
      <v-list-tile-sub-title>{{i18n("Swipe up and down to change current volume.")}}</v-list-tile-sub-title>
     </v-list-tile-content>
     <v-list-tile-action><m3-switch v-model="swipeVolume"></m3-switch></v-list-tile-action>
    </v-list-tile>
    <v-divider v-if="SUPPORTS_TOUCH"></v-divider>

    <v-list-tile>
     <v-select :items="skipSecondsOptions" :label="i18n('Skip backward')" v-model="skipBSeconds" item-text="label" item-value="value"></v-select>
    </v-list-tile>
    <v-divider></v-divider>
    <v-list-tile>
     <v-select :items="skipSecondsOptions" :label="i18n('Skip forward')" v-model="skipFSeconds" item-text="label" item-value="value"></v-select>
    </v-list-tile>
    <v-divider></v-divider>

    <v-list-tile>
     <v-list-tile-content @click="nowPlayingClock = !nowPlayingClock" class="switch-label">
      <v-list-tile-title>{{i18n('Show current date and time')}}</v-list-tile-title>
      <v-list-tile-sub-title>{{i18n("Show current date and time in main toolbar if there is sufficient space.")}}</v-list-tile-sub-title>
     </v-list-tile-content>
     <v-list-tile-action><m3-switch v-model="nowPlayingClock"></m3-switch></v-list-tile-action>
    </v-list-tile>
    <v-divider></v-divider>

    <v-list-tile>
     <v-list-tile-content @click="nowPlayingBackdrop = !nowPlayingBackdrop" class="switch-label">
      <v-list-tile-title>{{i18n('Draw background')}}</v-list-tile-title>
      <v-list-tile-sub-title>{{i18n('Use cover of current track as background.')}}</v-list-tile-sub-title>
     </v-list-tile-content>
     <v-list-tile-action><m3-switch v-model="nowPlayingBackdrop"></m3-switch></v-list-tile-action>
    </v-list-tile>
    <v-divider></v-divider>

    <v-list-tile>
     <v-list-tile-content @click="nowPlayingFull = !nowPlayingFull" class="switch-label">
      <v-list-tile-title>{{i18n('Use full screen for background')}}</v-list-tile-title>
      <v-list-tile-sub-title>{{i18n('Cover whole view (including toolbars, etc.) with background image.')}}</v-list-tile-sub-title>
     </v-list-tile-content>
     <v-list-tile-action><m3-switch v-model="nowPlayingFull"></m3-switch></v-list-tile-action>
    </v-list-tile>
    <v-divider></v-divider>

    <v-list-tile>
     <v-list-tile-content @click="techInfo = !techInfo" class="switch-label">
      <v-list-tile-title>{{i18n('Display technical info')}}</v-list-tile-title>
      <v-list-tile-sub-title>{{i18n('Show file type, bitrate, etc.')}}</v-list-tile-sub-title>
     </v-list-tile-content>
     <v-list-tile-action><m3-switch v-model="techInfo"></m3-switch></v-list-tile-action>
    </v-list-tile>
    <v-divider></v-divider>

    <v-list-tile>
     <v-list-tile-content @click="nowPlayingContext = !nowPlayingContext" class="switch-label">
      <v-list-tile-title>{{i18n('Show artist context, etc.')}}</v-list-tile-title>
      <v-list-tile-sub-title>{{i18n("Show 'performed by', 'from', etc. when listing track details (e.g. Title by Artist from Album).")}}</v-list-tile-sub-title>
     </v-list-tile-content>
    <v-list-tile-action><m3-switch v-model="nowPlayingContext"></m3-switch></v-list-tile-action>
    </v-list-tile>
    <v-divider></v-divider>

    <div class="dialog-padding"></div>
    <v-header class="dialog-section-header">{{i18n('Queue')}}</v-header>

    <v-list-tile>
     <v-list-tile-content @click="autoScrollQueue = !autoScrollQueue" class="switch-label">
      <v-list-tile-title>{{i18n('Auto-scroll to current track')}}</v-list-tile-title>
      <v-list-tile-sub-title>{{i18n('Scroll play queue when current track changes.')}}</v-list-tile-sub-title>
     </v-list-tile-content>
     <v-list-tile-action><m3-switch v-model="autoScrollQueue"></m3-switch></v-list-tile-action>
    </v-list-tile>
    <v-divider></v-divider>

    <v-list-tile>
     <v-list-tile-content @click="queueShowTrackNum = !queueShowTrackNum" class="switch-label">
      <v-list-tile-title>{{i18n('Show track number')}}</v-list-tile-title>
      <v-list-tile-sub-title>{{i18n("Show track number next to title.")}}</v-list-tile-sub-title>
     </v-list-tile-content>
     <v-list-tile-action><m3-switch v-model="queueShowTrackNum"></m3-switch></v-list-tile-action>
    </v-list-tile>
    <v-divider></v-divider>

    <v-list-tile>
     <v-list-tile-content @click="queueThreeLines = !queueThreeLines" class="switch-label">
      <v-list-tile-title>{{i18n('Three lines for track view')}}</v-list-tile-title>
      <v-list-tile-sub-title>{{lmsOptions.supportReleaseTypes ? i18n("Use three lines (title, artist, release) to show track details.") : i18n("Use three lines (title, artist, album) to show track details.")}}</v-list-tile-sub-title>
     </v-list-tile-content>
     <v-list-tile-action><m3-switch v-model="queueThreeLines"></m3-switch></v-list-tile-action>
    </v-list-tile>
    <v-divider></v-divider>

    <v-list-tile>
     <v-list-tile-content @click="queueBackdrop = !queueBackdrop" class="switch-label">
      <v-list-tile-title>{{i18n('Draw background')}}</v-list-tile-title>
      <v-list-tile-sub-title>{{desktopLayout ? i18n('Use cover of current track as background (when queue is pinned).') : i18n('Use cover of current track as background.')}}</v-list-tile-sub-title>
     </v-list-tile-content>
     <v-list-tile-action><m3-switch v-model="queueBackdrop"></m3-switch></v-list-tile-action>
    </v-list-tile>
    <v-divider></v-divider>

    <v-list-tile>
     <v-list-tile-content @click="queueContext = !queueContext" class="switch-label">
      <v-list-tile-title>{{i18n('Show artist context, etc.')}}</v-list-tile-title>
      <v-list-tile-sub-title>{{i18n("Show 'performed by', 'from', etc. when listing track details (e.g. Title by Artist from Album).")}}</v-list-tile-sub-title>
     </v-list-tile-content>
    <v-list-tile-action><m3-switch v-model="queueContext"></m3-switch></v-list-tile-action>
    </v-list-tile>
    <v-divider></v-divider>

    <v-list-tile>
     <v-list-tile-content @click="autoCloseQueue = !autoCloseQueue" class="switch-label">
      <v-list-tile-title>{{i18n('Auto-close')}}</v-list-tile-title>
      <v-list-tile-sub-title>{{i18n("Automatically close queue, in desktop layout and not pinned, a few seconds after last interaction.")}}</v-list-tile-sub-title>
     </v-list-tile-content>
    <v-list-tile-action><m3-switch v-model="autoCloseQueue"></m3-switch></v-list-tile-action>
    </v-list-tile>

    <div class="dialog-padding" v-if="LMS_P_MAI"></div>
    <v-header class="dialog-section-header" v-if="LMS_P_MAI">{{i18n('Track Information')}}</v-header>

    <v-list-tile v-if="LMS_P_MAI">
     <v-list-tile-content @click="infoBackdrop = !infoBackdrop" class="switch-label">
      <v-list-tile-title>{{i18n('Draw background')}}</v-list-tile-title>
      <v-list-tile-sub-title>{{i18n('Use cover of current track as background.')}}</v-list-tile-sub-title>
     </v-list-tile-content>
     <v-list-tile-action><m3-switch v-model="infoBackdrop"></m3-switch></v-list-tile-action>
    </v-list-tile>

    <div class="dialog-padding"></div>
    <v-header class="dialog-section-header">{{i18n('Screensaver')}}</v-header>
    <v-list-tile>
     <v-select :items="screensavers" :label="i18n('Type')" v-model="screensaver" item-text="label" item-value="key"></v-select>
    </v-list-tile>
    <v-list-tile-sub-title v-if="screensaver==0" style="padding-bottom:16px">{{i18n('No screensaver.')}}</v-list-tile-sub-title>
    <v-list-tile-sub-title v-else-if="screensaver==1" style="padding-bottom:16px">{{i18n('When no track is playing on current player, darken screen (and show date & time) after a period of inactivity. Clock is moved every few minutes.')}}</v-list-tile-sub-title>
    <v-list-tile-sub-title v-else-if="screensaver==2" style="padding-bottom:16px">{{i18n('When no track is playing on current player, darken screen (and show date & time) after a period  of inactivity. Clock is fixed to center of screen.')}}</v-list-tile-sub-title>
    <v-list-tile-sub-title v-else-if="screensaver==3" style="padding-bottom:16px">{{i18n('When no track is playing on current player, darken screen after a period of inactivity.')}}</v-list-tile-sub-title>
    <v-divider></v-divider>
    <v-list-tile>
     <v-list-tile-content @click="screensaverNp = !screensaverNp" class="switch-label">
      <v-list-tile-title>{{i18n('Switch to now-playing')}}</v-list-tile-title>
      <v-list-tile-sub-title>{{i18n('Switch to basic now-playing view (cover, details, and progress) after 5 minutes of inactivity. Helps to prevent burn-in on OLED screens.')}}</v-list-tile-sub-title>
     </v-list-tile-content>
     <v-list-tile-action><m3-switch v-model="screensaverNp"></m3-switch></v-list-tile-action>
    </v-list-tile>

    <div class="dialog-padding"></div>
    <v-header class="dialog-section-header">{{i18n('Main Menu')}}</v-header>
    <v-list-tile>
     <v-select :items="ndShortcutValues" :label="i18n('Shortcuts in main menu')" v-model="ndShortcuts" item-text="label" item-value="key"></v-select>
    </v-list-tile>
    <v-list-tile-sub-title style="padding-bottom:16px">{{i18n('Show shortcuts to pinned home screen items in main menu. (NOTE: Radio streams and random mixes are excluded.)')}}</v-list-tile-sub-title>
    <v-divider></v-divider>

    <v-list-tile>
     <v-list-tile-content @click="ndSettingsIcons = !ndSettingsIcons" class="switch-label">
      <v-list-tile-title>{{i18n('Use icons for settings')}}</v-list-tile-title>
      <v-list-tile-sub-title>{{i18n('Use a row of icons, and not a list of text, for settings entries.')}}</v-list-tile-sub-title>
     </v-list-tile-content>
     <v-list-tile-action><m3-switch v-model="ndSettingsIcons"></m3-switch></v-list-tile-action>
    </v-list-tile>
    <v-divider></v-divider>

    <v-list-tile>
     <v-list-tile-content @click="ndSettingsVisible = !ndSettingsVisible" class="switch-label">
      <v-list-tile-title>{{i18n('Settings (and shortcuts) always visible')}}</v-list-tile-title>
      <v-list-tile-sub-title>{{i18n('Only scroll player list, keep settings (and shortcuts) visible at bottom.')}}</v-list-tile-sub-title>
     </v-list-tile-content>
     <v-list-tile-action><m3-switch v-model="ndSettingsVisible"></m3-switch></v-list-tile-action>
    </v-list-tile>

    <div class="dialog-padding"></div>
    <v-header class="dialog-section-header">{{i18n('User')}}</v-header>
    <v-list-tile>
     <v-select :items="userids" :label="i18n('User-ID')" v-model="userid" item-text="label" item-value="key"></v-select>
    </v-list-tile>
    <v-list-tile-sub-title style="padding-bottom:16px">{{i18n('User ID that is sent with every request to Lyrion. It must be assigned to the desired account in plugins that support this function.')}}</v-list-tile-sub-title>

    <div class="dialog-padding" v-if="unlockAll" ></div>
    <v-header class="dialog-section-header" v-if="unlockAll" >{{i18n('Defaults')}}</v-header>
    <v-list-tile class="settings-note" v-if="unlockAll"><p>{{i18n("Settings (and home screen items) are stored locally in your browser. However, some browser extensions can remove these. The 'Save as default' button can be used to store your current settings (and home screen items) on the Lyrion server. These will then be used for any settings that are not found in your browser. Likewise, 'Revert to default' can be used to manually revert to the settings stored on your Lyrion server.")}}</p></v-list-tile>
    <div style="margin-left:-10px">
    <v-btn flat @click="saveAsDefault($event)"><v-icon class="btn-icon">save_alt</v-icon>{{i18n('Save as default')}}</v-btn>
    <v-btn flat @click="revertToDefault($event)"><v-icon class="btn-icon">settings_backup_restore</v-icon>{{i18n('Revert to default')}}</v-btn>
    </div>
    <div class="dialog-padding"></div>
    <div class="dialog-bottom-pad"></div>
   </v-list>
  </v-card-text>
 </v-card>
</v-dialog>

 <v-dialog v-model="browseModesDialog.show" :width="browseModesDialog.wide ? 750 : 500" persistent style="overflow:hidden" v-if="browseModesDialog.show">
  <v-card>
   <v-card-title>{{i18n("Browse modes")}}</v-card-title>
   <div class="browse-modes-table dialog-main-list">
    <v-checkbox v-for="(item, i) in browseModesDialog.modes" class="bm-checkbox" v-model="browseModesDialog.modes[i].enabled" :label="browseModesDialog.modes[i].text" error-count="0" hide-details></v-checkbox>
   </div>
   <div class="dialog-padding"></div>
   <v-card-actions>
    <v-spacer></v-spacer>
    <v-btn flat @click="browseModesDialog.show = false">{{i18n('Close')}}</v-btn>
   </v-card-actions>
  </v-card>
 </v-dialog>

  <v-dialog v-model="detailedHomeDialog.show" :width="500" persistent style="overflow:hidden" v-if="detailedHomeDialog.show">
  <v-card>
   <v-card-title>{{i18n("Scrollable lists")}}</v-card-title>
   <v-list class="dialog-main-list">
    <template v-for="(item, index) in detailedHomeDialog.items" :key="item.id">
    <v-list-tile class="settings-list-thin-item">
     <v-checkbox v-model="item.checked" style="display:flex" :id="item.id">
      <template v-slot:label>
       <v-list-tile-avatar>
        <v-icon v-if="undefined!=item.icon">{{item.icon}}</v-icon>
        <img v-else-if="item.svg" class="svg-img" :src="item.svg | svgIcon(darkUi)"></img>
       </v-list-tile-avatar>
       <v-list-tile-content>
        <div>{{item.title}}</div>
        <div class="subtext">{{item.subtitle}}</div>
       </v-list-tile-content>
      </template>
     </v-checkbox>
     </v-list-tile>
    </template>
   </v-list>
   <div class="dialog-padding"></div>
   <v-card-actions>
    <v-spacer></v-spacer>
    <v-btn flat @click="setDetailedHome">{{i18n('Close')}}</v-btn>
   </v-card-actions>
  </v-card>
 </v-dialog>

</div>
`,
    data() {
        return {
            show: false,
            showMenu: false,
            theme: LMS_DEFAULT_THEME,
            themes: [ ],
            colorUsage: COLOR_USE_FROM_COVER,
            colorUsages: { },
            color: LMS_DEFAULT_COLOR,
            colorList: { } ,
            userColors: [ ],
            colorToolbars: false,
            tinted: true,
            roundCovers : true,
            fontSize: 'r',
            fontSizes: [],
            sortFavorites:false,
            autoScrollQueue:true,
            browseBackdrop:true,
            queueThreeLines:true,
            queueBackdrop:true,
            nowPlayingBackdrop:true,
            infoBackdrop:true,
            useDefaultBackdrops:true,
            browseTechInfo:false,
            techInfo:false,
            queueShowTrackNum:false,
            nowPlayingTrackNum:false,
            nowPlayingClock:false,
            nowPlayingFull:true,
            browseContext:false,
            nowPlayingContext:false,
            queueContext:false,
            swipeVolume:false,
            swipeChangeTrack:false,
            keyboardControl:true,
            layout: null,
            layoutItems: [],
            mobileBar: MBAR_THIN,
            mobileBars : [],
            volumeSteps: [ { value: 1,  label: "1%"},
                           { value: 2,  label: "2%"},
                           { value: 5,  label: "5%"},
                           { value: 10, label: "10%"}
                         ],
            volumeStep: 5,
            skipSecondsOptions: [ ],
            skipBSeconds: 10,
            skipFSeconds: 30,
            allowLayoutAdjust: window.location.href.indexOf('?layout=')<0 && window.location.href.indexOf('&layout=')<0,
            showItems: [ ],
            hasPassword: false,
            password: undefined,
            showPassword: false,
            browseModesDialog: {
                show: false,
                wide: false,
                modes: []
            },
            screensaver: 0,
            screensavers:[],
            screensaverNp: false,
            serverName: "",
            showRating: false,
            homeButton: 0,
            homeButtonValues: [],
            gridPerView: true,
            width: 500,
            mediaControls: false,
            mediaControlsSupported: !queryParams.hide.has('mediaControls') && ('mediaSession' in navigator),
            moveDialogs: false,
            showMoveDialogs: false,
            autoCloseQueue: false,
            ndShortcuts: 0,
            ndShortcutValues: [],
            ndSettingsIcons: false,
            ndSettingsVisible: false,
            userid: '',   
            userids: [],
            detailedHomeValues:{},
            detailedHomeItems:[],
            detailedHomeDialog: {show:false, items:[]},
            dragIndex: undefined,
            dropIndex: undefined
        }
    },
    computed: {
        darkUi() {
            return this.$store.state.darkUi
        },
        unlockAll() {
            return this.$store.state.unlockAll
        },
        player() {
            return this.$store.state.player
        },
        usingColoredToolbars() {
            return this.$store.state.coloredToolbars
        },
        cMixSupported() {
            return this.$store.state.cMixSupported
        },
        allowTint() {
            return 'lyrion'!=this.color || !this.colorToolbars || this.colorUsage!=COLOR_USE_STANDARD
        },
        desktopLayout() {
            return this.$store.state.desktopLayout
        },
        haveScrollableLists() {
            return this.detailedHomeItems.length>0
        }
    },
    mounted() {
        this.width = Math.floor(window.innerWidth/25)*25;
        setTimeout(function () {
            this.width = Math.floor(window.innerWidth/25)*25;
        }.bind(this), 1000);
        bus.$on('windowWidthChanged', function() {
            this.width = Math.floor(window.innerWidth/25)*25;
        }.bind(this));
        bus.$on('uisettings.open', function(act) {
            this.showMenu = false;
            this.showMoveDialogs = window.innerWidth>=MIN_DLG_MOVE_SIZE && window.innerHeight>=MIN_DLG_MOVE_SIZE;
            this.initHomeItems();
            this.readStore();
            this.password = getLocalStorageVal('password', '');
            if (this.allowLayoutAdjust) {
                this.layout = getLocalStorageVal("layout", "auto");
                this.layoutOrig = this.layout;
            }
            this.hasPassword = false;
            lmsCommand("", ["material-skin", "pass-isset"]).then(({data}) => {
                if (1==parseInt(data.result['set'])) {
                    this.hasPassword = true;
                }
            }).catch(err => {
            });
            if (0!=queryParams.nativeUiChanges) {
                this.currentSettings = JSON.stringify(this.settings(true, true));
            }
            lmsCommand("", ["material-skin", "browsemodes"]).then(({data}) => {
                this.browseModesDialog.modes=[];
                if (data && data.result && data.result.modes_loop) {
                    this.browseModesDialog.modes=data.result.modes_loop;
                    for (var idx=0, loop=this.browseModesDialog.modes, loopLen=loop.length; idx<loopLen; ++idx) {
                        loop[idx].enabled=!this.$store.state.disabledBrowseModes.has(loop[idx].id);
                        if (lmsOptions.supportReleaseTypes) {
                            if (loop[idx].id=="myMusicAlbums") {
                                loop[idx].text=i18n("Releases");
                            } else if (loop[idx].id=="myMusicRandomAlbums") {
                                loop[idx].text=i18n("Random Releases");
                            } else if (loop[idx].id=="myMusicRecentlyChangeAlbums") {
                                loop[idx].text=i18n("Recently Updated Releases");
                            }
                        }
                    }
                    this.browseModesDialog.modes.sort(function(a, b) { return a.weight!=b.weight ? a.weight<b.weight ? -1 : 1 : 0});
                }
            }).catch(err => {
            });
            lmsCommand("", ["material-skin", "server"]).then(({data}) => {
                if (data && data.result) {
                    this.serverName=undefined==data.result.libraryname ? "" : (SEPARATOR+data.result.libraryname);
                }
            }).catch(err => {
            });
            getMiscJson(this.colorList, "colors", this);

            var os = "other";
            if (IS_IOS) {
                os = "ios";
            } else if (IS_ANDROID) {
                os = "android";
            } else if (navigator.platform.indexOf("Linux") != -1) {
                os = "linux";
            } else if (navigator.platform.indexOf("Win") != -1) {
                os = "windows";
            } else if (navigator.platform.indexOf("Mac") != -1) {
                os = "mac";
            }

            lmsCommand("", ["material-skin", "themes", "platform:"+os]).then(({data}) => {
                for (var i=0, len=this.themes.length; i<len; ++i) {
                    if (this.themes[i].other) {
                        this.themes.splice(i, len-i);
                        break;
                    }
                }
                if (data && data.result && data.result.themes) {
                    for (var i=0, list=data.result.themes, len=list.length; i<len; ++i) {
                        let name = list[i].label.replace(/-/g, ' ');
                        if (!list[i].key.startsWith("user:")) {
                            name=name.replace("Dark", i18n("Dark"));
                        }
                        this.themes.push({label:name, key:list[i].key, other:true});
                    }
                }
                this.userColors=[];
                if (data && data.result && data.result.colors) {
                    this.userColors=data.result.colors;
                }
            }).catch(err => {
            });
            this.show = true;
        }.bind(this));
        bus.$on('closeMenu', function() {
            if (this.showMenu) {
                this.showMenu = false;
            }
        }.bind(this));
        bus.$on('closeDialog', function(dlg) {
            if (dlg == 'browsemodes') {
                this.browseModesDialog.show=false;
            } else if (dlg == 'detailedhome') {
                this.detailedHomeDialog.show=false;
                this.detailedHomeDialog.items=[];
            } else if (dlg == 'uisettings') {
                this.close();
            }
        }.bind(this));
        bus.$on('langChanged', function() {
            this.initItems();
        }.bind(this));
        this.initItems();
    },
    methods: {
        readStore() {
            let themeParts = this.$store.state.chosenTheme ? this.$store.state.chosenTheme.split('-') : ['dark'];
            let variant = themeParts.length>1 && ('colored'==themeParts[themeParts.length-1] || 'standard'==themeParts[themeParts.length-1]) ? themeParts.pop() : 'standard';
            this.theme = themeParts.join('-');
            this.colorToolbars = 'colored'==variant;
            this.color = this.$store.state.color;
            this.colorUsage = this.$store.state.colorUsage;
            this.tinted = this.$store.state.tinted;
            this.mobileBar = this.$store.state.mobileBar;
            this.roundCovers = this.$store.state.roundCovers;
            this.fontSize = this.$store.state.fontSize;
            this.autoScrollQueue = this.$store.state.autoScrollQueue;
            this.browseBackdrop = this.$store.state.browseBackdrop;
            this.queueBackdrop = this.$store.state.queueBackdrop;
            this.queueThreeLines = this.$store.state.queueThreeLines;
            this.nowPlayingBackdrop = this.$store.state.nowPlayingBackdrop;
            this.infoBackdrop = this.$store.state.infoBackdrop;
            this.useDefaultBackdrops = this.$store.state.useDefaultBackdrops;
            this.browseTechInfo = this.$store.state.browseTechInfo;
            this.techInfo = this.$store.state.techInfo;
            this.queueShowTrackNum = this.$store.state.queueShowTrackNum;
            this.nowPlayingTrackNum = this.$store.state.nowPlayingTrackNum;
            this.nowPlayingClock = this.$store.state.nowPlayingClock;
            this.nowPlayingFull = this.$store.state.nowPlayingFull;
            this.browseContext = this.$store.state.browseContext;
            this.nowPlayingContext = this.$store.state.nowPlayingContext;
            this.queueContext = this.$store.state.queueContext;
            this.swipeVolume = this.$store.state.swipeVolume;
            this.swipeChangeTrack = this.$store.state.swipeChangeTrack;
            this.keyboardControl = this.$store.state.keyboardControl;
            this.sortFavorites = this.$store.state.sortFavorites;
            this.skipBSeconds = this.$store.state.skipBSeconds;
            this.skipFSeconds = this.$store.state.skipFSeconds;
            this.volumeStep = lmsOptions.volumeStep;
            this.showRating = this.$store.state.showRating;
            this.hidden = this.$store.state.hidden;
            this.screensaver = this.$store.state.screensaver;
            this.screensaverNp = this.$store.state.screensaverNp;
            this.homeButton = this.$store.state.homeButton;
            this.gridPerView = this.$store.state.gridPerView;
            this.mediaControls = this.$store.state.mediaControls;
            this.moveDialogs = this.$store.state.moveDialogs;
            this.autoCloseQueue = this.$store.state.autoCloseQueue;
            this.ndShortcuts = this.$store.state.ndShortcuts;
            this.ndSettingsIcons = this.$store.state.ndSettingsIcons;
            this.ndSettingsVisible = this.$store.state.ndSettingsVisible;
            this.userid = this.$store.state.userid;
            this.showItems=[{id: TOP_MYMUSIC_ID, name:i18n("My Music"), show:!this.hidden.has(TOP_MYMUSIC_ID)},
                            {id: TOP_RADIO_ID, name:i18n("Radio"), show:!this.hidden.has(TOP_RADIO_ID)},
                            {id: TOP_FAVORITES_ID, name:i18n("Favorites"), show:!this.hidden.has(TOP_FAVORITES_ID)},
                            {id: TOP_APPS_ID, name:i18n("Apps"), show:!this.hidden.has(TOP_APPS_ID)},
                            {id: TOP_EXTRAS_ID, name:i18n("Extras"), show:!this.hidden.has(TOP_EXTRAS_ID)}];
            this.detailedHomeItems=[];
            for (let i=0, loop=this.$store.state.detailedHomeItems, len=loop.length; i<len; ++i) {
                this.detailedHomeItems.push(loop[i]);
            }
        },
        initItems() {
            this.themes=[
                { key: AUTO_THEME,   label:i18n('Automatic')},
                { key:'light',       label:i18n('Light')},
                { key:'dark',        label:i18n('Dark')},
                { key:'black',       label:i18n('Black')},
                { key:'dark-lyrion', label:'Lyrion'}
                ];
            this.layoutItems=[
                { key:"auto",    label:i18n("Automatic")},
                { key:"desktop", label:i18n("Use desktop layout")},
                { key:"mobile",  label:i18n("Use mobile layout")}
                ];
            this.mobileBars=[
                { key:MBAR_NONE,    label:i18n("None")},
                { key:MBAR_THIN,    label:i18n("Thin (single line of text)")},
                { key:MBAR_THICK,   label:i18n("Thick (two lines of text)")},
                { key:MBAR_REP_NAV, label:i18n("Replace navigation bar")},
                ];
            this.colorUsages=[
                { key:COLOR_USE_STANDARD,   label:i18n("For all players ") },
                { key:COLOR_USE_FROM_COVER, label:i18n("From current cover (all players)") },
                { key:COLOR_USE_PER_PLAYER, label:i18n("Per player") }
            ]
            this.skipSecondsOptions = [ ];
            for (let s=0, len=SKIP_SECONDS_VALS.length; s<len; ++s) {
                this.skipSecondsOptions.push({ value: SKIP_SECONDS_VALS[s],  label: i18n("%1 seconds", SKIP_SECONDS_VALS[s]) });
            }
            this.fontSizes = [
                { key: 's',  label: i18n("Small") },
                { key: 'r',  label: i18n("Regular") },
                { key: 'l',  label: i18n("Large") }
                ];
            this.ndShortcutValues=[
                { key:0, label:i18n("Don't show")},
                { key:1, label:i18n("Show all")},
                { key:2, label:i18n("Single line only")},
                ];
            this.screensavers=[
                { key:0, label:i18n("Disabled")},
                { key:1, label:i18n("Moving clock")},
                { key:2, label:i18n("Fixed clock")},
                { key:3, label:i18n("Blank screen")}
                ];
            this.userids = [{ key: '', label: i18n('None') }];
                for (let i = 1; i <= 9; i++) {
                    const v = String(i).padStart(3, '0')
                    this.userids.push({ key: v, label: v })
                } 
            this.initHomeItems();
            this.homeButtonValues=[
                { key:0, label:i18n("Don't show")},
                { key:1, label:i18n("Show always")},
                { key:2, label:i18n("Show when wide enough")},
                ];
        },
        initHomeItems() {
            this.detailedHomeValues={};
            this.detailedHomeValues[DETAILED_HOME_STD_PREFIX+"new"] = {title:i18n('New Music'), icon:"new_releases"};
            if (LMS_VERSION>=90100 && LMS_STATS_ENABLED) {
                this.detailedHomeValues[DETAILED_HOME_STD_PREFIX+"recentlyplayed"] = {title:i18n('Recently Played'), icon:"history"};
                this.detailedHomeValues[DETAILED_HOME_STD_PREFIX+"playcount"] = { title:i18n('Most Played'), subtitle:this.i18n('Based upon total play count.'), svg:"staralbum"};
                this.detailedHomeValues[DETAILED_HOME_STD_PREFIX+"popular"] = { title:lmsOptions.supportReleaseTypes ? i18n('Popular Releases') : i18n('Popular Albums'), subtitle:this.i18n('Based upon play count for the past few months only.'), svg:"popularalbum"};
                this.detailedHomeValues[DETAILED_HOME_STD_PREFIX+"artists_new"] = { title:i18n('New Artists'), svg:"artistnew"};
                this.detailedHomeValues[DETAILED_HOME_STD_PREFIX+"artists_recentlyplayed"] = { title:i18n('Recently Played Artists'), svg:"artistrecent"};
                this.detailedHomeValues[DETAILED_HOME_STD_PREFIX+"artists_playcount"] = { title:i18n('Most Played Artists'), subtitle:this.i18n('Based upon total play count.'), svg:"artiststar"};
                this.detailedHomeValues[DETAILED_HOME_STD_PREFIX+"artists_popular"] = { title:i18n('Popular Artists'), subtitle:this.i18n('Based upon play count for the past few months only.'), svg:"artistpopular"};
            }
            this.detailedHomeValues[DETAILED_HOME_STD_PREFIX+"random"] = { title:lmsOptions.supportReleaseTypes ? i18n("Random Releases") : i18n("Random Albums"), svg:"dice-album"};
            this.detailedHomeValues[DETAILED_HOME_STD_PREFIX+"radios"] = { title:i18n('Radios'), svg:"radio"}
            if (lmsOptions.playlistImages) {
                this.detailedHomeValues[DETAILED_HOME_STD_PREFIX+"playlists"] = { title:i18n('Playlists'), icon:"list"};
            }
            if (LMS_VERSION>=90000) {
                this.detailedHomeValues[DETAILED_HOME_STD_PREFIX+"changed"] = { title:lmsOptions.supportReleaseTypes ? i18n("Recently Updated Releases") : i18n("Recently Updated Albums"), svg:"updated-music"};
            }
            for (let i=0, len=lmsOptions.home3rdPartyExtraLists.length; i<len; ++i) {
                let entry = lmsOptions.home3rdPartyExtraLists[i];
                mapIcon(entry);
                this.detailedHomeValues[entry.id]=entry;
            }
            this.detailedHomeValues[DETAILED_HOME_EXPLORE] = {title:i18n("Explore"), icon:"music_note"};
        },
        close() {
            this.show=false;
            this.showMenu = false;
            this.$store.commit('setUiSettings', this.settings(false, false) );

            if (this.allowLayoutAdjust && (this.layout != this.layoutOrig)) {
                setLocalStorageVal("layout", this.layout);
                bus.$emit('changeLayout', "desktop"==this.layout ? true : "mobile"==this.layout ? false : undefined);
            }

            if (this.password != getLocalStorageVal('password', '-')) {
                this.$store.commit('setPassword', this.password);
            }

            if (0!=queryParams.nativeUiChanges) {
                let settingsNow = JSON.stringify(this.settings(true, true));
                if (settingsNow!=this.currentSettings) {
                    if (1==queryParams.nativeUiChanges) {
                        try {
                            NativeReceiver.updateUiSettings(settingsNow);
                        } catch (e) {
                        }
                    } else if (queryParams.nativeUiChanges>0) {
                        emitNative("MATERIAL-UI\nJSON " + settingsNow, queryParams.nativeUiChanges);
                    }
                }
                this.currentSettings = undefined;
            }
        },
        settings(arrays, withSorts) {
            let settings = {
                      theme:this.theme+(this.colorToolbars ? '-colored' : ''),
                      color:this.color,
                      colorUsage:this.colorUsage,
                      tinted:this.tinted,
                      mobileBar:this.mobileBar,
                      roundCovers:this.roundCovers,
                      fontSize:this.fontSize,
                      autoScrollQueue:this.autoScrollQueue,
                      sortFavorites:this.sortFavorites,
                      browseBackdrop:this.browseBackdrop,
                      queueBackdrop:this.queueBackdrop,
                      queueThreeLines:this.queueThreeLines,
                      nowPlayingBackdrop:this.nowPlayingBackdrop,
                      infoBackdrop:this.infoBackdrop,
                      useDefaultBackdrops:this.useDefaultBackdrops,
                      browseTechInfo:this.browseTechInfo,
                      techInfo:this.techInfo,
                      queueShowTrackNum:this.queueShowTrackNum,
                      nowPlayingTrackNum:this.nowPlayingTrackNum,
                      nowPlayingClock:this.nowPlayingClock,
                      browseContext:this.browseContext,
                      nowPlayingFull:this.nowPlayingFull,
                      nowPlayingContext:this.nowPlayingContext,
                      queueContext:this.queueContext,
                      swipeVolume:this.swipeVolume,
                      swipeChangeTrack:this.swipeChangeTrack,
                      keyboardControl:this.keyboardControl,
                      volumeStep:this.volumeStep,
                      hidden:arrays ? Array.from(this.hiddenItems()) : this.hiddenItems(),
                      skipBSeconds:this.skipBSeconds,
                      skipFSeconds:this.skipFSeconds,
                      disabledBrowseModes:arrays ? Array.from(this.disabledBrowseModes()) : this.disabledBrowseModes(),
                      screensaver:this.screensaver,
                      screensaverNp:this.screensaverNp,
                      homeButton:this.homeButton,
                      gridPerView:this.gridPerView,
                      showRating:this.showRating,
                      mediaControls:this.mediaControls,
                      moveDialogs:this.moveDialogs,
                      autoCloseQueue:this.autoCloseQueue,
                      ndShortcuts:this.ndShortcuts,
                      ndSettingsIcons:this.ndSettingsIcons,
                      ndSettingsVisible:this.ndSettingsVisible,
                      userid:this.userid,
                      detailedHomeItems:this.detailedHomeItems
                  };
            if (withSorts) {
                for (var key in window.localStorage) {
                    if (key.startsWith(LS_PREFIX+ALBUM_SORT_KEY) || key.startsWith(LS_PREFIX+ARTIST_ALBUM_SORT_KEY)) {
                        if (undefined==settings.sorts) {
                            settings.sorts={}
                        }
                        settings.sorts[key.substring(LS_PREFIX.length)]=window.localStorage.getItem(key);
                    }
                }
            }
            return settings;
        },
        saveAsDefault(event) {
            storeClickOrTouchPos(event);
            confirm(i18n("Save the current settings as default for new users?")+
                         (this.allowLayoutAdjust ? addNote(i18n("NOTE: 'Application layout' is not saved, as this is a per-device setting.")) : ""),
                    i18n('Set Defaults')).then(res => {
                if (res) {
                    var settings = this.settings(true, true);
                    settings.pinQueue = this.$store.state.pinQueue;
                    settings.mai = {showTabs: getLocalStorageBool("showTabs", false),
                                    npScrollLyrics: getLocalStorageBool("npScrollLyrics", true),
                                    npHighlightLyrics: getLocalStorageBool("npHighlightLyrics", true),
                                    npInfoZoom: parseFloat(getLocalStorageVal("npInfoZoom", 1.0))};

                    lmsCommand("", ["pref", LMS_MATERIAL_UI_DEFAULT_PREF, JSON.stringify(settings)]);
                    lmsCommand("", ["pref", LMS_MATERIAL_DEFAULT_ITEMS_PREF, getLocalStorageVal("topItems", "[]")]);
                }
            });
        },
        revertToDefault(event) {
            storeClickOrTouchPos(event);
            confirm(i18n("Revert to default settings?"), i18n('Revert')).then(res => {
                if (res) {
                    lmsCommand("", ["pref", LMS_MATERIAL_UI_DEFAULT_PREF, "?"]).then(({data}) => {
                        if (data && data.result && data.result._p2) {
                            try {
                                var prefs = JSON.parse(data.result._p2);
                                try {
                                    prefs.hidden = undefined==prefs.hidden ? undefined : new Set(prefs.hidden);
                                } catch(e) {
                                    prefs.hidden = undefined;
                                }
                                try {
                                    prefs.disabledBrowseModes = undefined==prefs.disabledBrowseModes ? undefined : new Set(prefs.disabledBrowseModes);
                                } catch(e) {
                                    prefs.disabledBrowseModes = undefined;
                                }
                                prefs.isRevert = true;
                                this.$store.commit('setUiSettings', prefs);
                                this.readStore();
                                for (var idx=0, loop=this.browseModesDialog.modes, loopLen=loop.length; idx<loopLen; ++idx) {
                                    loop[idx].enabled=!this.$store.state.disabledBrowseModes.has(loop[idx].id);
                                }
                            } catch(e) {
                            }
                        }
                    });
                }
            });
        },
        setColor(c) {
            this.color = c;
            if ('lyrion'==c && this.colorToolbars) {
                this.tinted = false;
            }
        },
        hiddenItems() {
            var hidden = new Set(Array.from(this.hidden));
            for (var i=0, len=this.showItems.length; i<len; ++i) {
                if (this.showItems[i].show && hidden.has(this.showItems[i].id)) {
                    hidden.delete(this.showItems[i].id);
                } else if (!this.showItems[i].show && !hidden.has(this.showItems[i].id)) {
                    hidden.add(this.showItems[i].id);
                }
            }
            return hidden;
        },
        disabledBrowseModes() {
            var disabledModes = new Set();
            for (var i=0, len=this.browseModesDialog.modes.length; i<len; ++i) {
                if (!this.browseModesDialog.modes[i].enabled) {
                    disabledModes.add(this.browseModesDialog.modes[i].id);
                }
            }
            return disabledModes;
        },
        keyboardInfo(event) {
            storeClickOrTouchPos(event);
            var list = queryParams.party
                     ? [ shortcutStr("space")+SEPARATOR+i18n("Play/pause"),
                         shortcutStr("home")+SEPARATOR+i18n("Go to homescreen"),
                         shortcutStr("esc")+SEPARATOR+i18n("Go back"),
                         shortcutStr(ACTIONS[SEARCH_LIB_ACTION].key)+SEPARATOR+ACTIONS[SEARCH_LIB_ACTION].title + " / " + ACTIONS[SEARCH_LIST_ACTION].title,
                         shortcutStr(ACTIONS[SEARCH_LIB_ACTION].key, false, true)+SEPARATOR+ACTIONS[ADV_SEARCH_ACTION].title,
                         shortcutStr(ACTIONS[SEARCH_LIST_ACTION].key, true)+SEPARATOR+ACTIONS[SEARCH_LIST_ACTION].title+" ("+i18n("Queue")+")",
                         shortcutStr(ACTIONS[ADD_ACTION].skey, true)+SEPARATOR+ACTIONS[ADD_ACTION].title,
                         shortcutStr(LMS_TRACK_INFO_KEYBOARD)+SEPARATOR+i18n("Show current track information")
                       ]
                     : [ shortcutStr("up", false, true)+SEPARATOR+i18n("Increase volume"),
                         shortcutStr("down", false, true)+SEPARATOR+i18n("Decrease volume"),
                         shortcutStr("left", false, true)+SEPARATOR+i18n("Previous track"),
                         shortcutStr("right", false, true)+SEPARATOR+i18n("Next track"),
                         shortcutStr("space")+SEPARATOR+i18n("Play/pause"),
                         shortcutStr("home")+SEPARATOR+i18n("Go to homescreen"),
                         shortcutStr("esc")+SEPARATOR+i18n("Go back"),
                         shortcutStr(ACTIONS[SEARCH_LIB_ACTION].key)+SEPARATOR+ACTIONS[SEARCH_LIB_ACTION].title + " / " + ACTIONS[SEARCH_LIST_ACTION].title,
                         shortcutStr(ACTIONS[SEARCH_LIB_ACTION].key, false, true)+SEPARATOR+ACTIONS[ADV_SEARCH_ACTION].title,
                         shortcutStr(ACTIONS[SEARCH_LIST_ACTION].key, true)+SEPARATOR+ACTIONS[SEARCH_LIST_ACTION].title+" ("+i18n("Queue")+")",
                         shortcutStr(ACTIONS[PLAY_ACTION].skey, true)+SEPARATOR+ACTIONS[PLAY_ACTION].title,
                         shortcutStr(ACTIONS[ADD_ACTION].skey, true)+SEPARATOR+ACTIONS[ADD_ACTION].title,
                         shortcutStr(LMS_ADD_ITEM_ACTION_KEYBOARD, true)+SEPARATOR+i18n("Add favorite or podcast"),
                         shortcutStr(ACTIONS[ADD_FAV_FOLDER_ACTION].skey, true)+SEPARATOR+ACTIONS[ADD_FAV_FOLDER_ACTION].title,
                         shortcutStr(LMS_TRACK_INFO_KEYBOARD)+SEPARATOR+i18n("Show current track information")];
            if (this.$store.state.desktopLayout) {
                list.push(shortcutStr(LMS_EXPAND_NP_KEYBOARD, true)+SEPARATOR+i18n("Expand now playing"));
            }
            if (!queryParams.party) {
                list.push(shortcutStr(LMS_SAVE_QUEUE_KEYBOARD)+SEPARATOR+ACTIONS[PQ_SAVE_ACTION].title);
                list.push(shortcutStr(LMS_CLEAR_QUEUE_KEYBOARD)+SEPARATOR+i18n("Clear queue"));
                list.push(shortcutStr(ACTIONS[PQ_MOVE_QUEUE_ACTION].key)+SEPARATOR+ACTIONS[PQ_MOVE_QUEUE_ACTION].title);
                list.push(shortcutStr(ACTIONS[PQ_ADD_URL_ACTION].key)+SEPARATOR+ACTIONS[PQ_ADD_URL_ACTION].title);
                list.push(shortcutStr(ACTIONS[PQ_SORT_ACTION].key)+SEPARATOR+ACTIONS[PQ_SORT_ACTION].title);
            }
            list.push(shortcutStr(ACTIONS[PQ_SCROLL_ACTION].key)+SEPARATOR+ACTIONS[PQ_SCROLL_ACTION].title);
            if (this.$store.state.desktopLayout) {
                list.push(shortcutStr(LMS_TOGGLE_QUEUE_KEYBOARD, true)+SEPARATOR+i18n("Toggle queue"));
            }
            list.push(shortcutStr(LMS_UI_SETTINGS_KEYBOARD)+SEPARATOR+TB_UI_SETTINGS.title);
            if (!queryParams.party) {
                list.push(shortcutStr(LMS_PLAYER_SETTINGS_KEYBOARD)+SEPARATOR+TB_PLAYER_SETTINGS.title);
            }
            if (!queryParams.party && this.$store.state.unlockAll) {
                list.push(shortcutStr(LMS_SERVER_SETTINGS_KEYBOARD)+SEPARATOR+TB_SERVER_SETTINGS.title);
            }
            list.push(shortcutStr(LMS_INFORMATION_KEYBOARD)+SEPARATOR+TB_INFO.title);
            if (!queryParams.party) {
                list.push(shortcutStr(LMS_MANAGEPLAYERS_KEYBOARD)+SEPARATOR+TB_MANAGE_PLAYERS.title);
            }
            if (!queryParams.single) {
                list.push(shortcutStr("(N)", false, true)+SEPARATOR+i18n("Switch to Nth player"));
            }
            if (!this.$store.state.desktopLayout) {
                list.push("F1"+SEPARATOR+i18n("Browse"));
                list.push("F2"+SEPARATOR+i18n("Playing"));
                list.push("F3"+SEPARATOR+i18n("Queue"));
            }
            if (!queryParams.party && undefined!=LMS_P_RP && this.$store.state.showRating) {
                list.push(shortcutStr("(N)", true)+SEPARATOR+i18n("Set rating (0..5)"));
            }
            bus.$emit('dlg.open', 'iteminfo', { list:list });
        },
        mediaControlsInfo(event) {
            storeClickOrTouchPos(event);
            bus.$emit('dlg.open', 'iteminfo', { list:[i18n("To support this feature, this app needs to fool your browser into thinking it is playing audio. This is accomplished by playing a silent audio file in a loop. Most browsers block auto-playing of audio so this cannot start until you have interacted with the app (e.g. clicked somewhere). Alternatively you can configure your browser to allow auto-play of audio for the URL you use to access this app (%1).", window.location.hostname+':'+window.location.port)]});
        },
        i18n(str, a1, a2) {
            if (this.show) {
                return i18n(str, a1, a2);
            } else {
                return str;
            }
        },
        showBrowseModesDialog(event) {
            storeClickOrTouchPos(event);
            this.browseModesDialog.wide = window.innerWidth >= 700;
            this.browseModesDialog.show=true;
        },
        showDetailedHomeDialog(event) {
            storeClickOrTouchPos(event);
            let keys = Object.keys(this.detailedHomeValues);
            let items = [];
            for (let i=0, len=keys.length; i<len; ++i) {
                let key = keys[i];
                let val = this.detailedHomeValues[key];
                items.push({id:key, title:val.title, subtitle:val.subtitle, icon:val.icon, svg:val.svg, checked:this.detailedHomeItems.indexOf(key)>=0});
            }
            items.sort((a, b) => {
                let at = a.id.split("_")[0];
                let bt = b.id.split("_")[0];
                if (at!=bt) {
                    let aid = a.id.startsWith("std") ? "0"+a.id : a.id;
                    let bid = b.id.startsWith("std") ? "0"+b.id : b.id;
                    return aid<bid ? -1 : 1
                }
                return titleSort(a, b);
            });
            this.detailedHomeDialog.items=items;
            this.detailedHomeDialog.show=true;
        },
        setDetailedHome() {
            let checked = [];
            for (let i=0, loop=this.detailedHomeDialog.items, len=loop.length; i<len; ++i) {
                if (loop[i].checked) {
                    checked.push(loop[i].id);
                }
            }
            // Remove unchecked items
            for (let loop=this.detailedHomeItems, len=loop.length, i=len-1; i>=0; --i) {
                if (checked.indexOf(loop[i])<0) {
                    loop.splice(i, 1);
                }
            }
            // Add newly checked items (to end)
            for (let i=0, loop=checked, len=loop.length; i<len; ++i) {
                if (this.detailedHomeItems.indexOf(loop[i])<0) {
                    this.detailedHomeItems.push(loop[i]);
                }
            }
            this.detailedHomeDialog.items=[];
            this.detailedHomeDialog.show=false;
        },
        mouseDown(ev) {
            toolbarMouseDown(ev);
        },
        dragStart(which, ev) {
            ev.dataTransfer.dropEffect = 'move';
            ev.dataTransfer.setData('text/plain', "dth:"+which);
            this.dragIndex = which;
            this.dropIndex = undefined;
        },
        dragEnd() {
            this.dragIndex = undefined;
            this.dropIndex = undefined;
        },
        dragOver(index, ev) {
            if (index!=this.dragIndex) {
                this.dropIndex = index;
            }
            ev.preventDefault(); // Otherwise drop is never called!
        },
        drop(to, ev) {
            ev.preventDefault();
            if (to!=this.dragIndex) {
                this.detailedHomeItems = arrayMove(this.detailedHomeItems, this.dragIndex, to);
            }
            this.dragIndex = undefined;
            this.dropIndex = undefined;
        }
    },
    watch: {
        'show': function(val) {
            this.$store.commit('dialogOpen', {name:'uisettings', shown:val});
        },
        'browseModesDialog.show': function(val) {
            this.$store.commit('dialogOpen', {name:'browsemodes', shown:val});
        },
        'detailedHomeDialog.show': function(val) {
            this.$store.commit('dialogOpen', {name:'detailedhome', shown:val});
        },
        'showMenu': function(newVal) {
            this.$store.commit('menuVisible', {name:'uisettings', shown:newVal});
        }
    }
})

