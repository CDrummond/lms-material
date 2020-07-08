package Plugins::MaterialSkin::Plugin;

#
# LMS-Material
#
# Copyright (c) 2018-2019 Craig Drummond <craig.p.drummond@gmail.com>
#
# MIT license.
#

use strict;

use Config;
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

my $log = Slim::Utils::Log->addLogCategory({
    'category' => 'plugin.material-skin',
    'defaultLevel' => 'ERROR',
    'description' => 'PLUGIN_MATERIAL_SKIN'
});

my $prefs = preferences('plugin.material-skin');
my $serverprefs = preferences('server');

my $SVG_URL_PARSER_RE = qr{material/svg/([a-z0-9-]+)}i;
my $CSS_URL_PARSER_RE = qr{material/customcss/([a-z0-9-]+)}i;
my $ICON_URL_PARSER_RE = qr{material/icon\.png}i;
my $ACTIONS_URL_PARSER_RE = qr{material/customactions\.json}i;
my $MAIFEST_URL_PARSER_RE = qr{material/material\.webmanifest}i;
my $USER_THEME_URL_PARSER_RE = qr{material/usertheme/.+}i;
my $USER_COLOR_URL_PARSER_RE = qr{material/usercolor/.+}i;

my $DEFAULT_COMPOSER_GENRES = string('PLUGIN_MATERIAL_SKIN_DEFAULT_COMPOSER_GENRES');
my $DEFAULT_CONDUCTOR_GENRES = string('PLUGIN_MATERIAL_SKIN_DEFAULT_CONDUCTOR_GENRES');

my @DEFAULT_BROWSE_MODES = ( 'myMusicArtists', 'myMusicArtistsAlbumArtists', 'myMusicArtistsAllArtists', 'myMusicAlbums',
                             'myMusicGenres', 'myMusicYears', 'myMusicNewMusic','myMusicPlaylists', 'myMusicAlbumsVariousArtists' );

