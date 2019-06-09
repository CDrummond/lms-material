package Plugins::MaterialSkin::Plugin;

use Slim::Utils::Log;
use Slim::Utils::Network;
use JSON::XS::VersionOneAndTwo;

my $log = Slim::Utils::Log->addLogCategory({
    'category' => 'plugin.material-skin',
    'defaultLevel' => 'ERROR',
    'description' => 'PLUGIN_MATERIAL_SKIN'
});

sub initPlugin {
    my $class = shift;

    if (main::WEBUI) {
        Slim::Web::Pages->addPageFunction( 'desktop', sub {
            my ($client, $params) = @_;
            $params->{'material_revision'} = $class->pluginVersion();
            return Slim::Web::HTTP::filltemplatefile('desktop.html', $params);
        } );
        Slim::Web::Pages->addPageFunction( 'mobile', sub {
            my ($client, $params) = @_;
            $params->{'material_revision'} = $class->pluginVersion();
            return Slim::Web::HTTP::filltemplatefile('mobile.html', $params);
        } );
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
}

sub _cliCommand {
    my $request = shift;

    # check this is the correct query.
    if ($request->isNotCommand([['material-skin']])) {
        $request->setStatusBadDispatch();
        return;
    }

    my $cmd = $request->getParam('_cmd');

    # command needs to be one of 4 different things
    if ($request->paramUndefinedOrNotOneOf($cmd, ['moveplayer']) ) {
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
            \&_connect_done,
            \&_connect_error,
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

        main::INFOLOG && $log->is_info && $log->info(string('Connect player ${id} from ${serverurl} to this server'));
        $http->post( $serverurl . 'jsonrpc.js', $postdata);
        $request->setStatusDone();
    }
}

sub _connect_done {
    main::DEBUGLOG && $log->is_info && $log->info(string('Connect response recieved player'));
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
        main::INFOLOG && $log->is_info && $log->info(string('Disconnect player ${id} from ${server}'));
        $buddy->execute(["disconnect", $server]);
    }
}

sub _connect_error {
    # Ignore?
}

1;
