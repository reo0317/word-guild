import test from 'node:test';
import assert from 'node:assert/strict';
import {Quest, IDLE_LIMIT, HEARTS} from '../products/word-guild/guild/quest.mjs';
import {mulberry32} from '../products/word-guild/guild/rng.mjs';
import {emptyProgress} from '../products/word-guild/guild/store.mjs';

const TODAY = 20000;
const list = ['book', 'tree', 'door', 'fish', 'rain', 'moon', 'star', 'milk', 'road', 'bird', 'snow', 'bread'];
const words = list.map((w, i) => ({id: `w${i}`, w, ja: w, pos: 'n', shelf: 1}));
const groups = [0, 1, 2, 3].map(i => words.slice(i * 3, i * 3 + 3));

function newQuest(progress = emptyProgress()) {
  const saved = [];
  const quest = new Quest(groups, {rand: mulberry32(1), progress, today: TODAY, save: p => saved.push(p)});
  return {quest, saved};
}
function start(quest) { quest.next(); } // entering → battle
function solve(quest, ids = null) {
  for (const slot of [...quest.unsolved]) {
    if (!ids || ids.includes(slot.word.id)) quest.answer(slot.text.toUpperCase());
  }
}

test('入場中は進まず、next() で戦闘が始まる。誤答に罰はない', () => {
  const {quest} = newQuest();
  assert.equal(quest.phase, 'entering');
  assert.deepEqual(quest.advance(IDLE_LIMIT * 3), []);
  assert.equal(quest.hearts, HEARTS);
  assert.equal(quest.answer('BOOK'), null, '入場中は答えられない');
  start(quest);
  assert.equal(quest.answer('ZZZ'), null);
  assert.equal(quest.hearts, HEARTS);
  assert.equal(quest.idle, 0);
});

test('正解で語が解決し、idle が0に戻り、3語で撃破になる', () => {
  const {quest} = newQuest();
  start(quest);
  quest.advance(10000);
  const first = quest.answer('BOOK');
  assert.deepEqual([first.word.id, first.cleared], ['w0', false]);
  assert.equal(quest.idle, 0);
  assert.equal(quest.answer('book'), null, '解決済みの語は再び正解にならない');
  quest.answer('TREE');
  const last = quest.answer('DOOR');
  assert.equal(last.cleared, true);
  assert.equal(quest.phase, 'defeated');
  assert.deepEqual(quest.advance(IDLE_LIMIT), [], '撃破の表示中は時間が進まない');
});

test('15秒で攻撃：ハート-1、ヒントが最小の未回答語に+1、idle が戻る', () => {
  const {quest} = newQuest();
  start(quest);
  quest.hint('w0');
  assert.deepEqual(quest.advance(IDLE_LIMIT - 1), []);
  const events = quest.advance(1);
  assert.equal(events.length, 1);
  assert.equal(events[0].type, 'attack');
  assert.equal(quest.hearts, HEARTS - 1);
  assert.equal(quest.idle, 0);
  assert.deepEqual(quest.slots.map(s => s.hint), [1, 1, 0], '先頭が最小の w1 に付く');
  quest.advance(IDLE_LIMIT);
  assert.deepEqual(quest.slots.map(s => s.hint), [1, 1, 1]);
  quest.advance(IDLE_LIMIT);
  assert.deepEqual(quest.slots.map(s => s.hint), [2, 1, 1]);
});

test('ヒント・おしえては1／2にそろえ、下げない', () => {
  const {quest} = newQuest();
  start(quest);
  quest.teach('w0');
  quest.hint('w0');
  assert.equal(quest.slots[0].hint, 2);
  assert.equal(quest.hint('nothing'), false);
  quest.answer('BOOK');
  assert.equal(quest.hint('w0'), false, '解決済みの語には付けない');
});

test('ハート0で撤退し、回答済みの語だけが採点されて保存される', () => {
  const {quest, saved} = newQuest();
  start(quest);
  quest.answer('BOOK');
  let events = [];
  for (let i = 0; i < HEARTS; i++) events = quest.advance(IDLE_LIMIT);
  assert.equal(quest.hearts, 0);
  assert.equal(events.at(-1).type, 'retreat');
  assert.equal(quest.phase, 'finished');
  assert.equal(quest.retreated, true);
  assert.equal(saved.length, 1);
  assert.deepEqual(Object.keys(saved[0].words), ['w0']);
  assert.deepEqual(saved[0].words.w0, {box: 3, due: TODAY + 3, seen: 1});
  assert.equal(saved[0].quests, 1);
  assert.equal(saved[0].lastDay, TODAY);
  assert.equal(quest.outcome.entries.length, 1);
});

