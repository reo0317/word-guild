// 骨格（data/work/basic.json・tsl.json）と訳（data/work/ja/NN.json）を id で結合し、
// ゲームが読む products/word-guild/data/words.json を作る。
// 使い方: node tools/build-words.mjs
// 欠け・重複・形の誤りがあれば、何も書かずに失敗する。
import {readFileSync, writeFileSync, readdirSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {dirname, join} from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const work = join(root, 'data', 'work');
const out = join(root, 'products', 'word-guild', 'data', 'words.json');

const readJson = file => JSON.parse(readFileSync(file, 'utf8'));
const skeleton = [...readJson(join(work, 'basic.json')), ...readJson(join(work, 'tsl.json'))];

const translations = new Map();
for (const file of readdirSync(join(work, 'ja')).filter(f => /^\d\d\.json$/.test(f)).sort()) {
  for (const entry of readJson(join(work, 'ja', file))) {
    if (translations.has(entry.id)) throw new Error(`訳の id が重複: ${entry.id}（${file}）`);
    translations.set(entry.id, entry);
  }
}

const errors = [];
const seenJa = new Map();
const words = skeleton.map(base => {
  const t = translations.get(base.id);
  if (!t) {
    errors.push(`訳がない: ${base.id} ${base.w}`);
    return base;
  }
  if (t.w !== base.w) errors.push(`綴りが骨格と違う: ${base.id} ${base.w} / ${t.w}`);
  for (const key of ['ja', 'pos', 'ex', 'exJa']) {
    if (typeof t[key] !== 'string' || t[key].trim() === '') errors.push(`${key} がない: ${base.id}`);
  }
  if (!['n', 'v', 'a', 'o'].includes(t.pos)) errors.push(`pos が不正: ${base.id} ${t.pos}`);
  if (seenJa.has(t.ja)) errors.push(`ja が重複: ${t.ja}（${seenJa.get(t.ja)} と ${base.id}）`);
  seenJa.set(t.ja, base.id);
  return {id: base.id, w: base.w, ja: t.ja, pos: t.pos, ch: base.ch, shelf: base.shelf,
    rank: base.rank, ex: t.ex, exJa: t.exJa};
});
for (const id of translations.keys()) {
  if (!skeleton.some(base => base.id === id)) errors.push(`骨格にない訳: ${id}`);
}

if (errors.length) {
  console.error(errors.slice(0, 50).join('\n'));
  console.error(`${errors.length} 件の問題があるため、words.json は書きませんでした。`);
  process.exit(1);
}

// 1語1行で書き、差分を読みやすくする。
writeFileSync(out, '[\n' + words.map(w => ' ' + JSON.stringify(w)).join(',\n') + '\n]\n');
console.log(`words.json: ${words.length}語`);
