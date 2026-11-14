import {MAP_ART, GATE_RECTS, GATE_ARCHES} from '../art/map-art.mjs';
import HOUSE_DOORS from '../data/house-doors.json' with {type: 'json'};
import {isRestored} from './srs.mjs';
import {visitors, rareStatus} from './rare.mjs';
// 道の地図（トップの画面）。手前（下）から奥（上）へ、遠近のついた道が続く。
// 手前が近くて大きく、奥へ行くほど小さく霧にかすむ。今いる石段は手前寄りに見える。
// DOM は container.innerHTML に描く。霧の案内の表示済み状態だけ保存し、操作は ctx.on に渡す。
//
// renderMap(view, ctx)
//   ctx.map       stages.mjs の buildMap の結果
//   ctx.today     日番号
//   ctx.progress  進捗（streak・daily・words を読む）
//   ctx.total     語の総数（1,400）
//   ctx.face(id, state)   紙魚の小さな顔の SVG 文字列
//   ctx.tsumugi   ツムギの絵のファイル
//   ctx.notice    {text, label, act} か null（条件つきの知らせ）
//   ctx.warn      保存できないときの文
//   ctx.letterOf(shelf)   その街灯の通（letterView の結果）か null。英文が無い街灯は null で、紙の絵を出さない
//   ctx.on        {go, gate, lamp, album, settings, title, notice}
//
// 遠近：スクロール量をカメラの前進距離として、同じ世界座標の道を投影し直す。
import {esc, fab, waxButton, miniHouse} from './dom.mjs';
import {artBox, HOUSE_ART} from './art.mjs';
import {streakNow, DAILY_TEXT} from './daily.mjs';
import {WARDS} from './chara-svg.mjs';

// 保存できない環境でも、同じ霧の間は案内を繰り返さない。
let fogAnnounced = false;
export function announceFog(fog, storage) {
  const key = 'wordGuild.map.fogAnnounced';
  let seen = fogAnnounced;
  try {
    storage ??= globalThis.localStorage;
    seen = storage?.getItem(key) === '1' || seen;
    if (fog) storage?.setItem(key, '1');
    else storage?.removeItem(key);
  } catch { /* 保存不可の場合はメモリで保持する。 */ }
  fogAnnounced = Boolean(fog);
  return Boolean(fog) && !seen;
}

const H = {post: 170, ward: 64, step: 54, lamp: 92, gate: 200, top: 180};
const HORIZON = 0.14;  // 地平線の高さ（道の枠の高さに対する割合）
// 世界座標の単位は任意。f は画面幅を単位とする焦点距離。
export const A = 0.225; // 中心線の横振幅（最接近時、道の外縁が画面の10%まで来る）
export const L = 1100;  // 奥行き方向のくねりの周期
export const W = 0.35; // 世界座標で一定の道幅
export const f = 700;  // 焦点距離（画面幅に対する投影倍率の基準）
export const H_CAMERA = 0.86; // カメラの高さ（画面の縦横比で補正して投影）
const Z_NEAR = 700;    // 下端での最短距離。これより近い地面は描かない
const PHASE = Math.PI / 2;
export const DRAW_DISTANCE = 7200;
export const FADE_START = DRAW_DISTANCE * .7;
// SVG の画面 y 方向のグラデーションと同じ透視投影上の透明度。
export function roadOpacity(distance) {
  const scale = d => f / (d + Z_NEAR);
  return Math.max(0, Math.min(1,
    (scale(distance) - scale(DRAW_DISTANCE)) / (scale(FADE_START) - scale(DRAW_DISTANCE))));
}
export function gateScale(scale) {
  return Math.max(36 / 132, Math.min(140 / 132, Math.min(1, scale) ** .6));
}
export function gateArchPath(ch) {
  const a = GATE_ARCHES[ch];
  if (!a) return null;
  const [x, y, r] = a;
  return `M${x-r} ${y}A${r} ${r} 0 0 1 ${x+r} ${y}`;
}
export const LIGHTHOUSE_DISTANCE = H.step * 10;

export function remainingSteps(items, hereY, complete = false) {
  return complete ? 0 : items.filter(item => item.type === 'step' && item.cy > hereY).length;
}

export function lighthouseVisible(remaining) {
  return remaining >= 0 && remaining <= LIGHTHOUSE_DISTANCE;
}

// 画面上の縦間隔を1px以下にし、打ち切り位置も必ず標本に含める。
export function roadPoints(width, height, end, camera = 0) {
  const cap = Math.max(camera, Math.min(end, camera + DRAW_DISTANCE));
  const near = projectRoad(width, height, camera, camera);
  const far = projectRoad(width, height, cap, camera);
  const count = Math.max(1, Math.ceil((near.y - far.y) * 8));
  return Array.from({length: count + 1}, (_, i) => {
    const scale = near.scale + (far.scale - near.scale) * i / count;
    const worldZ = i === count ? cap : Math.min(cap, camera + f / scale - Z_NEAR);
    return {...projectRoad(width, height, worldZ, camera), worldZ};
  });
}

// art/ward-N.webp（1200×800）の奥の道・海面の消失点。原画内の比率。
export const WARD_VANISHING = {
  1: {x: .32, y: .42}, 2: {x: .53, y: .44},
  3: {x: .31, y: .45}, 4: {x: .25, y: .53},
  5: {x: .23, y: .55}, 6: {x: .56, y: .44},
};

// cover による切り抜きを避け、絵の消失点を投影の消失点へ移す。
export function skyGeometry(width, height, ward) {
  const point = WARD_VANISHING[Math.min(ward, 6)] ?? WARD_VANISHING[1];
  const imageWidth = Math.max(width * .5 / point.x, width * .5 / (1 - point.x));
  const imageHeight = imageWidth * 2 / 3;
  return {left: width * .5 - imageWidth * point.x, top: height * HORIZON - imageHeight * point.y,
    width: imageWidth, height: imageHeight};
}

export function tsumugiScale(scale, initialScale) {
  return objectScale(scale / initialScale);
}

