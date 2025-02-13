/**
 * LMS-Material
 *
 * Copyright (c) 2018-2024 Craig Drummond <craig.p.drummond@gmail.com>
 * MIT license.
 */
'use strict';

Vue.component('lms-choice-dialog', {
    template: `
<v-dialog v-model="show" v-if="show" width="450" persistent class="lms-dialog">
 <v-card v-clickoutside="outsideClick">
  <v-card-text>
   <v-select v-if="undefined!=options && options.length>1" menu-props="auto" :items="options" v-model="option" item-text="title" item-value="val"></v-select>
   <v-container grid-list-md style="padding: 4px">
    <v-layout wrap>
     <v-flex xs12 v-if="undefined==options || options.length<=1" class="dlgtitle">{{title}}</v-flex>
     <v-flex xs12>
      <v-list class="sleep-list dialog-main-list">
       <template v-for="(item, index) in items">
        <v-list-tile @click="choose(item)" :disabled="item.disabled" v-bind:class="{'dimmed':item.disabled}">
         <div :tile="true" v-if="boundKeys" class="choice-key">{{9==index ? 0 : index+1}}</div>
         <v-list-tile-avatar :tile="true" class="lms-avatar" v-if="item.icon || item.svg"><v-icon v-if="item.icon">{{item.icon}}</v-icon><img v-else class="svg-img" :src="item.svg | svgIcon(darkUi)"></img></v-list-tile-avatar>
         <v-list-tile-content>
          <v-list-tile-title>{{item.title}}</v-list-tile-title>
          <!-- todo allow options to also have sub-titles -->
          <v-list-tile-sub-title v-if="(undefined==options || options.length<1 || 0==option) && item.subtitle">{{item.subtitle}}{{item.durationStr ? SEPARATOR+item.durationStr : ""}}</v-list-tile-sub-title>
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
            items: [],
            options:[],
            option:0,
            boundKeys: false
        }
    },
    computed: {
        darkUi () {
            return this.$store.state.darkUi
        }
    },
    mounted() {
        bus.$on('choice.open', function(title, items, extra) {
            this.boundKeys = false;
            this.title = title;
            this.items = items;
            this.options = undefined==extra || undefined==extra.options ? [] : extra.options;
            this.key = undefined==extra ? undefined : extra.key;
            if (undefined!=this.key) {
                this.option = parseInt(getLocalStorageVal('choice-'+this.key, undefined==extra.def ? 0 : extra.def));
            }
            this.show = true;
            if (1==this.items.length && (undefined==this.options || this.options.length<1)) {
                this.choose(this.items[0]);
            } else {
                bindNumeric(this);
            }
        }.bind(this));
        bus.$on('closeDialog', function(dlg) {
            if (dlg == 'choice') {
                this.cancel();
            }
        }.bind(this));
        handleNumeric(this, this.choose);
    },
    methods: {
        outsideClick() {
            setTimeout(function () { this.cancel(); }.bind(this), 50);
        },
        cancel() {
            this.show=false;
            unbindNumeric(this);
            bus.$emit('choice.resp', undefined);
        },
        choose(item) {
            if (item.disabled) {
                return;
            }
            this.show=false;
            if (undefined!=this.key) {
                setLocalStorageVal('choice-'+this.key, this.option);
            }
            bus.$emit('choice.resp', item, this.options.length<1 ? undefined : this.options[this.option]);
            unbindNumeric(this);
        },
        i18n(str, arg) {
            if (this.show) {
                return i18n(str, arg);
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
            this.$store.commit('dialogOpen', {name:'choice', shown:val});
        }
    }
})

function choose(title, items, extra) {
    return new Promise(function(response) {
        bus.$emit('dlg.open', 'choice', title, items, extra);
        bus.$once('choice.resp', function(resp, option) {
            response(undefined==option ? resp : {item:resp, option:option});
        });
    });
}

