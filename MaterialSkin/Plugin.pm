package Plugins::MaterialSkin::Plugin;

sub initPlugin {
    my $class = shift;

    if (main::WEBUI) {
        Slim::Web::Pages->addPageFunction( 'desktop', sub {
            my ($client, $params) = @_;
            $params->{'material_revision'} = $class->pluginVersion();
            return Slim::Web::HTTP::filltemplatefile('desktop.html', $params);
        } );
    }
}

sub pluginVersion {
    my ($class) = @_;
    return Slim::Utils::PluginManager->dataForPlugin($class)->{version};
}

1;
