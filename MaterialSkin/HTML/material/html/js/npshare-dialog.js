/**
 * LMS-Material
 *
 * Copyright (c) 2018-2026 Craig Drummond <craig.p.drummond@gmail.com>
 * MIT license.
 */
'use strict';

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
    const H                = 180;
    const W                = H * 3;
    const ART_MARGIN       = 10;
    const ART_MAX_SIZE     = H - (2 * ART_MARGIN);
    const R                = 14;
    const OVERLAY_ALPHA    = 0.45;
    const FONT_SUFFIX      = 'px Roboto, sans-serif';
    const TEXT_COLOR       = "#" + (isDark ? LMS_DARK_SVG : LMS_LIGHT_SVG); // # fff
    const CTX_TEXT_COLOR   = 'rgba(' + (isDark ? '255,255,255' : '0,0,0') + ',0.55)';
    const STD_WEIGHT       = '400 ';
    const BOLD_WEIGHT      = '500 ';
    const EXTR_BOLD_WEIGHT = '700 ';

    let canvas = document.createElement('canvas');
    canvas.width = W; canvas.height = H;
    let ctx = canvas.getContext('2d');

    // ── Clip to rounded card ──
    ctx.save();
    roundRect(ctx, 0, 0, W, H, R);
    ctx.clip();

    // ── 1. Full card background — blurred artwork ──
    ctx.fillStyle = isDark ? "#303030" : "#fafafa";
    ctx.fillRect(0, 0, W, H);

    if (artImg) {
        // Draw blurred background — use ctx.filter if available (desktop), else multi-pass scale (mobile)
        let bgScale = Math.max(W / artImg.width, H / artImg.height);

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
        ctx.drawImage(prev, 0, 0, W, H);
        prev.remove();
        ctx.globalAlpha = 1;
        ctx.restore();
    }

    // ── 2. Dark overlay ──
    ctx.fillStyle = 'rgba(' + (isDark ? '16,16,16,' : '240,240,240,') + OVERLAY_ALPHA + ')';
    ctx.fillRect(0, 0, W, H);

    // ── 3. Clean artwork — left half, no effects, centred ──
    let usedArtW = ART_MAX_SIZE;
    if (artImg) {
        let artScale = Math.min(ART_MAX_SIZE / artImg.width, ART_MAX_SIZE / artImg.height);
        let artW = artImg.width  * artScale;
        let artH = artImg.height * artScale;
        let ax = ART_MARGIN + (ART_MAX_SIZE - artW) / 2;
        let ay = (H - artH) / 2;

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
    let tx    = usedArtW + (ART_MARGIN * 2);
    let textW = W - (tx + ART_MARGIN);

    let entries = [];

    // Auto-scale title — start smaller, max 2 lines, scale down to fit
    let formatted = formatLines(ctx, track.title, textW, 24, 18, EXTR_BOLD_WEIGHT, FONT_SUFFIX);
    entries.push({lines:formatted.lines, fontSize:formatted.fontSize, weight:EXTR_BOLD_WEIGHT, color:TEXT_COLOR});

    formatted = formatLines(ctx, stripTags(track.artist ? track.artist : track.trackartist), textW, 16, 12, STD_WEIGHT, FONT_SUFFIX);
    entries.push({lines:formatted.lines, fontSize:formatted.fontSize, weight:STD_WEIGHT, color:TEXT_COLOR});

    formatted = formatLines(ctx, stripTags(track.album), textW, 14, 10, STD_WEIGHT, FONT_SUFFIX);
    entries.push({lines:formatted.lines, fontSize:formatted.fontSize, weight:STD_WEIGHT, color:CTX_TEXT_COLOR});

    // Calculate total block height for vertical centring
    let totalTextH = 44
                     + (Math.min(entries[0].lines.length, 2) * entries[0].fontSize * 1.15) + 12
                     + (Math.min(entries[1].lines.length, 2) * entries[1].fontSize * 1.15) + 4
                     + (Math.min(entries[2].lines.length, 2) * entries[2].fontSize * 1.15);
    let ty = (H - totalTextH) / 2;

    ctx.fillStyle = TEXT_COLOR;
    ctx.font = BOLD_WEIGHT + '13px Roboto, sans-serif';
    ctx.letterSpacing = '0.2em';
    ctx.fillText(i18n('Now Playing').toUpperCase(), tx, ty + 26);
    ty += 30;

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
    svg.src = "/material/svg/lyrion-logo?c=" + (isDark ? LMS_DARK_SVG : LMS_LIGHT_SVG);
    try {
        await waitForLoad(svg);
        let h = 16;
        let w = h * (svg.width/svg.height)
        ctx.globalAlpha = 0.75;
        ctx.drawImage(svg, canvas.width-(w+14), 9, w, h);
        ctx.beginPath();
        ctx.roundRect(canvas.width-(w+22), 5, w+18, h+8, (h+8)/2);
        ctx.strokeStyle = TEXT_COLOR;
        ctx.stroke();
    } catch (e) {
    }

    if (undefined!=track.extid) {
        let emblem = getEmblem(track.extid);
        if (undefined!=emblem) {
            svg = new Image();
            svg.src = "/material/svg/"+emblem.name+"?c="+emblem.color.substr(1);
            try {
                await waitForLoad(svg);
                let size = 22;
                let x = usedArtW + ART_MARGIN;
                ctx.globalAlpha = 0.5;
                ctx.fillStyle = emblem.bgnd;
                ctx.beginPath();
                ctx.arc(x-18, 18, (size+4)/2, 0, 2*Math.PI);
                ctx.fill();
                ctx.drawImage(svg, x-(size+7), 7, size, size);
            } catch (e) {
            }
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
  <v-list-tile-sub-title style="padding-left:16px;padding-right:16px">{{saveText}}</v-list-tile-sub-title>
  <div style="overflow:auto; margin-left:10px; margin-bottom:10px; margin-top:20px">
   <div :style="{'width':(cw+10)+'px', 'height': (ch+10)+'px'}">
    <img :src="src"></img>
   </div>
  </div>
  <v-card-actions>
   <v-spacer></v-spacer>
   <v-btn flat @click="download">{{i18n('Download')}}</v-btn>
   <v-btn flat @click="close">{{i18n('Close')}}</v-btn>
  </v-card-actions>
 </v-card>
</v-dialog>
`,
    props: [],
    data() {
        return {
            show: false,
            src: undefined,
            cw: 100,
            ch: 100,
            saveText: undefined
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
        }.bind(this));
        bus.$on('closeDialog', function(dlg) {
            if (dlg == 'npshare') {
                this.show=false;
            }
        }.bind(this));
        bus.$on('playerStatus', function(playerStatus) {
            if (this.show) {
                let track = {
                    title:trackTitle(playerStatus.current),
                    artist:playerStatus.current.artist,
                    trackartist:playerStatus.current.trackartist,
                    album:undefined==playerStatus.current.album
                            ? undefined 
                            : playerStatus.current.album+(playerStatus.current.year && playerStatus.current.year>0
                                ? " ("+ playerStatus.current.year+")"
                                : ""),
                    extid: playerStatus.current.extid
                }
                if (track.title!=this.track.title ||
                    track.artist!=this.track.artist ||
                    track.trackartist!=this.track.trackartist ||
                    track.album!=this.track.album ||
                    track.extid!=this.track.extid) {
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
        createImage(c) {
            let view = this;
            loadImage(view.coverUrl).then(async function(artImg) {
                let canvas = await nowPlayingRenderToCanvas(view.track, artImg, view.$store.state.darkUi);
                view.cw = canvas.width;
                view.ch = canvas.height;
                view.src = canvas.toDataURL('image/png');
                canvas.remove();
                view.show = true;
            });
        },
        close() {
            this.show = false;
        },
        download() {
            let a = document.createElement('a');
            let ts = new Date().toISOString().slice(0, 19).replace(/[T:]/g,'-');
            a.download = 'lyrion-' + ts + '.png';
            a.href = this.src;
            a.click();
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
        }
    }
})
