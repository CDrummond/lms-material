/**
 * LMS-Material
 *
 * Copyright (c) 2018-2019 Craig Drummond <craig.p.drummond@gmail.com>
 * MIT license.
 */

function insertCss(doc, path) {
    var cssLink = doc.createElement("link");
    cssLink.href = path;
    cssLink.rel = "stylesheet";
    cssLink.type = "text/css";
    doc.head.appendChild(cssLink);
}

function hideClassicSkinElems(dark, isPlayer) {
    var iframe = document.getElementById("classicSkinIframe");
    if (iframe) {
        insertCss(iframe.contentDocument, "../../../material/html/font/font.css");
        insertCss(iframe.contentDocument, "../../../material/html/css/classic-skin-mods.css?r=" + LMS_MATERIAL_REVISION);
        insertCss(iframe.contentDocument, "../../../material/html/css/classic-skin-mods-"+(dark ? "dark" : "light")+".css?r=" + LMS_MATERIAL_REVISION);
        if (isPlayer) {
            insertCss(iframe.contentDocument, "../../../material/html/css/classic-skin-mods-player.css?r=" + LMS_MATERIAL_REVISION);
        }
    }
    bus.$emit('iframe-css-set');
}

Vue.component('lms-iframe-dialog', {
    template: `
<div>
 <v-dialog v-model="show" v-if="show" scrollable fullscreen persistent>
  <v-card>
   <v-card-title class="settings-title">
    <v-toolbar color="primary" dark app class="lms-toolbar">
     <v-btn flat icon @click.native="close"><v-icon>arrow_back</v-icon></v-btn>
     <v-toolbar-title>{{title}}</v-toolbar-title>
    </v-toolbar>
   </v-card-title>
   <v-card-text class="embedded-page">
    <div v-if="transparent" style="width:100%; height:100%; display: flex; justify-content: center; align-items: center; position:absolute; top:0px; left:0px; z-index:100;">
     <p>{{i18n("Loading...")}}</p>
    </div>
    <iframe v-if="show" id="classicSkinIframe" :src="src" v-on:load="hideClassicSkinElems(darkUi, isPlayer)" v-bind:class="{'transparent':transparent}" frameborder="0"></iframe>
   </v-card-text>
  </v-card>
 </v-dialog>
</div>
`,
    props: [],
    data() {
        return {
            show: false,
            title: undefined,
            src: undefined,
            isPlayer: false,
            transparent: true
        }
    },
    mounted() {
        bus.$on('iframe.open', function(page, title) {
            this.title = title;
            this.src = page;
            this.isPlayer = page.indexOf("player/basic.html")>0;
            this.show = true;
            this.transparent = true;
        }.bind(this));
        bus.$on('noPlayers', function() {
            this.close();
        }.bind(this));
        bus.$on('esc', function() {
            if (this.$store.state.activeDialog == 'iframe') {
                this.close();
            }
        }.bind(this));
        bus.$on('iframe-css-set', function() {
            setTimeout(function () {
                this.transparent = false;
            }.bind(this), 100);
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
    computed: {
        darkUi () {
            return this.$store.state.darkUi
        }
    },
    watch: {
        'show': function(val) {
            this.$store.commit('dialogOpen', {name:'iframe', shown:val});
        }
    }
})
