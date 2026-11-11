import {clawGeometry} from '../../../atelier-assets/illustrator/claw-route.mjs';

export const REVEAL_MS=240;
export const CLAW_TEXTURE='assets/claw-strip-generated-v3.png';
let material;
export function loadClawMaterial(){
 return material??=new Promise((resolve,reject)=>{
  const image=new Image();image.onload=()=>resolve(image);image.onerror=()=>reject(Error('生成した裂傷を読めません'));image.src=CLAW_TEXTURE;
 });
}

// 一本の生成ストリップを経路の距離へ連続して写す。端部をマス毎に繰り返さない。
// 小さな曲線区間を重ねて描くことで、法線が変わる角にも透明な継ぎ目を残さない。
function warpTexture(image,d){
 const path=document.createElementNS('http://www.w3.org/2000/svg','path');path.setAttribute('d',d);
 const length=path.getTotalLength(),canvas=document.createElement('canvas');canvas.width=1400;canvas.height=1200;
 const ctx=canvas.getContext('2d');ctx.scale(2,2);ctx.imageSmoothingEnabled=true;
 const steps=Math.ceil(length),halfWidth=17.55;
 for(let i=0;i<steps;i++){
  const from=i*length/steps,to=(i+1)*length/steps;
  const a=path.getPointAtLength(from),b=path.getPointAtLength(to),angle=Math.atan2(b.y-a.y,b.x-a.x);
  ctx.save();ctx.translate(a.x,a.y);ctx.rotate(angle);
  const u=from/length*image.naturalWidth,du=(to-from)/length*image.naturalWidth;
  ctx.drawImage(image,u,0,du,image.naturalHeight,-.3,-halfWidth,Math.hypot(b.x-a.x,b.y-a.y)+.6,halfWidth*2);
  ctx.restore();
 }
 return canvas.toDataURL('image/png');
}

// 盤面の余白・間隔・縦横比を含め、実際のDOM座標へ合わせる。
export async function renderClaws(svg,strikes){
 const image=await loadClawMaterial();
 if(!svg.isConnected)return;
 const box=svg.getBoundingClientRect();if(!box.width||!box.height)return;
 const board=svg.parentElement,boardBox=board.getBoundingClientRect();
 const style=getComputedStyle(board),columns=style.gridTemplateColumns.split(' ').map(Number.parseFloat),
  rows=style.gridTemplateRows.split(' ').map(Number.parseFloat);
 const center=(tracks,index,gap,padding)=>Number.parseFloat(padding)+
  tracks.slice(0,index).reduce((sum,size)=>sum+size,0)+Number.parseFloat(gap)*index+tracks[index]/2;
 const now=performance.now();
 const parts=strikes.map((strike,i)=>{
  const points=strike.path.map(index=>{
   // 崩落中のtransformではなく、石が並んでいた配置座標を使う。
   // 素材の遅延読込でも上下左右の経路が斜めに変わらない。
   // computed gridの小数精度を保つ。整数offsetは縮小画面で位置が丸められる。
   const column=index%columns.length,row=Math.floor(index/columns.length);
   return [(boardBox.x+board.clientLeft+center(columns,column,style.columnGap,style.paddingLeft)-box.x)*700/box.width,
    (boardBox.y+board.clientTop+center(rows,row,style.rowGap,style.paddingTop)-box.y)*600/box.height];
  });
  const geometry=clawGeometry(points,{width:35.1,cornerRadius:18.9}),age=Math.max(0,now-strike.started);
  const key=geometry.centerline;
  if(strike.textureKey!==key){strike.textureKey=key;strike.texture=warpTexture(image,key);}
  const mask=`claw-reveal-${i}`,reveal=age<REVEAL_MS?'claw-reveal fresh':'claw-reveal';
  return `<mask id="${mask}" maskUnits="userSpaceOnUse" x="0" y="0" width="700" height="600"><path class="${reveal}" style="--claw-age:-${age}ms" d="${key}" pathLength="1" fill="none" stroke="white" stroke-width="45.9" stroke-linecap="round" stroke-linejoin="round"/></mask><g class="claw-cut" data-claw-count="1" data-cut="${i}" data-started="${strike.started}" data-material="${CLAW_TEXTURE}" mask="url(#${mask})"><image class="claw-texture" href="${strike.texture}" width="700" height="600"/></g>`;
 });
 svg.innerHTML=parts.join('');
}
