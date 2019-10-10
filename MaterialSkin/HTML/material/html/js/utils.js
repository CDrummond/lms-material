/**
 * LMS-Material
 *
 * Copyright (c) 2018-2019 Craig Drummond <craig.p.drummond@gmail.com>
 * MIT license.
 */

const SEPARATOR = " \u2022 ";
const MY_SQUEEZEBOX_IMAGE_PROXY = "https://www.mysqueezebox.com/public/imageproxy";

var bus = new Vue();
var debug = undefined;

function logJsonMessage(type, msg) {
    if (debug && (debug.has("json") || debug.has("true"))) {
        console.log("[" + new Date().toLocaleTimeString()+"] JSON "+type+(msg ? (": "+JSON.stringify(msg)) : ""));
    }
}

function logCometdMessage(type, msg) {
    if (debug && (debug.has("cometd") || debug.has("true"))) {
        console.log("[" + new Date().toLocaleTimeString()+"] COMETED "+type+": "+JSON.stringify(msg));
    }
}

function logCometdDebug(msg) {
    if (debug && (debug.has("cometd") || debug.has("true"))) {
        console.log("[" + new Date().toLocaleTimeString()+"] COMETED "+msg);
    }
}

function commandToLog(command, params, start, count) {
    var cmd = [];
    if (undefined!=command) {
        command.forEach(i => { cmd.push(i); });
    }
    if (undefined!=params) {
        if (undefined!=start) {
            cmd.push(start);
            cmd.push(undefined==count ? LMS_BATCH_SIZE : count);
        }
        params.forEach(i => { cmd.push(i); });
    }
    return cmd
}

function logError(err, command, params, start, count) {
    console.error("[" + new Date().toUTCString()+"] ERROR:" + err, commandToLog(command, params, start, count));
    console.trace();
}

function logAndShowError(err, message, command, params, start, count) {
    logError(err, command, params, start, count);
    bus.$emit('showError', err, message);
}

function formatSeconds(secs, showDays) {
    var numSeconds = parseInt(secs, 10)
    var days       = showDays ? Math.floor(numSeconds / (3600*24)) : 0;
    var hours      = showDays ? Math.floor(numSeconds / 3600) % 24 : Math.floor(numSeconds / 3600);
    var minutes    = Math.floor(numSeconds / 60) % 60
    var seconds    = numSeconds % 60
    if (days>0) {
        return i18np("1 day", "%1 days", days)+" "+
                 ([hours,minutes,seconds]
                 .map(v => v < 10 ? "0" + v : v)
                 .filter((v,i) => v !== "00" || i > 0)
                 .join(":"));
    }
    if (hours>0) {
        return [hours,minutes,seconds]
                 .map(v => v < 10 ? "0" + v : v)
                 .filter((v,i) => v !== "00" || i > 0)
                 .join(":");
    }
    return (minutes<1 ? "00:" : "") +
           [minutes,seconds]
             .map(v => v < 10 ? "0" + v : v)
             .filter((v,i) => v !== "00" || i > 0)
             .join(":");
}

function formatTime(secs, twentyFour) {
    var numSeconds = parseInt(secs, 10)
    var hours      = Math.floor(numSeconds / 3600) % 24
    var minutes    = Math.floor(numSeconds / 60) % 60
    if (twentyFour) {
        return [hours,minutes]
                 .map(v => v < 10 ? "0" + v : v)
                 .join(":");
    } else {
        return (hours%12 || 12)+":"+(minutes<10 ? "0" : "")+minutes+" "+(hours<12 ? "AM" : "PM");
    }
}

function formatDate(timestamp) {
    var date = new Date(timestamp * 1000);
    return date.toLocaleDateString() + " " + date.toLocaleTimeString();
}

var useMySqueezeboxImageProxy = true;

