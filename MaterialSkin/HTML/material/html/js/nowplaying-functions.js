/**
 * LMS-Material
 *
 * Copyright (c) 2018-2026 Craig Drummond <craig.p.drummond@gmail.com>
 * MIT license.
 */
const NP_MAX_ALBUMS = 50;
const NP_MAX_TRACKS = 50;

function  nowPlayingHeader(s) {
    return isEmpty(s) ? "" : ("<b>"+s+"</b><br/>");
}

function nowPlayingMAIScroll(ev, tab, id) {
    if (id.startsWith("mai-t-")) {
        setElemScrollTop(document.getElementById("np-tab"+tab), 0);
    } else if (id.startsWith("mai-b-")) {
        setElemScrollTop(document.getElementById("np-tab"+tab), -1);
    } else {
        let elem = document.getElementById(id);
        if (undefined!=elem) {
            let parent = document.getElementById("np-tab"+tab);
            let header = document.getElementById("mai-header-"+tab);
            let adjust = 0;
            if (undefined!=header) {
                adjust = header.getBoundingClientRect().height;
            }
            ensureVisible(elem, parent, (-1*adjust)-4);
        }
    }
    ev.preventDefault();
    ev.stopPropagation();
}

function formatLyrics(s) {
    let lines = s.split("<br/>")
    if (lines.length>0) {
        let timed = [];
        let prevSeconds = 0;
        for (let i=0, len=lines.length; i<len; ++i) {
            let line = lines[i];
            if (!line.startsWith("[")) {
                if (line.trim().length>0) {
                    return {data:s, timed:false};
                }
                // Skip blank lines?
                continue;
            }
            let end = line.indexOf(']');
            if (end<2) {
                return {data:s, timed:false};
            }
            let time=line.substring(1, end).split(':');
            if (time[0] < '0' || time[0] > '9') {
                // Skip meta-data
                continue;
            }
            let rest=line.substring(end+1).trim();
            let mod = 1;
            let seconds = 0;
            for (let t=time.length-1; t>=0; t--) {
                seconds+=mod*parseInt(time[t]);
                mod*=60;
            }
            if (seconds<0 || seconds<prevSeconds) {
                return {data:s, timed:false};
            }
            timed.push({time:seconds, text:rest});
            prevSeconds = seconds;
        }
        if (timed.length>0) {
            return {data:timed, timed:true};
        }
    }
    return {data:s, timed:false};
}

function nowplayingSetWindowTitle(view) {
    var title = (undefined==view.mobileBarText ? "" : (view.mobileBarText.replaceAll(SEPARATOR, " - ") + " - ")) + LMS_WINDOW_TITLE;
    if (title!=document.title) {
        document.title = title;
    }
}

