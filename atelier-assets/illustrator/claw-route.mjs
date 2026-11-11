// 一本の切り傷。返値はSVG図形のみ。ゲームの入力・状態へは触れない。
const f=n=>Number(n.toFixed(2));
const point=(p)=>`${f(p[0])} ${f(p[1])}`;
const distance=(a,b)=>Math.hypot(b[0]-a[0],b[1]-a[1]);
const lerp=(a,b,t)=>a.map((v,i)=>v+(b[i]-v)*t);
export function clawGeometry(points,{width=10,cornerRadius=10}={}){
 if(!Array.isArray(points)||points.length<2||points.some(p=>!Array.isArray(p)||p.length!==2||!p.every(Number.isFinite)))throw Error('有限座標を2点以上指定');
 if(!Number.isFinite(width)||width<=0||!Number.isFinite(cornerRadius)||cornerRadius<0)throw Error('幅と角丸の指定が不正');
 const route=points.filter((p,i)=>i===0||distance(points[i-1],p)>.01);
 if(route.length<2)throw Error('異なる座標を2点以上指定');
 if(route.some((p,i)=>i>0&&Math.abs(p[0]-route[i-1][0])>.01&&Math.abs(p[1]-route[i-1][1])>.01))throw Error('上下左右の経路を指定');
 const samples=[route[0]],commands=[`M${point(route[0])}`];
 const line=end=>{const a=samples.at(-1),length=distance(a,end);for(let j=1;j<=Math.max(1,Math.ceil(length/24));j++)samples.push(lerp(a,end,j/Math.max(1,Math.ceil(length/24))));commands.push(`L${point(end)}`);};
 for(let i=1;i<route.length-1;i++){
  const a=route[i-1],b=route[i],c=route[i+1],r=Math.min(cornerRadius,distance(a,b)/3,distance(b,c)/3),entry=lerp(b,a,r/distance(a,b)),exit=lerp(b,c,r/distance(b,c));
  line(entry);commands.push(`Q${point(b)} ${point(exit)}`);
  for(let j=1;j<=4;j++){const t=j/4;samples.push(b.map((v,k)=>(1-t)**2*entry[k]+2*(1-t)*t*v+t*t*exit[k]));}
 }
 line(route.at(-1));
 const lengths=[0];for(let i=1;i<samples.length;i++)lengths.push(lengths[i-1]+distance(samples[i-1],samples[i]));
 const length=lengths.at(-1),taper=Math.min(24,length/3);
 const frames=samples.map((p,i)=>{const a=samples[Math.max(0,i-1)],b=samples[Math.min(samples.length-1,i+1)],d=distance(a,b)||1;return {p,n:[-(b[1]-a[1])/d,(b[0]-a[0])/d],w:Math.min(1,lengths[i]/taper,(length-lengths[i])/taper)**.75*(1+.025*Math.sin(lengths[i]*.18))};});
 function ribbon(low,high){const edge=offset=>frames.map(({p,n,w})=>p.map((v,k)=>v+n[k]*offset*w));return `M${edge(low).map(point).join('L')}L${edge(high).reverse().map(point).join('L')}Z`;}
 const h=width/2;
 const layers=[
  ['contact',-h*1.3,h*1.3,'#796b57',.2],
  ['lip',-h,h,'#a18b6d',1],
  ['wall',-h*.86,h*.73,'url(#claw-wall)',1],
  ['core',-h*.47,h*.25,'#282622',1],
  ['bevel',h*.32,h*.78,'url(#claw-bevel)',1],
  ['rim',h*.8,h*.91,'#ffefcc',.85]
 ];
 return {centerline:commands.join(''),length:f(length),width,ends:[samples[0],samples.at(-1)],markup:`<g class="claw-cut" data-claw-count="1" shape-rendering="geometricPrecision">${layers.map(([name,a,b,fill,opacity])=>`<path data-layer="${name}" d="${ribbon(a,b)}" fill="${fill}" opacity="${opacity}"/>`).join('')}<path data-layer="grain" d="${ribbon(-h,h)}" fill="url(#claw-grain)" opacity=".23"/></g>`};
}
