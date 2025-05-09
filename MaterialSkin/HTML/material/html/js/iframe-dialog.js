/**
 * LMS-Material
 *
 * Copyright (c) 2018-2024 Craig Drummond <craig.p.drummond@gmail.com>
 * MIT license.
 */
'use strict';

const SLOW_PAGES = new Set(['SETUP_PLUGINS']);
const LMS_PAGES =  new Set(['server', 'player', 'extras', 'lms', 'help']);

let useDefaultSkinForServerSettings = true;

function remapClassicSkinIcons(doc, col) {
    const ICONS = ["play", "add", "edit", "favorite", "favorite_remove", "delete", "delete_white", "first", "last", "up", "down", "mix", "mmix", "next", "prev", "queue"];
    const OTHER_EXT = [".png", ".gif"];
    var imgList = doc.getElementsByTagName('img');
    if (imgList) {
        for (var i = 0, len=imgList.length; i < len; i++) {
            var replaced = false;
            for (var m = 0, mlen = ICONS.length; m<mlen && !replaced; ++m) {
                if (imgList[i].src.endsWith("/html/images/b_" + ICONS[m] + ".gif")) {
                    imgList[i].src="/material/svg/cs-"+ICONS[m]+"?c="+col;
                    if (IS_MOBILE) {
                        imgList[i].classList.add("msk-cs-touch-img");
                    }
                    replaced = true;
                }
            }
            if (!replaced) {
                /* Try to handle plugin images from 'Extras' pages - e.g. DynamicPlaylistCreator
                 * src should be (e.g.):
                 *     http://localhost:9000/material/html/images/dplc_export.gif?svg=DynamicPlaylistCreator
                 * in plugin's HTML its just 'dplc_export.gif?svg=DynamicPlaylistCreator'
                 */
                for (var e = 0, elen = OTHER_EXT.length; e<elen && !replaced; ++e) {
                    try {
                        if (imgList[i].src.indexOf(OTHER_EXT[e]+"?svg=")>0) {
                            let url = undefined;
                            let path = imgList[i].src;
                            let pluginPath = "";
                            if (imgList[i].src.startsWith("http:")) {
                                url = new URL(path);
                                path = url.pathname;
                                pluginPath = "plugins/"+url.search.split("=")[1]+(path.startsWith("/html/images/") ? "/" : "/html/images/");
                            }
                            path="/material/svg/"+pluginPath+path.replace(OTHER_EXT[e], ".svg").replace(/^\/+/, '')
                            if (url!=undefined) {
                                url.pathname = path;
                                path=url.href;
                            }
                            imgList[i].src = path+"&c="+col;
                            if (IS_MOBILE) {
                                imgList[i].classList.add("msk-cs-touch-img");
                            }
                            replaced = true;
                        }
                    } catch(e) {
                        logError(e);
                    }
                }
            }
            if (!replaced && imgList[i].src.endsWith(".svg") && imgList[i].src.indexOf("/material/html/")>=0) {
                imgList[i].src=imgList[i].src.replace("/material/html/", "/material/svg/html/")+"?c="+col;
                imgList[i].removeAttribute("srcset");
            }
            /*if (!replaced) {
                if (imgList[i].src.endsWith("/star_noborder.gif") || imgList[i].src.endsWith("/star.gif")) {
                    imgList[i].src="/material/svg/cs-star?c="+col;
                    replaced = true;
                } else if (imgList[i].src.endsWith("/plugins/TrackStat/html/images/empty.gif")) {
                    imgList[i].src="/material/svg/cs-star_outline?c="+col;
                    replaced = true;
                }
            }*/
            if (replaced) {
                imgList[i].width="24";
                imgList[i].height="24";
            }
        }
    }
}

function fixClassicSkinRefs(doc) {
    var refList = doc.getElementsByTagName('a');
    if (refList) {
        for (var i = 0, len=refList.length; i < len; i++) {
            if (refList[i].target=='browser' && refList[i].href && refList[i].href.startsWith(window.location)) {
                refList[i].removeAttribute('target');
            }
        }
    }
}

function iframeBrowseArtist(id, name, role) {
    bus.$emit("browse", ["albums"], ["artist_id:"+id, ARTIST_ALBUM_TAGS, SORT_KEY+ARTIST_ALBUM_SORT_PLACEHOLDER, "role_id:"+(undefined==role ? "ALBUMARTIST" : role)], name, undefined, false);
    bus.$emit('iframe-close');
}

function iframeBrowseAlbum(id, name) {
    bus.$emit("browse", ["tracks"], ["album_id:"+id, TRACK_TAGS, SORT_KEY+"tracknum"], name, undefined, false);
    bus.$emit('iframe-close');
}

function iframeBrowseGenre(id, name) {
    bus.$emit("browse", "genre", id, name, undefined, false);
    bus.$emit('iframe-close');
}

function iframeBrowseYear(name) {
    bus.$emit("browse", "year", name, name, undefined, false);
    bus.$emit('iframe-close');
}

function iframeBrowseWork(id, name) {
    bus.$emit("browse", ["albums"], ["work_id:"+id, ARTIST_ALBUM_TAGS, SORT_KEY+ARTIST_ALBUM_SORT_PLACEHOLDER], name, undefined, false);
    bus.$emit('iframe-close');
}

