import test from 'node:test';
import assert from 'node:assert/strict';
import {loadProgress, saveProgress, validateProgress, emptyProgress, serializeProgress, exportText, importText, backupProgress, restoreBackup, hasBackup, STORAGE_KEY} from '../products/word-guild/guild/store.mjs';

function memory(initial = {}) {
  const data = {...initial};
  return {getItem: key => data[key] ?? null, setItem: (key, value) => { data[key] = String(value); }, data};
}

test('保存したものを読み戻せる。キーは既存の保存と別', () => {
  const storage = memory();
  const progress = {...emptyProgress(), v: 1, words: {b0001: {box: 3, due: 20003, seen: 1}}, quests: 2, lastDay: 20000};
  assert.equal(STORAGE_KEY, 'wordGuild.progress.v1');
  assert.equal(saveProgress(storage, progress), true);
  assert.deepEqual(JSON.parse(storage.data[STORAGE_KEY]).words.b0001, [3, 20003, 1]);
  assert.deepEqual(loadProgress(storage), {progress, ok: true});
});

test('何も保存されていなければ空の進捗', () => {
  assert.deepEqual(loadProgress(memory()), {progress: emptyProgress(), ok: true});
});

test('壊れた値・古い形でも例外を出さず、空の進捗で始める', () => {
  for (const raw of ['{', 'null', '[]', '"x"', '{"v":2}', '{"v":1}', '{"v":1,"words":[]}', '{"v":1,"words":null}']) {
    const result = loadProgress(memory({[STORAGE_KEY]: raw}));
    assert.deepEqual(result.progress, emptyProgress(), raw);
  }
});

test('壊れた語の状態だけを捨て、残りは使う', () => {
  const raw = JSON.stringify({v: 1, quests: -3, lastDay: 'x', words: {
    a: [3, 10, 1], b: [9, 10, 1], c: [1, -1, 1], d: 'x', e: [1, 2], f: [1.5, 2, 3], g: [5, 30, 4]}});
  const {progress} = loadProgress(memory({[STORAGE_KEY]: raw}));
  assert.deepEqual(Object.keys(progress.words), ['a', 'g']);
  assert.equal(progress.quests, 0);
  assert.equal(progress.lastDay, 0);
});

test('保存不可・読み取り不可の storage でも例外を出さない', () => {
  const broken = {getItem() { throw new Error('denied'); }, setItem() { throw new Error('full'); }};
  assert.deepEqual(loadProgress(broken), {progress: emptyProgress(), ok: false});
  assert.equal(saveProgress(broken, emptyProgress()), false);
  assert.deepEqual(loadProgress(null), {progress: emptyProgress(), ok: false});
  assert.equal(saveProgress(null, emptyProgress()), false);
  assert.deepEqual(validateProgress(undefined), emptyProgress());
});

test('M1・M2 の保存に追加項目の既定値を補う', () => {
  const legacy = {v: 1, words: {a: [2, 10, 3]}, quests: 4, lastDay: 10};
  assert.deepEqual(loadProgress(memory({[STORAGE_KEY]: JSON.stringify(legacy)})).progress,
    {...emptyProgress(), words: {a: {box: 2, due: 10, seen: 3}}, quests: 4, lastDay: 10});
});

test('追加項目を個別に検証し、使える値を残す', () => {
  const valid = {...emptyProgress(), settings: {fresh: 8}, streak: {count: 3, last: 20, best: 5},
    daily: {day: 20, kind: 'fresh', goal: 16, count: 2, done: false}, dailyDone: 7, exportDay: 19};
  assert.deepEqual(validateProgress(serializeProgress(valid)), valid);
  for (const fresh of [4, 6, 8]) {
    assert.equal(validateProgress({...serializeProgress(valid), settings: {fresh}}).settings.fresh, fresh);
  }
  for (const key of ['settings', 'streak', 'daily', 'dailyDone', 'exportDay']) {
    for (const bad of [null, 'bad', -1, 1.5, {}]) {
      assert.deepEqual(validateProgress({...serializeProgress(valid), [key]: bad}),
        {...valid, [key]: emptyProgress()[key]});
    }
  }
  assert.deepEqual(validateProgress({...serializeProgress(valid), streak: {count: -1, last: 20, best: 5}}).streak,
    {count: 0, last: 20, best: 5});
  for (const [key, bad] of Object.entries({day: -1, kind: 'other', goal: 1.5, count: '2', done: 1})) {
    assert.equal(validateProgress({...serializeProgress(valid), daily: {...valid.daily, [key]: bad}}).daily, null);
  }
  for (const kind of ['revenge', 'fresh', 'clean', 'finish']) {
    assert.equal(validateProgress({...serializeProgress(valid), daily: {...valid.daily, kind}}).daily.kind, kind);
  }
});

