/**
 * LMS-Material
 *
 * Copyright (c) 2018-2021 Craig Drummond <craig.p.drummond@gmail.com>
 * MIT license.
 */
'use strict';

var customActions = undefined;

function translate(s) {
    let lang = undefined==lmsOptions.lang ? 'en' : lmsOptions.lang;
    if (undefined==s['title-'+lang]) {
        lang='en';
    }
    if (undefined!=s['title-'+lang]) {
        if (lang!='en' && undefined==s['title-en']) {
            s['title-en'] = s['title'];
        }
        s['title']=s['title-'+lang];
    }
}

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
                if (undefined!=sect[i].title) {
                    translate(sect[i])
                }
                if (undefined!=sect[i].toolbar && undefined!=sect[i].toolbar.title) {
                    translate(sect[i].toolbar);
                }
                actions.push(sect[i]);
            }
        }
    }
}

const NO_ALL_PLAYER_ACTIONS = new Set(['item', 'artist', 'album', 'track', 'queue-track', 'year', 'genre', 'settings', 'notifications', 'playlist', 'playlist-track']);

function getCustomActions(id, lockedActions) {
    let actions = [];
    if (customActions) {
        if (undefined==id) {
            getSectionActions('system', actions, lockedActions);
        } else if (id.endsWith('-dialog')) {
            getSectionActions(id, actions, lockedActions);
        } else {
            if (!NO_ALL_PLAYER_ACTIONS.has(id)) {
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

const ACTION_KEYS = ['ID', 'NAME', 'ARTISTID', 'ARTISTNAME', 'ALBUMID', 'ALBUMNAME', 'TRACKID', 'TRACKNAME', 'TRACKNUM', 'DISC', 'GENREID', 'GENRENAME', 'YEAR', 'COMPOSER', 'LANG'];

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
        if (undefined!=item.tracknum) {
            val=val.replace("$TRACKNUM", item.tracknum);
        }
        if (undefined!=item.disc) {
            val=val.replace("$DISC", item.disc);
        }
        if (undefined!=item.image) {
            val=val.replace("$IMAGE", item.image);
        }
        if (undefined!=item.id) {
            let id = originalId(''+item.id);
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
        if (undefined!=item.composer) {
            val=val.replace("$COMPOSER", item.composer);
        }
        if (undefined!=item.title) {
            if (undefined!=item.id) {
                let id = ''+item.id;
                if (id.startsWith("artist_id:")) {
                    val=val.replace("$ARTISTNAME", item.title);
                } else if (id.startsWith("album_id:")) {
                    val=val.replace("$ALBUMNAME", item.title);
                } else if (id.startsWith("genre_id:")) {
                    val=val.replace("$GENRENAME", item.title);
                } else if (!id.startsWith("year:")) {
                    val=val.replace("$TRACKNAME", item.title);
                }
            } else {
                val=val.replace("$TRACKNAME", item.title);
            }
        }
    }
    val=val.replace("$HOST", window.location.hostname);
    val=val.replace("$LANG", undefined==lmsOptions.lang ? 'en' : lmsOptions.lang);
    for (var i=0, len=ACTION_KEYS.length; i<len; ++i) {
        val = val.replace("+$"+ACTION_KEYS[i], "").replace("$"+ACTION_KEYS[i]+"+", "").replace("$"+ACTION_KEYS[i], "");
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
    } else if (action.lmscommand) {
        lmsCommand(undefined==player ? "" : player.id, doReplacements(action.lmscommand, player, item)).catch(err => {
            bus.$emit('showError', undefined, i18n("'%1' failed", action.title));
        });
    } else if (action.lmsbrowse && action.lmsbrowse.command && action.lmsbrowse.params) {
        let cmd ={command: [], params: []};
        for (let i=0, len=action.lmsbrowse.command.length; i<len; ++i) {
            cmd.command.push(doReplacements(action.lmsbrowse.command[i], player, item));
        }
        for (let i=0, len=action.lmsbrowse.params.length; i<len; ++i) {
            cmd.params.push(doReplacements(action.lmsbrowse.params[i], player, item));
        }
        return cmd;
    }
}
