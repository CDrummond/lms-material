/**
 * LMS-Material
 *
 * Copyright (c) 2018-2019 Craig Drummond <craig.p.drummond@gmail.com>
 * MIT license.
 */

var PQ_PLAY_NOW_ACTION =  { cmd: 'playnow',  icon: 'play_circle_outline'     };
var PQ_PLAY_NEXT_ACTION = { cmd: 'playnext', icon: 'play_circle_filled'      };
var PQ_REMOVE_ACTION =    { cmd: 'remove',   icon: 'remove_circle_outline'   };
var PQ_MORE_ACTION =      { cmd: 'more',     svg:  'more'                    };
var PQ_SELECT_ACTION =    { cmd: 'select',   icon: 'check_box_outline_blank' };
var PQ_UNSELECT_ACTION =  { cmd: 'unselect', icon: 'check_box'               };

const PQ_STATUS_TAGS = "tags:dcltuyAKN";
const PQ_STD_ACTIONS = [PQ_PLAY_NOW_ACTION, PQ_PLAY_NEXT_ACTION, DIVIDER, PQ_REMOVE_ACTION, PQ_SELECT_ACTION, PQ_MORE_ACTION];

function queueItemCover(item) {
    if (item.artwork_url) {
        return resolveImage(null, item.artwork_url);
    }
    if (item.coverid) {
        return lmsServerAddress+"/music/"+item.coverid+"/cover"+LMS_LIST_IMAGE_SIZE;
    }
    return resolveImage("music/0/cover"+LMS_LIST_IMAGE_SIZE);
}

