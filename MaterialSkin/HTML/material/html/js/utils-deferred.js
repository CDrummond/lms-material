/**
 * LMS-Material
 *
 * Copyright (c) 2018-2024 Craig Drummond <craig.p.drummond@gmail.com>
 * MIT license.
 */
'use strict';

function replaceNewLines(str) {
    return str ? str.replace(/\n/g, "<br/>").replace(/\\n/g, "<br/>") : str;
}

function openWindow(page) {
    window.open(page, '_blank');
}

function adjustVolume(vol, inc) {
    if (1==lmsOptions.volumeStep) {
        if (inc) {
            return vol+1;
        } else if (0==vol) {
            return 0;
        } else {
            return vol-1;
        }
    }

    if (inc) {
        // Always send volume up, even if at 100% already. Some users trap LMS
        // volume commands and forward on
        return Math.floor((vol+lmsOptions.volumeStep)/lmsOptions.volumeStep)*lmsOptions.volumeStep;
    }

    if (vol<=lmsOptions.volumeStep) {
        return 0;
    }

    var adj = Math.floor(vol/lmsOptions.volumeStep)*lmsOptions.volumeStep;
    // If rounding down to lmsOptions.volumeStep is 2% (or more) then use that, else make even lower
    if ((vol-adj)>=2) {
        return adj;
    }
    return Math.floor((vol-lmsOptions.volumeStep)/lmsOptions.volumeStep)*lmsOptions.volumeStep;
}

function incrementVolume() {
    bus.$emit("adjustVolume", true);
}

function decrementVolume() {
    bus.$emit("adjustVolume", false);
}

function navigateBack() {
    bus.$emit('esc');
}

function setCurrentPlayer(id) {
    bus.$emit('setPlayer', id);
}

function refreshStatus() {
    bus.$emit('refreshStatus');
}

// Determine if an item is a 'text' item - i.e. cannot browse into
function isTextItem(item) {
    return !item.isPinned && !item.weblink &&
           ( "text"==item.type || ("redirect"==item.type && item.actions && item.actions.go && item.actions.go.nextWindow) ||
             // if group is not undefined, its probably a pinned app
             (undefined==item.type && undefined==item.group && (!item.menuActions || item.menuActions.length<1) && /* !item.params && Dynamic playlists have params? */
              (!item.command || (item.command[0]!="browsejive" && (item.command.length<2 || item.command[1]!="browsejive")))));
}

function shrinkJumplist(array, limit, totalItems) {
    if (array.length<=limit) {
        return array;
    }

    let remove = array.length - limit;
    // Calculate weight for each entry
    let items = [];
    for (let i=0, len=array.length; i<len; ++i) {
        if (array[i].key==SECTION_JUMP || 0==i) {
            items.push({weight:-1*LMS_BATCH_SIZE, pos:i, item:array[i]});
        } else {
            items.push({weight:-1*((i+1<len ? array[i+1].index : totalItems)-array[i].index), pos:i, item:array[i]});
        }
    }
    // Sort by weight, so keys with feweset entries are at end
    items.sort(function(a, b) { return a.weight!=b.weight ? a.weight<b.weight ? -1 : 1 : a.index<b.index ? -1 : 1 });
    // Trim last few items so we get to correct size
    items.splice(array.length-(1+remove), remove);
    // Re-sort into original order
    items.sort(function(a, b) { return a.pos<b.pos ? -1 : 1})
    // Recreate list
    let res = [];
    for (let i=0, len=items.length; i<len; ++i) {
        res.push(array[items[i].pos]);
    }
    return res;
}

