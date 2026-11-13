import {readFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import {resolve} from 'node:path';
import {parseLine, inflects, regularForms} from '../products/word-guild/guild/story.mjs';

const tokens = text => text.match(/[\p{L}\p{N}]+(?:['-][\p{L}\p{N}]+)*/gu) ?? [];
const kinds = new Set(['letter','memo','sign','notice','news','ledger','form','diary','mail']);
export function checkStory(story, words, allow, {partial = false} = {}) {
  const issues = [], reports = [];
  const add = (where, message) => issues.push(`${where}: ${message}`);
  const letters = story?.letters;
  if (!Array.isArray(letters)) return {issues: ['letters: 配列が必要'], reports};
  if (story.v !== 1) add('story', 'v は1');
  if (!partial && letters.length !== 56) add('story', `通数 ${letters.length}/56`);
  const basic = allow.words ?? [];
  if (basic.length > 600 || new Set(basic).size !== basic.length || basic.some(w => w !== w.toLowerCase())) add('allow', '基本語は小文字・重複なし・600語以内');
  const vocabulary = new Map();
  for (const w of words) for (const form of regularForms(w.w)) vocabulary.set(form, Math.min(vocabulary.get(form) ?? Infinity, w.ch));
  const accepted = new Set(basic.flatMap(w => [...regularForms(w)]));
  for (const name of allow.names ?? []) for (const token of tokens(name)) accepted.add(token.toLowerCase());
  const byId = new Map(words.map(w => [w.id, w]));
  const seen = new Map(), shelves = new Set();
  for (const [li, letter] of letters.entries()) {
    const label = `通${letter.shelf ?? li + 1}`;
    if (shelves.has(letter.shelf)) add(label, 'shelf 重複');
    shelves.add(letter.shelf);
    if (!partial && letter.shelf !== li + 1) add(label, 'shelf は1〜56の順');
    const assigned = words.filter(w => w.shelf === letter.shelf);
    if (!assigned.length || letter.ch !== assigned[0]?.ch) add(label, 'shelf/ch が語の割り当てと不一致');
    if (!kinds.has(letter.kind)) add(label, 'kind が不正');
    for (const field of ['from','to']) if (typeof letter[field] !== 'string' || !letter[field].trim()) add(label, `${field} が空`);
    if (!Array.isArray(letter.lines)) { add(label, 'lines は配列'); continue; }
    if (letter.lines.length !== 5) add(label, `行数 ${letter.lines.length}/5`);
    let total = 0, future = 0;
    letter.lines.forEach((line, index) => {
      const where = `${label} 行${index + 1}`;
      const ids = Array.isArray(line.ids) ? line.ids : [];
      const expected = assigned.slice(index * 5, index * 5 + 5).map(w => w.id);
      if (ids.length !== 5 || new Set(ids).size !== 5 || [...ids].sort().join() !== [...expected].sort().join()) add(where, 'ids が担当の5語と不一致');
      for (const id of ids) seen.set(id, (seen.get(id) ?? 0) + 1);
      if (typeof line.ja !== 'string' || !line.ja.trim()) add(where, 'ja が空');
      let parts;
      try { parts = parseLine(line.en); } catch (e) { add(where, e.message); return; }
      const targets = parts.filter(p => p.type === 'word');
      if (targets.length !== 5) add(where, `対象語の括弧 ${targets.length}/5`);
      targets.forEach((p, i) => {
        if (!inflects(byId.get(ids[i])?.w, p.text)) add(where, `対象語 ${ids[i]} {${p.text}} は見出し語・規則変化ではない（不規則変化等）`);
      });
      const text = parts.map(p => p.text).join('');
      if (/[^\x00-\x7f\p{L}\p{N}\s]/u.test(text)) add(where, 'ASCII 以外の句読点');
      // 複合語も対象語の括弧内は1語として数える。
      const count = parts.reduce((n, p) => n + (p.type === 'word' ? 1 : tokens(p.text).length), 0);
      total += count;
      const min = letter.ch === 1 ? 10 : 12, max = letter.ch === 1 ? 20 : 24;
      if (count < min || count > max) add(where, `語数 ${count}（${min}〜${max}）`);
      const sentenceMax = letter.ch === 1 ? 14 : letter.ch <= 3 ? 18 : 22;
      const withoutTitles = text.replace(/\b(?:Mr|Ms|Co)\./gu, m => m.slice(0, -1));
      const sentences = withoutTitles.split(/[.!?]+/u).filter(s => tokens(s).length);
      if (sentences.length < 1 || sentences.length > 2) add(where, `文数 ${sentences.length}（1〜2）`);
      for (const sentence of sentences) {
        if (tokens(sentence).length > sentenceMax) add(where, `1文 ${tokens(sentence).length}語（上限${sentenceMax}）`);
      }
      for (const p of parts.filter(p => p.type === 'text')) for (const token of tokens(p.text)) {
        const key = token.toLowerCase();
        if (!accepted.has(key) && !vocabulary.has(key)) add(where, `地の文の未許可語 ${token}`);
        if (!accepted.has(key) && (vocabulary.get(key) ?? 0) > letter.ch) future++;
        // 対象語を括弧の外で繰り返すことも禁止。
        if (ids.some(id => inflects(byId.get(id)?.w, token))) add(where, `対象語の重複（括弧外） ${token}`);
      }
    });
    if (total < 60 || total > 110) add(label, `通の語数 ${total}（60〜110）`);
    if (future > 3) add(label, `後の区の語 ${future}語（上限3）`);
    reports.push(`${label}: ${total}語、後の区の語 ${future}`);
  }
  for (const [id, count] of seen) if (!byId.has(id) || count !== 1) add('story', `${id}: 出現${count}回`);
  if (!partial) for (const w of words) if (!seen.has(w.id)) add('story', `${w.id}: 未出現`);
  const blank = story.blank;
  if (!partial || blank !== undefined) {
    if (!Array.isArray(blank) || blank.length !== 6) add('blank', '6行が必要');
    for (const [i, line] of (Array.isArray(blank) ? blank : []).entries()) {
      if (line.ch !== i + 1 || typeof line.en !== 'string' || !line.en.trim() || /[{}]/u.test(line.en) || /[^\x00-\x7f\p{L}\p{N}\s]/u.test(line.en) || typeof line.ja !== 'string' || !line.ja.trim()) add(`blank ${i + 1}`, 'ch/en/ja が不正');
    }
  }
  return {issues, reports};
}


// 追伸は全区の通常語・まれびと・許可語を使える。対象語の id は括弧順。
export function checkPostscript(ps, rare, words, allow) {
  const issues = [], reports = [];
  if (!Array.isArray(ps)) return {issues: ['追伸: 配列が必要'], reports};
  if (ps.length !== 56) issues.push(`追伸: ${ps.length}/56行`);
  const accepted = new Set([...words, ...rare].flatMap(w => [...regularForms(w.w)]));
  for (const w of allow.words ?? []) for (const f of regularForms(w)) accepted.add(f);
  for (const name of allow.names ?? []) for (const t of tokens(name)) accepted.add(t.toLowerCase());
  for (const [i, line] of ps.entries()) {
    const add = msg => issues.push(`追伸${line.shelf}: ${msg}`);
    if (line.shelf !== i + 1) add('shelf は1〜56の順');
    const assigned = rare.filter(w => w.shelf === line.shelf);
    const ch = assigned[0]?.ch;
    if (typeof line.ja !== 'string' || !line.ja.trim()) add('ja が空');
    let parts;
    try { parts = parseLine(line.en); } catch(e) { add(e.message); continue; }
    const targets = parts.filter(p => p.type === 'word');
    const ids = line.ids ?? [];
    if (targets.length !== 5 || ids.length !== 5 || new Set(ids).size !== 5 || [...ids].sort().join() !== assigned.map(w => w.id).sort().join()) add('ids/括弧が担当の5語と不一致');
    targets.forEach((p,j) => {if (!inflects(assigned.find(w => w.id === ids[j])?.w, p.text)) add(`対象語 ${ids[j]} {${p.text}} が不一致`);});
    const text = parts.map(p => p.text).join('');
    if (/[^\x00-\x7f\p{L}\p{N}\s]/u.test(text)) add('ASCII 以外の句読点');
    const count = parts.reduce((n,p) => n + (p.type === 'word' ? 1 : tokens(p.text).length), 0);
    const min = ch === 1 ? 10 : 12, max = ch === 1 ? 20 : 24;
    if (count < min || count > max) add(`語数 ${count}（${min}〜${max}）`);
    const sentences = text.replace(/\b(?:Mr|Ms|Co)\./gu, m => m.slice(0,-1)).split(/[.!?]+/u).filter(s => tokens(s).length);
    if (sentences.length < 1 || sentences.length > 2) add('文数は1〜2');
    const sentenceMax = ch === 1 ? 14 : ch <= 3 ? 18 : 22;
    for (const sentence of sentences) if (tokens(sentence).length > sentenceMax) add(`1文の語数が${sentenceMax}を超える`);
    for (const p of parts.filter(p => p.type === 'text')) for (const token of tokens(p.text)) {
      if (!accepted.has(token.toLowerCase())) add(`地の文の未許可語 ${token}`);
      if (assigned.some(w => inflects(w.w, token))) add(`対象語の重複（括弧外） ${token}`);
    }
    reports.push(`追伸${line.shelf}: ${count}語`);
  }
  return {issues, reports};
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    const json = async path => JSON.parse(await readFile(path, 'utf8'));
    const story = await json(resolve(process.argv[2] ?? 'products/word-guild/data/story.json'));
    const words = await json(new URL('../products/word-guild/data/words.json', import.meta.url));
    const allow = await json(new URL('../products/word-guild/data/story-allow.json', import.meta.url));
    const partial = process.argv.includes('--partial');
    const result = checkStory(story, words, allow, {partial});
    if (!partial) {
      const ps = await json(new URL('../products/word-guild/data/story-ps.json', import.meta.url));
      const rare = await json(new URL('../products/word-guild/data/rare.json', import.meta.url));
      const post = checkPostscript(ps, rare, words, allow);
      result.issues.push(...post.issues);
      result.reports.push(...post.reports);
    }
    console.log([...result.reports, ...result.issues, `${result.issues.length}件の問題${partial ? '（部分検査）' : ''}。意味・品詞・自然さ・関係節数は要読解確認。`].join('\n'));
    process.exitCode = result.issues.length ? 1 : 0;
  } catch (e) { console.error(e.message); process.exitCode = 1; }
}
