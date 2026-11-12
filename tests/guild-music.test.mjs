import test from 'node:test';
import assert from 'node:assert/strict';
import {createMusic} from '../products/word-guild/guild/music.mjs';

class Parameter {
  value = 1;
  events = [];
  setValueAtTime(...args) { this.events.push(['set', ...args]); }
  linearRampToValueAtTime(...args) { this.events.push(['linear', ...args]); }
  exponentialRampToValueAtTime(...args) { this.events.push(['exponential', ...args]); }
  cancelScheduledValues() {}
}
class Node {
  gain = new Parameter();
  frequency = new Parameter();
  starts = [];
  stops = [];
  connect(target) { this.target = target; }
  disconnect() {}
  start(time) { this.starts.push(time); }
  stop(time) { this.stops.push(time); }
}
function setup(fetchOverride, events = {}) {
  const instances = [], urls = [];
  class Context {
    state = 'running';
    allowResume = true;
    currentTime = 0;
    sampleRate = 1000;
    destination = {};
    allSources = [];
    get sources() { return this.allSources.filter(source => source.buffer?.length !== 1); }
    oscillators = [];
    gains = [];
    resumes = 0;
    decodes = 0;
    constructor() { instances.push(this); }
    createGain() { const node = new Node(); this.gains.push(node); return node; }
    createBufferSource() { const node = new Node(); this.allSources.push(node); return node; }
    createOscillator() { const node = new Node(); this.oscillators.push(node); return node; }
    createBuffer(channels, length) { return {length, getChannelData: () => new Float32Array(length)}; }
    async decodeAudioData() { this.decodes++; return {duration: 81}; }
    resume() { this.resumes++; if (this.allowResume) this.state = 'running'; return Promise.resolve(); }
  }
  const fetch = async url => {
    urls.push(String(url));
    return fetchOverride ? fetchOverride(String(url)) : response();
  };
  const music = createMusic({AudioContextClass: Context, fetch, ...events});
  return {music, instances, urls};
}
function response(ok = true) { return {ok, arrayBuffer: async () => new ArrayBuffer(1)}; }

test('lazy context, exact loop, gains, same-scene reuse and decoded cache', async () => {
  const {music, instances, urls} = setup();
  assert.equal(instances.length, 0);
  await music.play('delivery');
  assert.equal(instances.length, 0);
  music.resume();
  await music.play('delivery');
  const ctx = instances[0], source = ctx.sources[0];
  assert.equal(source.loop, true);
  assert.equal(source.loopStart, 0);
  assert.equal(source.loopEnd, 80);
  assert.equal(ctx.gains[1].gain.value, 0.55);
  assert.equal(ctx.gains[2].gain.value, 0.8);
  await music.play('delivery');
  assert.equal(ctx.sources.length, 1);
  await music.play('post');
  assert.equal(ctx.sources[1].loopEnd, 80.640);
  assert.deepEqual(source.stops, [0.6]);
  assert.ok(ctx.gains[3].gain.events.some(event => event[0] === 'linear' && event[1] === 0 && event[2] === 0.6));
  await music.play('delivery');
  assert.equal(urls.length, 2);
  assert.equal(ctx.decodes, 2);
});

test('big 404 falls back to cached delivery; big uses its own loop length', async () => {
  const {music, instances, urls} = setup(url => response(!url.endsWith('/big.m4a')));
  music.resume();
  await assert.doesNotReject(music.play('big'));
  assert.equal(instances[0].sources[0].loopEnd, 80);
  assert.ok(urls[0].endsWith('/audio/big.m4a'));
  assert.ok(urls[1].endsWith('/audio/delivery.m4a'));
  await music.play('delivery');
  assert.equal(instances[0].sources.length, 1);
  const available = setup();
  available.music.resume();
  await available.music.play('big');
  assert.equal(available.instances[0].sources[0].loopEnd, 53.76);
});

test('only latest pending scene starts, including repeated pending requests', async () => {
  const pending = new Map();
  const {music, instances, urls} = setup(url => new Promise(resolve => pending.set(url.split('/').at(-1), resolve)));
  music.resume();
  const first = music.play('post');
  const second = music.play('delivery');
  const third = music.play('delivery');
  pending.get('delivery.m4a')(response());
  await Promise.all([second, third]);
  pending.get('post.m4a')(response());
  await first;
  assert.equal(instances[0].sources.length, 1);
  assert.equal(instances[0].sources[0].loopEnd, 80);
  assert.equal(urls.length, 2);
});

test('disable stops music, mutes effects and reenable restores requested scene', async () => {
  const {music, instances} = setup();
  music.resume();
  await music.play('post');
  const ctx = instances[0];
  music.setEnabled(false);
  assert.deepEqual(ctx.sources[0].stops, [undefined]);
  assert.equal(ctx.gains[0].gain.value, 0);
  for (const name of ['stamp', 'attack', 'crumble', 'lamp', 'wrong']) music.sfx(name);
  assert.equal(ctx.sources.length, 1);
  assert.equal(ctx.oscillators.length, 0);
  music.setEnabled(true);
  await music.play('post');
  assert.equal(ctx.sources.filter(source => source.loop).length, 2);
  assert.equal(ctx.gains[0].gain.value, 1);
  for (const name of ['stamp', 'attack', 'crumble', 'lamp', 'wrong']) music.sfx(name);
  assert.equal(ctx.oscillators.length, 6);
  assert.equal(ctx.sources.length, 4);
  music.sfx('unknown');
  assert.equal(ctx.oscillators.length, 6);
  music.resume();
  assert.equal(ctx.resumes, 3);
});

