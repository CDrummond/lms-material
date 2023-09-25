/**
 * LMS-Material
 *
 * Copyright (c) 2018-2023 Craig Drummond <craig.p.drummond@gmail.com>
 * MIT license.
 */
const NP_MAX_ALBUMS = 50;
const NP_MAX_TRACKS = 50;
const NP_SIMILAR_URL = 'http://ws.audioscrobbler.com/2.0/?api_key=5a854b839b10f8d46e630e8287c2299b&method=artist.getSimilar&autocorrect=1&format=json&limit=25&&artist=';

function nowplayingOnPlayerStatus(view, playerStatus) {
    var playStateChanged = false;
    var trackChanged = false;

    // Have other items changed
    if (playerStatus.isplaying!=view.playerStatus.isplaying) {
        view.playerStatus.isplaying = playerStatus.isplaying;
        playStateChanged = true;
    }
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
    }
    view.setPosition();
    if (playerStatus.current.id!=view.playerStatus.current.id) {
        view.playerStatus.current.id = playerStatus.current.id;
    }
    if (playerStatus.current.title!=view.playerStatus.current.title) {
        view.playerStatus.current.title = playerStatus.current.title;
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
    var artist = playerStatus.current.trackartist ? playerStatus.current.trackartist : playerStatus.current.artist;
    var artists = playerStatus.current.trackartists ? playerStatus.current.trackartists : playerStatus.current.artists;
    var artist_id = playerStatus.current.trackartist_id ? playerStatus.current.trackartist_id : playerStatus.current.artist_id;
    var artist_ids = playerStatus.current.trackartist_ids ? playerStatus.current.trackartist_ids : playerStatus.current.artist_ids;
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
    var albumartist = playerStatus.current.albumartist ? playerStatus.current.albumartist : playerStatus.current.band;
    var albumartist_ids = playerStatus.current.albumartist_ids ? playerStatus.current.albumartist_ids : playerStatus.current.band_ids;
    var albumartists = playerStatus.current.albumartists ? playerStatus.current.albumartists : playerStatus.current.bands;
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
        playerStatus.current.remote_title!=view.playerStatus.current.remote_title) {
        view.playerStatus.current.albumName = playerStatus.current.album;
        view.playerStatus.current.album_id = playerStatus.current.album_id;
        view.playerStatus.current.year = playerStatus.current.year;
        view.playerStatus.current.remote_title = playerStatus.current.remote_title;
        if (playerStatus.current.year && playerStatus.current.year>0) {
            view.playerStatus.current.album = view.playerStatus.current.albumName+" ("+ playerStatus.current.year+")";
        } else {
            view.playerStatus.current.album = view.playerStatus.current.albumName;
        }
        view.playerStatus.current.albumLine = buildAlbumLine(playerStatus.current, 'now-playing');
        trackChanged = true;
    }
    let rv = undefined==playerStatus.current.rating ? 0 : (Math.ceil(playerStatus.current.rating/10.0)/2.0);
    if (playerStatus.current.rating!=view.rating.setting || view.rating.value!=rv) {
        view.rating.setting = playerStatus.current.rating;
        view.rating.value = rv;
        trackChanged = true;
    }
    var artistAndComposer = buildArtistLine(playerStatus.current, 'now-playing');
    var useComposerTag = playerStatus.current.composer && lmsOptions.showComposer && useComposer(playerStatus.current.genre);
    var useConductorTag = playerStatus.current.conductor && lmsOptions.showConductor && useConductor(playerStatus.current.genre);
    var useBandTag = playerStatus.current.band && lmsOptions.showBand && useBand(playerStatus.current.genre);

    if (playerStatus.current.composer!=view.playerStatus.current.composer) {
        view.playerStatus.current.composer = playerStatus.current.composer;
    }
    if (playerStatus.current.composers!=view.playerStatus.current.composers) {
        view.playerStatus.current.composers = playerStatus.current.composers;
    }
    if (playerStatus.current.conductor!=view.playerStatus.current.conductor) {
        view.playerStatus.current.conductor = playerStatus.current.conductor;
    }
    if (playerStatus.current.conductors!=view.playerStatus.current.conductors) {
        view.playerStatus.current.conductors = playerStatus.current.conductors;
    }
    if (playerStatus.current.band!=view.playerStatus.current.band) {
        view.playerStatus.current.band = playerStatus.current.band;
    }
    if (playerStatus.current.bands!=view.playerStatus.current.bands) {
        view.playerStatus.current.bands = playerStatus.current.bands;
    }
    let composer_id = useComposerTag
                        ? playerStatus.current.composer_id
                            ? playerStatus.current.composer_id
                            : playerStatus.current.composer_ids
                                ? playerStatus.current.composer_ids[0]
                                : undefined
                        : undefined;
    if (composer_id!=view.playerStatus.current.composer_id) {
        view.playerStatus.current.composer_id = composer_id;
    }
    let conductor_id = useConductorTag
                        ? playerStatus.current.conductor_id
                            ? playerStatus.current.conductor_id
                            : playerStatus.current.conductor_ids
                                ? playerStatus.current.conductor_ids[0]
                                : undefined
                        : undefined;
    if (conductor_id!=view.playerStatus.current.conductor_id) {
        view.playerStatus.current.conductor_id = conductor_id;
    }
    let band_id = useBandTag
                        ? playerStatus.current.band_id
                            ? playerStatus.current.band_id
                            : playerStatus.current.band_ids
                                ? playerStatus.current.band_ids[0]
                                : undefined
                        : undefined;
    if (band_id!=view.playerStatus.current.band_id) {
        view.playerStatus.current.band_id = band_id;
    }
    if (playerStatus.current.genre!=view.playerStatus.current.genre) {
        view.playerStatus.current.genre = playerStatus.current.genre;
    }
    if (playerStatus.current.genres!=view.playerStatus.current.genres) {
        view.playerStatus.current.genres = playerStatus.current.genres;
    }
    if (artistAndComposer!=view.playerStatus.current.artistAndComposer) {
        view.playerStatus.current.artistAndComposer = artistAndComposer;
        view.playerStatus.current.artistAndComposerWithContext = buildArtistWithContext(playerStatus.current, 'now-playing', useBandTag, useComposerTag, useConductorTag);
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
    if (playerStatus.playlist.current!=view.playerStatus.playlist.current) {
        view.playerStatus.playlist.current = playerStatus.playlist.current;
    }
    if (playerStatus.playlist.count!=view.playerStatus.playlist.count) {
        view.playerStatus.playlist.count = playerStatus.playlist.count;
    }
    if (playerStatus.current.comment!=view.playerStatus.current.comment) {
        view.playerStatus.current.comment = playerStatus.current.comment;
    }

    var source = getTrackSource(playerStatus.current);
    if (source!=view.playerStatus.current.source) {
        view.playerStatus.current.source = source;
    }

    var technical = formatTechInfo(playerStatus.current, source);
    if (technical!=view.playerStatus.current.technicalInfo) {
        view.playerStatus.current.technicalInfo = technical;
    }

    if (trackChanged && view.info.sync) {
        view.setInfoTrack();
        view.showInfo();
    }

    if (playStateChanged) {
        if (view.playerStatus.isplaying) {
            view.startPositionInterval();
        } else {
            view.stopPositionInterval();
        }
    } else if (view.playerStatus.isplaying && trackChanged) {
        view.startPositionInterval();
    }
    // 'volume' is NOT reactive, as only want to update when overlay is shown!
    view.volume = playerStatus.volume<0 ? -1*playerStatus.volume : playerStatus.volume;

    // Service specific buttons? e.g. Pandora...
    var btns = playerStatus.current.buttons;
    var sb = btns ? btns.shuffle : undefined;
    var rb = btns ? btns.repeat : undefined;
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
    view.disablePrev=(btns && undefined!=btns.rew && 0==parseInt(btns.rew)) || view.disableBtns;
    view.disableNext=(btns && undefined!=btns.fwd && 0==parseInt(btns.fwd)) || view.disableBtns;
}

