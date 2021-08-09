package Plugins::MaterialSkin::Plugin;

#
# LMS-Material
#
# Copyright (c) 2018-2021 Craig Drummond <craig.p.drummond@gmail.com>
#
# MIT license.
#

use strict;

use Config;
use Scalar::Util qw(blessed);
use Slim::Menu::BrowseLibrary;
use Slim::Music::VirtualLibraries;
use Slim::Utils::Favorites;
use Slim::Utils::Log;
use Slim::Utils::Network;
use Slim::Utils::Prefs;
use Slim::Utils::Strings;
use JSON::XS::VersionOneAndTwo;
use Slim::Utils::Strings qw(string cstring);
use HTTP::Status qw(RC_NOT_FOUND RC_OK);
use File::Basename;
use File::Slurp qw(read_file);

if (!Slim::Web::Pages::Search->can('parseAdvancedSearchParams')) {
    require Plugins::MaterialSkin::Search;
}

my $log = Slim::Utils::Log->addLogCategory({
    'category' => 'plugin.material-skin',
    'defaultLevel' => 'ERROR',
    'description' => 'PLUGIN_MATERIAL_SKIN'
});

my $prefs = preferences('plugin.material-skin');
my $serverprefs = preferences('server');
my $skinMgr;

my $MAX_ADV_SEARCH_RESULTS = 1000;
my $DESKTOP_URL_PARSER_RE = qr{^desktop$}i;
my $MINI_URL_PARSER_RE = qr{^mini$}i;
my $NOW_PLAYING_URL_PARSER_RE = qr{^now-playing$}i;
my $NOW_PLAYING_ONLY_URL_PARSER_RE = qr{^np-only$}i;
my $MOBILE_URL_PARSER_RE = qr{^mobile$}i;
my $SVG_URL_PARSER_RE = qr{material/svg/([a-z0-9-]+)}i;
my $CSS_URL_PARSER_RE = qr{material/customcss/([a-z0-9-]+)}i;
my $JS_URL_PARSER_RE = qr{material/custom.js}i;
my $OTHER_JS_URL_PARSER_RE = qr{material/customjs/([a-z0-9-]+)}i;
my $ICON_URL_PARSER_RE = qr{material/icon\.png}i;
my $ACTIONS_URL_PARSER_RE = qr{material/customactions\.json}i;
my $MAIFEST_URL_PARSER_RE = qr{material/material\.webmanifest}i;
my $USER_THEME_URL_PARSER_RE = qr{material/usertheme/.+}i;
my $USER_COLOR_URL_PARSER_RE = qr{material/usercolor/.+}i;
my $DOWNLOAD_PARSER_RE = qr{material/download/.+}i;

my $DEFAULT_COMPOSER_GENRES = string('PLUGIN_MATERIAL_SKIN_DEFAULT_COMPOSER_GENRES');
my $DEFAULT_CONDUCTOR_GENRES = string('PLUGIN_MATERIAL_SKIN_DEFAULT_CONDUCTOR_GENRES');
my $DEFAULT_BAND_GENRES = string('PLUGIN_MATERIAL_SKIN_DEFAULT_BAND_GENRES');

my @DEFAULT_BROWSE_MODES = ( 'myMusicArtists', 'myMusicArtistsAlbumArtists', 'myMusicArtistsAllArtists', 'myMusicAlbums',
                             'myMusicGenres', 'myMusicYears', 'myMusicNewMusic','myMusicPlaylists', 'myMusicAlbumsVariousArtists' );

my %EXCLUDE_EXTRAS = map { $_ => 1 } ( 'ALARM', 'PLUGIN_CUSTOMBROWSE', 'PLUGIN_IPENG_CUSTOM_BROWSE_MORE', 'PLUGIN_DSTM', 'PLUGIN_TRACKSTAT', 'PLUGIN_DYNAMICPLAYLIST' );

my @ADV_SEARCH_OPS = ('album_titlesearch', 'bitrate', 'comments_value', 'contributor_namesearch', 'filesize', 'lyrics', 'me_titlesearch', 'persistent_playcount',
                      'persistent_rating', 'samplerate', 'samplesize', 'secs', 'timestamp', 'tracknum', 'url', 'year' );
my @ADV_SEARCH_OTHER = ('content_type', 'contributor_namesearch.active1', 'contributor_namesearch.active2', 'contributor_namesearch.active3', 'contributor_namesearch.active4',
                        'contributor_namesearch.active5', 'genre', 'genre_name' );

my %IGNORE_PROTOCOLS = map { $_ => 1 } ('mms', 'file', 'tmp', 'http', 'https', 'spdr', 'icy', 'teststream', 'db', 'playlist');

sub initPlugin {
    my $class = shift;

    if (my $composergenres = $prefs->get('composergenres')) {
        $prefs->set('composergenres', $DEFAULT_COMPOSER_GENRES) if $composergenres eq '';
    } else {
        $prefs->set('composergenres', $DEFAULT_COMPOSER_GENRES);
    }

    if (my $conductorgenres = $prefs->get('conductorgenres')) {
        $prefs->set('conductorgenres', $DEFAULT_CONDUCTOR_GENRES) if $conductorgenres eq '';
    } else {
        $prefs->set('conductorgenres', $DEFAULT_CONDUCTOR_GENRES);
    }

    if (my $bandgenres = $prefs->get('bandgenres')) {
        $prefs->set('bandgenres', $DEFAULT_BAND_GENRES) if $bandgenres eq '';
    } else {
        $prefs->set('bandgenres', $DEFAULT_BAND_GENRES);
    }

    $prefs->init({
        composergenres => $DEFAULT_COMPOSER_GENRES,
        conductorgenres => $DEFAULT_CONDUCTOR_GENRES,
        bandgenres => $DEFAULT_BAND_GENRES,
        showComposer => '1',
        showConductor => '0',
        showBand => '0',
        respectFixedVol => '1',
        showAllArtists => '1',
        artistFirst => '1',
        password => '',
        downloading => '0'
    });

    if (main::WEBUI) {
        require Plugins::MaterialSkin::Settings;
        Plugins::MaterialSkin::Settings->new();

        Slim::Web::Pages->addPageFunction( $DESKTOP_URL_PARSER_RE, sub {
            my ($client, $params) = @_;
            return Slim::Web::HTTP::filltemplatefile('desktop.html', $params);
        } );
        Slim::Web::Pages->addPageFunction( $MINI_URL_PARSER_RE, sub {
            my ($client, $params) = @_;
            return Slim::Web::HTTP::filltemplatefile('mini.html', $params);
        } );
        Slim::Web::Pages->addPageFunction( $NOW_PLAYING_URL_PARSER_RE, sub {
            my ($client, $params) = @_;
            return Slim::Web::HTTP::filltemplatefile('now-playing.html', $params);
        } );
        Slim::Web::Pages->addPageFunction( $NOW_PLAYING_ONLY_URL_PARSER_RE, sub {
            my ($client, $params) = @_;
            return Slim::Web::HTTP::filltemplatefile('np-only.html', $params);
        } );
        Slim::Web::Pages->addPageFunction( $MOBILE_URL_PARSER_RE, sub {
            my ($client, $params) = @_;
            return Slim::Web::HTTP::filltemplatefile('mobile.html', $params);
        } );

        Slim::Web::Pages->addRawFunction($SVG_URL_PARSER_RE, \&_svgHandler);
        Slim::Web::Pages->addRawFunction($CSS_URL_PARSER_RE, \&_customCssHandler);
        Slim::Web::Pages->addRawFunction($JS_URL_PARSER_RE, \&_customJsHandler);
        Slim::Web::Pages->addRawFunction($OTHER_JS_URL_PARSER_RE, \&_customJsHandler);
        Slim::Web::Pages->addRawFunction($ICON_URL_PARSER_RE, \&_iconHandler);
        Slim::Web::Pages->addRawFunction($ACTIONS_URL_PARSER_RE, \&_customActionsHandler);
        Slim::Web::Pages->addRawFunction($MAIFEST_URL_PARSER_RE, \&_manifestHandler);
        Slim::Web::Pages->addRawFunction($USER_THEME_URL_PARSER_RE, \&_userThemeHandler);
        Slim::Web::Pages->addRawFunction($USER_COLOR_URL_PARSER_RE, \&_userColorHandler);
        Slim::Web::Pages->addRawFunction($DOWNLOAD_PARSER_RE, \&_downloadHandler);
        # make sure scanner does pre-cache artwork in the size the skin is using in browse modesl
        Slim::Control::Request::executeRequest(undef, [ 'artworkspec', 'add', '300x300_f', 'Material Skin' ]);

        $skinMgr = Slim::Web::HTTP::getSkinManager();
    }

    $class->initCLI();
}

