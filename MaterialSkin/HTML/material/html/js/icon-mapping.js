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
            if (undefined!=model['icon']) {
                return {icon:model['icon']};
            }
            if (undefined!=model['svg']) {
                return {svg:model['svg']};
            }
            if (undefined!=model['mac']) {
                let mac=player.playerid.substring(0, 6);
                if (undefined!=model['mac'][mac]) {
                    if (undefined!=model['mac'][mac]['icon']) {
                        return {icon:model['mac'][mac]['icon']};
                    }
                    if (undefined!=model['mac'][mac]['svg']) {
                        return {svg:model['mac'][mac]['svg']};
                    }
                }
            }
            if (undefined!=model[player.modelname]) {
                let name = model[player.modelname];
                if (undefined!=name['icon']) {
                    return {icon:name['icon']};
                }
                if (undefined!=name['svg']) {
                    return {svg:name['svg']};
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
