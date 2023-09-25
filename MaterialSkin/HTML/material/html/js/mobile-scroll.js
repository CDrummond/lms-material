/**
 * LMS-Material
 *
 * Copyright (c) 2018-2023 Craig Drummond <craig.p.drummond@gmail.com>
 * MIT license.
 */
'use strict';

function msShowHandle() {
    document.documentElement.style.setProperty('--mobile-scrollbar-thumb-color', 'var(--scrollbar-thumb-color)');
}

function msHideHandle(view) {
    view.sbarTimer = setTimeout(function () {
        view.sbarTimer = undefined;
        document.documentElement.style.setProperty('--mobile-scrollbar-thumb-color', 'transparent');
    }.bind(view), 500);
}

function msRegister(view, elem) {
    if (!LMS_MOBILE_SCROLL) {
        return;
    }
    elem.addEventListener("touchstart", msShowHandle, false);
    elem.addEventListener("touchcancel", function() { msHideHandle(view) }, false);
    elem.addEventListener("touchend", function() { msHideHandle(view) }, false);
}

function msHandleScrollEvent(view) {
    if (!LMS_MOBILE_SCROLL) {
        return;
    }
    if (undefined==view.sbarTimer) {
        document.documentElement.style.setProperty('--mobile-scrollbar-thumb-color', 'var(--scrollbar-thumb-color)');
    } else {
        clearTimeout(view.sbarTimer);
    }
    msHideHandle(view);
}