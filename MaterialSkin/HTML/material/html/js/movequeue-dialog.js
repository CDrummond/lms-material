/**
 * LMS-Material
 *
 * Copyright (c) 2018-2022 Craig Drummond <craig.p.drummond@gmail.com>
 * MIT license.
 */
'use strict';

Vue.component('lms-movequeue-dialog', {
    template: `
<v-dialog v-model="show" v-if="show" persistent width="450" class="lms-dialog">
 <v-card>
  <v-card-text style="margin-top:-16px">
   <v-select :items="options" v-model="option" item-text="label" item-value="key"></v-select>
   <v-container grid-list-md style="padding: 4px">
    <v-layout wrap>
     <v-flex xs12>
      <v-list class="sleep-list dialog-main-list">
       <template v-for="(p, index) in players" v-if="p.id!=src">
        <v-list-tile @click="moveTo(p)">
         <v-list-tile-avatar :tile="true" class="lms-avatar"><v-icon v-if="p.icon.icon">{{p.icon.icon}}</v-icon><img v-else class="svg-img" :src="p.icon.svg | svgIcon(darkUi)"></img></v-list-tile-avatar>
         <v-list-tile-title class="sleep-item">{{p.name}}</v-list-tile-title>
        </v-list-tile>
        <v-divider></v-divider>
       </template>
      </v-list>
     </v-flex>
    </v-layout>
   </v-container>
  </v-card-text>
  <v-card-actions>
   <v-spacer></v-spacer>
   <v-btn flat @click.native="cancel()">{{i18n('Cancel')}}</v-btn>
  </v-card-actions>
 </v-card>
</v-dialog>
`,
    props: [],
    data() {
        return { show:false,
                 src:undefined,
                 option:1,
                 options:[] }
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
            this.option = parseInt(getLocalStorageVal('movequeue', 1));
            this.initItems();
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
            lmsCommand("", ["material-skin", "transferqueue", "from:"+this.src, "to:"+dest.id, "mode:"+(0==this.option ? 'copy' : 1==this.option ? 'move' : 'swap')]).then(({data}) => {
                this.$store.commit('setPlayer', dest.id);
                if (0==this.option) {
                    bus.$emit('showMessage', i18n("Queue copied to '%1'", dest.name));
                }
            });
            setLocalStorageVal('movequeue', this.option);
            this.show=false;
        },
        i18n(str) {
            if (this.show) {
                return i18n(str);
            } else {
                return str;
            }
        },
        initItems() {
            this.options=[
                { key:0, label:i18n("Copy the queue to:")},
                { key:1, label:i18n("Move the queue to:")},
                { key:2, label:i18n("Swap the queue with:")} ]
        },
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

