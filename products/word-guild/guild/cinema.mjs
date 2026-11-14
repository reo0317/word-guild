// 映像の演出（外部ライブラリーなし）。
//   playLetterComplete … 手紙が折られて封筒になり、フウロウが封蝋を押し、坂の上の窓へ飛んで灯がともる。
//   playGateCard       … 白紙卿のカードに、インクがにじみ出るように1行が戻る。
// どちらも、時刻 t から画面の状態を決める1本の関数（draw）で動かす。
// タップで早送り、最後の状態でタップすると閉じる。prefers-reduced-motion では最後の状態だけを見せる。
// 動かすのは transform と opacity、それに小さな Canvas だけ（CSS の filter は使わない）。

const INK = '#1f2a44', SEAL = '#c8462f';
const HOME = new URL('../', import.meta.url).href;
const FAST = 9;            // 早送りの倍率
const TAU = Math.PI * 2;

// 区ごとの宛先（背景の絵の中の位置。左上が 0,0、右下が 1,1）。
const DEST = {1: [.555, .335], 2: [.735, .32], 3: [.79, .3], 4: [.815, .24], 5: [.85, .33], 6: [.875, .14]};

const clamp = v => v < 0 ? 0 : v > 1 ? 1 : v;
const seg = (t, a, b) => clamp((t - a) / (b - a));
const lerp = (a, b, k) => a + (b - a) * k;
const eOut = k => 1 - (1 - k) ** 3;
const eIn = k => k * k * k;
const eIO = k => k < .5 ? 4 * k * k * k : 1 - ((-2 * k + 2) ** 3) / 2;
const eBack = k => 1 + 2.7 * (k - 1) ** 3 + 1.7 * (k - 1) ** 2;
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
const wait = ms => new Promise(r => setTimeout(r, ms));

/* ---------- 共通：紙の粒・霧の模様（一度だけ作る） ---------- */

let TEX = null;
function textures() {
  if (TEX) return TEX;
  // 紙の粒：紺の細かい点。
  const g = document.createElement('canvas'); g.width = g.height = 96;
  const gx = g.getContext('2d'), gd = gx.createImageData(96, 96);
  for (let i = 0; i < gd.data.length; i += 4) {
    gd.data[i] = 31; gd.data[i + 1] = 42; gd.data[i + 2] = 68;
    gd.data[i + 3] = Math.random() < .5 ? Math.random() * 26 : 0;
  }
  gx.putImageData(gd, 0, 0);
  // 霧：つなぎ目のない値ノイズを3段重ねる。小さく作り、大きく引きのばして柔らかく見せる。
  const N = 128, f = document.createElement('canvas'); f.width = f.height = N;
  const fx = f.getContext('2d'), fd = fx.createImageData(N, N);
  const grid = p => { const a = new Float32Array(p * p); for (let i = 0; i < a.length; i++) a[i] = Math.random(); return a; };
  const octs = [[4, grid(4), .55], [8, grid(8), .3], [16, grid(16), .15]];
  const sm = k => k * k * (3 - 2 * k);
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    let v = 0;
    for (const [p, a, w] of octs) {
      const u = x / N * p, q = y / N * p, x0 = Math.floor(u), y0 = Math.floor(q), tx = sm(u - x0), ty = sm(q - y0);
      const at = (i, j) => a[(j % p) * p + (i % p)];
      v += w * lerp(lerp(at(x0, y0), at(x0 + 1, y0), tx), lerp(at(x0, y0 + 1), at(x0 + 1, y0 + 1), tx), ty);
    }
    const i = (y * N + x) * 4, al = sm(clamp((v - .36) / .34));
    fd.data[i] = 200; fd.data[i + 1] = 213; fd.data[i + 2] = 221; fd.data[i + 3] = al * 235;
  }
  fx.putImageData(fd, 0, 0);
  TEX = {grain: g.toDataURL(), fog: f.toDataURL()};
  return TEX;
}