function updateItemFavorites(item) {
    if ( (item.favUrl && item.favIcon) || (item.presetParams && item.presetParams.favorites_url)) {
        return;
    }

    try {
        let favTitle = item.favTitle ? item.favTitle : item.origTitle ? item.origTitle : item.title;
        let id = ""+item.id;
        if (id.startsWith("work_id:") && item.images && item.images.length>1) {
            let ids=[];
            for (let i=0, list=item.images, len=list.length; i<len; ++i) {
                ids.push(list[i].split('/')[list[i][0]=='/' ? 2 : 1]);
            }
            item.favIcon = changeImageSizing(item.images[item.images.length-1])+"?ids="+ids.reverse().join(",");
        } else if (item.id!=undefined && item.album_id!=undefined) {
            item.favIcon="music/"+item.album_id+"/cover.png";
        } else if (id.startsWith("genre_id:")) {
            item.favUrl="db:genre.name="+encodeURIComponent(favTitle);
            item.favIcon="html/images/genres.png";
        } else if (id.startsWith("artist_id:")) {
            if (!item.favUrl) {
                item.favUrl="db:contributor.name="+encodeURIComponent(favTitle);
            }
            item.favIcon=changeImageSizing(item.image);
        } else if (id.startsWith("album_id:")) {
            if (undefined==item.favUrl) {
                item.favUrl="db:album.title="+encodeURIComponent(favTitle);
                if (LMS_VERSION>=80300) {
                    if (undefined!=item.extid) {
                        item.favUrl=item.extid;
                    } else if (undefined!=item.artists && item.artists.length>0) {
                        item.favUrl+="&contributor.name="+encodeURIComponent(item.artists[0]);
                    } else if (undefined!=item.subtitle) {
                        item.favUrl+="&contributor.name="+encodeURIComponent(item.subtitle);
                    }
                }
            }
            item.favIcon=changeImageSizing(item.image);
        } else if (id.startsWith("year:")) {
            item.favUrl="db:year.id="+encodeURIComponent(favTitle);
            item.favIcon="html/images/years.png";
        } else if (id.startsWith("playlist:")) {
            item.favIcon="html/images/playlists.png";
        } else if (item.stdItem==STD_ITEM_MUSICIP_MOOD) {
            item.favUrl=item.id;
            item.favIcon="plugins/MusicMagic/html/images/icon.png";
        } else if (undefined!=item.infoParams && undefined!=item.infoParams.url) {
            item.favUrl=item.infoParams.url;
            item.favIcon=item.infoParams.image;
        }

        if (!item.favUrl && item.url) {
            item.favUrl = item.url;
        }
        if (!item.favIcon) {
            item.favIcon = item.images ? changeImageSizing(item.images[item.images.length-1]) : item.image ? changeImageSizing(item.image) : item.icon;
        }
    } catch(e) {
    }
}

function isInFavorites(item) {
    if (undefined==item) {
        return false;
    }
    updateItemFavorites(item);
    return lmsFavorites.has(item.presetParams && item.presetParams.favorites_url ? item.presetParams.favorites_url : item.favUrl);
}

function uniqueId(id, listSize) {
    return id+"@index-"+listSize;
}

function originalId(id) {
    return id.split("@index-")[0];
}

function showMenu(obj, newMenu) {
    if (obj.menu.show) {
        setTimeout(function () {
            obj.menu = newMenu;
        }.bind(this), 100);
    } else {
        obj.menu = newMenu;
        obj.menu.show = true;
    }
}

function handleClickOnHref(event) {
    if (IS_MOBILE) {
        let target = event.target || event.srcElement;
        if (target.tagName === 'A') {
            let href = target.getAttribute('href');
            if (undefined!=href && null!=href && href.length>10) {
                openWindow(href);
                event.preventDefault();
            }
        }
    }
}

let lastSelectedTextEvent=undefined;
function viewHandleSelectedText(view, event) {
    let now = new Date().getTime();
    if (undefined!=lastSelectedTextEvent && (now-lastSelectedTextEvent)<75) {
        lastSelectedTextEvent = now;
        return;
    }
    lastSelectedTextEvent = now;
    if (view.menu.show) {
        view.menu.show = false;
        return;
    }
    let sel = window.getSelection();
    if (undefined==sel) {
        handleClickOnHref(event);
        return;
    }
    let text = ""+sel;
    if (isEmpty(text)) {
        handleClickOnHref(event);
        return;
    }
    event.preventDefault();
    view.touch = undefined;
    view.menu.show = false;
    view.menu.items = [COPY_ACTION, SEARCH_TEXT_ACTION];
    view.menu.name = "selection";
    view.menu.selection = text;
    let touch = getTouchPos(event);
    if (undefined!=touch) {
        view.menu.x = touch.x;
        view.menu.y = touch.y;
    } else {
        view.menu.x = event.clientX;
        view.menu.y = event.clientY;
    }
    setTimeout(function () { view.menu.show = true; }.bind(view), 10);
}

