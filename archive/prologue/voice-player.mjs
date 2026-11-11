// One shared AudioContext, one voice source. This module never touches game/DOM state.
// Integration: play(line); onEnded(id) -> director.onLineEnded(id).
// onSpeaking(true/false) -> ramp the EXISTING music gain, without calling Music.play.
// visibilitychange -> pause()/resume(); voice mute -> pause(), scene reset -> stop().
// Call resume from the initial user gesture. Subtitle advancement must also work on error.
const frozen = value => {
 if (value && typeof value === 'object') {
  for (const item of Object.values(value)) frozen(item);
  Object.freeze(value);
 }
 return value;
};
const fail = (code, message) => Object.assign(new Error(message), {code});

export class VoicePlayer {
 #context; #fetcher; #baseURL; #manifest; #cache = new Map(); #loads = new Map(); #controllers = new Map();
 #jobs = []; #activeLoads = 0; #prefetch = null; #source = null; #gain = null;
 #generation = 0; #request = null; #pending = null; #position = 0; #startedAt = 0;
 #state = 'idle'; #error = null; #speaking = false; #disposed = false;
 #onEnded; #onSpeaking; #onError; #cacheLimit;

 constructor(context, {
  manifest = {files: {}, lines: {}}, fetcher = globalThis.fetch,
  baseURL = new URL('./assets/voice/', import.meta.url),
  onEnded = () => {}, onSpeaking = () => {}, onError = () => {},
  maxCachedFiles = 3, volume = .9
 } = {}) {
  if (!context?.createBufferSource || !context?.decodeAudioData) throw TypeError('共有AudioContextが必要です');
  if (typeof fetcher !== 'function') throw TypeError('音声取得関数が必要です');
  this.#context = context;
  this.#fetcher = fetcher.bind(globalThis);
  this.#baseURL = new URL(baseURL, import.meta.url);
  this.#manifest = frozen(JSON.parse(JSON.stringify(manifest)));
  this.#onEnded = onEnded; this.#onSpeaking = onSpeaking; this.#onError = onError;
  this.#cacheLimit = Math.max(1, Math.min(9, Math.floor(maxCachedFiles) || 3));
  this.#gain = context.createGain();
  this.#gain.gain.value = Number.isFinite(volume) ? Math.max(0, Math.min(1, volume)) : .9;
  this.#gain.connect(context.destination);
 }