sub pluginVersion {
    my ($class) = @_;
    my $version = Slim::Utils::PluginManager->dataForPlugin($class)->{version};

    if ($version eq 'DEVELOPMENT') {
        # Try to get the git revision from which we're running
        if (my ($skinDir) = grep /MaterialSkin/, @{Slim::Web::HTTP::getSkinManager()->_getSkinDirs() || []}) {
            my $revision = `cd $skinDir && git show -s --format=%h\\|%ci 2> /dev/null`;
            if ($revision =~ /^([0-9a-f]+)\|(\d{4}-\d\d-\d\d.*)/i) {
                $version = 'GIT-' . $1;
            }
        }
    }

    if ($version eq 'DEVELOPMENT') {
        use POSIX qw(strftime);
        my $datestring = strftime("%Y-%m-%d-%H-%M-%S", localtime);
        $version = "DEV-${datestring}";
    }

    return $version;
}

sub windowTitle {
    my $title = $prefs->get('windowTitle');
    if (!$title || $title eq '') {
        return 'Logitech Media Server';
    }
    return $title;
}

sub initCLI {
    #                                                                      |requires Client
    #                                                                      |  |is a Query
    #                                                                      |  |  |has Tags
    #                                                                      |  |  |  |Function to call
    #                                                                      C  Q  T  F
    Slim::Control::Request::addDispatch(['material-skin', '_cmd'],        [0, 0, 1, \&_cliCommand]);
    Slim::Control::Request::addDispatch(['material-skin-client', '_cmd'], [1, 0, 1, \&_cliClientCommand]);
    Slim::Control::Request::addDispatch(['material-skin-group', '_cmd'],  [1, 0, 1, \&_cliGroupCommand]);
}

sub _startsWith {
    return substr($_[0], 0, length($_[1])) eq $_[1];
}

