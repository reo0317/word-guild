import {isRestored} from './srs.mjs';
// 画面から共通で使う小さな部品。
export function esc(text) {
  return String(text).replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
}

// 端末依存部分を注入できる、最新の語だけを読む制御。
export function createSpeaker({synth, Utterance, later = setTimeout, clear = clearTimeout} = {}) {
  let ready = false, preparing = null;
  let unlocked = false, generation = 0, timer, watchdog, voice;
  const voices = () => { voice = synth?.getVoices?.().find(v => v.lang === 'en-US'); };
  voices();
  synth?.addEventListener?.('voiceschanged', voices);
  const resume = () => { if (synth?.paused) synth.resume(); };
  function unlock() {
    if (unlocked || !synth || !Utterance) return;
    try {
      resume();
      const silent = new Utterance('');
      silent.volume = 0;
      synth.speak(silent);
      unlocked = true;
    } catch { /* 次の操作で再試行 */ }
  }
  function prepare() {
    if (!synth || !Utterance) return Promise.resolve(false);
    if (ready) return Promise.resolve(true);
    if (preparing) return preparing;
    preparing = new Promise(resolve => {
      let finished = false, poll, limit, probe;
      const finish = ok => {
        if (finished) return;
        finished = true;
        clear(poll); clear(limit);
        if (probe) probe.onstart = probe.onend = probe.onerror = null;
        ready = ok;
        preparing = null;
        resolve(ok);
      };
      const check = () => {
        if (finished) return;
        try {
          voices();
          if (voice && !probe) {
            resume();
            probe = new Utterance(' ');
            probe.lang = 'en-US'; probe.voice = voice; probe.volume = 0;
            probe.onstart = probe.onend = () => { unlocked = true; finish(true); };
            probe.onerror = () => finish(false);
            synth.speak(probe);
          }
        } catch { finish(false); }
        if (!finished) poll = later(check, 50);
      };
      limit = later(() => {
        try { synth.cancel(); } catch { /* 無反応の発話を残さない */ }
        finish(false);
      }, 3000);
      unlock();
      check();
    });
    return preparing;
  }
  function speak(text) {
    if (!synth || !Utterance || !text) return;
    const token = ++generation;
    clear(timer); clear(watchdog);
    function attempt(retries = 0) {
      if (token !== generation) return;
      try {
        synth.cancel();
        resume();
        timer = later(() => {
          if (token !== generation) return;
          voices();
          const utterance = new Utterance(text);
          utterance.lang = 'en-US';
          if (voice) utterance.voice = voice;
          utterance.rate = 0.9;
          let settled = false;
          const retry = () => {
            if (settled || token !== generation) return;
            settled = true; clear(watchdog);
            if (retries < 2) attempt(retries + 1);
          };
          utterance.onend = () => { settled = true; clear(watchdog); };
          utterance.onerror = retry;
          watchdog = later(retry, 15000);
          resume();
          try { synth.speak(utterance); } catch { retry(); }
        }, 50);
      } catch { /* 非対応端末では省く */ }
    }
    attempt();
  }
  return {speak, unlock, prepare, cancel() { generation++; clear(timer); clear(watchdog); synth?.cancel(); }};
}
let speechOn = true;
export function setSpeechEnabled(on) { speechOn = on; if (!on) speaker?.cancel(); }
let speaker;
function deviceSpeaker() {
  return speaker ??= createSpeaker({synth: globalThis.window?.speechSynthesis, Utterance: globalThis.SpeechSynthesisUtterance});
}
export const prepareSpeech = () => speechOn ? deviceSpeaker().prepare() : Promise.resolve(false);
export const speak = text => { if (speechOn) deviceSpeaker().speak(text); };
if (typeof document !== 'undefined') {
  for (const event of ['pointerdown', 'touchstart', 'keydown']) {
    document.addEventListener(event, () => { if (speechOn) deviceSpeaker().unlock(); }, {capture: true, passive: true});
  }
}

export const starsMarkup = box => `${'★'.repeat(box)}${'☆'.repeat(5 - box)}`;

// 画面ごとの CSS を一度だけ読み込む。読み込みが終わる（または1.5秒たつ）まで待つ。
const styleLoads = new Map();
export function loadStyle(href) {
  if (styleLoads.has(href)) return styleLoads.get(href);
  const done = new Promise(resolve => {
    try {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = href;
      link.onload = () => resolve(true);
      link.onerror = () => resolve(false);
      document.head.append(link);
      setTimeout(() => resolve(false), 1500);
    } catch {
      resolve(false);
    }
  });
  styleLoads.set(href, done);
  return done;
}

