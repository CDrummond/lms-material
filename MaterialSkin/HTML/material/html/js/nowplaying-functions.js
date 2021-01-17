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
        view.playerStatus.current.artist_id!=artist_id ||
        view.playerStatus.current.artist_ids!=artist_ids) {
        view.playerStatus.current.artist = artist;
        view.playerStatus.current.artist_id = artist_id;
        view.playerStatus.current.artist_ids = artist_ids;
        trackChanged = true;
    }
    var albumartist = playerStatus.current.albumartist ? playerStatus.current.albumartist : playerStatus.current.band;
    var albumartist_ids = playerStatus.current.albumartist_ids ? playerStatus.current.albumartist_ids : playerStatus.current.band_ids;
    if (albumartist!=view.playerStatus.current.albumartist || albumartist_ids!=view.playerStatus.current.albumartist_ids) {
        view.playerStatus.current.albumartist = albumartist;
        view.playerStatus.current.albumartist_ids = albumartist_ids;
        trackChanged = true;
    }
    if (playerStatus.current.album!=view.playerStatus.current.albumName ||
        playerStatus.current.album_id!=view.playerStatus.current.album_id) {
        view.playerStatus.current.albumName = playerStatus.current.album;
        view.playerStatus.current.album_id = playerStatus.current.album_id;
        if (playerStatus.current.year && playerStatus.current.year>0) {
            view.playerStatus.current.album = view.playerStatus.current.albumName+" ("+ playerStatus.current.year+")";
        } else {
            view.playerStatus.current.album = view.playerStatus.current.albumName;
        }
        trackChanged = true;
    }
    if (playerStatus.current.remote_title!=view.playerStatus.current.remote_title) {
        view.playerStatus.current.remote_title = playerStatus.current.remote_title;
        trackChanged = true;
    }
    let rv = undefined==playerStatus.current.rating ? 0 : (Math.ceil(playerStatus.current.rating/10.0)/2.0);
    if (playerStatus.current.rating!=view.rating.setting || view.rating.value!=rv) {
        view.rating.setting = playerStatus.current.rating;
        view.rating.value = rv;
        trackChanged = true;
    }
    var artistAndComposer = lmsOptions.showAllArtists && undefined!=artists ? artists.join(", ") : artists;
    var useComposerTag = playerStatus.current.composer && lmsOptions.showComposer && useComposer(playerStatus.current.genre);
    var useConductorTag = playerStatus.current.conductor && lmsOptions.showConductor && useConductor(playerStatus.current.genre);
    var useBandTag = playerStatus.current.band && lmsOptions.showBand && useBand(playerStatus.current.genre);

    if (useBandTag && playerStatus.current.band!=view.playerStatus.current.artist && playerStatus.current.band!=view.playerStatus.current.composer) {
        artistAndComposer = addPart(artistAndComposer, lmsOptions.showAllArtists && undefined!=playerStatus.current.bands ? playerStatus.current.bands.join(", ") : playerStatus.current.bands);
    }
    if (useComposerTag && playerStatus.current.composer!=view.playerStatus.current.artist) {
        artistAndComposer = addPart(artistAndComposer, lmsOptions.showAllArtists && undefined!=playerStatus.current.composers ? playerStatus.current.composers.join(", ") : playerStatus.current.composers);
    }
    if (useConductorTag && playerStatus.current.conductor!=view.playerStatus.current.artist) {
        artistAndComposer = addPart(artistAndComposer, lmsOptions.showAllArtists && undefined!=playerStatus.current.conductors ? playerStatus.current.conductors.join(", ") : playerStatus.current.conductors);
    }
    if (playerStatus.current.composer!=view.playerStatus.current.composer) {
        view.playerStatus.current.composer = playerStatus.current.composer;
    }
    if (playerStatus.current.band!=view.playerStatus.current.band) {
        view.playerStatus.current.band = playerStatus.current.band;
    }
    let composer_id = useComposer
                        ? playerStatus.current.composer_id
                            ? playerStatus.current.composer_id
                            : playerStatus.current.composer_ids
                                ? playerStatus.current.composer_ids[0]
                                : undefined
                        : undefined;
    if (composer_id!=view.playerStatus.current.composer_id) {
        view.playerStatus.current.composer_id = composer_id;
    }
    let conductor_id = useConductor
                        ? playerStatus.current.conductor_id
                            ? playerStatus.current.conductor_id
                            : playerStatus.current.conductor_ids
                                ? playerStatus.current.conductor_ids[0]
                                : undefined
                        : undefined;
    if (composer_id!=view.playerStatus.current.composer_id) {
        view.playerStatus.current.composer_id = composer_id;
    }
    let band_id = useBand
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
    if (artistAndComposer!=view.playerStatus.current.artistAndComposer) {
        view.playerStatus.current.artistAndComposer = artistAndComposer;
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
    var technical = formatTechInfo(playerStatus.current);
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
                          icon:sb.jiveStyle == "thumbsDown" ? "thumb_down" : sb.jiveStyle == "thumbsUp" ? "thumb_up" : undefined};
    } else if (view.shuffAltBtn.show) {
        view.shuffAltBtn.show=false;
    }
    if (rb && rb.command) {
        view.repAltBtn={show:true, command:rb.command, tooltip:rb.tooltip, image:rb.icon,
                        icon:rb.jiveStyle == "thumbsDown" ? "thumb_down" : rb.jiveStyle == "thumbsUp" ? "thumb_up" : undefined};
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
                view.menu.items.push({title:i18n("Go to conductor"), act:NP_BROWSE_CMD, cmd:{command:["albums"], params:["artist_id:"+view.playerStatus.current.composer_id, ARTIST_ALBUM_TAGS, SORT_KEY+ARTIST_ALBUM_SORT_PLACEHOLDER, "role_id:CONDUCTOR"], title:view.playerStatus.current.composer}, svg:"conductor"});
            }
            if (view.playerStatus.current.band && view.playerStatus.current.band_id && useBand(view.playerStatus.current.genre)) {
                view.menu.items.push({title:i18n("Go to band"), act:NP_BROWSE_CMD, cmd:{command:["albums"], params:["artist_id:"+view.playerStatus.current.band_id, ARTIST_ALBUM_TAGS, SORT_KEY+ARTIST_ALBUM_SORT_PLACEHOLDER, "role_id:BAND"], title:view.playerStatus.current.band}, svg:"trumpet"});
            }
            if (view.playerStatus.current.album_id && view.playerStatus.current.album) {
                view.menu.items.push({title:ACTIONS[GOTO_ALBUM_ACTION].title, act:NP_BROWSE_CMD, cmd:{command:["tracks"], params:["album_id:"+view.playerStatus.current.album_id, TRACK_TAGS, SORT_KEY+"tracknum"], title:view.playerStatus.current.album}, icon:ACTIONS[GOTO_ALBUM_ACTION].icon});
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
        view.info.show=false;
        view.largeView=false;
        bus.$emit("browse", item.cmd.command, item.cmd.params, item.cmd.title, 'now-playing');
    } else if (NP_COPY_DETAILS_CMD==item.act) {
        if (undefined!=view.playerStatus.current.title && undefined!=view.playerStatus.current.artist && undefined!=view.playerStatus.current.album) {
            copyTextToClipboard(i18n("Playing %1 by %2 from %3", view.playerStatus.current.title, view.playerStatus.current.artist, view.playerStatus.current.album));
        } else if (undefined!=view.playerStatus.current.title && undefined!=view.playerStatus.current.artist) {
            copyTextToClipboard(i18n("Playing %1 by %2", view.playerStatus.current.title, view.playerStatus.current.artist));
        } else {
            copyTextToClipboard(i18n("Playing %1", view.playerStatus.current.title));
        }
    } else if (FOLLOW_LINK_ACTION==item.act) {
        openWindow(item.link);
    } else if (SEARCH_TEXT_ACTION==item.act) {
        bus.$emit('browse-search', item.text, 'now-playing');
        view.info.show=false;
        view.largeView=false;
    } else if (view.customActions && item.act>=NP_CUSTOM) {
        let ca = item.act-NP_CUSTOM;
        if (ca>=0 && ca<view.customActions.length) {
            performCustomAction(view, view.customActions[ca], view.$store.state.player, view.playerStatus.current);
        }
    }
}