 #notify(callback, value) { try { callback(value); } catch { /* UI callbacks cannot change playback ownership. */ } }
 #setSpeaking(value) {
  if (value === this.#speaking) return;
  this.#speaking = value; this.#notify(this.#onSpeaking, value);
 }
 #resolve(line) {
  const key = typeof line === 'string' ? line : line?.voiceKey;
  const clip = this.#manifest.lines?.[key];
  if (!clip) throw fail('VOICE_UNAVAILABLE', `音声未収録: ${key || '台詞IDなし'}`);
  const file = this.#manifest.files?.[clip.file];
  if (!file?.url || !Number.isFinite(clip.start) || !Number.isFinite(clip.end) || clip.start < 0 || clip.end <= clip.start) {
   throw fail('VOICE_MANIFEST', `音声区間が不正です: ${key}`);
  }
  return frozen({id: typeof line === 'object' ? (line.id || key) : key,
   voiceKey: key, url: new URL(file.url, this.#baseURL).href,
   start: clip.start, end: clip.end, duration: clip.end - clip.start});
 }
 #touch(url, buffer) {
  this.#cache.delete(url); this.#cache.set(url, buffer);
  while (this.#cache.size > this.#cacheLimit) this.#cache.delete(this.#cache.keys().next().value);
 }
 #load(url, priority = false) {
  if (this.#cache.has(url)) {
   const buffer = this.#cache.get(url); this.#touch(url, buffer); return Promise.resolve(buffer);
  }
  if (this.#loads.has(url)) {
   // A foreground request promotes a queued prefetch; fetch and decode are still shared.
   const index = this.#jobs.findIndex(job => job.url === url);
   if (priority && index > 0) this.#jobs.unshift(...this.#jobs.splice(index, 1));
   return this.#loads.get(url);
  }
  let resolve, reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  this.#loads.set(url, promise);
  const job = {url, resolve, reject};
  if (priority) this.#jobs.unshift(job); else this.#jobs.push(job);
  this.#pump(); return promise;
 }
 #pump() {
  while (!this.#disposed && this.#activeLoads < 2 && this.#jobs.length) {
   const {url, resolve, reject} = this.#jobs.shift(); this.#activeLoads++;
   const controller = new AbortController(); this.#controllers.set(url, controller);
   Promise.resolve().then(() => this.#fetcher(url, {signal: controller.signal})).catch(error => {
    throw fail('VOICE_FETCH', String(error.message || error));
   }).then(response => {
    if (!response.ok) throw fail('VOICE_FETCH', `音声を取得できません (${response.status})`);
    return response.arrayBuffer();
   }).then(bytes => this.#context.decodeAudioData(bytes)).then(buffer => {
    if (!Number.isFinite(buffer.duration) || buffer.duration <= 0) throw fail('VOICE_DECODE', '音声の長さが不正です');
    if (!this.#disposed) this.#touch(url, buffer);
    return buffer;
   }).then(resolve, reject).finally(() => {
    this.#loads.delete(url); this.#controllers.delete(url); this.#activeLoads--; this.#pump();
   });
  }
 }

 // At most one upcoming file is prefetched, and at most two files are fetched/decoded at once.
 // No source is created and no AudioContext is resumed by prepare().
 prepare(lines = []) {
  if (this.#disposed) return Promise.resolve({status: 'disposed'});
  if (this.#prefetch) return this.#prefetch;
  const line = Array.isArray(lines) ? lines[0] : lines;
  if (!line) return Promise.resolve({status: 'empty'});
  this.#prefetch = Promise.resolve().then(() => this.#resolve(line)).then(clip =>
   this.#load(clip.url).then(() => ({status: 'ready', voiceKey: clip.voiceKey}))
  ).catch(error => ({status: 'error', code: error.code || 'VOICE_DECODE', message: error.message}))
   .finally(() => { this.#prefetch = null; });
  return this.#prefetch;
 }

 play(line) {
  if (this.#disposed) return Promise.resolve({status: 'disposed'});
  let clip;
  try { clip = this.#resolve(line); }
  catch (error) {
   this.stop(); this.#state = 'error'; this.#recordError(error, typeof line === 'object' ? line?.id : line);
   return Promise.resolve({status: 'error', ...this.#error});
  }
  if (this.#request?.id === clip.id && this.#request?.voiceKey === clip.voiceKey) {
   if (this.#pending) return this.#pending;
   if (['playing', 'paused', 'ended'].includes(this.#state)) return Promise.resolve({status: this.#state});
  }
  this.stop(); this.#request = clip; this.#state = 'loading'; this.#error = null;
  return this.#begin();
 }
 #begin() {
  const generation = ++this.#generation, clip = this.#request;
  // Resume is invoked synchronously before any fetch so the start tap unlocks Safari audio.
  let unlocked;
  try { unlocked = this.#context.resume(); } catch (error) { unlocked = Promise.reject(error); }
  const pending = Promise.resolve(unlocked).then(() => {
   if (generation !== this.#generation) return null;
   return this.#load(clip.url, true);
  }).then(buffer => {
   if (generation !== this.#generation || !buffer || this.#disposed) return {status: 'cancelled'};
   if (clip.end > buffer.duration + .001) throw fail('VOICE_RANGE', '音声区間がファイルの長さを超えています');
   const remaining = clip.duration - this.#position;
   if (remaining <= .001) { this.#finish(); return {status: 'ended'}; }
   const source = this.#context.createBufferSource();
   source.buffer = buffer; source.connect(this.#gain);
   source.onended = () => {
    if (this.#source !== source || generation !== this.#generation) return;
    this.#source = null; source.onended = null; source.disconnect(); this.#finish();
   };
   this.#source = source; this.#startedAt = this.#context.currentTime; this.#state = 'playing';
   source.start(0, clip.start + this.#position, remaining); this.#setSpeaking(true);
   return {status: 'playing'};
  }).catch(error => {
   if (generation !== this.#generation || this.#disposed) return {status: 'cancelled'};
   this.#detach(); this.#state = 'error'; this.#recordError(error);
   return {status: 'error', ...this.#error};
  }).finally(() => { if (this.#pending === pending) this.#pending = null; });
  this.#pending = pending; return pending;
 }
 #recordError(error, id = this.#request?.id || null) {
  this.#error = frozen({code: error.code || 'VOICE_DECODE', message: String(error.message || error)});
  this.#notify(this.#onError, frozen({...this.#error, id}));
 }
 #finish() {
  this.#position = this.#request?.duration || 0; this.#state = 'ended'; this.#setSpeaking(false);
  this.#notify(this.#onEnded, this.#request?.id);
 }
 #detach() {
  const source = this.#source; this.#source = null;
  if (source) { source.onended = null; try { source.stop(); } catch { /* already ended */ } source.disconnect(); }
  this.#setSpeaking(false);
 }
 pause() {
  if (this.#disposed || !['playing', 'loading'].includes(this.#state)) return this.snapshot;
  this.#position = this.#currentPosition(); this.#generation++; this.#pending = null;
  this.#detach(); this.#state = 'paused'; return this.snapshot;
 }
 resume() {
  if (this.#disposed) return Promise.resolve({status: 'disposed'});
  if (!this.#request || !['paused', 'error'].includes(this.#state)) return Promise.resolve({status: this.#state});
  this.#state = 'loading'; this.#error = null; return this.#begin();
 }
 stop() {
  this.#generation++; this.#pending = null; this.#detach(); this.#request = null;
  this.#position = 0; this.#state = 'idle'; this.#error = null;
 }
 dispose() {
  if (this.#disposed) return;
  this.stop(); this.#disposed = true; this.#gain.disconnect(); this.#cache.clear();
  for (const controller of this.#controllers.values()) controller.abort();
  this.#controllers.clear();
  for (const job of this.#jobs.splice(0)) {
   this.#loads.delete(job.url); job.reject(fail('VOICE_DISPOSED', '音声再生を終了しました'));
  }
 }
 #currentPosition() {
  return Math.min(this.#request?.duration || 0, this.#position +
   (this.#state === 'playing' ? Math.max(0, this.#context.currentTime - this.#startedAt) : 0));
 }
 get snapshot() {
  return frozen({state: this.#state, speaking: this.#speaking,
   id: this.#request?.id || null, voiceKey: this.#request?.voiceKey || null,
   position: this.#currentPosition(), duration: this.#request?.duration || 0,
   error: this.#error ? {...this.#error} : null, disposed: this.#disposed,
   cachedFiles: [...this.#cache.keys()], loadingFiles: [...this.#loads.keys()],
   activeLoads: this.#activeLoads, queuedLoads: this.#jobs.length});
 }
}
