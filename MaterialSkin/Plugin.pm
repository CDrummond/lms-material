package Plugins::MaterialSkin::Plugin;

use File::Basename;
use File::Spec::Functions qw(catfile catdir);

use constant FONT_DIR => 'HTML/material/font';

# this plugin registers the helper files (fonts, manifest) as raw downloads
# this will allow Logitech Media Server to serve those files without a patch
sub initPlugin {
	my $baseDir = dirname($INC{'Plugins/MaterialSkin/Plugin.pm'});
	my $fontDir = catdir($baseDir, FONT_DIR);

	opendir(DIR, $fontDir) || do {
		Slim::Utils::Log::logError('MaterialSkin: failed to read base folder with fonts');
		return;
	};

	my @entries = readdir(DIR);

	close(DIR);

	for my $file (@entries) {
		# extend the list of file extensions if needed
		if ($file =~ /\.(?:eot|svg|woff2?|ttf|json)$/) {
			$file = catfile($fontDir, $file);
			Slim::Web::Pages->addRawDownload(basename($file), $file, Slim::Music::Info::typeFromSuffix($file));
		}
	}
}

1;