function clearTextSelection() {
    if (window.getSelection) {
        if (window.getSelection().empty) {
            window.getSelection().empty();
        } else if (window.getSelection().removeAllRanges) {
            window.getSelection().removeAllRanges();
        }
    } else if (document.selection) {
         document.selection.empty();
    }
}

function addAndPlayAllActions(cmd, items) {
    if (cmd.command[0]=="albums") {
        for (var i=0, len=cmd.params.length; i<len; ++i) {
            if (cmd.params[i].startsWith("artist_id:") || cmd.params[i].startsWith("genre_id:") || cmd.params[i].startsWith("search:") || cmd.params[i].startsWith("composer_id:")) {
                return true;
            }
        }
        return false;
    } else if (cmd.command[0]=="artists" || cmd.command[0]=="genres" || cmd.command[0]=="years" || cmd.command[0]=="playlists" || cmd.command[0]=="musicfolder") {
        return false;
    } else if (cmd.command[0]=="browselibrary" && cmd.command[1]=="items") { // Browse filesystem and top/flop tracks
        for (var i=0, len=cmd.params.length; i<len; ++i) {
            if (cmd.params[i]=="mode:filesystem" || cmd.params[i].startsWith("search:sql=tracks_persistent.playcount")) {
                return false;
            }
        }
    } else if (cmd.command[0]=="custombrowse") {
        for (var i=0, len=cmd.params.length; i<len; ++i) {
            if (cmd.params[i].startsWith("artist:") || cmd.params[i].startsWith("variousartist:") || cmd.params[i].startsWith("album:")) {
                return true;
            }
        }
        return false;
    } else if (cmd.command[0]=="trackinfo" || cmd.command[0]=="albuminfo" || cmd.command[0]=="artistinfo") {
        // For *info commands if first 15 items have play action assume can add add/play all
        if (undefined!=items && items.length>0) {
            for (let i=0, len=items.length; i<15 && i<len; ++i) {
                if (undefined==items[i].menu || items[i].menu.length<1 || items[i].menu[0]!=PLAY_ACTION) {
                    return false;
                }
            }
            return true;
        }
        return false;
    }

    return true;
}

function isAudioTrack(item) {
    return (undefined!=item.stdItem && (STD_ITEM_TRACK==item.stdItem || STD_ITEM_ALBUM_TRACK==item.stdItem || STD_ITEM_PLAYLIST_TRACK==item.stdItem || STD_ITEM_REMOTE_PLAYLIST_TRACK==item.stdItem || STD_ITEM_RANDOM_MIX==item.stdItem)) ||
           "audio"==item.type || "track"==item.type ||
                ( ("itemplay"==item.style || "item_play"==item.style) && item.menu && item.menu.length>0) || // itemplay for dynamic playlists
                (item.goAction && (item.goAction == "playControl" || item.goAction == "play"));
}

function decodeShortcutEvent(e) {
    let s = {key:undefined, modifier:undefined, time:new Date().getTime()};
    if (e.altKey) {
        s.modifier = e.shiftKey ? 'alt+shift' : 'alt';
    } else if (e.ctrlKey || e.metaKey) {
        s.modifier = e.shiftKey ? 'mod+shift' : 'mod';
    }
    if (e.code && e.code.startsWith('Digit')) {
        s.key = e.code.substring(5);
    } else if (e.key.length==1) {
        s.key = e.key==' ' ? 'space' : e.key.toUpperCase();
    } else {
        let key = e.key.toLowerCase();
        s.key = key.startsWith('arrow') ? key.substring(5) : key;
    }
    return s;
}

function copyTextToClipboard(text, display) {
    if (navigator.clipboard) {
        try{
            navigator.clipboard.writeText(text);
            if (display) {
                bus.$emit('showMessage', i18n('Copied: %1', text));
            }
            return;
        } catch (err) {
        }
    }
    var textArea = document.createElement("textarea");
    textArea.setAttribute('readonly', true);
    textArea.setAttribute('contenteditable', true);
    textArea.value = text;

    // Avoid scrolling to bottom
    textArea.style.top = 0;
    textArea.style.left = 0;
    textArea.style.position = 'fixed';
    textArea.style.width = '1px';
    textArea.style.height = '1px';
    textArea.style.padding = 0;
    textArea.style.border = 'none';
    textArea.style.outline = 'none';
    textArea.style.boxShadow = 'none';
    textArea.style.background = 'transparent';
    document.body.appendChild(textArea);
    textArea.select();
    const range = document.createRange();
    range.selectNodeContents(textArea);
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
    textArea.setSelectionRange(0, textArea.value.length);
    try {
        document.execCommand('copy');
        if (display) {
            bus.$emit('showMessage', i18n('Copied: %1', text));
        }
    } catch (err) {
    } finally {
        document.body.removeChild(textArea);
    }
}

