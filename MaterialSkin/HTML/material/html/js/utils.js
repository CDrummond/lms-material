/**
 * LMS-Material
 *
 * Copyright (c) 2018-2020 Craig Drummond <craig.p.drummond@gmail.com>
 * MIT license.
 */
'use strict';

const SEPARATOR = " \u2022 ";
const MY_SQUEEZEBOX_IMAGE_PROXY = "https://www.mysqueezebox.com/public/imageproxy";
const LS_PREFIX="lms-material::";
const LMS_LIST_CACHE_PREFIX = "cache:list:";
const IS_MOBILE  = (/Android|webOS|iPhone|iPad|BlackBerry|Windows Phone|Opera Mini|IEMobile|Mobile/i.test(navigator.userAgent)) || ( (typeof window.orientation !== "undefined") && 'ontouchstart' in window) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
const IS_ANDROID = /Android/i.test(navigator.userAgent);
const IS_IOS     = (/iPhone|iPad/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)) && !window.MSStream;
const IS_IPHONE  = /iPhone/i.test(navigator.userAgent) && !window.MSStream;
const IS_APPLE   = /Mac|iPhone|iPad/i.test(navigator.userAgent);
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

var bus = new Vue();
var queryParams = parseQueryParams();
var canUseCache = true;
var volumeStep = 5;

function parseQueryParams() {
    var queryString = window.location.href.substring(window.location.href.indexOf('?')+1);
    var hash = queryString.indexOf('#');
    if (hash>0) {
        queryString=queryString.substring(0, hash);
    }
    var query = queryString.split('&');
    var resp = { actions:[], debug:new Set(), hide:new Set(), layout:undefined, player:undefined, nativeStatus:false, nativeColors:false, nativePlayer:false, appSettings:undefined, appQuit:undefined };

    for (var i = query.length - 1; i >= 0; i--) {
        var kv = query[i].split('=');
        if ("player"==kv[0]) {
            setLocalStorageVal("player", kv[1]);
            removeLocalStorage("defaultPlayer");
            resp.player=kv[1];
        } else if ("page"==kv[0]) {
            if (kv[1]=="browse" || kv[1]=="now-playing" || kv[1]=="queue") {
                setLocalStorageVal("page", kv[1]);
            }
        } else if ("debug"==kv[0]) {
            var parts = kv[1].split(",");
            for (var j=0, len=parts.length; j<len; ++j) {
                resp.debug.add(parts[j]);
            }
        } else if ("clearcache"==kv[0]) {
            clearListCache(true);
        } else if ("action"==kv[0]) {
            resp.actions.push(kv[1]);
        } else if("css"==kv[0]) {
            changeLink("/material/customcss/"+kv[1]+"?r=" + LMS_MATERIAL_REVISION, "customcss");
        } else if ("layout"==kv[0]) {
            resp.layout=kv[1];
        } else if ("nativeStatus"==kv[0]) {
            resp.nativeStatus=true;
        } else if ("nativeColors"==kv[0]) {
            resp.nativeColors=true;
        } else if ("nativePlayer"==kv[0]) {
            resp.nativePlayer=true;
        } else if ("hide"==kv[0]) {
            var parts = kv[1].split(",");
            for (var j=0, len=parts.length; j<len; ++j) {
                resp.hide.add(parts[j]);
            }
        } else if ("appSettings"==kv[0]) {
            resp.appSettings=kv[1];
        } else if ("appQuit"==kv[0]) {
            resp.appQuit=kv[1];
        } else if ("ios"==kv[0]) {
            document.documentElement.style.setProperty('--bottom-nav-pad', '12px');
        }
    }
    return resp;
}

function logJsonMessage(type, msg) {
    if (queryParams.debug.has("json")) {
        console.log("[" + new Date().toLocaleTimeString()+"] JSON "+type+(msg ? (": "+JSON.stringify(msg)) : ""));
    }
}

function logCometdMessage(type, msg) {
    if (queryParams.debug.has("cometd")) {
        console.log("[" + new Date().toLocaleTimeString()+"] COMETED "+type+(msg ? (": "+JSON.stringify(msg)) : ""));
    }
}

