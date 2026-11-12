// 方式A：既存の敵の絵を体にして、語ごとに決まった乱数で色・模様・表情・小物を組み合わせる。
// drawChara(word, {state, inkTone, unify}) → SVG 文字列（切手の枠は呼び出し側が描く）
//   word  : words.json の1要素 + cat（分類）。odd:true なら「変わり種」
//   state : 'shadow' | 'proof' | 'print' | 'gold'
//   inkTone: 区の番号（1〜）
//   unify : true で「色そろえ」（区の2〜3色のインクに刷り直し、網点、色ずれ）
const ART = new URL('../../products/word-guild/art/', import.meta.url).href;

export const PAPER = '#f4ead5';
export const LINE = '#1f2340';

// ---------- 乱数 ----------
function hash(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
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

// ---------- 区のインク（各区4色） ----------
export const WARDS = {
  1: { name: '朝の庭', inks: [['藍', '#2b4a8f'], ['朱', '#c8442c'], ['若緑', '#3a7d55'], ['菫', '#6b4a9a']] },
  2: { name: '港町', inks: [['琥珀', '#b0701a'], ['臙脂', '#8c2a40'], ['青磁', '#2f8a86'], ['鉄紺', '#34476a']] },
  3: { name: '市場', inks: [['橙', '#d0661f'], ['茶', '#7a4a2a'], ['萌黄', '#7a9a2a'], ['紺', '#25407a']] },
  4: { name: '学院', inks: [['墨', '#34384a'], ['葡萄', '#7a2a6a'], ['浅葱', '#2a7a9a'], ['丹', '#b8402a']] },
  5: { name: '丘', inks: [['苔', '#4a6a2a'], ['紅', '#b02a4a'], ['藍', '#2a4a8a'], ['黄土', '#a8841a']] },
  6: { name: '灯台', inks: [['群青', '#2a3a9a'], ['紫', '#5a2a8a'], ['緑青', '#2a8a6a'], ['朱', '#c8402a']] },
};
const NIGHT = { dark: '#0d0e30', mid: '#2e3b9c', tint: '#e8c35f', paper: PAPER };

function wardOf(tone) { return WARDS[tone] || WARDS[((tone - 1) % 6) + 1] || WARDS[1]; }
function mix(a, b, t) {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
  const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  return '#' + pa.map((v, i) => Math.round(v + (pb[i] - v) * t).toString(16).padStart(2, '0')).join('');
}
function hueOf(hex) {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn;
  if (!d) return 0;
  let h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return (h * 60 + 360) % 360;
}
function inkPalette(hex) {
  return { dark: mix(hex, '#12102a', 0.55), mid: hex, tint: mix(hex, PAPER, 0.62), paper: PAPER };
}

// ---------- 種族（体） ----------
// 512×512 の絵の座標。head=帽子をのせる点、hand=小物を持つ手、eyes=目の中心、er=目の半径
export const SPECIES = {
  shimi:      { img: 'shimi.webp',      head: [232, 112], hand: [416, 322], eyes: [[222, 258], [284, 254]], er: 25 },
  keshikasu:  { img: 'keshikasu.webp',  head: [258, 128], hand: [432, 342], eyes: [[224, 222], [300, 218]], er: 25 },
  nijimi:     { img: 'nijimi.webp',     head: [226, 118], hand: [426, 240], eyes: [[204, 204], [250, 199]], er: 19 },
  hokoridama: { img: 'hokoridama.webp', head: [270, 112], hand: [426, 262], eyes: [[240, 262], [326, 258]], er: 23 },
  atenashi:   { img: 'atenashi.webp',   head: [268, 100], hand: [426, 206], eyes: [[262, 202]], er: 30 },
  oshimi:     { img: 'oshimi.webp',     head: [256, 70],  hand: [420, 430], eyes: [], er: 0 },
};

const BODY_BY_CAT = {
  doc: 'keshikasu', money: 'keshikasu', time: 'keshikasu', number: 'keshikasu',
  goods: 'atenashi', place: 'atenashi', food: 'atenashi', move: 'atenashi', tool: 'atenashi', nature: 'atenashi',
  person: 'hokoridama', work: 'hokoridama', mind: 'hokoridama',
};
export function speciesOf(word) {
  if (word.w.length >= 13) return 'oshimi';
  if (word.pos === 'v') return 'shimi';
  if (word.pos === 'a') return 'nijimi';
  if (word.pos === 'n') return BODY_BY_CAT[word.cat] || 'hokoridama';
  return 'hokoridama';
}

export const CATS = ['money', 'work', 'person', 'time', 'place', 'move', 'food', 'doc', 'goods', 'tool', 'nature', 'body', 'mind', 'number', 'action', 'state'];
export const PROP_OF = {
  money: 'coin', work: 'bag', person: 'hat', time: 'watch', place: 'flag', move: 'ticket', food: 'spoon', doc: 'envelope',
  goods: 'tag', tool: 'gear', nature: 'leaf', body: 'bandage', mind: 'bubble', number: 'ruler', action: 'arrow', state: 'star',
};
export const PATTERNS = ['plain', 'stripe', 'dot', 'grid'];
export const FACES = ['calm', 'wide', 'happy', 'sleepy', 'grumpy'];

// ---------- 設計値 ----------
const override = new Map();
export function charaSpec(word) {
  const o = override.get(word.id);
  const rnd = mulberry32(hash('A' + word.id));
  const base = {
    species: speciesOf(word),
    prop: PROP_OF[word.cat] || null,
    ink: Math.floor(rnd() * 4),
    pattern: Math.floor(rnd() * 4),
    face: Math.floor(rnd() * 5),
    flip: rnd() < 0.5,
    tilt: Math.round((rnd() - 0.5) * 10),
    ink2: 0,
    kind: word.w.length >= 13 ? 'big' : word.odd ? 'odd' : 'normal',
  };
  base.ink2 = (base.ink + 1 + Math.floor(rnd() * 3)) % 4;
  return o ? { ...base, ...o } : base;
}
// 同じページ（25語）で、種族・小物・色・模様・表情がすべて同じ組を作らない
export function prepare(words) {
  const seen = new Set();
  for (const w of words) {
    let s = charaSpec(w);
    const rnd = mulberry32(hash('R' + w.id));
    let guard = 0;
    while (seen.has([s.species, s.prop, s.ink, s.pattern, s.face].join()) && guard++ < 50) {
      s = { ...s, pattern: Math.floor(rnd() * 4), face: Math.floor(rnd() * 5) };
      override.set(w.id, { pattern: s.pattern, face: s.face });
    }
    seen.add([s.species, s.prop, s.ink, s.pattern, s.face].join());
  }
  return words.map((w) => charaSpec(w));
}

// ---------- 小物 ----------
function star(r1, r2, n = 5) {
  const pts = [];
  for (let i = 0; i < n * 2; i++) {
    const a = (Math.PI / n) * i - Math.PI / 2, r = i % 2 ? r2 : r1;
    pts.push((Math.cos(a) * r).toFixed(1) + ',' + (Math.sin(a) * r).toFixed(1));
  }
  return pts.join(' ');
}
const PROPS = {
  coin: (p) => `<circle r="40" fill="${p.b}"/><circle r="27" fill="none" stroke-width="4"/><text y="13" font-size="36" font-weight="900" text-anchor="middle" fill="${p.l}" stroke="none">¥</text>`,
  bag: (p) => `<path d="M-18-22v-14q0-6 6-6h24q6 0 6 6v14" fill="none"/><rect x="-44" y="-24" width="88" height="62" rx="10" fill="${p.a}"/><path d="M-44 4h88" fill="none" stroke-width="4"/><rect x="-9" y="-4" width="18" height="16" rx="3" fill="${p.b}"/>`,
  hat: (p) => `<path d="M-34-6q-2-52 34-52t34 52z" fill="${p.a}"/><rect x="-34" y="-24" width="68" height="14" fill="${p.b}" stroke-width="4"/><ellipse cx="0" cy="-4" rx="54" ry="11" fill="${p.a}"/>`,
  watch: (p) => `<rect x="-8" y="-62" width="16" height="16" rx="3" fill="${p.b}"/><circle r="38" fill="${p.c}"/><path d="M0-22V0l16 10" fill="none"/><circle r="4" fill="${p.l}" stroke="none"/>`,
  flag: (p) => `<path d="M-18 58V-58" fill="none"/><path d="M-18-58l64 14-64 24z" fill="${p.a}"/>`,
  ticket: (p) => `<path d="M-50-28H50V-8a10 10 0 0 0 0 20V28H-50V12a10 10 0 0 0 0-20z" fill="${p.c}"/><path d="M-20-24V24" fill="none" stroke-width="3" stroke-dasharray="6 6"/><rect x="-4" y="-14" width="42" height="12" rx="2" fill="${p.a}" stroke-width="3"/>`,
  spoon: (p) => `<rect x="-6" y="0" width="12" height="56" rx="6" fill="${p.b}"/><ellipse cx="0" cy="-26" rx="23" ry="30" fill="${p.b}"/>`,
  envelope: (p) => `<rect x="-48" y="-32" width="96" height="64" rx="5" fill="${p.c}"/><path d="M-48-32l48 36 48-36" fill="none"/><circle cy="6" r="9" fill="${p.a}" stroke-width="4"/>`,
  tag: (p) => `<path d="M-50 0l28-34H46V34H-22z" fill="${p.c}"/><circle cx="-24" cy="0" r="6" fill="${PAPER}" stroke-width="4"/><text x="16" y="12" font-size="34" font-weight="900" text-anchor="middle" fill="${p.a}" stroke="none">%</text>`,
  gear: (p) => `${[0, 1, 2, 3, 4, 5, 6, 7].map((i) => `<rect x="-9" y="-46" width="18" height="22" rx="3" fill="${p.b}" transform="rotate(${i * 45})"/>`).join('')}<circle r="32" fill="${p.b}"/><circle r="12" fill="${PAPER}" stroke-width="5"/>`,
  leaf: (p) => `<path d="M-42 34Q-48-42 42-42Q48 40-42 34z" fill="${p.b}"/><path d="M-38 32L26-28" fill="none" stroke-width="4"/>`,
  bandage: (p) => `<g transform="rotate(-32)"><rect x="-52" y="-18" width="104" height="36" rx="18" fill="${p.c}"/><rect x="-17" y="-18" width="34" height="36" fill="${p.a}" stroke-width="4"/><circle cx="-34" cy="0" r="3" fill="${p.l}" stroke="none"/><circle cx="34" cy="0" r="3" fill="${p.l}" stroke="none"/></g>`,
  bubble: (p) => `<path d="M-44-36h88a8 8 0 0 1 8 8v38a8 8 0 0 1-8 8H-4l-22 18V18h-18a8 8 0 0 1-8-8v-38a8 8 0 0 1 8-8z" fill="${p.c}"/><circle cx="-20" cy="-9" r="5" fill="${p.l}" stroke="none"/><circle cx="0" cy="-9" r="5" fill="${p.l}" stroke="none"/><circle cx="20" cy="-9" r="5" fill="${p.l}" stroke="none"/>`,
  ruler: (p) => `<g transform="rotate(-24)"><rect x="-54" y="-17" width="108" height="34" rx="4" fill="${p.b}"/><path d="M-38-17v13M-20-17v9M-2-17v13M16-17v9M34-17v13" fill="none" stroke-width="4"/></g>`,
  arrow: (p) => `<path d="M-48-14h52v-26l46 40-46 40V14h-52z" fill="${p.a}"/>`,
  star: (p) => `<polygon points="${star(48, 21)}" fill="${p.b}"/>`,
};
const HAT_SCALE = 1.35, HOLD_SCALE = 1.3;

// ---------- 表情（目をかぶせる） ----------
function eyeSvg(face, x, y, r, side, p) {
  const c = `<circle cx="${x}" cy="${y}" r="${r}" fill="${PAPER}" stroke="${p.l}" stroke-width="5"/>`;
  switch (face) {
    case 'wide':
      return `<circle cx="${x}" cy="${y}" r="${r * 1.12}" fill="${PAPER}" stroke="${p.l}" stroke-width="5"/><circle cx="${x}" cy="${y}" r="${r * 0.32}" fill="${p.l}"/><circle cx="${x - r * 0.12}" cy="${y - r * 0.14}" r="${r * 0.1}" fill="${PAPER}"/>`;
    case 'happy':
      return `<circle cx="${x}" cy="${y}" r="${r}" fill="${PAPER}"/><path d="M${x - r * 0.8} ${y + r * 0.35}Q${x} ${y - r * 0.9} ${x + r * 0.8} ${y + r * 0.35}" fill="none" stroke="${p.l}" stroke-width="7" stroke-linecap="round"/>`;
    case 'sleepy':
      return `${c}<circle cx="${x}" cy="${y + r * 0.25}" r="${r * 0.3}" fill="${p.l}"/><path d="M${x - r} ${y}a${r} ${r} 0 0 1 ${2 * r} 0z" fill="${p.a}" stroke="${p.l}" stroke-width="5" stroke-linejoin="round"/>`;
    case 'grumpy': {
      const dir = side ? 1 : -1;
      return `${c}<circle cx="${x + dir * r * 0.15}" cy="${y + r * 0.2}" r="${r * 0.38}" fill="${p.l}"/><path d="M${x - r * 1.05} ${y - r * (0.95 + dir * 0.3)}L${x + r * 1.05} ${y - r * (0.95 - dir * 0.3)}" stroke="${p.l}" stroke-width="9" stroke-linecap="round"/>`;
    }
    default:
      return `${c}<circle cx="${x + r * 0.1}" cy="${y + r * 0.05}" r="${r * 0.42}" fill="${p.l}"/><circle cx="${x - r * 0.05}" cy="${y - r * 0.12}" r="${r * 0.12}" fill="${PAPER}"/>`;
  }
}

// ---------- 模様 ----------
function patternDef(id, kind, color) {
  if (kind === 'stripe') return `<pattern id="${id}" patternUnits="userSpaceOnUse" width="24" height="24" patternTransform="rotate(45)"><rect width="10" height="24" fill="${color}"/></pattern>`;
  if (kind === 'dot') return `<pattern id="${id}" patternUnits="userSpaceOnUse" width="36" height="36"><circle cx="18" cy="18" r="8" fill="${color}"/></pattern>`;
  if (kind === 'grid') return `<pattern id="${id}" patternUnits="userSpaceOnUse" width="40" height="40"><path d="M0 0H40M0 0V40" stroke="${color}" stroke-width="6" fill="none"/></pattern>`;
  return '';
}

let UID = 0;
const f2 = (n) => (n / 255).toFixed(3);
const rgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
const LUM = '0.3 0.59 0.11 0 0  0.3 0.59 0.11 0 0  0.3 0.59 0.11 0 0  0 0 0 1 0';
const FX = 'x="0" y="0" width="1" height="1" color-interpolation-filters="sRGB"';

// 4段（暗・中・薄・紙）に刷り直す
function colorFilter(id, pal) {
  const ch = (i) => [pal.dark, pal.dark, pal.mid, pal.mid, pal.tint, pal.tint, pal.paper, pal.paper].map((h) => f2(rgb(h)[i])).join(' ');
  return `<filter id="${id}" ${FX}><feColorMatrix type="matrix" values="${LUM}"/><feComponentTransfer><feFuncR type="discrete" tableValues="${ch(0)}"/><feFuncG type="discrete" tableValues="${ch(1)}"/><feFuncB type="discrete" tableValues="${ch(2)}"/></feComponentTransfer><feComposite in2="SourceAlpha" operator="in"/></filter>`;
}
// 暗い所だけ1色に（線の版）。cut は暗さの境（1/10 単位）
function lineFilter(id, color, cut) {
  const [r, g, b] = rgb(color).map((v) => f2(v));
  const table = Array.from({ length: 10 }, (_, i) => (i < cut ? 1 : 0)).join(' ');
  return `<filter id="${id}" ${FX}><feColorMatrix type="matrix" values="${LUM}"/><feComponentTransfer><feFuncR type="discrete" tableValues="${table}"/></feComponentTransfer><feColorMatrix type="matrix" values="0 0 0 0 ${r}  0 0 0 0 ${g}  0 0 0 0 ${b}  1 0 0 0 0"/><feComposite in2="SourceAlpha" operator="in"/></filter>`;
}
const WHITE_FILTER = (id) => `<filter id="${id}" ${FX}><feColorMatrix type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 1 0"/></filter>`;

const SPARK = (x, y, s, c) => `<path transform="translate(${x} ${y}) scale(${s})" d="M0-18Q2-2 18 0Q2 2 0 18Q-2 2-18 0Q-2-2 0-18Z" fill="${c}" stroke="${LINE}" stroke-width="2.5"/>`;

export function drawChara(word, { state = 'print', inkTone = 1, unify = false } = {}) {
  const spec = charaSpec(word);
  const sp = SPECIES[spec.species];
  const ward = wardOf(inkTone);
  const inkHex = ward.inks[spec.ink][1];
  const odd = spec.kind === 'odd';
  const p1 = inkPalette(inkHex), p2 = inkPalette(ward.inks[spec.ink2][1]);
  const pal = odd ? NIGHT : { dark: p1.dark, mid: p2.mid, tint: p1.tint, paper: PAPER, dark2: p2.dark };
  const u = `a${++UID}`;
  const href = ART + sp.img;
  const flipTf = spec.flip ? 'translate(512 0) scale(-1 1)' : '';
  const mx = (x) => (spec.flip ? 512 - x : x);
  const defs = [];
  const body = [];
  const over = [];
  const img = (filter, extra = '') => `<image href="${href}" width="512" height="512" filter="url(#${u}${filter})" ${extra}/>`;

  // 影：輪郭だけ
  if (state === 'shadow') {
    defs.push(`<filter id="${u}s" ${FX}><feColorMatrix type="matrix" values="0 0 0 0 0.38  0 0 0 0 0.36  0 0 0 0 0.46  0 0 0 0.5 0"/></filter>`);
    return `<svg class="chara" viewBox="-28 -28 568 568" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><defs>${defs.join('')}</defs><g transform="${flipTf}">${img('s')}</g></svg>`;
  }

  const proof = state === 'proof';
  const mono = proof ? { l: pal.dark, a: PAPER, b: PAPER, c: PAPER } : null;
  let propPal;

  if (proof) {
    defs.push(lineFilter(`${u}p`, pal.dark, 5));
    body.push(`<g transform="${flipTf}">${img('p')}</g>`);
    propPal = mono;
  } else if (odd) {
    defs.push(colorFilter(`${u}c`, pal), lineFilter(`${u}l`, pal.dark, 3));
    const off = unify ? 'transform="translate(4 3)"' : '';
    body.push(`<g transform="${flipTf}"><g ${off}>${img('c')}</g>${unify ? img('l') : ''}</g>`);
    propPal = { l: pal.dark, a: pal.mid, b: pal.tint, c: PAPER };
  } else if (unify) {
    defs.push(colorFilter(`${u}c`, pal), lineFilter(`${u}l`, pal.dark, 3));
    body.push(`<g transform="${flipTf}"><g transform="translate(4 3)">${img('c')}</g>${img('l')}</g>`);
    propPal = { l: pal.dark, a: pal.mid, b: pal.tint, c: PAPER };
  } else {
    const deg = Math.round((hueOf(inkHex) - 232 + 360) % 360);
    defs.push(`<filter id="${u}h" ${FX}><feColorMatrix type="hueRotate" values="${deg}"/></filter>`);
    body.push(`<g transform="${flipTf}">${img('h')}</g>`);
    propPal = { l: LINE, a: '#d2472b', b: '#f0b63a', c: '#f3e6c8' };
  }

  // 模様と網点は体の形でくりぬく
  const needMask = !proof && (spec.pattern > 0 || unify || odd);
  if (needMask) {
    defs.push(WHITE_FILTER(`${u}w`), `<mask id="${u}m" maskUnits="userSpaceOnUse" x="0" y="0" width="512" height="512"><g transform="${flipTf}">${img('w')}</g></mask>`);
    const pat = PATTERNS[spec.pattern];
    if (pat !== 'plain') {
      defs.push(patternDef(`${u}pt`, pat, pal.dark2 || pal.dark));
      over.push(`<rect width="512" height="512" fill="url(#${u}pt)" mask="url(#${u}m)" opacity="${unify || odd ? 0.3 : 0.38}"/>`);
    }
    if (unify || odd) {
      defs.push(`<pattern id="${u}ht" patternUnits="userSpaceOnUse" width="15" height="15" patternTransform="rotate(30)"><circle cx="7.5" cy="7.5" r="2.7" fill="${pal.dark}"/></pattern>`);
      over.push(`<rect width="512" height="512" fill="url(#${u}ht)" mask="url(#${u}m)" opacity="0.3"/>`);
    }
  }

  // 目
  const eyes = sp.eyes.map(([x, y], i) => eyeSvg(FACES[spec.face], mx(x), y, sp.er, sp.eyes.length > 1 ? (i === 0) !== spec.flip : true, { ...propPal, l: propPal.l, a: propPal.a === PAPER ? '#d9cdb0' : propPal.a })).join('');

  // 小物
  let prop = '';
  if (spec.prop) {
    const hat = spec.prop === 'hat';
    const [px, py] = hat ? sp.head : sp.hand;
    const sc = hat ? HAT_SCALE : HOLD_SCALE;
    const tilt = hat ? spec.tilt : spec.tilt * 2;
    const tf = `translate(${mx(px)} ${hat ? py + 8 : py}) rotate(${tilt}) scale(${sc})`;
    const halo = { l: PAPER, a: PAPER, b: PAPER, c: PAPER };
    prop = `<g transform="${tf}" stroke="${PAPER}" stroke-width="17" stroke-linejoin="round" stroke-linecap="round" fill="none">${PROPS[spec.prop](halo)}</g><g transform="${tf}" stroke="${propPal.l}" stroke-width="6" stroke-linejoin="round" stroke-linecap="round" fill="none">${PROPS[spec.prop](propPal)}</g>`;
  }

  let deco = '';
  if (odd) deco = SPARK(70, 90, 1.1, NIGHT.tint) + SPARK(450, 120, 0.8, NIGHT.tint) + SPARK(110, 400, 0.7, NIGHT.tint) + SPARK(420, 60, 0.55, NIGHT.tint);
  if (state === 'gold') deco += SPARK(60, 440, 0.9, '#f0c23c') + SPARK(455, 90, 0.7, '#f0c23c');

  return `<svg class="chara" viewBox="-28 -28 568 568" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><defs>${defs.join('')}</defs>${body.join('')}${over.join('')}${sp.eyes.length ? eyes : ''}${prop}${deco}</svg>`;
}

export function describe(word) {
  const s = charaSpec(word);
  const ward = wardOf(word.ch || 1);
  return { ...s, inkName: ward.inks[s.ink][0], patternName: ['無地', 'しま', '水玉', '格子'][s.pattern], faceName: ['ふつう', '見開き', 'にっこり', 'ねむい', 'むっつり'][s.face] };
}
