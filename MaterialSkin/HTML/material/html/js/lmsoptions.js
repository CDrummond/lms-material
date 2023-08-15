/**
 * LMS-Material
 *
 * Copyright (c) 2018-2023 Craig Drummond <craig.p.drummond@gmail.com>
 * MIT license.
 */
'use strict';

var lmsOptions = {newMusicLimit: 100,
                  useMySqueezeboxImageProxy: getLocalStorageBool('useMySqueezeboxImageProxy', true),
                  infoPlugin: getLocalStorageBool('infoPlugin', false),
                  youTubePlugin: getLocalStorageBool('youTubePlugin', false),
                  separateArtists: getLocalStorageBool('separateArtists', false),
                  artistImages: getLocalStorageBool('artistImages', false),
                  noGenreFilter: getLocalStorageBool('noGenreFilter', false),
                  noRoleFilter: getLocalStorageBool('noRoleFilter', false),
                  serviceEmblems: getLocalStorageBool('serviceEmblems', true),
                  techInfo: getLocalStorageBool('techInfo', false),
                  conductorGenres: new Set(),
                  composerGenres: new Set(),
                  bandGenres: new Set(),
                  showConductor: getLocalStorageBool('showConductor', false),
                  showComposer: getLocalStorageBool('showComposer', true),
                  showBand: getLocalStorageBool('showBand', true),
                  volumeStep: parseInt(getLocalStorageVal('volumeStep', 5)),
                  respectFixedVol: getLocalStorageVal('respectFixedVol', VOL_FIXED),
                  showAllArtists: getLocalStorageBool('showAllArtists', true),
                  artistFirst: getLocalStorageBool('artistFirst', true),
                  allowDownload: IS_IOS ? false : getLocalStorageBool('allowDownload', false),
                  variousArtistsString: getLocalStorageVal('variousArtistsString', 'Various Artists'),
                  lang: undefined,
                  commentAsDiscTitle: getLocalStorageVal('commentAsDiscTitle', 0),
                  groupdiscs: getLocalStorageBool('groupdiscs', false),
                  showComment: getLocalStorageBool('showComment', false) };
