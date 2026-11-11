import test from 'node:test';
import assert from 'node:assert/strict';
import {VoicePlayer} from '../products/word-guild/voice-player.mjs';

const deferred = () => { let resolve, reject; const promise = new Promise((a,b) => {resolve=a;reject=b;}); return {promise,resolve,reject}; };
const flush = async () => { for(let i=0;i<20;i++) await Promise.resolve(); };
const manifest = {
 files:{male:{url:'male-v1.wav'},guide:{url:'guide-v1.wav'},cat:{url:'cat-v1.wav'},dog:{url:'dog-v1.wav'}},
 lines:{one:{file:'male',start:1,end:5},two:{file:'male',start:6,end:9},guide:{file:'guide',start:0,end:3},cat:{file:'cat',start:0,end:4},dog:{file:'dog',start:0,end:4}}
};
function harness(options={}) {
 const sources=[],changes=[],ended=[],errors=[],requests=[];
 const context={currentTime:0,resumeCalls:0,decodeCalls:0,
  resume(){this.resumeCalls++;return Promise.resolve();},
  decodeAudioData(){this.decodeCalls++;return Promise.resolve({duration:20});},
  createGain(){return {gain:{value:1},connect(){},disconnect(){this.disconnected=true;}};},
  createBufferSource(){const source={connect(){},disconnect(){this.disconnected=true;},
   start(...args){this.args=args;},stop(){this.stopped=true;this.onended?.();},end(){this.onended?.();}};
   sources.push(source);return source;},destination:{}
 };
 const fetcher=async url=>{requests.push(url);return {ok:true,arrayBuffer:async()=>new ArrayBuffer(2)};};
 const player=new VoicePlayer(context,{manifest,fetcher,onSpeaking:v=>changes.push(v),onEnded:id=>ended.push(id),onError:e=>errors.push(e),...options});
 return {player,context,sources,changes,ended,errors,requests};
}

