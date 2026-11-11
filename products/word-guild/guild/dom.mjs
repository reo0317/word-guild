// 画面から共通で使う小さな部品。
export function esc(text) {
  return String(text).replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
}

export function speak(text) {
  try {
    const synth = window.speechSynthesis;
    if (!synth || typeof SpeechSynthesisUtterance === 'undefined') return;
    synth.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = 0.9;
    synth.speak(utterance);
  } catch {
    // 発音できない端末では黙って省く
  }
}

export const starsMarkup = box => `${'★'.repeat(box)}${'☆'.repeat(5 - box)}`;
