/**
 * LMS-Material
 *
 * Copyright (c) 2018-2023 Craig Drummond <craig.p.drummond@gmail.com>
 * MIT license.
 */
'use strict';

var lmsNumVisibleMenus = 0;

function copyPlayer(p){
    return {id:p.id, name:p.name, isgroup:p.isgroup, model:p.model, ip:p.ip, icon:p.icon, link:p.link, ison:p.ison, isconnected:p.isconnected, canpoweroff:p.canpoweroff};
}

function updateUiSettings(state, val) {
    var browseDisplayChanged = false;
    var queueDisplayChanged = false;
    var relayoutGrid = false;
    var themeChanged = false;
    var prevColor = state.color;
    if (undefined!=val.theme && state.theme!=val.theme) {
        state.theme = val.theme;
        setLocalStorageVal('theme', state.theme);
        themeChanged = true;
        state.coloredToolbars = state.theme.endsWith("-colored");
    }
    if (val.color==COLOR_FROM_COVER && IS_IOS) {
        val.color='blue';
    }
    if (undefined!=val.color && state.color!=val.color) {
        state.color = val.color;
        setLocalStorageVal('color', state.color);
        themeChanged = true;
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
    if (undefined!=val.letterOverlay && state.letterOverlay!=val.letterOverlay) {
        state.letterOverlay = val.letterOverlay;
        setLocalStorageVal('letterOverlay', state.letterOverlay);
        browseDisplayChanged = true;
    }
    if (undefined!=val.autoScrollQueue && state.autoScrollQueue!=val.autoScrollQueue) {
        state.autoScrollQueue = val.autoScrollQueue;
        setLocalStorageVal('autoScrollQueue', state.autoScrollQueue);
    }
    if (undefined!=val.stopButton && state.stopButton!=val.stopButton) {
        state.stopButton = val.stopButton;
        setLocalStorageVal('stopButton', state.stopButton);
    }
    if (undefined!=val.browseBackdrop && state.browseBackdrop!=val.browseBackdrop) {
        state.browseBackdrop = val.browseBackdrop;
        setLocalStorageVal('browseBackdrop', state.browseBackdrop);
    }
    if (undefined!=val.queueBackdrop && state.queueBackdrop!=val.queueBackdrop) {
        state.queueBackdrop = val.queueBackdrop;
        setLocalStorageVal('queueBackdrop', state.queueBackdrop);
    }
    if (undefined!=val.nowPlayingBackdrop && state.nowPlayingBackdrop!=val.nowPlayingBackdrop) {
        state.nowPlayingBackdrop = val.nowPlayingBackdrop;
        setLocalStorageVal('nowPlayingBackdrop', state.nowPlayingBackdrop);
    }
    if (undefined!=val.infoBackdrop && state.infoBackdrop!=val.infoBackdrop) {
        state.infoBackdrop = val.infoBackdrop;
        setLocalStorageVal('infoBackdrop', state.infoBackdrop);
    }
    if (undefined!=val.browseTechInfo && state.browseTechInfo!=val.browseTechInfo) {
        state.browseTechInfo = val.browseTechInfo;
        setLocalStorageVal('browseTechInfo', state.browseTechInfo);
    }
    if (undefined!=val.techInfo && state.techInfo!=val.techInfo) {
        state.techInfo = val.techInfo;
        setLocalStorageVal('techInfo', state.techInfo);
    }
    if (undefined!=val.queueShowTrackNum && state.queueShowTrackNum!=val.queueShowTrackNum) {
        state.queueShowTrackNum = val.queueShowTrackNum;
        setLocalStorageVal('queueShowTrackNum', state.queueShowTrackNum);
        queueDisplayChanged = true;
    }
    if (undefined!=val.nowPlayingTrackNum && state.nowPlayingTrackNum!=val.nowPlayingTrackNum) {
        state.nowPlayingTrackNum = val.nowPlayingTrackNum;
        setLocalStorageVal('nowPlayingTrackNum', state.nowPlayingTrackNum);
    }
    if (undefined!=val.nowPlayingClock && state.nowPlayingClock!=val.nowPlayingClock) {
        state.nowPlayingClock = val.nowPlayingClock;
        setLocalStorageVal('nowPlayingClock', state.nowPlayingClock);
        bus.$emit('nowPlayingClockChanged');
    }
    if (undefined!=val.nowPlayingContext && state.nowPlayingContext!=val.nowPlayingContext) {
        state.nowPlayingContext = val.nowPlayingContext;
        setLocalStorageVal('nowPlayingContext', state.nowPlayingContext);
    }
    if (undefined!=val.volumeStep && lmsOptions.volumeStep!=val.volumeStep) {
        lmsOptions.volumeStep = val.volumeStep;
        setLocalStorageVal('volumeStep', lmsOptions.volumeStep);
    }
    if (undefined!=val.sortHome && state.sortHome!=val.sortHome) {
        state.sortHome = val.sortHome;
        setLocalStorageVal('sortHome', state.sortHome);
        browseDisplayChanged = true;
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
    if (undefined!=val.swipeVolume && state.swipeVolume!=val.swipeVolume) {
        state.swipeVolume = val.swipeVolume;
        setLocalStorageVal('swipeVolume', state.swipeVolume);
    }
    if (undefined!=val.swipeChangeTrack && state.swipeChangeTrack!=val.swipeChangeTrack) {
        state.swipeChangeTrack = val.swipeChangeTrack;
        setLocalStorageVal('swipeChangeTrack', state.swipeChangeTrack);
    }
    if (undefined!=val.keyboardControl && state.keyboardControl!=val.keyboardControl) {
        state.keyboardControl = val.keyboardControl;
        setLocalStorageVal('keyboardControl', state.keyboardControl);
    }
    if (undefined!=val.queueThreeLines && state.queueThreeLines!=val.queueThreeLines) {
        state.queueThreeLines = val.queueThreeLines;
        setLocalStorageVal('queueThreeLines', state.queueThreeLines);
        queueDisplayChanged = true;
    }
    if (undefined!=val.showArtwork && state.showArtwork!=val.showArtwork) {
        state.showArtwork = val.showArtwork;
        setLocalStorageVal('showArtwork', state.showArtwork);
    }
    if (undefined!=val.skipSeconds && state.skipSeconds!=val.skipSeconds) {
        state.skipSeconds = val.skipSeconds;
        setLocalStorageVal('skipSeconds', state.skipSeconds);
    }
    if (undefined!=val.screensaver && state.screensaver!=val.screensaver) {
        state.screensaver = val.screensaver;
        setLocalStorageVal('screensaver', state.screensaver);
        bus.$emit('screensaverDisplayChanged');
    }
    if (undefined!=val.homeButton && state.homeButton!=val.homeButton) {
        state.homeButton = val.homeButton;
        setLocalStorageVal('homeButton', state.homeButton);
    }
    if (undefined!=val.powerButton && state.powerButton!=val.powerButton) {
        state.powerButton = val.powerButton;
        setLocalStorageVal('powerButton', state.powerButton);
    }
    if (undefined!=val.largeCovers && state.largeCovers!=val.largeCovers) {
        state.largeCovers = val.largeCovers;
        setLocalStorageVal('largeCovers', state.largeCovers);
        relayoutGrid = true;
    }
    if (undefined!=val.listPadding && state.listPadding!=val.listPadding) {
        state.listPadding = val.listPadding;
        setLocalStorageVal('listPadding', state.listPadding);
        setListPadding(state.listPadding);
    }
    if (undefined!=val.mediaControls && state.mediaControls!=val.mediaControls) {
        state.mediaControls = val.mediaControls;
        setLocalStorageVal('mediaControls', state.mediaControls);
    }
    if (undefined!=val.showRating && state.showRating!=val.showRating) {
        state.showRating = val.showRating;
        setLocalStorageVal('showRating', state.showRating);
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
    lmsOptions.techInfo = state.browseTechInfo;
    lmsOptions.infoPlugin = state.infoPlugin;
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

function defaultTheme() {
    // Keep in sync with index.html
    if (IS_IOS) {
        return "darker";
    } else if (IS_ANDROID) {
        return "darker";
    } else if (navigator.platform.indexOf("Linux") != -1) {
        return window.location.href.indexOf('desktop=KDE') != -1 ? "linux/dark/Breeze-Dark" : "linux/dark/Adwaita-Dark";
    } else if (navigator.platform.indexOf("Win") != -1) {
        return "windows/dark/Windows-10-Dark";
    } else if (navigator.platform.indexOf("Mac") != -1) {
        return "mac/dark/Mojave-Dark";
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
    } else if (2==queryParams.nativePlayer) {
        console.log("MATERIAL-PLAYER\nID "+player.id+"\nNAME "+player.name);
    }
}

function setRatingsPlugin(state, plugins) {
    let plugin = plugins.shift();
    lmsCommand("", ["can", plugin, "setrating", "?"]).then(({data}) => {
        if (data && data.result && undefined!=data.result._can && 1==data.result._can) {
            state.ratingsPlugin = plugin;
            setLocalStorageVal('ratingsPlugin', state.ratingsPlugin);
            if (plugin=="ratingslight") {
                state.maxRating = 10;
                setLocalStorageVal('maxRating', state.maxRating);
            } else {
                state.maxRating = 5;
                setLocalStorageVal('maxRating', state.maxRating);
                lmsCommand("", ["pref", "plugin."+plugin+":rating_10scale", "?"]).then(({data}) => {
                    if (data && data.result && data.result._p2 != null) {
                        state.maxRating = 1 == parseInt(data.result._p2) ? 10 : 5;
                        setLocalStorageVal('maxRating', state.maxRating);
                    }
                });
            }
        } else if (plugins.length>0) {
            setRatingsPlugin(state, plugins);
        }
    });
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

const store = new Vuex.Store({
    state: {
        desktopLayout: false,
        showQueue: true,
        players: null, // List of players
        player: null, // Current player (from list)
        defaultPlayer: null,
        otherPlayers: [], // Players on other servers
        theme: defaultTheme(),
        color: 'blue',
        darkUi: true,
        roundCovers: true,
        fontSize: 'r',
        letterOverlay:false,
        sortFavorites:true,
        autoScrollQueue:true,
        library: null,
        infoPlugin: false,
        dstmPlugin: false,
        customSkipPlugin: false,
        stopButton: false,
        browseBackdrop: true,
        queueBackdrop: true,
        nowPlayingBackdrop: true,
        infoBackdrop: true,
        techInfo: false,
        queueShowTrackNum: true,
        nowPlayingTrackNum: false,
        nowPlayingClock: false,
        nowPlayingContext: true,
        ratingsPlugin: undefined,
        maxRating: 5,
        showRating: false,
        page:'browse',
        sortHome: IS_IPHONE,
        hidden: new Set(),
        visibleMenus: new Set(),
        disabledBrowseModes: new Set(),
        swipeVolume: false,
        swipeChangeTrack: false,
        keyboardControl: true,
        updatesAvailable: new Set(),
        restartRequired: false,
        queueThreeLines: true,
        showArtwork: true,
        openDialogs: [],
        activeDialog: undefined,
        unlockAll: false,
        skipSeconds: 30,
        screensaver: false,
        homeButton: false,
        lang: 'en-US',
        twentyFourHour: false,
        powerButton: false,
        largeCovers: false,
        mediaControls: false,
        downloadStatus: [],
        updateNotif: {msg:undefined, title:undefined},
        notifications: [],
        coloredToolbars: false,
        listPadding: 0
    },
    mutations: {
        updatePlayer(state, player) {
            for (var i=0, len=state.players.length; i<len; ++i) {
                if (state.players[i].id==player.id) {
                    state.players[i].name = player.name;
                    state.players[i].ison = player.ison;
                    state.players[i].isgroup = player.isgroup;
                    state.players[i].icon = player.icon;
                    if (state.player!=undefined && player.id == state.player.id) {
                        state.player.name = player.name;
                        state.player.ison = player.ison;
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
            state.theme = getLocalStorageVal('theme', state.theme);
            state.roundCovers = getLocalStorageBool('roundCovers', state.roundCovers);
            state.coloredToolbars = state.theme.endsWith("-colored");
            state.darkUi = !state.theme.startsWith('light') && state.theme.indexOf("/light/")<0;
            state.color = getLocalStorageVal('color', state.color);
            if (state.color==COLOR_FROM_COVER && IS_IOS) {
                state.color='blue';
            }
            var larger = getLocalStorageBool('largerElements', getLocalStorageBool('largeFonts', undefined));
            var fontSize = getLocalStorageVal('fontSize', undefined);
            if (undefined==fontSize && undefined!=larger) {
                fontSize = larger ? 'l' : 'r';
                setLocalStorageVal('fontSize', fontSize);
            }
            state.fontSize = undefined==fontSize ? 'r' : fontSize;
            state.autoScrollQueue = getLocalStorageBool('autoScrollQueue', state.autoScrollQueue);
            state.library = getLocalStorageVal('library', state.library);
            state.sortFavorites = getLocalStorageBool('sortFavorites', state.sortFavorites);
            state.letterOverlay = getLocalStorageBool('letterOverlay', state.letterOverlay);
            state.infoPlugin = getLocalStorageBool('infoPlugin', state.infoPlugin);
            state.dstmPlugin = getLocalStorageBool('dstmPlugin', state.dstmPlugin);
            state.customSkipPlugin = getLocalStorageBool('customSkipPlugin', state.customSkipPlugin);
            state.stopButton = getLocalStorageBool('stopButton', state.stopButton);
            state.browseBackdrop = getLocalStorageBool('browseBackdrop', state.browseBackdrop);
            state.queueBackdrop = getLocalStorageBool('queueBackdrop', state.queueBackdrop);
            state.nowPlayingBackdrop = getLocalStorageBool('nowPlayingBackdrop', state.nowPlayingBackdrop);
            state.infoBackdrop = getLocalStorageBool('infoBackdrop', state.infoBackdrop);
            state.browseTechInfo = getLocalStorageBool('browseTechInfo', state.browseTechInfo);
            state.techInfo = getLocalStorageBool('techInfo', state.techInfo);
            state.queueShowTrackNum = getLocalStorageBool('queueShowTrackNum', state.queueShowTrackNum);
            state.nowPlayingTrackNum = getLocalStorageBool('nowPlayingTrackNum', state.nowPlayingTrackNum);
            state.nowPlayingClock = getLocalStorageBool('nowPlayingClock', state.nowPlayingClock);
            state.nowPlayingContext = getLocalStorageBool('nowPlayingContext', state.nowPlayingContext);
            state.ratingsPlugin = getLocalStorageVal('ratingsPlugin', state.ratingsPlugin);
            state.maxRating = getLocalStorageBool('maxRating', state.maxRating);
            state.showRating = LMS_STATS_ENABLED && getLocalStorageBool('showRating', state.showRating);
            state.sortHome = getLocalStorageBool('sortHome', state.sortHome);
            state.hidden = new Set(JSON.parse(getLocalStorageVal('hidden', JSON.stringify([TOP_EXTRAS_ID]))));
            state.swipeVolume = getLocalStorageBool('swipeVolume', state.swipeVolume);
            state.swipeChangeTrack = getLocalStorageBool('swipeChangeTrack', state.swipeChangeTrack);
            state.keyboardControl = getLocalStorageBool('keyboardControl', state.keyboardControl);
            state.queueThreeLines = getLocalStorageBool('queueThreeLines', state.queueThreeLines);
            state.showArtwork = getLocalStorageBool('showArtwork', state.showArtwork);
            state.skipSeconds = parseInt(getLocalStorageVal('skipSeconds', state.skipSeconds));
            state.screensaver = getLocalStorageBool('screensaver', state.screensaver);
            state.homeButton = getLocalStorageBool('homeButton', state.homeButton);
            state.disabledBrowseModes = new Set(JSON.parse(getLocalStorageVal('disabledBrowseModes', '["myMusicFlopTracks", "myMusicTopTracks", "myMusicMusicFolder", "myMusicFileSystem", "myMusicArtistsComposers", "myMusicArtistsConductors", "myMusicArtistsJazzComposers", "myMusicAlbumsAudiobooks"]')));
            state.powerButton = getLocalStorageBool('powerButton', state.powerButton);
            state.largeCovers = getLocalStorageBool('largeCovers', state.largeCovers);
            state.listPadding = parseInt(getLocalStorageVal('listPadding', state.listPadding));
            state.mediaControls = getLocalStorageBool('mediaControls', state.mediaControls);
            setTheme(state.theme, state.color);
            setRoundCovers(state.roundCovers);
            if (state.fontSize!='r') {
                setFontSize(state.fontSize);
            }
            setListPadding(state.listPadding);
            lmsOptions.techInfo = state.browseTechInfo;
            lmsOptions.infoPlugin = state.infoPlugin;

            // Get server prefs  for:
            //   All Artists + Album Artists, or just Artists?
            //   Filer albums/tracks on genre?
            //   Filter album/tracks on role?
            lmsCommand("", ["serverstatus", 0, 0, "prefs:useUnifiedArtistsList,noGenreFilter,noRoleFilter,browseagelimit,useLocalImageproxy,variousArtistsString,groupdiscs"]).then(({data}) => {
                if (data && data.result) {
                    lmsOptions.separateArtists = 1!=parseInt(data.result.useUnifiedArtistsList);
                    if (lmsOptions.separateArtists!=getLocalStorageBool('separateArtists', false)) {
                        setLocalStorageVal('separateArtists', lmsOptions.separateArtists);
                        clearListCache(true);
                    }

                    lmsOptions.noGenreFilter = 1==parseInt(data.result.noGenreFilter);
                    setLocalStorageVal('noGenreFilter', lmsOptions.noGenreFilter);
                    lmsOptions.noRoleFilter = 1==parseInt(data.result.noRoleFilter);
                    setLocalStorageVal('noRoleFilter', lmsOptions.noRoleFilter);
                    if (undefined!=data.result.browseagelimit) {
                        lmsOptions.newMusicLimit = parseInt(data.result.browseagelimit);
                    }

                    lmsOptions.useMySqueezeboxImageProxy = undefined==data.result.useLocalImageproxy || 0 == parseInt(data.result.useLocalImageproxy);
                    setLocalStorageVal('useMySqueezeboxImageProxy', lmsOptions.useMySqueezeboxImageProxy);

                    lmsOptions.variousArtistsString = undefined==data.result.variousArtistsString || data.result.variousArtistsString.length<1 ? 'Various Artists' : data.result.variousArtistsString;
                    setLocalStorageVal('variousArtistsString', lmsOptions.variousArtistsString);

                    lmsOptions.groupdiscs = 1 == parseInt(data.result.groupdiscs);
                    setLocalStorageVal('groupdiscs', lmsOptions.groupdiscs);
                }
            });
            // Artist images?
            lmsCommand("", ["pref", "plugin.musicartistinfo:browseArtistPictures", "?"]).then(({data}) => {
                lmsOptions.artistImages = data && data.result && data.result._p2 != null && 1==data.result._p2;
                setLocalStorageVal('artistImages', lmsOptions.artistImages);
            });
            // Emblems?
            lmsCommand("", ["pref", "plugin.onlinelibrary:enableServiceEmblem", "?"]).then(({data}) => {
                lmsOptions.serviceEmblems = data && data.result && data.result._p2 != null && 1==data.result._p2;
                setLocalStorageVal('serviceEmblems', lmsOptions.serviceEmblems);
            });
            // Music and Artist info plugin installled?
            lmsCommand("", ["can", "musicartistinfo", "biography", "?"]).then(({data}) => {
                state.infoPlugin = data && data.result && data.result._can ? true : false;
                setLocalStorageVal('infoPlugin', state.infoPlugin);
                lmsOptions.infoPlugin = state.infoPlugin;
            }).catch(err => {
            });
            // YouTube plugin installled?
            lmsCommand("", ["can", "youtube", "items", "?"]).then(({data}) => {
                lmsOptions.youTubePlugin = data && data.result && data.result._can ? true : false;
                setLocalStorageVal('youTubePlugin', lmsOptions.youTubePlugin);
            }).catch(err => {
            });
            // Don't Stop The Music installed?
            lmsCommand("", ["pref", "plugin.state:DontStopTheMusic", "?"]).then(({data}) => {
                state.dstmPlugin = data && data.result && null!=data.result._p2 && "disabled"!=data.result._p2 && "?"!=data.result._p2;
                setLocalStorageVal('dstmPlugin', state.dstmPlugin);
            }).catch(err => {
            });
            // CustomSkip installed?
            lmsCommand("", ["pref", "plugin.state:CustomSkip", "?"]).then(({data}) => {
                state.customSkipPlugin = data && data.result && null!=data.result._p2 && "disabled"!=data.result._p2;
                setLocalStorageVal('customSkipPlugin', state.customSkipPlugin);
                if (!state.customSkipPlugin) {
                    lmsCommand("", ["pref", "plugin.state:CustomSkip3", "?"]).then(({data}) => {
                        state.customSkipPlugin = data && data.result && null!=data.result._p2 && "disabled"!=data.result._p2;
                        setLocalStorageVal('customSkipPlugin', state.customSkipPlugin);
                    }).catch(err => {
                    });
                }
            }).catch(err => {
            });

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
                        var opts = { theme: getLocalStorageVal('theme', undefined==prefs.theme ? state.theme : prefs.theme),
                                     color: getLocalStorageVal('color', undefined==prefs.color ? state.color : prefs.color),
                                     roundCovers: getLocalStorageBool('roundCovers', undefined==prefs.roundCovers ? state.roundCovers : prefs.roundCovers),
                                     largerElements: getLocalStorageBool('largerElements', undefined==prefs.largerElements ? state.largerElements : prefs.largerElements),
                                     fontSize: getLocalStorageVal('fontSize', undefined==prefs.fontSize ? state.fontSize : prefs.fontSize),
                                     autoScrollQueue: getLocalStorageBool('autoScrollQueue', undefined==prefs.autoScrollQueue ? state.autoScrollQueue : prefs.autoScrollQueue),
                                     letterOverlay: getLocalStorageBool('letterOverlay', undefined==prefs.letterOverlay ? state.letterOverlay : prefs.letterOverlay),
                                     sortFavorites: getLocalStorageBool('sortFavorites', undefined==prefs.sortFavorites ? state.sortFavorites : prefs.sortFavorites),
                                     stopButton: getLocalStorageBool('stopButton', undefined==prefs.stopButton ? state.stopButton : prefs.stopButton),
                                     browseBackdrop: getLocalStorageBool('browseBackdrop', undefined==prefs.browseBackdrop ? state.browseBackdrop : prefs.browseBackdrop),
                                     queueBackdrop: getLocalStorageBool('queueBackdrop', undefined==prefs.queueBackdrop ? state.queueBackdrop : prefs.queueBackdrop),
                                     nowPlayingBackdrop: getLocalStorageBool('nowPlayingBackdrop', undefined==prefs.nowPlayingBackdrop ? state.nowPlayingBackdrop : prefs.nowPlayingBackdrop),
                                     infoBackdrop: getLocalStorageBool('infoBackdrop', undefined==prefs.infoBackdrop ? state.infoBackdrop : prefs.infoBackdrop),
                                     browseTechInfo: getLocalStorageBool('browseTechInfo', undefined==prefs.browseTechInfo ? state.browseTechInfo : prefs.browseTechInfo),
                                     techInfo: getLocalStorageBool('techInfo', undefined==prefs.techInfo ? state.techInfo : prefs.techInfo),
                                     queueShowTrackNum: getLocalStorageBool('queueShowTrackNum', undefined==prefs.queueShowTrackNum ? state.queueShowTrackNum : prefs.queueShowTrackNum),
                                     nowPlayingTrackNum: getLocalStorageBool('nowPlayingTrackNum', undefined==prefs.nowPlayingTrackNum ? state.nowPlayingTrackNum : prefs.nowPlayingTrackNum),
                                     nowPlayingClock: getLocalStorageBool('nowPlayingClock', undefined==prefs.nowPlayingClock ? state.nowPlayingClock : prefs.nowPlayingClock),
                                     nowPlayingContext: getLocalStorageBool('nowPlayingContext', undefined==prefs.nowPlayingContext ? state.nowPlayingContext : prefs.nowPlayingContext),
                                     volumeStep: parseInt(getLocalStorageVal('volumeStep', undefined==prefs.volumeStep ? lmsOptions.volumeStep : prefs.volumeStep)),
                                     sortHome: getLocalStorageBool('sortHome', undefined==prefs.sortHome ? state.sortHome : prefs.sortHome),
                                     swipeVolume: getLocalStorageBool('swipeVolume', undefined==prefs.swipeVolume ? state.swipeVolume : prefs.swipeVolume),
                                     swipeChangeTrack: getLocalStorageBool('swipeChangeTrack', undefined==prefs.swipeChangeTrack ? state.swipeChangeTrack : prefs.swipeChangeTrack),
                                     keyboardControl: getLocalStorageBool('keyboardControl', undefined==prefs.keyboardControl ? state.keyboardControl : prefs.keyboardControl),
                                     queueThreeLines: getLocalStorageBool('queueThreeLines', undefined==prefs.queueThreeLines ? state.queueThreeLines : prefs.queueThreeLines),
                                     showArtwork: getLocalStorageBool('showArtwork', undefined==prefs.showArtwork ? state.showArtwork : prefs.showArtwork),
                                     skipSeconds: parseInt(getLocalStorageVal('skipSeconds', undefined==prefs.skipSeconds ? state.skipSeconds : prefs.skipSeconds)),
                                     screensaver: getLocalStorageBool('screensaver', undefined==prefs.screensaver ? state.screensaver : prefs.screensaver),
                                     homeButton: getLocalStorageBool('homeButton', undefined==prefs.homeButton ? state.homeButton : prefs.homeButton),
                                     showRating: LMS_STATS_ENABLED && getLocalStorageBool('showRating', undefined==prefs.showRating ? state.showRating : prefs.showRating),
                                     powerButton: getLocalStorageBool('powerButton', undefined==prefs.powerButton ? state.powerButton : prefs.powerButton),
                                     largeCovers: getLocalStorageBool('largeCovers', undefined==prefs.largeCovers ? state.largeCovers : prefs.largeCovers),
                                     listPadding: parseInt(getLocalStorageVal('listPadding', undefined==prefs.listPadding ? state.listPadding : prefs.listPadding)),
                                     mediaControls: getLocalStorageBool('mediaControls', undefined==prefs.mediaControls ? state.mediaControls : prefs.mediaControls) };
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
                    setLocalStorageVal('theme', state.theme);
                }
            });

            setRatingsPlugin(state, ["trackstat", "ratingslight"]);
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
            if (val!=state.showQueue) {
                let pc = getLocalStorageVal('splitter', undefined);
                state.showQueue = val;
                setLocalStorageVal('showQueue', state.showQueue);
                if (val && undefined!=pc) {
                    bus.$emit('setSplitter', pc);
                } else if (!val) {
                    document.documentElement.style.setProperty('--splitter-pc', 100);
                }
                bus.$emit('showQueue', val);
                document.documentElement.style.setProperty('--queue-visibility', val ? 'initial' : 'collapse');
                document.documentElement.style.setProperty('--queue-minwidth', val ? '400px' : '0px');
            }
        },
        setDownloadStatus(state, val) {
            state.downloadStatus = val;
        },
        setUpdateNotif(state, val) {
            state.updateNotif=val;
            if ('-'==state.updateNotif.msg) {
                state.updateNotif.msg=undefined;
            }
        },
        setNotification(state, val) {
            for (let i=0, loop=state.notifications, len=loop.length; i<len; ++i) {
                if (loop[i].id==val.id) {
                    loop.splice(i, 1);
                    break;
                }
            }
            if (val.msg != '-') {
                state.notifications.push(val);
            }
        },
        setNotifications(state, val) {
            state.notifications=val;
        }
    }
})

