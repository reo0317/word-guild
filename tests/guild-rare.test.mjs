import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {visitors, pickRare, rollRare, rareStatus} from '../products/word-guild/guild/rare.mjs';
import {emptyProgress} from '../products/word-guild/guild/store.mjs';
import {buildMap} from '../products/word-guild/guild/stages.mjs';
import {dueCount, grade} from '../products/word-guild/guild/srs.mjs';
const read = name => readFile(new URL(`../products/word-guild/data/${name}.json`, import.meta.url), 'utf8').then(JSON.parse);
const [words, rares] = await Promise.all([read('words'), read('rare')]);
function completed() {
  const p = emptyProgress();
  p.rares = {};
  for (const word of words) p.words[word.id] = {box: 3, due: 1000, seen: 1};
  return p;
}

test('夜の訪問：完成した家のみ、連続日数で1〜3軒、56軒すべてへ巡回', () => {
  const p = completed();
  for (const [streak, count] of [[0, 1], [3, 2], [7, 3]]) {
    p.streak.count = streak;
    const visited = new Set();
    for (let day = 100; day < 156; day++) {
      p.streak.last = day;
      const selected = visitors(buildMap(words, p, day), rares, p, day);
      assert.equal(selected.length, count);
      selected.forEach(s => visited.add(s));
    }
    assert.equal(visited.size, 56);
  }
  assert.deepEqual(visitors(buildMap(words, emptyProgress(), 100), rares, emptyProgress(), 100), []);
});

test('夜の訪問：期限の家が先、期限前の5語だけなら候補から外れる', () => {
  const p = completed();
  p.rares.r0001 = {box: 3, due: 80, seen: 1};
  assert.deepEqual(visitors(buildMap(words, p, 100), rares, p, 100), [1]);
  assert.equal(pickRare(rares, p, 1, 100).id, 'r0001');
  for (const word of rares.filter(w => w.shelf === 1)) p.rares[word.id] = {box: 3, due: 101, seen: 1};
  assert.equal(pickRare(rares, p, 1, 100), null);
  assert.ok(!visitors(buildMap(words, p, 100), rares, p, 100).includes(1));
});

test('ふいの出会い：外れるたびに確率が上がり4回目は必ず会える', () => {
  const p = completed();
  const map = buildMap(words, p, 100);
  const shelf = Array.from({length: 56}, (_, i) => i + 1).find(s => !visitors(map, rares, p, 100).includes(s));
  for (let i = 0; i < 4; i++) {
    const before = structuredClone(p);
    const result = rollRare(p, shelf, 100, () => 1, rares, map);
    assert.deepEqual(p, before);
    assert.equal(Boolean(result.word), i === 3);
    assert.equal(result.rare.miss, i === 3 ? 0 : i + 1);
    p.rare = result.rare;
  }
});

test('✦ はその日一度確定、逃げても同日に再訪可、翌日は確定権が戻る', () => {
  const p = completed(), day = 100;
  const map = buildMap(words, p, day);
  const shelf = visitors(map, rares, p, day)[0];
  const first = rollRare(p, shelf, day, () => 1, rares, map);
  assert.ok(first.sure && first.word);
  p.rare = first.rare;
  const again = rollRare(p, shelf, day, () => 0, rares, map);
  assert.ok(!again.sure && again.word);
  assert.equal(again.word.id, first.word.id);
  const tomorrow = day + 56;
  assert.ok(rollRare(p, shelf, tomorrow, () => 1, rares, map).sure);
});

test('まれびとの採点・逃走・抽選は通常語、現在地、門、戻り霧を動かさない', () => {
  const p = completed(), day = 100;
  const before = structuredClone(p.words), map = buildMap(words, p, day);
  const result = rollRare(p, visitors(map, rares, p, day)[0], day, () => 0, rares, map);
  p.rare = result.rare;
  p.rares[result.word.id] = grade(undefined, 'clean', day);
  assert.deepEqual(p.words, before);
  assert.deepEqual(buildMap(words, p, day), map);
  assert.equal(dueCount(words, p, day), 0);
  assert.deepEqual(p.gates, []);
});

