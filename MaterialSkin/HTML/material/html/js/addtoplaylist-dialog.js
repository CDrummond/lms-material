/**
 * LMS-Material
 *
 * Copyright (c) 2018-2024 Craig Drummond <craig.p.drummond@gmail.com>
 * MIT license.
 */
'use strict';

Vue.component('lms-addtoplaylist-dialog', {
    template: `
<v-dialog v-model="show" v-if="show" persistent width="600">
 <v-card>
  <v-card-title>{{i18n('Add to playlist')}}</v-card-title>
  <v-form>
   <v-list two-line>
    <v-list-tile>
     <v-list-tile-content>
      <v-combobox v-model="name" :items="existing" :label="i18n('Name')" class="lms-search" ref="entry" id="addtoplaylist-name"></v-combobox>
     </v-list-tile-content>
    </v-list-tile>
   </v-list>
  </v-form>
  <v-card-actions v-if="queryParams.altBtnLayout">
   <v-spacer></v-spacer>
   <v-btn flat @click.native="save()">{{i18n('Add')}}</v-btn>
   <v-btn flat @click.native="cancel()">{{i18n('Cancel')}}</v-btn>
  </v-card-actions>
  <v-card-actions v-else>
   <v-spacer></v-spacer>
   <v-btn flat @click.native="cancel()">{{i18n('Cancel')}}</v-btn>
   <v-btn flat @click.native="save()">{{i18n('Add')}}</v-btn>
  </v-card-actions>
 </v-card>
</v-dialog>
`,
    props: [],
    data() {
        return {
            show: false,
            name: "",
            existing: []
        }
    },
    mounted() {
        bus.$on('addtoplaylist.open', function(items, itemCommands, closeSignal) {
            this.show = true;
            this.items = items;
            this.itemCommands = itemCommands;
            this.closeSignal = closeSignal;
            focusEntry(this);
            var currentName = ""+this.name;
            lmsCommand("", ["playlists", 0, 10000, PLAYLIST_TAGS]).then(({data})=>{
                if (data && data.result && data.result.playlists_loop) {
                    var loop = data.result.playlists_loop;
                    var nameValid = false;
                    this.existing = [];
                    for (var i=0, len=loop.length; i<len; ++i) {
                        if (undefined==loop[i].extid && 1!=parseInt(loop[i].remote)) {
                            this.existing.push(loop[i].playlist);
                            if (!nameValid && loop[i].playlist==currentName) {
                                nameValid = true;
                            }
                        }
                    }
                    this.existing.sort();
                    if (!nameValid && this.name==currentName) {
                        this.name="";
                    }
                    if (this.name.length<1 && this.existing.length>0) {
                        this.name = this.existing[0];
                    }
                }
            });
        }.bind(this));
        bus.$on('noPlayers', function() {
            this.close();
        }.bind(this));
        bus.$on('closeDialog', function(dlg) {
            if (dlg == 'addtoplaylist') {
                this.close();
            }
        }.bind(this));
    },
    methods: {
        close() {
            if (undefined!=closeSignal) {
                bus.$emit(closeSignal);
            }
            this.show=false;
        },
        cancel() {
            // For some reason 'this.name' is not updated if the combo has focus when the
            // button is pressed. Work-around this by getting the element's value...
            var elem = document.getElementById('addtoplaylist-name');
            this.name = elem && elem.value ? elem.value.trim() : "";
            this.close();
        },
        save() {
            // For some reason 'this.name' is not updated if the combo has focus when the
            // button is pressed. Work-around this by getting the element's value...
            var elem = document.getElementById('addtoplaylist-name');
            this.name = elem && elem.value ? elem.value.trim() : "";
            if (this.name.length<1) {
                return;
            }
            this.close();

            if (1==this.items.length && this.items[0].id.startsWith("album_id:")) {
                this.saveAlbumToPlaylist(this.name, this.items[0].id);
            } else {
                var tracks = [];
                for (var i=0, len=this.items.length; i<len; ++i) {
                    if (undefined!=this.items[i].url && null!=this.items[i].url && "null"!=this.items[i].url) {
                        tracks.push({url:this.items[i].url});
                    } /*else if (this.items[i].presetParams && this.items[i].presetParams.favorites_url) {
                        tracks.push({url:this.items[i].presetParams.favorites_url, title:this.items[i].title});
                    }*/
                }

                if (tracks.length==0 && this.items[0].params && this.items[0].params.track_id) {
                    this.convertTrackIds(this.name);
                } else {
                    this.saveTracksToPlaylist(this.name, tracks);
                }
            }
        },
        saveAlbumToPlaylist(name, albumId) {
            var cmd = ["tracks", 0, 1000, "tags:u"];
            for (var i=0, loop=this.itemCommands[0].params, len=loop.length; i<len; ++i) {
                if (!loop[i].startsWith("tags:")) {
                    cmd.push(loop[i]);
                }
            }
            lmsCommand("", cmd).then(({data})=>{
                var tracks = [];
                if (data && data.result && data.result.titles_loop) {
                    for (var i=0, loop=data.result.titles_loop, loopLen=loop.length; i<loopLen; ++i) {
                        if (loop[i].url) {
                            tracks.push({url:loop[i].url});
                        }
                    }
                }
                this.saveTracksToPlaylist(name, tracks);
            }).catch(err => {
                bus.$emit('showError', err, i18n("Failed to add to playlist!"));
                logError(err);
            });
        },
        convertTrackIds(name) {
            var trackIds = [];
            for (var i=0, len=this.items.length; i<len; ++i) {
                if (this.items[i].params && this.items[i].params.track_id) {
                    trackIds.push(this.items[i].params.track_id);
                }
            }
            lmsCommand("", ["material-skin", "urls", "tracks:"+trackIds.join(",")]).then(({data})=>{
                var tracks = [];
                if (data && data.result && data.result.urls_loop) {
                    for (var i=0, loop=data.result.urls_loop, loopLen=loop.length; i<loopLen; ++i) {
                        if (loop[i].url) {
                            tracks.push({url:loop[i].url});
                        }
                    }
                }
                this.saveTracksToPlaylist(name, tracks);
            }).catch(err => {
                bus.$emit('showError', err, i18n("Failed to add to playlist!"));
                logError(err);
            });
        },
        saveTracksToPlaylist(name, tracks) {
            if (tracks.length>0) {
                lmsCommand("", ["playlists", "new", "name:"+name]).then(({data})=>{
                    var playlistId = undefined;
                    if (data && data.result) {
                        if (data.result.overwritten_playlist_id) {
                            playlistId = data.result.overwritten_playlist_id;
                        } else if (data.result.playlist_id) {
                            playlistId = data.result.playlist_id;
                        }
                    }
                    if (playlistId!=undefined) {
                        this.savePlaylist(name, playlistId, tracks);
                    } else {
                        bus.$emit('showError', undefined, i18n("Failed to add to playlist!"));
                    }
                }).catch(err => {
                    bus.$emit('showError', err, i18n("Failed to add to playlist!"));
                    logError(err);
                });
            } else {
                bus.$emit('showError', undefined, i18n("Failed to add to playlist!"));
            }
        },
        savePlaylist(name, id, tracks) {
            var track = tracks.shift();
            var cmd = ["playlists", "edit", "playlist_id:"+id, "cmd:add", "url:"+track.url];

            lmsCommand("", cmd).then(({data})=>{
                if (tracks.length>0) {
                    this.savePlaylist(name, id, tracks);
                } else {
                    bus.$emit('showMessage', i18n("Added to '%1'", name));
                    bus.$emit('refreshPlaylist', name);
                }
            }).catch(err => {
                bus.$emit('showError', err, i18n("Failed to add to playlist!"));
                logError(err);
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
            this.$store.commit('dialogOpen', {name:'addtoplaylist', shown:val});
        }
    }
})

