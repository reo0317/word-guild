import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import {durations} from '../products/word-guild/transition.mjs';
import {Game} from '../products/word-guild/core.mjs';
import {DialogueDirector} from '../products/word-guild/dialogue.mjs';

test('実画面の演出時計で救出から加入まで進む。音声終了なし・声停止・非表示でも回復は一回',async()=>{
 const {app}=await animationDeadline();
 const script=JSON.parse(await readFile(new URL('../products/word-guild/dialogue-script.json',import.meta.url),'utf8'));
 for(const mode of ['no-end-notification','voice-stopped','voice-fetch-failed']){
  const game=new Game('water',()=>.5),director=new DialogueDirector(script),events=[],states=[];
  game.stage=5;game.enter();game.advance(10000);
  const elapsed=game.elapsed;
  director.dispatch({screen:'game',stage:5,state:'loss'});
  if(mode==='voice-stopped')director.pause();
  const sandbox={game,durations,last:0,left:durations.loss,hidden:false,screen:'game',strikes:[],data:{complete:false},
   conversation:{advance(){}},paintScene(){},requestAnimationFrame(){},update(){},persist(){},
   advanceBattle(){throw Error('救出中は戦闘を進めない');},
   effects(batch){events.push(...batch);},
   renderGame(){states.push(game.state);director.dispatch({screen:'game',stage:5,state:game.state,...game.storyState});},
   home(returned){states.push('home');director.dispatch({screen:'home',returned,...game.storyState});}
  };
  sandbox.data??={};vm.createContext(sandbox);
 vm.runInContext(app.slice(app.indexOf('function storyFlags()'),app.indexOf('function renderArrival()')),sandbox);
  vm.runInContext(app.slice(app.indexOf('function frame(now)'),app.indexOf("document.addEventListener('visibilitychange'")),sandbox);
  let now=0;
  for(const state of ['loss','escape','rescue','sendoff','launch','fall','land','bossArrival','bossLand','recruited']){
   assert.equal(game.state,state);assert.ok(durations[state]>0);
   const hp=game.hp,left=sandbox.left;
   sandbox.hidden=true;director.pause();now+=600000;sandbox.frame(now);
   assert.equal(game.state,state);assert.equal(game.hp,hp);assert.equal(sandbox.left,left);
   sandbox.hidden=false;if(mode!=='voice-stopped')director.resume();
   now+=durations[state]-1;sandbox.frame(now);assert.equal(game.state,state);
   now++;sandbox.frame(now);
   assert.equal(game.elapsed,elapsed);assert.equal(game.answer('tafoni'),'ignored');
  }
  assert.deepEqual(states,['escape','rescue','sendoff','launch','fall','land','bossArrival','bossLand','recruited','home']);
  assert.deepEqual(events,[{kind:'heal',amount:10}]);assert.equal(game.hp,10);
  assert.equal(game.bossRecruited,true);assert.equal(game.guideAvailable,false);
  assert.equal(game.complete,true);assert.equal(director.snapshot.narrator,'animal');
  assert.ok(!director.snapshot.queue.some(l=>l.speaker==='guide'));
 }
});

test('救出台詞と加入の字幕目標尺に余裕を設け、飛行前と主人公着地後を分離',async()=>{
 const script=JSON.parse(await readFile(new URL('../products/word-guild/dialogue-script.json',import.meta.url),'utf8'));
 const seconds=event=>script.events.find(e=>e.event===event).lines.reduce((sum,line)=>sum+line.targetSeconds,0);
 assert.ok(durations.loss>=1000,'HP0を独立した場面として見せる');
 assert.ok(durations.escape>=seconds('rescue.start')*1000+500);
 assert.ok(durations.sendoff>=seconds('rescue.recovered')*1000+500);
 assert.ok(durations.bossArrival+durations.bossLand>=seconds('guild.boss.arrive')*1000+500);
 assert.ok(durations.recruited>=seconds('guild.boss.join')*1000+500);
 assert.ok(durations.launch+durations.fall+durations.land>=seconds('flight.launch')*1000);
});

// 実際の画面コードの遅延式とCSSを読み、双方の変更による不整合を検出する。
async function animationDeadline(){
 const app=await readFile(new URL('../products/word-guild/app.mjs',import.meta.url),'utf8');
 const css=await readFile(new URL('../products/word-guild/style.css',import.meta.url),'utf8');
 const expression=app.match(/--delay:\$\{([^}]+)\}ms/);
 assert.ok(expression,'盤面の石の遅延式が存在する');
 const duration=css.match(/\.falling button\{animation:stone-in\s+([\d.]+)(ms|s)\b/);
 assert.ok(duration,'石の落下時間が存在する');
 const fallMs=Number(duration[1])*(duration[2]==='s'?1000:1);
 const delays=Array.from({length:42},(_,i)=>vm.runInNewContext(expression[1],{i,Math}));
 assert.ok(delays.every(Number.isFinite));
 return {app,deadline:Math.max(...delays)+fallMs};
}

