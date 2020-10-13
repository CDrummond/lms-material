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
  <v-card-title>{{i18n('Select folder')}}</v-card-title>
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
                var chosenPath = elem.value;
                if (undefined!=chosenPath) {
                    console.log("CURRENT", chosenPath);
                    var parts = undefined;
                    var unix = true;
                    if (chosenPath.indexOf('/')>=0) {
                        parts = chosenPath.split('/');
                    } else if (chosenPath.indexOf('\\')>=0) {
                        parts = chosenPath.split('\\');
                        unix = false;
                    }
                    if (undefined!=parts && parts.length>0) {
                        var usable = [];
                        for (var i=0, len=parts.length; i<len; ++i) {
                            if (parts[i]!="") {
                                usable.push(parts[i]);
                            }
                        }
                        if (usable.length>0) {
                            if (unix) {
                                usable.unshift("/");
                            }
                            this.expand(chosenPath, usable, unix);
                        }
                    }
                }
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
            this.selected=undefined;
        },
        setPath() {
            if (undefined!=this.selected) {
                console.log("SELECTED PATH", this.selected);
                this.elem.value=this.selected;
                this.close();
            }
        },
        parseResp(data, item) {
            var items = [];
            if (undefined!=data.result.fsitems_loop) {
                for (var i=0, loop=data.result.fsitems_loop, len=loop.length; i<len; ++i) {
                    items.push({name:loop[i].name, id:loop[i].path, children:[]});
                }
            } else {
                items.push({name:i18n('Empty'), id:(undefined==item ? 'root' : item.id)+".empty"});
            }
            if (undefined==item) {
                this.items = items;
            } else {
                item.children = items;
                this.open.push(item.id);
            }
            return items;
        },
        expand(chosenPath, parts, unix, current, item) {
            let dir = parts.shift();
            let path = (current ? current : "") + (unix ? (dir=="/" || current=="/" ? "" : "/") : (current ? "\\" : "")) + dir;
            if (path==chosenPath) {
                this.selected = chosenPath;
            } else {
                lmsList("", ["readdirectory"], ["filter:foldersonly", "folder:"+path], 0, 500).then(({data}) => {
                    var items = this.parseResp(data, item);
                    for (var i=0, len=items.length; i<len; ++i) {
                        if (items[i].name==parts[0]) {
                            this.expand(chosenPath, parts, unix, path, items[i]);
                            return;
                        }
                    }
                });
            }
        },
        async fetch(item) {
            lmsList("", ["readdirectory"], ["filter:foldersonly", undefined==item ? "folder:/" : ("folder:"+item.id)], 0, 500).then(({data}) => {
                this.parseResp(data, item);
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