function removeDuplicates(playistId, items) {
    let dupes=[];
    let tracks = new Set();
    for (let i=0, len=items.length; i<len; ++i) {
        let track = items[i].title.toLowerCase();
        if (tracks.has(track)) {
            dupes.push("index:"+i);
        } else {
            tracks.add(track);
        }
    }
    dupes = dupes.reverse();
    if (dupes.length>0) {
        bus.$emit('doAllList', dupes, ["playlists", "edit", "cmd:delete", playistId], SECTION_PLAYLISTS, i18n("All duplicates removed"));
    } else {
        bus.$emit('showMessage', i18n('No duplicates found'));
    }
}

function openServerSettings(serverName, showHome, path) {
    if (lmsOptions.useDefaultForSettings==2 && window.innerWidth>=MIN_DEF_SETTINGS_WIDTH) {
        openWindow("/Default/settings/index.html" + (bus.$store.state.player ? "?player=" + bus.$store.state.player.id : ""));
        return;
    }
    let pathToUse = undefined==path
                    ? '/material/settings/server/basic.html'
                    : path;
    let actions = [{title:i18n('Restart'), text:i18n('Restart %1?', LMS_WINDOW_TITLE), icon:'refresh', cmd:['restartserver'], confirm:i18n('Restart')},
                   {title:i18n('Shutdown'), text:i18n('Stop %1?', LMS_WINDOW_TITLE), icon:'power_settings_new', cmd:['stopserver'], confirm:i18n('Shutdown')}];
    if (LMS_OS_NAME.toLowerCase()=="picore") {
        actions.push(DIVIDER);
        actions.push({title:i18n("Configuration"), text:i18n("Configuration")+(serverName ? SEPARATOR+serverName : ""), icon:'build', link:"http://"+location.hostname});
    }
    bus.$emit('dlg.open', 'iframe', pathToUse, TB_SERVER_SETTINGS.title+(serverName ? SEPARATOR+serverName : ""), actions, showHome);
}

function getYear(text) {
    let rx = /\s\([0-9][0-9][0-9][0-9]\)\s/g;
    let matches = rx.exec(text);
    if (undefined!=matches && 1==matches.length) {
        return matches[matches.length-1].substring(0, 7);
    }
}

