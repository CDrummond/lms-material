/**
 * LMS-Material
 *
 * Copyright (c) 2018-2020 Craig Drummond <craig.p.drummond@gmail.com>
 * MIT license.
 */
'use strict';

function clickHandler(e) {
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

function fixSearchControls(elem) {
    var elems = elem.querySelectorAll('.browsedbLeftControls a');
    if (undefined!=elems) {
        for (var i=0, len=elems.length; i<len; ++i) {
            if (undefined==elems[i].href || elems[i].href.indexOf("command=playlist&subcommand=")<0) {
                elems[i].style.display="none";
            } else if (elems[i].href.indexOf("subcommand=addtracks")>0) {
                elems[i].href=elems[i].href.replace("subcommand=addtracks", "subcommand=loadtracks");
                elems[i].classList.add("loadtracks");
            } else if (elems[i].href.indexOf("subcommand=loadtracks")>0) {
                elems[i].href=elems[i].href.replace("subcommand=loadtracks", "subcommand=addtracks");
                elems[i].classList.add("addtracks");
            }
        }
    }
}

function hideClassicSkinElems(page) {
    if (!page) {
        return;
    }
    var iframe = document.getElementById("embeddedIframe");
    if (iframe) {
        let toHide = undefined;
        if ('player'==page) {
            toHide = new Set(['ALARM', 'PLUGIN_DSTM']);
        }
        if ('search'==page) {
            if (iframe.contentDocument.addEventListener) {
                iframe.contentDocument.addEventListener('click', clickHandler);
            } else if (iframe.contentDocument.attachEvent) {
                iframe.contentDocument.attachEvent('onclick', clickHandler);
            }

            var res = iframe.contentDocument.getElementById("browsedbList");
            if (res) {
                res.scrollIntoView(true);
                fixSearchControls(res);
            }
        }
        if (undefined!=toHide) {
            var select = iframe.contentDocument.getElementById("choose_setting");
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
     <v-btn icon @click.native="close" :title="i18n('Close')"><v-icon>arrow_back</v-icon></v-btn>
     <v-toolbar-title>{{title}}</v-toolbar-title>
     <v-spacer></v-spacer>
     <v-menu bottom left v-model="showMenu" v-if="actions.length>0 || (customActions && customActions.length>0)">
      <template v-slot:activator="{ on }"><v-btn icon v-on="on"><v-icon>more_vert</v-icon></v-btn></template>
      <v-list>
       <template v-for="(item, index) in actions">
        <v-list-item @click="doAction(item)">
         <v-list-item-icon v-if="menuIcons"><v-icon v-if="item.icon">{{item.icon}}</v-icon></v-list-item-icon>
         <v-list-item-content><v-list-item-title>{{item.title}}</v-list-item-title></v-list-item-content>
        </v-list-item>
       </template>
       <v-divider v-if="actions.length>0 && (customActions && customActions.length>0)"></v-divider>
       <template v-if="customActions && customActions.length>0" v-for="(action, index) in customActions">
        <v-list-item @click="doCustomAction(action, player)">
         <v-list-item-icon v-if="menuIcons"><v-icon v-if="action.icon">{{action.icon}}</v-icon><img v-else-if="action.svg" class="svg-img" :src="action.svg | svgIcon(darkUi)"></img></v-list-item-icon>
         <v-list-item-content><v-list-item-title>{{action.title}}</v-list-item-title></v-list-item-content>
        </v-list-item>
       </template>
      </v-list>
     </v-menu>
    </v-toolbar>
   </v-card-title>
   <v-card-text class="embedded-page">
    <div v-if="!loaded" style="width:100%;padding-top:64px;display:flex;justify-content:center;font-size:18px">{{i18n('Loading...')}}</div>
    <iframe id="embeddedIframe" v-on:load="hideClassicSkinElems(page)" :src="src" frameborder="0" v-bind:class="{'iframe-text':'other'==page}"></iframe>
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
            customActions: []
        }
    },
    mounted() {
        bus.$on('iframe.open', function(page, title, actions) {
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
        }.bind(this));
            bus.$on('iframe-loaded', function() {
            this.loaded = true;
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
