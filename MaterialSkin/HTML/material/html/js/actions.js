/**
 * LMS-Material
 *
 * Copyright (c) 2018-2019 Craig Drummond <craig.p.drummond@gmail.com>
 * MIT license.
 */

const DIVIDER                 = -1;
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
const SAVE_PRESET_ACTION      = 28;
const MOVE_PRESET_ACTION      = 29;
const ADD_PRESET_ACTION       = 30;
const VLIB_ACTION             = 31;
const ADD_PODCAST_ACTION      = 32;
const REMOVE_PODCAST_ACTION   = 33;
const SEARCH_PODCAST_ACTION   = 34;

const PQ_PLAY_NOW_ACTION      = 35;
const PQ_PLAY_NEXT_ACTION     = 36;
const PQ_REMOVE_ACTION        = 37;
const PQ_MORE_ACTION          = 38;
const PQ_SELECT_ACTION        = 39;
const PQ_UNSELECT_ACTION      = 40;
const PQ_SCROLL_ACTION        = 41;
const PQ_ADD_URL_ACTION       = 42;
const PQ_MOVE_QUEUE_ACTION    = 43;

var ACTIONS=[
    {cmd:"play",         icon:"play_circle_outline"},
    {cmd:"play_album",   icon:"album"},
    {cmd:"playall",      icon:"play_circle_outline"},
    {cmd:"add",          icon:"add_circle_outline"},
    {cmd:"addall",       icon:"add_circle_outline"},
    {cmd:"add-hold",     icon:"format_indent_increase"},
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
    {cmd:"search-lib",   icon:"search"},
    {cmd:"use-grid",     icon:"grid_on"},
    {cmd:"use-list",     icon:"grid_off"},
    {cmd:"albsort",      icon:"sort_by_alpha"},
    {cmd:"add-favdir",   icon:"create_new_folder"},
    {cmd:"del-favdir",   icon:"delete_outline"},
    {cmd:"move-fav-parent", svg:"folder-up"},
    {cmd:"set-preset",   icon:"ballot"},
    {cmd:"move-preset",  icon:"import_export"},
    {cmd:"add-preset",   icon:"add_box"},
    {cmd:"vlib",         icon:"library_music"},
    {cmd:"add-podcast",  icon:"add_box"},
    {cmd:"remove-podcast",icon:"remove_circle_outline"},
    {cmd:"search-podcast",icon:"search"},

    {cmd:"pq-playnow",   icon: "play_circle_outline"},
    {cmd:"pq-playnxt",   icon: "play_circle_filled"},
    {cmd:"pq-remove",    icon: "remove_circle_outline"},
    {cmd:"pq-more",      svg:  "more"},
    {cmd:"pq-select",    icon: "check_box_outline_blank"},
    {cmd:"pq-unselect",  icon: "check_box"},
    {cmd:"pq-scroll",    svg:  "current-track"},
    {cmd:"pq-addurl",    icon: "add"},
    {cmd:"pq-movequeue", icon: "swap_horiz"}
];

function updateActionStrings() {
    ACTIONS[PLAY_ACTION].title=ACTIONS[PLAY_ALL_ACTION].title=i18n("Play now");
    ACTIONS[PLAY_ALBUM_ACTION].title=i18n("Play album starting at track");
    ACTIONS[ADD_ACTION].title=ACTIONS[ADD_ALL_ACTION].title=i18n("Append to queue");
    ACTIONS[ADD_RANDOM_ALBUM_ACTION].title=i18n("Append random album to queue");
    ACTIONS[INSERT_ACTION].title=i18n("Play next");
    ACTIONS[MORE_ACTION].title=i18n("More");
    ACTIONS[MORE_LIB_ACTION].title=ACTIONS[PQ_MORE_ACTION].title=i18n("More");
    ACTIONS[RENAME_ACTION].title=i18n("Rename");
    ACTIONS[EDIT_ACTION].title=i18n("Edit");
    ACTIONS[ADD_FAV_ACTION].title=i18n("Add favorite");
    ACTIONS[DELETE_ACTION].title=ACTIONS[DELETE_FAV_FOLDER_ACTION].title=i18n("Delete");
    ACTIONS[ADD_TO_FAV_ACTION].title=i18n("Add to favorites");
    ACTIONS[REMOVE_FROM_FAV_ACTION].title=i18n("Remove from favorites");
    ACTIONS[REMOVE_ACTION].title=i18n("Remove");
    ACTIONS[PIN_ACTION].title=i18n("Pin to home screen");
    ACTIONS[UNPIN_ACTION].title=i18n("Un-pin from home screen");
    ACTIONS[SELECT_ACTION].title=ACTIONS[PQ_SELECT_ACTION].title=i18n("Select");
    ACTIONS[UNSELECT_ACTION].title=ACTIONS[PQ_UNSELECT_ACTION].title=i18n("Un-select");
    ACTIONS[RATING_ACTION].title=i18n("Set rating");
    ACTIONS[SEARCH_LIB_ACTION].title=i18n("Search");
    ACTIONS[SEARCH_LIB_ACTION].shortcut=i18n("Ctrl(⌘)+%1", LMS_SEARCH_KEYBOARD);
    ACTIONS[USE_GRID_ACTION].title=ACTIONS[USE_LIST_ACTION].title=i18n("Toggle view");
    ACTIONS[ALBUM_SORTS_ACTION].title=i18n("Sort by");
    ACTIONS[ADD_FAV_FOLDER_ACTION].title=i18n("Create folder");
    ACTIONS[MOVE_FAV_TO_PARENT_ACTION].title=i18n("Move to parent folder");
    ACTIONS[SAVE_PRESET_ACTION].title=i18n("Save as preset");
    ACTIONS[MOVE_PRESET_ACTION].title=i18n("Move");
    ACTIONS[ADD_PRESET_ACTION].title=i18n("Add preset");
    ACTIONS[VLIB_ACTION].title=i18n("Change library");
    ACTIONS[ADD_PODCAST_ACTION].title=i18n("Add podcast");
    ACTIONS[REMOVE_PODCAST_ACTION].title=i18n("Remove");
    ACTIONS[SEARCH_PODCAST_ACTION].title=i18n("Search for podcasts");
    ACTIONS[SEARCH_PODCAST_ACTION].shortcut=i18n("Ctrl(⌘)+%1", LMS_SEARCH_KEYBOARD);

    ACTIONS[PQ_PLAY_NOW_ACTION].title=i18n("Play now");
    ACTIONS[PQ_PLAY_NEXT_ACTION].title=i18n("Move to next in queue");
    ACTIONS[PQ_REMOVE_ACTION].title=i18n("Remove from queue");
    ACTIONS[PQ_SCROLL_ACTION].title=i18n("Scroll queue to current track");
    ACTIONS[PQ_SCROLL_ACTION].shortcut=i18n("Ctrl(⌘)+%1", LMS_SCROLL_QUEUE_KEYBOARD);
    ACTIONS[PQ_ADD_URL_ACTION].title=i18n("Add URL to queue");
    ACTIONS[PQ_ADD_URL_ACTION].shortcut=i18n("Ctrl(⌘)+%1", LMS_QUEUE_ADD_URL_KEYBOARD);
    ACTIONS[PQ_MOVE_QUEUE_ACTION].title=i18n("Move queue to another player");
    ACTIONS[PQ_MOVE_QUEUE_ACTION].shortcut=i18n("Ctrl(⌘)+%1", LMS_MOVE_QUEUE_KEYBOARD);
}

