/**
 * LMS-Material
 *
 * Copyright (c) 2018-2023 Craig Drummond <craig.p.drummond@gmail.com>
 * MIT license.
 */
'use strict';

function shadeRgb(rgb, percent) {
    var t = percent < 0 ? 0 : 255,
        p = percent < 0 ? percent*-1 : percent;
    return [Math.round((t-rgb[0])*p)+rgb[0], Math.round((t-rgb[1])*p)+rgb[1], Math.round((t-rgb[2])*p)+rgb[2]];
}

function rgbBrightness(rgb) {
    return (((rgb[0]*299)+(rgb[1]*587)+(rgb[2]*114))/1000);
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

function contrastRatio(l1, l2) {
    return (Math.max(l1, l2) + 0.05)/(Math.min(l1, l2) + 0.05);
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
                } else if (2==queryParams.nativeCover) {
                    console.log("MATERIAL-COVER\nURL " + this.coverUrl);
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
            this.calculateColors();
        }.bind(this));
    },
    methods: {
        calculateColors() {
            if (this.$store.state.color!=COLOR_FROM_COVER) {
                return;
            }
            this.fac.getColorAsync(document.getElementById('current-cover')).then(color => {
                let bgndLum = rgbLuminence(hex2Rgb(getComputedStyle(document.documentElement).getPropertyValue('--background-color')));
                let rgbs = color.rgb.replace('rgb(', '').replace(')', '').split(',');
                let rgb = [parseInt(rgbs[0]), parseInt(rgbs[1]), parseInt(rgbs[2])];
                if (DEFAULT_COVER==this.coverUrl) {
                    rgb = [69,90,100]; // bluegrey
                }

                let hsv = rgb2Hsv(rgb);
                hsv[2] = Math.max(Math.min(hsv[2], 150/255), 100/255)
                rgb = hsv2Rgb(hsv);

                let hexColor=rgb2Hex(rgb);
                document.documentElement.style.setProperty('--primary-color', hexColor);
                let rgbas = "rgba("+rgb [0]+","+rgb[1]+","+rgb[2];
                document.documentElement.style.setProperty('--pq-current-color', rgbas+",0.25)");
                document.documentElement.style.setProperty('--pq-current-album-color', rgbas+",0.075)");
                document.documentElement.style.setProperty('--drop-target-color', rgbas+",0.5)");

                // Try to ensure accent colour has decent contrast...
                let a=0;
                while (contrastRatio(bgndLum, rgbLuminence(rgb))<3.0 && a<20) {
                    rgb = shadeRgb(rgb, this.$store.state.darkUi ? 0.05 : -0.05);
                    a+=1;
                }

                document.documentElement.style.setProperty('--accent-color', rgb2Hex(rgb));
                emitToolbarColorsFromState(this.$store.state);
                if (1==queryParams.nativeAccent) {
                    bus.$nextTick(function () {
                        try {
                            NativeReceiver.updateAccentColor(hexColor);
                        } catch (e) {
                        }
                    });
                } else if (2==queryParams.nativeAccent) {
                    console.log("MATERIAL-ACCENT\nVAL " + hexColor);
                }
            }).catch(e => {
            });
        }
    }
});

