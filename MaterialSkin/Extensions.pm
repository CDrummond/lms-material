package Plugins::MaterialSkin::Extensions;

#
# LMS-Material
#
# Copyright (c) 2018-2022 Craig Drummond <craig.p.drummond@gmail.com>
#
# MIT license.
#

my @otherJavascriptFiles = undef;
my @otherDialogs = undef;

sub addJavascript {
    my $path = shift;
    if (@otherJavascriptFiles == undef) {
        @otherJavascriptFiles = ();
    }
    push(@otherJavascriptFiles, $path);
}

sub getJavascripts {
    return \@otherJavascriptFiles;
}

sub addDialog {
    my $dlg = shift;
    if (@otherDialogs == undef) {
        @otherDialogs = ();
    }
    push(@otherDialogs, $dlg);
}

sub getDialogs {
    return \@otherDialogs;
}
