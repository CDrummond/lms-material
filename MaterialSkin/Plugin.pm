package Plugins::MaterialSkin::Plugin;

use File::Basename;
use File::Spec::Functions qw(catfile catdir);

# this plugin registers the helper files (fonts, manifest) as raw downloads
# this will allow Logitech Media Server to serve those files without a patch
sub initPlugin {
    my $baseDir = dirname($INC{'Plugins/MaterialSkin/Plugin.pm'});
    my @dirs = ('HTML/material/', 'HTML/material/font', 'HTML/material/lang');

    foreach $d (@dirs) {
        my $path = catdir($baseDir, $d);
        if opendir(dir, $path) {
            my @entries = readdir(dir);
            close(dir);

            for my $file (@entries) {
                # extend the list of file extensions if needed
                if ($file =~ /\.(?:eot|svg|woff2?|ttf|json)$/) {
                    $file = catfile($path, $file);
                    Slim::Web::Pages->addRawDownload(basename($file), $file, Slim::Music::Info::typeFromSuffix($file));
                }
            }
        }
    }
}

1;
