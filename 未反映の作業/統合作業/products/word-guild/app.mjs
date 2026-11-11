import {loadClawMaterial,renderClaws} from './claws.mjs';
import {Game,Trace,FINAL_LIMIT,loadSave,saveData,Music,validateSave} from './core.mjs';
import {durations} from './transition.mjs';
import {sprite,loadSprite} from './sprites.mjs';
import {warmImages} from './assets-loader.mjs';
import {walking,warmWalk,paintWalk} from './walk-art.mjs';
import {resolveAudioPolicy} from './audio-policy.mjs';
import {FlightSound} from './sound-effects.mjs';
import {Conversation} from './conversation.mjs';
import {getStoryBeat} from './story.mjs';
const view=document.querySelector('#view'),status=document.querySelector('#status'),musicButton=document.querySelector('#music');
const errors={save:'',music:'',material:'',voice:''};
function setError(kind,message=''){errors[kind]=message;const messages=Object.values(errors).filter(Boolean);status.textContent=messages.join('\n');status.parentElement.classList.toggle('errors-multiple',messages.length>1);}
const dev=new URLSearchParams(location.search).get('dev')==='1';
let storage;try{storage=dev?{getItem:()=>null,setItem:()=>{}}:localStorage;}catch{}
const restored=loadSave(storage);let data=restored.data;
if(!restored.ok)setError('save','端末内保存を利用できません。プレイは続けられます。');
let screen='home',game,trace=new Trace(),enabled=false,scene='top',left=0,last=performance.now(),hidden=document.hidden,strikes=[];
let boardObserver;
const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)');
const storyPhases=['returning','freezing','bewildered'];
function phaseTime(){return screen==='game'&&durations[game.state]?Math.max(0,durations[game.state]-left):0;}
function paintScene(){
 if(screen!=='game')return;
 if(['bossArrival','bossLand','recruited'].includes(game.state)){view.style.setProperty('--arrival-progress',String(game.state==='bossArrival'?Math.min(1,phaseTime()/durations.bossArrival):1));view.style.setProperty('--boss-hop',String(game.state==='bossLand'&&!reducedMotion.matches?Math.sin(Math.min(1,phaseTime()/700)*Math.PI):0));return;}
 if(!['travel','freezing','bewildered'].includes(game.state))return;
 const elapsed=phaseTime();
 if(game.state==='bewildered')view.querySelector('#board')?.classList.toggle('crumbling',elapsed>=durations.bewildered-durations.travel);
 const set=(el,key,value)=>{const text=String(value);if(el.style.getPropertyValue(key)!==text)el.style.setProperty(key,text);};
 if(game.state==='travel')set(view,'--walk-progress',Math.min(1,elapsed/durations.travel));
 view.querySelectorAll('.walk-art').forEach(el=>paintWalk(el,elapsed,reducedMotion.matches));
 const arena=view.querySelector('.arena');
 if(arena){
  const freezing=game.state==='freezing',frozen=game.state==='bewildered';
  const t=freezing?elapsed:0;
  set(arena,'--warp',freezing&&!reducedMotion.matches?Math.sin(t/190)*Math.min(1,t/900)*Math.max(0,1-t/4500):0);
  ['rim','frost','cracks'].forEach((layer,i)=>set(arena,`--ice-${layer}`,frozen?1:freezing?(reducedMotion.matches?1:Math.max(0,Math.min(1,(t-1300-i*850)/1600))):0));
 }
}
void loadClawMaterial().catch(()=>{setError('material','切り傷の素材を読み込めません。再読み込みしてください。');});
const music=new Music(()=>new (window.AudioContext||window.webkitAudioContext)());
const voiceButton=document.querySelector('#voice');
const conversation=new Conversation(music,{button:voiceButton,getFallback:()=>story(view.classList.contains('returned')),getNarrator:()=>game?game.narrator:data.bossRecruited?'animal':data.guideAvailable?'guide':null,onError:message=>setError('voice',message)});
voiceButton.onclick=()=>conversation.toggle();
function dialogueContext(returned=false,event){conversation.context({screen,stage:game?.stage??null,state:game?.state||screen,returned,hero:data.hero,ally:data.ally,...storyFlags()},event);}

