/**
 * LMS-Material
 *
 * Copyright (c) 2018-2024 Craig Drummond <craig.p.drummond@gmail.com>
 * MIT license.
 */

'use strict';

Vue.component('lms-progressbar', {
    template: `
<div class="pbar" v-on="$listeners">
 <div class="value" :style="{width:value + '%' }"></div>
 <div class="buffer" :style="{width:buffer + '%' }"></div>
</div>
`,
    props: {
        value: {
            type: Number,
            required: true
        },
        buffer: {
            type: Number,
            required: true
        }
    }
})
