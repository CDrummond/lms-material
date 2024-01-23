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
    return ($prefs, 'composergenres', 'conductorgenres', 'bandgenres', 'showComposer', 'showConductor', 'showBand', 'password', 'respectFixedVol',
            'showAllArtists', 'artistFirst', 'allowDownload', 'commentAsDiscTitle', 'showComment', 'pagedBatchSize', 'noArtistFilter',
            'releaseTypeOrder', 'genreImages', 'touchLinks', 'yearInSub', 'playShuffle');
}

sub handler {
    my ($class, $client, $params) = @_;

    if ($params->{'load_def_genres'}) {
		$params->{'pref_composergenres'} = string('PLUGIN_MATERIAL_SKIN_DEFAULT_COMPOSER_GENRES');
        $params->{'pref_conductorgenres'} = string('PLUGIN_MATERIAL_SKIN_DEFAULT_CONDUCTOR_GENRES');
        $params->{'pref_bandgenres'} = string('PLUGIN_MATERIAL_SKIN_DEFAULT_BAND_GENRES');
    }
    return $class->SUPER::handler($client, $params);
}

1;

__END__
