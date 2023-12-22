/**
 * LMS-Material
 *
 * Copyright (c) 2018-2023 Craig Drummond <craig.p.drummond@gmail.com>
 * MIT license.
 */
'use strict';

var lmsNumVisibleMenus = 0;

function copyPlayer(p){
    return {id:p.id, name:p.name, isgroup:p.isgroup, model:p.model, ip:p.ip, icon:p.icon, link:p.link, ison:p.ison, isplaying:p.isplaying, isconnected:p.isconnected, canpoweroff:p.canpoweroff};
}

function updateUiSettings(state, val) {
    var queueDisplayChanged = false;
    let stdItems = ['autoScrollQueue', 'browseBackdrop', 'queueBackdrop', 'nowPlayingBackdrop', 'infoBackdrop',
                    'browseTechInfo', 'techInfo', 'nowPlayingTrackNum', 'swipeVolume', 'swipeChangeTrack',
                    'keyboardControl', 'skipSeconds', 'powerButton', 'mediaControls', 'showRating', 'browseContext',
                    'nowPlayingContext', 'queueContext'];
    for (let i=0, len=stdItems.length; i<len; ++i) {
        let key=stdItems[i];
        if (undefined!=val[key] && state[key]!=val[key]) {
            state[key] = val[key];
            setLocalStorageVal(key, state[key]);
            if ('queueContext'==key) {
                queueDisplayChanged = true;
            }
        }
    }

    var browseDisplayChanged = false;
    var relayoutGrid = false;
    var themeChanged = false;
    var prevColor = state.color;
    if (undefined!=val.theme && state.chosenTheme!=val.theme) {
        state.chosenTheme=val.theme;
        state.coloredToolbars = state.chosenTheme.endsWith("-colored");
        state.theme=state.chosenTheme.startsWith(AUTO_THEME) ? defaultTheme()+(state.coloredToolbars ? "-colored" : "") : state.chosenTheme;
        setLocalStorageVal('theme', state.chosenTheme);
        themeChanged = true;
    }
    if (undefined!=val.color && state.color!=val.color) {
        state.color = val.color;
        setLocalStorageVal('color', state.color);
        themeChanged = true;
    }
    if (undefined!=val.homeButton && state.homeButton!=val.homeButton) {
        state.homeButton = val.homeButton;
        setLocalStorageVal('homeButton', state.homeButton);
        document.documentElement.style.setProperty('--home-button-size', state.homeButton ? '42px' : '0px');
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
        setTheme(state.theme, state.color, prevColor);
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
    if (undefined!=val.screensaver && state.screensaver!=val.screensaver) {
        state.screensaver = val.screensaver;
        setLocalStorageVal('screensaver', state.screensaver);
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
}

function defaultTheme(standard) {
    const prefersLight = standard ? false : (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches);
    // Keep in sync with index.html
    if (IS_IOS) {
        return prefersLight ? "light" : "darker";
    } else if (IS_ANDROID) {
        return prefersLight ? "light" : "darker";
    } else if (navigator.platform.indexOf("Linux") != -1) {
        return window.location.href.indexOf('desktop=KDE') != -1
                    ? (prefersLight ? "linux/light/Breeze" : "linux/dark/Breeze-Dark")
                    : (prefersLight ? "linux/light/Adwaita" : "linux/dark/Adwaita-Dark");
    } else if (navigator.platform.indexOf("Win") != -1) {
        return prefersLight ? "windows/light/Windows-10" : "windows/dark/Windows-10-Dark";
    } else if (navigator.platform.indexOf("Mac") != -1) {
        return prefersLight ? "mac/light/Mojave" : "mac/dark/Mojave-Dark";
    }
    return "darker";
}

function storeCurrentPlayer(player) {
    setLocalStorageVal('player', player.id);
    if (1==queryParams.nativePlayer) {
        try {
            NativeReceiver.updatePlayer(player.id, player.name);
        } catch (e) {
        }
    } else if (queryParams.nativePlayer>0) {
        emitNative("MATERIAL-PLAYER\nID "+player.id+"\nNAME "+player.name, queryParams.nativePlayer);
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

function setQueueShown(state, val) {
    if (val!=state.showQueue) {
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
        document.documentElement.style.setProperty('--queue-visibility', val ? 'initial' : 'collapse');
        document.documentElement.style.setProperty('--queue-minwidth', val && state.pinQueue ? '275px' : '0px');
        document.documentElement.style.setProperty('--splitter-width', val && state.pinQueue ? '1px' : '0px');
        document.documentElement.style.setProperty('--splitter-hidden', val && state.pinQueue ? '0' : '100');
    }
}

function setQueuePinned(state, val) {
    if (val!=state.pinQueue) {
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

const store = new Vuex.Store({
    state: {
        desktopLayout: false,
        mobileBar: MBAR_THIN,
        showQueue: true,
        pinQueue: true,
        players: null, // List of players
        player: null, // Current player (from list)
        defaultPlayer: null,
        otherPlayers: [], // Players on other servers
        theme: defaultTheme(true),        // Set to dark/light if theme is "auto"
        chosenTheme: defaultTheme(true),  // Theme as chosen by user
        color: 'blue',
        darkUi: true,
        roundCovers: true,
        fontSize: 'r',
        sortFavorites:true,
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
        browseContext: false,
        nowPlayingContext: true,
        queueContext: false,
        maxRating: 5,
        showRating: false,
        page:'browse',
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
        skipSeconds: 30,
        screensaver: false,
        homeButton: false,
        lang: 'en-US',
        twentyFourHour: false,
        powerButton: false,
        mediaControls: false,
        downloadStatus: [],
        coloredToolbars: false
    },
    mutations: {
        updatePlayer(state, player) {
            for (var i=0, len=state.players.length; i<len; ++i) {
                if (state.players[i].id==player.id) {
                    state.players[i].name = player.name;
                    state.players[i].ison = player.ison;
                    state.players[i].isplaying = player.isplaying;
                    state.players[i].isgroup = player.isgroup;
                    state.players[i].icon = player.icon;
                    if (state.player!=undefined && player.id == state.player.id) {
                        state.player.name = player.name;
                        state.player.ison = player.ison;
                        state.player.isplaying = player.isplaying;
                        state.player.isgroup = player.isgroup;
                        state.player.icon = player.icon;
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
                    state.players[i].link = players[i].link;
                }
                return;
            }

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
            }
            if (added.size>0) {
                bus.$emit("playersAdded", [...added]);
            }

            state.players=players;

            // If default player re-appears (#387) then switch to this
            var defaultSet = false;
            var autoSelect = undefined!=queryParams.player && queryParams.player.indexOf(':')>0 ? queryParams.player : state.defaultPlayer;
            if (undefined!=autoSelect && added.has(autoSelect)) {
                for (var i=0, len=state.players.length; i<len; ++i) {
                    if (state.players[i].id === autoSelect) {
                        state.player = copyPlayer(state.players[i]);
                        storeCurrentPlayer(state.player);
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
                            storeCurrentPlayer(state.player);
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
                                storeCurrentPlayer(state.player);
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
                                storeCurrentPlayer(state.player);
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
            bus.$emit('playerChanged');
        },
        setPlayer(state, id) {
            if (state.players) {
                for (var i=0, len=state.players.length; i<len; ++i) {
                    if (state.players[i].id === id) {
                        state.player = copyPlayer(state.players[i]);
                        storeCurrentPlayer(state.player);
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
        initUiSettings(state) {
            updateLang(state, window.navigator.userLanguage || window.navigator.language);
            state.defaultPlayer = getLocalStorageVal('defaultPlayer', state.defaultPlayer);
            state.page = getLocalStorageVal('page', state.page);
            state.chosenTheme = getLocalStorageVal('theme', state.chosenTheme);
            state.coloredToolbars = state.chosenTheme.endsWith("-colored");
            state.theme=state.chosenTheme.startsWith(AUTO_THEME) ? defaultTheme()+(state.coloredToolbars ? "-colored" : "") : state.chosenTheme;
            state.darkUi = !state.theme.startsWith('light') && state.theme.indexOf("/light/")<0;
            state.color = getLocalStorageVal('color', state.color);
            var larger = getLocalStorageBool('largerElements', getLocalStorageBool('largeFonts', undefined));
            var fontSize = getLocalStorageVal('fontSize', undefined);
            if (undefined==fontSize && undefined!=larger) {
                fontSize = larger ? 'l' : 'r';
                setLocalStorageVal('fontSize', fontSize);
            }
            state.fontSize = undefined==fontSize ? 'r' : fontSize;

            let boolItems = ['roundCovers', 'autoScrollQueue', 'sortFavorites', 'browseBackdrop', 'queueBackdrop', 'nowPlayingBackdrop',
                             'infoBackdrop', 'useDefaultBackdrops', 'browseTechInfo', 'techInfo', 'queueShowTrackNum', 'nowPlayingTrackNum',
                             'nowPlayingClock', 'swipeVolume', 'swipeChangeTrack', 'keyboardControl', 'screensaver', 'homeButton',
                             'powerButton', 'mediaControls', 'queueAlbumStyle', 'queueThreeLines', 'browseContext', 'nowPlayingContext',
                             'queueContext'];
            for (let i=0, len=boolItems.length; i<len; ++i) {
                let key = boolItems[i];
                state[key] = getLocalStorageBool(key, state[key]);
            }
            let intItems = ['skipSeconds', 'mobileBar', 'maxRating', 'volumeStep'];
            for (let i=0, len=intItems.length; i<len; ++i) {
                let key = intItems[i];
                state[key] = parseInt(getLocalStorageVal(key, state[key]));
            }
            if (state.homeButton) {
                document.documentElement.style.setProperty('--home-button-size', '42px');
            }
            setQueuePinned(state, window.innerWidth>=MIN_PQ_PIN_WIDTH && getLocalStorageBool('pinQueue', state.pinQueue));
            setQueueShown(state, state.pinQueue && getLocalStorageBool('showQueue', state.showQueue));

            state.disabledBrowseModes = new Set(JSON.parse(getLocalStorageVal('disabledBrowseModes', '["myMusicFlopTracks", "myMusicTopTracks", "myMusicMusicFolder", "myMusicFileSystem", "myMusicArtistsComposers", "myMusicArtistsConductors", "myMusicArtistsJazzComposers", "myMusicAlbumsAudiobooks"]')));
            state.hidden = new Set(JSON.parse(getLocalStorageVal('hidden', JSON.stringify([TOP_EXTRAS_ID]))));
            state.showRating = LMS_STATS_ENABLED && getLocalStorageBool('showRating', state.showRating);
            state.library = getLocalStorageVal('library', state.library);
            setTheme(state.theme, state.color);
            setRoundCovers(state.roundCovers);
            if (state.fontSize!='r') {
                setFontSize(state.fontSize);
            }
            lmsOptions.techInfo = state.browseTechInfo;
            // Max rating (for trackstat)
            if (LMS_P_RP=='trackstat') {
                state.maxRating = 5;
                setLocalStorageVal('maxRating', state.maxRating);
                lmsCommand("", ["pref", "plugin."+LMS_P_RP+":rating_10scale", "?"]).then(({data}) => {
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
        setPage(state, val) {
            if (val!=state.page) {
                state.page = val;
                setLocalStorageVal('page', val);
                bus.$emit('pageChanged', val);
            }
        },
        menuVisible(state, val) {
            if (val.shown) {
                state.visibleMenus.add(val.name);
                lmsNumVisibleMenus = state.visibleMenus.size;
                bus.$emit('menuOpen');
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
            } else if (state.openDialogs.length>0) {
                for (var len=state.openDialogs.length, i=len-1; i>=0; --i) {
                    if (state.openDialogs[i]==val.name) {
                        state.openDialogs.splice(i, 1);
                        state.lastDialogClose = new Date().getTime();
                        break;
                    }
                }
            }

            state.activeDialog = state.openDialogs.length>0 ? state.openDialogs[state.openDialogs.length-1] : undefined;
            emitToolbarColorsFromState(state);
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
        setShowQueue(state, val) {
            setQueueShown(state, val);
        },
        setPinQueue(state, val) {
            setQueuePinned(state, val);
        },
        setDownloadStatus(state, val) {
            state.downloadStatus = val;
        },
        toggleDarkLight(state) {
            let def = defaultTheme()+(state.coloredToolbars ? "-colored" : "");
            if (def!=state.theme) {
                state.theme=def;
                state.darkUi = !state.theme.startsWith('light') && state.theme.indexOf("/light/")<0;
                setTheme(state.theme, state.color);
                bus.$emit('themeChanged');
            }
        },
        setQueueAlbumStyle(state, val) {
            state.queueAlbumStyle = val;
            setLocalStorageVal('queueAlbumStyle', state.queueAlbumStyle);
            bus.$emit('queueDisplayChanged');
        }
    }
})

