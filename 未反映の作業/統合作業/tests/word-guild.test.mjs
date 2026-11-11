import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {BOSS_QUESTIONS} from '../products/word-guild/question-data.mjs';
import {Game,Trace,ENEMIES,PATHS,FINAL_LIMIT,HINT_DELAY,makeBoard,adjacent,damage,loadSave,saveData,validateSave,SAVE_KEY,Music} from '../products/word-guild/core.mjs';
function nextFloor(g){
 const boss=g.stage===4;
 g.next();
 if(boss){
  for(const state of ['returning','freezing','bewildered']){assert.equal(g.state,state);g.next();}
  assert.equal(g.state,'intrusion');
 }else{assert.equal(g.state,'travel');g.next();assert.equal(g.state,'arriving');}
 g.next();assert.equal(g.state,'battle');
}
function finalGame(){const g=new Game('water',()=>.5);for(const word of ['cat','dog','sun','ant']){g.answer(word);nextFloor(g);}g.answer('cat');g.answer('dog');nextFloor(g);return g;}
test('HP0→救出10は一度だけ。主人公着地→通常ボス着地→加入、両即死経路とも戦闘時計停止',()=>{
 for(const method of ['time','answers'])for(const ally of ['fire','water','grass']){
  const g=finalGame();g.ally=ally;g.hp=37;
  if(method==='time')g.advance(FINAL_LIMIT);
  else{g.answer('cryoconite');g.answer('tafoni');}
  assert.deepEqual(g.events,[{kind:'damage',amount:37}]);
  assert.equal(g.hp,0);assert.equal(g.rescueApplied,false);
  const elapsed=g.elapsed,tick=g.tick,board=[...g.board],found=[...g.found],notifications=[];
  for(const state of ['loss','escape','rescue','sendoff','launch','fall','land','bossArrival','bossLand','recruited','home']){
   assert.equal(g.state,state);
   notifications.push(...g.events);
   assert.equal(g.hp,['loss','escape'].includes(state)?0:10);
   assert.equal(g.rescueApplied,!['loss','escape'].includes(state));
   assert.equal(g.bossRecruited,['recruited','home'].includes(state));
   assert.equal(g.guideAvailable,['loss','escape','rescue','sendoff'].includes(state));
   assert.equal(g.narrator,['recruited','home'].includes(state)?'animal':['loss','escape','rescue','sendoff'].includes(state)?'guide':null);
   g.advance(600000);
   assert.deepEqual(g.events,[]);
   assert.equal(g.answer('sastrugi'),'ignored');assert.equal(g.hp,['loss','escape'].includes(state)?0:10);
   assert.equal(g.elapsed,elapsed);assert.equal(g.tick,tick);
   assert.deepEqual(g.board,board);assert.deepEqual([...g.found],found);
   assert.deepEqual(g.hintPath,[]);g.counter();assert.deepEqual(g.events,[]);
   if(state!=='home')g.next();
  }
  assert.equal(g.complete,true);
  assert.deepEqual(notifications.filter(e=>e.kind==='heal'),[{kind:'heal',amount:10}]);
  assert.equal(notifications.filter(e=>e.kind==='damage').length,1);
  assert.ok(Object.isFrozen(g.storyState));
  for(let n=0;n<5;n++){g.next();g.advance(600000);assert.equal(g.hp,10);assert.equal(g.state,'home');assert.deepEqual(g.events,[]);}
  assert.equal(g.ally,ally);assert.equal(damage(ally,'fire'),{fire:2,water:1,grass:3}[ally]);
 }
});

