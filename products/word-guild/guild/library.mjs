// クレジットの画面。戻る処理は呼び出し側から受け取る。
// ことば帳は切手帳（album.mjs）に置き換わった。
import {CREDITS} from './credits.mjs';
import {esc} from './dom.mjs';

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
      <h3>絵と音</h3>
      <ul>${CREDITS.assets.map(line => `<li>${esc(line)}</li>`).join('')}</ul>
      <p>${esc(CREDITS.note)}</p>
    </div>
    <button class="text-button" id="gq-back" type="button">← 戻る</button>`;
  view.querySelector('#gq-back').onclick = onBack;
}