export const reducedMotion = () => {
  try { return matchMedia('(prefers-reduced-motion: reduce)').matches; } catch { return false; }
};

// 紙魚の SVG が使うフィルターなどの共有定義を、ページに一度だけ入れる。
export function ensureDefs(html) {
  if (document.getElementById('gq-defs')) return;
  const holder = document.createElement('div');
  holder.id = 'gq-defs';
  holder.setAttribute('aria-hidden', 'true');
  holder.innerHTML = html;
  document.body.append(holder);
}

// ---------- ボタンの形（丸・封蝋）と絵文字ふうの線画 ----------
const ICON_PATHS = {
  bulb: 'M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z',
  book: 'M3.5 5.5c3-1 5.5-.7 8.5 1 3-1.7 5.5-2 8.5-1V19c-3-1-5.5-.7-8.5 1-3-1.7-5.5-2-8.5-1zM12 6.5V20',
  home: 'M3 11l9-7 9 7M5.5 9.5V20h13V9.5M10 20v-6h4v6',
  album: 'M6 3h12a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H6zM6 3v18M10 8h6M10 12h6M10 16h4',
  gear: 'M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7zM12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2',
  info: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 11v6M12 7.5v.5',
  title: 'M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z',
  speaker: 'M4 9v6h4l5 4V5L8 9zM16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12',
  close: 'M6 6l12 12M18 6L6 18',
  prev: 'M15 5l-7 7 7 7',
  next: 'M9 5l7 7-7 7',
  gate: 'M5 21V10a7 7 0 0 1 14 0v11M9 21v-6a3 3 0 0 1 6 0v6',
  list: 'M8 6h12M8 12h12M8 18h12M4 6h.5M4 12h.5M4 18h.5',
  export: 'M12 15V3M7.5 7.5L12 3l4.5 4.5M4 14v6h16v-6',
};

export function icon(name, size = 24) {
  return `<svg class="ic" viewBox="0 0 24 24" width="${size}" height="${size}" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="${ICON_PATHS[name] ?? ''}"/></svg>`;
}

// 丸いボタン（絵のアイコン＋小さな名前）。タップの範囲は 44px 以上。attrs は属性の文字列（id など）。
export function fab({icon: name, label, caption = true, cls = '', attrs = ''}) {
  return `<button type="button" class="gq-fab ${cls}" aria-label="${esc(label)}" ${attrs}><span class="gq-disc">${icon(name)}</span>${caption ? `<small>${esc(label)}</small>` : ''}</button>`;
}

// 封蝋のボタン（主ボタン）。波打つ縁の赤い蝋に、文字を押す。
const WAX_POINTS = Array.from({length: 56}, (_, k) => {
  const angle = k / 56 * Math.PI * 2;
  const r = 46 * (1 + 0.045 * Math.sin(angle * 9));
  return `${(Math.cos(angle) * r).toFixed(1)},${(Math.sin(angle) * r).toFixed(1)}`;
}).join(' ');

export function waxButton({label, id = '', cls = '', sub = ''}) {
  return `<button type="button" class="gq-wax ${cls}" ${id ? `id="${id}"` : ''}><svg viewBox="-52 -52 104 104" aria-hidden="true"><polygon points="${WAX_POINTS}"/><circle r="37"/></svg><span>${label}</span>${sub ? `<small>${sub}</small>` : ''}</button>`;
}

// ---------- 物語の紙（letterView の結果を描く） ----------
// 語の見え方：s-gone 霧 / s-thin 薄いインク / s-ink 濃いインク / s-worn かすれ。見た目は letter.css。
// 紙魚の SVG（face）を囲む要素に CSS の filter は使わない（iOS Safari で SVG が描かれなくなる）。
const LETTER_CSS = new URL('../letter.css', import.meta.url).href;
export const ensureLetterCss = () => loadStyle(LETTER_CSS);

const hashOf = text => { let h = 7; for (const c of text) h = (h * 31 + c.charCodeAt(0)) >>> 0; return h; };

export const plainLine = line => line.parts.map(part => part.text).join('');

