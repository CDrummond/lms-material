/**
 * LMS-Material
 *
 * Copyright (c) 2018 Craig Drummond <craig.p.drummond@gmail.com>
 * MIT license.
 */
 
var bus = new Vue();

function logError(err) {
    console.error("[" + new Date()+"] " + err);
    console.trace();
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

function resolveImage(icon, image, size) {
    if (!icon && !image) {
        return null;
    }
    if (image) {
        if (image.includes("://") && !(image.startsWith('/imageproxy') || image.startsWith('imageproxy'))) {
            return image;
        }
        if (image.startsWith("/")) {
            return lmsServerAddress+image+(size ? size : "");
        }
        return lmsServerAddress+"/"+image+(size ? size : "");
    }
    if (icon.includes("://") && !(icon.startsWith('/imageproxy') || icon.startsWith('imageproxy'))) {
        return icon;
    }
    
    var idx = icon.lastIndexOf(".png");
    if (idx>0) {
        icon = icon.substring(0, idx)+(size ? size : LMS_LIST_IMAGE_SIZE)+".png";
    }
    if (icon.startsWith("/")) {
        return lmsServerAddress+icon;
    }
    if (idx<0 && /^[0-9a-fA-F]+$/.test(icon)) {
        icon="music/"+icon+"/cover"+(size ? size : LMS_LIST_IMAGE_SIZE);
    }
    return lmsServerAddress+"/"+icon;
}

function titleSort(a, b) {
    var titleA = a.title.toUpperCase();
    var titleB = b.title.toUpperCase();
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

function setScrollTop(el, val) {
    // https://popmotion.io/blog/20170704-manually-set-scroll-while-ios-momentum-scroll-bounces/
    el.style['-webkit-overflow-scrolling'] = 'auto';
    el.scrollTop=val;
    el.style['-webkit-overflow-scrolling'] = 'touch';
}

const LS_PREFIX="lms-material::";

function getLocalStorageBool(key, def) {
    var val = localStorage.getItem(LS_PREFIX+key);
    return undefined!=val ? "true" == val : def;
}

function getLocalStorageVal(key, def) {
    var val = localStorage.getItem(LS_PREFIX+key);
    return undefined!=val ? val : def;
}

function setLocalStorageVal(key, val) {
    localStorage.setItem(LS_PREFIX+key, val);
}

function isMobile() {
    return navigator.userAgent.indexOf("Mobile") !== -1 ||
           navigator.userAgent.indexOf("iPhone") !== -1 ||
           navigator.userAgent.indexOf("Android") !== -1 ||
           navigator.userAgent.indexOf("Windows Phone") !== -1;
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

function changeLayout(layout) {
    if (lmsServerAddress.length>0) {
        window.location.href = layout + ".html?lms="+lmsServerAddress.replace("http://", "").replace(":9000", "");
    } else {
        window.location.href = layout;
    }
}

function serverSettings(page) {
    window.open((lmsServerAddress.length>0 ? lmsServerAddress : '..') + '/Default/settings/index.html' + (page ? '?activePage='+page : ''), '_blank');
}

function addUniqueness(id, uniqueness) {
    return id+"?"+uniqueness;
}

function removeUniqueness(id) {
    return id.split("?")[0];
}

function setBgndCover(elem, coverUrl, isDark) {
    if (elem) {
        elem.style.backgroundColor = isDark ? "#424242" : "#fff";
        elem.style.backgroundImage = "url('"+(undefined==coverUrl || coverUrl.endsWith(DEFAULT_COVER) || coverUrl.endsWith("/music/undefined/cover")
                                              ? undefined : coverUrl)+"')";
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

function adjustVolume(vol, inc) {
    if (inc) {
        // Always send volume up, even if at 100% already. Some users trap LMS
        // volume commands and forward on
        return Math.floor((vol+LMS_VOLUME_STEP)/LMS_VOLUME_STEP)*LMS_VOLUME_STEP;
    }

    if (vol<=LMS_VOLUME_STEP) {
        return 0;
    }

    var adj = Math.floor(vol/LMS_VOLUME_STEP)*LMS_VOLUME_STEP;
    // If rounding down to LMS_VOLUME_STEP is 2% (or more) then use that, else make even lower
    if ((vol-adj)>=2) {
        return adj;
    }
    return Math.floor((vol-LMS_VOLUME_STEP)/LMS_VOLUME_STEP)*LMS_VOLUME_STEP;
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
        if ("lms"==kv[0]) {
            lmsServerAddress = "http://"+kv[1]+":9000";
        } else if ("player"==kv[0]) {
            setLocalStorageVal("player", kv[1]);
        }
    }
}

function isLandscape() {
    return window.innerWidth > window.innerHeight;
}

function isWide() {
    return window.innerWidth>=900;
}

function incrementVolume() {
    bus.$emit("adjustVolume", true);
}

function decrementVolume() {
    bus.$emit("adjustVolume", false);
}

