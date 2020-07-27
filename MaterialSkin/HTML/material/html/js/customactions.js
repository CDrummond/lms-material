/**
 * LMS-Material
 *
 * Copyright (c) 2018-2020 Craig Drummond <craig.p.drummond@gmail.com>
 * MIT license.
 */
'use strict';

var customActions = undefined;

function initCustomActions() {
    axios.get("/material/customactions.json?r=" + LMS_MATERIAL_REVISION).then(function (resp) {
        customActions = eval(resp.data);
        bus.$emit('customActions');
    }).catch(err => {
        window.console.error(err);
    });
}

function getSectionActions(section, actions, lockedActions) {
    if (customActions[section]) {
        for (let i=0, sect=customActions[section], len=sect.length; i<len; ++i) {
            if (lockedActions || !sect[i].locked) {
                actions.push(sect[i]);
            }
        }
    }
}

function getCustomActions(id, lockedActions) {
    let actions = [];
    if (customActions) {
        if (undefined==id) {
            getSectionActions('system', actions, lockedActions);
        } else if (id.endsWith('-dialog')) {
            getSectionActions(id, actions, lockedActions);
        } else {
            getSectionActions('allplayers', actions, lockedActions);
            getSectionActions(id, actions, lockedActions);
        }
    }
    return actions.length>0 ? actions : undefined;
}

function performCustomAction(obj, action, player, track) {
    if (undefined!=action.prompt) {
        confirm(action.prompt, i18n('Yes')).then(res => {
            if (res) {
                doCustomAction(action, player, track);
            }
        });
    } else {
        doCustomAction(action, player, track);
    }
}

function doReplacements(string, player, track) {
    let val = ''+string;
    if (undefined!=player) {
        val=val.replace("$ID", player.id).replace("$NAME", player.name);
    }
    if (undefined!=track) {
        if (undefined!=track.artist_id) {
            val=val.replace("$ARTISTID", track.artist_id);
        }
        if (undefined!=track.album_id) {
            val=val.replace("$ALBUMID", track.album_id);
        }
        if (undefined!=track.id) {
            val=val.replace("$TRACKID", track.id);
        }
        if (undefined!=track.artist) {
            val=val.replace("$ARTISTNAME", track.artist);
        }
        if (undefined!=track.album_id) {
            val=val.replace("$ALBUMNAME", track.album);
        }
        if (undefined!=track.title) {
            val=val.replace("$TRACKNAME", track.title);
        }
    }
    return val;
}

function doCustomAction(action, player, track) {
    if (action.iframe) {
        let title = action.title;
        if (action.toolbar && action.toolbar.title) {
            title = action.toolbar.title;
        }
        bus.$emit('dlg.open', 'iframe', doReplacements(action.iframe, player, track), doReplacements(title, player, track));
    } else if (action.weblink) {
        window.open(doReplacements(action.weblink, player, track));
    } else if (action.command) {
        lmsCommand("", ["material-skin", "command", "cmd:"+doReplacements(action.command, player, track)]);
    } else if (action.script) {
        eval(doReplacements(action.script, player, track));
    }
}