function nowplayingFetchLyrics(view) {
    if (view.info.tabs[LYRICS_TAB].artist!=view.infoTrack.artist || view.info.tabs[LYRICS_TAB].songtitle!=view.infoTrack.title ||
        view.info.tabs[LYRICS_TAB].track_id!=view.infoTrack.track_id || view.info.tabs[LYRICS_TAB].artist_id!=view.infoTrack.artist_id) {
        view.info.tabs[LYRICS_TAB].text=i18n("Fetching...");
        view.info.tabs[LYRICS_TAB].track_id=view.infoTrack.track_id;
        view.info.tabs[LYRICS_TAB].artist=view.infoTrack.artist;
        view.info.tabs[LYRICS_TAB].artist_id=view.infoTrack.artist_id;
        view.info.tabs[LYRICS_TAB].songtitle=view.infoTrack.title;
        view.info.tabs[LYRICS_TAB].reqId++;
        if (view.info.tabs[LYRICS_TAB].reqId>65535) {
            view.info.tabs[LYRICS_TAB].reqId = 0;
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
            view.info.tabs[LYRICS_TAB].text=view.infoTrack.empty ? "" : i18n("Insufficient metadata to fetch information.");
        } else {
            lmsCommand("", command, view.info.tabs[LYRICS_TAB].reqId).then(({data}) => {
                logJsonMessage("RESP", data);
                if (data && data.result && view.isCurrent(data, LYRICS_TAB) && (data.result.lyrics || data.result.error)) {
                    view.info.tabs[LYRICS_TAB].text=data.result.lyrics ? replaceNewLines(data.result.lyrics) : data.result.error;
                }
            }).catch(error => {
                view.info.tabs[LYRICS_TAB].text=i18n("Failed to retreive information.");
            });
        }
    } else if (undefined==view.infoTrack.artist && undefined==view.infoTrack.title && undefined==view.infoTrack.track_id && undefined==view.infoTrack.artist_id) {
        view.info.tabs[LYRICS_TAB].text=view.infoTrack.empty ? "" : i18n("Insufficient metadata to fetch information.");
    }
}

