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

function performCustomAction(obj, action, player) {
    if (undefined!=action.prompt) {
        confirm(obj, action.prompt, {buttonTrueText: i18n('Yes'), buttonFalseText: i18n('Cancel')}).then(res => {
            if (res) {
                doCustomAction(action, player);
            }
        });
    } else {
        doCustomAction(action, player);
    }
}

function doCustomAction(action, player) {
    if (action.iframe) {
        let title = action.title;
        if (action.toolbar && action.toolbar.title) {
            title = action.toolbar.title;
        }
        if (undefined==player) {
            bus.$emit('dlg.open', 'iframe', action.iframe, title);
        } else {
            bus.$emit('dlg.open', 'iframe', action.iframe.replace("$ID", player.id).replace("$NAME", player.name),
                      title.replace("$NAME", player.name));
        }
    } else if (action.weblink) {
        if (undefined==player) {
            window.open(action.weblink);
        } else {
            window.open(action.weblink.replace("$ID", player.id).replace("$NAME", player.name));
        }
    } else if (action.command) {
        if (undefined==player) {
            lmsCommand("", ["material-skin", "command", "cmd:"+action.command]);
        } else {
            lmsCommand("", ["material-skin", "command", "cmd:"+action.command.replace("$ID", player.id).replace("$NAME", player.name)]);
        }
    } else if (action.script) {
        eval(undefined==player ? action.script : action.script.replace("$ID", player.id).replace("$NAME", player.name));
    }
}
