/**
 * LMS-Material
 *
 * Copyright (c) 2018-2021 Craig Drummond <craig.p.drummond@gmail.com>
 * MIT license.
 */
'use strict';

const PQ_STATUS_TAGS = IS_MOBILE ? "tags:cdegilqtuyAAKNSxx" : "tags:cdegilqtuysAAKNSxx";

function queueItemCover(item, infoPlugin) {
    if (item.artwork_url) {
        return resolveImageUrl(item.artwork_url);
    }
    if (undefined!=item.coverid) { // && !(""+item.coverid).startsWith("-")) {
        return "/music/"+item.coverid+"/cover"+LMS_IMAGE_SIZE;
    }
    if (infoPlugin) {
        if (item.artist_ids) {
            return "/imageproxy/mai/artist/" + item.artist_ids[0] + "/image" + LMS_IMAGE_SIZE;
        } else if (item.artist_id) {
            return "/imageproxy/mai/artist/" + item.artist_id + "/image" + LMS_IMAGE_SIZE;
        }
    }
    return resolveImageUrl(LMS_BLANK_COVER);
}

function animate(elem, from, to) {
    if (elem.animating) {
        return;
    }
    elem.animating = true;
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
            elem.animating = false;
        } else {
            val+=step;
            elem.style.opacity = origVal * val;
        }
    }
}