function logCometdDebug(msg) {
    if (queryParams.debug.has("cometd")) {
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

    return (days>0 ? i18np("1 day", "%1 days", days)+" " : "")+
           ((hours>0 || (showDays && days>0)) ? hours+":" : "")+
           (minutes<1 ? "00:" : "") +
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

function resolveImageUrl(image, size) {
    image=""+image; // Ensure its a string!
    if ((image.includes("http://") || image.includes("https://")) && !(image.startsWith('/imageproxy') || image.startsWith('imageproxy'))) {
        var url = new URL(image);
        if (url.hostname.startsWith("192.168.") || url.hostname.startsWith("127.") || url.hostname.endsWith(".local")) {
            return image;
        }
        if (lmsOptions.useMySqueezeboxImageProxy) {
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

function replaceNewLines(str) {
    return str ? str.replace(/\n/g, "<br/>").replace(/\\n/g, "<br/>") : str;
}

function changeLink(href, id) {
    var links = document.getElementsByTagName("link");
    if (undefined==links) {
        return;
    }
    for (var i=0, len=links.length; i<len; ++i) {
        if (links[i].getAttribute("id")==id) {
            if (links[i].getAttribute("href")==href) {
                return;
            }
            var newlink = document.createElement("link");
            newlink.setAttribute("rel", "stylesheet");
            newlink.setAttribute("type", "text/css");
            newlink.setAttribute("href", href);
            newlink.setAttribute("id", id);
            var onErr = links[i].getAttribute("onerror");
            if (onErr!=undefined) {
                newlink.setAttribute("onerror", onErr);
            }
            document.getElementsByTagName("head").item(0).replaceChild(newlink, links[i]);
            return;
        }
    }
}

function setTheme(theme, color) {
    if (theme!=undefined) {
        let t = theme.split('-');
        let variant = t.length>1 && ('colored'==t[1] || 'standard'==t[1]) ? t.pop() : 'standard';
        let themeName = t.join('-');

        if (themeName.startsWith("user:")) {
            changeLink("/material/usertheme/" + themeName.substring(5) + "?r=" + LMS_MATERIAL_REVISION, "themecss");
        } else {
            changeLink("html/css/themes/" + themeName + ".css?r=" + LMS_MATERIAL_REVISION, "themecss");
        }
        changeLink("html/css/variant/" + variant + ".css?r=" + LMS_MATERIAL_REVISION, "variantcss");
    }
    if (color!=undefined) {
        if (color.startsWith("user:")) {
            changeLink("/material/usercolor/" + color.substring(5) + "?r=" + LMS_MATERIAL_REVISION, "colorcss");
        } else {
            changeLink("html/css/colors/" + color + ".css?r=" + LMS_MATERIAL_REVISION, "colorcss");
        }
        emitToolbarColors("--top-toolbar-color", "--bottom-toolbar-color");
    }
}

function setLayout(useDesktop) {
    changeLink("html/css/" + (useDesktop ? "desktop" : "mobile") + ".css?r=" + LMS_MATERIAL_REVISION, "layoutcss");
    changeLink("/material/customcss/" + (useDesktop ? "desktop" : "mobile"), "customcss");
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

function setBgndCover(elem, coverUrl) {
    if (elem) {
        elem.style.backgroundColor = "var(--background-color)";
        if (undefined==coverUrl || coverUrl.endsWith(DEFAULT_COVER) || coverUrl.endsWith("/music/undefined/cover")) {
            elem.style.backgroundImage = "url()";
        } else {
            elem.style.backgroundImage = "url('"+coverUrl+"')";
        }
        elem.style.boxShadow = "inset 0 0 120vw 120vh var(--background-shadow-color)";
    }
}

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

function isLandscape() {
    return window.innerWidth >= (window.innerHeight*(IS_MOBILE || IS_IOS ? 1.3 : 1.5));
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

function cacheKey(command, params, start, batchSize) {
    return LMS_LIST_CACHE_PREFIX+LMS_CACHE_VERSION+":"+lmsLastScan+":"+
           (command ? command.join("-") : "") + ":" + (params ? params.join("-") : "") + 
           (command && (command[0]=="artists" || command[0]=="albums") ? (lmsOptions.noGenreFilter ? ":1" : ":0") : "") +
           (command && command[0]=="albums" ? (lmsOptions.noRoleFilter ? ":1" : ":0") : "") +
           (command && command[0]=="artists" ? (lmsOptions.infoPlugin && lmsOptions.artistImages ? ":1" : ":0") : "") +
           ":"+start+":"+batchSize;
}

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

function msgIsEmpty(msg) {
    return msg=='Empty' || msg==i18n('Empty') || msg=='Empty.' || msg==(i18n('Empty')+'.');
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
    return !item.isPinned && !item.weblink &&
           ( "text"==item.type || ("redirect"==item.type && item.actions && item.actions.go && item.actions.go.nextWindow) ||
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
    } else if (item.stdItem==STD_ITEM_MUSICIP_MOOD) {
        item.favUrl=item.id;
        item.favIcon="plugins/MusicMagic/html/images/icon.png";
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

function commandAlbumSortKey(command, genre) {
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
    for (var i=0, len=command.command.length; i<len; ++i) {
        if (command.command[i].startsWith("artist_id:")) {
            isArtist = true;
        }
        if (command.command[i]=="compilation:1") {
            isCompilation = true;
        }
    }
    var baseSort = isArtist && !isCompilation ? ARTIST_ALBUM_SORT_KEY : ALBUM_SORT_KEY;
    if (undefined!=genre && (LMS_COMPOSER_GENRES.has(genre)) || LMS_CONDUCTOR_GENRES.has(genre)) {
        return baseSort+"C";
    }
    return baseSort;
}

function getAlbumSort(command, genre) {
    var key=commandAlbumSortKey(command, genre);
    return getLocalStorageVal(key, ALBUM_SORT_KEY==key || (ALBUM_SORT_KEY+"C")==key ? "album" : "yearalbum");
}

function setAlbumSort(command, genre, sort) {
    setLocalStorageVal(commandAlbumSortKey(command, genre), sort);
}

function forceItemUpdate(vm, item) {
    var prev = item.title;
    item.title = "XX"+item.title;
    vm.$nextTick(function () {
        item.title = prev;
    });
}

function mapArtistIcon(params, item) {
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

function addAndPlayAllActions(cmd) {
    if (cmd.command[0]=="albums") {
        for (var i=0, len=cmd.params.length; i<len; ++i) {
            if (cmd.params[i].startsWith("artist_id:") || cmd.params[i].startsWith("genre_id:") || cmd.params[i].startsWith("search:")) {
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

function isAudioTrack(item) {
    return "audio"==item.type  || "track"==item.type ||
                ( ("itemplay"==item.style || "item_play"==item.style) && item.menu && item.menu.length>0) || // itemplay for dynamic playlists
                (item.goAction && (item.goAction == "playControl" || item.goAction == "play"));
}

function setElemSizes(larger) {
    document.documentElement.style.setProperty('--std-font-size', larger ? '19px' : '16px');
    document.documentElement.style.setProperty('--small-font-size', larger ? '18px' : '14px');
    document.documentElement.style.setProperty('--icon-size', larger ? '28px' : '24px');
    document.documentElement.style.setProperty('--toolbar-button-margin', larger ? '2px' : '4px');
}

function bindKey(key, modifier) {
    Mousetrap.bind((undefined==modifier ? "" : (modifier+"+")) + key.toLowerCase(), function(e) {
        if (store.state.keyboardControl) {
            e.preventDefault();
            bus.$emit('keyboard', key, modifier);
        }
    } );
}

function shortcutStr(key, shift) {
    if (IS_APPLE) {
        return shift ? i18n("⌘+Shift+%1", key) : i18n("⌘+%1", key);
    }
    return shift ? i18n("Ctrl+Shift+%1", key) : i18n("Ctrl+%1", key);
}

const PLAYLIST_EXTENSIONS = new Set(["m3u", "m3u8", "pls", "xspf", "asx", "cue"]);
function isPlaylist(filename) {
    if (undefined==filename) {
        return false;
    }
    var parts = filename.split('.');
    if (parts.length<2) {
        return false;
    }
    return PLAYLIST_EXTENSIONS.has(parts[parts.length-1].toLowerCase());
}

function focusEntry(ui) {
    ui.$nextTick(() => { ui.$nextTick(() => { ui.$refs.entry.focus()}); });
}

function capitalize(s) {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

function addNote(str) {
    return "<br/><br/><div class='note'>"+str+"</div>";
}

let lastToolbarColors = {top: undefined, bot:undefined};
function emitToolbarColors(top, bot) {
    if (queryParams.nativeColors) {
        let t = getComputedStyle(document.documentElement).getPropertyValue(top);
        let b = getComputedStyle(document.documentElement).getPropertyValue(bot);
        if (t!=lastToolbarColors.top || b!=lastToolbarColors.bot) {
            if (undefined==t || 0==t.length || undefined==b || 0==b.length) {
                setTimeout(function() {
                    emitToolbarColors(top, bot);
                }, 100);
                return;
            }
            lastToolbarColors={top:t, bot:b};
            bus.$nextTick(function () {
                try {
                    NativeReceiver.updateToolbarColors(lastToolbarColors.top, lastToolbarColors.bot);
                } catch (e) {
                }
            });
        }
    }
}

function formatTrackNum(item) {
    let t = parseInt(item.tracknum);
    let d = item.disccount && item.disc && parseInt(item.disccount)>1 ? parseInt(item.disc) : undefined;
    return (undefined==d ? "" : (d+SEPARATOR)) + (t>9 ? t : ("0" + t));
}

function copyTextToClipboard(text) {
    if (navigator.clipboard) {
        try{
            navigator.clipboard.writeText(text);
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
    } catch (err) {
    } finally {
        document.body.removeChild(textArea);
    }
}