function iframeTrackInfo(id, name) {
    bus.$emit('trackInfo', {id:"track_id:"+id, title:name});
    bus.$emit('iframe-close');
}

function addHooks(doc) {
    doc.lmsMaterialSkin = {
        browseArtist:iframeBrowseArtist,
        browseAlbum:iframeBrowseAlbum,
        browseGenre:iframeBrowseGenre,
        browseYear:iframeBrowseYear,
        browseWork:iframeBrowseWork,
        trackInfo:iframeTrackInfo
    }
}

function otherClickHandler(e) {
    var target = e.target || e.srcElement;
    var href = undefined;
    var clearHistoryOf = undefined;
    if (target.tagName === 'A') {
        href = target.getAttribute('href');
    } else if (target.tagName === 'SPAN' || target.tagName === 'IMG') {
        href = target.parentElement.getAttribute('href');
    }
    // If href is "/status_header.html" then redirect to current URL
    if (href && href.startsWith("/status_header.html?")) {
        let hpos = href.indexOf('?');
        let opos = iframeInfo.src.indexOf('?');
        if (opos>0) {
            href = iframeInfo.src.substring(0, opos+1) + href.substring(hpos+1);
            // Prevent click from propagating further - as causes a new page to open?
            e.preventDefault();
            // Reset any history related to current URL - as we've reset from status to current page
            clearHistoryOf = iframeInfo.src.substring(0, opos);
        }
    }
    if (href && !href.startsWith('#')) {
        bus.$emit('iframe-href', href, undefined, clearHistoryOf);
    }
}

function clickDirSelect(elem) {
    var id = elem.srcElement.id.split('.')[1];
    bus.$emit('dlg.open', 'file', elem.srcElement.ownerDocument.getElementById(id), true);
}

function clickFileSelect(elem) {
    var id = elem.srcElement.id.split('.')[1];
    var entry = elem.srcElement.ownerDocument.getElementById(id);
    var types = [];
    for (var i=0, loop=entry.classList, len=loop.length; i<len; ++i) {
        if (loop[i].startsWith("selectFile_")) {
            types.push(loop[i].substring(11));
        }
    }
    bus.$emit('dlg.open', 'file', entry, false, types);
}

function addFsSelectButton(doc, elem, isDir) {
    if (elem && undefined==doc.getElementById("mskdirbtn."+elem.id)) {
        var btn = doc.createElement("div");
        btn.id="mskdirbtn."+elem.id;
        btn.classList.add("msk-dir-btn");
        btn.addEventListener("click", isDir ? clickDirSelect : clickFileSelect);
        // Append our icon after path field
        elem.parentNode.insertBefore(btn, elem.nextSibling);
    }
}

function addFsSelectButtons(doc) {
    var types=["selectFolder", "selectFile", "selectFile_.+"];
    for (var t=0; t<types.length; ++t) {
        var elems = types[t].endsWith("_.+") ? getElementsByClassName(doc, "input", types[t]) : doc.getElementsByClassName(types[t]);
        if (elems!=undefined) {
            for(var i=0, len=elems.length; i<len; ++i) {
                addFsSelectButton(doc, elems[i], 0==t);
            }
        }
    }
}

function addSliders(doc) {
    var inputs = getElementsByClassName(doc, "input", "sliderInput_.+");
    var added = false;
    if (inputs!=null) {
        for (var i=0, len=inputs.length; i<len; i++) {
            var classes = inputs[i].className.split(' ');
            if (classes.includes('msk-modified')) {
                continue;
            }
            for (var c=0, clen=classes.length; c<clen; ++c) {
                if (classes[c].startsWith('sliderInput_')) {
                    var parts = classes[c].substring('sliderInput_'.length).split('_');
                    if (parts.length>1) {
                        var min = parseInt(parts[0]);
                        var max = parseInt(parts[1]);
                        var inc = parts.length>2 ? parseInt(parts[2]) : 1;
                        var slider = doc.createElement("input");
                        slider.type="range";
                        slider.min=min;
                        slider.max=max;
                        slider.step=inc;
                        slider.value = inputs[i].value;
                        slider.classList.add("msk-slider");
                        slider.id="mskslider."+inputs[i].id;
                        inputs[i].parentNode.insertBefore(slider, inputs[i]);
                        if (max<=9999) {
                            inputs[i].classList.add("msk-slider-input");
                        }

                        slider.oninput = function() {
                            var input = this.id.substring("mskslider.".length);
                            doc.getElementById(input).value = this.value;
                        }
                        inputs[i].classList.add('msk-modified');
                        inputs[i].min=min;
                        inputs[i].max=max;
                        inputs[i].onchange = function() {
                            var val = parseInt(this.value);
                            var minVal = parseInt(this.min);
                            var maxVal = parseInt(this.max);
                            if (val>maxVal) {
                                this.value = maxVal;
                            } else if (val<minVal) {
                                this.value = minVal;
                            }
                            doc.getElementById("mskslider."+this.id).value = this.value;
                        }
                    }
                    added = true;
                    break;
                }
            }
        }
    }
    return added;
}