function nowplayingOnPlayerStatus(view, playerStatus) {
    let playStateChanged = false;
    let trackChanged = false;

    // Have other items changed
    if (playerStatus.isplaying!=view.playerStatus.isplaying) {
        view.playerStatus.isplaying = playerStatus.isplaying;
        playStateChanged = true;
    }
    view.playerStatus.iswaiting = playerStatus.iswaiting;
    if (playerStatus.current.canseek!=view.playerStatus.current.canseek) {
        view.playerStatus.current.canseek = playerStatus.current.canseek;
    }
    if (playerStatus.current.duration!=view.playerStatus.current.duration) {
        view.playerStatus.current.duration = playerStatus.current.duration;
    }
    if (playerStatus.current.url!=view.playerStatus.current.url) {
        view.playerStatus.current.url = playerStatus.current.url;
    }
    if (playerStatus.current.time!=view.playerStatus.current.time || playStateChanged) {
        view.playerStatus.current.time = playerStatus.current.time;
        view.playerStatus.current.updated = new Date();
        view.playerStatus.current.origTime = playerStatus.current.time;
        currentPlayingTrackPosition = playerStatus.current.time;
    }
    let liveEdgeChanged=false;
    if (playerStatus.current.live_edge!=view.playerStatus.current.liveEdge) {
        liveEdgeChanged = undefined==playerStatus.current.live_edge || undefined==view.playerStatus.current.liveEdge;
        view.playerStatus.current.liveEdge = playerStatus.current.live_edge;
    }
    view.setPosition();
    if (playerStatus.current.id!=view.playerStatus.current.id) {
        view.playerStatus.current.id = playerStatus.current.id;
    }
    if (playerStatus.current.title!=view.playerStatus.current.title) {
        view.playerStatus.current.title = trackTitle(playerStatus.current);
        trackChanged = true;
    }
    if (playerStatus.current.tracknum!=view.playerStatus.current.tracknum) {
        view.playerStatus.current.tracknum = playerStatus.current.tracknum;
        trackChanged = true;
    }
    let disc = playerStatus.current.disccount>1 ? playerStatus.current.disc : 0;
    if (disc!=view.playerStatus.current.disc || playerStatus.current.disccount!=view.playerStatus.current.disccount) {
        view.playerStatus.current.disc = disc;
        view.playerStatus.current.disccount = playerStatus.current.disccount;
        trackChanged = true;
    }
    if (playerStatus.will_sleep_in!=view.playerStatus.sleepTimer) {
        view.playerStatus.sleepTimer = playerStatus.will_sleep_in;
    }
    if (playerStatus.dvc!=view.playerStatus.dvc) {
        view.playerStatus.dvc = playerStatus.dvc;
    }
    let artist = playerStatus.current.artist ? playerStatus.current.artist : playerStatus.current.trackartist;
    let artists = playerStatus.current.artists && playerStatus.current.trackartists
        ? [...new Set([...playerStatus.current.artists, ...playerStatus.current.trackartists])]
        : playerStatus.current.artists ? playerStatus.current.artists : playerStatus.current.trackartists;
    let artist_id = playerStatus.current.artist_id ? playerStatus.current.artist_id : playerStatus.current.trackartist_id;
    let artist_ids = playerStatus.current.artist_ids && playerStatus.current.trackartist_ids
        ? [...new Set([...playerStatus.current.artist_ids, ...playerStatus.current.trackartist_ids])]
        : playerStatus.current.artist_ids ? playerStatus.current.artist_ids : playerStatus.current.trackartist_ids;
    if (view.playerStatus.current.artist!=artist ||
        view.playerStatus.current.artists!=artists ||
        view.playerStatus.current.artist_id!=artist_id ||
        view.playerStatus.current.artist_ids!=artist_ids) {
        view.playerStatus.current.artist = artist;
        view.playerStatus.current.artists = artists;
        view.playerStatus.current.artist_id = artist_id;
        view.playerStatus.current.artist_ids = artist_ids;
        trackChanged = true;
    }
    let albumartist = playerStatus.current.albumartist ? playerStatus.current.albumartist : playerStatus.current.band;
    let albumartist_ids = playerStatus.current.albumartist_ids ? playerStatus.current.albumartist_ids : playerStatus.current.band_ids;
    let albumartists = playerStatus.current.albumartists ? playerStatus.current.albumartists : playerStatus.current.bands;
    if (albumartist!=view.playerStatus.current.albumartist ||
        albumartists!=view.playerStatus.current.albumartists ||
        albumartist_ids!=view.playerStatus.current.albumartist_ids) {
        view.playerStatus.current.albumartist = albumartist;
        view.playerStatus.current.albumartists = albumartists;
        view.playerStatus.current.albumartist_ids = albumartist_ids;
        trackChanged = true;
    }
    if (playerStatus.current.album!=view.playerStatus.current.albumName ||
        playerStatus.current.year!=view.playerStatus.current.year ||
        playerStatus.current.album_id!=view.playerStatus.current.album_id ||
        playerStatus.current.remote_title!=view.playerStatus.current.remote_title ||
        playerStatus.current.discsubtitle!=view.playerStatus.current.discsubtitle ||
        playerStatus.current.grouping!=view.playerStatus.current.grouping) {
        view.playerStatus.current.albumName = playerStatus.current.album;
        view.playerStatus.current.album_id = playerStatus.current.album_id;
        view.playerStatus.current.year = playerStatus.current.year;
        view.playerStatus.current.remote_title = playerStatus.current.remote_title;
        view.playerStatus.current.discsubtitle = playerStatus.current.discsubtitle;
        view.playerStatus.current.grouping = playerStatus.current.grouping;
        if (playerStatus.current.year && playerStatus.current.year>0) {
            view.playerStatus.current.album = view.playerStatus.current.albumName+" ("+ playerStatus.current.year+")";
        } else {
            view.playerStatus.current.album = view.playerStatus.current.albumName;
        }
        if (undefined!=playerStatus.current.grouping) {
            view.playerStatus.current.album+=SEPARATOR + playerStatus.current.grouping;
        } else if (undefined!=playerStatus.current.discsubtitle) {
            view.playerStatus.current.album+=SEPARATOR + playerStatus.current.discsubtitle;
        }
        view.playerStatus.current.albumLine = buildAlbumLine(playerStatus.current, 'now-playing', false, true);
        trackChanged = true;
    }
    let rating = undefined==playerStatus.current.rating ? 0 : playerStatus.current.rating;
    if (rating!=view.rating.setting) {
        view.rating.setting = rating;
        view.rating.value = Math.ceil(rating/10.0)/2.0;
        trackChanged = true;
    }
    let source = getTrackSource(playerStatus.current);
    if (source!=view.playerStatus.current.source) {
        view.playerStatus.current.source = source;
    }
    let emblem = getEmblem(playerStatus.current.extid ? playerStatus.current.extid : source ? source.extid : undefined);
    if (emblem!=view.playerStatus.current.emblem) {
        view.playerStatus.current.emblem = emblem;
    }
    view.playerStatus.current.isClassical = playerStatus.current.isClassical;
    let useComposerTag = playerStatus.current.composer && lmsOptions.showComposer && useComposer(playerStatus.current);
    let useConductorTag = playerStatus.current.conductor && lmsOptions.showConductor && useConductor(playerStatus.current);
    let useBandTag = playerStatus.current.band && lmsOptions.showBand && useBand(playerStatus.current);
    let mobileBarText = addPart(playerStatus.current.title, buildArtistLine(playerStatus.current, 'np', true, undefined, useBandTag, useComposerTag, useConductorTag));
    if (mobileBarText!=view.mobileBarText) {
        view.mobileBarText = mobileBarText;
        bus.$emit("nowPlayingBrief", mobileBarText);
    }
    let artistAndComposer = buildArtistLine(playerStatus.current, 'now-playing', undefined, undefined, useBandTag, useComposerTag, useConductorTag);
    let keys = ['band', 'conductor', 'composer'].concat(USER_ARTIST_TYPES);
    let mods = ['', 's', '_ids'];

    for (let i=0, len=keys.length; i<len; ++i) {
        let idk = keys[i]+"_id";
        for (let j=0, jl=mods.length; j<jl; ++j) {
            let key = keys[i]+mods[j];
            let val = playerStatus.current[key];
            if (val!=view.playerStatus.current[key]) {
                view.playerStatus.current[key] = val;
            }
        }
        let id = playerStatus.current[idk]
                    ? playerStatus.current[idk]
                    : playerStatus.current[idk+"s"]
                        ? playerStatus.current[idk+"s"][0]
                        : undefined;
        if (id!=view.playerStatus.current[idk]) {
            view.playerStatus.current[idk] = id;
        }
    }

    if (playerStatus.current.genre!=view.playerStatus.current.genre) {
        view.playerStatus.current.genre = playerStatus.current.genre;
    }
    if (playerStatus.current.genre_id!=view.playerStatus.current.genre_id) {
        view.playerStatus.current.genre_id = playerStatus.current.genre_id;
    }
    if (playerStatus.current.genres!=view.playerStatus.current.genres) {
        view.playerStatus.current.genres = playerStatus.current.genres;
    }
    if (playerStatus.current.genre_ids!=view.playerStatus.current.genre_ids) {
        view.playerStatus.current.genre_ids = playerStatus.current.genre_ids;
    }
    if (artistAndComposer!=view.playerStatus.current.artistAndComposer) {
        view.playerStatus.current.artistAndComposer = artistAndComposer;
        view.playerStatus.current.artistAndComposerWithContext = undefined==source || undefined==source.context || !source.context
            ? undefined
            : buildArtistWithContext(playerStatus.current, 'now-playing', useBandTag, useComposerTag, useConductorTag);
        let width = 0;
        if (undefined!=view.playerStatus.current.artistAndComposerWithContext) {
            let elem = document.getElementById("stringLenCheckElem");
            if (undefined!=elem) {
                elem.innerHTML = replaceBr(view.artistAndComposerLine, ", ")+", " + view.allbumWithContext;
                width = elem.getBoundingClientRect().width;
            }
        }
        view.barInfoWithContextWidth = width;
    }
    if (playerStatus.playlist.shuffle!=view.playerStatus.playlist.shuffle) {
        view.playerStatus.playlist.shuffle = playerStatus.playlist.shuffle;
    }
    if (playerStatus.playlist.repeat!=view.playerStatus.playlist.repeat) {
        view.playerStatus.playlist.repeat = playerStatus.playlist.repeat;
    }
    if (playerStatus.playlist.randomplay!=view.playerStatus.playlist.randomplay) {
        view.playerStatus.playlist.randomplay = playerStatus.playlist.randomplay;
    }
    if (playerStatus.playlist.current!=view.playerStatus.playlist.current) {
        view.playerStatus.playlist.current = playerStatus.playlist.current;
    }
    if (playerStatus.playlist.count!=view.playerStatus.playlist.count) {
        view.playerStatus.playlist.count = playerStatus.playlist.count;
    }
    if (playerStatus.current.comment!=view.playerStatus.current.comment) {
        view.playerStatus.current.comment = playerStatus.current.comment;
    }

    let technical = formatTechInfo(playerStatus.current, source, true);
    if (technical!=view.playerStatus.current.technicalInfo) {
        view.playerStatus.current.technicalInfo = technical;
    }

    let maiComposer = lmsOptions.maiComposer && view.playerStatus.current.composer && undefined!=view.playerStatus.current.composer_id && useComposerTag;
    if (maiComposer!=view.playerStatus.current.maiComposer) {
        view.playerStatus.current.maiComposer = maiComposer;
    }
    if (playerStatus.current.work!=view.playerStatus.current.work) {
        view.playerStatus.current.work = playerStatus.current.work;
    }
    if (playerStatus.current.work_id!=view.playerStatus.current.work_id) {
        view.playerStatus.current.work_id = playerStatus.current.work_id;
    }
    if (playerStatus.current.isClassical!=view.playerStatus.current.isClassical) {
        view.playerStatus.current.isClassical = playerStatus.current.isClassical;
    }
    if (playerStatus.current.performance!=view.playerStatus.current.performance) {
        view.playerStatus.current.performance = playerStatus.current.performance;
    }
    if (trackChanged && view.info.sync) {
        view.setInfoTrack();
        view.showInfo();
        if (!IS_MOBILE && (queryParams.setTitle || queryParams.dontTrapBack)) {
            nowplayingSetWindowTitle(view);
        }
    }

    if (playStateChanged) {
        if (view.playerStatus.isplaying) {
            view.startPositionInterval();
            view.stopLiveEdgeInterval();
        } else {
            view.stopPositionInterval();
            view.startLiveEdgeInterval();
        }
    } else {
        if (view.playerStatus.isplaying && trackChanged) {
            view.startPositionInterval();
        } else if (liveEdgeChanged) {
            view.startLiveEdgeInterval();
        }
    }
    // 'volume' is NOT reactive, as only want to update when overlay is shown!
    view.volume = playerStatus.volume<0 ? -1*playerStatus.volume : playerStatus.volume;

    // Service specific buttons? e.g. Pandora...
    let btns = playerStatus.current.buttons;
    let sb = btns ? btns.shuffle : undefined;
    let rb = btns ? btns.repeat : undefined;
    if (sb && sb.command) {
        view.shuffAltBtn={show:true, command:sb.command, tooltip:sb.tooltip, image:sb.icon,
                          icon:sb.jiveStyle == "thumbsDown" ? "thumb_down" : sb.jiveStyle == "thumbsUp" ? "thumb_up" : sb.jiveStyle == "love" ? "favorite" : undefined};
    } else if (view.shuffAltBtn.show) {
        view.shuffAltBtn.show=false;
    }
    if (rb && rb.command) {
        view.repAltBtn={show:true, command:rb.command, tooltip:rb.tooltip, image:rb.icon,
                        icon:rb.jiveStyle == "thumbsDown" ? "thumb_down" : rb.jiveStyle == "thumbsUp" ? "thumb_up" : rb.jiveStyle == "love" ? "favorite" : undefined};
    } else if (view.repAltBtn.show) {
        view.repAltBtn.show=false;
    }
    view.disableBtns=0==view.playerStatus.playlist.count;
    view.disablePrev=(btns && undefined!=btns.rew && 0==parseInt(btns.rew)) || view.disableBtns || queryParams.party;
    view.disableNext=(btns && undefined!=btns.fwd && 0==parseInt(btns.fwd)) || view.disableBtns || queryParams.party;
    if (queryParams.npAutoClose && 0==view.playerStatus.playlist.count && !view.info.show) {
        if (view.$store.state.desktopLayout && view.largeView) {
            view.largeView = false;
        } else if (!view.$store.state.desktopLayout && view.mobileBar==MBAR_REP_NAV && 'now-playing'==view.$store.state.page) {
            view.$store.commit('setPage', view.$store.state.prevPage);
        }
    }
}

