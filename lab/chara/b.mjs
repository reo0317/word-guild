// 試作B：紙魚を全部 SVG で描く（版画ふう。紺の主版＋色版1〜2色、色ずれ・網点・かすれ）。
// drawChara(word, {state, inkTone}) → SVG 文字列。切手の枠は描かない。
// 共有の <filter>/<mask>/<pattern> は charaDefs() の1枚にまとめ、ブラウザーでは最初の呼び出しで body に1回だけ差し込む。
// 同じ語（id）は常に同じ姿。DOM は defs の差し込みにしか使わない。

const NAVY = '#1f2a44', PAPER = '#f3ead8', RED = '#c8462f', MIST = '#9fb3bf', LAMP = '#f2b84b';
const NIGHT = '#2d3b6e';

// 区ごとの4色のインク [体の色, 差し色]。版画の特色に寄せた、くすんだ色。
const INKS = {
  1: [['#c8462f', MIST], ['#e0893a', NAVY], ['#9fb3bf', RED], ['#7d9364', LAMP]],   // 坂の上の朝市
  2: [['#b4533c', LAMP], ['#d6a147', RED], ['#5f8b8c', LAMP], ['#8e6b8f', LAMP]],   // 石だたみ商店街
  3: [['#3f6f8f', LAMP], ['#9fb3bf', RED], ['#c8462f', MIST], ['#6a8a78', LAMP]],   // 波止場の倉庫街
  4: [['#6f8a4f', LAMP], ['#b98b3b', NAVY], ['#9fb3bf', RED], ['#a0503a', LAMP]],   // 時計塔の役場
  5: [['#8a4f70', LAMP], ['#c8462f', LAMP], ['#d9a441', RED], ['#6f7fa8', LAMP]],   // 駅前ホテル通り
  6: [['#2f6f86', LAMP], ['#f2b84b', RED], ['#9fb3bf', RED], ['#c8462f', LAMP]],   // 灯台岬
};

// 分類（sample.json の _cats）→ 小物。
const PROP_OF = {
  money: 'coin', work: 'bag', person: 'hat', time: 'watch', place: 'flag', move: 'ticket', food: 'spoon', doc: 'letter',
  goods: 'tag', tool: 'gear', nature: 'leaf', body: 'plaster', mind: 'bubble', number: 'ruler', action: 'arrow', state: 'star',
};
const NOUN_KESHI = new Set(['doc', 'money', 'time', 'number']);
const NOUN_ATENA = new Set(['goods', 'place', 'food', 'move', 'tool', 'nature']);

export const SPECIES = ['shimi', 'keshikasu', 'nijimi', 'hokoridama', 'atenashi', 'oshimi'];

export function speciesOf(word) {
  if (word.w.replace(/[^a-z]/gi, '').length >= 13) return 'oshimi';
  if (word.pos === 'v') return 'shimi';
  if (word.pos === 'a') return 'nijimi';
  if (word.pos === 'n') {
    if (NOUN_KESHI.has(word.cat)) return 'keshikasu';
    if (NOUN_ATENA.has(word.cat)) return 'atenashi';
  }
  return 'hokoridama';
}

