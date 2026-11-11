// 局の画面・配達の画面・結果画面と、盤面の入力。
// app.mjs からは mountGuild() だけを使う。ゲームの進行は quest.mjs に任せる。
import {Trace} from './trace.mjs';
import {artBox, ENEMY_ART} from './art.mjs';
import {loadWords} from './words.mjs';
import {Quest, HEARTS} from './quest.mjs';
import {pickSession, shelfStatus, dueCount, todayNumber, SESSION_SIZE} from './srs.mjs';
import {loadProgress, saveProgress} from './store.mjs';
import {COLS, spelling} from './board.mjs';
import {chapterStatus, currentChapter} from './chapters.mjs';
import {esc, speak, starsMarkup} from './dom.mjs';
import {renderZukan, renderCredits} from './library.mjs';

const POS_LABEL = {v: '動', n: '名', a: '形', o: '他'}; // 色の意味を文字でも示す
const RESULT_LABEL = {known: '知ってた', correct: '正解', hint: 'ヒント', taught: '教わった', missed: '未回答'};
const CRUMBLE_MS = 560; // 撃破 → 盤面が崩れる
const ENTER_MS = 520;   // 次の盤面と敵が入る（合わせて 1.2 秒以内）
const MAX_FRAME_MS = 250; // 長い停止の後に、まとめて攻撃されないための上限

function pulse(element, className) {
  if (!element) return;
  element.classList.remove(className);
  void element.offsetWidth; // アニメーションを最初からやり直す
  element.classList.add(className);
  element.addEventListener('animationend', () => element.classList.remove(className), {once: true});
}

function resultKind(entry) {
  if (entry.result === 'clean') return entry.isNew ? 'known' : 'correct';
  return entry.result;
}

