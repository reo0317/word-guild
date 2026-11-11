import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {validateWords} from '../products/word-guild/guild/words.mjs';

const words = JSON.parse(await readFile(new URL('../products/word-guild/data/words.json', import.meta.url), 'utf8'));

test('M1 の語彙は60語で、必須項目がそろっている', () => {
  assert.equal(words.length, 60);
  for (const word of words) {
    for (const key of ['id', 'w', 'ja', 'pos']) assert.equal(typeof word[key], 'string', `${word.id}.${key}`);
    assert.ok(['n', 'v', 'a', 'o'].includes(word.pos), `${word.id} の品詞`);
    assert.equal(word.ch, 1);
    assert.ok([1, 2, 3].includes(word.shelf));
    assert.ok(Number.isInteger(word.rank));
    assert.ok(word.ja.length >= 1 && word.ja.length <= 10, `${word.id} の訳は10文字以内`);
  }
});

test('id は b0001〜b0060 で重複なし、ja も重複なし', () => {
  assert.deepEqual(words.map(w => w.id), Array.from({length: 60}, (_, i) => `b${String(i + 1).padStart(4, '0')}`));
  assert.equal(new Set(words.map(w => w.ja)).size, 60);
  assert.equal(new Set(words.map(w => w.w)).size, 60);
});

test('綴りは英字のみ3〜6文字の小文字', () => {
  for (const word of words) assert.match(word.w, /^[a-z]{3,6}$/, word.id);
});

test('棚は20語ずつで、名詞・動詞・形容詞が混ざる', () => {
  for (const shelf of [1, 2, 3]) {
    const members = words.filter(w => w.shelf === shelf);
    assert.equal(members.length, 20);
    assert.deepEqual(new Set(members.map(w => w.pos)), new Set(['n', 'v', 'a']));
  }
});

test('validateWords は形の違うデータを拒否する', () => {
  assert.deepEqual(validateWords(words).length, 60);
  assert.throws(() => validateWords({}));
  assert.throws(() => validateWords(words.slice(0, 5)));
  assert.equal(validateWords([...words, {id: 1}, null]).length, 60);
  assert.equal(validateWords([...words, {...words[0], id: 'x', ch: '1'}, {...words[0], id: 'y', ch: 1.5}, {...words[0], id: 'z', ch: undefined}]).length, 60, 'ch が整数でない語は捨てる');
});
