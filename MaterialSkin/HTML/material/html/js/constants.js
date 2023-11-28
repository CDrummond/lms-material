/**
 * @license
 * LMS-Material
 *
 * Copyright (c) 2018-2023 Craig Drummond <craig.p.drummond@gmail.com>
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

const LMS_BATCH_SIZE = 25000;
const LMS_QUEUE_BATCH_SIZE = 5000;
const LMS_MAX_NON_SCROLLER_ITEMS = 100;
const LMS_SCROLLER_LIST_BUFFER = 500; // px
const LMS_SCROLLER_GRID_BUFFER = 750; // px
const LMS_MAX_PLAYERS = 100;
const LMS_IMAGE_SZ = IS_HIGH_DPI ? 600 : 300;
const LMS_CURRENT_IMAGE_SZ = IS_HIGH_DPI ? 2048 : 1024;
const LMS_IMAGE_SIZE = "_"+LMS_IMAGE_SZ+"x"+LMS_IMAGE_SZ+"_f";
const LMS_CURRENT_IMAGE_SIZE = "_"+LMS_CURRENT_IMAGE_SZ+"x"+LMS_CURRENT_IMAGE_SZ+"_f";
const LMS_DEFAULT_LIBRARY = "0";
const LMS_MATERIAL_UI_DEFAULT_PREF = "plugin.material-skin:defaults";
const LMS_MATERIAL_DEFAULT_ITEMS_PREF = "plugin.material-skin:items";
const LMS_MATERIAL_DEFAULT_PINNED_PREF = "plugin.material-skin:pinned";
const LMS_VOLUME_CLOSE_TIMEOUT = 10000;
const LMS_CACHE_VERSION = 12;
const LMS_LIST_ELEMENT_SIZE = 50;
const LMS_LIST_3LINE_ELEMENT_SIZE = 70;
const LMS_ALBUM_QUEUE_HEADER = 68;
const LMS_ALBUM_QUEUE_TRACK = 34;
const LMS_BLANK_COVER = "/music/0/cover";
const DEFAULT_RADIO_COVER = "/material/html/images/noradio.png";
const DEFAULT_COVER = "/material/html/images/nocover.png";
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
const GRID_MAX_WIDTH = 233; // 183
const GRID_STEP = 5;
const GRID_OTHER = {command:['other']};

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
const PODCASTS_ID = "apps.podcasts";
const MUSIC_ID_PREFIX = "mm:/";
const SEARCH_ID = MUSIC_ID_PREFIX+"lms-local-search";
const ADV_SEARCH_ID = MUSIC_ID_PREFIX+"lms-adv-search";
const GENRES_ID = MUSIC_ID_PREFIX+"genres";
const YEARS_ID = MUSIC_ID_PREFIX+"years";
const RANDOM_MIX_ID = MUSIC_ID_PREFIX+"randomMix";
const ARTIST_TAGS = "tags:s";
const ALBUM_TAGS = "tags:ajlqsyKS";
const ALBUM_TAGS_ALL_ARTISTS = "tags:aajlqsyKSS";
const ARTIST_ALBUM_TAGS = "tags:aajlqswyKRSSW";
const TRACK_TAGS = "tags:diGkPstuAACS";
const SEARCH_TRACK_TAGS = IS_MOBILE || LMS_VERSION<80400 ? "tags:dikstuAC" : "tags:dikstuAACS";
const TECH_INFO_TAGS = "orITY";
const PLAYLIST_TAGS = "tags:suxE";
const PLAYLIST_TRACK_TAGS = "tags:acdegilpstyAKS";
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
const NP_INFO = 'now-playing-info';
const NP_EXPANDED = 'now-playing-expanded';
const MAX_TRACKS_BEFORE_COLLAPSE = 200;
const ALL_SONGS_ID = "allsongs";

const ARTIST_TYPES = ["albumartist", "trackartist", "artist", "band", "composer", "conductor"];
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
const SKIN_BOOL_OPTS = ['showComposer', 'showConductor', 'showBand', 'showAllArtists', 'artistFirst', IS_IOS ? 'xx' : 'allowDownload', 'showComment', 'noArtistFilter', 'genreImages', 'touchLinks'];
const SKIN_INT_OPTS = ['respectFixedVol', 'commentAsDiscTitle', 'pagedBatchSize'];

const MSK_REV_SORT_OPT = "msk-revsort:1";

const MIN_TIME_BETWEEN_VOL_UPDATES = 150;
const COLOR_FROM_COVER = 'from-cover';

const MBAR_NONE = 0;
const MBAR_THIN = 1;
const MBAR_THICK = 2;

const MIN_PQ_PIN_WIDTH = 670;
const MIN_PQ_RESIZE_WIDTH = 450;