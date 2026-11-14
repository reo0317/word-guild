import test from 'node:test';
import assert from 'node:assert/strict';
import {rollDaily, applyOutcome, streakNow, DAILY_TEXT} from '../products/word-guild/guild/daily.mjs';
import {emptyProgress} from '../products/word-guild/guild/store.mjs';

const TODAY = 20000;
const words = Array.from({length: 40}, (_, i) => ({id: `w${i}`, w: `word${i}`, ja: 'x', pos: 'n', shelf: 1}));
const entry = (result, extra = {}) => ({word: words[0], result, isNew: false, box: 1, due: false, big: false, ...extra});
const withDaily = (kind, goal, count = 0, extra = {}) => ({...emptyProgress(), daily: {day: TODAY, kind, goal, count, done: false}, ...extra});
const run = (progress, entries, retreated = false, today = TODAY) => applyOutcome(progress, {retreated, entries}, today);

test('revenge：期限の語を clean か hint で答えたときだけ数える', () => {
  const r = run(withDaily('revenge', 8), [
    entry('clean', {due: true}), entry('hint', {due: true}), entry('taught', {due: true}),
    entry('clean', {due: false}), entry('missed', {due: true}),
  ]);
  assert.equal(r.progress.daily.count, 2);
});

test('fresh：新出の語は taught も数える。復習の語は数えない', () => {
  const r = run(withDaily('fresh', 8), [entry('clean', {isNew: true}), entry('taught', {isNew: true}), entry('clean'), entry('missed', {isNew: true})]);
  assert.equal(r.progress.daily.count, 2);
});

test('clean：ヒントなしの語だけ数える', () => {
  const r = run(withDaily('clean', 10), [entry('clean'), entry('hint'), entry('taught'), entry('clean', {isNew: true})]);
  assert.equal(r.progress.daily.count, 2);
});

test('finish：撤退せず終えたときだけ1回', () => {
  assert.equal(run(withDaily('finish', 2), [entry('clean')]).progress.daily.count, 1);
  assert.equal(run(withDaily('finish', 2), [entry('clean')], true).progress.daily.count, 0);
});

test('大物は revenge・fresh・clean で2体分、finish では1回', () => {
  assert.equal(run(withDaily('revenge', 8), [entry('clean', {due: true, big: true})]).progress.daily.count, 2);
  assert.equal(run(withDaily('fresh', 8), [entry('taught', {isNew: true, big: true})]).progress.daily.count, 2);
  assert.equal(run(withDaily('clean', 10), [entry('clean', {big: true})]).progress.daily.count, 2);
  assert.equal(run(withDaily('finish', 2), [entry('clean', {big: true})]).progress.daily.count, 1);
});

test('goal で止まり、達成は1日1回だけ dailyDone を増やす', () => {
  const first = run(withDaily('clean', 10, 9, {dailyDone: 3}), [entry('clean', {big: true}), entry('clean')]);
  assert.equal(first.progress.daily.count, 10);
  assert.equal(first.progress.daily.done, true);
  assert.equal(first.progress.dailyDone, 4);
  assert.equal(first.dailyDone, true);
  const second = run(first.progress, [entry('clean')]);
  assert.equal(second.progress.dailyDone, 4);
  assert.equal(second.dailyDone, false);
  assert.equal(second.progress.daily.count, 10);
});

test('日付が違う依頼・依頼なしは数えない。引数は書き換えない', () => {
  const old = withDaily('clean', 10);
  const snapshot = JSON.stringify(old);
  const r = run(old, [entry('clean')], false, TODAY + 1);
  assert.equal(r.progress.daily.count, 0);
  assert.equal(JSON.stringify(old), snapshot);
  assert.equal(run(emptyProgress(), [entry('clean')]).progress.daily, null);
});

test('rollDaily：同じ日は変わらず、違う日は新しい依頼', () => {
  const p = emptyProgress();
  const a = rollDaily(p, words, TODAY);
  assert.equal(a.daily.day, TODAY);
  assert.equal(a.daily.count, 0);
  assert.equal(a.daily.done, false);
  assert.equal(p.daily, null, '引数は変えない');
  assert.equal(rollDaily(a, words, TODAY), a);
  assert.equal(rollDaily(a, words, TODAY).daily.kind, a.daily.kind);
  assert.equal(rollDaily(a, words, TODAY + 1).daily.day, TODAY + 1);
});

