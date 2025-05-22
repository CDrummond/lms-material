/**
 * @license
 * LMS-Material
 *
 * Copyright (c) 2018-2024 Craig Drummond <craig.p.drummond@gmail.com>
 * MIT license.
 */
'use strict';

function checkPlatform(platform) {
   let regex = new RegExp(platform, 'i');
   return (undefined!=navigator &&
            ( (undefined!=navigator.userAgentData && regex.test(navigator.userAgentData.platform)) ||
              (undefined!=navigator.platform && regex.test(navigator.platform)) ) ) ||
          regex.test(navigator.userAgent)
}

const SEPARATOR = " \u2022 ";
const SEPARATOR_HTML = "&nbsp;\u2022 ";
const SECTION_JUMP = "\u2b24";

const IS_MOBILE  = (undefined!=navigator && undefined!=navigator.userAgentData && navigator.userAgentData.mobile) ||
                   checkPlatform('Android|webOS|iPhone|iPad|BlackBerry|Windows Phone|Opera Mini|IEMobile|Mobile') ||
                   ((typeof window.orientation !== "undefined") && 'ontouchstart' in window) ||
                   (navigator.maxTouchPoints > 1 && checkPlatform('MacIntel'));
const IS_ANDROID = checkPlatform('Android');
const IS_IOS     = !IS_ANDROID && !window.MSStream && (checkPlatform('iPhone|iPad') || (checkPlatform('MacIntel') && navigator.maxTouchPoints > 1));
const IS_IPHONE  = !IS_ANDROID && !window.MSStream && checkPlatform('iPhone');
const IS_APPLE   = !IS_ANDROID && checkPlatform('Mac|iPhone|iPad');
const IS_HIGH_DPI = matchMedia( "(-webkit-min-device-pixel-ratio: 2), (min-device-pixel-ratio: 2), (min-resolution: 192dpi)").matches;
const IS_WINDOWS  = !IS_ANDROID && !IS_APPLE && checkPlatform('Win');
const IS_LINUX    = !IS_ANDROID && !IS_APPLE && !IS_WINDOWS && checkPlatform('Linux');
const SUPPORTS_TOUCH = (('ontouchstart' in window) || (navigator.maxTouchPoints > 0) ||(navigator.msMaxTouchPoints > 0));
const COLOR_USE_STANDARD = 0;
const COLOR_USE_FROM_COVER = 1;
const COLOR_USE_PER_PLAYER = 2;
const SKIP_SECONDS_VALS = [5, 10, 15, 30];
const LMS_DEFAULT_THEME = 'dark';
const LMS_DEFAULT_COLOR = 'blue';
const LMS_BATCH_SIZE = 25000;
const LMS_QUEUE_BATCH_SIZE = 5000;
const LMS_MAX_NON_SCROLLER_ITEMS = 100;
const LMS_SCROLLER_LIST_BUFFER = 500; // px
const LMS_SCROLLER_GRID_BUFFER = 750; // px
const LMS_MAX_PLAYERS = 100;
const LMS_IMAGE_SZ = IS_HIGH_DPI ? 600 : 300;
const LMS_LIST_IMAGE_SZ = IS_HIGH_DPI ? 300 : 150;
const LMS_CURRENT_IMAGE_SZ = IS_HIGH_DPI ? 2048 : 1024;
const LMS_IMAGE_SIZE = "_"+LMS_IMAGE_SZ+"x"+LMS_IMAGE_SZ+"_f";
const LMS_LIST_IMAGE_SIZE = "_"+LMS_LIST_IMAGE_SZ+"x"+LMS_LIST_IMAGE_SZ+"_f";
const LMS_CURRENT_IMAGE_SIZE = "_"+LMS_CURRENT_IMAGE_SZ+"x"+LMS_CURRENT_IMAGE_SZ+"_f";
const LMS_TBAR_BGND_IMAGE_SIZE = IS_HIGH_DPI ? "_30x30_f" : "_15x15_f";
const LMS_DEFAULT_LIBRARY_PREV = "0"; // Prior to 4.6.0 this was used as default library id.
const LMS_DEFAULT_LIBRARY = "-1";
const LMS_DEFAULT_LIBRARIES = new Set([LMS_DEFAULT_LIBRARY, LMS_DEFAULT_LIBRARY_PREV]);
const LMS_MATERIAL_UI_DEFAULT_PREF = "plugin.material-skin:defaults";
const LMS_MATERIAL_DEFAULT_ITEMS_PREF = "plugin.material-skin:items";
const LMS_MATERIAL_DEFAULT_PINNED_PREF = "plugin.material-skin:pinned";
const LMS_VOLUME_CLOSE_TIMEOUT = 10000;
const LMS_QUEUE_CLOSE_TIMEOUT = 15*1000;
const LMS_CACHE_VERSION = 582;
const LMS_LIST_ELEMENT_SIZE = 50;
const LMS_LIST_3LINE_ELEMENT_SIZE = 70;
const LMS_ALBUM_QUEUE_HEADER = 68;
const LMS_GROUP_QUEUE_HEADER = 82;
const LMS_ALBUM_QUEUE_TRACK = 34;
const LMS_BLANK_COVER = "/music/0/cover";
const DEFAULT_RADIO_COVER = "/material/html/images/noradio.png";
const DEFAULT_COVER = "/material/html/images/nocover.png";
const DEFAULT_WORKS_COVER = "/material/html/images/nowork.png";
const RANDOMPLAY_COVER = "/material/html/images/randomplay.png";
const LMS_DOUBLE_CLICK_TIMEOUT = 300;
const LMS_VOLUME_DEBOUNCE = 250;
const LMS_DARK_SVG = "edece7";
const LMS_LIGHT_SVG = "333";
const LMS_UPDATE_SVG = "74bf43";
const LMS_SEARCH_LIMIT = 500;
const LMS_INITIAL_SEARCH_RESULTS = 10;
const LMS_MIN_DESKTOP_WIDTH = 750;
const LMS_MIN_NP_LARGE_INFO_HEIGHT = 250;

