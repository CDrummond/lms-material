/**
 * LMS-Material
 *
 * Copyright (c) 2018-2023 Craig Drummond <craig.p.drummond@gmail.com>
 * MIT license.
 */
'use strict';

var emblems = {};

function initEmblems() {
    getMiscJson(emblems, "emblems");
}

function getEmblem(extid) { //, url) {
    if (undefined!=extid) {
        return emblems[ extid.split(':')[0] ];
    }
    //if (undefined!=url) {
    //    return getEmblem(url.split(':')[0]);
    //}
    return undefined;
}
