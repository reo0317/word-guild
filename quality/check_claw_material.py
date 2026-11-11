"""イラスト担当の素材検査。ゲーム本体の組み込み検査とは分離する。"""

import json
import xml.etree.ElementTree as ET
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from threading import Thread

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "quality/claw"
NS = "{http://www.w3.org/2000/svg}"


class QuietHandler(SimpleHTTPRequestHandler):
    def log_message(self, *args):
        pass


def run(base):
    checks = []

    def check(value, label):
        assert value, label
        checks.append(label)

    source = (ROOT / "atelier-assets/illustrator/illustration.svg").read_text(encoding="utf-8")
    original = (OUT / "original-atlas.svg").read_text(encoding="utf-8")
    root, old = ET.fromstring(source), ET.fromstring(original)
    check(root.attrib == old.attrib, "768×640とviewBox・ルート属性を維持")
    retained = [el for el in root if el.get("id") != "claw-material-defs"]
    check(
        [ET.tostring(el) for el in retained] == [ET.tostring(el) for el in old],
        "既存キャラ・帰還・ギルド・アイコンの全要素と座標を維持",
    )
    ids = [el.get("id") for el in root.iter() if el.get("id")]
    check(len(ids) == len(set(ids)), "SVG内のID重複なし")
    forbidden = {"script", "foreignObject", "image"}
    for el in root.iter():
        check(el.tag.removeprefix(NS) not in forbidden, f"ベクター要素: {el.tag}")
        for key, value in el.attrib.items():
            assert not key.lower().startswith("on"), "イベント属性なし"
            if key.endswith("href"):
                assert value.startswith("#"), "参照は文書内IDのみ"
    check("<!DOCTYPE" not in source and "<!ENTITY" not in source, "DOCTYPEとENTITYなし")
    with sync_playwright() as p:
        options = {} if Path(p.chromium.executable_path).exists() else {"channel": "chrome"}
        browser = p.chromium.launch(headless=True, **options)
        page = browser.new_page(viewport={"width": 960, "height": 1380})
        errors = []
        page.on("pageerror", lambda error: errors.append(str(error)))
        page.goto(base + "/quality/claw/preview.html", wait_until="networkidle")
        page.wait_for_function("window.clawMaterialReady===true")
        page.wait_for_timeout(300)
        check(page.locator("#board .claw-cut").count() == 3, "CAT・DOG・ANTは各1傷、合計3傷")
        check(
            page.locator("#board .claw-cut").evaluate_all(
                "els=>els.every(e=>e.dataset.clawCount==='1' && "
                "e.querySelectorAll('[data-layer]').length===7)"
            ),
            "一つの傷の7材質層を複数の傷と区別",
        )
        check(
            page.evaluate(
                "(()=>{const g=clawGeometry([[50,50],[150,50],[150,250]]);"
                "return g.width===10 && g.centerline.includes('Q') && "
                "g.markup.includes('#282622') && g.markup.includes('#ffefcc');})()"
            ),
            "任意直角経路に暗部と細い光、曲線の接合を生成",
        )
        check(
            page.evaluate(
                "(()=>{const g=clawGeometry([[16,40],[304,40]]);"
                "const d=new DOMParser().parseFromString('<svg xmlns=\"http://www.w3.org/2000/svg\">'"
                "+g.markup+'</svg>','image/svg+xml');"
                "return [...d.querySelectorAll('path')].every(p=>p.getAttribute('d')"
                ".startsWith('M16 40L') && !p.getAttribute('d').includes('NaN'));})()"
            ),
            "各面の先端が同じ一点に収束、無効座標なし",
        )
        check(
            page.evaluate(
                "(()=>{try{clawGeometry([[0,0],[10,10]]);return false;}catch{return true;}})()"
            ),
            "素材の経路生成でも斜め座標を拒否",
        )
        check(
            page.locator(".stone span").first.evaluate("el=>getComputedStyle(el).zIndex==='2'")
            and page.locator("#board>svg").evaluate(
                "el=>getComputedStyle(el).zIndex==='1' && "
                "getComputedStyle(el).pointerEvents==='none'"
            ),
            "文字は溝より前面、素材が操作を遮らない",
        )
        check(
            page.evaluate(
                "async()=>{const svg=document.querySelector('#board>svg').cloneNode(true);"
                "svg.setAttribute('xmlns','http://www.w3.org/2000/svg');"
                "svg.prepend(document.querySelector('#claw-material-defs').cloneNode(true));"
                "const url=URL.createObjectURL(new Blob([svg.outerHTML],"
                "{type:'image/svg+xml'})),img=new Image();img.src=url;await img.decode();"
                "const c=document.createElement('canvas');c.width=700;c.height=600;"
                "const ctx=c.getContext('2d');ctx.drawImage(img,0,0,700,600);"
                "URL.revokeObjectURL(url);return [[150,50],[450,150],[400,450],[450,500]]"
                ".every(([x,y])=>ctx.getImageData(x,y,1,1).data[3]>200);}"
            ),
            "マスク描画の横・縦・直角の全区間に不透明な溝の画素が存在",
        )
        page.screenshot(path=str(OUT / "material-960.png"), full_page=True)
        page.locator(".samples").first.screenshot(path=str(OUT / "end-joint-detail.png"))
        page.locator(".section").screenshot(path=str(OUT / "cross-section-detail.png"))
        # 元アトラスと新アトラスを同一canvasへ描画して全画素を比較する。
        equal = page.evaluate(
            "async()=>{const urls=['/quality/claw/original-atlas.svg',"
            "'/atelier-assets/illustrator/illustration.svg'];const arrays=[];"
            "for(const url of urls){const img=new Image();img.src=url;await img.decode();"
            "const c=document.createElement('canvas');c.width=768;c.height=640;"
            "const ctx=c.getContext('2d');ctx.drawImage(img,0,0);"
            "arrays.push(ctx.getImageData(0,0,768,640).data);}"
            "return arrays[0].every((v,i)=>v===arrays[1][i]);}"
        )
        check(equal, "Chromium描画で既存アトラス全画素が一致")
        for width, height in [(390, 844), (320, 568)]:
            page.set_viewport_size({"width": width, "height": height})
            page.screenshot(path=str(OUT / f"material-{width}.png"), full_page=True)
            page.locator("#board").screenshot(path=str(OUT / f"board-{width}.png"))
            check(
                page.evaluate("document.documentElement.scrollWidth<=innerWidth"),
                f"素材確認画面{width}幅の横はみ出しなし",
            )
        page.emulate_media(reduced_motion="reduce")
        check(
            page.locator(".reveal").first.evaluate(
                "el=>getComputedStyle(el).animationName==='none'"
            ),
            "reduced-motionでは一括表示",
        )
        page.emulate_media(reduced_motion="no-preference")
        page.reload(wait_until="networkidle")
        page.wait_for_function("window.clawMaterialReady===true")
        page.evaluate(
            "document.querySelectorAll('.reveal').forEach(el=>"
            "el.getAnimations().forEach(a=>{a.pause();a.currentTime=100;}))"
        )
        page.locator("#board").screenshot(path=str(OUT / "reveal-100ms.png"))
        check(
            page.locator(".reveal").first.evaluate(
                "el=>parseFloat(getComputedStyle(el).strokeDashoffset)>0 && "
                "parseFloat(getComputedStyle(el).strokeDashoffset)<1"
            ),
            "実ブラウザーで240ms開示の途中を確認",
        )
        check(not errors, f"素材確認のJavaScript例外なし: {errors}")
        browser.close()
    result = {
        "approved": True,
        "scope": "イラスト素材と組み込み用補助・試作ブラウザー",
        "checks": checks,
        "issues": [],
        "human_checks": [
            "iPhone Safari・ホーム画面で文字と一本溝の可読性を確認する。",
            "幅・角丸・表示240msは制作案。操作感の最終判断は人が行う。",
        ],
        "integration_pending": "実装担当による本番の3本線置換と最終画面検査。",
    }
    (OUT / "results.json").write_text(
        json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    print(f"PASS: {len(checks)} illustration checks / original atlas pixel-identical")


if __name__ == "__main__":
    server = ThreadingHTTPServer(("127.0.0.1", 0), partial(QuietHandler, directory=str(ROOT)))
    Thread(target=server.serve_forever, daemon=True).start()
    try:
        run(f"http://127.0.0.1:{server.server_port}")
    finally:
        server.shutdown()
        server.server_close()
