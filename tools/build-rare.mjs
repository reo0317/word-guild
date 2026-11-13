// Y6: 材料を検査してから公開データをまとめる。cwd に依存しない。
import {readFileSync, writeFileSync, existsSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
import {resolve} from 'node:path';
import {generateBoard, spelling} from '../products/word-guild/guild/board.mjs';
import {CATEGORIES} from '../products/word-guild/guild/chara.mjs';
import {mulberry32} from '../products/word-guild/guild/rng.mjs';
import {parseLine, inflects} from '../products/word-guild/guild/story.mjs';
import {checkPostscript} from './story-check.mjs';
const root = new URL('../', import.meta.url);
const json = path => JSON.parse(readFileSync(new URL(path, root), 'utf8'));
export function checkRareData(rare, words, source, chara) {
  const issues = [], warnings = [];
  const add = message => issues.push(message);
  if (rare.length !== 280) add(`まれびと ${rare.length}/280語`);
  const used = new Set(words.map(w => spelling(w.w)));
  const seen = new Set();
  for (const [i, w] of rare.entries()) {
    const label = `${w.id} ${w.w}`;
    if (w.id !== `r${String(i + 1).padStart(4, '0')}`) add(`${label}: id の順序`);
    if (!/^[a-z]{4,12}$/.test(w.w)) add(`${label}: 綴り`);
    if (!source.has(w.w) || source.get(w.w) !== w.rank) add(`${label}: NGSL 見出し語・順位`);
    const key = spelling(w.w);
    if (used.has(key) || seen.has(key)) add(`${label}: 盤面の綴りが重複`);
    seen.add(key);
    if (!Number.isInteger(w.shelf) || w.shelf < 1 || w.shelf > 56 || w.ch !== words.find(x => x.shelf === w.shelf)?.ch) add(`${label}: shelf/ch`);
    for (const field of ['ja','pos','ex','exJa']) if (typeof w[field] !== 'string' || !w[field].trim()) add(`${label}: ${field} が空`);
    if (!['n','v','a','o'].includes(w.pos)) add(`${label}: pos`);
    if (!(w.ex?.match(/[a-z]+/gi) ?? []).some(t => inflects(w.w, t))) add(`${label}: 例句に対象語がない`);
    if (chara[w.id] && !CATEGORIES.includes(chara[w.id])) add(`${label}: 分類が不正`);
    if (!chara[w.id]) warnings.push(`${label}: 分類が空`);
  }
  for (let shelf = 1; shelf <= 56; shelf++) if (rare.filter(w => w.shelf === shelf).length !== 5) add(`棚${shelf}: 5語ではない`);
  return {issues, warnings};
}
export function checkRareBoards(rare) {
  for (const w of rare) for (let seed = 1; seed <= 300; seed++) {
    const board = generateBoard([w.w], mulberry32(seed));
    const path = board.paths[w.w];
    if (!path || path.length !== w.w.length || new Set(path).size !== path.length ||
        path.some((cell,i) => board.letters[cell] !== w.w[i].toUpperCase() ||
          (i > 0 && !(Math.abs(cell % 7 - path[i-1] % 7) + Math.abs(Math.floor(cell / 7) - Math.floor(path[i-1] / 7)) === 1)))) {
      throw new Error(`${w.id}: 種${seed} の盤面が不正`);
    }
  }
}
export function loadRareInputs() {
  const words = json('products/word-guild/data/words.json');
  const chara = json('products/word-guild/data/chara.json');
  const source = new Map(readFileSync(new URL('data/source/NGSL_12_stats.csv', root), 'latin1').split(/\r?\n/).slice(1).filter(x => x.trim()).map(line => {const [w, rank] = line.split(','); return [w.trim().toLowerCase(), Number(rank)];}));
  return {words, chara, source};
}
export function buildRare() {
  const {words, chara, source} = loadRareInputs();
  const classificationPath = new URL('data/work/rare-chara.json', root);
  const classification = existsSync(classificationPath) ? json('data/work/rare-chara.json') : {};
  const rare = [], ps = [];
  for (let ch = 1; ch <= 6; ch++) {
    const chapter = json(`data/work/rare-ch${ch}.json`), post = json(`data/work/ps-ch${ch}.json`);
    if (chapter.ch !== ch || post.ch !== ch) throw new Error(`章${ch}: ch が不一致`);
    rare.push(...chapter.words.map(w => ({...w, ch})));
    ps.push(...post.ps);
  }
  rare.sort((a,b) => a.shelf - b.shelf);
  rare.forEach((w,i) => {w.id = `r${String(i+1).padStart(4,'0')}`; chara[w.id] = classification[w.w] ?? chara[w.id] ?? '';});
  ps.sort((a,b) => a.shelf - b.shelf);
  for (const p of ps) p.ids = parseLine(p.en).filter(x => x.type === 'word').map(pw => rare.find(w => w.shelf === p.shelf && inflects(w.w, pw.text))?.id ?? '');
  const result = checkRareData(rare, words, source, chara);
  result.issues.push(...checkPostscript(ps, rare, words, json('products/word-guild/data/story-allow.json')).issues);
  if (result.issues.length) throw new Error(result.issues.join('\n'));
  checkRareBoards(rare);
  for (const [name, data] of [['rare',rare],['story-ps',ps],['chara',chara]]) writeFileSync(new URL(`products/word-guild/data/${name}.json`, root), (name === 'chara' ? '{\n' + Object.entries(data).map(([k,v]) => JSON.stringify(k)+':'+JSON.stringify(v)).join(',\n') + '\n}' : JSON.stringify(data,null,1))+'\n');
  console.log(`まれびと ${rare.length}語、追伸 ${ps.length}行。警告: 分類が空 ${result.warnings.length}語`);
  return {rare, ps};
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try { buildRare(); } catch(e) { console.error(e.message); process.exitCode = 1; }
}
