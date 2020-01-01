/**
 * LMS-Material
 *
 * Copyright (c) 2018-2020 Craig Drummond <craig.p.drummond@gmail.com>
 * MIT license.
 */

var mediaSessionComponent;
var mediaAudio = undefined;
var mediaInterval = undefined;
var mediaStarted = false;

const MEDIA_SESSION_PLAY_SILENCE = getLocalStorageBool('playSilence', false);

function controlAudio() {
    if (!MEDIA_SESSION_PLAY_SILENCE || !mediaAudio || !mediaStarted) {
        return;
    }
    if (mediaSessionComponent.playerStatus && mediaSessionComponent.playerStatus.isplaying) {
        if (mediaAudio.paused) {
            mediaAudio.currentTime = 0; // Go back to start
            mediaAudio.play().then(_ => {
                mediaInterval = setInterval(function() {
                    mediaAudio.currentTime = 0; // Go back to start
                }, 5000);
            }).catch(err => {
            });
        }
    } else if (!mediaAudio.paused) {
        mediaAudio.pause();
        if (mediaInterval) {
            clearInterval(mediaInterval);
            mediaInterval=undefined;
        }
    }
}

function initMediaSessionAudio() {
    if (mediaAudio == undefined) {
        mediaAudio = document.createElement('audio');
        //window.removeEventListener('touchend', initMediaSessionAudio);
        window.removeEventListener('click', initMediaSessionAudio);
        setTimeout(function () {
            mediaSessionComponent.updateMediaSession(mediaSessionComponent.playerStatus.current, true);
        }, 500);
    }
}

function startMediaSession() {
    if (!mediaAudio || mediaStarted) {
        controlAudio();
        return;
    }
    mediaAudio.src = "html/audio/silence.ogg";
    mediaAudio.play().then(_ => {
        mediaAudio.currentTime = 0; // Go back to start
        mediaAudio.pause();
        mediaSessionComponent.updateMediaSession(mediaSessionComponent.playerStatus.current, true);
        navigator.mediaSession.playbackState = mediaSessionComponent.playerStatus && mediaSessionComponent.playerStatus.isplaying ? "playing" : "paused";
        mediaStarted = true;
    }).catch(err => {
    });
    controlAudio();
}

function stopMediaSession() {
    if (!mediaStarted) {
        return;
    }
    if (mediaInterval) {
        clearInterval(mediaInterval);
        mediaInterval=undefined;
    }
    mediaStarted = false;
    if (mediaAudio.src) {
        mediaAudio.src = undefined;
    }
    navigator.mediaSession.metadata = undefined;
}

Vue.component('lms-mediasession', {
    template: `<div/>`,
    data() {
        return { };
    },
    mounted() {
        if ('mediaSession' in navigator && IS_MOBILE) {
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
                this.updateMediaSession(this.playerStatus.current);
            }.bind(this));

            mediaSessionComponent = this;
            //window.addEventListener('touchend', initMediaSessionAudio);
            window.addEventListener('click', initMediaSessionAudio);
            this.media={title:undefined, artist:undefined, album:undefined, cover:undefined};
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
            bus.$on('currentCover', function(coverUrl) {
                this.media.cover = coverUrl;
                this.updateMediaSession(this.playerStatus.current, true);
            }.bind(this));
            bus.$emit('getCurrentCover');
            bus.$on('lsAndNotifChanged', function(coverUrl) {
                this.updateMediaSession(this.playerStatus.current, true);
            }.bind(this));

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
                                    mediaSessionComponent.currentIpAddress = line.match(ip)[0];
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
                            this.updateMediaSession(undefined, true);
                        }
                    }
                }.bind(this));       
            }
        }
    },
    methods: {
        updateMediaSession(track, force) {
            if (!mediaAudio) {
                return;
            }
            if ('mediaSession' in navigator) {
                // haveLocalAndroidPlayer is defined in server.js
                if ((this.haveLocalAndroidPlayer && MEDIA_SESSION_PLAY_SILENCE) || !this.$store.state.lsAndNotif) {
                    stopMediaSession();
                    this.media.title = undefined;
                    this.media.artist = undefined;
                    this.media.album = undefined;
                } else {
                    startMediaSession();
                    navigator.mediaSession.playbackState = this.playerStatus && this.playerStatus.isplaying ? "playing" : "paused";
                    var artist = track.trackartist ? track.trackartist : track.artist;
                    if (force || track.title!=this.media.title || artist!=this.media.artist || track.album!=this.media.album) {
                        this.media.title = track.title;
                        this.media.artist = artist;
                        this.media.album = track.album;
                        navigator.mediaSession.metadata = new MediaMetadata({
                            title: this.media.title,
                            artist: this.media.artist,
                            album: this.media.album,
                            artwork: [ {src: ""+this.media.cover, type: 'image/jpeg'}]
                        });
                    }
                }
            }
        }
    }
})