sub _cliCommand {
    my $request = shift;

    # check this is the correct query.
    if ($request->isNotCommand([['material-skin']])) {
        $request->setStatusBadDispatch();
        return;
    }

    my $cmd = $request->getParam('_cmd');

    if ($request->paramUndefinedOrNotOneOf($cmd, ['prefs', 'info', 'transferqueue', 'favorites', 'delete-favourite', 'map', 'delete-podcast',
                                                  'add-podcast', 'edit-podcast', 'podcast-url', # TODO Remove after LMS8.2 released...
                                                  'plugins', 'plugins-status', 'plugins-update', 'extras', 'delete-vlib', 'pass-isset',
                                                  'pass-check', 'browsemodes', 'geturl', 'command', 'scantypes', 'server', 'themes',
                                                  'playericons', 'activeplayers', 'urls', 'adv-search', 'adv-search-params', 'protocols']) ) {
        $request->setStatusBadParams();
        return;
    }

    if ($cmd eq 'prefs') {
        $request->addResult('composergenres', $prefs->get('composergenres'));
        $request->addResult('conductorgenres', $prefs->get('conductorgenres'));
        $request->addResult('bandgenres', $prefs->get('bandgenres'));
        $request->addResult('showComposer', $prefs->get('showComposer'));
        $request->addResult('showConductor', $prefs->get('showConductor'));
        $request->addResult('showBand', $prefs->get('showBand'));
        $request->addResult('respectFixedVol', $prefs->get('respectFixedVol'));
        $request->addResult('showAllArtists', $prefs->get('showAllArtists'));
        $request->addResult('artistFirst', $prefs->get('artistFirst'));
        $request->addResult('allowDownload', $prefs->get('allowDownload'));
        $request->setStatusDone();
        return;
    }

    if ($cmd eq 'info') {
        my $osDetails = Slim::Utils::OSDetect::details();
        my $serverPrefs = preferences('server');
        $request->addResult('info', '{"server":'
                                .'[ {"label":"' . string('INFORMATION_VERSION') . '", "text":"' . $::VERSION . ' - ' . $::REVISION . ' @ ' . $::BUILDDATE . '"},'
                                .  '{"label":"' . string('INFORMATION_HOSTNAME') . '", "text":"' . Slim::Utils::Network::hostName() . '"},'
                                .  '{"label":"' . string('INFORMATION_SERVER_IP') . '", "text":"' . Slim::Utils::Network::serverAddr() . '"},'
                                .  '{"label":"' . string('INFORMATION_OPERATINGSYSTEM') . '", "text":"' . $osDetails->{'osName'} . ' - ' . $serverPrefs->get('language') .
                                      ' - ' . Slim::Utils::Unicode::currentLocale() . '"},'
                                .  '{"label":"' . string('INFORMATION_ARCHITECTURE') . '", "text":"' . ($osDetails->{'osArch'} ? $osDetails->{'osArch'} : '?') . '"},'
                                .  '{"label":"' . string('PERL_VERSION') . '", "text":"' . $Config{'version'} . ' - ' . $Config{'archname'} . '"},'
                                .  '{"label":"Audio::Scan", "text":"' . $Audio::Scan::VERSION . '"},'
                                .  '{"label":"IO::Socket::SSL", "text":"' . (Slim::Networking::Async::HTTP->hasSSL() ? $IO::Socket::SSL::VERSION : string('BLANK')) . '"}'

                                . ( Slim::Schema::hasLibrary() ? ', {"label":"' . string('DATABASE_VERSION') . '", "text":"' .
                                      Slim::Utils::OSDetect->getOS->sqlHelperClass->sqlVersionLong( Slim::Schema->dbh ) . '"}' : '')

                                .']}');
        $request->setStatusDone();
        return;
    }

    if ($cmd eq 'transferqueue') {
        my $fromId = $request->getParam('from');
        my $toId = $request->getParam('to');
        my $mode = $request->getParam('mode');
        if (!$fromId || !$toId || !$mode) {
            $request->setStatusBadParams();
            return;
        }
        my $from = Slim::Player::Client::getClient($fromId);
        my $to = Slim::Player::Client::getClient($toId);
        if (!$from || !$to) {
            $request->setStatusBadParams();
            return;
        }

        # Remeber if source was playing, and start dest playing if so
        my $fromWasPlaying = $from->isPlaying();
        my $toWasPlaying = $to->isPlaying();
        my $fromCurrentIndex = Slim::Player::Source::playingSongIndex($from);
        my $toCurrentIndex = Slim::Player::Source::playingSongIndex($to);

        # Get list of playes source is currently synced with
        my @sourceBuddies;
        if ($from->isSynced()) {
            @sourceBuddies = $from->syncedWith();
            # Check that we are not already synced with dest player...
            for my $buddy (@sourceBuddies) {
                if ($buddy->id() eq $toId) {
                    main::INFOLOG && $log->is_info && $log->info("Tried to move client $fromId to a player its already synced with ($toId)");
                    $request->setStatusBadParams();
                    return;
                }
            }
        }

        # Get list of players dest is currently synced with
        my @destBuddies;
        if ($to->isSynced()) {
            @destBuddies = $to->syncedWith();
        }

        $to->execute(['power', 1]) unless $to->power;

        if ($mode eq 'swap') {
            my $fromPl = 'material-skin-swap-' . $fromId;
            my $toPl = 'material-skin-swap-' . $toId;
            $fromPl =~ s/:/_/g;
            $toPl =~ s/:/_/g;

            # Save to temporary playlists
            $from->execute(['playlist', 'save', $fromPl]);
            my $fromPlObj = Slim::Schema->single('Playlist', { 'title' => $fromPl });
            if (!blessed($fromPlObj)) {
                $request->setStatusBadParams();
                return;
            }
            $to->execute(['playlist', 'save', $toPl]);
            my $toPlObj = Slim::Schema->single('Playlist', { 'title' => $toPl });
            if (!blessed($toPlObj)) {
                Slim::Control::Request::executeRequest(undef, ['playlists', 'delete', 'playlist_id:' . $fromPlObj->id]);
                $request->setStatusBadParams();
                return;
            }

            # Clear players, and load temp playlists
            $from->execute(['playlist', 'clear']);
            $from->execute(['playlistcontrol', 'cmd:add', 'playlist_id:' . $toPlObj->id]);
            $to->execute(['playlist', 'clear']);
            $to->execute(['playlistcontrol', 'cmd:add', 'playlist_id:' . $fromPlObj->id]);

            # Tidy up - remove temp playlists
            Slim::Control::Request::executeRequest(undef, ['playlists', 'delete', 'playlist_id:' . $fromPlObj->id]);
            Slim::Control::Request::executeRequest(undef, ['playlists', 'delete', 'playlist_id:' . $toPlObj->id]);
        } else {
            # Sync with destination player - queue will be copied
            $from->execute(['sync', $toId]);
            if ( exists $INC{'Slim/Plugin/RandomPlay/Plugin.pm'} && (my $mix = Slim::Plugin::RandomPlay::Plugin::active($from)) ) {
                $to->execute(['playlist', 'addtracks', 'listRef', ['randomplay://' . $mix] ]);
            }

            # Switch to now playing view?
            $to->execute(['now-playing']);

            # Now unsync source from dest
            $from->execute(['sync', '-']);
        }

        # If dest was in a sync group, re-add the buddies...
        for my $buddy (@destBuddies) {
            $to->execute(['sync', $buddy->id()]);
        }

        # Restore any previous synced players
        for my $buddy (@sourceBuddies) {
            $from->execute(['sync', $buddy->id()]);
        }

        # If queue is moved then clear source
        if ($mode eq 'move') {
            $from->execute(['playlist', 'clear']);
            $from->execute(['power', 0]);
        }

        if ($mode eq 'swap') {
            if ($fromWasPlaying) {
                $to->execute(['playlist', 'index', $fromCurrentIndex]);
            }
            if ($toWasPlaying) {
                $from->execute(['playlist', 'index', $toCurrentIndex]);
            }
        } else {
            # Sometimes sync goes bit off even when all sync settings are correct so
            # if dest is synced power off and on again
            if ($to->isSynced() || $to->model eq 'group') {
                $to->execute(['power', 0]);
                # ...power back on after 1 second...
                Slim::Utils::Timers::setTimer($to, Time::HiRes::time() + 1.00, sub {
                    my ( $to, $fromWasPlaying ) = @_;
                    $to->execute(['power', 1]);

                    # If destination was a group, then power off/on yet again!
                    if ($to->model eq 'group') {
                        $to->execute(['power', 0]);
                        # ...and wait 1 second again...
                        Slim::Utils::Timers::setTimer($to, Time::HiRes::time() + 1.00, sub {
                            my ( $to, $fromWasPlaying ) = @_;
                            $to->execute(['power', 1]);
                            if ($fromWasPlaying) {
                                $to->execute(['play']);
                            }
                        }, $fromWasPlaying);
                    } elsif ($fromWasPlaying) {
                        $to->execute(['play']);
                    }
                }, $fromWasPlaying);
            } elsif ($fromWasPlaying) {
                $to->execute(['play']);
            }
        }

        $request->setStatusDone();
        return;
    }

    if ($cmd eq 'favorites') {
        my $cnt = 0;
        if (my $favsObject = Slim::Utils::Favorites->new()) {
            foreach my $fav (@{$favsObject->all}) {
                $request->addResultLoop("favs_loop", $cnt, "url", $fav->{url});
                $cnt++;
            }
        }
        $request->setStatusDone();
        return;
    }

    if ($cmd eq 'delete-favourite') {
        my $url = $request->getParam('url');
        if (!$url) {
            $request->setStatusBadParams();
            return;
        }
        my $favs = Slim::Plugin::Favorites::OpmlFavorites->new('xx');
        $favs->deleteUrl($url);
        $request->setStatusDone();
        return;
    }

    if ($cmd eq 'map') {
        my $genre = $request->getParam('genre');
        my $artist = $request->getParam('artist');
        my $genre_id = $request->getParam('genre_id');
        my @list;
        my $sql;
        my $resp = "";
        my $resp_name;
        my $count = 0;
        my $dbh = Slim::Schema->dbh;
        my $col;
        if ($genre) {
            @list = split(/,/, $genre);
            $sql = $dbh->prepare_cached( qq{SELECT genres.id FROM genres WHERE name = ? LIMIT 1} );
            $resp_name = "genre_id";
            $col = 'id';
        } elsif ($genre_id) {
            @list = split(/,/, $genre_id);
            $sql = $dbh->prepare_cached( qq{SELECT genres.name FROM genres WHERE id = ? LIMIT 1} );
            $resp_name = "genre";
            $col = 'name';
        } elsif ($artist) {
            @list = split(/,/, $artist);
            $sql = $dbh->prepare_cached( qq{SELECT contributors.id FROM contributors WHERE name = ? LIMIT 1} );
            $resp_name = "artist_id";
            $col = 'id';
        } else {
            $request->setStatusBadParams();
            return;
        }

        foreach my $g (@list) {
            $sql->execute($g);
            if ( my $result = $sql->fetchall_arrayref({}) ) {
                my $val = $result->[0]->{$col} if ref $result && scalar @$result;
                if ($val) {
                    if ($count>0) {
                        $resp = $resp . ",";
                    }
                    $resp=$resp . $val;
                    $count++;
                }
            }
        }
        $request->addResult($resp_name, $resp);
        $request->setStatusDone();
        return;
    }

    if ($cmd eq 'delete-podcast') {
        my $pos = $request->getParam('pos');
        my $name = $request->getParam('name');
        if (defined $pos) {
            my $podPrefs = preferences('plugin.podcast');
            my $feeds = $podPrefs->get('feeds');
            if ($pos < scalar @{$feeds}) {
                if (@{$feeds}[$pos]->{'name'} eq $name) {
                    splice @{$feeds}, $pos, 1;
                    $podPrefs->set(feeds => $feeds);
                    $request->setStatusDone();
                } else {
                    $request->setStatusBadParams();
                }
                return;
            }
        }
    }

    # TODO Remove after LMS8.2 released...
    if ($cmd eq 'add-podcast') {
        my $name = $request->getParam('name');
        my $url = $request->getParam('url');
        if ($name && $url) {
            my $podPrefs = preferences('plugin.podcast');
            my $feeds = $podPrefs->get('feeds');
            push @{$feeds}, { 'name' => $name, 'value' => $url };
            $podPrefs->set(feeds => $feeds);
            $request->setStatusDone();
            return;
        }
    }

    if ($cmd eq 'edit-podcast') {
        my $pos = $request->getParam('pos');
        my $name = $request->getParam('newname');
        my $origName = $request->getParam('oldname');
        my $url = $request->getParam('newurl');
        my $origUrl = $request->getParam('oldurl');
        if (defined $pos && $name && $origName && $url && $origUrl) {
            my $podPrefs = preferences('plugin.podcast');
            my $feeds = $podPrefs->get('feeds');
            if ($pos < scalar @{$feeds}) {
                if (@{$feeds}[$pos]->{'name'} eq $origName && @{$feeds}[$pos]->{'value'} eq $origUrl) {
                    @{$feeds}[$pos]->{'name'}=$name;
                    @{$feeds}[$pos]->{'value'}=$url;
                    $podPrefs->set(feeds => $feeds);
                    $request->setStatusDone();
                } else {
                    $request->setStatusBadParams();
                }
                return;
            }
        }
    }

    if ($cmd eq 'podcast-url') {
        my $pos = $request->getParam('pos');
        my $name = $request->getParam('name');
        if (defined $pos && $name) {
            my $podPrefs = preferences('plugin.podcast');
            my $feeds = $podPrefs->get('feeds');
            if ($pos < scalar @{$feeds}) {
                if (@{$feeds}[$pos]->{'name'} eq $name) {
                    $request->addResult("url", @{$feeds}[$pos]->{'value'});
                    $request->setStatusDone();
                } else {
                    $request->setStatusBadParams();
                }
                return;
            }
        }
    }
    # ...TODO Remove after LMS8.2 released

    if ($cmd eq 'plugins') {
        my ($current, $active, $inactive, $hide) = Slim::Plugin::Extensions::Plugin::getCurrentPlugins();
        my $cnt = 0;
        foreach my $plugin (@{$active}) {
            $request->addResultLoop("plugins_loop", $cnt, "name", $plugin->{name});
            $request->addResultLoop("plugins_loop", $cnt, "title", $plugin->{title});
            $request->addResultLoop("plugins_loop", $cnt, "descr", $plugin->{desc});
            $request->addResultLoop("plugins_loop", $cnt, "creator", $plugin->{creator});
            $request->addResultLoop("plugins_loop", $cnt, "homepage", $plugin->{homepage});
            $request->addResultLoop("plugins_loop", $cnt, "email", $plugin->{email});
            $request->addResultLoop("plugins_loop", $cnt, "version", $plugin->{version});
            $cnt++;
        }
        $request->setStatusDone();
        return;
    }

    if ($cmd eq 'plugins-status') {
        $request->addResult("needs_restart", Slim::Utils::PluginManager->needsRestart ? 1 : 0);
        $request->addResult("downloading", Slim::Utils::PluginDownloader->downloading ? 1 : 0);
        $request->setStatusDone();
        return;
    }

    if ($cmd eq 'plugins-update') {
        my $json = $request->getParam('plugins');
        if ($json) {
            my $updating = 0;
            my $plugins = eval { from_json( $json ) };
            for my $plugin (@{$plugins}) {
                Slim::Utils::PluginDownloader->install({ name => $plugin->{'name'}, url => $plugin->{'url'}, sha => $plugin->{'sha'} });
                $updating++;
            }
            $request->addResult("updating", $updating);
            $request->setStatusDone();
            return;
        }
    }

    if ($cmd eq 'extras') {
        my $cnt = 0;
        my $icons;
        while (my ($menu, $menuItems) = each %Slim::Web::Pages::additionalLinks ) {
            if ($menu eq 'icons') {
                $icons = $menuItems;
            }
        }

        while (my ($menu, $menuItems) = each %Slim::Web::Pages::additionalLinks ) {
            if ($menu eq 'plugins') {
                foreach my $key (keys %$menuItems) {
                    if (not exists($EXCLUDE_EXTRAS{$key})) {
                        $request->addResultLoop("extras_loop", $cnt, "id", $key);
                        $request->addResultLoop("extras_loop", $cnt, "url", $menuItems->{$key});
                        $request->addResultLoop("extras_loop", $cnt, "title", string($key));
                        if ($icons and $icons->{$key}) {
                            $request->addResultLoop("extras_loop", $cnt, "icon", $icons->{$key});
                        }
                        $cnt++;
                    }
                }
            } elsif ($menu eq 'browseiPeng') {
                foreach my $key (keys %$menuItems) {
                    if (not exists($EXCLUDE_EXTRAS{$key})) {
                        $request->addResultLoop("extras_loop", $cnt, "id", $key);
                        $request->addResultLoop("extras_loop", $cnt, "url", $menuItems->{$key});
                        $request->addResultLoop("extras_loop", $cnt, "title", string($key));
                        if ($icons and $icons->{$key}) {
                            $request->addResultLoop("extras_loop", $cnt, "icon", $icons->{$key});
                        }
                        $cnt++;
                    }
                }
            }
        }
        $request->setStatusDone();
        return;
    }

    if ($cmd eq 'delete-vlib') {
        my $id = $request->getParam('id');
        if ($id) {
            Slim::Music::VirtualLibraries->unregisterLibrary($id);
            $request->setStatusDone();
            return;
        }
    }

    if ($cmd eq 'pass-isset') {
        my $storedPass = $prefs->get('password');
        if (($storedPass eq '')) {
            $request->addResult("set", 0);
        } else {
            $request->addResult("set", 1);
        }
        $request->setStatusDone();
        return;
    }

    if ($cmd eq 'pass-check') {
        my $pass = $request->getParam('pass');
        if ($pass) {
            my $storedPass = $prefs->get('password');
            if (($storedPass eq '') || ($storedPass eq $pass)) {
                $request->addResult("ok", 1);
            } else {
                $request->addResult("ok", 0);
            }
            $request->setStatusDone();
            return;
        }
    }

    if ($cmd eq 'browsemodes') {
        my $useUnifiedArtistsList = $serverprefs->get('useUnifiedArtistsList');
        my $cnt = 0;

        foreach my $node (@{Slim::Menu::BrowseLibrary->_getNodeList()}) {
            if ($node->{id} eq 'myMusicSearch') {
                next;
            }
            if ($useUnifiedArtistsList) {
                if (($node->{'id'} eq 'myMusicArtistsAllArtists') || ($node->{'id'} eq 'myMusicArtistsAlbumArtists')) {
                    next;
                }
            } else {
                if ($node->{'id'} eq 'myMusicArtists') {
                    next;
                }
            }
            $request->addResultLoop("modes_loop", $cnt, "id", $node->{'id'});
            $request->addResultLoop("modes_loop", $cnt, "text", string($node->{'name'}));
            $request->addResultLoop("modes_loop", $cnt, "weight", $node->{'weight'});
            $request->addResultLoop("modes_loop", $cnt, "params", $node->{'params'});
            if ($node->{'jiveIcon'}) {
                $request->addResultLoop("modes_loop", $cnt, "icon", $node->{'jiveIcon'});
            } elsif ($node->{'icon'}) { # ???
                $request->addResultLoop("modes_loop", $cnt, "icon", $node->{'icon'});
            }
            $cnt++;
        }
        $request->setStatusDone();
        return;
    }

    if ($cmd eq 'geturl') {
        my $url = $request->getParam('url');
        my $format = $request->getParam('format');
        if ($url) {
            main::DEBUGLOG && $log->debug("Get URL: $url");
            $request->setStatusProcessing();

            my $ua = Slim::Utils::Misc::userAgentString();
            $ua =~ s{iTunes/4.7.1}{Mozilla/5.0};
            my %headers = ( 'User-Agent' => $ua );

            Slim::Networking::SimpleAsyncHTTP->new(
                sub {
                    main::DEBUGLOG && $log->debug("Fetched URL");
                    my $response = shift;
                    my $content = $response->can('decoded_content')
                                ? $response->decoded_content
                                : $response->content;

                    if ( ($response->headers->content_type =~ /xml/) || ($format && $format eq 'xml')) {
                        require XML::Simple;
                        $request->addResult("content", XML::Simple::XMLin($content));
                    } elsif ( ($response->headers->content_type =~ /json/) || ($format && $format eq 'json') ) {
                        $request->addResult("content", from_json($content));
                    } else {
                        $request->addResult("content", $content);
                    }

                    $request->setStatusDone();
                },
                sub {
                    my $response = shift;
                    my $error  = $response->error;
                    main::DEBUGLOG && $log->debug("Failed to fetch URL: $error");
                    $request->setStatusDone();
                }, {
                   timeout => 15
                }
                )->get($url, %headers);
            return;
        }
    }

    if ($cmd eq 'command') {
        my $act = $request->getParam('cmd');
        if ($act) {
            $request->setStatusDone();
            system("$act");
            return;
        }
    }

    if ($cmd eq 'scantypes') {
        my @ver = split(/\./, $::VERSION);
        if (int($ver[0])<8) {
            $request->setResultLoopHash('item_loop', 0, { name => string('SETUP_STANDARDRESCAN'), cmd  => ['rescan'] });
            $request->setResultLoopHash('item_loop', 1, { name => string('SETUP_WIPEDB'), cmd  => ['wipecache'] });
            $request->setResultLoopHash('item_loop', 2, { name => string('SETUP_PLAYLISTRESCAN'), cmd  => ['rescan', 'playlists'] });
        } else {
            my $cnt = 0;
            my $scanTypes = Slim::Music::Import->getScanTypes();
            foreach ( map {
                    {
                            name => $scanTypes->{$_}->{name},
                            cmd => $scanTypes->{$_}->{cmd},
                            value => $_
                    }
            } sort keys %$scanTypes ) {
                $request->setResultLoopHash('item_loop', $cnt++, {
                        name => string($_->{name}),
                        cmd  => $_->{cmd} });
            }
        }
        $request->setStatusDone();
        return;
    }

    if ($cmd eq 'server') {
        $request->addResult("libraryname", Slim::Utils::Misc::getLibraryName());
        $request->setStatusDone();
        return;
    }

    if ($cmd eq 'themes') {
        my $cnt = 0;
        my $platform = $request->getParam('platform');
        my @variants=('light', 'dark');
        if ($platform) {
            foreach my $variant (@{variants}) {
                my $path = dirname(__FILE__) . "/HTML/material/html/css/themes/" . $platform . "/" . $variant;
                if (-d $path) {
                    opendir DIR, $path;
                    my @items = readdir(DIR);
                    close DIR;
                    foreach (@items) {
                        if (-f $path . "/" . $_ ) {
                            my @parts = split(/\./, $_);
                            if (((scalar(@parts)==2) && $parts[1]=='css') || ((scalar(@parts)==3) && $parts[1]=='min' && $parts[2]=='css')) {
                                $request->addResultLoop("themes", $cnt, "label", $parts[0]);
                                $request->addResultLoop("themes", $cnt, "key", $platform . "/" . $variant . "/" . $parts[0]);
                                $cnt++;
                            }
                        }
                    }
                }
            }
        }

        foreach my $variant (@{variants}) {
            my $path = Slim::Utils::Prefs::dir() . "/material-skin/themes/" . $variant;
            if (-d $path) {
                opendir DIR, $path;
                my @items = readdir(DIR);
                close DIR;
                foreach (@items) {
                    if (-f $path . "/" . $_ ) {
                        my @parts = split(/\./, $_);
                        if ((scalar(@parts)==2) && $parts[1]=='css') {
                            $request->addResultLoop("themes", $cnt, "label", $parts[0]);
                            $request->addResultLoop("themes", $cnt, "key", "user:" . $variant . "/" . $parts[0]);
                            $cnt++;
                        }
                    }
                }
            }
        }

        my $path = Slim::Utils::Prefs::dir() . "/material-skin/colors";
        if (-d $path) {
            opendir DIR, $path;
            my @items = readdir(DIR);
            close DIR;
            $cnt = 0;
            foreach (@items) {
                my $colorPath = $path . "/" . $_ ;
                if (-f $colorPath ) {
                    my @parts = split(/\./, $_);
                    if ((scalar(@parts)==2) && $parts[1]=='css') {
                        open my $info, $colorPath or next;
                        my $color="";
                        while (my $line = <$info>) {
                            if (index($line, '--primary-color')>=0) {
                                my @parts = split(/:/, $line);
                                if (scalar(@parts)==2) {
                                    $color = $parts[1];
                                    $color =~ s/^\s+|\s+$//g;
                                    $color =~ s/;//g;
                                }
                            }
                        }
                        close $info;
                        # --primary-color:#1976d2;
                        if (length($color)>=4) {
                            $request->addResultLoop("colors", $cnt, "color", $color);
                            $request->addResultLoop("colors", $cnt, "key", "user:" . $parts[0]);
                            $cnt++;
                        }
                    }
                }
            }
        }
        $request->setStatusDone();
        return;
    }

    if ($cmd eq 'playericons') {
        my $cnt = 0;
        foreach my $key (keys %{$prefs->{prefs}}) {
            if ($key =~ /^_client:.+/) {
                my $cpref = $prefs->get($key);
                my $icon = $prefs->get($key)->{'icon'};
                if ($icon) {
                    $request->addResultLoop("players", $cnt, "id", substr($key, 8));
                    $request->addResultLoop("players", $cnt, "icon", $icon);
                    $cnt++;
                }
            }
        }
        $request->setStatusDone();
        return;
    }

    if ($cmd eq 'activeplayers') {
        my $cnt = 0;
        my @players = Slim::Player::Client::clients();
        for my $player (@players) {
            if ($player->power() && $player->isPlaying()) {
                $request->addResultLoop("players", $cnt, "id", $player->id());
            }
        }
        $request->setStatusDone();
        return;
    }

    if ($cmd eq 'urls') {
        my $tracks = $request->getParam('tracks');
        if ($tracks) {
            my $dbh = Slim::Schema->dbh;
            my @list = split(/,/, $tracks);
            my $sql = $dbh->prepare_cached( qq{SELECT url FROM tracks WHERE id = ? LIMIT 1} );
            my $cnt = 0;
            foreach my $t (@list) {
                $sql->execute($t);
                if ( my $result = $sql->fetchall_arrayref({}) ) {
                    my $url = $result->[0]->{'url'} if ref $result && scalar @$result;
                    if ($url) {
                        $request->addResultLoop("urls_loop", $cnt, "url", $url);
                        $request->addResultLoop("urls_loop", $cnt, "id", $t);
                        $cnt++;
                    }
                }
            }
            $request->setStatusDone();
            return;
        }
    }

    if ($cmd eq 'adv-search') {
        my $params = {};
        my $saveLib = $request->getParam('savelib');

        foreach my $term (@ADV_SEARCH_OPS) {
            my $val = $request->getParam($term);
            my $op = $request->getParam($term . '.op');
            if ($op && $val) {
                $params->{'search.' . $term} = $val;
                $params->{'search.' . $term . '.op'} = $op;
            }
        }

        foreach my $term (@ADV_SEARCH_OTHER) {
            my $val = $request->getParam($term);
            if ($val) {
                $params->{'search.' . $term} = $val;
            }
        }

        if ($saveLib) {
            $params->{'action'} = 'saveLibraryView';
            $params->{'saveSearch'} = $saveLib;
        }

        my ($tracks, $albums) = Plugins::MaterialSkin::Search::advancedSearch($request->client(), $params);

        if (!$saveLib) {
            if ($tracks) {
                $tracks = $tracks->slice(0, $MAX_ADV_SEARCH_RESULTS);
                my $count = 0;
                while (my $track = $tracks->next) {
                    $request->addResultLoop('titles_loop', $count, 'id', $track->id);
                    $request->addResultLoop('titles_loop', $count, 'title', $track->title);
                    if ($track->coverid) {
                        $request->addResultLoop('titles_loop', $count, 'coverid', $track->coverid);
                    }
                    if ($track->tracknum) {
                        $request->addResultLoop('titles_loop', $count, 'tracknum', $track->tracknum);
                    }
                    $request->addResultLoop('titles_loop', $count, 'url', $track->url);
                    if ($track->year) {
                        $request->addResultLoop('titles_loop', $count, 'year', $track->year);
                    }
                    if ($track->disc) {
                        $request->addResultLoop('titles_loop', $count, 'disc', $track->disc);
                    }
                    if ($track->extid) {
                        $request->addResultLoop('titles_loop', $count, 'extid', $track->extid);
                    }
                    $request->addResultLoop('titles_loop', $count, 'bitrate', $track->bitrate);
                    $request->addResultLoop('titles_loop', $count, 'samplerate', $track->samplerate);
                    $request->addResultLoop('titles_loop', $count, 'type', $track->content_type);
                    $request->addResultLoop('titles_loop', $count, 'duration', $track->secs);
                    if ($track->rating) {
                        $request->addResultLoop('titles_loop', $count, 'rating', $track->rating);
                    }
                    if ($track->album) {
                        $request->addResultLoop('titles_loop', $count, 'album', $track->album->name);
                        $request->addResultLoop('titles_loop', $count, 'album_id', $track->album->id);
                    }
                    if ($track->artist) {
                        $request->addResultLoop('titles_loop', $count, 'artist', $track->artist->name);
                        $request->addResultLoop('titles_loop', $count, 'artist_id', $track->artist->id);
                    }
                    $count++;
                    main::idleStreams() unless $count % 5;
                }
            }
            if ($albums) {
                $albums = $albums->slice(0, $MAX_ADV_SEARCH_RESULTS);
                my $count = 0;
                while (my $album = $albums->next) {
                    $request->addResultLoop('albums_loop', $count, 'id', $album->id);
                    $request->addResultLoop('albums_loop', $count, 'album', $album->name);
                    if ($album->year) {
                        $request->addResultLoop('albums_loop', $count, 'year', $album->year);
                    }
                    if ($album->artwork) {
                        $request->addResultLoop('albums_loop', $count, 'artwork_track_id', $album->artwork);
                    }
                    if ($album->contributor) {
                        $request->addResultLoop('albums_loop', $count, 'artist', $album->contributor->name);
                        $request->addResultLoop('albums_loop', $count, 'artist_id', $album->contributor->id);
                    }
                    if ($album->extid) {
                        $request->addResultLoop('albums_loop', $count, 'extid', $album->extid);
                    }
                    # TODO: artists, artwork_url ???
                    $count++;
                    main::idleStreams() unless $count % 5;
                }
            }
        }
        $request->setStatusDone();
        return;
    }

    if ($cmd eq 'adv-search-params') {
        my $params = Plugins::MaterialSkin::Search::options($request->client());

        my $count = 0;
        while (my $genre = $params->{'genres'}->next) {
            $request->addResultLoop('genres_loop', $count, 'id', $genre->id);
            $request->addResultLoop('genres_loop', $count, 'name', $genre->name);
            $count++;
        }
        $count = 0;
        foreach my $samplerate (@{$params->{'samplerates'}}) {
            $request->addResultLoop('samplerates_loop', $count, 'rate', $samplerate);
            $count++;
        }
        $count = 0;
        foreach my $samplesize (@{$params->{'samplesizes'}}) {
            $request->addResultLoop('samplesizes_loop', $count, 'size', $samplesize);
            $count++;
        }
        $count = 0;
        while (my ($k, $v) = each %{$params->{'fileTypes'}}) {
            $request->addResultLoop('filetypes_loop', $count, 'id', $k);
            $request->addResultLoop('filetypes_loop', $count, 'name', $v);
            $count++;
        }
        $request->addResult('statistics', $params->{'statistics'});
        $request->setStatusDone();
        return;
    }

    if ($cmd eq 'protocols') {
        my $allPlugs =  Slim::Utils::PluginManager->allPlugins();
        my %handlers = Slim::Player::ProtocolHandlers->registeredHandlers();
        my $count = 0;
        foreach my $prot (keys %handlers) {
            if (not exists($IGNORE_PROTOCOLS{$prot})) {
                my $handler = Slim::Player::ProtocolHandlers->handlerForProtocol($prot);
                if ($handler) {
                    my $str = "" . $handler;
                    my @list = split(/::/, $str);
                    if (scalar(@list)>=2 && ($list[0] eq 'Plugins') || ($list[0] eq 'Plugin')) {
                        $request->addResultLoop('protocols_loop', $count, 'scheme', $prot);
                        $request->addResultLoop('protocols_loop', $count, 'plugin', string($allPlugs->{$list[1]}{'name'}));
                        $count++;
                    }
                }
            }
        }
        $request->setStatusDone();
        return;
    }

    $request->setStatusBadParams();
}

