/**
 * LMS-Material
 *
 * Copyright (c) 2018-2023 Craig Drummond <craig.p.drummond@gmail.com>
 * MIT license.
 */
'use strict';

var lmsPromptDialog = Vue.component("lms-prompt-dialog", {
  template: `
<v-dialog v-model="show" v-if="show" persistent :max-width="maxWidth">
 <v-card>
  <v-card-title v-if="undefined!=title" class="dlgtitle">{{title}}</v-card-title>
  <v-card-text>
   <v-slider v-if="type=='slider'" :step="slider.step" :min="slider.min" :max="slider.max" v-model="slider.value" thumb-label="always"></v-slider>
   <v-text-field v-else-if="type=='text'" single-line autocorrect="off" :label="hint" v-model="text" @keyup.enter="close(true);" ref="entry"></v-text-field>
   <div v-else v-html="text" class="clickable" ref="prompt-dlg-text"></div>
  </v-card-text>
  <v-card-actions v-if="queryParams.altBtnLayout">
   <v-spacer></v-spacer>
   <v-btn v-if="undefined!=otherButton" flat @click.native="close(2)">{{otherButton}}</v-btn>
   <v-btn flat @click.native="close(undefined==otherButton ? true : 1)">{{positiveButton}}</v-btn>
   <v-btn v-if="type!='alert'" flat @click.native="close(undefined==otherButton ? false : 0)">{{negativeButton}}</v-btn>
  </v-card-actions>
  <v-card-actions v-else>
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
            type:'confirm',
            slider:{step:1, min:0, max:100, value:0}
        }
    },
    mounted() {
        bus.$on('prompt.open', function(type, title, text, extra, positiveButton, negativeButton, otherButton) {
            this.text = text ? text : "";
            if ('alert'==type) {
                if (this.text=='-') {
                    this.show=false;
                    return;
                }
            }
            this.maxWidth = this.text.length>=50 || 'confirm'!=type ? 500 : 300;
            this.type = type;
            this.title = title;
            if ('slider'==type) {
                this.slider = extra;
                this.hint = undefined;
            } else {
                this.hint = extra;
                this.slider = {step:1, min:0, max:100, value:0};
            }
            this.positiveButton = undefined==positiveButton ? type=='alert' ? i18n('Close') : i18n('OK') : positiveButton;
            this.negativeButton = undefined==negativeButton ? i18n('Cancel') : negativeButton;
            this.otherButton = otherButton;
            this.show = true;
            if ('text'==type) {
                focusEntry(this);
            }
        }.bind(this));
        bus.$on('closeDialog', function(dlg) {
            if (dlg == 'prompt') {
                this.close(false);
            }
        }.bind(this));
    },
    methods: {
        close(resp) {
            this.show=false;
            if ('slider'==this.type) {
                bus.$emit('prompt.resp', resp, this.slider.value);
            } else {
                bus.$emit('prompt.resp', resp, this.text);
            }
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

function promptSlider(title, slider, positiveButton, negativeButton) {
    return new Promise(function(response) {
        bus.$emit('dlg.open', 'prompt', 'slider', title, undefined, slider, positiveButton, negativeButton);
        bus.$once('prompt.resp', function(resp, value) {
            response({ok:resp, value:value});
        });
    });
}