sub initPlugin {
    my $class = shift;

    if (my $composergenres = $prefs->get('composergenres')) {
        $prefs->set('composergenres', $DEFAULT_COMPOSER_GENRES) if $composergenres eq '';
    }

    if (my $conductorgenres = $prefs->get('conductorgenres')) {
        $prefs->set('conductorgenres', $DEFAULT_CONDUCTOR_GENRES) if $conductorgenres eq '';
    }

    $prefs->init({
        composergenres => $DEFAULT_COMPOSER_GENRES,
        conductorgenres => $DEFAULT_CONDUCTOR_GENRES,
        password => ''
    });

    if (main::WEBUI) {
        require Plugins::MaterialSkin::Settings;
		Plugins::MaterialSkin::Settings->new();

        Slim::Web::Pages->addPageFunction( 'desktop', sub {
            my ($client, $params) = @_;
            return Slim::Web::HTTP::filltemplatefile('desktop.html', $params);
        } );
        Slim::Web::Pages->addPageFunction( 'mini', sub {
            my ($client, $params) = @_;
            return Slim::Web::HTTP::filltemplatefile('mini.html', $params);
        } );
        Slim::Web::Pages->addPageFunction( 'now-playing', sub {
            my ($client, $params) = @_;
            return Slim::Web::HTTP::filltemplatefile('now-playing.html', $params);
        } );
        Slim::Web::Pages->addPageFunction( 'mobile', sub {
            my ($client, $params) = @_;
            return Slim::Web::HTTP::filltemplatefile('mobile.html', $params);
        } );

        Slim::Web::Pages->addRawFunction($SVG_URL_PARSER_RE, \&_svgHandler);
        Slim::Web::Pages->addRawFunction($CSS_URL_PARSER_RE, \&_customCssHandler);
        Slim::Web::Pages->addRawFunction($ICON_URL_PARSER_RE, \&_iconHandler);
        Slim::Web::Pages->addRawFunction($ACTIONS_URL_PARSER_RE, \&_customActionsHandler);
        Slim::Web::Pages->addRawFunction($MAIFEST_URL_PARSER_RE, \&_manifestHandler);
        Slim::Web::Pages->addRawFunction($USER_THEME_URL_PARSER_RE, \&_userThemeHandler);
        Slim::Web::Pages->addRawFunction($USER_COLOR_URL_PARSER_RE, \&_userColorHandler);
        # make sure scanner does pre-cache artwork in the size the skin is using in browse modesl
        Slim::Control::Request::executeRequest(undef, [ 'artworkspec', 'add', '300x300_f', 'Material Skin' ]);
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

sub _cliCommand {
    my $request = shift;

    # check this is the correct query.
    if ($request->isNotCommand([['material-skin']])) {
        $request->setStatusBadDispatch();
        return;
    }

    my $cmd = $request->getParam('_cmd');

    if ($request->paramUndefinedOrNotOneOf($cmd, ['info', 'movequeue', 'favorites', 'map', 'add-podcast', 'edit-podcast', 'delete-podcast', 'plugins',
                                                  'plugins-status', 'plugins-update', 'delete-vlib', 'pass-isset', 'pass-check', 'browsemodes',
                                                  'actions', 'geturl', 'command', 'scantypes', 'server', 'themes', 'playericons', 'activeplayers']) ) {
        $request->setStatusBadParams();
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

    if ($cmd eq 'movequeue') {
        my $fromId = $request->getParam('from');
        my $toId = $request->getParam('to');
        if (!$fromId || !$toId) {
            $request->setStatusBadParams();
            return;
        }
        my $from = Slim::Player::Client::getClient($fromId);
        my $to = Slim::Player::Client::getClient($toId);
        if (!$from || !$to) {
            $request->setStatusBadParams();
            return;
        }

        # Get list of playes source is currently synced with
        my @buddies;
        if ($from->isSynced()) {
            @buddies = $from->syncedWith();
            # Check that we are not already synced with dest player...
            for my $buddy (@buddies) {
                if ($buddy->id() eq $toId) {
                    main::INFOLOG && $log->is_info && $log->info("Tried to move client $fromId to a player its already synced with ($toId)");
                    $request->setStatusBadParams();
                    return;
                }
            }
        }

        $to->execute(['power', 1]) unless $to->power;
        $from->execute(['sync', $toId]);
        if ( exists $INC{'Slim/Plugin/RandomPlay/Plugin.pm'} && (my $mix = Slim::Plugin::RandomPlay::Plugin::active($from)) ) {
            $to->execute(['playlist', 'addtracks', 'listRef', ['randomplay://' . $mix] ]);
        }
        $from->execute(['sync', '-']);
        # Restore any previous synced players
        for my $buddy (@buddies) {
            $from->execute(['sync', $buddy->id()]);
        }
        $from->execute(['playlist', 'clear']);
        $from->execute(['power', 0]);

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

    if ($cmd eq 'map') {
        my $genre = $request->getParam('genre');
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
        my $name = $request->getParam('name');
        if (defined $pos && $name) {
            my $podPrefs = preferences('plugin.podcast');
            my $feeds = $podPrefs->get('feeds');
            if ($pos < scalar @{$feeds}) {
                @{$feeds}[$pos]->{'name'}=$name;
                $podPrefs->set(feeds => $feeds);
                $request->setStatusDone();
                return;
            }
        }
    }

    if ($cmd eq 'delete-podcast') {
        my $pos = $request->getParam('pos');
        if (defined $pos) {
            my $podPrefs = preferences('plugin.podcast');
            my $feeds = $podPrefs->get('feeds');
            if ($pos < scalar @{$feeds}) {
                splice @{$feeds}, $pos, 1;
                $podPrefs->set(feeds => $feeds);
                $request->setStatusDone();
                return;
            }
        }
    }

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

    if ($cmd eq 'actions') {
        my $artist_id = $request->getParam('artist_id');
        my $artist = $request->getParam('artist');
        my $album_id = $request->getParam('album_id');
        my $album = $request->getParam('album');

        my $cnt = 0;

        if (!$artist || !($artist eq string('VARIOUSARTISTS'))) {
            if (Slim::Utils::PluginManager->isEnabled('Plugins::MusicArtistInfo::Plugin')) {
                if ($artist_id || $artist) {
                    $request->addResultLoop("actions_loop", $cnt, "title", string('PLUGIN_MUSICARTISTINFO_BIOGRAPHY'));
                    $request->addResultLoop("actions_loop", $cnt, "icon", "menu_book");
                    if ($artist_id) {
                        $request->addResultLoop("actions_loop", $cnt, "do", { command => ["musicartistinfo", "biography", "html:1", "artist_id:" . $artist_id], params => [] });
                    } else {
                        $request->addResultLoop("actions_loop", $cnt, "do", { command => ["musicartistinfo", "biography", "html:1", "artist:" . $artist], params => [] });
                    }
                    $request->addResultLoop("actions_loop", $cnt, "weight", 0);
                    $cnt++;
                    $request->addResultLoop("actions_loop", $cnt, "title", string('PLUGIN_MUSICARTISTINFO_ARTISTPICTURES'));
                    $request->addResultLoop("actions_loop", $cnt, "icon", "insert_photo");
                    if ($artist_id) {
                        $request->addResultLoop("actions_loop", $cnt, "do", { command => ["musicartistinfo", "artistphotos", "artist_id:" . $artist_id], params => [] });
                    } else {
                        $request->addResultLoop("actions_loop", $cnt, "do", { command => ["musicartistinfo", "artistphotos", "artist:" . $artist], params => [] });
                    }
                    $request->addResultLoop("actions_loop", $cnt, "weight", 1);
                    $cnt++;
                }
                if ($album_id || ($album && ($artist_id || $artist))) {
                    $request->addResultLoop("actions_loop", $cnt, "title", string('PLUGIN_MUSICARTISTINFO_ALBUMREVIEW'));
                    $request->addResultLoop("actions_loop", $cnt, "icon", "local_library");

                    if ($album_id) {
                        $request->addResultLoop("actions_loop", $cnt, "do", { command => ["musicartistinfo", "albumreview", "album_id:" . $album_id], params => [] });
                    } else {
                        if ($artist_id) {
                            $request->addResultLoop("actions_loop", $cnt, "do", { command => ["musicartistinfo", "albumreview", "album:" . $album, "artist_id:" . $artist_id],
                                                                                  params => [] });
                        } else {
                            $request->addResultLoop("actions_loop", $cnt, "do", { command => ["musicartistinfo", "albumreview", "album:" . $album, "artist:" . $artist],
                                                                                  params => [] });
                        }
                    }
                    $request->addResultLoop("actions_loop", $cnt, "weight", 0);
                    $cnt++;
                }
            }
            if (Slim::Utils::PluginManager->isEnabled('Plugins::YouTube::Plugin')) {
                if ($artist) {
                    $request->addResultLoop("actions_loop", $cnt, "title", "YouTube");
                    $request->addResultLoop("actions_loop", $cnt, "svg", "youtube");
                    $request->addResultLoop("actions_loop", $cnt, "do", { command => ["youtube","items"], params=> ["want_url:1", "item_id:3", "search:" . $artist, "menu:youtube"] });
                    $request->addResultLoop("actions_loop", $cnt, "weight", 10);
                    $cnt++;
                }
            }

            if ($artist_id && !$album_id) {
                my $role_id = $request->getParam('role_id');
                my $genre_id = $request->getParam('genre_id');
                $request->addResultLoop("actions_loop", $cnt, "title", string('ALL_SONGS'));
                $request->addResultLoop("actions_loop", $cnt, "icon", "music_note");

                if ($role_id && $genre_id) {
                    $request->addResultLoop("actions_loop", $cnt, "do", { command => ["tracks"], params=> ["sort:albumtrack", "tags:cdrilstyE", "artist_id:" . $artist_id, "rold_id:" . $role_id, "genre_id:" . $genre_id] });
                } elsif ($role_id) {
                    $request->addResultLoop("actions_loop", $cnt, "do", { command => ["tracks"], params=> ["sort:albumtrack", "tags:cdrilstyE", "artist_id:" . $artist_id, "rold_id:" . $role_id] });
                } elsif ($genre_id) {
                    $request->addResultLoop("actions_loop", $cnt, "do", { command => ["tracks"], params=> ["sort:albumtrack", "tags:cdrilstyE", "artist_id:" . $artist_id, "genre_id:" . $genre_id] });
                } else {
                    $request->addResultLoop("actions_loop", $cnt, "do", { command => ["tracks"], params=> ["sort:albumtrack", "tags:cdrilstyE", "artist_id:" . $artist_id] });
                }
                $request->addResultLoop("actions_loop", $cnt, "weight", 3);
                $cnt++;
            }
        }
        $request->setStatusDone();
        return;
    }

    if ($cmd eq 'geturl') {
        my $url = $request->getParam('url');
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
                    $request->addResult("content", $response->content);
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

    $request->setStatusBadParams()
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
    my $filePath = Slim::Utils::Prefs::dir() . "/material-skin/css/" . basename($request->uri->path) . ".css";
    if (! -e $filePath) { # Try pre 1.6.0 path
        $filePath = Slim::Utils::Prefs::dir() . "/plugin/material-skin." . basename($request->uri->path) . ".css";
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

1;
