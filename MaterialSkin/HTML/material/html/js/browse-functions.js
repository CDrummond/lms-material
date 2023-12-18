/**
 * LMS-Material
 *
 * Copyright (c) 2018-2023 Craig Drummond <craig.p.drummond@gmail.com>
 * MIT license.
 */

function browseMatches(text, title) {
    if (title.startsWith(text)) {
        return true;
    }
    let pos = title.indexOf(' ');
    if (pos>0) {
        let afterFirst=title.substring(pos+1);
        if (afterFirst.startsWith(text)) {
            return true;
        }
    }
    return false;
}

function browseCheckExpand(view) {
    // Check if user has asked us to auto-open some items
    if (queryParams.expand.length>0) {
        for (let i=0, loop=view.items, len=loop.length; i<len; ++i) {
            if (loop[i].title==queryParams.expand[0]) {
                queryParams.expand.shift();
                view.autoClick(i, 0);
                return;
            }
        }
        // Not found? Clear expand
        queryParams.expand=[];
    }
}

// lmsLastKeyPress is defined in server.js
function browseHandleKey(view, event) {
    if (!event.ctrlKey && !event.altKey && !event.metaKey && undefined!=view.jumplist && view.jumplist.length>1 &&
        view.$store.state.openDialogs.length<1 && view.$store.state.visibleMenus.size<1 && (view.$store.state.desktopLayout || view.$store.state.page=="browse")) {
        let key = event.key.toUpperCase();
        if ('#'==key) {
            lmsLastKeyPress = undefined;
            view.jumpTo(view.jumplist[0].index);
        } else {
            let now = new Date().getTime();
            if (undefined==lmsLastKeyPress || (now-lmsLastKeyPress.time)>1000) {
                lmsLastKeyPress = undefined;
                for (let i=0, loop=view.jumplist, len=loop.length; i<len; ++i) {
                    if (loop[i].key == key) {
                        view.jumpTo(loop[i].index);
                        lmsLastKeyPress = {key:key, text:''+key, time:now, invalid:false};
                        break;
                    }
                }
            } else { // Next key in sequence?
                lmsLastKeyPress.time = now;
                if (!lmsLastKeyPress.invalid) {
                    for (let i=0, loop=view.jumplist, len=loop.length; i<len; ++i) {
                        if (loop[i].key == lmsLastKeyPress.key) {
                            let isEnter = 'ENTER'==key;
                            if (!isEnter) {
                                lmsLastKeyPress.text+=key;
                            }
                            for (let j=loop[i].index, jloop=view.items, jlen=jloop.length; j<jlen && jloop[j].textkey==lmsLastKeyPress.key; ++j) {
                                let title = jloop[j].title.toUpperCase();
                                if (browseMatches(lmsLastKeyPress.text, title) || browseMatches(lmsLastKeyPress.text, title.replaceAll('.', '').replaceAll('(', '').replaceAll(')', '').replaceAll('/', '').replaceAll('-', '').replaceAll(',', ''))) {
                                    if (isEnter) {
                                        view.click(view.items[j], j);
                                    } else {
                                        view.jumpTo(j);
                                        return;
                                    }
                                }
                            }
                            break;
                        }
                    }
                    lmsLastKeyPress.invalid = true;
                }
            }
        }
    }
}

function browseAddHistory(view) {
    var prev = {};
    prev.items = view.items;
    prev.listSize = view.listSize;
    prev.allSongsItem = view.allSongsItem;
    prev.jumplist = view.jumplist;
    prev.baseActions = view.baseActions;
    prev.current = view.current;
    prev.currentLibId = view.currentLibId;
    prev.pinnedItemLibName = view.pinnedItemLibName;
    prev.currentBaseActions = view.currentBaseActions;
    prev.currentItemImage = view.currentItemImage;
    prev.currentActions = view.currentActions;
    prev.headerTitle = view.headerTitle;
    prev.headerSubTitle = view.headerSubTitle;
    prev.detailedSubInfo = view.detailedSubInfo;
    prev.detailedSubExtra = view.detailedSubExtra;
    prev.tbarActions = view.tbarActions;
    prev.pos = view.scrollElement.scrollTop;
    prev.grid = view.grid;
    prev.hoverBtns = view.hoverBtns;
    prev.command = view.command;
    prev.showRatingButton = view.showRatingButton;
    prev.subtitleClickable = view.subtitleClickable;
    prev.prevPage = view.prevPage;
    prev.allItems = view.allItems;
    prev.inGenre = view.inGenre;
    prev.searchActive = view.searchActive;
    prev.canDrop = view.canDrop;
    prev.itemCustomActions = view.itemCustomActions;
    view.prevPage = undefined;
    view.history.push(prev);
}

function browseActions(view, item, args, count, showCompositions) {
    var actions=[];
    if ((undefined==item || undefined==item.id || !item.id.startsWith(MUSIC_ID_PREFIX)) && // Exclude 'Compilations'
        (undefined==args['artist'] || (args['artist']!=i18n('Various Artists') && args['artist']!=LMS_VA_STRING && args['artist'].toLowerCase()!='various artists'))) {
        if (LMS_P_MAI) {
            if (undefined!=args['album_id'] || (undefined!=args['album'] && (undefined!=args['artist_id'] || undefined!=args['artist']))) {
                actions.push({title:i18n('Review'), icon:'local_library', stdItem:STD_ITEM_MAI,
                              do:{ command: undefined!=args['album_id']
                                                ? ['musicartistinfo', 'albumreview', 'html:1', 'album_id:'+args['album_id']]
                                                : undefined!=args['artist_id']
                                                    ? ['musicartistinfo', 'albumreview', 'html:1', 'album:'+args['album'], 'artist_id:'+args['artist_id']]
                                                    : ['musicartistinfo', 'albumreview', 'html:1', 'album:'+args['album'], 'artist:'+args['artist']],
                                   params:[]},
                              weight:100});
            } else if (undefined!=args['artist_id'] || undefined!=args['artist']) {
                actions.push({title:i18n('Biography'), icon:'menu_book', stdItem:STD_ITEM_MAI,
                              do:{ command: undefined!=args['artist_id']
                                                ? ['musicartistinfo', 'biography', 'html:1', 'artist_id:'+args['artist_id']]
                                                : ['musicartistinfo', 'biography', 'html:1', 'artist:'+args['artist']],
                                   params:[]},
                              weight:100});
                actions.push({title:i18n('Pictures'), icon:'insert_photo',
                              do:{ command: undefined!=args['artist_id']
                                                ? ['musicartistinfo', 'artistphotos', 'html:1', 'artist_id:'+args['artist_id']]
                                                : ['musicartistinfo', 'artistphotos', 'html:1', 'artist:'+args['artist']],
                                   params:[]},
                              weight:105});
            }
            if (undefined!=args['path'] && args['path'].length>0 && !queryParams.party && !LMS_KIOSK_MODE) {
                actions.push({localfiles:true, title:i18n('Local files'), icon:'insert_drive_file', do:{ command:['musicartistinfo', 'localfiles', 'folder:'+args['path']], params:[]}, weight:103});
            }
        }
        if (LMS_P_BMIX && (undefined!=args['artist_id'] || undefined!=args['album_id'])) {
            actions.push({title:i18n('Radio'), icon:'radio', stdItem:STD_ITEM_MIX,
                          do:{ command:["blissmixer", "mix"],
                               params:["menu:1", "useContextMenu:1", undefined!=args['album_id'] ? "album_id:"+args['album_id'] : "artist_id:"+args['artist_id']]}, weight:101});
        }
        if (LMS_P_YT && undefined!=args['artist']) {
            actions.push({title:/*NoTrans*/'YouTube', svg:'youtube',
                          do:{ command: ['youtube','items'], params:['want_url:1', 'item_id:3', 'search:'+args['artist'], 'menu:youtube']},
                          weight:110});
        }


        if (undefined!=args['artist_id'] && undefined==args['album_id'] && undefined!=args['count'] && args['count']>1) {
            var params = [SORT_KEY+TRACK_SORT_PLACEHOLDER, PLAYLIST_TRACK_TAGS, 'artist_id:'+args['artist_id']];
            if (undefined!=args['role_id']) {
                params.push(args['role_id']);
            }
            if (undefined!=args['genre_id']) {
                params.push(args['genre_id']);
            }
            let libId = view.currentLibId ? view.currentLibId : view.$store.state.library ? view.$store.state.library : LMS_DEFAULT_LIBRARY;
            if (libId) {
                params.push("library_id:"+libId);
            }
            actions.push({title:i18n('All songs'), icon:'music_note', do:{ command: ['tracks'], params: params}, weight:80, stdItem:STD_ITEM_ALL_TRACKS});
        }
        if (undefined!=args['artist_id'] && showCompositions) {
            var params = [SORT_KEY+TRACK_SORT_PLACEHOLDER, PLAYLIST_TRACK_TAGS, 'artist_id:'+args['artist_id'], 'role_id:COMPOSER', 'material_skin_artist:'+args['artist']];
            let libId = view.currentLibId ? view.currentLibId : view.$store.state.library ? view.$store.state.library : LMS_DEFAULT_LIBRARY;
            if (libId) {
                params.push("library_id:"+libId);
            }
            actions.push({title:i18n('Compositions'), svg:'composer', do:{ command: ['tracks'], params: params}, weight:81, stdItem:STD_ITEM_COMPOSITION_TRACKS});
        }
    }
    if (undefined!=item && undefined!=item.stdItem && undefined!=STD_ITEMS[item.stdItem].actionMenu) {
        var weight = 200;
        for (var i=0, loop=STD_ITEMS[item.stdItem].actionMenu, len=loop.length; i<len; ++i) {
            if (CUSTOM_ACTIONS==loop[i]) {
                if (undefined!=view.itemCustomActions) {
                    for (var c=0, clen=view.itemCustomActions.length; c<clen; ++c) {
                        weight++;
                        view.itemCustomActions[c].weight=weight;
                        view.itemCustomActions[c].custom=true;
                        actions.push(view.itemCustomActions[c]);
                    }
                }
            } else if ((ADD_RANDOM_ALBUM_ACTION!=loop[i] || count>1) && (DOWNLOAD_ACTION!=loop[i] || (lmsOptions.allowDownload && undefined==item.emblem))) {
                weight++;
                actions.push({action:loop[i], weight:(MORE_LIB_ACTION==loop[i] ? 1000 : weight)});
            }
        }
    }

    return actions;
}

function browseHandleNextWindow(view, item, command, resp, isMoreMenu, isBrowse) {
    // If called with isBrowse==true, then previous list will have been added to history, so if
    // we go-back we are going back to that.
    var nextWindow = item.nextWindow
                        ? item.nextWindow
                        : item.actions && item.actions.go && item.actions.go.nextWindow
                            ? item.actions.go.nextWindow
                            : undefined;
    if (nextWindow) {
        nextWindow=nextWindow.toLowerCase();
        var message = resp.items && 1==resp.items.length && "text"==resp.items[0].type && resp.items[0].title && !msgIsEmpty(resp.items[0].title)
                        ? resp.items[0].title : item.title;
        bus.$emit('showMessage', message);
        if (nextWindow=="refresh" || (isMoreMenu && nextWindow=="parent")) {
            if (isBrowse) {
                view.goBack(true);
            } else {
                view.refreshList();
            }
        } else if (view.history.length>0 && (nextWindow=="parent" || /*nextWindow=="nowplaying" ||*/ (isMoreMenu && nextWindow=="grandparent"))) {
            // If "trackinfo items" has "parent" and returns an empty list, then don't go back... Work-around for:
            // https://forums.slimdevices.com/showthread.php?109624-Announce-Material-Skin&p=983626&viewfull=1#post983626
            if (nextWindow!="parent" || command.command[0]!="trackinfo" || command.command[1]!="items" || !resp.items || resp.items.length>0) {
                if (isBrowse) {
                    view.history.pop();
                }
                view.goBack(true);
            }
        } else if (nextWindow=="grandparent" && view.history.length>1) {
            if (isBrowse) {
                view.history.pop();
            }
            view.history.pop();
            view.goBack(true);
        }
        if (nextWindow=="nowplaying") {
            if (!view.$store.state.desktopLayout) {
                view.$store.commit('setPage', 'now-playing');
            }
            view.goBack(true);
        } else if (nextWindow=="home") {
            view.goHome();
        }
        return true;
    }
    return false;
}

