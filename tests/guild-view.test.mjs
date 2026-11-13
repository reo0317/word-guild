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

const viewSource = await readFile(new URL('../products/word-guild/guild/view.mjs', import.meta.url), 'utf8');
function viewFunction(name, deps) {
  const start = viewSource.indexOf(`  function ${name}(`);
  const end = viewSource.indexOf('\n  }', start) + 4;
  return Function(...Object.keys(deps), `return (${viewSource.slice(start, end)});`)(...Object.values(deps));
}

test('再戦の撃破はヒントの有無によらず切手を作らず、700msで消える。動きを減らす場合は即消える', () => {
  for (const hint of [0, 1]) for (const still of [false, true]) {
    const classes = new Set();
    const mon = {classList: {remove() {}, add: (...names) => names.forEach(n => classes.add(n))},
      insertAdjacentHTML: (_, html) => { mon.html = html; }};
    const timers = [];
    const resolve = viewFunction('resolveMon', {quest: {isRevenge: true}, monOf: () => mon,
      reducedMotion: () => still, later: (ms, run) => timers.push({ms, run}),
      stampHtml: () => { throw Error('再戦で切手を生成した'); }});
    resolve({word: {id: 'test'}, hint});
    assert.ok(classes.has('dissolved'));
    assert.ok(!classes.has('stamped') && !classes.has('fled'));
    if (still) { assert.equal(mon.hidden, true); assert.equal(mon.html, undefined); }
    else {
      assert.match(mon.html, /gq-ink-burst/);
      assert.equal((mon.html.match(/<i /g) ?? []).length, 8);
      assert.equal(timers[0].ms, 700);
      timers[0].run();
      assert.equal(mon.hidden, true);
    }
  }
});

test('再戦では手紙の行を表示せず、切手数は増えず、切手も飛ばない', () => {
  const quest = {isRevenge: true, results: new Map([['a', 'clean'], ['b', 'hint']])};
  const unexpected = () => { throw Error('再戦で表示処理が走った'); };
  assert.equal(viewFunction('stampCount', {quest})(), 1);
  viewFunction('showClip', {quest, $: unexpected})('a');
  viewFunction('showClip', {quest, $: () => null})('a', true);
  viewFunction('flyStamps', {quest, $: () => ({}), view: {querySelectorAll: unexpected}})();
  quest.isRevenge = false;
  assert.equal(viewFunction('stampCount', {quest})(), 1);
});

test('通常の撃破は本刷り切手、ヒント使用時は逃走のまま', () => {
  for (const hint of [0, 1]) {
    const classes = [];
    let state;
    const mon = {classList: {remove() {}, add: (...names) => classes.push(...names)}, insertAdjacentHTML() {}};
    viewFunction('resolveMon', {quest: {isRevenge: false}, monOf: () => mon, specFor: () => ({}),
      stampHtml: (_, __, options) => { state = options.state; return '<button>'; }})({word: {id: 'a'}, hint});
    assert.ok(classes.includes(hint ? 'fled' : 'stamped'));
    assert.equal(state, hint ? undefined : 'print');
  }
});
