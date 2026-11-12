// 区ごとの英文（lab/story/ward-N.json）を、ゲームが読む products/word-guild/data/story.json にまとめる。
// 使い方: node tools/story-merge.mjs 1 2 3   （まとめる区の番号。レビューと修正が済んだ区だけを渡す）
import {readFileSync, writeFileSync, existsSync} from 'node:fs';
const wards = process.argv.slice(2).map(Number).filter(n => n >= 1 && n <= 6);
if (!wards.length) throw new Error('区の番号を渡してください（例: 1 2）');
const letters = wards.flatMap(n => JSON.parse(readFileSync(`lab/story/ward-${n}.json`, 'utf8')).letters);
letters.sort((a, b) => a.shelf - b.shelf);
// 白紙卿のカード（区の門で1行ずつ戻る6行）。lab/story/blank.json があり、全6区をまとめるときだけ入れる。
const story = {v: 1, letters};
if (wards.length === 6 && existsSync('lab/story/blank.json')) story.blank = JSON.parse(readFileSync('lab/story/blank.json', 'utf8'));
writeFileSync('products/word-guild/data/story.json', JSON.stringify(story, null, 1) + '\n');
console.log(`story.json: ${wards.join('・')}区、${letters.length}通`);
