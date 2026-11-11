"""イラスト担当の透明素材、索引、35%拡大溝と帰還背景の実ブラウザー検査。"""

import hashlib
import json
import xml.etree.ElementTree as ET
from pathlib import Path

from browser_server import BrowserServer
from build_art_preview_v4 import run as build_preview
from package_generated_art_v4 import NAMES
from PIL import Image
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
QA = ROOT / "quality/generated-v4"
NS = "{http://www.w3.org/2000/svg}"


def run(base):
    checks = []

    def check(value, label):
        assert value, label
        checks.append(label)

    records = json.loads((QA / "asset-records.json").read_text(encoding="utf-8"))
    check(len(records) == 24, "24原画：12キャラ・7環境・4帰還・1装飾")
    check(
        sum(len(records[name]["frames"]) for name in NAMES) == 78, "12キャラ・78姿を個別素材に保存"
    )
    for name, item in records.items():
        path = ROOT / item["file"]
        check(hashlib.sha256(path.read_bytes()).hexdigest() == item["sha256"], f"原画SHA: {name}")
        for frame in item["frames"]:
            with Image.open(ROOT / frame["file"]) as image:
                check(list(image.size) == frame["canvas_size"], f"寸法: {name}/{frame['name']}")
                check(
                    image.mode == "RGBA" and image.getchannel("A").getextrema()[0] == 0,
                    f"透明: {name}/{frame['name']}",
                )
                check(
                    hashlib.sha256((ROOT / frame["file"]).read_bytes()).hexdigest()
                    == frame["sha256"],
                    f"切り出しSHA: {name}/{frame['name']}",
                )
    preservation = json.loads((QA / "preservation-baseline.json").read_text(encoding="utf-8"))
    for file, digest in preservation.items():
        check(
            hashlib.sha256((ROOT / file).read_bytes()).hexdigest() == digest,
            f"本番と既存専門素材保持: {file}",
        )
    svg_source = (ROOT / "atelier-assets/illustrator/illustration.svg").read_text(encoding="utf-8")
    svg = ET.fromstring(svg_source)
    check(
        "viewBox" in svg.attrib and svg.find(NS + "title") is not None, "完全なSVG・viewBox・title"
    )
    ids = [element.get("id") for element in svg.iter() if element.get("id")]
    check(len(ids) == len(set(ids)), "SVGのID重複なし")
    for element in svg.iter():
        assert element.tag.removeprefix(NS) not in {"script", "foreignObject", "image"}
        for key, value in element.attrib.items():
            assert not key.lower().startswith("on")
            if key.endswith("href"):
                assert value.startswith("#")
    check(
        "<!DOCTYPE" not in svg_source and "<!ENTITY" not in svg_source,
        "ベクターのみ・外部参照・実行要素なし",
    )
    old = ET.fromstring(
        (ROOT / "atelier-assets/illustrator/illustration-before-v4.svg").read_text(encoding="utf-8")
    )
    current_ids = {element.get("id"): element for element in svg.iter() if element.get("id")}
    for element in old.iter():
        if element.get("id") and element.get("id") != "sheet-title":
            if element.get("id") == "sheet-desc":
                check(
                    current_ids["sheet-desc"].text.startswith("現行v4の原画は")
                    and current_ids["sheet-desc"].text.endswith(element.text),
                    "現行v4説明と旧履歴説明を区別して保持",
                )
                continue
            check(
                ET.tostring(current_ids[element.get("id")]) == ET.tostring(element),
                f"旧SVG図形保持: {element.get('id')}",
            )
    with sync_playwright() as pw:
        options = {} if Path(pw.chromium.executable_path).is_file() else {"channel": "chrome"}
        browser = pw.chromium.launch(headless=True, **options)
        page = browser.new_page(viewport={"width": 1200, "height": 1000})
        errors, failures = [], []
        page.on("pageerror", lambda error: errors.append(str(error)))
        page.on("requestfailed", lambda request: failures.append(request.url))
        page.goto(base + "/quality/generated-v4/preview.html", wait_until="networkidle")
        page.wait_for_function("window.artReady === true")
        check(
            page.evaluate("Array.from(document.images).every(i=>i.complete && i.naturalWidth>0)"),
            "全個別姿と背景画像を実ブラウザーで読込",
        )
        for width, height in [(390, 844), (320, 568), (1200, 1000)]:
            page.set_viewport_size({"width": width, "height": height})
            page.wait_for_timeout(200)
            check(
                page.evaluate("document.documentElement.scrollWidth<=innerWidth"),
                f"展示{width}横はみ出しなし",
            )
            check(
                page.evaluate(
                    "artState().cuts===3 && artState().cells===42 && artState().width===35.1"
                ),
                f"{width}:3語各一本・42マス・幅35%拡大",
            )
            check(
                page.locator("#claws .claw-cut").evaluate_all(
                    "els=>els.every(e=>e.dataset.clawCount==='1' && "
                    "e.querySelectorAll('image').length===1)"
                ),
                f"{width}:各語に連続ストリップ一本のみ",
            )
            check(
                page.locator("#claws").evaluate(
                    "e=>getComputedStyle(e).pointerEvents==='none' && "
                    "getComputedStyle(e).zIndex==='1'"
                )
                and page.locator(".letter").first.evaluate("e=>getComputedStyle(e).zIndex==='2'"),
                f"{width}:傷は入力を遮らず普通の文字より背面",
            )
            check(
                page.locator("[data-cell]").evaluate_all(
                    "els=>els.every(e=>{const r=e.getBoundingClientRect();"
                    "return r.width>=25 && r.height>=25;})"
                ),
                f"{width}:全42マス25px以上",
            )
            page.locator(".board-shell").screenshot(path=str(QA / f"board-{width}.png"))
            page.locator(".return-scenes").screenshot(path=str(QA / f"return-{width}.png"))
            page.locator("#card-guild").screenshot(path=str(QA / f"guild-{width}.png"))
            page.locator(".index").screenshot(path=str(QA / f"index-{width}.png"))
            if width == 390:
                for name in records:
                    page.locator(f"#card-{name}").screenshot(path=str(QA / f"{name}-phone.png"))
            if width == 1200:
                for name in ["male", "female", "guide", "final", "ui"]:
                    page.locator(f"#card-{name}").screenshot(path=str(QA / f"{name}-detail.png"))
            page.locator("#replay").click()
            page.locator(".claw-reveal.fresh").first.wait_for(state="attached")
            page.evaluate(
                "document.querySelectorAll('.claw-reveal').forEach(e=>"
                "e.getAnimations().forEach(a=>{a.pause();a.currentTime=100;}))"
            )
            check(
                page.locator(".claw-reveal").first.evaluate(
                    "e=>{const x=parseFloat(getComputedStyle(e).strokeDashoffset);"
                    "return x>0 && x<1;}"
                ),
                f"{width}:240ms開示の100ms途中",
            )
            page.locator("#board").screenshot(path=str(QA / f"reveal-100ms-{width}.png"))
            page.locator("#replay").click()
            page.wait_for_timeout(300)
            page.locator("#board").screenshot(path=str(QA / f"cut-complete-{width}.png"))
        page.emulate_media(reduced_motion="reduce")
        page.locator("#replay").click()
        check(
            page.locator(".claw-reveal").first.evaluate(
                "e=>getComputedStyle(e).animationName==='none'"
            ),
            "reduced-motionでは即時開示",
        )
        check(not errors and not failures, f"素材展示例外・画像要求失敗なし: {errors} {failures}")
        browser.close()
    return {
        "approved": True,
        "scope": "イラスト素材・索引・組み込み試作",
        "checks": checks,
        "issues": [],
        "human_checks": [
            "iPhone 17/iOS26.1 Safariとホーム画面で素材統合後の可読性・収まりを確認。",
            "幅35%・角丸18.9・背景切替の配分は制作案。人が操作感を最終判断。",
            "キャラの魅力と質感、背景とキャラの釣り合いの最終評価。",
        ],
        "integration_pending": "v4表示と幅35%を実装担当が本番へ組み込む。"
        "通常ボス・10秒ラスボス・ヒント・BGMは他担当範囲。",
    }


if __name__ == "__main__":
    build_preview()
    result = {"approved": False}
    try:
        with BrowserServer(ROOT) as server:
            result = run(server.url)
        print(f"PASS: {len(result['checks'])} illustration v4 assertions")
    except Exception as error:
        result["issues"] = [str(error)]
        raise
    finally:
        (QA / "results.json").write_text(
            json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8"
        )
