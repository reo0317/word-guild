"""受領した生成素材の保持と、本番のフレーム切替・帰還姿の接続を確認。"""

import hashlib
import json
import subprocess
import sys
from pathlib import Path

from browser_server import BrowserServer
from check_word_guild_browser import drag, snap
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
checks = []


def check(value, label):
    assert value, label
    checks.append(label)


def run(base):
    baseline = json.loads((ROOT / "quality/v4-integration-before.json").read_text(encoding="utf-8"))
    for file, digest in baseline.items():
        if not file.startswith("products/word-guild/assets/"):
            continue
        check(
            hashlib.sha256((ROOT / file).read_bytes()).hexdigest() == digest,
            f"受領素材保持: {file}",
        )
    current = json.loads(
        (ROOT / "quality/characters-v8/asset-records.json").read_text(encoding="utf-8")
    )
    check(len(current) == 12, "新しい12キャラの受領対応表")
    check(sum(len(r["frames"]) for r in current.values()) == 78, "新しい78姿の受領対応表")
    for name, record in current.items():
        check(
            hashlib.sha256((ROOT / record["file"]).read_bytes()).hexdigest() == record["sha256"],
            f"v8原画保持: {name}",
        )
        for frame in record["frames"]:
            for key, digest in [("file", "sha256"), ("display", "webp_sha256")]:
                check(
                    hashlib.sha256((ROOT / frame[key]).read_bytes()).hexdigest() == frame[digest],
                    f"v8受領保持: {frame[key]}",
                )
    with sync_playwright() as p:
        options = {} if Path(p.chromium.executable_path).is_file() else {"channel": "chrome"}
        browser = p.chromium.launch(headless=True, **options)
        page = browser.new_page(viewport={"width": 390, "height": 844})
        errors = []
        page.on("pageerror", lambda e: errors.append(str(e)))
        page.goto(base + "?dev=1&scene=cat", wait_until="networkidle")
        # 展示ではなく本番のbattle状態で、撃破フレームが周期に混ざらないことを検査。
        paths = page.evaluate("async()=>(await import('./core.mjs')).PATHS")
        enemies = ["cat", "dog", "sun", "ant", "animal"]
        for width, height in [(390, 844), (320, 568), (1280, 900)]:
            page.set_viewport_size({"width": width, "height": height})
            for stage, name in enumerate(enemies):
                page.evaluate(
                    "async name=>{const {loadSprite}=await import('./sprites.mjs'"
                    ");await loadSprite(name);}",
                    name,
                )
                page.evaluate("name=>wordGuildDev.load(name)", name)
                portrait = page.locator(".enemy-motion .portrait")
                keyframes = portrait.evaluate(
                    "e=>e.getAnimations().flatMap(a=>a.effect.getKeyframes())"
                )
                check(
                    keyframes and all("action-2" not in str(frame) for frame in keyframes),
                    f"{width}/{name}: 戦闘待機の全キーフレームに撃破姿なし",
                )
                for time, pose in [
                    (0, "idle"),
                    (3050, "action-1"),
                    (3350, "idle"),
                    (4750, "blink"),
                ]:
                    actual = portrait.evaluate(
                        """(e,time)=>{
                            e.getAnimations().forEach(a=>{a.pause();a.currentTime=time;});
                            return getComputedStyle(e).backgroundImage;
                        }""",
                        time,
                    )
                    check(
                        f"{name}-{pose}-display-v8.webp" in actual
                        and page.evaluate("wordGuildState.state==='battle'"),
                        f"{width}/{name}: 未回答の{time}msは{pose}",
                    )
                # レビューで撃破姿が再現した3350msの表示を保存する。
                portrait.evaluate("e=>e.getAnimations().forEach(a=>a.currentTime=3350)")
                snap(page, f"enemy-waiting-{name}-{width}")
                answers = list(paths[stage].values())
                if name == "animal":
                    drag(page, answers[0])
                page.locator("#board").evaluate("""e=>e.addEventListener('pointerup',()=>{
                    window.qualityEnemyDefeat={state:wordGuildState.state,
                        image:getComputedStyle(document.querySelector('.enemy-motion .portrait'))
                            .backgroundImage};
                },{once:true})""")
                drag(page, answers[1] if name == "animal" else answers[0])
                result = page.evaluate("window.qualityEnemyDefeat")
                check(
                    result["state"] == "defeated"
                    and f"{name}-action-2-display-v8.webp" in result["image"],
                    f"{width}/{name}: 実正解でのみ撃破姿へ切替",
                )
                snap(page, f"enemy-defeated-{name}-{width}")
        page.set_viewport_size({"width": 390, "height": 844})
        page.evaluate('wordGuildDev.load("cat")')
        # 本番のsprite関数とCSSを使う独立展示。ゲームの状態変更や通常URLへのチートは不要。
        page.evaluate("""async()=>{
            const {CHARACTERS,sprite,loadSprite}=await import('./sprites.mjs');
            await Promise.all(CHARACTERS.map(n=>loadSprite(n)));
            document.querySelector('#view').innerHTML=CHARACTERS.map(n=>sprite(n,80)).join('');
        }""")
        for character in page.locator(".character").all():
            name = character.get_attribute("data-character")
            portrait = character.locator(".portrait")
            for pose, time in [
                ("idle", 0),
                ("action-1", 3050),
                ("action-2", 3350),
                ("blink", 4750),
            ]:
                if name in enemies and pose == "action-2":
                    pose = "idle"  # 撃破姿は上の実戦闘の正解後検査で確認済み。
                actual = portrait.evaluate(
                    """(e,time)=>{
                        e.style.animationDelay='0s';
                        e.getAnimations().forEach(a=>{a.pause();a.currentTime=time;});
                        return getComputedStyle(e).backgroundImage;
                    }""",
                    time,
                )
                check(f"{name}-{pose}-display-v8.webp" in actual, f"{name}: 本番CSSで{pose}へ切替")
            for pose in ["joy", "worried"]:
                actual = portrait.evaluate(
                    """async(e,pose)=>{
                        e.style.animation='none';e.style.backgroundImage=`var(--${pose})`;
                        const url=getComputedStyle(e).backgroundImage;
                        const image=new Image();image.src=url.slice(5,-2);await image.decode();
                        return {url,square:image.naturalWidth===image.naturalHeight};
                    }""",
                    pose,
                )
                check(
                    f"{name}-{pose}-display-v8.webp" in actual["url"] and actual["square"],
                    f"{name}: {pose}個別PNG読込と正方形表示",
                )
        # 男女それぞれの帰還三姿を本番関数で表示し、全78フレームの参照を確認。
        for hero in ["male", "female"]:
            for pose in ["launch", "fall", "land"]:
                page.evaluate(
                    """async({hero,pose})=>{
                        const {sprite,loadSprite}=await import('./sprites.mjs');
                        await loadSprite(hero,[pose]);
                        document.querySelector('#view').innerHTML=sprite(`${hero}-${pose}`,160);
                    }""",
                    dict(hero=hero, pose=pose),
                )
                check(
                    page.locator(".portrait")
                    .evaluate("e=>getComputedStyle(e).backgroundImage")
                    .endswith(f'{hero}-{pose}-display-v8.webp")'),
                    f"{hero}: 帰還{pose}は新PNG",
                )
        # 実操作による表情。上の展示検査とは別に、本番ゲームの反応を検査。
        page.evaluate('wordGuildDev.load("select")')
        page.click('[data-hero="female"]')
        check(
            "female-joy-display-v8.webp"
            in page.locator('[data-hero="female"] .portrait').evaluate(
                "e=>getComputedStyle(e).backgroundImage"
            ),
            "カード選択は喜び顔へ即時反応",
        )
        page.click("#depart")
        page.locator("#board").evaluate("""e=>{
            window.qualityWrongBefore=wordGuildState;
            e.addEventListener('pointerup',()=>{
                window.qualityWrongAfter=wordGuildState;
            },{once:true});
        }""")
        drag(page, [0])
        check(
            page.evaluate("""()=>{
                const a=qualityWrongBefore,b=qualityWrongAfter;
                return a.dialogue.current.playbackId===b.dialogue.current.playbackId
                    && a.hp===b.hp && b.dialogue.queue.some(l=>l.event==='answer.wrong');
            }"""),
            "誤答は無傷で現在の発話を継続し、励ましを予約する",
        )
        # 同じ離指イベント内で表情を読む。別のブラウザー検査の負荷で
        # 短い成功演出の終了後に確認してしまう競合を避ける。
        page.locator("#board").evaluate("""e=>e.addEventListener('pointerup',()=>{
            window.qualityCorrectPortrait=getComputedStyle(
                document.querySelector('.party .art-female .portrait')).backgroundImage;
        },{once:true})""")
        drag(page, [8, 9, 10])
        check(
            "female-joy-display-v8.webp" in page.evaluate("window.qualityCorrectPortrait"),
            "正解は選んだ主人公の新しい喜び顔",
        )
        healing = page.evaluate("""()=>{
            wordGuildDev.load('cat');const before=wordGuildState.dialogue.current;
            wordGuildDev.advance(30000);
            return {before,after:wordGuildState.dialogue.current,
                filter:getComputedStyle(document.querySelector('.guide .portrait')).filter,
                healing:document.querySelector('.guide').classList.contains('healing')};
        }""")
        check(
            healing["healing"]
            and "drop-shadow" in healing["filter"]
            and healing["before"]["playbackId"] == healing["after"]["playbackId"],
            "回復は緑の演出を保ち、会話の発話と表情を割り込ませない",
        )
        page.emulate_media(reduced_motion="reduce")
        for scene in ["home", "cat", "final"]:
            page.evaluate("scene=>wordGuildDev.load(scene)", scene)
            check(
                page.locator(".portrait").evaluate_all(
                    "els=>els.every(e=>getComputedStyle(e).animationName==='none')"
                ),
                f"{scene}: reduced-motionで全フレームの自動切替停止",
            )
        page.emulate_media(reduced_motion="no-preference")
        for scene in ["launch", "fall", "land"]:
            observed = page.evaluate(
                """scene=>{
                wordGuildDev.load(scene);
                return {state:wordGuildState.state,image:getComputedStyle(
                    document.querySelector('.traveler .portrait')).backgroundImage};
            }""",
                scene,
            )
            check(
                observed["state"] == scene and f"male-{scene}-display-v8.webp" in observed["image"],
                f"本番帰還シーン{scene}に男性の新しい姿",
            )
            snap(page, f"v4-male-{scene}-390")
        for width, height in [(390, 844), (320, 568), (1280, 900)]:
            page.set_viewport_size({"width": width, "height": height})
            for stage, scene in enumerate(["cat", "dog", "sun", "ant", "animal", "final"]):
                initial = page.evaluate(
                    """scene=>{wordGuildDev.load(scene);return {
                    elapsed:wordGuildState.elapsed,hint:[...wordGuildState.hintPath],
                    glow:document.querySelectorAll('#board .hint-glow').length};}""",
                    scene,
                )
                background = page.locator(".arena").evaluate(
                    "e=>getComputedStyle(e).backgroundImage"
                )
                check(
                    f"floor-{stage}-display-v6.webp" in background,
                    f"{width}/{scene}: 固有のv4階層背景",
                )
                if scene == "final":
                    snap(page, f"final-{width}")
                    check(
                        page.locator(".enemy-questions").count() == 0,
                        f"{width}: 乱入右側の詳細説明なし",
                    )
                    check(
                        initial["elapsed"] == 0 and initial["hint"] and initial["glow"] == 1,
                        f"{width}: 乱入戦闘開始から未発見語の一文字が発光",
                    )
                    check(
                        page.locator("#hint").inner_text() == "ええっ…！"
                        and page.evaluate("wordGuildState.dialogue.current.speaker === 'guide'"),
                        f"{width}: しるべ驚きのみ",
                    )
            for scene, part, age in [
                ("launch", "exit", 100),
                ("launch", "road", 850),
                ("fall", "approach", 0),
                ("land", "land", 0),
            ]:
                background = page.evaluate(
                    """({scene,age})=>{
                    wordGuildDev.load(scene);
                    const e=document.querySelector('.flight-scene');
                    if(scene==='launch')e.getAnimations().forEach(a=>{a.pause();a.currentTime=age;});
                    return getComputedStyle(e).backgroundImage;
                }""",
                    {"scene": scene, "age": age},
                )
                check(f"return-{part}-display-v6.webp" in background, f"{width}: 帰還{part}の景色")
                snap(page, f"v4-return-{part}-{width}")
            page.emulate_media(reduced_motion="reduce")
            for scene, part in [("launch", "exit"), ("fall", "approach"), ("land", "land")]:
                page.evaluate("scene=>wordGuildDev.load(scene)", scene)
                background = page.locator(".flight-scene").evaluate(
                    "e=>getComputedStyle(e).backgroundImage"
                )
                check(
                    f"return-{part}-display-v6.webp" in background,
                    f"{width}: 動きを減らしても帰還先が変わる",
                )
                snap(page, f"v4-reduced-{part}-{width}")
            page.emulate_media(reduced_motion="no-preference")
        check(not errors, f"生成素材統合JS例外なし: {errors}")
        browser.close()


if __name__ == "__main__":
    server = BrowserServer(ROOT)
    result = dict(passed=False, checks=checks)
    try:
        with server:
            run(server.url + "/products/word-guild/index.html")
            server.assert_running()
        # 8登録の枠内で人物・物語の独立検査も実行し、失敗を親へ伝播する。
        story = subprocess.run(
            [sys.executable, "quality/check_word_guild_story_characters.py"],
            cwd=ROOT,
            capture_output=True,
            text=True,
            encoding="utf-8",
            errors="replace",
            timeout=180,
        )
        result["story_characters"] = {
            "argv": ["python", "quality/check_word_guild_story_characters.py"],
            "passed": story.returncode == 0,
            "exit_code": story.returncode,
            "stdout": story.stdout,
            "stderr": story.stderr,
        }
        if story.stdout:
            print(story.stdout, end="")
        if story.stderr:
            print(story.stderr, end="", file=sys.stderr)
        check(story.returncode == 0, "人物・物語の独立検査を統合し失敗を伝播")
        result["passed"] = True
        print(f"PASS: {len(checks)} generated material integration assertions")
    except Exception as error:
        result["error"] = str(error)
        raise
    finally:
        (ROOT / "quality/integration-v3-results.json").write_text(
            json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8"
        )
