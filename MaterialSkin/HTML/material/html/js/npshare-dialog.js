/**
 * LMS-Material
 *
 * Copyright (c) 2018-2026 Craig Drummond <craig.p.drummond@gmail.com>
 * MIT license.
 */
'use strict';

const NP_SHARE_H = 220;
const NP_SHARE_W = 500;
const NP_MAX_ART_SIZE = 180;

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

async function nowPlayingRenderToCanvas(track, artImg, isDark) {
    const ART_MARGIN       = 10;
    const R                = 14;
    const OVERLAY_ALPHA    = 0.45;
    const FONT_SUFFIX      = 'px Roboto, sans-serif';
    const TEXT_COLOR       = "#" + (isDark ? LMS_DARK_SVG : "000"); // # fff
    const CTX_TEXT_COLOR   = 'rgba(' + (isDark ? '255,255,255' : '0,0,0') + ',0.55)';
    const STD_WEIGHT       = '400 ';
    const BOLD_WEIGHT      = '500 ';
    const EXTR_BOLD_WEIGHT = '700 ';

    let canvas = document.createElement('canvas');
    let ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    canvas.width = NP_SHARE_W*dpr; canvas.height = NP_SHARE_H*dpr;
    ctx.scale(dpr, dpr);
    canvas.style.width = `${NP_SHARE_W}px`;
    canvas.style.height = `${NP_SHARE_H}px`;

    // ── Clip to rounded card ──
    ctx.save();
    roundRect(ctx, 0, 0, NP_SHARE_W, NP_SHARE_H, R);
    ctx.clip();

    // ── 1. Full card background — blurred artwork ──
    ctx.fillStyle = isDark ? "#103030" : "#fafafa";
    ctx.fillRect(0, 0, NP_SHARE_W, NP_SHARE_H);

    if (artImg) {
        // Draw blurred background — use ctx.filter if available (desktop), else multi-pass scale (mobile)
        let bgScale = Math.max(NP_SHARE_W / artImg.width, NP_SHARE_H / artImg.height);

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
        ctx.drawImage(prev, 0, 0, NP_SHARE_W, NP_SHARE_H);
        prev.remove();
        ctx.globalAlpha = 1;
        ctx.restore();
    }

    // ── 2. Dark overlay ──
    ctx.fillStyle = 'rgba(' + (isDark ? '16,16,16,' : '240,240,240,') + OVERLAY_ALPHA + ')';
    ctx.fillRect(0, 0, NP_SHARE_W, NP_SHARE_H);

    // ── 3. Clean artwork — left half, no effects, centred ──
    let usedArtW = NP_MAX_ART_SIZE;
    if (artImg) {
        let artScale = Math.min(NP_MAX_ART_SIZE / artImg.width, NP_MAX_ART_SIZE / artImg.height);
        let artW = artImg.width  * artScale;
        let artH = artImg.height * artScale;
        let ax = ART_MARGIN + (NP_MAX_ART_SIZE - artW) / 2;
        let ay = (NP_SHARE_H - artH) / 2;

        // Drop shadow
        ctx.save();
        ctx.shadowColor = 'rgba(0,0,0,0.9)';
        ctx.shadowBlur = 40; ctx.shadowOffsetX = 6; ctx.shadowOffsetY = 6;
        roundRect(ctx, ax, ay, artW, artH, 8);
        ctx.fillStyle = 'rgba(0,0,0,0.01)'; ctx.fill();
        ctx.restore();

        // Clean artwork — no filter
        ctx.save();
        roundRect(ctx, ax, ay, artW, artH, 8);
        ctx.clip();
        ctx.drawImage(artImg, ax, ay, artW, artH);
        ctx.restore();
        usedArtW = artW;
    }

    // ── 4. Text — right half, directly on background ──
    let tx    = usedArtW + (ART_MARGIN * 3);
    let textW = NP_SHARE_W - (tx + (ART_MARGIN*2));

    let entries = [];

    // Auto-scale title — start smaller, max 2 lines, scale down to fit
    let formatted = formatLines(ctx, track.title, textW, 16, 12, EXTR_BOLD_WEIGHT, FONT_SUFFIX);
    entries.push({lines:formatted.lines, fontSize:formatted.fontSize, weight:EXTR_BOLD_WEIGHT, color:TEXT_COLOR});

    formatted = formatLines(ctx, stripTags(track.artist ? track.artist : track.trackartist), textW, Math.min(formatted.fontSize, 14), 10, STD_WEIGHT, FONT_SUFFIX);
    entries.push({lines:formatted.lines, fontSize:formatted.fontSize, weight:STD_WEIGHT, color:TEXT_COLOR});

    formatted = formatLines(ctx, stripTags(track.album), textW, Math.min(formatted.fontSize-2, 12), 8, STD_WEIGHT, FONT_SUFFIX);
    entries.push({lines:formatted.lines, fontSize:formatted.fontSize, weight:STD_WEIGHT, color:CTX_TEXT_COLOR});

    // Calculate total block height for vertical centring
    let totalTextH = 48
                     + (Math.min(entries[0].lines.length, 2) * entries[0].fontSize * 1.15) + 12
                     + (Math.min(entries[1].lines.length, 2) * entries[1].fontSize * 1.15) + 4
                     + (Math.min(entries[2].lines.length, 2) * entries[2].fontSize * 1.15);
    let ty = (NP_SHARE_H - totalTextH) / 2;

    ctx.fillStyle = CTX_TEXT_COLOR;
    ctx.font = STD_WEIGHT + '12px Roboto, sans-serif';
    ctx.letterSpacing = '0.5em';
    ctx.fillText(i18n('Now Playing').toUpperCase(), tx, ty + 22);
    ty += 34;

    ctx.letterSpacing = '0.0em';
    for (let e=0; e<3; ++e) {
        if (entries[e].lines.length>0) {
            let lineH = entries[e].fontSize * 1.15;
            ctx.font = entries[e].weight + entries[e].fontSize + FONT_SUFFIX;
            ctx.fillStyle = entries[e].color;
            ctx.fillText(entries[e].lines[0], tx, ty + lineH);
            ty += lineH;
            if (entries[e].lines.length>1) {
                ctx.fillText(entries[e].lines[1]+(entries[e].lines.length>2 ? "..." : ""), tx, ty + lineH);
                ty += lineH;
            }
            ty += (0==e ? 12 : 4);
        }
    }

    let svg = new Image();
    let logoX = NP_SHARE_W;
    svg.src = "/material/svg/lyrion-logo?c=" + (isDark ? LMS_DARK_SVG : LMS_LIGHT_SVG);
    try {
        await waitForLoad(svg);
        let h = 14;
        let w = h * (svg.width/svg.height)
        ctx.globalAlpha = 0.75;
        ctx.drawImage(svg, NP_SHARE_W-(w+ART_MARGIN+8), ART_MARGIN+2, w, h);
        ctx.beginPath();
        logoX = NP_SHARE_W-(w+ART_MARGIN+14);
        ctx.roundRect(logoX, ART_MARGIN, w+14, h+4, (h+ART_MARGIN)/2);
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
            ctx.globalAlpha = 0.65;
            ctx.drawImage(svg, logoX-(size + 4), ART_MARGIN-1, size, size);
        } catch (e) {
        }
    }

    ctx.restore();
    return canvas;
}

