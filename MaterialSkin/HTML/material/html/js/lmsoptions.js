/**
 * LMS-Material
 *
 * Copyright (c) 2018-2020 Craig Drummond <craig.p.drummond@gmail.com>
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
                  techInfo: getLocalStorageBool('techInfo', false)};