// 地面の投影と、絵の表示倍率は分離する。
export function objectScale(scale) {
  return Math.max(.3, Math.min(1.2, Number.isFinite(scale) ? scale : scale > 0 ? 1.2 : .3));
}
// 横振幅は世界座標で一定。遠方は描画距離で打ち切る。
export function roadAmplitude() { return 1; }
export function lighthouseOpacity(distance) {
  return Math.max(0, Math.min(1, (2400 - distance) / 1000));
}

// worldZ は地面上の絶対位置、camera はスクロールによる前進距離。
// 縦横の画面単位をそれぞれ width / height に戻す通常の透視投影。
export function projectRoad(width, height, worldZ, camera = 0) {
  const z = Math.max(1, worldZ - camera + Z_NEAR);
  const scale = f / z;
  const worldX = A * roadAmplitude(worldZ - camera) * Math.sin(2 * Math.PI * worldZ / L + PHASE);
  return {x: width / 2 + width * scale * worldX,
    y: height * (HORIZON + scale * H_CAMERA), width: width * scale * W,
    half: width * scale * W / 2, scale, z};
}

// 画面の1行が受け持つ地面の奥行き。投影と同じカメラを使う。
export function roadRow(width, height, y, camera = 0) {
  const scale = (y / height - HORIZON) / H_CAMERA;
  if (scale <= 0) return null;
  const z = f / scale;
  const worldZ = camera + z - Z_NEAR;
  return {...projectRoad(width, height, worldZ, camera), worldZ,
    dz: z * z / (height * H_CAMERA * f)};
}
export function mipLevel(dz) {
  return Math.max(0, Math.min(5, Math.floor(Math.log2(Math.max(1, dz * 512 / 280 / 2)))));
}
export function wardAt(ranges, worldZ) {
  return ranges.find(r => worldZ >= r.start && worldZ < r.end)?.ch ?? null;
}
export function gateDoorRect(ch) {
  const r = GATE_RECTS[ch];
  return r ? {x:r[0], y:r[1], width:r[2], height:r[3]} : null;
}

export function propsFor(ward) {
  const opposite = lamp => { const z=lamp.cy ?? lamp.shelf*H.lamp; return Math.sin(2*Math.PI*z/L+PHASE)>=0 ? 'right' : 'left'; };
  let previous = -1;
  return ward.lamps.flatMap(lamp => [
    {shelf:lamp.shelf, si:null, kind:0, side:opposite(lamp)},
    ...lamp.steps.flatMap((_,si) => {
      if (si % 2) return [];
      let kind = (lamp.shelf*7+si*3)%5+1;
      if (kind === previous) kind = kind%5+1;
      previous = kind;
      return [{shelf:lamp.shelf, si, kind, side:opposite(lamp)}];
    })]);
}

// side は道に対する家の位置。中央の玄関は向きを変えない。
export function houseFlipped(shelf, side) {
  const door = HOUSE_DOORS[shelf];
  return door !== 'center' && door === side;
}

export function houseGeometry(width, projection, current = false) {
  const {x, half, scale} = projection;
  const side = x >= width / 2 ? 'left' : 'right';
  const room = Math.max(0, (side === 'left' ? x : width - x) - half - 16);
  const size = Math.min(room, Math.max(36, Math.min(140, (current ? 160 : 132) * Math.min(1, scale) ** 0.6)));
  return {x, size, offset: half + 8, side};
}

// 家の札と門を避け、空きがないときは吹き出しを隠す。
export function panelGeometry(width, height, x, feet, pw, ph, objects, tsumugiSize = 100) {
  if (tsumugiSize < 70) return null;
  const top = Math.max(8, Math.min(height - ph - 8, feet - tsumugiSize));
  const gap = tsumugiSize / 2 + 6;
  // 主人公が左半分なら吹き出しは右、右半分なら左。家などとの重なりは許し、主人公とは重ねない。
  const beside = x < width / 2 ? x + gap : x - gap - pw;
  const left = Math.max(8, Math.min(width - pw - 8, beside));
  const candidates = [{left, top}, {left, top: Math.min(height - ph - 8, feet + 12)}];
  return candidates.find(c => !objects.some(r => c.left < r.right + 8 && c.left + pw > r.left - 8 && c.top < r.bottom + 8 && c.top + ph > r.top - 8)) ?? candidates[0];
}

const DAILY_SHORT = {revenge: ['↺', '戻ってきた紙魚'], fresh: ['✦', '新しい紙魚'], clean: ['◇', 'ヒントなし'], finish: ['▶', '配達']};

export function dailyLine(daily) {
  if (!daily) return '';
  const body = {
    revenge: `戻ってきた紙魚を${daily.goal}匹`,
    fresh: `新しい紙魚を${daily.goal}匹`,
    clean: `ヒントなしで${daily.goal}語`,
    finish: `配達を${daily.goal}回やりとげる`,
  }[daily.kind] ?? '';
  return `${body}　${Math.min(daily.count, daily.goal)}/${daily.goal}`;
}

// 今日の依頼：印・DAILY_TEXT の全文・進捗。
export function dailyBrief(daily) {
  if (!daily) return null;
  const [mark] = DAILY_SHORT[daily.kind] ?? ['', ''];
  return {mark, name: DAILY_TEXT(daily), count: Math.min(daily.count, daily.goal), goal: daily.goal};
}

export function infoDialog(title, text, ovals = false) {
  return `<dialog class="gq-fog-intro" aria-labelledby="gq-fog-title" aria-describedby="gq-fog-text">
    ${ovals ? '<div class="gq-fog-ovals" aria-hidden="true"><i></i><i></i><i></i></div>' : ''}
    <h2 id="gq-fog-title">${esc(title)}</h2>
    <p id="gq-fog-text" style="white-space:pre-line">${esc(text)}</p>
    <form method="dialog"><button type="submit" aria-label="とじる" autofocus>×</button></form>
  </dialog>`;
}

