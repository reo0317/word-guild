import {isRestored} from './srs.mjs';
// 地図・配達の画面・結果画面と、盤面の入力。
// app.mjs からは mountGuild() だけを使う。ゲームの進行は quest.mjs、地図の形は stages.mjs に任せる。
import {Trace} from './trace.mjs';
import {artBox, swapArt, artFile} from './art.mjs';
import {loadWords} from './words.mjs';
import {Quest, HEARTS} from './quest.mjs';
import {pickSession, groupWords, todayNumber, SESSION_SIZE} from './srs.mjs';
import {loadProgress, saveProgress} from './store.mjs';
import {COLS, spelling} from './board.mjs';
import {buildMap, gateWords, separateSpecs} from './stages.mjs';
import {letterView, clipParts, loadScenes} from './story.mjs';
import {pageSpecs, stampState as rawStampState} from './chara.mjs';
import {charaDefs, charaSvg, stampHtml} from './chara-svg.mjs';
import {rollDaily} from './daily.mjs';
import {onUpdateReady, applyUpdate} from './pwa.mjs';
import {esc, speak, starsMarkup, loadStyle, reducedMotion, ensureDefs, fab, waxButton, helpButton, icon,
  ensureLetterCss, letterHtml, lineBody, lampRing, shadowLinesOf, wordLineHtml, handleLetterClick, envelopeScene} from './dom.mjs';
import {showStampZoom, ensureCss as ensureAlbumCss, sceneFor, gateCard, newlyOpenedGate, playOptionalCinema, showPaperCard, sceneCardHtml, blankCardHtml} from './album.mjs';
import {renderMap, dailyBrief} from './map.mjs';

