// Music.contextを渡す。AudioContextの作成・resume・設定変更は行わない。
// フィルター付き風音と下降する息の音。原曲や外部音源を使わない効果音。
export class FlightSound {
  #context;
  #nodes = null;
  #latched = false;
  #starts = 0;
  #stops = 0;
  #startedAt = null;
  constructor(context) { this.#context = context; }
  get state() {
    return Object.freeze({playing: !!this.#nodes, latched: this.#latched,
      starts: this.#starts, stops: this.#stops, startedAt: this.#startedAt});
  }
  start() {
    const ctx = this.#context;
    if (this.#latched || !ctx || ctx.state !== 'running') return false;
    // launch 1.4秒 + fall 1.2秒に合わせ、着地までに風を抜く。
    const duration = 2.6, now = ctx.currentTime;
    const buffer = ctx.createBuffer(2, Math.ceil(ctx.sampleRate * duration), ctx.sampleRate);
    // 固定シードの左右異なる風。再現可能なPCMでクリック・偏りを抑える。
    let seed = 0x53a9;
    for (let ch = 0; ch < 2; ch++) {
      const samples = buffer.getChannelData(ch);
      let smooth = 0;
      for (let i = 0; i < samples.length; i++) {
        seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
        smooth = smooth * .55 + ((seed / 4294967296) * 2 - 1) * .45;
        samples[i] = smooth;
      }
    }
    const wind = ctx.createBufferSource(), filter = ctx.createBiquadFilter();
    const breath = ctx.createOscillator(), breathGain = ctx.createGain(), gain = ctx.createGain();
    wind.buffer = buffer;
    filter.type = 'bandpass';
    filter.Q.setValueAtTime(1.8, now);
    filter.frequency.setValueAtTime(2300, now);
    filter.frequency.exponentialRampToValueAtTime(480, now + duration);
    breath.type = 'sine';
    breath.frequency.setValueAtTime(1100, now);
    breath.frequency.exponentialRampToValueAtTime(180, now + duration);
    breathGain.gain.value = .16;
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(.42, now + .14);
    gain.gain.exponentialRampToValueAtTime(.09, now + 1.9);
    gain.gain.linearRampToValueAtTime(0, now + duration);
    wind.connect(filter); filter.connect(gain);
    breath.connect(breathGain); breathGain.connect(gain); gain.connect(ctx.destination);
    const nodes = {wind, breath, filter, breathGain, gain};
    this.#nodes = nodes; this.#latched = true; this.#starts++; this.#startedAt = now;
    wind.onended = () => {
      if (this.#nodes === nodes) this.#release(nodes);
    };
    wind.start(now); breath.start(now);
    wind.stop(now + duration); breath.stop(now + duration);
    return true;
  }
  #release(nodes) {
    for (const node of Object.values(nodes)) node.disconnect();
    if (this.#nodes === nodes) this.#nodes = null;
  }
  stop() {
    this.#latched = false;
    const nodes = this.#nodes;
    if (!nodes) return false;
    this.#stops++;
    nodes.wind.onended = null;
    for (const source of [nodes.wind, nodes.breath]) {
      try { source.stop(); } catch { /* 自然終了済みでも解放する。 */ }
    }
    this.#release(nodes);
    return true;
  }
}
