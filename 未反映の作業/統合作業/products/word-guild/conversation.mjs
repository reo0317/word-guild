import {DialogueDirector,loadDialogueScript} from './dialogue.mjs';
import {VoicePlayer} from './voice-player.mjs';
import {sprite} from './sprites.mjs';

const escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
// Only this small conversation region changes; the board and its pointer capture never do.
export class Conversation {
 constructor(music,{onError=()=>{},button,getFallback=()=>null,getNarrator=()=> 'guide'}={}){
  this.music=music;this.getFallback=getFallback;this.getNarrator=getNarrator;this.onError=onError;this.button=button;this.director=null;this.player=null;
  this.enabled=false;this.started=false;this.hidden=false;this.currentId=null;this.remaining=0;
  this.fallback=false;this.pending=[];this.run=0;this.serial=0;this.manifest=null;this.ready=false;
  this.load();
 }
 async load(){
  try{
   const [script,response]=await Promise.all([loadDialogueScript(),fetch(new URL('./assets/voice/manifest.json',import.meta.url))]);
   if(!response.ok)throw Error('声の収録表を取得できません');
   this.manifest=await response.json();
   this.director=new DialogueDirector(script,{onChange:s=>this.changed(s)});this.ready=true;
   if(this.started&&(!this.enabled||this.hidden))this.director.pause();
   for(const item of this.pending.splice(0))this.director.dispatch(item);
   this.paint();
  }catch{this.onError('会話を読み込めません。声ボタンで再試行できます。');this.failedLoad=true;this.paint();this.paintButton();}
 }
 context(input,event){
  const scope=`${input.screen}:${input.stage}:${input.state}:${input.returned===true}`;
  const eventId=`${this.run}:${event||scope}:${event?.startsWith('answer.')?++this.serial:scope}`;
  const item={...input,eventId,...(event?{event}:{})};this.lastContext=input;
  if(this.director)this.director.dispatch(item);else this.pending.push(item);
 }
 reset(context={}){this.run++;this.pending=[];this.player?.stop();this.director?.reset(context);this.lastContext=context;this.currentId=null;this.remaining=0;this.fallback=false;}
 markup(beat){
  const narrator=this.getNarrator();
  return `<div class="guide dialogue" data-speaker="guide" data-narrator="${narrator||'none'}"><span class="narrator-slot" data-key="${narrator||''}">${narrator?sprite(narrator,64,'detail'):''}</span><p class="bubble"><small class="dialogue-name">${escape(beat?.speaker||'')}</small><span id="hint" role="status">${escape(beat?.text||'')}</span></p><span class="speech-portrait" aria-hidden="true"></span></div>`;
 }
 paint(){
  const line=this.director?.snapshot.current,box=document.querySelector('.dialogue');
  if(!box)return;
  const text=box.querySelector('#hint'),name=box.querySelector('.dialogue-name'),portrait=box.querySelector('.speech-portrait');
  const narrator=this.getNarrator(),slot=box.querySelector('.narrator-slot');
  if(slot&&slot.dataset.key!==(narrator||'')){slot.dataset.key=narrator||'';slot.innerHTML=narrator?sprite(narrator,64,'detail'):'';}
  box.dataset.narrator=narrator||'none';
  if(line){
   text.textContent=line.text;name.textContent=line.speakerName;box.dataset.line=line.id;box.dataset.event=line.event;
   box.dataset.speaker=line.speaker===narrator?'guide':'other';
   if(portrait.dataset.key!==`${line.speaker}:${line.expression}:${narrator}`){portrait.dataset.key=`${line.speaker}:${line.expression}:${narrator}`;portrait.innerHTML=line.speaker===narrator?'':sprite(`${line.speaker}-${line.expression}`,40);}
   slot?.querySelector('.character')?.style.setProperty('--speech-expression',`var(--${line.speaker===narrator?line.expression:'idle'})`);
  }else{const beat=this.getFallback();text.textContent=beat?.text||'';name.textContent=beat?.speaker||'';delete box.dataset.line;delete box.dataset.event;const actor=({リオ:'male',ミナ:'female',通常ボス:'animal',しるべ:'guide'})[beat?.speaker];box.dataset.speaker=actor&&actor!==narrator?'other':'guide';portrait.innerHTML=actor&&actor!==narrator?sprite(`${actor}-${beat.expression}`,40):'';delete portrait.dataset.key;slot?.querySelector('.character')?.style.setProperty('--speech-expression',`var(--${actor===narrator?beat?.expression||'idle':'idle'})`);}
 }
 ensurePlayer(){
  if(this.player)return this.player;
  this.music.context??=this.music.factory();
  this.player=new VoicePlayer(this.music.context,{manifest:this.manifest,
   onEnded:id=>{if(id===this.currentId)this.director?.onLineEnded(id);},
   onSpeaking:active=>this.music.setDucking(active),
   onError:()=>{this.onError('声を再生できません。字幕で続けられます。声ボタンで再試行できます。');this.paintButton();}});
  return this.player;
 }
 changed(snapshot){
  this.paint();const line=snapshot.current;
  if(!line){this.player?.stop();this.currentId=null;this.fallback=false;this.paintButton();return;}
  if(line.playbackId!==this.currentId){
   this.player?.stop();this.currentId=line.playbackId;this.remaining=line.targetSeconds*1000;this.fallback=!this.enabled;this.paintButton();
   if(this.enabled&&!this.hidden&&!snapshot.paused)this.startLine(line);
  }
 }
 startLine(line){
  const player=this.ensurePlayer(),id=line.playbackId;this.fallback=false;
  void player.play({...line,id}).then(result=>{
   if(this.currentId!==id)return;
   if(result.status==='error'){this.fallback=true;}
   else if(result.status==='playing'){this.onError('');void player.prepare(this.director.snapshot.queue);}this.paintButton();
  });
 }
 enable(){
  this.started=true;this.enabled=true;this.music.context??=this.music.factory();
  void this.music.context.resume().catch(()=>this.onError('声を開始できません。声ボタンで再試行できます。'));
  if(this.failedLoad){this.failedLoad=false;this.load();}
  this.director?.resume();
  const line=this.director?.snapshot.current;
  if(line){
   if(this.player?.snapshot.id===line.playbackId&&['paused','error'].includes(this.player.snapshot.state)){this.fallback=false;const id=line.playbackId;void this.player.resume().then(r=>{if(this.currentId!==id)return;if(r.status==='error')this.fallback=true;else if(r.status==='playing')this.onError('');this.paintButton();});}
   else if(!this.player||['idle','error'].includes(this.player.snapshot.state))this.startLine(line);
  }
  this.paintButton();
 }
 toggle(){
  if(!this.enabled||this.player?.snapshot.error||this.failedLoad){this.enable();return;}
  this.enabled=false;this.player?.pause();this.director?.pause();this.paintButton();
 }
 visibility(hidden){
  this.hidden=hidden;
  if(hidden){this.player?.pause();this.director?.pause();}
  else if(this.enabled){this.enable();}
  else if(!this.started)this.director?.resume();
 }
 advance(ms){
  if(this.hidden||this.director?.snapshot.paused||!this.fallback||!this.currentId)return;
  this.remaining-=ms;if(this.remaining<=0)this.director.onLineEnded(this.currentId);
 }
 paintButton(){if(this.button)this.button.textContent=this.failedLoad||this.player?.snapshot.error?'声を再試行':this.enabled?'声を停止':'声を再生';}
 get snapshot(){return this.director?.snapshot||null;}
 get voice(){return Object.freeze({...this.player?.snapshot,enabled:this.enabled,ready:this.ready,available:this.manifest?.status==='complete',fallback:this.fallback});}
}