function resolveImageUrl(image, size) {
    image=""+image; // Ensure its a string!
    if ((image.includes("http://") || image.includes("https://")) && !(image.startsWith('/imageproxy') || image.startsWith('imageproxy'))) {
        var url = new URL(image);
        if (url.hostname.startsWith("192.168.") || url.hostname.startsWith("127.") || url.hostname.endsWith(".local")) {
            return image;
        }
        if (useMySqueezeboxImageProxy) {
            var s=size ? size.split('x')[0].replace('_', '') : LMS_IMAGE_SZ;
            return MY_SQUEEZEBOX_IMAGE_PROXY+"?w="+s+"&h="+s+"&m=F&u="+encodeURIComponent(image);
        } else {
            return '/imageproxy/' + encodeURIComponent(image) + '/image' + (size ? size : LMS_IMAGE_SIZE);
        }
    }

    var idx = image.lastIndexOf(".png");
    if (idx < 0) {
        idx = image.lastIndexOf(".jpg");
    }
    if (idx<0 && /^[0-9a-fA-F]+$/.test(image)) {
        image="music/"+image+"/cover"+(size ? size : LMS_IMAGE_SIZE);
    } else if (idx>0) {
        image = image.substring(0, idx)+(size ? size : LMS_IMAGE_SIZE)+image.substring(idx);
    }
    return image.startsWith("/") ? image : ("/"+image);
}

function resolveImage(icon, image, size) {
    if (!icon && !image) {
        return null;
    }
    if (image) {
        return resolveImageUrl(image, size);
    }
    return resolveImageUrl(icon , size);
}

function changeImageSizing(path, newSize) {
    if (undefined!=path) {
        if (path.startsWith(MY_SQUEEZEBOX_IMAGE_PROXY)) {
            var url = path.split("u=")[1];
            if (newSize) {
                var s=newSize.split('x')[0].replace('_', '');
                return MY_SQUEEZEBOX_IMAGE_PROXY+"?w="+s+"&h="+s+"&m=F&u="+url;
            }
            return MY_SQUEEZEBOX_IMAGE_PROXY+"?u="+url;
        }

        var specs = [LMS_IMAGE_SIZE, LMS_CURRENT_IMAGE_SIZE, "_50x50_o"];
        for (var s=0, len=specs.length; s<len; ++s) {
            if (path.endsWith(specs[s]+".png")) {
                return path.replace(specs[s]+".png", (newSize ? newSize : "")+".png");
            }
            if (path.endsWith(specs[s])) {
                return path.substring(0, path.length - specs[s].length)+(newSize ? newSize : "");
            }
        }
    }
    return path;
}

function fixTitle(str) {
    var prefixes = ["the", "el", "la", "los", "las", "le", "les"];
    for (var p=0, len=prefixes.length; p<len; ++p) {
        if (str.startsWith(prefixes[p]+" ")) {
            return str.substring(prefixes[p].length+1)+", "+prefixes[p];
        }
    }
    return str;
}

function nameSort(a, b) {
    var nameA = a.name.toLowerCase();
    var nameB = b.name.toLowerCase();
    if (nameA < nameB) {
        return -1;
    }
    if (nameA > nameB) {
        return 1;
    }
    return 0;
}

function titleSort(a, b) {
    var titleA = fixTitle(a.title.toLowerCase());
    var titleB = fixTitle(b.title.toLowerCase());
    if (titleA < titleB) {
        return -1;
    }
    if (titleA > titleB) {
        return 1;
    }
    return 0;
}

function itemSort(a, b) {
    var at = "group"==a.type ? 0 : "track"==a.type ? ("music_note"==a.icon ? 1 : 2) : 3;
    var bt = "group"==b.type ? 0 : "track"==b.type ? ("music_note"==b.icon ? 1 : 2) : 3;
    if (at!=bt) {
        return at<bt ? -1 : 1;
    }
    return titleSort(a, b);
}

function favSort(a, b) {
    var at = a.isFavFolder ? 0 : 1;
    var bt = b.isFavFolder ? 0 : 1;
    if (at!=bt) {
        return at<bt ? -1 : 1;
    }
    return titleSort(a, b);
}

