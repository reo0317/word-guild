// 語 → 紙魚の設計値。DOM は使わない。同じ入力には必ず同じ結果を返す。
// 体は語の意味の絵を優先。無ければ分類（16種）、空の分類は既存5種、13文字以上は大物（oshimi）。
// 表情は体の絵のまま（目は重ねない）。違いは、インク・模様・持ち物・左右反転・傾き・大きさで出す。
import {mulberry32} from './rng.mjs';
import {spelling} from './board.mjs';

// ブラウザーの起動時に読み終える。未配置・通信失敗時は分類の体を使う。
let wordart = {};
if (typeof window !== 'undefined') {
  try {
    const response = await fetch(new URL('../data/wordart.json', import.meta.url));
    if (response.ok) wordart = await response.json();
  } catch { /* 意味の絵は任意 */ }
}
const validArt = art => art && /^c[1-9]\d*-\d+$/.test(art.g) && Number.isInteger(art.tint) && art.tint >= 0 && art.tint <= 3;

export const CATEGORIES = ['money', 'work', 'person', 'time', 'place', 'move', 'food', 'doc',
  'goods', 'tool', 'nature', 'body', 'mind', 'number', 'action', 'state'];
export const PLAIN_SPECIES = ['shimi', 'keshikasu', 'nijimi', 'hokoridama', 'atenashi'];
export const BIG_SPECIES = 'oshimi';
export const BIG_LETTERS = 13;

// 小物（16種）。分類ごとの「その語らしい物」と、持ち物として選ぶ候補は同じ表。
export const PROPS = ['coin', 'bag', 'hat', 'watch', 'flag', 'ticket', 'spoon', 'envelope',
  'tag', 'gear', 'leaf', 'bandage', 'bubble', 'ruler', 'arrow', 'star'];
export const PROP_OF = {
  money: 'coin', work: 'bag', person: 'hat', time: 'watch', place: 'flag', move: 'ticket', food: 'spoon', doc: 'envelope',
  goods: 'tag', tool: 'gear', nature: 'leaf', body: 'bandage', mind: 'bubble', number: 'ruler', action: 'arrow', state: 'star',
};
export const INKS = 3; // 区ごとのインクの数
export const PATTERNS = ['plain', 'stripe', 'dot', 'grid'];
export const TILTS = [-6, -3, 0, 3, 6];
export const SCALES = [0.94, 1, 1.06];

function hash(text) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
const rngOf = (prefix, id) => mulberry32(hash(prefix + id));
const pick = (list, rand) => list[Math.floor(rand() * list.length)];

export const isBigWord = word => spelling(word.w).length >= BIG_LETTERS;

// tag は products/word-guild/data/chara.json の値（16種か空文字）。
export function charaSpec(word, tag = '', artMap = wordart) {
  const rand = rngOf('chara:', word.id);
  const big = isBigWord(word);
  const category = CATEGORIES.includes(tag) ? tag : '';
  const species = big ? BIG_SPECIES : category || pick(PLAIN_SPECIES, rand);
  // 以降の乱数は、種族の選び方（乱数を使うかどうか）に左右されないよう、別の列から引く。
  const r = rngOf('trait:', word.id);
  const own = PROP_OF[category];
  const props = PROPS.filter(prop => prop !== own);
  const art = artMap?.[word.id];
  return {
    species,
    prop: pick(props, r),
    ink: Math.floor(r() * INKS),
    pattern: Math.floor(r() * PATTERNS.length),
    flip: r() < 0.5,
    tilt: pick(TILTS, r),
    scale: pick(SCALES, r),
    kind: big ? 'big' : 'normal',
    ...(validArt(art) ? {wordart: {g: art.g, tint: art.tint}, prop: '', pattern: 0} : {}),
  };
}

const keyOf = spec => [spec.species, spec.prop, spec.ink, spec.pattern].join('/');

// 分類の体は同じページ（25語）で、種族・持ち物・インク・模様がすべて同じ組を作らない。
// 重なったら、その語の乱数で持ち物・インク・模様を振り直す。
export function pageSpecs(words, tags = [], artMap = wordart) {
  const specs = words.map((word, i) => charaSpec(word, tags[i] ?? '', artMap));
  const seen = new Set();
  specs.forEach((spec, i) => {
    if (spec.wordart) return; // 意味と tint はページ内の重複調整で変えない
    const rand = rngOf('page:', words[i].id);
    // 大物（oshimi）は種族から分類が分からないので、語の分類（tags）の小物も除く。
    const own = new Set([PROP_OF[spec.species], PROP_OF[tags[i] ?? '']]);
    const props = PROPS.filter(prop => !own.has(prop));
    for (let guard = 0; seen.has(keyOf(spec)) && guard < 200; guard++) {
      spec.prop = pick(props, rand);
      spec.ink = Math.floor(rand() * INKS);
      spec.pattern = Math.floor(rand() * PATTERNS.length);
    }
    seen.add(keyOf(spec));
  });
  return specs;
}

// 習熟度の状態 {box, due, seen}（まだ出会っていなければ undefined）→ 切手の状態。
export function stampState(state) {
  const box = state?.box ?? 0;
  if (box >= 5) return 'gold';
  if (box >= 3) return 'print';
  if (box >= 1) return 'proof';
  return 'shadow';
}

// 体の絵（art/ からの相対）。
export const bodyFile = species => CATEGORIES.includes(species) ? `art/body-${species}.webp` : `art/${species}.webp`;
