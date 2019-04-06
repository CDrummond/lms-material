#!/bin/bash

for js in intersection-observer.js longpress.js libcometd.js ; do
    dest=`echo $js | sed s^\.js^\.min\.js^g`
    echo "Minifying $js"
    java -jar ../../../../../tools/closure-compiler/closure-compiler*.jar --js_output_file=$dest $js 
done
