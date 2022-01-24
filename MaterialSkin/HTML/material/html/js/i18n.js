/**
 * LMS-Material
 *
 * Copyright (c) 2018-2022 Craig Drummond <craig.p.drummond@gmail.com>
 * MIT license.
 */
'use strict';

var translation=undefined;

function setTranslation(trans, lang) {
    translation = trans;
    if (undefined!=lang && undefined!=translation) {
        for (var i=0, len=LMS_MATERIAL_PLUGIN_TRANSLATIONS.length; i<len; ++i) {
            axios.get("material/pluginjs/"+LMS_MATERIAL_PLUGIN_TRANSLATIONS[i]+"/"+lang+".json").then(function (resp) {
                if (undefined!=resp && undefined!=resp.data) {
                    var trans = eval(resp.data);
                    if (undefined!=trans) {
                        for (let [key, value] of Object.entries(trans)) {
                            if (undefined==translation[key]) {
                                translation[key] = value;
                            }
                        }
                    }
                }
            });
        }
    }
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
