/**
 * LMS-Material
 *
 * Copyright (c) 2018-2026 Craig Drummond <craig.p.drummond@gmail.com>
 * MIT license.
 */
'use strict';

const VALID_SKIP_SECONDS = new Set(SKIP_SECONDS_VALS);
const FAKE_MENU = new Set(['volume', 'groupvolume'])
var lmsNumVisibleMenus = 0;

function copyPlayer(p){
    return {id:p.id, name:p.name, isgroup:p.isgroup, model:p.model, ip:p.ip, icon:p.icon, color:p.color, link:p.link, ison:p.ison, isplaying:p.isplaying, iswaiting:p.iswaiting, isconnected:p.isconnected, canpoweroff:p.canpoweroff, islocal:p.islocal};
}

function setDesktopWideCoverPad(on) {
    document.documentElement.style.setProperty('--desktop-np-wide-pad', on ? getComputedStyle(document.documentElement).getPropertyValue('--sub-toolbar-height') : '0px');
}

function updateUiSettings(state, val) {
    var browseDisplayChanged = false;
    var queueDisplayChanged = false;
    var themeChanged = false;
    let stdItems = ['autoScrollQueue', 'browseBackdrop', 'queueBackdrop', 'nowPlayingBackdrop', 'infoBackdrop',
                    'browseTechInfo', 'techInfo', 'nowPlayingTrackNum', 'swipeVolume', 'swipeChangeTrack',
                    'keyboardControl', 'skipBSeconds', 'skipFSeconds', 'mediaControls', 'showRating', 'browseContext',
                    'nowPlayingContext', 'queueContext', 'moveDialogs', 'autoCloseQueue', 'nowPlayingFull', 'tinted',
                    'ndShortcuts', 'ndSettingsIcons', 'ndSettingsVisible', 'gridPerView', 'userid'];
    for (let i=0, len=stdItems.length; i<len; ++i) {
        let key=stdItems[i];
        if (undefined!=val[key] && state[key]!=val[key]) {
            state[key] = val[key];
            setLocalStorageVal(key, state[key]);
            if ('queueContext'==key) {
                queueDisplayChanged = true;
            } else if ('nowPlayingFull'==key) {
                setDesktopWideCoverPad(state.nowPlayingFull);
            } else if ('tinted'==key) {
                themeChanged = true;
            }
        }
    }
    if (undefined!=val.detailedHomeItems && !arraysEqual(state.detailedHomeItems, val.detailedHomeItems)) {
        state.detailedHomeItems = checkHomeItems(val.detailedHomeItems);
        setLocalStorageVal('detailedHomeItems', JSON.stringify(state.detailedHomeItems));
        browseDisplayChanged = true;
    }
    if (!VALID_SKIP_SECONDS.has(state.skipBSeconds)) {
        state.skipBSeconds = 10;
    }
    if (!VALID_SKIP_SECONDS.has(state.skipFSeconds)) {
        state.skipFSeconds = 30;
    }

    var relayoutGrid = false;
    if (undefined!=val.theme) {
        val.theme=val.theme.replace("darker", "dark");
    }
    if (undefined!=val.theme && state.chosenTheme!=val.theme) {
        state.chosenTheme=val.theme;
        state.coloredToolbars = state.chosenTheme.endsWith("-colored");
        state.theme=state.chosenTheme.startsWith(AUTO_THEME) ? autoTheme()+(state.coloredToolbars ? "-colored" : "") : state.chosenTheme;
        setLocalStorageVal('theme', state.chosenTheme);
        themeChanged = true;
    }
    if (val.color=='from-cover') {
        val.colorUsage = COLOR_USE_FROM_COVER;
        val.color = LMS_DEFAULT_COLOR;
    }
    if ((undefined==val.colorUsage || COLOR_USE_PER_PLAYER!=val.colorUsage) && undefined!=val.color && state.color!=val.color) {
        state.color = val.color;
        setLocalStorageVal('color', state.color);
        themeChanged = true;
    }
    let wasFromCover = state.colorUsage==COLOR_USE_FROM_COVER;
    if (undefined!=val.colorUsage && state.colorUsage!=val.colorUsage) {
        state.colorUsage = val.colorUsage;
        setLocalStorageVal('colorUsage', state.colorUsage);
        themeChanged = true;
    }
    if (undefined!=val.homeButton && state.homeButton!=val.homeButton) {
        state.homeButton = val.homeButton;
        setLocalStorageVal('homeButton', state.homeButton);
    }
    if (undefined!=val.mobileBar && state.mobileBar!=val.mobileBar) {
        state.mobileBar = val.mobileBar;
        setLocalStorageVal('mobileBar', state.mobileBar);
        bus.$emit('mobileBarChanged');
    }
    if (undefined!=val.roundCovers && state.roundCovers!=val.roundCovers) {
        state.roundCovers = val.roundCovers;
        setLocalStorageVal('roundCovers', state.roundCovers);
        setRoundCovers(state.roundCovers);
    }
    state.darkUi = !state.theme.startsWith('light') && state.theme.indexOf("/light/")<0;
    if (themeChanged) {
        setTheme(state.theme, COLOR_USE_PER_PLAYER==state.colorUsage ? undefined : state.color, wasFromCover!=(state.colorUsage==COLOR_USE_FROM_COVER));
        bus.$emit('themeChanged');
    }
    if (undefined!=val.fontSize && state.fontSize!=val.fontSize) {
        state.fontSize = val.fontSize;
        setLocalStorageVal('fontSize', state.fontSize);
        setFontSize(state.fontSize);
    }
    if (undefined!=val.sortFavorites && state.sortFavorites!=val.sortFavorites) {
        state.sortFavorites = val.sortFavorites;
        setLocalStorageVal('sortFavorites', state.sortFavorites);
        browseDisplayChanged = true;
    }
    if (undefined!=val.queueShowTrackNum && state.queueShowTrackNum!=val.queueShowTrackNum) {
        state.queueShowTrackNum = val.queueShowTrackNum;
        setLocalStorageVal('queueShowTrackNum', state.queueShowTrackNum);
        queueDisplayChanged = true;
    }
    if (undefined!=val.nowPlayingClock && state.nowPlayingClock!=val.nowPlayingClock) {
        state.nowPlayingClock = val.nowPlayingClock;
        setLocalStorageVal('nowPlayingClock', state.nowPlayingClock);
        bus.$emit('nowPlayingClockChanged');
    }
    if (undefined!=val.volumeStep && lmsOptions.volumeStep!=val.volumeStep) {
        lmsOptions.volumeStep = val.volumeStep;
        setLocalStorageVal('volumeStep', lmsOptions.volumeStep);
    }
    if (undefined!=val.hidden) {
        var diff = new Set([...val.hidden].filter(x => !state.hidden.has(x)));
        var diff2 = new Set([...state.hidden].filter(x => !val.hidden.has(x)));
        if (diff.size>0 || diff2.size>0) {
            state.hidden = val.hidden;
            setLocalStorageVal('hidden', JSON.stringify(Array.from(state.hidden)));
            browseDisplayChanged = true;
        }
    }
    var screensaverChanged = false
    var screensaverVal = undefined==val.screensaver
        ? undefined
        : isNaN(val.screensaver)
            ? val.screensaver ? 1 : 0
            : parseInt(val.screensaver);
    if (undefined!=screensaverVal && state.screensaver!=screensaverVal) {
        state.screensaver = screensaverVal;
        setLocalStorageVal('screensaver', state.screensaver);
        screensaverChanged = true;
    }
    if (undefined!=val.screensaverNp && state.screensaverNp!=val.screensaverNp) {
        state.screensaverNp = val.screensaverNp;
        setLocalStorageVal('screensaverNp', state.screensaverNp);
        screensaverChanged = true;
    }
    if (screensaverChanged) {
        bus.$emit('screensaverDisplayChanged');
    }
    if (undefined!=val.disabledBrowseModes) {
        var diff = new Set([...val.disabledBrowseModes].filter(x => !state.disabledBrowseModes.has(x)));
        var diff2 = new Set([...state.disabledBrowseModes].filter(x => !val.disabledBrowseModes.has(x)));
        if (diff.size>0 || diff2.size>0) {
            state.disabledBrowseModes = val.disabledBrowseModes;
            setLocalStorageVal('disabledBrowseModes', JSON.stringify(Array.from(state.disabledBrowseModes)));
            browseDisplayChanged = true;
        }
    }
    if (undefined!=val.useDefaultBackdrops && state.useDefaultBackdrops!=val.queueuseDefaultBackdropsDefBackdrop) {
        state.useDefaultBackdrops = val.useDefaultBackdrops;
        setLocalStorageVal('useDefaultBackdrops', state.useDefaultBackdrops);
        bus.$emit('setBgndCover');
    }
    if (undefined!=val.queueThreeLines && state.queueThreeLines!=val.queueThreeLines) {
        state.queueThreeLines = val.queueThreeLines;
        setLocalStorageVal('queueThreeLines', state.queueThreeLines);
        if (!state.queueAlbumStyle) {
            queueDisplayChanged = true;
        }
    }
    lmsOptions.techInfo = state.browseTechInfo;
    if (queueDisplayChanged) {
        bus.$emit('queueDisplayChanged');
    }
    if (browseDisplayChanged) {
        bus.$emit('browseDisplayChanged');
    } else if (relayoutGrid) {
        bus.$emit('relayoutGrid');
    }
    if (val.sorts) {
        for (let [key, value] of Object.entries(val.sorts)) {
            setLocalStorageVal(key, value);
        }
    }
    if (COLOR_USE_STANDARD==state.colorUsage && state.coloredToolbars && state.tinted && 'lyrion'==state.color) {
        state.tinted = false;
    }
    if (themeChanged || undefined!=val.mai || undefined!=val.pinQueue) {
        setTimeout(function() {
            if (themeChanged) {
                emitToolbarColorsFromState(state, true);
            }
            if (undefined!=val.mai) {
                bus.$emit('maiDefaults', val.mai, val.isRevert);
            }
            if (undefined!=val.pinQueue) {
                setQueuePinned(state, val.pinQueue, true);
                if (undefined!=val.pinQueue) {
                    setQueueShown(state, true, true);
                }
            }
        }, 100);
    }
}

