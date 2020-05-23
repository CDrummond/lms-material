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
                  artistImages: getLocalStorageBool('artistImages', false),
                  noGenreFilter: getLocalStorageBool('noGenreFilter', false),
                  noRoleFilter: getLocalStorageBool('noRoleFilter', false),
                  serviceEmblems: getLocalStorageBool('serviceEmblems', true)};
