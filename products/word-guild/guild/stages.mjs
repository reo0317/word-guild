// 坂道の地図。DOM・保存先を触らず、words.json の順で石段を組む。
import {CHAPTER_NAMES} from './chapters.mjs';
import {HEAVY_DUE, LIT_BOX, MAX_BOX, isDue} from './srs.mjs';

// 公開する地図の形を増やさず、結果の一行に使う現在の石段の残数を保持する。
const remaining = new WeakMap();

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
  remaining.set(result, position?.entry.ids.filter(id => !progress.words[id]).length ?? 0);
  return result;
}

// before / after は buildMap の結果、daily は配達後の progress.daily。
// kind: page（残り枚数）, lamp（次の街灯番号）, light（未点灯語数）,
// daily（速達の残り）, next（今いる石段の未遭遇語数）。完了済みの目標は出さない。
export function nudge(before, after, daily) {
  const lamps = after.wards.flatMap(w => w.lamps);
  // 配達前にいたページを優先する。ページをまたいだ配達にも対応。
  const oldLamp = lamps.find(l => l.shelf === before.here?.shelf);
  const lamp = lamps.find(l => l.shelf === after.here?.shelf);
  const candidates = [...new Set([oldLamp, lamp].filter(Boolean))];
  const page = candidates.find(l => l.total - l.got > 0 && l.total - l.got <= 5);
  if (page) return {kind: 'page', count: page.total - page.got};
  if (lamp && lamp.steps.length - after.here.step + 1 === 1 && !lamp.steps.at(-1).passed) {
    return {kind: 'lamp', count: lamp.shelf};
  }
  const light = candidates.find(l => l.total - l.lit > 0 && l.total - l.lit <= 5);
  if (light) return {kind: 'light', count: light.total - light.lit};
  if (daily && !daily.done && daily.goal > daily.count) return {kind: 'daily', count: daily.goal - daily.count};
  return {kind: 'next', count: remaining.get(after) ?? after.next.length};
}

// 同順位は元の語順。入力配列・進捗は変更しない。戻り値は語オブジェクト。
export function gateWords(words, progress, ch) {
  return words.filter(w => w.ch === ch).sort((a, b) =>
    (progress.words[a.id]?.box ?? 0) - (progress.words[b.id]?.box ?? 0)
    || (progress.words[a.id]?.due ?? 0) - (progress.words[b.id]?.due ?? 0)).slice(0, 12);
}
