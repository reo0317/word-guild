import {isRestored} from './srs.mjs';
// 切手帳（旧・ことば帳）。1ページ＝街灯1本＝25枚。開いたページだけを描く。
//
// openAlbum(container, deps) → {close()}
//
// deps（すべて省略できる。無い項目は下の既定で補う）：
//   words     語の配列（words.json）。無ければ data/words.json を読む
//   progress  進捗（{words:{id:{box,due,...}}, gates:[…]}）。無ければ空の進捗
//   tags      分類 {id: 'mind', …}。無ければ data/chara.json を読む（読めなくても動く）
//   today     日番号（今は使わない）
//   back()    戻るボタンで呼ぶ。無ければ戻るボタンを出さない
//   speak(text) 発音。無ければ dom.mjs の speak
//   story     物語の英文（data/story.json）。無ければ読みにいき、読めなければ通なしで開く
//   shelf     最初に開く街灯の番号（1〜56）。無ければ「今いるページ」（最初の未完のページ）
//   base      絵の置き場の前置き。無ければ このファイルから見た products/word-guild/
//   music, storage は使わない
// 画面は container.innerHTML に描く。album.css は <link> で一度だけ読み込む。
import {stampState as rawStampState, pageSpecs, charaSpec} from './chara.mjs';
import {charaDefs, charaSvg, stampHtml} from './chara-svg.mjs';
import {letterView, loadScenes} from './story.mjs';
import {CHAPTER_NAMES} from './chapters.mjs';
import {emptyProgress} from './store.mjs';
import {esc, speak as defaultSpeak, starsMarkup, fab, icon, ensureDefs, ensureLetterCss, letterHtml, shadowLinesOf, wordLineHtml, handleLetterClick} from './dom.mjs';
import {todayNumber} from './srs.mjs';

const POS = {v: '動詞', n: '名詞', a: '形容詞', o: 'その他'};
const STATE_NAME = {shadow: '影', proof: '仮刷り', print: '本刷り', gold: '金ぶち'};

// ---------- DOM を使わない部分（tests/guild-album.test.mjs が検査する） ----------

// 語を街灯の番号ごとに分けて、ページの配列にする（番号の小さい順）。
// 街灯の表示名（宛先の名前、data/stage-names.json）。無ければ番号。
let stageNames = {};
const stageName = shelf => stageNames[shelf] ?? `街灯 ${shelf}`;

export function albumPages(words) {
  const byShelf = new Map();
  for (const word of words) {
    if (!byShelf.has(word.shelf)) byShelf.set(word.shelf, {shelf: word.shelf, ch: word.ch, words: []});
    byShelf.get(word.shelf).words.push(word);
  }
  return [...byShelf.values()].sort((a, b) => a.shelf - b.shelf);
}

// ページの進み具合。got＝仮刷り以上の枚数、lit＝本刷り以上、gold＝金ぶち。
export function pageProgress(page, progress) {
  const total = page.words.length;
  let got = 0, lit = 0, gold = 0;
  for (const word of page.words) {
    const state = stampState(progress.words?.[word.id]);
    if (state !== 'shadow') got++;
    if (state === 'print' || state === 'gold') lit++;
    if (state === 'gold') gold++;
  }
  return {total, got, lit, gold, complete: lit === total, allGold: gold === total};
}

// 区ごとにページを束ねる（目次用）。
export function wardGroups(pages) {
  const groups = [];
  for (const page of pages) {
    let group = groups.at(-1);
    if (!group || group.ch !== page.ch) {
      group = {ch: page.ch, name: CHAPTER_NAMES[page.ch - 1] ?? `${page.ch}区`, pages: []};
      groups.push(group);
    }
    group.pages.push(page);
  }
  return groups;
}

// 最初に開くページの位置：指定の街灯、なければ最初の未完のページ（全部完なら最後）。
export function startIndex(pages, progress, shelf) {
  const given = pages.findIndex(page => page.shelf === shelf);
  if (given >= 0) return given;
  const open = pages.findIndex(page => !pageProgress(page, progress).complete);
  return open >= 0 ? open : Math.max(0, pages.length - 1);
}

export const clampIndex = (index, length) => Math.min(Math.max(0, index), Math.max(0, length - 1));