const CSS = `
.cin{position:absolute;inset:0;z-index:900;overflow:hidden;background:${INK};color:${INK};cursor:pointer;
 -webkit-tap-highlight-color:transparent;user-select:none;-webkit-user-select:none;touch-action:manipulation;
 font-family:var(--serif,"Hiragino Mincho ProN","Yu Mincho","Noto Serif JP",serif);transition:opacity .28s}
.cin.cin-fixed{position:fixed}
.cin.cin-out{opacity:0}
.cin *{box-sizing:border-box}
.cin-world,.cin-dim,.cin-veil,.cin-fog,.cin-fx{position:absolute;inset:0;pointer-events:none}
.cin-world{will-change:transform}
.cin-bg{position:absolute;display:block;max-width:none}
.cin-glow{position:absolute;width:190px;height:190px;margin:-95px 0 0 -95px;border-radius:50%;opacity:0;will-change:transform,opacity;
 background:radial-gradient(circle,#fff6d8 0,#f9d57a 14%,#f2b84bb0 30%,#f2b84b40 52%,#f2b84b00 70%)}
.cin-core{position:absolute;width:26px;height:26px;margin:-13px 0 0 -13px;border-radius:50%;opacity:0;background:radial-gradient(circle,#fffbe8 0,#fff3c4cc 35%,#fff3c400 70%)}
.cin-dim{background:linear-gradient(#1f2a44e0,#1f2a4490 55%,#1f2a44c0)}
.cin-veil{background:linear-gradient(#b9c8d0 0,#9fb3bfe8 30%,#9fb3bf80 52%,#9fb3bf00 74%)}
.cin-fog{right:auto;width:calc(100% + 720px);background-size:720px 720px;opacity:.9;animation:cin-drift 46s linear infinite;will-change:transform}
.cin-fog.b{width:calc(100% + 1040px);background-size:1040px 1040px;animation:cin-drift-b 71s linear infinite;background-position:0 -300px}
@keyframes cin-drift{to{transform:translate3d(-720px,0,0)}}
@keyframes cin-drift-b{from{transform:translate3d(-1040px,0,0)}to{transform:translate3d(0,0,0)}}
.cin-still .cin-fog{animation:none}
.cin-shadow{position:absolute;height:20px;border-radius:50%;background:radial-gradient(closest-side,#1f2a4470,#1f2a4400);opacity:0;pointer-events:none}
.cin-paper,.cin-envback,.cin-env,.cin-owl{position:absolute;will-change:transform,opacity;pointer-events:none}
.cin-paper{z-index:6;transform-style:preserve-3d;-webkit-transform-style:preserve-3d}
.cin-pan{position:absolute;left:0;width:100%;transform-style:preserve-3d;-webkit-transform-style:preserve-3d}
.cin-face{position:absolute;inset:0;overflow:hidden;backface-visibility:hidden;-webkit-backface-visibility:hidden;
 background-color:#f6eedd;box-shadow:inset 0 0 0 1px #1f2a4455}
.cin-face.back{transform:rotateX(180deg);background-color:#eadfc6}
.cin-face.back::after{content:"";position:absolute;inset:0;background:linear-gradient(#1f2a4400,#1f2a4422)}
.cin-shade{position:absolute;inset:0;background:${INK};opacity:0}
.cin-text{position:absolute;left:0;width:100%;padding:14px 14px 0;font-family:Georgia,"Times New Roman",serif;line-height:1.42;color:#3b4763}
.cin-text h4{margin:0 0 7px;padding-bottom:5px;border-bottom:1px solid #1f2a4455;font-size:.86em;font-weight:400;letter-spacing:.04em;color:${SEAL}}
.cin-text p{margin:0 0 .45em}
.cin-text b{color:${INK};font-weight:700}
.cin-last{border-radius:2px;padding:0 1px}
.cin-envback{z-index:5}.cin-env{z-index:7}
.cin-envback svg,.cin-env svg{position:absolute;left:0;top:0;width:100%;height:100%;overflow:visible}
.cin-flap{position:absolute;left:0;top:0;width:100%;transform-origin:50% 0;will-change:transform}
.cin-flap svg{height:100%}
.cin-grain{position:absolute;inset:0;pointer-events:none}
.cin-seal{position:absolute;opacity:0;will-change:transform,opacity}
.cin-ring{position:absolute;border:2px solid ${SEAL};border-radius:50%;opacity:0}
.cin-owl{z-index:8;opacity:0}
.cin-owl img{display:block;width:100%;height:100%;object-fit:contain}
.cin-fx{z-index:9;width:100%;height:100%}
.cin-scene{position:absolute;left:16px;right:16px;bottom:calc(18px + env(safe-area-inset-bottom,0px));z-index:10;opacity:0;
 padding:18px 20px 12px;background-color:#f6eedd;border:2px solid ${INK};border-radius:4px;box-shadow:4px 5px 0 #1f2a4466;pointer-events:none}
.cin-scene h3{margin:0 0 10px;padding-bottom:8px;border-bottom:1px solid #1f2a4466;font-size:17px;font-weight:900;letter-spacing:.12em;color:${SEAL}}
.cin-scene p{margin:0;font-size:16px;line-height:1.9;font-weight:600;color:${INK}}
.cin-scene.bare{left:auto;right:auto;width:100%;border:0;background:none;box-shadow:none;text-align:center;padding:0}
.cin-hint{margin-top:10px;text-align:right;font-size:11px;letter-spacing:.14em;color:#6f6a5c;opacity:0;transition:opacity .4s}
.cin-scene.bare .cin-hint,.cin-gate .cin-hint{text-align:center;color:#dde5e8}
.cin-scene.bare .cin-hint{display:inline-block;margin:0;padding:7px 16px;border-radius:99px;background:#1f2a44cc;color:#f3ead8}
.cin-final .cin-hint{opacity:1}
.cin-gate{background:radial-gradient(120% 80% at 50% 42%,#33436a 0,#1f2a44 48%,#131a2d 100%);display:grid;place-items:center;align-content:center}
.cin-gate .cin-fog{opacity:.38}
.cin-light{position:absolute;left:50%;top:0;width:520px;height:520px;margin:-300px 0 0 -260px;border-radius:50%;opacity:0;pointer-events:none;
 background:radial-gradient(circle,#f2b84b66 0,#f2b84b22 40%,#f2b84b00 68%)}
.cin-card{position:relative;z-index:5;width:min(330px,calc(100% - 44px));padding:26px 24px 24px;background-color:#fdfcf7;
 box-shadow:0 0 0 1px #1f2a4426,5px 8px 0 #0d1322aa;opacity:0;will-change:transform,opacity;pointer-events:none}
.cin-card h3{margin:0 0 16px;font:400 10px/1 Georgia,serif;letter-spacing:.42em;text-align:center;color:#d3ccba;text-transform:uppercase}
.cin-card ol{list-style:none;margin:0;padding:0;display:grid;gap:clamp(8px,1.7vh,15px)}
.cin-gl .en{position:relative;display:block;font:400 clamp(15px,2.25vh,18px)/1.36 Georgia,"Times New Roman",serif;color:${INK}}
.cin-gl .ja{display:block;margin-top:3px;font-size:12px;line-height:1.5;color:#7a766a}
.cin-gl.old .en{color:#2c3857}
.cin-gl.empty i{display:block;height:clamp(20px,3.4vh,30px);border-bottom:1px dashed #e2dccb}
.cin-ink{position:absolute;pointer-events:none}
.cin-gate .cin-hint{position:relative;z-index:5;margin-top:22px}
`;

