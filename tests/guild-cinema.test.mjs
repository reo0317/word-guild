import test from 'node:test';
import assert from 'node:assert/strict';
import {loadScenes} from '../products/word-guild/guild/story.mjs';
import {sceneFor, gateCard, newlyOpenedGate, playOptionalCinema, sceneCardHtml, blankCardHtml} from '../products/word-guild/guild/album.mjs';

const scene = {shelf: 2, title: '灯り', lines: ['一行目', '二行目']};
test('任意の場面データを読み込み、街灯で探す。未配置・壊れたデータは場面なし', async () => {
  const data = {v: 1, scenes: [scene]};
  let requested;
  const loaded = await loadScenes(async url => { requested = String(url); return {ok: true, json: async () => data}; });
  assert.match(requested, /data\/scenes.json$/);
  assert.equal(sceneFor(loaded, 2), scene);
  assert.equal(sceneFor(loaded, 1), null);
  assert.equal(sceneFor(null, 2), null);
  assert.equal(sceneFor({scenes: [{shelf: 2, title: 'bad', lines: [null]}]}, 2), null);
  for (const fetcher of [async () => { throw Error('offline'); }, async () => ({ok: false}),
    async () => ({ok: true, json: async () => { throw Error('json'); }}),
    async () => ({ok: true, json: async () => ({v: 2, scenes: []})})]) {
    assert.equal(await loadScenes(fetcher), null);
  }
});

test('今回 gates に入った区だけを演出し、戻った行と今回の位置を渡す', () => {
  const story = {blank: Array.from({length: 6}, (_, i) => ({ch: i + 1, en: `line ${i + 1}`, ja: `行${i + 1}`}))};
  assert.equal(newlyOpenedGate({gates: [1]}, {gates: [1, 3]}, 3), true);
  assert.equal(newlyOpenedGate({gates: [1]}, {gates: [1]}, 1), false);
  assert.equal(newlyOpenedGate({}, {gates: []}, 2), false);
  assert.deepEqual(gateCard(story, [3, 1], 3), {lines: [story.blank[0], story.blank[2]], newIndex: 1});
  assert.deepEqual(gateCard(null), {lines: [], newIndex: -1});
  const html = blankCardHtml(story, [1, 3]);
  assert.equal((html.match(/gq-card-mist/g) ?? []).length, 4);
  assert.match(html, /line 1/);
  assert.match(html, /line 3/);
  assert.doesNotMatch(html, /line 2|行2/);
});

test('演出の完了を待ち、モジュール・関数の欠落や再生失敗は代わりの紙へ進む', async () => {
  const container = {};
  for (const method of ['playLetterComplete', 'playGateCard']) {
    const events = [];
    const data = {letter: {}, scene: null, ward: 2, base: ''};
    await playOptionalCinema(method, container, data, () => events.push('fallback'), async () => ({
      [method]: async (host, args) => { assert.equal(host, container); assert.equal(args, data); await Promise.resolve(); events.push('done'); },
    }));
    assert.deepEqual(events, ['done']);
    for (const loader of [async () => null, async () => ({}), async () => { throw Error('missing'); },
      async () => ({[method]: async () => { throw Error('play'); }})]) {
      let calls = 0;
      await playOptionalCinema(method, container, data, async () => { await Promise.resolve(); calls++; }, loader);
      assert.equal(calls, 1);
    }
  }
});

test('画面を離れたあとは遅れて読み込まれても演出も紙も出さない', async () => {
  let active = true;
  let called = false;
  await playOptionalCinema('playGateCard', {}, {}, () => { called = true; }, async () => {
    active = false;
    return {playGateCard: () => { called = true; }};
  }, () => active);
  assert.equal(called, false);
});

test('場面の紙は題と各行をエスケープする。場面なしなら空', () => {
  assert.equal(sceneCardHtml(null), '');
  const html = sceneCardHtml({title: '<灯>', lines: ['<script>', '次の行']});
  assert.match(html, /&lt;灯&gt;/);
  assert.match(html, /&lt;script&gt;/);
  assert.match(html, /次の行/);
  assert.doesNotMatch(html, /<script>/);
});
