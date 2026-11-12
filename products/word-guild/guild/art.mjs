// 絵の「名前 → ファイル」の表。kind は絵の収め方：
//   bg     背景・オープニング。枠いっぱいに敷く（cover）。
//   sprite キャラと敵。透過のまま、枠に収める（contain）。背景色も枠も付けない。
import {esc} from './dom.mjs';

export const ART = {
  key:        {file: 'art/key-visual.webp',     kind: 'bg', label: '霧の坂と郵便局', ready: true},
  open1:      {file: 'art/key-visual.webp',     kind: 'bg', label: '霧の坂と郵便局', ready: true},
  open2:      {file: 'art/open-2.webp',         kind: 'bg', label: '霧が手紙の文字を消す', ready: true},
  open3:      {file: 'art/open-3.webp',         kind: 'bg', label: 'ハトリ局長が鞄を渡す', ready: true},
  post:       {file: 'art/post-office.webp',    kind: 'bg', label: '局の中', ready: true},
  ward1:      {file: 'art/ward-1.webp',         kind: 'bg', label: '坂の上の朝市', ready: true},
  ward2:      {file: 'art/ward-2.webp',         kind: 'bg', label: '石だたみ商店街', ready: true},
  ward3:      {file: 'art/ward-3.webp',         kind: 'bg', label: '波止場の倉庫街', ready: true},
  ward4:      {file: 'art/ward-4.webp',         kind: 'bg', label: '時計塔の役場', ready: true},
  ward5:      {file: 'art/ward-5.webp',         kind: 'bg', label: '駅前ホテル通り', ready: true},
  ward6:      {file: 'art/ward-6.webp',         kind: 'bg', label: '灯台岬', ready: true},
  tsumugi:    {file: 'art/tsumugi-normal.webp', kind: 'sprite', label: 'ツムギ', ready: true},
  tsumugiJoy: {file: 'art/tsumugi-joy.webp',    kind: 'sprite', label: 'ツムギ（喜び）', ready: true},
  fuurou:     {file: 'art/fuurou-normal.webp',  kind: 'sprite', label: 'フウロウ', ready: true},
  fuurouStamp:{file: 'art/fuurou-stamp.webp',   kind: 'sprite', label: 'フウロウ（判を押す）', ready: true},
  hatori:     {file: 'art/hatori-normal.webp',  kind: 'sprite', label: 'ハトリ局長', ready: true},
  hatoriSmile:{file: 'art/hatori-smile.webp',   kind: 'sprite', label: 'ハトリ局長（笑顔）', ready: true},
  shimi:      {file: 'art/shimi.webp',          kind: 'sprite', label: 'シミ', ready: true},
  keshikasu:  {file: 'art/keshikasu.webp',      kind: 'sprite', label: 'ケシカス', ready: true},
  nijimi:     {file: 'art/nijimi.webp',         kind: 'sprite', label: 'ニジミ', ready: true},
  hokoridama: {file: 'art/hokoridama.webp',     kind: 'sprite', label: 'ホコリダマ', ready: true},
  atenashi:   {file: 'art/atenashi.webp',       kind: 'sprite', label: 'アテナシ', ready: true},
  oshimi:     {file: 'art/oshimi.webp',         kind: 'sprite', label: 'オオシミ', ready: true},
};

// quest.mjs の敵の名前（変えない）→ 新しい敵の絵。大物の盤面は oshimi（view.mjs）。
export const ENEMY_ART = {cat: 'shimi', dog: 'keshikasu', sun: 'nijimi', ant: 'hokoridama', animal: 'atenashi'};
export const BIG_ENEMY_ART = 'oshimi';

export const artFile = name => ART[name]?.file ?? null;

export function artBox(name, extra = '') {
  const art = ART[name];
  if (!art) throw new Error(`未定義の絵: ${name}`);
  const attrs = `data-art="${esc(name)}" role="img" aria-label="${esc(art.label)}"`;
  // 届いていない絵は、仮の色の箱のまま（今は全部 ready）。
  if (!art.ready) return `<div class="art art-box ${esc(extra)}" ${attrs}></div>`;
  return `<div class="art art-ready art-${art.kind} ${esc(extra)}" ${attrs}><img src="${esc(art.file)}" alt="" decoding="async"></div>`;
}

// 表情の差し替え（フウロウが判を押す、ツムギが喜ぶ、など）。
export function swapArt(box, name) {
  const art = ART[name];
  const img = box?.querySelector('img');
  if (!art || !img) return;
  img.src = art.file;
  box.dataset.art = name;
}
