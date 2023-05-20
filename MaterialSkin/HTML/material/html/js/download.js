/**
 * LMS-Material
 *
 * Copyright (c) 2018-2023 Craig Drummond <craig.p.drummond@gmail.com>
 * MIT license.
 */
'use strict';

const DOWNLOAD_TAGS = 'tags:aACeiltuyK';

var downloadElem = undefined;

function downloadViaBrowser(items) {
    let item = items.shift();
    if (undefined!=item) {
        let name = (item.artist ? item.artist + ' - ' : '') +
                   (item.album ? item.album + ' - ' : '') +
                   (undefined==item.filename || item.filename.length<1
                     ? ( (item.disc && item.disc>0 ? item.disc+'.' : '') +
                         (item.tracknum ? item.tracknum+' ' : '') +
                          item.title +
                         (item.ext ? '.'+item.ext : ''))
                     : item.filename);

        downloadElem = document.createElement('a');
        downloadElem.download = name;
        downloadElem.href = '/material/download/' + item.id;
        downloadElem.style.display = 'none';
        document.body.append(downloadElem);
        downloadElem.click();

        setTimeout(function() {
            downloadElem.remove();
            if (items.length>0) {
                downloadViaBrowser(items);
            }
        }, 100);
    }
}

function downloadNative(tracks) {
    try {
        NativeReceiver.download(JSON.stringify(tracks));
    } catch (e) {
    }
}

function cancelDownloadNative(ids) {
    try {
        NativeReceiver.cancelDownload(JSON.stringify(ids));
    } catch (e) {
    }
}

function isCueTrack(filename) {
    let parts = filename.split('#');
    if (parts.length<2) {
        return false;
    }
    let positions = parts[parts.length-1].split('-');
    if (positions.length!=2) {
        return false;
    }
    if ( (isNaN(positions[0]) && isNaN(parseFloat(positions[0]))) || (isNaN(positions[1]) && isNaN(parseFloat(positions[1]))) ) {
        return false;
    }
    return true;
}

function download(item, command, albumartist) {
    let lkey = item.id.startsWith("playlist_id:") ? "playlisttracks_loop" : "titles_loop";
    let cmd = ['tracks', 0, 1000, DOWNLOAD_TAGS, 'sort:tracknum', originalId(item.id)];
    // Only include artist_id if we have no list command, or the list command has artist_id
    // -> otherwise downloading a 'Various Artists' album from 'New Music' fails.
    if (item.artist_id && (undefined==command || getField(command, 'artist_id')>=0)) {
        cmd.push('artist_id:'+item.artist_id);
    }
    if (item.id.startsWith("playlist_id:")) {
        cmd.unshift("playlists");
    }
    lmsCommand('', cmd).then(({data})=>{
        if (data && data.result && data.result[lkey]) {
            let tracks = [];
            for (let i=0, loop=data.result[lkey], len=loop.length; i<len; ++i) {
                let item = loop[i];
                if (/^file:\/\//.test(item.url)) {
                    let filename=decodeURIComponent(item.url.substring(item.url.lastIndexOf('/')+1));
                    if (!isCueTrack(filename)) {
                        let uparts=item.url.split('.');
                        let ext=uparts[uparts.length-1];
                        splitMultiples(item);
                        let tracknum = undefined==item.tracknum ? 0 : parseInt(item.tracknum);
                        let aa = undefined!=item.albumartist
                                    ? item.albumartist
                                    : undefined!=albumartist
                                        ? albumartist
                                        : undefined!=item.compilation && 1==parseInt(item.compilation)
                                            ? lmsOptions.variousArtistsString
                                            : item.artist;
                        tracks.push({id: item.id,
                            title: item.title,
                            filename: filename,
                            ext: ext,
                            artist: aa,
                            album: item.album,
                            tracknum: tracknum>0 ? (tracknum>9 ? tracknum : ('0' + tracknum)) : undefined,
                            disc: item.disc,
                            album_id: item.album_id});
                    }
                }
            }
            if (tracks.length==0) {
                if (item.id.startsWith("track_id:")) {
                    bus.$emit('showError', undefined, i18n("Track is not downloadable."));
                } else {
                    bus.$emit('showError', undefined, i18n("No downloadable tracks."));
                }
            } else if (tracks.length>1) {
                confirm(i18n('Download %1 tracks?', tracks.length), i18n('Download')).then(res => {
                    if (1==res) {
                        if (queryParams.download=='native') {
                            downloadNative(tracks);
                        } else {
                           downloadViaBrowser(tracks);
                        }
                    }
                });
            } else {
                if (queryParams.download=='native') {
                    downloadNative(tracks);
                } else {
                   downloadViaBrowser(tracks);
                }
            }
        }
    }).catch(err => {
        bus.$emit('showError', err, i18n('Failed to add to playlist!'));
        logError(err);
    });
}

