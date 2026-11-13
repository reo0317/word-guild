import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile, stat} from 'node:fs/promises';
import {HOUSE_ART} from '../products/word-guild/guild/art.mjs';
import {renderMap, panelGeometry, houseGeometry, projectRoad, skyGeometry, WARD_VANISHING, tsumugiScale, A, L, W, f} from '../products/word-guild/guild/map.mjs';
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

test('6区の原画の消失点がスマホ縦横の投影と一致し、背景の左右に隙間を作らない', () => {
  for (const [width, height] of [[320, 480], [390, 680], [430, 760], [844, 280]]) {
    for (const [ward, point] of Object.entries(WARD_VANISHING)) {
      const sky = skyGeometry(width, height, Number(ward));
      const distant = projectRoad(width, height, 1e15, 321);
      assert.ok(Math.abs(sky.left + sky.width * point.x - distant.x) < 1e-8);
      assert.ok(Math.abs(sky.top + sky.height * point.y - distant.y) < 1e-8);
      assert.ok(sky.left <= 1e-9 && sky.left + sky.width >= width - 1e-9);
      assert.ok(Math.abs(sky.width / sky.height - 1.5) < 1e-12);
    }
  }
});

test('ツムギは初期位置で100pxを保ち、スクロールで道と同じ逆距離比で縮小・拡大する', () => {
  for (const [width, height] of [[320, 480], [390, 680], [430, 760]]) {
    const worldZ = 900, initialCamera = 400;
    const initial = projectRoad(width, height, worldZ, initialCamera);
    assert.equal(100 * tsumugiScale(initial.scale, initial.scale), 100);
    let previous = 0;
    for (const camera of [-1400, -500, initialCamera, 700, 900]) {
      const p = projectRoad(width, height, worldZ, camera);
      const size = 100 * tsumugiScale(p.scale, initial.scale);
      assert.ok(size > previous);
      assert.ok(Math.abs(size / 100 - initial.z / p.z) < 1e-12);
      assert.ok(Math.abs(size / 100 - p.width / initial.width) < 1e-12);
      previous = size;
    }
  }
});

test('描画とスクロールにもツムギの遠近縮尺と背景の補正を適用する', () => {
  const progress = {words: {}, gates: []};
  const map = buildMap(words, progress, 20000);
  let scroll, scheduled;
  const road = {clientWidth:390, clientHeight:680, scrollTop:0,
    getBoundingClientRect:()=>({top:44}), addEventListener:(_, fn)=>{scroll=fn;}};
  const pin = {style:{}, classList:{contains:cls=>cls === 'gq-bb-tsumugi'}, querySelector:()=>null};
  const sky = {style:{}, dataset:{ward:'1'}, classList:{toggle(){}}};
  const nodes = {'#gq-road':road};
  const view = {innerHTML:'', querySelector(selector) {
    return nodes[selector] ??= {style:{}, attrs:{}, setAttribute(k,v){this.attrs[k]=v;}};
  }, querySelectorAll(selector) {
    if (selector === '.gq-sky-art') return [sky];
    if (selector !== '.gq-bb') return [];
    const match = this.innerHTML.match(/class="gq-bb gq-bb-tsumugi" data-y="([^"]+)" data-lat="([^"]+)"/);
    pin.dataset = {y:match[1], lat:match[2]};
    return [pin];
  }};
  const oldWindow = globalThis.window, oldRAF = globalThis.requestAnimationFrame;
  globalThis.window = {innerHeight:844};
  globalThis.requestAnimationFrame = fn => {scheduled=fn; return 1;};
  try {
    renderMap(view, {map,today:20000,progress,total:1400,face:()=>'',tsumugi:'',on:{}});
    const scale = () => Number(pin.style.transform.match(/scale\(([^)]+)\)/)[1]);
    const end = Number(view.innerHTML.match(/class="gq-bb gq-bb-top" data-y="([^"]+)"/)[1]);
    const checkRoadEnd = () => {
      const camera = Math.min(end + 40, Math.max(-1400, end + 40 - road.scrollTop));
      const terminal = projectRoad(390, 680, end, camera);
      for (const name of ['base', 'edge', 'lines', 'center', 'walked']) {
        const coords = nodes[`#gq-r-${name}`].attrs.d.match(/-?\d+(?:\.\d+)?/g)?.map(Number) ?? [];
        for (let i = 1; i < coords.length; i += 2) assert.ok(coords[i] >= terminal.y - .051, `${name} extends past lighthouse`);
      }
      const base = nodes['#gq-r-base'].attrs.d;
      assert.ok(base.includes(`${(terminal.x - terminal.half).toFixed(1)} ${terminal.y.toFixed(1)}`));
      assert.ok(base.includes(`${(terminal.x + terminal.half).toFixed(1)} ${terminal.y.toFixed(1)}`));
    };
    assert.match(view.innerHTML, /<img src="art\/house-48.webp"/);
    assert.doesNotMatch(view.innerHTML, /<svg viewBox="0 0 120 150"/);
    checkRoadEnd();
    const initialScroll = road.scrollTop;
    assert.equal(scale(), 1);
    assert.equal(sky.style.top, `${skyGeometry(390,680,1).top}px`);
    // 初回の再計測でも基準倍率を変えない。
    scheduled();
    assert.equal(scale(), 1);
    road.scrollTop = initialScroll + 600;
    scroll(); scheduled();
    checkRoadEnd();
    const far = scale();
    assert.ok(far < 1);
    road.scrollTop = initialScroll - 200;
    scroll(); scheduled();
    checkRoadEnd();
    assert.ok(scale() > 1);
    assert.doesNotMatch(view.innerHTML, /<img[^>]*loading="lazy"/);
  } finally {
    if (oldWindow === undefined) delete globalThis.window; else globalThis.window = oldWindow;
    if (oldRAF === undefined) delete globalThis.requestAnimationFrame; else globalThis.requestAnimationFrame = oldRAF;
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


test('390×844・360×640で吹き出しは左右の家とツムギを避け、画面内に収まる', () => {
  for (const [width, height] of [[390, 680], [360, 480]]) {
    for (let camera = -500; camera < 2500; camera += 137) {
      const here = projectRoad(width, height, camera + 450, camera);
      const houses = [];
      for (let y = 300; y < 6000; y += 362) {
        if (y < camera) continue;
        const p = projectRoad(width, height, y, camera);
        const h = houseGeometry(width, p, true);
        const left = h.side === 'left' ? p.x - h.offset - h.size : p.x + h.offset;
        houses.push({left, right:left + h.size, top:p.y - h.size * .85, bottom:p.y + h.size * .15});
      }
      const panel = panelGeometry(width, height, here.x, here.y, 150, 88, houses);
      assert.ok(panel.left >= 8 && panel.left + 150 <= width - 8);
      assert.ok(panel.top >= 8 && panel.top + 88 <= height - 8);
      for (const h of houses) assert.ok(panel.left >= h.right || panel.left + 150 <= h.left || panel.top >= h.bottom || panel.top + 88 <= h.top);
    }
  }
});
