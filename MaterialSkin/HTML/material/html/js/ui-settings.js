/*
 * LMS-Material
 *
 * Copyright (c) 2018 Craig Drummond <craig.p.drummond@gmail.com>
 * MIT license.
 */

Vue.component('lms-ui-settings', {
    template: `
      <v-dialog v-model="show" fullscreen app>
        <v-card>
          <v-toolbar color="primary" dark app class="lms-toolbar">
            <v-btn flat icon @click.native="close"><v-icon>arrow_back</b-icon></v-btn>
            <v-toolbar-title>{{i18n('Settings')}}</v-toolbar-title>
          </v-toolbar>
          <div class="settings-toolbar-pad"></div>
          <v-list two-line subheader class="settings-list">
            <v-header>{{i18n('General')}}</v-header>
            <v-list-tile>
              <v-switch v-model="darkUi" :label="i18n('Use dark theme')"></v-switch>
            </v-list-tile>

            <div class="settings-pad"></div>
            <v-header>{{i18n('Browse')}}</v-header>
            <v-list-tile>
              <v-select :items="albumSorts" :label="i18n('Sort albums under artists by')" v-model="artistAlbumSort" item-text="label" item-value="key"></v-select>
            </v-list-tile>

            <v-list-tile>
              <v-select :items="albumSorts" :label="i18n('Sort album list by')" v-model="albumSort" item-text="label" item-value="key"></v-select>
            </v-list-tile>
            
            <v-list-tile v-if="libraries.length>0">
              <v-select :items="libraries" :label="i18n('Library')" v-model="library" item-text="name" item-value="id"></v-select>
            </v-list-tile>

            <v-list-tile>
              <v-switch v-model="splitArtistsAndAlbums" :label="i18n('Split artist (and album) lists into A..Z')"></v-switch>
            </v-list-tile>

            <v-list-tile>
              <v-switch v-model="showMenuAudio" :label="i18n('Show menu when clicking anywhere on a playable item')"></v-switch>
            </v-list-tile>

            <div class="settings-pad"></div>
            <v-header>{{i18n('Queue')}}</v-header>
            <v-list-tile>
              <v-switch v-model="autoScrollQueue" :label="i18n('Auto-scroll to current track')"></v-switch>
            </v-list-tile>
          </v-list>
        </v-card>
      </v-dialog>
`,
    props: [],
    data() {
        return {
            show: false,
            darkUi: true,
            artistAlbumSort:'yearalbum',
            albumSort:'album',
            splitArtistsAndAlbums: false,
            showMenuAudio:false,
            autoScrollQueue:true,
            albumSorts:[],
            library: null,
            libraries: []
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
                this.showMenuAudio = this.$store.state.showMenuAudio;
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
        },
        close() {
            this.show=false;
            bus.$emit('dialog', 'ui-settings', false);
            this.$store.commit('setUiSettings', { darkUi:this.darkUi,
                                                  artistAlbumSort:this.artistAlbumSort,
                                                  albumSort:this.albumSort,
                                                  autoScrollQueue:this.autoScrollQueue,
                                                  splitArtistsAndAlbums:this.splitArtistsAndAlbums,
                                                  showMenuAudio:this.showMenuAudio
                                                } );
            if (this.libraries.length>0) {
                this.$store.commit('setLibrary', this.library);
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