test('保存version1とキーを維持。旧completeでは加入を推測せず、新加入と別離を復元',()=>{
 assert.equal(SAVE_KEY,'word-guild-v1');
 const legacy={version:1,hero:'female',ally:'water',complete:true};
 assert.deepEqual(validateSave(legacy),{...legacy,bossRecruited:false,guideAvailable:true});
 const g=finalGame();g.advance(FINAL_LIMIT);
 while(g.state!=='home')g.next();
 let raw,key;const storage={getItem:k=>{assert.equal(k,SAVE_KEY);return raw;},setItem:(k,v)=>{key=k;raw=v;}};
 assert.equal(saveData(storage,{...legacy,...g.storyState}),true);assert.equal(key,SAVE_KEY);
 const saved=loadSave(storage).data;
 assert.deepEqual(saved,{...legacy,bossRecruited:true,guideAvailable:false});
 const reopened=new Game(saved.ally,()=>.5,saved);
 assert.equal(reopened.narrator,'animal');assert.equal(reopened.complete,true);
 assert.equal(reopened.hp,100,'保存は初回版の選択と物語のみ。新しい戦闘の最大HPは100');
 assert.equal(reopened.ally,'water');assert.equal(reopened.rescueApplied,false);
 assert.equal(validateSave({...legacy,bossRecruited:true,guideAvailable:true}).guideAvailable,false);
 assert.equal(validateSave({...legacy,guideAvailable:false}).guideAvailable,false);
 assert.equal(validateSave({...legacy,bossRecruited:'yes',guideAvailable:'no'}).guideAvailable,true);
 assert.equal(validateSave({...legacy,version:2,bossRecruited:true}).bossRecruited,false);
});
test('各階層42文字、ランダム埋めと全正解経路',()=>{for(let stage=0;stage<6;stage++){const board=makeBoard(stage,()=>.6);assert.equal(board.length,42);assert.ok(board.every(c=>/^[A-Z]$/.test(c)));const occupied=new Map();for(const [word,path] of Object.entries(PATHS[stage])){assert.equal(path.length,word.length);assert.equal(new Set(path).size,path.length);path.forEach((cell,i)=>{if(occupied.has(cell))assert.equal(occupied.get(cell),word[i].toUpperCase());occupied.set(cell,word[i].toUpperCase());});const t=new Trace(board);t.start(1,path[0]);for(const i of path.slice(1))assert.equal(t.add(1,i),true);assert.equal(t.finish(1),word.toUpperCase());}}assert.notDeepEqual(makeBoard(0,()=>0),makeBoard(0,()=>.9));for(const stage of [4,5]){assert.ok(BOSS_QUESTIONS[stage].length>=3);assert.ok(Object.isFrozen(BOSS_QUESTIONS[stage]));for(const q of BOSS_QUESTIONS[stage]){assert.ok(q.clue.length>0&&(stage===4||q.sourceUrl.startsWith('https://')));assert.ok(!ENEMIES[stage].hint.toLowerCase().includes(q.answer));assert.deepEqual(PATHS[stage][q.answer],q.path);}}});
test('CATWからTへ戻るとCAT、さらに戻して短縮、滞留無効',()=>{const board=makeBoard(0,()=>0);board[11]='W';const t=new Trace(board);t.start(1,8);for(const i of [9,10,11])t.add(1,i);assert.equal(t.text,'CATW');t.add(1,10);assert.equal(t.text,'CAT');assert.equal(t.add(1,10),false);t.add(1,9);assert.equal(t.text,'CA');t.add(1,10);assert.equal(t.finish(1),'CAT');});
test('直前以外の再訪は追加、別指・非隣接・斜め・キャンセル',()=>{const t=new Trace(makeBoard(0,()=>0));t.start(1,8);assert.equal(t.start(2,9),false);assert.equal(t.add(2,9),false);assert.equal(t.add(1,16),false);assert.equal(t.add(1,41),false);for(const i of [9,16,15,8])assert.equal(t.add(1,i),true);assert.deepEqual(t.path,[8,9,16,15,8]);assert.equal(t.finish(2),null);t.cancel();assert.equal(t.finish(1),null);assert.equal(adjacent(6,7),false);});
test('相性9組、同時攻撃回復、長時間生存',()=>{const expected={fire:[2,3,1],water:[1,2,3],grass:[3,1,2]};for(const a of Object.keys(expected))['fire','water','grass'].forEach((e,i)=>assert.equal(damage(a,e),expected[a][i]));const g=new Game('grass');g.advance(9999);assert.equal(g.hp,100);g.advance(1);assert.equal(g.hp,97);g.advance(20000);assert.equal(g.hp,100);assert.deepEqual(g.events.map(e=>e.kind),['damage','damage','heal']);g.hp=1;g.advance(30000);assert.equal(g.hp,11);g.advance(3600000);assert.equal(g.hp,100);});
test('撃破・道・落下中は時計停止、盤面保持と差し替え',()=>{const g=new Game('grass',()=>.5);g.advance(10000);const old=[...g.board];g.answer('bad');assert.equal(g.hp,97);g.answer('cat');g.advance(600000);assert.equal(g.hp,97);g.next();assert.equal(g.state,'travel');assert.deepEqual(g.board,old);g.advance(600000);assert.equal(g.hp,97);g.next();assert.equal(g.state,'arriving');assert.notDeepEqual(g.board,old);g.advance(600000);assert.equal(g.hp,97);g.next();g.advance(10000);assert.equal(g.hp,96);});
test('動物ボスと専門語ラスボス異なる2語、全候補の二語組合せと重複無効',()=>{for(const stage of [4,5]){const words=Object.keys(PATHS[stage]);for(let a=0;a<words.length;a++)for(let b=a+1;b<words.length;b++){const pair=new Game();pair.stage=stage;pair.enter();assert.equal(pair.answer('sun'),'wrong');assert.equal(pair.answer(words[a]),'found');assert.equal(pair.answer(words[a]),'duplicate');assert.equal(pair.found.size,1);assert.equal(pair.answer(words[b]),stage===4?'defeated':'loss');assert.equal(pair.found.size,2);}}const g=finalGame();assert.equal(g.answer('light'),'wrong');assert.equal(g.answer('CRYOCONITE'),'found');assert.equal(g.answer('cryoconite'),'duplicate');assert.equal(g.found.size,1);assert.equal(g.answer('sastrugi'),'loss');assert.equal(g.hp,0);for(const state of ['loss','escape','rescue','sendoff','launch','fall','land','bossArrival','bossLand','recruited','home']){assert.equal(g.state,state);g.advance(600000);assert.equal(g.hp,['loss','escape'].includes(state)?0:10);g.next();}});
test('裏ボスは無回答・1語回答でも10秒で即死、通常階層には制限なし',()=>{for(const answer of [null,'tafoni']){const g=finalGame();if(answer)g.answer(answer);g.advance(FINAL_LIMIT-1);assert.equal(g.state,'battle');g.advance(1);assert.equal(g.state,'loss');assert.equal(g.answer('sastrugi'),'ignored');assert.equal(g.state,'loss');assert.equal(g.hp,0);g.advance(300000);assert.equal(g.hp,0);}const normal=new Game();normal.advance(FINAL_LIMIT*20);assert.equal(normal.state,'battle');});
test('保存復元と破損・利用不可',()=>{let value=null;const storage={getItem:()=>value,setItem:(_k,v)=>value=v},data={version:1,hero:'female',ally:'water',complete:true};assert.equal(saveData(storage,data),true);assert.deepEqual(loadSave(storage).data,{...data,bossRecruited:false,guideAvailable:true});value='{';assert.equal(loadSave(storage).data.complete,false);assert.equal(loadSave(undefined).ok,false);assert.equal(saveData(undefined,data),false);});
function context(duration=48,channels=2){return {sources:[],resume:async()=>{},decodeAudioData:async()=>({duration,numberOfChannels:channels}),destination:{},createGain:()=>({gain:{},connect(){},disconnect(){}}),createBufferSource(){const s={connect(){},disconnect(){},start(_t,offset){this.offset=offset;},stop(){this.stopped=true;this.onended?.();}};this.sources.push(s);return s;}};}
test('音楽の場面別音源・停止・短い音源',async()=>{const ctx=context(30),calls=[],m=new Music(()=>ctx,async(url)=>{calls.push(url);return {ok:true,arrayBuffer:async()=>new ArrayBuffer(0)};});await m.play('top');assert.equal(ctx.sources[0].loopEnd,30);assert.equal(m.track,'nandeshou');await m.play('boss');assert.equal(ctx.sources[0].stopped,true);assert.equal(m.track,'flap2');assert.equal(calls.length,2);await m.play('final');assert.equal(m.track,'raid');assert.equal(calls.length,3);assert.equal(ctx.sources[1].stopped,true);assert.equal(ctx.sources.length,3);await m.play('battle');assert.equal(m.track,'breeze3');assert.equal(calls.length,4);const ordinary=m.source;await m.play('battle');assert.equal(m.source,ordinary);await m.play('return');assert.equal(m.track,'gudaguda');assert.equal(calls.length,5);m.stop();assert.equal(ctx.sources.at(-1).stopped,true);await assert.rejects(new Music(()=>context(.05),async()=>({ok:true,arrayBuffer:async()=>new ArrayBuffer(0)})).play('top'));await assert.rejects(new Music(()=>context(30,1),async()=>({ok:true,arrayBuffer:async()=>new ArrayBuffer(0)})).play('top'));});
test('音源ロード競合・停止中ロード・失敗後再試行',async()=>{const releases={},ctx=context(30),m=new Music(()=>ctx,url=>new Promise(r=>releases[url]=r));const a=m.play('top');await Promise.resolve();const b=m.play('boss');await Promise.resolve();const response={ok:true,arrayBuffer:async()=>new ArrayBuffer(0)};releases['assets/music/flap2-loop.mp3'](response);await b;assert.equal(m.track,'flap2');releases['assets/music/nandeshou.wgm'](response);await a;assert.equal(ctx.sources.length,1);const c=m.play('return');await Promise.resolve();m.stop();releases['assets/music/gudaguda.wgm'](response);await c;assert.equal(ctx.sources.length,1);let attempts=0;const retry=new Music(()=>context(30),async()=>({ok:++attempts>1,arrayBuffer:async()=>new ArrayBuffer(0)}));await assert.rejects(retry.play('top'));await retry.play('top');assert.equal(attempts,2);assert.equal(retry.track,'nandeshou');});
test('発光ヒントの15秒・未発見経路・正解リセット・遷移と乱入開始時発光',()=>{const g=new Game();g.stage=4;g.enter();g.advance(HINT_DELAY-1);assert.deepEqual(g.hintPath,[]);g.advance(1);assert.deepEqual(g.hintPath,PATHS[4].cat);g.answer('bad');assert.deepEqual(g.hintPath,PATHS[4].cat);g.answer('cat');assert.deepEqual(g.hintPath,[]);g.advance(HINT_DELAY);assert.deepEqual(g.hintPath,PATHS[4].dog);g.answer('cat');assert.deepEqual(g.hintPath,PATHS[4].dog);g.answer('dog');assert.deepEqual(g.hintPath,[]);nextFloor(g);assert.deepEqual(g.hintPath,PATHS[5].cryoconite);assert.equal(g.hintStep,0);g.advance(450);assert.equal(g.hintStep,1);g.advance(9549);assert.deepEqual(g.hintPath,PATHS[5].cryoconite);assert.equal(g.message,'ええっ…！');g.answer('bad');assert.equal(g.message,'ええっ…！');g.answer('cryoconite');assert.equal(g.message,'ええっ…！');assert.deepEqual(g.hintPath,PATHS[5].sastrugi);assert.equal(g.hintStep,0);assert.equal(g.elapsed,9999);g.advance(1);assert.equal(g.hp,0);assert.deepEqual(g.hintPath,[]);});
test('ラスボス9999/10000ms・2語競合・即死一回・相性攻撃と回復なし',()=>{for(const ally of ['fire','water','grass']){const g=finalGame();g.ally=ally;g.hp=37;g.advance(9999);assert.equal(g.hp,37);assert.deepEqual(g.events,[]);g.advance(1);assert.equal(g.hp,0);assert.deepEqual(g.events,[{kind:'damage',amount:37}]);assert.equal(g.answer('sastrugi'),'ignored');g.advance(600000);assert.equal(g.hp,0);assert.deepEqual(g.events,[]);}const early=finalGame();early.advance(9999);early.answer('cryoconite');assert.equal(early.answer('tafoni'),'loss');assert.equal(early.hp,0);early.advance(1);assert.deepEqual(early.events,[]);});

