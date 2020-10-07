#!/usr/bin/env python3

#
# LMS-Material
#
# Copyright (c) 2018-2019 Craig Drummond <craig.p.drummond@gmail.com>
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
REPO_XML = "repo.xml"
BUILD_FOLDER = "build"
HTML_FOLDER = BUILD_FOLDER + "/MaterialSkin/HTML/material/html"
INSTALL_XML = BUILD_FOLDER + "/MaterialSkin/install.xml"
JS_COMPILER = "tools/closure-compiler/closure-compiler-v20181008.jar"
MATERIAL_JS = "material-skin.min.js"
MATERIAL_DEFERRED_JS = "material-skin-deffered.min.js"
LIB_CSS = "lib.min.css"
LIB_DEFERRED_CSS = "lib-deferred.min.css"
JS_FILE = "material.min.js"
JS_DEFERRED_FILE = "material-deferred.min.js"


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
    if request.status_code == 200 or request.status_code == 302:
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
    for i in range(len(lines)):
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


def checkAndRemove(path, t):
    orig = path.replace(".min."+t, "."+t)
    if os.path.exists(orig):
        os.remove(orig)
        info("...remove %s" % orig)
    orig = path.replace(".min."+t, ".orig."+t)
    if os.path.exists(orig):
        os.remove(orig)
        info("...remove %s" % orig)


def cleanDir(path):
    for e in os.listdir(path):
        entry = "%s/%s" % (path, e)
        if e == "minify.sh":
            os.remove(entry)
        elif e.endswith(".min.js"):
            checkAndRemove(entry, "js")
        elif e.endswith(".min.css"):
            checkAndRemove(entry, "css")
        elif os.path.isdir(entry):
            cleanDir(entry)


def prepare():
    info("Preparing code")
    if os.path.exists(BUILD_FOLDER):
        shutil.rmtree(BUILD_FOLDER)
    os.mkdir(BUILD_FOLDER)
    try:
        shutil.copytree("MaterialSkin", "%s/MaterialSkin" % BUILD_FOLDER)
    except Exception as e:
        error("Failed to copy files to %s folder - %s" % (BUILD_FOLDER, str(e)))

    # Remove unminified versions of CSS and JS files, if we have the minified version
    cleanDir("%s/lib" % HTML_FOLDER)


def cleanup():
    info("Removing build folder")
    if os.path.exists(BUILD_FOLDER):
        shutil.rmtree(BUILD_FOLDER)


def fixUtils():
    text=""
    info("...updating utils.js")
    with open("%s/js/utils.js" % HTML_FOLDER, "r") as f:
        for line in f.readlines():
            text+=line.replace(".css?", ".min.css?")
    with open("%s/js/utils.js" % HTML_FOLDER, "w") as f:
         f.write(text)


def fixClassisSkinMods(version):
    info("...updating Classic Skin mods")
    for entry in ["skin.css", "standardheader.html", "html/js/iframe-dialog.js"]:
        fixedLines = []
        path = "%s/../%s" % (HTML_FOLDER, entry)
        with open(path, "r") as f:
            lines=f.readlines()
            for line in lines:
                line=line.replace("?r=MATERIAL_VERSION", "?r=%s" % version)
                if "html/css/" in line:
                    # mods.css is specal here as as its in skin.css and this does not have version info
                    line=line.replace(".css?", ".min.css?").replace("mods.css", "mods.min.css")
                fixedLines.append(line)

        with open(path, "w") as f:
            for line in fixedLines:
                f.write(line)


def trim(path):
    fixedLines = []
    inTemplate = False
    with open(path, "r") as f:
        lines=f.readlines()
        for line in lines:
            backTicks=line.count("`")
            if 1==backTicks:
                if inTemplate:
                    inTemplate = False
                else:
                    inTemplate = True
            if inTemplate:
                fixed = re.sub("^\\s+", "", line.rstrip())
                fixedLines.append(fixed)
            else:
                fixedLines.append(line)

    with open(path, "w") as f:
        for line in fixedLines:
            f.write(line)


