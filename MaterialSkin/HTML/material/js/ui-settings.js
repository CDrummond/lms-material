
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
              <v-select :items="albumSorts" label="Sort albums under artists by" v-model="artistAlbumSort" item-text="label" item-value="key"></v-select>
            </v-list-tile>

            <v-list-tile avatar>
              <v-select :items="albumSorts" label="Sort album list by" v-model="albumSort" item-text="label" item-value="key"></v-select>
            </v-list-tile>
            
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

