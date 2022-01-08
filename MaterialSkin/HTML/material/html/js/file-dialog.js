/**
 * LMS-Material
 *
 * Copyright (c) 2018-2022 Craig Drummond <craig.p.drummond@gmail.com>
 * MIT license.
 */
'use strict';

var lmsPromptDialog = Vue.component("lms-file-dialog", {
  template: `
<v-dialog v-model="show" v-if="show" persistent max-width="600">
 <v-card>
  <v-card-title>{{isDir ? i18n('Select folder') : i18n('Select file')}}</v-card-title>
  <v-card-text class="file-dialog-select-list">
   <v-treeview :items="items" :load-children="fetch" open-on-click :open.sync="open">
    <template v-slot:prepend="{ item }" style="width:22px">
     <v-icon v-if="item.canselect" @click.stop="selected=item.id">{{selected==item.id ? 'radio_button_checked' : 'radio_button_unchecked'}}</v-icon>
     <div @click="select(item)" style="margin-left:8px">{{item.name}}</div>
    </template>
   </v-treeview>
  </v-card-text>
  <v-card-actions>
   <v-spacer></v-spacer>
   <v-btn flat @click.native="close()">{{i18n('Cancel')}}</v-btn>
   <v-btn flat :disabled="undefined==selected" @click.native="useSelected()">{{i18n('Use Selected')}}</v-btn>
  </v-card-actions>
 </v-card>
</v-dialog>`,
    data() {
        return {
            show:false,
            isDir: true,
            open: [],
            items: [{name:i18n("Loading..."), id:"<initial>"}],
            selected: undefined
        }
    },
    mounted() {
        bus.$on('file.open', function(elem, isDir, types) {
            if (undefined!=elem) {
                this.show = true;
                this.elem = elem;
                this.isDir = isDir;
                this.types = types;
                var chosenPath = elem.value;
                this.fetch(null);
                if (undefined!=chosenPath) {
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
            if (this.$store.state.activeDialog == 'file') {
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
        useSelected() {
            if (undefined!=this.selected) {
                this.elem.value=this.selected;
                this.close();
            }
        },
        parseResp(data, item) {
            var items = [];
            if (undefined!=data.result.fsitems_loop) {
                for (var i=0, loop=data.result.fsitems_loop, len=loop.length; i<len; ++i) {
                    if (1==parseInt(loop[i].isfolder)) {
                        items.push({name:loop[i].name, id:loop[i].path, children:[], canselect:this.isDir});
                    } else {
                        items.push({name:loop[i].name, id:loop[i].path, canselect:!this.isDir});
                    }
                }
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
            let part = parts.shift();
            let path = (current ? current : "") + (unix ? (part=="/" || current=="/" ? "" : "/") : (current ? "\\" : "")) + part;
            if (path==chosenPath) {
                this.selected = chosenPath;
            } else {
                var params = ["folder:"+path];
                if (this.isDir) {
                    params.push("filter:foldersonly");
                } else if (this.types.length>0) {
                    params.push("filter:filetype:("+this.types.join("|")+")");
                }
                lmsList("", ["readdirectory"], params, 0, 1000).then(({data}) => {
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
            var params = [undefined==item ? "folder:/" : ("folder:"+item.id)];
            if (this.isDir) {
                params.push("filter:foldersonly");
            } else if (this.types.length>0) {
                params.push("filter:filetype:("+this.types.join("|")+")");
            }
            lmsList("", ["readdirectory"], params, 0, 500).then(({data}) => {
                this.parseResp(data, item);
            }).catch(err => {
                bus.$emit('showError', i18n('Failed to get folder listing'));
            });
        },
        select(item) {
            if (undefined==item.children && item.canselect) {
                this.selected = item.id;
            }
        }
    },
    watch: {
        'show': function(val) {
            this.$store.commit('dialogOpen', {name:'file', shown:val});
        }
    }
});

