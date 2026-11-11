"""同梱AI音声と会話の実操作検査。fixture音声で製品の合格を代替しない。"""

import hashlib
import json
from pathlib import Path

from browser_probe import capture, event, navigate, prepare
from browser_server import BrowserServer
from check_word_guild_browser import drag
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "quality/dialogue-v1"
CHECKS = []
OBSERVATIONS = []
IMAGES = []

AUDIO_PROBE = """(() => {
 const Native=window.AudioContext || window.webkitAudioContext;
 const probe=window.qualityDialogueAudio={contexts:0,sources:[],clicks:[]};
 let clickBefore;
 document.addEventListener('click',e=>{
  clickBefore={target:e.target.closest?.('button')?.id,
   sources:structuredClone(probe.sources)};
 },true);
 document.addEventListener('click',()=>{
  probe.clicks.push({...clickBefore,after:structuredClone(probe.sources)});
 });
 window.qualityFailResumes=0;
 class ObservedContext extends Native {
  constructor(...args){super(...args);probe.contexts++;}
  resume(){if(window.qualityFailResumes>0){window.qualityFailResumes--;
   return Promise.reject(new Error('temporary resume failure'));}return super.resume();}
  createBufferSource(){
   const source=super.createBufferSource();
   const record={id:probe.sources.length+1,starts:0,stops:0,loop:false};
   probe.sources.push(record);
   const start=source.start.bind(source),stop=source.stop.bind(source);
   source.start=(...args)=>{Object.assign(record,{starts:record.starts+1,
    loop:source.loop,at:this.currentTime,args,
    voiceKey:window.wordGuildState?.dialogue?.current?.voiceKey});return start(...args);};
   source.stop=(...args)=>{record.stops++;return stop(...args);};
   return source;
  }
 }
 window.AudioContext=ObservedContext;
 if(window.webkitAudioContext)window.webkitAudioContext=ObservedContext;
})();"""


def check(condition, label):
    assert condition, label
    CHECKS.append(label)


def snapshot(page):
    return page.evaluate("wordGuildState")


def observe(page, label):
    value = page.evaluate(
        "({state:wordGuildState,audio:qualityDialogueAudio,at:performance.now()})"
    )
    OBSERVATIONS.append({"label": label, **value})
    return value


def new_page(browser, width=390, height=844):
    page = browser.new_page(viewport={"width": width, "height": height})
    diagnostic = prepare(page)
    page.add_init_script(AUDIO_PROBE)
    return page, diagnostic


def voice_playing(page, timeout=30000):
    page.wait_for_function("wordGuildState.voice?.state === 'playing'", timeout=timeout)
    return snapshot(page)


def screenshot(page, name):
    # 表情のdecodeは撮影時だけ待つ。操作や音声のタイマーは止めない。
    page.evaluate(r"""async()=>{
     const urls=Array.from(document.querySelectorAll('.portrait,.arena'),
       e=>getComputedStyle(e).backgroundImage).flatMap(s=>
       Array.from(s.matchAll(/url\(["']?([^"')]+)["']?\)/g),m=>m[1]));
     await Promise.all(urls.map(async u=>{const i=new Image();i.src=u;await i.decode();}));
    }""")
    file = OUT / f"{name}.png"
    page.screenshot(path=str(file))
    IMAGES.append(file.relative_to(ROOT).as_posix())


def speaker_frame(page, speaker):
    # 同じJS実行内で対象話者を確認して声ボタンを押す。
    # decode・撮影中の自然終了で字幕と肖像の観測時刻がずれない。
    page.wait_for_function(
        """speaker=>{
         const s=wordGuildState;
         if(s.dialogue.current?.speaker!==speaker || s.voice.state!=='playing'
            || s.voice.position<=.15)return false;
         document.querySelector('#voice').click();return true;
        }""",
        arg=speaker,
        timeout=15000,
    )
    selected = observe(page, f"{speaker}-selection-frame-paused")
    check(selected["state"]["voice"]["state"] == "paused", f"{speaker}: 撮影中の発話を保持")
    check(
        page.locator(f".speech-portrait [data-character={speaker}]").count() == 1
        and page.locator(".dialogue").get_attribute("data-speaker") == "other",
        f"{speaker}: 肖像と吹き出しの向きが対応",
    )
    check(
        selected["state"]["voice"]["voiceKey"].endswith(f".{speaker}"),
        f"{speaker}: 選択に声と字幕のキーが対応",
    )
    check(
        selected["state"]["dialogue"]["current"]["text"] in page.locator(".bubble").inner_text(),
        f"{speaker}: 音声の発話と画面字幕が一致",
    )
    screenshot(page, f"{speaker}-speaking-390")
    page.click("#voice")
    resumed = voice_playing(page)
    check(
        resumed["voice"]["id"] == selected["state"]["voice"]["id"]
        and resumed["voice"]["position"] >= selected["state"]["voice"]["position"],
        f"{speaker}: 撮影後に同じ発話を途中から再開",
    )


