/**
 * LMS-Material
 *
 * Copyright (c) 2018-2023 Craig Drummond <craig.p.drummond@gmail.com>
 * MIT license.
 */
'use strict';

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
                    if (imgList[i].src.indexOf(OTHER_EXT[e]+"?svg=")>0) {
                        let url = undefined;
                        let path = imgList[i].src;
                        let pluginPath = "";
                        if (imgList[i].src.startsWith("http:")) {
                            url = new URL(path);
                            path = url.pathname;
                            pluginPath = "plugins/"+url.search.split("=")[1]+"/html/images/";
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
                }
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
        trackInfo:iframeTrackInfo
    }
}

var iframeMenuOpen = false;
function iframeClickHandler(e) {
    if (iframeMenuOpen) {
        bus.$emit('iframe-hideMenu');
    }
}

function otherClickHandler(e) {
    var target = e.target || e.srcElement;
    var href = undefined;
    if (target.tagName === 'A') {
        href = target.getAttribute('href');
    } else if (target.tagName === 'SPAN' || target.tagName === 'IMG') {
        href = target.parentElement.getAttribute('href');
    }
    if (href && !href.startsWith('#')) {
        bus.$emit('iframe-href', href);
    }
    iframeClickHandler(e);
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

function getElementsByClassName(elem, tagName, clazz){
	var elems = (tagName == "*" && elem.all) ? elem.all : elem.getElementsByTagName(tagName);
	var found = new Array();
	var re = new RegExp("(^|\\s)" + clazz.replace(/\-/g, "\\-") + "(\\s|$)");
	for (var i=0, len=elems.length; i<len; i++) {
		if (re.test(elems[i].className)) {
			found.push(elems[i]);
		}
	}
	return found;
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

var iframeInfo = {
  content:undefined,
  action:undefined,
  actionCheckInterval: undefined,
  actionChecks: 0
};

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

function selectChanged() {
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

function copyVar(iframe, name) {
    let v = getComputedStyle(document.documentElement).getPropertyValue(name);
    if (undefined!=v) {
        iframe.contentWindow.document.documentElement.style.setProperty(name, v);
    }
}

function applyModifications(page, textCol) {
    if (!page) {
        return;
    }
    var iframe = document.getElementById("embeddedIframe");
    if (iframe && iframe.contentDocument) {
        iframe.contentDocument.bus = bus;
        var content = iframe.contentDocument;
        iframeInfo.content = content;
        if (undefined==content) {
            return;
        }

        copyVar(iframe, '--primary-color');
        copyVar(iframe, '--accent-color');
        copyVar(iframe, '--pq-current-color');
        content.documentElement.getElementsByTagName("body")[0].classList.add(IS_MOBILE ? "msk-is-touch" : "msk-is-non-touch");
        fixClassicSkinRefs(content);
        remapClassicSkinIcons(content, textCol);
        addHooks(content);

        let toHide = undefined;
        if ('player'==page) {
            toHide = new Set(['ALARM', 'PLUGIN_DSTM']);
        }

        if ('server'==page || 'player'==page) {
            var selector=content.getElementById("choose_setting");
            if (undefined!=selector) {
                selector.addEventListener("change", selectChanged);
                selectChanged();
            }
        }

        if (content) {
            if (content.addEventListener) {
                content.addEventListener('click', 'other'==page || 'lms'==page ? otherClickHandler : iframeClickHandler);
            } else if (content.attachEvent) {
                content.attachEvent('onclick', 'other'==page || 'lms'==page ? otherClickHandler : iframeClickHandler);
            }
        }

        if (undefined!=toHide) {
            var select = content.getElementById("choose_setting");
            if (undefined!=select) {
                for (let i=select.length-1; i>=0; i--) {
                    if (toHide.has(select.options[i].value)) {
                        select.remove(i);
                    }
                }
            }
        }
        if ('player'==page || 'server'==page) {
            // Set --vh as this is used to fix size of main settings frame, so that we can
            // correctly set its position, etc, to be consistent between mobile and desktop.
            // Previously desktop had a big padding above view selector.

            // Work-around 100vh behaviour in mobile chrome
            // See https://css-tricks.com/the-trick-to-viewport-units-on-mobile/
            let vh = window.innerHeight * 0.01;
            content.documentElement.style.setProperty('--vh', `${vh}px`);

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
                                                    bus.$emit('iframe-showMessage', i18n('Server is being restarted.'));
                                                }).catch(err => {
                                                    bus.$emit('iframe-showMessage', i18n('Server is being restarted.'));
                                                });
                                            } else if (href.startsWith("https://") || (href.startsWith("http://") && !href.startsWith('http://'+window.location.hostname+':'+window.location.port+'/'))) {
                                                openWindow(href);
                                            } else {
                                                bus.$emit('iframe-href', href, false);
                                            }
                                        }
                                    });
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
                        bus.$emit('iframe-showMessage', msg);
                    }
                }
            }
        }
    }
    bus.$emit('iframe-loaded');
}