function nowplayingShowMenu(view, event) {
    event.preventDefault();
    view.clearClickTimeout();
    if (view.info.show || (view.playerStatus.playlist.count>0 && window.innerHeight>=LMS_MIN_NP_LARGE_INFO_HEIGHT)) {
        view.touch = undefined;
        view.menu.show = false;
        if (view.$store.state.desktopLayout && view.info.show) {
            let val = parseInt(getComputedStyle(document.documentElement).getPropertyValue("--bottom-toolbar-height").replace("px", ""));
            ontoolbar=event.clientY>(window.innerHeight-val);
        }

        view.menu.items=[];
        view.menu.icons=true;
        let artist_id = view.playerStatus.current.artist_ids
                    ? view.playerStatus.current.artist_ids[0]
                    : view.playerStatus.current.artist_id;
        if (artist_id && view.playerStatus.current.artist && view.playerStatus.current.artist!="?") {
            view.menu.items.push({title:ACTIONS[GOTO_ARTIST_ACTION].title, act:NP_BROWSE_CMD, cmd:{command:["albums"], params:[ARTIST_ALBUM_TAGS, SORT_KEY+ARTIST_ALBUM_SORT_PLACEHOLDER], title:view.playerStatus.current.artist}, svg:ACTIONS[GOTO_ARTIST_ACTION].svg,
                                  ids: view.playerStatus.current.artist_ids ? view.playerStatus.current.artist_ids : [artist_id],
                                  artists:view.playerStatus.current.artists});
        } else {
            let albumartist_id = view.playerStatus.current.albumartist_ids
                        ? view.playerStatus.current.albumartist_ids[0]
                        : view.playerStatus.current.albumartist_id;
            if (albumartist_id && view.playerStatus.current.albumartist && view.playerStatus.current.albumartist!="?") {
                view.menu.items.push({title:ACTIONS[GOTO_ARTIST_ACTION].title, act:NP_BROWSE_CMD, cmd:{command:["albums"], params:[ARTIST_ALBUM_TAGS, SORT_KEY+ARTIST_ALBUM_SORT_PLACEHOLDER, "role_id:ALBUMARTIST"], title:view.playerStatus.current.albumartist}, svg:ACTIONS[GOTO_ARTIST_ACTION].svg,
                                      ids: view.playerStatus.current.albumartist_ids ? view.playerStatus.current.albumartist_ids : [albumartist_id],
                                      artists:view.playerStatus.current.albumartists});
            }
        }
        if (lmsOptions.showBand && view.playerStatus.current.band && view.playerStatus.current.band_id && useBand(view.playerStatus.current)) {
            view.menu.items.push({title:i18n("Go to band"), act:NP_BROWSE_CMD, cmd:{command:["albums"], params:[ARTIST_ALBUM_TAGS, SORT_KEY+ARTIST_ALBUM_SORT_PLACEHOLDER, "role_id:BAND"], title:view.playerStatus.current.band}, svg:"trumpet",
            ids: view.playerStatus.current.band_ids ? view.playerStatus.current.band_ids : [view.playerStatus.current.band_id],
            artists:view.playerStatus.current.bands});
        }
        if (lmsOptions.showConductor && view.playerStatus.current.conductor && view.playerStatus.current.conductor_id && useConductor(view.playerStatus.current)) {
            view.menu.items.push({title:i18n("Go to conductor"), act:NP_BROWSE_CMD, cmd:{command:["albums"], params:[ARTIST_ALBUM_TAGS, SORT_KEY+ARTIST_ALBUM_SORT_PLACEHOLDER, "role_id:CONDUCTOR"], title:view.playerStatus.current.conductor}, svg:"conductor",
            ids: view.playerStatus.current.conductor_ids ? view.playerStatus.current.conductor_ids : [view.playerStatus.current.conductor_id],
            artists:view.playerStatus.current.conductors});
        }
        if (lmsOptions.showComposer && view.playerStatus.current.composer && view.playerStatus.current.composer_id && useComposer(view.playerStatus.current)) {
            view.menu.items.push({title:i18n("Go to composer"), act:NP_BROWSE_CMD, cmd:{command:["albums"], params:[ARTIST_ALBUM_TAGS, SORT_KEY+ARTIST_ALBUM_SORT_PLACEHOLDER, "role_id:COMPOSER"], title:view.playerStatus.current.composer}, svg:"composer",
            ids: view.playerStatus.current.composer_ids ? view.playerStatus.current.composer_ids : [view.playerStatus.current.composer_id],
            artists:view.playerStatus.current.composers});
        }
        if (view.playerStatus.current.album_id && view.playerStatus.current.album) {
            view.menu.items.push({title:ACTIONS[GOTO_ALBUM_ACTION].title, act:NP_BROWSE_CMD, cmd:{command:["tracks"], params:["album_id:"+view.playerStatus.current.album_id, trackTags(true), SORT_KEY+"tracknum"], title:view.playerStatus.current.album,
                                  subtitle:view.playerStatus.current.albumartist ? view.playerStatus.current.albumartist : view.playerStatus.current.artist}, icon:ACTIONS[GOTO_ALBUM_ACTION].icon, svg:ACTIONS[GOTO_ALBUM_ACTION].svg});
        }
        view.playerStatus.current.favIcon = undefined;
        view.playerStatus.current.favUrl = undefined;
        let act = isInFavorites(view.playerStatus.current) ? REMOVE_FROM_FAV_ACTION : ADD_TO_FAV_ACTION;
        if (undefined!=view.playerStatus.current.favUrl && undefined!=view.playerStatus.current.favIcon) {
            view.menu.items.push({title:ACTIONS[act].title, act:NP_ITEM_ACT+act, svg:ACTIONS[act].svg});
        }
        if (undefined!=view.playerStatus.current.title) {
            view.menu.items.push({title:ACTIONS[COPY_DETAILS_ACTION].title, act:NP_COPY_DETAILS_CMD, icon:ACTIONS[COPY_DETAILS_ACTION].icon});
        }
        view.menu.items.push({title:ACTIONS[SHOW_IMAGE_ACTION].title, svg:ACTIONS[SHOW_IMAGE_ACTION].svg, act:NP_PIC_ACT});
        if (view.customActions && view.customActions.length>0) {
            for (let i=0, loop=view.customActions, len=loop.length; i<len; ++i) {
                view.menu.items.push({title:loop[i].title, act:NP_CUSTOM+i, icon:loop[i].icon, svg:loop[i].svg});
            }
        }
        view.menu.items.push({title:ACTIONS[MORE_ACTION].title, svg:ACTIONS[MORE_ACTION].svg, act:NP_INFO_ACT});
        view.menu.x = event.clientX;
        view.menu.y = event.clientY;
        view.$nextTick(() => {
            view.menu.show = true;
        });
    }
}

