/**
 * LMS-Material
 *
 * Copyright (c) 2018-2019 Craig Drummond <craig.p.drummond@gmail.com>
 * MIT license.
 */

const PQ_STATUS_TAGS = IS_MOBILE ? "tags:cdgltyAKNS" : "tags:cdegltysAKNS";

function queueItemCover(item, infoPlugin) {
    if (item.artwork_url) {
        return resolveImageUrl(item.artwork_url);
    }
    if (item.coverid && !(""+item.coverid).startsWith("-")) {
        return "/music/"+item.coverid+"/cover"+LMS_IMAGE_SIZE;
    }
    if (infoPlugin) {
        if (item.artist_ids) {
            return "/imageproxy/mai/artist/" + item.artist_ids.split(",")[0].trim() + "/image" + LMS_IMAGE_SIZE;
        } else if (item.artist_id) {
            return "/imageproxy/mai/artist/" + item.artist_id + "/image" + LMS_IMAGE_SIZE;
        }
    }
    return resolveImageUrl(LMS_BLANK_COVER);
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

// Record time artist/album was clicked - to prevent context menu also showing.
var lastQueueItemClick = undefined;
function showArtist(id, title) {
    if (lmsNumVisibleMenus>0) { // lmsNumVisibleMenus defined in store.js
        return;
    }
    lastQueueItemClick = new Date();
    bus.$emit("browse", ["albums"], ["artist_id:"+id, "tags:jlys", SORT_KEY+ARTIST_ALBUM_SORT_PLACEHOLDER], unescape(title));
}

function showAlbum(album, title) { // lmsNumVisibleMenus defined in store.js
    if (lmsNumVisibleMenus>0) {
        return;
    }
    lastQueueItemClick = new Date();
    bus.$emit("browse", ["tracks"], ["album_id:"+album, TRACK_TAGS, SORT_KEY+"tracknum"], unescape(title));
}

function showComposer(id, title) {
    if (lmsNumVisibleMenus>0) { // lmsNumVisibleMenus defined in store.js
        return;
    }
    lastQueueItemClick = new Date();
    bus.$emit("browse", ["albums"], ["artist_id:"+id, "tags:jlys", SORT_KEY+ARTIST_ALBUM_SORT_PLACEHOLDER, "role_id:COMPOSER"], unescape(title));
}

function buildSubtitle(i, threeLines) {
    var subtitle = undefined;
    if (i.composer && i.genre && LMS_COMPOSER_GENRES.has(i.genre)) {
        var composer_ids = !IS_MOBILE && i.composer_ids ? i.composer_ids.split(",") : undefined;
        if (composer_ids && 1==composer_ids.length) {
            subtitle=addPart(subtitle, "<a href=\"#\" onclick=\"showComposer("+composer_ids[0]+",\'"+escape(i.composer)+"\')\">" + i.composer + "</a>");
        } else {
            subtitle=addPart(subtitle, i.composer);
        }
    }

    if (i.artist) {
        if (!IS_MOBILE && undefined!=i.artist_id) {
            subtitle=addPart(subtitle, "<a href=\"#\" onclick=\"showArtist("+i.artist_id+",\'"+escape(i.artist)+"\')\">" + i.artist + "</a>");
        } else {
            subtitle=addPart(subtitle, i.artist);
        }
    } else if (i.trackartist) {
        if (!IS_MOBILE && (undefined!=i.trackartist_id || undefined!=i.artist_id)) {
            subtitle=addPart(subtitle, "<a href=\"#\" onclick=\"showArtist("+(undefined!=i.trackartist_id ? i.trackartist_id : i.artist_id)+",\'"+escape(i.trackartist)+"\')\">" + i.trackartist + "</a>");
        } else {
            subtitle=addPart(subtitle, i.trackartist);
        }
    }

    var lines = [];
    if (threeLines) {
        lines.push(subtitle);
        subtitle = undefined;
    }
    var remoteTitle = checkRemoteTitle(i);
    if (i.album) {
        var album = i.album;
        if (i.year && i.year>0) {
            album+=" (" + i.year + ")";
        }
        if (i.album_id && !IS_MOBILE) {
            album="<a href=\"#\" onclick=\"showAlbum("+i.album_id+",\'"+escape(album)+"\')\">" + album + "</a>";
        }
        subtitle=addPart(subtitle, album);
    } else if (remoteTitle && remoteTitle!=i.title) {
        subtitle=addPart(subtitle, remoteTitle);
    }
    if (threeLines) {
        lines.push(subtitle);
        return lines;
    }
    return subtitle;
}

function parseResp(data, showTrackNum, index, showRatings, threeLines, infoPlugin) {
    logJsonMessage("RESP", data);
    var resp = { timestamp: 0, items: [], size: 0 };
    if (data.result) {
        resp.timestamp = data.result.playlist_timestamp;
        resp.size = data.result.playlist_tracks;

        if (data.result.playlist_loop) {
            for (var idx=0, loop=data.result.playlist_loop, loopLen=loop.length; idx<loopLen; ++idx) {
                var i = loop[idx];
                var title = i.title;
                if (showTrackNum && i.tracknum>0) {
                    title = (i.tracknum>9 ? i.tracknum : ("0" + i.tracknum))+SEPARATOR+title;
                }

                var duration = undefined==i.duration ? undefined : parseInt(i.duration);
                resp.items.push({
                              id: "track_id:"+i.id,
                              title: !showRatings || undefined==i.rating ? title : ratingString(title, i.rating),
                              subtitle: buildSubtitle(i, threeLines),
                              image: queueItemCover(i, infoPlugin),
                              actions: [PQ_PLAY_NOW_ACTION, PQ_PLAY_NEXT_ACTION, DIVIDER, PQ_REMOVE_ACTION, PQ_SELECT_ACTION, PQ_MORE_ACTION],
                              duration: duration,
                              durationStr: undefined!=duration && duration>0 ? formatSeconds(duration) : undefined,
                              key: i.id+"."+index
                          });
                index++;
            }
        }
    }
    return resp;
}

var lmsQueue = Vue.component("lms-queue", {
  template: `
<div> 
 <v-dialog v-model="dialog.show" persistent max-width="500px">
  <v-card>
   <v-card-title>{{dialog.title}}</v-card-title>
   <v-card-text>
    <v-text-field single-line v-if="dialog.show" :label="dialog.hint" v-model="dialog.value" autofocus @keyup.enter="dialogResponse(true);"></v-text-field>
   </v-card-text>
   <v-card-actions>
    <v-spacer></v-spacer>
    <v-btn flat @click.native="dialog.show = false; dialogResponse(false);">{{undefined===dialog.cancel ? trans.cancel : dialog.cancel}}</v-btn>
    <v-btn flat @click.native="dialogResponse(true);">{{undefined===dialog.ok ? trans.ok : dialog.ok}}</v-btn>
   </v-card-actions>
  </v-card>
 </v-dialog>

 <div class="subtoolbar list-details noselect" >
  <v-layout v-if="selection.size>0">
   <v-layout row wrap>
    <v-flex xs12 class="ellipsis subtoolbar-title subtoolbar-pad">{{trans.selectMultiple}}</v-flex>
    <v-flex xs12 class="ellipsis subtoolbar-subtitle subtext">{{selection.size | displaySelectionCount}}</v-flex>
   </v-layout>
   <v-spacer></v-spacer>
   <v-btn :title="trans.remove" flat icon class="toolbar-button" @click="removeSelectedItems()"><v-icon>remove_circle_outline</v-icon></v-btn>
   <v-divider vertical v-if="desktop"></v-divider>
   <v-btn :title="trans.cancel" flat icon class="toolbar-button" @click="clearSelection()"><v-icon>cancel</v-icon></v-btn>
  </v-layout>
  <v-layout v-else>
   <div class="ellipsis subtoolbar-title subtoolbar-title-single" v-if="listSize>0">{{listSize | displayCount}}{{duration | displayTime(true)}}</div>
   <v-spacer></v-spacer>
   <v-btn :title="trans.repeatOne" flat icon v-if="(desktop || wide>0) && playerStatus.repeat===1" class="toolbar-button" @click="bus.$emit('playerCommand', ['playlist', 'repeat', 0])"><v-icon class="active-btn">repeat_one</v-icon></img></v-btn>
   <v-btn :title="trans.repeatAll" flat icon v-else-if="(desktop || wide>0) && playerStatus.repeat===2" class="toolbar-button" @click="bus.$emit('playerCommand', ['playlist', 'repeat', 1])"><v-icon class="active-btn">repeat</v-icon></v-btn>
   <v-btn :title="trans.dstm" flat icon v-else-if="(desktop || wide>0) && dstm" class="toolbar-button" @click="bus.$emit('dlg.open', 'dstm')"><v-icon class="active-btn">all_inclusive</v-icon></v-btn>
   <v-btn :title="trans.repeatOff" flat icon v-else-if="desktop || wide>0" class="toolbar-button dimmed" v-longpress="repeatOff"><v-icon>repeat</v-icon></v-btn>

   <v-btn :title="trans.shuffleAlbums" flat icon v-if="(desktop || wide>0) && playerStatus.shuffle===2" class="toolbar-button" @click="bus.$emit('playerCommand', ['playlist', 'shuffle', 0])"><v-icon class="shuffle-albums active-btn">shuffle</v-icon></v-btn>
   <v-btn :title="trans.shuffleAll" flat icon v-else-if="(desktop || wide>0) && playerStatus.shuffle===1" class="toolbar-button" @click="bus.$emit('playerCommand', ['playlist', 'shuffle', 2])"><v-icon class="active-btn">shuffle</v-icon></v-btn>
   <v-btn :title="trans.shuffleOff" flat icon v-else-if="desktop || wide>0" class="toolbar-button dimmed" @click="bus.$emit('playerCommand', ['playlist', 'shuffle', 1])"><v-icon>shuffle</v-icon></v-btn>
   <v-divider vertical v-if="desktop || wide>0"></v-divider>
   <template v-if="desktop || wide>1" v-for="(action, index) in settingsMenuActions">
    <v-btn flat icon @click.stop="headerAction(action)" class="toolbar-button" :title="ACTIONS[action].title | tooltip(ACTIONS[action].shortcut,keyboardControl)" :id="'tbar'+index">
      <img v-if="ACTIONS[action].svg" class="svg-img" :src="ACTIONS[action].svg | svgIcon(darkUi)"></img>
      <v-icon v-else>{{ACTIONS[action].icon}}</v-icon>
    </v-btn>
   </template>
   <v-btn :title="trans.save | tooltip(trans.saveShortcut,keyboardControl)" flat icon @click="save()" class="toolbar-button"><v-icon>save</v-icon></v-btn>
   <v-btn :title="trans.clear | tooltip(trans.clearShortcut,keyboardControl)" flat icon @click="clear()" class="toolbar-button"><img class="svg-list-img" :src="'queue-clear' | svgIcon(darkUi)"></img></v-btn>
  </v-layout>
 </div>
 <v-list class="lms-list-sub bgnd-cover" id="queue-list" v-bind:class="{'lms-list-sub3':threeLines}">
 <RecycleScroller v-if="items.length>LMS_MAX_NON_SCROLLER_ITEMS && threeLines" :items="items" :item-size="LMS_LIST_3LINE_ELEMENT_SIZE" page-mode key-field="key">
   <v-list-tile avatar v-bind:class="{'pq-current': index==currentIndex}" @dragstart="dragStart(index, $event)" @dragend="dragEnd()" @dragover="dragOver($event)" @drop="drop(index, $event)" draggable @click="click(item, index, $event)" slot-scope="{item, index}" key-field="key">
    <v-list-tile-avatar :tile="true" v-bind:class="{'radio-image': 0==item.duration}" class="lms-avatar">
     <v-icon v-if="item.selected">check_box</v-icon>
     <img v-else :key="item.image" :src="item.image"></img>
    </v-list-tile-avatar>
    <v-list-tile-content>
     <v-list-tile-title v-html="item.title"></v-list-tile-title>
     <v-list-tile-sub-title v-html="item.subtitle[0]"></v-list-tile-sub-title>
     <v-list-tile-sub-title v-html="item.subtitle[1]"></v-list-tile-sub-title>
    </v-list-tile-content>
    <v-list-tile-action class="pq-time">{{item.durationStr}}</v-list-tile-action>
    <v-list-tile-action class="queue-action" @click.stop="itemMenu(item, index, $event)">
     <v-btn icon><v-icon>more_vert</v-icon></v-btn>
    </v-list-tile-action>
   </v-list-tile>
  </RecycleScroller>
  <RecycleScroller v-if="items.length>LMS_MAX_NON_SCROLLER_ITEMS" :items="items" :item-size="LMS_LIST_ELEMENT_SIZE" page-mode key-field="key">
   <v-list-tile avatar v-bind:class="{'pq-current': index==currentIndex}" @dragstart="dragStart(index, $event)" @dragend="dragEnd()" @dragover="dragOver($event)" @drop="drop(index, $event)" draggable @click="click(item, index, $event)" slot-scope="{item, index}" key-field="key">
    <v-list-tile-avatar :tile="true" v-bind:class="{'radio-image': 0==item.duration}" class="lms-avatar">
     <v-icon v-if="item.selected">check_box</v-icon>
     <img v-else :key="item.image" :src="item.image"></img>
    </v-list-tile-avatar>
    <v-list-tile-content>
     <v-list-tile-title v-html="item.title"></v-list-tile-title>
     <v-list-tile-sub-title v-html="item.subtitle"></v-list-tile-sub-title>
    </v-list-tile-content>
    <v-list-tile-action class="pq-time">{{item.durationStr}}</v-list-tile-action>
    <v-list-tile-action class="queue-action" @click.stop="itemMenu(item, index, $event)">
     <v-btn icon><v-icon>more_vert</v-icon></v-btn>
    </v-list-tile-action>
   </v-list-tile>
  </RecycleScroller>
  <template v-else v-for="(item, index) in items">
   <v-list-tile :key="item.key" avatar v-bind:class="{'pq-current': index==currentIndex}" :id="'track'+index" @dragstart="dragStart(index, $event)" @dragend="dragEnd()" @dragover="dragOver($event)" @drop="drop(index, $event)" draggable @click="click(item, index, $event)" class="lms-list-item">
    <v-list-tile-avatar :tile="true" v-bind:class="{'radio-image': 0==item.duration}" class="lms-avatar">
     <v-icon v-if="item.selected">check_box</v-icon>
     <img v-else :key="item.image" :src="item.image"></img>
    </v-list-tile-avatar>
    <v-list-tile-content>
     <v-list-tile-title v-html="item.title"></v-list-tile-title>
     <v-list-tile-sub-title v-if="!threeLines" v-html="item.subtitle"></v-list-tile-sub-title>
     <v-list-tile-sub-title v-if="threeLines" v-html="item.subtitle[0]"></v-list-tile-sub-title>
     <v-list-tile-sub-title v-if="threeLines" v-html="item.subtitle[1]"></v-list-tile-sub-title>
    </v-list-tile-content>
    <v-list-tile-action class="pq-time">{{item.durationStr}}</v-list-tile-action>
    <v-list-tile-action class="queue-action" @click.stop="itemMenu(item, index, $event)">
     <v-btn icon><v-icon>more_vert</v-icon></v-btn>
    </v-list-tile-action>
   </v-list-tile>
  </template>
  <v-list-tile class="lms-list-pad"></v-list-tile>
 </v-list>

 <v-menu offset-y v-model="menu.show" :position-x="menu.x" :position-y="menu.y">
  <v-list v-if="menu.item">
   <template v-for="(action, index) in menu.item.actions">
    <v-divider v-if="DIVIDER==action"></v-divider>
    <v-list-tile v-else @click="itemAction(action, menu.item, menu.index, $event)">
     <v-list-tile-avatar v-if="menuIcons">
      <v-icon v-if="undefined==ACTIONS[action].svg">{{ACTIONS[action].icon}}</v-icon>
      <img v-else class="svg-img" :src="ACTIONS[action].svg | svgIcon(darkUi)"></img>
     </v-list-tile-avatar>
     <v-list-tile-title>{{ACTIONS[action].title}}</v-list-tile-title>
    </v-list-tile>
   </template>
  </v-list>
 </v-menu>
</div>
`,
    props: [ 'desktop', 'mini', 'nowplaying' ],
    data() {
        return {
            items: [],
            currentIndex: -1,
            dialog: { show:false, title:undefined, hint:undefined, ok: undefined, cancel:undefined},
            listSize:0,
            duration: 0.0,
            playerStatus: { shuffle:0, repeat: 0 },
            trans: { ok: undefined, cancel: undefined, save:undefined, saveShortcut:undefined, clear:undefined, clearShortcut:undefined,
                     repeatAll:undefined, repeatOne:undefined, repeatOff:undefined, shuffleAll:undefined, shuffleAlbums:undefined,
                     shuffleOff:undefined, selectMultiple:undefined, remove:undefined, dstm:undefined },
            menu: { show:false, item: undefined, x:0, y:0, index:0},
            selection: new Set(),
            settingsMenuActions: [PQ_MOVE_QUEUE_ACTION, PQ_SCROLL_ACTION, PQ_ADD_URL_ACTION],
            wide: 0,
            dstm: false
        }
    },
    computed: {
        darkUi () {
            return this.$store.state.darkUi
        },
        menuIcons() {
            return this.$store.state.menuIcons
        },
        threeLines() {
            return this.$store.state.queueThreeLines
        },
        keyboardControl() {
            return this.$store.state.keyboardControl && !IS_MOBILE
        }
    },
    created() {
        this.fetchingItems = false;
        this.timestamp = 0;
        this.currentIndex = -1;
        this.items = [];
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
        bus.$on('queueDisplayChanged', function() {
            this.items=[];
            this.timestamp=0;
            this.updateItems();
        }.bind(this));

        bus.$on('playerStatus', function(playerStatus) {
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
            }
            this.playlistName=playerStatus.playlist.name;
            if (playerStatus.playlist.timestamp!=this.timestamp || (playerStatus.playlist.timestamp>0 && this.items.length<1) ||
                (playerStatus.playlist.timestamp<=0 && this.items.length>0) || this.listSize!=playerStatus.playlist.count) {
                this.currentIndex = playerStatus.playlist.current;
                this.timestamp = playerStatus.playlist.timestamp;
                this.updateItems();
            } else if (playerStatus.playlist.current!=this.currentIndex) {
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
                        title = (i.tracknum>9 ? i.tracknum : ("0" + i.tracknum))+SEPARATOR+title;
                    }
                    if (this.$store.state.ratingsSupport && undefined!=i.rating) {
                        title=ratingString(title, i.rating);
                    }
                    var subtitle = buildSubtitle(i, this.$store.state.queueThreeLines);
                    var remoteTitle = checkRemoteTitle(i);

                    if (title!=this.items[index].title || subtitle!=this.items[index].subtitle || i.duration!=this.items[index].duration) {
                        this.items[index].title = title;
                        this.items[index].subtitle = subtitle;
                        if (i.duration!=this.items[index].duration) {
                            this.items[index].durationStr = i.duration && i.duration>0 ? formatSeconds(Math.floor(i.duration)) : undefined;
                            this.items[index].duration = i.duration;
                            this.getDuration();
                        }

                        this.$forceUpdate();
                    }
                }
            }
        }.bind(this));

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
            this.updateItems();
        }.bind(this));

        bus.$on('themeChanged', function() {
            this.setBgndCover();
        }.bind(this));

        bus.$on('langChanged', function() {
            this.initItems();
        }.bind(this));
        this.initItems();

        bus.$on('esc', function() {
            this.menu.show = false;
        }.bind(this));

        this.scrollElement = document.getElementById("queue-list");
        this.scrollElement.addEventListener('scroll', () => {
            this.menu.show = false;
            if (!this.scrollAnimationFrameReq) {
                this.scrollAnimationFrameReq = window.requestAnimationFrame(this.handleScroll);
            }
        });

        this.setBgndCover();
        this.$nextTick(function () {
            setScrollTop(this.scrollElement, 0);
            // In case we missed the initial status update, ask for one now - so that we get queue quicker
            bus.$emit('refreshStatus');
            this.setBgndCover();
        });

        if (!this.desktop) {
            bus.$on('pageChanged', function(page) {
                if ('queue'==page) {
                    if (this.$store.state.autoScrollQueue && this.autoScrollRequired) {
                        this.$nextTick(function () {
                            this.scrollToCurrent();
                        });
                    }
                }
            }.bind(this));
            // Long-press on 'queue' nav button whilst in queue scrolls to current track
            bus.$on('nav', function(page, longPress) {
                if ('queue'==page && longPress) {
                    this.scrollToCurrent(true);
                }
            }.bind(this));
            bus.$on('settingsMenuAction:queue', function(action) {
                this.headerAction(action);
            }.bind(this));

            bus.$on('windowWidthChanged', function() {
                var wide = window.innerWidth >= 520 ? 2 : window.innerWidth>=340 ? 1 : 0;
                if (wide!=this.wide) {
                    this.wide = wide;
                    bus.$emit('settingsMenuActions', this.wide>1 ? [] : this.settingsMenuActions, 'queue');
                }
            }.bind(this));
            this.wide = window.innerWidth >= 520 ? 2 : window.innerWidth>=340 ? 1 : 0;
            bus.$emit('settingsMenuActions', this.wide>1 ? [] : this.settingsMenuActions, 'queue');
        }
        bus.$on('noPlayers', function() {
            this.updateSettingsMenu();
        }.bind(this));
        bus.$on('playerListChanged', function() {
            this.updateSettingsMenu();
        }.bind(this));
        bus.$on('prefset', function(pref, value) {
            if ("plugin.dontstopthemusic:provider"==pref) {
                this.dstm = (""+value)!="0";
            }
        }.bind(this));
        this.updateSettingsMenu();
        if (!IS_MOBILE) {
            bindKey(LMS_SAVE_QUEUE_KEYBOARD, 'mod');
            bindKey(LMS_CLEAR_QUEUE_KEYBOARD, 'mod');
            bindKey(LMS_QUEUE_ADD_URL_KEYBOARD, 'mod');
            bindKey(LMS_SCROLL_QUEUE_KEYBOARD, 'mod');
            bindKey(LMS_MOVE_QUEUE_KEYBOARD, 'mod');
            bus.$on('keyboard', function(key, modifier) {
                if ('mod'!=modifier || (!this.desktop && this.$store.state.page!="queue" || this.$store.state.openDialogs.length>0)) {
                    return;
                }
                if (LMS_SAVE_QUEUE_KEYBOARD==key) {
                    if (this.$store.state.visibleMenus.size>0) {
                        return;
                    }
                    this.save();
                } else if (LMS_CLEAR_QUEUE_KEYBOARD==key) {
                    if (this.$store.state.visibleMenus.size>0) {
                        return;
                    }
                    this.clear();
                } else if (LMS_QUEUE_ADD_URL_KEYBOARD==key || LMS_SCROLL_QUEUE_KEYBOARD==key || LMS_MOVE_QUEUE_KEYBOARD==key) {
                    if (this.$store.state.visibleMenus.size>1 || (this.wide<=1 && this.$store.state.visibleMenus==1 && !this.$store.state.visibleMenus.has('main'))) {
                        return;
                    }
                    this.headerAction(LMS_QUEUE_ADD_URL_KEYBOARD==key ? PQ_ADD_URL_ACTION : LMS_SCROLL_QUEUE_KEYBOARD==key ? PQ_SCROLL_ACTION : PQ_MOVE_QUEUE_ACTION);
                    bus.$emit('hideMenu', 'main');
                }
            }.bind(this));
        }
    },
    methods: {
        initItems() {
            this.trans= { ok:i18n('OK'), cancel: i18n('Cancel'), save:i18n("Save queue"), saveShortcut:i18n("Ctrl(⌘)+%1", LMS_SAVE_QUEUE_KEYBOARD),
                          clear:i18n("Clear queue"), clearShortcut:i18n("Ctrl(⌘)+%1", LMS_CLEAR_QUEUE_KEYBOARD),
                          repeatAll:i18n("Repeat queue"), repeatOne:i18n("Repeat single track"), repeatOff:i18n("No repeat"),
                          shuffleAll:i18n("Shuffle tracks"), shuffleAlbums:i18n("Shuffle albums"), shuffleOff:i18n("No shuffle"),
                          selectMultiple:i18n("Select multiple items"), remove:PQ_REMOVE_ACTION.title, dstm:i18n("Don't Stop The Music")};
        },
        handleScroll() {
            this.scrollAnimationFrameReq = undefined;
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
        },
        save() {
            if (this.items.length<1) {
                bus.$emit('showMessage', i18n('Queue is empty'));
                return;
            }
            var value=""+(undefined==this.playlistName ? "" : this.playlistName);
            this.dialog={show: true, title: i18n("Save play queue"), hint: i18n("Name"), ok: i18n("Save"), value: value, action:'save'};
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
                        lmsCommand(this.$store.state.player.id, ["playlist", this.items.length==0 ? "play" : "add", str]).then(({data}) => {
                            bus.$emit('refreshStatus');
                        });
                    } else {
                        lmsCommand(this.$store.state.player.id, ["playlist", "save", str]).then(({data})=>{
                            bus.$emit('refreshPlaylist', str);
                        }).catch(err => {
                            bus.$emit('showError', err, i18n("Failed to save play queue!"));
                            logError(err);
                        });
                    }
                }
            }
        },
        click(item, index, event) {
            if (this.selection.size>0) {
                this.select(item, index, event);
                return;
            }
            if (this.menu.show) {
                this.menu.show=false;
                return;
            }
            if (this.$store.state.visibleMenus.size>0) {
                return;
            }
            if (!this.clickTimer) {
                this.clickTimer = setTimeout(function () {
                    this.clickTimer = undefined;
                    this.singleClick(item, index, event);
                }.bind(this), LMS_DOUBLE_CLICK_TIMEOUT);
            } else {
                clearTimeout(this.clickTimer);
                this.clickTimer = undefined;
                this.doubleClick(item, index, event);
            }
        },
        singleClick(item, index, event) {
            if (this.$store.state.showMenuAudioQueue && (!lastQueueItemClick || ((new Date())-lastQueueItemClick)>500)) {
                lastQueueItemClick = undefined;
                this.itemMenu(item, index, event);
            }
        },
        doubleClick(item, index, event) {
            this.itemAction(PQ_PLAY_NOW_ACTION, item, index);
        },
        itemAction(act, item, index, event) {
            if (PQ_PLAY_NOW_ACTION===act) {
                bus.$emit('playerCommand', ["playlist", "index", index]);
            } else if (PQ_PLAY_NEXT_ACTION===act) {
                if (index!==this.currentIndex) {
                    bus.$emit('playerCommand', ["playlist", "move", index, index>this.currentIndex ? this.currentIndex+1 : this.currentIndex]);
                }
            } else if (PQ_REMOVE_ACTION===act) {
                bus.$emit('playerCommand', ["playlist", "delete", index]);
            } else if (PQ_MORE_ACTION===act) {
                bus.$emit('trackInfo', item, index, 'queue');
                if (!this.desktop) {
                    this.$store.commit('setPage', 'browse');
                }
            } else if (PQ_SELECT_ACTION===act) {
                if (!this.selection.has(index)) {
                    this.selection.add(index);
                    item.selected = true;
                    var idx = item.actions.indexOf(PQ_SELECT_ACTION);
                    if (idx>-1) {
                        item.actions[idx]=PQ_UNSELECT_ACTION;
                    }
                    forceItemUpdate(this, item);
                    if (event && event.shiftKey) {
                        if (undefined!=this.selectStart) {
                            for (var i=this.selectStart<index ? this.selectStart : index, stop=this.selectStart<index ? index : this.selectStart, len=this.items.length; i<=stop && i<len; ++i) {
                                this.itemAction(PQ_SELECT_ACTION, this.items[i], i);
                            }
                            this.selectStart = undefined;
                        } else {
                            this.selectStart = index;
                        }
                    } else {
                        this.selectStart = undefined;
                    }
                } else {
                    this.selectStart = undefined;
                }
            } else if (PQ_UNSELECT_ACTION===act) {
                this.selectStart = undefined;
                if (this.selection.has(index)) {
                    this.selection.delete(idx);
                    item.selected = false;
                    var idx = item.actions.indexOf(PQ_UNSELECT_ACTION);
                    if (idx>-1) {
                        item.actions[idx]=PQ_SELECT_ACTION;
                    }
                    forceItemUpdate(this, item);
                }
            }
        },
        headerAction(act) {
            if (this.$store.state.visibleMenus.size>0 && (this.desktop || this.settingsMenuActions.indexOf(act)<0)) {
                return;
            }
            if (act==PQ_ADD_URL_ACTION) {
                this.dialog={show: true, title: i18n("Add a URL to play queue"), hint: i18n("URL"), ok: i18n("Add"), value:"http://", action:'add'};
            } else if (act==PQ_SCROLL_ACTION) {
                if (this.items.length<1) {
                    bus.$emit('showMessage', i18n('Nothing playing'));
                } else {
                    this.scrollToCurrent(true);
                }
            } else if (act==PQ_MOVE_QUEUE_ACTION) {
                if (!this.$store.state.player || !this.$store.state.players || this.$store.state.players.length<2) {
                    return;
                } else if (this.items.length<1) {
                    bus.$emit('showMessage', i18n('Queue is empty'));
                } else {
                    bus.$emit('dlg.open', 'movequeue', this.$store.state.player);
                }
            }
        },
        itemMenu(item, index, event) {
            showMenu(this, {show:true, item:item, index:index, x:event.clientX, y:event.clientY});
        },
        removeSelectedItems() {
            var selection = Array.from(this.selection);
            selection.sort(function(a, b) { return a<b ? 1 : -1; });
            bus.$emit('removeFromQueue', selection);
            this.clearSelection();
        },
        clearSelection() {
            this.selectStart = undefined;
            var selection = Array.from(this.selection);
            for (var i=0, len=selection.size; i<len; ++i) {
                var index = selection[i];
                if (index>-1 && index<this.items.length) {
                    var idx = this.items[index].actions.indexOf(PQ_UNSELECT_ACTION);
                    if (idx>-1) {
                        this.items[index].actions[idx]=PQ_SELECT_ACTION;
                    }
                    this.items[index].selected = false;
                }
            }
            if (this.selection.size>0 && this.items.length>LMS_MAX_NON_SCROLLER_ITEMS) {
                this.$nextTick(function () {
                    this.items = JSON.parse(JSON.stringify(this.items));
                });
            }
            this.selection = new Set();
        },
        select(item, index, event) {
            if (this.selection.size>0) {
                this.itemAction(this.selection.has(index) ? PQ_UNSELECT_ACTION : PQ_SELECT_ACTION, item, index, event);
            }
        },
        getDuration() {
            if (this.items.length>0) {
                if (this.items.length==this.listSize) {
                    // Have all tracks, so sum durations...
                    var duration = 0;
                    for (var i=0; i<this.listSize; ++i) {
                        if (this.items[i].duration!=undefined && this.items[i].duration>0) {
                            duration+=this.items[i].duration;
                        }
                    }
                    this.duration = duration;
                    bus.$emit("queueStatus", this.listSize, this.duration);
                } else {
                    // Don't have all tracks, so ask LMS for total duration...
                    lmsCommand(this.$store.state.player.id, ["status", "-", 1, "tags:DD"]).then(({data}) => {
                        this.duration = data.result && data.result["playlist duration"] ? parseFloat(data.result["playlist duration"]) : 0.0;
                        bus.$emit("queueStatus", this.listSize, this.duration);
                    });
                }
            } else {
                this.duration = 0.0;
                bus.$emit("queueStatus", this.listSize, this.duration);
            }
        },
        checkCover() {
            if (this.currentIndex!=undefined && this.currentIndex>=0 && this.currentIndex<this.items.length) {
                var indexUrl=changeImageSizing(this.items[this.currentIndex].image);
                if (indexUrl) {
                    var plainUrl=changeImageSizing(this.coverUrl);
                    if (indexUrl!=plainUrl) {
                        // Background image different to current queue item? Refresh player status...
                        bus.$emit('refreshStatus');
                    }
                }
            }
        },
        fetchItems() {
            if (!this.$store.state.player) {
                return
            }
            this.fetchingItems = true;
            var prevTimestamp = this.timestamp;
            var fetchCount = this.currentIndex > this.items.length + LMS_QUEUE_BATCH_SIZE ? this.currentIndex + 50 : LMS_QUEUE_BATCH_SIZE;
            lmsList(this.$store.state.player.id, ["status"], [PQ_STATUS_TAGS + (!IS_MOBILE && this.$store.state.ratingsSupport ? "R" : "")], this.items.length, fetchCount).then(({data}) => {
                var resp = parseResp(data, this.$store.state.queueShowTrackNum, this.items.length, this.desktop && this.$store.state.ratingsSupport, this.$store.state.queueThreeLines, this.$store.state.infoPlugin);
                this.items.push.apply(this.items, resp.items);
                // Check if a 'playlistTimestamp' was received whilst we were updating, if so need
                // to update!
                var needUpdate = this.timestamp!==prevTimestamp && this.timestamp!==resp.timestamp;
                this.timestamp = resp.timestamp;
                this.fetchingItems = false;
                this.listSize = resp.size;
                this.checkCover();
                this.getDuration();
                if (needUpdate) {
                    this.$nextTick(function () {
                        this.updateItems();
                    });
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
                lmsList(this.$store.state.player.id, ["status"], [PQ_STATUS_TAGS + (!IS_MOBILE && this.$store.state.ratingsSupport ? "R" : "")], 0,
                        this.items.length < LMS_QUEUE_BATCH_SIZE ? LMS_QUEUE_BATCH_SIZE : this.items.length).then(({data}) => {
                    var resp = parseResp(data, this.$store.state.queueShowTrackNum, 0, this.desktop && this.$store.state.ratingsSupport, this.$store.state.queueThreeLines, this.$store.state.infoPlugin);
                    this.items = resp.items;
                    var needUpdate = this.timestamp!==prevTimestamp && this.timestamp!==resp.timestamp;
                    this.timestamp = resp.timestamp;
                    this.fetchingItems = false;
                    this.listSize = resp.size;
                    this.checkCover();
                    this.getDuration();
                    if (this.selection.size>0) {
                        var sel = new Set();
                        var selection = Array.from(this.selection);
                        for (var i=0, len=selection.length; i<len; ++i) {
                            if (selection[i]<this.items.length) {
                                sel.push(selection[i]);
                                this.items[selection[i]].selected = true;
                            }
                        }
                        this.selection = sel;
                    }
                    this.$nextTick(function () {
                        setScrollTop(this.scrollElement, currentPos>0 ? currentPos : 0);
                    });

                    if (needUpdate) {
                        this.$nextTick(function () {
                            this.updateItems();
                        });
                    } else if ((prevIndex!=this.currentIndex || this.autoScrollRequired) && this.$store.state.autoScrollQueue) {
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
            if (!this.desktop && this.$store.state.page!='queue') {
                this.autoScrollRequired = true;
                return;
            }

            this.autoScrollRequired = false;
            var scroll = this.items.length>5 && this.currentIndex>=0;
            if (scroll || (pulse && this.items.length>0)) {
                if (this.currentIndex<this.items.length) {
                    if (this.items.length<=LMS_MAX_NON_SCROLLER_ITEMS) {
                        var elem=document.getElementById('track'+this.currentIndex);
                        if (elem) {
                            if (scroll) {
                                setScrollTop(this.scrollElement, (this.currentIndex>3 ? this.currentIndex-3 : 0)*(elem.clientHeight+1));
                            }
                            if (pulse) {
                                animate(elem, 1.0, 0.2);
                            }
                        }
                    } else if (scroll) { // TODO: pulse not implemented!
                        var pos = this.currentIndex>3 ? (this.currentIndex-3)*(this.$store.state.queueThreeLines ? LMS_LIST_3LINE_ELEMENT_SIZE : LMS_LIST_ELEMENT_SIZE) : 0;
                        setScrollTop(this.scrollElement, pos>0 ? pos : 0);
                        setTimeout(function () {
                            setScrollTop(this.scrollElement, pos>0 ? pos : 0);
                        }.bind(this), 100);
                    }
                } else if (scroll) {
                    this.autoScrollRequired = true;
                    this.fetchItems();
                }
            }
        },
        dragStart(which, ev) {
            ev.dataTransfer.dropEffect = 'move';
            ev.dataTransfer.setData('Text', this.id);
            this.dragIndex = which;
            this.stopScrolling = false;
            if (this.selection.size>0 && !this.selection.has(which)) {
                this.clearSelection();
            }
        },
        dragEnd() {
            this.stopScrolling = true;
            this.dragIndex = undefined;
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
            var pos = this.scrollElement.scrollTop + step;
            setScrollTop(this.scrollElement, pos);
            if (pos<=0 || pos>=this.scrollElement.scrollTopMax) {
                this.stopScrolling = true;
            }
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
                if (this.selection.size>0) {
                    if (!this.selection.has(to)) {
                        var selection = Array.from(this.selection);
                        bus.$emit('moveQueueItems', selection.sort(function(a, b) { return a<b ? -1 : 1; }), to);
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
            if (this.coverUrl && undefined!=this.coverTrackIndex && this.coverTrackIndex>=0 && this.coverTrackIndex<this.items.length) {
                var resizedUrl = changeImageSizing(this.coverUrl, LMS_IMAGE_SIZE);
                if (this.items[this.coverTrackIndex].image!=resizedUrl) {
                    // Change item's key to force an update...
                    this.items[this.coverTrackIndex].key=this.items[this.coverTrackIndex].id+"."+this.coverTrackIndex+"."+(new Date().getTime().toString(16));
                    this.items[this.coverTrackIndex].image=resizedUrl;
                    this.$forceUpdate();
                }
            }
        },
        updateSettingsMenu() {
            var canMove = this.$store.state.players && this.$store.state.players.length>1;
            if (canMove && this.settingsMenuActions[0]!=PQ_MOVE_QUEUE_ACTION) {
                this.settingsMenuActions.unshift(PQ_MOVE_QUEUE_ACTION);
                bus.$emit('settingsMenuActions', this.wide>1 ? [] : this.settingsMenuActions, 'queue');
            } else if (!canMove && this.settingsMenuActions[0]==PQ_MOVE_QUEUE_ACTION) {
                this.settingsMenuActions.splice(0, 1);
                bus.$emit('settingsMenuActions', this.wide>1 ? [] : this.settingsMenuActions, 'queue');
            }
        },
        repeatOff(showDstm) {
            if (showDstm) {
                bus.$emit('dlg.open', 'dstm');
            } else {
                bus.$emit('playerCommand', ['playlist', 'repeat', 2]);
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
            return "/material/svg/"+name+"?c="+(dark ? LMS_DARK_SVG : LMS_LIGHT_SVG)+"&r="+LMS_MATERIAL_REVISION;
        },
        tooltip: function (str, shortcut, showShortcut) {
            return showShortcut ? str+SEPARATOR+shortcut : str;
        }
    },
    watch: {
        'menu.show': function(newVal) {
            this.$store.commit('menuVisible', {name:'queue', shown:newVal});
        }
    },
    beforeDestroy() {
        if (undefined!==this.updateTimer) {
            clearTimeout(this.updateTimer);
            this.updateTimer = undefined;
        }
    }
});

