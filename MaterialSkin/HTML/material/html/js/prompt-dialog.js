/**
 * LMS-Material
 *
 * Copyright (c) 2018-2026 Craig Drummond <craig.p.drummond@gmail.com>
 * MIT license.
 */
'use strict';

var lmsPromptDialog = Vue.component("lms-prompt-dialog", {
  template: `
<v-dialog v-model="show" v-if="show" :max-width="maxWidth">
 <v-card>
  <v-card-title v-if="undefined!=title" class="dlgtitle">{{title}}</v-card-title>
  <v-card-text>
   <v-slider v-if="type=='slider'" :step="slider.step" :min="slider.min" :max="slider.max" v-model="slider.value" thumb-label="always"></v-slider>
   <v-layout v-else-if="fileTypes">
    <v-text-field single-line autocorrect="off" :label="hint" v-model="text" @keyup.enter="close(true);" ref="entry"></v-text-field>
    <v-btn flat @click="browse()">Browse</v-btn>
   </v-layout>
   <v-text-field v-else-if="type=='text'" single-line autocorrect="off" :label="hint" v-model="text" @keyup.enter="close(true);" ref="entry"></v-text-field>
   <div v-else v-html="text" class="clickable" ref="prompt-dlg-text"></div>
  </v-card-text>
  <v-card-actions>
   <v-spacer></v-spacer>
   <v-btn v-for="(button, i) in buttons" flat @click.native="close(buttonValues[i])" :icon="IS_MOBILE && (button.icon || button.svg)" :title="button.title">
    <v-icon v-if="button.icon">{{button.icon}}</v-icon>
    <img v-else-if="button.svg" :src="button.svg | svgIcon(darkUi)"></img>
    <span v-else>{{button.short}}</span>
    <template v-if="(!IS_MOBILE) && (button.icon || button.svg)">
     &nbsp; {{button.short}}
    <template>
   </v-btn>
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
            fileTypes:undefined,
            type:'confirm',
            slider:{step:1, min:0, max:100, value:0}
        }
    },
    computed: {
        darkUi () {
            return this.$store.state.darkUi
        }
    },
    mounted() {
        bus.$on('prompt.open', function(type, title, text, extra, positiveButton, negativeButton, otherButtons, fileTypes) {
            this.text = text ? text : "";
            this.maxWidth = this.text.length>=50 || 'confirm'!=type ? 500 : 300;
            this.type = type;
            this.title = title;
            this.fileTypes = fileTypes;
            if ('slider'==type) {
                this.slider = extra;
                this.hint = undefined;
            } else {
                this.hint = extra;
                this.slider = {step:1, min:0, max:100, value:0};
            }
            this.buttons = otherButtons || [];
            this.buttonValues = [];
            for (let i = 0; i < this.buttons.length; i++) {
                this.buttonValues[i] = i + 2;
            }
            if (typeof(negativeButton) !== 'object') {
                negativeButton = { short: undefined==negativeButton ? i18n('Cancel') : negativeButton };
            }
            if (typeof(positiveButton) !== 'object') {
                positiveButton = { short: undefined==positiveButton ? i18n('OK') : positiveButton };
            }
            positiveButton.value = 1;
            if (queryParams.altBtnLayout) {
                this.buttons.unshift(positiveButton);
                this.buttons.push(negativeButton);
                this.buttonValues.unshift(undefined==otherButtons ? true : 1);
                this.buttonValues.push(undefined==otherButtons ? false : 0);
            }
            else {
                this.buttons.unshift(negativeButton);
                this.buttons.push(positiveButton);
                this.buttonValues.unshift(undefined==otherButtons ? false : 0);
                this.buttonValues.push(undefined==otherButtons ? true : 1);
            }
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
        bus.$on('prompt.fs', function(text) {
            if (this.show) {
                this.text = text;
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
        },
        browse() {
            bus.$emit('dlg.open', 'file', 'prompt.fs', false, this.fileTypes.split("|"));
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

function promptForText(title, hint, text, positiveButton, negativeButton, otherButtons, fileTypes) {
    return new Promise(function(response) {
        bus.$emit('dlg.open', 'prompt', 'text', title, text, hint, positiveButton, negativeButton, otherButtons, fileTypes);
        bus.$once('prompt.resp', function(resp, value) {
            response({ok:resp, value:value.trim()});
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
