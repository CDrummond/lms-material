/**
 * LMS-Material
 *
 * Copyright (c) 2018-2023 Craig Drummond <craig.p.drummond@gmail.com>
 * MIT license.
 */
'use strict';

const MY_SQUEEZEBOX_IMAGE_PROXY = "https://www.mysqueezebox.com/public/imageproxy";
const LS_PREFIX="lms-material::";
const LMS_LIST_CACHE_PREFIX = "cache:list:";

const RATINGS=["",         // 0
               "\ue839", // 0.5
               "\ue838",  // 1
               "\ue838\ue839", // 1.5
               "\ue838\ue838", // 2
               "\ue838\ue838\ue839", // 2.5
               "\ue838\ue838\ue838", // 3
               "\ue838\ue838\ue838\ue839", // 3.5
               "\ue838\ue838\ue838\ue838", // 4
               "\ue838\ue838\ue838\ue838\ue839", // 4.5
               "\ue838\ue838\ue838\ue838\ue838"]; // 5

const PASSIVE_SUPPORTED = browserSupportsPassiveScroll();
function browserSupportsPassiveScroll() {
  let passiveSupported = false;
  try {
    const options = { get passive() { passiveSupported = true; return false;} };
    window.addEventListener("test", null, options);
    window.removeEventListener("test", null, options);
  } catch (err) {
    passiveSupported = false;
  }
  return passiveSupported;
}

var bus = new Vue();
var queryParams = parseQueryParams();
var canUseCache = true;