def fit(page, selectors, label):
    for selector in selectors:
        rect = page.locator(selector).first.bounding_box()
        size = page.viewport_size
        check(
            rect is not None
            and rect["x"] >= -1
            and rect["y"] >= -1
            and rect["x"] + rect["width"] <= size["width"] + 1
            and rect["y"] + rect["height"] <= size["height"] + 1,
            f"{label}: {selector}画面内",
        )
    check(page.evaluate("document.documentElement.scrollWidth<=innerWidth"), f"{label}: 横収まり")


def verify_assets():
    manifest = json.loads(
        (ROOT / "products/word-guild/assets/voice/manifest.json").read_text(encoding="utf-8")
    )
    check(len(manifest.get("files", {})) == 9, "本番は9話者WAVを同梱")
    check(len(manifest.get("lines", {})) == 50, "男女別を含む50音声キーを本番manifestへ収録")
    for role, record in manifest["files"].items():
        file = ROOT / "products/word-guild/assets/voice" / record["url"]
        check(file.is_file() and file.stat().st_size > 1000, f"{role}: 同梱音声の存在")
    return manifest


def normal_flow(browser, base):
    page, diagnostic = new_page(browser)
    navigate(page, base)
    page.click("#start")
    initial = voice_playing(page)
    check(initial["screen"] == "select", "盤面を開く前の選択画面で発話開始")
    check(initial["dialogue"]["current"]["speaker"] == "guide", "選択会話はしるべから開始")
    page.click('[data-hero="female"]')
    page.click('[data-ally="water"]')
    speaker_frame(page, "female")
    page.wait_for_function("wordGuildState.voice.position > .15")
    before = snapshot(page)
    page.click("#voice")
    paused = snapshot(page)
    check(paused["voice"]["state"] == "paused", "声ボタンで発話を停止")
    check(paused["music"]["playing"], "声を停止しても音楽は継続")
    page.wait_for_timeout(150)
    check(
        abs(snapshot(page)["voice"]["position"] - paused["voice"]["position"]) < 0.02,
        "停止中は声の位置を保つ",
    )
    page.click("#voice")
    resumed = voice_playing(page)
    check(resumed["voice"]["position"] >= before["voice"]["position"], "声再開は台詞途中の位置から")
    check(resumed["voice"]["voiceKey"] == before["voice"]["voiceKey"], "再開で台詞を替えない")
    # 旧判定が誤って中断とした「再開後、出発前の自然終了」を実音声で再現。
    page.wait_for_function(
        "id=>wordGuildState.voice.id!==id&&wordGuildState.voice.state==='playing'",
        arg=resumed["voice"]["id"],
        timeout=15000,
    )
    page.click("#depart")
    departure = event(page, "click", "depart")
    departed = departure["after"]
    check(
        departed["state"] == "battle" and departed["hp"] == 100,
        "発話終了を待たず出発して盤面を操作可能",
    )
    check(
        departure["before"]["voice"]["id"] != resumed["voice"]["id"],
        "出発前の自然終了を再現し、別時刻のIDを比較しない",
    )
    check(
        departed["voice"]["id"] == departure["before"]["voice"]["id"],
        "出発click内の前後で現在の発話を継続",
    )
    sources = page.evaluate("qualityDialogueAudio.clicks.findLast(e=>e.target==='depart')")
    voice_sources = [s for s in sources["sources"] if not s["loop"] and s["starts"]]
    source = voice_sources[-1]
    check(
        next(s for s in sources["after"] if s["id"] == source["id"]) == source
        and len([s for s in sources["after"] if not s["loop"] and s["starts"]])
        == len(voice_sources),
        "出発click内で声のSourceを停止・再開始・追加しない",
    )
    OBSERVATIONS.append({"label": "departure-same-click", "event": departure, "audio": sources})
    page.wait_for_function(
        "wordGuildState.music.playing && wordGuildState.music.track === 'breeze3'"
    )
    page.wait_for_timeout(100)
    music = page.evaluate("qualityDialogueAudio.sources.filter(s=>s.loop).at(-1)")
    music_position = snapshot(page)["music"]["position"]
    base_gain = page.evaluate("async()=> (await import('./music-cues.mjs')).MUSIC_CUES.battle.gain")
    check(snapshot(page)["music"].get("ducked") is True, "発話中はBGMをダッキング")
    check(snapshot(page)["music"]["gain"] < base_gain * 0.7, "発話中の実BGM Gain音量が下がる")
    wrong = drag(page, [0])
    check(wrong["hp"] == event(page)["before"]["hp"], "会話中の誤答は無傷")
    # 字幕が次の行へ自然に進む間、実ポインターを盤面上で保持する。
    drag(page, [8, 9], release=False)
    page.evaluate("window.qualityHeldBoard=document.querySelector('#board')")
    line = snapshot(page)["dialogue"]["current"]["playbackId"]
    page.wait_for_function(
        "id=>wordGuildState.dialogue.current?.playbackId !== id", arg=line, timeout=15000
    )
    held = snapshot(page)
    check(held["path"] == [8, 9] and held["input"] == "CA", "字幕の更新で入力経路を保持")
    check(
        page.evaluate("qualityHeldBoard===document.querySelector('#board')"),
        "会話通知は盤面DOMを作り直さない",
    )
    check(
        page.evaluate("qualityHeldBoard.hasPointerCapture(1)"),
        "会話通知は実ポインターキャプチャを保持",
    )
    box = page.locator('[data-cell="10"]').bounding_box()
    page.mouse.move(box["x"] + box["width"] / 2, box["y"] + box["height"] / 2, steps=3)
    page.mouse.up()
    answered = event(page)["after"]
    check(
        answered["state"] == "defeated" and answered["found"] == ["cat"],
        "会話中の実ポインターCAT撃破",
    )
    check(
        answered["voice"]["id"] == event(page)["before"]["voice"]["id"],
        "正解通知で台詞頭へ戻らない",
    )
    for stage, path in [(1, [5, 12, 19]), (2, [24, 25, 26]), (3, [29, 30, 37])]:
        page.wait_for_function(
            "s=>wordGuildState.stage===s&&wordGuildState.state==='battle'", arg=stage
        )
        queue = snapshot(page)["dialogue"]["queue"]
        check(
            all(
                item["carry"] or item["event"] == f"stage.{['cat', 'dog', 'sun', 'ant'][stage]}"
                for item in queue
            ),
            f"階層{stage + 1}: 未再生の古い操作説明を整理",
        )
        answered = drag(page, path)
        check(answered["state"] == "defeated", f"階層{stage + 1}: 会話中に実入力で攻略")
        current_music = page.evaluate("qualityDialogueAudio.sources.filter(s=>s.loop).at(-1)")
        check(
            current_music["id"] == music["id"] and current_music["stops"] == 0,
            f"階層{stage + 1}: ダッキングでもBGM Source継続",
        )
    check(
        snapshot(page)["music"]["position"] > music_position,
        "会話と通常階層移動中もBGM再生位置が進行",
    )
    page.wait_for_function("wordGuildState.stage===4&&wordGuildState.state==='battle'")
    drag(page, [8, 9, 10])
    drag(page, [8, 9, 10])
    check(snapshot(page)["found"] == ["cat"], "通常ボスの重複回答は進捗を増やさない")
    drag(page, [5, 12, 19])
    page.wait_for_function("wordGuildState.stage===5&&wordGuildState.state==='battle'")
    raid = snapshot(page)
    lines = [raid["dialogue"]["current"], *raid["dialogue"]["queue"]]
    check(
        all(line["event"] == "raid.enter" for line in lines if line),
        "乱入時に過去の説明を持ち越さない",
    )
    check(
        all(line["text"] == "ええっ…！" for line in lines if line and line["speaker"] == "guide"),
        "乱入のしるべは驚きだけ",
    )
    check(raid["hintPath"] and page.locator(".hint-glow").count() == 1, "乱入開始時から盤面が発光")
    page.wait_for_function("wordGuildState.state==='loss'", timeout=12000)
    lost = snapshot(page)
    check(lost["hp"] == 0 and lost["elapsed"] == 10000, "会話中も10秒で即死")
    check(not lost["music"]["playing"], "敗北時にBGM停止")
    check(
        all(
            line["event"] == "defeat"
            for line in [lost["dialogue"]["current"], *lost["dialogue"]["queue"]]
            if line
        ),
        "敗北で乱入会話を専用会話へ切替",
    )
    page.click("#return")
    for phase in ["launch", "fall", "land"]:
        page.wait_for_function("p=>qualityProbe.transitions.some(s=>s.state===p)", arg=phase)
    page.wait_for_function("wordGuildState.screen==='home'&&wordGuildState.complete")
    returned = observe(page, "guild-return")
    check(returned["state"]["dialogue"]["current"]["event"] == "guild.return", "帰還会話へ接続")
    check(
        returned["state"]["hero"] == "female" and returned["state"]["ally"] == "water",
        "選択と完了状態を保持",
    )
    check(
        page.evaluate("qualityDialogueAudio.contexts===1"),
        "音楽・声・飛行効果音のAudioContextを共有",
    )
    check(not diagnostic["pageerrors"], "通常攻略のJS例外なし")
    capture(page)
    page.close()


