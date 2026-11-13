// 進捗の保存。storage は getItem / setItem を持つ物を引数で受ける（null 可）。
export const STORAGE_KEY = 'wordGuild.progress.v1';
const BACKUP_KEY = `${STORAGE_KEY}.backup`;

export function emptyProgress() {
  return {v: 1, words: {}, quests: 0, lastDay: 0,
    settings: {fresh: 4, speech: true}, streak: {count: 0, last: 0, best: 0},
    daily: null, dailyDone: 0, exportDay: 0, gates: [],
    rares: {}, rare: {miss: 0, day: 0, met: []}, seals: []};
}

const isCount = value => Number.isInteger(value) && value >= 0;

const shelves = value => Array.isArray(value) && value.every(n => Number.isInteger(n) && n >= 1 && n <= 56)
  && new Set(value).size === value.length ? [...value] : [];

function rareStates(value, encode = false) {
  const result = {};
  if (!value || typeof value !== 'object' || Array.isArray(value)) return result;
  for (const [id, entry] of Object.entries(value)) {
    const tuple = encode ? [entry?.box, entry?.due, entry?.seen] : entry;
    if (encode && typeof entry?.restored === 'boolean') tuple.push(entry.restored);
    if (!Array.isArray(tuple) || (tuple.length !== 3 && tuple.length !== 4)) continue;
    if (tuple.length === 4 && typeof tuple[3] !== 'boolean') continue;
    const [box, due, seen] = tuple;
    if (!Number.isInteger(box) || box < 0 || box > 5 || !isCount(due) || !isCount(seen)) continue;
    result[id] = encode ? tuple : {box, due, seen, ...(tuple.length === 4 ? {restored: tuple[3]} : {})};
  }
  return result;
}

function additionalFields(value) {
  const streak = value.streak;
  const daily = value.daily;
  return {
    seals: shelves(value.seals),
    rare: {miss: Number.isInteger(value.rare?.miss) && value.rare.miss >= 0 && value.rare.miss <= 3 ? value.rare.miss : 0,
      day: isCount(value.rare?.day) ? value.rare.day : 0, met: shelves(value.rare?.met)},
    gates: Array.isArray(value.gates) && value.gates.every(gate => Number.isInteger(gate) && gate >= 1 && gate <= 6) && new Set(value.gates).size === value.gates.length ? [...value.gates] : [],
    settings: {fresh: [4, 6, 8].includes(value.settings?.fresh) ? value.settings.fresh : 4, speech: value.settings?.speech !== false},
    streak: Object.fromEntries(['count', 'last', 'best'].map(key =>
      [key, isCount(streak?.[key]) ? streak[key] : 0])),
    daily: daily && isCount(daily.day) && isCount(daily.goal) && isCount(daily.count)
      && ['revenge', 'fresh', 'clean', 'finish'].includes(daily.kind)
      && typeof daily.done === 'boolean'
      ? {day: daily.day, kind: daily.kind, goal: daily.goal, count: daily.count, done: daily.done}
      : null,
    dailyDone: isCount(value.dailyDone) ? value.dailyDone : 0,
    exportDay: isCount(value.exportDay) ? value.exportDay : 0,
  };
}

// 壊れた値は空の進捗にし、使える語の状態だけを残す。例外は投げない。
export function validateProgress(value) {
  if (!value || value.v !== 1 || typeof value.words !== 'object' || value.words === null
    || Array.isArray(value.words)) return emptyProgress();
  const words = {};
  for (const [id, entry] of Object.entries(value.words)) {
    if (!Array.isArray(entry) || (entry.length !== 3 && entry.length !== 4)) continue;
    const [box, due, seen] = entry;
    if (!Number.isInteger(box) || box < 0 || box > 5 || !isCount(due) || !isCount(seen)) continue;
    if (entry.length === 4 && typeof entry[3] !== 'boolean') continue;
    words[id] = {box, due, seen, ...(entry.length === 4 ? {restored: entry[3]} : {})};
  }
  return {
    v: 1,
    words,
    rares: rareStates(value.rares),
    quests: isCount(value.quests) ? value.quests : 0,
    lastDay: isCount(value.lastDay) ? value.lastDay : 0,
    ...additionalFields(value),
  };
}

export function serializeProgress(progress) {
  const words = {};
  for (const [id, state] of Object.entries(progress.words)) {
    words[id] = [state.box, state.due, state.seen];
    if (typeof state.restored === 'boolean') words[id].push(state.restored);
  }
  return {v: 1, words, rares: rareStates(progress.rares, true), quests: progress.quests, lastDay: progress.lastDay, ...additionalFields(progress)};
}

// {progress, ok}。ok は storage が使えたか（保存の可否の目安）。
export function loadProgress(storage) {
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (raw === null || raw === undefined) return {progress: emptyProgress(), ok: true};
    return {progress: validateProgress(JSON.parse(raw)), ok: true};
  } catch {
    return {progress: emptyProgress(), ok: false};
  }
}

export function saveProgress(storage, progress) {
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(serializeProgress(progress)));
    return true;
  } catch {
    return false;
  }
}

function checksum(text) {
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    hash = Math.imul(hash ^ text.charCodeAt(i), 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

export function exportText(progress) {
  const json = JSON.stringify(serializeProgress(progress));
  const body = btoa(json).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '');
  return `WG1.${body}.${checksum(json)}`;
}

export function importText(text) {
  if (typeof text !== 'string') return {ok: false, error: 'format'};
  text = text.replace(/\s/g, '');
  if (!text) return {ok: false, error: 'empty'};
  const parts = text.split('.');
  if (parts.length !== 3 || parts[0] !== 'WG1' || !/^[A-Za-z0-9_-]+$/.test(parts[1])) {
    return {ok: false, error: 'format'};
  }
  let json;
  try {
    json = atob(parts[1].replaceAll('-', '+').replaceAll('_', '/'));
  } catch {
    return {ok: false, error: 'format'};
  }
  if (checksum(json) !== parts[2]) return {ok: false, error: 'checksum'};
  try {
    const value = JSON.parse(json);
    if (!value || value.v !== 1 || !value.words || typeof value.words !== 'object'
      || Array.isArray(value.words)) return {ok: false, error: 'data'};
    return {ok: true, progress: validateProgress(value)};
  } catch {
    return {ok: false, error: 'data'};
  }
}

export function backupProgress(storage) {
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (raw === null || raw === undefined) return false;
    storage.setItem(BACKUP_KEY, raw);
    return true;
  } catch {
    return false;
  }
}

export function restoreBackup(storage) {
  try {
    const raw = storage.getItem(BACKUP_KEY);
    if (raw === null || raw === undefined) return {progress: emptyProgress(), ok: false};
    return {progress: validateProgress(JSON.parse(raw)), ok: true};
  } catch {
    return {progress: emptyProgress(), ok: false};
  }
}

export function hasBackup(storage) {
  try {
    return storage.getItem(BACKUP_KEY) != null;
  } catch {
    return false;
  }
}
