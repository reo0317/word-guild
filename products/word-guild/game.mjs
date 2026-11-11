export const BOARD = ['CATXDXX','XXXXOXX','SXXXGXX','XUXXXXX','XXNANXX','XXXXTXX'].join('').split('');
export const ENEMIES = [
 {word:'cat',ja:'猫',type:'fire',hint:'猫はcat。横になぞって指を離そう。'},
 {word:'dog',ja:'犬',type:'water',hint:'犬はdog。縦になぞろう。'},
 {word:'sun',ja:'太陽',type:'grass',hint:'太陽はsun。斜めにも進めるよ。'},
 {word:'ant',ja:'アリ',type:'fire',hint:'アリはant。途中で曲がってみよう。'},
 {word:'animal',ja:'動物',type:'water',hint:'cat・dog・antから違う言葉を2つ見つけよう。'}
];
export const KEY='word-guild-v1';
export function validSave(value){return value?.version===1 && ['male','female'].includes(value.hero) && ['fire','water','grass'].includes(value.ally) && typeof value.complete==='boolean';}
export function defaults(){return {version:1,hero:'male',ally:'water',complete:false};}
export function load(storage){try{const v=JSON.parse(storage.getItem(KEY));return {data:validSave(v)?v:defaults(),ok:true};}catch{return {data:defaults(),ok:false};}}
export function save(storage,data){try{storage.setItem(KEY,JSON.stringify(data));return true;}catch{return false;}}
export function damage(ally,enemy){const beats={water:'fire',fire:'grass',grass:'water'};return ally===enemy?2:beats[ally]===enemy?1:3;}
export function adjacent(a,b){return a!==b && Math.abs(Math.floor(a/7)-Math.floor(b/7))<=1 && Math.abs(a%7-b%7)<=1;}
export class Trace{
 constructor(submit){this.submit=submit;this.cancel();}
 down(id,index){if(this.id!==null || !Number.isInteger(index) || index<0 || index>=42)return false;this.id=id;this.path=[index];return true;}
 move(id,index){if(id!==this.id || !Number.isInteger(index) || index<0 || index>=42)return false;const last=this.path.at(-1);if(!adjacent(last,index))return false;this.path.push(index);return true;}
 up(id){if(id!==this.id)return;const word=this.word;this.cancel();return this.submit(word);}
 cancel(){this.id=null;this.path=[];}
 get word(){return this.path.map(i=>BOARD[i]).join('').toLowerCase();}
}
export class Game{
 constructor(data=defaults(),persist=()=>true){this.data={...data};this.persist=persist;this.state='top';this.hp=100;this.index=0;this.found=new Set();this.elapsed=0;this.attack=10000;this.heal=30000;this.phase=0;this.message='言葉を見つけて、冒険に出よう。';this.events=[];}
 get enemy(){return ENEMIES[this.index];}
 commit(){this.saved=this.persist({...this.data});}
 select(){if(this.state==='top')this.state='select';}
 start(hero,ally){if(this.state!=='select' || !['male','female'].includes(hero) || !['fire','water','grass'].includes(ally))return;this.data.hero=hero;this.data.ally=ally;this.commit();this.hp=100;this.index=0;this.found.clear();this.enterBattle();}
 enterBattle(){this.state='battle';this.elapsed=0;this.attack=10000;this.heal=30000;this.message=this.enemy.hint;}
 answer(word){if(this.state!=='battle')return 'ignored';word=word.toLowerCase();const allowed=this.index===4?['cat','dog','ant']:[this.enemy.word];if(!allowed.includes(word)){this.message='もう一度、最初の文字からなぞろう。';return 'wrong';}if(this.found.has(word)){this.message='その言葉は見つけたね。別の言葉を探そう。';return 'duplicate';}this.found.add(word);if(this.index===4 && this.found.size<2){this.message='いいね！あと1つ、違う言葉を探そう。';return 'correct';}this.state='defeated';this.phase=0;this.message='正解！敵を倒した！';return 'defeated';}
 advance(ms){if(!Number.isFinite(ms)||ms<0)return;this.events=[];if(this.state==='battle'){const target=this.elapsed+ms;while(Math.min(this.attack,this.heal)<=target){if(this.attack<=this.heal){this.hp=Math.max(1,this.hp-damage(this.data.ally,this.enemy.type));this.events.push('attack');this.attack+=10000;}else{this.hp=Math.min(100,this.hp+10);this.events.push('heal');this.heal+=30000;}}this.elapsed=target;return;}
 const durations={defeated:650,intrusion:1300,launch:1000,fall:1000,land:700};let remaining=ms;while(durations[this.state]!==undefined){const need=durations[this.state]-this.phase;if(remaining<need){this.phase+=remaining;break;}remaining-=need;this.phase=0;if(this.state==='defeated'){if(this.index<4){this.index++;this.found.clear();this.enterBattle();break;}this.state='intrusion';this.message='ことば喰いが現れた！';}else if(this.state==='intrusion'){this.hp=0;this.state='defeat';this.message='HPが0になると敗北だよ。今回はギルドへ戻ろう。';}else if(this.state==='launch'){this.state='fall';this.message='ギルドが見えてきた！';}else if(this.state==='fall'){this.state='land';this.message='どすん！無事に着地…？';}else{this.state='top';this.data.complete=true;this.message='大変だったね…。でも、言葉の探し方はばっちりだよ。';this.commit();}}
 }
 returnToGuild(){if(this.state==='defeat'){this.state='launch';this.phase=0;this.message='うわぁー！ギルドまでひとっ飛び！';}}
}
export function audioRange(duration,scene){if(!Number.isFinite(duration)||duration<47.99)throw new Error('音源は48秒必要です');return scene==='battle'?[24,48]:[0,24];}