function nowplayingMenuAction(view, item) {
    if (NP_PIC_ACT==item.act) {
        view.showPic();
    } else if (NP_INFO_ACT==item.act) {
        view.trackInfo();
    } else if (NP_BROWSE_CMD==item.act) {
        if (undefined!=item.ids) {
            if (1==item.ids.length || undefined==item.artists || item.artists.length!=item.ids.length) {
                item.cmd.params.unshift("artist_id:"+item.ids[0]);
            } else {
                let choices = [];
                for (let i=0, loop=item.artists, len=loop.length; i<len; ++i) {
                    choices.push({id:item.ids[i], title:loop[i]});
                }
                choose(item.title, choices).then(choice => {
                    if (undefined!=choice) {
                        item.cmd.params.unshift("artist_id:"+choice.id);
                        bus.$emit("browse", item.cmd.command, item.cmd.params, choice.title, 'now-playing', undefined, item.cmd.subtitle);
                        view.close();
                    }
                });
                return;
            }
        }
        bus.$emit("browse", item.cmd.command, item.cmd.params, item.cmd.title, 'now-playing', undefined, item.cmd.subtitle);
        view.close();
    } else if (NP_COPY_DETAILS_CMD==item.act) {
        let text = undefined;
        if (undefined!=view.playerStatus.current.title && undefined!=view.playerStatus.current.artist && undefined!=view.playerStatus.current.album) {
            text=i18n("Playing %1 by %2 from %3", view.playerStatus.current.title, view.playerStatus.current.artist, view.playerStatus.current.album);
        } else if (undefined!=view.playerStatus.current.title && undefined!=view.playerStatus.current.artist) {
            text=i18n("Playing %1 by %2", view.playerStatus.current.title, view.playerStatus.current.artist);
        } else {
            text=i18n("Playing %1", view.playerStatus.current.title);
        }
        if (undefined!=text) {
            text = "♪ " + text;
            if (view.$store.state.techInfo && undefined!=view.playerStatus.current.technicalInfo && 0!=view.playerStatus.current.technicalInfo.length) {
                text += " ("+(undefined==view.playerStatus.current.source || view.playerStatus.current.source.local
                                ? "" : (view.playerStatus.current.source.text+SEPARATOR))+
                        view.playerStatus.current.technicalInfo+")";
                if (undefined!=view.playerStatus.current.source && undefined!=view.playerStatus.current.source.url) {
                    text += "\n" + view.playerStatus.current.source.url;
                }
            }
            copyTextToClipboard(text);
        }
    } else if (FOLLOW_LINK_ACTION==item.act) {
        openWindow(item.link);
    } else if (SEARCH_TEXT_ACTION==item.act) {
        bus.$emit('browse-search', item.text, NP_INFO);
        view.close();
    }  else if (NP_SHOW_IN_TABS_ACT==item.act) {
        view.info.showTabs = !view.info.showTabs;
    } else if (NP_SYNC_ACT==item.act) {
        view.info.sync = !view.info.sync;
    } else if (NP_LYRICS_SCROLL_ACT==item.act) {
        view.info.tabs[TRACK_TAB].scroll = !view.info.tabs[TRACK_TAB].scroll;
        setLocalStorageVal("npScrollLyrics", view.info.tabs[TRACK_TAB].scroll);
        view.updateLyricsPosition();
    } else if (NP_LYRICS_HIGHLIGHT_ACT==item.act) {
        view.info.tabs[TRACK_TAB].highlight = !view.info.tabs[TRACK_TAB].highlight;
        setLocalStorageVal("npHighlightLyrics", view.info.tabs[TRACK_TAB].highlight);
    } else if (NP_ZOOM_ACT==item.act) {
        if (!item.checked) {
            view.setZoom(item.value);
        }
    } else if (item.act>=NP_ITEM_ACT) {
        let act = item.act - NP_ITEM_ACT;
        if (ADD_TO_FAV_ACTION==act || REMOVE_FROM_FAV_ACTION==act) {
            let add = ADD_TO_FAV_ACTION==act;
            let litem = view.playerStatus.current;
            lmsCommand(view.$store.state.player.id, ["favorites", "exists", litem.favUrl]).then(({data})=> {
                logJsonMessage("RESP", data);
                if (data && data.result && data.result.exists==(add ? 0 : 1)) {
                    if (!add) {
                        confirm(i18n("Remove '%1' from favorites?", litem.title), i18n('Remove')).then(res => {
                            lmsCommand(view.$store.state.player.id, ["material-skin", "delete-favorite", "url:"+litem.favUrl]).then(({data})=> {
                                logJsonMessage("RESP", data);
                                bus.$emit('refreshFavorites');
                            }).catch(err => {
                            });
                        });
                    } else {
                        lmsCommand(view.$store.state.player.id, ["favorites", "add", "url:"+litem.favUrl, "title:"+litem.title, "icon:"+litem.favIcon]).then(({data})=> {
                            logJsonMessage("RESP", data);
                            bus.$emit('showMessage', i18n("Added to favorites"));
                            bus.$emit('refreshFavorites');
                        }).catch(err => {
                        });
                    }
                }
            });
        } else if (undefined!=view.menu.tab && undefined!=view.menu.index && undefined!=view.info.tabs[view.menu.tab].sections[0].items &&
            view.info.tabs[view.menu.tab].sections[0].items.length>=0 && view.menu.index<view.info.tabs[view.menu.tab].sections[0].items.length) {
            let litem = view.info.tabs[view.menu.tab].sections[0].items[view.menu.index];
            if (MORE_LIB_ACTION==act) {
                bus.$emit("browse", ["tracks"], [litem.id, trackTags(true), SORT_KEY+"tracknum"], unescape(litem.title), view.currentView(), undefined, unescape(litem.subtitle ? litem.subtitle : litem.origsubtitle));
                view.close();
            } else if (MORE_ACTION==act) {
                bus.$emit('trackInfo', litem, undefined, view.currentView());
                view.close();
            } else {
                let command = ["playlistcontrol", "cmd:"+(act==PLAY_ACTION ? "load" : INSERT_ACTION==act ? "insert" : ACTIONS[act].cmd), litem.id];
                lmsCommand(view.$store.state.player.id, command).then(({data}) => {
                    logJsonMessage("RESP", data);
                    bus.$emit('refreshStatus');
                    if (act===ADD_ACTION) {
                        bus.$emit('showMessage', i18n("Appended '%1' to the play queue", litem.title));
                    } else if (act===INSERT_ACTION) {
                        bus.$emit('showMessage', i18n("Inserted '%1' into the play queue", litem.title));
                    }
                }).catch(err => {
                    logAndShowError(err, undefined, command);
                });
            }
        }
    } else if (view.customActions && item.act>=NP_CUSTOM) {
        let ca = item.act-NP_CUSTOM;
        if (ca>=0 && ca<view.customActions.length) {
            let cmd = performCustomAction(view.customActions[ca], view.$store.state.player, view.playerStatus.current);
            if (cmd!=undefined) {
                bus.$emit('browse', cmd.command, cmd.params, item.title, 'now-playing');
                bus.$emit('npclose');
            }
        }
    }
}

function nowplayingMenuStdAction(view, item) {
    if (COPY_ACTION==item) {
        copyTextToClipboard(view.menu.selection);
    } else if (SEARCH_TEXT_ACTION==item) {
        bus.$emit('browse-search', unescape(view.menu.selection), NP_INFO);
        bus.$emit('npclose');
    }
}

function nowplayingArtistEntry(trk, key, role) {
    if (undefined!=trk[key+'s'] && undefined!=trk[key+'_ids'] && trk[key+'s'].length==trk[key+'_ids'].length) {
        let html="";
        for (let i=0, len=trk[key+'s'].length; i<len; ++i) {
            if (html.length>1) {
                html+=", ";
            }
            html+="<obj class=\"link-item\" onclick=\"nowplayingBrowse('"+role+"', "+trk[key+'_ids'][i]+", \'"+escape(trk[key+'s'][i])+"\')\">"+trk[key+'s'][i]+"</obj>";
        }
        return html;
    } else if (undefined!=trk[key]) {
        if (undefined!=trk[key+'_id']) {
            return "<obj class=\"link-item\" onclick=\"nowplayingBrowse('"+role+"', "+trk[key+'_id']+", \'"+escape(trk[key])+"\')\">"+trk[key]+"</obj>";
        }
        if (key!="artist" && trk[key]!=trk["artist"]) {
            return trk[key];
        }
    }
    return "";
}

