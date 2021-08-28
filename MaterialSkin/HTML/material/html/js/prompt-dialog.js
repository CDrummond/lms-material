/**
 * LMS-Material
 *
 * Copyright (c) 2018-2021 Craig Drummond <craig.p.drummond@gmail.com>
 * MIT license.
 */
'use strict';

var lmsPromptDialog = Vue.component("lms-prompt-dialog", {
  template: `
<v-dialog v-model="show" v-if="show" persistent :max-width="maxWidth">
 <v-card>
  <v-card-title v-if="undefined!=title">{{title}}</v-card-title>
  <v-card-text>
   <v-text-field v-if="type=='text'" single-line :label="hint" v-model="text" @keyup.enter="close(true);" ref="entry"></v-text-field>
   <div v-else v-html="text" class="prompt-dlg" ref="prompt-dlg-text"></div>
  </v-card-text>
  <v-card-actions>
   <v-spacer></v-spacer>
   <v-btn v-if="type!='alert'" flat @click.native="close(undefined==otherButton ? false : 0)">{{negativeButton}}</v-btn>
   <v-btn flat @click.native="close(undefined==otherButton ? true : 1)">{{positiveButton}}</v-btn>
   <v-btn v-if="undefined!=otherButton" flat @click.native="close(2)">{{otherButton}}</v-btn>
  </v-card-actions>
 </v-card>
</v-dialog>`,
    data() {
        return {
            show:false,
            title:undefined,
            text:undefined,
            hint:undefined,
            positiveButton:undefined,
            negativeButton:undefined,
            otherButton:undefined,
            type:'confirm'
        }
    },
    mounted() {
        bus.$on('prompt.open', function(type, title, text, hint, positiveButton, negativeButton, otherButton) {
            this.text = text ? text : "";
            if ('alert'==type) {
                if (this.text=='-') {
                    this.show=false;
                    return;
                }
                let promptDlg = this;
                this.$nextTick(() => { this.$nextTick(() => {
                    this.$refs['prompt-dlg-text'].addEventListener('click', function(event) {
                        if (event.target.tagName=='A') {
                            promptDlg.close(false);
                            if (event.target.href.startsWith("msk:")) {
                                event.preventDefault();
                                let act = event.target.href.substring(4).replace('/', '');
                                if (act!=undefined && act.length>0) {
                                    let customActions = getCustomActions("notifications", promptDlg.$store.state.unlockAll);
                                    if (undefined!=customActions) {
                                        for (let i=0, len=customActions.length; i<len; ++i) {
                                            if (customActions[i].id==act) {
                                                performCustomAction(promptDlg, customActions[i], promptDlg.$store.state.player);
                                                break;
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    });
                })});
            }
            this.maxWidth = this.text.length>=50 || 'confirm'!=type ? 500 : 300;
            this.type = type;
            this.title = title;
            this.hint = hint;
            this.positiveButton = undefined==positiveButton ? type=='alert' ? i18n('Close') : i18n('OK') : positiveButton;
            this.negativeButton = undefined==negativeButton ? i18n('Cancel') : negativeButton;
            this.otherButton = otherButton;
            this.show = true;
            if ('text'==type) {
                focusEntry(this);
            }
        }.bind(this));
        bus.$on('esc', function() {
            if (this.$store.state.activeDialog == 'prompt') {
                this.close(false);
            }
        }.bind(this));
    },
    methods: {
        close(resp) {
            this.show=false;
            bus.$emit('prompt.resp', resp, this.text);
        }
    },
    watch: {
        'show': function(val) {
            this.$store.commit('dialogOpen', {name:'prompt', shown:val});
        }
    }
});

function confirm(text, positiveButton, negativeButton, otherButton) {
    return new Promise(function(response) {
        bus.$emit('dlg.open', 'prompt', 'confirm', undefined, text, undefined, positiveButton, negativeButton, otherButton);
        bus.$once('prompt.resp', function(resp) {
            response(resp);
        });
    });
}

function promptForText(title, hint, text, positiveButton, negativeButton) {
    return new Promise(function(response) {
        bus.$emit('dlg.open', 'prompt', 'text', title, text, hint, positiveButton, negativeButton);
        bus.$once('prompt.resp', function(resp, value, hint) {
            response({ok:resp, value:value.trim()});
        });
    });
}

function showAlert(text, button) {
    return new Promise(function(response) {
        bus.$emit('dlg.open', 'prompt', 'alert', undefined, text, undefined, button);
        bus.$once('prompt.resp', function(resp) {
            response(resp);
        });
    });
}
