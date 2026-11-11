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
