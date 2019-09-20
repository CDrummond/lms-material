/**
 * LMS-Material
 *
 * Copyright (c) 2018-2019 Craig Drummond <craig.p.drummond@gmail.com>
 * MIT license.
 */
var lmsNumVisibleMenus = 0;
/* When setttnig a player from players list, should we use the last player, or the
   user's configured default player? useLastPlayer should ONLY be set to true when
   switching mobile/desktop or when mini-player is launched */
var lmsUseLastPlayer = false;

function updateUiSettings(state, val) {
    var browseDisplayChanged = false;
    if (undefined!=val.darkUi && state.darkUi!=val.darkUi) {
        state.darkUi = val.darkUi;
        setLocalStorageVal('darkUi', state.darkUi);
        setTheme(state.darkUi);
        bus.$emit('themeChanged');
    }
    if (undefined!=val.largeFonts && state.largeFonts!=val.largeFonts) {
        state.largeFonts = val.largeFonts;
        setLocalStorageVal('largeFonts', state.largeFonts);
        setFontSize(state.largeFonts);
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
    if (undefined!=val.showMenuAudio && state.showMenuAudio!=val.showMenuAudio) {
        state.showMenuAudio = val.showMenuAudio;
        setLocalStorageVal('showMenuAudio', state.showMenuAudio);
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
    if (undefined!=val.showMenuAudioQueue && state.showMenuAudioQueue!=val.showMenuAudioQueue) {
        state.showMenuAudioQueue = val.showMenuAudioQueue;
        setLocalStorageVal('showMenuAudioQueue', state.showMenuAudioQueue);
    }
    if (undefined!=val.nowPlayingBackdrop && state.nowPlayingBackdrop!=val.nowPlayingBackdrop) {
        state.nowPlayingBackdrop = val.nowPlayingBackdrop;
        setLocalStorageVal('nowPlayingBackdrop', state.nowPlayingBackdrop);
    }
    if (undefined!=val.infoBackdrop && state.infoBackdrop!=val.infoBackdrop) {
        state.infoBackdrop = val.infoBackdrop;
        setLocalStorageVal('infoBackdrop', state.infoBackdrop);
    }
    if (undefined!=val.techInfo && state.techInfo!=val.techInfo) {
        state.techInfo = val.techInfo;
        setLocalStorageVal('techInfo', state.techInfo);
    }
    if (undefined!=val.queueShowTrackNum && state.queueShowTrackNum!=val.queueShowTrackNum) {
        state.queueShowTrackNum = val.queueShowTrackNum;
        setLocalStorageVal('queueShowTrackNum', state.queueShowTrackNum);
    }
    if (undefined!=val.nowPlayingTrackNum && state.nowPlayingTrackNum!=val.nowPlayingTrackNum) {
        state.nowPlayingTrackNum = val.nowPlayingTrackNum;
        setLocalStorageVal('nowPlayingTrackNum', state.nowPlayingTrackNum);
    }
    if (undefined!=val.volumeStep && volumeStep!=val.volumeStep) {
        volumeStep = val.volumeStep;
        setLocalStorageVal('volumeStep', volumeStep);
    }
    if (undefined!=val.showPlayerMenuEntry && state.showPlayerMenuEntry!=val.showPlayerMenuEntry) {
        state.showPlayerMenuEntry = val.showPlayerMenuEntry;
        setLocalStorageVal('showPlayerMenuEntry', state.showPlayerMenuEntry);
    }
    if (undefined!=val.lsAndNotif && state.lsAndNotif!=val.lsAndNotif) {
        state.lsAndNotif = val.lsAndNotif;
        setLocalStorageVal('lsAndNotif', state.lsAndNotif);
        bus.$emit('lsAndNotifChanged');
    }
    if (undefined!=val.menuIcons && state.menuIcons!=val.menuIcons) {
        state.menuIcons = val.menuIcons;
        setLocalStorageVal('menuIcons', state.menuIcons);
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
    if (browseDisplayChanged) {
        bus.$emit('browseDisplayChanged');
    }
}

const store = new Vuex.Store({
    state: {
        players: null, // List of players
        player: null, // Current player (from list)
        defaultPlayer: null,
        otherPlayers: [], // Players on other servers
        darkUi: true,
        largeFonts: false,
        letterOverlay:false,
        sortFavorites:true,
        showMenuAudio:true,
        autoScrollQueue:true,
        library: null,
        infoPlugin: false,
        stopButton: false,
        browseBackdrop: true,
        queueBackdrop: true,
        showMenuAudioQueue: true,
        nowPlayingBackdrop: false,
        infoBackdrop: true,
        techInfo: false,
        queueShowTrackNum: true,
        nowPlayingTrackNum: false,
        ratingsSupport: false,
        maxRating: 5,
        showPlayerMenuEntry: false,
        lsAndNotif:'playing',
        page:'browse',
        menuIcons: true,
        sortHome: isIPhone(),
        hidden: new Set(),
        visibleMenus: new Set(),
        swipeVolume: true
    },
    mutations: {
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
                    state.players[i].ison = players[i].ison;
                    state.players[i].isconnected = players[i].isconnected;
                    state.players[i].isgroup = players[i].isgroup;
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
            if (state.player) {
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

            if (players && !state.player) {
                // If 'lmsUseLastPlayer' is set then order is last, default, first in list. Otherwise it is
                // default, last, first in list
                if (!lmsUseLastPlayer && !state.player && state.players.length>0 && undefined!=state.defaultPlayer) {
                    for (var i=0, len=state.players.length; i<len; ++i) {
                        if (state.players[i].id === state.defaultPlayer) {
                            state.player = {id:state.players[i].id, name:state.players[i].name, isgroup:state.players[i].isgroup};
                            setLocalStorageVal('player', state.player.id);
                            break;
                        }
                    }
                }
                if (!state.player && state.players.length>0) {
                    var config = getLocalStorageVal('player');
                    if (config) {
                        for (var i=0, len=state.players.length; i<len; ++i) {
                            if (state.players[i].id === config || state.players[i].name == config) {
                                state.player = {id:state.players[i].id, name:state.players[i].name, isgroup:state.players[i].isgroup};
                                setLocalStorageVal('player', state.player.id);
                                break;
                            }
                        }
                    }
                }
                if (lmsUseLastPlayer && !state.player && state.players.length>0 && undefined!=state.defaultPlayer) {
                    for (var i=0, len=state.players.length; i<len; ++i) {
                        if (state.players[i].id === state.defaultPlayer) {
                            state.player = {id:state.players[i].id, name:state.players[i].name, isgroup:state.players[i].isgroup};
                            setLocalStorageVal('player', state.player.id);
                            break;
                        }
                    }
                }
                // Reset 'lmsUseLastPlayer' - after initial load/reload we can then use defualt (if set)
                lmsUseLastPlayer = false;
                if (!state.player && state.players.length>0) {
                    // Auto-select a player:
                    //  1. First powered on standard player
                    //  2. First powerer off standard player
                    //  3. First powered on group
                    //  4. First powerer off group
                    for (var j=0; j<4 && !state.player; ++j) {
                        for (var i=0, len=state.players.length; i<len; ++i) {
                            if ((j==1 || j==3 || state.players[i].ison) && (j<2 ? !state.players[i].isgroup : state.players[i].isgroup)) {
                                state.player = {id:state.players[i].id, name:state.players[i].name, isgroup:state.players[i].isgroup};
                                setLocalStorageVal('player', state.player.id);
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
        },
        setPlayer(state, id) {
            if (state.players) {
                for (var i=0, len=state.players.length; i<len; ++i) {
                    if (state.players[i].id === id) {
                        state.player = {id:state.players[i].id, name:state.players[i].name, isgroup:state.players[i].isgroup};
                        setLocalStorageVal('player', id);
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
        initUiSettings(state) {
            state.defaultPlayer = getLocalStorageVal('defaultPlayer', state.defaultPlayer);
            state.page = getLocalStorageVal('page', state.page);
            state.darkUi = getLocalStorageBool('darkUi', state.darkUi);
            state.largeFonts = getLocalStorageBool('largeFonts', state.largeFonts);
            state.autoScrollQueue = getLocalStorageBool('autoScrollQueue', state.autoScrollQueue);
            state.library = getLocalStorageVal('library', state.library);
            state.sortFavorites = getLocalStorageBool('sortFavorites', state.sortFavorites);
            state.letterOverlay = getLocalStorageBool('letterOverlay', state.letterOverlay);
            state.showMenuAudio = getLocalStorageBool('showMenuAudio', state.showMenuAudio);
            state.infoPlugin = getLocalStorageBool('infoPlugin', state.infoPlugin);
            state.stopButton = getLocalStorageBool('stopButton', state.stopButton);
            state.browseBackdrop = getLocalStorageBool('browseBackdrop', state.browseBackdrop);
            state.queueBackdrop = getLocalStorageBool('queueBackdrop', state.queueBackdrop);
            state.showMenuAudioQueue = getLocalStorageBool('showMenuAudioQueue', state.showMenuAudioQueue);
            state.nowPlayingBackdrop = getLocalStorageBool('nowPlayingBackdrop', state.nowPlayingBackdrop);
            state.infoBackdrop = getLocalStorageBool('infoBackdrop', state.infoBackdrop);
            state.techInfo = getLocalStorageBool('techInfo', state.techInfo);
            state.queueShowTrackNum = getLocalStorageBool('queueShowTrackNum', state.queueShowTrackNum);
            state.nowPlayingTrackNum = getLocalStorageBool('nowPlayingTrackNum', state.nowPlayingTrackNum);
            state.ratingsSupport = getLocalStorageBool('ratingsSupport', state.ratingsSupport);
            state.maxRating = getLocalStorageBool('maxRating', state.maxRating);
            state.showPlayerMenuEntry = getLocalStorageBool('showPlayerMenuEntry', state.showPlayerMenuEntry);
            state.lsAndNotif = getLocalStorageVal('lsAndNotif', state.lsAndNotif);
            state.menuIcons = getLocalStorageBool('menuIcons', state.menuIcons);
            state.sortHome = getLocalStorageBool('sortHome', state.sortHome);
            state.hidden = new Set(JSON.parse(getLocalStorageVal('hidden', "[\""+TOP_PRESETS_ID+"\"]")));
            state.swipeVolume = getLocalStorageBool('swipeVolume', state.swipeVolume);
            setTheme(state.darkUi);
            setFontSize(state.largeFonts);
            // Music and Artist info plugin installled?
            lmsCommand("", ["can", "musicartistinfo", "biography", "?"]).then(({data}) => {
                state.infoPlugin = data && data.result && data.result._can ? true : false;
                setLocalStorageVal('infoPlugin', state.infoPlugin);
            }).catch(err => {
                state.infoPlugin = false;
                setLocalStorageVal('infoPlugin', state.infoPlugin);
            });

            // Read defaults, stored on server
            lmsCommand("", ["pref", LMS_MATERIAL_UI_DEFAULT_PREF, "?"]).then(({data}) => {
                if (data && data.result && data.result._p2) {
                    try {
                        var prefs = JSON.parse(data.result._p2);
                        var opts = { darkUi: getLocalStorageBool('darkUi', undefined==prefs.darkUi ? state.darkUi : prefs.darkUi),
                                     largeFonts: getLocalStorageBool('largeFonts', undefined==prefs.largeFonts ? state.largeFonts : prefs.largeFonts),
                                     autoScrollQueue: getLocalStorageBool('autoScrollQueue', undefined==prefs.autoScrollQueue ? state.autoScrollQueue : prefs.autoScrollQueue),
                                     letterOverlay: getLocalStorageBool('letterOverlay', undefined==prefs.letterOverlay ? state.letterOverlay : prefs.letterOverlay),
                                     sortFavorites: getLocalStorageBool('sortFavorites', undefined==prefs.sortFavorites ? state.sortFavorites : prefs.sortFavorites),
                                     showMenuAudio: getLocalStorageBool('showMenuAudio', undefined==prefs.showMenuAudio ? state.showMenuAudio : prefs.showMenuAudio),
                                     stopButton: getLocalStorageBool('stopButton', undefined==prefs.stopButton ? state.stopButton : prefs.stopButton),
                                     browseBackdrop: getLocalStorageBool('browseBackdrop', undefined==prefs.browseBackdrop ? state.browseBackdrop : prefs.browseBackdrop),
                                     queueBackdrop: getLocalStorageBool('queueBackdrop', undefined==prefs.queueBackdrop ? state.queueBackdrop : prefs.queueBackdrop),
                                     showMenuAudioQueue: getLocalStorageBool('showMenuAudioQueue', undefined==prefs.showMenuAudioQueue ? state.showMenuAudioQueue : prefs.showMenuAudioQueue),
                                     nowPlayingBackdrop: getLocalStorageBool('nowPlayingBackdrop', undefined==prefs.nowPlayingBackdrop ? state.nowPlayingBackdrop : prefs.nowPlayingBackdrop),
                                     infoBackdrop: getLocalStorageBool('infoBackdrop', undefined==prefs.infoBackdrop ? state.infoBackdrop : prefs.infoBackdrop),
                                     techInfo: getLocalStorageBool('techInfo', undefined==prefs.techInfo ? state.techInfo : prefs.techInfo),
                                     queueShowTrackNum: getLocalStorageBool('queueShowTrackNum', undefined==prefs.queueShowTrackNum ? state.queueShowTrackNum : prefs.queueShowTrackNum),
                                     nowPlayingTrackNum: getLocalStorageBool('nowPlayingTrackNum', undefined==prefs.nowPlayingTrackNum ? state.nowPlayingTrackNum : prefs.nowPlayingTrackNum),
                                     volumeStep: parseInt(getLocalStorageVal('volumeStep', undefined==prefs.volumeStep ? volumeStep : prefs.volumeStep)),
                                     showPlayerMenuEntry: getLocalStorageBool('showPlayerMenuEntry', undefined==prefs.showPlayerMenuEntry ? state.showPlayerMenuEntry : prefs.showPlayerMenuEntry),
                                     lsAndNotif: getLocalStorageVal('lsAndNotif', undefined==prefs.lsAndNotif ? state.lsAndNotif : prefs.lsAndNotif),
                                     menuIcons: getLocalStorageBool('menuIcons', undefined==prefs.menuIcons ? state.menuIcons : prefs.menuIcons),
                                     sortHome: getLocalStorageBool('sortHome', undefined==prefs.sortHome ? state.sortHome : prefs.sortHome),
                                     swipeVolume: getLocalStorageBool('swipeVolume', undefined==prefs.swipeVolume ? state.swipeVolume : prefs.swipeVolume)};
                        if (undefined!=prefs.hidden && undefined==getLocalStorageVal('hidden', undefined)) {
                            opts.hidden=new Set(prefs.hidden);
                        }
                    updateUiSettings(state, opts);
                    } catch(e) {
                    }
                }
            });

            lmsCommand("", ["can", "trackstat", "getrating", "?"]).then(({data}) => {
                if (data && data.result && undefined!=data.result._can) {
                    state.ratingsSupport = 1==data.result._can;
                    setLocalStorageVal('ratingsSupport', state.ratingsSupport);
                    if (state.ratingsSupport) {
                        lmsCommand("", ["pref", "plugin.trackstat:rating_10scale", "?"]).then(({data}) => {
                            if (data && data.result && data.result._p2 != null) {
                                state.maxRating = 1 == parseInt(data.result._p2) ? 10 : 5;
                                setLocalStorageVal('maxRating', state.maxRating);
                            }
                        });
                    }
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
        setInfoPlugin(state, val) {
            state.infoPlugin = val;
            setLocalStorageVal('infoPlugin', val);
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
                bus.$emit('menuOpen');
            } else {
                state.visibleMenus.delete(val.name);
            }
            lmsNumVisibleMenus = state.visibleMenus.size;
        }
    }
})

