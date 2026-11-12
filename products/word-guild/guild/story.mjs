// DOM・保存への書き込みを持たない物語の読み取り。
import {isDue, LIT_BOX} from './srs.mjs';

// text は地の文、word は対象語。空の地の文は返さない。不正な括弧は拒否する。
export function parseLine(en) {
  if (typeof en !== 'string') throw new TypeError('en must be a string');
  const parts = [];
  let start = 0;
  for (const match of en.matchAll(/\{([^{}]+)\}/gu)) {
    if (match.index > start) parts.push({type: 'text', text: en.slice(start, match.index)});
    parts.push({type: 'word', text: match[1]});
    start = match.index + match[0].length;
  }
  if (start < en.length) parts.push({type: 'text', text: en.slice(start)});
  if (parts.some(p => /[{}]/u.test(p.text))) throw new Error('Unbalanced story braces');
  return parts;
}

// 綴りの規則だけを判定する。品詞・意味の適否は読んで確認する。
export function regularForms(w) {
  w = w.toLowerCase();
  const forms = new Set([w]);
  if (!/^[a-z]+$/u.test(w)) return forms;
  const y = /[^aeiou]y$/u.test(w);
  forms.add(y ? w.slice(0, -1) + 'ies' : /(?:s|x|z|ch|sh|o)$/u.test(w) ? w + 'es' : w + 's');
  const stem = y ? w.slice(0, -1) + 'i' : /e$/u.test(w) ? w.slice(0, -1) : w;
  for (const suffix of ['ed', 'er', 'est']) forms.add(stem + suffix);
  forms.add((/ie$/u.test(w) ? w.slice(0, -2) + 'y' : /[^e]e$/u.test(w) ? w.slice(0, -1) : w) + 'ing');
  // stress の情報を持たないので、短母音+CVC と末尾の強勢を持ち得る複音節を候補にする。
  if (/[aeiou][^aeiouwxy]$/u.test(w) && !/[aeiou]{2}[^aeiou]$/u.test(w)) {
    for (const suffix of ['ed', 'ing', 'er', 'est']) forms.add(w + w.at(-1) + suffix);
  }
  return forms;
}
export function inflects(w, form) {
  return typeof w === 'string' && typeof form === 'string' && regularForms(w).has(form.toLowerCase());
}

// Map<id, {letter, line, shelf, lineIndex, wordIndex}>。index は0始まり。
export function wordToLine(story) {
  const index = new Map();
  for (const letter of story.letters ?? []) letter.lines.forEach((line, lineIndex) => {
    line.ids.forEach((id, wordIndex) => index.set(id, {letter, line, shelf: letter.shelf, lineIndex, wordIndex}));
  });
  return index;
}

// parts の対象語に id / state / word を付ける。readable は5語すべてに保存状態があること。
export function letterView(story, words, progress, shelf, today) {
  const letter = story.letters?.find(l => l.shelf === shelf);
  if (!letter) return null;
  const byId = new Map(words.map(w => [w.id, w]));
  const lines = letter.lines.map(line => {
    let i = 0;
    const parts = parseLine(line.en).map(part => {
      if (part.type === 'text') return part;
      const id = line.ids[i++];
      const saved = progress.words?.[id];
      const state = !saved ? 'gone' : isDue(saved, today) ? 'worn' : saved.box >= LIT_BOX ? 'ink' : 'thin';
      return {...part, id, word: byId.get(id), state};
    });
    return {...line, parts, readable: parts.filter(p => p.type === 'word').every(p => p.state !== 'gone')};
  });
  return {...letter, lines, readable: lines.every(l => l.readable)};
}

// max は全角文字の幅（ASCII は半角）。対象語を中心に切り、対象語そのものは分断しない。
// {left, word, right}。画面は word だけを色づけできる。無いときは null。
export function clipParts(story, id, max = 17) {
  const found = wordToLine(story).get(id);
  if (!found || !Number.isFinite(max) || max <= 0) return null;
  const parts = parseLine(found.line.en);
  let n = 0;
  const target = parts.findIndex(p => p.type === 'word' && n++ === found.wordIndex);
  const before = Array.from(parts.slice(0, target).map(p => p.text).join(''));
  const after = Array.from(parts.slice(target + 1).map(p => p.text).join(''));
  const word = parts[target].text;
  const width = s => Array.from(s).reduce((sum, c) => sum + (c.codePointAt(0) < 128 ? 0.5 : 1), 0);
  let left = '', right = '';
  while (before.length || after.length) {
    const side = before.length && (!after.length || width(left) <= width(right)) ? 'left' : 'right';
    const c = side === 'left' ? before.at(-1) : after[0];
    if (width(left + word + right + c) > max) break;
    if (side === 'left') left = before.pop() + left;
    else right += after.shift();
  }
  // 切り口が語の途中なら、その語は落として「…」にする。
  const letter = c => /[A-Za-z']/u.test(c ?? '');
  if (before.length) left = '…' + (letter(before.at(-1)) && letter(left[0]) ? left.replace(/^[A-Za-z']+/u, '') : left).trimStart();
  if (after.length) right = (letter(after[0]) && letter(right.at(-1)) ? right.replace(/[A-Za-z']+$/u, '') : right).trimEnd() + '…';
  return {left, word, right};
}

export function clipFor(story, id, max = 17) {
  const clip = clipParts(story, id, max);
  return clip ? (clip.left + clip.word + clip.right).trim() : '';
}

// 場面は任意の追加データ。未配置・HTTP エラー・不正な内容でも配達を続ける。
export async function loadScenes(fetcher = globalThis.fetch, url = new URL('../data/scenes.json', import.meta.url)) {
  try {
    const response = await fetcher(url);
    if (!response.ok) return null;
    const data = await response.json();
    return data?.v === 1 && Array.isArray(data.scenes) ? data : null;
  } catch { return null; }
}
