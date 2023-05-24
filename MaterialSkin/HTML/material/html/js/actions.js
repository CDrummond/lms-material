/**
 * LMS-Material
 *
 * Copyright (c) 2018-2023 Craig Drummond <craig.p.drummond@gmail.com>
 * MIT license.
 */
'use strict';

const DIVIDER                 = -1;
const CUSTOM_ACTIONS          = -2;
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

const HIDE_FOR_PARTY = new Set([PLAY_ACTION, PLAY_ALBUM_ACTION, PLAY_ALL_ACTION, MORE_ACTION, MORE_LIB_ACTION, RENAME_ACTION, REMOVE_ACTION, EDIT_ACTION, ADD_FAV_ACTION, DELETE_ACTION, ADD_TO_FAV_ACTION, REMOVE_FROM_FAV_ACTION, SELECT_ACTION, RATING_ACTION, ADD_FAV_FOLDER_ACTION, DELETE_FAV_FOLDER_ACTION, MOVE_FAV_TO_PARENT_ACTION, UNSUB_PODCAST_ACTION, MOVE_HERE_ACTION, INSERT_ALL_ACTION, ADD_TO_PLAYLIST_ACTION, REMOVE_DUPES_ACTION, ADV_SEARCH_ACTION, SAVE_VLIB_ACTION, DOWNLOAD_ACTION, PLAY_DISC_ACTION, PLAY_PLAYLIST_ACTION, PQ_SORT_ACTION, PLAYLIST_SORT_ACTION, PQ_SAVE_ACTION]);

var ACTIONS=[
    {cmd:"play",         icon:"play_circle_outline"},
    {cmd:"play_album",   icon:"album"},
    {cmd:"playall",      icon:"play_circle_outline"},
    {cmd:"add",          icon:"add_circle_outline"},
    {cmd:"addall",       icon:"add_circle_outline"},
    {cmd:"add-hold",     svg: "playnext"},
    {cmd:"more",         icon: "more_horiz"},
    {cmd:"lib-more",     icon: "more_horiz"},
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
    {cmd:"albsort",      icon:"sort_by_alpha", submenu:true},
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
    {cmd:"adv-search",   svg:"text-search"},
    {cmd:"save-vlib",    icon:"library_add"},

    {cmd:"download",     icon:"cloud_download"},
    {cmd:"pq-rmdisc",    svg:"album-multi"},
    {cmd:"play-disc",    svg:"album-multi"},
    {cmd:"pl-track",     icon:"playlist_play"},
    {cmd:"show-img",     icon:"photo"},
    {cmd:"pq-sort",      icon:"sort"},
    {cmd:"playlist-sort",icon:"sort"},
    {cmd:"pq-save",      icon:"save"}
];

function updateActionStrings() {
    ACTIONS[PLAY_ACTION].title=ACTIONS[PLAY_ALL_ACTION].title=i18n("Play now");
    ACTIONS[PLAY_ACTION].skey=ACTIONS[PLAY_ALL_ACTION].key=LMS_PLAY_KEYBOARD;
    ACTIONS[PLAY_ALBUM_ACTION].title=i18n("Play album starting at track");
    ACTIONS[ADD_ACTION].title=ACTIONS[ADD_ALL_ACTION].title=i18n("Append to queue");
    ACTIONS[ADD_ACTION].skey=ACTIONS[ADD_ALL_ACTION].key=LMS_APPEND_KEYBOARD;
    ACTIONS[ADD_RANDOM_ALBUM_ACTION].title=i18n("Append random album to queue");
    ACTIONS[INSERT_ACTION].title=ACTIONS[INSERT_ALL_ACTION].title=i18n("Play next");
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
    ACTIONS[SEARCH_LIB_ACTION].title=i18n("Search");
    ACTIONS[SEARCH_LIB_ACTION].key=LMS_SEARCH_KEYBOARD;
    ACTIONS[USE_GRID_ACTION].title=ACTIONS[USE_LIST_ACTION].title=i18n("Toggle view");
    ACTIONS[ALBUM_SORTS_ACTION].title=i18n("Sort by");
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
    ACTIONS[PQ_REMOVE_ALBUM_ACTION].title=i18n("Remove album");
    ACTIONS[PQ_ZAP_ACTION].title=i18n("Zap");

    ACTIONS[GOTO_ARTIST_ACTION].title=i18n("Go to artist");
    ACTIONS[GOTO_ALBUM_ACTION].title=i18n("Go to album");
    ACTIONS[ADD_TO_PLAYLIST_ACTION].title=i18n("Add to playlist");
    ACTIONS[REMOVE_DUPES_ACTION].title=i18n("Remove duplicates");
    ACTIONS[FOLLOW_LINK_ACTION].title=i18n("Follow link");
    ACTIONS[SEARCH_TEXT_ACTION].title=i18n("Search");
    ACTIONS[RELOAD_ACTION].title=i18n("Reload");
    ACTIONS[BR_COPY_ACTION].title=i18n("Copy queue selection here");
    ACTIONS[PQ_COPY_ACTION].title=i18n("Copy browse selection here");
    ACTIONS[ADV_SEARCH_ACTION].title=i18n("Advanced search");
    ACTIONS[SAVE_VLIB_ACTION].title=i18n("Save as virtual library");

    ACTIONS[DOWNLOAD_ACTION].title=i18n("Download");
    ACTIONS[PQ_REMOVE_DISC_ACTION].title=i18n("Remove disc");
    ACTIONS[PLAY_DISC_ACTION].title=i18n("Play disc starting at track");
    ACTIONS[PLAY_PLAYLIST_ACTION].title=i18n("Play starting at track");
    ACTIONS[SHOW_IMAGE_ACTION].title=i18n("Show image");
    ACTIONS[PQ_SORT_ACTION].title=i18n("Sort queue");
    ACTIONS[PQ_SORT_ACTION].key=LMS_SORT_QUEUE_KEYBOARD;
    ACTIONS[PLAYLIST_SORT_ACTION].title=i18n("Sort tracks");
    ACTIONS[PQ_SAVE_ACTION].title=i18n("Save queue");
    ACTIONS[PQ_SAVE_ACTION].key=LMS_SAVE_QUEUE_KEYBOARD;
}

