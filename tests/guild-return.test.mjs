import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {pickReturn, gradeReturn} from '../products/word-guild/guild/srs.mjs';
import {buildMap} from '../products/word-guild/guild/stages.mjs';
import {emptyProgress, serializeProgress, validateProgress, exportText, importText, saveProgress, backupProgress, restoreBackup} from '../products/word-guild/guild/store.mjs';

const words = JSON.parse(await readFile(new URL('../products/word-guild/data/words.json', import.meta.url)));
const day = 21000;
const filled = () => {
  const p = emptyProgress();
  for (const w of words.filter(w => w.shelf === 1)) p.words[w.id] = {box: 4, due: day + 7, seen: 3, restored: true};
  return p;
};

test('戻り道は指定した家の既出12語だけを選び、期限・箱・最終日・idの順で優先する', () => {
  const p = filled();
  const shelf = words.filter(w => w.shelf === 1);
  const urgent = shelf.at(-1);
  p.words[urgent.id] = {box: 5, due: day, seen: 5};
  const weak = shelf.at(-2);
  p.words[weak.id] = {box: 1, due: day + 1, seen: 1};
  delete p.words[shelf[0].id];
  const before = structuredClone(p);
  const groups = pickReturn(words, p, day, 1);
  const picked = groups.flat();
  assert.equal(picked.length, 12);
  assert.ok(picked.includes(urgent) && picked.includes(weak));
  assert.ok(picked.every(w => w.shelf === 1 && p.words[w.id]));
  assert.deepEqual(p, before);
  assert.deepEqual(pickReturn(words, p, day, 56), []);
});

test('期限前は正解で箱と期限を据え置き、逃げても箱は守って期限だけ今日にする', () => {
  const state = {box: 5, due: day + 9, seen: 4};
  assert.deepEqual(gradeReturn(state, 'clean', day), {...state, seen: 5});
  for (const result of ['hint', 'taught']) {
    assert.deepEqual(gradeReturn(state, result, day), {box: 5, due: day, seen: 5});
    assert.equal(gradeReturn({...state, due: day}, result, day).box, 5);
  }
  assert.deepEqual(gradeReturn({box: 3, due: day, seen: 4}, 'clean', day), {box: 4, due: day + 7, seen: 5});
});

test('戻り道の採点で箱・現在地・門・完成した手紙を後退させない', () => {
  const p = filled();
  p.gates = [1];
  const before = buildMap(words, p, day);
  assert.equal(before.wards[0].lamps[0].done, true);
  for (const [i, w] of pickReturn(words, p, day, 1).flat().entries()) {
    const previous = p.words[w.id];
    p.words[w.id] = {...gradeReturn(previous, ['clean', 'hint', 'taught'][i % 3], day), restored: previous.restored};
    assert.ok(p.words[w.id].box >= previous.box);
  }
  const after = buildMap(words, p, day);
  assert.deepEqual(after.here, before.here);
  assert.deepEqual(after.wards.map(w => w.gate), before.wards.map(w => w.gate));
  assert.equal(after.wards[0].lamps[0].done, true);
});

test('夜の保存と消印は古い v:1 を読み、書出し・バックアップでも保持する', () => {
  const old = validateProgress({v: 1, words: {a: [3, day, 1]}});
  assert.deepEqual([old.rares, old.rare, old.seals], [{}, {miss: 0, day: 0, met: []}, []]);
  const p = filled();
  p.rares = {r0001: {box: 4, due: day, seen: 2}, future: {box: 5, due: day, seen: 3}};
  p.rare = {miss: 3, day, met: [1, 56]};
  p.seals = [1, 3];
  assert.deepEqual(serializeProgress(p).rares.r0001, [4, day, 2]);
  assert.deepEqual(importText(exportText(p)).progress, p);
  const data = new Map();
  const storage = {getItem: k => data.get(k) ?? null, setItem: (k, v) => data.set(k, v)};
  saveProgress(storage, p);
  assert.equal(backupProgress(storage), true);
  assert.deepEqual(restoreBackup(storage).progress, p);
});

test('壊れた夜の状態だけを捨て、有効な未知idを残す', () => {
  const p = validateProgress({v: 1, words: {}, rares: {ok: [5, day, 3], bad: [6, 0, 1], bad2: [1, -1, 3], bad3: [1, 0, 1, 'false']}, rare: {miss: 4, day: -1, met: [1, 1]}, seals: [0, 57]});
  assert.deepEqual(p.rares, {ok: {box: 5, due: day, seen: 3}});
  assert.deepEqual(p.rare, {miss: 0, day: 0, met: []});
  assert.deepEqual(p.seals, []);
});

import {Quest, HEARTS} from '../products/word-guild/guild/quest.mjs';
import {mulberry32} from '../products/word-guild/guild/rng.mjs';

