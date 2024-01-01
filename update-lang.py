#!/usr/bin/env python3

#
# LMS-Material
#
# Copyright (c) 2018-2024 Craig Drummond <craig.p.drummond@gmail.com>
# MIT license.
#

#
# This script is used to extract translateable strings from Javascript, 
# and update JSON lang files.
#

import collections
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
            info("Add %s" % str(pair))
        if a in translations:
            translations.remove(a)
        if b in translations:
            translations.remove(b)
    else:
        if not a in translations:
            for b in plurals:
                if a in b:
                    return
            info("Add %s" % a)
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
        if matches and not re.findall("\\'title:\\s*\\'", line):
            for match in matches:
                add(match.split("'")[1])
 
        matches = re.findall('title:\\s*\\".+\\"', line)
        if matches and not re.findall('\\"title:\\s*\\"', line):
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
    translated=[]
    untranslated=[]
    for i in translations:
        if i in values and len(values[i])>0:
            translated.append([i, values[i]])
        else:
            untranslated.append([i, ""])
    entries = collections.OrderedDict(translated)
    entries.update(untranslated)

    first=True
    with open(path, "w") as f:
        json.dump(entries, f, ensure_ascii=False, indent=0, separators=(',', ':'))


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

