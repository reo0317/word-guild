// 設定の画面：音、保存の書き出し／読み込み、Safari とホーム画面アプリの違い、クレジットへの入口。
//
// openSettings(container, deps) → {close()}
//
// deps（すべて省略できる。無い項目は下の既定で補う）：
//   progress   進捗。無ければ空の進捗。読み込みで置きかえるときは、この物の中身を入れ替える（参照を保つ）
//   words      語の配列。「集めた語」の数に使う。無ければ 保存の words の数
//   today      日番号。書き出した日（exportDay）に使う。無ければ srs.mjs の todayNumber()
//   storage    getItem / setItem を持つ物（localStorage）。無ければ書き出しの日の保存・読み込みを無効にする
//   dev        真なら保存しない（書き出し・読み込みのボタンを無効）
//   back()     戻るボタンで呼ぶ。読み込みで置きかえたあとも呼ぶ
//   music      createMusic() の物。音の切り替えで setEnabled を呼ぶ
//   soundOn    音の今の状態（真偽値）。無ければ localStorage の 'kiriharePost.sound' から読む
//   setSound(on)  音の切り替えを呼び出し側で保存するとき。無ければ localStorage に保存して music.setEnabled する
//   onProgress(progress)  書き出しの日や読み込みで進捗が変わったとき
// speak などは使わない。クレジットは library.mjs の renderCredits（戻ると設定に戻る）。
import {exportText, importText, saveProgress, backupProgress, restoreBackup, hasBackup, emptyProgress} from './store.mjs';
import {todayNumber} from './srs.mjs';
import {isStandalone, onUpdateReady, applyUpdate} from './pwa.mjs';
import {renderCredits} from './library.mjs';
import {esc} from './dom.mjs';

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
  let imported = null;
  let exported = '';
  let updateReady = false;
  const off = onUpdateReady(() => { if (!closed && container.isConnected) { updateReady = true; paintUpdate(); } });
  const handle = {close() { closed = true; off(); container.innerHTML = ''; }};

  const back = () => { handle.close(); deps.back?.(); };
  const $ = selector => container.querySelector(selector);
  const today = () => deps.today ?? todayNumber();
  const exportDay = () => !progress.exportDay ? 'まだ書き出していません'
    : progress.exportDay >= today() ? '今日' : `${today() - progress.exportDay}日前`;

  container.className = 'gq gq-settings';
  container.innerHTML = `
    <p class="eyebrow">設定</p>
    <section><div class="gq-switch"><h3>音</h3><button type="button" id="gs-sound" aria-pressed="${soundOn}"></button></div></section>
    <section><h3>保存の書き出し</h3>
      <p class="note">進捗を文字列にして、メモなどに控えておけます。最後に書き出した日：<span id="gs-exday">${esc(exportDay())}</span></p>
      <textarea id="gs-out" readonly rows="3" aria-label="書き出した文字列" hidden></textarea>
      <div class="row"><button type="button" id="gs-export" ${deps.dev ? 'disabled' : ''}>書き出す</button><button type="button" id="gs-copy" disabled>コピー</button></div>
      <p class="msg" id="gs-exmsg" role="status"></p></section>
    <section><h3>保存の読み込み</h3>
      <textarea id="gs-in" rows="3" placeholder="書き出した文字列を貼り付け" aria-label="読み込む文字列"></textarea>
      <div class="row"><button type="button" id="gs-check" ${writable ? '' : 'disabled'}>確かめる</button></div>
      <div id="gs-result" role="status"></div>
      <div class="row"><button type="button" id="gs-restore" ${writable && storage && hasBackup(storage) ? '' : 'hidden'}>読み込む前の進捗に戻す</button></div></section>
    <section><h3>Safari とホーム画面アプリ</h3>
      <p>Safari で遊んだ進捗と、ホーム画面に追加したアプリの進捗は、別々に保存されます。引き継ぐには、Safari で「書き出す」→ ホーム画面に追加 → アプリで「読み込み」の順に行います。</p>
      ${isStandalone() ? '' : '<p>ホーム画面への追加：共有ボタン →「ホーム画面に追加」。追加したあとのアプリには進捗が引き継がれないので、読み込みが要ります。Safari のタブだけで遊ぶと、7日間開かないと保存が消えることがあります。</p>'}
      ${deps.dev ? '<p class="note">いまは保存しないモードなので、書き出しと読み込みは使えません。</p>' : ''}</section>
    <section id="gs-update" hidden><p>新しい版があります。</p><div class="row"><button type="button" id="gs-apply">更新</button></div></section>
    <div class="row"><button class="text-button" type="button" id="gs-credits">クレジット</button><button class="text-button" type="button" id="gs-back">← 戻る</button></div>`;

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

  const say = (selector, text, error = false) => { const el = $(selector); if (el) { el.textContent = text; el.className = `msg${error ? ' err' : ''}`; } };

  $('#gs-export').onclick = () => {
    const out = $('#gs-out');
    exported = exportText(progress);
    out.value = exported;
    out.hidden = false;
    $('#gs-copy').disabled = false;
    progress.exportDay = today();
    if (storage) saveProgress(storage, progress);
    deps.onProgress?.(progress);
    $('#gs-exday').textContent = exportDay();
    say('#gs-exmsg', '書き出しました。「コピー」を押して、メモなどに貼り付けて残してください。');
  };
  $('#gs-copy').onclick = async () => {
    const out = $('#gs-out');
    try {
      await navigator.clipboard.writeText(exported);
      say('#gs-exmsg', 'コピーしました。');
    } catch {
      out.focus();
      out.select();
      say('#gs-exmsg', '長押しでコピーしてください。', true);
    }
  };

  $('#gs-check').onclick = () => {
    const result = importText($('#gs-in').value);
    const box = $('#gs-result');
    imported = null;
    if (!result.ok) { box.innerHTML = `<p class="msg err">${esc(IMPORT_ERRORS[result.error] ?? IMPORT_ERRORS.data)}</p>`; return; }
    imported = result.progress;
    const now = summarize(progress, deps.words);
    const next = summarize(imported, deps.words);
    box.innerHTML = `<table class="gq-compare"><tr><th></th><th>いま</th><th>読み込む進捗</th></tr>
      <tr><th>集めた切手</th><td>${now.stamps}</td><td>${next.stamps}</td></tr>
      <tr><th>クエスト</th><td>${now.quests}回</td><td>${next.quests}回</td></tr>
      <tr><th>連続</th><td>${now.streak}日</td><td>${next.streak}日</td></tr></table>
      <p class="note">置きかえると、いまの進捗は控えに残ります。</p>
      <div class="row"><button type="button" id="gs-replace">この進捗に置きかえる</button></div>`;
    $('#gs-replace').onclick = () => {
      backupProgress(storage);
      replaceWith(imported);
    };
  };

  function replaceWith(next) {
    saveProgress(storage, next);
    for (const key of Object.keys(progress)) delete progress[key]; // 呼び出し側の参照を保ったまま中身を入れ替える
    Object.assign(progress, next);
    deps.onProgress?.(progress);
    back();
  }
  $('#gs-restore').onclick = () => {
    const restored = restoreBackup(storage);
    if (!restored.ok) { $('#gs-result').innerHTML = '<p class="msg err">控えがありません。</p>'; return; }
    replaceWith(restored.progress);
  };

  $('#gs-apply').onclick = () => applyUpdate();
  $('#gs-credits').onclick = () => renderCredits(container, {onBack: () => openSettings(container, deps)});
  $('#gs-back').onclick = back;
  return handle;
}