function ensureStyle() {
  if (document.getElementById('cin-style')) return;
  const t = textures(), s = document.createElement('style');
  s.id = 'cin-style';
  s.textContent = CSS + `.cin-fog{background-image:url(${t.fog})}

.cin-card::after{content:"";position:absolute;inset:0;pointer-events:none;background-image:url(${t.grain})}
.cin-face,.cin-scene{background-image:url(${t.grain})}.cin-grain{background-image:url(${t.grain})}`;
  document.head.append(s);
}

function mount(container, cls, label) {
  ensureStyle();
  const root = document.createElement('div');
  root.className = `cin ${cls}`;
  root.setAttribute('role', 'dialog');
  root.setAttribute('aria-label', label);
  root.tabIndex = -1;
  if (getComputedStyle(container).position === 'static') root.classList.add('cin-fixed');
  return root;
}

const wantsStill = opt => opt.reduced ?? !!globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

// t を進めて draw(t, dt) を呼ぶ。タップで早送り。最後まで行ったら、もう一度のタップ（または autoClose 秒後）で閉じる。
function run(root, {dur, draw, still, autoClose = 0}) {
  return new Promise(resolve => {
    let t = 0, last = null, rate = 1, raf = 0, endedAt = 0, closed = false;
    const born = performance.now();
    const close = () => {
      if (closed) return;
      closed = true;
      cancelAnimationFrame(raf);
      root.classList.add('cin-out');
      setTimeout(() => { root.remove(); resolve(); }, still ? 0 : 280);
    };
    const finish = () => {
      endedAt = performance.now();
      root.classList.add('cin-final');
      if (autoClose) setTimeout(close, autoClose * 1000);
    };
    const step = now => {
      const dt = last == null ? 0 : Math.min(.05, (now - last) / 1000) * rate;
      last = now;
      t = Math.min(dur, t + dt);
      draw(t, dt);
      if (t < dur) raf = requestAnimationFrame(step); else finish();
    };
    const tap = e => {
      e.preventDefault(); e.stopPropagation();
      const now = performance.now();
      if (endedAt) { if (now - endedAt > 350) close(); }
      else if (now - born > 200) rate = FAST;
    };
    root.addEventListener('click', tap);
    root.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ' || e.key === 'Escape') tap(e); });
    root.focus({preventScroll: true});
    if (still) { root.classList.add('cin-still'); draw(dur, 0); finish(); }
    else raf = requestAnimationFrame(step);
  });
}

const loadImg = src => new Promise(res => {
  const im = new Image();
  im.decoding = 'async'; im.alt = '';
  im.onload = () => res(im); im.onerror = () => res(null);
  im.src = src;
});

// 光の粒・蝋のかけら。数十個までの小さな四角だけを描く。
function particles(canvas, W, H) {
  const dpr = Math.min(2, globalThis.devicePixelRatio || 1);
  canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);
  let ps = [], dirty = false;
  return {
    add(x, y, vx, vy, life, size, color, grav = 0) { if (ps.length < 140) ps.push({x, y, vx, vy, life, max: life, size, color, grav, rot: Math.random() * TAU}); },
    burst(x, y, n, speed, color, size, grav) {
      for (let i = 0; i < n; i++) {
        const a = Math.random() * TAU, v = speed * (.35 + Math.random() * .65);
        this.add(x, y, Math.cos(a) * v, Math.sin(a) * v, .5 + Math.random() * .6, size * (.5 + Math.random()), color, grav);
      }
    },
    tick(dt) {
      if (!ps.length && !dirty) return;
      ctx.clearRect(0, 0, W, H);
      dirty = ps.length > 0;
      ps = ps.filter(p => (p.life -= dt) > 0);
      for (const p of ps) {
        p.vy += p.grav * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.rot += dt * 3;
        const k = p.life / p.max;
        ctx.globalAlpha = Math.min(1, k * 2);
        ctx.fillStyle = p.color;
        ctx.setTransform(dpr, 0, 0, dpr, p.x * dpr, p.y * dpr);
        ctx.rotate(p.rot);
        const s = p.size * (.4 + .6 * k);
        ctx.fillRect(-s / 2, -s / 2, s, s);
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.globalAlpha = 1;
    },
  };
}

