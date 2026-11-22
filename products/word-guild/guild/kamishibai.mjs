// Script v1 groups cards by shelf under scenes and letters. A card has an
// optional bg (art basename), ordered parts ({art, x, y, h, flip}), and
// optional props ({prop, x, y, h, rot, wiggle}) drawn above the parts. x is the
// horizontal center, y the bottom edge, and h the height, in card percentages.
// Scene captions follow scene line order. Letter line arrays hold zero-based
// indices into the letter's lines. Pass cards with caption text to the player.

const art = new URL('../art/', import.meta.url);
const ink = '#1f2a44';
const propPalette = {
  paper: '#fff8e6',
  seal: '#c8462f',
  lamp: '#e7b04a',
  white: '#fff'
};

const props = {
  memo: ['0 0 72 88', `
    <path fill="var(--paper)" d="M8 5h40l16 16v62H8z"/>
    <path d="M48 5v17h16M20 37h32M20 50h32M20 63h22"/>`],
  letter: ['0 0 96 64', `
    <rect fill="var(--paper)" x="5" y="8" width="86" height="48" rx="5"/>
    <path d="m7 52 27-24m55 24L62 28"/>
    <path fill="var(--paper)" d="m6 12 34 24q8 6 16 0l34-24"/>
    <circle fill="var(--seal)" cx="48" cy="36" r="8"/>`],
  letters: ['0 0 104 80', `
    <rect fill="var(--lamp)" x="20" y="16" width="77" height="48" rx="4" transform="rotate(12 58 40)"/>
    <rect fill="var(--paper)" x="10" y="12" width="78" height="48" rx="4" transform="rotate(-13 49 36)"/>
    <rect fill="var(--paper)" x="6" y="29" width="83" height="44" rx="4"/>
    <path d="m8 32 34 22q6 4 12 0l33-22"/>
    <circle fill="var(--seal)" cx="48" cy="54" r="7"/>`],
  bag: ['0 0 98 90', `
    <path d="M20 40 28 17Q33 5 46 5t21 12l10 23" stroke-width="8"/>
    <path fill="var(--lamp)" d="M15 29h69l9 46q1 9-9 9H14q-10 0-9-9z"/>
    <path fill="var(--paper)" d="M15 29h69l-6 22-29 9-29-9z"/>
    <rect fill="var(--seal)" x="42" y="49" width="14" height="15" rx="3"/>`],
  drawer: ['0 0 110 80', `
    <path fill="var(--lamp)" d="M22 18 37 6h65v51L88 70H22z"/>
    <path d="M88 18 102 6M22 18h66v38"/>
    <path fill="var(--ink)" d="M29 28h50v24H29z"/>
    <path fill="var(--paper)" d="M6 49 29 36h50l-12 13v24H6z"/>
    <path fill="var(--lamp)" d="M6 49h61v24H6z"/>
    <path d="M27 56v5h20v-5"/>`],
  question: ['0 0 62 84', `
    <path fill="var(--lamp)" d="M7 25C7 12 17 5 31 5c14 0 24 8 24 20 0 10-5 15-13 21-4 3-5 5-5 10H24c0-10 2-14 10-20 5-4 8-7 8-11 0-6-4-9-11-9-7 0-11 4-11 9z"/>
    <circle fill="var(--lamp)" cx="30" cy="71" r="7"/>`],
  // 霧は影絵でも明るい帯のまま（影にすると塊に見えるため）
  fog: ['0 0 120 60', `
    <g stroke="none" fill="#fffaf0" opacity=".78">
      <path d="M4 22q10-10 24-4 10-12 26-4 14-10 30-1 16-6 30 6-8 6-22 4-12 6-26 2-14 6-28 1-14 6-28 0-6 1-6-4z"/>
      <path d="M18 44q10-8 22-3 12-10 26-3 14-8 28 0 12-4 22 5-8 5-20 3-12 5-26 1-14 5-26 0-12 4-24 0-4 0-2-3z" opacity=".8"/>
    </g>`],
  clock: ['0 0 82 82', `
    <circle fill="var(--lamp)" cx="41" cy="41" r="35"/>
    <circle fill="var(--paper)" cx="41" cy="41" r="28"/>
    <path d="M41 21v20l13 9"/>`],
  door: ['0 0 78 100', `
    <path d="M8 94V7h56v87M5 94h14m34 0h19"/>
    <path fill="var(--lamp)" d="M8 7 48 17v68L8 96z"/>
    <circle fill="var(--seal)" cx="37" cy="53" r="3"/>`],
  bread: ['0 0 98 64', `
    <path fill="var(--lamp)" d="M5 42C5 22 26 8 50 8c23 0 43 11 43 32 0 12-12 16-44 16S5 52 5 42z"/>
    <path d="m24 23 8 11m10-18 9 13m10-12 9 13"/>`],
  card: ['0 0 94 66', `
    <rect fill="var(--white)" x="5" y="6" width="84" height="54" rx="4"/>`]
};

