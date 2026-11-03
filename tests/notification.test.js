'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const js = path.join(__dirname, '..', 'MaterialSkin', 'HTML', 'material', 'html', 'js');
const server = fs.readFileSync(path.join(js, 'server.js'), 'utf8');
const main = fs.readFileSync(path.join(js, 'main.js'), 'utf8');
const notificationMethod = server.match(/handleNotification\(data\) \{[\s\S]*?\n        \},/)[0];
const messageHandlers = main.match(/bus\.\$on\('showError',[\s\S]*?bus\.\$on\('infoDialog',/)[0]
    .replace(/bus\.\$on\('infoDialog',$/, '');

function fixture() {
    const handlers = {};
    const view = { $store: { state: { player: { id: 'player-1' } } } };
    const bus = {
        $on(name, handler) { handlers[name] = handler; },
        $emit(name, ...args) { if (handlers[name]) handlers[name](...args); },
    };
    const context = { bus, logJsonMessage() {}, stripLinkTags: value => String(value),
        msgIsEmpty: value => !value, i18n: value => value };
    vm.runInNewContext(`(function () { ${messageHandlers} }).call(view)`, { ...context, view });
    const handle = vm.runInNewContext(`({ ${notificationMethod} }).handleNotification`, context);
    return { view, notify: data => handle.call(view, data) };
}

test('error notifications display the message in red for the requested duration', () => {
    const { view, notify } = fixture();
    notify(['material-skin', 'notification', 'error', 'Repeat window cannot be satisfied', null, 'player-1', 15]);
    assert.equal(view.snackbar.msg, 'Repeat window cannot be satisfied');
    assert.equal(view.snackbar.color, 'error');
    assert.equal(view.snackbar.timeout, 15000);
});

test('info notifications retain their message and timeout', () => {
    const { view, notify } = fixture();
    notify(['material-skin', 'notification', 'info', 'Scan in progress', null, 'player-1', 5]);
    assert.equal(view.snackbar.msg, 'Scan in progress');
    assert.equal(view.snackbar.timeout, 5000);
    assert.equal(view.snackbar.color, undefined);
});

test('notifications for another player are ignored', () => {
    const { view, notify } = fixture();
    notify(['material-skin', 'notification', 'error', 'Not for this player', null, 'player-2', 15]);
    assert.equal(view.snackbar, undefined);
});

test('untargeted errors without a timeout display their message', () => {
    const { view, notify } = fixture();
    notify(['material-skin', 'notification', 'error', 'Server unavailable']);
    assert.equal(view.snackbar.msg, 'Server unavailable');
    assert.equal(view.snackbar.color, 'error');
    assert.equal(view.snackbar.timeout, undefined);
});
