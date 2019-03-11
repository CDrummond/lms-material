/**
 * LMS-Material
 *
 * Copyright (c) 2018-2019 Craig Drummond <craig.p.drummond@gmail.com>
 * MIT license.
 */

var autoLayout = false;
var isMobileBrowser = false;
var landscape = undefined;
var wide = undefined;
function checkLayout() {
    if (autoLayout && !isMobileBrowser) {
        if (window.innerWidth<600 && window.location.href.indexOf("/desktop")>1) {
            changeLayout("mobile");
        } else if (window.innerWidth>=600 && window.location.href.indexOf("/mobile")>1) {
            changeLayout("desktop");
        }
    }

    if (undefined==landscape || undefined==wide || landscape!=isLandscape() || wide!=isWide()) {
        landscape=isLandscape();
        wide=isWide();
        bus.$emit("screenLayoutChanged");
    }
}

function setAutoLayout(al) {
    autoLayout = al;
    checkLayout();
}

function checkEntryFocus() {
    if (isMobileBrowser && (document.activeElement.tagName=="INPUT" || document.activeElement.tagName=="TEXTAREA")) {
        ensureVisible(document.activeElement);
    }
}

function initApp(app) {
    var storedTrans = getLocalStorageVal('translation', undefined);
    if (storedTrans!=undefined) {
        setTranslation(JSON.parse(storedTrans));
    }

    isMobileBrowser = isMobile();

    if (isMobileBrowser) {
        try { // Fails on mobile Firefox - "addRule is not a function"
            document.styleSheets[0].addRule("::-webkit-scrollbar", "max-height: 0px !important; max-width: 0px !important;");
        } catch(e) {
        }
    }

    lmsCommand("", ["pref", "language", "?"]).then(({data}) => {
        if (data && data.result && data.result._p2) {
            var lang = data.result._p2.toLowerCase();
            if (lang == 'en') {
                lang = (window.navigator.userLanguage || window.navigator.language).toLowerCase();
            }
            if (lang == 'en' || lang == 'en-us') {
                if (storedTrans!=undefined) {
                    removeLocalStorage('translation');
                    setTranslation(undefined);
                    bus.$emit('langChanged');
                }
            } else {
                if (!LMS_SKIN_LANGUAGES.has(lang)) {
                    lang = lang.substr(0, 2);
                }
                axios.get("html/lang/"+lang+".json?r=" + LMS_MATERIAL_REVISION).then(function (resp) {
                    var trans = eval(resp.data);
                    setLocalStorageVal('translation', JSON.stringify(trans));
                    setTranslation(trans);
                    axios.defaults.headers.common['Accept-Language'] = lang;
                    document.querySelector('html').setAttribute('lang', lang);
                    bus.$emit('langChanged');
                 }).catch(err => {
                    window.console.error(err);
                });
            }
        }
    });

    setAutoLayout(getLocalStorageVal("layout", "auto") == "auto");

    // Work-around 100vh behaviour in mobile chrome
    // See https://css-tricks.com/the-trick-to-viewport-units-on-mobile/
    let vh = window.innerHeight * 0.01;
    let lastWinHeight = window.innerHeight;
    let timeout = undefined;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
    window.addEventListener('resize', () => {
        if (timeout) {
            clearTimeout(timeout);
        }
        timeout = setTimeout(function () {
            // Only update if changed
            if (Math.abs(lastWinHeight-window.innerHeight)!=0) {
                let vh = window.innerHeight * 0.01;
                document.documentElement.style.setProperty('--vh', `${vh}px`);
                lastWinHeight = window.innerHeight;
            }
            timeout = undefined;
            checkLayout();
            checkEntryFocus();
        }, 50);
    }, false);

    // https://stackoverflow.com/questions/43329654/android-back-button-on-a-progressive-web-application-closes-de-app
    window.addEventListener('load', function() {
        window.history.pushState({ noBackExitsApp: true }, '')
    }, false);

    window.addEventListener('popstate', function(event) {
        if (event.state && event.state.noBackExitsApp) {
            window.history.pushState({ noBackExitsApp: true }, '');
        }
    }, false);

    // https://github.com/timruffles/mobile-drag-drop/issues/77
    window.addEventListener( 'touchmove', function() {});
}

