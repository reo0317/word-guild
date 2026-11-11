"""生成素材のみを確認。本番の組み込み完了とは区別する。"""

import json
import xml.etree.ElementTree as ET
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from threading import Thread

from PIL import Image, ImageChops
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "quality/generated-v3"
NS = "{http://www.w3.org/2000/svg}"


class QuietHandler(SimpleHTTPRequestHandler):
    def log_message(self, *args):
        pass


def preview(records):
    cards = []
    for key, record in records.items():
        if key.startswith("claw"):
            continue
        frames = "".join(
            f'<figure><img src="../../{frame["file"]}" alt="{key} {frame["name"]}">'
            f"<figcaption>{frame['name']}</figcaption></figure>"
            for frame in record["frames"]
        )
        cards.append(
            f'<article id="card-{key}"><h2>{key}</h2><div class="frames">{frames}</div></article>'
        )
    html = (
        """<!doctype html><html lang="ja"><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>生成素材v3・組み込み前検査</title><style>
*{box-sizing:border-box}body{margin:0;background:#173e40;color:#fff3d6;font:14px system-ui}
main{max-width:1200px;margin:auto;padding:12px}h1{font-size:22px;color:#f4c66c}
h2{font-size:16px;margin:0 0 8px}p{line-height:1.5}article{padding:12px;background:#20494a;
border:1px solid #67877a;border-radius:8px;margin-bottom:12px}figure{margin:0;min-width:0}
.gallery{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}
.frames{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}
.frames img{display:block;width:100%;aspect-ratio:1;image-rendering:pixelated}
figcaption{text-align:center;font-size:11px;color:#d4dbc4}.claw{position:relative;height:120px;
background:#c9b894;border-radius:8px;overflow:hidden}.claw>img{position:absolute;left:5%;
top:42px;width:90%;height:40px;z-index:1;animation:reveal .24s linear both}
.word{position:absolute;inset:0;display:flex;
justify-content:space-around;align-items:center;z-index:2;font-size:30px;font-weight:900;
color:#203937;pointer-events:none}.word span{-webkit-text-stroke:1px #c9b894}
.corner{background:#c9b894;padding:10px;position:relative}.corner img{display:block;
width:240px;max-width:100%;height:240px;object-fit:contain;margin:auto}
.source{width:100%;display:block;background:#173e40}.material{margin:16px 0}
@media(max-width:600px){.gallery{grid-template-columns:1fr}.frames img{width:100%}}
@keyframes reveal{from{clip-path:inset(0 100% 0 0)}to{clip-path:inset(0 0 0 0)}}
@media(prefers-reduced-motion:reduce){.claw>img{animation:none;clip-path:inset(0 0 0 0)}}
</style><main><h1>ことばのギルド / 生成素材 v3</h1>
<p>内蔵image_genの透明PNG。新素材の確認ページです。本番組み込みは実装担当へ引き継ぎます。</p>
<section class="material"><h2>一本の裂傷 / 文字の前後関係</h2>
<div class="claw" data-cut-count="1">
<img src="../../products/word-guild/assets/claw-strip-generated-v3.png" alt="一本の黒赤の裂傷">
<div class="word"><span>C</span><span>A</span><span>T</span></div></div>
<p>黒い底と赤い内部光、細い端、欠けた縁。文字は上のレイヤー。</p>
<div class="corner"><img src="../../products/word-guild/assets/claw-elbow-generated-v3.png"
alt="一本でつながる曲がり角の裂傷"></div></section>
<section class="gallery">"""
        + "".join(cards)
        + "</section></main></html>"
    )
    (OUT / "preview.html").write_text(html, encoding="utf-8")