export function bindInfo(view, daily) {
  const descriptions = [
    ['.gq-daily[role="button"]', '今日の依頼', '毎日ひとつ、おまけの依頼が出ます。配達しながら達成すると印がつきます。依頼は日ごとに変わります。' + (daily ? `\n\n${DAILY_TEXT(daily)}　${Math.min(daily.count, daily.goal)}/${daily.goal}` : '')],
    ['.gq-fog-count', '霧の配達', '戻ってきた紙魚が増えると霧が出ます。霧の配達では前に会った言葉を多めに届けます。楕円はあと何回で霧が晴れるかの数です。'],
    ['.gq-tomorrow', '明日戻ってくる紙魚', '前に倒した紙魚は、忘れかけたころに戻ってきます。ここに並ぶのは明日戻ってくる紙魚と、その数です。'],
  ];
  for (const [selector, title, text] of descriptions) {
    const trigger = view.querySelector(selector);
    if (!trigger) continue;
    trigger.onclick = () => {
      view.querySelector('.gq-fog-intro')?.remove();
      view.insertAdjacentHTML('beforeend', infoDialog(title, text));
      const dialog = view.querySelector('.gq-fog-intro');
      dialog.addEventListener('close', () => trigger.focus({preventScroll: true}), {once: true});
      dialog.showModal();
    };
    trigger.onkeydown = event => {
      if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); trigger.onclick(); }
    };
  }
}

// 直近7日（左が6日前、右が今日）の消印。streak は {count, last, best}。
export function streakDays(streak, today, dailyDays = []) {
  const count = streakNow(streak, today);
  const last = streak?.last ?? 0;
  return Array.from({length: 7}, (_, i) => {
    const day = today - 6 + i;
    const date = new Date(day * 86400000).getUTCDate();
    return {day, date, daily: dailyDays.includes(day), on: count > 0 && day <= last && day > last - count};
  });
}

function postmark(day) {
  return `<span class="gq-pm ${day.on || day.daily ? 'on' : ''} ${day.daily ? 'daily' : ''}" title="${day.date}日${day.daily ? ' 今日の依頼達成' : ''}"><svg viewBox="0 0 30 30" aria-hidden="true"><circle cx="15" cy="15" r="13"/><circle cx="15" cy="15" r="9.5"/><text x="15" y="19" text-anchor="middle">${day.date}</text></svg></span>`;
}

// 道の上の位置を下から積んで決める。y は「郵便局からの距離」。
function layout(map) {
  const items = [];
  let y = 0;
  const add = (type, h, data = {}, cy = h / 2) => {
    items.push({type, from: y, h, cy: y + cy, ...data});
    y += h;
  };
  const here = map.here;
  add('post', H.post, {}, H.post);
  let k = 0;
  map.wards.forEach((ward, wi) => {
    add('ward', H.ward, {ward, wi}, H.ward / 2);
    for (const lamp of ward.lamps) {
      lamp.steps.forEach((step, si) => {
        const isHere = Boolean(here) && !here.gate && here.ch === ward.ch && here.shelf === lamp.shelf && here.step === si + 1;
        add('step', H.step, {ward, lamp, step, si, isHere, k: k++});
      });
      add('lamp', H.lamp, {ward, lamp, k: k++});
    }
    if (here?.gate && here.ch === ward.ch) add('gate-front', 0, {ward, isHere: true}, 0);
    add('gate', H.gate, {ward, k: k++}, H.gate - 50); // 門は区の最後の街灯の札よりはっきり奥に置く（重なり順がちらつかない）
  });
  add('top', H.top, {}, H.top - 70);
  let start = 0;
  const ranges = items.filter(i => i.type === 'gate').map(i => {
    const range = {ch: i.ward.ch, start, end: i.cy};
    start = i.cy;
    return range;
  });
  return {items, total: y, ranges};
}

