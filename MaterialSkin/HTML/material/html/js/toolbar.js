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
<div class="drag-area-left"></div>
<div v-if="showClock" class="toolbar-clock">
 <div class="maintoolbar-title">{{time}}</div>
 <div class="maintoolbar-subtitle subtext">{{date}}</div>
</div>
<v-btn icon class="toolbar-button" @click="bus.$emit('navDrawer')">
 <v-icon v-if="!connected" class="red">error</v-icon>
 <img v-else-if="updatesAvailable" class="svg-img" :src="'update' | menuIcon(darkUi)"></img>
 <img v-else-if="restartRequired" class="svg-img" :src="'restart' | menuIcon(darkUi)"></img>
 <v-icon v-else>menu</v-icon>
</v-btn>
<v-toolbar-title class="link-item" v-bind:class="{'maintoolbar-title-clock':showClock}" @click="bus.$emit('navDrawer')">
 <div class="maintoolbar-title ellipsis" v-bind:class="{'dimmed': !playerStatus.ison, 'nd-title-fix':navdrawerVisible}">
  {{noPlayer ? trans.noplayer : player.name}}<v-icon v-if="playerStatus.sleepTime" class="player-status-icon dimmed" v-bind:class="{'link-item':!IS_MOBILE}" @click.stop="openSleep">hotel</v-icon><v-icon v-if="playerStatus.alarmStr" class="player-status-icon dimmed" v-bind:class="{'link-item':!IS_MOBILE}" @click.stop="openAlarms">alarm</v-icon><v-icon v-if="playerStatus.synced" class="player-status-icon dimmed" v-bind:class="{'link-item':!IS_MOBILE}" @click.stop="openSync">link</v-icon></div>
 <div v-if="!desktopLayout && !noPlayer && MBAR_NONE==mobileBar" class="maintoolbar-subtitle subtext ellipsis" v-bind:class="{'dimmed' : !playerStatus.ison}">{{playerStatus.count<1 ? trans.nothingplaying : isNowPlayingPage ? queueInfo : npInfo}}</div>
</v-toolbar-title>
 <v-spacer class="drag-area"></v-spacer>
 <div v-if="updateProgress.show && showUpdateProgress && downloadCount<=0" class="ellipsis subtext">{{updateProgress.text}}</div>
 <v-btn v-if="downloadCount>0" icon flat @click="bus.$emit('dlg.open', 'downloadstatus')" :title="trans.downloading"><v-icon class="pulse">cloud_download</v-icon></v-btn>
 <v-btn v-else-if="updateProgress.show" icon flat @click="bus.$emit('showMessage', updateProgress.text)" :title="updateProgress.text"><v-icon class="pulse">update</v-icon></v-btn>
 <v-btn v-show="playerStatus.synced && showVolumeSlider" icon flat class="toolbar-button hide-for-mini" id="vol-group-btn" :title="trans.groupVol" @click="bus.$emit('dlg.open', 'groupvolume', playerStatus)"><v-icon>speaker_group</v-icon></v-btn>
 <volume-control class="vol-full-slider" v-show="showVolumeSlider" :value="playerVolume" :muted="playerMuted" :playing="playerStatus.isplaying" :dvc="playerDvc" :layout="1" @inc="volumeUp" @dec="volumeDown" @changed="setVolume" @toggleMute="toggleMute"></volume-control>
 <v-btn v-show="playerDvc!=VOL_HIDDEN && !showVolumeSlider" v-bind:class="{'disabled':noPlayer,'pulse':!noPlayer && playerStatus.volume==0 && playerStatus.isplaying}" icon flat class="toolbar-button" v-longpress="volumeBtn" @click.middle="toggleMute" @wheel="volWheel($event)" id="vol-btn" :title="trans.showVol">
  <v-icon>{{playerMuted ? 'volume_off' : playerStatus.volume>0 ? 'volume_up' : 'volume_down'}}</v-icon>
  <div v-if="VOL_FIXED!=playerDvc" v-bind:class="{'disabled':noPlayer,'vol-btn-label':!desktopLayout||!showVolumeSlider,'dimmed':playerMuted}" >{{playerStatus.volume|displayVolume(playerDvc)}}</div>
 </v-btn>
 <v-btn icon :title="trans.info | tooltip(LMS_TRACK_INFO_KEYBOARD,keyboardControl)" v-if="!desktopLayout && (MBAR_THICK==mobileBar || isNowPlayingPage)" @click.native="emitInfo" class="toolbar-button hide-for-mini" id="inf" v-bind:class="{'disabled':!LMS_P_MAI || (playerStatus.count<1 && !infoOpen)}">
  <v-icon>{{infoOpen ? 'info' : 'info_outline'}}</v-icon>
 </v-btn>
 <v-btn icon v-else-if="!desktopLayout && MBAR_REP_NAV==mobileBar" @click="changePage" class="toolbar-button hide-for-mini" id="cp" :title="currentPage=='browse' ? trans.queue : trans.browse">
  <img class="svg-img" :src="(currentPage=='browse' ? 'queue_music_outline' : 'library-music-outline') | svgIcon(darkUi)" oncontextmenu="return false;"></img>
 </v-btn>
 <v-btn icon v-else-if="!desktopLayout && MBAR_THICK!=mobileBar && !isNowPlayingPage" v-longpress="playPauseButton" class="toolbar-button hide-for-mini" id="pp" :title="playerStatus.isplaying ? trans.pause : trans.play" v-bind:class="{'disabled':!LMS_P_MAI || (playerStatus.count<1 && !infoOpen)}">
  <v-icon>{{playerStatus.isplaying ? 'pause_circle_filled' : 'play_circle_filled'}}</v-icon>
 </v-btn>
 <v-btn icon :title="trans.info | tooltip(LMS_TRACK_INFO_KEYBOARD,keyboardControl)" v-if="desktopLayout" @click.native="emitInfo" class="toolbar-button hide-for-mini" v-bind:class="{'disabled':!LMS_P_MAI || (playerStatus.count<1 && !infoOpen)}" id="info-btn">
  <v-icon id="info-icon">{{infoOpen ? 'info' : 'info_outline'}}</v-icon>
 </v-btn>
 <v-btn icon :title="(nowPlayingExpanded ? trans.hideLarge : trans.showLarge) | tooltip(LMS_EXPAND_NP_KEYBOARD,keyboardControl,true)" v-if="desktopLayout" @click.native="expandNowPlaying()" class="toolbar-button hide-for-mini" v-bind:class="{'disabled':playerStatus.count<1 && !nowPlayingExpanded}" id="np-expand">
  <v-icon>{{nowPlayingExpanded ? 'fullscreen_exit' : 'fullscreen'}}</v-icon>
 </v-btn>
 <v-btn icon :title="trans.toggleQueue | tooltip(LMS_TOGGLE_QUEUE_KEYBOARD,keyboardControl,true)" v-if="desktopLayout" @click.native.stop="toggleQueue()" class="toolbar-button hide-for-mini">
  <v-icon v-if="showQueue">queue_music</v-icon>
  <img v-else class="svg-img" :src="'queue_music_outline' | svgIcon(darkUi)"></img>
 </v-btn>
 <div class="drag-area-right"></div>
 <lms-windowcontrols v-if="queryParams.nativeTitlebar"></lms-windowcontrols>
