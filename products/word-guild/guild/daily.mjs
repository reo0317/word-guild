// 今日の依頼と連続日数。DOM も保存先も触らない。すべて新しいオブジェクトを返す。
import {isDue, dueCount} from './srs.mjs';

export const REVENGE_GOAL = 8;
export const CLEAN_GOAL = 10;
export const FINISH_GOAL = 2;
export const DAILY_KINDS = ['revenge', 'fresh', 'clean', 'finish']; // 選ぶ順

const freshGoal = progress => (progress.settings?.fresh ?? 4) * 2;

// 決める時点で出せる種類を表の順に返す。
function availableKinds(progress, words, today) {
  const kinds = [];
  if (dueCount(words, progress, today) >= REVENGE_GOAL) kinds.push('revenge');
  if (words.filter(word => !progress.words[word.id]).length >= freshGoal(progress)) kinds.push('fresh');
  kinds.push('clean', 'finish');
  return kinds;
}

function goalOf(kind, progress) {
  if (kind === 'revenge') return REVENGE_GOAL;
  if (kind === 'fresh') return freshGoal(progress);
  return kind === 'clean' ? CLEAN_GOAL : FINISH_GOAL;
}

// 今日の依頼を決める。同じ日ならそのまま。乱数は使わない。
export function rollDaily(progress, words, today) {
  if (progress.daily?.day === today) return progress;
  const kinds = availableKinds(progress, words, today);
  const kind = kinds[today % kinds.length];
  return {...progress, daily: {day: today, kind, goal: goalOf(kind, progress), count: 0, done: false}};
}

// この回の結果（entries の 1 行）が依頼にいくつ数えられるか。大物は2体分。
function countFor(kind, entry) {
  if (entry.result === 'missed') return 0;
  let hit = false;
  if (kind === 'revenge') hit = Boolean(entry.due) && (entry.result === 'clean' || entry.result === 'hint');
  else if (kind === 'fresh') hit = Boolean(entry.isNew);
  else if (kind === 'clean') hit = entry.result === 'clean';
  return hit ? (entry.big ? 2 : 1) : 0;
}

// outcome は quest.finish の {retreated, entries}。
export function applyOutcome(progress, outcome, today) {
  let next = {...progress};
  let dailyDone = false;
  const daily = progress.daily;
  if (daily && daily.day === today && !daily.done) {
    const add = daily.kind === 'finish'
      ? (outcome.retreated ? 0 : 1)
      : outcome.entries.reduce((sum, entry) => sum + countFor(daily.kind, entry), 0);
    const count = Math.min(daily.goal, daily.count + add);
    const done = count >= daily.goal;
    next.daily = {...daily, count, done};
    if (done) {
      next.dailyDone = (progress.dailyDone ?? 0) + 1;
      next.dailyDays = [...new Set([...(progress.dailyDays ?? []), today])].filter(day => day > today - 14 && day <= today).sort((a,b) => a-b);
      dailyDone = true;
    }
  }
  let streakUp = false;
  const old = progress.streak ?? {count: 0, last: 0, best: 0};
  next.streak = {...old};
  if (outcome.entries.some(entry => entry.result !== 'missed') && old.last !== today) {
    const count = old.last === today - 1 ? old.count + 1 : 1;
    next.streak = {count, last: today, best: Math.max(old.best, count)};
    streakUp = true;
  }
  return {progress: next, dailyDone, streakUp};
}

// 画面に出す連続日数。昨日より前に途切れていれば 0。
export function streakNow(streak, today) {
  return !streak || streak.last < today - 1 ? 0 : streak.count;
}

export function DAILY_TEXT(daily) {
  if (!daily) return '';
  switch (daily.kind) {
    case 'revenge': return `戻ってきた紙魚を${daily.goal}体倒す`;
    case 'fresh': return `新しい言葉を${daily.goal}語見つける`;
    case 'clean': return `ヒントなしで${daily.goal}語答える`;
    case 'finish': return `配達を${daily.goal}回やりとげる`;
    default: return '';
  }
}