function partialFavSort(a, b) {
    var at = a.isFavFolder ? 0 : 1;
    var bt = b.isFavFolder ? 0 : 1;
    if (at!=bt) {
        return at<bt ? -1 : 1;
    }
    if (a.isFavFolder) {
        return titleSort(a, b);
    }
    return a.pos<b.pos ? -1 : 1;
}

function playerSort(a, b) {
    if (a.isgroup!=b.isgroup) {
        return a.isgroup ? 1 : -1;
    }
    var nameA = a.name.toLowerCase();
    var nameB = b.name.toLowerCase();
    if (nameA < nameB) {
        return -1;
    }
    if (nameA > nameB) {
        return 1;
    }
    return 0;
}

function otherPlayerSort(a, b) {
    var serverA = a.server.toLowerCase();
    var serverB = b.server.toLowerCase();
    if (serverA < serverB) {
        return -1;
    }
    if (serverA > serverB) {
        return 1;
    }
    var nameA = a.name.toLowerCase();
    var nameB = b.name.toLowerCase();
    if (nameA < nameB) {
        return -1;
    }
    if (nameA > nameB) {
        return 1;
    }
    return 0;
}

function homeScreenSort(a, b) {
    var at = a.id.startsWith(TOP_ID_PREFIX) ? 2 : a.id.startsWith(MUSIC_ID_PREFIX) ? 1 : 0;
    var bt = b.id.startsWith(TOP_ID_PREFIX) ? 2 : b.id.startsWith(MUSIC_ID_PREFIX) ? 1 : 0;
    if (at==bt) {
        return at==0 || a.weight==b.weight ? titleSort(a, b) : a.weight<b.weight ? -1 : 1;
    }
    return at<bt ? -1 : 1;
}

function setScrollTop(el, val) {
    // When using RecycleScroller we need to wait for the next animation frame to scroll, so
    // just do this for all scrolls.
    window.requestAnimationFrame(function () {
        // https://popmotion.io/blog/20170704-manually-set-scroll-while-ios-momentum-scroll-bounces/
        el.style['-webkit-overflow-scrolling'] = 'auto';
        el.scrollTop=val;
        el.style['-webkit-overflow-scrolling'] = 'touch';
    });
}

const LS_PREFIX="lms-material::";

function getLocalStorageBool(key, def) {
    var val = window.localStorage.getItem(LS_PREFIX+key);
    return undefined!=val ? "true" == val : def;
}

function getLocalStorageVal(key, def) {
    var val = window.localStorage.getItem(LS_PREFIX+key);
    return undefined!=val ? val : def;
}

function setLocalStorageVal(key, val) {
    window.localStorage.setItem(LS_PREFIX+key, val);
}

function removeLocalStorage(key) {
    window.localStorage.removeItem(LS_PREFIX+key);
}

function isMobile() {
    return /Android|webOS|iPhone|iPad|BlackBerry|Windows Phone|Opera Mini|IEMobile|Mobile/i.test(navigator.userAgent);
}
const IS_MOBILE = isMobile();

function isAndroid() {
    return /Android/i.test(navigator.userAgent);
}

function isIOS() {
    return /iPhone|iPad/i.test(navigator.userAgent);
}

function isIPhone() {
    return /iPhone/i.test(navigator.userAgent);
}

function replaceNewLines(str) {
    return str ? str.replace(/\n/g, "<br/>").replace(/\\n/g, "<br/>") : str;
}

function changeCss(cssFile, index) {
    var oldlink = document.getElementsByTagName("link").item(index);
    var newlink = document.createElement("link");
    newlink.setAttribute("rel", "stylesheet");
    newlink.setAttribute("type", "text/css");
    newlink.setAttribute("href", cssFile);

    document.getElementsByTagName("head").item(0).replaceChild(newlink, oldlink);
}

function setTheme(dark) {
    if (dark) {
        changeCss("html/css/dark.css?r=" + LMS_MATERIAL_REVISION, 0);
    } else {
        changeCss("html/css/light.css?r=" + LMS_MATERIAL_REVISION, 0);
    }
}

function openWindow(page) {
    window.open(page, '_blank');
}

