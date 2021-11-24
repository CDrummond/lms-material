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

const NO_ALL_PLAYER_ACTIONS = new Set(['item', 'artist', 'album', 'track', 'queue-track', 'year', 'genre', 'settings', 'notifications', 'playlist', 'playlist-track', 'album-track']);

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

const ACTION_KEYS = ['ID', 'NAME', 'ARTISTID', 'ARTISTNAME', 'ALBUMID', 'ALBUMNAME', 'TRACKID', 'TRACKNAME', 'TRACKNUM', 'DISC', 'GENREID', 'GENRENAME', 'YEAR', 'COMPOSER', 'LANG', 'FAVURL'];

function doReplacements(string, player, item) {
    let val = ''+string;
    if (undefined!=player) {
        val=val.replaceAll("$ID", player.id).replaceAll("$NAME", player.name);
    }
    if (undefined!=item) {
        if (undefined!=item.artist_id) {
            val=val.replaceAll("$ARTISTID", item.artist_id);
        }
        if (undefined!=item.album_id) {
            val=val.replaceAll("$ALBUMID", item.album_id);
        }
        if (undefined!=item.genre_id) {
            val=val.replaceAll("$GENREID", item.genre_id);
        }
        if (undefined!=item.year) {
            val=val.replaceAll("$YEAR", item.year);
        }
        if (undefined!=item.tracknum) {
            val=val.replaceAll("$TRACKNUM", item.tracknum);
        }
        if (undefined!=item.disc) {
            val=val.replaceAll("$DISC", item.disc);
        }
        if (undefined!=item.image) {
            val=val.replaceAll("$IMAGE", item.image);
        }
        if (undefined!=item.id) {
            let id = originalId(''+item.id);
            if (id.startsWith("artist_id:")) {
                val=val.replaceAll("$ARTISTID", id.split(':')[1]);
            } else if (id.startsWith("album_id:")) {
                val=val.replaceAll("$ALBUMID", id.split(':')[1]);
            } else if (id.startsWith("genre_id:")) {
                val=val.replaceAll("$GENREID", id.split(':')[1]);
            } else if (id.startsWith("year:")) {
                val=val.replaceAll("$YEAR", id.split(':')[1]);
            } else if (id.indexOf(':')>0) {
                val=val.replaceAll("$TRACKID", id.split(':')[1]);
            }
        }
        if (undefined!=item.artist) {
            val=val.replaceAll("$ARTISTNAME", item.artist);
        }
        if (undefined!=item.album_id) {
            val=val.replaceAll("$ALBUMNAME", item.album);
        }
        if (undefined!=item.composer) {
            val=val.replaceAll("$COMPOSER", item.composer);
        }
        if (undefined!=item.title) {
            if (undefined!=item.id) {
                let id = ''+item.id;
                if (id.startsWith("artist_id:")) {
                    val=val.replaceAll("$ARTISTNAME", item.title);
                } else if (id.startsWith("album_id:")) {
                    val=val.replaceAll("$ALBUMNAME", item.title);
                } else if (id.startsWith("genre_id:")) {
                    val=val.replaceAll("$GENRENAME", item.title);
                } else if (!id.startsWith("year:")) {
                    val=val.replaceAll("$TRACKNAME", item.title);
                }
            } else {
                val=val.replaceAll("$TRACKNAME", item.title);
            }
        }
        if (undefined!=item.presetParams && undefined!=item.presetParams.favorites_url) {
            val=val.replaceAll("$FAVURL", item.presetParams.favorites_url);
        }
    }
    val=val.replaceAll("$HOST", window.location.hostname);
    val=val.replaceAll("$LANG", undefined==lmsOptions.lang ? 'en' : lmsOptions.lang);
    for (var i=0, len=ACTION_KEYS.length; i<len; ++i) {
        val = val.replaceAll("+$"+ACTION_KEYS[i], "").replaceAll("$"+ACTION_KEYS[i]+"+", "").replaceAll("$"+ACTION_KEYS[i], "");
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
        let command = [];
        for (let i=0, len=action.lmscommand.length; i<len; ++i) {
            command.push(doReplacements(action.lmscommand[i], player, item));
        }
        lmsCommand(undefined==player ? "" : player.id, command).catch(err => {
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
