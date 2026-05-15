/**
 * LMS-Material
 *
 * Copyright (c) 2018-2026 Craig Drummond <craig.p.drummond@gmail.com>
 * MIT license.
 */
'use strict';

const NP_SHARE_SCALE = true; // Scale canvas based upon devicePixelRatio?

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

async function renderNowPlayingToCanvas(track, artImg, isDark, rounded, withContext) {
    const FONT_SUFFIX        = 'px Roboto, sans-serif';
    const STD_WEIGHT         = '400 ';
    const EXTRA_BOLD_WEIGHT  = '700 ';
    const DEVICE_PIXEL_RATIO = window.devicePixelRatio || 1;

    let used = new Set();
    let artists = getList(track, "artist", used)
    let composers = track.composer && lmsOptions.showComposer && useComposer(track) ? getList(track, "composer", used) : [];
    let conductors = track.conductor && lmsOptions.showConductor && useConductor(track) ? getList(track, "conductor", used) : [];
    let artstsCombined = artists.length>0 ? artists.join(SEPARATOR) : undefined;
    let composersCombined = composers.length>0 ? composers.join(SEPARATOR) : undefined;
    let conductorsCombined = conductors.length>0 ? conductors.join(SEPARATOR) : undefined;
    let albumLine = stripTags(track.albumLine);

    let strings = [albumLine];
    if (undefined!=artstsCombined) {
        strings.push(artstsCombined);
    }
    if (undefined!=composersCombined) {
        strings.push(composersCombined);
    }
    if (undefined!=conductorsCombined) {
        strings.push(conductorsCombined);
    }

    const MAX_HEIGHT = Math.round(Math.min(400, 100 + (strings.length * 80))/4)*4;
    const MAX_WIDTH  = Math.round(Math.min(900, 2.25 * MAX_HEIGHT)/4)*4;

    // Calculate view width based upon strings...
    let tmpCanvas = document.createElement('canvas');
    let tmpCtx = tmpCanvas.getContext('2d', { alpha: true, willReadFrequently: false });

    if (NP_SHARE_SCALE) {
        tmpCanvas.width = MAX_WIDTH*DEVICE_PIXEL_RATIO;
        tmpCanvas.height = MAX_HEIGHT*DEVICE_PIXEL_RATIO;
        tmpCtx.scale(DEVICE_PIXEL_RATIO, DEVICE_PIXEL_RATIO);
        tmpCanvas.style.width = `${MAX_WIDTH}px`;
        tmpCanvas.style.height = `${MAX_HEIGHT}px`;
    } else {
        tmpCanvas.width = MAX_WIDTH;
        tmpCanvas.height = MAX_HEIGHT;
    }

    let maxWidth = 0;

    tmpCtx.font = STD_WEIGHT + 16 + FONT_SUFFIX;
    for (let i=0, len=strings.length && maxWidth<=tmpCanvas.height; i<len; ++i) {
        let width = tmpCtx.measureText(strings[i]).width;
        if (width>maxWidth) {
            maxWidth = width;
        }
    }

    if (maxWidth<=tmpCanvas.height) {
        tmpCtx.font = EXTRA_BOLD_WEIGHT + 24 + FONT_SUFFIX;
        let width = tmpCtx.measureText(track.title).width;
        if (width>maxWidth) {
            maxWidth = width;
        }
    }

    let useWidth = tmpCanvas.width;
    if (maxWidth<=tmpCanvas.height) {
        if (withContext && maxWidth<=tmpCanvas.height*0.75) {
            useWidth = tmpCanvas.height*1.8;
        } else {
            useWidth = tmpCanvas.height*2;
        }
    }
    if (NP_SHARE_SCALE) {
        useWidth/=DEVICE_PIXEL_RATIO;
    }

    tmpCanvas.remove();

    const OVERLAY_ALPHA = 0.45;
    const TEXT_COLOR    = "#" + (isDark ? LMS_DARK_SVG : "000");
    const SUB_OPACITY   = 0.5;
    const CORNER_RADIUS = 14;
    const MARGIN        = 12;
    const WIDTH         = useWidth;
    const HEIGHT        = MAX_HEIGHT;
    const MAX_ART_SIZE  = HEIGHT - (2 * MARGIN);

    let canvas = document.createElement('canvas');
    let ctx = canvas.getContext('2d', { alpha: true, willReadFrequently: false });
    if (NP_SHARE_SCALE) {
        canvas.width = WIDTH*DEVICE_PIXEL_RATIO;
        canvas.height = HEIGHT*DEVICE_PIXEL_RATIO;
        ctx.scale(DEVICE_PIXEL_RATIO, DEVICE_PIXEL_RATIO);
        canvas.style.width = `${WIDTH}px`;
        canvas.style.height = `${HEIGHT}px`;
    } else {
        canvas.width = WIDTH;
        canvas.height = HEIGHT;
    }

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

    //entries.push({lines:[i18n('Now Playing').toUpperCase()], fontSize:12, weight:STD_WEIGHT, opacity:SUB_OPACITY, ctx:undefined, lspacing:0.5, spacing:16});

    // Auto-scale title — start smaller, max 2 lines, scale down to fit
    let formatted = formatLines(ctx, track.title, textW, 18, 14, EXTRA_BOLD_WEIGHT, FONT_SUFFIX);
    if (formatted.lines.length>0) {
        entries.push({lines:formatted.lines, fontSize:formatted.fontSize, weight:EXTRA_BOLD_WEIGHT, opacity:1.0, spacing:12});
    }

    let fontSize = undefined;

    if (artstsCombined && lmsOptions.artistFirst) {
        formatted = formatLines(ctx, artstsCombined, textW, Math.min(formatted.fontSize-2, 14), 10, STD_WEIGHT, FONT_SUFFIX);
        if (formatted.lines.length>0) {
            let ctx = stripTags(composersCombined || conductorsCombined ? i18n("<obj>performed by</obj> %1") : i18n("<obj>by</obj> %1")).replace(" %1", "");
            entries.push({lines:formatted.lines, fontSize:formatted.fontSize, weight:STD_WEIGHT, opacity:1.0, ctx:ctx, spacing:8});
            if (undefined==fontSize) {
                fontSize = formatted.fontSize;
            }
        }
    }
    if (composersCombined) {
        formatted = formatLines(ctx, composersCombined, textW, fontSize ? fontSize : Math.min(formatted.fontSize, 14), fontSize ? fontSize : 10, STD_WEIGHT, FONT_SUFFIX);
        if (formatted.lines.length>0) {
            let composedBy = stripTags(i18n("<obj>composed by</obj> %1")).replace(" %1", "");
            entries.push({lines:formatted.lines, fontSize:formatted.fontSize, weight:STD_WEIGHT, opacity:1.0, ctx:composedBy, spacing:8});
            if (undefined==fontSize) {
                fontSize = formatted.fontSize;
            }
        }
    }
    if (conductorsCombined) {
        formatted = formatLines(ctx, composersCombined, textW, fontSize ? fontSize : Math.min(formatted.fontSize, 14), fontSize ? fontSize : 10, STD_WEIGHT, FONT_SUFFIX);
        if (formatted.lines.length>0) {
            let conductedBy = stripTags(i18n("<obj>conducted by</obj> %1")).replace(" %1", "");
            entries.push({lines:formatted.lines, fontSize:formatted.fontSize, weight:STD_WEIGHT, opacity:1.0, ctx:conductedBy, spacing:8});
            if (undefined==fontSize) {
                fontSize = formatted.fontSize;
            }
        }
    }
    if (artstsCombined && !lmsOptions.artistFirst) {
        formatted = formatLines(ctx, artstsCombined, textW, fontSize ? fontSize : Math.min(formatted.fontSize, 14), fontSize ? fontSize : 10, STD_WEIGHT, FONT_SUFFIX);
        if (formatted.lines.length>0) {
            entries.push({lines:formatted.lines, fontSize:formatted.fontSize, weight:STD_WEIGHT, opacity:1.0, ctx:composersCombined || conductorsCombined ? performedBy : by, spacing:8});
            if (undefined==fontSize) {
                fontSize = formatted.fontSize;
            }
        }
    }
    //if (track.work!=undefined) {
    //    formatted = formatLines(ctx, track.work, textW, fontSize ? fontSize : Math.min(formatted.fontSize, 14), fontSize ? fontSize : 10, STD_WEIGHT, FONT_SUFFIX);
    //    if (formatted.lines.length>0) {
    //        let workCtx = stripTags(XXX("<obj>work</obj> %1")).replace(" %1", "");
    //        entries.push({lines:formatted.lines, fontSize:formatted.fontSize, weight:STD_WEIGHT, opacity:1.0, ctx:workCtx, spacing:4});
    //    }
    //}

    formatted = formatLines(ctx, albumLine, textW, fontSize ? fontSize : Math.min(formatted.fontSize, 14), fontSize ? fontSize : 10, STD_WEIGHT, FONT_SUFFIX);
    if (formatted.lines.length>0) {
        entries.push({lines:formatted.lines, fontSize:formatted.fontSize, weight:STD_WEIGHT, opacity:1.0, ctx:stripTags(i18n("<obj>from</obj> %1")).replace(" %1", ""), spacing:4});
    }

    // Calculate total block height for vertical centring
    let totalTextH = 0;
    for (let e=0; e<entries.length; ++e) {
        totalTextH += (Math.min(entries[e].lines.length, 2) + (undefined!=entries[e].ctx ? 1 : 0)) * entries[e].fontSize * 1.15;
        if (e<entries.length-1) {
            totalTextH += entries[e].spacing;
        }
    }

    let ty = (HEIGHT - totalTextH) / 2;

    ctx.fillStyle = TEXT_COLOR;

    for (let e=0; e<entries.length; ++e) {
        if (entries[e].lines.length>0) {
            let maxLines = e>0 || entries.length > 3 ? 2 : 3;
            let lineH = entries[e].fontSize * 1.15;
            ctx.font = entries[e].weight + entries[e].fontSize + FONT_SUFFIX;
            ctx.letterSpacing = (undefined==entries[e].lspacing ? 0.0 : entries[e].lspacing) + 'em';
            if (withContext && e>0 && undefined!=entries[e].ctx) {
                ctx.globalAlpha = SUB_OPACITY;
                ctx.fillText(entries[e].ctx, tx, ty + lineH);
                ty += lineH;
            }
            ctx.globalAlpha = entries[e].opacity;

            for (let l=0; l<maxLines && l<entries[e].lines.length; ++l) {
                let txt = entries[e].lines[l]+((l+1==maxLines) && entries[e].lines.length>maxLines ? "..." : "");
                let offset = withContext ? 0 : ((textW - ctx.measureText(txt).width)/2);
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
        let h = strings.length>2 ? 22 : 16;
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
            let sz = strings.length>2 ? 26 : 20;
            ctx.drawImage(svg, logoX-(sz + 4), MARGIN+(strings.length>2 ? 0 : -1), sz, sz);
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
<v-dialog v-model="show" :width="canvasWidth+20" persistent v-if="show">
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
   <v-btn flat icon v-if="showClipboard && 2==btnStyle" @click="save('C')" :title="i18n('Add to clipboard')"><img class="svg-img" :src="'clipboard-add' | svgIcon(darkUi)"></img></v-btn>
   <v-btn flat v-else-if="showClipboard" @click="save('C')">{{1==btnStyle ?  i18n('Clipboard') : i18n('Add to clipboard')}}</v-btn>
   <div style="width:32px; height:0px; background:transparent" v-if="2==btnStyle && showClipboard && showShare"></div>
   <v-btn flat icon v-if="showShare && 2==btnStyle" @click="save('S')" :title="i18n('Share')"><v-icon>share</v-icon></v-btn>
   <v-btn flat v-else-if="showShare" @click="save('S')">{{i18n('Share')}}</v-btn>
   <div style="width:32px; height:0px; background:transparent" v-if="2==btnStyle && (showClipboard || showShare)"></div>
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
            canvasWidth:300
        }
    },
    computed: {
        dark () {
            return 0==this.style || (2==this.style && this.$store.state.darkUi)
        },
        darkUi() {
            return this.$store.state.darkUi
        }
    },
    mounted() {
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
                let canvas = await renderNowPlayingToCanvas(view.track, artImg, view.dark, view.$store.state.roundCovers, view.$store.state.nowPlayingContext);
                view.src = canvas.toDataURL('image/png');
                view.canvasWidth = Math.min(600, canvas.width);
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