test('夜の切手：街灯5枚・区・全体の完成と金ぶちを別に数える', () => {
  const p = completed();
  let status = rareStatus(rares, p);
  assert.equal(status.total, 280);
  assert.equal(status.met, 0);
  p.rares.r0001 = {box: 1, due: 100, seen: 1, restored: false};
  assert.equal(rareStatus(rares, p).met, 0);
  assert.equal(pickRare(rares, p, 1, 100).id, 'r0001');
  for (const w of rares.filter(w => w.shelf === 1)) p.rares[w.id] = {box: 3, due: 100, seen: 1};
  status = rareStatus(rares, p);
  assert.deepEqual(status.shelves[1], {met: 5, gold: 0, total: 5, complete: true});
  assert.equal(status.wards[1].complete, false);
  for (const w of rares) p.rares[w.id] = {box: 5, due: 100, seen: 1};
  status = rareStatus(rares, p);
  assert.ok(status.complete);
  assert.equal(status.gold, 280);
  assert.ok(Object.values(status.wards).every(w => w.complete));
});

import {Quest, HEARTS} from '../products/word-guild/guild/quest.mjs';
import {groupWords} from '../products/word-guild/guild/srs.mjs';
import {mulberry32} from '../products/word-guild/guild/rng.mjs';
function returnQuest(extra = {}) {
  const p = completed(), today = 100;
  p.daily = {day: today, kind: 'clean', goal: 100, count: 0, done: false};
  const map = buildMap(words, p, today);
  const shelf = visitors(map, rares, p, today)[0];
  return new Quest(groupWords(words.filter(w => w.shelf === shelf).slice(0, 12)),
    {progress: p, today, shelf, mode: 'return', rares, map, rand: mulberry32(42), ...extra});
}
function solveOrdinary(q, hint = false) {
  while (!q.isNight && !q.isRevenge && q.phase !== 'finished') {
    if (q.phase === 'entering') q.next();
    for (const slot of q.unsolved) {
      if (hint) q.hint(slot.word.id);
      q.answer(slot.text);
    }
    q.next();
  }
}

test('戻り道の4盤面後に夜、誤答・25秒の逃走でハートは減らない', () => {
  const q = returnQuest();
  solveOrdinary(q);
  assert.ok(q.isNight);
  assert.equal(q.index, q.total);
  q.next();
  assert.equal(q.answer('ZZZZZZ'), null);
  assert.deepEqual(q.advance(24999), []);
  assert.equal(q.hearts, HEARTS);
  assert.equal(q.advance(1)[0].type, 'escape');
  assert.equal(q.hearts, HEARTS);
  q.next();
  assert.equal(q.phase, 'finished');
  assert.equal(q.progress.daily.count, 12);
  assert.equal(q.progress.words[q.nightWord.id], undefined);
  assert.equal(q.progress.rares[q.nightWord.id].restored, false);
  assert.equal(q.progress.rares[q.nightWord.id].due, q.today);
  assert.ok(q.outcome.sealed);
});

test('夜のヒントは逃走・切手未取得、ヒントなしなら夜の切手だけが増える', () => {
  for (const help of [null, 'hint', 'teach']) {
    const q = returnQuest();
    solveOrdinary(q);
    const before = buildMap(words, q.startProgress, q.today);
    q.next();
    if (help) q[help](q.nightWord.id);
    q.answer(q.slots[0].text);
    q.next();
    assert.equal(q.phase, 'finished');
    assert.equal(q.progress.daily.count, 12);
    assert.equal(rareStatus(rares, q.progress).met, help ? 0 : 1);
    assert.equal(q.progress.rares[q.nightWord.id].restored, !help);
    assert.equal(q.progress.words[q.nightWord.id], undefined);
    assert.deepEqual(buildMap(words, q.progress, q.today), before);
    assert.equal(q.progress.quests, 1);
    q.finish(false);
    assert.equal(q.progress.quests, 1);
  }
});

test('通常配達やハート切れには夜が開かず、戻り道の再戦は夜の後', () => {
  const normal = returnQuest({mode: 'normal'});
  solveOrdinary(normal);
  assert.equal(normal.phase, 'finished');
  assert.equal(normal.nightWord, null);
  const lost = returnQuest();
  lost.next();
  lost.advance(75000);
  assert.equal(lost.phase, 'finished');
  assert.equal(lost.nightWord, null);
  const revenge = returnQuest();
  solveOrdinary(revenge, true);
  assert.ok(revenge.isNight);
  revenge.next();
  revenge.advance(25000);
  revenge.next();
  assert.ok(revenge.isRevenge);
  assert.ok(!revenge.isNight);
  revenge.next();
  for (const slot of revenge.unsolved) revenge.answer(slot.text);
  revenge.next();
  assert.equal(revenge.phase, 'finished');
  assert.equal(revenge.progress.quests, 1);
});
