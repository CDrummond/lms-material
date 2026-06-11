package Plugins::MaterialSkin::HomeExtraBase;

use strict;

use base qw(Slim::Plugin::OPMLBased);
use Plugins::MaterialSkin::Plugin;

sub initPlugin {
    my ($class, %args) = @_;

    my $extra = delete $args{extra};

    $class->SUPER::initPlugin(%args);
    
    $extra->{handler} = sub { $class->handleExtra(@_) }; 

    Plugins::MaterialSkin::Plugin->registerHomeExtra($args{tag}, $extra); }

#  we don't want these menus to be shown anywhere but as Home Extras
sub initJive {[]}
sub modeName {}

sub handleExtra {
    my ($class, $client, $cb, $args) = @_;

    my @cmd = ($class->tag, 'items', $args->{index}, $args->{quantity}, 'menu:1');
    push(@cmd, "user_id:$args->{userId}") if $args->{userId};
    push(@cmd, "features:$args->{features}") if $args->{features};

    $log->error('handleExtra ', Data::Dump::dump(\@cmd), Data::Dump::dump($args));

    Slim::Control::Request::executeRequest($client, \@cmd,
        sub {
            my $response = shift;
            my $results = $response->getResults() || {};
            $cb->($results);
        }
    );
}

1;