function nowplayingFetchBio(view) {
    if (view.info.tabs[BIO_TAB].artist!=view.infoTrack.artist || view.info.tabs[BIO_TAB].artist_id!=view.infoTrack.artist_id ||
        view.info.tabs[BIO_TAB].artist_ids!=view.infoTrack.artist_ids) {
        view.info.tabs[BIO_TAB].text=i18n("Fetching...");
        view.info.tabs[BIO_TAB].isMsg=true;
        view.info.tabs[BIO_TAB].artist=view.infoTrack.artist;
        view.info.tabs[BIO_TAB].artist_id=view.infoTrack.artist_id;
        view.info.tabs[BIO_TAB].artist_ids=view.infoTrack.artist_ids;
        view.info.tabs[BIO_TAB].albumartist=view.infoTrack.albumartist;
        view.info.tabs[BIO_TAB].albumartist_ids=view.infoTrack.albumartist_ids;
        view.info.tabs[BIO_TAB].reqId++;
        if (view.info.tabs[BIO_TAB].reqId>65535) {
            view.info.tabs[BIO_TAB].reqId = 0;
        }
        var ids = view.infoTrack.artist_ids ? view.infoTrack.artist_ids.split(",") : [];
        if (ids.length>1) {
            view.info.tabs[BIO_TAB].first = true;
            view.info.tabs[BIO_TAB].found = false;
            view.info.tabs[BIO_TAB].count = ids.length;
            for (var i=0, len=ids.length; i<len; ++i) {
                lmsCommand("", ["musicartistinfo", "biography", "artist_id:"+ids[i].trim(), "html:1"], view.info.tabs[BIO_TAB].reqId).then(({data}) => {
                    logJsonMessage("RESP", data);
                    if (data && view.isCurrent(data, BIO_TAB)) {
                        if (data.result && (data.result.biography || data.result.error)) {
                            if (data.result.artist) {
                                view.info.tabs[BIO_TAB].found = true;
                                if (view.info.tabs[BIO_TAB].first) {
                                    view.info.tabs[BIO_TAB].text="";
                                    view.info.tabs[BIO_TAB].first = false;
                                } else {
                                    view.info.tabs[BIO_TAB].text+="<br/><br/>";
                                }
                                view.info.tabs[BIO_TAB].text+="<b>"+data.result.artist+"</b><br/>"+(data.result.biography ? replaceNewLines(data.result.biography) : data.result.error);
                            }
                        }
                        view.info.tabs[BIO_TAB].count--;
                        if (0 == view.info.tabs[BIO_TAB].count && !view.info.tabs[BIO_TAB].found) {
                            view.info.tabs[BIO_TAB].text = i18n("No artist found");
                        } else {
                            view.info.tabs[BIO_TAB].isMsg=false;
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
                view.info.tabs[BIO_TAB].text=view.infoTrack.empty ? "" : i18n("Insufficient metadata to fetch information.");
            } else {
                lmsCommand("", command, view.info.tabs[BIO_TAB].reqId).then(({data}) => {
                    logJsonMessage("RESP", data);
                    if (data && data.result && view.isCurrent(data, BIO_TAB) && (data.result.biography || data.result.error)) {
                        // If failt with artist, try albumartist (if view is within artist)
                        if (undefined==data.result.biography && view.info.tabs[BIO_TAB].albumartist &&
                            view.info.tabs[BIO_TAB].artist.indexOf(view.info.tabs[BIO_TAB].albumartist)>=0) {
                            var command = ["musicartistinfo", "biography", "html:1"];
                            if (view.infoTrack.albumartist_ids!=undefined) {
                                command.push("artist_id:"+view.infoTrack.albumartist_ids.split(", ")[0].trim());
                            } else if (view.infoTrack.albumartist!=undefined) {
                                command.push("artist:"+view.infoTrack.albumartist);
                            }
                            if (3==command.length) {
                                view.info.tabs[BIO_TAB].text=data.result.error;
                                view.info.tabs[BIO_TAB].isMsg=true;
                            } else {
                                lmsCommand("", command, view.info.tabs[BIO_TAB].reqId).then(({data}) => {
                                    logJsonMessage("RESP", data);
                                    if (data && data.result && view.isCurrent(data, BIO_TAB) && (data.result.biography || data.result.error)) {
                                        view.info.tabs[BIO_TAB].text=data.result.biography ? replaceNewLines(data.result.biography) : data.result.error;
                                        view.info.tabs[BIO_TAB].isMsg=undefined==data.result.biography;
                                    }
                                }).catch(error => {
                                    view.info.tabs[BIO_TAB].text=i18n("Failed to retreive information.");
                                });
                            }
                        } else {
                            view.info.tabs[BIO_TAB].text=data.result.biography ? replaceNewLines(data.result.biography) : data.result.error;
                            view.info.tabs[BIO_TAB].isMsg=undefined==data.result.biography;
                        }
                    }
                }).catch(error => {
                    view.info.tabs[BIO_TAB].text=i18n("Failed to retreive information.");
                });
            }
        }
    } else if (undefined==view.infoTrack.artist && undefined==view.infoTrack.artist_id && undefined==view.infoTrack.artist_ids) {
        view.info.tabs[BIO_TAB].isMsg=true;
        view.info.tabs[BIO_TAB].text=view.infoTrack.empty ? "" : i18n("Insufficient metadata to fetch information.");
    }
}

function nowplayingFetchReview(view) {
    if (view.info.tabs[REVIEW_TAB].albumartist!=view.infoTrack.albumartist || view.info.tabs[REVIEW_TAB].albumartist_ids!=view.infoTrack.albumartist_ids ||
        view.info.tabs[REVIEW_TAB].artist_id!=view.infoTrack.artist_id || view.info.tabs[REVIEW_TAB].album!=view.infoTrack.album ||
        view.info.tabs[REVIEW_TAB].album_id!=view.infoTrack.album_id) {
        view.info.tabs[REVIEW_TAB].text=i18n("Fetching...");
        view.info.tabs[REVIEW_TAB].isMsg=true;
        view.info.tabs[REVIEW_TAB].albumartist=view.infoTrack.albumartist;
        view.info.tabs[REVIEW_TAB].albumartist_ids=view.infoTrack.albumartist_ids;
        view.info.tabs[REVIEW_TAB].artist_id=view.infoTrack.artist_id;
        view.info.tabs[REVIEW_TAB].album=view.infoTrack.album;
        view.info.tabs[REVIEW_TAB].album_id=view.infoTrack.album_id;
        view.info.tabs[REVIEW_TAB].reqId++;
        if (view.info.tabs[REVIEW_TAB].reqId>65535) {
            view.info.tabs[REVIEW_TAB].reqId = 0;
        }
        var command = ["musicartistinfo", "albumreview", "html:1"];
        if (view.infoTrack.album_id!=undefined) {
            command.push("album_id:"+view.infoTrack.album_id);
        } else {
            if (view.infoTrack.album!=undefined) {
                command.push("album:"+view.infoTrack.album);
            }
            if (view.infoTrack.albumartist_ids!=undefined) {
                command.push("artist_id:"+view.infoTrack.albumartist_ids.split(", ")[0].trim());
            } else if (view.infoTrack.artist_id!=undefined) {
                command.push("artist_id:"+view.infoTrack.artist_id);
            }
            if (view.infoTrack.albumartist!=undefined) {
                command.push("artist:"+view.infoTrack.albumartist);
            } else if (view.infoTrack.artist!=undefined) {
                command.push("artist:"+view.infoTrack.artist);
            }
        }

        if (3==command.length) { // No details?
            view.info.tabs[REVIEW_TAB].text=view.infoTrack.empty ? "" : i18n("Insufficient metadata to fetch information.");
        } else {
            lmsCommand("", command, view.info.tabs[REVIEW_TAB].reqId).then(({data}) => {
                logJsonMessage("RESP", data);
                if (data && data.result && view.isCurrent(data, REVIEW_TAB) && (data.result.albumreview || data.result.error)) {
                    view.info.tabs[REVIEW_TAB].text=data.result.albumreview ? replaceNewLines(data.result.albumreview) : data.result.error;
                    view.info.tabs[REVIEW_TAB].isMsg=undefined==data.result.albumreview;
                }
            }).catch(error => {
                view.info.tabs[REVIEW_TAB].text=i18n("Failed to retreive information.");
            });
        }
    } else if (undefined==view.infoTrack.albumartist && undefined==view.infoTrack.albumartist_ids && undefined==view.infoTrack.artist_id &&
               undefined==view.infoTrack.album && undefined==view.infoTrack.album) {
        view.info.tabs[REVIEW_TAB].isMsg=true;
        view.info.tabs[REVIEW_TAB].text=view.infoTrack.empty ? "" : i18n("Insufficient metadata to fetch information.");
    }
}
