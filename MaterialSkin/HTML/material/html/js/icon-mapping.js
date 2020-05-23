/**
 * LMS-Material
 *
 * Copyright (c) 2018-2020 Craig Drummond <craig.p.drummond@gmail.com>
 * MIT license.
 */
'use strict';

var iconMap = {};
var playerIcons = {};

function getMiscJson(item, name) {
    let cfg = getLocalStorageVal("misc-"+name);
    if (undefined!=cfg) {
        try {
            let data = JSON.parse(cfg);
            if (undefined!=data) {
                for (let [key, value] of Object.entries(data)) {
                    item[key]=value;
                }
            }
        } catch(e) { }
    }

    if (item['material-version']!=LMS_MATERIAL_REVISION) {
        axios.get("html/misc/"+name+".json?r=" + LMS_MATERIAL_REVISION).then(function (resp) {
            let data = eval(resp.data);
            data['material-version']=LMS_MATERIAL_REVISION;
            for (let [key, value] of Object.entries(data)) {
                item[key]=value;
            }
            setLocalStorageVal("misc-"+name, JSON.stringify(item));
        }).catch(err => {
            window.console.error(err);
        });
    }
}

function initIconMap() {
    getMiscJson(playerIcons, "player-icons");
    getMiscJson(iconMap, "icon-map");
}

function mapPlayerIcon(player) {
    if (undefined!=playerIcons) {
        let model = playerIcons[player.model];
        if (undefined!=model) {
            if (undefined!=model['icon'] || undefined!=model['svg']) {
                return model;
            }
            if (undefined!=model[player.modelname]) {
                return model[player.modelname];
            }
            if (undefined!=model['mac']) {
                for (let i=0, len=model['mac'].length; i<len; ++i) {
                    if (model['mac'][i]['starts'] && player.playerid.startsWith(model['mac'][i]['starts'])) {
                        return model['mac'][i];
                    }
                }
            }
            if (undefined!=player.firmware && undefined!=model['firmware']) {
                for (let i=0, len=model['firmware'].length; i<len; ++i) {
                    if (model['firmware'][i]['ends'] && player.firmware.endsWith(model['firmware'][i]['ends'])) {
                        return model['firmware'][i];
                    }
                }
            }
        }
    }

    return {icon:"speaker"};
}

function mapIconType(item, app, type) {
    let lmsIcon = item[type];
    if (undefined==lmsIcon || (typeof lmsIcon !== 'string')) {
        return false;
    }
    for (const [key, value] of Object.entries(iconMap["endsWith"])) {
        if (lmsIcon.endsWith(key)) {
            let entry = undefined!=app && undefined!=value[app] ? value[app] : value;
            if (entry['icon']) {
                item.image=item[value]=item.svg=undefined; item.icon=entry['icon'];
            } else if (entry['svg']) {
                item.image=item[value]=item.icon=undefined; item.svg=entry['svg'];
            }
            return true;
        }
    }
    for (const [key, value] of Object.entries(iconMap["indexOf"])) {
        if (lmsIcon.indexOf(key)>0) {
            let entry = undefined!=app && undefined!=value[app] ? value[app] : value;
            if (entry['icon']) {
                item.image=item[value]=item.svg=undefined; item.icon=entry['icon'];
            } else if (entry['svg']) {
                item.image=item[value]=item.icon=undefined; item.svg=entry['svg'];
            }
            return true;
        }
    }
    return false;
}

function mapIcon(item, app, fallback) {
    if (undefined==iconMap) {
        return false;
    }
    if (mapIconType(item, app, "icon-id")) {
        return true;
    }
    if (mapIconType(item, app, "icon")) {
        return true;
    }
    if (item.image && item.image.startsWith("html/images/") && mapIconType(item, app, "image")) {
        return true;
    }
    if (undefined!=fallback) {
        item.icon=fallback.icon; item.svg=fallback.svg; item.image=undefined;
        return true;
    }
    return false;
}
