/**
 * LMS-Material
 *
 * Copyright (c) 2018-2020 Craig Drummond <craig.p.drummond@gmail.com>
 * MIT license.
 */
'use strict';

var lmsConfirmDialog = Vue.component("lms-confirm-dialog", {
  template: `
<v-dialog v-model="show" v-if="show" persistent :max-width="maxWidth">
 <v-card>
  <v-card-title v-if="undefined!=title">{{title}}</v-card-title>
  <v-card-text>{{text}}</v-card-text>
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
            positiveButton:undefined,
            negativeButton:undefined
        }
    },
    mounted() {
        bus.$on('confirm.open', function(text, positiveButton, negativeButton) {
            this.maxWidth = text.length>=50 ? 500 : 300;
            this.text = text;
            this.positiveButton = undefined==positiveButton ? i18n('OK') : positiveButton;
            this.negativeButton = undefined==negativeButton ? i18n('Cancel') : negativeButton;
            this.show = true;
        }.bind(this));
        bus.$on('esc', function() {
            if (this.$store.state.activeDialog == 'confirm') {
                this.close(false);
            }
        }.bind(this));
    },
    methods: {
        close(resp) {
            this.show=false;
            bus.$emit('confirm.resp', resp);
        }
    },
    watch: {
        'show': function(val) {
            this.$store.commit('dialogOpen', {name:'confirm', shown:val});
        }
    }
});

function confirm(text, positiveButton, negativeButton) {
    return new Promise(function(response) {
        bus.$emit('dlg.open', 'confirm', text, positiveButton, negativeButton);
        bus.$once('confirm.resp', function(resp) {
            response(resp);
        });
    });
}

