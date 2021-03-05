/**
 * LMS-Material
 *
 * Copyright (c) 2018-2021 Craig Drummond <craig.p.drummond@gmail.com>
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
            if ((lockedActions || !sect[i].locked) && (!sect[i].command || !sect[i].localonly || 'localhost'==location.hostname || '127.0.0.1'==location.hostname)) {
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
            if ("item"!=id && "artist"!=id && "album"!=id) {
                getSectionActions('allplayers', actions, lockedActions);
            }
            getSectionActions(id, actions, lockedActions);
        }
    }
    return actions.length>0 ? actions : undefined;
}

function performCustomAction(obj, action, player, item) {
    if (undefined!=action.prompt) {
        confirm(action.prompt, i18n('Yes')).then(res => {
            if (res) {
                doCustomAction(action, player, item);
            }
        });
    } else {
        doCustomAction(action, player, item);
    }
}

function doReplacements(string, player, item) {
    let val = ''+string;
    if (undefined!=player) {
        val=val.replace("$ID", player.id).replace("$NAME", player.name);
    }
    if (undefined!=item) {
        if (undefined!=item.artist_id) {
            val=val.replace("$ARTISTID", item.artist_id);
        }
        if (undefined!=item.album_id) {
            val=val.replace("$ALBUMID", item.album_id);
        }
        if (undefined!=item.genre_id) {
            val=val.replace("$GENREID", item.genre_id);
        }
        if (undefined!=item.year) {
            val=val.replace("$YEAR", item.year);
        }
        if (undefined!=item.id) {
            let id = ''+item.id;
            if (id.startsWith("artist_id:")) {
                val=val.replace("$ARTISTID", id.split(':')[1]);
            } else if (id.startsWith("album_id:")) {
                val=val.replace("$ALBUMID", id.split(':')[1]);
            } else if (id.startsWith("genre_id:")) {
                val=val.replace("$GENREID", id.split(':')[1]);
            } else if (id.startsWith("year:")) {
                val=val.replace("$YEAR", id.split(':')[1]);
            } else if (id.indexOf(':')>0) {
                val=val.replace("$TRACKID", id.split(':')[1]);
            }
        }
        if (undefined!=item.artist) {
            val=val.replace("$ARTISTNAME", item.artist);
        }
        if (undefined!=item.album_id) {
            val=val.replace("$ALBUMNAME", item.album);
        }
        if (undefined!=item.title) {
            if (undefined!=item.id) {
                let id = ''+item.id;
                if (id.startsWith("artist_id:")) {
                    val=val.replace("$ARTISTNAME", item.title);
                } else if (id.startsWith("album_id:")) {
                    val=val.replace("$ALBUMNAME", item.title);
                } else if (id.startsWith("genre_id:")) {
                    val=val.replace("$GENRE", item.title);
                } else if (!id.startsWith("year:")) {
                    val=val.replace("$TRACKNAME", item.title);
                }
            } else {
                val=val.replace("$TRACKNAME", item.title);
            }
        }
        if (undefined!=item.composer) {
            val=val.replace("$COMPOSER", item.composer);
        }
    }
    return val;
}

function doCustomAction(action, player, item) {
    if (action.iframe) {
        let title = action.title;
        if (action.toolbar && action.toolbar.title) {
            title = action.toolbar.title;
        }
        bus.$emit('dlg.open', 'iframe', doReplacements(action.iframe, player, item), doReplacements(title, player, item));
    } else if (action.weblink) {
        window.open(doReplacements(action.weblink, player, item));
    } else if (action.command) {
        lmsCommand("", ["material-skin", "command", "cmd:"+doReplacements(action.command, player, item)]);
    } else if (action.script) {
        eval(doReplacements(action.script, player, item));
    }
}