</v-toolbar>
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
                 navdrawerVisible: false
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
    },
    methods: {
        initItems() {
            this.trans = {noplayer:i18n('No Player'), nothingplaying:i18n('Nothing playing'), info:i18n("Show current track information"),
                          showLarge:i18n("Expand now playing"), hideLarge:i18n("Collapse now playing"), showVol:i18n("Show volume"), play:i18n("Play"), 
                          pause:i18n("Pause"), toggleQueue:i18n('Toggle queue'), downloading:i18n('Downloading'),
                          groupVol:i18n('Adjust volume of associated players'), browse:i18n('Browse'), queue:i18n('Queue')};
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
            if (IS_MOBILE) {
                bus.$emit('navDrawer');
                return;
            }
            bus.$emit('dlg.open', 'sleep', this.$store.state.player);
        },
        openAlarms() {
            if (IS_MOBILE) {
                bus.$emit('navDrawer');
                return;
            }
            bus.$emit('dlg.open', 'playersettings', undefined, 'alarms');
        },
        openSync() {
            if (IS_MOBILE) {
                bus.$emit('navDrawer');
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
        menuVisible() {
            return this.$store.state.visibleMenus.size>0
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
            return VOL_HIDDEN!=this.playerDvc && this.width>=(this.$store.state.desktopLayout ? (this.height>=200 ? 750 : 600) : (this.$store.state.nowPlayingClock ? 1300 : (this.$store.state.mobileBar==MBAR_NONE ? 850 : 750)))
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
        nowPlayingFull() {
            return this.$store.state.nowPlayingFull && !this.infoOpen && this.$store.state.nowPlayingBackdrop && (this.desktopLayout ? this.nowPlayingExpanded : this.isNowPlayingPage)
        }
    },
    filters: {
        displayVolume: function (value, dvc) {
            if (undefined==value || VOL_STD!=dvc) {
                return '';
            }
            return (isNaN(value) ? 0 : value)+"%";
        },
        svgIcon: function (name, dark) {
            return "/material/svg/"+name+"?c="+(dark ? LMS_DARK_SVG : LMS_LIGHT_SVG)+"&r="+LMS_MATERIAL_REVISION;
        },
        menuIcon: function (name, dark) {
            return "/material/svg/menu-"+name+"?c="+(dark ? LMS_DARK_SVG : LMS_LIGHT_SVG)+"&c2="+LMS_UPDATE_SVG+"&r="+LMS_MATERIAL_REVISION;
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
    }
})
