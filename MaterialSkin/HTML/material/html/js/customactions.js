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

function getCustomActions(id) {
    if (undefined==id) {
        if (customActions && customActions.system) {
            return customActions.system;
        }
    } else {
        let actions = [];
        if (customActions && customActions.allplayers) {
            for (let i=0, len=customActions.allplayers.length; i<len; ++i) {
                actions.push(customActions.allplayers[i]);
            }
        }
        if (customActions && customActions[id]) {
            for (let i=0, len=customActions[id].length; i<len; ++i) {
                actions.push(customActions[id][i]);
            }
        }
        if (actions.length>0) {
            return actions;
        }
    }
    return undefined;
}

function performCustomAction(action, player) {
    if (action.iframe) {
        if (undefined==player) {
            bus.$emit('dlg.open', 'iframe', action.iframe, action.title);
        } else {
            bus.$emit('dlg.open', 'iframe', action.iframe.replace("$ID", player.id).replace("$NAME", player.name),
                      action.title.replace("$NAME", player.name));
        }
    } else  if (action.weblink) {
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
    }
}
