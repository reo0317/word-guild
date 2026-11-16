// 霧晴れ郵便局 — タイトル画面の絵（試作）
// 木版画風：限られた5色、紺の輪郭線（裏返しの殻）、べた塗りの段階陰、すやり霞、紙のざらつき。
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const MODELS = '../../3d/models/out/';
const HEX = { navy: 0x1f2a44, mist: 0x9fb3bf, paper: 0xf3ead8, lamp: 0xe7b04a, red: 0xc8462f };
const col = (hex) => new THREE.Color(hex);
const mix = (a, b, t) => col(a).lerp(col(b), t);
const C = {
  navy: col(HEX.navy), mist: col(HEX.mist), paper: col(HEX.paper), lamp: col(HEX.lamp), red: col(HEX.red),
  navyMist: mix(HEX.navy, HEX.mist, 0.5),     // 中間の藍
  mistDeep: mix(HEX.mist, HEX.navy, 0.22),    // 濃い霧
  mistPale: mix(HEX.mist, HEX.paper, 0.5),    // 淡い霧
  paperShade: mix(HEX.paper, HEX.mist, 0.6),  // 紙の陰
  redShade: mix(HEX.red, HEX.navy, 0.45),
};

const stage = document.getElementById('stage');
const canvas = document.getElementById('view');
const statusEl = document.getElementById('status');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// ---------------------------------------------------------------- 乱数（配置を毎回同じにする）
let seed = 20261116;
const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
const rr = (a, b) => a + (b - a) * rnd();

// ---------------------------------------------------------------- レンダラーとカメラ
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'low-power' });
renderer.setClearColor(C.mist);
const scene = new THREE.Scene();
const FOV = 44;
const camera = new THREE.PerspectiveCamera(FOV, 390 / 844, 0.5, 400);
camera.position.set(0.5, 3.55, 6.6);
const CAM_TARGET = new THREE.Vector3(0.1, 0.2, -8);
camera.lookAt(CAM_TARGET);

const uPx = { value: 1 };                       // 彫り線の太さを画素密度にそろえる
const LIGHT = new THREE.Vector3(-0.55, 0.72, 0.5).normalize(); // 左手前上からの光

// 坂：手前（+z）が上、奥（-z）が下。坂の下は郵便局前の平らな広場。
const SLOPE = 0.3, FLAT_Z = -9.4, SEA_Y = -4.0;
const groundY = (z) => SLOPE * Math.max(z, FLAT_Z);
// 奥へ行くほど霧の色を足す（面ごとに一定＝べた塗りのまま淡くなる）
const mistAt = (z) => Math.min(0.72, Math.max(0, Math.round(((-z - 3) / 60) * 12) / 12));

// ---------------------------------------------------------------- 素材
const flatCache = new Map();
function flat(color, mist = 0, opts = {}) {
  const c = col(color).lerp(C.mist, mist);
  const key = c.getHexString() + JSON.stringify(opts);
  if (!flatCache.has(key)) flatCache.set(key, new THREE.MeshBasicMaterial({ color: c, ...opts }));
  return flatCache.get(key);
}

// 版画の面：光の当たる面はべた、陰の面は別の色のべた＋斜めの彫り線
const PRINT_VERT = /* glsl */`
  varying vec3 vN;
  void main() {
    vN = normalize(mat3(modelMatrix) * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }`;
const PRINT_FRAG = /* glsl */`
  uniform vec3 uColor, uShade, uInk, uMist, uLight;
  uniform float uMistAmt, uHatch, uPx;
  varying vec3 vN;
  void main() {
    float lit = step(0.1, dot(normalize(vN), uLight));
    vec3 c = mix(uShade, uColor, lit);
    float h = step(0.6, fract((gl_FragCoord.x + gl_FragCoord.y) / (6.0 * uPx)));
    c = mix(c, uInk, h * uHatch * (1.0 - lit));
    c = mix(c, uMist, uMistAmt);
    gl_FragColor = vec4(c, 1.0);
    #include <colorspace_fragment>
  }`;
const printCache = new Map();
function print(color, shade, mist = 0, hatch = 0.55) {
  const key = [col(color).getHexString(), col(shade).getHexString(), mist, hatch].join('|');
  if (!printCache.has(key)) {
    printCache.set(key, new THREE.ShaderMaterial({
      vertexShader: PRINT_VERT, fragmentShader: PRINT_FRAG,
      uniforms: {
        uColor: { value: col(color) }, uShade: { value: col(shade) }, uInk: { value: C.navy },
        uMist: { value: C.mist }, uLight: { value: LIGHT },
        uMistAmt: { value: mist }, uHatch: { value: hatch }, uPx,
      },
    }));
  }
  return printCache.get(key);
}

// 背景用の輪郭：少し大きい裏返しの殻を紺で刷る
function outline(mesh, t = 0.05, mist = 0) {
  const g = mesh.geometry;
  if (!g.boundingBox) g.computeBoundingBox();
  const size = g.boundingBox.getSize(new THREE.Vector3());
  const center = g.boundingBox.getCenter(new THREE.Vector3());
  const hull = new THREE.Mesh(g, flat(C.navy, mist * 0.8, { side: THREE.BackSide }));
  const s = new THREE.Vector3(
    size.x > 1e-4 ? 1 + (2 * t) / size.x : 1,
    size.y > 1e-4 ? 1 + (2 * t) / size.y : 1,
    size.z > 1e-4 ? 1 + (2 * t) / size.z : 1);
  hull.scale.copy(s);
  hull.position.set(center.x * (1 - s.x), center.y * (1 - s.y), center.z * (1 - s.z));
  mesh.add(hull);
  return mesh;
}

function add(parent, geo, mat, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(geo, mat);
  m.position.set(x, y, z);
  parent.add(m);
  return m;
}

// 切妻屋根（棟は x 方向）
function gableGeo(w, h, d) {
  const a0 = [-w / 2, 0, d / 2], b0 = [-w / 2, 0, -d / 2], c0 = [-w / 2, h, 0];
  const a1 = [w / 2, 0, d / 2], b1 = [w / 2, 0, -d / 2], c1 = [w / 2, h, 0];
  const tris = [a0, a1, c1, a0, c1, c0, b1, b0, c0, b1, c0, c1, b0, a0, c0, a1, b1, c1, a0, b0, b1, a0, b1, a1];
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(tris.flat(), 3));
  g.computeVertexNormals();
  return g;
}

