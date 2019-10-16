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

        var self = this;

        // Define variable
        self.pressTimer = undefined
        self.started = false
        self.timedout = false
        self.touchOnly = false;

        // Define funtion handlers
        // Create timeout ( run function after 1s )
        self.start = (e) => {
            if (e.type=="touchstart") {
                self.touchOnly = true;
            } else if (self.touchOnly && !e.type.startsWith("touch")) {
                return;
            }

            if (self.started || ((e.type === 'click' || e.type === 'mousedown') && e.button !== 0)) {
                return;
            }
            self.started = true;
            self.timedout = false;
            if (self.pressTimer === undefined) {
                self.pressTimer = setTimeout(() => {
                    self.timedout = true;
                    self.started = false;
                    // Run function
                    if (undefined==binding.value.method) {
                        binding.value(true);
                    } else {
                        binding.value.method(binding.value.item, true);
                    }
                }, 1000)
            }
        }

        // Cancel Timeout
        self.cancel = (e) => {
           if (self.started && !self.timedout) {
                if (undefined==binding.value.method) {
                    binding.value(false);
                } else {
                    binding.value.method(binding.value.item, false);
                }
                self.started = false;
            }
            self.started = false;
            self.timedout = false;
            if (self.pressTimer !== undefined) {
                clearTimeout(self.pressTimer);
                self.pressTimer = undefined;
            }
        }

        el.addEventListener("touchstart", this.start, { passive: true });
        el.addEventListener("touchend", this.cancel);
        el.addEventListener("touchcancel", this.cancel);
        el.addEventListener("mousedown", this.start);
        el.addEventListener("click", this.cancel);
        el.addEventListener("mouseout", this.cancel);
    },
    unbind: function (el) {
        if (undefined!=this.pressTimer) {
            clearTimeout(this.pressTimer);
            this.pressTimer = undefined;
        }
        el.removeEventListener("touchstart", this.start);
        el.removeEventListener("touchend", this.cancel);
        el.removeEventListener("touchcancel", this.cancel);
        el.removeEventListener("mousedown", this.start);
        el.removeEventListener("click", this.cancel);
        el.removeEventListener("mouseout", this.cancel);
    }
})
