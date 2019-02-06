/**
 * LMS-Material
 *
 * Copyright (c) 2018-2019 Craig Drummond <craig.p.drummond@gmail.com>
 * MIT license.
 */

const MORE_COMMANDS = new Set(["item_add", "item_insert", "itemplay", "item_fav"]);

function parseBrowseResp(data, parent, options, idStart, cacheKey) {
    var resp = {items: [], baseActions:[], useGrid: false, total: 0 };

    try {
    if (data && data.result) {
        resp.total = data.result.count;
        //console.log("RESP", JSON.stringify(data.result, null, 2), parent);
        if (parent.id && TOP_SEARCH_ID===parent.id) {
            if (data.result.contributors_loop && data.result.contributors_count>0) {
                resp.items.push({header: i18n("Artists")});
                data.result.contributors_loop.forEach(i => {
                    var infoPlugin = getLocalStorageBool('infoPlugin');
                    resp.items.push({
                                  id: "artist_id:"+i.contributor_id,
                                  title: i.contributor,
                                  command: ["albums"],
                                  params: ["artist_id:"+ i.contributor_id, ALBUM_TAGS, "sort:"+ARTIST_ALBUM_SORT_PLACEHOLDER],
                                  image: (infoPlugin && options.artistImages) ? lmsServerAddress+"/imageproxy/mai/artist/" + i.contributor_id + "/image" + LMS_LIST_IMAGE_SIZE : undefined,
                                  //icon: options.artistImages ? undefined : "person",
                                  menuActions: [PLAY_ACTION, INSERT_ACTION, ADD_ACTION, ADD_RANDOM_ALBUM_ACTION, DIVIDER, ADD_TO_FAV_ACTION, SELECT_ACTION, MORE_LIB_ACTION],
                                  type: "group",
                                  favIcon: (infoPlugin && options.artistImages) ? "imageproxy/mai/artist/"+i.contributor_id+"/image.png" : undefined
                              });
                });
            }
            if (data.result.albums_loop && data.result.albums_count>0) {
                resp.items.push({header: i18n("Albums")});
                data.result.albums_loop.forEach(i => {
                    resp.items.push({
                                  id: "album_id:"+i.album_id,
                                  title: i.album,
                                  command: ["tracks"],
                                  params: ["album_id:"+ i.album_id, TRACK_TAGS, "sort:tracknum"],
                                  image: lmsServerAddress+"/music/" + i.artwork + "/cover" + LMS_LIST_IMAGE_SIZE,
                                  menuActions: [PLAY_ACTION, INSERT_ACTION, ADD_ACTION, DIVIDER, ADD_TO_FAV_ACTION, SELECT_ACTION, MORE_LIB_ACTION],
                                  type: "group",
                                  favIcon: i.artwork_track_id ? "music/"+i.artwork_track_id+"/cover" : undefined
                              });
                });
            }
            if (data.result.tracks_loop && data.result.tracks_count>0) {
                if (idStart<=0 || (data.result.contributors_loop && data.result.contributors_count>0) || (data.result.albums_loop && data.result.albums_count>0)) {
                    resp.items.push({header: i18n("Tracks")});
                }
                data.result.tracks_loop.forEach(i => {
                    resp.items.push({
                                  id: "track_id:"+i.track_id,
                                  title: i.track,
                                  image: lmsServerAddress+"/music/" + i.coverid + "/cover" +LMS_LIST_IMAGE_SIZE,
                                  menuActions: [PLAY_ACTION, INSERT_ACTION, ADD_ACTION, DIVIDER, SELECT_ACTION, MORE_LIB_ACTION],
                                  type: "track"
                              });
                });
            }
            if (data.result.genres_loop && data.result.genres_count>0) {
                resp.items.push({header: i18n("Genres")});
                data.result.genres_loop.forEach(i => {
                    resp.items.push({
                                  id: "genre_id:"+i.genre_id,
                                  title: i.genre,
                                  command: ["artists"],
                                  params: ["genre_id:"+ i.genre_id],
                                  //icon: "label",
                                  menuActions: [PLAY_ACTION, INSERT_ACTION, ADD_ACTION, ADD_RANDOM_ALBUM_ACTION, DIVIDER, ADD_TO_FAV_ACTION, SELECT_ACTION, MORE_LIB_ACTION],
                                  type: "group"
                              });
                });
            }
        } else if (data.result.indexList) {
            var start=0;
            var isArtists = data.result.artists_loop;

            // Look for first valid key? Looks like 'No Album' messes up album txtkeys? First 2 seem to be garbage...
            if (data.result.artists_loop) {
                for (var i=0; i<data.result.artists_loop.length; ++i) {
                    if (data.result.artists_loop[i].textkey!=null && data.result.artists_loop[i].textkey!=undefined && data.result.artists_loop[i].textkey.length>0) {
                        start = i;
                        break;
                    }
                }
            } else if (data.result.albums_loop) {
                for (var i=0; i<data.result.albums_loop.length; ++i) {
                    if (data.result.albums_loop[i].textkey!=null && data.result.albums_loop[i].textkey!=undefined && data.result.albums_loop[i].textkey.length>0) {
                        start = i;
                        break;
                    }
                }
            }

            var prevItem = undefined;

            for (var i=start; i<data.result.indexList.length; ++i) {
                var name = data.result.indexList[i][0];
                if (name == null) {
                    name = "?";
                }
                var count = data.result.indexList[i][1];

                // If we have more than max items in this 1 group, then split
                if (count>=LMS_AZ_MAX_PER_LETTER) {
                    if (prevItem) {
                        if (undefined!==prevItem.subtitle && prevItem.subtitle!=prevItem.title) {
                            prevItem.title += " .. " + prevItem.subtitle;
                        }
                        prevItem.subtitle = isArtists
                                                ? i18np("1 Artist", "%1 Artists", prevItem.range.count)
                                                : i18np("1 Album", "%1 Albums", prevItem.range.count);
                        resp.items.push(prevItem);
                        prevItem = undefined;
                    }

                    for (var c=0; c<count; c+=LMS_AZ_MAX_PER_LETTER) {
                        var total=c+LMS_AZ_MAX_PER_LETTER>count ? (count-c) : LMS_AZ_MAX_PER_LETTER;
                        resp.items.push({
                                            title: name+" ("+(c+1)+".."+(c+total)+")",
                                            subtitle: isArtists
                                                ? i18np("1 Artist", "%1 Artists", total)
                                                : i18np("1 Album", "%1 Albums", total),
                                            range: {start: start+c, count: total},
                                            type: "group",
                                            command: parent.command,
                                            params: parent.params
                                        });
                    }
                    start += count;
                    continue;
                }

                var item = {
                                title: name,
                                range: {start: start, count: count},
                                type: "group",
                                command: parent.command,
                                params: parent.params
                            };

                if (prevItem) {
                    if (prevItem.range.count>1 && (prevItem.range.count + count > LMS_AZ_MAX_SIZE)) {
                        if (undefined!==prevItem.subtitle && prevItem.subtitle!=prevItem.title) {
                            prevItem.title += " .. " + prevItem.subtitle;
                        }
                        prevItem.subtitle = isArtists
                                                ? i18np("1 Artist", "%1 Artists", prevItem.range.count)
                                                : i18np("1 Album", "%1 Albums", prevItem.range.count);
                        if (prevItem.range.count>=LMS_BATCH_SIZE) {
                            prevItem.cancache = true;
                        }
                        resp.items.push(prevItem);
                        prevItem = item;
                    } else {
                        prevItem.subtitle = name;
                        prevItem.range.count += count;
                    }
                } else if (item.range.count >= LMS_AZ_MAX_SIZE) {
                    item.subtitle = isArtists
                                        ? i18np("1 Artist", "%1 Artists", count)
                                        : i18np("1 Album", "%1 Albums", count);
                    if (count>=LMS_BATCH_SIZE) {
                        item.cancache = true;
                    }
                    resp.items.push(item);
                } else {
                    prevItem = item;
                    prevItem.subtitle = name;
                }
                start += count;
            }
            if (prevItem) {
                if (undefined!==prevItem.subtitle && prevItem.subtitle!=prevItem.title) {
                    prevItem.title += " .. " + prevItem.subtitle;
                }
                prevItem.subtitle = isArtists
                                        ? i18np("1 Artist", "%1 Artists", prevItem.range.count)
                                        : i18np("1 Album", "%1 Albums", prevItem.range.count);
                if (prevItem.range.count>=LMS_BATCH_SIZE) {
                    prevItem.cancache = true;
                }
                resp.items.push(prevItem);
            }

            resp.total=resp.items.length;
            resp.subtitle=i18np("1 Category", "%1 Categories", resp.total);
        } else if (data.result.item_loop) {  // SlimBrowse response
            var playAction = false;
            var addAction = false;
            var insertAction = false;
            var moreAction = false;
            var isFavorites = parent && parent.section == SECTION_FAVORITES;
            var isPlaylists = parent && parent.id == TOP_PLAYLISTS_ID;
            var isRadios = parent && parent.section == SECTION_RADIO;
            var isApps = parent && parent.id == TOP_APPS_ID;
            var haveWithIcons = false;
            var haveWithoutIcons = false;
            // Create a unique ID for favorites each time it is listed. When list is re-ordered via d'n'd we
            // need different IDs for the re-ordered items so that the correct cover is shown.
            var uniqueness = isFavorites ? new Date().getTime().toString(16) : undefined;

            resp.useGrid = options.useGrid && data.result.window && data.result.window.windowStyle && data.result.window.windowStyle=="icon_list";

            if (data.result.base && data.result.base.actions) {
                resp.baseActions = data.result.base.actions;
                playAction = undefined != resp.baseActions[PLAY_ACTION.cmd];
                addAction = undefined != resp.baseActions[ADD_ACTION.cmd];
                insertAction = undefined != resp.baseActions[INSERT_ACTION.cmd];
                moreAction = undefined!=resp.baseActions[MORE_ACTION.cmd];
                if (resp.useGrid && parent && parent.actions && parent.actions.go && parent.actions.go.cmd &&
                    parent.actions.go.cmd[0] == "playhistory") {
                    resp.useGrid = false;
                }
            }

            data.result.item_loop.forEach(i => {
                if (!i.text || i.showBigArtwork==1) {
                    resp.total--;
                    return;
                }
                var addedPlayAction = false;

                if ("text"==i.type) {
                    // Exclude 'More' Play,Insert,Fav commands
                    if (i.style && MORE_COMMANDS.has(i.style)) {
                        resp.total--;
                        return;
                    }
                    i.title = replaceNewLines(i.text);
                } else {
                    var text = i.text.split(/\r?\n/);
                    i.title = text[0];
                    if (text.length>1) {
                        i.subtitle = text[1];
                    } else {
                        i.title=i.text;
                    }
                }

                if (!i.type && !i.style && i.actions && i.actions.go && i.actions.go.params) {
                    for (var key in i.actions.go.params) {
                        if (i.actions.go.params[key]==TERM_PLACEHOLDER) {
                            i.type = "entry";
                            resp.useGrid = false;
                        }
                    }
                }

                // Issue #58 Pretend 'text' with a go action is just a text line, so that click() works
                if (undefined==i.type && !i.style && i.actions && i.actions.go && !i.icon && !i["icon-id"] && !i.image && !i.window &&
                    (!i.addAction || i.actions.go.nextWindow)) {
                    i.type="text";
                }

                i.text = undefined;
                i.image = resolveImage(i.icon ? i.icon : i["icon-id"], undefined, resp.useGrid ? LMS_GRID_IMAGE_SIZE : LMS_LIST_IMAGE_SIZE);

                if (!i.image && i.commonParams && i.commonParams.album_id) {
                    i.image = resolveImage("music/0/cover" + (resp.useGrid ? LMS_GRID_IMAGE_SIZE : LMS_LIST_IMAGE_SIZE));
                }

                if (i.image) {
                    haveWithIcons = true;
                } else {
                    haveWithoutIcons = true;
                }
                i.menuActions=[];
                if (i.type=="playlist" || i.type=="audio" || i.style=="itemplay" || (i.goAction && (i.goAction == "playControl" || i.goAction == "play"))) {
                    // Convert NUM. TITLE into 0NUM TITLE - e.g 1. Wibble => 01 Wibble
                    if (/^[0-9]+\.\s.+/.test(i.title)) {
                        var dot = i.title.indexOf('.');
                        var num = parseInt(i.title.substring(0, dot));
                        var text = i.title.substring(dot+2, i.title.length);
                        i.title = (num>9 ? num : ("0" + num))+" "+text;
                    }

                    if (i.params && i.params.item_id) {
                        if (playAction) {
                            i.menuActions.push(PLAY_ACTION);
                            addedPlayAction = true;
                        }
                        if (insertAction) {
                            i.menuActions.push(INSERT_ACTION);
                            addedPlayAction = true;
                        }
                        if (addAction) {
                            i.menuActions.push(ADD_ACTION);
                            addedPlayAction = true;
                        }
                    }
                }
                var addedDivider = false;
                if (isFavorites) {
                    if (i.menuActions.length>0) {
                        i.menuActions.push(DIVIDER);
                        addedDivider = true;
                    }
                    i.menuActions.push(REMOVE_FROM_FAV_ACTION);
                    if (!i.type) {
                        i.isFavFolder = true;
                    }
                    i.menuActions.push(i.isFavFolder ? RENAME_FAV_ACTION : EDIT_FAV_ACTION);
                    // Only allow drag'n'drop of top-level favorites items.
                    i.canDrag = parent && parent.id==TOP_FAVORITES_ID && !options.sortFavorites;
                } else if (i.presetParams) {
                    if (i.menuActions.length>0) {
                        i.menuActions.push(DIVIDER);
                        addedDivider = true;
                    }
                    i.menuActions.push(ADD_TO_FAV_ACTION);
                }

                if (addedPlayAction) {
                    if (!addedDivider) {
                        i.menuActions.push(DIVIDER);
                        addedDivider = true;
                    }
                    i.menuActions.push(SELECT_ACTION);
                }

                if (isPlaylists) {
                    if (!addedDivider && i.menuActions.length>0) {
                        i.menuActions.push(DIVIDER);
                        addedDivider = true;
                    }
                    i.menuActions.push(RENAME_PL_ACTION);
                    i.menuActions.push(DELETE_ACTION);
                }

                if (!i.type && i.actions && i.actions.go && i.actions.go.cmd) {
                    i.actions.go.cmd.forEach(a => {
                        if ("search" == a) {
                            i.type = "search";
                            resp.useGrid = false;
                            return;
                        }
                    });
                }

                if (!i.type && i.style && i.style=="itemNoAction") {
                    i.type = "text";
                    resp.useGrid = false;
                }

                if (isApps && i.actions && i.actions.go && i.actions.go.params && i.actions.go.params.menu) {
                    if ("myapps" == i.actions.go.params.menu) { // mysqueezebox.com apps
                        if (i.actions.go.params.item_id) {
                            var parts = i.actions.go.params.item_id.split(".");
                            if (parts.length>1) {
                                parts.shift();
                                i.id = "myapps."+parts.join(".");
                            }
                        }
                    } else {
                        i.id = "apps."+i.actions.go.params.menu;
                    }

                    if (i.id) {
                        if (!addedDivider && i.menuActions.length>0) {
                            i.menuActions.push(DIVIDER);
                            addedDivider = true;
                        }
                        i.menuActions.push(options.pinned.has(i.id) ? UNPIN_ACTION : PIN_ACTION);
                    }
                } else if (isPlaylists && i.commonParams && i.commonParams.playlist_id) {
                    i.id = "playlist_id:"+i.commonParams.playlist_id;
                } else if (isRadios && i.type!="search") {
                    if (!i.id) {
                        if (i.presetParams && i.presetParams.favorites_url) {
                            i.id = "radio:"+i.presetParams.favorites_url;
                        } else if (parent && parent.id && TOP_RADIO_ID!=parent.id) {
                            i.id = parent.id+"."+i.title;
                        } else {
                            i.id = "radio:"+i.title;
                        }
                    }
                    if (!addedDivider && i.menuActions.length>0) {
                        i.menuActions.push(DIVIDER);
                        addedDivider = true;
                    }
                    i.menuActions.push(options.pinned.has(i.id) ? UNPIN_ACTION : PIN_ACTION);
                } else if (!isFavorites) { // move/rename on favs needs ids of a.b.c (created below)
                    if (i.params && i.params.item_id) {
                        i.id = "item_id:"+i.params.item_id;
                    } else if (i.actions && i.actions.go && i.actions.go.params && i.actions.go.params.item_id) {
                        i.id = "item_id:"+i.actions.go.params.item_id;
                    }
                }

                if (!i.id) {
                    if (parent.id.startsWith(TOP_ID_PREFIX)) {
                        i.id="item_id:"+idStart;
                    } else {
                        i.id=parent.id+"."+idStart;
                    }
                    idStart++;
                }

                if (isFavorites) {
                    i.id=addUniqueness(i.id, uniqueness);
                }

                // Only show 'More' aciton if ('more' is in baseActions and item as item_id) OR
                // 'more' is in item's actions. #57
                if ((moreAction && i.menuActions.length>0 && i.params && i.params.item_id) ||
                    (i.actions && i.actions.more && i.actions.more.cmd)) {
                    if (!addedDivider && i.menuActions.length>0) {
                        i.menuActions.push(DIVIDER);
                        addedDivider = true;
                    }
                    i.menuActions.push(MORE_ACTION);
                }

                if (resp.useGrid && i.image) {
                    if (i.image.endsWith("_50x50.png")) {
                        i.image=i.image.replace("_50x50.png", LMS_GRID_IMAGE_SIZE);
                    } else if (i.image.endsWith("50x50.png")) {
                        i.image=i.image.replace("50x50.png", LMS_GRID_IMAGE_SIZE);
                    } else if (i.image.endsWith("_50x50_o")) {
                        i.image=i.image.replace("_50x50_o", LMS_GRID_IMAGE_SIZE);
                    } else if (i.image.endsWith("50x50_o")) {
                        i.image=i.image.replace("50x50_o", LMS_GRID_IMAGE_SIZE);
                    }
                }
                i.section = parent ? parent.section : undefined;
                resp.items.push(i);
            });
            if (0==resp.items.length && data.result.window && data.result.window.textarea) {
                resp.items.push({
                                title: replaceNewLines(data.result.window.textarea),
                                type: "text",
                                id: parent.id+"."+idStart
                               });
                resp.useGrid = false;
            } else if (haveWithoutIcons && haveWithIcons && resp.items.length == resp.total) {
                var defCover = parent.image ? parent.image
                                            : resolveImage("music/0/cover" + (resp.useGrid ? LMS_GRID_IMAGE_SIZE : LMS_LIST_IMAGE_SIZE));
                resp.items.forEach(i => {
                    if (!i.image) {
                        i.image = defCover;
                    }
                });
            }
        } else if (data.result.artists_loop) {
            var params = [];
            if (parent && parent.params) {
                parent.params.forEach(p => {
                    if (p.startsWith("role_id:") || (!options.noGenreFilter && p.startsWith("genre_id:"))) {
                        params.push(p);
                    }
                });
            }
            var infoPlugin = getLocalStorageBool('infoPlugin');
            resp.useGrid = options.useGrid && infoPlugin && options.artistImages;
            data.result.artists_loop.forEach(i => {
                var artist = {
                              id: "artist_id:"+i.id,
                              title: i.artist,
                              command: ["albums"],
                              image: (infoPlugin && options.artistImages) ? lmsServerAddress+"/imageproxy/mai/artist/" + i.id + "/image" +
                                    (resp.useGrid ? LMS_GRID_IMAGE_SIZE : LMS_LIST_IMAGE_SIZE) : undefined,
                              params: ["artist_id:"+ i.id, "tags:jly", "sort:"+ARTIST_ALBUM_SORT_PLACEHOLDER],
                              menuActions: [PLAY_ACTION, INSERT_ACTION, ADD_ACTION, ADD_RANDOM_ALBUM_ACTION, DIVIDER, ADD_TO_FAV_ACTION, SELECT_ACTION, MORE_LIB_ACTION],
                              type: "group",
                              favIcon: (infoPlugin && options.artistImages) ? "imageproxy/mai/artist/"+i.id+"/image.png" : undefined
                          };
                if (params.length>0) {
                    params.forEach(p => {
                        artist.params.push(p);
                    });
                }
                resp.items.push(artist);
            });
            resp.subtitle=i18np("1 Artist", "%1 Artists", parent && parent.range ? parent.range.count : resp.total);
        } else if (data.result.albums_loop) {
            resp.actions=[ADD_ACTION, DIVIDER, PLAY_ACTION];
            resp.useGrid = options.useGrid;
            var params = [];
            if (parent && parent.params && (!options.noRoleFilter || !options.noGenreFilter)) {
                parent.params.forEach(p => {
                    if ( (!options.noRoleFilter && (p.startsWith("role_id:") || p.startsWith("artist_id:"))) ||
                         (!options.noGenreFilter && p.startsWith("genre_id:"))) {
                        params.push(p);
                    }
                });
            }

            data.result.albums_loop.forEach(i => {
                var title = i.album;
                if (i.year && i.year>0) {
                    title+=" (" + i.year + ")";
                }
                var album = {
                              id: "album_id:"+i.id,
                              title: title,
                              subtitle: i.artist ? i.artist : undefined,
                              command: ["tracks"],
                              image: lmsServerAddress+"/music/" + i.artwork_track_id + "/cover" + (resp.useGrid ? LMS_GRID_IMAGE_SIZE : LMS_LIST_IMAGE_SIZE),
                              params: ["album_id:"+ i.id, TRACK_TAGS, "sort:tracknum"],
                              menuActions: [PLAY_ACTION, INSERT_ACTION, ADD_ACTION, DIVIDER, ADD_TO_FAV_ACTION, SELECT_ACTION, MORE_LIB_ACTION],
                              type: "group",
                              favIcon: i.artwork_track_id ? "music/"+i.artwork_track_id+"/cover" : undefined,
                              origTitle: i.album,
                              // Bug on my system? There is a 'No Album' entry with no tracks!
                              disabled: undefined!==i.year && 0==i.year && i.artist && "No Album"===i.album && "Various Artists"===i.artist
                          };
                if (params.length>0) {
                    params.forEach(p => {
                        album.params.push(p);
                    });
                }
                resp.items.push(album);
            });
            resp.subtitle=i18np("1 Album", "%1 Albums", parent && parent.range ? parent.range.count : resp.total);
        } else if (data.result.titles_loop) {
            resp.actions=[ADD_ACTION, DIVIDER, PLAY_ACTION];
            var duration=0;
            var allowPlayAlbum = parent && parent.id && parent.id.startsWith("album_id:");
            data.result.titles_loop.forEach(i => {
                var title = i.title;
                if (i.tracknum>0) {
                     title = (i.tracknum>9 ? i.tracknum : ("0" + i.tracknum))+" "+title;
                     //title = i.tracknum + ". " + title; // SlimBrowse format
                }
                if (i.trackartist && ( (i.albumartist && i.trackartist !== i.albumartist) || (!i.albumartist && i.compilation=="1"))) {
                     title+=" - " + i.trackartist;
                } else if (i.artist && ( (i.albumartist && i.artist !== i.albumartist) || (!i.albumartist && i.compilation=="1"))) {
                     title+=" - " + i.artist;
                }
                duration+=parseFloat(i.duration || 0);
                resp.items.push({
                              id: "track_id:"+i.id,
                              title: title,
                              subtitle: formatSeconds(i.duration),
                              //icon: "music_note",
                              menuActions: allowPlayAlbum && resp.total>1
                                            ? [PLAY_ACTION, PLAY_ALBUM_ACTION, INSERT_ACTION, ADD_ACTION, DIVIDER, SELECT_ACTION, MORE_LIB_ACTION]
                                            : [PLAY_ACTION, INSERT_ACTION, ADD_ACTION, DIVIDER, SELECT_ACTION, MORE_LIB_ACTION],
                              type: "track"
                          });
            });
            resp.subtitle=i18np("1 Track", "%1 Tracks", resp.total);
            if (data.result.titles_loop.length===resp.total) {
                resp.subtitle+=" ("+formatSeconds(duration)+")";
            }
        } else if (data.result.genres_loop) {
            data.result.genres_loop.forEach(i => {
                resp.items.push({
                              id: "genre_id:"+i.id,
                              title: i.genre,
                              command: ["artists"],
                              //icon: "label",
                              params: ["genre_id:"+ i.id],
                              menuActions: [PLAY_ACTION, INSERT_ACTION, ADD_ACTION, ADD_RANDOM_ALBUM_ACTION, DIVIDER, ADD_TO_FAV_ACTION, SELECT_ACTION, MORE_LIB_ACTION],
                              type: "group"
                          });
            });
            resp.subtitle=i18np("1 Genre", "%1 Genres", resp.total);
        } else if (data.result.playlists_loop) {
            data.result.playlists_loop.forEach(i => {
                resp.items.push({
                              id: "playlist_id:"+i.id,
                              title: i.playlist,
                              command: ["playlists", "tracks"],
                              //icon: "list",
                              params: ["playlist_id:"+ i.id],
                              menuActions: [PLAY_ACTION, INSERT_ACTION, ADD_ACTION, DIVIDER, ADD_TO_FAV_ACTION, SELECT_ACTION, RENAME_PL_ACTION, DELETE_ACTION],
                              type: "group"
                          });
            });
            resp.subtitle=i18np("1 Playlist", "%1 Playlists", resp.total);
        } else if (data.result.playlisttracks_loop) {
            resp.actions=[ADD_ACTION, DIVIDER, PLAY_ACTION];
            data.result.playlisttracks_loop.forEach(i => {
                var title = i.title;
                if (i.artist) {
                    title+=" - " + i.artist;
                }
                if (!title) {
                    title=i18n("Unknown");
                }
                var duration = parseFloat(i.duration || 0)
                var subtitle = duration>0 ? formatSeconds(duration) : undefined;
                if (i.album) {
                    if (subtitle) {
                        subtitle+=" ("+i.album+")";
                    } else {
                        sbtitle=i.album;
                    }
                }
                resp.items.push({
                              id: "track_id:"+i.id,
                              title: title,
                              subtitle: subtitle,
                              //icon: "music_note",
                              menuActions: [PLAY_ACTION, INSERT_ACTION, ADD_ACTION],
                              type: "track"
                          });
            });
            resp.subtitle=i18np("1 Track", "%1 Tracks", resp.total);
        } else if (data.result.years_loop) {
            data.result.years_loop.forEach(i => {
                resp.items.push({
                              id: "year:"+i.year,
                              title: i.year,
                              command: ["albums"],
                              //icon: "date_range",
                              params: ["year:"+ i.year, "tags:ajly"],
                              menuActions: [PLAY_ACTION, INSERT_ACTION, ADD_ACTION, ADD_RANDOM_ALBUM_ACTION, DIVIDER, ADD_TO_FAV_ACTION, SELECT_ACTION],
                              type: "group"
                          });
            });
            resp.subtitle=i18np("1 Year", "%1 Years", resp.total);
        } else if (data.result.folder_loop) {
            data.result.folder_loop.forEach(i => {
                var isFolder = i.type==="folder";
                resp.items.push({
                              id: (isFolder ? "folder_id:" : "track_id:") + i.id,
                              title: i.filename,
                              subtitle: i.duration!="" && !isFolder ? i.duration : undefined,
                              command: ["musicfolder"],
                              params: ["folder_id:"+i.id, "type:audio", "tags:d"],
                              menuActions: [PLAY_ACTION, INSERT_ACTION, ADD_ACTION],
                              type: isFolder ? "group" : "track",
                              icon: isFolder ? "folder" : undefined
                          });
            });
            resp.subtitle=i18np("1 Item", "%1 Items", resp.total);
        } else if (data.result.radioss_loop) {
            data.result.radioss_loop.forEach(i => {
                if ("xmlbrowser"===i.type) {
                    resp.items.push({
                                  title: i.name ? i.name : i.title,
                                  command: [i.cmd, "items"],
                                  image: resolveImage(i.icon, i.image, LMS_LIST_IMAGE_SIZE),
                                  params: ["want_url:1"],
                                  type: "group",
                                  id: parent.id+i.cmd,
                                  app: i.cmd
                          });
                } else if ("xmlbrowser_search"===i.type) {
                    resp.items.push({
                                  title: i.name ? i.name : i.title,
                                  command: [i.cmd, "items"],
                                  image: resolveImage(i.icon, i.image, LMS_LIST_IMAGE_SIZE),
                                  //icon: "search",
                                  params: ["want_url:1", "search:"+TERM_PLACEHOLDER],
                                  type: "search",
                                  id: parent.id+i.cmd,
                                  app: i.cmd
                          });
                }
            });
        } else if (data.result.appss_loop) {
            data.result.appss_loop.forEach(i => {
                if ("xmlbrowser"===i.type) {
                    resp.items.push({
                                  title: i.name ? i.name : i.title,
                                  command: [i.cmd, "items"],
                                  image: resolveImage(i.icon, i.image, LMS_LIST_IMAGE_SIZE),
                                  params: ["want_url:1"],
                                  type: "group",
                                  id: parent.url+i.cmd,
                                  app: i.cmd
                          });
                } else if ("xmlbrowser_search"===i.type) {
                    resp.items.push({
                                  title: i.name ? i.name : i.title,
                                  command: [i.cmd, "items"],
                                  image: resolveImage(i.icon, i.image, LMS_LIST_IMAGE_SIZE),
                                  //icon: "search",
                                  params: ["want_url:1", "search:"+TERM_PLACEHOLDER],
                                  type: "search",
                                  id: parent.id+i.cmd,
                                  app: i.cmd
                          });
                }
            });
            resp.subtitle=i18np("1 App", "%1 Apps", resp.total);
            if (data.result.appss_loop.length === resp.total) {
                // Have all apps, so sort...
                resp.items.sort(titleSort);
            }
        } else if (data.result.loop_loop) {
            var topLevelFavourites = "favorites"===parent.type && parent.id.startsWith("top:/");
            data.result.loop_loop.forEach(i => {
                if ("text"===i.type || "textarea"===i.type) {
                    resp.items.push({
                                  title: replaceNewLines(i.name ? i.name : i.title),
                                  type: "text",
                                  id: i.id
                               });
                } else if ("search"===i.type) {
                    resp.items.push({
                                  title: i.name ? i.name : i.title,
                                  command: [i.cmd ? i.cmd : parent.command[0], "items"],
                                  image: resolveImage(i.icon, i.image, LMS_LIST_IMAGE_SIZE),
                                  //icon: "search",
                                  params: ["want_url:1", "item_id:"+i.id, "search:"+TERM_PLACEHOLDER],
                                  type: "search",
                                  id: parent.url+i.cmd+i.id,
                                  app: parent.app
                               });
                } else if (i.hasitems>0) {
                    resp.items.push({
                                  title: i.name ? i.name : i.title,
                                  command: parent.command,
                                  image: resolveImage(i.icon, i.image, LMS_LIST_IMAGE_SIZE),
                                  //icon: "folder"==i.type || "url"==i.type ? "folder" : "chevron_right",
                                  params: ["item_id:"+i.id, "want_url:1"],
                                  type: "group",
                                  url: i.url,
                                  app: parent.app,
                                  menuActions: "favorites"===parent.type
                                                ? topLevelFavourites
                                                    ? [PLAY_ACTION, INSERT_ACTION, ADD_ACTION, DIVIDER, EDIT_FAV_ACTION, REMOVE_FROM_FAV_ACTION, SELECT_ACTION]
                                                    : [PLAY_ACTION, INSERT_ACTION, ADD_ACTION, DIVIDER, SELECT_ACTION]
                                                : i.isaudio === 1
                                                    ? i.url
                                                        ? [PLAY_ACTION, INSERT_ACTION, ADD_ACTION, DIVIDER, ADD_TO_FAV_ACTION, SELECT_ACTION]
                                                        : [PLAY_ACTION, INSERT_ACTION, ADD_ACTION, DIVIDER, SELECT_ACTION]
                                                    : i.url
                                                        ? [ADD_TO_FAV_ACTION, DIVIDER, SELECT_ACTION]
                                                        : undefined,
                                  id: "item_id:"+i.id,
                                  favIcon: i.image ? i.image : i.icon
                               });
                } else if (i.isaudio === 1) {
                    resp.items.push({
                                  title: i.name ? i.name : i.title,
                                  url: i.url,
                                  image: resolveImage(i.icon, i.image, LMS_LIST_IMAGE_SIZE),
                                  //icon: i.url && (i.url.startsWith("http:") || i.url.startsWith("https:")) ? "wifi_tethering" : "music_note",
                                  type: "track",
                                  menuActions: "favorites"===parent.type
                                                ? topLevelFavourites
                                                    ? [PLAY_ACTION, INSERT_ACTION, ADD_ACTION, DIVIDER, EDIT_FAV_ACTION, REMOVE_FROM_FAV_ACTION, SELECT_ACTION]
                                                    : [PLAY_ACTION, INSERT_ACTION, ADD_ACTION, DIVIDER, SELECT_ACTION]
                                                : i.url
                                                    ? [PLAY_ACTION, INSERT_ACTION, ADD_ACTION, DIVIDER, ADD_TO_FAV_ACTION, SELECT_ACTION]
                                                    : [PLAY_ACTION, INSERT_ACTION, ADD_ACTION, DIVIDER, SELECT_ACTION],
                                  app: parent.app,
                                  id: "item_id:"+i.id,
                                  favIcon: i.image ? i.image : i.icon
                               });
                    if (i.description && 1==resp.total) {
                        resp.total+=1;
                        data.result.loop_loop.length+=1;
                        var details;
                        if (i.line1) {
                            details = "<b>"+i.line1+"</b>";
                            if (i.line2) {
                                 details += "<br/><br/>"+i.line2;
                            }
                        }
                        if (details) {
                            details += "<br/><br/>"+i.description;
                        } else {
                            details = i.description;
                        }

                        resp.items.push({
                                  title: replaceNewLines(details),
                                  type: "text",
                                  id: i.id+"-descr"
                               });
                    }
                }
            });
        } else if (0===resp.total && data.result.networkerror) {
            resp.items.push({title: i18n("Failed to retrieve listing. (%1)", data.result.networkerror), type: "text"});
        } else if (data.result.data && data.result.data.constructor === Array && data.result.title) { // pictures?
            data.result.data.forEach(i => {
                if (i.image) {
                    i.id = "image:"+resp.items.length,
                    i.type = "image";
                    i.thumb = resolveImage(null, i.image, LMS_GRID_IMAGE_SIZE);
                    i.src = resolveImage(null, i.image);
                    i.w=0;
                    i.h=0;
                    resp.items.push(i);
                }
            });
            if (resp.items.length>0) {
                resp.title=data.result.title;
                resp.subtitle=i18np("1 Image", "%1 Images", resp.items.length);
                resp.useGrid = true;
            }
            resp.total = resp.items.length;
        }

        if (cacheKey && lmsLastScan) {
            resp.iscache=true;
            setLocalStorageVal(cacheKey, JSON.stringify(resp));
        }
    } else if (data && data.iscache) { // From cache
        resp = data;
    }

    } catch(e) {
        resp.items.push({title:i18n("ERROR: List processing failed")+"\n"+e, type: 'text', id:'error'});
        logError(e);
    }

    return resp;
}

