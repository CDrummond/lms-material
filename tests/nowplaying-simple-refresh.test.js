'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '..', 'MaterialSkin',
    'HTML', 'material', 'html', 'js', 'nowplaying-page.js'), 'utf8');
const helperStart = source.indexOf('function nowplayingRefreshOnDeferredLoad(event) {');
const helperEnd = source.indexOf('var lmsNowPlaying = Vue.component(', helperStart);
const mountedStart = source.indexOf('        this.info.sync=getLocalStorageBool("syncInfo", true);');
const mountedEnd = source.indexOf('        this.page = document.getElementById("np-page");', mountedStart);
assert.ok(helperStart >= 0 && helperEnd > helperStart, 'deferred-load listener missing');
assert.ok(mountedStart >= 0 && mountedEnd > mountedStart, 'playerStatus handler missing');

const helperSource = source.slice(helperStart, helperEnd);
const mountedSource = source.slice(mountedStart, mountedEnd);

function setup() {
    const listeners = [];
    const events = [];
    const handlers = new Map();
    const timers = [];
    const processed = [];
    const document = {
        addEventListener(type, callback, capture) {
            listeners.push({type, callback, capture});
        },
        removeEventListener(type, callback, capture) {
            const index = listeners.findIndex(l =>
                l.type === type && l.callback === callback && l.capture === capture);
            if (index >= 0) listeners.splice(index, 1);
        }
    };
    const bus = {
        $on(type, callback) { handlers.set(type, callback); },
        $emit(type, ...args) { events.push({type, args}); }
    };
    const context = vm.createContext({
        document, bus,
        getLocalStorageBool: () => true,
        setTimeout(callback, delay) {
            timers.push({callback, delay});
            return timers.length;
        }
    });
    vm.runInContext(helperSource, context);
    const view = {info: {}, $store: {state: {player: {id: 'test-player'}}}};
    vm.runInContext('(function() {\n' + mountedSource + '\n})', context).call(view);

    return {
        context, view, listeners, events, timers, processed,
        playerStatus(status = {current: {title: 'Test'}}) {
            const handler = handlers.get('playerStatus');
            assert.ok(handler, 'playerStatus handler registered');
            handler(status);
        },
        load(src, tagName = 'SCRIPT') {
            for (const l of [...listeners]) {
                if (l.type === 'load' && l.capture) {
                    l.callback({target: {tagName, src}});
                }
            }
        },
        refreshes() { return events.filter(e => e.type === 'refreshStatus'); }
    };
}

test('early player status is ignored without scheduling a retry', () => {
    const f = setup();
    assert.equal(f.refreshes().length, 1, 'existing initial refresh remains');
    f.playerStatus();
    assert.equal(f.timers.length, 0);
    assert.equal(f.refreshes().length, 1);
});

test('packaged deferred script triggers exactly one fresh status request', () => {
    const f = setup();
    f.playerStatus();
    f.load('http://lms.test/material/html/js/material-deferred.min.js?r=2026');
    assert.equal(f.refreshes().length, 2);
    assert.equal(f.timers.length, 0);
    assert.equal(f.listeners.length, 0, 'load listener removed after successful load');
    f.load('http://lms.test/material/html/js/material-deferred.min.js?r=2026');
    assert.equal(f.refreshes().length, 2, 'no duplicate request');
});

test('development nowplaying-functions.js also triggers a fresh status', () => {
    const f = setup();
    f.load('http://lms.test/material/html/js/nowplaying-functions.js?r=dev');
    assert.equal(f.refreshes().length, 2);
});

test('unrelated resources and script URLs do not trigger requests', () => {
    const f = setup();
    f.load('http://lms.test/material/html/js/other.js');
    f.load('http://lms.test/material/html/js/material-deferred.min.js?r=dev', 'IMG');
    f.load('http://lms.test/material/html/js/nowplaying-functions.js.map');
    assert.equal(f.refreshes().length, 1);
    assert.equal(f.listeners.length, 1);
});

test('normal player-status handling continues once the deferred function exists', () => {
    const f = setup();
    f.context.nowplayingOnPlayerStatus = (view, status) => {
        f.processed.push({view, status});
    };
    const status = {current: {title: 'Playing'}};
    f.playerStatus(status);
    assert.equal(f.processed.length, 1);
    assert.equal(f.processed[0].view, f.view);
    assert.equal(f.processed[0].status, status);
    assert.equal(f.timers.length, 0);
    f.load('http://lms.test/material/html/js/material-deferred.min.js');
    assert.equal(f.refreshes().length, 2, 'always re-request after deferred load');
});

test('real processing errors retain the original one-second recovery', () => {
    const f = setup();
    f.context.nowplayingOnPlayerStatus = () => { throw Error('processing failure'); };
    f.playerStatus();
    assert.equal(f.timers.length, 1);
    assert.equal(f.timers[0].delay, 1000);
    f.timers[0].callback();
    assert.equal(f.refreshes().length, 2);
    assert.equal(f.refreshes()[1].args[0], 'test-player');
});