function autoTheme() {
    const prefersLight = window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches;
    if (IS_IOS || IS_ANDROID) {
        return prefersLight ? "light" : "dark";
    } else if (navigator.platform.indexOf("Linux") != -1) {
        return window.location.href.indexOf('desktop=KDE') != -1
                    ? (prefersLight ? "linux/light/Breeze" : "linux/dark/Breeze-Dark")
                    : (prefersLight ? "linux/light/Adwaita" : "linux/dark/Adwaita-Dark");
    } else if (navigator.platform.indexOf("Win") != -1) {
        return prefersLight ? "windows/light/Windows-10" : "windows/dark/Windows-10-Dark";
    } else if (navigator.platform.indexOf("Mac") != -1) {
        return prefersLight ? "mac/light/Mojave" : "mac/dark/Mojave-Dark";
    }
    return prefersLight ? "light" : "dark";
}

function storeCurrentPlayer(state) {
    setLocalStorageVal('player', state.player.id);
    if (1==queryParams.nativePlayer) {
        try {
            NativeReceiver.updatePlayer(state.player.id, state.player.name, state.player.ip);
        } catch (e) {
            // Try older version of method...
            try {
                NativeReceiver.updatePlayer(state.player.id, state.player.name);
            } catch (e) {
            }
        }
    } else if (queryParams.nativePlayer>0) {
        emitNative("MATERIAL-PLAYER\nID "+state.player.id+"\nNAME "+state.player.name+"\nIP "+state.player.ip, queryParams.nativePlayer);
    }
    if (COLOR_USE_PER_PLAYER==state.colorUsage) {
        state.color = mapPlayerColor(state.player);
        setTheme(state.theme, state.color, true);
    }
}

