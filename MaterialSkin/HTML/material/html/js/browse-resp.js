/*
 * LMS-Material
 *
 * Copyright (c) 2018 Craig Drummond <craig.p.drummond@gmail.com>
 * MIT license.
 */

function parseBrowseResp(data, parent, artistImages, idStart) {
    var resp = {items: [], baseActions:[] };

    if (data && data.result) {
        //console.log("RESP", JSON.stringify(data.result, null, 2), parent);
        if (parent.id && TOP_SEARCH_ID===parent.id) {
            if (data.result.contributors_loop && data.result.contributors_count>0) {
                resp.items.push({header: i18n("Artists")});
                data.result.contributors_loop.forEach(i => {
                    resp.items.push({
                                  id: "artist_id:"+i.contributor_id,
                                  title: i.contributor,
                                  command: ["albums"],
                                  params: ["artist_id:"+ i.contributor_id, "tags:jly", "sort:"+ARTIST_ALBUM_SORT_PLACEHOLDER],
                                  image: artistImages ? lmsServerAddress+"/imageproxy/mai/artist/" + i.contributor_id + "/image_100x100_o" : undefined,
                                  //icon: artistImages ? undefined : "person",
                                  menuActions: [PLAY_ACTION, INSERT_ACTION, ADD_ACTION, ADD_RANDOM_ALBUM_ACTION, DIVIDER, ADD_TO_FAV_ACTION],
                                  type: "group",
                                  favIcon: artistImages ? "imageproxy/mai/artist/"+i.contributor_id+"/image.png" : undefined
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
                                  params: ["album_id:"+ i.album_id, "tags:Adt", "sort:tracknum"],
                                  image: lmsServerAddress+"/music/" + i.artwork + "/cover_100x100_o"  ,
                                  menuActions: [PLAY_ACTION, INSERT_ACTION, ADD_ACTION, DIVIDER, ADD_TO_FAV_ACTION],
                                  type: "group",
                                  favIcon: i.artwork_track_id ? "music/"+i.artwork_track_id+"/cover" : undefined
                              });
                });
            }
            if (data.result.tracks_loop && data.result.tracks_count>0) {
                resp.items.push({header: i18n("Tracks")});
                data.result.tracks_loop.forEach(i => {
                    resp.items.push({
                                  id: "track_id:"+i.track_id,
                                  title: i.track,
                                  image: lmsServerAddress+"/music/" + i.coverid + "/cover_100x100_o"  ,
                                  menuActions: [PLAY_ACTION, INSERT_ACTION, ADD_ACTION],
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
                                  menuActions: [PLAY_ACTION, INSERT_ACTION, ADD_ACTION, ADD_RANDOM_ALBUM_ACTION, DIVIDER, ADD_TO_FAV_ACTION],
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
                    if (data.result.artists_loop[i].textkey!=null && data.result.artists_loop[i].textkey!=undefined && data.result.artists_loop[i].textkey!="") {
                        start = i;
                        break;
                    }
                }
            } else if (data.result.albums_loop) {
                for (var i=0; i<data.result.albums_loop.length; ++i) {
                    if (data.result.albums_loop[i].textkey!=null && data.result.albums_loop[i].textkey!=undefined && data.result.albums_loop[i].textkey!="") {
                        fstart = i;
                        break;
                    }
                }
            }

            var prevItem = undefined;
            var maxCount = data.result.count <= 500 ? 50 : data.result.count <= 1000 ? 100 : 200;
            for (var i=start; i<data.result.indexList.length; ++i) {
                var name = data.result.indexList[i][0];
                var count = data.result.indexList[i][1];
                var item = {
                                title: name,
                                range: {start: start, count: count},
                                type: "group",
                                command: parent.command,
                                params: parent.params
                            };

                if (prevItem) {
                    if (prevItem.range.count + count > maxCount) {
                        if (undefined!==prevItem.subtitle && prevItem.subtitle!=prevItem.title) {
                            prevItem.title += " .. " + prevItem.subtitle;
                        }
                        prevItem.subtitle = isArtists 
                                                ? i18np("1 Artist", "%1 Artists", prevItem.range.count) 
                                                : i18np("1 Album", "%1 Albums", prevItem.range.count);
                        resp.items.push(prevItem);
                        prevItem = item;
                    } else {
                        prevItem.subtitle = name;
                        prevItem.range.count += count;
                    }
                } else if (item.range.count >= maxCount) {
                    item.subtitle = isArtists 
                                        ? i18np("1 Artist", "%1 Artists", count)
                                        : i18np("1 Album", "%1 Albums", count);
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
                resp.items.push(prevItem);
            }

            data.result.count=resp.items.length;
            resp.subtitle=i18np("1 Category", "%1 Categories", data.result.count);
        } else if (data.result.item_loop) {  // SlimBrowse response
            var playAction = false;
            var addAction = false;
            var insertAction = false;
            var moreAction = false;
            var isFavorites = parent && parent.id && parent.id==TOP_FAV_ID;
            var isPlaylists = parent && parent.id && parent.id==TOP_PLAYLISTS_ID;
            var haveWithIcons = false;
            var haveWithoutIcons = false;
            if (data.result.base && data.result.base.actions) {
                resp.baseActions = data.result.base.actions;
                playAction = undefined != resp.baseActions[PLAY_ACTION.cmd];
                addAction = undefined != resp.baseActions[ADD_ACTION.cmd];
                insertAction = undefined != resp.baseActions[INSERT_ACTION.cmd];
                /*
                if (undefined!=resp.baseActions[MORE_ACTION.cmd] && undefined!=resp.baseActions[MORE_ACTION.cmd].params) {
                    for(var key in resp.baseActions[MORE_ACTION.cmd].params) {
                        if (key != "menu") {
                            moreAction=true;
                            break;
                        }
                    }
                }
                */
            }

            data.result.item_loop.forEach(i => {
                if (!i.text) {
                    return;
                }
                var text = i.text.split(/\r?\n/);
                i.title = text[0];
                if (text.length>1) {
                    i.subtitle = text[1];
                } else {
                    i.title=i.text;
                }
                i.text = undefined;
                i.image = resolveImage(i.icon ? i.icon : i["icon-id"]);

                if (!i.image && i.commonParams && i.commonParams.album_id) {
                    i.image = resolveImage("music/0/cover_50x50");
                }

                if (i.image) {
                    haveWithIcons = true;
                } else {
                    haveWithoutIcons = true;
                }
                i.menuActions=[];
                if (i.type=="playlist" || i.type=="audio" || i.style=="itemplay") {
                    if (playAction) {
                        i.menuActions.push(PLAY_ACTION);
                    }
                    if (insertAction) {
                        i.menuActions.push(INSERT_ACTION);
                    }
                    if (addAction) {
                        i.menuActions.push(ADD_ACTION);
                    }
                }
                if ((playAction || insertAction || addAction) && (isFavorites || i.presetParams || isPlaylists || moreAction)) {
                    i.menuActions.push(DIVIDER);
                }
                if (isFavorites) {
                    i.menuActions.push(RENAME_FAV_ACTION);
                    i.menuActions.push(REMOVE_FROM_FAV_ACTION);
                } else if (i.presetParams) {
                    i.menuActions.push(ADD_TO_FAV_ACTION);
                }
                if (isPlaylists) {
                    i.menuActions.push(RENAME_PL_ACTION);
                    i.menuActions.push(DELETE_ACTION);
                }
                if (moreAction) {
                    i.menuActions.push(MORE_ACTION);
                }

                if (isPlaylists && i.commonParams && i.commonParams.playlist_id) {
                    i.id = "playlist_id:"+i.commonParams.playlist_id;
                } else if (i.params && i.params.item_id) {
                    i.id = "item_id:"+i.params.item_id;
                } else {
                    i.id=parent.id+"."+idStart;
                    idStart++;
                }
                if (!i.type && i.actions && i.actions.go && i.actions.go.cmd) {
                    i.actions.go.cmd.forEach(a => {
                        if ("search" == a) {
                            i.type = "search";
                            return;
                        }
                    });
                }
                resp.items.push(i);
            });
            if (0==resp.items.length && data.result.window && data.result.window.textarea) {
                resp.items.push({
                                title: data.result.window.textarea,
                                type: "text",
                                id: parent.id+"."+idStart
                               });
            } else if (haveWithoutIcons && haveWithIcons && resp.items.length == data.result.count) {
                var defCover = parent.image ? parent.image : resolveImage("music/0/cover_50x50");
                resp.items.forEach(i => {
                    if (!i.image) {
                        i.image = defCover;
                    }
                });
            }
        } else if (data.result.artists_loop) {
            data.result.artists_loop.forEach(i => {
                resp.items.push({
                              id: "artist_id:"+i.id,
                              title: i.artist,
                              command: ["albums"],
                              image: artistImages ? lmsServerAddress+"/imageproxy/mai/artist/" + i.id + "/image_100x100_o" : undefined,
                              params: ["artist_id:"+ i.id, "tags:jly", "sort:"+ARTIST_ALBUM_SORT_PLACEHOLDER],
                              menuActions: [PLAY_ACTION, INSERT_ACTION, ADD_ACTION, ADD_RANDOM_ALBUM_ACTION, DIVIDER, ADD_TO_FAV_ACTION],
                              type: "group",
                              favIcon: artistImages ? "imageproxy/mai/artist/"+i.id+"/image.png" : undefined
                          });
            });
            resp.subtitle=i18np("1 Artist", "%1 Artists", parent && parent.range ? parent.range.count : data.result.count);
        } else if (data.result.albums_loop) {
            resp.actions=[ADD_ACTION, DIVIDER, PLAY_ACTION];
            data.result.albums_loop.forEach(i => {
                // Bug on my system? There is a 'No Album' entry with no tracks!
                if (undefined!==i.year && 0==i.year && i.artist && "No Album"===i.album && "Various Artists"===i.artist) {
                    data.result.count--;
                    return;
                }
                resp.items.push({
                              id: "album_id:"+i.id,
                              title: i.album,
                              subtitle: i.artist ? i.artist : i.year && i.year>1900 ? i.year : undefined,
                              command: ["tracks"],
                              image: lmsServerAddress+"/music/" + i.artwork_track_id + "/cover_100x100_o"  ,
                              params: ["album_id:"+ i.id, "tags:Adt", "sort:tracknum"],
                              menuActions: [PLAY_ACTION, INSERT_ACTION, ADD_ACTION, DIVIDER, ADD_TO_FAV_ACTION],
                              type: "group",
                              favIcon: i.artwork_track_id ? "music/"+i.artwork_track_id+"/cover" : undefined
                          });
            });
            resp.subtitle=i18np("1 Album", "%1 Albums", parent && parent.range ? parent.range.count : data.result.count);
        } else if (data.result.titles_loop) {
            resp.actions=[ADD_ACTION, DIVIDER, PLAY_ACTION];
            var duration=0;
            data.result.titles_loop.forEach(i => {
                var title = i.title;
                if (i.tracknum>0) {
                     title = (i.tracknum>9 ? i.tracknum : ("0" + i.tracknum))+" "+title;
                     //title = i.tracknum + ". " + title; // SlimBrowse format
                }
                if (i.trackartist && i.albumartist && i.trackartist !== i.albumartist) {
                     title+=" - " + i.trackartist;
                }
                duration+=i.duration;
                resp.items.push({
                              id: "track_id:"+i.id,
                              title: title,
                              subtitle: formatSeconds(i.duration),
                              //icon: "music_note",
                              menuActions: [PLAY_ACTION, INSERT_ACTION, ADD_ACTION],
                              type: "track"
                          });
            });
            resp.subtitle=i18np("1 Track", "%1 Tracks", data.result.count);
            if (data.result.titles_loop.length===data.result.count) {
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
                              menuActions: [PLAY_ACTION, INSERT_ACTION, ADD_ACTION, ADD_RANDOM_ALBUM_ACTION, DIVIDER, ADD_TO_FAV_ACTION],
                              type: "group"
                          });
            });
            resp.subtitle=i18np("1 Genre", "%1 Genres", data.result.count);
        } else if (data.result.playlists_loop) {
            data.result.playlists_loop.forEach(i => {
                resp.items.push({
                              id: "playlist_id:"+i.id,
                              title: i.playlist,
                              command: ["playlists", "tracks"],
                              //icon: "list",
                              params: ["playlist_id:"+ i.id],
                              menuActions: [PLAY_ACTION, INSERT_ACTION, ADD_ACTION, DIVIDER, ADD_TO_FAV_ACTION, RENAME_PL_ACTION, DELETE_ACTION],
                              type: "group"
                          });
            });
            resp.subtitle=i18np("1 Playlist", "%1 Playlists", data.result.count);
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
                var subtitle = i.duration>0 ? formatSeconds(i.duration) : undefined;
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
            resp.subtitle=i18np("1 Track", "%1 Tracks", data.result.count);
        } else if (data.result.years_loop) {
            data.result.years_loop.forEach(i => {
                resp.items.push({
                              id: "year:"+i.year,
                              title: i.year,
                              command: ["albums"],
                              //icon: "date_range",
                              params: ["year:"+ i.year, "tags:ajly"],
                              menuActions: [PLAY_ACTION, INSERT_ACTION, ADD_ACTION, ADD_RANDOM_ALBUM_ACTION, DIVIDER, ADD_TO_FAV_ACTION],
                              type: "group"
                          });
            });
            resp.subtitle=i18np("1 Year", "%1 Years", data.result.count);
        } else if (data.result.radioss_loop) {
            data.result.radioss_loop.forEach(i => {
                if ("xmlbrowser"===i.type) {
                    resp.items.push({
                                  title: i.name ? i.name : i.title,
                                  command: [i.cmd, "items"],
                                  image: resolveImage(i.icon, i.image),
                                  params: ["want_url:1"],
                                  type: "group",
                                  id: parent.id+i.cmd,
                                  app: i.cmd
                          });
                } else if ("xmlbrowser_search"===i.type) {
                    resp.items.push({
                                  title: i.name ? i.name : i.title,
                                  command: [i.cmd, "items"],
                                  image: resolveImage(i.icon, i.image),
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
                                  image: resolveImage(i.icon, i.image),
                                  params: ["want_url:1"],
                                  type: "group",
                                  id: parent.url+i.cmd,
                                  app: i.cmd
                          });
                } else if ("xmlbrowser_search"===i.type) {
                    resp.items.push({
                                  title: i.name ? i.name : i.title,
                                  command: [i.cmd, "items"],
                                  image: resolveImage(i.icon, i.image),
                                  //icon: "search",
                                  params: ["want_url:1", "search:"+TERM_PLACEHOLDER],
                                  type: "search",
                                  id: parent.id+i.cmd,
                                  app: i.cmd
                          });
                }
            });
            resp.subtitle=i18np("1 App", "%1 Apps", data.result.count);
            if (data.result.appss_loop.length === data.result.count) {
                // Have all apps, so sort...
                resp.items.sort(titleSort);
            }
        } else if (data.result.loop_loop) {
            var topLevelFavourites = "favorites"===parent.type && parent.id.startsWith("top:/");
            data.result.loop_loop.forEach(i => {
                if ("text"===i.type || "textarea"===i.type) {
                    resp.items.push({
                                  title: i.name ? i.name : i.title,
                                  type: "text",
                                  id: i.id
                               });
                } else if ("search"===i.type) {
                    resp.items.push({
                                  title: i.name ? i.name : i.title,
                                  command: [i.cmd ? i.cmd : parent.command[0], "items"],
                                  image: resolveImage(i.icon, i.image),
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
                                  image: resolveImage(i.icon, i.image),
                                  //icon: "folder"==i.type || "url"==i.type ? "folder" : "chevron_right",
                                  params: ["item_id:"+i.id, "want_url:1"],
                                  type: "group",
                                  url: i.url,
                                  app: parent.app,
                                  menuActions: "favorites"===parent.type
                                                ? topLevelFavourites
                                                    ? [PLAY_ACTION, INSERT_ACTION, ADD_ACTION, DIVIDER, RENAME_FAV_ACTION, REMOVE_FROM_FAV_ACTION]
                                                    : [PLAY_ACTION, INSERT_ACTION, ADD_ACTION]
                                                : i.isaudio === 1
                                                    ? i.url
                                                        ? [PLAY_ACTION, INSERT_ACTION, ADD_ACTION, DIVIDER, ADD_TO_FAV_ACTION]
                                                        : [PLAY_ACTION, INSERT_ACTION, ADD_ACTION]
                                                    : i.url
                                                        ? [ADD_TO_FAV_ACTION]
                                                        : undefined,
                                  id: "item_id:"+i.id,
                                  favIcon: i.image ? i.image : i.icon
                               });
                } else if (i.isaudio === 1) {
                    resp.items.push({
                                  title: i.name ? i.name : i.title,
                                  url: i.url,
                                  image: resolveImage(i.icon, i.image),
                                  //icon: i.url && (i.url.startsWith("http:") || i.url.startsWith("https:")) ? "wifi_tethering" : "music_note",
                                  type: "track",
                                  menuActions: "favorites"===parent.type
                                                ? topLevelFavourites
                                                    ? [PLAY_ACTION, INSERT_ACTION, ADD_ACTION, DIVIDER, RENAME_FAV_ACTION, REMOVE_FROM_FAV_ACTION]
                                                    : [PLAY_ACTION, INSERT_ACTION, ADD_ACTION]
                                                : i.url
                                                    ? [PLAY_ACTION, INSERT_ACTION, ADD_ACTION, DIVIDER, ADD_TO_FAV_ACTION]
                                                    : [PLAY_ACTION, INSERT_ACTION, ADD_ACTION],
                                  app: parent.app,
                                  id: "item_id:"+i.id,
                                  favIcon: i.image ? i.image : i.icon
                               });
                    if (i.description && 1==data.result.count) {
                        data.result.count+=1;
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
                                  title: details,
                                  type: "text",
                                  id: i.id+"-descr"
                               });
                    }
                }
            });
        } else if (0===data.result.count && data.result.networkerror) {
            resp.items.push({title: i18n("Failed to retrieve listing. (%1)", data.result.networkerror), type: "text"});
        }
    }

    return resp;
}