sub _cliClientCommand {
    my $request = shift;

    # check this is the correct query.
    if ($request->isNotCommand([['material-skin-client']])) {
        $request->setStatusBadDispatch();
        return;
    }
    my $cmd = $request->getParam('_cmd');
    my $client = $request->client();
    if ($request->paramUndefinedOrNotOneOf($cmd, ['set-lib']) ) {
        $request->setStatusBadParams();
        return;
    }

    if ($cmd eq 'set-lib') {
        my $id = $request->getParam('id');
        $serverprefs->client($client)->set('libraryId', $id);
        $serverprefs->client($client)->remove('libraryId') unless $id;
        Slim::Utils::Timers::setTimer($client, Time::HiRes::time() + 0.1, sub {Slim::Schema->totals($client);});
        $request->setStatusDone();
        return;
    }

    $request->setStatusBadParams();
}

sub _cliGroupCommand {
    my $request = shift;

    # check this is the correct query.
    if ($request->isNotCommand([['material-skin-group']])) {
        $request->setStatusBadDispatch();
        return;
    }

    my $cmd = $request->getParam('_cmd');
    my $client = $request->client();
    if ($request->paramUndefinedOrNotOneOf($cmd, ['set-modes']) ) {
        $request->setStatusBadParams();
        return;
    }

    if ($cmd eq 'set-modes') {
        # Set group player's enabled browse modes to the enabled modes of all members
        my $groupsPluginPrefs = preferences('plugin.groups');
        my $group = $groupsPluginPrefs->client($client);
        if ($group) {
            my $members = $group->get('members');
            if ($members) {
                my $groupPrefs = $serverprefs->client($client);
                my $modeList = Slim::Menu::BrowseLibrary->_getNodeList();
                my %modes;
                my $haveMember = 0;
                # Set all modes as disabled
                foreach my $mode (@{$modeList}) {
                    $modes{ $mode->{id} } = 1;
                }

                # iterate over all clients, and set mode to enabled if enabled for client
                foreach my $id (@{$members}) {
                    my $member = Slim::Player::Client::getClient($id);
                    if ($member) {
                        my $clientPrefs = $serverprefs->client($member);
                        if ($clientPrefs) {
                            $haveMember = 1;
                            foreach my $mode (@{$modeList}) {
                                if ($clientPrefs->get("disabled_" . $mode->{id})==0) {
                                    $modes{ $mode->{id} } = 0;
                                }
                            }
                        }
                    }
                }

                if ($haveMember == 0) {
                    # Group has no members??? Enable some basic modes...
                    foreach my $mode (@DEFAULT_BROWSE_MODES) {
                        $modes{ $mode } = 0;
                    }
                }
                # update group prefs
                my @keys = keys %modes;
                for my $key (@keys) {
                    $groupPrefs->set("disabled_" . $key, $modes{$key});
                }

                $request->setStatusDone();
                return;
            }
        }
    }

    $request->setStatusBadParams()
}

