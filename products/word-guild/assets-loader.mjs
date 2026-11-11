// URLごとに取得とdecodeを共有する。凍結したスナップショットのみ公開。
const entries=new Map(),listeners=new Set(),queue=[];
let active=0,lowActive=0,scheduled=false;
function schedule(){if(!scheduled){scheduled=true;setTimeout(()=>{scheduled=false;pump();},0);}}
function pump(){
 while(active<6){
  const index=queue.findIndex(e=>e.priority==='high');
  // 表示に必要な取得が終わるまで、表情の先読みを開始しない。
  const next=index>=0?index:lowActive===0&&active===0?0:-1;
  if(next<0||!queue.length)return;
  const entry=queue.splice(next,1)[0],low=entry.priority!=='high';active++;if(low)lowActive++;
  entry.started=performance.now();entry.image.fetchPriority=entry.priority;entry.image.src=entry.url;
  entry.image.decode().then(()=>{entry.ready=true;entry.decoded=performance.now();entry.resolve();for(const update of listeners)update();})
   .catch(error=>{entries.delete(entry.url);entry.reject(error);})
   .finally(()=>{active--;if(low)lowActive--;schedule();});
 }
}
// キャラだけv8へ。背景/帰還v6とUI v7の既存URLを保持する。
// 自立したローダーを保ち、取得共有の単体検査でも読み込めるよう依存を増やさない。
export function assetURL(name){
 const character=/^(male|female|fire|water|grass|guide|cat|dog|sun|ant|animal|final)-(idle|blink|joy|worried|action-[12])$/.test(name)
  ||/^(male|female)-(launch|fall|land)$/.test(name);
 return `assets/${name}-display-v${character?8:name.startsWith('ui-')?7:6}.webp`;
}
export function ready(url){return entries.get(url)?.ready===true;}
export function loadImage(url,priority='low'){
 if(entries.has(url)){const entry=entries.get(url);if(priority==='high'){entry.priority='high';entry.image.fetchPriority='high';schedule();}return entry.promise;}
 // decode済みのImageも保持し、短い演出でCSSへ切り替えた際の再取得を防ぐ。
 const entry={url,priority,image:new Image(),ready:false,promise:null};
 entry.promise=new Promise((resolve,reject)=>{entry.resolve=resolve;entry.reject=reject;});
 entries.set(url,entry);queue.push(entry);schedule();
 return entry.promise;
}
export function warmImages(names,priority='low'){for(const name of names)void loadImage(assetURL(name),priority).catch(()=>{});}
export function onImagesReady(update){listeners.add(update);}
Object.defineProperty(window,'wordGuildAssets',{get:()=>Object.freeze([...entries].map(([url,e])=>Object.freeze({url,ready:e.ready,started:e.started??null,decoded:e.decoded??null}))),configurable:false});
