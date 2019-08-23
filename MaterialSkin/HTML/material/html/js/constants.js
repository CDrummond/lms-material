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
const LMS_CACHE_VERSION = 10;
const LMS_LIST_ELEMENT_SIZE = 53;
const LMS_BLANK_COVER = "/music/0/cover.jpg";
const LMS_BLANK_IMAGE = "html/images/blank.png";
const LMS_DOUBLE_CLICK_TIMEOUT = 300;
const LMS_DARK_SVG = "fff";
const LMS_LIGHT_SVG = "444";
const LMS_DARK_ACTIVE_SVG ="58b7ff";
const LMS_LIGHT_ACTIVE_SVG = "346dd2";

// Semi-constant :-)
var LMS_CONDUCTOR_GENRES = new Set(["Classical", "Avant-Garde", "Baroque", "Chamber Music", "Chant", "Choral", "Classical Crossover",
                                  "Early Music",  "High Classical", "Impressionist", "Medieval", "Minimalism","Modern Composition",
                                  "Opera", "Orchestral", "Renaissance", "Romantic", "Symphony", "Wedding Music"]);
var LMS_COMPOSER_GENRES = new Set([...new Set(["Jazz"]), ...LMS_CONDUCTOR_GENRES]);