sub _svgHandler {
    my ( $httpClient, $response ) = @_;
    return unless $httpClient->connected;

    my $request = $response->request;
    my $dir = dirname(__FILE__);
    my $filePath = $dir . "/HTML/material/html/images/" . basename($request->uri->path) . ".svg";
    my $colour = "#f00";

    if ($request->uri->can('query_param')) {
        $colour = "#" . $request->uri->query_param('c');
    } else { # Manually extract "c=colour" query parameter...
        my $uri = $request->uri->as_string;
        my $start = index($uri, "c=");

        if ($start > 0) {
            $start += 2;
            my $end = index($uri, "&", $start);
            if ($end > $start) {
                $colour = "#" . substr($uri, $start, $end-$start);
            } else {
                $colour = "#" . substr($uri, $start);
            }
        }
    }

    if (! -e $filePath) {
        $filePath = Slim::Utils::Prefs::dir() . "/material-skin/images/" . basename($request->uri->path) . ".svg";
    }

    # Check for plugin icon...
    if (! -e $filePath) {
        my $skin = $serverprefs->get('skin');
        my $path = substr $request->uri->path, 14; # remove /material/svg/
        main::DEBUGLOG && $log->debug("Looking for: " . $path);
        $filePath = $skinMgr->fixHttpPath($skin, $path);
    }

    if (-e $filePath) {
        my $svg = read_file($filePath);
        $svg =~ s/#000/$colour/g;
        $response->code(RC_OK);
        $response->content_type('image/svg+xml');
        $response->header('Connection' => 'close');
        $response->content($svg);
    } else {
        $response->code(RC_NOT_FOUND);
    }
    $httpClient->send_response($response);
    Slim::Web::HTTP::closeHTTPSocket($httpClient);
}

