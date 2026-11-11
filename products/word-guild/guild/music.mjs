// 音の土台。何も鳴らさない（S1 の担当が WebAudio の曲と効果音を入れる）。
// API は約束：createMusic() → {play(scene), stop(), setEnabled(on), resume(), sfx(name)}
// scene は 'post' | 'delivery' | 'big'。sfx は 'stamp' | 'attack' | 'crumble' | 'lamp' など。
export function createMusic() {
  let enabled = true;
  return {
    play(scene) {},
    stop() {},
    setEnabled(on) { enabled = Boolean(on); },
    resume() {},
    sfx(name) {},
  };
}
