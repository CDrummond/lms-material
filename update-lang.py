#!/usr/bin/env python

#
# LMS-Material
#
# Copyright (c) 2018 Craig Drummond <craig.p.drummond@gmail.com>
# MIT license.
#

#
# This script is used to extract translateable strings from Javascript, 
# and update JSON lang files.
#

import json
import os
import re
import sys


translations=[]
plurals=[]

def info(s):
    print("INFO: %s" %s)

def add(a, b=None):
    global translations
    global plurals
    if b:
        pair=[a, b]
        if not pair in plurals:
            plurals.append(pair)
        if a in translations:
            translations.remove(a)
        if b in translations:
            translations.remove(b)
    else:
        if not a in translations:
            for b in plurals:
                if a in b:
                    return
            translations.append(a)
 
def extract(path):
    info("Extracting strings from: %s" % path)
    with open(path, "r") as f:
        lines=f.readlines()
    for line in lines:
        matches = re.findall("i18n\\(\\s*\\'[^\\']+\\'\\s*", line)
        if matches:
            for match in matches:
                add(match.split("'")[1])
 
        matches = re.findall('i18n\\(\\s*\\"[^\\"]+\\"\\s*', line)
        if matches:
            for match in matches:
                add(match.split('"')[1])
 
        matches = re.findall("i18np\\(\\s*\\'[^\\']+\\'\\s*\\,\\s*\\'[^\\']+\\'\\s*,", line)
        if matches:
            for match in matches:
                parts = match.split("'")
                add(parts[1], parts[3])
 
        matches = re.findall('i18np\\(\\s*\\"[^\\"]+\\"\\s*\\,\\s*\\"[^\\"]+\\"\\s*,', line)
        if matches:
            for match in matches:
                parts = match.split('"')
                add(parts[1], parts[3])
 
        matches = re.findall("title:\\s*\\'.+\\'", line)
        if matches:
            for match in matches:
                add(match.split("'")[1])
 
        matches = re.findall('title:\\s*\\".+\\"', line)
        if matches:
            for match in matches:
                add(match.split('"')[1])
 
 
def update(path):
    info("Updating: %s" % path)
    global translations
    values={}
    with open(path, "r") as f:
        try:
            values=json.load(f)
        except:
            pass
    first=True
    with open(path, "w") as f:
        f.write("{")
        for i in translations:
            if not first:
                f.write(",\n")
            else:
                first=False
                f.write("\n")
            if i in values:
                f.write('"%s":"%s"' % (i, values[i].encode("utf-8")))
            else:
                f.write('"%s":""' % i)
        f.write("\n}\n")


def extractAll(path, ext):
    global translations
    global plurals
    
    for f in os.listdir(path):
        if f.endswith(ext):
            extract(os.path.join(path, f))

    translations.sort()
    plurals.sort()
    for t in plurals:
        translations.append(t[0])
        translations.append(t[1])

    info("Total strings: %d" % len(translations))


def updateAll(path, ext):
    for f in os.listdir(path):
        if f.endswith(ext):
            update(os.path.join(path, f))


extractAll('MaterialSkin/HTML/material/html/js', '.js')
updateAll('MaterialSkin/HTML/material/html/lang', '.json')

