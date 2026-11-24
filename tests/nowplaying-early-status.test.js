'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

// Run the actual helper function from the Material component; no duplicated
// copy of the implementation in tests.
const source = fs.readFileSync(path.join(__dirname, '..', 'MaterialSkin',
    'HTML', 'material', 'html', 'js', 'nowplaying-page.js'), 'utf8');
const start = source.indexOf('function nowplayingListenForPlayerStatus(view) {');
const end = source.indexOf('var lmsNowPlaying = Vue.component(', start);
assert.ok(start > 0 && end > start, 'Cannot locate early status helper');
const helper = source.slice(start, end);

function fixture() {
    const handlers = new Map();
    const listeners = new Map();
    const timers = new Map();
    const refreshes = [];
    const applied = [];
    let nextTimer = 1;
    const bus = {
        $on(name, cb) { handlers.set(name, cb); },
        $off(name, cb) {
            if (handlers.get(name) === cb) handlers.delete(name);
        },
        $emit(name, ...args) {
            if (name === 'refreshStatus') refreshes.push(args);
            if (handlers.has(name)) handlers.get(name)(...args);
        },
    };
    const document = {
        addEventListener(type, cb, capture) {
            assert.equal(type, 'load');
            assert.equal(capture, true);
            listeners.set(type, cb);
        },
        removeEventListener(type, cb, capture) {
            assert.equal(capture, true);
            if (listeners.get(type) === cb) listeners.delete(type);
        },
    };
    const context = {
        bus, document,
        setTimeout(fn, delay) {
            const id = nextTimer++;
            timers.set(id, { fn, delay });
            return id;
        },
        clearTimeout(id) { timers.delete(id); },
    };
    vm.createContext(context);
    vm.runInContext(helper, context);
    const view = { $store: { state: { player: { id: 'selected-player' } } } };
    const stop = context.nowplayingListenForPlayerStatus(view);
    const dynamicLoad = (src, tagName = 'SCRIPT') => {
        const handler = listeners.get('load');
        if (handler) handler({ target: { src, tagName } });
    };
    const emitStatus = status => bus.$emit('playerStatus', status);
    const enableHandler = () => {
        context.nowplayingOnPlayerStatus = (receivedView, status) => {
            applied.push(status);
            assert.equal(receivedView, view);
        };
    };
    const runTimers = delay => {
        for (const [id, timer] of [...timers.entries()]) {
            if (timer.delay === delay) {
                timers.delete(id);
                timer.fn();
            }
        }
    };
    return { bus, document, handlers, listeners, timers, refreshes, applied,
        dynamicLoad, emitStatus, enableHandler, runTimers, stop, context };
}

test('early statuses are coalesced and the latest is replayed at bundle load', () => {
    const f = fixture();
    f.emitStatus({ current: { title: 'old' } });
    f.emitStatus({ current: { title: 'new' } });
    assert.equal(f.applied.length, 0);
    assert.equal(f.timers.size, 1);
    f.enableHandler();
    f.dynamicLoad('http://localhost/material/html/js/material-deferred.min.js?r=1');
    assert.equal(f.applied.length, 1);
    assert.equal(f.applied[0].current.title, 'new');
    assert.equal(f.timers.size, 0);
    f.runTimers(2000);
    assert.equal(f.refreshes.length, 0);
    f.stop();
});

test('already available handler processes player events immediately', () => {
    const f = fixture();
    f.enableHandler();
    f.emitStatus({ current: { title: 'ready' } });
    assert.equal(f.applied[0].current.title, 'ready');
    assert.equal(f.timers.size, 0);
    f.stop();
});

test('unrelated resource load cannot replay pending status', () => {
    const f = fixture();
    f.emitStatus({ current: { title: 'pending' } });
    f.enableHandler();
    f.dynamicLoad('http://localhost/material/html/js/material.min.js?r=1');
    f.dynamicLoad('http://localhost/material/html/css/lib-deferred.min.css?r=1', 'LINK');
    assert.equal(f.applied.length, 0);
    f.dynamicLoad('http://localhost/material/html/js/material-deferred.min.js?r=1');
    assert.equal(f.applied.length, 1);
    f.stop();
});

test('development builds replay when standalone nowplaying-functions loads', () => {
    const f = fixture();
    f.emitStatus({ current: { title: 'dev' } });
    f.enableHandler();
    f.dynamicLoad('http://localhost/material/html/js/nowplaying-functions.js?r=dev');
    assert.equal(f.applied.length, 1);
    f.stop();
});

test('a fresh status supersedes buffered status if the handler is already ready', () => {
    const f = fixture();
    f.emitStatus({ current: { title: 'stale' } });
    f.enableHandler();
    f.emitStatus({ current: { title: 'latest' } });
    f.dynamicLoad('http://localhost/material/html/js/material-deferred.min.js?r=1');
    assert.deepEqual(f.applied.map(x => x.current.title), ['latest']);
    assert.equal(f.refreshes.length, 0);
    f.stop();
});

test('missing deferred script uses a bounded safety refresh', () => {
    const f = fixture();
    f.emitStatus({ current: { title: 'lost' } });
    assert.equal([...f.timers.values()][0].delay, 2000);
    f.runTimers(2000);
    assert.equal(f.refreshes.length, 1);
    assert.equal(f.refreshes[0][0], 'selected-player');
    f.stop();
});

test('processing errors still trigger the original one-second recovery', () => {
    const f = fixture();
    f.context.nowplayingOnPlayerStatus = () => { throw new Error('handler unavailable'); };
    f.emitStatus({ current: { title: 'error' } });
    assert.equal([...f.timers.values()][0].delay, 1000);
    f.runTimers(1000);
    assert.equal(f.refreshes.length, 1);
    f.stop();
});

test('disposing the view removes listener and cancels pending fallback', () => {
    const f = fixture();
    f.emitStatus({ current: { title: 'pending' } });
    f.stop();
    assert.equal(f.listeners.size, 0);
    assert.equal(f.handlers.size, 0);
    assert.equal(f.timers.size, 0);
    f.enableHandler();
    f.dynamicLoad('http://localhost/material/html/js/material-deferred.min.js?r=1');
    f.emitStatus({ current: { title: 'after destroy' } });
    assert.equal(f.applied.length, 0);
    assert.equal(f.refreshes.length, 0);
});

test('component uses helper and cleans it up before destroy', () => {
    assert.match(source, /this\.stopDeferredStatusWait = nowplayingListenForPlayerStatus\(this\)/);
    assert.match(source, /beforeDestroy\(\) \{[\s\S]*?this\.stopDeferredStatusWait\(\)/);
});