function returnQuest(progress = filled(), options = {}) {
  return new Quest(pickReturn(words, progress, day, 1), {
    progress, today: day, mode: 'return', shelf: 1, rand: mulberry32(18), ...options,
  });
}
function complete(quest, beforeAnswer = () => {}) {
  for (let turn = 0; turn < 30 && quest.phase !== 'finished'; turn++) {
    if (quest.phase === 'battle') {
      beforeAnswer(quest);
      for (const slot of [...quest.unsolved]) quest.answer(slot.text);
    } else quest.next();
  }
  assert.equal(quest.phase, 'finished');
}

test('戻り道Quest：12語の無傷・ヒントなしで消印、地図と門を変えず速達・日数は数える', () => {
  const p = filled();
  p.gates = [1];
  p.daily = {day, kind: 'finish', goal: 1, count: 0, done: false};
  const before = structuredClone(p);
  const map = buildMap(words, p, day);
  let saves = 0;
  const q = returnQuest(p, {gate: 2, save: () => saves++});
  complete(q);
  assert.equal(saves, 1);
  assert.equal(q.outcome.sealed, true);
  assert.deepEqual(q.progress.seals, [1]);
  assert.deepEqual(q.progress.gates, [1]);
  assert.deepEqual(buildMap(words, q.progress, day).here, map.here);
  assert.equal(buildMap(words, q.progress, day).wards[0].lamps[0].done, true);
  assert.equal(q.progress.quests, p.quests + 1);
  assert.equal(q.progress.streak.count, 1);
  assert.equal(q.progress.daily.done, true);
  assert.deepEqual(p, before);
  const again = returnQuest(q.progress);
  complete(again);
  assert.deepEqual(again.progress.seals, [1], '消印は重複しない');
});

test('戻り道Quest：ヒント・誤答・失ったハートのどれでも無傷の消印は付かない', () => {
  for (const kind of ['hint', 'wrong', 'attack']) {
    const q = returnQuest();
    let used = false;
    complete(q, current => {
      if (used) return;
      used = true;
      if (kind === 'hint') current.hint(current.unsolved[0].word.id);
      if (kind === 'wrong') current.answer('ZZZZZZ');
      if (kind === 'attack') current.advance(current.idleLimit);
    });
    assert.equal(q.outcome.sealed, false, kind);
    assert.deepEqual(q.progress.seals, [], kind);
  }
});

test('戻り道Quest：ヒントで逃げた未復元の語も再戦のヒントなし正解で戻る', () => {
  const p = filled();
  const target = pickReturn(words, p, day, 1).flat()[0];
  p.words[target.id].restored = false;
  const q = returnQuest(p);
  complete(q, current => {
    if (!current.isRevenge && current.unsolved.some(s => s.word.id === target.id)) current.hint(target.id);
  });
  assert.equal(q.progress.words[target.id].restored, true);
  assert.equal(q.progress.words[target.id].box, 4);
  assert.equal(q.progress.words[target.id].due, day);
  assert.equal(q.outcome.entries.find(e => e.word.id === target.id).stamped, true);
  assert.equal(q.outcome.sealed, false);
  const stillHinted = returnQuest(p);
  complete(stillHinted, current => {
    if (current.unsolved.some(s => s.word.id === target.id)) current.hint(target.id);
  });
  assert.equal(stillHinted.progress.words[target.id].restored, false);
});

test('戻り道Quest：撤退で逃げた出題済み語は箱を下げず今日の期限へ、未出題語は据え置き', () => {
  const p = filled();
  const q = returnQuest(p);
  const appeared = q.slots.map(s => s.word.id);
  const notAppeared = q.groups.slice(1).flat().map(w => w.id);
  q.next();
  q.advance(q.idleLimit * HEARTS);
  assert.equal(q.retreated, true);
  assert.equal(q.nightChecked, false, 'ハート0では夜へ進まない');
  for (const id of appeared) {
    assert.equal(q.progress.words[id].due, day, id);
    assert.equal(q.progress.words[id].box, p.words[id].box);
    assert.equal(q.progress.words[id].restored, true);
  }
  for (const id of notAppeared) assert.deepEqual(q.progress.words[id], p.words[id]);
  assert.deepEqual(q.progress.seals, []);
});


test('まれびとのヒント逃走と復元済みの印は書出し・読み込み後も区別する', () => {
  const p = emptyProgress();
  p.rares = {
    r0001: {box: 1, due: day, seen: 1, restored: false},
    r0002: {box: 3, due: day + 3, seen: 1, restored: true},
    r0003: {box: 3, due: day + 3, seen: 1},
  };
  const wire = serializeProgress(p);
  assert.deepEqual(wire.rares.r0001, [1, day, 1, false]);
  assert.deepEqual(wire.rares.r0002, [3, day + 3, 1, true]);
  assert.equal(wire.rares.r0003.length, 3, '旧保存は3項のまま');
  assert.deepEqual(validateProgress(wire).rares, p.rares);
  assert.deepEqual(importText(exportText(p)).progress.rares, p.rares);
});
