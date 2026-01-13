/**
 * LMS-Material
 *
 * Copyright (c) 2018-2026 Craig Drummond <craig.p.drummond@gmail.com>
 * MIT license.
 */
'use strict';

var lmsOptions = {techInfo: getLocalStorageBool('techInfo', false),
                  conductorGenres: new Set(),
                  composerGenres: new Set(),
                  bandGenres: new Set(),
                  maiComposer: getLocalStorageBool('maiComposer', false),
                  showConductor: getLocalStorageBool('showConductor', false),
                  showComposer: getLocalStorageVal('showComposer', 1, true),
                  showBand: getLocalStorageBool('showBand', true),
                  showArtistWorks: getLocalStorageBool('showArtistWorks', true),
                  volumeStep: parseInt(getLocalStorageVal('volumeStep', 5)),
                  respectFixedVol: getLocalStorageVal('respectFixedVol', VOL_FIXED),
                  showAllArtists: getLocalStorageBool('showAllArtists', true),
                  artistFirst: getLocalStorageBool('artistFirst', true),
                  allowDownload: getLocalStorageBool('allowDownload', false),
                  lang: undefined,
                  commentAsDiscTitle: getLocalStorageVal('commentAsDiscTitle', 0),
                  showComment: getLocalStorageBool('showComment', false),
                  pagedBatchSize: parseInt(getLocalStorageVal('pagedBatchSize', 100)),
                  noArtistFilter: getLocalStorageBool('noArtistFilter', true),
                  separateArtistsList: getLocalStorageBool('separateArtistsList', true),
                  supportReleaseTypes: LMS_DEF_SUPPORT_RELEASE_TYPES,
                  groupByReleaseType: LMS_DEF_GROUP_BY_RELEASE_TYPE,
                  releaseTypeOrder: undefined,
                  releaseTypes: {},
                  genreImages: getLocalStorageBool('genreImages', false),
                  playlistImages: getLocalStorageBool('playlistImages', true),
                  touchLinks: getLocalStorageBool('touchLinks', false),
                  yearInSub: getLocalStorageBool('yearInSub', true),
                  playShuffle: getLocalStorageBool('playShuffle', false) && !queryParams.party && (!LMS_KIOSK_MODE || !HIDE_FOR_KIOSK.has(PLAY_SHUFFLE_ACTION)),
                  time12hr: LMS_DEF_12HR,
                  listWorks: getLocalStorageBool('listWorks', false),
                  combineAppsAndRadio: getLocalStorageBool('combineAppsAndRadio', false),
                  hidePlayers: new Set(getLocalStorageVal('hidePlayers', '').split(',')),
                  screensaverTimeout: getLocalStorageVal('screensaverTimeout', 60),
                  npSwitchTimeout: getLocalStorageVal('npSwitchTimeout', 5*60),
                  userDefinedRoles: {},
                  excludedUserDefinedRoles: getLocalStorageVal('excludedUserDefinedRoles', '-'),
                  rolesInArtists: getLocalStorageVal('rolesInArtists', '-'),
                  randomMixDialogPinned: false,
                  showSubtitle: getLocalStorageBool('showSubtitle', false),
                  useDefaultForSettings: getLocalStorageVal('useDefaultForSettings', 0),
                  useGrouping: getLocalStorageBool('useGrouping', true),
                  showArtistImages: LMS_DEF_ARTIST_PICS,
                  serviceEmblems: LMS_DEF_SRV_EMBLEM,
                  noGenreFilter: LMS_DEF_NO_GENRE_FILTER,
                  noRoleFilter: LMS_DEF_NO_ROLE_FILTER,
                  groupdiscs: LMS_DEF_GROUP_DISCS,
                  variousArtistsString: LMS_DEF_VA_STRING,
                  classicalGenres: new Set(["Classical"]),
                  smallIconOnlyGrid: getLocalStorageBool('smallIconOnlyGrid', true),
                  homeExtraNeedsPlayer: new Set(),
                  home3rdPartyExtraLists: LMS_3RDPARTY_HOME_EXTRA
                };

function initLmsOptions() {
    lmsOptions.homeExtraNeedsPlayer = new Set();
    for (let i=0, len=lmsOptions.home3rdPartyExtraLists.length; i<len; ++i) {
        if (lmsOptions.home3rdPartyExtraLists[i].needsPlayer) {
            lmsOptions.homeExtraNeedsPlayer.add(lmsOptions.home3rdPartyExtraLists[i].id);
        }
    }
}
