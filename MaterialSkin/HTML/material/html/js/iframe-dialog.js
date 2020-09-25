/**
 * LMS-Material
 *
 * Copyright (c) 2018-2020 Craig Drummond <craig.p.drummond@gmail.com>
 * MIT license.
 */
'use strict';

function searchClickHandler(e) {
    var target = e.target || e.srcElement;
    var href = undefined;
    if (target.tagName === 'A') {
        href = target.getAttribute('href');
    } else if (target.tagName === 'SPAN' || target.tagName === 'IMG') {
        href = target.parentElement.getAttribute('href');
    }

    if (undefined!=href && !href.startsWith("advanced_search.html")) {
        if (href.indexOf("command=playlist&subcommand=loadtracks&track.id")>0 ||
            href.indexOf("command=playlist&subcommand=addtracks&track.id")>0 ||
            href.indexOf("command=playlist&subcommand=loadtracks&album.id")>0 ||
            href.indexOf("command=playlist&subcommand=addtracks&album.id")>0) {
            var parts = href.split("&");
            var cmd = ["playlistcontrol"];
            var album = false;
            for (var i=0, len=parts.length; i<len; ++i) {
                if (parts[i].startsWith("subcommand")) {
                    cmd.push("addtracks"==parts[i].split("=")[1] ? "cmd:add" : "cmd:load");
                } else if (parts[i].startsWith("track.id")) {
                    cmd.push("track_id:"+parts[i].split("=")[1]);
                } else if (parts[i].startsWith("album.id")) {
                    cmd.push("album_id:"+parts[i].split("=")[1]);
                    album = true;
                }
            }
            cmd.push("library_id:"+LMS_DEFAULT_LIBRARY);
            bus.$emit("search-action", "playlist", cmd, undefined, album);
            e.preventDefault();
        } else if (href.indexOf("command=playlist&subcommand=loadtracks&searchRef")>0 ||
                   href.indexOf("command=playlist&subcommand=addtracks&searchRef")>0) {
            var parts = href.split("&");
            var cmd = ["playlist"];
            for (var i=0, len=parts.length; i<len; ++i) {
                if (parts[i].startsWith("subcommand")) {
                    cmd.push(parts[i].split("=")[1]);
                } else if (parts[i].startsWith("searchRef")) {
                    cmd.push(parts[i]);
                }
            }
            cmd.push("library_id:"+LMS_DEFAULT_LIBRARY);
            bus.$emit("search-action", "playlist", cmd, undefined, href.indexOf("searchRef=searchAlbumsResults")>0);
            e.preventDefault();
        } else if (href.indexOf("songinfo.html?item=")>0) {
            var id = href.split("item=")[1].split("&")[0];
            bus.$emit("search-action", "info", id, target.textContent);
            e.preventDefault();
        } else if (href.indexOf("clicmd=browselibrary+items&mode=albums")>0) {
            var id = href.split("artist_id=")[1].split("&")[0];
            var title = decodeURIComponent(href.split("linktitle=Artist%20(")[1].split(")&")[0]);
            bus.$emit("search-action", "browse", {command:["albums"], params:["artist_id:"+id, ARTIST_ALBUM_TAGS, SORT_KEY+ARTIST_ALBUM_SORT_PLACEHOLDER, "library_id:"+LMS_DEFAULT_LIBRARY]}, title);
            e.preventDefault();
        } else if (href.indexOf("clicmd=browselibrary+items&mode=tracks")>0) {
            var id = href.split("album_id=")[1].split("&")[0];
            var title = decodeURIComponent(href.split("linktitle=Album%20(")[1].split(")&")[0]);
            bus.$emit("search-action", "browse", {command:["tracks"], params:["album_id:"+id, TRACK_TAGS, SORT_KEY+"tracknum", "library_id:"+LMS_DEFAULT_LIBRARY]}, title);
            e.preventDefault();
        }
    }
}