Vue.component('lms-iframe-dialog', {
    template: `
<div>
 <v-dialog v-model="show" v-if="show" persistent no-click-animation scrollable fullscreen>
  <v-card>
   <v-card-title class="settings-title">
    <v-toolbar app-data class="dialog-toolbar" @mousedown="mouseDown" id="iframe-toolbar">
     <div class="drag-area-left"></div>
     <v-btn flat icon v-longpress:stop="goBack" :title="ttShortcutStr(i18n('Go back'), 'esc')"><v-icon>arrow_back</v-icon></v-btn>
     <v-btn v-if="showHome && homeButton" flat icon @click="goHome" :title="ttShortcutStr(i18n('Go home'), 'home')"><v-icon>home</v-icon></v-btn>
     <v-toolbar-title v-if="page=='player' && numPlayers>1" @click="openChoiceMenu" class="pointer">{{title}}</v-toolbar-title>
     <v-toolbar-title v-else>{{title}}</v-toolbar-title>
     <v-spacer class="drag-area"></v-spacer>
     <v-menu bottom left v-model="showMenu" v-if="actions.length>0 || (customActions && customActions.length>0)">
      <v-btn icon slot="activator"><v-icon>more_vert</v-icon></v-btn>
      <v-list>
       <template v-for="(item, index) in actions">
        <v-list-tile @click="doAction(item)">
         <v-list-tile-avatar><v-icon v-if="item.icon">{{item.icon}}</v-icon></v-list-tile-avatar>
         <v-list-tile-content><v-list-tile-title>{{item.title}}</v-list-tile-title></v-list-tile-content>
        </v-list-tile>
       </template>
       <v-divider v-if="actions.length>0 && (customActions && customActions.length>0)"></v-divider>
       <template v-if="customActions && customActions.length>0" v-for="(action, index) in customActions">
        <v-list-tile @click="doCustomAction(action, player)">
         <v-list-tile-avatar><v-icon v-if="action.icon">{{action.icon}}</v-icon><img v-else-if="action.svg" class="svg-img" :src="action.svg | svgIcon(darkUi)"></img></v-list-tile-avatar>
         <v-list-tile-content><v-list-tile-title>{{action.title}}</v-list-tile-title></v-list-tile-content>
        </v-list-tile>
       </template>
      </v-list>
     </v-menu>
     <div class="drag-area-right"></div>
     <lms-windowcontrols v-if="queryParams.nativeTitlebar"></lms-windowcontrols>
    </v-toolbar>
   </v-card-title>
   <v-card-text class="embedded-page">
    <div v-if="!loaded" style="width:100%;padding-top:64px;display:flex;justify-content:center;font-size:18px">{{i18n('Loading...')}}</div>
    <iframe id="embeddedIframe" v-on:load="applyModifications(page, textCol)" :src="src" frameborder="0" v-bind:class="{'iframe-text':'other'==page}"></iframe>
   </v-card-text>
  </v-card>
 </v-dialog>
 <v-snackbar v-model="snackbar.show" :multi-line="true" :timeout="2500" top>{{ snackbar.msg }}</v-snackbar>
 <v-menu v-model="choiceMenu.show" :position-x="choiceMenu.x" :position-y="10" style="z-index:1000">
  <v-list>
   <template v-for="(player, index) in players">
    <v-list-tile @click="setPlayer(player)" :disabled="player.id==playerId" v-bind:class="{'disabled':player.id==playerId}">
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
            snackbar:{show:false, msg:undefined},
            loaded:false,
            actions: [],
            customActions: [],
            history: [],
            showHome:0,
            textCol: undefined,
            playerId: undefined
        }
    },
    mounted() {
        bus.$on('iframe.open', function(page, title, actions, showHome, playerId) {
            this.title = title;
            this.src = page;
            this.page = page.indexOf("player/basic.html")>0
                            ? "player"
                            : page.indexOf("server/basic.html")>0 || page.indexOf("plugins/Extensions/settings/basic.html")>0
                                ? "server"
                                : (page == '/material/html/docs/index.html') || (page.startsWith("plugins/") && (page.indexOf("?player=")>0 || page.indexOf("&player=")>0))
                                    ? "lms" // tech info, or 'extra' entry
                                    : page == '/material/html/material-skin/index.html'
                                        ? "help"
                                        : "other";
            this.show = true;
            this.showMenu = false;
            this.choiceMenu = {show:false, x:0}
            this.loaded = false;
            this.actions = undefined==actions ? [] : actions;
            this.customActions = getCustomActions(this.page+"-dialog", this.$store.state.unlockAll);
            this.history = [];
            this.showHome = showHome;
            this.textCol = getComputedStyle(document.documentElement).getPropertyValue('--text-color').substring(1);
            this.playerId = playerId;
        }.bind(this));
        bus.$on('iframe-loaded', function() {
            this.loaded = true;
        }.bind(this));
        bus.$on('iframe-href', function(ref, addToHistory) {
            if (ref.startsWith("javascript:")) {
                return;
            }
            if (ref.startsWith("http://") || ref.startsWith("https://")) {
                return;
            }
            if (undefined==addToHistory || addToHistory) {
                this.history.push(this.src);
            }
            this.src = ref;
        }.bind(this));
        bus.$on('iframe-close', function() {
            this.close();
        }.bind(this));
        bus.$on('iframe-showMessage', function(msg) {
            this.snackbar={show:true, msg:msg};
        }.bind(this));
        bus.$on('iframe-hideMenu', function() {
            this.showMenu = false;
        }.bind(this));
        bus.$on('noPlayers', function() {
            this.close();
        }.bind(this));
        bus.$on('closeMenu', function() {
            this.showMenu = false;
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
    },
    methods: {
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
                this.src = this.history.pop();
            }
        },
        goHome() {
            this.close();
            if (IFRAME_HOME_CLOSES_DIALOGS==this.showHome) {
                this.$store.commit('closeAllDialogs', true);
            } else {
                bus.$emit('browse-home');
            }
        },
        close() {
            this.show=0;
            this.showMenu = false;
            this.history=[];
            iframeInfo.content=undefined;
            bus.$emit('iframeClosed', this.isPlayer);
            if (this.page=='server') {
                bus.$emit('checkForUpdates');
            }
        },
        i18n(str, arg) {
            if (this.show) {
                return i18n(str, arg);
            } else {
                return str;
            }
        },
        doAction(act) {
            confirm(act.text, act.confirm).then(res => {
                if (res) {
                    lmsCommand("server"==this.page ? "" : this.$store.state.player.id, act.cmd);
                    this.close();
                }
            });
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
            this.showMenu = false;
            this.choiceMenu = {show:false, x:this.choiceMenu.x}
            this.loaded = false;
            this.history = [];
            this.textCol = getComputedStyle(document.documentElement).getPropertyValue('--text-color').substring(1);
            this.playerId = player.id;
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
        homeButton() {
            return this.$store.state.homeButton
        },
        players() {
            return this.$store.state.players
        },
        numPlayers() {
            return this.$store.state.players ? this.$store.state.players.length : 0
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
        'showMenu': function(val) {
            iframeMenuOpen = val;
            this.$store.commit('menuVisible', {name:'iframe', shown:val});
        },
        'choiceMenu.show': function(val) {
            this.$store.commit('menuVisible', {name:'iframe-choice', shown:val});
        }
    }
})
