#!/usr/bin/env python

#
# LMS-Material
#
# Copyright (c) 2018 Craig Drummond <craig.p.drummond@gmail.com>
# MIT license.
#

import hashlib
import os
import re
import requests
import shutil
import subprocess
import sys


INSTALL_XML = "MaterialSkin/install.xml"
PUBLIC_XML = "public.xml"
BUILD_FOLDER = "build"
HTML_FOLDER = BUILD_FOLDER + "/MaterialSkin/HTML/material/html"
MINIFY_JS = True
MINIFY_CSS = False # Minifying CSS seems to break layout?
JS_COMPILER = "tools/closure-compiler/closure-compiler-v20181008.jar"
CSS_COMPRESSOR = "tools/yuicompressor/yuicompressor-2.4.8.jar"
COMMON_JS_FILES = [  # Order is important!
    "constants.js",
    "currentcover.js",
    "utils.js",
    "noplayers.js",
    "noconnection.js",
    "toolbar.js",
    "bottomnav.js",
    "browse-resp.js",
    "browse-page.js",
    "nowplaying-page.js",
    "queue-page.js",
    "sync-dialog.js",
    "groupplayers-dialog.js",
    "server.js",
    "ui-settings.js",
    "player-settings.js",
    "volume.js",
    "information.js",
    "randommix-dialog.js",
    "rating-dialog.js",
    "manage-players.js",
    "favorite-dialog.js",
    "i18n.js",
    "store.js",
    "init.js"
]

NON_MINIFIED_CSS = ["dark.css", "light.css"]

def info(s):
    print("INFO: %s" %s)


def error(s):
    print("ERROR: %s" % s)
    exit(-1)


def usage():
    print("Usage: %s <major>.<minor>.<patch>" % sys.argv[0])
    exit(-1)


def checkVersion(version):
    try:
        parts=version.split('.')
        major=int(parts[0])
        minor=int(parts[1])
        patch=int(parts[2])
    except:
        error("Invalid version number")


def releaseUrl(version):
    return "https://github.com/CDrummond/lms-material/releases/download/%s/lms-material-%s.zip" % (version, version)


def checkVersionExists(version):
    url = releaseUrl(version)
    info("Checking %s" % url)
    request = requests.head(url)
    if request.status_code == 200:
        error("Version already exists")


def updateLine(line, startStr, endStr, updateStr):
    start=line.find(startStr)
    if start!=-1:
        start+=len(startStr)
        end=line.find(endStr, start)
        if end!=-1:
            return "%s%s%s" % (line[:start], updateStr, line[end:])
    return None


def updateInstallXml(version):
    lines=[]
    updated=False
    info("Updating %s" % INSTALL_XML)
    with open(INSTALL_XML, "r") as f:
        lines=f.readlines()
    for i in xrange(len(lines)):
        updated = updateLine(lines[i], "<version>", "</version>", version)
        if updated:
            lines[i]=updated
            updated=True
            break
    if not updated:
        error("Failed to update version in %s" % INSTALL_XML)
    with open(INSTALL_XML, "w") as f:
        for line in lines:
            f.write(line)


def prepare():
    info("Preparing code")
    if os.path.exists(BUILD_FOLDER):
        shutil.rmtree(BUILD_FOLDER)
    os.mkdir(BUILD_FOLDER)
    try:
        shutil.copytree("MaterialSkin", "%s/MaterialSkin" % BUILD_FOLDER)
    except Exception as e:
        error("Failed to copy files to %s folder - %s" % (BUILD_FOLDER, str(e)))

    # Remove unminfied versions of JS files, if we have the minified version
    for js in os.listdir("%s/lib" % HTML_FOLDER):
        if js.endswith(".min.js"):
            orig = js.replace(".min.js", ".js")
            if os.path.exists("%s/lib/%s" % (HTML_FOLDER, orig)):
                os.remove("%s/lib/%s" % (HTML_FOLDER, orig))
            orig = js.replace(".min.js", ".orig.js")
            if os.path.exists("%s/lib/%s" % (HTML_FOLDER, orig)):
                os.remove("%s/lib/%s" % (HTML_FOLDER, orig))


def cleanup():
    info("Removing build folder")
    if os.path.exists(BUILD_FOLDER):
        shutil.rmtree(BUILD_FOLDER)


def minifyJs():
    info("...JS")

    jsCommand = ["java", "-jar", JS_COMPILER, "--js_output_file=%s/js/common.min.js" % HTML_FOLDER]
    for entry in COMMON_JS_FILES:
        jsCommand.append("%s/js/%s" % (HTML_FOLDER, entry))

    subprocess.call(jsCommand, shell=False)
    for other in ["utils", "main", "main-desktop"]:
        jsCommand = ["java", "-jar", JS_COMPILER, "--js_output_file=%s/js/%s.min.js" % (HTML_FOLDER, other), "%s/js/%s.js" % (HTML_FOLDER, other)]
        subprocess.call(jsCommand, shell=False)


