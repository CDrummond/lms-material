/**
 * LMS-Material
 *
 * Copyright (c) 2018-2019 Craig Drummond <craig.p.drummond@gmail.com>
 * MIT license.
 */

Vue.component('lms-movequeue-dialog', {
    template: `
<v-dialog v-model="show" v-if="show" width="450" persistent class="lms-dialog">
 <v-card>
  <v-card-text>
   <v-container grid-list-md style="padding: 4px">
    <v-layout wrap>
     <v-flex xs12>{{i18n("Select the player you wish to move the queue to:")}}</v-flex>
     <v-flex xs12>
      <v-list class="sleep-list">
       <template v-for="(p, index) in players" v-if="p.id!=src">
        <v-list-tile @click="moveTo(p)">
         <v-list-tile-avatar :tile="true" class="lms-avatar"><v-icon>{{p.isgroup ? 'speaker_group' : 'speaker'}}</v-icon></v-list-tile-avatar>
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
        return { show:false, src:undefined }
    },
    computed: {
        players () {
            return this.$store.state.players
        },
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
    watch: {
        'show': function(val) {
            this.$store.commit('dialogOpen', {name:'movequeue', shown:val});
        }
    }
})

