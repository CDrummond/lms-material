/**
 * LMS-Material
 *
 * Copyright (c) 2018-2024 Craig Drummond <craig.p.drummond@gmail.com>
 * MIT license.
 */
'use strict';

const PQ_STATUS_TAGS = "tags:cdegilqtuyAAIKNSxx";
const PQ_REQUIRE_AT_LEAST_1_ITEM = new Set([PQ_SAVE_ACTION, PQ_MOVE_QUEUE_ACTION, PQ_SCROLL_ACTION, PQ_SORT_ACTION, REMOVE_DUPES_ACTION]);
const PQ_REQUIRE_MULTIPLE_ITEMS = new Set([PQ_SCROLL_ACTION, SEARCH_LIST_ACTION, PQ_SORT_ACTION, REMOVE_DUPES_ACTION]);

function queueMakePlain(str) {
    let rating = str.indexOf(SEPARATOR+RATINGS_START);
    let noRating = stripLinkTags(rating>0 ? str.substring(0, rating) : str);
    let trackNum = noRating.indexOf(SEPARATOR);
    let plain = (trackNum>0 ? noRating.substring(trackNum+SEPARATOR.length) : noRating).trim();
    return plain;
}

function queueItemCover(item) {
    if (item.artwork_url) {
        return resolveImageUrl(item.artwork_url);
    }
    if (undefined!=item.coverid) { // && !(""+item.coverid).startsWith("-")) {
        return "/music/"+item.coverid+"/cover"+LMS_IMAGE_SIZE;
    }
    if (LMS_P_MAI) {
        if (item.artist_ids) {
            return "/imageproxy/mai/artist/" + item.artist_ids[0] + "/image" + LMS_IMAGE_SIZE;
        } else if (item.artist_id) {
            return "/imageproxy/mai/artist/" + item.artist_id + "/image" + LMS_IMAGE_SIZE;
        }
    }
    return resolveImageUrl(LMS_BLANK_COVER);
}

var lmsQueueSelectionActive = false;
function buildArtistAlbumLines(i, queueAlbumStyle, queueContext) {
    let artistAlbum = undefined;
    let artistAlbumContext = undefined;
    let artistIsRemoteTitle = false;
    if (queueAlbumStyle) {
        let str = i.albumartist ? i.albumartist : i.artist ? i.artist : i.trackartist;
        let id = i.albumartist ? i.albumartist_id : i.artist_id ? i.artist_id : i.trackartist_id;
        if (!str && i.remote) {
            artistAlbum = i.remote_title ? i.remote_title : i.title;
            artistIsRemoteTitle = true;
        } else if ((IS_MOBILE && !lmsOptions.touchLinks) || undefined==id) {
            artistAlbum = str;
        } else {
            artistAlbum = buildLink(i.albumartist ? 'showAlbumArtist' : 'showArtist', id, str, 'queue');
        }
    } else {
        artistAlbum = buildArtistLine(i, 'queue');
        artistAlbumContext = queueContext ? buildArtistWithContext(i, 'queue') : undefined;
    }
    var lines = [];
    var linesContext = [];
    lines.push(artistAlbum);
    if (queueContext) {
        linesContext.push(artistAlbumContext);
    }
    if (!queueAlbumStyle) {
        artistAlbum = undefined;
        artistAlbumContext = undefined;
    }
    if (!queueAlbumStyle || !artistIsRemoteTitle) {
        artistAlbum = addPart(artistAlbum, buildAlbumLine(i, 'queue'));
        if (queueContext) {
            let al = i18n('<obj>from</obj> %1', buildAlbumLine(i, "queue")).replaceAll("<obj>", "<obj class=\"ext-details\">");
            artistAlbumContext = undefined == artistAlbumContext ? al : (artistAlbumContext + " " + al);
        }
        if (!queueAlbumStyle) {
            lines.push(artistAlbum);
            if (queueContext) {
                linesContext.push(artistAlbumContext);
            }
            return lines.concat(linesContext);
        }
    }
    return artistAlbum;
}

function parseResp(data, showTrackNum, index, showRatings, queueAlbumStyle, queueContext, lastInCurrent) {
    logJsonMessage("RESP", data);
    let resp = { timestamp: 0, items: [], size: 0 };
    let isInitial = 0==index;
    if (data.result) {
        resp.timestamp = data.result.playlist_timestamp;
        resp.size = data.result.playlist_tracks;

        if (data.result.playlist_loop) {
            for (var idx=0, loop=data.result.playlist_loop, loopLen=loop.length; idx<loopLen; ++idx) {
                let i = loop[idx];
                let clz = queueAlbumStyle ? 'subtext' : undefined;
                splitMultiples(i);
                let title = i.title;
                if (showTrackNum && i.tracknum>0) {
                    title = formatTrackNum(i)+SEPARATOR+title;
                }
                let addedClass = false;
                let haveRating = showRatings && undefined!=i.rating;
                if (queueAlbumStyle) {
                    let artist = i.albumartist ? i.albumartist : i.artist ? i.artist : i.trackartist;
                    let extra = buildArtistLine(i, 'queue', false, artist);
                    if (!isEmpty(extra)) {
                        title+='<obj class="subtext">'+SEPARATOR+extra;
                        addedClass = true;
                    }
                }
                if (haveRating) {
                    title += (queueAlbumStyle && !addedClass ? '<obj class="subtext">' : '') + SEPARATOR+ratingString(undefined, i.rating, clz) + (queueAlbumStyle ? '</obj>': '');
                } else if (addedClass) {
                    title+='</obj>';
                }
                let duration = undefined==i.duration ? undefined : parseFloat(i.duration);
                let prevItem = 0==idx ? lastInCurrent : resp.items[idx-1];
                let image = queueItemCover(i);
                let isAlbumHeader = queueAlbumStyle &&
                                     ( undefined==prevItem ||
                                       i.album_id!=prevItem.album_id ||
                                       i.disc!=prevItem.disc ||
                                       (undefined==i.album_id && ( (undefined!=image && image!=prevItem.image) ||
                                                                   (i.album!=prevItem.album) ) ) );
                let grpKey = isAlbumHeader || undefined==prevItem ? index+resp.items.length : prevItem.grpKey;
                let artistAlbumLines = !queueAlbumStyle || isAlbumHeader ? buildArtistAlbumLines(i, queueAlbumStyle, queueContext && !isAlbumHeader) : undefined;
                resp.items.push({
                              id: "track_id:"+i.id,
                              title: title,
                              tooltip: i.title,
                              artistAlbum: artistAlbumLines,
                              image: image,
                              actions: [PQ_PLAY_NOW_ACTION, PQ_PLAY_NEXT_ACTION, DIVIDER, REMOVE_ACTION, PQ_REMOVE_ALBUM_ACTION, PQ_REMOVE_DISC_ACTION, ADD_TO_PLAYLIST_ACTION, PQ_ZAP_ACTION, DOWNLOAD_ACTION, SELECT_ACTION, PQ_COPY_ACTION, MOVE_HERE_ACTION, CUSTOM_ACTIONS, SHOW_IMAGE_ACTION, MORE_ACTION],
                              duration: duration,
                              durationStr: undefined!=duration && duration>0 ? formatSeconds(duration) : undefined,
                              key: i.id+"."+index,
                              album_id: i.album_id,
                              disc: i.disc,
                              url: i.url,
                              isLocal: i.url && i.url.startsWith("file:"),
                              artist: i.artist ? i.artist : i.trackartist ? i.trackartist : i.albumartist,
                              album: queueAlbumStyle ? i.album : undefined,
                              size: queueAlbumStyle
                                      ? isAlbumHeader ? LMS_ALBUM_QUEUE_HEADER : LMS_ALBUM_QUEUE_TRACK
                                      : undefined,
                              grpKey:grpKey
                          });
                index++;
            }
        }
        // Sometimes LMS states there are X tracks but only returns X-1, this causes the queue to break.
        // Try to detect this, and add blank items at end ???
        // See: https://forums.slimdevices.com/showthread.php?115609-Announce-Music-Similarity-DSTM-mixer&p=1043400&viewfull=1#post1043400
        if (isInitial && resp.size>resp.items.length && resp.size<LMS_QUEUE_BATCH_SIZE) {
            while (resp.items.length<resp.size) {
                resp.items.push({
                    id:"error."+resp.items.length,
                    title:'',
                    artistAlbum:'',
                    image:resolveImageUrl(LMS_BLANK_COVER),
                    key:"error."+resp.items.length
                    });
            }
        }
    }
    return resp;
}

