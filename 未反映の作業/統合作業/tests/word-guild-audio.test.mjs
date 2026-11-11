import test from 'node:test';
import assert from 'node:assert/strict';
import {resolveAudioPolicy} from '../products/word-guild/audio-policy.mjs';
import {FlightSound} from '../products/word-guild/sound-effects.mjs';
import {Music} from '../products/word-guild/core.mjs';
import {MUSIC_CUES} from '../products/word-guild/music-cues.mjs';

const response = {ok:true, arrayBuffer:async()=>new ArrayBuffer(0)};
function context() {
  const nodes=[];
  const param=()=>({value:0,setValueAtTime(){},linearRampToValueAtTime(){},exponentialRampToValueAtTime(){}});
  const node=()=>{const n={gain:param(),frequency:param(),Q:param(),connect(){},disconnect(){this.disconnected=true;},start(){this.started=true;},stop(){this.stopped=true;}};nodes.push(n);return n;};
  return {nodes,state:'running',currentTime:2,sampleRate:8000,destination:{},
    resume:async()=>{},decodeAudioData:async()=>({duration:45,numberOfChannels:2}),
    createBuffer:(ch,n)=>({getChannelData:()=>new Float32Array(n)}),
    createBufferSource:node,createGain:node,createOscillator:node,createBiquadFilter:node};
}
test('道中・通常ボス・乱入・敗北・帰還の音響境界と凍結',()=>{
  for(let stage=0;stage<6;stage++)for(const state of ['battle','defeated','travel','arriving','intrusion']) {
    const p=resolveAudioPolicy({screen:'game',stage,state});
    assert.equal(p.musicScene,stage===4?'boss':stage===5?'final':'battle');
    assert.equal(p.flightSound,false);assert.ok(Object.isFrozen(p));
  }
  for(const state of ['loss','escape','rescue','sendoff','launch','fall','land','bossArrival','bossLand','recruited']) {
    const p=resolveAudioPolicy({screen:'game',stage:5,state});
    assert.equal(p.musicScene,null);assert.equal(p.flightSound,['launch','fall'].includes(state));
  }
  for(const screen of ['home','select'])assert.equal(resolveAudioPolicy({screen}).musicScene,'top');
  assert.equal(resolveAudioPolicy({screen:'game',state:'home'}).musicScene,'top');
  assert.equal(resolveAudioPolicy().musicScene,null);
  assert.equal(MUSIC_CUES.boss.url,'assets/music/flap2-loop.mp3');
  assert.equal(new Set(['battle','boss','final'].map(s=>MUSIC_CUES[s].url)).size,3);
});
test('飛行の連続startは一回、自然終了後も再描画で復活せずstopで解放',()=>{
  const ctx=context(),s=new FlightSound(ctx);
  assert.equal(s.start(),true);assert.equal(s.start(),false);
  assert.ok(Object.isFrozen(s.state));assert.equal(s.state.starts,1);
  assert.throws(()=>{s.state.playing=false;},TypeError);
  ctx.nodes[0].onended();assert.equal(s.state.playing,false);
  assert.ok(ctx.nodes.every(n=>n.disconnected));assert.equal(s.start(),false);
  s.stop();assert.equal(s.start(),true);assert.equal(s.state.starts,2);
  assert.equal(s.stop(),true);assert.equal(s.stop(),false);assert.equal(s.state.stops,1);
  assert.ok(ctx.nodes.every(n=>n.disconnected));
});
test('効果音は未作成・非表示時のsuspended contextを勝手に起動しない',()=>{
  assert.equal(new FlightSound(null).start(),false);
  const ctx=context();ctx.state='suspended';const s=new FlightSound(ctx);
  assert.equal(s.start(),false);assert.equal(ctx.nodes.length,0);
  ctx.state='running';assert.equal(s.start(),true);s.stop();
});
test('道中の取得とSourceは共有、通常ボスと乱入は別曲で停止切替',async()=>{
  const ctx=context(),calls=[];let release;
  const m=new Music(()=>ctx,url=>{calls.push(url);return calls.length===1?new Promise(r=>release=r):Promise.resolve(response);});
  const first=m.play('battle');await Promise.resolve();const next=m.play('battle');
  release(response);await Promise.all([first,next]);
  const source=m.source;await m.play('battle');assert.equal(m.source,source);assert.equal(calls.length,1);
  await m.play('boss');assert.equal(source.stopped,true);assert.equal(m.track,'flap2');
  const boss=m.source;await m.play('final');assert.equal(boss.stopped,true);assert.equal(m.track,'raid');
  m.stop();assert.equal(m.source,null);assert.equal(calls.length,3);
});
test('停止後に遅い道中取得が復活しない、503後に同じ道中曲を再試行',async()=>{
  const ctx=context();let release;
  const m=new Music(()=>ctx,()=>new Promise(r=>release=r));
  const pending=m.play('battle');await Promise.resolve();m.stop();release(response);await pending;
  assert.equal(m.source,null);
  let attempts=0;const retry=new Music(()=>ctx,async()=>({...response,ok:++attempts>1}));
  await assert.rejects(retry.play('battle'));await retry.play('battle');
  assert.equal(attempts,2);assert.equal(retry.track,'breeze3');retry.stop();
});
