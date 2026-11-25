// ゲームの中から紙芝居を開く。手紙は影絵（英文の字幕）、場面は色つき（日本語の字幕）。
// data/kamishibai.json は最初に使うときに一度だけ読む。読めなければ紙芝居のボタンを出さない。
import {playKamishibai} from './kamishibai.mjs';

const URL_KAMI = new URL('../data/kamishibai.json', import.meta.url);
let cache = null;

export function loadKami(fetcher = globalThis.fetch) {
  cache ??= Promise.resolve()
    .then(() => fetcher(URL_KAMI))
    .then(response => (response.ok ? response.json() : null))
    .catch(() => null);
  return cache;
}

export function letterCards(kami, shelf) {
  const cards = kami?.letters?.[shelf];
  return cards?.length ? cards : null;
}

// 場面の絵は1行に1枚。行の数が合わないとき（台本が変わったときなど）は紙の札に戻す。
export function sceneCards(kami, scene) {
  const cards = scene ? kami?.scenes?.[scene.shelf] : null;
  if (!cards?.length || cards.length !== scene.lines.length || !cards.every(card => card.pic)) return null;
  return cards.map((card, i) => ({...card, caption: scene.lines[i]}));
}

export function playCards(container, kami, cards) {
  return playKamishibai(container, {cards, sizes: kami?.sizes, trim: kami?.trim});
}
