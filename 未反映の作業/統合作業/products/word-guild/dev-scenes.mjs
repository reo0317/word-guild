// 明示的な開発URLでのみ読み込む。保存はapp側でメモリへ隔離される。
export function install(hooks){
 const names=['home','select','cat','dog','sun','ant','animal','final','defeated','travel','returning','freezing','bewildered','arriving','intrusion','counter','loss','escape','rescue','sendoff','launch','fall','land','bossArrival','bossLand','recruited','return'];
 const params=new URLSearchParams(location.search),name=params.get('scene')||'home';
 function load(scene){if(!names.includes(scene))return;hooks.reset?.();if(scene==='home')hooks.home();else if(scene==='return')hooks.home(true);else if(scene==='select')hooks.select();else hooks.load(scene);}
 const panel=document.createElement('aside');panel.id='dev-panel';panel.innerHTML='<details><summary>開発確認 · 状態は読み取り専用</summary><nav aria-label="確認シーン"></nav><pre id="dev-state" aria-label="読み取り専用の状態"></pre></details>';
 names.forEach(scene=>{const a=document.createElement('a');a.href=`?dev=1&scene=${scene}`;a.textContent=scene;panel.querySelector('nav').append(a);});document.body.append(panel);
 // 操作APIは開発URL限定。通常URLにこのモジュールやショートカットは存在しない。
 Object.defineProperty(window,'wordGuildDev',{value:Object.freeze({load,advance:hooks.advance,nextLine:hooks.nextLine}),writable:false});
 setInterval(()=>{panel.querySelector('pre').textContent=JSON.stringify(window.wordGuildState,null,2);},200);
 load(name);
}