var lmsQueue = Vue.component("lms-queue", {
  template: `
<div :class="[!pinQueue ? nowPlayingExpanded ? 'pq-unpinned-np'+nowPlayingWide : 'pq-unpinned' : '']" id="queue-view">
<lms-resizer v-if="!pinQueue && windowWide>0" varname="pq-unpinned-width"></lms-resizer>
 <div class="subtoolbar noselect" v-bind:class="{'list-details':pinQueue}" v-if="!desktopLayout || showQueue">
  <v-layout v-if="selection.size>0">
   <v-btn v-if="desktopLayout && windowWide>1" :title="pinQueue ? trans.unpin : trans.pin" flat icon class="toolbar-button" @click="togglePin" id="pq-pin-1"><img :src="(pinQueue ? 'pin' : 'unpin') | svgIcon(darkUi)"></img></v-btn>
   <div class="toolbar-nobtn-pad"></div>
   <div v-if="desktopLayout && pinQueue" style="width:2px"></div>
   <v-layout row wrap>
    <v-flex xs12 class="ellipsis subtoolbar-title subtoolbar-pad">{{trans.selectMultiple}}</v-flex>
    <v-flex xs12 class="ellipsis subtoolbar-subtitle subtext">{{selection.size | displaySelectionCount}}<obj class="mat-icon">check_box</obj>{{selectionDuration | displayTime}}</v-flex>
   </v-layout>
   <v-spacer></v-spacer>
   <v-btn :title="trans.removeall" flat icon class="toolbar-button" @click="removeSelectedItems()"><v-icon>remove_circle_outline</v-icon></v-btn>
   <v-btn :title="ACTIONS[ADD_TO_PLAYLIST_ACTION].title" flat icon class="toolbar-button" @click="addSelectionToPlaylist()"><v-icon>{{ACTIONS[ADD_TO_PLAYLIST_ACTION].icon}}</v-icon></v-btn>
   <v-divider vertical></v-divider>
   <v-btn :title="trans.invertSelect" flat icon class="toolbar-button" @click="invertSelection()"><img :src="'invert-select' | svgIcon(darkUi)"></img></v-btn>
   <v-btn :title="trans.cancel" flat icon class="toolbar-button" @click="clearSelection()"><v-icon>cancel</v-icon></v-btn>
  </v-layout>
  <v-layout v-else-if="searchActive">
  <v-btn flat icon @click="searchActive=false" class="toolbar-button back-button" :title="trans.goBack"><v-icon>arrow_back</v-icon></v-btn>
   <lms-search-list @scrollTo="highlightItem" :view="this"></lms-search-list>
  </v-layout>
  <v-layout v-else>
   <v-btn v-if="desktopLayout && windowWide>1" :title="pinQueue ? trans.unpin : trans.pin" flat icon class="toolbar-button" @click="togglePin" id="pq-pin-2"><img :src="(pinQueue ? 'pin' : 'unpin') | svgIcon(darkUi)"></img></v-btn>
   <div class="toolbar-nobtn-pad"></div>
   <div v-if="desktopLayout && pinQueue" style="width:2px"></div>
   <v-layout row wrap v-longpress="durationClicked" class="link-item">
    <v-flex xs12 class="ellipsis subtoolbar-title" v-bind:class="{'subtoolbar-title-single':undefined==duration || duration<=0}">{{remaining.show ? "-" :""}}{{(remaining.show ? remaining.size : listSize) | displayCount}}</v-flex>
    <v-flex xs12 v-if="undefined!=duration && duration>0" class="ellipsis subtoolbar-subtitle subtext">{{remaining.show ? "-" :""}}{{(remaining.show ? remaining.duration : duration) | displayTime}}{{name}}</v-flex>
   </v-layout>
   <v-spacer></v-spacer>
   <v-btn @click.stop="actionsMenu($event)" flat icon class="toolbar-button" :title="trans.actions" v-if="otherActions.length>0"><v-icon>more_horiz</v-icon></v-btn>
   <v-btn :title="trans.repeatOne" flat icon v-if="(desktopLayout || wide>0) && playerStatus.repeat===1" class="toolbar-button" v-bind:class="{'disabled':noPlayer}" v-longpress="repeatClicked"><v-icon>repeat_one</v-icon></img></v-btn>
   <v-btn :title="trans.repeatOne" flat icon v-else-if="(desktopLayout || wide>0) && playerStatus.repeat===1" class="toolbar-button" v-bind:class="{'disabled':noPlayer}" v-longpress="repeatClicked"><v-icon>repeat_one</v-icon></img></v-btn>
   <v-btn :title="trans.repeatAll" flat icon v-else-if="(desktopLayout || wide>0) && playerStatus.repeat===2" class="toolbar-button" v-bind:class="{'disabled':noPlayer}" v-longpress="repeatClicked"><v-icon>repeat</v-icon></v-btn>
   <v-btn :title="trans.dstm" flat icon v-else-if="(desktopLayout || wide>0) && dstm" class="toolbar-button" v-bind:class="{'disabled':noPlayer}" v-longpress="repeatClicked"><v-icon>all_inclusive</v-icon></v-btn>
   <v-btn :title="trans.repeatOff" flat icon v-else-if="desktopLayout || wide>0" class="toolbar-button dimmed" v-bind:class="{'disabled':noPlayer}" v-longpress="repeatClicked"><img class="svg-img media-icon" :src="'repeat-off' | svgIcon(darkUi)"></img></v-btn>

   <v-btn :title="trans.shuffleAlbums" flat icon v-if="(desktopLayout || wide>0) && playerStatus.shuffle===2" class="toolbar-button" v-bind:class="{'disabled':noPlayer}" @click="shuffleClicked"><img class="svg-img media-icon" :src="'shuffle-albums' | svgIcon(darkUi)"></v-btn>
   <v-btn :title="trans.shuffleAll" flat icon v-else-if="(desktopLayout || wide>0) && playerStatus.shuffle===1" class="toolbar-button" v-bind:class="{'disabled':noPlayer}" @click="shuffleClicked"><v-icon >shuffle</v-icon></v-btn>
   <v-btn :title="trans.shuffleOff" flat icon v-else-if="desktopLayout || wide>0" class="toolbar-button dimmed" v-bind:class="{'disabled':noPlayer}" @click="shuffleClicked"><img class="svg-img media-icon" :src="'shuffle-off' | svgIcon(darkUi)"></img></v-btn>
   <v-btn :title="ACTIONS[PQ_SAVE_ACTION].title | tooltip(LMS_SAVE_QUEUE_KEYBOARD,keyboardControl)" flat icon @click="save()" class="toolbar-button" v-bind:class="{'disabled':items.length<1}" v-if="(!LMS_KIOSK_MODE || !HIDE_FOR_KIOSK.has(PQ_SAVE_ACTION)) && !queryParams.party && wide>1"><v-icon>save</v-icon></v-btn>
   <v-btn :title="trans.clear | tooltip(LMS_CLEAR_QUEUE_KEYBOARD,keyboardControl)" flat icon v-longpress="clear" class="toolbar-button" v-bind:class="{'disabled':items.length<1}"v-if="!queryParams.party"><img class="svg-list-img" :src="'queue-clear' | svgIcon(darkUi)"></img></v-btn>
  </v-layout>
 </div>
 <div class="lms-list" v-bind:class="{'bgnd-cover':drawBgndImage||drawBackdrop||!desktopLayout, 'frosted':desktopLayout &&!drawBgndImage && !drawBackdrop && !pinQueue, 'queue-backdrop-cover':drawBackdrop}" id="queue-bgnd">
 <div class="lms-list" id="queue-list" v-bind:class="{'lms-list3':!albumStyle && threeLines,'lms-list-album':albumStyle,'bgnd-blur':drawBgndImage,'backdrop-blur':drawBackdrop}" @drop.stop="drop(-1, $event)">
  <div v-if="items.length<1"></div> <!-- RecycleScroller does not like it if 0 items? -->
  <RecycleScroller v-else-if="albumStyle" :items="items" :item-size="null" page-mode key-field="key" :buffer="LMS_SCROLLER_LIST_BUFFER">
  <v-list-tile avatar class="pq-albumstyle" v-bind:class="{'pq-track':!item.artistAlbum, 'pq-current-album':index!=currentIndex && currentIndex<items.length && item.grpKey==items[currentIndex].grpKey, 'pq-current': index==currentIndex, 'pq-current-first-track': index==currentIndex && item.artistAlbum, 'pq-pulse':index==currentIndex && pulseCurrent, 'list-active': menu.show && index==menu.index, 'drop-target': dragActive && index==dropIndex, 'highlight':index==highlightIndex}" @dragstart="dragStart(index, $event)" @dragend="dragEnd()" @dragover="dragOver(index, $event)" @drop.stop="drop(index, $event)" draggable @click.prevent.stop="click(item, index, $event)" slot-scope="{item, index}" key-field="key" @contextmenu.prevent="contextMenu(item, index, $event)">
   <v-list-tile-avatar :tile="true" v-bind:class="{'radio-image': 0==item.duration}" class="lms-avatar">
    <v-icon v-if="item.selected" v-bind:class="{'pq-first-track-check':item.artistAlbum}">check_box</v-icon>
    <img v-else-if="item.artistAlbum" :key="item.image" :src="item.image" onerror="this.src=DEFAULT_COVER" loading="lazy" v-bind:class="{'dimmed':item.image==DEFAULT_COVER || item.image==DEFAULT_RADIO_COVER}" class="radio-img allow-drag"></img>
   </v-list-tile-avatar>
   <div class="pq-album-header ellipsis" v-if="item.artistAlbum" v-html="item.artistAlbum"></div>
   <v-list-tile-content v-bind:class="{'pq-first-track':item.artistAlbum}">
    <v-list-tile-title v-html="item.title"></v-list-tile-title>
   </v-list-tile-content>
   <v-list-tile-action class="pq-time">{{item.durationStr}}</v-list-tile-action>
   <v-list-tile-action class="queue-action" v-bind:class="{'pq-first-track-menu':item.artistAlbum}" @click.stop="itemMenu(item, index, $event)">
    <div class="grid-btn list-btn hover-btn menu-btn" :title="i18n('%1 (Menu)', item.tooltip)"></div>
   </v-list-tile-action>
   <img v-if="index==currentIndex" class="pq-current-indicator" :src="'pq-current' | svgIcon(true, true)"></img>
  </v-list-tile>
 </RecycleScroller>
  <RecycleScroller v-else :items="items" :item-size="threeLines ? LMS_LIST_3LINE_ELEMENT_SIZE : LMS_LIST_ELEMENT_SIZE"  page-mode key-field="key" :buffer="LMS_SCROLLER_LIST_BUFFER">
    <v-list-tile avatar v-bind:class="{'pq-current': index==currentIndex, 'pq-pulse':index==currentIndex && pulseCurrent, 'list-active': menu.show && index==menu.index, 'drop-target': dragActive && index==dropIndex, 'highlight':index==highlightIndex}" @dragstart="dragStart(index, $event)" @dragend="dragEnd()" @dragover="dragOver(index, $event)" @drop.stop="drop(index, $event)" draggable @click.prevent.stop="click(item, index, $event)" slot-scope="{item, index}" key-field="key" @contextmenu.prevent="contextMenu(item, index, $event)">
     <v-list-tile-avatar :tile="true" v-bind:class="{'radio-image': 0==item.duration}" class="lms-avatar">
      <v-icon v-if="item.selected">check_box</v-icon>
      <img v-else :key="item.image" :src="item.image" onerror="this.src=DEFAULT_COVER" loading="lazy" v-bind:class="{'dimmed':item.image==DEFAULT_COVER || item.image==DEFAULT_RADIO_COVER}" class="radio-img allow-drag"></img>
     </v-list-tile-avatar>
     <v-list-tile-content v-if="undefined==item.size"> <!-- hacky work-around for view refresh when change album/track style -->
      <v-list-tile-title v-html="item.title"></v-list-tile-title>
      <v-list-tile-sub-title v-if="threeLines && queueContext" v-html="item.artistAlbum[2]"></v-list-tile-sub-title>
      <v-list-tile-sub-title v-else-if="threeLines" v-html="item.artistAlbum[0]"></v-list-tile-sub-title>
      <v-list-tile-sub-title v-else-if="queueContext" v-html="item.artistAlbum[2]+' '+item.artistAlbum[3]"></v-list-tile-sub-title>
      <v-list-tile-sub-title v-else v-html="item.artistAlbum[0]+SEPARATOR+item.artistAlbum[1]"></v-list-tile-sub-title>
      <v-list-tile-sub-title v-if="threeLines && queueContext" v-html="item.artistAlbum[3]"></v-list-tile-sub-title>
      <v-list-tile-sub-title v-else-if="threeLines" v-html="item.artistAlbum[1]"></v-list-tile-sub-title>
     </v-list-tile-content>
     <v-list-tile-action class="pq-time">{{item.durationStr}}</v-list-tile-action>
     <v-list-tile-action class="queue-action" @click.stop="itemMenu(item, index, $event)">
      <div class="grid-btn list-btn hover-btn menu-btn" :title="i18n('%1 (Menu)', item.tooltip)"></div>
     </v-list-tile-action>
     <img v-if="index==currentIndex" class="pq-current-indicator" :src="'pq-current' | svgIcon(true, true)"></img>
    </v-list-tile>
   </RecycleScroller>
  </div>
 </div>

 <v-menu offset-y v-model="menu.show" :position-x="menu.x" :position-y="menu.y">
  <v-list v-if="menu.item">
   <template v-for="(action, index) in menu.item.actions">
    <v-divider v-if="DIVIDER==action"></v-divider>
    <template v-for="(cact, cindex) in queueCustomActions" v-else-if="CUSTOM_ACTIONS==action">
     <v-list-tile @click="itemCustomAction(cact, menu.item, menu.index, $event)">
      <v-list-tile-avatar>
       <v-icon v-if="undefined==cact.svg">{{cact.icon}}</v-icon>
       <img v-else class="svg-img" :src="cact.svg | svgIcon(darkUi)"></img>
      </v-list-tile-avatar>
      <v-list-tile-title>{{cact.title}}</v-list-tile-title>
     </v-list-tile>
    </template>
    <v-list-tile v-else-if="action==SELECT_ACTION && menu.item.selected" @click="itemAction(UNSELECT_ACTION, menu.item, menu.index, $event)">
     <v-list-tile-avatar>
      <v-icon>{{ACTIONS[UNSELECT_ACTION].icon}}</v-icon>
     </v-list-tile-avatar>
     <v-list-tile-title>{{ACTIONS[UNSELECT_ACTION].title}}</v-list-tile-title>
    </v-list-tile>
    <v-list-tile v-else-if="action==PQ_REMOVE_DISC_ACTION ? undefined!=menu.item.disc && menu.item.disc>0 : action==PQ_REMOVE_ALBUM_ACTION ? undefined!=menu.item.album_id : action==PQ_COPY_ACTION ? browseSelection : action==MOVE_HERE_ACTION ? (selection.size>0 && !menu.item.selected) : action==PQ_ZAP_ACTION ? LMS_P_CS : action==DOWNLOAD_ACTION ? lmsOptions.allowDownload && menu.item.isLocal : (action!=PQ_PLAY_NEXT_ACTION || (menu.index!=currentIndex && menu.index!=currentIndex+1))" @click="itemAction(action, menu.item, menu.index, $event)">
     <v-list-tile-avatar>
      <v-icon v-if="undefined==ACTIONS[action].svg">{{ACTIONS[action].icon}}</v-icon>
      <img v-else class="svg-img" :src="ACTIONS[action].svg | svgIcon(darkUi)"></img>
     </v-list-tile-avatar>
     <v-list-tile-title>{{ACTIONS[action].title}}</v-list-tile-title>
    </v-list-tile>
   </template>
  </v-list>
  <v-list v-else>
   <template v-for="(action, index) in menu.actions">
    <v-list-tile @click="headerAction(action, $event)" v-bind:class="{'disabled':(items.length<1 && PQ_REQUIRE_AT_LEAST_1_ITEM.has(action)) || (items.length<2 && PQ_REQUIRE_MULTIPLE_ITEMS.has(action))}" v-if="(!LMS_KIOSK_MODE || !HIDE_FOR_KIOSK.has(action)) && (action==PQ_SAVE_ACTION ? wide<2 : action!=PQ_MOVE_QUEUE_ACTION || showMoveAction)">
     <v-list-tile-avatar>
      <v-icon v-if="action==PQ_TOGGLE_VIEW_ACTION && albumStyle">music_note</v-icon>
      <v-icon v-else-if="undefined==ACTIONS[action].svg">{{ACTIONS[action].icon}}</v-icon>
      <img v-else class="svg-img" :src="ACTIONS[action].svg | svgIcon(darkUi)"></img>
     </v-list-tile-avatar>
     <v-list-tile-title v-if="keyboardControl" style="padding-right:24px">{{ACTIONS[action].title}}</v-list-tile-title>
     <v-list-tile-title v-else>{{ACTIONS[action].title}}</v-list-tile-title>
     <v-list-tile-action v-if="ACTIONS[action].key && keyboardControl" class="menu-shortcut-large">{{shortcutStr(ACTIONS[action].key, action==SEARCH_LIST_ACTION)}}</v-list-tile-action>
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
            pulseCurrent: false,
            listSize:0,
            duration: 0.0,
            playerStatus: { shuffle:0, repeat: 0 },
            remaining: {show:false, size:0, duration:0},
            trans: { ok: undefined, cancel: undefined, clear:undefined, pin:undefined, unpin:undefined, goBack:undefined,
                     repeatAll:undefined, repeatOne:undefined, repeatOff:undefined, shuffleAll:undefined, shuffleAlbums:undefined,
                     shuffleOff:undefined, selectMultiple:undefined, removeall:undefined, invertSelect:undefined, dstm:undefined, actions:undefined },
            menu: { show:false, item: undefined, x:0, y:0, index:0},
            playlist: {name: undefined, modified: false},
            selection: new Set(),
            selectionDuration: 0,
            otherActions: queryParams.party ? [PQ_SCROLL_ACTION, SEARCH_LIST_ACTION] : [PQ_SAVE_ACTION, PQ_MOVE_QUEUE_ACTION, PQ_SCROLL_ACTION, SEARCH_LIST_ACTION, PQ_ADD_URL_ACTION, PQ_SORT_ACTION, REMOVE_DUPES_ACTION, PQ_TOGGLE_VIEW_ACTION],
            wide: 0,
            dstm: false,
            dragActive: false,
            dropIndex: -1,
            highlightIndex: -1,
            searchActive: false,
            coverUrl: undefined,
            queueCustomActions: [],
            nowPlayingExpanded: false,
            nowPlayingWide:0,
            windowWide:2
        }
    },
    computed: {
        darkUi () {
            return this.$store.state.darkUi
        },
        albumStyle() {
            return this.$store.state.queueAlbumStyle
        },
        threeLines() {
            return this.$store.state.queueThreeLines
        },
        queueContext() {
            return this.$store.state.queueContext && this.wide>2
        },
        keyboardControl() {
            return this.$store.state.keyboardControl && !IS_MOBILE
        },
        desktopLayout() {
            return this.$store.state.desktopLayout
        },
        showQueue() {
            return this.$store.state.showQueue
        },
        pinQueue() {
            return this.$store.state.pinQueue && this.windowWide>1
        },
        noPlayer() {
            return !this.$store.state.player
        },
        drawBgndImage() {
            return this.$store.state.queueBackdrop && undefined!=this.coverUrl
        },
        drawBackdrop() {
            return !this.drawBgndImage && this.$store.state.queueBackdrop && this.$store.state.useDefaultBackdrops
        },
        showMoveAction() {
            if (queryParams.party) {
                return false;
            }
            return !queryParams.party && this.$store.state.players && this.$store.state.players.length>1
        },
        name() {
            return this.listSize>0 && undefined!=this.playlist.name && this.playlist.name.length>0
                    ? (" (" + this.playlist.name + (this.playlist.modified ? ' *' : '') +")") : ""
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
        bus.$on('closeQueue', function() {
            if (this.searchActive) {
                this.searchActive = false;
            } else {
                this.$store.commit('setShowQueue', false);
            }
        }.bind(this));
        bus.$on('queueDisplayChanged', function() {
            this.items=[];
            this.listSize=0;
            this.timestamp=0;
            this.updateItems();
        }.bind(this));
        bus.$on('setBgndCover', function() {
            this.setBgndCover();
        }.bind(this));
        bus.$on('playerChanged', function() {
            this.items=[];
            this.listSize=0;
            this.timestamp=0;
            this.getDuration();
            this.clearSelection();
        }.bind(this));
        bus.$on('customActions', function(val) {
            this.queueCustomActions = getCustomActions("queue-track", false);
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
                this.getDuration();
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
                    let addedClass = false;
                    if (this.albumStyle) {
                        let artist = i.albumartist ? i.albumartist : i.artist ? i.artist : i.trackartist;
                        let extra = buildArtistLine(i, 'queue', false, artist);
                        if (!isEmpty(extra)) {
                            title+='<obj class="subtext">'+SEPARATOR+extra;
                            addedClass = true;
                        }
                    }
                    if (this.$store.state.showRating && undefined!=i.rating) {
                        title += (this.albumStyle && !addedClass ? '<obj class="subtext">' : '') + SEPARATOR+ratingString(undefined, i.rating) + (this.albumStyle ? '</obj>': '');
                    } else if (addedClass) {
                        title+='</obj>';
                    }
                    var artistAlbum = undefined!=this.items[index].artistAlbum ? buildArtistAlbumLines(i, this.$store.state.queueAlbumStyle, this.$store.state.queueContext) : undefined;
                    // ?? var remoteTitle = checkRemoteTitle(i);
                    var duration = undefined==i.duration ? undefined : parseFloat(i.duration);

                    if (title!=this.items[index].title || artistAlbum!=this.items[index].artistAlbum || duration!=this.items[index].duration) {
                        this.items[index].title = title;
                        this.items[index].tooltip = i.title;
                        if (undefined!=artistAlbum) {
                            this.items[index].artistAlbum = artistAlbum;
                        }
                        this.items[index].artist = i.artist ? i.artist : i.trackartist ? i.trackartist : i.albumartist;
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
            setTimeout(function() { this.$forceUpdate(); }.bind(this), 500);
        }.bind(this));

        bus.$on('langChanged', function() {
            this.initItems();
        }.bind(this));
        this.initItems();

        bus.$on('closeMenu', function() {
            this.menu.show = false;
        }.bind(this));

        bus.$on('escPressed', function() {
            if (this.dragActive) {
                return;
            }
            if (this.selection.size>0) {
                this.clearSelection();
            }
        }.bind(this));

        bus.$on('linkClicked', function() {
            if (this.$store.state.desktopLayout && this.windowWide<2 && !this.$store.state.pinQueue && this.$store.state.showQueue) {
                this.$store.commit('setShowQueue', false);
            }
        }.bind(this));

        this.nowPlayingExpanded = false;
        bus.$on('nowPlayingExpanded', function(val) {
            this.nowPlayingExpanded = val;
        }.bind(this));
        bus.$on('nowPlayingWide', function(val) {
            this.nowPlayingWide = val;
        }.bind(this));
        this.bgndElement = document.getElementById("queue-bgnd");
        this.scrollElement = document.getElementById("queue-list");
        this.scrollElement.addEventListener("scroll", this.handleScroll, PASSIVE_SUPPORTED ? { passive: true } : false);
        msRegister(this, this.scrollElement);
        this.viewElement = document.getElementById("queue-view");
        document.addEventListener("click", this.clickListener, PASSIVE_SUPPORTED ? { passive: true } : false);

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
                     this.updateWidth();
                });
            }
        }.bind(this));
        // Press on 'queue' nav button whilst in queue scrolls to current track
        bus.$on('nav', function(page) {
            if ('queue'==page) {
                this.scrollToCurrent(true);
            }
        }.bind(this));

        // Always place items in menu, so no need to update on width changes
        bus.$on('windowWidthChanged', function() {
            this.$nextTick(function () {
                this.updateWidth();
            });
        }.bind(this));
        bus.$on('splitterChanged', function() {
            this.updateWidth();
        }.bind(this));
        bus.$on('resizerChanged', function() {
            this.updateWidth();
        }.bind(this));
        this.wide=3;
        this.updateWidth();

        bus.$on('layoutChanged', function(action) {
            let pos = this.scrollElement.scrollTop;
            if (pos>0) {
                this.$nextTick(function () {
                    setScrollTop(this, pos);
                });
            }
        }.bind(this));

        bus.$on('prefset', function(pref, value, player) {
            if ("plugin.dontstopthemusic:provider"==pref && player==this.$store.state.player.id) {
                this.dstm = (""+value)!="0";
            }
        }.bind(this));
        if (!IS_MOBILE) {
            if (!queryParams.party && (!LMS_KIOSK_MODE || !HIDE_FOR_KIOSK.has(PQ_SAVE_ACTION))) {
                bindKey(LMS_SAVE_QUEUE_KEYBOARD, 'mod');
            }
            if (!queryParams.party) {
                bindKey(LMS_CLEAR_QUEUE_KEYBOARD, 'mod');
            }
            if (!queryParams.party && (!LMS_KIOSK_MODE || !HIDE_FOR_KIOSK.has(PQ_ADD_URL_ACTION))) {
                bindKey(LMS_QUEUE_ADD_URL_KEYBOARD, 'mod');
            }
            bindKey(LMS_SCROLL_QUEUE_KEYBOARD, 'mod');
            if (!queryParams.party && (!LMS_KIOSK_MODE || !HIDE_FOR_KIOSK.has(PQ_SORT_ACTION))) {
                bindKey(LMS_SORT_QUEUE_KEYBOARD, 'mod');
            }
            if (!queryParams.party && (!LMS_KIOSK_MODE || !HIDE_FOR_KIOSK.has(PQ_MOVE_QUEUE_ACTION))) {
                bindKey(LMS_MOVE_QUEUE_KEYBOARD, 'mod');
            }
            bindKey('pageup', 'alt', true);
            bindKey('pagedown', 'alt', true);
            bindKey(LMS_SEARCH_KEYBOARD, 'mod+shift');
            bus.$on('keyboard', function(key, modifier) {
                if (this.$store.state.openDialogs.length>0 || (this.$store.state.visibleMenus.size>0 && !this.$store.state.visibleMenus.has('queue')) || (!this.$store.state.desktopLayout && this.$store.state.page!="queue")) {
                    return;
                }
                this.menu.show = false;
                if ('mod'==modifier) {
                    if (LMS_SAVE_QUEUE_KEYBOARD==key) {
                        this.save();
                    } else if (LMS_CLEAR_QUEUE_KEYBOARD==key) {
                        this.clear();
                    } else if (LMS_QUEUE_ADD_URL_KEYBOARD==key || LMS_SCROLL_QUEUE_KEYBOARD==key || LMS_MOVE_QUEUE_KEYBOARD==key || LMS_SORT_QUEUE_KEYBOARD==key) {
                        this.headerAction(LMS_QUEUE_ADD_URL_KEYBOARD==key ? PQ_ADD_URL_ACTION : LMS_SCROLL_QUEUE_KEYBOARD==key ? PQ_SCROLL_ACTION : LMS_SORT_QUEUE_KEYBOARD==key ? PQ_SORT_ACTION : PQ_MOVE_QUEUE_ACTION);
                    }
                } else if ('alt'==modifier || (undefined==modifier && !this.$store.state.desktopLayout && this.$store.state.page=="queue")) {
                    if ('pageup'==key) {
                        this.scrollElement.scrollBy(0, -1*this.scrollElement.clientHeight);
                    } else if ('pagedown'==key) {
                        this.scrollElement.scrollBy(0, this.scrollElement.clientHeight);
                    }
                } else if ('mod+shift'==modifier) {
                    if (LMS_SEARCH_KEYBOARD==key) {
                        if (this.$store.state.desktopLayout ? this.$store.state.showQueue : this.$store.state.page=="queue") {
                            this.headerAction(SEARCH_LIST_ACTION);
                        }
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
        bus.$on('queueDialogClosed', function() {
            this.resetCloseTimer();
        }.bind(this));
    },
    methods: {
        initItems() {
            this.trans= { ok:i18n('OK'), cancel: i18n('Cancel'), clear:i18n("Clear queue"),
                          pin:i18n('Pin'), unpin:i18n('Unpin'), goBack:i18n("Go back"),
                          repeatAll:i18n("Repeat queue"), repeatOne:i18n("Repeat single track"), repeatOff:i18n("No repeat"),
                          shuffleAll:i18n("Shuffle tracks"), shuffleAlbums:i18n("Shuffle albums"), shuffleOff:i18n("No shuffle"),
                          selectMultiple:i18n("Select multiple items"), removeall:i18n("Remove all selected items"), 
                          invertSelect:i18n("Invert selection"), dstm:i18n("Don't Stop The Music"), actions:i18n("Actions")
            };
        },
        updateWidth() {
            var wide = this.scrollElement.clientWidth>=550 ? 3 : this.scrollElement.clientWidth>=420 ? 2 : this.scrollElement.clientWidth>=340 ? 1 : 0;
            if (wide!=this.wide) {
                this.wide = wide;
            }
            this.windowWide = window.innerWidth>=MIN_PQ_PIN_WIDTH ? 2 : window.innerWidth>=MIN_PQ_RESIZE_WIDTH ? 1 : 0;
        },
        handleScroll() {
            this.menu.show = false;
            if (undefined==this.scrollAnim) {
                this.scrollAnim = requestAnimationFrame(() => {
                    this.scrollAnim = undefined;
                    this.resetCloseTimer();

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
            msHandleScrollEvent(this);
        },
        clickListener(e) {
            if (!this.$store.state.desktopLayout || (this.$store.state.pinQueue && this.windowWide>1) || !this.$store.state.showQueue || resizerActive ||
                (this.$store.state.openDialogs.length>0 && ('info-dialog'!=this.$store.state.openDialogs[0] || this.$store.state.openDialogs.length>1)) ||
                this.menu.show) {
                return;
            }
            let clickX = e['pageX'] || e.clientX;
            if (clickX==undefined && e.touches) {
                clickX = e.touches[0].pageX;
            }
            let clickY = e['pageY'] || e.clientY;
            if (clickY==undefined && e.touches) {
                clickY = e.touches[0].pageY;
            }
            // Ignore clicks within main toolbar - unless on (i) or empty space
            if (inRect(clickX, clickY, 0, 0, window.innerWidth, 48, 2) &&
                (!e.target || (e.target.className!="v-toolbar__content" && e.target.id!="info-btn" && e.target.id!="info-icon"))) {
                return;
            }
            // Ignore clicks within queue
            if (inRect(clickX, clickY, window.innerWidth-this.viewElement.scrollWidth, 48, window.innerWidth, window.innerHeight-(48+72), 4)) {
                this.resetCloseTimer();
                return;
            }
            // Ignore clicks on now-playing bar controls
            if (this.items.length>0 && !this.nowPlayingExpanded && inRect(clickX, clickY, 0, window.innerHeight-72, window.innerWidth<=550 ? 90 : 162, 72, 4)) {
                return;
            }
            this.$store.commit('setShowQueue', false);
        },
        togglePin() {
            if (!this.$store.state.pinQueue) {
                bus.$emit('npclose');
            }
            this.$store.commit('setPinQueue', !this.$store.state.pinQueue);
            this.updateWidth();
        },
        droppedFileHandler(ev) {
            if (queryParams.party) {
                return;
            }
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
                bus.$emit('refreshStatus');
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
            if (this.items.length<1 || queryParams.party) {
                return;
            }
            this.cancelCloseTimer();
            bus.$emit('dlg.open', 'savequeue', ""+(undefined==this.playlist.name ? "" : this.playlist.name));
        },
        clear(longPress) {
            if (this.items.length<1 || queryParams.party) {
                return;
            }
            if (longPress) {
                bus.$emit('playerCommand', ["playlist", "clear"]);
                return;
            }
            let choices=[{id:0, title:i18n('Remove all tracks')},
                         {id:1, title:i18n('Remove upcoming tracks'), disabled:this.currentIndex>=this.items.length-1},
                         {id:2, title:i18n('Remove previous tracks'), disabled:this.currentIndex<=0}];
            this.cancelCloseTimer(true);
            choose(this.trans.clear+"?", choices).then(choice => {
                if (undefined!=choice) {
                    this.resetCloseTimer();
                    if (0==choice.id) {
                        bus.$emit('playerCommand', ["playlist", "clear"]);
                        if (!(this.$store.state.pinQueue && this.windowWide>1)) {
                            this.$store.commit('setShowQueue', false);
                        }
                    } else {
                        let indexes = [];
                        let start = (1==choice.id ? this.items.length : this.currentIndex)-1;
                        let end = (1==choice.id ? this.currentIndex+1 : 0);
                        for (let i=start; i>=end; --i) {
                            indexes.push(i);
                        }
                        if (indexes.length>0) {
                            this.removeIndexes(indexes);
                        }
                    }
                }
            });
        },
        click(item, index, event) {
            storeClickOrTouchPos(event, this.menu);
            this.resetCloseTimer();
            if (queryParams.party) {
                return;
            }
            if (this.selection.size>0) {
                let clickX = event['pageX'] || event.clientX;
                if (clickX==undefined && event.touches) {
                    clickX = event.touches[0].pageX;
                }
                let listRight = this.scrollElement.getBoundingClientRect().right;
                if (clickX>(listRight-64)) {
                    this.itemMenu(item, index, event);
                } else {
                    this.select(item, index, event);
                }
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
            if (!queryParams.party) {
                this.itemMenu(item, index, event);
            }
        },
        doubleClick(item, index, event) {
            if (!queryParams.party) {
                this.itemAction(PQ_PLAY_NOW_ACTION, item, index, event);
            }
        },
        removeIndexes(indexes) {
            indexes.sort(function(a, b) { return a<b ? 1 : -1; });
            lmsCommand(this.$store.state.player.id, ["material-skin-client", "remove-queue", "indexes:"+indexes.join(",")]).then(({data}) => {
                bus.$emit("updatePlayer", this.$store.state.player.id);
            });
        },
        itemAction(act, item, index, event) {
            storeClickOrTouchPos(event, this.menu);
            if (queryParams.party) {
                return;
            }
            if (PQ_PLAY_NOW_ACTION===act) {
                this.clearSelection();
                bus.$emit('playerCommand', ["playlist", "index", index]);
            } else if (PQ_PLAY_NEXT_ACTION===act) {
                if (index!==this.currentIndex) {
                    this.clearSelection();
                    bus.$emit('playerCommand', ["playlist", "move", index, index>this.currentIndex ? this.currentIndex+1 : this.currentIndex]);
                }
            } else if (REMOVE_ACTION===act) {
                this.clearSelection();
                bus.$emit('playerCommand', ["playlist", "delete", index]);
            } else if (PQ_REMOVE_ALBUM_ACTION==act) {
                this.clearSelection();
                bus.$emit('playerCommand', ["playlistcontrol", "cmd:delete", "album_id:"+item.album_id]);
            } else if (PQ_REMOVE_DISC_ACTION==act) {
                var indexes = [];
                for (var i=0, len=this.items.length; i<len; ++i) {
                    if (this.items[i].album_id == item.album_id && this.items[i].disc == item.disc) {
                        indexes.push(i);
                    }
                }
                if (indexes.length>0) {
                    this.clearSelection();
                    this.removeIndexes(indexes);
                }
            } else if (MORE_ACTION===act) {
                let clone = JSON.parse(JSON.stringify(item));
                clone.title = queueMakePlain(item.title);
                bus.$emit('trackInfo', clone, index, 'queue');
                if (this.$store.state.desktopLayout) {
                    if (!this.$store.state.pinQueue) {
                        this.$store.commit('setShowQueue', false);
                    }
                    bus.$emit('closeNowPlaying');
                } else {
                    this.$store.commit('setPage', 'browse');
                }
                this.clearSelection();
            } else if (SELECT_ACTION===act) {
                if (!this.selection.has(index)) {
                    if (0==this.selection.size) {
                        bus.$emit('queueSelection', true);
                        lmsQueueSelectionActive = true;
                        this.cancelCloseTimer();
                    }
                    this.selection.add(index);
                    this.selectionDuration += itemDuration(this.items[index]);
                    item.selected = true;
                    forceItemUpdate(this, item);
                    if (event && (event.shiftKey || event.ctrlKey) && undefined!=this.lastSelect && index!=this.lastSelect) {
                        for (var i=this.lastSelect<index ? this.lastSelect : index, stop=this.lastSelect<index ? index : this.lastSelect, len=this.items.length; i<=stop && i<len; ++i) {
                            this.itemAction(SELECT_ACTION, this.items[i], i);
                        }
                    }
                }
                this.lastSelect = index;
            } else if (UNSELECT_ACTION===act) {
                this.lastSelect = undefined;
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
                this.clearSelection();
                lmsCommand(this.$store.state.player.id, ["playlist", "zap", index]).then(({data}) => {
                    bus.$emit('showMessage', i18n("Zapped '%1'", item.title));
                });
            } else if (ADD_TO_PLAYLIST_ACTION==act) {
                this.clearSelection();
                this.cancelCloseTimer(true);
                bus.$emit('dlg.open', 'addtoplaylist', [item], [], 'queueDialogClosed');
            } else if (PQ_COPY_ACTION==act) {
                this.clearSelection();
                bus.$emit('browseQueueDrop', -1, index, this.listSize);
            } else if (DOWNLOAD_ACTION==act) {
                this.clearSelection();
                download(item);
            } else if (SHOW_IMAGE_ACTION==act) {
                this.cancelCloseTimer(true);
                bus.$emit('dlg.open', 'gallery', [item.image], 0, true, 'queueDialogClosed');
            }
        },
        itemCustomAction(act, item, index, event) {
            storeClickOrTouchPos(event, this.menu);
            let cmd = performCustomAction(act, this.$store.state.player, item);
            if (cmd!=undefined) {
                bus.$emit('browse', cmd.command, cmd.params, item.title, 'queue');
            }
        },
        headerAction(act, event) {
            if ((this.$store.state.visibleMenus.size>0 && this.otherActions.indexOf(act)<0)) {
                return;
            }
            storeClickOrTouchPos(event, this.menu);
            if (act==PQ_SAVE_ACTION) {
                this.save();
            } else if (act==PQ_SCROLL_ACTION) {
                if (this.items.length>=1) {
                    this.scrollToCurrent(true);
                }
            } else if (queryParams.party) {
                return;
            }
            if (act==PQ_ADD_URL_ACTION) {
                this.cancelCloseTimer(true);
                promptForText(ACTIONS[PQ_ADD_URL_ACTION].title, i18n("URL"), undefined, i18n("Add")).then(resp => {
                    this.resetCloseTimer();
                    if (resp.ok && resp.value && resp.value.length>0) {
                        lmsCommand(this.$store.state.player.id, ["playlist", this.items.length==0 ? "play" : "add", resp.value]).then(({data}) => {
                            bus.$emit('refreshStatus');
                        });
                    }
                });
            } else if (act==PQ_MOVE_QUEUE_ACTION) {
                if (!this.$store.state.player || !this.$store.state.players || this.$store.state.players.length<2) {
                    return;
                } else if (this.items.length>=1) {
                    let opts = [
                        { val:0, title:i18n("Copy the queue to:")},
                        { val:1, title:i18n("Move the queue to:")},
                        { val:2, title:i18n("Swap the queue with:")}
                    ]
                    let players = [ ];
                    for (let i=0, loop=this.$store.state.players, len=loop.length; i<len; ++i) {
                        if (loop[i].id!=this.$store.state.player.id) {
                            players.push({val:loop[i].id, title:loop[i].name, icon:loop[i].icon.icon, svg:loop[i].icon.svg});
                        }
                    }
                    this.cancelCloseTimer(true);
                    choose("", players, {options:opts, key:'movequeue', def:1}).then(choice => {
                        this.resetCloseTimer();
                        if (undefined==choice) {
                            return;
                        }
                        lmsCommand("", ["material-skin", "transferqueue", "from:"+this.$store.state.player.id, "to:"+choice.item.val, "mode:"+(0==choice.option.val ? 'copy' : 1==choice.option.val ? 'move' : 'swap')]).then(({data}) => {
                            this.$store.commit('setPlayer', choice.item.val);
                            if (0==choice.option.val) {
                                bus.$emit('showMessage', i18n("Queue copied to '%1'", choice.item.title));
                            }
                        });
                    });
                }
            } else if (PQ_SORT_ACTION==act) {
                if (this.items.length>=1) {
                    sortPlaylist(this, this.$store.state.player.id, ACTIONS[act].title, ["material-skin-client", "sort-queue"]);
                }
            } else if (REMOVE_DUPES_ACTION==act) {
                if (this.items.length<2) {
                    return;
                }
                this.cancelCloseTimer(true);
                confirm(i18n("Remove duplicate tracks?")+addNote(i18n("This will remove tracks with the same artist and title.")), i18n('Remove')).then(res => {
                    this.resetCloseTimer();
                    if (res) {
                        let dupes=[];
                        let tracks = new Set();
                        let ids = new Set();
                        for (let i=0, loop=this.items, len=loop.length; i<len; ++i) {
                            let item = loop[i];
                            let title = queueMakePlain(item.title);
                            if (this.$store.state.queueShowTrackNum) {
                                let vals = title.split(SEPARATOR);
                                if (2==vals.length) {
                                    title = vals[1];
                                }
                            }
                            let track = title.toLowerCase()+"-"+(item.artist ? item.artist.toLowerCase() : "");
                            if (tracks.has(track) || ids.has(item.id)) {
                                dupes.push(i);
                            }
                            tracks.add(track);
                            ids.add(item.id);
                        }
                        if (dupes.length>0) {
                            this.removeIndexes(dupes);
                        } else {
                            bus.$emit('showMessage', i18n('No duplicates found'));
                        }
                    }
                });
            } else if (PQ_TOGGLE_VIEW_ACTION==act) {
                this.$store.commit('setQueueAlbumStyle', !this.$store.state.queueAlbumStyle);
            } else if (SEARCH_LIST_ACTION==act) {
                if (this.items.length>1) {
                    this.searchActive = true;
                }
            }
        },
        actionsMenu(event) {
            if (this.$store.state.visibleMenus.size>0 && undefined!=this.menu && undefined!=this.menu.actions) {
                return;
            }
            showMenu(this, {show:true, actions:this.otherActions, x:event.clientX, y:event.clientY});
        },
        itemMenu(item, index, event) {
            showMenu(this, {show:true, item:item, index:index, x:event.clientX, y:event.clientY});
        },
        contextMenu(item, index, event) {
            if (!IS_MOBILE) {
                this.itemMenu(item, index, event);
            }
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
            this.removeIndexes(Array.from(this.selection));
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
            this.lastSelect = undefined;
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
            this.resetCloseTimer();
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
            lmsList(this.$store.state.player.id, ["status"], [PQ_STATUS_TAGS + ((!IS_MOBILE || lmsOptions.touchLinks) ? "s" : "") + (this.$store.state.showRating ? "R" : "")], this.items.length, fetchCount).then(({data}) => {
                var resp = parseResp(data, this.$store.state.queueShowTrackNum, this.items.length, this.$store.state.showRating, this.$store.state.queueAlbumStyle,
                                     this.$store.state.queueContext, this.items.length>0 ? this.items[this.items.length-1] : undefined);
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
                    var resp = parseResp(data, this.$store.state.queueShowTrackNum, 0, this.$store.state.showRating, this.$store.state.queueAlbumStyle, this.$store.state.queueContext);
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
            if (this.searchActive ||
                (!this.$store.state.desktopLayout && this.$store.state.page!='queue') ||
                (this.$store.state.desktopLayout && !this.$store.state.showQueue)) {
                this.autoScrollRequired = true;
                return;
            }
            this.autoScrollRequired = false;
            this.scrollToIndex(pulse, this.currentIndex);
        },
        scrollToIndex(pulse, index) {
            var scroll = this.items.length>5 && index>=0;
            if (scroll || (pulse && this.items.length>0)) {
                if (index<this.items.length) {
                    if (scroll) {
                        let pos = 0;
                        if (index>3) {
                            if (this.$store.state.queueAlbumStyle) {
                                for (let i=0, loop=this.items, stop=index-3; i<stop; ++i) {
                                    pos += loop[i].size;
                                }
                            } else {
                                pos = (index-3)*(this.$store.state.queueThreeLines ? LMS_LIST_3LINE_ELEMENT_SIZE : LMS_LIST_ELEMENT_SIZE);
                            }
                        }
                        setScrollTop(this, pos>0 ? pos : 0);
                        setTimeout(function () {
                            setScrollTop(this, pos>0 ? pos : 0);
                        }.bind(this), 100);
                    }
                    if (pulse) {
                        setTimeout(function () {
                            this.pulseCurrent=true;
                            setTimeout(function () { this.pulseCurrent=false; }.bind(this), 1100);
                        }.bind(this), scroll ? 110 : 5);
                    }
                } else if (scroll) {
                    this.autoScrollRequired = true;
                    this.fetchItems();
                }
            }
        },
        highlightItem(index) {
            this.highlightIndex = index;
            if (index>=0 && index<this.items.length) {
                this.scrollToIndex(false, index);
            }
        },
        dragStart(which, ev) {
            if (queryParams.party) {
                return;
            }
            bus.$emit('dragActive', true);
            ev.dataTransfer.dropEffect = 'move';
            ev.dataTransfer.setData('Text', this.items[which].title);
            this.dragElem = ev.target.nodeName=='IMG' ? ev.srcElement.parentNode.parentNode.parentNode : ev.srcElement;
            setListElemClass(this.dragElem, 'dragging', true);
            ev.dataTransfer.setDragImage(this.dragElem, 0, 0);
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
                selection.push(this.dragIndex);
            }
            var urls = [];
            for (var i=0, len=selection.length; i<len; ++i) {
                if (i>=0 && i<this.items.length) {
                    urls.push(this.items[selection[i]].url);
                }
            }
            return urls;
        },
        dragEnd() {
            setListElemClass(this.dragElem, 'dragging', false);
            this.dragElem = undefined;
            this.stopScrolling = true;
            this.dragIndex = undefined;
            this.dropIndex = -1;
            window.mskQueueDrag = undefined;
            // Delay setting drag inactive so that we ignore a potential 'Esc' that cancelled drag
            setTimeout(function () { bus.$emit('dragActive', false); }.bind(this), 250);
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
            if (to<0) {
                to=this.dragIndex!=undefined ? this.items.length-1 : this.items.length;
            }
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
                } else {
                    this.droppedFileHandler(ev);
                }
            }
            this.dragIndex = undefined;
        },
        setBgndCover() {
            var url = this.$store.state.queueBackdrop ? this.coverUrl : undefined;
            if (!url && this.drawBackdrop) {
                url='material/backdrops/queue.jpg';
            }
            setBgndCover(this.bgndElement, url);
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
        shuffleClicked() {
            if (this.$store.state.visibleMenus.size>0 || queryParams.party) {
                return;
            }
            if (this.playerStatus.shuffle===2) {
                bus.$emit('playerCommand', ['playlist', 'shuffle', 0]);
            } else if (this.playerStatus.shuffle===1) {
                bus.$emit('playerCommand', ['playlist', 'shuffle', 2]);
            } else {
                bus.$emit('playerCommand', ['playlist', 'shuffle', 1]);
            }
        },
        repeatClicked(longPress) {
            if (this.$store.state.visibleMenus.size>0 || queryParams.party) {
                return;
            }
            if (this.playerStatus.repeat===0) {
                if (LMS_P_DSTM) {
                    if (longPress) {
                        bus.$emit('dlg.open', 'dstm');
                    } else if (this.dstm) {
                        lmsCommand(this.$store.state.player.id, ["material-skin-client", "save-dstm"]).then(({data}) => {
                            bus.$emit("dstm", this.$store.state.player.id, 0);
                        });
                    } else {
                        bus.$emit('playerCommand', ['playlist', 'repeat', 2]);
                    }
                } else {
                    bus.$emit('playerCommand', ['playlist', 'repeat', 2]);
                }
            } else if (this.playerStatus.repeat===1) {
                bus.$emit('playerCommand', ['playlist', 'repeat', 0]);
            } else if (this.playerStatus.repeat===2) {
                bus.$emit('playerCommand', ['playlist', 'repeat', 1]);
                if (LMS_P_DSTM) {
                    lmsCommand(this.$store.state.player.id, ["material-skin-client", "get-dstm"]).then(({data}) => {
                        if (data && data.result && undefined!=data.result.provider) {
                            bus.$emit("dstm", this.$store.state.player.id, data.result.provider);
                        }
                    });
                }
            }
        },
        durationClicked(longPress) {
            if (this.remaining.show) {
                this.remaining.show = false;
                clearTimeout(this.remainingTimeout);
                return;
            }
            if (longPress && this.$store.state.player && this.$store.state.players && this.$store.state.players.length>1) {
                if (queryParams.party || (LMS_KIOSK_MODE && HIDE_FOR_KIOSK.has(PQ_MOVE_QUEUE_ACTION))) {
                    return;
                }
                this.headerAction(PQ_MOVE_QUEUE_ACTION);
                return;
            }
            if (this.items.length>0 && this.items.length==this.listSize) {
                this.remaining.duration = 0;
                var isValid = true;
                for (var i=this.currentIndex; i<this.listSize && isValid; ++i) {
                    if (this.items[i].duration!=undefined && this.items[i].duration>0) {
                        this.remaining.duration += this.items[i].duration;
                    } else {
                        isValid = false;
                    }
                }
                this.remaining.duration -= currentPlayingTrackPosition;
                if (isValid && this.remaining.duration!=this.duration) {
                    this.remaining.size = this.listSize - this.currentIndex;
                    this.remaining.show = true;
                    this.remainingTimeout = setTimeout(function () {
                        this.remaining.show = false;
                    }.bind(this), 2000);
                }
            }
        },
        cancelCloseTimer(dialogOpen) {
            this.dialogOpen = dialogOpen;
            if (undefined!==this.closeTimer) {
                clearTimeout(this.closeTimer);
                this.closeTimer = undefined;
            }
        },
        resetCloseTimer() {
            this.cancelCloseTimer();
            if (this.$store.state.desktopLayout && !this.$store.state.pinQueue && this.$store.state.showQueue && this.$store.state.autoCloseQueue) {
                this.closeTimer = setTimeout(function () {
                    if (this.$store.state.desktopLayout && !this.$store.state.pinQueue && this.$store.state.showQueue && this.$store.state.autoCloseQueue) {
                        this.$store.commit('setShowQueue', false);
                    }
                    this.closeTimer = undefined;
                }.bind(this), LMS_QUEUE_CLOSE_TIMEOUT);
            }
        },
    },
    filters: {
        displayTime: function (value, addSep) {
            if (!value || value<0.000000000001) {
                return '';
            }
            let str = formatSeconds(Math.floor(value));
            if (undefined==str || str.length<1) {
                return '';
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
            return value ? value : 0;
        },
        svgIcon: function (name, dark, ci) {
            if (undefined==ci || !ci) {
                return "/material/svg/"+name+"?c="+(dark ? LMS_DARK_SVG : LMS_LIGHT_SVG)    +"&r="+LMS_MATERIAL_REVISION;
            }
            return "/material/svg/"+name+"?c="+getComputedStyle(document.documentElement).getPropertyValue("--primary-color").replace("#", "")+"&c2="+LMS_DARK_SVG+"&r="+LMS_MATERIAL_REVISION;
        },
        tooltip: function (str, key, showShortcut) {
            return showShortcut ? ttShortcutStr(str, key) : str;
        }
    },
    watch: {
        'menu.show': function(newVal) {
            this.$store.commit('menuVisible', {name:'queue', shown:newVal});
            if (newVal) {
                this.cancelCloseTimer();
            } else {
                this.menu.closed = new Date().getTime();
                if (!this.dialogOpen) {
                    this.resetCloseTimer();
                }
            }
        },
        '$store.state.showQueue': function(shown) {
            if (shown) {
                if (this.$store.state.autoScrollQueue) {
                    this.scrollToCurrent();
                }
                this.resetCloseTimer();
            } else {
                this.cancelCloseTimer();
            }
        },
        'fetchingItems': function(newVal) {
            this.searchActive = false;
        },
        'searchActive': function(newVal) {
            if (newVal) {
                this.cancelCloseTimer();
            } else {
                this.resetCloseTimer();
                this.highlightIndex = -1;
                if (this.$store.state.autoScrollQueue && this.autoScrollRequired) {
                    this.scrollToCurrent();
               }
            }
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

