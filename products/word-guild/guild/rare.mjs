// 夜の訪問客。通常の語の進み・門・速達は扱わない。入力を変更しない。
import {isDue, isRestored, MAX_BOX} from './srs.mjs';
import {streakNow} from './daily.mjs';

const stateOf = (progress, word) => progress.rares?.[word.id];
const unseen = state => !state || state.seen === 0;
const rotate = (items, offset) => items.length
  ? [...items.slice(offset % items.length), ...items.slice(0, offset % items.length)] : [];

export function pickRare(rares, progress, shelf, today) {
  const residents = rares.filter(word => word.shelf === shelf);
  const due = residents.filter(word => !unseen(stateOf(progress, word)) && isDue(stateOf(progress, word), today))
    .sort((a, b) => stateOf(progress, a).due - stateOf(progress, b).due || a.id.localeCompare(b.id));
  return due[0] ?? residents.filter(word => unseen(stateOf(progress, word)))
    .sort((a, b) => a.id.localeCompare(b.id))[0] ?? null;
}

export function visitors(map, rares, progress, today) {
  const streak = streakNow(progress.streak, today);
  const count = streak >= 7 ? 3 : streak >= 3 ? 2 : 1;
  const eligible = (map?.wards ?? []).flatMap(ward => ward.lamps)
    .filter(lamp => (lamp.done ?? (lamp.total > 0 && lamp.got === lamp.total))
      && pickRare(rares, progress, lamp.shelf, today))
    .map(lamp => lamp.shelf).sort((a, b) => a - b);
  const due = eligible.filter(shelf => rares.some(word => word.shelf === shelf
    && !unseen(stateOf(progress, word)) && isDue(stateOf(progress, word), today)));
  const fresh = eligible.filter(shelf => !due.includes(shelf));
  return [...rotate(due, today * count), ...rotate(fresh, today * count)].slice(0, count);
}

// 空振りにも rare を返し、呼び出し側が保存する。夜の盤面を開ける時だけ呼ぶ。
export function rollRare(progress, shelf, today, rand = Math.random, rares = [], map = {wards: []}) {
  const previous = progress.rare ?? {miss: 0, day: 0, met: []};
  const rare = {miss: Math.min(3, Math.max(0, previous.miss || 0)), day: today,
    met: previous.day === today ? [...previous.met] : []};
  const word = pickRare(rares, progress, shelf, today);
  if (!word) return {word: null, sure: false, rare};
  const sure = visitors(map, rares, progress, today).includes(shelf) && !rare.met.includes(shelf);
  if (sure || rare.miss === 3 || rand() < (1 + rare.miss) / 4) {
    rare.miss = 0;
    if (sure) rare.met.push(shelf);
    return {word, sure, rare};
  }
  rare.miss++;
  return {word: null, sure: false, rare};
}

export function rareStatus(rares, progress) {
  const shelves = {}, wards = {};
  let met = 0, gold = 0;
  for (const word of rares) {
    const shelf = shelves[word.shelf] ??= {met: 0, gold: 0, total: 0, complete: false};
    const ward = wards[word.ch] ??= {met: 0, gold: 0, total: 0, complete: false};
    const state = stateOf(progress, word);
    const seen = !unseen(state) && isRestored(state), golden = seen && state.box >= MAX_BOX;
    for (const entry of [shelf, ward]) {
      entry.total++;
      entry.met += Number(seen);
      entry.gold += Number(golden);
      entry.complete = entry.met === entry.total;
    }
    met += Number(seen);
    gold += Number(golden);
  }
  return {shelves, wards, total: rares.length, met, gold, complete: rares.length > 0 && met === rares.length};
}