function sealSvg() {
  let d = '';
  for (let i = 0; i <= 72; i++) {
    const a = i / 72 * TAU, r = 44 + 3.2 * Math.sin(a * 9) + 1.4 * Math.sin(a * 4 + 1);
    d += `${i ? 'L' : 'M'}${(50 + r * Math.cos(a)).toFixed(1)},${(50 + r * Math.sin(a)).toFixed(1)}`;
  }
  return `<svg viewBox="0 0 100 100" style="position:static;display:block"><path d="${d}Z" fill="${SEAL}" stroke="#8f2c1c" stroke-width="2.5"/>
<circle cx="50" cy="50" r="29" fill="#b93d27" stroke="#8f2c1c" stroke-width="2"/>
<path d="M27 38A27 27 0 0 1 52 22" fill="none" stroke="#ec8a72" stroke-width="3.5" stroke-linecap="round"/>
<path d="M37 39h26M37 48h26M50 48v18" fill="none" stroke="#f3ead8" stroke-width="4.5" stroke-linecap="round"/></svg>`;
}

/* ---------- 手紙が完成した瞬間 ---------- */

export async function playLetterComplete(container, {letter, scene = null, ward = 1, base, ...opt} = {}) {
  const still = wantsStill(opt);
  const root = mount(container, 'cin-letter', '手紙が届く');
  const art = (base ?? HOME) + 'art/';
  const lines = letter?.lines ?? [];
  const text = `<h4>${esc(letter?.from)} → ${esc(letter?.to)}</h4>` + lines.map((l, i) => {
    let en = esc(l.en).replace(/\{([^}]*)\}/g, '<b>$1</b>');
    if (i === lines.length - 1) { const k = en.lastIndexOf('<b>'); if (k >= 0) en = en.slice(0, k) + '<b class="cin-last">' + en.slice(k + 3); }
    return `<p>${en}</p>`;
  }).join('');
  const face = i => `<div class="cin-face"><div class="cin-text" data-i="${i}">${text}</div><div class="cin-shade"></div></div>`;
  const sceneHtml = scene
    ? `<div class="cin-scene"><h3>${esc(scene.title)}</h3>${(scene.lines ?? []).map(l => `<p>${esc(l)}</p>`).join('')}<div class="cin-hint">タップで閉じる</div></div>`
    : `<div class="cin-scene bare"><div class="cin-hint">タップで閉じる</div></div>`;
  root.innerHTML = `
<div class="cin-world"><div class="cin-glow"></div><div class="cin-core"></div></div>
<div class="cin-dim"></div><div class="cin-veil"></div><div class="cin-fog"></div><div class="cin-fog b"></div>
<div class="cin-shadow"></div>
<div class="cin-envback"><svg viewBox="0 0 220 114" preserveAspectRatio="none"><rect x="1" y="1" width="218" height="112" fill="#e0d2b3" stroke="${INK}" stroke-width="2.5" vector-effect="non-scaling-stroke"/></svg>
 <div class="cin-flap a"><svg viewBox="0 0 220 70" preserveAspectRatio="none"><path d="M0 0H220L110 70Z" fill="#eadfc6" stroke="${INK}" stroke-width="2.5" stroke-linejoin="round" vector-effect="non-scaling-stroke"/></svg></div></div>
<div class="cin-paper">
 <div class="cin-pan top">${face(0)}<div class="cin-face back"></div></div>
 <div class="cin-pan mid">${face(1)}</div>
 <div class="cin-pan bot">${face(2)}<div class="cin-face back"></div></div>
</div>
<div class="cin-env"><svg viewBox="0 0 220 114" preserveAspectRatio="none"><path d="M0 0L110 62L220 0V114H0Z" fill="#f3ead8" stroke="${INK}" stroke-width="2.5" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>
 <path d="M0 114L110 62L220 114" fill="none" stroke="${INK}" stroke-opacity=".45" stroke-width="1.3" vector-effect="non-scaling-stroke"/></svg>
 <div class="cin-flap b"><svg viewBox="0 0 220 70" preserveAspectRatio="none"><path d="M0 0H220L110 70Z" fill="#f8f1e2" stroke="${INK}" stroke-width="2.5" stroke-linejoin="round" vector-effect="non-scaling-stroke"/></svg></div>
 <div class="cin-grain"></div><div class="cin-ring"></div><div class="cin-seal">${sealSvg()}</div></div>
<div class="cin-owl"></div>
<canvas class="cin-fx"></canvas>${sceneHtml}`;
  container.append(root);

  const [bg, owlImg] = await Promise.race([
    Promise.all([loadImg(`${art}ward-${ward}.webp`), loadImg(`${art}fuurou-stamp.webp`)]),
    wait(still ? 400 : 1800).then(() => [null, null]),
  ]);
  if (!root.isConnected) return;

  const $ = s => root.querySelector(s);
  const W = root.clientWidth, H = root.clientHeight;
  const world = $('.cin-world'), glow = $('.cin-glow'), core = $('.cin-core'), dim = $('.cin-dim'), veil = $('.cin-veil');
  const fogs = root.querySelectorAll('.cin-fog'), shadow = $('.cin-shadow');
  const paper = $('.cin-paper'), pTop = $('.cin-pan.top'), pMid = $('.cin-pan.mid'), pBot = $('.cin-pan.bot');
  const envBack = $('.cin-envback'), env = $('.cin-env'), flapA = $('.cin-flap.a'), flapB = $('.cin-flap.b');
  const seal = $('.cin-seal'), ring = $('.cin-ring'), owl = $('.cin-owl'), panel = $('.cin-scene');
  const lastWords = root.querySelectorAll('.cin-last'), shades = root.querySelectorAll('.cin-shade');

  // 背景：枠いっぱいに敷き、宛先が画面の右上寄りに来るように横へずらす。
  const [fx, fy] = DEST[ward] ?? DEST[1];
  let dx = W * .6, dy = H * .28;
  if (bg) {
    const s = Math.max(W / bg.naturalWidth, H / bg.naturalHeight), iw = bg.naturalWidth * s, ih = bg.naturalHeight * s;
    const ox = Math.min(0, Math.max(W - iw, W * .6 - fx * iw)), oy = Math.min(0, Math.max(H - ih, H * .3 - fy * ih));
    bg.className = 'cin-bg';
    bg.style.cssText = `left:${ox}px;top:${oy}px;width:${iw}px;height:${ih}px`;
    world.prepend(bg);
    dx = ox + fx * iw; dy = oy + fy * ih;
  }
  world.style.transformOrigin = `${dx}px ${dy}px`;
  glow.style.left = core.style.left = dx + 'px';
  glow.style.top = core.style.top = dy + 'px';

  // 便せん（3つ折り）と封筒の大きさ。
  const Wp = Math.round(Math.min(264, W * .68)), h = Math.round(Wp * .44), Hp = h * 3;
  const cx = W / 2, cy = Math.max(H * .47, dy + h * 1.9);
  const We = Math.round(Wp * 1.1), He = Math.round(h * 1.3);
  paper.style.cssText = `left:${cx - Wp / 2}px;top:${cy - Hp / 2}px;width:${Wp}px;height:${Hp}px`;
  [pTop, pMid, pBot].forEach((p, i) => { p.style.top = i * h + 'px'; p.style.height = h + 'px'; });
  pTop.style.transformOrigin = '50% 100%'; pBot.style.transformOrigin = '50% 0';
  const texts = root.querySelectorAll('.cin-text');
  let fs = Math.min(12, Wp / 22);
  const fit = () => texts.forEach(el => { el.style.fontSize = fs + 'px'; el.style.top = -el.dataset.i * h + 'px'; });
  fit();
  while (texts[0].scrollHeight > Hp - 6 && fs > 7) { fs -= .5; fit(); }
  for (const el of [envBack, env]) el.style.cssText = `left:${cx - We / 2}px;top:${cy - He / 2}px;width:${We}px;height:${He}px;opacity:0`;
  flapA.style.height = flapB.style.height = He * 70 / 114 + 'px';
  const sealR = We * .11, sealY = He * .6;
  seal.style.cssText = `left:${We / 2 - sealR}px;top:${sealY - sealR}px;width:${sealR * 2}px;height:${sealR * 2}px`;
  ring.style.cssText = `left:${We / 2 - sealR}px;top:${sealY - sealR}px;width:${sealR * 2}px;height:${sealR * 2}px`;
  shadow.style.cssText = `left:${cx - Wp * .45}px;top:${Math.min(H - 40, cy + Hp * .62)}px;width:${Wp * .9}px`;
  const S = Math.round(Math.min(176, W * .44));
  owl.style.cssText = `left:0;top:0;width:${S}px;height:${S}px`;
  if (owlImg) owl.append(owlImg);
  // フウロウの判の先（絵の中の 0.31, 0.74）が、封蝋の位置に来るところ。
  const ox1 = cx - .31 * S, oy1 = cy - He / 2 + sealY - .74 * S;
  const ox0 = W + 30, oy0 = oy1 - H * .3, ox2 = W - S * .9, oy2 = Math.min(H - S - 12, cy + He * .85);
  const fxc = particles($('.cin-fx'), W, H);
  const c1x = cx - W * .46, c1y = cy - H * .1;   // 飛ぶ道すじの曲がり角
  const T = scene ? 8.9 : 8.3;
  let stamped = false, arrived = false;

  const draw = (t, dt) => {
    // 1. 便せんが上がってきて、最後の語が戻る
    const rise = eOut(seg(t, 0, .9)), flat = eIO(seg(t, 2.3, 3));
    const fb = eIO(seg(t, 1.5, 2.2)), ft = eIO(seg(t, 2.1, 2.8));
    const a = eIO(seg(t, 2.8, 3.3)), b = eIO(seg(t, 3.3, 3.8)), c = eIO(seg(t, 3.75, 4.2));
    const f = seg(t, 5.3, 7), fe = eIO(f);
    const gl = Math.sin(Math.PI * seg(t, .8, 1.6));
    for (const el of lastWords) el.style.backgroundColor = `rgba(242,184,75,${.85 * gl})`;
    const bob = Math.sin(t * 2.1) * 4 * (1 - b);
    const py = (1 - rise) * H * .6 + bob - a * He * .78 * (1 - b);
    paper.style.opacity = t >= 4.2 ? 0 : seg(t, 0, .25);
    paper.style.transform = `translate3d(0,${py}px,0) perspective(900px) rotateX(${16 * (1 - flat)}deg) rotateZ(${-3 * (1 - flat)}deg) scale(${1 - .16 * a})`;
    // 2. 下の段、上の段の順に折る
    pBot.style.transform = `rotateX(${178 * fb}deg)`;
    pTop.style.transform = `translateZ(1.5px) rotateX(${-176 * ft}deg)`;
    shades[0].style.opacity = .3 * Math.sin(Math.PI * ft);
    shades[1].style.opacity = .16 * Math.max(Math.sin(Math.PI * fb), Math.sin(Math.PI * ft));
    shades[2].style.opacity = .3 * Math.sin(Math.PI * fb);
    shadow.style.opacity = rise * (1 - fe);
    shadow.style.transform = `scale(${lerp(1, .5, fb * .5 + ft * .5) * (1 - fe * .8)},1)`;
    // 3. 封筒に入り、ふたが閉じる
    const ang = 180 * (1 - c);
    flapA.style.opacity = ang > 90 ? 1 : 0;
    flapB.style.opacity = ang > 90 ? 0 : 1;
    flapA.style.transform = flapB.style.transform = `perspective(520px) rotateX(${ang}deg)`;
    // 4. フウロウが封蝋を押す
    const oin = eOut(seg(t, 4.0, 4.6)), press = Math.sin(Math.PI * seg(t, 4.6, 4.8)), oaway = eIO(seg(t, 4.95, 5.5));
    const owx = lerp(lerp(ox0, ox1, oin), ox2, oaway), owy = lerp(lerp(oy0, oy1 - 14, oin), oy2, oaway) + press * 14 - Math.sin(Math.PI * oaway) * 26;
    owl.style.opacity = seg(t, 4.0, 4.15) * (1 - seg(t, 7.5, 7.9));
    owl.style.transform = `translate3d(${owx}px,${owy}px,0) rotate(${lerp(-14, 0, oin) + press * 5}deg) scale(${1 - .14 * oaway})`;
    const sk = seg(t, 4.7, 4.98), hit = seg(t, 4.7, 5.2);
    seal.style.opacity = sk > 0 ? 1 : 0;
    seal.style.transform = `scale(${lerp(1.9, 1, eBack(sk))}) rotate(${lerp(-25, -8, sk)}deg)`;
    ring.style.opacity = hit > 0 && hit < 1 ? 1 - hit : 0;
    ring.style.transform = `scale(${1 + 2.2 * eOut(hit)})`;
    // 5. 坂の上へ飛ぶ
    const squash = Math.sin(Math.PI * seg(t, 4.66, 4.9)) * .06, crouch = Math.sin(Math.PI * seg(t, 5.05, 5.4));
    const u = 1 - fe, ex = u * u * cx + 2 * u * fe * c1x + fe * fe * dx, ey = u * u * cy + 2 * u * fe * c1y + fe * fe * dy;
    const es = (1 / (1 + fe * 9)) * (1 - .05 * crouch) * lerp(.9, 1, a);
    const etf = `translate3d(${ex - cx}px,${ey - cy + crouch * 9 + bob * (1 - b)}px,0) perspective(700px) rotateZ(${-16 * Math.sin(Math.PI * fe) + 4 * Math.sin(t * 7) * f}deg) rotateY(${Math.sin(t * 8) * 30 * Math.sin(Math.PI * fe)}deg) scale(${es},${es * (1 - squash)})`;
    env.style.transform = envBack.style.transform = etf;
    env.style.opacity = a * (1 - seg(f, .93, 1));
    envBack.style.opacity = t < 4.2 ? a : 0;
    world.style.transform = `scale(${1 + .03 * seg(t, 0, 5.3) + .2 * eIO(seg(t, 5.3, 7.3))})`;
    // 6. 窓に灯がともり、霧が少し晴れる
    const g = seg(t, 7, 7.9), lit = g < .15 ? g / .15 * .8 : g < .3 ? .8 - (g - .15) / .15 * .5 : .3 + (g - .3) / .7 * .7;
    glow.style.opacity = lit;
    glow.style.transform = `scale(${.35 + .65 * eOut(g) + .03 * Math.sin(t * 3)})`;
    core.style.opacity = lit;
    const clear = eIO(seg(t, 7.1, 8.4));
    veil.style.opacity = lerp(.95, .22, clear);
    dim.style.opacity = lerp(.62, .12, clear);
    fogs[0].style.opacity = lerp(.9, .4, clear);
    fogs[1].style.opacity = lerp(.8, .3, clear);
    // 7. 場面の文
    const sc = eOut(seg(t, 7.9, 8.6));
    panel.style.opacity = sc;
    panel.style.transform = `translate3d(0,${(1 - sc) * 26}px,0)`;

    if (dt > 0) {
      if (!stamped && t >= 4.7) { stamped = true; fxc.burst(cx, cy - He / 2 + sealY, 16, 150, SEAL, 5, 420); fxc.burst(cx, cy - He / 2 + sealY, 8, 90, '#f3ead8', 3, 300); }
      if (f > .04 && f < .95 && Math.random() < .8) fxc.add(ex + (Math.random() - .5) * We * es, ey + (Math.random() - .5) * He * es, (Math.random() - .5) * 20, 12 + Math.random() * 20, .7 + Math.random() * .5, 2 + 3 * es + Math.random() * 2, Math.random() < .7 ? '#f2b84b' : '#fbe6b4');
      if (!arrived && t >= 7) { arrived = true; fxc.burst(dx, dy, 22, 110, '#fbe6b4', 4, 60); }
      fxc.tick(dt);
    }
  };
  return run(root, {dur: T, draw, still, autoClose: scene ? 0 : 2.4});
}

