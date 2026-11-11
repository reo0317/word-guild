"""音楽専用のブラウザー検査。ゲーム実装を変更せず再生区間を観測する。"""

import json
import sys
from pathlib import Path

from browser_probe import DIAGNOSTICS, capture, navigate, prepare
from browser_server import BrowserServer
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
checks = []
NO_WRITE = "--no-write" in sys.argv


def check(condition, message):
    assert condition, message
    checks.append(message)


def screenshot(page, **kwargs):
    if not NO_WRITE:
        page.screenshot(**kwargs)


def check_components(page):
    """担当モジュールを実AudioContextで検査。app接続済みという主張はしない。"""
    page.click("#music")
    page.wait_for_function("wordGuildState.music.playing")
    page.click("#music")
    rows = page.evaluate("""async()=>{
        const {Music}=await import('./core.mjs');
        const {FlightSound}=await import('./sound-effects.mjs');
        const {resolveAudioPolicy}=await import('./audio-policy.mjs');
        const ctx=new AudioContext();await ctx.resume();
        const calls=[],m=new Music(()=>ctx,url=>{calls.push(url);return fetch(url);});
        const results=[];
        const record=(ok,label)=>results.push({ok:!!ok,label});
        await m.play('battle');const source=m.source,at=ctx.currentTime;
        for(let i=0;i<4;i++){
            const policy=resolveAudioPolicy({screen:'game',stage:i,state:'travel'});
            await m.play(policy.musicScene);
        }
        await new Promise(r=>setTimeout(r,180));
        record(m.source===source && calls.length===1 && ctx.currentTime>at,
               '実AudioContext: 4道中階層のSource・取得共有と進行継続');
        await m.play('boss');const boss=m.source;
        record(boss!==source && m.track==='flap2','実AudioContext: 通常ボスは既存Flap2へ切替');
        await m.play('final');
        record(m.source!==boss && m.track==='raid','実AudioContext: 乱入はRaidへ切替');
        for(const state of ['loss','launch','fall','land']){
            const p=resolveAudioPolicy({screen:'game',stage:5,state});
            if(p.musicScene===null)m.stop();
            record(!m.source && p.musicScene===null,'実AudioContext: '+state+'はBGM停止');
        }
        await m.play(resolveAudioPolicy({screen:'home'}).musicScene);
        record(m.track==='nandeshou','実AudioContext: 帰還後のホーム曲');m.stop();
        let release;
        const delayed=new Music(()=>ctx,url=>new Promise(r=>release=()=>fetch(url).then(r)));
        const pending=delayed.play('battle');await Promise.resolve();
        delayed.stop();release();await pending;
        record(!delayed.source,'実デコード: 停止後に遅延Breeze3取得が復活しない');
        let attempts=0;
        const retry=new Music(()=>ctx,url=>++attempts===1
            ?Promise.resolve(new Response('',{status:503})):fetch(url));
        let failed=false;try{await retry.play('battle');}catch{failed=true;}
        await retry.play('battle');
        record(failed && attempts===2 && retry.track==='breeze3',
               '実デコード: Breeze3の503後に再取得・復旧');retry.stop();
        const sound=new FlightSound(ctx);
        record(sound.start() && !sound.start() && sound.state.starts===1,
               '実AudioContext: 飛行音start重複なし');
        record(Object.isFrozen(sound.state),'実AudioContext: 効果音stateは読み取り専用');
        sound.stop();record(!sound.state.playing && sound.state.stops===1,
                            '実AudioContext: 停止・非表示に使うstopで即時解放');
        await ctx.suspend();record(!sound.start(),
                                  '実AudioContext: suspended中に効果音が勝手に再生しない');
        await ctx.resume();record(sound.start(),
                                 '実AudioContext: 利用者の再開後は効果音再生可能');sound.stop();
        // レンダリングされた音を検査。実機の聴感を代替するものではない。
        const offline=new OfflineAudioContext(2,44100*4,44100);
        const running=new Proxy(offline,{get(target,key){
            if(key==='state')return 'running';
            const value=Reflect.get(target,key,target);
            return typeof value==='function'?value.bind(target):value;
        }});
        const renderedSound=new FlightSound(running);renderedSound.start();
        const b=await offline.startRendering(),l=b.getChannelData(0),r=b.getChannelData(1);
        let energy=0,width=0,peak=0,tail=0;
        for(let i=0;i<l.length;i++){
            energy+=(l[i]*l[i]+r[i]*r[i])/2;width+=(l[i]-r[i])**2;
            peak=Math.max(peak,Math.abs(l[i]),Math.abs(r[i]));
            if(i>44100*3.4)tail=Math.max(tail,Math.abs(l[i]),Math.abs(r[i]));
        }
        const pcm={rms:Math.sqrt(energy/l.length),stereo:Math.sqrt(width/l.length),peak,tail};
        record(pcm.rms>.005 && pcm.stereo>.001 && pcm.peak<.95,
               '飛行音の実PCM: 非ゼロ・ステレオ・クリップ余裕');
        record(pcm.tail===0 && !renderedSound.state.playing && !renderedSound.start(),
               '飛行音の実PCM: フェード後無音・自然終了・再描画で復活なし');
        record(Math.abs(l[0])<.001 && Math.abs(r[0])<.001,
               '飛行音の実PCM: 開始を滑らかに立ち上げる');
        await ctx.close();return {results,pcm};
    }""")
    for item in rows["results"]:
        check(item["ok"], item["label"])
    return rows


