/**
 * LMS-Material
 *
 * Copyright (c) 2018-2020 Craig Drummond <craig.p.drummond@gmail.com>
 * MIT license.
 */
'use strict';

var iconMap = {};

function initIconMap() {
    axios.get("html/misc/icon-map.json?r=" + LMS_MATERIAL_REVISION).then(function (resp) {
        iconMap = eval(resp.data);
    }).catch(err => {
        window.console.error(err);
    });
}

function mapIconType(item, type) {
    let lmsIcon = item[type];
    if (undefined==lmsIcon || (typeof lmsIcon !== 'string')) {
        return false;
    }
    for (const [key, value] of Object.entries(iconMap["endsWith"])) {
        if (lmsIcon.endsWith(key)) {
            if (value['icon']) {
                item.image=item[value]=item.svg=undefined; item.icon=value['icon'];
            } else if (value['svg']) {
                item.image=item[value]=item.icon=undefined; item.svg=value['svg'];
            }
            return true;
        }
    }
    for (const [key, value] of Object.entries(iconMap["indexOf"])) {
        if (lmsIcon.indexOf(key)>0) {
            if (value['icon']) {
                item.image=item[value]=item.svg=undefined; item.icon=value['icon'];
            } else if (value['svg']) {
                item.image=item[value]=item.icon=undefined; item.svg=value['svg'];
            }
            return true;
        }
    }
    return false;
}

function mapIcon(item, fallbackIcon, fallbackSvg) {
    if (mapIconType(item, "icon-id")) {
        return true;
    }
    if (mapIconType(item, "icon")) {
        return true;
    }
    if (item.image && item.image.startsWith("html/images/") && mapIconType(item, "image")) {
        return true;
    }
    if (undefined!=fallbackIcon) {
        item.icon=fallbackIcon; item.svg=fallbackSvg; item.image=undefined;
        return true;
    }
    return false;
}
