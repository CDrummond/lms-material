/**
 * LMS-Material
 *
 * Copyright (c) 2018-2023 Craig Drummond <craig.p.drummond@gmail.com>
 * MIT license.
 */

'use strict';

Vue.component('m3-switch', {
    template: `
<div class="m3-switch" :class="{'m3-switch--active': value}">
 <input type="checkbox" class="m3-switch-checkbox" :checked="value" @click="handleClick" />
</div>
`,
    props: {
        value: {
            type: Boolean,
            required: true
        }
    },
    methods: {
        handleClick(event) {
            this.$emit("input", event.target.checked);
        }
    }
})