/* ---------- 区の門：白紙卿のカードに1行が戻る ---------- */

// 行の上に紙と同じ色の覆いを置き、インクのしみが広がるところから穴をあけていく。下の本物の文字が、にじみ出るように見える。
function inkCover(en, color) {
  const pad = 10, r0 = en.getBoundingClientRect();
  const range = document.createRange();
  range.selectNodeContents(en);
  const rects = [...range.getClientRects()].filter(r => r.width > 1)
    .map(r => ({x: r.left - r0.left + pad, y: r.top - r0.top + pad, w: r.width, h: r.height}));
  const total = rects.reduce((s, r) => s + r.w, 0) || 1;
  const span = Math.min(2, .9 + total / 420);
  const blots = [];
  let run0 = 0;
  for (const r of rects) {
    const n = Math.ceil(r.w / 8);
    for (let k = 0; k < n; k++) {
      const x = r.x + (k + Math.random()) / n * r.w, y = r.y + r.h * (.5 + (Math.random() - .5) * .3);
      const t0 = (run0 + (x - r.x)) / total * span + Math.random() * .14, R = r.h * (.5 + Math.random() * .34);
      blots.push({x, y, t0, d: .75 + Math.random() * .3, r: R});
      if (Math.random() < .55) blots.push({x: x + (Math.random() - .5) * R, y: y + (Math.random() - .5) * r.h * .8, t0: t0 + .1 + Math.random() * .2, d: .7, r: R * .55});
    }
    run0 += r.w;
  }
  const dpr = Math.min(3, globalThis.devicePixelRatio || 1), cw = r0.width + pad * 2, ch = r0.height + pad * 2;
  const cv = document.createElement('canvas');
  cv.className = 'cin-ink';
  cv.width = Math.round(cw * dpr); cv.height = Math.round(ch * dpr);
  cv.style.cssText = `left:${-pad}px;top:${-pad}px;width:${cw}px;height:${ch}px`;
  const ctx = cv.getContext('2d');
  ctx.scale(dpr, dpr);
  const dot = stops => {
    const s = document.createElement('canvas'); s.width = s.height = 64;
    const x = s.getContext('2d'), gr = x.createRadialGradient(32, 32, 0, 32, 32, 32);
    stops.forEach(([o, c]) => gr.addColorStop(o, c));
    x.fillStyle = gr; x.fillRect(0, 0, 64, 64);
    return s;
  };
  const hole = dot([[0, '#000'], [.5, '#000'], [.8, 'rgba(0,0,0,.5)'], [1, 'rgba(0,0,0,0)']]);
  const stain = dot([[0, 'rgba(47,74,138,.9)'], [.55, 'rgba(47,74,138,.5)'], [1, 'rgba(47,74,138,0)']]);
  en.append(cv);
  return {
    span: span + 1.1,
    draw(p) {
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1;
      ctx.clearRect(0, 0, cw, ch);
      ctx.fillStyle = color;
      ctx.fillRect(0, 0, cw, ch);
      ctx.globalCompositeOperation = 'destination-out';
      for (const b of blots) {
        const ph = clamp((p - b.t0) / b.d);
        if (ph <= 0) continue;
        const r = b.r * eOut(ph);
        ctx.drawImage(hole, b.x - r, b.y - r, r * 2, r * 2);
      }
      ctx.globalCompositeOperation = 'source-over';
      for (const b of blots) {
        const ph = clamp((p - b.t0) / b.d);
        if (ph <= 0 || ph >= 1) continue;
        const r = b.r * eOut(ph) * 1.35 + 2;
        ctx.globalAlpha = .3 * (1 - ph) * Math.min(1, ph * 7);
        ctx.drawImage(stain, b.x - r, b.y - r, r * 2, r * 2);
      }
    },
    remove() { cv.remove(); },
    set opacity(v) { cv.style.opacity = v; },
  };
}

