function browseAddHistory(view) {
    var prev = {};
    prev.items = view.items;
    prev.allSongsItem = view.allSongsItem;
    prev.jumplist = view.jumplist;
    prev.baseActions = view.baseActions;
    prev.current = view.current;
    prev.currentLibId = view.currentLibId;
    prev.currentBaseActions = view.currentBaseActions;
    prev.currentActions = view.currentActions;
    prev.headerTitle = view.headerTitle;
    prev.headerSubTitle = view.headerSubTitle;
    prev.tbarActions = view.tbarActions;
    prev.settingsMenuActions = view.settingsMenuActions;
    prev.pos = view.scrollElement.scrollTop;
    prev.grid = view.grid;
    prev.hoverBtns = view.hoverBtns;
    prev.command = view.command;
    prev.showRatingButton = view.showRatingButton;
    prev.subtitleClickable = view.subtitleClickable;
    prev.prevPage = view.prevPage;
    prev.allSearchResults = view.allSearchResults;
    prev.inGenre = view.inGenre;
    prev.searchActive = view.searchActive;
    prev.canDrop = view.canDrop;
    view.prevPage = undefined;
    view.history.push(prev);
}

function browseActions(args) {
    var actions=[];
    if (undefined==args['artist'] || (args['artist']!=i18n('Various Artists') && args['artist'].toLowerCase()!='various artists')) {
        if (lmsOptions.infoPlugin) {
            if (undefined!=args['artist_id'] || undefined!=args['artist']) {
                actions.push({title:i18n('Artist biography'), icon:'menu_book',
                              do:{ command: undefined!=args['artist_id']
                                                ? ['musicartistinfo', 'biography', 'html:1', 'artist_id:'+args['artist_id']]
                                                : ['musicartistinfo', 'biography', 'html:1', 'artist:'+args['artist']],
                                   params:[]},
                              weight:0});
                actions.push({title:i18n('Pictures'), icon:'insert_photo',
                              do:{ command: undefined!=args['artist_id']
                                                ? ['musicartistinfo', 'artistphotos', 'html:1', 'artist_id:'+args['artist_id']]
                                                : ['musicartistinfo', 'artistphotos', 'html:1', 'artist:'+args['artist']],
                                   params:[]},
                              weight:0});
            }
            if (undefined!=args['album_id'] || (undefined!=args['album'] && (undefined!=args['artist_id'] || undefined!=args['artist']))) {
                actions.push({title:i18n('Album review'), icon:'local_library',
                              do:{ command: undefined!=args['album_id']
                                                ? ['musicartistinfo', 'albumreview', 'html:1', 'album_id:'+args['album_id']]
                                                : undefined!=args['artist_id']
                                                    ? ['musicartistinfo', 'albumreview', 'html:1', 'album:'+args['album'], 'artist_id:'+args['artist_id']]
                                                    : ['musicartistinfo', 'albumreview', 'html:1', 'album:'+args['album'], 'artist:'+args['artist']],
                                   params:[]},
                              weight:0});
            }
            if (undefined!=args['path']) {
                actions.push({localfiles:true, title:i18n('Local files'), icon:'insert_drive_file', do:{ command:['musicartistinfo', 'localfiles', 'folder:'+args['path']], params:[]}, weight:2});
            }
        }
        if (lmsOptions.youTubePlugin && undefined!=args['artist']) {
            actions.push({title:/*NoTrans*/'YouTube', svg:'youtube',
                          do:{ command: ['youtube','items'], params:['want_url:1', 'item_id:3', 'search:'+args['artist'], 'menu:youtube']},
                          weight:10});
        }

        if (undefined!=args['artist_id'] && undefined==args['album_id'] && undefined!=args['count'] && args['count']>1) {
            var params = ['sort:albumtrack', 'tags:cdrilstyE', 'artist_id:'+args['artist_id']];
            if (undefined!=args['role_id']) {
                params.push(args['role_id']);
            }
            if (undefined!=args['genre_id']) {
                params.push(args['genre_id']);
            }
            actions.push({title:i18n('All songs'), icon:'music_note', do:{ command: ['tracks'], params: params}, weight:3});
        }
        if (undefined!=args['artist_id'] || undefined!=args['album_id']) {
            var custom = getCustomActions(undefined!=args['album_id'] ? "album" : "artist", false);
            if (undefined!=custom) {
                for (var i=0, len=custom.length; i<len; ++i) {
                    custom[i].weight=100;
                    custom[i].custom=true;
                    actions.push(custom[i]);
                }
            }
        }
    }
    return actions;
}