// すやり霞：両端の丸い横棒を重ねた霧
function barGeo(len, h) {
  const r = h / 2, s = new THREE.Shape();
  s.moveTo(-len / 2 + r, -r);
  s.lineTo(len / 2 - r, -r);
  s.absarc(len / 2 - r, 0, r, -Math.PI / 2, Math.PI / 2, false);
  s.lineTo(-len / 2 + r, r);
  s.absarc(-len / 2 + r, 0, r, Math.PI / 2, Math.PI * 1.5, false);
  return new THREE.ShapeGeometry(s, 6);
}
const drifting = [];
function mistBand(x, y, z, len, h, color, n = 3, amp = 0.6) {
  const g = new THREE.Group();
  for (let i = 0; i < n; i++) {
    const l = len * rr(0.45, 1), hh = h * rr(0.7, 1);
    add(g, barGeo(l, hh), flat(color), (rnd() - 0.5) * len * 0.5, (i - (n - 1) / 2) * h * 0.72, i * 0.01);
  }
  g.position.set(x, y, z);
  scene.add(g);
  drifting.push({ g, x, amp: amp * rr(0.6, 1.2), sp: rr(0.05, 0.11), ph: rnd() * 6.28 });
  return g;
}

// ---------------------------------------------------------------- 小さな版木（Canvas のテクスチャ）
function canvasTex(w, h, draw, repeat) {
  const cv = document.createElement('canvas');
  cv.width = w; cv.height = h;
  draw(cv.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(repeat[0], repeat[1]); }
  return t;
}
const css = (c) => '#' + col(c).getHexString();

// 石だたみ：紙の地に紺の目地、ところどころ霧色の石
function cobbleTex(repY) {
  return canvasTex(512, 512, (g, w, h) => {
    g.scale(2, 2); w /= 2; h /= 2;
    g.fillStyle = css(C.paper); g.fillRect(0, 0, w, h);
    const rows = 8, rh = h / rows;
    g.lineJoin = 'round';
    for (let r = 0; r < rows; r++) {
      const n = 5, off = (r % 2) * (w / n / 2);
      for (let i = -1; i < n + 1; i++) {
        const x = i * (w / n) + off + rr(-3, 3), y = r * rh, ww = w / n - 5, hh = rh - 5;
        const p = rnd();
        if (p < 0.22) { g.fillStyle = css(C.paperShade); g.fillRect(x + 3, y + 3, ww, hh); }
        else if (p < 0.3) { g.fillStyle = css(C.mist); g.fillRect(x + 3, y + 3, ww, hh); }
        g.strokeStyle = css(C.navy); g.lineWidth = 2.6;
        g.beginPath();
        g.moveTo(x + 6, y + 3); g.lineTo(x + ww - 2, y + 3 + rr(-1, 1));
        g.lineTo(x + ww + 1, y + hh - 1); g.lineTo(x + 5, y + hh + rr(-1, 1)); g.closePath();
        g.stroke();
        // 石のかけ・すり傷
        if (rnd() < 0.5) { g.lineWidth = 1.6; g.beginPath(); const sx = x + rr(10, ww - 16), sy = y + rr(9, hh - 8); g.moveTo(sx, sy); g.lineTo(sx + rr(6, 14), sy + rr(-2, 2)); g.stroke(); }
      }
    }
  }, [1, repY]);
}

// 〒 の丸看板
function signTex() {
  return canvasTex(128, 128, (g, w) => {
    g.fillStyle = css(C.red); g.fillRect(0, 0, w, w);
    g.strokeStyle = css(C.paper); g.lineWidth = 5; g.beginPath(); g.arc(64, 64, 52, 0, 7); g.stroke();
    g.fillStyle = css(C.paper);
    g.fillRect(34, 36, 60, 11); g.fillRect(28, 56, 72, 11); g.fillRect(58, 56, 12, 44);
  });
}

// 看板の文字らしき彫り跡
function boardTex() {
  return canvasTex(256, 48, (g, w, h) => {
    g.fillStyle = css(C.paper); g.fillRect(0, 0, w, h);
    g.strokeStyle = css(C.navy); g.lineWidth = 4; g.strokeRect(3, 3, w - 6, h - 6);
    g.fillStyle = css(C.navy);
    g.font = '700 27px "Hiragino Mincho ProN","Yu Mincho","Noto Serif JP",serif';
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText('霧 晴 れ 郵 便 局', w / 2, h / 2 + 1);
  });
}

// ---------------------------------------------------------------- 背景
function buildSky() {
  const Z = -170;
  // 夜明け前：上は紺のべた、中ほどは霧、水平線のきわだけ紙の色（明けはじめ）
  add(scene, new THREE.PlaneGeometry(600, 60), flat(C.navy), 0, 42.4, Z);
  add(scene, new THREE.PlaneGeometry(600, 40), flat(C.mist), 0, 12, Z - 1);
  add(scene, new THREE.PlaneGeometry(600, 7), flat(C.mistPale), 0, 6.5, Z + 0.2);
  add(scene, new THREE.PlaneGeometry(600, 5.2), flat(C.paper), 0, 2.4, Z + 0.4);
  // 紺の空のへりを、すやり霞の形でくずす
  for (let i = 0; i < 9; i++) {
    const m = add(scene, barGeo(rr(30, 80), rr(1.3, 2.2)), flat(C.navy), rr(-60, 60), 13.2 - rr(0, 1.5), Z + 0.6);
    m.position.y -= i % 3 === 0 ? 1.0 : 0;
  }
  for (let i = 0; i < 6; i++) add(scene, barGeo(rr(16, 40), rr(0.7, 1.1)), flat(C.mist), rr(-40, 40), 14.4 + rr(0, 2.2), Z + 0.8);
  for (let i = 0; i < 5; i++) add(scene, barGeo(rr(30, 70), rr(1, 1.8)), flat(C.paper), rr(-70, 70), 5.6 + rr(0, 2.6), Z + 0.9);
  for (let i = 0; i < 5; i++) add(scene, barGeo(rr(24, 60), rr(1, 1.6)), flat(C.mistPale), rr(-70, 70), 9.5 + rr(0, 4), Z + 0.9);
  // 残り星（紙の白抜き）
  const star = new THREE.CircleGeometry(0.2, 5);
  for (let i = 0; i < 22; i++) add(scene, star, flat(C.paper), rr(-36, 36), rr(18, 33), Z + 1).rotation.z = rnd() * 6;
}

