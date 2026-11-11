// 習熟度（箱 0〜5）と出題選び。DOM は使わない。
// 語の状態：{box, due, seen}。未出題の語は状態なし。
import {shuffle} from './rng.mjs';
import {spelling} from './board.mjs';

export const INTERVALS = [0, 0, 1, 3, 7, 21]; // 箱ごとの、次に出るまでの日数
export const MAX_BOX = 5;
export const SESSION_SIZE = 12;
export const NEW_PER_SESSION = 4;
export const GROUP_SIZE = 3;
export const GROUP_LETTERS = 30;
export const SOLO_LETTERS = 13; // この文字数以上の語は1語だけの盤面
export const HEAVY_DUE = 20; // 期限の語がこれ以上たまったら新出を0にする
export const LIT_BOX = 3; // 棚が灯る習熟度

// 盤面用の綴りが SOLO_LETTERS 以上の語。1クエストに1語まで。
export const isBig = word => spelling(word.w).length >= SOLO_LETTERS;

// 端末の現地時間での日番号。
export function todayNumber(now = Date.now(), offsetMinutes = new Date().getTimezoneOffset()) {
  return Math.floor((now - offsetMinutes * 60000) / 86400000);
}

// result: 'clean' | 'hint' | 'taught'
export function grade(state, result, today) {
  const seen = (state?.seen ?? 0) + 1;
  const isNew = !state || state.seen === 0;
  if (result === 'clean' && state && state.due > today) return {...state, seen}; // 期限前の正解は習熟度を動かさない
  if (result === 'taught') return {box: 1, due: today, seen};
  if (result === 'hint') return {box: Math.max(1, state?.box ?? 0), due: today, seen};
  if (result !== 'clean') throw new Error(`未知の結果: ${result}`);
  const box = isNew ? LIT_BOX : Math.min(MAX_BOX, state.box + 1);
  return {box, due: today + INTERVALS[box], seen};
}

export function isDue(state, today) {
  return Boolean(state) && state.due <= today;
}

export function dueCount(words, progress, today) {
  return words.filter(word => isDue(progress.words[word.id], today)).length;
}

const byShelfThenId = (a, b) => a.shelf - b.shelf || a.id.localeCompare(b.id);

// 3語ずつに分ける。1組の合計は 30 文字以下。13文字以上の語は1語だけの組。
// 組の数を先に決めて長い語から配り、最後に文字数の少ない組を先頭にする。
export function groupWords(words, rand = null) {
  const ordered = rand ? shuffle(words, rand) : [...words];
  ordered.sort((a, b) => spelling(b.w).length - spelling(a.w).length);
  const solo = ordered.filter(word => spelling(word.w).length >= SOLO_LETTERS);
  const rest = ordered.filter(word => spelling(word.w).length < SOLO_LETTERS);
  const groups = Array.from({length: Math.ceil(rest.length / GROUP_SIZE)}, () => ({words: [], letters: 0}));
  for (const word of rest) {
    const length = spelling(word.w).length;
    let target = groups
      .filter(g => g.words.length < GROUP_SIZE && g.letters + length <= GROUP_LETTERS)
      .sort((a, b) => a.letters - b.letters)[0];
    if (!target) {
      target = {words: [], letters: 0};
      groups.push(target);
    }
    target.words.push(word);
    target.letters += length;
  }
  const all = [...groups.filter(g => g.words.length), ...solo.map(word => ({words: [word], letters: spelling(word.w).length}))];
  const small = all.filter(g => !isBig(g.words[0]) || g.words.length > 1);
  const big = all.filter(g => !small.includes(g));
  const byLetters = (a, b) => a.letters - b.letters;
  return [...small.sort(byLetters), ...big.sort(byLetters)].map(g => g.words);
}

// progress.words は {id: {box, due, seen}}。戻り値は 3語ずつの組の配列。
export function pickSession(words, progress, today, size = SESSION_SIZE, rand = null, fresh = NEW_PER_SESSION) {
  const state = word => progress.words[word.id];
  const maxDue = Math.max(0, size - fresh);
  const dueAll = words
    .filter(word => isDue(state(word), today))
    .sort((a, b) => state(a).due - state(b).due || byShelfThenId(a, b));
  const heavy = dueAll.length >= HEAVY_DUE; // たまりすぎたら復習だけ
  const picked = [];
  const taken = new Set();
  const spells = new Set(); // 盤面の綴りが同じ語は1クエストに1つだけ
  let bigTaken = false; // 大物は1クエストに1語まで
  const add = word => {
    if (picked.length >= size || taken.has(word)) return false;
    const text = spelling(word.w);
    if (spells.has(text)) return false;
    if (isBig(word)) {
      if (bigTaken) return false;
      bigTaken = true;
    }
    taken.add(word);
    spells.add(text);
    picked.push(word);
    return true;
  };
  let dueTaken = 0;
  for (const word of dueAll) {
    if (dueTaken >= (heavy ? size : maxDue)) break;
    if (add(word)) dueTaken++;
  }
  const unseen = words.filter(word => !state(word)).sort(byShelfThenId);
  if (!heavy) unseen.forEach(add);
  if (picked.length < size) {
    const rest = words
      .filter(word => state(word) && !taken.has(word))
      .sort((a, b) => state(a).box - state(b).box || byShelfThenId(a, b));
    rest.forEach(add);
  }
  return groupWords(picked, rand);
}

// 棚ごとの進み具合。全語が箱3以上で灯り、全語が箱5で金色。
export function shelfStatus(words, progress) {
  const shelves = new Map();
  for (const word of words) {
    const entry = shelves.get(word.shelf) ?? {shelf: word.shelf, total: 0, lit: 0, gold: 0};
    const box = progress.words[word.id]?.box ?? 0;
    entry.total++;
    if (box >= LIT_BOX) entry.lit++;
    if (box >= MAX_BOX) entry.gold++;
    shelves.set(word.shelf, entry);
  }
  return [...shelves.values()]
    .sort((a, b) => a.shelf - b.shelf)
    .map(s => ({...s, isLit: s.lit === s.total, isGold: s.gold === s.total}));
}
