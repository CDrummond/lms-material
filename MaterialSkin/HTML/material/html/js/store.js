/**
 * LMS-Material
 *
 * Copyright (c) 2018 Craig Drummond <craig.p.drummond@gmail.com>
 * MIT license.
 */

const store = new Vuex.Store({
    state: {
        players: null, // List of players
        player: null, // Current player (from list)
        darkUi: true,
        artistAlbumSort:'yearalbum',
        albumSort:'album',
        splitArtistsAndAlbums:false,
        sortFavorites:false,
        showMenuAudio:true,
        serverMenus:false,
        autoScrollQueue:true,
        library: null,
        infoPlugin: false
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
            var browseDisplayChanged = false;
            if (state.darkUi!=val.darkUi) {
                state.darkUi = val.darkUi;
                setLocalStorageVal('darkUi', state.darkUi);
                setTheme(state.darkUi);
            }
            if (state.artistAlbumSort!=val.artistAlbumSort) {
                state.artistAlbumSort = val.artistAlbumSort;
                setLocalStorageVal('artistAlbumSort', state.artistAlbumSort);
                browseDisplayChanged = true;
            }
            if (state.albumSort!=val.albumSort) {
                state.albumSort = val.albumSort;
                setLocalStorageVal('albumSort', state.albumSort);
                browseDisplayChanged = true;
            }
            if (state.splitArtistsAndAlbums!=val.splitArtistsAndAlbums) {
                state.splitArtistsAndAlbums = val.splitArtistsAndAlbums;
                setLocalStorageVal('splitArtistsAndAlbums', state.splitArtistsAndAlbums);
                browseDisplayChanged = true;
            }
            if (state.sortFavorites!=val.sortFavorites) {
                state.sortFavorites = val.sortFavorites;
                setLocalStorageVal('sortFavorites', state.sortFavorites);
                browseDisplayChanged = true;
            }
            if (state.autoScrollQueue!=val.autoScrollQueue) {
                state.autoScrollQueue = val.autoScrollQueue;
                setLocalStorageVal('autoScrollQueue', state.autoScrollQueue);
            }
            if (state.showMenuAudio!=val.showMenuAudio) {
                state.showMenuAudio = val.showMenuAudio;
                setLocalStorageVal('showMenuAudio', state.showMenuAudio);
            }
            if (state.serverMenus!=val.serverMenus) {
                state.serverMenus = val.serverMenus;
                setLocalStorageVal('serverMenus', state.serverMenus);
                browseDisplayChanged = true;
            }
            bus.$emit('browseDisplayChanged');
        },
        initUiSettings(state) {
            state.darkUi = getLocalStorageBool('darkUi', state.darkUi);
            state.artistAlbumSort = getLocalStorageVal('artistAlbumSort', state.artistAlbumSort);
            state.albumSort = getLocalStorageVal('albumSort', state.albumSort);
            state.autoScrollQueue = getLocalStorageBool('autoScrollQueue', state.autoScrollQueue);
            state.library = getLocalStorageVal('library', state.library);
            state.splitArtistsAndAlbums = getLocalStorageBool('splitArtistsAndAlbums', state.splitArtistsAndAlbums);
            state.sortFavorites = getLocalStorageBool('sortFavorites', state.sortFavorites);
            state.showMenuAudio = getLocalStorageBool('showMenuAudio', state.showMenuAudio);
            state.serverMenus = getLocalStorageBool('serverMenus', state.serverMenus);
            state.infoPlugin = getLocalStorageBool('infoPlugin', state.infoPlugin);
            setTheme(state.darkUi);
            
            // Music and Artist info plugin installled?
            lmsCommand("", ["musicartistinfo", "localfiles", 0, 0]).then(({data}) => {
                state.infoPlugin = data && data.result && data.result.window ? true : false;
                setLocalStorageVal('infoPlugin', state.infoPlugin);
            }).catch(err => {
                state.infoPlugin = false;
                setLocalStorageVal('infoPlugin', state.infoPlugin);
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
        }
    }
})