function buildSea() {
  const sea = add(scene, new THREE.PlaneGeometry(600, 190).rotateX(-Math.PI / 2), flat(C.navyMist, 0.12), 0, SEA_Y, -108);
  sea.renderOrder = -2;
  // 沖は霧に溶ける：べたの帯を2段
  add(scene, new THREE.PlaneGeometry(600, 60).rotateX(-Math.PI / 2), flat(C.navyMist, 0.45), 0, SEA_Y + 0.02, -150);
  add(scene, new THREE.PlaneGeometry(600, 28).rotateX(-Math.PI / 2), flat(C.navyMist, 0.72), 0, SEA_Y + 0.04, -178);
  // 波：紙の色の短い横線（白抜き）
  const N = 90, wave = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2), flat(C.paper, 0.15), N);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), p = new THREE.Vector3(), s = new THREE.Vector3();
  for (let i = 0; i < N; i++) {
    const z = -16 - Math.pow(rnd(), 1.4) * 120;
    const k = 1 + (-z - 16) / 40;
    p.set(rr(-1, 1) * (14 + (-z) * 0.55), SEA_Y + 0.06, z);
    s.set(rr(0.8, 2.4) * k, 1, rr(0.1, 0.16) * k);
    wave.setMatrixAt(i, m4.compose(p, q, s));
  }
  scene.add(wave);
}

// 遠くの家並みの影絵
function roofline(x0, x1, base, z, color, hMin, hMax) {
  const s = new THREE.Shape();
  s.moveTo(x0, base - 6);
  s.lineTo(x0, base);
  let x = x0;
  while (x < x1) {
    const w = rr(1.6, 3.4), h = rr(hMin, hMax), peak = rr(0.5, 1.1);
    if (rnd() < 0.7) { s.lineTo(x, base + h); s.lineTo(x + w / 2, base + h + peak); s.lineTo(x + w, base + h); }
    else { s.lineTo(x, base + h + peak * 0.5); s.lineTo(x + w, base + h + peak * 0.5); }
    s.lineTo(x + w, base + rr(0, hMin * 0.6));
    x += w + rr(0, 0.5);
  }
  s.lineTo(x, base - 6);
  const m = add(scene, new THREE.ShapeGeometry(s), flat(color), 0, 0, z);
  return m;
}

function buildFar() {
  // 向こう岸の山なみ
  const hill = (pts, z, color) => {
    const s = new THREE.Shape(); s.moveTo(pts[0][0], SEA_Y - 2);
    pts.forEach(([x, y]) => s.lineTo(x, SEA_Y + y));
    s.lineTo(pts[pts.length - 1][0], SEA_Y - 2);
    return add(scene, new THREE.ShapeGeometry(s), flat(color), 0, 0, z);
  };
  hill([[-160, 0], [-120, 9], [-92, 13], [-70, 8], [-48, 11], [-20, 4], [0, 0]], -160, mix(HEX.mist, HEX.navy, 0.3));
  hill([[20, 0], [50, 6], [78, 14], [100, 9], [130, 12], [170, 0]], -158, mix(HEX.mist, HEX.navy, 0.24));
  // 灯台の岬
  hill([[-40, 0], [-26, 1.4], [-15, 2.6], [-9.5, 3.1], [-6.2, 3.0], [-3.6, 1.5], [-1.2, 0]], -56.5, mix(HEX.navy, HEX.mist, 0.5));
  mistBand(-16, SEA_Y + 0.7, -55.6, 24, 0.9, C.mistPale, 3, 1.6);

  // 入り江をかこむ下の町（左右）
  roofline(-34, -4.2, SEA_Y + 0.6, -27, mix(HEX.navy, HEX.mist, 0.62), 1.2, 3.2);
  roofline(6.5, 36, SEA_Y + 0.6, -26, mix(HEX.navy, HEX.mist, 0.66), 1.2, 3.4);
  roofline(-30, -3.2, SEA_Y + 0.4, -19, mix(HEX.navy, HEX.mist, 0.4), 1.4, 3.0);
  roofline(5.2, 30, SEA_Y + 0.4, -18.5, mix(HEX.navy, HEX.mist, 0.45), 1.4, 3.2);
  mistBand(-12, SEA_Y + 1.5, -23, 22, 1.0, C.mistPale, 3, 1.4);
  mistBand(14, SEA_Y + 2.2, -22, 20, 0.9, C.paper, 2, 1.4);

  // 帆かけ舟
  const boat = (x, z, k) => {
    const g = new THREE.Group(); g.position.set(x, SEA_Y, z); g.scale.setScalar(k); scene.add(g);
    const hull = new THREE.Shape(); hull.moveTo(-1.3, 0.5); hull.lineTo(1.5, 0.5); hull.lineTo(1.0, 0); hull.lineTo(-0.9, 0);
    add(g, new THREE.ShapeGeometry(hull), flat(C.navy, 0.35));
    const sail = new THREE.Shape(); sail.moveTo(0.1, 0.7); sail.lineTo(0.1, 3.0); sail.lineTo(1.25, 0.7);
    add(g, new THREE.ShapeGeometry(sail), flat(C.paper, 0.1));
    const sail2 = new THREE.Shape(); sail2.moveTo(-0.1, 0.7); sail2.lineTo(-0.1, 2.4); sail2.lineTo(-0.95, 0.7);
    add(g, new THREE.ShapeGeometry(sail2), flat(C.paperShade, 0.1));
  };
  boat(7.5, -46, 1.0); boat(3.2, -72, 1.1); boat(15, -90, 1.6);
}

