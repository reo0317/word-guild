// 画面から共通で使う小さな部品。
export function esc(text) {
  return String(text).replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
}

export function speak(text) {
  try {
    const synth = window.speechSynthesis;
    if (!synth || typeof SpeechSynthesisUtterance === 'undefined') return;
    synth.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = 0.9;
    synth.speak(utterance);
  } catch {
    // 発音できない端末では黙って省く
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
