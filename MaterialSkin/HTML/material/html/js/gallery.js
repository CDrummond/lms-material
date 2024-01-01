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
    <button v-if="!IS_MOBILE" class="pswp__button pswp__button--fs"></button>
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
    mounted() {
        this.isNowPlaying = false;
        bus.$on('gallery.open', function(urls, startIndex, isNowPlaying) {
            this.isNowPlaying = undefined==isNowPlaying ? false : isNowPlaying;
            this.npUrl = isNowPlaying ? urls[0] : undefined;
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
            this.gallery.listen('close', function() { setTimeout(function () { galleryInst.$store.commit('dialogOpen', {name:'gallery', shown:false}); galleryInst.isNowPlaying = false; }, 500); });
            
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
    }
});