sub _customCssHandler {
    my ( $httpClient, $response ) = @_;
    return unless $httpClient->connected;

    my $request = $response->request;
    my $fileName = basename($request->uri->path);
    my $filePath = '';

    if ('msk--' eq substr($fileName, 0, 5)) {
        my $dir = dirname(__FILE__);
        $fileName = substr($fileName, 5);
        $filePath = $dir . "/HTML/material/html/css/other/" . $fileName . ".min.css";
        if (! -e $filePath) {
            $filePath = $dir . "/HTML/material/html/css/other/" . $fileName . ".css";
        }
    } else {
        $filePath = Slim::Utils::Prefs::dir() . "/material-skin/css/" . $fileName . ".css";
        if (! -e $filePath) { # Try pre 1.6.0 path
            $filePath = Slim::Utils::Prefs::dir() . "/plugin/material-skin." . $fileName . ".css";
        }
    }

    $response->code(RC_OK);
    if (-e $filePath) {
        Slim::Web::HTTP::sendStreamingFile( $httpClient, $response, 'text/css', $filePath, '', 'noAttachment' );
    } else {
        $response->content_type('text/css');
        $response->header('Connection' => 'close');
        $response->content("");
        $httpClient->send_response($response);
        Slim::Web::HTTP::closeHTTPSocket($httpClient);
    }
}

