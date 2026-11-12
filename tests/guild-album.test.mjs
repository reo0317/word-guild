import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {albumPages, pageProgress, wardGroups, startIndex, clampIndex} from '../products/word-guild/guild/album.mjs';
import {summarize, IMPORT_ERRORS} from '../products/word-guild/guild/settings.mjs';
import {importText, exportText, emptyProgress} from '../products/word-guild/guild/store.mjs';

const words = JSON.parse(await readFile(new URL('../products/word-guild/data/words.json', import.meta.url), 'utf8'));
const pages = albumPages(words);
const withBoxes = (list, box) => ({...emptyProgress(), words: Object.fromEntries(list.map(w => [w.id, {box, due: 0, seen: 1}]))});

test('56ページ、各25枚で、街灯の番号順に並ぶ', () => {
  assert.equal(pages.length, 56);
  assert.ok(pages.every(p => p.words.length === 25));
  assert.deepEqual(pages.map(p => p.shelf), Array.from({length: 56}, (_, i) => i + 1));
  assert.equal(pages.reduce((n, p) => n + p.words.length, 0), 1400);
});

test('区ごとにページが束なる（6区、街灯は 6+10×5）', () => {
  const groups = wardGroups(pages);
  assert.deepEqual(groups.map(g => g.ch), [1, 2, 3, 4, 5, 6]);
  assert.deepEqual(groups.map(g => g.pages.length), [6, 10, 10, 10, 10, 10]);
});

test('ページの進み具合は習熟度から決まる（影・仮刷り・本刷り・金ぶち）', () => {
  const page = pages[0];
  assert.deepEqual(pageProgress(page, emptyProgress()), {total: 25, got: 0, lit: 0, gold: 0, complete: false, allGold: false});
  assert.equal(pageProgress(page, withBoxes(page.words, 1)).got, 25);
  assert.equal(pageProgress(page, withBoxes(page.words, 2)).complete, false);
  assert.equal(pageProgress(page, withBoxes(page.words, 3)).complete, true);
  assert.equal(pageProgress(page, withBoxes(page.words, 3)).allGold, false);
  assert.equal(pageProgress(page, withBoxes(page.words, 5)).allGold, true);
  const mixed = withBoxes(page.words.slice(0, 18), 3);
  assert.equal(pageProgress(page, mixed).got, 18);
  const zero = withBoxes(page.words, 0);
  assert.equal(pageProgress(page, zero).got, 0, '箱0は影のまま');
});

test('最初に開くページ：指定の街灯、なければ最初の未完のページ', () => {
  assert.equal(startIndex(pages, emptyProgress(), 7), 6);
  assert.equal(startIndex(pages, emptyProgress()), 0);
  const done = withBoxes([...pages[0].words, ...pages[1].words], 3);
  assert.equal(startIndex(pages, done), 2);
  assert.equal(startIndex(pages, withBoxes(words, 5)), 55);
  assert.equal(startIndex(pages, emptyProgress(), 999), 0);
});

test('ページ番号は範囲に収まる', () => {
  assert.equal(clampIndex(-1, 56), 0);
  assert.equal(clampIndex(56, 56), 55);
  assert.equal(clampIndex(3, 56), 3);
  assert.equal(clampIndex(0, 0), 0);
});

test('設定：書き出し → 読み込みで同じ進捗、要約が並ぶ、エラーの文がある', () => {
  const progress = withBoxes(words.slice(0, 40), 2);
  progress.quests = 7;
  const result = importText(exportText(progress));
  assert.ok(result.ok);
  assert.deepEqual(summarize(result.progress, words), {stamps: 40, quests: 7, streak: 0});
  assert.deepEqual(summarize(emptyProgress(), words), {stamps: 0, quests: 0, streak: 0});
  for (const error of ['empty', 'format', 'checksum', 'data']) assert.ok(IMPORT_ERRORS[error]);
  assert.equal(importText('').error, 'empty');
});