export async function playGateCard(container, {lines = [], newIndex = -1, ...opt} = {}) {
  const still = wantsStill(opt);
  const root = mount(container, 'cin-gate', '白紙卿のカード');
  const slots = Array.from({length: Math.max(6, lines.length)}, (_, i) => {
    const l = lines[i];
    if (!l) return '<li class="cin-gl empty"><i></i></li>';
    return `<li class="cin-gl ${i === newIndex ? 'new' : 'old'}"><span class="en" lang="en">${esc(l.en)}</span><span class="ja">${esc(l.ja)}</span></li>`;
  }).join('');
  root.innerHTML = `<div class="cin-fog"></div><div class="cin-fog b"></div><div class="cin-light"></div>
<div class="cin-card"><h3>Blank &amp; Co.</h3><ol>${slots}</ol></div><div class="cin-hint">タップで閉じる</div>`;
  container.append(root);
  const card = root.querySelector('.cin-card'), light = root.querySelector('.cin-light');
  const en = root.querySelector('.cin-gl.new .en'), ja = root.querySelector('.cin-gl.new .ja');
  const ink = en && !still ? inkCover(en, '#fdfcf7') : null;
  const t1 = 1.1, t2 = t1 + (ink ? ink.span : 0), T = t2 + .9;
  const full = lines.filter(Boolean).length >= 6;
  const draw = t => {
    const e = eOut(seg(t, 0, .95));
    card.style.opacity = seg(t, 0, .5);
    card.style.transform = `perspective(900px) translate3d(0,${(1 - e) * 44 + Math.sin(t * 1.3) * 2}px,0) rotateX(${22 * (1 - e)}deg) rotate(-1.2deg) scale(${.92 + .08 * e})`;
    if (en) {
      const p = t - t1, wet = 1 - seg(t, t2 - .7, t2 + .5);
      if (ink) { ink.draw(Math.max(0, p)); ink.opacity = 1 - seg(t, t2 - .35, t2); }
      en.style.textShadow = wet > .01 ? `0 0 ${(3.5 * wet).toFixed(2)}px rgba(47,74,138,${(.75 * wet).toFixed(2)})` : 'none';
      ja.style.opacity = seg(t, t2 - .2, t2 + .6);
    }
    light.style.opacity = full ? eIO(seg(t, t2 - .4, T)) : 0;
  };
  await run(root, {dur: T, draw, still});
  ink?.remove();
}

