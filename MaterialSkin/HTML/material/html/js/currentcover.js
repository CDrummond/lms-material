/**
 * LMS-Material
 *
 * Copyright (c) 2018 Craig Drummond <craig.p.drummond@gmail.com>
 * MIT license.
 */

const DEFAULT_COVER = "music/0/cover";

var lmsServer = Vue.component('lms-currentcover', {
    template: `<div/>`,
    data() {
        return {
        };
    },
    methods: {
        moveQueueItems(indexes, to, movedBefore, movedAfter) {
            if (indexes.length>0) {
                var index = indexes.shift();
                lmsCommand(this.$store.state.player.id, ["playlist", "move", index<to ? index-movedBefore : index,
                                                         index>to ? to+movedAfter+(movedBefore>0 ? 1 : 0) : to]).then(({data}) => {
                    if (indexes.length>0) {
                        this.moveQueueItems(indexes, to, index<to ? movedBefore+1 : movedBefore,
                                                         index>to ? movedAfter+1 : movedAfter);
                    } else {
                        this.refreshStatus();
                    }
                });
            }
        }
    },
    mounted: function() {
        bus.$on('playerStatus', function(playerStatus) {
            // Has cover changed?
            var coverUrl = this.coverUrl;

            if (playerStatus.playlist.count == 0) {
                if (undefined===this.coverFromInfo || this.coverFromInfo || undefined==this.cover) {
                    coverUrl=resolveImage(DEFAULT_COVER);
                    this.coverFromInfo = false;
                }
            } else if (playerStatus.current.artwork_url!=this.artwork_url ||
                playerStatus.current.coverid!=this.coverid ||
                this.coverFromPlayer!=this.$store.state.player.id) {
                this.artwork_url = playerStatus.current.artwork_url;
                this.coverid = playerStatus.current.coverid;
                this.coverFromPlayer = this.$store.state.player.id

                coverUrl = undefined;
                if (this.artwork_url) {
                    coverUrl=resolveImage(null, this.artwork_url);
                }
                if (undefined==coverUrl && this.coverid) {
                    coverUrl=lmsServerAddress+"/music/"+this.coverid+"/cover.jpg";
                }
                if (undefined==coverUrl) {
                    // Use players current cover as cover image. Need to add extra (coverid, etc) params so that
                    // the URL is different between tracks...
                    coverUrl=lmsServerAddress+"/music/current/cover.jpg?player=" + this.$store.state.player.id;
                    if (playerStatus.current.coverid) {
                        coverUrl+="&coverid="+playerStatus.current.coverid;
                    } else {
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
                    }
                }
                this.coverFromInfo = true;
            }

            if (coverUrl!=this.coverUrl) {
                this.coverUrl = coverUrl;
                bus.$emit('currentCover', this.coverUrl);
            }
        }.bind(this));

        bus.$on('getCurrentCover', function() {
            bus.$emit('currentCover', this.coverUrl);
        }.bind(this));
    }
});