function sortPlaylist(view, playerId, title, command) {
    let sorts = [
        {val:0, title:i18n("Reverse"), subtitle:i18n("Reverse current order")},
        {val:1, title:i18n("Random"), subtitle:i18n("Shuffle list")},
        {val:2, title:i18n("Album artist"),
                subtitle:lmsOptions.supportReleaseTypes ? i18n("...then release, disc no., track no.") : i18n("...then album, disc no., track no.")},
        {val:3, title:i18n("Artist"),
                subtitle:lmsOptions.supportReleaseTypes ? i18n("...then release, disc no., track no.") : i18n("...then album, disc no., track no.")},
        {val:4, title:lmsOptions.supportReleaseTypes ? i18n("Release") : i18n("Album"), subtitle:i18n("...then album artist, disc no., track no.")},
        {val:5, title:i18n("Title"),
                subtitle:lmsOptions.supportReleaseTypes ? i18n("...then album artist, release, disc no., track no.") : i18n("...then album artist, album, disc no., track no.")},
        {val:6, title:i18n("Genre"),
                subtitle:lmsOptions.supportReleaseTypes ? i18n("...then album artist, release, disc no., track no.") : i18n("...then album artist, album, disc no., track no.")},
        {val:7, title:i18n("Year"),
                subtitle:lmsOptions.supportReleaseTypes ? i18n("...then album artist, release, disc no., track no.") : i18n("...then album artist, album, disc no., track no.")}
    ];
    if (lmsOptions.showComposer) {
        sorts.push({val:8, title:i18n("Composer"),
                    subtitle:lmsOptions.supportReleaseTypes ? i18n("...then release, disc no., track no.") : i18n("...then album, disc no., track no.")});
    }
    if (lmsOptions.showConductor) {
        sorts.push({val:9, title:i18n("Conductor"),
                    subtitle:lmsOptions.supportReleaseTypes ? i18n("...then release, disc no., track no.") : i18n("...then album, disc no., track no.")});
    }
    if (lmsOptions.showBand) {
        sorts.push({val:10, title:i18n("Band"),
                    subtitle:lmsOptions.supportReleaseTypes ? i18n("...then release, disc no., track no.") : i18n("...then album, disc no., track no.")});
    }
    sorts.push({val:11, title:i18n("Date added"),
                subtitle:lmsOptions.supportReleaseTypes ? i18n("...then album artist, release, disc no., track no.") : i18n("...then album artist, album, disc no., track no.")});
    if (LMS_STATS_ENABLED) {
        sorts.push({val:12, title:i18n("Date last played"),
                    subtitle:lmsOptions.supportReleaseTypes ? i18n("...then album artist, release, disc no., track no.") : i18n("...then album artist, album, disc no., track no.")});
    }
    if (view.$store.state.showRating) {
        sorts.push({val:13, title:i18n("Rating"),
                    subtitle:lmsOptions.supportReleaseTypes ? i18n("...then album artist, release, disc no., track no.") : i18n("...then album artist, album, disc no., track no.")});
    }
    if (LMS_STATS_ENABLED) {
        sorts.push({val:14, title:i18n("Play count"),
                    subtitle:lmsOptions.supportReleaseTypes ? i18n("...then album artist, release, disc no., track no.") : i18n("...then album artist, album, disc no., track no.")});
    }

    if (undefined!=view.cancelCloseTimer) {
        view.cancelCloseTimer(true);
    }
    choose(title, sorts, {key:command[1], options:[{title:title, val:0}, {title:title+SEPARATOR+i18n('Single field only'), val:1}]}).then(choice => {
        if (undefined!=view.resetCloseTimer) {
            view.resetCloseTimer();
        }
        if (undefined!=choice) {
            command.push("order:"+(choice.item.val+(choice.option.val*100)));
            lmsCommand(playerId, command).then(({data}) => {
                if ("sort-queue" == command[1]) {
                    bus.$emit('refreshStatus');
                } else {
                    bus.$emit('refreshList', SECTION_PLAYLISTS);
                }
            });
        }
    });
}

function inRect(x, y, rx, ry, rw, rh, padding) {
    return x>=(rx-padding) && x<=(rx+rw+padding) && y>=(ry-padding) && y<=(ry+rh+padding);
}

const ALBUM_SORT_KEY = "albumSort";
const ARTIST_ALBUM_SORT_KEY = "artistAlbumSort";
const WORK_ALBUM_SORT_KEY = "workAlbumSort";

function commandAlbumSortKey(command, genre) {
    var isArtist = false;
    var isCompilation = false;
    var isWorks = false;
    [command.params, command.command].forEach(list => {
        for (var i=0, len=list.length; i<len; ++i) {
            let val = ""+list[i];
            if (val.startsWith("artist_id:")) {
                isArtist = true;
            } else if (val=="compilation:1") {
                isCompilation = true;
            } else if (val.startsWith("work_id:")) {
                isWorks = true;
            }
        }
    });
    var baseSort = isWorks ? WORK_ALBUM_SORT_KEY : isArtist && !isCompilation ? ARTIST_ALBUM_SORT_KEY : ALBUM_SORT_KEY;
    if (!isWorks && undefined!=genre && (lmsOptions.composerGenres.has(genre)) || lmsOptions.conductorGenres.has(genre) || lmsOptions.bandGenres.has(genre)) {
        return baseSort+"C";
    }
    return baseSort;
}

const VALID_ALBUM_SORTS = new Set(["album", "artistalbum", "artflow", "yearalbum", "yearartistalbum"]);
const VALID_TRACK_SORTS = new Set(["title", "tracknum", "albumtrack", "yearalbumtrack", "artisttitle", "yeartitle"]);

function getAlbumSort(command, genre) {
    let key = commandAlbumSortKey(command, genre);
    let def = ALBUM_SORT_KEY==key || (ALBUM_SORT_KEY+"C")==key ? "album" : "yearalbum";
    let parts = getLocalStorageVal(key, def).split(".");
    let val = {by:parts[0], rev:parts.length>1};
    if (!VALID_ALBUM_SORTS.has(val.by)) {
        val.by = def;
    }
    return val;
}

