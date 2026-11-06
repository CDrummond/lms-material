'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '..', 'MaterialSkin', 'HTML', 'material', 'html', 'js', 'iframe-dialog.js'), 'utf8');
const functions = source.slice(0, source.indexOf('function settingsSectionChanged()'));

function settingsDocument(action) {
    const buttons = new Map();
    const parentNode = { insertBefore(button) { buttons.set(button.id, button); } };
    const folder = { id: 'backup', parentNode };
    const file = { id: 'restore', parentNode };
    const doc = {
        getElementById(id) { return id === 'settingsForm' ? { action } : buttons.get(id) || null; },
        createElement() { return { classList: { add() {} }, addEventListener() {} }; },
        getElementsByClassName(name) { return name === 'selectFolder' ? [folder] : name === 'selectFile' ? [file] : []; },
    };
    return { doc, buttons };
}

test('folder and file buttons are restored after saving the same settings page', () => {
    const iframe = {};
    const context = { document: { getElementById: () => iframe }, clearInterval() {}, IS_MOBILE: true,
        getElementsByClassName: () => [] };
    vm.createContext(context);
    vm.runInContext(functions, context);
    context.addSliders = context.hideSections = context.addExpanders = () => true;
    context.iframeInitInfo();
    const initial = settingsDocument('/settings/plugin.html');
    iframe.contentDocument = initial.doc;
    context.iframeActionCheck();
    assert.deepEqual([...initial.buttons.keys()], ['mskdirbtn.backup', 'mskdirbtn.restore']);

    const saved = settingsDocument('/settings/plugin.html');
    iframe.contentDocument = saved.doc;
    context.iframeActionCheck();
    assert.deepEqual([...saved.buttons.keys()], ['mskdirbtn.backup', 'mskdirbtn.restore']);
    context.iframeActionCheck();
    assert.equal(saved.buttons.size, 2);
});
