/*
 * LMS-Material
 *
 * Copyright (c) 2018 Craig Drummond <craig.p.drummond@gmail.com>
 * MIT license.
 */
 
var bus = new Vue();

function formatSeconds(secs) {
    var sec_num = parseInt(secs, 10)    
    var hours   = Math.floor(sec_num / 3600) % 24
    var minutes = Math.floor(sec_num / 60) % 60
    var seconds = sec_num % 60
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

function resolveImage(icon, image) {
    if (!icon && !image) {
        return null;
    }
    if (image) {
        if (image.includes("://") && !(image.startsWith('/imageproxy') || image.startsWith('imageproxy'))) {
            return icon;
        }
        if (image.startsWith("/")) {
            return lmsServerAddress+image; //+"/image_100x100_o";
        }
        return lmsServerAddress+"/"+image; //+"/image_100x100_o";
    }
    if (icon.includes("://") && !(icon.startsWith('/imageproxy') || icon.startsWith('imageproxy'))) {
        return icon;
    }
    if (icon.startsWith("/")) {
        return lmsServerAddress+icon.replace(".png", "_50x50.png");
    }
    return lmsServerAddress+"/"+icon.replace(".png", "_50x50.png");
}

