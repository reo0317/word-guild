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
