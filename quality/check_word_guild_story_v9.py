"""最新の歩行・凍結・音声を本番画面と実入力で検査する。"""

import hashlib
import json
from pathlib import Path

from browser_probe import capture, navigate, phase, prepare
from browser_server import BrowserServer
from check_word_guild_browser import drag, fit
from check_word_guild_dialogue_browser import AUDIO_PROBE
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "quality/story-v9"
CHECKS, OBSERVATIONS, IMAGES = [], [], []


def check(value, label):
    assert value, label
    CHECKS.append(label)


def observe(page, label):
    s = page.evaluate("wordGuildState")
    OBSERVATIONS.append({"label": label, "state": s})
    return s


def image(page, label):
    page.screenshot(path=str(OUT / f"{label}.png"))
    IMAGES.append(f"quality/story-v9/{label}.png")


def play_flow(browser, base, mode):
    page = browser.new_page(viewport={"width": 390, "height": 844})
    errors = prepare(page)
    page.add_init_script(AUDIO_PROBE)
    if mode == "failed":
        page.route("**/assets/voice/*.wav", lambda route: route.fulfill(status=503, body="failed"))
    if mode == "normal":
        navigate(page, base)
        page.click("#start")
        page.click('[data-hero="female"]')
        page.click('[data-ally="water"]')
        page.click("#depart")
        paths = [[8, 9, 10, 11, 10], [5, 12, 19], [24, 25, 26], [29, 30, 37]]
        for n, path in enumerate(paths):
            page.wait_for_function(
                "n=>wordGuildState.stage===n&&wordGuildState.state==='battle'", arg=n
            )
            check(drag(page, path)["state"] == "defeated", f"{mode}: 会話中の階層{n}実入力")
    else:
        # 失敗・停止は再現シーンから実際の2語入力で演出全体を確認。
        navigate(page, base + "?dev=1&scene=animal")
        page.click("#music")
        page.click("#voice")
        if mode == "muted":
            page.click("#voice")
    page.wait_for_function("wordGuildState.stage===4&&wordGuildState.state==='battle'")
    drag(page, [8, 9, 10])
    before = observe(page, f"{mode}-boss-one")
    check(drag(page, [8, 9, 10])["found"] == ["cat"], f"{mode}: ボス重複無効")
    before = drag(page, [5, 12, 19])
    for name in ["returning", "freezing", "bewildered"]:
        s = phase(page, 4, name)
        check(
            s["elapsed"] == before["elapsed"] and s["hp"] == before["hp"],
            f"{mode}-{name}: 戦闘時計とHP停止",
        )
        check(
            s["board"] == before["board"] and s["disabled"] == 42,
            f"{mode}-{name}: 盤面保持・入力停止",
        )
        observe(page, f"{mode}-{name}")
        if mode == "normal":
            image(page, f"natural-{name}")
    raid = phase(page, 5, "intrusion")
    check(raid["elapsed"] == 0 and raid["cuts"] == 0, f"{mode}: 乱入前の時計0と傷の整理")
    battle = phase(page, 5, "battle")
    check(battle["elapsed"] == 0 and battle["disabled"] == 0, f"{mode}: 操作開始から時計開始")
    lost = phase(page, 5, "loss")
    check(lost["elapsed"] == 10000 and lost["hp"] == 0, f"{mode}: 声に依存せず10秒即死")
    OBSERVATIONS.append({"label": f"{mode}-raid-timing", "battle": battle, "loss": lost})
    check(9000 <= lost["at"] - battle["at"] <= 12000, f"{mode}: 実時間の10秒（DOM観測誤差込み）")
    page.click("#return")
    for name in ["launch", "fall", "land"]:
        s = phase(page, 5, name)
        check(s["story"]["text"] == "うわああああああ", f"{mode}-{name}: 叫び限定の代替字幕")
        check(not s["music"]["playing"], f"{mode}-{name}: BGMなし")
        lines = [s["dialogue"]["current"], *s["dialogue"]["queue"]]
        check(
            all(x["text"] == "うわああああああ" for x in lines if x), f"{mode}-{name}: 他の発話なし"
        )
    page.wait_for_function("wordGuildState.screen==='home'&&wordGuildState.complete")
    if mode == "normal":
        audio = page.evaluate("qualityDialogueAudio")
        voices = [
            s
            for s in audio["sources"]
            if s.get("voiceKey", "").startswith("flight.hero.launch")
            and len(s.get("args", [])) == 3
        ]
        check(len(voices) == 1 and voices[0]["starts"] == 1, "飛行の実AudioSourceは叫び一度")
        OBSERVATIONS.append({"label": "real-audio-sources", "audio": audio})
        keys = {s.get("voiceKey") for s in audio["sources"] if len(s.get("args", [])) == 3}
        for key in [
            "animal.enemy.approval",
            "returning.guide.guild",
            "freezing.guide.terrain",
            "freezing.hero.ice.female",
            "bewildered.guide.what",
            "bewildered.animal.garden",
        ]:
            check(key in keys, f"新しい掛け合いの実AudioSource: {key}")
    check(not errors["pageerrors"], f"{mode}: JS例外なし")
    capture(page)
    page.close()
    print(f"flow {mode}: PASS", flush=True)