export const propNames = Object.freeze(Object.keys(props));

function renderProp(name, { silhouette, wiggle }) {
  const [viewBox, artwork] = props[name];
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('class', 'kami-part');
  svg.setAttribute('viewBox', viewBox);
  svg.setAttribute('preserveAspectRatio', 'xMidYMax meet');
  svg.setAttribute('fill', 'none');
  // 影絵では塗りを紺一色にし、線は灯りの色で残す（切り絵のように中の形が読める）
  svg.setAttribute('stroke', silhouette ? '#f7e6bf' : ink);
  svg.setAttribute('stroke-width', silhouette ? '3.5' : '4.5');
  svg.setAttribute('stroke-linecap', 'round');
  svg.setAttribute('stroke-linejoin', 'round');
  svg.style.setProperty('--ink', ink);
  for (const [color, value] of Object.entries(propPalette)) {
    svg.style.setProperty(`--${color}`, silhouette ? ink : value);
  }
  svg.innerHTML = `<g${wiggle ? ' class="kami-wiggle"' : ''}>${artwork}</g>`;
  return svg;
}

function preload(url) {
  return new Promise(resolve => {
    const image = new Image();
    image.onload = async () => {
      try {
        await image.decode();
        resolve(image);
      } catch {
        resolve(null);
      }
    };
    image.onerror = () => resolve(null);
    image.src = url;
  });
}