def check_combined_errors(browser, base):
    save_error = "保存できません。この起動中はプレイできます。"
    music_error = "音楽を再生できません。音楽ボタンで再試行できます。"
    for width, height, fail_material in [
        (390, 844, False),
        (320, 568, False),
        (1280, 900, False),
        (320, 568, True),
    ]:
        page = browser.new_page(viewport={"width": width, "height": height})
        diagnostic = prepare(page)
        diagnostic["expected_http_error"] = 503
        page.add_init_script("""Storage.prototype.setItem=function(){
            throw new DOMException('combined storage failure','QuotaExceededError');
        };""")
        attempts = []

        def fail_once(route, *, attempts=attempts):
            attempts.append(route.request.url)
            if len(attempts) == 1:
                route.fulfill(status=503, body="combined failure")
            else:
                route.continue_()

        page.route("**/breeze3-loop.mp3", fail_once)
        if fail_material:
            page.route(
                "**/claw-strip-generated-v3.png",
                lambda route: route.fulfill(status=503, body="material failure"),
            )
        navigate(page, base)
        page.click("#start")
        page.click("#depart")
        page.wait_for_function('document.querySelector("#music").textContent==="音楽を再試行"')
        text = page.locator("#status").inner_text()
        check(
            page.locator("[data-cell]").evaluate_all(
                "els=>els.length===42 && els.every(e=>{const r=e.getBoundingClientRect();"
                "return r.top>=0 && r.bottom<=innerHeight && r.width>=25 && r.height>=25;})"
            ),
            f"{width}/{fail_material}:複数エラー表示中も全42マスが収まる",
        )
        check(
            save_error in text and music_error in text,
            f"{width}/{fail_material}:保存失敗の後に音楽503でも両エラーを保持",
        )
        screenshot(
            page, path=str(ROOT / f"quality/screenshots/combined-error-{width}-{fail_material}.png")
        )
        page.click("#music")
        page.wait_for_function(
            'wordGuildState.music.playing && wordGuildState.music.track==="breeze3"'
        )
        text = page.locator("#status").inner_text()
        check(
            len(attempts) == 2 and save_error in text and music_error not in text,
            f"{width}/{fail_material}:再試行成功で音楽エラーのみ解除、保存失敗は維持",
        )
        check(
            page.evaluate(
                'wordGuildState.errors.save!=="" && wordGuildState.errors.music==="" && '
                "Object.isFrozen(wordGuildState.errors)"
            ),
            f"{width}/{fail_material}:種類別の読み取り専用エラー状態",
        )
        if fail_material:
            check(
                "切り傷" in text and page.evaluate('wordGuildState.errors.material!==""'),
                "保存・素材・音楽が併発しても素材エラーを保持",
            )
        screenshot(
            page,
            path=str(ROOT / f"quality/screenshots/combined-recovered-{width}-{fail_material}.png"),
        )
        capture(page)
        page.close()


