"""独立した実ブラウザー検査。pytestとは分離。HTTPサーバーは終了時に閉じる。"""

import json
import subprocess
import sys
from http.server import SimpleHTTPRequestHandler
from pathlib import Path

from browser_probe import DIAGNOSTICS, capture, cut_render, event, navigate, phase, prepare
from browser_server import BrowserServer
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "quality/screenshots"
OUT.mkdir(parents=True, exist_ok=True)
results = []


class QuietHandler(SimpleHTTPRequestHandler):
    def log_message(self, *args):
        pass


def check(condition, message):
    assert condition, message
    results.append(message)


def state(page):
    return page.evaluate("window.wordGuildState")


def drag(page, path, release=True):
    boxes = [page.locator(f'[data-cell="{i}"]').bounding_box() for i in path]
    points = [(b["x"] + b["width"] / 2, b["y"] + b["height"] / 2) for b in boxes]
    page.mouse.move(*points[0])
    page.mouse.down()
    for x, y in points[1:]:
        page.mouse.move(x, y, steps=4)
    if release:
        page.mouse.up()
        if page.evaluate("!!window.qualityProbe"):
            return event(page)["after"]


def snap(page, name):
    # CSS画像も実デコードまで待つ。素材撮影だけの待機でゲーム時計は変更しない。
    page.evaluate(r"""async()=>{
        const nodes=document.querySelectorAll('.portrait,.flight-scene,.arena');
        const urls=Array.from(nodes,e=>getComputedStyle(e).backgroundImage)
            .flatMap(s=>Array.from(s.matchAll(/url\(["']?([^"')]+)["']?\)/g),m=>m[1]));
        await Promise.all(urls.map(async url=>{
            const image=new Image();image.src=url;await image.decode();
        }));
        await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
    }""")
    page.screenshot(path=str(OUT / f"{name}.png"))


def touch_drag(page, path, cancel=False, release=True):
    session = page.context.new_cdp_session(page)
    boxes = [page.locator(f'[data-cell="{i}"]').bounding_box() for i in path]
    points = [{"x": b["x"] + b["width"] / 2, "y": b["y"] + b["height"] / 2, "id": 1} for b in boxes]
    session.send("Input.dispatchTouchEvent", {"type": "touchStart", "touchPoints": [points[0]]})
    for point in points[1:]:
        session.send("Input.dispatchTouchEvent", {"type": "touchMove", "touchPoints": [point]})
    if release:
        session.send(
            "Input.dispatchTouchEvent",
            {"type": "touchCancel" if cancel else "touchEnd", "touchPoints": []},
        )
        session.detach()
        if not cancel and page.evaluate("!!window.qualityProbe"):
            return event(page)["after"]
    else:
        return session


def fit(page, selectors):
    for selector in selectors:
        box = page.locator(selector).bounding_box()
        viewport = page.viewport_size
        check(
            box is not None
            and box["x"] >= 0
            and box["y"] >= 0
            and box["x"] + box["width"] <= viewport["width"] + 1
            and box["y"] + box["height"] <= viewport["height"] + 1,
            f"{viewport}: {selector} が画面内",
        )
    check(
        page.evaluate("document.documentElement.scrollWidth <= innerWidth"), "横方向のはみ出しなし"
    )
    if page.locator(".enemy-motion .portrait").count():
        # PNGフレームの表示領域を正方形に保ち、細部と透明余白を確認する。
        rect = page.locator(".enemy-motion .portrait").evaluate(
            "(el)=>({w:el.offsetWidth,h:el.offsetHeight})"
        )
        check(abs(rect["w"] - rect["h"]) <= 1, "敵の表情フレームは正方形で欠けない")