test('最後の石が着地する前に入力再開しない',async()=>{
 const {app,deadline}=await animationDeadline();
 assert.equal(deadline,1035);
 assert.ok(durations.arriving>=deadline,`入力再開${durations.arriving}msは落下完了${deadline}ms以降である必要がある`);
 assert.ok(durations.intrusion>=deadline,'裏ボス階層も全石の落下を待つ');
 assert.match(app,/import\s*\{durations\}\s*from\s*['"]\.\/transition\.mjs['"]/);
 assert.doesNotMatch(app,/const\s+durations\s*=/,'画面側で演出時間を上書きしない');
});

test('実際の画面の時計で950msと1034msは入力停止、1100msで再開',async()=>{
 const {app}=await animationDeadline();
 const frameSource=app.slice(app.indexOf('function frame(now)'),app.indexOf("document.addEventListener('visibilitychange'"));
 assert.ok(frameSource.startsWith('function frame(now)'));
 const game={state:'arriving',events:[],hp:97,next(){this.state='battle';},advance(){throw Error('落下中は戦闘時計を進めない');}};
 let bindings=0;
 const sandbox={game,durations,last:0,left:durations.arriving,hidden:false,screen:'game',strikes:[],paintScene(){},conversation:{advance(){}},requestAnimationFrame(){},advanceBattle(){throw Error("落下中に戦闘を進めない");},renderGame(){if(game.state==='battle')bindings++;},effects(){},update(){}};
 sandbox.data??={};vm.createContext(sandbox);
 vm.runInContext(app.slice(app.indexOf('function storyFlags()'),app.indexOf('function renderArrival()')),sandbox);
 vm.runInContext(frameSource,sandbox);
 for(const now of [950,1034,1035,1099]){
  sandbox.frame(now);
  assert.equal(game.state,'arriving',`${now}msでは落下状態を維持`);
  assert.equal(bindings,0,'入力イベントをまだ接続しない');
  assert.equal(game.hp,97);
 }
 sandbox.frame(1100);
 assert.equal(game.state,'battle');
 assert.equal(bindings,1);
});

test('実画面の時計は音声終了に依存せず帰還相談→凍結→困惑→乱入、非表示中は停止',async()=>{
 const {app}=await animationDeadline();
 const script=JSON.parse(await readFile(new URL('../products/word-guild/dialogue-script.json',import.meta.url),'utf8'));
 const director=new DialogueDirector(script),game=new Game('fire',()=>.5);
 game.stage=4;game.enter();game.answer('cat');game.answer('dog');
 const transitions=[],hp=game.hp;
 const sandbox={game,durations,last:0,left:durations.defeated,hidden:false,screen:'game',strikes:[],
  // 音声が未取得・停止・終了通知なしでもゲームの演出時計は進む。
  conversation:{advance(){}},paintScene(){},requestAnimationFrame(){},effects(){},update(){},
  advanceBattle(ms){game.advance(ms);},
  renderGame(){transitions.push(game.state);director.dispatch({screen:'game',stage:game.stage,state:game.state});}
 };
 sandbox.data??={};vm.createContext(sandbox);
 vm.runInContext(app.slice(app.indexOf('function storyFlags()'),app.indexOf('function renderArrival()')),sandbox);
 vm.runInContext(app.slice(app.indexOf('function frame(now)'),app.indexOf("document.addEventListener('visibilitychange'")),sandbox);
 let now=0;
 for(const state of ['defeated','returning','freezing','bewildered','intrusion']){
  assert.equal(game.state,state);assert.ok(durations[state]>0);
  const left=sandbox.left;
  sandbox.hidden=true;now+=100000;director.pause();sandbox.frame(now);
  assert.equal(sandbox.left,left);assert.equal(game.state,state);assert.equal(game.hp,hp);
  sandbox.hidden=false;director.resume();
  now+=durations[state]-1;sandbox.frame(now);assert.equal(game.state,state);
  now++;sandbox.frame(now);assert.equal(game.hp,hp);
 }
 assert.deepEqual(transitions,['returning','freezing','bewildered','intrusion','battle']);
 assert.equal(game.stage,5);assert.equal(game.elapsed,0);
 const raid=director.snapshot.current;
 assert.equal(raid.id,'raid.guide.shock');
 now+=9999;sandbox.frame(now);assert.equal(game.state,'battle');assert.equal(game.hp,hp);
 now++;sandbox.frame(now);assert.equal(game.state,'loss');assert.equal(game.hp,0);
});