function browseHandleListResponse(view, item, command, resp, prevPage, appendItems) {
    if (resp && resp.items) {
        if (appendItems) {
            view.items.push.apply(view.items, resp.items);
            // Following should not be required. But first 'more' fetch seems to result in
            // list scrolling to position 0???
            setScrollTop(view, view.scrollElement.scrollTop);
            return;
        }
        if (0==resp.items.length && command.command.length>1 && "podcasts"==command.command[0] && ("addshow"==command.command[1] || "delshow"==command.command[1])) {
            bus.$emit('showMessage', item.title);
            view.history[view.history.length-2].needsRefresh = true;
            view.fetchingItem = undefined;
            view.goBack();
            return;
        }
        // Only add history if view is not a search response replacing a search response...
        if ((SEARCH_ID!=item.id && ADV_SEARCH_ID!=item.id) || undefined==view.current || (SEARCH_ID!=view.current.id && ADV_SEARCH_ID!=view.current.id)) {
            let addToHistory = true;
            if (command.ismore) {
                // If this command is a "More..." listing then remove any current "More..."
                // from the history, and don't ad dto history.
                // Basically dont want "My Music / Album / More / Track Info / More / More / etc...
                if (addToHistory && view.command && view.command.ismore) {
                    // Curent view is "More..." so dont at that to history
                    addToHistory = false;
                } else {
                    for (let i=0, len=view.history.length; i<len; ++i) {
                        if (view.history[i].command && view.history[i].command.ismore) {
                            // Found "More..." in history stack, so remove
                            view.history.splice(i, len-i);
                            addToHistory = false;
                            break;
                        }
                    }
                }
            }
            if (addToHistory) {
                view.addHistory();
            }
        }
        resp.canUseGrid = resp.canUseGrid;
        view.canDrop = resp.canDrop;
        view.searchActive = item.id.startsWith(SEARCH_ID);
        view.command = command;
        view.currentBaseActions = view.baseActions;
        view.currentItemImage = resp.image;
        let wasSearch = (item.type=="search" || item.type=="entry") && undefined!=view.enteredTerm;
        // If this is an (e.g.) Spotty search then parent list (with search entry) will need refreshing
        if (wasSearch && command.command.length>1 && "items"==command.command[1]) {
            view.history[view.history.length-1].needsRefresh = true;
        }
        view.headerTitle=item.title
                            ? wasSearch
                                ? stripLinkTags(item.title)+SEPARATOR+view.enteredTerm
                                : stripLinkTags(item.title)+(undefined==resp.titleSuffix ? "" : resp.titleSuffix)
                            : "?";
        //var libname = view.current ? view.current.libname : undefined;
        view.current = item;
        view.currentLibId = command.libraryId;
        view.pinnedItemLibName = item.libname ? item.libname : view.pinnedItemLibName;
        view.items=resp.items;
        view.listSize=resp.listSize;
        view.allSongsItem=resp.allSongsItem;
        view.jumplist=resp.jumplist;
        view.filteredJumplist = [];
        view.baseActions=resp.baseActions;
        view.tbarActions=[];
        view.isTop = false;
        view.subtitleClickable = (!IS_MOBILE || lmsOptions.touchLinks) && view.items.length>0 && undefined!=view.items[0].id && undefined!=view.items[0].artist_id && view.items[0].id.startsWith("album_id:");
        view.grid = {allowed:resp.canUseGrid,
                     use: resp.canUseGrid && (resp.forceGrid || isSetToUseGrid(view.current && view.current.id.startsWith(TOP_ID_PREFIX) && view.current.id!=TOP_FAVORITES_ID ? GRID_OTHER : command, view.current)),
                     numColumns:0, ih:GRID_MIN_HEIGHT, rows:[], few:false, haveSubtitle:true};
        view.jumplistActive=0;
        view.prevPage = prevPage;
        view.hoverBtns = !IS_MOBILE && view.items.length>0 &&
                         ( (undefined!=view.items[0].stdItem && view.items[0].stdItem!=STD_ITEM_GENRE && view.items[0].stdItem!=STD_ITEM_YEAR) ||
                           (view.items.length>1 && view.items[0].header && undefined!=view.items[1].stdItem && view.items[1].stdItem!=STD_ITEM_GENRE && view.items[1].stdItem!=STD_ITEM_YEAR) ||
                           resp.allowHoverBtns );

        // Get list of actions (e.g. biography, online services) to show in subtoolbar
        view.currentActions=[];
        let listingArtistAlbums = view.current.id.startsWith("artist_id:");
        let listingAlbumTracks = view.current.id.startsWith("album_id:");
        let listingAlbums = view.command.command[0]=="albums";
        let listingTracks = view.command.command[0]=="tracks";
        let title = view.current.title;
        let artist_id = listingArtistAlbums ? view.current.id.split(":")[1] : undefined;
        let album_id = listingAlbumTracks ? view.current.id.split(":")[1] : undefined;
        if (!listingArtistAlbums && listingAlbums) {
            let pos = getField(command, "artist_id");
            if (pos>=0) {
                listingArtistAlbums = true;
                let parts = title.split(":");
                parts.shift();
                title=parts.join(" ");
                artist_id = command.params[pos].split(":")[1];
            }
        } else if (!listingAlbumTracks && listingTracks) {
            let pos = getField(command, "album_id");
            if (pos>=0) {
                listingAlbumTracks = true;
                let parts = title.split(":");
                parts.shift();
                title=parts.join(" ");
                album_id = command.params[pos].split(":")[1];
                pos = getField(command, "artist_id");
                if (pos>=0) {
                    artist_id = command.params[pos].split(":")[1];
                }
            }
        }
        var canAddAlbumSort=true;
        if ((listingArtistAlbums && listingAlbums) || (listingAlbumTracks && listingTracks)) {
            var actParams = new Map();
            actParams[view.current.id.split(':')[0]]=view.current.id.split(':')[1];
            if (undefined!=artist_id) {
                actParams["artist_id"] = artist_id;
            }
            if (undefined!=album_id) {
                actParams["album_id"] = album_id;
            }
            if (listingArtistAlbums) {
                actParams['artist']=title;
                actParams['count']=resp.items.length;
                var field = getField(view.command, "role_id:");
                if (field>=0) {
                    actParams['role_id']=view.command.params[field];
                }
                field = getField(view.command, "genre_id:");
                if (field>=0) {
                    actParams['genre_id']=view.command.params[field];
                }
            } else {
                actParams['album']=title;
                if (view.items.length>0) {
                    let url = view.items[0].header ? (view.items.length>1 ? view.items[1].url : undefined) : view.items[0].url;
                    if (undefined!=url && /^file:\/\//.test(url)) {
                        try {
                            actParams['path']=decodeURIComponent(url.substring(0, url.lastIndexOf('/'))+'/').substring(7);
                            // if we have (e.g.) /c:/path change to c:/path
                            if (/^\/[a-zA-Z]:\/.+/.test(actParams['path'])) {
                                actParams['path'] = actParams['path'].substring(1);
                            }
                        } catch(e) {
                            logError(e);
                        }
                    }
                }
            }
            view.currentActions = browseActions(view, resp.items.length>0 ? item : undefined, actParams, resp.items.length, resp.showCompositions);
            if (listingArtistAlbums) {
                for (var i=0, loop=view.onlineServices, len=loop.length; i<len; ++i) {
                    var emblem = getEmblem(loop[i]+':');
                    view.currentActions.push({title:/*!i81n*/'wimp'==loop[i] ? 'Tidal' : capitalize(loop[i]),
                                              weight:110, svg:emblem ? emblem.name : undefined, id:loop[i], isService:true,
                                              artist_id:artist_id});
                }
            } else if (undefined!=LMS_P_RP && view.items.length>1 && !queryParams.party && !LMS_KIOSK_MODE) {
                view.currentActions.push({albumRating:true, title:i18n("Set rating for all tracks"), icon:"stars", weight:102});
            }
            if (LMS_P_MAI && undefined!=actParams['path'] && actParams['path'].length>0 && !queryParams.party && !LMS_KIOSK_MODE) {
                // Check we have some local files, if not hide entry!
                lmsCommand('', ['musicartistinfo', 'localfiles', 'folder:'+actParams['path']]).then(({data}) => {
                    if (!data || !data.result || !data.result.item_loop || data.result.item_loop.length<1) {
                        for (var i=0, loop=view.currentActions, len=loop.length; i<len; ++i) {
                            if (loop[i].localfiles) {
                                loop.splice(i, 1);
                                break;
                            }
                        }
                    }
                }).catch(err => {
                });
            }
            // Artist from online service, but no albums? Add links to services...
            if (listingArtistAlbums && view.items.length==0) {
                view.items.push({id:"intro", title:i18n("No albums have been favorited for this artist. Please use the entries below to look for albums on your online services."), type:"text"});
                canAddAlbumSort = false;
                for (var i=0, loop=view.currentActions, len=loop.length; i<len; ++i) {
                    if (loop[i].isService) {
                        view.items.push({id:loop[i].id ? loop[i].id : "ca"+i, title:loop[i].title, do:loop[i].do, svg:loop[i].svg, icon:loop[i].icon, currentAction:true, artist_id:artist_id});
                    }
                }
            }
        } else if (undefined!=resp.actionItems && resp.actionItems.length>0) {
            view.currentActions = resp.actionItems;
        }
        if (listingArtistAlbums) {
            let index = getField(command, "genre_id:");
            // Get genres for artist...
            let genreReqArtist=view.current.id;
            lmsList('', ['genres'], [view.current.id].concat(index<0 ? [] : [command.params[index]]), 0, 25, false, view.nextReqId()).then(({data}) => {
                if (data.result && data.result.genres_loop && view.isCurrentReq(data) && genreReqArtist==view.current.id) {
                    let genreList = [];
                    for (let g=0, loop=data.result.genres_loop, len=loop.length; g<len; ++g) {
                        if ((!IS_MOBILE || lmsOptions.touchLinks)) {
                            genreList.push("<obj class=\"link-item\" onclick=\"showGenre(event, "+loop[g].id+",\'"+escape(loop[g].genre)+"\', \'browse\')\">" + loop[g].genre + "</obj>");
                        } else {
                            genreList.push(loop[g].genre);
                        }
                    }
                    view.detailedSubExtra=genreList.join(SEPARATOR);
                }
            }).catch(err => {
            });
        }
        if (resp.canUseGrid && !resp.forceGrid) {
            view.currentActions.push({action:(view.grid.use ? USE_LIST_ACTION : USE_GRID_ACTION), weight:0});
        }
        if (undefined==item.stdItem && undefined!=item.menu && item.menu[0]==PLAY_ACTION && lmsOptions.playShuffle && view.items.length>1) {
            view.currentActions.push({action:INSERT_ACTION, weight:2});
            view.currentActions.push({action:PLAY_SHUFFLE_ACTION, weight:3});
        }
        if (resp.isMusicMix || (("albums"==command.command[0] && view.items.length>0 && command.params.find(elem => elem=="sort:random")))) {
            view.currentActions.push({action:RELOAD_ACTION, weight:1});
            if (resp.isMusicMix && !queryParams.party) {
                view.currentActions.push({action:ADD_TO_PLAYLIST_ACTION, weight:10});
            }
        }
        if (canAddAlbumSort && view.command.command.length>0 && view.command.command[0]=="albums" && view.items.length>0) {
            for (var i=0, len=view.command.params.length; i<len; ++i) {
                if (view.command.params[i].startsWith(SORT_KEY)) {
                    var sort=view.command.params[i].split(":")[1];
                    addSort=sort!="new" && sort!="random";
                } else if (view.command.params[i].startsWith("search:")) {
                    canAddAlbumSort=false;
                    break;
                }
            }
            if (canAddAlbumSort) {
                view.currentActions.push({action:ALBUM_SORTS_ACTION, weight:1});
            }
        } else if ((view.current.stdItem==STD_ITEM_ALL_TRACKS || view.current.stdItem==STD_ITEM_COMPOSITION_TRACKS) && view.command.command.length>0 && view.command.command[0]=="tracks" && view.items.length>0) {
            view.currentActions.push({action:TRACK_SORTS_ACTION, weight:10});
        }
        view.currentActions.sort(function(a, b) { return a.weight!=b.weight ? a.weight<b.weight ? -1 : 1 : titleSort(a, b) });

        view.itemCustomActions = resp.itemCustomActions;
        if (item.id.startsWith(SEARCH_ID)) {
            if (view.items.length>0 && view.items[0].id.startsWith("track_id:")) {
                view.tbarActions=[SEARCH_LIB_ACTION, PLAY_ALL_ACTION, ADD_ALL_ACTION];
            } else {
                view.tbarActions=[SEARCH_LIB_ACTION];
            }
        } else if (SECTION_FAVORITES==view.current.section && view.current.isFavFolder) {
            view.tbarActions=[ADD_FAV_FOLDER_ACTION, ADD_FAV_ACTION];
        } else if (SECTION_PLAYLISTS==view.current.section && view.current.id.startsWith("playlist_id:") && view.items.length>0 && undefined!=view.items[0].stdItem) {
            view.tbarActions=[PLAY_ACTION, ADD_ACTION];
            view.currentActions=browseActions(view, resp.items.length>0 ? item : undefined, {}, resp.items.length);
        } else if (view.allSongsItem || ("tracks"==command.command[0] && item.id.startsWith("currentaction:"))) {
            view.tbarActions=[PLAY_ALL_ACTION, ADD_ALL_ACTION];
        } else if (view.items.length>0 && view.items[0].type!="html" && !(view.current && view.current.isPodcast) && addAndPlayAllActions(command)) {
            if (view.current && view.current.menu) {
                for (var i=0, len=view.current.menu.length; i<len; ++i) {
                    if (view.current.menu[i]==ADD_ACTION || view.current.menu[i]==PLAY_ACTION) {
                        view.tbarActions=[PLAY_ACTION, ADD_ACTION];
                        break;
                    }
                }
            }

            // No menu actions? If have 3..200 audio tracks, add a PlayAll/AddAll to toolbar. view will add each item individually
            // 3..200 is chosen so that we dont add these to bandcamp when it shows "Listen as podcast" and "Listen to songs" entries...
            let trackLimit = resp.items.length>0 && (""+resp.items[0].id).startsWith("track_id:") ? 0 : 2000;

            if (view.tbarActions.length==0 && (trackLimit==0 || (resp.numAudioItems>2 && resp.numAudioItems<=trackLimit)) &&
                (!item.id || !item.id.startsWith(TOP_ID_PREFIX)) &&
                ((view.command.command.length>0 && ALLOW_ADD_ALL.has(view.command.command[0])) ||
                 (resp.items[0].presetParams && resp.items[0].presetParams.favorites_url && ALLOW_ADD_ALL.has(resp.items[0].presetParams.favorites_url.split(':')[0]))) ) {
                view.tbarActions=[PLAY_ALL_ACTION, ADD_ALL_ACTION];
            }

            // Select track -> More -> Album:AlbumTitle -> Tracks
            if (view.tbarActions.length==0 && view.current && ((view.current.actions && view.current.actions.play) || view.current.stdItem)) {
                view.tbarActions=[PLAY_ACTION, ADD_ACTION];
            }
        }

        view.detailedSubInfo=resp.plainsubtitle ? resp.plainsubtitle : resp.years ? resp.years : "&nbsp;";
        view.detailedSubExtra=resp.extraDetails;
        if ( (view.current && (view.current.stdItem==STD_ITEM_MAI || view.current.stdItem==STD_ITEM_MIX)) ||
             (1==view.items.length && ("text"==view.items[0].type || "html"==view.items[0].type)) ||
             (listingArtistAlbums && 0==view.items.length) /*Artist from online service*/ ) {
            // Check for artist bio / album review invoked from browse toolbar
            let parts = view.headerTitle.split(SEPARATOR);
            if (2==parts.length) {
                view.headerTitle = parts[0];
                view.headerSubTitle = parts[1];
                view.detailedSubInfo = resp.subtitle;
            } else {
                view.headerSubTitle = undefined;
            }
        } else if (resp.subtitle) {
            view.headerSubTitle=resp.subtitle
        } else {
            view.headerSubTitle=0==view.items.length ? i18n("Empty") : i18np("1 Item", "%1 Items", view.items.length);
        }
        if (queryParams.party) {
            view.tbarActions=[];
        }
        // In party mode only want to allow to add tracks.
        if (queryParams.party) {
            view.tbarActions=[];
            if (view.items.length>0 && undefined!=view.items[0].stdItem && STD_ITEM_TRACK!=view.items[0].stdItem &&
                STD_ITEM_ALBUM_TRACK!=view.items[0].stdItem && STD_ITEM_PLAYLIST_TRACK!=view.items[0].stdItem &&
                STD_ITEM_REMOTE_PLAYLIST_TRACK!=view.items[0].stdItem) {
                for (let i=0, loop=view.items, len=loop.length; i<len; ++i) {
                    loop[i].altStdItem = loop[i].stdItem;
                    loop[i].stdItem = undefined;
                }
                view.hoverBtns = false;
            }
        }
        view.$nextTick(function () {
            view.setBgndCover();
            view.filterJumplist();
            view.layoutGrid(true);
            setScrollTop(view, 0);
        });

        if (view.items.length==0) {
            browseHandleNextWindow(view, item, command, resp, false, true);
        } else {
            browseCheckExpand(view);
        }
    }
}

