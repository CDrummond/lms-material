/**
 * LMS-Material
 *
 * Copyright (c) 2018-2024 Craig Drummond <craig.p.drummond@gmail.com>
 * MIT license.
 */
'use strict';

const MORE_COMMANDS = new Set(["item_add", "item_insert", "itemplay"/*, "item_fav"*/]);
const MIXER_APPS = new Set(["musicip", "blissmixer", "musicsimilarity"]);
const STREAM_SCHEMAS = new Set(["http", "https", "wavin"]);
const HIDE_APPS_FOR_PARTY = new Set(["apps.accuradio", "apps.ardaudiothek", "apps.bbcsounds", "apps.cplus", "apps.globalplayeruk", "apps.iheartradio", "apps.lastmix", "apps.mixcloud", "apps.planetradio", "apps.podcasts", "apps.radiofrance", "apps.radionet", "apps.radionowplaying", "apps.radioparadise", "apps.squeezecloud", "apps.timesradio", "apps.ukradioplayer", "apps.virginradio", "apps.wefunk", "apps.phishin", "apps.walkwithme"]);
const RELEASE_TYPES = ["ALBUM", "EP", "BOXSET", "BESTOF", "COMPILATION", "SINGLE", "APPEARANCE", "APPEARANCE_BAND", "APPEARANCE_CONDUCTOR", "COMPOSITION"];
const ARTIST_ROLES = new Set([1,5])
const TRACK_ARTIST_ROLE = 6;
const COMPOSER_ARTIST_ROLE = 2;
const CONDUCTOR_ARTIST_ROLE = 3;
const BAND_ARTIST_ROLE = 4;

function itemText(i) {
    return i.title ? i.title : i.name ? i.name : i.caption ? i.caption : i.credits ? i.credits : undefined;
}

function removeDiactrics(key) {
    if (undefined!=key && key.length==1) {
        var code = key.charCodeAt(0);
        if (code>127) { // Non-ASCII...
            key=key.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        }
    }
    return key==" " ? "?" : key;
}

function appearanceSuffix(rel) {
    let type = undefined!=lmsOptions.releaseAppearances[rel] ? lmsOptions.releaseAppearances[rel] : undefined;
    if (type) {
        return " (" + type + ")";
    }
    if ("APPEARANCE_BAND"==rel) {
        return " (Band/Orchestra)";
    }
    if ("APPEARANCE_CONDUCTOR"==rel) {
        return " (Conductor)";
    }
    return "";
}

function releaseTypeHeader(rel) {
    if (undefined!=lmsOptions.releaseTypes[rel]) {
        return lmsOptions.releaseTypes[rel][1];
    }
    // Keep ALBUM translation for pre LMS8.4 installs
    // ...as even for these we split out albums and compilations, etc.
    if (rel=="ALBUM") {
        return i18n("Albums");
    }
    if (rel=="COMPILATION") {
        return i18n("Compilations");
    }
    if (rel.startsWith("APPEARANCE")) {
        return i18n("Appearances")+appearanceSuffix(rel);
    }
    if (rel=="COMPOSITION") {
        return i18n("Composer Albums");
    }
    return rel.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
}

function releaseTypeSort(a, b) {
    let list = undefined==lmsOptions.releaseTypeOrder ? RELEASE_TYPES : lmsOptions.releaseTypeOrder
    let va = list.indexOf(a);
    let vb = list.indexOf(b);
    if (va<0) {
        va=list.length;
    }
    if (vb<0) {
        vb=list.length;
    }
    if (va<vb) {
        return -1;
    }
    if (va>vb) {
        return 1;
    }
    return fixedSort(a, b);
}

function setFavoritesParams(i, item) {
    if (undefined!=i.favorites_url && (undefined!=i.favorites_title || undefined!=i.favorites_text)) {
        item.favUrl=i.favorites_url;
        item.favTitle=undefined!=i.favorites_title ? i.favorites_title : i.favorites_text;
    }
}