// deps: {view, dev, setScreen, exit, music}。storage は dev のとき使わない（保存しない）。
// music は guild/music.mjs の createMusic()。なくても動く。
export function mountGuild({view, dev = false, setScreen, exit, music = null}) {
  let storage = null;
  if (!dev) {
    try { storage = localStorage; } catch { storage = null; }
  }
  let words = null;
  let progress = loadProgress(storage).progress;
  let saveFailed = false;

  let quest = null;
  let questChapter = 1;     // 配達の背景と敵の色になる区
  let tutorial = false;     // 最初の配達：1枚目にハトリ局長の説明とヒント1
  let trace = null;
  let strikes = [];
  let picking = null;       // 'hint' | 'teach'：お題の選択待ち
  let message = '';
  let timers = [];
  let frameId = 0;
  let lastFrame = 0;
  let observer = null;
  let sessionToken = 0;     // 画面を離れたあと、古いタイマーを無効にする
  const sfx = name => { try { music?.sfx(name); } catch { /* 音は遊びを止めない */ } };
  const bgm = scene => { try { music?.play(scene); } catch { /* 同上 */ } };

  const $ = selector => view.querySelector(selector);

  function stopSession() {
    sessionToken++;
    timers.forEach(clearTimeout);
    timers = [];
    cancelAnimationFrame(frameId);
    frameId = 0;
    observer?.disconnect();
    observer = null;
    trace?.cancel();
    quest = null;
    strikes = [];
    picking = null;
  }

  function later(ms, callback) {
    const token = sessionToken;
    timers.push(setTimeout(() => { if (token === sessionToken) callback(); }, ms));
  }

  function persist(next) {
    progress = next;
    if (!saveProgress(storage, next) && !dev) saveFailed = true;
  }

  // ---------- 局の画面 ----------

  function guildMessage() {
    const due = dueCount(words, progress, todayNumber());
    if (due > 0) return `戻ってきた紙魚（しみ）が ${due} 匹いるよ。配達ついでに追い払おう。`;
    if (progress.quests === 0) return `新人さん、まずは ${SESSION_SIZE} 語、取り戻しに行こう。`;
    return '消えた言葉を、取り戻しに行こう。';
  }

  function shelfMarkup(shelf) {
    const state = shelf.isGold ? 'gold' : shelf.isLit ? 'lit' : '';
    const label = shelf.isGold ? '金の切手' : shelf.isLit ? 'ともった' : 'まだ';
    return `<li class="gq-shelf ${state}"><span class="gq-lamp" aria-hidden="true">✦</span>
      <b>街灯${shelf.shelf}</b><span class="gq-shelf-count">${shelf.lit}/${shelf.total}</span>
      <small>${label}</small>
      <i class="gq-shelf-bar" aria-hidden="true"><i style="width:${Math.round(shelf.lit / shelf.total * 100)}%"></i></i></li>`;
  }

  function otherChapterMarkup(chapter) {
    const detail = chapter.isOpen ? `ともった街灯 ${chapter.litShelves}/${chapter.shelves.length}` : '未開放';
    return `<li class="${chapter.isOpen ? '' : 'locked'}"><b>${chapter.ch}区</b> ${esc(chapter.name)}<span>${detail}</span></li>`;
  }

  function showGuild() {
    stopSession();
    setScreen('guild');
    const collected = words.filter(word => progress.words[word.id]).length;
    const chapters = chapterStatus(words, progress);
    const current = currentChapter(chapters);
    const others = chapters.filter(chapter => chapter !== current);
    view.className = 'gq gq-home';
    view.innerHTML = `
      <p class="eyebrow">霧晴れ郵便局</p>
      <div class="gq-scene">${artBox('post', 'gq-scene-art')}</div>
      <div class="gq-guide">${artBox('hatori', 'gq-face')}<p class="bubble"><small>ハトリ局長</small>${esc(guildMessage())}</p></div>
      <h3 class="gq-chapter">${current.ch}区 ${esc(current.name)}<small>ともった街灯 ${current.litShelves}/${current.shelves.length}</small></h3>
      <ul class="gq-shelves ${current.shelves.length > 6 ? 'wide' : ''}" aria-label="通りの街灯">${current.shelves.map(shelfMarkup).join('')}</ul>
      <ul class="gq-chapters" aria-label="ほかの区">${others.map(otherChapterMarkup).join('')}</ul>
      <p class="gq-collected">集めた語 <b>${collected}</b> / ${words.length}</p>
      ${saveFailed ? '<p class="gq-warn">保存できません。この起動中はプレイできます。</p>' : ''}
      <button class="primary" id="gq-go" type="button">配達に出る <span aria-hidden="true">→</span></button>
      <div class="gq-footer">
        <button class="text-button" id="gq-title" type="button">← タイトルへ</button>
        <button class="text-button" id="gq-zukan" type="button">ことば帳</button>
        <button class="text-button" id="gq-credits" type="button">クレジット</button>
      </div>`;
    $('#gq-go').onclick = () => startQuest();
    $('#gq-title').onclick = () => { stopSession(); exit(); };
    $('#gq-zukan').onclick = () => renderZukan(view, {words, progress, onBack: showGuild});
    $('#gq-credits').onclick = () => renderCredits(view, {onBack: showGuild});
    bgm('post');
  }

  // ---------- 配達 ----------

  function startQuest(first = false) {
    tutorial = first === true;
    const today = todayNumber();
    const groups = pickSession(words, progress, today, SESSION_SIZE, Math.random);
    questChapter = currentChapter(chapterStatus(words, progress)).ch;
    stopSession();
    quest = new Quest(groups, {rand: Math.random, progress, today, save: persist});
    setScreen('guild-quest');
    renderBoard();
  }

  function cellMarkup(letter, index) {
    const delay = (index % COLS) * 8 + Math.floor(index / COLS) * 12;
    return `<button type="button" class="gq-cell" data-cell="${index}" style="--delay:${delay}ms" aria-label="行${Math.floor(index / COLS) + 1}列${index % COLS + 1} ${letter}"><span class="letter">${letter}</span></button>`;
  }

  function topLabel() {
    return quest.isRevenge ? 'リベンジ' : `盤面 ${quest.index + 1}/${quest.total}`;
  }

  // 盤面ごとに画面を組み直す。盤面の中の更新は paint* で行い、なぞり中の DOM は壊さない。
  function renderBoard() {
    trace?.cancel();
    trace = new Trace(quest.letters);
    strikes = [];
    picking = null;
    message = '';
    const coach = tutorial && quest.index === 0
      ? '<p class="gq-coach"><b>ハトリ局長</b>お題の日本語に合う英単語を、となりの文字へなぞってつなげよう</p>' : '';
    view.className = `gq gq-quest gq-ch${questChapter}${coach ? ' gq-tutor' : ''}`;
    view.innerHTML = `
      <div class="gq-top"><span class="gq-hearts" id="gq-hearts"></span><b id="gq-label"></b><span class="gq-timer" aria-hidden="true"><i id="gq-timer"></i></span><button type="button" class="gq-quit" id="gq-quit">やめる</button></div>
      <div class="gq-arena" id="gq-arena">
        ${artBox(`ward${questChapter}`, 'gq-arena-bg')}
        ${artBox('tsumugi', 'gq-hero')}
        <div class="gq-enemy" id="gq-enemy">${artBox(ENEMY_ART[quest.enemy], 'gq-sprite')}</div>
        <span class="gq-pips" id="gq-pips" role="img"></span>
      </div>
      <ul class="gq-clues" id="gq-clues"></ul>
      ${coach}
      <div class="gq-input" id="gq-text" aria-live="polite"></div>
      <div class="gq-board entering" id="gq-board" aria-label="7列6行の盤面">${quest.letters.map(cellMarkup).join('')}<svg class="gq-seals" id="gq-seals" aria-hidden="true"></svg></div>
      <div class="gq-actions"><button type="button" id="gq-hint">ヒント</button><button type="button" id="gq-teach">おしえて</button></div>`;
    $('#gq-label').textContent = topLabel();
    $('#gq-quit').onclick = quitQuest;
    $('#gq-hint').onclick = () => chooseHelp('hint');
    $('#gq-teach').onclick = () => chooseHelp('teach');
    bindBoard();
    paintAll();
    bgm(quest.isBig ? 'big' : 'delivery');
    const svg = $('#gq-seals');
    observer?.disconnect();
    observer = new ResizeObserver(drawSeals);
    observer.observe(svg);
    later(ENTER_MS, () => {
      quest.next(); // entering → battle
      if (tutorial && quest.index === 0) quest.hint(quest.slots[0].word.id); // 最初の配達：1語目にヒント1
      $('#gq-board')?.classList.remove('entering');
      paintAll();
      startClock();
    });
  }

  // やめる：ここまでの回答を保存して結果へ。
  function quitQuest() {
    if (!quest || quest.phase === 'finished') return;
    quest.finish(true);
    showResults();
  }

  // 正解の経路に朱の判を順に押し、最後に封蝋の判を1つ。盤面の実際のマスの位置から描く。
  function drawSeals() {
    const svg = $('#gq-seals');
    if (!svg) return;
    const box = svg.getBoundingClientRect();
    if (!box.width || !box.height) return;
    const cells = view.querySelectorAll('.gq-cell');
    const now = performance.now();
    svg.setAttribute('viewBox', `0 0 ${box.width} ${box.height}`);
    svg.innerHTML = strikes.map(strike => {
      const points = strike.path.map(index => {
        const rect = cells[index].getBoundingClientRect();
        return [rect.x + rect.width / 2 - box.x, rect.y + rect.height / 2 - box.y];
      });
      const fresh = now - strike.started < 700 ? ' fresh' : '';
      const radius = Math.max(9, Math.min(box.width / 7, box.height / 6) * 0.3);
      const marks = points.map(([x, y], i) =>
        `<circle class="seal-dot${fresh}" style="--i:${i}" cx="${x}" cy="${y}" r="${radius * 0.55}"/>`).join('');
      const [lastX, lastY] = points.at(-1);
      return `<g class="seal-route"><polyline class="seal-line" points="${points.map(point => point.join(',')).join(' ')}" fill="none"/>${marks}
        <g class="seal-wax${fresh}" style="--i:${points.length}" transform="translate(${lastX} ${lastY})"><circle r="${radius * 1.15}"/><circle class="seal-ring" r="${radius * 0.75}" fill="none"/></g></g>`;
    }).join('');
  }

  function startClock() {
    if (frameId) return;
    lastFrame = performance.now();
    const tick = now => {
      frameId = requestAnimationFrame(tick);
      const delta = Math.min(now - lastFrame, MAX_FRAME_MS);
      lastFrame = now;
      if (document.hidden || !quest || quest.phase !== 'battle') return;
      handleEvents(quest.advance(delta));
      paintTimer();
    };
    frameId = requestAnimationFrame(tick);
  }

  function handleEvents(events) {
    for (const event of events) {
      if (event.type === 'attack') {
        sfx('attack');
        pulse($('#gq-enemy'), 'lunge');
        pulse($('#gq-board'), 'shake');
        pulse($('#gq-hearts'), 'lost');
        message = event.word ? 'こうげき！ ハート −1 ・ ヒントが光ったよ' : 'こうげき！ ハート −1';
        later(2200, () => { message = ''; paintInput(); });
        paintAll();
      } else if (event.type === 'retreat') {
        later(700, showResults);
      }
    }
  }

  // ---------- 描画（部分更新） ----------

  function paintAll() {
    if (!quest) return;
    paintTop();
    paintClues();
    paintBoard();
    paintInput();
    paintTimer();
  }

  function paintTop() {
    const hearts = $('#gq-hearts');
    hearts.setAttribute('role', 'img');
    hearts.setAttribute('aria-label', `ハート ${HEARTS} 個中 ${quest.hearts} 個`);
    hearts.innerHTML = Array.from({length: HEARTS}, (_, i) =>
      `<i class="${i < quest.hearts ? 'on' : 'off'}">♥</i>`).join('');
    const pips = $('#gq-pips');
    pips.setAttribute('aria-label', `敵の残りヒット ${quest.unsolved.length}`);
    pips.innerHTML = quest.slots.map(slot => `<i class="${slot.solved ? '' : 'on'}"></i>`).join('');
  }

  function clueMarkup(slot) {
    const {word, text} = slot;
    const reveal = slot.solved || slot.hint >= 2;
    const main = reveal
      ? `<b class="gq-spell">${esc(word.w)}</b><small>${esc(word.ja)}</small>`
      : `<b>${esc(word.ja)}</b>`;
    const tail = slot.solved
      ? '<span class="gq-check" aria-label="解決済み">✓</span>'
      : `<span class="gq-dots" aria-label="${text.length}文字">${'<i></i>'.repeat(text.length)}</span>`;
    const classes = ['gq-clue', `pos-${word.pos}`, slot.solved ? 'solved' : '', picking && !slot.solved ? 'pickable' : '']
      .filter(Boolean).join(' ');
    return `<li><button type="button" class="${classes}" data-id="${esc(word.id)}" ${picking && !slot.solved ? '' : 'tabindex="-1"'}>
      <span class="gq-pos" aria-hidden="true">${POS_LABEL[word.pos]}</span>
      <span class="gq-clue-main">${main}</span>${tail}</button></li>`;
  }

  function paintClues() {
    const list = $('#gq-clues');
    list.innerHTML = quest.slots.map(clueMarkup).join('');
    list.querySelectorAll('.gq-clue').forEach(button => {
      button.onclick = () => pickClue(button.dataset.id);
    });
  }

  function paintBoard() {
    const cells = view.querySelectorAll('.gq-cell');
    const first = new Set();
    const route = new Map();
    for (const slot of quest.unsolved) {
      const path = quest.paths[slot.text];
      if (slot.hint === 1) first.add(path[0]);
      if (slot.hint >= 2) path.forEach((cell, i) => route.set(cell, i));
    }
    cells.forEach((button, i) => {
      button.classList.toggle('hint-first', first.has(i));
      button.classList.toggle('hint-route', route.has(i));
      button.classList.toggle('active', trace.path.includes(i));
      if (route.has(i)) button.style.setProperty('--n', route.get(i));
    });
  }

  function paintInput() {
    const line = $('#gq-text');
    if (!line) return;
    line.classList.toggle('is-message', !trace.text);
    if (trace.text) line.textContent = trace.text;
    else if (picking) line.textContent = picking === 'hint' ? 'ヒントを出すお題を選んでね' : 'おしえるお題を選んでね';
    else line.textContent = message || '上下左右になぞろう · 一歩戻って取り消し';
    $('#gq-hint').setAttribute('aria-pressed', picking === 'hint');
    $('#gq-teach').setAttribute('aria-pressed', picking === 'teach');
    const canHelp = quest.phase === 'battle' && quest.unsolved.length > 0;
    $('#gq-hint').disabled = !canHelp;
    $('#gq-teach').disabled = !canHelp;
  }

  function paintTimer() {
    const bar = $('#gq-timer');
    if (!bar) return;
    const left = Math.max(0, 1 - quest.idle / quest.idleLimit);
    bar.style.transform = `scaleX(${left})`;
    bar.parentElement.classList.toggle('warn', quest.phase === 'battle' && left < 0.34);
  }

  // ---------- ヒント・おしえて ----------

  function chooseHelp(kind) {
    if (!quest || quest.phase !== 'battle') return;
    const open = quest.unsolved;
    if (open.length === 1) {
      applyHelp(kind, open[0].word.id);
      return;
    }
    picking = picking === kind ? null : kind;
    paintClues();
    paintInput();
  }

  function pickClue(id) {
    if (picking) applyHelp(picking, id);
  }

  function applyHelp(kind, id) {
    if (kind === 'hint') quest.hint(id);
    else quest.teach(id);
    picking = null;
    paintClues();
    paintBoard();
    paintInput();
  }

  // ---------- 入力 ----------

  function bindBoard() {
    const board = $('#gq-board');
    const cellAt = (x, y) => {
      const element = document.elementFromPoint(x, y)?.closest('[data-cell]');
      return element && board.contains(element) ? Number(element.dataset.cell) : null;
    };
    const refresh = () => { paintBoard(); paintInput(); };

    board.addEventListener('pointerdown', event => {
      if (event.button !== 0 || !quest || quest.phase !== 'battle') return;
      const cell = cellAt(event.clientX, event.clientY);
      if (cell === null || !trace.start(event.pointerId, cell)) return;
      event.preventDefault();
      board.setPointerCapture(event.pointerId);
      refresh();
    });
    board.addEventListener('pointermove', event => {
      if (event.pointerId !== trace.pointer) return;
      event.preventDefault();
      const samples = event.getCoalescedEvents?.();
      for (const point of samples?.length ? samples : [event]) {
        const cell = cellAt(point.clientX, point.clientY);
        if (cell !== null) trace.add(event.pointerId, cell);
      }
      refresh();
    });
    board.addEventListener('pointerup', event => {
      if (event.pointerId !== trace.pointer) return;
      event.preventDefault();
      const cell = cellAt(event.clientX, event.clientY);
      if (cell !== null) trace.add(event.pointerId, cell);
      const path = [...trace.path];
      submit(trace.finish(event.pointerId), path);
    });
    const cancel = event => {
      if (event.pointerId !== trace.pointer) return;
      trace.cancel();
      refresh();
    };
    board.addEventListener('pointercancel', cancel);
    board.addEventListener('lostpointercapture', cancel);
    board.addEventListener('touchmove', event => event.preventDefault(), {passive: false});
  }

  function submit(text, path) {
    if (text === null || !quest) return;
    const result = quest.answer(text);
    if (!result) {
      if (text.length > 1) pulse($('#gq-text'), 'wrong');
      paintBoard();
      paintInput();
      return;
    }
    strikes.push({path, started: performance.now()});
    drawSeals();
    sfx('stamp');
    speak(result.word.w);
    message = `${result.word.w} · ${result.word.ja}`;
    pulse($('#gq-board'), 'correct');
    pulse($('#gq-enemy'), 'flinch');
    paintAll();
    if (result.cleared) defeat();
  }

  function defeat() {
    $('#gq-enemy').classList.add('defeated');
    $('#gq-board').classList.add('crumbling');
    sfx('crumble');
    later(CRUMBLE_MS, () => {
      quest.next();
      if (quest.phase === 'finished') showResults();
      else renderBoard();
    });
  }

  // ---------- 結果 ----------

  function resultRow(entry) {
    const kind = resultKind(entry);
    const long = spelling(entry.word.w).length > 10 ? ' long' : ''; // 長い語は訳を次の行へ
    return `<li class="${kind}${long}"><b>${esc(entry.word.w)}</b><span class="gq-ja">${esc(entry.word.ja)}</span>
      <span class="gq-stars" aria-label="習熟度 ${entry.box}">${starsMarkup(entry.box)}</span>
      <em>${RESULT_LABEL[kind]}</em></li>`;
  }

  function showResults() {
    if (!quest || !quest.outcome) return;
    const {outcome} = quest;
    const today = quest.today;
    const before = shelfStatus(words, quest.startProgress);
    const lit = shelfStatus(words, quest.progress)
      .filter((shelf, i) => shelf.isLit && !before[i].isLit)
      .map(shelf => `街灯${shelf.shelf}`);
    const back = dueCount(words, quest.progress, today);
    timers.forEach(clearTimeout);
    timers = [];
    cancelAnimationFrame(frameId);
    frameId = 0;
    const first = tutorial;
    tutorial = false;
    if (lit.length) sfx('lamp');
    bgm('post');
    view.className = 'gq gq-result';
    view.innerHTML = `
      <p class="eyebrow">${outcome.retreated ? (quest.hearts <= 0 ? 'ハートがなくなった' : '配達をやめた') : '配達'}</p>
      <h2 class="gq-title">${outcome.retreated ? '局に戻る' : '配達完了！'}</h2>
      <ul class="gq-results" aria-label="今回の語">${outcome.entries.map(resultRow).join('') || '<li class="empty">答えた語はありません</li>'}</ul>
      <p class="gq-lit">${lit.length ? `✦ ${lit.join('・')} がともった！` : '今回ともった街灯はありません'}</p>
      <p class="gq-back">戻ってくる紙魚（しみ）は <b>${back}</b> 匹</p>
      ${saveFailed ? '<p class="gq-warn">保存できません。この起動中はプレイできます。</p>' : ''}
      <div class="gq-result-actions"><button class="primary" id="gq-again" type="button">もう一度</button><button type="button" id="gq-guild">局へ</button></div>`;
    $('#gq-again').onclick = () => startQuest();
    $('#gq-guild').onclick = showGuild;
    $(first ? '#gq-guild' : '#gq-again').focus({preventScroll: true});
  }

  // ---------- 入口 ----------

  // first: 最初の配達（保存なしの最初だけ）。局を通らず配達から始め、終わると局へ。
  async function open({first = false} = {}) {
    stopSession();
    setScreen('guild');
    view.className = 'gq gq-home';
    view.innerHTML = '<p class="eyebrow">霧晴れ郵便局</p><p class="gq-loading">局の帳簿を開いています…</p>';
    try {
      words ??= await loadWords();
    } catch (error) {
      view.innerHTML = `<p class="eyebrow">霧晴れ郵便局</p><p class="gq-warn">${esc(error.message)}</p><button class="text-button" id="gq-title" type="button">← タイトルへ</button>`;
      $('#gq-title').onclick = exit;
      return;
    }
    if (first) startQuest(true);
    else showGuild();
  }

  document.addEventListener('visibilitychange', () => {
    trace?.cancel();
    if (quest && quest.phase === 'battle') { lastFrame = performance.now(); paintBoard(); paintInput(); }
  });

  // 画面を閉じるときも、戦闘中で回答済みの語があれば保存する。
  window.addEventListener('pagehide', () => {
    if (quest && quest.phase === 'battle' && quest.results.size > 0) quest.finish(true);
  });

  return {open, hasProgress: () => progress.quests > 0 || Object.keys(progress.words).length > 0};
}
