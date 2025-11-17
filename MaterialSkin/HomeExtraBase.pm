package Plugins::MaterialSkin::HomeExtraBase;

use strict;

use base qw(Slim::Plugin::OPMLBased);
use Plugins::MaterialSkin::Plugin;

sub initPlugin {
	my ($class, %args) = @_;

	my $extra = delete $args{extra};

	$class->SUPER::initPlugin(%args);

	Plugins::MaterialSkin::Plugin->registerHomeExtra($args{tag}, {
		title => $extra->{title},
		icon  => $extra->{icon},
		needsPlayer => $extra->{needsPlayer},

		handler => sub { $class->handleExtra(@_) },
	});
}

#  we don't want these menus to be shown anywhere but as Home Extras
sub initJive {[]}

sub handleExtra {
	my ($class, $client, $cb, $count) = @_;

	Slim::Control::Request::executeRequest($client,
		[ $class->tag, 'items', 0, $count || Plugins::MaterialSkin::Plugin::NUM_HOME_ITEMS(), 'menu:1' ],
		sub {
			my $response = shift;
			my $results = $response->getResults() || {};
			$cb->($results);
		}
	);
}

1;