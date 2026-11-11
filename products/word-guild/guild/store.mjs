// 進捗の保存。storage は getItem / setItem を持つ物を引数で受ける（null 可）。
export const STORAGE_KEY = 'wordGuild.progress.v1';

export function emptyProgress() {
  return {v: 1, words: {}, quests: 0, lastDay: 0};
}

const isCount = value => Number.isInteger(value) && value >= 0;

// 壊れた値は空の進捗にし、使える語の状態だけを残す。例外は投げない。
export function validateProgress(value) {
  if (!value || value.v !== 1 || typeof value.words !== 'object' || value.words === null
    || Array.isArray(value.words)) return emptyProgress();
  const words = {};
  for (const [id, entry] of Object.entries(value.words)) {
    if (!Array.isArray(entry) || entry.length !== 3) continue;
    const [box, due, seen] = entry;
    if (!Number.isInteger(box) || box < 0 || box > 5 || !isCount(due) || !isCount(seen)) continue;
    words[id] = {box, due, seen};
  }
  return {
    v: 1,
    words,
    quests: isCount(value.quests) ? value.quests : 0,
    lastDay: isCount(value.lastDay) ? value.lastDay : 0,
  };
}

export function serializeProgress(progress) {
  const words = {};
  for (const [id, state] of Object.entries(progress.words)) {
    words[id] = [state.box, state.due, state.seen];
  }
  return {v: 1, words, quests: progress.quests, lastDay: progress.lastDay};
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