test('rollDaily：出せない種類は選ばず、日番号で順に替わる', () => {
  // 未出題 40 語・期限なし：fresh(8)・clean・finish が出せる
  const kinds = [0, 1, 2].map(d => rollDaily(emptyProgress(), words, 30000 + d).daily.kind);
  assert.deepEqual(new Set(kinds), new Set(['fresh', 'clean', 'finish']));
  // 期限の語が8語以上なら revenge も入る（4つで1周）
  const due = emptyProgress();
  words.slice(0, 8).forEach(w => { due.words[w.id] = {box: 2, due: TODAY, seen: 2}; });
  const four = [0, 1, 2, 3].map(d => rollDaily(due, words, 30000 + d).daily.kind);
  assert.deepEqual(new Set(four), new Set(['revenge', 'fresh', 'clean', 'finish']));
  // 全語が出題済み・期限なし：revenge も fresh も出ない
  const seen = emptyProgress();
  words.forEach(w => { seen.words[w.id] = {box: 3, due: TODAY + 9, seen: 1}; });
  for (let d = 0; d < 6; d++) assert.ok(['clean', 'finish'].includes(rollDaily(seen, words, TODAY + d).daily.kind));
  // 未出題が goal に足りないと fresh は出ない
  const few = emptyProgress();
  words.slice(0, 33).forEach(w => { few.words[w.id] = {box: 3, due: TODAY + 9, seen: 1}; });
  for (let d = 0; d < 6; d++) assert.notEqual(rollDaily(few, words, TODAY + d).daily.kind, 'fresh');
});

test('rollDaily：fresh の goal は settings.fresh の2倍', () => {
  const p = {...emptyProgress(), settings: {fresh: 6}};
  for (let d = 0; d < 6; d++) {
    const daily = rollDaily(p, words, TODAY + d).daily;
    if (daily.kind === 'fresh') assert.equal(daily.goal, 12);
  }
  const kinds = new Set([0, 1, 2].map(d => rollDaily(p, words, 30000 + d).daily.kind));
  assert.ok(kinds.has('fresh'));
});

test('連続日数：初回・同日・翌日・2日空き・未回答だけ', () => {
  let r = run(emptyProgress(), [entry('clean')]);
  assert.deepEqual(r.progress.streak, {count: 1, last: TODAY, best: 1});
  assert.equal(r.streakUp, true);
  r = run(r.progress, [entry('clean')]);
  assert.deepEqual(r.progress.streak, {count: 1, last: TODAY, best: 1});
  assert.equal(r.streakUp, false, '同日は動かない');
  r = run(r.progress, [entry('hint')], false, TODAY + 1);
  assert.deepEqual(r.progress.streak, {count: 2, last: TODAY + 1, best: 2});
  assert.equal(r.streakUp, true);
  const onlyMissed = run(r.progress, [entry('missed')], true, TODAY + 2);
  assert.deepEqual(onlyMissed.progress.streak, r.progress.streak);
  assert.equal(onlyMissed.streakUp, false);
  const gap = run(r.progress, [entry('clean')], false, TODAY + 4);
  assert.deepEqual(gap.progress.streak, {count: 1, last: TODAY + 4, best: 2}, '切れても最長は残る');
  const retreat = run(emptyProgress(), [entry('clean'), entry('missed')], true);
  assert.equal(retreat.progress.streak.count, 1, '撤退でも1語答えていれば動く');
});

test('streakNow：昨日までなら count、それより前なら0', () => {
  const streak = {count: 5, last: TODAY, best: 9};
  assert.equal(streakNow(streak, TODAY), 5);
  assert.equal(streakNow(streak, TODAY + 1), 5);
  assert.equal(streakNow(streak, TODAY + 2), 0);
  assert.equal(streakNow({count: 0, last: 0, best: 0}, TODAY), 0);
});

test('DAILY_TEXT：種類ごとの文面', () => {
  assert.equal(DAILY_TEXT({kind: 'revenge', goal: 8}), '戻ってきた紙魚を8体倒す');
  assert.equal(DAILY_TEXT({kind: 'fresh', goal: 12}), '新しい言葉を12語見つける');
  assert.equal(DAILY_TEXT({kind: 'clean', goal: 10}), 'ヒントなしで10語答える');
  assert.equal(DAILY_TEXT({kind: 'finish', goal: 2}), '配達を2回やりとげる');
});

 test('依頼達成日は一度だけ保存し、直近14日より古い日を落とす',()=>{
 const p=withDaily('clean',1,0,{dailyDays:[TODAY-20,TODAY-13,TODAY-1]});
 const r=run(p,[entry('clean')]);
 assert.deepEqual(r.progress.dailyDays,[TODAY-13,TODAY-1,TODAY]);
 assert.deepEqual(run(r.progress,[entry('clean')]).progress.dailyDays,r.progress.dailyDays);
 assert.deepEqual(p.dailyDays,[TODAY-20,TODAY-13,TODAY-1]);
 assert.deepEqual(run(withDaily('clean',2),[entry('clean')]).progress.dailyDays,[]);
 });
