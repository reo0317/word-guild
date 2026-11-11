import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {validateWords} from '../products/word-guild/guild/words.mjs';
import {spelling} from '../products/word-guild/guild/board.mjs';

const words = JSON.parse(await readFile(new URL('../products/word-guild/data/words.json', import.meta.url), 'utf8'));
const BASIC = 150;
const TSL = 1250;
const pad = n => String(n).padStart(4, '0');
const basic = words.slice(0, BASIC);
const tsl = words.slice(BASIC);

test('語彙は1,400語：基本語150（b）のあとに TSL 1,250語（t）が続く', () => {
  assert.equal(words.length, BASIC + TSL);
  assert.deepEqual(basic.map(w => w.id), Array.from({length: BASIC}, (_, i) => `b${pad(i + 1)}`));
  assert.deepEqual(tsl.map(w => w.id), Array.from({length: TSL}, (_, i) => `t${pad(i + 1)}`));
});

test('必須項目（w・ja・pos・ex・exJa）がそろっていて、rank は整数', () => {
  for (const word of words) {
    for (const key of ['w', 'ja', 'ex', 'exJa']) {
      assert.equal(typeof word[key], 'string', `${word.id}.${key}`);
      assert.ok(word[key].trim().length > 0, `${word.id}.${key} が空`);
    }
    assert.ok(['n', 'v', 'a', 'o'].includes(word.pos), `${word.id} の品詞`);
    assert.ok(Number.isInteger(word.rank) && word.rank > 0, `${word.id} の rank`);
  }
});

test('TSL の rank は id の番号と同じ、基本語の rank は小さい順', () => {
  for (const word of tsl) assert.equal(word.rank, Number(word.id.slice(1)), word.id);
  for (let i = 1; i < basic.length; i++) assert.ok(basic[i].rank > basic[i - 1].rank, basic[i].id);
});

test('ja は全角10文字以内で、重複がない', () => {
  for (const word of words) assert.ok([...word.ja].length <= 10, `${word.id} の訳「${word.ja}」は10文字以内`);
  const seen = new Map();
  for (const word of words) {
    assert.ok(!seen.has(word.ja), `ja「${word.ja}」が ${seen.get(word.ja)} と ${word.id} で重複`);
    seen.set(word.ja, word.id);
  }
});

// 原本の TSL に résumé（名詞）と resume（動詞）が別の見出しで入っていて、盤面の綴りが重なる。
// data/ は D7 では直さないので、この1組だけ既知の例外にしている。直したら下の一覧を空にする（空でないと失敗する）。
const KNOWN_SPELLING_CLASHES = ['t0026:t1007'];

test('盤面の綴りは英小文字のみ2〜17文字で、重複がない（既知の1組を除く）', () => {
  const seen = new Map();
  const clashes = [];
  for (const word of words) {
    const text = spelling(word.w);
    assert.match(text, /^[a-z]{2,17}$/, `${word.id} ${word.w}`);
    if (seen.has(text)) clashes.push(`${seen.get(text)}:${word.id}`);
    else seen.set(text, word.id);
  }
  assert.deepEqual(clashes, KNOWN_SPELLING_CLASHES);
});

test('13文字以上の語は38語（1語だけの盤面になる）', () => {
  assert.equal(words.filter(w => spelling(w.w).length >= 13).length, 38);
});

test('章と棚：基本語は章1・棚1〜6、TSL は250語ずつ章2〜6・棚7〜56、棚は25語ずつ', () => {
  basic.forEach((word, i) => {
    assert.deepEqual([word.ch, word.shelf], [1, 1 + Math.floor(i / 25)], word.id);
  });
  tsl.forEach((word, i) => {
    assert.deepEqual([word.ch, word.shelf], [2 + Math.floor(i / 250), 7 + Math.floor(i / 25)], word.id);
  });
  const sizes = new Map();
  for (const word of words) sizes.set(word.shelf, (sizes.get(word.shelf) ?? 0) + 1);
  assert.equal(sizes.size, 56);
  assert.ok([...sizes.values()].every(size => size === 25));
});

test('ex は見出し語 w を含む（大文字小文字は区別しない）', () => {
  for (const word of words) {
    assert.ok(word.ex.toLowerCase().includes(word.w.toLowerCase()), `${word.id}: 「${word.ex}」に ${word.w} がない`);
  }
});

test('validateWords は形の違うデータを拒否する', () => {
  assert.equal(validateWords(words).length, 1400);
  assert.throws(() => validateWords({}));
  assert.throws(() => validateWords(words.slice(0, 5)));
  assert.equal(validateWords([...words, {id: 1}, null]).length, 1400);
  assert.equal(validateWords([...words, {...words[0], id: 'x', ch: '1'}, {...words[0], id: 'y', ch: 1.5}, {...words[0], id: 'z', ch: undefined}]).length, 1400, 'ch が整数でない語は捨てる');
});
