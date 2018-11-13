package Plugins::MaterialSkin::Plugin;

sub initPlugin {
    if (main::WEBUI) {
        Slim::Web::Pages->addPageFunction( 'desktop', sub {
            return Slim::Web::HTTP::filltemplatefile('desktop.html', $_[1]);
        } );
    }
}

1;