sub _customJsHandler{
    my ( $httpClient, $response ) = @_;
    return unless $httpClient->connected;

    my $request = $response->request;
    my $fileName = basename($request->uri->path);
    my $filePath = '';

    if ('custom.js' eq $fileName) {
        $filePath = Slim::Utils::Prefs::dir() . "/material-skin/custom.js";
    } elsif ('msk--' eq substr($fileName, 0, 5)) {
        my $dir = dirname(__FILE__);
        $fileName = substr($fileName, 5);
        $filePath = $dir . "/HTML/material/html/js/other/" . $fileName . ".min.js";
        if (! -e $filePath) {
            $filePath = $dir . "/HTML/material/html/js/other/" . $fileName . ".js";
        }
    } else {
        $filePath = Slim::Utils::Prefs::dir() . "/material-skin/js/" . $fileName . ".js";
    }

    $response->code(RC_OK);
    if (-e $filePath) {
        print("LOAD JS: " . $filePath . "\n");
        Slim::Web::HTTP::sendStreamingFile( $httpClient, $response, 'application/javascript', $filePath, '', 'noAttachment' );
    } else {
        $response->content_type('application/javascript');
        $response->header('Connection' => 'close');
        $response->content("");
        $httpClient->send_response($response);
        Slim::Web::HTTP::closeHTTPSocket($httpClient);
    }
}