function nowplayingShowMenu(view, event) {
    event.preventDefault();
    view.clearClickTimeout();
    if (view.info.show || (view.coverUrl && view.coverUrl!=LMS_BLANK_COVER && (undefined==view.touch || !view.touch.moving)) && window.innerHeight>=LMS_MIN_NP_LARGE_INFO_HEIGHT) {
        view.touch = undefined;
        view.menu.show = false;
        let ontoolbar = false;
        if (view.$store.state.desktopLayout && view.info.show) {
            let val = parseInt(getComputedStyle(document.documentElement).getPropertyValue("--bottom-toolbar-height").replace("px", ""));
            ontoolbar=event.clientY>(window.innerHeight-val);
        }
        if (view.info.show && !ontoolbar) {
            view.menu.icons=false;
            view.menu.items=[{title:i18n("Standard font size"), act:NP_FONT_ACT, val:10},
                             {title:i18n("Medium font size"), act:NP_FONT_ACT, val:15},
                             {title:i18n("Large font size"), act:NP_FONT_ACT, val:20}];
        } else {
            view.menu.icons=true;
            view.menu.items=[{title:i18n("Show image"), icon:"photo", act:NP_PIC_ACT},
                             {title:i18n("Show track information"), svg:"more", act:NP_INFO_ACT}];

            let artist_id = view.playerStatus.current.artist_ids
                        ? view.playerStatus.current.artist_ids[0]
                        : view.playerStatus.current.artist_id;
            if (artist_id && view.playerStatus.current.artist && view.playerStatus.current.artist!="?") {
                view.menu.items.push({title:ACTIONS[GOTO_ARTIST_ACTION].title, act:NP_BROWSE_CMD, cmd:{command:["albums"], params:["artist_id:"+artist_id, ARTIST_ALBUM_TAGS, SORT_KEY+ARTIST_ALBUM_SORT_PLACEHOLDER], title:view.playerStatus.current.artist}, svg:ACTIONS[GOTO_ARTIST_ACTION].svg});
            } else {
                let albumartist_id = view.playerStatus.current.albumartist_ids
                            ? view.playerStatus.current.albumartist_ids[0]
                            : view.playerStatus.current.albumartist_id;
                if (albumartist_id && view.playerStatus.current.albumartist && view.playerStatus.current.albumartist!="?") {
                    view.menu.items.push({title:ACTIONS[GOTO_ARTIST_ACTION].title, act:NP_BROWSE_CMD, cmd:{command:["albums"], params:["artist_id:"+albumartist_id, ARTIST_ALBUM_TAGS, SORT_KEY+ARTIST_ALBUM_SORT_PLACEHOLDER, "role_id:ALBUMARTIST"], title:view.playerStatus.current.albumartist}, svg:ACTIONS[GOTO_ARTIST_ACTION].svg});
                }
            }
            if (view.playerStatus.current.composer && view.playerStatus.current.composer_id && useComposer(view.playerStatus.current.genre)) {
                view.menu.items.push({title:i18n("Go to composer"), act:NP_BROWSE_CMD, cmd:{command:["albums"], params:["artist_id:"+view.playerStatus.current.composer_id, ARTIST_ALBUM_TAGS, SORT_KEY+ARTIST_ALBUM_SORT_PLACEHOLDER, "role_id:COMPOSER"], title:view.playerStatus.current.composer}, svg:"composer"});
            }
            if (view.playerStatus.current.conductor && view.playerStatus.current.conductor_id && useConductor(view.playerStatus.current.genre)) {
                view.menu.items.push({title:i18n("Go to conductor"), act:NP_BROWSE_CMD, cmd:{command:["albums"], params:["artist_id:"+view.playerStatus.current.conductor_id, ARTIST_ALBUM_TAGS, SORT_KEY+ARTIST_ALBUM_SORT_PLACEHOLDER, "role_id:CONDUCTOR"], title:view.playerStatus.current.conductor}, svg:"conductor"});
            }
            if (view.playerStatus.current.band && view.playerStatus.current.band_id && useBand(view.playerStatus.current.genre)) {
                view.menu.items.push({title:i18n("Go to band"), act:NP_BROWSE_CMD, cmd:{command:["albums"], params:["artist_id:"+view.playerStatus.current.band_id, ARTIST_ALBUM_TAGS, SORT_KEY+ARTIST_ALBUM_SORT_PLACEHOLDER, "role_id:BAND"], title:view.playerStatus.current.band}, svg:"trumpet"});
            }
            if (view.playerStatus.current.album_id && view.playerStatus.current.album) {
                view.menu.items.push({title:ACTIONS[GOTO_ALBUM_ACTION].title, act:NP_BROWSE_CMD, cmd:{command:["tracks"], params:["album_id:"+view.playerStatus.current.album_id, trackTags(), SORT_KEY+"tracknum"], title:view.playerStatus.current.album}, icon:ACTIONS[GOTO_ALBUM_ACTION].icon});
            }
            let act = isInFavorites(view.playerStatus.current) ? REMOVE_FROM_FAV_ACTION : ADD_TO_FAV_ACTION;
            if (undefined!=view.playerStatus.current.favUrl && undefined!=view.playerStatus.current.favIcon) {
                view.menu.items.push({title:ACTIONS[act].title, act:NP_ITEM_ACT+act, svg:ACTIONS[act].svg});
            }
            if (undefined!=view.playerStatus.current.title) {
                view.menu.items.push({title:i18n("Copy details"), act:NP_COPY_DETAILS_CMD, icon:"content_copy"});
            }
            if (view.customActions && view.customActions.length>0) {
                for (let i=0, loop=view.customActions, len=loop.length; i<len; ++i) {
                    view.menu.items.push({title:loop[i].title, act:NP_CUSTOM+i, icon:loop[i].icon, svg:loop[i].svg});
                }
            }
        }
        view.menu.x = event.clientX;
        view.menu.y = event.clientY;
        view.$nextTick(() => {
            view.menu.show = true;
        });
    }
}