function fixId(id, prefix) {
    var parts = id.split(".");
    if (parts.length>1) {
        parts.shift();
        return prefix + "."+parts.join(".");
    }
    return id;
}

function setBgndCover(elem, coverUrl, isDark) {
    if (elem) {
        elem.style.backgroundColor = isDark ? "#424242" : "#fff";
        if (undefined==coverUrl || coverUrl.endsWith(DEFAULT_COVER) || coverUrl.endsWith("/music/undefined/cover")) {
            elem.style.backgroundImage = "url()";
        } else {
            elem.style.backgroundImage = "url('"+coverUrl+"')";
        }
        if (isDark) {
            //if (coverUrl) {
                elem.style.boxShadow = "inset 0 0 120vw 120vh rgba(72,72,72,0.9)";
           // } else {
           //     elem.style.boxShadow = "";
           // }
        } else {
            //if (coverUrl) {
                elem.style.boxShadow = "inset 0 0 120vw 120vh rgba(255,255,255,0.9)";
            //} else {
            //    elem.style.boxShadow = "";
           // }
        }
    }
}

var volumeStep = 5;

function adjustVolume(vol, inc) {
    if (1==volumeStep) {
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
        return Math.floor((vol+volumeStep)/volumeStep)*volumeStep;
    }

    if (vol<=volumeStep) {
        return 0;
    }

    var adj = Math.floor(vol/volumeStep)*volumeStep;
    // If rounding down to volumeStep is 2% (or more) then use that, else make even lower
    if ((vol-adj)>=2) {
        return adj;
    }
    return Math.floor((vol-volumeStep)/volumeStep)*volumeStep;
}

function parseQueryParams() {
    var queryString = window.location.href.substring(window.location.href.indexOf('?')+1);
    var hash = queryString.indexOf('#');
    if (hash>0) {
        queryString=queryString.substring(0, hash);
    }
    var query = queryString.split('&');

    for (var i = query.length - 1; i >= 0; i--) {
        var kv = query[i].split('=');
        if ("player"==kv[0]) {
            setLocalStorageVal("player", kv[1]);
            removeLocalStorage("defaultPlayer");
        } else if ("page"==kv[0]) {
            if (kv[1]=="browse" || kv[1]=="now-playing" || kv[1]=="queue") {
                setLocalStorageVal("page", kv[1]);
            }
        } else if ("debug"==kv[0]) {
            var parts = kv[1].split(",");
            debug = new Set();
            for (var j=0, len=parts.length; j<len; ++j) {
                debug.add(parts[j]);
            }
        } else if ("clearcache"==kv[0] && "true"==kv[1]) {
            clearListCache(true);
        }
    }
}

function isLandscape() {
    return window.innerWidth > (window.innerHeight*1.25);
}

function incrementVolume() {
    bus.$emit("adjustVolume", true);
}

function decrementVolume() {
    bus.$emit("adjustVolume", false);
}

function isVisible(elem) {
    var rect = elem.getBoundingClientRect();
    var viewHeight = Math.max(document.documentElement.clientHeight, window.innerHeight);
    return !(rect.bottom < 0 || rect.top - viewHeight >= 0);
}

function ensureVisible(elem, attempt) {
    elem.scrollIntoView();
    if (!isVisible(elem) && (undefined==attempt || attempt<15)) {
        window.setTimeout(function() {
            ensureVisible(elem, undefined==attempt ? 1 : attempt+1);
        }, 100);
    }
}

const LMS_LIST_CACHE_PREFIX = "cache:list:";
function cacheKey(command, params, start, batchSize) {
    return LMS_LIST_CACHE_PREFIX+LMS_CACHE_VERSION+":"+lmsLastScan+":"+
           (command ? command.join("-") : "") + ":" + (params ? params.join("-") : "") + 
           (command && (command[0]=="artists" || command[0]=="albums") ? (lmsOptions.noGenreFilter ? ":1" : ":0") : "") +
           (command && command[0]=="albums" ? (lmsOptions.noRoleFilter ? ":1" : ":0") : "") +
           ":"+start+":"+batchSize;
}

