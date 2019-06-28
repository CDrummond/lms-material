/**
 * LMS-Material
 *
 * Copyright (c) 2018-2019 Craig Drummond <craig.p.drummond@gmail.com>
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
    <v-header>{{i18n('General')}}</v-header>

    <v-list-tile>
     <v-list-tile-content @click="darkUi = !darkUi" class="switch-label">
      <v-list-tile-title>{{i18n('Use dark theme')}}</v-list-tile-title>
      <v-list-tile-sub-title>{{i18n('Light text on a dark background.')}}</v-list-tile-title>
     </v-list-tile-content>
     <v-list-tile-action><v-switch v-model="darkUi"></v-switch></v-list-tile-action>
    </v-list-tile>
    <v-divider></v-divider>

    <v-list-tile>
     <v-select :items="layoutItems" :label="i18n('Application layout')" v-model="layout" item-text="label" item-value="key"></v-select>
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

    <v-divider v-if="android"></v-divider>
    <v-list-tile v-if="android">
     <v-select :items="lsAndNotifItems" :label="i18n('Lock screen and notification controls')" v-model="lsAndNotif" item-text="label" item-value="key"></v-select>
    </v-list-tile>

    <div class="dialog-padding"></div>
    <v-header>{{i18n('Browse')}}</v-header>

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
     <v-list-tile-content @click="serverMenus = !serverMenus" class="switch-label">
      <v-list-tile-title>{{i18n('Use categories as supplied by server')}}</v-list-tile-title>
      <v-list-tile-sub-title>{{i18n('Obtain enabled categories (Artists, Albums, etc) from the server. This is required in order to use additional browse modes, or to control the selection of browse categories.')}}</v-list-tile-title>
     </v-list-tile-content>
     <v-list-tile-action><v-switch v-model="serverMenus"></v-switch></v-list-tile-action>
    </v-list-tile>
    <v-divider></v-divider>

    <v-list-tile>
     <v-list-tile-content @click="browseBackdrop = !browseBackdrop" class="switch-label">
      <v-list-tile-title>{{i18n('Draw background')}}</v-list-tile-title>
      <v-list-tile-sub-title>{{i18n('Use artist, or album, images as background.')}}</v-list-tile-title>
     </v-list-tile-content>
     <v-list-tile-action><v-switch v-model="browseBackdrop"></v-switch></v-list-tile-action>
    </v-list-tile>

    <div class="dialog-padding"></div>
    <v-header>{{i18n('Now Playing')}}</v-header>

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

    <div class="dialog-padding"></div>
    <v-header>{{i18n('Queue')}}</v-header>

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
            letterOverlay:false,
            showMenuAudio:false,
            sortFavorites:true,
            serverMenus:false,
            autoScrollQueue:true,
            stopButton:false,
            browseBackdrop:true,
            queueBackdrop:true,
            showMenuAudioQueue:false,
            nowPlayingBackdrop:false,
            infoBackdrop:true,
            techInfo:false,
            queueShowTrackNum:false,
            nowPlayingTrackNum:false,
            layout: null,
            layoutItems: [],
            volumeSteps: [ { value: 1,  label: "1%"},
                           { value: 2,  label: "2%"},
                           { value: 5,  label: "5%"},
                           { value: 10, label: "10%"}
                         ],
            volumeStep: 5,
            showPlayerMenuEntry: false,
            lsAndNotif: 'playing',
            lsAndNotifItems: [],
            android: isAndroid(),
            menuIcons: true
        }
    },
    computed: {
        infoPlugin () {
            return this.$store.state.infoPlugin
        }
    },
    mounted() {
        bus.$on('uisettings.open', function(act) {
            this.darkUi = this.$store.state.darkUi;
            this.autoScrollQueue = this.$store.state.autoScrollQueue;
            this.stopButton = this.$store.state.stopButton;
            this.browseBackdrop = this.$store.state.browseBackdrop;
            this.queueBackdrop = this.$store.state.queueBackdrop;
            this.nowPlayingBackdrop = this.$store.state.nowPlayingBackdrop;
            this.infoBackdrop = this.$store.state.infoBackdrop;
            this.techInfo = this.$store.state.techInfo;
            this.queueShowTrackNum = this.$store.state.queueShowTrackNum;
            this.nowPlayingTrackNum = this.$store.state.nowPlayingTrackNum;
            this.lsAndNotif=this.$store.state.lsAndNotif;
            this.letterOverlay=this.$store.state.letterOverlay;
            this.sortFavorites = this.$store.state.sortFavorites;
            this.serverMenus = this.$store.state.serverMenus;
            this.showMenuAudio = this.$store.state.showMenuAudio;
            this.showMenuAudioQueue = this.$store.state.showMenuAudioQueue;
            this.layout = getLocalStorageVal("layout", "auto");
            this.layoutOrig = this.layout;
            this.volumeStep = volumeStep;
            this.showPlayerMenuEntry = this.$store.state.showPlayerMenuEntry;
            this.menuIcons = this.$store.state.menuIcons;
            this.show = true;
        }.bind(this));

        bus.$on('closeDialog', function(name) {
            if (this.show && name=='ui-settings') {
                this.close();
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
            this.lsAndNotifItems=[
                { key:"never",  label:i18n("Never")},
                { key:"always", label:i18n("Always")},
                { key:"playing", label:i18n("When playing")}
                ];
        },
        close() {
            this.show=false;
            this.$store.commit('setUiSettings', { darkUi:this.darkUi,
                                                  autoScrollQueue:this.autoScrollQueue,
                                                  letterOverlay:this.letterOverlay,
                                                  sortFavorites:this.sortFavorites,
                                                  showMenuAudio:this.showMenuAudio,
                                                  serverMenus:this.serverMenus,
                                                  stopButton:this.stopButton,
                                                  browseBackdrop:this.browseBackdrop,
                                                  queueBackdrop:this.queueBackdrop,
                                                  showMenuAudioQueue:this.showMenuAudioQueue,
                                                  nowPlayingBackdrop:this.nowPlayingBackdrop,
                                                  infoBackdrop:this.infoBackdrop,
                                                  techInfo:this.techInfo,
                                                  queueShowTrackNum:this.queueShowTrackNum,
                                                  nowPlayingTrackNum:this.nowPlayingTrackNum,
                                                  volumeStep:this.volumeStep,
                                                  showPlayerMenuEntry:this.showPlayerMenuEntry,
                                                  lsAndNotif:this.lsAndNotif,
                                                  menuIcons:this.menuIcons
                                                } );
            if (this.layout != this.layoutOrig) {
                setLocalStorageVal("layout", this.layout);
                if ( (!this.desktop && "desktop"==this.layout) || (this.desktop && "mobile"==this.layout) ) {
                    window.location.href = this.layout;
                } else {
                    setAutoLayout(this.layout == "auto");
                }
            }
        },
        saveAsDefault() {
            this.$confirm(i18n("Save the current settings as default for new users?")+
                                "<br/><br/><p style=\"font-weight:200\">"+
                                i18n("NOTE: 'Application layout' is not saved, as this is a per-device setting.")+"</p>",
                          {buttonTrueText: i18n('Set Defaults'), buttonFalseText: i18n('Cancel')}).then(res => {
                if (res) {
                    var settings = { darkUi:this.darkUi,
                                     autoScrollQueue:this.autoScrollQueue,
                                     letterOverlay:this.letterOverlay,
                                     sortFavorites:this.sortFavorites,
                                     showMenuAudio:this.showMenuAudio,
                                     serverMenus:this.serverMenus,
                                     stopButton:this.stopButton,
                                     browseBackdrop:this.browseBackdrop,
                                     queueBackdrop:this.queueBackdrop,
                                     showMenuAudioQueue:this.showMenuAudioQueue,
                                     nowPlayingBackdrop:this.nowPlayingBackdrop,
                                     infoBackdrop:this.infoBackdrop,
                                     techInfo:this.techInfo,
                                     queueShowTrackNum:this.queueShowTrackNum,
                                     nowPlayingTrackNum:this.nowPlayingTrackNum,
                                     volumeStep:this.volumeStep,
                                     showPlayerMenuEntry:this.showPlayerMenuEntry,
                                     lsAndNotif:this.lsAndNotif,
                                     menuIcons:this.menuIcons
                                   };
                    lmsCommand("", ["pref", LMS_MATERIAL_UI_DEFAULT_PREF, JSON.stringify(settings)]);
                    lmsCommand("", ["pref", LMS_MATERIAL_DEFAULT_PINNED_PREF, getLocalStorageVal("pinned", "[]")]);
                }
            });
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
            bus.$emit('dialogOpen', 'uisettings', val);
        }
    }
})

