// 試作用。DOM を作る小さな部品と、英文の読み込み。配信物の外。
import {charaSpec} from '../../products/word-guild/guild/chara.mjs';
import {charaSvg} from '../../products/word-guild/guild/chara-svg.mjs';

export const BASE = '../../products/word-guild/';
export const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[c]));

// 企画の章の見本の5行（届くまで）。lemmas は {} の出る順。
export const FALLBACK = {
  shelf: 1, ch: 1, kind: 'memo', from: 'Chief Hatori', to: 'Tsumugi', variant: '見本',
  lines: [
    ['They {say} the fog ate our words. I {think} you {know} it is {time} to {see} for yourself.', 'say think know time see', '霧が言葉を食べた、と皆は言う。そろそろ自分の目で確かめるときだと、君もわかっているだろう。'],
    ['{Good} {people} {come} to {work} here every {year}, but few stay.', 'good people come work year', '良い人たちが毎年ここへ働きに来るが、残る人は少ない。'],
    ['{Use} this {new} bag, {look} at each name, and {give} people what they {want}: their words.', 'use new look give want', 'この新しい鞄を使い、名前を一つずつ見て、人々が望むものを渡しなさい。彼らの言葉だ。'],
    ['You will {find} your {way} in a {day}. All you {need} is on the {back} of the map.', 'find way day need back', '一日で道は覚えるよ。必要なものは地図の裏にある。'],
    ['One {last} thing: if a {child} asks what the fog {means}, {tell} the truth, then {call} me.', 'last child mean tell call', '最後に一つ。子どもが霧の意味を尋ねたら、本当のことを話して、私を呼びなさい。'],
  ].map(([en, l, ja]) => ({en, ja, lemmas: l.split(' ')})),
};

export const parseLine = en => String(en).split(/(\{[^}]*\})/).filter(Boolean)
  .map(s => s[0] === '{' ? {word: s.slice(1, -1)} : {text: s});

// 形 → 見出し語（規則変化だけ）
export function resolveForm(form, words) {
  const f = form.toLowerCase();
  const by = w => words.find(x => x.w === w);
  const c = [f];
  if (f.endsWith('s')) c.push(f.slice(0, -1));
  if (f.endsWith('es')) c.push(f.slice(0, -2));
  if (f.endsWith('ies')) c.push(f.slice(0, -3) + 'y');
  for (const suf of ['ed', 'ing', 'er', 'est']) if (f.endsWith(suf)) {
    const b = f.slice(0, -suf.length);
    c.push(b, b + 'e', b.slice(0, -1), b.endsWith('i') ? b.slice(0, -1) + 'y' : b);
  }
  for (const x of c) { const w = by(x); if (w) return w; }
  return null;
}

// story-sample.json か、無ければ見本。{variants:[letter…], letters2:[letter…], source}
export async function loadStory(words) {
  const byId = new Map(words.map(w => [w.id, w]));
  const norm = (L, label) => ({
    ...L, variant: label,
    lines: (L.lines || []).map(l => {
      const tokens = parseLine(l.en);
      const forms = tokens.filter(t => t.word).map(t => t.word);
      let ids = l.ids;
      if (!ids || ids.length !== forms.length) {
        ids = l.lemmas ? l.lemmas.map(m => (words.find(w => w.w === m) || {}).id)
          : forms.map(f => (resolveForm(f, words) || {}).id);
      }
      return {en: l.en, ja: l.ja || '', ids, tokens};
    }),
  });
  let source = '見本の5行';
  let letters = [];
  try {
    const r = await fetch('./story-sample.json', {cache: 'no-store'});
    if (r.ok) {
      const j = await r.json();
      const tn = {gentle: 'やさしめ', story: '物語'};
      const c = [...(j.letters || (Array.isArray(j) ? j : [])), ...(Array.isArray(j.variants) ? j.variants : [])];
      for (const x of c) letters.push({...x, _v: tn[x.tone] || x.tone || ''});
      if (letters.length) source = 'story-sample.json';
    }
  } catch (e) { /* 無ければ見本 */ }
  if (!letters.length) letters = [FALLBACK];
  const s1 = letters.filter(l => (l.shelf || 1) === 1);
  const s2 = letters.filter(l => l.shelf === 2);
  const lab = (l, i) => l._v || l.variant || l.label || l.name || ('案' + 'AB'[i]);
  const variants = (s1.length ? s1 : [letters[0]]).map((l, i) => norm(l, lab(l, i)));
  const second = s2.length ? norm(s2[0], '') : null;
  for (const v of [...variants, ...(second ? [second] : [])]) v.lines.forEach(l => { l.ids = l.ids.map(id => byId.has(id) ? id : null); });
  return {variants, second, source, count: letters.length};
}

// ---- 部品 ----
export function makeCtx(words, tags) {
  const byId = new Map(words.map(w => [w.id, w]));
  const svg = (id, state) => {
    const w = byId.get(id);
    return w ? charaSvg(charaSpec(w, tags[id] || ''), {state, ward: 1, base: BASE}) : '';
  };
  return {words, byId, tags, svg};
}

const hash = s => { let h = 7; for (const c of s) h = (h * 31 + c.charCodeAt(0)) >>> 0; return h; };