function setHaveLocalPlayer(state) {
    let prev = state.haveLocalPlayer;
    state.haveLocalPlayer = false;
    if (state.localIps.size>0 && undefined!=state.players) {
        for (var i=0, len=state.players.length; i<len; ++i) {
            if (undefined!=state.players[i].ip && state.localIps.has(state.players[i].ip.split(':')[0])) {
                state.haveLocalPlayer = true;
                state.players[i].local = true;
            }
        }
    }
    if (prev!=state.haveLocalPlayer) {
        bus.$emit('haveLocalPlayer', state.haveLocalPlayer);
    }
}

function closePrevDialog(state) {
    if (state.openDialogs.length>0) {
        bus.$emit('esc');
        bus.$nextTick(() => { closePrevDialog(state) });
    }
}

function updateLang(state, lang) {
    state.lang = lang;
    var timeStr = new Date('January 01, 1971 06:00:00').toLocaleTimeString(state.lang, { hour: 'numeric', minute: 'numeric' });
    state.twentyFourHour = !(timeStr.endsWith("AM") || timeStr.endsWith("PM"));
    // Set page to LMS's language
    axios.defaults.headers.common['Accept-Language'] = lang;
    document.querySelector('html').setAttribute('lang', lang);
}

function setQueueShown(state, val, force) {
    if (val!=state.showQueue || force) {
        let pc = getLocalStorageVal('splitter', undefined);
        state.showQueue = val;
        setLocalStorageVal('showQueue', state.showQueue);
        if (state.pinQueue) {
            if (val && undefined!=pc) {
                bus.$emit('setSplitter', pc);
            } else if (!val) {
                document.documentElement.style.setProperty('--splitter-pc', 100);
            }
        }
        bus.$emit('showQueue', val);
        document.documentElement.style.setProperty('--queue-minwidth', val && state.pinQueue ? '275px' : '0px');
        document.documentElement.style.setProperty('--splitter-width', val && state.pinQueue ? '1px' : '0px');
        document.documentElement.style.setProperty('--splitter-hidden', val && state.pinQueue ? '0' : '100');
    }
}

function setQueuePinned(state, val, force) {
    if (val!=state.pinQueue || force) {
        state.pinQueue=val;
        setLocalStorageVal('pinQueue', state.pinQueue);
        if (state.pinQueue) {
            setQueueShown(state, true);
            document.documentElement.style.setProperty('--splitter-width', val && state.pinQueue ? '1px' : '0px');
            document.documentElement.style.setProperty('--splitter-hidden', val && state.pinQueue ? '0' : '100');
        } else {
            setQueueShown(state, false);
        }
        bus.$emit('layoutChanged');
    }
}

function checkHomeItems(list) {
    let valid = [];
    let extra = new Set();
    for (let i=0, len=lmsOptions.home3rdPartyExtraLists.length; i<len; ++i) {
        extra.add(lmsOptions.home3rdPartyExtraLists[i].id);
    }
    for (let i=0, len=list.length; i<len; ++i) {
        if (list[i].startsWith(DETAILED_HOME_STD_PREFIX) || extra.has(list[i])) {
            valid.push(list[i]);
        }
    }
    return valid;
}