function parseBrowseResp(data, parent, options, cacheKey, parentCommand, parentGenre) {
    // NOTE: If add key to resp, then update addToCache in utils.js
    var resp = {items: [], allSongsItem:undefined, showCompositions:false, baseActions:[], canUseGrid: false, jumplist:[], numAudioItems:0, canDrop:false, itemCustomActions:undefined, extra:undefined };
    var allowPinning = !queryParams.party && (!LMS_KIOSK_MODE || !HIDE_FOR_KIOSK.has(PIN_ACTION));

    try {
    if (data && data.result) {
        logJsonMessage("RESP", data);
        resp.listSize = data.result.count;

        var command = data && data.params && data.params.length>1 && data.params[1] && data.params[1].length>1 ? data.params[1][0] : undefined;
        var isMusicIpMoods = command == "musicip" && data.params[1].length>0 && data.params[1][1]=="moods";
        var textKeys = new Set();

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
            var isFavorites = parent && parent.isFavFolder
            var isFromFavorites = isFavorites || (data.params[1].length>=1 && data.params[1][0]=="favorites") ? true : false;
            var isPlaylists = parent && parent.section == SECTION_PLAYLISTS;
            var isRadios = parent && parent.section == SECTION_RADIO;
            var isRadiosTop = isRadios && parent.id == TOP_RADIO_ID;
            var isApps = parent && parent.section == SECTION_APPS;
            var isAppsTop = parent && parent.id == TOP_APPS_ID;
            var isPodcastList = parent && parent.id == "apps.podcasts" && command == "podcasts" && 5==data.params[1].length && "items" == data.params[1][1] && "menu:podcasts"==data.params[1][4];
            var isPodcastSearch = command == "podcasts" && getIndex(data.params[1], "search:")>0;
            var isBmf = command == "browselibrary" && data.params[1].length>=5 && data.params[1].indexOf("mode:bmf")>0;
            var isCustomBrowse = command == "custombrowse" ;
            var isDynamicPlaylist = command == "dynamicplaylist";
            var isPresets = command == "presets";
            var haveWithIcons = false;
            var haveWithoutIcons = false;
            var menu = undefined;
            var types = new Set();
            var images = new Set();
            var maybeAllowGrid = command!="trackstat"; // && !isFavorites; // && command!="playhistory";
            var numImages = 0;
            var numTracks = 0;

            resp.isMusicMix = MIXER_APPS.has(command) && data.params[1].length>0 && (data.params[1][1]=="mix" || data.params[1][1]=="list");
            resp.canUseGrid = maybeAllowGrid && (isRadiosTop || isBmf || (data.result.window && data.result.window.windowStyle && (data.result.window.windowStyle=="icon_list" || data.result.window.windowStyle=="home_menu"))) ? true : false;
            resp.canDrop = isFavorites;

            if (data.result.base && data.result.base.actions) {
                resp.baseActions = data.result.base.actions;
                playAction = undefined != resp.baseActions[ACTIONS[PLAY_ACTION].cmd];
                addAction = undefined != resp.baseActions[ACTIONS[ADD_ACTION].cmd];
                insertAction = undefined != resp.baseActions[ACTIONS[INSERT_ACTION].cmd];
                moreAction = undefined!=resp.baseActions[ACTIONS[MORE_ACTION].cmd];
                if (resp.baseActions[ACTIONS[PLAY_ACTION].cmd] && resp.baseActions[ACTIONS[PLAY_ACTION].cmd].params && resp.baseActions[ACTIONS[PLAY_ACTION].cmd].params.menu) {
                    menu = resp.baseActions[ACTIONS[PLAY_ACTION].cmd].params.menu;
                }

                // Check that 'more' is different to 'go'
                if (moreAction && resp.baseActions['go']) {
                    let mc = resp.baseActions[ACTIONS[MORE_ACTION].cmd];
                    let gc = resp.baseActions['go'];
                    if (undefined!=mc.cmd && undefined!=mc.params && undefined!=mc.itemsParams &&
                        mc.itemsParams == gc.itemsParams &&
                        mc.cmd.length == gc.cmd.length && mc.cmd.every(function(e, idx) { return e === gc.cmd[idx]; }) &&
                        Object.keys(mc.params).length == Object.keys(gc.params).length &&
                           Object.keys(mc.params).every(key => gc.params.hasOwnProperty(key) && mc.params[key] === gc.params[key])) {
                        moreAction = false;
                    }
                }
                if (command=="browseonlineartist" && data.params && data.params.length>1) {
                    // Store parameters used in command used to create this list, incase needed elsewhere
                    // Releated to LMS issue https://github.com/LMS-Community/slimserver/issues/806
                    resp.baseActions.parentParams = [];
                    for (let p=1, loop=data.params[1], len=loop.length; p<len; ++p) { // Skip command itself!
                        let parts = (""+loop[p]).split(':');
                        if (2==parts.length && parts[0].endsWith("_id")) {
                            resp.baseActions.parentParams.push(loop[p]);
                        }
                    }
                }
            }

            for (var idx=0, loop=data.result.item_loop, loopLen=loop.length; idx<loopLen; ++idx) {
                var i = loop[idx];
                i.slimbrowse = true;
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
                    } else if(options.allowNoTitle) {
                        resp.items.push(i);
                    } else {
                        data.result.count--;
                    }
                    continue;
                }

                if (resp.items.length==data.result.count-1 && i.type=="playlist" && i['icon-id']=='html/images/albums.png' && !isFavorites) {
                    // Remove 'All Songs' entry
                    data.result.count--;
                    if (playAction && loopLen>1) { // Save as special entry, so browse page can use for add/play all buttons
                        resp.allSongsItem = i;
                    }
                    continue;
                }
                var addedPlayAction = false;

                if (undefined!=i.text && undefined!=i.text.name && 'text'==i.text.type) {
                    // BBC Sounds seems to place error message in '"text":{"name":"<sting>, "type":"text"}'
                    // So, we need to check for this and use text.name as text and text.type as type.
                    // See https://forums.slimdevices.com/showthread.php?113045-Announce-BBC-Sounds-Plugin&p=1032136&viewfull=1#post1032136
                    i.text = i.text.name;
                    i.type = i.text.type;
                    i.style = i.goAction = undefined;
                }

                if ("text"==i.type) {
                    // Exclude 'More' Play,Insert commands
                    if ( (i.style && MORE_COMMANDS.has(i.style)) ||
                          // Some responses don't have 'style' set for 'Play Next'??? So, if we have an item between 'item_add' and 'itemplay' assume its 'Play Next'
                          (idx<10 && idx>0 && idx<loopLen-1 && loop[idx-1].style && loop[idx+1].style && loop[idx-1].style=='item_add' && loop[idx+1].style=='itemplay' &&
                            i.actions && i.actions.go && i.actions.go.params && i.actions.go.params.cmd && i.actions.go.params.cmd=='insert')) {
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
                    if (i.type=="header") {
                        i.header = true;
                    }
                }

                i.section = parent ? parent.section : undefined;

                if (!i.type && !i.style && i.actions && i.actions.go && i.actions.go.params) {
                    for (var key in i.actions.go.params) {
                        if (i.actions.go.params[key]==TERM_PLACEHOLDER) {
                            i.type = key=="search" ? key : "entry";
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
                        if (addedPlayAction && lmsOptions.playShuffle) {
                            i.menu.push(PLAY_SHUFFLE_ACTION);
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
                    if (i.isFavFolder) {
                        i.menu.push(RENAME_ACTION);
                    } else if (i.presetParams) {
                        i.menu.push(EDIT_ACTION);
                    }
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
                            if (i.presetParams.icon=="html/images/artists.png" || !(LMS_P_MAI && LMS_ARTIST_PICS)) {
                                i.svg="artist";
                                i.image=undefined;
                            }
                        } else if (i.presetParams.favorites_url.startsWith("db:genre.name") && i.presetParams.icon=="html/images/genres.png") {
                            i.icon="label";
                            i.image=undefined;
                        } else if (i.presetParams.favorites_url.startsWith("db:year.id") && i.presetParams.icon=="html/images/years.png") {
                            i.icon="date_range";
                            i.image=undefined;
                        } else if (i.presetParams.favorites_url.startsWith("db:work.title") && undefined==i.presetParams.icon) {
                            i.icon=undefined;
                            i.svg="release-work";
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
                        } else {
                            mapIcon(i);
                        }
                        if (STREAM_SCHEMAS.has(i.presetParams.favorites_url.split(":")[0]) && allowPinning && !i.header) {
                            i.isRadio = true;
                            if (!addedDivider && i.menu.length>0) {
                                i.menu.push(DIVIDER);
                                addedDivider = true;
                            }
                            i.menu.push(options.pinned.has(i.presetParams.favorites_url) ? UNPIN_ACTION : PIN_ACTION);
                        }
                    } else if (i['icon-id']=="html/images/favorites.png") {
                        i.icon="favorite";
                        i.image=undefined;
                    } else {
                        mapIcon(i);
                    }
                } else if (i.presetParams && allowPinning) {
                    if (i.menu.length>0) {
                        i.menu.push(DIVIDER);
                        addedDivider = true;
                    }
                    i.menu.push(ADD_TO_FAV_ACTION);
                } else if (isDynamicPlaylist && i.params && i.params.playlistid && addedPlayAction && allowPinning) {
                    i.presetParams = {favorites_url: "dynamicplaylist://"+i.params.playlistid};
                    i.menu.push(ADD_TO_FAV_ACTION);
                }

                if (isPlaylists && i.type=="playlist" && allowPinning) {
                    if (!addedDivider && i.menu.length>0) {
                        i.menu.push(DIVIDER);
                        addedDivider = true;
                    }
                    i.menu.push(RENAME_ACTION);
                    i.menu.push(REMOVE_DUPES_ACTION);
                    i.menu.push(DELETE_ACTION);
                }

                if (isPodcastList) {
                    if (!addedDivider && i.menu.length>0) {
                        i.menu.push(DIVIDER);
                        addedDivider = true;
                    }
                    if (i.type==undefined) {
                        i.menu.push(UNSUB_PODCAST_ACTION);
                        i.section=SECTION_PODCASTS;
                    }
                } else if (isPodcastSearch && 0==i.menu.length) {
                    i.menu=[ADD_TO_FAV_ACTION, MORE_ACTION];
                    i.section=SECTION_PODCASTS;
                }

                if (!i.type && i.actions && i.actions.go && i.actions.go.params) {
                    for (var p=0, plen=i.actions.go.params.length; p<plen; ++p) {
                        if (TERM_PLACEHOLDER == i.actions.go.params[p]) {
                            i.type = "search";
                            break;
                        }
                    }
                }

                if (!i.type && (!i.style || i.style=="itemNoAction") && (!i.actions || (!i.actions.go && !i.actions.do))) { // itemNoAction with an action? DynamicPlaylists...
                    i.type = "text";
                }

                if (i.parseURLs) {
                    i.title = i.title.replace(/\b(https?:\/\/[A-Za-z0-9\-_\.\!~*'();\/?:@&=+$,]+)/, "<a href=\"$1\" target=\"_blank\">$1</a>");
                }

                if (isAppsTop && i.actions && i.actions.go && i.actions.go.params && i.actions.go.params.menu) {
                    i.id = "apps."+i.actions.go.params.menu;

                    if (queryParams.party && HIDE_APPS_FOR_PARTY.has(i.id)) {
                        continue;
                    }
                    if (allowPinning && !i.header) {
                        if (!addedDivider && i.menu.length>0) {
                            i.menu.push(DIVIDER);
                            addedDivider = true;
                        }
                        i.menu.push(options.pinned.has(i.id) ? UNPIN_ACTION : PIN_ACTION);
                    }
                    mapIcon(i, command);
                } else if (isPlaylists && i.commonParams && i.commonParams.playlist_id) {
                    i.id = "playlist_id:"+i.commonParams.playlist_id;
                } else if (isRadios || isApps) {
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
                        if (allowPinning && !i.header) {
                            if (i.menu.length>0 && i.menu[0]==PLAY_ACTION && (i.icon || i.image) && i.type!="entry" && i.presetParams && i.presetParams.favorites_url) {
                                // Only allow to pin if we can play!
                                if (!addedDivider && i.menu.length>0) {
                                    i.menu.push(DIVIDER);
                                    addedDivider = true;
                                }
                                i.isRadio = true;
                                i.menu.push(options.pinned.has(i.presetParams.favorites_url) ? UNPIN_ACTION : PIN_ACTION);
                            } else if (data.params[1][0]=='radios' && i.type!='entry' && i.actions && i.actions.go && i.actions.go.params && i.actions.go.params.menu) {
                                i.id = 'radio:'+i.actions.go.params.menu;
                                i.menu.push(options.pinned.has(i.id) ? UNPIN_ACTION : PIN_ACTION);
                            }
                        }
                    }
                    if (isRadiosTop && i['icon-id']) {
                        if (i.actions && i.actions.go && i.actions.go.params && i.actions.go.params.menu=='language') {
                            i['icon-id']='/language.png';
                        }
                        mapIcon(i, undefined, {icon:undefined, svg:"radio-station"});
                    } else {
                        mapIcon(i);
                    }
                } else if (isBmf) {
                    i.bmf = true;
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
                    if (!isPodcastList) {
                        mapIcon(i, command);
                    }
                }

                if (!i.id || isFavorites) {
                    if (i.params && i.params.track_id) {
                        i.id = uniqueId("track_id:"+i.params.track_id, resp.items.length); // Incase of duplicates?
                    } else if (parent && parent.id && parent.id.startsWith(TOP_ID_PREFIX)) {
                        i.id="item_id:"+resp.items.length;
                    } else {
                        i.id=(parent && parent.id ? parent.id : "X") + "." + resp.items.length;
                    }
                }

                // TrackStat...
                if (!i.type && i.params && i.params.track) {
                    i.type = "audio";
                }

                let isOnlineTrack = false;
                // Check for online artist, album, or tracks
                if (i.presetParams && i.presetParams.favorites_url) {
                    if (i.presetParams.favorites_url.startsWith("spotify:artist:")) {
                        i.stdItem = STD_ITEM_ONLINE_ARTIST;
                    } else if (i.presetParams.favorites_url.startsWith("spotify:album:")) {
                        i.stdItem = STD_ITEM_ONLINE_ALBUM;
                    } else if (i.presetParams.favorites_type=="audio" &&
                               ( i.presetParams.favorites_url.startsWith("spotify:track:") ||
                                 i.presetParams.favorites_url.startsWith("qobuz://") ||
                                 i.presetParams.favorites_url.startsWith("tidal://") ||
                                 i.presetParams.favorites_url.startsWith("deezer://") ||
                                 /*i.presetParams.favorites_url.startsWith("youtube://") || YouTube only shows URL if saved to playlist? */
                                 ( i.presetParams.favorites_url.startsWith("https:") && command=="bandcamp"))) {
                        numTracks++;
                        isOnlineTrack = true;
                    }
                } else if (parent && parent.stdItem==STD_ITEM_ONLINE_ARTIST) {
                    i.stdItem = STD_ITEM_ONLINE_ARTIST_CATEGORY;
                }

                if (addedPlayAction || isOnlineTrack) {
                    if (!addedDivider) {
                        i.menu.push(DIVIDER);
                        addedDivider = true;
                    }
                    if ((resp.isMusicMix && i.trackType && i.trackType == "local") || isOnlineTrack /*||
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
                       ( ((moreAction && i.menu.length>0 && i.params && i.params.item_id) || (i.actions && i.actions.more && i.actions.more.cmd)))) ) {
                    if (!addedDivider && i.menu.length>0) {
                        i.menu.push(DIVIDER);
                        addedDivider = true;
                    }
                    i.menu.push(MORE_ACTION);
                }

                if (!isFavorites && !isPresets && !isAppsTop && !isPodcastList && !isRadiosTop) {
                    var key = removeDiactrics(i.textkey);
                    if (undefined!=key && (resp.jumplist.length==0 || resp.jumplist[resp.jumplist.length-1].key!=key) && !textKeys.has(key)) {
                        resp.jumplist.push({key: key, index: resp.items.length});
                        textKeys.add(key);
                    }
                }
                if (isFavorites) {
                    i.draggable = true;
                    i.realIndex = resp.items.length; // So items are deleted in correct order, even when list is sorted.
                } else if (isAudioTrack(i)) {
                    i.draggable = true;
                }
                if (i.type=="text" && undefined!=i.title && (i.title.startsWith("<") || i.title.includes("<br/>"))) {
                    i.type="html";
                }

                /* Play/add of a track from a favourited album adds all tracks :( this section works-around this... */
                if (!isFavorites && parent && parent.section == SECTION_FAVORITES && i.commonParams && i.commonParams.track_id) {
                    i.id = "track_id:"+i.commonParams.track_id;
                    i.stdItem = STD_ITEM_TRACK;
                    i.type = i.presetParams = i.commonParams = i.menu = i.playallParams = i.addallParams = i.goAction = i.style = undefined;
                }
                if (undefined!=i.icon && (i.icon.startsWith('http') || i.icon.startsWith('/'))) {
                    i.icon = undefined;
                }

                // Check for multi-image covers for favourited works
                if (undefined!=i.image) {
                    var parts = i.image.split("?ids=");
                    if (undefined!=parts && 2==parts.length) {
                        var imageList = [];
                        for (var img=0, iloop=splitStringArray(parts[1], true).reverse(), limit = iloop.length>4 ? 4 : iloop.length; img<limit; ++img) {
                            var id = ""+iloop[img];
                            if (!isEmpty(id) && "null"!=id) {
                                imageList.push(resolveImageUrl(iloop[img], LMS_IMAGE_SIZE));
                            }
                        }
                        if (imageList.length>1) {
                            if (i.image) {
                                i.image = imageList[imageList.length-1];
                            }
                            i.images = imageList;
                        }
                    }
                }

                resp.items.push(i);
                // If this is a "text" item with an image then treat as a standard actionable item
                if ("text"==i.type && (undefined!=i.image || undefined!=i.icon || undefined!=i.svg)) {
                    i.type="other"; // ???
                }
                types.add(i.type);
                images.add(i.image ? i.image : i.icon ? i.icon : i.svg);
            }
            /* ...continuation of favourited album add/play track issue... */
            if (!isFavorites && parent && parent.section == SECTION_FAVORITES && resp.items.length>0 && resp.items[0].stdItem == STD_ITEM_TRACK) {
                resp.baseActions = [];
            }
            if (resp.canUseGrid && (types.has("text") /*|| types.has("search") || types.has("entry")*/)) {
                resp.canUseGrid = false;
            } else if (!resp.canUseGrid && maybeAllowGrid && haveWithIcons && 1==types.size &&
               (!types.has("text") /*&& !types.has("search") && !types.has("entry")*/ && !types.has(undefined))) {
                resp.canUseGrid = true;
            }
            if (playAction && resp.numAudioItems>2 && undefined==resp.allSongsItem && ALLOW_FAKE_ALL_SONGS_ITEM.has(command) &&
                resp.baseActions['playControl'] && resp.baseActions['playControl'].params && resp.baseActions['playControl'].params.item_id &&
                (command!="qobuz" || !types.has("playlist"))) {
                resp.allSongsItem={id:resp.baseActions['playControl'].params.item_id, params:resp.baseActions['playControl'].params};
            }
            // If listing a radio app's entries and all images are the same, then hide images. e.g. iHeartRadio and RadioNet
            if (!isRadiosTop && !isAppsTop && !isFromFavorites && !isBmf && (!isApps || (isApps && parent.id.split('.').length==2)) && resp.items.length>1 && resp.items.length<=100) {
                if (images.size == 1 && undefined!=images.values().next().value) {
                    for (var i=0, loop=resp.items, len=loop.length; i<len; ++i) {
                        loop[i].image = loop[i].icon = loop[i].svg = undefined;
                    }
                    resp.canUseGrid=false;
                }
                if (resp.canUseGrid && haveWithoutIcons) {
                    resp.canUseGrid = false;
                }
            } else if (haveWithoutIcons && haveWithIcons) {
                var defAlbumCover = resolveImage("music/0/cover" + LMS_IMAGE_SIZE);
                var defArtistImage = resolveImage("html/images/artists" + LMS_IMAGE_SIZE);

                for (var i=0, loop=resp.items, len=loop.length; i<len; ++i) {
                    var item=loop[i];
                    if (!item.image && !item.icon && !item.svg) {
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

            if (isAppsTop) {
                resp.items.sort(titleSort);
            } else if (isPodcastList) {
                /* Only want to sort podcast feeds, and not actions. So create lists for:
                   - actions before feeds
                   - feeds
                   - actions after feeds
                   ...then sort feeds, and recombine lists */
                var before=[];
                var feeds=[];
                var after=[];
                for (var i=0, loop=resp.items, len=loop.length; i<len; ++i) {
                    if (undefined==loop[i].type || "other"==loop[i].type) {
                        loop[i].index=feeds.length;
                        feeds.push(loop[i]);
                    } else {
                        mapIcon(loop[i], 'podcasts', 'rss_feed');
                        if ('podcast'==loop[i].svg) {
                            loop[i].svg=undefined;
                            loop[i].icon='rss_feed';
                        }
                        if (feeds.length>0) {
                            after.push(loop[i]);
                        } else {
                            before.push(loop[i]);
                        }
                    }
                }
                feeds.sort(titleSort);
                resp.items=before;
                resp.items = resp.items.concat(feeds);
                resp.items = resp.items.concat(after);
            } else if (isFavorites || isPresets) {
                resp.items.sort(options.sortFavorites ? favSort : partialFavSort);
            } else if (isRadiosTop) {
                resp.items.sort(weightSort);
            }
            if (numImages>0 && numImages==resp.items.length) {
                resp.subtitle=i18np("1 Image", "%1 Images", resp.items.length);
            } else {
                if (data.result.window && data.result.window.textarea && resp.items.length<LMS_MAX_NON_SCROLLER_ITEMS) {
                    var text = replaceNewLines(data.result.window.textarea);
                    if (text.length>0) {
                        resp.items.unshift({
                                        title: text.startsWith("<") ? text : ("<div>"+text+"</div>"),
                                        type: "html",
                                        id: parent.id+".textarea"
                                       });
                        resp.canUseGrid = false;
                    }
                }
                if (resp.isMusicMix) {
                    resp.items.shift();
                    resp.subtitle=0==resp.items.length ? i18n("Empty") : i18np("1 Track", "%1 Tracks", resp.items.length);
                } else {
                    if (resp.items.length>0 &&
                        ( ("spotty"==command) ||
                           ("trackinfo"==command && getIndex(data.params[1], "url:spotify://track:")>0))) {
                        if (resp.allowHoverBtns && resp.items[0].menu.length>0 && resp.items[0].menu[0]==PLAY_ACTION &&
                            resp.items[resp.items.length-1].style=='itemNoAction') {
                            resp.actionItems = [];
                            while (resp.items.length>0 &&
                                !(resp.items[resp.items.length-1].menu.length>0 && resp.items[resp.items.length-1].menu[0]==PLAY_ACTION)) {
                                let itm = resp.items.pop();
                                if (itm.style=='itemNoAction') { // Year?
                                    let parts = itm.title.split(':');
                                    if (2==parts.length && ('Year'==parts[0] || i18n('Year')==parts[0])) {
                                        let year = parts[1].replace(/^\s+|\s+$/g, '');
                                        if (parent && !parent.title.includes(year)) {
                                            resp.titleSuffix=' ('+year+')';
                                        }
                                        continue;
                                    }
                                }
                                itm.isListItemInMenu = true;
                                itm.weight=1500-resp.actionItems.length;
                                resp.actionItems.unshift(itm);
                            }
                        }

                        let parentImage = parent ? parent.image : undefined;
                        let allHaveSameImageAsParent = undefined!=parentImage;
                        // Iterate items looking for year (if album), or to check if image is same as parent
                        for (let i=0, loop=resp.items, len=loop.length; i<len; ++i) {
                            if (loop[i].type=="playlist") {
                                if (loop[i].presetParams && loop[i].presetParams.favorites_title &&
                                    loop[i].presetParams.favorites_url && loop[i].presetParams.favorites_url.startsWith("spotify:album:")) {
                                    let year = getYear(loop[i].presetParams.favorites_title);
                                    if (undefined!=year) {
                                        loop[i].title+=year;
                                    }
                                }
                                allHaveSameImageAsParent = false;
                            } else if (allHaveSameImageAsParent && loop[i].image!=parentImage) {
                                allHaveSameImageAsParent = false;
                            }
                        }
                        // If each item has the same image as parent image then do not show!
                        if (allHaveSameImageAsParent) {
                            for (let i=0, loop=resp.items, len=loop.length; i<len; ++i) {
                                loop[i].image=undefined;
                            }
                        }
                    }
                    if (parent && parent.presetParams && parent.presetParams.favorites_url) {
                        let parentActs = getCustomActions(command, false, parent.presetParams.favorites_url);
                        if (undefined!=parentActs && parentActs.length>0) {
                            if (undefined==resp.actionItems) {
                                resp.actionItems = [];
                            } else {
                                resp.actionItems.push({action:DIVIDER});
                            }
                            for (let idx=0, len=parentActs.length; idx<len; ++idx) {
                                parentActs[idx].custom=true;
                                resp.actionItems.push(parentActs[idx]);
                            }
                        }
                    }
                    if (0==resp.items.length) {
                        resp.subtitle=i18n("Empty");
                    } else if (numTracks==resp.items.length) {
                        resp.subtitle=i18np("1 Track", "%1 Tracks", resp.items.length);
                        // Check if all tracks have same subtitle, and if so remove
                        if (numTracks>1 && numTracks<500) {
                            let subs = new Set();
                            for (var i=0, loop=resp.items, len=loop.length; i<len; ++i) {
                                subs.add(loop[i].subtitle);
                            }
                            if (subs.size==1) {
                                for (var i=0, loop=resp.items, len=loop.length; i<len; ++i) {
                                    loop[i].subtitle=undefined;
                                }
                            }
                        }
                    } else {
                        resp.subtitle=i18np("1 Item", "%1 Items", resp.items.length);
                    }
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
                            if (lower=="role_id:composer" || lower=="role_id:2") {
                                isComposers = true;
                            } else if (lower=="role_id:conductor" || lower=="role_id:3") {
                                isConductors = true;
                            } else if (lower=="role_id:band" || lower=="role_id:4") {
                                isBands = true;
                            }
                            break;
                        }
                    }
                }
            }

            resp.canUseGrid = LMS_P_MAI && LMS_ARTIST_PICS;
            resp.itemCustomActions = getCustomActions("artist");
            for (var idx=0, loop=data.result.artists_loop, loopLen=loop.length; idx<loopLen; ++idx) {
                var i = loop[idx];
                var key = removeDiactrics(i.textkey);
                if (undefined!=key && (resp.jumplist.length==0 || resp.jumplist[resp.jumplist.length-1].key!=key) && !textKeys.has(key)) {
                    resp.jumplist.push({key: key, index: resp.items.length});
                    textKeys.add(key);
                }
                var artist = {
                              id: "artist_id:"+i.id,
                              title: i.artist,
                              image: (LMS_P_MAI && LMS_ARTIST_PICS) ? "/imageproxy/mai/artist/" + i.id + "/image" + LMS_IMAGE_SIZE : undefined,
                              stdItem: STD_ITEM_ARTIST,
                              type: "group",
                              textkey: key
                          };
                setFavoritesParams(i, artist);
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
            resp.itemCustomActions = getCustomActions("album");
            var jumpListYear = false;
            var isSearch = false;
            var haveReleaseType = false;
            var firstYear = 65535;
            var lastYear = 0;
            var reqArtistId = undefined;
            var groupReleases = true; // Prevent actually grouping ino releases even if we have releaseType
            if (data.params && data.params.length>1) {
                let reverse = false;
                let isNewMusic = false;
                for (var i=3, plen=data.params[1].length; i<plen; ++i) {
                    if (typeof data.params[1][i] === 'string' || data.params[1][i] instanceof String) {
                        var lower = data.params[1][i].toLowerCase();
                        if (lower.startsWith("sort:year")) {
                            jumpListYear = true;
                        } else if (lower.startsWith("sort:new")) {
                            isNewMusic = true;
                        } else if (lower==MSK_REV_SORT_OPT) {
                            reverse = true;
                        } else if (lower.startsWith("search:")) {
                            isSearch = true;
                        } else if (lower.startsWith("tags:") && data.params[1][i].indexOf("W")>0) {
                            haveReleaseType = true;
                        } else if (lower.startsWith("artist_id:")) {
                            reqArtistId = lower.split(':')[1];
                        } else if (lower == DONT_GROUP_RELEASE_TYPES) {
                            groupReleases = false;
                        }
                    }
                }
                if (reverse && !isNewMusic) {
                    data.result.albums_loop = data.result.albums_loop.reverse();
                }
            }
            var albumGroups = groupReleases && haveReleaseType && lmsOptions.supportReleaseTypes && lmsOptions.groupByReleaseType>0 ? {} : undefined;
            var albumKeys = [];
            var releaseTypes = new Set();
            var ids = new Set();

            for (var idx=0, loop=data.result.albums_loop, loopLen=loop.length; idx<loopLen; ++idx) {
                var i = loop[idx];

                // Bug on my system? There is a 'No Album' entry with no tracks!
                /*
                if (undefined!==i.year && 0==i.year && i.artist && "No Album"===i.album && "Various Artists"===i.artist) {
                    continue;
                }
                */

                let title = i.album;
                let showYear = i.year && i.year>0;
                if (showYear) {
                    title+=" (" + i.year + ")";
                    if (i.year<firstYear) {
                        firstYear = i.year;
                    }
                    if (i.year>lastYear) {
                        lastYear = i.year;
                    }
                }
                let key = jumpListYear ? (""+i.year) : removeDiactrics(i.textkey);
                if (jumpListYear && key.length>2) {
                    key="'"+key.slice(-2);
                }
                if (undefined!=key && (resp.jumplist.length==0 || resp.jumplist[resp.jumplist.length-1].key!=key)) {
                    resp.jumplist.push({key: key, index: idx});
                }

                let artist = undefined;
                let artists = undefined;
                let artist_ids = undefined;

                if (lmsOptions.showAllArtists && i.artists && i.artist_ids) {
                    let vals = splitMultiple(i, "artists", "artist_ids", false);
                    let ids = vals[0];
                    let names = vals[1];
                    if (undefined!=names && names.length>1 && undefined!=ids && ids.length==names.length) {
                        artist_ids = ids;
                        artists = names;
                        artist = names.join(", ");
                    }
                }

                if (undefined==artist) {
                    artist = i.artist;
                    if (undefined!=i.artist) {
                        artists = [i.artist];
                    }
                    if (undefined!=i.artist_id) {
                        artist_ids = [i.artist_id];
                    }
                }

                if (isSearch && (!IS_MOBILE || lmsOptions.touchLinks) && undefined!=artist_ids && undefined!=artists && artists.length==artist_ids.length) {
                    let entries = [];
                    for (let a=0, al=artists.length; a<al; ++a) {
                        entries.push("<obj class=\"link-item\" onclick=\"show_albumartist(event, "+artist_ids[a]+",\'"+escape(artists[a])+"\', \'browse\')\">" + artists[a] + "</obj>");
                    }
                    artist = entries.join(", ");
                }

                if (LMS_VERSION>=80300 && undefined==i.extid && undefined==artists && undefined!=parent && undefined!=parent.title && undefined!=parent.id && !parent.id.startsWith(MUSIC_ID_PREFIX)) {
                    // If response does not have artist, then get this from parent item. This will come from
                    // My Music -> Album Artists -> Albums, and allows album favourites to specify artist.
                    artists = [parent.title];
                }
                let group = "ALBUM";
                let nonmain = undefined; // This artist is not main artist of album
                if (lmsOptions.groupByReleaseType>0) {
                    let roles = new Set(undefined==i.role_ids ? [] : splitIntArray(i.role_ids));
                    if (undefined!=i.compilation && 1==parseInt(i.compilation)) {
                        group = "COMPILATION";
                    } else {
                        if (intersect(ARTIST_ROLES, roles).size>0 || roles.size==0) {
                            group = undefined==i.release_type ? "ALBUM" : i.release_type.toUpperCase();
                        } else if (roles.has(TRACK_ARTIST_ROLE)) {
                            group = "APPEARANCE";
                            nonmain = true;
                        } else if (roles.has(CONDUCTOR_ARTIST_ROLE)) {
                            group = "APPEARANCE_CONDUCTOR";
                            nonmain = true;
                        } else if (roles.has(BAND_ARTIST_ROLE)) {
                            group = "APPEARANCE_BAND";
                            nonmain = true;
                        } else if (roles.has(COMPOSER_ARTIST_ROLE)) {
                            group = "COMPOSITION";
                            nonmain = true;
                        }
                    }
                    if (!resp.showCompositions && roles.has(COMPOSER_ARTIST_ROLE)) {
                        resp.showCompositions = true;
                    }
                }
                releaseTypes.add(group);

                let showArtist = undefined==parent || (parent.title!=artist && parent.subtitle!=artist);
                let grouping = undefined!=i.grouping && i.grouping.length>0 ? i.grouping : undefined;
                let subtitle = showArtist ? artist : showYear && lmsOptions.yearInSub ? ""+i.year : undefined;
                let maintitle = showArtist || !lmsOptions.yearInSub ? title : i.album;

                if (undefined!=i.work_id && undefined!=i.work_name && undefined!=i.composer) {
                    maintitle = i.composer+SEPARATOR+i.work_name;
                    subtitle =(showArtist ? i.artist+SEPARATOR : "")+i.album;
                    if (!isEmpty(grouping)) {
                        subtitle+=" ("+grouping;
                        if (i.year && i.year>0) {
                            subtitle+=", "+i.year;
                        }
                        subtitle+=")";
                    } else if (i.year && i.year>0) {
                        subtitle+=" ("+i.year+")";
                    }
                }

                let album = {
                              id: "album_id:"+(ids.has(i.id) ? uniqueId(i.id, resp.items.length) : i.id),
                              artist_id: i.artist_id,
                              artist_ids: splitIntArray(i.artist_ids),
                              artists: artists,
                              work_id: i.work_id,
                              grouping: grouping,
                              title: maintitle,
                              subtitle: subtitle,
                              subIsYear: lmsOptions.yearInSub && !showArtist && showYear,
                              image: i.artwork_url
                                        ? resolveImageUrl(i.artwork_url, LMS_IMAGE_SIZE)
                                        : ("/music/" + (i.artwork_track_id ? i.artwork_track_id : i.artwork) + "/cover" + LMS_IMAGE_SIZE),
                              stdItem: STD_ITEM_ALBUM,
                              type: "group",
                              origTitle: i.album,
                              textkey: key,
                              emblem: getEmblem(i.extid),
                              draggable: true,
                              multi: LMS_GROUP_DISCS && undefined!=i.disccount && parseInt(i.disccount)>1,
                              extid: i.extid,
                              filter: FILTER_PREFIX+group,
                              compilation: i.compilation,
                              nonmain: nonmain
                          };
                setFavoritesParams(i, album);
                ids.add(i.id);
                if (albumGroups) {
                    if (undefined==albumGroups[group]) {
                        albumGroups[group]=[album];
                        albumKeys.push(group);
                    } else {
                        albumGroups[group].push(album);
                    }
                } else {
                    resp.items.push(album);
                }
            }
            if (undefined!=reqArtistId && LMS_P_MAI && LMS_ARTIST_PICS) {
                resp.image= "/imageproxy/mai/artist/" + reqArtistId + "/image" + LMS_IMAGE_SIZE;
            }
            let numGroups = albumGroups ? albumKeys.length : 0;
            if (numGroups>1) {
                resp.subtitle=i18np("1 Release", "%1 Releases", loopLen);
                resp.jumplist = [];
                albumKeys.sort(releaseTypeSort);
                let headerOnly = true;
                for (let k=0; k<numGroups; ++k) {
                    let key = albumKeys[k];
                    let alist = albumGroups[key];
                    let icon = releaseTypeIcon(key);
                    resp.items.push({title:releaseTypeHeader(key)+" ("+alist.length+")", id:FILTER_PREFIX+key, header:true,
                                     svg: icon.svg, icon: icon.icon,
                                     menu:[PLAY_ALL_ACTION, INSERT_ALL_ACTION, PLAY_SHUFFLE_ALL_ACTION, ADD_ALL_ACTION], count:alist.length});
                    // Create jump list
                    let start = resp.items.length;
                    let jl=[];
                    resp.jumplist.push({key:SECTION_JUMP, index:start-1, header:true, icon:icon});
                    for (let a=0, alen=alist.length; a<alen; ++a) {
                        if (undefined!=alist[a].textkey && (jl.length==0 || jl[jl.length-1].key!=alist[a].textkey)) {
                            jl.push({key: alist[a].textkey, index: resp.items.length});
                            resp.jumplist.push({key: alist[a].textkey, index:start+a});
                            headerOnly = false;
                        }
                    }
                    resp.items.push.apply(resp.items, alist);
                }
                resp.jumplist.headerOnly = headerOnly;
                resp.listSize = resp.items.length;
            } else {
                if (numGroups==1) {
                    resp.items = albumGroups[albumKeys[0]];
                }
                let releaseType = 1==releaseTypes.size ? releaseTypes.keys().next().value : undefined;
                let lmsTrans = releaseType ? lmsOptions.releaseTypes[releaseType] : undefined;
                if (undefined!=lmsTrans) {
                    resp.subtitle=resp.items.length + " " + (lmsTrans[1==resp.items.length ? 0 : 1]);
                } else if (releaseType=="COMPILATION") {
                    resp.subtitle=i18np("1 Compilation", "%1 Compilations", resp.items.length);
                } else if (releaseType && releaseType.startsWith("APPEARANCE")) {
                    resp.subtitle=i18np("1 Appearance", "%1 Appearances", resp.items.length)+appearanceSuffix(releaseType);
                } else if (releaseType=="COMPOSITION") {
                    resp.subtitle=i18np("1 Composer Album", "%1 Composer Albums", resp.items.length);
                } else if (lmsOptions.supportReleaseTypes) {
                    resp.subtitle=i18np("1 Release", "%1 Releases", resp.items.length);
                } else {
                    resp.subtitle=i18np("1 Album", "%1 Albums", resp.items.length);
                }
                if (parent && parent.id && parent.id.startsWith("search:")) {
                    resp.jumplist = []; // Search results NOT sorted???
                }
            }
            if (lastYear>0) {
                if (lastYear==firstYear) {
                    resp.years=""+lastYear;
                } else {
                    resp.years=firstYear+" - " + lastYear;
                }
            }
        } else if (data.result.titles_loop) {
            let totalDuration=0;
            let allowPlayAlbum = parent && parent.id && parent.id.startsWith("album_id:");
            let isAllSongs = parent && parent.id && (parent.id.startsWith("currentaction:") || parent.id == ALL_SONGS_ID);
            let isSearchResult = options && options.isSearch;
            let showAlbumName = isSearchResult || isAllSongs || (parent && parent.id && parent.id.startsWith("artist_id:"));
            let discs = new Map();
            let sort = undefined;
            let msksort = undefined;
            let sortTracks = 0;
            let highlightArtist = undefined;
            let highlighted = 0;
            let reverse = false;
            let isCompositions = false;
            let parentArtist = undefined;
            let showTrackNumbers = true;
            let grouping = 0;
            let genres=new Set();
            let yearSet = new Set();
            let years = [];
            let isWork = false;
            resp.extra={};

            if (data.params[1].length>=4 && data.params[1][0]=="tracks") {
                for (let p=0, plen=data.params[1].length; p<plen && (!allowPlayAlbum || !showAlbumName); ++p) {
                    let param = ""+data.params[1][p];
                    if (param.startsWith("album_id:")) {
                        allowPlayAlbum = true;
                    } else if (param.startsWith("search:")) {
                        showAlbumName = true;
                    } else if (param.startsWith("material_skin_artist_id:")) {
                        highlightArtist = parseInt(param.split(':')[1]);
                    } else if (param==MSK_REV_SORT_OPT) {
                        reverse = true;
                    } else if (param.startsWith(SORT_KEY)) {
                        sort = param.split(':')[1];
                    } else if (param.startsWith(MSK_SORT_KEY)) {
                        msksort = param.split(':')[1];
                        sortTracks = msksort=="yearalbumtrack" ? 1 : msksort=="artisttitle" ? 2 : msksort=="yeartitle" ? 3 : 0;
                    } else if (param=="role_id:COMPOSER") {
                        isCompositions = true;
                    } else if (param.startsWith("material_skin_artist:")) {
                        parentArtist = param.split(':')[1];
                    } else if (param.startsWith("work_id:")) {
                        isWork = true;
                    }
                }
            }
            if (0==sortTracks && "title"==sort) {
                sortTracks = 4;
            }
            if (undefined!=msksort) {
                sort=msksort;
            }
            if (isWork || (undefined!=sort && (isAllSongs || isCompositions) && ("title"==sort || "artisttitle"==sort || "yeartitle"==sort))) {
                showTrackNumbers = false;
            }
            // Should we group tracks?
            if (isAllSongs || isCompositions) {
                grouping = ("albumtrack"==sort || "yearalbumtrack"==sort) ? 1 : "title"==sort ? 2 : "artisttitle"==sort ? 3 : 0;
            }

            resp.itemCustomActions = getCustomActions("album-track");
            let stdItem = allowPlayAlbum && data.result.count>1 ? STD_ITEM_ALBUM_TRACK : STD_ITEM_TRACK;
            let artists = [];
            let artistsWithContext = [];
            let numCompilationTracks = 0;
            let compilationAlbumArtists = new Set();
            let compilationArtists = new Set();
            let compilationAlbumArtist = undefined;
            let extraSubs = [];
            let browseContext = getLocalStorageBool('browseContext', false);
            for (let idx=0, loop=data.result.titles_loop, loopLen=loop.length; idx<loopLen; ++idx) {
                let i = loop[idx];
                let title = i.title;
                let duration = parseFloat(i.duration || 0);
                let tracknum = undefined==i.tracknum ? 0 : parseInt(i.tracknum);
                let highlight = false;
                if (tracknum>0 && showTrackNumbers) {
                    title = (tracknum>9 ? tracknum : ("0" + tracknum))+SEPARATOR+title;
                    //title = tracknum + ". " + title; // SlimBrowse format
                    if (isSearchResult && undefined!=i.disc) {
                        title = i.disc+"."+title;
                    }
                }
                splitMultiples(i, true);

                // Create list of artists on this album - to show in browse 'Information' view...
                for (let a=0, alen=ARTIST_TYPES.length; a<alen; ++a) {
                    let type = ARTIST_TYPES[a];
                    // "albumartist", "trackartist", "artist", "band", "composer", "conductor"];
                    let func = "trackartist"==type ? "show_artist" : ("show_"+type);
                    if (undefined!=i[type+"_ids"] && undefined!=i[type+"s"] && i[type+"_ids"].length==i[type+"s"].length) {
                        for (let v=0, vl=i[type+"_ids"], vlen=vl.length; v<vlen; ++v) {
                            let val = i[type+"s"][v];
                            if (!isEmpty(val) && (undefined==resp.extra[type] || !resp.extra[type].set.has(val))) {
                                if (undefined==resp.extra[type]) {
                                    resp.extra[type]={set:new Set(), items:[]};
                                }
                                resp.extra[type].set.add(val);
                                resp.extra[type].items.push(buildLink(func, vl[v], val, "browse"));
                            }
                        }
                    } else if (undefined!=i[type] && (undefined!=i[type+"_id"] || (undefined!=i[type+"_ids"] && i[type+"_ids"].length>0))) {
                        let val = i[type];
                        let id = undefined!=i[type+"_id"] ? i[type+"_id"] : i[type+"_ids"][0];
                        if (!isEmpty(val) && (undefined==resp.extra[type] || !resp.extra[type].set.has(val))) {
                            if (undefined==resp.extra[type]) {
                                resp.extra[type]={set:new Set(), items:[]};
                            }
                            resp.extra[type].set.add(val);
                            resp.extra[type].items.push(buildLink(func, id, val, "browse"));
                        }
                    }
                }
                if (undefined!=highlightArtist) {
                    // Check if any of the artist IDs for this track match that to highlight
                    for (let a=0, alen=ARTIST_TYPES.length; a<alen && !highlight; ++a) {
                        let type = ARTIST_TYPES[a];
                        if (!highlight && undefined!=i[type+"_id"]) {
                            highlight = highlightArtist == parseInt(i[type+"_id"]);
                        }
                        if (undefined!=i[type+"_ids"]) {
                            for (let v=0, vl=i[type+"_ids"], vlen=vl.length; v<vlen && !highlight; ++v) {
                                highlight = highlightArtist == parseInt(vl[v]);
                            }
                        }
                    }
                }

                artists.push(buildArtistLine(i, "browse", false));
                if (browseContext) {
                    artistsWithContext.push(replaceBr(buildArtistWithContext(i, "browse", false), " "));
                }
                let subtitle = undefined;
                let subtitleContext = undefined;
                if (showAlbumName && i.album) {
                    subtitle=buildAlbumLine(i, "browse", false);
                    if (browseContext) {
                        subtitleContext=i18n('<obj>from</obj> %1', buildAlbumLine(i, "browse", false)).replaceAll("<obj>", "<obj class=\"ext-details\">");
                    }
                }
                if (undefined!=i.disc && !isSearchResult && !isAllSongs && !isCompositions) {
                    let discNum = parseInt(i.disc);
                    if (discs.has(discNum)) {
                        var entry = discs.get(discNum);
                        entry.total++;
                        entry.duration+=duration;
                    } else {
                        let title = undefined;
                        if (undefined!=i.comment) {
                            switch(lmsOptions.commentAsDiscTitle) {
                                case 1: // Comment is title
                                    title = i.comment;
                                    break;
                                case 2: // Semi-colon separated, KEY=VAL (or KEY:VAL)
                                    let parts = i.comment.split(';');
                                    for (let idx=0, len=parts.length; idx<len; ++idx) {
                                        if (parts[idx].startsWith('TITLE=') || parts[idx].startsWith('TITLE:')) {
                                            title=parts[idx].substring(6);
                                            break;
                                        }
                                        if (parts[idx].startsWith('DISCTITLE=') || parts[idx].startsWith('DISCTITLE:')) {
                                            title=parts[idx].substring(10);
                                            break;
                                        }
                                    }
                                    break
                            }
                        }
                        discs.set(discNum, {pos: resp.items.length, total:1, duration:duration, title:title});
                    }
                }
                totalDuration += duration>0 ? duration : 0;
                //var subtitle = duration>0 ? formatSeconds(duration) : undefined;
                let extraSub = undefined;
                let techInfo = lmsOptions.techInfo ? formatTechInfo(i) : undefined;
                if (techInfo) {
                    extraSub=techInfo;
                }
                let rs = undefined!=i.rating ? ratingString(undefined, i.rating) : undefined;
                if (rs) {
                    if (extraSub) {
                        extraSub+=SEPARATOR+rs;
                    } else {
                        extraSub=rs;
                    }
                }
                extraSubs.push(extraSub);
                if (i.genre || i.genres) {
                    let loop = i.genres ? i.genres : [i.genre];
                    let ids = i.genre_ids ? i.genre_ids : [i.genre_id];
                    if (ids.length==loop.length) {
                        for (let g=0, glen=loop.length; g<glen; ++g) {
                            if (!genres.has(loop[g])) {
                                genres.add(loop[g]);
                                if (undefined==resp.extra['genres']) {
                                    resp.extra['genres']=[];
                                }
                                resp.extra['genres'].push(buildLink("show_genre", ids[g], loop[g], "browse"));
                                if (IS_MOBILE && !lmsOptions.touchLinks) {
                                    if (undefined==resp.extra['genres.plain']) {
                                        resp.extra['genres.plain']=[];
                                    }
                                    resp.extra['genres.plain'].push(loop[g]);
                                }
                            }
                        }
                    }
                }

                let year = undefined!=i.year ? parseInt(i.year) : undefined;
                if (undefined!=year && !yearSet.has(year)) {
                    yearSet.add(year);
                    years.push(year);
                }
                resp.items.push({
                              id: "track_id:"+i.id,
                              title: title,
                              subtitle: subtitle,
                              subtitleContext: subtitleContext,
                              //icon: "music_note",
                              stdItem: stdItem,
                              type: "track",
                              rating: i.rating,
                              image: showAlbumName ? ("/music/" + (""==i.coverid || undefined==i.coverid ? "0" : i.coverid) + "/cover" +LMS_IMAGE_SIZE) : undefined,
                              filter: FILTER_PREFIX+i.disc,
                              emblem: showAlbumName ? getEmblem(i.extid) : undefined,
                              tracknum: sortTracks && undefined!=i.tracknum ? tracknum : undefined,
                              disc: i.disc ? parseInt(i.disc) : undefined,
                              year: (sortTracks || 1==grouping) ? year : undefined,
                              album: sortTracks || isSearchResult || 1==grouping ? i.album : undefined,
                              artist: isSearchResult || 2==sortTracks || 3==grouping ? getArtist(i) : undefined,
                              album_id: isSearchResult ? i.album_id : undefined,
                              artist_id: isSearchResult ? i.artist_id : undefined,
                              url: i.url,
                              draggable: true,
                              duration: duration>0 ? duration : undefined,
                              durationStr: duration>0 ? formatSeconds(duration) : undefined,
                              highlight: highlight,
                              idx: idx
                          });

                if (highlight) {
                    highlighted++;
                }

                if (lmsOptions.noArtistFilter && undefined!=i.compilation && 1==parseInt(i.compilation)) {
                    numCompilationTracks++;
                    if (undefined!=i.albumartist) {
                        compilationAlbumArtists.add(i.albumartist);
                    }
                    if (undefined!=i.artist) {
                        compilationArtists.add(i.artist);
                    }
                }
                if (0==idx && !showAlbumName && i.coverid!=undefined && !isEmpty(""+i.coverid)) {
                    resp.image="/music/"+i.coverid+"/cover"+LMS_IMAGE_SIZE;
                }
            }
            // If all tracks marked as a compilation, then see what we can (potentially) use
            // as the album artist for this compilation.
            if (numCompilationTracks==resp.items.length) {
                if (compilationAlbumArtists.size==1) {
                    compilationAlbumArtist = compilationAlbumArtists.keys().next().value;
                } else if (compilationArtists.size==1) {
                    compilationAlbumArtist = compilationArtists.keys().next().value;
                } else {
                    compilationAlbumArtist = LMS_VA_STRING;
                }
            }

            if (sortTracks==1) {
                resp.items.sort(reverse ? revYearAlbumTrackSort : yearAlbumTrackSort);
            } else if (sortTracks>=2 && sortTracks<=4) {
                resp.items.sort(sortTracks==2 ? artistTitleSort : sortTracks==3 ? yearTitleSort : titleArtistSort);
                if (reverse) {
                    resp.items = resp.items.reverse();
                }
            } else if (reverse) {
                resp.items = resp.items.reverse();
            }

            let groups=[];
            if (grouping>0 && resp.items.length>1) {
                let field = 1==grouping ? 'album' : 2==grouping ? 'title' : 'artist';
                // Groups is array of "<start index>, <title>"
                groups=[[0, resp.items[0][field] + (1==grouping && resp.items[0].year ? " ("+resp.items[0].year+")" : "")]];
                for (let i=1, loop=resp.items, len=loop.length; i<len; ++i) {
                    if (loop[i-1][field]!=loop[i][field]) {
                        groups.push([i, loop[i][field] + (1==grouping && loop[i].year ? " ("+loop[i].year+")" : "")]);
                    }
                }
                if (groups.length>1 && ((groups.length*100)/resp.items.length)<=25) {
                    for (let i=0, len=groups.length; i<len; ++i) {
                        let count = 0;
                        let duration = 0;
                        // We add 'i' below so as to skip inserted headers!
                        for (let j=groups[i][0]+i, jl=resp.items, jlen=jl.length; j<jlen; ++j) {
                            if ((i+1)<len && j>=groups[i+1][0]+i) {
                                break;
                            }
                            count++;
                            duration+=jl[j].duration;
                            jl[j].filter=FILTER_PREFIX+i;
                        }
                        resp.items.splice(groups[i][0]+i, 0,
                                          {title: groups[i][1], id:FILTER_PREFIX+i, header:true,
                                           subtitle: isCompositions ? i18np("1 Composition", "%1 Compositions", count) : i18np("1 Track", "%1 Tracks", count), durationStr:formatSeconds(duration),
                                           menu:[PLAY_ALL_ACTION, INSERT_ALL_ACTION, PLAY_SHUFFLE_ALL_ACTION, ADD_ALL_ACTION]});
                    }
                    if (1==grouping) { // Grouped into albumns, so remove from subtitle
                        for (let i=0, loop=resp.items, len=loop.length; i<len; ++i) {
                            if (!loop[i].header) {
                                loop[i].subtitle = loop[i].subtitleContext = undefined;
                            }
                        }
                    }
                } else {
                    groups = [];
                }
            }

            // Now add artist to subtitle if we have multiple artists, or we are showing compositions...
            let albumArtist = parentArtist
                                ? parentArtist
                                : parent && parent.artists && parent.artists.length>0
                                    ? parent.artists[0]
                                    : parent && parent.stdItem==STD_ITEM_ALBUM && parent.subtitle
                                         ? parent.subtitle
                                         : undefined;

            if (resp.items.length>1) {
                let showArtists = (new Set(artists)).size>1;
                if (!showArtists && isCompositions && undefined!=albumArtist) {
                    for (let i=0, loop=resp.items, len=loop.length; i<len && !showArtists; ++i) {
                        if (!loop[i].header) {
                            showArtists = stripLinkTags(artists[i])!=albumArtist;
                        }
                    }
                }
                if (showArtists) {
                    let lastHeader = 0;
                    for (let i=0, loop=resp.items, len=loop.length; i<len; ++i) {
                        let item = loop[i];
                        if (item.header) {
                            lastHeader = i;
                        } else {
                            if (undefined!=artists[item.idx] && (3!=grouping || stripLinkTags(artists[item.idx])!=loop[lastHeader].title)) {
                                item.subtitle = undefined==item.subtitle ? artists[item.idx] : (artists[item.idx] + SEPARATOR + item.subtitle);
                                if (browseContext) {
                                    item.subtitleContext = undefined==item.subtitleContext ? artistsWithContext[item.idx] : (artistsWithContext[item.idx] + " " + item.subtitleContext);
                                }
                            }
                        }
                    }
                }
            } else if (1==resp.items.length && undefined!=albumArtist) {
                // Only one? Check that this tracks artist line does not match parent item's artist details...
                if (stripLinkTags(artists[0])!=albumArtist) {
                    resp.items[0].subtitle = undefined==resp.items[0].subtitle ? artists[0] : (artists[0] + SEPARATOR + resp.items[0].subtitle);
                    if (browseContext) {
                        resp.items[0].subtitleContext = undefined==resp.items[0].subtitleContext ? artistsWithContext[0] : (artistsWithContext[0] + " " + resp.items[0].subtitleContext);
                    }
                }
            }
            for (let i=0, loop=resp.items, len=loop.length; i<len; ++i) {
                let item = loop[i];
                if (!item.header) {
                    if (undefined!=extraSubs[item.idx]) {
                        item.subtitle = undefined==item.subtitle ? extraSubs[item.idx] : (item.subtitle + SEPARATOR + extraSubs[item.idx]);
                        if (browseContext) {
                            item.subtitleContext = undefined==item.subtitleContext ? extraSubs[item.idx] : (item.subtitleContext + SEPARATOR + extraSubs[item.idx]);
                        }
                    }
                }
            }
            // Don't hightlight all tracks! Happens with VA albums...
            if (highlighted>0 && highlighted==resp.items.length) {
                for (let i=0, loop=resp.items, len=loop.length; i<len; ++i) {
                    if (!loop[i].header) {
                        loop[i].highlight = false;
                    }
                }
            }

            resp.numAudioItems = resp.items.length;
            if (allowPlayAlbum) {
                resp.allSongsItem = parent;
            }
            if (grouping==0 && discs.size>1) {
                let d = 0;

                for (let k of discs.keys()) {
                    let disc = discs.get(k);
                    let title = disc.title;

                    // If this is the 1st disc, using comment as title, it has no title but next does, then use
                    // 'Main disc' as title - looks nicer than 'Disc 1'
                    if (k==1 && lmsOptions.commentAsDiscTitle && undefined==title) {
                        let nextDisc = discs.get(2);
                        if (undefined!=nextDisc && undefined!=nextDisc.title) {
                            title = i18n('Main disc');
                        }
                    }

                    resp.items.splice(disc.pos+d, 0,
                                       {title: lmsOptions.commentAsDiscTitle && title ? title : i18n("Disc %1", k), jump:disc.pos+d,
                                        subtitle: isCompositions ? i18np("1 Composition", "%1 Compositions", disc.total) : i18np("1 Track", "%1 Tracks", disc.total), durationStr:formatSeconds(disc.duration),
                                        id:FILTER_PREFIX+k, header:true, menu:[PLAY_ALL_ACTION, INSERT_ALL_ACTION, PLAY_SHUFFLE_ALL_ACTION, ADD_ALL_ACTION]});
                    d++;
                }
            } else if (1==discs.size) {
                // Remove item's disc value so that 'PLAY_DISC_ACTION' is not shown
                for (var idx=0, len=resp.items.length; idx<len; ++idx) {
                    resp.items[idx].disc = undefined;
                }
            }
            let totalTracks=resp.items.length-((groups.length>1 ? groups.length : 0)+(discs.size>1 ? discs.size : 0));
            let totalDurationStr=formatSeconds(totalDuration);
            resp.subtitle=totalTracks+'<obj class="mat-icon music-note">music_note</obj>'+totalDurationStr;
            resp.plainsubtitle=(isCompositions ? i18np("1 Composition", "%1 Compositions", totalTracks) : i18np("1 Track", "%1 Tracks", totalTracks))+SEPARATOR+totalDurationStr;
            // set compilationAlbumArtist on first entry so that browse-view can use this
            if (lmsOptions.noArtistFilter && undefined!=compilationAlbumArtist & resp.items.length>0) {
                resp.items[0].compilationAlbumArtist = compilationAlbumArtist;
            }
            if (years.length>0) {
                years.sort();
                resp.extra['years']=[];
                for (let y=0, len=years.length; y<len; ++y) {
                    resp.extra['years'].push(buildLink("show_year", years[y], years[y], "browse"));
                }
            }
            for (let a=0, alen=ARTIST_TYPES.length; a<alen; ++a) {
                let type = ARTIST_TYPES[a];
                if (undefined!=resp.extra[type]) {
                    resp.extra[type]=resp.extra[type].items;
                }
            }
        } else if (data.result.genres_loop) {
            for (var idx=0, loop=data.result.genres_loop, loopLen=loop.length; idx<loopLen; ++idx) {
                var i = loop[idx];
                var key = removeDiactrics(i.textkey);
                if (undefined!=key && (resp.jumplist.length==0 || resp.jumplist[resp.jumplist.length-1].key!=key) && !textKeys.has(key)) {
                    resp.jumplist.push({key: key, index: resp.items.length});
                    textKeys.add(key);
                }
                let genre = i.genre.toLowerCase().replace(/[^0-9a-z]/gi, '');
                resp.items.push({
                              id: "genre_id:"+i.id,
                              title: i.genre,
                              //icon: "label",
                              image: lmsOptions.genreImages ? "material/genres/" + genre : undefined,
                              stdItem: STD_ITEM_GENRE,
                              type: "group",
                              textkey: key
                          });
            }
            resp.canUseGrid = lmsOptions.genreImages;
            resp.itemCustomActions = getCustomActions("genre");
            resp.subtitle=i18np("1 Genre", "%1 Genres", resp.items.length);
        } else if (data.result.playlists_loop) {
            var haveEmblem = false;
            for (var idx=0, loop=data.result.playlists_loop, loopLen=loop.length; idx<loopLen; ++idx) {
                var i = loop[idx];
                var key = removeDiactrics(i.textkey);
                var isRemote = 1 == parseInt(i.remote) || undefined!=i.extid;
                var emblem = getEmblem(i.extid);
                if (undefined!=emblem) {
                    haveEmblem = true;
                }
                if (undefined!=key && (resp.jumplist.length==0 || resp.jumplist[resp.jumplist.length-1].key!=key) && !textKeys.has(key)) {
                    resp.jumplist.push({key: key, index: resp.items.length});
                    textKeys.add(key);
                }
                resp.items.push({
                              id: "playlist_id:"+i.id,
                              title: i.playlist,
                              icon: undefined == emblem ? "list" : undefined,
                              svg: undefined == emblem ? undefined : emblem.name,
                              stdItem: isRemote ? STD_ITEM_REMOTE_PLAYLIST : STD_ITEM_PLAYLIST,
                              type: "group",
                              section: SECTION_PLAYLISTS,
                              url:  i.url,
                              remotePlaylist: isRemote
                          });
            }
            if (!haveEmblem) {
                // No emblems? Clear icons...
                for (var i=0, len=resp.items.length; i<len; ++i) {
                    resp.items[i].icon = resp.items[i].svg = undefined;
                }
            }
            resp.itemCustomActions = getCustomActions("playlist");
            resp.subtitle=i18np("1 Playlist", "%1 Playlists", resp.items.length);
        } else if (data.result.playlisttracks_loop) {
            var totalDuration = 0;
            let browseContext = getLocalStorageBool('browseContext', false);
            for (var idx=0, loop=data.result.playlisttracks_loop, loopLen=loop.length; idx<loopLen; ++idx) {
                var i = loop[idx];
                var title = i.title;
                splitMultiples(i, true);
                let subtitle = buildArtistLine(i, "browse", false);
                let subtitleContext = browseContext ? replaceBr(buildArtistWithContext(i, "browse", false), " ") : undefined;
                if (!title) {
                    title=i18n("Unknown");
                }
                var duration = parseFloat(i.duration || 0);
                totalDuration+=duration;
                if (i.album) {
                    if (subtitle) {
                        subtitle+=SEPARATOR+buildAlbumLine(i, "browse", false);
                        if (browseContext) {
                            subtitleContext+=" "+i18n('<obj>from</obj> %1', buildAlbumLine(i, "browse", false)).replaceAll("<obj>", "<obj class=\"ext-details\">");
                        }
                    } else {
                        subtitle=buildAlbumLine(i, "browse", false);
                        if (browseContext) {
                            subtitleContext=i18n('<obj>from</obj> %1', buildAlbumLine(i, "browse", false)).replaceAll("<obj>", "<obj class=\"ext-details\">");
                        }
                    }
                }
                var techInfo = lmsOptions.techInfo ? formatTechInfo(i) : undefined;
                if (techInfo) {
                    if (subtitle) {
                        subtitle+=SEPARATOR+techInfo;
                    } else {
                        subtitle=techInfo;
                    }
                    if (subtitleContext) {
                        subtitleContext+=SEPARATOR+techInfo;
                    }
                }
                var isRemote = undefined!=parent && parent.remotePlaylist;
                resp.items.push({
                              id: uniqueId("track_id:"+i.id, resp.items.length),
                              title: title,
                              subtitle: subtitle,
                              subtitleContext: subtitleContext,
                              image: i.artwork_url
                                        ? resolveImageUrl(i.artwork_url, LMS_IMAGE_SIZE)
                                        : ("/music/" + (""==i.coverid || undefined==i.coverid ? "0" : i.coverid) + "/cover" +LMS_IMAGE_SIZE),
                              //icon: "music_note",
                              stdItem: isRemote ? STD_ITEM_REMOTE_PLAYLIST_TRACK : STD_ITEM_PLAYLIST_TRACK,
                              type: "track",
                              draggable: true,
                              duration: i.duration,
                              durationStr: duration>0 ? formatSeconds(duration) : undefined
                          });
            }
            resp.itemCustomActions = getCustomActions("playlist-track");
            resp.subtitle=i18np("1 Track", "%1 Tracks", resp.listSize);
            resp.canDrop = !isRemote;
            resp.numAudioItems = resp.items.length;
            if (totalDuration>0 && resp.items.length==resp.listSize) {
                resp.subtitle+=SEPARATOR+formatSeconds(totalDuration);
            }
        } else if (data.result.years_loop) {
            for (var idx=0, loop=data.result.years_loop, loopLen=loop.length; idx<loopLen; ++idx) {
                var i = loop[idx];
                var key = i.textkey;
                if (undefined!=key && (resp.jumplist.length==0 || resp.jumplist[resp.jumplist.length-1].key!=key) && !textKeys.has(key)) {
                    resp.jumplist.push({key: key, index: resp.items.length});
                    textKeys.add(key);
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
            resp.itemCustomActions = getCustomActions("year");
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
            resp.items.push({   title: replaceNewLines(data.result.biography),
                                type: "html",
                                id: parent.id+".0"
                            });
        } else if (data.result.albumreview) {
            resp.items.push({   title: replaceNewLines(data.result.albumreview),
                                type: "html",
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
        } else if (data.result.extras_loop) {
            for (var idx=0, loop=data.result.extras_loop, loopLen=loop.length; idx<loopLen; ++idx) {
                var i = loop[idx];
                i.type="extra";
                mapIcon(i, 'lms-extras', {icon:"extension", svg:undefined});
                i.id="extras:"+i.id;
                if (allowPinning) {
                    i.menu=[options.pinned.has(i.id) ? UNPIN_ACTION : PIN_ACTION];
                }
                resp.items.push(i);
            }
            resp.items.sort(titleSort);
            resp.subtitle=0==resp.items.length ? i18n("Empty") : i18np("1 Item", "%1 Items", resp.items.length);
            resp.canUseGrid=true;
        } else if (data.result.works_loop) {
            for (var idx=0, loop=data.result.works_loop, loopLen=loop.length; idx<loopLen; ++idx) {
                var i = loop[idx];
                var key = removeDiactrics(i.textkey);
                if (undefined!=key && (resp.jumplist.length==0 || resp.jumplist[resp.jumplist.length-1].key!=key) && !textKeys.has(key)) {
                    resp.jumplist.push({key: key, index: resp.items.length});
                    textKeys.add(key);
                }
                var images = [];
                if (undefined!=i.artwork_track_ids) {
                    for (var img=0, iloop=splitStringArray(i.artwork_track_ids, true).reverse(), limit = iloop.length>4 ? 4 : iloop.length; img<limit; ++img) {
                        var id = ""+iloop[img];
                        if (!isEmpty(id) && "null"!=id) {
                            images.push(resolveImageUrl(iloop[img], LMS_IMAGE_SIZE));
                        }
                    }
                }
                var image = images.length>0 ? images[0] : i.artwork_track_id;
                var work = {
                    title: i.composer,
                    subtitle: i.work,
                    composer_id: i.composer_id,
                    album_id: i.album_id,
                    id: "work_id:"+i.work_id,
                    type: "group",
                    image: images.length>1 ? images[images.length-1] : undefined==image ? DEFAULT_WORKS_COVER : resolveImageUrl(image, LMS_IMAGE_SIZE),
                    stdItem: STD_ITEM_WORK,
                    textkey: key,
                    images: images.length>1 ? images : undefined
                };
                setFavoritesParams(i, work);
                resp.items.push(work);
            }
            resp.subtitle=0==resp.items.length ? i18n("Empty") : i18np("1 Work", "%1 Works", resp.items.length);
            resp.canUseGrid=true;
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
        resp.items.push({title:i18n("ERROR: List processing failed")+"\n"+e+"\n"+e.stack, type: 'text', id:'error'});
        logError(e);
    }

    return resp;
}