def male_and_visibility(browser, base):
    page, diagnostic = new_page(browser)
    navigate(page, base)
    page.click("#start")
    speaker_frame(page, "male")
    page.wait_for_function("wordGuildState.voice.position > .12")
    before = snapshot(page)
    page.evaluate(
        "Object.defineProperty(document,'hidden',{configurable:true,value:true});"
        "document.dispatchEvent(new Event('visibilitychange'))"
    )
    hidden = snapshot(page)
    check(
        hidden["voice"]["state"] == "paused" and not hidden["music"]["playing"],
        "visibilitychange接続で声とBGM停止",
    )
    page.wait_for_timeout(150)
    check(
        abs(snapshot(page)["voice"]["position"] - hidden["voice"]["position"]) < 0.02,
        "非表示扱い中に発話位置が進まない",
    )
    page.evaluate(
        "Object.defineProperty(document,'hidden',{configurable:true,value:false});"
        "document.dispatchEvent(new Event('visibilitychange'))"
    )
    after = voice_playing(page)
    check(
        after["voice"]["voiceKey"] == before["voice"]["voiceKey"]
        and after["voice"]["position"] >= before["voice"]["position"],
        "表示復帰は声の位置を引き継ぐ（イベント模擬）",
    )
    page.click("#music")
    check(
        not snapshot(page)["music"]["playing"] and snapshot(page)["voice"]["state"] == "playing",
        "音楽だけを停止しても発話継続",
    )
    check(not diagnostic["pageerrors"], "男性・停止復帰のJS例外なし")
    observe(page, "male-visibility")
    page.close()


