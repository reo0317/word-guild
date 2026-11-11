// 描画・時計・保存から独立した音響方針。停止・非表示は呼び出し側で適用する。
export function resolveAudioPolicy({screen, stage, state} = {}) {
  if (screen === 'home' || screen === 'top' || screen === 'select') {
    return Object.freeze({musicScene: 'top', flightSound: false});
  }
  if (screen !== 'game') return Object.freeze({musicScene: null, flightSound: false});
  if (['loss', 'launch', 'fall', 'land', 'home'].includes(state)) {
    return Object.freeze({musicScene: state === 'home' ? 'top' : null,
      flightSound: state === 'launch' || state === 'fall'});
  }
  return Object.freeze({musicScene: stage === 4 ? 'boss' : stage === 5 ? 'final' : 'battle',
    flightSound: false});
}