const styles = `
  .kami-player, .kami-player * { box-sizing: border-box; }
  .kami-player {
    width: min(calc(100% - 32px), 608px); max-width: none;
    max-height: calc(100% - 32px); padding: 0; border: 0;
    color: #362319; background: #fbefda; border-radius: 12px;
    box-shadow: 0 12px 50px #180d0ba0; text-align: center;
  }
  .kami-player::backdrop { background: #291a18d9; }
  .kami-toolbar { display: flex; justify-content: flex-end; padding: 5px 8px; background: linear-gradient(#754631, #542d20); border-bottom: 3px ridge #986747; }
  .kami-close {
    width: 44px; height: 44px; display: grid; place-items: center; padding: 0;
    border: 1px solid #e6c492; border-radius: 50%; background: #fbefda;
    color: #362319; font: 25px/1 system-ui; cursor: pointer;
  }
  .kami-frame {
    position: relative; display: block; width: 100%; aspect-ratio: 3 / 2;
    overflow: hidden; padding: 0; margin: 0; border: 0; background: #e9c388;
    cursor: pointer; touch-action: pan-y pinch-zoom; user-select: none;
    -webkit-user-select: none; -webkit-tap-highlight-color: transparent;
  }
  .kami-frame::after {
    content: ''; position: absolute; z-index: 2; inset: 0; pointer-events: none;
    box-shadow: inset 0 0 12px #3e1d1470;
  }
  .kami-frame:focus-visible { outline: 3px solid #1f2a44; outline-offset: -8px; }
  .kami-player figure { margin: 0; }
  .kami-card {
    position: absolute; inset: 0; display: block; pointer-events: none;
    background: #e9c388; box-shadow: 4px 0 12px #41271880;
  }
  .kami-shadow .kami-card {
    background: radial-gradient(ellipse at 48% 65%, #fff5ce 6%, #f7d895 58%, #bc7b44 100%);
  }
  .kami-bg, .kami-part { position: absolute; display: block; object-fit: contain; }
  .kami-bg { inset: 0; width: 100%; height: 100%; }
  .kami-part { object-position: center bottom; }
  @media (prefers-reduced-motion: no-preference) {
    .kami-wiggle {
      transform-box: fill-box; transform-origin: center bottom;
      animation: kami-wiggle 1.2s ease-in-out 2;
    }
  }
  @keyframes kami-wiggle {
    10%, 30% { transform: rotate(-4deg); }
    20%, 40% { transform: rotate(4deg); }
    50%, 100% { transform: rotate(0); }
  }
  .kami-ink {
    background-color: #1f2a44;
    -webkit-mask-image: var(--kami-image);
    mask-image: var(--kami-image);
    -webkit-mask-position: center bottom;
    mask-position: center bottom;
    -webkit-mask-size: contain;
    mask-size: contain;
    -webkit-mask-repeat: no-repeat;
    mask-repeat: no-repeat;
  }
  .kami-caption {
    margin: 0; padding: 12px 16px 5px; min-height: 4em;
    font: 17px/1.55 system-ui, sans-serif; text-align: start;
  }
  .kami-shadow .kami-caption:lang(en) { font-family: Georgia, serif; }
  .kami-dots { display: flex; justify-content: center; gap: 8px; padding: 10px 12px 15px; }
  .kami-dots[hidden] { display: none; }
  .kami-dot { width: 7px; height: 7px; border-radius: 50%; background: #cbb495; }
  .kami-dot[aria-current="step"] { background: #542d20; }
`;

function makeElement(tag, className) {
  const element = document.createElement(tag);
  element.className = className;
  return element;
}

function renderCard(card, silhouette) {
  const surface = makeElement('span', 'kami-card');
  surface.setAttribute('aria-hidden', 'true');
  if (card.background) {
    const image = card.background.cloneNode();
    image.className = 'kami-bg';
    image.alt = '';
    surface.append(image);
  }
  for (const { image, prop, x, y, h, flip, rot = 0, wiggle } of card.layers) {
    let part;
    if (prop) {
      part = renderProp(prop, { silhouette, wiggle });
    } else if (silhouette) {
      part = makeElement('span', 'kami-part kami-ink');
      part.style.setProperty('--kami-image', `url("${image.src}")`);
    } else {
      part = image.cloneNode();
      part.className = 'kami-part';
      part.alt = '';
    }
    part.style.left = `${x}%`;
    part.style.bottom = `${100 - y}%`;
    part.style.width = `${Math.min(x, 100 - x) * 2}%`;
    part.style.height = `${Math.min(h, y)}%`;
    part.style.transform = `translateX(-50%) rotate(${rot}deg) scaleX(${flip ? -1 : 1})`;
    surface.append(part);
  }
  return surface;
}