function nowplayingMenuAction(view, item) {
    if (NP_FONT_ACT==item.act) {
        view.adjustFont(item.val);
    } else if (NP_PIC_ACT==item.act) {
        view.showPic();
    } else if (NP_INFO_ACT==item.act) {
        view.trackInfo();
    } else if (NP_BROWSE_CMD==item.act) {
        bus.$emit("browse", item.cmd.command, item.cmd.params, item.cmd.title, 'now-playing');
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
                bus.$emit("browse", ["tracks"], [litem.id, trackTags(), SORT_KEY+"tracknum"], unescape(litem.title), NP_INFO);
                view.close();
            } else if (MORE_ACTION==act) {
                bus.$emit('trackInfo', litem, undefined, NP_INFO);
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
    if (view.info.tabs[TRACK_TAB].artist!=view.infoTrack.artist || view.info.tabs[TRACK_TAB].songtitle!=view.infoTrack.title ||
        view.info.tabs[TRACK_TAB].track_id!=view.infoTrack.track_id || view.info.tabs[TRACK_TAB].artist_id!=view.infoTrack.artist_id) {
        view.info.tabs[TRACK_TAB].text=i18n("Fetching...");
        view.info.tabs[TRACK_TAB].track_id=view.infoTrack.track_id;
        view.info.tabs[TRACK_TAB].artist=view.infoTrack.artist;
        view.info.tabs[TRACK_TAB].artist_id=view.infoTrack.artist_id;
        view.info.tabs[TRACK_TAB].songtitle=view.infoTrack.title;
        view.info.tabs[TRACK_TAB].reqId++;
        if (view.info.tabs[TRACK_TAB].reqId>65535) {
            view.info.tabs[TRACK_TAB].reqId = 0;
        }
        var command = ["musicartistinfo", "lyrics", "html:1"];
        if (view.infoTrack.track_id!=undefined && !(""+view.infoTrack.track_id).startsWith("-")) {
            command.push("track_id:"+view.infoTrack.track_id);
        } else {
            if (view.infoTrack.title!=undefined) {
                command.push("title:"+view.infoTrack.title);
            }
            if (view.infoTrack.artist!=undefined) {
                command.push("artist:"+view.infoTrack.artist);
            }
        }
        if (3==command.length) { // No details?
            view.info.tabs[TRACK_TAB].text=view.infoTrack.empty ? "" : i18n("Insufficient metadata to fetch information.");
        } else {
            lmsCommand("", command, view.info.tabs[TRACK_TAB].reqId).then(({data}) => {
                logJsonMessage("RESP", data);
                if (data && data.result && view.isCurrent(data, TRACK_TAB)) {
                    view.info.tabs[TRACK_TAB].text=data.result.lyrics ? replaceNewLines(data.result.lyrics) : view.infoTrack.title;
                }
            }).catch(error => {
                view.info.tabs[TRACK_TAB].text=i18n("Failed to retrieve information.");
            });
        }
    } else if (undefined==view.infoTrack.artist && undefined==view.infoTrack.title && undefined==view.infoTrack.track_id && undefined==view.infoTrack.artist_id) {
        view.info.tabs[TRACK_TAB].text=view.infoTrack.empty ? "" : i18n("Insufficient metadata to fetch information.");
    }

    let html="";
    let trk = view.playerStatus.current;
    let useComposerTag = trk.composer && lmsOptions.showComposer && useComposer(trk.genre);
    let useConductorTag = trk.conductor && lmsOptions.showConductor && useConductor(trk.genre);
    let useBandTag = trk.band && lmsOptions.showBand && useBand(trk.genre);

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
    if (undefined!=trk.albumartist) {
        let entry = nowplayingArtistEntry(trk, 'albumartist', 'ALBUMARTIST');
        if (entry.length>1) {
            html+="<tr><td>"+i18n("Album artist")+"&nbsp;</td><td>"+entry+"</td></tr>";
        }
    }
    if (useComposerTag) {
        let entry = nowplayingArtistEntry(trk, 'composer', 'COMPOSER');
        if (entry.length>1) {
            html+="<tr><td>"+i18n("Composer")+"&nbsp;</td><td>"+entry+"</td></tr>";
        }
    }
    if (useConductorTag) {
        let entry = nowplayingArtistEntry(trk, 'conductor', 'CONDUCTOR');
        if (entry.length>1) {
            html+="<tr><td>"+i18n("Conductor")+"&nbsp;</td><td>"+entry+"</td></tr>";
        }
    }
    if (useBandTag) {
        let entry = nowplayingArtistEntry(trk, 'band', 'BAND');
        if (entry.length>1) {
            html+="<tr><td>"+i18n("Band")+"&nbsp;</td><td>"+entry+"</td></tr>";
        }
    }
    if (undefined!=trk.year && trk.year>0) {
        html+="<tr><td>"+i18n("Year")+"&nbsp;</td><td><obj class=\"link-item\" onclick=\"nowplayingBrowse('year', "+trk.year+")\">"+trk.year+"</obj></td></tr>";
    }
    if (undefined!=trk.genres) {
        let genres = [];
        for (let i=0, list = trk.genres.split(", "), len=list.length; i<len; ++i) {
            genres.push("<obj class=\"link-item\" onclick=\"nowplayingBrowse('genre', '-',\'"+escape(list[i])+"\')\">"+list[i]+"</obj>");
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
        html+="<tr><td>"+i18n("Comment")+"&nbsp;</td><td>"+trk.comment+"</td></tr>";
    }

    if (html.length>0) {
        view.info.tabs[TRACK_TAB].sections[0].html = "<table class=\"np-html-sect\">" + html + "</table>";
    } else {
        view.info.tabs[TRACK_TAB].sections[0].html = undefined;
    }
}

function nowPlayingGetArtistAlbums(view, artist_id) {
    lmsList("", ["albums"], ["artist_id:"+artist_id, ALBUM_TAGS, "sort:yearalbum"], 0, NP_MAX_ALBUMS, false, view.info.tabs[ARTIST_TAB].reqId).then(({data}) => {
        logJsonMessage("RESP", data);
        if (data && data.result && view.isCurrent(data, ARTIST_TAB)) {
            view.info.tabs[ARTIST_TAB].sections[0].items = parseBrowseResp(data).items;
            view.info.tabs[ARTIST_TAB].sections[0].title = i18np("1 Album", "%1 Albums", data.result.count);
            if (data.result.count>NP_MAX_ALBUMS) {
                view.info.tabs[ARTIST_TAB].sections[0].more=i18n("+ %1 more", data.result.count-NP_MAX_ALBUMS);
            }
        }
    });
}

function nowplayingFetchArtistInfo(view) {
    if (view.info.tabs[ARTIST_TAB].artist!=view.infoTrack.artist || view.info.tabs[ARTIST_TAB].artist_id!=view.infoTrack.artist_id ||
        (undefined!=view.info.tabs[ARTIST_TAB].artist_ids && undefined!=view.infoTrack.artist_ids && view.info.tabs[ARTIST_TAB].artist_ids.length!=view.infoTrack.artist_ids.length)) {
        view.info.tabs[ARTIST_TAB].sections[0].items=[];
        view.info.tabs[ARTIST_TAB].sections[0].more=undefined;
        view.info.tabs[ARTIST_TAB].sections[1].html=undefined;
        view.info.tabs[ARTIST_TAB].text=i18n("Fetching...");
        view.info.tabs[ARTIST_TAB].image=undefined;
        view.info.tabs[ARTIST_TAB].isMsg=true;
        view.info.tabs[ARTIST_TAB].artist=view.infoTrack.artist;
        view.info.tabs[ARTIST_TAB].artist_id=view.infoTrack.artist_id;
        view.info.tabs[ARTIST_TAB].artist_ids=view.infoTrack.artist_ids;
        view.info.tabs[ARTIST_TAB].albumartist=view.infoTrack.albumartist;
        view.info.tabs[ARTIST_TAB].albumartist_ids=view.infoTrack.albumartist_ids;
        view.info.tabs[ARTIST_TAB].reqId++;
        if (view.info.tabs[ARTIST_TAB].reqId>65535) {
            view.info.tabs[ARTIST_TAB].reqId = 0;
        }
        var ids = view.infoTrack.artist_ids;
        if (undefined!=ids && ids.length>1) {
            view.info.tabs[ARTIST_TAB].first = true;
            view.info.tabs[ARTIST_TAB].found = false;
            view.info.tabs[ARTIST_TAB].count = ids.length;
            for (var i=0, len=ids.length; i<len; ++i) {
                lmsCommand("", ["musicartistinfo", "biography", "artist_id:"+ids[i].trim(), "html:1"], view.info.tabs[ARTIST_TAB].reqId).then(({data}) => {
                    logJsonMessage("RESP", data);
                    if (data && view.isCurrent(data, ARTIST_TAB)) {
                        if (data.result && data.result.biography) {
                            if (data.result.artist) {
                                view.info.tabs[ARTIST_TAB].found = true;
                                if (view.info.tabs[ARTIST_TAB].first) {
                                    view.info.tabs[ARTIST_TAB].text="";
                                    view.info.tabs[ARTIST_TAB].first = false;
                                } else {
                                    view.info.tabs[ARTIST_TAB].text+="<br/><br/>";
                                }
                                view.info.tabs[ARTIST_TAB].text+="<b>"+data.result.artist+"</b><br/>"+replaceNewLines(data.result.biography);
                            }
                        }
                        view.info.tabs[ARTIST_TAB].count--;
                        if (0 == view.info.tabs[ARTIST_TAB].count && !view.info.tabs[ARTIST_TAB].found) {
                            view.info.tabs[ARTIST_TAB].text = view.infoTrack.artist;
                            view.info.tabs[ARTIST_TAB].image="/imageproxy/mai/artist/" + view.infoTrack.artist_ids[0] + "/image" + LMS_CURRENT_IMAGE_SIZE;
                        } else {
                            view.info.tabs[ARTIST_TAB].isMsg=false;
                        }
                    }
                });
            }
        } else {
            var command = ["musicartistinfo", "biography", "html:1"];
            if (view.infoTrack.artist_id!=undefined) {
                command.push("artist_id:"+view.infoTrack.artist_id);
            } else {
                command.push("artist:"+view.infoTrack.artist);
            }
            if (3==command.length) { // No details?
                view.info.tabs[ARTIST_TAB].text=view.infoTrack.empty ? "" : i18n("Insufficient metadata to fetch information.");
            } else {
                lmsCommand("", command, view.info.tabs[ARTIST_TAB].reqId).then(({data}) => {
                    logJsonMessage("RESP", data);
                    if (data && data.result && view.isCurrent(data, ARTIST_TAB) && (data.result.biography || data.result.error)) {
                        // If failed with artist, try albumartist (if view is within artist)
                        if (undefined==data.result.biography && view.info.tabs[ARTIST_TAB].albumartist &&
                            view.info.tabs[ARTIST_TAB].artist!=view.info.tabs[ARTIST_TAB].albumartist &&
                            view.info.tabs[ARTIST_TAB].artist.indexOf(view.info.tabs[ARTIST_TAB].albumartist)>=0) {
                            var command = ["musicartistinfo", "biography", "html:1"];
                            if (view.infoTrack.albumartist_ids!=undefined) {
                                command.push("artist_id:"+view.infoTrack.albumartist_ids[0]);
                            } else if (view.infoTrack.albumartist!=undefined) {
                                command.push("artist:"+view.infoTrack.albumartist);
                            }
                            if (3==command.length) {
                                view.info.tabs[ARTIST_TAB].text=view.infoTrack.artist;
                                view.info.tabs[ARTIST_TAB].isMsg=true;
                            } else {
                                lmsCommand("", command, view.info.tabs[ARTIST_TAB].reqId).then(({data}) => {
                                    logJsonMessage("RESP", data);
                                    if (data && data.result && view.isCurrent(data, ARTIST_TAB)) {
                                        view.info.tabs[ARTIST_TAB].text=data.result.biography ? replaceNewLines(data.result.biography) : view.infoTrack.artist;
                                        view.info.tabs[ARTIST_TAB].image=view.infoTrack.albumartist_ids==undefined ? undefined : ("/imageproxy/mai/artist/" + view.infoTrack.albumartist_ids[0] + "/image" + LMS_CURRENT_IMAGE_SIZE);
                                        view.info.tabs[ARTIST_TAB].isMsg=undefined==data.result.biography;
                                    }
                                }).catch(error => {
                                    view.info.tabs[ARTIST_TAB].text=i18n("Failed to retrieve information.");
                                });
                            }
                        } else {
                            view.info.tabs[ARTIST_TAB].text=data.result.biography ? replaceNewLines(data.result.biography) : view.infoTrack.artist;
                            view.info.tabs[ARTIST_TAB].image=view.infoTrack.artist_ids==undefined ? undefined : ("/imageproxy/mai/artist/" + view.infoTrack.artist_ids[0] + "/image" + LMS_CURRENT_IMAGE_SIZE);
                            view.info.tabs[ARTIST_TAB].isMsg=undefined==data.result.biography;
                        }
                    }
                }).catch(error => {
                    view.info.tabs[ARTIST_TAB].text=i18n("Failed to retrieve information.");
                });
            }
        }

        if (view.infoTrack.artist_id!=undefined && view.infoTrack.artist_id>=0) {
            nowPlayingGetArtistAlbums(view, view.infoTrack.artist_id);
        } else if (view.info.tabs[ARTIST_TAB].albumartist || view.info.tabs[ARTIST_TAB].artist) {
            lmsCommand("", ["material-skin", "map", "artist:"+(view.info.tabs[ARTIST_TAB].albumartist ? view.info.tabs[ARTIST_TAB].albumartist : view.info.tabs[ARTIST_TAB].artist)], view.info.tabs[ARTIST_TAB].reqId).then(({data}) => {
                if (data && data.result && data.result.artist_id && view.isCurrent(data, ARTIST_TAB)) {
                    logJsonMessage("RESP", data);
                    nowPlayingGetArtistAlbums(view, data.result.artist_id);
                }
            });
        }

        if (view.info.tabs[ARTIST_TAB].albumartist || view.info.tabs[ARTIST_TAB].artist) {
            lmsCommand("", ["material-skin", "geturl", "url:"+NP_SIMILAR_URL+encodeURIComponent(view.info.tabs[ARTIST_TAB].artist ? view.info.tabs[ARTIST_TAB].artist : view.info.tabs[ARTIST_TAB].albumartist), "format:json"], view.info.tabs[ARTIST_TAB].reqId).then(({data}) => {
                if (data && data.result && data.result.content) {
                    logJsonMessage("RESP", data);
                    let body = data.result.content;
                    if (body.similarartists && body.similarartists.artist && body.similarartists.artist.length>0) {
                        for (let i=0, loop=body.similarartists.artist, len=loop.length; i<len; ++i) {
                            if (undefined==view.info.tabs[ARTIST_TAB].sections[1].html) {
                                view.info.tabs[ARTIST_TAB].sections[1].html="<p class=\"np-html-sect\">";
                            } else {
                                view.info.tabs[ARTIST_TAB].sections[1].html+=", ";
                            }
                            view.info.tabs[ARTIST_TAB].sections[1].html+="<obj class=\"link-item\" onclick=\"nowplayingSearch(\'"+escape(loop[i].name)+"\')\">" + loop[i].name + "</obj>";
                        }
                        view.info.tabs[ARTIST_TAB].sections[1].html+="</p>";
                    }
                }
            });
        }
    } else if (undefined==view.infoTrack.artist && undefined==view.infoTrack.artist_id && undefined==view.infoTrack.artist_ids) {
        view.info.tabs[ARTIST_TAB].isMsg=true;
        view.info.tabs[ARTIST_TAB].text=view.infoTrack.empty ? "" : i18n("Insufficient metadata to fetch information.");
        view.info.tabs[ARTIST_TAB].sections[0].items=[];
    }
}

function nowplayingFetchAlbumInfo(view) {
    if (view.info.tabs[ALBUM_TAB].albumartist!=view.infoTrack.albumartist || view.info.tabs[ALBUM_TAB].artist_id!=view.infoTrack.artist_id ||
        view.info.tabs[ALBUM_TAB].album!=view.infoTrack.album ||view.info.tabs[ALBUM_TAB].album_id!=view.infoTrack.album_id) {
        view.info.tabs[ALBUM_TAB].sections[0].items=[];
        view.info.tabs[ALBUM_TAB].sections[0].more=undefined;
        view.info.tabs[ALBUM_TAB].text=i18n("Fetching...");
        view.info.tabs[ALBUM_TAB].image=undefined;
        view.info.tabs[ALBUM_TAB].isMsg=true;
        view.info.tabs[ALBUM_TAB].albumartist=view.infoTrack.albumartist;
        view.info.tabs[ALBUM_TAB].artist_id=view.infoTrack.artist_id;
        view.info.tabs[ALBUM_TAB].album=view.infoTrack.album;
        view.info.tabs[ALBUM_TAB].album_id=view.infoTrack.album_id;
        view.info.tabs[ALBUM_TAB].reqId++;
        if (view.info.tabs[ALBUM_TAB].reqId>65535) {
            view.info.tabs[ALBUM_TAB].reqId = 0;
        }
        var command = ["musicartistinfo", "albumreview", "html:1"];
        if (view.infoTrack.album_id!=undefined) {
            command.push("album_id:"+view.infoTrack.album_id);
        } else {
            if (view.infoTrack.album!=undefined) {
                command.push("album:"+view.infoTrack.album);
            }
            if (view.infoTrack.artist_id!=undefined) {
                command.push("artist_id:"+view.infoTrack.artist_id);
            }
            if (view.infoTrack.albumartist!=undefined) {
                command.push("artist:"+view.infoTrack.albumartist);
            } else if (view.infoTrack.artist!=undefined) {
                command.push("artist:"+view.infoTrack.artist);
            }
        }

        if (3==command.length) { // No details?
            view.info.tabs[ALBUM_TAB].text=view.infoTrack.empty ? "" : i18n("Insufficient metadata to fetch information.");
            view.info.tabs[ALBUM_TAB].image=view.infoTrack.empty ? undefined : view.coverUrl;
        } else {
            lmsCommand("", command, view.info.tabs[ALBUM_TAB].reqId).then(({data}) => {
                logJsonMessage("RESP", data);
                if (data && data.result && view.isCurrent(data, ALBUM_TAB)) {
                    view.info.tabs[ALBUM_TAB].text=data.result.albumreview ? replaceNewLines(data.result.albumreview) : view.infoTrack.album;
                    view.info.tabs[ALBUM_TAB].image=/*data.result.albumreview ? undefined :*/ view.coverUrl;
                    view.info.tabs[ALBUM_TAB].isMsg=undefined==data.result.albumreview;
                }
            }).catch(error => {
                view.info.tabs[ALBUM_TAB].text=i18n("Failed to retrieve information.");
            });
        }
        if (view.infoTrack.album_id!=undefined && view.infoTrack.album_id>=0) {
            lmsList("", ["tracks"], ["album_id:"+view.infoTrack.album_id, trackTags()+(view.$store.state.showRating ? "R" : ""), "sort:tracknum"], 0, 1000, false, view.info.tabs[ALBUM_TAB].reqId).then(({data}) => {
                logJsonMessage("RESP", data);
                if (data && data.result && view.isCurrent(data, ALBUM_TAB)) {
                    var resp = parseBrowseResp(data);
                    view.info.tabs[ALBUM_TAB].sections[0].items = resp.items.slice(0, NP_MAX_TRACKS);
                    view.info.tabs[ALBUM_TAB].sections[0].title = resp.plainsubtitle;
                    let count = view.info.tabs[ALBUM_TAB].sections[0].items.length;
                    // If last shown is a header, remove
                    if (view.info.tabs[ALBUM_TAB].sections[0].items[count-1].header) {
                        view.info.tabs[ALBUM_TAB].sections[0].items.pop();
                        count--;
                    }
                    if (data.result.count>count) {
                        view.info.tabs[ALBUM_TAB].sections[0].more=i18n("+ %1 more", data.result.count-count);
                    }
                }
            });
        }
    } else if (undefined==view.infoTrack.albumartist && undefined==view.infoTrack.artist_id &&
               undefined==view.infoTrack.album && undefined==view.infoTrack.album) {
        view.info.tabs[ALBUM_TAB].isMsg=true;
        view.info.tabs[ALBUM_TAB].text=view.infoTrack.empty ? "" : i18n("Insufficient metadata to fetch information.");
        view.info.tabs[ALBUM_TAB].image=/*view.infoTrack.empty ? undefined :*/ view.coverUrl;
        view.info.tabs[ALBUM_TAB].sections[0].items=[];
    }
}

function nowplayingItemClicked(view, tab, section, index, event) {
    if (view.info.tabs[tab].sections[section].items[index].header) {
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
        bus.$emit("browse", ["albums"], ["artist_id:"+view.infoTrack.artist_id, ALBUM_TAGS, "sort:yearalbum"], unescape(view.infoTrack.artist), NP_INFO);
        view.info.show=false;
    } else if (ALBUM_TAB==tab && 0==section) {
        bus.$emit("browse", ["tracks"], ["album_id:"+view.infoTrack.album_id, trackTags(), "sort:tracknum"], unescape(view.infoTrack.album), NP_INFO);
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

function nowplayingBrowse(cat, param, title) {
    let cmd=undefined;
    let params=undefined;
    if ('year'==cat) {
        bus.$emit("browse", cat, param, ""+param, NP_INFO);
        bus.$emit('npclose');
    } else if ('genre'==cat) {
        let name = unescape(title);
        if (isNaN(param)) {
            lmsCommand("", ["material-skin", "map", "genre:"+name]).then(({data}) => {
                if (data && data.result && data.result.genre_id) {
                    logJsonMessage("RESP", data);
                    bus.$emit("browse", cat, data.result.genre_id, name, NP_INFO);
                    bus.$emit('npclose');
                } else {
                    bus.$emit('showError', undefined, i18n("Unknown genre"));
                }
            }).catch(error => {
                bus.$emit('showError', undefined, i18n("Unknown genre"));
            });
        } else {
            bus.$emit("browse", cat, param, name, NP_INFO);
            bus.$emit('npclose');
        }
    } else {
        cmd=["albums"];
        params=["artist_id:"+param, ARTIST_ALBUM_TAGS, SORT_KEY+ARTIST_ALBUM_SORT_PLACEHOLDER];
        if (cat!='ARTIST') {
            params.push("role_id:"+cat);
        }
        bus.$emit("browse", cmd, params, unescape(title), NP_INFO);
        bus.$emit('npclose');
    }
}