def run(base):
    checks = []

    def check(value, label):
        assert value, label
        checks.append(label)

    records = json.loads((OUT / "asset-records.json").read_text(encoding="utf-8"))
    check(len(records) == 14, "12キャラと直線・曲がり角の生成素材14枚")
    for key, record in records.items():
        with Image.open(ROOT / record["file"]) as sheet:
            check(sheet.mode == "RGBA", f"{key}: RGBA")
            check(sheet.getchannel("A").getextrema()[0] == 0, f"{key}: 透明画素あり")
            for frame in record["frames"]:
                x, y, width, height = frame["rect"]
                with Image.open(ROOT / frame["file"]) as cropped:
                    expected = sheet.crop((x, y, x + width, y + height))
                    padded = Image.new("RGBA", tuple(frame["canvas_size"]))
                    padded.paste(expected, tuple(frame["padding"]))
                    check(
                        ImageChops.difference(padded, cropped).getbbox() is None,
                        f"{key}/{frame['name']}: 原画画素を改変せず切り出し",
                    )
                    bounds = cropped.getchannel("A").getbbox()
                    cw, ch = cropped.size
                    check(
                        bounds[0] >= 16
                        and bounds[1] >= 16
                        and bounds[2] <= cw - 16
                        and bounds[3] <= ch - 16,
                        f"{key}/{frame['name']}: 四辺に16px以上の透明余白",
                    )
            if record["frames"]:
                idle, blink, joy, worried = record["frames"][:4]
                check(
                    len({(ROOT / f["file"]).read_bytes() for f in [idle, blink, joy, worried]})
                    == 4,
                    f"{key}: 四表情は別画素",
                )
    source = (ROOT / "atelier-assets/illustrator/illustration.svg").read_text(encoding="utf-8")
    svg = ET.fromstring(source)
    ids = [element.get("id") for element in svg.iter() if element.get("id")]
    check(len(ids) == len(set(ids)), "SVG索引ID重複なし")
    check(svg.get("viewBox") == "0 0 768 640", "旧表示互換のviewBox維持")
    for element in svg.iter():
        assert element.tag.removeprefix(NS) not in {"script", "foreignObject", "image"}
        assert all(not key.lower().startswith("on") for key in element.attrib)
        assert all(
            value.startswith("#") for key, value in element.attrib.items() if key.endswith("href")
        )
    check("<!DOCTYPE" not in source and "<!ENTITY" not in source, "SVGはベクターのみ・外部参照なし")
    preview(records)
    with sync_playwright() as p:
        options = {} if Path(p.chromium.executable_path).exists() else {"channel": "chrome"}
        browser = p.chromium.launch(headless=True, **options)
        errors = []
        page = browser.new_page(viewport={"width": 1200, "height": 1000})
        page.on("pageerror", lambda error: errors.append(str(error)))
        for width, height in [(390, 844), (320, 568), (1200, 1000)]:
            page.set_viewport_size({"width": width, "height": height})
            page.goto(base + "/quality/generated-v3/preview.html", wait_until="networkidle")
            check(
                page.evaluate("Array.from(document.images).every(i=>i.complete&&i.naturalWidth>0)"),
                f"{width}: 全生成PNGが実ブラウザーで読める",
            )
            check(
                page.evaluate("document.documentElement.scrollWidth<=innerWidth"),
                f"{width}: 横はみ出しなし",
            )
            check(
                page.locator(".claw").get_attribute("data-cut-count") == "1",
                f"{width}: 一語一傷の作例",
            )
            check(
                page.locator(".word").evaluate("e=>getComputedStyle(e).zIndex==='2'")
                and page.locator(".claw>img").evaluate("e=>getComputedStyle(e).zIndex==='1'"),
                f"{width}: 文字を傷の手前へ置く",
            )
            page.screenshot(path=str(OUT / f"preview-{width}.png"))
            page.locator(".claw>img").evaluate(
                "e=>e.getAnimations().forEach(a=>{a.pause();a.currentTime=100})"
            )
            check(
                "58.3333%" in page.locator(".claw>img").evaluate("e=>getComputedStyle(e).clipPath"),
                f"{width}: 240ms開示の100ms途中を実ブラウザーで確認",
            )
            page.locator(".claw").screenshot(path=str(OUT / f"reveal-100ms-{width}.png"))
            page.locator(".claw>img").evaluate(
                "e=>e.getAnimations().forEach(a=>{a.pause();a.currentTime=240})"
            )
            page.locator("#card-male").screenshot(path=str(OUT / f"male-{width}.png"))
            page.locator("#card-guide").screenshot(path=str(OUT / f"guide-{width}.png"))
            page.locator(".material").screenshot(path=str(OUT / f"claw-{width}.png"))
            if width == 390:
                for character in records:
                    if not character.startswith("claw"):
                        page.locator(f"#card-{character}").screenshot(
                            path=str(OUT / f"{character}-phone.png")
                        )
        page.emulate_media(reduced_motion="reduce")
        check(
            page.locator(".claw>img").evaluate("e=>getComputedStyle(e).animationName==='none'"),
            "素材用240ms開示はreduced-motionで即時表示",
        )
        page.goto(
            base + "/atelier-assets/illustrator/illustration.svg#v3-index", wait_until="networkidle"
        )
        page.screenshot(path=str(OUT / "vector-index.png"))
        # 互換表示が一切変わらないことを全画素比較する。
        page.goto(base + "/quality/generated-v3/preview.html")
        same = page.evaluate("""async()=>{
            const arrays=[];
            for(const file of ['illustration-legacy-v2.svg','illustration.svg']){
                const image=new Image();image.src='/atelier-assets/illustrator/'+file;
                await image.decode();const c=document.createElement('canvas');
                c.width=768;c.height=640;const ctx=c.getContext('2d');ctx.drawImage(image,0,0);
                arrays.push(ctx.getImageData(0,0,768,640).data);
            }return arrays[0].every((v,i)=>v===arrays[1][i]);
        }""")
        check(same, "SVG索引追加後も旧アトラス全画素が一致")
        check(not errors, f"素材確認ページJS例外なし: {errors}")
        browser.close()
    result = {
        "approved": True,
        "scope": "新しい生成PNG・切り出し・ベクター索引・素材用ブラウザー",
        "checks": checks,
        "issues": [],
        "human_checks": [
            "iPhone Safariとホーム画面で本番組み込み後のキャラ・文字・裂傷を確認。",
            "新しいキャラの魅力、輪郭とゲーム背景の相性は人の評価を残す。",
            "枠ごとの基準点・動作時間は制作推奨。実装後の動作で最終調整。",
            "音楽の聴感とボスの難易度は今回のイラスト担当の検証対象外。",
        ],
    }
    (OUT / "results.json").write_text(
        json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    print(f"PASS: {len(checks)} generated illustration checks")


if __name__ == "__main__":
    server = ThreadingHTTPServer(("127.0.0.1", 0), partial(QuietHandler, directory=str(ROOT)))
    Thread(target=server.serve_forever, daemon=True).start()
    try:
        run(f"http://127.0.0.1:{server.server_port}")
    finally:
        server.shutdown()
        server.server_close()
