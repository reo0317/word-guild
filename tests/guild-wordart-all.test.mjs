import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {charaSpec} from '../products/word-guild/guild/chara.mjs';
const load = async p => JSON.parse(await readFile(new URL(p, import.meta.url)));
test('1400語すべてが自分の単語の絵を使い、同じ絵を共有しない（c1-001-b 形式も受け付ける）', async () => {
  const words = await load('../products/word-guild/data/words.json');
  const art = await load('../products/word-guild/data/wordart.json');
  const specs = words.map(word => charaSpec(word, '', art));
  assert.equal(specs.filter(spec => !spec.wordart).length, 0);
  assert.equal(new Set(specs.map(spec => spec.wordart.g)).size, words.length);
});
