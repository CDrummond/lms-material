/**
 * LMS-Material
 *
 * Copyright (c) 2018-2023 Craig Drummond <craig.p.drummond@gmail.com>
 * MIT license.
 */
'use strict';

const DEFAULT_COVER = "music/0/cover";

function shadeRgb(rgb, percent) {
    var t = percent <0 ? 0 : 255,
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

var currentCover = undefined;
var lmsCurrentCover = Vue.component('lms-currentcover', {
    template: `<div><img crossOrigin="anonymous" id="current-cover" :src="accessUrl" style="display:none"/></div>`,
    data() {
        return {
            accessUrl: undefined,
            colorList: { }
        };
    },
    mounted: function() {
        this.coverUrl = LMS_BLANK_COVER;
        this.fac = new FastAverageColor();
        this.chooseFromPal = window.location.href.substring(window.location.href.indexOf('?')+1).includes('frompal');
        if (this.chooseFromPal) {
            getMiscJson(this.colorList, "colors");
            this.lastChosenColor = undefined;
        }
        bus.$on('playerStatus', function(playerStatus) {
            // Has cover changed?
            var coverUrl = this.coverUrl;

            if (playerStatus.playlist.count == 0) {
                this.queueIndex = undefined;
                if (undefined===this.coverFromInfo || this.coverFromInfo || undefined==this.cover) {
                    coverUrl=resolveImageUrl(DEFAULT_COVER, LMS_CURRENT_IMAGE_SIZE);
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
                if (undefined==coverUrl && this.$store.state.infoPlugin) {
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
            if (currentCover.$store.state.color==COLOR_FROM_COVER) {
                currentCover.calculateColors();
            }
        });
    },
    methods: {
        calculateColors() {
            if (this.chooseFromPal) {
                if (undefined==this.colorList.colors || this.colorList.colors.length<1) {
                    setTimeout(function () {
                        this.calculateColors();
                    }.bind(this), 500);
                    return;
                }
                if (undefined==this.convertedColors) {
                    this.convertedColors = [];
                    for (let i=0, loop=this.colorList.colors, len=loop.length; i<len; ++i) {
                        let rgb=[]
                        for (let p=0; p<3; ++p) {
                            rgb.push(parseInt("0x"+loop[i]['color'].substr(1+(p*2), 2, 16)));
                        }
                        this.convertedColors.push(rgb);
                    }
                }
            }
            this.fac.getColorAsync(document.getElementById('current-cover')).then(color => {
                console.log(window.location.href.substring(window.location.href.indexOf('?')+1));
                if (window.location.href.substring(window.location.href.indexOf('?')+1).includes('frompal')) {
                    let rgbs = color.rgb.replace('rgb(', '').replace(')', '').split(',');
                    let rgb = [parseInt(rgbs[0]), parseInt(rgbs[1]), parseInt(rgbs[2])];
                    while (rgbBrightness(rgb)>170) {
                        rgb = shadeRgb(rgb, -0.1);
                    }
                    while (rgbBrightness(rgb)<50) {
                        rgb = shadeRgb(rgb, 0.1);
                    }
                    document.documentElement.style.setProperty('--primary-color', rgb2Hex(rgb));
                    document.documentElement.style.setProperty('--accent-color', rgb2Hex(shadeRgb(rgb, 0.2)));
                    let rgbas = "rgba("+rgb [0]+","+rgb[1]+","+rgb[2];
                    document.documentElement.style.setProperty('--pq-current-color', rgbas+",0.2)");
                    document.documentElement.style.setProperty('--drop-target-color', rgbas+",0.5)");
                } else {
                    // Choose color nearest to one from our palette...
                    let chosen = 0;
                    let diff = 255*255*3;
                    for (let i=0, loop=this.convertedColors, len=loop.length; i<len; ++i) {
                        let cdiff = Math.pow(rgb[0]-loop[i][0], 2)+Math.pow(rgb[1]-loop[i][1], 2)+Math.pow(rgb[2]-loop[i][2], 2);
                        if (cdiff<diff) {
                            diff = cdiff;
                            chosen = i;
                        }
                    }
                    if (this.lastChosenColor==chosen) {
                        // No change
                        return;
                    }
                    this.lastChosenColor = chosen;
                    document.documentElement.style.setProperty('--primary-color', this.colorList.colors[chosen]['color']);
                    if (undefined==this.colorList.colors[chosen]['accent']) {
                        document.documentElement.style.setProperty('--accent-color', this.colorList.colors[chosen]['color']);
                    } else {
                        document.documentElement.style.setProperty('--accent-color', this.colorList.colors[chosen]['accent']);
                    }
                    let rgbas = "rgba("+this.convertedColors[chosen][0]+","+this.convertedColors[chosen][1]+","+this.convertedColors[chosen][2];
                    document.documentElement.style.setProperty('--pq-current-color', rgbas+",0.2)");
                    document.documentElement.style.setProperty('--drop-target-color', rgbas+",0.5)");
                }
                this.$store.commit('colorsChanged');
            }).catch(e => {
            });
        }
    }
});