// 門のカードの後に一度だけ、扉の向こうの町を見せる。
export async function playGateOpen(container, {ward = 1, reduced, base = HOME} = {}) {
  const {GATE_RECTS, MAP_ART} = await import('../art/map-art.mjs');
  const ch = Number(ward), rect = GATE_RECTS[ch];
  if (!rect || !MAP_ART.gates.includes(ch)) return;
  const [x,y,w,h] = rect;
  const root = mount(container, 'cin-gate', '門の向こうへ');
  const url = name => `${base}art/${name}.webp`;
  root.innerHTML = `<img class="go-town" src="${url(`ward-${ch}`)}" alt=""><img class="go-next" src="${url(ch<6 ? `ward-${ch+1}` : 'house-48')}" alt="">
    <div class="go-light"></div><div class="go-gate"><img class="go-frame" src="${url(`gate-${ch}`)}" alt="">
    ${['l','r'].map((side,i)=>`<div class="go-door" style="left:${(x+i*w/2)*100}%;top:${y*100}%;width:${w*50}%;height:${h*100}%;transform-origin:${i?'right':'left'} center"><img src="${url(`gate-${ch}-door-${side}`)}" alt=""><i></i></div>`).join('')}
    <b class="go-card">●</b></div>${Array.from({length:6},(_,i)=>`<div class="go-fog" style="top:${30+i*8}%"></div>`).join('')}
    <div class="go-tag">${ch<6 ? `${ch+1}区　${['朝市','商店街','倉庫街','役場','ホテル通り','灯台岬'][ch]}` : '灯台岬の光'}</div><div class="cin-hint">タップで閉じる</div>`;
  const style=document.createElement('style'); style.textContent=`
    .go-town,.go-next{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}.go-next{opacity:0}
    .go-gate{position:absolute;width:86%;aspect-ratio:1;left:7%;top:20%;perspective:900px}.go-frame{position:absolute;inset:0;width:100%;height:100%}
    .go-door{position:absolute;transform-style:preserve-3d}.go-door img,.go-door i{position:absolute;inset:0;width:100%;height:100%}.go-door i{background:#1f2a44;opacity:0}
    .go-card{position:absolute;left:48%;top:60%;padding:8px 3px;background:#fff9ed;color:#c8462f;font-size:9px;transform:rotate(4deg)}
    .go-fog{position:absolute;left:-20%;width:140%;height:35%;background:radial-gradient(ellipse,#dde5e8 15%,transparent 70%);pointer-events:none}
    .go-light{position:absolute;left:35%;top:50%;width:30%;height:50%;background:linear-gradient(#f2b84baa,transparent);transform-origin:top}
    .go-tag{position:absolute;bottom:16%;left:20%;width:60%;padding:12px;border:2px solid #1f2a44;background:#fff9ed;text-align:center;font-weight:bold}.cin-gate .cin-hint{position:absolute;bottom:6%}`;
  root.append(style); container.append(root);
  const doors=[...root.querySelectorAll('.go-door')], fog=[...root.querySelectorAll('.go-fog')];
  const draw=t=>{
    const opening=eIO(seg(t,.5,1.9)), clearing=seg(t,1.2,2.6);
    doors.forEach((door,i)=>{door.style.transform=`rotateY(${opening*(i?108:-108)}deg)`;door.querySelector('i').style.opacity=opening>90/108?1:0;});
    const card=root.querySelector('.go-card'),fall=seg(t,.3,1.3);card.style.transform=`translateY(${fall*230}px) rotate(${4+fall*110}deg)`;card.style.opacity=1-fall;
    fog.forEach((el,i)=>{el.style.transform=`translateX(${clearing*(i%2?70:-70)}%)`;el.style.opacity=.8*(1-clearing);});
    root.querySelector('.go-next').style.opacity=clearing;root.querySelector('.go-light').style.transform=`scaleY(${opening})`;
    root.querySelector('.go-tag').style.opacity=seg(t,2.6,3.2);
  };
  await run(root,{dur:3.2,draw,still:wantsStill({reduced})});
}
