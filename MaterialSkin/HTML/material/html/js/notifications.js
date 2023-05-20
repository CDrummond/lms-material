/**
 * LMS-Material
 *
 * Copyright (c) 2018-2023 Craig Drummond <craig.p.drummond@gmail.com>
 * MIT license.
 */
'use strict';

Vue.component('lms-notifications', {
    template: `
<v-dialog v-model="show" v-if="show" persistent no-click-animation scrollable fullscreen>
 <v-card>
  <v-card-title class="settings-title">
   <v-toolbar app-data class="dialog-toolbar">
    <v-btn flat icon v-longpress:stop="close" :title="i18n('Go back')"><v-icon>arrow_back</v-icon></v-btn>
    <v-toolbar-title>{{i18n('Notifications')}}</v-toolbar-title>
   </v-toolbar>
  </v-card-title>
  <v-card-text style="padding-top:0px">
   <v-container grid-list-md style="padding:0px">
    <v-layout wrap>
     <v-flex xs12 v-if="undefined!=items && items.length>0">
      <v-list class="lms-list" style="padding-top:0px;position:unset;top:unset;height:100%!important;width:100%!important">
       <div class="dialog-padding"></div>
       <template v-for="(item, index) in items">
        <v-list-tile class="lms-list-item" v-bind:class="{'pq-current': item.downloading}">
         <v-list-tile-content>
          <v-list-tile-title>{{item.title}}</v-list-tile-title>
          <v-list-tile-sub-title class="ellipsis clickable" v-html="item.msg"></v-list-tile-sub-title>
         </v-list-tile-content>
         <v-list-tile-action v-if="item.cancelable" @click.stop="cancel(item)">
          <v-btn icon flat><v-icon>cancel</v-icon></v-btn>
         </v-list-tile-action>
        </v-list-tile>
       </template>
      </v-list>
     </v-flex>
     <v-flex xs12 v-else>
      <div style="padding-top:64px;width:100%;display:flex;justify-content:center;align-items:center;">{{i18n('No notifications.')}}</div>
     </v-flex>
     <div class="dialog-padding"></div>
    </v-layout>
   </v-container>
  </v-card-text>
 </v-card>
</v-dialog>
`,
    props: [],
    data() {
        return {
            show: false
        }
    },
    mounted() {
        bus.$on('notifications.open', function() {
            this.show = true;
        }.bind(this));
        bus.$on('esc', function() {
            if (this.$store.state.activeDialog == 'notifications') {
                this.close();
            }
        }.bind(this));
    },
    methods: {
        close() {
            this.show=false;
        },
        cancel(notif) {
            if (this.$store.state.notifications.length==1) {
                this.close();
            }
            lmsCommand("", ["material-skin", "send-notif", "type:notif", "msg:-", "id:"+notif.id]);
        },
        i18n(str, arg) {
            if (this.show) {
                return i18n(str, arg);
            } else {
                return str;
            }
        }
    },
    computed: {
        items () {
            return this.$store.state.notifications
        }
    },
    watch: {
        'show': function(val) {
            this.$store.commit('dialogOpen', {name:'notifications', shown:val});
        }
    }
})