function browseHandleTextClickResponse(view, item, command, data, isMoreMenu) {
    var resp = parseBrowseResp(data, item, view.options);
    var nextWindow = item.nextWindow
                        ? item.nextWindow
                        : item.actions && item.actions.go && item.actions.go.nextWindow
                            ? item.actions.go.nextWindow
                            : undefined;

    if (browseHandleNextWindow(view, item, command, resp, isMoreMenu)) {
        return;
    }
    if (command.command.length>3 && command.command[1]=="playlist" && command.command[2]=="play") {
        bus.$emit('showMessage', item.title);
        view.goBack(true);
    } else if (resp.items && (resp.items.length>0 || (command.command.length>1 && command.command[0]=="favorites" && command.command[1]=="items"))) {
        view.handleListResponse(item, command, resp);
    } else if (command && command.command && command.command[0]=='globalsearch') {
        bus.$emit('showMessage', i18n('No results found'));
    }
}

function browseClick(view, item, index, event) {
    if (view.fetchingItem!=undefined || "html"==item.type) {
         return;
    }
    if (!item.isListItemInMenu) {
        if (view.menu.show) {
            view.menu.show=false;
            return;
        }
        if (view.$store.state.visibleMenus.size>0) {
            return;
        }
    }
    if ("search"==item.type || "entry"==item.type) {
        if (view.grid.use || view.useRecyclerForLists) {
            promptForText(item.title, "", "").then(resp => {
                if (resp.ok && resp.value && resp.value.length>0) {
                    view.entry(item, resp.value);
                }
            });
        }
        return;
    }
    if (item.header) {
        if (item.allItems && item.allItems.length>0) { // Clicking on 'X Artists' / 'X Albums' / 'X Tracks' search header
            view.addHistory();
            view.items = item.allItems;
            view.headerSubTitle = item.subtitle;
            view.current = item;
            view.searchActive = false;
            if (item.menu && item.menu.length>0 && item.menu[0]==PLAY_ALL_ACTION) {
                view.tbarActions=[PLAY_ALL_ACTION, ADD_ALL_ACTION];
            }
            setScrollTop(view, 0);
        } else if (view.selection.size>0) {
            view.select(item, index, event);
        } else {
            view.itemMenu(item, index, event);
        }
        return;
    }
    if (view.selection.size>0) {
        view.select(item, index, event);
        return;
    }
    if (item.isPinned) {
        if (undefined!=item.url && "extra"!=item.type) { // Radio
            view.itemMenu(item, index, event);
            return;
        }
        if ("settingsPlayer"==item.type) {
            bus.$emit('dlg.open', 'playersettingsplugin', view.playerId(), view.playerName(), item, false);
            return;
        }
    }
    if (item.currentAction) {
        view.currentAction(item, index);
        return;
    }
    if ("image"==item.type) {
        view.showImage(index);
        return;
    }
    if (isAudioTrack(item)) {
        if (!view.clickTimer) {
            view.clickTimer = setTimeout(function () {
                view.clickTimer = undefined;
                view.itemMenu(item, index, event);
            }.bind(view), LMS_DOUBLE_CLICK_TIMEOUT);
        } else {
            clearTimeout(view.clickTimer);
            view.clickTimer = undefined;
            browseItemAction(view, PLAY_ACTION, item, index, event);
        }
        return;
    }
    if (isTextItem(item) && !item.id.startsWith(TOP_ID_PREFIX) && !item.id.startsWith(MUSIC_ID_PREFIX)) {
        if (view.canClickText(item)) {
            view.doTextClick(item);
        }
        return;
    }
    if (item.type=="extra") {
        if (view.$store.state.player) {
            bus.$emit('dlg.open', 'iframe', item.url+'player='+view.$store.state.player.id, item.title+SEPARATOR+view.$store.state.player.name, undefined, IFRAME_HOME_NAVIGATES_BROWSE_HOME);
        } else {
            bus.$emit('showError', undefined, i18n("No Player"));
        }
        return;
    }
    if (TOP_MYMUSIC_ID==item.id) {
        view.addHistory();
        view.items = view.myMusic;
        view.myMusicMenu();
        view.headerTitle = stripLinkTags(item.title);
        view.headerSubTitle = i18n("Browse music library");
        view.current = item;
        setScrollTop(view, 0);
        view.isTop = false;
        view.tbarActions=[VLIB_ACTION, SEARCH_LIB_ACTION];
        view.grid = {allowed:true, use:isSetToUseGrid(GRID_OTHER), numColumns:0, ih:GRID_MIN_HEIGHT, rows:[], few:false, haveSubtitle:true};
        view.currentActions=[{action:(view.grid.use ? USE_LIST_ACTION : USE_GRID_ACTION)}];
        view.layoutGrid(true);
    } else if (RANDOM_MIX_ID==item.id) {
        bus.$emit('dlg.open', 'rndmix');
    } else if (STD_ITEM_GENRE==item.stdItem && view.current && (getField(item, "genre_id") || getField(item, "year"))) {
        browseAddCategories(view, item, true, getField(item, "year"));
        browseCheckExpand(view);
    } else if (item.actions && item.actions.go && item.actions.go.params && item.actions.go.params.genre_id && item.actions.go.params.mode=='artists' && item.title.indexOf(': ')>0) {
        // Genre from 'More' menu?
        browseAddCategories(view, {id:'genre_id:'+item.actions.go.params.genre_id, title:item.title.split(': ')[1], image:item.image}, true);
        browseCheckExpand(view);
    } else if (STD_ITEM_YEAR==item.stdItem && view.current&& (getField(item, "genre_id") || getField(item, "year"))) {
        browseAddCategories(view, item, false);
        browseCheckExpand(view);
    } else if (item.actions && item.actions.go && item.actions.go.params && item.actions.go.params.year && item.actions.go.params.mode=='albums' && item.title.indexOf(': ')>0) {
        // Year from 'More' menu?
        browseAddCategories(view, {id:'year:'+item.actions.go.params.year, title:item.title.split(': ')[1]}, false);
        browseCheckExpand(view);
    } else if (item.weblink) {
        let url = item.weblink;
        let parts = url.split('/').pop().split('?')[0].split('.');
        let ext = parts[parts.length-1].toLowerCase();
        if (!IS_IOS && !IS_ANDROID && !queryParams.dontEmbed.has(ext)) {
            bus.$emit('dlg.open', 'iframe', item.weblink, item.title, undefined, IFRAME_HOME_NAVIGATES_BROWSE_HOME);
        } else {
            window.open(item.weblink);
        }
    } else {
        var command = view.buildCommand(item);
        if (command.command.length>2 && command.command[1]=="playlist") {
            if (!item.menu || item.menu.length<1) { // No menu? Dynamic playlist? Just run command...
                lmsCommand(view.playerId(), command.params ? command.command.concat(command.params) : command.command).then(({data}) => {
                    bus.$emit('showMessage', item.title);
                });
            } else {
                view.itemMenu(item, index, event);
            }
            return;
        }

        if (item.mapgenre) {
            var field = getField(command, "genre:");
            if (field>=0) {
                lmsCommand("", ["material-skin", "map", command.params[field]]).then(({data}) => {
                    if (data.result.genre_id) {
                        command.params[field]="genre_id:"+data.result.genre_id;
                        view.fetchItems(command, item);
                    }
                });
                return;
            }
        }
        view.fetchItems(command, item);
    }
}

function browseAddCategories(view, item, isGenre) {
    view.addHistory();
    view.items=[];

    let command = view.history.length<2 || !view.history[view.history.length-2].current || !view.history[view.history.length-2].current.command ? undefined : view.history[view.history.length-2].current.command[0];

    // check if there is a grandparent ID we should use.
    let alt_id = view.history.length<1 || !view.history[view.history.length-1].current ? undefined : originalId(view.history[view.history.length-1].current.id);
    if (undefined!=alt_id && (alt_id.includes("/") || alt_id[0]==item.id[0] || /*alt_id.startsWith("year:") ||*/ alt_id.startsWith("artist_id:") || alt_id.startsWith("album_id:") || alt_id.startsWith("track_id:"))) {
        alt_id = undefined;
    }
    let cat = { title: lmsOptions.separateArtistsList ? i18n("All Artists") : i18n("Artists"),
                command: ["artists"],
                params: [item.id, ARTIST_TAGS, 'include_online_only_artists:1'],
                svg: "artist",
                type: "group",
                id: uniqueId(item.id, view.items.length)};
    if (undefined!=alt_id) { cat.params.push(alt_id); }
    view.items.push(cat);
    if (lmsOptions.separateArtistsList) {
        cat = { title: i18n("Album Artists"),
                command: ["artists"],
                params: [item.id, ARTIST_TAGS, 'role_id:ALBUMARTIST', 'include_online_only_artists:1'],
                svg: "albumartist",
                type: "group",
                id: uniqueId(item.id, view.items.length)};
        if (undefined!=alt_id) { cat.params.push(alt_id); }
        view.items.push(cat);
    }
    cat = { title: i18n("Albums"),
            command: ["albums"],
            params: [item.id, ALBUM_TAGS_PLACEHOLDER, SORT_KEY+ALBUM_SORT_PLACEHOLDER],
            menu: [],
            icon: "album",
            type: "group",
            id: uniqueId(item.id, view.items.length)};
    if (undefined!=alt_id) { cat.params.push(alt_id); }
    view.items.push(cat);
    cat = { title: i18n("Random Albums"),
            command: ["albums"],
            params: [item.id, ALBUM_TAGS_PLACEHOLDER, "sort:random"],
            menu: [],
            svg: "dice-album",
            type: "group",
            id: uniqueId(item.id, view.items.length)};
    if (undefined!=alt_id) { cat.params.push(alt_id); }
    view.items.push(cat);
    /* 'years' does not accept genre filter, so this would show all years regardless
     * of whether there was a track in that year of this genre in that year or not :(
    if (isGenre && (undefined==command || "years"!=command)) {
        cat = { title: i18n("Years"),
                command: ["years"],
                params: [item.id],
                icon: "date_range",
                type: "group",
                id: uniqueId(item.id, view.items.length)};
        if (undefined!=alt_id) { cat.params.push(alt_id); }
        view.items.push(cat);
    }
    */
    if (!isGenre && (undefined==command || "genres"!=command)) {
        cat = { title: i18n("Genres"),
                 command: ["genres"],
                 params: [item.id],
                 svg: "guitar-acoustic",
                 type: "group",
                 id: uniqueId(item.id, view.items.length)};
        if (undefined!=alt_id) { cat.params.push(alt_id); }
        view.items.push(cat);
    }
    view.inGenre = isGenre ? item.title : 'years';
    if (isGenre ? useComposer(item.title) : lmsOptions.showComposer) {
        cat = { title: i18n("Composers"),
                command: ["artists"],
                params: ["role_id:COMPOSER", item.id, ARTIST_TAGS],
                cancache: true,
                svg: "composer",
                type: "group",
                id: uniqueId(item.id, view.items.length)};
        if (undefined!=alt_id) { cat.params.push(alt_id); }
        view.items.push(cat);
    }
    if (isGenre ? useConductor(item.title) : lmsOptions.showConductor) {
        cat = { title: i18n("Conductors"),
                command: ["artists"],
                params: ["role_id:CONDUCTOR", item.id, ARTIST_TAGS],
                cancache: true,
                svg: "conductor",
                type: "group",
                id: uniqueId(item.id, view.items.length)};
        if (undefined!=alt_id) { cat.params.push(alt_id); }
        view.items.push(cat);
    }
    if (isGenre ? useBand(item.title) : lmsOptions.showBand) {
        cat = { title: i18n("Bands"),
                command: ["artists"],
                params: ["role_id:BAND", item.id, ARTIST_TAGS],
                cancache: true,
                svg: "trumpet",
                type: "group",
                id: uniqueId(item.id, view.items.length)};
        if (undefined!=alt_id) { cat.params.push(alt_id); }
        view.items.push(cat);
    }
    cat = { title: i18n("All Songs"),
            command: ["tracks"],
            params: [item.id, trackTags()+"elcy", SORT_KEY+TRACK_SORT_PLACEHOLDER],
            icon: "music_note",
            type: "group",
            id: ALL_SONGS_ID};
    if (undefined!=alt_id) { cat.params.push(alt_id); }
    view.items.push(cat);
    view.headerTitle = stripLinkTags(item.title);
    view.headerSubTitle = i18n("Select category");
    setScrollTop(view, 0);
    view.isTop = false;
    view.jumplist = view.filteredJumplist = [];
    view.grid = {allowed:true, use:isSetToUseGrid(GRID_OTHER), numColumns:0, ih:GRID_MIN_HEIGHT, rows:[], few:false, haveSubtitle:true};
    view.currentActions=[];
    view.layoutGrid(true);

    var custom = getCustomActions(isGenre ? "genre" : "year", false);
    if (undefined!=custom) {
        for (var i=0, len=custom.length; i<len; ++i) {
            custom[i].custom=true;
            view.currentActions.push(custom[i]);
        }
    }
    view.current = item;
    view.currentActions.push({action:(view.grid.use ? USE_LIST_ACTION : USE_GRID_ACTION)});
    view.currentItemImage = item.image;
    if (isGenre && lmsOptions.genreImages) {
        view.setBgndCover();
    }
}

