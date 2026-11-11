// 語彙の原本（data/source/*_stats.csv）から、作業用の骨格を作る。
// 使い方: node tools/import-words.mjs
// 出力:
//   data/work/tsl.json              TSL 1,250語 {id,w,rank,ch,shelf}
//   data/work/basic-candidates.txt  基本語の候補（NGSL 順位順の上位400語、「順位 語」）
//   data/work/basic.json            基本語150語（data/work/basic150.txt があるときだけ）
// 外部ライブラリーは使わない。同じ入力からは常に同じ出力になる。
import {readFileSync, writeFileSync, mkdirSync, existsSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {dirname, join} from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const source = join(root, 'data', 'source');
const work = join(root, 'data', 'work');

const SHELF_SIZE = 25;
const CHAPTER_SIZE = 250;
const BASIC_SHELVES = 6;
const CANDIDATES = 400;
const BASIC_COUNT = 150;

// 1行目は見出し。列は「語, 順位, SFI, U」。résumé などのため latin1 で読む。
function readStats(file) {
  const lines = readFileSync(join(source, file), 'latin1').split(/\r?\n/).slice(1);
  return lines
    .filter(line => line.trim() !== '')
    .map(line => {
      const [word, rank] = line.split(',');
      return {w: word.trim(), rank: Number(rank)};
    });
}

function pad(n) {
  return String(n).padStart(4, '0');
}

function writeJson(file, value) {
  writeFileSync(join(work, file), JSON.stringify(value, null, 1) + '\n');
}

mkdirSync(work, {recursive: true});

// TSL：順位そのままを id にする。章2〜6に250語ずつ、棚は基本語の6棚の続きから25語ずつ。
const tsl = readStats('TSL_12_stats.csv').sort((a, b) => a.rank - b.rank);
const tslWords = tsl.map((entry, i) => ({
  id: 't' + pad(entry.rank),
  w: entry.w,
  rank: entry.rank,
  ch: 2 + Math.floor(i / CHAPTER_SIZE),
  shelf: BASIC_SHELVES + 1 + Math.floor(i / SHELF_SIZE)
}));
if (tslWords.length !== 1250) throw new Error(`TSL は1,250語のはずが ${tslWords.length} 語`);
writeJson('tsl.json', tslWords);

// 基本語の候補：NGSL 順位順に、3〜6文字の英小文字だけの語で TSL にないもの。
const tslSet = new Set(tsl.map(entry => entry.w.toLowerCase()));
const ngsl = readStats('NGSL_12_stats.csv').sort((a, b) => a.rank - b.rank);
const candidates = ngsl
  .filter(entry => /^[a-z]{3,6}$/.test(entry.w) && !tslSet.has(entry.w))
  .slice(0, CANDIDATES);
writeFileSync(
  join(work, 'basic-candidates.txt'),
  candidates.map(entry => `${entry.rank} ${entry.w}`).join('\n') + '\n'
);

// 選ばれた150語（D2 の出力）があれば、基本語の骨格を作る。
const chosenFile = join(work, 'basic150.txt');
if (existsSync(chosenFile)) {
  const rankOf = new Map(ngsl.map(entry => [entry.w, entry.rank]));
  const chosen = readFileSync(chosenFile, 'utf8').split(/\r?\n/).map(s => s.trim()).filter(Boolean);
  if (chosen.length !== BASIC_COUNT) throw new Error(`basic150.txt は150行のはずが ${chosen.length} 行`);
  if (new Set(chosen).size !== chosen.length) throw new Error('basic150.txt に重複がある');
  for (const w of chosen) if (!rankOf.has(w)) throw new Error(`NGSL にない語: ${w}`);
  const basic = chosen
    .sort((a, b) => rankOf.get(a) - rankOf.get(b))
    .map((w, i) => ({
      id: 'b' + pad(i + 1),
      w,
      rank: rankOf.get(w),
      ch: 1,
      shelf: 1 + Math.floor(i / SHELF_SIZE)
    }));
  writeJson('basic.json', basic);
}

console.log(`tsl.json: ${tslWords.length}語、basic-candidates.txt: ${candidates.length}語` +
  (existsSync(chosenFile) ? '、basic.json: 150語' : ''));