def minifyCss():
    info("...CSS")
    for css in os.listdir("%s/css" % HTML_FOLDER):
        if not css in NON_MINIFIED_CSS and css.endswith(".css"):
            origCss = "%s/css/%s" % ( HTML_FOLDER, css)
            minCss = origCss.replace(".css", ".min.css")
            subprocess.call(["java", "-jar", CSS_COMPRESSOR, "-o", minCss, origCss], shell=False)


def removeUnminified():
    info("...removing non-minified files")
    if MINIFY_JS:
        for entry in os.listdir("%s/js" % HTML_FOLDER):
            if entry.endswith(".js") and not entry.endswith(".min.js"):
                os.remove("%s/js/%s" % (HTML_FOLDER, entry))
    if MINIFY_CSS:
        for entry in os.listdir("%s/css" % HTML_FOLDER):
            if not entry in NON_MINIFIED_CSS and entry.endswith(".css") and not entry.endswith(".min.css"):
                os.remove("%s/css/%s" % (HTML_FOLDER, entry))


def fixHtml():
    info("...updating HTML files")
    for html in ["index", "desktop", "mobile"]:
        fixedLines = []
        replacedJs = False
        replacedCss = False
        path = "%s/MaterialSkin/HTML/material/%s.html" % (BUILD_FOLDER, html)
        with open(path, "r") as f:
            lines=f.readlines()
        for line in lines:
            matchedJs = False
            matchedCss = False
            matches = re.findall('src\\s*\\=\\"html/js/[^\\"]+\\.js', line)
            if matches:
                for match in matches:
                    matchedJs = True
            else:
                for css in ["style", html]:
                    matches = re.findall('"html/css/%s.css' % css, line)
                    if matches:
                        for match in matches:
                            matchedCss = True

            if MINIFY_JS and matchedJs:
                if not replacedJs:
                    if "index"==html:
                        fixedLines.append('  <script src="html/js/utils.min.js?r=[% material_revision %]"></script>\n')
                    else:
                        fixedLines.append('  <script src="html/js/common.min.js?r=[% material_revision %]"></script>\n')
                        if "desktop" == html:
                            fixedLines.append('  <script src="html/js/main-desktop.min.js?r=[% material_revision %]"></script>\n')
                        else:
                            fixedLines.append('  <script src="html/js/main.min.js?r=[% material_revision %]"></script>\n')
                    replacedJs = True
            elif MINIFY_CSS and matchedCss:
                if not replacedCss:
                    fixedLines.append('    <link href="html/css/style.min.css?r=[% material_revision %]" rel="stylesheet">\n')
                    fixedLines.append('    <link href="html/css/%s.min.css?r=[%% material_revision %%]" rel="stylesheet">\n' % html)
                    replacedCss = True
            else:
                fixedLines.append(line)

        with open(path, "w") as f:
            for line in fixedLines:
                f.write(line)


def minify():
    info("Minifying")
    if MINIFY_JS:
        minifyJs()
    if MINIFY_CSS:
        minifyCss()
    removeUnminified()
    fixHtml()


def createZip(version):
    info("Creating ZIP")
    zipFile="lms-material-%s" % version
    os.chdir('build')
    shutil.make_archive(zipFile, 'zip', 'MaterialSkin')
    zipFile+=".zip"
    os.rename(zipFile, "../%s" % zipFile)
    os.chdir('..')
    return zipFile


def getSha1Sum(zipFile):
    info("Generatin SHA1")
    sha1 = hashlib.sha1()
    with open(zipFile, 'rb') as f:
        while True:
            data = f.read(65535)
            if not data:
                break
            sha1.update(data)
    return sha1.hexdigest()


def updatePublicXml(version, zipFile, sha1):
    lines=[]
    updatedVersion=False
    updatedUrl=False
    updatedSha=False
    info("Updating %s" % PUBLIC_XML)
    with open(PUBLIC_XML, "r") as f:
        lines=f.readlines()
    for i in xrange(len(lines)):
        updated = updateLine(lines[i], 'version="', '"', version)
        if updated:
            lines[i]=updated
            updatedVersion=True
        updated = updateLine(lines[i], '<url>', '</url>', releaseUrl(version))
        if updated:
            lines[i]=updated
            updatedUrl=True
        updated = updateLine(lines[i], '<sha>', '</sha>', sha1)
        if updated:
            lines[i]=updated
            updatedSha=True

        if updatedVersion and updatedUrl and updatedSha:
            break

    if not updatedVersion:
        error("Failed to update version in %s" % PUBLIC_XML)
    if not updatedUrl:
        error("Failed to url version in %s" % PUBLIC_XML)
    if not updatedSha:
        error("Failed to sha version in %s" % PUBLIC_XML)
    with open(PUBLIC_XML, "w") as f:
        for line in lines:
            f.write(line)


if 1==len(sys.argv):
    usage()
version=sys.argv[1]
checkVersion(version)
checkVersionExists(version)
updateInstallXml(version)
prepare()
if MINIFY_JS or MINIFY_CSS:
    minify()

zipFile = createZip(version)
sha1 = getSha1Sum(zipFile)
updatePublicXml(version, zipFile, sha1)
cleanup()