var canUseCache = true;
function clearListCache(force) {
    // Delete old local-storage cache
    for (var key in window.localStorage) {
        if (key.startsWith(LS_PREFIX+LMS_LIST_CACHE_PREFIX) &&
            (force || !key.startsWith(LS_PREFIX+LMS_LIST_CACHE_PREFIX+LMS_CACHE_VERSION+":"+lmsLastScan+":"))) {
            window.localStorage.removeItem(key);
        }
    }
    // Delete IndexedDB cache
    idbKeyval.keys().then(keys => {
        for (var i=0, len=keys.length; i<len; ++i) {
            if (keys[i].startsWith(LMS_LIST_CACHE_PREFIX) && (force || !keys[i].startsWith(LMS_LIST_CACHE_PREFIX+LMS_CACHE_VERSION+":"+lmsLastScan+":"))) {
                idbKeyval.del(keys[i]);
            }
        }
    }).catch(err => {
        canUseCache = false;
    });
}

const RATINGS=["",         // 0
               "<i class=\"rstar\">star_half</i>", // 0.5
               "<i class=\"rstar\">star</i>",  // 1
               "<i class=\"rstar\">star</i> <i class=\"rstar\">star_half</i>", // 1.5
               "<i class=\"rstar\">star</i> <i class=\"rstar\">star</i>", // 2
               "<i class=\"rstar\">star</i> <i class=\"rstar\">star</i> <i class=\"rstar\">star_half</i>", // 2.5
               "<i class=\"rstar\">star</i> <i class=\"rstar\">star</i> <i class=\"rstar\">star</i>", // 3
               "<i class=\"rstar\">star</i> <i class=\"rstar\">star</i> <i class=\"rstar\">star</i> <i class=\"rstar\">star_half</i>", // 3.5
               "<i class=\"rstar\">star</i> <i class=\"rstar\">star</i> <i class=\"rstar\">star</i> <i class=\"rstar\">star</i>", // 4
               "<i class=\"rstar\">star</i> <i class=\"rstar\">star</i> <i class=\"rstar\">star</i> <i class=\"rstar\">star</i> <i class=\"rstar\">star_half</i>", // 4.5
               "<i class=\"rstar\">star</i> <i class=\"rstar\">star</i> <i class=\"rstar\">star</i> <i class=\"rstar\">star</i> <i class=\"rstar\">star</i>"]; // 5

function ratingString(current, val) {
    var str = "";
    if (current) {
        var prev=current.indexOf("<i class=\"rstar\">");
        if (prev>-1) {
            str = current.substring(0, prev);
        } else {
            str += current;
        }
    }
    var index=Math.ceil(val/10.0);
    return index<=0 ? str : (str+SEPARATOR+RATINGS[index<0 ? 0 : (index>=RATINGS.length ? RATINGS.length-1 : index)]);
}

function isEmpty(str) {
    return undefined==str || str.length<1;
}

function checkRemoteTitle(item) {
    return item && item.remote_title && !item.remote_title.startsWith("http:/") && !item.remote_title.startsWith("https:/")
        ? item.remote_title : undefined;
}

function hasPlayableId(item) {
    return item.item_id || item.track || item.track_id || item.album_id || item.artist_id || item.album || item.playlistid /* dynamic playlists*/ ||
           item.album || item.artist || item.variousartist || item.year || item.genre || item.playlist; // CustomBrowse
}

function shouldAddLibraryId(command) {
    if (command.command && command.command.length>0) {
        if (command.command[0]=="artists" || command.command[0]=="albums" || command.command[0]=="tracks" ||
            command.command[0]=="genres" || command.command[0]=="playlists" || "browselibrary"==command.command[0]) {
            return true;
        }
        if (command.command[0]=="playlistcontrol") {
            for (var i=1, len=command.command.length; i<len; ++i) {
                if (command.command[i].startsWith("artist_id:") || command.command[i].startsWith("album_id:") ||
                    command.command[i].startsWith("track_id:") || command.command[i].startsWith("genre_id:") || command.command[i].startsWith("year:")) {
                    return true;
                }
            }
        }
    }
    return false;
}

