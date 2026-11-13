import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile, stat} from 'node:fs/promises';
import {HOUSE_ART} from '../products/word-guild/guild/art.mjs';
import {renderMap} from '../products/word-guild/guild/map.mjs';
import {buildMap} from '../products/word-guild/guild/stages.mjs';

const words = JSON.parse(await readFile(new URL('../products/word-guild/data/words.json', import.meta.url)));

test('56軒すべての宛先に実在する絵がある', async () => {
  assert.equal(Object.keys(HOUSE_ART).length, 56);
  for (let shelf = 1; shelf <= 56; shelf++) {
    assert.equal(HOUSE_ART[shelf], `art/house-${shelf}.webp`);
    assert.ok((await stat(new URL(`../products/word-guild/${HOUSE_ART[shelf]}`, import.meta.url))).size > 0);
  }
});

test('家は左右交互で、霧・5段階の色・完成・点灯・金を進捗から描き、手紙を開く', () => {
  const progress = {words: {}, gates: []};
  for (const word of words) {
    const i = words.filter(w => w.shelf === word.shelf).indexOf(word);
    const counts = {1:25, 2:25, 3:25, 4:1, 5:6, 6:11, 7:16, 8:21};
    if (i < (counts[word.shelf] ?? 0)) progress.words[word.id] = {box: word.shelf === 1 ? 5 : word.shelf === 2 ? 3 : 1, due:99999};
  }
  const before = JSON.stringify(progress);
  const buttons = [];
  const node = {style:{}, clientWidth:0, addEventListener(){}, setAttribute(){}};
  const view = {
    innerHTML:'',
    querySelector: () => ({...node}),
    querySelectorAll(selector) {
      if (selector === 'button[data-shelf]') {
        for (const match of this.innerHTML.matchAll(/<button[^>]*data-shelf="(\d+)"[^>]*>/g)) buttons.push({dataset:{shelf:match[1]}});
        return buttons;
      }
      return [];
    },
  };
  const old = globalThis.requestAnimationFrame;
  globalThis.requestAnimationFrame = () => 1;
  let opened;
  try {
    renderMap(view, {map:buildMap(words,progress,20000),today:20000,progress,total:1400,face:()=>'',tsumugi:'',letterOf:()=>({}),on:{lamp:s=>{opened=s;}}});
  } finally {globalThis.requestAnimationFrame=old;}
  const houses = [...view.innerHTML.matchAll(/class="gq-house ([^"]*)"\s+data-shelf="(\d+)"[^>]*style="--reveal:(\d+)%"/g)];
  assert.equal(houses.length,56);
  assert.match(houses[0][1], /left complete lit gold/);
  assert.equal(houses[1][1], 'right complete lit');
  assert.equal(houses[2][1], 'left complete');
  assert.deepEqual(houses.slice(3,9).map(h=>Number(h[3])),[80,60,40,20,0,100]);
  assert.doesNotMatch(view.innerHTML, /class="gq-house-color"[^>]*\ssrc=/);
  buttons.find(b=>b.dataset.shelf==='3').onclick();
  assert.equal(opened,3);
  assert.equal(JSON.stringify(progress),before);
});
