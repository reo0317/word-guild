// 図鑑とクレジットの画面。ギルド画面へ戻る処理は呼び出し側から受け取る。
import {chapterStatus} from './chapters.mjs';
import {CREDITS} from './credits.mjs';
import {esc, speak, starsMarkup} from './dom.mjs';

function wordMarkup(word, state) {
  const met = Boolean(state);
  const example = met && word.ex && word.exJa
    ? `<span class="gq-ex">${esc(word.ex)}<small>${esc(word.exJa)}</small></span>` : '';
  return `<li><button type="button" class="gq-entry ${met ? 'met' : ''}" data-say="${esc(word.w)}">
    <b>${esc(word.w)}</b><span class="gq-ja">${met ? esc(word.ja) : '？'}</span>
    <span class="gq-stars" aria-label="習熟度 ${state?.box ?? 0}">${starsMarkup(state?.box ?? 0)}</span>${example}</button></li>`;
}

// 棚の語は、棚を開いたときに初めて作る（1,400語を一度に並べない）。
function shelfMarkup(shelf) {
  return `<details class="gq-book-shelf" data-shelf="${shelf.shelf}"><summary>棚${shelf.shelf}
    <span class="gq-shelf-count">${shelf.lit}/${shelf.total}</span></summary><ul class="gq-entries"></ul></details>`;
}

function chapterMarkup(chapter, open) {
  return `<details class="gq-book-chapter" ${open ? 'open' : ''}><summary><b>章${chapter.ch}</b> ${esc(chapter.name)}
    <span class="gq-shelf-count">灯った棚 ${chapter.litShelves}/${chapter.shelves.length}</span></summary>
    ${chapter.shelves.map(shelfMarkup).join('')}</details>`;
}

export function renderZukan(view, {words, progress, onBack}) {
  const chapters = chapterStatus(words, progress);
  const met = words.filter(word => progress.words[word.id]).length;
  view.className = 'gq gq-book';
  view.innerHTML = `
    <p class="eyebrow">図鑑</p>
    <p class="gq-collected">出会った語 <b>${met}</b> / ${words.length}</p>
    <div class="gq-book-list">${chapters.map((chapter, i) => chapterMarkup(chapter, i === 0)).join('')}</div>
    <button class="text-button" id="gq-back" type="button">← ギルドへ</button>`;
  view.querySelector('#gq-back').onclick = onBack;
  view.querySelectorAll('.gq-book-shelf').forEach(details => {
    details.addEventListener('toggle', () => {
      const list = details.querySelector('.gq-entries');
      if (!details.open || list.childElementCount) return;
      const members = words.filter(word => word.shelf === Number(details.dataset.shelf));
      list.innerHTML = members.map(word => wordMarkup(word, progress.words[word.id])).join('');
    });
  });
  view.querySelector('.gq-book-list').addEventListener('click', event => {
    const entry = event.target.closest('[data-say]');
    if (entry) speak(entry.dataset.say);
  });
}

export function renderCredits(view, {onBack}) {
  const link = ({url}) => `<a href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(url)}</a>`;
  view.className = 'gq gq-credits';
  view.innerHTML = `
    <p class="eyebrow">クレジット</p>
    <div class="gq-credits-body">
      <p>この語彙データは、次の語彙リストをもとに作成しています。</p>
      <ul>${CREDITS.lists.map(list => `<li>${esc(list.name)}<br>${link(list)}</li>`).join('')}</ul>
      <p>著作者：${esc(CREDITS.author)}</p>
      <p>ライセンス：${esc(CREDITS.license.name)}<br>${link(CREDITS.license)}</p>
      <h3>加えた変更</h3>
      <ul>${CREDITS.changes.map(change => `<li>${esc(change)}</li>`).join('')}</ul>
      <p>${esc(CREDITS.note)}</p>
    </div>
    <button class="text-button" id="gq-back" type="button">← ギルドへ</button>`;
  view.querySelector('#gq-back').onclick = onBack;
}