// 任意データの探索と演出の切り替えは DOM なしでも確認する。
export function sceneFor(scenes, shelf) {
  return scenes?.scenes?.find(scene => scene?.shelf === shelf &&
    typeof scene.title === 'string' && Array.isArray(scene.lines) &&
    scene.lines.every(line => typeof line === 'string')) ?? null;
}

export function gateCard(story, gates = [], newWard) {
  const lines = (story?.blank ?? []).filter(line => gates.includes(line.ch));
  return {lines, newIndex: lines.findIndex(line => line.ch === newWard)};
}

export function newlyOpenedGate(before, after, ward) {
  return Number.isInteger(ward) && !(before.gates ?? []).includes(ward) && (after.gates ?? []).includes(ward);
}

export async function playOptionalCinema(method, container, data, fallback,
  loader = () => import('./cinema.mjs').catch(() => null), active = () => true) {
  try {
    const cinema = await loader();
    if (!active()) return;
    if (typeof cinema?.[method] === 'function') {
      await cinema[method](container, data);
      return;
    }
  } catch { /* 読み込み・再生の失敗時も紙で読める */ }
  if (active()) await fallback();
}

export function sceneCardHtml(scene) {
  return scene ? `<h2>${esc(scene.title)}</h2>${scene.lines.map(line => `<p>${esc(line)}</p>`).join('')}` : '';
}

export function blankCardHtml(story, gates = []) {
  const byWard = new Map((story?.blank ?? []).map(line => [line.ch, line]));
  return `<h2>白紙卿</h2>${Array.from({length: 6}, (_, i) => {
    const line = byWard.get(i + 1);
    return line && gates.includes(i + 1)
      ? `<p lang="en">${esc(line.en)}<small lang="ja">${esc(line.ja)}</small></p>`
      : '<p class="gq-card-mist" aria-label="霧に隠れた行"><span aria-hidden="true">──────────</span></p>';
  }).join('')}`;
}

