/**
 * LMS-Material
 *
 * Copyright (c) 2018-2024 Craig Drummond <craig.p.drummond@gmail.com>
 * MIT license.
 */
'use strict';

var lmsGallery = Vue.component("lms-gallery", {
  template: `
<div class="pswp" tabindex="-1" role="dialog" aria-hidden="true">
 <img v-if="showActions && !queryParams.party && (!LMS_KIOSK_MODE || !HIDE_FOR_KIOSK.has(PLAY_ACTION))" class="ps-btn grid-btn" v-bind:class="{'ps-btn-mobile':IS_MOBILE}" @click.stop="itemAction(PLAY_ACTION)" :title="ACTIONS[PLAY_ACTION].title" :src="'hover-play' | svgIcon"></img>
 <img v-if="showActions && allowShuffle" class="ps-btn grid-btn" v-bind:class="{'ps-btn-mobile':IS_MOBILE}" @click.stop="itemAction(PLAY_SHUFFLE_ACTION)" :title="ACTIONS[PLAY_SHUFFLE_ACTION].title" :src="'hover-shuffle' | svgIcon"></img>
 <img v-if="showActions && !queryParams.party && (!LMS_KIOSK_MODE || !HIDE_FOR_KIOSK.has(INSERT_ACTION))" class="ps-btn grid-btn" v-bind:class="{'ps-btn-mobile':IS_MOBILE}" @click.stop="itemAction(INSERT_ACTION)" :title="ACTIONS[INSERT_ACTION].title" :src="'hover-playnext' | svgIcon"></img>
 <img v-if="showActions && (!LMS_KIOSK_MODE || !HIDE_FOR_KIOSK.has(ADD_ACTION))" class="ps-btn grid-btn" v-bind:class="{'ps-btn-mobile':IS_MOBILE}" @click.stop="itemAction(ADD_ACTION)" :title="ACTIONS[ADD_ACTION].title" :src="'hover-add' | svgIcon"></img>
 <div class="pswp__bg"></div>
 <div class="pswp__scroll-wrap">
  <div class="pswp__container">
   <div class="pswp__item"></div>
   <div class="pswp__item"></div>
   <div class="pswp__item"></div>
  </div>
  <div class="pswp__ui pswp__ui--hidden">
   <div class="pswp__top-bar">
    <div class="pswp__counter"></div>
    <button class="pswp__button pswp__button--close"></button>
    <button v-if="!IS_MOBILE" class="pswp__button pswp__button--zoom"></button>
    <div class="pswp__preloader">
     <div class="pswp__preloader__icn">
      <div class="pswp__preloader__cut">
       <div class="pswp__preloader__donut"></div>
      </div>
     </div>
    </div>
   </div>
   <div class="pswp__share-modal pswp__share-modal--hidden pswp__single-tap">
    <div class="pswp__share-tooltip"></div>
   </div>
   <button class="pswp__button pswp__button--arrow--left"></button>
   <button class="pswp__button pswp__button--arrow--right"></button>
   <div class="pswp__caption">
    <div class="pswp__caption__center"></div>
   </div>
  </div>
 </div>
</div>`,
    data() {
        return {
            showActions:false,
            allowShuffle:false
        }
    },
    mounted() {
        this.isNowPlaying = false;
        bus.$on('gallery.open', function(urls, startIndex, isNowPlaying, closeSignal, browseItems, allowShuffle) {
            this.isNowPlaying = undefined==isNowPlaying ? false : isNowPlaying;
            this.closeSignal = closeSignal;
            this.npUrl = isNowPlaying ? urls[0] : undefined;
            this.browseItems = browseItems;
            this.showActions = undefined!=browseItems && browseItems.length==urls.length;
            this.allowShuffle = allowShuffle;
            var galleryInst = this;
            var images = [];
            for (var i=0, len=urls.length; i<len; ++i) {
                images.push({src:changeImageSizing(urls[i]), w:0, h:0});
            }
            this.gallery = new PhotoSwipe(document.querySelectorAll('.pswp')[0], PhotoSwipeUI_Default, images, {index: startIndex});
            this.gallery.listen('gettingData', function (index, item) {
                if (item.w < 1 || item.h < 1) {
                    var img = new Image();
                    img.onload = function () {
                        item.w = this.width;
                        item.h = this.height;
                        galleryInst.gallery.updateSize(true);
                    };
                    img.src = item.src;
                }
            });
            this.gallery.init();
            this.$store.commit('dialogOpen', {name:'gallery', shown:true});
            // PhotoSwipe seems to emit an 'esc' when closed, which causes us to navigate back. If we delay emitting
            // dialogOpen.browse-viewer.false by 1/2 second the code looking for 'esc' still thinks this dialog is open, and
            // so ignores the event. Hacky, but works.
            this.gallery.listen('close', function() {
                galleryInst.browseItems = undefined;
                setTimeout(function () {
                    galleryInst.$store.commit('dialogOpen', {name:'gallery', shown:false});
                    galleryInst.isNowPlaying = false;
                    history.replaceState(null, null, ' ');
                    if (galleryInst.closeSignal) {
                        bus.$emit(galleryInst.closeSignal);
                    }
                }, 500);
            });
        }.bind(this));
        bus.$on('closeDialog', function(dlg) {
            if (dlg == 'gallery') {
                this.gallery.close();
            }
        }.bind(this));
        bus.$on('currentCover', function(coverUrl) {
            if (this.isNowPlaying) {
                var cUrl = undefined==coverUrl ? LMS_BLANK_COVER : coverUrl;
                if (cUrl!=this.npUrl) {
                    this.npUrl = cUrl;
                    this.gallery.items[0]={src:changeImageSizing(cUrl), w:0, h:0};
                    this.gallery.invalidateCurrItems();
                    this.gallery.updateSize(true);
                }
            }
        }.bind(this));
    },
    methods: {
        itemAction(act) {
            let idx = this.gallery.getCurrentIndex();
            if (undefined!=this.browseItems && idx>=0 && idx<this.browseItems.length) {
                bus.$emit('browse-action', act, this.browseItems[idx]);
                this.gallery.close();
            }
        }
    },
    filters: {
        svgIcon: function (name) {
            return "/material/svg/"+name+"?c="+LMS_DARK_SVG+"&c2=333&r="+LMS_MATERIAL_REVISION;
        }
    }
});

