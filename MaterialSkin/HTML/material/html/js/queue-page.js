/**
 * LMS-Material
 *
 * Copyright (c) 2018 Craig Drummond <craig.p.drummond@gmail.com>
 * MIT license.
 */

var PQ_PLAY_NOW_ACTION =  { cmd: 'playnow',  icon: 'play_circle_outline'   };
var PQ_PLAY_NEXT_ACTION = { cmd: 'playnext', icon: 'play_circle_filled'    };
var PQ_REMOVE_ACTION =    { cmd: 'remove',   icon: 'remove_circle_outline' };
var PQ_MORE_ACTION =      { cmd: 'more',     icon: 'more_horiz'            };

const PQ_STATUS_TAGS = "tags:dcltuAK";

function queueItemCover(item) {
    if (item.artwork_url) {
        return resolveImage(null, item.artwork_url);
    }
    if (item.coverid) {
        return lmsServerAddress+"/music/"+item.coverid+"/cover"+LMS_LIST_IMAGE_SIZE;
    }
    return resolveImage("music/0/cover"+LMS_LIST_IMAGE_SIZE);
}

function parseResp(data, showTrackNum) {
    var resp = { timestamp: 0, items: [], size: 0 };
    if (data.result) {
        resp.timestamp = data.result.playlist_timestamp;
        resp.size = data.result.playlist_tracks;
        
        if (data.result.playlist_loop) {
            data.result.playlist_loop.forEach(i => {
                var title = i.title;
                if (showTrackNum && i.tracknum>0) {
                     title = (i.tracknum>9 ? i.tracknum : ("0" + i.tracknum))+" "+title;
                }
                var subtitle = i.artist ? i.artist : i.trackartist;
                if (i.album) {
                    if (subtitle) {
                        subtitle+=" - " + i.album;
                    } else {
                        sbtitle=i.album;
                    }
                    if (i.year && i.year>0) {
                        subtitle+=" (" + i.year + ")";
                    }
                }
                var image = queueItemCover(i);
                var isStream = i.url && (i.url.startsWith("http:") || i.url.startsWith("https:"));
                resp.items.push({
                              id: "track_id:"+i.id,
                              title: title,
                              subtitle: subtitle,
                              icon: image ? undefined : (isStream ? "wifi_tethering" : "music_note"),
                              image: image,
                              actions: [PQ_PLAY_NOW_ACTION, PQ_PLAY_NEXT_ACTION, DIVIDER, PQ_REMOVE_ACTION, PQ_MORE_ACTION],
                              duration: i.duration
                          });
            });
        }
    }
    return resp;
}

