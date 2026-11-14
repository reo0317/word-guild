import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile, stat} from 'node:fs/promises';
import {HOUSE_ART} from '../products/word-guild/guild/art.mjs';
import {announceFog, remainingSteps, renderMap, houseFlipped, panelGeometry, houseGeometry, projectRoad, skyGeometry, WARD_VANISHING, tsumugiScale, objectScale, roadAmplitude, lighthouseOpacity, lighthouseVisible, LIGHTHOUSE_DISTANCE, roadPoints, roadOpacity, FADE_START, DRAW_DISTANCE, A, L, W, f} from '../products/word-guild/guild/map.mjs';
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
      assert.ok(size >= previous);
      assert.ok(Math.abs(size / 100 - objectScale(initial.z / p.z)) < 1e-12);
      assert.ok(Math.abs(size / 100 - objectScale(p.width / initial.width)) < 1e-12);
      previous = size;
    }
  }
});

test('描画とスクロールにもツムギの遠近縮尺と背景の補正を適用する', () => {
  const progress = {words: {}, gates: []};
  const map = buildMap(words, progress, 20000);
  let scroll, scheduled;
  const road = {clientWidth:402, clientHeight:710, scrollTop:0,
    getBoundingClientRect:()=>({top:44}), addEventListener:(_, fn)=>{scroll=fn;}};
  const pin = {style:{}, classList:{contains:cls=>cls === 'gq-bb-tsumugi'}, querySelector:()=>null};
  const panel = {style:{}, offsetWidth:130, offsetHeight:80};
  const panelBoard = {style:{}, classList:{contains:()=>false}, querySelector:sel=>sel === '.gq-here-panel' ? panel : null};
  const lamps = [];
  const depthHouses = [-30, 30].map(() => ({style:{}, classList:{contains:()=>false}, querySelector:()=>null}));
  const sky = {style:{}, dataset:{ward:'1'}, classList:{toggle(){}}};
  const nodes = {'#gq-road':road, '#gq-stage':{style:{}, isConnected:true, getBoundingClientRect:()=>({left:0,top:44})}};
  const view = {innerHTML:'', querySelector(selector) {
    return nodes[selector] ??= {style:{}, attrs:{}, setAttribute(k,v){this.attrs[k]=v;}};
  }, querySelectorAll(selector) {
    if (selector === '.gq-sky-art') return [sky];
    if (selector !== '.gq-bb') return [];
    const match = this.innerHTML.match(/class="gq-bb gq-bb-tsumugi" data-y="([^"]+)" data-lat="([^"]+)"/);
    pin.dataset = {y:match[1], lat:match[2]};
    panelBoard.dataset = {...pin.dataset};
    for (const lamp of this.innerHTML.matchAll(/class="gq-bb gq-bb-lamp[^"]*" data-y="([^"]+)" data-lat="([^"]+)"/g)) {
      lamps.push({style:{}, dataset:{y:lamp[1],lat:lamp[2]}, classList:{contains:()=>false}, querySelector:()=>null});
    }
    for (const node of [pin, ...lamps]) node.querySelectorAll = () => [];
    depthHouses.forEach((house, i) => { house.dataset = {y:String(Number(pin.dataset.y) + (i ? 30 : -30)), lat:"0"}; });
    return [pin, panelBoard, ...lamps, ...depthHouses];
  }};
  const oldWindow = globalThis.window, oldRAF = globalThis.requestAnimationFrame;
  globalThis.window = {innerHeight:874};
  globalThis.requestAnimationFrame = fn => {scheduled=fn; return 1;};
  try {
    renderMap(view, {map,today:20000,progress,total:1400,face:()=>'',tsumugi:'',on:{}});
    const scale = () => Number(pin.style.transform.match(/scale\(([^)]+)\)/)[1]);
    const end = Number(view.innerHTML.match(/class="gq-bb gq-bb-top" data-y="([^"]+)"/)[1]);
    const checkRoadEnd = () => {
      const camera = Math.min(end + 40, Math.max(-1400, end + 40 - road.scrollTop));
      const terminal = projectRoad(402, 710, Math.min(end, camera + DRAW_DISTANCE), camera);
      for (const name of ['base', 'edge', 'lines', 'center', 'walked']) {
        const coords = nodes[`#gq-r-${name}`].attrs.d.match(/-?\d+(?:\.\d+)?/g)?.map(Number) ?? [];
        for (let i = 1; i < coords.length; i += 2) assert.ok(coords[i] >= terminal.y - .051, `${name} extends past lighthouse`);
      }
      const base = nodes['#gq-r-base'].attrs.d;
      assert.ok(base.includes(`${(terminal.x - terminal.half).toFixed(1)} ${terminal.y.toFixed(1)}`));
      assert.ok(base.includes(`${(terminal.x + terminal.half).toFixed(1)} ${terminal.y.toFixed(1)}`));
    };
    assert.match(view.innerHTML, /<img src="art\/lighthouse.webp"/);
    assert.doesNotMatch(view.innerHTML, /<svg viewBox="0 0 120 150"/);
    checkRoadEnd();
    // 吹き出しはツムギと同じ層（同じ gq-bb-tsumugi の中）に固定する。
    assert.match(view.innerHTML, /gq-bb-tsumugi[^>]*>.*?<img class="gq-tsumugi-pin"[^>]*><div class="gq-here-panel (left|right)">/s);
    // 初期の街灯から6個先の札も、道の打ち切りより手前に描かれる。
    const sixthAhead = lamps[6];
    assert.equal(sixthAhead.hidden, false);
    assert.ok(Number(sixthAhead.style.opacity) > 0);
    const initialCamera = end + 40 - road.scrollTop;
    assert.ok(Number(sixthAhead.dataset.y) <= initialCamera + DRAW_DISTANCE);
    assert.ok(projectRoad(402,710,Number(sixthAhead.dataset.y),initialCamera).y
      >= projectRoad(402,710,initialCamera + DRAW_DISTANCE,initialCamera).y);
    const initialScroll = road.scrollTop;
    assert.equal(scale(), 1);
    assert.ok(Number(depthHouses[0].style.zIndex) > Number(pin.style.zIndex));
    assert.ok(Number(depthHouses[1].style.zIndex) < Number(pin.style.zIndex));
    // 吹き出しはツムギと同じ層なので、独自の前面の重なり順は持たない。
    assert.equal(sky.style.top, `${skyGeometry(402,710,1).top}px`);
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


 test('縮尺の上下限・灯台の霧・一定の道の振幅', () => {
  for (const scale of [-10, 0, .1, .3, 1, 1.2, 100, Infinity, NaN]) {
    assert.ok(objectScale(scale) >= .3 && objectScale(scale) <= 1.2);
    assert.ok(tsumugiScale(scale, .4) >= .3 && tsumugiScale(scale, .4) <= 1.2);
  }
  assert.equal(lighthouseOpacity(2400), 0);
  assert.equal(lighthouseOpacity(10000), 0);
  assert.equal(lighthouseOpacity(1400), 1);
  assert.equal(lighthouseOpacity(1900), .5);
  let previous = 1;
  for (let d = 0; d <= 10000; d += 10) {
    const amplitude = roadAmplitude(d);
    assert.ok(amplitude >= 0 && amplitude <= previous);
    previous = amplitude;
  }
  assert.equal(roadAmplitude(0), 1);
  assert.equal(roadAmplitude(2200), 1);
});


test('現在地から10石段より遠い灯台は描かない', () => {
  assert.equal(lighthouseVisible(LIGHTHOUSE_DISTANCE + 1), false);
  assert.equal(lighthouseVisible(100000), false);
  assert.equal(lighthouseVisible(LIGHTHOUSE_DISTANCE), true);
  assert.equal(lighthouseVisible(0), true);
});

test('楕円の霞を使わず、道と物を最後の30%で同じ透明度にする', async () => {
  const source = await readFile(new URL('../products/word-guild/guild/map.mjs', import.meta.url), 'utf8');
  const css = await readFile(new URL('../products/word-guild/map.css', import.meta.url), 'utf8');
  assert.doesNotMatch(source + css, /gq-road-cap/);
  assert.match(source, /gradientUnits="userSpaceOnUse"/);
  assert.equal(roadOpacity(0), 1);
  assert.equal(roadOpacity(FADE_START), 1);
  assert.equal(roadOpacity(DRAW_DISTANCE), 0);
  assert.equal(roadOpacity(DRAW_DISTANCE + 100), 0);
  for (const [width, height] of [[320,480], [390,680], [430,760]]) {
    for (const camera of [-1400, 0, 530, 10000]) {
      const start = projectRoad(width, height, camera + FADE_START, camera).y;
      const end = projectRoad(width, height, camera + DRAW_DISTANCE, camera).y;
      let previous = 1;
      for (let d = FADE_START; d <= DRAW_DISTANCE; d += 10) {
        const opacity = roadOpacity(d);
        assert.ok(opacity <= previous && opacity >= 0);
        const y = projectRoad(width, height, camera + d, camera).y;
        assert.ok(Math.abs(opacity - (y - end) / (start - end)) < 1e-12);
        previous = opacity;
      }
    }
  }
});

test('スマホ幅で道の点列は打ち切り距離を超えず、画面の間隔は2px未満', () => {
  for (const [width, height] of [[320,480], [390,680], [430,760]]) {
    for (const camera of [-1400, 0, 530, 10000]) {
      for (const distance of [300, DRAW_DISTANCE, 100000]) {
        const points = roadPoints(width, height, camera + distance, camera);
        assert.equal(points.at(-1).worldZ, camera + Math.min(distance, DRAW_DISTANCE));
        for (const [i, p] of points.entries()) {
          assert.ok(p.worldZ <= camera + Math.min(distance, DRAW_DISTANCE));
          if (i) {
            const prev = points[i - 1];
            assert.ok(Math.hypot(p.x - prev.x, p.y - prev.y) < 2);
            assert.ok(p.worldZ >= prev.worldZ);
          }
        }
      }
    }
  }
});


test('吹き出しは中央より左のツムギの右、中央以降のツムギの左に出す', () => {
  const house = {left:10, right:140, top:270, bottom:440};
  assert.deepEqual(panelGeometry(390, 680, 190, 400, 130, 80, [house]), {left:246, top:300});
  assert.equal(panelGeometry(390, 680, 190, 400, 130, 80, [], 69), null);
  assert.deepEqual(panelGeometry(320, 480, 160, 300, 150, 80, []), {left:8, top:200});
  assert.deepEqual(panelGeometry(390, 680, 210, 400, 130, 80,
    [{left:260, right:380, top:270, bottom:440}]), {left:24, top:300});
});

test('打ち切り地点まで世界座標の sin の振幅を保つ', () => {
  assert.ok(DRAW_DISTANCE >= 6400 && DRAW_DISTANCE <= 7200);
  for (const camera of [0, 137, 550, 1100]) {
    for (let d = 0; d <= DRAW_DISTANCE; d += 25) {
      const p = projectRoad(390, 680, camera + d, camera);
      assert.ok(Math.abs((p.x - 195) / (390 * p.scale)
        - A * Math.sin(2 * Math.PI * (camera + d) / L + Math.PI / 2)) < 1e-12);
    }
  }
});


test('家と門に重ならない位置へ出し、小さいツムギでは隠す', () => {
  const left = {left:0, right:150, top:280, bottom:400};
  const right = {left:260, right:390, top:280, bottom:400};
  assert.deepEqual(panelGeometry(390,680,190,400,130,80,[left,right]), {left:246,top:412});
  assert.deepEqual(panelGeometry(390,680,190,400,130,80,[{...left,right:50},right]), {left:246,top:412});
  assert.ok(panelGeometry(390,680,190,400,130,80,[left,right],70));
  assert.deepEqual(panelGeometry(390,680,210,400,130,80,[left,right]), {left:24,top:412});
  for (const width of [320, 375, 390, 430]) {
    for (const x of [0, width / 2 - 1, width / 2, width]) {
      for (const feet of [0, 400, 680]) {
        const p = panelGeometry(width,680,x,feet,130,80,[left,right]);
        assert.ok(p.left >= 8 && p.left + 130 <= width - 8);
        assert.ok(p.top >= 8 && p.top + 80 <= 672);
      }
    }
  }
});


test('今日の依頼は全文と進捗を表示し、印と達成表示を保つ', () => {
  const old = globalThis.requestAnimationFrame;
  globalThis.requestAnimationFrame = () => 1;
  try {
    for (const [kind, mark] of [['revenge', '↺'], ['fresh', '✦'], ['clean', '◇'], ['finish', '▶']]) {
      for (const done of [false, true]) {
        const progress = {words: {}, gates: [], daily: {kind, goal: 10, count: done ? 10 : 0, done}};
        const node = {style: {}, clientWidth: 390, addEventListener() {}, setAttribute() {}};
        const view = {innerHTML: '', querySelector: () => ({...node}), querySelectorAll: () => []};
        renderMap(view, {map: buildMap(words, progress, 20000), today: 20000, progress, total: 1400, face: () => '', tsumugi: '', letterOf: () => ({}), on: {}});
        assert.ok(view.innerHTML.includes(`<i aria-hidden="true">${mark}</i>${({revenge:'戻ってきた紙魚を10体倒す', fresh:'新しい言葉を10語見つける', clean:'ヒントなしで10語答える', finish:'配達を10回やりとげる'})[kind]}<b>${done ? 10 : 0}/10</b>`));
        assert.ok(view.innerHTML.includes(`class="gq-daily ${done ? 'done' : ''}"`));
      }
    }
  } finally {globalThis.requestAnimationFrame = old;}
});


test('56軒の玄関を道側へ向け、中央の玄関と飾りは反転しない', async () => {
  const doors = JSON.parse(await readFile(new URL('../products/word-guild/data/house-doors.json', import.meta.url)));
  assert.equal(Object.keys(doors).length, 56);
  for (let shelf = 1; shelf <= 56; shelf++) {
    assert.ok(['left', 'right', 'center'].includes(doors[shelf]));
    for (const side of ['left', 'right']) {
      const flipped = houseFlipped(shelf, side);
      const facing = flipped ? (doors[shelf] === 'left' ? 'right' : 'left') : doors[shelf];
      assert.equal(facing, doors[shelf] === 'center' ? 'center' : side === 'left' ? 'right' : 'left');
    }
  }
  const css = await readFile(new URL('../products/word-guild/map.css', import.meta.url), 'utf8');
  assert.match(css, /\.gq-house\.door-flipped \.gq-house-image\{transform:scaleX\(-1\)\}/);
  const source = await readFile(new URL('../products/word-guild/guild/map.mjs', import.meta.url), 'utf8');
  assert.match(source, /gq-house-warm"><\/i><\/span><i class="gq-house-sparks/);
  assert.match(source, /classList.toggle\('door-flipped', houseFlipped\(b.house.dataset.shelf, side\)\)/);
});

 test('灯台は終点近くの残り石段数と全完了で表示する（DOM不要）', () => {
  const items = Array.from({length: 56}, (_, i) => ({type: 'step', cy: i * 900}));
  items.push({type: 'gate', cy: 60000});
  for (const [current, visible] of [[44, false], [45, true], [55, true]]) {
    assert.equal(lighthouseVisible(remainingSteps(items, current * 900) * (LIGHTHOUSE_DISTANCE / 10)), visible);
  }
  assert.equal(lighthouseVisible(remainingSteps(items, 0, true)), true);
});

test('門が開いた地図の封蝋から門の配達へ進む', () => {
  const old = globalThis.requestAnimationFrame;
  globalThis.requestAnimationFrame = () => 1;
  try {
    const nodes = new Map(); let chosen = null;
    const view = {innerHTML:'', querySelector(s) { if (!nodes.has(s)) nodes.set(s,{style:{},addEventListener(){},setAttribute(){}}); return nodes.get(s); }, querySelectorAll:()=>[]};
    const progress = {words:{},gates:[]};
    const map = buildMap(words,progress,20000);
    map.wards[0].gate = 'open';
    renderMap(view,{map,progress,today:20000,total:1400,face:()=>'',tsumugi:'',letterOf:()=>null,on:{gate:n=>chosen=n,go:()=>assert.fail('通常配達へ進んだ')}});
    assert.match(view.innerHTML,/1区の<br>門へ/);
    nodes.get('#gq-go').onclick();
    assert.equal(chosen,1);
  } finally { globalThis.requestAnimationFrame = old; }
});


test('霧の案内は再描画・保存後も一度だけで、晴れたら次の霧で案内する', () => {
  const data = new Map();
  const storage = {getItem:k=>data.get(k),setItem:(k,v)=>data.set(k,v),removeItem:k=>data.delete(k)};
  announceFog(false, storage);
  assert.equal(announceFog(true, storage), true);
  assert.equal(announceFog(true, storage), false);
  announceFog(false, {removeItem(){}}); // メモリだけリセットして保存からの復元を確認。
  assert.equal(announceFog(true, storage), false);
  assert.equal(announceFog(false, storage), false);
  assert.equal(announceFog(true, storage), true);
  const blocked = {getItem(){throw Error('blocked');}, removeItem(){throw Error('blocked');}};
  announceFog(false, blocked);
  assert.equal(announceFog(true, blocked), true);
  assert.equal(announceFog(true, blocked), false);
  announceFog(false, storage);
});

test('霧の地図を描いた次のフレームで案内を開き、再描画では追加しない', () => {
  const oldRAF = globalThis.requestAnimationFrame;
  const frames = [];
  const storage = {removeItem(){}};
  announceFog(false, storage);
  globalThis.requestAnimationFrame = fn => {frames.push(fn); return 1;};
  try {
    let opened = 0;
    const nodes = new Map();
    const view = {innerHTML:'', isConnected:true,
      insertAdjacentHTML(_, html){this.innerHTML += html;},
      querySelector(s) {
        if (!nodes.has(s)) nodes.set(s, {style:{},addEventListener(){},setAttribute(){},showModal(){opened++;}});
        return nodes.get(s);
      }, querySelectorAll:()=>[]};
    const progress = {words:{},gates:[]};
    const map = buildMap(words,progress,20000);
    map.fog = true; map.dueCount = 27;
    const ctx = {map,progress,today:20000,total:1400,face:()=>'',tsumugi:'',on:{}};
    renderMap(view, ctx);
    assert.equal(opened, 0);
    assert.match(view.innerHTML, /<dialog class="gq-fog-intro"/);
    assert.match(view.innerHTML, /霧の配達 あと3回<\/span>/);
    assert.match(view.innerHTML, /class="gq-wax fog"/);
    frames.splice(0).forEach(fn=>fn());
    assert.equal(opened, 1);
    renderMap(view, ctx);
    assert.doesNotMatch(view.innerHTML, /<dialog/);
    frames.splice(0).forEach(fn=>fn());
    assert.equal(opened, 1);
    map.fog = false; renderMap(view, ctx);
    map.fog = true; renderMap(view, ctx);
    frames.splice(0).forEach(fn=>fn());
    assert.equal(opened, 2);
  } finally {
    globalThis.requestAnimationFrame = oldRAF;
    announceFog(false, storage);
  }
});

test('依頼達成日の金の消印は通常の消印と区別され、連続日数に依存しない', async () => {
  const {streakDays} = await import('../products/word-guild/guild/map.mjs');
  const days=streakDays({count:2,last:20000,best:2},20000,[19995,20000]);
  assert.equal(days[1].daily,true);
  assert.equal(days[1].on,false);
  assert.equal(days[5].on,true);
  assert.equal(days[5].daily,false);
  assert.equal(days[6].daily,true);
});
