import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {checkRareData, checkRareBoards, loadRareInputs} from '../tools/build-rare.mjs';
import {checkPostscript} from '../tools/story-check.mjs';
import {parseLine, inflects} from '../products/word-guild/guild/story.mjs';
const json = name => JSON.parse(readFileSync(new URL(`../products/word-guild/data/${name}.json`, import.meta.url), 'utf8'));
const rare = json('rare'), ps = json('story-ps'), allow = json('story-allow');
const {words, chara, source} = loadRareInputs();
test('まれびと280語の id・棚・NGSL順位・綴り・必須欄と例句', () => {
  const result = checkRareData(rare, words, source, chara);
  assert.deepEqual(result.issues, []);
  assert.equal(result.warnings.length, rare.filter(w => !chara[w.id]).length);
  for (const w of rare) assert.equal(typeof chara[w.id], 'string');
});
test('全280語の1語盤面が種1〜300で生成できる', () => checkRareBoards(rare));
test('追伸56行の括弧順id・担当5語・語数・許可語', () => {
  assert.deepEqual(checkPostscript(ps, rare, words, allow).issues, []);
  for (const p of ps) {
    const parts = parseLine(p.en).filter(p => p.type === 'word');
    p.ids.forEach((id,i) => assert.ok(inflects(rare.find(w => w.id === id).w, parts[i].text)));
  }
});
test('検査は重複綴り・空例句・順位違いを拒否し、空分類は警告にする', () => {
  const changed = structuredClone(rare);
  changed[1].w = changed[0].w;
  changed[2].ex = '';
  changed[3].rank = -1;
  const result = checkRareData(changed, words, source, {});
  assert.ok(result.issues.some(x => x.includes('重複')));
  assert.ok(result.issues.some(x => x.includes('ex が空')));
  assert.ok(result.issues.some(x => x.includes('順位')));
  assert.equal(result.warnings.length, 280);
});
test('追伸検査はid順の誤り・未許可語・対象語不足・不正括弧を拒否する', () => {
  for (const mutate of [
    p => p.ids.reverse(),
    p => {p.en += ' zzzunapproved';},
    p => {p.en = p.en.replace(/\{[^}]+\}/u, '');},
    p => {p.en += '{';},
  ]) {
    const changed = structuredClone(ps);
    mutate(changed[0]);
    assert.ok(checkPostscript(changed, rare, words, allow).issues.length);
  }
});