function storyFlags(){return {bossRecruited:game?.bossRecruited??data.bossRecruited,guideAvailable:game?.guideAvailable??data.guideAvailable};}
function syncStory(){if(game)Object.assign(data,storyFlags());}
function renderArrival(){
 view.classList.add('arrival-view');
 const joined=game.state==='recruited';
 view.innerHTML=`<p class="eyebrow">森の本のギルド</p><h2 class="arrival-title">${joined?'通常ボスが仲間になった！':'もうひとりの帰還'}</h2><div class="guild-return-scene flight-scene return-land" aria-label="主人公の着地後、通常ボスが飛来して着地">${sprite(data.hero+'-land',88,'arrived-hero')}${sprite('animal-'+(joined?'joy':'worried'),120,'boss-traveler')}<span class="arrival-dust"></span>${joined?'<span class="joined-seal">新しい案内役</span>':''}</div><p class="arrival-hp">♥ HP ${game.hp} / 100</p>${conversation.markup(story())}`;
 dialogueContext();conversation.paint();paintScene();
}

function detailed(name){return sprite(name,144,'detail');}
const floorNames=['木漏れ日の小道','せせらぎの橋','ひだまりの庭','根っこの迷い道','けものの書庫','星の封印'];
const people={male:['リオ','男性 · 森を拓く冒険者'],female:['ミナ','女性 · 道を読む冒険者']};
const allies={fire:['ほむら','炎','炎の精霊','草に強い'],water:['しずく','水','水の精霊','火に強い'],grass:['こもれび','草','森の精霊','水に強い']};
function guildArt(){return '<img class="guild-art" src="assets/guild-display-v6.webp" alt="森の本のギルド。木組みの書庫、瓦屋根、光る窓、本の旗、花鉢と石畳" width="240" height="170">';}
function persist(){setError('save',saveData(storage,data)?'':'保存できません。この起動中はプレイできます。');}
const MUSIC_ERROR='音楽を再生できません。音楽ボタンで再試行できます。';
let playRequest=0,flightSound;
const silentFlight=Object.freeze({playing:false,latched:false,starts:0,stops:0,startedAt:null});
function audioPolicy(){return resolveAudioPolicy({screen,stage:game?.stage,state:game?.state});}
function story(returned=false){return getStoryBeat({screen,stage:game?.stage,state:game?.state,returned,hero:data.hero,ally:data.ally,...storyFlags()})||Object.freeze({speaker:data.bossRecruited?'通常ボス':'',text:game?.message||'',expression:'idle'});}
async function play(){
 const request=++playRequest,policy=audioPolicy();scene=policy.musicScene;
 musicButton.textContent=enabled?'音楽を停止':'音楽を再生';
 if(!enabled||hidden){music.stop();flightSound?.stop();return;}
 if(!policy.flightSound)flightSound?.stop();
 try{
  if(scene===null){
   music.stop();
   if(policy.flightSound){
    music.context??=music.factory();await music.context.resume();
    if(request!==playRequest||!enabled||hidden||!audioPolicy().flightSound)return;
    flightSound??=new FlightSound(music.context);flightSound.start();
   }
  }else await music.play(scene);
  if(request===playRequest&&enabled&&!hidden&&(music.source||flightSound?.state.playing))setError('music');
 }catch{
  if(request!==playRequest)return;
  musicButton.textContent='音楽を再試行';setError('music',MUSIC_ERROR);
 }
}
function syncAudio(){void play();}
musicButton.onclick=()=>{enabled=musicButton.textContent==='音楽を再試行'?true:!enabled;void play();};
function home(returned=false){if(returned&&dev)data={...data,bossRecruited:true,guideAvailable:false,complete:true};warmImages(['cat-idle'],'high');boardObserver?.disconnect();screen='home';game=undefined;trace.cancel();syncAudio();view.className=`home landscape ${returned?'returned':''}`;view.innerHTML=`<div class="home-title"><p class="eyebrow">森の本のギルド</p><h2>ことばのギルド</h2><p class="tagline">なぞった言葉が、冒険の力に。</p></div><div class="guild-scene">${guildArt()}<div class="home-party">${sprite(data.hero,88)}${sprite(data.ally,64)}</div><span class="firefly one"></span><span class="firefly two"></span><span class="scene-plaque">言葉の森へ、ようこそ</span></div>${conversation.markup(story(returned))}<button class="primary" id="start"><span class="book-mark" aria-hidden="true"></span>${data.complete?'もう一度、冒険へ':'冒険を始める'}<span aria-hidden="true"> →</span></button><p class="save-note">${data.complete?'✦ 訓練完了 · 選んだ仲間は保存済み':'はじめての冒険 · やさしい英単語から'}</p>`;dialogueContext(returned);conversation.paint();document.querySelector('#start').onclick=()=>{conversation.reset({...data,screen:"home"});conversation.enable();enabled=true;void play();select();};}
function select(){warmWalk(data.hero);warmWalk(data.ally);void loadSprite('cat').catch(()=>{});warmImages(['floor-0'],'high');warmImages(['ui-hero-card','ui-ally-card']);boardObserver?.disconnect();screen='select';syncAudio();view.className='selection landscape';view.innerHTML=`<p class="eyebrow">冒険のしたく</p><h2>あなたと、相棒。</h2>${conversation.markup(story())}<h3>01 <span>主人公を選ぶ</span><small>男女の能力は同じ</small></h3><div class="choices heroes">${['male','female'].map(h=>`<button class="choice-card" data-hero="${h}" aria-pressed="${data.hero===h}"><span class="chosen-mark" aria-hidden="true">✓</span>${sprite(h,104)}<strong>${people[h][0]}</strong><small>${people[h][1]}</small></button>`).join('')}</div><h3>02 <span>相棒を選ぶ</span><small>みんな HP50</small></h3><div class="choices allies">${['fire','water','grass'].map(a=>`<button class="choice-card ally-${a}" data-ally="${a}" aria-pressed="${data.ally===a}"><span class="chosen-mark" aria-hidden="true">✓</span>${sprite(a,80)}<strong>${allies[a][0]}</strong><span class="element element-${a}">${allies[a][1]} · ${allies[a][3]}</span><small>${allies[a][2]}</small></button>`).join('')}</div><p class="affinity-note">水 → 火 → 草 → 水 の順に強い</p><button class="primary" id="depart">このふたりで出発 <span aria-hidden="true">→</span></button><button class="text-button" id="back">← ギルドへ戻る</button>`;
 dialogueContext();conversation.paint();
 const choose=(kind,value)=>{data[kind]=value;warmWalk(value);dialogueContext();view.querySelectorAll(`[data-${kind}]`).forEach(b=>{const selected=b.dataset[kind]===value;b.setAttribute('aria-pressed',selected);b.classList.toggle('just-chosen',selected);});};
 view.querySelectorAll('[data-hero]').forEach(b=>b.onclick=()=>choose('hero',b.dataset.hero));view.querySelectorAll('[data-ally]').forEach(b=>b.onclick=()=>choose('ally',b.dataset.ally));document.querySelector('#back').onclick=()=>home();document.querySelector('#depart').onclick=()=>{dialogueContext(false,'depart');persist();game=new Game(data.ally,Math.random,data);strikes=[];screen='game';last=performance.now();renderGame();};}
