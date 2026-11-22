import assert from 'node:assert/strict';
import { readFileSync, statSync } from 'node:fs';
import { test } from 'node:test';
import { propNames } from '../products/word-guild/guild/kamishibai.mjs';

const product = new URL('../products/word-guild/', import.meta.url);
const readData = name => JSON.parse(readFileSync(new URL(`data/${name}.json`, product), 'utf8'));
const script = readData('kamishibai');
const { scenes } = readData('scenes');
const { letters } = readData('story');

test('kamishibai cards reference existing backgrounds, character art and SVG props', () => {
  assert.equal(script.v, 1);
  const player = readFileSync(new URL('guild/kamishibai.mjs', product), 'utf8');
  assert.doesNotMatch(player, /art\/word\/|wordart/);
  for (const group of [script.scenes, script.letters]) {
    for (const cards of Object.values(group)) {
      for (const { bg, parts, props } of cards) {
        const names = (parts ?? []).map(part => part.art);
        if (bg !== undefined) names.push(bg);
        for (const name of names) {
          const url = new URL(`art/${name}.webp`, product);
          assert.doesNotMatch(url.pathname, /\/art\/word\//);
          assert.ok(statSync(url).isFile(), name);
        }
        for (const { prop, word } of props ?? []) {
          assert.ok(propNames.includes(prop), `Unknown SVG prop "${prop}"`);
          assert.equal(word, undefined, 'Use prop names for SVG placements');
        }
      }
    }
  }
});

test('kamishibai scripts match scene and letter lines', () => {
  assert.equal(script.scenes[1].length, 3);
  assert.ok(script.letters[1].length >= 4 && script.letters[1].length <= 5);
  for (const [shelf, cards] of Object.entries(script.scenes)) {
    const scene = scenes.find(entry => entry.shelf === Number(shelf));
    assert.ok(scene, `No scene for shelf ${shelf}`);
    assert.equal(cards.length, scene.lines.length);
  }
  for (const [shelf, cards] of Object.entries(script.letters)) {
    const letter = letters[Number(shelf) - 1];
    assert.ok(letter, `No letter ${shelf}`);
    for (const { line } of cards) {
      assert.ok(Array.isArray(line) && line.length > 0);
      for (const index of line) {
        assert.ok(Number.isInteger(index) && typeof letter.lines[index]?.en === 'string',
          `No English line ${index} in letter ${shelf}`);
      }
    }
  }
});