sub _iconHandler {
    my ( $httpClient, $response ) = @_;
    return unless $httpClient->connected;

    my $request = $response->request;
    my $ua = $request->header('user-agent');
    my $icon = "icon.png";
    if (index($ua, 'iPad') != -1 || index($ua, 'iPhone') != -1 || index($ua, 'MobileSafari') != -1 ||
       # Detect iPadOS??? https://forums.developer.apple.com/thread/119186
       (index($ua, 'Macintosh') != -1 && index($ua, '(KHTML, like Gecko) Version') != -1)) {
        $icon ="icon-ios.png";
    }
    my $filePath = dirname(__FILE__) . "/HTML/material/html/images/" . $icon;
    $response->code(RC_OK);
    Slim::Web::HTTP::sendStreamingFile( $httpClient, $response, "image/png", $filePath, '', 'noAttachment' );
}

sub _customActionsHandler {
    my ( $httpClient, $response ) = @_;
    return unless $httpClient->connected;

    my $request = $response->request;
    my $filePath = Slim::Utils::Prefs::dir() . "/material-skin/actions.json";
    if (! -e $filePath) { # Try pre 1.6.0 path
        $filePath = Slim::Utils::Prefs::dir() . "/plugin/material-skin.actions.json";
    }
    $response->code(RC_OK);
    if (-e $filePath) {
        Slim::Web::HTTP::sendStreamingFile( $httpClient, $response, 'application/json', $filePath, '', 'noAttachment' );
    } else {
        $response->code(RC_OK);
        $response->content_type('application/json');
        $response->header('Connection' => 'close');
        $response->content("{}");
        $httpClient->send_response($response);
        Slim::Web::HTTP::closeHTTPSocket($httpClient);
    }
}

sub _manifestHandler {
    my ( $httpClient, $response ) = @_;
    return unless $httpClient->connected;

    my $request = $response->request;
    my $ua = $request->header('user-agent');
    my $filePath = dirname(__FILE__) . "/HTML/material/html/material.webmanifest";
    my $manifest = read_file($filePath);

    if (defined $request->{_headers}->{'referer'}) {
        # See if we have any query params, if so add to start_url...
        my $referer = $request->{_headers}->{'referer'};
        my $queryPos = index($referer, '?');
        if ($queryPos !=-1) {
            my $query = substr($referer, $queryPos);
            $manifest =~ s/\"start_url\": \"\/material\"/\"start_url\": \"\/material\/$query\"/g;
        }
    }

    # Make manifest colours match platform default theme...
    if (index($ua, 'Android') != -1) {
        $manifest =~ s/\"#424242\"/\"#212121\"/g;
    } elsif (index($ua, 'iPad') != -1 || index($ua, 'iPhone') != -1 || index($ua, 'MobileSafari') != -1) { # || (index($ua, 'Macintosh') != -1 && index($ua, '(KHTML, like Gecko) Version') != -1)) {
        $manifest =~ s/\"#424242\"/\"#ffffff\"/g;
    } elsif (index($ua, 'Linux') != -1) {
        $manifest =~ s/\"#424242\"/\"#353535\"/g;
    } elsif (index($ua, 'Win') != -1) {
        $manifest =~ s/\"#424242\"/\"#272625\"/g;
    } elsif (index($ua, 'Mac') != -1) {
        $manifest =~ s/\"#424242\"/\"#202020\"/g;
    }

    $response->code(RC_OK);
    $response->content_type('application/manifest+json');
    $response->header('Connection' => 'close');
    $response->content($manifest);
    $httpClient->send_response($response);
    Slim::Web::HTTP::closeHTTPSocket($httpClient);
}

sub _userThemeHandler {
    my ( $httpClient, $response ) = @_;
    return unless $httpClient->connected;

    my $request = $response->request;
    my $dark = 1;
    my $pos = index($request->uri->path, "/dark/");
    if ($pos<0) {
        $pos = index($request->uri->path, "/light/");
        my $dark = 0;
    }
    my $theme = substr($request->uri->path, $pos);
    my $filePath = Slim::Utils::Prefs::dir() . "/material-skin/themes" . $theme . ".css";
    $response->code(RC_OK);
    if (! -e $filePath) {
        # Not found, fallback to a default one...
        $filePath = dirname(__FILE__) . "/HTML/material/html/css/themes/" . ($dark == 1 ? "dark" : "light") . ".css";
        if (! -e $filePath) {
            $filePath = dirname(__FILE__) . "/HTML/material/html/css/themes/" . ($dark == 1 ? "dark" : "light") . ".min.css";
        }
    }
    $response->code(RC_OK);
    Slim::Web::HTTP::sendStreamingFile( $httpClient, $response, 'text/css', $filePath, '', 'noAttachment' );
}

sub _userColorHandler {
    my ( $httpClient, $response ) = @_;
    return unless $httpClient->connected;

    my $request = $response->request;
    my $filePath = Slim::Utils::Prefs::dir() . "/material-skin/colors/" . basename($request->uri->path) . ".css";
    $response->code(RC_OK);
    if (! -e $filePath) {
        # Not found, fallback to a default one...
        $filePath = dirname(__FILE__) . "/HTML/material/html/css/colors/blue.css";
        if (! -e $filePath) {
            $filePath = dirname(__FILE__) . "/HTML/material/html/css/colors/blue.min.css";
        }
    }
    $response->code(RC_OK);
    Slim::Web::HTTP::sendStreamingFile( $httpClient, $response, 'text/css', $filePath, '', 'noAttachment' );
}

sub _downloadHandler {
    my ( $httpClient, $response ) = @_;
    return unless $httpClient->connected;

    my $request = $response->request;
    my $obj = Slim::Schema->find('Track', basename($request->uri->path));

    if (blessed($obj) && Slim::Music::Info::isSong($obj) && Slim::Music::Info::isFile($obj->url)) {
        $response->code(RC_OK);
        $response->headers->remove_content_headers;
        Slim::Web::HTTP::sendStreamingFile( $httpClient, $response, 'application/octet-stream', Slim::Utils::Misc::pathFromFileURL($obj->url), $obj, 1 );
    } else {
        $response->code(RC_NOT_FOUND);
        $httpClient->send_response($response);
        Slim::Web::HTTP::closeHTTPSocket($httpClient);
    }
}

1;

# Small stub for Plugins::MaterialSkin::Search to use LMS methods if available
package Plugins::MaterialSkin::Search;

use Slim::Web::Pages::Search;

sub advancedSearch {
    my ($client, $params) = @_;

    $params->{'searchType'} ||= 'Album';
    return Slim::Web::Pages::Search::parseAdvancedSearchParams($client, $params);
}

sub options {
    return Slim::Web::Pages::Search::parseAdvancedSearchParams($_[0], {});
}

1;
