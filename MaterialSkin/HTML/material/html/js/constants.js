/**
 * @license
 * LMS-Material
 *
 * Copyright (c) 2018-2019 Craig Drummond <craig.p.drummond@gmail.com>
 * MIT license.
 */

const LMS_BATCH_SIZE = 25000;
const LMS_QUEUE_BATCH_SIZE = 500;
const LMS_MAX_NON_SCROLLER_ITEMS = 200;
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
const LMS_CACHE_VERSION = 11;
const LMS_LIST_ELEMENT_SIZE = 48;
const LMS_LIST_3LINE_ELEMENT_SIZE = 68;
const LMS_BLANK_COVER = "/music/0/cover.jpg";
const LMS_BLANK_IMAGE = "html/images/blank.png";
const LMS_DOUBLE_CLICK_TIMEOUT = 300;
const LMS_DARK_SVG = "fff";
const LMS_LIGHT_SVG = "444";
const LMS_DARK_ACTIVE_SVG ="82b1ff";
const LMS_LIGHT_ACTIVE_SVG = "346dd2";

// Semi-constant :-)
var LMS_CONDUCTOR_GENRES = new Set(["Classical", "Avant-Garde", "Baroque", "Chamber Music", "Chant", "Choral", "Classical Crossover",
                                  "Early Music",  "High Classical", "Impressionist", "Medieval", "Minimalism","Modern Composition",
                                  "Opera", "Orchestral", "Renaissance", "Romantic", "Symphony", "Wedding Music"]);
var LMS_COMPOSER_GENRES = new Set([...new Set(["Jazz"]), ...LMS_CONDUCTOR_GENRES]);

// Browse page
const GRID_SIZES = [ {iw:133, ih:185, clz:"image-grid-a"},
                     {iw:138, ih:190, clz:"image-grid-b"},
                     {iw:143, ih:195, clz:"image-grid-c"},
                     {iw:148, ih:200, clz:"image-grid-d"},
                     {iw:153, ih:205, clz:"image-grid-e"},
                     {iw:158, ih:210, clz:"image-grid-f"},
                     {iw:163, ih:215, clz:"image-grid-g"},
                     {iw:168, ih:220, clz:"image-grid-h"},
                     {iw:173, ih:225, clz:"image-grid-i"},
                     {iw:178, ih:230, clz:"image-grid-j"},
                     {iw:183, ih:235, clz:"image-grid-k"} ];

const MAX_GRID_TEXT_LEN = 80;
const TERM_PLACEHOLDER = "__TAGGEDINPUT__";
const ALBUM_SORT_PLACEHOLDER  = "AS";
const ARTIST_ALBUM_SORT_PLACEHOLDER = "AAS";
const TOP_ID_PREFIX = "top:/";
const TOP_MYMUSIC_ID = TOP_ID_PREFIX+"mm";
const TOP_FAVORITES_ID = TOP_ID_PREFIX+"fav";
const TOP_PRESETS_ID = TOP_ID_PREFIX+"ps"
const TOP_APPS_ID  = TOP_ID_PREFIX+"apps";
const TOP_RADIO_ID  = TOP_ID_PREFIX+"ra";
const TOP_REMOTE_ID = TOP_ID_PREFIX+"rml";
const TOP_CDPLAYER_ID = TOP_ID_PREFIX+"cdda";
const MUSIC_ID_PREFIX = "mm:/";
const SEARCH_ID = MUSIC_ID_PREFIX+"search";
const GENRES_ID = MUSIC_ID_PREFIX+"genres";
const RANDOM_MIX_ID = MUSIC_ID_PREFIX+"randomMix";
const ALBUM_TAGS = "tags:jlyasS";
const TRACK_TAGS = "tags:ACdts";
const PLAYLIST_TAGS = "tags:su";
const SORT_KEY = "sort:";
const SECTION_APPS = 1;
const SECTION_FAVORITES = 2;
const SECTION_RADIO = 3;
const SECTION_PLAYLISTS = 4;
const SECTION_PRESETS = 5;
const SECTION_PODCASTS = 6;
const SIMPLE_LIB_VIEWS = "SimpleLibraryViews ";
const GRID_SINGLE_LINE_DIFF = 20;
