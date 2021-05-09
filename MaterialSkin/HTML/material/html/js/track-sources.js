/**
 * LMS-Material
 *
 * Copyright (c) 2018-2021 Craig Drummond <craig.p.drummond@gmail.com>
 * MIT license.
 */
'use strict';

var trackSources = {};
function initTrackSources() {
    getMiscJson(trackSources, "track-sources");
}

function getTrackSource(track) {
    if (undefined!=track.url) {
    console.log(track.url);
        if (track.url.startsWith("file:") && !track.url.startsWith("tmp:")) {
            return i18n("Local");
        }
        for (const [key, value] of Object.entries(trackSources["prefix"])) {
            if (track.url.startsWith(key)) {
                return value;
            }
        }
        if (track.url.startsWith("http:") || track.url.startsWith("https:")) {
            for (const [key, value] of Object.entries(trackSources["includes"])) {
                if (track.url.includes(key)) {
                    return value;
                }
            }
            if (undefined!=track.album) {
                for (const [key, value] of Object.entries(trackSources["album"])) {
                    if (track.album.includes(key)) {
                        return value;
                    }
                }
            }
        }
        return i18n("Internet/Other");
    }
    return undefined;
}
