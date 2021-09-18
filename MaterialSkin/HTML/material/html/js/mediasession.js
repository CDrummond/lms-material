/**
 * LMS-Material
 *
 * Copyright (c) 2018-2021 Craig Drummond <craig.p.drummond@gmail.com>
 * MIT license.
 */
'use strict';

/*
Enable auto play in Chrome via:

    Settings / Privaacy and security / Additional content settings (expand) / Sound / Allowed to play sounds / Add
    
    chrome://settings/content/siteDetails?site=http://hostname:9000
*/
Vue.component('lms-mediasession', {
    template: `<div/>`,
    data() {
        return { };
    },
    mounted() {
        this.mediaControlsSupported = !queryParams.hide.has('mediaControls') && ('mediaSession' in navigator);
        if (this.mediaControlsSupported) {
            this.mediaSessionInit = false;
            this.playerStatus = { isplaying: false,
                                  current: { title:undefined, artist:undefined, album:undefined } };
            bus.$on('playerStatus', function(playerStatus) {
                if (playerStatus.isplaying!=this.playerStatus.isplaying) {
                    this.playerStatus.isplaying = playerStatus.isplaying;
                }
                if (playerStatus.current.title!=this.playerStatus.current.title ||
                    (playerStatus.current.artist && playerStatus.current.artist!=this.playerStatus.current.artist) ||
                    (playerStatus.current.trackartist && playerStatus.current.trackartist!=this.playerStatus.current.artist) ) {
                    this.playerStatus.current.title=playerStatus.current.title;
                    this.playerStatus.current.artist=playerStatus.current.artist ? playerStatus.current.artist : playerStatus.current.trackartist;
                    this.playerStatus.current.album=playerStatus.current.album;
                }
                this.updateMediaSession(false);
            }.bind(this));

            this.media={title:undefined, artist:undefined, album:undefined, cover:undefined};
            bus.$on('currentCover', function(coverUrl) {
                this.media.cover = coverUrl;
                this.updateMediaSession(true);
            }.bind(this));
            bus.$emit('getCurrentCover');
            this.haveLocalAndroidPlayer = false;
            this.currentIpAddress = undefined;
            if (IS_ANDROID) { // currently only need to check current IP address to detect SB player, and this is Android only.
                try {
                    var RTCPeerConnection = window.RTCPeerConnection || window.webkitRTCPeerConnection || window.mozRTCPeerConnection;
                    if (RTCPeerConnection)(function() {
                        var rtc = new RTCPeerConnection({iceServers:[]});
                        rtc.createDataChannel('', {reliable: false});
                        rtc.onicecandidate = function(evt) {
                            if (evt.candidate) {
                                grepSdp(evt.candidate.candidate);
                            }
                        };

                        rtc.createOffer(function(offerDesc) {
                            rtc.setLocalDescription(offerDesc);
                        }, function(e) { console.warn("Failed to get IP address", e); });

                        function grepSdp(sdp) {
                            var ip = /(192\.168\.(0|\d{0,3})\.(0|\d{0,3}))/i;
                            sdp.split('\r\n').forEach(function(line) {
                                if (line.match(ip)) {
                                    this.currentIpAddress = line.match(ip)[0];
                                }
                            });
                        }
                    })();
                } catch(e) {
                }
                
                bus.$on('playersAdded', function(players) {
                    // Check if we have a local SB Player - if so, can't use MediaSession
                    var localAndroidPlayer = false;
                    for (var i=0, len=players.length; i<len && !localAndroidPlayer; ++i) {
                        if (this.currentIpAddress && 'SB Player'===players[i].modelname && players[i].ip.split(':')[0] == this.currentIpAddress) {
                            localAndroidPlayer = true;
                        }
                    }
                    
                    if (localAndroidPlayer != this.haveLocalAndroidPlayer) {
                        this.haveLocalAndroidPlayer = localAndroidPlayer;
                        if (this.haveLocalAndroidPlayer) {
                            this.updateMediaSession(true);
                        }
                    }
                }.bind(this));       
            }
            if (this.$store.state.mediaControls) {
               this.addListener();
               this.initMediaSessionAudio();
            }
        }
    },
    beforeDestroy() {
        this.removeListener();
    },
    methods: {
        initMediaSessionAudio() {
            this.mediaSessionInit = true;
            if (this.mediaAudio == undefined) {
                this.mediaAudio = document.createElement('audio');
                this.mediaAudio.loop = true;
                this.mediaAudio.volume = 0;

                navigator.mediaSession.setActionHandler('play', () => {
                    if (this.playerStatus && this.playerStatus.isplaying) {
                        bus.$emit('playerCommand', ['pause']);
                    } else {
                        bus.$emit('playerCommand', ['play']);
                    }
                });
                navigator.mediaSession.setActionHandler('pause', function() {
                    bus.$emit('playerCommand', ['pause']);
                });
                navigator.mediaSession.setActionHandler('previoustrack', function() {
                    bus.$emit('playerCommand', ['button', 'jump_rew']);
                });
                navigator.mediaSession.setActionHandler('nexttrack', function() {
                    bus.$emit('playerCommand', ['playlist', 'index', '+1']);
                });
            }
            this.mediaAudio.src = "html/audio/silence.ogg";
            this.removeListener();
            setTimeout(function () {
                this.updateMediaSession(true);
            }.bind(this), 500);
        },
        disableMediaSessionAudio() {
            this.mediaSessionInit = false;
            if (undefined!=this.mediaAudio) {
                this.mediaAudio.src = "";
            }
            navigator.mediaSession.playbackState = 'none';
            navigator.mediaSession.metadata = undefined;
            this.media.title = undefined;
            this.media.artist = undefined;
            this.media.album = undefined;
            this.removeListener();
        },
        updateMediaSession(force) {
            if ('mediaSession' in navigator) {
                var artist = this.playerStatus.current.trackartist ? this.playerStatus.current.trackartist : this.playerStatus.current.artist;
                var empty = undefined==artist && undefined==this.playerStatus.current.title && undefined==this.playerStatus.current.album;
                if (this.haveLocalAndroidPlayer || !this.$store.state.mediaControls || empty) {
                    this.disableMediaSessionAudio();
                } else {
                    if (!this.mediaSessionInit) {
                        this.initMediaSessionAudio();
                    }
                    if (this.playerStatus.isplaying) {
                        this.playSilence();
                    } else {
                        this.pauseSilence();
                    }
                    navigator.mediaSession.playbackState = this.playerStatus && this.playerStatus.isplaying ? "playing" : "paused";
                    if (force || this.playerStatus.current.title!=this.media.title || artist!=this.media.artist || this.playerStatus.current.album!=this.media.album) {
                        let artwork = undefined;
                        if (undefined!=this.media.cover && this.media.cover.endsWith('_1024x1024_f')) {
                            artwork = [ {src: this.media.cover.replace('_1024x1024_f', '_300x300_f') , sizes: '300x300', type: 'image/jpeg'},
                                        {src: ""+this.media.cover, sizes: '1024x1024', type: 'image/jpeg'} ];
                        } else {
                            artwork = [ {src: ""+this.media.cover, type: 'image/jpeg'} ];
                        }
                        this.media.title = this.playerStatus.current.title;
                        this.media.artist = artist;
                        this.media.album = this.playerStatus.current.album;
                        navigator.mediaSession.metadata = new MediaMetadata({
                            title: this.media.title,
                            artist: this.media.artist,
                            album: this.media.album,
                            artwork: artwork
                        });
                    }
                }
            }
        },
        playSilence() {
            if (!this.mediaAudio || this.mediaAudioStarted) {
                return;
            }
            this.mediaAudio.play().then(_ => {
                this.mediaAudioStarted = true;
                this.updateMediaSession(true);
                navigator.mediaSession.playbackState = this.playerStatus && this.playerStatus.isplaying ? "playing" : "paused";
            }).catch(err => {
                this.addListener();
            });
        },
        pauseSilence() {
            if (undefined!=this.mediaAudio && undefined==this.mediaAudioStarted) {
                this.mediaAudio.play().then(_ => {
                    this.mediaAudioStarted = false;
                    this.updateMediaSession(true);
                    navigator.mediaSession.playbackState = this.playerStatus && this.playerStatus.isplaying ? "playing" : "paused";
                    this.mediaAudio.pause();
                }).catch(err => {
                    this.addListener();
                });
                return;
            }
            if (!this.mediaAudio || !this.mediaAudioStarted) {
                return;
            }
            this.mediaAudio.pause();
            this.mediaAudioStarted = false;
            this.updateMediaSession(true);
            navigator.mediaSession.playbackState = this.playerStatus && this.playerStatus.isplaying ? "playing" : "paused"
        },
        removeListener() {
            window.removeEventListener('click', this.initMediaSessionAudio);
        },
        addListener() {
            this.removeListener();
            window.addEventListener('click', this.initMediaSessionAudio);
        }
    },
    watch: {
        '$store.state.mediaControls': function (newVal) {
            if (this.mediaControlsSupported) {
                if (newVal) {
                    this.addListener();
                    this.initMediaSessionAudio();
                } else {
                    this.disableMediaSessionAudio();
                }
            }
        }
    }
})

