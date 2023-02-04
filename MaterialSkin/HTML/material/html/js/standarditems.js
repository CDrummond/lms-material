/**
 * LMS-Material
 *
 * Copyright (c) 2018-2023 Craig Drummond <craig.p.drummond@gmail.com>
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
const STD_ITEM_MUSICIP_MOOD = 10;

const STD_ITEMS=[
    {
        command: ["artists"],
        params: [ARTIST_TAGS, 'include_online_only_artists:1'],
        menu: [PLAY_ACTION, INSERT_ACTION, ADD_ACTION, ADD_RANDOM_ALBUM_ACTION, DIVIDER, ADD_TO_FAV_ACTION, SELECT_ACTION, CUSTOM_ACTIONS, MORE_LIB_ACTION]
    },
    {
        command: ["albums"],
        params: [ARTIST_ALBUM_TAGS, SORT_KEY+ARTIST_ALBUM_SORT_PLACEHOLDER],
        menu: [PLAY_ACTION, INSERT_ACTION, ADD_ACTION, ADD_RANDOM_ALBUM_ACTION, DIVIDER, ADD_TO_FAV_ACTION, SELECT_ACTION, CUSTOM_ACTIONS, MORE_LIB_ACTION],
        actionMenu: [DIVIDER, INSERT_ACTION, ADD_RANDOM_ALBUM_ACTION, DIVIDER, ADD_TO_FAV_ACTION, CUSTOM_ACTIONS, MORE_LIB_ACTION]
    },
    {
        command: ["tracks"],
        params: [TRACK_TAGS, SORT_KEY+"tracknum"],
        menu: [PLAY_ACTION, INSERT_ACTION, ADD_ACTION, DIVIDER, ADD_TO_FAV_ACTION, ADD_TO_PLAYLIST_ACTION, DOWNLOAD_ACTION, SELECT_ACTION, CUSTOM_ACTIONS, MORE_LIB_ACTION],
        actionMenu: [DIVIDER, INSERT_ACTION, DIVIDER, ADD_TO_FAV_ACTION, ADD_TO_PLAYLIST_ACTION, DOWNLOAD_ACTION, CUSTOM_ACTIONS, MORE_LIB_ACTION],
        searchMenu: [PLAY_ACTION, INSERT_ACTION, ADD_ACTION, DIVIDER, GOTO_ARTIST_ACTION, ADD_TO_FAV_ACTION, ADD_TO_PLAYLIST_ACTION, DOWNLOAD_ACTION, SELECT_ACTION, CUSTOM_ACTIONS, MORE_LIB_ACTION]
    },
    {
        command: ["playlists", "tracks"],
        params: ["tags:acdeglstAKS"], // "tags:IRad"] -> Will show rating, not album???
        menu: [PLAY_ACTION, INSERT_ACTION, ADD_ACTION, DIVIDER, ADD_TO_FAV_ACTION, RENAME_ACTION, REMOVE_DUPES_ACTION, DELETE_ACTION, DOWNLOAD_ACTION, SELECT_ACTION, BR_COPY_ACTION, MORE_LIB_ACTION],
        actionMenu: [INSERT_ACTION, DIVIDER, ADD_TO_FAV_ACTION, REMOVE_DUPES_ACTION, PLAYLIST_SORT_ACTION, DOWNLOAD_ACTION, MORE_LIB_ACTION]
    },
    {
        command: ["playlists", "tracks"],
        params: [PLAYLIST_TRACK_TAGS], // "tags:IRad"] -> Will show rating, not album???
        menu: [PLAY_ACTION, INSERT_ACTION, ADD_ACTION, DIVIDER, ADD_TO_FAV_ACTION, SELECT_ACTION]
    },
    {
        command: ["albums"],
        params: [ALBUM_TAGS_PLACEHOLDER, SORT_KEY+ALBUM_SORT_PLACEHOLDER],
        menu: [PLAY_ACTION, INSERT_ACTION, ADD_ACTION, ADD_RANDOM_ALBUM_ACTION, DIVIDER, ADD_TO_FAV_ACTION, SELECT_ACTION, CUSTOM_ACTIONS, MORE_LIB_ACTION]
    },
    {
        menu: [PLAY_ACTION, INSERT_ACTION, ADD_ACTION, DIVIDER, ADD_TO_PLAYLIST_ACTION, DOWNLOAD_ACTION, RATING_ACTION, SELECT_ACTION, CUSTOM_ACTIONS, MORE_LIB_ACTION],
        searchMenu: [PLAY_ACTION, INSERT_ACTION, ADD_ACTION, DIVIDER, GOTO_ARTIST_ACTION, GOTO_ALBUM_ACTION, ADD_TO_PLAYLIST_ACTION, DOWNLOAD_ACTION, RATING_ACTION, SELECT_ACTION, CUSTOM_ACTIONS, MORE_LIB_ACTION]
    },
    {
        menu: [PLAY_ACTION, PLAY_ALBUM_ACTION, PLAY_DISC_ACTION, INSERT_ACTION, ADD_ACTION, DIVIDER, ADD_TO_PLAYLIST_ACTION, DOWNLOAD_ACTION, RATING_ACTION, SELECT_ACTION, CUSTOM_ACTIONS, MORE_LIB_ACTION]
    },
    {
        menu: [PLAY_ACTION, INSERT_ACTION, PLAY_PLAYLIST_ACTION, ADD_ACTION, DIVIDER, REMOVE_ACTION, DOWNLOAD_ACTION, SELECT_ACTION, BR_COPY_ACTION, MOVE_HERE_ACTION, CUSTOM_ACTIONS]
    },
    {
        menu: [PLAY_ACTION, INSERT_ACTION, ADD_ACTION, DIVIDER, SELECT_ACTION]
    },
    {
        menu: [PLAY_ACTION, INSERT_ACTION, ADD_ACTION, DIVIDER, ADD_TO_FAV_ACTION]
    }
];

function buildStdItemCommand(item, parentCommand) {
    var command={command:[], params:[]};
    if (undefined==item) {
        return command;
    }

    let stdItem = undefined == item.stdItem ? item.altStdItem : item.stdItem;
    if (undefined==stdItem) {
        if (item.command && item.command.length>0) {
            for (var i=0, list=item.command, len=list.length; i<len; ++i) {
                command.command.push(list[i]);
            }
        }
        if (item.params && item.params.length>0) {
            for (var i=0, list=item.params, len=list.length; i<len; ++i) {
                command.params.push(list[i]);
            }
        }
    } else {
        if (undefined==STD_ITEMS[stdItem].command) {
            return command;
        }
        for (var i=0, list=STD_ITEMS[stdItem].command, len=list.length; i<len; ++i) {
            command.command.push(list[i]);
        }
        for (var i=0, list=STD_ITEMS[stdItem].params, len=list.length; i<len; ++i) {
            command.params.push(list[i]);
        }
        if (lmsOptions.techInfo && (STD_ITEM_ALBUM==stdItem || STD_ITEM_PLAYLIST==stdItem || STD_ITEM_REMOTE_PLAYLIST==stdItem)) {
            for (var i=0, list=command.params, len=list.length; i<len; ++i) {
                if (command.params[i].startsWith("tags:")) {
                    command.params[i]+=TECH_INFO_TAGS;
                    break;
                }
            }
        }
        command.params.push(item.id);
    }
    if (undefined!=parentCommand) {
        if (item.id.startsWith("artist_id:")) {
            for (var i=0, len=parentCommand.params.length; i<len; ++i) {
                if (typeof parentCommand.params[i] === 'string' || parentCommand.params[i] instanceof String) {
                    var lower = parentCommand.params[i].toLowerCase();
                    if (lower.startsWith("role_id:") || (!lmsOptions.noGenreFilter && lower.startsWith("genre_id:")) || lower.startsWith("year:")) {
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
        } else if (item.id.startsWith("genre_id:")) {
            for (var i=0, len=parentCommand.params.length; i<len; ++i) {
                if (typeof parentCommand.params[i] === 'string' || parentCommand.params[i] instanceof String) {
                    var lower = parentCommand.params[i].toLowerCase();
                    if (lower.startsWith("role_id:") || lower.startsWith("year:")) {
                        command.params.push(parentCommand.params[i]);
                    }
                }
            }
        }
    }
    return command;
}
