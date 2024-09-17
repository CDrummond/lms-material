/**
 * LMS-Material
 *
 * Copyright (c) 2018-2024 Craig Drummond <craig.p.drummond@gmail.com>
 * MIT license.
 */
'use strict';

const STD_ITEMS=[
    {
        command: ["artists"],
        params: [ARTIST_TAGS, 'include_online_only_artists:1'],
        menu: [PLAY_ACTION, INSERT_ACTION, ADD_ACTION, ADD_RANDOM_ALBUM_ACTION, DIVIDER, ADD_TO_FAV_ACTION, SELECT_ACTION, CUSTOM_ACTIONS, MORE_LIB_ACTION]
    },
    {
        command: ["albums"],
        params: [ARTIST_ALBUM_TAGS, SORT_KEY+ARTIST_ALBUM_SORT_PLACEHOLDER],
        menu: [PLAY_ACTION, INSERT_ACTION, PLAY_SHUFFLE_ACTION, ADD_ACTION, ADD_RANDOM_ALBUM_ACTION, DIVIDER, ADD_TO_FAV_ACTION, SELECT_ACTION, COPY_DETAILS_ACTION, CUSTOM_ACTIONS, MORE_LIB_ACTION],
        actionMenu: [DIVIDER, INSERT_ACTION, PLAY_SHUFFLE_ACTION, ADD_RANDOM_ALBUM_ACTION, DIVIDER, SCROLL_TO_ACTION, ADD_TO_FAV_ACTION, CUSTOM_ACTIONS, MORE_LIB_ACTION]
    },
    {
        command: ["tracks"],
        params: [TRACK_TAGS, SORT_KEY+"tracknum"],
        menu: [PLAY_ACTION, INSERT_ACTION, PLAY_SHUFFLE_ACTION, ADD_ACTION, DIVIDER, ADD_TO_FAV_ACTION, ADD_TO_PLAYLIST_ACTION, DOWNLOAD_ACTION, SELECT_ACTION, COPY_DETAILS_ACTION, CUSTOM_ACTIONS, MORE_LIB_ACTION],
        actionMenu: [INSERT_ACTION, PLAY_SHUFFLE_ACTION, DIVIDER, SCROLL_TO_ACTION, ADD_TO_FAV_ACTION, ADD_TO_PLAYLIST_ACTION, DOWNLOAD_ACTION, CUSTOM_ACTIONS, MORE_LIB_ACTION],
        searchMenu: [PLAY_ACTION, INSERT_ACTION, ADD_ACTION, DIVIDER, GOTO_ARTIST_ACTION, ADD_TO_FAV_ACTION, ADD_TO_PLAYLIST_ACTION, DOWNLOAD_ACTION, SELECT_ACTION, COPY_DETAILS_ACTION, CUSTOM_ACTIONS, MORE_LIB_ACTION]
    },
    {
        command: ["playlists", "tracks"],
        params: [PLAYLIST_TRACK_TAGS], // "tags:IRad"] -> Will show rating, not album???
        menu: [PLAY_ACTION, INSERT_ACTION, PLAY_SHUFFLE_ACTION, ADD_ACTION, DIVIDER, ADD_TO_FAV_ACTION, RENAME_ACTION, REMOVE_DUPES_ACTION, DELETE_ACTION, DOWNLOAD_ACTION, SELECT_ACTION, BR_COPY_ACTION, MORE_LIB_ACTION],
        actionMenu: [INSERT_ACTION, PLAY_SHUFFLE_ACTION, DIVIDER, ADD_TO_FAV_ACTION, REMOVE_DUPES_ACTION, PLAYLIST_SORT_ACTION, DOWNLOAD_ACTION, MORE_LIB_ACTION]
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
        menu: [PLAY_ACTION, INSERT_ACTION, ADD_ACTION, DIVIDER, ADD_TO_PLAYLIST_ACTION, DOWNLOAD_ACTION, RATING_ACTION, SELECT_ACTION, COPY_DETAILS_ACTION, CUSTOM_ACTIONS, MORE_LIB_ACTION],
        searchMenu: [PLAY_ACTION, INSERT_ACTION, ADD_ACTION, DIVIDER, GOTO_ARTIST_ACTION, GOTO_ALBUM_ACTION, ADD_TO_PLAYLIST_ACTION, DOWNLOAD_ACTION, RATING_ACTION, SELECT_ACTION, COPY_DETAILS_ACTION, CUSTOM_ACTIONS, MORE_LIB_ACTION]
    },
    {
        menu: [PLAY_ACTION, PLAY_ALBUM_ACTION, PLAY_DISC_ACTION, INSERT_ACTION, ADD_ACTION, DIVIDER, ADD_TO_PLAYLIST_ACTION, DOWNLOAD_ACTION, RATING_ACTION, SELECT_ACTION, COPY_DETAILS_ACTION, CUSTOM_ACTIONS, MORE_LIB_ACTION]
    },
    {
        menu: [PLAY_ACTION, INSERT_ACTION, PLAY_PLAYLIST_ACTION, ADD_ACTION, DIVIDER, REMOVE_ACTION, DOWNLOAD_ACTION, SELECT_ACTION, COPY_DETAILS_ACTION, BR_COPY_ACTION, MOVE_HERE_ACTION, CUSTOM_ACTIONS],
        largeListMenu: [PLAY_ACTION, INSERT_ACTION, PLAY_PLAYLIST_ACTION, ADD_ACTION, DIVIDER, DOWNLOAD_ACTION, COPY_DETAILS_ACTION, SELECT_ACTION, COPY_DETAILS_ACTION, CUSTOM_ACTIONS],
        maxBeforeLarge: LMS_MAX_PLAYLIST_EDIT_SIZE
    },
    {
        menu: [PLAY_ACTION, INSERT_ACTION, ADD_ACTION, DIVIDER, SELECT_ACTION, COPY_DETAILS_ACTION]
    },
    {
        menu: [PLAY_ACTION, INSERT_ACTION, ADD_ACTION, DIVIDER, ADD_TO_FAV_ACTION]
    },
    {
        command: ["albums"],
        params: [ALBUM_TAGS_PLACEHOLDER/*, SORT_KEY+ALBUM_SORT_PLACEHOLDER*/],
        menu: [PLAY_ACTION, INSERT_ACTION, PLAY_SHUFFLE_ACTION, ADD_ACTION, ADD_RANDOM_ALBUM_ACTION, DIVIDER, ADD_TO_FAV_ACTION, SELECT_ACTION, COPY_DETAILS_ACTION/*, CUSTOM_ACTIONS, MORE_LIB_ACTION*/],
        actionMenu: [DIVIDER, INSERT_ACTION, PLAY_SHUFFLE_ACTION, ADD_RANDOM_ALBUM_ACTION, DIVIDER, ADD_TO_FAV_ACTION/*, CUSTOM_ACTIONS, MORE_LIB_ACTION*/]
    },
    {
        command: ["works"],
        params: ['include_online_only_artists:1'],
        menu: [ADD_TO_FAV_ACTION, COPY_DETAILS_ACTION, CUSTOM_ACTIONS, MORE_LIB_ACTION]
    },
    {
        command: ["works"],
        params: ['include_online_only_artists:1'],
        menu: [ADD_TO_FAV_ACTION, COPY_DETAILS_ACTION, MORE_LIB_ACTION]
    },
    {
        menu: [PLAY_ACTION, DIVIDER, PIN_ACTION, EDIT_ACTION, DELETE_ACTION]
    }
];

