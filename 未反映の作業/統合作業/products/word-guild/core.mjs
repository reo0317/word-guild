import {MUSIC_CUES,musicRange,musicBytes} from './music-cues.mjs';
import {BOSS_QUESTIONS,bossPaths} from './question-data.mjs';
export const ENEMIES=[
 {word:'cat',ja:'猫',attr:'fire',hint:'猫はcat。横になぞろう。行きすぎたら一歩戻せるよ。'},
 {word:'dog',ja:'犬',attr:'water',hint:'犬はdog。縦になぞろう。'},
 {word:'sun',ja:'太陽',attr:'grass',hint:'太陽はsun。上下左右で探そう。'},
 {word:'ant',ja:'アリ',attr:'fire',hint:'アリはant。途中で曲がろう。'},
 {word:'animal',ja:'動物',attr:'water',hint:'猫・犬・アリから違う言葉を2つ探そう。',questions:BOSS_QUESTIONS[4]},
 {word:'final',ja:'雪氷・地形学',attr:'grass',hint:'ええっ…！',questions:BOSS_QUESTIONS[5]}
];
export const FINAL_LIMIT=10000;
export const HINT_DELAY=15000;
export const PATHS=[{cat:[8,9,10]},{dog:[5,12,19]},{sun:[24,25,26]},{ant:[29,30,37]},bossPaths(4),bossPaths(5)];
export function makeBoard(stage,random=Math.random){const board=Array.from({length:42},()=>String.fromCharCode(65+Math.min(25,Math.max(0,Math.floor(random()*26)))));for(const [word,path] of Object.entries(PATHS[stage]))path.forEach((cell,i)=>board[cell]=word[i].toUpperCase());return board;}
export const BOARD=makeBoard(0,()=>.5);
export function damage(ally,enemy){return ally===enemy?2:({water:'fire',fire:'grass',grass:'water'})[ally]===enemy?1:3;}
export function adjacent(a,b){return Number.isInteger(a)&&Number.isInteger(b)&&a>=0&&b>=0&&a<42&&b<42&&Math.abs(a%7-b%7)+Math.abs(Math.floor(a/7)-Math.floor(b/7))===1;}
export class Trace{
 constructor(board=BOARD){this.board=board;this.cancel();}
 cancel(){this.pointer=null;this.path=[];}
 start(id,index){if(this.pointer!==null||!Number.isInteger(index)||index<0||index>=42)return false;this.pointer=id;this.path=[index];return true;}
 add(id,index){if(this.pointer===null||id!==this.pointer||!adjacent(this.path.at(-1),index))return false;if(this.path.length>1&&this.path.at(-2)===index)this.path.pop();else this.path.push(index);return true;}
 get text(){return this.path.map(i=>this.board[i]).join('');}
 finish(id){if(this.pointer===null||id!==this.pointer)return null;const text=this.text;this.cancel();return text;}
}
export class Game{
 constructor(ally='fire',random=Math.random,story={}){this.ally=ally;this.random=random;this.hp=100;this.stage=0;this.found=new Set();this.events=[];Object.assign(this,storyFlags(story));this.complete=story.complete===true;this.rescueApplied=false;this.enter();}
 get narrator(){return this.bossRecruited?'animal':this.guideAvailable?'guide':null;}
 get storyState(){return Object.freeze({bossRecruited:this.bossRecruited,guideAvailable:this.guideAvailable,complete:this.complete,rescueApplied:this.rescueApplied,narrator:this.narrator});}
 get enemy(){return ENEMIES[this.stage];}
 get hintPath(){if(this.state!=='battle'||(this.stage!==5&&this.hintElapsed<HINT_DELAY))return [];return PATHS[this.stage][Object.keys(PATHS[this.stage]).find(w=>!this.found.has(w))]||[];}
 get hintStep(){return Math.floor(Math.max(0,this.hintElapsed-(this.stage===5?0:HINT_DELAY))/450)%Math.max(1,this.hintPath.length);}
 enter(){this.state='battle';this.elapsed=0;this.hintElapsed=0;this.tick=0;this.board=makeBoard(this.stage,this.random);this.message=this.enemy.hint;}
 counter(){if(this.state!=='battle')return;const amount=this.hp;this.hp=0;this.state='loss';this.events=[{kind:'damage',amount}];this.message='HPが0になった…！';}
 advance(ms){this.events=[];if(this.state!=='battle'||!Number.isFinite(ms)||ms<=0)return;const target=this.elapsed+ms;
  if(this.stage===5){this.hintElapsed+=ms;this.elapsed=Math.min(target,FINAL_LIMIT);if(target>=FINAL_LIMIT)this.counter();return;}
  this.elapsed=target;this.hintElapsed+=ms;
  while((this.tick+1)*10000<=this.elapsed){this.tick++;const amount=damage(this.ally,this.enemy.attr),before=this.hp;this.hp=Math.max(1,this.hp-amount);this.events.push({kind:'damage',amount:before-this.hp});if(this.tick%3===0){const old=this.hp;this.hp=Math.min(100,this.hp+10);this.events.push({kind:'heal',amount:this.hp-old});}}
 }
 answer(text){this.events=[];if(this.state!=='battle')return 'ignored';const word=String(text).toLowerCase(),allowed=Object.keys(PATHS[this.stage]);
  if(!allowed.includes(word)){if(this.stage!==5)this.message='もう一度、最初の文字からなぞろう。';return 'wrong';}
  if(this.found.has(word)){if(this.stage!==5)this.message='その言葉は発見済み。別の言葉を探そう。';return 'duplicate';}
  this.found.add(word);this.hintElapsed=0;
  if(this.stage>=4&&this.found.size<2){if(this.stage!==5)this.message='発見！あと1つ、違う言葉を探そう。';return 'found';}
  if(this.stage===5)this.counter();else{this.state='defeated';this.message='正解！道が開いた！';}return this.state;
 }
 next(){
  this.events=[];
  if(this.state==='defeated')this.state=this.stage===4?'returning':'travel';
  else if(this.state==='returning')this.state='freezing';
  else if(this.state==='freezing')this.state='bewildered';
  else if(this.state==='bewildered'){
   this.stage=5;this.found.clear();this.enter();this.state='intrusion';
  }
  else if(this.state==='travel'){
   this.stage++;this.found.clear();this.enter();this.state=this.stage===5?'intrusion':'arriving';
  }
  else if(['intrusion','arriving'].includes(this.state)){this.state='battle';this.elapsed=0;this.hintElapsed=0;}
  else if(this.state==='counter'){this.state='battle';this.counter();}
  else if(this.state==='loss'){this.state='escape';this.message='ここから逃します！';}
  else if(this.state==='escape'){
   this.state='rescue';
   if(!this.rescueApplied){const before=this.hp;this.hp=10;this.rescueApplied=true;this.events=[{kind:'heal',amount:this.hp-before}];}
   this.message='HPが10に回復した！';
  }
  else if(this.state==='rescue'){this.state='sendoff';this.message='うまく着地してくださいね！';}
  else if(this.state==='sendoff'){this.state='launch';this.guideAvailable=false;this.message='うわああああああ';}
  else if(this.state==='launch')this.state='fall';
  else if(this.state==='fall')this.state='land';
  else if(this.state==='land'){this.state='bossArrival';this.message='通常ボスも飛んできた！';}
  else if(this.state==='bossArrival')this.state='bossLand';
  else if(this.state==='bossLand'){this.state='recruited';this.bossRecruited=true;this.guideAvailable=false;this.message='通常ボスが仲間になった！';}
  else if(this.state==='recruited'){this.state='home';this.complete=true;}
 }
}
export const SAVE_KEY='word-guild-v1';
function storyFlags(v){const bossRecruited=v?.bossRecruited===true;return {bossRecruited,guideAvailable:!bossRecruited&&v?.guideAvailable!==false};}
export function validateSave(v){const valid=v?.version===1&&['male','female'].includes(v.hero)&&['fire','water','grass'].includes(v.ally)&&typeof v.complete==='boolean';const base=valid?{version:1,hero:v.hero,ally:v.ally,complete:v.complete}:{version:1,hero:'male',ally:'fire',complete:false};return {...base,...storyFlags(valid?v:null)};}
export function loadSave(storage){try{return {data:validateSave(JSON.parse(storage.getItem(SAVE_KEY))),ok:true};}catch{return {data:validateSave(null),ok:false};}}
export function saveData(storage,data){try{storage.setItem(SAVE_KEY,JSON.stringify(validateSave(data)));return true;}catch{return false;}}
export class Music{
 constructor(factory,fetcher=fetch){this.factory=factory;this.fetcher=fetcher.bind(globalThis);this.context=null;this.buffers=new Map();this.loading=new Map();this.source=null;this.track=null;this.generation=0;this.key=null;this.pending=null;this.gain=null;this.ducked=false;this.cueGain=1;this.starts=0;this.stops=0;this.startedAt=0;}
 setDucking(active){this.ducked=!!active;this.applyGain();}
 applyGain(){if(!this.gain)return;const param=this.gain.gain,target=this.cueGain*(this.ducked ? .3 : 1),now=this.context.currentTime;if(param.cancelScheduledValues&&param.setTargetAtTime){param.cancelScheduledValues(now);param.setTargetAtTime(target,now,.08);}else param.value=target;}
 get playback(){return Object.freeze({starts:this.starts,stops:this.stops,position:this.source?Math.max(0,this.context.currentTime-this.startedAt)%(this.source.loopEnd-this.source.loopStart):0,gain:this.gain?.gain.value||0,ducked:this.ducked});}
 stop(){this.generation++;this.key=null;this.pending=null;this.track=null;if(this.source){this.stops++;try{this.source.stop();}catch{}this.source.disconnect();this.source=null;}this.gain=null;}
 async play(scene){const cue=MUSIC_CUES[scene]||MUSIC_CUES.top,key=JSON.stringify([cue.url,cue.start,cue.end]);this.context??=this.factory();
  if(this.key===key){if(this.source){const generation=this.generation;await this.context.resume();if(generation===this.generation&&this.gain){this.cueGain=cue.gain;this.applyGain();}return;}if(this.pending){this.pending.cue=cue;return this.pending.promise;}}
  this.stop();this.key=key;const generation=this.generation,request={cue,promise:null};this.pending=request;
  request.promise=this.begin(scene,request,generation).finally(()=>{if(this.pending===request)this.pending=null;});return request.promise;
 }
 async begin(scene,request,generation){const cue=request.cue;
  try{await this.context.resume();if(generation!==this.generation)return;
   if(!this.buffers.has(cue.url)){
    if(!this.loading.has(cue.url)){const pending=this.fetcher(cue.url).then(r=>{if(!r.ok)throw Error('音源が見つかりません');return r.arrayBuffer();}).then(b=>this.context.decodeAudioData(musicBytes(b))).then(b=>{musicRange(scene,b.duration);if(b.numberOfChannels!==2)throw Error('ステレオ音源が必要です');
     // デコード末端の段差を抑える8msフェード。原ファイルは保持する。
     if(b.getChannelData)for(let ch=0;ch<2;ch++){const x=b.getChannelData(ch),n=Math.min(Math.floor(b.sampleRate*.008),Math.floor(x.length/2));for(let i=0;i<n;i++){x[i]*=i/n;x[x.length-1-i]*=i/n;}}
     this.buffers.set(cue.url,b);return b;}).finally(()=>this.loading.delete(cue.url));this.loading.set(cue.url,pending);}
    await this.loading.get(cue.url);
   }
   if(generation!==this.generation)return;
   const source=this.context.createBufferSource(),gain=this.context.createGain();source.buffer=this.buffers.get(cue.url);source.loop=true;[source.loopStart,source.loopEnd]=musicRange(scene,source.buffer.duration);gain.gain.value=request.cue.gain*(this.ducked ? .3 : 1);source.connect(gain);gain.connect(this.context.destination);source.onended=()=>gain.disconnect();source.start(0,source.loopStart);this.source=source;this.gain=gain;this.track=request.cue.track;this.cueGain=request.cue.gain;this.starts++;this.startedAt=this.context.currentTime;
  }catch(error){if(generation===this.generation){this.key=null;throw error;}}
 }
}
