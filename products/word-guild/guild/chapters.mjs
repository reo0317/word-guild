// 章の進み具合。DOM は使わない。
// 章 n の全棚が灯ると、章 n+1 が開く。章 1 は最初から開いている。
import {shelfStatus} from './srs.mjs';

export const CHAPTER_NAMES = ['坂の上の朝市', '石だたみ商店街', '波止場の倉庫街', '時計塔の役場', '駅前ホテル通り', '灯台岬'];

// 章ごとの {ch, name, shelves, litShelves, isOpen, isCleared}。章番号の順。
export function chapterStatus(words, progress) {
  const numbers = [...new Set(words.map(word => word.ch))].sort((a, b) => a - b);
  const chapters = [];
  let previousCleared = true;
  for (const ch of numbers) {
    const shelves = shelfStatus(words.filter(word => word.ch === ch), progress);
    const litShelves = shelves.filter(shelf => shelf.isLit).length;
    const isCleared = litShelves === shelves.length;
    chapters.push({ch, name: CHAPTER_NAMES[ch - 1] ?? `${ch}区`, shelves, litShelves, isOpen: previousCleared, isCleared});
    previousCleared = previousCleared && isCleared;
  }
  return chapters;
}

// 開いている最新の章（区）。配達の背景と敵の色はこの区のもの。
export function currentChapter(chapters) {
  return chapters.filter(chapter => chapter.isOpen).at(-1) ?? chapters[0];
}
