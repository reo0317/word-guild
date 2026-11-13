import {isRestored} from './srs.mjs';
import {visitors, rareStatus} from './rare.mjs';
// 道の地図（トップの画面）。手前（下）から奥（上）へ、遠近のついた道が続く。
// 手前が近くて大きく、奥へ行くほど小さく霧にかすむ。今いる石段は手前寄りに見える。
// DOM は container.innerHTML に描くだけで、ゲームの進行や保存には触らない。押されたものは ctx.on の関数に渡す。
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
import {streakNow} from './daily.mjs';
import {WARDS} from './chara-svg.mjs';

const H = {post: 170, ward: 64, step: 54, lamp: 92, gate: 112, top: 180};
const HORIZON = 0.14;  // 地平線の高さ（道の枠の高さに対する割合）
// 世界座標の単位は任意。f は画面幅を単位とする焦点距離。
export const A = 0.225; // 中心線の横振幅（最接近時、道の外縁が画面の10%まで来る）
export const L = 1100;  // 奥行き方向のくねりの周期
export const W = 0.35; // 世界座標で一定の道幅
export const f = 700;  // 焦点距離（画面幅に対する投影倍率の基準）
export const H_CAMERA = 0.86; // カメラの高さ（画面の縦横比で補正して投影）
const Z_NEAR = 700;    // 下端での最短距離。これより近い地面は描かない
const PHASE = Math.PI / 2;
const S_MIN = 0.07;
export const DRAW_DISTANCE = 1800;
export const LIGHTHOUSE_DISTANCE = H.step * 10;

export function lighthouseVisible(remaining) {
  return remaining >= 0 && remaining <= LIGHTHOUSE_DISTANCE;
}

// 画面上の縦間隔を1px以下にし、打ち切り位置も必ず標本に含める。
export function roadPoints(width, height, end, camera = 0) {
  const cap = Math.max(camera, Math.min(end, camera + DRAW_DISTANCE));
  const near = projectRoad(width, height, camera, camera);
  const far = projectRoad(width, height, cap, camera);
  const count = Math.max(1, Math.ceil(near.y - far.y));
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
export function roadAmplitude(distance) {
  const t = Math.max(0, Math.min(1, (distance - 550) / 1650));
  return (1 - t) ** 3;
}
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

export function houseGeometry(width, projection, current = false) {
  const {x, half, scale} = projection;
  const side = x >= width / 2 ? 'left' : 'right';
  const room = Math.max(0, (side === 'left' ? x : width - x) - half - 16);
  const size = Math.min(room, Math.max(36, Math.min(140, (current ? 160 : 132) * Math.min(1, scale) ** 0.6)));
  return {x, size, offset: half + 8, side};
}

// 頭上に近い空き位置を選ぶ。画面端・家・ツムギ自身を避ける。
export function panelGeometry(width, height, x, feet, pw, ph, objects, tsumugiSize = 100) {
  const preferred = {left: Math.max(8, Math.min(width - pw - 8, x - pw / 2)), top: feet - tsumugiSize - 12 - ph};
  const obstacles = [...objects, {left:x - tsumugiSize / 2, right:x + tsumugiSize / 2, top:feet - tsumugiSize, bottom:feet}];
  const xs = [preferred.left, 8, width - pw - 8, ...obstacles.flatMap(h => [h.left - pw - 6, h.right + 6])];
  const ys = [preferred.top, 8, ...obstacles.flatMap(h => [h.top - ph - 6, h.bottom + 6])];
  const clear = ({left, top}) => left >= 8 && left + pw <= width - 8 && top >= 8 && top + ph <= height - 8
    && !obstacles.some(h => left < h.right + 5 && left + pw > h.left - 5 && top < h.bottom + 5 && top + ph > h.top - 5);
  // 頭上 → 左上 → 右上。横の候補も頭より上に保つ。
  for (const left of [preferred.left, Math.max(8, x - 56 - pw), Math.min(width - pw - 8, x + 56)]) {
    const candidate = {left, top: preferred.top};
    if (clear(candidate)) return candidate;
  }
  let best = {...preferred, top: Math.max(8, Math.min(height - ph - 8, preferred.top))}, score = Infinity;
  for (const left of xs) for (const top of ys) {
    if (left < 8 || left + pw > width - 8 || top < 8 || top + ph > height - 8) continue;
    if (obstacles.some(h => left < h.right + 5 && left + pw > h.left - 5 && top < h.bottom + 5 && top + ph > h.top - 5)) continue;
    const distance = (left - preferred.left) ** 2 + (top - preferred.top) ** 2;
    if (distance < score) { best = {left, top}; score = distance; }
  }
  return best;
}

const DAILY_SHORT = {revenge: ['↺', '戻ってきた紙魚'], fresh: ['✦', '新しい紙魚'], clean: ['✓', 'ヒントなし'], finish: ['▶', '配達']};

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

// 速達の短い表示：{mark, name, count, goal}。説明の文章は出さず、印と数にする。
export function dailyBrief(daily) {
  if (!daily) return null;
  const [mark, name] = DAILY_SHORT[daily.kind] ?? ['', ''];
  return {mark, name, count: Math.min(daily.count, daily.goal), goal: daily.goal};
}

// 直近7日（左が6日前、右が今日）の消印。streak は {count, last, best}。
export function streakDays(streak, today) {
  const count = streakNow(streak, today);
  const last = streak?.last ?? 0;
  return Array.from({length: 7}, (_, i) => {
    const day = today - 6 + i;
    const date = new Date(day * 86400000).getUTCDate();
    return {day, date, on: count > 0 && day <= last && day > last - count};
  });
}

function postmark(day) {
  return `<span class="gq-pm ${day.on ? 'on' : ''}" title="${day.date}日"><svg viewBox="0 0 30 30" aria-hidden="true"><circle cx="15" cy="15" r="13"/><circle cx="15" cy="15" r="9.5"/><text x="15" y="19" text-anchor="middle">${day.date}</text></svg></span>`;
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
        const isHere = Boolean(here) && here.ch === ward.ch && here.shelf === lamp.shelf && here.step === si + 1;
        add('step', H.step, {ward, lamp, step, si, isHere, k: k++});
      });
      add('lamp', H.lamp, {ward, lamp, k: k++});
    }
    add('gate', H.gate, {ward, k: k++});
  });
  add('top', H.top, {}, H.top - 70);
  return {items, total: y};
}

