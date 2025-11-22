package Plugins::MaterialSkin::PresetsExtra;

use strict;

use base qw(Plugins::MaterialSkin::HomeExtraBase);

use Slim::Utils::Prefs;

my $serverPrefs = preferences('server');

sub initPlugin {
    my $class = shift;

    $class->SUPER::initPlugin(
        feed => \&handleFeed,
        tag  => 'PresetsExtra',
        extra => {
            title => 'PLUGIN_MATERIAL_SKIN_PRESETS',
            icon => '/material/html/images/preset_MTL_icon_looks_one.png',
            needsPlayer => 1,
        }
    );
}

sub handleFeed {
    my ($client, $cb, $args) = @_;

    my $presets = [ map {
        {
            type => $_->{type},
            name => $_->{text},
            url  => $_->{URL},
            play => $_->{URL},
            favorites_url  => $_->{URL},
            image => Slim::Player::ProtocolHandlers->iconForURL($_->{URL}, $client),
        }
    } grep {
        $_->{type} eq 'audio' || $_->{type} eq 'playlist'
    } @{ $serverPrefs->client($client || (Slim::Player::Client::clients())[0])->get('presets') || [] } ];

    $cb->({ items => $presets });
}

1;