function setAlbumSort(command, genre, sort, reverse) {
    setLocalStorageVal(commandAlbumSortKey(command, genre), sort+(reverse ? ".r" : ""));
}

function getTrackSort(stdItem) {
    let key = stdItem==STD_ITEM_COMPOSITION_TRACKS ? "compositionTrackSort" : stdItem==STD_ITEM_WORK ? "workTrackSort" : "trackSort";
    let def = "yearalbumtrack";
    let parts = getLocalStorageVal(key, def).split(".");
    let val = {by:parts[0], rev:parts.length>1};
    if (!VALID_TRACK_SORTS.has(val.by)) {
        val.by = def;
    }
    return val;
}

function setTrackSort(sort, reverse, stdItem) {
    setLocalStorageVal(stdItem==STD_ITEM_COMPOSITION_TRACKS ? "compositionTrackSort" : "trackSort", sort+(reverse ? ".r" : ""));
}

function getArtist(i) {
    if (i.artist) {
        return i.artist;
    }
    if (i.trackartist) {
        return i.trackartist;
    }
    if (i.albumartist) {
        return i.albumartist;
    }
    if (i.band) {
        return i.band;
    }
    if (i.composer) {
        return i.composer;
    }
    if (i.conductor) {
        return i.conductor;
    }
    return undefined;
}

function albumTrackSort(a, b) {
    var s = fixedSort(a.album, b.album);
    if (s!=0) {
        return s;
    }
    var va=a.disc ? a.disc : 0;
    var vb=b.disc ? b.disc : 0;
    if (va<vb) {
        return -1;
    }
    if (va>vb) {
        return 1;
    }
    va=a.tracknum ? a.tracknum : 0;
    vb=b.tracknum ? b.tracknum : 0;
    if (va<vb) {
        return -1;
    }
    if (va>vb) {
        return 1;
    }
    return 0;
}

function yearAlbumTrackSort(a, b) {
    var va=a.year ? a.year : 0;
    var vb=b.year ? b.year : 0;
    if (va<vb) {
        return -1;
    }
    if (va>vb) {
        return 1;
    }
    return albumTrackSort(a, b);
}

function revYearAlbumTrackSort(a, b) {
    var va=a.year ? a.year : 0;
    var vb=b.year ? b.year : 0;
    if (va>vb) {
        return -1;
    }
    if (va<vb) {
        return 1;
    }
    return albumTrackSort(a, b);
}

function removeTrackNum(s) {
    let parts = s.split(SEPARATOR);
    return 2==parts.length ? parts[1] : s;
}

function artistTitleSort(a, b) {
    let s = fixedSort(getArtist(a), getArtist(b));
    if (s!=0) {
        return s;
    }
    s = fixedSort(removeTrackNum(a.title), removeTrackNum(b.title));
    if (s!=0) {
        return s;
    }
    return albumTrackSort(a, b);
}

function titleArtistSort(a, b) {
    let s = fixedSort(removeTrackNum(a.title), removeTrackNum(b.title));
    if (s!=0) {
        return s;
    }
    s = fixedSort(getArtist(a), getArtist(b));
    if (s!=0) {
        return s;
    }
    return albumTrackSort(a, b);
}

function yearTitleSort(a, b) {
    let va=a.year ? a.year : 0;
    let vb=b.year ? b.year : 0;
    if (va<vb) {
        return -1;
    }
    if (va>vb) {
        return 1;
    }
    let s = fixedSort(removeTrackNum(a.title), removeTrackNum(b.title));
    if (s!=0) {
        return s;
    }
    s = fixedSort(getArtist(a), getArtist(b));
    if (s!=0) {
        return s;
    }
    return albumTrackSort(a, b);
}

function setListElemClass(child, clz, add) {
    let elem = child;
    while (elem && elem.role!='listitem') {
        elem = elem.parentNode;
    }
    if (elem && elem.role=='listitem') {
        if (add) {
            elem.classList.add(clz);
        } else {
            elem.classList.remove(clz);
        }
    }
}

function bindNumeric(dlg) {
    dlg.boundKeys = false;
    if (!IS_MOBILE && dlg.items.length<=10 && dlg.$store.state.keyboardControl) {
        for (let i=0, len=dlg.items.length; i<len; ++i) {
            bindKey(""+(dlg.firstIsZero ? i : i<9 ? i+1 : 0));
        }
        dlg.boundKeys=true;
    }
}