const LMS_SAVE_QUEUE_KEYBOARD = "S";
const LMS_CLEAR_QUEUE_KEYBOARD = "X";
const LMS_QUEUE_ADD_URL_KEYBOARD = "U";
const LMS_SCROLL_QUEUE_KEYBOARD = "right";
const LMS_SORT_QUEUE_KEYBOARD = "down";
const LMS_MOVE_QUEUE_KEYBOARD = "M";
const LMS_UI_SETTINGS_KEYBOARD = "G";
const LMS_PLAYER_SETTINGS_KEYBOARD = "P";
const LMS_SERVER_SETTINGS_KEYBOARD = "E";
const LMS_INFORMATION_KEYBOARD = "I";
const LMS_MANAGEPLAYERS_KEYBOARD = "A";
const LMS_TRACK_INFO_KEYBOARD = "D";
const LMS_SEARCH_KEYBOARD = "F";
const LMS_EXPAND_NP_KEYBOARD = "E"; // +shift
const LMS_PLAY_KEYBOARD = "P"; // + shift
const LMS_APPEND_KEYBOARD = "A"; // + shift
const LMS_ADD_ITEM_ACTION_KEYBOARD = "C"; // + shift
const LMS_CREATE_FAV_FOLDER_KEYBOARD = "M"; // +shift
const LMS_TOGGLE_QUEUE_KEYBOARD = "Q"; // +shift

const SEARCH_OTHER_ID = "search.other";

// Browse page
const GRID_MIN_WIDTH = 139;
const GRID_MIN_HEIGHT = 195;
const GRID_MIN_WIDTH_NARROW = 104;
const GRID_MIN_HEIGHT_NARROW = 151;
const GRID_STEP = 5;
const GRID_OTHER = {command:['other']};