def walking_and_scenes(browser, base):
    # 全選択はUIから変更し、CATを実入力して自然な道中でフレームを観測。
    for hero in ["male", "female"]:
        for ally in ["fire", "water", "grass"]:
            page = browser.new_page(viewport={"width": 390, "height": 844})
            prepare(page)
            page.add_init_script("""window.walkSeen=[];let prev='';function sample(){
                requestAnimationFrame(sample);const s=window.wordGuildState;
                if(s?.state==='travel'){const key=JSON.stringify(s.walking);
                  if(key!==prev){walkSeen.push(s.walking);prev=key;}}}requestAnimationFrame(sample);""")
            navigate(page, base)
            page.click("#start")
            page.click(f'[data-hero="{hero}"]')
            page.click(f'[data-ally="{ally}"]')
            page.click("#depart")
            drag(page, [8, 9, 10])
            phase(page, 0, "travel")
            image(page, f"walk-{hero}-{ally}")
            phase(page, 1, "battle")
            frames = page.evaluate("walkSeen")
            for name in [hero, ally]:
                check(
                    {f["frame"] for pair in frames for f in pair if f["name"] == name}
                    == {0, 1, 2, 3},
                    f"{hero}-{ally}: {name}全4歩行姿",
                )
            check(
                all(f["direction"] == "NE" for pair in frames for f in pair),
                f"{hero}-{ally}: 右奥向き",
            )
            OBSERVATIONS.append({"label": f"walk-{hero}-{ally}", "frames": frames})
            page.close()
    for width, height in [(390, 844), (320, 568), (1200, 900)]:
        for reduced in [False, True]:
            page = browser.new_page(
                viewport={"width": width, "height": height},
                reduced_motion="reduce" if reduced else "no-preference",
            )
            prepare(page)
            for name in ["travel", "freezing", "bewildered", "launch"]:
                navigate(page, base + f"?dev=1&scene={name}")
                if name == "freezing" and not reduced:
                    page.wait_for_timeout(4400)
                if name != "launch":
                    fit(page, ["#board", '[data-cell="41"]', ".arena", "#hpbar", ".guide"])
                if name == "travel" and reduced:
                    check(
                        all(f["frame"] == 0 for f in observe(page, "reduced-walk")["walking"]),
                        "動きを減らす場合は後ろ向き01",
                    )
                if name in ["freezing", "bewildered"]:
                    check(page.locator(".terrain-ice img").count() == 3, f"{width}-{name}: 凍結3層")
                    check(
                        page.locator('.enemy-motion [data-pose="worried"]').count() == 1,
                        f"{width}-{name}: 番人の困惑姿",
                    )
                    check(
                        page.locator(".ice-cracks").evaluate(
                            "e=>Number(getComputedStyle(e).opacity)"
                        )
                        > 0,
                        f"{width}-{name}: 氷裂表示",
                    )
                image(page, f"{name}-{width}-{'reduced' if reduced else 'motion'}")
            page.close()


def main():
    OUT.mkdir(exist_ok=True)
    files = list((ROOT / "products/word-guild/assets/walk-v9").glob("*"))
    for p in files:
        kind = "frames" if p.suffix == ".webp" else "freeze"
        original = ROOT / "atelier-assets/illustrator/walk-freeze-v9" / kind / p.name
        check(p.read_bytes() == original.read_bytes(), f"受領素材の一致: {p.name}")
    manifest = json.loads(
        (ROOT / "products/word-guild/assets/voice/manifest.json").read_text(encoding="utf-8")
    )
    check(manifest["cast"]["guide"]["model"] == "jvnv-F2-jp", "しるべの女性F2・主人公F1と区別")
    result = {"passed": False, "checks": CHECKS, "observations": OBSERVATIONS, "images": IMAGES}
    try:
        with BrowserServer(ROOT) as server, sync_playwright() as pw:
            options = {} if Path(pw.chromium.executable_path).is_file() else {"channel": "chrome"}
            browser = pw.chromium.launch(headless=True, **options)
            base = server.url + "/products/word-guild/index.html"
            for mode in ["normal", "muted", "failed"]:
                play_flow(browser, base, mode)
            walking_and_scenes(browser, base)
            browser.close()
        result["passed"] = True
        print(
            f"PASS: {len(CHECKS)} story/walk/freeze/real-audio assertions; "
            f"{len(IMAGES)} screenshots"
        )
    except Exception as error:
        result["error"] = str(error)
        raise
    finally:
        result["sources"] = {
            str(p.relative_to(ROOT)): hashlib.sha256(p.read_bytes()).hexdigest()
            for p in (ROOT / "products/word-guild").glob("*.mjs")
        }
        (OUT / "results.json").write_text(
            json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8"
        )


if __name__ == "__main__":
    main()