function hideSection(elem) {
    let p = elem.parentElement;
    while (undefined!=p) {
        let classes = p.className.split(' ');
        if (classes.includes('settingSection')) {
            p.parentNode.removeChild(p);
            return true;
        }
        p=p.parentElement;
    }
    return false;
}

function hideSections(doc) {
    if (LMS_SETTINGS_HIDE.length<1) {
        return true;
    }
    let sections = LMS_SETTINGS_HIDE.split(',');
    let hidden = false;

    for (let s=0, len=sections.length; s<len; ++s) {
        let elem = doc.getElementById(sections[s].trim());
        if (undefined!=elem && hideSection(elem)) {
            hidden = true;
        }
    }
    return hidden;
}

function toggleClass(elem, clz) {
    let classes = elem.className.split(' ');
    if (classes.includes(clz)) {
        elem.classList.remove(clz);
        return false;
    } else {
        elem.classList.add(clz);
        return true;
    }
}

function toggleSection(doc, elem) {
    let panel = doc.getElementById(elem.id.replace(/_Header/, ''));
    if (!panel) {
        return;
    }
    let hasClass = toggleClass(panel, 'msk-hidden-section');
    toggleClass(elem.parentElement, 'msk-collapsed');
    if (hasClass) {
        setLocalStorageVal("iframe.section."+elem.id, true);
    } else {
        removeLocalStorage("iframe.section."+elem.id);
    }
}

function addExpanders(doc) {
    let collapsables = getElementsByClassName(doc, "div", "collapsableSection");
    let added = false;
    if (collapsables!=null) {
        for (let i=0, len=collapsables.length; i<len; i++) {
            let classes = collapsables[i].className.split(' ');
            if (classes.includes('msk-modified')) {
                continue;
            }
            added = true;
            collapsables[i].classList.add('msk-modified');
            let btn = doc.createElement("div");
            btn.id="mskexpanderbtn."+collapsables[i].id;
            btn.classList.add("msk-expander-btn");
            collapsables[i].parentNode.insertBefore(btn, collapsables[i]);

            let collapse = getLocalStorageBool("iframe.section."+collapsables[i].id, false);
            if (collapse) {
                toggleSection(doc, collapsables[i]);
            }
            collapsables[i].onclick=function(ev) {
                let target = ev.target;
                if (isEmpty(target.id)) {
                    target = target.parentElement;
                }
                toggleSection(doc, target);
            };
        }
    }
    return added;
}

function addHelp(doc) {
    let descDivs = getElementsByClassName(doc, "div", "hiddenDesc");
    let added = false;
    if (null!=descDivs) {
        for (let i=0, len=descDivs.length; i<len; i++) {
            let classes = descDivs[i].className.split(' ');
            if (classes.includes('msk-modified')) {
                continue;
            }
            let desc = descDivs[i].innerHTML;
            if (isEmpty(desc)) {
                continue;
            }
            let parent = descDivs[i].parentElement;
            if (null==parent) {
                continue;
            }
            classes = parent.className.split(' ');
            if (!classes.includes('settingGroup') && !classes.includes('settingSection')) {
                continue;
            }
            let titles = getElementsByClassName(parent, "div", "prefHead");
            if (null==titles || titles.length!=1) {
                continue;
            }
            let title=titles[0];
            descDivs[i].classList.add('msk-modified');
            added = true;
            let btn = doc.createElement("div");
            btn.classList.add("msk-help-btn");
            title.style.float="left";
            descDivs[i].parentNode.insertBefore(btn, descDivs[i]);
            descDivs[i].innerHTML="";
            btn.onclick=function(ev) {
                bus.$emit('dlg.open', 'iteminfo', {list:[title.innerHTML, desc]});
            };
        }
    }
    return added;
}

var iframeInfo = { };

function iframeInitInfo() {
    iframeInfo = {
        content:undefined,
        action:undefined,
        actionCheckInterval: undefined,
        actionChecks: 0,
        pbarHeight: 0,
        settingsSelector: undefined,
        settingsPage: undefined,
        settingModified: false,
        initialLoad: true
      };
}

/* Check for file-entry fields, and sliders, each time form's action is changed */
function iframeActionCheck() {
    iframeInfo.actionChecks++;
    var iframe = document.getElementById("embeddedIframe");
    if (iframe) {
        var content = iframe.contentDocument;
        if (content) {
            var settingsForm = content.getElementById("settingsForm");
            if (settingsForm) {
                if (settingsForm.action!=iframeInfo.action) {
                    iframeInfo.action = settingsForm.action;
                    addFsSelectButtons(content);
                    iframeInfo.addedSliders = addSliders(content);
                    iframeInfo.sectionsHidden = hideSections(content);
                    iframeInfo.addedExpanders = addExpanders(content);
                    if (!IS_MOBILE) {
                        iframeInfo.addedHelp = addHelp(content);
                    }
                } else if (iframeInfo.actionChecks<50) {
                    if (!iframeInfo.addedSliders) {
                        iframeInfo.addedSliders = addSliders(content);
                    }
                    if (!iframeInfo.sectionsHidden) {
                        iframeInfo.sectionsHidden = hideSections(content);
                    }
                    if (!iframeInfo.addedExpanders) {
                        iframeInfo.addedExpanders = addExpanders(content);
                    }
                    if (!IS_MOBILE && !iframeInfo.addedHelp) {
                        iframeInfo.addedHelp = addHelp(content);
                    }
                    return;
                }
            }
        }
    }
    clearInterval(iframeInfo.actionCheckInterval);
    iframeInfo.actionCheckInterval = undefined;
    iframeInfo.actionChecks = 0;
}

