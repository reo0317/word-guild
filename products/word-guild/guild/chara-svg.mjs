// 設計値（chara.mjs）→ 紙魚と切手の SVG／HTML 文字列。DOM は使わない。
// 体は <image>。「色そろえ」は SVG フィルターで行う：体の絵の色分け（紺・霧・紙・朱）を、区のインクに置き換える。
//   紺の線 → インクの濃い色／霧 → インク／紙 → 紙／朱 → 同じ区の別のインク
//   そこに網点と、少しの色ずれ（色の版を右下に 4/512 ずらす）を足す。
// フィルターなどの共有定義は charaDefs() が返す1か所だけ。ページに1回入れる。
import {esc} from './dom.mjs';
import {CATEGORIES, PATTERNS, bodyFile} from './chara.mjs';

export const PAPER = '#f4ead5';
export const LINE = '#1f2340';

// 区ごとの3色のインク
export const WARDS = {
  1: {name: '朝の庭', inks: [['藍', '#2b4a8f'], ['朱', '#c8442c'], ['若緑', '#3a7d55']]},
  2: {name: '港町', inks: [['琥珀', '#b0701a'], ['臙脂', '#8c2a40'], ['青磁', '#2f8a86']]},
  3: {name: '市場', inks: [['橙', '#d0661f'], ['茶', '#7a4a2a'], ['萌黄', '#7a9a2a']]},
  4: {name: '学院', inks: [['墨', '#34384a'], ['葡萄', '#7a2a6a'], ['浅葱', '#2a7a9a']]},
  5: {name: '丘', inks: [['苔', '#4a6a2a'], ['紅', '#b02a4a'], ['藍', '#2a4a8a']]},
  6: {name: '灯台', inks: [['群青', '#2a3a9a'], ['紫', '#5a2a8a'], ['緑青', '#2a8a6a']]},
};
const NIGHT = {dark: '#0d0e30', mid: '#2e3b9c', tint: '#e8c35f', accent: '#e8c35f'};
const wardNo = ward => ((Math.max(1, Math.floor(ward) || 1) - 1) % 6) + 1;

const rgb = hex => [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16));
const f3 = n => (n / 255).toFixed(3);
function mix(a, b, t) {
  const pa = rgb(a), pb = rgb(b);
  return '#' + pa.map((v, i) => Math.round(v + (pb[i] - v) * t).toString(16).padStart(2, '0')).join('');
}
const inkPalette = hex => ({dark: mix(hex, '#12102a', 0.55), mid: hex, tint: mix(hex, PAPER, 0.62)});

function palette(ward, ink) {
  const inks = WARDS[wardNo(ward)].inks;
  const base = inkPalette(inks[ink % inks.length][1]);
  return {...base, accent: inks[(ink + 1) % inks.length][1]};
}

// ---------- フィルター ----------
const SPECIES_FILES = [...CATEGORIES, 'shimi', 'keshikasu', 'nijimi', 'hokoridama', 'atenashi', 'oshimi'];
const FX = 'x="0" y="0" width="1" height="1" color-interpolation-filters="sRGB"';
const LUM = '0.3 0.59 0.11 0 0  0.3 0.59 0.11 0 0  0.3 0.59 0.11 0 0  0 0 0 1 0';

// 明るさ8段 → 濃い・濃い・濃い・インク・インク・薄・紙・紙
function toneFilter(id, p) {
  const steps = [p.dark, p.dark, p.dark, p.mid, p.mid, p.tint, PAPER, PAPER];
  const ch = i => steps.map(hex => f3(rgb(hex)[i])).join(' ');
  return `<filter id="${id}" ${FX}><feColorMatrix type="matrix" values="${LUM}"/><feComponentTransfer><feFuncR type="discrete" tableValues="${ch(0)}"/><feFuncG type="discrete" tableValues="${ch(1)}"/><feFuncB type="discrete" tableValues="${ch(2)}"/></feComponentTransfer><feComposite in2="SourceAlpha" operator="in"/></filter>`;
}
// 朱（R が G よりかなり強い所）だけを、別のインク1色にする
function accentFilter(id, color) {
  const [r, g, b] = rgb(color).map(f3);
  return `<filter id="${id}" ${FX}><feColorMatrix type="matrix" values="0 0 0 0 ${r}  0 0 0 0 ${g}  0 0 0 0 ${b}  4 -4 0 0 -1"/><feComposite in2="SourceAlpha" operator="in"/></filter>`;
}
// 暗い所だけ1色に（線の版）。cut は暗さの境（1/10 単位）
function lineFilter(id, color, cut) {
  const [r, g, b] = rgb(color).map(f3);
  const table = Array.from({length: 10}, (_, i) => (i < cut ? 1 : 0)).join(' ');
  return `<filter id="${id}" ${FX}><feColorMatrix type="matrix" values="${LUM}"/><feComponentTransfer><feFuncR type="discrete" tableValues="${table}"/></feComponentTransfer><feColorMatrix type="matrix" values="0 0 0 0 ${r}  0 0 0 0 ${g}  0 0 0 0 ${b}  1 0 0 0 0"/><feComposite in2="SourceAlpha" operator="in"/></filter>`;
}

