// 7列×6行の盤面生成と、なぞり結果の判定。DOM は使わない。
import {shuffle} from './rng.mjs';

export const COLS = 7;
export const ROWS = 6;
export const CELLS = COLS * ROWS;
const MAX_ATTEMPTS = 200;
const SEARCH_BUDGET = 4000; // 1語の経路探索で試す最大の歩数

// 英語の文字頻度（ざっくりした重み）。母音と t, n, s, r などが多く出る。
const LETTER_WEIGHTS = {
  E: 12, T: 9, A: 8, O: 8, I: 7, N: 7, S: 6, H: 6, R: 6, D: 4, L: 4, C: 3, U: 3,
  M: 3, W: 2, F: 2, G: 2, Y: 2, P: 2, B: 1.5, V: 1, K: 1, J: .3, X: .3, Q: .2, Z: .2,
};
const LETTER_BAG = Object.entries(LETTER_WEIGHTS).flatMap(([letter, weight]) =>
  Array(Math.round(weight * 5)).fill(letter));

// 盤面に置く綴り。英字以外（ハイフン・空白）を除いた小文字。
export function spelling(word) {
  return String(word).replace(/[^a-zA-Z]/g, '').toLowerCase();
}

export function neighbors(index) {
  const row = Math.floor(index / COLS);
  const col = index % COLS;
  const result = [];
  if (row > 0) result.push(index - COLS);
  if (row < ROWS - 1) result.push(index + COLS);
  if (col > 0) result.push(index - 1);
  if (col < COLS - 1) result.push(index + 1);
  return result;
}

// 空きマスだけを通る一筆書きを、行き止まりなら後戻りして探す。見つからなければ null。
function findPath(length, occupied, rand) {
  const free = [];
  for (let i = 0; i < CELLS; i++) if (!occupied[i]) free.push(i);
  let budget = SEARCH_BUDGET;
  const path = [];
  const used = new Set();

  function extend() {
    if (path.length === length) return true;
    if (budget-- <= 0) return false;
    const candidates = shuffle(neighbors(path.at(-1)), rand);
    for (const next of candidates) {
      if (occupied[next] || used.has(next)) continue;
      path.push(next);
      used.add(next);
      if (extend()) return true;
      path.pop();
      used.delete(next);
    }
    return false;
  }

  for (const start of shuffle(free, rand)) {
    path.length = 0;
    used.clear();
    path.push(start);
    used.add(start);
    budget = SEARCH_BUDGET;
    if (extend()) return [...path];
  }
  return null;
}

function tryPlace(sortedWords, rand) {
  const occupied = Array(CELLS).fill(false);
  const letters = Array(CELLS).fill('');
  const paths = {};
  for (const word of sortedWords) {
    const path = findPath(word.length, occupied, rand);
    if (!path) return null;
    path.forEach((cell, i) => {
      occupied[cell] = true;
      letters[cell] = word[i].toUpperCase();
    });
    paths[word] = path;
  }
  return {letters, paths};
}

// words は盤面用の綴り（小文字の英字）。戻り値の paths は綴りをキーにした経路。
export function generateBoard(words, rand) {
  const sorted = [...words].sort((a, b) => b.length - a.length);
  if (sorted.reduce((sum, word) => sum + word.length, 0) > CELLS) {
    throw new Error('語が盤面に入りません');
  }
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const placed = tryPlace(sorted, rand);
    if (!placed) continue;
    const letters = placed.letters.map(letter =>
      letter || LETTER_BAG[Math.floor(rand() * LETTER_BAG.length)]);
    return {letters, paths: placed.paths};
  }
  throw new Error('盤面に語を置けませんでした');
}

// なぞった文字列が未回答の語のどれかと一致すれば、その語を返す。経路は問わない。
export function matchWord(text, remaining) {
  const typed = String(text).toLowerCase();
  if (!typed) return null;
  return remaining.find(word => word.toLowerCase() === typed) ?? null;
}