// Determine if an item is a 'text' item - i.e. cannot browse into
function isTextItem(item) {
    return !item.weblink &&
           ( "text"==item.type ||
             // if group is not undefined, its probably a pinned app
             (undefined==item.type && undefined==item.group && (!item.menuActions || item.menuActions.length<1) && /* !item.params && Dynamic playlists have params? */
              (!item.command || (item.command[0]!="browsejive" && (item.command.length<2 || item.command[1]!="browsejive")))));
}

function shrinkAray(array, limit) {
    if (array.length<=limit) {
        return array;
    }
    var res = [];
    var i = 0;
    var scale = array.length / limit;
    while (i < limit) {
        res.push(array[Math.round(i * scale)]);
        i++;
    }
    res[res.length-1]=array[array.length-1];
    return res;
}

function updateItemFavorites(item) {
    if ( (item.favUrl && item.favIcon) || (item.presetParams && item.presetParams.favorites_url)) {
        return;
    }

    var favTitle = item.origTitle ? item.origTitle : item.title;
    if (item.id.startsWith("genre_id:")) {
        item.favUrl="db:genre.name="+encodeURIComponent(favTitle);
        item.favIcon="html/images/genres.png";
    } else if (item.id.startsWith("artist_id:")) {
        item.favUrl="db:contributor.name="+encodeURIComponent(favTitle);
        item.favIcon=changeImageSizing(item.image);
    } else if (item.id.startsWith("album_id:")) {
        item.favUrl="db:album.title="+encodeURIComponent(favTitle);
        item.favIcon=changeImageSizing(item.image);
    } else if (item.id.startsWith("year:")) {
        item.favUrl="db:year.id="+encodeURIComponent(favTitle);
        item.favIcon="html/images/years.png";
    } else if (item.id.startsWith("playlist:")) {
        item.favIcon="html/images/playlists.png";
    }

    item.favUrl = item.favUrl ? item.favUrl : item.url;
    item.favIcon = item.favIcon ? item.favIcon : item.image
}

function isInFavorites(item) {
    updateItemFavorites(item);
    return lmsFavorites.has(item.presetParams && item.presetParams.favorites_url ? item.presetParams.favorites_url : item.favUrl);
}

function uniqueId(id, listSize) {
    return id+"@index:"+listSize;
}

function originalId(id) {
    return id.split("@index:")[0];
}

function addPart(str, part) {
    return str ? (part ? str+SEPARATOR+part : str) : part;
}

function commandGridKey(command) {
    return command.command[0]+"-grid";
}

const USE_LIST_VIEW_BY_DEFAULT=new Set(["myapps-grid", "podcasts-grid", "youtube-grid", "playhistory-grid"]);

function isSetToUseGrid(command) {
    var key = commandGridKey(command);
    return getLocalStorageBool(key, !USE_LIST_VIEW_BY_DEFAULT.has(key));
}

function setUseGrid(command, use) {
    var key = commandGridKey(command)
    var defList = USE_LIST_VIEW_BY_DEFAULT.has(key);
    // Only store value if different from default
    if ((defList && !use) || (!defList && use)) {
        removeLocalStorage(key);
    } else {
        setLocalStorageVal(key, use);
    }
}

const ALBUM_SORT_KEY = "albumSort";
const ARTIST_ALBUM_SORT_KEY = "artistAlbumSort";

function commandAlbumSortKey(command) {
    var isArtist = false;
    var isCompilation = false;
    for (var i=0, len=command.params.length; i<len; ++i) {
        if (command.params[i].startsWith("artist_id:")) {
            isArtist = true;
        }
        if (command.params[i]=="compilation:1") {
            isCompilation = true;
        }
    }
    return isArtist && !isCompilation ? ARTIST_ALBUM_SORT_KEY : ALBUM_SORT_KEY;
}

function getAlbumSort(command) {
    var key=commandAlbumSortKey(command);
    return getLocalStorageVal(key, ALBUM_SORT_KEY==key ? "album" : "yearalbum");
}

