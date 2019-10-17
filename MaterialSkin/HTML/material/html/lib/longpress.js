// Taken from https://blog.logrocket.com/building-a-long-press-directive-in-vue-3408d60fb511
Vue.directive('longpress', {
    bind: function (el, binding, vNode) {
        // Make sure expression provided is a function
        if (typeof binding.value !== 'function' && typeof binding.value.method !== 'function') {
            // Fetch name of component
            const compName = vNode.context.name
            // pass warning to console
            let warn = `[longpress:] provided expression '${binding.expression}' is not a function, but has to be`
            if (compName) { warn += `Found in component '${compName}' ` }

            console.warn(warn)
        }

        el.longpress={time:undefined, stated:false, timedout:false, touchOnly:false, start:undefined, cancel:undefined, binding:binding};

        // Define funtion handlers
        // Create timeout ( run function after 1s )
        el.longpress.start = (e) => {
            if (e.type=="touchstart") {
                el.longpress.touchOnly = true;
            } else if (el.longpress.touchOnly && !e.type.startsWith("touch")) {
                return;
            }

            if (el.longpress.started || ((e.type === 'click' || e.type === 'mousedown') && e.button !== 0)) {
                return;
            }
            el.longpress.started = true;
            el.longpress.timedout = false;
            if (el.longpress.pressTimer === undefined) {
                el.longpress.pressTimer = setTimeout(() => {
                    el.longpress.timedout = true;
                    el.longpress.started = false;
                    // Run function
                    if (undefined==el.longpress.binding.value.method) {
                        el.longpress.binding.value(true);
                    } else {
                        el.longpress.binding.value.method(binding.value.item, true);
                    }
                }, 1000)
            }
        }

        // Cancel Timeout
        el.longpress.cancel = (e) => {
           if (el.longpress.started && !el.longpress.timedout) {
                if (undefined==el.longpress.binding.value.method) {
                    el.longpress.binding.value(false);
                } else {
                    el.longpress.binding.value.method(binding.value.item, false);
                }
                el.longpress.started = false;
            }
            el.longpress.started = false;
            el.longpress.timedout = false;
            if (el.longpress.pressTimer !== undefined) {
                clearTimeout(el.longpress.pressTimer);
                el.longpress.pressTimer = undefined;
            }
        }

        el.addEventListener("touchstart", el.longpress.start, { passive: true });
        el.addEventListener("touchend", el.longpress.cancel);
        el.addEventListener("touchcancel", el.longpress.cancel);
        el.addEventListener("mousedown", el.longpress.start);
        el.addEventListener("click", el.longpress.cancel);
        el.addEventListener("mouseout", el.longpress.cancel);
    },
    unbind: function (el) {
        if (undefined!=el.longpress.pressTimer) {
            clearTimeout(el.longpress.pressTimer);
            el.longpress.pressTimer = undefined;
        }
        el.removeEventListener("touchstart", el.longpress.start);
        el.removeEventListener("touchend", el.longpress.cancel);
        el.removeEventListener("touchcancel", el.longpress.cancel);
        el.removeEventListener("mousedown", el.longpress.start);
        el.removeEventListener("click", el.longpress.cancel);
        el.removeEventListener("mouseout", el.longpress.cancel);
    }
})
