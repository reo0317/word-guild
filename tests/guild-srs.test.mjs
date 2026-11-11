import test from 'node:test';
import assert from 'node:assert/strict';
import {grade, pickSession, groupWords, shelfStatus, todayNumber, isDue, dueCount, INTERVALS} from '../products/word-guild/guild/srs.mjs';
import {emptyProgress} from '../products/word-guild/guild/store.mjs';
import {spelling} from '../products/word-guild/guild/board.mjs';
import {mulberry32} from '../products/word-guild/guild/rng.mjs';
import {readFile} from 'node:fs/promises';

const words = JSON.parse(await readFile(new URL('../products/word-guild/data/words.json', import.meta.url), 'utf8'));
const TODAY = 20000;

test('新出：clean は習熟度3・3日後、hint は最低1・当日、taught は1・当日', () => {
  assert.deepEqual(grade(undefined, 'clean', TODAY), {box: 3, due: TODAY + 3, seen: 1});
  assert.deepEqual(grade(undefined, 'hint', TODAY), {box: 1, due: TODAY, seen: 1});
  assert.deepEqual(grade(undefined, 'taught', TODAY), {box: 1, due: TODAY, seen: 1});
});

test('復習の clean は +1 で、間隔は 箱1→当日 2→1日 3→3日 4→7日 5→21日', () => {
  assert.deepEqual(INTERVALS, [0, 0, 1, 3, 7, 21]);
  const expected = {1: [2, 1], 2: [3, 3], 3: [4, 7], 4: [5, 21]};
  for (const [box, [next, days]] of Object.entries(expected)) {
    const after = grade({box: Number(box), due: TODAY, seen: 2}, 'clean', TODAY);
    assert.equal(after.box, next);
    assert.equal(after.due, TODAY + days);
    assert.equal(after.seen, 3);
  }
  assert.equal(grade({box: 5, due: TODAY, seen: 9}, 'clean', TODAY).box, 5, '上限は5');
  assert.equal(grade({box: 1, due: TODAY, seen: 1}, 'clean', TODAY).due, TODAY + 1);
});

test('復習の hint は据え置き（最低1）・当日、taught は1・当日', () => {
  assert.deepEqual(grade({box: 4, due: TODAY, seen: 3}, 'hint', TODAY), {box: 4, due: TODAY, seen: 4});
  assert.equal(grade({box: 0, due: TODAY, seen: 1}, 'hint', TODAY).box, 1);
  assert.deepEqual(grade({box: 5, due: TODAY, seen: 3}, 'taught', TODAY), {box: 1, due: TODAY, seen: 4});
  assert.throws(() => grade(undefined, 'unknown', TODAY));
});

test('期限は due <= 今日。日番号は現地時間の日付で切り替わる', () => {
  assert.equal(isDue({box: 3, due: TODAY, seen: 1}, TODAY), true);
  assert.equal(isDue({box: 3, due: TODAY + 1, seen: 1}, TODAY), false);
  assert.equal(isDue(undefined, TODAY), false);
  assert.equal(todayNumber(Date.UTC(2026, 10, 11, 20, 0), -540), todayNumber(Date.UTC(2026, 10, 12, 0, 0), 0), '日本時間では UTC 20時が翌日');
});

test('pickSession（初回）：新出が12語、重複なし、棚と id の順', () => {
  const groups = pickSession(words, emptyProgress(), TODAY);
  const picked = groups.flat();
  assert.equal(groups.length, 4);
  assert.ok(groups.every(group => group.length === 3));
  assert.equal(picked.length, 12);
  assert.equal(new Set(picked.map(w => w.id)).size, 12);
  const firstTwelve = [...words].sort((a, b) => a.shelf - b.shelf || a.id.localeCompare(b.id)).slice(0, 12);
  assert.deepEqual(new Set(picked.map(w => w.id)), new Set(firstTwelve.map(w => w.id)));
});

test('pickSession：期限語を古い順に最大8、新出4、不足は新出で補う', () => {
  const progress = emptyProgress();
  words.slice(0, 10).forEach((word, i) => {
    progress.words[word.id] = {box: 2, due: TODAY - i, seen: 2}; // i が大きいほど古い
  });
  progress.words[words[10].id] = {box: 4, due: TODAY + 5, seen: 3}; // 期限前は選ばれない
  const picked = pickSession(words, progress, TODAY).flat();
  const due = picked.filter(w => progress.words[w.id]);
  assert.equal(due.length, 8);
  assert.deepEqual(new Set(due.map(w => w.id)), new Set(words.slice(2, 10).map(w => w.id)), '最も古い8語');
  assert.equal(picked.filter(w => !progress.words[w.id]).length, 4);
  assert.ok(!picked.includes(words[10]));
  assert.equal(new Set(picked.map(w => w.id)).size, 12);
});

test('pickSession：期限語が少ないと新出で埋め、新出も尽きたら習熟度の低い順', () => {
  const progress = emptyProgress();
  words.slice(0, 3).forEach(word => { progress.words[word.id] = {box: 2, due: TODAY, seen: 2}; });
  assert.equal(pickSession(words, progress, TODAY).flat().filter(w => !progress.words[w.id]).length, 9);

  const all = emptyProgress();
  words.forEach((word, i) => { all.words[word.id] = {box: i === 59 ? 0 : 3, due: TODAY + 9, seen: 1}; });
  const picked = pickSession(words, all, TODAY).flat();
  assert.equal(picked.length, 12);
  assert.ok(picked.includes(words[59]), '習熟度0の語が最初に選ばれる');
});

test('groupWords：1組は3語以下かつ24文字以下。乱数を渡しても条件は同じ', () => {
  const long = ['abcdefghij', 'klmnopqrst', 'uvwxyzabcd', 'efghij', 'klmn', 'opq']
    .map((w, i) => ({id: `x${i}`, w, ja: w, pos: 'n', shelf: 1}));
  for (const rand of [null, mulberry32(5)]) {
    const groups = groupWords(long, rand);
    assert.equal(groups.flat().length, long.length);
    for (const group of groups) {
      assert.ok(group.length <= 3);
      assert.ok(group.reduce((sum, w) => sum + spelling(w.w).length, 0) <= 24);
    }
  }
});

test('shelfStatus：全語が箱3以上で灯り、全語が箱5で金色', () => {
  const progress = emptyProgress();
  const shelf1 = words.filter(w => w.shelf === 1);
  shelf1.forEach(word => { progress.words[word.id] = {box: 3, due: TODAY, seen: 1}; });
  let [s1, s2] = shelfStatus(words, progress);
  assert.deepEqual([s1.total, s1.lit, s1.isLit, s1.isGold, s2.isLit], [20, 20, true, false, false]);
  shelf1.forEach(word => { progress.words[word.id].box = 5; });
  [s1] = shelfStatus(words, progress);
  assert.equal(s1.isGold, true);
  progress.words[shelf1[0].id].box = 2;
  [s1] = shelfStatus(words, progress);
  assert.deepEqual([s1.isLit, s1.lit], [false, 19]);
  assert.equal(dueCount(words, progress, TODAY), 20, '期限は due で決まり、習熟度とは別');
});