def check_flight_controls(browser, base):
    for action in ["hidden", "disabled"]:
        page = browser.new_page(viewport={"width": 390, "height": 844})
        prepare(page)
        navigate(page, base + "?dev=1&scene=home")
        page.click("#music")
        page.wait_for_function("wordGuildState.music.playing")
        page.evaluate('wordGuildDev.load("loss")')
        page.click("#return")
        page.wait_for_function("wordGuildState.flightSound.playing")
        check(
            page.evaluate("Object.isFrozen(wordGuildState.flightSound)"),
            f"{action}:本番の効果音状態は読み取り専用",
        )
        if action == "hidden":
            page.evaluate("""()=>{
                Object.defineProperty(document,'hidden',{configurable:true,get:()=>true});
                document.dispatchEvent(new Event('visibilitychange'));
            }""")
        else:
            page.click("#music")
        check(
            page.evaluate("!wordGuildState.flightSound.playing && !wordGuildState.music.playing"),
            f"{action}:飛行途中の非表示・停止操作は効果音とBGMを停止",
        )
        page.wait_for_timeout(180)
        check(
            page.evaluate("!wordGuildState.flightSound.playing && !wordGuildState.music.playing"),
            f"{action}:停止後の描画でも音が復活しない",
        )
        if action == "hidden":
            page.evaluate("""()=>{
                delete document.hidden;
                document.dispatchEvent(new Event('visibilitychange'));
            }""")
        else:
            page.click("#music")
        page.wait_for_function("wordGuildState.flightSound.playing")
        check(
            page.evaluate(
                "wordGuildState.flightSound.starts === 2 && !wordGuildState.music.playing"
            ),
            f"{action}:再開は現在の飛行音だけ、BGMなし",
        )
        capture(page)
        page.close()


