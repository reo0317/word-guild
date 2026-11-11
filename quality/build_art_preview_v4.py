"""新素材の展示と35%拡大した既存裂傷の組み込み試作。本番は変更しない。"""
# ruff: noqa: E501
# HTML/CSS/JSの埋め込みテンプレートはそのまま保存する。

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
QA = ROOT / "quality/generated-v4"


def run():
    records = json.loads((QA / "asset-records.json").read_text(encoding="utf-8"))
    cards = []
    for name, item in records.items():
        if name.startswith("return-") or name.startswith("floor-") or name == "guild":
            cards.append(
                f'<article id="card-{name}"><h2>{name}</h2><img class="environment" src="../../{item["file"]}" alt="{name}"></article>'
            )
        else:
            frames = "".join(
                f'<figure><img src="../../{frame["file"]}" alt="{name} {frame["name"]}"><figcaption>{frame["name"]}</figcaption></figure>'
                for frame in item["frames"]
            )
            cards.append(
                f'<article id="card-{name}"><h2>{name}</h2><div class="frames">{frames}</div></article>'
            )
    module = (ROOT / "products/word-guild/claws.mjs").read_text(encoding="utf-8")
    module = module.replace(
        "'assets/claw-strip-generated-v3.png'",
        "'/products/word-guild/assets/claw-strip-generated-v3.png'",
    )
    module = module.replace("halfWidth=13", "halfWidth=17.55")
    module = module.replace("width:26,cornerRadius:14", "width:35.1,cornerRadius:18.9")
    module = module.replace('stroke-width="34"', 'stroke-width="45.9"')
    (QA / "claws-preview.mjs").write_text(module, encoding="utf-8")
    html = """<!doctype html><html lang="ja"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>ことばのギルド 素材v4確認</title><style>
*{box-sizing:border-box}body{margin:0;background:#123638;color:#fff3d6;font:14px system-ui}main{max-width:1200px;margin:auto;padding:12px}h1{font-size:22px;color:#f4c66c}h2{font-size:16px;margin:0 0 8px}p{line-height:1.6}.gallery{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}article{min-width:0;padding:12px;border:1px solid #67877a;background:#20494a;border-radius:10px}figure{margin:0;min-width:0}.frames{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}.frames img{width:100%;display:block;aspect-ratio:1;object-fit:contain;image-rendering:pixelated}.environment{width:100%;display:block;aspect-ratio:3/2;object-fit:cover}figcaption{text-align:center;font-size:11px;color:#d4dbc4}.material{margin:18px 0}.arena{height:170px;background:url('../../products/word-guild/assets/floor-0-generated-v4.png') center/cover;border:2px solid #ac9563;border-radius:12px;display:flex;justify-content:center;align-items:flex-end}.arena img{height:144px;image-rendering:pixelated}.hp{height:34px;margin:5px 0;background:#629b48;border:2px solid #c5a86a;border-radius:7px;text-align:right;padding:4px 10px;font-weight:800}.board-shell{max-width:440px;margin:auto}#board{position:relative;display:grid;grid-template-columns:repeat(7,minmax(0,1fr));grid-template-rows:repeat(6,minmax(0,1fr));height:min(39dvh,350px);min-height:210px;gap:4px;padding:7px;width:100%;background:#142d31;border:2px solid #758b77;border-radius:10px;touch-action:none;user-select:none}#board button{position:relative;padding:0;min-width:0;min-height:0;border:1px solid #fff5d6;border-bottom:3px solid #9c8c68;border-radius:6px;background:#eddfbd;color:#203937;font:850 24px system-ui}#board .letter{position:relative;z-index:2;text-shadow:0 1px #fff1d2}#claws{position:absolute;inset:7px;width:calc(100% - 14px);height:calc(100% - 14px);pointer-events:none;z-index:1;overflow:visible}.claw-reveal{stroke-dasharray:1;stroke-dashoffset:0}.claw-reveal.fresh{animation:reveal .24s linear var(--claw-age) both}@keyframes reveal{from{stroke-dashoffset:1}to{stroke-dashoffset:0}}.return-scenes{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin:16px 0}.return-scenes figure{position:relative}.return-scenes img{width:100%;aspect-ratio:3/2;object-fit:cover}.flight-hero{position:absolute;left:38%;top:20%;width:22%!important;height:65%;object-fit:contain!important;image-rendering:pixelated}.index{display:block;width:100%;height:auto}.primary{background:#f4c66c;color:#193e39;border:1px solid #ffdda0;border-radius:8px;padding:9px 14px;font-weight:800;margin:8px}.note{font-size:12px;color:#dfdfbb}@media(max-width:600px){.gallery{grid-template-columns:1fr}.return-scenes{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(prefers-reduced-motion:reduce){.claw-reveal.fresh{animation:none}}
</style><main><h1>ことばのギルド / 素材v4</h1><p>内蔵画像生成による版付き素材。78姿を保ち、輪郭と陰影を整理。文字は実装で重ねます。</p><p class="note">これは素材担当の確認用ページです。本番コード・音楽・ルールは変更していません。</p>
<section class="material"><h2>一本の裂傷 / 35%拡大・文字は普通の字形</h2><div class="board-shell"><div class="arena"><img src="../../products/word-guild/assets/cat-idle-generated-v4.png" alt="猫"></div><div class="hp">HP 100 / 100</div><div id="board"></div></div><button class="primary" id="replay">傷の240ms開示を確認</button><p class="note">CAT・DOG・ANTそれぞれ一本。原画の端部は経路全体の両端で一回。石→傷→文字。</p></section>
<h2>ダンジョンからギルドへ / 既存3500ms内の背景配置案</h2><section class="return-scenes">"""
    for scene, pose in [
        ("exit", "launch"),
        ("road", "launch"),
        ("approach", "fall"),
        ("land", "land"),
    ]:
        html += f'<figure><img src="../../products/word-guild/assets/return-{scene}-generated-v4.png" alt="帰還 {scene}"><img class="flight-hero" src="../../products/word-guild/assets/male-{pose}-generated-v4.png" alt="男性 {pose}"><figcaption>{scene}</figcaption></figure>'
    html += (
        '</section><section class="gallery">'
        + "".join(cards)
        + '</section><h2>ベクター索引</h2><img class="index" src="../../atelier-assets/illustrator/illustration.svg#v4-index" alt="v4素材索引"><script type="module">'
    )
    html += """import {renderClaws} from './claws-preview.mjs';
const board=document.querySelector('#board'),letters=Array(42).fill('R');
const paths=[[8,9,10],[5,12,19],[29,30,37]],words=['CAT','DOG','ANT'];
paths.forEach((p,n)=>p.forEach((i,j)=>letters[i]=words[n][j]));
board.innerHTML=letters.map((c,i)=>`<button data-cell="${i}" aria-label="${c}"><span class="letter">${c}</span></button>`).join('')+'<svg id="claws" viewBox="0 0 700 600" preserveAspectRatio="none" aria-hidden="true"></svg>';
let strikes=paths.map(path=>({path,started:performance.now()-300}));const svg=document.querySelector('#claws');
async function draw(){await renderClaws(svg,strikes);window.artReady=true;}
await draw();new ResizeObserver(draw).observe(board);
document.querySelector('#replay').onclick=async()=>{strikes=paths.map(path=>({path,started:performance.now()}));await draw();};
window.artState=()=>({cuts:svg.querySelectorAll('.claw-cut').length,cells:board.querySelectorAll('[data-cell]').length,width:35.1,reveal:240});
</script></main></html>"""
    (QA / "preview.html").write_text(html, encoding="utf-8")
    print("素材専用展示・35%拡大試作を保存。本番コード無変更。")


if __name__ == "__main__":
    run()