function settingsSectionChanged() {
    bus.$emit('iframe-loaded', false, undefined==iframeInfo.settingsSelector ? undefined : iframeInfo.settingsSelector.value);
    if (undefined!=iframeInfo.actionCheckInterval) {
        clearInterval(iframeInfo.actionCheckInterval);
    }
    iframeInfo.addedSliders = false;
    iframeInfo.sectionsHidden = false;
    iframeInfo.addedExpanders = false;
    iframeInfo.addedHelp = false;
    iframeInfo.actionChecks = 0;
    iframeInfo.actionCheckInterval = setInterval(function () {
        iframeActionCheck();
    }, 100);
    iframeActionCheck();
}

function settingsSectionChangedReq() {
    if (iframeInfo.settingModified) {
        var reqPage = iframeInfo.settingsSelector.value;
        iframeInfo.settingsSelector.value = iframeInfo.settingsPage;
        bus.$emit('iframe-prompting', true);
        confirm(i18n("Some settings were changed. Do you want to save them?"), i18n('Save'), i18n('Cancel'), i18n('Discard')).then(res => {
            if (0==res) { // Cancel
                bus.$emit('iframe-prompting', false);
                return;
            }
            if (1==res) { // Save
                document.getElementById("embeddedIframe").contentDocument.forms.settingsForm.submit();
            }
            setTimeout(function() {
                iframeInfo.settingsSelector.value = reqPage;
                iframeInfo.settingModified = false;
                iframeInfo.settingsSelector.onchange();
                bus.$emit('iframe-prompting', false);
            }, 100);
        });
    } else {
        iframeInfo.settingsDoChange();
    }
}

function copyVar(iframe, name) {
    let v = getComputedStyle(document.getElementById("iframe-page")).getPropertyValue(name);
    if (undefined!=v) {
        iframe.contentWindow.document.documentElement.style.setProperty(name, v);
    }
}

function initChangeListeners(doc) {
    let types = ['input', 'textarea', 'select'];
    iframeInfo.settingModified = false;
    for (let i=0, len=types.length; i<len; ++i) {
        let elems = doc.getElementsByTagName(types[i]);
        for (let e=0, elen=elems.length; e<elen; ++e) {
            if (elems[e].id!="choose_setting" && undefined==elems[e].onchange) {
                elems[e].onchange = elems[e].onblur = function(ev) {
                    iframeInfo.settingModified = iframeInfo.settingModified || (elems[e].value != elems[e].defaultValue);
                };
            }
        }
    }
}

function copyVars(iframe) {
    if (undefined==iframe) {
        return false;
    }
    copyVar(iframe, '--std-font-size');
    copyVar(iframe, '--background-color');
    copyVar(iframe, '--primary-color');
    copyVar(iframe, '--accent-color');
    copyVar(iframe, '--pq-current-color');
    copyVar(iframe, '--inverted-text-color');
    copyVar(iframe, '--popup-background-color');
    copyVar(iframe, '--list-hover-color');
    copyVar(iframe, '--text-color');
    copyVar(iframe, '--icon-color');
    copyVar(iframe, '--dark-text-color');
    copyVar(iframe, '--light-text-color');
    copyVar(iframe, '--menu-dlg-shadow');
    copyVar(iframe, '--all-pad');
    copyVar(iframe, '--scrollbar-thumb-color');
    copyVar(iframe, '--std-scrollbar-thumb-color');
    copyVar(iframe, '--scrollbar-thumb-hover-color');
    copyVar(iframe, '--std-scrollbar-thumb-hover-color');
    copyVar(iframe, '--list-item-border-color');
    return true;
}

/*
function addDefaultSkinCss(doc, iframe) {
    let css = doc.createElement("link");
    css.href = "/material/html/css/default-skin/mods.css?r=MATERIAL_VERSION";
    css.rel = "stylesheet";
    css.type = "text/css";
    iframe.contentDocument.head.appendChild(css);
}
*/