function browseItemAction(view, act, item, index, event) {
    if (act==SEARCH_LIB_ACTION) {
        if (view.$store.state.visibleMenus.size<1) {
            setLocalStorageVal('search', '');
            view.searchActive = true;
        }
    } else if (act===MORE_ACTION) {
        if (item.isPodcast) {
            bus.$emit('dlg.open', 'iteminfo', item);
        } else {
            let cmd = view.buildCommand(item, ACTIONS[act].cmd);
            cmd.ismore = true;
            view.fetchItems(cmd, item);
        }
    } else if (act===MORE_LIB_ACTION) {
        view.itemMoreMenu(item);
    } else if (act===PIN_ACTION) {
        // If pinning a 'My Music' item, and we have virtual libraries (libraryName is only et if we do), then ask
        // user if we should save the library_id with the pinned item.
        if (RANDOM_MIX_ID!=item.id && undefined!=view.current && view.current.id==TOP_MYMUSIC_ID && view.libraryName && item.params) {
            confirm(i18n("Store current library with pinned item?")+
                    addNote(i18n("If you store the library when pinning then this library will always be used, regardless of changing the library in 'My Music'. If you elect not to store the library, then changing the library under 'My Music' will effect the items displayed within this pinned item.")),
                    i18n("With"), undefined, i18n("Without")).then(res => {
                if (1==res) {
                    var libId = view.currentLibId ? view.currentLibId : view.$store.state.library ? view.$store.state.library : LMS_DEFAULT_LIBRARY
                    var copy = JSON.parse(JSON.stringify(item));
                    copy.id=libId+"::"+item.id;
                    copy.title=item.title+SEPARATOR+view.libraryName;
                    copy.title=item.title;
                    copy.libname=view.libraryName;
                    copy.params.push("library_id:"+libId);
                    view.pin(copy, true);
                } else if (2==res) {
                    view.pin(item, true);
                }
            });
        } else {
            view.pin(item, true);
        }
    } else if (act===UNPIN_ACTION) {
        view.pin(item, false);
    } else if (!view.playerId()) {  // *************** NO PLAYER ***************
        bus.$emit('showError', undefined, i18n("No Player"));
    } else if (act===RENAME_ACTION) {
        promptForText(i18n("Rename"), item.title, item.title, i18n("Rename")).then(resp => {
            if (resp.ok && resp.value && resp.value.length>0 && resp.value!=item.title) {
                if (item.isPinned) {
                    item.title=resp.value;
                    view.saveTopList();
                } else {
                    var command = SECTION_PLAYLISTS==item.section
                                    ? ["playlists", "rename", item.id, "newname:"+resp.value]
                                    : ["favorites", "rename", item.id, "title:"+resp.value];

                    lmsCommand(view.playerId(), command).then(({data}) => {
                        logJsonMessage("RESP", data);
                        view.refreshList();
                    }).catch(err => {
                        logAndShowError(err, i18n("Rename failed"), command);
                        view.refreshList();
                    });
                }
            }
        });
    } else if (act==ADD_FAV_ACTION) {
        bus.$emit('dlg.open', 'favorite', 'add', {id:(view.current.id.startsWith("item_id:") ? view.current.id+"." : "item_id:")+view.items.length});
    } else if (act==EDIT_ACTION) {
        bus.$emit('dlg.open', 'favorite', 'edit', item);
    } else if (act==ADD_FAV_FOLDER_ACTION) {
        promptForText(ACTIONS[ADD_FAV_FOLDER_ACTION].title, undefined, undefined, i18n("Create")).then(resp => {
            if (resp.ok && resp.value && resp.value.length>0) {
                lmsCommand(view.playerId(), ["favorites", "addlevel", "title:"+resp.value, 
                                             (view.current.id.startsWith("item_id:") ? view.current.id+"." : "item_id:")+view.items.length]).then(({data}) => {
                    logJsonMessage("RESP", data);
                    view.refreshList();
                }).catch(err => {
                    logAndShowError(err, i18n("Failed"), command);
                });
            }
        });
    } else if (act===DELETE_ACTION) {
        confirm(i18n("Delete '%1'?", item.title), i18n('Delete')).then(res => {
            if (res) {
                if (item.id.startsWith("playlist_id:")) {
                    view.clearSelection();
                    var command = ["playlists", "delete", item.id];
                    lmsCommand(view.playerId(), command).then(({data}) => {
                        logJsonMessage("RESP", data);
                        view.refreshList();
                    }).catch(err => {
                        logAndShowError(err, i18n("Failed to delete playlist!"), command);
                    });
                }
            }
        });
    } else if (act==REMOVE_ACTION) {
        confirm(i18n("Remove '%1'?", item.title), i18n('Remove')).then(res => {
            if (res) {
                view.clearSelection();
                lmsCommand(view.playerId(), ["playlists", "edit", "cmd:delete", view.current.id, "index:"+index]).then(({data}) => {
                    logJsonMessage("RESP", data);
                    view.refreshList();
                }).catch(err => {
                    logAndShowError(err, i18n("Failed to remove '%1'!", item.title), command);
                });
            }
        });
    } else if (act==ADD_TO_FAV_ACTION) {
        updateItemFavorites(item);
        var favUrl = item.favUrl ? item.favUrl : item.url;
        var favIcon = item.favIcon;
        var favType = SECTION_PODCASTS==item.section ? "link" : "audio";
        var favTitle = item.origTitle ? item.origTitle : item.title;

        if (item.presetParams && item.presetParams.favorites_url) {
            favUrl = item.presetParams.favorites_url;
            favIcon = item.presetParams.icon;
            if (SECTION_PODCASTS!=item.section) {
                favType = item.presetParams.favorites_type;
            }
            if (item.presetParams.favorites_title) {
                favTitle = item.presetParams.favorites_title;
            }
        }

        var command = ["favorites", "exists", favUrl];
        lmsCommand(view.playerId(), command).then(({data})=> {
            logJsonMessage("RESP", data);
            if (data && data.result && data.result.exists==1) {
                bus.$emit('showMessage', i18n("Already in favorites"));
            } else {
                command = ["favorites", "add", "url:"+favUrl, "title:"+favTitle];
                if (favType) {
                    command.push("type:"+favType);
                }
                if ("group"==item.type) {
                    command.push("hasitems:1");
                }
                if (favIcon) {
                    command.push("icon:"+favIcon);
                }
                if (item.presetParams) {
                    let stdFavParams = new Set(["url", "title", "type", "icon", "favorites_url", "favorites_type", "favorites_title"]);
                    for (var key in item.presetParams) {
                        if (!stdFavParams.has(key)) {
                            command.push(key+":"+item.presetParams[key]);
                        }
                    }
                }
                lmsCommand(view.playerId(), command).then(({data})=> {
                    logJsonMessage("RESP", data);
                    bus.$emit('showMessage', i18n("Added to favorites"));
                    bus.$emit('refreshFavorites');
                }).catch(err => {
                    logAndShowError(err, i18n("Failed to add to favorites!"), command);
                });
            }
        }).catch(err => {
            bus.$emit('showMessage', i18n("Failed to add to favorites!"));
            logError(err, command);
        });
    } else if (act===REMOVE_FROM_FAV_ACTION || act==DELETE_FAV_FOLDER_ACTION) {
        var id = SECTION_FAVORITES==view.current.section ? item.id : "url:"+(item.presetParams && item.presetParams.favorites_url ? item.presetParams.favorites_url : item.favUrl);
        if (undefined==id) {
            return;
        }
        confirm(act===REMOVE_FROM_FAV_ACTION ? i18n("Remove '%1' from favorites?", item.title)
                                             : i18n("Delete '%1'?", item.title)+addNote(i18n("This will remove the folder, and any favorites contained within.")),
                act===REMOVE_FROM_FAV_ACTION ? i18n('Remove') : i18n("Delete")).then(res => {
            if (res) {
                view.clearSelection();
                var command = id.startsWith("url:") ? ["material-skin", "delete-favorite", id] : ["favorites", "delete", id];
                lmsCommand(view.playerId(), command).then(({data}) => {
                    logJsonMessage("RESP", data);
                    bus.$emit('refreshFavorites');
                    if (SECTION_FAVORITES==view.current.section) {
                        view.refreshList();
                    }
                }).catch(err => {
                    logAndShowError(err, i18n("Failed to remove favorite!"), command);
                });
            }
        });
    } else if (act===MOVE_FAV_TO_PARENT_ACTION) {
        view.clearSelection();
        var parent = item.id.replace("item_id:", "").split(".");
        parent.pop();
        parent.pop();
        if (parent.length>0) {
            parent=parent.join(".");
            parent+=".0";
        } else {
            parent="0";
        }
        var command = ["favorites", "move", item.id.replace("item_id:", "from_id:"), "to_id:"+parent];
        lmsCommand(view.playerId(), command).then(({data}) => {
            logJsonMessage("RESP", data);
            view.goBack(true);
        }).catch(err => {
            logAndShowError(err, i18n("Failed to move favorite!"), command);
        });
    } else if (act===ADD_RANDOM_ALBUM_ACTION) {
        var params = [];
        buildStdItemCommand(item, view.command).params.forEach(p => { if (!p.startsWith("sort:")) { params.push(p); } });
        params=browseReplaceCommandTerms(view, {command:[], params:params}).params;
        params.push(SORT_KEY+"random");
        lmsList(view.playerId(), ["albums"], params, 0, 1).then(({data}) => {
            var resp = parseBrowseResp(data, view.current, view.options);
            if (resp.items.length>0 && resp.items[0].id) {
                var item = resp.items[0];
                var command = ["playlistcontrol", "cmd:add", item.id];
                var genrePos = LMS_NO_GENRE_FILTER ? -1 : getField({params:params}, "genre_id:");
                if (genrePos>=0) {
                    command.push(params[genrePos]);
                }
                lmsCommand(view.playerId(), command).then(({data}) => {
                    bus.$emit('refreshStatus');
                    bus.$emit('showMessage', i18n("Appended '%1' to the play queue", item.title));
                }).catch(err => {
                    bus.$emit('showError', err);
                    logError(err, command);
                });
            } else {
                bus.$emit('showError', undefined, i18n("Failed to find an album!"));
            }
        }).catch(err => {
            logAndShowError(err, undefined, ["albums"], params, 0, 1);
        });
    } else if (SELECT_ACTION===act) {
        if (!view.selection.has(index)) {
            if (0==view.selection.size) {
                bus.$emit('browseSelection', true);
            }
            view.selection.add(index);
            view.selectionDuration += itemDuration(view.items[index]);
            item.selected = true;
            forceItemUpdate(view, item);
            if (event && (event.shiftKey || event.ctrlKey) && undefined!=view.lastSelect && index!=view.lastSelect) {
                for (var i=view.lastSelect<index ? view.lastSelect : index, stop=view.lastSelect<index ? index : view.lastSelect, len=view.items.length; i<=stop && i<len; ++i) {
                    view.itemAction(SELECT_ACTION, view.items[i], i);
                }
            }
        }
        view.lastSelect = index;
    } else if (UNSELECT_ACTION===act) {
        view.lastSelect = undefined;
        if (view.selection.has(index)) {
            view.selection.delete(index);
            view.selectionDuration -= itemDuration(view.items[index]);
            item.selected = false;
            forceItemUpdate(view, item);
            if (0==view.selection.size) {
                bus.$emit('browseSelection', false);
            }
        }
    } else if (MOVE_HERE_ACTION==act) {
        if (view.selection.size>0 && !view.selection.has(index)) {
            bus.$emit('movePlaylistItems', view.current.id, Array.from(view.selection).sort(function(a, b) { return a<b ? -1 : 1; }), index);
            view.clearSelection();
        }
    } else if (RATING_ACTION==act) {
        bus.$emit('dlg.open', 'rating', [item.id], item.rating);
    } else if (PLAY_ALBUM_ACTION==act || PLAY_PLAYLIST_ACTION==act) {
        if (item.filter && PLAY_PLAYLIST_ACTION!=act) { // From multi-disc, so need to adjust index
            var idx = index;
            for (var i=0, len=view.items.length; i<idx; ++i) {
                if (view.items[i].header) {
                    index--;
                }
            }
        }
        var command = browseBuildFullCommand(view, view.current, PLAY_ACTION);
        command.command.push("play_index:"+index);
        lmsCommand(view.playerId(), command.command).then(({data}) => {
            logJsonMessage("RESP", data);
            bus.$emit('refreshStatus');
            if (!view.$store.state.desktopLayout) {
                view.$store.commit('setPage', 'now-playing');
            }
        }).catch(err => {
            logAndShowError(err, undefined, command.command);
        });
    } else if (UNSUB_PODCAST_ACTION==act) {
        confirm(i18n("Unsubscribe from '%1'?", item.title), i18n("Unsubscribe")).then(res => {
            if (res) {
                lmsCommand("", ["material-skin", "delete-podcast", "pos:"+item.index, "name:"+item.title]).then(({data}) => {
                    view.refreshList();
                }).catch(err => {
                    logAndShowError(err, i18n("Failed to unsubscribe podcast!"), command);
                    view.refreshList();
                });
            }
        });
    } else if (ADD_ALL_ACTION==act || INSERT_ALL_ACTION==act || PLAY_ALL_ACTION==act || PLAY_DISC_ACTION==act) {
        if (view.current && item.id == view.current.id) { // Called from subtoolbar => act on all items
            if (view.allSongsItem) {
                view.itemAction(ADD_ALL_ACTION==act ? ADD_ACTION : INSERT_ALL_ACTION==act ? INSERT_ACTION : PLAY_ACTION, view.allSongsItem);
            } else {
                view.doList(view.items, act);
                bus.$emit('showMessage', i18n("Adding tracks..."));
            }
        } else { // Need to filter items...
            var itemList = [];
            var isFilter = item.id.startsWith(FILTER_PREFIX) || PLAY_DISC_ACTION==act; // MultiCD's have a 'filter' so we can play a single CD
            var check = isFilter ? (PLAY_DISC_ACTION==act ? item.filter : item.id) : (SEARCH_ID==item.id && view.items[0].id.startsWith("track") ? "track_id" : "album_id");
            var list = item.allItems && item.allItems.length>0 ? item.allItems : view.items;
            var itemIndex = undefined;
            for (var i=0, len=list.length; i<len; ++i) {
                if ((isFilter ? list[i].filter==check : list[i].id.startsWith(check))) {
                    if (INSERT_ALL_ACTION==act) {
                        itemList.unshift(list[i]);
                    } else {
                        if (PLAY_DISC_ACTION == act && list[i].id == item.id) {
                            itemIndex = itemList.length;
                        }
                        itemList.push(list[i]);
                    }
                } else if (itemList.length>0) {
                    break;
                }
            }

            view.doList(itemList, act, itemIndex);
            bus.$emit('showMessage', isFilter || item.id.endsWith("tracks") ? i18n("Adding tracks...") : i18n("Adding albums..."));
        }
    } else if (act==GOTO_ARTIST_ACTION) {
        view.fetchItems(view.replaceCommandTerms({command:["albums"], params:["artist_id:"+item.artist_id, ARTIST_ALBUM_TAGS, SORT_KEY+ARTIST_ALBUM_SORT_PLACEHOLDER]}), {cancache:false, id:"artist_id:"+item.artist_id, title:item.id.startsWith("album_id:") ? item.subtitle : item.artist, stdItem:STD_ITEM_ARTIST});
    } else if (act==GOTO_ALBUM_ACTION) {
        view.fetchItems({command:["tracks"], params:["album_id:"+item.album_id, trackTags(), SORT_KEY+"tracknum"]}, {cancache:false, id:"album_id:"+item.album_id, title:item.album, stdItem:STD_ITEM_ALBUM});
    } else if (ADD_TO_PLAYLIST_ACTION==act) {
        bus.$emit('dlg.open', 'addtoplaylist', [item], [browseBuildCommand(view, item)]);
    } else if (REMOVE_DUPES_ACTION==act) {
        confirm(i18n("Remove duplicate tracks?")+addNote(i18n("This will remove tracks with the same artist and title.")), i18n('Remove')).then(res => {
            if (res) {
                if (view.items[0].id.startsWith("playlist_id:")) { // Showing playlists, so need to get track list...
                    lmsList("", ["playlists", "tracks"], [item.id, PLAYLIST_TRACK_TAGS]).then(({data}) => {
                        var resp = parseBrowseResp(data, item, view.options, undefined);
                        if (resp.items.length>0) {
                            removeDuplicates(item.id, resp.items);
                        } else {
                            bus.$emit('showMessage', i18n('Playlist has no tracks'));
                        }
                    });
                } else {
                    removeDuplicates(item.id, view.items);
                }
            }
        });
    } else if (PLAYLIST_SORT_ACTION==act) {
        if (view.items.length>=1) {
            sortPlaylist(view, undefined, ACTIONS[act].title, ["material-skin", "sort-playlist", item.id]);
        }
    } else if (BR_COPY_ACTION==act) {
        bus.$emit('queueGetSelectedUrls', index, item.id);
    } else if (DOWNLOAD_ACTION==act) {
        // See if we can get album-artist from current view / history
        let aa = view.current.id.startsWith("artist_id:") ? view.current.title : undefined;
        if (aa == undefined) {
            let alb = item.id.startsWith("album_id:") ? item : view.current.id.startsWith("album_id:") ? view.current : undefined;
            if (undefined!=alb) {
                if (undefined!=alb.artists) {
                    aa = alb.artists[0];
                } else if (undefined!=alb.subtitle) {
                    aa = alb.subtitle;
                }
            }
        }
        if (aa == undefined) {
            for (let loop=view.history, len=loop.length, i=len-1; i>0 && aa==undefined; --i) {
                let hi = loop[i].current;
                if (undefined!=hi) {
                    if (hi.id.startsWith("artist_id:")) {
                        aa = hi.title;
                    } else if (hi.id.startsWith("album_id:")) {
                        if (undefined!=hi.artists) {
                            aa = hi.artists[0];
                        } else if (undefined!=hi.subtitle) {
                            aa = hi.subtitle;
                        }
                    }
                }
            }
        }
        download(item, item.id.startsWith("album_id:") ? view.buildCommand(item) : undefined, aa);
    } else if (SHOW_IMAGE_ACTION==act) {
        bus.$emit('dlg.open', 'gallery', [item.image], 0, true);
    } else if (SCROLL_TO_DISC_ACTION==act) {
        var discs = [];
        for (var i=0, loop=view.items, len=loop.length; i<len; ++i) {
            if (loop[i].header) {
                discs.push(loop[i]);
            }
        }
        choose(ACTIONS[act].title, discs).then(choice => {
            if (undefined!=choice) {
                view.jumpTo(choice.jump);
            }
        });
    } else {
        // If we are acting on a multi-disc album, prompt which disc we should act on
        if (item.multi && !view.current.id.startsWith("album_id:") && (PLAY_ACTION==act || ADD_ACTION==act || INSERT_ACTION==act || PLAY_SHUFFLE_ACTION==act)) {
            var command = view.buildCommand(item);
            view.clearSelection();
            lmsList(view.playerId(), command.command, command.params, 0, LMS_BATCH_SIZE, false, view.nextReqId()).then(({data}) => {
                view.options.neverColapseDiscs = true;
                var resp = parseBrowseResp(data, item, view.options, undefined, view.command, view.inGenre);
                view.options.neverColapseDiscs = undefined;
                if (resp.items.length<=0) {
                    return;
                }
                var discs = [{title:i18n('All discs'), subtitle:resp.plainsubtitle ? resp.plainsubtitle : resp.subtitle, id:"ALL_DISCS"}];
                for (var i=0, loop=resp.items, len=loop.length; i<len; ++i) {
                    if (loop[i].header) {
                        discs.push(loop[i]);
                    }
                }
                choose(ACTIONS[act].title, discs).then(choice => {
                    if (undefined!=choice) {
                        if (choice.id==discs[0].id) {
                            if (lmsOptions.playShuffle && (PLAY_ACTION==act || PLAY_SHUFFLE_ACTION==act)) {
                                lmsCommand(view.playerId(), ['playlist', 'shuffle', PLAY_ACTION==act ? 0 : 1]).then(({data}) => {
                                    browsePerformAction(view, item, PLAY_ACTION);
                                });
                            } else {
                                browsePerformAction(view, item, act);
                            }
                            return;
                        }
                        var tracks = [];
                        for (var i=0, loop=resp.items, len=loop.length; i<len; ++i) {
                            if (loop[i].header && loop[i].allItems && loop[i].id==choice.id) {
                                tracks = loop[i].allItems;
                                break;
                            } else if (!loop[i].header && (undefined==choice.id || loop[i].filter==choice.id)) {
                                tracks.push(loop[i]);
                            }
                        }
                        if (tracks.length>0) {
                            bus.$emit('showMessage', i18n("Adding tracks..."));
                            if (lmsOptions.playShuffle && (PLAY_ACTION==act || PLAY_SHUFFLE_ACTION==act)) {
                                lmsCommand(view.playerId(), ['playlist', 'shuffle', PLAY_ACTION==act ? 0 : 1]).then(({data}) => {
                                    view.doList(tracks, act);
                                });
                            } else {
                                view.doList(tracks, act);
                            }
                        }
                    }
                });
            });
            return;
        }

        if (lmsOptions.playShuffle && (PLAY_ACTION==act || PLAY_SHUFFLE_ACTION==act)) {
            lmsCommand(view.playerId(), ['playlist', 'shuffle', PLAY_ACTION==act ? 0 : 1]).then(({data}) => {
                browsePerformAction(view, item, PLAY_ACTION);
            });
        } else {
            browsePerformAction(view, item, act);
        }
    }
}