def minifyJs():
    info("...JS")
    jsCommand = ["java", "-jar", JS_COMPILER, "--js_output_file=%s/js/%s" % (HTML_FOLDER, MATERIAL_JS)]
    jsDeferredCommand = ["java", "-jar", JS_COMPILER, "--js_output_file=%s/js/%s" % (HTML_FOLDER, MATERIAL_DEFERRED_JS)]
    with open("%s/../index.html" % HTML_FOLDER, "r") as f:
        for line in f.readlines():
            if "addJsToDocument" in line and "html/js/" in line:
                for script in line.split('[')[1].split(']')[0].replace('"', '').replace(' ', '').split(','):
                    jsDeferredCommand.append("%s/js/%s.js" % (HTML_FOLDER, script))
                    trim("%s/js/%s.js" % (HTML_FOLDER, script))
            else:
                start = line.find("html/js/")
                if start>0:
                    start+=len("html/js/")
                    end = line.find("?r=", start)
                    if end>0:
                        script=line[start:end]
                        jsCommand.append("%s/js/%s" % (HTML_FOLDER, script))
                        trim("%s/js/%s" % (HTML_FOLDER, script))
    subprocess.call(jsCommand, shell=False)
    subprocess.call(jsDeferredCommand, shell=False)


def minifyCssFiles(d):
    for entry in sorted(os.listdir(os.path.join(HTML_FOLDER, d))):
        path = os.path.join(HTML_FOLDER, d, entry)
        if os.path.isdir(path):
            minifyCssFiles(os.path.join(d, entry))
        elif entry.endswith(".css"):
            info("......%s/%s" % (d, entry))
            cssStr=""
            with open(path, "r") as f:
                for line in f.readlines():
                    cssStr+=line.replace("\n", "").replace(" {", "{")
            while ("  " in cssStr):
                cssStr=cssStr.replace("  ", " ")
            cssStr=cssStr.replace("} ", "}").replace("{ ", "{").replace("; ", ";").replace(": ", ":").replace(" :", ":").replace(" !", "!");
            while True:
                start = cssStr.find("/*")
                if start<0:
                    break
                end = cssStr.find("*/")
                if end<start:
                    break
                cssStr=cssStr[:start]+cssStr[end+2:]
            minCss = path.replace(".css", ".min.css")
            with open(minCss, "w") as f:
                f.write(cssStr)
            os.remove(path)


def minifyCss():
    info("...CSS")
    minifyCssFiles("css")


def removeUnminified():
    info("...Removing non-minified files")
    for entry in os.listdir("%s/js" % HTML_FOLDER):
        if entry.endswith(".js") and not entry.endswith(".min.js"):
            os.remove("%s/js/%s" % (HTML_FOLDER, entry))


def combineFiles():
    info("...Combining files")
    scripts=[]
    css=[]
    deferredScripts=[]
    deferredCss=[]
    with open("%s/../index.html" % HTML_FOLDER, "r") as f:
        for line in f.readlines():
            if "addCssToDocument" in line and "html/lib/photoswipe/" in line:
                for file in line.split('[')[1].split(']')[0].replace('"', '').replace(' ', '').split(','):
                    deferredCss.append("%s/lib/photoswipe/%s.css" % (HTML_FOLDER, file))
            elif "addJsToDocument" in line and "html/lib/photoswipe/" in line:
                for file in line.split('[')[1].split(']')[0].replace('"', '').replace(' ', '').split(','):
                    deferredScripts.append("%s/lib/photoswipe/%s.js" % (HTML_FOLDER, file))
            else:
                start = line.find("html/lib/")
                if start>0:
                    start+=len("html/lib/")
                    end = line.find("?r=", start)
                    if end<=0:
                        end = line.find('"', start)
                    if end>0:
                        file=line[start:end]
                        if file.endswith(".js"):
                            scripts.append("%s/lib/%s" % (HTML_FOLDER, file))
                        elif file.endswith(".css"):
                            css.append("%s/lib/%s" % (HTML_FOLDER, file))
    scripts.append("%s/js/%s" % (HTML_FOLDER, MATERIAL_JS))
    deferredScripts.append("%s/js/%s" % (HTML_FOLDER, MATERIAL_DEFERRED_JS))
    info("......JS")
    with open("%s/js/%s" % (HTML_FOLDER, JS_FILE), "w") as out:
        for script in scripts:
            with open(script, "r") as f:
                out.writelines(f.readlines())
                out.write("\n")
            info("......... %s" % script)
            os.remove(script)
    info("......Deferred JS")
    with open("%s/js/%s" % (HTML_FOLDER, JS_DEFERRED_FILE), "w") as out:
        for script in deferredScripts:
            with open(script, "r") as f:
                out.writelines(f.readlines())
                out.write("\n")
            info("......... %s" % script)
            os.remove(script)
    info("......CSS")
    with open("%s/css/%s" % (HTML_FOLDER, LIB_CSS), "w") as out:
        for c in css:
            with open(c, "r") as f:
                out.writelines(f.readlines())
                out.write("\n")
            info("......... %s" % c)
            os.remove(c)
    info("......Deferred CSS")
    with open("%s/css/%s" % (HTML_FOLDER, LIB_DEFERRED_CSS), "w") as out:
        for c in deferredCss:
            with open(c, "r") as f:
                out.writelines(f.readlines())
                out.write("\n")
            info("......... %s" % c)
            os.remove(c)
    info("......PhotoSwipe Skin")
    for entry in os.listdir("%s/lib/photoswipe/default-skin/" % HTML_FOLDER):
        if entry.endswith(".png") or entry.endswith(".svg") or  entry.endswith(".gif"):
            os.rename("%s/lib/photoswipe/default-skin/%s" % (HTML_FOLDER, entry), "%s/css/%s" % (HTML_FOLDER, entry))
    shutil.rmtree("%s/lib/" % HTML_FOLDER)


