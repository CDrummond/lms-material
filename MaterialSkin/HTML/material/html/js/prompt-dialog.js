/**
 * LMS-Material
 *
 * Copyright (c) 2018-2020 Craig Drummond <craig.p.drummond@gmail.com>
 * MIT license.
 */
'use strict';

var lmsPromptDialog = Vue.component("lms-prompt-dialog", {
  template: `
<v-dialog v-model="show" v-if="show" persistent :max-width="maxWidth">
 <v-card>
  <v-card-title v-if="undefined!=title">{{title}}</v-card-title>
  <v-card-text>
   <v-text-field v-if="type='text'" single-line :label="hint" v-model="text" @keyup.enter="close(true);" ref="entry"></v-text-field>
   <div v-else>{{text}}</div>
  </v-card-text>
  <v-card-actions>
   <v-spacer></v-spacer>
   <v-btn flat @click.native="close(false)">{{negativeButton}}</v-btn>
   <v-btn flat @click.native="close(true)">{{positiveButton}}</v-btn>
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
            type:'confirm'
        }
    },
    mounted() {
        bus.$on('prompt.open', function(type, title, text, hint, positiveButton, negativeButton) {
            this.text = text ? text : "";
            this.maxWidth = this.text.length>=50 || 'confirm'!=type ? 500 : 300;
            this.type = type;
            this.title = title;
            this.hint = hint;
            this.positiveButton = undefined==positiveButton ? i18n('OK') : positiveButton;
            this.negativeButton = undefined==negativeButton ? i18n('Cancel') : negativeButton;
            this.show = true;
            if ('confirm'!=type) {
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

function confirm(text, positiveButton, negativeButton) {
    return new Promise(function(response) {
        bus.$emit('dlg.open', 'prompt', 'confirm', undefined, text, undefined, positiveButton, negativeButton);
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
