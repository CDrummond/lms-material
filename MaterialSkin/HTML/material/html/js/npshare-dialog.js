/**
 * LMS-Material
 *
 * Copyright (c) 2018-2026 Craig Drummond <craig.p.drummond@gmail.com>
 * MIT license.
 */
'use strict';

const NP_SHARE_MARGIN   = 5;
const NP_SHARE_STD_H    = 180;
const NP_SHARE_STD_W    = 450;
const NP_SHARE_MED_H    = 300;
const NP_SHARE_MED_W    = 600;
const NP_SHARE_LARGE_H  = 400;
const NP_SHARE_LARGE_W  = 800;

function loadImage(url) {
    return new Promise(function(resolve) {
        let img = new Image();
        img.onload  = function() { resolve(img); };
        img.onerror = function() { resolve(null); };
        // Fetch as blob first to avoid CORS tainting the canvas
        fetch(url, { credentials: 'same-origin' })
            .then(function(r) { return r.blob(); })
            .then(function(blob) { img.src = URL.createObjectURL(blob); })
            .catch(function() { img.src = url; }); // fallback direct
    });
}

function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
}

function wrapText(ctx, text, maxW) {
    let words = text.split(' ');
    let lines = [], line = '';
    words.forEach(function(word) {
        let test = line ? line + ' ' + word : word;
        if (ctx.measureText(test).width > maxW && line) {
            lines.push(line);
            line = word;
        } else {
            line = test;
        }
    });
    if (line) {
        lines.push(line);
    }
    return lines;
}

function formatLines(ctx, text, maxTextWidth, fontSize, minFontSize, weight, fontSuffix) {
    if (undefined==text) {
        return {lines:[], fontSize:fontSize}
    }
    ctx.font = weight + fontSize + fontSuffix;
    let lines = wrapText(ctx, text, maxTextWidth);

    while (lines.length > 2 && fontSize > minFontSize) {
        fontSize -= 2;
        ctx.font = weight + fontSize + fontSuffix;
        lines = wrapText(ctx, text, maxTextWidth);
    }
    // Also scale down if single line is too wide
    while (lines.length === 1 && ctx.measureText(lines[0]).width > maxTextWidth && fontSize > minFontSize) {
        fontSize -= 2;
        ctx.font = weight + fontSize + fontSuffix;
        lines = wrapText(ctx, text, maxTextWidth);
    }
    return {lines:lines, fontSize:fontSize};
}

function waitForLoad(element) {
    return new Promise((resolve, reject) => {
        if (element.complete && element.naturalHeight !== 0) {
            resolve(element);
            return;
        }
        element.onload = () => resolve(element);
        element.onerror = (err) => reject(err);
    });
}

