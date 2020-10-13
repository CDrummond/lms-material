/**
 * LMS-Material
 *
 * Copyright (c) 2018-2020 Craig Drummond <craig.p.drummond@gmail.com>
 * MIT license.
 */
'use strict';

var lmsPromptDialog = Vue.component("lms-dirselect-dialog", {
  template: `
<v-dialog v-model="show" v-if="show" persistent max-width="600">
 <v-card>
  <v-card-title>{{i18n('Select desired folder')}}</v-card-title>
  <v-card-text class="dir-select-list">
   <v-treeview :items="items" :load-children="fetch" open-on-click :open.sync="open">
    <template v-slot:prepend="{ item }" style="width:22px">
     <v-icon v-if="item.children" @click.stop="selected=item.id">{{selected==item.id ? 'radio_button_checked' : 'radio_button_unchecked'}}</v-icon>
    </template>
   </v-treeview>
  </v-card-text>
  <v-card-actions>
   <v-spacer></v-spacer>
   <v-btn flat @click.native="close()">{{i18n('Cancel')}}</v-btn>
   <v-btn flat :disabled="undefined==selected" @click.native="setPath()">{{i18n('Set Path')}}</v-btn>
  </v-card-actions>
 </v-card>
</v-dialog>`,
    data() {
        return {
            show:false,
            open: [],
            items: [{name:i18n("Loading..."), id:"<initial>"}],
            selected: undefined
        }
    },
    mounted() {
        bus.$on('dirselect.open', function(elem) {
            if (undefined!=elem) {
                this.show = true;
                this.fetch(null);
                this.elem = elem;
                // TODO: Expand current path?
            }
        }.bind(this));
        bus.$on('esc', function() {
            if (this.$store.state.activeDialog == 'dirselect') {
                this.close(false);
            }
        }.bind(this));
    },
    methods: {
        close() {
            this.open=[];
            this.items=[];
            this.elem=undefined;
            this.show=false;
        },
        setPath() {
            if (undefined!=this.selected) {
                this.elem.value=this.selected;
                this.close();
            }
        },
        async fetch(item) {
            lmsList("", ["readdirectory"], ["filter:foldersonly", undefined==item ? "folder:/" : ("folder:"+item.id)], 0, 500).then(({data}) => {
                var items = [];
                if (undefined!=data.result.fsitems_loop) {
                    for (var i=0, loop=data.result.fsitems_loop, len=loop.length; i<len; ++i) {
                        items.push({name:loop[i].name, id:loop[i].path, children:[]});
                    }
                } else {
                    items.push({name:i18n('Empty'), id:item.id+".empty"});
                }
                if (undefined==item) {
                    this.items = items;
                } else {
                    item.children = items;
                    this.open.push(item.id);
                }
            }).catch(err => {
                bus.$emit('showError', i18n('Failed to get folder listing'));
            });
        }
    },
    watch: {
        'show': function(val) {
            this.$store.commit('dialogOpen', {name:'dirselect', shown:val});
        }
    }
});

