"""救出・飛来・加入の画面、実2語入力、保存と再起動の検査。"""

import json
from pathlib import Path

from browser_probe import capture, navigate, phase, prepare
from browser_server import BrowserServer
from check_word_guild_browser import drag, fit
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "quality/rescue-v10"
CHECKS, IMAGES, OBS = [], [], []


def check(value, name):
    assert value, name
    CHECKS.append(name)


def visibility(page, hidden):
    page.evaluate(
        """hidden=>{
        Object.defineProperty(document,'hidden',{configurable:true,get:()=>hidden});
        document.dispatchEvent(new Event('visibilitychange'));
    }""",
        hidden,
    )


def run(browser, base):
    for width, height in [(390, 844), (320, 568), (1280, 900)]:
        for motion in ["no-preference", "reduce"]:
            page = browser.new_page(
                viewport={"width": width, "height": height}, reduced_motion=motion
            )
            # 撮影用シーンだけ、初期読込中の短いlossを進めない。
            # 自然な攻略と入力は後半の別contextで時計を止めずに検査する。
            page.add_init_script("""Object.defineProperty(document,'hidden',{
                configurable:true,get:()=>true});
                document.addEventListener('DOMContentLoaded',()=>document.body.classList.add('paused'));
            """)
            diagnostic = prepare(page)
            for scene in [
                "loss",
                "escape",
                "rescue",
                "sendoff",
                "bossArrival",
                "bossLand",
                "recruited",
                "return",
            ]:
                navigate(page, base + f"?dev=1&scene={scene}")
                # 撮影はCSS背景の肖像もdecodeまで待つ。初回表示速度は別検査。
                page.evaluate("""async()=>{
                    const {loadSprite}=await import('./sprites.mjs');
                    await Promise.all(Array.from(document.querySelectorAll('.character'),e=>
                        loadSprite(e.dataset.character,[e.dataset.pose==='animated'?'idle':e.dataset.pose])));
                    await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
                }""")
                if scene == "bossArrival":
                    visibility(page, False)
                    page.wait_for_function("wordGuildState.phase.elapsed>1100")
                visibility(page, True)
                s = page.evaluate("wordGuildState")
                if scene in ["loss", "escape", "rescue", "sendoff"]:
                    fit(page, ["#board", '[data-cell="41"]', "#hpbar", ".guide"])
                    check(
                        s["hp"] == (0 if scene in ["loss", "escape"] else 10),
                        f"{width}-{scene}: HP0→10",
                    )
                    check(
                        page.locator("#return,.question-clues").count() == 0,
                        "救出を飛ばすボタンと箇条書きなし",
                    )
                    if scene != "loss":
                        check(
                            "大技まで" not in page.locator("#affinity").inner_text(),
                            "救出中に攻撃の秒数を出さない",
                        )
                elif scene == "return":
                    fit(page, ["#start", ".guide", ".guild-scene"])
                else:
                    fit(page, [".guild-return-scene", ".guide", ".arrival-hp"])
                    check(page.locator(".arrived-hero").count() == 1, "主人公は着地済み")
                    check(page.locator(".boss-traveler").count() == 1, "通常ボスが飛来")
                if scene in ["bossArrival", "bossLand", "recruited", "return"]:
                    check(page.locator(".art-guide").count() == 0, f"{scene}: しるべの素材なし")
                if scene in ["recruited", "return"]:
                    check(
                        page.locator(".narrator-slot .art-animal").count() == 1,
                        "大きな案内役は通常ボス",
                    )
                name = f"{scene}-{width}-{motion}.png"
                page.screenshot(path=str(OUT / name))
                IMAGES.append(name)
                OBS.append({"image": name, "state": s})
            check(not diagnostic["pageerrors"], "新演出のJS例外なし")
            page.close()
    # 保存は開発URLのメモリー隔離を使わず、通常URLで確認。
    context = browser.new_context(viewport={"width": 390, "height": 844})
    page = context.new_page()
    prepare(page)
    page.add_init_script("""if(!localStorage.getItem('word-guild-v1'))localStorage.setItem(
        'word-guild-v1',JSON.stringify({version:1,hero:'female',ally:'water',complete:true}));""")
    navigate(page, base)
    check(
        not page.evaluate("wordGuildState.storyState.bossRecruited"),
        "旧completeから加入を推測しない",
    )
    page.goto(base + "?dev=1&scene=final", wait_until="domcontentloaded")
    page.wait_for_selector('[data-cell="41"]')
    questions = page.evaluate("async()=> (await import('./question-data.mjs')).BOSS_QUESTIONS[5]")
    drag(page, questions[0]["path"])
    hit = drag(page, questions[1]["path"])
    check(hit["state"] == "loss" and hit["hp"] == 0, "実2語入力で一撃・HP0")
    for name in [
        "escape",
        "rescue",
        "sendoff",
        "launch",
        "fall",
        "land",
        "bossArrival",
        "bossLand",
        "recruited",
    ]:
        s = phase(page, 5, name)
        OBS.append({"phase": name, "state": s})
        if name == "rescue":
            visibility(page, True)
            before = page.evaluate("wordGuildState")
            page.wait_for_timeout(350)
            after = page.evaluate("wordGuildState")
            check(before["phase"] == after["phase"] and after["hp"] == 10, "非表示中は救出時計停止")
            visibility(page, False)
    page.wait_for_function("wordGuildState.screen==='home'")
    joined = page.evaluate("wordGuildState")
    # dev保存は隔離。実GameとsaveDataの公開契約をブラウザー内で保存・再読込する。
    page.evaluate(
        """async flags=>{
        const {saveData}=await import('./core.mjs');
        saveData(localStorage,{version:1,hero:'female',ally:'water',complete:true,...flags});
    }""",
        {
            "bossRecruited": joined["storyState"]["bossRecruited"],
            "guideAvailable": joined["storyState"]["guideAvailable"],
        },
    )
    navigate(page, base)
    check(
        page.locator(".art-guide").count() == 0 and page.locator(".art-animal").count() > 0,
        "加入保存から通常URLで案内役復元",
    )
    page.click("#start")
    page.click("#depart")
    check(
        page.evaluate("wordGuildState.storyState.narrator==='animal'"), "再攻略でも通常ボスの案内"
    )
    check(page.locator(".art-guide").count() == 0, "再攻略でもしるべ不在")
    check(drag(page, [8, 9, 10, 11, 10])["state"] == "defeated", "加入後も一歩戻し・CAT正解")
    capture(page)
    context.close()


def main():
    OUT.mkdir(exist_ok=True)
    result = {"passed": False, "checks": CHECKS, "images": IMAGES, "observations": OBS}
    try:
        with BrowserServer(ROOT) as server, sync_playwright() as pw:
            opts = {} if Path(pw.chromium.executable_path).is_file() else {"channel": "chrome"}
            browser = pw.chromium.launch(headless=True, **opts)
            run(browser, server.url + "/products/word-guild/index.html")
            browser.close()
        result["passed"] = True
        print(f"PASS: {len(CHECKS)} rescue assertions; {len(IMAGES)} screenshots")
    except Exception as error:
        result["error"] = str(error)
        raise
    finally:
        (OUT / "results.json").write_text(
            json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8"
        )


if __name__ == "__main__":
    main()
