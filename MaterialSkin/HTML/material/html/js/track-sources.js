/**
 * LMS-Material
 *
 * Copyright (c) 2018-2024 Craig Drummond <craig.p.drummond@gmail.com>
 * MIT license.
 */
'use strict';

var trackSources = {};
var lmsProtocols = {};

function initTrackSources() {
    getMiscJson(trackSources, "track-sources");
    lmsCommand("", ["material-skin", "protocols"]).then(({data}) => {
        logJsonMessage("RESP", data);
        if (data && data.result && data.result.protocols_loop) {
            for (var i=0, loop=data.result.protocols_loop, len=loop.length; i<len; ++i) {
                lmsProtocols[loop[i].scheme]=loop[i].plugin;
            }
        }
    });
}

function getTrackSource(track) {
    if (undefined!=track.url) {
        if (track.url.startsWith("file:") && !track.url.startsWith("tmp:")) {
            return {other:true, text:i18n("Local"), context:true};
        }
        for (const [key, value] of Object.entries(trackSources["prefix"])) {
            if (track.url.startsWith(key)) {
                if (undefined!=value.url) {
                    if (undefined!=value.url.from) {
                        let param = value.url.useextid ? track.extid : track.url;
                        let srvUrl = param ? param.replace(value.url.from, value.url.to) : undefined;
                        if (value.url.removeext) {
                            let parts = srvUrl.split('.');
                            parts.pop();
                            srvUrl = parts.join('.');
                        }
                        return {other:false, text:value.name, url:srvUrl, context:value.context, extid:value.extid};
                    } if (undefined!=value.url.prefix) {
                        let parts = track.url.split(value.url.split.on);
                        if (parts.length>value.url.split.use) {
                            return {other:false, text:value.name, url:value.url.prefix+parts[value.url.split.use], context:value.context, extid:value.extid};
                        }
                    }
                }
                return {other:false, text:value.name, context:value.context, extid:value.extid};
            }
        }
        for (const [key, value] of Object.entries(lmsProtocols)) {
            if (track.url.startsWith(key+":")) {
                return {other:false, text:value};
            }
        }
        if (track.url.startsWith("http:") || track.url.startsWith("https:")) {
            for (const [key, value] of Object.entries(trackSources["includes"])) {
                if (track.url.includes(key)) {
                    return {other:false, text:value.name, context:value.context, extid:value.extid};
                }
            }
            if (undefined!=track.album) {
                for (const [key, value] of Object.entries(trackSources["album"])) {
                    if (track.album.includes(key)) {
                        return {other:false, text:value.name, context:value.context, extid:value.extid};
                    }
                }
            }
        }
        return {other:true, text:i18n("Internet/Other")};
    }
    return undefined;
}
