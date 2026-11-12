// 坂道の地図（局の画面）。下端が郵便局、上端が灯台。DOM は container.innerHTML に描くだけで、
// ゲームの進行や保存には触らない。押されたものは ctx.on の関数に渡す。
//
// renderMap(view, ctx)
//   ctx.map       stages.mjs の buildMap の結果
//   ctx.today     日番号
//   ctx.progress  進捗（streak・daily・words を読む）
//   ctx.total     語の総数（1,400）
//   ctx.face(id, state)   紙魚の小さな顔の SVG 文字列
//   ctx.message   ハトリ局長の一言
//   ctx.notice    {text, label, act} か null（条件つきの1行）
//   ctx.warn      保存できないときの文
//   ctx.on        {go, gate, lamp, album, settings, credits, title, notice}
import {esc} from './dom.mjs';
import {artBox} from './art.mjs';
import {streakNow} from './daily.mjs';
import {WARDS} from './chara-svg.mjs';

const H = {post: 200, ward: 58, step: 38, lamp: 80, gate: 96, top: 170, hereExtra: 100};

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

// 縦の配置を下から積んで決める。y は「下端からの高さ」。
function layout(map) {
  const items = [];
  let y = 0;
  const add = (type, h, data = {}, cy = h / 2) => {
    items.push({type, from: y, h, cy: y + cy, ...data});
    y += h;
  };
  const here = map.here;
  add('post', H.post, {}, H.post - 40);
  const lampSegments = [];
  const wardSegments = [];
  let k = 0;
  map.wards.forEach((ward, wi) => {
    const wardStart = y;
    add('ward', H.ward, {ward, wi});
    for (const lamp of ward.lamps) {
      const lampStart = y;
      lamp.steps.forEach((step, si) => {
        const isHere = here && here.ch === ward.ch && here.shelf === lamp.shelf && here.step === si + 1;
        add('step', isHere ? H.step + H.hereExtra : H.step, {ward, lamp, step, si, isHere, k: k++}, H.step / 2);
      });
      add('lamp', H.lamp, {ward, lamp, k: k++});
      lampSegments.push({ward, start: lampStart, end: y});
    }
    add('gate', H.gate, {ward, k: k++});
    wardSegments.push({ward, wi, start: wardStart, end: y});
  });
  add('top', H.top, {}, 56);
  return {items, total: y, lampSegments, wardSegments};
}

const nodeX = k => 50 + 24 * Math.sin(k * 0.5);

