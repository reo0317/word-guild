// 絵の「名前 → ファイル」の表。絵が届くまでは、5色の仮の箱で代わりに表示する（B2 で本物に替える）。
// tone は style.css の色名：ink 紺 / paper 紙 / seal 朱 / fog 霧 / lamp 灯り。
import {esc} from './dom.mjs';

export const ART = {
  key:      {file: 'art/key-visual.webp',  tone: 'fog',   label: '霧の坂と郵便局'},
  open1:    {file: 'art/key-visual.webp',  tone: 'fog',   label: '霧の坂と郵便局'},
  open2:    {file: 'art/open-2.webp',      tone: 'ink',   label: '霧が手紙の文字を消す'},
  open3:    {file: 'art/open-3.webp',      tone: 'paper', label: 'ハトリ局長が鞄を渡す'},
  post:     {file: 'art/post-office.webp', tone: 'paper', label: '局の中'},
  ward1:    {file: 'art/ward-1.webp',      tone: 'paper', label: '坂の上の朝市'},
  ward2:    {file: 'art/ward-2.webp',      tone: 'paper', label: '石だたみ商店街'},
  ward3:    {file: 'art/ward-3.webp',      tone: 'fog',   label: '波止場の倉庫街'},
  ward4:    {file: 'art/ward-4.webp',      tone: 'paper', label: '時計塔の役場'},
  ward5:    {file: 'art/ward-5.webp',      tone: 'fog',   label: '駅前ホテル通り'},
  ward6:    {file: 'art/ward-6.webp',      tone: 'ink',   label: '灯台岬'},
  tsumugi:  {file: 'art/tsumugi.webp',     tone: 'ink',   label: 'ツムギ'},
  fuurou:   {file: 'art/fuurou.webp',      tone: 'seal',  label: 'フウロウ'},
  hatori:   {file: 'art/hatori.webp',      tone: 'fog',   label: 'ハトリ局長'},
  shimi:    {file: 'art/shimi.webp',       tone: 'fog',   label: 'シミ'},
  keshikasu:{file: 'art/keshikasu.webp',   tone: 'paper', label: 'ケシカス'},
  nijimi:   {file: 'art/nijimi.webp',      tone: 'ink',   label: 'ニジミ'},
  hokoridama:{file: 'art/hokoridama.webp', tone: 'fog',   label: 'ホコリダマ'},
  atenashi: {file: 'art/atenashi.webp',    tone: 'paper', label: 'アテナシ'},
};

// quest.mjs の敵の名前（変えない）→ 新しい敵の絵
export const ENEMY_ART = {cat: 'shimi', dog: 'keshikasu', sun: 'nijimi', ant: 'hokoridama', animal: 'atenashi'};

export const artFile = name => ART[name]?.file ?? null;

// 絵の代わりの箱。本物が入ったら、同じ場所に <img src="artFile(name)"> を出す。
export function artBox(name, extra = '') {
  const art = ART[name];
  if (!art) throw new Error(`未定義の絵: ${name}`);
  return `<div class="art tone-${art.tone} ${esc(extra)}" data-art="${esc(name)}" role="img" aria-label="${esc(art.label)}"></div>`;
}