def delayed_and_failure(browser, base):
    page, diagnostic = new_page(browser)
    held = []
    page.route("**/assets/voice/*.wav", lambda route: held.append(route))
    navigate(page, base)
    page.click("#start")
    page.wait_for_function("wordGuildState.voice.state==='loading'")
    for _ in range(200):
        if held:
            break
        page.wait_for_timeout(10)
    check(bool(held), "本番WAVの取得を実HTTPで保留")
    page.click("#voice")
    for route in held:
        route.continue_()
    page.unroute("**/assets/voice/*.wav")
    page.wait_for_timeout(200)
    check(snapshot(page)["voice"]["state"] == "paused", "停止後の遅延取得で声が復活しない")
    check(
        not page.evaluate("qualityDialogueAudio.sources.some(s=>!s.loop&&s.starts)"),
        "停止後の遅延WAVからSourceを開始しない",
    )
    page.click("#voice")
    voice_playing(page)
    check(True, "明示再開後は取得済みの本番WAVを再生")
    check(not diagnostic["pageerrors"], "遅延取得のJS例外なし")
    page.close()

    # 再開操作時のAudioContext失敗は、既に再生した台詞の途中位置を保持する。
    page, diagnostic = new_page(browser)
    navigate(page, base + "?dev=1&scene=cat")
    page.click("#voice")
    voice_playing(page)
    page.wait_for_function("wordGuildState.voice.position > .15")
    page.click("#voice")
    stopped = snapshot(page)
    page.evaluate("qualityFailResumes=2")
    page.click("#voice")
    page.wait_for_function("wordGuildState.voice.state==='error'")
    check(
        snapshot(page)["voice"]["position"] >= stopped["voice"]["position"],
        "一時AudioContext再開失敗でも台詞の途中位置を保持",
    )
    page.click("#voice")
    retried = voice_playing(page)
    check(
        retried["voice"]["voiceKey"] == stopped["voice"]["voiceKey"]
        and retried["voice"]["position"] >= stopped["voice"]["position"],
        "声のエラー再試行も台詞頭へ巻き戻さない",
    )
    check(not diagnostic["pageerrors"], "AudioContext再開失敗を字幕と操作へ伝播させない")
    observe(page, "resume-error-retained-position")
    page.close()

    page, diagnostic = new_page(browser)
    page.add_init_script(
        "Storage.prototype.setItem=function(){throw new DOMException("
        "'test quota','QuotaExceededError')}"
    )
    failing = {"voice": True}

    def voice_route(route):
        if failing["voice"]:
            route.fulfill(status=503, body="voice temporarily unavailable")
        else:
            route.continue_()

    page.route("**/assets/voice/*.wav", voice_route)
    page.route(
        "**/assets/music/*", lambda route: route.fulfill(status=503, body="music unavailable")
    )
    navigate(page, base)
    page.click("#start")
    page.wait_for_function("wordGuildState.errors.voice && wordGuildState.errors.music")
    page.click("#depart")
    failed = snapshot(page)
    check(
        failed["errors"]["save"] and failed["errors"]["voice"] and failed["errors"]["music"],
        "保存・声・音楽エラーを独立保持",
    )
    check(drag(page, [8, 9, 10])["state"] == "defeated", "音声失敗中も字幕と実パズルで攻略可能")
    failing["voice"] = False
    page.click("#voice")
    voice_playing(page)
    recovered = snapshot(page)
    check(not recovered["errors"]["voice"], "声の再試行で音声エラー復旧")
    check(
        recovered["errors"]["save"] and recovered["errors"]["music"],
        "声復旧で保存・音楽のエラーを消さない",
    )
    check(not diagnostic["pageerrors"], "意図した503・保存失敗でもJS例外なし")
    observe(page, "voice-retry-errors")
    page.close()