function nowplayingFetchTrackInfo(view) {
    if (view.info.tabs[TRACK_TAB].artist!=view.infoTrack.artist || view.info.tabs[TRACK_TAB].tracktitle!=view.infoTrack.title ||
        view.info.tabs[TRACK_TAB].track_id!=view.infoTrack.track_id || view.info.tabs[TRACK_TAB].artist_id!=view.infoTrack.artist_id ||
        view.info.tabs[TRACK_TAB].url!=view.infoTrack.url) {
        view.info.tabs[TRACK_TAB].texttitle=nowPlayingHeader(view.infoTrack.title);
        view.info.tabs[TRACK_TAB].text=i18n("Fetching...");
        view.info.tabs[TRACK_TAB].lines=undefined;
        view.info.tabs[TRACK_TAB].track_id=view.infoTrack.track_id;
        view.info.tabs[TRACK_TAB].artist=view.infoTrack.artist;
        view.info.tabs[TRACK_TAB].artist_id=view.infoTrack.artist_id;
        view.info.tabs[TRACK_TAB].url=view.infoTrack.url;
        view.info.tabs[TRACK_TAB].tracktitle=view.infoTrack.title;
        view.info.tabs[TRACK_TAB].reqId++;
        view.info.tabs[TRACK_TAB].pos=0;
        if (view.info.tabs[TRACK_TAB].reqId>65535) {
            view.info.tabs[TRACK_TAB].reqId = 0;
        }
        let command = ["musicartistinfo", "lyrics", "html:1", "timestamps:1"];
        if (view.infoTrack.track_id!=undefined && !(""+view.infoTrack.track_id).startsWith("-")) {
            command.push("track_id:"+view.infoTrack.track_id);
        } else {
            if (view.infoTrack.url!=undefined) {
                command.push("url:"+view.infoTrack.url);
            }
            if (view.infoTrack.title!=undefined) {
                command.push("title:"+revertHtmlBrackets(view.infoTrack.title));
            }
            if (view.infoTrack.artist!=undefined) {
                command.push("artist:"+revertHtmlBrackets(view.infoTrack.artist));
            }
        }
        if (3==command.length) { // No details?
            view.info.tabs[TRACK_TAB].text=undefined;
        } else {
            lmsCommand("", command, view.info.tabs[TRACK_TAB].reqId).then(({data}) => {
                logJsonMessage("RESP", data);
                if (data && data.result && view.isCurrent(data, TRACK_TAB)) {
                    let parsed = data.result.lyrics ? formatLyrics(replaceNewLines(data.result.lyrics)) : undefined;
                    view.info.tabs[TRACK_TAB].text=undefined==parsed || parsed.timed ? undefined : parsed.data;
                    view.info.tabs[TRACK_TAB].lines=parsed && parsed.timed ? parsed.data : undefined;
                    if (view.info.tabs[TRACK_TAB].lines && view.info.tabs[TRACK_TAB].lines.length>0) {
                        // Check if times are valid - e.g. might be playing a radio stream, in which case
                        // highlight and auto scroll can be wildy off.
                        //
                        // If current playback position is more than 15mins beyond last line's timestamp, then
                        // disable highlight and auto-scroll. This is achieved by setting time of first line
                        // to less than 0
                        let lastTime=view.info.tabs[TRACK_TAB].lines[view.info.tabs[TRACK_TAB].lines.length-1].time;
                        if (undefined==view.playerStatus.current.duration || undefined==view.playerStatus.current.time || view.playerStatus.current.time>(lastTime+900)) {
                            view.info.tabs[TRACK_TAB].lines[0].time=-1;
                        } else if (view.info.tabs[TRACK_TAB].lines.length>3) {
                            setTimeout(function () { view.updateLyricsPosition(); }.bind(view), 100);
                        }
                    }
                }
            }).catch(error => {
                view.info.tabs[TRACK_TAB].text=undefined;
            });
        }
    } else if (undefined==view.infoTrack.artist && undefined==view.infoTrack.title && undefined==view.infoTrack.track_id && undefined==view.infoTrack.artist_id) {
        view.info.tabs[TRACK_TAB].text=undefined;
    }

    let html="";
    let trk = view.playerStatus.current;

    trk.title = trackTitle(trk);
    if (undefined!=trk.artist) {
        let entry = nowplayingArtistEntry(trk, 'artist', 'ARTIST');
        if (entry.length>1) {
            html+="<tr><td>"+i18n("Artist")+"&nbsp;</td><td>"+entry+"</td></tr>";
        } else {
            let entry = nowplayingArtistEntry(trk, 'trackartist', 'ARTIST');
            if (entry.length>1) {
                html+="<tr><td>"+i18n("Artist")+"&nbsp;</td><td>"+entry+"</td></tr>";
            }
        }
    }
    let others = [['albumartist', i18n("Album artist"), !isSameArtistsL(trk, 'albumartist', ['artist', 'trackartist'])],
                  ['band', i18n("Band/orchestra"), !isSameArtistsL(trk, 'band', ['albumartist', 'artist', 'trackartist'])],
                  ['conductor', i18n("Conductor"), true],
                  ['composer', i18n("Composer"), true]
                 ];
    for (let i=0, len=others.length; i<len; ++i) {
        if (others[i][2] && undefined!=trk[others[i][0]]) {
            let entry = nowplayingArtistEntry(trk, others[i][0], others[i][0].toUpperCase());
            if (entry.length>1) {
                html+="<tr><td>"+others[i][1]+"&nbsp;</td><td>"+entry+"</td></tr>";
            }
        }
    }
    if (undefined!=lmsOptions.userDefinedRoles && undefined!=lmsOptions.userDefinedRolesOrder) {
        for (let k=0, loop=lmsOptions.userDefinedRolesOrder, len=loop.length; k<len; ++k) {
            let value = lmsOptions.userDefinedRoles[loop[k]];
            if (undefined!=trk[value.lrole]) {
                let entry = nowplayingArtistEntry(trk, value.lrole, value.role);
                if (entry.length>1) {
                    html+="<tr><td>"+value.name+"&nbsp;</td><td>"+entry+"</td></tr>";
                }
            }
        }
    }
    let artist = trk.albumartist ? trk.albumartist : trk.artist;
    if (undefined!=trk.album ) {
        if (undefined!=trk.album_id) {
            html+="<tr><td>"+i18n("Album")+"&nbsp;</td><td><obj class=\"link-item\" onclick=\"nowplayingBrowse('album', "+trk.album_id+
                  ", \'"+escape(trk.album)+"\', \'" +escape(artist)+ "\')\">"+trk.albumName+"</obj></td></tr>";
        } else {
            html+="<tr><td>"+i18n("Album")+"&nbsp;</td><td>"+trk.albumName+"</td></tr>";
        }
    }
    if (undefined!=trk.work ) {
        if (undefined!=trk.work_id) {
            html+="<tr><td>"+i18n("Work")+"&nbsp;</td><td><obj class=\"link-item\" onclick=\"nowplayingBrowse('work', "+trk.work_id+", \'"+escape(trk.work)+"\', \'"+escape(artist)+"\')\">"+trk.work+"</obj></td></tr>";
        } else {
            html+="<tr><td>"+i18n("Work")+"&nbsp;</td><td>"+trk.work+"</td></tr>";
        }
    }
    if (undefined!=trk.performance ) {
        if (undefined!=trk.work && undefined!=trk.work_id) {
            html+="<tr><td>"+i18n("Performance")+"&nbsp;</td><td><obj class=\"link-item\" onclick=\"nowplayingBrowse('performance', "+trk.work_id+", \'"+escape(trk.performance+SEPARATOR+trk.work)+"\', \'"+escape(artist)+"\', \'"+escape(trk.performance)+"\')\">"+trk.performance+"</obj></td></tr>";
        } else {
            html+="<tr><td>"+i18n("Performance")+"&nbsp;</td><td>"+trk.performance+"</td></tr>";
        }
    }
    if (undefined!=trk.year && trk.year>0) {
        html+="<tr><td>"+i18n("Year")+"&nbsp;</td><td><obj class=\"link-item\" onclick=\"nowplayingBrowse('year', "+trk.year+")\">"+trk.year+"</obj></td></tr>";
    }
    if (undefined!=trk.genres && Array.isArray(trk.genres)) {
        let genres = [];
        for (let i=0, list = trk.genres, len=list.length; i<len; ++i) {
            let id = trk.genre_ids ? trk.genre_ids[i] : "'-'";
            genres.push("<obj class=\"link-item\" onclick=\"nowplayingBrowse('genre', "+id+",\'"+escape(list[i])+"\')\">"+list[i]+"</obj>");
        }
        html+="<tr><td>"+i18n("Genre")+"&nbsp;</td><td>" + genres.join(", ") + "</td></tr>";
    } else if (undefined!=trk.genre) {
        html+="<tr><td>"+i18n("Genre")+"&nbsp;</td><td><obj class=\"link-item\" onclick=\"nowplayingBrowse('genre', "+trk.genre_id+",\'"+escape(trk.genre)+"\')\">"+trk.genre+"</obj></td></tr>";
    }

    if (undefined!=trk.source) {
        if (undefined!=trk.source.url) {
            html+="<tr><td>"+i18n("Source")+"&nbsp;</td><td><a follow href=\""+trk.source.url+"\">" + trk.source.text + "</a></td></tr>";
        } else {
            html+="<tr><td>"+i18n("Source")+"&nbsp;</td><td>"+trk.source.text+"</td></tr>";
        }
    }

    if (view.$store.state.techInfo && undefined!=trk.technicalInfo) {
        html+="<tr><td>"+i18n("Technical")+"&nbsp;</td><td>"+trk.technicalInfo+"</td></tr>";
    }

    if (undefined!=trk.comment) {
        let urlRegex = /(https?:\/\/[^\s]+)/g;
        let comment = trk.comment.replace(urlRegex, function(url) {
            return "<a class=\"link-item\" onclick=\"openWebUrl('" + escape(url)+"')\">"+url+"</a>";
        });
        comment = filterComments(comment);
        if (undefined!=comment) {
            html+="<tr><td>"+i18n("Comment")+"&nbsp;</td><td>"+comment+"</td></tr>";
        }
    }

    if (html.length>0) {
        view.info.tabs[TRACK_TAB].sections[0].html = "<table class=\"np-html-sect\">" + html + "</table>";
    } else {
        view.info.tabs[TRACK_TAB].sections[0].html = undefined;
    }
}

function nowPlayingGetArtistAlbums(view, artist_id) {
    lmsList("", ["albums"], ["artist_id:"+artist_id, ARTIST_ALBUM_TAGS, "sort:yearalbum"], 0, NP_MAX_ALBUMS, false, view.info.tabs[ARTIST_TAB].reqId).then(({data}) => {
        logJsonMessage("RESP", data);
        if (data && data.result && view.isCurrent(data, ARTIST_TAB)) {
            let resp = parseBrowseResp(data);
            view.info.tabs[ARTIST_TAB].sections[0].items = resp.items;
            view.info.tabs[ARTIST_TAB].sections[0].title = resp.subtitle;
            view.info.tabs[ARTIST_TAB].sections[0].haveSub = false;
            for (i=0, loop=view.info.tabs[ARTIST_TAB].sections[0].items, len=loop.length; i<len ; ++i) {
                if (loop[i].subtitle == view.info.tabs[ARTIST_TAB].artist) {
                    loop[i].origsubtitle = loop[i].subtitle;
                    loop[i].subtitle = undefined;
                } else {
                    view.info.tabs[ARTIST_TAB].sections[0].haveSub = true;
                }
            }
            if (data.result.count>NP_MAX_ALBUMS) {
                view.info.tabs[ARTIST_TAB].sections[0].more=i18n("+ %1 more", data.result.count-NP_MAX_ALBUMS);
            }
        }
    });
}

