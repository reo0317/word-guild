// 設定の画面：音、読みあげ、新しい単語の数、クレジットへの入口。（App Store 版では記録は端末に残るので、書き出し・読み込みは出さない）
//
// openSettings(container, deps) → {close()}
//
// deps（すべて省略できる。無い項目は下の既定で補う）：
//   progress   進捗。無ければ空の進捗。読み込みで置きかえるときは、この物の中身を入れ替える（参照を保つ）
//   words      語の配列。「集めた語」の数に使う。無ければ 保存の words の数
//   storage    getItem / setItem を持つ物（localStorage）。無ければ書き出しの日の保存・読み込みを無効にする
//   dev        真なら保存しない（書き出し・読み込みのボタンを無効）
//   back()     戻るボタンで呼ぶ。読み込みで置きかえたあとも呼ぶ
//   music      createMusic() の物。音の切り替えで setEnabled を呼ぶ
//   soundOn    音の今の状態（真偽値）。無ければ localStorage の 'kiriharePost.sound' から読む
//   setSound(on)  音の切り替えを呼び出し側で保存するとき。無ければ localStorage に保存して music.setEnabled する
//   onProgress(progress)  書き出しの日や読み込みで進捗が変わったとき
// speak などは使わない。クレジットは library.mjs の renderCredits（戻ると設定に戻る）。
import {saveProgress, emptyProgress} from './store.mjs';
import {onUpdateReady, applyUpdate} from './pwa.mjs';
import {renderCredits} from './library.mjs';
import {esc, setSpeechEnabled, watchSpeechVoice, waxButton} from './dom.mjs';

const SOUND_KEY = 'kiriharePost.sound';
const CSS_URL = new URL('../album.css', import.meta.url).href;
export const IMPORT_ERRORS = {
  empty: '空です。書き出した文字列を貼り付けてください。',
  format: '霧晴れ郵便局の書き出しではありません。',
  checksum: '途中で切れています。もう一度、全部をコピーしてください。',
  data: '読めない内容です。',
};

function ensureCss() {
  if (typeof document === 'undefined' || document.getElementById('gq-album-css')) return;
  const link = document.createElement('link');
  link.id = 'gq-album-css';
  link.rel = 'stylesheet';
  link.href = CSS_URL;
  document.head.append(link);
}

// 「集めた切手」「クエスト」「連続」の要約（読み込みの前後を並べる）。DOM は使わない。
export function summarize(progress, words) {
  const states = words ? words.filter(w => progress.words[w.id]?.box >= 1).length
    : Object.values(progress.words).filter(s => s?.box >= 1).length;
  return {stamps: states, quests: progress.quests, streak: progress.streak?.count ?? 0};
}

export function openSettings(container, deps = {}) {
  ensureCss();
  const progress = deps.progress ?? emptyProgress();
  const storage = deps.storage ?? null;
  const writable = Boolean(storage) && !deps.dev;
  let closed = false;
  let soundOn = deps.soundOn;
  if (soundOn === undefined) {
    soundOn = true;
    try { soundOn = localStorage.getItem(SOUND_KEY) !== 'off'; } catch { /* 読めなくても動く */ }
  }
  let updateReady = false;
  const off = onUpdateReady(() => { if (!closed && container.isConnected) { updateReady = true; paintUpdate(); } });
  let child = null; // クレジットから戻って開き直した設定
  const release = () => { closed = true; off(); offVoice(); };
  const handle = {close() { handle.dead = true; release(); child?.close(); child = null; container.innerHTML = ''; }};

  const back = () => { handle.close(); deps.back?.(); };
  const $ = selector => container.querySelector(selector);

  container.className = 'gq gq-settings';
  container.innerHTML = `
    <p class="eyebrow">設定</p>
    <section><div class="gq-switch"><h3>曲と効果音</h3><button type="button" class="gs-toggle" aria-label="曲と効果音" id="gs-sound" aria-pressed="${soundOn}"></button></div></section>
    <section class="gs-speech"><div class="gq-switch"><h3>読みあげ</h3><button type="button" class="gs-toggle" aria-label="読みあげ" id="gs-speech" aria-pressed="${progress.settings.speech !== false}">${progress.settings.speech !== false ? 'オン' : 'オフ'}</button></div>
      <p class="note" id="gs-voice" hidden></p>
      <details><summary>声をもっと自然にするには</summary><p>iPhone の 設定 → アクセシビリティ → 読み上げコンテンツ → 声 → English で、「拡張」や「プレミアム」の声を追加してください。</p></details>
    </section>
    <section><h3>1回の配達で出会う新しい単語</h3><div class="gs-fresh" role="group" aria-label="新しい単語の数">${[[4,'🌱 すくなめ'],[6,'🌿 ふつう'],[8,'🌳 たくさん']].map(([n,label]) => `<button type="button" class="gs-ticket" data-fresh="${n}" aria-pressed="${progress.settings.fresh === n}">${label}</button>`).join('')}</div></section>
    <section id="gs-update" hidden><p>新しい版があります。</p><div class="row">${waxButton({label: '更新', id: 'gs-apply'})}</div></section>
    <div class="row gs-footer"><button class="text-button" type="button" id="gs-credits">クレジット</button><button class="text-button" type="button" id="gs-back">トップへ</button></div>`;

  const offVoice = watchSpeechVoice(name => { $('#gs-voice').textContent = name ?? '端末の既定音声'; });


  const paintSound = () => { const b = $('#gs-sound'); if (b) { b.textContent = soundOn ? 'オン' : 'オフ'; b.setAttribute('aria-pressed', soundOn); } };
  function paintUpdate() { const s = $('#gs-update'); if (s) s.hidden = !updateReady; }
  paintSound();
  paintUpdate();

  $('#gs-sound').onclick = () => {
    soundOn = !soundOn;
    if (deps.setSound) deps.setSound(soundOn);
    else {
      try { localStorage.setItem(SOUND_KEY, soundOn ? 'on' : 'off'); } catch { /* 保存できなくても切り替わる */ }
      try { deps.music?.setEnabled(soundOn); } catch { /* 音は設定を止めない */ }
    }
    paintSound();
  };

  $('#gs-speech').onclick = () => {
    progress.settings.speech = progress.settings.speech === false;
    setSpeechEnabled(progress.settings.speech);
    if (writable) saveProgress(storage, progress);
    deps.onProgress?.(progress);
    $('#gs-speech').textContent = progress.settings.speech ? 'オン' : 'オフ';
    $('#gs-speech').setAttribute('aria-pressed', progress.settings.speech);
  };
  container.querySelectorAll('[data-fresh]').forEach(button => { button.onclick = () => {
    progress.settings.fresh = Number(button.dataset.fresh);
    if (writable) saveProgress(storage, progress);
    deps.onProgress?.(progress);
    container.querySelectorAll('[data-fresh]').forEach(b => b.setAttribute('aria-pressed', b === button));
  }; });
  $('#gs-apply').onclick = () => applyUpdate();
  $('#gs-credits').onclick = () => {
    release(); // 古い設定の更新通知の購読を解除してから移る
    renderCredits(container, {onBack: () => { if (handle.dead) return; child = openSettings(container, deps); }});
  };
  $('#gs-back').onclick = back;
  return handle;
}
