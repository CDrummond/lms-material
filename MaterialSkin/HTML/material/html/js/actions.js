/**
 * LMS-Material
 *
 * Copyright (c) 2018-2024 Craig Drummond <craig.p.drummond@gmail.com>
 * MIT license.
 */
'use strict';

const DIVIDER                 = -1;
const CUSTOM_ACTIONS          = -2;
const HEADER                  = -3;
const GROUP                   = -4;
const PLAY_ACTION             = 0;
const PLAY_ALBUM_ACTION       = 1;
const PLAY_ALL_ACTION         = 2;
const ADD_ACTION              = 3;
const ADD_ALL_ACTION          = 4;
const INSERT_ACTION           = 5;
const MORE_ACTION             = 6;
const MORE_LIB_ACTION         = 7;
const ADD_RANDOM_ALBUM_ACTION = 8;
const RENAME_ACTION           = 9;
const REMOVE_ACTION           = 10;
const EDIT_ACTION             = 11;
const ADD_FAV_ACTION          = 12;
const DELETE_ACTION           = 13;
const ADD_TO_FAV_ACTION       = 14;
const REMOVE_FROM_FAV_ACTION  = 15;
const PIN_ACTION              = 16;
const UNPIN_ACTION            = 17;
const SELECT_ACTION           = 18;
const UNSELECT_ACTION         = 19;
const RATING_ACTION           = 20;
const SEARCH_LIB_ACTION       = 21;
const USE_GRID_ACTION         = 22;
const USE_LIST_ACTION         = 23;
const ALBUM_SORTS_ACTION      = 24;
const ADD_FAV_FOLDER_ACTION   = 25;
const DELETE_FAV_FOLDER_ACTION= 26;
const MOVE_FAV_TO_PARENT_ACTION=27;
const VLIB_ACTION             = 28;
const UNSUB_PODCAST_ACTION    = 29;
const MOVE_HERE_ACTION        = 30;

const PQ_PLAY_NOW_ACTION      = 31;
const PQ_PLAY_NEXT_ACTION     = 32;
const PQ_SCROLL_ACTION        = 33;
const PQ_ADD_URL_ACTION       = 34;
const PQ_MOVE_QUEUE_ACTION    = 35;
const PQ_REMOVE_ALBUM_ACTION  = 36;
const PQ_ZAP_ACTION           = 37;

const INSERT_ALL_ACTION       = 38;
const GOTO_ARTIST_ACTION      = 39;
const GOTO_ALBUM_ACTION       = 40;
const ADD_TO_PLAYLIST_ACTION  = 41;
const REMOVE_DUPES_ACTION     = 42;

const FOLLOW_LINK_ACTION      = 43;
const SEARCH_TEXT_ACTION      = 44;
const RELOAD_ACTION           = 45;
const BR_COPY_ACTION          = 46;
const PQ_COPY_ACTION          = 47;
const ADV_SEARCH_ACTION       = 48;
const SAVE_VLIB_ACTION        = 49;

const DOWNLOAD_ACTION         = 50;
const PQ_REMOVE_DISC_ACTION   = 51;
const PLAY_DISC_ACTION        = 52;
const PLAY_PLAYLIST_ACTION    = 53;
const SHOW_IMAGE_ACTION       = 54;
const PQ_SORT_ACTION          = 55;
const PLAYLIST_SORT_ACTION    = 56;
const PQ_SAVE_ACTION          = 57;
const SCROLL_TO_ACTION        = 58;
const PQ_TOGGLE_VIEW_ACTION   = 59;
const TRACK_SORTS_ACTION      = 60;
const PLAY_SHUFFLE_ACTION     = 61;
const PLAY_SHUFFLE_ALL_ACTION = 62;

const COPY_ACTION             = 63;
const SEARCH_LIST_ACTION      = 64;

const PQ_PIN_ACTION           = 65;
const PQ_UNPIN_ACTION         = 66;
const ALL_RELEASES_ACTION     = 67;
const ALL_TRACKS_ACTION       = 68;
const COPY_DETAILS_ACTION     = 69;
const NEW_RANDOM_MIX_ACTION   = 70;
const PQ_REMOVE_TRACK_ACTION  = 71;
const PQ_REMOVE_ARTIST_ACTION = 72;

