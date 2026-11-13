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
// 遠近：スクロール量を「カメラの位置」にして、道の上の各地点（world の y）を毎回投影し直す。
//   画面の y = 地平線 + (手前の基準線 - 地平線) × s、s = 1 / (1 + 距離 / F)
import {esc, fab, waxButton, miniHouse} from './dom.mjs';
import {artBox, HOUSE_ART} from './art.mjs';
import {streakNow} from './daily.mjs';
import {WARDS} from './chara-svg.mjs';

const H = {post: 170, ward: 64, step: 54, lamp: 92, gate: 112, top: 180};
const HORIZON = 0.14;  // 地平線の高さ（道の枠の高さに対する割合）
const NEAR = 0.8;      // カメラの足もと（今いる石段）の高さ
const ROAD_W = 0.13;   // 手前での道の半幅（枠の幅に対する割合）
const SWING = 0.42;    // 手前での横の振れ幅（枠の幅に対する割合）
const S_MIN = 0.07;    // これより遠いものは描かない

// 家は盤面の縮尺から独立した表示幅にする。道の両側に8pxの隙間を残す。
export function houseGeometry(width, scale, lat = 0, current = false) {
  const roadHalf = width * ROAD_W * scale;
  const room = Math.max(36, width / 2 - roadHalf - 16);
  const size = Math.min(room, Math.max(36, Math.min(140, (current ? 160 : 132) * Math.min(1, scale) ** 0.6)));
  const reserve = Math.min(room, Math.max(36, Math.min(140, 160 * Math.min(1, scale) ** 0.6)));
  const inset = roadHalf + reserve + 16;
  const x = Math.max(Math.min(inset, width / 2), Math.min(Math.max(width - inset, width / 2), width / 2 + lat * width * SWING * scale));
  return {x, size, offset: roadHalf + 8};
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

// 道の左右の振れ。ノードの番号で決める（-0.5〜0.5）。
const latOf = k => Math.sin(k * 0.5) * 0.5;

export function renderMap(view, ctx) {
  const {map, today, progress, on} = ctx;
  const {items, total} = layout(map);
  const hereWard = map.wards.findIndex(w => w.ch === map.here?.ch);
  const ink = ward => (WARDS[ward.ch] ?? WARDS[1]).inks[0][1];

  // 道の中心線（ノードの点列）。なめらかにつなぐ。
  const pts = [{y: 0, lat: 0}];
  let hereItem = null;
  for (const item of items) {
    if (item.type === 'step' || item.type === 'lamp' || item.type === 'gate') {
      item.lat = latOf(item.k);
      pts.push({y: item.cy, lat: item.lat});
      if (item.isHere) hereItem = item;
    }
  }
  pts.push({y: total, lat: 0});
  const latAt = y => {
    if (y <= pts[0].y) return pts[0].lat;
    if (y >= pts.at(-1).y) return pts.at(-1).lat;
    let lo = 0, hi = pts.length - 1;
    while (hi - lo > 1) { const mid = (lo + hi) >> 1; if (pts[mid].y <= y) lo = mid; else hi = mid; }
    const t = (y - pts[lo].y) / (pts[hi].y - pts[lo].y);
    const e = (1 - Math.cos(Math.PI * t)) / 2;
    return pts[lo].lat + (pts[hi].lat - pts[lo].lat) * e;
  };
  const hereY = hereItem ? hereItem.cy : 0;

  const bb = (cls, y, lat, inner) =>
    `<div class="gq-bb ${cls}" data-y="${y.toFixed(1)}" data-lat="${lat.toFixed(3)}">${inner}</div>`;

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
      const file = HOUSE_ART[lamp.shelf];
      const reveal = lamp.got ? Math.min(5, Math.ceil(lamp.got / lamp.total * 5)) * 20 : 0;
      const pin = `<button type="button" class="gq-house ${lamp.shelf % 2 ? 'left' : 'right'}${done ? ' complete' : ''}${lit ? ' lit' : ''}${gold ? ' gold' : ''}"
        data-shelf="${lamp.shelf}" data-house-ward="${item.ward.ch}"${file ? ` data-house-src="${file}"` : ''}
        style="--reveal:${100 - reveal}%" aria-label="街灯${lamp.shelf}の${letter ? '手紙' : '切手帳'}を開く">
        <span class="gq-house-fallback" aria-hidden="true">${miniHouse()}</span>
        <span class="gq-house-art" aria-hidden="true"><i class="gq-house-halo"></i><i class="gq-house-shadow"></i>
        <img class="gq-house-color" alt="" width="192" height="192" loading="lazy" decoding="async">
        <i class="gq-house-warm"></i><i class="gq-house-sparks"></i></span>
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
      + bb(`gq-bb-panel ${side}`, hereY + 22, hereItem.lat, `<div class="gq-here-panel ${side}">
        ${map.next.length ? `<div class="gq-faces" aria-label="この先の紙魚"><span class="gq-arrow" aria-hidden="true">▸</span>${shadows}</div>` : '<p class="gq-top-mark" aria-label="いちばん上">★</p>'}
        ${map.dueCount ? `<div class="gq-faces due" aria-label="戻ってきた紙魚 ${map.dueCount} 匹"><b class="gq-due-n">${map.dueCount}</b>${dues}</div>` : ''}
      </div>`);
  }

  const post = bb('gq-bb-post', 14, 0, `<div class="gq-post">${artBox('post', 'gq-post-art')}
    <div class="gq-guide">${artBox('hatoriSmile', 'gq-face-hatori')}${map.dueCount ? `<span class="gq-due-badge" aria-label="戻ってきた紙魚 ${map.dueCount} 匹"><b>${map.dueCount}</b></span>` : ''}</div></div>`);
  const lighthouse = bb('gq-bb-top', total - 40, 0, `<div class="gq-top-block"><svg viewBox="0 0 120 150" aria-hidden="true">
    <path d="M60 4l-46 40M60 4l46 40" class="beam"/><rect x="48" y="30" width="24" height="16" rx="3" class="lamp"/><path d="M44 46h32l8 100H36z" class="tower"/>
    <path d="M42 80h36M39 112h42" class="band"/></svg><b>灯台</b></div>`);

  const skies = [...new Set(map.wards.map(w => w.ch))].map(ch => `<div class="gq-sky-art" data-ward="${ch}">${artBox(`ward${Math.min(ch, 6)}`, 'gq-sky-img')}</div>`).join('');
  // カメラの先にある区を調べるための、区ごとの始まりの y
  const wardStarts = items.filter(item => item.type === 'ward').map(item => ({ch: item.ward.ch, y: item.from}));

  const days = streakDays(progress.streak, today);
  const count = streakNow(progress.streak, today);
  const collected = Object.keys(progress.words).length;
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

  const update = () => {
    frame = 0;
    if (!Ws || !Hs) return;
    const c = Math.min(total, Math.max(0, total - road.scrollTop)); // カメラの位置
    const F = Hs * 0.8;
    const yh = Hs * HORIZON;
    const span = Hs * NEAR - yh;
    const sOf = r => 1 / (1 + Math.max(r, -0.55 * F) / F);
    const X = (y, s) => houseGeometry(Ws, s, latAt(y)).x;
    const Y = s => yh + span * s;
    const rw = Ws * ROAD_W;

    // 道の帯：画面の上では等間隔になるように、遠くほど間隔をあけて標本を取る。
    const S_MAX = 1.6;
    const N = 90;
    const ribbon = (cap, width) => {
      const left = [], right = [];
      for (let i = 0; i <= N; i++) {
        const s0 = S_MAX * Math.pow(S_MIN / S_MAX, i / N);
        const y = Math.min(cap, Math.min(total, Math.max(0, c + F * (1 / s0 - 1))));
        const s = sOf(y - c);
        const x = X(y, s), sy = Y(s), w = rw * s * width;
        left.push([x - w, sy]); right.push([x + w, sy]);
      }
      return {left, right};
    };
    const fmt = p => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`;
    const poly = ({left, right}) => `M${left.map(fmt).join('L')}L${right.reverse().map(fmt).join('L')}Z`;
    const full = ribbon(total, 1);
    paths.edge.setAttribute('d', `M${full.left.map(fmt).join('L')}M${full.right.map(fmt).join('L')}`);
    paths.base.setAttribute('d', poly(full));
    paths.walked.setAttribute('d', hereItem ? poly(ribbon(hereY, 0.5)) : '');

    // 石だたみの横線と、中央の破線（距離に合わせて間隔が縮む）。
    const yMax = Math.min(total, c + F * (1 / S_MIN - 1));
    let lines = '', dashes = '';
    for (let y = Math.max(0, Math.ceil((c - 0.5 * F) / 48) * 48); y <= yMax; y += 48) {
      const s = sOf(y - c);
      const x = X(y, s), sy = Y(s).toFixed(1), w = rw * s;
      lines += `M${(x - w).toFixed(1)} ${sy}L${(x + w).toFixed(1)} ${sy}`;
    }
    for (let y = Math.max(0, Math.ceil((c - 0.5 * F) / 36) * 36); y <= yMax; y += 36) {
      const y2 = y + 14;
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
      if (r < -0.5 * F || s < S_MIN) {
        if (b.shown) { b.el.style.display = 'none'; b.shown = false; }
        continue;
      }
      if (!b.shown) { b.el.style.display = ''; b.shown = true; }
      const fade = Math.min(1, Math.max(0, (s - S_MIN) / 0.2)) * (b.far ? 0.55 : 1);
      const sx = X(b.y, s);
      if (b.house) {
        const current = Number(b.house.dataset.shelf) === map.here?.shelf;
        const {size, offset} = houseGeometry(Ws, s, latAt(b.y), current);
        // 親の遠近縮小を打ち消し、画像も代替の家も同じ表示幅にする。
        b.house.style.setProperty('--house-size', `${(size / s).toFixed(3)}px`);
        b.house.style.setProperty('--house-offset', `${(offset / s).toFixed(3)}px`);
      }
      if (b.panel) b.panel.className = `gq-here-panel ${sx > Ws / 2 ? 'left' : 'right'}`; // 道の広い側に出す
      b.el.style.transform = `translate3d(${sx.toFixed(1)}px,${Y(s).toFixed(1)}px,0) scale(${(s * b.scale).toFixed(3)})`;
      b.el.style.opacity = fade.toFixed(2);
      b.el.style.zIndex = String(Math.round(s * 100));
    }

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

  // 枠の大きさが決まったら、カメラを今いる石段に置く。大きさが変わっても、カメラの位置は保つ。
  let cameraAt = hereY;
  const measure = () => {
    const w = road.clientWidth, h = road.clientHeight;
    if (!w || !h) return;
    if (Ws && Hs) cameraAt = Math.min(total, Math.max(0, total - road.scrollTop));
    Ws = w; Hs = h;
    inner.style.height = `${Hs + total}px`;
    stage.style.height = `${Hs}px`;
    svg.setAttribute('viewBox', `0 0 ${Ws} ${Hs}`);
    road.scrollTop = total - cameraAt;
    update();
  };
  road.addEventListener('scroll', schedule, {passive: true});
  measure();
  requestAnimationFrame(measure);
  if (typeof ResizeObserver !== 'undefined') new ResizeObserver(measure).observe(road);
}