function unbindNumeric(dlg, firstIsZero) {
    if (!IS_MOBILE && dlg.items.length<=10 && dlg.boundKeys) {
        for (let i=0, len=dlg.items.length; i<len; ++i) {
            unbindKey(""+(dlg.firstIsZero ? i :i<9 ? i+1 : 0));
        }
    }
    dlg.boundKeys = false;
}

function handleNumeric(dlg, func, itemKey) {
    bus.$on('keyboard', function(key, modifier) {
        if (dlg.show && dlg.boundKeys && undefined==modifier) {
            let val = parseInt(key);
            if ((""+val)==key) {
                if (undefined==dlg.firstIsZero || !dlg.firstIsZero) {
                    if (0==val) {
                        val=9;
                    } else {
                        val--;
                    }
                }
                if (val>=0 && val<dlg.items.length) {
                    func(undefined==itemKey ? dlg.items[val] : dlg.items[val][itemKey]);
                }
            }
        }
    }.bind(dlg));
}

let mskinLastClickOrTouch = undefined;
let mskinDialogWindowResize = false;
function storeClickOrTouchPos(event, menu) {
    if (event) {
        let now = new Date().getTime();
        let pos = undefined!=menu && (menu.show || (undefined!=menu.closed && now-menu.closed<100)) ? {x:menu.x, y:menu.y} : getTouchOrClickPos(event);
        mskinLastClickOrTouch={ time:now, x:pos.x, y:pos.y };
    }
}

function getTouchOrClickPos(event) {
    let tp = getTouchPos(event);
    return { x:tp ? tp.x : undefined==event.x ? event.clientX : event.x,
             y:tp ? tp.y : undefined==event.y ? event.clientY : event.y };
}

function resetDialogPos() {
    if ('unset'!=getComputedStyle(document.documentElement).getPropertyValue('--dialog-top')) {
        document.documentElement.style.setProperty('--dialog-top', 'unset');
        document.documentElement.style.setProperty('--dialog-left', 'unset');
    }
}

function dialogPosition(state) {
    resetDialogPos();
    if (state && !state.moveDialogs) {
        return;
    }
    if ((window.innerHeight>768 && window.innerWidth>1024) || (window.innerWidth>768 && window.innerHeight>1024)) {
        document.documentElement.style.setProperty('--dialog-opacity', '0');

        setTimeout(function () {
            try {
                if (undefined!=mskinLastClickOrTouch && new Date().getTime()-mskinLastClickOrTouch.time<150 && undefined!=mskinLastClickOrTouch.x) {
                    setDialogPos();
                } else {
                    resetDialogPos();
                }
            } catch(e) {
            }
            document.documentElement.style.setProperty('--dialog-opacity', '1.0');
        }, 2);
    }
}

function setDialogPos() {
    const MARGIN = 32;
    let elems = document.getElementsByClassName('v-dialog');
    if (undefined!=elems) {
        for (let e=0, len=elems.length; e<len; ++e) {
            let elem = elems[e];
            if (!elem.classList.contains("v-dialog--fullscreen")) {
                let w = elem.offsetWidth;
                let h = elem.offsetHeight;
                let top = mskinLastClickOrTouch.y - (h/2.0);
                let left = mskinLastClickOrTouch.x - (w/2.0);
                if (left<MARGIN) {
                    left = MARGIN;
                } else if (left+w+MARGIN > window.innerWidth) {
                    left = window.innerWidth - (w + MARGIN);
                }
                if (top<MARGIN) {
                    top = MARGIN;
                } else if (top+h+MARGIN > window.innerHeight) {
                    top = window.innerHeight - (h + MARGIN);
                }
                document.documentElement.style.setProperty('--dialog-top', top+'px');
                document.documentElement.style.setProperty('--dialog-left', left+'px');

                if (!mskinDialogWindowResize) {
                    mskinDialogWindowResize=true;
                    window.addEventListener('resize', setDialogPos);
                }
                return;
            }
        }
    }

    if (mskinDialogWindowResize) {
        mskinDialogWindowResize = false;
        window.removeEventListener('resize', setDialogPos);
    }
}

