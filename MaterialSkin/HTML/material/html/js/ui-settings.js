/**
 * LMS-Material
 *
 * Copyright (c) 2018-2023 Craig Drummond <craig.p.drummond@gmail.com>
 * MIT license.
 */
'use strict';

Vue.component('lms-ui-settings', {
    template: `
<div>
<v-dialog v-model="show" v-if="show" persistent no-click-animation scrollable fullscreen>
 <v-card>
  <v-card-title class="settings-title">
   <v-toolbar app-data class="dialog-toolbar">
    <v-btn flat icon v-longpress:stop="close" :title="ttShortcutStr(i18n('Go back'), 'esc')"><v-icon>arrow_back</v-icon></v-btn>
    <v-toolbar-title>{{width>=450 ? TB_UI_SETTINGS.title+serverName : TB_UI_SETTINGS.title}}</v-toolbar-title>
    <v-spacer></v-spacer>
    <v-menu bottom left v-model="showMenu" v-if="!queryParams.party">
     <v-btn icon slot="activator"><v-icon>more_vert</v-icon></v-btn>
     <v-list>
      <v-list-tile @click="saveAsDefault">
       <v-list-tile-avatar><v-icon>save_alt</v-icon></v-list-tile-avatar>
       <v-list-tile-content><v-list-tile-title>{{i18n('Save as default')}}</v-list-tile-title></v-list-tile-content>
      </v-list-tile>
      <v-list-tile @click="revertToDefault">
       <v-list-tile-avatar><v-icon>settings_backup_restore</v-icon></v-list-tile-avatar>
       <v-list-tile-content><v-list-tile-title>{{i18n('Revert to default')}}</v-list-tile-title></v-list-tile-content>
      </v-list-tile>
     </v-list>
    </v-menu>
   </v-toolbar>
  </v-card-title>
  <v-card-text>
   <v-list two-line subheader class="settings-list">
    <v-header class="dialog-section-header">{{i18n('General')}}</v-header>

    <v-list-tile>
     <v-select :items="themes" :label="i18n('Theme')" v-model="theme" item-text="label" item-value="key"></v-select>
    </v-list-tile>
    <v-divider></v-divider>
    <v-list-tile>
     <v-list-tile-content>
      <v-list-tile-title>{{i18n('Color')}}</v-list-tile-title>
      <div class="color-grid">
       <template v-for="(item, index) in colorList.colors">
         <div @click="color=item.key" :style="{'background-color':item.color}" class="color-circle" v-bind:class="{'selected-color-circle':item.key==color}"></div>
       </template>
       <div v-for="(item, index) in userColors" @click="color=item.key" :style="{'background-color':item.color}" class="color-circle" v-bind:class="{'selected-color-circle':item.key==color}"></div>
       <div v-if="!IS_IOS" @click="color=COLOR_FROM_COVER" class="color-circle color-from-cover" v-bind:class="{'selected-color-circle':COLOR_FROM_COVER==color}"></div>
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

    <v-list-tile v-if="allowLayoutAdjust">
     <v-select :items="layoutItems" :label="i18n('Application layout')" v-model="layout" item-text="label" item-value="key"></v-select>
    </v-list-tile>
    <v-divider v-if="allowLayoutAdjust"></v-divider>

    <v-list-tile>
     <v-select :items="fontSizes" :label="i18n('Font size')" v-model="fontSize" item-text="label" item-value="key"></v-select>
    </v-list-tile>
    <v-divider></v-divider>

    <v-list-tile>
     <v-select :items="listPaddings" :label="i18n('Padding between items in lists')" v-model="listPadding" item-text="label" item-value="value"></v-select>
    </v-list-tile>
    <v-divider></v-divider>

    <v-list-tile>
     <v-select :items="volumeSteps" :label="i18n('Volume step')" v-model="volumeStep" item-text="label" item-value="value"></v-select>
    </v-list-tile>
    <v-divider></v-divider>

    <v-list-tile v-if="mediaControlsSupported">
     <v-list-tile-content @click="mediaControls = !mediaControls" class="switch-label">
      <v-list-tile-title>{{IS_MOBILE ? i18n('Lock screen and notifications') : i18n('Media keys and notifications')}}</v-list-tile-title>
      <v-list-tile-sub-title>{{IS_MOBILE ? i18n('Show playback controls on lock screen and in notification area.') : i18n('Allow control via media keys.')}} <v-btn flat icon style="margin-top:4px;height:18px;width:18px; opacity:var(--sub-opacity)" @click.stop="mediaControlsInfo"><v-icon small>help_outline</v-icon></v-btn</v-list-tile-sub-title>
     </v-list-tile-content>
     <v-list-tile-action><m3-switch v-model="mediaControls"></m3-switch></v-list-tile-action>
    </v-list-tile>
    <v-divider v-if="mediaControlsSupported"></v-divider>

    <v-list-tile v-if="!IS_MOBILE">
     <v-list-tile-content @click="keyboardControl = !keyboardControl" class="switch-label">
      <v-list-tile-title>{{i18n('Keyboard shortcuts')}}</v-list-tile-title>
      <v-list-tile-sub-title>{{i18n("Enable keyboard shortcuts")}} <v-btn flat icon style="margin-top:4px;height:18px;width:18px; opacity:var(--sub-opacity)" @click.stop="keyboardInfo"><v-icon small>help_outline</v-icon></v-btn</v-list-tile-sub-title>
     </v-list-tile-content>
     <v-list-tile-action><m3-switch v-model="keyboardControl"></m3-switch></v-list-tile-action>
    </v-list-tile>
    <v-divider v-if="!IS_MOBILE"></v-divider>

    <v-list-tile>
     <v-list-tile-content @click="screensaver = !screensaver" class="switch-label">
      <v-list-tile-title>{{i18n('Screensaver')}}</v-list-tile-title>
      <v-list-tile-sub-title>{{i18n('When no song is playing on current player, darken screen (and show date & time) after 60 seconds.')}}</v-list-tile-sub-title>
     </v-list-tile-content>
     <v-list-tile-action><m3-switch v-model="screensaver"></m3-switch></v-list-tile-action>
    </v-list-tile>
    <v-divider></v-divider>

    <v-list-tile>
     <v-list-tile-content @click="showArtwork = !showArtwork" class="switch-label">
      <v-list-tile-title>{{i18n('Show artwork')}}</v-list-tile-title>
      <v-list-tile-sub-title>{{i18n("Display covers, artist images, station logos, etc.")}}</v-list-tile-title>
     </v-list-tile-content>
     <v-list-tile-action><m3-switch v-model="showArtwork"></m3-switch></v-list-tile-action>
    </v-list-tile>
    <v-divider></v-divider>

    <v-list-tile>
     <v-list-tile-content @click="roundCovers = !roundCovers" class="switch-label">
      <v-list-tile-title>{{i18n('Round covers')}}</v-list-tile-title>
      <v-list-tile-sub-title>{{i18n('Round the corners of cover-art, etc.')}}</v-list-tile-sub-title>
     </v-list-tile-content>
     <v-list-tile-action><m3-switch v-model="roundCovers"></m3-switch></v-list-tile-action>
    </v-list-tile>
    <v-divider></v-divider>

    <v-list-tile v-if="LMS_STATS_ENABLED">
     <v-list-tile-content @click="showRating = !showRating" class="switch-label">
      <v-list-tile-title>{{i18n('Show rating')}}</v-list-tile-title>
      <v-list-tile-sub-title>{{i18n('Display rating stars.')}}{{undefined==ratingsPlugin  ? (" "+i18n("NOTE: Changing ratings requires an additional plugin.")) : ""}}</v-list-tile-sub-title>
     </v-list-tile-content>
     <v-list-tile-action><m3-switch v-model="showRating"></m3-switch></v-list-tile-action>
    </v-list-tile>
    <v-divider v-if="LMS_STATS_ENABLED"></v-divider>

    <v-list-tile>
     <v-list-tile-content @click="powerButton = !powerButton" class="switch-label">
      <v-list-tile-title>{{i18n('Show power button')}}</v-list-tile-title>
      <v-list-tile-sub-title>{{i18n("Replace player's icon in toolbar with a power button.")}}</v-list-tile-sub-title>
     </v-list-tile-content>
     <v-list-tile-action><m3-switch v-model="powerButton"></m3-switch></v-list-tile-action>
    </v-list-tile>
    <v-divider></v-divider>

    <v-list-tile>
     <v-list-tile-content @click="homeButton = !homeButton" class="switch-label">
      <v-list-tile-title>{{i18n('Show home button')}}</v-list-tile-title>
      <v-list-tile-sub-title>{{i18n('When navigating into lists, show a home button to quickly navigate to the main (home) screen. Otherwise navigating home can be achieved via a long-press on the back button.')}}</v-list-tile-sub-title>
     </v-list-tile-content>
     <v-list-tile-action><m3-switch v-model="homeButton"></m3-switch></v-list-tile-action>
    </v-list-tile>

    <v-divider v-if="hasPassword"></v-divider>
    <v-list-tile v-if="hasPassword">
     <v-text-field :label="i18n('Settings password')" clearable autocorrect="off" v-model="password" class="lms-search" :append-icon="showPassword ? 'visibility_off' : 'visibility'" @click:append="() => (showPassword = !showPassword)" :type="showPassword ? 'text' : 'password'"></v-text-field>
    </v-list-tile>

    <div class="dialog-padding"></div>
    <v-header class="dialog-section-header">{{i18n('Browse')}}</v-header>

    <v-list-tile>
     <v-list-tile-content @click="letterOverlay = !letterOverlay" class="switch-label">
      <v-list-tile-title>{{i18n('Draw letter overlay')}}</v-list-tile-title>
      <v-list-tile-sub-title>{{i18n('Draw large letter when scrolling certain lists (e.g. local artists, albums, etc.)')}}</v-list-tile-sub-title>
     </v-list-tile-content>
     <v-list-tile-action><m3-switch v-model="letterOverlay"></m3-switch></v-list-tile-action>
    </v-list-tile>
    <v-divider></v-divider>

    <v-list-tile>
     <v-list-tile-content @click="sortFavorites = !sortFavorites" class="switch-label">
      <v-list-tile-title>{{i18n('Sort favorites list')}}</v-list-tile-title>
      <v-list-tile-sub-title>{{i18n('Alphabetically sort favorites, rather than server supplied order.')}} {{i18n('NOTE: Folders are always sorted, this setting only affects playable items.')}}</v-list-tile-sub-title>
     </v-list-tile-content>
     <v-list-tile-action><m3-switch v-model="sortFavorites"></m3-switch></v-list-tile-action>
    </v-list-tile>
    <v-divider></v-divider>

    <v-list-tile>
     <v-list-tile-content @click="browseBackdrop = !browseBackdrop" class="switch-label">
      <v-list-tile-title>{{i18n('Draw background')}}</v-list-tile-title>
      <v-list-tile-sub-title>{{i18n('Use artist, or album, images as background.')}}</v-list-tile-sub-title>
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
     <v-list-tile-content @click="largeCovers = !largeCovers" class="switch-label">
      <v-list-tile-title>{{i18n('Large covers')}}</v-list-tile-title>
      <v-list-tile-sub-title>{{i18n("When possible, allow the grid view to show larger covers.")}}</v-list-tile-title>
     </v-list-tile-content>
     <v-list-tile-action><m3-switch v-model="largeCovers"></m3-switch></v-list-tile-action>
    </v-list-tile>
    <v-divider></v-divider>

    <v-list-tile>
     <v-list-tile-content @click="sortHome = !sortHome" class="switch-label">
      <v-list-tile-title>{{i18n('Sort home screen')}}</v-list-tile-title>
      <v-list-tile-sub-title>{{i18n('Automatically sort items on the home screen.')}}</v-list-tile-sub-title>
     </v-list-tile-content>
     <v-list-tile-action><m3-switch v-model="sortHome"></m3-switch></v-list-tile-action>
    </v-list-tile>
    <v-divider></v-divider>

    <v-list-tile>
     <v-list-tile-content class="switch-label">
      <v-list-tile-title>{{i18n('Home screen items')}}</v-list-tile-title>
      <v-list-tile-sub-title>{{i18n('Check the standard items which you wish to appear on the home screen.')}}</v-list-tile-sub-title>
     <v-list-tile-content/>
    </v-list-tile>
   
    <template v-for="(item, index) in showItems">
     <div style="display:flex">
      <v-checkbox v-model="item.show" :label="item.name" class="settings-list-checkbox"></v-checkbox>
      <v-btn v-if="item.id==TOP_MYMUSIC_ID" @click.stop="showBrowseModesDialog" flat icon class="settings-list-checkbox-action"><v-icon>settings</v-icon></v-btn>
     </div>
    </template>
    <div class="dialog-padding"></div>

    <div class="dialog-padding"></div>
    <v-header class="dialog-section-header">{{i18n('Now Playing')}}</v-header>

    <v-list-tile>
     <v-list-tile-content @click="nowPlayingTrackNum = !nowPlayingTrackNum" class="switch-label">
      <v-list-tile-title>{{i18n('Show track number')}}</v-list-tile-title>
      <v-list-tile-sub-title>{{i18n("Show track's album number next to title.")}}</v-list-tile-sub-title>
     </v-list-tile-content>
     <v-list-tile-action><m3-switch v-model="nowPlayingTrackNum"></m3-switch></v-list-tile-action>
    </v-list-tile>
    <v-divider></v-divider>

    <v-list-tile>
     <v-list-tile-content @click="swipeChangeTrack = !swipeChangeTrack" class="switch-label">
      <v-list-tile-title>{{i18n('Swipe to change track')}}</v-list-tile-title>
      <v-list-tile-sub-title>{{i18n("Swipe left and right (on cover in mobile layout) to change track.")}}</v-list-tile-sub-title>
     </v-list-tile-content>
     <v-list-tile-action><m3-switch v-model="swipeChangeTrack"></m3-switch></v-list-tile-action>
    </v-list-tile>
    <v-divider></v-divider>

    <v-list-tile>
     <v-list-tile-content @click="swipeVolume = !swipeVolume" class="switch-label">
      <v-list-tile-title>{{i18n('Swipe to change volume')}}</v-list-tile-title>
      <v-list-tile-sub-title>{{i18n("Swipe up and down to change current volume.")}}</v-list-tile-sub-title>
     </v-list-tile-content>
     <v-list-tile-action><m3-switch v-model="swipeVolume"></m3-switch></v-list-tile-action>
    </v-list-tile>
    <v-divider></v-divider>

    <v-list-tile>
     <v-select :items="skipSecondsOptions" :label="i18n('Previous/next long-press skip')" v-model="skipSeconds" item-text="label" item-value="value"></v-select>
    </v-list-tile>
    <v-divider></v-divider>

    <v-list-tile>
     <v-list-tile-content @click="stopButton = !stopButton" class="switch-label">
      <v-list-tile-title>{{i18n('Stop button')}}</v-list-tile-title>
      <v-list-tile-sub-title>{{i18n('Show a stop button next to the play/pause button.')}}</v-list-tile-sub-title>
     </v-list-tile-content>
     <v-list-tile-action><m3-switch v-model="stopButton"></m3-switch></v-list-tile-action>
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
    <v-list-tile-content @click="techInfo = !techInfo" class="switch-label">
     <v-list-tile-title>{{i18n('Display technical info')}}</v-list-tile-title>
     <v-list-tile-sub-title>{{i18n('Show file type, bitrate, etc.')}}</v-list-tile-sub-title>
    </v-list-tile-content>
     <v-list-tile-action><m3-switch v-model="techInfo"></m3-switch></v-list-tile-action>
    </v-list-tile>

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
      <v-list-tile-sub-title>{{i18n("Show track's album number next to title.")}}</v-list-tile-sub-title>
     </v-list-tile-content>
     <v-list-tile-action><m3-switch v-model="queueShowTrackNum"></m3-switch></v-list-tile-action>
    </v-list-tile>
    <v-divider></v-divider>

    <v-list-tile>
     <v-list-tile-content @click="queueThreeLines = !queueThreeLines" class="switch-label">
      <v-list-tile-title>{{i18n('Three lines')}}</v-list-tile-title>
      <v-list-tile-sub-title>{{i18n("Use three lines (title, artist, album) to show track details.")}}</v-list-tile-sub-title>
     </v-list-tile-content>
     <v-list-tile-action><m3-switch v-model="queueThreeLines"></m3-switch></v-list-tile-action>
    </v-list-tile>
    <v-divider></v-divider>

    <v-list-tile>
     <v-list-tile-content @click="queueBackdrop = !queueBackdrop" class="switch-label">
      <v-list-tile-title>{{i18n('Draw background')}}</v-list-tile-title>
      <v-list-tile-sub-title>{{i18n('Use cover of current track as background.')}}</v-list-tile-sub-title>
     </v-list-tile-content>
     <v-list-tile-action><m3-switch v-model="queueBackdrop"></m3-switch></v-list-tile-action>
    </v-list-tile>

    <div class="dialog-padding" v-if="infoPlugin"></div>
    <v-header class="dialog-section-header" v-if="infoPlugin">{{i18n('Song Information')}}</v-header>

    <v-list-tile v-if="infoPlugin">
     <v-list-tile-content @click="infoBackdrop = !infoBackdrop" class="switch-label">
      <v-list-tile-title>{{i18n('Draw background')}}</v-list-tile-title>
      <v-list-tile-sub-title>{{i18n('Use cover of current track as background.')}}</v-list-tile-sub-title>
     </v-list-tile-content>
     <v-list-tile-action><m3-switch v-model="infoBackdrop"></m3-switch></v-list-tile-action>
    </v-list-tile>

    <div class="dialog-padding"></div>
   </v-list>
  </v-card-text>
 </v-card>
</v-dialog>

 <v-dialog v-model="browseModesDialog.show" :width="browseModesDialog.wide ? 750 : 500" persistent style="overflow:hidden" v-if="browseModesDialog.show">
  <v-card>
   <v-card-title>{{i18n("Browse modes")}}</v-card-title>
   <table class="browse-modes-table dialog-main-list">
    <template v-for="(item, i) in browseModesDialog.modes">
     <tr v-if="!browseModesDialog.wide || i<browseModesDialog.halfLen">
      <td>
       <v-checkbox v-model="browseModesDialog.modes[i].enabled" :label="browseModesDialog.modes[i].text" error-count="0" hide-details  class="player-settings-list-checkbox"></v-checkbox>
      </td>
      <td v-if="browseModesDialog.wide && i+(browseModesDialog.halfLen)<browseModesDialog.modes.length">
       <v-checkbox v-model="browseModesDialog.modes[i+(browseModesDialog.halfLen)].enabled" :label="browseModesDialog.modes[i+(browseModesDialog.halfLen)].text" error-count="0" hide-details  class="player-settings-list-checkbox"></v-checkbox>
      </td>
     </tr>
    </template>
   </table>
   <div class="dialog-padding"></div>
   <v-card-actions>
    <v-spacer></v-spacer>
    <v-btn flat @click="browseModesDialog.show = false">{{i18n('Close')}}</v-btn>
   </v-card-actions>
  </v-card>
 </v-dialog>

</div>
`,
    data() {
        return {
            show: false,
            showMenu: false,
            theme: 'dark',
            themes: [ ],
            color: 'blue',
            colorList: { } ,
            userColors: [ ],
            colorToolbars: false,
            roundCovers : true,
            fontSize: 'r',
            fontSizes: [],
            listPadding: 0,
            listPaddings: [],
            letterOverlay:false,
            sortFavorites:true,
            autoScrollQueue:true,
            stopButton:false,
            browseBackdrop:true,
            queueBackdrop:true,
            nowPlayingBackdrop:true,
            infoBackdrop:true,
            browseTechInfo:false,
            techInfo:false,
            queueShowTrackNum:false,
            nowPlayingTrackNum:false,
            nowPlayingClock:false,
            nowPlayingContext:false,
            swipeVolume:false,
            swipeChangeTrack:false,
            keyboardControl:true,
            queueThreeLines:true,
            showArtwork:false,
            layout: null,
            layoutItems: [],
            volumeSteps: [ { value: 1,  label: "1%"},
                           { value: 2,  label: "2%"},
                           { value: 5,  label: "5%"},
                           { value: 10, label: "10%"}
                         ],
            volumeStep: 5,
            skipSecondsOptions: [ ],
            skipSeconds: 30,
            allowLayoutAdjust: window.location.href.indexOf('?layout=')<0 && window.location.href.indexOf('&layout=')<0,
            sortHome: IS_IPHONE,
            showItems: [ ],
            hasPassword: false,
            password: undefined,
            showPassword: false,
            browseModesDialog: {
                show: false,
                wide: false,
                modes: [],
                halfLen: 0
            },
            screensaver: false,
            serverName: "",
            showRating: false,
            homeButton: false,
            powerButton: false,
            largeCovers: false,
            width: 500,
            mediaControls: false,
            mediaControlsSupported: !queryParams.hide.has('mediaControls') && ('mediaSession' in navigator)
        }
    },
    computed: {
        infoPlugin () {
            return this.$store.state.infoPlugin
        },
        darkUi() {
            return this.$store.state.darkUi
        },
        ratingsPlugin() {
            return this.$store.state.ratingsPlugin
        },
        unlockAll() {
            return this.$store.state.unlockAll
        },
        player() {
            return this.$store.state.player
        },
        usingColoredToolbars() {
            return this.$store.state.coloredToolbars
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
                    }
                    this.browseModesDialog.modes.sort(function(a, b) { return a.weight!=b.weight ? a.weight<b.weight ? -1 : 1 : 0});
                    this.browseModesDialog.halfLen=Math.ceil(this.browseModesDialog.modes.length/2);
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
        bus.$on('esc', function() {
            if (this.showMenu) {
                this.showMenu = false;
            } else if (this.$store.state.activeDialog == 'browsemodes') {
                this.browseModesDialog.show=false;
            } else if (this.$store.state.activeDialog == 'uisettings') {
                this.show = false;
            }
        }.bind(this));
        bus.$on('hideMenu', function(name) {
            if (name=='uisettings') {
                this.showMenu = false;
            }
        }.bind(this));
        bus.$on('langChanged', function() {
            this.initItems();
        }.bind(this));
        this.initItems();
    },
    methods: {
        readStore() {
            let themeParts = this.$store.state.theme ? this.$store.state.theme.split('-') : ['dark'];
            let variant = themeParts.length>1 && ('colored'==themeParts[themeParts.length-1] || 'standard'==themeParts[themeParts.length-1]) ? themeParts.pop() : 'standard';
            this.theme = themeParts.join('-');
            this.colorToolbars = 'colored'==variant;
            this.color = this.$store.state.color;
            this.roundCovers = this.$store.state.roundCovers;
            this.fontSize = this.$store.state.fontSize;
            this.listPadding = this.$store.state.listPadding;
            this.autoScrollQueue = this.$store.state.autoScrollQueue;
            this.stopButton = this.$store.state.stopButton;
            this.browseBackdrop = this.$store.state.browseBackdrop;
            this.queueBackdrop = this.$store.state.queueBackdrop;
            this.nowPlayingBackdrop = this.$store.state.nowPlayingBackdrop;
            this.infoBackdrop = this.$store.state.infoBackdrop;
            this.browseTechInfo = this.$store.state.browseTechInfo;
            this.techInfo = this.$store.state.techInfo;
            this.queueShowTrackNum = this.$store.state.queueShowTrackNum;
            this.nowPlayingTrackNum = this.$store.state.nowPlayingTrackNum;
            this.nowPlayingClock = this.$store.state.nowPlayingClock;
            this.nowPlayingContext = this.$store.state.nowPlayingContext;
            this.swipeVolume = this.$store.state.swipeVolume;
            this.swipeChangeTrack = this.$store.state.swipeChangeTrack;
            this.keyboardControl = this.$store.state.keyboardControl;
            this.queueThreeLines = this.$store.state.queueThreeLines;
            this.showArtwork = this.$store.state.showArtwork;
            this.letterOverlay=this.$store.state.letterOverlay;
            this.sortFavorites = this.$store.state.sortFavorites;
            this.sortHome = this.$store.state.sortHome;
            this.skipSeconds = this.$store.state.skipSeconds;
            this.volumeStep = lmsOptions.volumeStep;
            this.showRating = this.$store.state.showRating;
            this.hidden = this.$store.state.hidden;
            this.screensaver = this.$store.state.screensaver;
            this.homeButton = this.$store.state.homeButton;
            this.powerButton = this.$store.state.powerButton;
            this.largeCovers = this.$store.state.largeCovers;
            this.mediaControls = this.$store.state.mediaControls;
            var disabled=new Set(JSON.parse(getLocalStorageVal("disabledItems", JSON.stringify([TOP_CDPLAYER_ID, TOP_REMOTE_ID]))));
            this.showItems=[{id: TOP_MYMUSIC_ID, name:i18n("My Music"), show:!this.hidden.has(TOP_MYMUSIC_ID)},
                            {id: TOP_RADIO_ID, name:i18n("Radio"), show:!this.hidden.has(TOP_RADIO_ID)},
                            {id: TOP_FAVORITES_ID, name:i18n("Favorites"), show:!this.hidden.has(TOP_FAVORITES_ID)},
                            {id: TOP_APPS_ID, name:i18n("Apps"), show:!this.hidden.has(TOP_APPS_ID)},
                            {id: TOP_EXTRAS_ID, name:i18n("Extras"), show:!this.hidden.has(TOP_EXTRAS_ID)}];
            if (!disabled.has(TOP_CDPLAYER_ID)) {
                this.showItems.push({id: TOP_CDPLAYER_ID, name:i18n("CD Player"), show:!this.hidden.has(TOP_CDPLAYER_ID)});
            }
            if (!disabled.has(TOP_REMOTE_ID)) {
                this.showItems.push({id: TOP_REMOTE_ID, name:i18n("Remote Libraries"), show:!this.hidden.has(TOP_REMOTE_ID)});
            }
        },
        initItems() {
            this.themes=[
                { key:'light',  label:i18n('Light')},
                { key:'dark',   label:i18n('Dark')},
                { key:'darker', label:i18n('Darker')},
                { key:'black',  label:i18n('Black')}
                ];
            this.layoutItems=[
                { key:"auto",    label:i18n("Automatic")},
                { key:"desktop", label:i18n("Use desktop layout")},
                { key:"mobile",  label:i18n("Use mobile layout")}
                ];
            this.skipSecondsOptions = [ { value: 5,  label: i18n("%1 seconds", 5) },
                               { value: 10, label: i18n("%1 seconds", 10)},
                               { value: 15, label: i18n("%1 seconds", 15)},
                               { value: 30, label: i18n("%1 seconds", 30)}
                             ];
            this.fontSizes = [ { key: 's',  label: i18n("Small") },
                               { key: 'r',  label: i18n("Regular") },
                               { key: 'l',  label: i18n("Large") }
                                ];
            this.listPaddings = [
                { value:0, label:i18n('None')},
                { value:1, label:i18n('Tiny')},
                { value:2, label:i18n('Small')},
                { value:4, label:i18n('Medium')},
                { value:8, label:i18n('Large')}
                ];
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
                    } else if (2==queryParams.nativeUiChanges) {
                        console.log("MATERIAL-UI\nJSON " + settingsNow);
                    }
                }
                this.currentSettings = undefined;
            }
        },
        settings(arrays, withSorts) {
            let settings = {
                      theme:this.theme+(this.colorToolbars ? '-colored' : ''),
                      color:this.color,
                      roundCovers:this.roundCovers,
                      fontSize:this.fontSize,
                      listPadding:this.listPadding,
                      autoScrollQueue:this.autoScrollQueue,
                      letterOverlay:this.letterOverlay,
                      sortFavorites:this.sortFavorites,
                      sortHome:this.sortHome,
                      stopButton:this.stopButton,
                      browseBackdrop:this.browseBackdrop,
                      queueBackdrop:this.queueBackdrop,
                      nowPlayingBackdrop:this.nowPlayingBackdrop,
                      infoBackdrop:this.infoBackdrop,
                      browseTechInfo:this.browseTechInfo,
                      techInfo:this.techInfo,
                      queueShowTrackNum:this.queueShowTrackNum,
                      nowPlayingTrackNum:this.nowPlayingTrackNum,
                      nowPlayingClock:this.nowPlayingClock,
                      nowPlayingContext:this.nowPlayingContext,
                      swipeVolume:this.swipeVolume,
                      swipeChangeTrack:this.swipeChangeTrack,
                      keyboardControl:this.keyboardControl,
                      showArtwork:this.showArtwork,
                      queueThreeLines:this.queueThreeLines,
                      volumeStep:this.volumeStep,
                      hidden:arrays ? Array.from(this.hiddenItems()) : this.hiddenItems(),
                      skipSeconds:this.skipSeconds,
                      disabledBrowseModes:arrays ? Array.from(this.disabledBrowseModes()) : this.disabledBrowseModes(),
                      screensaver:this.screensaver,
                      homeButton:this.homeButton,
                      powerButton:this.powerButton,
                      largeCovers:this.largeCovers,
                      showRating:this.showRating,
                      mediaControls:this.mediaControls
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
        saveAsDefault() {
            confirm(i18n("Save the current settings as default for new users?")+
                         (this.allowLayoutAdjust ? addNote(i18n("NOTE:'Application layout' is not saved, as this is a per-device setting.")) : ""),
                    i18n('Set Defaults')).then(res => {
                if (res) {
                    var settings = this.settings(true, true);

                    lmsCommand("", ["pref", LMS_MATERIAL_UI_DEFAULT_PREF, JSON.stringify(settings)]);
                    lmsCommand("", ["pref", LMS_MATERIAL_DEFAULT_ITEMS_PREF, getLocalStorageVal("topItems", "[]")]);
                }
            });
        },
        revertToDefault() {
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
        keyboardInfo() {
            var list = queryParams.party
                     ? [ shortcutStr("space")+SEPARATOR+i18n("Play/pause"),
                         shortcutStr("home")+SEPARATOR+i18n("Go to homescreen"),
                         shortcutStr("esc")+SEPARATOR+i18n("Go back"),
                         shortcutStr(ACTIONS[SEARCH_LIB_ACTION].key)+SEPARATOR+ACTIONS[SEARCH_LIB_ACTION].title,
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
                         shortcutStr(ACTIONS[SEARCH_LIB_ACTION].key)+SEPARATOR+ACTIONS[SEARCH_LIB_ACTION].title,
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
            if (!queryParams.party && undefined!=this.$store.state.ratingsPlugin && this.$store.state.showRating) {
                list.push(shortcutStr("(N)", true)+SEPARATOR+i18n("Set rating (0..5)"));
            }
            bus.$emit('dlg.open', 'iteminfo', { list:list });
        },
        mediaControlsInfo() {
            showAlert(i18n('To support this feature, this app needs to fool your browser into thinking its is playing audio. This is accomplished by playing a silent audio file in a loop. Most browsers block auto-playing of audio so this cannot start until you have interacted with the app (e.g. clicked somewhere). Alternatively you can configure your browser to allow auto-play of audio for the URL you use to access this app (%1).', window.location.hostname+':'+window.location.port));
        },
        i18n(str) {
            if (this.show) {
                return i18n(str);
            } else {
                return str;
            }
        },
        showBrowseModesDialog() {
            this.browseModesDialog.wide = window.innerWidth >= 700;
            this.browseModesDialog.show=true;
        }
    },
    watch: {
        'show': function(val) {
            this.$store.commit('dialogOpen', {name:'uisettings', shown:val});
        },
        'browseModesDialog.show': function(val) {
            this.$store.commit('dialogOpen', {name:'browsemodes', shown:val});
        },
        'showMenu': function(newVal) {
            this.$store.commit('menuVisible', {name:'uisettings', shown:newVal});
        }
    },
    filters: {
        svgIcon: function (name, dark, coloredToolbars) {
            return "/material/svg/"+name+"?c="+(dark || coloredToolbars ? LMS_DARK_SVG : LMS_LIGHT_SVG)+"&r="+LMS_MATERIAL_REVISION;
        }
    }
})

