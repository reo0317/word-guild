import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';
import vm from 'node:vm';
import { root, shellMetadata, updateVersion } from '../tools/sw-version.mjs';

const source = await readFile(new URL('../products/word-guild/sw.js', import.meta.url), 'utf8');
test('precache enumerates deployed resources and version matches their contents', async () => {
  const { files, version } = await shellMetadata();
  assert.deepEqual(JSON.parse(source.match(/^const PRECACHE = (.*);$/m)[1]), files);
  assert.equal(source.match(/^const VERSION = '(.*)';$/m)[1], version);
  assert.ok(files.includes('./guild/pwa.mjs'));
  assert.ok(files.includes('./index.html'));
  for (const file of files) {
    assert.ok(file.startsWith('./') && !file.includes('..'));
    assert.ok(!file.startsWith('./assets/') && !file.startsWith('./art/work/'));
    assert.ok(!/\.(m4a|mp3)$/.test(file));
    await access(new URL(file, `file://${root}/`));
  }
  assert.equal(await updateVersion(true), true);
});
test('manifest paths stay relative; id belongs to T5 integration', async t => {
  const manifest = JSON.parse(await readFile(new URL('../products/word-guild/manifest.webmanifest', import.meta.url)));
  for (const key of ['start_url', 'scope']) assert.ok(manifest[key].startsWith('./'));
  if (manifest.id === undefined) t.diagnostic('T5 pending: add manifest id "./"');
  else assert.ok(manifest.id.startsWith('./'));
});
function worker() {
  const handlers = {};
  const calls = [];
  const cache = { match: async (...args) => { calls.push(['match', ...args]); return 'cached'; }, addAll: async requests => calls.push(['addAll', requests]) };
  const self = { location: new URL('https://reo0317.github.io/word-guild/products/word-guild/sw.js'), addEventListener: (name, fn) => { handlers[name] = fn; }, skipWaiting: () => calls.push(['skip']), clients: { claim: async () => calls.push(['claim']) } };
  vm.runInNewContext(source, { self, URL, Request, caches: { open: async () => cache, keys: async () => ['wg-shell-old', 'other'], delete: async key => calls.push(['delete', key]) }, fetch: async () => 'network' });
  return { handlers, calls, cache };
}
test('worker waits for explicit update and cleans only old shell caches', async () => {
  const { handlers, calls } = worker();
  let pending;
  handlers.install({ waitUntil: p => { pending = p; } });
  await pending;
  assert.ok(calls[0][1].every(request => request.cache === 'reload'));
  assert.ok(!calls.some(call => call[0] === 'skip'));
  handlers.activate({ waitUntil: p => { pending = p; } });
  await pending;
  assert.ok(calls.some(call => call[0] === 'delete' && call[1] === 'wg-shell-old'));
  assert.ok(!calls.some(call => call[1] === 'other'));
  handlers.message({ data: 'skip-waiting' });
  assert.equal(calls.at(-1)[0], 'skip');
});
test('worker bypasses audio, Range, foreign origins and non-GET; navigation uses scoped shell', async () => {
  const { handlers, calls } = worker();
  const base = 'https://reo0317.github.io/word-guild/products/word-guild/';
  for (const request of [new Request(base + 'audio/song.m4a'), new Request(base + 'x', { headers: { Range: 'bytes=0-2' } }), new Request('https://example.com/x'), new Request(base, { method: 'POST' })]) {
    handlers.fetch({ request, respondWith: () => assert.fail('must bypass') });
  }
  let response;
  handlers.fetch({ request: { method: 'GET', url: base, headers: new Headers(), mode: 'navigate' }, respondWith: p => { response = p; } });
  assert.equal(await response, 'cached');
  assert.equal(calls.at(-1)[1], base + 'index.html');
  handlers.fetch({ request: new Request(base + 'app.mjs?v=17'), respondWith: p => { response = p; } });
  await response;
  assert.equal(calls.at(-1)[2].ignoreSearch, true);
});

test('全区の道・門をオフライン用リストに含める', async () => {
  const {files}=await shellMetadata();
  for(let ch=1;ch<=6;ch++) {
    for(const path of [`road/road-${ch}`,`gate-${ch}`,`gate-${ch}-door-l`,`gate-${ch}-door-r`])
      assert.ok(files.includes(`./art/${path}.webp`));
  }
});
