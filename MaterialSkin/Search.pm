package Plugins::MaterialSkin::Search;

#
# AdvancedSearch query. Code copied from Slim/Web/Pages/Search.pm
#

# Logitech Media Server Copyright 2001-2020 Logitech.
# This program is free software; you can redistribute it and/or
# modify it under the terms of the GNU General Public License, 
# version 2.

use strict;

use Date::Parse qw(str2time);
use File::Spec::Functions qw(:ALL);
use Digest::MD5 qw(md5_hex);
use Scalar::Util qw(blessed);
use Storable;

use Slim::Music::VirtualLibraries;
use Slim::Utils::Misc;
use Slim::Utils::Strings qw(string);
use Slim::Utils::Text;
use Slim::Utils::Log;
use Slim::Utils::Prefs;

sub advancedSearch {
	my $params  = shift;

	my %query   = ();
	my @qstring = ();
	
	#my $type = ($params->{'searchType'} || '') =~ /^(Track|Album)$/ ? $1 : 'Track';
	
	# keep a copy of the search params to be stored in a saved search
	my %searchParams;
	my %joins;

	# Check for valid search terms
	for my $key (sort keys %$params) {
		
		next unless $key =~ /^search\.(\S+)/;
		next unless $params->{$key};

		my $newKey = $1;

		#if ($params->{'resetAdvSearch'}) {
		#	delete $params->{$key};
		#	next;
		#}

		# Stuff the requested item back into the params hash, under
		# the special "search" hash. Because Template Toolkit uses '.'
		# as a delimiter for hash access.
		$params->{'search'}->{$newKey}->{'value'} = Slim::Utils::Unicode::utf8decode($params->{$key});

		# Apply the logical operator to the item in question.
		if ($key =~ /\.op$/) {

			my $op = $params->{$key};

			$key    =~ s/\.op$//;
			$newKey =~ s/\.op$//;

			$searchParams{$newKey} ||= {};
			$searchParams{$newKey}->{op} = $op; 

			next unless $params->{$key} || ($newKey eq 'year' && $params->{$key} eq '0');

			# Do the same for 'op's
			$params->{'search'}->{$newKey}->{'op'} = $params->{$key.'.op'};

			$newKey =~ s/_(rating|playcount|value|titlesearch|namesearch|)\b/\.$1/;

			# add these onto the query string. kinda jankey.
			push @qstring, join('=', "$key.op", $op);

			if (!grep /^$key=/, @qstring) {
				push @qstring, join('=', $key, $params->{$key});
			}

			# Bitrate needs to changed a bit
			if ($key =~ /bitrate$/) {
				$params->{$key} *= 1000;
			}

			# Date Modified is also special
			if ($key =~ /timestamp$/) {
				$params->{$key} = str2time($params->{$key});
			}

			# BETWEEN values can be something like "1970-1990" but expects an arrayref
			if ($op =~ /BETWEEN/) {
				$params->{$key} = [ split(/[,\-: ]/, $params->{$key}), '', '' ];
				splice(@{$params->{$key}}, 2);
			}

			if ($op =~ /(NOT )?LIKE/) {
				$op = $1 ? 'not like' : 'like';
			}

			if ($op =~ /STARTS (NOT )?WITH/) {
				$op = $1 ? 'not like' : 'like';

				# depending search preferences we might have an array, or even nested array - but we only want the first item
				while (ref $params->{$key} eq 'ARRAY') {
					$params->{$key} = shift @{$params->{$key}};
				}

				$params->{$key} =~ s/^\%//;
			}

			# if we've got multiple arguments, we'll have to logically AND them in case of NOT LIKE
			if ($op eq 'not like' && ref $params->{$key} eq 'ARRAY' && ref $params->{$key}->[0] eq 'ARRAY') {
				$query{-and} ||= [];
				push @{$query{-and}}, map { $newKey => { 'not like' => $_ }} @{$params->{$key}->[0]};
				delete $query{$newKey};
			}
			else {
				# Map the type to the query
				# This will be handed to SQL::Abstract
				$query{$newKey} = { $op => $params->{$key} };
			}

			# don't include null/0 value years in search for earlier years
			# http://bugs.slimdevices.com/show_bug.cgi?id=5713
			if ($newKey eq 'year' && $op eq '<') {
				$query{$newKey}->{'>'} = '0';
			}

=pod Shall we treat an undefined rating the same as 0?
			if ($newKey eq 'persistent.rating' && $op eq '<') {
				$query{$newKey} = {
					'or' => [
						$newKey => { '=' => undef },
						$newKey => $query{$newKey},
					],
				};
			}
=cut

			delete $params->{$key};

			next;
		}
		elsif ($key =~ /search\.(.*)\.(active\d+)$/) {
			$searchParams{$1} ||= {};
			$searchParams{$1}->{$2} = $params->{$key}; 

			next;
		}

		$searchParams{$newKey} ||= {};
		$searchParams{$newKey}->{value} = $params->{$key}; 

		# Append to the query string
		push @qstring, join('=', $key, Slim::Utils::Misc::escape($params->{$key}));

		# Normalize the string queries
		# 
		# Turn the track_title into track.title for the query.
		# We need the _'s in the form, because . means hash key.
		if ($newKey =~ s/(.+)_(titlesearch|namesearch|value|)$/$1\.$2/) {
			$joins{$1}++ if $1 ne 'me';

			$params->{$key} = Slim::Utils::Text::searchStringSplit($params->{$key});
		}

		$newKey =~ s/_(rating|playcount)\b/\.$1/;

		# Wildcard searches
		if ($newKey =~ /lyrics/) {

			$params->{$key} = Slim::Utils::Text::searchStringSplit($params->{$key});
		}

		if ($newKey =~ /url/) {
			my $uri = URI::Escape::uri_escape_utf8($params->{$key});
			
			# don't escape backslashes
			$uri =~ s$%(?:2F|5C)$/$ig;
			# replace the % in the URI escaped string with a single character placeholder
			$uri =~ s/%/_/g;

			$params->{$key} = "%$uri%";
		}

		$query{$newKey} = $params->{$key};
	}
	
	# show list of file types we have in the DB
	my $dbh = Slim::Schema->dbh;
	my $cache = Slim::Utils::Cache->new();
	my $prefix = Slim::Music::Import->lastScanTime() . '_advSearch_';
		
	if ( !($params->{'fileTypes'} = $cache->get($prefix . 'ctList')) ) {
		foreach my $ct ( @{ $dbh->selectcol_arrayref('SELECT DISTINCT content_type FROM tracks WHERE audio = 1') } ) {
			$params->{'fileTypes'} ||= {};
			$params->{'fileTypes'}->{lc($ct)} = string(uc($ct));
		}
		
		$cache->set($prefix . 'ctList', $params->{'fileTypes'}, 86400 * 7) if keys %{$params->{'fileTypes'}};
	}
	
	# get available samplerates
	if ( !($params->{'samplerates'} = $cache->get($prefix . 'samplerateList')) ) {
		$params->{'samplerates'} = $dbh->selectcol_arrayref('SELECT DISTINCT samplerate FROM tracks WHERE samplerate > 0');
		$cache->set($prefix . 'samplerateList', $params->{'samplerates'}, 86400 * 7) if scalar @{$params->{'samplerates'}};
	}
	
	if ( !($params->{'samplesizes'} = $cache->get($prefix . 'samplesizeList')) ) {
		$params->{'samplesizes'} = $dbh->selectcol_arrayref('SELECT DISTINCT samplesize FROM tracks WHERE samplesize > 0');
		$cache->set($prefix . 'samplesizeList', $params->{'samplesizes'}, 86400 * 7) if scalar @{$params->{'samplesizes'}};
	}
	
	# load up the genres we know about.
	my $collate = Slim::Utils::OSDetect->getOS()->sqlHelperClass()->collate();
	$params->{'genres'}     = Slim::Schema->search('Genre', undef, { 'order_by' => "namesort $collate" });
	$params->{'statistics'} = 1 if main::STATISTICS;
	$params->{'roles'}      = Slim::Schema::Contributor->roleToContributorMap;

	# short-circuit the query
	if (scalar keys %query == 0) {
		$params->{'numresults'} = -1;

		return;
	}

	my @joins = ();
	_initActiveRoles($params);

	if ($query{'contributor.namesearch'} || $joins{'contributor'}) {

		if (keys %{$params->{'search'}->{'contributor_namesearch'}}) {
			my @roles;
			foreach my $k (keys %{$params->{'search'}->{'contributor_namesearch'}}) {
				if ($k =~ /active(\d+)$/) {
					push @roles, $1;
					push @qstring, join('=', "search.contributor_namesearch.$k", 1);
				}
			}
			$query{"contributorTracks.role"} = \@roles if @roles;
		}

		if ($query{'contributor.namesearch'} || $joins{'contributor'}) {

			push @joins, { "contributorTracks" => 'contributor' };

		} else {

			push @joins, "contributorTracks";
		}
	}

	# Pull in the required joins

	# create sub-query to get text based genre matches (if needed)
	my $namesearch = delete $query{'genre_name'};
	if ($query{'genre'}) {
		
		# IDs can change. When we want to save a library definition we better use the genre name.
		if ( $query{'genre'} >= 0 && $params->{'action'} && $params->{'action'} eq 'saveLibraryView' && (my $saveSearch = $params->{saveSearch}) ) {
			$namesearch = Slim::Schema->search('Genre', { id => $query{'genre'} })->get_column('name')->first;
			$query{'genre'} = { 
				'in' => Slim::Schema->search('Genre', {
					'me.namesearch' => { 'like' => Slim::Utils::Text::searchStringSplit($namesearch) }
				})->get_column('id')->as_query
			} if $namesearch;
		}

		if ($query{'genre'} < 0) {
			if ($namesearch) {
				my @tokens = map {
					s/^\s*//;
					s/\s+$//;
					@{Slim::Utils::Text::searchStringSplit($_)};
				} split /,/, $namesearch;
				
				$query{'genre'} = { 
					($query{'genre'} == -2 ? 'not_in' : 'in') => Slim::Schema->search('Genre', {
						'me.namesearch' => { 'like' => \@tokens }
					})->get_column('id')->as_query
				};
			}
			else {
				delete $query{'genre'};
			}
		}
		
		push @joins, 'genreTracks' if $query{'genre'} || $query{'genres.namesearch'};
	}
	
	$query{'me.audio'} = 1;

	if ($query{'album.titlesearch'} || $joins{'album'}) {

		push @joins, 'album';
	}

	if ($query{'comments.value'} || $joins{'comments'}) {

		push @joins, 'comments';
	}
	
	if ( main::STATISTICS && $query{'persistent.rating'} || $query{'persistent.playcount'} ) {
		push @joins, 'persistent';
	}

    # TODO: Library ID???
	#if ( my $library_id = Slim::Music::VirtualLibraries->getLibraryIdForClient($client) ) {
    #
	#	push @joins, 'libraryTracks';
	#	$query{'libraryTracks.library'} = $library_id;
	#}

	# Disambiguate year
	if ($query{'year'}) {
		$query{'me.year'} = delete $query{'year'};
	}

	# XXXX - for some reason, the 'join' key isn't preserved when passed
	# along as a ref. Perl bug because 'join' is a keyword? Use 'joins' as well.
	my %attrs = (
		'join'  => \@joins,
		'joins' => \@joins,
	);
	
	$attrs{'order_by'} = "me.disc, me.titlesort $collate"; #if $type eq 'Track';
	
	# Create a resultset - have fillInSearchResults do the actual search.
	my $tracksRs = Slim::Schema->search('Track', \%query, \%attrs)->distinct;
	
	my $rs;
	#if ( $type eq 'Album' ) {
		$rs = Slim::Schema->search('Album', {
			'id' => { 'in' => $tracksRs->get_column('album')->as_query },
		},{
			'order_by' => "me.disc, me.titlesort $collate",
		});
	#}

	if ( $params->{'action'} && $params->{'action'} eq 'saveLibraryView' && (my $saveSearch = $params->{saveSearch}) ) {
		# build our own resultset, as we don't want the result to be sorted
		my $rs = Slim::Schema->search('Track', \%query, {
			'join'     => \@joins,
			'joins'    => \@joins,
		})->distinct;
		
		my $sqlQuery = $rs->get_column('id')->as_query;
		
		my $vlid = 'advSrch_' . time;
		
		Slim::Music::VirtualLibraries->registerLibrary( {
			id      => $vlid,
			name    => $saveSearch,
			sql     => $$sqlQuery,
			persist => 1,
		} );

		Slim::Music::VirtualLibraries->rebuild($vlid);
	}

	return ($tracksRs, $rs);
}

sub _initActiveRoles {
	my $params = shift;

	$params->{'search'} ||= {};
	$params->{'search'}->{'contributor_namesearch'} ||= {};

	foreach (Slim::Schema::Contributor->contributorRoleIds) {
		$params->{'search'}->{'contributor_namesearch'}->{'active' . $_} = 1 if $params->{'search.contributor_namesearch.active' . $_};
	}

	$params->{'search'}->{'contributor_namesearch'} = { map { ('active' . $_) => 1 } @{ Slim::Schema->artistOnlyRoles } } unless keys %{$params->{'search'}->{'contributor_namesearch'}};
}

1;

__END__