// 街灯の小さな輪：読めた行の数だけ5つに分かれた弧が埋まる。lit で灯。
export function lampRing(n, lit = false, size = 28) {
  const on = i => Array.isArray(n) ? n[i] === true : i < n;
  const arcs = Array.from({length: 5}, (_, i) => {
    const a0 = (-90 + i * 72 + 6) * Math.PI / 180, a1 = (-90 + (i + 1) * 72 - 6) * Math.PI / 180, r = 11;
    const at = a => [14 + r * Math.cos(a), 14 + r * Math.sin(a)].map(x => x.toFixed(2)).join(' ');
    return `<path d="M${at(a0)}A${r} ${r} 0 0 1 ${at(a1)}" fill="none" stroke="${on(i) ? 'var(--lamp)' : 'var(--fog)'}" stroke-width="3.4" stroke-linecap="round"${on(i) ? '' : ' opacity=".55"'}/>`;
  }).join('');
  return `<svg class="lring" width="${size}" height="${size}" viewBox="0 0 28 28" aria-hidden="true">${arcs}<circle cx="14" cy="14" r="4.2" fill="${lit ? 'var(--lamp)' : 'var(--fog)'}" stroke="var(--ink)" stroke-width="1.2"/>${lit ? '<circle cx="14" cy="14" r="7" fill="none" stroke="var(--lamp)" stroke-opacity=".5"/>' : ''}</svg>`;
}

// 配達の対象は開始時の語で固定。新出語数、全対象語数、登場順で選ぶ。
export function deliveryLetter(story, groups, progress) {
  const counts = new Map();
  for (const word of new Map(groups.flat().map(w => [w.id, w])).values()) {
    const count = counts.get(word.shelf) ?? {fresh: 0, total: 0};
    count.total++;
    if (!progress.words?.[word.id]) count.fresh++;
    counts.set(word.shelf, count);
  }
  const shelves = [...counts].sort((a, b) => b[1].fresh - a[1].fresh || b[1].total - a[1].total);
  // 選ばれた街灯に英文が無ければ、別の通を代わりに見せない。
  return story.letters?.find(letter => letter.shelf === shelves[0]?.[0]) ?? null;
}

export function deliveryLineLights(letter, progress, restoredIds = new Set()) {
  return Array.from({length: 5}, (_, i) => {
    const ids = letter?.lines[i]?.ids;
    return !!ids?.length && ids.every(id => isRestored(progress.words?.[id]) || restoredIds.has(id));
  });
}

// 1行の中身（語の並び）。opts: {face(id, state), shadow: 霧の語に紙魚の影を乗せる, hit: 光らせる語の id}
export function lineBody(line, {face = () => '', shadow = false, hit = ''} = {}) {
  return line.parts.map(part => {
    if (part.type === 'text') return esc(part.text);
    const h = hashOf(part.id + part.text);
    const rider = part.state === 'gone' && shadow ? `<b class="sh">${face(part.id, 'shadow')}</b>`
      : part.state === 'worn' ? `<b class="bug">${face(part.id, 'print')}</b>` : '';
    return `<span class="w s-${part.state}${part.id === hit ? ' now' : ''}" data-id="${esc(part.id)}" style="--a:${20 + h % 40}%;--b:${40 + (h >> 3) % 40}%"><span class="t">${esc(part.text)}</span><i class="fog"></i>${rider}</span>`;
  }).join('');
}

// 1行。読めた行は押すと訳が出る（スピーカーつき）。
export function lineHtml(line, li, opts = {}) {
  const say = line.readable ? `<button type="button" class="ln-say" data-say="${esc(plainLine(line))}" aria-label="読みあげ">${icon('speaker', 16)}</button>` : '';
  return `<div class="ln-wrap${line.readable ? ' read' : ''}" data-l="${li}"><p class="ln"><span class="dot">${line.readable ? '▱' : ''}</span><span class="txt">${lineBody(line, opts)}</span></p><p class="ja" hidden>${esc(line.ja ?? '')}${say}</p></div>`;
}

// 切手の拡大に添える、その語を含む行（語を光らせる）。通が無ければ空。
export function wordLineHtml(lv, id, opts = {}) {
  const i = lv ? lv.lines.findIndex(line => line.ids.includes(id)) : -1;
  return i < 0 ? '' : `<div class="paper zl">${lineHtml(lv.lines[i], i, {...opts, hit: id})}</div>`;
}

