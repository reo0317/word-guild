import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {buildMap, gateWords, separateSpecs} from '../products/word-guild/guild/stages.mjs';
import {emptyProgress} from '../products/word-guild/guild/store.mjs';

const words = JSON.parse(await readFile(new URL('../products/word-guild/data/words.json', import.meta.url), 'utf8'));
const today = 100;
function progressFor(list, box = 1, due = today + 2) {
  const p = emptyProgress();
  for (const w of list) p.words[w.id] = {box, due, seen: 1};
  return p;
}
const map = p => buildMap(words, p, today);

test('地図：280石段・56街灯、語順を保ち各街灯内で5語ずつ', () => {
  const m = map(emptyProgress());
  assert.deepEqual(m.wards.map(w => w.lamps.length), [6, 10, 10, 10, 10, 10]);
  const lamps = m.wards.flatMap(w => w.lamps);
  assert.equal(lamps.length, 56);
  assert.equal(lamps.flatMap(l => l.steps).length, 280);
  assert.deepEqual(lamps.flatMap(l => l.steps.flatMap(s => s.ids)), words.map(w => w.id));
  for (const lamp of lamps) {
    assert.equal(lamp.total, 25);
    assert.equal(lamp.steps.length, 5);
    assert.ok(lamp.steps.every(s => s.ids.length === 5 && !s.passed));
    assert.deepEqual([lamp.got, lamp.lit, lamp.gold], [0, 0, 0]);
  }
  assert.deepEqual(m.here, {ch: 1, shelf: 1, step: 1});
  assert.deepEqual(m.next, words.slice(0, 3).map(w => w.id));
});

test('今いる場所：部分通過、穴、街灯・区の境目、全通過', () => {
  for (const [n, here] of [[4, [1, 1, 1]], [5, [1, 1, 2]], [25, [1, 2, 1]], [150, [2, 7, 1]], [1400, [6, 56, 5]]]) {
    const m = map(progressFor(words.slice(0, n)));
    assert.deepEqual(m.here, Object.fromEntries(['ch', 'shelf', 'step'].map((key, i) => [key, here[i]])));
  }
  const p = progressFor(words);
  delete p.words[words[7].id];
  assert.deepEqual(map(p).here, {ch: 1, shelf: 1, step: 2});
  assert.deepEqual(map(p).next, [words[7].id]);
  assert.deepEqual(map(progressFor(words)).next, []);
});

test('切手と街灯：保存状態で通過し、習熟度3で点灯・5で金', () => {
  for (const box of [0, 1, 2, 3, 4, 5]) {
    const p = progressFor(words.slice(0, 25), box);
    const lamp = map(p).wards[0].lamps[0];
    assert.equal(lamp.got, 25);
    assert.ok(lamp.steps.every(s => s.passed));
    assert.equal(lamp.lit, box >= 3 ? 25 : 0);
    assert.equal(lamp.gold, box === 5 ? 25 : 0);
  }
});

test('戻り霧：19匹では晴れ、20匹から霧。期限順の顔3つと明日期限の全ID', () => {
  for (const n of [0, 19, 20, 21]) {
    const p = progressFor(words.slice(0, n), 1, today);
    p.words[words[30].id] = {box: 3, seen: 1, due: today + 1};
    p.words[words[31].id] = {box: 3, seen: 1, due: today + 2};
    if (n) p.words[words[n - 1].id].due = today - 1;
    const m = map(p);
    assert.equal(m.dueCount, n);
    assert.equal(m.fog, n >= 20);
    assert.deepEqual(m.tomorrow, [words[30].id]);
    assert.equal(m.due.length, Math.min(3, n));
    if (n) assert.equal(m.due[0], words[n - 1].id);
  }
});

test('門：全石段通過で出現、点灯不要、開門しなくても次の区へ進む', () => {
  const p = progressFor(words.slice(0, 149));
  assert.equal(map(p).wards[0].gate, 'hidden');
  p.words[words[149].id] = {box: 1, due: 102, seen: 1};
  assert.equal(map(p).wards[0].gate, 'open');
  assert.equal(map(p).here.ch, 2);
  p.gates = [1];
  assert.equal(map(p).wards[0].gate, 'cleared');
  assert.equal(map(p).wards[1].gate, 'hidden');
  assert.ok(map(progressFor(words)).wards.every(w => w.gate === 'open'));
});

test('同じ盤面の紙魚：種族と区が同じならインクを分ける。他は変えない', () => {
  const same = i => ({species: 'time', ink: 1, pattern: i, kind: 'normal'});
  const out = separateSpecs([same(0), same(1), same(2)], [1, 1, 1]);
  assert.deepEqual(out.map(s => s.ink).sort(), [0, 1, 2]);
  assert.equal(out[0].ink, 1);
  assert.deepEqual(out.map(s => s.pattern), [0, 1, 2]);
  assert.equal(same(0).ink, 1); // 入力は変えない
  // 区が違う・種族が違う・変わり種は、そのまま
  assert.deepEqual(separateSpecs([same(0), same(1)], [1, 2]).map(s => s.ink), [1, 1]);
  assert.deepEqual(separateSpecs([same(0), {...same(1), species: 'work'}], [1, 1]).map(s => s.ink), [1, 1]);
  assert.deepEqual(separateSpecs([{...same(0), kind: 'odd'}, same(1)], [1, 1]).map(s => s.ink), [1, 1]);
  assert.deepEqual(separateSpecs([], []), []);
});

test('門の12語：対象区だけ、習熟度→期限→元の順。入力を変更しない', () => {
  const p = progressFor(words, 4, 110);
  for (let i = 0; i < 14; i++) p.words[words[i].id] = {box: 1, due: 100 - i, seen: 1};
  p.words[words[0].id].box = 2;
  const snapshot = JSON.stringify({words, p});
  assert.deepEqual(gateWords(words, p, 1).map(w => w.id), words.slice(2, 14).reverse().map(w => w.id));
  assert.deepEqual(gateWords(words, emptyProgress(), 2), words.filter(w => w.ch === 2).slice(0, 12));
  assert.deepEqual(gateWords(words, p, 99), []);
  map(p);
  assert.equal(JSON.stringify({words, p}), snapshot);
});

test('空の語データも扱える', () => {
  const m = buildMap([], emptyProgress(), today);
  assert.deepEqual(m, {wards: [], here: null, next: [], due: [], dueCount: 0, fog: false, tomorrow: []});
});