// grid: 5行×語の状態('g','t','i','w')。shadow: 影を乗せる行。
export function renderLetter(ctx, letter, grid, {shadowRows = [], head = true, lamp = ''} = {}) {
  const lines = letter.lines.map((ln, li) => {
    let k = 0;
    const body = ln.tokens.map(t => {
      if (t.text) return esc(t.text);
      const id = ln.ids[k], st = grid[li]?.[k] ?? 'g', h = hash(t.word + li + k);
      const kk = k++;
      const sh = shadowRows.includes(li) && st === 'g' ? `<b class="sh">${ctx.svg(id, 'shadow')}</b>` : '';
      const worn = st === 'w' ? `<b class="bug">${ctx.svg(id, 'print')}</b>` : '';
      return `<span class="w s-${st}" data-l="${li}" data-k="${kk}" data-id="${id || ''}" style="--a:${20 + h % 40}%;--b:${40 + (h >> 3) % 40}%;--c:${(h >> 5) % 5 - 2}px"><span class="t">${esc(t.word)}</span><i class="fog"></i>${sh}${worn}</span>`;
    }).join('');
    return `<div class="ln-wrap" data-l="${li}"><p class="ln" data-l="${li}"><span class="dot"></span><span class="txt">${body}</span></p><p class="ja" hidden>${esc(ln.ja)}</p></div>`;
  }).join('');
  const h = head ? `<div class="ph"><span class="from">${esc(letter.from || '')}</span><svg class="arr" viewBox="0 0 24 10"><path d="M1 5h20M16 1l5 4-5 4" fill="none" stroke="currentColor" stroke-width="1.6"/></svg><span class="to">${esc(letter.to || '')}</span>${lamp}</div>` : '';
  return `<div class="paper k-${esc(letter.kind || 'memo')}">${h}${lines}</div>`;
}

export const STATES = ['g', 't', 'i', 'w'];
export function setWord(el, st) {
  el.classList.remove('s-g', 's-t', 's-i', 's-w');
  el.classList.add('s-' + st);
}
export function defeat(wEl) {
  for (const b of wEl.querySelectorAll('.sh,.bug')) {
    b.classList.add('pop');
    setTimeout(() => b.remove(), 600);
  }
}
export function syncDots(root, grid) {
  root.querySelectorAll('.ln-wrap').forEach((wr, li) => {
    const done = grid[li].every(s => s !== 'g');
    wr.classList.toggle('read', done);
  });
}
export const readLines = grid => grid.filter(r => r.every(s => s !== 'g')).length;

// 街灯の輪：読めた行の数だけ埋まる5つの弧
export function lampSvg(n, lit = false, size = 28) {
  const arcs = [];
  for (let i = 0; i < 5; i++) {
    const a0 = (-90 + i * 72 + 6) * Math.PI / 180, a1 = (-90 + (i + 1) * 72 - 6) * Math.PI / 180, r = 11;
    const p = a => [14 + r * Math.cos(a), 14 + r * Math.sin(a)].map(x => x.toFixed(2)).join(' ');
    arcs.push(`<path d="M${p(a0)}A${r} ${r} 0 0 1 ${p(a1)}" fill="none" stroke="${i < n ? 'var(--lamp)' : 'var(--fog)'}" stroke-width="3.4" stroke-linecap="round" ${i < n ? '' : 'opacity=".55"'}/>`);
  }
  return `<svg class="lamp" width="${size}" height="${size}" viewBox="0 0 28 28" aria-hidden="true">${arcs.join('')}<circle cx="14" cy="14" r="4.2" fill="${lit ? 'var(--lamp)' : 'var(--fog)'}" stroke="var(--ink)" stroke-width="1.2"/>${lit ? '<circle cx="14" cy="14" r="7" fill="none" stroke="var(--lamp)" stroke-opacity=".5"/>' : ''}</svg>`;
}

// 地図の街灯の紙：読めた行は線、霧の行は白。bites は右端のかじり跡の数。
export function miniPaper(grid, {bites = 0, fog = false} = {}) {
  const rows = grid.map((r, i) => {
    const read = r.every(s => s !== 'g'), y = 15 + i * 8.4, w = [30, 26, 31, 24, 28][i];
    const thin = r.some(s => s === 't');
    return read ? `<rect x="8" y="${y}" width="${w}" height="3" rx="1.5" fill="${thin ? '#6b86a6' : 'var(--ink)'}"/>`
      : `<rect x="8" y="${y}" width="${w}" height="3" rx="1.5" fill="#fff" stroke="var(--fog)" stroke-width=".8"/>`;
  }).join('');
  const bite = Array.from({length: bites}, (_, i) => `<circle cx="${i % 2 ? 2 : 45}" cy="${24 + i * 13}" r="${3.2 + (i % 2)}" fill="var(--bg,#2a3556)"/>`).join('');
  return `<svg class="mp" viewBox="0 0 46 58" width="46" height="58" aria-hidden="true"><path d="M2 2h33l9 9v45H2z" fill="var(--paper-hi)" stroke="var(--ink)" stroke-width="1.6" stroke-linejoin="round"/><path d="M35 2v9h9" fill="var(--paper-2)" stroke="var(--ink)" stroke-width="1.2"/>${rows}${bite}${fog ? '<rect x="1" y="1" width="44" height="56" rx="6" fill="#cfdadf" opacity=".82"/><ellipse cx="14" cy="22" rx="13" ry="6" fill="#eef3f5" opacity=".9"/><ellipse cx="32" cy="42" rx="14" ry="7" fill="#eef3f5" opacity=".9"/>' : ''}</svg>`;
}
