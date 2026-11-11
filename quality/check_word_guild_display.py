"""旧素材保持とv8可逆表示、遅延時の表情、透過ボタン実操作。"""

import hashlib
import json
import time
from pathlib import Path

from PIL import Image, ImageChops, ImageStat

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "quality/loading-v6"


def wait_held(page, pending):
    """キュー開始後の実HTTP要求を待つ。画像の保留を解除せず観測する。"""
    deadline = time.monotonic() + 30
    while not pending and time.monotonic() < deadline:
        page.wait_for_timeout(25)
    assert pending, "保留対象の画像要求がキューから開始されない"


def verify(browser, base):
    checks = []

    def check(value, label):
        assert value, label
        checks.append(label)

    records = json.loads((OUT / "assets.json").read_text(encoding="utf-8"))
    for r in records:
        check(
            hashlib.sha256((ROOT / r["source"]).read_bytes()).hexdigest() == r["source_sha256"],
            f"原画保持: {r['source']}",
        )
        if r["lossless"]:
            a, b = [Image.open(ROOT / r[k]).convert("RGBA") for k in ["source", "file"]]
            check(
                a.size == b.size
                and a.getchannel("A").tobytes() == b.getchannel("A").tobytes()
                and Image.composite(
                    a, b, a.getchannel("A").point(lambda x: 255 if x else 0)
                ).tobytes()
                == b.tobytes(),
                f"全可視画素・輪郭・目・寸法保持: {r['file']}",
            )
        elif r.get("category") == "ui":
            original = Image.open(ROOT / r["source"]).convert("RGBA")
            decoded = Image.open(ROOT / r["file"]).convert("RGBA")
            check(
                original.size == decoded.size
                and original.getchannel("A").tobytes() == decoded.getchannel("A").tobytes(),
                f"装飾の全アルファ・寸法保持: {r['file']}",
            )
            mask = original.getchannel("A").point(lambda a: 255 if a else 0)
            errors = []
            for color in ["#173e40", "#fff3d6"]:
                background = Image.new("RGBA", original.size, color)
                a = Image.alpha_composite(background, original).convert("RGB")
                b = Image.alpha_composite(background, decoded).convert("RGB")
                errors.extend(ImageStat.Stat(ImageChops.difference(a, b), mask).mean)
            check(
                max(errors) < 5,
                f"装飾の背景合成後の可視RGB平均色差は5未満: {r['file']}",
            )
    current = json.loads(
        (ROOT / "quality/characters-v8/asset-records.json").read_text(encoding="utf-8")
    )
    for name, record in current.items():
        for frame in record["frames"]:
            png, webp = ROOT / frame["file"], ROOT / frame["display"]
            check(
                hashlib.sha256(png.read_bytes()).hexdigest() == frame["sha256"]
                and hashlib.sha256(webp.read_bytes()).hexdigest() == frame["webp_sha256"],
                f"v8受領PNG/WebP保持: {name}/{frame['name']}",
            )
            a, b = Image.open(png).convert("RGBA"), Image.open(webp).convert("RGBA")
            mask = a.getchannel("A").point(lambda alpha: 255 if alpha else 0)
            check(
                a.size == b.size == (256, 256)
                and a.getchannel("A").tobytes() == b.getchannel("A").tobytes()
                and all(
                    ImageChops.multiply(channel, mask).getbbox() is None
                    for channel in ImageChops.difference(a, b).split()[:3]
                ),
                f"v8の256px・可視RGB・全アルファ保持: {name}/{frame['name']}",
            )
    context = browser.new_context()
    page = context.new_page()
    errors = []
    page.on("pageerror", lambda e: errors.append(str(e)))
    page.goto(base + "?dev=1")
    page.wait_for_function("window.wordGuildDev")
    # 撮影用だけ全素材を準備。速度測定には使用しない。
    page.evaluate("""async()=>{
        const {CHARACTERS,loadSprite}=await import('./sprites.mjs');
        const {loadImage}=await import('./assets-loader.mjs');
        await Promise.all(CHARACTERS.map(n=>loadSprite(n,
            ['idle','blink','joy','worried','action-1','action-2',
             ...(['male','female'].includes(n)?['launch','fall','land']:[])])));
    }""")
    urls = ["/" + r["file"] for r in records if not r["lossless"]]
    page.evaluate(
        """async urls=>{const {loadImage}=await import('./assets-loader.mjs');
        await Promise.all(urls.map(u=>loadImage(u)));}""",
        urls,
    )
    for width, height in [(390, 844), (320, 568), (1280, 900)]:
        page.set_viewport_size({"width": width, "height": height})
        for motion in ["no-preference", "reduce"]:
            page.emulate_media(reduced_motion=motion)
            for scene in [
                "home",
                "select",
                "cat",
                "dog",
                "sun",
                "ant",
                "animal",
                "final",
                "launch",
                "fall",
                "land",
                "return",
            ]:
                page.evaluate("s=>wordGuildDev.load(s)", scene)
                check(
                    page.evaluate("document.documentElement.scrollWidth<=innerWidth"),
                    f"{width}/{motion}/{scene}: 横はみ出しなし",
                )
                if scene in ["cat", "dog", "sun", "ant", "animal", "final"]:
                    check(
                        page.locator("[data-cell]").count() == 42
                        and page.locator("#board").evaluate(
                            "e=>e.getBoundingClientRect().bottom<=innerHeight"
                        ),
                        f"{width}/{motion}/{scene}: 42マスが画面内",
                    )
                page.screenshot(path=str(OUT / f"{scene}-{width}-{motion}.png"))
        page.emulate_media(reduced_motion="no-preference")
    for width, height in [(390, 844), (320, 568), (1280, 900)]:
        page.set_viewport_size({"width": width, "height": height})
        # 完了済み通常URLを保存から復元し、マウスとキーボードで再出発。
        page.evaluate(
            "localStorage.setItem('word-guild-v1',JSON.stringify({version"
            ":1,hero:'female',ally:'water',complete:true}))"
        )
        page.goto(base)
        page.wait_for_selector("#start")
        page.locator("#start").evaluate(
            "async e=>{const i=new Image();i.src=getComputedStyle(e).back"
            "groundImage.slice(5,-2);await i.decode();}"
        )
        check(
            page.evaluate("!window.wordGuildDev && wordGuildState.complete"),
            f"{width}: 完了状態を復元・通常URLに開発操作なし",
        )
        button = page.locator("#start")
        for state in ["normal", "hover", "focus"]:
            if state == "hover":
                button.hover()
            if state == "focus":
                button.focus()
            style = button.evaluate(
                "e=>{const s=getComputedStyle(e);return [s.backgroundColor,s."
                "borderTopWidth,s.boxShadow,s.backgroundImage,e.getBoundingCl"
                "ientRect().height]}"
            )
            check(
                style[0] == "rgba(0, 0, 0, 0)"
                and style[1] == "0px"
                and style[2] == "none"
                and "ui-primary-button-display-v7.webp" in style[3]
                and style[4] >= 44,
                f"{width}/{state}: 黄色矩形なし・44px以上",
            )
            page.screenshot(path=str(OUT / f"button-{state}-{width}.png"))
        button.press("Enter")
        check(page.evaluate("wordGuildState.screen==='select'"), f"{width}: キーボードで冒険へ")
        page.click("#back")
        button = page.locator("#start")
        box = button.bounding_box()
        page.mouse.move(box["x"] + box["width"] / 2, box["y"] + box["height"] / 2)
        page.mouse.down()
        page.screenshot(path=str(OUT / f"button-pressed-{width}.png"))
        page.mouse.up()
        check(page.evaluate("wordGuildState.screen==='select'"), f"{width}: 押下・離指で冒険へ")
    # 遅い喜び画像でも選択時に既読込idleで表示し、decode完了後に切替。
    slow = context.new_page()
    held = []
    slow.route("**/female-joy-display-v8.webp", lambda route: held.append(route))
    slow.goto(base + "?dev=1&scene=select")
    slow.wait_for_function("window.wordGuildDev")
    slow.wait_for_function("wordGuildAssets.some(a=>a.url.includes('female-idle')&&a.ready)")
    slow.click('[data-hero="female"]')
    check(
        "female-idle"
        in slow.locator('[data-hero="female"] .portrait').evaluate(
            "e=>getComputedStyle(e).backgroundImage"
        ),
        "遅延表情はdecode済みidleで空白を防ぐ",
    )
    wait_held(slow, held)
    check(len(held) == 1, "同一URLの取得は共有し一回")
    held[0].continue_()
    slow.wait_for_function(
        'getComputedStyle(document.querySelector(\'[data-hero="female"'
        "] .portrait')).backgroundImage.includes('female-joy')"
    )
    check(True, "decode成功後に喜び姿へ切替")
    # 読み込みを実HTTPで保留し、次背景と短い帰還で下層が残ることを検査。
    background_held = []
    return_held = []
    slow.route("**/floor-2-display-v6.webp", lambda route: background_held.append(route))
    slow.route("**/return-approach-display-v6.webp", lambda route: return_held.append(route))
    slow.evaluate("""async()=>{
        const {loadSprite}=await import('./sprites.mjs');
        const {loadImage,assetURL}=await import('./assets-loader.mjs');
        await loadImage(assetURL('guild'));await loadSprite('sun');
        await loadSprite('male',['fall']);
    }""")
    slow.evaluate("wordGuildDev.load('sun')")
    wait_held(slow, background_held)
    check(
        len(background_held) == 1
        and slow.locator(".arena").evaluate(
            "e=>getComputedStyle(e).backgroundImage.includes('guild-display-v6')"
        ),
        "次階層の遅延中もdecode済み背景の下層を保持",
    )
    background_held[0].continue_()
    slow.wait_for_function("wordGuildAssets.some(a=>a.url.includes('floor-2')&&a.ready)")
    check(True, "次階層の背景は同一URLのdecode後に表示")
    slow.emulate_media(reduced_motion="reduce")
    return_view = slow.evaluate("""()=>{wordGuildDev.load('fall');return {
        background:getComputedStyle(document.querySelector('.flight-scene')).backgroundImage,
        pose:getComputedStyle(document.querySelector('.traveler .portrait')).backgroundImage};}""")
    wait_held(slow, return_held)
    check(
        len(return_held) == 1
        and "guild-display-v6" in return_view["background"]
        and "male-fall-display-v8" in return_view["pose"],
        "帰還背景の遅延中も主人公と既読込背景を表示",
    )
    return_held[0].continue_()
    slow.wait_for_function("wordGuildAssets.some(a=>a.url.includes('return-approach')&&a.ready)")
    check(True, "帰還背景の保留解除でdecodeを完了")
    check(not errors, f"表示・ボタン操作のJS例外なし: {errors}")
    context.close()
    result = {
        "passed": True,
        "checks": checks,
        "screenshot_wait": "全素材待機は撮影専用。性能測定と別ページ。",
    }
    (OUT / "display.json").write_text(
        json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    return len(checks)