function nowplayingFetchArtistInfo(view) {
    let maiComposer = view.infoTrack.maiComposer;
    let artist = maiComposer ? view.infoTrack.composer : view.infoTrack.artist;
    let artist_id = maiComposer ? view.infoTrack.composer_id : view.infoTrack.artist_id;
    let artist_ids = maiComposer ? view.infoTrack.composer_ids : view.infoTrack.artist_ids;
    let artists = maiComposer ? view.infoTrack.composers : view.infoTrack.artists;

    if (undefined!=artists && artists.length>1 && undefined!=artist_ids && artists.length==artist_ids.length) {
        artist = "";
        for (let a=0, len=artists.length; a<len; ++a) {
            artist+=(a>0 ? SEPARATOR : "")+
            (IS_MOBILE
              ? artists[a]
              : ("<obj class=\"link-item\" onclick=\"nowPlayingMAIScroll(event, " + ARTIST_TAB + ", 'mai-artist-"+a+"')\">" + artists[a] + "</obj>"));
        }
    }
    if (view.info.tabs[ARTIST_TAB].artist!=artist || view.info.tabs[ARTIST_TAB].artist_id!=artist_id ||
        (undefined!=view.info.tabs[ARTIST_TAB].artist_ids && undefined!=artist_ids && view.info.tabs[ARTIST_TAB].artist_ids.length!=artist_ids.length)) {
        view.info.tabs[ARTIST_TAB].sections[0].items=[];
        view.info.tabs[ARTIST_TAB].sections[0].more=undefined;
        view.info.tabs[ARTIST_TAB].sections[1].html=undefined;
        view.info.tabs[ARTIST_TAB].texttitle=nowPlayingHeader(artist);
        view.info.tabs[ARTIST_TAB].text=i18n("Fetching...");
        view.info.tabs[ARTIST_TAB].image=undefined;
        view.info.tabs[ARTIST_TAB].isMsg=true;
        view.info.tabs[ARTIST_TAB].artist=artist;
        view.info.tabs[ARTIST_TAB].artist_id=artist_id;
        view.info.tabs[ARTIST_TAB].artist_ids=artist_ids;
        view.info.tabs[ARTIST_TAB].albumartist=view.infoTrack.albumartist;
        view.info.tabs[ARTIST_TAB].albumartist_ids=view.infoTrack.albumartist_ids;
        view.info.tabs[ARTIST_TAB].reqId++;
        if (view.info.tabs[ARTIST_TAB].reqId>65535) {
            view.info.tabs[ARTIST_TAB].reqId = 0;
        }
        if (undefined!=artists && artists.length>1 && undefined!=artist_ids && artists.length==artist_ids.length) {
            let ids = artist_ids;
            view.info.tabs[ARTIST_TAB].count = ids.length;
            view.info.tabs[ARTIST_TAB].details = [];
            for (let i=0, len=ids.length; i<len; ++i) {
                lmsCommand("", ["musicartistinfo", "biography", "artist_id:"+ids[i], "html:1"], view.info.tabs[ARTIST_TAB].reqId).then(({data}) => {
                    logJsonMessage("RESP", data);
                    if (data && view.isCurrent(data, ARTIST_TAB)) {
                        if (data.result && data.result.biography) {
                            if (data.result.artist) {
                                view.info.tabs[ARTIST_TAB].details.push({weight:i, text:"<b id=\"mai-artist-" + i +"\">"+data.result.artist+"</b><br/>" + replaceNewLines(data.result.biography)});
                            }
                            if (0==i) {
                                if (undefined!=data.result.portraitid) {
                                    view.info.tabs[ARTIST_TAB].image=undefined!=data.result.portraitid && ("/contributor/" + data.result.portraitid + "/image" + LMS_IMAGE_SIZE);
                                } else {
                                    view.info.tabs[ARTIST_TAB].image="/imageproxy/mai/artist/" + ids[0] + "/image" + LMS_IMAGE_SIZE;
                                }
                            }
                        }
                    }
                    view.info.tabs[ARTIST_TAB].count--;
                    if (0 == view.info.tabs[ARTIST_TAB].count) {
                        if (view.info.tabs[ARTIST_TAB].details.length<1) {
                            view.info.tabs[ARTIST_TAB].text = undefined;
                            if (undefined!=data.result.portraitid) {
                                view.info.tabs[ARTIST_TAB].image=undefined!=data.result.portraitid && ("/contributor/" + data.result.portraitid + "/image" + LMS_IMAGE_SIZE);
                            } else {
                                view.info.tabs[ARTIST_TAB].image="/imageproxy/mai/artist/" + artist_ids[0] + "/image" + LMS_IMAGE_SIZE;
                            }
                        } else {
                            view.info.tabs[ARTIST_TAB].isMsg=false;
                            view.info.tabs[ARTIST_TAB].details.sort(weightSort);
                            view.info.tabs[ARTIST_TAB].text="";
                            for (let idx=0, count=view.info.tabs[ARTIST_TAB].details.length; idx<count; ++idx) {
                                view.info.tabs[ARTIST_TAB].text+=(idx>0 ? "<br/><br/>" : "") + view.info.tabs[ARTIST_TAB].details[idx].text;
                            }
                            view.info.tabs[ARTIST_TAB].details = undefined;
                        }
                    }
                });
            }
        } else if (undefined!=artist_id || undefined!=artist) {
            let command = ["musicartistinfo", "biography", "html:1"];
            if (undefined!=artist_id) {
                command.push("artist_id:"+artist_id);
            } else {
                command.push("artist:"+revertHtmlBrackets(artist));
            }
            if (3==command.length) { // No details?
                view.info.tabs[ARTIST_TAB].text=undefined;
            } else {
                lmsCommand("", command, view.info.tabs[ARTIST_TAB].reqId).then(({data}) => {
                    logJsonMessage("RESP", data);
                    if (data && data.result && view.isCurrent(data, ARTIST_TAB) && (data.result.biography || data.result.error)) {
                        // If failed with artist, try albumartist (if view is within artist)
                        if (undefined==data.result.biography && !maiComposer &&
                            view.info.tabs[ARTIST_TAB].albumartist &&
                            view.info.tabs[ARTIST_TAB].artist!=view.info.tabs[ARTIST_TAB].albumartist &&
                            view.info.tabs[ARTIST_TAB].artist.indexOf(view.info.tabs[ARTIST_TAB].albumartist)>=0) {
                            let command = ["musicartistinfo", "biography", "html:1"];
                            if (view.infoTrack.albumartist_ids!=undefined) {
                                command.push("artist_id:"+view.infoTrack.albumartist_ids[0]);
                            } else if (view.infoTrack.albumartist!=undefined) {
                                command.push("artist:"+revertHtmlBrackets(view.infoTrack.albumartist));
                            }
                            if (3==command.length) {
                                view.info.tabs[ARTIST_TAB].text=undefined;
                                view.info.tabs[ARTIST_TAB].isMsg=true;
                            } else {
                                lmsCommand("", command, view.info.tabs[ARTIST_TAB].reqId).then(({data}) => {
                                    logJsonMessage("RESP", data);
                                    if (data && data.result && view.isCurrent(data, ARTIST_TAB)) {
                                        view.info.tabs[ARTIST_TAB].text=data.result.biography ? replaceNewLines(data.result.biography) : undefined;
                                        if (undefined!=data.result.portraitid) {
                                            view.info.tabs[ARTIST_TAB].image=undefined!=data.result.portraitid && ("/contributor/" + data.result.portraitid + "/image" + LMS_IMAGE_SIZE);
                                        } else {
                                            view.info.tabs[ARTIST_TAB].image=view.infoTrack.albumartist_ids==undefined ? undefined : ("/imageproxy/mai/artist/" + view.infoTrack.albumartist_ids[0] + "/image" + LMS_IMAGE_SIZE);
                                        }
                                        view.info.tabs[ARTIST_TAB].isMsg=undefined==data.result.biography;
                                    }
                                }).catch(error => {
                                    view.info.tabs[ARTIST_TAB].text=undefined;
                                });
                            }
                        } else {
                            view.info.tabs[ARTIST_TAB].text=data.result.biography ? replaceNewLines(data.result.biography) : undefined;
                            if (undefined!=data.result.portraitid) {
                                view.info.tabs[ARTIST_TAB].image=undefined!=data.result.portraitid && ("/contributor/" + data.result.portraitid + "/image" + LMS_IMAGE_SIZE);
                            } else {
                                view.info.tabs[ARTIST_TAB].image=artist_ids==undefined ? undefined : ("/imageproxy/mai/artist/" + artist_ids[0] + "/image" + LMS_IMAGE_SIZE);
                            }
                            view.info.tabs[ARTIST_TAB].isMsg=undefined==data.result.biography;
                        }
                    }
                }).catch(error => {
                    view.info.tabs[ARTIST_TAB].text=undefined;
                });
            }
        } else {
            view.info.tabs[ARTIST_TAB].text=undefined;
        }

        if (artist_id!=undefined && artist_id>=0) {
            nowPlayingGetArtistAlbums(view, artist_id);
        } else if (view.info.tabs[ARTIST_TAB].albumartist || view.info.tabs[ARTIST_TAB].artist) {
            lmsCommand("", ["material-skin", "map", "artist:"+revertHtmlBrackets(view.info.tabs[ARTIST_TAB].albumartist ? view.info.tabs[ARTIST_TAB].albumartist : view.info.tabs[ARTIST_TAB].artist)], view.info.tabs[ARTIST_TAB].reqId).then(({data}) => {
                if (data && data.result && data.result.artist_id && view.isCurrent(data, ARTIST_TAB)) {
                    logJsonMessage("RESP", data);
                    nowPlayingGetArtistAlbums(view, data.result.artist_id);
                }
            });
        }

        if (view.info.tabs[ARTIST_TAB].albumartist || view.info.tabs[ARTIST_TAB].artist) {
            lmsCommand("", ["material-skin", "similar", "artist:"+revertHtmlBrackets(view.info.tabs[ARTIST_TAB].artist ? view.info.tabs[ARTIST_TAB].artist : view.info.tabs[ARTIST_TAB].albumartist)], view.info.tabs[ARTIST_TAB].reqId).then(({data}) => {
                if (data && data.result && data.result.similar_loop) {
                    logJsonMessage("RESP", data);
                    if (data.result.similar_loop.length>0) {
                        let items=[];
                        for (let i=0, loop=data.result.similar_loop, len=loop.length; i<len; ++i) {
                            items.push("<obj class=\"link-item\" onclick=\"nowplayingSearch(\'"+escape(loop[i].artist)+"\')\">" + loop[i].artist + "</obj>");
                        }
                        view.info.tabs[ARTIST_TAB].sections[1].html="<p class=\"np-html-sect\">"+items.join(SEPARATOR_HTML)+"</p>";
                    }
                }
            });
        }
    } else if (undefined==artist && undefined==artist_id && undefined==artist_ids) {
        view.info.tabs[ARTIST_TAB].isMsg=true;
        view.info.tabs[ARTIST_TAB].text=undefined;
        view.info.tabs[ARTIST_TAB].sections[0].items=[];
    }
}

