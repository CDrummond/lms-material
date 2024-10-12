#!/usr/bin/env python3

#
# Hacky script to trim modules out of Vuetify
#
# Copyright (c) 2024 Craig Drummond <craig.p.drummond@gmail.com>
# MIT license.
#

import os
import subprocess

CSS_SRC = 'vuetify.min.css'
CSS_DEST = 'vuetify-trimmed.min.css'
CSS_TMP = 'temp.css'

REMOVE_CSS=[
".blue",
".light-blue",
".red",
".pink",
".purple",
".deep-purple",
".indigo",
".cyan",
".teal",
".green",
".light-green",
".lime",
".yellow",
".amber",
".orange",
".deep-orange",
".brown",
".grey",
".bottom-sheet",
".carousel",
".scroll-y",
".slide-y",
".scrol-x",
".slide-x",
".v-alert",
".v-autocomplete",
".v-btn--floating",
".v-btn-toggle",
".v-messages",
".v-badge",
".v-breadcrumbs",
".v-calendar",
".v-carousel",
".v-counter",
".v-data",
".v-overflow-btn",
".v-table",
"table.v-table",
".v-datatable",
".v-date-picker",
".v-expansion-panel",
".v-messages",
".v-pagination",
".v-parallax",
".v-progress-circular",
".v-progress-linear",
".v-input--radio-group",
".v-radio",
".v-responsive",
".v-speed-dial",
".v-stepper",
".v-system-bar",
".v-textarea",
".v-timeline",
".v-treeview",
".v-window",
".theme--dark.v-list",
".theme--light.v-list"
]

#.theme--light+XXX

def unminifyCss(src, dest):
    os.system('cat %s | sed s^}^"}\\n"^g > %s'  % (src, dest))


def matchLine(line):
    for rm in REMOVE_CSS:
        if line.startswith(rm) or line.startswith(".theme--light%s" % rm)  or line.startswith(".theme--dark%s" % rm):
            return True
    return False


def trimCss(srcPath, destPath):
    dest=[]
    with open(srcPath, "r") as f:
        for line in f.readlines():
            if not matchLine(line):
                dest.append(line)
    with open(destPath, "w") as f:
        for line in dest:
            f.write(line)


def minifyCss(src, dest):
    cssStr=""
    with open(src, "r") as f:
        for line in f.readlines():
            cssStr+=line.replace("}\n", "}")
    with open(dest, "w") as f:
        f.write(cssStr)


unminifyCss(CSS_SRC, CSS_TMP)
trimCss(CSS_TMP, CSS_TMP)
minifyCss(CSS_TMP, CSS_DEST)
os.remove(CSS_TMP)
