/**
 * LMS-Material
 *
 * Copyright (c) 2018 Craig Drummond <craig.p.drummond@gmail.com>
 * MIT license.
 */

function updateUiSettings(state, val) {
    var browseDisplayChanged = false;
    if (undefined!=val.darkUi && state.darkUi!=val.darkUi) {
        state.darkUi = val.darkUi;
        setLocalStorageVal('darkUi', state.darkUi);
        setTheme(state.darkUi);
        bus.$emit('themeChanged');
    }
    if (undefined!=val.artistAlbumSort && state.artistAlbumSort!=val.artistAlbumSort) {
        state.artistAlbumSort = val.artistAlbumSort;
        setLocalStorageVal('artistAlbumSort', state.artistAlbumSort);
        browseDisplayChanged = true;
    }
    if (undefined!=val.albumSort && state.albumSort!=val.albumSort) {
        state.albumSort = val.albumSort;
        setLocalStorageVal('albumSort', state.albumSort);
        browseDisplayChanged = true;
    }
    if (undefined!=val.splitArtistsAndAlbums && state.splitArtistsAndAlbums!=val.splitArtistsAndAlbums) {
        state.splitArtistsAndAlbums = val.splitArtistsAndAlbums;
        setLocalStorageVal('splitArtistsAndAlbums', state.splitArtistsAndAlbums);
        browseDisplayChanged = true;
    }
    if (undefined!=val.sortFavorites && state.sortFavorites!=val.sortFavorites) {
        state.sortFavorites = val.sortFavorites;
        setLocalStorageVal('sortFavorites', state.sortFavorites);
        browseDisplayChanged = true;
    }
    if (undefined!=val.useGrid && state.useGrid!=val.useGrid) {
        state.useGrid = val.useGrid;
        setLocalStorageVal('useGrid', state.useGrid);
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
    if (undefined!=val.serverMenus && state.serverMenus!=val.serverMenus) {
        state.serverMenus = val.serverMenus;
        setLocalStorageVal('serverMenus', state.serverMenus);
        browseDisplayChanged = true;
    }
    if (undefined!=val.stopButton && state.stopButton!=val.stopButton) {
        state.stopButton = val.stopButton;
        setLocalStorageVal('stopButton', state.stopButton);
    }
    if (browseDisplayChanged) {
        bus.$emit('browseDisplayChanged');
    }
}

const store = new Vuex.Store({
    state: {
        players: null, // List of players
        player: null, // Current player (from list)
        darkUi: true,
        artistAlbumSort:'yearalbum',
        albumSort:'album',
        splitArtistsAndAlbums:false,
        useGrid:true,
        sortFavorites:false,
        showMenuAudio:true,
        serverMenus:false,
        autoScrollQueue:true,
        library: null,
        infoPlugin: false,
        noNetwork: false,
        stopButton: false,
        browseBackdrop: true,
        queueBackdrop: true,
        nowPlayingBackdrop: true,
        infoBackdrop: true
    },
    mutations: {
        setPlayers(state, players) {
            var changed = !state.players || state.players.length!=players.length;
            if (!changed) {
                for (i=0; i<state.players.length; ++i) {
                    var a = state.players[i];
                    var b = players[i];
                    if (a.id!=b.id || a.name!=b.name || a.canpoweroff!=b.canpoweroff || a.ison!=b.ison || a.isconnected!=b.isconnected || a.isgroup!=b.isgroup) {
                        changed = true;
                        break;
                    }
                }
            }

            if (!changed) {
                return;
            }

            state.players=players;
            if (state.player) {
                // Check current player is still valid
                var found = false;
                if (players) {
                    for (i=0; i<state.players.length; ++i) {
                        if (state.players[i].id === state.player.id) {
                            found = true;
                            if (changed) {
                                state.player = state.players[i];
                            }
                            break;
                        }
                    }
                }
                if (!found) {
                    state.player = null;
                }
            }

            if (players && !state.player) {
                var config = getLocalStorageVal('player');
                if (config) {
                    state.players.forEach(p => {
                        if (p.id === config) {
                            state.player = p;   
                        }
                    });
                }
                if (!state.player) { /* Choose first powered on player */
                    for (i=0; i<state.players.length; ++i) {
                        if (state.players[i].ison) {
                            state.player=state.players[i];
                            setLocalStorageVal('player', state.player.id);
                            break;
                        }
                    }
                }
                if (!state.player) { /* Choose first connected on player */
                    for (i=0; i<state.players.length; ++i) {
                        if (state.players[i].isconnected) {
                            state.player=state.players[i];
                            setLocalStorageVal('player', state.player.id);
                            break;
                        }
                    }
                }
                if (!state.player && state.players.length>0) { /* Choose first player */
                    state.player=state.players[0];
                    setLocalStorageVal('player', state.player.id);
                }
            }
        },
        setPlayer(state, id) {
            if (state.players) {
                for (i=0; i<state.players.length; ++i) {
                    if (state.players[i].id === id) {
                        state.player = state.players[i];
                        setLocalStorageVal('player', id);
                        break;
                    }
                }
            }
        },
        setUiSettings(state, val) {
            updateUiSettings(state, val);
        },
        initUiSettings(state) {
            state.darkUi = getLocalStorageBool('darkUi', state.darkUi);
            state.artistAlbumSort = getLocalStorageVal('artistAlbumSort', state.artistAlbumSort);
            state.albumSort = getLocalStorageVal('albumSort', state.albumSort);
            state.autoScrollQueue = getLocalStorageBool('autoScrollQueue', state.autoScrollQueue);
            state.library = getLocalStorageVal('library', state.library);
            state.splitArtistsAndAlbums = getLocalStorageBool('splitArtistsAndAlbums', state.splitArtistsAndAlbums);
            state.sortFavorites = getLocalStorageBool('sortFavorites', state.sortFavorites);
            state.useGrid = getLocalStorageBool('useGrid', state.useGrid);
            state.showMenuAudio = getLocalStorageBool('showMenuAudio', state.showMenuAudio);
            state.serverMenus = getLocalStorageBool('serverMenus', state.serverMenus);
            state.infoPlugin = getLocalStorageBool('infoPlugin', state.infoPlugin);
            state.stopButton = getLocalStorageBool('stopButton', state.stopButton);
            state.browseBackdrop = getLocalStorageBool('browseBackdrop', state.browseBackdrop);
            state.queueBackdrop = getLocalStorageBool('queueBackdrop', state.queueBackdrop);
            state.nowPlayingBackdrop = getLocalStorageBool('nowPlayingBackdrop', state.nowPlayingBackdrop);
            state.infoBackdrop = getLocalStorageBool('infoBackdrop', state.infoBackdrop);
            setTheme(state.darkUi);
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
                    var prefs = JSON.parse(data.result._p2);
                    var opts = { darkUi: getLocalStorageBool('darkUi', undefined==prefs.darkUi ? state.darkUi : prefs.darkUi),
                                 artistAlbumSort: getLocalStorageVal('artistAlbumSort', undefined==prefs.artistAlbumSort ? state.artistAlbumSort : prefs.artistAlbumSort),
                                 albumSort: getLocalStorageVal('albumSort', undefined==prefs.albumSort ? state.albumSort : prefs.albumSort),
                                 autoScrollQueue: getLocalStorageBool('autoScrollQueue', undefined==prefs.autoScrollQueue ? state.autoScrollQueue : prefs.autoScrollQueue),
                                 splitArtistsAndAlbums: getLocalStorageBool('splitArtistsAndAlbums', undefined==prefs.splitArtistsAndAlbums ? state.splitArtistsAndAlbums : prefs.splitArtistsAndAlbums),
                                 useGrid: getLocalStorageBool('useGrid', undefined==prefs.useGrid ? state.useGrid : prefs.useGrid),
                                 sortFavorites: getLocalStorageBool('sortFavorites', undefined==prefs.sortFavorites ? state.sortFavorites : prefs.sortFavorites),
                                 showMenuAudio: getLocalStorageBool('showMenuAudio', undefined==prefs.showMenuAudio ? state.showMenuAudio : prefs.showMenuAudio),
                                 serverMenus: getLocalStorageBool('serverMenus', undefined==prefs.serverMenus ? state.serverMenus : prefs.serverMenus),
                                 stopButton: getLocalStorageBool('stopButton', undefined==prefs.stopButton ? state.stopButton : prefs.stopButton),
                                 browseBackdrop: getLocalStorageBool('browseBackdrop', undefined==prefs.browseBackdrop ? state.browseBackdrop : prefs.browseBackdrop),
                                 queueBackdrop: getLocalStorageBool('queueBackdrop', undefined==prefs.queueBackdrop ? state.queueBackdrop : prefs.queueBackdrop),
                                 nowPlayingBackdrop: getLocalStorageBool('nowPlayingBackdrop', undefined==prefs.nowPlayingBackdrop ? state.nowPlayingBackdrop : prefs.nowPlayingBackdrop),
                                 infoBackdrop: getLocalStorageBool('infoBackdrop', undefined==prefs.infoBackdrop ? state.infoBackdrop : prefs.infoBackdrop)};
                    updateUiSettings(state, opts);
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
        setNoNetwork(state, val) {
            state.noNetwork = val;
        }
    }
})