function nowplayingFetchAlbumInfo(view) {
    let albumartist = view.infoTrack.albumartist!=undefined ? view.infoTrack.albumartist : view.infoTrack.artist;
    let albumartist_id = view.infoTrack.albumartist_id!=undefined ? view.infoTrack.albumartist_id : view.infoTrack.artist_id;
    let work_id = view.infoTrack.isClassical ? view.infoTrack.work_id : undefined;
    if ((undefined!=view.infoTrack.album_id
            ? view.info.tabs[ALBUM_TAB].album_id!=view.infoTrack.album_id
            : (view.info.tabs[ALBUM_TAB].albumartist!=albumartist || view.info.tabs[ALBUM_TAB].albumartist_id!=albumartist_id ||
        view.info.tabs[ALBUM_TAB].album!=view.infoTrack.album || view.info.tabs[ALBUM_TAB].album_id!=view.infoTrack.album_id)) ||
        view.info.tabs[ALBUM_TAB].work_id!=work_id) {
        view.info.tabs[ALBUM_TAB].sections[2].items=[];
        view.info.tabs[ALBUM_TAB].sections[2].more=undefined;
        view.info.tabs[ALBUM_TAB].sections[3].items=[];
        view.info.tabs[ALBUM_TAB].texttitle=nowPlayingHeader(view.infoTrack.album);
        view.info.tabs[ALBUM_TAB].text=i18n("Fetching...");
        view.info.tabs[ALBUM_TAB].image=undefined;
        view.info.tabs[ALBUM_TAB].isMsg=true;
        view.info.tabs[ALBUM_TAB].albumartist=albumartist;
        view.info.tabs[ALBUM_TAB].albumartist_id=albumartist_id;
        view.info.tabs[ALBUM_TAB].album=view.infoTrack.album;
        view.info.tabs[ALBUM_TAB].album_id=view.infoTrack.album_id;
        view.info.tabs[ALBUM_TAB].work_id=work_id;
        view.info.tabs[ALBUM_TAB].reqId++;
        view.info.tabs[ALBUM_TAB].haveAlbumReview=0;
        view.info.tabs[ALBUM_TAB].haveWorkReview=0;
        if (view.info.tabs[ALBUM_TAB].reqId>65535) {
            view.info.tabs[ALBUM_TAB].reqId = 0;
        }
        let command = ["musicartistinfo", "albumreview", "html:1"];
        if (view.infoTrack.album_id!=undefined) {
            command.push("album_id:"+view.infoTrack.album_id);
        } else {
            if (view.infoTrack.album!=undefined) {
                command.push("album:"+revertHtmlBrackets(view.infoTrack.album));
            }
            if (albumartist_id!=undefined) {
                command.push("artist_id:"+albumartist_id);
            }
            if (albumartist!=undefined) {
                command.push("artist:"+revertHtmlBrackets(albumartist));
            }
        }

        if (3==command.length) { // No details?
            view.info.tabs[ALBUM_TAB].text=undefined;
            view.info.tabs[ALBUM_TAB].image=view.infoTrack.empty ? undefined : view.coverUrl;
        } else {
            lmsCommand("", command, view.info.tabs[ALBUM_TAB].reqId).then(({data}) => {
                logJsonMessage("RESP", data);
                if (data && data.result && view.isCurrent(data, ALBUM_TAB)) {
                    let text = data.result.albumreview ? replaceNewLines(data.result.albumreview) : undefined;
                    if (view.info.tabs[ALBUM_TAB].work_id!=undefined) {
                        view.info.tabs[ALBUM_TAB].text=undefined;
                        if (undefined!=text) {
                            view.info.tabs[ALBUM_TAB].sections[0].title = lmsOptions.supportReleaseTypes ? i18n("Release review") : i18n("Album review");
                            view.info.tabs[ALBUM_TAB].sections[0].html = text;
                        }
                    } else {
                        view.info.tabs[ALBUM_TAB].text=text;
                    }
                    view.info.tabs[ALBUM_TAB].haveAlbumReview = 1;
                    view.info.tabs[ALBUM_TAB].image=/*data.result.albumreview ? undefined :*/ view.coverUrl;
                    view.info.tabs[ALBUM_TAB].isMsg=undefined==data.result.albumreview;
                }
            }).catch(error => {
                view.info.tabs[ALBUM_TAB].haveAlbumReview = -1;
                if (undefined==view.info.tabs[ALBUM_TAB].work_id || view.info.tabs[ALBUM_TAB].haveWorkReview==-1) {
                    view.info.tabs[ALBUM_TAB].text=undefined;
                }
                view.info.tabs[ALBUM_TAB].image=/*data.result.albumreview ? undefined :*/ view.coverUrl;
            });
        }
        if (view.info.tabs[ALBUM_TAB].work_id!=undefined) {
            lmsCommand("", ["musicartistinfo", "workreview", "html:1", "work_id:"+view.info.tabs[ALBUM_TAB].work_id], view.info.tabs[ALBUM_TAB].reqId).then(({data}) => {
                logJsonMessage("RESP", data);
                if (data && data.result && view.isCurrent(data, ALBUM_TAB)) {
                    let text = data.result.workreview ? replaceNewLines(data.result.workreview) : undefined;
                    if (undefined!=text) {
                        view.info.tabs[ALBUM_TAB].sections[1].title = i18n("Work review");
                        view.info.tabs[ALBUM_TAB].sections[1].html = text;
                    }
                    view.info.tabs[ALBUM_TAB].haveWorkReview = 1;
                }
            }).catch(error => {
                view.info.tabs[ALBUM_TAB].haveWorkReview = -1;
                if (view.info.tabs[ALBUM_TAB].haveAlbumReview==-1) {
                    view.info.tabs[ALBUM_TAB].text=undefined;
                }
            });
        }
        if (view.infoTrack.album_id!=undefined) {
            lmsList("", ["tracks"], ["album_id:"+view.infoTrack.album_id, trackTags(true)+(view.$store.state.showRating ? "R" : ""), "sort:tracknum"], 0, 1000, false, view.info.tabs[ALBUM_TAB].reqId).then(({data}) => {
                logJsonMessage("RESP", data);
                if (data && data.result && view.isCurrent(data, ALBUM_TAB)) {
                    let resp = parseBrowseResp(data);
                    view.info.tabs[ALBUM_TAB].sections[2].items = resp.items.slice(0, NP_MAX_TRACKS);
                    view.info.tabs[ALBUM_TAB].sections[2].title = resp.plainsubtitle;
                    let count = view.info.tabs[ALBUM_TAB].sections[2].items.length;
                    // If last shown is a header, remove
                    if (view.info.tabs[ALBUM_TAB].sections[2].items[count-1].header) {
                        view.info.tabs[ALBUM_TAB].sections[2].items.pop();
                        count--;
                    }
                    if (data.result.count>count) {
                        view.info.tabs[ALBUM_TAB].sections[2].more=i18n("+ %1 more", data.result.count-count);
                    }
                }
            });
        }
        if (LMS_P_MAI && view.infoTrack.path!=undefined) {
            lmsCommand('', ['musicartistinfo', 'localfiles', 'folder:'+view.infoTrack.path]).then(({data}) => {
                if (data && data.result && data.result.item_loop && data.result.item_loop.length>0) {
                    let resp = parseBrowseResp(data);
                    if (undefined==resp || undefined==resp.items || resp.items.length<1) {
                        return;
                    }
                    view.info.tabs[ALBUM_TAB].sections[3].items=resp.items;
                }
            }).catch(err => {
            });
        }
    } else if (undefined==albumartist && undefined==view.infoTrack.artist_id &&
               undefined==view.infoTrack.album && undefined==view.infoTrack.album && undefined==work_id) {
        view.info.tabs[ALBUM_TAB].isMsg=true;
        view.info.tabs[ALBUM_TAB].text=undefined;
        view.info.tabs[ALBUM_TAB].image=/*view.infoTrack.empty ? undefined :*/ view.coverUrl;
        view.info.tabs[ALBUM_TAB].sections[2].items=[];
        view.info.tabs[ALBUM_TAB].sections[3].items=[];
    }
}

