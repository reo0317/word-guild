import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {chapterStatus, currentChapter, CHAPTER_NAMES} from '../products/word-guild/guild/chapters.mjs';
import {emptyProgress} from '../products/word-guild/guild/store.mjs';
import {CREDITS} from '../products/word-guild/guild/credits.mjs';

const words = JSON.parse(await readFile(new URL('../products/word-guild/data/words.json', import.meta.url), 'utf8'));

function lightChapters(progress, chapters, box = 3) {
  for (const word of words.filter(w => chapters.includes(w.ch))) progress.words[word.id] = {box, due: 0, seen: 1};
}

test('chapterStatus：章は6つで、棚の数は 6・10・10・10・10・10', () => {
  const chapters = chapterStatus(words, emptyProgress());
  assert.deepEqual(chapters.map(c => c.ch), [1, 2, 3, 4, 5, 6]);
  assert.deepEqual(chapters.map(c => c.shelves.length), [6, 10, 10, 10, 10, 10]);
  assert.equal(CHAPTER_NAMES.length, 6);
});

test('最初は章1だけが開いていて、現在の章は章1', () => {
  const chapters = chapterStatus(words, emptyProgress());
  assert.deepEqual(chapters.map(c => c.isOpen), [true, false, false, false, false, false]);
  assert.equal(currentChapter(chapters).ch, 1);
});

test('章の全棚が灯ると次の章が開く。1棚でも欠けると開かない', () => {
  const progress = emptyProgress();
  lightChapters(progress, [1]);
  let chapters = chapterStatus(words, progress);
  assert.deepEqual([chapters[0].isCleared, chapters[1].isOpen, chapters[2].isOpen], [true, true, false]);
  assert.equal(currentChapter(chapters).ch, 2);
  const lastOfChapter1 = words.filter(w => w.ch === 1).at(-1);
  progress.words[lastOfChapter1.id].box = 2;
  chapters = chapterStatus(words, progress);
  assert.deepEqual([chapters[0].litShelves, chapters[1].isOpen], [5, false]);
  assert.equal(currentChapter(chapters).ch, 1);
});

test('全章が灯ると現在の章は章6。前の章が欠けたままなら先の章は開かない', () => {
  const progress = emptyProgress();
  lightChapters(progress, [1, 2, 3, 4, 5, 6]);
  assert.equal(currentChapter(chapterStatus(words, progress)).ch, 6);
  delete progress.words[words.find(w => w.ch === 2).id];
  const chapters = chapterStatus(words, progress);
  assert.deepEqual(chapters.map(c => c.isOpen), [true, true, false, false, false, false], '章3以降は章2が灯るまで閉じたまま');
  assert.equal(currentChapter(chapters).ch, 2);
});

test('クレジットは data/LICENSE-DATA.md と同じ名前・URL・著作者・変更点を含む', async () => {
  const license = await readFile(new URL('../data/LICENSE-DATA.md', import.meta.url), 'utf8');
  const expected = [...CREDITS.lists.flatMap(l => [l.name, l.url]), CREDITS.license.name, CREDITS.license.url, CREDITS.author, ...CREDITS.changes];
  for (const text of expected) assert.ok(license.includes(text), `LICENSE-DATA.md に「${text}」がない`);
});