const LMS_TRACK_SORTS = new Set(["title", "tracknum", "albumtrack"]);
const DONT_GROUP_RELEASE_TYPES = "material-skin-dgrt:1"
const AUTO_THEME = "auto";
const MAX_GRID_TEXT_LEN = 80;
const TERM_PLACEHOLDER = "__TAGGEDINPUT__";
const ALBUM_SORT_PLACEHOLDER  = "AS";
const ARTIST_ALBUM_SORT_PLACEHOLDER = "AAS";
const TRACK_SORT_PLACEHOLDER = "TRKS";
const ARTIST_TAGS_PLACEHOLDER = "ArTP";
const ARTIST_ALBUM_TAGS_PLACEHOLDER = "ArAlTP";
const ALBUM_TAGS_PLACEHOLDER = "AlTP";
const PLAYLIST_TAGS_PLACEHOLDER = "PlTP";
const TOP_ID_PREFIX = "top:/";
const TOP_MYMUSIC_ID = TOP_ID_PREFIX+"mm";
const TOP_FAVORITES_ID = TOP_ID_PREFIX+"fav";
const TOP_APPS_ID = TOP_ID_PREFIX+"apps";
const TOP_EXTRAS_ID = TOP_ID_PREFIX+"extra";
const TOP_RADIO_ID = TOP_ID_PREFIX+"ra";
const TOP_REMOTE_ID = TOP_ID_PREFIX+"rml";
const TOP_CDPLAYER_ID = TOP_ID_PREFIX+"cdda";
const HIDE_TOP_FOR_PARTY = new Set([TOP_EXTRAS_ID, TOP_RADIO_ID, TOP_REMOTE_ID, TOP_FAVORITES_ID]);
const MUSIC_ID_PREFIX = "mm:/";
const COMPILATIONS_ID = MUSIC_ID_PREFIX+"myMusicAlbumsVariousArtists";
const SEARCH_ID = MUSIC_ID_PREFIX+"lms-local-search";
const ADV_SEARCH_ID = MUSIC_ID_PREFIX+"lms-adv-search";
const GENRES_ID = MUSIC_ID_PREFIX+"genres";
const YEARS_ID = MUSIC_ID_PREFIX+"years";
const RANDOM_MIX_ID = MUSIC_ID_PREFIX+"randomMix";
const START_RANDOM_MIX_ID = MUSIC_ID_PREFIX+"randomMixStart";
const ARTIST_TAGS = "tags:4s";
const ALBUM_TAGS = "tags:ajlqswyKS24";
const ALBUM_TAGS_ALL_ARTISTS = "tags:aajlqswyKSS24";
const ARTIST_ALBUM_TAGS = "tags:aajlqswyKRSSW24";
const BASE_TRACK_TAGS = "tags:dist" + (LMS_VERSION>=90000 ? "bhz1" : "");
const TRACK_TAGS = BASE_TRACK_TAGS+"kyuAACGPS";
const SEARCH_TRACK_TAGS = BASE_TRACK_TAGS+(IS_MOBILE || LMS_VERSION<80400 ? "kuAC" : "kuAACS");
const TECH_INFO_TAGS = "orITY";
const PLAYLIST_TAGS = "tags:suxE";
const PLAYLIST_TRACK_TAGS = BASE_TRACK_TAGS+"acelyACGKPS";
const SORT_KEY = "sort:";
const MSK_SORT_KEY = "msk-sort:";
const FILTER_PREFIX = "filter:";
const SECTION_APPS = 1;
const SECTION_FAVORITES = 2;
const SECTION_RADIO = 3;
const SECTION_PLAYLISTS = 4;
const SECTION_PODCASTS = 5; // Not a real 'section' but used to indicate when to refresh...
const SECTION_NEWMUSIC = 6; // Not a real 'section' but used to indicate when to refresh...
const SIMPLE_LIB_VIEWS = "SimpleLibraryViews ";
const GRID_SINGLE_LINE_DIFF = 20;
const NP_INFO = 'now-playing-info';
const NP_EXPANDED = 'now-playing-expanded';
const ALL_TRACKS_ID = "alltracks";