export function renderMap(view, ctx) {
  const {map, today, progress, on} = ctx;
  const {items, total, ranges} = layout(map);
  const roadEnd = total - 40; // 灯台の足元が道の終点。
  const night = rareStatus(ctx.rares ?? [], progress);
  const visiting = new Set(visitors(map, ctx.rares ?? [], progress, today).filter(shelf => progress.rare?.day !== today || !progress.rare.met.includes(shelf)));
  const hereWard = map.wards.findIndex(w => w.ch === map.here?.ch);
  const ink = ward => (WARDS[ward.ch] ?? WARDS[1]).inks[0][1];

  let hereItem = null;
  for (const item of items) {
    item.lat = Math.sin(2 * Math.PI * item.cy / L + PHASE);
    if (item.isHere) hereItem = item;
  }
  const hereY = hereItem ? hereItem.cy : map.here ? 0 : roadEnd;
  const nearLighthouse = lighthouseVisible(remainingSteps(items, hereY, !map.here) * H.step);

  const bb = (cls, y, lat, inner) =>
    `<div class="gq-bb ${cls}" data-y="${y.toFixed(1)}" data-lat="${lat.toFixed(3)}" hidden>${inner}</div>`;

  const nodes = items.map(item => {
    const far = hereWard >= 0 && map.wards.indexOf(item.ward) > hereWard + 1 ? ' far' : '';
    if (item.type === 'step') {
      const cls = item.isHere ? 'here' : item.step.passed ? 'done' : 'todo';
      return bb(`gq-bb-step${far}`, item.cy, item.lat, `<i class="gq-step ${cls}" style="--wc:${ink(item.ward)}"></i>`);
    }
    if (item.type === 'lamp') {
      const {lamp} = item;
      const lit = lamp.lit === lamp.total;
      const gold = lamp.gold === lamp.total;
      const isHereLamp = map.here && map.here.shelf === lamp.shelf;
      const remain = isHereLamp ? lamp.steps.length - map.here.step + 1 : 0;
      const letter = ctx.letterOf?.(lamp.shelf) ?? null;
      const done = lamp.got === lamp.total;
      const stars = night.shelves[lamp.shelf];
      const file = HOUSE_ART[lamp.shelf];
      const reveal = lamp.got ? Math.min(5, Math.ceil(lamp.got / lamp.total * 5)) * 20 : 0;
      const pin = `<button type="button" class="gq-house ${lamp.shelf % 2 ? 'left' : 'right'}${done ? ' complete' : ''}${lit ? ' lit' : ''}${gold ? ' gold' : ''}"
        data-shelf="${lamp.shelf}" data-house-ward="${item.ward.ch}"${file ? ` data-house-src="${file}"` : ''}
        data-reveal="${reveal}" style="--reveal:${100 - reveal}%" aria-label="街灯${lamp.shelf}の${letter ? '手紙' : '切手帳'}を開く">
        <span class="gq-house-fallback" aria-hidden="true">${miniHouse()}</span>
        <span class="gq-house-art" aria-hidden="true"><i class="gq-house-halo"></i><span class="gq-house-image"><i class="gq-house-shadow"></i>
        <img class="gq-house-color" alt="" width="140" height="140" decoding="async">
        <i class="gq-house-warm"></i></span><i class="gq-house-sparks"></i></span>
        ${visiting.has(lamp.shelf) ? '<span class="gq-visitor" aria-label="まれびとが来ています">✦</span>' : ''}
        ${done ? `<span class="gq-house-stars ${stars?.complete ? 'joined' : ''} ${stars?.gold === 5 ? 'gold' : ''}" aria-label="夜の切手 ${stars?.met ?? 0}/5">${Array.from({length: 5}, (_, i) => `<i class="${i < (stars?.met ?? 0) ? 'met' : ''}">★</i>`).join('')}</span>` : ''}
        ${(progress.seals ?? []).includes(lamp.shelf) ? '<span class="gq-house-seal" aria-label="無傷の消印">〒</span>' : ''}
        ${gold ? '<svg class="gq-house-vane" viewBox="0 0 32 32" aria-hidden="true"><path d="M16 30V3M3 12h26M3 12l7-5v10zM22 12l7-5v10z"/></svg>' : ''}</button>`;
      return bb(`gq-bb-lamp${far}`, item.cy, item.lat,
        `<button type="button" class="gq-lamp-node ${gold ? 'gold' : lit ? 'lit' : ''}" data-shelf="${lamp.shelf}"
        style="--p:${Math.round(lamp.got / lamp.total * 100)}%;--wc:${ink(item.ward)}"
        aria-label="街灯${lamp.shelf}　切手 ${lamp.got}/${lamp.total}　${letter ? '手紙を開く' : '切手帳を開く'}">
        <b>${lamp.shelf}</b><small>${lamp.got}/${lamp.total}</small>${remain ? `<em>↑${remain}</em>` : ''}</button>${pin}`);
    }
    if (item.type === 'gate') {
      const {ward} = item;
      // 次の区の名札は承認済みの位置（門の上）を保つ。
      const nextWard = map.wards[map.wards.indexOf(ward) + 1];
      const gateTag = nextWard ? `<div class="gq-ward-tag gq-gate-tag"><b>${nextWard.ch}区</b> ${esc(nextWard.name)}</div>` : '';
      if (MAP_ART.gates.includes(ward.ch)) {
        const r = gateDoorRect(ward.ch);
        const path = gateArchPath(ward.ch);
        const archText = path && nextWard ? `<svg class="gq-gate-arch" viewBox="0 0 512 512" aria-hidden="true"><path id="gq-arch-${ward.ch}" d="${path}" fill="none"/><text><textPath href="#gq-arch-${ward.ch}" startOffset="50%" text-anchor="middle">${nextWard.ch}区 ${esc(nextWard.name)}</textPath></text></svg>` : '';
        const tag = ward.gate === 'open' ? 'button' : 'div';
        return bb(`gq-bb-gate${far}`, item.cy, item.lat,
          `<${tag} class="gq-gate gq-gate-art ${ward.gate}" style="--door-x:${r.x*100}%;--door-y:${r.y*100}%;--door-w:${r.width*50}%;--door-h:${r.height*100}%" aria-label="${ward.ch}区の門${ward.gate === 'cleared' ? '（通過済み）' : ''}" ${tag === 'button' ? 'type="button" data-gate="' + ward.ch + '"' : ''}>
          <i class="gq-gate-fallback" aria-hidden="true"></i><img class="gq-gate-frame" src="art/gate-${ward.ch}.webp" alt="" width="512" height="512">
          <img class="gq-gate-door gq-gate-door-l" src="art/gate-${ward.ch}-door-l.webp" alt="">
          <img class="gq-gate-door gq-gate-door-r" src="art/gate-${ward.ch}-door-r.webp" alt="">
          <i class="gq-gate-mist a"></i><i class="gq-gate-mist b"></i>${ward.gate === 'open' ? '<b class="gq-gate-card" aria-hidden="true">•</b>' : ''}${archText}</${tag}>${archText ? '' : gateTag}`);
      }
      const label = {hidden: '', open: `${ward.ch}区`, cleared: '✓'}[ward.gate];
      const tag = ward.gate === 'open' ? 'button' : 'div';
      return bb(`gq-bb-gate${far}`, item.cy, item.lat,
        `<${tag} ${tag === 'button' ? 'type="button" data-gate="' + ward.ch + '"' : ''} class="gq-gate ${ward.gate}"
        ${ward.gate === 'open' ? `aria-label="${ward.ch}区の門へ"` : ''}><i aria-hidden="true"></i>${label ? `<span>${label}</span>` : ''}</${tag}>${gateTag}`);
    }
    if (item.type === 'ward') {
      if (item.wi > 0) return ''; // 2区から先の名札は前の区の門の足もと
      return bb('gq-bb-ward', item.cy, -0.8, `<div class="gq-ward-tag"><b>${item.ward.ch}区</b> ${esc(item.ward.name)}</div>`);
    }
    return '';
  }).join('');

  // 今いる石段のまわり：ツムギ、これから出会う紙魚の影、戻ってきた紙魚。文字は使わず、顔と数。
  let herePanel = '';
  if (hereItem) {
    const side = hereItem.lat > 0 ? 'left' : 'right';
    const shadows = map.next.map(id => `<span class="gq-face">${ctx.face(id, 'shadow')}</span>`).join('');
    const dues = map.due.map(id => `<span class="gq-face">${ctx.face(id, 'print')}</span>`).join('');
    herePanel = bb('gq-bb-tsumugi', hereY - 12, 0, `<img class="gq-tsumugi-pin" alt="" src="${esc(ctx.tsumugi)}">`)
      + bb(`gq-bb-panel ${side}`, hereY, hereItem.lat, `<div class="gq-here-panel ${side}">
        ${map.next.length ? `<div class="gq-faces" aria-label="この先の紙魚"><span class="gq-arrow" aria-hidden="true">▸</span>${shadows}</div>` : '<p class="gq-top-mark" aria-label="いちばん上">★</p>'}
        ${map.dueCount ? `<div class="gq-faces due" aria-label="戻ってきた紙魚 ${map.dueCount} 匹"><b class="gq-due-n">${map.dueCount}</b>${dues}</div>` : ''}
      </div>`);
  }

  const post = bb('gq-bb-post', 14, 0, `<div class="gq-post">${artBox('post', 'gq-post-art')}
    <div class="gq-guide">${artBox('hatoriSmile', 'gq-face-hatori')}${map.dueCount ? `<span class="gq-due-badge" aria-label="戻ってきた紙魚 ${map.dueCount} 匹"><b>${map.dueCount}</b></span>` : ''}</div></div>`);
  const lighthouse = bb('gq-bb-top', roadEnd, 0, `<div class="gq-top-block" role="img" aria-label="道の終点の灯台">${night.complete ? '<span class="gq-full-stars" aria-label="夜の切手がすべてそろいました">✦ ⋆ ✧ ⋆ ✦</span>' : ''}<i class="gq-lighthouse-beam" aria-hidden="true"></i><img src="art/lighthouse.webp" data-lighthouse alt="" width="600" height="600" decoding="async"></div>`);

  const skies = [...new Set(map.wards.map(w => w.ch))].map(ch => `<div class="gq-sky-art" data-ward="${ch}">${artBox(`ward${Math.min(ch, 6)}`, 'gq-sky-img')}${night.wards[ch]?.complete ? constellation(ch) : ''}</div>`).join('');
  // カメラの先にある区を調べるための、区ごとの始まりの y
  const wardStarts = items.filter(item => item.type === 'ward').map(item => ({ch: item.ward.ch, y: item.from}));

  const days = streakDays(progress.streak, today, progress.dailyDays);
  const count = streakNow(progress.streak, today);
  const collected = Object.values(progress.words).filter(isRestored).length;
  const brief = dailyBrief(progress.daily);
  const openGate = map.wards.find(w => w.gate === 'open');
  const tomorrow = map.tomorrow;
  const tomorrowFaces = tomorrow.slice(0, 3).map(id => `<span class="gq-face s">${ctx.face(id, 'print')}</span>`).join('');
  const fogDensity = Math.min(0.88, 0.3 + map.dueCount / 70);
  const noticeFab = ctx.notice
    ? fab({icon: ctx.notice.act === 'update' ? 'info' : 'export', label: ctx.notice.label, cls: 'notice', attrs: 'id="gq-notice"'}) : '';

  view.className = 'gq gq-map';
  view.innerHTML = `
    <div class="gq-map-top">
      <div class="gq-streak" role="img" aria-label="${count ? `連続 ${count} 日` : '今日から始めよう'}">
        <div class="gq-pms">${days.map(postmark).join('')}</div>
        <b>${count}</b><small>日</small>
      </div>
      <p class="gq-stampcount" aria-label="集めた切手 ${collected} / ${ctx.total}"><i class="gq-tally-icon" aria-hidden="true"></i><b>${collected}</b><small>/${ctx.total}</small></p>
    </div>
    <div class="gq-road" id="gq-road"><div class="gq-road-in" id="gq-road-in">
      <div class="gq-stage" id="gq-stage">
        <div class="gq-sky" aria-hidden="true">${skies}</div>
        <i class="gq-haze" aria-hidden="true"></i>
        <canvas class="gq-road-cv" id="gq-road-cv" aria-hidden="true"></canvas>
        <svg class="gq-road-svg" id="gq-road-svg" aria-hidden="true">
          <defs>${[['paper', 'var(--paper-hi)'], ['ink', 'var(--ink)'], ['lamp', 'var(--lamp)']].map(([id, color]) =>
            `<linearGradient id="gq-road-${id}" gradientUnits="userSpaceOnUse" x1="0" x2="0"><stop offset="0" stop-color="${color}" stop-opacity="0"/><stop offset="1" stop-color="${color}" stop-opacity="1"/></linearGradient>`).join('')}</defs>
          <path class="base" id="gq-r-base"/><path class="lines" id="gq-r-lines"/><path class="walked" id="gq-r-walked"/>
          <path class="edge" id="gq-r-edge"/><path class="center" id="gq-r-center"/>
        </svg>
        ${nodes}${herePanel}${post}${lighthouse}
        ${map.fog ? `<span class="gq-fog-count" role="button" tabindex="0">${'<i></i>'.repeat(Math.min(6, Math.ceil(map.dueCount / 9)))}霧の配達 あと${Math.ceil(map.dueCount / 9)}回</span><i class="gq-fogband" aria-hidden="true" style="--d:${fogDensity.toFixed(2)}"></i>` : ''}
      </div>
    </div></div>
    <div class="gq-map-foot">
      ${ctx.warn ? `<p class="gq-warn">${esc(ctx.warn)}</p>` : ''}
      <div class="gq-chips">
        ${brief ? `<span class="gq-daily ${progress.daily.done ? 'done' : ''}" role="button" tabindex="0" aria-label="${esc(brief.name)} ${brief.count}/${brief.goal}"><i aria-hidden="true">${brief.mark}</i>${esc(brief.name)}<b>${brief.count}/${brief.goal}</b></span>` : ''}
        ${tomorrow.length ? `<span class="gq-tomorrow" role="button" tabindex="0" aria-label="明日戻ってくる紙魚 ${tomorrow.length} 匹"><small>明日</small><span class="gq-faces">${tomorrowFaces}</span><b>${tomorrow.length}</b></span>` : ''}
      </div>
      <div class="gq-dock">
        ${fab({icon: 'album', label: '切手帳', attrs: 'id="gq-album"'})}
        ${fab({icon: 'gear', label: '設定', attrs: 'id="gq-settings"'})}
        ${waxButton({label: openGate ? `${openGate.ch}区の<br>門へ` : map.fog ? '霧を<br>払う' : '配達に<br>出る', id: 'gq-go', cls: map.fog ? 'fog' : ''})}
        ${openGate ? fab({icon: 'gate', label: `${openGate.ch}区の門`, cls: 'glow', attrs: `id="gq-gate" data-gate="${openGate.ch}"`}) : ''}
        ${fab({icon: 'title', label: 'タイトル', attrs: 'id="gq-title"'})}
        ${noticeFab}
      </div>
    </div>`;

  const tower = view.querySelector('[data-lighthouse]');
  if (tower) tower.onerror = () => { tower.onerror = null; tower.src = 'art/house-48.webp'; };

  const fogIntro = announceFog(map.fog);
  if (fogIntro) view.insertAdjacentHTML('beforeend', infoDialog('霧が出ました', '戻ってきた紙魚が増えています。霧の配達で、前に会った言葉を多めに届けます。', true));
  bindInfo(view, progress.daily);
  const $ = s => view.querySelector(s);
  $('#gq-go').onclick = () => openGate ? on.gate(openGate.ch) : on.go();
  $('#gq-album').onclick = () => on.album();
  $('#gq-settings').onclick = () => on.settings();
  $('#gq-title').onclick = () => on.title();
  if ($('#gq-notice')) $('#gq-notice').onclick = () => on.notice(ctx.notice.act);
  view.querySelectorAll('[data-gate]').forEach(button => { button.onclick = () => on.gate(Number(button.dataset.gate)); });
  view.querySelectorAll('button[data-shelf]').forEach(button => { button.onclick = () => on.lamp(Number(button.dataset.shelf)); });

  // ---------- 遠近の投影 ----------
  const road = $('#gq-road');
  const inner = $('#gq-road-in');
  const stage = $('#gq-stage');
  const svg = $('#gq-road-svg');
  const landings = items.filter(i=>i.type==='lamp');
  const canvas = $('#gq-road-cv');
  const textures = new Map(), requested = new Set();
  view.querySelectorAll('.gq-gate-art').forEach(gate => {
    const imgs = [...gate.querySelectorAll('img')];
    const fail = () => {
      gate.classList.remove('gq-gate-art'); gate.removeAttribute('style');
      const label=gate.classList.contains('cleared') ? '✓' : gate.classList.contains('open') ? `${gate.dataset.gate}区` : '';
      gate.innerHTML=`<i aria-hidden="true"></i>${label ? `<span>${label}</span>` : ''}`;
    };
    imgs.forEach(img => { img.onerror = fail; });
  });
  const paths = {
    base: $('#gq-r-base'), lines: $('#gq-r-lines'), walked: $('#gq-r-walked'), edge: $('#gq-r-edge'), center: $('#gq-r-center'),
  };
  const boards = [...view.querySelectorAll('.gq-bb')].map(el => ({
    el, y: Number(el.dataset.y), lat: Number(el.dataset.lat), shown: true,
    far: el.classList.contains('far'),
    scale: el.classList.contains('gq-bb-ward') ? 0.9 : 1,
    panel: el.querySelector('.gq-here-panel'),
    house: el.querySelector('.gq-house'),
  }));
  const houses = [...view.querySelectorAll('[data-house-ward]')];
  const loadHouses = ward => {
    const index = wardStarts.findIndex(w => w.ch === ward);
    const nearby = wardStarts.slice(Math.max(0, index - 1), index + 2).map(w => w.ch);
    for (const house of houses) {
      if (!nearby.includes(Number(house.dataset.houseWard)) || !house.dataset.houseSrc) continue;
      const file = house.dataset.houseSrc;
      delete house.dataset.houseSrc;
      const img = house.querySelector('img');
      img.onload = () => house.classList.add('loaded');
      img.onerror = () => house.classList.remove('loaded');
      house.style.setProperty('--house-image', `url("${file}")`);
      img.src = file;
    }
  };
  const skyLayers = [...view.querySelectorAll('.gq-sky-art')];
  let Ws = 0, Hs = 0, frame = 0, lastWard = 0;
  let initialTsumugiScale = null;
  let panelTimer;
  let placePanel = () => {};

  const update = () => {
    frame = 0;
    if (!Ws || !Hs) return;
    const c = Math.min(total, Math.max(-1400, total - road.scrollTop)); // カメラの位置
    const project = y => projectRoad(Ws, Hs, y, c);
    const sOf = r => f / (r + Z_NEAR);
    const X = y => project(y).x;
    const Y = s => Hs * (HORIZON + H_CAMERA * s);
    const halfAt = y => project(y).half;

    // 画面の縦方向に等間隔で標本化し、同じ投影から両側を作る。
    const visibleEnd = Math.min(roadEnd, c + DRAW_DISTANCE);
    const ribbon = (cap, width) => {
      const points = roadPoints(Ws, Hs, Math.min(cap, visibleEnd), c);
      return {left: points.map(p => [p.x - p.half * width, p.y]),
        right: points.map(p => [p.x + p.half * width, p.y])};
    };
    // 上（打ち切り距離）で透明、最後の30%の手前で不透明。
    for (const color of ['paper', 'ink', 'lamp']) {
      const gradient = $(`#gq-road-${color}`);
      gradient.setAttribute('y1', project(c + DRAW_DISTANCE).y);
      gradient.setAttribute('y2', project(c + FADE_START).y);
    }
    const fmt = p => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`;
    const poly = ({left, right}) => `M${left.map(fmt).join('L')}L${right.reverse().map(fmt).join('L')}Z`;
    const full = ribbon(roadEnd, 1);
    let edge = '', previousEdge = false;
    for (const p of roadPoints(Ws,Hs,visibleEnd,c)) {
      const ch=wardAt(ranges,p.worldZ), show=!(textures.has(ch) && (ch===1 || ch===6));
      if(show) edge += `${previousEdge?'L':'M'}${fmt([p.x-p.half,p.y])}`;
      previousEdge=show;
    }
    previousEdge=false;
    for (const p of roadPoints(Ws,Hs,visibleEnd,c)) {
      const ch=wardAt(ranges,p.worldZ), show=!(textures.has(ch) && (ch===1 || ch===6));
      if(show) edge += `${previousEdge?'L':'M'}${fmt([p.x+p.half,p.y])}`;
      previousEdge=show;
    }
    paths.edge.setAttribute('d', edge);
    paths.base.setAttribute('d', poly(full));
    const walked = roadPoints(Ws, Hs, Math.min(hereY, visibleEnd), c);
    let walkedPath = '', run = [];
    const flushWalked = () => {
      if (run.length > 1) walkedPath += poly({left: run.map(p => [p.x-p.half*.5,p.y]), right: run.map(p => [p.x+p.half*.5,p.y])});
      run = [];
    };
    for (const p of walked) {
      if (textures.has(wardAt(ranges, p.worldZ))) flushWalked();
      else run.push(p);
    }
    flushWalked();
    paths.walked.setAttribute('d', hereItem ? walkedPath : '');

    // 石だたみの横線と、中央の破線（距離に合わせて間隔が縮む）。
    const yMax = visibleEnd;
    let lines = '', dashes = '';
    for (let y = Math.max(0, Math.ceil((c) / 48) * 48); y <= yMax; y += 48) {
      if (textures.has(wardAt(ranges, y))) continue;
      const s = sOf(y - c);
      const x = X(y, s), sy = Y(s).toFixed(1), w = halfAt(y, s);
      lines += `M${(x - w).toFixed(1)} ${sy}L${(x + w).toFixed(1)} ${sy}`;
    }
    for (let y = Math.max(0, Math.ceil((c) / 36) * 36); y <= yMax; y += 36) {
      if (textures.has(wardAt(ranges, y))) continue;
      const y2 = Math.min(y + 14, yMax);
      const s1 = sOf(y - c), s2 = sOf(y2 - c);
      const x1 = X(y, s1), x2 = X(y2, s2);
      const w1 = 2.4 * s1, w2 = 2.4 * s2;
      dashes += `M${(x1 - w1).toFixed(1)} ${Y(s1).toFixed(1)}L${(x1 + w1).toFixed(1)} ${Y(s1).toFixed(1)}L${(x2 + w2).toFixed(1)} ${Y(s2).toFixed(1)}L${(x2 - w2).toFixed(1)} ${Y(s2).toFixed(1)}Z`;
    }
    paths.lines.setAttribute('d', lines);
    paths.center.setAttribute('d', dashes);

    // 区ごとの絵を投影し、読込失敗時は下のSVGを残す。
    const paint = canvas.getContext?.('2d');
    if (paint) {
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      if (canvas.width !== Math.round(Ws * ratio) || canvas.height !== Math.round(Hs * ratio)) {
        canvas.width = Math.round(Ws * ratio); canvas.height = Math.round(Hs * ratio);
      }
      paint.setTransform(ratio, 0, 0, ratio, 0, 0);
      paint.clearRect(0, 0, Ws, Hs);
      if (textures.size) {
        const fog = getComputedStyle(stage).getPropertyValue('--fog-lt').trim() || '#dce4e5';
        for (let y = Math.ceil(project(visibleEnd).y); y < Hs; y++) {
          const row = roadRow(Ws, Hs, y, c);
          if (!row) continue;
          const mips = textures.get(wardAt(ranges, row.worldZ));
          if (!mips) continue;
          const tex = mips[mipLevel(row.dz)];
          const tileHeight = 512 >> mipLevel(row.dz);
          const k = tileHeight / 280;
          let v = ((row.worldZ * k) % tileHeight + tileHeight) % tileHeight;
          let remaining = Math.min(tileHeight, Math.max(1, row.dz * k));
          const landing = landings.find(i => row.worldZ >= i.cy-52 && row.worldZ < i.cy);
          if (landing) { v = tileHeight+(row.worldZ-(landing.cy-52))*96/52/(2**mipLevel(row.dz)); remaining = Math.min(tex.height-v, Math.max(.1,row.dz*96/52/(2**mipLevel(row.dz)))); }
          let destY = y;
          const sample = remaining;
          paint.globalAlpha = roadOpacity(row.worldZ - c);
          paint.fillStyle = '#24394b';
          paint.globalAlpha *= .16;
          paint.fillRect(row.x-row.half*1.1, y, row.half*2.2, 1.05);
          paint.globalAlpha = roadOpacity(row.worldZ - c);
          // タイルをまたぐ標本も折り返す。画像外を読む空白を作らない。
          while (remaining > .00001) {
            const count = Math.min(remaining, (v >= tileHeight ? tex.height : tileHeight) - v);
            const dh = count / sample;
            paint.drawImage(tex, 0, v, tex.width, count, row.x-row.half, destY, row.half*2, dh+.05);
            remaining -= count; destY += dh; v = 0;
          }
          if (row.worldZ > hereY) {
            paint.globalAlpha *= .45; paint.fillStyle = fog;
            paint.fillRect(row.x-row.half, y, row.half*2, 1.05);
          }
        }
        paint.globalAlpha = 1;
      }
    }
    const active = wardAt(ranges, c) ?? 1;
    for (const ch of [active-1,active,active+1]) {
      if (!paint || typeof Image === 'undefined' || ch < 1 || ch > 6 || requested.has(ch)) continue;
      requested.add(ch);
      if (MAP_ART.roads.includes(ch)) {
        const texture = new Image();
        texture.onload = () => {
          if (!stage.isConnected) return;
          textures.set(ch, Array.from({length:6}, (_,level) => {
            const tile=document.createElement('canvas'); tile.width=256>>level; tile.height=608>>level;
            tile.getContext('2d').drawImage(texture,0,0,tile.width,tile.height); return tile;
          })); schedule();
        };
        texture.src = `art/road/road-${ch}.webp`;
      }

    }
    if (paint) {
      const glow = (worldZ, strength) => {
        const p=project(worldZ); if (worldZ<c || worldZ>visibleEnd) return;
        paint.save(); paint.translate(p.x,p.y); paint.scale(1,.35);
        const radius=p.half*1.5, g=paint.createRadialGradient(0,0,0,0,0,radius);
        g.addColorStop(0,`rgba(242,184,75,${strength})`);g.addColorStop(1,'rgba(242,184,75,0)');
        paint.fillStyle=g;paint.fillRect(-radius,-radius,radius*2,radius*2);paint.restore();
      };
      items.filter(i=>i.type==='lamp' && i.lamp.lit===i.lamp.total).forEach(i=>glow(i.cy,i.lamp.gold === i.lamp.total ? .45 : .32));
      glow(hereY,.5);

      paint.globalAlpha=1;
    }

    // 道の上の物：位置と大きさと霧のかかり方を決める。
    for (const b of boards) {
      const r = b.y - c;
      const s = sOf(r);
      const top = b.el.classList.contains('gq-bb-top');
      const post = b.el.classList.contains('gq-bb-post');
      const pin = b.el.classList.contains('gq-bb-tsumugi');
      if (r < 0 || r >= DRAW_DISTANCE || (top && !nearLighthouse) || (post && (Math.abs(hereY - b.y) > 600 || r > 850)) || Y(s) > Hs + 140) {
        b.el.hidden = true; b.el.style.display = 'none'; b.shown = false;
        continue;
      }
      b.el.hidden = false; b.el.style.display = ''; b.shown = true;
      const fade = roadOpacity(r);
      const sx = X(b.y, s);
      const displayScale = b.panel ? 1 : pin ? tsumugiScale(s, initialTsumugiScale)
        : top ? Math.min(280, 320 * s ** .6) / 600
        : b.el.classList.contains('gq-bb-gate') ? gateScale(s) : objectScale(s * b.scale);
      if (b.house) {
        const current = Number(b.house.dataset.shelf) === map.here?.shelf;
        const {size, offset, side} = houseGeometry(Ws, project(b.y), current);
        b.house.classList.toggle('door-flipped', houseFlipped(b.house.dataset.shelf, side));
        const hx = side === 'left' ? -offset - size : offset;
        b.house.style.transform = `translate(${(hx / displayScale).toFixed(2)}px,${(-size * .85 / displayScale).toFixed(2)}px) scale(${(size / (140 * displayScale)).toFixed(3)})`;
      }
      b.el.style.transform = `translate3d(${sx.toFixed(1)}px,${Y(s).toFixed(1)}px,0) scale(${displayScale.toFixed(3)})`;
      b.el.style.opacity = String(fade);
      b.el.style.zIndex = b.panel ? '203' : String(Math.round(s * 100));
    }

    // レイアウトの測定は初期表示・リサイズ・スクロール停止時だけ。
    placePanel = () => {
    if (!stage.isConnected) return;
    const panelBoard = boards.find(b => b.panel && b.shown);
    if (panelBoard) {
      const p = project(panelBoard.y);
      const placement = panelGeometry(Ws, Hs, p.x, p.y,
        panelBoard.panel.offsetWidth, panelBoard.panel.offsetHeight,
        boards.filter(b => b.shown && (b.house || b.el.classList.contains('gq-bb-gate'))).map(b => (b.house ?? b.el.querySelector('.gq-gate') ?? b.el).getBoundingClientRect()).map(r => { const host = stage.getBoundingClientRect(); return {left:r.left-host.left, right:r.right-host.left, top:r.top-host.top, bottom:r.bottom-host.top}; }),
        100 * tsumugiScale(p.scale, initialTsumugiScale));
      panelBoard.panel.style.visibility = placement ? '' : 'hidden';
      if (!placement) return;
      const {left, top} = placement;
      panelBoard.panel.style.transform = `translate(${left - p.x}px,${top - p.y}px)`;
    }

    };
    placePanel();
    // カメラの少し先にある区の絵を、背景に出す。
    let ward = wardStarts[0]?.ch ?? 1;
    for (const w of wardStarts) if (w.y <= c + 500) ward = w.ch;
    if (ward !== lastWard) {
      lastWard = ward;
      loadHouses(ward);
      skyLayers.forEach(layer => layer.classList.toggle('on', Number(layer.dataset.ward) === ward));
    }
  };
  const schedule = () => { if (!frame) frame = requestAnimationFrame(update); };

  // 枠の大きさが決まったら、今いる石段が画面中央より少し下に来るカメラ位置にする。大きさが変わっても、カメラの位置は保つ。
  let cameraAt = null;
  const measure = () => {
    const w = road.clientWidth, h = road.clientHeight;
    if (!w || !h) return;
    if (Ws && Hs) cameraAt = Math.min(total, Math.max(-1400, total - road.scrollTop));
    Ws = w; Hs = h;
    for (const layer of skyLayers) {
      const geometry = skyGeometry(Ws, Hs, Number(layer.dataset.ward));
      for (const [key, value] of Object.entries(geometry)) layer.style[key] = `${value}px`;
    }
    if (cameraAt === null) {
      // ツムギの中心を画面の58.5%へ。足元は同じ石段の投影点に固定する。
      const feet = window.innerHeight * .585 + 50 - road.getBoundingClientRect().top;
      const scale = Math.max(.35, Math.min(.85, (feet / Hs - HORIZON) / H_CAMERA));
      cameraAt = hereY + Z_NEAR - f / scale;
    }
    inner.style.height = `${Hs + total + 1400}px`;
    stage.style.height = `${Hs}px`;
    svg.setAttribute('viewBox', `0 0 ${Ws} ${Hs}`);
    road.scrollTop = total - cameraAt;
    if (initialTsumugiScale === null) {
      initialTsumugiScale = projectRoad(Ws, Hs, hereY - 12,
        Math.min(total, Math.max(-1400, total - road.scrollTop))).scale;
    }
    update();
    placePanel();
  };
  road.addEventListener('scroll', () => {
    schedule();
    clearTimeout(panelTimer);
    panelTimer = setTimeout(() => { if (frame) { cancelAnimationFrame(frame); update(); } placePanel(); }, 140);
  }, {passive: true});
  measure();
  requestAnimationFrame(() => {
    measure();
    if (fogIntro && view.isConnected) $('.gq-fog-intro')?.showModal();
  });
  if (typeof ResizeObserver !== 'undefined') new ResizeObserver(measure).observe(road);
}

// 6区それぞれの星座。星は紙魚の絵とは別の層に描く。
function constellation(ch) {
  const shapes = [
    [[12,70],[32,25],[52,60],[75,18],[91,48]],
    [[10,25],[35,15],[55,45],[80,30],[65,80]],
    [[12,60],[30,30],[60,20],[85,55],[52,75],[30,30]],
    [[15,22],[45,35],[75,15],[60,70],[25,80],[45,35]],
    [[10,50],[30,15],[50,50],[75,10],[90,65],[50,50]],
    [[12,30],[40,15],[75,25],[88,65],[50,85],[20,65],[12,30]],
  ];
  const points = shapes[(ch - 1) % shapes.length];
  return `<svg class="gq-constellation" viewBox="0 0 100 100"><polyline points="${points.map(p => p.join(',')).join(' ')}"/>${points.map(([x,y]) => `<circle cx="${x}" cy="${y}" r="2"/>`).join('')}</svg>`;
}