function browseHandleListResponse(view, item, command, resp, prevPage) {
    if (resp && resp.items) {
        // Only add history if view is not a search response replacing a search response...
        if (SEARCH_ID!=item.id || undefined==view.current || SEARCH_ID!=view.current.id) {
            view.addHistory();
        }
        resp.canUseGrid = resp.canUseGrid && (view.$store.state.showArtwork || resp.forceGrid);
        view.canDrop = resp.canDrop;
        view.searchActive = item.id.startsWith(SEARCH_ID);
        view.command = command;
        view.currentBaseActions = view.baseActions;
        view.headerTitle=item.title
                            ? (item.type=="search" || item.type=="entry") && undefined!=view.enteredTerm
                                ? item.title+SEPARATOR+view.enteredTerm
                                : item.title
                            : "?";
        view.current = item;
        view.currentLibId = command.libraryId;
        view.items=resp.items;
        view.allSongsItem=resp.allSongsItem;
        view.jumplist=resp.jumplist;
        view.filteredJumplist = [];
        view.baseActions=resp.baseActions;
        view.tbarActions=[];
        view.settingsMenuActions=[];
        view.isTop = false;
        view.subtitleClickable = !IS_MOBILE && view.items.length>0 && undefined!=view.items[0].id && undefined!=view.items[0].artist_id && view.items[0].id.startsWith("album_id:");
        view.grid = {allowed:resp.canUseGrid,
                     use: resp.canUseGrid && (resp.forceGrid || isSetToUseGrid(view.current && view.current.id.startsWith(TOP_ID_PREFIX) && view.current.id!=TOP_FAVORITES_ID ? GRID_OTHER : command)),
                     numColumns:0, ih:GRID_MIN_HEIGHT, rows:[], few:false, haveSubtitle:true};
        view.jumplistActive=0;
        view.prevPage = prevPage;
        view.hoverBtns = !IS_MOBILE && view.items.length>0 &&
                         ( (undefined!=view.items[0].stdItem && view.items[0].stdItem!=STD_ITEM_GENRE && view.items[0].stdItem!=STD_ITEM_YEAR) ||
                           (view.items.length>1 && view.items[0].header && undefined!=view.items[1].stdItem && view.items[1].stdItem!=STD_ITEM_GENRE && view.items[1].stdItem!=STD_ITEM_YEAR) ||
                           resp.allowHoverBtns );

        // Get list of actions (e.g. biography, online services) to show in subtoolbar
        view.currentActions={show:false, items:[]};
        var listingArtistAlbums = view.current.id.startsWith("artist_id:");
        if ((view.current.id.startsWith("artist_id:") && view.command.command[0]=="albums") || (view.current.id.startsWith("album_id:") && view.command.command[0]=="tracks")) {
            var actParams = new Map();
            actParams[view.current.id.split(':')[0]]=view.current.id.split(':')[1];
            if (listingArtistAlbums) {
                actParams['artist']=view.current.title;
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
                actParams['album']=view.current.title;
                if (view.items.length>0) {
                    actParams['path']=decodeURIComponent(view.items[0].url.substring(0, view.items[0].url.lastIndexOf('/'))+'/').substring(7);
                    // if we have (e.g.) /c:/path change to c:/path
                    if (/^\/[a-zA-Z]:\/.+/.test(actParams['path'])) {
                        actParams['path'] = actParams['path'].substring(1);
                    }
                }
            }
            view.currentActions.items = browseActions(actParams);
            if (listingArtistAlbums) {
                for (var i=0, loop=view.onlineServices, len=loop.length; i<len; ++i) {
                    var emblem = getEmblem(loop[i]+':');
                    view.currentActions.items.push({title:/*!i81n*/'wimp'==loop[i] ? 'Tidal' : capitalize(loop[i]),
                                                    weight:10, svg:emblem ? emblem.name : undefined, id:loop[i]});
                }
            } else if (view.$store.state.ratingsSupport && view.items.length>1) {
                view.currentActions.items.push({albumRating:true, title:i18n("Set rating for all tracks"), icon:"stars", weight:99});
            }
            view.currentActions.items.sort(function(a, b) { return a.weight!=b.weight ? a.weight<b.weight ? -1 : 1 : titleSort(a, b) });
            // Artist from online service, but no albums? Add links to services...
            if (listingArtistAlbums && view.items.length==0) {
                view.items.push({id:"intro", title:i18n("No albums have been favorited for this artist. Please use the entries below to look for albums on your online services."), type:"text"});
                for (var i=0, loop=view.currentActions.items, len=loop.length; i<len; ++i) {
                    view.items.push({id:loop[i].id ? loop[i].id : "ca"+i, title:loop[i].title, do:loop[i].do, svg:loop[i].svg, icon:loop[i].icon, currentAction:true});
                }
            }
            view.currentActions.show = view.items.length>0 && view.currentActions.items.length>0;
            if (undefined!=actParams['path']) {
                // Check we have some localfiles, if not hide entry!
                lmsCommand('', ['musicartistinfo', 'localfiles', 'folder:'+actParams['path']]).then(({data}) => {
                    if (!data || !data.result || !data.result.item_loop) {
                        for (var i=0, loop=view.currentActions.items, len=loop.length; i<len; ++i) {
                            if (loop[i].localfiles) {
                                loop.splice(i, 1);
                                break;
                            }
                        }
                    }
                });
            }
        }
        if (item.id.startsWith(SEARCH_ID)) {
            if (view.items.length>0 && view.items[0].id.startsWith("track_id:")) {
                view.tbarActions=[SEARCH_LIB_ACTION, PLAY_ALL_ACTION, ADD_ALL_ACTION];
            } else {
                view.tbarActions=[SEARCH_LIB_ACTION];
            }
        } else if (SECTION_FAVORITES==view.current.section && view.current.isFavFolder) {
            view.tbarActions=[ADD_FAV_FOLDER_ACTION, ADD_FAV_ACTION];
        } else if (command.command.length==2 && command.command[0]=="podcasts" && command.command[1]=="items" && command.params.length==1 && command.params[0]=="menu:podcasts") {
            view.tbarActions=[ADD_PODCAST_ACTION, SEARCH_PODCAST_ACTION];
        } else if (SECTION_PLAYLISTS==view.current.section && view.current.id.startsWith("playlist_id:")) {
            view.tbarActions=[REMOVE_DUPES_ACTION, PLAY_ACTION, ADD_ACTION];
        } else if (view.allSongsItem) {
            view.tbarActions=[PLAY_ALL_ACTION, ADD_ALL_ACTION];
        } else if ("albums"==command.command[0] && command.params.find(elem => elem=="sort:random")) {
            view.tbarActions=[RELOAD_ACTION];
        } else if (view.items.length>0 && (!(view.current && view.current.isPodcast) || addAndPlayAllActions(command))) {
            if (view.current && view.current.menu) {
                for (var i=0, len=view.current.menu.length; i<len; ++i) {
                    if (view.current.menu[i]==ADD_ACTION || view.current.menu[i]==PLAY_ACTION) {
                        view.tbarActions=[PLAY_ACTION, ADD_ACTION];
                        break;
                    }
                }
            }

            // Select track -> More -> Album:AlbumTitle -> Tracks
            if (view.tbarActions.length==0 && view.current && ((view.current.actions && view.current.actions.play) || view.current.stdItem)) {
                view.tbarActions=[PLAY_ACTION, ADD_ACTION];
            }

            // No menu actions? If have 3..200 audio tracks, add a PlayAll/AddAll to toolbar. view will add each item individually
            // 3..200 is chosen so that we dont add these to bandcamp when it shows "Listen as podcast" and "Listen to songs" entries...
            if (view.tbarActions.length==0 && resp.numAudioItems>2 && resp.numAudioItems<=200 &&
                view.command.command.length>0 && ALLOW_ADD_ALL.has(view.command.command[0]) && (!item.id || !item.id.startsWith(TOP_ID_PREFIX))) {
                view.tbarActions=[PLAY_ALL_ACTION, ADD_ALL_ACTION];
            }
        }
        if (resp.canUseGrid && !resp.forceGrid) {
            view.settingsMenuActions.unshift(view.grid.use ? USE_LIST_ACTION : USE_GRID_ACTION);
        }
        if (view.command.command.length>0 && view.command.command[0]=="albums" && view.items.length>0) {
            var addSort=true;
            for (var i=0, len=view.command.params.length; i<len; ++i) {
                if (view.command.params[i].startsWith(SORT_KEY)) {
                    var sort=view.command.params[i].split(":")[1];
                    addSort=sort!="new" && sort!="random";
                } else if (view.command.params[i].startsWith("search:")) {
                    addSort=false;
                    break;
                }
            }
            if (addSort) {
                view.settingsMenuActions.unshift(ALBUM_SORTS_ACTION);
            }
        }
        bus.$emit('settingsMenuActions', view.settingsMenuActions, 'browse');
        if (resp.subtitle) {
            view.headerSubTitle=resp.subtitle;
        } else if ( (1==view.items.length && ("text"==view.items[0].type || "html"==view.items[0].type)) ||
                    (listingArtistAlbums && 0==view.items.length) /*Artist from online service*/ ) {
            view.headerSubTitle = undefined;
        } else {
            view.headerSubTitle=0==view.items.length ? i18n("Empty") : i18np("1 Item", "%1 Items", view.items.length);
        }
        view.$nextTick(function () {
            view.setBgndCover();
            view.filterJumplist();
            view.layoutGrid(true);
            setScrollTop(view, 0);
        });
    }
}

