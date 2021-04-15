/**
 * LMS-Material
 *
 * Copyright (c) 2018-2021 Craig Drummond <craig.p.drummond@gmail.com>
 * MIT license.
 */
'use strict';

var emblems = {};

function initEmblems() {
    getMiscJson(emblems, "emblems");
}

function getEmblem(extid) {
return emblems['spotify'];
    if (undefined!=extid) {
        return emblems[ extid.split(':')[0] ];
    }
    return undefined;
}
