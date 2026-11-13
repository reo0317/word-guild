import test from 'node:test';
import assert from 'node:assert/strict';
import {createSpeaker} from '../products/word-guild/guild/dom.mjs';
function setup() {
  const jobs = new Map(), calls = []; let id = 0, change;
  class Utterance { constructor(text) { this.text = text; } }
  const synth = {paused: true, voices: [], getVoices() { return this.voices; },
    addEventListener(_, fn) { change = fn; }, cancel() { calls.push('cancel'); },
    resume() { calls.push('resume'); this.paused = false; }, speak(u) { calls.push(u); }};
  const speaker = createSpeaker({synth, Utterance, later(fn, ms) { jobs.set(++id, {fn, ms}); return id; }, clear(id) { jobs.delete(id); }});
  const run = ms => { const pair = [...jobs].find(([, job]) => job.ms === ms); assert.ok(pair); jobs.delete(pair[0]); pair[1].fn(); };
  return {speaker, synth, calls, run, change};
}
test('解錠は操作内で一度、cancel 後50ms待ち、最新の語だけ読む', () => {
  const {speaker, calls, run} = setup();
  speaker.unlock(); speaker.unlock();
  assert.equal(calls.filter(x => x.text === '').length, 1);
  speaker.speak('cat'); speaker.speak('dog');
  assert.equal(calls.at(-1), 'cancel');
  assert.equal(calls.filter(x => x.text === 'cat').length, 0);
  run(50);
  assert.equal(calls.at(-1).text, 'dog');
});
test('声の遅延読込、失敗と無反応の再作成、古い発話の失敗を無視', () => {
  const {speaker, synth, calls, run, change} = setup();
  speaker.speak('cat'); run(50); const old = calls.at(-1);
  synth.voices = [{lang: 'en-US'}]; change();
  old.onerror(); run(50);
  assert.notEqual(calls.at(-1), old);
  assert.equal(calls.at(-1).voice, synth.voices[0]);
  run(15000); run(50);
  speaker.speak('dog'); old.onerror(); run(50);
  assert.equal(calls.at(-1).text, 'dog');
});