let defsCache = null;
// 共有定義。ページに一度だけ入れる（SVG 内の id はドキュメント全体で共有される）。
export function charaDefs(base = '') {
  if (defsCache && defsCache.base === base) return defsCache.html;
  const parts = [];
  for (let w = 1; w <= 6; w++) {
    for (let i = 0; i < 3; i++) {
      const p = palette(w, i);
      parts.push(toneFilter(`cg-t-${w}-${i}`, p), accentFilter(`cg-a-${w}-${i}`, p.accent),
        lineFilter(`cg-l-${w}-${i}`, p.dark, 3), lineFilter(`cg-p-${w}-${i}`, p.dark, 5));
    }
  }
  const nightTone = {dark: NIGHT.dark, mid: NIGHT.mid, tint: NIGHT.tint};
  parts.push(toneFilter('cg-t-odd', nightTone), accentFilter('cg-a-odd', NIGHT.accent),
    lineFilter('cg-l-odd', NIGHT.dark, 3));
  parts.push(`<filter id="cg-shadow" ${FX}><feColorMatrix type="matrix" values="0 0 0 0 0.38  0 0 0 0 0.36  0 0 0 0 0.46  0 0 0 0.5 0"/></filter>`);
  parts.push(`<filter id="cg-white" ${FX}><feColorMatrix type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 1 0"/></filter>`);
  // 模様と網点は、体の形でくりぬく
  for (const name of SPECIES_FILES) {
    parts.push(`<mask id="cg-m-${name}" maskUnits="userSpaceOnUse" x="0" y="0" width="512" height="512"><image href="${esc(base + bodyFile(name))}" width="512" height="512" filter="url(#cg-white)"/></mask>`);
  }
  const dark = '#12102a';
  parts.push(
    `<pattern id="cg-pt-stripe" patternUnits="userSpaceOnUse" width="24" height="24" patternTransform="rotate(45)"><rect width="10" height="24" fill="${dark}"/></pattern>`,
    `<pattern id="cg-pt-dot" patternUnits="userSpaceOnUse" width="36" height="36"><circle cx="18" cy="18" r="8" fill="${dark}"/></pattern>`,
    `<pattern id="cg-pt-grid" patternUnits="userSpaceOnUse" width="40" height="40"><path d="M0 0H40M0 0V40" stroke="${dark}" stroke-width="6" fill="none"/></pattern>`,
    `<pattern id="cg-ht" patternUnits="userSpaceOnUse" width="15" height="15" patternTransform="rotate(30)"><circle cx="7.5" cy="7.5" r="2.7" fill="${dark}"/></pattern>`);
  const html = `<svg xmlns="http://www.w3.org/2000/svg" width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false"><defs>${parts.join('')}</defs></svg>`;
  defsCache = {base, html};
  return html;
}

