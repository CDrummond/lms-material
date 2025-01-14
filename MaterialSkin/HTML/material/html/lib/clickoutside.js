/**
 * LMS-Material
 *
 * Copyright (c) 2018-2025 Craig Drummond <craig.p.drummond@gmail.com>
 * MIT license.
 */

Vue.directive('clickoutside', {
    bind: function (element, binding, vnode) {
        element.clickoutside = {start:undefined, end:undefined, touchOnly:false, target:undefined};
        element.clickoutside.start = function (event) {
            if (event.type=='touchstart') {
                element.clickoutside.touchOnly = true;
            }
            if (!(element === event.target || element.contains(event.target))) {
                element.clickoutside.target = event.target;
            }
        };
        element.clickoutside.end = function (event) {
            if (element.clickoutside.touchOnly && !event.type.startsWith('touch')) {
                return;
            }
            if (element.clickoutside.target == event.target && (!(element === event.target || element.contains(event.target)))) {
                vnode.context[binding.expression](event);
            }
            element.clickoutside.target = undefined;
        };
        document.body.addEventListener('mousedown', element.clickoutside.start);
        document.body.addEventListener('mouseup', element.clickoutside.end);
        document.body.addEventListener('touchstart', element.clickoutside.start);
        document.body.addEventListener('touchend', element.clickoutside.end);
        document.body.addEventListener('touchcancel', element.clickoutside.end);
    },
    unbind: function (element) {
        document.body.removeEventListener('mousedown', element.clickoutside.start);
        document.body.removeEventListener('mouseup', element.clickoutside.end);
        document.body.removeEventListener('touchstart', element.clickoutside.start);
        document.body.removeEventListener('touchend', element.clickoutside.end);
        document.body.removeEventListener('touchcancel', element.clickoutside.end);
    }
}); 