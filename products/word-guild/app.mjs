// 入口：タイトル → オープニング → 最初の配達 → 局。2回目からは タイトル →「つづきから」→ 局。
// 局・配達・結果は guild/view.mjs、絵の表は guild/art.mjs、音は guild/music.mjs。
import {mountGuild} from './guild/view.mjs';
import {createMusic} from './guild/music.mjs';
import {artBox} from './guild/art.mjs';

const view = document.querySelector('#view');
const params = new URLSearchParams(location.search);
const music = createMusic();
const SOUND_KEY = 'kiriharePost.sound';
let soundOn = true;
try { soundOn = localStorage.getItem(SOUND_KEY) !== 'off'; } catch { /* 保存できなくても遊べる */ }
music.setEnabled(soundOn);

const guild = mountGuild({view, dev: params.get('dev') === '1', music, exit: title, setScreen() {}});

// 裏から戻った後の最初のタップで、止まった音を再開する。
let wasHidden = false;
document.addEventListener('visibilitychange', () => { if (document.hidden) wasHidden = true; });
document.addEventListener('pointerdown', () => {
  if (wasHidden) { wasHidden = false; music.resume(); }
}, {capture: true});

// 開始ボタンの処理の中で音を鳴らし始める（Safari の自動再生の制限）。
function unlockSound() {
  music.setEnabled(soundOn);
  music.resume();
}

function title() {
  const returning = guild.hasProgress();
  music.play('post');
  view.className = 'kp kp-title';
  view.innerHTML = `
    ${artBox('key', 'kp-key')}
    <div class="kp-head"><h1>霧晴れ郵便局</h1><p>なぞって届ける英単語</p></div>
    <div class="kp-foot">
      <button class="primary" id="kp-start" type="button">${returning ? 'つづきから' : 'はじめる'}</button>
      <button class="text-button" id="kp-sound" type="button" aria-pressed="${soundOn}"></button>
    </div>`;
  const sound = view.querySelector('#kp-sound');
  const paintSound = () => { sound.textContent = soundOn ? '音　オン' : '音　オフ'; sound.setAttribute('aria-pressed', soundOn); };
  paintSound();
  sound.onclick = () => {
    soundOn = !soundOn;
    try { localStorage.setItem(SOUND_KEY, soundOn ? 'on' : 'off'); } catch { /* 同上 */ }
    music.setEnabled(soundOn);
    if (!soundOn) music.stop();
    paintSound();
  };
  view.querySelector('#kp-start').onclick = () => {
    unlockSound();
    if (returning) guild.open();
    else opening();
  };
}

// オープニング。絵は3枚、文は2行ずつ。タップで送り、「とばす」で最初の配達へ。
const OPENING = [
  {art: 'open1', lines: ['海沿いの坂の町、ヨスガ港。', 'ある朝、白い霧が出て、手紙の言葉が消えはじめた。']},
  {art: 'open2', lines: ['看板も、帳簿も、宛名も、霧に消えていく。', '言葉を食べているのは、紙とインクの小さな魔物たち。']},
  {art: 'open3', lines: ['新人のツムギは、局長から鞄を受け取った。', '「消えた言葉を取り戻して、手紙を届けておいで」']},
];

function opening(step = 0) {
  const page = OPENING[step];
  const last = step === OPENING.length - 1;
  view.className = 'kp kp-opening';
  view.innerHTML = `
    ${artBox(page.art, 'kp-key')}
    <button class="text-button kp-skip" id="kp-skip" type="button">とばす</button>
    <button class="kp-page" id="kp-next" type="button" aria-label="${last ? '最初の配達へ' : '次へ'}">
      <span class="kp-text">${page.lines.map(line => `<span>${line}</span>`).join('')}</span>
      <small aria-hidden="true">${step + 1} / ${OPENING.length}　タップで${last ? 'はじめる' : '次へ'}</small>
    </button>`;
  const finish = () => { music.sfx('stamp'); guild.open({first: true}); };
  view.querySelector('#kp-skip').onclick = finish;
  view.querySelector('#kp-next').onclick = () => (last ? finish() : opening(step + 1));
}

if (params.get('guild') === '1') guild.open();
else title();
