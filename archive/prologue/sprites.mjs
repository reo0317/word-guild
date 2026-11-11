import {assetURL,loadImage,ready,onImagesReady} from './assets-loader.mjs';
import {CHARACTER_ART,CHARACTERS,EXPRESSIONS} from './character-art.mjs';
export {CHARACTERS,EXPRESSIONS};
export function frameURL(name,pose){
 if(!CHARACTER_ART[name]?.frames[pose])throw Error('未定義のキャラクターの姿');
 return assetURL(`${name}-${pose}`);
}
export async function loadSprite(character,poses=EXPRESSIONS){
 await loadImage(frameURL(character,'idle'),'high');
 await Promise.all(poses.map(p=>loadImage(frameURL(character,p))));
}
function variables(character){return EXPRESSIONS.map(p=>`--${p}:url('${frameURL(character,ready(frameURL(character,p))?p:'idle')}')`).join(';');}
function refresh(){
 for(const el of document.querySelectorAll('.character[data-character]')){
  const name=el.dataset.character,pose=el.dataset.pose;
  for(const p of EXPRESSIONS)el.style.setProperty(`--${p}`,`url('${frameURL(name,ready(frameURL(name,p))?p:'idle')}')`);
  if(pose!=='animated')el.querySelector('.portrait').style.backgroundImage=`url('${frameURL(name,ready(frameURL(name,pose))?pose:'idle')}')`;
 }
}
onImagesReady(refresh);
export function sprite(name,size=64,extra=''){
 const [character,...parts]=name.split('-'),pose=parts.join('-');
 if(!CHARACTERS.includes(character))throw Error('未定義のキャラクター');
 void loadSprite(character,pose?[pose]:EXPRESSIONS).catch(()=>{});
 const fixed=pose?`background-image:url('${frameURL(character,ready(frameURL(character,pose))?pose:'idle')}');animation:none`:'';
 return `<span aria-hidden="true" data-character="${character}" data-pose="${pose||'animated'}" class="character art-${character} ${extra}" style="--size:${size}px;${variables(character)}"><span class="portrait" style="${fixed}"></span></span>`;
}
