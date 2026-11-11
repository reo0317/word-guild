let registration;
let registrationPromise;
let lastUpdate = -Infinity;
let applying = false;
const callbacks = new Set();
const announced = new WeakSet();
function notify() {
  const worker = registration?.waiting;
  if (!worker || announced.has(worker)) return;
  announced.add(worker);
  for (const callback of callbacks) {
    try { callback(); } catch { /* UI errors must not interrupt worker handling. */ }
  }
}
export async function registerServiceWorker() {
  const query = new URLSearchParams(location.search);
  if (!('serviceWorker' in navigator) || query.get('dev') === '1' || (location.protocol !== 'https:' && query.get('sw') !== '1')) return;
  if (registrationPromise) return registrationPromise;
  registrationPromise = (async () => {
    try {
      registration = await navigator.serviceWorker.register(new URL('../sw.js', import.meta.url), { updateViaCache: 'none' });
      const watch = worker => worker?.addEventListener('statechange', () => {
        if (worker.state === 'installed' && navigator.serviceWorker.controller) notify();
      });
      watch(registration.installing);
      registration.addEventListener('updatefound', () => watch(registration.installing));
      notify();
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState !== 'visible' || Date.now() - lastUpdate < 3600000) return;
        lastUpdate = Date.now();
        try { Promise.resolve(registration.update()).catch(() => {}); } catch { /* Offline. */ }
      });
      return registration;
    } catch { registrationPromise = undefined; }
  })();
  return registrationPromise;
}
export function onUpdateReady(callback) {
  callbacks.add(callback);
  if (registration?.waiting) {
    try { callback(); } catch { /* Same behavior as update notifications. */ }
  }
  return () => callbacks.delete(callback);
}
export function applyUpdate() {
  if (!registration?.waiting || applying) return;
  applying = true;
  navigator.serviceWorker.addEventListener('controllerchange', () => location.reload(), { once: true });
  registration.waiting.postMessage('skip-waiting');
}
export function isStandalone() {
  return navigator.standalone === true || globalThis.matchMedia?.('(display-mode: standalone)').matches === true;
}
export function requestPersist() {
  try { Promise.resolve(navigator.storage?.persist?.()).catch(() => {}); } catch { /* Optional API. */ }
}