Vue.component('lms-npshare-dialog', {
    template: `
<v-dialog v-model="show" :width="cw+20" persistent v-if="show">
 <v-card>
  <v-card-title>{{i18n("Now Playing")}}</v-card-title>
  <v-list-tile-sub-title style="padding-left:16px;padding-right:16px" v-if="showText">{{saveText}}</v-list-tile-sub-title>
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
   <v-btn flat icon v-if="queryParams.nativeNpShareS>0" @click="download('S')" :title="i18n('Share')"><v-icon>share</v-icon></v-btn>
   <v-btn flat icon v-if="queryParams.nativeNpShareC>0" @click="download('C')" :title="i18n('Copy')"><v-icon>content_copy</v-icon></v-btn>
   <v-btn flat v-if="showText" @click="download(queryParams.nativeNpShareD>0 ? 'D' : undefined)">{{i18n('Download')}}</v-btn>
   <v-btn flat icon v-else @click="download(queryParams.nativeNpShareD>0 ? 'D' : undefined)" :title="i18n('Download')"><v-icon>download</v-icon></v-btn>
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
            cw: NP_SHARE_W,
            ch: NP_SHARE_H,
            saveText: undefined,
            style: 0,
            styles: [],
            showText: queryParams.nativeNpShareS==0 && queryParams.nativeNpShareC==0
        }
    },
    computed: {
        dark () {
            return 0==this.style || (2==this.style && this.$store.state.darkUi)
        }
    },
    mounted() {
        bus.$on('npshare.open', function(coverUrl, track) {
            this.coverUrl = coverUrl;
            this.track = track;
            this.saveText = IS_MOBILE
                ? i18n("Long-press on image and select 'Save image', then share anywhere. Or use the 'Download' button to download.")
                : i18n("Right-click on the image and select 'Copy image', then paste anywhere. Or use the 'Download' button to download.");
            this.createImage();
            this.styles = [i18n("Dark"), i18n("Light"), i18n("Automatic")];
            this.style = parseInt(getLocalStorageVal("nd-share-style", 0));
        }.bind(this));
        bus.$on('closeDialog', function(dlg) {
            if (dlg == 'npshare') {
                this.show=false;
            }
        }.bind(this));
        bus.$on('playerStatus', function(playerStatus) {
            if (this.show) {
                let source = getTrackSource(playerStatus.current);
                let emblem = getEmblem(playerStatus.current.extid ? playerStatus.current.extid : source ? source.extid : undefined);
                let track = {
                    title:trackTitle(playerStatus.current),
                    artist:playerStatus.current.artist,
                    trackartist:playerStatus.current.trackartist,
                    album:undefined==playerStatus.current.album
                            ? undefined 
                            : (playerStatus.current.album+(playerStatus.current.year && playerStatus.current.year>0
                                ? " ("+ playerStatus.current.year+")"
                                : "")),
                    emblem: emblem
                }
                if (track.title!=this.track.title ||
                    track.artist!=this.track.artist ||
                    track.trackartist!=this.track.trackartist ||
                    track.album!=this.track.album ||
                    track.emblem!=this.track.emblem) {
                    this.track = track;
                    this.createImage();
                }
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
                let canvas = await nowPlayingRenderToCanvas(view.track, artImg, view.dark);
                view.src = canvas.toDataURL('image/png');
                canvas.remove();
                view.show = true;
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
        download(action) {
            let ts = new Date().toISOString().slice(0, 19).replace(/[T:]/g,'-');
            let filename = 'lyrion-' + ts + '.png';
            if (undefined!=action) {
                let native = "nativeNpShare" + action;
                if (1==queryParams[native]) {
                    try {
                        NativeReceiver.npShare(this.src, ts, action);
                    } catch (e) {
                    }
                } else if (queryParams[native]>0) {
                    emitNative("MATERIAL-NPSHARE\n" + action + " " + this.src+"\nFILENAME " + filename, queryParams[native]);
                }
            } else {
                let a = document.createElement('a');
                a.download = filename;
                a.href = this.src;
                a.click();
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
