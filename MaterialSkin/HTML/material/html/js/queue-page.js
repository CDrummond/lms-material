/*
 * LMS-Material
 *
 * Copyright (c) 2018 Craig Drummond <craig.p.drummond@gmail.com>
 * MIT license.
 */

var PQ_PLAY_NOW_ACTION =  { cmd: 'playnow',  icon: 'play_circle_outline'   };
var PQ_PLAY_NEXT_ACTION = { cmd: 'playnext', icon: 'play_circle_filled'    };
var PQ_REMOVE_ACTION =    { cmd: 'remove',   icon: 'remove_circle_outline' };

function queueItemCover(item) {
    if (item.artwork_url) {
        return resolveImage(null, item.artwork_url);
    }
    if (item.coverid) {
        return lmsServerAddress+"/music/"+item.coverid+"/cover.jpg";
    }
    return "images/nocover.jpg";
}

function parseResp(data) {
    var resp = { timestamp: 0, items: [], size: 0 };
    if (data.result) {
        resp.timestamp = data.result.playlist_timestamp;
        resp.size = data.result.playlist_tracks;
        
        if (data.result.playlist_loop) {
            data.result.playlist_loop.forEach(i => {
                var title = i.title;
                if (i.tracknum>0) {
                     title = (i.tracknum>9 ? i.tracknum : ("0" + i.tracknum))+" "+title;
                }
                var subtitle = i.artist;
                if (i.album) {
                    if (subtitle) {
                        subtitle+=" ("+i.album+")";
                    } else {
                        sbtitle=i.album;
                    }
                }
                var image = queueItemCover(i);
                var isStream = i.url && (i.url.startsWith("http:") || i.url.startsWith("https:"));
                resp.items.push({
                              url: "track_id:"+i.id,
                              title: title,
                              subtitle: subtitle,
                              icon: image ? undefined : (isStream ? "wifi_tethering" : "music_note"),
                              image: image,
                              actions: [PQ_PLAY_NOW_ACTION, PQ_PLAY_NEXT_ACTION, DIVIDER, PQ_REMOVE_ACTION],
                              duration: i.duration
                          });
            });
        }
    }
    return resp;
}

