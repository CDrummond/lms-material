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
MINIFY_CODE = False # Change to true when nearer a full release


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


def cleanup():
    info("Removing build folder")
    if os.path.exists(BUILD_FOLDER):
        shutil.rmtree(BUILD_FOLDER)


def minify():
    info("Minifying")
    index = "%s/MaterialSkin/HTML/material/index.html" % BUILD_FOLDER
    jsFiles = []
    minifiedJs = "html/js/lms-material.min.js"
    jsCommand = ["java", "-jar", "tools/closure-compiler/closure-compiler-v20181008.jar", "--js_output_file=%s/MaterialSkin/HTML/material/%s" % (BUILD_FOLDER, minifiedJs)]
    replacedJs = False
    replacedCss = False
    fixedLines = []
    with open(index, "r") as f:
        lines=f.readlines()
    for line in lines:
        matchedJs = False
        matchedCss = False
        matches = re.findall('src\\s*\\=\\"html/js/[^\\"]+\\.js\\"', line)
        if matches:
            for match in matches:
                path = "%s/MaterialSkin/HTML/material/%s" % (BUILD_FOLDER, match.split('"')[1])
                jsFiles.append(path)
                jsCommand.append(path)
                matchedJs = True
        else:
            matches = re.findall('"html/css/style.css"', line)
            if matches:
                for match in matches:
                    matchedCss = True

        if matchedJs:
            if not replacedJs:
                fixedLines.append('    <script src="%s?r=[% material_revision %]"></script>\n' % minifiedJs)
                replacedJs = True
        elif matchedCss:
            if not replacedCss:
                fixedLines.append('    <link href="html/css/style.min.css?r=[% material_revision %]" rel="stylesheet">\n')
                replacedCss = True
        else:
            fixedLines.append(line)

    # run JS command
    try:
        info("    ...JS")
        subprocess.call(jsCommand, shell=False)
    except:
        error("Failed to minify JS")

    # run CSS command
    origCss = "%s/MaterialSkin/HTML/material/html/css/style.css" % BUILD_FOLDER
    minCss = "%s/MaterialSkin/HTML/material/html/css/style.min.css" % BUILD_FOLDER
    try:
        info("    ...CSS")
        subprocess.call(["java", "-jar", "tools/yuicompressor/yuicompressor-2.4.8.jar", "-o", minCss, origCss], shell=False)
    except:
        error("Failed to minify CSS")

    for f in jsFiles:
        os.remove(f)
    os.remove(origCss)

    # Update index.html
    with open(index, "w") as f:
        for line in fixedLines:
            f.write(line)


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
if MINIFY_CODE:
    minify()

zipFile = createZip(version)
sha1 = getSha1Sum(zipFile)
updatePublicXml(version, zipFile, sha1)
cleanup()

