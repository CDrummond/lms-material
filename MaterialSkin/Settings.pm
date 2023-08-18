package Plugins::MaterialSkin::Settings;

#
# LMS-Material
#
# Copyright (c) 2018-2023 Craig Drummond <craig.p.drummond@gmail.com>
#
# MIT license.
#

use strict;
use base qw(Slim::Web::Settings);
use Slim::Utils::Prefs;

my $prefs = preferences('plugin.material-skin');

sub name {
	return 'MATERIAL_SKIN';
}

sub page {
	return 'plugins/MaterialSkin/settings/basic.html';
}

sub prefs {
	return ($prefs, 'composergenres', 'conductorgenres', 'bandgenres', 'showComposer', 'showConductor', 'showBand', 'password', 'respectFixedVol', 'showAllArtists', 'artistFirst', 'allowDownload', 'commentAsDiscTitle', 'showComment');
}

1;

__END__
