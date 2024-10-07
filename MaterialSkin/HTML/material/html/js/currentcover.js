/**
 * LMS-Material
 *
 * Copyright (c) 2018-2024 Craig Drummond <craig.p.drummond@gmail.com>
 * MIT license.
 */
'use strict';

function shadeRgb(rgb, percent) {
    var t = percent < 0 ? 0 : 255,
        p = percent < 0 ? percent*-1 : percent;
    return [Math.round((t-rgb[0])*p)+rgb[0], Math.round((t-rgb[1])*p)+rgb[1], Math.round((t-rgb[2])*p)+rgb[2]];
}

function rgb2Hex(rgb) {
    let hex="#";
    for (let i=0; i<3; ++i) {
        let hv = rgb[i].toString(16);
        hex += (hv.length==1 ? "0" : "") + hv;
    }
    return hex;
}

function hex2Rgb(hx) {
    let step = hx.length>4 ? 2 : 1;
    let rgb=[]
    for (let p=0; p<3; ++p) {
        rgb.push(parseInt("0x"+hx.substr(1+(p*step), step, 16)));
    }
    return rgb;
}

function rgb2Hsv(rgb) {
    let r = rgb[0],
        g = rgb[1],
        b = rgb[2],
        max = Math.max(r, g, b),
        min = Math.min(r, g, b),
        d = max - min,
        h,
        s = (max === 0 ? 0 : d / max),
        v = max / 255;

    switch (max) {
        case min: h = 0; break;
        case r: h = (g - b) + d * (g < b ? 6: 0); h /= 6 * d; break;
        case g: h = (b - r) + d * 2; h /= 6 * d; break;
        case b: h = (r - g) + d * 4; h /= 6 * d; break;
    }

    return [h, s, v];
}