function browsePerformAction(view, item, act) {
    var command = browseBuildFullCommand(view, item, act);
    if (command.command.length===0) {
        bus.$emit('showError', undefined, i18n("Don't know how to handle this!"));
        return;
    }
    lmsCommand(view.playerId(), command.command).then(({data}) => {
        logJsonMessage("RESP", data);
        bus.$emit('refreshStatus');
        view.clearSelection();
        if (!view.$store.state.desktopLayout || !view.$store.state.showQueue) {
            if (act===PLAY_ACTION) {
                if (!view.$store.state.desktopLayout) {
                    view.$store.commit('setPage', 'now-playing');
                }
            } else if (act===ADD_ACTION) {
                bus.$emit('showMessage', i18n("Appended '%1' to the play queue", undefined==item.title ? view.headerTitle : item.title));
            } else if (act===INSERT_ACTION) {
                bus.$emit('showMessage', i18n("Inserted '%1' into the play queue", undefined==item.title ? view.headerTitle : item.title));
            }
        }
    }).catch(err => {
        logAndShowError(err, undefined, command.command);
    });
}

function browseItemMenu(view, item, index, event) {
    if (view.menu.show && view.menu.item && item.id==view.menu.item.id) {
        view.menu.show=false;
        return;
    }
    if (!item.menu) {
        if (undefined!=item.stdItem) {
            // Get menu items - if view is an album or track from search then we have a different menu
            var itm = STD_ITEMS[item.stdItem];
            showMenu(view, {show:true, item:item, x:event.clientX, y:event.clientY, index:index,
                            itemMenu:itm.searchMenu && (view.current.libsearch || view.current.allItems)
                                ? itm.searchMenu
                                : undefined!=itm.maxBeforeLarge && view.listSize>itm.maxBeforeLarge
                                    ? itm.largeListMenu
                                    : itm.menu});
        } else if (TOP_MYMUSIC_ID==item.id) {
            view.showLibMenu(event, index);
        }
        return;
    }
    if (1==item.menu.length && MORE_ACTION==item.menu[0] && SECTION_PODCASTS!=item.section) {
        if (item.moremenu) {
            showMenu(view, {show:true, item:item, x:event.clientX, y:event.clientY, index:index});
        } else {
            var command = browseBuildFullCommand(view, item, item.menu[0]);
            lmsList(view.playerId(), command.command, command.params, 0, 100, false).then(({data}) => {
                var resp = parseBrowseResp(data, item, view.options, undefined);
                if (resp.items.length>0) {
                    item.moremenu = resp.items;
                    showMenu(view, {show:true, item:item, x:event.clientX, y:event.clientY, index:index});
                } else {
                    logAndShowError(undefined, i18n("No entries found"), command.command);
                }
            });
        }
    } else {
        showMenu(view, {show:true, item:item, itemMenu:item.menu, x:event.clientX, y:event.clientY, index:index});
    }
}