function browseHandleTextClickResponse(view, item, command, data, isMoreMenu) {
    var resp = parseBrowseResp(data, item, view.options);
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
            view.refreshList();
        } else if (view.history.length>0 && (nextWindow=="parent" || nextWindow=="nowplaying" || (isMoreMenu && nextWindow=="grandparent"))) {
            // If "trackinfo items" has "parent" and returns an empty list, then don't go back... Work-around for:
            // https://forums.slimdevices.com/showthread.php?109624-Announce-Material-Skin&p=983626&viewfull=1#post983626
            if (nextWindow!="parent" || command.command[0]!="trackinfo" || command.command[1]!="items" || !resp.items || resp.items.length>0) {
                view.goBack(true);
            }
        } else if (nextWindow=="grandparent" && view.history.length>1) {
            view.history.pop();
            view.goBack(true);
        }
        if (nextWindow=="nowplaying" && !view.$store.state.desktopLayout) {
            view.$store.commit('setPage', 'now-playing');
        }
    } else if (command.command.length>3 && command.command[1]=="playlist" && command.command[2]=="play") {
        bus.$emit('showMessage', item.title);
        view.goBack(true);
    } else if (resp.items && (resp.items.length>0 || (command.command.length>1 && command.command[0]=="favorites" && command.command[1]=="items"))) {
        view.handleListResponse(item, command, resp);
    } else if (command && command.command && command.command[0]=='globalsearch') {
        bus.$emit('showMessage', i18n('No results found'));
    }
}