function isSameArtists(item, rolea, roleb) {
    if (item[rolea]!=item[roleb] ||
        (undefined!=item[rolea+"s"] && undefined==item[roleb+"s"]) ||
        (undefined==item[rolea+"s"] && undefined!=item[roleb+"s"])) {
        return false;
    }
    if (undefined!=item[rolea+"s"]) {
        let la=item[rolea+"s"];
        let lb=item[roleb+"s"];
        let len=la.length;
        if (len!=lb.length) {
            return false;
        }
        for (let i=0; i<len; ++i) {
            if (la[i]!=lb[i]) {
                return false;
            }
        }
    }
    return true;
}

function isSameArtistsL(item, rolea, roleList) {
    for (let i=0, len=roleList.length; i<len; ++i) {
        if (isSameArtists(item, rolea, roleList[i])) {
            return true;
        }
    }
    return false;
}

function roleDisplayName(role) {
    if (undefined==role) {
        return undefined;
    }
    let val = isNaN(role) ? roleIntValue(role) : parseInt(role);
    if (val<=0) {
        return undefined;
    }
    if (val==ARTIST_ROLE || val==ALBUM_ARTIST_ROLE || val==TRACK_ARTIST_ROLE) {
        return undefined;
    }
    if (val==BAND_ARTIST_ROLE) {
        return i18n("Band/orchestra");
    }
    if (val==COMPOSER_ARTIST_ROLE) {
        return i18n("Composer");
    }
    if (val==CONDUCTOR_ARTIST_ROLE) {
        return i18n("Conductor");
    }
    return lmsOptions.userDefinedRoles[val]==undefined
        ? undefined
        : lmsOptions.userDefinedRoles[val].name;
}

function refreshViewItems(view) {
    // When using recycler view items can sometimes still look selected until interact with view.
    // Changing, and reverting, item text seems to work-around this...
    if (view.items.length>0) {
        for (let i=0, len=view.items.length; i<len; ++i) {
            view.items[i].titlex = view.items[i].title;
            view.items[i].title = view.items[i].title+" ";
        }
        view.$nextTick(function () {
            for (let i=0, len=view.items.length; i<len; ++i) {
                if (undefined!=view.items[i].titlex) {
                    view.items[i].title = view.items[i].titlex;
                    delete view.items[i].titlex;
                }
            }
        });
    }
}

function arraysEqual(a, b) {
    if (a === b) {
        return true;
    }
    if (a == null || b == null || a.length !== b.length) {
        return false;
    }

    for (let i = 0, len=a.lngth; i < len; ++i) {
        if (a[i] !== b[i]) {
            return false;
        }
    }
    return true;
}

function localPath(url) {
    if (undefined!=url && /^file:\/\//.test(url)) {
        try {
            let path=decodeURIComponent(url.substring(0, url.lastIndexOf('/'))+'/').substring(7);
            // if we have (e.g.) /c:/path change to c:/path
            if (/^\/[a-zA-Z]:\/.+/.test(path)) {
                path = path.substring(1);
            }
            return path;
        } catch(e) {
        }
    }
    return undefined;
}

const LOCAL_FILE_EXT = new Set(["txt", "text", "htm", "html"]);

function openWebLink(item) {
    let url = item.weblink;
    let parts = url.split('/').pop().split('?')[0].split('.');
    let ext = parts[parts.length-1].toLowerCase();

    if (((!IS_IOS && !IS_ANDROID) || (LOCAL_FILE_EXT.has(ext.toLowerCase()))) && !queryParams.dontEmbed.has(ext) && (item.isLocalFile || (!url.startsWith("http:") && !url.startsWith("https:")))) {
        bus.$emit('dlg.open', 'iframe', url, item.title, undefined, IFRAME_HOME_NAVIGATES_BROWSE_HOME);
    } else {
        window.open(url);
    }
}

function openWebUrl(url) {
    let u = unescape(url);
    openWebLink({weblink:u, title:u});
}

function filterComments(comments) {
    if (undefined==comments) {
        return undefined;
    }
    let parts = comments.split(" / ");
    let usable = [];
    for (let p=0, len=parts.length; p<len; ++p) {
        if (!parts[p].startsWith("BLISS_ANALYSIS,")) {
            usable.push(parts[p]);
        }
    }
    if (usable.length>0) {
        return usable.join(" / ");
    }
    return undefined;
}