function browseHeaderAction(view, act, event, ignoreOpenMenus) {
    if (view.$store.state.visibleMenus.size>0 && !ignoreOpenMenus) {
        return;
    }
    if (USE_LIST_ACTION==act) {
        view.changeLayout(false);
    } else if (USE_GRID_ACTION==act) {
        view.changeLayout(true);
    } else if (ALBUM_SORTS_ACTION==act || TRACK_SORTS_ACTION==act) {
        var sort=ALBUM_SORTS_ACTION==act ? getAlbumSort(view.command, view.inGenre) : getTrackSort(view.current.stdItem);
        var menuItems=[];
        var sorts=ALBUM_SORTS_ACTION==act ? B_ALBUM_SORTS : B_TRACK_SORTS;
        for (var i=0,len=sorts.length; i<len; ++i) {
            menuItems.push({key:sorts[i].key, label:sorts[i].label, selected:sort.by==sorts[i].key});
        }
        showMenu(view, {show:true, x:event ? event.clientX : window.innerWidth, y:event ? event.clientY : 52, sortItems:menuItems, reverseSort:sort.rev,
                        isAlbums:ALBUM_SORTS_ACTION==act, name:'sort'});
    } else if (VLIB_ACTION==act) {
        view.showLibMenu(event);
    } else if (undefined!=view.current.allid && (ADD_ACTION==act || PLAY_ACTION==act)) {
        view.itemAction(act, {swapid:view.current.allid, id:view.items[0].id, title:view.current.title,
                              goAction:view.items[0].goAction, params:view.items[0].params, section:view.items[0].section});
    } else if (ADD_TO_PLAYLIST_ACTION==act) {
        bus.$emit('dlg.open', 'addtoplaylist', view.items);
    } else if (RELOAD_ACTION==act) {
        view.refreshList(true);
        bus.$emit('showMessage', i18n('Reloading'));
    } else if (ADV_SEARCH_ACTION==act) {
        bus.$emit('dlg.open', 'advancedsearch', false);
    } else if (SAVE_VLIB_ACTION==act) {
        promptForText(ACTIONS[SAVE_VLIB_ACTION].title, undefined, undefined, i18n("Save")).then(resp => {
            if (resp.ok && resp.value && resp.value.length>0) {
                var command = JSON.parse(JSON.stringify(view.command.command));
                command.push("savelib:"+resp.value);
                lmsCommand("", command).then(({data}) => {
                    bus.$emit('showMessage', i18n("Saved virtual library."));
                }).catch(err => {
                    bus.$emit('showError', undefined, i18n("Failed to save virtual library!"));
                    logError(err);
                });
            }
        });
    } else {
        // If we are adding/playing/inserting from an artist's list of albums, check if we are using reverse sort
        // if we are then we need to add each album in the list one by one...'
        if ((PLAY_ACTION==act || ADD_ACTION==act) && STD_ITEM_ARTIST==view.current.stdItem) {
            var reverseSort = false;
            for (var i=0, loop=view.command.params, len=loop.length; i<len; ++i) {
                if (loop[i]==MSK_REV_SORT_OPT) {
                    view.itemAction(PLAY_ACTION==act ? PLAY_ALL_ACTION : ADD_ALL_ACTION, view.current);
                    return;
                }
            }
        }
        view.itemAction(act, view.current);
    }
}

function browseGoHome(view) {
    view.searchActive = false;
    if (view.history.length==0) {
        return;
    }
    if (view.fetchingItem!=undefined) {
        view.nextReqId();
        view.fetchingItem = undefined;
    }
    view.selection = new Set();
    var prev = view.history.length>0 ? view.history[0].pos : 0;
    view.items = view.top;
    view.jumplist = [];
    view.filteredJumplist = [];
    view.history=[];
    view.current = null;
    view.currentLibId = null;
    view.pinnedItemLibName = undefined;
    view.headerTitle = null;
    view.headerSubTitle=null;
    view.baseActions=[];
    view.currentBaseActions=[];
    view.currentItemImage=undefined;
    view.tbarActions=[];
    view.isTop = true;
    view.grid = {allowed:true, use:isSetToUseGrid(GRID_OTHER), numColumns:0, ih:GRID_MIN_HEIGHT, rows:[], few:false, haveSubtitle:true};
    view.currentActions=[{action:(view.grid.use ? USE_LIST_ACTION : USE_GRID_ACTION)}];
    view.hoverBtns = !IS_MOBILE;
    view.command = undefined;
    view.showRatingButton = false;
    view.subtitleClickable = false;
    view.inGenre = undefined;
    view.canDrop = true;
    view.$nextTick(function () {
        view.setBgndCover();
        view.filterJumplist();
        view.layoutGrid(true);
        setScrollTop(view, prev.pos>0 ? prev.pos : 0);
    });
}

function browseGoBack(view, refresh) {
    if (view.fetchingItem!=undefined) {
        view.nextReqId();
        view.fetchingItem = undefined;
        return;
    }
    let searchWasActive = view.searchActive;
    if (view.searchActive) {
        view.searchActive = false;
        if (view.items.length<1 || (undefined==view.items[0].allItems && SEARCH_OTHER_ID!=view.items[0].id)) {
            return; // Search results not being shown, so '<-' button just closes search field
        }
    }
    if (view.prevPage && !view.$store.state.desktopLayout) {
        var nextPage = ""+view.prevPage;
        //if (NP_INFO==nextPage || NP_EXPANDED==nextPage) {
        //    view.$nextTick(function () {
        //        view.$nextTick(function () {
        //            //if (!view.$store.state.desktopLayout) {
        //                view.$store.commit('setPage', 'now-playing');
        //            //}
        //            if (NP_INFO==nextPage) {
        //                bus.$emit('info');
        //            } else {
        //                bus.$emit('expandNowPlaying', true);
        //            }
        //        });
        //    });
        //} else { // if (!view.$store.state.desktopLayout) {
            view.$nextTick(function () { view.$nextTick(function () { view.$store.commit('setPage', NP_INFO==nextPage || NP_EXPANDED==nextPage ? 'now-playing' : nextPage); }); });
        //}
    }
    if (view.history.length<2) {
        view.goHome();
        return;
    }
    view.selection = new Set();
    var prev = view.history.pop();
    view.items = prev.items;
    view.listSize = prev.listSize;
    view.allSongsItem = prev.allSongsItem;
    view.jumplist = prev.jumplist;
    view.filteredJumplist = [];
    view.grid = prev.grid;
    view.hoverBtns = prev.hoverBtns;
    view.baseActions = prev.baseActions;
    view.current = prev.current;
    view.currentBaseActions = prev.currentBaseActions;
    view.currentItemImage = prev.currentItemImage;
    view.currentActions = prev.currentActions;
    view.currentLibId = prev.currentLibId;
    view.pinnedItemLibName = prev.pinnedItemLibName;
    view.headerTitle = prev.headerTitle;
    view.headerSubTitle = prev.headerSubTitle;
    view.detailedSubInfo = prev.detailedSubInfo;
    view.detailedSubExtra = prev.detailedSubExtra;
    view.tbarActions = prev.tbarActions;
    view.command = prev.command;
    view.showRatingButton = prev.showRatingButton;
    view.subtitleClickable = prev.subtitleClickable;
    view.prevPage = prev.prevPage;
    view.allItems = prev.allItems;
    view.inGenre = prev.inGenre;
    view.searchActive = prev.searchActive && !searchWasActive;
    view.canDrop = prev.canDrop;
    view.itemCustomActions = prev.itemCustomActions;

    if (refresh || prev.needsRefresh) {
        view.refreshList();
    } else {
        view.$nextTick(function () {
            view.setBgndCover();
            view.filterJumplist();
            view.layoutGrid(true);
            setScrollTop(view, prev.pos>0 ? prev.pos : 0);
        });
    }
}

function browseBuildCommand(view, item, commandName, doReplacements) {
    var cmd = {command: [], params: [] };

    if (undefined===item || null===item) {
        console.error("Null item passed to buildCommand????");
        return cmd;
    }

    if (undefined==commandName) {
        cmd = buildStdItemCommand(item, view.command);
    }

    if (cmd.command.length<1) { // Build SlimBrowse command
        if (undefined==commandName) {
            commandName = "go";
        }
        var baseActions = view.current == item ? view.currentBaseActions : view.baseActions;
        var command = item.actions && item.actions[commandName]
                    ? item.actions[commandName]
                    : "go" == commandName && item.actions && item.actions["do"]
                        ? item.actions["do"]
                        : baseActions
                            ? baseActions[commandName]
                                ? baseActions[commandName]
                                : "go" == commandName && baseActions["do"]
                                    ? baseActions["do"]
                                    : undefined
                            : undefined;

        if (command) {
            cmd.command = [];
            if (command.cmd) {
                command.cmd.forEach(i => {
                    cmd.command.push(i);
                });
            }
            cmd.params = [];
            var addedKeys = new Set();
            [command.params, item.commonParams].forEach(p => {
                if (p) {
                    for (var key in p) {
                        if (p[key]!=undefined && p[key]!=null && (""+p[key]).length>0) {
                            cmd.params.push(key+":"+p[key]);
                            addedKeys.add(key);
                         }
                    }
                }
            });
            if (command.itemsParams && item[command.itemsParams]) {
                /*var isMore = "more" == commandName;*/
                for(var key in item[command.itemsParams]) {
                    if ((/* !isMore || */ ("touchToPlaySingle"!=key && "touchToPlay"!=key)) && !addedKeys.has(key)) {
                        let val = item[command.itemsParams][key];
                        if (val!=undefined && val!=null && (""+val).length>0) {
                            cmd.params.push(key+":"+item[command.itemsParams][key]);
                            addedKeys.add(key);
                        }
                    }
                }
            }
            // Check params used to initially build current list, and add any missing onlineServices
            // Releated to LMS issue https://github.com/Logitech/slimserver/issues/806
            if (undefined!=baseActions && undefined!=baseActions.parentParams) {
                for (let i=0, loop=baseActions.parentParams, len=loop.length; i<len; ++i) {
                    let key = loop[i].split(":")[0];
                    if (!addedKeys.has(key)) {
                        cmd.params.push(loop[i]);
                        addedKeys.add(key);
                    }
                }
            }
        }

        // Convert local browse commands into their non-SlimBrowse equivalents, so that sort and tags can be applied

        if (cmd.command.length==2 && "browselibrary"==cmd.command[0] && "items"==cmd.command[1]) {
            var p=[];
            var c=[];
            var canReplace = true;
            var mode = undefined;
            var hasSort = false;
            var hasTags = false;
            var hasArtistId = false;
            var hasLibraryId = false;
            var hasNonArtistRole = false; // i.e. composer, conductor, etc.

            for (var i=0, params=cmd.params, len=params.length; i<len; ++i) {
                if (params[i].startsWith("mode:")) {
                    mode = params[i].split(":")[1];
                    if (mode.startsWith("myMusicArtists")) {
                        mode="artists";
                    } else if (mode.startsWith("myMusicAlbums") || mode=="randomalbums") {
                        mode="albums";
                    } else if (mode=="vaalbums") {
                        mode="albums";
                    } else if (mode=="years") {
                        p.push("hasAlbums:1");
                    } else if (mode!="artists" && mode!="albums" && mode!="genres" && mode!="tracks" && mode!="playlists") {
                        canReplace = false;
                        break;
                    }
                    c.push(mode);
                } else if (!params[i].startsWith("menu:")) {
                    if (params[i].startsWith("tags:")) {
                        if (params[i].split(":")[1].indexOf('s')<0) {
                            i+='s';
                        }
                        p.push(params[i]);
                        hasTags = true;
                    } else {
                        p.push(params[i]);
                        if (params[i].startsWith(SORT_KEY)) {
                            hasSort = true;
                        } else if (params[i].startsWith("artist_id:")) {
                            hasArtistId = true;
                        } else if (params[i].startsWith("library_id:")) {
                            hasLibraryId = true;
                        } else if (params[i].startsWith("role_id:")) {
                            var role = params[i].split(':')[1].toLowerCase();
                            if ('albumartist'!=role && '5'!=role) {
                                hasNonArtistRole = true;
                            }
                        }
                    }
                }
            }

            if (canReplace && c.length==1 && mode) {
                if (mode=="tracks") {
                    if (!hasTags) {
                        p.push(trackTags());
                    }
                    if (!hasSort) {
                        p.push(SORT_KEY+"tracknum");
                    }
                } else if (mode=="albums") {
                    if (!hasTags) {
                        p.push(hasArtistId ? ARTIST_ALBUM_TAGS_PLACEHOLDER : ALBUM_TAGS_PLACEHOLDER);
                    }
                    if (!hasSort) {
                        p.push(SORT_KEY+(hasArtistId ? ARTIST_ALBUM_SORT_PLACEHOLDER : ALBUM_SORT_PLACEHOLDER));
                    }
                } else if (mode=="playlists") {
                    if (!hasTags) {
                        p.push(PLAYLIST_TAGS_PLACEHOLDER);
                    }
                } else if (!hasTags) {
                    if (mode=="artists" || mode=="vaalbums") {
                        p.push(ARTIST_TAGS_PLACEHOLDER);
                        if (!hasLibraryId && !hasNonArtistRole) {
                            p.push('include_online_only_artists:1');
                        }
                    } else if (mode=="years" || mode=="genres") {
                        p.push("tags:s");
                    }
                }
                cmd = {command: c, params: p};
            }
        } else if (view.command && view.command.params && cmd.command[0]=="artistinfo" || cmd.command[0]=="albuminfo") {
            // artistinfo and albuminfo when called from 'More' pass down (e.g.) 'item_id:5' view seems to somtimes fail
            // (actually most times with epiphany) due to 'connectionID' changing?
            // See https://forums.slimdevices.com/showthread.php?111749-quot-artistinfo-quot-JSONRPC-call-sometimes-fails
            // Passing artist_id and album_id should work-around view.
            var haveArtistId = false;
            var haveAlbumId = false;
            for (var i=0, len=cmd.params.length; i<len; ++i) {
                if (cmd.params[i].startsWith("artist_id:")) {
                    haveArtistId = true;
                } else if (cmd.params[i].startsWith("album_id:")) {
                    haveAlbumId = true;
                }
            }
            if (!haveArtistId || !haveAlbumId) {
                for (var i=0, len=view.command.params.length; i<len; ++i) {
                    if ( (!haveArtistId && view.command.params[i].startsWith("artist_id:")) ||
                         (!haveAlbumId && view.command.params[i].startsWith("album_id:")) ) {
                        cmd.params.push(view.command.params[i]);
                    }
                }
            }
        }
    }

    if (undefined==doReplacements || doReplacements) {
        cmd=view.replaceCommandTerms(cmd, item);
    }

    return cmd;
}

