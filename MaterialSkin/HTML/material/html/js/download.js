/**
 * LMS-Material
 *
 * Copyright (c) 2018-2021 Craig Drummond <craig.p.drummond@gmail.com>
 * MIT license.
 */
'use strict';

const DOWNLOAD_TAGS = 'tags:aAeiltuyK';

var downloadElem = undefined;

function downloadViaBrowser(items) {
    let item = items.shift();
    if (undefined!=item) {
        let name = (item.artist ? item.artist + ' - ' : '') +
                   (item.album ? item.album + ' - ' : '') +
                   (item.disc && item.disc>0 ? item.disc+'.' : '') + 
                   (item.tracknum ? item.tracknum+' ' : '') +
                   item.title +
                   (item.ext ? '.'+item.ext : '');

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

function getTracksForDownload(item) {
    let cmd = ['tracks', 0, 1000, DOWNLOAD_TAGS, 'sort:tracknum', item.id];
    if (item.artist_id) {
        cmd.push('artist_id:'+item.artist_id);
    }
    lmsCommand('', cmd).then(({data})=>{
        if (data && data.result && data.result.titles_loop) {
            let tracks = [];
            for (let i=0, loop=data.result.titles_loop, len=loop.length; i<len; ++i) {
                let item = loop[i];
                if (/^file:\/\//.test(item.url)) {
                    let uparts=item.url.split('.');
                    splitMultiples(item);
                    let tracknum = undefined==item.tracknum ? 0 : parseInt(item.tracknum);
                    tracks.push({id: item.id,
                        title: item.title,
                        filename: decodeURIComponent(item.url.substring(item.url.lastIndexOf('/')+1)),
                        ext: uparts[uparts.length-1],
                        artist: item.albumartist ? item.albumartist : item.artist,
                        album: item.album,
                        tracknum: tracknum>0 ? (tracknum>9 ? tracknum : ('0' + tracknum)) : undefined,
                        disc: item.disc,
                        album_id: item.album_id});
                }
            }
            if (tracks.length>1) {
                confirm(i18n('Download %1 tracks?', tracks.length), i18n('Download')).then(res => {
                    if (1==res) {
                        if (queryParams.download=='browser') {
                           downloadViaBrowser(tracks);
                        } else if (queryParams.download=='native') {
                            downloadNative(tracks);
                        }
                    }
                });
            } else {
                if (queryParams.download=='browser') {
                   downloadViaBrowser(tracks);
                } else if (queryParams.download=='native') {
                    downloadNative(tracks);
                }
            }
        }
    }).catch(err => {
        bus.$emit('showError', err, i18n('Failed to add to playlist!'));
        logError(err);
    });
}

function download(item) {
    if (queryParams.download=='browser' || queryParams.download=='native') {
        getTracksForDownload(item);
    } else {
        bus.$emit('showError', undefined, i18n('Unknown download method'));
    }
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
<v-dialog v-model="show" v-if="show" persistent scrollable width="600" class="lms-dialog">
 <v-card>
 <v-card-title>{{i18n('Downloading')}}</v-card-title>
  <v-card-text style="padding-top:0px">
   <v-container grid-list-md style="padding:0px">
    <v-layout wrap>
     <v-flex xs12>
      <v-list class="lms-list" style="padding-top:0px;position:unset;top:unset;height:100%!important;width:100%!important">
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
    </v-layout>
   </v-container>
  </v-card-text>
  <v-card-actions>
   <v-btn v-if="items.length>1" flat @click.native="abortAll()">{{i18n('Abort all')}}</v-btn>
   <v-spacer></v-spacer>
   <v-btn flat @click.native="close()">{{i18n('Close')}}</v-btn>
  </v-card-actions>
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
                this.cancel();
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
        }
    },
    watch: {
        'show': function(val) {
            this.$store.commit('dialogOpen', {name:'downloadstatus', shown:val});
        },
        '$store.state.downloadStatus' : function() {
            if (this.$store.state.downloadStatus.length<1) {
                this.close();
            }
        }
    }
})
