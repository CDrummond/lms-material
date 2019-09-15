package Plugins::MaterialSkin::Settings;

#
# LMS-Material
#
# Copyright (c) 2018-2019 Craig Drummond <craig.p.drummond@gmail.com>
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
	return ($prefs, 'composergenres', 'conductorgenres');
}

1;

__END__
