/**
 * LMS-Material
 *
 * Copyright (c) 2018-2023 Craig Drummond <craig.p.drummond@gmail.com>
 * MIT license.
 */
'use strict';

const DEFAULT_COVER = "music/0/cover";

var lmsCurrentCover = Vue.component('lms-currentcover', {
    template: `<div/>`,
    data() {
        return {
        };
    },
    mounted: function() {
        this.coverUrl = LMS_BLANK_COVER;
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
            }
        }.bind(this));

        bus.$on('getCurrentCover', function() {
            bus.$emit('currentCover', this.coverUrl, this.queueIndex);
        }.bind(this));
    }
});

