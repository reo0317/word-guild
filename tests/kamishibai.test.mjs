import assert from 'node:assert/strict';
import { readFileSync, statSync } from 'node:fs';
import { test } from 'node:test';
import { playKamishibai, propNames } from '../products/word-guild/guild/kamishibai.mjs';

const product = new URL('../products/word-guild/', import.meta.url);
const readData = name => JSON.parse(readFileSync(new URL(`data/${name}.json`, product), 'utf8'));
const script = readData('kamishibai');
const { scenes } = readData('scenes');
const { letters } = readData('story');
const scenery = new Set(['post-front']);
const pendingArt = name => /^(tsumugi-(side-walk|back|read|surprise|ask|worry)$|hatori-(side|cap|give|stern)$|fuurou-(hoot|side|fly)$)/.test(name);
const artFile = name => new URL(`art/${name}.webp`, product);

test('kamishibai character art has a normal height and alpha bounds', () => {
  for (const [name, size] of Object.entries(script.sizes)) {
    assert.ok(Number.isFinite(size) && size > 0 && size <= 100, name);
    const file = statSync(artFile(name), { throwIfNoEntry: false });
    if (!file && pendingArt(name)) continue;
    assert.ok(file?.isFile(), name);
    const { height, bottom } = script.trim[name] ?? {};
    assert.ok(height > 0 && height <= 1 && bottom >= 0 && height + bottom <= 1, name);
  }
});

test('kamishibai cards reference existing backgrounds, character art and SVG props', () => {
  assert.equal(script.v, 1);
  const player = readFileSync(new URL('guild/kamishibai.mjs', product), 'utf8');
  assert.doesNotMatch(player, /art\/word\/|wordart/);
  for (const cards of Object.values(script.scenes)) {
    for (const { bg, parts, props } of cards) {
      if (bg !== undefined) {
        assert.doesNotMatch(artFile(bg).pathname, /\/art\/word\//);
        assert.ok(statSync(artFile(bg)).isFile(), bg);
      }
      for (const part of parts ?? []) {
        const { art, depth, why } = part;
        assert.doesNotMatch(artFile(art).pathname, /\/art\/word\//);
        if (scenery.has(art)) {
          assert.ok(statSync(artFile(art)).isFile(), art);
          assert.ok(Number.isFinite(part.h), art);
          assert.equal(depth, undefined, art);
          continue;
        }
        assert.ok(Object.hasOwn(script.sizes, art), `No size for ${art}`);
        assert.ok(!Object.hasOwn(part, 'h'), `Remove h from ${art}`);
        if (depth !== undefined) {
          assert.ok(Number.isFinite(depth) && depth >= 0.4 && depth <= 1, art);
          assert.ok(typeof why === 'string' && why.trim(), `Explain depth for ${art}`);
        }
      }
      for (const { prop, word } of props ?? []) {
        assert.ok(propNames.includes(prop), `Unknown SVG prop "${prop}"`);
        assert.equal(word, undefined, 'Use prop names for SVG placements');
      }
    }
  }
});

test('kamishibai scene cards match scene lines', () => {
  assert.equal(script.scenes[1].length, 3);
  for (const [shelf, cards] of Object.entries(script.scenes)) {
    const scene = scenes.find(entry => entry.shelf === Number(shelf));
    assert.ok(scene, `No scene for shelf ${shelf}`);
    assert.equal(cards.length, scene.lines.length);
  }
});

test('kamishibai letter pictures and captions follow the full letter in order', () => {
  assert.equal(script.letters[1].length, 11);
  const normalize = text => text.replace(/\s+/g, ' ').trim();
  for (const [shelf, cards] of Object.entries(script.letters)) {
    const letter = letters[Number(shelf) - 1];
    assert.ok(letter, `No letter ${shelf}`);
    for (const [index, { pic, text }] of cards.entries()) {
      const number = value => String(value).padStart(2, '0');
      assert.equal(pic, `kami/letter-${number(shelf)}/${number(index + 1)}`);
      assert.ok(typeof text === 'string' && text.trim());
      const file = statSync(artFile(pic), { throwIfNoEntry: false });
      if (file) assert.ok(file.isFile(), pic);
    }
    assert.equal(
      normalize(cards.map(card => card.text).join(' ')),
      normalize(letter.lines.map(line => line.en).join(' '))
    );
  }
});

test('kamishibai taps and keys switch cards immediately', async t => {
  class Element extends EventTarget {
    children = [];
    append(...children) { this.children.push(...children); }
    replaceChildren(...children) { this.children = children; }
    contains(element) { return this === element || this.children.includes(element); }
    setAttribute() {}
    focus() {}
    getBoundingClientRect() { return { left: 16, width: 358 }; }
    showModal() { this.open = true; }
    close() {
      this.open = false;
      this.dispatchEvent(new Event('close'));
    }
    remove() {}
  }

  const document = { createElement: () => new Element() };
  Object.defineProperty(globalThis, 'document', { value: document, configurable: true });
  t.after(() => { delete globalThis.document; });

  const container = new Element();
  const closed = playKamishibai(container, {
    cards: ['First', 'Second', 'Last'].map(caption => ({ caption }))
  });
  const [dialog] = container.children;
  const [, panel] = dialog.children;
  const [, figure] = panel.children;
  const [frame, caption] = figure.children;
  await new Promise(setImmediate);

  function tap(target, clientX) {
    const click = Object.assign(new Event('click'), { clientX, detail: 1 });
    Object.defineProperty(click, 'target', { value: target });
    figure.dispatchEvent(click);
  }

  function key(key) {
    dialog.dispatchEvent(Object.assign(new Event('keydown', { cancelable: true }), { key }));
  }

  assert.equal(frame.children[1].className, 'kami-tap');
  tap(frame, 20);
  assert.equal(caption.textContent, 'Second');
  assert.equal(frame.children.length, 1);
  tap(frame, 20);
  assert.equal(caption.textContent, 'First');
  assert.equal(frame.children[1].className, 'kami-tap');
  tap(caption, 20);
  assert.equal(caption.textContent, 'Second');
  key('ArrowLeft');
  assert.equal(caption.textContent, 'First');
  key('Enter');
  assert.equal(caption.textContent, 'Second');
  key('ArrowRight');
  assert.equal(caption.textContent, 'Last');
  tap(frame, 20);
  assert.equal(dialog.open, false);
  await closed;
});