const POS_LABEL = {v: '動', n: '名', a: '形', o: '他'}; // 色の意味を文字でも示す
const RESULT_LABEL = {known: '知ってた', correct: '正解', hint: 'ヒント', taught: '教わった', missed: '未回答'};
const COACH = 'ヒントなしで、日本語に合う英単語をなぞろう';
const CRUMBLE_MS = 560; // 撃破 → 盤面が崩れる
const ENTER_MS = 1000;  // 霧から紙魚が現れてから、配達の時計を始める
const MAX_FRAME_MS = 250; // 長い停止の後に、まとめて攻撃されないための上限
const MAP_CSS = new URL('../map.css', import.meta.url).href;
const TAGS_URL = new URL('../data/chara.json', import.meta.url);
const STORY_URL = new URL('../data/story.json', import.meta.url);
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
  let story = {v: 1, letters: []}; // 物語の英文。data/story.json が無い・一部の街灯だけでも遊べる
  let storyLoaded = false;
  let scenes = null;
  let presentationClose = null;
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
  let lib = null;           // 切手帳・設定の handle。画面を移るとき close() する
  let zoomClose = null;     // 結果画面の切手の拡大。画面を移るとき閉じる
  let popEl = null;         // 地図で開いた通の窓
  let dealt = new Map();    // 今回の配達で、盤面ごとに見分けをつけた紙魚の設計値（id → spec）
  let letterSteps = [];     // 結果画面の1通の動き（飛ばすとき残りをまとめて進める）
  let clipSeq = 0;
  let lastClip = null;
  let flushLetter = () => {}; // 結果の1通の動きを飛ばす
  let hiddenFinish = false; // pagehide で終わらせた配達（bfcache から戻ったとき結果へ移す）
  let sessionToken = 0;     // 画面を離れたあと、古いタイマーを無効にする
  const sfx = name => { try { music?.sfx(name); } catch { /* 音は遊びを止めない */ } };
  const bgm = scene => { try { music?.play(scene); } catch { /* 同上 */ } };

  const $ = selector => view.querySelector(selector);

  try {
    onUpdateReady(() => { updateReady = true; if (onMap && words) showMap(); });
  } catch { /* 更新の通知がなくても遊べる */ }

  function closeLib() {
    const handle = lib;
    lib = null;
    try { handle?.close(); } catch { /* 閉じ損ねても画面は移る */ }
  }

  function stopSession() {
    presentationClose?.();
    presentationClose = null;
    closeLib();
    try { zoomClose?.(); } catch { /* 閉じ損ねても画面は移る */ }
    zoomClose = null;
    popEl?.remove();
    popEl = null;
    letterSteps = [];
    hiddenFinish = false;
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

  // 配達中・結果の紙魚の設計値。同じ盤面で見分けがつくよう、インクを振り直したものがあればそれを使う。
  const specFor = word => dealt.get(word.id) ?? specOf(word);

  const faceCache = new Map();
  function faceOf(id, state = 'print') {
    const word = byId.get(id);
    const key = `${id}:${state}`;
    if (!faceCache.has(key)) faceCache.set(key, charaSvg(specOf(word), {state, ward: word.ch}));
    return faceCache.get(key);
  }

  // ---------- 物語の紙 ----------

  // その街灯の通。英文が無い・壊れているときは null（英文なしで遊べる）。
  function letterAt(shelf, prog = progress, today = todayNumber()) {
    if (!story.letters.length) return null;
    try { return letterView(story, words, prog, shelf, today); } catch { return null; }
  }

  const lampOf = (map, shelf) => map.wards.flatMap(w => w.lamps).find(l => l.shelf === shelf);

  // 今の石段の行（地図でツムギの頭上に出す）。
  function hereLine(map) {
    if (!map.here) return null;
    const letter = letterAt(map.here.shelf);
    const lamp = lampOf(map, map.here.shelf);
    const ids = lamp?.steps[map.here.step - 1]?.ids;
    const index = letter && ids ? letter.lines.findIndex(line => line.ids.includes(ids[0])) : -1;
    return index < 0 ? null : {html: lineBody(letter.lines[index], {})};
  }

  // 語を押したとき：切手の拡大に、その語を含む行を添える。
  function zoomWord(host, letter, id, prog, onClose) {
    const word = byId.get(id);
    if (!word) return () => {};
    return showStampZoom(host, {
      word, spec: specFor(word), state: stampState(prog.words[id]), box: prog.words[id]?.box ?? 0,
      base: '', met: true, say: speak, lineHtml: wordLineHtml(letter, id, {face: faceOf}), onClose,
    });
  }

  // 地図で街灯の節を押したとき：その通を開く。下に切手帳のページへの入口。
  function openLetterPop(map, shelf) {
    const letter = letterAt(shelf);
    if (!letter) { openAlbumAt(shelf); return; }
    popEl?.remove();
    const lamp = lampOf(map, shelf);
    const pop = document.createElement('div');
    pop.className = 'gq-pop';
    pop.setAttribute('role', 'dialog');
    pop.setAttribute('aria-modal', 'true');
    pop.innerHTML = `<div class="gq-pop-card">${letterHtml(letter, {face: faceOf, shadowLines: shadowLinesOf(letter), lit: lamp?.lit === lamp?.total})}
      <div class="gq-pop-acts">${fab({icon: 'close', label: 'とじる', caption: false, attrs: 'data-act="close"'})}${fab({icon: 'album', label: '切手帳', attrs: 'data-act="album"'})}</div></div>`;
    const close = () => { pop.remove(); if (popEl === pop) popEl = null; };
    pop.onclick = event => {
      if (view.querySelector('.gq-zoom')) return;
      const act = event.target.closest('[data-act]')?.dataset.act;
      if (act === 'close' || event.target === pop) { close(); return; }
      if (act === 'album') { close(); openAlbumAt(shelf); return; }
      handleLetterClick(event, {onWord: id => {
        const closeZoom = zoomWord(view, letter, id, progress, () => { if (zoomClose === closeZoom) zoomClose = null; });
        zoomClose = closeZoom;
      }});
    };
    view.append(pop);
    popEl = pop;
    pop.querySelector('[data-act="close"]').focus({preventScroll: true});
  }

  // ---------- 地図 ----------

  function mapNotice(today) {
    if (updateReady) return {text: '新しい版があります　', label: '更新', act: 'update'};
    const collected = Object.values(progress.words).filter(isRestored).length;
    if (collected >= 100 && today - progress.exportDay >= EXPORT_REMIND_DAYS) {
      return {text: '進捗を書き出しておこう　', label: '書き出し', act: 'settings'};
    }
    return null;
  }

  // 切手帳・設定が受け取る材料。戻るボタンは地図へ。
  function libDeps(extra = {}) {
    return {
      words, tags, progress, storage, dev, music, today: todayNumber(), story: story.letters.length ? story : null, scenes,
      back: showMap, speak,
      onProgress: next => { persist(next); },
      ...extra,
    };
  }

  // 切手帳と設定は別の担当のファイル。まだ無い・読めないときは何もしない。
  async function openOptional(load, name, extra) {
    const token = sessionToken;
    try {
      const mod = await load();
      if (token !== sessionToken) return; // 読み込み中に別の画面へ移った
      if (typeof mod?.[name] === 'function') { closeLib(); lib = mod[name](view, libDeps(extra)) ?? null; }
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
      letterOf: shelf => letterAt(shelf, progress, today), hereLine: hereLine(map),
      notice: mapNotice(today),
      warn: saveFailed ? '保存できません。この起動中はプレイできます。' : '',
      on: {
        go: () => startQuest(),
        gate: ch => startQuest({gate: ch}),
        lamp: shelf => openLetterPop(map, shelf),
        album: () => openAlbumAt(map.here?.shelf),
        settings: openSettingsHere,
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
    const ward = gate ?? buildMap(words, progress, today).here?.ch ?? 1;
    questWard = ward;
    stopSession();
    dealt = new Map();
    lastClip = null;
    quest = new Quest(groups, {rand: Math.random, progress, today, save: persist, gate});
    setScreen('guild-quest');
    renderBoard();
  }

  function cellMarkup(letter, index) {
    const delay = (index % COLS) * 8 + Math.floor(index / COLS) * 12;
    return `<button type="button" class="gq-cell" data-cell="${index}" style="--delay:${delay}ms" aria-label="行${Math.floor(index / COLS) + 1}列${index % COLS + 1} ${letter}"><span class="letter">${letter}</span></button>`;
  }

  function topLabel() {
    if (quest.isRevenge) return '再戦';
    return `${quest.index + 1}/${quest.total}${quest.isBig ? ' 大物' : ''}`;
  }

  // 1語＝1体。語を見せない（綴りも頭文字も出さない）。額面（文字数）だけ出す。
  function monMarkup(slot) {
    const spec = specFor(slot.word);
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
    // 同じ盤面の紙魚は、インクか模様が重ならないようにする（種族と区が同じなら、インクを分ける）。
    const dealtSpecs = separateSpecs(quest.slots.map(slot => specOf(slot.word)), quest.slots.map(slot => slot.word.ch));
    quest.slots.forEach((slot, i) => dealt.set(slot.word.id, dealtSpecs[i]));
    strikes = [];
    picking = null;
    message = quest.isBig ? '大物！' : '';
    const coach = tutorial && quest.index === 0
      ? `<div class="gq-coach">${artBox('hatori', 'gq-coach-face')}<b>ハトリ局長</b>${COACH}</div>` : '';
    view.className = `gq gq-quest gq-ch${questWard}${coach ? ' gq-tutor' : ''}`;
    view.innerHTML = `
      <div class="gq-top"><span class="gq-hearts" id="gq-hearts"></span><b id="gq-label"></b><span class="gq-timer" aria-hidden="true"><i id="gq-timer"></i></span><span class="gq-tally" id="gq-tally" role="img"></span><button type="button" class="gq-quit" id="gq-quit" aria-label="やめる"><span aria-hidden="true">✕</span></button></div>
      <div class="gq-story" id="gq-story" hidden aria-hidden="true"></div>
      <div class="gq-arena" id="gq-arena">
        <div class="gq-arena-clip">
          ${artBox(`ward${questWard}`, 'gq-arena-bg')}
          <i class="gq-tint" aria-hidden="true"></i>
          ${artBox('fuurou', 'gq-owl')}
        </div>
        <div class="gq-mons arriving" id="gq-mons">${quest.slots.map(monMarkup).join('')}</div>
        <ul class="gq-clues" id="gq-clues"></ul>
      </div>
      ${coach}
      <div class="gq-input" id="gq-text" aria-live="polite"></div>
      <div class="gq-boardrow">
        <div class="gq-board entering" id="gq-board" aria-label="7列6行の盤面">${quest.letters.map(cellMarkup).join('')}<svg class="gq-seals" id="gq-seals" aria-hidden="true"></svg></div>
      </div>
      <div class="gq-help-actions" aria-label="配達のお手伝い">
        ${helpButton('hint')}
        ${helpButton('teach')}
      </div>`;
    $('#gq-label').textContent = topLabel();
    $('#gq-quit').onclick = quitQuest;
    $('#gq-hint').onclick = () => chooseHelp('hint');
    $('#gq-teach').onclick = () => chooseHelp('teach');
    $('#gq-arena').addEventListener('click', event => {
      const target = event.target.closest('.gq-mon[data-id], .gq-clue[data-id]');
      if (target && picking) pickClue(target.dataset.id);
    });
    bindBoard();
    paintAll();
    if (lastClip) { showClip(lastClip, true); lastClip = null; } // 盤面を取り切った語の行は、次の盤面でも少し残す
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
      $('#gq-mons')?.classList.remove('arriving');
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
        message = 'こうげき！ ♥ −1';
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
    return quest.restoredIds.size;
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
    const big = specFor(word).kind === 'big';
    const main = reveal
      ? `<b class="gq-spell">${esc(word.w)}</b><small>${esc(word.ja)}</small>`
      : `<b>${esc(word.ja)}</b>`;
    const tail = slot.solved
      ? '<span class="gq-check" aria-label="解決済み">✓</span>'
      : `<span class="gq-dots" aria-label="${text.length}文字">${'<i></i>'.repeat(Math.min(text.length, 12))}</span>`;
    const pickable = picking && !slot.solved;
    const classes = ['gq-clue', `pos-${word.pos}`, slot.solved ? 'solved' : '', pickable ? 'pickable' : '']
      .filter(Boolean).join(' ');
    return `<li class="gq-slot${big ? ' big' : ''}"><button type="button" class="${classes}" data-id="${esc(word.id)}" ${pickable ? '' : 'tabindex="-1"'}>
      <span class="gq-clue-top"><span class="gq-pos" aria-hidden="true">${POS_LABEL[word.pos]}</span><span class="gq-clue-main">${main}</span></span>${tail}</button></li>`;
  }

  function paintClues() {
    const list = $('#gq-clues');
    list.innerHTML = quest.slots.map(clueMarkup).join('');
    $('#gq-arena').classList.toggle('picking', Boolean(picking));
    view.querySelectorAll('.gq-mon').forEach(mon => {
      const open = quest.unsolved.some(slot => slot.word.id === mon.dataset.id);
      mon.classList.toggle('pickable', Boolean(picking) && open);
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
    else if (picking) line.textContent = `${picking === 'hint' ? 'ヒント' : 'おしえて'} ▾ 紙魚をタップ`;
    else line.textContent = message || '↑ ↓ ← →';
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
    if (picking && quest?.unsolved.some(slot => slot.word.id === id)) applyHelp(picking, id);
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

  // ヒントなしなら切手になる。ヒント使用時は通常は逃げ、再戦はインクに消える。
  function resolveMon(slot) {
    const mon = monOf(slot.word.id);
    if (!mon) return;
    mon.classList.remove('hinted');
    if (quest.isRevenge && slot.hint > 0) {
      mon.classList.add('solved', 'dissolved');
      if (reducedMotion()) {
        mon.hidden = true;
        return;
      }
      mon.insertAdjacentHTML('beforeend', `<span class="gq-ink-burst" aria-hidden="true">${Array.from({length: 8}, (_, i) => `<i style="--angle:${i * 45}deg"></i>`).join('')}</span>`);
      later(700, () => { mon.hidden = true; });
      return;
    }
    if (slot.hint > 0) {
      mon.classList.add('solved', 'fled');
      return;
    }
    const spec = specFor(slot.word);
    const html = stampHtml(slot.word, spec, {state: 'print', ward: slot.word.ch})
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

  // 正解の一瞬：その語を含む行の一部が出て、霧のかすれに語がインクで戻る（0.8秒）。英文が無い語は何も出さない。
  function showClip(id, keep = false) {
    const band = $('#gq-story');
    const clip = story.letters.length ? clipParts(story, id, 17) : null;
    if (!band || !clip) return;
    const seq = ++clipSeq;
    const still = keep || reducedMotion();
    band.innerHTML = `${esc(clip.left)}<span class="w s-${still ? 'ink' : 'gone'}" style="--a:30%;--b:62%"><span class="t">${esc(clip.word)}</span><i class="fog"></i></span>${esc(clip.right)}`;
    band.classList.remove('out');
    band.hidden = false;
    if (!still) {
      void band.offsetWidth;
      band.querySelector('.w').classList.replace('s-gone', 's-ink');
    }
    later(keep ? 900 : 1900, () => { if (seq === clipSeq) band.classList.add('out'); });
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
    const clean = quest.slots.find(slot => slot.word.id === result.word.id).hint === 0;
    if (clean) showClip(result.word.id);
    if (clean && result.cleared && clipParts(story, result.word.id, 17)) lastClip = result.word.id;
    react();
    paintAll();
    if (result.cleared) defeat();
  }

  // 正解のたびに、フウロウが判を押す。
  function react() {
    const owl = $('.gq-owl');
    swapArt(owl, 'fuurouStamp');
    pulse(owl, 'stamped');
    later(450, () => { swapArt(owl, 'fuurou'); });
  }

  function defeat() {
    $('#gq-board').classList.add('crumbling');
    sfx('crumble');
    later(180, flyStamps);
    later(quest.isRevenge && !reducedMotion() ? 740 : CRUMBLE_MS, () => {
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

  async function paperPresentation(html) {
    const card = showPaperCard(view, html);
    presentationClose = card.close;
    await card.finished;
    if (presentationClose === card.close) presentationClose = null;
  }

  async function presentCinema(method, data, fallback) {
    const token = sessionToken;
    const container = document.createElement('div');
    container.className = 'gq-cinema-host';
    view.append(container);
    const close = () => container.remove();
    presentationClose = close;
    try {
      await playOptionalCinema(method, container, data, async () => {
        container.remove();
        await fallback();
      }, undefined, () => token === sessionToken);
    } finally {
      container.remove();
      if (presentationClose === close) presentationClose = null;
    }
  }

  // 結果の1通：今回、読めるようになった通があればそれ。なければいちばん動いた通（新しい語を重く数える）。
  // 英文のある通だけ。なければ null。
  function pickLetterShelf(outcome, after, startProgress, endProgress, today) {
    const weight = new Map();
    for (const entry of outcome.entries) weight.set(entry.word.shelf, (weight.get(entry.word.shelf) ?? 0) + (entry.isNew ? 3 : 1));
    let pick = null;
    let best = 0;
    for (const [shelf, n] of weight) {
      const end = letterAt(shelf, endProgress, today);
      if (!end) continue;
      const score = n + (end.readable && !letterAt(shelf, startProgress, today)?.readable ? 100 : 0);
      if (score > best) { best = score; pick = shelf; }
    }
    if (pick === null && after.here && letterAt(after.here.shelf)) pick = after.here.shelf;
    return pick;
  }

  // 英文が無い通のときの、今までの結果（ページの 5×5 と道の図）。
  function pageAndRoad(before, after, outcome, changedByShelf, stampsCount, lamps) {
    let shelf = after.here?.shelf;
    let most = 0;
    for (const [s, n] of changedByShelf) if (n > most) { most = n; shelf = s; }
    const lampNow = lamps(after).get(shelf);
    const pageWords = words.filter(w => w.shelf === shelf);
    const changedIds = new Set(outcome.entries.filter(e => e.stamped).map(e => e.word.id));
    const state = (id, source) => stampState(source.words[id]);
    const cells = pageWords.map(word => {
      const st = state(word.id, quest.progress);
      const fresh = changedIds.has(word.id) && state(word.id, quest.startProgress) !== st;
      return `<i class="s-${st}${fresh ? ' fresh' : ''}" style="--w:${word.ch}"></i>`;
    }).join('');
    const nextFaces = after.next.map(id => `<span class="gq-face">${faceOf(id, 'shadow')}</span>`).join('');
    return `<section class="gq-res-sec" style="--d:${0.1 + 0.07 * stampsCount + 0.5}s"><h3><span aria-hidden="true">${icon('album', 16)}</span> ${shelf}　<b>${lampNow?.got ?? 0}/${lampNow?.total ?? 25}</b></h3>
          <div class="gq-page" style="--n:${changedIds.size}" role="img" aria-label="街灯${shelf}のページ ${lampNow?.got ?? 0}/${lampNow?.total ?? 25}">${cells}</div>
        </section>
        <section class="gq-res-sec" style="--d:${0.1 + 0.07 * stampsCount + 1.7}s">
          ${miniRoad(before, after)}
          <div class="gq-next-row">${nextFaces ? `<span class="gq-arrow" aria-label="つぎの石段の紙魚">▸</span><span class="gq-faces">${nextFaces}</span>` : '<span class="gq-top-mark" aria-label="いちばん上">★</span>'}</div>
        </section>`;
  }

  function showResults() {
    if (!quest || !quest.outcome) return;
    const {outcome} = quest;
    const today = quest.today;
    const before = buildMap(words, quest.startProgress, today);
    const after = buildMap(words, quest.progress, today);
    timers.forEach(clearTimeout);
    timers = [];
    letterSteps = [];
    cancelAnimationFrame(frameId);
    frameId = 0;
    try { zoomClose?.(); } catch { /* 閉じ損ねても画面は移る */ }
    zoomClose = null;
    const first = tutorial;
    tutorial = false;
    const lamps = map => new Map(map.wards.flatMap(w => w.lamps).map(l => [l.shelf, l]));
    const litNow = [...lamps(after)].filter(([shelf, l]) => l.lit === l.total && lamps(before).get(shelf).lit < l.total).map(([shelf]) => shelf);
    if (litNow.length) sfx('lamp');
    bgm('post');

    // 切手：新しく入った／上がった／逃げた（影のまま）
    const state = (id, source) => stampState(source.words[id]);
    const changedByShelf = new Map();
    const zoomInfo = [];
    const stamps = outcome.entries.map((entry, i) => {
      const fled = !entry.stamped;
      const was = state(entry.word.id, quest.startProgress);
      const now = fled ? 'shadow' : state(entry.word.id, quest.progress);
      let mark = '';
      if (!fled) {
        if (entry.isNew) mark = '<span class="mk new">新</span>';
        else if (was !== now) mark = now === 'gold' ? '<span class="mk gold">金</span>' : '<span class="mk up">↑</span>';
        if (mark) changedByShelf.set(entry.word.shelf, (changedByShelf.get(entry.word.shelf) ?? 0) + 1);
      }
      zoomInfo[i] = {word: entry.word, state: now, box: quest.progress.words[entry.word.id]?.box ?? 0};
      const html = stampHtml(entry.word, specFor(entry.word), {state: now, ward: entry.word.ch});
      return `<li class="gq-stamp-cell${fled ? ' fled' : ''}${entry.big ? ' wide' : ''}" style="--i:${i}" data-i="${i}">${html}${mark}${fled ? '<small class="again" aria-hidden="true">↺</small>' : ''}</li>`;
    });

    // 今の1通。逃げた語は、配達の前の状態のまま（新しい語なら霧のまま）で、紙魚の顔が乗る。
    const fledIds = new Set(outcome.entries.filter(e => !e.stamped).map(e => e.word.id));
    const endProgress = quest.progress;
    const shelf = pickLetterShelf(outcome, after, quest.startProgress, endProgress, today);
    const lvStart = shelf === null ? null : letterAt(shelf, quest.startProgress, today);
    const lvEnd = shelf === null ? null : letterAt(shelf, endProgress, today);
    const lampNow = shelf === null ? null : lamps(after).get(shelf);
    const litLetter = lampNow ? lampNow.lit === lampNow.total : false;
    const newlyRead = Boolean(lvStart && lvEnd && lvEnd.readable && !lvStart.readable);
    const nextLetter = newlyRead ? letterAt(shelf + 1, endProgress, today) : null;
    const paperOpts = lv => ({face: faceOf, shadowLines: shadowLinesOf(lv), lit: litLetter});

    const gateOpened = newlyOpenedGate(quest.startProgress, quest.progress, quest.gate);
    const openedWard = quest.gate;
    const resultProgress = quest.progress;
    const showGate = () => gateOpened ? presentCinema('playGateCard', gateCard(story, resultProgress.gates, openedWard),
      () => paperPresentation(blankCardHtml(story, resultProgress.gates))) : Promise.resolve();
    const nextGate = after.wards.find(w => w.gate === 'open');
    const gateNext = !after.fog && nextGate;
    const primary = after.fog ? '霧を<br>払う' : nextGate ? `${nextGate.ch}区の<br>門へ` : 'つぎの<br>石段へ';
    const daily = quest.progress.daily;
    const brief = dailyBrief(daily);
    const tomorrow = after.tomorrow;
    const tomorrowFaces = tomorrow.slice(0, 3).map(id => `<span class="gq-face s">${faceOf(id)}</span>`).join('');
    const stampDelay = lvEnd ? 0.35 : 0.1;

    view.className = 'gq gq-result';
    view.innerHTML = `
      <div class="gq-result-head">${artBox(outcome.retreated ? 'tsumugi' : 'tsumugiJoy')}<h2 class="gq-title">${outcome.retreated ? 'おつかれさま' : '配達完了！'}</h2>${artBox(outcome.retreated ? 'fuurou' : 'fuurouStamp', 'art-owl')}</div>
      <div class="gq-res-scroll" id="gq-res">
        ${lvStart ? `<section class="gq-res-sec gq-letter-sec" style="--d:.05s">
          <div id="gq-paper">${letterHtml(lvStart, paperOpts(lvStart))}</div>
          <div id="gq-env-sec" hidden></div>
        </section>` : ''}
        <section class="gq-res-sec" style="--d:${stampDelay}s">
          <ul class="gq-stamps${lvStart ? ' mini' : ''}" aria-label="今回の切手">${stamps.join('') || '<li class="empty" aria-label="答えた語はありません">－</li>'}</ul>
        </section>
        ${lvStart ? '' : pageAndRoad(before, after, outcome, changedByShelf, stamps.length, lamps)}
        <section class="gq-res-sec gq-res-last" style="--d:${lvStart ? 0.6 : 0.1 + 0.07 * stamps.length + 2.6}s">
          ${litNow.length ? `<p class="gq-lit" aria-label="街灯${litNow.join('・')}がともった">✦ ${litNow.join('・')}</p>` : ''}
          ${gateOpened ? `<p class="gq-lit" aria-label="${quest.gate}区の門が開いた"><span aria-hidden="true">${icon('gate', 16)}</span> ${quest.gate}区</p>` : ''}
          <div class="gq-chips">
            ${outcome.dailyDone ? '<span class="gq-daily done"><i aria-hidden="true">✓</i>速達</span>' : brief && !daily.done ? `<span class="gq-daily" aria-label="今日の速達 ${brief.count}/${brief.goal}"><i aria-hidden="true">${brief.mark}</i>${esc(brief.name)}<b>${brief.count}/${brief.goal}</b></span>` : daily ? '<span class="gq-daily done"><i aria-hidden="true">✓</i>速達</span>' : ''}
            ${outcome.streakUp ? `<span class="gq-daily"><b>${outcome.streak}</b>日連続</span>` : ''}
            ${tomorrow.length ? `<span class="gq-tomorrow" aria-label="明日戻ってくる紙魚 ${tomorrow.length} 匹"><small>明日</small><span class="gq-faces">${tomorrowFaces}</span><b>${tomorrow.length}</b></span>` : ''}
          </div>
          ${saveFailed ? '<p class="gq-warn">保存できません。この起動中はプレイできます。</p>' : ''}
          <details class="gq-detail"><summary>語の一覧</summary><ul class="gq-results" aria-label="今回の語">${outcome.entries.map(resultRow).join('')}</ul></details>
        </section>
      </div>
      <div class="gq-dock gq-result-dock">
        ${fab({icon: 'home', label: 'トップへ', attrs: 'id="gq-guild"'})}
        ${waxButton({label: primary, id: 'gq-again'})}
        ${fab({icon: 'album', label: '切手帳', attrs: 'id="gq-album"'})}
        ${nextGate && !gateNext ? fab({icon: 'gate', label: `${nextGate.ch}区の門`, cls: 'glow', attrs: 'id="gq-gate"'}) : ''}
      </div>`;
    $('#gq-again').onclick = () => (after.fog || !nextGate ? startQuest() : startQuest({gate: nextGate.ch}));
    $('#gq-guild').onclick = showMap;
    $('#gq-album').onclick = () => openAlbumAt(lvEnd ? shelf : after.here?.shelf);
    if ($('#gq-gate')) $('#gq-gate').onclick = () => startQuest({gate: nextGate.ch});

    const res = $('#gq-res');
    const openZoom = info => {
      if (view.querySelector('.gq-zoom')) return;
      // 切手帳と同じ拡大表示。逃げた語（影のまま）も、語と訳は見せる。
      zoomClose = showStampZoom(view, {
        word: info.word, spec: specFor(info.word), state: info.state, box: info.box,
        base: '', met: true, say: speak, lineHtml: info.lineHtml ?? '', onClose: () => { zoomClose = null; },
      });
    };

    if (lvStart) playLetter({lvStart, lvEnd, endProgress, fledIds, newlyRead, nextLetter, shelf, paperOpts, onComplete: showGate});
    else void showGate();

    res.addEventListener('click', event => {
      if (letterSteps.length) { flushLetter(); return; } // 動きの最中の押しは、飛ばすだけ
      res.classList.add('skip');
      if (event.target.closest('.paper')) {
        handleLetterClick(event, {onWord: id => {
          const word = byId.get(id);
          if (word) openZoom({word, state: state(id, endProgress), box: endProgress.words[id]?.box ?? 0,
            lineHtml: wordLineHtml(lvEnd, id, {face: faceOf})});
        }});
        return;
      }
      const cell = event.target.closest('.gq-stamp-cell');
      if (!cell) return;
      const info = zoomInfo[Number(cell.dataset.i)];
      if (info) openZoom({...info, lineHtml: lvEnd ? wordLineHtml(lvEnd, info.word.id, {face: faceOf}) : ''});
    });
    $(first ? '#gq-guild' : '#gq-again').focus({preventScroll: true});
  }

  // 結果の1通：戻った語が1語ずつ濃くなる。読めた通は封筒になり、次の通の封筒が見える。
  // 押すか、動きを減らす設定のときは、残りをまとめて進める。
  function playLetter({lvStart, lvEnd, endProgress, fledIds, newlyRead, nextLetter, shelf, paperOpts, onComplete}) {
    const paper = $('#gq-paper');
    const changes = [];
    lvEnd.lines.forEach((line, li) => line.parts.forEach((part, wi) => {
      if (part.type !== 'word') return;
      const was = lvStart.lines[li].parts[wi].state;
      if (was !== part.state) changes.push({id: part.id, li, was, now: part.state});
    }));
    const faceFor = id => `<b class="face">${faceOf(id, 'print')}</b>`;
    const settle = () => { // 最後の姿に描き直す（読めた行の訳・読みあげのボタンも出る）。逃げた語は紙魚の顔つき。
      paper.innerHTML = letterHtml(lvEnd, paperOpts(lvEnd));
      for (const id of fledIds) {
        const el = paper.querySelector(`.w[data-id="${id}"]`);
        if (el && el.classList.contains('s-gone')) el.insertAdjacentHTML('beforeend', faceFor(id));
      }
    };
    const steps = changes.map(change => () => {
      const el = paper.querySelector(`.w[data-id="${change.id}"]`);
      if (!el) return;
      el.querySelectorAll('.sh,.bug').forEach(b => { b.classList.add('pop'); setTimeout(() => b.remove(), 600); });
      el.classList.replace(`s-${change.was}`, `s-${change.now}`);
      const row = el.closest('.ln-wrap');
      const line = lvEnd.lines[change.li];
      const done = [...row.querySelectorAll('.w')].every(w => !w.classList.contains('s-gone'));
      row.classList.toggle('read', done && line.readable);
      const read = [...paper.querySelectorAll('.ln-wrap')].filter(r => r.querySelectorAll('.w.s-gone').length === 0).length;
      const ring = paper.querySelector('.ring');
      if (ring) ring.innerHTML = lampRing(read, false);
    });
    steps.push(settle);
    const env = $('#gq-env-sec');
    if (newlyRead) {
      steps.push(() => {
        const token = sessionToken;
        const scene = sceneFor(scenes, shelf);
        void presentCinema('playLetterComplete', {
          letter: lvEnd, scene, ward: byId.get(lvEnd.lines[0]?.ids[0])?.ch ?? 1, base: '',
        }, async () => {
          const furo = artFile('fuurouStamp');
          env.hidden = false;
          env.innerHTML = `${envelopeScene(furo)}${nextLetter ? `<div class="gq-next-env"><svg viewBox="0 0 54 36" aria-hidden="true"><rect x="2" y="3" width="50" height="30" rx="3" fill="var(--paper-2)" stroke="var(--ink)" stroke-width="2"/><path d="M3 5l24 17L51 5" fill="none" stroke="var(--ink)" stroke-width="2"/></svg><span>${esc(nextLetter.from ?? '')} → ${esc(nextLetter.to ?? '')}</span></div>` : ''}`;
          const envelope = env.querySelector('.gq-env');
          const stages = [[100, 's1'], [1000, 's2'], [1500, 's3'], [2200, 'f-on'], [2550, 's4'], [2900, 'f-off'], [3500, 's5']];
          if (reducedMotion()) envelope.classList.add('s1', 's2', 's3', 's4', 's5');
          else stages.forEach(([ms, cls]) => later(ms, () => envelope.classList.add(cls)));
          sfx('lamp');
          env.scrollIntoView({block: 'center', behavior: reducedMotion() ? 'auto' : 'smooth'});
          await new Promise(resolve => setTimeout(resolve, reducedMotion() ? 0 : 4400));
          if (token === sessionToken && scene) await paperPresentation(sceneCardHtml(scene));
        }).then(() => { if (token === sessionToken) return onComplete?.(); });
      });
    } else steps.push(() => { void onComplete?.(); });

    letterSteps = steps.map(run => ({run, done: false}));
    const exec = step => { if (!step.done) { step.done = true; step.run(); } };
    flushLetter = () => {
      const pending = letterSteps;
      letterSteps = [];
      pending.forEach(exec);
    };
    const finish = () => { letterSteps = letterSteps.filter(step => !step.done); };
    if (reducedMotion() || changes.length === 0) {
      // 動かす語がない（または動きを減らす）ときは、すぐ最後の姿にする。封筒は動かさず見せる。
      flushLetter();
      return;
    }
    letterSteps.forEach((step, i) => {
      const at = 700 + (i < changes.length ? i * 230 : changes.length * 230 + 500 + (i - changes.length - 1) * 600);
      later(at, () => { exec(step); finish(); });
    });
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
      if (!storyLoaded) {
        storyLoaded = true;
        scenes = await loadScenes();
        // 英文が無い・壊れているときは、英文なしで遊ぶ。一部の街灯だけでもよい。
        try {
          const response = await fetch(STORY_URL);
          const data = response.ok ? await response.json() : null;
          if (Array.isArray(data?.letters)) story = {v: 1, letters: data.letters.filter(l => Array.isArray(l?.lines)), blank: data.blank ?? []};
        } catch { /* 英文なしで続ける */ }
      }
      ensureDefs(charaDefs());
      ensureAlbumCss();
      await Promise.all([loadStyle(MAP_CSS), ensureLetterCss()]);
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
    if (quest && quest.phase === 'battle' && quest.results.size > 0) { quest.finish(true); hiddenFinish = true; }
  });

  // 戻る（bfcache）で復元されたとき、pagehide が終わらせた配達は結果へ移す。
  window.addEventListener('pageshow', event => {
    if (!event.persisted || !hiddenFinish) return;
    hiddenFinish = false;
    if (quest && quest.phase === 'finished') showResults();
  });

  return {open, hasProgress: () => progress.quests > 0 || Object.keys(progress.words).length > 0};
}

function stampState(state) { return isRestored(state) ? rawStampState(state) : 'shadow'; }
