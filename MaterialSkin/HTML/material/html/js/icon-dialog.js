/**
 * LMS-Material
 *
 * Copyright (c) 2018-2024 Craig Drummond <craig.p.drummond@gmail.com>
 * MIT license.
 */
'use strict';

Vue.component('lms-icon-dialog', {
    template: `
<v-dialog v-model="show" v-if="show" persistent scrollable width="450" class="lms-dialog">
 <v-card>
  <v-card-text>
   <v-container grid-list-md style="padding: 4px">
    <v-layout wrap>
     <v-flex xs12>
      <div class="icon-grid">
       <v-btn flat icon v-for="(item, index) in items.icons" @click="setIcon(item)">
        <v-icon v-if="item.icon" v-bind:class="{'active-btn':player.icon.icon == item.icon}">{{item.icon}}</v-icon>
        <img v-else class="svg-img" :src="item.svg | svgIcon(darkUi, player.icon.svg==item.svg)"></img>
       </v-btn>
      </div>
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
            items: {icons:[]}
        }
    },
    computed: {
        darkUi() {
            return this.$store.state.darkUi
        }
    },
    mounted() {
        bus.$on('icon.open', function(player) {
            this.player = player;
            this.show = true;
            getMiscJson(this.items, "player-icons-list", this);
        }.bind(this));
        bus.$on('noPlayers', function() {
            this.cancel();
        }.bind(this));
        bus.$on('closeDialog', function(dlg) {
            if (dlg == 'icon') {
                this.cancel();
            }
        }.bind(this));
    },
    methods: {
        cancel() {
            this.show=false;
        },
        setIcon(icon) {
            if (icon.icon!=this.player.icon.icon || icon.svg!=this.player.icon.svg) {
                bus.$emit('playerIconSet', this.player.id, icon);
            }
            this.cancel();
        }
    },
    filters: {
        svgIcon: function (name, dark, active) {
            return "/material/svg/"+name+"?c="+(active ? getComputedStyle(document.documentElement).getPropertyValue("--active-color").replace("#", "") : dark ? LMS_DARK_SVG : LMS_LIGHT_SVG)+"&r="+LMS_MATERIAL_REVISION;
        }
    },
    watch: {
        'show': function(val) {
            this.$store.commit('dialogOpen', {name:'icon', shown:val});
        }
    }
})

