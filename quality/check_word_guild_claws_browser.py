"""一本の傷の本番組み込み・表示途中・再描画を実ブラウザーで検査。"""

import json
from pathlib import Path

from browser_probe import DIAGNOSTICS, capture, navigate, prepare
from browser_server import BrowserServer
from check_word_guild_browser import drag, fit, snap, state
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
checks = []


def check(value, message):
    assert value, message
    checks.append(message)


def set_reveal_time(page, time):
    # PNG検査の所要時間に依存させず、本番CSSの開示を検査ページ内で固定する。
    page.locator(".claw-reveal").evaluate_all(
        "(els,time)=>els.forEach(el=>{el.classList.add('fresh');"
        "el.style.animationDelay='0ms';el.getAnimations().forEach(a=>"
        "{a.pause();a.currentTime=time;});})",
        time,
    )


def pause_after_release(page):
    # 素材撮影専用。離指で判定した同じイベントの末尾で本番非表示処理を呼ぶ。
    # 全体検査と回帰検査の自然な時計は止めない。
    page.evaluate("""()=>document.addEventListener('pointerup',()=>{
        Object.defineProperty(document,'hidden',{configurable:true,value:true});
        document.dispatchEvent(new Event('visibilitychange'));
    },{once:true})""")


def pause_on_phase(page, name):
    # 撮影専用。短い状態へ入った同じ描画の末尾で非表示処理へ接続する。
    # 通常ルートと回帰検査の時計は、この補助を呼ばない。
    page.evaluate(
        """name=>{
        const observer=new MutationObserver(()=>{
            if(wordGuildState.state!==name)return;
            observer.disconnect();
            Object.defineProperty(document,'hidden',{configurable:true,value:true});
            document.dispatchEvent(new Event('visibilitychange'));
        });
        observer.observe(document.querySelector('#view'),{attributes:true,childList:true});
    }""",
        name,
    )


def resume(page):
    page.evaluate("""()=>{
        Object.defineProperty(document,'hidden',{configurable:true,value:false});
        document.dispatchEvent(new Event('visibilitychange'));
    }""")