def run(base):
    with sync_playwright() as pw:
        launch_options = {"headless": True}
        if not Path(pw.chromium.executable_path).is_file():
            # この環境ではPlaywrightの専用shellがなく、導入済みChromeを使う。
            launch_options["channel"] = "chrome"
        browser = pw.chromium.launch(**launch_options)
        if "--errors-only" in sys.argv:
            check_combined_errors(browser, base)
            browser.close()
            return []
        component_page = browser.new_page()
        component_page.goto(base)
        component_metrics = check_components(component_page)
        component_page.close()
        if "--components-only" in sys.argv:
            browser.close()
            return component_metrics
        page = browser.new_page(viewport={"width": 390, "height": 844})
        prepare(page)
        errors = []
        page.on("pageerror", lambda e: errors.append(str(e)))
        # 検査ページだけで実AudioBufferSourceのstart/stopを記録。
        page.add_init_script("""
            window.musicObservations=[];
            const Native=window.AudioContext;
            window.AudioContext=class extends Native {
                createBufferSource() {
                    window.observedAudioContext=this;
                    const source=super.createBufferSource();
                    const start=source.start.bind(source), stop=source.stop.bind(source);
                    let record;
                    source.start=(when,offset)=>{
                        const b=source.buffer,l=b.getChannelData(0),r=b.getChannelData(1);
                        let energy=0,width=0;
                        for(let i=0;i<l.length;i+=100){
                            energy+=l[i]*l[i];width+=(l[i]-r[i])**2;
                        }
                        record={startAt:this.currentTime,offset,loop:source.loop,loopStart:source.loopStart,
                                loopEnd:source.loopEnd,duration:b.duration,
                                channels:b.numberOfChannels,sampleRate:b.sampleRate,
                                energy,width,stopped:false,contextState:this.state};
                        if (source.loop) window.musicObservations.push(record);
                        return start(when,offset);
                    };
                    source.stop=(...args)=>{if(record)record.stopped=true;return stop(...args);};
                    return source;
                }
            };
        """)
        navigate(page, base + "?dev=1&scene=home")
        check(not page.evaluate("wordGuildState.music.playing"), "開始操作前は音源を再生しない")
        page.click("#music")
        page.wait_for_function("wordGuildState.music.playing")
        first = page.evaluate("musicObservations.at(-1)")
        check(first["contextState"] == "running", "タップでAudioContextがrunningになる")
        check(
            first["channels"] == 2 and first["duration"] > 60,
            "無料ホーム音源を実AudioContextで2chとしてデコード",
        )
        check(
            first["energy"] > 0 and first["width"] > 0, "デコード結果に非ゼロ音声と左右の差がある"
        )
        check(
            first["loop"]
            and first["offset"] == first["loopStart"] == 0
            and first["loopEnd"] == first["duration"],
            "ホームの実Sourceは公式ループ版の全長でループ",
        )
        page.click("#start")
        page.wait_for_function('wordGuildState.music.playing && wordGuildState.screen==="select"')
        check(page.evaluate("musicObservations.at(-1).loopStart===0"), "選択画面もホーム区間")
        page.click("#depart")
        page.wait_for_function(
            'wordGuildState.music.playing && wordGuildState.music.scene==="battle"'
        )
        battle = page.evaluate("musicObservations.at(-1)")
        check(
            battle["loop"]
            and battle["offset"] == battle["loopStart"] == 0
            and battle["loopEnd"] == battle["duration"],
            "戦闘の実SourceはBreeze3公式ループ版",
        )
        check(
            page.evaluate("musicObservations.slice(0,-1).every(s=>s.stopped)"),
            "場面切替で前のSourceを停止し、重複再生しない",
        )
        page.click("#music")
        check(
            not page.evaluate("wordGuildState.music.playing")
            and page.evaluate("musicObservations.at(-1).stopped"),
            "停止操作が実Source.stopへ到達",
        )
        page.click("#music")
        page.wait_for_function("wordGuildState.music.playing")
        check(page.evaluate("musicObservations.at(-1).offset===0"), "再開も戦闘区間の先頭から")
        page.evaluate('wordGuildDev.load("travel")')
        check(page.evaluate('wordGuildState.music.scene==="battle"'), "移動演出でも戦闘区間を維持")
        page.wait_for_timeout(500)
        continuation = page.evaluate(
            "({count:musicObservations.length,start:musicObservations.at("
            "-1).startAt,position:observedAudioContext.currentTime-musicO"
            "bservations.at(-1).startAt})"
        )
        page.evaluate('wordGuildDev.load("dog")')
        page.wait_for_timeout(300)
        check(
            page.evaluate(
                "n=>musicObservations.length===n && !musicObservations.at(-1).stopped",
                continuation["count"],
            ),
            "道中階層へ同じSourceを保持、start/stopなし",
        )
        check(
            page.evaluate(
                "p=>observedAudioContext.currentTime-musicObservations.at(-1).startAt>p",
                continuation["position"],
            ),
            "道中階層で曲頭へ戻らず実再生位置が増加",
        )
        page.evaluate('wordGuildDev.load("animal")')
        page.wait_for_function(
            'wordGuildState.music.playing && wordGuildState.music.track === "flap2"'
        )
        check(page.evaluate('wordGuildState.music.scene === "boss"'), "通常ボスは既存Flap2")
        check(
            page.evaluate("musicObservations.slice(0,-1).every(s=>s.stopped)"),
            "通常ボス切替で道中Sourceを停止",
        )
        page.evaluate('wordGuildDev.load("final")')
        page.wait_for_function(
            'wordGuildState.music.playing && wordGuildState.music.track === "raid"'
        )
        check(page.evaluate('wordGuildState.music.scene === "final"'), "乱入場面はRaidへ切替")
        check(
            page.evaluate("musicObservations.slice(0,-1).every(s=>s.stopped)"),
            "乱入時に旧BGMをすべて停止",
        )
        page.evaluate('wordGuildDev.load("loss")')
        page.wait_for_function("!wordGuildState.music.playing")
        check(page.evaluate("musicObservations.every(s=>s.stopped)"), "HP0後はBGM停止")
        # 実際の帰還ボタンからlaunch→fall→landを進め、再描画重複も観測する。
        page.click("#return")
        page.wait_for_function("wordGuildState.flightSound.playing")
        check(
            page.evaluate(
                "wordGuildState.flightSound.starts === 1 && !wordGuildState.music.playing"
            ),
            "launchの風効果音は一度、BGMなし",
        )
        page.wait_for_function('wordGuildState.state === "fall"')
        check(
            page.evaluate(
                "wordGuildState.flightSound.starts === 1 && !wordGuildState.music.playing"
            ),
            "fallへ風音を連続、BGMなし",
        )
        page.wait_for_function('wordGuildState.state === "land"')
        check(
            page.evaluate("!wordGuildState.flightSound.playing && !wordGuildState.music.playing"),
            "着地で効果音も停止",
        )
        page.evaluate('wordGuildDev.load("return")')
        page.wait_for_function('wordGuildState.music.playing && wordGuildState.music.scene==="top"')
        check(
            page.evaluate(
                "musicObservations.at(-1).loopStart===0 && "
                "musicObservations.at(-1).loopEnd===musicObservations.at(-1).duration"
            ),
            "ギルド帰還後はホーム区間に切替",
        )
        check(
            page.evaluate("musicObservations.slice(0,-1).every(s=>s.stopped)"),
            "帰還時にも以前のSourceがすべて停止",
        )
        # OSのバックグラウンド操作は人へ残し、visibilitychangeの本番接続を検査。
        page.evaluate("""()=>{
            window.hiddenForMusicCheck=true;
            Object.defineProperty(document,'hidden',{
                configurable:true,get:()=>window.hiddenForMusicCheck
            });
            document.dispatchEvent(new Event('visibilitychange'));
        }""")
        check(
            not page.evaluate("wordGuildState.music.playing")
            and page.evaluate("musicObservations.at(-1).stopped"),
            "非表示イベント接続の検査で実Sourceを停止",
        )
        page.evaluate("""()=>{
            window.hiddenForMusicCheck=false;
            document.dispatchEvent(new Event('visibilitychange'));
        }""")
        page.wait_for_function("wordGuildState.music.playing")
        check(
            page.evaluate("musicObservations.at(-1).loopStart===0"),
            "表示復帰イベントで現在のホーム区間を再開",
        )
        check(
            page.evaluate("musicObservations.filter(s=>!s.stopped).length===1"),
            "表示復帰後も実Sourceは一つだけ",
        )
        page.evaluate("delete document.hidden")
        # 実際のネットワークを遅延させ、古いホーム要求が復活しないことを確認。
        pending = browser.new_page()
        prepare(pending)
        held = []
        pending.route("**/nandeshou.wgm", lambda route: held.append(route))
        navigate(pending, base + "?dev=1&scene=home")
        pending.click("#music")
        pending.wait_for_timeout(150)
        check(bool(held), "音源ロード途中を実ネットワークで再現")
        pending.evaluate('wordGuildDev.load("animal")')
        pending.wait_for_function('wordGuildState.music.track === "flap2"')
        held[0].continue_()
        pending.wait_for_timeout(2200)
        check(
            pending.evaluate('wordGuildState.music.track === "flap2"'),
            "古いホームの読み込み完了後もFlap2のみ",
        )
        pending.close()
        music_error = "音楽を再生できません。音楽ボタンで再試行できます。"
        for width, height in [(390, 844), (320, 568), (1280, 900)]:
            retry = browser.new_page(viewport={"width": width, "height": height})
            detail = prepare(retry)
            detail["expected_http_error"] = 503
            attempts = []

            def fail_once(route, *, attempts=attempts):
                attempts.append(True)
                if len(attempts) == 1:
                    route.fulfill(status=503, body="retry")
                else:
                    route.continue_()

            retry.route("**/nandeshou.wgm", fail_once)
            navigate(retry, base)
            retry.click("#music")
            retry.wait_for_function(
                'document.querySelector("#music").textContent === "音楽を再試行"'
            )
            check(
                not retry.evaluate("wordGuildState.music.playing")
                and retry.locator("#status").inner_text() == music_error,
                f"{width}:503失敗時は再試行ボタン・エラーを表示、Sourceなし",
            )
            screenshot(retry, path=str(ROOT / f"quality/screenshots/music-error-{width}.png"))
            retry.click("#music")
            retry.wait_for_function("wordGuildState.music.playing")
            check(
                len(attempts) == 2 and retry.evaluate('wordGuildState.music.track === "nandeshou"'),
                f"{width}:ボタンで失敗音源を再取得・再生",
            )
            check(
                retry.locator("#status").inner_text() == ""
                and not retry.locator("#status").is_visible()
                and retry.locator("#music").inner_text() == "音楽を停止",
                f"{width}:成功後は音楽エラーと余白を解除、停止ボタンへ復帰",
            )
            screenshot(retry, path=str(ROOT / f"quality/screenshots/music-recovered-{width}.png"))
            capture(retry)
            retry.close()
        # 古いロードの完了は、後から失敗した現在の要求の表示を消さない。
        race = browser.new_page()
        race_detail = prepare(race)
        race_detail["expected_http_error"] = 503
        deferred = []
        race.route("**/nandeshou.wgm", lambda route: deferred.append(route))
        race.route("**/flap2-loop.mp3", lambda route: route.fulfill(status=503, body="race"))
        navigate(race, base + "?dev=1&scene=home")
        race.click("#music")
        race.wait_for_timeout(150)
        check(len(deferred) == 1, "古いホーム要求を保留して競合を再現")
        race.evaluate('wordGuildDev.load("animal")')
        race.wait_for_function('document.querySelector("#music").textContent === "音楽を再試行"')
        deferred[0].continue_()
        race.wait_for_timeout(2200)
        check(
            race.locator("#status").inner_text() == music_error
            and race.locator("#music").inner_text() == "音楽を再試行"
            and not race.evaluate("wordGuildState.music.playing"),
            "古い成功要求の完了後も現在の失敗表示と再試行操作を維持",
        )
        capture(race)
        race.close()
        # 通常URLで実際の保存失敗を起こし、音楽成功が消さないことを確認。
        saving = browser.new_page()
        prepare(saving)
        saving.add_init_script("""Storage.prototype.setItem=function(){
            throw new DOMException('test storage failure','QuotaExceededError');
        };""")
        navigate(saving, base)
        saving.click("#start")
        saving.click("#depart")
        saving.wait_for_function('wordGuildState.music.track === "breeze3"')
        check(
            saving.locator("#status").inner_text()
            == "保存できません。この起動中はプレイできます。",
            "出発時の保存失敗表示を場面の音楽成功で消さない",
        )
        saving.click("#music")
        saving.click("#music")
        saving.wait_for_function("wordGuildState.music.playing")
        check(
            saving.locator("#status").inner_text()
            == "保存できません。この起動中はプレイできます。",
            "停止・再開成功でも保存失敗表示を維持",
        )
        capture(saving)
        saving.close()
        check_combined_errors(browser, base)
        check_flight_controls(browser, base)
        check(not errors, f"音楽操作を含むJavaScript例外なし: {errors}")
        observations = page.evaluate("musicObservations")
        capture(page)
        browser.close()
        return observations


if __name__ == "__main__":
    server = BrowserServer(ROOT)
    result = dict(
        passed=False,
        scope="components"
        if "--components-only" in sys.argv
        else "combined-errors"
        if "--errors-only" in sys.argv
        else "app-integration",
        checks=checks,
        human_checks=["iPhone実機の音楽開始・停止・復帰・場面切替", "音楽の聴感"],
    )
    try:
        with server:
            result["observations"] = run(server.url + "/products/word-guild/index.html")
            server.assert_running()
        result["passed"] = True
        print(f"PASS: {len(checks)} music browser assertions")
    except Exception as error:
        result["error"] = str(error)
        raise
    finally:
        result["diagnostics"] = DIAGNOSTICS
        result["server"] = server.snapshot()
        if not NO_WRITE:
            (ROOT / "quality/music-browser-results.json").write_text(
                json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8"
            )
        else:
            print(
                json.dumps(
                    {k: v for k, v in result.items() if k not in ("server", "diagnostics")},
                    ensure_ascii=False,
                )
            )
