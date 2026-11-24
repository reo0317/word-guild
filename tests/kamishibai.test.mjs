import assert from 'node:assert/strict';
import { readFileSync, statSync } from 'node:fs';
import { test } from 'node:test';
import { partActs, propActs, propNames } from '../products/word-guild/guild/kamishibai.mjs';

const product = new URL('../products/word-guild/', import.meta.url);
const readData = name => JSON.parse(readFileSync(new URL(`data/${name}.json`, product), 'utf8'));
const script = readData('kamishibai');
const { scenes } = readData('scenes');
const { letters } = readData('story');
const scenery = new Set(['post-front']);
const pendingArt = name => /^(shadow-(hatori|fuurou)-|tsumugi-(side-walk|back|read|surprise|ask|worry)$|hatori-(side|cap|give|stern)$|fuurou-(hoot|side|fly)$)/.test(name);
const saneTime = time => Number.isInteger(time) && time >= 0 && time <= 60_000;
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
  for (const group of [script.scenes, script.letters]) {
    for (const cards of Object.values(group)) {
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
  }
});

test('kamishibai actions and pose changes have valid names and timing', () => {
  for (const cards of [...Object.values(script.scenes), ...Object.values(script.letters)]) {
    for (const { parts = [], props = [] } of cards) {
      for (const layer of [...parts, ...props]) {
        const { art, prop, act, delay, pose, poseAt } = layer;
        if (act !== undefined) assert.ok((prop ? propActs : partActs).includes(act), act);
        if (delay !== undefined) assert.ok(saneTime(delay), `Invalid delay for ${art ?? prop}`);
        if (pose === undefined && poseAt === undefined) continue;
        assert.ok(!prop && Array.isArray(pose) && pose.length > 0, art ?? prop);
        for (const name of pose) {
          assert.ok(typeof name === 'string' && Object.hasOwn(script.sizes, name), `No pose size for ${name}`);
        }
        assert.ok(Array.isArray(poseAt) && poseAt.length === pose.length - 1, art);
        for (const [index, time] of poseAt.entries()) {
          assert.ok(saneTime(time) && time > (poseAt[index - 1] ?? -1), `Invalid pose time for ${art}`);
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