function hsv2Rgb(hsv) {
    let h = hsv[0],
        s = hsv[1],
        v = hsv[2],
        r,
        g,
        b,
        i = Math.floor(h * 6),
        f = h * 6 - i,
        p = v * (1 - s),
        q = v * (1 - f * s),
        t = v * (1 - (1 - f) * s);
    switch (i % 6) {
        case 0: r = v, g = t, b = p; break;
        case 1: r = q, g = v, b = p; break;
        case 2: r = p, g = v, b = t; break;
        case 3: r = p, g = q, b = v; break;
        case 4: r = t, g = p, b = v; break;
        case 5: r = v, g = p, b = q; break;
    }
    return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

function rgbLuminence(rgb) {
    let gamma = 2.4
    let srgb = [], c = [];
    for (let i = 0; i < 3; i++) {
        srgb[i] = rgb[i] / 255;
        c[i] = srgb[i] > 0.03928 ? Math.pow((srgb[i]+0.055) / 1.055, gamma) : srgb[i] / 12.92;
    }
    return 0.2126*c[0] + 0.7152*c[1] + 0.0722*c[2]
}

var currentCover = undefined;
var lmsCurrentCover = Vue.component('lms-currentcover', {
    template: `<div><img crossOrigin="anonymous" id="current-cover" :src="accessUrl" style="display:none"/></div>`,
    data() {
        return {
            accessUrl: undefined
        };
    },
    mounted: function() {
        this.coverUrl = DEFAULT_COVER;
        this.fac = new FastAverageColor();
        bus.$on('playerStatus', function(playerStatus) {
            // Has cover changed?
            var coverUrl = this.coverUrl;

            if (playerStatus.playlist.count == 0) {
                this.queueIndex = undefined;
                if (undefined===this.coverFromInfo || this.coverFromInfo || undefined==this.cover) {
                    coverUrl=DEFAULT_COVER; //resolveImageUrl(DEFAULT_COVER, LMS_CURRENT_IMAGE_SIZE);
                    this.coverFromInfo = false;
                }
            } else {
                this.queueIndex = playerStatus.current["playlist index"];
                coverUrl = undefined;
                if (playerStatus.current.artwork_url) {
                    coverUrl=resolveImageUrl(playerStatus.current.artwork_url, LMS_CURRENT_IMAGE_SIZE);
                }
                if (undefined==coverUrl && undefined!=playerStatus.current.coverid) { // && !(""+playerStatus.current.coverid).startsWith("-")) {
                    coverUrl="/music/"+playerStatus.current.coverid+"/cover"+LMS_CURRENT_IMAGE_SIZE;
                }
                if (undefined==coverUrl && LMS_P_MAI) {
                    if (playerStatus.current.artist_ids) {
                        coverUrl="/imageproxy/mai/artist/" + playerStatus.current.artist_ids[0] + "/image" + LMS_CURRENT_IMAGE_SIZE;
                    } else if (playerStatus.current.artist_id) {
                        coverUrl="/imageproxy/mai/artist/" + playerStatus.current.artist_id + "/image" + LMS_CURRENT_IMAGE_SIZE;
                    }
                }
                if (undefined==coverUrl) {
                    // Use players current cover as cover image. Need to add extra (coverid, etc) params so that
                    // the URL is different between tracks...
                    coverUrl="/music/current/cover.jpg?player=" + this.$store.state.player.id;
                    if (playerStatus.current.album_id) {
                        coverUrl+="&album_id="+playerStatus.current.album_id;
                    } else {
                        if (playerStatus.current.album) {
                            coverUrl+="&album="+encodeURIComponent(playerStatus.current.album);
                        }
                        if (playerStatus.current.albumartist) {
                            coverUrl+="&artist="+encodeURIComponent(playerStatus.current.albumartist);
                        }
                        if (playerStatus.current.year && playerStatus.current.year>0) {
                            coverUrl+="&year="+playerStatus.current.year;
                        }
                    }
                    coverUrl=resolveImageUrl(coverUrl, LMS_CURRENT_IMAGE_SIZE);
                }
                this.coverFromInfo = true;
            }

            if (coverUrl!=this.coverUrl) {
                this.coverUrl = coverUrl;
                bus.$emit('currentCover', this.coverUrl, this.queueIndex);
                if (1==queryParams.nativeCover) {
                    try {
                        NativeReceiver.coverUrl(this.coverUrl);
                    } catch (e) {
                    }
                } else if (queryParams.nativeCover>0) {
                    emitNative("MATERIAL-COVER\nURL " + this.coverUrl, queryParams.nativeCover);
                }

                if (this.$store.state.color==COLOR_FROM_COVER) {
                    this.accessUrl = undefined==coverUrl || (!coverUrl.startsWith("http:") && !coverUrl.startsWith("https:"))
                        ? coverUrl
                        : "https://images1-focus-opensocial.googleusercontent.com/gadgets/proxy?container=focus&refresh=2592000&url="+encodeURIComponent(coverUrl);
                } else {
                    this.accessUrl = undefined;
                }
            }
        }.bind(this));

        bus.$on('getCurrentCover', function() {
            bus.$emit('currentCover', this.coverUrl, this.queueIndex);
        }.bind(this));

        currentCover = this;
        document.getElementById('current-cover').addEventListener('load', function() {
            currentCover.calculateColors();
        });
        bus.$on('themeChanged', function() {
            if (this.$store.state.color==COLOR_FROM_COVER && this.accessUrl!=this.coverUrl) {
                this.accessUrl = this.coverUrl;
            }
        }.bind(this));
    },
    methods: {
        calculateColors() {
            if (this.$store.state.color!=COLOR_FROM_COVER) {
                return;
            }

            if (DEFAULT_COVER==this.coverUrl) {
                this.handleColor(undefined);
                return;
            }

            var rgb = undefined;
            try {
                var vibrant = new Vibrant(document.getElementById('current-cover'));
                var swatches = vibrant.swatches()
                var desired = this.$store.state.darkUi
                    ? ["Vibrant", "LightVibrant", "Muted", "LightMuted", "DarkVibrant", "DarkMuted"]
                    : ["Vibrant", "DarkVibrant", "Muted", "DarkMuted", "LightVibrant", "LightMuted"]
                for (let d=0, len=desired.length; d<len && undefined==rgb; ++d) {
                    if (swatches[desired[d]]) {
                        rgb = swatches[desired[d]].getRgb();
                        console.log(desired[d], swatches[desired[d]].getHex(), swatches[desired[d]].getRgb());
                    }
                }

            } catch(e) {
            }

            if (undefined==rgb) {
                // vibrant.js seems to fail on greyscale image, so fallback fo fast-average-color...
                this.fac.getColorAsync(document.getElementById('current-cover'), {mode:'precision'}).then(color => {
                    let rgbs = color.rgb.replace('rgb(', '').replace(')', '').split(',');
                    rgb = [parseInt(rgbs[0]), parseInt(rgbs[1]), parseInt(rgbs[2])];
                    this.handleColor(rgb);
                }).catch(e => { });
            } else {
                this.handleColor(rgb);
            }
        },
        handleColor(rgb) {
            let isDefCover = undefined==rgb || DEFAULT_COVER==this.coverUrl;

            if (isDefCover) {
                document.documentElement.style.setProperty('--tint-color', '#1976d2');
                rgb = [25,118,210];
                document.documentElement.style.setProperty('--accent-color', '#82b1ff');
                document.documentElement.style.setProperty('--primary-color', '#1976d2');
                document.documentElement.style.setProperty('--highlight-rgb', '25,118,210');
            } else {
                let orgb = [rgb[0], rgb[1], rgb[2]]; // [parseInt(rgbs[0]), parseInt(rgbs[1]), parseInt(rgbs[2])];
                if (this.$store.state.coloredToolbars) {
                    let hsv = rgb2Hsv(rgb);
                    hsv[2] = Math.max(Math.min(hsv[2], 150/255), 100/255)
                    rgb = hsv2Rgb(hsv);
                }

                let a=0;
                while (this.$store.state.darkUi ? rgbLuminence(rgb)<0.15 : rgbLuminence(rgb)>0.4) {
                    rgb = shadeRgb(rgb, this.$store.state.darkUi ? 0.05 : -0.05);
                    a+=1;
                }

                a=0;
                while (this.$store.state.darkUi ? rgbLuminence(rgb)>0.8 : rgbLuminence(rgb)<0.2) {
                    rgb = shadeRgb(rgb, this.$store.state.darkUi ? -0.05 : 0.05);
                    a+=1;
                }

                let hexColor=rgb2Hex(rgb);
                document.documentElement.style.setProperty('--tint-color', rgb2Hex(orgb));
                document.documentElement.style.setProperty('--primary-color', hexColor);
                document.documentElement.style.setProperty('--highlight-rgb', rgb[0]+","+rgb[1]+","+rgb[2]);
                document.documentElement.style.setProperty('--accent-color', rgb2Hex(rgb));
            }

            emitToolbarColorsFromState(this.$store.state);
            if (1==queryParams.nativeAccent) {
                bus.$nextTick(function () {
                    try {
                        NativeReceiver.updateAccentColor(hexColor);
                    } catch (e) {
                    }
                });
            } else if (queryParams.nativeAccent>0) {
                emitNative("MATERIAL-ACCENT\nVAL " + hexColor, queryParams.nativeAccent);
            }
            bus.$emit("colorChanged", rgb[0]+rgb[1]+rgb[2]);
        }
    }
});
