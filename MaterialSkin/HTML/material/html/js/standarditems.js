/**
 * LMS-Material
 *
 * Copyright (c) 2018-2020 Craig Drummond <craig.p.drummond@gmail.com>
 * MIT license.
 */
'use strict';

const STD_ITEM_GENRE = 0;
const STD_ITEM_ARTIST = 1;
const STD_ITEM_ALBUM = 2;
const STD_ITEM_PLAYLIST = 3;
const STD_ITEM_REMOTE_PLAYLIST = 4;
const STD_ITEM_YEAR = 5;
const STD_ITEM_TRACK = 6;
const STD_ITEM_ALBUM_TRACK = 7;
const STD_ITEM_PLAYLIST_TRACK = 8;
const STD_ITEM_REMOTE_PLAYLIST_TRACK = 9;

const STD_ITEMS=[
    {
        command: ["artists"],
        params: [ARTIST_TAGS, 'include_online_only_artists:1'],
        menu: [PLAY_ACTION, INSERT_ACTION, ADD_ACTION, ADD_RANDOM_ALBUM_ACTION, DIVIDER, ADD_TO_FAV_ACTION, SELECT_ACTION, MORE_LIB_ACTION]
    },
    {
        command: ["albums"],
        params: [ARTIST_ALBUM_TAGS, SORT_KEY+ARTIST_ALBUM_SORT_PLACEHOLDER],
        menu: [PLAY_ACTION, INSERT_ACTION, ADD_ACTION, ADD_RANDOM_ALBUM_ACTION, DIVIDER, ADD_TO_FAV_ACTION, SELECT_ACTION, MORE_LIB_ACTION]
    },
    {
        command: ["tracks"],
        params: [TRACK_TAGS, SORT_KEY+"tracknum"],
        menu: [PLAY_ACTION, INSERT_ACTION, ADD_ACTION, DIVIDER, ADD_TO_FAV_ACTION, SELECT_ACTION, MORE_LIB_ACTION]
    },
    {
        command: ["playlists", "tracks"],
        params: ["tags:acdltK"], // "tags:IRad"] -> Will show rating, not album???
        menu: [PLAY_ACTION, INSERT_ACTION, ADD_ACTION, DIVIDER, ADD_TO_FAV_ACTION, RENAME_ACTION, DELETE_ACTION, SELECT_ACTION]
    },
    {
        command: ["playlists", "tracks"],
        params: ["tags:acdltK"], // "tags:IRad"] -> Will show rating, not album???
        menu: [PLAY_ACTION, INSERT_ACTION, ADD_ACTION, DIVIDER, ADD_TO_FAV_ACTION, SELECT_ACTION]
    },
    {
        command: ["albums"],
        params: ["tags:ajlsyEK"],
        menu: [PLAY_ACTION, INSERT_ACTION, ADD_ACTION, ADD_RANDOM_ALBUM_ACTION, DIVIDER, ADD_TO_FAV_ACTION, SELECT_ACTION]
    },
    {
        menu: [PLAY_ACTION, INSERT_ACTION, ADD_ACTION, DIVIDER, RATING_ACTION, SELECT_ACTION, MORE_LIB_ACTION]
    },
    {
        menu: [PLAY_ACTION, PLAY_ALBUM_ACTION, INSERT_ACTION, ADD_ACTION, DIVIDER, RATING_ACTION, SELECT_ACTION, MORE_LIB_ACTION]
    },
    {
        menu: [PLAY_ACTION, INSERT_ACTION, ADD_ACTION, DIVIDER, REMOVE_ACTION, SELECT_ACTION, MOVE_HERE_ACTION]
    },
    {
        menu: [PLAY_ACTION, INSERT_ACTION, ADD_ACTION, DIVIDER, SELECT_ACTION]
    }
];

function buildStdItemCommand(item, parent) {
    var command={command:[], params:[]};
    if (undefined==item) {
        return command;
    }

    if (undefined==item.stdItem) {
        if (item.command && item.command.length>0) {
            item.command.forEach(i => {
                command.command.push(i);
            });
        }
        if (item.params && item.params.length>0) {
            item.params.forEach(i => {
                command.params.push(i);
            });
        }
        return command;
    }
    if (undefined==STD_ITEMS[item.stdItem].command) {
        return command;
    }
    for (var i=0, list=STD_ITEMS[item.stdItem].command, len=list.length; i<len; ++i) {
        command.command.push(list[i]);
    }
    for (var i=0, list=STD_ITEMS[item.stdItem].params, len=list.length; i<len; ++i) {
        command.params.push(list[i]);
    }
    command.params.push(item.id);
    if (undefined!=parent) {
        var parentCommand = buildStdItemCommand(parent, undefined);
        if (item.id.startsWith("artist_id:")) {
            for (var i=0, len=parentCommand.params.length; i<len; ++i) {
                if (typeof parentCommand.params[i] === 'string' || parentCommand.params[i] instanceof String) {
                    var lower = parentCommand.params[i].toLowerCase();
                    if (lower.startsWith("role_id:") || (!lmsOptions.noGenreFilter && lower.startsWith("genre_id:"))) {
                        command.params.push(parentCommand.params[i]);
                    }
                }
            }
        } else if (item.id.startsWith("album_id:")) {
            for (var i=0, len=parentCommand.params.length; i<len; ++i) {
                if (typeof parentCommand.params[i] === 'string' || parentCommand.params[i] instanceof String) {
                    var lower = parentCommand.params[i].toLowerCase();
                    if ( (!lmsOptions.noRoleFilter && (lower.startsWith("role_id:"))) ||
                         (!lmsOptions.noGenreFilter && lower.startsWith("genre_id:")) ||
                         lower.startsWith("artist_id:")) {
                        command.params.push(parentCommand.params[i]);
                    }
                }
            }
        }
    }
    return command;
}