test('一度の大きな advance でも、ハート0で止まり保存は1回だけ', () => {
  const {quest, saved} = newQuest();
  start(quest);
  quest.advance(IDLE_LIMIT * 20);
  assert.equal(quest.hearts, 0);
  assert.equal(saved.length, 1);
});

test('全語 clean ならリベンジなしで結果へ。語の結果は hint 0/1/2 に対応する', () => {
  const {quest, saved} = newQuest();
  for (let board = 0; board < 4; board++) {
    start(quest);
    solve(quest);
    quest.next();
    if (board < 3) assert.equal(quest.phase, 'entering');
  }
  assert.equal(quest.phase, 'finished');
  assert.equal(quest.retreated, false);
  assert.equal(saved.length, 1);
  assert.equal(Object.keys(saved[0].words).length, 12);
  assert.ok(Object.values(saved[0].words).every(s => s.box === 3));
});

test('リベンジ盤面：clean 以外の語を最大3語、taught を優先して出す', () => {
  const {quest, saved} = newQuest();
  const plan = {w0: 'hint', w2: 'taught', w4: 'hint', w6: 'taught', w8: 'hint'};
  for (let board = 0; board < 4; board++) {
    start(quest);
    for (const slot of quest.slots) {
      if (plan[slot.word.id] === 'hint') quest.hint(slot.word.id);
      if (plan[slot.word.id] === 'taught') quest.teach(slot.word.id);
    }
    solve(quest);
    quest.next();
  }
  assert.equal(quest.isRevenge, true);
  assert.equal(quest.enemy, 'animal');
  assert.equal(quest.index, 4);
  assert.deepEqual(quest.slots.map(s => s.word.id), ['w2', 'w6', 'w0'], 'taught 2語 → hint の先頭');
  assert.ok(quest.slots.every(s => s.hint === 0), 'リベンジでは表示を新しくする');
  start(quest);
  solve(quest);
  assert.equal(quest.phase, 'defeated');
  quest.next();
  assert.equal(quest.phase, 'finished');
  const saved0 = saved[0].words;
  assert.equal(saved0.w2.box, 1, '最初の結果（taught）のまま');
  assert.equal(saved0.w0.box, 1, 'hint は新出なら最低1');
  assert.equal(saved0.w1.box, 3);
});

test('リベンジでの結果は習熟度を変えない（ヒントなしで解いても、教わったまま）', () => {
  const progress = emptyProgress();
  progress.words.w0 = {box: 4, due: TODAY, seen: 5};
  const {quest, saved} = newQuest(progress);
  for (let board = 0; board < 4; board++) {
    start(quest);
    if (board === 0) quest.hint('w0');
    solve(quest);
    quest.next();
  }
  start(quest);
  assert.deepEqual(quest.slots.map(s => s.word.id), ['w0']);
  solve(quest);
  quest.next();
  assert.deepEqual(saved[0].words.w0, {box: 4, due: TODAY, seen: 6}, 'hint は据え置き・当日');
});

test('リベンジ中の撤退でも、最初の結果で保存される', () => {
  const {quest, saved} = newQuest();
  for (let board = 0; board < 4; board++) {
    start(quest);
    if (board === 1) quest.teach('w3');
    solve(quest);
    quest.next();
  }
  start(quest);
  quest.advance(IDLE_LIMIT * HEARTS);
  assert.equal(quest.retreated, true);
  assert.equal(saved.length, 1);
  assert.equal(saved[0].words.w3.box, 1);
  assert.equal(Object.keys(saved[0].words).length, 12);
});

test('結果の分類：新出 clean（知ってた）・復習 clean（正解）・ヒント・教わった', () => {
  const progress = emptyProgress();
  progress.words.w1 = {box: 2, due: TODAY, seen: 2};
  const {quest} = newQuest(progress);
  start(quest);
  quest.hint('w2');
  solve(quest);
  for (let board = 1; board < 4; board++) { quest.next(); start(quest); solve(quest); }
  quest.next(); // リベンジ入場
  quest.next();
  solve(quest);
  quest.next();
  const entries = Object.fromEntries(quest.outcome.entries.map(e => [e.word.id, e]));
  assert.deepEqual([entries.w0.result, entries.w0.isNew], ['clean', true]);
  assert.deepEqual([entries.w1.result, entries.w1.isNew, entries.w1.box], ['clean', false, 3]);
  assert.equal(entries.w2.result, 'hint');
});
