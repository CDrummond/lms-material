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
    var item = items.shift();
    if (undefined!=item) {
        var name = (item.artist ? item.artist + ' - ' : '') +
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

function getTracksForDownload(item) {
    var cmd = ['tracks', 0, 1000, DOWNLOAD_TAGS, 'sort:tracknum', item.id];
    if (item.artist_id) {
        cmd.push('artist_id:'+item.artist_id);
    }
    lmsCommand('', cmd).then(({data})=>{
        if (data && data.result && data.result.titles_loop) {
            var tracks = [];
            for (var i=0, loop=data.result.titles_loop, len=loop.length; i<len; ++i) {
                var item = loop[i];
                var uparts=item.url.split('.');
                splitMultiples(item);
                var tracknum = undefined==item.tracknum ? 0 : parseInt(item.tracknum);
                
                tracks.push({id: item.id,
                    title: item.title,
                    ext: uparts[uparts.length-1],
                    artist: item.albumartist ? item.albumartist : item.artist,
                    album: item.album,
                    tracknum: tracknum>0 ? (tracknum>9 ? tracknum : ('0' + tracknum)) : undefined,
                    disc: item.disc,
                    album_id: item.album_id});
            }
            if (queryParams.download=='browser') {
               downloadViaBrowser(tracks);
            } else if (queryParams.download=='native') {
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

