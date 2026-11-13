import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile, stat} from 'node:fs/promises';
import {HOUSE_ART} from '../products/word-guild/guild/art.mjs';
import {renderMap, houseGeometry, roadGeometry} from '../products/word-guild/guild/map.mjs';
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


test('道は奥ほど細く小さくくねり、下端で画面幅を覆う。家と節は同じ中心に並ぶ', () => {
  const bottom = (1 - 0.14) / (0.8 - 0.14);
  for (const width of [320, 390, 430]) {
    let lastHalf = 0, lastSwing = 0;
    for (let scale = 0.07; scale <= bottom; scale += 0.01) {
      const road = roadGeometry(width, scale, 0.5);
      assert.ok(road.half > lastHalf);
      assert.ok(road.x - width / 2 > lastSwing);
      lastHalf = road.half; lastSwing = road.x - width / 2;
      for (const lat of [-0.5, 0, 0.5]) {
        for (const current of [false, true]) {
          const {x, size, offset} = houseGeometry(width, scale, lat, current);
          assert.equal(x, roadGeometry(width, scale, lat).x);
          assert.ok(size >= 0 && size <= 140);
          if (size >= 24) {
            assert.ok(x - offset - size >= 8 - 1e-9);
            assert.ok(x + offset + size <= width - 8 + 1e-9);
          }
          assert.equal(offset, roadGeometry(width, scale, lat).half + 8);
        }
      }
    }
    for (const lat of [-0.5, 0, 0.5]) {
      const {x, half} = roadGeometry(width, bottom, lat);
      assert.ok(x - half <= 1e-9);
      assert.ok(x + half >= width - 1e-9);
    }
  }
});

test('家の境目は24%のグラデーションで、未配達と全着色は端まで描き分ける', async () => {
  const css = await readFile(new URL('../products/word-guild/map.css', import.meta.url), 'utf8');
  assert.match(css, /-webkit-mask-image:linear-gradient\(to bottom,transparent calc\(var\(--reveal\) - 12%\),#000 calc\(var\(--reveal\) \+ 12%\)\)/);
  assert.match(css, /\[data-reveal="0"\] .gq-house-color\{visibility:hidden\}/);
  assert.match(css, /\[data-reveal="100"\] .gq-house-color\{-webkit-mask-image:none;mask-image:none\}/);
  assert.doesNotMatch(css, /(?:^|[;{])\s*filter\s*:/);
  assert.match(css, /\.gq-road-svg path\{animation:none;transition:none;transform:none\}/);
});