def layouts(browser, base):
    for width, height in [(390, 844), (320, 568), (1280, 900)]:
        page, diagnostic = new_page(browser, width, height)
        navigate(page, base + "?dev=1&scene=select")
        for motion in ["no-preference", "reduce"]:
            page.emulate_media(reduced_motion=motion)
            for scene in ["select", "cat", "animal", "final", "loss", "return"]:
                page.evaluate("s=>wordGuildDev.load(s)", scene)
                if scene == "loss":
                    check(
                        snapshot(page)["dialogue"]["current"] is None,
                        "敗北は無発話で飛行へ持ち越さず、HP説明は帰還後",
                    )
                else:
                    page.wait_for_function(
                        "wordGuildState.dialogue?.current || wordGuildState.screen==='home'"
                    )
                if scene in ["cat", "animal", "final", "loss"]:
                    fit(
                        page,
                        ["#board", '[data-cell="41"]', "#hpbar", ".guide", "#voice", "#music"]
                        + (["#return"] if scene == "loss" else []),
                        f"{width}/{motion}/{scene}",
                    )
                    check(
                        page.locator("[data-cell]").count() == 42,
                        f"{width}/{motion}/{scene}: 42マス保持",
                    )
                    check(
                        page.evaluate(
                            "document.querySelector('#hpbar').getBoundingClientRect().bottom <= "
                            "document.querySelector('#board').getBoundingClientRect().top + 1"
                        ),
                        f"{width}/{motion}/{scene}: HP盤面直上",
                    )
                    check(
                        page.evaluate(
                            "document.querySelector('.guide').getBoundingClientRect().top >= "
                            "document.querySelector('#board').getBoundingClientRect().bottom - 1"
                        ),
                        f"{width}/{motion}/{scene}: しるべ盤面下",
                    )
                elif scene == "select":
                    fit(
                        page,
                        ["#depart", "#back", ".guide", "[data-hero=female]", "[data-ally=grass]"],
                        f"{width}/{motion}/{scene}",
                    )
                else:
                    fit(page, ["#start", ".guide"], f"{width}/{motion}/{scene}")
                screenshot(page, f"{scene}-{width}-{motion}")
        check(not diagnostic["pageerrors"], f"{width}: レイアウト検査JS例外なし")
        check(
            page.evaluate(
                "Object.isFrozen(wordGuildState.dialogue)&&Object.isFrozen(wordGuildState.voice)"
            ),
            f"{width}: 会話と音声snapshotは凍結",
        )
        page.close()


