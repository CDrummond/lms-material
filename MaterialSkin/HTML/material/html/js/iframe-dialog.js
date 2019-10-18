/**
 * LMS-Material
 *
 * Copyright (c) 2018-2019 Craig Drummond <craig.p.drummond@gmail.com>
 * MIT license.
 */

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
            href.indexOf("command=playlist&subcommand=addtracks&track.id")>0) {
            var parts = href.split("&");
            var cmd = ["playlistcontrol"];
            for (var i=0, len=parts.length; i<len; ++i) {
                if (parts[i].startsWith("subcommand")) {
                    cmd.push("addtracks"==parts[i].split("=")[1] ? "cmd:add" : "cmd:load");
                } else if (parts[i].startsWith("track.id")) {
                    cmd.push("track_id:"+parts[i].split("=")[1]);
                }
            }
            cmd.push("library_id:"+LMS_DEFAULT_LIBRARY);
            bus.$emit("search-action", "playlist", cmd);
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
            bus.$emit("search-action", "playlist", cmd);
            e.preventDefault();
        } else if (href.indexOf("songinfo.html?item=")>0) {
            var id = href.split("item=")[1].split("&")[0];
            bus.$emit("search-action", "info", id, target.textContent);
            e.preventDefault();
        } else if (href.indexOf("clicmd=browselibrary+items&mode=albums")>0) {
            var id = href.split("artist_id=")[1].split("&")[0];
            var title = decodeURIComponent(href.split("linktitle=Artist%20(")[1].split(")&")[0]);
            bus.$emit("search-action", "browse", {command:["albums"], params:["artist_id:"+id, "tags:jlys", SORT_KEY+ARTIST_ALBUM_SORT_PLACEHOLDER, "library_id:"+LMS_DEFAULT_LIBRARY]}, title);
            e.preventDefault();
        } else if (href.indexOf("clicmd=browselibrary+items&mode=tracks")>0) {
            var id = href.split("album_id=")[1].split("&")[0];
            var title = decodeURIComponent(href.split("linktitle=Album%20(")[1].split(")&")[0]);
            bus.$emit("search-action", "browse", {command:["tracks"], params:["album_id:"+id, TRACK_TAGS, SORT_KEY+"tracknum", "library_id:"+LMS_DEFAULT_LIBRARY]}, title);
            e.preventDefault();
        }
    }
    bus.$emit('iframe-loaded');
}

function hideClassicSkinElems(page) {
    if (!page) {
        return;
    }
    var iframe = document.getElementById("classicSkinIframe");
    if (iframe) {
        if ('player'==page) {
            var cssLink = iframe.contentDocument.createElement("link");
            cssLink.href = "/material/html/css/classic-skin-mods-player.css?r=" + LMS_MATERIAL_REVISION;
            cssLink.rel = "stylesheet";
            cssLink.type = "text/css";
            iframe.contentDocument.head.appendChild(cssLink);
        } else if ('search'==page) {
            if (iframe.contentDocument.addEventListener) {
                iframe.contentDocument.addEventListener('click', clickHandler);
            } else if (iframe.contentDocument.attachEvent) {
                iframe.contentDocument.attachEvent('onclick', clickHandler);
            }
        }
    }
}

Vue.component('lms-iframe-dialog', {
    template: `
<div>
 <v-dialog v-model="show" v-if="show" scrollable fullscreen>
  <v-card>
   <v-card-title class="settings-title">
    <v-toolbar color="primary" dark app class="lms-toolbar">
     <v-btn flat icon @click.native="close"><v-icon>arrow_back</v-icon></v-btn>
     <v-toolbar-title>{{title}}</v-toolbar-title>
    </v-toolbar>
   </v-card-title>
   <v-card-text class="embedded-page">
    <div v-if="!loaded" style="width:100%;padding-top:64px;display:flex;justify-content:center;font-size:18px">{{i18n('Loading...')}}</div>
    <iframe id="classicSkinIframe" v-on:load="hideClassicSkinElems(page)" :src="src" frameborder="0"></iframe>
   </v-card-text>
  </v-card>
 </v-dialog>
 <v-snackbar v-model="snackbar.show" :multi-line="true" :timeout="2500" top>{{ snackbar.msg }}</v-snackbar>
</div>
`,
    props: [ 'desktop' ],
    data() {
        return {
            show: false,
            title: undefined,
            src: undefined,
            page: undefined,
            snackbar:{show:false, msg:undefined},
            loaded:false
        }
    },
    mounted() {
        bus.$on('iframe.open', function(page, title) {
            this.title = title;
            this.src = page;
            this.page = page.indexOf("player/basic.html")>0 ? "player" : page.indexOf("advanced_search.html")>0 ? "search" : "other";
            this.show = true;
            this.loaded = false;
        }.bind(this));
            bus.$on('iframe-loaded', function() {
            this.loaded = true;
        }.bind(this));
        bus.$on('noPlayers', function() {
            this.close();
        }.bind(this));
        bus.$on('esc', function() {
            if (this.$store.state.activeDialog == 'iframe') {
                this.close();
            }
        }.bind(this));
        bus.$on('search-action', function(cmd, params, title) {
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
                        if (!this.desktop) {
                            this.$store.commit('setPage', 'now-playing');
                        }
                        this.close();
                    } else if ("cmd:add"==params[1]) {
                        this.snackbar={show:true, msg:i18n("Appended track to the play queue")};
                    } else {
                        this.snackbar={show:true, msg:i18n("Appended all tracks to the play queue")};
                    }
                }).catch(err => {
                    logError(err, command.command);
                });
            }
        }.bind(this));
    },
    methods: {
        close() {
            this.show=false;
            bus.$emit('iframeClosed', this.isPlayer);
        },
        i18n(str, arg) {
            if (this.show && this.transparent) {
                return i18n(str, arg);
            } else {
                return str;
            }
        }
    },
    watch: {
        'show': function(val) {
            this.$store.commit('dialogOpen', {name:'iframe', shown:val});
        }
    }
})
