import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {clawGeometry} from '../atelier-assets/illustrator/claw-route.mjs';
const file='atelier-assets/illustrator/illustration.svg';
await mkdir('quality/claw',{recursive:true});
const source=await readFile(file,'utf8');
const base=source.replace(/<defs id="claw-material-defs">[\s\S]*?<\/defs>/,'');
await writeFile('quality/claw/original-atlas.svg',base,'utf8');
const gradients='<linearGradient id="claw-wall" x1="0" y1="0" x2="0.25" y2="1"><stop offset="0" stop-color="#76624e"/><stop offset=".38" stop-color="#493f34"/><stop offset=".66" stop-color="#38332c"/><stop offset="1" stop-color="#73614d"/></linearGradient><linearGradient id="claw-bevel" x1="0" y1="0" x2=".4" y2="1"><stop stop-color="#9e896a"/><stop offset=".5" stop-color="#c5b08b"/><stop offset="1" stop-color="#e6d3aa"/></linearGradient><pattern id="claw-grain" width="23" height="19" patternUnits="userSpaceOnUse"><path d="M3 4l1.4 -.6M15 12l2 .7M8 16l.8 -.3" fill="none" stroke="#675b48" stroke-width=".55"/><path d="M10 6l1.2 .3M21 2l.5 .8" fill="none" stroke="#fff1ce" stroke-width=".5"/></pattern>';
const samples=[['claw-horizontal','0 0 320 80',[[16,40],[304,40]]],['claw-vertical','0 0 80 320',[[40,16],[40,304]]],['claw-elbow','0 0 220 220',[[28,30],[164,30],[164,194]]]];
const symbols=samples.map(([id,box,points])=>`<symbol id="${id}" viewBox="${box}"><title>一本の爪による連続溝：${id}</title>${clawGeometry(points).markup}</symbol>`).join('');
const section='<symbol id="claw-cross-section" shape-rendering="geometricPrecision" viewBox="0 0 240 120"><title>溝の拡大断面。暗い底、傾斜した切断面、光を受ける縁。</title><path d="M10 24H96L109 37L116 54L124 58L130 49L145 25H230V98H10Z" fill="#b8a484"/><path d="M10 24H96L109 37L116 54L124 58L130 49L145 25H230" fill="none" stroke="#ead8b1" stroke-width="2"/><path d="M96 24L109 37L116 54L124 58L130 49L145 25L138 26L125 47L119 48L108 30Z" fill="url(#claw-wall)"/><path d="M108 34L116 54L124 58L130 49L128 44L122 48L118 46Z" fill="#282622"/><path d="M124 58L130 49L145 25L138 26L125 47Z" fill="url(#claw-bevel)"/><path d="M139 25L145 24L155 24" stroke="#fff0c8" stroke-width="1.2" fill="none"/><path d="M10 68Q60 65 101 70M142 72Q187 66 230 70M10 83Q75 79 113 85M137 86Q181 80 230 82" fill="none" stroke="#897a61" stroke-width=".8" opacity=".32"/><path d="M89 26l-7 8l2 5M148 26l7 4l4 -1" fill="none" stroke="#7e6c54" stroke-width=".7" opacity=".55"/><path d="M10 24H96L109 37L116 54L124 58L130 49L145 25H230V98H10Z" fill="url(#claw-grain)" opacity=".35"/></symbol>';
const defs=`<defs id="claw-material-defs">${gradients}${symbols}${section}</defs>`;
await writeFile(file,base.replace('</svg>',defs+'</svg>'),'utf8');
await writeFile('quality/claw/material-defs.svg',`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 80"><title>一本の爪の石の溝</title>${defs}<use href="#claw-horizontal" width="320" height="80"/></svg>`,'utf8');
const artFile='atelier-assets/illustrator/artwork.json';
const art=JSON.parse(await readFile(artFile,'utf8'));
art.title='ことばのギルド：既存ピクセル素材と一本の爪の石材溝';
art.summary=art.summary.replace('保存・実行テストはハーネス担当です。','今回の一本溝の定義と試作検査を追加。使用IDと組み込み方法はclawへ記載。');
art.claw={
 summary:'最新の人の修正依頼により3本の発光線を一本の連続した石の切り傷へ再設計。陰影7層は同じ溝の断面であり、7本の傷ではない。既存アトラスの見た目と寸法は維持。',
 ids:['claw-material-defs','claw-wall','claw-bevel','claw-grain','claw-horizontal','claw-vertical','claw-elbow','claw-cross-section'],
 views:{'claw-horizontal':'0 0 320 80','claw-vertical':'0 0 80 320','claw-elbow':'0 0 220 220','claw-cross-section':'0 0 240 120'},
 integration:'SVG文書内にclaw-material-defsを一度コピー。claw-route.mjsのclawGeometry(points,{width:10,cornerRadius:10})へ実際のマス中心座標を渡し、返値markupを正解語1件につき一つのgへ入れる。symbolのuseは作例専用、任意経路では生成した面を使う。ブラウザーfetchはローカル同一オリジンのillustration.svgのみ。定義のIDは盤面ごとにprefixを付け参照も置換すると衝突しない。',
 geometry:'座標は盤面700×600を基準。表示要素の実寸とviewBoxの比率からマス中心を求め、固定100刻みで位置を推測しない。経路は上下左右のみ。width=10は中央最大幅、両端24単位でゼロへ収束、角は半径10の連続曲線。各陰影面を別経路へずらして並べない。',
 layers:'背面からcontact(幅13・透明度0.2)、lip(幅10・石の欠け)、wall(深い切断面)、core(幅3.6・#282622)、bevel(光側の面)、rim(幅0.55・#ffefcc・透明度0.85)、grain(低密度の鉱物粒)。光彩フィルターは使わない。',
 legibility:'石背景 → 切り傷SVG → 文字spanの順。文字はposition:relative;z-index:2、SVGはz-index:1;pointer-events:none。暗い文字#263b37に1px程度の石色輪郭を付ける。溝を文字の上に不透明で乗せない。340px盤面で最大約4.9px、270pxで約3.9px。',
 animation:'一つのclipPath内のcenterline（返値）をstroke幅16、pathLength=1、dasharray=1で描き、全7層を同じクリップで240msかけて一緒に開示する。stroke-dashoffset 1→0。先端の素材形状は元のテーパー面が作る。240ms後は静止。既発見語を再描画してもアニメを再開しない。reduced-motionでは即時表示。後続の撃破750ms、石の崩落と階層移動の時間は維持。',
 scope:'素材側の定義・汎用生成補助・ブラウザー試作検査。ゲーム本体の3本線置換と新音楽は実装・作曲担当が統合する。この成果のみで本番組み込み完了とはしない。',
 human_checks:['iPhone 17 / iOS 26.1のSafariとホーム画面起動で文字と傷の見やすさを確認。','幅10・角丸10・開示240msは制作推奨値で、操作感の最終判断は人へ残す。']
};
await writeFile(artFile,JSON.stringify(art,null,2)+'\n','utf8');
await writeFile('quality/claw/baseline.json',JSON.stringify({sha256:createHash('sha256').update(base).digest('hex'),width:768,height:640},null,2),'utf8');
console.log('SVG定義4作例を追加。既存可視グループは無変更。');