let beacon = null;
function buildLighthouse() {
  const g = new THREE.Group();
  g.position.set(-7.6, SEA_Y + 2.9, -56);
  g.scale.setScalar(0.66);
  scene.add(g);
  const m = 0.3;
  outline(add(g, new THREE.CylinderGeometry(0.85, 1.35, 7.2, 10), print(C.paper, C.paperShade, m, 0.5), 0, 3.6, 0), 0.16, m);
  add(g, new THREE.CylinderGeometry(1.03, 1.16, 1.5, 10), print(C.red, C.redShade, m, 0.4), 0, 4.2, 0);
  add(g, new THREE.CylinderGeometry(1.24, 1.32, 1.3, 10), print(C.red, C.redShade, m, 0.4), 0, 1.3, 0);
  outline(add(g, new THREE.CylinderGeometry(1.3, 1.3, 0.3, 10), flat(C.navy, m), 0, 7.3, 0), 0.05, m);
  add(g, new THREE.CylinderGeometry(0.7, 0.7, 1.2, 8), flat(C.lamp), 0, 8.05, 0);
  outline(add(g, new THREE.ConeGeometry(1.05, 1.0, 8), flat(C.navy, m), 0, 9.15, 0), 0.05, m);
  // 灯：べた塗りの光の輪と光の帯（ぼかさない）
  beacon = new THREE.Group(); beacon.position.set(0, 8.05, 0.5); g.add(beacon);
  const ring = (r0, r1, c, o) => add(beacon, new THREE.RingGeometry(r0, r1, 28), flat(c, 0, { transparent: true, opacity: o, depthWrite: false }));
  ring(0, 1.9, C.lamp, 0.95); ring(2.5, 3.0, C.lamp, 0.8); ring(3.9, 4.15, C.paper, 0.7);
  const beam = (dir, len, spread, c, o) => {
    const s = new THREE.Shape(); s.moveTo(0, 0.25); s.lineTo(dir * len, spread); s.lineTo(dir * len, -spread * 0.55); s.lineTo(0, -0.25);
    const b = add(beacon, new THREE.ShapeGeometry(s), flat(c, 0, { transparent: true, opacity: o, depthWrite: false, side: THREE.DoubleSide }), 0, 0, -0.2);
    return b;
  };
  beacon.userData.beams = [beam(1, 46, 4.6, C.lamp, 0.5), beam(1, 46, 2.0, C.paper, 0.5), beam(-1, 15, 1.8, C.lamp, 0.45)];
}

function windowAt(parent, x, y, z, ry, w, h, lit, mist) {
  const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = ry; parent.add(g);
  add(g, new THREE.PlaneGeometry(w + 0.14, h + 0.14), flat(C.navy, mist * 0.8), 0, 0, 0.02);
  add(g, new THREE.PlaneGeometry(w, h), flat(lit ? C.lamp : C.navyMist, lit ? mist * 0.3 : mist), 0, 0, 0.035);
  add(g, new THREE.PlaneGeometry(0.05, h), flat(C.navy, mist * 0.8), 0, 0, 0.045);
  add(g, new THREE.PlaneGeometry(w, 0.05), flat(C.navy, mist * 0.8), 0, 0.02, 0.045);
  return g;
}

// 坂の家：箱＋切妻屋根。地面の下までのばして段差をかくす
function house({ side, z, w = 2.6, h = 2.6, d = 2.6, roof = 'navy', ridge = 'z', lit = false, gap = 1.42, wall = C.paper }) {
  const m = mistAt(z), gy = groundY(z), x = side * (gap + w / 2);
  const g = new THREE.Group(); g.position.set(x, gy, z); scene.add(g);
  const T = 0.06 + m * 0.05;
  outline(add(g, new THREE.BoxGeometry(w, h + 2.4, d), print(wall, C.paperShade, m), 0, (h - 2.4) / 2, 0), T, m);
  const rc = roof === 'red' ? [C.red, C.redShade] : roof === 'mist' ? [C.mistDeep, C.navyMist] : [C.navyMist, C.navy];
  const rh = rr(0.9, 1.3);
  const rg = ridge === 'x' ? gableGeo(w + 0.5, rh, d + 0.5) : gableGeo(d + 0.5, rh, w + 0.5).rotateY(Math.PI / 2);
  outline(add(g, rg, print(rc[0], rc[1], m, 0.35), 0, h, 0), T, m);
  // 軒の線
  add(g, new THREE.BoxGeometry(w + 0.56, 0.1, d + 0.56), flat(C.navy, m * 0.8), 0, h, 0);
  // 窓：坂の上を向く面と、道を向く面
  const wy = h * 0.58;
  windowAt(g, -w * 0.22, wy, d / 2, 0, 0.5, 0.66, lit, m);
  windowAt(g, w * 0.22, wy, d / 2, 0, 0.5, 0.66, lit && rnd() < 0.5, m);
  windowAt(g, -side * w / 2, wy, d * 0.18, -side * Math.PI / 2, 0.5, 0.66, lit && rnd() < 0.6, m);
  // 腰板：紺の横線と霧色の帯（面の抜き）
  add(g, new THREE.PlaneGeometry(w, 0.07), flat(C.navy, m * 0.8), 0, h * 0.26, d / 2 + 0.02);
  if (rnd() < 0.6) outline(add(g, new THREE.BoxGeometry(0.36, 0.9, 0.36), print(C.paperShade, C.navyMist, m), -side * w * 0.2, h + rh * 0.75, -d * 0.15), 0.04, m);
  return g;
}