const HIDE_FOR_PARTY = new Set([DIVIDER, PLAY_ACTION, PLAY_ALBUM_ACTION, PLAY_ALL_ACTION, INSERT_ACTION, MORE_ACTION, MORE_LIB_ACTION, RENAME_ACTION, REMOVE_ACTION, EDIT_ACTION, ADD_FAV_ACTION, DELETE_ACTION, ADD_TO_FAV_ACTION, REMOVE_FROM_FAV_ACTION, SELECT_ACTION, RATING_ACTION, ADD_FAV_FOLDER_ACTION, DELETE_FAV_FOLDER_ACTION, MOVE_FAV_TO_PARENT_ACTION, UNSUB_PODCAST_ACTION, MOVE_HERE_ACTION, INSERT_ALL_ACTION, ADD_TO_PLAYLIST_ACTION, REMOVE_DUPES_ACTION, ADV_SEARCH_ACTION, SAVE_VLIB_ACTION, DOWNLOAD_ACTION, PLAY_DISC_ACTION, PLAY_PLAYLIST_ACTION, PQ_SORT_ACTION, PLAYLIST_SORT_ACTION, PQ_SAVE_ACTION, PLAY_SHUFFLE_ACTION, PLAY_SHUFFLE_ALL_ACTION]);

var ACTIONS=[
    {cmd:"play",         icon:"play_circle_outline"},
    {cmd:"play_album",   icon:"album"},
    {cmd:"playall",      icon:"play_circle_outline"},
    {cmd:"add",          icon:"add_circle_outline"},
    {cmd:"addall",       icon:"add_circle_outline"},
    {cmd:"add-hold",     svg: "playnext"},
    {cmd:"more",         svg: "more"},
    {cmd:"lib-more",     svg: "more"},
    {cmd:"random",       svg: "dice-album"},
    {cmd:"rename",       icon:"edit"},
    {cmd:"remove",       icon:"remove_circle_outline"},
    {cmd:"edit-fav",     icon:"edit"},
    {cmd:"add-fav",      svg: "add-favorite"},
    {cmd:"delete",       icon:"delete_outline"},
    {cmd:"addfav",       svg: "add-favorite"},
    {cmd:"removefav",    svg: "remove-favorite"},
    {cmd:"pin",          svg: "pin"},
    {cmd:"unpin",        svg: "unpin"},
    {cmd:"select",       icon:"check_box_outline_blank"},
    {cmd:"unselect",     icon:"check_box"},
    {cmd:"rating",       icon:"stars"},
    {cmd:"search-lib",   svg: "search-library"},
    {cmd:"use-grid",     svg:"grid"},
    {cmd:"use-list",     svg:"list"},
    {cmd:"albsort",      icon:"sort_by_alpha"},
    {cmd:"add-favdir",   icon:"create_new_folder"},
    {cmd:"del-favdir",   icon:"delete_outline"},
    {cmd:"move-fav-parent", svg:"folder-up"},
    {cmd:"vlib",         icon:"library_music"},
    {cmd:"unsub-podcast",icon:"remove_circle_outline"},
    {cmd:"move-here",    icon:"format_indent_increase"},

    {cmd:"pq-playnow",   icon: "play_circle_outline"},
    {cmd:"pq-playnxt",   icon: "play_circle_filled"},
    {cmd:"pq-scroll",    svg:  "current-track"},
    {cmd:"pq-addurl",    svg:  "add-stream"},
    {cmd:"pq-movequeue", icon: "swap_horiz"},
    {cmd:"pq-rmalbum",   icon: "album"},
    {cmd:"pq-zap",       icon: "flash_on"},

    {cmd:"insert-all",   svg: "playnext"},

    {cmd:"goto-artist",  svg:"artist"},
    {cmd:"goto-album",   icon:"album"},

    {cmd:"addto-playlist",icon:"playlist_add"},
    {cmd:"rem-dup",      svg:"remove-duplicates"},

    {cmd:"follow-link",  icon:"public"},
    {cmd:"search-text",  icon:"search"},

    {cmd:"refresh",      icon:"refresh"},
    {cmd:"copy-here",    icon:"content_copy"},
    {cmd:"copy-here",    icon:"content_copy"},
    {cmd:"adv-search",   svg:"database-search"},
    {cmd:"save-vlib",    icon:"library_add"},

    {cmd:"download",     icon:"cloud_download"},
    {cmd:"pq-rmdisc",    svg:"album-multi"},
    {cmd:"play-disc",    svg:"album-multi"},
    {cmd:"pl-track",     icon:"playlist_play"},
    {cmd:"show-img",     svg:"expand"},
    {cmd:"pq-sort",      icon:"sort"},
    {cmd:"playlist-sort",icon:"sort"},
    {cmd:"pq-save",      icon:"save"},
    {cmd:"disc-scroll",  icon:"low_priority"},
    {cmd:"pq-style",     icon:"album"},
    {cmd:"trksort",      icon:"sort_by_alpha"},
    {cmd:"play-shuffle", svg:"play-shuffle"},
    {cmd:"ps-all",       svg:"play-shuffle"},

    {cmd:"copy",         icon:"content_copy"},
    {cmd:"search-list",  svg:"text-search"},
    {cmd:"pq-pin",       svg:"pin"},
    {cmd:"pq-unpin",     svg:"unpin"},
    {cmd:"ar",           svg:"release"},
    {cmd:"as",           icon:"music_note"},
    {cmd:"cd",           icon:"content_copy"},
    {cmd:"nrm",          svg:"dice-plus"},
    {cmd:"pq-rmt",       icon:"music_note"},
    {cmd:"pq-rmar",      svg:"artist"}
];

