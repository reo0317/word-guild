import {loadImage,ready} from './assets-loader.mjs';
export const WALKERS=Object.freeze(['male','female','fire','water','grass']);
export function walkFrameURL(name,frame=0){
 if(!WALKERS.includes(name))throw Error('未定義の歩行キャラ');
 return `assets/walk-v9/${name}-walk-ne-${String((frame%4)+1).padStart(2,'0')}-v9.webp`;
}
export function warmWalk(name){
 void loadImage(walkFrameURL(name),'high').then(()=>Promise.all([1,2,3].map(f=>loadImage(walkFrameURL(name,f),'high')))).catch(()=>{});
}
export function walking(name,size){warmWalk(name);return `<img class="walk-art" data-walker="${name}" data-frame="0" src="${walkFrameURL(name)}" width="${size}" height="${size}" alt="${name}・右奥向きの歩行">`;}
export function paintWalk(el,elapsed,reduced){
 const f=reduced?0:Math.floor(elapsed/120)%4,name=el.dataset.walker;
 const frame=ready(walkFrameURL(name,f))?f:0;
 if(Number(el.dataset.frame)!==frame){el.dataset.frame=String(frame);el.src=walkFrameURL(name,frame);}
}
