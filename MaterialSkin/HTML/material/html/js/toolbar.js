/**
 * LMS-Material
 *
 * Copyright (c) 2018-2024 Craig Drummond <craig.p.drummond@gmail.com>
 * MIT license.
 */
'use strict';

Vue.component('lms-toolbar', {
    template: `
<div style="z-index:2"> <!-- Prevent np-cover leak -->
<v-toolbar fixed dense app class="lms-toolbar noselect" v-bind:class="{'trans-toolbar':nowPlayingFull}" @mousedown="mouseDown" id="main-toolbar">
<lms-windowcontrols v-if="queryParams.nativeTitlebar && queryParams.tbarBtnsPos=='l'"></lms-windowcontrols>
<div class="drag-area-left"></div>
<div v-if="showClock" class="toolbar-clock">
 <div class="maintoolbar-title">{{time}}</div>
 <div class="maintoolbar-subtitle subtext">{{date}}</div>
</div>
<v-layout @click.stop="openNavDrawer" @contextmenu.prevent="playerContextMenu" v-bind:class="{'navdrawer-selector':!mobileNoNowPlaying, 'link-item':!coloredToolbars, 'link-item-ct': coloredToolbars}">
 <v-btn icon class="toolbar-button" @click.stop="openNavDrawer">
  <v-icon v-if="!connected" class="red">error</v-icon>
  <img v-else-if="updatesAvailable" class="svg-img" :src="'update' | menuIcon(darkUi, coloredToolbars&&!nowPlayingFull)"></img>
  <img v-else-if="restartRequired" class="svg-img" :src="'restart' | menuIcon(darkUi, coloredToolbars&&!nowPlayingFull)"></img>
  <v-icon v-else>menu</v-icon>
 </v-btn>
 <v-toolbar-title v-bind:class="{'link-item':!coloredToolbars, 'link-item-ct': coloredToolbars, 'maintoolbar-title-clock':showClock}" @click.stop="openNavDrawer">
  <div class="maintoolbar-title ellipsis" v-bind:class="{'dimmed': !playerStatus.ison, 'nd-title-fix':navdrawerVisible}">
   {{noPlayer ? trans.noplayer : player.name}}<v-icon v-if="playerStatus.sleepTime" class="player-status-icon dimmed" v-bind:class="{'link-item':!IS_MOBILE}" @click.stop="openSleep">hotel</v-icon><v-icon v-if="playerStatus.alarmStr" class="player-status-icon dimmed" v-bind:class="{'link-item':!IS_MOBILE}" @click.stop="openAlarms">alarm</v-icon><v-icon v-if="playerStatus.synced" class="player-status-icon dimmed" v-bind:class="{'link-item':!IS_MOBILE}" @click.stop="openSync">link</v-icon></div>
  <div v-if="!desktopLayout && !noPlayer && MBAR_NONE==mobileBar" class="maintoolbar-subtitle subtext ellipsis" v-bind:class="{'dimmed' : !playerStatus.ison}">{{playerStatus.count<1 ? trans.nothingplaying : isNowPlayingPage ? queueInfo : npInfo}}</div>
 </v-toolbar-title>
</v-layout>
 <v-spacer class="drag-area" style="flex-grow:1000!important"></v-spacer>
 <div v-if="updateProgress.show && showUpdateProgress && downloadCount<=0" class="ellipsis subtext">{{updateProgress.text}}</div>
 <v-btn v-if="downloadCount>0" icon flat @click="bus.$emit('dlg.open', 'downloadstatus')" :title="trans.downloading"><v-icon class="dimmed">cloud_download</v-icon></v-btn>
 <v-btn v-else-if="updateProgress.show" icon flat @click="bus.$emit('showMessage', updateProgress.text)" :title="updateProgress.text"><v-icon class="dimmed">refresh</v-icon></v-btn>
 <v-btn v-show="playerStatus.synced && showVolumeSlider" icon flat class="toolbar-button hide-for-mini" id="vol-group-btn" :title="trans.groupVol" @click="bus.$emit('dlg.open', 'groupvolume', playerStatus)"><v-icon>speaker_group</v-icon></v-btn>
 <volume-control class="vol-full-slider" v-show="showVolumeSlider" :value="playerVolume" :muted="playerMuted" :playing="playerStatus.isplaying" :dvc="playerDvc" :layout="1" @inc="volumeUp" @dec="volumeDown" @changed="setVolume" @toggleMute="toggleMute"></volume-control>
 <v-btn v-show="playerDvc!=VOL_HIDDEN && !showVolumeSlider" v-bind:class="{'disabled':noPlayer}" icon flat class="toolbar-button" v-longpress="volumeBtn" @click.middle="toggleMute" @wheel="volWheel($event)" id="vol-btn" :title="trans.showVol">
  <v-icon>{{playerMuted ? 'volume_off' : playerStatus.volume>0 ? 'volume_up' : 'volume_down'}}</v-icon>
  <div v-if="VOL_FIXED!=playerDvc" v-bind:class="{'disabled':noPlayer,'vol-btn-label':!desktopLayout||!showVolumeSlider,'dimmed':playerMuted}" >{{playerStatus.volume|displayVolume(playerDvc)}}</div>
 </v-btn>
 <v-btn icon :title="trans.info | tooltip(LMS_TRACK_INFO_KEYBOARD,keyboardControl)" v-if="!desktopLayout && (MBAR_THICK==mobileBar || isNowPlayingPage)" @click.native="emitInfo" class="toolbar-button hide-for-mini" id="inf" v-bind:class="{'disabled':!LMS_P_MAI || (playerStatus.count<1 && !infoOpen)}">
  <img class="svg-img" :src="(infoOpen ? 'mai-filled' : 'mai') | svgIcon(darkUi, true, coloredToolbars&&!nowPlayingFull)"></img>
 </v-btn>
 <v-btn icon v-else-if="!desktopLayout && MBAR_REP_NAV==mobileBar" @click="changePage" class="toolbar-button hide-for-mini" id="cp" :title="currentPage=='browse' ? trans.queue : trans.browse">
  <img class="svg-img" :src="(currentPage=='browse' ? 'queue_music_outline' : 'library-music-outline') | svgIcon(darkUi, true, coloredToolbars)" oncontextmenu="return false;"></img>
 </v-btn>
 <v-btn icon v-else-if="!desktopLayout && MBAR_THICK!=mobileBar && !isNowPlayingPage" v-longpress="playPauseButton" class="toolbar-button hide-for-mini" id="pp" :title="playerStatus.isplaying ? trans.pause : trans.play" v-bind:class="{'disabled':!LMS_P_MAI || (playerStatus.count<1 && !infoOpen)}">
  <v-icon>{{playerStatus.isplaying ? 'pause_circle_filled' : 'play_circle_filled'}}</v-icon>
 </v-btn>
 <v-btn icon :title="trans.info | tooltip(LMS_TRACK_INFO_KEYBOARD,keyboardControl)" v-if="desktopLayout" @click.native="emitInfo" class="toolbar-button hide-for-mini" v-bind:class="{'disabled':!LMS_P_MAI || (playerStatus.count<1 && !infoOpen)}" id="info-btn">
  <img class="svg-img" :src="(infoOpen ? 'mai-filled' : 'mai') | svgIcon(darkUi, true, coloredToolbars&&!nowPlayingFull)"></img>
 </v-btn>
 <v-btn icon :title="(nowPlayingExpanded ? trans.hideLarge : trans.showLarge) | tooltip(LMS_EXPAND_NP_KEYBOARD,keyboardControl,true)" v-if="desktopLayout" @click.native="expandNowPlaying()" class="toolbar-button hide-for-mini" v-bind:class="{'disabled':playerStatus.count<1 && !nowPlayingExpanded}" id="np-expand">
  <v-icon>{{nowPlayingExpanded ? 'fullscreen_exit' : 'fullscreen'}}</v-icon>
 </v-btn>
 <v-btn icon :title="trans.toggleQueue | tooltip(LMS_TOGGLE_QUEUE_KEYBOARD,keyboardControl,true)" v-if="desktopLayout" @click.native.stop="toggleQueue()" class="toolbar-button hide-for-mini">
  <v-icon v-if="showQueue">queue_music</v-icon>
  <img v-else class="svg-img" :src="'queue_music_outline' | svgIcon(darkUi, true, coloredToolbars&&!nowPlayingFull)"></img>
 </v-btn>
 <div class="drag-area-right"></div>
 <lms-windowcontrols v-if="queryParams.nativeTitlebar && queryParams.tbarBtnsPos=='r'"></lms-windowcontrols>
</v-toolbar>
<v-menu v-model="menu.show" :position-x="menu.x" :position-y="menu.y">
 <v-list>
  <template v-for="(entry, index) in menu.items">
   <v-list-tile @click="menuAction(entry.cmd, $event)">
    <v-list-tile-avatar>
     <v-icon v-if="undefined==entry.svg" v-bind:class="{'dimmed': entry.dimmed}">{{entry.icon}}</v-icon>
     <img v-else class="svg-img" :src="entry.svg | svgIcon(darkUi)"></img>
    </v-list-tile-avatar>
    <v-list-tile-title>{{entry.title}}</v-list-tile-title>
   </v-list-tile>
  </template>
 </v-list>
<v-menu>
</div>
    `,
    data() {
        return { playlist: { count: "", duration: "" },
                 playerStatus: { ison: 1, isplaying: false, volume: 0, synced: false, sleepTime: undefined, count:0, alarm: undefined, alarmStr: undefined },
                 npInfo: "...",
                 queueInfo: "...",
                 trans:{nothingplaying:undefined, info:undefined, showLarge:undefined, hideLarge:undefined, showVol:undefined, downloading:undefined,
                        play:undefined, pause:undefined, toggleQueue:undefined, groupVol:undefined, browse:undefined, queue:undefined},
                 infoOpen: false,
                 nowPlayingExpanded: false,
                 playerVolume: 0,
                 playerMuted: false,
                 playerDvc: VOL_STD,
                 connected: true,
                 width: 100,
                 height: 300,
                 updateProgress: {show:false, text:undefined},
                 date: undefined,
                 time: undefined,
                 navdrawerVisible: false,
                 windowControlsOverlayRight:0,
                 menu: {show:false, items:[]}
               }
    },
    mounted() {
        if (queryParams.nativeTitlebar) {
            document.documentElement.style.setProperty('--drag-area-height', '0px');
        }
        setTimeout(function () {
            this.width = Math.floor(window.innerWidth/50)*50;
            this.height = Math.floor(window.innerHeight/50)*50;
        }.bind(this), 1000);
        bus.$on('windowWidthChanged', function() {
            this.width = Math.floor(window.innerWidth/50)*50;
        }.bind(this));
        bus.$on('windowHeightChanged', function() {
            this.height = Math.floor(window.innerHeight/50)*50;
        }.bind(this));
        bus.$on('navdrawer', function(visible) {
            this.navdrawerVisible = visible;
        }.bind(this));
        bus.$on('scanProgress', function(text) {
            if (undefined!=text) {
                this.updateProgress.show=true;
                this.updateProgress.text=text=='?' ? i18n("In progress") : text;
            } else if (this.updateProgress.show) {
                this.updateProgress.show=false;
                this.updateProgress.text=undefined;
            }
        }.bind(this));

        bus.$on('queueStatus', function(count, duration) {
            this.queueInfo = (count>0 ? i18np("1 Track", "%1 Tracks", count) : "") + (duration>0 ? (SEPARATOR + formatSeconds(Math.floor(duration))) : "")
            if (isEmpty(this.queueInfo)) {
                this.queueInfo = "...";
            }
        }.bind(this));
        bus.$on('nowPlayingBrief', function(np) {
            this.npInfo = isEmpty(np) ? "..." : np;
        }.bind(this));
        bus.$on('playerStatus', function(playerStatus) {
            if (playerStatus.ison!=this.playerStatus.ison) {
                this.playerStatus.ison = playerStatus.ison;
            }
            if (playerStatus.isplaying!=this.playerStatus.isplaying) {
                this.playerStatus.isplaying = playerStatus.isplaying;
            }
            if (playerStatus.volume!=this.playerStatus.volume) {
                this.playerStatus.volume = playerStatus.volume;
            }
            if (playerStatus.synced!=this.playerStatus.synced) {
                this.playerStatus.synced = playerStatus.synced;
            }
            if (playerStatus.syncmaster!=this.playerStatus.syncmaster) {
                this.playerStatus.syncmaster = playerStatus.syncmaster;
            }
            if (playerStatus.syncslaves!=this.playerStatus.syncslaves) {
                this.playerStatus.syncslaves = playerStatus.syncslaves;
            }
            this.playerStatus.count=playerStatus.playlist ? playerStatus.playlist.count : 0;
            this.playerDvc = playerStatus.dvc;
            this.playerMuted = playerStatus.muted;
            var vol = playerStatus.volume;
            if (vol != this.playerVolume) {
                this.playerVolume = vol;
            }
            if (this.playerStatus.sleepTime!=playerStatus.will_sleep_in) {
                this.playerStatus.sleepTime=playerStatus.will_sleep_in;
            }
            this.playerId = ""+this.$store.state.player.id;
            if (this.playerStatus.alarm!=playerStatus.alarm) {
                if (undefined==playerStatus.alarm) {
                    this.playerStatus.alarmStr = undefined;
                } else {
                    let alarmDate = new Date(playerStatus.alarm*1000);
                    this.playerStatus.alarmStr = dateStr(alarmDate, this.$store.state.lang)+" "+timeStr(alarmDate, this.$store.state.lang);
                }
                this.playerStatus.alarm=playerStatus.alarm;
            }
        }.bind(this));
        
        bus.$on('langChanged', function() {
            this.initItems();
        }.bind(this));
        this.initItems();

        bus.$on('infoDialog', function(val) {
            this.infoOpen = val;
            this.initItems();
        }.bind(this));
        bus.$on('nowPlayingExpanded', function(val) {
            this.nowPlayingExpanded = val;
        }.bind(this));

        bus.$on('playerChanged', function() {
            // Ensure we update volume when player changes.
            this.playerVolume = undefined;
        }.bind(this));

        bus.$on('nowPlayingClockChanged', function() {
            this.controlClock();
        }.bind(this));
        this.controlClock();

        bus.$on('networkStatus', function(connected) {
            if (connected) {
                this.connected = true;
                this.cancelDisconnectedTimer();
            } else if (this.connected && !this.disconnectedTimer) {
                // Delay showing warning for 5s
                this.disconnectedTimer = setInterval(function () {
                    this.connected = false;
                }.bind(this), 5000);
            }
        }.bind(this));

        if (!IS_MOBILE && !LMS_KIOSK_MODE) {
            bindKey(LMS_TOGGLE_QUEUE_KEYBOARD, 'mod+shift');
            bus.$on('keyboard', function(key, modifier) {
                if (this.$store.state.openDialogs.length>1 || (1==this.$store.state.openDialogs.length && this.$store.state.openDialogs[0]!='info-dialog')) {
                    return;
                }
                if ('mod+shift'==modifier && LMS_TOGGLE_QUEUE_KEYBOARD==key && this.$store.state.desktopLayout) {
                    this.toggleQueue();
                }
            }.bind(this));
        }
        bus.$on('windowControlsOverlayChanged', function() {
            this.updateWindowControlsOverlay();
        }.bind(this));
        this.updateWindowControlsOverlay();
    },
    methods: {
        initItems() {
            this.trans = {noplayer:i18n('No Player'), nothingplaying:i18n('Nothing playing'), info:i18n("Show current track information"),
                          showLarge:i18n("Expand now playing"), hideLarge:i18n("Collapse now playing"), showVol:i18n("Show volume"), play:i18n("Play"), 
                          pause:i18n("Pause"), toggleQueue:i18n('Toggle queue'), downloading:i18n('Downloading'),
                          groupVol:i18n('Adjust volume of associated players'), browse:i18n('Browse'), queue:i18n('Queue')};
        },
        updateWindowControlsOverlay() {
            let val = parseInt(window.getComputedStyle(document.documentElement).getPropertyValue('--window-area-right').replace('px', ''));
            this.windowControlsOverlayRight = undefined==val ? 0 : val;
        },
        emitInfo() {
            if (this.$store.state.visibleMenus.size>0 || (this.playerStatus.count<1 && !this.infoOpen)) {
                return;
            }
            if (LMS_P_MAI) {
                bus.$emit('info');
                if (!this.$store.state.desktopLayout && this.playerStatus.count>=1) {
                    this.$store.commit('setPage', 'now-playing');
                }
            }
        },
        expandNowPlaying() {
            if (this.$store.state.visibleMenus.size>0) {
                return;
            }
            if (!this.nowPlayingExpanded && this.playerStatus.count<1) {
                return;
            }
            bus.$emit('expandNowPlaying', !this.nowPlayingExpanded);
            if (!this.$store.state.pinQueue && this.$store.state.showQueue) {
                this.$store.commit('setShowQueue', false);
            }
        },
        volumeBtn(longPress, el) {
            if (this.$store.state.visibleMenus.size>0 || this.noPlayer || undefined==el || undefined==el.id || queryParams.party) {
                return;
            }
            if (this.playerMuted) {
                bus.$emit('playerCommand', ['mixer', 'muting', 0]);
            } else if (longPress && VOL_FIXED!=this.playerDvc) {
                bus.$emit('playerCommand', ['mixer', 'muting', 1]);
            } else {
                bus.$emit('dlg.open', window.innerHeight>=250 && this.playerStatus.synced && !queryParams.single ? 'groupvolume' : 'volume', this.playerStatus, true);
            }
        },
        setVolume(val) {
            if (queryParams.party) {
                return;
            }
            this.playerVolume = val;
            bus.$emit('playerCommand', ["mixer", "volume", this.playerVolume]);
        },
        toggleMute() {
            if (this.noPlayer || VOL_STD!=this.playerDvc || queryParams.party || this.$store.state.visibleMenus.size>0) {
                return;
            }
            bus.$emit('playerCommand', ['mixer', 'muting', this.playerMuted ? 0 : 1]);
        },
        volumeUp() {
            if (queryParams.party || this.$store.state.visibleMenus.size>0) {
                return;
            }
            bus.$emit('playerCommand', ["mixer", "volume", "+"+lmsOptions.volumeStep]);
        },
        volumeDown() {
            if (queryParams.party || this.$store.state.visibleMenus.size>0) {
                return;
            }
            bus.$emit('playerCommand', ["mixer", "volume", "-"+lmsOptions.volumeStep]);
        },
        volWheel(event) {
            if (event.deltaY<0) {
                this.volumeUp();
            } else if (event.deltaY>0) {
                this.volumeDown();
            }
        },
        changePage() {
            this.$store.commit('setPage', this.currentPage=='browse' ? 'queue' : 'browse');
        },
        playPauseButton(long) {
            if (this.$store.state.visibleMenus.size>0 || this.noPlayer) {
                return;
            }
            if (long) {
                bus.$emit('dlg.open', 'sleep', this.$store.state.player);
            } else {
                bus.$emit('playerCommand', [this.playerStatus.isplaying ? 'pause' : 'play']);
            }
        },
        openSleep() {
            if (this.$store.state.visibleMenus.size>0) {
                return;
            }
            if (IS_MOBILE) {
                this.openNavDrawer();
                return;
            }
            bus.$emit('dlg.open', 'sleep', this.$store.state.player);
        },
        openAlarms() {
            if (this.$store.state.visibleMenus.size>0) {
                return;
            }
            if (IS_MOBILE) {
                this.openNavDrawer();
                return;
            }
            bus.$emit('dlg.open', 'playersettings', undefined, 'alarms');
        },
        openSync() {
            if (this.$store.state.visibleMenus.size>0) {
                return;
            }
            if (IS_MOBILE) {
                this.openNavDrawer();
                return;
            }
            bus.$emit('dlg.open', 'sync', this.$store.state.player);
        },
        cancelDisconnectedTimer() {
            if (undefined!==this.disconnectedTimer) {
                clearInterval(this.disconnectedTimer);
                this.disconnectedTimer = undefined;
            }
        },
        controlClock() {
            if (this.$store.state.nowPlayingClock) {
                if (undefined==this.clockTimer) {
                    this.updateClock();
                }
            } else {
                this.cancelClockTimer();
            }
        },
        cancelClockTimer() {
            if (undefined!==this.clockTimer) {
                clearTimeout(this.clockTimer);
                this.clockTimer = undefined;
            }
        },
        updateClock() {
            var date = new Date();
            this.date = dateStr(date, this.$store.state.lang);
            this.time = timeStr(date, this.$store.state.lang);
            if (undefined!==this.clockTimer) {
                clearTimeout(this.clockTimer);
            }
            var next = 60-date.getSeconds();
            this.clockTimer = setTimeout(function () {
                this.updateClock();
            }.bind(this), (next*1000)+25);
        },
        toggleQueue() {
            if (!this.$store.state.pinQueue) {
                this.$store.commit('setShowQueue', !this.$store.state.showQueue);
            } else {
                let showQ = this.infoOpen || this.nowPlayingExpanded;
                if (showQ) {
                    bus.$emit('npclose');
                }
                this.$store.commit('setShowQueue', showQ || !this.$store.state.showQueue);
            }
        },
        mouseDown(ev) {
            toolbarMouseDown(ev);
        },
        playerContextMenu(ev) {
            if (!this.$store.state.player) {
                return;
            }
            let items = [PMGR_SETTINGS_ACTION, this.$store.state.player.ison ? PMGR_POWER_OFF_ACTION : PMGR_POWER_ON_ACTION, PMGR_SLEEP_ACTION];
            if (this.$store.state.players && this.$store.state.players.length>1) {
                items.push(PMGR_SYNC_ACTION);
            }
            showMenu(this, {show:true, items:items, x:event.clientX, y:event.clientY});
        },
        menuAction(cmd, event) {
            if (!this.$store.state.player) {
                return;
            }
            storeClickOrTouchPos(event, this.menu);
            if (PMGR_SYNC_ACTION.cmd==cmd) {
                bus.$emit('dlg.open', 'sync', this.$store.state.player);
            } else if (PMGR_SETTINGS_ACTION.cmd==cmd) {
                bus.$emit('dlg.open', 'playersettings', this.$store.state.player, undefined, true);
            } else if (PMGR_POWER_ON_ACTION.cmd==cmd || PMGR_POWER_OFF_ACTION.cmd==cmd) {
                lmsCommand(this.$store.state.player.id, ["power", this.$store.state.player.ison ? "0" : "1"]).then(({data}) => {
                    bus.$emit('refreshStatus', this.$store.state.player.id);
                });
            } else if (PMGR_SLEEP_ACTION.cmd==cmd) {
                bus.$emit('dlg.open', 'sleep', this.$store.state.player);
            }
        },
        openNavDrawer() {
            if (this.$store.state.visibleMenus.size>0) {
                return;
            }
            bus.$emit('navDrawer');
        }
    },
    computed: {
        player () {
            return this.$store.state.player
        },
        players () {
            return this.$store.state.players
        },
        isNowPlayingPage() {
            return this.$store.state.page == 'now-playing'
        },
        currentPage() {
            return this.$store.state.desktopLayout ? this.nowPlayingExpanded ? 'now-playing' : this.showQueue ? 'queue' : 'other' : this.$store.state.page
        },
        mobileBar() {
            return this.$store.state.mobileBar
        },
        noPlayer () {
            return !this.$store.state.players || this.$store.state.players.length<1
        },
        darkUi () {
            return this.$store.state.darkUi
        },
        updatesAvailable() {
            return this.$store.state.unlockAll && this.$store.state.updatesAvailable.size>0
        },
        restartRequired() {
            return this.$store.state.unlockAll && this.$store.state.restartRequired
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
        showVolumeSlider() {
            return VOL_HIDDEN!=this.playerDvc && this.width>=this.windowControlsOverlayRight + (this.$store.state.desktopLayout ? (this.height>=200 ? 800 : 650) : (this.$store.state.nowPlayingClock ? 1300 : (this.$store.state.mobileBar==MBAR_NONE ? 850 : 750)))
        },
        showUpdateProgress() {
            return (!this.$store.state.nowPlayingClock || (this.$store.state.desktopLayout ? !this.nowPlayingExpanded : (this.$store.state.page != 'now-playing'))) && this.width>=1050
        },
        showClock() {
            return this.$store.state.nowPlayingClock && (this.$store.state.desktopLayout
                                                            ? (this.nowPlayingExpanded && this.width>=1300) : (this.$store.state.page == 'now-playing' && this.width>=500))
        },
        downloadCount() {
            return this.$store.state.downloadStatus.length
        },
        coloredToolbars() {
            return this.$store.state.coloredToolbars
        },
        nowPlayingFull() {
            return this.$store.state.nowPlayingFull && !this.infoOpen && this.$store.state.nowPlayingBackdrop && (this.desktopLayout ? this.nowPlayingExpanded : this.isNowPlayingPage)
        },
        mobileNoNowPlaying() {
            return !this.$store.state.desktopLayout && this.$store.state.mobileBar==MBAR_NONE
        }
    },
    filters: {
        displayVolume: function (value, dvc) {
            if (undefined==value || VOL_STD!=dvc) {
                return '';
            }
            return (isNaN(value) ? 0 : value)+"%";
        },
        svgIcon: function (name, dark, toolbar, coloredToolbars) {
            return "/material/svg/"+name+"?c="+(dark || (toolbar && coloredToolbars) ? LMS_DARK_SVG : LMS_LIGHT_SVG)+"&r="+LMS_MATERIAL_REVISION;
        },
        menuIcon: function (name, dark, coloredToolbars) {
            return "/material/svg/menu-"+name+"?c="+(dark || coloredToolbars ? LMS_DARK_SVG : LMS_LIGHT_SVG)+"&c2="+(coloredToolbars ? LMS_DARK_SVG : LMS_UPDATE_SVG)+"&r="+LMS_MATERIAL_REVISION;
        },
        tooltip: function (str, shortcut, showShortcut, shift) {
            return showShortcut ? ttShortcutStr(str, shortcut, shift) : str;
        },
        playerShortcut: function(index) {
            return IS_APPLE ? ("⌥+"+(9==index ? 0 : index+1)) : i18n("Alt+%1", 9==index ? 0 : index+1);
        }
    },
    beforeDestroy() {
        this.cancelDisconnectedTimer();
        this.cancelClockTimer();
    },
    watch: {
        'menu.show': function(val) {
            this.$store.commit('menuVisible', {name:'toolbar', shown:val});
            if (!val) {
                this.menu.closed = new Date().getTime();
            }
        }
    }
})