function boardHTML(){return `<div id="board" class="${game.state==='travel'?'crumbling':['arriving','intrusion'].includes(game.state)?'falling':''}" aria-label="7列6行の盤面" aria-disabled="${game.state!=='battle'}">${game.board.map((c,i)=>`<button type="button" data-cell="${i}" style="--delay:${(i%7)*35+Math.floor(i/7)*55}ms;--tilt:${i%2?12:-12}deg" aria-label="行${Math.floor(i/7)+1}列${i%7+1} ${c}" ${game.state==='battle'?'':'disabled'}><span class="letter">${c}</span></button>`).join('')}<svg id="claws" viewBox="0 0 700 600" preserveAspectRatio="none" aria-hidden="true"></svg></div>`;}
function renderGame(){
 warmWalk(data.hero);warmWalk(data.ally);const next=Math.min(5,game.stage+1);warmImages([`floor-${game.stage}`,`floor-${next}`,'ui-board-frame','ui-pedestal'],'high');void loadSprite(['cat','dog','sun','ant','animal','final'][next]).catch(()=>{});
 warmImages([`return-${['exit','road','approach','land'][Math.min(3,game.stage)]}`]);
 if(game.stage>=3)void loadSprite(data.hero,['launch','fall','land']).catch(()=>{});
syncAudio();boardObserver?.disconnect();trace.cancel();view.className=`battle landscape floor-${game.stage} state-${game.state}`;if(['launch','fall','land'].includes(game.state)){view.innerHTML=`<p class="eyebrow">ギルドまで、ひとっ飛び</p><h2 class="flight-title">${story().text}</h2><div class="flight-scene return-${game.state}" aria-label="${{launch:'ダンジョン出口から森の街道へ',fall:'ギルドへ接近',land:'ギルドの石畳へ着地'}[game.state]}">${sprite(`${data.hero}-${game.state}`,104,`traveler ${game.state}`)}<span class="landing-dust"></span></div>${conversation.markup(story())}`;dialogueContext();conversation.paint();return;}
 if(['bossArrival','bossLand','recruited'].includes(game.state)){renderArrival();return;}
 const name=game.enemy.word;
 const arena=game.state==='travel'?`<div class="road-scene"><div class="road"></div><div class="walker">${walking(data.hero,88)}${walking(data.ally,58)}</div></div>`:`<div class="enemy-motion motion-${name} ${game.state==='defeated'?'defeated':''}">${storyPhases.includes(game.state)?sprite(name+'-'+(game.state==='returning'?'joy':'worried'),144,'detail'):detailed(name)}</div><div class="pedestal">${game.enemy.ja}</div>`;
 view.innerHTML=`<div class="floor-label"><span>第${game.stage+1}階層</span><strong>${floorNames[game.stage]}</strong><span class="floor-dots" aria-hidden="true">${Array.from({length:6},(_,i)=>`<i class="${i<=game.stage?'lit':''}"></i>`).join('')}</span></div><div class="arena">${arena}${game.state==='loss'?'<div class="raid-impact" aria-hidden="true"><span>一撃！</span></div>':''}${storyPhases.includes(game.state)||game.stage===5?`<div class="terrain-ice" aria-hidden="true">${["rim","frost","cracks"].map(layer=>`<img class="ice-${layer}" src="assets/walk-v9/freeze-${layer}-v9.svg" alt="">`).join("")}</div>`:""}${game.state==='counter'?'<div class="battle-banner danger">大技が来る…！</div>':game.state==='defeated'?'<div class="battle-banner">正解！道が開いた</div>':''}</div><div class="party">${sprite(data.hero,40)}${sprite(data.ally,36)}<span class="party-name">${people[data.hero][0]} ＆ ${allies[data.ally][0]}</span><span id="affinity"></span></div><div id="input" aria-label="入力中の文字"></div><div id="hpbar" role="progressbar" aria-label="合算HP" aria-valuemin="0" aria-valuemax="100"><div id="hpfill"></div><span class="hp-label">♥ HP</span><span id="hp"></span><div id="effects" aria-hidden="true"></div></div>${boardHTML()}${conversation.markup(story())}`;dialogueContext();conversation.paint();
 const svg=document.querySelector('#claws');
 const draw=()=>void renderClaws(svg,strikes).catch(()=>{setError('material','切り傷を表示できません。再読み込みしてください。');});
 draw();boardObserver=new ResizeObserver(draw);boardObserver.observe(svg);
 if(game.state==='battle'){trace=new Trace(game.board);bindBoard();}update();if(game.state==='loss')pulse(view,'raid-hit');}