export function renderMap(view, ctx) {
  const {map, today, progress, on} = ctx;
  const {items, total, lampSegments, wardSegments} = layout(map);
  const top = y => (total - y).toFixed(1);
  const hereWard = map.wards.findIndex(w => w.ch === map.here?.ch);
  const ink = ward => (WARDS[ward.ch] ?? WARDS[1]).inks[0][1];

  // 道の点列。下から上へ。
  const roadPoints = [[50, total - items[0].cy]];
  let hereItem = null;
  for (const item of items) {
    if (item.type === 'step' || item.type === 'lamp' || item.type === 'gate') {
      item.x = nodeX(item.k);
      roadPoints.push([item.x, total - item.cy]);
      if (item.isHere) hereItem = item;
    }
  }
  roadPoints.push([50, total - (total - 56)]);
  const herePointIndex = hereItem ? roadPoints.findIndex(p => p[0] === hereItem.x && p[1] === total - hereItem.cy) : 0;
  const poly = points => points.map(p => `${p[0].toFixed(2)},${p[1].toFixed(1)}`).join(' ');

  const bands = lampSegments.map(seg => {
    const fogged = map.wards.indexOf(seg.ward) > hereWard + 1;
    return `<i class="gq-band ${fogged ? 'far' : ''}" style="top:${top(seg.end)}px;height:${seg.end - seg.start}px">${artBox(`ward${seg.ward.ch}`, 'gq-band-art')}</i>`;
  }).join('');

  const nodes = items.map(item => {
    const t = top(item.cy);
    if (item.type === 'step') {
      const cls = item.isHere ? 'here' : item.step.passed ? 'done' : 'todo';
      return `<i class="gq-step ${cls}" style="left:${item.x.toFixed(1)}%;top:${t}px;--wc:${ink(item.ward)}"></i>`;
    }
    if (item.type === 'lamp') {
      const {lamp} = item;
      const lit = lamp.lit === lamp.total;
      const gold = lamp.gold === lamp.total;
      const isHereLamp = map.here && map.here.shelf === lamp.shelf;
      const remain = isHereLamp ? lamp.steps.length - map.here.step + 1 : 0;
      return `<button type="button" class="gq-lamp-node ${gold ? 'gold' : lit ? 'lit' : ''}" data-shelf="${lamp.shelf}"
        style="left:${item.x.toFixed(1)}%;top:${t}px;--p:${Math.round(lamp.got / lamp.total * 100)}%;--wc:${ink(item.ward)}"
        aria-label="街灯${lamp.shelf}　切手 ${lamp.got}/${lamp.total}　切手帳を開く">
        <b>${lamp.shelf}</b><small>${lamp.got}/${lamp.total}</small>${remain ? `<em>あと${remain}段</em>` : ''}</button>`;
    }
    if (item.type === 'gate') {
      const {ward} = item;
      const label = {hidden: '霧の門', open: '区の門へ', cleared: '門が開いた'}[ward.gate];
      const tag = ward.gate === 'open' ? 'button' : 'div';
      return `<${tag} ${tag === 'button' ? 'type="button" data-gate="' + ward.ch + '"' : ''} class="gq-gate ${ward.gate}" style="left:${item.x.toFixed(1)}%;top:${t}px"
        ${ward.gate === 'open' ? `aria-label="${ward.ch}区の門へ。霧の主が待っている"` : ''}><i aria-hidden="true"></i><span>${label}</span></${tag}>`;
    }
    if (item.type === 'ward') {
      return `<div class="gq-ward-tag" style="top:${t}px"><b>${item.ward.ch}区</b> ${esc(item.ward.name)}</div>`;
    }
    return '';
  }).join('');

  // 遠い区は霧で隠す（次の区まで見える）。
  const fogs = wardSegments.filter(seg => seg.wi > hereWard + 1).map(seg =>
    `<i class="gq-far-fog" style="top:${top(seg.end)}px;height:${seg.end - seg.start}px"></i>`).join('');

  // 今いる石段のまわり：ツムギ、これから出会う紙魚の影、戻ってきた紙魚。
  let herePanel = '';
  if (hereItem) {
    const side = hereItem.x > 50 ? 'left' : 'right';
    const shadows = map.next.map(id => `<span class="gq-face">${ctx.face(id, 'shadow')}</span>`).join('');
    const dues = map.due.map(id => `<span class="gq-face">${ctx.face(id, 'print')}</span>`).join('');
    herePanel = `<img class="gq-tsumugi-pin" alt="" src="${esc(ctx.tsumugi)}" style="left:${hereItem.x.toFixed(1)}%;top:${top(hereItem.cy)}px">
      <div class="gq-here-panel ${side}" style="top:${top(hereItem.cy + 62)}px">
        ${map.next.length ? `<p><small>この先の紙魚</small></p><div class="gq-faces">${shadows}</div>` : '<p><small>いちばん上まで来た</small></p>'}
        ${map.dueCount ? `<p class="due"><small>戻ってきた紙魚 <b>${map.dueCount}</b> 匹</small></p><div class="gq-faces">${dues}</div>` : ''}
      </div>`;
  }
  const fogDensity = Math.min(0.88, 0.3 + map.dueCount / 70);
  const fog = map.fog && hereItem
    ? `<i class="gq-here-fog" style="top:${top(hereItem.cy + 560)}px;height:560px;--d:${fogDensity.toFixed(2)}"></i>` : '';

  const post = items[0];
  const postBlock = `<div class="gq-post" style="top:${top(post.from + H.post)}px;height:${H.post}px">${artBox('post', 'gq-post-art')}
    <div class="gq-guide">${artBox('hatoriSmile', 'gq-face-hatori')}<p class="bubble"><small>ハトリ局長</small>${esc(ctx.message)}</p></div></div>`;
  const topItem = items.at(-1);
  const lighthouse = `<div class="gq-top-block" style="top:0;height:${H.top}px"><svg viewBox="0 0 120 150" aria-hidden="true">
    <path d="M60 4l-46 40M60 4l46 40" class="beam"/><rect x="48" y="30" width="24" height="16" rx="3" class="lamp"/><path d="M44 46h32l8 100H36z" class="tower"/>
    <path d="M42 80h36M39 112h42" class="band"/></svg><p><b>灯台</b><small>霧のむこうに、白紙の影</small></p></div>`;

  const days = streakDays(progress.streak, today);
  const count = streakNow(progress.streak, today);
  const collected = Object.keys(progress.words).length;
  const daily = progress.daily;
  const openGate = map.wards.find(w => w.gate === 'open');
  const tomorrow = map.tomorrow;
  const tomorrowFaces = tomorrow.slice(0, 3).map(id => `<span class="gq-face s">${ctx.face(id, 'print')}</span>`).join('');
  const dailyText = daily ? (daily.done
    ? `今日の速達　達成！　（累計 ${progress.dailyDone} 枚）` : `今日の速達　${dailyLine(daily)}`) : '';

  view.className = 'gq gq-map';
  view.innerHTML = `
    <div class="gq-map-top">
      <div class="gq-streak" role="img" aria-label="${count ? `連続 ${count} 日` : '今日から始めよう'}">
        <div class="gq-pms">${days.map(postmark).join('')}</div>
        <small>${count ? `連続 <b>${count}</b> 日` : '今日から始めよう'}</small>
      </div>
      <p class="gq-stampcount">集めた切手<br><b>${collected}</b> / ${ctx.total}</p>
    </div>
    <div class="gq-road" id="gq-road"><div class="gq-road-in" style="height:${total}px">
      ${bands}
      <svg class="gq-road-svg" viewBox="0 0 100 ${total}" preserveAspectRatio="none" aria-hidden="true">
        <polyline class="base" points="${poly(roadPoints)}"/>
        <polyline class="walked" points="${poly(roadPoints.slice(0, herePointIndex + 1))}"/>
        <polyline class="center" points="${poly(roadPoints)}"/>
      </svg>
      ${nodes}${fogs}${fog}${herePanel}${postBlock}${lighthouse}
    </div></div>
    <div class="gq-map-foot">
      ${ctx.warn ? `<p class="gq-warn">${esc(ctx.warn)}</p>` : ''}
      ${ctx.notice ? `<p class="gq-notice">${esc(ctx.notice.text)}<button type="button" class="text-button" id="gq-notice">${esc(ctx.notice.label)}</button></p>` : ''}
      ${dailyText ? `<p class="gq-daily ${daily.done ? 'done' : ''}">${esc(dailyText)}</p>` : ''}
      <p class="gq-tomorrow">明日戻ってくる紙魚 <b>${tomorrow.length}</b> 匹 <span class="gq-faces">${tomorrowFaces}</span></p>
      <button class="primary" id="gq-go" type="button">${map.fog ? '霧を払う' : '配達に出る'} <span aria-hidden="true">→</span></button>
      ${openGate ? `<button type="button" class="gq-gate-btn" id="gq-gate" data-gate="${openGate.ch}">霧の主が待っている　${openGate.ch}区の門へ</button>` : ''}
      <div class="gq-footer">
        <button class="text-button" id="gq-album" type="button">切手帳</button>
        <button class="text-button" id="gq-settings" type="button">設定</button>
        <button class="text-button" id="gq-credits" type="button">クレジット</button>
        <button class="text-button" id="gq-title" type="button">タイトルへ</button>
      </div>
    </div>`;

  const $ = s => view.querySelector(s);
  $('#gq-go').onclick = () => on.go();
  $('#gq-album').onclick = () => on.album();
  $('#gq-settings').onclick = () => on.settings();
  $('#gq-credits').onclick = () => on.credits();
  $('#gq-title').onclick = () => on.title();
  if ($('#gq-notice')) $('#gq-notice').onclick = () => on.notice(ctx.notice.act);
  view.querySelectorAll('[data-gate]').forEach(button => { button.onclick = () => on.gate(Number(button.dataset.gate)); });
  view.querySelectorAll('[data-shelf]').forEach(button => { button.onclick = () => on.lamp(Number(button.dataset.shelf)); });

  // 今いる石段が画面の中ほどより少し下に来る位置へ。上（先の道と紙魚の影）を多めに見せる。
  const road = $('#gq-road');
  const place = () => {
    if (!hereItem) { road.scrollTop = road.scrollHeight; return; }
    const y = total - hereItem.cy;
    road.scrollTop = Math.max(0, y - road.clientHeight * 0.62);
  };
  place();
  requestAnimationFrame(place);
}