def run(base):
    with sync_playwright() as p:
        options = {} if Path(p.chromium.executable_path).is_file() else {"channel": "chrome"}
        browser = p.chromium.launch(headless=True, **options)
        errors = []
        for width, height in [(390, 844), (320, 568), (1280, 900)]:
            page = browser.new_page(viewport={"width": width, "height": height})
            prepare(page)
            page.on("pageerror", lambda e: errors.append(str(e)))
            navigate(page, base + "?dev=1&scene=cat")
            for scene, path in [("cat", [8, 9, 10]), ("dog", [5, 12, 19]), ("ant", [29, 30, 37])]:
                page.evaluate("scene=>wordGuildDev.load(scene)", scene)
                snap(page, f"cut-{scene}-before-{width}")
                pause_after_release(page)
                drag(page, path)
                # 素材のデコード・撮影中に750ms後の崩落へ進まないよう本番の非表示処理で停止。
                page.wait_for_selector("#claws .claw-cut")
                check(page.locator("#claws .claw-cut").count() == 1, f"{width}/{scene}: 一語一傷")
                check(page.locator("#claws polyline").count() == 0, "三本の平行線を廃止")
                check(
                    page.locator(".claw-cut image").count() == 1
                    and page.locator(".claw-cut").get_attribute("data-material")
                    == "assets/claw-strip-generated-v3.png",
                    "生成ストリップを一つの連続した傷へ使用",
                )
                check(
                    page.locator("#claws").evaluate("e=>getComputedStyle(e).pointerEvents==='none'")
                    and page.locator("#board .letter").first.evaluate(
                        "e=>getComputedStyle(e).zIndex==='2'"
                    ),
                    "傷は操作を遮らず、文字は最前面",
                )
                check(
                    page.locator(".claw-texture").evaluate("""async e=>{
                        const image=new Image();image.src=e.getAttribute('href');
                        await image.decode();
                        const canvas=document.createElement('canvas');
                        canvas.width=image.naturalWidth;canvas.height=image.naturalHeight;
                        const ctx=canvas.getContext('2d');ctx.drawImage(image,0,0);
                        const data=ctx.getImageData(0,0,canvas.width,canvas.height).data;
                        let red=0,dark=0,rim=0;
                        for(let i=0;i<data.length;i+=4){if(data[i+3]<100)continue;
                            if(data[i]>100 && data[i]>data[i+1]*1.7)red++;
                            if(data[i]+data[i+1]+data[i+2]<100)dark++;
                            if(data[i]+data[i+1]+data[i+2]>550)rim++;
                        }return red>40 && dark>40 && rim>40;
                    }"""),
                    "実描画テクスチャに赤い内部光・黒い深部・明るい欠けた縁",
                )
                check(
                    page.locator(".claw-reveal").first.get_attribute("stroke-width") == "45.9",
                    "開示幅も35％拡大",
                )
                check(
                    page.locator(".letter").first.evaluate(
                        "e=>getComputedStyle(e).textShadow === 'none' && "
                        "parseFloat(getComputedStyle(e).webkitTextStrokeWidth) === 0"
                    ),
                    "文字は単色・装飾影と輪郭線なし",
                )
                set_reveal_time(page, 100)
                check(
                    page.locator(".claw-reveal").first.evaluate(
                        "e=>{const v=parseFloat(getComputedStyle(e).strokeDashoffset);"
                        "return v>0 && v<1;}"
                    ),
                    "100msでは経路の途中まで開示",
                )
                snap(page, f"cut-{scene}-100ms-{width}")
                set_reveal_time(page, 240)
                snap(page, f"cut-{scene}-complete-{width}")
                if scene == "ant":
                    check(
                        "Q" in page.locator(".claw-reveal").get_attribute("d"),
                        "曲がり角は連続曲線で接合",
                    )
                # 実際のマス中心と傷の始点の一致（余白・間隔込み）。
                check(
                    page.evaluate(
                        "index=>{const s=document.querySelector('#claws'),"
                        "b=s.getBoundingClientRect(),"
                        'c=document.querySelector(`[data-cell="${index}"]`).getBoundingClientRect(),'
                        "p=s.querySelector('.claw-reveal').getPointAtLength(0);"
                        "return Math.abs(p.x-(c.x+c.width/2-b.x)*700/b.width)<.02 && "
                        "Math.abs(p.y-(c.y+c.height/2-b.y)*600/b.height)<.02;}",
                        path[0],
                    ),
                    "傷の始点は実マス中心に一致",
                )
                if scene == "cat":
                    pause_on_phase(page, "travel")
                resume(page)
                if scene == "cat":
                    page.wait_for_function('wordGuildState.state==="travel"')
                    page.wait_for_selector(".claw-cut")
                    snap(page, f"cut-crumble-{width}")
                    check(page.locator(".claw-cut").count() == 1, "崩落中は盤面と傷を保持")
                    pause_on_phase(page, "arriving")
                    resume(page)
                    page.wait_for_function('wordGuildState.state==="arriving"')
                    check(page.locator(".claw-cut").count() == 0, "新しい石へ傷を持ち越さない")
                    snap(page, f"cut-arriving-{width}")
                    resume(page)
            # animalの一語目は画面に残る。重複・誤答・キャンセル後も静止。
            page.evaluate('wordGuildDev.load("animal")')
            drag(page, [8, 9, 10])
            page.wait_for_selector(".claw-cut")
            page.wait_for_timeout(300)
            started = page.locator("[data-cut]").get_attribute("data-started")
            drag(page, [8, 9, 10])
            check(state(page)["found"] == ["cat"], "重複は発見数を増やさない")
            drag(page, [6])
            drag(page, [14, 15], False)
            page.locator("#board").dispatch_event("pointercancel", {"pointerId": 1})
            page.mouse.up()
            check(page.locator(".claw-cut").count() == 1, "誤答・重複・キャンセルで傷は増えない")
            # リサイズによる本番再描画も既存の開示を再開しない。
            # PCではmax-widthにより+1pxで盤面寸法が変わらないので幅390へ縮める。
            page.set_viewport_size({"width": width + 1 if width < 700 else 390, "height": height})
            page.wait_for_timeout(80)
            check(
                page.locator("[data-cut]").get_attribute("data-started") == started
                and page.locator(".claw-reveal.fresh").count() == 0,
                "再描画で古い傷の開始時刻を保持しアニメを再開しない",
            )
            page.set_viewport_size({"width": width, "height": height})
            pause_after_release(page)
            drag(page, [5, 12, 19])
            page.wait_for_selector("[data-cut='1']")
            check(page.locator(".claw-cut").count() == 2, "ボス二語は各一本、合計二傷")
            check(
                page.locator(".claw-reveal").first.evaluate("e=>e.getAnimations().length===0"),
                "新しい正解時も古い傷を再アニメーションしない",
            )
            set_reveal_time(page, 240)
            snap(page, f"cut-boss-two-{width}")
            fit(page, ["#board", '[data-cell="41"]', "#hpbar"])
            resume(page)
            page.emulate_media(reduced_motion="reduce")
            page.evaluate('wordGuildDev.load("animal")')
            drag(page, [29, 30, 37])
            page.wait_for_selector(".claw-cut")
            check(
                page.locator(".claw-reveal").evaluate(
                    "e=>getComputedStyle(e).animationName==='none' && "
                    "parseFloat(getComputedStyle(e).strokeDashoffset)===0"
                ),
                "reduced-motionでは一本の完成した傷を即時表示",
            )
            snap(page, f"cut-reduced-{width}")
            capture(page)
            page.close()
        check(not errors, f"切り傷の本番ブラウザーJS例外なし: {errors}")
        # 本番盤面の材質と細い両端を、実レンダリングDPR3の拡大画像でも確認する。
        detail = browser.new_page(viewport={"width": 390, "height": 844}, device_scale_factor=3)
        detail.goto(base + "?dev=1&scene=animal", wait_until="networkidle")
        drag(detail, [29, 30, 37])
        detail.wait_for_selector(".claw-cut")
        detail.wait_for_timeout(260)
        detail.locator("#board").screenshot(
            path=str(ROOT / "quality/screenshots/cut-detail-390.png")
        )
        detail.close()
        browser.close()


if __name__ == "__main__":
    server = BrowserServer(ROOT)
    result = dict(passed=False, checks=checks)
    try:
        with server:
            run(server.url + "/products/word-guild/index.html")
            server.assert_running()
        result["passed"] = True
        print(f"PASS: {len(checks)} integrated claw browser assertions")
    except Exception as error:
        result["error"] = str(error)
        raise
    finally:
        result["server"] = server.snapshot()
        result["diagnostics"] = DIAGNOSTICS
        (ROOT / "quality/claw-browser-results.json").write_text(
            json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8"
        )