function applyModifications(page, svgCol, darkUi, src) {
    if (!page) {
        bus.$emit('iframe-loaded', true);
        return;
    }
    iframeInfo.src = src;
    var iframe = document.getElementById("embeddedIframe");
    var copiedVars = false;
    if (iframe && iframe.contentDocument) {
        iframe.contentDocument.bus = bus;
        var content = iframe.contentDocument;
        iframeInfo.content = content;
        if (undefined==content) {
            bus.$emit('iframe-loaded', true);
            return;
        }

        if (LMS_PAGES.has(page)) {
            copiedVars = copyVars(iframe);
            content.documentElement.getElementsByTagName("body")[0].classList.add(IS_MOBILE ? "msk-is-touch" : "msk-is-non-touch");
            if (darkUi) {
                content.documentElement.getElementsByTagName("body")[0].classList.add("theme--dark");
            }
            fixClassicSkinRefs(content);
            remapClassicSkinIcons(content, svgCol);
            addHooks(content);
        }
        iframeInfo.settingModified = false;
        iframeInfo.settingsPage = undefined;
        iframeInfo.settingsSelector = undefined;
        if ('server'==page || 'player'==page) {
            iframeInfo.settingsSelector = content.getElementById("choose_setting");
            if (undefined!=iframeInfo.settingsSelector) {
                iframeInfo.settingsPage = iframeInfo.settingsSelector.value;
                iframeInfo.settingsDoChange = iframeInfo.settingsSelector.onchange;
                iframeInfo.settingsSelector.onchange = settingsSectionChangedReq;
                iframeInfo.settingsSelector.addEventListener("change", settingsSectionChanged);
                settingsSectionChanged(iframeInfo.settingsSelector.value);
                content.documentElement.classList.add("lms-settings-section-"+iframeInfo.settingsSelector.value+(LMS_VERSION<90000 || iframeInfo.settingsSelector.value!="SETUP_PLUGINS" ? "" : "_9"));
                if (LMS_VERSION>=90100) {
                    content.documentElement.classList.add("lms-91p");
                }
            }
        }

        if (content && ('other'==page || 'extras'==page || 'lms'==page)) {
            if (content.addEventListener) {
                content.addEventListener('click', otherClickHandler);
            } else if (content.attachEvent) {
                content.attachEvent('onclick', otherClickHandler);
            }
        }

        if ('dserver'==page || 'dlserver'==page) {
            let cancelBtn = content.getElementById('dlserver'==page ? "ext-gen50" : "cancel");
            if (cancelBtn!=undefined) {
                cancelBtn.onclick = function() {
                    bus.$emit('iframe-close');
                };
            }
            /*
            addDefaultSkinCss(document, iframe);
            let elems = content.documentElement.getElementsByTagName("iframe");
            if (undefined!=elems && elems.length>0) {
                for (let e=0, len=elems.length; e<len ; ++e) {
                    addDefaultSkinCss(elems[e].contentDocument, elems[e]);
                    elems[e].onload = function() {
                        addDefaultSkinCss(elems[e].contentDocument, elems[e]);
                    };
                }
            }
            */
        } else if ('player'==page || 'server'==page) {
            initChangeListeners(content.documentElement);
            // Set --vh as this is used to fix size of main settings frame, so that we can
            // correctly set its position, etc, to be consistent between mobile and desktop.
            // Previously desktop had a big padding above view selector.

            // Work-around 100vh behaviour in mobile chrome
            // See https://css-tricks.com/the-trick-to-viewport-units-on-mobile/
            let vh = window.innerHeight * 0.01;
            content.documentElement.style.setProperty('--vh', `${vh}px`);
            if (iframeInfo.settingsSelector && iframeInfo.settingsSelector.value=='INTERFACE_SETTINGS') {
                let elems = getElementsByClassName(content, "div", "settingSection");
                if (undefined!=elems && elems.length>0) {
                    let element = content.createElement("div");
                    element.innerHTML="<div style=\"padding-top:16px\"><i>"+i18n("NOTE: Only some of these settings apply to 'Material Skin'. However these settings will affect other skins and hardware players.")+"</i></div><hr class=\"main-sep\"/>";
                    elems[0].parentNode.insertBefore(element, elems[0]);
                }
            }
            content.documentElement.classList.add("lms-settings-"+page);
            // Look for any status message that needs to be shown in a toast or dialog (if there is an action)
            var statusarea = content.getElementById('statusarea');
            if (undefined!=statusarea) {
                var rescanWarning = content.getElementById('rescanWarning');
                var restartWarning = content.getElementById('restartWarning');
                var elem = undefined!=rescanWarning
                             ? rescanWarning
                             : undefined!=restartWarning
                                 ? restartWarning
                                 : undefined!=content.querySelector('[name="checkForUpdateNow"]') // Handle new LMS version...
                                   ? statusarea
                                   : undefined;
                if (undefined!=elem) {
                    var parts = elem.innerHTML.split("<a");
                    if (parts.length>1) {
                        var href = undefined!=elem.firstElementChild ? elem.firstElementChild.href : undefined;
                        if (undefined!=href) {
                            var msg = parts[0];
                            var doBtn = undefined;
                            if (undefined==msg || msg.trim().length<2) {
                                msg = undefined!=elem.firstElementChild ? elem.firstElementChild.innerHTML : undefined;
                            }
                            if (undefined!=msg) {
                                var dotPos = msg.lastIndexOf('. ');
                                if (dotPos>10) {
                                    msg = msg.substring(0, dotPos+1);
                                }
                                doBtn = undefined!=rescanWarning ? i18n("Rescan") : undefined!=restartWarning ? i18n("Restart") : i18n("Download");
                                if (undefined!=doBtn) {
                                    confirm(msg, doBtn).then(res => {
                                        if (res) {
                                            if (restartWarning) {
                                                lmsCommand("", ["restartserver"]).then(({}) => {
                                                    bus.$emit('showMessage', i18n('Server is being restarted.'));
                                                }).catch(err => {
                                                    bus.$emit('showMessage', i18n('Server is being restarted.'));
                                                });
                                            } else if (href.startsWith("https://") || (href.startsWith("http://") && !href.startsWith('http://'+window.location.hostname+':'+window.location.port+'/'))) {
                                                openWindow(href);
                                            } else {
                                                bus.$emit('iframe-href', href, false);
                                            }
                                        }
                                    });
                                    bus.$emit('iframe-loaded', true);
                                    return;
                                }
                            }
                        }
                    }
                }

                // Show statusarea messages in a toast, if different to any popupWarning (which will have been shown in an alert)
                var msg = statusarea.innerText;
                if (msg!=undefined) {
                    msg = msg.trim();

                    var popupWarning = iframeInfo.content.getElementById('popupWarning');
                    var popupMsg = undefined;
                    if (undefined!=popupWarning) {
                        popupMsg = popupWarning.innerHTML.replace(/<br\/?>/ig, ' \n').trim();
                    }

                    if (msg.length>0 && popupMsg!=msg) {
                        bus.$emit('showMessage', msg);
                    }
                }
            }
        }
    }
    if (copiedVars && iframeInfo.initialLoad) {
        setTimeout(function() { bus.$emit('iframe-loaded', true); }, 250);
    } else {
        bus.$emit('iframe-loaded', true);
    }
}

