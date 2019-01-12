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

        // Define variable
        let pressTimer = null
        let started = false
        let timedout = false
        let touchOnly = false;

        // Define funtion handlers
        // Create timeout ( run function after 1s )
        let start = (e) => {
            if (e.type=="touchstart") {
                touchOnly = true;
            } else if (touchOnly && !e.type.startsWith("touch")) {
                return;
            }

            if (started || (e.type === 'click' && e.button !== 0)) {
                return;
            }
            started = true;
            timedout = false;
            if (pressTimer === null) {
                pressTimer = setTimeout(() => {
                    timedout = true;
                    started = false;
                    // Run function
                    if (undefined==binding.value.method) {
                        binding.value(true)
                    } else {
                        binding.value.method(binding.value.item, true)
                    }
                }, 1000)
            }
        }

        // Cancel Timeout
        let cancel = (e) => {
            if (started && !timedout) {
                if (undefined==binding.value.method) {
                    binding.value(false)
                } else {
                    binding.value.method(binding.value.item, false)
                }
                started = false
            }
            if (pressTimer !== null) {
                clearTimeout(pressTimer)
                pressTimer = null
            }
        }


        el.addEventListener("touchstart", start);
        el.addEventListener("touchend", cancel);
        el.addEventListener("touchcancel", cancel);
        el.addEventListener("mousedown", start);
        el.addEventListener("click", cancel);
        el.addEventListener("mouseout", cancel);
    }
})