function browseClick(view, item, index, event) {
    if (view.fetchingItems || "html"==item.type) {
         return;
    }
    if (view.menu.show) {
        view.menu.show=false;
        return;
    }
    if (view.$store.state.visibleMenus.size>0) {
        return;
    }
    if ("search"==item.type || "entry"==item.type) {
        if (view.grid.use || view.useRecyclerForLists) {
            promptForText(item.title, "", "").then(resp => {
                if (resp.ok && resp.value && resp.value.length>0) {
                    if ("search"==item.type) {
                        view.search(undefined, item, resp.value);
                    } else {
                        view.entry(undefined, item, resp.value);
                    }
                }
            });
        }
        return;
    }
    if (item.header) {
        if (item.allSearchResults && item.allSearchResults.length>0) { // Clicking on 'X Artists' / 'X Albums' / 'X Tracks' search header
            view.addHistory();
            view.items = item.allSearchResults;
            view.headerSubTitle = item.subtitle;
            view.current = item;
            view.searchActive = false;
            if (item.menu && item.menu.length>0 && item.menu[0]==PLAY_ALL_ACTION) {
                view.tbarActions=[PLAY_ALL_ACTION, ADD_ALL_ACTION];
            }
            setScrollTop(view, 0);
        } else if (view.selection.size>0) {
            view.select(item, index, event);
        } else if (view.$store.state.showMenuAudio) {
            view.itemMenu(item, index, event);
        }
        return;
    }
    if (view.selection.size>0) {
        view.select(item, index, event);
        return;
    }
    if (item.isPinned && undefined!=item.url && "extra"!=item.type) { // Radio
        view.itemMenu(item, index, event);
        return;
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
        if (view.$store.state.showMenuAudio) {
            view.itemMenu(item, index, event);
        }
        return;
    }
    if (isTextItem(item) && !item.id.startsWith(TOP_ID_PREFIX) && !item.id.startsWith(MUSIC_ID_PREFIX)) {
        if (view.canClickText(item)) {
            view.doTextClick(item);
        } else if (item.isPodcast) {
            view.fetchUrlItems(item.id, 'rss', item);
        }
        return;
    }
    if (item.type=="extra") {
        if (view.$store.state.player) {
            bus.$emit('dlg.open', 'iframe', item.url+'player='+view.$store.state.player.id, item.title+SEPARATOR+view.$store.state.player.name, undefined, true);
        } else {
            bus.$emit('showError', undefined, i18n("No Player"));
        }
        return;
    }

    if (TOP_MYMUSIC_ID==item.id) {
        view.addHistory();
        view.items = view.myMusic;
        view.myMusicMenu();
        view.headerTitle = item.title;
        view.headerSubTitle = i18n("Browse music library");
        view.current = item;
        setScrollTop(view, 0);
        view.isTop = false;
        view.tbarActions=[VLIB_ACTION, SEARCH_LIB_ACTION];
        view.grid = {allowed:true, use:isSetToUseGrid(GRID_OTHER), numColumns:0, ih:GRID_MIN_HEIGHT, rows:[], few:false, haveSubtitle:true};
        view.settingsMenuActions=[view.grid.use ? USE_LIST_ACTION : USE_GRID_ACTION];
        view.layoutGrid(true);
        bus.$emit('settingsMenuActions', view.settingsMenuActions, 'browse');
    } else if (RANDOM_MIX_ID==item.id) {
        bus.$emit('dlg.open', 'rndmix');
    } else if (!item.genreArtists && STD_ITEM_GENRE==item.stdItem && view.current && view.current.id==GENRES_ID) {
        view.addHistory();
        view.items=[];
        view.items.push({ title: lmsOptions.separateArtists ? i18n("All Artists") : i18n("Artists"),
                      command: ["artists"],
                      params: [item.id, ARTIST_TAGS, 'include_online_only_artists:1'],
                      svg: "artist",
                      type: "group",
                      id: uniqueId(item.id, view.items.length),
                      genreArtists:true });
        if (lmsOptions.separateArtists) {
              view.items.push({ title: i18n("Album Artists"),
                  command: ["artists"],
                  params: [item.id, ARTIST_TAGS, 'role_id:ALBUMARTIST', 'include_online_only_artists:1'],
                  svg: "albumartist",
                  type: "group",
                  id: uniqueId(item.id, view.items.length),
                  genreArtists:true });
        }
        view.items.push({ title: i18n("Albums"),
                      command: ["albums"],
                      params: [item.id, ALBUM_TAGS_PLACEHOLDER, SORT_KEY+ALBUM_SORT_PLACEHOLDER],
                      menu: [],
                      icon: "album",
                      type: "group",
                      id: uniqueId(item.id, view.items.length)});
        view.items.push({ title: i18n("Random Albums"),
                      command: ["albums"],
                      params: [item.id, ALBUM_TAGS_PLACEHOLDER, "sort:random"],
                      menu: [],
                      svg: "dice-album",
                      type: "group",
                      id: uniqueId(item.id, view.items.length)});
        view.inGenre = item.title;
        if (LMS_COMPOSER_GENRES.has(item.title)) {
            view.items.push({ title: i18n("Composers"),
                                command: ["artists"],
                                params: ["role_id:COMPOSER", item.id, ARTIST_TAGS, 'include_online_only_artists:1'],
                                cancache: true,
                                svg: "composer",
                                type: "group",
                                id: uniqueId(item.id, view.items.length)});
        }
        if (LMS_CONDUCTOR_GENRES.has(item.title)) {
            view.items.push({ title: i18n("Conductors"),
                                command: ["artists"],
                                params: ["role_id:CONDUCTOR", item.id, ARTIST_TAGS, 'include_online_only_artists:1'],
                                cancache: true,
                                svg: "conductor",
                                type: "group",
                                id: uniqueId(item.id, view.items.length)});
        }
        view.headerTitle = item.title;
        view.headerSubTitle = i18n("Select category");
        setScrollTop(view, 0);
        view.isTop = false;
        view.jumplist = view.filteredJumplist = [];
        view.grid = {allowed:true, use:isSetToUseGrid(GRID_OTHER), numColumns:0, ih:GRID_MIN_HEIGHT, rows:[], few:false, haveSubtitle:true};
        view.settingsMenuActions=[view.grid.use ? USE_LIST_ACTION : USE_GRID_ACTION];
        view.layoutGrid(true);
        bus.$emit('settingsMenuActions', view.settingsMenuActions, 'browse');
    } else if (item.weblink) {
        if (!IS_IOS) {
            bus.$emit('dlg.open', 'iframe', item.weblink, item.title, undefined, true);
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
            } else if (view.$store.state.showMenuAudio) {
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
            view.fetchItems(view.buildCommand(item, ACTIONS[act].cmd), item);
        }
    } else if (act===MORE_LIB_ACTION) {
        view.itemMoreMenu(item);
    } else if (act===PIN_ACTION) {
        view.pin(item, true);
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
        if (SECTION_PODCASTS==item.section) {
            bus.$emit('dlg.open', 'podcast', 'edit', item);
        } else {
            bus.$emit('dlg.open', 'favorite', 'edit', item);
        }
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
        var favType = "audio";
        var favTitle = item.origTitle ? item.origTitle : item.title;

        if (item.presetParams && item.presetParams.favorites_url) {
            favUrl = item.presetParams.favorites_url;
            favIcon = item.presetParams.icon;
            favType = item.presetParams.favorites_type;
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
                var command = ["favorites", "delete", id];
                lmsCommand(view.playerId(), command).then(({data}) => {
                    logJsonMessage("RESP", data);
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
            if (1===resp.items.length && resp.items[0].id) {
                var item = resp.items[0];
                var command = ["playlistcontrol", "cmd:add", item.id];
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
            view.selection.add(index);
            item.selected = true;
            forceItemUpdate(view, item);
            if (event && event.shiftKey) {
                if (undefined!=view.selectStart) {
                    for (var i=view.selectStart<index ? view.selectStart : index, stop=view.selectStart<index ? index : view.selectStart, len=view.items.length; i<=stop && i<len; ++i) {
                        view.itemAction(SELECT_ACTION, view.items[i], i);
                    }
                    view.selectStart = undefined;
                } else {
                    view.selectStart = index;
                }
            } else {
                view.selectStart = undefined;
            }
        } else {
            view.selectStart = undefined;
        }
    } else if (UNSELECT_ACTION===act) {
        view.selectStart = undefined;
        if (view.selection.has(index)) {
            view.selection.delete(index);
            item.selected = false;
            forceItemUpdate(view, item);
        }
    } else if (MOVE_HERE_ACTION==act) {
        if (view.selection.size>0 && !view.selection.has(index)) {
            bus.$emit('movePlaylistItems', view.current.id, Array.from(view.selection).sort(function(a, b) { return a<b ? -1 : 1; }), index);
            view.clearSelection();
        }
    } else if (RATING_ACTION==act) {
        bus.$emit('dlg.open', 'rating', [item.id], item.rating);
    } else if (PLAY_ALBUM_ACTION==act) {
        if (item.filter) { // From multi-disc, so need to adjust index
            for (var i=0, len=view.items.length; i<index; ++i) {
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
    } /*else if (PLAY_DISC_ACTION==act) {
        // TODO: Need to re-add 'index' to doList if enable view action
        var itemList = [];
        var index = undefined;
        for (var i=0, len=view.items.length; i<len; ++i) {
            if (view.items[i].filter==item.filter) {
                if (!view.items[i].header) {
                    itemList.push(view.items[i]);
                    if (index==undefined && view.items[i].id==item.id) {
                        index=i-1; // Skip header
                    }
                }
            } else if (view.items[i].header && itemList.length>0) {
                break;
            }
        }
        view.doList(itemList, PLAY_ACTION, index);
        bus.$emit('showMessage', i18n("Adding tracks..."));
    }*/ else if (SEARCH_PODCAST_ACTION==act) {
        bus.$emit('dlg.open', 'podcastsearch');
    } else if (ADD_PODCAST_ACTION==act) {
        if (item.isPodcast) {
            lmsCommand("", ["material-skin", "add-podcast", "url:"+item.id, "name:"+item.title]).then(({data}) => {
                view.history[view.history.length-1].needsRefresh = true;
                bus.$emit('showMessage', i18n("Added '%1'", item.title));
            }).catch(err => {
                logAndShowError(err, i18n("Failed to remove favorite!"), command);
            });
        } else {
            bus.$emit('dlg.open', 'podcast', 'add');
        }
    } else if (REMOVE_PODCAST_ACTION==act) {
        confirm(i18n("Remove '%1'?", item.title), i18n("Remove")).then(res => {
            if (res) {
                lmsCommand("", ["material-skin", "delete-podcast", "pos:"+item.index, "name:"+item.title]).then(({data}) => {
                    view.refreshList();
                }).catch(err => {
                    logAndShowError(err, i18n("Failed to remove podcast!"), command);
                    view.refreshList();
                });
            }
        });
    } else if (ADD_ALL_ACTION==act || INSERT_ALL_ACTION==act || PLAY_ALL_ACTION==act) {
        if (view.current && item.id == view.current.id) { // Called from subtoolbar => act on all items
            if (view.allSongsItem) {
                view.itemAction(ADD_ALL_ACTION==act ? ADD_ACTION : INSERT_ALL_ACTION==act ? INSERT_ACTION : PLAY_ACTION, view.allSongsItem);
            } else {
                view.doList(view.items, act);
                bus.$emit('showMessage', i18n("Adding tracks..."));
            }
        } else { // Need to filter items...
            var itemList = [];
            var isFilter = item.id.startsWith(FILTER_PREFIX); // MultiCD's have a 'filter' so we can play a single CD
            var check = isFilter ? item.id : (SEARCH_ID==item.id && view.items[0].id.startsWith("track") ? "track_id" : "album_id");
            var list = item.allSearchResults && item.allSearchResults.length>0 ? item.allSearchResults : view.items;
            for (var i=0, len=list.length; i<len; ++i) {
                if ((isFilter ? list[i].filter==check : list[i].id.startsWith(check))) {
                    if (INSERT_ALL_ACTION==act) {
                        itemList.unshift(list[i]);
                    } else {
                        itemList.push(list[i]);
                    }
                } else if (itemList.length>0) {
                    break;
                }
            }
            view.doList(itemList, act);
            bus.$emit('showMessage', isFilter || item.id.endsWith("tracks") ? i18n("Adding tracks...") : i18n("Adding albums..."));
        }
    } else if (act==GOTO_ARTIST_ACTION) {
        view.fetchItems(view.replaceCommandTerms({command:["albums"], params:["artist_id:"+item.artist_id, ARTIST_ALBUM_TAGS, SORT_KEY+ARTIST_ALBUM_SORT_PLACEHOLDER]}), {cancache:false, id:"artist_id:"+item.artist_id, title:item.id.startsWith("album_id:") ? item.subtitle : item.artist, stdItem:STD_ITEM_ARTIST});
    } else if (act==GOTO_ALBUM_ACTION) {
        view.fetchItems({command:["tracks"], params:["album_id:"+item.album_id, TRACK_TAGS, SORT_KEY+"tracknum"]}, {cancache:false, id:"album_id:"+item.album_id, title:item.album, stdItem:STD_ITEM_ALBUM});
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
    } else {
        var command = browseBuildFullCommand(view, item, act);
        if (command.command.length===0) {
            bus.$emit('showError', undefined, i18n("Don't know how to handle this!"));
            return;
        }
        lmsCommand(view.playerId(), command.command).then(({data}) => {
            logJsonMessage("RESP", data);
            bus.$emit('refreshStatus');
            view.clearSelection();
            if (!view.$store.state.desktopLayout) {
                if (act===PLAY_ACTION) {
                    view.$store.commit('setPage', 'now-playing');
                } else if (act===ADD_ACTION) {
                    bus.$emit('showMessage', i18n("Appended '%1' to the play queue", item.title));
                } else if (act===INSERT_ACTION) {
                    bus.$emit('showMessage', i18n("Inserted '%1' into the play queue", item.title));
                }
            }
        }).catch(err => {
            logAndShowError(err, undefined, command.command);
        });
    }
}

function browseItemMenu(view, item, index, event) {
    if (view.menu.show && item.id==view.menu.item.id) {
        view.menu.show=false;
        return;
    }
    if (!item.menu) {
        if (undefined!=item.stdItem) {
            // Ger menu items - if view is an album or track from search then we have a different menu
            var itm = STD_ITEMS[item.stdItem];
            showMenu(view, {show:true, item:item, itemMenu:itm.searchMenu && (view.current.libsearch || view.current.allSearchResults) ? itm.searchMenu : itm.menu, x:event.clientX, y:event.clientY, index:index});
        }
        return;
    }
    if (1==item.menu.length && MORE_ACTION==item.menu[0]) {
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

function browseHeaderAction(view, act, event) {
    if (view.$store.state.visibleMenus.size>0 && (view.$store.state.desktopLayout || view.settingsMenuActions.indexOf(act)<0)) {
        return;
    }
    if (USE_LIST_ACTION==act) {
        view.changeLayout(false);
    } else if (USE_GRID_ACTION==act) {
        view.changeLayout(true);
    } else if (ALBUM_SORTS_ACTION==act) {
        var sort="";
        for (var i=0, len=view.command.params.length; i<len; ++i) {
            if (view.command.params[i].startsWith(SORT_KEY)) {
                sort=view.command.params[i].split(":")[1];
                break;
            }
        }
        var albumSorts=[];
        for (var i=0,len=B_ALBUM_SORTS.length; i<len; ++i) {
            albumSorts.push({key:B_ALBUM_SORTS[i].key, label:B_ALBUM_SORTS[i].label, selected:sort==B_ALBUM_SORTS[i].key});
        }
        showMenu(view, {show:true, x:event ? event.clientX : window.innerWidth, y:event ? event.clientY :0, albumSorts:albumSorts});
    } else if (VLIB_ACTION==act) {
        view.showLibMenu(event);
    } else if (undefined!=view.current.allid && (ADD_ACTION==act || PLAY_ACTION==act)) {
        view.itemAction(act, {swapid:view.current.allid, id:view.items[0].id, title:view.current.title,
                              goAction:view.items[0].goAction, params:view.items[0].params, section:view.items[0].section});
    } else if (ADD_TO_PLAYLIST_ACTION==act) {
        bus.$emit('dlg.open', 'addtoplaylist', view.items);
    } else if (RELOAD_ACTION==act) {
        view.refreshList(true);
    } else {
        view.itemAction(act, view.current);
    }
}

function browseGoHome(view) {
    view.searchActive = false;
    if (view.history.length==0) {
        return;
    }
    if (view.fetchingItems) {
        view.nextReqId();
        view.fetchingItems = false;
    }
    view.selection = new Set();
    var prev = view.history.length>0 ? view.history[0].pos : 0;
    view.items = view.top;
    view.jumplist = [];
    view.filteredJumplist = [];
    view.history=[];
    view.current = null;
    view.currentLibId = null;
    view.headerTitle = null;
    view.headerSubTitle=null;
    view.baseActions=[];
    view.currentBaseActions=[];
    view.currentActions={show:false, items:[]};
    view.tbarActions=[];
    view.isTop = true;
    view.grid = {allowed:true, use:isSetToUseGrid(GRID_OTHER), numColumns:0, ih:GRID_MIN_HEIGHT, rows:[], few:false, haveSubtitle:true};
    view.settingsMenuActions=[view.grid.use ? USE_LIST_ACTION : USE_GRID_ACTION];
    view.hoverBtns = false;
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
    bus.$emit('settingsMenuActions', view.settingsMenuActions, 'browse');
}

function browseGoBack(view, refresh) {
    if (view.fetchingItems) {
        view.nextReqId();
        view.fetchingItems = false;
        return;
    }
    let searchWasActive = view.searchActive;
    if (view.searchActive) {
        view.searchActive = false;
        if (view.items.length<1 || (undefined==view.items[0].allSearchResults && SEARCH_OTHER_ID!=view.items[0].id)) {
            return; // Search results not being shown, so '<-' button just closes search field
        }
    }
    if (view.prevPage && !view.$store.state.desktopLayout) {
        var nextPage = ""+view.prevPage;
        view.$nextTick(function () { view.$nextTick(function () { view.$store.commit('setPage', nextPage); }); });
    }
    if (view.history.length<2) {
        view.goHome();
        return;
    }
    view.selection = new Set();
    var prev = view.history.pop();
    view.items = prev.items;
    view.allSongsItem = prev.allSongsItem;
    view.jumplist = prev.jumplist;
    view.filteredJumplist = [];
    view.grid = prev.grid;
    view.hoverBtns = prev.hoverBtns;
    view.baseActions = prev.baseActions;
    view.current = prev.current;
    view.currentBaseActions = prev.currentBaseActions;
    view.currentActions = prev.currentActions;
    view.currentLibId = prev.currentLibId;
    view.headerTitle = prev.headerTitle;
    view.headerSubTitle = prev.headerSubTitle;
    view.tbarActions = prev.tbarActions;
    view.settingsMenuActions = prev.settingsMenuActions;
    view.command = prev.command;
    view.showRatingButton = prev.showRatingButton;
    view.subtitleClickable = prev.subtitleClickable;
    view.prevPage = prev.prevPage;
    view.allSearchResults = prev.allSearchResults;
    view.inGenre = prev.inGenre;
    view.searchActive = prev.searchActive && !searchWasActive;
    view.canDrop = prev.canDrop;

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
    bus.$emit('settingsMenuActions', view.settingsMenuActions, 'browse');
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
            var addedParams = new Set();
            [command.params, item.commonParams].forEach(p => {
                if (p) {
                    for (var key in p) {
                        if (p[key]!=undefined && p[key]!=null && (""+p[key]).length>0) {
                            var param = key+":"+p[key];
                            cmd.params.push(param);
                            addedParams.add(param);
                         }
                    }
                }
            });
            if (command.itemsParams && item[command.itemsParams]) {
                /*var isMore = "more" == commandName;*/
                for(var key in item[command.itemsParams]) {
                    if (/* !isMore || */ ("touchToPlaySingle"!=key && "touchToPlay"!=key)) {
                        let val = item[command.itemsParams][key];
                        if (val!=undefined && val!=null && (""+val).length>0) {
                            let param = key+":"+item[command.itemsParams][key];
                            if (!addedParams.has(param)) {
                                cmd.params.push(param);
                            }
                        }
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
                        }
                    }
                }
            }

            if (canReplace && c.length==1 && mode) {
                if (mode=="tracks") {
                    if (!hasTags) {
                        p.push(TRACK_TAGS);
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
                        if (!hasLibraryId) {
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
        return;
    }
    view.fetchingItems=true;
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
                        item.svg = "treble-clef";
                        item.icon = undefined;
                        item.cancache = true;
                        item.id = GENRES_ID;
                    } else if (c.id == "myMusicPlaylists") {
                        item.icon = "list";
                        item.section = SECTION_PLAYLISTS;
                    } else if (c.id.startsWith("myMusicYears")) {
                        item.icon = "date_range";
                        item.cancache = true;
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
                            item.svg = "treble-clef";
                            item.icon = undefined;
                        }
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
                view.fetchingItems = false;
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
                                                 icon: "music_note"
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
                                            item.limit=lmsOptions.newMusicLimit;
                                        }
                                        if (c.id.startsWith("artist")) {
                                            item.svg = "artist";
                                            item.icon = undefined;
                                        } else if (c.id.startsWith("genre")) {
                                            item.svg = "treble-clef";
                                            item.icon = undefined;
                                        } else {
                                            item.icon = c.id.startsWith("new") ? "new_releases" :
                                                        c.id.startsWith("album") ? "album" :
                                                        c.id.startsWith("artist") ? "group" :
                                                        c.id.startsWith("decade") || c.id.startsWith("year") ? "date_range" :
                                                        c.id.startsWith("playlist") ? "list" :
                                                        c.id.startsWith("ratedmysql") ? "star" :
                                                        "music_note";
                                        }
                                    } else if (c.icon) {
                                        if (c.icon.endsWith("/albums.png")) {
                                            item.icon = "album";
                                        } else if (c.icon.endsWith("/artists.png")) {
                                            item.svg = "artist";
                                            item.icon = undefined;
                                        } else if (c.icon.endsWith("/genres.png")) {
                                            item.svg = "treble-clef";
                                            item.icon = undefined;
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
                    view.fetchingItems = false;
                }).catch(err => {
                    view.fetchingItems = false;
                    logAndShowError(err);
                });
            }
        }
    }).catch(err => {
        view.fetchingItems = false;
        logAndShowError(err);
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
        if (view.top[i].id == item.id) {
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
        } else {
            var command = view.buildCommand(item, undefined, false);
            view.top.splice(lastPinnedIndex+1, 0,
                            {id: item.id, title: item.title, image: item.image, icon: item.icon, svg: item.svg, mapgenre: item.mapgenre,
                             command: command.command, params: command.params, isPinned: true, menu: [RENAME_ACTION, UNPIN_ACTION],
                             weight: undefined==item.weight ? 10000 : item.weight, section: item.section, cancache: item.cancache});
        }
        view.options.pinned.add(item.id);
        view.updateItemPinnedState(item);
        view.saveTopList();
        bus.$emit('showMessage', i18n("Pinned '%1' to home screen.", item.title));
    } else if (!add && index!=-1) {
        confirm(i18n("Un-pin '%1'?", item.title), i18n('Un-pin')).then(res => {
            if (res) {
                view.top.splice(index, 1);
                view.options.pinned.delete(item.id);
                view.updateItemPinnedState(item);
                view.saveTopList();
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
        var albumSort=getAlbumSort(cmd, view.inGenre);
        for (var i=0, len=cmd.params.length; i<len; ++i) {
            if (item && item.swapid && cmd.params[i]==item.id) {
                cmd.params[i]=item.swapid;
            } else {
                cmd.params[i]=cmd.params[i].replace(SORT_KEY+ALBUM_SORT_PLACEHOLDER, SORT_KEY+albumSort)
                                           .replace(SORT_KEY+ARTIST_ALBUM_SORT_PLACEHOLDER, SORT_KEY+albumSort)
                                           .replace(TERM_PLACEHOLDER, view.enteredTerm)
                                           .replace(ARTIST_ALBUM_TAGS_PLACEHOLDER, ARTIST_ALBUM_TAGS)
                                           .replace(ALBUM_TAGS_PLACEHOLDER, ALBUM_TAGS)
                                           .replace(ARTIST_TAGS_PLACEHOLDER, ARTIST_TAGS)
                                           .replace(PLAYLIST_TAGS_PLACEHOLDER, PLAYLIST_TAGS);
                if (cmd.params[i].startsWith("tags:")) {
                    cmd.params[i]+=(view.$store.state.showRatings && "tracks"==cmd.command[0] ? "R" : "")+
                                   (lmsOptions.serviceEmblems && ("tracks"==cmd.command[0] || "albums"==cmd.command[0]) ? "E" : "");
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
                var params = undefined!=item.stdItem ? buildStdItemCommand(item, item.id==view.current.id ? view.history.length>0 ? view.history[view.history.length-1].command : undefined : view.command).params : item.params;
                for (var i=0, loop = params, len=loop.length; i<len; ++i) {
                    if ( (!lmsOptions.noRoleFilter && (loop[i].startsWith("role_id:"))) ||
                         (!lmsOptions.noGenreFilter && loop[i].startsWith("genre_id:")) ||
                         loop[i].startsWith("artist_id:")) {
                        if (!item.id.startsWith("artist_id:") || !loop[i].startsWith("artist_id:")) {
                            command.command.push(loop[i]);
                        }
                        if (loop[i].startsWith("artist_id:")) {
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

function browseDoList(view, list, act/*, index*/) {
    act = ADD_ALL_ACTION==act ? ADD_ACTION : PLAY_ALL_ACTION==act ? PLAY_ACTION : act;
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
            lmsCommand(view.playerId(), ["playlist", "clear"]).then(({data}) => {
                lmsCommand(view.playerId(), command.command).then(({data}) => {
                    /*if (undefined!=index) {
                        bus.$emit('playerCommand', ["playlist", "index", index]);
                    }*/
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
        view.doCommands(commands, PLAY_ACTION==act);
    }
}

function browseDoCommands(view, commands, npAfterLast, clearSent, actionedCount) {
   if (commands.length>0) {
        if (undefined==actionedCount) {
            actionedCount = 0;
        } else {
            actionedCount++;
            if (commands.length>10 && (2==actionedCount || 25==actionedCount || 50==actionedCount || 0===actionedCount%100)) {
                bus.$emit('refreshStatus');
            }
        }
        if (!clearSent && PLAY_ACTION==commands[0].act) {
            lmsCommand(view.playerId(), ["playlist", "clear"]).then(({data}) => {
                view.doCommands(commands, npAfterLast, true);
            });
            return;
        }
        var cmd = commands.shift();
        // browseInsertQueue calls thos function with pre-built commands, in wicch case cmd.act is undefined...
        if (undefined!=cmd.act) {
            var command = undefined==cmd.act ? cmd : browseBuildFullCommand(view, cmd.item, cmd.act);
            if (command.command.length===0) {
                bus.$emit('showError', undefined, i18n("Don't know how to handle this!"));
                return;
            }
            cmd = command.command;
        }

        lmsCommand(view.playerId(), cmd).then(({data}) => {
            logJsonMessage("RESP", data);
            if (npAfterLast && 0==commands.length && !view.$store.state.desktopLayout) {
                view.$store.commit('setPage', 'now-playing');
            }
            view.doCommands(commands, npAfterLast, clearSent, actionedCount);
        }).catch(err => {
            logError(err, command.command);
        });
    } else {
        bus.$emit('refreshStatus');
    }
}

function browseInsertQueueAlbums(view, indexes, queueIndex, queueSize, tracks) {
    if (indexes.length==0) {
        var commands = [];
        for (let len=tracks.length, i=len-1; i>=0; --i, ++queueSize) {
            commands.push(["playlistcontrol", "cmd:add", "track_id:"+tracks[i]]);
            commands.push(["playlist", "move", queueSize, queueIndex]);
        }
        browseDoCommands(view, commands, false, false, 0, true);
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
    if (view.selection.size>1) {
        var sel = Array.from(view.selection);
        indexes = sel.sort(function(a, b) { return a<b ? 1 : -1; });
    } else {
        indexes=[index];
    }

    if (view.items[indexes[0]].id.startsWith("album_id:")) {
        browseInsertQueueAlbums(view, indexes, queueIndex, queueSize, []);
    } else {
        for (let i=0, len=indexes.length; i<len; ++i, ++queueSize) {
            commands.push(["playlistcontrol", "cmd:add", originalId(view.items[indexes[i]].id)]);
            commands.push(["playlist", "move", queueSize, queueIndex]);
        }
        browseDoCommands(view, commands, false, false, 0, true);
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

const DEFERRED_LOADED = true;