function addParentParams(item, parentCommand, command, isWorks) {
    let roleIdPos = undefined;
    let artistIdRemoved = false;
    for (var i=0, len=parentCommand.params.length; i<len; ++i) {
        if (typeof parentCommand.params[i] === 'string' || parentCommand.params[i] instanceof String) {
            var lower = parentCommand.params[i].toLowerCase();
            if (lower.startsWith("artist_id:") && !isWorks) {
                if (lmsOptions.noArtistFilter && (item.compilation || item.nonmain)) {
                    // Want all tracks from an album, not just those from this artist, so don't filter on artist_id
                    command.params.push('material_skin_'+parentCommand.params[i]);
                    artistIdRemoved = true;
                } else {
                    // Retrict to only tracks from this artist
                    command.params.push(parentCommand.params[i]);
                }
            } else if (!LMS_NO_ROLE_FILTER && lower.startsWith("role_id:")) {
                roleIdPos = command.params.length;
                command.params.push(parentCommand.params[i]);
            } else if (!LMS_NO_GENRE_FILTER && lower.startsWith("genre_id:")) {
                command.params.push(parentCommand.params[i]);
            } else if (lower.startsWith("work_id:") || lower.startsWith("performance:")) {
                command.params.push(parentCommand.params[i]);
            }
        }
    }
    // If we're not supplying artist_id then can't supply role_id
    if (artistIdRemoved && undefined!=roleIdPos) {
        command.params.splice(roleIdPos, 1);
    }
}

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
    } else if (stdItem>=STD_ITEM_ONLINE_ARTIST) {
        return command;
    } else {
        if (undefined==STD_ITEMS[stdItem].command) {
            return command;
        }
        for (var i=0, list=STD_ITEMS[stdItem].command, len=list.length; i<len; ++i) {
            command.command.push(list[i]);
        }
        if (undefined!=STD_ITEMS[stdItem].params) {
            // Only need genre if showing band, composer, or conductor
            let removeGenre = (STD_ITEM_ALBUM == stdItem || STD_ITEM_PLAYLIST==stdItem || STD_ITEM_REMOTE_PLAYLIST==stdItem) &&
                              !lmsOptions.showBand && !lmsOptions.showComposer && !lmsOptions.showConductor;
            for (var i=0, list=STD_ITEMS[stdItem].params, len=list.length; i<len; ++i) {
                if (removeGenre && list[i].startsWith("tags:")) {
                    let parts = list[i].split(':');
                    command.params.push(parts[0]+':'+parts[1].replace(/g/g,''));
                } else {
                    command.params.push(list[i]);
                }
            }
        }
        if (lmsOptions.techInfo && (STD_ITEM_ALBUM==stdItem || STD_ITEM_PLAYLIST==stdItem || STD_ITEM_REMOTE_PLAYLIST==stdItem)) {
            for (var i=0, list=command.params, len=list.length; i<len; ++i) {
                if (command.params[i].startsWith("tags:")) {
                    command.params[i]+=TECH_INFO_TAGS;
                    break;
                }
            }
        }
        command.params.push(originalId(item.id));
    }
    if (undefined!=parentCommand) {
        if (item.id.startsWith("artist_id:")) {
            for (var i=0, len=parentCommand.params.length; i<len; ++i) {
                if (typeof parentCommand.params[i] === 'string' || parentCommand.params[i] instanceof String) {
                    var lower = parentCommand.params[i].toLowerCase();
                    if ((!LMS_NO_ROLE_FILTER && lower.startsWith("role_id:")) || (!LMS_NO_GENRE_FILTER && lower.startsWith("genre_id:")) || lower.startsWith("year:")) {
                        command.params.push(parentCommand.params[i]);
                    }
                }
            }
        } else if (item.id.startsWith("album_id:")) {
            addParentParams(item, parentCommand, command);
            if (undefined!=item.performance) {
                command.params.push("performance:"+item.performance);
            } else {
                command.params.push("performance:");
            }

            if (undefined!=item.composer_id && getIndex(command.params, "work_id:")>=0) {
                // My Music / works / Composer / <composer> / <work> / <album>
                command.params.push("composer_id:"+item.composer_id);
            } else if (undefined!=item.artist_id && getIndex(command.params, "artist_id:")<0) {
                // For albums browsed from favourites...
                command.params.push("artist_id:"+item.artist_id);
            }
        } else if (item.id.startsWith("genre_id:")) {
            for (var i=0, len=parentCommand.params.length; i<len; ++i) {
                if (typeof parentCommand.params[i] === 'string' || parentCommand.params[i] instanceof String) {
                    var lower = parentCommand.params[i].toLowerCase();
                    if ((!LMS_NO_ROLE_FILTER && lower.startsWith("role_id:")) || lower.startsWith("year:")) {
                        command.params.push(parentCommand.params[i]);
                    }
                }
            }
        } else if (item.id.startsWith("work_id:")) {
            if (undefined!=item.composer_id) {
                command.params.push("composer_id:"+item.composer_id);
            }
            if (undefined!=item.performance) {
                command.params.push("performance:"+item.performance);
            }
            if (undefined!=item.album_id) {
                command.params.push("album_id:"+item.album_id);
            }
            addParentParams(item, parentCommand, command, true);
        }
    }
    return command;
}
