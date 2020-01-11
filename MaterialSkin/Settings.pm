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

my $DEFAULT_MODES = ["myMusicArtists", "myMusicArtistsAlbumArtists", "myMusicArtistsAllArtists", "myMusicAlbums", "myMusicAlbumsVariousArtists", "myMusicGenres", "myMusicPlaylists", "myMusicYears", "myMusicNewMusic", "myMusicRandomAlbums"];

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
	    my $enabledModes=[];
	    for (my $i = 1; defined $params->{"id$i"}; $i++) {
	        if (defined ($params->{"enabled$i"})) {
	            push @{$enabledModes}, $params->{"id$i"};
	        }
	    }
	    $prefs->set('enabledBrowseModes', $enabledModes);
	}

    my $enabledModes = $prefs->get('enabledBrowseModes');
    $enabledModes=$DEFAULT_MODES if $enabledModes eq '';
    my %enabledModes = map { $_ => 1 } @{$enabledModes};
    
    $params->{menu_items} = [ ];
    foreach my $node (@{Slim::Menu::BrowseLibrary->_getNodeList()}) {
        if ($node->{id} eq 'myMusicSearch') {
            next;
        }
        push @{$params->{menu_items}}, {id => $node->{id}, name => cstring('', $node->{name}), weight => $node->{weight}, enabled => exists($enabledModes{$node->{id}}) ? 1 : 0};
    }
    @{$params->{menu_items}} = sort { $a->{weight} <=> $b->{weight} } @{$params->{menu_items}};
                
	$class->SUPER::handler($client, $params);
}

1;

__END__
