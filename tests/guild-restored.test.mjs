import test from 'node:test';
import assert from 'node:assert/strict';
import {Quest} from '../products/word-guild/guild/quest.mjs';
import {emptyProgress, serializeProgress, validateProgress, exportText, importText} from '../products/word-guild/guild/store.mjs';
import {isRestored, grade, pickSession} from '../products/word-guild/guild/srs.mjs';
import {letterView} from '../products/word-guild/guild/story.mjs';
import {buildMap} from '../products/word-guild/guild/stages.mjs';
import {pageProgress} from '../products/word-guild/guild/album.mjs';

const word = {id: 'a', w: 'book', ja: '本', shelf: 1, ch: 1};
function delivery(progress, firstHint, retry) {
  const q = new Quest([[word]], {progress, today: 10, rand: () => 0.4});
  q.next();
  if (firstHint) q.applyHint('a', firstHint);
  q.answer('book');
  assert.equal(q.restoredIds.has('a'), firstHint === 0);
  q.next();
  if (q.isRevenge && q.phase !== 'finished') {
    q.next();
    if (retry === null) q.finish(true);
    else {
      if (retry) q.applyHint('a', retry);
      q.answer('book');
      q.next();
    }
  }
  return q;
}

test('ヒント・おしえて後は再戦の無援助正解だけが語を戻す。採点は初回のまま', () => {
  for (const hint of [1, 2]) for (const retry of [null, 0, 1, 2]) {
    const q = delivery(emptyProgress(), hint, retry);
    const saved = q.progress.words.a;
    assert.equal(saved.restored, retry === 0);
    assert.deepEqual(saved, {...grade(undefined, hint === 1 ? 'hint' : 'taught', 10), restored: retry === 0});
    assert.equal(q.outcome.entries[0].stamped, retry === 0);
    assert.equal(q.outcome.entries[0].result, hint === 1 ? 'hint' : 'taught');
    const loaded = validateProgress(serializeProgress(q.progress));
    assert.equal(loaded.words.a.restored, retry === 0);
    assert.deepEqual(importText(exportText(q.progress)).progress, loaded);
    if (retry !== 0) {
      assert.equal(pickSession([word], loaded, 10).flat()[0].id, 'a');
      assert.equal(delivery(loaded, 0, null).progress.words.a.restored, true);
    }
  }
});

test('古い保存は復元済みで、再びヒントを使っても戻った語を失わない', () => {
  const p = validateProgress({v: 1, words: {a: [3, 10, 2]}});
  assert.equal(isRestored(p.words.a), true);
  assert.equal(delivery(p, 1, null).progress.words.a.restored, true);
  assert.equal(isRestored(undefined), false);
});

test('25語の復元で手紙・街灯・石段・切手帳が完成する。習熟度だけでは完成しない', () => {
  const words = Array.from({length: 25}, (_, i) => ({...word, id: `w${i}`}));
  const story = {letters: [{shelf: 1, lines: Array.from({length: 5}, (_, i) => ({
    en: '{book} {book} {book} {book} {book}', ids: words.slice(i * 5, i * 5 + 5).map(w => w.id),
  }))}]};
  const progress = emptyProgress();
  for (const w of words) progress.words[w.id] = {box: 5, due: 20, seen: 1, restored: true};
  progress.words.w0.restored = false;
  assert.equal(letterView(story, words, progress, 1, 10).readable, false);
  const map = buildMap(words, progress, 10);
  assert.equal(map.here.step, 1);
  assert.equal(map.wards[0].lamps[0].got, 24);
  assert.equal(map.wards[0].lamps[0].lit, 24);
  assert.equal(map.wards[0].gate, 'hidden');
  assert.equal(pageProgress({words}, progress).got, 24);
  assert.equal(pageProgress({words}, progress).complete, false);
  progress.words.w0.restored = true;
  assert.equal(letterView(story, words, progress, 1, 10).readable, true);
  assert.equal(buildMap(words, progress, 10).wards[0].gate, 'open');
  assert.equal(pageProgress({words}, progress).got, 25);
});