// 1通。lv は letterView の結果。opts: {face, shadowLines: 影を乗せる行の番号の Set, lit: 街灯がともっているか}
let introducedLine = false;
export function letterHtml(lv, {face = () => '', shadowLines = new Set(), lit = false, hit = ''} = {}) {
  const read = lv.lines.filter(line => line.readable).length;
  const all = lv.readable ? `<button type="button" class="ln-say all" data-say="${esc(lv.lines.map(plainLine).join(' '))}" aria-label="読みあげ">${icon('speaker', 16)}</button>` : '';
  const intro = !introducedLine ? lv.lines.findIndex(l => l.readable) : -1;
  if (intro >= 0) introducedLine = true;
  const head = `<div class="ph"><span class="from">${esc(lv.from ?? '')}</span><svg class="arr" viewBox="0 0 24 10" aria-hidden="true"><path d="M1 5h20M16 1l5 4-5 4" fill="none" stroke="currentColor" stroke-width="1.6"/></svg><span class="to">${esc(lv.to ?? '')}</span>${all}<span class="ring">${lampRing(read, lit)}</span></div>`;
  return `<div class="paper k-${esc(lv.kind ?? 'memo')}" data-shelf="${lv.shelf}">${head}${lv.lines.map((line, i) => lineHtml(line, i, {face, shadow: shadowLines.has(i), hit}).replace('<p class="ja" hidden>', i === intro ? '<p class="ja">' : '<p class="ja" hidden>')).join('')}</div>`;
}

// 影を乗せる行：まだ霧のある行のうち、先頭の2行（今の石段と次の石段）。
export const shadowLinesOf = lv => new Set(lv.lines.flatMap((line, i) => (line.readable ? [] : [i])).slice(0, 2));

// 紙を押したときの動き：読めた語 → onWord(id, 要素)、読めた行 → 訳の出入り、スピーカー → say(text)。
// 扱ったら true を返す。
export function handleLetterClick(event, {onWord = null, say = speak} = {}) {
  const voice = event.target.closest('[data-say]');
  if (voice) { say(voice.dataset.say); return true; }
  const word = event.target.closest('.w');
  if (word?.dataset.id && !word.classList.contains('s-gone') && onWord) { onWord(word.dataset.id, word); return true; }
  const row = event.target.closest('.ln-wrap.read');
  if (row) { const ja = row.querySelector('.ja'); if (ja) ja.hidden = !ja.hidden; return true; }
  return false;
}
export const wireLetter = (root, opts) => root.addEventListener('click', event => { handleLetterClick(event, opts); });

// 地図の街灯のそばの、紙の小さな絵。読めた行は線、霧の行は白。かじり跡は期限の語の数。
export function miniPaper(lv, {fog = false} = {}) {
  const worn = lv.lines.reduce((n, line) => n + line.parts.filter(p => p.state === 'worn').length, 0);
  const rows = lv.lines.map((line, i) => {
    const y = 15 + i * 8.4, w = [30, 26, 31, 24, 28][i % 5];
    if (!line.readable) return `<rect x="8" y="${y}" width="${w}" height="3" rx="1.5" fill="#fff" stroke="var(--fog)" stroke-width=".8"/>`;
    const thin = line.parts.some(p => p.state === 'thin');
    return `<rect x="8" y="${y}" width="${w}" height="3" rx="1.5" fill="${thin ? '#6b86a6' : 'var(--ink)'}"/>`;
  }).join('');
  const bites = Array.from({length: Math.min(worn, 3)}, (_, i) => `<circle cx="${i % 2 ? 2 : 45}" cy="${24 + i * 13}" r="${3.2 + (i % 2)}" fill="var(--fog-lt)"/>`).join('');
  const mist = fog ? '<rect x="1" y="1" width="44" height="56" rx="6" fill="#cfdadf" opacity=".82"/><ellipse cx="14" cy="22" rx="13" ry="6" fill="#eef3f5" opacity=".9"/><ellipse cx="32" cy="42" rx="14" ry="7" fill="#eef3f5" opacity=".9"/>' : '';
  return `<svg class="mp" viewBox="0 0 46 58" aria-hidden="true"><path d="M2 2h33l9 9v45H2z" fill="var(--paper-hi)" stroke="var(--ink)" stroke-width="1.6" stroke-linejoin="round"/><path d="M35 2v9h9" fill="var(--paper-2)" stroke="var(--ink)" stroke-width="1.2"/>${rows}${bites}${mist}</svg>`;
}

