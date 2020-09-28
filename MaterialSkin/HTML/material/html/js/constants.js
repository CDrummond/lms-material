/**
 * @license
 * LMS-Material
 *
 * Copyright (c) 2018-2020 Craig Drummond <craig.p.drummond@gmail.com>
 * MIT license.
 */
'use strict';

const LMS_BATCH_SIZE = 25000;
const LMS_QUEUE_BATCH_SIZE = 500;
const LMS_MAX_NON_SCROLLER_ITEMS = 100;
const LMS_MAX_PLAYERS = 100;
const LMS_IMAGE_SZ = 300
const LMS_IMAGE_SIZE = "_"+LMS_IMAGE_SZ+"x"+LMS_IMAGE_SZ+"_f";
const LMS_CURRENT_IMAGE_SIZE = "_1024x1024_f";
const LMS_DEFAULT_LIBRARY = "0";
const LMS_SKIN_LANGUAGES = new Set(['de', 'en', 'en-gb', 'fr', 'nl']);
const LMS_MATERIAL_UI_DEFAULT_PREF = "plugin.material-skin:defaults";
const LMS_MATERIAL_DEFAULT_ITEMS_PREF = "plugin.material-skin:items";
const LMS_MATERIAL_DEFAULT_PINNED_PREF = "plugin.material-skin:pinned";
const LMS_VOLUME_CLOSE_TIMEOUT = 10000;
const LMS_CACHE_VERSION = 12;
const LMS_RECYCLER_BUFFER = 500; // px
const LMS_LIST_ELEMENT_SIZE = 48;
const LMS_LIST_3LINE_ELEMENT_SIZE = 68;
const LMS_BLANK_COVER = "/music/0/cover";
const LMS_DOUBLE_CLICK_TIMEOUT = 300;
const LMS_VOLUME_DEBOUNCE = 250;
const LMS_DARK_SVG = "fff";
const LMS_LIGHT_SVG = "333";
const LMS_UPDATE_SVG = "74bf43";
const LMS_SEARCH_LIMIT = 500;
const LMS_INITIAL_SEARCH_RESULTS = 10;
const LMS_MIN_DESKTOP_WIDTH = 750;
const LMS_MIN_NP_LARGE_INFO_HEIGHT = 250;

const LMS_SAVE_QUEUE_KEYBOARD = "S";
const LMS_CLEAR_QUEUE_KEYBOARD = "X";
const LMS_QUEUE_ADD_URL_KEYBOARD = "U";
const LMS_SCROLL_QUEUE_KEYBOARD = "T";
const LMS_MOVE_QUEUE_KEYBOARD = "M";
const LMS_SETTINGS_KEYBOARD = "G";
const LMS_PLAYER_SETTINGS_KEYBOARD = "P";
const LMS_SERVER_SETTINGS_KEYBOARD = "E";
const LMS_INFORMATION_KEYBOARD = "I";
const LMS_MANAGEPLAYERS_KEYBOARD = "A";
const LMS_TRACK_INFO_KEYBOARD = "D";
const LMS_SEARCH_KEYBOARD = "F";
const LMS_EXPAND_NP_KEYBOARD = "E"; // +shift
const LMS_PLAY_KEYBOARD = "P"; // + shift
const LMS_APPEND_KEYBOARD = "A"; // + shift
const LMS_ADD_ITEM_ACTION_KEYBOARD = "C";
const LMS_CREATE_FAV_FOLDER_KEYBOARD = "M"; // +shift
const LMS_TOGGLE_QUEUE_KEYBOARD = "Q"; // +shift

const SEARCH_OTHER_ID = "search.other";

// Semi-constant :-)
var LMS_CONDUCTOR_GENRES = new Set(["Classical", "Avant-Garde", "Baroque", "Chamber Music", "Chant", "Choral", "Classical Crossover",
                                  "Early Music",  "High Classical", "Impressionist", "Medieval", "Minimalism","Modern Composition",
                                  "Opera", "Orchestral", "Renaissance", "Romantic", "Symphony", "Wedding Music"]);
var LMS_COMPOSER_GENRES = new Set([...new Set(["Jazz"]), ...LMS_CONDUCTOR_GENRES]);

// Browse page
const GRID_MIN_WIDTH = 139;
const GRID_MIN_HEIGHT = 195;
const GRID_MAX_WIDTH = 208; // 183
const GRID_MAX_HEIGHT = 260;  // 235
const GRID_STEP = 5;

const MAX_GRID_TEXT_LEN = 80;
const TERM_PLACEHOLDER = "__TAGGEDINPUT__";
const ALBUM_SORT_PLACEHOLDER  = "AS";
const ARTIST_ALBUM_SORT_PLACEHOLDER = "AAS";
const ARTIST_TAGS_PLACEHOLDER = "ArTP";
const ARTIST_ALBUM_TAGS_PLACEHOLDER = "ArAlTP";
const ALBUM_TAGS_PLACEHOLDER = "AlTP";
const PLAYLIST_TAGS_PLACEHOLDER = "PlTP";
const TOP_ID_PREFIX = "top:/";
const TOP_MYMUSIC_ID = TOP_ID_PREFIX+"mm";
const TOP_FAVORITES_ID = TOP_ID_PREFIX+"fav";
const TOP_APPS_ID  = TOP_ID_PREFIX+"apps";
const TOP_EXTRAS_ID  = TOP_ID_PREFIX+"extra";
const TOP_RADIO_ID  = TOP_ID_PREFIX+"ra";
const TOP_REMOTE_ID = TOP_ID_PREFIX+"rml";
const TOP_CDPLAYER_ID = TOP_ID_PREFIX+"cdda";
const PODCASTS_ID = "apps.podcasts";
const MUSIC_ID_PREFIX = "mm:/";
const SEARCH_ID = MUSIC_ID_PREFIX+"lms-local-search";
const GENRES_ID = MUSIC_ID_PREFIX+"genres";
const RANDOM_MIX_ID = MUSIC_ID_PREFIX+"randomMix";
const ARTIST_TAGS = "tags:s";
const ALBUM_TAGS = "tags:ajlsyKS";
const ARTIST_ALBUM_TAGS = "tags:jlsyK";
const TRACK_TAGS = "tags:distuAC";
const PLAYLIST_TAGS = "tags:sux";
const PLAYLIST_TRACK_TAGS = "tags:acdltK";
const SORT_KEY = "sort:";
const FILTER_PREFIX = "filter:";
const SECTION_APPS = 1;
const SECTION_FAVORITES = 2;
const SECTION_RADIO = 3;
const SECTION_PLAYLISTS = 4;
const SECTION_PODCASTS = 5; // Not a real 'section' but used to indicate when to refresh...
const SECTION_NEWMUSIC = 6; // Not a real 'section' but used to indicate when to refresh...
const SIMPLE_LIB_VIEWS = "SimpleLibraryViews ";
const GRID_SINGLE_LINE_DIFF = 20;
