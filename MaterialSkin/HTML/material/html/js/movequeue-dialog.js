/**
 * LMS-Material
 *
 * Copyright (c) 2018-2020 Craig Drummond <craig.p.drummond@gmail.com>
 * MIT license.
 */
'use strict';

Vue.component('lms-movequeue-dialog', {
    template: `
<v-dialog v-model="show" v-if="show" persistent width="450" class="lms-dialog">
 <v-card>
  <v-card-text>
   <v-container grid-list-md style="padding: 4px">
    <v-layout wrap>
     <v-flex xs12>{{i18n("Select the player you wish to move the queue to:")}}</v-flex>
     <v-flex xs12>
      <v-list class="sleep-list dialog-main-list">
       <template v-for="(p, index) in players" v-if="p.id!=src">
        <v-list-item @click="moveTo(p)">
         <v-list-item-icon :tile="true" class="lms-avatar"><v-icon v-if="p.icon.icon">{{p.icon.icon}}</v-icon><img v-else class="svg-img" :src="p.icon.svg | svgIcon(darkUi)"></img></v-list-item-icon>
         <v-list-item-title class="sleep-item">{{p.name}}</v-list-item-title>
        </v-list-item>
        <v-divider></v-divider>
        </template>
      </v-list>
     </v-flex>
    </v-layout>
   </v-container>
  </v-card-text>
  <v-card-actions>
   <v-spacer></v-spacer>
   <v-btn text @click.native="cancel()">{{i18n('Cancel')}}</v-btn>
  </v-card-actions>
 </v-card>
</v-dialog>
`,
    props: [],
    data() {
        return { show:false, src:undefined }
    },
    computed: {
        players () {
            return this.$store.state.players
        },
        darkUi () {
            return this.$store.state.darkUi
        }
    },
    mounted() {
        bus.$on('movequeue.open', function(player) {
            this.src = player.id;
            this.show = true;
        }.bind(this));
        bus.$on('esc', function() {
            if (this.$store.state.activeDialog == 'movequeue') {
                this.show=false;
            }
        }.bind(this));
    },
    methods: {
        cancel() {
            this.show=false;
        },
        moveTo(dest) {
            lmsCommand("", ["material-skin", "movequeue", "from:"+this.src, "to:"+dest.id]).then(({data}) => {
                this.$store.commit('setPlayer', dest.id);
            });
            this.show=false;
        },
        i18n(str) {
            if (this.show) {
                return i18n(str);
            } else {
                return str;
            }
        }
    },
    filters: {
        svgIcon: function (name, dark) {
            return "/material/svg/"+name+"?c="+(dark ? LMS_DARK_SVG : LMS_LIGHT_SVG)+"&r="+LMS_MATERIAL_REVISION;
        }
    },
    watch: {
        'show': function(val) {
            this.$store.commit('dialogOpen', {name:'movequeue', shown:val});
        }
    }
})