async function nowPlayingRenderToCanvas(track, artImg, isDark, size, centered, rounded) {
    const CORNER_RADIUS     = 14;
    const OVERLAY_ALPHA     = 0.45;
    const FONT_SUFFIX       = 'px Roboto, sans-serif';
    const TEXT_COLOR        = "#" + (isDark ? LMS_DARK_SVG : "000");
    const STD_WEIGHT        = '400 ';
    const EXTRA_BOLD_WEIGHT = '700 ';
    const SUB_OPACITY       = 0.7;
    const WIDTH             = 2==size ? NP_SHARE_LARGE_W : 1==size ? NP_SHARE_MED_W : NP_SHARE_STD_W;
    const HEIGHT            = 2==size ? NP_SHARE_LARGE_H : 1==size ? NP_SHARE_MED_H : NP_SHARE_STD_H;
    const MAX_ART_SIZE      = HEIGHT - (2 * NP_SHARE_MARGIN);

    let canvas = document.createElement('canvas');
    let ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    canvas.width = WIDTH*dpr; canvas.height = HEIGHT*dpr;
    ctx.scale(dpr, dpr);
    canvas.style.width = `${WIDTH}px`;
    canvas.style.height = `${HEIGHT}px`;

    if (rounded) {
        // ── Clip to rounded card ──
        roundRect(ctx, 0, 0, WIDTH, HEIGHT, CORNER_RADIUS);
        ctx.clip();
    }

    // ── 1. Full card background — blurred artwork ──
    ctx.fillStyle = isDark ? "#103030" : "#fafafa";
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    if (artImg) {
        // Draw blurred background — use ctx.filter if available (desktop), else multi-pass scale (mobile)
        let bgScale = Math.max(WIDTH / artImg.width, HEIGHT / artImg.height);

        // Multi-pass scale blur — works on all browsers including mobile
        // Use square canvases to ensure full coverage
        let sizes = [4, 8, 20, 60, 160];
        let prev = document.createElement('canvas');
        prev.width = sizes[0]; prev.height = sizes[0];
        prev.getContext('2d').drawImage(artImg, 0, 0, sizes[0], sizes[0]);
        for (let p = 1; p < sizes.length; p++) {
            let next = document.createElement('canvas');
            next.width = sizes[p]; next.height = sizes[p];
            next.getContext('2d').drawImage(prev, 0, 0, sizes[p], sizes[p]);
            prev.remove();
            prev = next;
        }
        ctx.save();
        ctx.globalAlpha = 0.9;
        ctx.drawImage(prev, 0, 0, WIDTH, HEIGHT);
        prev.remove();
        ctx.globalAlpha = 1;
        ctx.restore();
    }

    // ── 2. Dark overlay ──
    ctx.fillStyle = 'rgba(' + (isDark ? '16,16,16,' : '240,240,240,') + OVERLAY_ALPHA + ')';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    // ── 3. Clean artwork — left half, no effects, centred ──
    let usedArtW = MAX_ART_SIZE;
    if (artImg) {
        let artScale = Math.min(MAX_ART_SIZE / artImg.width, MAX_ART_SIZE / artImg.height);
        let artW = artImg.width  * artScale;
        let artH = artImg.height * artScale;
        let ax = NP_SHARE_MARGIN + (MAX_ART_SIZE - artW) / 2;
        let ay = (HEIGHT - artH) / 2;

        // Drop shadow
        ctx.save();
        ctx.shadowColor = 'rgba(0,0,0,0.9)';
        ctx.shadowBlur = 40; ctx.shadowOffsetX = 6; ctx.shadowOffsetY = 6;
        roundRect(ctx, ax, ay, artW, artH, 8);
        ctx.fillStyle = 'rgba(0,0,0,0.01)'; ctx.fill();
        ctx.restore();

        // Clean artwork — no filter
        if (rounded) {
            ctx.save();
            roundRect(ctx, ax, ay, artW, artH, 8);
            ctx.clip();
        }
        ctx.drawImage(artImg, ax, ay, artW, artH);
        if (rounded) {
            ctx.restore();
        }
        usedArtW = artW;
    }

    // ── 4. Text — right half, directly on background ──
    let tx    = usedArtW + (NP_SHARE_MARGIN * 3);
    let textW = WIDTH - (tx + (NP_SHARE_MARGIN*2));

    let entries = [];

    // Auto-scale title — start smaller, max 2 lines, scale down to fit
    let formatted = formatLines(ctx, track.title, textW, 18, 12, EXTRA_BOLD_WEIGHT, FONT_SUFFIX);
    entries.push({lines:formatted.lines, fontSize:formatted.fontSize, weight:EXTRA_BOLD_WEIGHT, opacity:1.0});

    formatted = formatLines(ctx, stripTags(track.artistAndComposer), textW, Math.min(formatted.fontSize, 16), 12, STD_WEIGHT, FONT_SUFFIX);
    entries.push({lines:formatted.lines, fontSize:formatted.fontSize, weight:STD_WEIGHT, opacity:1.0});

    formatted = formatLines(ctx, stripTags(track.albumLine), textW, Math.min(formatted.fontSize, 14), 10, STD_WEIGHT, FONT_SUFFIX);
    entries.push({lines:formatted.lines, fontSize:formatted.fontSize, weight:STD_WEIGHT, opacity:SUB_OPACITY});

    // Calculate total block height for vertical centring
    let totalTextH = /*48
                     +*/ (Math.min(entries[0].lines.length, 2) * entries[0].fontSize * 1.15) + 12
                     + (Math.min(entries[1].lines.length, 2) * entries[1].fontSize * 1.15) + 4
                     + (Math.min(entries[2].lines.length, 2) * entries[2].fontSize * 1.15);
    let ty = (HEIGHT - totalTextH) / 2;

    ctx.fillStyle = TEXT_COLOR;
    /*
    ctx.font = STD_WEIGHT + '12px Roboto, sans-serif';
    ctx.letterSpacing = '0.5em';
    ctx.fillText(i18n('Now Playing').toUpperCase(), tx, ty + 22);
    ty += 34;

    ctx.letterSpacing = '0.0em';
    */
    for (let e=0; e<3; ++e) {
        if (entries[e].lines.length>0) {
            let lineH = entries[e].fontSize * 1.15;
            ctx.font = entries[e].weight + entries[e].fontSize + FONT_SUFFIX;
            ctx.globalAlpha = entries[e].opacity;
            let offset = centered ? (textW - ctx.measureText(entries[e].lines[0]).width)/2 : 0;
            ctx.fillText(entries[e].lines[0], tx + offset, ty + lineH);
            ty += lineH;
            if (entries[e].lines.length>1) {
                let txt = entries[e].lines[1]+(entries[e].lines.length>2 ? "..." : "");
                offset = centered ? (textW - ctx.measureText(txt).width)/2 : 0;
                ctx.fillText(txt, tx + offset, ty + lineH);
                ty += lineH;
            }
            ty += (0==e ? 12 : 4);
        }
    }

    ctx.globalAlpha = SUB_OPACITY;
    let svg = new Image();
    let logoX = WIDTH;
    svg.src = "/material/svg/lyrion-logo?c=" + (isDark ? LMS_DARK_SVG : LMS_LIGHT_SVG);
    try {
        await waitForLoad(svg);
        let h = 14;
        let w = h * (svg.width/svg.height)
        ctx.drawImage(svg, WIDTH-(w+NP_SHARE_MARGIN+8), NP_SHARE_MARGIN+2, w, h);
        ctx.beginPath();
        logoX = WIDTH-(w+NP_SHARE_MARGIN+14);
        ctx.roundRect(logoX, NP_SHARE_MARGIN, w+14, h+4, (h+NP_SHARE_MARGIN)/2);
        ctx.strokeStyle = "#"+(isDark ? LMS_DARK_SVG : LMS_LIGHT_SVG);
        ctx.stroke();
    } catch (e) {
    }

    if (undefined!=track.emblem) {
        svg = new Image();
        svg.src = "/material/svg/"+track.emblem.name+"?c=" + (isDark ? LMS_DARK_SVG : LMS_LIGHT_SVG);;
        try {
            await waitForLoad(svg);
            let size = 21;
            ctx.drawImage(svg, logoX-(size + 4), NP_SHARE_MARGIN-1, size, size);
        } catch (e) {
        }
    }

    if (rounded) {
        ctx.restore();
    }
    return canvas;
}