const store = new Vuex.Store({
    state: {
        desktopLayout: false,
        mobileBar: MBAR_THIN,
        showQueue: false,
        showQueueNp: false,
        pinQueue: false,
        players: null, // List of players
        player: null, // Current player (from list)
        localIps: new Set(),
        haveLocalPlayer: false,
        defaultPlayer: null,
        otherPlayers: [], // Players on other servers
        theme: LMS_DEFAULT_THEME,        // Set to dark/light if theme is "auto"
        chosenTheme: LMS_DEFAULT_THEME,  // Theme as chosen by user
        color: LMS_DEFAULT_COLOR,
        colorUsage: COLOR_USE_FROM_COVER,
        darkUi: true,
        roundCovers: true,
        fontSize: 'r',
        sortFavorites:false,
        autoScrollQueue:true,
        library: null,
        browseBackdrop: true,
        queueBackdrop: true,
        nowPlayingBackdrop: true,
        useDefaultBackdrops: true,
        infoBackdrop: true,
        techInfo: false,
        queueShowTrackNum: true,
        nowPlayingTrackNum: false,
        nowPlayingClock: false,
        nowPlayingFull: true,
        browseContext: false,
        nowPlayingContext: true,
        queueContext: false,
        maxRating: 5,
        showRating: false,
        page:'browse',
        prevPage: 'browse',
        hidden: new Set(),
        visibleMenus: new Set(),
        disabledBrowseModes: new Set(),
        swipeVolume: false,
        swipeChangeTrack: false,
        keyboardControl: true,
        updatesAvailable: new Set(),
        restartRequired: false,
        queueAlbumStyle: false,
        queueThreeLines: true,
        openDialogs: [],
        activeDialog: undefined,
        unlockAll: false,
        skipBSeconds: 10,
        skipFSeconds: 30,
        screensaver: 0,
        screensaverNp: false,
        homeButton: 0,
        autoShowHomeButton: window.innerWidth>=LMS_AUTO_SHOW_HOME_BUTTON_MIN_WIDTH,
        gridPerView: true,
        lang: 'en-US',
        twentyFourHour: false,
        mediaControls: false,
        downloadStatus: [],
        coloredToolbars: false,
        tinted: true,
        moveDialogs: false,
        autoCloseQueue: false,
        ndShortcuts: 0,
        ndSettingsIcons: false,
        ndSettingsVisible: false,
        userid: '---',
        cMixSupported: 1==parseInt(getComputedStyle(document.documentElement).getPropertyValue('--color-mix-supported')),
        detailedHomeItems: [DETAILED_HOME_STD_PREFIX+"new", DETAILED_HOME_STD_PREFIX+"radios", DETAILED_HOME_EXPLORE]
    },
    mutations: {
        updatePlayer(state, player) {
            for (var i=0, len=state.players.length; i<len; ++i) {
                if (state.players[i].id==player.id) {
                    state.players[i].name = player.name;
                    state.players[i].ison = player.ison;
                    state.players[i].isplaying = player.isplaying;
                    state.players[i].iswaiting = player.iswaiting;
                    state.players[i].isgroup = player.isgroup;
                    state.players[i].icon = player.icon;
                    state.players[i].color = player.color;
                    if (state.player!=undefined && player.id == state.player.id) {
                        state.player.name = player.name;
                        state.player.ison = player.ison;
                        state.player.isplaying = player.isplaying;
                        state.player.iswaiting = player.iswaiting;
                        state.player.isgroup = player.isgroup;
                        state.player.icon = player.icon;
                        state.player.color = player.color;
                    }
                    break;
                }
            }
        },
        setPlayers(state, players) {
            var changed = !state.players || state.players.length!=players.length;
            if (!changed) {
                for (var i=0, len=state.players.length; i<len; ++i) {
                    var a = state.players[i];
                    var b = players[i];
                    if (a.id!=b.id || a.name!=b.name) { // || a.canpoweroff!=b.canpoweroff || a.ison!=b.ison || a.isconnected!=b.isconnected || a.isgroup!=b.isgroup) {
                        changed = true;
                        break;
                    }
                }
            }

            if (!changed) {
                for (var i=0, len=state.players.length; i<len; ++i) {
                    state.players[i].model = players[i].model;
                    state.players[i].ip = players[i].ip;
                    state.players[i].ison = players[i].ison;
                    state.players[i].isplaying = players[i].isplaying;
                    state.players[i].canpoweroff = players[i].canpoweroff;
                    state.players[i].isconnected = players[i].isconnected;
                    state.players[i].isgroup = players[i].isgroup;
                    state.players[i].icon = players[i].icon;
                    state.players[i].color = players[i].color;
                    state.players[i].link = players[i].link;
                }
                return;
            }

            var currentId = state.player ? ""+state.player.id : undefined;
            var existing = new Set();
            var update = new Set();

            if (state.players) {
                for (var i=0, len=state.players.length; i<len; ++i) {
                    existing.add(state.players[i].id);
                }
            }
            if (players) {
                for (var i=0, len=players.length; i<len; ++i) {
                    update.add(players[i].id);
                }
            }
            var removed = new Set([...existing].filter(x => !update.has(x)));
            var added = new Set([...update].filter(x => !existing.has(x)));
            if (removed.size>0) {
                bus.$emit("playersRemoved", [...removed]);
                changed = true;
            }
            if (added.size>0) {
                bus.$emit("playersAdded", [...added]);
                changed = true;
            }

            state.players=players;
            state.playerIds=update;
            if (changed) {
                setHaveLocalPlayer(state);
            }

            // If default player re-appears (#387) then switch to this
            var defaultSet = false;
            var autoSelect = undefined!=queryParams.player && queryParams.player.indexOf(':')>0 ? queryParams.player : state.defaultPlayer;
            if (undefined!=autoSelect && added.has(autoSelect)) {
                for (var i=0, len=state.players.length; i<len; ++i) {
                    if (state.players[i].id === autoSelect) {
                        state.player = copyPlayer(state.players[i]);
                        storeCurrentPlayer(state);
                        defaultSet = true;
                        break;
                    }
                }
            }

            if (state.player && !defaultSet) {
                // Check current player is still valid
                var found = false;
                if (players) {
                    for (var i=0, len=state.players.length; i<len; ++i) {
                        if (state.players[i].id === state.player.id) {
                            state.player.name = state.players[i].name; // Just in case it was changed
                            found = true;
                            break;
                        }
                    }
                }
                if (!found) {
                    state.player = null;
                }
            }

            if (!state.player && state.players && state.players.length>0) {
                if (undefined!=state.defaultPlayer) {
                    for (var i=0, len=state.players.length; i<len; ++i) {
                        if (state.players[i].id === state.defaultPlayer) {
                            state.player = copyPlayer(state.players[i]);
                            storeCurrentPlayer(state);
                            break;
                        }
                    }
                }
                if (!state.player) {
                    var config = getLocalStorageVal('player');
                    if (config) {
                        for (var i=0, len=state.players.length; i<len; ++i) {
                            if (state.players[i].id === config || state.players[i].name == config) {
                                state.player = copyPlayer(state.players[i]);
                                storeCurrentPlayer(state);
                                break;
                            }
                        }
                    }
                }
                if (!state.player) {
                    // Auto-select a player:
                    //  1. First powered on standard player
                    //  2. First powerer off standard player
                    //  3. First powered on group
                    //  4. First powerer off group
                    for (var j=0; j<4 && !state.player; ++j) {
                        for (var i=0, len=state.players.length; i<len; ++i) {
                            if ((j==1 || j==3 || state.players[i].ison) && (j<2 ? !state.players[i].isgroup : state.players[i].isgroup)) {
                                state.player = copyPlayer(state.players[i]);
                                storeCurrentPlayer(state);
                                break;
                            }
                        }
                    }
                }
            }
            if (state.players.length<1) {
                bus.$emit('noPlayers');
            } else {
                bus.$emit('playerListChanged');
            }
            if (undefined==state.player || currentId!=state.player.id) {
                bus.$emit('playerChanged');
            }
        },
        setPlayer(state, id) {
            if (state.players) {
                for (var i=0, len=state.players.length; i<len; ++i) {
                    if (state.players[i].id === id) {
                        state.player = copyPlayer(state.players[i]);
                        storeCurrentPlayer(state);
                        bus.$emit('playerChanged');
                        break;
                    }
                }
            }
        },
        setDefaultPlayer(state, id) {
            state.defaultPlayer = id;
            if (undefined==id) {
                removeLocalStorage('defaultPlayer');
            } else {
                setLocalStorageVal('defaultPlayer', id);
            }
        },
        setOtherPlayers(state, players) {
            state.otherPlayers = players;
        },
        setUiSettings(state, val) {
            updateUiSettings(state, val);
        },
        setLang(state, val) {
            updateLang(state, val);
        },
        setAutoShowHomeButton(state, val) {
            state.autoShowHomeButton = val;
        },
        initUiSettings(state) {
            let pinQueueInSettings = undefined!=getLocalStorageVal('pinQueue', undefined);
            updateLang(state, window.navigator.userLanguage || window.navigator.language);
            state.defaultPlayer = getLocalStorageVal('defaultPlayer', state.defaultPlayer);
            state.page = getLocalStorageVal('page', state.page);
            state.prevPage = getLocalStorageVal('prevPage', state.prevPage);
            state.chosenTheme = getLocalStorageVal('theme', state.chosenTheme);
            state.chosenTheme=state.chosenTheme.replace("darker", "dark");
            state.coloredToolbars = state.chosenTheme.endsWith("-colored");
            state.theme = state.chosenTheme.startsWith(AUTO_THEME) ? autoTheme()+(state.coloredToolbars ? "-colored" : "") : state.chosenTheme;
            state.theme=state.theme.replace("darker", "dark");
            state.darkUi = !state.theme.startsWith('light') && state.theme.indexOf("/light/")<0;
            state.userid = getLocalStorageVal('userid', state.userid);
            state.color = getLocalStorageVal('color', state.color);
            if ('from-cover'==state.color) {
                state.colorUsage = COLOR_USE_FROM_COVER;
                state.color = LMS_DEFAULT_COLOR;
                setLocalStorageVal('color', state.color);
                setLocalStorageVal('colorUsage', state.colorUsage);
            } else {
                state.colorUsage = parseInt(getLocalStorageVal('colorUsage', state.colorUsage));
            }
            var larger = getLocalStorageBool('largerElements', getLocalStorageBool('largeFonts', undefined));
            var fontSize = getLocalStorageVal('fontSize', undefined);
            if (undefined==fontSize && undefined!=larger) {
                fontSize = larger ? 'l' : 'r';
                setLocalStorageVal('fontSize', fontSize);
            }
            state.fontSize = undefined==fontSize ? 'r' : fontSize;

            let boolItems = ['roundCovers', 'autoScrollQueue', 'sortFavorites', 'browseBackdrop', 'queueBackdrop', 'nowPlayingBackdrop',
                             'infoBackdrop', 'useDefaultBackdrops', 'browseTechInfo', 'techInfo', 'queueShowTrackNum', 'nowPlayingTrackNum',
                             'nowPlayingClock', 'swipeVolume', 'swipeChangeTrack', 'keyboardControl', 'screensaverNp', 'mediaControls',
                             'queueAlbumStyle', 'queueThreeLines', 'browseContext', 'nowPlayingContext', 'queueContext', 'showRating',
                             'moveDialogs', 'autoCloseQueue', 'nowPlayingFull', 'tinted', 'ndSettingsIcons', 'ndSettingsVisible', 'gridPerView'];
            for (let i=0, len=boolItems.length; i<len; ++i) {
                let key = boolItems[i];
                state[key] = getLocalStorageBool(key, state[key]);
            }
            let intItems = ['skipBSeconds', 'skipFSeconds', 'mobileBar', 'maxRating', 'volumeStep', 'ndShortcuts', 'screensaver', 'homeButton'];
            for (let i=0, len=intItems.length; i<len; ++i) {
                let key = intItems[i];
                let value = getLocalStorageVal(key, state[key]);
                state[key] = isNaN(value) ? ("true"==value ? 1 : 0) : parseInt(value);
            }
            if (!VALID_SKIP_SECONDS.has(state.skipBSeconds)) {
                state.skipBSeconds = 10;
            }
            if (!VALID_SKIP_SECONDS.has(state.skipFSeconds)) {
                state.skipFSeconds = 30;
            }

            let dhi = getLocalStorageVal('detailedHomeItems', undefined);
            if (undefined!=dhi) {
                // New format
                try {
                    state.detailedHomeItems = checkHomeItems(JSON.parse(dhi));
                } catch (e) { }
            }
            setQueuePinned(state, getLocalStorageBool('pinQueue', state.pinQueue), true);
            setQueueShown(state, getLocalStorageBool('showQueue', state.showQueue), true);

            state.disabledBrowseModes = new Set(JSON.parse(getLocalStorageVal('disabledBrowseModes', '["myMusicFlopTracks", "myMusicTopTracks", "myMusicMusicFolder", "myMusicFileSystem", "myMusicArtistsComposers", "myMusicArtistsConductors", "myMusicArtistsJazzComposers", "myMusicAlbumsAudiobooks", "myMusicRecentlyChangeAlbums"]')));
            state.hidden = new Set(JSON.parse(getLocalStorageVal('hidden', JSON.stringify([TOP_EXTRAS_ID]))));
            state.library = getLocalStorageVal('library', state.library);
            setTheme(state.theme, state.color);
            emitToolbarColorsFromState(state, true);
            setRoundCovers(state.roundCovers);
            if (state.fontSize!='r') {
                setFontSize(state.fontSize);
            }
            lmsOptions.techInfo = state.browseTechInfo;
            if (LMS_P_RP=='trackstat' || LMS_P_RP=='ratingslight') {
                state.maxRating = 5;
                setLocalStorageVal('maxRating', state.maxRating);
                lmsCommand("", ["pref", "plugin."+LMS_P_RP+(LMS_P_RP=='ratingslight' ? ":usehalfstarratings" : ":rating_10scale"), "?"]).then(({data}) => {
                    if (data && data.result && data.result._p2 != null) {
                        state.maxRating = 1 == parseInt(data.result._p2) ? 10 : 5;
                        setLocalStorageVal('maxRating', state.maxRating);
                    }
                });
            }
            if (!queryParams.party) {
                var pass = getLocalStorageVal('password', '-');
                lmsCommand("", ["material-skin", "pass-check", "pass:"+(undefined==pass || 0==pass.length? "-" : pass)]).then(({data}) => {
                    if (1==parseInt(data.result.ok)) {
                        state.unlockAll = true;
                        bus.$emit('lockChanged');
                    }
                }).catch(err => {
                });
            }

            setDesktopWideCoverPad(state.nowPlayingFull);
            // Read defaults, stored on server
            lmsCommand("", ["pref", LMS_MATERIAL_UI_DEFAULT_PREF, "?"]).then(({data}) => {
                if (data && data.result && data.result._p2) {
                    try {
                        var prefs = JSON.parse(data.result._p2);
                        var opts = { theme: getLocalStorageVal('theme', undefined==prefs.theme ? state.chosenTheme : prefs.theme),
                                     color: getLocalStorageVal('color', undefined==prefs.color ? state.color : prefs.color),
                                     largerElements: getLocalStorageBool('largerElements', undefined==prefs.largerElements ? state.largerElements : prefs.largerElements),
                                     fontSize: getLocalStorageVal('fontSize', undefined==prefs.fontSize ? state.fontSize : prefs.fontSize)
                                    };
                        for (let i=0, len=boolItems.length; i<len; ++i) {
                            let key = boolItems[i];
                            opts[key] = getLocalStorageBool(key, undefined==prefs[key] ? state[key] : prefs[key]);
                        }
                        for (let i=0, len=intItems.length; i<len; ++i) {
                            let key = intItems[i];
                            opts[key] = parseInt(getLocalStorageVal(key, undefined==prefs[key] ? state[key] : prefs[key]));
                        }
                        if (undefined!=prefs.hidden && undefined==getLocalStorageVal('hidden', undefined)) {
                            opts.hidden=new Set(prefs.hidden);
                        }
                        if (undefined!=prefs.disabledBrowseModes && undefined==getLocalStorageVal('disabledBrowseModes', undefined)) {
                            opts.disabledBrowseModes=new Set(prefs.disabledBrowseModes);
                        }
                        if (undefined!=prefs.sorts) {
                            for (let [key, value] of Object.entries(prefs.sorts)) {
                                if (undefined==getLocalStorageVal(key, undefined)) {
                                    if (undefined==opts.sorts) {
                                        opts.sorts={};
                                    }
                                    opts.sorts[key]=value;
                                }
                            }
                        }
                        if (undefined==opts.fontSize && undefined!=opts.largerElements) {
                            opts.fontSize = opts.largerElements ? 'l' : 'r';
                        }
                        if (undefined!=prefs.mai) {
                            opts.mai=prefs.mai;
                        }
                        if (!pinQueueInSettings && undefined!=prefs.pinQueue) {
                            opts.pinQueue=prefs.pinQueue;
                        }
                        updateUiSettings(state, opts);
                    } catch(e) {
                    }
                }
                // Ensure theme is in settings, so that it can be use in classic skin mods...
                if (undefined==getLocalStorageVal('theme')) {
                    setLocalStorageVal('theme', state.chosenTheme);
                }
            });
        },
        setLibrary(state, lib) {
            if (state.library!=lib) {
                state.library = lib;
                setLocalStorageVal('library', state.library);
                bus.$emit('libraryChanged');
            }
        },
        setLocalIpAddresses(state, ips) {
            state.localIps = undefined==ips ? new Set() : new Set(Array.isArray(ips) ? ips : ips.split(","));
            setHaveLocalPlayer(state);
        },
        setPage(state, val) {
            // 'escPressed' goes to all 3 views, so need to ignore setPage calls
            // that are in quick succession
            let now = new Date().getTime();
            if (undefined!=state.lastSetPage && now-state.lastSetPage<=25) {
                return;
            }
            state.lastSetPage = now;
            if (val!=state.page) {
                state.prevPage = state.page;
                state.page = val;
                setLocalStorageVal('page', val);
                setLocalStorageVal('prevPage', state.prevPage);
                bus.$emit('pageChanged', val);
                emitTextColor();
            }
        },
        menuVisible(state, val) {
            if (val.shown) {
                state.visibleMenus.add(val.name);
                lmsNumVisibleMenus = state.visibleMenus.size;
                if (FAKE_MENU.has(val.name)) {
                    return;
                }
                bus.$emit('menuOpen');
                addBrowserHistoryItem();
                if (queryParams.botPad>18) {
                    setTimeout(function() {
                        let elems = document.getElementsByClassName('menuable__content__active');
                        if (null!=elems && 1==elems.length) {
                            let bcr = elems[0].getBoundingClientRect();
                            let r = {top:bcr.top, height:bcr.height, bottom:bcr.bottom};
                            let orig = {top:bcr.top, height:bcr.height, bottom:bcr.bottom};
                            let topMin = 8+queryParams.topPad;
                            let botMax = window.innerHeight-(queryParams.botPad+8);
                            if (r.bottom>botMax) {
                                r.bottom = botMax;
                            }
                            if (r.top<topMin) {
                                r.top = topMin;
                            } else if (r.bottom!=orig.bottom) {
                                let diff = Math.min(orig.bottom - r.bottom, r.top - topMin);
                                if (diff>0) {
                                    r.top-=diff;
                                }
                            }
                            if (r.top!=orig.top) {
                                elems[0].style.top = r.top+"px";
                            }
                            let h = r.bottom-r.top;
                            if (h!=orig.height) {
                                elems[0].style.height=h+"px";
                            }
                        }
                    }, 100);
                }
            } else {
                // Delay handling of menu being closed by 1/4 second. If a menu is closed
                // by 'esc' the 'esc' also falls through to the browse page. If we decrement
                // the number of open menus browse thinks none are open so processes the 'esc'
                // event!
                setTimeout(function() {
                    state.visibleMenus.delete(val.name);
                    lmsNumVisibleMenus = state.visibleMenus.size;
                }, 250);
            }
        },
        dialogOpen(state, val) {
            if (val.shown) {
                state.openDialogs.push(val.name);
                dialogPosition(state);
                addBrowserHistoryItem();
            } else {
                resetDialogPos();
                if (state.openDialogs.length>0) {
                    for (var len=state.openDialogs.length, i=len-1; i>=0; --i) {
                        if (state.openDialogs[i]==val.name) {
                            state.openDialogs.splice(i, 1);
                            state.lastDialogClose = new Date().getTime();
                            break;
                        }
                    }
                }
            }
            state.activeDialog = state.openDialogs.length>0 ? state.openDialogs[state.openDialogs.length-1] : undefined;
            if (0==state.openDialogs.length) {
                resetDialogPos();
            }
            emitToolbarColorsFromState(state);
            emitTextColor();
        },
        closeAllDialogs(state, val) {
            closePrevDialog(state);
        },
        setUpdatesAvailable(state, val) {
            state.updatesAvailable = val;
        },
        setRestartRequired(state, val) {
            state.restartRequired = val;
        },
        setPassword(state, pass) {
            setLocalStorageVal('password', pass);
            let unlockAllBefore = state.unlockAll;
            state.unlockAll = false;
            lmsCommand("", ["material-skin", "pass-check", "pass:"+(undefined==pass || 0==pass.length ? "-" : pass)]).then(({data}) => {
                if (1==parseInt(data.result.ok)) {
                    state.unlockAll = true;
                    if (state.unlockAll!=unlockAllBefore) {
                        bus.$emit('lockChanged');
                    }
                }
            }).catch(err => {
            });
        },
        checkPassword(state, srv) {
            var pass = getLocalStorageVal('password', '-');
            lmsCommand("", ["material-skin", "pass-check", "pass:"+(undefined==pass || 0==pass.length? "-" : pass)]).then(({data}) => {
                var ok = 1==parseInt(data.result.ok);
                if ( (ok && !state.unlockAll) || (!ok && state.unlockAll) ) {
                    state.unlockAll = ok;
                    bus.$emit('lockChanged');
                }
            }).catch(err => {
            });
        },
        setDesktopLayout(state, desktopLayout) {
            if (desktopLayout!=state.desktopLayout) {
                state.desktopLayout = desktopLayout;
                setLayout(desktopLayout);
                bus.$emit('layoutChanged');
            }
        },
        setIcon(state, playerIcon) {
            if (state.player && playerIcon.id==state.player.id) {
                state.player.icon=playerIcon.icon;
            }
            for (var i=0, len=state.players.length; i<len; ++i) {
                if (playerIcon.id==state.players[i].id) {
                    state.players[i].icon=playerIcon.icon;
                }
            }
        },
        setColor(state, playerColor) {
            if (state.player && playerColor.id==state.player.id) {
                state.player.color=playerColor.color;
                if (COLOR_USE_PER_PLAYER==state.colorUsage) {
                    state.color = mapPlayerColor(state.player);
                    setTheme(state.theme, state.color, true);
                }
            }
            for (var i=0, len=state.players.length; i<len; ++i) {
                if (playerColor.id==state.players[i].id) {
                    state.players[i].color=playerColor.color;
                }
            }
        },
        setShowQueue(state, val) {
            setQueueShown(state, val);
            addBrowserHistoryItem();
        },
        setShowQueueNp(state, val) {
            state.showQueueNp = val;
        },
        setPinQueue(state, val) {
            setQueuePinned(state, val);
        },
        setDownloadStatus(state, val) {
            state.downloadStatus = val;
        },
        toggleDarkLight(state) {
            let theme = autoTheme()+(state.coloredToolbars ? "-colored" : "");
            if (theme!=state.theme) {
                state.theme=theme;
                state.darkUi = !state.theme.startsWith('light') && state.theme.indexOf("/light/")<0;
                setTheme(state.theme, state.color);
                setTimeout(function() { emitToolbarColorsFromState(state, true) }, 250);
                setTimeout(function() { emitToolbarColorsFromState(state, true) }, 500);
                bus.$emit('themeChanged');
            }
        },
        setQueueAlbumStyle(state, val) {
            state.queueAlbumStyle = val;
            setLocalStorageVal('queueAlbumStyle', state.queueAlbumStyle);
            bus.$emit('queueDisplayChanged');
        },
        setHome3rdPartyExtraLists(state, val) {
            lmsOptions.home3rdPartyExtraLists = val;
            state.detailedHomeItems = checkHomeItems(state.detailedHomeItems);
            bus.$emit('refresh-home');
        }
    }
})

