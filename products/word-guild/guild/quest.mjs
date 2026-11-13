// 1クエストの状態。時間は advance(ms) で外から進める。DOM もタイマーも持たない。
import {generateBoard, matchWord, spelling} from './board.mjs';
import {grade, gradeReturn, isDue, isBig, isRestored} from './srs.mjs';
import {applyOutcome, streakNow} from './daily.mjs';
import {rollRare} from './rare.mjs';
import {emptyProgress} from './store.mjs';

export const HEARTS = 5;
export const IDLE_LIMIT = 15000;
export const IDLE_LIMIT_BIG = 25000; // 大物は長い綴りをなぞるので猶予を延ばす
export const MAX_REVENGE = 3;
// 互換のため残す（非推奨）。画面の移行後に削除する。
export const ENEMIES = ['cat', 'dog', 'sun', 'ant'];
export const REVENGE_ENEMY = 'animal';
const RESULT_BY_HINT = ['clean', 'hint', 'taught'];
const REVENGE_ORDER = {taught: 0, hint: 1};

// phase: entering（入場中） / battle / defeated（撃破の演出中） / finished
export class Quest {
  // groups は pickSession の戻り値（語オブジェクトの組の配列）。
  constructor(groups, {rand = Math.random, progress = emptyProgress(), today = 0, save = () => {}, gate = null, mode = 'normal', shelf = null, rares = [], map = null} = {}) {
    this.groups = groups;
    this.mode = mode;
    this.shelf = shelf;
    this.rares = rares;
    this.map = map;
    this.isNight = false;
    this.nightChecked = false;
    this.nightWord = null;
    this.nightResult = null;
    this.rareRoll = progress.rare;
    this.usedHelp = false;
    this.wrong = false;
    this.rand = rand;
    this.startProgress = progress;
    this.progress = progress;
    this.today = today;
    this.save = save;
    this.gate = mode !== 'return' && Number.isInteger(gate) && gate >= 1 && gate <= 6 ? gate : null;
    this.hearts = HEARTS;
    this.restoredIds = new Set(); // 今回ヒントなしで答えた語（再戦を含む）
    this.results = new Map(); // id → 'clean' | 'hint' | 'taught'（最初の結果）
    this.retreated = false;
    this.revengeWords = [];
    this.outcome = null;
    this.enter(0, groups[0]);
  }

  get total() { return this.groups.length; }
  get isRevenge() { return !this.isNight && this.index >= this.total; }
  // 互換のため残す（非推奨）。
  get enemy() { return this.isRevenge ? REVENGE_ENEMY : ENEMIES[Math.min(this.index, ENEMIES.length - 1)]; }
  get isBig() { return !this.isRevenge && this.slots.length === 1 && isBig(this.slots[0].word); }
  get idleLimit() { return this.isNight ? 25000 : this.isBig ? IDLE_LIMIT_BIG : IDLE_LIMIT; }
  get unsolved() { return this.slots.filter(slot => !slot.solved); }
  get solvedCount() { return this.slots.length - this.unsolved.length; }

  enter(index, words) {
    this.index = index;
    this.slots = words.map(word => ({word, text: spelling(word.w), hint: 0, solved: false}));
    const board = generateBoard(this.slots.map(slot => slot.text), this.rand);
    this.letters = board.letters;
    this.paths = board.paths;
    this.idle = 0;
    this.phase = 'entering';
  }

  slotFor(text) {
    return this.slots.find(slot => slot.text === text);
  }

  // 入場が終わったら戦闘へ。撃破の演出が終わったら次の盤面・リベンジ・結果へ。
  next() {
    if (this.phase === 'entering') {
      this.phase = 'battle';
    } else if (this.phase === 'defeated') {
      if (!this.isNight && this.index + 1 < this.total) {
        this.enter(this.index + 1, this.groups[this.index + 1]);
      } else if (this.mode === 'return' && !this.nightChecked && !this.isRevenge && this.openNight()) {
        // おまけは通常の配達と別に採点する。
      } else if (!this.isRevenge && this.pickRevenge().length > 0) {
        this.isNight = false;
        this.revengeWords = this.pickRevenge();
        this.enter(this.total, this.revengeWords);
      } else {
        this.finish(false);
      }
    }
    return this.phase;
  }

  openNight() {
    this.nightChecked = true;
    const roll = rollRare(this.startProgress, this.shelf, this.today, this.rand, this.rares, this.map);
    this.rareRoll = roll.rare;
    if (!roll.word) return false;
    this.nightWord = roll.word;
    this.isNight = true;
    this.enter(this.total, [roll.word]);
    return true;
  }

  // clean 以外の語から最大3語。教わった語を先にする。
  pickRevenge() {
    const seen = this.groups.flat();
    return seen
      .filter(word => this.results.has(word.id) && this.results.get(word.id) !== 'clean')
      .sort((a, b) => REVENGE_ORDER[this.results.get(a.id)] - REVENGE_ORDER[this.results.get(b.id)])
      .slice(0, MAX_REVENGE);
  }

