package Plugins::MaterialSkin::Plugin;

use Config;
use Slim::Utils::Favorites;
use Slim::Utils::Log;
use Slim::Utils::Network;
use Slim::Utils::Prefs;
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

my $URL_PARSER_RE = qr{material/svg/([a-z0-9-]+)}i;

my $DEFAULT_COMPOSER_GENRES = 'Classical, Avant-Garde, Baroque, Chamber Music, Chant, Choral, Classical Crossover, Early Music, High Classical, Impressionist, Jazz, Medieval, Minimalism, Modern Composition, Opera, Orchestral, Renaissance, Romantic, Symphony, Wedding Music';
my $DEFAULT_CONDUCTOR_GENRES = 'Classical, Avant-Garde, Baroque, Chamber Music, Chant, Choral, Classical Crossover, Early Music, High Classical, Impressionist, Medieval, Minimalism, Modern Composition, Opera, Orchestral, Renaissance, Romantic, Symphony, Wedding Music';

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
        conductorgenres => $DEFAULT_CONDUCTOR_GENRES
    });

    if (main::WEBUI) {
        require Plugins::MaterialSkin::Settings;
		Plugins::MaterialSkin::Settings->new();

        Slim::Web::Pages->addPageFunction( 'desktop', sub {
            my ($client, $params) = @_;
            $params->{'material_revision'} = $class->pluginVersion();
            return Slim::Web::HTTP::filltemplatefile('desktop.html', $params);
        } );
        Slim::Web::Pages->addPageFunction( 'mini', sub {
            my ($client, $params) = @_;
            $params->{'material_revision'} = $class->pluginVersion();
            return Slim::Web::HTTP::filltemplatefile('mini.html', $params);
        } );
        Slim::Web::Pages->addPageFunction( 'now-playing', sub {
            my ($client, $params) = @_;
            $params->{'material_revision'} = $class->pluginVersion();
            return Slim::Web::HTTP::filltemplatefile('now-playing.html', $params);
        } );
        Slim::Web::Pages->addPageFunction( 'mobile', sub {
            my ($client, $params) = @_;
            $params->{'material_revision'} = $class->pluginVersion();
            return Slim::Web::HTTP::filltemplatefile('mobile.html', $params);
        } );
        Slim::Web::Pages->addRawFunction($URL_PARSER_RE, \&_svgHandler);

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
        $datestring = strftime("%Y-%m-%d-%H-%M-%S", localtime);
        $version = "DEV-${datestring}";
    }

    return $version;
}

sub initCLI {
    #                                                            |requires Client
    #                                                            |  |is a Query
    #                                                            |  |  |has Tags
    #                                                            |  |  |  |Function to call
    #                                                            C  Q  T  F
    Slim::Control::Request::addDispatch(['material-skin', '_cmd'],
                                                                [0, 0, 1, \&_cliCommand]
    );
    Slim::Control::Request::addDispatch(['material-skin-presets', '_cmd'],
                                                                [1, 0, 1, \&_cliPresetCommand]
    );
}