def fixHtml(version):
    info("...updating HTML files")
    for entry in os.listdir("%s/../" % HTML_FOLDER):
        if entry.endswith(".html"):
            fixedLines = []
            path = "%s/../%s" % (HTML_FOLDER, entry)
            inJs = False
            inCss = False
            inDeferred = False
            with open(path, "r") as f:
                lines=f.readlines()
            for line in lines:
                if "<!--CSS start-->" in line:
                    inCss = True
                    fixedLines.append('  <link href="html/css/%s?r=%s" rel="stylesheet">\n' % (LIB_CSS, version))
                elif "<!--CSS end-->" in line:
                    inCss = False
                elif "<!--JS start-->" in line:
                    inJs = True
                    fixedLines.append('  <script>const LMS_MATERIAL_REVISION="%s";</script>\n' % version)
                    fixedLines.append('  <script src="html/js/%s?r=%s"></script>\n' % (JS_FILE, version))
                elif "<!--JS end-->" in line:
                    inJs = False
                elif "// DEFFERED start" in line:
                    inDeferred = True
                    fixedLines.append('  function loadOtherFiles() {\n')
                    fixedLines.append('    var script = document.createElement("script");\n')
                    fixedLines.append('    script.src = "html/js/%s?r=%s";\n' % (JS_DEFERRED_FILE, version))
                    fixedLines.append('    document.body.appendChild(script);\n')
                    fixedLines.append('    var link = document.createElement("link");\n')
                    fixedLines.append('    link.href = "html/css/%s?r=%s";\n' % (LIB_DEFERRED_CSS, version))
                    fixedLines.append('    link.rel = "stylesheet";\n')
                    fixedLines.append('    document.body.appendChild(link);\n')
                    fixedLines.append('  }\n')
                elif "// DEFFERED end" in line:
                    inDeferred = False
                elif not inCss and not inJs and not inDeferred:
                    if "print" in line: # Perl block...
                        line=line.replace(".css", ".min.css")
                    fixedLines.append(line)

            with open(path, "w") as f:
                for line in fixedLines:
                    f.write(line)


def minify(version):
    info("Minifying")
    fixUtils()
    fixClassisSkinMods(version)
    minifyJs()
    minifyCss()
    removeUnminified()
    combineFiles()
    fixHtml(version)

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


def updateRepoXml(repoFile, version, zipFile, sha1, pluginName=None):
    lines=[]
    updatedVersion=False
    updatedUrl=False
    updatedSha=False
    info("Updating %s" % repoFile)
    inSection = True if pluginName is None else False
    with open(repoFile, "r") as f:
        lines=f.readlines()
    for i in range(len(lines)):
        if pluginName is not None and '<plugin name="' in lines[i]:
            inSection = pluginName in lines[i]
        if inSection:
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
        error("Failed to update version in %s" % repoFile)
    if not updatedUrl:
        error("Failed to url version in %s" % repoFile)
    if not updatedSha:
        error("Failed to sha version in %s" % repoFile)
    with open(repoFile, "w") as f:
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
minify(version)

zipFile = createZip(version)
sha1 = getSha1Sum(zipFile)
if version!="test":
    if os.path.exists(REPO_XML):
        updateRepoXml(REPO_XML, version, zipFile, sha1, "MaterialSkin")
    if os.path.exists(PUBLIC_XML):
        updateRepoXml(PUBLIC_XML, version, zipFile, sha1)
cleanup()