function setAlbumSort(command, sort) {
    setLocalStorageVal(commandAlbumSortKey(command), sort);
}

function folderName(path) {
    var parts = path.split("/");
    if (1==parts) {
        parts = i.path.split("\\"); // Windows?
    }
    return parts[parts.length-1];
}

function forceItemUpdate(vm, item) {
    var prev = item.title;
    item.title = "XX"+item.title;
    vm.$nextTick(function () {
        item.title = prev;
    });
}

function mapIcon(params, item) {
    item.icon=undefined;
    if (params && params.length>0) {
        for (var i=0, len=params.length; i<len; ++i) {
            if (params[i]=="role_id:COMPOSER" || params[i]=="role_id:2") {
                item.svg="composer";
                return;
            }
            if (params[i]=="role_id:CONDUCTOR" || params[i]=="role_id:3") {
                item.svg="conductor";
                return;
            }
            if (params[i]=="role_id:ALBUMARTIST") {
                item.svg="albumartist";
                return;
            }
            if (params[i]=="role_id:ARTIST" || params[i]=="role_id:PERFORMER") {
                break;
            }
        }
    }
    item.svg="artist";
}

function splitString(str) {
    var arr = [];
    var s = str.split(",");
    for (var i=0, len=s.length; i<len; ++i) {
        var e = s[i].trim();
        if (e.length>0) {
            arr.push(e);
        }
    }
    return arr;
}

function showMenu(obj, newMenu) {
    if (obj.menu.show) {
        setTimeout(function () {
            obj.menu = newMenu;
        }.bind(this), 100);
    } else {
        obj.menu = newMenu;
    }
}

function arrayMove(arr, from, to) {
    if (to >= arr.length) {
        var k = to - arr.length + 1;
        while (k--) {
            arr.push(undefined);
        }
    }
    arr.splice(to, 0, arr.splice(from, 1)[0]);
    return arr;
}

function getField(item, field) {
    if (undefined==item.params || item.params.length<1) {
        return -1;
    }
    for (var i=0, len=item.params.length; i<len; ++i) {
        // Can't pin an item with genre_id, as this can change on rescan
        if (item.params[i].startsWith(field)) {
            return i
        }
    }
    return -1;
}

function pageWasReloaded() {
    if (!window.performance) {
        return false;
    }

    // Attempt to user newer API (https://developer.mozilla.org/en-US/docs/Web/API/PerformanceNavigationTiming/type)
    if ('getEntriesByType' in performance) {
        var entries = performance.getEntriesByType("navigation");
        for (var i=0, len=entries.length; i < len; i++) {
            if ("reload"==entries[i].type) {
                return true;
            }
        }
    }

    // Fallback to older (deprecated) API
    return performance.navigation.type == performance.navigation.TYPE_RELOAD;
}

function addAndPlayAllActions(cmd) {
    if (cmd.command[0]=="albums") {
        for (var i=0, len=cmd.params.length; i<len; ++i) {
            if (cmd.params[i].startsWith("artist_id:") || cmd.params[i].startsWith("genre_id:")) {
                return true;
            }
        }
        return false;
    } else if (cmd.command[0]=="artists" || cmd.command[0]=="genres" || cmd.command[0]=="years" || cmd.command[0]=="playlists" ||
               cmd.command[0]=="musicfolder" || cmd.command[0]=="trackstat") {
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
    }

    return true;
}

function setFontSize(large) {
    document.documentElement.style.setProperty('--std-font-size', large ? '19px' : '16px');
    document.documentElement.style.setProperty('--small-font-size', large ? '18px' : '14px');
}

function bindKey(key, modifier) {
    Mousetrap.bind((undefined==modifier ? "" : (modifier+"+")) + key.toLowerCase(), function(e) {
        e.preventDefault();
        bus.$emit('keyboard', key, modifier);
    } );
}

function shortcutStr(key, shift) {
    return shift ? i18n("Ctrl(⌘)+Shift+%1", key) : i18n("Ctrl(⌘)+%1", key);
}