test('1,400語と全追加項目を書き出し・読み込みでき、空白と改行を許す', () => {
  const progress = {...emptyProgress(), quests: 100, lastDay: 20000, settings: {fresh: 6},
    streak: {count: 4, last: 20000, best: 12},
    daily: {day: 20000, kind: 'clean', goal: 10, count: 10, done: true}, dailyDone: 15, exportDay: 20000};
  for (let i = 0; i < 1400; i++) progress.words[`b${String(i).padStart(4, '0')}`] = {box: i % 6, due: 20001, seen: 10};
  const before = structuredClone(progress);
  const text = exportText(progress);
  assert.match(text, /^WG1\.[A-Za-z0-9_-]+\.[0-9a-f]{8}$/);
  assert.deepEqual(importText(text), {ok: true, progress});
  assert.deepEqual(importText(` \n${text.match(/.{1,70}/g).join(' \n\t')}\n`), {ok: true, progress});
  assert.deepEqual(progress, before);
});

// 独立した参照計算で、壊れたデータにも正しい検査値を付ける。
function encoded(value) {
  const json = typeof value === 'string' ? value : JSON.stringify(value);
  let hash = 2166136261n;
  for (const char of json) hash = ((hash ^ BigInt(char.charCodeAt(0))) * 16777619n) & 0xffffffffn;
  return `WG1.${Buffer.from(json, 'latin1').toString('base64url')}.${hash.toString(16).padStart(8, '0')}`;
}

test('読み込みの失敗を分類し、例外を出さない', () => {
  const text = exportText(emptyProgress());
  assert.equal(text, encoded(serializeProgress(emptyProgress())));
  for (const [input, error] of [
    ['', 'empty'], [' \n\t', 'empty'], ['other', 'format'], [null, 'format'],
    ['WG1.a.12345678', 'format'], ['WG1.***.12345678', 'format'], [`${text}.extra`, 'format'],
    [text.slice(0, -1), 'checksum'], [text.replace(/.$/, text.endsWith('0') ? '1' : '0'), 'checksum'],
    [encoded({v: 2, words: {}}), 'data'], [encoded({v: 1, words: []}), 'data'],
    [encoded({v: 1, words: null}), 'data'], [encoded('{'), 'data'],
  ]) assert.deepEqual(importText(input), {ok: false, error}, String(input));
});

test('控えは元の文字列を保存し、読み戻せる。保存本体は変更しない', () => {
  const progress = {...emptyProgress(), quests: 3};
  const storage = memory();
  assert.equal(hasBackup(storage), false);
  assert.equal(backupProgress(storage), false);
  assert.equal(restoreBackup(storage).ok, false);
  saveProgress(storage, progress);
  const raw = storage.data[STORAGE_KEY];
  assert.equal(backupProgress(storage), true);
  assert.equal(storage.data[`${STORAGE_KEY}.backup`], raw);
  assert.equal(hasBackup(storage), true);
  saveProgress(storage, emptyProgress());
  assert.deepEqual(restoreBackup(storage), {progress, ok: true});
  assert.equal(loadProgress(storage).progress.quests, 0);
  for (const unavailable of [null, {getItem() { throw Error(); }, setItem() { throw Error(); }}]) {
    assert.equal(backupProgress(unavailable), false);
    assert.equal(hasBackup(unavailable), false);
    assert.equal(restoreBackup(unavailable).ok, false);
  }
  assert.equal(restoreBackup(memory({[`${STORAGE_KEY}.backup`]: '{'})).ok, false);
});

test('門の保存は旧形式と互換で、壊れた配列は既定値になる', () => {
  const old = serializeProgress(emptyProgress());
  delete old.gates;
  assert.deepEqual(validateProgress(old).gates, []);
  const oldJson = JSON.stringify(old);
  let hash = 0x811c9dc5;
  for (let i = 0; i < oldJson.length; i++) hash = Math.imul(hash ^ oldJson.charCodeAt(i), 0x01000193);
  const oldExport = `WG1.${btoa(oldJson).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '')}.${(hash >>> 0).toString(16).padStart(8, '0')}`;
  assert.deepEqual(importText(oldExport).progress.gates, []);
  for (const gates of [null, [0], [7], [1, 1], [1, '2'], [1.5]]) {
    assert.deepEqual(validateProgress({...old, gates}).gates, []);
  }
  const progress = {...emptyProgress(), gates: [1, 6]};
  assert.deepEqual(importText(exportText(progress)).progress.gates, [1, 6]);
});