function parseQueryParams() {
    var queryString = window.location.href.substring(window.location.href.indexOf('?')+1);
    var hash = queryString.indexOf('#');
    if (hash>0) {
        queryString=queryString.substring(0, hash);
    }
    var query = queryString.split('&');
    var resp = { actions:[], debug:new Set(), hide:new Set(), dontEmbed:new Set(), layout:undefined, player:undefined, single:false, nativeStatus:0, nativeColors:0, nativePlayer:0, nativeUiChanges:0, nativeTheme:0, nativeCover:0, nativePlayerPower:0, appSettings:undefined, appQuit:undefined, appLaunchPlayer:undefined, css:undefined, download:'browser', addpad:false, party:false, altBtnLayout:IS_WINDOWS, expand:[] };

    for (var i = query.length - 1; i >= 0; i--) {
        var kv = query[i].split('=');
        if ("player"==kv[0]) {
            var player = decodeURIComponent(kv[1]);
            setLocalStorageVal("player", player);
            removeLocalStorage("defaultPlayer");
            resp.player = player;
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
            resp.css = kv[1];
            changeLink("/material/customcss/"+kv[1]+"?r=" + LMS_MATERIAL_REVISION, "customcss");
        } else if("js"==kv[0]) {
            var element = document.createElement("script");
            element.src = "/material/customjs/"+kv[1]+"?r=" + LMS_MATERIAL_REVISION;
            document.body.appendChild(element);
        } else if ("layout"==kv[0]) {
            resp.layout=kv[1];
        } else if ("nativeStatus"==kv[0]) {
            resp.nativeStatus=kv[1]=="c" ? 2 : 1;
        } else if ("nativeColors"==kv[0]) {
            resp.nativeColors=kv[1]=="c" ? 2 : 1;
        } else if ("nativePlayer"==kv[0]) {
            resp.nativePlayer=kv[1]=="c" ? 2 : 1;
        } else if ("nativeUiChanges"==kv[0]) {
            resp.nativeUiChanges=kv[1]=="c" ? 2 : 1;
        } else if ("nativeTheme"==kv[0]) {
            resp.nativeTheme=kv[1]=="c" ? 2 : 1;
        } else if ("nativeCover"==kv[0]) {
            resp.nativeCover=kv[1]=="c" ? 2 : 1;
        } else if ("nativePlayerPower"==kv[0]) {
            resp.nativePlayerPower=kv[1]=="c" ? 2 : 1;
        } else if ("hide"==kv[0]) {
            var parts = kv[1].split(",");
            for (var j=0, len=parts.length; j<len; ++j) {
                resp.hide.add(parts[j]);
            }
        } else if ("appSettings"==kv[0]) {
            resp.appSettings=kv[1];
        } else if ("appQuit"==kv[0]) {
            resp.appQuit=kv[1];
        } else if ("appLaunchPlayer"==kv[0]) {
            resp.appLaunchPlayer=kv[1];
        } else if ("ios"==kv[0]) {
            document.documentElement.style.setProperty('--bottom-nav-pad', '12px');
        } else if ("theme"==kv[0]) {
            var parts = kv[1].split(",");
            setLocalStorageVal('theme', parts[0]);
            if (parts.length>1) {
                setLocalStorageVal('color', parts[1]);
            }
        } else if ("single"==kv[0]) {
            resp.single=true;
        } else if ("download"==kv[0] && kv.length>1) {
            resp.download=kv[1];
        } else if ("addpad"==kv[0]) {
            resp.addpad=true;
        } else if ("dontEmbed"==kv[0]) {
            var parts = kv[1].split(",");
            for (var j=0, len=parts.length; j<len; ++j) {
                resp.dontEmbed.add(parts[j]);
            }
        } else if ("party"==kv[0]) {
            resp.party=true;
        } else if ("altBtnLayout"==kv[0]) {
            resp.altBtnLayout=kv.length<1 || "true"==kv[1];
        } else if ("expand"==kv[0] && kv.length>1) {
            resp.expand=decodeURIComponent(kv[1]).split("/");
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
        console.log("[" + new Date().toLocaleTimeString()+"] COMETD "+type+(msg ? (": "+JSON.stringify(msg)) : ""));
    }
}

function logCometdDebug(msg) {
    if (queryParams.debug.has("cometd")) {
        console.log("[" + new Date().toLocaleTimeString()+"] COMETD "+msg);
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

function formatTechInfo(item, source) {
    let technical = [];
    if (item.bitrate) {
        technical.push(item.bitrate);
    }
    if (item.samplesize) {
        technical.push(i18n("%1bit", item.samplesize));
    }
    if (item.samplerate) {
        technical.push((item.samplerate/1000)+"kHz");
    }
    if (item.type) {
        let bracket = item.type.indexOf(" (");
        let type = bracket>0 ? item.type.substring(0, bracket) : item.type;
        // BBC Sounds as aac@48000Hz, want just aac
        if (type.length>4 && item.samplerate && type.indexOf("@")>2 && type.indexOf("Hz")>4) {
            type = type.split("@")[0];
        }
        type = type.length<=4 ? type.toUpperCase() : type;
        if (technical.indexOf(type)<0 && (undefined==source || (type!=source.text && type!=source.text.replace(/ /g,'')))) {
            technical.push(type);
        }
    }
    return technical.length>0 ? technical.join(' ') : undefined;
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
        if ((image.startsWith("plugins/") || image.startsWith("/plugins/")) && image.indexOf("/html/images/")>0) {
            return image;
        }
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

function fixedSort(a, b) {
    var titleA = undefined==a ? undefined : fixTitle(a.toLowerCase());
    var titleB = undefined==b ? undefined : fixTitle(b.toLowerCase());
    if (titleA < titleB) {
        return -1;
    }
    if (titleA > titleB) {
        return 1;
    }
    return 0;
}

function titleSort(a, b) {
    return fixedSort(a.title, b.title);
}

function weightSort(a, b) {
    return a.weight!=b.weight ? a.weight<b.weight ? -1 : 1 : titleSort(a, b);
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

function setScrollTop(view, val) {
    // When using RecycleScroller we need to wait for the next animation frame to scroll, so
    // just do this for all scrolls.
    window.requestAnimationFrame(function () {
        // https://popmotion.io/blog/20170704-manually-set-scroll-while-ios-momentum-scroll-bounces/
        view.scrollElement.style['-webkit-overflow-scrolling'] = 'auto';
        view.scrollElement.scrollTop=val;
        view.scrollElement.style['-webkit-overflow-scrolling'] = 'touch';
    });
}

function getLocalStorageBool(key, def) {
    let val = undefined
    try {
        val = undefined==window.localStorage ? undefined : window.localStorage.getItem(LS_PREFIX+key);
    } catch (e) {
    }
    return undefined!=val ? "true" == val : def;
}

function getLocalStorageVal(key, def) {
    let val = undefined;
    try {
        val = undefined==window.localStorage ? undefined : window.localStorage.getItem(LS_PREFIX+key);
    } catch (e) {
    }
    return undefined!=val ? val : def;
}

function setLocalStorageVal(key, val) {
    try {
        if (undefined!=window.localStorage) {
            window.localStorage.setItem(LS_PREFIX+key, val);
        }
    } catch (e) {
    }
}

function removeLocalStorage(key) {
    try {
        if (undefined!=window.localStorage) {
            window.localStorage.removeItem(LS_PREFIX+key);
        }
    } catch (e) {
    }
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
        let variant = t.length>1 && ('colored'==t[t.length-1] || 'standard'==t[t.length-1]) ? t.pop() : 'standard';
        let themeName = t.join('-');

        if (themeName.startsWith("user:")) {
            changeLink("/material/usertheme/" + themeName.substring(5) + "?r=" + LMS_MATERIAL_REVISION, "themecss");
        } else {
            changeLink("html/css/themes/" + themeName + ".css?r=" + LMS_MATERIAL_REVISION, "themecss");
        }
        changeLink("html/css/variant/" + variant + ".css?r=" + LMS_MATERIAL_REVISION, "variantcss");
        if (1==queryParams.nativeTheme) {
            bus.$nextTick(function () {
                try {
                    NativeReceiver.updateTheme(theme);
                } catch (e) {
                }
            });
        } else if (2==queryParams.nativeTheme) {
            console.log("MATERIAL-THEME\nNAME " + theme);
        }
    }
    if (color!=undefined) {
        if (color.startsWith("user:")) {
            changeLink("/material/usercolor/" + color.substring(5) + "?r=" + LMS_MATERIAL_REVISION, "colorcss");
        } else {
            changeLink("html/css/colors/" + color + ".css?r=" + LMS_MATERIAL_REVISION, "colorcss");
        }
        window.setTimeout(function() {
            emitToolbarColors("--top-toolbar-color", "--bottom-toolbar-color");
        }, 250);
    }
}

function setLayout(useDesktop) {
    changeLink("html/css/" + (useDesktop ? "desktop" : "mobile") + ".css?r=" + LMS_MATERIAL_REVISION, "layoutcss");
    if (undefined==queryParams.css) {
        changeLink("/material/customcss/" + (useDesktop ? "desktop" : "mobile"), "customcss");
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

function setCurrentPlayer(id) {
    bus.$emit('setPlayer', id);
}

function refreshStatus() {
    bus.$emit('refreshStatus');
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
    return index<=0 ? str : (str+SEPARATOR+"<i class=\"rstar\">"+RATINGS[index<0 ? 0 : (index>=RATINGS.length ? RATINGS.length-1 : index)]+"</i>");
}

function isEmpty(str) {
    return undefined==str || null==str || str.length<1;
}

function isNull(v) {
    return undefined==v || null==v;
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

const ADD_LIBRARY_ID = new Set(['artists', 'albums', 'tracks', 'genres', 'years', 'browselibrary', 'custombrowse']);

function shouldAddLibraryId(command) {
    if (command.command && command.command.length>0) {
        if (ADD_LIBRARY_ID.has(command.command[0])) {
            return true;
        }
        if (command.command[0]=="playlistcontrol") {
            for (var i=1, len=command.command.length; i<len; ++i) {
                if (command.command[i].startsWith("artist_id:") || command.command[i].startsWith("album_id:") || command.command[i].startsWith("track_id:") ||
                    command.command[i].startsWith("genre_id:") || command.command[i].startsWith("year:") || command.command[i].startsWith("playlist_id:")) {
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

    try {
        var favTitle = item.origTitle ? item.origTitle : item.title;
        if (item.id!=undefined && item.album_id!=undefined) {
            item.favIcon="music/"+item.album_id+"/cover.png";
        } else if (item.id.startsWith("genre_id:")) {
            item.favUrl="db:genre.name="+encodeURIComponent(favTitle);
            item.favIcon="html/images/genres.png";
        } else if (item.id.startsWith("artist_id:")) {
            item.favUrl="db:contributor.name="+encodeURIComponent(favTitle);
            item.favIcon=changeImageSizing(item.image);
        } else if (item.id.startsWith("album_id:")) {
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
            item.favIcon=changeImageSizing(item.image);
        } else if (item.id.startsWith("year:")) {
            item.favUrl="db:year.id="+encodeURIComponent(favTitle);
            item.favIcon="html/images/years.png";
        } else if (item.id.startsWith("playlist:")) {
            item.favIcon="html/images/playlists.png";
        } else if (item.stdItem==STD_ITEM_MUSICIP_MOOD) {
            item.favUrl=item.id;
            item.favIcon="plugins/MusicMagic/html/images/icon.png";
        } else if (undefined!=item.infoParams && undefined!=item.infoParams.url) {
            item.favUrl=item.infoParams.url;
            item.favIcon=item.infoParams.image;
        }

        item.favUrl = item.favUrl ? item.favUrl : item.url;
        item.favIcon = item.favIcon ? item.favIcon : item.image ? item.image : item.icon;
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

const USE_LIST_VIEW_BY_DEFAULT=new Set(["other-grid", "favorites-grid", "podcasts-grid", "youtube-grid", "playhistory-grid"]);

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
    [command.params, command.command].forEach(list => {
        for (var i=0, len=list.length; i<len; ++i) {
            let val = ""+list[i];
            if (val.startsWith("artist_id:")) {
                isArtist = true;
            } else if (val=="compilation:1") {
                isCompilation = true;
            }
        }
    });
    var baseSort = isArtist && !isCompilation ? ARTIST_ALBUM_SORT_KEY : ALBUM_SORT_KEY;
    if (undefined!=genre && (lmsOptions.composerGenres.has(genre)) || lmsOptions.conductorGenres.has(genre) || lmsOptions.bandGenres.has(genre)) {
        return baseSort+"C";
    }
    return baseSort;
}

function getAlbumSort(command, genre) {
    var key = commandAlbumSortKey(command, genre);
    var parts = getLocalStorageVal(key, ALBUM_SORT_KEY==key || (ALBUM_SORT_KEY+"C")==key ? "album" : "yearalbum").split(".");
    return {by:parts[0], rev:parts.length>1};
}

function setAlbumSort(command, genre, sort, reverse) {
    setLocalStorageVal(commandAlbumSortKey(command, genre), sort+(reverse ? ".r" : ""));
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
            if (params[i]=="role_id:ALBUMARTIST" || params[i]=="role_id:5") {
                item.svg="albumartist";
                return;
            }
            if (params[i]=="role_id:ARTIST" || params[i]=="role_id:TRACKARTIST" || params[i]=="role_id:PERFORMER" || params[i]=="role_id:1" || params[i]=="role_id:6") {
                break;
            }
            if (params[i]=="role_id:BAND" || params[i]=="role_id:4") {
                item.svg="trumpet";
                return;
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
        obj.menu.show = true;
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

function getIndex(list, field) {
    if (undefined==list || list.length<1) {
        return -1;
    }
    for (var i=0, len=list.length; i<len; ++i) {
        if ((""+list[i]).startsWith(field)) {
            return i
        }
    }
    return -1;
}

function getField(item, field) {
    return getIndex(item.params, field);
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
    return (undefined!=item.stdItem && (STD_ITEM_TRACK==item.stdItem || STD_ITEM_ALBUM_TRACK==item.stdItem || STD_ITEM_PLAYLIST_TRACK==item.stdItem || STD_ITEM_REMOTE_PLAYLIST_TRACK==item.stdItem)) ||
           "audio"==item.type || "track"==item.type ||
                ( ("itemplay"==item.style || "item_play"==item.style) && item.menu && item.menu.length>0) || // itemplay for dynamic playlists
                (item.goAction && (item.goAction == "playControl" || item.goAction == "play"));
}

function setFontSize(sz) {
    let std = 16;
    let small = 14;
    let icon = 24;
    switch(sz) {
    case 'l':
        std = 19;
        small = 18;
        icon = 26;
        break;
    case 'r':
        break;
    case 's':
        std = 13;
        small = 11;
        icon = 22;
        break;
    }

    document.documentElement.style.setProperty('--std-font-size', std+'px');
    document.documentElement.style.setProperty('--small-font-size', small+'px');
    document.documentElement.style.setProperty('--icon-size', icon+'px');
}

var lastShortcut={key:undefined, modifier:undefined, time:undefined};

function decodeShortcutEvent(e) {
    let s = {key:undefined, modifier:undefined, time:new Date().getTime()};
    if (e.altKey) {
        s.modifier = e.shiftKey ? 'alt+shift' : 'alt';
    } else if (e.ctrlKey || e.metaKey) {
        s.modifier = e.shiftKey ? 'mod+shift' : 'mod';
    }
    if (e.key.length==1) {
        s.key = e.key==' ' ? 'space' : e.key.toUpperCase();
    } else {
        let key = e.key.toLowerCase();
        s.key = key.startsWith('arrow') ? key.substring(5) : key;
    }
    return s;
}

function handleShortcut(e) {
    if (store.state.keyboardControl) {
        e.preventDefault();
        let s = decodeShortcutEvent(e);
        if (s.key!=lastShortcut.key || s.modifier!=lastShortcut.modifier || undefined==lastShortcut.time || s.time-lastShortcut.time>100) {
            bus.$emit('keyboard', s.key, s.modifier);
        }
        lastShortcut=s;
    }
}

function handleRepeatingShortcut(e) {
    if (store.state.keyboardControl) {
        e.preventDefault();
        let s = decodeShortcutEvent(e);
        if (s.key!=lastShortcut.key || s.modifier!=lastShortcut.modifier || undefined==lastShortcut.time || s.time-lastShortcut.time>=300) {
            bus.$emit('keyboard', s.key, s.modifier);
            lastShortcut=s;
        }
    }
}

function bindKey(key, modifier, canRepeat) {
    Mousetrap.bind((undefined==modifier ? "" : (modifier+"+")) + key.toLowerCase(), canRepeat ? handleRepeatingShortcut : handleShortcut);
}

function shortcutStr(key, shift, alt) {
    if (key.length>1) {
        if (key=="left") {
            key = "◀";
        } else if (key=="right") {
            key = "▶";
        } else if (key=="up") {
            key = "▲";
        } else if (key=="down") {
            key = "▼";
        }
    }
    if (alt) {
        return IS_APPLE ? i18n("Option+%1", key) : i18n("Alt+%1", key);
    }
    if (shift) {
        return IS_APPLE ? i18n("⌘+Shift+%1", key) : i18n("Ctrl+Shift+%1", key);
    }
    return IS_APPLE ? i18n("⌘+%1", key) : i18n("Ctrl+%1", key);
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
    let t = getComputedStyle(document.documentElement).getPropertyValue(top);
    let b = getComputedStyle(document.documentElement).getPropertyValue(bot);
    if (t!=lastToolbarColors.top || b!=lastToolbarColors.bot) {
        if (undefined==t || 0==t.length || undefined==b || 0==b.length) {
            setTimeout(function() {
                emitToolbarColors(top, bot);
            }, 100);
            return;
        }
        let tc = document.querySelector('meta[name="theme-color"]');
        if (tc!=null) {
            tc.setAttribute('content',  b);
        }
        lastToolbarColors={top:t, bot:b};
        if (1==queryParams.nativeColors) {
            bus.$nextTick(function () {
                try {
                    NativeReceiver.updateToolbarColors(lastToolbarColors.top, lastToolbarColors.bot);
                } catch (e) {
                }
            });
        } else if (2==queryParams.nativeColors) {
            console.log("MATERIAL-COLORS\nTOP " + lastToolbarColors.top + "\nBOTTOM " + lastToolbarColors.bot);
        }
    }
}

function formatTrackNum(item) {
    let t = parseInt(item.tracknum);
    let d = item.disccount && item.disc && parseInt(item.disccount)>1 ? parseInt(item.disc) : undefined;
    return (undefined==d ? "" : (d+".")) + (t>9 ? t : ("0" + t));
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

function getTouchPos(ev) {
    if (undefined==ev) {
        return undefined;
    }
    if (undefined==ev.touches || ev.touches.length<1) {
        if (undefined!=ev.changedTouches && ev.changedTouches.length>0) {
            return {x:ev.changedTouches[0].clientX, y:ev.changedTouches[0].clientY};
        }
        return undefined;
    }
    return {x:ev.touches[0].clientX, y:ev.touches[0].clientY};
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
        bus.$emit('showMessage', i18n('Playlist has no duplicates'));
    }
}

function useArtistTagType(genre, genres) {
    return (genre && genres.has(genre)) || (1==genres.size && genres.has('*'));
}

function useComposer(genre) {
    return useArtistTagType(genre, lmsOptions.composerGenres);
}

function useConductor(genre) {
    return useArtistTagType(genre, lmsOptions.conductorGenres);
}

function useBand(genre) {
    return useArtistTagType(genre, lmsOptions.bandGenres);
}

function splitMultiples(item) {
    for (var i=0, len=ARTIST_TYPES.length; i<len; ++i) {
        let idsKey = ARTIST_TYPES[i]+"_ids";
        let ids = undefined!=item[idsKey] ? (""+item[idsKey]).split(",") : undefined;

        if (undefined!=ids) {
            item[idsKey] = ids;

            let strings = undefined!=item[ARTIST_TYPES[i]] ? item[ARTIST_TYPES[i]].split(MULTI_SPLIT_REGEX) : undefined;
            if (undefined!=strings && ids.length>0 && ids.length==strings.length) {
                item[ARTIST_TYPES[i]+"_id"]=ids[0];
                item[ARTIST_TYPES[i]] = strings[0];
                if (lmsOptions.showAllArtists) {
                    item[ARTIST_TYPES[i]+"s"] = strings;
                }
            }
        }
    }
}

function itemDuration(item) {
    if (undefined==item.duration) {
        return 0;
    }
    let val = parseFloat(item.duration);
    return val>0 ? val : 0;
}

function openServerSettings(serverName, showHome) {
    bus.$emit('dlg.open', 'iframe', '/material/settings/server/basic.html', TB_SERVER_SETTINGS.title+serverName,
            [{title:i18n('Shutdown'), text:i18n('Stop Logitech Media Server?'), icon:'power_settings_new', cmd:['stopserver'], confirm:i18n('Shutdown')},
             {title:i18n('Restart'), text:i18n('Restart Logitech Media Server?'), icon:'refresh', cmd:['restartserver'], confirm:i18n('Restart')}], showHome);
}

function getYear(text) {
    let rx = /\s\([0-9][0-9][0-9][0-9]\)\s/g;
    let matches = rx.exec(text);
    if (undefined!=matches && 1==matches.length) {
        return matches[matches.length-1].substring(0, 7);
    }
}

function stripLinkTags(s) {
    return !IS_MOBILE && (""+s).indexOf("<obj")>=0 ? s.replace(/(<([^>]+)>)/gi, "") : s;
}

function trackTags() {
    return TRACK_TAGS+(lmsOptions.techInfo ? TECH_INFO_TAGS : "");
}
