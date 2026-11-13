const VERSION = 'b9e9c899';
const PRECACHE = ["./album.css","./app.mjs","./art/atenashi.webp","./art/body-action.webp","./art/body-body.webp","./art/body-doc.webp","./art/body-food.webp","./art/body-goods.webp","./art/body-mind.webp","./art/body-money.webp","./art/body-move.webp","./art/body-nature.webp","./art/body-number.webp","./art/body-person.webp","./art/body-place.webp","./art/body-state.webp","./art/body-time.webp","./art/body-tool.webp","./art/body-work.webp","./art/fuurou-normal.webp","./art/fuurou-stamp.webp","./art/hatori-normal.webp","./art/hatori-smile.webp","./art/hokoridama.webp","./art/house-1.webp","./art/house-10.webp","./art/house-11.webp","./art/house-12.webp","./art/house-13.webp","./art/house-14.webp","./art/house-15.webp","./art/house-16.webp","./art/house-17.webp","./art/house-18.webp","./art/house-19.webp","./art/house-2.webp","./art/house-20.webp","./art/house-21.webp","./art/house-22.webp","./art/house-23.webp","./art/house-24.webp","./art/house-25.webp","./art/house-26.webp","./art/house-27.webp","./art/house-28.webp","./art/house-29.webp","./art/house-3.webp","./art/house-30.webp","./art/house-31.webp","./art/house-32.webp","./art/house-33.webp","./art/house-34.webp","./art/house-35.webp","./art/house-36.webp","./art/house-37.webp","./art/house-38.webp","./art/house-39.webp","./art/house-4.webp","./art/house-40.webp","./art/house-41.webp","./art/house-42.webp","./art/house-43.webp","./art/house-44.webp","./art/house-45.webp","./art/house-46.webp","./art/house-47.webp","./art/house-48.webp","./art/house-49.webp","./art/house-5.webp","./art/house-50.webp","./art/house-51.webp","./art/house-52.webp","./art/house-53.webp","./art/house-54.webp","./art/house-55.webp","./art/house-56.webp","./art/house-6.webp","./art/house-7.webp","./art/house-8.webp","./art/house-9.webp","./art/icon-180.png","./art/icon-192.png","./art/icon-512.png","./art/keshikasu.webp","./art/key-visual.webp","./art/nijimi.webp","./art/open-2.webp","./art/open-3.webp","./art/oshimi.webp","./art/post-office.webp","./art/shimi.webp","./art/tsumugi-joy.webp","./art/tsumugi-normal.webp","./art/ward-1.webp","./art/ward-2.webp","./art/ward-3.webp","./art/ward-4.webp","./art/ward-5.webp","./art/ward-6.webp","./data/chara.json","./data/rare.json","./data/scenes.json","./data/story-allow.json","./data/story-ps.json","./data/story.json","./data/words.json","./guild/album.mjs","./guild/art.mjs","./guild/board.mjs","./guild/chapters.mjs","./guild/chara-svg.mjs","./guild/chara.mjs","./guild/cinema.mjs","./guild/credits.mjs","./guild/daily.mjs","./guild/dom.mjs","./guild/library.mjs","./guild/map.mjs","./guild/music.mjs","./guild/pwa.mjs","./guild/quest.mjs","./guild/rng.mjs","./guild/settings.mjs","./guild/srs.mjs","./guild/stages.mjs","./guild/store.mjs","./guild/story.mjs","./guild/trace.mjs","./guild/view.mjs","./guild/words.mjs","./index.html","./letter.css","./manifest.webmanifest","./map.css","./style.css"];
const CACHE = `wg-shell-${VERSION}`;
const shellURL = new URL('./index.html', self.location.href).href;
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(
    PRECACHE.map(url => new Request(new URL(url, self.location.href), { cache: 'reload' }))
  )));
});
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    await Promise.all((await caches.keys()).filter(key => key.startsWith('wg-shell-') && key !== CACHE).map(key => caches.delete(key)));
    await self.clients.claim();
  })());
});
self.addEventListener('message', event => {
  if (event.data === 'skip-waiting') self.skipWaiting();
});
self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin || request.headers.has('Range') || /\.(mp3|m4a|aac|ogg|wav|webm)$/i.test(url.pathname)) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    if (request.mode === 'navigate') return (await cache.match(shellURL)) || fetch(request);
    return (await cache.match(request, { ignoreSearch: true })) || fetch(request);
  })());
});