var PMGR_EDIT_GROUP_ACTION       = {cmd:"edit",     icon:"edit"};
var PMGR_DELETE_GROUP_ACTION     = {cmd:"delete",   icon:"delete"};
var PMGR_SYNC_ACTION             = {cmd:"sync",     icon:"link"};
var PMGR_SETTINGS_ACTION         = {cmd:"settings", svg:"player-settings"};
var PMGR_POWER_ON_ACTION         = {cmd:"on",       icon:"power_settings_new", dimmed:true};
var PMGR_POWER_OFF_ACTION        = {cmd:"off",      icon:"power_settings_new", active:true};
var PMGR_SLEEP_ACTION            = {cmd:"sleep",    icon:"hotel"};
var PMGR_SET_DEF_PLAYER_ACTION   = {cmd:"sdp",      icon:"check_box_outline_blank"};
var PMGR_UNSET_DEF_PLAYER_ACTION = {cmd:"usdp",     icon:"check_box", active:true};

function updateActionStrings() {
    ACTIONS[PLAY_ACTION].title=ACTIONS[PLAY_ALL_ACTION].title=i18n("Play now");
    ACTIONS[PLAY_ACTION].short=ACTIONS[PLAY_ALL_ACTION].short=i18n("Play");
    ACTIONS[PLAY_ACTION].skey=ACTIONS[PLAY_ALL_ACTION].key=LMS_PLAY_KEYBOARD;
    ACTIONS[PLAY_ALBUM_ACTION].title=lmsOptions.supportReleaseTypes ? i18n("Play release starting at track") : i18n("Play album starting at track");
    ACTIONS[PLAY_SHUFFLE_ACTION].title=ACTIONS[PLAY_SHUFFLE_ALL_ACTION].title=i18n("Play shuffled");
    ACTIONS[PLAY_SHUFFLE_ACTION].short=ACTIONS[PLAY_SHUFFLE_ALL_ACTION].short=i18n("Shuffle");
    ACTIONS[ADD_ACTION].title=ACTIONS[ADD_ALL_ACTION].title=i18n("Append to queue");
    ACTIONS[ADD_ACTION].short=ACTIONS[ADD_ALL_ACTION].short=i18n("Append");
    ACTIONS[ADD_ACTION].skey=ACTIONS[ADD_ALL_ACTION].key=LMS_APPEND_KEYBOARD;
    ACTIONS[ADD_RANDOM_ALBUM_ACTION].title=lmsOptions.supportReleaseTypes ? i18n("Append random release to queue") : i18n("Append random album to queue");
    ACTIONS[ADD_RANDOM_ALBUM_ACTION].svg = lmsOptions.supportReleaseTypes ? 'dice-release' : 'dice-album';
    ACTIONS[INSERT_ACTION].title=ACTIONS[INSERT_ALL_ACTION].title=i18n("Play next");
    ACTIONS[INSERT_ACTION].short=ACTIONS[INSERT_ALL_ACTION].short=i18n("Next");
    ACTIONS[MORE_ACTION].title=i18n("More");
    ACTIONS[MORE_LIB_ACTION].title=i18n("More");
    ACTIONS[RENAME_ACTION].title=i18n("Rename");
    ACTIONS[EDIT_ACTION].title=i18n("Edit");
    ACTIONS[ADD_FAV_ACTION].title=i18n("Add favorite");
    ACTIONS[ADD_FAV_ACTION].skey=LMS_ADD_ITEM_ACTION_KEYBOARD;
    ACTIONS[DELETE_ACTION].title=ACTIONS[DELETE_FAV_FOLDER_ACTION].title=i18n("Delete");
    ACTIONS[ADD_TO_FAV_ACTION].title=i18n("Add to favorites");
    ACTIONS[REMOVE_FROM_FAV_ACTION].title=i18n("Remove from favorites");
    ACTIONS[REMOVE_ACTION].title=i18n("Remove");
    ACTIONS[PIN_ACTION].title=i18n("Pin to home screen");
    ACTIONS[UNPIN_ACTION].title=i18n("Un-pin from home screen");
    ACTIONS[SELECT_ACTION].title=i18n("Select");
    ACTIONS[UNSELECT_ACTION].title=i18n("Un-select");
    ACTIONS[RATING_ACTION].title=i18n("Set rating");
    ACTIONS[SEARCH_LIB_ACTION].title=i18n("Search library");
    ACTIONS[SEARCH_LIB_ACTION].key=LMS_SEARCH_KEYBOARD;
    ACTIONS[USE_GRID_ACTION].title=ACTIONS[USE_LIST_ACTION].title=i18n("Toggle view");
    ACTIONS[ALBUM_SORTS_ACTION].title=ACTIONS[TRACK_SORTS_ACTION].title=i18n("Sort by");
    ACTIONS[ADD_FAV_FOLDER_ACTION].title=i18n("Create folder");
    ACTIONS[ADD_FAV_FOLDER_ACTION].skey=LMS_CREATE_FAV_FOLDER_KEYBOARD;
    ACTIONS[MOVE_FAV_TO_PARENT_ACTION].title=i18n("Move to parent folder");
    ACTIONS[VLIB_ACTION].title=i18n("Change library");
    ACTIONS[UNSUB_PODCAST_ACTION].title=i18n("Unsubscribe");
    ACTIONS[MOVE_HERE_ACTION].title=i18n("Move selection here");

    ACTIONS[PQ_PLAY_NOW_ACTION].title=i18n("Play now");
    ACTIONS[PQ_PLAY_NEXT_ACTION].title=i18n("Move to next in queue");
    ACTIONS[PQ_SCROLL_ACTION].title=i18n("Scroll queue to current track");
    ACTIONS[PQ_SCROLL_ACTION].stitle=i18n("Scroll to current");
    ACTIONS[PQ_SCROLL_ACTION].key=LMS_SCROLL_QUEUE_KEYBOARD;
    ACTIONS[PQ_ADD_URL_ACTION].title=i18n("Add URL to queue");
    ACTIONS[PQ_ADD_URL_ACTION].stitle=i18n("Add URL");
    ACTIONS[PQ_ADD_URL_ACTION].key=LMS_QUEUE_ADD_URL_KEYBOARD;
    ACTIONS[PQ_MOVE_QUEUE_ACTION].title=i18n("Transfer queue to another player");
    ACTIONS[PQ_MOVE_QUEUE_ACTION].stitle=i18n("Transfer queue");
    ACTIONS[PQ_MOVE_QUEUE_ACTION].key=LMS_MOVE_QUEUE_KEYBOARD;
    ACTIONS[PQ_REMOVE_TRACK_ACTION].title=i18n("Track");
    ACTIONS[PQ_REMOVE_ARTIST_ACTION].title=i18n("Artist");
    ACTIONS[PQ_REMOVE_ALBUM_ACTION].title=lmsOptions.supportReleaseTypes ? i18n("Release") : i18n("Album");
    ACTIONS[PQ_ZAP_ACTION].title=i18n("Zap");

    ACTIONS[GOTO_ARTIST_ACTION].title=i18n("Go to artist");
    ACTIONS[GOTO_ALBUM_ACTION].title=lmsOptions.supportReleaseTypes ? i18n("Go to release") : i18n("Go to album");
    ACTIONS[ADD_TO_PLAYLIST_ACTION].title=i18n("Add to playlist");
    ACTIONS[REMOVE_DUPES_ACTION].title=i18n("Remove duplicates");
    ACTIONS[FOLLOW_LINK_ACTION].title=i18n("Follow link");
    ACTIONS[SEARCH_TEXT_ACTION].title=ACTIONS[SEARCH_LIB_ACTION].title
    ACTIONS[RELOAD_ACTION].title=i18n("Reload");
    ACTIONS[BR_COPY_ACTION].title=i18n("Copy queue selection here");
    ACTIONS[PQ_COPY_ACTION].title=i18n("Copy browse selection here");
    ACTIONS[ADV_SEARCH_ACTION].title=i18n("Advanced search");
    ACTIONS[SAVE_VLIB_ACTION].title=i18n("Save as virtual library");

    ACTIONS[DOWNLOAD_ACTION].title=i18n("Download");
    ACTIONS[PQ_REMOVE_DISC_ACTION].title=i18n("Disc");
    ACTIONS[PLAY_DISC_ACTION].title=i18n("Play disc starting at track");
    ACTIONS[PLAY_PLAYLIST_ACTION].title=i18n("Play starting at track");
    ACTIONS[SHOW_IMAGE_ACTION].title=i18n("Show image");
    ACTIONS[PQ_SORT_ACTION].title=i18n("Sort queue");
    ACTIONS[PQ_SORT_ACTION].key=LMS_SORT_QUEUE_KEYBOARD;
    ACTIONS[PLAYLIST_SORT_ACTION].title=i18n("Sort tracks");
    ACTIONS[PQ_SAVE_ACTION].title=i18n("Save queue");
    ACTIONS[PQ_SAVE_ACTION].key=LMS_SAVE_QUEUE_KEYBOARD;
    ACTIONS[SCROLL_TO_ACTION].title=i18n('Scroll to');
    ACTIONS[PQ_TOGGLE_VIEW_ACTION].title=i18n("Toggle view");

    ACTIONS[COPY_ACTION].title=i18n("Copy");
    ACTIONS[SEARCH_LIST_ACTION].title=i18n("Search within list");
    ACTIONS[SEARCH_LIST_ACTION].key=LMS_SEARCH_KEYBOARD;
    ACTIONS[PQ_PIN_ACTION].title=i18n("Pin");
    ACTIONS[PQ_UNPIN_ACTION].title=i18n("Unpin");
    ACTIONS[ALL_RELEASES_ACTION].title=i18n("All releases");
    ACTIONS[ALL_TRACKS_ACTION].title=i18n("All tracks");
    ACTIONS[COPY_DETAILS_ACTION].title=i18n("Copy details");
    ACTIONS[NEW_RANDOM_MIX_ACTION].title=i18n("Random mix");

    let albumActs = [GOTO_ALBUM_ACTION, PLAY_ALBUM_ACTION, PQ_REMOVE_ALBUM_ACTION, PQ_TOGGLE_VIEW_ACTION];
    for (let i=0, len=albumActs.length; i<len; ++i) {
        if (lmsOptions.supportReleaseTypes) {
            ACTIONS[albumActs[i]].icon=undefined;
            ACTIONS[albumActs[i]].svg="release";
        } else {
            ACTIONS[albumActs[i]].icon="album";
            ACTIONS[albumActs[i]].svg=undefined;
        }
    }

    PMGR_EDIT_GROUP_ACTION.title=i18n("Edit");
    PMGR_DELETE_GROUP_ACTION.title=i18n("Delete");
    PMGR_SYNC_ACTION.title=i18n("Synchronize");
    PMGR_SETTINGS_ACTION.title=i18n("Player settings");
    PMGR_POWER_ON_ACTION.title=i18n("Switch on");
    PMGR_POWER_OFF_ACTION.title=i18n("Switch off");
    PMGR_SLEEP_ACTION.title=i18n("Sleep");
    PMGR_SET_DEF_PLAYER_ACTION.title=PMGR_UNSET_DEF_PLAYER_ACTION.title=i18n("Default player");
}