var lmsQueue = Vue.component("lms-queue", {
  template: `
<div> 
 <v-dialog v-model="dialog.show" persistent max-width="500px">
  <v-card>
   <v-card-text>
    <span v-if="dialog.title">{{dialog.title}}</span>
    <v-container grid-list-md>
     <v-layout wrap>
      <v-flex xs12>
       <v-text-field :label="dialog.hint" v-model="dialog.value"></v-text-field>
      </v-flex>
     </v-layout>
    </v-container>
   </v-card-text>
   <v-card-actions>
    <v-spacer></v-spacer>
    <v-btn flat @click.native="dialog.show = false; dialogResponse(false);">{{undefined===dialog.cancel ? trans.cancel : dialog.cancel}}</v-btn>
    <v-btn flat @click.native="dialogResponse(true);">{{undefined===dialog.ok ? trans.ok : dialog.ok}}</v-btn>
   </v-card-actions>
  </v-card>
 </v-dialog>
 <div class="subtoolbar pq-details">
  <v-layout>
   <v-flex class="pq-text" v-if="listSize>0">{{listSize | displayCount}} {{duration | displayTime(true)}}</v-flex>
   <v-spacer></v-spacer>
   <v-btn :title="trans.repeatOne" flat icon v-if="desktop && playerStatus.repeat===1" class="toolbar-button" @click="bus.$emit('playerCommand', ['playlist', 'repeat', 0])"><v-icon>repeat_one</v-icon></v-btn>
   <v-btn :title="trans.repeatAll" flat icon v-else-if="desktop && playerStatus.repeat===2" class="toolbar-button" @click="bus.$emit('playerCommand', ['playlist', 'repeat', 1])"><v-icon>repeat</v-icon></v-btn>
   <v-btn :title="trans.repeatOff" flat icon v-else-if="desktop" class="toolbar-button dimmed" @click="bus.$emit('playerCommand', ['playlist', 'repeat', 2])"><v-icon>repeat</v-icon></v-btn>

   <v-btn :title="trans.shuffleAlbums" flat icon v-if="desktop && playerStatus.shuffle===2" class="toolbar-button" @click="bus.$emit('playerCommand', ['playlist', 'shuffle', 0])"><v-icon class="shuffle-albums">shuffle</v-icon></v-btn>
   <v-btn :title="trans.shuffleAll" flat icon v-else-if="desktop && playerStatus.shuffle===1" class="toolbar-button" @click="bus.$emit('playerCommand', ['playlist', 'shuffle', 2])"><v-icon>shuffle</v-icon></v-btn>
   <v-btn :title="trans.shuffleOff" flat icon v-else-if="desktop" class="toolbar-button dimmed" @click="bus.$emit('playerCommand', ['playlist', 'shuffle', 1])"><v-icon>shuffle</v-icon></v-btn>
   <v-divider vertical="true" v-if="desktop"></v-divider>
   <v-btn :title="trans.scrollToCurrent" flat icon @click="scrollToCurrent()" class="toolbar-button"><v-icon>format_indent_increase</v-icon></v-btn>
   <v-btn :title="trans.save" flat icon @click="save()" class="toolbar-button"><v-icon>save</v-icon></v-btn>
   <v-btn :title="trans.clear" flat icon @click="clear()" class="toolbar-button"><v-icon>clear_all</v-icon></v-btn>
  </v-layout>
 </div>
 <v-list class="lms-list-sub"  id="queue-list">
  <template v-for="(item, index) in items">
  <!-- TODO: Fix and re-use virtual scroller -->
  <!-- <template><recycle-list :items="items" :item-height="56" page-mode><div slot-scope="{item, index}"> -->
   <v-list-tile :key="item.title" avatar v-bind:class="{'pq-current': index==currentIndex}" :id="'track'+index" @dragstart="dragStart(index, $event)"  @dragover="dragOver($event)" @drop="drop(index, $event)" draggable>
    <v-list-tile-avatar v-if="item.image" :tile="true">
     <img v-lazy="item.image">
    </v-list-tile-avatar>
    <v-list-tile-avatar v-else-if="item.icon" :tile="true">
     <v-icon>{{item.icon}}</v-icon>
    </v-list-tile-avatar>
    <v-list-tile-content>
     <v-list-tile-title>{{item.title}}</v-list-tile-title>
     <v-list-tile-sub-title>{{item.subtitle}}</v-list-tile-sub-title>
    </v-list-tile-content>
    <v-list-tile-action v-if="item.duration>0" class="pq-time">{{item.duration | displayTime}}</v-list-tile-action>
    <v-list-tile-action v-if="item.actions && item.actions.length>0" @click.stop="itemMenu(item, index, $event)">
     <v-btn icon><v-icon>more_vert</v-icon></v-btn>
    </v-list-tile-action>
    <v-list-tile-action v-else><v-btn icon disabled></v-btn></v-list-tile-action>
   </v-list-tile>
   <v-divider v-if="(index+1 < items.length) && (index!==currentIndex && (index+1)!==currentIndex)"></v-divider>
   <!-- </div></recycle-list></template> -->
  </template>
  <v-list-tile class="lms-list-pad"></v-list-tile>
 </v-list>

 <v-menu offset-y v-model="menu.show" :position-x="menu.x" :position-y="menu.y">
  <v-list v-if="menu.item">
   <template v-for="(action, index) in menu.item.actions">
    <v-divider v-if="action.divider"></v-divider>
    <v-list-tile v-else @click="itemAction(action.cmd, menu.item, menu.index)">
     <v-list-tile-title><v-icon>{{action.icon}}</v-icon>&nbsp;&nbsp;{{action.title}}</v-list-tile-title>
    </v-list-tile>
   </template>
  </v-list>
 </v-menu>
</div>
`,
    props: [ 'desktop' ],
    data() {
        return {
            desktop: false,
            items: [],
            currentIndex: -1,
            dialog: { show:false, title:undefined, hint:undefined, ok: undefined, cancel:undefined},
            listSize:0,
            duration: 0.0,
            playerStatus: { ison:1, shuffle:0, repeat: 0 },
            trans: { ok: undefined, cancel: undefined, scrollToCurrent:undefined, saveAs:undefined, clear:undefined,
                     repeatAll:undefined, repeatOne:undefined, repeatOff:undefined,
                     shuffleAll:undefined, shuffleAlbums:undefined, shuffleOff:undefined },
            menu: { show:false, item: undefined, x:0, y:0, index:0}
        }
    },
    created() {
        this.fetchingItems = false;
        this.timestamp = 0;
        this.currentIndex = -1;
        this.items = [];
        this.isVisible = true;
        this.autoScrollRequired = false;
        this.previousScrollPos = 0;
        this.showTrackNum = getLocalStorageBool('showTrackNum', true);
        lmsCommand("", ["pref", "titleFormatWeb", "?"]).then(({data}) => {
            if (data && data.result && data.result._p2) {
                var idx = parseInt(data.result && data.result._p2);
                lmsCommand("", ["pref", "titleFormat", "?"]).then(({data}) => {
                    if (data && data.result && data.result._p2 && idx<data.result._p2.length) {
                        this.showTrackNum = data.result._p2[idx].includes("TRACKNUM");
                        setLocalStorageVal('showTrackNum', this.showTrackNum);
                    }
                });
            }
        });
    },
    mounted() {
        this.listSize=0;
        this.items=[];
        this.timestamp=0;
        bus.$on('playerChanged', function() {
	        this.items=[];
	        this.timestamp=0;
        }.bind(this));

        bus.$on('playerStatus', function(playerStatus) {
            if (playerStatus.ison!=this.playerStatus.ison) {
                this.playerStatus.ison = playerStatus.ison;
            }
            if (playerStatus.playlist.shuffle!=this.playerStatus.shuffle) {
                this.playerStatus.shuffle = playerStatus.playlist.shuffle;
            }
            if (playerStatus.playlist.repeat!=this.playerStatus.repeat) {
                this.playerStatus.repeat = playerStatus.playlist.repeat;
            }
            /*if (playerStatus.playlist.count!=this.listSize) {
                this.listSize = playerStatus.playlist.count;
                if (0==this.listSize && 0==playerStatus.playlist.timestamp) {
                    this.items=[];
                    this.timestamp=0;
                }
            }*/
            this.playlistName=playerStatus.playlist.name;
            if (playerStatus.playlist.timestamp!==this.timestamp) {
                this.timestamp = playerStatus.playlist.timestamp;
                this.scheduleUpdate();
            } else if (playerStatus.playlist.current!==this.currentIndex) {
                this.currentIndex = playerStatus.playlist.current;
                if (this.$store.state.autoScrollQueue) {
                    this.scrollToCurrent();
                }
            }
        }.bind(this));
        // Refresh status now, in case we were mounted after initial status call
        bus.$emit('refreshStatus');

        if (!this.desktop) {
            // As we scroll the whole page, we need to remember the current position when changing to (e.g.) browse
            // page, so that it can be restored when going back here.
            bus.$on('routeChange', function(from, to) {
                this.isVisible = '/queue'==to;
                if (this.isVisible) {
                    if (this.$store.state.autoScrollQueue && this.autoScrollRequired==true) {
                        this.scheduleUpdate();
                    } else {
                        setTimeout(function () {
                            setScrollTop(this.scrollElement, this.previousScrollPos>0 ? this.previousScrollPos : 0);
                        }.bind(this), 100);
                    }
                } else if (from=='/queue') {
                    this.previousScrollPos = this.scrollElement.scrollTop;
                }
            }.bind(this));
        }
        
        bus.$on('langChanged', function() {
            this.initItems();
        }.bind(this));
        this.initItems();

        this.scrollElement = document.getElementById("queue-list");
        this.scrollElement.addEventListener('scroll', () => {
            if (this.fetchingItems || this.listSize<=this.items.length || (!this.desktop && this.$route.path!='/queue')) {
                return;
            }
            const scrollY = this.scrollElement.scrollTop;
            const visible = this.scrollElement.clientHeight;
            const pageHeight = this.scrollElement.scrollHeight;
            const pad = (visible*2.5);

            const bottomOfPage = visible + scrollY >= (pageHeight-(pageHeight>pad ? pad : 300));

            if (bottomOfPage || pageHeight < visible) {
                this.fetchingItems = true;
                var command = this.buildCommand(this.current);
                var start = this.current.range ? this.current.range.start+this.items.length : this.items.length;
                var count = this.current.range ? (item.range.count-this.items.length) < LMS_BATCH_SIZE ? (item.range.count-this.items.length) : LMS_BATCH_SIZE : LMS_BATCH_SIZE;

                lmsList(this.playerId(), command.command, command.params, start, count).then(({data}) => {
                    this.fetchingItems = false;
                    var resp = parseResp(data, this.showTrackNum);
                    if (resp && resp.items) {
                        resp.items.forEach(i => {
                            this.items.push(i);
                        });
                    }
                    if (data && data.result && data.result.playlist_tracks) {
                        this.listSize = data.result.playlist_tracks;
                    }
                }).catch(err => {
                    this.fetchingItems = false;
                });
            }
        });

        this.$nextTick(function () {
            setScrollTop(this.scrollElement, 0);
            // In case we missed the initial status update, ask for one now - so that we get queue quicker
            bus.$emit('refreshStatus');
        });
    },
    methods: {
        initItems() {
            PQ_PLAY_NOW_ACTION.title=i18n('Play now');
            PQ_PLAY_NEXT_ACTION.title=i18n('Move to next in queue');
            PQ_REMOVE_ACTION.title=i18n('Remove from queue');
            PQ_MORE_ACTION.title=i18n("More");
            this.trans= { ok:i18n('OK'), cancel: i18n('Cancel'),
                          scrollToCurrent:i18n("Scroll to current track"),
                          save:i18n("Save"), clear:i18n("Clear"),
                          repeatAll:i18n("Repeat queue"), repeatOne:i18n("Repeat single track"), repeatOff:i18n("No repeat"),
                          shuffleAll:i18n("Shuffle tracks"), shuffleAlbums:i18n("Shuffle albums"), shuffleOff:i18n("No shuffle") };
        },
        save() {
            if (this.items.length<1) {
                return;
            }
            var value=""+this.playlistName;
            this.dialog={show: true, title: i18n("Save play queue"), hint: i18n("Name"), ok: i18n("Save"), value: value };
        },
        clear() {
            if (this.items.length<1) {
                return;
            }
            this.$confirm(i18n("Remove all tracks from queue?"),
                          {buttonTrueText: i18n('Clear'), buttonFalseText: i18n('Cancel')}).then(res => {
                if (res) {
                    bus.$emit('playerCommand', ["playlist", "clear"]);
                }
            });
        },
        dialogResponse(val) {
            if (val && this.dialog.value) {
                var name = this.dialog.value.trim();
                if (name.length>1) {
                    this.dialog.show = false;
                    lmsCommand(this.$store.state.player.id, ["playlist", "save", name]).then(({datax}) => {
                        this.playlistName = name;
                    }).catch(err => {
                        bus.$emit('showError', err, i18n("Failed to save play queue!"));
                    });
                }
            }
        },
        itemAction(act, item, index) {
            if (PQ_PLAY_NOW_ACTION.cmd===act) {
                bus.$emit('playerCommand', ["playlist", "index", index]);
            } else if (PQ_PLAY_NEXT_ACTION.cmd===act) {
                if (index!==this.currentIndex) {
                    bus.$emit('playerCommand', ["playlist", "move", index, this.currentIndex+1]);
                }
            } else if (PQ_REMOVE_ACTION.cmd===act) {
                bus.$emit('playerCommand', ["playlist", "delete", index]);
            } else if (PQ_MORE_ACTION.cmd===act) {
                if (this.desktop) {
                    bus.$emit('trackInfo', item);
                } else {
                    this.$router.push('/browse');
                    this.$nextTick(function () {
                        bus.$emit('trackInfo', item);
                    });
                }
            }
        },
        itemMenu(item, index, event) {
            this.menu={show:true, item:item, index:index, x:event.clientX, y:event.clientY};
        },
        getDuration() {
            if (this.items.length>0) {
                // Get total duration of queue
                lmsCommand(this.$store.state.player.id, ["status", "-", 1, "tags:DD"]).then(({data}) => {
                    this.duration = data.result && data.result["playlist duration"] ? data.result["playlist duration"] : 0.0;
                });
            } else {
                this.duration = 0.0;
            }
        },
        fetchItems() {
            this.fetchingItems = true;
            var prevTimestamp = this.timestamp;
            var fetchCount = this.currentIndex > this.items.length + LMS_BATCH_SIZE ? this.currentIndex + (LMS_BATCH_SIZE/2) : LMS_BATCH_SIZE;
            lmsList(this.$store.state.player.id, ["status"], [PQ_STATUS_TAGS], this.items.length, fetchCount).then(({data}) => {
                var resp = parseResp(data, this.showTrackNum);
                if (this.items.length && resp.items.length) {
                    resp.items.forEach(i => {
                        this.items.push(i);
                    });
                } else {
                    this.items = resp.items;
                }
                // Check if a 'playlistTimestamp' was received whilst we were updating, if so need
                // to update!
                var needUpdate = this.timestamp!==prevTimestamp && this.timestamp!==timestamp;
                this.timestamp = resp.timestamp;
                this.fetchingItems = false;
                this.listSize = data.result.playlist_tracks;
                if (needUpdate) {
                    this.scheduleUpdate();
                } else {
                    this.getDuration();
                    if (this.$store.state.autoScrollQueue) {
                        this.$nextTick(function () {
                            this.scrollToCurrent();
                        });
                    }
                }
            }).catch(err => {
                this.fetchingItems = false;
            });
        },
        scheduleUpdate() {
            // Debounce updates, incase we have lots of changes together
            if (this.updateTimer) {
                clearTimeout(this.updateTimer);
            }
            this.updateTimer = setTimeout(function () {
                this.updateItems();
            }.bind(this), 50);
        },
        updateItems() {
            if (this.fetchingItems) {
                return;
            }
            if (this.items.length===0) {
                this.fetchItems();
            } else {
                var currentPos = this.scrollElement.scrollTop;
                this.fetchingItems = true;
                var prevTimestamp = this.timestamp;
                lmsList(this.$store.state.player.id, ["status"], [PQ_STATUS_TAGS], 0,
                        this.items.length < LMS_BATCH_SIZE ? LMS_BATCH_SIZE : this.items.length).then(({data}) => {
                    var resp = parseResp(data, this.showTrackNum);
                    this.items = resp.items;
                    var needUpdate = this.timestamp!==prevTimestamp && this.timestamp!==timestamp;
                    this.timestamp = resp.timestamp;
                    this.fetchingItems = false;
                    this.listSize = data.result.playlist_tracks;
                    this.getDuration();
                    this.$nextTick(function () {
                        setScrollTop(this.scrollElement, currentPos>0 ? currentPos : 0);
                    });
                    if (needUpdate) {
                        this.scheduleUpdate();
                    } else {
                        if (this.$store.state.autoScrollQueue) {
                            this.$nextTick(function () {
                                this.scrollToCurrent();
                            });
                        }
                    }
                }).catch(err => {
                    this.fetchingItems = false;
                });
            }
        },
        scrollToCurrent() {
            if (!this.playerStatus.ison) {
                return;
            }
            this.autoScrollRequired = false;
            if (this.items.length>5 && this.currentIndex>0) {
                if (this.isVisible) { // Only scroll page if visible - otherwise we'd scroll the browse/nowplaying page!
                    if (this.currentIndex<this.items.length) {
                        var elem=document.getElementById('track'+this.currentIndex);
                        if (elem) {
                            setScrollTop(this.scrollElement, (this.currentIndex>3 ? this.currentIndex-3 : 0)*(elem.clientHeight+1));
                        }
                    } else {
                        this.autoScrollRequired = true;
                        this.fetchItems();
                    }
                } else {
                    this.autoScrollRequired = true;
                }
            }
        },
        dragStart(which, ev) {
            ev.dataTransfer.dropEffect = 'move';
            ev.dataTransfer.setData('Text', this.id);
            this.dragIndex = which;
            this.stopScrolling = false;
        },
        dragOver(ev) {
            // Drag over item at top/bottom of list to start scrolling
            this.stopScrolling = true;
            if (ev.clientY < 110) {
                this.stopScrolling = false;
                this.scrollList(-5)
            }

            if (ev.clientY > (window.innerHeight - 70)) {
                this.stopScrolling = false;
                this.scrollList(5)
            }
            ev.preventDefault(); // Otherwise drop is never called!
        },
        scrollList(step) {
            setScrollTop(this.scrollElement, this.scrollElement.scrollTop + step);
            if (!this.stopScrolling) {
                setTimeout(function () {
                    this.scrollList(step);
                }.bind(this), 100);
            }
        },
        drop(to, ev) {
            this.stopScrolling = true;
            ev.preventDefault();
            if (this.dragIndex!=undefined && to!=this.dragIndex) {
                bus.$emit('playerCommand', ["playlist", "move", this.dragIndex, to]);
            }
            this.dragIndex = undefined;
        },
        i18n(str) {
            return i18n(str);
        }
    },
    filters: {
        displayTime: function (value, bracket) {
            if (!value) {
                return '';
            }
            if (bracket) {
                if (value<0.000000000001) {
                    return '';
                }
                return " (" + formatSeconds(Math.floor(value)) + ")";
            }
            return formatSeconds(Math.floor(value));
        },
        displayCount: function (value) {
            if (!value) {
                return '';
            }
            return i18np("1 Track", "%1 Tracks", value);
        }
    },
    beforeDestroy() {
        if (undefined!==this.updateTimer) {
            clearTimeout(this.updateTimer);
            this.updateTimer = undefined;
        }
    }
});

