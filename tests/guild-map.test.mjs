import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile, stat} from 'node:fs/promises';
import {HOUSE_ART} from '../products/word-guild/guild/art.mjs';
import {renderMap, houseGeometry, projectRoad, A, L, W, f} from '../products/word-guild/guild/map.mjs';
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


test('一定幅の世界座標の道を投影すると遠いほど細くなる', () => {
  for (const width of [320, 390, 430]) {
    let previous = Infinity;
    for (let z = 0; z <= 10000; z += 10) {
      const p = projectRoad(width, 600, z);
      assert.ok(p.width < previous);
      assert.ok(Math.abs(p.width - width * f * W / p.z) < 1e-10);
      previous = p.width;
    }
  }
});

test('左右の手前の極値は大きく振れ、道の外縁が10%まで近づく', () => {
  for (const width of [320, 390, 430]) {
    for (const camera of [0, L / 2, L, 3 * L / 2]) {
      const p = projectRoad(width, 600, camera, camera);
      assert.ok(Math.abs(Math.abs(p.x / width - 0.5) - A) < 1e-12);
      assert.ok(p.width / width >= 0.30 && p.width / width <= 0.40);
      assert.ok(Math.abs(Math.min(p.x - p.half, width - p.x - p.half) / width - 0.10) < 1e-12);
    }
  }
});

test('前進中も道は画面内に収まり、家は余白の広い道の外側に置く', () => {
  for (const width of [320, 390, 430]) {
    for (let camera = 0; camera <= L; camera += 17) {
      for (let distance = 0; distance <= 10000; distance += 37) {
        const p = projectRoad(width, 600, camera + distance, camera);
        assert.ok(p.x - p.half >= 0 && p.x + p.half <= width);
        assert.ok(p.y >= 84 && p.y <= 600);
        const h = houseGeometry(width, p, true);
        assert.equal(h.x, p.x);
        assert.equal(h.offset, p.half + 8);
        assert.ok(h.side === 'left' ? h.x - h.offset - h.size >= 8 - 1e-9 : h.x + h.offset + h.size <= width - 8 + 1e-9);
      }
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