export function renderMap(view, ctx) {
  const {map, today, progress, on} = ctx;
  const {items, total} = layout(map);
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
  const hereY = hereItem ? hereItem.cy : 0;

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
        <span class="gq-house-art" aria-hidden="true"><i class="gq-house-halo"></i><i class="gq-house-shadow"></i>
        <img class="gq-house-color" alt="" width="140" height="140" decoding="async">
        <i class="gq-house-warm"></i><i class="gq-house-sparks"></i></span>
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
      const label = {hidden: '', open: `${ward.ch}区`, cleared: '✓'}[ward.gate];
      const tag = ward.gate === 'open' ? 'button' : 'div';
      return bb(`gq-bb-gate${far}`, item.cy, item.lat,
        `<${tag} ${tag === 'button' ? 'type="button" data-gate="' + ward.ch + '"' : ''} class="gq-gate ${ward.gate}"
        ${ward.gate === 'open' ? `aria-label="${ward.ch}区の門へ"` : ''}><i aria-hidden="true"></i>${label ? `<span>${label}</span>` : ''}</${tag}>`);
    }
    if (item.type === 'ward') {
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
    herePanel = bb('gq-bb-tsumugi', hereY, hereItem.lat, `<img class="gq-tsumugi-pin" alt="" src="${esc(ctx.tsumugi)}">`)
      + bb(`gq-bb-panel ${side}`, hereY, hereItem.lat, `<div class="gq-here-panel ${side}">
        ${map.next.length ? `<div class="gq-faces" aria-label="この先の紙魚"><span class="gq-arrow" aria-hidden="true">▸</span>${shadows}</div>` : '<p class="gq-top-mark" aria-label="いちばん上">★</p>'}
        ${map.dueCount ? `<div class="gq-faces due" aria-label="戻ってきた紙魚 ${map.dueCount} 匹"><b class="gq-due-n">${map.dueCount}</b>${dues}</div>` : ''}
      </div>`);
  }

  const post = bb('gq-bb-post', 14, 0, `<div class="gq-post">${artBox('post', 'gq-post-art')}
    <div class="gq-guide">${artBox('hatoriSmile', 'gq-face-hatori')}${map.dueCount ? `<span class="gq-due-badge" aria-label="戻ってきた紙魚 ${map.dueCount} 匹"><b>${map.dueCount}</b></span>` : ''}</div></div>`);
  const lighthouse = bb('gq-bb-top', roadEnd, 0, `<div class="gq-top-block" role="img" aria-label="道の終点の灯台">${night.complete ? '<span class="gq-full-stars" aria-label="夜の切手がすべてそろいました">✦ ⋆ ✧ ⋆ ✦</span>' : ''}<i class="gq-lighthouse-beam" aria-hidden="true"></i><img src="art/house-48.webp" alt="" width="600" height="600" decoding="async"></div>`);

  const skies = [...new Set(map.wards.map(w => w.ch))].map(ch => `<div class="gq-sky-art" data-ward="${ch}">${artBox(`ward${Math.min(ch, 6)}`, 'gq-sky-img')}${night.wards[ch]?.complete ? constellation(ch) : ''}</div>`).join('');
  // カメラの先にある区を調べるための、区ごとの始まりの y
  const wardStarts = items.filter(item => item.type === 'ward').map(item => ({ch: item.ward.ch, y: item.from}));

  const days = streakDays(progress.streak, today);
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
        <svg class="gq-road-svg" id="gq-road-svg" aria-hidden="true">
          <path class="base" id="gq-r-base"/><path class="lines" id="gq-r-lines"/><path class="walked" id="gq-r-walked"/>
          <path class="edge" id="gq-r-edge"/><path class="center" id="gq-r-center"/>
        </svg>
        <i class="gq-road-cap" id="gq-road-cap" aria-hidden="true"></i>
        ${nodes}${herePanel}${post}${lighthouse}
        ${map.fog ? `<i class="gq-fogband" aria-hidden="true" style="--d:${fogDensity.toFixed(2)}"></i>` : ''}
      </div>
    </div></div>
    <div class="gq-map-foot">
      ${ctx.warn ? `<p class="gq-warn">${esc(ctx.warn)}</p>` : ''}
      <div class="gq-chips">
        ${brief ? `<span class="gq-daily ${progress.daily.done ? 'done' : ''}" aria-label="今日の速達 ${brief.count}/${brief.goal}"><i aria-hidden="true">${brief.mark}</i>${esc(brief.name)}<b>${brief.count}/${brief.goal}</b></span>` : ''}
        ${tomorrow.length ? `<span class="gq-tomorrow" aria-label="明日戻ってくる紙魚 ${tomorrow.length} 匹"><small>明日</small><span class="gq-faces">${tomorrowFaces}</span><b>${tomorrow.length}</b></span>` : ''}
      </div>
      <div class="gq-dock">
        ${fab({icon: 'album', label: '切手帳', attrs: 'id="gq-album"'})}
        ${fab({icon: 'gear', label: '設定', attrs: 'id="gq-settings"'})}
        ${waxButton({label: map.fog ? '霧を<br>払う' : '配達に<br>出る', id: 'gq-go', cls: map.fog ? 'fog' : ''})}
        ${openGate ? fab({icon: 'gate', label: `${openGate.ch}区の門`, cls: 'glow', attrs: `id="gq-gate" data-gate="${openGate.ch}"`}) : ''}
        ${fab({icon: 'title', label: 'タイトル', attrs: 'id="gq-title"'})}
        ${noticeFab}
      </div>
    </div>`;

  const $ = s => view.querySelector(s);
  $('#gq-go').onclick = () => on.go();
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
    const cap = $('#gq-road-cap');
    cap.style.height = `${project(visibleEnd).y + 31}px`;
    cap.style.display = roadEnd > c + DRAW_DISTANCE ? '' : 'none';
    const fmt = p => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`;
    const poly = ({left, right}) => `M${left.map(fmt).join('L')}L${right.reverse().map(fmt).join('L')}Z`;
    const full = ribbon(roadEnd, 1);
    paths.edge.setAttribute('d', `M${full.left.map(fmt).join('L')}M${full.right.map(fmt).join('L')}`);
    paths.base.setAttribute('d', poly(full));
    paths.walked.setAttribute('d', hereItem ? poly(ribbon(Math.min(hereY, roadEnd), 0.5)) : '');

    // 石だたみの横線と、中央の破線（距離に合わせて間隔が縮む）。
    const yMax = visibleEnd;
    let lines = '', dashes = '';
    for (let y = Math.max(0, Math.ceil((c) / 48) * 48); y <= yMax; y += 48) {
      const s = sOf(y - c);
      const x = X(y, s), sy = Y(s).toFixed(1), w = halfAt(y, s);
      lines += `M${(x - w).toFixed(1)} ${sy}L${(x + w).toFixed(1)} ${sy}`;
    }
    for (let y = Math.max(0, Math.ceil((c) / 36) * 36); y <= yMax; y += 36) {
      const y2 = Math.min(y + 14, yMax);
      const s1 = sOf(y - c), s2 = sOf(y2 - c);
      const x1 = X(y, s1), x2 = X(y2, s2);
      const w1 = 2.4 * s1, w2 = 2.4 * s2;
      dashes += `M${(x1 - w1).toFixed(1)} ${Y(s1).toFixed(1)}L${(x1 + w1).toFixed(1)} ${Y(s1).toFixed(1)}L${(x2 + w2).toFixed(1)} ${Y(s2).toFixed(1)}L${(x2 - w2).toFixed(1)} ${Y(s2).toFixed(1)}Z`;
    }
    paths.lines.setAttribute('d', lines);
    paths.center.setAttribute('d', dashes);

    // 道の上の物：位置と大きさと霧のかかり方を決める。
    for (const b of boards) {
      const r = b.y - c;
      const s = sOf(r);
      const top = b.el.classList.contains('gq-bb-top');
      const post = b.el.classList.contains('gq-bb-post');
      const pin = b.el.classList.contains('gq-bb-tsumugi');
      if (r < 0 || r > DRAW_DISTANCE || (top && !lighthouseVisible(roadEnd - hereY)) || (post && (Math.abs(hereY - b.y) > 600 || r > 850)) || Y(s) > Hs + 140) {
        b.el.hidden = true; b.el.style.display = 'none'; b.shown = false;
        continue;
      }
      b.el.hidden = false; b.el.style.display = ''; b.shown = true;
      const fade = Math.min(1, Math.max(0, (s - S_MIN) / 0.2)) * (b.far ? 0.55 : 1);
      const sx = X(b.y, s);
      const displayScale = b.panel ? 1 : pin ? tsumugiScale(s, initialTsumugiScale)
        : top ? objectScale(Math.min(240, 600 * s ** .6) / 600) : objectScale(s * b.scale);
      if (b.house) {
        const current = Number(b.house.dataset.shelf) === map.here?.shelf;
        const {size, offset, side} = houseGeometry(Ws, project(b.y), current);
        const hx = side === 'left' ? -offset - size : offset;
        b.house.style.transform = `translate(${(hx / displayScale).toFixed(2)}px,${(-size * .85 / displayScale).toFixed(2)}px) scale(${(size / (140 * displayScale)).toFixed(3)})`;
      }
      b.el.style.transform = `translate3d(${sx.toFixed(1)}px,${Y(s).toFixed(1)}px,0) scale(${displayScale.toFixed(3)})`;
      b.el.style.opacity = b.panel || pin ? '1' : top ? '1' : fade.toFixed(2);
      b.el.style.zIndex = b.panel ? '203' : pin ? '202' : String(Math.round(s * 100));
    }

    // レイアウトの測定は初期表示・リサイズ・スクロール停止時だけ。
    placePanel = () => {
    if (!stage.isConnected) return;
    const panelBoard = boards.find(b => b.panel && b.shown);
    if (panelBoard) {
      const origin = stage.getBoundingClientRect();
      const obstacles = boards.filter(b => b.shown && !b.panel).flatMap(b =>
        [...b.el.querySelectorAll('.gq-house, .gq-lamp-node, .gq-post')].map(el => {
          const r = el.getBoundingClientRect();
          return {left:r.left - origin.left, right:r.right - origin.left,
            top:r.top - origin.top, bottom:r.bottom - origin.top};
        }));
      const p = project(panelBoard.y);
      const {left, top} = panelGeometry(Ws, Hs, p.x, p.y,
        panelBoard.panel.offsetWidth, panelBoard.panel.offsetHeight, obstacles,
        100 * tsumugiScale(p.scale, initialTsumugiScale));
      panelBoard.panel.style.visibility = '';
      panelBoard.panel.style.transform = `translate(${left - p.x}px,${top - p.y}px)`;
    }

    };
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
      initialTsumugiScale = projectRoad(Ws, Hs, hereY,
        Math.min(total, Math.max(-1400, total - road.scrollTop))).scale;
    }
    update();
    placePanel();
  };
  road.addEventListener('scroll', () => {
    const panel = boards.find(b => b.panel);
    if (panel) panel.panel.style.visibility = 'hidden';
    schedule();
    clearTimeout(panelTimer);
    panelTimer = setTimeout(() => { if (frame) { cancelAnimationFrame(frame); update(); } placePanel(); }, 140);
  }, {passive: true});
  measure();
  requestAnimationFrame(measure);
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
