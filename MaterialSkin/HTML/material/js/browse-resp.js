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
                resp.items.push({header: "Artists"});
                data.result.contributors_loop.forEach(i => {
                    resp.items.push({
                                  url: "artist_id:"+i.contributor_id,
                                  title: i.contributor,
                                  command: ["albums"],
                                  image: artistImages ? lmsServerAddress+"/imageproxy/mai/artist/" + i.contributor_id + "/image_100x100_o" : undefined,
                                  icon: artistImages ? undefined : "person",
                                  params: ["artist_id:"+ i.contributor_id, "tags:jly", "sort:yearalbum"], // TODO: Make configurable
                                  actions: [PLAY_ACTION, ADD_ACTION], // TODO , DIVIDER, ADD_TO_FAV_ACTION],
                                  type: "group"
                              });
                });
            }
            if (data.result.albums_loop && data.result.albums_count>0) {
                resp.items.push({header: "Albums"});
                data.result.albums_loop.forEach(i => {
                    resp.items.push({
                                  url: "album_id:"+i.album_id,
                                  title: i.album,
                                  command: ["tracks"],
                                  image: lmsServerAddress+"/music/" + i.artwork + "/cover_100x100_o"  ,
                                  params: ["album_id:"+ i.album_id, "tags:Adt", "sort:tracknum"],
                                  actions: [PLAY_ACTION, ADD_ACTION], // TODO , DIVIDER, ADD_TO_FAV_ACTION],
                                  type: "group"
                              });
                });
            }
            if (data.result.tracks_loop && data.result.tracks_count>0) {
                resp.items.push({header: "Tracks"});
                data.result.tracks_loop.forEach(i => {
                    resp.items.push({
                                  url: "track_id:"+i.track_id,
                                  title: i.track,
                                  image: lmsServerAddress+"/music/" + i.coverid + "/cover_100x100_o"  ,
                                  actions: [PLAY_ACTION, ADD_ACTION], // TODO , DIVIDER, ADD_TO_FAV_ACTION],
                                  type: "track"
                              });
                });
            }
            if (data.result.genres_loop && data.result.genres_count>0) {
                resp.items.push({header: "Genres"});
                data.result.genres_loop.forEach(i => {
                    resp.items.push({
                                  url: "genre_id:"+i.genre_id,
                                  title: i.genre,
                                  command: ["artists"],
                                  //icon: "label",
                                  params: ["genre_id:"+ i.genre_id],
                                  actions: [PLAY_ACTION, ADD_ACTION], // TODO , DIVIDER, ADD_TO_FAV_ACTION],
                                  type: "group"
                              });
                });
            }
        } else if ("favorites"===parent.type) { // TODO: Combine with loop_loop below!!!!
            if (data.result.loop_loop) {
                // TODO: Detect acrtist, albums, tracks, genres?
                var streams=[];
                var other=[]; 
                data.result.loop_loop.forEach(i => {
                    if (i.url && (i.url.startsWith("http://") || i.url.startsWith("https://"))) {
                        streams.push({
                                  title: i.name,
                                  command: ["favorites"],
                                  //icon: "wifi_tethering",
                                  // TODO ?? params: ["favorite_id:"+ i.id, "tags:jly"],
                                  actions: [PLAY_ACTION, ADD_ACTION, DIVIDER, REMOVE_FROM_FAV_ACTION],
                                  type: "track",
                                  app: "favorites",
                                  id: i.id
                              });
                    } else {
                        other.push({
                                  title: i.name,
                                  command: ["favorites"],
                                  //icon: "audio"===i.type ? "music_note" : "playlist"===i.type ? "list" : "favorite", // TODO: Album covers? Artist images?
                                  // TODO ?? params: ["favorite_id:"+ i.id, "tags:jly"],
                                  actions: [PLAY_ACTION, ADD_ACTION, DIVIDER, REMOVE_FROM_FAV_ACTION],
                                  type: "track", // TODO: i.hasitems>0 ? group : track
                                  app: "favorites",
                                  id: i.id
                              });
                    }
                });
                if (streams.length>0 && other.length>0) {
                    resp.items.push({header: "Streams"});
                    resp.items = [].concat(resp.items, streams);
                    resp.items.push({header: "Other"});
                    resp.items = [].concat(resp.items, other);
                    var numStreams = (streams.length+1)/2;
                    var numOther = (other.length+1)/2;
                    resp.subtitle=(1==numStreams ? "1 Stream" : (numStreams+" Streams")) + ", " + (numOther+" Other");
                } else if (streams.length>0) {
                    resp.items = streams;
                    resp.subtitle=1==data.result.loop_loop.length ? "1 Stream" : (data.result.loop_loop.length+" Streams");                    
                } else {
                    resp.items = other;
                    resp.subtitle=1==data.result.loop_loop.length ? "1 Favourite" : (data.result.loop_loop.length+" Favourites");
                }
            }
        } else {
            if (data.result.artists_loop) {
                data.result.artists_loop.forEach(i => {
                    resp.items.push({
                                  url: "artist_id:"+i.id,
                                  title: i.artist,
                                  command: ["albums"],
                                  image: artistImages ? lmsServerAddress+"/imageproxy/mai/artist/" + i.id + "/image_100x100_o" : undefined,
                                  params: ["artist_id:"+ i.id, "tags:jly", "sort:yearalbum"], // TODO: Make configurable
                                  actions: [PLAY_ACTION, ADD_ACTION], // TODO , DIVIDER, ADD_TO_FAV_ACTION],
                                  type: "group"
                              });
                });
                resp.subtitle=1==data.result.count ? "1 Artist" : (data.result.count+" Artists");
            } else if (data.result.albums_loop) {
                resp.actions=[ADD_ACTION, PLAY_ACTION];
                data.result.albums_loop.forEach(i => {
                    // Bug on my system? There is an 'No Album' entry with no tracks!
                    if (undefined!==i.year && 0==i.year && i.artist && "No Album"===i.album && "Various Artists"===i.artist) {
                        return;
                    }
                    var title = i.album;
                    var subtitle;
                    if ("artist" === parent) {
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
                                  actions: [PLAY_ACTION, ADD_ACTION], // TODO , DIVIDER, ADD_TO_FAV_ACTION],
                                  type: "group"
                              });
                });
                if ("newmusic"===parent) {
                    resp.subtitle=1==data.result.albums_loop.length ? "Newest Album" : (data.result.albums_loop.length+" Newest Albums");
                } else {
                    resp.subtitle=1==data.result.count ? "1 Album" : (data.result.count+" Albums");
                }
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
                                  actions: [PLAY_ACTION, ADD_ACTION], // TODO , DIVIDER, ADD_TO_FAV_ACTION],
                                  type: "track"
                              });
                });
                resp.subtitle=1===data.result.count ? "1 Track" : (data.result.count+" Tracks");
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
                                  actions: [PLAY_ACTION, ADD_ACTION], // TODO , DIVIDER, ADD_TO_FAV_ACTION],
                                  type: "group"
                              });
                });
                resp.subtitle=1==data.result.count ? "1 Genre" : (data.result.count+" Genres");
            } else if (data.result.playlists_loop) {
                data.result.playlists_loop.forEach(i => {
                    resp.items.push({
                                  url: "playlist_id:"+i.id,
                                  title: i.playlist,
                                  command: ["playlists", "tracks"],
                                  //icon: "list",
                                  params: ["playlist_id:"+ i.id],
                                  actions: [PLAY_ACTION, ADD_ACTION, DIVIDER, /* TODO ADD_TO_FAV_ACTION,*/ /*TODO RENAME_ACTION,*/ DELETE_ACTION],
                                  type: "group"
                              });
                });
                resp.subtitle=1==data.result.count ? "1 Playlist" : (data.result.count+" Playlists");
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
                                  actions: [PLAY_ACTION, ADD_ACTION], // TODO , DIVIDER, ADD_TO_FAV_ACTION],
                                  type: "track"
                              });
                });
                resp.subtitle=1===data.result.count ? "1 Track" : (data.result.count+" Tracks");
            } else if (data.result.years_loop) {
                data.result.years_loop.forEach(i => {
                    resp.items.push({
                                  url: "year:"+i.year,
                                  title: i.year,
                                  command: ["albums"],
                                  //icon: "date_range",
                                  params: ["year:"+ i.year, "tags:ajly"],
                                  actions: [PLAY_ACTION, ADD_ACTION], // TODO , DIVIDER, ADD_TO_FAV_ACTION],
                                  type: "group"
                              });
                });
                resp.subtitle=1==data.result.count ? "1 Year" : (data.result.count+" Years");
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
                                      params: ["want_url:1", "search:"+SEARCH_TERM_PLACEHOLDER],
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
                                      params: ["want_url:1", "search:"+SEARCH_TERM_PLACEHOLDER],
                                      type: "xmlsearch",
                                      url: parent.url+i.cmd,
                                      app: i.cmd
                              });
                    }
                });
                resp.subtitle=1==data.result.count ? "1 App" : (data.result.count+" Apps");
            } else if (data.result.loop_loop) {
                data.result.loop_loop.forEach(i => {
                    if (i.isaudio === 1) {
                        resp.items.push({
                                      title: i.name,
                                      url: i.url,
                                      image: resolveImage(i.icon, i.image),
                                      icon: "wifi_tethering",
                                      type: i.hasitems ? "group" : "track",
                                      command: i.hasitems ? [parent.app, "items"] : undefined,
                                      params: i.hasitems ? ["item_id:"+i.id, "want_url:1"] : undefined,
                                      actions: [PLAY_ACTION, ADD_ACTION, DIVIDER, ADD_TO_FAV_ACTION],
                                      app: parent.app,
                                      id: i.id
                                   });
                    } else if ("text"===i.type) {
                        resp.items.push({
                                      title: i.name,
                                      type: "text",
                                      id: i.id
                                   });
                    } else if ("search"===i.type) {
                        resp.items.push({
                                      title: i.name,
                                      command: [i.cmd ? i.cmd : parent.command[0], "items"],
                                      image: resolveImage(i.icon, i.image),
                                      icon: "search",
                                      params: ["want_url:1", "item_id:"+i.id, "search:"+SEARCH_TERM_PLACEHOLDER],
                                      type: "xmlsearch", // Hack, so that we don't think this is library search...
                                      url: parent.url+i.cmd+i.id,
                                      app: parent.app
                                   });
                    } else if (i.hasitems>0) {
                        resp.items.push({
                                      title: i.name,
                                      command: parent.command,
                                      image: resolveImage(i.icon, i.image),
                                      icon: "folder",
                                      params: ["item_id:"+i.id, "want_url:1"],
                                      type: "group",
                                      url: parent.url+i.cmd+i.id,
                                      app: parent.app,
                                      //TODO actions: [ADD_TO_FAV_ACTION] 
                                   });
                    }
                });
            }
        }
    }
    return resp;
}