// 読めた通：封をした封筒と、窓に灯のともった家。
export const miniEnvelope = () => '<svg class="mp env" viewBox="0 0 46 58" aria-hidden="true"><path d="M3 18h40v30a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3z" fill="var(--paper-2)" stroke="var(--ink)" stroke-width="1.8" stroke-linejoin="round"/><path d="M4 20l19 14 19-14" fill="none" stroke="var(--ink)" stroke-width="1.6"/><circle cx="23" cy="34" r="5.5" fill="var(--seal)" stroke="var(--ink)" stroke-width="1.5"/></svg>';
export const miniHouse = () => '<svg class="house" viewBox="0 0 30 28" aria-hidden="true"><path d="M3 13l12-10 12 10v13H3z" fill="var(--paper-hi)" stroke="var(--ink)" stroke-width="2" stroke-linejoin="round"/><rect x="11" y="14" width="8" height="8" rx="1.5" fill="var(--lamp)" stroke="var(--ink)" stroke-width="1.6"/><circle cx="15" cy="18" r="9" fill="var(--lamp)" opacity=".28"/></svg>';

// 1通が読めたときの動き：紙が折られて封筒になり、判が押され、家の窓に灯がともる。クラス s1〜s5 で進める。
export function envelopeScene(furoSrc) {
  const lines = [30, 26, 32, 24, 28].map((w, i) => `<rect x="90" y="${42 + i * 16}" width="${w * 3.4}" height="5" rx="2.5" fill="var(--ink)"/>`).join('');
  return `<div class="gq-env"><svg class="scene" viewBox="0 0 340 230" aria-hidden="true">
    <rect width="340" height="230" fill="var(--fog-lt)"/>
    <g><path d="M236 150l38-34 38 34v58H236z" fill="var(--paper-hi)" stroke="var(--ink)" stroke-width="3" stroke-linejoin="round"/><rect x="262" y="164" width="24" height="26" rx="3" class="sc-win" stroke="var(--ink)" stroke-width="2.5"/><circle class="sc-glow" cx="274" cy="177" r="26" fill="var(--lamp)" opacity=".5"/></g>
    <g class="sc-move"><g class="sc-paper"><rect x="80" y="26" width="180" height="116" rx="4" fill="var(--paper-hi)" stroke="var(--ink)" stroke-width="3"/><rect x="90" y="34" width="60" height="5" rx="2.5" fill="var(--seal)"/>${lines}</g>
    <g class="sc-env"><path d="M70 82h200v92a6 6 0 0 1-6 6H76a6 6 0 0 1-6-6z" fill="var(--paper-2)" stroke="var(--ink)" stroke-width="3"/><path d="M72 176l98-58 98 58" fill="none" stroke="var(--ink)" stroke-width="2.2" opacity=".5"/><path class="sc-flap" d="M70 82h200l-100 62z" fill="var(--paper)" stroke="var(--ink)" stroke-width="3" stroke-linejoin="round"/></g>
    <circle class="sc-seal" cx="170" cy="144" r="13" fill="var(--seal)" stroke="var(--ink)" stroke-width="2.5"/></g></svg>
    <img class="furo" src="${esc(furoSrc)}" alt=""></div>`;
}

// お手伝いは、真鍮の虫めがねと革表紙の開いた本。
export function helpButton(kind) {
  const hint = kind === 'hint';
  const art = hint
    ? '<path class="help-material" d="M57 49l24 21q7 8-1 13t-13-2L47 57z"/><circle class="help-material" cx="37" cy="34" r="27"/><circle cx="37" cy="34" r="19" fill="var(--paper-hi)"/><path d="M24 32q0-12 13-12M29 43l5 3" fill="none"/>'
    : '<path class="help-material" d="M5 17q21-9 40 3 19-12 40-3v58q-23-7-40 5-17-12-40-5z"/><path d="M12 23q17-5 33 4 16-9 33-4v43q-18-4-33 5-15-9-33-5z" fill="var(--paper-hi)"/><path d="M45 27v44M20 34l17 3m-17 8 17 3m16-11 17-3m-17 14 17-3" fill="none"/>';
  return `<button type="button" class="gq-help help-${kind}" id="gq-${kind}" aria-pressed="false"><svg viewBox="0 0 90 90" aria-hidden="true" fill="none" stroke="var(--ink)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">${art}</svg><span>${hint ? 'ヒント' : 'おしえて'}</span></button>`;
}
