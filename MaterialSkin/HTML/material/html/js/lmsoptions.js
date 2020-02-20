/**
 * LMS-Material
 *
 * Copyright (c) 2018-2020 Craig Drummond <craig.p.drummond@gmail.com>
 * MIT license.
 */
'use strict';

var lmsOptions = {infoPlugin: getLocalStorageBool('infoPlugin', false),
                  artistImages: getLocalStorageBool('artistImages', false),
                  noGenreFilter: getLocalStorageBool('noGenreFilter', false),
                  noRoleFilter: getLocalStorageBool('noRoleFilter', false)};