def subtitle_input_and_hp(browser, base):
    """字幕通知とHP更新を実入力中に確認。音声未生成時も実行できる範囲。"""
    for width, height in [(390, 844), (320, 568), (1280, 900)]:
        page, diagnostic = new_page(browser, width, height)
        navigate(page, base + "?dev=1&scene=cat")
        page.wait_for_function("wordGuildState.dialogue?.current")
        drag(page, [8, 9], release=False)
        page.evaluate("window.qualityHeldBoard=document.querySelector('#board')")
        before = snapshot(page)
        page.evaluate("wordGuildDev.nextLine()")
        changed = snapshot(page)
        check(
            changed["dialogue"]["current"]["playbackId"]
            != before["dialogue"]["current"]["playbackId"],
            f"{width}: 明示確認URLで字幕行を再現",
        )
        check(changed["path"] == [8, 9], f"{width}: 字幕通知で実入力経路を保持")
        page.evaluate("wordGuildDev.advance(10000)")
        damaged = snapshot(page)
        check(damaged["hp"] < before["hp"], f"{width}: 実入力中も攻撃時計を実行")
        check(
            damaged["dialogue"]["current"]["playbackId"]
            == changed["dialogue"]["current"]["playbackId"],
            f"{width}: HP更新で発話行を戻さない",
        )
        check(
            damaged["path"] == [8, 9]
            and page.evaluate("qualityHeldBoard===document.querySelector('#board')")
            and page.evaluate("qualityHeldBoard.hasPointerCapture(1)"),
            f"{width}: HP更新で盤面DOM・実ポインター・経路を保持",
        )
        box = page.locator('[data-cell="10"]').bounding_box()
        page.mouse.move(box["x"] + box["width"] / 2, box["y"] + box["height"] / 2, steps=3)
        page.mouse.up()
        check(event(page)["after"]["state"] == "defeated", f"{width}: 更新後もCAT正解")
        check(page.evaluate("scrollX===0&&scrollY===0"), f"{width}: 実操作で画面固定")
        check(not diagnostic["pageerrors"], f"{width}: 字幕実操作JS例外なし")
        page.close()


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    result = {"passed": False, "checks": CHECKS, "observations": OBSERVATIONS, "images": IMAGES}
    try:
        manifest = verify_assets()
        result["manifest_sha256"] = hashlib.sha256(
            (ROOT / "products/word-guild/assets/voice/manifest.json").read_bytes()
        ).hexdigest()
        result["production_voice_keys"] = len(manifest["lines"])
        with BrowserServer(ROOT) as server, sync_playwright() as playwright:
            options = (
                {} if Path(playwright.chromium.executable_path).is_file() else {"channel": "chrome"}
            )
            browser = playwright.chromium.launch(headless=True, **options)
            base = server.url + "/products/word-guild/index.html"
            normal_flow(browser, base)
            male_and_visibility(browser, base)
            delayed_and_failure(browser, base)
            subtitle_input_and_hp(browser, base)
            layouts(browser, base)
            browser.close()
            server.assert_running()
        result.update(passed=True, engine="Chromium / real pointer and bundled production WAV")
        print(f"PASS: {len(CHECKS)} dialogue/voice assertions; {len(IMAGES)} screenshots")
    except Exception as error:
        result["error"] = str(error)
        raise
    finally:
        result["sources"] = {
            path: hashlib.sha256((ROOT / path).read_bytes()).hexdigest()
            for path in [
                "products/word-guild/app.mjs",
                "products/word-guild/style.css",
                "products/word-guild/conversation.mjs",
                "products/word-guild/dialogue.mjs",
                "products/word-guild/dialogue-script.json",
                "products/word-guild/voice-player.mjs",
                "products/word-guild/core.mjs",
            ]
        }
        (OUT / "browser-results.json").write_text(
            json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8"
        )


if __name__ == "__main__":
    main()