var lmsQueue = Vue.component("LmsQueue", {
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
      <v-snackbar v-model="snackbar.show" :multi-line="true" :timeout="2500" :color="snackbar.color" top>{{ snackbar.msg }}</v-snackbar>
      <v-card class="subtoolbar pq-details">
        <v-layout>
          <v-flex class="pq-text" v-if="trackCount>0">{{trackCount | displayCount}} {{duration | displayTime(true)}}</v-flex>
          <v-spacer></v-spacer>
          <v-btn flat icon @click.stop="scrollToCurrent()" class="toolbar-button"><v-icon>queue_music</v-icon></v-btn>
          <v-btn flat icon @click.stop="save()" class="toolbar-button"><v-icon>save</v-icon></v-btn>
          <v-btn flat icon @click.stop="clear()" class="toolbar-button"><v-icon>clear_all</v-icon></v-btn>
        </v-layout>
      </v-card>
      <div class="subtoolbar-pad"></div>
      <v-list class="lms-list-page">
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
            <v-list-tile-action v-if="item.actions && item.actions.length>1" @click.stop="itemMenu(item, index, $event)">
              <v-btn icon>
                <v-icon>more_vert</v-icon>
              </v-btn>
            </v-list-tile-action>
          </v-list-tile>
          <v-divider v-if="(index+1 < items.length) && (index!==currentIndex && (index+1)!==currentIndex)"></v-divider>
        <!-- </div></recycle-list></template> -->
        </v-template>
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
    props: [],
    data() {
        return {
            items: [],
            currentIndex: -1,
            snackbar:{ show: false, msg: undefined},
            dialog: { show:false, title:undefined, hint:undefined, ok: undefined, cancel:undefined},
            trackCount:0,
            duration: 0.0,
            trans: { ok: undefined, cancel: undefined },
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

        window.addEventListener('scroll', () => {
            if (this.fetchingItems || this.listSize<=this.items.length || this.$route.path!='/queue') {
                return;
            }
            const scrollY = window.scrollY;
            const el = getScrollElement();
            const visible = el.clientHeight;
            const pageHeight = el.scrollHeight;
            const bottomOfPage = visible + scrollY >= (pageHeight-300);

            if (bottomOfPage || pageHeight < visible) {
                this.fetchItems();
            }
        });
    },
    mounted() {
        this.listSize = this.items.length;
        bus.$on('playerChanged', function() {
	        this.items=[];
	        this.timestamp=0;
        }.bind(this));

        bus.$on('playerStatus', function(playerStatus) {
            if (playerStatus.playlist.count!=this.trackCount) {
                this.trackCount = playerStatus.playlist.count;
            }
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

        // As we scroll the whole page, we need to remember the current position when changing to (e.g.) browse
        // page, so that it can be restored when going back here.
        bus.$on('routeChange', function(from, to, pos) {
            this.isVisible = '/queue'==to;
            if (this.isVisible) {
                if (this.$store.state.autoScrollQueue && this.autoScrollRequired==true) {
                    this.scheduleUpdate();
                } else {
                    this.$nextTick(function () {
                        setScrollTop(this.previousScrollPos>0 ? this.previousScrollPos : 0);
                    });
                }
            } else if (from=='/queue') {
                this.previousScrollPos = pos;
            }
        }.bind(this));
        
        bus.$on('langChanged', function() {
            this.initItems();
        }.bind(this));
        this.initItems();

        this.$nextTick(function () {
            setScrollTop(0);
            // In case we missed the initial status update, ask for one now - so that we get queue quicker
            bus.$emit('refreshStatus');
        });
    },
    methods: {
        initItems() {
            PQ_PLAY_NOW_ACTION.title=i18n('Play now');
            PQ_PLAY_NEXT_ACTION.title=i18n('Move to next in queue');
            PQ_REMOVE_ACTION.title=i18n('Remove from queue');
            this.trans= { ok:i18n('OK'), cancel: i18n('Cancel') };
        },
        showMessage(msg, color) {
            this.snackbar = {msg: msg, show: true, color: undefined==color ? 'error' : color };
        },
        save() {
            if (this.items.length<1) {
                return;
            }
            this.dialog={show: true, title: i18n("Save play queue"), hint: i18n("Name"), ok: i18n("Save"), value: undefined };
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
                    }).catch(err => {
                        this.showMessage(i18n("Failed to save play queue!"), 'error');
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
            lmsList(this.$store.state.player.id, ["status"], ["tags:adcltuK"], this.items.length, fetchCount).then(({data}) => {
                var resp = parseResp(data);
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
                this.listSize = resp.size;
                this.fetchingItems = false;
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
                var currentPos = getScrollTop();
                this.fetchingItems = true;

                lmsList(this.$store.state.player.id, ["status"], ["tags:adcltuK"], 0,
                        this.items.length < LMS_BATCH_SIZE ? LMS_BATCH_SIZE : this.items.length).then(({data}) => {
                    var resp = parseResp(data);
                    this.items = resp.items;
                    this.timestamp = resp.timestamp;
                    this.fetchingItems = false;
                    this.getDuration();
                    this.$nextTick(function () {
                        setScrollTop(currentPos>0 ? currentPos : 0);
                    });
                }).catch(err => {
                    this.fetchingItems = false;
                });
            }
        },
        scrollToCurrent() {
            this.autoScrollRequired = false;
            if (this.items.length>5) {
                if (this.isVisible) { // Only scroll page if visible - otherwise we'd scroll the brows/nowplaying page!
                    // Offset of -68 below to take into account toolbar
                    if (this.currentIndex<=this.items.length) {
                        this.$vuetify.goTo('#track'+(this.currentIndex>3 ? this.currentIndex-3 : 0), {offset: -68, duration: 500});
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
            setScrollTop(getScrollTop() + step);
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