function downloadStatus(str) {
    try {
        let status = JSON.parse(str);
        if (Array.isArray(status)) {
            bus.$store.commit('setDownloadStatus', status);
        }
    } catch(e) { }
}

Vue.component('lms-downloadstatus', {
    template: `
<v-dialog v-model="show" v-if="show" persistent no-click-animation scrollable fullscreen>
 <v-card>
  <v-card-title class="settings-title">
   <v-toolbar app-data class="dialog-toolbar">
    <v-btn flat icon v-longpress:stop="close" :title="ttShortcutStr(i18n('Go back'), 'esc')"><v-icon>arrow_back</v-icon></v-btn>
    <v-toolbar-title>{{i18n('Downloading')}}</v-toolbar-title>
    <v-spacer></v-spacer>
    <v-btn icon v-if="undefined!=items && items.length>1" flat @click.native="abortAll()" :title="i18n('Abort all')"><img class="svg-img" :src="'close-all' | svgIcon(darkUi, coloredToolbars)"></img></v-btn>
   </v-toolbar>
  </v-card-title>
  <v-card-text style="padding-top:0px">
   <v-container grid-list-md style="padding:0px">
    <v-layout wrap>
     <v-flex xs12 v-if="undefined!=items && items.length>0">
      <v-list class="lms-list" style="padding-top:0px;position:unset;top:unset;height:100%!important;width:100%!important">
       <div class="dialog-padding"></div>
       <template v-for="(item, index) in items">
        <v-list-tile class="lms-list-item" v-bind:class="{'pq-current': item.downloading}">
         <v-list-tile-content>
          <v-list-tile-title>{{item.title}}</v-list-tile-title>
          <v-list-tile-sub-title class="ellipsis">{{item.subtitle}}</v-list-tile-sub-title>
         </v-list-tile-content>
         <v-list-tile-action @click.stop="abort(item)">
          <v-btn icon flat><v-icon>cancel</v-icon></v-btn>
         </v-list-tile-action>
        </v-list-tile>
       </template>
      </v-list>
     </v-flex>
     <v-flex xs12 v-else>
      <div style="padding-top:64px;width:100%;display:flex;justify-content:center;align-items:center;">{{i18n('All downloads complete.')}}</div>
     </v-flex>
     <div class="dialog-padding"></div>
    </v-layout>
   </v-container>
  </v-card-text>
 </v-card>
</v-dialog>
`,
    props: [],
    data() {
        return {
            show: false
        }
    },
    mounted() {
        bus.$on('downloadstatus.open', function() {
            this.show = true;
        }.bind(this));
        bus.$on('esc', function() {
            if (this.$store.state.activeDialog == 'downloadstatus') {
                this.close();
            }
        }.bind(this));
    },
    methods: {
        close() {
            this.show=false;
        },
        abort(track) {
            if (this.$store.state.downloadStatus.length==1) {
                this.close();
            }
            cancelDownloadNative([track.id]);
        },
        abortAll() {
            confirm(i18n('Abort all downloads?'), i18n('Abort'), i18n('No')).then(res => {
                if (1==res) {
                    let ids = [];
                    for (let i=0, loop=this.$store.state.downloadStatus, len=loop.length; i<len; ++i) {
                        ids.push(loop[i].id);
                    }
                    cancelDownloadNative(ids);
                    this.close();
                }
            });
        },
        i18n(str, arg) {
            if (this.show) {
                return i18n(str, arg);
            } else {
                return str;
            }
        }
    },
    computed: {
        items () {
            return this.$store.state.downloadStatus
        },
        darkUi () {
            return this.$store.state.darkUi
        },
        coloredToolbars() {
            return this.$store.state.coloredToolbars
        }
    },
    filters: {
        svgIcon: function (name, dark, coloredToolbars) {
            return "/material/svg/"+name+"?c="+(dark || coloredToolbars ? LMS_DARK_SVG : LMS_LIGHT_SVG)+"&r="+LMS_MATERIAL_REVISION;
        }
    },
    watch: {
        'show': function(val) {
            this.$store.commit('dialogOpen', {name:'downloadstatus', shown:val});
        }
    }
})