Vue.component('lms-iframe-dialog', {
    template: `
<div id="iframe-page">
 <v-dialog v-model="show" v-if="show" persistent no-click-animation scrollable fullscreen>
  <v-card v-bind:class="{'def-server':'dserver'==page, 'dark-logic':'dlserver'==page}">
   <v-card-title class="settings-title">
    <v-toolbar app-data class="dialog-toolbar" @mousedown="mouseDown" id="iframe-toolbar">
     <lms-windowcontrols v-if="queryParams.nativeTitlebar && queryParams.tbarBtnsPos=='l'"></lms-windowcontrols>
     <div class="drag-area-left"></div>
     <v-btn flat icon v-longpress:stop="goBack" :title="ttShortcutStr(i18n('Go back'), 'esc')"><v-icon>arrow_back</v-icon></v-btn>
     <v-btn v-if="showHome && homeButton" flat icon @click="goHome" :title="ttShortcutStr(i18n('Go home'), 'home')"><v-icon>home</v-icon></v-btn>
     <v-toolbar-title v-if="playerId && numPlayers>1 && (page=='player' || page=='extras')" @click="openChoiceMenu" class="pointer">{{title}} <v-icon>arrow_drop_down</v-icon></v-toolbar-title>
     <v-toolbar-title v-else>{{title}}</v-toolbar-title>
     <v-spacer class="drag-area"></v-spacer>
     <v-menu bottom left v-model="showMenu" v-if="haveCustomActions || (undefined!=actions && actions.length>2)">
      <v-btn icon slot="activator"><v-icon>more_vert</v-icon></v-btn>
      <v-list>
       <template v-for="(item, index) in actions">
        <v-divider v-if="item===DIVIDER"></v-divider>
        <v-list-tile v-else @click="doAction(item, $event)">
         <v-list-tile-avatar><v-icon v-if="item.icon">{{item.icon}}</v-icon></v-list-tile-avatar>
         <v-list-tile-content><v-list-tile-title>{{item.title}}</v-list-tile-title></v-list-tile-content>
        </v-list-tile>
       </template>
       <v-divider v-if="haveCustomActions"></v-divider>
       <template v-for="(action, index) in customActions" v-if="haveCustomActions">
        <v-list-tile @click="doCustomAction(action, player)">
         <v-list-tile-avatar><v-icon v-if="action.icon">{{action.icon}}</v-icon><img v-else-if="action.svg" class="svg-img" :src="action.svg | svgIcon(darkUi)"></img></v-list-tile-avatar>
         <v-list-tile-content><v-list-tile-title>{{action.title}}</v-list-tile-title></v-list-tile-content>
        </v-list-tile>
       </template>
      </v-list>
     </v-menu>
     <template v-else v-for="(item, index) in actions">
      <v-btn icon v-if="item!=DIVIDER" @click="doAction(item, $event)" :title="item.title"><v-icon v-if="item.icon">{{item.icon}}</v-icon><img v-else-if="item.svg" class="svg-img" :src="item.svg | svgIcon(darkUi)"></img></v-btn>
     </template>
     <div class="drag-area-right"></div>
     <lms-windowcontrols v-if="queryParams.nativeTitlebar && queryParams.tbarBtnsPos=='r'"></lms-windowcontrols>
    </v-toolbar>
   </v-card-title>
   <v-card-text class="embedded-page">
    <div v-if="showLoading" class="iframe-loading">{{i18n('Loading...')}}</div>
    <iframe id="embeddedIframe" v-on:load="applyModifications(page, svgCol, darkUi, src)" :src="src" frameborder="0" v-bind:class="{'iframe-text':'other'==page,'transparent':showLoading}"></iframe>
   </v-card-text>
  </v-card>
 </v-dialog>
 <v-menu v-model="choiceMenu.show" :position-x="choiceMenu.x" :position-y="10" style="z-index:1000">
  <v-list>
   <template v-for="(player, index) in players">
    <v-list-tile @click="setPlayer(player)" :disabled="player.id==playerId" v-bind:class="{'active-player':player.id==playerId}">
     <v-list-tile-avatar>
      <v-icon v-if="player.icon.icon">{{player.icon.icon}}</v-icon><img v-else class="svg-img" :src="player.icon.svg | svgIcon(darkUi)"></img>
     </v-list-tile-avatar>
     <v-list-tile-content><v-list-tile-title>{{player.name}}</v-list-tile-title></v-list-tile-content>
    </v-list-tile>
   </template>
  </v-list>
 </v-menu>
</div>
`,
    data() {
        return {
            show: false,
            showMenu: false,
            choiceMenu: {show:false, x:0},
            title: undefined,
            src: undefined,
            page: undefined,
            loaded:false,
            prompting:false,
            actions: [],
            customActions: [],
            history: [],
            showHome:0,
            svgCol: undefined,
            playerId: undefined
        }
    },
    mounted() {
        bus.$on('iframe.open', function(page, title, actions, showHome, playerId) {
            iframeInitInfo();
            this.title = title;
            // Delay setting URL for 50ms - otherwise get two requests, first is cancelled...
            // ...no idea why!
            if (lmsOptions.useDefaultForSettings==1 && window.innerWidth>=MIN_DEF_SETTINGS_WIDTH && page.indexOf("server/basic.html")>0) {
                page = page.replace("material/settings/server/basic.html", (LMS_DARK_LOGIC==1 && this.$store.state.darkUi ? "DarkLogic" : "Default")+"/settings/index.html");
                if (this.$store.state.player) {
                    page+="?player="+this.$store.state.player.id;
                }
            }
            setTimeout(function() {this.src = page}.bind(this), 50);
            this.page = page.indexOf("player/basic.html")>0
                            ? "player"
                            : page.indexOf("server/basic.html")>0 || page.indexOf("plugins/Extensions/settings/basic.html")>0
                                ? "server"
                                : page.indexOf("Default/settings/index.html")>0
                                    ? "dserver"
                                    : page.indexOf("DarkLogic/settings/index.html")>0
                                        ? "dlserver"
                                        : page.startsWith("plugins/") && (page.indexOf("?player=")>0 || page.indexOf("&player=")>0)
                                            ? "extras"
                                            : page == '/material/html/docs/index.html'
                                                ? "lms" // tech info, or 'extra' entry
                                                : page == '/material/html/material-skin/index.html'
                                                    ? "help"
                                                    : "other";
            this.show = true;
            this.showMenu = false;
            this.choiceMenu = {show:false, x:0}
            this.loaded = false;
            this.startLoadTimer(page.indexOf("plugins/Extensions/settings/basic.html")>=0 ? "SETUP_PLUGINS" : undefined);
            this.actions = undefined==actions ? [] : actions;
            this.customActions = getCustomActions(this.page+"-dialog", this.$store.state.unlockAll);
            this.history = [];
            this.showHome = showHome;
            this.svgCol = this.darkUi ? LMS_DARK_SVG : LMS_LIGHT_SVG;
            this.playerId = playerId;
            if (undefined==this.playerId && 'extras'==this.page) {
                let parts = page.split("player=");
                if (parts.length==2) {
                    this.playerId = parts[1].substring(0, 17);
                }
            }
        }.bind(this));
        bus.$on('iframe-loaded', function(val, settingsPage) {
            this.loaded = val;
            iframeInfo.initialLoad = false;
            if (val) {
                this.stopLoadTimer();
            } else {
                this.startLoadTimer(settingsPage);
            }
        }.bind(this));
        bus.$on('iframe-prompting', function(val) {
            this.prompting = val;
        }.bind(this));
        bus.$on('iframe-href', function(ref, addToHistory, clearHistoryOf) {
            if (ref.startsWith("javascript:")) {
                return;
            }
            if (ref.startsWith("https://") || (ref.startsWith("http://") && !ref.startsWith('http://'+window.location.hostname+':'+window.location.port+'/'))) {
                return;
            }
            if (undefined!=clearHistoryOf) {
                for (let idx=this.history.length-1; idx>=0; --idx) {
                    if (!this.history[idx].startsWith(clearHistoryOf) && !("/"+this.history[idx]).startsWith(clearHistoryOf)) {
                        break;
                    }
                    this.history.pop();
                }
            } else if (undefined==addToHistory || addToHistory) {
                this.history.push(this.src);
            }
            this.src = ref;
        }.bind(this));
        bus.$on('iframe-close', function() {
            this.close();
        }.bind(this));
        bus.$on('noPlayers', function() {
            this.close();
        }.bind(this));
        bus.$on('closeDialog', function(dlg) {
            if (dlg == 'iframe') {
                this.close();
            }
        }.bind(this));
        bus.$on('windowHeightChanged', function() {
            if (this.show && undefined!=iframeInfo.content) {
                let vh = window.innerHeight * 0.01;
                iframeInfo.content.documentElement.style.setProperty('--vh', `${vh}px`);
            }
        }.bind(this));
        bus.$on('colorChanged', function() {
            if (this.show && LMS_PAGES.has(this.page)) {
                copyVars(document.getElementById("embeddedIframe"));
            }
        }.bind(this));
    },
    methods: {
        startLoadTimer(settingsPage) {
            let timeout = undefined!=settingsPage && SLOW_PAGES.has(settingsPage) ? 4000 : 500;
            this.stopLoadTimer();
            this.loadTimer = setTimeout(function() {
                this.loadTimer = undefined;
                this.loaded = true;
            }.bind(this), timeout);
        },
        stopLoadTimer() {
            if (this.loadTimer) {
                clearTimeout(this.loadTimer);
                this.loadTimer = undefined;
            }
        },
        goBack(longpress) {
            if (!this.show) {
                return;
            }
            if (longpress && this.showHome) {
                this.goHome();
                return;
            }
            if (this.history.length<1) {
                this.close();
            } else {
                this.loaded = false;
                this.startLoadTimer();
                this.src = this.history.pop();
            }
        },
        goHome() {
            if (!this.close()) {
                return;
            }
            if (IFRAME_HOME_CLOSES_DIALOGS==this.showHome) {
                this.$store.commit('closeAllDialogs', true);
            } else {
                bus.$emit('browse-home');
            }
        },
        close() {
            if (iframeInfo.settingModified) {
                confirm(i18n("Some settings were changed. Do you want to save them?"), i18n('Save'), i18n('Cancel'), i18n('Discard')).then(res => {
                    if (0==res) { // Cancel
                        return;
                    }
                    if (1==res) { // Save
                        document.getElementById("embeddedIframe").contentDocument.forms.settingsForm.submit();
                    }
                    setTimeout(function() {
                        iframeInfo.settingModified = false;
                        this.close();
                    }.bind(this), 100);
                });
                return;
            }

            this.show = false;
            this.showMenu = false;
            this.choiceMenu.show = false;
            this.history = [];
            this.src = undefined;
            iframeInfo.content=undefined;
            bus.$emit('iframeClosed', this.page=='player');
            if (this.page=='server' || this.page=='dserver' || this.page=='dlserver') {
                if (LMS_VERSION>=80400) {
                    bus.$emit('refreshServerStatus');
                } else {
                    bus.$emit('checkForUpdates');
                }
            }
        },
        i18n(str, arg) {
            if (this.show) {
                return i18n(str, arg);
            } else {
                return str;
            }
        },
        doAction(act, event) {
            storeClickOrTouchPos(event);
            if (act.link) {
                if (act.follow) {
                    this.history.push(this.src);
                    this.src = act.link;
                } else {
                    bus.$emit('dlg.open', 'iframe', act.link, act.text, undefined, IFRAME_HOME_CLOSES_DIALOGS);
                }
            } else {
                confirm(act.text, act.confirm).then(res => {
                    if (res) {
                        lmsCommand("server"==this.page || "dserver"==this.page || "dlserver"==this.page ? "" : this.$store.state.player.id, act.cmd);
                        this.close();
                    }
                });
            }
        },
        doCustomAction(action, player) {
            performCustomAction(action, player);
        },
        openChoiceMenu(event) {
            this.choiceMenu={show:true, x:event.clientX};
        },
        setPlayer(player) {
            if (player.id==this.playerId) {
                return;
            }
            let parts = this.title.split(SEPARATOR);
            parts[1]=player.name;
            this.title=parts.join(SEPARATOR);
            this.src = this.src.replace(this.playerId, player.id);
            this.show = true;
            this.choiceMenu = {show:false, x:this.choiceMenu.x};
            this.loaded = false;
            this.startLoadTimer();
            this.history = [];
            this.playerId = player.id;
            if (this.page=='extras') {
                this.$store.commit('setPlayer', this.playerId);
            }
        },
        mouseDown(ev) {
            toolbarMouseDown(ev);
        }
    },
    computed: {
        player() {
            return this.$store.state.player
        },
        darkUi () {
            return this.$store.state.darkUi
        },
        coloredToolbars() {
            return this.$store.state.coloredToolbars
        },
        homeButton() {
            return this.$store.state.homeButton
        },
        players() {
            return this.$store.state.players
        },
        numPlayers() {
            return this.$store.state.players ? this.$store.state.players.length : 0
        },
        showLoading() {
            return LMS_VERSION>=90000 && !this.loaded && !this.prompting
        },
        haveCustomActions() {
            return undefined!=this.customActions && this.customActions.length>0
        }
    },
    filters: {
        svgIcon: function (name, dark) {
            return "/material/svg/"+name+"?c="+(dark ? LMS_DARK_SVG : LMS_LIGHT_SVG)+"&r="+LMS_MATERIAL_REVISION;
        }
    },
    watch: {
        'show': function(val) {
            this.$store.commit('dialogOpen', {name:'iframe', shown:val});
        },
        'choiceMenu.show': function(val) {
            this.$store.commit('menuVisible', {name:'iframe-choice', shown:val});
        }
    }
})
