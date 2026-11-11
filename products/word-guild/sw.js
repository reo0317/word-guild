const VERSION = 'ccc6c08e';
const PRECACHE = ["./app.mjs","./assets-loader.mjs","./audio-policy.mjs","./character-art.mjs","./claws.mjs","./conversation.mjs","./core.mjs","./data/words.json","./dev-scenes.mjs","./dialogue-script.json","./dialogue.mjs","./game.mjs","./guild/board.mjs","./guild/chapters.mjs","./guild/credits.mjs","./guild/dom.mjs","./guild/library.mjs","./guild/pwa.mjs","./guild/quest.mjs","./guild/rng.mjs","./guild/srs.mjs","./guild/store.mjs","./guild/view.mjs","./guild/words.mjs","./index.html","./manifest.webmanifest","./music-cues.mjs","./question-data.mjs","./sound-effects.mjs","./sprites.mjs","./story.mjs","./style.css","./transition.mjs","./voice-player.mjs","./walk-art.mjs"];
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
