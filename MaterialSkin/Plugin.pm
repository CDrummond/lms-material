package Plugins::MaterialSkin::Plugin;

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
}

sub pluginVersion {
    my ($class) = @_;
    my $version = Slim::Utils::PluginManager->dataForPlugin($class)->{version};
    if ($version eq 'DEVELOPMENT') {
        use POSIX qw(strftime);
        $datestring = strftime("%Y-%m-%d-%H-%M-%S", gmtime);
        $version = "${version}-${datestring}";
    }
    return $version;
}

1;
