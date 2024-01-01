/**
 * LMS-Material
 *
 * Copyright (c) 2018-2024 Craig Drummond <craig.p.drummond@gmail.com>
 * MIT license.
 */
'use strict';

var translation=undefined;

function setTranslation(trans) {
    translation = trans;
}

function i18n(str, val, val2, val3) {
    let rv = undefined==translation || !(str in translation) || translation[str]==="" ? str : translation[str];
    if (undefined!=val) {
        rv = rv.replace("%1", val);
    }
    if (undefined!=val2) {
        rv = rv.replace("%2", val2);
    }
    if (undefined!=val3) {
        rv = rv.replace("%3", val3);
    }
    return rv;
}

function i18np(singular, plural, val) {
    if (1==val) {
        if (undefined==translation || !(singular in translation) || translation[singular]==="") {
            return singular.replace("%1", val);
        }
        return translation[singular].replace("%1", val);
    } else {
        if (undefined==translation || !(plural in translation) || translation[plural]==="") {
            return plural.replace("%1", val);
        }
        return translation[plural].replace("%1", val);
    }
}
