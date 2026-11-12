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
import {stampState, pageSpecs} from './chara.mjs';
import {charaDefs, charaSvg, stampHtml} from './chara-svg.mjs';
import {letterView} from './story.mjs';
import {CHAPTER_NAMES} from './chapters.mjs';
import {emptyProgress} from './store.mjs';
import {esc, speak as defaultSpeak, starsMarkup, fab, icon, ensureLetterCss, letterHtml, shadowLinesOf, wordLineHtml, handleLetterClick} from './dom.mjs';
import {todayNumber} from './srs.mjs';

const POS = {v: '動詞', n: '名詞', a: '形容詞', o: 'その他'};
const STATE_NAME = {shadow: '影', proof: '仮刷り', print: '本刷り', gold: '金ぶち'};

// ---------- DOM を使わない部分（tests/guild-album.test.mjs が検査する） ----------

// 語を街灯の番号ごとに分けて、ページの配列にする（番号の小さい順）。
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
  const ex = met && word.ex ? `<p class="gq-ex">${esc(word.ex)}<small>${esc(word.exJa ?? '')}</small></p>` : '';
  const overlay = document.createElement('div');
  overlay.className = 'gq-zoom';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.innerHTML = `<div class="gq-zoom-card">
    <div class="gq-zoom-stamp">${stampWithMark(word, spec, state, base, 'lg')}</div>
    <p class="gq-zoom-state">${STATE_NAME[state]}${spec.kind === 'odd' ? '　✦ 変わり種' : ''}</p>
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
  let story = deps.story;
  if (story === undefined) {
    try {
      const response = await fetch(new URL('data/story.json', BASE));
      story = response.ok ? await response.json() : null;
    } catch { story = null; }
  }
  return {words, tags, story: Array.isArray(story?.letters) ? story : null};
}

export function openAlbum(container, deps = {}) {
  ensureCss();
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
  load(deps).then(({words, tags, story}) => { if (!closed) start(words, tags, story); }, () => {
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

  function start(words, tags, story) {
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
      const oddAt = specs.findIndex(s => s.kind === 'odd');
      const odd = oddAt >= 0 ? page.words[oddAt] : null;
      const oddState = odd ? stampState(progress.words?.[odd.id]) : 'shadow';
      const letter = letterOf(page.shelf);
      const face = (id, state) => {
        const at = page.words.findIndex(w => w.id === id);
        return at < 0 ? '' : charaSvg(specs[at], {state, ward: page.ch, base});
      };
      const paper = letter ? `<div class="gq-album-letter">${letterHtml(letter, {face, shadowLines: shadowLinesOf(letter), lit: pp.complete})}</div>` : '';
      const seal = pp.allGold ? '<span class="gq-seal gold">完・金</span>' : pp.complete ? '<span class="gq-seal">完</span>' : '';
      container.innerHTML = `${charaDefs(base)}
        <div class="gq-album-top">${backButton}<span class="gq-album-total">集めた切手 <b>${collected}</b>/${words.length}</span><button class="text-button" data-act="index" type="button">目次</button></div>
        <div class="gq-album-nav">
          <button type="button" class="gq-round" data-act="prev" aria-label="前のページ" ${index === 0 ? 'disabled' : ''}>${icon('prev')}</button>
          <div class="gq-album-title"><small>${page.ch}区 ${esc(wardName)}</small><b>街灯 ${page.shelf}</b><span>${index + 1} / ${pages.length}</span></div>
          <button type="button" class="gq-round" data-act="next" aria-label="次のページ" ${index === pages.length - 1 ? 'disabled' : ''}>${icon('next')}</button>
        </div>
        <div class="gq-album-body ${pp.allGold ? 'gold-page' : pp.complete ? 'lit-page' : ''}">
          ${first ? `<div class="gq-album-gate">${memorialHtml(page.ch, gates.includes(page.ch), base)}</div>` : ''}
          ${paper}
          <p class="gq-page-count"><b>${pp.got}/${pp.total}</b> ${seal}</p>
          <div class="gq-sheet">${stamps}</div>
          ${odd ? `<p class="gq-odd">✦ 変わり種 <button type="button" class="text-button" data-id="${esc(odd.id)}">${oddState === 'shadow' ? '？' : esc(odd.w)}</button></p>` : ''}
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
      container.innerHTML = `${charaDefs(base)}
        <div class="gq-album-top">${backButton}<span class="gq-album-total">集めた切手 <b>${collected}</b>/${words.length}</span><button class="text-button" data-act="page" type="button">ページへ</button></div>
        <p class="eyebrow">切手帳の目次</p>
        <div class="gq-album-body">${groups.map(group => `<section class="gq-ward">
          <h3>${group.ch}区 ${esc(group.name)}<small>記念切手 ${gates.includes(group.ch) ? '済' : '未'}</small></h3>
          <div class="gq-ward-gate">${memorialHtml(group.ch, gates.includes(group.ch), base)}</div>
          <div class="gq-lampgrid">${cells(group)}</div></section>`).join('')}</div>`;
    }

    // 切手を見たあと、通の中のその語を光らせる（通がある、見えている語だけ）。
    function glow(id) {
      const word = container.querySelector(`.gq-album-letter .w[data-id="${id}"]:not(.s-gone)`);
      if (!word) return;
      word.classList.remove('hit');
      void word.offsetWidth;
      word.classList.add('hit');
      word.scrollIntoView({block: 'nearest', behavior: 'smooth'});
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
      if (act === 'back') return deps.back?.();
      if (act === 'prev') { index = clampIndex(index - 1, pages.length); return renderPage(); }
      if (act === 'next') { index = clampIndex(index + 1, pages.length); return renderPage(); }
      if (act === 'index') return renderIndex();
      if (act === 'page') return renderPage();
      const cell = target.closest('[data-shelf]');
      if (cell) { index = clampIndex(pages.findIndex(p => p.shelf === Number(cell.dataset.shelf)), pages.length); return renderPage(); }
      if (container.querySelector('.gq-zoom')) return;
      if (target.closest('.gq-album-letter')) {
        handleLetterClick(event, {say, onWord: zoom});
        return;
      }
      const stamp = target.closest('.stamp[data-id], [data-id]');
      if (stamp && view === 'page') zoom(stamp.dataset.id);
    };
    renderPage();
  }
}