// ---- 乱数（id の文字列から種を作る） ----
function seedOf(text) {
  let h = 2166136261;
  for (const ch of text) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return h >>> 0;
}
function mulberry32(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---- 形の道具 ----
const { PI, sin, cos, exp, round, min, max } = Math;
const f = n => round(n * 10) / 10;
const xy = p => `${f(p[0])} ${f(p[1])}`;
// 点の列を、中点を通る2次曲線でなめらかに閉じる。
function qpath(p) {
  const n = p.length;
  const mid = i => { const a = p[i % n], b = p[(i + 1) % n]; return [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]; };
  let d = 'M' + xy(mid(0));
  for (let i = 1; i <= n; i++) d += 'Q' + xy(p[i % n]) + ' ' + xy(mid(i));
  return d + 'Z';
}
const lpath = p => 'M' + p.map(xy).join('L') + 'Z';
function wobbler(r, amp) {
  const a = [2, 3, 5].map(k => [k, (r() - 0.5) * 2 * amp / (k / 2), r() * PI * 2]);
  return t => a.reduce((s, [k, m, ph]) => s + m * sin(k * t + ph), 0);
}
const bump = (t, at, w) => { let d = t - at; d = Math.atan2(sin(d), cos(d)); return exp(-((d / w) ** 2)); };
const pick = (r, list) => list[(r() * list.length) | 0];
const deg = a => (a * PI) / 180;

// ---- 6種族の体 ----
// 返り値：d（体の輪郭）、back（体の後ろの手足。主版）、front（主版の飾り）、color（色版の飾り）、
//         face:[x,y,s]、hands:[[x,y],[x,y]]、head:[x,y]
function polarBody(cx, cy, rx, ry, n, rf) {
  const pts = [], at = t => { const k = rf(t); return [cx + cos(t) * rx * k, cy + sin(t) * ry * k]; };
  for (let i = 0; i < n; i++) pts.push(at((i / n) * 2 * PI - PI));
  return { pts, at };
}

function shimi(r) {
  const wob = wobbler(r, 0.07);
  const left = deg(-160 - r() * 25), right = deg(-20 + r() * 25);
  const arms = [[left, 0.45 + r() * 0.25], [right, 0.45 + r() * 0.25]];
  for (const a of [-125, -90, -55].filter(() => r() < 0.6)) arms.push([deg(a + (r() - 0.5) * 30), 0.25 + r() * 0.35]);
  const legs = [deg(62 + r() * 10), deg(108 + r() * 10)];
  const rf = t => 1 + wob(t) + arms.reduce((s, [a, l]) => s + l * bump(t, a, 0.17), 0) + legs.reduce((s, a) => s + 0.32 * bump(t, a, 0.13), 0);
  const { pts, at } = polarBody(50, 50, 27, 24, 48, rf);
  const dots = [];
  for (let i = 0, n = 3 + ((r() * 4) | 0); i < n; i++) {
    const a = r() * 2 * PI, k = rf(a) + 0.25 + r() * 0.3;
    dots.push(`<circle cx="${f(min(95, max(5, 50 + cos(a) * 27 * k)))}" cy="${f(min(95, max(5, 50 + sin(a) * 24 * k)))}" r="${f(1 + r() * 2)}" fill="${NAVY}"/>`);
  }
  return { d: qpath(pts), front: dots.join(''), face: [50, 47, 1], hands: [at(left), at(right)], head: at(-PI / 2), mottle: 0.8 };
}

function keshikasu(r) {
  const n = 12, pts = [];
  for (let i = 0; i < n; i++) {
    const t = (i / n) * 2 * PI - PI, k = 1 + (i % 2 ? -0.09 : 0.07) + (r() - 0.5) * 0.2;
    pts.push([50 + cos(t) * 28 * k, 52 + sin(t) * 23 * k]);
  }
  // 体からはみ出た消しかすの塊（後ろ）と、まわりに散る粒（前）
  const chunk = (cx, cy, s) => lpath([0, 1, 2, 3].map(j => { const a = (j / 4) * 2 * PI + r(); return [cx + cos(a) * s * (0.8 + r() * 0.4), cy + sin(a) * s * (0.8 + r() * 0.4)]; }));
  let lumps = '', crumbs = '';
  for (let i = 0, m = 2 + ((r() * 3) | 0); i < m; i++) {
    const t = deg(-170 + r() * 160);
    lumps += chunk(50 + cos(t) * 29, 52 + sin(t) * 24, 6 + r() * 4);
  }
  for (let i = 0, m = 4 + ((r() * 4) | 0); i < m; i++) {
    const t = r() * 2 * PI, k = 1.35 + r() * 0.3;
    crumbs += chunk(min(94, max(6, 50 + cos(t) * 30 * k)), min(94, max(6, 50 + sin(t) * 26 * k)), 1.6 + r() * 2.2);
  }
  const ay = 56 + r() * 8;
  const back = `<path d="M24 ${f(ay)}L13 ${f(ay + 8)}M76 ${f(ay)}L87 ${f(ay + 8)}M42 70l-2 15h-5M58 70l2 15h5" fill="none" stroke-width="3.4"/>` +
    `<path d="M13 ${f(ay + 8)}l-4-3m4 3l-3 4m3-4l1 5M87 ${f(ay + 8)}l4-3m-4 3l3 4m-3-4l-1 5" fill="none" stroke-width="2"/>`;
  return { d: lpath(pts), back, lumps, crumbs, face: [50, 50, 0.95], hands: [[13, ay + 8], [87, ay + 8]], head: [50, 30], mottle: 0.5 };
}

function nijimi(r) {
  const wob = wobbler(r, 0.06), dir = r() < 0.5 ? -1 : 1, pts = [];
  for (let i = 0; i <= 8; i++) { const t = PI + (i / 8) * PI, k = 1 + wob(t); pts.push([50 + cos(t) * 24 * k, 42 + sin(t) * 25 * k]); }
  pts.push([75, 58]);
  for (let k = 0; k <= 6; k++) {
    const u = k / 6, s = dir > 0 ? 1 - u : u;
    pts.push([74 - 48 * u + dir * s * s * 12, 70 + (k % 2 ? 0 : 8) + s * s * 16 + (r() - 0.5) * 3]);
  }
  pts.push([25, 58]);
  const lh = [12 + r() * 4, 40 + r() * 10], rh = [88 - r() * 4, 40 + r() * 10];
  const back = `<path d="M28 50Q18 ${f(lh[1] + 14)} ${xy(lh)}M72 50Q82 ${f(rh[1] + 14)} ${xy(rh)}" fill="none" stroke-width="3"/>` +
    `<path d="M${xy(lh)}l-3-4m3 4l-4 1M${xy(rh)}l3-4m-3 4l4 1" fill="none" stroke-width="2"/>`;
  return { d: qpath(pts), back, halo: 1, face: [50, 42, 1], hands: [lh, rh], head: [50, 17], mottle: 0.7 };
}

function hokoridama(r) {
  const wob = wobbler(r, 0.06);
  const { pts } = polarBody(50, 46, 24, 22, 46, t => 1 + wob(t));
  pts.forEach((p, i) => { if (i % 2) { const k = 1.12 + r() * 0.08; p[0] = 50 + (p[0] - 50) * k; p[1] = 46 + (p[1] - 46) * k; } });
  const lh = [11 + r() * 4, 54 + r() * 8], rh = [89 - r() * 4, 54 + r() * 8], kx = (r() - 0.5) * 6;
  const back = `<path d="M30 52L${xy(lh)}M70 52L${xy(rh)}M44 64l${f(-4 + kx)} 10 1 10M56 64l${f(4 + kx)} 10-1 10" fill="none" stroke-width="2.4"/>` +
    `<path d="M${xy(lh)}l-4-2m4 2l-3 4m3-4l1 4M${xy(rh)}l4-2m-4 2l3 4m-3-4l-1 4M${f(41 + kx)} 84h-6M${f(59 + kx)} 84h6" fill="none" stroke-width="2"/>`;
  return { d: qpath(pts), back, face: [50, 47, 0.95], hands: [lh, rh], head: [50, 21], mottle: 0.4 };
}

function atenashi(r) {
  const j = () => (r() - 0.5) * 4;
  const x0 = 24 + j(), x1 = 76 + j(), y0 = 28 + j(), y1 = 64 + j(), q = 4;
  const c = [[x0, y0], [x1, y0 + j()], [x1 + j() / 2, y1], [x0, y1 + j()]];
  let d = '';
  c.forEach((p, i) => {
    const a = c[(i + 3) % 4], b = c[(i + 1) % 4];
    const towards = (s, t) => [s[0] + (t[0] - s[0]) * (q / 50), s[1] + (t[1] - s[1]) * (q / 36)];
    d += (i ? 'L' : 'M') + xy(towards(p, a)) + 'Q' + xy(p) + ' ' + xy(towards(p, b));
  });
  d += 'Z';
  const tip = [50 + j(), 47 + j()];
  const flap = `M${xy(c[0])}L${xy(tip)}L${xy(c[1])}`;
  const wx = c[r() < 0.5 ? 0 : 1], wl = 6 + r() * 8;
  const wax = `<path d="M${f(wx[0] - 5)} ${f(wx[1])}a5 5 0 0 1 10 0v${f(wl)}a2 2 0 0 1-4 0v-${f(wl / 2)}a2 2 0 0 0-3 0z" fill="ACC"/>`;
  const lh = [12 + r() * 3, 46 + r() * 10], rh = [88 - r() * 3, 46 + r() * 10];
  const back = `<path d="M26 46L${xy(lh)}M74 46L${xy(rh)}M42 62l-3 20M58 62l3 20" fill="none" stroke-width="2.4"/>` +
    `<path d="M${xy(lh)}l-4-2m4 2l-3 4m3-4l1 4M${xy(rh)}l4-2m-4 2l3 4m-3-4l-1 4" fill="none" stroke-width="2"/>` +
    `<path d="M33 85a6 3.4 0 0 1 8-4l1 3zM67 85a6 3.4 0 0 0-8-4l-1 3z" fill="${NAVY}"/>`;
  return { d, back, flap, wax, face: [50, 53, 0.9], hands: [lh, rh], head: [50, y0], mottle: 0 };
}

function oshimi(r) {
  const wob = wobbler(r, 0.05), nc = 5 + ((r() * 3) | 0), crown = [];
  for (let i = 0; i < nc; i++) crown.push(deg(-150 + (120 * i) / (nc - 1) + (r() - 0.5) * 8));
  const claws = [deg(-178 + r() * 10), deg(-2 - r() * 10)];
  const rf = t => 1 + wob(t) + crown.reduce((s, a) => s + (0.36 + 0.14 * sin(a * 3 + 1)) * bump(t, a, 0.075), 0) +
    claws.reduce((s, a) => s + 0.16 * bump(t, a, 0.1), 0) + 0.08 * sin(t * 11) * (sin(t) > 0.3 ? 1 : 0);
  const { pts, at } = polarBody(50, 62, 42, 27, 64, rf);
  pts.forEach(p => { p[1] = min(p[1], 92); p[0] = min(97, max(3, p[0])); });
  const jewels = crown.map(a => { const p = at(a); return `<circle cx="${f(p[0])}" cy="${f(max(4, p[1]))}" r="2" fill="${LAMP}"/>`; }).join('');
  const eyes = [];
  for (let i = 0, m = 3 + ((r() * 4) | 0); i < m && eyes.length < m; i++) {
    const a = r() * 2 * PI, k = 0.55 + r() * 0.3, p = [50 + cos(a) * 34 * k, 64 + sin(a) * 20 * k];
    if (Math.abs(p[0] - 50) < 17 && Math.abs(p[1] - 62) < 13) continue;
    eyes.push(`<g transform="translate(${xy(p)})"><circle r="3.2" fill="EYE"/><circle r="1.3" fill="${NAVY}" stroke="none"/></g>`);
  }
  return { d: qpath(pts), front: jewels + eyes.join(''), face: [50, 60, 1.15], hands: [at(claws[0]), at(claws[1])], head: at(-PI / 2), mottle: 1 };
}

const BODY = { shimi, keshikasu, nijimi, hokoridama, atenashi, oshimi };

// ---- 顔：目5 × 口5 ----
const EYES = [
  // 怒り目（左目の形。右目は左右反転）
  e => `<path d="M-5-3L5 1Q4 5 0 5Q-5 5-5-3Z" fill="${e}"/><circle cx="1" cy="2" r="1.7" fill="${NAVY}" stroke="none"/>`,
  // まんまる
  (e, lx, ly) => `<circle r="4.6" fill="${e}"/><circle cx="${lx}" cy="${ly}" r="2.1" fill="${NAVY}" stroke="none"/>`,
  // ねむい
  e => `<path d="M-5 0A5 5 0 0 0 5 0Z" fill="${e}"/><circle cy="2" r="1.6" fill="${NAVY}" stroke="none"/><path d="M-6-.5H6" stroke-width="2.4"/>`,
  // ひとつ目（中央に1つだけ）
  null,
  // にやり（三日月）
  () => `<path d="M-5 1Q0-6 5 1Q0-2-5 1Z" fill="${NAVY}"/>`,
];
const MOUTHS = [
  `<path d="M-8 0Q0 9 8 0Z" fill="${NAVY}"/><path d="M-6 .4L-4 3-2 .6 0 3.4 2 .6 4 3 6 .4" fill="${PAPER}" stroke="none"/>`,
  `<ellipse cy="1" rx="2.6" ry="3.2" fill="${NAVY}"/>`,
  `<path d="M-6 1Q-3-2 0 1T6 1" fill="none"/>`,
  `<path d="M-7-1Q0 6 7-1" fill="none"/><path d="M2 1.6L5 .6 3.6 4.4Z" fill="${PAPER}" stroke-width="1"/>`,
  `<path d="M-6 4Q0-3 6 4Z" fill="${NAVY}"/><path d="M-2 .6h4l-2 2.6z" fill="${PAPER}" stroke="none"/>`,
];

function drawFace([cx, cy, s], eyeKind, mouthKind, eyeFill, r) {
  const lx = f((r() - 0.5) * 3), ly = f((r() - 0.5) * 2), gap = f(8 + r() * 3);
  let eyes;
  if (eyeKind === 3) {
    eyes = `<g transform="translate(0 -3)"><circle r="7.2" fill="${PAPER}"/><circle cx="${lx}" r="4.2" fill="${LAMP}" stroke="none"/><ellipse cx="${lx}" rx="1.3" ry="3.4" fill="${NAVY}" stroke="none"/></g>`;
  } else {
    const one = EYES[eyeKind](eyeFill, lx, ly);
    eyes = `<g transform="translate(-${gap} -3)">${one}</g><g transform="translate(${gap} -3) scale(-1 1)">${one}</g>`;
  }
  return `<g transform="translate(${f(cx)} ${f(cy)}) scale(${s})" stroke-width="2">${eyes}<g transform="translate(0 9)">${MOUTHS[mouthKind]}</g></g>`;
}

// ---- 小物（分類16種） ----
const GEAR = (() => { const p = []; for (let i = 0; i < 16; i++) { const a = (i / 16) * 2 * PI, k = i % 4 < 2 ? 9 : 6.5; p.push([cos(a) * k, sin(a) * k]); } return lpath(p); })();
const STAR = (() => { const p = []; for (let i = 0; i < 10; i++) { const a = (i / 10) * 2 * PI - PI / 2, k = i % 2 ? 4.2 : 10; p.push([cos(a) * k, sin(a) * k]); } return lpath(p); })();
const PROPS = {
  coin: (a, p) => `<circle cx="4" cy="-3" r="6" fill="${a}"/><circle r="7" fill="${a}"/><circle r="2.4" fill="${p}"/>`,
  bag: a => `<path d="M-5-6v-4h10v4" fill="none"/><rect x="-10" y="-6" width="20" height="14" rx="2" fill="${a}"/><path d="M-10 0h20" fill="none"/>`,
  hat: a => `<ellipse cy="2" rx="14" ry="3" fill="${NAVY}"/><path d="M-7 2V-13H7V2Z" fill="${NAVY}"/><path d="M-7-2H7" stroke="${a}" stroke-width="3"/>`,
  watch: (a, p) => `<circle cy="-11" r="2.4" fill="none"/><circle r="8.5" fill="${p}"/><path d="M0-5V0l3.5 2" fill="none"/><circle r="8.5" fill="none" stroke="${a}" stroke-width="1.4" transform="scale(.8)"/>`,
  flag: a => `<path d="M-6 14V-13" stroke-width="2.6"/><path d="M-6-13l16 6-16 6Z" fill="${a}"/>`,
  ticket: (a, p) => `<path d="M-12-7h24v4a3 3 0 0 0 0 6v4h-24v-4a3 3 0 0 0 0-6Z" fill="${a}"/><path d="M-4-7v14" stroke-dasharray="2 2" fill="none" stroke-width="1.4"/>`,
  spoon: (a, p) => `<path d="M0-2v15" stroke-width="3.2"/><ellipse cy="-8" rx="5" ry="6.5" fill="${p}"/>`,
  letter: (a, p) => `<rect x="-11" y="-8" width="22" height="16" fill="${p}"/><path d="M-11-8l11 9 11-9" fill="none"/><circle cx="6" cy="3" r="2.4" fill="${a}" stroke="none"/>`,
  tag: (a, p) => `<path d="M-14-6h18l7 6-7 6h-18Z" fill="${a}" transform="rotate(-15)"/><circle cx="2" cy="-1" r="1.6" fill="${p}" transform="rotate(-15)"/>`,
  gear: (a, p) => `<path d="${GEAR}" fill="${a}"/><circle r="2.8" fill="${p}"/>`,
  leaf: a => `<path d="M0 10Q-11 0 0-12Q11 0 0 10Z" fill="${a}"/><path d="M0 13V-6M0 2l-4-3M0-3l4-3" fill="none" stroke-width="1.5"/>`,
  plaster: (a, p) => `<g transform="rotate(35)"><rect x="-10" y="-3.6" width="20" height="7.2" rx="3.6" fill="${p}"/></g><g transform="rotate(-35)"><rect x="-10" y="-3.6" width="20" height="7.2" rx="3.6" fill="${p}"/><rect x="-3" y="-3.6" width="6" height="7.2" fill="${a}" stroke="none"/></g>`,
  bubble: (a, p) => `<path d="M-4 7l-6 6 1-7" fill="${p}"/><ellipse rx="12" ry="8.5" fill="${p}"/><path d="M-6 0h.1M0 0h.1M6 0h.1" stroke-width="3.4"/>`,
  ruler: a => `<rect x="-14" y="-4" width="28" height="8" fill="${a}"/><path d="M-10-4v3.5M-6-4v2M-2-4v3.5M2-4v2M6-4v3.5M10-4v2" fill="none" stroke-width="1.4"/>`,
  arrow: a => `<path d="M-11 8Q-8-6 6-6" fill="none" stroke-width="4.6"/><path d="M-11 8Q-8-6 6-6" fill="none" stroke="${a}" stroke-width="2"/><path d="M3-12l9 6-9 5Z" fill="${a}"/>`,
  star: a => `<path d="${STAR}" fill="${a}"/>`,
};
// 小物の置き場：手に持つ／頭にのせる／顔に貼る／頭の横に浮かぶ
const PLACE = { hat: 'head', star: 'head', plaster: 'face', bubble: 'side', arrow: 'side' };

function placeProp(prop, sp, r, a, p) {
  if (!prop) return '';
  const where = PLACE[prop] ?? 'hand', side = r() < 0.5 ? 0 : 1, sgn = side ? 1 : -1;
  let x, y, rot = (r() - 0.5) * 30, s = 0.95;
  if (where === 'hand') [x, y] = sp.hands[side];
  else if (where === 'head') { [x, y] = sp.head; y -= prop === 'hat' ? 3 : 9; rot /= 2; s = prop === 'hat' ? 0.9 : 0.75; }
  else if (where === 'face') { x = sp.face[0] + sgn * 12; y = sp.face[1] - 10; s = 0.7; }
  else { x = sp.head[0] + sgn * 26; y = sp.head[1] + 4; rot /= 3; s = 0.85; }
  x = min(88, max(12, x)); y = min(90, max(10, y));
  return `<g transform="translate(${f(x)} ${f(y)}) rotate(${f(rot)}) scale(${s})" stroke-width="2">${PROPS[prop](a, p)}</g>`;
}

// ---- 共有の定義（1ページに1回） ----
export function charaDefs() {
  const pat = (id, w, body, tf = '') => `<pattern id="${id}" width="${w}" height="${w}" patternUnits="userSpaceOnUse"${tf ? ` patternTransform="${tf}"` : ''}>${body}</pattern>`;
  const mask = (id, pid) => `<mask id="${id}" maskUnits="userSpaceOnUse" x="-60" y="-60" width="220" height="220"><rect x="-60" y="-60" width="220" height="220" fill="url(#${pid})"/></mask>`;
  const sil = (id, c) => `<filter id="${id}"><feFlood flood-color="${c}"/><feComposite in2="SourceAlpha" operator="in"/></filter>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" id="bk-defs" aria-hidden="true" style="position:absolute;width:0;height:0;overflow:hidden"><defs>` +
    // 手刷りの揺れ（輪郭が少しよれる）
    `<filter id="bk-rough" x="-10%" y="-10%" width="120%" height="120%"><feTurbulence type="fractalNoise" baseFrequency=".09" numOctaves="2" seed="4"/><feDisplacementMap in="SourceGraphic" scale="2.4" xChannelSelector="R" yChannelSelector="G"/></filter>` +
    // 色版のかすれ（インクの乗らない点）
    `<filter id="bk-ink" x="-10%" y="-10%" width="120%" height="120%"><feTurbulence type="fractalNoise" baseFrequency=".55" numOctaves="2" seed="9" result="n"/><feColorMatrix in="n" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 -7 0 0 0 4.6" result="m"/><feComposite in="SourceGraphic" in2="m" operator="in"/></filter>` +
    `<filter id="bk-glow" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="3.2"/></filter>` +
    sil('bk-sn', NAVY) + sil('bk-sm', MIST) +
    pat('bk-ps', 7, '<rect width="3" height="7" fill="#fff"/>', 'rotate(40)') +
    pat('bk-pd', 8, '<circle cx="2" cy="2" r="1.7" fill="#fff"/><circle cx="6" cy="6" r="1.7" fill="#fff"/>') +
    pat('bk-pc', 10, '<path d="M0 0h5v5H0zM5 5h5v5H5z" fill="#fff"/>', 'rotate(8)') +
    pat('bk-ph', 2.7, '<circle cx="1.35" cy="1.35" r=".8" fill="#fff"/>', 'rotate(30)') +
    mask('bk-ms', 'bk-ps') + mask('bk-md', 'bk-pd') + mask('bk-mc', 'bk-pc') + mask('bk-mh', 'bk-ph') +
    `</defs></svg>`;
}

let defsReady = false;
function ensureDefs() {
  if (defsReady || typeof document === 'undefined' || !document.body) return;
  if (!document.getElementById('bk-defs')) document.body.insertAdjacentHTML('afterbegin', charaDefs());
  defsReady = true;
}

const SPARK = 'M0-5L1.2-1.2 5 0 1.2 1.2 0 5-1.2 1.2-5 0-1.2-1.2Z';

// ---- 本体 ----
export function drawChara(word, { state = 'print', inkTone, odd } = {}) {
  ensureDefs();
  const id = word.id, r = mulberry32(seedOf(id));
  const species = speciesOf(word);
  const sp = BODY[species](r);
  const isOdd = odd ?? (word.kind === 'odd' || word.odd === true);
  const inks = INKS[inkTone ?? word.ch] ?? INKS[1];
  let [ink, acc] = inks[(r() * 4) | 0];
  const eyeKind = (r() * 5) | 0, mouthKind = (r() * 5) | 0;
  const pattern = (r() * 4) | 0, patOnPaper = r() < 0.5;
  let eye = r() < 0.55 ? LAMP : PAPER;
  const tilt = f((r() - 0.5) * (species === 'atenashi' ? 16 : 10));
  const mx = f(0.8 + r() * 1.2) * (r() < 0.5 ? -1 : 1), my = f(0.6 + r() * 1.0);
  const prop = PROP_OF[word.cat];
  // 小物の色：差し色。紺の差し色なら紙色に寄せる
  let pa = acc === NAVY ? LAMP : acc, pp = PAPER;
  if (isOdd) { ink = NIGHT; acc = LAMP; pa = LAMP; eye = LAMP; }
  const proof = state === 'proof';
  if (proof) { ink = PAPER; acc = PAPER; pa = PAPER; eye = PAPER; }

  const k = `bk-k-${id}`, c = `bk-c-${id}`;
  const pat = ['', 'bk-ms', 'bk-md', 'bk-mc'][pattern];
  const patFill = isOdd ? LAMP : proof ? NAVY : patOnPaper ? PAPER : NAVY;
  const patOp = isOdd ? 0.55 : proof ? 0.18 : patOnPaper ? 0.45 : 0.24;

  // 色版のまだら（参考絵の朱と霧のまだら）
  let mottles = '';
  if (!proof && r() < sp.mottle + (isOdd ? 0 : 0)) {
    for (let i = 0, m = 1 + ((r() * 2) | 0); i < m; i++) {
      const cx = 30 + r() * 40, cy = 34 + r() * 36, rr = 4 + r() * 5, pts = [];
      for (let j = 0; j < 7; j++) { const a = (j / 7) * 2 * PI; pts.push([cx + cos(a) * rr * (0.6 + r() * 0.6), cy + sin(a) * rr * (0.6 + r() * 0.6)]); }
      mottles += `<path d="${qpath(pts)}" fill="${acc}" opacity=".85"/>`;
    }
  }
  const halo = sp.halo ? `<use href="#${k}" fill="${proof ? NAVY : MIST}" opacity="${proof ? 0.12 : 0.6}" transform="translate(50 50) scale(1.1) translate(-53 -52)"/>` : '';
  const lumps = sp.lumps ? `<path d="${sp.lumps}" fill="${ink}"/>` : '';
  const flapFill = sp.flap ? `<path d="${sp.flap}Z" fill="${PAPER}" opacity=".35"/>` : '';
  const color =
    `<g filter="url(#bk-ink)" transform="translate(${mx} ${my})">${halo}${lumps}<use href="#${k}" fill="${ink}"/>` +
    `<g clip-path="url(#${c})"><rect width="100" height="100" fill="${isOdd ? LAMP : NAVY}" mask="url(#bk-mh)" opacity="${isOdd ? 0.5 : 0.85}"/>` +
    `<use href="#${k}" fill="${ink}" transform="translate(-5 -6)"/>${mottles}` +
    (pat ? `<rect width="100" height="100" fill="${patFill}" opacity="${patOp}" mask="url(#${pat})"/>` : '') +
    `</g>${flapFill}${sp.wax && !proof ? sp.wax.replace('ACC', acc === NAVY ? RED : acc) : ''}</g>`;
  const key =
    (sp.lumps ? `<path d="${sp.lumps}" fill="none" stroke-width="2.4"/>` : '') +
    `<use href="#${k}" fill="none" stroke-width="3"/>` +
    (sp.flap ? `<path d="${sp.flap}" fill="none" stroke-width="2.2"/>` : '') +
    (sp.crumbs ? `<path d="${sp.crumbs}" fill="${proof ? PAPER : ink}" stroke-width="1.6"/>` : '') +
    (sp.front ? sp.front.replace(/EYE/g, eye) : '') +
    drawFace(sp.face, eyeKind, mouthKind, eye, r) +
    placeProp(prop, sp, r, pa, pp);

  const defs = `<defs><path id="${k}" d="${sp.d}"/><clipPath id="${c}"><use href="#${k}"/></clipPath></defs>`;
  const art = `<g stroke="${NAVY}" stroke-linejoin="round" stroke-linecap="round">${sp.back ?? ''}${color}${key}</g>`;
  const head = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" class="bk bk-${species}" data-state="${state}">`;
  const turn = `transform="rotate(${tilt} 50 55)"`;

  if (state === 'shadow') {
    const s = `bk-s-${id}`;
    return `${head}<defs><path id="${k}" d="${sp.d}"/><clipPath id="${c}"><use href="#${k}"/></clipPath><g id="${s}">${art}</g></defs>` +
      `<g filter="url(#bk-rough)" ${turn}><use href="#${s}" filter="url(#bk-sm)" transform="translate(2.2 1.6)" opacity=".8"/><use href="#${s}" filter="url(#bk-sn)"/></g></svg>`;
  }
  let extra = '', glow = '';
  if (state === 'gold') {
    glow = `<use href="#${k}" fill="${LAMP}" stroke="${LAMP}" stroke-width="9" filter="url(#bk-glow)" opacity=".9"/>`;
    for (let i = 0; i < 3; i++) {
      const a = r() * 2 * PI;
      extra += `<path d="${SPARK}" fill="${LAMP}" stroke="${NAVY}" stroke-width=".9" transform="translate(${f(50 + cos(a) * 40)} ${f(52 + sin(a) * 38)}) scale(${f(0.9 + r() * 0.6)})"/>`;
    }
  }
  if (isOdd && !proof) {
    for (let i = 0; i < 3; i++) extra += `<path d="${SPARK}" fill="${LAMP}" transform="translate(${f(10 + r() * 80)} ${f(8 + r() * 14)}) scale(.6)"/>`;
  }
  return `${head}${defs}<g filter="url(#bk-rough)" ${turn}>${glow}${art}</g>${extra}</svg>`;
}
