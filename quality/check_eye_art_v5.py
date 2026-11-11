"""素材担当の実寸差し替え検査。本番のコードと保存状態を変更しない。"""
# ruff: noqa: E501

import hashlib
import json
from pathlib import Path

from browser_server import BrowserServer
from package_eye_art_v5 import NAMES, REGIONS
from PIL import Image, ImageChops, ImageDraw
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
QA = ROOT / "quality/eyes-v5"


def run():
    checks = []

    def check(condition, label):
        assert condition, label
        checks.append(label)

    records = json.loads((QA / "asset-records.json").read_text(encoding="utf-8"))
    check(sum(len(records[name]["frames"]) for name in NAMES) == 78, "12キャラ78姿")
    details = []
    for name in NAMES:
        original = Image.open(ROOT / records[name]["file"].replace("v5", "v4"))
        edited = Image.open(ROOT / records[name]["file"])
        check(original.size == edited.size, f"{name}: 原画寸法保持")
        check(
            original.getchannel("A").tobytes() == edited.getchannel("A").tobytes(),
            f"{name}: 全アルファ画素保持",
        )
        allowed = Image.new("L", original.size)
        for index, region in enumerate(REGIONS[name]):
            ImageDraw.Draw(allowed).rectangle(
                (region[0], region[1], region[2] - 1, region[3] - 1), fill=255
            )
            for version, image in [(4, original), (5, edited)]:
                crop = image.crop(region).convert("RGBA")
                plate = Image.new("RGBA", crop.size, "#173e40")
                plate.alpha_composite(crop)
                factor = min(270 / crop.width, 100 / crop.height)
                enlarged = plate.convert("RGB").resize(
                    (round(crop.width * factor), round(crop.height * factor)),
                    Image.Resampling.NEAREST,
                )
                detail = Image.new("RGB", (270, 100), "#173e40")
                detail.paste(enlarged, ((270 - enlarged.width) // 2, (100 - enlarged.height) // 2))
                detail.save(QA / f"detail-{name}-{index}-v{version}.png")
            changed = any(
                c.getbbox()
                for c in ImageChops.difference(original.crop(region), edited.crop(region)).split()
            )
            details.append(
                {
                    "character": name,
                    "pose": records[name]["frames"][index]["name"],
                    "changed": changed,
                }
            )
        diff = ImageChops.difference(original, edited)
        check(
            all(
                ImageChops.multiply(c, ImageChops.invert(allowed)).getbbox() is None
                for c in diff.split()
            ),
            f"{name}: 目周辺以外のRGBA保持",
        )
        for frame in records[name]["frames"]:
            image = Image.open(ROOT / frame["file"])
            previous = Image.open(ROOT / frame["file"].replace("v5", "v4"))
            check(
                image.size == previous.size and image.mode == "RGBA",
                f"{name}/{frame['name']}: 寸法RGBA",
            )
            check(
                image.getchannel("A").tobytes() == previous.getchannel("A").tobytes(),
                f"{name}/{frame['name']}: 輪郭と位置保持",
            )
    baseline = json.loads((QA / "preservation-baseline.json").read_text(encoding="utf-8"))
    check(
        all(
            hashlib.sha256((ROOT / path).read_bytes()).hexdigest() == value
            for path, value in baseline.items()
        ),
        "全既存素材のSHA保持",
    )
    # 拡大比較も実ブラウザーで表示。縦方向を伸ばさずアスペクト比を維持。
    rows = []
    for name in NAMES:
        cells = []
        for index, frame in enumerate(records[name]["frames"]):
            cells.append(
                f'<figure><figcaption>{frame["name"]}</figcaption><img src="detail-{name}-{index}-v4.png" alt="before"><img src="detail-{name}-{index}-v5.png" alt="after"></figure>'
            )
        rows.append(
            f'<section id="{name}"><h2>{name}: 上 v4 / 下 v5</h2><div>{"".join(cells)}</div></section>'
        )
    preview = (
        '<!doctype html><html lang="ja"><meta charset="utf-8"><title>目の比較 v5</title><style>body{background:#173e40;color:#fff3d6;font:14px system-ui;margin:12px}h2{font-size:16px}section>div{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}figure{margin:0}img{display:block;width:100%;image-rendering:pixelated}figcaption{padding:4px}.button{display:block;width:330px;background:repeating-conic-gradient(#163e40 0% 25%,#375751 0% 50%) 0/20px 20px}.button img{width:100%}@media(min-width:900px){section>div{grid-template-columns:repeat(9,1fr)}}</style><h1>目の局所比較・78姿</h1>'
        + "".join(rows)
        + '<div class="button"><img src="../../products/word-guild/assets/ui-primary-button-transparent-v5.png" alt="透過版"></div></html>'
    )
    (QA / "preview.html").write_text(preview, encoding="utf-8")
    snapshots = []
    with BrowserServer(ROOT) as server, sync_playwright() as pw:
        options = {} if Path(pw.chromium.executable_path).is_file() else {"channel": "chrome"}
        browser = pw.chromium.launch(headless=True, **options)
        for width, height in [(390, 844), (320, 568), (1280, 900)]:
            page = browser.new_page(viewport={"width": width, "height": height})
            errors = []
            page.on("pageerror", lambda error, errors=errors: errors.append(str(error)))

            def asset(route):
                name = route.request.url.split("/")[-1]
                new = name.replace("generated-v4", "generated-v5")
                target = ROOT / "products/word-guild/assets" / new
                if target.is_file():
                    route.fulfill(path=str(target), content_type="image/png")
                else:
                    route.continue_()

            page.route("**/*-generated-v4.png", asset)
            for scene in [
                "home",
                "select",
                "cat",
                "animal",
                "final",
                "launch",
                "fall",
                "land",
                "return",
            ]:
                page.goto(server.url + f"/products/word-guild/index.html?dev=1&scene={scene}")
                page.wait_for_function("window.wordGuildDev && window.wordGuildState")
                page.wait_for_timeout(200)
                # 表示素材だけの試作。元のアニメ・ゲーム時計・入力規則は変更しない。
                page.add_style_tag(
                    content=".primary{background-color:transparent!important;border:0!important;box-shadow:none!important;background-image:url('assets/ui-primary-button-transparent-v5.png')!important}"
                )
                page.evaluate(
                    "Promise.all(Array.from(document.querySelectorAll('.character'), e => {const image=new Image();image.src=getComputedStyle(e.querySelector('.portrait')).backgroundImage.slice(5,-2);return image.decode().catch(()=>{});} ))"
                )
                page.wait_for_timeout(180)
                if scene in ["home", "select", "return"]:
                    page.wait_for_selector("#start" if scene != "select" else "#depart")
                filename = f"production-preview-{scene}-{width}.png"
                page.screenshot(path=str(QA / filename))
                state = page.evaluate("wordGuildState")
                rects = page.locator(".character").evaluate_all(
                    "es=>es.map(e=>({name:e.dataset.character,pose:e.dataset.pose,w:e.getBoundingClientRect().width,h:e.getBoundingClientRect().height}))"
                )
                snapshots.append(
                    {
                        "scene": scene,
                        "viewport": [width, height],
                        "file": filename,
                        "state": state,
                        "dimensions": rects,
                    }
                )
                check(
                    all(r["w"] > 0 and r["h"] > 0 for r in rects),
                    f"{scene}/{width}: 実寸キャラ表示",
                )
                if scene in ["cat", "animal", "final"]:
                    cells = page.locator("[data-cell]").first.bounding_box()
                    board = page.locator("#board").bounding_box()
                    check(
                        page.locator("[data-cell]").count() == 42
                        and cells is not None
                        and board["y"] + board["height"] <= height,
                        f"{scene}/{width}: 全42マス画面内",
                    )
            check(not errors, f"{width}: ブラウザー例外なし")
            page.goto(server.url + "/quality/eyes-v5/preview.html")
            page.wait_for_function(
                "Array.from(document.images).every(i=>i.complete && i.naturalWidth)"
            )
            check(page.locator("figure").count() == 78, f"{width}: 拡大比較78姿")
            for name in NAMES:
                page.locator(f"#{name}").screenshot(path=str(QA / f"compare-{name}-{width}.png"))
            page.locator(".button").screenshot(path=str(QA / f"button-alpha-{width}.png"))
            page.close()
        browser.close()
    result = {
        "passed": True,
        "checks": checks,
        "snapshots": snapshots,
        "details": details,
        "production_integration": False,
        "method": "本番ページのHTTP要求を検査内でv5へ差替。ゲームソース変更なし。",
        "human_checks": [
            "iPhone 17 / iOS 26.1のSafariとホーム画面で目と表情の実寸確認",
            "目の最終的な好みと控えめ縮小のボスを人が確認",
        ],
    }
    (QA / "results.json").write_text(
        json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    print(f"PASS: {len(checks)} eye material and browser assertions")


if __name__ == "__main__":
    run()
