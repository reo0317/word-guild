// 地図・配達の画面・結果画面と、盤面の入力。
// app.mjs からは mountGuild() だけを使う。ゲームの進行は quest.mjs、地図の形は stages.mjs に任せる。
import {Trace} from './trace.mjs';
import {artBox, swapArt, artFile} from './art.mjs';
import {loadWords} from './words.mjs';
import {Quest, HEARTS} from './quest.mjs';
import {pickSession, groupWords, todayNumber, SESSION_SIZE} from './srs.mjs';
import {loadProgress, saveProgress} from './store.mjs';
import {COLS, spelling} from './board.mjs';
import {buildMap, nudge, gateWords} from './stages.mjs';
import {pageSpecs, stampState} from './chara.mjs';
import {charaDefs, charaSvg, stampHtml} from './chara-svg.mjs';
import {rollDaily} from './daily.mjs';
import {onUpdateReady, applyUpdate} from './pwa.mjs';
import {esc, speak, starsMarkup, loadStyle, reducedMotion, ensureDefs} from './dom.mjs';
import {renderCredits} from './library.mjs';
import {renderMap, dailyLine} from './map.mjs';

const POS_LABEL = {v: '動', n: '名', a: '形', o: '他'}; // 色の意味を文字でも示す
const RESULT_LABEL = {known: '知ってた', correct: '正解', hint: 'ヒント', taught: '教わった', missed: '未回答'};
const CRUMBLE_MS = 560; // 撃破 → 盤面が崩れる
const ENTER_MS = 520;   // 次の盤面と紙魚が入る（合わせて 1.2 秒以内）
const MAX_FRAME_MS = 250; // 長い停止の後に、まとめて攻撃されないための上限
const MAP_CSS = new URL('../map.css', import.meta.url).href;
const TAGS_URL = new URL('../data/chara.json', import.meta.url);
const EXPORT_REMIND_DAYS = 14;

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
  let byId = null;
  let tags = {};
  let progress = loadProgress(storage).progress;
  let saveFailed = false;
  let updateReady = false;
  let onMap = false;

  let quest = null;
  let questWard = 1;        // 配達の背景になる区
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

  try {
    onUpdateReady(() => { updateReady = true; if (onMap && words) showMap(); });
  } catch { /* 更新の通知がなくても遊べる */ }

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

  // ---------- 紙魚の絵 ----------

  const specCache = new Map();
  function specOf(word) {
    if (!specCache.has(word.id)) {
      const page = words.filter(other => other.shelf === word.shelf);
      pageSpecs(page, page.map(other => tags[other.id] ?? '')).forEach((spec, i) => specCache.set(page[i].id, spec));
    }
    return specCache.get(word.id);
  }

  const faceCache = new Map();
  function faceOf(id, state = 'print') {
    const word = byId.get(id);
    const key = `${id}:${state}`;
    if (!faceCache.has(key)) faceCache.set(key, charaSvg(specOf(word), {state, ward: word.ch}));
    return faceCache.get(key);
  }

  // ---------- 地図 ----------

  function mapMessage(map) {
    if (map.dueCount > 0) return `戻ってきた紙魚（しみ）が ${map.dueCount} 匹いるよ。配達ついでに追い払おう。`;
    if (progress.quests === 0) return `新人さん、まずは ${SESSION_SIZE} 語、取り戻しに行こう。`;
    return '消えた言葉を、取り戻しに行こう。';
  }

  function mapNotice(today) {
    if (updateReady) return {text: '新しい版があります　', label: '更新', act: 'update'};
    const collected = Object.keys(progress.words).length;
    if (collected >= 100 && today - progress.exportDay >= EXPORT_REMIND_DAYS) {
      return {text: '進捗を書き出しておこう　', label: '設定へ', act: 'settings'};
    }
    return null;
  }

  // 切手帳・設定が受け取る材料。戻るボタンは地図へ。
  function libDeps(extra = {}) {
    return {
      words, tags, progress, storage, dev, music, today: todayNumber(),
      back: showMap, speak,
      onProgress: next => { persist(next); },
      ...extra,
    };
  }

  // 切手帳と設定は別の担当のファイル。まだ無い・読めないときは何もしない。
  async function openOptional(load, name, extra) {
    try {
      const mod = await load();
      if (typeof mod?.[name] === 'function') mod[name](view, libDeps(extra));
    } catch { /* 相手がいなくても、エラーは出さない */ }
  }
  const openAlbumAt = shelf => { onMap = false; openOptional(() => import('./album.mjs'), 'openAlbum', {shelf}); };
  const openSettingsHere = () => { onMap = false; openOptional(() => import('./settings.mjs'), 'openSettings', {}); };

  function showMap() {
    stopSession();
    setScreen('guild');
    onMap = true;
    const today = todayNumber();
    const rolled = rollDaily(progress, words, today);
    if (rolled !== progress) persist(rolled);
    const map = buildMap(words, progress, today);
    renderMap(view, {
      map, today, progress, total: words.length,
      face: faceOf, tsumugi: artFile('tsumugi'),
      message: mapMessage(map),
      notice: mapNotice(today),
      warn: saveFailed ? '保存できません。この起動中はプレイできます。' : '',
      on: {
        go: () => startQuest(),
        gate: ch => startQuest({gate: ch}),
        lamp: openAlbumAt,
        album: () => openAlbumAt(map.here?.shelf),
        settings: openSettingsHere,
        credits: () => { onMap = false; renderCredits(view, {onBack: showMap}); },
        title: () => { onMap = false; stopSession(); exit(); },
        notice: act => { if (act === 'update') applyUpdate(); else openSettingsHere(); },
      },
    });
    bgm('post');
  }

  // ---------- 配達 ----------

  // opts: {first: 最初の配達, gate: 区の番号（区の門の配達）}
  function startQuest(opts = {}) {
    tutorial = opts.first === true;
    onMap = false;
    const today = todayNumber();
    const rolled = rollDaily(progress, words, today);
    if (rolled !== progress) persist(rolled);
    const gate = Number.isInteger(opts.gate) ? opts.gate : null;
    const groups = gate !== null
      ? groupWords(gateWords(words, progress, gate), Math.random)
      : pickSession(words, progress, today, SESSION_SIZE, Math.random);
    questWard = gate ?? buildMap(words, progress, today).here?.ch ?? 1;
    stopSession();
    quest = new Quest(groups, {rand: Math.random, progress, today, save: persist, gate});
    setScreen('guild-quest');
    renderBoard();
  }

  function cellMarkup(letter, index) {
    const delay = (index % COLS) * 8 + Math.floor(index / COLS) * 12;
    return `<button type="button" class="gq-cell" data-cell="${index}" style="--delay:${delay}ms" aria-label="行${Math.floor(index / COLS) + 1}列${index % COLS + 1} ${letter}"><span class="letter">${letter}</span></button>`;
  }

  function topLabel() {
    if (quest.isRevenge) return 'リベンジ';
    return `盤面 ${quest.index + 1}/${quest.total}${quest.isBig ? ' ・大物' : ''}`;
  }

  // 1語＝1体。語を見せない（綴りも頭文字も出さない）。額面（文字数）だけ出す。
  function monMarkup(slot) {
    const spec = specOf(slot.word);
    const big = spec.kind === 'big';
    return `<div class="gq-mon${big ? ' big' : ''}${quest.isRevenge ? ' angry' : ''}" data-id="${esc(slot.word.id)}">
      <span class="gq-mon-val" aria-hidden="true">${spec.kind === 'big' ? '大' : slot.text.length}</span>
      <div class="gq-mon-body">${charaSvg(spec, {state: 'print', ward: slot.word.ch})}</div>
      <i class="gq-mon-seal" aria-hidden="true"></i>
      <span class="gq-mon-gone" aria-hidden="true">また来る</span>
    </div>`;
  }

  const monOf = id => [...view.querySelectorAll('.gq-mon')].find(mon => mon.dataset.id === id) ?? null;

  // 盤面ごとに画面を組み直す。盤面の中の更新は paint* で行い、なぞり中の DOM は壊さない。
  function renderBoard() {
    trace?.cancel();
    trace = new Trace(quest.letters);
    strikes = [];
    picking = null;
    message = quest.isBig ? '大物があらわれた' : '';
    const coach = tutorial && quest.index === 0
      ? `<div class="gq-coach">${artBox('hatori', 'gq-coach-face')}<b>ハトリ局長</b>お題の日本語に合う英単語を、となりの文字へなぞってつなげよう</div>` : '';
    view.className = `gq gq-quest gq-ch${questWard}${coach ? ' gq-tutor' : ''}`;
    view.innerHTML = `
      <div class="gq-top"><span class="gq-hearts" id="gq-hearts"></span><b id="gq-label"></b><span class="gq-timer" aria-hidden="true"><i id="gq-timer"></i></span><span class="gq-tally" id="gq-tally" role="img"></span><button type="button" class="gq-quit" id="gq-quit">やめる</button></div>
      <div class="gq-arena" id="gq-arena">
        <div class="gq-arena-clip">
          ${artBox(`ward${questWard}`, 'gq-arena-bg')}
          <i class="gq-tint" aria-hidden="true"></i>
          ${artBox('tsumugi', 'gq-hero')}${artBox('fuurou', 'gq-owl')}
        </div>
        <div class="gq-mons" id="gq-mons">${quest.slots.map(monMarkup).join('')}</div>
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
    if (quest.isBig) later(800, () => { message = ''; paintInput(); });
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
      // 経路の各マスに朱の判が順に押される。判は少しずつ傾け、版画の刷りむらを出す。
      const marks = points.map(([x, y], i) =>
        `<g transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${(i * 37) % 24 - 12})"><g class="seal-dot${fresh}" style="--i:${i}">`
        + `<circle r="${radius * 0.62}"/><circle class="seal-ring" r="${radius * 0.38}"/></g></g>`).join('');
      // 最後に封蝋の判：波打つ縁、内側の輪、封筒の折り目。
      const [lastX, lastY] = points.at(-1);
      const wave = Array.from({length: 48}, (_, k) => {
        const angle = k / 48 * Math.PI * 2;
        const r = radius * 1.2 * (1 + 0.07 * Math.sin(angle * 9));
        return `${(Math.cos(angle) * r).toFixed(1)},${(Math.sin(angle) * r).toFixed(1)}`;
      }).join(' ');
      const flap = radius * 0.42;
      return `<g class="seal-route"><polyline class="seal-line" points="${points.map(point => point.join(',')).join(' ')}" fill="none"/>${marks}
        <g transform="translate(${lastX.toFixed(1)} ${lastY.toFixed(1)})"><g class="seal-wax${fresh}" style="--i:${points.length}"><polygon points="${wave}"/>`
        + `<circle class="seal-ring" r="${radius * 0.82}"/><path class="seal-mark" d="M${-flap} ${-flap * 0.5}L0 ${flap * 0.3}L${flap} ${-flap * 0.5}M${-flap} ${-flap * 0.5}V${flap * 0.6}H${flap}V${-flap * 0.5}" fill="none"/></g></g></g>`;
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
        const target = event.word ? monOf(event.word.id) : null;
        if (target) pulse(target, 'lunge');
        else view.querySelectorAll('.gq-mon:not(.solved)').forEach(mon => pulse(mon, 'lunge'));
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
    paintMons();
    paintClues();
    paintBoard();
    paintInput();
    paintTimer();
  }

  function stampCount() {
    return quest.results ? [...quest.results.values()].filter(result => result === 'clean').length : 0;
  }

  function paintTop() {
    const hearts = $('#gq-hearts');
    hearts.setAttribute('role', 'img');
    hearts.setAttribute('aria-label', `ハート ${HEARTS} 個中 ${quest.hearts} 個`);
    hearts.innerHTML = Array.from({length: HEARTS}, (_, i) =>
      `<i class="${i < quest.hearts ? 'on' : 'off'}">♥</i>`).join('');
    const tally = $('#gq-tally');
    tally.setAttribute('aria-label', `切手 ${stampCount()} 枚`);
    tally.innerHTML = `<i class="gq-tally-icon"></i><b>${stampCount()}</b>`;
  }

  // ヒントを使った紙魚は、冷や汗をかく。
  function paintMons() {
    for (const slot of quest.slots) {
      monOf(slot.word.id)?.classList.toggle('hinted', slot.hint > 0 && !slot.solved);
    }
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
      <span class="gq-face-sm" aria-hidden="true">${faceOf(word.id)}</span>
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
    paintMons();
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

  // 正解した紙魚：ヒントなしなら判を押されて切手になる。ヒントを使っていたら、切手にならずに逃げる。
  function resolveMon(slot) {
    const mon = monOf(slot.word.id);
    if (!mon) return;
    mon.classList.remove('hinted');
    if (slot.hint > 0) {
      mon.classList.add('solved', 'fled');
      return;
    }
    const spec = specOf(slot.word);
    const html = stampHtml(slot.word, spec, {state: quest.isRevenge ? 'proof' : 'print', ward: slot.word.ch})
      .replace('<button', '<button tabindex="-1"');
    mon.insertAdjacentHTML('beforeend', `<div class="gq-mon-stamp">${html}</div>`);
    mon.classList.add('solved', 'stamped');
  }

  // 盤面を取り切ったら、切手が上の切手の数へ飛ぶ（0.5 秒）。
  function flyStamps() {
    const target = $('#gq-tally');
    if (!target || reducedMotion()) return;
    const goal = target.getBoundingClientRect();
    view.querySelectorAll('.gq-mon-stamp').forEach(element => {
      const box = element.getBoundingClientRect();
      const dx = goal.x + goal.width / 2 - (box.x + box.width / 2);
      const dy = goal.y + goal.height / 2 - (box.y + box.height / 2);
      element.animate([
        {transform: 'translate(0,0) scale(1)', opacity: 1},
        {transform: `translate(${dx}px,${dy}px) scale(.2)`, opacity: 0.3},
      ], {duration: 480, easing: 'ease-in', fill: 'forwards'});
    });
  }

  function submit(text, path) {
    if (text === null || !quest) return;
    const result = quest.answer(text);
    if (!result) {
      if (text.length > 1) { pulse($('#gq-text'), 'wrong'); sfx('wrong'); }
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
    resolveMon(quest.slots.find(slot => slot.word.id === result.word.id));
    react(result.cleared);
    paintAll();
    if (result.cleared) defeat();
  }

  // 正解のたびに、フウロウが判を押す。盤面を取り切ったらツムギが喜ぶ。
  function react(cleared) {
    const owl = $('.gq-owl');
    swapArt(owl, 'fuurouStamp');
    pulse(owl, 'stamped');
    if (cleared) swapArt($('.gq-hero'), 'tsumugiJoy');
    later(450, () => { swapArt(owl, 'fuurou'); if (!cleared) swapArt($('.gq-hero'), 'tsumugi'); });
  }

  function defeat() {
    $('#gq-board').classList.add('crumbling');
    sfx('crumble');
    later(180, flyStamps);
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

  // 全石段の通し番号（地図の下から数える）と、街灯の最後の石段かどうか。
  function stepList(map) {
    const list = [];
    for (const ward of map.wards) for (const lamp of ward.lamps) {
      lamp.steps.forEach((step, i) => list.push({ch: ward.ch, shelf: lamp.shelf, step: i + 1, last: i === lamp.steps.length - 1}));
    }
    return list;
  }

  function nudgeText(n) {
    switch (n.kind) {
      case 'page': return `あと ${n.count} 枚でこの通りがそろう`;
      case 'lamp': return `つぎで街灯 ${n.count}`;
      case 'light': return `あと ${n.count} 匹で街灯がともる`;
      case 'daily': return `あと ${n.count} 匹で今日の速達`;
      default: return `つぎの石段に ${n.count} 体`;
    }
  }

  // 道の小さな図：ツムギが石段を上る。
  function miniRoad(before, after) {
    const list = stepList(after);
    const at = here => Math.max(0, list.findIndex(s => here && s.ch === here.ch && s.shelf === here.shelf && s.step === here.step));
    const ib = at(before.here);
    const ia = at(after.here);
    let a = Math.max(0, Math.min(ib, ia) - 1);
    let b = Math.min(list.length - 1, a + 5);
    if (ia + 1 > b) { b = Math.min(list.length - 1, ia + 1); a = Math.max(0, b - 5); }
    const n = b - a + 1;
    const pos = i => [n > 1 ? 7 + (i - a) / (n - 1) * 86 : 50, 74 - (n > 1 ? (i - a) / (n - 1) * 52 : 0)];
    const dots = [];
    for (let i = a; i <= b; i++) {
      const [x, y] = pos(i);
      dots.push(`<i class="${list[i].last ? 'lamp' : ''} ${i <= ia ? 'on' : ''}" style="left:${x}%;top:${y}%"></i>`);
    }
    const [x0, y0] = pos(ib);
    const [x1, y1] = pos(ia);
    const line = Array.from({length: n}, (_, i) => pos(a + i).join(',')).join(' ');
    return `<div class="gq-mini-road"><svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><polyline points="${line}"/></svg>${dots.join('')}
      <img class="gq-mini-tsumugi" alt="" src="${esc(artFile('tsumugi'))}" style="--x0:${x0}%;--y0:${y0}%;--x1:${x1}%;--y1:${y1}%"></div>`;
  }

  function showResults() {
    if (!quest || !quest.outcome) return;
    const {outcome} = quest;
    const today = quest.today;
    const before = buildMap(words, quest.startProgress, today);
    const after = buildMap(words, quest.progress, today);
    const line = nudge(before, after, quest.progress.daily);
    timers.forEach(clearTimeout);
    timers = [];
    cancelAnimationFrame(frameId);
    frameId = 0;
    const first = tutorial;
    tutorial = false;
    const lamps = map => new Map(map.wards.flatMap(w => w.lamps).map(l => [l.shelf, l]));
    const litNow = [...lamps(after)].filter(([shelf, l]) => l.lit === l.total && lamps(before).get(shelf).lit < l.total).map(([shelf]) => shelf);
    if (litNow.length) sfx('lamp');
    bgm('post');

    // 切手：新しく入った／上がった／逃げた（影のまま）
    const state = (id, source) => stampState(source.words[id]);
    const changedByShelf = new Map();
    const stamps = outcome.entries.map((entry, i) => {
      const fled = entry.result !== 'clean';
      const was = state(entry.word.id, quest.startProgress);
      const now = fled ? 'shadow' : state(entry.word.id, quest.progress);
      let mark = '';
      if (!fled) {
        if (entry.isNew) mark = '<span class="mk new">新</span>';
        else if (was !== now) mark = now === 'gold' ? '<span class="mk gold">金</span>' : '<span class="mk up">↑</span>';
        if (mark) changedByShelf.set(entry.word.shelf, (changedByShelf.get(entry.word.shelf) ?? 0) + 1);
      }
      const html = stampHtml(entry.word, specOf(entry.word), {state: now, ward: entry.word.ch})
        .replace('<button', '<button tabindex="-1"');
      return `<li class="gq-stamp-cell${fled ? ' fled' : ''}${entry.big ? ' wide' : ''}" style="--i:${i}" data-say="${esc(entry.word.w)}" data-cap="${fled ? `${esc(entry.word.w)} · ${esc(entry.word.ja)}（また来る）` : `${esc(entry.word.w)} · ${esc(entry.word.ja)}`}">${html}${mark}${fled ? '<small class="again">また来る</small>' : ''}</li>`;
    });

    // そのページ（今回いちばん切手が入った街灯。なければ今いる街灯）の 5×5
    let shelf = after.here?.shelf;
    let most = 0;
    for (const [s, n] of changedByShelf) if (n > most) { most = n; shelf = s; }
    const lampNow = lamps(after).get(shelf);
    const pageWords = words.filter(w => w.shelf === shelf);
    const changedIds = new Set(outcome.entries.filter(e => e.result === 'clean').map(e => e.word.id));
    const cells = pageWords.map(word => {
      const st = state(word.id, quest.progress);
      const fresh = changedIds.has(word.id) && state(word.id, quest.startProgress) !== st;
      return `<i class="s-${st}${fresh ? ' fresh' : ''}" style="--w:${word.ch}"></i>`;
    }).join('');

    const gateOpened = quest.gate !== null && !outcome.retreated;
    const nextGate = after.wards.find(w => w.gate === 'open');
    const primary = after.fog ? '霧を払う' : nextGate ? '区の門へ' : 'つぎの石段へ';
    const daily = quest.progress.daily;
    const dailyNote = outcome.dailyDone ? '速達達成！' : daily && !daily.done ? `今日の速達　${dailyLine(daily)}` : daily ? '今日の速達　達成ずみ' : '';
    const tomorrow = after.tomorrow;
    const nextFaces = after.next.map(id => `<span class="gq-face">${faceOf(id, 'shadow')}</span>`).join('');
    const tomorrowFaces = tomorrow.slice(0, 3).map(id => `<span class="gq-face s">${faceOf(id)}</span>`).join('');

    view.className = 'gq gq-result';
    view.innerHTML = `
      <div class="gq-result-head">${artBox(outcome.retreated ? 'tsumugi' : 'tsumugiJoy')}<h2 class="gq-title">${outcome.retreated ? '局に戻る' : '配達完了！'}</h2>${artBox(outcome.retreated ? 'fuurou' : 'fuurouStamp', 'art-owl')}</div>
      <div class="gq-res-scroll" id="gq-res">
        <section class="gq-res-sec" style="--d:.1s"><h3>今回の切手</h3>
          <ul class="gq-stamps" aria-label="今回の切手">${stamps.join('') || '<li class="empty">答えた語はありません</li>'}</ul>
          <p class="gq-cap" id="gq-cap" aria-live="polite">${outcome.entries.length ? '切手をたたくと、語と訳が出るよ' : ''}</p>
        </section>
        <section class="gq-res-sec" style="--d:${0.1 + 0.07 * stamps.length + 0.5}s"><h3>この通りの切手　<b>${lampNow?.got ?? 0}/${lampNow?.total ?? 25}</b></h3>
          <div class="gq-page" style="--n:${changedIds.size}" role="img" aria-label="街灯${shelf}のページ ${lampNow?.got ?? 0}/${lampNow?.total ?? 25}">${cells}</div>
          ${litNow.length ? `<p class="gq-lit">✦ 街灯${litNow.join('・')} がともった！</p>` : ''}
        </section>
        <section class="gq-res-sec" style="--d:${0.1 + 0.07 * stamps.length + 1.7}s"><h3>道をのぼる</h3>
          ${miniRoad(before, after)}
          <div class="gq-next-row"><small>つぎの石段の紙魚</small><span class="gq-faces">${nextFaces || '<small>いちばん上まで来た</small>'}</span></div>
        </section>
        <section class="gq-res-sec" style="--d:${0.1 + 0.07 * stamps.length + 2.6}s">
          <p class="gq-nudge">${esc(nudgeText(line))}</p>
          ${gateOpened ? `<p class="gq-lit">${quest.gate}区の門が開いた！</p>` : ''}
          ${dailyNote ? `<p class="gq-dailynote ${outcome.dailyDone ? 'done' : ''}">${esc(dailyNote)}</p>` : ''}
          ${outcome.streakUp ? `<p class="gq-dailynote">連続 ${outcome.streak} 日目</p>` : ''}
          <p class="gq-back">明日戻ってくる紙魚 <b>${tomorrow.length}</b> 匹 <span class="gq-faces">${tomorrowFaces}</span></p>
          ${saveFailed ? '<p class="gq-warn">保存できません。この起動中はプレイできます。</p>' : ''}
          <details class="gq-detail"><summary>今回の語を見る</summary><ul class="gq-results" aria-label="今回の語">${outcome.entries.map(resultRow).join('')}</ul></details>
        </section>
      </div>
      <div class="gq-result-actions"><button class="primary" id="gq-again" type="button">${primary}</button>
        <div class="gq-two"><button type="button" id="gq-guild">局へ</button><button type="button" id="gq-album">切手帳</button>${nextGate && primary !== '区の門へ' ? `<button type="button" id="gq-gate">${nextGate.ch}区の門へ</button>` : ''}</div></div>`;
    $('#gq-again').onclick = () => (after.fog || !nextGate ? startQuest() : startQuest({gate: nextGate.ch}));
    $('#gq-guild').onclick = showMap;
    $('#gq-album').onclick = () => openAlbumAt(after.here?.shelf);
    if ($('#gq-gate')) $('#gq-gate').onclick = () => startQuest({gate: nextGate.ch});
    $('#gq-res').addEventListener('click', event => {
      const cell = event.target.closest('.gq-stamp-cell');
      if (!cell) { $('#gq-res').classList.add('skip'); return; }
      $('#gq-cap').textContent = cell.dataset.cap;
      speak(cell.dataset.say);
    });
    $(first ? '#gq-guild' : '#gq-again').focus({preventScroll: true});
  }

  // ---------- 入口 ----------

  // first: 最初の配達（保存なしの最初だけ）。地図を通らず配達から始め、終わると地図へ。
  async function open({first = false} = {}) {
    stopSession();
    setScreen('guild');
    view.className = 'gq gq-home';
    view.innerHTML = '<p class="eyebrow">霧晴れ郵便局</p><p class="gq-loading">局の帳簿を開いています…</p>';
    try {
      words ??= await loadWords();
      byId = new Map(words.map(word => [word.id, word]));
      try {
        const response = await fetch(TAGS_URL);
        if (response.ok) tags = await response.json();
      } catch { /* 分類がなくても、紙魚は既存の5種で出る */ }
      ensureDefs(charaDefs());
      await loadStyle(MAP_CSS);
    } catch (error) {
      view.innerHTML = `<p class="eyebrow">霧晴れ郵便局</p><p class="gq-warn">${esc(error.message)}</p><button class="text-button" id="gq-title" type="button">← タイトルへ</button>`;
      $('#gq-title').onclick = exit;
      return;
    }
    if (first) startQuest({first: true});
    else showMap();
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
