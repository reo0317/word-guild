// 坂道の地図。DOM・保存先を触らず、words.json の順で石段を組む。
import {CHAPTER_NAMES} from './chapters.mjs';
import {HEAVY_DUE, LIT_BOX, MAX_BOX, isDue} from './srs.mjs';

// step は街灯内の1始まり。lit / gold は該当語数（total と同数で点灯）。
// tomorrow は明日期限になる全ID（期限切れは含めない）。fog は真偽値。
export function buildMap(words, progress, today) {
  const wards = [];
  const positions = [];
  const state = word => progress.words[word.id];
  for (const word of words) {
    let ward = wards.find(w => w.ch === word.ch);
    if (!ward) {
      ward = {ch: word.ch, name: CHAPTER_NAMES[word.ch - 1] ?? `${word.ch}区`, gate: 'hidden', lamps: []};
      wards.push(ward);
    }
    let lamp = ward.lamps.find(l => l.shelf === word.shelf);
    if (!lamp) {
      lamp = {shelf: word.shelf, total: 0, got: 0, lit: 0, gold: 0, steps: []};
      ward.lamps.push(lamp);
    }
    if (lamp.total % 5 === 0) {
      const step = {ids: [], passed: true};
      lamp.steps.push(step);
      positions.push({ch: ward.ch, shelf: lamp.shelf, step: lamp.steps.length, entry: step});
    }
    const step = lamp.steps.at(-1);
    step.ids.push(word.id);
    step.passed &&= Boolean(state(word));
    lamp.total++;
    if (state(word)) lamp.got++;
    if (state(word)?.box >= LIT_BOX) lamp.lit++;
    if (state(word)?.box >= MAX_BOX) lamp.gold++;
  }
  for (const ward of wards) {
    ward.gate = progress.gates?.includes(ward.ch) ? 'cleared'
      : ward.lamps.every(l => l.steps.every(s => s.passed)) ? 'open' : 'hidden';
  }
  const position = positions.find(p => !p.entry.passed) ?? positions.at(-1);
  const here = position ? {ch: position.ch, shelf: position.shelf, step: position.step} : null;
  const current = positions.indexOf(position);
  const next = positions.slice(current, current + 2).flatMap(p => p.entry.ids)
    .filter(id => !progress.words[id]).slice(0, 3);
  const dueWords = words.filter(w => isDue(state(w), today))
    .sort((a, b) => state(a).due - state(b).due || a.shelf - b.shelf || a.id.localeCompare(b.id));
  const result = {wards, here, next, due: dueWords.slice(0, 3).map(w => w.id), dueCount: dueWords.length,
    fog: dueWords.length >= HEAVY_DUE,
    tomorrow: words.filter(w => state(w)?.due === today + 1).map(w => w.id)};
  return result;
}

// 同じ盤面に並ぶ紙魚の見分け。種族・区・インクがすべて同じ組ができたら、あとの方のインクを
// まだ使っていないものへ替える（インクは区ごとに3色なので、1盤面の3体までは必ず分けられる）。
// specs は盤面の順の紙魚の設計値、wards は同じ順の区の番号。入力は変えず、新しい配列を返す。
// 変わり種（夜色）は、もともと他と見分けがつくので数えない。
export function separateSpecs(specs, wards = [], inks = 3) {
  const used = new Set();
  return specs.map((spec, i) => {
    if (spec.kind === 'odd') return spec;
    const key = ink => [spec.species, wards[i] ?? 0, ink].join('/');
    let next = spec;
    if (used.has(key(spec.ink % inks))) {
      const free = Array.from({length: inks}, (_, k) => (spec.ink + k) % inks).find(ink => !used.has(key(ink)));
      if (free !== undefined) next = {...spec, ink: free};
    }
    used.add(key(next.ink % inks));
    return next;
  });
}

// 同順位は元の語順。入力配列・進捗は変更しない。戻り値は語オブジェクト。
export function gateWords(words, progress, ch) {
  return words.filter(w => w.ch === ch).sort((a, b) =>
    (progress.words[a.id]?.box ?? 0) - (progress.words[b.id]?.box ?? 0)
    || (progress.words[a.id]?.due ?? 0) - (progress.words[b.id]?.due ?? 0)).slice(0, 12);
}
