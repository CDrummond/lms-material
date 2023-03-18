/**
 * LMS-Material
 *
 * Copyright (c) 2018-2023 Craig Drummond <craig.p.drummond@gmail.com>
 * MIT license.
 */
'use strict';

function showArtist(event, id, title, page) {
    if (lmsNumVisibleMenus>0 || ('queue'==page && lmsQueueSelectionActive)) { // lmsNumVisibleMenus defined in store.js
        return;
    }
    event.stopPropagation();
    bus.$emit("browse", ["albums"], ["artist_id:"+id, ARTIST_ALBUM_TAGS, SORT_KEY+ARTIST_ALBUM_SORT_PLACEHOLDER], unescape(title), page, page!="browse");
    bus.$emit('npclose');
}

function showAlbumArtist(event, id, title, page) {
    if (lmsNumVisibleMenus>0 || ('queue'==page && lmsQueueSelectionActive)) { // lmsNumVisibleMenus defined in store.js
        return;
    }
    event.stopPropagation();
    bus.$emit("browse", ["albums"], ["artist_id:"+id, ARTIST_ALBUM_TAGS, SORT_KEY+ARTIST_ALBUM_SORT_PLACEHOLDER, "role_id:ALBUMARTIST"], unescape(title), page, page!="browse");
    bus.$emit('npclose');
}

function showAlbum(event, album, title, page) {
    if (lmsNumVisibleMenus>0 || ('queue'==page && lmsQueueSelectionActive)) { // lmsNumVisibleMenus defined in store.js
        return;
    }
    event.stopPropagation();
    bus.$emit("browse", ["tracks"], ["album_id:"+album, TRACK_TAGS, SORT_KEY+"tracknum"], unescape(title), page, page!="browse");
    bus.$emit('npclose');
}

function showComposer(event, id, title, page) {
    if (lmsNumVisibleMenus>0 || ('queue'==page && lmsQueueSelectionActive)) { // lmsNumVisibleMenus defined in store.js
        return;
    }
    event.stopPropagation();
    bus.$emit("browse", ["albums"], ["artist_id:"+id, ARTIST_ALBUM_TAGS, SORT_KEY+ARTIST_ALBUM_SORT_PLACEHOLDER, "role_id:COMPOSER"], unescape(title), page, page!="browse");
    bus.$emit('npclose');
}

function showConductor(event, id, title, page) {
    if (lmsNumVisibleMenus>0 || ('queue'==page && lmsQueueSelectionActive)) { // lmsNumVisibleMenus defined in store.js
        return;
    }
    event.stopPropagation();
    bus.$emit("browse", ["albums"], ["artist_id:"+id, ARTIST_ALBUM_TAGS, SORT_KEY+ARTIST_ALBUM_SORT_PLACEHOLDER, "role_id:CONDUCTOR"], unescape(title), page, page!="browse");
    bus.$emit('npclose');
}

function showBand(event, id, title, page) {
    if (lmsNumVisibleMenus>0 || ('queue'==page && lmsQueueSelectionActive)) { // lmsNumVisibleMenus defined in store.js
        return;
    }
    event.stopPropagation();
    bus.$emit("browse", ["albums"], ["artist_id:"+id, ARTIST_ALBUM_TAGS, SORT_KEY+ARTIST_ALBUM_SORT_PLACEHOLDER, "role_id:BAND"], unescape(title), page, page!="browse");
    bus.$emit('npclose');
}

