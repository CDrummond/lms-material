/**
 * LMS-Material
 *
 * Copyright (c) 2018 Craig Drummond <craig.p.drummond@gmail.com>
 * MIT license.
 */

Vue.component('lms-ui-settings', {
    template: `
<v-dialog v-model="show" scrollable fullscreen>
 <v-card>
  <v-card-title class="settings-title">
   <v-toolbar color="primary" dark app class="lms-toolbar">
    <v-btn flat icon @click.native="close"><v-icon>arrow_back</b-icon></v-btn>
    <v-toolbar-title>{{i18n('Settings')}}</v-toolbar-title>
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
   
    <v-list-tile>
     <v-select :items="layoutItems" :label="i18n('Application layout')" v-model="layout" item-text="label" item-value="key"></v-select>
    </v-list-tile>

    <div class="settings-pad"></div>
    <v-header>{{i18n('Browse')}}</v-header>
    <v-list-tile>
     <v-select :items="albumSorts" :label="i18n('Sort albums under artists by')" v-model="artistAlbumSort" item-text="label" item-value="key"></v-select>
    </v-list-tile>
    <v-divider></v-divider>
 
    <v-list-tile>
     <v-select :items="albumSorts" :label="i18n('Sort album list by')" v-model="albumSort" item-text="label" item-value="key"></v-select>
    </v-list-tile>
    <v-divider></v-divider>
            
    <v-list-tile v-if="libraries.length>0">
     <v-select :items="libraries" :label="i18n('Library')" v-model="library" item-text="name" item-value="id"></v-select>
    </v-list-tile>
    <v-divider v-if="libraries.length>0"></v-divider>

    <v-list-tile>
     <v-list-tile-content @click="splitArtistsAndAlbums = !splitArtistsAndAlbums" class="switch-label">
      <v-list-tile-title>{{i18n('Split artist (and album) lists into A..Z')}}</v-list-tile-title>
      <v-list-tile-sub-title>{{i18n('Useful when browsing a large list of artists, or albums.')}}</v-list-tile-title>
     </v-list-tile-content>
     <v-list-tile-action><v-switch v-model="splitArtistsAndAlbums"></v-switch></v-list-tile-action>
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

    <div class="settings-pad"></div>
    <v-header>{{i18n('Queue')}}</v-header>
   
    <v-list-tile>
     <v-list-tile-content @click="autoScrollQueue = !autoScrollQueue" class="switch-label">
      <v-list-tile-title>{{i18n('Auto-scroll to current track')}}</v-list-tile-title>
      <v-list-tile-sub-title>{{i18n('Scroll play queue when current track changes.')}}</v-list-tile-title>
     </v-list-tile-content>
     <v-list-tile-action><v-switch v-model="autoScrollQueue"></v-switch></v-list-tile-action>
    </v-list-tile>
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
            artistAlbumSort:'yearalbum',
            albumSort:'album',
            splitArtistsAndAlbums: false,
            showMenuAudio:false,
            sortFavorites:false,
            serverMenus:false,
            autoScrollQueue:true,
            albumSorts:[],
            library: null,
            libraries: [],
            layout: null,
            layoutItems: []
        }
    },
    mounted() {
        bus.$on('toolbarAction', function(act) {
            if (act==TB_UI_SETTINGS.id) {
                bus.$emit('dialog', 'ui-settings', true);
                this.darkUi = this.$store.state.darkUi;
                this.artistAlbumSort = this.$store.state.artistAlbumSort;
                this.albumSort = this.$store.state.albumSort;
                this.autoScrollQueue = this.$store.state.autoScrollQueue;
                this.splitArtistsAndAlbums = this.$store.state.splitArtistsAndAlbums;
                this.sortFavorites = this.$store.state.sortFavorites;
                this.serverMenus = this.$store.state.serverMenus;
                this.showMenuAudio = this.$store.state.showMenuAudio;
                this.layout = getLocalStorageVal("layout", "auto");
                this.layoutOrig = this.layout;
                this.show = true;

                lmsList("", ["libraries"]).then(({data}) => {
                    if (data && data.result && data.result.folder_loop && data.result.folder_loop.length>0) {
                        data.result.folder_loop.forEach(i => {
                            this.libraries.push(i);
                        });
                        this.libraries.sort(function(a, b) {
                                                                var nameA = a.name.toUpperCase();
                                                                var nameB = b.name.toUpperCase();
                                                                if (nameA < nameB) {
                                                                    return -1;
                                                                }
                                                                if (nameA > nameB) {
                                                                    return 1;
                                                                }
                                                                return 0;
                                                            });
                        this.libraries.unshift({name: i18n("Default"), id:LMS_DEFAULT_LIBRARY});
                        this.library = this.$store.state.library;
                        if (!this.library) {
                            this.library=this.libraries[0].id;
                        }
                    }
                });
            }
        }.bind(this));

        bus.$on('closeDialog', function() {
            if (this.show) {
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
            this.albumSorts=[
                { key:"album",           label:i18n("Album")},
                { key:"artistalbum",     label:i18n("Artist, Album")},
                { key:"artflow",         label:i18n("Artist, Year, Album")},
                { key:"yearalbum",       label:i18n("Year, Album")},
                { key:"yearartistalbum", label:i18n("Year, Artist, Album")}
                ];
            this.layoutItems=[
                { key:"auto",    label:i18n("Automatic")},
                { key:"desktop", label:i18n("Use desktop layout")},
                { key:"mobile",  label:i18n("Use mobile layout")}
                ];
        },
        close() {
            this.show=false;
            bus.$emit('dialog', 'ui-settings', false);
            this.$store.commit('setUiSettings', { darkUi:this.darkUi,
                                                  artistAlbumSort:this.artistAlbumSort,
                                                  albumSort:this.albumSort,
                                                  autoScrollQueue:this.autoScrollQueue,
                                                  splitArtistsAndAlbums:this.splitArtistsAndAlbums,
                                                  sortFavorites:this.sortFavorites,
                                                  showMenuAudio:this.showMenuAudio,
                                                  serverMenus:this.serverMenus
                                                } );
            if (this.libraries.length>0) {
                this.$store.commit('setLibrary', this.library);
            }
            if (this.layout != this.layoutOrig) {
                setLocalStorageVal("layout", this.layout);
                if ( (!this.desktop && "desktop"==this.layout) || (this.desktop && "mobile"==this.layout)) {
                    this.$confirm(i18n("You have changed the application layout setting. Do you wish to re-load the page, so that this can take effect?"), {buttonTrueText: i18n('Reload'), buttonFalseText: i18n('Stay As Is')}).then(res => {
                        if (res) {
                            window.location.href = this.layout;
                        }
                    });
                }
            }
        },
        i18n(str) {
            if (this.show) {
                return i18n(str);
            } else {
                return str;
            }
        }
    }
})