// ---------- 小物（16種）。座標は原点を中心に約 ±50 ----------
function star(r1, r2, n = 5) {
  const pts = [];
  for (let i = 0; i < n * 2; i++) {
    const a = (Math.PI / n) * i - Math.PI / 2, r = i % 2 ? r2 : r1;
    pts.push(`${(Math.cos(a) * r).toFixed(1)},${(Math.sin(a) * r).toFixed(1)}`);
  }
  return pts.join(' ');
}
const PROP_SVG = {
  coin: p => `<circle r="40" fill="${p.b}"/><circle r="27" fill="none" stroke-width="4"/><text y="13" font-size="36" font-weight="900" text-anchor="middle" fill="${p.l}" stroke="none">¥</text>`,
  bag: p => `<path d="M-18-22v-14q0-6 6-6h24q6 0 6 6v14" fill="none"/><rect x="-44" y="-24" width="88" height="62" rx="10" fill="${p.a}"/><path d="M-44 4h88" fill="none" stroke-width="4"/><rect x="-9" y="-4" width="18" height="16" rx="3" fill="${p.b}"/>`,
  hat: p => `<path d="M-34-6q-2-52 34-52t34 52z" fill="${p.a}"/><rect x="-34" y="-24" width="68" height="14" fill="${p.b}" stroke-width="4"/><ellipse cx="0" cy="-4" rx="54" ry="11" fill="${p.a}"/>`,
  watch: p => `<rect x="-8" y="-62" width="16" height="16" rx="3" fill="${p.b}"/><circle r="38" fill="${p.c}"/><path d="M0-22V0l16 10" fill="none"/><circle r="4" fill="${p.l}" stroke="none"/>`,
  flag: p => `<path d="M-18 58V-58" fill="none"/><path d="M-18-58l64 14-64 24z" fill="${p.a}"/>`,
  ticket: p => `<path d="M-50-28H50V-8a10 10 0 0 0 0 20V28H-50V12a10 10 0 0 0 0-20z" fill="${p.c}"/><path d="M-20-24V24" fill="none" stroke-width="3" stroke-dasharray="6 6"/><rect x="-4" y="-14" width="42" height="12" rx="2" fill="${p.a}" stroke-width="3"/>`,
  spoon: p => `<rect x="-6" y="0" width="12" height="56" rx="6" fill="${p.b}"/><ellipse cx="0" cy="-26" rx="23" ry="30" fill="${p.b}"/>`,
  envelope: p => `<rect x="-48" y="-32" width="96" height="64" rx="5" fill="${p.c}"/><path d="M-48-32l48 36 48-36" fill="none"/><circle cy="6" r="9" fill="${p.a}" stroke-width="4"/>`,
  tag: p => `<path d="M-50 0l28-34H46V34H-22z" fill="${p.c}"/><circle cx="-24" cy="0" r="6" fill="${PAPER}" stroke-width="4"/><text x="16" y="12" font-size="34" font-weight="900" text-anchor="middle" fill="${p.a}" stroke="none">%</text>`,
  gear: p => `${[0, 1, 2, 3, 4, 5, 6, 7].map(i => `<rect x="-9" y="-46" width="18" height="22" rx="3" fill="${p.b}" transform="rotate(${i * 45})"/>`).join('')}<circle r="32" fill="${p.b}"/><circle r="12" fill="${PAPER}" stroke-width="5"/>`,
  leaf: p => `<path d="M-42 34Q-48-42 42-42Q48 40-42 34z" fill="${p.b}"/><path d="M-38 32L26-28" fill="none" stroke-width="4"/>`,
  bandage: p => `<g transform="rotate(-32)"><rect x="-52" y="-18" width="104" height="36" rx="18" fill="${p.c}"/><rect x="-17" y="-18" width="34" height="36" fill="${p.a}" stroke-width="4"/><circle cx="-34" cy="0" r="3" fill="${p.l}" stroke="none"/><circle cx="34" cy="0" r="3" fill="${p.l}" stroke="none"/></g>`,
  bubble: p => `<path d="M-44-36h88a8 8 0 0 1 8 8v38a8 8 0 0 1-8 8H-4l-22 18V18h-18a8 8 0 0 1-8-8v-38a8 8 0 0 1 8-8z" fill="${p.c}"/><circle cx="-20" cy="-9" r="5" fill="${p.l}" stroke="none"/><circle cx="0" cy="-9" r="5" fill="${p.l}" stroke="none"/><circle cx="20" cy="-9" r="5" fill="${p.l}" stroke="none"/>`,
  ruler: p => `<g transform="rotate(-24)"><rect x="-54" y="-17" width="108" height="34" rx="4" fill="${p.b}"/><path d="M-38-17v13M-20-17v9M-2-17v13M16-17v9M34-17v13" fill="none" stroke-width="4"/></g>`,
  arrow: p => `<path d="M-48-14h52v-26l46 40-46 40V14h-52z" fill="${p.a}"/>`,
  star: p => `<polygon points="${star(48, 21)}" fill="${p.b}"/>`,
};
const PROP_SCALE = 1; // 小さく。手元・足元に置く小物
// 体の絵の、小物を置く下の隅（空いている側）。それ以外は右下。flip なら左右が入れ替わる。
const PROP_LEFT = new Set(['body', 'nijimi']);
const PROP_AT = {y: 452, right: 452, left: 60};

function propSvg(spec, p) {
  if (!spec.prop || !PROP_SVG[spec.prop]) return '';
  const left = PROP_LEFT.has(spec.species) !== spec.flip;
  const tf = `translate(${left ? PROP_AT.left : PROP_AT.right} ${PROP_AT.y}) rotate(${spec.tilt * 3}) scale(${PROP_SCALE})`;
  const halo = {l: PAPER, a: PAPER, b: PAPER, c: PAPER};
  const stroke = (color, width) => `stroke="${color}" stroke-width="${width}" stroke-linejoin="round" stroke-linecap="round" fill="none"`;
  return `<g transform="${tf}" ${stroke(PAPER, 17)}>${PROP_SVG[spec.prop](halo)}</g><g transform="${tf}" ${stroke(p.l, 6)}>${PROP_SVG[spec.prop](p)}</g>`;
}

