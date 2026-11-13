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

test('再戦のヒント・おしえては通常と同じ逃走で、切手を作らない', () => {
  for (const hint of [1, 2]) {
    const classes = new Set();
    const mon = {classList: {remove() {}, add: (...names) => names.forEach(n => classes.add(n))},
      insertAdjacentHTML() { throw Error('切手やしぶきを生成した'); }};
    viewFunction('resolveMon', {quest: {isRevenge: true}, monOf: () => mon,
      stampHtml: () => { throw Error('再戦で切手を生成した'); }})({word: {id: 'test'}, hint});
    assert.deepEqual([...classes], ['solved', 'fled']);
  }
});

test('再戦のヒントなし正解も切手数に加え、手紙の行を表示し、切手を飛ばす', () => {
  const quest = {isRevenge: true, restoredIds: new Set(['a'])};
  assert.equal(viewFunction('stampCount', {quest})(), 1);
  quest.restoredIds.add('b');
  assert.equal(viewFunction('stampCount', {quest})(), 2);
  const band = {classList: {remove() {}, add() {}}};
  viewFunction('showClip', {$: () => band, story: {letters: [{}]}, clipParts: () => ({left: '', word: 'book', right: ''}),
    clipSeq: 0, reducedMotion: () => true, esc: s => s, later() {}})('a');
  assert.match(band.innerHTML, /s-ink/);
  assert.equal(band.hidden, false);
  let flown = false;
  const element = {getBoundingClientRect: () => ({x: 0, y: 0, width: 1, height: 1}), animate() { flown = true; }};
  viewFunction('flyStamps', {$: () => element, reducedMotion: () => false, view: {querySelectorAll: () => [element]}})();
  assert.equal(flown, true);
});

test('通常と再戦のヒントなし撃破は切手、通常のヒント使用は逃走', () => {
  for (const [isRevenge, hint] of [[false, 0], [false, 1], [true, 0]]) {
    const classes = [];
    let state;
    const mon = {classList: {remove() {}, add: (...names) => classes.push(...names)}, insertAdjacentHTML() {}};
    viewFunction('resolveMon', {quest: {isRevenge}, monOf: () => mon, specFor: () => ({}),
      stampHtml: (_, __, options) => { state = options.state; return '<button>'; }})({word: {id: 'a'}, hint});
    assert.ok(classes.includes(hint ? 'fled' : 'stamped'));
    assert.equal(state, hint ? undefined : 'print');
  }
});

const {deliveryLetter, deliveryLineLights, lampRing} = await import('../products/word-guild/guild/dom.mjs');
const ringLetter = {shelf: 1, lines: [['a', 'b'], ['c'], ['d'], ['e'], ['f']].map(ids => ({ids}))};
test('手紙の弧は順番によらず、その行の全語が restored になった時だけ灯る', () => {
  const progress = {words: {a: {restored: true}, b: {box: 5, restored: false}, c: {box: 1}, e: {restored: true}}};
  const before = deliveryLineLights(ringLetter, progress);
  assert.deepEqual(before, [false, true, false, true, false]);
  assert.deepEqual(deliveryLineLights(ringLetter, progress, new Set(['b', 'd'])), [true, true, true, true, false]);
  assert.deepEqual(deliveryLineLights(ringLetter, progress), before); // ヒント・逃走は追加しない
  const html = lampRing(before);
  assert.equal((html.match(/stroke="var\(--lamp\)"/g) ?? []).length, 2);
  assert.equal((html.match(/<path /g) ?? []).length, 5);
  assert.equal((lampRing(2).match(/stroke="var\(--lamp\)"/g) ?? []).length, 2);
});
test('配達の通は新出語が多い街灯。再配達・夜も元の組から選び、英文が無ければ隠す', () => {
  const other = {shelf: 2, lines: ringLetter.lines};
  const story = {letters: [ringLetter, other]};
  const groups = [[{id: 'a', shelf: 1}, {id: 'b', shelf: 1}], [{id: 'c', shelf: 2}]];
  const progress = {words: {a: {restored: true}, b: {restored: true}}};
  assert.equal(deliveryLetter(story, groups, progress), other);
  assert.equal(deliveryLetter(story, groups, {words: {}}), ringLetter);
  assert.equal(deliveryLetter(story, [groups[0]], progress), ringLetter);
  assert.equal(deliveryLetter({letters: [ringLetter]}, groups, progress), null);
  assert.equal(deliveryLetter(story, [[{id: 'rare', shelf: 99}]], progress), null);
  assert.deepEqual(deliveryLineLights(null, progress), [false, false, false, false, false]);
});
test('行が完成した時だけ音と短い点灯演出。reduced-motion では即時点灯', () => {
  for (const reduced of [false, true]) {
    const paths = Array.from({length: 5}, () => ({classList: {add(name) { this.added = name; }}}));
    const ring = {firstElementChild: {}, setAttribute() {}, querySelectorAll: () => paths};
    let sounds = 0;
    const quest = {startProgress: {words: {}}, restoredIds: new Set(['c'])};
    const paint = viewFunction('paintDeliveryRing', {$: () => ring, currentLetter: ringLetter,
      lineLights: [false, false, false, false, false], deliveryLineLights, quest, lampRing,
      reducedMotion: () => reduced, sfx: name => { assert.equal(name, 'lamp'); sounds++; }});
    paint(); paint();
    assert.equal(sounds, 1);
    assert.equal(paths[1].classList.added, reduced ? undefined : 'just-lit');
    assert.equal(paths[0].classList.added, undefined);
    assert.equal(ring.hidden, false);
  }
});
