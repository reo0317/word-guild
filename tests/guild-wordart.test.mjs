import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp, mkdir, readFile, writeFile, rm, access} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {pathToFileURL} from 'node:url';
import {buildWordart} from '../tools/build-wordart.mjs';
import {charaSpec, pageSpecs} from '../products/word-guild/guild/chara.mjs';
import {charaSvg, charaDefs} from '../products/word-guild/guild/chara-svg.mjs';

const word = {id: 'example', w: 'say', ch: 1};
const arts = {example: {g: 'c1-001', tint: 0}};

test('意味の絵を優先し、持ち物と模様を付けず、分類の体にも戻れる', () => {
  const fallback = charaSpec(word, 'action', {});
  const spec = charaSpec(word, 'action', arts);
  assert.deepEqual([spec.flip, spec.tilt, spec.scale], [fallback.flip, fallback.tilt, fallback.scale]);
  assert.equal(spec.prop, '');
  assert.equal(spec.pattern, 0);
  for (const state of ['shadow', 'proof', 'print', 'gold']) {
    const svg = charaSvg(spec, {state, base: '/game/'});
    assert.match(svg, /href="\/game\/art\/word\/c1-001.webp"/);
    assert.doesNotMatch(svg, /body-action|cg-pt-|cg-ht|cg-m-|stroke-linejoin/);
  }
  assert.match(charaSvg(fallback), /art\/body-action.webp/);
  assert.match(charaSvg(charaSpec(word, 'action', {example: {g: '../bad', tint: 0}})), /art\/body-action.webp/);
  assert.deepEqual(pageSpecs([word, word], ['action', 'action'], arts), [spec, spec]);
});

test('tint 0〜3 はそれぞれ別の刷りを使い、共有定義に実際の別配色がある', () => {
  const defs = charaDefs();
  const tones = [];
  for (let tint = 0; tint < 4; tint++) {
    const spec = charaSpec(word, 'action', {example: {g: 'c1-001', tint}});
    for (const ward of [1, 6, 7]) {
      const w = ward === 7 ? 1 : ward;
      assert.match(charaSvg(spec, {ward}), new RegExp(`cg-t-${w}-${tint}`));
      assert.match(charaSvg(spec, {ward, state: 'proof'}), new RegExp(`cg-p-${w}-${tint}`));
    }
    const filter = type => defs.match(new RegExp(`<filter id="cg-${type}-1-${tint}"[^]*?</filter>`))[0].replace(/id="[^"]+"/, '');
    tones.push(filter('t') + filter('a'));
  }
  assert.equal(new Set(tones).size, 4);
  assert.match(charaSvg(charaSpec(word, 'action', arts)), /cg-t-1-0/);
});

test('起動時の読み込みは待機し、未配置や通信失敗でも分類の体で動く', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.window = {};
  try {
    const cases = [
      async () => ({ok: true, json: async () => arts}),
      async () => ({ok: false}),
      async () => { throw new Error('offline'); },
    ];
    for (let i = 0; i < cases.length; i++) {
      globalThis.fetch = cases[i];
      const module = await import(`../products/word-guild/guild/chara.mjs?wordart-test=${i}`);
      assert.equal(Boolean(module.charaSpec(word, 'action').wordart), i === 0);
    }
  } finally {
    globalThis.fetch = originalFetch;
    delete globalThis.window;
  }
});

test('ビルドは全区を読み、webp のある語だけ出力する', async () => {
  const temp = await mkdtemp(`${tmpdir()}/guild-wordart-`);
  const root = pathToFileURL(`${temp}/`);
  try {
    for (const dir of ['data/work/wordart/', 'products/word-guild/art/word/', 'products/word-guild/data/']) await mkdir(new URL(dir, root), {recursive: true});
    for (const ch of [1, 2]) {
      await writeFile(new URL(`data/work/wordart/groups-ch${ch}.json`, root), JSON.stringify({ch, groups: [
        {g: `c${ch}-001`, words: [{id: `b${ch}`, tint: ch - 1}]},
        {g: `c${ch}-002`, words: [{id: `missing${ch}`, tint: 0}]},
      ]}));
      await writeFile(new URL(`products/word-guild/art/word/c${ch}-001.webp`, root), 'fixture');
    }
    const expected = {b1: {g: 'c1-001', tint: 0}, b2: {g: 'c2-001', tint: 1}};
    assert.deepEqual(await buildWordart(root), expected);
    assert.deepEqual(JSON.parse(await readFile(new URL('products/word-guild/data/wordart.json', root))), expected);
  } finally { await rm(temp, {recursive: true, force: true}); }
});

test('配信する wordart.json の全参照に書き出した webp がある', async () => {
  const root = new URL('../products/word-guild/', import.meta.url);
  const data = JSON.parse(await readFile(new URL('data/wordart.json', root)));
  assert.ok(Object.keys(data).length > 0);
  for (const {g, tint} of Object.values(data)) {
    assert.ok(Number.isInteger(tint) && tint >= 0 && tint <= 3);
    await access(new URL(`art/word/${g}.webp`, root));
  }
});
