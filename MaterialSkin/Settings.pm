package Plugins::MaterialSkin::Settings;

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
