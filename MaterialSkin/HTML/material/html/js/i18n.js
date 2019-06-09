/**
 * LMS-Material
 *
 * Copyright (c) 2018-2019 Craig Drummond <craig.p.drummond@gmail.com>
 * MIT license.
 */

var translation=undefined;

function setTranslation(trans) {
    translation = trans;
}

function i18n(str, val, val2) {
    if (undefined==translation || !(str in translation) || translation[str]==="") {
        return undefined==val ? str : undefined==val2 ? str.replace("%1", val) : str.replace("%1", val).replace("%2", val2);
    }
    return undefined==val ? translation[str] : translation[str].replace("%1", val);
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
