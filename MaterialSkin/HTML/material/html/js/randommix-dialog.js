/**
 * LMS-Material
 *
 * Copyright (c) 2018-2019 Craig Drummond <craig.p.drummond@gmail.com>
 * MIT license.
 */

Vue.component('lms-randommix', {
    template: `
<v-dialog scrollable v-model="show" persistent width="600">
 <v-card>
  <v-card-text>
   <v-select :items="mixes" :label="i18n('Mix Type')" v-model="chosenMix" item-text="label" item-value="key"></v-select>
   <v-select chips deletable-chips multiple :items="genres" :label="i18n('Selected Genres')" v-model="chosenGenres">
    <v-list-tile slot="prepend-item" @click="toggleGenres()">
     <v-list-tile-action><v-icon>{{selectAllIcon}}</v-icon></v-list-tile-action>
     <v-list-tile-title>{{i18n('Select All')}}</v-list-tile-title>
    </v-list-tile>
    <v-divider slot="prepend-item"></v-divider>
   </v-select>
  </v-card-text>
  <v-card-actions>
   <v-spacer></v-spacer>
   <v-btn flat @click.native="close()">{{i18n('Close')}}</v-btn>
   <v-btn flat @click.native="stop()" v-if="active">{{i18n('Stop')}}</v-btn>
   <v-btn flat @click.native="start()">{{i18n('Start')}}</v-btn>
  </v-card-actions>
 </v-card>
</v-dialog>
`,
    props: [],
    data() {
        return {
            show: false,
            genres: [],
            chosenGenres: [],
            mixes: [],
            chosenMix: "tracks",
            active: false
        }
    },
    computed: {
        selectAllIcon () {
            if (this.chosenGenres.length==this.genres.length) {
                return "check_box";
            }
            if (this.chosenGenres.length>0) {
                return "indeterminate_check_box";
            }
            return "check_box_outline_blank";
        }
    },
    mounted() {
        bus.$on('rndmix.open', function() {
            this.playerId = this.$store.state.player.id;
            lmsCommand(this.playerId, ["randomplayisactive"]).then(({data}) => {
                if (data && data.result && data.result._randomplayisactive) {
                    this.chosenMix = data.result._randomplayisactive;
                    this.active = true;
                } else {
                    this.active = false;
                    this.choseMix = "tracks";
                }
                this.mixes=[{key:"tracks", label:i18n("Song Mix")},
                            {key:"albums", label:i18n("Album Mix")},
                            {key:"contributors", label:i18n("Artist Mix")},
                            {key:"year", label:i18n("Year Mix")}];
                this.chosenGenres = [];
                this.genres = [];
                lmsList(this.playerId, ["randomplaygenrelist"], undefined, 0, 500).then(({data}) => {
                    if (data && data.result && data.result.item_loop) {
                        data.result.item_loop.forEach(i => {
                            if (undefined!==i.checkbox) {
                                this.genres.push(i.text);
                                if (i.checkbox==1) {
                                    this.chosenGenres.push(i.text);
                                }
                            }
                        });
                        this.show=true;
                    }
                });
            });
        }.bind(this));
        bus.$on('noPlayers', function() {
            this.show=false;
        }.bind(this));
    },
    methods: {
        close() {
            this.show=false;
        },
        start() {
            this.close();
            if (this.chosenGenres.length==0) {
                lmsCommand(this.playerId, ["randomplaygenreselectall", "0"]).then(({data}) => {
                    lmsCommand(this.playerId, ["randomplay", this.chosenMix]);
                });
            } else if (this.chosenGenres.length==this.genres.length) {
                lmsCommand(this.playerId, ["randomplaygenreselectall", "1"]).then(({data}) => {
                    lmsCommand(this.playerId, ["randomplay", this.chosenMix]);
                });
            } else {
                lmsCommand(this.playerId, ["randomplaygenreselectall", "0"]).then(({data}) => {
                   this.addGenre();
                });
            }
        },
        stop() {
            this.close();
            lmsCommand(this.playerId, ["randomplay", "disable"]);
        },
        addGenre() {
            if (0==this.chosenGenres.length) {
                lmsCommand(this.playerId, ["randomplay", this.chosenMix]);
            } else {
                lmsCommand(this.playerId, ["randomplaychoosegenre", this.chosenGenres.shift(), "1"]).then(({data}) => {
                    this.addGenre();
                });
            }
        },
        toggleGenres() {
            if (this.chosenGenres.length==this.genres.length) {
                this.chosenGenres = [];
            } else {
                this.chosenGenres = this.genres.slice();
            }
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
            bus.$emit('dialogOpen', 'rndmix', val);
        }
    }
})