function addArtistLink(item, line, type, func, page, used, plain) {
    if (lmsOptions.showAllArtists && undefined!=item[type+"s"] && item[type+"s"].length>1) {
        let canUse = new Set();
        let canUseVals = [];
        for (let i=0, loop=item[type+"s"], len=loop.length; i<len; ++i) {
            if (!used.has(loop[i])) {
                canUse.add(i);
                canUseVals.push(loop[i]);
                used.add(loop[i]);
            }
        }
        if (canUseVals.length<1) {
            return line;
        }
        if (!IS_MOBILE && !plain && undefined!=item[type+"_ids"] && item[type+"_ids"].length==item[type+"s"].length) {
            let vals = [];
            for (let i=0, loop=item[type+"s"], len=loop.length; i<len; ++i) {
                if (canUse.has(i)) {
                    vals.push("<obj class=\"link-item\" onclick=\""+func+"(event, "+item[type+"_ids"][i]+",\'"+escape(loop[i])+"\', \'"+page+"\')\">" + loop[i] + "</obj>");
                }
            }
            line=addPart(line, vals.join(", "));
        } else {
            line=addPart(line, canUseVals.join(", "));
        }
    } else {
        let val = item[type];
        if (undefined!=val) {
            if (used.has(val)) {
                return line;
            }
            used.add(val);
            let id = IS_MOBILE || plain ? undefined : item[type+"_id"];
            if (undefined==id && !plain && !IS_MOBILE && undefined!=item[type+"_ids"]) {
                id = item[type+"_ids"][0];
            }
            if (undefined!=id) {
                line=addPart(line, "<obj class=\"link-item\" onclick=\""+func+"(event, "+id+",\'"+escape(val)+"\', \'"+page+"\')\">" + val + "</obj>");
            } else {
                line=addPart(line, val);
            }
        }
    }
    return line;
}

function buildArtistLine(i, page, plain, existing) {
    var line = undefined;
    var used = new Set();
    var artist = i.artist ? i.artist : i.trackartist ? i.trackartist : i.albumartist;

    if (undefined!=existing) {
        used.add(existing);
    }
    if (lmsOptions.artistFirst) {
        if (i.artist) {
            line=addArtistLink(i, line, "artist", "showArtist", page, used, plain);
        } else if (i.trackartist) {
            line=addArtistLink(i, line, "trackartist", "showArtist", page, used, plain);
        } else if (i.albumartist) {
            line=addArtistLink(i, line, "albumartist", "showAlbumArtist", page, used, plain);
        }
        used.add(artist);
    }

    if (i.band  && lmsOptions.showBand && useBand(i.genre)) {
        line=addArtistLink(i, line, "band", "showBand", page, used, plain);
    }
    if (i.composer && lmsOptions.showComposer && useComposer(i.genre)) {
        line=addArtistLink(i, line, "composer", "showComposer", page, used, plain);
    }
    if (i.conductor && lmsOptions.showConductor && useConductor(i.genre)) {
        line=addArtistLink(i, line, "conductor", "showConductor", page, used, plain);
    }

    if (!lmsOptions.artistFirst) {
        if (i.artist) {
            line=addArtistLink(i, line, "artist", "showArtist", page, used, plain);
        } else if (i.trackartist) {
            line=addArtistLink(i, line, "trackartist", "showArtist", page, used, plain);
        } else if (i.albumartist) {
            line=addArtistLink(i, line, "albumartist", "showAlbumArtist", page, used, plain);
        }
    }
    try {
        return undefined==line ? line : line.replaceAll('|', '\u2022');
    } catch (e) {
        return undefined==line ? line : line.replace(/\|/g, '\u2022');
    }
}

function buildAlbumLine(i, page, plain) {
    var line = undefined;
    var remoteTitle = checkRemoteTitle(i);
    if (i.album) {
        var album = i.album;
        if (i.year && i.year>0) {
            album+=" (" + i.year + ")";
        }
        if (i.album_id && !IS_MOBILE && !plain) {
            album="<obj class=\"link-item\" onclick=\"showAlbum(event, "+i.album_id+",\'"+escape(album)+"\', \'"+page+"\')\">" + album + "</obj>";
        }
        line=addPart(line, album);
    } else if (remoteTitle && remoteTitle!=i.title) {
        line=addPart(line, remoteTitle);
    }
    try {
        return undefined==line ? line : line.replaceAll('|', '\u2022');
    } catch (e) {
        return undefined==line ? line : line.replace(/\|/g, '\u2022');
    }
}