var lmsQueueSelectionActive = false;
function buildSubtitle(i, threeLines) {
    var subtitle = buildArtistLine(i, 'queue');
    var lines = [];
    if (threeLines) {
        lines.push(subtitle);
        subtitle = undefined;
    }
    subtitle = addPart(subtitle, buildAlbumLine(i, 'queue'));
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
                let i = loop[idx];
                splitMultiples(i);
                let title = i.title;
                if (showTrackNum && i.tracknum>0) {
                    title = formatTrackNum(i)+SEPARATOR+title;
                }

                let duration = undefined==i.duration ? undefined : parseFloat(i.duration);
                let haveRating = showRatings && undefined!=i.rating;
                resp.items.push({
                              id: "track_id:"+i.id,
                              title: haveRating ? ratingString(title, i.rating) : title,
                              subtitle: buildSubtitle(i, threeLines),
                              image: queueItemCover(i, infoPlugin),
                              actions: undefined==i.album_id
                                ? [PQ_PLAY_NOW_ACTION, PQ_PLAY_NEXT_ACTION, DIVIDER, REMOVE_ACTION, ADD_TO_PLAYLIST_ACTION, PQ_ZAP_ACTION, DIVIDER, SELECT_ACTION, PQ_COPY_ACTION, MOVE_HERE_ACTION, DOWNLOAD_ACTION, MORE_ACTION]
                                : [PQ_PLAY_NOW_ACTION, PQ_PLAY_NEXT_ACTION, DIVIDER, REMOVE_ACTION, PQ_REMOVE_ALBUM_ACTION, ADD_TO_PLAYLIST_ACTION, PQ_ZAP_ACTION, DIVIDER, SELECT_ACTION, PQ_COPY_ACTION, MOVE_HERE_ACTION, DOWNLOAD_ACTION, MORE_ACTION],
                              duration: duration,
                              durationStr: undefined!=duration && duration>0 ? formatSeconds(duration) : undefined,
                              key: i.id+"."+index,
                              album_id: i.album_id,
                              url: i.url,
                              downloadable: undefined!=queryParams.appDownload && i.id>=0
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
 <div class="subtoolbar noselect list-details">
  <v-layout v-if="selection.size>0">
   <div class="toolbar-nobtn-pad"></div>
   <v-layout row wrap>
    <v-flex xs12 class="ellipsis subtoolbar-title subtoolbar-pad">{{trans.selectMultiple}}</v-flex>
    <v-flex xs12 class="ellipsis subtoolbar-subtitle subtext">{{selection.size | displaySelectionCount}}{{selectionDuration | displayTime(true)}}</v-flex>
   </v-layout>
   <v-spacer></v-spacer>
   <v-btn :title="trans.removeall" flat icon class="toolbar-button" @click="removeSelectedItems()"><v-icon>remove_circle_outline</v-icon></v-btn>
   <v-btn :title="ACTIONS[ADD_TO_PLAYLIST_ACTION].title" flat icon class="toolbar-button" @click="addSelectionToPlaylist()"><v-icon>{{ACTIONS[ADD_TO_PLAYLIST_ACTION].icon}}</v-icon></v-btn>
   <v-divider vertical v-if="desktopLayout"></v-divider>
   <v-btn :title="trans.invertSelect" flat icon class="toolbar-button" @click="invertSelection()"><img :src="'invert-select' | svgIcon(darkUi)"></img></v-btn>
   <v-btn :title="trans.cancel" flat icon class="toolbar-button" @click="clearSelection()"><v-icon>cancel</v-icon></v-btn>
  </v-layout>
  <v-layout v-else>
   <div class="toolbar-nobtn-pad"></div>
   <v-layout row wrap v-if="undefined!=remaining">
    <v-flex xs12 class="ellipsis subtoolbar-title subtoolbar-title-single}">{{remaining}}</v-flex>
    <v-flex xs12 class="ellipsis subtoolbar-subtitle subtext">{{trans.remaining}}</v-flex>
   </v-layout>
   <v-layout row wrap v-else-if="listSize>0 && undefined!=playlist.name && playlist.name.length>0" @click="showRemaining">
    <v-flex xs12 class="ellipsis subtoolbar-title subtoolbar-title-single link-item">{{listSize | displayCount}}{{duration | displayTime(true)}}</v-flex>
    <v-flex xs12 class="ellipsis subtoolbar-subtitle subtext link-item">{{playlist.name}}{{playlist.modified ? ' *' : ''}}</v-flex>
   </v-layout>
   <div class="ellipsis subtoolbar-title subtoolbar-title-single link-item" @click="showRemaining" v-else-if="listSize>0">{{listSize | displayCount}}{{duration | displayTime(true)}}</div>
   <v-spacer></v-spacer>
   <v-btn :title="trans.repeatOne" flat icon v-if="(desktopLayout || wide>0) && playerStatus.repeat===1" class="toolbar-button" v-bind:class="{'disabled':noPlayer}" v-longpress="repeatClicked"><v-icon class="active-btn">repeat_one</v-icon></img></v-btn>
   <v-btn :title="trans.repeatAll" flat icon v-else-if="(desktopLayout || wide>0) && playerStatus.repeat===2" class="toolbar-button" v-bind:class="{'disabled':noPlayer}" v-longpress="repeatClicked"><v-icon class="active-btn">repeat</v-icon></v-btn>
   <v-btn :title="trans.dstm" flat icon v-else-if="(desktopLayout || wide>0) && dstm" class="toolbar-button" v-bind:class="{'disabled':noPlayer}" v-longpress="repeatClicked"><v-icon class="active-btn">all_inclusive</v-icon></v-btn>
   <v-btn :title="trans.repeatOff" flat icon v-else-if="desktopLayout || wide>0" class="toolbar-button dimmed" v-bind:class="{'disabled':noPlayer}" v-longpress="repeatClicked"><v-icon>repeat</v-icon></v-btn>

   <v-btn :title="trans.shuffleAlbums" flat icon v-if="(desktopLayout || wide>0) && playerStatus.shuffle===2" class="toolbar-button" v-bind:class="{'disabled':noPlayer}" @click="bus.$emit('playerCommand', ['playlist', 'shuffle', 0])"><v-icon class="shuffle-albums active-btn">shuffle</v-icon></v-btn>
   <v-btn :title="trans.shuffleAll" flat icon v-else-if="(desktopLayout || wide>0) && playerStatus.shuffle===1" class="toolbar-button" v-bind:class="{'disabled':noPlayer}" @click="bus.$emit('playerCommand', ['playlist', 'shuffle', 2])"><v-icon class="active-btn">shuffle</v-icon></v-btn>
   <v-btn :title="trans.shuffleOff" flat icon v-else-if="desktopLayout || wide>0" class="toolbar-button dimmed" v-bind:class="{'disabled':noPlayer}" @click="bus.$emit('playerCommand', ['playlist', 'shuffle', 1])"><v-icon>shuffle</v-icon></v-btn>
   <v-divider vertical v-if="desktopLayout || wide>0"></v-divider>
   <template v-if="wide>1" v-for="(action, index) in settingsMenuActions">
    <v-btn flat icon @click.stop="headerAction(action)" class="toolbar-button" :title="ACTIONS[action].title | tooltip(ACTIONS[action].key,keyboardControl,true)" :id="'tbar'+index" v-bind:class="{'disabled':(PQ_SCROLL_ACTION==action || PQ_MOVE_QUEUE_ACTION==action) && items.length<1}">
      <img v-if="ACTIONS[action].svg" class="svg-img" :src="ACTIONS[action].svg | svgIcon(darkUi)"></img>
      <v-icon v-else>{{ACTIONS[action].icon}}</v-icon>
    </v-btn>
   </template>
   <v-btn :title="trans.save | tooltip(LMS_SAVE_QUEUE_KEYBOARD,keyboardControl)" flat icon @click="save()" class="toolbar-button" v-bind:class="{'disabled':items.length<1}"><v-icon>save</v-icon></v-btn>
   <v-btn :title="trans.clear | tooltip(LMS_CLEAR_QUEUE_KEYBOARD,keyboardControl)" flat icon @click="clear()" class="toolbar-button" v-bind:class="{'disabled':items.length<1}"><img class="svg-list-img" :src="'queue-clear' | svgIcon(darkUi)"></img></v-btn>
  </v-layout>
 </div>
 <div class="lms-list bgnd-cover" id="queue-bgnd">
 <div class="lms-list" id="queue-list" v-bind:class="{'lms-list3':threeLines,'bgnd-blur':drawBgndImage}">
  <RecycleScroller v-if="items.length>LMS_MAX_NON_SCROLLER_ITEMS && threeLines" :items="items" :item-size="LMS_LIST_3LINE_ELEMENT_SIZE" page-mode key-field="key" :buffer="LMS_SCROLLER_LIST_BUFFER">
    <v-list-tile avatar v-bind:class="{'pq-current': index==currentIndex, 'list-active': menu.show && index==menu.index, 'drop-target': dragActive && index==dropIndex}" @dragstart="dragStart(index, $event)" @dragend="dragEnd()" @dragover="dragOver(index, $event)" @drop="drop(index, $event)" draggable @click.prevent.stop="click(item, index, $event)" slot-scope="{item, index}" key-field="key" @contextmenu.prevent="itemMenu(item, index, $event)">
     <v-list-tile-avatar v-if="artwork || item.selected" :tile="true" v-bind:class="{'radio-image': 0==item.duration}" class="lms-avatar">
      <v-icon v-if="item.selected">check_box</v-icon>
      <img v-else :key="item.image" :src="item.image" onerror="this.src='html/images/radio.png'" loading="lazy"></img>
     </v-list-tile-avatar>
     <v-list-tile-content>
      <v-list-tile-title v-html="item.title"></v-list-tile-title>
      <v-list-tile-sub-title v-html="item.subtitle[0]"></v-list-tile-sub-title>
      <v-list-tile-sub-title v-html="item.subtitle[1]"></v-list-tile-sub-title>
     </v-list-tile-content>
     <v-list-tile-action class="pq-time">{{item.durationStr}}</v-list-tile-action>
     <v-list-tile-action class="queue-action" @click.stop="itemMenu(item, index, $event)">
      <div class="menu-btn grid-btn list-btn" :title="i18n('%1 (Menu)', item.title)"></div>
     </v-list-tile-action>
     <div class="pq-current-indicator" v-if="index==currentIndex && artwork"></div>
    </v-list-tile>
   </RecycleScroller>
   <RecycleScroller v-else-if="items.length>LMS_MAX_NON_SCROLLER_ITEMS" :items="items" :item-size="LMS_LIST_ELEMENT_SIZE" page-mode key-field="key" :buffer="LMS_SCROLLER_LIST_BUFFER">
    <v-list-tile avatar v-bind:class="{'pq-current': index==currentIndex, 'list-active': menu.show && index==menu.index, 'drop-target': dragActive && index==dropIndex}" @dragstart="dragStart(index, $event)" @dragend="dragEnd()" @dragover="dragOver(index, $event)" @drop="drop(index, $event)" draggable @click="click(item, index, $event)" slot-scope="{item, index}" key-field="key" @contextmenu.prevent="itemMenu(item, index, $event)">
     <v-list-tile-avatar v-if="artwork || item.selected" :tile="true" v-bind:class="{'radio-image': 0==item.duration}" class="lms-avatar">
      <v-icon v-if="item.selected">check_box</v-icon>
      <img v-else :key="item.image" :src="item.image" onerror="this.src='html/images/radio.png'" loading="lazy"></img>
     </v-list-tile-avatar>
     <v-list-tile-content>
      <v-list-tile-title v-html="item.title"></v-list-tile-title>
      <v-list-tile-sub-title v-html="item.subtitle"></v-list-tile-sub-title>
     </v-list-tile-content>
     <v-list-tile-action class="pq-time">{{item.durationStr}}</v-list-tile-action>
     <v-list-tile-action class="queue-action" @click.stop="itemMenu(item, index, $event)">
      <div class="menu-btn grid-btn list-btn" :title="i18n('%1 (Menu)', item.title)"></div>
     </v-list-tile-action>
     <div class="pq-current-indicator" v-if="index==currentIndex && artwork"></div>
    </v-list-tile>
   </RecycleScroller>
   <template v-else v-for="(item, index) in items">
    <v-list-tile :key="item.key" avatar v-bind:class="{'pq-current': index==currentIndex, 'list-active': menu.show && index==menu.index, 'drop-target': dragActive && index==dropIndex}" :id="'track'+index" @dragstart="dragStart(index, $event)" @dragend="dragEnd()" @dragover="dragOver(index, $event)" @drop="drop(index, $event)" draggable @click="click(item, index, $event)" class="lms-list-item" @contextmenu.prevent="itemMenu(item, index, $event)">
     <v-list-tile-avatar v-if="artwork || item.selected" :tile="true" v-bind:class="{'radio-image': 0==item.duration}" class="lms-avatar">
      <v-icon v-if="item.selected">check_box</v-icon>
      <img v-else :key="item.image" v-lazy="item.image" onerror="this.src='html/images/radio.png'"></img>
     </v-list-tile-avatar>
     <v-list-tile-content>
      <v-list-tile-title v-html="item.title"></v-list-tile-title>
      <v-list-tile-sub-title v-if="!threeLines" v-html="item.subtitle"></v-list-tile-sub-title>
      <v-list-tile-sub-title v-if="threeLines" v-html="item.subtitle[0]"></v-list-tile-sub-title>
      <v-list-tile-sub-title v-if="threeLines" v-html="item.subtitle[1]"></v-list-tile-sub-title>
     </v-list-tile-content>
     <v-list-tile-action class="pq-time">{{item.durationStr}}</v-list-tile-action>
     <v-list-tile-action class="queue-action" @click.stop="itemMenu(item, index, $event)">
      <div class="menu-btn grid-btn list-btn" :title="i18n('%1 (Menu)', item.title)"></div>
     </v-list-tile-action>
     <div class="pq-current-indicator" v-if="index==currentIndex && artwork"></div>
    </v-list-tile>
   </template>
  </div>
 </div>

 <v-menu offset-y v-model="menu.show" :position-x="menu.x" :position-y="menu.y">
  <v-list v-if="menu.item">
   <template v-for="(action, index) in menu.item.actions">
    <v-divider v-if="DIVIDER==action"></v-divider>
    <v-list-tile v-else-if="action==SELECT_ACTION && menu.item.selected" @click="itemAction(UNSELECT_ACTION, menu.item, menu.index, $event)">
     <v-list-tile-avatar v-if="menuIcons">
      <v-icon>{{ACTIONS[UNSELECT_ACTION].icon}}</v-icon>
     </v-list-tile-avatar>
     <v-list-tile-title>{{ACTIONS[UNSELECT_ACTION].title}}</v-list-tile-title>
    </v-list-tile>
    <v-list-tile v-else-if="action==PQ_COPY_ACTION ? browseSelection : action==MOVE_HERE_ACTION ? (selection.size>0 && !menu.item.selected) : action==PQ_ZAP_ACTION ? customSkipPlugin : action==DOWNLOAD_ACTION ? menu.item.downloadable && selection.size==0 : (action!=PQ_PLAY_NEXT_ACTION || menu.index!=currentIndex)" @click="itemAction(action, menu.item, menu.index, $event)">
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
    data() {
        return {
            items: [],
            currentIndex: -1,
            listSize:0,
            duration: 0.0,
            playerStatus: { shuffle:0, repeat: 0 },
            remaining: undefined,
            trans: { ok: undefined, cancel: undefined, save:undefined, clear:undefined,
                     repeatAll:undefined, repeatOne:undefined, repeatOff:undefined, shuffleAll:undefined, shuffleAlbums:undefined,
                     shuffleOff:undefined, selectMultiple:undefined, removeall:undefined, invertSelect:undefined, dstm:undefined, remaining:undefined },
            menu: { show:false, item: undefined, x:0, y:0, index:0},
            playlist: {name: undefined, modified: false},
            selection: new Set(),
            selectionDuration: 0,
            settingsMenuActions: [PQ_MOVE_QUEUE_ACTION, PQ_SCROLL_ACTION, PQ_ADD_URL_ACTION],
            wide: 0,
            dstm: false,
            dragActive: false,
            dropIndex: -1,
            coverUrl: undefined
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
        artwork() {
            return this.$store.state.showArtwork
        },
        keyboardControl() {
            return this.$store.state.keyboardControl && !IS_MOBILE
        },
        desktopLayout() {
            return this.$store.state.desktopLayout
        },
        noPlayer() {
            return !this.$store.state.player
        },
        customSkipPlugin() {
            return this.$store.state.customSkipPlugin
        },
        drawBgndImage() {
            return this.$store.state.queueBackdrop && undefined!=this.coverUrl
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
        bus.$on('queueDisplayChanged', function() {
            this.items=[];
            this.timestamp=0;
            this.updateItems();
        }.bind(this));
        bus.$on('playerChanged', function() {
            this.items=[];
            this.timestamp=0;
        }.bind(this));
        bus.$on('playerChanged', function() {
            this.clearSelection();
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
            this.playlist.name=playerStatus.playlist.name;
            this.playlist.modified=playerStatus.playlist.modified;
            if (playerStatus.playlist.timestamp!=this.timestamp || (playerStatus.playlist.timestamp>0 && this.items.length<1) ||
                (playerStatus.playlist.timestamp<=0 && this.items.length>0) || this.listSize!=playerStatus.playlist.count) {
                if (playerStatus.playlist.current!=this.currentIndex) {
                    this.autoScrollRequired = true;
                }
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
                        title = formatTrackNum(i)+SEPARATOR+title;
                    }
                    if (this.$store.state.showRating && undefined!=i.rating) {
                        title = ratingString(title, i.rating);
                    }
                    var subtitle = buildSubtitle(i, this.$store.state.queueThreeLines);
                    var remoteTitle = checkRemoteTitle(i);
                    var duration = undefined==i.duration ? undefined : parseFloat(i.duration);

                    if (title!=this.items[index].title || subtitle!=this.items[index].subtitle || duration!=this.items[index].duration) {
                        this.items[index].title = title;
                        this.items[index].subtitle = subtitle;
                        if (duration!=this.items[index].duration) {
                            this.items[index].durationStr = undefined!=duration && duration>0 ? formatSeconds(duration) : undefined;
                            this.items[index].duration = duration;
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

        this.bgndElement = document.getElementById("queue-bgnd");
        this.scrollElement = document.getElementById("queue-list");
        this.scrollElement.addEventListener("scroll", this.handleScroll, PASSIVE_SUPPORTED ? { passive: true } : false);

        if (!IS_MOBILE) {
            ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
                this.scrollElement.addEventListener(eventName, (ev) => { ev.stopPropagation(); ev.preventDefault();}, false);
            });
            this.scrollElement.addEventListener('drop', this.droppedFileHandler, false);
        }

        this.setBgndCover();
        this.$nextTick(function () {
            setScrollTop(this, 0);
            // In case we missed the initial status update, ask for one now - so that we get queue quicker
            bus.$emit('refreshStatus');
            this.setBgndCover();
        });

        bus.$on('pageChanged', function(page) {
            if ('queue'==page) {
                this.$nextTick(function () {
                     if (this.$store.state.autoScrollQueue && this.autoScrollRequired) {
                          this.scrollToCurrent();
                     }
                     this.updateMenu();
                });
            }
        }.bind(this));
        // Press on 'queue' nav button whilst in queue scrolls to current track
        bus.$on('nav', function(page, longPress) {
            if ('queue'==page) {
                this.scrollToCurrent(true);
            }
        }.bind(this));
        bus.$on('settingsMenuAction:queue', function(action) {
            this.headerAction(action);
        }.bind(this));

        bus.$on('windowWidthChanged', function() {
            this.$nextTick(function () {
                this.updateMenu();
            });
        }.bind(this));
        bus.$on('splitterChanged', function() {
            this.updateMenu();
        }.bind(this));
        this.wide=5;
        this.updateMenu();

        bus.$on('layoutChanged', function(action) {
            let pos = this.scrollElement.scrollTop;
            if (pos>0) {
                this.$nextTick(function () {
                    setScrollTop(this, pos);
                });
            }
        }.bind(this));

        bus.$on('noPlayers', function() {
            this.updateSettingsMenu();
        }.bind(this));
        bus.$on('playerListChanged', function() {
            this.updateSettingsMenu();
        }.bind(this));
        bus.$on('prefset', function(pref, value, player) {
            if ("plugin.dontstopthemusic:provider"==pref && player==this.$store.state.player.id) {
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
            bindKey('pageup', 'alt', true);
            bindKey('pagedown', 'alt', true);
            bus.$on('keyboard', function(key, modifier) {
                if (this.$store.state.openDialogs.length>0 || this.$store.state.visibleMenus.size>0 || (!this.$store.state.desktopLayout && this.$store.state.page!="queue")) {
                    return;
                }
                if ('mod'==modifier) {
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
                } else if ('alt'==modifier || (undefined==modifier && !this.$store.state.desktopLayout && this.$store.state.page=="queue")) {
                    if ('pageup'==key) {
                        this.scrollElement.scrollBy(0, -1*this.scrollElement.clientHeight);
                    } else if ('pagedown'==key) {
                        this.scrollElement.scrollBy(0, this.scrollElement.clientHeight);
                    }
                }
            }.bind(this));
        }
        bus.$on('dragActive', function(act) {
            this.dragActive = act;
            if (!act) {
                this.dropIndex = -1;
            }
        }.bind(this));
        this.browseSelection=false;
        bus.$on('browseSelection', function(sel) {
            this.browseSelection=sel;
        }.bind(this));
        bus.$on('queueGetSelectedUrls', function(index, id) {
            var urls = this.getSelectedUrls();
            if (urls.length>0) {
                bus.$emit('queueSelectedUrls', urls, index, id);
                this.clearSelection();
            }
        }.bind(this));
    },
    methods: {
        initItems() {
            this.trans= { ok:i18n('OK'), cancel: i18n('Cancel'), save:i18n("Save queue"), clear:i18n("Clear queue"),
                          repeatAll:i18n("Repeat queue"), repeatOne:i18n("Repeat single track"), repeatOff:i18n("No repeat"),
                          shuffleAll:i18n("Shuffle tracks"), shuffleAlbums:i18n("Shuffle albums"), shuffleOff:i18n("No shuffle"),
                          selectMultiple:i18n("Select multiple items"), removeall:i18n("Remove all selected items"), 
                          invertSelect:i18n("Invert selection"), dstm:i18n("Don't Stop The Music"), remaining:i18n("Remaining")};
        },
        updateMenu() {
            var wide = this.scrollElement.clientWidth >= 520 ? 2 : this.scrollElement.clientWidth>=340 ? 1 : 0;
            if (wide!=this.wide) {
                this.wide = wide;
                bus.$emit('settingsMenuActions', this.wide>1 ? [] : this.settingsMenuActions, 'queue');
            }
        },
        handleScroll() {
            this.menu.show = false;
            if (undefined==this.scrollAnim) {
                this.scrollAnim = requestAnimationFrame(() => {
                    this.scrollAnim = undefined;

                    // Fetch more items?
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
            }
        },
        droppedFileHandler(ev) {
            let dt = ev.dataTransfer
            let files = dt.files;
            if (files.length>0) {
                lmsCommand("", ["pref", "plugin.dndplay:maxfilesize", "?"]).then(({data}) => {
                    if (data && data.result && data.result._p2 != null) {
                        let maxSize = parseInt(data.result._p2)*1024*1024;
                        let toAdd = [];
                        for (let i = 0, file; file = files[i]; i++) {
                            if (file.type.match('audio') && file.size<=maxSize) { // || file.name.match(SqueezeJS.DnD.validTypeExtensions)) {
                                toAdd.push(file);
                            }
                        }
                        if (toAdd.length>0) {
                            if (ev.shiftKey && this.items.length > 0) {
                                lmsCommand(this.$store.state.player.id, ["playlist", "clear"]).then(({data}) => {
                                    this.addFiles(toAdd, 'play');
                                });
                            } else {
                                this.addFiles(toAdd, 'play');
                            }
                        }
                    }
                });
            }
        },
        addFiles(files, action) {
            let file = files.shift();
            if (!file) {
                return;
            }
            lmsCommand(this.$store.state.player.id, ['playlist', action+'match', 'name:'+file.name, 'size:'+(file.size || 0), 'timestamp:'+Math.floor(file.lastModified/1000), 'type:'+(file.type || 'unk')]).then(({data}) => {
                if (data && data.result && data.result.upload) {
                    let formData = new FormData();
                    formData.append('action', action);
                    formData.append('name', file.name);
                    formData.append('size', file.size);
                    formData.append('type', file.type);
                    formData.append('timestamp', Math.floor(file.lastModified / 1000));
                    formData.append('key', data.result.upload);
                    formData.append('uploadfile', file);
                    axios.post('/plugins/dndplay/upload', formData, {headers:{'Content-Type': 'multipart/form-data'}}).then(({data}) => {
                        this.addFiles(files, 'add');
                    });
                } else {
                    this.addFiles(files, 'add');
                }
            });
        },
        save() {
            if (this.items.length<1) {
                return;
            }
            bus.$emit('dlg.open', 'savequeue', ""+(undefined==this.playlist.name ? "" : this.playlist.name));
        },
        clear() {
            if (this.items.length<1) {
                return;
            }
            confirm(i18n("Remove all tracks from queue?"), i18n('Clear')).then(res => {
                if (res) {
                    bus.$emit('playerCommand', ["playlist", "clear"]);
                }
            });
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
            if (this.$store.state.showMenuAudio) {
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
            } else if (REMOVE_ACTION===act) {
                bus.$emit('playerCommand', ["playlist", "delete", index]);
            } else if (PQ_REMOVE_ALBUM_ACTION==act) {
                bus.$emit('playerCommand', ["playlistcontrol", "cmd:delete", "album_id:"+item.album_id]);
            } else if (MORE_ACTION===act) {
                if (item.title.indexOf("<i class=\"rstar\">")>0) { // Need to remove ratings stars...
                    let clone = JSON.parse(JSON.stringify(item));
                    clone.title = item.title.split(SEPARATOR+"<i class=\"rstar\">")[0];
                    console.log(item.title, clone.title);
                    bus.$emit('trackInfo', clone, index, 'queue');
                } else {
                    bus.$emit('trackInfo', item, index, 'queue');
                }
                if (!this.$store.state.desktopLayout) {
                    this.$store.commit('setPage', 'browse');
                }
            } else if (SELECT_ACTION===act) {
                if (!this.selection.has(index)) {
                    if (0==this.selection.size) {
                        bus.$emit('queueSelection', true);
                        lmsQueueSelectionActive = true;
                    }
                    this.selection.add(index);
                    this.selectionDuration += itemDuration(this.items[index]);
                    item.selected = true;
                    forceItemUpdate(this, item);
                    if (event && event.shiftKey) {
                        if (undefined!=this.selectStart) {
                            for (var i=this.selectStart<index ? this.selectStart : index, stop=this.selectStart<index ? index : this.selectStart, len=this.items.length; i<=stop && i<len; ++i) {
                                this.itemAction(SELECT_ACTION, this.items[i], i);
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
            } else if (UNSELECT_ACTION===act) {
                this.selectStart = undefined;
                if (this.selection.has(index)) {
                    this.selection.delete(index);
                    this.selectionDuration -= itemDuration(this.items[index]);
                    item.selected = false;
                    forceItemUpdate(this, item);
                    if (0==this.selection.size) {
                        bus.$emit('queueSelection', false);
                        lmsQueueSelectionActive = false;
                    }
                }
            } else if (MOVE_HERE_ACTION==act) {
                if (this.selection.size>0 && !this.selection.has(index)) {
                    bus.$emit('moveQueueItems', Array.from(this.selection).sort(function(a, b) { return a<b ? -1 : 1; }), index);
                    this.clearSelection();
                }
            } else if (PQ_ZAP_ACTION==act) {
                lmsCommand(this.$store.state.player.id, ["playlist", "zap", index]).then(({data}) => {
                    bus.$emit('showMessage', i18n("Zapped '%1'", item.title));
                });
            } else if (ADD_TO_PLAYLIST_ACTION==act) {
                bus.$emit('dlg.open', 'addtoplaylist', [item], []);
            } else if (PQ_COPY_ACTION==act) {
                bus.$emit('browseQueueDrop', -1, index, this.listSize);
            } else if (DOWNLOAD_ACTION==act) {
                download(item);
            }
        },
        headerAction(act) {
            if (this.$store.state.visibleMenus.size>0 && this.settingsMenuActions.indexOf(act)<0) {
                return;
            }
            if (act==PQ_ADD_URL_ACTION) {
                promptForText(ACTIONS[PQ_ADD_URL_ACTION].title, i18n("URL"), undefined, i18n("Add")).then(resp => {
                    if (resp.ok && resp.value && resp.value.length>0) {
                        lmsCommand(this.$store.state.player.id, ["playlist", this.items.length==0 ? "play" : "add", resp.value]).then(({data}) => {
                            bus.$emit('refreshStatus');
                        });
                    }
                });
            } else if (act==PQ_SCROLL_ACTION) {
                if (this.items.length>=1) {
                    this.scrollToCurrent(true);
                }
            } else if (act==PQ_MOVE_QUEUE_ACTION) {
                if (!this.$store.state.player || !this.$store.state.players || this.$store.state.players.length<2) {
                    return;
                } else if (this.items.length>=1) {
                    bus.$emit('dlg.open', 'movequeue', this.$store.state.player);
                }
            }
        },
        itemMenu(item, index, event) {
            showMenu(this, {show:true, item:item, index:index, x:event.clientX, y:event.clientY});
        },
        addSelectionToPlaylist() {
            var selection = Array.from(this.selection);
            selection.sort(function(a, b) { return a<b ? -1 : 1; });
            var items=[];
            for (var i=0, len=selection.length; i<len; ++i) {
                items.push(this.items[selection[i]]);
            }
            bus.$emit('dlg.open', 'addtoplaylist', items, []);
        },
        removeSelectedItems() {
            var selection = Array.from(this.selection);
            selection.sort(function(a, b) { return a<b ? 1 : -1; });
            bus.$emit('removeFromQueue', selection);
            this.clearSelection();
        },
        invertSelection() {
            if (this.selection.size==this.items.length) {
                this.clearSelection();
                return;
            }
            this.selection = new Set();
            this.selectionDuration = 0;
            for (var i=0, len=this.items.length; i<len; ++i) {
                if (this.items[i].selected) {
                    this.items[i].selected = false;
                } else {
                    this.selection.add(i);
                    this.items[i].selected = true;
                    this.selectionDuration += itemDuration(this.items[i]);
                }
            }
        },
        clearSelection() {
            this.selectStart = undefined;
            var selection = Array.from(this.selection);
            for (var i=0, len=selection.length; i<len; ++i) {
                var index = selection[i];
                if (index>-1 && index<this.items.length) {
                    var idx = this.items[index].actions.indexOf(UNSELECT_ACTION);
                    if (idx>-1) {
                        this.items[index].actions[idx]=SELECT_ACTION;
                    }
                    this.items[index].selected = false;
                }
            }
            this.selection = new Set();
            this.selectionDuration = 0;
            lmsQueueSelectionActive = false;
            bus.$emit('queueSelection', false);
        },
        select(item, index, event) {
            if (this.selection.size>0) {
                this.itemAction(this.selection.has(index) ? UNSELECT_ACTION : SELECT_ACTION, item, index, event);
                this.$forceUpdate();
            }
        },
        getDuration() {
            if (this.items.length>0) {
                if (this.items.length==this.listSize) {
                    // Have all tracks, so sum durations...
                    var duration = 0;
                    var isValid = true;
                    for (var i=0; i<this.listSize && isValid; ++i) {
                        if (this.items[i].duration!=undefined && this.items[i].duration>0) {
                            duration += this.items[i].duration;
                        } else {
                            isValid = false;
                        }
                    }
                    if (isValid) {
                        this.duration = duration;
                        bus.$emit("queueStatus", this.listSize, this.duration);
                        return;
                    }
                }
                // Don't have all tracks, so ask LMS for total duration... (OR isValid from above is false)
                lmsCommand(this.$store.state.player.id, ["status", "-", 1, "tags:DD"]).then(({data}) => {
                    this.duration = data.result && data.result["playlist duration"] ? parseFloat(data.result["playlist duration"]) : 0.0;
                    bus.$emit("queueStatus", this.listSize, this.duration);
                });
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
            lmsList(this.$store.state.player.id, ["status"], [PQ_STATUS_TAGS + (this.$store.state.showRating ? "R" : "")], this.items.length, fetchCount).then(({data}) => {
                var resp = parseResp(data, this.$store.state.queueShowTrackNum, this.items.length, this.$store.state.showRating, this.$store.state.queueThreeLines, this.$store.state.infoPlugin);
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
                lmsList(this.$store.state.player.id, ["status"], [PQ_STATUS_TAGS + (this.$store.state.showRating ? "R" : "")], 0,
                        this.items.length < LMS_QUEUE_BATCH_SIZE ? LMS_QUEUE_BATCH_SIZE : this.items.length).then(({data}) => {
                    var resp = parseResp(data, this.$store.state.queueShowTrackNum, 0, this.$store.state.showRating, this.$store.state.queueThreeLines, this.$store.state.infoPlugin);
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
                                sel.add(selection[i]);
                                this.items[selection[i]].selected = true;
                            }
                        }
                        this.selection = sel;
                        lmsQueueSelectionActive = this.selection.length>0;
                        bus.$emit('queueSelection', lmsQueueSelectionActive);
                    }
                    this.$nextTick(function () {
                        setScrollTop(this, currentPos>0 ? currentPos : 0);
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
            if (!this.$store.state.desktopLayout && this.$store.state.page!='queue') {
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
                                setScrollTop(this, (this.currentIndex>3 ? this.currentIndex-3 : 0)*(elem.clientHeight+1));
                            }
                            if (pulse) {
                                animate(elem, 1.0, 0.2);
                            }
                        }
                    } else if (scroll) { // TODO: pulse not implemented!
                        var pos = this.currentIndex>3 ? (this.currentIndex-3)*(this.$store.state.queueThreeLines ? LMS_LIST_3LINE_ELEMENT_SIZE : LMS_LIST_ELEMENT_SIZE) : 0;
                        setScrollTop(this, pos>0 ? pos : 0);
                        setTimeout(function () {
                            setScrollTop(this, pos>0 ? pos : 0);
                        }.bind(this), 100);
                    }
                } else if (scroll) {
                    this.autoScrollRequired = true;
                    this.fetchItems();
                }
            }
        },
        dragStart(which, ev) {
            bus.$emit('dragActive', true);
            ev.dataTransfer.dropEffect = 'move';
            ev.dataTransfer.setData('Text', this.items[which].title);
            ev.dataTransfer.setDragImage(ev.target.nodeName=='IMG' ? ev.srcElement.parentNode.parentNode.parentNode : ev.srcElement, 0, 0);
            this.dragIndex = which;
            this.stopScrolling = false;
            if (this.selection.size>0 && !this.selection.has(which)) {
                this.clearSelection();
            }
            window.mskQueueDrag = this.getSelectedUrls();
        },
        getSelectedUrls() {
            var selection = []
            if (this.selection.size>0) {
                selection = Array.from(this.selection);
                selection.sort(function(a, b) { return a<b ? -1 : 1; });
            } else {
                selection.push(which);
            }
            var urls = [];
            for (var i=0, len=selection.length; i<len; ++i) {
                urls.push(this.items[selection[i]].url);
            }
            return urls;
        },
        dragEnd() {
            this.stopScrolling = true;
            this.dragIndex = undefined;
            this.dropIndex = -1;
            window.mskQueueDrag = undefined;
            bus.$emit('dragActive', false);
        },
        dragOver(index, ev) {
            this.dropIndex = index;
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
            setScrollTop(this, pos);
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
            if (this.dragIndex!=undefined) {
                if (to!=this.dragIndex) {
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
            } else if (ev.dataTransfer) {
                if (undefined!=window.mskBrowseDrag) {
                    bus.$emit('browseQueueDrop', window.mskBrowseDrag, to, this.listSize);
                }
            }
            this.dragIndex = undefined;
        },
        setBgndCover() {
            setBgndCover(this.bgndElement, this.$store.state.queueBackdrop ? this.coverUrl : undefined);
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
        repeatClicked(longPress) {
            if (longPress && this.playerStatus.repeat===0) {
                bus.$emit('dlg.open', 'dstm');
            } else if (this.playerStatus.repeat===1) {
                bus.$emit('playerCommand', ['playlist', 'repeat', 0]);
            } else if (this.playerStatus.repeat===2) {
                bus.$emit('playerCommand', ['playlist', 'repeat', 1]);
            } else {
                bus.$emit('playerCommand', ['playlist', 'repeat', 2]);
            }
        },
        showRemaining() {
            if (this.items.length>1 && this.items.length==this.listSize) {
                var duration = 0;
                var isValid = true;
                for (var i=this.currentIndex; i<this.listSize && isValid; ++i) {
                    if (this.items[i].duration!=undefined && this.items[i].duration>0) {
                        duration += this.items[i].duration;
                    } else {
                        isValid = false;
                    }
                }
                if (isValid) {
                    duration -= currentPlayingTrackPosition;
                    this.remaining = i18np("1 Track", "%1 Tracks", this.listSize - this.currentIndex) + " (" + formatSeconds(Math.floor(duration)) +")";
                    setTimeout(function () {
                        this.remaining = undefined;
                    }.bind(this), 2000);
                }
            }
        }
    },
    filters: {
        displayTime: function (value, bracket) {
            if (!value || value<0.000000000001) {
                return '';
            }
            let str = formatSeconds(Math.floor(value));
            if (undefined==str || str.length<1) {
                return '';
            }
            if (bracket) {
                return " (" + str + ")";
            }
            return str;
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
        tooltip: function (str, key, showShortcut) {
            return showShortcut ? str+SEPARATOR+shortcutStr(key) : str;
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
        if (undefined!=this.scrollElement) {
            this.scrollElement.removeEventListener("scroll", this.handleScroll);
        }
    }
});

