'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '..', 'MaterialSkin',
    'HTML', 'material', 'html', 'js', 'browse-page.js'), 'utf8');

// Execute the actual Vue method, not a copy of the intended guard.
const match = source.match(/        getHomeExtra\(\) \{[\s\S]*?\n        \},(?=\n        handleHomeExtra\()/);
assert.ok(match, 'getHomeExtra method not found in browse-page.js');
const method = match[0];

function runCase({ single, css, items = ['std_new', 'std_playlists'] }) {
    const requests = [];
    const events = [];
    const context = {
        queryParams: { single, css },
        DETAILED_HOME_EXPLORE: 'std_explore',
        DETAILED_HOME_STD_PREFIX: 'std_',
        lmsOptions: { homeExtraNeedsPlayer: new Set() },
        numScrollItems: () => 12,
        lmsCommand: (player, command, requestId) => {
            requests.push({ player, command, requestId });
            return Promise.resolve({ data: { id: requestId } });
        },
        logError(error) { throw error; },
    };
    const getHomeExtra = vm.runInNewContext('({ ' + method + ' }).getHomeExtra', context);
    const state = { detailedHomeItems: [...items], sortFavorites: false, library: undefined };
    const view = {
        $store: { state },
        pageElement: {},
        topExtraCfg: {},
        playerId: () => 'test-player',
        nextReqId: () => 1,
        isCurrentReq: () => true,
        handleHomeExtra: () => events.push('handled'),
    };
    getHomeExtra.call(view);
    return { requests, events, view, state };
}

test('np-only with configured home lists performs no home-extra request', () => {
    const result = runCase({ single: true, css: 'msk--np-only' });
    assert.equal(result.requests.length, 0);
    assert.deepEqual(result.state.detailedHomeItems, ['std_new', 'std_playlists']);
    assert.deepEqual(result.view.topExtraCfg, {});
});

test('ordinary Material UI still fetches its configured scrollable lists', () => {
    const result = runCase({ single: false, css: undefined });
    assert.equal(result.requests.length, 1);
    const req = result.requests[0];
    assert.equal(req.player, 'test-player');
    assert.equal(req.command[0], 'material-skin');
    assert.ok(req.command.includes('home-extra'));
    assert.ok(req.command.includes('new:1'));
    assert.ok(req.command.includes('playlists:1'));
    assert.ok(req.command.includes('count:12'));
});

test('single layout without dedicated np-only CSS retains home lists', () => {
    const result = runCase({ single: true, css: 'my-custom-css' });
    assert.equal(result.requests.length, 1);
});

test('custom CSS marker without single layout is not mistaken for np-only', () => {
    const result = runCase({ single: false, css: 'msk--np-only' });
    assert.equal(result.requests.length, 1);
});

test('normal home without selected lists still sends no home-extra request', () => {
    const result = runCase({ single: false, css: undefined, items: [] });
    assert.equal(result.requests.length, 0);
});