  // 正解なら {word, cleared}、そうでなければ null（誤答に罰はない）。
  answer(text) {
    if (this.phase !== 'battle') return null;
    const match = matchWord(text, this.unsolved.map(slot => slot.text));
    if (!match) { if (!this.isNight) this.wrong = true; return null; }
    const slot = this.slotFor(match);
    slot.solved = true;
    if (slot.hint === 0) this.restoredIds.add(slot.word.id);
    if (this.isNight) this.nightResult = RESULT_BY_HINT[slot.hint];
    if (!this.isNight && !this.isRevenge && !this.results.has(slot.word.id)) {
      this.results.set(slot.word.id, RESULT_BY_HINT[slot.hint]);
    }
    this.idle = 0;
    const cleared = this.unsolved.length === 0;
    if (cleared) this.phase = 'defeated';
    return {word: slot.word, text: slot.text, cleared};
  }

  applyHint(id, level) {
    if (this.phase !== 'battle') return false;
    const slot = this.slots.find(s => s.word.id === id && !s.solved);
    if (!slot) return false;
    slot.hint = Math.max(slot.hint, level);
    if (!this.isNight) this.usedHelp = true;
    return true;
  }

  hint(id) { return this.applyHint(id, 1); }
  teach(id) { return this.applyHint(id, 2); }

  // 戻り値は起きたことの配列：{type:'attack', word} / {type:'retreat'}
  advance(ms) {
    const events = [];
    if (this.phase !== 'battle' || !(ms > 0)) return events;
    this.idle += ms;
    if (this.isNight) {
      if (this.idle >= this.idleLimit) {
        this.phase = 'defeated';
        return [{type: 'escape', word: this.nightWord}];
      }
      return events;
    }
    while (this.idle >= this.idleLimit && this.phase === 'battle') {
      this.idle -= this.idleLimit;
      this.hearts--;
      const target = this.unsolved.reduce((best, slot) => (best && best.hint <= slot.hint ? best : slot), null);
      if (target) target.hint = Math.min(2, target.hint + 1);
      events.push({type: 'attack', word: target?.word ?? null, hearts: this.hearts});
      if (this.hearts <= 0) {
        this.finish(true);
        events.push({type: 'retreat'});
      }
    }
    return events;
  }

  // 回答済みの語だけを採点して保存する。撤退でも呼ばれる。
  finish(retreated) {
    if (this.phase === 'finished') return;
    this.retreated = retreated;
    this.phase = 'finished';
    const words = {...this.startProgress.words};
    const entries = [];
    for (const word of this.groups.flat()) {
      const result = this.results.get(word.id);
      if (!result) continue;
      const before = this.startProgress.words[word.id];
      const after = (this.mode === 'return' ? gradeReturn : grade)(before, result, this.today);
      after.restored = isRestored(before) || this.restoredIds.has(word.id);
      words[word.id] = after;
      entries.push({word, result, restored: after.restored, stamped: this.restoredIds.has(word.id), isNew: !before, box: after.box, due: isDue(before, this.today), big: isBig(word)});
    }
    const rares = {...(this.startProgress.rares ?? {})};
    const rareEntries = [];
    if (this.nightWord) {
      const word = this.nightWord;
      const before = rares[word.id];
      const result = this.nightResult ?? 'taught';
      const after = grade(before, result, this.today);
      after.restored = isRestored(before) || this.nightResult === 'clean';
      rares[word.id] = after;
      rareEntries.push({word, result: this.nightResult ?? 'missed', rare: true,
        stamped: this.nightResult === 'clean', restored: after.restored,
        isNew: !before, box: after.box, due: isDue(before, this.today), big: false});
    }
    const sealed = this.mode === 'return' && !retreated && this.hearts === HEARTS
      && !this.usedHelp && !this.wrong && this.groups.flat().length === 12
      && this.groups.flat().every(word => this.results.get(word.id) === 'clean');
    const progress = {
      ...this.startProgress,
      words, rares, rare: this.rareRoll,
      seals: sealed ? [...new Set([...(this.startProgress.seals ?? []), this.shelf])]
        : [...(this.startProgress.seals ?? [])],
      quests: this.startProgress.quests + 1,
      lastDay: this.today,
      gates: !retreated && this.gate !== null
        ? [...new Set([...(this.startProgress.gates ?? []), this.gate])]
        : [...(this.startProgress.gates ?? [])],
    };
    // 撤退したとき、出題済みで未回答の語を末尾に足す（採点も保存もしない）
    if (retreated) {
      const upto = this.isRevenge ? this.total : this.index + 1;
      for (const word of this.groups.slice(0, upto).flat()) {
        if (!this.results.has(word.id)) {
          if (this.mode === 'return' && words[word.id]) {
            words[word.id] = {...gradeReturn(words[word.id], 'taught', this.today), restored: isRestored(words[word.id])};
          }
          entries.push({word, result: 'missed', isNew: !this.startProgress.words[word.id], box: this.startProgress.words[word.id]?.box ?? 0, due: isDue(this.startProgress.words[word.id], this.today), big: isBig(word)});
        }
      }
    }
    const applied = applyOutcome(progress, {retreated, entries}, this.today);
    this.progress = applied.progress;
    this.outcome = {
      retreated, entries: [...entries, ...rareEntries], sealed, mode: this.mode,
      dailyDone: applied.dailyDone,
      streakUp: applied.streakUp,
      daily: this.progress.daily,
      streak: streakNow(this.progress.streak, this.today),
    };
    this.save(this.progress);
  }
}