function browseMyMusicMenu(view) {
    if (view.myMusic.length>0 && !view.myMusic[0].needsUpdating) {
        browseCheckExpand(view);
        return;
    }
    view.fetchingItem = {id:TOP_ID_PREFIX};
    lmsCommand("", ["material-skin", "browsemodes"]).then(({data}) => {
        if (data && data.result) {
            logJsonMessage("RESP", data);
            view.myMusic = [];
            var stdItems = new Set();
            // Get basic, configurable, browse modes...
            if (data && data.result && data.result.modes_loop) {
                for (var idx=0, loop=data.result.modes_loop, loopLen=loop.length; idx<loopLen; ++idx) {
                    var c = loop[idx];
                    stdItems.add(c.id);
                    if (view.$store.state.disabledBrowseModes.has(c.id)) {
                        continue;
                    }
                    var command = view.buildCommand({id:c.id, actions:{go:{cmd:["browselibrary","items"], params:c.params}}}, "go", false);
                    var item = { title: c.text,
                                 command: command.command,
                                 params: command.params,
                                 weight: c.weight ? parseFloat(c.weight) : 100,
                                 id: MUSIC_ID_PREFIX+c.id,
                                 type: "group",
                                 icon: "music_note"
                                };
                    var tryMapping = false;
                    if (c.id.startsWith("myMusicArtistsAudiobooks")) {
                        item.icon = "edit";
                        item.cancache = true;
                    } else if (c.id.startsWith("myMusicArtists")) {
                        mapArtistIcon(item.params, item);
                        item.cancache = true;
                    } else if (c.id.startsWith("myMusicAlbumsVariousArtists")) {
                        item.icon = undefined;
                        item.svg = "album-multi";
                        item.cancache = true;
                    } else if (c.id.startsWith("myMusicAlbumsAudiobooks")) {
                        item.icon = "local_library";
                        item.cancache = true;
                    } else if (c.id.startsWith("myMusicAlbums")) {
                        item.icon = "album";
                        item.cancache = true;
                    } else if (c.id.startsWith("myMusicGenres")) {
                        item.svg = "guitar-acoustic";
                        item.icon = undefined;
                        item.cancache = false;
                        item.id = GENRES_ID;
                    } else if (c.id == "myMusicPlaylists") {
                        item.icon = "list";
                        item.section = SECTION_PLAYLISTS;
                    } else if (c.id.startsWith("myMusicYears")) {
                        item.icon = "date_range";
                        item.cancache = true;
                        item.id = YEARS_ID;
                    } else if (c.id == "myMusicNewMusic") {
                        item.icon = "new_releases";
                        item.section = SECTION_NEWMUSIC;
                    } else if (c.id.startsWith("myMusicMusicFolder")) {
                        item.icon = "folder";
                    } else if (c.id.startsWith("myMusicFileSystem")) {
                        item.icon = "computer";
                    } else if (c.id == "myMusicRandomAlbums") {
                        item.svg = "dice-album";
                        item.icon = undefined;
                    } else if (c.id.startsWith("myMusicTopTracks")) {
                        item.icon = "arrow_upward";
                        item.limit = 200;
                    } else if (c.id.startsWith("myMusicFlopTracks")) {
                        item.icon = "arrow_downward";
                        item.limit = 200;
                    } else if (c.icon) {
                        if (c.icon.endsWith("/albums.png")) {
                            item.icon = "album";
                        } else if (c.icon.endsWith("/artists.png")) {
                            item.svg = "artist";
                            item.icon = undefined;
                        } else if (c.icon.endsWith("/genres.png")) {
                            item.svg = "guitar-acoustic";
                            item.icon = undefined;
                        } else {
                            tryMapping = true;
                        }
                    } else {
                        tryMapping = true;
                    }
                    if (tryMapping && mapIcon(c)) {
                        item.svg = c.svg;
                        item.icon = c.icon;
                    }
                    item.params.push("menu:1");
                    if (getField(item, "genre_id:")>=0) {
                        item['mapgenre']=true;
                    }
                    view.myMusic.push(item);
                }
            }
            // Now get standard menu, for extra (e.g. CustomBrowse) entries...
            if (!view.playerId()) { // No player, then can't get playre specific items just yet
                view.processMyMusicMenu();
                view.myMusic[0].needsUpdating=true; // Still needs updating to get the rest of view...
                view.fetchingItem = undefined;
                browseCheckExpand(view);
            } else {
                lmsList(view.playerId(), ["menu", "items"], ["direct:1"]).then(({data}) => {
                    if (data && data.result && data.result.item_loop) {
                        logJsonMessage("RESP", data);
                        for (var idx=0, loop=data.result.item_loop, loopLen=loop.length; idx<loopLen; ++idx) {
                            var c = loop[idx];
                            if (c.node=="myMusic" && c.id) {
                                if (c.id=="randomplay") {
                                    view.myMusic.push({ title: i18n("Random Mix"),
                                                          svg: "dice-multiple",
                                                          id: RANDOM_MIX_ID,
                                                          type: "app",
                                                          weight: c.weight ? parseFloat(c.weight) : 100 });
                                } else if (!c.id.startsWith("myMusicSearch") && !c.id.startsWith("opmlselect") && !stdItems.has(c.id)) {
                                    var command = view.buildCommand(c, "go", false);
                                    var item = { title: c.text,
                                                 command: command.command,
                                                 params: command.params,
                                                 weight: c.weight ? parseFloat(c.weight) : 100,
                                                 id: MUSIC_ID_PREFIX+c.id,
                                                 type: "group",
                                                 icon: undefined
                                                };

                                    if (c.id == "dynamicplaylist") {
                                        item.svg = "dice-list";
                                        item.icon = undefined;
                                    } else if (c.id.startsWith("trackstat")) {
                                        item.icon = "bar_chart";
                                    } else if (c.id.startsWith("artist")) {
                                        item.svg = "artist";
                                        item.icon = undefined;
                                    } else if (c.id.startsWith("playlists")) {
                                        item.icon = "list";
                                        item.section = SECTION_PLAYLISTS;
                                    } else if (c.id == "moods") {
                                        item.svg = "magic-wand";
                                        item.icon = undefined;
                                    } else if (c.id == "custombrowse" || (c.menuIcon && c.menuIcon.endsWith("/custombrowse.png"))) {
                                        if (command.params.length==1 && command.params[0].startsWith("hierarchy:new")) {
                                            item.limit=LMS_NEW_MUSIC_LIMIT;
                                        }
                                        if (c.id.startsWith("artist")) {
                                            item.svg = "artist";
                                            item.icon = undefined;
                                        } else if (c.id.startsWith("genre")) {
                                            item.svg = "guitar-acoustic";
                                            item.icon = undefined;
                                        } else {
                                            item.icon = c.id.startsWith("new") ? "new_releases" :
                                                        c.id.startsWith("album") ? "album" :
                                                        c.id.startsWith("artist") ? "group" :
                                                        c.id.startsWith("decade") || c.id.startsWith("year") ? "date_range" :
                                                        c.id.startsWith("playlist") ? "list" :
                                                        c.id.startsWith("ratedmysql") ? "star" : undefined;
                                        }
                                    } else if (c.icon) {
                                        if (c.icon.endsWith("/albums.png")) {
                                            item.icon = "album";
                                        } else if (c.icon.endsWith("/artists.png")) {
                                            item.svg = "artist";
                                            item.icon = undefined;
                                        } else if (c.icon.endsWith("/genres.png")) {
                                            item.svg = "guitar-acoustic";
                                            item.icon = undefined;
                                        }
                                    }
                                    if (undefined==item.icon && undefined==item.svg) {
                                        if (mapIcon(c)) {
                                            item.svg = c.svg;
                                            item.icon = c.icon;
                                        } else {
                                            item.icon = "music_note";
                                        }
                                    }
                                    if (getField(item, "genre_id:")>=0) {
                                        item['mapgenre']=true;
                                    }
                                    view.myMusic.push(item);
                                }
                            }
                        }
                        view.processMyMusicMenu();
                    }
                    view.fetchingItem = undefined;
                    browseCheckExpand(view);
                }).catch(err => {
                    view.fetchingItem = undefined;
                    logAndShowError(err);
                    browseCheckExpand(view);
                });
            }
        }
    }).catch(err => {
        view.fetchingItem = undefined;
        logAndShowError(err);
        browseCheckExpand(view);
    });
}

function browseAddPinned(view, pinned) {
    for (var len=pinned.length, i=len-1; i>=0; --i) {
        if (undefined==pinned[i].command && undefined==pinned[i].params && undefined!=pinned[i].item) { // Previous pinned apps
            var command = view.buildCommand(pinned[i].item);
            pinned[i].params = command.params;
            pinned[i].command = command.command;
            pinned[i].image = pinned[i].item.image;
            pinned[i].icon = pinned[i].item.icon;
            pinned[i].item = undefined;
        }
        pinned[i].menu = undefined == pinned[i].url ? [RENAME_ACTION, UNPIN_ACTION] : [PLAY_ACTION, INSERT_ACTION, ADD_ACTION, DIVIDER, RENAME_ACTION, UNPIN_ACTION];
        view.options.pinned.add(pinned[i].id);
        view.top.unshift(pinned[i]);
    }
    if (view.history.length<1) {
        view.items = view.top;
    }
    for (var i=0, len=view.myMusic.length; i<len; ++i) {
        view.myMusic[i].menu=[view.options.pinned.has(view.myMusic[i].id) ? UNPIN_ACTION : PIN_ACTION];
    }
    view.saveTopList();
    removeLocalStorage("pinned");
}

function browsePin(view, item, add, mapped) {
    var index = -1;
    var lastPinnedIndex = -1;
    for (var i=0, len=view.top.length; i<len; ++i) {
        if (view.top[i].id == (item.isRadio ? item.presetParams.favorites_url : item.id)) {
            index = i;
            break;
        } else if (!view.top[i].id.startsWith(TOP_ID_PREFIX)) {
            lastPinnedIndex = i;
        }
    }

    if (add && index==-1) {
        if (item.mapgenre && !mapped) {
            var field = getField(item, "genre_id:");
            if (field>=0) {
                lmsCommand("", ["material-skin", "map", item.params[field]]).then(({data}) => {
                   if (data.result.genre) {
                        item.params[field]="genre:"+data.result.genre;
                        browsePin(view, item, add, true);
                    }
                });
                return;
            }
        }
        if (item.isRadio) {
            view.top.splice(lastPinnedIndex+1, 0,
                            {id: item.presetParams.favorites_url, title: item.title, image: item.image, icon: item.icon, svg: item.svg, isPinned: true,
                             url: item.presetParams.favorites_url, menu: [PLAY_ACTION, INSERT_ACTION, ADD_ACTION, DIVIDER, RENAME_ACTION, UNPIN_ACTION],
                             weight: undefined==item.weight ? 10000 : item.weight});
        } else if (item.type=='extra') {
            view.top.splice(lastPinnedIndex+1, 0,
                            {id: item.id, title: item.title, icon: item.icon, svg: item.svg, url: item.url, isPinned: true, type:item.type,
                             menu: [RENAME_ACTION, UNPIN_ACTION], weight:10000});
        } else if (item.type=='settingsPlayer') {
            view.top.splice(lastPinnedIndex+1, 0,
                            {id: item.id, title: item.title, image: item.image, icon: item.icon, svg: item.svg, isPinned: true, type:item.type,
                             actions: item.actions, players: item.players, menu: [RENAME_ACTION, UNPIN_ACTION], weight:10000});
        } else {
            var command = view.buildCommand(item, undefined, false);
            view.top.splice(lastPinnedIndex+1, 0,
                            {id: item.id, title: item.title, libname: item.libname, image: item.image, icon: item.icon, svg: item.svg, mapgenre: item.mapgenre,
                             command: command.command, params: command.params, isPinned: true, menu: [RENAME_ACTION, UNPIN_ACTION],
                             weight: undefined==item.weight ? 10000 : item.weight, section: item.section, cancache: item.cancache});
        }
        view.options.pinned.add(item.id);
        view.updateItemPinnedState(item);
        view.saveTopList();
        bus.$emit('showMessage', i18n("Pinned '%1' to home screen.", item.title));
        bus.$emit('pinnedChanged');
    } else if (!add && index!=-1) {
        confirm(i18n("Un-pin '%1'?", item.title), i18n('Un-pin')).then(res => {
            if (res) {
                view.top.splice(index, 1);
                view.options.pinned.delete(item.id);
                view.updateItemPinnedState(item);
                if (item.id.startsWith(MUSIC_ID_PREFIX)) {
                    for (var i=0, len=view.myMusic.length; i<len; ++i) {
                        view.myMusic[i].menu=[view.options.pinned.has(view.myMusic[i].id) ? UNPIN_ACTION : PIN_ACTION];
                    }
                }
                view.saveTopList();
                bus.$emit('pinnedChanged');
            }
        });
    }
}

function browseUpdateItemPinnedState(view, item) {
    if (item.menu) {
        for (var i=0, len=item.menu.length; i<len; ++i) {
            if (item.menu[i] == PIN_ACTION || item.menu[i] == UNPIN_ACTION) {
                item.menu[i] = item.menu[i] == PIN_ACTION ? UNPIN_ACTION : PIN_ACTION;
                break;
            }
        }
        if (item.id.startsWith(TOP_ID_PREFIX)) {
            for (var i=0, len=view.myMusic.length; i<len; ++i) {
                view.myMusic[i].menu=[view.options.pinned.has(view.myMusic[i].id) ? UNPIN_ACTION : PIN_ACTION];
            }
        }
    }
}