function nowplayingItemClicked(view, tab, section, index, event) {
    let item = view.info.tabs[tab].sections[section].items[index];
    if (item.header) {
        return;
    }
    if (item.weblink) {
        openWebLink(item);
        return;
    }
    view.menu.items=[{title:ACTIONS[PLAY_ACTION].title, icon:ACTIONS[PLAY_ACTION].icon, act:NP_ITEM_ACT+PLAY_ACTION},
                     {title:ACTIONS[INSERT_ACTION].title, svg:ACTIONS[INSERT_ACTION].svg, act:NP_ITEM_ACT+INSERT_ACTION},
                     {title:ACTIONS[ADD_ACTION].title, icon:ACTIONS[ADD_ACTION].icon, act:NP_ITEM_ACT+ADD_ACTION}];
    if (ARTIST_TAB==tab) {
        view.menu.items.push({title:i18n("Browse"), svg:'library-music-outline', act:NP_ITEM_ACT+MORE_LIB_ACTION});
    }
    view.menu.items.push({title:ACTIONS[MORE_ACTION].title, svg:ACTIONS[MORE_ACTION].svg, act:NP_ITEM_ACT+MORE_ACTION});
    view.menu.icons=true;
    view.menu.tab = tab;
    view.menu.section = section;
    view.menu.index = index;
    view.menu.x = event.clientX;
    view.menu.y = event.clientY;
    view.$nextTick(() => {
        view.menu.show = true;
    });
}

function nowplayingMoreClicked(view, tab, section) {
    if (ARTIST_TAB==tab && 0==section) {
        bus.$emit("browse", ["albums"], ["artist_id:"+view.infoTrack.artist_id, ARTIST_ALBUM_TAGS, SORT_KEY+"yearalbum"], unescape(view.infoTrack.artist), NP_INFO);
        view.info.show=false;
    } else if (ALBUM_TAB==tab && 2==section) {
        bus.$emit("browse", ["tracks"], ["album_id:"+view.infoTrack.album_id, trackTags(true), SORT_KEY+"tracknum"], unescape(view.infoTrack.album), NP_INFO,
                   undefined, unescape(view.infoTrack.albumartist ? view.infoTrack.albumartist : view.infoTrack.artist));
        view.info.show=false;
    }
}

function nowplayingToggleGrid(view, tab, section) {
    view.info.tabs[tab].sections[section].grid=!view.info.tabs[tab].sections[section].grid;
    setLocalStorageVal("np-tabs-"+tab+"-"+section+"-grid", view.info.tabs[tab].sections[section].grid);
}

function nowplayingSearch(str) {
    if (bus.$store.state.visibleMenus.size>0) {
        return;
    }
    bus.$emit('browse-search', unescape(str), NP_INFO);
    bus.$emit('npclose');
}

function nowplayingBrowse(cat, param, title, subtitle, other) {
    let cmd=undefined;
    let params=undefined;
    if ('year'==cat) {
        bus.$emit("npbrowse", cat, param, ""+param);
    } else if ('genre'==cat) {
        let name = unescape(title);
        if (isNaN(param)) {
            lmsCommand("", ["material-skin", "map", "genre:"+name]).then(({data}) => {
                if (data && data.result && data.result.genre_id) {
                    logJsonMessage("RESP", data);
                    bus.$emit("npbrowse", cat, data.result.genre_id, name);
                } else {
                    bus.$emit('showError', undefined, i18n("Unknown genre"));
                }
            }).catch(error => {
                bus.$emit('showError', undefined, i18n("Unknown genre"));
            });
        } else {
            bus.$emit("npbrowse", cat, param, name);
        }
    } else if ('work'==cat) {
        bus.$emit("npbrowse", ["albums"], ["work_id:"+param, ARTIST_ALBUM_TAGS, SORT_KEY+ARTIST_ALBUM_SORT_PLACEHOLDER], unescape(title), unescape(subtitle));
    } else if ('performance'==cat) {
        bus.$emit("npbrowse", ["tracks"], ["work_id:"+param, "performance:"+unescape(other), trackTags(true), SORT_KEY+"tracknum"], unescape(title), unescape(subtitle));
    } else if ('album'==cat) {
        bus.$emit("npbrowse", ["tracks"], ["album_id:"+param, trackTags(true), SORT_KEY+"tracknum"], unescape(title), unescape(subtitle));
    } else {
        cmd=["albums"];
        params=["artist_id:"+param, ARTIST_ALBUM_TAGS, SORT_KEY+ARTIST_ALBUM_SORT_PLACEHOLDER];
        if (cat!='ARTIST') {
            params.push("role_id:"+cat);
        }
        bus.$emit("npbrowse", cmd, params, unescape(title));
    }
}

function nowPlayingConfigMenu(view, event) {
    event.preventDefault();
    view.clearClickTimeout();
    view.touch = undefined;
    view.menu.show = false;
    view.menu.icons = false;
    view.menu.items = [];
    if (view.windowWidth>NP_MIN_WIDTH_FOR_FULL) {
        view.menu.items.push({title:i18n("Show in tabs"), act:NP_SHOW_IN_TABS_ACT, check:view.info.showTabs});
    }
    view.menu.items.push({title:i18n("Update on track change"), act:NP_SYNC_ACT, check:view.info.sync});
    if (view.info.tabs[TRACK_TAB].lines && (!view.info.showTabs || view.info.tab==TRACK_TAB)) {
        view.menu.items.push({title:i18n("Auto-scroll lyrics"), act:NP_LYRICS_SCROLL_ACT, check:view.info.tabs[TRACK_TAB].scroll});
        view.menu.items.push({title:i18n("Highlight current lyric line"), act:NP_LYRICS_HIGHLIGHT_ACT, check:view.info.tabs[TRACK_TAB].highlight});
    }
    view.menu.items.push({divider:true});
    view.menu.items.push({title:i18n("Zoom"), header:true});
    var values = [1.0, 1.25, 1.5, 1.75, 2.0];
    for (let i=0, len=values.length; i<len; ++i) {
        view.menu.items.push({title:(values[i]*100)+"%", act:NP_ZOOM_ACT, radio:view.zoom==values[i], value:values[i]});
    }

    view.menu.x = event.clientX;
    view.menu.y = event.clientY;
    view.$nextTick(() => {
        view.menu.show = true;
    });
}

function nowPlayingClickImage(view, event) {
    if (view.menu.show) {
        view.menu.show = false;
        return;
    }
    if (view.$store.state.visibleMenus.size>0 || (!view.desktopLayout && view.$store.state.page!='now-playing')) {
        return;
    }
    if (view.showOverlay) {
        let cp = getClickPos(event);
        let elems = [document.getElementById("overlay-menu"), document.getElementById("overlay-close"), document.getElementById("skip-back"), document.getElementById("skip-fwd")];
        let closeOverlay = true;
        for (let e=0, len=elems.length; e<len; ++e) {
            if (undefined!=elems[e]) {
                let r = elems[e].getBoundingClientRect();
                if (inRect(cp.x, cp.y, r.x, r.y, r.width, r.height, 16)) {
                    closeOverlay = false;
                    break
                }
            }
        }
        if (closeOverlay) {
            view.clearShowOverlayTimeout();
            return;
        }
    }
    if (!view.clickTimer) {
        view.clickTimer = setTimeout(function () {
            view.clearClickTimeout();
            if (view.$store.state.desktopLayout && !view.largeView) {
                bus.$emit('expandNowPlaying', true);
            } else if (view.playerStatus.playlist.count>0) {
                view.resetShowOverlayTimeout();
            }
        }.bind(view), LMS_DOUBLE_CLICK_TIMEOUT);
    } else {
        view.clearClickTimeout();
        view.showPic();
    }
}

function nowplayingMAIMenuClicked(view, ev, tab) {
    if (view.$store.state.visibleMenus.size>0) {
        return;
    }

    let items = [];

    items.push({title:i18n("Top"), id:"mai-t-"+tab});
    if (tab==ARTIST_TAB) {
        let artists = view.infoTrack.maiComposer ? view.infoTrack.composers : view.infoTrack.artists;
        let artist_ids = view.infoTrack.maiComposer ? view.infoTrack.composer_ids : view.infoTrack.artist_ids;
        if (undefined!=artists && artists.length>1 && undefined!=artist_ids && artists.length==artist_ids.length) {
            artist = "";
            for (let a=0, len=artists.length; a<len; ++a) {
                let id = "mai-artist-"+a;
                let elem = document.getElementById(id);
                if (undefined!=elem) {
                    items.push({title:artists[a], id:id});
                }
            }
        }
    }
    let lastSect = tab==TRACK_TAB ? 1 : 2;
    for (let i=0; i<=lastSect; ++i) {
        let id = "mai-sect-"+i+"-"+tab;
        let elem = document.getElementById(id);
        if (undefined!=elem) {
            items.push({title:view.info.tabs[tab].sections[i].title, id:id});
        }
    }
    if (items.length==1) {
        nowPlayingMAIScroll(ev, tab, items[0].id);
    } else if (items.length>1) {
        choose(ACTIONS[SCROLL_TO_ACTION].title, items).then(choice => {
            if (undefined!=choice) {
                nowPlayingMAIScroll(ev, tab, choice.id, choice.extraAdjust);
            }
        });
    }
    items.push({title:i18n("Bottom"), id:"mai-b-"+tab});
}