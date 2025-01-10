package Plugins::MaterialSkin::Settings;

#
# LMS-Material
#
# Copyright (c) 2018-2024 Craig Drummond <craig.p.drummond@gmail.com>
#
# MIT license.
#

use strict;
use base qw(Slim::Web::Settings);
use Slim::Utils::Prefs;
use Slim::Utils::Strings qw(string cstring);

my $prefs = preferences('plugin.material-skin');

sub name {
    return 'MATERIAL_SKIN';
}

sub page {
    return 'plugins/MaterialSkin/settings/basic.html';
}

sub prefs {
    return ($prefs, qw(composergenres conductorgenres bandgenres maiComposer showComposer showConductor showBand password respectFixedVol showAllArtists artistFirst allowDownload commentAsDiscTitle showComment pagedBatchSize noArtistFilter releaseTypeOrder genreImages touchLinks yearInSub playShuffle combineAppsAndRadio hidePlayers screensaverTimeout npSwitchTimeout useDefaultForSettings useGrouping));
}

sub handler {
    my ($class, $client, $params) = @_;

    if ($params->{'load_def_genres'}) {
		$params->{'pref_composergenres'} = string('PLUGIN_MATERIAL_SKIN_DEFAULT_COMPOSER_GENRES');
        $params->{'pref_conductorgenres'} = string('PLUGIN_MATERIAL_SKIN_DEFAULT_CONDUCTOR_GENRES');
        $params->{'pref_bandgenres'} = string('PLUGIN_MATERIAL_SKIN_DEFAULT_BAND_GENRES');
    }
    $params->{'showComposerDesc'} = string('PLUGIN_MATERIAL_SKIN_SHOW_COMPOSER_DESC_LMS9', string('SETUP_MYCLASSICALGENRES'));
    $params->{'showConductorDesc'} = string('PLUGIN_MATERIAL_SKIN_SHOW_CONDUCTOR_DESC_LMS9', string('SETUP_MYCLASSICALGENRES'));
    $params->{'showBandDesc'} = string('PLUGIN_MATERIAL_SKIN_SHOW_BAND_DESC_LMS9', string('SETUP_MYCLASSICALGENRES'));
    $params->{'lmsHasClassicalGenreList'} = Slim::Utils::Versions->compareVersions($::VERSION, '9.0.1') >= 0 ? 1 : 0;
    return $class->SUPER::handler($client, $params);
}

1;

__END__
