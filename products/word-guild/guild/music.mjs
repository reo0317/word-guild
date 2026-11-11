// AAC の末尾の詰め物を除いた、音楽上の一周の長さ（秒）。
const LOOP_END = {post: 80.640, delivery: 80.000, big: 53.760};
const FADE = 0.6;

export function createMusic(options = {}) {
  const AudioContextClass = options.AudioContextClass === undefined
    ? globalThis.AudioContext || globalThis.webkitAudioContext : options.AudioContextClass;
  const fetchAudio = options.fetch === undefined ? globalThis.fetch : options.fetch;
  let ctx, master, musicGain, effectsGain;
  let enabled = true, requested = null, revision = 0, current = null;
  const cache = new Map();
  const voices = new Set();

  function initialize() {
    if (ctx) return true;
    if (!AudioContextClass || !fetchAudio) return false;
    try {
      ctx = new AudioContextClass();
      master = ctx.createGain();
      musicGain = ctx.createGain();
      effectsGain = ctx.createGain();
      master.gain.value = enabled ? 1 : 0;
      musicGain.gain.value = 0.55;
      effectsGain.gain.value = 0.8;
      musicGain.connect(master);
      effectsGain.connect(master);
      master.connect(ctx.destination);
      return true;
    } catch { ctx = null; return false; }
  }

  function load(scene) {
    if (!cache.has(scene)) {
      cache.set(scene, (async () => {
        try {
          const response = await fetchAudio(new URL(`../audio/${scene}.m4a`, import.meta.url));
          if (!response.ok) throw new Error('Audio unavailable');
          const buffer = await ctx.decodeAudioData(await response.arrayBuffer());
          return {buffer, scene};
        } catch {
          return scene === 'big' ? load('delivery') : null;
        }
      })());
    }
    return cache.get(scene);
  }

  function halt() {
    for (const voice of voices) {
      try { voice.source.stop(); } catch { /* Already ended. */ }
      voice.source.disconnect();
      voice.gain.disconnect();
    }
    voices.clear();
    current = null;
  }

  function retire(voice, now) {
    if (!voice || voice.retiring) return;
    voice.retiring = true;
    const parameter = voice.gain.gain;
    // Preserve the instantaneous level if a new scene arrives during a fade.
    const level = Math.min(1, Math.max(0, (now - voice.started) / FADE));
    parameter.cancelScheduledValues(now);
    parameter.setValueAtTime(level, now);
    parameter.linearRampToValueAtTime(0, now + FADE);
    voice.source.stop(now + FADE);
  }

  async function play(scene) {
    if (!Object.hasOwn(LOOP_END, scene)) return;
    const same = requested === scene;
    requested = scene;
    if (!enabled || !initialize()) return;
    const ticket = ++revision;
    if (same && current?.requested === scene) return;
    try {
      const loaded = await load(scene);
      if (!loaded || ticket !== revision || !enabled) return;
      if (current?.scene === loaded.scene && !current.retiring) {
        current.requested = scene;
        return;
      }
      const now = ctx.currentTime;
      const source = ctx.createBufferSource();
      const gain = ctx.createGain();
      source.buffer = loaded.buffer;
      source.loop = true;
      source.loopStart = 0;
      source.loopEnd = LOOP_END[loaded.scene] ?? loaded.buffer.duration;
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(1, now + FADE);
      source.connect(gain);
      gain.connect(musicGain);
      const voice = {source, gain, scene: loaded.scene, requested: scene, started: now};
      source.onended = () => {
        voices.delete(voice);
        source.disconnect();
        gain.disconnect();
      };
      source.start(now);
      retire(current, now);
      voices.add(voice);
      current = voice;
    } catch { /* Audio must never interrupt play. */ }
  }

  function stop() { ++revision; halt(); }
  function setEnabled(on) {
    enabled = Boolean(on);
    if (master) master.gain.value = enabled ? 1 : 0;
    if (!enabled) stop();
    else if (requested) void play(requested);
  }
  function resume() {
    if (!initialize()) return;
    try { Promise.resolve(ctx.resume()).catch(() => {}); } catch { /* Safari may refuse. */ }
  }

  function sfx(name) {
    if (!enabled || !ctx || !['stamp', 'attack', 'crumble', 'lamp', 'wrong'].includes(name)) return;
    try {
      const now = ctx.currentTime;
      function envelope(node, start, duration, volume) {
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0, start);
        gain.gain.linearRampToValueAtTime(volume, start + 0.005);
        gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
        node.connect(gain);
        gain.connect(effectsGain);
        node.onended = () => { node.disconnect(); gain.disconnect(); };
        node.start(start);
        node.stop(start + duration);
      }
      function tone(frequency, end, start, duration, volume, type = 'sine') {
        const oscillator = ctx.createOscillator();
        oscillator.type = type;
        oscillator.frequency.setValueAtTime(frequency, start);
        oscillator.frequency.exponentialRampToValueAtTime(end, start + duration);
        envelope(oscillator, start, duration, volume);
      }
      function noise(duration, volume) {
        const buffer = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * duration), ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        envelope(source, now, duration, volume);
      }
      if (name === 'stamp') { tone(160, 65, now, 0.13, 0.6); noise(0.065, 0.12); }
      if (name === 'attack') tone(180, 45, now, 0.24, 0.4, 'triangle');
      if (name === 'crumble') noise(0.28, 0.3);
      if (name === 'lamp') [523.25, 659.25, 783.99].forEach((hz, i) => tone(hz, hz, now + i * 0.075, 0.24, 0.18));
      if (name === 'wrong') tone(110, 85, now, 0.12, 0.16);
    } catch { /* Unsupported audio features are optional. */ }
  }
  return {play, stop, setEnabled, resume, sfx};
}