function update(){if(screen!=='game'||!document.querySelector('#hp'))return;document.querySelector('#hp').textContent=`${game.hp} / 100`;document.querySelector('#hpfill').style.width=`${game.hp}%`;document.querySelector('#hpbar').setAttribute('aria-valuenow',game.hp);if(!conversation.currentId)document.querySelector('#hint').textContent=game.state==='battle'&&game.stage!==5&&game.message!==game.enemy.hint?game.message:story()?.text||game.message;document.querySelector('#affinity').textContent=game.stage===5?(game.state==='loss'?'乱入ボスの一撃！':game.state==='escape'?'救出の準備':game.state==='rescue'?'救出回復 · HP10':game.state==='sendoff'?'ギルドへ送り出し':game.state==='counter'?'大技の予告！':`発見 ${game.found.size}/2 · 大技まで ${Math.ceil(Math.max(0,FINAL_LIMIT-game.elapsed)/1000)}秒`):game.stage===4?`発見 ${game.found.size}/2`:`敵：${{fire:'火',water:'水',grass:'草'}[game.enemy.attr]}`;const hinted=game.hintPath;view.querySelectorAll('[data-cell]').forEach(b=>b.classList.toggle('hint-glow',hinted[game.hintStep]===Number(b.dataset.cell)));}
function pulse(target,kind){if(!target)return;target.classList.remove(kind);void target.offsetWidth;target.classList.add(kind);target.addEventListener('animationend',()=>target.classList.remove(kind),{once:true});}
function effects(events){const box=document.querySelector('#effects');if(!box)return;events.forEach((event,i)=>{const el=document.createElement('b');el.className=`float-number ${event.kind}`;el.textContent=event.kind==='damage'?`−${event.amount}`:`＋${event.amount}`;el.style.animationDelay=`${i*90}ms`;box.append(el);el.addEventListener('animationend',()=>el.remove(),{once:true});pulse(document.querySelector('#hpbar'),event.kind==='damage'?'hit':'recovery');if(event.kind==='heal')pulse(view.querySelector('.guide'),'healing');});}
function paint(){const input=document.querySelector('#input');if(!input)return;input.textContent=trace.text||(game.stage===5?'':'上下左右になぞる · 一歩戻って取り消し');view.querySelectorAll('[data-cell]').forEach(b=>b.classList.toggle('active',trace.path.includes(Number(b.dataset.cell))));}
function advanceBattle(delta){if(hidden||screen!=='game'||game.state!=='battle')return;game.advance(delta);if(game.state==='loss'){left=durations.loss;trace.cancel();renderGame();}else update();effects(game.events);}
function submit(text,path){if(text===null)return;const now=performance.now();advanceBattle(now-last);last=now;const result=game.answer(text);if(['wrong','duplicate','found'].includes(result))dialogueContext(false,`answer.${result}`);if(['found','defeated','loss'].includes(result))strikes.push({path:[...path],started:performance.now()});if(['defeated','loss'].includes(result)){left=durations[result]||0;renderGame();effects(game.events);}else if(result==='found')renderGame();else{paint();update();}if(['found','defeated'].includes(result))pulse(view,'correct');else if(result==='wrong'&&game.stage!==5)pulse(view,'wrong');}
function bindBoard(){const board=document.querySelector('#board'),cellAt=(x,y)=>{const el=document.elementFromPoint(x,y)?.closest('[data-cell]');return el&&board.contains(el)?Number(el.dataset.cell):null;};board.addEventListener('pointerdown',e=>{if(hidden||e.button!==0)return;const i=cellAt(e.clientX,e.clientY);if(i!==null&&trace.start(e.pointerId,i)){e.preventDefault();board.setPointerCapture(e.pointerId);paint();}});board.addEventListener('pointermove',e=>{if(e.pointerId!==trace.pointer)return;e.preventDefault();const samples=e.getCoalescedEvents?.();for(const point of samples?.length?samples:[e]){const i=cellAt(point.clientX,point.clientY);if(i!==null)trace.add(e.pointerId,i);}paint();});board.addEventListener('pointerup',e=>{if(e.pointerId!==trace.pointer)return;e.preventDefault();const i=cellAt(e.clientX,e.clientY);if(i!==null)trace.add(e.pointerId,i);const path=[...trace.path];submit(trace.finish(e.pointerId),path);});const cancel=e=>{if(e.pointerId===trace.pointer){trace.cancel();paint();}};board.addEventListener('pointercancel',cancel);board.addEventListener('lostpointercapture',cancel);board.addEventListener('touchmove',e=>e.preventDefault(),{passive:false});board.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();const path=[...trace.path];submit(trace.finish('keyboard'),path);}else if(e.key===' '&&e.target.dataset.cell!==undefined){e.preventDefault();const i=Number(e.target.dataset.cell);if(trace.pointer===null)trace.start('keyboard',i);else trace.add('keyboard',i);paint();}});paint();}
function frame(now){const delta=now-last;last=now;conversation.advance(delta);if(!hidden&&screen==='game'){if(game.state==='battle'){advanceBattle(delta);}else if(durations[game.state]){left-=delta;if(left<=0){const before=game.state;game.next();syncStory();if(game.state==='recruited')persist();if(before==='travel'||before==='bewildered')strikes=[];if(game.state==='home'){data.complete=game.complete;persist();home(true);}else{left=durations[game.state]||0;renderGame();effects(game.events);}}}}paintScene();requestAnimationFrame(frame);}
document.addEventListener('visibilitychange',()=>{hidden=document.hidden;conversation.visibility(hidden);last=performance.now();trace.cancel();paint();document.body.classList.toggle('paused',hidden);void play();});
// スナップショットのみ公開。配列も凍結し、ゲームを書き換える参照を渡さない。
Object.defineProperty(window,'wordGuildState',{get:()=>Object.freeze({errors:Object.freeze({...errors}),screen,state:screen==='game'?game.state:screen,stage:screen==='game'?game.stage:null,hp:screen==='game'?game.hp:null,elapsed:screen==='game'?game.elapsed:0,hero:data.hero,ally:data.ally,complete:data.complete,found:Object.freeze(screen==='game'?[...game.found]:[]),path:Object.freeze([...trace.path]),input:trace.text,board:Object.freeze(screen==='game'?[...game.board]:[]),hintPath:Object.freeze(screen==='game'?[...game.hintPath]:[]),hintElapsed:screen==='game'?game.hintElapsed:0,hintStep:screen==='game'?game.hintStep:0,phase:Object.freeze({name:screen==='game'?game.state:screen,elapsed:phaseTime(),remaining:screen==='game'?Math.max(0,left):0,duration:screen==='game'?durations[game.state]||0:0}),walking:Object.freeze(Array.from(view.querySelectorAll('.walk-art'),el=>Object.freeze({name:el.dataset.walker,frame:Number(el.dataset.frame),direction:'NE',url:el.getAttribute('src')}))),flightSound:flightSound?.state||silentFlight,storyState:Object.freeze({...storyFlags(),rescueApplied:game?.rescueApplied||false,narrator:game?game.narrator:data.bossRecruited?'animal':data.guideAvailable?'guide':null}),story:story(view.classList.contains('returned')),dialogue:conversation.snapshot,voice:conversation.voice,music:Object.freeze({enabled,scene,playing:!!music.source,track:music.track||null,...music.playback})}),configurable:false});
home();requestAnimationFrame(frame);
if(dev)import('./dev-scenes.mjs').then(({install})=>install({home,select,reset:()=>conversation.reset(),nextLine(){const line=conversation.snapshot?.current;if(line)conversation.director.onLineEnded(line.playbackId);},load(name){conversation.reset();data=validateSave(null);game=new Game(data.ally,()=>.72,data);strikes=[];screen='game';const stages=['cat','dog','sun','ant','animal','final'];game.stage=Math.max(0,stages.indexOf(name));if(!stages.includes(name))game.stage=storyPhases.includes(name)?4:['loss','escape','rescue','sendoff','launch','fall','land','bossArrival','bossLand','recruited','counter','intrusion'].includes(name)?5:0;game.enter();if(!stages.includes(name)){game.state=name;game.message=name==='loss'?'HPが0になると敗北だよ。今回はギルドへ戻ろう。':'確認用の演出シーン';if(['loss','escape'].includes(name))game.hp=0;if(['rescue','sendoff','launch','fall','land','bossArrival','bossLand','recruited'].includes(name)){game.hp=10;game.rescueApplied=true;}if(['launch','fall','land','bossArrival','bossLand','recruited'].includes(name))game.guideAvailable=false;if(name==='recruited')game.bossRecruited=true;if(name==='loss')game.events=[{kind:'damage',amount:100}];if(name==='rescue')game.events=[{kind:'heal',amount:10}];syncStory();if(name==='defeated'){game.found.add('cat');strikes=[{path:[8,9,10],started:performance.now()-240}];}}left=durations[game.state]||0;last=performance.now();renderGame();effects(game.events);},advance(ms){if(screen!=='game')return;game.advance(ms);if(game.state==='loss'){left=durations.loss;trace.cancel();renderGame();}else update();effects(game.events);}}));