test('ボス撃破後は帰還相談・凍結・困惑・乱入。番人と盤面を保持し全戦闘時計を停止',()=>{
 const g=new Game('fire',()=>.5);g.stage=4;g.enter();g.advance(10000);
 const hp=g.hp,elapsed=g.elapsed,tick=g.tick,board=[...g.board];
 g.answer('cat');g.answer('dog');
 for(const state of ['defeated','returning','freezing','bewildered']){
  assert.equal(g.state,state);assert.equal(g.stage,4);assert.equal(g.enemy.word,'animal');
  assert.deepEqual(g.board,board);assert.deepEqual([...g.found],['cat','dog']);
  g.advance(600000);assert.equal(g.hp,hp);assert.equal(g.elapsed,elapsed);assert.equal(g.tick,tick);
  assert.deepEqual(g.events,[]);assert.deepEqual(g.hintPath,[]);assert.equal(g.answer('ant'),'ignored');g.next();
 }
 assert.equal(g.state,'intrusion');assert.equal(g.stage,5);assert.notDeepEqual(g.board,board);
 assert.equal(g.found.size,0);assert.equal(g.elapsed,0);assert.equal(g.hintElapsed,0);
 g.advance(600000);assert.equal(g.hp,hp);assert.equal(g.elapsed,0);assert.equal(g.answer('tafoni'),'ignored');
 g.next();assert.equal(g.state,'battle');g.advance(9999);assert.equal(g.hp,hp);g.advance(1);
 assert.equal(g.state,'loss');assert.equal(g.hp,0);assert.deepEqual(g.events,[{kind:'damage',amount:hp}]);
});
test('盤面保持・爪痕・石演出の画面接続',async()=>{const app=await readFile(new URL('../products/word-guild/app.mjs',import.meta.url),'utf8'),css=await readFile(new URL('../products/word-guild/style.css',import.meta.url),'utf8');assert.ok(app.includes('${boardHTML()}'));assert.ok(app.includes('strikes.push({path:[...path],started:performance.now()})'));assert.ok(app.includes('const path=[...trace.path]'));assert.ok(app.includes('aria-disabled'));for(const term of ['.claw-reveal.fresh','@keyframes stone-out','@keyframes stone-in','touch-action:none'])assert.ok(css.includes(term));});