function animate(elem, from, to) {
    var opacity = 0;
    var steps = 10;
    var val = from;
    var orig = elem.style.opacity;
    var origVal = orig ? orig : 1.0;
    var step = (from-to)/steps;
    var interval = setInterval(fadeOut, 40);
    function fadeOut() {
        if (val <= to) {
            clearInterval(interval);
            interval = setInterval(fadeIn, 40);
        } else {
            val-=step;
            elem.style.opacity = origVal * val;
        }
    }
    function fadeIn() {
        if (val >= from) {
            clearInterval(interval);
            elem.style.opacity = orig;
        } else {
            val+=step;
            elem.style.opacity = origVal * val;
        }
    }
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
                var remoteTitle = checkRemoteTitle(i);
                if (i.album) {
                    if (subtitle) {
                        subtitle+=SEPARATOR + i.album;
                    } else {
                        subtitle=i.album;
                    }
                    if (i.year && i.year>0) {
                        subtitle+=" (" + i.year + ")";
                    }
                } else if (remoteTitle && remoteTitle!=i.title) {
                    if (subtitle) {
                        subtitle+=SEPARATOR + remoteTitle;
                    } else {
                        subtitle=remoteTitle;
                    }
                }
                var image = queueItemCover(i);
                resp.items.push({
                              id: "track_id:"+i.id,
                              title: title,
                              subtitle: subtitle,
                              icon: image ? undefined : "music_note",
                              image: image,
                              actions: PQ_STD_ACTIONS,
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
       <v-text-field single-line v-if="dialog.show" :label="dialog.hint" v-model="dialog.value" autofocus @keyup.enter="dialogResponse(true);"></v-text-field>
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

 <div class="subtoolbar pq-details noselect" >
  <v-layout v-if="selection.length>0">
   <v-layout row wrap>
    <v-flex xs12 class="ellipsis subtoolbar-title">{{trans.selectMultiple}}</v-flex>
    <v-flex xs12 class="ellipsis subtoolbar-subtitle subtext">{{selection.length | displaySelectionCount}}</v-flex>
   </v-layout>
   <v-spacer></v-spacer>
   <v-btn :title="trans.remove" flat icon class="toolbar-button" @click="removeSelectedItems()"><v-icon>remove_circle_outline</v-icon></v-btn>
   <v-divider vertical v-if="desktop"></v-divider>
   <v-btn :title="trans.cancel" flat icon class="toolbar-button" @click="clearSelection()"><v-icon>cancel</v-icon></v-btn>
  </v-layout>
  <v-layout v-else>
   <v-layout row wrap v-if="listSize>0 && playlistName">
    <v-flex xs12 class="ellipsis subtoolbar-title">{{listSize | displayCount}} {{duration | displayTime(true)}}</v-flex>
    <v-flex xs12 v-if="playlistName" class="ellipsis subtoolbar-subtitle subtext">{{playlistName}}</v-flex>
   </v-layout>
   <div class="ellipsis subtoolbar-title subtoolbar-title-single" v-else-if="listSize>0">{{listSize | displayCount}} {{duration | displayTime(true)}}</div>
   <v-spacer></v-spacer>
   <v-btn :title="trans.repeatOne" flat icon v-if="desktop && playerStatus.repeat===1" class="toolbar-button" @click="bus.$emit('playerCommand', ['playlist', 'repeat', 0])"><v-icon>repeat_one</v-icon></v-btn>
   <v-btn :title="trans.repeatAll" flat icon v-else-if="desktop && playerStatus.repeat===2" class="toolbar-button" @click="bus.$emit('playerCommand', ['playlist', 'repeat', 1])"><v-icon>repeat</v-icon></v-btn>
   <v-btn :title="trans.repeatOff" flat icon v-else-if="desktop" class="toolbar-button dimmed" @click="bus.$emit('playerCommand', ['playlist', 'repeat', 2])"><v-icon>repeat</v-icon></v-btn>

   <v-btn :title="trans.shuffleAlbums" flat icon v-if="desktop && playerStatus.shuffle===2" class="toolbar-button" @click="bus.$emit('playerCommand', ['playlist', 'shuffle', 0])"><v-icon class="shuffle-albums">shuffle</v-icon></v-btn>
   <v-btn :title="trans.shuffleAll" flat icon v-else-if="desktop && playerStatus.shuffle===1" class="toolbar-button" @click="bus.$emit('playerCommand', ['playlist', 'shuffle', 2])"><v-icon>shuffle</v-icon></v-btn>
   <v-btn :title="trans.shuffleOff" flat icon v-else-if="desktop" class="toolbar-button dimmed" @click="bus.$emit('playerCommand', ['playlist', 'shuffle', 1])"><v-icon>shuffle</v-icon></v-btn>
   <v-divider vertical v-if="desktop"></v-divider>
   <v-btn :title="trans.scrollToCurrent" flat icon @click="scrollToCurrent(true)" class="toolbar-button"><v-icon style="margin-right:4px; margin-top:-10px">arrow_right</v-icon><v-icon style="margin-left:-16px">music_note</v-icon></v-btn>
   <v-btn :title="trans.addUrl" flat icon @click="addUrl()" class="toolbar-button"><v-icon>add</v-icon></v-btn>
   <v-btn :title="trans.save" flat icon @click="save()" class="toolbar-button"><v-icon>save</v-icon></v-btn>
   <v-btn :title="trans.clear" flat icon @click="clear()" class="toolbar-button"><img class="svg-list-img" :src="'queue-clear' | svgIcon(darkUi)"></img></v-btn>
  </v-layout>
 </div>
 <v-list class="lms-list-sub bgnd-cover" id="queue-list">
  <template><RecycleScroller :items="items" :item-size="56" page-mode><div slot-scope="{item, index}">
   <v-list-tile :key="item.title" avatar v-bind:class="{'pq-current': index==currentIndex}" :id="'track'+index" @dragstart="dragStart(index, $event)" @dragover="dragOver($event)" @drop="drop(index, $event)" draggable @click="click(item, index, $event)">
    <v-list-tile-avatar v-if="item.selected" :tile="true" class="lms-avatar">
     <v-icon>check_box</v-icon>
    </v-list-tile-avatar>
    <v-list-tile-avatar v-else-if="item.image" :tile="true" class="lms-avatar">
     <img v-lazy="item.image">
    </v-list-tile-avatar>
    <v-list-tile-avatar v-else-if="item.icon" :tile="true" class="lms-avatar">
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
   </div></RecycleScroller></template>
  <v-list-tile class="lms-list-pad"></v-list-tile>
 </v-list>

 <v-menu offset-y v-model="menu.show" :position-x="menu.x" :position-y="menu.y">
  <v-list v-if="menu.item">
   <template v-for="(action, index) in menu.item.actions">
    <v-divider v-if="action.divider"></v-divider>
    <v-list-tile v-else @click="itemAction(action.cmd, menu.item, menu.index)">
     <v-list-tile-title>
      <div v-if="undefined==action.svg"><v-icon>{{action.icon}}</v-icon>&nbsp;&nbsp;{{action.title}}</div>
      <div v-else><img style="vertical-align: middle" :src="action.svg | svgIcon(darkUi)"></img>&nbsp;&nbsp;{{action.title}}</div>
     </v-list-tile-title>
    </v-list-tile>
   </template>
  </v-list>
 </v-menu>
</div>
`,
    props: [ 'desktop' ],
    data() {
        return {
            items: [],
            currentIndex: -1,
            dialog: { show:false, title:undefined, hint:undefined, ok: undefined, cancel:undefined},
            listSize:0,
            duration: 0.0,
            playerStatus: { ison:1, shuffle:0, repeat: 0 },
            trans: { ok: undefined, cancel: undefined, scrollToCurrent:undefined, addUrl:undefined, saveAs:undefined, clear:undefined,
                     repeatAll:undefined, repeatOne:undefined, repeatOff:undefined,
                     shuffleAll:undefined, shuffleAlbums:undefined, shuffleOff:undefined,
                     selectMultiple:undefined, remove:undefined },
            menu: { show:false, item: undefined, x:0, y:0, index:0},
            playlistName: undefined,
            selection: []
        }
    },
    computed: {
        darkUi () {
            return this.$store.state.darkUi
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
            if (playerStatus.playlist.count!=this.listSize && 0==playerStatus.playlist.count && 0==playerStatus.playlist.timestamp) {
                this.listSize=0;
                this.items=[];
                this.timestamp=0;
                this.lastLoadedPlaylistName=undefined;
                this.playlistName=undefined;
            }
            if (this.lastLoadedPlaylistName!=playerStatus.playlist.name) {
                this.lastLoadedPlaylistName=playerStatus.playlist.name;
                this.playlistName=playerStatus.playlist.name;
            }
            if (playerStatus.playlist.timestamp!==this.timestamp || (playerStatus.playlist.timestamp>0 && this.items.length<1)) {
                this.currentIndex = playerStatus.playlist.current;
                this.timestamp = playerStatus.playlist.timestamp;
                this.scheduleUpdate();
            } else if (playerStatus.playlist.current!==this.currentIndex) {
                this.currentIndex = playerStatus.playlist.current;
                if (this.$store.state.autoScrollQueue) {
                    this.scrollToCurrent();
                }
            }

            // Check for metadata changes in radio streams...
            if (playerStatus.current) {
                var index = playerStatus.current["playlist index"];
                if (undefined!=index && index>=0 && index<this.items.length) {
                    var i = playerStatus.current;
                    var title = i.title;
                    if (this.$store.state.queueShowTrackNum && i.tracknum>0) {
                        title = (i.tracknum>9 ? i.tracknum : ("0" + i.tracknum))+" "+title;
                    }
                    var subtitle = i.artist ? i.artist : i.trackartist;
                    var remoteTitle = checkRemoteTitle(i);
                    if (i.album) {
                        if (subtitle) {
                            subtitle+=SEPARATOR + i.album;
                        } else {
                            subtitle=i.album;
                        }
                        if (i.year && i.year>0) {
                            subtitle+=" (" + i.year + ")";
                        }
                    } else if (remoteTitle && remoteTitle!=i.title) {
                        if (subtitle) {
                            subtitle+=SEPARATOR + remoteTitle;
                        } else {
                            subtitle=remoteTitle;
                        }
                    }
                    if (title!=this.items[index].title || subtitle!=this.items[index].subtitle || i.duration!=this.items[index].duration) {
                        this.items[index].title = title;
                        this.items[index].subtitle = subtitle;
                        if (i.duration!=this.items[index].duration) {
                            this.getDuration();
                        }
                        this.items[index].duration = i.duration;
                        this.$forceUpdate();
                    }
                }
            }
        }.bind(this));
        // Refresh status now, in case we were mounted after initial status call
        bus.$emit('refreshStatus');

        this.coverUrl = undefined;
        this.coverTrackIndex = undefined;
        bus.$on('currentCover', function(coverUrl, queueIndex) {
            this.coverUrl = undefined==coverUrl || coverUrl.endsWith(DEFAULT_COVER) ? undefined : coverUrl;
            this.coverTrackIndex = queueIndex;
            this.setBgndCover();
        }.bind(this));
        bus.$emit('getCurrentCover');

        bus.$on('networkReconnected', function() {
            this.timestamp=0;
            this.scheduleUpdate();
        }.bind(this));

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

        bus.$on('themeChanged', function() {
            this.setBgndCover();
        }.bind(this));

        bus.$on('langChanged', function() {
            this.initItems();
        }.bind(this));
        this.initItems();

        this.scrollElement = document.getElementById("queue-list");
        this.scrollElement.addEventListener('scroll', () => {
            if (this.fetchingItems || this.listSize<=this.items.length) {
                return;
            }
            const scrollY = this.scrollElement.scrollTop;
            const visible = this.scrollElement.clientHeight;
            const pageHeight = this.scrollElement.scrollHeight;
            const pad = (visible*2.5);

            const bottomOfPage = (visible + scrollY) >= (pageHeight-(pageHeight>pad ? pad : 300));

            if (bottomOfPage || pageHeight < visible) {
                this.fetchItems();
            }
        });

        this.setBgndCover();
        this.$nextTick(function () {
            setScrollTop(this.scrollElement, 0);
            // In case we missed the initial status update, ask for one now - so that we get queue quicker
            bus.$emit('refreshStatus');
            this.setBgndCover();
        });
    },
    methods: {
        initItems() {
            PQ_PLAY_NOW_ACTION.title=i18n('Play now');
            PQ_PLAY_NEXT_ACTION.title=i18n('Move to next in queue');
            PQ_REMOVE_ACTION.title=i18n('Remove from queue');
            PQ_MORE_ACTION.title=i18n("More");
            PQ_SELECT_ACTION.title=i18n("Select");
            PQ_UNSELECT_ACTION.title=i18n("Un-select");
            this.trans= { ok:i18n('OK'), cancel: i18n('Cancel'), addUrl:i18n('Add URL'),
                          scrollToCurrent:i18n("Scroll to current track"),
                          save:i18n("Save"), clear:i18n("Clear"),
                          repeatAll:i18n("Repeat queue"), repeatOne:i18n("Repeat single track"), repeatOff:i18n("No repeat"),
                          shuffleAll:i18n("Shuffle tracks"), shuffleAlbums:i18n("Shuffle albums"), shuffleOff:i18n("No shuffle"),
                          selectMultiple:i18n("Select multiple items"), remove:PQ_REMOVE_ACTION.title};
        },
        save() {
            if (this.items.length<1) {
                return;
            }
            var value=""+(undefined==this.playlistName ? "" : this.playlistName);
            this.dialog={show: true, title: i18n("Save play queue"), hint: i18n("Name"), ok: i18n("Save"), value: value, action:'save' };
        },
        addUrl() {
            this.dialog={show: true, title: i18n("Add a URL to play queue"), hint: i18n("URL"), ok: i18n("Add"), value:"http://", action:'add' };
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
                var str = this.dialog.value.trim();
                if (str.length>1) {
                    this.dialog.show = false;

                    if ('add'==this.dialog.action) {
                        lmsCommand(this.$store.state.player.id, ["playlist", this.items.length==0 ? "play" : "add", str]);
                    } else {
                        lmsCommand(this.$store.state.player.id, ["playlist", "save", str]).then(({datax}) => {
                            this.playlistName = str;
                        }).catch(err => {
                            bus.$emit('showError', err, i18n("Failed to save play queue!"));
                            logError(err);
                        });
                    }
                }
            }
        },
        click(item, index, event) {
            if (this.selection.length>0) {
                this.select(item, index);
                return;
            }
            if (this.$store.state.showMenuAudioQueue) {
                this.itemMenu(item, index, event);
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
            } else if (PQ_SELECT_ACTION.cmd===act) {
                var idx=this.selection.indexOf(index);
                if (idx<0) {
                    this.selection.push(index);
                    item.selected = true;
                    idx = item.actions.indexOf(PQ_SELECT_ACTION);
                    if (idx>-1) {
                        item.actions[idx]=PQ_UNSELECT_ACTION;
                    }
                }
            } else if (PQ_UNSELECT_ACTION.cmd===act) {
                var idx=this.selection.indexOf(index);
                if (idx>-1) {
                    this.selection.splice(idx, 1);
                    item.selected = false;
                    idx = item.actions.indexOf(PQ_UNSELECT_ACTION);
                    if (idx>-1) {
                        item.actions[idx]=PQ_SELECT_ACTION;
                    }
                }
            }
        },
        itemMenu(item, index, event) {
            this.menu={show:true, item:item, index:index, x:event.clientX, y:event.clientY};
        },
        removeSelectedItems() {
            this.selection.sort(function(a, b) { return a<b ? 1 : -1; });
            bus.$emit('removeFromQueue', this.selection);
            this.clearSelection();
        },
        clearSelection() {
            this.selection.forEach(index => {
                if (index>-1 && index<this.items.length) {
                    var idx = this.items[index].actions.indexOf(PQ_UNSELECT_ACTION);
                    if (idx>-1) {
                        this.items[index].actions[idx]=PQ_SELECT_ACTION;
                        this.items[index].selected = false;
                    }
                }
            });

            this.selection = [];
        },
        select(item, index) {
            if (this.selection.length>0) {
                this.itemAction(this.selection.indexOf(index)<0 ? PQ_SELECT_ACTION.cmd : PQ_UNSELECT_ACTION.cmd, item, index);
            }
        },
        getDuration() {
            if (this.items.length>0) {
                // Get total duration of queue
                lmsCommand(this.$store.state.player.id, ["status", "-", 1, "tags:DD"]).then(({data}) => {
                    this.duration = data.result && data.result["playlist duration"] ? parseFloat(data.result["playlist duration"]) : 0.0;
                });
            } else {
                this.duration = 0.0;
            }
        },
        fetchItems() {
            if (!this.$store.state.player) {
                return
            }
            this.fetchingItems = true;
            var prevTimestamp = this.timestamp;
            var fetchCount = this.currentIndex > this.items.length + LMS_BATCH_SIZE ? this.currentIndex + (LMS_BATCH_SIZE/2) : LMS_BATCH_SIZE;
            lmsList(this.$store.state.player.id, ["status"], [PQ_STATUS_TAGS], this.items.length, fetchCount).then(({data}) => {
                var resp = parseResp(data, this.$store.state.queueShowTrackNum);
                this.items.push.apply(this.items, resp.items);
                // Check if a 'playlistTimestamp' was received whilst we were updating, if so need
                // to update!
                var needUpdate = this.timestamp!==prevTimestamp && this.timestamp!==resp.timestamp;
                this.timestamp = resp.timestamp;
                this.fetchingItems = false;
                this.listSize = data.result.playlist_tracks;

                this.getDuration();
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
                logError(err);
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
                var prevIndex = this.currentIndex;
                this.fetchingItems = true;
                var prevTimestamp = this.timestamp;
                lmsList(this.$store.state.player.id, ["status"], [PQ_STATUS_TAGS], 0,
                        this.items.length < LMS_BATCH_SIZE ? LMS_BATCH_SIZE : this.items.length).then(({data}) => {
                    var resp = parseResp(data, this.$store.state.queueShowTrackNum);
                    this.items = resp.items;
                    var needUpdate = this.timestamp!==prevTimestamp && this.timestamp!==resp.timestamp;
                    this.timestamp = resp.timestamp;
                    this.fetchingItems = false;
                    this.listSize = data.result.playlist_tracks;
                    this.getDuration();
                    this.$nextTick(function () {
                        setScrollTop(this.scrollElement, currentPos>0 ? currentPos : 0);
                    });

                    if (needUpdate) {
                        this.scheduleUpdate();
                    } else if (prevIndex!=this.currentIndex && this.$store.state.autoScrollQueue) {
                        this.$nextTick(function () {
                            this.scrollToCurrent();
                        });
                    }
                }).catch(err => {
                    this.fetchingItems = false;
                    logError(err);
                });
            }
        },
        scrollToCurrent(pulse) {
            this.autoScrollRequired = false;
            var scroll = this.items.length>5 && this.currentIndex>=0;
            if (scroll || (pulse && this.items.length>0)) {
                if (this.isVisible) { // Only scroll page if visible - otherwise we'd scroll the browse/nowplaying page!
                    if (this.currentIndex<this.items.length) {
                        var elem=document.getElementById('track'+this.currentIndex);
                        if (elem) {
                            if (scroll) {
                                setScrollTop(this.scrollElement, (this.currentIndex>3 ? this.currentIndex-3 : 0)*(elem.clientHeight+1));
                            }
                            if (pulse) {
                                animate(elem, 1.0, 0.2);
                            }
                        }
                    } else if (scroll) {
                        this.autoScrollRequired = true;
                        this.fetchItems();
                    }
                } else if (scroll) {
                    this.autoScrollRequired = true;
                }
            }
        },
        dragStart(which, ev) {
            ev.dataTransfer.dropEffect = 'move';
            ev.dataTransfer.setData('Text', this.id);
            this.dragIndex = which;
            this.stopScrolling = false;
            if (this.selection.length>0 && this.selection.indexOf(which)<0) {
                this.clearSelection();
            }
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
                if (this.selection.length>0) {
                    if (this.selection.indexOf(to)<0) {
                        bus.$emit('moveQueueItems', this.selection.sort(function(a, b) { return a<b ? -1 : 1; }), to);
                    }
                } else {
                    bus.$emit('playerCommand', ["playlist", "move", this.dragIndex, to]);
                }
                this.clearSelection();
            }
            this.dragIndex = undefined;
        },
        i18n(str) {
            return i18n(str);
        },
        setBgndCover() {
            setBgndCover(this.scrollElement, this.$store.state.queueBackdrop ? this.coverUrl : undefined, this.$store.state.darkUi);
            // Check for cover changes in radio streams...
            if (this.coverUrl && undefined!=this.coverTrackIndex && this.coverTrackIndex>=0 && this.coverTrackIndex<this.items.length &&
                this.items[this.coverTrackIndex].image!=this.coverUrl) {
                this.items[this.coverTrackIndex].image=this.coverUrl;
                this.$forceUpdate();
            }
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
        },
        displaySelectionCount: function (value) {
            if (!value) {
                return '';
            }
            return i18np("1 Selected Item", "%1 Selected Items", value);
        },
        svgIcon: function (name, dark) {
            return "html/images/"+name+(dark ? "-dark" : "-light")+".svg?r=" + LMS_MATERIAL_REVISION;
        }
    },
    beforeDestroy() {
        if (undefined!==this.updateTimer) {
            clearTimeout(this.updateTimer);
            this.updateTimer = undefined;
        }
    }
});