const ARTIST_ROLE = 1;
const COMPOSER_ARTIST_ROLE = 2;
const CONDUCTOR_ARTIST_ROLE = 3;
const BAND_ARTIST_ROLE = 4;
const ALBUM_ARTIST_ROLE = 5;
const TRACK_ARTIST_ROLE = 6;
const ARTIST_ROLES = new Set([ARTIST_ROLE, ALBUM_ARTIST_ROLE]);

const BASE_ARTIST_TYPES = ["artist", "trackartist", "albumartist", "composer", "conductor", "band"];
const BASE_ARTIST_TYPE_IDS = [ARTIST_ROLE, TRACK_ARTIST_ROLE, ALBUM_ARTIST_ROLE, COMPOSER_ARTIST_ROLE, CONDUCTOR_ARTIST_ROLE, BAND_ARTIST_ROLE];
var ARTIST_TYPES = [].concat(BASE_ARTIST_TYPES);
var ARTIST_TYPE_IDS = [].concat(BASE_ARTIST_TYPE_IDS);
var USER_ARTIST_TYPES = [];

const STRING_ITEM_PROPS = ["genre", "remote_title", "title", "album",
    "artist",  "trackartist",  "albumartist",  "composer",  "conductor", "band",
    "artists", "trackartists", "albumartists", "composers", "conductors", "bands"];
var MULTI_SPLIT_REGEX = ";"

// Safari on iOS and macOS does not support lookbehind. Looks like it can't even parse the line
// so we need to test for this in an eval. This way page loads, but MULTI_SPLIT_REGEX is not
// changed. On other engines the eval succeeds and MULTI_SPLIT_REGEX is set correctly.
try { eval('MULTI_SPLIT_REGEX = new RegExp(/(?<!\\s),(?!\\s)/);'); } catch(e) { }

const VOL_STD    = 0;
const VOL_FIXED  = 1;
const VOL_HIDDEN = 2;

const IFRAME_HOME_NAVIGATES_BROWSE_HOME = 1
const IFRAME_HOME_CLOSES_DIALOGS = 2

const SKIN_GENRE_TAGS = ['composer', 'conductor', 'band'];
const SKIN_BOOL_OPTS = ['maiComposer', 'showConductor', 'showBand', 'showArtistWorks', 'showAllArtists', 'artistFirst', IS_IOS ? 'xx' : 'allowDownload', 'showComment', 'noArtistFilter', 'genreImages', 'playlistImages', 'touchLinks', 'yearInSub', 'playShuffle', 'combineAppsAndRadio', 'useGrouping'];
const SKIN_INT_OPTS = ['showComposer', 'respectFixedVol', 'commentAsDiscTitle', 'pagedBatchSize', 'screensaverTimeout', 'npSwitchTimeout', 'useDefaultForSettings'];

const MSK_REV_SORT_OPT = "msk-revsort:1";

const MIN_TIME_BETWEEN_VOL_UPDATES = 150;

const MBAR_NONE = 0;
const MBAR_THIN = 1;
const MBAR_THICK = 2;
const MBAR_REP_NAV = 3;

const MIN_PQ_PIN_WIDTH = 670;
const MIN_PQ_RESIZE_WIDTH = 450;

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
const STD_ITEM_WORK = 11;
const STD_ITEM_WORK_COMPOSER = 12;
const STD_ITEM_WORK_GENRE = 13;
const STD_ITEM_RANDOM_MIX = 14;
const STD_ITEM_MAX = 100; /* Only items below this are real standard items... */
const STD_ITEM_MIX = 101;
const STD_ITEM_MAI = 200;
const STD_ITEM_ALL_TRACKS = 201;
const STD_ITEM_COMPOSITION_TRACKS = 202;
const STD_ITEM_CLASSICAL_WORKS = 203;
const STD_ITEM_ONLINE_ARTIST = 300;
const STD_ITEM_ONLINE_ALBUM = 301;
const STD_ITEM_ONLINE_ARTIST_CATEGORY = 302;

const MULTI_GROUP_ALBUM = 1;
const MULTI_DISC_ALBUM = 2;
const ALWAYS_GROUP_HEADING = 2;

const MIN_DEF_SETTINGS_WIDTH = 800;
