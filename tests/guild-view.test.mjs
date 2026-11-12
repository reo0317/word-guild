import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {ensureDefs, helpButton} from '../products/word-guild/guild/dom.mjs';
import {charaDefs} from '../products/word-guild/guild/chara-svg.mjs';

test('共有定義は画面の入れ替えから独立し、繰り返し要求しても一つ', () => {
  const previous = globalThis.document;
  const holders = [];
  globalThis.document = {
    getElementById: id => holders.find(node => node.id === id),
    createElement: () => ({setAttribute() {}}),
    body: {append: node => holders.push(node)},
  };
  try {
    for (let i = 0; i < 12; i++) {
      ensureDefs(charaDefs());
      ensureDefs(charaDefs('https://example.test/game/'));
    }
    assert.equal(holders.length, 1);
    assert.equal((holders[0].innerHTML.match(/id="cg-shadow"/g) ?? []).length, 1);
  } finally { globalThis.document = previous; }
});

test('切手帳は画面内に共有定義を重複挿入しない', async () => {
  const source = await readFile(new URL('../products/word-guild/guild/album.mjs', import.meta.url), 'utf8');
  assert.doesNotMatch(source, /\$\{charaDefs\(/);
  assert.match(source, /ensureDefs\(charaDefs\(deps.base \?\? BASE\)\)/);
});

test('お手伝いは個別の線画と名前を持つ通常のボタン', () => {
  for (const [kind, label] of [['hint', 'ヒント'], ['teach', 'おしえて']]) {
    const html = helpButton(kind);
    assert.match(html, new RegExp(`id="gq-${kind}"`));
    assert.ok(html.includes(label));
    assert.match(html, /type="button"/);
    assert.match(html, /aria-hidden="true"/);
    assert.doesNotMatch(html, /polygon|gq-wax/);
  }
  assert.notEqual(helpButton('hint'), helpButton('teach'));
});
