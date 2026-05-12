/**
 * LMS-Material
 *
 * Copyright (c) 2018-2026 Craig Drummond <craig.p.drummond@gmail.com>
 * MIT license.
 */
'use strict';

const NP_SHARE_STD_H    = 200;
const NP_SHARE_STD_W    = 500;
const NP_SHARE_MED_H    = 300;
const NP_SHARE_MED_W    = 700;
const NP_SHARE_LARGE_H  = 400;
const NP_SHARE_LARGE_W  = 900;

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

function getList(item, type, used) {
    let vals = [];
    if (lmsOptions.showAllArtists && undefined!=item[type+"s"] && item[type+"s"].length>1) {
        for (let i=0, loop=item[type+"s"], len=loop.length; i<len; ++i) {
            if (!used.has(loop[i])) {
                vals.push(loop[i]);
                used.add(loop[i]);
            }
        }
    } else {
        let val = item[type];
        if (undefined!=val) {
            if (used.has(val)) {
                return vals;
            }
            used.add(val);
            vals.push(val);
        }
    }
    return vals;
}

async function renderNowPlayingToCanvas(track, artImg, isDark, size, centered, rounded) {
    const OVERLAY_ALPHA     = 0.45;
    const FONT_SUFFIX       = 'px Roboto, sans-serif';
    const TEXT_COLOR        = "#" + (isDark ? LMS_DARK_SVG : "000");
    const STD_WEIGHT        = '400 ';
    const EXTRA_BOLD_WEIGHT = '700 ';
    const SUB_OPACITY       = 0.7;
    const CORNER_RADIUS     = 14;
    const MARGIN            = 2==size ? 12 : 1==size ? 8 : 6;
    const WIDTH             = 2==size ? NP_SHARE_LARGE_W : 1==size ? NP_SHARE_MED_W : NP_SHARE_STD_W;
    const HEIGHT            = 2==size ? NP_SHARE_LARGE_H : 1==size ? NP_SHARE_MED_H : NP_SHARE_STD_H;
    const MAX_ART_SIZE      = HEIGHT - (2 * MARGIN);

    let canvas = document.createElement('canvas');
    let ctx = canvas.getContext('2d', { alpha: true, willReadFrequently: false });
    canvas.width = WIDTH;
    canvas.height = HEIGHT;

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
        prev.width = sizes[0];
        prev.height = sizes[0];
        prev.getContext('2d').drawImage(artImg, 0, 0, sizes[0], sizes[0]);
        for (let p = 1; p < sizes.length; p++) {
            let next = document.createElement('canvas');
            next.width = sizes[p];
            next.height = sizes[p];
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
        let ax = MARGIN + (MAX_ART_SIZE - artW) / 2;
        let ay = (HEIGHT - artH) / 2;

        // Drop shadow
        ctx.save();
        ctx.shadowColor = 'rgba(0,0,0,0.5)';
        ctx.shadowBlur = 40;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        roundRect(ctx, ax, ay, artW, artH, 8);
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fill();
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
    let tx    = usedArtW + (MARGIN * 3);
    let textW = WIDTH - (tx + (MARGIN*2));

    let entries = [];
    let withContext = 0!=size && !centered;
    let used = new Set();
    let artists = withContext ? getList(track, "artist", used) : []
    let composers = withContext && track.composer && lmsOptions.showComposer && useComposer(track) ? getList(track, "composer", used) : [];
    let conductors = withContext && track.conductor && lmsOptions.showConductor && useConductor(track) ? getList(track, "conductor", used) : [];

    let by = withContext ? stripTags(i18n("<obj>by</obj> %1")).replace(" %1", "") : undefined;
    let from = withContext ? stripTags(i18n("<obj>from</obj> %1")).replace(" %1", "") : undefined;

    if (2==size) {
        entries.push({lines:[i18n('Now Playing').toUpperCase()], fontSize:12, weight:STD_WEIGHT, opacity:SUB_OPACITY, ctx:undefined, lspacing:0.5, spacing:16});
    }

    // Auto-scale title — start smaller, max 2 lines, scale down to fit
    let formatted = formatLines(ctx, track.title, textW, 2==size ? 24 : 18, 12, EXTRA_BOLD_WEIGHT, FONT_SUFFIX);
    if (formatted.lines.length>0) {
        entries.push({lines:formatted.lines, fontSize:formatted.fontSize, weight:EXTRA_BOLD_WEIGHT, opacity:1.0, spacing:12});
    }

    if (withContext && 2==size && (artists.length>0 || composers.length>0 || conductors.length>0)) {
        let artstsCombined = artists.length>0 ? artists.join(SEPARATOR) : undefined;
        let composersCombined = composers.length>0 ? composers.join(SEPARATOR) : undefined;
        let conductorsCombined = conductors.length>0 ? conductors.join(SEPARATOR) : undefined;
        let fontSize = undefined;
        let performedBy = stripTags(i18n("<obj>performed by</obj> %1")).replace(" %1", "");

        if (artstsCombined && lmsOptions.artistFirst) {
            formatted = formatLines(ctx, artstsCombined, textW, Math.min(formatted.fontSize, 16), 12, STD_WEIGHT, FONT_SUFFIX);
            if (formatted.lines.length>0) {
                entries.push({lines:formatted.lines, fontSize:formatted.fontSize, weight:STD_WEIGHT, opacity:1.0, ctx:composersCombined || conductorsCombined ? performedBy : by, spacing:8});
                if (undefined==fontSize) {
                    fontSize = formatted.fontSize;
                }
            }
        }
        if (composersCombined) {
            formatted = formatLines(ctx, composersCombined, textW, fontSize ? fontSize : Math.min(formatted.fontSize, 16), fontSize ? fontSize : 12, STD_WEIGHT, FONT_SUFFIX);
            if (formatted.lines.length>0) {
                let composedBy = stripTags(i18n("<obj>composed by</obj> %1")).replace(" %1", "");
                entries.push({lines:formatted.lines, fontSize:formatted.fontSize, weight:STD_WEIGHT, opacity:1.0, ctx:composedBy, spacing:8});
                if (undefined==fontSize) {
                    fontSize = formatted.fontSize;
                }
            }
        }
        if (conductorsCombined) {
            formatted = formatLines(ctx, composersCombined, textW, fontSize ? fontSize : Math.min(formatted.fontSize, 16), fontSize ? fontSize : 12, STD_WEIGHT, FONT_SUFFIX);
            if (formatted.lines.length>0) {
                let conductedBy = stripTags(i18n("<obj>conducted by</obj> %1")).replace(" %1", "");
                entries.push({lines:formatted.lines, fontSize:formatted.fontSize, weight:STD_WEIGHT, opacity:1.0, ctx:conductedBy, spacing:8});
                if (undefined==fontSize) {
                    fontSize = formatted.fontSize;
                }
            }
        }
        if (artstsCombined && !lmsOptions.artistFirst) {
            formatted = formatLines(ctx, artstsCombined, textW, fontSize ? fontSize : Math.min(formatted.fontSize, 16), fontSize ? fontSize : 12, STD_WEIGHT, FONT_SUFFIX);
            if (formatted.lines.length>0) {
                entries.push({lines:formatted.lines, fontSize:formatted.fontSize, weight:STD_WEIGHT, opacity:1.0, ctx:composersCombined || conductorsCombined ? performedBy : by, spacing:8});
                if (undefined==fontSize) {
                    fontSize = formatted.fontSize;
                }
            }
        }
        //if (track.work!=undefined) {
        //    formatted = formatLines(ctx, track.work, textW, fontSize ? fontSize : Math.min(formatted.fontSize, 16), fontSize ? fontSize : 12, STD_WEIGHT, FONT_SUFFIX);
        //    if (formatted.lines.length>0) {
        //        let workCtx = stripTags(XXX("<obj>work</obj> %1")).replace(" %1", "");
        //        entries.push({lines:formatted.lines, fontSize:formatted.fontSize, weight:STD_WEIGHT, opacity:1.0, ctx:workCtx, spacing:4});
        //    }
        //}

        formatted = formatLines(ctx, stripTags(track.albumLine), textW, fontSize ? fontSize : Math.min(formatted.fontSize, 14), fontSize ? fontSize : 10, STD_WEIGHT, FONT_SUFFIX);
        if (formatted.lines.length>0) {
            entries.push({lines:formatted.lines, fontSize:formatted.fontSize, weight:STD_WEIGHT, opacity:withContext ? 1.0 : SUB_OPACITY, ctx:from, spacing:4});
        }
    } else {
        formatted = formatLines(ctx, stripTags(track.artistAndComposer), textW, Math.min(formatted.fontSize, 16), 12, STD_WEIGHT, FONT_SUFFIX);
        if (formatted.lines.length>0) {
            entries.push({lines:formatted.lines, fontSize:formatted.fontSize, weight:STD_WEIGHT, opacity:1.0, ctx:by, spacing:withContext ? entries[0].spacing : 4});
        }

        formatted = formatLines(ctx, stripTags(track.albumLine), textW, Math.min(formatted.fontSize, 14), 10, STD_WEIGHT, FONT_SUFFIX);
        if (formatted.lines.length>0) {
            entries.push({lines:formatted.lines, fontSize:formatted.fontSize, weight:STD_WEIGHT, opacity:withContext ? 1.0 : SUB_OPACITY, ctx:from, spacing:4});
        }
    }

    // Calculate total block height for vertical centring
    let totalTextH = 0;
    for (let e=0; e<entries.length; ++e) {
        totalTextH += (Math.min(entries[e].lines.length, 2) + (withContext && undefined!=entries[e].ctx ? 1 : 0)) * entries[e].fontSize * 1.15;
        if (e<entries.length-1) {
            totalTextH += entries[e].spacing;
        }
    }

    let ty = (HEIGHT - totalTextH) / 2;

    ctx.fillStyle = TEXT_COLOR;

    for (let e=0; e<entries.length; ++e) {
        if (entries[e].lines.length>0) {
            let lineH = entries[e].fontSize * 1.15;
            ctx.font = entries[e].weight + entries[e].fontSize + FONT_SUFFIX;
            ctx.letterSpacing = (undefined==entries[e].lspacing ? 0.0 : entries[e].lspacing) + 'em';
            if (e>0 && withContext && undefined!=entries[e].ctx) {
                ctx.globalAlpha = SUB_OPACITY;
                let offset = centered ? (textW - ctx.measureText(entries[e].ctx).width)/2 : 0;
                ctx.fillText(entries[e].ctx, tx + offset, ty + lineH);
                ty += lineH;
            }
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
            ty += entries[e].spacing;
        }
    }

    ctx.globalAlpha = SUB_OPACITY;
    let svg = new Image();
    let logoX = WIDTH;
    svg.src = "/material/svg/lyrion-logo?c=" + (isDark ? LMS_DARK_SVG : LMS_LIGHT_SVG);
    try {
        await waitForLoad(svg);
        let h = size>1 ? 22 : 16;
        let w = h * (svg.width/svg.height)
        ctx.drawImage(svg, WIDTH-(w+MARGIN+8), MARGIN+2, w, h);
        logoX = WIDTH-(w+MARGIN+14);
    } catch (e) {
    }

    if (undefined!=track.emblem) {
        svg = new Image();
        svg.src = "/material/svg/"+track.emblem.name+"?c=" + (isDark ? LMS_DARK_SVG : LMS_LIGHT_SVG);;
        try {
            await waitForLoad(svg);
            let sz = size>1 ? 26 : 20;
            ctx.drawImage(svg, logoX-(sz + 4), MARGIN+(size>1 ? 0 : -1), sz, sz);
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
<v-dialog v-model="show" :width="((2==size ? NP_SHARE_LARGE_W : 1==size ? NP_SHARE_MED_W: NP_SHARE_STD_W)/dpr)+20" persistent v-if="show">
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
   <v-btn flat icon v-if="showShare && 2==btnStyle" @click="save('S')" :title="i18n('Share')"><v-icon>share</v-icon></v-btn>
   <v-btn flat v-else-if="showShare" @click="save('S')"><v-icon class="btn-icon">share</v-icon>{{i18n('Share')}}</v-btn>
   <v-btn flat icon v-if="showClipboard && 2==btnStyle" @click="save('C')" :title="i18n('Add to clipboard')"><img class="svg-img btn-icon" :src="'clipboard-add' | svgIcon(darkUi)"></img></v-btn>
   <v-btn flat v-else-if="showClipboard" @click="save('C')"><img class="svg-img btn-icon" :src="'clipboard-add' | svgIcon(darkUi)"></img>{{1==btnStyle ?  i18n('Clipboard') : i18n('Add to clipboard')}}</v-btn>
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
            showShare: undefined!=queryParams.nativeNpShareS && queryParams.nativeNpShareS>0,
            showClipboard: undefined!=queryParams.nativeNpShareC && queryParams.nativeNpShareC>0,
            btnStyle: 0,
            style: 0,
            styles: [],
            text: undefined,
            rounded: true,
            centered: true,
            size: 0,
            sizes: [],
            dpr:1.0
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
        this.dpr = window.devicePixelRatio || 1;
        bus.$on('npshare.open', function(coverUrl, track) {
            this.coverUrl = coverUrl;
            this.track = track;
            this.text = "";
            if (this.showShare || this.showClipboard)  {
                if (this.showShare) {
                    this.text = "Use the 'Share' button to share with other apps."
                    if (this.showClipboard) {
                        this.text += " ";
                    }
                }
                if (this.showClipboard) {
                    this.text += "Use the 'Clipboard' button to add image to clipboard, switch to another app, and then paste."
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
        this.setBtnStyle();
        bus.$on('windowWidthChanged', function() {
            this.setBtnStyle();
        }.bind(this));
    },
    methods: {
        setBtnStyle() {
            let count = (this.showShare ? 1 : 0) + (this.showClipboard ? 1 : 0);
            this.btnStyle = 0;
            if (1==count) {
                if (window.innerWidth<330) {
                    this.btnStyle = 2;
                } else if (window.innerWidth<410) {
                    this.btnStyle = 1;
                }
            } else if (2==count) {
                if (window.innerWidth<460) {
                    this.btnStyle = 2;
                } else if (window.innerWidth<530) {
                    this.btnStyle = 1;
                }
            }
        },
        createImage() {
            let view = this;
            loadImage(view.coverUrl).then(async function(artImg) {
                let canvas = await renderNowPlayingToCanvas(view.track, artImg, view.dark, view.size, view.centered, view.allowRounded && view.rounded);
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