function browseReplaceCommandTerms(view, cmd, item) {
    if (shouldAddLibraryId(cmd)) {
        // Check if command already has library_id
        var haveLibId = false;
        for (var i=0, len=cmd.params.length; i<len; ++i) {
            if (cmd.params[i].startsWith("library_id:")) {
                let id = cmd.params[i].split(":")[1];
                if (undefined!=id && (""+id)!="") {
                    haveLibId = true;
                    cmd.libraryId = id;
                    break;
                }
            }
        }
        if (!haveLibId) { // Command does not have library_id. Use lib from parent command (if set), or user's chosen library
            var libId = view.currentLibId ? view.currentLibId : view.$store.state.library ? view.$store.state.library : LMS_DEFAULT_LIBRARY;
            if (libId) {
                cmd.params.push("library_id:"+libId);
                cmd.libraryId = libId;
            }
        }
    }

    // Replace sort, search terms, and fix tags (ratings and online emblems)
    if (cmd.params.length>0) {
        for (var i=0, len=cmd.params.length; i<len; ++i) {
            if (item && item.swapid && cmd.params[i]==item.id) {
                cmd.params[i]=item.swapid;
            } else if (cmd.params[i].startsWith(SORT_KEY+TRACK_SORT_PLACEHOLDER)) {
                var sort=getTrackSort(view.current.stdItem);
                cmd.params[i]=cmd.params[i].replace(SORT_KEY+TRACK_SORT_PLACEHOLDER, SORT_KEY+sort.by);
                if (sort.rev) {
                    cmd.params.push(MSK_REV_SORT_OPT);
                }
            } else if (cmd.params[i].startsWith(SORT_KEY+ALBUM_SORT_PLACEHOLDER) ||
                       cmd.params[i].startsWith(SORT_KEY+ARTIST_ALBUM_SORT_PLACEHOLDER)) {
                var sort=getAlbumSort(cmd, view.inGenre);
                cmd.params[i]=cmd.params[i].replace(SORT_KEY+ALBUM_SORT_PLACEHOLDER, SORT_KEY+sort.by)
                                           .replace(SORT_KEY+ARTIST_ALBUM_SORT_PLACEHOLDER, SORT_KEY+sort.by);
                if (sort.rev) {
                    cmd.params.push(MSK_REV_SORT_OPT);
                }
            } else {
                cmd.params[i]=cmd.params[i].replace(TERM_PLACEHOLDER, view.enteredTerm)
                                           .replace(ARTIST_ALBUM_TAGS_PLACEHOLDER, ARTIST_ALBUM_TAGS)
                                           .replace(ALBUM_TAGS_PLACEHOLDER, (lmsOptions.showAllArtists ? ALBUM_TAGS_ALL_ARTISTS : ALBUM_TAGS))
                                           .replace(ARTIST_TAGS_PLACEHOLDER, ARTIST_TAGS)
                                           .replace(PLAYLIST_TAGS_PLACEHOLDER, PLAYLIST_TAGS);
                if (cmd.params[i].startsWith("tags:")) {
                    if (view.$store.state.showRating && "tracks"==cmd.command[0] && cmd.params[i].indexOf("R")<0) {
                        cmd.params[i]+="R";
                    }
                    if (LMS_SRV_EMBLEM && ("tracks"==cmd.command[0] || "albums"==cmd.command[0]) && cmd.params[i].indexOf("E")<0) {
                        cmd.params[i]+="E";
                    }
                }
            }
        }
    }
    return cmd;
}

function browseBuildFullCommand(view, item, act) {
    var command = browseBuildCommand(view, item, ACTIONS[act].cmd);
    if (command.command.length<1) { // Non slim-browse command
        if (item.url && (!item.id || (!item.id.startsWith("playlist_id:") && !item.id.startsWith("track_id")))) {
            command.command = ["playlist", INSERT_ACTION==act ? "insert" : ACTIONS[act].cmd, item.url, item.title];
        } else if (item.app && item.id) {
            command.command = [item.app, "playlist", INSERT_ACTION==act ? "insert" :ACTIONS[act].cmd, item.id];
        } else if (item.isFolderItem || item.isUrl) {
            command.command = ["playlist", INSERT_ACTION==act ? "insert" : ACTIONS[act].cmd, item.id];
        } else if (item.id) {
            command.command = ["playlistcontrol", "cmd:"+(act==PLAY_ACTION ? "load" : INSERT_ACTION==act ? "insert" :ACTIONS[act].cmd)];
            if (item.id.startsWith("album_id:")  || item.id.startsWith("artist_id:")) {
                var params = undefined!=item.stdItem || undefined!=item.altStdItem ? buildStdItemCommand(item, item.id==view.current.id ? view.history.length>0 ? view.history[view.history.length-1].command : undefined : view.command).params : item.params;
                for (var i=0, loop = params, len=loop.length; i<len; ++i) {
                    if ( (!LMS_NO_ROLE_FILTER && (loop[i].startsWith("role_id:"))) ||
                         (!LMS_NO_GENRE_FILTER && loop[i].startsWith("genre_id:")) ||
                         loop[i].startsWith("artist_id:")) {
                        if (!item.id.startsWith("artist_id:") || !loop[i].startsWith("artist_id:")) {
                            command.command.push(loop[i]);
                        }
                        if (loop[i].startsWith("artist_id:") && !item.id.startsWith("album_id:")) {
                            command.params.push(SORT_KEY+ARTIST_ALBUM_SORT_PLACEHOLDER);
                        }
                    }
                }
            } else if (item.id.startsWith("genre_id:")) {
                command.params.push(SORT_KEY+ALBUM_SORT_PLACEHOLDER);
            }

            command.command.push(originalId(item.id));
        }
        command=browseReplaceCommandTerms(view, command);
    }

    if (command.command.length===0) {
        return command;
    }

    // Add params onto command...
    if (command.params.length>0) {
        command.params.forEach(i => {
            command.command.push(i);
        });
    }
    return command;
}

function browseDoList(view, list, act, index) {
    act = ADD_ALL_ACTION==act ? ADD_ACTION : PLAY_ALL_ACTION==act || PLAY_DISC_ACTION==act ? PLAY_ACTION : INSERT_ALL_ACTION==act ? INSERT_ACTION : act;
    // Perform an action on a list of items. If these are tracks, then we can use 1 command...
    if (list[0].id.startsWith("track_id:")) {
        var ids="";
        for (var i=0, len=list.length; i<len; ++i) {
            if (ids.length<1) {
                ids+=originalId(list[i].id);
            } else {
                ids+=","+originalId(list[i].id).split(":")[1];
            }
        }
        var command = browseBuildFullCommand(view, {id:ids}, /*PLAY_ACTION==act && undefined!=index ? ADD_ACTION :*/ act);
        if (command.command.length===0) {
            bus.$emit('showError', undefined, i18n("Don't know how to handle this!"));
            return;
        }
        if (!command.command.includes(ids)) { // Selection from MusicIP mix does not get IDs???
            command.command.push(ids);
        }
        if (PLAY_ACTION==act) {
            if (undefined!=index) {
                command.command.push("play_index:"+index);
            }

            lmsCommand(view.playerId(), ["playlist", "clear"]).then(({data}) => {
                lmsCommand(view.playerId(), command.command).then(({data}) => {
                    bus.$emit('refreshStatus');
                    logJsonMessage("RESP", data);
                    if (!view.$store.state.desktopLayout) {
                        view.$store.commit('setPage', 'now-playing');
                    }
                }).catch(err => {
                    logError(err, command.command);
                });
            });
        } else {
            lmsCommand(view.playerId(), command.command).then(({data}) => {
                logJsonMessage("RESP", data);
            }).catch(err => {
                logError(err, command.command);
            });
        }
    } else {
        var commands = [];
        for (var i=0, len=list.length; i<len; ++i) {
            if (list[i].stdItem || (list[i].menu && list[i].menu.length>0 && list[i].menu[0]==PLAY_ACTION)) {
                commands.push({act:PLAY_ACTION==act ? (0==commands.length ? PLAY_ACTION : ADD_ACTION) : act, item:list[i]});
            }
        }
        browseDoCommands(view, commands, PLAY_ACTION==act, 'refreshStatus');
    }
}

function browseDoCommandChunks(view, chunks, npAfterLast, refreshSig) {
    var chunk = chunks.shift();
    lmsCommand(view.playerId(), ["material-skin-client", "command-list", "commands:"+JSON.stringify(chunk)]).then(({data}) => {
        logJsonMessage("RESP", data);
        if (0==chunks.length) { // Last chunk actioned
            if (undefined!=refreshSig) {
                bus.$emit(refreshSig);
                setTimeout(function () { bus.$emit(refreshSig); }.bind(view), 500);
            }
            if (npAfterLast && !view.$store.state.desktopLayout && data && data.result && parseInt(data.result.actioned)>0) {
                view.$store.commit('setPage', 'now-playing');
            }
        } else {
            if (undefined!=refreshSig) {
                // If we have a signal to refresh, then allow a few ms for this to be sent before doing next chunk
                bus.$emit(refreshSig);
                setTimeout(function () { browseDoCommandChunks(view, chunks, npAfterLast, refreshSig); }.bind(view), 10);
            } else {
                browseDoCommandChunks(view, chunks, npAfterLast, refreshSig);
            }
        }
    }).catch(err => {
        logError(err, chunk);
    });
}

function browseDoCommands(view, commands, npAfterLast, refreshSig) {
    if (commands.length<1) {
        return;
    }
    let chunks=[];

    if (PLAY_ACTION==commands[0].act) {
        commands.unshift(["playlist", "clear"]);
    }

    let chunk=[];
    let maxChunkSize = undefined==refreshSig ? 500 : 100;
    for (let i=0, len=commands.length; i<len; ++i) {
        let cmd = commands[i];
        // browseInsertQueue calls this function with pre-built commands, in which case cmd.act is undefined...
        if (undefined!=cmd.act) {
            var command = undefined==cmd.act ? cmd : browseBuildFullCommand(view, cmd.item, cmd.act);
            if (command.command.length===0) {
                bus.$emit('showError', undefined, i18n("Don't know how to handle this!"));
                return;
            }
            cmd = command.command;
        }
        chunk.push(cmd);
        if (chunk.length==maxChunkSize) {
            chunks.push(chunk);
            chunk = [];
        }
    }
    if (chunk.length>0) {
        chunks.push(chunk);
        chunk = [];
    }
    browseDoCommandChunks(view, chunks, npAfterLast, refreshSig);
}

function browseInsertQueueAlbums(view, indexes, queueIndex, queueSize, tracks) {
    if (indexes.length==0) {
        var commands = [];
        for (let len=tracks.length, i=len-1; i>=0; --i, ++queueSize) {
            commands.push(["playlistcontrol", "cmd:add", "track_id:"+tracks[i]]);
            commands.push(["playlist", "move", queueSize, queueIndex]);
        }
        browseDoCommands(view, commands, false, 'refreshStatus');
    } else {
        let index = indexes.pop();
        var cmd = ["tracks", 0, 1000];
        var itemCommand = browseBuildCommand(view, view.items[index]);
        for (var i=0, loop=itemCommand.params, len=loop.length; i<len; ++i) {
            if (!loop[i].startsWith("tags:")) {
                cmd.push(loop[i]);
            }
        }
        lmsCommand("", cmd).then(({data})=>{
            if (data && data.result && data.result.titles_loop) {
                for (var i=0, loop=data.result.titles_loop, loopLen=loop.length; i<loopLen; ++i) {
                    tracks.push(loop[i].id);
                }
            }
            browseInsertQueueAlbums(view, indexes, queueIndex, queueSize, tracks);
        }).catch(err => {
            logError(err);
        });
    }
}

function browseInsertQueue(view, index, queueIndex, queueSize) {
    var commands = [];
    var indexes = [];
    if ((view.selection.size>1) || (-1==index && view.selection.size>0)) {
        var sel = Array.from(view.selection);
        indexes = sel.sort(function(a, b) { return a<b ? 1 : -1; });
    } else if (-1==index) {
        return;
    } else {
        indexes=[index];
    }

    if (view.items[indexes[0]].id.startsWith("album_id:")) {
        browseInsertQueueAlbums(view, indexes, queueIndex, queueSize, []);
    } else if (view.items[indexes[0]].id.startsWith("track_id:")) {
        for (let i=0, len=indexes.length; i<len; ++i, ++queueSize) {
            commands.push(["playlistcontrol", "cmd:add", originalId(view.items[indexes[i]].id)]);
            commands.push(["playlist", "move", queueSize, queueIndex]);
        }
        browseDoCommands(view, commands, false, 'refreshStatus');
    } else {
        for (let i=0, len=indexes.length; i<len; ++i, ++queueSize) {
            var command = browseBuildFullCommand(view, view.items[indexes[i]], ADD_ACTION);
            if (command.command.length>0) {
                commands.push(command.command);
                commands.push(["playlist", "move", queueSize, queueIndex]);
            }
        }
        browseDoCommands(view, commands, false, 'refreshStatus');
    }
    view.clearSelection();
}

function browsePlayerChanged(view) {
    if (view.current && view.current.id==TOP_APPS_ID) {
        view.refreshList(true);
    } else if (view.history.length>1 && view.history[1].current.id==TOP_APPS_ID) {
        view.history[1].needsRefresh = true;
    }
}

function browseAddToPlaylist(view, urls, playlist, pos, plen) {
    var commands = [];
    for (let i=0, len=urls.length; i<len; ++i) {
        commands.push(["playlists", "edit", playlist, "cmd:add", "url:"+urls[i]]);
        if (undefined!=pos && undefined!=plen) {
            commands.push(["playlists", "edit", "cmd:move", playlist, "index:"+plen, "toindex:"+pos]);
            plen++;
            pos++;
        }
    }

    browseDoCommands(view, commands, false, undefined!=pos && undefined!=plen ? 'refreshPlaylist' : undefined);
}

const DEFERRED_LOADED = true;
