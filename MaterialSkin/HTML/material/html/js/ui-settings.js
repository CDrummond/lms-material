/**
 * LMS-Material
 *
 * Copyright (c) 2018-2020 Craig Drummond <craig.p.drummond@gmail.com>
 * MIT license.
 */

Vue.component('lms-ui-settings', {
    template: `
<v-dialog v-model="show" v-if="show" scrollable fullscreen>
 <v-card>
  <v-card-title class="settings-title">
   <v-toolbar color="primary" dark app class="lms-toolbar">
    <v-btn flat icon @click.native="close"><v-icon>arrow_back</b-icon></v-btn>
    <v-toolbar-title>{{TB_UI_SETTINGS.title}}</v-toolbar-title>
    <v-spacer></v-spacer>
    <v-btn flat icon @click.native="saveAsDefault" :title="i18n('Save as default')"><v-icon>save</b-icon></v-btn>
   </v-toolbar>
  </v-card-title>
  <v-card-text>
   <v-list two-line subheader class="settings-list">
    <v-header class="dialog-section-header">{{i18n('General')}}</v-header>

    <v-list-tile>
     <v-list-tile-content @click="darkUi = !darkUi" class="switch-label">
      <v-list-tile-title>{{i18n('Use dark theme')}}</v-list-tile-title>
      <v-list-tile-sub-title>{{i18n('Light text on a dark background.')}}</v-list-tile-title>
     </v-list-tile-content>
     <v-list-tile-action><v-switch v-model="darkUi"></v-switch></v-list-tile-action>
    </v-list-tile>
    <v-divider></v-divider>

    <v-list-tile v-if="allowLayoutAdjust">
     <v-select :items="layoutItems" :label="i18n('Application layout')" v-model="layout" item-text="label" item-value="key"></v-select>
    </v-list-tile>
    <v-divider v-if="allowLayoutAdjust"></v-divider>

    <v-list-tile>
     <v-list-tile-content @click="largeFonts = !largeFonts" class="switch-label">
      <v-list-tile-title>{{i18n('Larger fonts')}}</v-list-tile-title>
      <v-list-tile-sub-title>{{i18n('Use larger font sizes.')}}</v-list-tile-title>
     </v-list-tile-content>
     <v-list-tile-action><v-switch v-model="largeFonts"></v-switch></v-list-tile-action>
    </v-list-tile>
    <v-divider></v-divider>

    <v-list-tile>
     <v-list-tile-content @click="stopButton = !stopButton" class="switch-label">
      <v-list-tile-title>{{i18n('Stop button')}}</v-list-tile-title>
      <v-list-tile-sub-title>{{i18n('Show a stop button next to the play/pause button.')}}</v-list-tile-title>
     </v-list-tile-content>
     <v-list-tile-action><v-switch v-model="stopButton"></v-switch></v-list-tile-action>
    </v-list-tile>
    <v-divider></v-divider>

    <v-list-tile>
     <v-select :items="volumeSteps" :label="i18n('Volume step')" v-model="volumeStep" item-text="label" item-value="value"></v-select>
    </v-list-tile>
    <v-divider></v-divider>

    <v-list-tile v-if="!IS_MOBILE">
     <v-list-tile-content @click="keyboardControl = !keyboardControl" class="switch-label">
      <v-list-tile-title>{{i18n('Keyboard shortcuts')}}</v-list-tile-title>
      <v-list-tile-sub-title>{{i18n("Enable keyboard shortcuts")}} <v-btn flat icon style="margin-top:4px;height:18px;width:18px; opacity:var(--sub-opacity)" @click.stop="keyboardInfo"><v-icon small>help_outline</v-icon></v-btn</v-list-tile-title>
     </v-list-tile-content>
     <v-list-tile-action><v-switch v-model="keyboardControl"></v-switch></v-list-tile-action>
    </v-list-tile>
    <v-divider v-if="!IS_MOBILE"></v-divider>

    <v-list-tile>
     <v-list-tile-content @click="menuIcons = !menuIcons" class="switch-label">
      <v-list-tile-title>{{i18n('Menu icons')}}</v-list-tile-title>
      <v-list-tile-sub-title>{{i18n('Show icons next to popup menu entries.')}}</v-list-tile-title>
     </v-list-tile-content>
     <v-list-tile-action><v-switch v-model="menuIcons"></v-switch></v-list-tile-action>
    </v-list-tile>

    <v-divider v-if="android"></v-divider>
    <v-list-tile v-if="android">
     <v-list-tile-content @click="showPlayerMenuEntry = !showPlayerMenuEntry" class="switch-label">
      <v-list-tile-title>{{i18n("Add menu option to start player")}}</v-list-tile-title>
      <v-list-tile-sub-title>{{i18n('Add option to main menu to launch player.')}} {{i18n('Lock screen and notification controls will be disabled whilst player is active.')}} {{i18n("(Currently only 'SB Player' is supported.)")}}</v-list-tile-title>
     </v-list-tile-content>
     <v-list-tile-action><v-switch v-model="showPlayerMenuEntry"></v-switch></v-list-tile-action>
    </v-list-tile>

    <v-divider v-if="hasPassword"></v-divider>
    <v-list-tile v-if="hasPassword">
     <v-text-field clearable :label="i18n('Settings password')" v-model="password" class="lms-search"></v-text-field>
    </v-list-tile>

    <div class="dialog-padding" v-if="android"></div>
    <v-header class="dialog-section-header" v-if="android">{{i18n('Lock screen and notification')}}</v-header>
    <v-list-tile v-if="android">
     <v-list-tile-content @click="lsAndNotif = !lsAndNotif" class="switch-label">
      <v-list-tile-title>{{i18n('Show controls')}}</v-list-tile-title>
      <v-list-tile-sub-title>{{i18n("Show playback controls and details of current track on Android's lock screen and notifications.")}}</v-list-tile-title>
     </v-list-tile-content>
     <v-list-tile-action><v-switch v-model="lsAndNotif"></v-switch></v-list-tile-action>
    </v-list-tile>
    <v-divider v-if="android"></v-divider>
    <v-list-tile v-if="android">
     <v-list-tile-content @click="lsAndNotifPlaySilence = !lsAndNotifPlaySilence" class="switch-label">
      <v-list-tile-title>{{i18n('Play silence')}}</v-list-tile-title>
      <v-list-tile-sub-title>{{i18n('Enable this option to have a dummy silence file played whilst LMS is playing music. This is required for some browsers (e.g. Chrome) to keep the notifications alive and for correct operation of the play/pause button. If you toggle this setting you will need to reload your browser session.')}}</v-list-tile-title>
     </v-list-tile-content>
     <v-list-tile-action><v-switch v-model="lsAndNotifPlaySilence"></v-switch></v-list-tile-action>
    </v-list-tile>

    <div class="dialog-padding"></div>
    <v-header class="dialog-section-header">{{i18n('Browse')}}</v-header>

    <v-list-tile>
     <v-list-tile-content @click="letterOverlay = !letterOverlay" class="switch-label">
      <v-list-tile-title>{{i18n('Draw letter overlay')}}</v-list-tile-title>
      <v-list-tile-sub-title>{{i18n('Draw large letter when scrolling certain lists (e.g. local artists, albums, etc.)')}}</v-list-tile-title>
     </v-list-tile-content>
     <v-list-tile-action><v-switch v-model="letterOverlay"></v-switch></v-list-tile-action>
    </v-list-tile>
    <v-divider></v-divider>

    <v-list-tile>
     <v-list-tile-content @click="showMenuAudio = !showMenuAudio" class="switch-label">
      <v-list-tile-title>{{i18n('Always show menu')}}</v-list-tile-title>
      <v-list-tile-sub-title>{{i18n('Show context menu when clicking anywhere on an audio item.')}}</v-list-tile-title>
     </v-list-tile-content>
     <v-list-tile-action><v-switch v-model="showMenuAudio"></v-switch></v-list-tile-action>
    </v-list-tile>
    <v-divider></v-divider>

    <v-list-tile>
     <v-list-tile-content @click="sortFavorites = !sortFavorites" class="switch-label">
      <v-list-tile-title>{{i18n('Sort favorites list')}}</v-list-tile-title>
      <v-list-tile-sub-title>{{i18n('Alphabetically sort favorites, rather than server supplied order.')}}</v-list-tile-title>
     </v-list-tile-content>
     <v-list-tile-action><v-switch v-model="sortFavorites"></v-switch></v-list-tile-action>
    </v-list-tile>
    <v-divider></v-divider>

    <v-list-tile>
     <v-list-tile-content @click="browseBackdrop = !browseBackdrop" class="switch-label">
      <v-list-tile-title>{{i18n('Draw background')}}</v-list-tile-title>
      <v-list-tile-sub-title>{{i18n('Use artist, or album, images as background.')}}</v-list-tile-title>
     </v-list-tile-content>
     <v-list-tile-action><v-switch v-model="browseBackdrop"></v-switch></v-list-tile-action>
    </v-list-tile>
    <v-divider></v-divider>

    <v-list-tile>
     <v-list-tile-content @click="sortHome = !sortHome" class="switch-label">
      <v-list-tile-title>{{i18n('Sort home screen')}}</v-list-tile-title>
      <v-list-tile-sub-title>{{i18n('Automatically sort items on the home screen. Required for iPhone due to this not supporting drag-and-drop.')}}</v-list-tile-title>
     </v-list-tile-content>
     <v-list-tile-action><v-switch v-model="sortHome"></v-switch></v-list-tile-action>
    </v-list-tile>
    <v-divider></v-divider>

    <v-list-tile>
     <v-list-tile-content class="switch-label">
      <v-list-tile-title>{{i18n('Home screen items')}}</v-list-tile-title>
      <v-list-tile-sub-title>{{i18n('Check the standard items which you wish to appear on the home screen.')}}</v-list-tile-title>
     <v-list-tile-content/>
    </v-list-tile>
   
    <template v-for="(item, index) in showItems">
     <v-checkbox v-model="item.show" :label="item.name" class="settings-list-checkbox"></v-checkbox>
    </template>
    <div class="dialog-padding"></div>

    <div class="dialog-padding"></div>
    <v-header class="dialog-section-header">{{i18n('Now Playing')}}</v-header>

    <v-list-tile>
     <v-list-tile-content @click="techInfo = !techInfo" class="switch-label">
      <v-list-tile-title>{{i18n('Display technical info')}}</v-list-tile-title>
      <v-list-tile-sub-title>{{i18n('Show file type, bitrate, etc.')}}</v-list-tile-title>
     </v-list-tile-content>
     <v-list-tile-action><v-switch v-model="techInfo"></v-switch></v-list-tile-action>
    </v-list-tile>
    <v-divider></v-divider>

    <v-list-tile>
     <v-list-tile-content @click="nowPlayingBackdrop = !nowPlayingBackdrop" class="switch-label">
      <v-list-tile-title>{{i18n('Draw background')}}</v-list-tile-title>
      <v-list-tile-sub-title>{{i18n('Use cover of current track as background.')}}</v-list-tile-title>
     </v-list-tile-content>
     <v-list-tile-action><v-switch v-model="nowPlayingBackdrop"></v-switch></v-list-tile-action>
    </v-list-tile>
    <v-divider></v-divider>

    <v-list-tile>
     <v-list-tile-content @click="nowPlayingTrackNum = !nowPlayingTrackNum" class="switch-label">
      <v-list-tile-title>{{i18n('Show track number')}}</v-list-tile-title>
      <v-list-tile-sub-title>{{i18n("Show track's album number next to title.")}}</v-list-tile-title>
     </v-list-tile-content>
     <v-list-tile-action><v-switch v-model="nowPlayingTrackNum"></v-switch></v-list-tile-action>
    </v-list-tile>
    <v-divider></v-divider>

    <v-list-tile>
     <v-list-tile-content @click="swipeVolume = !swipeVolume" class="switch-label">
      <v-list-tile-title>{{i18n('Swipe to change volume')}}</v-list-tile-title>
      <v-list-tile-sub-title>{{i18n("Swipe up and down to change current volume.")}}</v-list-tile-title>
     </v-list-tile-content>
     <v-list-tile-action><v-switch v-model="swipeVolume"></v-switch></v-list-tile-action>
    </v-list-tile>
    <v-divider></v-divider>
    <v-list-tile>
     <v-select :items="skipSecondsOptions" :label="i18n('Previous/next long-press skip')" v-model="skipSeconds" item-text="label" item-value="value"></v-select>
    </v-list-tile>


    <div class="dialog-padding"></div>
    <v-header class="dialog-section-header">{{i18n('Queue')}}</v-header>

    <v-list-tile>
     <v-list-tile-content @click="autoScrollQueue = !autoScrollQueue" class="switch-label">
      <v-list-tile-title>{{i18n('Auto-scroll to current track')}}</v-list-tile-title>
      <v-list-tile-sub-title>{{i18n('Scroll play queue when current track changes.')}}</v-list-tile-title>
     </v-list-tile-content>
     <v-list-tile-action><v-switch v-model="autoScrollQueue"></v-switch></v-list-tile-action>
    </v-list-tile>
    <v-divider></v-divider>

    <v-list-tile>
     <v-list-tile-content @click="showMenuAudioQueue = !showMenuAudioQueue" class="switch-label">
      <v-list-tile-title>{{i18n('Always show menu')}}</v-list-tile-title>
      <v-list-tile-sub-title>{{i18n('Show context menu when clicking anywhere on an audio item.')}}</v-list-tile-title>
     </v-list-tile-content>
     <v-list-tile-action><v-switch v-model="showMenuAudioQueue"></v-switch></v-list-tile-action>
    </v-list-tile>
    <v-divider></v-divider>

    <v-list-tile>
     <v-list-tile-content @click="queueBackdrop = !queueBackdrop" class="switch-label">
      <v-list-tile-title>{{i18n('Draw background')}}</v-list-tile-title>
      <v-list-tile-sub-title>{{i18n('Use cover of current track as background.')}}</v-list-tile-title>
     </v-list-tile-content>
     <v-list-tile-action><v-switch v-model="queueBackdrop"></v-switch></v-list-tile-action>
    </v-list-tile>
    <v-divider></v-divider>

    <v-list-tile>
     <v-list-tile-content @click="queueShowTrackNum = !queueShowTrackNum" class="switch-label">
      <v-list-tile-title>{{i18n('Show track number')}}</v-list-tile-title>
      <v-list-tile-sub-title>{{i18n("Show track's album number next to title.")}}</v-list-tile-title>
     </v-list-tile-content>
     <v-list-tile-action><v-switch v-model="queueShowTrackNum"></v-switch></v-list-tile-action>
    </v-list-tile>
    <v-divider></v-divider>

    <v-list-tile>
     <v-list-tile-content @click="queueThreeLines = !queueThreeLines" class="switch-label">
      <v-list-tile-title>{{i18n('Three lines')}}</v-list-tile-title>
      <v-list-tile-sub-title>{{i18n("Use three lines (title, artist, album) to show track details.")}}</v-list-tile-title>
     </v-list-tile-content>
     <v-list-tile-action><v-switch v-model="queueThreeLines"></v-switch></v-list-tile-action>
    </v-list-tile>

    <div class="dialog-padding" v-if="infoPlugin"></div>
    <v-header v-if="infoPlugin">{{i18n('Song Information')}}</v-header>

    <v-list-tile v-if="infoPlugin">
     <v-list-tile-content @click="infoBackdrop = !infoBackdrop" class="switch-label">
      <v-list-tile-title>{{i18n('Draw background')}}</v-list-tile-title>
      <v-list-tile-sub-title>{{i18n('Use cover of current track as background.')}}</v-list-tile-title>
     </v-list-tile-content>
     <v-list-tile-action><v-switch v-model="infoBackdrop"></v-switch></v-list-tile-action>
    </v-list-tile>

    <div class="dialog-padding"></div>
   </v-list>
  </v-card-text>
 </v-card>
</v-dialog>
`,
    props: [ 'desktop' ],
    data() {
        return {
            show: false,
            darkUi: true,
            largeFonts: false,
            letterOverlay:false,
            showMenuAudio:true,
            sortFavorites:true,
            autoScrollQueue:true,
            stopButton:false,
            browseBackdrop:true,
            queueBackdrop:true,
            showMenuAudioQueue:true,
            nowPlayingBackdrop:false,
            infoBackdrop:true,
            techInfo:false,
            queueShowTrackNum:false,
            nowPlayingTrackNum:false,
            swipeVolume:false,
            keyboardControl:true,
            queueThreeLines:false,
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
            showPlayerMenuEntry: false,
            lsAndNotif: true,
            lsAndNotifPlaySilence: false,
            android: IS_ANDROID,
            menuIcons: true,
            showPresets: false,
            allowLayoutAdjust: window.location.href.indexOf('auto=false')<0,
            sortHome: IS_IPHONE,
            showItems: [ ],
            hasPassword: false,
            password: undefined
        }
    },
    computed: {
        infoPlugin () {
            return this.$store.state.infoPlugin
        }
    },
    mounted() {
        bus.$on('uisettings.open', function(act) {
            this.lsAndNotifPlaySilence = getLocalStorageBool('playSilence', false);
            this.darkUi = this.$store.state.darkUi;
            this.largeFonts = this.$store.state.largeFonts;
            this.autoScrollQueue = this.$store.state.autoScrollQueue;
            this.stopButton = this.$store.state.stopButton;
            this.browseBackdrop = this.$store.state.browseBackdrop;
            this.queueBackdrop = this.$store.state.queueBackdrop;
            this.nowPlayingBackdrop = this.$store.state.nowPlayingBackdrop;
            this.infoBackdrop = this.$store.state.infoBackdrop;
            this.techInfo = this.$store.state.techInfo;
            this.queueShowTrackNum = this.$store.state.queueShowTrackNum;
            this.nowPlayingTrackNum = this.$store.state.nowPlayingTrackNum;
            this.swipeVolume = this.$store.state.swipeVolume;
            this.keyboardControl = this.$store.state.keyboardControl;
            this.queueThreeLines = this.$store.state.queueThreeLines;
            this.lsAndNotif=this.$store.state.lsAndNotif;
            this.letterOverlay=this.$store.state.letterOverlay;
            this.sortFavorites = this.$store.state.sortFavorites;
            this.sortHome = this.$store.state.sortHome;
            this.showMenuAudio = this.$store.state.showMenuAudio;
            this.showMenuAudioQueue = this.$store.state.showMenuAudioQueue;
            this.password = getLocalStorageVal('password', '');
            if (this.allowLayoutAdjust) {
                this.layout = getLocalStorageVal("layout", "auto");
                this.layoutOrig = this.layout;
            }
            this.skipSeconds = this.$store.state.skipSeconds;
            this.volumeStep = volumeStep;
            this.showPlayerMenuEntry = this.$store.state.showPlayerMenuEntry;
            this.menuIcons = this.$store.state.menuIcons;
            this.hidden = this.$store.state.hidden;

            var disabled=new Set(JSON.parse(getLocalStorageVal("disabledItems", "[]")));
            this.showItems=[{id: TOP_MYMUSIC_ID, name:i18n("My Music"), show:!this.hidden.has(TOP_MYMUSIC_ID)},
                            {id: TOP_RADIO_ID, name:i18n("Radio"), show:!this.hidden.has(TOP_RADIO_ID)},
                            {id: TOP_FAVORITES_ID, name:i18n("Favorites"), show:!this.hidden.has(TOP_FAVORITES_ID)},
                            {id: TOP_PRESETS_ID, name:i18n("Presets"), show:!this.hidden.has(TOP_PRESETS_ID)},
                            {id: TOP_APPS_ID, name:i18n("Apps"), show:!this.hidden.has(TOP_APPS_ID)}];
            if (!disabled.has(TOP_CDPLAYER_ID)) {
                this.showItems.push({id: TOP_CDPLAYER_ID, name:i18n("CD Player"), show:!this.hidden.has(TOP_CDPLAYER_ID)});
            }
            if (!disabled.has(TOP_REMOTE_ID)) {
                this.showItems.push({id: TOP_REMOTE_ID, name:i18n("Remote Libraries"), show:!this.hidden.has(TOP_REMOTE_ID)});
            }
            this.hasPassword = false;
            lmsCommand("", ["material-skin", "pass-isset"]).then(({data}) => {
                if (1==parseInt(data.result['set'])) {
                    this.hasPassword = true;
                }
            }).catch(err => {
            });
            this.show = true;
        }.bind(this));
        bus.$on('esc', function() {
            if (this.$store.state.activeDialog == 'uisettings') {
                this.show=false;
            }
        }.bind(this));
        bus.$on('langChanged', function() {
            this.initItems();
        }.bind(this));
        this.initItems();
    },
    methods: {
        initItems() {
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
        },
        close() {
            this.show=false;
            setLocalStorageVal('playSilence', this.lsAndNotifPlaySilence);
            this.$store.commit('setUiSettings', { darkUi:this.darkUi,
                                                  largeFonts:this.largeFonts,
                                                  autoScrollQueue:this.autoScrollQueue,
                                                  letterOverlay:this.letterOverlay,
                                                  sortFavorites:this.sortFavorites,
                                                  sortHome:this.sortHome,
                                                  showMenuAudio:this.showMenuAudio,
                                                  stopButton:this.stopButton,
                                                  browseBackdrop:this.browseBackdrop,
                                                  queueBackdrop:this.queueBackdrop,
                                                  showMenuAudioQueue:this.showMenuAudioQueue,
                                                  nowPlayingBackdrop:this.nowPlayingBackdrop,
                                                  infoBackdrop:this.infoBackdrop,
                                                  techInfo:this.techInfo,
                                                  queueShowTrackNum:this.queueShowTrackNum,
                                                  nowPlayingTrackNum:this.nowPlayingTrackNum,
                                                  swipeVolume:this.swipeVolume,
                                                  keyboardControl:this.keyboardControl,
                                                  queueThreeLines:this.queueThreeLines,
                                                  volumeStep:this.volumeStep,
                                                  showPlayerMenuEntry:this.showPlayerMenuEntry,
                                                  lsAndNotif:this.lsAndNotif,
                                                  menuIcons:this.menuIcons,
                                                  hidden:this.hiddenItems(),
                                                  skipSeconds:this.skipSeconds
                                                } );
            if (this.allowLayoutAdjust && (this.layout != this.layoutOrig)) {
                setLocalStorageVal("layout", this.layout);
                if ( (!this.desktop && "desktop"==this.layout) || (this.desktop && "mobile"==this.layout) ) {
                    window.location.href = this.layout;
                } else {
                    setAutoLayout(this.layout == "auto");
                }
            }
            if (this.password != getLocalStorageVal('password', '-')) {
                this.$store.commit('setPassword', this.password);
            }
        },
        saveAsDefault() {
            this.$confirm(i18n("Save the current settings as default for new users?")+
                                "<br/><br/><p style=\"font-weight:200\">"+
                                (this.allowLayoutAdjust ? i18n("NOTE: 'Application layout' is not saved, as this is a per-device setting.") : "")+"</p>",
                          {buttonTrueText: i18n('Set Defaults'), buttonFalseText: i18n('Cancel')}).then(res => {
                if (res) {
                    var settings = { darkUi:this.darkUi,
                                     largeFonts:this.largeFonts,
                                     autoScrollQueue:this.autoScrollQueue,
                                     letterOverlay:this.letterOverlay,
                                     sortFavorites:this.sortFavorites,
                                     sortHome:this.sortHome,
                                     showMenuAudio:this.showMenuAudio,
                                     stopButton:this.stopButton,
                                     browseBackdrop:this.browseBackdrop,
                                     queueBackdrop:this.queueBackdrop,
                                     showMenuAudioQueue:this.showMenuAudioQueue,
                                     nowPlayingBackdrop:this.nowPlayingBackdrop,
                                     infoBackdrop:this.infoBackdrop,
                                     techInfo:this.techInfo,
                                     queueShowTrackNum:this.queueShowTrackNum,
                                     nowPlayingTrackNum:this.nowPlayingTrackNum,
                                     swipeVolume:this.swipeVolume,
                                     keyboardControl:this.keyboardControl,
                                     queueThreeLines:this.queueThreeLines,
                                     volumeStep:this.volumeStep,
                                     showPlayerMenuEntry:this.showPlayerMenuEntry,
                                     lsAndNotif:this.lsAndNotif,
                                     menuIcons:this.menuIcons,
                                     hidden:Array.from(this.hiddenItems()),
                                     skipSeconds:this.skipSeconds
                                   };
                    lmsCommand("", ["pref", LMS_MATERIAL_UI_DEFAULT_PREF, JSON.stringify(settings)]);
                    lmsCommand("", ["pref", LMS_MATERIAL_DEFAULT_ITEMS_PREF, getLocalStorageVal("topItems", "[]")]);
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
        keyboardInfo() {
            var list = [ i18n("Alt+%1", "▲")+SEPARATOR+i18n("Increase volume"),
                         i18n("Alt+%1", "▼")+SEPARATOR+i18n("Decrease volume"),
                         i18n("Alt+%1", "◀")+SEPARATOR+i18n("Previous track"),
                         i18n("Alt+%1", "▶")+SEPARATOR+i18n("Next track"),
                         i18n("Spacebar")+SEPARATOR+i18n("Play/pause"),
                         i18n("Home")+SEPARATOR+i18n("Go to homescreen"),
                         shortcutStr("◀")+SEPARATOR+i18n("Go back"),
                         shortcutStr(ACTIONS[SEARCH_LIB_ACTION].key)+SEPARATOR+ACTIONS[SEARCH_LIB_ACTION].title,
                         shortcutStr(ACTIONS[PLAY_ACTION].skey, true)+SEPARATOR+ACTIONS[PLAY_ACTION].title,
                         shortcutStr(ACTIONS[ADD_ACTION].skey, true)+SEPARATOR+ACTIONS[ADD_ACTION].title,
                         shortcutStr(LMS_ADD_ITEM_ACTION_KEYBOARD, true)+SEPARATOR+i18n("Add favorite, podcast, or preset"),
                         shortcutStr(ACTIONS[ADD_FAV_FOLDER_ACTION].skey, true)+SEPARATOR+ACTIONS[ADD_FAV_FOLDER_ACTION].title,
                         shortcutStr(LMS_TRACK_INFO_KEYBOARD)+SEPARATOR+i18n("Show current track information")];
            if (this.desktop) {
                list.push(shortcutStr(LMS_EXPAND_NP_KEYBOARD, true)+SEPARATOR+i18n("Expand now playing"));
            }
            list.push(shortcutStr(LMS_SAVE_QUEUE_KEYBOARD)+SEPARATOR+i18n("Save queue"));
            list.push(shortcutStr(LMS_CLEAR_QUEUE_KEYBOARD)+SEPARATOR+i18n("Clear queue"));
            list.push(shortcutStr(ACTIONS[PQ_MOVE_QUEUE_ACTION].key)+SEPARATOR+ACTIONS[PQ_MOVE_QUEUE_ACTION].title);
            list.push(shortcutStr(ACTIONS[PQ_ADD_URL_ACTION].key)+SEPARATOR+ACTIONS[PQ_ADD_URL_ACTION].title);
            list.push(shortcutStr(ACTIONS[PQ_SCROLL_ACTION].key)+SEPARATOR+ACTIONS[PQ_SCROLL_ACTION].title);
            list.push(shortcutStr(LMS_SETTINGS_KEYBOARD)+SEPARATOR+TB_UI_SETTINGS.title);
            list.push(shortcutStr(LMS_PLAYER_SETTINGS_KEYBOARD)+SEPARATOR+TB_PLAYER_SETTINGS.title);
            if (this.$store.state.unlockAll) {
                list.push(shortcutStr(LMS_SERVER_SETTINGS_KEYBOARD)+SEPARATOR+TB_SERVER_SETTINGS.title);
            }
            list.push(shortcutStr(LMS_INFORMATION_KEYBOARD)+SEPARATOR+TB_INFO.title);
            list.push(shortcutStr(LMS_MANAGEPLAYERS_KEYBOARD)+SEPARATOR+TB_MANAGE_PLAYERS.title);
            list.push(shortcutStr(LMS_SYNC_KEYBOARD)+SEPARATOR+i18n("Synchronise"));
            list.push(i18n("Alt+N")+SEPARATOR+i18n("Switch to Nth player"));
            if (!this.desktop) {
                list.push("F1"+SEPARATOR+i18n("Browse"));
                list.push("F2"+SEPARATOR+i18n("Playing"));
                list.push("F3"+SEPARATOR+i18n("Queue"));
            }
            bus.$emit('dlg.open', 'iteminfo', { list:list });
        },
        i18n(str) {
            if (this.show) {
                return i18n(str);
            } else {
                return str;
            }
        }
    },
    watch: {
        'show': function(val) {
            this.$store.commit('dialogOpen', {name:'uisettings', shown:val});
        }
    }
})