Vue.component('lms-npshare-dialog', {
    template: `
<v-dialog v-model="show" :width="(2==size ? NP_SHARE_LARGE_W : 1==size ? NP_SHARE_MED_W : NP_SHARE_STD_W)+20" persistent v-if="show">
 <v-card>
  <v-card-title>{{i18n("Now Playing")}}</v-card-title>
  <v-list-tile-sub-title style="padding:0px 16px 16px 16px">{{text}}</v-list-tile-sub-title>
  <div style="margin:4px">
   <img :src="src" style="width:100%; height:100%; object-cover">
  </div>
  <v-card-actions>
   <v-menu top v-model="showMenu">
    <v-btn icon slot="activator"><v-icon>more_vert</v-icon></v-btn>
    <v-list>
     <v-list-tile role="menuitem" @click="toggleCentered">
      <v-list-tile-avatar><v-icon>{{centered ? 'check_box' : 'check_box_outline_blank'}}</v-icon></v-list-tile-avatar>
      <v-list-tile-content><v-list-tile-title>{{i18n("Center text")}}</v-list-tile-title></v-list-tile-content>
     </v-list-tile>
     <v-list-tile role="menuitem" v-if="allowRounded" @click="toggleRounded">
      <v-list-tile-avatar><v-icon>{{rounded ? 'check_box' : 'check_box_outline_blank'}}</v-icon></v-list-tile-avatar>
      <v-list-tile-content><v-list-tile-title>{{i18n("Round corners")}}</v-list-tile-title></v-list-tile-content>
     </v-list-tile>
     <v-subheader>{{i18n("Size")}}</v-subheader>
     <template v-for="(name, index) in sizes">
      <v-list-tile role="menuitem" @click="changeSize(index)" class="menu-group-item">
       <v-list-tile-avatar><v-icon>{{index==size ? 'radio_button_checked' : 'radio_button_unchecked'}}</v-icon></v-list-tile-avatar>
       <v-list-tile-content><v-list-tile-title>{{name}}</v-list-tile-title></v-list-tile-content>
      </v-list-tile>
     </template>
     <v-subheader>{{i18n("Theme")}}</v-subheader>
     <template v-for="(name, index) in styles">
      <v-list-tile role="menuitem" @click="changeStyle(index)" class="menu-group-item">
       <v-list-tile-avatar><v-icon>{{index==style ? 'radio_button_checked' : 'radio_button_unchecked'}}</v-icon></v-list-tile-avatar>
       <v-list-tile-content><v-list-tile-title>{{name}}</v-list-tile-title></v-list-tile-content>
      </v-list-tile>
     </template>
    </v-list>
   </v-menu>
   <v-spacer></v-spacer>
   <v-btn flat v-if="queryParams.nativeNpShareS>0" @click="save('S')" :title="i18n('Share')"><v-icon class="btn-icon">share</v-icon>{{i18n('Share')}}</v-btn>
   <v-btn flat v-if="queryParams.nativeNpShareC>0" @click="save('C')" :title="i18n('Clipboard')"><img class="svg-img btn-icon" :src="'clipboard-add' | svgIcon(darkUi)"></img>{{i18n('Add to clipboard')}}</v-btn>
   <v-btn flat @click="close">{{i18n('Close')}}</v-btn>
  </v-card-actions>
 </v-card>
</v-dialog>
`,
    props: [],
    data() {
        return {
            show: false,
            showMenu: false,
            src: undefined,
            saveText: undefined,
            style: 0,
            styles: [],
            text: undefined,
            rounded: true,
            centered: true,
            size: 0,
            sizes: [],
        }
    },
    computed: {
        dark () {
            return 0==this.style || (2==this.style && this.$store.state.darkUi)
        },
        darkUi() {
            return this.$store.state.darkUi
        },
        allowRounded() {
            return this.$store.state.roundCovers
        }
    },
    mounted() {
        bus.$on('npshare.open', function(coverUrl, track) {
            this.coverUrl = coverUrl;
            this.track = track;
            this.text = "";
            if (queryParams.nativeNpShareS>0 || queryParams.nativeNpShareC>0)  {
                if (queryParams.nativeNpShareS>0) {
                    this.text = "Use the 'Share' button to share with other apps."
                    if (queryParams.nativeNpShareC>0) {
                        this.text += " ";
                    }
                }
                if (queryParams.nativeNpShareC>0) {
                    this.text += "Use the 'Clipboard' button to add image to clipboard, switch to another app, and then paste."
                    if (queryParams.nativeNpShareC>0) {
                        this.text += " ";
                    }
                }
            } else {
                this.text = IS_MOBILE
                    ? IS_ANDROID
                        ? i18n("Long-press on image and select 'Share image'.")
                        : i18n("Long-press on image, select 'Copy image' (to add to clipboard), switch to another app, and then paste.")
                    : i18n("Right-click on image, select 'Copy image' (to add to clipboard), switch to another app, and then paste.");
            }
            this.createImage();
            this.styles = [i18n("Dark"), i18n("Light"), i18n("Automatic")];
            this.sizes = [i18n("Small"), i18n("Medium"), i18n("Large")];
            this.style = parseInt(getLocalStorageVal("nd-share-style", this.style));
            this.rounded = getLocalStorageBool("nd-share-rounded", this.rounded);
            this.centered = getLocalStorageBool("nd-share-centered", this.centered);
            this.size = parseInt(getLocalStorageVal("nd-share-size", this.size));
        }.bind(this));
        bus.$on('closeDialog', function(dlg) {
            if (dlg == 'npshare') {
                this.show=false;
            }
        }.bind(this));
        bus.$on('npTrackChanged', function(track) {
            if (this.show) {
                this.track = track;
                this.createImage();
            }
        }.bind(this));
        bus.$on('currentCover', function(coverUrl) {
            if (this.show) {
                let url = undefined==coverUrl ? DEFAULT_COVER : coverUrl;
                if (url!=this.coverUrl) {
                    this.coverUrl = url;
                    this.createImage();
                }
            }
        }.bind(this));
    },
    methods: {
        createImage() {
            let view = this;
            loadImage(view.coverUrl).then(async function(artImg) {
                let canvas = await nowPlayingRenderToCanvas(view.track, artImg, view.dark, view.size, view.centered, view.allowRounded && view.rounded);
                view.src = canvas.toDataURL('image/png');
                canvas.remove();
                view.show = true;
                view.date = new Date();
            });
        },
        changeStyle(idx) {
            if (idx!=this.style) {
                this.style = idx;
                setLocalStorageVal("nd-share-style", idx);
                this.createImage();
            }
        },
        toggleCentered() {
            this.centered = !this.centered;
            setLocalStorageVal("nd-share-centered", this.centered);
            this.createImage();
        },
        toggleRounded() {
            this.rounded = !this.rounded;
            setLocalStorageVal("nd-share-rounded", this.rounded);
            this.createImage();
        },
        changeSize(idx) {
            if (idx!=this.size) {
                this.size = idx;
                setLocalStorageVal("nd-share-size", idx);
                this.createImage();
            }
        },
        close() {
            this.show = false;
        },
        save(action) {
            let ts = this.date.toISOString().slice(0, 19).replace(/[T:]/g,'-');
            let filename = 'lyrion-' + ts + '.png';
            let native = "nativeNpShare" + action;
            if (1==queryParams[native]) {
                try {
                    NativeReceiver.npShare(this.src, filename, action);
                } catch (e) {
                }
            } else if (queryParams[native]>0) {
                emitNative("MATERIAL-NPSHARE\n" + action + " " + this.src+"\nFILENAME " + filename, queryParams[native]);
            }
        },
        i18n(str) {
            if (this.show) {
                return i18n(str);
            } else {
                return str;
            }
        }
    },
    watch: {
        'show': function(val) {
            this.$store.commit('dialogOpen', {name:'npshare', shown:val});
        },
        'showMenu': function(newVal) {
            this.$store.commit('menuVisible', {name:'npshare', shown:newVal});
        }
    }
})