export async function playKamishibai(container, { cards, mode }) {
  if (!cards.length) return;
  const silhouette = mode === 'silhouette';
  const dialog = makeElement('dialog', `kami-player${silhouette ? ' kami-shadow' : ''}`);
  dialog.setAttribute('aria-label', '紙芝居');
  const style = document.createElement('style');
  style.textContent = styles;
  const toolbar = makeElement('div', 'kami-toolbar');
  const close = makeElement('button', 'kami-close');
  close.type = 'button';
  close.textContent = '×';
  close.setAttribute('aria-label', '閉じる');
  close.autofocus = true;
  toolbar.append(close);

  const figure = document.createElement('figure');
  const frame = makeElement('button', 'kami-frame');
  frame.type = 'button';
  frame.disabled = true;
  const caption = makeElement('figcaption', 'kami-caption');
  caption.lang = 'ja';
  caption.setAttribute('aria-live', 'polite');
  caption.textContent = '読み込み中…';
  const progress = makeElement('div', 'kami-dots');
  progress.setAttribute('role', 'img');
  progress.hidden = true;
  const dots = cards.map(() => makeElement('span', 'kami-dot'));
  progress.append(...dots);
  figure.append(frame, caption, progress);
  dialog.append(style, toolbar, figure);
  container.append(dialog);

  const closed = new Promise(resolve => {
    dialog.addEventListener('close', () => {
      dialog.remove();
      resolve();
    }, { once: true });
  });
  close.addEventListener('click', () => dialog.close());
  dialog.showModal();

  async function prepare() {
    const images = new Map();
    function load(url) {
      if (!url) return null;
      if (!images.has(url)) images.set(url, preload(url));
      return images.get(url);
    }
    const artUrl = name => new URL(`${name}.webp`, art).href;
    const prepared = await Promise.all(cards.map(async card => {
      const [background, layers] = await Promise.all([
        card.bg && !silhouette ? load(artUrl(card.bg)) : null,
        Promise.all((card.parts ?? []).map(async part => ({
          ...part,
          image: await load(artUrl(part.art))
        })))
      ]);
      return {
        caption: card.caption,
        background,
        layers: [
          ...layers.filter(part => part.image),
          ...(card.props ?? []).filter(({ prop }) => Object.hasOwn(props, prop))
        ]
      };
    }));
    if (!dialog.open) return;

    let index = 0;
    let sliding = false;
    let start = null;
    let swiped = false;
    const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
    let current = renderCard(prepared[0], silhouette);
    frame.append(current);
    frame.disabled = false;
    caption.lang = silhouette ? 'en' : 'ja';
    progress.hidden = false;

    function updateCaption() {
      caption.textContent = prepared[index].caption;
      progress.setAttribute('aria-label', `${index + 1} / ${cards.length}`);
      dots[index - 1]?.removeAttribute('aria-current');
      dots[index].setAttribute('aria-current', 'step');
      frame.setAttribute('aria-label', index === cards.length - 1 ? '紙芝居を閉じる' : '次のカード');
    }

    async function advance(direction) {
      if (!dialog.open || sliding) return;
      if (index === cards.length - 1) {
        dialog.close();
        return;
      }
      sliding = true;
      const outgoing = current;
      current = renderCard(prepared[++index], silhouette);
      frame.prepend(current);
      try {
        if (!reducedMotion.matches && outgoing.animate) {
          await outgoing.animate(
            [{ transform: 'translateX(0)' }, { transform: `translateX(${direction * 102}%)` }],
            { duration: 320, easing: 'cubic-bezier(.35,.05,.65,1)', fill: 'forwards' }
          ).finished;
        }
      } finally {
        outgoing.remove();
        updateCaption();
        sliding = false;
      }
    }

    updateCaption();
    frame.addEventListener('pointerdown', event => {
      if (!event.isPrimary || event.button !== 0) return;
      swiped = false;
      start = { x: event.clientX, y: event.clientY, id: event.pointerId };
      frame.setPointerCapture(event.pointerId);
    });
    frame.addEventListener('pointercancel', () => { start = null; });
    frame.addEventListener('pointerup', event => {
      if (start?.id !== event.pointerId) return;
      const dx = event.clientX - start.x;
      const dy = event.clientY - start.y;
      start = null;
      swiped = Math.abs(dx) >= 32 && Math.abs(dx) > Math.abs(dy);
      if (swiped) void advance(Math.sign(dx));
    });
    frame.addEventListener('click', event => {
      if (!swiped || event.detail === 0) void advance(1);
      swiped = false;
    });
  }

  void prepare().catch(() => {
    if (dialog.open) caption.textContent = '紙芝居を読み込めませんでした。';
  });
  return closed;
}
