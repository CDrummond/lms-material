/**
 * LMS-Material
 *
 * Copyright (c) 2018-2023 Craig Drummond <craig.p.drummond@gmail.com>
 * MIT license.
 */
'use strict';

Vue.component('lms-choice-dialog', {
    template: `
<v-dialog v-model="show" v-if="show" persistent width="450" class="lms-dialog">
 <v-card>
  <v-card-text>
   <v-container grid-list-md style="padding: 4px">
    <v-layout wrap>
     <v-flex xs12>{{title}}</v-flex>
     <v-flex xs12>
      <v-list class="sleep-list dialog-main-list">
       <template v-for="(item, index) in items">
        <v-list-tile @click="choose(item)">
         <v-list-tile-content>
          <v-list-tile-title class="ellipsis">{{item.title}}</v-list-tile-title>
          <v-list-tile-sub-title class="ellipsis" v-if="item.subtitle">{{item.subtitle}}</v-list-tile-sub-title>
         </v-list-tile-content>
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
        return {
            show: false,
            title: undefined,
            items: []
        }
    },
    mounted() {
        bus.$on('choice.open', function(title, items) {
            this.show = true;
            this.title = title;
            this.items = items;
        }.bind(this));
        bus.$on('esc', function() {
            if (this.$store.state.activeDialog == 'choice') {
                this.cancel();
            }
        }.bind(this));
    },
    methods: {
        cancel() {
            this.show=false;
            bus.$emit('choice.resp', undefined);
        },
        choose(item) {
            this.show=false;
            bus.$emit('choice.resp', item);
        },
        i18n(str, arg) {
            if (this.show) {
                return i18n(str, arg);
            } else {
                return str;
            }
        }
    },
    watch: {
        'show': function(val) {
            this.$store.commit('dialogOpen', {name:'choice', shown:val});
        }
    }
})

function choose(title, items) {
    return new Promise(function(response) {
        bus.$emit('dlg.open', 'choice', title, items);
        bus.$once('choice.resp', function(resp) {
            response(resp);
        });
    });
}

