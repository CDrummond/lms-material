/*
 * LMS-Material
 *
 * Copyright (c) 2018 Craig Drummond <craig.p.drummond@gmail.com>
 * MIT license.
 */

function parseBrowseResp(data, parent, artistImages) {
    var resp = {items: [], subtitle: undefined, actions:[] };

    if (data && data.result) {
        //console.log("RESP", data.result, parent);
        if ("search" === parent.type) {
            if (data.result.contributors_loop && data.result.contributors_count>0) {
                resp.items.push({header: i18n("Artists")});
                data.result.contributors_loop.forEach(i => {
                    resp.items.push({
                                  url: "artist_id:"+i.contributor_id,
                                  title: i.contributor,
                                  command: ["albums"],
                                  image: artistImages ? lmsServerAddress+"/imageproxy/mai/artist/" + i.contributor_id + "/image_100x100_o" : undefined,
                                  icon: artistImages ? undefined : "person",
                                  params: ["artist_id:"+ i.contributor_id, "tags:jly", "sort:"+ARTIST_ALBUM_SORT_PLACEHOLDER],
                                  actions: [PLAY_ACTION, ADD_ACTION, ADD_RANDOM_ALBUM_ACTION, DIVIDER, ADD_TO_FAV_ACTION],
                                  type: "group"
                              });
                });
            }
            if (data.result.albums_loop && data.result.albums_count>0) {
                resp.items.push({header: i18n("Albums")});
                data.result.albums_loop.forEach(i => {
                    resp.items.push({
                                  url: "album_id:"+i.album_id,
                                  title: i.album,
                                  command: ["tracks"],
                                  image: lmsServerAddress+"/music/" + i.artwork + "/cover_100x100_o"  ,
                                  params: ["album_id:"+ i.album_id, "tags:Adt", "sort:tracknum"],
                                  actions: [PLAY_ACTION, ADD_ACTION, DIVIDER, ADD_TO_FAV_ACTION],
                                  type: "group"
                              });
                });
            }
            if (data.result.tracks_loop && data.result.tracks_count>0) {
                resp.items.push({header: i18n("Tracks")});
                data.result.tracks_loop.forEach(i => {
                    resp.items.push({
                                  url: "track_id:"+i.track_id,
                                  title: i.track,
                                  image: lmsServerAddress+"/music/" + i.coverid + "/cover_100x100_o"  ,
                                  actions: [PLAY_ACTION, ADD_ACTION],
                                  type: "track"
                              });
                });
            }
            if (data.result.genres_loop && data.result.genres_count>0) {
                resp.items.push({header: i18n("Genres")});
                data.result.genres_loop.forEach(i => {
                    resp.items.push({
                                  url: "genre_id:"+i.genre_id,
                                  title: i.genre,
                                  command: ["artists"],
                                  //icon: "label",
                                  params: ["genre_id:"+ i.genre_id],
                                  actions: [PLAY_ACTION, ADD_ACTION, ADD_RANDOM_ALBUM_ACTION, DIVIDER, ADD_TO_FAV_ACTION],
                                  type: "group"
                              });
                });
            }
        } else {
            if (data.result.artists_loop) {
                data.result.artists_loop.forEach(i => {
                    resp.items.push({
                                  url: "artist_id:"+i.id,
                                  title: i.artist,
                                  command: ["albums"],
                                  image: artistImages ? lmsServerAddress+"/imageproxy/mai/artist/" + i.id + "/image_100x100_o" : undefined,
                                  params: ["artist_id:"+ i.id, "tags:jly", "sort:"+ARTIST_ALBUM_SORT_PLACEHOLDER],
                                  actions: [PLAY_ACTION, ADD_ACTION, ADD_RANDOM_ALBUM_ACTION, DIVIDER, ADD_TO_FAV_ACTION],
                                  type: "group"
                              });
                });
                resp.subtitle=i18np("1 Artist", "%1 Artists", data.result.count);
            } else if (data.result.albums_loop) {
                resp.actions=[ADD_ACTION, PLAY_ACTION];
                data.result.albums_loop.forEach(i => {
                    // Bug on my system? There is an 'No Album' entry with no tracks!
                    if (undefined!==i.year && 0==i.year && i.artist && "No Album"===i.album && "Various Artists"===i.artist) {
                        return;
                    }
                    var title = i.album;
                    var subtitle;
                    if (parent.command && parent.command.length>0 && parent.command[0]==="artists") {
                        subtitle = i.year && i.year>1900 ? i.year : undefined;
                    } else {
                        subtitle = i.artist;
                        if (i.year && i.year>1900) {
                            title+=" (" + i.year + ")";
                        }
                    }
                    resp.items.push({
                                  url: "album_id:"+i.id,
                                  title: title,
                                  subtitle: subtitle,
                                  command: ["tracks"],
                                  image: lmsServerAddress+"/music/" + i.artwork_track_id + "/cover_100x100_o"  ,
                                  params: ["album_id:"+ i.id, "tags:Adt", "sort:tracknum"],
                                  actions: [PLAY_ACTION, ADD_ACTION, DIVIDER, ADD_TO_FAV_ACTION],
                                  type: "group"
                              });
                });
                /*if ("newmusic"===parent) {
                    resp.subtitle=i18np("Newest Album", "%1 Newest Albums", data.result.albums_loop.length);
                } else {*/
                    resp.subtitle=i18np("1 Album", "%1 Albums", data.result.count);
                //}
            } else if (data.result.titles_loop) {
                resp.actions=[ADD_ACTION, PLAY_ACTION];
                var duration=0;
                data.result.titles_loop.forEach(i => {
                    var title = i.title;
                    if (i.tracknum>0) {
                         title = (i.tracknum>9 ? i.tracknum : ("0" + i.tracknum))+" "+title;
                    }
                    if (i.trackartist && i.albumartist && i.trackartist !== i.albumartist) {
                         title+=" - " + i.trackartist;
                    }
                    duration+=i.duration;
                    resp.items.push({
                                  url: "track_id:"+i.id,
                                  title: title,
                                  subtitle: formatSeconds(i.duration),
                                  command: ["tracks"],
                                  //icon: "music_note",
                                  actions: [PLAY_ACTION, ADD_ACTION],
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
                                  url: "genre_id:"+i.id,
                                  title: i.genre,
                                  command: ["artists"],
                                  //icon: "label",
                                  params: ["genre_id:"+ i.id],
                                  actions: [PLAY_ACTION, ADD_ACTION, ADD_RANDOM_ALBUM_ACTION, DIVIDER, ADD_TO_FAV_ACTION],
                                  type: "group"
                              });
                });
                resp.subtitle=i18np("1 Genre", "%1 Genres", data.result.count);
            } else if (data.result.playlists_loop) {
                data.result.playlists_loop.forEach(i => {
                    resp.items.push({
                                  url: "playlist_id:"+i.id,
                                  title: i.playlist,
                                  command: ["playlists", "tracks"],
                                  //icon: "list",
                                  params: ["playlist_id:"+ i.id],
                                  actions: [PLAY_ACTION, ADD_ACTION, DIVIDER, ADD_TO_FAV_ACTION, RENAME_PL_ACTION, DELETE_ACTION],
                                  type: "group"
                              });
                });
                resp.subtitle=i18np("1 Playlist", "%1 Playlists", data.result.count);
            } else if (data.result.playlisttracks_loop) {
                resp.actions=[ADD_ACTION, PLAY_ACTION];
                data.result.playlisttracks_loop.forEach(i => {
                    var title = i.title;
                    if (i.artist) {
                        title+=" - " + i.artist;
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
                                  url: "track_id:"+i.id,
                                  title: title,
                                  subtitle: subtitle,
                                  command: ["tracks"],
                                  //icon: "music_note",
                                  actions: [PLAY_ACTION, ADD_ACTION],
                                  type: "track"
                              });
                });
                resp.subtitle=i18np("1 Track", "%1 Tracks", data.result.count);
            } else if (data.result.years_loop) {
                data.result.years_loop.forEach(i => {
                    resp.items.push({
                                  url: "year:"+i.year,
                                  title: i.year,
                                  command: ["albums"],
                                  //icon: "date_range",
                                  params: ["year:"+ i.year, "tags:ajly"],
                                  actions: [PLAY_ACTION, ADD_ACTION, ADD_RANDOM_ALBUM_ACTION, DIVIDER, ADD_TO_FAV_ACTION],
                                  type: "group"
                              });
                });
                resp.subtitle=i18np("1 Year", "%1 Years", data.result.count);
            } else if (data.result.radioss_loop) {
                data.result.radioss_loop.forEach(i => {
                    if ("xmlbrowser"===i.type) {
                        resp.items.push({
                                      title: i.name,
                                      command: [i.cmd, "items"],
                                      image: resolveImage(i.icon, i.image),
                                      params: ["want_url:1"],
                                      type: "group",
                                      url: parent.url+i.cmd,
                                      app: i.cmd
                              });
                    } else if ("xmlbrowser_search"===i.type) {
                        resp.items.push({
                                      title: i.name,
                                      command: [i.cmd, "items"],
                                      image: resolveImage(i.icon, i.image),
                                      icon: "search",
                                      params: ["want_url:1", "search:"+TERM_PLACEHOLDER],
                                      type: "xmlsearch",
                                      url: parent.url+i.cmd,
                                      app: i.cmd
                              });
                    }
                });
            } else if (data.result.appss_loop) {
                data.result.appss_loop.forEach(i => {
                    if ("xmlbrowser"===i.type) {
                        resp.items.push({
                                      title: i.name,
                                      command: [i.cmd, "items"],
                                      image: resolveImage(i.icon, i.image),
                                      params: ["want_url:1"],
                                      type: "group",
                                      url: parent.url+i.cmd,
                                      app: i.cmd
                              });
                    } else if ("xmlbrowser_search"===i.type) {
                        resp.items.push({
                                      title: i.name,
                                      command: [i.cmd, "items"],
                                      image: resolveImage(i.icon, i.image),
                                      icon: "search",
                                      params: ["want_url:1", "search:"+TERM_PLACEHOLDER],
                                      type: "xmlsearch",
                                      url: parent.url+i.cmd,
                                      app: i.cmd
                              });
                    }
                });
                resp.subtitle=i18np("1 App", "%1 Apps", data.result.count);
            } else if (data.result.loop_loop) {
                var topLevelFavourites = parent.id===undefined && "favorites"===parent.type;
                data.result.loop_loop.forEach(i => {
                    if ("text"===i.type || "textarea"===i.type) {
                        resp.items.push({
                                      title: i.name ? i.name : i.title,
                                      type: "text",
                                      id: i.id
                                   });
                    } else if ("search"===i.type) {
                        resp.items.push({
                                      title: i.name,
                                      command: [i.cmd ? i.cmd : parent.command[0], "items"],
                                      image: resolveImage(i.icon, i.image),
                                      icon: "search",
                                      params: ["want_url:1", "item_id:"+i.id, "search:"+TERM_PLACEHOLDER],
                                      type: "xmlsearch", // Hack, so that we don't think this is library search...
                                      url: parent.url+i.cmd+i.id,
                                      app: parent.app
                                   });
                    } else if (i.hasitems>0) {
                        resp.items.push({
                                      title: i.name,
                                      command: parent.command,
                                      image: resolveImage(i.icon, i.image),
                                      icon: "folder"==i.type || "url"==i.type ? "folder" : "chevron_right",
                                      params: ["item_id:"+i.id, "want_url:1"],
                                      type: "group",
                                      url: parent.url+i.cmd+i.id,
                                      app: parent.app,
                                      actions: "favorites"===parent.type 
                                                    ? topLevelFavourites
                                                        ? [PLAY_ACTION, ADD_ACTION, DIVIDER, RENAME_FAV_ACTION, REMOVE_FROM_FAV_ACTION]
                                                        : [PLAY_ACTION, ADD_ACTION, DIVIDER, REMOVE_FROM_FAV_ACTION]
                                                    : undefined,
                                      id: i.id
                                   });
                    } else if (i.isaudio === 1) {
                        resp.items.push({
                                      title: i.name,
                                      url: i.url,
                                      image: resolveImage(i.icon, i.image),
                                      icon: i.url && (i.url.startsWith("http:") || i.url.startsWith("https:")) ? "wifi_tethering" : "music_note", 
                                      type: "track",
                                      actions: topLevelFavourites
                                                    ? [PLAY_ACTION, ADD_ACTION, DIVIDER, RENAME_FAV_ACTION, REMOVE_FROM_FAV_ACTION]
                                                    : [PLAY_ACTION, ADD_ACTION, DIVIDER, "favorites"===parent.type ? REMOVE_FROM_FAV_ACTION : ADD_TO_FAV_ACTION],
                                      app: parent.app,
                                      id: i.id
                                   });
                    }
                });

                if (data.result.loop_loop.length === data.result.count && topLevelFavourites) {
                    // Have all favourites, so sort...
                    resp.items.sort(itemSort);
                }
            } else if (0===data.result.count && data.result.networkerror) {
                resp.items.push({title: i18n("Failed to retrieve listing. (%1)", data.result.networkerror), type: "text"});
            }
        }
    }
    return resp;
}

