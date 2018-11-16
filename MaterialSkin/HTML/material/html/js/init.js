/**
 * LMS-Material
 *
 * Copyright (c) 2018 Craig Drummond <craig.p.drummond@gmail.com>
 * MIT license.
 */

function initApp() {
    var t = getLocalStorageVal('translation', undefined);
    if (t!=undefined) {
        setTranslation(JSON.parse(t));
    }
    lmsCommand("", ["pref", "language", "?"]).then(({data}) => {
        if (data && data.result && data.result._p2) {
            var lang = data.result._p2.toLowerCase();
            if (lang == 'en') {
                var language = (window.navigator.userLanguage || window.navigator.language).toLowerCase();
                if (language != 'en-us') {
                    lang = language;
                }
            }
            if (lang != 'en') {
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

    // Use Escape to close dialogs
    document.onkeydown = function(evt) {
        evt = evt || window.event;
        if (evt.keyCode == 27) {
            bus.$emit('closeDialog');
        }
    };
}

