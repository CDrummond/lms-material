/**
 * LMS-Material
 *
 * Copyright (c) 2018-2024 Craig Drummond <craig.p.drummond@gmail.com>
 * MIT license.
 */
'use strict';

const LS_PREFIX="lms-material::";
const LMS_LIST_CACHE_PREFIX = "cache:list:";

const RATINGS_START = "<i class=\"rstar\">";
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
    const NATIVE_QPARMS = new Set(["nativeStatus", "nativeColors", "nativePlayer", "nativeUiChanges", "nativeTheme", "nativeCover", "nativePlayerPower", "nativeAccent", "nativeTitlebar", "nativeTextColor", "nativeConnectionStatus"]);
    const BOOL_QPARAMS = new Set(["single", "addpad", "party", "altBtnLayout", "dontTrapBack", "npAutoClose", "setTitle"]);
    const INT_QPARAMS = new Set(["topPad", "botPad", "dlgPad"]);
    const STR_QPARAMS = new Set(["layout", "appSettings", "appQuit", "appLaunchPlayer", "download", "tbarBtns", "tbarBtnsPos", "tbarBtnsStyle", "hidePlayers"]);

    var queryString = window.location.href.substring(window.location.href.indexOf('?')+1);
    var hash = queryString.indexOf('#');
    if (hash>0) {
        queryString=queryString.substring(0, hash);
    }
    var query = queryString.split('&');
    var resp = { actions:[], debug:new Set(), hide:new Set(), dontEmbed:new Set(), layout:undefined, player:undefined, single:false,
        css:undefined, download:'browser', addpad:false, party:false, setTitle:false, expand:[], npRatio:1.33333333, topPad:0, botPad:0, dlgPad:0, tbarBtns:undefined, tbarBtnsPos:'r', tbarBtnsStyle:'gnome',
        nativeStatus:0, nativeColors:0, nativePlayer:0, nativeUiChanges:0, nativeTheme:0, nativeCover:0, nativePlayerPower:0, nativeAccent:0,
        nativeTitlebar:0, nativeTextColor:0, nativeConnectionStatus:0, appSettings:undefined, appQuit:undefined, appLaunchPlayer:undefined, altBtnLayout:IS_WINDOWS, dontTrapBack:false, npAutoClose:true};

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
        } else if (NATIVE_QPARMS.has(kv[0])) {
            resp[kv[0]]=kv[1]=="w" ? 3 : kv[1]=="c" ? 2 : 1;
        } else if ("hide"==kv[0]) {
            var parts = kv[1].split(",");
            for (var j=0, len=parts.length; j<len; ++j) {
                resp.hide.add(parts[j]);
            }
        } else if (STR_QPARAMS.has(kv[0]))  {
            resp[kv[0]]=kv[1];
        } else if ("theme"==kv[0]) {
            var parts = kv[1].split(",");
            setLocalStorageVal('theme', parts[0]);
            if (parts.length>1) {
                setLocalStorageVal('color', parts[1]);
            }
        } else if (BOOL_QPARAMS.has(kv[0])) {
            resp[kv[0]]=kv.length<2 || "true"==kv[1] || "1"==kv[1];
        } else if ("dontEmbed"==kv[0]) {
            var parts = kv[1].split(",");
            for (var j=0, len=parts.length; j<len; ++j) {
                resp.dontEmbed.add(parts[j]);
            }
        } else if ("expand"==kv[0] && kv.length>1) {
            resp.expand=decodeURIComponent(kv[1]).split("/");
        } else if ("npRatio"==kv[0]) {
            resp.npRatio=parseFloat(kv[1]);
        } else if (INT_QPARAMS.has(kv[0])) {
            resp[kv[0]]=parseInt(kv[1]);
        } else if ("dragleft"==kv[0] || "dragright"==kv[0]) {
            let val = parseInt(kv[1]);
            if (val>0) {
                resp[kv[0]]=val;
                document.documentElement.style.setProperty('--window-area-'+kv[0].substr(4), val+'px');
            }
        }
    }
    if (resp.single && !resp.player) {
        resp.single = false;
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

function emitNative(msg, dest) {
    if (2==dest) {
        console.log(msg);
    } else if (3==dest) {
	    try {
            window.webkit.messageHandlers.mskNative.postMessage(msg);
        } catch (e) {
        }
    }
}

function formatTechInfo(item, source, isCurrent) {
    let technical = [];
    // Bit rate should be Xkbps, but sometimes LMS returns 0 (as num or string?)
    // ...so only valid i fmore than 1 char
    if (undefined!=item.bitrate && (""+item.bitrate).length>1) {
        technical.push(item.bitrate);
    }
    if (item.samplesize && parseInt(item.samplesize)>0) {
        technical.push(i18n("%1bit", item.samplesize));
    }
    if (item.samplerate && parseInt(item.samplerate)>100) {
        technical.push((item.samplerate/1000)+"kHz");
    }
    if (undefined!=item.replay_gain) {
        let val = parseFloat(item.replay_gain);
        if (undefined==isCurrent || !isCurrent || (val>0.000001 || val<-0.000001)) {
            technical.push(i18n("%1dB", val.toFixed(2)));
        }
    }
    if (item.type) {
        let bracket = item.type.indexOf(" (");
        let type = bracket>0 ? item.type.substring(0, bracket) : item.type;
        // BBC Sounds has aac@48000Hz, want just aac
        if (type.length>4 && item.samplerate && type.indexOf("@")>2 && type.indexOf("Hz")>4) {
            type = type.split("@")[0];
        }
        type = type.length<=4 ? type.toUpperCase() : type;
        if (technical.indexOf(type)<0 && (undefined==source || (type!=source.text && type!=source.text.replace(/ /g,'')))) {
            technical.push(type);
        }
    }
    return technical.length>0 ? technical.join(', ') : undefined;
}

function formatSeconds(secs, showDays) {
    if (undefined==secs || isNaN(secs)) {
        secs = 0;
    }
    var numSeconds = parseInt(secs, 10)
    var days       = showDays ? Math.floor(numSeconds / (3600*24)) : 0;
    var hours      = showDays ? Math.floor(numSeconds / 3600) % 24 : Math.floor(numSeconds / 3600);
    var minutes    = Math.floor(numSeconds / 60) % 60
    var seconds    = numSeconds % 60

    if (numSeconds<600) {
        return (minutes<1 ? "0" : minutes)+":"+(seconds<10 ? "0" : "")+seconds;
    }
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
    if ((image.startsWith("http://") || image.startsWith("https://")) && !(image.startsWith('/imageproxy') || image.startsWith('imageproxy'))) {
        try {
            var url = new URL(image);
            if (url.hostname.startsWith("192.168.") || url.hostname.startsWith("127.") || url.hostname.endsWith(".local")) {
                return image;
            }
            return '/imageproxy/' + encodeURIComponent(image) + '/image' + (size ? size : LMS_IMAGE_SIZE);
        } catch(e) {
            logError(e);
            return image;
        }
    }

    if (image=="html/images/cover.png") {
        return DEFAULT_COVER;
    }
    if (image=="html/images/radio.png") {
        return DEFAULT_RADIO_COVER;
    }
    if (image=="html/images/works.png") {
        return DEFAULT_WORKS_COVER;
    }
    if (image=="plugins/RandomPlay/html/images/icon.png") {
        return RANDOMPLAY_COVER;
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
        var specs = [LMS_IMAGE_SIZE, LMS_CURRENT_IMAGE_SIZE, LMS_LIST_IMAGE_SIZE, "_50x50_o"];
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

function toggleBrowseImageSize(path, toGrid) {
    if (undefined!=path) {
        let from = toGrid ? LMS_LIST_IMAGE_SIZE : LMS_IMAGE_SIZE;
        let to = toGrid ? LMS_IMAGE_SIZE : LMS_LIST_IMAGE_SIZE;
        if (path.endsWith(from+".png")) {
            return path.replace(from+".png", to+".png");
        }
        if (path.endsWith(from)) {
            return path.replace(from, to);
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

function setElemScrollTop(elem, val) {
    // When using RecycleScroller we need to wait for the next animation frame to scroll, so
    // just do this for all scrolls.
    window.requestAnimationFrame(function () {
        // https://popmotion.io/blog/20170704-manually-set-scroll-while-ios-momentum-scroll-bounces/
        if (elem) {
            elem.style['-webkit-overflow-scrolling'] = 'auto';
            elem.scrollTop=-1==val ? elem.scrollHeight : val;
            elem.style['-webkit-overflow-scrolling'] = 'touch';
        }
    });
}

function setScrollTop(view, val) {
    setElemScrollTop(view.scrollElement, val);
}

function getLocalStorageBool(key, def) {
    let val = undefined
    try {
        val = undefined==window.localStorage ? (window.materialSkinStorage ? window.materialSkinStorage[key] : undefined) : window.localStorage.getItem(LS_PREFIX+key);
    } catch (e) {
    }
    return undefined!=val ? "true" == val : def;
}

function getLocalStorageVal(key, def, checkForBool) {
    let val = undefined;
    try {
        val = undefined==window.localStorage ? (window.materialSkinStorage ? window.materialSkinStorage[key] : undefined) : window.localStorage.getItem(LS_PREFIX+key);
    } catch (e) {
    }
    return undefined!=val ? (checkForBool ? ("true"==val ? 1 : "false"==val ? 0 : val) : val) : def;
}

function setLocalStorageVal(key, val) {
    try {
        if (undefined!=window.localStorage) {
            window.localStorage.setItem(LS_PREFIX+key, val);
            return;
        }
    } catch (e) {
    }
    if (undefined==window.materialSkinStorage) {
        window.materialSkinStorage = {};
    }
    window.materialSkinStorage[key]=val;
}

function removeLocalStorage(key) {
    try {
        if (undefined!=window.localStorage) {
            window.localStorage.removeItem(LS_PREFIX+key);
        }
    } catch (e) {
    }
    if (undefined!=window.materialSkinStorage) {
        delete window.materialSkinStorage[key];
    }
}

function createLink(href, id, oldLink) {
    var newlink = document.createElement("link");
    newlink.setAttribute("rel", "stylesheet");
    newlink.setAttribute("type", "text/css");
    newlink.setAttribute("href", href);
    newlink.setAttribute("id", id);
    if (undefined!=oldLink) {
        var onErr = oldLink.getAttribute("onerror");
        if (onErr!=undefined) {
            newlink.setAttribute("onerror", onErr);
        }
    }
    return newlink;
}

function changeLink(href, id, addIfNotFound) {
    var links = document.getElementsByTagName("link");
    if (undefined==links) {
        return;
    }
    for (var i=0, len=links.length; i<len; ++i) {
        if (links[i].getAttribute("id")==id) {
            if (isEmpty(href)) {
                document.getElementsByTagName("head").item(0).removeChild(links[i]);
            } else {
                if (links[i].getAttribute("href")==href) {
                    return;
                }
                document.getElementsByTagName("head").item(0).replaceChild(createLink(href, id, links[i]), links[i]);
            }
            return;
        }
    }
    if (addIfNotFound) {
        document.getElementsByTagName("head").item(0).appendChild(createLink(href, id));
    }
}

function setRoundCovers(round) {
    changeLink("html/css/covers/" + (round ? "round" : "square") + ".css?r=" + LMS_MATERIAL_REVISION, "covercss");
}


function getElementsByClassName(elem, tagName, clazz){
	var elems = (tagName == "*" && elem.all) ? elem.all : elem.getElementsByTagName(tagName);
	var found = new Array();
	var re = new RegExp("(^|\\s)" + clazz.replace(/\-/g, "\\-") + "(\\s|$)");
	for (var i=0, len=elems.length; i<len; i++) {
		if (re.test(elems[i].className)) {
			found.push(elems[i]);
		}
	}
	return found;
}

window.lastMskTextColors = {top:undefined};
function emitTextColor() {
    if (queryParams.nativeTextColor<1) {
        return;
    }
    if (undefined==window.mskToolbarElem) {
        window.mskToolbarElem=document.getElementById("main-toolbar");
        if (undefined==window.mskToolbarElem) {
            window.setTimeout(function() { emitTextColor(); }, 500);
            return;
        }
    }
    bus.$nextTick(function () {
        let top = undefined;
        if (undefined!=store.state.activeDialog && !store.state.darkUi && store.state.coloredToolbars) {
            let elems = getElementsByClassName(document.documentElement, "nav", "dialog-toolbar");
            top=getComputedStyle(elems.length>0 ? elems[0] : document.documentElement).getPropertyValue("--dialog-toolbar-text-color");
        } else {
            top = getComputedStyle(window.mskToolbarElem).getPropertyValue("--top-toolbar-text-color");
        }
        if (window.lastMskTextColors.top==top) {
            return;
        }
        window.lastMskTextColors.top=top;
        if (1==queryParams.nativeTextColor) {
            try {
                NativeReceiver.updateTextColor(top);
            } catch (e) {
            }
        } else if (queryParams.nativeTextColor>0) {
            emitNative("MATERIAL-TEXTCOLOR\nTOP " + top, queryParams.nativeTextColor);
        }
    });
}

function setTheme(theme, color, clearColorVars) {
    if (theme!=undefined) {
        theme=theme.replace("darker", "dark");
        let t = theme.split('-');
        let variant = t.length>1 && ('colored'==t[t.length-1] || 'standard'==t[t.length-1]) ? t.pop() : 'standard';
        let themeName = t.join('-');

        if (themeName.startsWith("user:")) {
            changeLink("/material/usertheme/" + themeName.substring(5) + "?r=" + LMS_MATERIAL_REVISION, "themecss");
        } else {
            changeLink("html/css/themes/" + themeName + ".css?r=" + LMS_MATERIAL_REVISION, "themecss");
        }
        changeLink("html/css/variant/" + variant + ".css?r=" + LMS_MATERIAL_REVISION, "variantcss");
        emitTextColor();
        if (1==queryParams.nativeTheme) {
            bus.$nextTick(function () {
                try {
                    NativeReceiver.updateTheme(theme);
                } catch (e) {
                }
            });
        } else if (queryParams.nativeTheme>0) {
            emitNative("MATERIAL-THEME\nNAME " + theme, queryParams.nativeTheme);
        }
    }
    if (color!=undefined) {
        if (clearColorVars) {
            document.documentElement.style.removeProperty('--primary-color');
            document.documentElement.style.removeProperty('--pq-current-color');
            document.documentElement.style.removeProperty('--pq-current-album-color');
            document.documentElement.style.removeProperty('--drop-target-color');
            document.documentElement.style.removeProperty('--accent-color');
            document.documentElement.style.removeProperty('--highlight-rgb');
        }
        if (color.startsWith("user:")) {
            changeLink("/material/usercolor/" + color.substring(5) + "?r=" + LMS_MATERIAL_REVISION, "colorcss");
        } else {
            changeLink("html/css/colors/" + color + ".css?r=" + LMS_MATERIAL_REVISION, "colorcss");
        }
    }
}

function setLayout(useDesktop) {
    changeLink("html/css/" + (useDesktop ? "desktop" : "mobile") + ".css?r=" + LMS_MATERIAL_REVISION, "layoutcss");
    if (undefined==queryParams.css) {
        changeLink("/material/customcss/" + (useDesktop ? "desktop" : "mobile"), "customcss");
    }
}

function fixId(id, prefix) {
    var parts = id.split(".");
    if (parts.length>1) {
        parts.shift();
        return prefix + "."+parts.join(".");
    }
    return id;
}

function isVisible(elem) {
    var rect = elem.getBoundingClientRect();
    var viewHeight = Math.max(document.documentElement.clientHeight, window.innerHeight);
    return !(rect.bottom < 0 || rect.top - viewHeight >= 0);
}

function ensureVisible(elem, parent, adjust, attempt) {
    elem.scrollIntoView();
    if (isVisible(elem)) {
        if (undefined!=parent && undefined!=adjust) {
            setElemScrollTop(parent, parent.scrollTop+adjust);
        }
    } else if (undefined==attempt || attempt<15) {
        window.setTimeout(function() {
            ensureVisible(elem, parent, adjust, undefined==attempt ? 1 : attempt+1);
        }, 100);
    }
}

function cacheKey(command, params, start, batchSize) {
    return LMS_LIST_CACHE_PREFIX+LMS_CACHE_VERSION+":"+lmsLastScan+":"+
           (command ? command.join("-") : "") + ":" + (params ? params.join("-") : "") + 
           (command && (command[0]=="artists" || command[0]=="albums") ? (lmsOptions.noGenreFilter ? ":1" : ":0") : "") +
           (command && command[0]=="albums" ? ((!IS_MOBILE || lmsOptions.touchLinks) ? ":1" : ":0") + (lmsOptions.noRoleFilter ? ":1" : ":0") + (lmsOptions.useGrouping ? ":1" : ":0") : "") +
           (command && command[0]=="artists" ? (LMS_P_MAI && lmsOptions.showArtistImages ? ":1" : ":0") : "") +
           ":"+start+":"+batchSize;
}

function clearListCache(force, command) {
    // Delete old local-storage cache
    for (var key in window.localStorage) {
        if (key.startsWith(LS_PREFIX+LMS_LIST_CACHE_PREFIX) &&
            (force ||
             !key.startsWith(LS_PREFIX+LMS_LIST_CACHE_PREFIX+LMS_CACHE_VERSION+":"+lmsLastScan+":") ||
             (undefined!=command && key.indexOf(":"+command+":")>0))) {
            window.localStorage.removeItem(key);
        }
    }
    // Delete IndexedDB cache
    idbKeyval.keys().then(keys => {
        for (var i=0, len=keys.length; i<len; ++i) {
            if (keys[i].startsWith(LMS_LIST_CACHE_PREFIX) &&
                (force ||
                 !keys[i].startsWith(LMS_LIST_CACHE_PREFIX+LMS_CACHE_VERSION+":"+lmsLastScan+":") ||
                 (undefined!=command && key.indexOf(":"+command+":")>0))) {
                idbKeyval.del(keys[i]);
            }
        }
    }).catch(err => {
        canUseCache = false;
    });
}

function ratingString(current, val) {
    let str = "";
    let clzStr = RATINGS_START;
    if (current) {
        let prev=current.indexOf(clzStr);
        if (prev>-1) {
            str = current.substring(0, prev);
        } else {
            str += current;
        }
    }
    let index=Math.ceil(val/10.0);
    return index<=0 ? str : ((isEmpty(str) ? "" : (str+SEPARATOR))+clzStr+RATINGS[index<0 ? 0 : (index>=RATINGS.length ? RATINGS.length-1 : index)]+"</i>");
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

const ADD_LIBRARY_ID = new Set(['artists', 'albums', 'tracks', 'genres', 'years', 'browselibrary', 'custombrowse', 'works']);

function shouldAddLibraryId(command) {
    if (command.command && command.command.length>0) {
        if (ADD_LIBRARY_ID.has(command.command[0])) {
            return true;
        }
        if (command.command[0]=="playlistcontrol") {
            var lists =["command", "params"];
            for (var l=0, llen=lists.length; l<llen; ++l) {
                var list=command[lists[l]];
                for (var i=0, len=list.length; i<len; ++i) {
                    if (list[i].startsWith("artist_id:") || list[i].startsWith("album_id:") || list[i].startsWith("track_id:") ||
                        list[i].startsWith("genre_id:") || list[i].startsWith("year:") || list[i].startsWith("playlist_id:") ||
                        list[i].startsWith("work_id:")) {
                        return true;
                    }
                }
            }
        }
    }
    return false;
}

function addPart(str, part) {
    return str ? (part ? str+SEPARATOR+part : str) : part;
}

function commandGridKey(command, item) {
    return command.command[command.command[0]=="material-skin" && command.command.length>1 ? 1 : 0]+
           (undefined==item || undefined==item.type || undefined!=item.stdItem || item.id.startsWith(MUSIC_ID_PREFIX) || item.id.startsWith(TOP_ID_PREFIX) ? "" : ("-"+item.type))+
           "-grid";
}

const USE_LIST_VIEW_BY_DEFAULT=new Set(["podcasts-grid", "youtube-grid", "playhistory-grid", "rndmix-grid"]);

function isSetToUseGrid(command, item) {
    var key = commandGridKey(command, item);
    return getLocalStorageBool(key, !USE_LIST_VIEW_BY_DEFAULT.has(key))
}

function setUseGrid(command, use, item) {
    setLocalStorageVal(commandGridKey(command, item), use);
}

function forceItemUpdate(vm, item) {
    var prev = item.title;
    item.title = "XX"+item.title;
    vm.$nextTick(function () {
        item.title = prev;
    });
}

function mapArtistIcon(item) {
    item.icon=undefined;
    item.svg="artist";
    let field = getField(item, "role_id:");
    if (field>=0) {
        let roleStr = item.params[field].split(':')[1];
        let roleInt = parseInt(roleStr);
        if (isNaN(roleInt)) {
            item.svg = "role-"+roleStr.toLowerCase();
        } else {
            let pos = ARTIST_TYPE_IDS.indexOf(roleInt==TRACK_ARTIST_ROLE ? ARTIST_ROLE : roleInt);
            if (pos>=0) {
                item.svg = "role-"+ARTIST_TYPES[pos];
            }
        }
    }
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

const COMMA_REPLACEMENT = "__COMMA__";
function splitConfigString(str) {
    return str.split("\r").join("").split("\n").join(",").replace("\\,", COMMA_REPLACEMENT).split(",").map(function(itm) { return itm.trim().replace(COMMA_REPLACEMENT, ",") });
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

function getParamVal(item, field, defVal) {
    let idx = getIndex(item.params, field);
    return -1==idx ? defVal : item.params[idx].split(':')[1]
}

function setFontSize(sz) {
    let std = 15;
    let small = 13;
    switch(sz) {
    case 'l':
        std = 17;
        small = 15;
        break;
    case 'r':
        break;
    case 's':
        std = 13;
        small = 11;
        break;
    }

    document.documentElement.style.setProperty('--std-font-size', std+'px');
    document.documentElement.style.setProperty('--small-font-size', small+'px');
}

var lastShortcut={key:undefined, modifier:undefined, time:undefined};
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

function unbindKey(key, modifier) {
    Mousetrap.unbind((undefined==modifier ? "" : (modifier+"+")) + key.toLowerCase());
}

function shortcutStr(key, shift, alt) {
    if (key.length>1) {
        if (key=="left") {
            key = "◁";
        } else if (key=="right") {
            key = "▷";
        } else if (key=="up") {
            key = "△";
        } else if (key=="down") {
            key = "▽";
        } else if (key=="space") {
            return i18n("Spacebar");
        } else if (key=="esc") {
            return i18n("Esc");
        } else if (key=="home") {
            return i18n("Home");
        }
    }
    if (alt) {
        return IS_APPLE ? ("⌥+"+key) : i18n("Alt+%1", key);
    }
    if (shift) {
        return IS_APPLE ? i18n("⌘+Shift+%1", key) : i18n("Ctrl+Shift+%1", key);
    }
    return IS_APPLE ? i18n("⌘+%1", key) : i18n("Ctrl+%1", key);
}

function ttShortcutStr(str, key, shift, alt) {
    return undefined==key || IS_MOBILE ? str : (str+SEPARATOR+shortcutStr(key, shift, alt));
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

function rgb2Hex(rgb) {
    let hex="#";
    for (let i=0; i<3; ++i) {
        let hv = Math.round(rgb[i]).toString(16);
        hex += (hv.length==1 ? "0" : "") + hv;
    }
    return hex;
}

function hex2Rgb(hx) {
    let step = hx.length>4 ? 2 : 1;
    let rgb=[]
    for (let p=0; p<3; ++p) {
        rgb.push(parseInt("0x"+hx.substr(1+(p*step), step, 16)));
    }
    return rgb;
}

let lastToolbarColors = {top: undefined, bot:undefined};
function emitToolbarColors(top, bot, tries) {
    if (undefined==window.mskToolbarElem && store.state.tinted && store.state.cMixSupported) {
        window.mskToolbarElem=document.getElementById("main-toolbar");
        if (undefined==window.mskToolbarElem) {
            window.setTimeout(function() { emitToolbarColors(top, bot, tries); }, 500);
            return;
        }
    }
    // screen saver passes undefined for both top and bot whn its on => use black as colour.
    let t = undefined==top ? '#000000' : getComputedStyle(window.mskToolbarElem ? window.mskToolbarElem : document.documentElement).getPropertyValue(top);
    let b = undefined==bot ? '#000000' : getComputedStyle(document.documentElement).getPropertyValue(bot);
    if (t.startsWith('color-mix(')) {
        let parts = t.split(" ");
        let ca = hex2Rgb(parts[2].replace(",", ""));
        let cb = hex2Rgb(parts[3]);
        let pc = parseFloat(parts[4].replace("%", ""))/100.0;
        let mixed = [];
        for (let i=0; i<3; ++i) {
            mixed.push( Math.ceil((ca[i]*(1.0-pc))+(cb[i]*pc)) );
        }
        t = rgb2Hex(mixed);
    }
    if (t!=lastToolbarColors.top || b!=lastToolbarColors.bot) {
        if (undefined==t || 0==t.length || undefined==b || 0==b.length) {
            if (undefined==tries || tries<20) {
                setTimeout(function() { emitToolbarColors(top, bot, undefined==tries ? 1 : (tries+1)); }, 100);
            }
            return;
        }
        let tc = document.querySelector('meta[name="theme-color"]');
        if (tc!=null) {
            tc.setAttribute('content',  t);
        }
        lastToolbarColors={top:t, bot:b};
        if (1==queryParams.nativeColors) {
            bus.$nextTick(function () {
                try {
                    NativeReceiver.updateToolbarColors(lastToolbarColors.top, lastToolbarColors.bot);
                } catch (e) {
                }
            });
        } else if (queryParams.nativeColors>0) {
            emitNative("MATERIAL-COLORS\nTOP " + lastToolbarColors.top + "\nBOTTOM " + lastToolbarColors.bot, queryParams.nativeColors);
        }
    }
}

const FULLSCREEN_DIALOGS = new Set(["uisettings", "playersettings", "info", "iframe", "manage"]);
function emitToolbarColorsFromState(state, force) {
    if (0!=queryParams.nativeColors || COLOR_USE_FROM_COVER==state.colorUsage || state.coloredToolbars || (state.tinted && state.cMixSupported) || force) {
        let topColorVar = "--top-toolbar-color";
        let botColorVar = "--bottom-toolbar-color";
        for (var i=state.openDialogs.length; i>=0; --i) {
            if (FULLSCREEN_DIALOGS.has(state.openDialogs[i])) {
                topColorVar = "--dialog-toolbar-color";
                botColorVar = "--background-color";
                break;
            }
        }
        emitToolbarColors(topColorVar, botColorVar);
    }
}

function formatTrackNum(item) {
    let t = parseInt(item.tracknum);
    let d = item.disccount && item.disc && parseInt(item.disccount)>1 ? parseInt(item.disc) : undefined;
    return (undefined==d ? "" : (d+".")) + (t>9 ? t : ("0" + t));
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

function getClickPos(ev) {
    if (undefined==ev) {
        return undefined;
    }
    let clickX = ev['pageX'] || ev.clientX;
    if (clickX==undefined && ev.touches) {
        clickX = ev.touches[0].pageX;
    }
    let clickY = ev['pageY'] || ev.clientY;
    if (clickY==undefined && ev.touches) {
        clickY = ev.touches[0].pageY;
    }
    return {x:clickX, y:clickY};
}

function useArtistTagType(item, tagGenres) {
    return (item.remote && undefined==item.genre && (undefined==item.genres || (Array.isArray(item.genres) && item.genres.length<1))) ||
           (LMS_VERSION<90001 &&
              ((1==tagGenres.size && tagGenres.has('*')) ||
               (item.genres && Array.isArray(item.genres) && item.genres.some(g => tagGenres.has(g)) ||
               (!item.genres && item.genre && tagGenres.has(item.genre)))));
}

function useComposer(item) {
    return item.isClassical || 2==lmsOptions.showComposer || useArtistTagType(item, lmsOptions.composerGenres);
}

function useConductor(item) {
    return item.isClassical || useArtistTagType(item, lmsOptions.conductorGenres);
}

function useBand(item) {
    return item.isClassical || useArtistTagType(item, lmsOptions.bandGenres);
}

function splitIntArray(val) {
    return undefined==val ? val : Array.isArray(val) ? val.map(Number) : (""+val).split(",").map(function(itm) { return itm.trim() }).map(Number);
}

function splitStringArray(val, plainSep) {
    return undefined==val || Array.isArray(val) ? val : (""+val).split(plainSep ? "," : MULTI_SPLIT_REGEX).map(function(itm) { return itm.trim() });
}

function splitMultiple(item, typeKey, idsKey, isGenre) {
    let ids = splitIntArray(item[idsKey]);
    let strings = undefined;
    if (undefined!=ids) {
        if (1==ids.length && undefined!=item[typeKey]) {
            return [ids, [item[typeKey]]]
        }
        let vals = splitStringArray(item[typeKey], isGenre);
        if (undefined!=vals && ids.length>0 && ids.length==vals.length) {
            strings = vals;
        }
    }
    return [ids, strings];
}

function splitMultiples(item, withGenre) {
    let types=withGenre ? ["genre"].concat(ARTIST_TYPES) : ARTIST_TYPES;
    for (var i=0, len=types.length; i<len; ++i) {
        let isGenre = types[i]=="genre";
        let typeKey = undefined!=item[types[i]+"s"] ? types[i]+"s" : types[i];
        let idsKey = types[i]+"_ids";
        let vals = splitMultiple(item, typeKey, idsKey, isGenre);
        let ids = vals[0];
        let strings = vals[1];
        if (undefined!=ids) {
            item[idsKey] = ids;
            if (undefined!=strings) {
                item[types[i]+"_id"]=ids[0];
                item[types[i]] = strings[0];
                item[types[i]+"s"] = strings;
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

function stripLinkTags(s) {
    return (!IS_MOBILE || lmsOptions.touchLinks) && (""+s).indexOf("<obj")>=0 ? s.replace(/(<([^>]+)>)/gi, "") : s;
}

function replaceBr(str, rep) {
    return isEmpty(str) ? str : str.replace(/\s?(<br\s?\/?>)\s?/g, rep);
}

function stripTags(str) {
    return isEmpty(str) ? str : str.replace('<br/>', '\n').replace(/<\/?[^>]+(>|$)/g, "");
}

function replaceHtmlBrackets(str){
    return isEmpty(str) ? str : str.replace(/</g, '\ufe64').replace(/>/g, '\ufe65');
}

function revertHtmlBrackets(str){
    return isEmpty(str) ? str : str.replace(/\ufe64/g, '<').replace(/\ufe65/g, '>');
}

function makeHtmlSafe(i) {
    if (undefined!=i) {
        for (let v=0, len=STRING_ITEM_PROPS.length; v<len; ++v) {
            let p = STRING_ITEM_PROPS[v];
            if (undefined!=i[p]) {
                i[p] = replaceHtmlBrackets(i[p]);
            }
        }
    }
    return i;
}

function trackTags(withCover) {
    return TRACK_TAGS+(lmsOptions.techInfo ? TECH_INFO_TAGS : "")+(withCover ? 'c' : "");
}

function trackTitle(i) {
    return undefined==i.work || i.title.toLowerCase().replace(/\W/g, '').includes(i.work.toLowerCase().replace(/\W/g, '')) ? i.title : i.work+SEPARATOR+i.title;
}

if (!String.prototype.replaceAll) {
    String.prototype.replaceAll = function(str, newStr) {
        let idx = 0;
        let len = str.length;
        let updated = this;
        for (;;) {
            idx = updated.indexOf(str, idx);
            if (idx<0) {
                break;
            }
            updated = updated.substring(0, idx) + newStr + updated.substring(idx + len);
        }
        return updated;
    };
}

function intersect(a, b) {
    let res = new Set();
    for (const itm of a) {
        if (b.has(itm)) {
            res.add(itm);
        }
    }
    return res;
}

let lastTbMouseDown=undefined;
function toolbarMouseDown(ev) {
    if (0==queryParams.nativeTitlebar || lmsNumVisibleMenus>0 || undefined==ev || undefined==ev.target || ev.button!=0 ||
        undefined==ev.target.parentElement || undefined==ev.target.parentElement.id || ev.target.parentElement.id.indexOf("-toolbar")<=0) {
        return;
    }
    let now = new Date().getTime();
    let toggleMax=undefined!=lastTbMouseDown && now-lastTbMouseDown<=LMS_DOUBLE_CLICK_TIMEOUT;
    lastTbMouseDown = now;
    if (1==queryParams.nativeTitlebar) {
        try { NativeReceiver.titlebarPressed(toggleMax); } catch (e) { }
    } else if (queryParams.nativeTitlebar>0) {
        emitNative("MATERIAL-TITLEBAR\nNAME " + (toggleMax ? "max" : "move"), queryParams.nativeTitlebar);
    }
}

function timeStr(date, lang) {
    return date.toLocaleTimeString(lang, { hour: 'numeric', minute: 'numeric', hour12:lmsOptions.time12hr });
}

function dateStr(date, lang) {
    return date.toLocaleDateString(lang, { weekday: 'short', month: 'short', day: 'numeric', year: undefined }).replace(", ", "  ");
}

function canClickItem(item) {
    return (item.style && item.style.startsWith('item') && item.style!='itemNoAction') ||
            undefined!=item.weblink ||
            // Some items have style=itemNoAction, but we have an action??? DynamicPlaylists...
            (/*!item.style &&*/ ( (item.actions && (item.actions.go || item.actions.do)) || item.nextWindow || item.params /*CustomBrowse*/));
}

function roleIntValue(val) {
    let lower = (""+val).toLowerCase();
    let idx = ARTIST_TYPES.indexOf(lower);
    return idx>=0 && idx<ARTIST_TYPES.length
        ? ARTIST_TYPE_IDS[idx]
        : isNaN(lower) ? 0 : parseInt(lower);
}

function addBrowserHistoryItem() {
    if (!queryParams.dontTrapBack && window.mskHistoryLen<200) {
        window.history.pushState({ }, '' );
    }
}

function updateBgndImage(view, url) {
    if (url!=view.currentBgndUrl) {
        view.currentBgndUrl = url;
        if (IS_IOS) {
            view.showBgnd = false;
            setTimeout(function() { view.showBgnd = true; }, 50);
        }
    }
}

function albumGroupingType(discCount, groupCount, contiguousGroups, parentIsWork) {
    let multiDisc = lmsOptions.groupdiscs && undefined!=discCount && parseInt(discCount)>1;
    let multiGroup = undefined!=groupCount && parseInt(groupCount)>1 && (undefined==contiguousGroups || 1==parseInt(contiguousGroups));
    return multiGroup && (lmsOptions.useGrouping || !multiDisc || parentIsWork)
        ? MULTI_GROUP_ALBUM
        : multiDisc
            ? MULTI_DISC_ALBUM
            : 0;
}