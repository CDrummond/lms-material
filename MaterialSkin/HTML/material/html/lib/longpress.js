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

        el.longpress={time:undefined, stated:false, timedout:false, touchOnly:false, start:undefined, cancel:undefined,
                      binding:binding, repeat:'repeat'==binding.arg, stopProp:'stop'==binding.arg, nomove:'nomove'==binding.arg};

        // Define funtion handlers
        // Create timeout ( run function after 1s )
        el.longpress.start = (e) => {
            if (el.longpress.stopProp) {
                try { e.preventDefault(); } catch(e) { }
                try { e.stopPropagation();} catch(e) { }
            }
            if (e.type=="touchstart") {
                el.longpress.touchOnly = true;
                if (undefined!=e.touches && e.touches.length>0) {
                    el.longpress.startPos = {x:e.touches[0].clientX, y:e.touches[0].clientY};
                }
            } else if (el.longpress.touchOnly && !e.type.startsWith("touch")) {
                return;
            }

            if (el.longpress.started || ((e.type === 'click' || e.type === 'mousedown') && e.button !== 0)) {
                return;
            }

            el.longpress.started = true;
            el.longpress.timedout = false;
            el.longpress.moved = false;
            if (el.longpress.pressTimer === undefined) {
                if (el.longpress.repeat) {
                    el.longpress.pressTimer = setInterval(() => {
                        el.longpress.timedout = true;
                        el.longpress.started = false;
                        // Run function
                        if (undefined==el.longpress.binding.value.method) {
                            el.longpress.binding.value(true, el, e);
                        } else {
                            el.longpress.binding.value.method(binding.value.item, true, el, e);
                        }
                    }, 500)
                } else {
                    el.longpress.pressTimer = setTimeout(() => {
                        el.longpress.timedout = true;
                        el.longpress.started = false;
                        // Run function
                        if (!el.longpress.moved) {
                            if (undefined==el.longpress.binding.value.method) {
                                el.longpress.binding.value(true, el, e);
                            } else {
                                el.longpress.binding.value.method(binding.value.item, true, el, e);
                            }
                        }
                    }, 500)
                }
            }
        }

        // Cancel Timeout
        el.longpress.cancel = (e) => {
            if (el.longpress.stopProp) {
                try { e.preventDefault(); } catch(e) { }
                try { e.stopPropagation();} catch(e) { }
            }
            if (el.longpress.started && !el.longpress.timedout && !el.longpress.moved) {
                if (undefined==el.longpress.binding.value.method) {
                    el.longpress.binding.value(false, el, e);
                } else {
                    el.longpress.binding.value.method(binding.value.item, false, el, e);
                }
                el.longpress.started = false;
            }
            el.longpress.started = false;
            el.longpress.timedout = false;
            el.longpress.moved = false;
            el.longpress.startPos = undefined;
            if (el.longpress.pressTimer !== undefined) {
                clearTimeout(el.longpress.pressTimer);
                el.longpress.pressTimer = undefined;
            }
        }

        // Try to detect if moved while pressing, and if so don't fire any events
        if (el.longpress.nomove) {
            el.longpress.move = (e) => {
                if (el.longpress.started && undefined!=el.longpress.startPos && !el.longpress.moved && undefined!=e.touches && e.touches.length>0 && 
                   (Math.abs(el.longpress.startPos.x-e.touches[0].clientX)>4 || Math.abs(el.longpress.startPos.y-e.touches[0].clientY)>4)) {
                    el.longpress.moved = true;
                }
            }
        }

        el.addEventListener("touchstart", el.longpress.start, { passive: true });
        el.addEventListener("touchend", el.longpress.cancel);
        el.addEventListener("touchcancel", el.longpress.cancel);
        if (el.longpress.nomove) {
            el.addEventListener("touchmove", el.longpress.move, { passive: true });
        }
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
        if (el.longpress.nomove) {
            el.removeEventListener("touchmove", el.longpress.move);
        }
        el.removeEventListener("mousedown", el.longpress.start);
        el.removeEventListener("click", el.longpress.cancel);
        el.removeEventListener("mouseout", el.longpress.cancel);
    }
})