// 追伸の語は発音、余白は訳。元データの波括弧は刷り上がりに残さない。
export function postscriptHtml(ps) {
  if (!ps) return '';
  const text = ps.en.replace(/[{}]/g, '');
  const line = text.split(/([A-Za-z]+(?:['’-][A-Za-z]+)*)/).map((part, i) => i % 2
    ? `<button type="button" data-ps-say="${esc(part)}">${esc(part)}</button>` : esc(part)).join('');
  return `<div class="gq-postscript"><small>P.S.</small><p lang="en" data-ps-line tabindex="0" role="button" aria-label="追伸の訳を読む">${line}</p><p class="gq-ps-ja" lang="ja" hidden>${esc(ps.ja)}</p></div>`;
}

export function handlePostscriptClick(event, say = defaultSpeak) {
  const ps = event.target.closest('.gq-postscript');
  if (!ps) return false;
  const word = event.target.closest('[data-ps-say]');
  if (word) say(word.dataset.psSay);
  else { const ja = ps.querySelector('.gq-ps-ja'); ja.hidden = !ja.hidden; }
  return true;
}

export function showPaperCard(host, html) {
  ensureLetterCss();
  const previous = document.activeElement;
  const overlay = document.createElement('div');
  overlay.className = 'gq-story-overlay';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-label', '物語');
  overlay.innerHTML = `<article class="gq-story-card">${html}<button type="button" class="gq-round" aria-label="とじる">×</button></article>`;
  let resolve;
  const finished = new Promise(done => { resolve = done; });
  const close = () => {
    overlay.remove();
    document.removeEventListener('keydown', onKey);
    if (previous?.isConnected) previous.focus({preventScroll: true});
    resolve();
  };
  const onKey = event => { if (event.key === 'Escape') close(); };
  overlay.onclick = event => { event.stopPropagation(); close(); };
  document.addEventListener('keydown', onKey);
  host.append(overlay);
  overlay.querySelector('button').focus({preventScroll: true});
  return {close, finished};
}

// ---------- 画面 ----------
const BASE = new URL('../', import.meta.url).href;
const CSS_URL = new URL('../album.css', import.meta.url).href;

export function ensureCss() {
  if (typeof document === 'undefined' || document.getElementById('gq-album-css')) return;
  const link = document.createElement('link');
  link.id = 'gq-album-css';
  link.rel = 'stylesheet';
  link.href = CSS_URL;
  document.head.append(link);
  ensureLetterCss();
}

const PM = '<svg class="pm" viewBox="0 0 60 60" aria-hidden="true"><g fill="none" stroke="#1f2340" stroke-width="2.4"><circle cx="30" cy="30" r="25"/><circle cx="30" cy="30" r="19"/><path d="M5 22q8-5 16 0t16 0 16 0M5 31q8-5 16 0t16 0 16 0M5 40q8-5 16 0t16 0 16 0"/></g></svg>';

// 区の記念切手（門を開けた区だけ色つき。大判）。
function memorialHtml(ch, cleared, base) {
  const name = CHAPTER_NAMES[ch - 1] ?? `${ch}区`;
  const cls = `stamp big memorial ${cleared ? 's-gold' : 's-shadow'}`;
  const pic = cleared ? `<img src="${esc(base)}art/ward-${ch}.webp" alt="" loading="lazy">` : '';
  return `<div class="${cls}" data-gate="${ch}"><div class="in"><span class="val">${ch}</span><div class="pic">${pic}</div>
    <div class="lbl">${cleared ? `${ch}区 ${esc(name)} 記念` : '門はまだ'}</div></div>${cleared ? PM : ''}</div>`;
}

function stampWithMark(word, spec, state, base, size) {
  let html = stampHtml(word, spec, {state, ward: word.ch, base, size});
  if (size === 'sm' && spec.kind !== 'big' && word.w.length > 9) html = html.replace('class="stamp ', 'class="stamp long ');
  return state === 'gold' ? html.replace(/<\/div><\/button>$/, `${PM}</div></button>`) : html;
}

// 切手の拡大表示（切手帳と結果画面で共通）。host の中に重ねて出し、閉じる関数を返す。
// opts: {word, spec, state, box, base, say, met（影でも語を見せるとき true）, lineHtml（その語を含む行。無ければ出さない）, onClose}
export function showStampZoom(host, {word, spec, state, box = 0, base = BASE, say = defaultSpeak, met = state !== 'shadow', lineHtml = '', onClose}) {
  ensureCss();
  // 画面内に同じ ID の defs を置くと、閉じた後も Safari が削除済み定義を参照する。
  ensureDefs(charaDefs(base));
  const ex = met && word.ex ? `<p class="gq-ex">${esc(word.ex)}<small>${esc(word.exJa ?? '')}</small></p>` : '';
  const overlay = document.createElement('div');
  overlay.className = 'gq-zoom';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.innerHTML = `<div class="gq-zoom-card">
    <div class="gq-zoom-stamp">${stampWithMark(word, spec, state, base, 'lg')}</div>
    <p class="gq-zoom-state">${STATE_NAME[state]}</p>
    ${met ? `<h2>${esc(word.w)}</h2><p class="gq-zoom-ja">${esc(word.ja)}　<small>${POS[word.pos] ?? ''}</small></p>
      <p class="gq-stars" aria-label="習熟度 ${box}">${starsMarkup(box)}</p>${ex}${lineHtml}`
      : '<h2>？</h2>'}
    <div class="gq-zoom-actions">${met ? fab({icon: 'speaker', label: '発音', caption: false, attrs: 'data-act="say"'}) : ''}${fab({icon: 'close', label: 'とじる', caption: false, attrs: 'data-act="close"'})}</div></div>`;
  let open = true;
  const close = () => {
    if (!open) return;
    open = false;
    overlay.remove();
    document.removeEventListener('keydown', onKey);
    onClose?.();
  };
  const onKey = event => { if (event.key === 'Escape') close(); };
  document.addEventListener('keydown', onKey);
  overlay.onclick = event => {
    if (event.target.closest('.paper') && handleLetterClick(event, {say})) return;
    const act = event.target.closest('[data-act]')?.dataset.act;
    if (act === 'say') say(word.w);
    else if (act === 'close' || event.target === overlay) close();
  };
  host.append(overlay);
  if (met) say(word.w); // 利用者のタップの処理の中で呼ぶ（Safari の自動再生の制限）
  overlay.querySelector('[data-act="close"]').focus({preventScroll: true});
  return close;
}

async function load(deps) {
  const words = deps.words ?? await (await fetch(new URL('data/words.json', BASE))).json();
  let tags = deps.tags;
  if (!tags) {
    try { tags = await (await fetch(new URL('data/chara.json', BASE))).json(); } catch { tags = {}; }
  }
  try { stageNames = await (await fetch(new URL('data/stage-names.json', BASE))).json(); } catch { stageNames = {}; }
  let story = deps.story;
  if (story === undefined) {
    try {
      const response = await fetch(new URL('data/story.json', BASE));
      story = response.ok ? await response.json() : null;
    } catch { story = null; }
  }
  const optional = async name => {
    try { const response = await fetch(new URL(`data/${name}.json`, BASE)); return response.ok ? await response.json() : []; }
    catch { return []; }
  };
  const [rares, postscript] = await Promise.all([deps.rares ?? optional('rare'), deps.postscript ?? optional('story-ps')]);
  const scenes = deps.scenes === undefined ? await loadScenes() : deps.scenes;
  return {words, tags, scenes, rares, postscript, story: Array.isArray(story?.letters) ? story : null};
}

export function openAlbum(container, deps = {}) {
  ensureCss();
  // 画面内に同じ ID の defs を置くと、閉じた後も Safari が削除済み定義を参照する。
  ensureDefs(charaDefs(deps.base ?? BASE));
  let closed = false;
  const cleanups = [];
  const handle = {close() {
    if (closed) return;
    closed = true;
    container.onclick = null; // 画面を離れたあと、古い処理が別の画面を拾わない
    cleanups.splice(0).forEach(fn => fn());
    container.innerHTML = '';
  }};
  container.className = 'gq gq-album';
  container.innerHTML = '<p class="gq-loading">切手帳をひらいています…</p>';
  load(deps).then(({words, tags, story, scenes, rares, postscript}) => { if (!closed) start(words, tags, story, scenes, rares, postscript); }, () => {
    if (closed) return;
    container.innerHTML = '<p class="gq-warn">切手帳を読み込めません。</p>';
    addBack();
  });
  return handle;

  function addBack() {
    if (!deps.back) return;
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'text-button';
    button.textContent = '← トップへ';
    button.onclick = () => deps.back();
    container.append(button);
  }

  function start(words, tags, story, scenes, rares, postscript) {
    const progress = deps.progress ?? emptyProgress();
    const say = deps.speak ?? defaultSpeak;
    const base = deps.base ?? BASE;
    const pages = albumPages(words);
    const groups = wardGroups(pages);
    const specCache = new Map();
    const specsOf = page => {
      if (!specCache.has(page.shelf)) specCache.set(page.shelf, pageSpecs(page.words, page.words.map(w => tags[w.id] ?? '')));
      return specCache.get(page.shelf);
    };
    const today = deps.today ?? todayNumber();
    // その街灯の通（英文が無ければ null）。壊れた英文があっても切手帳は開く。
    const letterOf = shelf => { try { return story ? letterView(story, words, progress, shelf, today) : null; } catch { return null; } };
    const gates = progress.gates ?? [];
    const collected = words.filter(w => stampState(progress.words?.[w.id]) !== 'shadow').length;
    let index = startIndex(pages, progress, deps.shelf);
    let nightIndex = 0;
    const nightGroups = wardGroups(albumPages(rares));
    let view = 'page'; // 'page' | 'index'

    const backButton = deps.back ? '<button class="text-button gq-album-back" data-act="back" type="button">← トップへ</button>' : '';

    function renderPage() {
      view = 'page';
      const page = pages[index];
      const specs = specsOf(page);
      const pp = pageProgress(page, progress);
      const first = pages.findIndex(p => p.ch === page.ch) === index;
      const wardName = CHAPTER_NAMES[page.ch - 1] ?? `${page.ch}区`;
      const stamps = page.words.map((word, i) => stampWithMark(word, specs[i], stampState(progress.words?.[word.id]), base, 'sm')).join('');
      const letter = letterOf(page.shelf);
      const face = (id, state) => {
        const at = page.words.findIndex(w => w.id === id);
        return at < 0 ? '' : charaSvg(specs[at], {state, ward: page.ch, base});
      };
      const paper = letter ? `<div class="gq-album-letter">${letterHtml(letter, {face, shadowLines: shadowLinesOf(letter), lit: pp.complete})}</div>` : '';
      const seal = pp.allGold ? '<span class="gq-seal gold">完・金</span>' : pp.complete ? '<span class="gq-seal">完</span>' : '';
      container.innerHTML = `
        <div class="gq-album-top">${backButton}<span class="gq-album-total">集めた切手 <b>${collected}</b>/${words.length}</span><button class="text-button" data-act="index" type="button">目次</button></div>
        <div class="gq-album-nav">
          <button type="button" class="gq-round" data-act="prev" aria-label="前のページ" ${index === 0 ? 'disabled' : ''}>${icon('prev')}</button>
          <div class="gq-album-title"><small>${page.ch}区 ${esc(wardName)}</small><b>${esc(stageName(page.shelf))}</b><span>${index + 1} / ${pages.length}</span></div>
          <button type="button" class="gq-round" data-act="next" aria-label="次のページ" >${icon('next')}</button>
        </div>
        <div class="gq-album-body ${pp.allGold ? 'gold-page' : pp.complete ? 'lit-page' : ''}">
          ${first ? `<div class="gq-album-gate">${memorialHtml(page.ch, gates.includes(page.ch), base)}</div>` : ''}
          ${paper}${psOf(page.shelf)}
          ${letter?.readable && sceneFor(scenes, page.shelf) ? '<button type="button" class="gq-scene-tag" data-act="scene">場面</button>' : ''}
          <p class="gq-page-count"><b>${pp.got}/${pp.total}</b> ${seal}</p>
          <div class="gq-sheet">${stamps}</div>
        </div>`;
      const body = container.querySelector('.gq-album-body');
      if (body) body.scrollTop = 0;
    }

    function renderIndex() {
      view = 'index';
      const cells = group => group.pages.map(page => {
        const pp = pageProgress(page, progress);
        return `<button type="button" class="gq-lampcell ${pp.allGold ? 'gold' : pp.complete ? 'lit' : ''}" data-shelf="${page.shelf}">
          <b>${page.shelf}</b><span>${pp.got}/${pp.total}</span></button>`;
      }).join('');
      container.innerHTML = `
        <div class="gq-album-top">${backButton}<span class="gq-album-total">集めた切手 <b>${collected}</b>/${words.length}</span><button class="text-button" data-act="page" type="button">ページへ</button></div>
        <p class="eyebrow">切手帳の目次</p>
        <div class="gq-album-body"><article class="gq-story-card gq-card-door">${blankCardHtml(story, gates)}</article>${groups.map(group => `<section class="gq-ward">
          <h3>${group.ch}区 ${esc(group.name)}<small>記念切手 ${gates.includes(group.ch) ? '済' : '未'}</small></h3>
          <div class="gq-ward-gate">${memorialHtml(group.ch, gates.includes(group.ch), base)}</div>
          <div class="gq-lampgrid">${cells(group)}</div></section>`).join('')}<button type="button" class="gq-night-book" data-act="night" aria-label="夜の切手帳"><span aria-hidden="true">☾ ✦</span><b>夜の<br>切手帳</b></button></div>`;
    }

    function psOf(shelf) {
      const set = rares.filter(w => w.shelf === shelf);
      return set.length === 5 && set.every(w => isRestored(progress.rares?.[w.id]))
        ? postscriptHtml(postscript.find(ps => ps.shelf === shelf)) : '';
    }

    function renderNight() {
      if (!nightGroups.length) return renderIndex();
      view = 'night';
      const group = nightGroups[nightIndex];
      const met = rares.filter(w => isRestored(progress.rares?.[w.id])).length;
      container.innerHTML = `<div class="gq-album-top">${backButton}<span class="gq-album-total">✦ <b>${met}</b>/${rares.length}</span><button class="text-button" data-act="index" type="button">目次</button></div>
        <div class="gq-album-nav"><button type="button" class="gq-round" data-act="night-prev" aria-label="前のページ">${icon('prev')}</button>
          <div class="gq-album-title"><small>${group.ch}区 ${esc(group.name)}</small><b>夜の切手帳</b><span>${nightIndex + 1} / ${nightGroups.length}</span></div>
          <button type="button" class="gq-round" data-act="night-next" aria-label="次のページ" ${nightIndex === nightGroups.length - 1 ? 'disabled' : ''}>${icon('next')}</button></div>
        <div class="gq-album-body gq-night-pages">${group.pages.map(page => `<section class="gq-night-row"><h3>${esc(stageName(page.shelf))}</h3><div class="gq-night-sheet">${page.words.map(word => stampWithMark(word, charaSpec(word, tags[word.id] ?? '', {rare: true}), stampState(progress.rares?.[word.id]), base, 'sm')).join('')}</div>${psOf(page.shelf)}</section>`).join('')}</div>`;
    }

    function zoomRare(id) {
      const word = rares.find(w => w.id === id);
      if (!word) return;
      const close = showStampZoom(container, {word, spec: charaSpec(word, tags[id] ?? '', {rare: true}),
        state: stampState(progress.rares?.[id]), box: progress.rares?.[id]?.box ?? 0, base, say,
        onClose: () => { const i = cleanups.indexOf(close); if (i >= 0) cleanups.splice(i, 1); }});
      cleanups.push(close);
    }

    // 切手を見たあと、通の中のその語を光らせる（通がある、見えている語だけ）。
    function glow(id) {
      const word = container.querySelector(`.gq-album-letter .w[data-id="${id}"]:not(.s-gone)`);
      if (!word) return;
      word.classList.remove('hit');
      void word.offsetWidth;
      word.classList.add('hit');
      // 拡大前の一覧のスクロール位置を保つ。
    }

    function zoom(id) {
      const word = words.find(w => w.id === id);
      if (!word) return;
      const page = pages.find(p => p.shelf === word.shelf);
      const specs = specsOf(page);
      const spec = specs[page.words.indexOf(word)];
      const letter = letterOf(page.shelf);
      const face = (fid, state) => {
        const at = page.words.findIndex(w => w.id === fid);
        return at < 0 ? '' : charaSvg(specs[at], {state, ward: page.ch, base});
      };
      const close = showStampZoom(container, {
        word, spec, base, say,
        state: stampState(progress.words?.[word.id]),
        box: progress.words?.[word.id]?.box ?? 0,
        lineHtml: wordLineHtml(letter, id, {face}),
        onClose: () => { const i = cleanups.indexOf(close); if (i >= 0) cleanups.splice(i, 1); glow(id); },
      });
      cleanups.push(close);
    }

    container.onclick = event => {
      if (closed) return;
      const target = event.target;
      const act = target.closest('[data-act]')?.dataset.act;
      if (container.querySelector('.gq-story-overlay')) return;
      if (act === 'scene') {
        const scene = letterOf(pages[index].shelf)?.readable ? sceneFor(scenes, pages[index].shelf) : null;
        if (scene) {
          const card = showPaperCard(container, sceneCardHtml(scene));
          cleanups.push(card.close);
          card.finished.then(() => { const i = cleanups.indexOf(card.close); if (i >= 0) cleanups.splice(i, 1); });
        }
        return;
      }
      if (act === 'back') return deps.back?.();
      if (act === 'prev') { index = clampIndex(index - 1, pages.length); return renderPage(); }
      if (act === 'next' && index === pages.length - 1) { nightIndex = 0; return renderNight(); }
      if (act === 'night') { nightIndex = 0; return renderNight(); }
      if (act === 'night-prev') { if (!nightIndex) { index = pages.length - 1; return renderPage(); } nightIndex--; return renderNight(); }
      if (act === 'night-next') { nightIndex = clampIndex(nightIndex + 1, nightGroups.length); return renderNight(); }
      if (act === 'next') { index = clampIndex(index + 1, pages.length); return renderPage(); }
      if (act === 'index') return renderIndex();
      if (act === 'page') return renderPage();
      if (handlePostscriptClick(event, say)) return;
      const cell = target.closest('[data-shelf]');
      if (cell) { index = clampIndex(pages.findIndex(p => p.shelf === Number(cell.dataset.shelf)), pages.length); return renderPage(); }
      if (container.querySelector('.gq-zoom')) return;
      if (target.closest('.gq-album-letter')) {
        handleLetterClick(event, {say, onWord: zoom});
        return;
      }
      const stamp = target.closest('.stamp[data-id], [data-id]');
      if (stamp && view === 'page') zoom(stamp.dataset.id);
      if (stamp && view === 'night') zoomRare(stamp.dataset.id);
    };
    container.onkeydown = event => {
      if (event.target.matches('[data-ps-line]') && ['Enter', ' '].includes(event.key)) { event.preventDefault(); handlePostscriptClick(event, say); }
    };
    cleanups.push(() => { container.onkeydown = null; });
    renderPage();
  }
}


function stampState(state) { return isRestored(state) ? rawStampState(state) : 'shadow'; }