test('同じ台詞IDの再描画ではsourceを保持し台詞頭へ戻らない',async()=>{
 const h=harness();const line={id:'event-1',voiceKey:'one'};
 await h.player.play(line);h.context.currentTime=1.5;
 await h.player.play(line);
 assert.equal(h.sources.length,1);assert.equal(h.requests.length,1);
 assert.equal(h.player.snapshot.position,1.5);assert.deepEqual(h.sources[0].args,[0,1,4]);
 assert.deepEqual(h.changes,[true]);h.sources[0].end();
 assert.deepEqual(h.ended,['event-1']);assert.deepEqual(h.changes,[true,false]);
 await h.player.play(line);assert.equal(h.sources.length,1);
});
test('先読みと再生はURLごとのfetch/decodeを共有し別区間のみ開始する',async()=>{
 const h=harness();await h.player.prepare(['one','guide']);
 assert.equal(h.context.resumeCalls,0);assert.equal(h.sources.length,0);
 await h.player.play('one');await h.player.play('two');
 assert.equal(h.requests.length,1);assert.equal(h.context.decodeCalls,1);
 assert.equal(h.sources[0].stopped,true);assert.deepEqual(h.sources[1].args,[0,6,3]);
 assert.deepEqual(h.ended,[]);
});
test('pause/resumeは経過位置を保ち、声の通知でBGMダッキングを独立制御できる',async()=>{
 const h=harness();await h.player.play('one');h.context.currentTime=1.25;
 h.player.pause();h.context.currentTime=100;assert.equal(h.player.snapshot.position,1.25);
 assert.equal(h.sources[0].stopped,true);assert.deepEqual(h.ended,[]);
 await h.player.play('one');assert.equal(h.sources.length,1);
 await h.player.resume();assert.deepEqual(h.sources[1].args,[0,2.25,2.75]);
 h.context.currentTime=101;assert.equal(h.player.snapshot.position,2.25);
 assert.deepEqual(h.changes,[true,false,true]);
 h.sources[1].end();assert.equal(h.player.snapshot.position,4);assert.deepEqual(h.ended,['one']);
});
test('停止後に遅延fetchが成功しても古い声は開始しない',async()=>{
 const gate=deferred();const h=harness({fetcher:()=>gate.promise});
 const play=h.player.play('one');await flush();h.player.stop();
 gate.resolve({ok:true,arrayBuffer:async()=>new ArrayBuffer(2)});
 assert.equal((await play).status,'cancelled');assert.equal(h.sources.length,0);
 assert.equal(h.player.snapshot.state,'idle');assert.deepEqual(h.changes,[]);
});
test('取得途中の非表示pauseと復帰resumeもURLを共有して一度だけ開始する',async()=>{
 const gate=deferred();let fetched=0;
 const h=harness({fetcher:()=>{fetched++;return gate.promise;}});
 const first=h.player.play('one');await flush();h.player.pause();
 const second=h.player.resume();await flush();gate.resolve({ok:true,arrayBuffer:async()=>new ArrayBuffer(2)});
 assert.equal((await first).status,'cancelled');assert.equal((await second).status,'playing');
 assert.equal(fetched,1);assert.equal(h.sources.length,1);assert.deepEqual(h.sources[0].args,[0,1,4]);
});
test('場面変更後の遅延成功・失敗は最新台詞やエラーを書き換えない',async()=>{
 for(const rejectOld of [false,true]){
  const gate=deferred();const h=harness({fetcher:url=>url.endsWith('male-v1.wav')?gate.promise:Promise.resolve({ok:true,arrayBuffer:async()=>new ArrayBuffer(2)})});
  const old=h.player.play('one');await flush();await h.player.play('guide');
  if(rejectOld)gate.reject(Error('古い要求失敗'));else gate.resolve({ok:true,arrayBuffer:async()=>new ArrayBuffer(2)});
  assert.equal((await old).status,'cancelled');assert.equal(h.player.snapshot.id,'guide');
  assert.equal(h.sources.length,1);assert.equal(h.errors.length,0);
 }
});
test('HTTP失敗を字幕側へ通知し、resumeで実ファイルの再取得を試せる',async()=>{
 let calls=0;const h=harness({fetcher:async()=>++calls===1?{ok:false,status:503}:{ok:true,arrayBuffer:async()=>new ArrayBuffer(2)}});
 assert.equal((await h.player.play('one')).status,'error');assert.equal(h.errors[0].code,'VOICE_FETCH');
 assert.equal(h.errors[0].id,'one');assert.equal(h.player.snapshot.speaking,false);
 await flush();assert.equal((await h.player.resume()).status,'playing');assert.equal(calls,2);
 assert.equal(h.player.snapshot.error,null);
});
test('decode失敗・不正durationは停止せず結果を返し、次回に再試行できる',async()=>{
 for(const bad of ['reject','invalid']){
  const h=harness();let calls=0;
  h.context.decodeAudioData=async()=>++calls===1?(bad==='reject'?Promise.reject(Error('decode')):{duration:NaN}):{duration:20};
  assert.equal((await h.player.play('one')).status,'error');await flush();
  assert.equal(h.player.snapshot.state,'error');assert.equal((await h.player.resume()).status,'playing');
 }
});
test('未生成manifestは明示的なエラーで返し無音や汎用読み上げを使わない',async()=>{
 const h=harness({manifest:{status:'unavailable',files:{},lines:{}}});
 assert.equal((await h.player.play({id:'select',voiceKey:'missing'})).code,'VOICE_UNAVAILABLE');
 assert.equal(h.sources.length,0);assert.equal(h.context.resumeCalls,0);assert.equal(h.requests.length,0);
 assert.equal(h.errors[0].id,'select');
});
test('標準fetchのreceiverをブラウザーglobalへ結び付ける',async()=>{
 let receiver;
 const h=harness({fetcher:async function(){receiver=this;return {ok:true,arrayBuffer:async()=>new ArrayBuffer(2)};}});
 assert.equal((await h.player.play('one')).status,'playing');assert.equal(receiver,globalThis);
});
test('manifestをコピーし、snapshotの深い値も読み取り専用にする',async()=>{
 const input=structuredClone(manifest),h=harness({manifest:input});input.lines.one.start=100;
 await h.player.play('one');assert.deepEqual(h.sources[0].args,[0,1,4]);
 const snapshot=h.player.snapshot;
 assert.throws(()=>{snapshot.cachedFiles.push('evil');},TypeError);
 assert.throws(()=>{snapshot.id='evil';},TypeError);assert.equal(h.player.snapshot.id,'one');
});
test('区間終端超過と不正manifestを拒否し終了通知を偽らない',async()=>{
 const input=structuredClone(manifest);input.lines.one.end=30;
 const h=harness({manifest:input});assert.equal((await h.player.play('one')).code,'VOICE_RANGE');
 assert.equal(h.sources.length,0);assert.deepEqual(h.ended,[]);
 input.lines.one.end=-1;const bad=harness({manifest:input});
 assert.equal((await bad.player.play('one')).code,'VOICE_MANIFEST');
});
test('先読みは次の1ファイルだけ、並列取得は2、cacheは指定数まで',async()=>{
 const gates=[],h=harness({maxCachedFiles:2,fetcher:()=>{const gate=deferred();gates.push(gate);return gate.promise;}});
 const prefetch=h.player.prepare(['one','two','guide']);const cat=h.player.play('cat');
 await flush();const guide=h.player.play('guide');await flush();const dog=h.player.play('dog');await flush();
 assert.equal(gates.length,2);assert.equal(h.player.snapshot.activeLoads,2);
 for(let i=0;i<4;i++){gates[i].resolve({ok:true,arrayBuffer:async()=>new ArrayBuffer(2)});await flush();}
 await Promise.all([prefetch,cat,guide,dog]);assert.equal(gates.length,4);
 assert.equal(h.player.snapshot.cachedFiles.length,2);assert.equal(h.sources.length,1);
 assert.equal(h.player.snapshot.id,'dog');
});
test('終了callbackで即次台詞を開始でき、古いsource終了で進行しない',async()=>{
 const h=harness({onEnded:()=>{void h.player.play('guide');}});
 await h.player.play('one');const first=h.sources[0];first.end();await flush();
 assert.equal(h.player.snapshot.id,'guide');assert.equal(h.sources.length,2);
 first.end();await flush();assert.equal(h.sources.length,2);assert.equal(h.player.snapshot.id,'guide');
});
test('disposeは共有AudioContextを閉じず音源・gain・queueを解放する',async()=>{
 const gate=deferred();let signal;const h=harness({fetcher:(_url,options)=>{signal=options.signal;return gate.promise;}});
 const first=h.player.play('one');await flush();h.player.dispose();
 assert.equal(signal.aborted,true);
 gate.resolve({ok:true,arrayBuffer:async()=>new ArrayBuffer(2)});
 await first;assert.equal(h.player.snapshot.disposed,true);assert.deepEqual(h.player.snapshot.cachedFiles,[]);
 assert.equal((await h.player.resume()).status,'disposed');assert.equal((await h.player.prepare('guide')).status,'disposed');
 assert.equal(h.sources.length,0);
});
