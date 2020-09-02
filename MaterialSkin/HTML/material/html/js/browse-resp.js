/**
 * LMS-Material
 *
 * Copyright (c) 2018-2020 Craig Drummond <craig.p.drummond@gmail.com>
 * MIT license.
 */
'use strict';

const MORE_COMMANDS = new Set(["item_add", "item_insert", "itemplay"/*, "item_fav"*/]);

function itemText(i) {
    return i.title ? i.title : i.name ? i.name : i.caption ? i.caption : i.credits ? i.credits : undefined;
}

function removeDiactrics(key) {
    if (undefined!=key && key.length==1) {
        var code = key.charCodeAt(0);
        if (code>127) { // Non-ASCII...
            return key.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        }
    }
    return key;
}

function parseBrowseResp(data, parent, options, cacheKey, parentCommand, parentGenre) {
    // NOTE: If add key to resp, then update addToCache in utils.js
    var resp = {items: [], baseActions:[], canUseGrid: false, jumplist:[], numAudioItems:0 };

    try {
    if (data && data.result) {
        logJsonMessage("RESP", data);
        var command = data && data.params && data.params.length>1 && data.params[1] && data.params[1].length>1 ? data.params[1][0] : undefined;
        var isMusicIpMoods = command == "musicip" && data.params[1].length>0 && data.params[1][1]=="moods";

        if (isMusicIpMoods && data.result.item_loop) {
            for (var idx=0, loop=data.result.item_loop, loopLen=loop.length; idx<loopLen; ++idx) {
                var i = loop[idx];
                if (i.actions && i.actions.go && i.actions.go.params && i.actions.go.params.mood) {
                    resp.items.push({id: "mood://"+i.actions.go.params.mood,
                                     title: i.text,
                                     actions: i.actions,
                                     stdItem: STD_ITEM_MUSICIP_MOOD,
                                     isUrl: true});
                }
            }
            resp.subtitle=0==resp.items.length ? i18n("Empty") : i18np("1 Item", "%1 Items", resp.items.length);
        } else if (data.result.item_loop) {  // SlimBrowse response
            var playAction = false;
            var addAction = false;
            var insertAction = false;
            var moreAction = false;
            var isFavorites = parent && parent.isFavFolder ? true : false;
            var isPlaylists = parent && parent.section == SECTION_PLAYLISTS;
            var isRadios = parent && parent.section == SECTION_RADIO;
            var isRadiosTop = isRadios && parent.id == TOP_RADIO_ID;
            var isApps = parent && parent.id == TOP_APPS_ID;
            var isPodcastList = command == "podcasts" && 5==data.params[1].length && "items" == data.params[1][1] && "menu:podcasts"==data.params[1][4];
            var isBmf = command == "browselibrary" && data.params[1].length>=5 && data.params[1].indexOf("mode:bmf")>0;
            var isCustomBrowse = command == "custombrowse" ;
            var isMusicIpMix = command == "musicip" && data.params[1].length>0 && data.params[1][1]=="mix";

            var haveWithIcons = false;
            var haveWithoutIcons = false;
            var menu = undefined;
            var types = new Set();
            var maybeAllowGrid = command!="trackstat"; // && !isFavorites; // && command!="playhistory";
            var radioImages = new Set();
            var numImages = 0;

            resp.canUseGrid = maybeAllowGrid && data.result.window && data.result.window.windowStyle && (data.result.window.windowStyle=="icon_list" || data.result.window.windowStyle=="home_menu") ? true : false;

            if (data.result.base && data.result.base.actions) {
                resp.baseActions = data.result.base.actions;
                playAction = undefined != resp.baseActions[ACTIONS[PLAY_ACTION].cmd];
                addAction = undefined != resp.baseActions[ACTIONS[ADD_ACTION].cmd];
                insertAction = undefined != resp.baseActions[ACTIONS[INSERT_ACTION].cmd];
                moreAction = undefined!=resp.baseActions[ACTIONS[MORE_ACTION].cmd];
                if (resp.baseActions[ACTIONS[PLAY_ACTION].cmd] && resp.baseActions[ACTIONS[PLAY_ACTION].cmd].params && resp.baseActions[ACTIONS[PLAY_ACTION].cmd].params.menu) {
                    menu = resp.baseActions[ACTIONS[PLAY_ACTION].cmd].params.menu;
                }
            }

            for (var idx=0, loop=data.result.item_loop, loopLen=loop.length; idx<loopLen; ++idx) {
                var i = loop[idx];
                if (!i.text || i.showBigArtwork==1) {
                    if (i.url && "musicartistinfo"==command) { // Artist images...
                        resp.items.push({id: "image:"+resp.items.length,
                                         title: itemText(i),
                                         type: "image",
                                         image: resolveImageUrl(i.url, LMS_IMAGE_SIZE),
                                         src: resolveImageUrl(i.url),
                                         w: 0,
                                         h: 0});
                        resp.canUseGrid = true;
                        numImages++;
                    } else {
                        data.result.count--;
                    }
                    continue;
                }
                if (resp.items.length==data.result.count-1 && i.type=="playlist" && i['icon-id']=='html/images/albums.png' && !isFavorites) {
                    // Remove 'All Songs' entry
                    data.result.count--;
                    continue;
                }
                var addedPlayAction = false;

                if ("text"==i.type) {
                    // Exclude 'More' Play,Insert commands
                    if (i.style && MORE_COMMANDS.has(i.style)) {
                        data.result.count--;
                        continue;
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
                    i.title=i.title.replace(/&#(\d+);/g, function(m, dec) { return String.fromCharCode(dec); });
                    i.title=i.title.replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
                }

                i.section = parent ? parent.section : undefined;

                if (!i.type && !i.style && i.actions && i.actions.go && i.actions.go.params) {
                    for (var key in i.actions.go.params) {
                        if (i.actions.go.params[key]==TERM_PLACEHOLDER) {
                            i.type = "entry";
                        }
                    }
                }

                // Issue #58 Pretend 'text' with a go action is just a text line, so that click() works
                if (undefined==i.type && !i.style && i.actions && i.actions.go && !i.icon && !i["icon-id"] && !i.image && !i.window &&
                    (!i.addAction || i.actions.go.nextWindow)) {
                    i.type="text";
                }

                i.text = undefined;
                i.image = resolveImage(i.icon ? i.icon : i["icon-id"], undefined, LMS_IMAGE_SIZE);

                if (!i.image && i.commonParams && i.commonParams.album_id) {
                    i.image = resolveImage("music/0/cover" + LMS_IMAGE_SIZE);
                }

                if (i.image) {
                    haveWithIcons = true;
                } else {
                    haveWithoutIcons = true;
                }
                i.menu=[];

                if (i.type=="artist" || i.type=="album" || i.type=="year" || i.type=="genre" || isCustomBrowse ||
                    i.type=="playlist" || i.type=="audio" || i.style=="itemplay" || (i.goAction && (i.goAction == "playControl" || i.goAction == "play"))) {
                    // Convert NUM. TITLE into 0NUM TITLE - e.g 1. Wibble => 01 Wibble
                    /* Removed, as converts titles "22. Acacia Avenue" to "22 <dot> Acacia Avenue"
                    if (/^[0-9]+\.\s.+/.test(i.title)) {
                        var dot = i.title.indexOf('.');
                        var num = parseInt(i.title.substring(0, dot));
                        var text = i.title.substring(dot+2, i.title.length);
                        i.title = (num>9 ? num : ("0" + num))+SEPARATOR+text;
                    }
                    */
                    if ((i.params && hasPlayableId(i.params)) || (i.commonParams && hasPlayableId(i.commonParams)) ||
                        (i.actions && i.actions.add && i.actions.add.params && hasPlayableId(i.actions.add.params)) || isCustomBrowse) {
                        if (playAction) {
                            i.menu.push(PLAY_ACTION);
                            addedPlayAction = true;
                            resp.allowHoverBtns = true;
                            resp.numAudioItems++;
                        }
                        if (insertAction) {
                            i.menu.push(INSERT_ACTION);
                            addedPlayAction = true;
                        }
                        if (addAction) {
                            i.menu.push(ADD_ACTION);
                            addedPlayAction = true;
                        }
                    }
                }
                var addedDivider = false;
                if (isFavorites) {
                    i.pos = resp.items.length;
                    if (i.menu.length>0) {
                        i.menu.push(DIVIDER);
                        addedDivider = true;
                    }
                    if (!i.type) {
                        i.isFavFolder = true;
                        resp.allowHoverBtns = true;
                    }
                    i.menu.push(i.isFavFolder ? RENAME_ACTION : EDIT_ACTION);
                    i.menu.push(i.isFavFolder ? DELETE_FAV_FOLDER_ACTION : REMOVE_FROM_FAV_ACTION);
                    if (undefined!=parent && parent.id!=TOP_FAVORITES_ID) {
                        i.menu.push(MOVE_FAV_TO_PARENT_ACTION);
                    }
                    if (i.isFavFolder && (!i.image || i.image.startsWith("/html/images/favorites"+LMS_IMAGE_SIZE))) {
                        i.icon="folder";
                        i.image=undefined;
                    } else if (!i.isFavFolder && undefined!=i.presetParams && undefined!=i.presetParams.favorites_url) {
                        if (i.presetParams.favorites_url.startsWith("db:album.title") && i.presetParams.icon=="html/images/albums.png") {
                            i.icon="album";
                            i.image=undefined;
                        } else if (i.presetParams.favorites_url.startsWith("db:contributor.name")) {
                            if (i.presetParams.icon=="html/images/artists.png" || !(lmsOptions.infoPlugin && lmsOptions.artistImages)) {
                                i.svg="artist";
                                i.image=undefined;
                            }
                        } else if (i.presetParams.favorites_url.startsWith("db:genre.name") && i.presetParams.icon=="html/images/genres.png") {
                            i.icon="label";
                            i.image=undefined;
                        } else if (i.presetParams.favorites_url.startsWith("db:year.id") && i.presetParams.icon=="html/images/years.png") {
                            i.icon="date_range";
                            i.image=undefined;
                        } else if (i.presetParams.favorites_url.startsWith("file://") && i.presetParams.icon=="html/images/playlists.png") {
                            i.icon="list";
                            i.image=undefined;
                        } else if (i.presetParams.favorites_url.startsWith("dynamicplaylist://") && i.presetParams.icon=="plugins/DynamicPlayList/html/images/dynamicplaylist.png") {
                            i.svg="dice-list";
                            i.image=undefined;
                        } else if (i.presetParams.icon=="html/images/radio.png") {
                            i.svg="radio-station";
                            i.image=undefined;
                        } else if (i.presetParams.icon=="plugins/RandomPlay/html/images/icon.png") {
                            i.svg="dice-multiple";
                            i.image=undefined;
                        } else if (i['icon-id']=="html/images/favorites.png") {
                            i.icon="favorite";
                            i.image=undefined;
                        }
                    } else if (i['icon-id']=="html/images/favorites.png") {
                        i.icon="favorite";
                        i.image=undefined;
                    }
                } else if (i.presetParams) {
                    if (i.menu.length>0) {
                        i.menu.push(DIVIDER);
                        addedDivider = true;
                    }
                    i.menu.push(ADD_TO_FAV_ACTION);
                }

                if (isPlaylists && i.type=="playlist") {
                    if (!addedDivider && i.menu.length>0) {
                        i.menu.push(DIVIDER);
                        addedDivider = true;
                    }
                    i.menu.push(RENAME_ACTION);
                    i.menu.push(DELETE_ACTION);
                }

                if (isPodcastList) {
                    if (!addedDivider && i.menu.length>0) {
                        i.menu.push(DIVIDER);
                        addedDivider = true;
                    }
                    i.menu.push(RENAME_ACTION);
                    i.menu.push(REMOVE_PODCAST_ACTION);
                    i.section=SECTION_PODCASTS;
                    i.index=resp.items.length;
                    if ("link"==i.type) {
                        i.menu = [];
                    }
                }

                if (!i.type && i.actions && i.actions.go && i.actions.go.params) {
                    for (var p=0, plen=i.actions.go.params.length; p<plen; ++p) {
                        if (TERM_PLACEHOLDER == i.actions.go.params[p]) {
                            i.type = "search";
                            break;
                        }
                    }
                }

                if (!i.type && i.style && i.style=="itemNoAction" && (!i.actions || (!i.actions.go && !i.actions.do))) { // itemNoAction with an action? DynamicPlaylists...
                    i.type = "text";
                }

                if (isApps && i.actions && i.actions.go && i.actions.go.params && i.actions.go.params.menu) {
                    if ("myapps" == i.actions.go.params.menu) { // mysqueezebox.com apps
                        if (i.actions.go.params.item_id) {
                            i.id = fixId(i.actions.go.params.item_id, "myapps");
                        }
                    } else {
                        i.id = "apps."+i.actions.go.params.menu;
                    }

                    if (i.id) {
                        if (!addedDivider && i.menu.length>0) {
                            i.menu.push(DIVIDER);
                            addedDivider = true;
                        }
                        i.menu.push(options.pinned.has(i.id) ? UNPIN_ACTION : PIN_ACTION);
                    }
                    mapIcon(i, command);
                } else if (isPlaylists && i.commonParams && i.commonParams.playlist_id) {
                    i.id = "playlist_id:"+i.commonParams.playlist_id;
                } else if (isRadios) {
                    if (i.type!="search") {
                        if (!i.id) {
                            if (i.params && i.params.item_id) {
                                i.id = fixId(i.params.item_id, undefined==menu ? "radio" : menu);
                            } else if (i.presetParams && i.presetParams.favorites_url) {
                                i.id = "radio:"+i.presetParams.favorites_url;
                            } else if (i.actions && i.actions.go && i.actions.go.params && i.actions.go.params.item_id) {
                                i.id = "item_id:"+i.actions.go.params.item_id;
                            } else if (parent && parent.id && TOP_RADIO_ID!=parent.id) {
                                i.id = parent.id+"."+i.title;
                            } else {
                                i.id = "radio:"+i.title;
                            }
                        }
                        if (i.menu.length>0 && (i.icon || i.image) && i.type!="entry" && i.presetParams && i.presetParams.favorites_url) {
                            // Only allow to pin if we can play!
                            if (!addedDivider && i.menu.length>0) {
                                i.menu.push(DIVIDER);
                                addedDivider = true;
                            }
                            i.isRadio = true;
                            i.menu.push(options.pinned.has(i.id) ? UNPIN_ACTION : PIN_ACTION);
                        } else if (data.params[1][0]=='radios' && i.type!='entry' && i.actions && i.actions.go && i.actions.go.params && i.actions.go.params.menu) {
                            i.id = 'radio:'+i.actions.go.params.menu;
                            i.menu.push(options.pinned.has(i.id) ? UNPIN_ACTION : PIN_ACTION);
                        }
                    }
                    if (isRadiosTop && i['icon-id']) {
                        if (i.actions && i.actions.go && i.actions.go.params && i.actions.go.params.menu=='language') {
                            i['icon-id']='/language.png';
                        }
                        mapIcon(i, undefined, {icon:undefined, svg:"radio-station"});
                    } else {
                        radioImages.add(i.image);
                    }
                } else if (isBmf) {
                    i.icon = i.type=="playlist"
                        ? i.actions && i.actions.play && i.actions.play.params && i.actions.play.params.folder_id
                            ? "folder"
                            : "list"
                        : isPlaylist(i.title)
                            ? "list"
                            : i.type=="audio"
                                ? "music_note"
                                : "crop_portrait";
                } else if (!isFavorites) { // move/rename on favs needs ids of a.b.c (created below)
                    if (i.params && i.params.item_id) {
                        i.id = "item_id:"+i.params.item_id;
                    } else if (i.actions && i.actions.go && i.actions.go.params && i.actions.go.params.item_id) {
                        i.id = "item_id:"+i.actions.go.params.item_id;
                    }
                    mapIcon(i);
                }

                if (!i.id) {
                    if (i.params && i.params.track_id) {
                        i.id = uniqueId("track_id:"+i.params.track_id); // Incase of duplicates?
                    } else if (parent.id.startsWith(TOP_ID_PREFIX)) {
                        i.id="item_id:"+resp.items.length;
                    } else {
                        i.id=parent.id+"."+resp.items.length;
                    }
                }

                // TrackStat...
                if (!i.type && i.params && i.params.track) {
                    i.type = "audio";
                }

                if (addedPlayAction) {
                    if (!addedDivider) {
                        i.menu.push(DIVIDER);
                        addedDivider = true;
                    }
                    if ((isMusicIpMix && i.trackType && i.trackType == "local") /*||
                        (!isPlaylists && !isFavorites && isAudioTrack(i) && (i.url || (i.presetParams && i.presetParams.favorites_url)))*/) {
                        i.saveableTrack = true; // Can save track list to playlist...
                        i.menu.push(ADD_TO_PLAYLIST_ACTION);
                    }
                    i.menu.push(SELECT_ACTION);
                }

                // Only show 'More' action if:
                //    'more' is in baseActions and item has item_id
                //    - OR -
                //    'more' is in item's actions. #57
                if ( !isFavorites &&
                     ( (i.commonParams && (i.commonParams.artist_id || i.commonParams.album_id || i.commonParams.track_id)) ||
                       ( ((moreAction && i.menu.length>0 && i.params && i.params.item_id) || (i.actions && i.actions.more && i.actions.more.cmd)) &&
                         !(i.actions && i.actions.go && i.actions.go.params && i.actions.go.params.year))) ) {
                    if (!addedDivider && i.menu.length>0) {
                        i.menu.push(DIVIDER);
                        addedDivider = true;
                    }
                    i.menu.push(MORE_ACTION);
                }

                var key = removeDiactrics(i.textkey);
                if (undefined!=key && (resp.jumplist.length==0 || resp.jumplist[resp.jumplist.length-1].key!=key)) {
                    resp.jumplist.push({key: key, index: resp.items.length});
                }
                if (isFavorites) {
                    i.draggable = true;
                    i.realIndex = resp.items.length; // So items are deleted in correct order, even when list is sorted.
                }
                if (i.type=="text" && i.title.startsWith("<")) {
                    i.type="html";
                }

                /* Play/add of a track from a favourited album adds all tracks :( this section works-around this... */
                if (!isFavorites && parent && parent.section == SECTION_FAVORITES && i.commonParams && i.commonParams.track_id) {
                    i.id = "track_id:"+i.commonParams.track_id;
                    i.stdItem = STD_ITEM_TRACK;
                    i.type = i.presetParams = i.commonParams = i.menu = i.playallParams = i.addallParams = i.goAction = i.style = undefined;
                }

                resp.items.push(i);
                types.add(i.type);
            }
            /* ...continuation of favroutied album add/play tack issue... */
            if (!isFavorites && parent && parent.section == SECTION_FAVORITES && resp.items.length>0 && resp.items[0].stdItem == STD_ITEM_TRACK) {
                resp.baseActions = [];
            }
            if (resp.canUseGrid && (types.has("text") || types.has("search") || types.has("entry"))) {
                resp.canUseGrid = false;
            } else if (!resp.canUseGrid && maybeAllowGrid && haveWithIcons && 1==types.size &&
               (!types.has("text") && !types.has("search") && !types.has("entry") && !types.has(undefined))) {
                resp.canUseGrid = true;
            }

            if (isRadios && !isRadiosTop && resp.items.length>1 && 1==radioImages.size) { // && parent && parent.id.startsWith("radio:")) {
                // If listing a radio app's entries and all images are the same, then hide images. e.g. iHeartRadio and RadioNet
                for (var i=0, len=resp.items.length; i<len; ++i) {
                    resp.items[i].image = resp.items[i].icon = undefined;
                }
                resp.canUseGrid=false;
            } else if (haveWithoutIcons && haveWithIcons) {
                var defAlbumCover = resolveImage("music/0/cover" + LMS_IMAGE_SIZE);
                var defArtistImage = resolveImage("html/images/artists" + LMS_IMAGE_SIZE);

                for (var i=0, len=resp.items.length; i<len; ++i) {
                    var item=resp.items[i];
                    if (!item.image) {
                        if (item.type=="album" || (item.window && (item.window.titleStyle=="album" && item.window.menuStyle=="album") && item.actions && item.actions.go)) {
                            item.image = defAlbumCover;
                        } else if (item.type=="artist") {
                            item.image = defArtistImage;
                        } else {
                            // Found an item without and image and not marked as an artist or album, no
                            // default image set - so disable grid usage.
                            // See: https://forums.slimdevices.com/showthread.php?109624-Announce-Material-Skin&p=944597&viewfull=1#post944597
                            resp.canUseGrid = false;
                            break;
                        }
                    }
                }
            }
            if (1==resp.items.length && 'text'==resp.items[0].type && 'itemNoAction'==resp.items[0].style && msgIsEmpty(resp.items[0].title)) {
                resp.items=[];
            }

            if (isApps) {
                resp.items.sort(titleSort);
            } else if (isPodcastList) {
                resp.items.sort(podcastSort);
            } else if (isFavorites) {
                resp.items.sort(options.sortFavorites ? favSort : partialFavSort);
            }
            if (numImages>0 && numImages==resp.items.length) {
                resp.subtitle=i18np("1 Image", "%1 Images", resp.items.length);
            } else {
                if (data.result.window && data.result.window.textarea && resp.items.length<LMS_MAX_NON_SCROLLER_ITEMS) {
                    var text = replaceNewLines(data.result.window.textarea);
                    if (text.length>0) {
                        resp.items.unshift({
                                        title: text,
                                        type: text.startsWith("<") || text.indexOf("<br/>")>0 ? "html" : "text",
                                        id: parent.id+".textarea"
                                       });
                        resp.canUseGrid = false;
                    }
                }
                if (isMusicIpMix) {
                    resp.items.shift();
                    resp.subtitle=0==resp.items.length ? i18n("Empty") : i18np("1 Track", "%1 Tracks", resp.items.length);
                } else {
                    resp.subtitle=0==resp.items.length ? i18n("Empty") : i18np("1 Item", "%1 Items", resp.items.length);
                }
            }
        } else if (data.result.artists_loop) {
            var isComposers = false;
            var isConductors = false;
            var isBands = false;

            if (data.params && data.params.length>1) {
                for (var i=3, len=data.params[1].length; i<len; ++i) {
                    if (typeof data.params[1][i] === 'string' || data.params[1][i] instanceof String) {
                        var lower = data.params[1][i].toLowerCase();
                        if (lower.startsWith("role_id:")) {
                            if (lower=="role_id:composer") {
                                isComposers = true;
                            } else if (lower=="role_id:conductor") {
                                isConductors = true;
                            } else if (lower=="role_id:band") {
                                isBands = true;
                            }
                            break;
                        }
                    }
                }
            }

            resp.canUseGrid = lmsOptions.infoPlugin && lmsOptions.artistImages;
            for (var idx=0, loop=data.result.artists_loop, loopLen=loop.length; idx<loopLen; ++idx) {
                var i = loop[idx];
                var key = removeDiactrics(i.textkey);
                if (undefined!=key && (resp.jumplist.length==0 || resp.jumplist[resp.jumplist.length-1].key!=key)) {
                    resp.jumplist.push({key: key, index: resp.items.length});
                }
                var artist = {
                              id: "artist_id:"+i.id,
                              title: i.artist,
                              image: (lmsOptions.infoPlugin && lmsOptions.artistImages) ? "/imageproxy/mai/artist/" + i.id + "/image" + LMS_IMAGE_SIZE : undefined,
                              stdItem: STD_ITEM_ARTIST,
                              type: "group",
                              textkey: key
                          };
                resp.items.push(artist);
            }
            if (isComposers) {
                resp.subtitle=i18np("1 Composer", "%1 Composers", resp.items.length);
            } else if (isConductors) {
                resp.subtitle=i18np("1 Conductor", "%1 Conductors", resp.items.length);
            } else if (isBands) {
                resp.subtitle=i18np("1 Band", "%1 Bands", resp.items.length);
            } else {
                resp.subtitle=i18np("1 Artist", "%1 Artists", resp.items.length);
            }
            if (parent && parent.id && parent.id.startsWith("search:")) {
                resp.jumplist = []; // Search results NOT sorted???
            }
        } else if (data.result.albums_loop) {
            resp.canUseGrid = true;
            var jumpListYear = false;
            if (data.params && data.params.length>1) {
                for (var i=3, plen=data.params[1].length; i<plen; ++i) {
                    if (typeof data.params[1][i] === 'string' || data.params[1][i] instanceof String) {
                        var lower = data.params[1][i].toLowerCase();
                        if (lower.startsWith("sort:year")) {
                            jumpListYear = true;
                            break;
                        }
                    }
                }
            }

            for (var idx=0, loop=data.result.albums_loop, loopLen=loop.length; idx<loopLen; ++idx) {
                var i = loop[idx];

                // Bug on my system? There is a 'No Album' entry with no tracks!
                /*
                if (undefined!==i.year && 0==i.year && i.artist && "No Album"===i.album && "Various Artists"===i.artist) {
                    continue;
                }
                */

                var title = i.album;
                if (i.year && i.year>0) {
                    title+=" (" + i.year + ")";
                }
                var key = jumpListYear ? (""+i.year) : removeDiactrics(i.textkey);
                if (jumpListYear && key.length>2) {
                    key="'"+key.slice(-2);
                }
                if (undefined!=key && (resp.jumplist.length==0 || resp.jumplist[resp.jumplist.length-1].key!=key)) {
                    resp.jumplist.push({key: key, index: resp.items.length});
                }

                var album = {
                              id: "album_id:"+i.id,
                              artist_id: i.artist_id,
                              title: title,
                              subtitle: i.artist ? i.artist : undefined,
                              image: i.artwork_url
                                        ? resolveImageUrl(i.artwork_url, LMS_IMAGE_SIZE)
                                        : ("/music/" + i.artwork_track_id + "/cover" + LMS_IMAGE_SIZE),
                              stdItem: STD_ITEM_ALBUM,
                              type: "group",
                              origTitle: i.album,
                              textkey: key,
                              emblem: getEmblem(i.extid)
                          };
                resp.items.push(album);
            }
            resp.subtitle=i18np("1 Album", "%1 Albums", resp.items.length);
            if (parent && parent.id && parent.id.startsWith("search:")) {
                resp.jumplist = []; // Search results NOT sorted???
            }
        } else if (data.result.titles_loop) {
            var totalDuration=0;
            var allowPlayAlbum = (parent && parent.id && parent.id.startsWith("album_id:"));
            var isAllSongs = parent && parent.id && parent.id.startsWith("currentaction:");
            var showAlbumName = isAllSongs || (parent && parent.id && parent.id.startsWith("artist_id:"));
            var discs = new Map();
            var sortTracks = isAllSongs && parentCommand && getAlbumSort(parentCommand, parentGenre).startsWith("year");
            var isSearchResult = options.isSearch;

            if (data.params[1].length>=4 && data.params[1][0]=="tracks") {
                for (var p=0, plen=data.params[1].length; p<plen && (!allowPlayAlbum || !showAlbumName); ++p) {
                    if ((""+data.params[1][p]).startsWith("album_id:")) {
                        allowPlayAlbum = true;
                    } else if ((""+data.params[1][p]).startsWith("search:")) {
                        showAlbumName = true;
                    }
                }
            }

            var stdItem = allowPlayAlbum && data.result.count>1 ? STD_ITEM_ALBUM_TRACK : STD_ITEM_TRACK;
            for (var idx=0, loop=data.result.titles_loop, loopLen=loop.length; idx<loopLen; ++idx) {
                var i = loop[idx];

                var title = i.title;
                var duration = parseFloat(i.duration || 0);
                var tracknum = undefined==i.tracknum ? 0 : parseInt(i.tracknum);
                if (tracknum>0) {
                    title = (tracknum>9 ? tracknum : ("0" + tracknum))+SEPARATOR+title;
                    //title = tracknum + ". " + title; // SlimBrowse format
                    if (isSearchResult && undefined!=i.disc) {
                        title = i.disc+"."+title;
                    }
                }
                if (i.trackartist && (showAlbumName || (( (i.albumartist && i.trackartist !== i.albumartist) || (!i.albumartist && i.compilation=="1"))))) {
                     title+=SEPARATOR + i.trackartist;
                } else if (i.artist && (showAlbumName || ( (i.albumartist && i.artist !== i.albumartist) || (!i.albumartist && i.compilation=="1")))) {
                     title+=SEPARATOR + i.artist;
                }
                if (showAlbumName && i.album) {
                    title+=SEPARATOR + i.album;
                    if (i.year && i.year>0) {
                        title+=" (" + i.year + ")";
                    }
                }
                if (undefined!=i.disc && !isSearchResult) {
                    if (discs.has(i.disc)) {
                        var entry = discs.get(i.disc);
                        entry.total++;
                        entry.duration+=duration;
                    } else {
                        discs.set(i.disc, {pos: resp.items.length, total:1, duration:duration});
                    }
                }
                totalDuration+=duration;
                resp.items.push({
                              id: "track_id:"+i.id,
                              title: title,
                              subtitle: undefined!=i.rating ? ratingString(formatSeconds(i.duration), i.rating) : formatSeconds(i.duration),
                              //icon: "music_note",
                              stdItem: stdItem,
                              type: "track",
                              rating: i.rating,
                              image: showAlbumName ? ("/music/" + (""==i.coverid || undefined==i.coverid ? "0" : i.coverid) + "/cover" +LMS_IMAGE_SIZE) : undefined,
                              filter: FILTER_PREFIX+i.disc,
                              emblem: showAlbumName ? getEmblem(i.extid) : undefined,
                              tracknum: sortTracks && undefined!=i.tracknum ? tracknum : undefined,
                              disc: sortTracks && i.disc ? parseInt(i.disc) : undefined,
                              year: sortTracks && i.year ? parseInt(i.year) : undefined,
                              album: sortTracks || isSearchResult ? i.album : undefined,
                              artist: isSearchResult ? i.artist : undefined,
                              album_id: isSearchResult ? i.album_id : undefined,
                              artist_id: isSearchResult ? i.artist_id : undefined,
                              url: i.url
                          });
            }
            if (sortTracks) {
                resp.items.sort(yearAlbumTrackSort);
            }
            if (discs.size>1) {
                let d = 0;
                for (let k of discs.keys()) {
                    let disc = discs.get(k);
                    resp.items.splice(disc.pos+d, 0, {title: i18n("Disc %1", k)+SEPARATOR+i18np("1 Track", "%1 Tracks", disc.total)+" ("+formatSeconds(disc.duration)+")",
                                                      id:FILTER_PREFIX+k, header:true, menu:[PLAY_ALL_ACTION, INSERT_ALL_ACTION, ADD_ALL_ACTION]});
                    d++;
                }
            }
            resp.subtitle=i18np("1 Track", "%1 Tracks", resp.items.length-(discs.size>1 ? discs.size : 0));
            if (!(parent && parent.id && parent.id.startsWith("search:"))) {
                resp.subtitle+=" ("+formatSeconds(totalDuration)+")";
            }
        } else if (data.result.genres_loop) {
            for (var idx=0, loop=data.result.genres_loop, loopLen=loop.length; idx<loopLen; ++idx) {
                var i = loop[idx];
                var key = removeDiactrics(i.textkey);
                if (undefined!=key && (resp.jumplist.length==0 || resp.jumplist[resp.jumplist.length-1].key!=key)) {
                    resp.jumplist.push({key: key, index: resp.items.length});
                }
                resp.items.push({
                              id: "genre_id:"+i.id,
                              title: i.genre,
                              //icon: "label",
                              stdItem: STD_ITEM_GENRE,
                              type: "group",
                              textkey: key
                          });
            }
            resp.subtitle=i18np("1 Genre", "%1 Genres", resp.items.length);
        } else if (data.result.playlists_loop) {
            for (var idx=0, loop=data.result.playlists_loop, loopLen=loop.length; idx<loopLen; ++idx) {
                var i = loop[idx];
                var key = removeDiactrics(i.textkey);
                var isRemote = 1 == parseInt(i.remote);
                if (undefined!=key && (resp.jumplist.length==0 || resp.jumplist[resp.jumplist.length-1].key!=key)) {
                    resp.jumplist.push({key: key, index: resp.items.length});
                }
                resp.items.push({
                              id: "playlist_id:"+i.id,
                              title: i.playlist,
                              //icon: "list",
                              stdItem: isRemote ? STD_ITEM_REMOTE_PLAYLIST : STD_ITEM_PLAYLIST,
                              type: "group",
                              section: SECTION_PLAYLISTS,
                              url:  i.url,
                              remotePlaylist: isRemote
                          });
            }
            resp.subtitle=i18np("1 Playlist", "%1 Playlists", resp.items.length);
        } else if (data.result.playlisttracks_loop) {
            var totalDuration = 0;
            for (var idx=0, loop=data.result.playlisttracks_loop, loopLen=loop.length; idx<loopLen; ++idx) {
                var i = loop[idx];
                var title = i.title;
                if (i.artist) {
                    title+=SEPARATOR + i.artist;
                }
                if (!title) {
                    title=i18n("Unknown");
                }
                var duration = parseFloat(i.duration || 0);
                totalDuration+=duration;
                var subtitle = duration>0 ? formatSeconds(duration) : undefined;
                if (i.album) {
                    if (subtitle) {
                        subtitle+=SEPARATOR+i.album;
                    } else {
                        subtitle=i.album;
                    }
                }
                var isRemote = undefined!=parent && parent.remotePlaylist;
                resp.items.push({
                              id: uniqueId("track_id:"+i.id, resp.items.length),
                              title: title,
                              subtitle: subtitle,
                              image: i.artwork_url
                                        ? resolveImageUrl(i.artwork_url, LMS_IMAGE_SIZE)
                                        : ("/music/" + (""==i.coverid || undefined==i.coverid ? "0" : i.coverid) + "/cover" +LMS_IMAGE_SIZE),
                              //icon: "music_note",
                              stdItem: isRemote ? STD_ITEM_REMOTE_PLAYLIST_TRACK : STD_ITEM_PLAYLIST_TRACK,
                              type: "track",
                              draggable: !isRemote
                          });
            }
            resp.subtitle=i18np("1 Track", "%1 Tracks", resp.items.length);
            if (totalDuration>0) {
                resp.subtitle+=" ("+formatSeconds(totalDuration)+")";
            }
        } else if (data.result.years_loop) {
            for (var idx=0, loop=data.result.years_loop, loopLen=loop.length; idx<loopLen; ++idx) {
                var i = loop[idx];
                var key = i.textkey;
                if (undefined!=key && (resp.jumplist.length==0 || resp.jumplist[resp.jumplist.length-1].key!=key)) {
                    resp.jumplist.push({key: key, index: resp.items.length});
                }
                resp.items.push({
                              id: "year:"+i.year,
                              title: i.year,
                              //icon: "date_range",
                              stdItem: STD_ITEM_YEAR,
                              type: "group",
                              textkey: key
                          });
            }
            resp.subtitle=i18np("1 Year", "%1 Years", resp.items.length);
        } else if (0===data.result.count && data.result.networkerror) {
            resp.items.push({title: i18n("Failed to retrieve listing. (%1)", data.result.networkerror), type: "text"});
        } else if (data.result.data && data.result.data.constructor === Array && data.result.title) { // pictures?
            for (var idx=0, loop=data.result.data, loopLen=loop.length; idx<loopLen; ++idx) {
                var i = loop[idx];
                if (i.image) {
                    i.title = itemText(i);
                    i.id = "image:"+resp.items.length,
                    i.type = "image";
                    i.src = resolveImageUrl(i.image);
                    i.image = resolveImageUrl(i.image, LMS_IMAGE_SIZE);
                    i.w=0;
                    i.h=0;
                    resp.items.push(i);
                }
            }
            if (resp.items.length>0) {
                resp.title=data.result.title;
                resp.subtitle=i18np("1 Image", "%1 Images", resp.items.length);
                resp.canUseGrid = resp.forceGrid = true;
            }
        } else if (data.result.biography) {
            resp.items.push({   title: data.result.biography,
                                type: data.result.biography.startsWith("<") || data.result.biography.indexOf("<br/>")>0 ? "html" : "text",
                                id: parent.id+".0"
                            });
        } else if (data.result.albumreview) {
            resp.items.push({   title: data.result.albumreview,
                                type: data.result.albumreview.startsWith("<") || data.result.albumreview.indexOf("<br/>")>0 ? "html" : "text",
                                id: parent.id+".0"
                            });
        } else if (data.result.loop_loop) {
            var numImages = 0;
            for (var idx=0, loop=data.result.loop_loop, loopLen=loop.length; idx<loopLen; ++idx) {
                var i = loop[idx];
                var mappedIcon = mapIcon(i);
                i.title = itemText(i);
                i.image = mappedIcon ? undefined : resolveImage(i.icon, i.image, LMS_IMAGE_SIZE);
                if ("text"===i.type || "textarea"===i.type) {
                    if (i.title.length<75 && i.image) { // Possible image?
                        numImages++;
                    }
                    i.type="text";
                } else if ("search"===i.type) {
                    i.command = [i.cmd ? i.cmd : parent.command[0], "items"];
                    i.params = ["want_url:1", "item_id:"+i.id, "search:"+TERM_PLACEHOLDER];
                    i.image = mappedIcon ? undefined : resolveImage(i.icon, i.image, LMS_IMAGE_SIZE);
                    i.icon = "search";
                    i.type = "xmlsearch"; // Hack, so that we don't think this is library search...
                    i.id = parent.url+i.cmd+i.id;
                } else if (i.hasitems>0) {
                    i.command = parent.command;
                    i.params = ["item_id:"+i.id, "want_url:1"];
                    i.type = "group";
                    i.actions = i.isaudio === 1 ? [PLAY_ACTION, INSERT_ACTION, ADD_ACTION] : undefined;
                    i.id = "item_id:"+i.id;
                } else if (i.isaudio === 1) {
                    i.type = "track";
                    i.actions = [PLAY_ACTION, INSERT_ACTION, ADD_ACTION];
                    i.id = "item_id:"+i.id;
                }
                resp.items.push(i);
            }
            if (numImages>0 && numImages==resp.items.length) {
                resp.subtitle=i18np("1 Image", "%1 Images", resp.items.length);
                resp.canUseGrid = resp.forceGrid = true;
                for (var idx=0, loop=resp.items, loopLen=loop.length; idx<loopLen; ++idx) {
                    resp.items[idx].type = "image";
                    resp.items[idx].src = resolveImageUrl(i.image);
                    resp.items[idx].w=0;
                    resp.items[idx].h=0;
                }
            }
        }

        if (data.result.count>LMS_BATCH_SIZE) {
            resp.subtitle = i18n("Only showing %1 items", LMS_BATCH_SIZE);
        }

        if (cacheKey && lmsLastScan && canUseCache) { // canUseCache defined in utils.js
            resp.iscache=true;
            idbKeyval.set(cacheKey, resp);

            // Remove old album sorts
            if (data.params && data.params.length>1 && data.params[1].length>0 && data.params[1][0]=="albums") {
                var parts = cacheKey.split('-'+SORT_KEY);
                if (2==parts.length) {
                    parts = parts[1].split('-');
                    if (parts.length>1) {
                        var sort = parts[0];
                        var sorts = ["album", "artistalbum", "artflow", "yearalbum", "yearartistalbum"];
                        for (var i=0, len=sorts.length; i<len; ++i) {
                            if (sorts[i]!=sort) {
                                var other = cacheKey.replace(SORT_KEY+sort, SORT_KEY+sorts[i]);
                                idbKeyval.del(other);
                            }
                        }
                    }
                }
            }
        }

        if (0==resp.items.length) {
            resp.canUseGrid = false;
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

function parseBrowseUrlResp(data, provider) {
    var resp = {items: [], baseActions:[], canUseGrid: false, jumplist:[] };

    if (!data || !data.result || !data.result.content || data.result.content.length<3) {
        return resp;
    }

    if (typeof provider === 'string' || provider instanceof String) {
        if ('rss'==provider) {
            let totalDuration = 0;
            try {
                let domParser = new DOMParser();
                let doc = domParser.parseFromString(data.result.content, 'text/xml');
                let items = doc.querySelectorAll('item');
                let audioFormats = new Set(["mp3", "m4a", "ogg", "wma"]);
                for (var i=0, len=items.length; i<len; ++i) {
                    try {
                        let enclosure = items[i].querySelector('enclosure');
                        if (undefined==enclosure) {
                            continue;
                        }
                        let type = enclosure.getAttribute('type');
                        if (undefined!=type) {
                            type = type.toLowerCase();
                            if (!type.startsWith("audio/") && !audioFormats.contains(type)) {
                                continue;
                            }
                        }
                        let title = items[i].querySelector('title').textContent;
                        let url = enclosure.getAttribute('url');
                        /*let url = items[i].querySelector('link').textContent;*/
                        let pubDate = items[i].querySelector('pubDate');
                        let itunesImage = items[i].querySelector('image');
                        let itunesDuration = items[i].querySelector('duration');
                        let imageUrl = undefined;
                        let duration = 0;
                        let subtitle = undefined;
                        if (undefined!=itunesImage) {
                            imageUrl = itunesImage.getAttribute('href');
                        }
                        if (undefined!=itunesDuration) {
                            if (itunesDuration.textContent.indexOf(':')>0) {
                                let parts = itunesDuration.textContent.split(':');
                                if (2==parts.length) {
                                    duration=(parseInt(parts[0]) * 60) + parseInt(parts[1]);
                                } else if (3==parts.length) {
                                    duration=(parseInt(parts[0]) * 60*60) + (parseInt(parts[1]) * 60) + parseInt(parts[2]);
                                }
                            } else {
                                duration = parseInt(itunesDuration.textContent);
                            }
                            totalDuration+=duration;
                        }
                        if (0==duration) {
                            let content = items[i].querySelector('content');
                            if (undefined!=content) {
                                let dur = content.getAttribute('duration');
                                if (undefined!=dur) {
                                    duration = parseInt(dur);
                                }
                            }
                        }
                        if (undefined!=pubDate) {
                            subtitle = pubDate.textContent;
                            if (duration>0) {
                                subtitle+=" ("+formatSeconds(duration)+")";
                            }
                        } else if (duration>0) {
                            subtitle=formatSeconds(duration);
                        }
                        resp.items.push({title:title,
                                         subtitle:subtitle,
                                         id:url,
                                         menu:[PLAY_ACTION, INSERT_ACTION, ADD_ACTION],
                                         image:imageUrl ? resolveImageUrl(imageUrl, LMS_IMAGE_SIZE) : undefined,
                                         isUrl:true,
                                         type: "track"});
                    } catch (e) {
                        console.error(e);
                    }
                }
            } catch (e) {
                console.error('Error in parsing the feed', e)
            }
            resp.subtitle = i18np("1 Episode", "%1 Episodes", resp.items.length);
            if (totalDuration>0) {
                resp.subtitle+=" ("+formatSeconds(totalDuration)+")";
            }
        }
    } else {
        let body = JSON.parse(data.result.content);
        let loop = undefined == provider.resp.key ? body : body[provider.resp.key];

        for (var i=0, loopLen=loop.length; i<loopLen; ++i) {
            let imageUrl = undefined;
            if (undefined!=provider.resp.mapping.image) {
                for (let j=0, len=provider.resp.mapping.image.length && undefined==imageUrl; j<len; ++j) {
                    if (undefined!=loop[i][provider.resp.mapping.image[j]]) {
                        imageUrl = loop[i][provider.resp.mapping.image[j]];
                    }
                }
            }
            let pod = { title:loop[i][provider.resp.mapping.title],
                        id:loop[i][provider.resp.mapping.url],
                        image:imageUrl ? resolveImageUrl(imageUrl, LMS_IMAGE_SIZE) : undefined,
                        descr:undefined==provider.resp.mapping.descr ? undefined : loop[i][provider.resp.mapping.descr],
                        menu:[ADD_PODCAST_ACTION, MORE_ACTION],
                        isPodcast:true
                      };
            if (undefined!=pod.title && undefined!=pod.id && !pod.id.startsWith("http://www.striglsmusicnews.com")/*??*/) {
                resp.items.push(pod);
            }
        }
        resp.subtitle=i18np("1 Podcast", "%1 Podcasts", resp.items.length);
    }
    return resp;
}