function buildStreet() {
  // 地面（道の両わきの斜面）と道
  const slopeGeo = (x0, x1, z0, z1) => {
    const g = new THREE.BufferGeometry();
    const y0 = groundY(z0), y1 = groundY(z1);
    g.setAttribute('position', new THREE.Float32BufferAttribute([x0, y0, z0, x1, y0, z0, x1, y1, z1, x0, y0, z0, x1, y1, z1, x0, y1, z1], 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute([0, 0, 1, 0, 1, 1, 0, 0, 1, 1, 0, 1], 2));
    g.computeVertexNormals();
    return g;
  };
  const RW = 1.3, Z0 = 12, L = Z0 - FLAT_Z;
  add(scene, slopeGeo(-40, 40, Z0, FLAT_Z), flat(C.mistDeep), 0, -0.03, 0);
  add(scene, slopeGeo(-RW, RW, Z0, FLAT_Z), new THREE.MeshBasicMaterial({ map: cobbleTex(L / (RW * 2) * 1.25) }));
  // 道のへり：太い紺の線と、紙色の縁石
  for (const s of [-1, 1]) {
    add(scene, slopeGeo(s * RW - 0.05, s * RW + 0.05, Z0, FLAT_Z), flat(C.navy), 0, 0.012, 0);
    add(scene, slopeGeo(s * (RW + 0.1) - 0.06, s * (RW + 0.1) + 0.06, Z0, FLAT_Z), flat(C.paperShade), 0, 0.01, 0);
  }
  // 坂の下の広場（石だたみは霧色のべた＋目地の線）
  const py = groundY(FLAT_Z);
  add(scene, new THREE.PlaneGeometry(80, 5.2).rotateX(-Math.PI / 2), flat(C.paperShade, 0.1), 0, py - 0.01, FLAT_Z - 2.6);
  for (let i = 0; i < 4; i++) add(scene, new THREE.PlaneGeometry(14, 0.035).rotateX(-Math.PI / 2), flat(C.navy, 0.25), 0.4, py, FLAT_Z - 0.25 - i * 0.42);
  // 岸壁
  outline(add(scene, new THREE.BoxGeometry(80, 2.2, 0.6), print(C.paperShade, C.navyMist, 0.2), 0, py - 1.1, FLAT_Z - 5.4), 0.06, 0.2);

  // 家並み（右・左）。下るほど霧で淡く
  house({ side: 1, z: 3.4, w: 2.8, h: 3.0, roof: 'navy' });
  house({ side: 1, z: 0.2, w: 2.5, h: 2.5, roof: 'red', ridge: 'x' });
  house({ side: 1, z: -2.9, w: 2.7, h: 2.8, roof: 'navy', lit: true });
  house({ side: 1, z: -6.0, w: 2.6, h: 2.4, roof: 'mist', ridge: 'x', gap: 1.5 });
  house({ side: -1, z: 4.4, w: 2.8, h: 3.2, roof: 'red' });
  house({ side: -1, z: 1.3, w: 2.6, h: 2.7, roof: 'navy', ridge: 'x' });
  house({ side: -1, z: -1.8, w: 2.6, h: 2.5, roof: 'mist', lit: true });
  house({ side: -1, z: -4.9, w: 2.8, h: 2.9, roof: 'navy', ridge: 'x' });
  house({ side: -1, z: -8.0, w: 2.5, h: 2.3, roof: 'red', gap: 1.6 });
  // 二列目（屋根だけのぞく）
  for (const s of [-1, 1]) for (let i = 0; i < 4; i++) {
    house({ side: s, z: 2.5 - i * 3.3 + s * 0.6, w: 2.8, h: 3.4 + rr(0, 0.8), roof: i % 2 ? 'navy' : 'mist', ridge: i % 2 ? 'x' : 'z', gap: 4.6 });
  }

  // 街灯（坂の途中、灯の色のべた）
  const lampPost = (x, z) => {
    const g = new THREE.Group(); g.position.set(x, groundY(z), z); scene.add(g);
    const m = mistAt(z);
    add(g, new THREE.CylinderGeometry(0.045, 0.06, 2.3, 6), flat(C.navy, m), 0, 1.15, 0);
    add(g, new THREE.BoxGeometry(0.5, 0.05, 0.05), flat(C.navy, m), -Math.sign(x) * 0.2, 2.2, 0);
    outline(add(g, new THREE.BoxGeometry(0.26, 0.34, 0.26), flat(C.lamp), -Math.sign(x) * 0.4, 1.98, 0), 0.035, m);
    add(g, new THREE.ConeGeometry(0.26, 0.16, 4).rotateY(Math.PI / 4), flat(C.navy, m), -Math.sign(x) * 0.4, 2.24, 0);
    add(g, new THREE.CircleGeometry(0.52, 20), flat(C.lamp, 0, { transparent: true, opacity: 0.32, depthWrite: false }), -Math.sign(x) * 0.4, 1.98, -0.2);
  };
  lampPost(-1.52, -5.8);
}

function buildPostOffice() {
  const z = -12.2, gy = groundY(z), m = 0.08;
  const g = new THREE.Group(); g.position.set(0.55, gy, z); scene.add(g);
  const W = 5.0, H = 2.75, D = 3.0, F = D / 2;
  outline(add(g, new THREE.BoxGeometry(W, H + 1, D), print(C.paper, C.paperShade, m), 0, (H - 1) / 2, 0), 0.07, m);
  outline(add(g, gableGeo(W + 0.7, 1.25, D + 0.8), print(C.red, C.redShade, m, 0.4), 0, H, 0), 0.07, m);
  add(g, new THREE.BoxGeometry(W + 0.76, 0.12, D + 0.86), flat(C.navy, m), 0, H, 0);
  // 瓦の線
  for (let i = 1; i < 4; i++) {
    const t = i / 4;
    add(g, new THREE.BoxGeometry(W + 0.7 - 0.1, 0.035, 0.035), flat(C.navy, m), 0, H + 1.25 * t + 0.03, (D + 0.8) / 2 * (1 - t) + 0.02);
  }
  // 〒 の丸看板
  const sign = add(g, new THREE.CircleGeometry(0.5, 24), new THREE.MeshBasicMaterial({ map: signTex() }), 0, H - 0.42, F + 0.06);
  add(g, new THREE.CircleGeometry(0.57, 24), flat(C.navy), 0, H - 0.42, F + 0.05);
  sign.renderOrder = 1;
  // 看板
  add(g, new THREE.PlaneGeometry(2.9, 0.54), new THREE.MeshBasicMaterial({ map: boardTex() }), 0, H - 1.25, F + 0.06);
  // 戸口：灯の色で明るく抜く（局長の後ろ）
  add(g, new THREE.PlaneGeometry(1.3, 1.92), flat(C.navy), 0, 0.92, F + 0.03);
  add(g, new THREE.PlaneGeometry(1.08, 1.76), flat(C.lamp), 0, 0.88, F + 0.045);
  add(g, new THREE.PlaneGeometry(0.05, 1.76), flat(C.navy), 0, 0.88, F + 0.055);
  // 窓
  for (const sx of [-1, 1]) {
    windowAt(g, sx * 1.75, 1.2, F, 0, 0.86, 1.0, true, 0);
    add(g, new THREE.BoxGeometry(1.12, 0.09, 0.16), flat(C.navy), sx * 1.75, 0.6, F + 0.08);
  }
  add(g, new THREE.PlaneGeometry(W, 0.07), flat(C.navy, m), 0, 0.42, F + 0.02);
  // 石段
  outline(add(g, new THREE.BoxGeometry(2.0, 0.16, 0.5), print(C.paper, C.paperShade, 0), 0, 0.08, F + 0.25), 0.03);
  // 戸口から道へ落ちる灯：べた塗りの台形
  const glow = new THREE.Shape(); glow.moveTo(-0.55, 0); glow.lineTo(0.55, 0); glow.lineTo(1.25, 1.9); glow.lineTo(-1.25, 1.9);
  add(g, new THREE.ShapeGeometry(glow).rotateX(Math.PI / 2), flat(C.lamp, 0, { transparent: true, opacity: 0.42, depthWrite: false, side: THREE.DoubleSide }), 0, 0.012, F + 0.5);
  // 丸い郵便ポスト（朱）
  const px = 2.15, pz = F + 0.75;
  outline(add(g, new THREE.CylinderGeometry(0.25, 0.25, 0.95, 12), print(C.red, C.redShade, 0, 0.4), px, 0.475, pz), 0.04);
  outline(add(g, new THREE.CylinderGeometry(0.31, 0.31, 0.1, 12), print(C.red, C.redShade, 0, 0.4), px, 1.0, pz), 0.035);
  outline(add(g, new THREE.SphereGeometry(0.26, 12, 6, 0, 6.3, 0, 1.57), print(C.red, C.redShade, 0, 0.4), px, 1.03, pz), 0.035);
  add(g, new THREE.PlaneGeometry(0.26, 0.05), flat(C.navy), px, 0.74, pz + 0.255);
  // 局の裏の霧
  mistBand(-3.5, gy + 1.0, z - 3.2, 14, 0.8, C.mistPale, 3, 0.9);
  mistBand(6.5, gy + 2.2, z - 4.5, 12, 0.7, C.paper, 2, 0.9);
}

function buildMist() {
  // 坂をよこぎる霧（手前ほど紙の色、奥は霧色）
  mistBand(-3.4, groundY(-6.5) + 1.0, -7.0, 5.5, 0.38, C.paper, 3, 0.45);
  mistBand(4.0, groundY(-5) + 1.9, -5.4, 5.0, 0.36, C.mistPale, 2, 0.45);
  mistBand(-3.2, groundY(-2.5) + 2.6, -2.9, 3.4, 0.26, C.paper, 2, 0.3);
  mistBand(-2.9, groundY(-9) + 0.42, -8.9, 3.0, 0.2, C.paper, 2, 0.3);
  // 海の上
  mistBand(4, SEA_Y + 0.9, -40, 34, 1.0, C.mistPale, 3, 2.0);
  mistBand(12, SEA_Y + 1.5, -62, 30, 1.1, C.paper, 2, 2.4);
  mistBand(24, SEA_Y + 2.0, -104, 70, 2.0, C.mistPale, 3, 3.0);
  mistBand(-30, SEA_Y + 2.8, -150, 110, 2.6, C.paper, 2, 3.0);
}

// ---------------------------------------------------------------- キャラクター
// 段階陰：陰（藍がかったべた）／中間／明るい面 の3段
const gradientMap = (() => {
  const t = new THREE.DataTexture(new Uint8Array([0, 0, 0, 255, 0, 0, 0, 255, 150, 150, 150, 255, 255, 255, 255, 255]), 4, 1, THREE.RGBAFormat);
  t.minFilter = t.magFilter = THREE.NearestFilter;
  t.generateMipmaps = false;
  t.needsUpdate = true;
  return t;
})();

function hullMaterial(thickness) {
  const m = new THREE.MeshBasicMaterial({ color: C.navy, side: THREE.BackSide });
  m.onBeforeCompile = (sh) => {
    sh.uniforms.uOutline = { value: thickness };
    sh.vertexShader = 'uniform float uOutline;\n' + sh.vertexShader.replace(
      '#include <begin_vertex>',
      '#include <begin_vertex>\n  transformed += normalize(normal) * uOutline;');
  };
  m.customProgramCacheKey = () => 'hull';
  return m;
}

const boneKey = (n) => n.replace(/[^A-Za-z0-9_]/g, '');
const AX = { x: new THREE.Vector3(1, 0, 0), y: new THREE.Vector3(0, 1, 0), z: new THREE.Vector3(0, 0, 1) };
// 回転をモデル空間（正面 +z・上 +y・本人の左 +x）で順に重ねる
function R(...steps) {
  const q = new THREE.Quaternion(), t = new THREE.Quaternion();
  for (const [axis, deg] of steps) q.premultiply(t.setFromAxisAngle(AX[axis], THREE.MathUtils.degToRad(deg)));
  return q;
}

function prepare(gltf, { height, outlineWidth }) {
  const root = gltf.scene;
  root.updateMatrixWorld(true);
  // 休めの姿勢（Tポーズ）での骨の向きを覚える。骨の軸がどう向いていても、モデル空間で回せるように。
  const bones = {};
  root.traverse((o) => {
    if (!o.isBone) return;
    bones[boneKey(o.name)] = {
      bone: o, rest: o.quaternion.clone(),
      world: o.getWorldQuaternion(new THREE.Quaternion()),
      pos: o.getWorldPosition(new THREE.Vector3()),
    };
  });
  const box = new THREE.Box3();
  const skinned = [];
  root.traverse((o) => { if (o.isSkinnedMesh) skinned.push(o); });
  for (const mesh of skinned) {
    mesh.geometry.computeBoundingBox();
    box.union(mesh.geometry.boundingBox);
  }
  const scale = height / (box.max.y - box.min.y);
  for (const mesh of skinned) {
    const old = mesh.material;
    mesh.material = new THREE.MeshToonMaterial({
      map: old.map || null, color: old.color ? old.color.clone() : new THREE.Color(1, 1, 1),
      gradientMap, side: old.side,
    });
    if (old.map) old.map.anisotropy = 4;
    if (old.normalMap) old.normalMap.dispose();
    old.dispose();
    mesh.frustumCulled = false;
    // 輪郭：同じ骨で動く、法線方向にふくらませた裏返しの殻
    const hull = new THREE.SkinnedMesh(mesh.geometry, hullMaterial(outlineWidth));
    hull.bind(mesh.skeleton, mesh.bindMatrix);
    hull.position.copy(mesh.position); hull.quaternion.copy(mesh.quaternion); hull.scale.copy(mesh.scale);
    hull.frustumCulled = false;
    mesh.parent.add(hull);
  }
  const holder = new THREE.Group();
  holder.add(root);
  holder.scale.setScalar(scale);
  const tmp = new THREE.Quaternion();
  const set = (name, q) => {
    const b = bones[boneKey(name)];
    if (!b) { console.warn('[title3d] 骨が見つかりません:', name); return; }
    tmp.copy(b.world).invert().multiply(q).multiply(b.world);
    b.bone.quaternion.copy(b.rest).multiply(tmp);
  };
  return { holder, bones, set, scale };
}

// Mixamo の腕：side は本人の左が +1、右が -1
function poseArm(ch, side, { down = 72, forward = 0, elbow = 12, twist = 0, hand = 0 }) {
  const P = side > 0 ? 'mixamorigLeft' : 'mixamorigRight';
  ch.set(P + 'Shoulder', R(['z', -side * down * 0.14]));
  ch.set(P + 'Arm', R(['x', twist], ['z', -side * down * 0.86], ['x', -forward]));
  ch.set(P + 'ForeArm', R(['y', -side * elbow]));
  ch.set(P + 'Hand', R(['y', -side * hand]));
  // 指は軽く曲げる
  for (const f of ['Index', 'Middle', 'Ring', 'Pinky']) for (const i of [1, 2]) ch.set(`${P}Hand${f}${i}`, R(['z', -side * 16]));
}

function poseTsumugi(ch) {
  ch.set('mixamorigSpine1', R(['x', -3]));
  ch.set('mixamorigNeck', R(['y', 6]));
  ch.set('mixamorigHead', R(['x', -8], ['y', 10], ['z', -3]));
  poseArm(ch, 1, { down: 74, forward: 4, elbow: 14 });                 // 左腕は下ろす
  poseArm(ch, -1, { down: 66, forward: 30, elbow: 112, hand: 10 });    // 右手は胸の前で手紙を持つ
  ch.set('mixamorigLeftUpLeg', R(['x', -5]));
  ch.set('mixamorigLeftLeg', R(['x', 6]));
}

function poseHatori(ch) {
  ch.set('mixamorigSpine1', R(['z', 3]));
  ch.set('mixamorigHead', R(['x', -6], ['z', 5]));
  poseArm(ch, 1, { down: 70, forward: 6, elbow: 22 });                 // 左腕は下ろす
  // 右手を高く上げて見送る
  ch.set('mixamorigRightShoulder', R(['z', -10]));
  ch.set('mixamorigRightArm', R(['z', -48]));
  ch.set('mixamorigRightForeArm', R(['z', -34]));
  ch.set('mixamorigRightHand', R(['z', 12]));
}

// 手紙：白い小さな板に朱の封蝋
function makeLetter() {
  const g = new THREE.Group();
  outline(add(g, new THREE.BoxGeometry(0.23, 0.155, 0.008), flat(C.paper)), 0.011);
  const flap = new THREE.Shape(); flap.moveTo(-0.115, 0.0775); flap.lineTo(0, -0.005); flap.lineTo(0.115, 0.0775);
  add(g, new THREE.ShapeGeometry(flap), flat(C.paperShade), 0, 0, 0.0052);
  add(g, new THREE.CircleGeometry(0.03, 12), flat(C.red), 0, -0.004, 0.0062);
  return g;
}

function blobShadow(x, z, rx, rz, o = 0.34) {
  const m = add(scene, new THREE.CircleGeometry(1, 24), flat(C.navy, 0, { transparent: true, opacity: o, depthWrite: false }), x, groundY(z) + 0.03, z);
  m.scale.set(rx, rz, 1);
  m.rotation.x = -Math.PI / 2 + (z > FLAT_Z ? Math.atan(SLOPE) : 0);
  return m;
}

let owl = null;
async function loadCharacters() {
  const loader = new GLTFLoader();
  const [gT, gH, gF] = await Promise.all(['tsumugi', 'hatori', 'fuurou'].map((n) => loader.loadAsync(`${MODELS}${n}.glb`)));

  // 光：陰は藍がかったべた、明るい面はテクスチャの色そのまま
  scene.add(new THREE.AmbientLight(new THREE.Color(0.5, 0.56, 0.74), Math.PI));
  const sun = new THREE.DirectionalLight(new THREE.Color(0.5, 0.45, 0.3), Math.PI);
  sun.position.copy(LIGHT).multiplyScalar(10);
  scene.add(sun);

  // ツムギ：坂の上、こちら（坂の上手）へ歩き出すところ
  const T = prepare(gT, { height: 1.52, outlineWidth: 0.0085 });
  poseTsumugi(T);
  T.holder.position.set(-0.42, groundY(0.2) - 0.02, 0.2);
  T.holder.rotation.y = 0.2;
  scene.add(T.holder);
  blobShadow(-0.4, 0.15, 0.42, 0.2);

  // 局長：坂の下、郵便局の戸口の前で手をふる
  const H = prepare(gH, { height: 1.6, outlineWidth: 0.0115 });
  poseHatori(H);
  H.holder.position.set(0.72, groundY(-10.1), -10.1);
  H.holder.rotation.y = -0.1;
  scene.add(H.holder);
  blobShadow(0.76, -10.15, 0.5, 0.2, 0.4);

  // フウロウ：ツムギの頭上
  const F = prepare(gF, { height: 0.62, outlineWidth: 0.011 });
  F.holder.position.set(-0.2, 2.42, -0.1);
  F.holder.rotation.set(0.12, 0.22, 0.05);
  scene.add(F.holder);
  const wings = [];
  for (const [n0, n1] of [['Wing_L_0', 'Wing_L_1'], ['Wing_R_0', 'Wing_R_1']]) {
    const b1 = F.bones[n1], b0 = F.bones[n0];
    if (!b0 || !b1) continue;
    wings.push({ n0, n1, side: Math.sign(b1.pos.x - b0.pos.x) || 1 });
  }
  owl = { F, wings, baseY: F.holder.position.y };

  // 手紙を右手に持たせる
  scene.updateMatrixWorld(true);
  const hand = T.bones.mixamorigRightHandMiddle1 || T.bones.mixamorigRightHand;
  if (hand) {
    const letter = makeLetter();
    const p = hand.bone.getWorldPosition(new THREE.Vector3());
    letter.position.copy(p).add(new THREE.Vector3(-0.015, 0.075, 0.035));
    letter.rotation.set(-0.18, 0.32, -0.22);
    scene.add(letter);
    scene.updateMatrixWorld(true);
    hand.bone.attach(letter);
  }
  return { T, H, F };
}

// 羽ばたき：付け根と先を少しずらして上下に回す
function flap(t) {
  if (!owl) return;
  const w = (t * Math.PI * 2) / 1.5;
  const a0 = 6 + 30 * Math.sin(w), a1 = 22 * Math.sin(w - 0.9);
  for (const k of owl.wings) {
    owl.F.set(k.n0, R(['z', k.side * a0]));
    owl.F.set(k.n1, R(['z', k.side * a1]));
  }
  owl.F.holder.position.y = owl.baseY - 0.045 * Math.sin(w - 0.5) + 0.03 * Math.sin(t * 0.7);
}

// ---------------------------------------------------------------- 紙の質感（CSS の重ね）
function makeGrain() {
  const cv = document.createElement('canvas');
  cv.width = cv.height = 256;
  const g = cv.getContext('2d');
  const img = g.createImageData(256, 256), d = img.data;
  for (let y = 0; y < 256; y++) {
    const fibre = Math.sin(y * 0.9 + Math.sin(y * 0.13) * 3) * 4;   // 木目・紙の繊維の横すじ
    for (let x = 0; x < 256; x++) {
      const i = (y * 256 + x) * 4;
      const n = (Math.random() - 0.5) * 34 + fibre + (Math.random() < 0.012 ? -38 : 0);
      const v = 236 + n;
      d[i] = Math.min(255, v + 6); d[i + 1] = Math.min(255, v + 1); d[i + 2] = Math.min(255, v - 12); d[i + 3] = 255;
    }
  }
  g.putImageData(img, 0, 0);
  document.getElementById('grain').style.background = `url(${cv.toDataURL('image/png')}) 0 0 / 192px 192px`;

  // かすれ：刷りむらの白い点
  const k = document.createElement('canvas');
  k.width = k.height = 256;
  const kg = k.getContext('2d');
  kg.fillStyle = '#000'; kg.fillRect(0, 0, 256, 256);
  kg.fillStyle = 'rgba(243,234,216,.55)';
  for (let i = 0; i < 520; i++) kg.fillRect(Math.random() * 256, Math.random() * 256, Math.random() < 0.3 ? 2 : 1, 1);
  document.getElementById('kasure').style.background = `url(${k.toDataURL('image/png')}) 0 0 / 230px 230px`;
}

// ---------------------------------------------------------------- 画面
function resize() {
  const w = stage.clientWidth, h = stage.clientHeight;
  if (!w || !h) return;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  renderer.setPixelRatio(dpr);
  renderer.setSize(w, h, false);
  uPx.value = dpr;
  const aspect = w / h;
  camera.aspect = aspect;
  // 縦長（390×844）を基準に、横幅が足りないときは画角を広げて絵の左右を守る
  const base = FOV, baseAspect = 390 / 844;
  const hHalf = Math.atan(Math.tan(THREE.MathUtils.degToRad(base / 2)) * baseAspect);
  camera.fov = aspect < baseAspect ? THREE.MathUtils.radToDeg(2 * Math.atan(Math.tan(hHalf) / aspect)) : base;
  camera.updateProjectionMatrix();
  render();
}

function render() { renderer.render(scene, camera); }

let t0 = 0;
function tick(ms) {
  if (!t0) t0 = ms;
  const t = (ms - t0) / 1000;
  flap(t);
  for (const d of drifting) d.g.position.x = d.x + Math.sin(t * d.sp + d.ph) * d.amp * 2;
  if (beacon) {
    const k = 0.5 + 0.5 * Math.sin(t * 0.8);
    beacon.userData.beams[0].scale.set(0.78 + 0.22 * k, 0.7 + 0.5 * k, 1);
    beacon.userData.beams[1].scale.set(0.6 + 0.4 * k, 1, 1);
    beacon.userData.beams[2].scale.set(1.1 - 0.3 * k, 1, 1);
  }
  render();
}

async function main() {
  makeGrain();
  buildSky(); buildSea(); buildFar(); buildLighthouse(); buildStreet(); buildPostOffice(); buildMist();
  resize();
  window.addEventListener('resize', resize);
  if ('ResizeObserver' in window) new ResizeObserver(resize).observe(stage);

  let chars = null;
  try {
    chars = await loadCharacters();
    statusEl.classList.add('done');
  } catch (e) {
    console.error(e);
    statusEl.textContent = 'モデルを読みこめませんでした（サイトのルートから http で開いてください）';
    statusEl.classList.add('error');
  }
  window.__title3d = { THREE, scene, camera, renderer, chars, render, flap };

  if (reducedMotion) { flap(0.2); render(); }
  else renderer.setAnimationLoop(tick);
}

main();