function remapClassicSkinIcons(doc, col) {
    const ICONS = ["play", "add", "edit", "favorite", "favorite_remove", "delete", "delete_white", "first", "last", "up", "down", "mix", "mmix", "next", "prev"];
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

function otherClickHandler(e) {
    var target = e.target || e.srcElement;
    var href = undefined;
    if (target.tagName === 'A') {
        href = target.getAttribute('href');
    } else if (target.tagName === 'SPAN' || target.tagName === 'IMG') {
        href = target.parentElement.getAttribute('href');
    }
    if (href) {
        bus.$emit('iframe-href', href);
    }
}

function hideClassicSkinElems(page, textCol) {
    if (!page) {
        return;
    }
    var iframe = document.getElementById("embeddedIframe");
    if (iframe) {
        var content = iframe.contentDocument;
        fixClassicSkinRefs(content);
        remapClassicSkinIcons(content, textCol);

        let toHide = undefined;
        if ('player'==page) {
            toHide = new Set(['ALARM', 'PLUGIN_DSTM']);
        }
        if ('search'==page) {
            if (content.addEventListener) {
                content.addEventListener('click', searchClickHandler);
            } else if (content.attachEvent) {
                content.attachEvent('onclick', searchClickHandler);
            }
        } else if ('other'==page) {
            if (content) {
                if (content.addEventListener) {
                    content.addEventListener('click', otherClickHandler);
                } else if (content.attachEvent) {
                    content.attachEvent('onclick', otherClickHandler);
                }
            } else if (iframe.contentWindow) {
                // Text files?
                iframe.className="iframe-plain-text";
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
    }
    bus.$emit('iframe-loaded');
}

Vue.component('lms-iframe-dialog', {
    template: `
<div>
 <v-dialog v-model="show" v-if="show" scrollable fullscreen>
  <v-card>
   <v-card-title class="settings-title">
    <v-toolbar app-data class="dialog-toolbar">
     <v-btn flat icon v-longpress="goBack" :title="i18n('Go back')"><v-icon>arrow_back</v-icon></v-btn>
     <v-btn v-if="showHome && homeButton" flat icon @click="close(); bus.$emit('browse-home')" :title="i18n('Go home')"><v-icon>home</v-icon></v-btn>
     <v-toolbar-title>{{title}}</v-toolbar-title>
     <v-spacer></v-spacer>
     <v-menu bottom left v-model="showMenu" v-if="actions.length>0 || (customActions && customActions.length>0)">
      <v-btn icon slot="activator"><v-icon>more_vert</v-icon></v-btn>
      <v-list>
       <template v-for="(item, index) in actions">
        <v-list-tile @click="doAction(item)">
         <v-list-tile-avatar v-if="menuIcons"><v-icon v-if="item.icon">{{item.icon}}</v-icon></v-list-tile-avatar>
         <v-list-tile-content><v-list-tile-title>{{item.title}}</v-list-tile-title></v-list-tile-content>
        </v-list-tile>
       </template>
       <v-divider v-if="actions.length>0 && (customActions && customActions.length>0)"></v-divider>
       <template v-if="customActions && customActions.length>0" v-for="(action, index) in customActions">
        <v-list-tile @click="doCustomAction(action, player)">
         <v-list-tile-avatar v-if="menuIcons"><v-icon v-if="action.icon">{{action.icon}}</v-icon><img v-else-if="action.svg" class="svg-img" :src="action.svg | svgIcon(darkUi)"></img></v-list-tile-avatar>
         <v-list-tile-content><v-list-tile-title>{{action.title}}</v-list-tile-title></v-list-tile-content>
        </v-list-tile>
       </template>
      </v-list>
     </v-menu>
    </v-toolbar>
   </v-card-title>
   <v-card-text class="embedded-page">
    <div v-if="!loaded" style="width:100%;padding-top:64px;display:flex;justify-content:center;font-size:18px">{{i18n('Loading...')}}</div>
    <iframe id="embeddedIframe" v-on:load="hideClassicSkinElems(page, textCol)" :src="src" frameborder="0" v-bind:class="{'iframe-text':'other'==page}"></iframe>
   </v-card-text>
  </v-card>
 </v-dialog>
 <v-snackbar v-model="snackbar.show" :multi-line="true" :timeout="2500" top>{{ snackbar.msg }}</v-snackbar>
</div>
`,
    data() {
        return {
            show: false,
            showMenu: false,
            title: undefined,
            src: undefined,
            page: undefined,
            snackbar:{show:false, msg:undefined},
            loaded:false,
            actions: [],
            customActions: [],
            history: [],
            showHome:false,
            textCol: undefined
        }
    },
    mounted() {
        bus.$on('iframe.open', function(page, title, actions, showHome) {
            this.title = title;
            this.src = page;
            this.page = page.indexOf("player/basic.html")>0
                            ? "player"
                            : page.indexOf("server/basic.html")>0
                                ? "server"
                                : page.indexOf("advanced_search.html")>0
                                    ? "search"
                                    : "other";
            this.show = true;
            this.showMenu = false;
            this.loaded = false;
            this.actions = undefined==actions ? [] : actions;
            this.customActions = getCustomActions(this.page+"-dialog", this.$store.state.unlockAll);
            this.history = [];
            this.showHome = showHome;
            this.textCol = getComputedStyle(document.documentElement).getPropertyValue('--text-color').substring(1);
        }.bind(this));
        bus.$on('iframe-loaded', function() {
            this.loaded = true;
        }.bind(this));
        bus.$on('iframe-href', function(ref) {
            this.history.push(this.src);
            this.src = ref;
        }.bind(this));
        bus.$on('noPlayers', function() {
            this.close();
        }.bind(this));
        bus.$on('esc', function() {
            if (this.showMenu) {
                this.showMenu = false;
            } else if (this.$store.state.activeDialog == 'iframe') {
                this.close();
            }
        }.bind(this));
        bus.$on('hideMenu', function(name) {
            if (name=='iframe') {
                this.showMenu= false;
            }
        }.bind(this));
        bus.$on('search-action', function(cmd, params, title, isAlbum) {
            if ("info"==cmd) {
                bus.$emit('trackInfo', {id: "track_id:"+params, title:title}, undefined, undefined);
                this.close();
            } else if ("browse"==cmd) {
                bus.$emit(cmd, params.command, params.params, title);
                this.close();
            } else if ("playlist"==cmd) {
                lmsCommand(this.$store.state.player.id, params).then(({data}) => {
                    bus.$emit('refreshStatus');
                    if ("cmd:load"==params[1] || "loadtracks"==params[1]) {
                        if (!this.$store.state.desktopLayout) {
                            this.$store.commit('setPage', 'now-playing');
                        }
                        this.close();
                    } else if ("cmd:add"==params[1]) {
                        this.snackbar={show:true, msg:isAlbum ? i18n("Appended album to the play queue") : i18n("Appended track to the play queue")};
                    } else {
                        this.snackbar={show:true, msg:isAlbum ? i18n("Appended all albums to the play queue") : i18n("Appended all tracks to the play queue")};
                    }
                }).catch(err => {
                    logError(err);
                });
            }
        }.bind(this));
    },
    methods: {
        goBack(longpress) {
            if (longpress || this.history.length<1) {
                this.close();
            } else {
                this.loaded = false;
                this.src = this.history.pop();
            }
        },
        close() {
            this.show=false;
            this.showMenu = false;
            bus.$emit('iframeClosed', this.isPlayer);
        },
        i18n(str, arg) {
            if (this.show && this.transparent) {
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
            performCustomAction(this, action, player);
        }
    },
    computed: {
        menuIcons() {
            return this.$store.state.menuIcons
        },
        player() {
            return this.$store.state.player
        },
        darkUi () {
            return this.$store.state.darkUi
        },
        homeButton() {
            return this.$store.state.homeButton
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
            this.$store.commit('menuVisible', {name:'iframe', shown:val});
        }
    }
})
