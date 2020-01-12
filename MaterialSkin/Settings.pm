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
use Slim::Utils::Strings qw(cstring);
use Slim::Menu::BrowseLibrary;
use Slim::Utils::Prefs;

my $DEFAULT_DISABLED_BROWSE_MODES = ['myMusicFlopTracks', 'myMusicTopTracks', 'myMusicFileSystem'];

my $prefs = preferences('plugin.material-skin');

sub name {
	return 'MATERIAL_SKIN';
}

sub page {
	return 'plugins/MaterialSkin/settings/basic.html';
}

sub prefs {
	return ($prefs, 'composergenres', 'conductorgenres', 'password');
}

sub handler {
	my ($class, $client, $params) = @_;

	if ($params->{'saveSettings'}) {
	    my $disabledModes=[];
	    for (my $i = 1; defined $params->{"id$i"}; $i++) {
	        if (! defined ($params->{"enabled$i"})) {
	            push @{$disabledModes}, $params->{"id$i"};
	        }
	    }
	    $prefs->set('disabledBrowseModes', $disabledModes);
	}

    my $disabledModes = $prefs->get('disabledBrowseModes');
    $disabledModes=$DEFAULT_DISABLED_BROWSE_MODES if $disabledModes eq '';
    my %disabledModes = map { $_ => 1 } @{$disabledModes};
    
    $params->{menu_items} = [ ];
    foreach my $node (@{Slim::Menu::BrowseLibrary->_getNodeList()}) {
        if ($node->{id} eq 'myMusicSearch') {
            next;
        }
        push @{$params->{menu_items}}, {id => $node->{id}, name => cstring('', $node->{name}), weight => $node->{weight}, enabled => exists($disabledModes{$node->{id}}) ? 0 : 1};
    }
    @{$params->{menu_items}} = sort { $a->{weight} <=> $b->{weight} } @{$params->{menu_items}};
                
	$class->SUPER::handler($client, $params);
}

1;

__END__
