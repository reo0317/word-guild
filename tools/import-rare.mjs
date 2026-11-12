// NGSL 1.2 のうち、現在の1,400語と盤面の綴りが重ならない候補を取り込む。
// 使い方: node tools/import-rare.mjs（作業ディレクトリーによらず実行できる）
// 出力: data/work/rare-candidates.json — 順位順の {w, rank}。
import {readFileSync, writeFileSync, mkdirSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {spelling} from '../products/word-guild/guild/board.mjs';

const root = new URL('../', import.meta.url);
const words = JSON.parse(readFileSync(new URL('products/word-guild/data/words.json', root), 'utf8'));
const used = new Set(words.map(word => spelling(word.w)));
// 原本は latin1。TRUE・FALSE もほかの見出し語と同じ小文字にそろえる。
const entries = readFileSync(new URL('data/source/NGSL_12_stats.csv', root), 'latin1')
  .split(/\r?\n/).slice(1).filter(line => line.trim())
  .map(line => {
    const [lemma, rank] = line.split(',');
    const entry = {w: lemma.trim().toLowerCase(), rank: Number(rank)};
    if (!Number.isInteger(entry.rank) || entry.rank < 1) throw new Error(`NGSL の順位が不正: ${line}`);
    return entry;
  });
const candidates = entries
  .filter(({w}) => /^[a-z]{4,12}$/.test(w) && !used.has(spelling(w)))
  .sort((a, b) => a.rank - b.rank || a.w.localeCompare(b.w));
if (new Set(candidates.map(({w}) => spelling(w))).size !== candidates.length) {
  throw new Error('候補の盤面の綴りに重複がある');
}
const work = new URL('data/work/', root);
mkdirSync(work, {recursive: true});
writeFileSync(new URL('rare-candidates.json', work), JSON.stringify(candidates, null, 1) + '\n');
const counts = [
  candidates.filter(({rank}) => rank <= 300).length,
  candidates.filter(({rank}) => rank >= 301 && rank <= 1000).length,
  candidates.filter(({rank}) => rank >= 1001).length,
];
console.log(`${fileURLToPath(new URL('rare-candidates.json', work))}: ${candidates.length}語` +
  `（1〜300位: ${counts[0]}、301〜1,000位: ${counts[1]}、1,001位以下: ${counts[2]}）、1,400語との重なり0`);
