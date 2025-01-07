Vue.directive('clickoutside', {
    bind: function (element, binding, vnode) {
        element.clickOutsideEvent = function (event) {
            if (!(element === event.target || element.contains(event.target))) {
                vnode.context[binding.expression](event);
            }
        };
        document.body.addEventListener('click', element.clickOutsideEvent)
    },
    unbind: function (element) {
        document.body.removeEventListener('click', element.clickOutsideEvent)
    }
}); 