
Vue.component('lms-ui-settings', {
    template: `
      <v-dialog v-model="show" fullscreen transition="dialog-bottom-transition" app>
        <v-card>
          <v-toolbar color="primary" dark app class="lms-toolbar">
            <v-toolbar-title>Settings</v-toolbar-title>
            <v-spacer></v-spacer>
            <v-btn flat icon @click.native="close"><v-icon>close</b-icon></v-btn>
          </v-toolbar>
          <div class="lms-toolbar"></div>
          <v-list three-line subheader>
            <v-subheader>General</v-subheader>
            <v-list-tile avatar>
              <v-list-tile-action><v-checkbox v-model="darkUi"></v-checkbox></v-list-tile-action>
              <v-list-tile-content>
                <v-list-tile-title>Dark theme</v-list-tile-title>
                <v-list-tile-sub-title>Use dark background with white text</v-list-tile-sub-title>
              </v-list-tile-content>
            </v-list-tile>

            <v-subheader>Browse</v-subheader>
            <v-list-tile avatar>
              <v-list-tile-title>Sort albums under artists by:</v-list-tile-title>
            </v-list-tile>

            <div class="settings-radio-group">
              <v-radio-group v-model="artistAlbumSort">
                <v-radio label="Album" value="album"></v-radio>
                <v-radio label="Artist, Album" value="artistalbum"></v-radio>
                <v-radio label="Artist, Year, Album" value="artflow"></v-radio>
                <v-radio label="Year, Album" value="yearalbum"></v-radio>
                <v-radio label="Year, Artist, Album" value="yearartistalbum"></v-radio>
              </v-radio-group>
            </div>

            <v-list-tile avatar>
              <v-list-tile-title>Sort albums under artists by:</v-list-tile-title>
            </v-list-tile>

            <div class="settings-radio-group">
              <v-radio-group v-model="albumSort">
                <v-radio label="Album" value="album"></v-radio>
                <v-radio label="Artist, Album" value="artistalbum"></v-radio>
                <v-radio label="Artist, Year, Album" value="artflow"></v-radio>
                <v-radio label="Year, Album" value="yearalbum"></v-radio>
                <v-radio label="Year, Artist, Album" value="yearartistalbum"></v-radio>
              </v-radio-group>
            </div>
            
            <v-subheader>Queue</v-subheader>
            <v-list-tile avatar>
              <v-list-tile-action><v-checkbox v-model="autoScrollQueue"></v-checkbox></v-list-tile-action>
              <v-list-tile-content>
                <v-list-tile-title>Auto-scroll</v-list-tile-title>
                <v-list-tile-sub-title>Scroll queue when current track changes</v-list-tile-sub-title>
              </v-list-tile-content>
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

