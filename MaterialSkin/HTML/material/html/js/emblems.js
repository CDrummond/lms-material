/**
 * LMS-Material
 *
 * Copyright (c) 2018-2020 Craig Drummond <craig.p.drummond@gmail.com>
 * MIT license.
 */
'use strict';

var emblems = [];

function initEmblems() {
    axios.get("html/misc/emblems.json?r=" + LMS_MATERIAL_REVISION).then(function (resp) {
        emblems = eval(resp.data);
    }).catch(err => {
        window.console.error(err);
    });
}

function getEmblem(extid) {
    if (undefined!=extid) {
        for (let i=0, len=emblems.length; i<len; ++i) {
            if (extid.indexOf(emblems[i].extid)>=0) {
                return emblems[i];
            }
        }
    }
    return undefined;
}