const SPARK = (x, y, s, c) => `<path transform="translate(${x} ${y}) scale(${s})" d="M0-18Q2-2 18 0Q2 2 0 18Q-2 2-18 0Q-2-2 0-18Z" fill="${c}" stroke="${LINE}" stroke-width="2.5"/>`;

// ---------- 紙魚の SVG ----------
// opts: state 'shadow'|'proof'|'print'|'gold'、ward 区の番号（1〜）、base 絵の置き場の前置き（既定 ''）、
//       unify false で色そろえなし（体の絵の元の色）。
export function charaSvg(spec, {state = 'print', ward = 1, base = '', unify = true} = {}) {
  const w = wardNo(ward);
  const href = esc(base + bodyFile(spec.species));
  const img = filter => `<image href="${href}" width="512" height="512"${filter ? ` filter="url(#${filter})"` : ''}/>`;
  const open = '<svg class="chara" viewBox="-24 -24 560 560" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">';
  const pose = inner => `<g transform="translate(256 490) rotate(${spec.tilt}) scale(${spec.scale}) translate(-256 -490)"><g${spec.flip ? ' transform="translate(512 0) scale(-1 1)"' : ''}>${inner}</g></g>`;
  if (state === 'shadow') return `${open}${pose(img('cg-shadow'))}</svg>`;

  const odd = spec.kind === 'odd';
  const proof = state === 'proof';
  const ink = spec.ink % 3;
  const p = odd ? {...NIGHT} : palette(w, ink);
  const suffix = odd ? 'odd' : `${w}-${ink}`;
  const mono = {l: p.dark, a: PAPER, b: PAPER, c: PAPER};
  const props = {l: p.dark, a: p.accent, b: p.tint, c: PAPER};
  let body;
  if (proof) {
    body = img(`cg-p-${suffix}`);
  } else if (!unify) {
    body = img('');
  } else {
    body = `<g transform="translate(4 3)">${img(`cg-t-${suffix}`)}${img(`cg-a-${suffix}`)}</g>${img(`cg-l-${suffix}`)}`;
  }
  let over = '';
  if (!proof && unify) {
    const pattern = PATTERNS[spec.pattern];
    const mask = `url(#cg-m-${spec.species})`;
    if (pattern && pattern !== 'plain') over += `<rect width="512" height="512" fill="url(#cg-pt-${pattern})" mask="${mask}" opacity="0.26"/>`;
    over += `<rect width="512" height="512" fill="url(#cg-ht)" mask="${mask}" opacity="0.28"/>`;
  }
  let deco = '';
  if (odd) deco += SPARK(70, 90, 1.1, NIGHT.tint) + SPARK(450, 120, 0.8, NIGHT.tint) + SPARK(110, 400, 0.7, NIGHT.tint) + SPARK(420, 60, 0.55, NIGHT.tint);
  if (state === 'gold') deco += SPARK(60, 440, 0.9, '#f0c23c') + SPARK(455, 90, 0.7, '#f0c23c');
  return `${open}${pose(body + over)}${propSvg(spec, proof ? mono : props)}${deco}</svg>`;
}

// ---------- 切手の HTML ----------
// size: 'sm'（切手帳の小さい切手）／'lg'（大きい切手。訳も出す）。枠の CSS は呼び出し側（切手帳・見本）が持つ。
// 影のときは語と訳を「？」にする。大物（kind 'big'）は横2枚ぶん（class "big"）。
export function stampHtml(word, spec, {state = 'print', ward = word.ch || 1, base = '', size = 'sm', unify = true} = {}) {
  const shadow = state === 'shadow';
  const classes = ['stamp', `s-${state}`, size === 'lg' ? 'lg' : '', spec.kind === 'big' ? 'big' : ''].filter(Boolean).join(' ');
  const oddMark = spec.kind === 'odd' ? `<i class="odd"${shadow ? ' style="color:#8c8672;text-shadow:none"' : ''}>✦</i>` : '';
  const label = shadow ? '？' : esc(word.w);
  return `<button class="${classes}" data-id="${esc(word.id)}" aria-label="${label}"><div class="in"><span class="val">${word.w.replace(/[^a-zA-Z]/g, '').length}</span>${oddMark}<div class="pic">${charaSvg(spec, {state, ward, base, unify})}</div><div class="lbl">${label}</div>${size === 'lg' ? `<div class="ja">${shadow ? '？' : esc(word.ja)}</div>` : ''}</div></button>`;
}
