/**
 * LMS-Material
 *
 * Copyright (c) 2018-2024 Craig Drummond <craig.p.drummond@gmail.com>
 * MIT license.
 */
'use strict';

function browseItem(event, cmd, params, title, page) {
    if (lmsNumVisibleMenus>0 || ('queue'==page && lmsQueueSelectionActive)) { // lmsNumVisibleMenus defined in store.js
        return;
    }
    event.stopPropagation();
    bus.$emit("browse", cmd, params, unescape(title), page, page!="browse");
    bus.$emit('linkClicked');
}

function show_artist(event, id, title, page) {
    browseItem(event, ["albums"], ["artist_id:"+id, ARTIST_ALBUM_TAGS, SORT_KEY+ARTIST_ALBUM_SORT_PLACEHOLDER], unescape(title), page);
}

function showAlbum(event, album, title, page) {
    browseItem(event, ["tracks"], ["album_id:"+album, trackTags(true), SORT_KEY+"tracknum"], unescape(title), page);
}

function showArtistRole(event, id, title, page, role) {
    browseItem(event, ["albums"], ["artist_id:"+id, ARTIST_ALBUM_TAGS, SORT_KEY+ARTIST_ALBUM_SORT_PLACEHOLDER, "role_id:"+role], unescape(title), page);
}

function show_albumartist(event, id, title, page) {
    showArtistRole(event, id, title, page, "ALBUMARTIST");
}

function show_composer(event, id, title, page) {
    showArtistRole(event, id, title, page, "COMPOSER");
}

function show_conductor(event, id, title, page) {
    showArtistRole(event, id, title, page, "CONDUCTOR");
}

function show_band(event, id, title, page) {
    showArtistRole(event, id, title, page, "BAND");
}

function show_genre(event, id, title, page) {
    // Just 'id' here no 'genre_id:' prefix!
    browseItem(event, ["genre"], id, unescape(title), page);
}

function show_year(event, val, title, page) {
    browseItem(event, ["year"], val, title, page);
}

function show_userrole(event, id, title, page, role) {
    showArtistRole(event, id, title, page, role);
}

function buildLink(func, id, str, page, extra) {
    return "<obj class=\"link-item\" onclick=\""+func+"(event, "+id+",\'"+escape(str)+"\', \'"+page+"\'"+
           (undefined==extra ? "" : ","+extra)+")\">" + str + "</obj>";
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
        if ((!IS_MOBILE || lmsOptions.touchLinks) && !plain && undefined!=item[type+"_ids"] && item[type+"_ids"].length==item[type+"s"].length) {
            let vals = [];
            for (let i=0, loop=item[type+"s"], len=loop.length; i<len; ++i) {
                if (canUse.has(i)) {
                    vals.push(buildLink(func, item[type+"_ids"][i], loop[i], page));
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
            let id = (IS_MOBILE && !lmsOptions.touchLinks) || plain ? undefined : item[type+"_id"];
            if (undefined==id && !plain && (!IS_MOBILE || lmsOptions.touchLinks) && undefined!=item[type+"_ids"]) {
                id = item[type+"_ids"][0];
            }
            if (undefined!=id) {
                line=addPart(line, buildLink(func, id, val, page));
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
    var artist = i.trackartist ? i.trackartist : i.artist ? i.artist : i.albumartist;

    if (undefined!=existing) {
        used.add(existing);
    }
    if (lmsOptions.artistFirst) {
        if (i.trackartist) {
            line=addArtistLink(i, line, "trackartist", "show_artist", page, used, plain);
        } else if (i.artist) {
            line=addArtistLink(i, line, "artist", "show_artist", page, used, plain);
        } else if (i.albumartist) {
            line=addArtistLink(i, line, "albumartist", "show_albumartist", page, used, plain);
        }
        used.add(artist);
    }

    if (i.band && lmsOptions.showBand && useBand(i.genre)) {
        line=addArtistLink(i, line, "band", "show_band", page, used, plain);
    }
    if (i.composer && lmsOptions.showComposer && useComposer(i.genre)) {
        line=addArtistLink(i, line, "composer", "show_composer", page, used, plain);
    }
    if (i.conductor && lmsOptions.showConductor && useConductor(i.genre)) {
        line=addArtistLink(i, line, "conductor", "show_conductor", page, used, plain);
    }

    if (!lmsOptions.artistFirst) {
        if (i.trackartist) {
            line=addArtistLink(i, line, "trackartist", "show_artist", page, used, plain);
        } else if (i.artist) {
            line=addArtistLink(i, line, "artist", "show_artist", page, used, plain);
        } else if (i.albumartist) {
            line=addArtistLink(i, line, "albumartist", "show_albumartist", page, used, plain);
        }
    }
    try {
        return undefined==line ? line : line.replaceAll('|', '\u2022');
    } catch (e) {
        return undefined==line ? line : line.replace(/\|/g, '\u2022');
    }
}

function buildArtistWithContext(i, page, useBand, useComposer, useConductor) {
    let composers = undefined;
    if (useComposer) {
        composers=addArtistLink(i, composers, "composer", "show_composer", page, new Set(), false);
    }
    let conductors = undefined;
    if (useConductor) {
        conductors=addArtistLink(i, conductors, "conductor", "show_conductor", page, new Set(), false);
    }

    let artists = undefined;
    let used = new Set();
    if (i.trackartist) {
        artists=addArtistLink(i, artists, "trackartist", "show_artist", page, used, false);
    } else if (i.artist) {
        artists=addArtistLink(i, artists, "artist", "show_artist", page, used, false);
    } else if (i.albumartist) {
        artists=addArtistLink(i, artists, "albumartist", "show_albumartist", page, used, false);
    }

    if (undefined==composers && undefined==conductors && undefined==artists) {
        return undefined;
    }

    if (useBand) {
        artists=addArtistLink(i, artists, "band", "show_band", page, used, false);
        if (artists) {
            artists=artists.replace(SEPARATOR, ", ");
        }
    }

    let details = "";
    let haveComp = undefined!=composers;
    let haveCond = undefined!=conductors;
    if (!haveComp && !haveCond) {
        if (undefined!=artists) {
            details += i18n('<obj>by</obj> %1', artists);
        }
    } else {
        let artistFirst = lmsOptions.artistFirst && undefined!=artists;
        let artistLast = !lmsOptions.artistFirst && undefined!=artists

        if (artistFirst) {
            details += i18n('<obj>performed by</obj> %1', artists) + "<br/>";
        }
        if (haveComp) {
            details += i18n('<obj>composed by</obj> %1', composers) + (haveCond || artistLast ? "<br/>" : "");
        }
        if (haveCond) {
            details += i18n('<obj>conducted by</obj> %1', conductors) + (artistLast ? "<br/>" : "");
        }
        if (artistLast) {
            details += i18n('<obj>performed by</obj> %1', artists);
        }
    }
    return details.length>0 ? details.replaceAll("<obj>", "<obj class=\"ext-details\">") : undefined;
}

function buildAlbumLine(i, page, plain) {
    var line = undefined;
    var remoteTitle = checkRemoteTitle(i);
    if (i.album) {
        var album = i.album;
        if (i.year && i.year>0) {
            album+=" (" + i.year + ")";
        }
        if (i.album_id && (!IS_MOBILE || lmsOptions.touchLinks) && !plain) {
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