def run(base):
    with sync_playwright() as p:
        options = {} if Path(p.chromium.executable_path).is_file() else {"channel": "chrome"}
        browser = p.chromium.launch(headless=True, **options)
        errors = []
        for width, height in [(390, 844), (320, 568), (1280, 900)]:
            page = browser.new_page(
                viewport={"width": width, "height": height}, device_scale_factor=1
            )
            prepare(page)
            page.on("pageerror", lambda e: errors.append(str(e)))
            navigate(page, base)
            check(
                page.locator(".guild-art").evaluate("(el)=>el.complete && el.naturalWidth>500"),
                "受領v4ギルドPNG読込",
            )
            fit(page, ["#start", ".guild-scene", ".guide"])
            snap(page, f"home-{width}")
            page.click("#start")
            page.click('[data-hero="female"]')
            page.click('[data-ally="water"]')
            page.wait_for_function(
                'wordGuildState.music.playing && wordGuildState.music.scene==="top"'
            )
            check(
                state(page)["music"]["playing"], "開始タップから無料音源をデコードしてトップ曲再生"
            )
            check(
                page.locator('[data-hero="female"]').get_attribute("aria-pressed") == "true",
                "女性カードの選択反応",
            )
            check(
                page.locator('[data-ally="water"]').get_attribute("aria-pressed") == "true",
                "水カードの選択反応",
            )
            fit(page, ["#depart", ".heroes", ".allies"])
            snap(page, f"select-{width}")
            page.click("#depart")
            page.wait_for_function(
                'wordGuildState.music.playing && wordGuildState.music.scene==="battle"'
            )
            check(state(page)["music"]["scene"] == "battle", "戦闘曲への実切替")
            page.click("#music")
            check(not state(page)["music"]["playing"], "音楽停止ボタンの実操作")
            page.click("#music")
            page.wait_for_function("wordGuildState.music.playing")
            check(state(page)["music"]["playing"], "音楽再開ボタンの実操作")
            check(
                event(page, "click", "depart")["after"]["hp"] == 100
                and event(page, "click", "depart")["after"]["hero"] == "female"
                and event(page, "click", "depart")["after"]["ally"] == "water",
                "選択反映・HP100",
            )
            check(page.locator("[data-cell]").count() == 42, "42マス表示")
            fit(
                page,
                ["#board", '[data-cell="0"]', '[data-cell="41"]', ".arena", ".guide", "#hpbar"],
            )
            check(
                page.locator("#board").evaluate("(el)=>getComputedStyle(el).touchAction") == "none",
                "盤面touch-action:none",
            )
            snap(page, f"cat-{width}")
            drag(page, [8, 9, 10, 11, 10], False)
            check(state(page)["input"] == "CAT", "実Pointer EventsでCAT余分入力から一歩戻し")
            page.mouse.up()
            released = event(page)
            check(
                released["before"]["state"] == "battle"
                and released["before"]["input"] == "CAT"
                and released["after"]["state"] == "defeated"
                and released["after"]["found"] == ["cat"],
                "離指でのみ正解",
            )
            drawn = cut_render(page, 0, released["before"]["at"])
            check(
                drawn["cuts"] == 1
                and drawn["state"] in ["defeated", "travel"]
                and drawn["cutDetails"][0]["texture"],
                "正解一語につき一本の溝",
            )
            snap(page, f"correct-{width}")
            travel = phase(page, 0, "travel")
            check(travel["cells"] == 42 and travel["road"], "移動中も42マスを保持")
            check(travel["boardDisabled"] == "true", "移動中は入力停止")
            snap(page, f"travel-{width}")
            arriving = phase(page, 1, "arriving")
            check(arriving["disabled"] == 42, "落下中全42マスの入力停止")
            page.wait_for_function(
                'wordGuildState.stage === 1 && wordGuildState.state === "battle"'
            )
            check(page.evaluate("scrollX===0 && scrollY===0"), "なぞり操作後もページ位置固定")
            snap(page, f"dog-{width}")
            if width == 390:
                # チートのない通常URLで、全ルートを盤面から解く。
                check(
                    page.evaluate("window.wordGuildDev === undefined"),
                    "通常URLに操作用デバッグAPIなし",
                )
                wrong = drag(page, [0])
                wrong_event = event(page)
                check(
                    wrong["state"] == "battle" and wrong["hp"] == wrong_event["before"]["hp"],
                    "誤答はHP不変、再試行可能",
                )
                check(
                    "wrong" in wrong["viewClass"],
                    "誤答に困り顔の反応",
                )
                # pointercancelはDOMイベント経路で検証。
                drag(page, [5, 12], False)
                page.locator("#board").dispatch_event("pointercancel", {"pointerId": 1})
                page.mouse.up()
                check(
                    state(page)["input"] == "" and state(page)["state"] == "battle",
                    "DOM pointercancelで判定せず破棄",
                )
                for stage, path in [(1, [5, 12, 19]), (2, [24, 25, 26]), (3, [29, 30, 37])]:
                    answered = drag(page, path)
                    check(answered["state"] == "defeated", f"第{stage + 1}階層の実入力で正解")
                    page.wait_for_function(
                        '(stage)=>wordGuildState.stage===stage && wordGuildState.state==="battle"',
                        arg=stage + 1,
                    )
                    snap(page, f"floor-{stage + 1}-390")
                questions = page.evaluate(
                    "async()=> (await import('./question-data.mjs')).BOSS_QUESTIONS"
                )
                animal = questions["4"]
                final = questions["5"]
                drag(page, animal[0]["path"])
                check(state(page)["found"] == [animal[0]["answer"]], "animalで初歩語1語目")
                drag(page, animal[0]["path"])
                check(state(page)["found"] == [animal[0]["answer"]], "animal重複で進捗不変")
                check(page.locator("#claws .claw-cut").count() == 1, "重複で切り傷を追加しない")
                drag(page, animal[1]["path"])
                page.wait_for_function(
                    'wordGuildState.stage===5 && wordGuildState.state==="battle"'
                )
                snap(page, "final-390")
                drag(page, final[0]["path"])
                check(state(page)["found"] == [final[0]["answer"]], "裏ボスも専門語入力可能")
                answered = drag(page, final[1]["path"])
                check(answered["state"] == "loss" and answered["hp"] == 0, "裏ボス2語で直ちに即死")
                snap(page, "counter-390")
                page.wait_for_function('wordGuildState.state==="loss"')
                check(state(page)["hp"] == 0, "大技でHP0")
                fit(page, ["#return", "#board", '[data-cell="41"]'])
                snap(page, "loss-390")
                page.click("#return")
                for flight_phase in ["launch", "fall", "land"]:
                    page.wait_for_function(
                        "name=>qualityProbe.transitions.some(s=>s.state===name)", arg=flight_phase
                    )
                    snap(page, f"{flight_phase}-390")
                page.wait_for_selector("#start")
                check(state(page)["complete"], "帰還で完了状態を保存")
                check("大変だったね" in page.locator(".bubble").inner_text(), "帰還会話")
                snap(page, "return-390")
                capture(page)
                page.reload(wait_until="networkidle")
                page.wait_for_function("window.wordGuildState?.screen === 'home'")
                check(
                    state(page)["screen"] == "home"
                    and state(page)["complete"]
                    and state(page)["hero"] == "female"
                    and state(page)["ally"] == "water",
                    "通常URL再読み込みでキャラと完了状態復元",
                )
                check(
                    page.evaluate(
                        "Object.isFrozen(wordGuildState) && Object.isFrozen(wordGuildState.board) "
                        '&& Object.getOwnPropertyDescriptor(window,"wordGuildState")'
                        ".set===undefined"
                    ),
                    "状態情報は凍結・setterなし",
                )
            capture(page)
            page.close()
        # 明示的な開発URLに隔離した再現シーンと時計、被弾/回復の見た目。
        page = browser.new_page(viewport={"width": 390, "height": 844})
        prepare(page)
        page.on("pageerror", lambda e: errors.append(str(e)))
        navigate(page, base + "?dev=1&scene=cat")
        damaged = page.evaluate(
            "(()=>{wordGuildDev.advance(10000);"
            "return document.querySelectorAll('.float-number.damage').length})()"
        )
        check(damaged > 0, "被弾の赤い浮遊数字")
        snap(page, "damage-390")
        healed = page.evaluate(
            "(()=>{wordGuildDev.advance(20000);"
            "return document.querySelectorAll('.float-number.heal').length})()"
        )
        check(healed > 0, "回復の緑の浮遊数字")
        snap(page, "heal-390")
        timed = page.evaluate(
            '(()=>{wordGuildDev.load("final");wordGuildDev.advance(10000);'
            "return wordGuildState.state})()"
        )
        check(timed == "loss", "実画面でも10秒経過で即死")
        page.wait_for_function('wordGuildState.state==="loss"')
        page.evaluate("wordGuildDev.advance(600000)")
        check(state(page)["hp"] == 0, "敗北後は時計を進めても回復しない")
        check(
            page.evaluate('localStorage.getItem("word-guild-v1")===null'),
            "開発シーンは通常の保存領域に書かない",
        )
        page.emulate_media(reduced_motion="reduce")
        page.evaluate('wordGuildDev.load("sun")')
        check(
            page.locator(".enemy-motion").evaluate("(el)=>getComputedStyle(el).animationName")
            == "none",
            "動きを減らす設定で待機アニメ停止",
        )
        snap(page, "reduced-motion-390")
        for name in ["home", "select", "animal", "final", "loss", "return"]:
            navigate(page, base + f"?dev=1&scene={name}")
            candidates_ok = True
            if name in ["animal", "final"]:
                stage = "4" if name == "animal" else "5"
                candidates = page.evaluate(
                    "async stage=>(await import('./question-data.mjs')).BOSS_QUESTIONS[stage]",
                    stage,
                )
                for candidate in candidates:
                    page.evaluate("name=>wordGuildDev.load(name)", name)
                    guide = page.locator(".bubble").inner_text()
                    if name == "final":
                        problem = page.locator("#view").inner_text()
                        candidates_ok &= page.locator(".enemy-questions").count() == 0
                        candidates_ok &= all(q["clue"] not in problem for q in candidates)
                    else:
                        problem = page.locator(".bubble").inner_text()
                        candidates_ok &= all(q["clue"] in problem for q in candidates)
                    # 最新脚本は通常ボスの復習語を声と字幕で案内する。
                    # 乱入へ専門語の綴りや説明を漏らさない条件は維持する。
                    if name == "final":
                        candidates_ok &= all(q["answer"] not in guide.lower() for q in candidates)
                    drag(page, candidate["path"])
                    candidates_ok &= state(page)["found"] == [candidate["answer"]]
            check(
                page.locator("#dev-state").count() == 1 and candidates_ok,
                f"{name}再現シーンとreadonly状態表示"
                + ("・専門語全3候補の実入力と綴り非表示" if name in ["animal", "final"] else ""),
            )
        page.emulate_media(reduced_motion="no-preference")
        page.evaluate('wordGuildDev.load("animal");wordGuildDev.advance(15000)')
        check(state(page)["hintPath"] == [8, 9, 10], "15秒で通常ボス未発見CATの経路を提示")
        check(page.locator(".hint-glow").count() == 1, "一度に一マスを順に発光")
        snap(page, "hint-390")
        drag(page, [8, 9, 10])
        check(state(page)["hintPath"] == [], "正解でヒント計時をリセット")
        page.evaluate("wordGuildDev.advance(15000)")
        check(state(page)["hintPath"] == [5, 12, 19], "次は未発見DOGを提示")
        drag(page, [8, 9, 10])
        check(state(page)["hintPath"] == [5, 12, 19], "重複回答ではヒントをリセットしない")
        page.evaluate('wordGuildDev.load("final")')
        check(
            page.locator("#hint").inner_text() == "ええっ…！"
            and page.evaluate("wordGuildState.dialogue.current.speaker === 'guide'"),
            "乱入のしるべは驚きの一言のみ",
        )
        page.wait_for_function(
            "getComputedStyle(document.querySelector('.guide .portrait'))"
            ".backgroundImage.includes('guide-action-2-display-v8.webp')"
        )
        check(
            "guide-action-2-display-v8.webp"
            in page.locator(".guide .portrait").evaluate("e=>getComputedStyle(e).backgroundImage"),
            "乱入の驚き姿",
        )
        check(
            page.locator("#input").inner_text() == ""
            and state(page)["hintPath"] == [0, 1, 2, 3, 4, 5, 6, 13, 12, 11]
            and page.locator(".hint-glow").count() == 1,
            "乱入は文章助言なしで開始時から盤面発光",
        )
        page.wait_for_function('wordGuildState.state === "loss"', timeout=12000)
        check(
            10000 <= state(page)["elapsed"] <= 10000 and state(page)["hp"] == 0,
            "実時間の入力開始10秒でHP0、予告時間追加なし",
        )
        # 最小画面のボスと敗北画面も独立して確認。
        page.set_viewport_size({"width": 320, "height": 568})
        for name in ["animal", "final", "loss"]:
            navigate(page, base + f"?dev=1&scene={name}")
            fit(
                page,
                ["#board", '[data-cell="41"]', ".arena", ".guide", "#hpbar"]
                + (["#return"] if name == "loss" else []),
            )
            snap(page, f"{name}-320")
        check(not errors, f"ブラウザーJS例外なし: {errors}")
        capture(page)
        page.close()
        touch = browser.new_page(
            viewport={"width": 320, "height": 568}, has_touch=True, is_mobile=True
        )
        prepare(touch)
        touch.on("pageerror", lambda e: errors.append(str(e)))
        navigate(touch, base + "?dev=1&scene=cat")
        touch_drag(touch, [8, 9], cancel=True)
        check(
            state(touch)["input"] == "" and state(touch)["state"] == "battle",
            "Chromium実タッチのキャンセルで破棄",
        )
        s = touch_drag(touch, [8, 8, 16, 41, 9, 16, 15, 8], release=False)
        check(
            state(touch)["input"] == "CASSC",
            "実タッチの滞留・斜め・非隣接は追加せず、四方向と再訪は追加",
        )
        # 開始したタッチは同じCDP入力系統から解放する。
        s.send("Input.dispatchTouchEvent", {"type": "touchCancel", "touchPoints": []})
        s.detach()
        answered = touch_drag(touch, [8, 9, 10, 11, 10])
        check(answered["state"] == "defeated", "実タッチでも一歩戻し後のCAT正解")
        check(
            touch.evaluate("scrollX===0 && scrollY===0"),
            "実タッチで上下左右に動かしてもスクロールなし",
        )
        snap(touch, "touch-correct-320")
        capture(touch)
        touch.close()
        # 12原画×4表情を一枚で目視できる証拠。ゲームのスクリーンショットとは別。
        atlas = browser.new_page(viewport={"width": 740, "height": 850})
        chars = {
            "male": "リオ／男性",
            "female": "ミナ／女性",
            "fire": "ほむら／炎",
            "water": "しずく／水",
            "grass": "こもれび／草",
            "guide": "案内係しるべ",
            "cat": "猫",
            "dog": "犬",
            "sun": "太陽",
            "ant": "アリ",
            "animal": "けものの番人",
            "final": "ことば喰い",
        }
        url = base.rsplit("/", 1)[0]
        atlas.set_content(
            '<html lang="ja"><body style="margin:0;padding:16px;background:#173e40;'
            'color:#fff3d6;font:13px system-ui"><h2>'
            "キャラクター原画：待機 / 瞬き / 喜び / 困り</h2>"
            '<section style="display:grid;grid-template-columns:1fr 1fr;gap:12px">'
            + "".join(
                '<div style="height:112px;border-top:1px solid #688274;padding:6px">'
                f'<div style="margin-bottom:6px">{label}</div>'
                + "".join(
                    '<img style="image-rendering:pixelated;width:80px;height:80px;'
                    'object-fit:contain" '
                    f'src="{url}/assets/{name}-{expression}-display-v8.webp" '
                    f'alt="{label} {expression}">'
                    for expression in ["idle", "blink", "joy", "worried"]
                )
                + "</div>"
                for name, label in chars.items()
            )
            + "</section></body></html>"
        )
        atlas.wait_for_function(
            "Array.from(document.images).every(img=>img.complete && img.naturalWidth>0)"
        )
        snap(atlas, "character-atlas")
        atlas.close()
        check(not errors, f"実タッチを含むJS例外なし: {errors}")
        browser.close()


if __name__ == "__main__":
    server = BrowserServer(ROOT)
    result = {"passed": False, "checks": results, "diagnostics": DIAGNOSTICS}
    try:
        with server:
            run(server.url + "/products/word-guild/index.html")
            server.assert_running()
        final_hint = subprocess.run(
            [sys.executable, "quality/integration-v8/check_final_hint.py"],
            cwd=ROOT,
            capture_output=True,
            text=True,
            encoding="utf-8",
            errors="replace",
            timeout=60,
        )
        result["final_hint"] = {
            "passed": final_hint.returncode == 0,
            "stdout": final_hint.stdout,
            "stderr": final_hint.stderr,
        }
        check(final_hint.returncode == 0, "乱入の即時ヒントと実操作39項目を子検査から伝播")
        result.update(passed=True, engine="Chromium headless (Python Playwright)")
        print(
            f"PASS: {len(results)} assertions / 3 viewport sizes / full real-pointer tutorial flow"
        )
    except Exception as e:
        result["error"] = str(e)
        raise
    finally:
        result["server"] = server.snapshot()
        (ROOT / "quality/browser-results.json").write_text(
            json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8"
        )
