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
            <v-toolbar-title>Settings</v-toolbar-title>
          </v-toolbar>
          <div class="settings-toolbar-pad"></div>
          <v-list three-line subheader class="settings-list">
            <v-header>General</v-header>
            <v-list-tile>
              <v-switch v-model="darkUi" label="Use dark theme"></v-switch>
            </v-list-tile>

            <v-header>Browse</v-header>
            <v-list-tile>
              <v-select :items="albumSorts" label="Sort albums under artists by" v-model="artistAlbumSort" item-text="label" item-value="key"></v-select>
            </v-list-tile>

            <v-list-tile>
              <v-select :items="albumSorts" label="Sort album list by" v-model="albumSort" item-text="label" item-value="key"></v-select>
            </v-list-tile>
            
            <v-header>Queue</v-header>
            <v-list-tile>
              <v-switch v-model="autoScrollQueue" label="Auto-scroll to current track"></v-switch>
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
            autoScrollQueue:true,
            albumSorts:[
                { key:"album",           label:"Album"},
                { key:"artistalbum",     label:"Artist, Album"},
                { key:"artflow",         label:"Artist, Year, Album"},
                { key:"yearalbum",       label:"Year, Album"},
                { key:"yearartistalbum", label:"Year, Artist, Album"}
                ]
        }
    },
    mounted() {
        bus.$on('toolbarAction', function(act) {
            if (act==TB_UI_SETTINGS.id) {
                this.darkUi = this.$store.state.darkUi;
                this.artistAlbumSort = this.$store.state.artistAlbumSort;
                this.albumSort = this.$store.state.albumSort;
                this.autoScrollQueue = this.$store.state.autoScrollQueue;
                this.show = true;
            }
        }.bind(this));
    },
    methods: {
        close() {
            this.show=false;
            this.$store.commit('setUiSettings', { darkUi:this.darkUi,
                                                  artistAlbumSort:this.artistAlbumSort,
                                                  albumSort:this.albumSort,
                                                  autoScrollQueue:this.autoScrollQueue,
                                                } );
        }
    }
})