test('同一道中曲の取得中は階層と移動の要求を共有し一度だけ開始',async()=>{const ctx=context(30),calls=[];let release;const m=new Music(()=>ctx,url=>{calls.push(url);return new Promise(r=>release=r);});const a=m.play('battle');await Promise.resolve();const b=m.play('battle'),c=m.play('battle');release({ok:true,arrayBuffer:async()=>new ArrayBuffer(0)});await Promise.all([a,b,c]);assert.equal(calls.length,1);assert.equal(ctx.sources.length,1);const source=m.source;await m.play('battle');assert.equal(m.source,source);assert.equal(source.stopped,undefined);m.stop();assert.equal(source.stopped,true);});


test('画像取得は共有・優先昇格・失敗再試行し、状態は読み取り専用',async()=>{
 const previousImage=globalThis.Image,previousWindow=globalThis.window,requests=[];
 class ImageMock{
  set src(url){this.url=url;requests.push(this);}
  decode(){return new Promise((resolve,reject)=>{this.resolve=resolve;this.reject=reject;});}
 }
 globalThis.Image=ImageMock;globalThis.window={};
 const wait=()=>new Promise(resolve=>setTimeout(resolve,20));
 try{
  const code=await readFile(new URL('../products/word-guild/assets-loader.mjs',import.meta.url),'utf8');
  const loader=await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'));
  const a=loader.loadImage('a'),b=loader.loadImage('b'),high=loader.loadImage('visible','high');
  assert.equal(loader.loadImage('visible','high'),high);await wait();
  assert.deepEqual(requests.map(i=>i.url),['visible']);
  assert.equal(loader.loadImage('b','high'),b);await wait();
  assert.equal(requests[1].url,'b');assert.equal(requests[1].fetchPriority,'high');
  let updates=0;loader.onImagesReady(()=>updates++);
  requests[0].resolve();await high;assert.equal(loader.ready('visible'),true);
  const failed=assert.rejects(b);requests[1].reject(new Error('503'));await failed;
  await wait();assert.equal(requests[2].url,'a');requests[2].resolve();await a;assert.equal(updates,2);
  assert.equal(loader.ready('b'),false);
  const retry=loader.loadImage('b','high');await wait();requests[3].resolve();await retry;
  assert.equal(loader.ready('b'),true);assert.equal(requests.filter(i=>i.url==='visible').length,1);
  const state=window.wordGuildAssets;assert.ok(Object.isFrozen(state)&&state.every(Object.isFrozen));
  assert.equal(state.find(e=>e.url==='b').ready,true);
 }finally{globalThis.Image=previousImage;globalThis.window=previousWindow;}
});
