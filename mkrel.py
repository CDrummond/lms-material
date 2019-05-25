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


PUBLIC_XML = "public.xml"
BUILD_FOLDER = "build"
HTML_FOLDER = BUILD_FOLDER + "/MaterialSkin/HTML/material/html"
INSTALL_XML = BUILD_FOLDER + "/MaterialSkin/install.xml"
MINIFY = True
JS_COMPILER = "tools/closure-compiler/closure-compiler-v20181008.jar"

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


def fixUtils():
    text=""
    with open("%s/js/utils.js" % HTML_FOLDER, "r") as f:
        for line in f.readlines():
            text+=line.replace(".css?", ".min.css?")
    with open("%s/js/utils.js" % HTML_FOLDER, "w") as f:
         f.write(text)


def minifyJs():
    info("...JS")
    for js in sorted(os.listdir("%s/js" % HTML_FOLDER)):
        if js.endswith(".js"):
            info("......%s" % js)
            jsCommand = ["java", "-jar", JS_COMPILER, "--js_output_file=%s/js/%s" % (HTML_FOLDER, js.replace(".js", ".min.js")), "%s/js/%s" % (HTML_FOLDER, js)]
            subprocess.call(jsCommand, shell=False)


def minifyCss():
    info("...CSS")
    for css in sorted(os.listdir("%s/css" % HTML_FOLDER)):
        if css.endswith(".css"):
            info("......%s" % css)
            origCss = "%s/css/%s" % ( HTML_FOLDER, css)
            cssStr=""
            with open(origCss, "r") as f:
                for line in f.readlines():
                    cssStr+=line.replace("\n", "").replace(" {", "{")
            while ("  " in cssStr):
                cssStr=cssStr.replace("  ", " ")
            cssStr=cssStr.replace("} ", "}").replace("{ ", "{").replace("; ", ";");
            while True:
                start = cssStr.find("/*")
                if start<0:
                    break
                end = cssStr.find("*/")
                if end<start:
                    break
                cssStr=cssStr[:start]+cssStr[end+2:]
            minCss = origCss.replace(".css", ".min.css")
            with open(minCss, "w") as f:
                f.write(cssStr)


def removeUnminified():
    info("...removing non-minified files")
    if MINIFY:
        for entry in os.listdir("%s/js" % HTML_FOLDER):
            if entry.endswith(".js") and not entry.endswith(".min.js"):
                os.remove("%s/js/%s" % (HTML_FOLDER, entry))
        for entry in os.listdir("%s/css" % HTML_FOLDER):
            if entry.endswith(".css") and not entry.endswith(".min.css"):
                os.remove("%s/css/%s" % (HTML_FOLDER, entry))


def fixHtml():
    info("...updating HTML files")
    for entry in os.listdir("%s/../" % HTML_FOLDER):
        if entry.endswith(".html"):
            fixedLines = []
            path = "%s/../%s" % (HTML_FOLDER, entry)
            with open(path, "r") as f:
                lines=f.readlines()
            for line in lines:
                matchedJs = False
                matchedCss = False
                matches = re.findall('src\\s*\\=\\"html/js/[^\\"]+\\.js', line)
                if matches and 1==len(matches):
                    matchedJs = True
                else:
                    matches = re.findall('href\\s*\\=\\"html/css/[^\\"]+\\.css', line)
                    if matches and 1==len(matches):
                        matchedCss = True

                if matchedJs:
                    fixedLines.append(line.replace(".js", ".min.js"))
                elif matchedCss:
                    fixedLines.append(line.replace(".css", ".min.css"))
                else:
                    fixedLines.append(line)

            with open(path, "w") as f:
                for line in fixedLines:
                    f.write(line)


def minify():
    info("Minifying")
    fixUtils()
    minifyJs()
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
    info("Generating SHA1")
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
if version!="test":
    checkVersion(version)
    checkVersionExists(version)
prepare()
updateInstallXml(version)
if MINIFY:
    minify()

zipFile = createZip(version)
sha1 = getSha1Sum(zipFile)
if version!="test":
    updatePublicXml(version, zipFile, sha1)
cleanup()