sub _cliCommand {
    my $request = shift;

    # check this is the correct query.
    if ($request->isNotCommand([['material-skin']])) {
        $request->setStatusBadDispatch();
        return;
    }

    my $cmd = $request->getParam('_cmd');

    if ($request->paramUndefinedOrNotOneOf($cmd, ['moveplayer', 'info', 'movequeue', 'favorites']) ) {
        $request->setStatusBadParams();
        return;
    }

    if ($cmd eq 'moveplayer') {
        my $id = $request->getParam('id');
        my $serverurl = $request->getParam('serverurl');
        if (!$id || !$serverurl) {
            $request->setStatusBadParams();
            return;
        }

        # curl 'http://192.168.1.16:9000/jsonrpc.js' --data-binary '{"id":1,"method":"slim.request","params":["aa:aa:b5:38:e2:d7",["connect","192.168.1.66"]]}'
        my $http = Slim::Networking::SimpleAsyncHTTP->new(
            \&_connectDone,
            \&_connectError,
            {
                timeout => 10,
                server  => $server,
            }
        );

        my $postdata = to_json({
            id     => 1,
            method => 'slim.request',
            params => [ $id, ['connect', Slim::Utils::Network::serverAddr()] ]
        });

        main::INFOLOG && $log->is_info && $log->info('Connect player ${id} from ${serverurl} to this server');
        $http->post( $serverurl . 'jsonrpc.js', $postdata);
        $request->setStatusDone();
        return;
    }

    if ($cmd eq 'info') {
        my $osDetails = Slim::Utils::OSDetect::details();
        my $prefs = preferences('server');
        $request->addResult('info', '{"server":'
                                .'[ {"label":"' . cstring('', 'INFORMATION_VERSION') . '", "text":"' . $::VERSION . ' - ' . $::REVISION . ' @ ' . $::BUILDDATE . '"},'
                                .  '{"label":"' . cstring('', 'INFORMATION_HOSTNAME') . '", "text":"' . Slim::Utils::Network::hostName() . '"},'
                                .  '{"label":"' . cstring('', 'INFORMATION_SERVER_IP') . '", "text":"' . Slim::Utils::Network::serverAddr() . '"},'
                                .  '{"label":"' . cstring('', 'INFORMATION_OPERATINGSYSTEM') . '", "text":"' . $osDetails->{'osName'} . ' - ' . $prefs->get('language') . ' - ' . Slim::Utils::Unicode::currentLocale() . '"},'
                                .  '{"label":"' . cstring('', 'INFORMATION_ARCHITECTURE') . '", "text":"' . ($osDetails->{'osArch'} ? $osDetails->{'osArch'} : '?') . '"},'
                                .  '{"label":"' . cstring('', 'PERL_VERSION') . '", "text":"' . $Config{'version'} . ' - ' . $Config{'archname'} . '"},'
                                .  '{"label":"Audio::Scan", "text":"' . $Audio::Scan::VERSION . '"},'
                                .  '{"label":"IO::Socket::SSL", "text":"' . (Slim::Networking::Async::HTTP->hasSSL() ? $IO::Socket::SSL::VERSION : cstring($client, 'BLANK')) . '"}'

                                . ( Slim::Schema::hasLibrary() ? ', {"label":"' . cstring('', 'DATABASE_VERSION') . '", "text":"' . Slim::Utils::OSDetect->getOS->sqlHelperClass->sqlVersionLong( Slim::Schema->dbh ) . '"}' : '')

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

        $to->execute(['power', 1]) unless $to->power;
        $from->execute(['sync', $toId]);
        if ( exists $INC{'Slim/Plugin/RandomPlay/Plugin.pm'} && (my $mix = Slim::Plugin::RandomPlay::Plugin::active($from)) ) {
            $to->execute(['playlist', 'addtracks', 'listRef', ['randomplay://' . $mix] ]);
        }
        $from->execute(['sync', '-']);
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

    $request->setStatusBadParams()
}

sub _cliPresetCommand {
    my $request = shift;

    # check this is the correct query.
    if ($request->isNotCommand([['material-skin-presets']])) {
        $request->setStatusBadDispatch();
        return;
    }

    my $cmd = $request->getParam('_cmd');
    my $client = $request->client();
    if ($request->paramUndefinedOrNotOneOf($cmd, ['list', 'set', 'clear']) ) {
        $request->setStatusBadParams();
        return;
    }

    if ($cmd eq 'list') {
        my $presets = $serverprefs->client($client)->get('presets');
        my $cnt = 0;
        my $id = 1;
        foreach my $preset (@{$presets}) {
            if ($preset->{URL} && $preset->{type} eq 'audio') {
               $request->addResultLoop("presets_loop", $cnt, "url", $preset->{URL});
               $request->addResultLoop("presets_loop", $cnt, "text", $preset->{text});
               $request->addResultLoop("presets_loop", $cnt, "id", $client->id . '-' . $id);
               $request->addResultLoop("presets_loop", $cnt, "num", $id);
               $cnt++;
            }
            $id++;
        }
        $request->setStatusDone();
        return;
    }

    if ($cmd eq 'set') {
        my $presets = $serverprefs->client($client)->get('presets');
        my $num = $request->getParam('num');
        my $prev = $request->getParam('prev');
        my $text = $request->getParam('text');
        my $url = $request->getParam('url');
        if (!$num || !$url) {
            $request->setStatusBadParams();
            return;
        }
        my $val = int($num);
        if ($val<1 || $val>10) {
            $request->setStatusBadParams();
            return;
        }
        if ($prev) {
            # If this is a move, then copy contents at destination to source
            my $prevval = int($prev);
            if ($prevval>=1 && $prevval<=10) {
                $presets->[$prevval-1] = $presets->[$val-1];
            }
        }
        $presets->[$val-1] = { URL => $url, text => $text || '', type => 'audio'};
        $serverprefs->client($client)->set('presets', $presets);
        $request->setStatusDone();
        return;
    }

    if ($cmd eq 'clear') {
        my $presets = $serverprefs->client($client)->get('presets');
        my $num = $request->getParam('num');
        if (!$num) {
            $request->setStatusBadParams();
            return;
        }
        my $val = int($num);
        if ($val<1 || $val>10) {
            $request->setStatusBadParams();
            return;
        }
        $presets->[$val-1] = { };
        $serverprefs->client($client)->set('presets', $presets);
        $request->setStatusDone();
        return;
    }

    $request->setStatusBadParams()
}

sub _connectDone {
    main::INFOLOG && $log->is_info && $log->info('Connect response recieved player');
    # curl 'http://localhost:9000/jsonrpc.js' --data-binary '{"id":1,"method":"slim.request","params":["aa:aa:b5:38:e2:d7",["disconnect","192.168.1.16"]]}'
    my $http   = shift;
    my $server = $http->params('server');
    my $res = eval { from_json( $http->content ) };

    if ( $@ || ref $res ne 'HASH' || $res->{error} ) {
        $http->error( $@ || 'Invalid JSON response: ' . $http->content );
        return _players_error( $http );
    }

    my @params = @{$res->{params}};
    my $id = $params[0];
    my $buddy = Slim::Player::Client::getClient($id);
    if ($buddy) {
        main::INFOLOG && $log->is_info && $log->info('Disconnect player ' . $id . ' from ' . $server);
        $buddy->execute(["disconnect", $server]);
    }
}

sub _connectError {
    # Ignore?
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

1;