test('stop or disable cancels pending playback', async () => {
  for (const action of ['stop', 'disable']) {
    let finish;
    const {music, instances} = setup(() => new Promise(resolve => { finish = resolve; }));
    music.resume();
    const playing = music.play('post');
    if (action === 'stop') music.stop(); else music.setEnabled(false);
    finish(response());
    await playing;
    assert.equal(instances[0].sources.length, 0);
  }
});

test('missing APIs and failed fetch/decode never reject', async () => {
  for (const options of [{AudioContextClass: null}, {fetch: null}]) {
    const music = createMusic(options);
    await assert.doesNotReject(music.play('delivery'));
    assert.doesNotThrow(() => {
      music.resume(); music.sfx('stamp'); music.stop();
      music.setEnabled(false); music.setEnabled(true);
    });
  }
  const {music} = setup(() => { throw new Error('offline'); });
  await assert.doesNotReject(music.play('big'));
});

test('returning to the active scene invalidates another pending scene', async () => {
  let finish;
  const {music, instances} = setup(url => url.endsWith('/post.m4a')
    ? new Promise(resolve => { finish = resolve; }) : response());
  music.resume();
  await music.play('delivery');
  const pending = music.play('post');
  await music.play('delivery');
  await music.play('delivery');
  finish(response());
  await pending;
  assert.equal(instances[0].sources.length, 1);
});

test('decode failure for big also falls back to delivery', async () => {
  const {music, instances} = setup();
  music.resume();
  const ctx = instances[0];
  let decodes = 0;
  ctx.decodeAudioData = async () => {
    if (++decodes === 1) throw new Error('unsupported audio');
    return {duration: 80.016};
  };
  await assert.doesNotReject(music.play('big'));
  assert.equal(ctx.sources.find(source => source.loop).loopEnd, 80);
});

function eventTarget() {
  const handlers = new Map();
  return {hidden: false, handlers,
    addEventListener(name, fn, options) { handlers.set(name, {fn, options}); },
    fire(name) { handlers.get(name)?.fn(); },
  };
}
const settle = async () => { for (let i = 0; i < 12; i++) await Promise.resolve(); };

test('first gesture synchronously creates, resumes and unlocks once; both gestures stay captured', async () => {
  const document = eventTarget();
  const {music, instances} = setup(undefined, {document});
  document.fire('pointerdown');
  assert.equal(instances.length, 1);
  const ctx = instances[0];
  assert.equal(ctx.resumes, 1);
  assert.deepEqual(ctx.allSources[0].starts, [0]);
  assert.equal(ctx.allSources[0].buffer.getChannelData(0)[0], 0);
  await music.play('post');
  document.fire('touchend');
  await settle();
  assert.equal(ctx.allSources.filter(s => !s.loop).length, 1);
  assert.equal(ctx.sources.filter(s => s.loop).length, 1);
  for (const name of ['pointerdown', 'touchend']) assert.equal(document.handlers.get(name).options.capture, true);
});

test('interrupted context retries on next tap and recreates latest music after automatic resume is refused', async () => {
  const document = eventTarget(), window = eventTarget();
  const {music, instances} = setup(undefined, {document, window});
  document.fire('pointerdown');
  await music.play('post');
  const ctx = instances[0], old = ctx.sources.find(s => s.loop);
  ctx.allowResume = false;
  ctx.state = 'interrupted';
  ctx.onstatechange();
  await music.play('delivery');
  await settle();
  assert.ok(old.stops.length);
  ctx.allowResume = true;
  document.fire('touchend');
  await settle();
  assert.equal(ctx.state, 'running');
  assert.equal(ctx.sources.at(-1).loopEnd, 80);
  assert.ok(ctx.sources.at(-1).starts.length);
  for (const name of ['visibilitychange', 'pageshow', 'focus']) {
    ctx.state = 'suspended';
    const before = ctx.resumes;
    (name === 'visibilitychange' ? document : window).fire(name);
    assert.equal(ctx.resumes, before + 1);
    await settle();
  }
});

test('sound off ignores gestures and lifecycle recovery, then enabling unlocks synchronously', async () => {
  const document = eventTarget(), window = eventTarget();
  const {music, instances} = setup(undefined, {document, window});
  music.setEnabled(false);
  await music.play('post');
  document.fire('pointerdown'); document.fire('touchend');
  document.fire('visibilitychange'); window.fire('pageshow'); window.fire('focus');
  assert.equal(instances.length, 0);
  music.setEnabled(true);
  music.resume();
  assert.equal(instances[0].resumes, 1);
  await settle();
  const ctx = instances[0];
  assert.equal(ctx.sources.filter(s => s.loop).length, 1);
  music.setEnabled(false);
  const before = ctx.resumes, count = ctx.sources.length;
  ctx.state = 'interrupted'; ctx.onstatechange();
  document.fire('pointerdown'); document.fire('touchend');
  await settle();
  assert.equal(ctx.resumes, before);
  assert.equal(ctx.sources.length, count);
});

test('stopped source is recreated on a tap without changing the requested scene', async () => {
  const document = eventTarget();
  const {music, instances} = setup(undefined, {document});
  document.fire('pointerdown');
  await music.play('delivery');
  const ctx = instances[0], previous = ctx.sources[0];
  previous.onended();
  document.fire('pointerdown');
  await settle();
  assert.equal(ctx.sources.length, 2);
  assert.equal(ctx.sources[1].loopEnd, 80);
});

test('lifecycle notifications before the first gesture keep context creation lazy', async () => {
  const document = eventTarget(), window = eventTarget();
  const {music, instances} = setup(undefined, {document, window});
  await music.play('post');
  window.fire('pageshow'); window.fire('focus'); document.fire('visibilitychange');
  assert.equal(instances.length, 0);
  document.fire('touchend');
  assert.equal(instances.length, 1);
  await settle();
  assert.equal(instances[0].sources[0].loopEnd, 80.640);
});
