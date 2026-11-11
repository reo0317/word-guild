"""全画像待機なしの通常操作を観測し、階層・帰還の画像表示を比較する。"""

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "quality/loading-v6"

# 未来の素材を読まない。実際に表示中のCSS URLだけをdecode観測する。
# 観測用Imageは既存のCSS取得と同じURLを共有し、操作を待たせない。
PROBE = r"""(() => {
 const images=new Map(),phases=[],decodes=[];
 const urls=value=>[...value.matchAll(/url\(["']?([^"')]+)["']?\)/g)]
   .map(m=>new URL(m[1],location.href).href);
 function observe(url){
  if(images.has(url))return images.get(url);
  const cached=window.wordGuildAssets?.find(e=>new URL(e.url,location.href).href===url&&e.ready);
  if(cached){const entry={url,ready:true,observed:performance.now(),decoded:cached.decoded,
   source:'production Image.decode'};images.set(url,entry);decodes.push({...entry});return entry;}
  const img=new Image(),entry={url,ready:false,observed:performance.now()};
  images.set(url,entry);img.src=url;
  img.decode().then(()=>{entry.ready=true;entry.decoded=performance.now();
   decodes.push({...entry});}).catch(e=>{entry.error=String(e);});return entry;
 }
 let last=0,phase;
 function sample(now){
  requestAnimationFrame(sample);if(now-last<40)return;last=now;
  const s=window.wordGuildState;if(!s)return;
  const backgrounds=[...document.querySelectorAll('.guild-art,.arena,.flight-scene,.road')]
   .map(e=>({kind:'background',urls:e.tagName==='IMG'?[e.src]:urls(getComputedStyle(e).backgroundImage)}))
   .filter(x=>x.urls.length);
  const characters=[...document.querySelectorAll('.portrait,.walk-art')].map(e=>({
   kind:'character',name:e.dataset.walker||e.parentElement.dataset.character||e.parentElement.className,
   urls:e.tagName==='IMG'?[e.src]:urls(getComputedStyle(e).backgroundImage)}));
  const items=[...backgrounds,...characters];
  const route=document.querySelector('.flight-scene');
  const key=[s.screen,s.stage,s.state,s.complete,
   route?urls(getComputedStyle(route).backgroundImage)[0]:''].join('|');
  if(phase?.key!==key){if(phase)phase.end=now;
   phase={key,screen:s.screen,stage:s.stage,state:s.state,start:now,
    observations:[],firstVisible:null,allReadyAt:null};phases.push(phase);}
  const observation={at:now,items:items.map(x=>({...x,
   images:x.urls.map(observe).map(i=>({...i}))}))};
  // 下地が表示できても、主要背景の表示完了とは区別する。
  observation.charactersReady=observation.items.filter(i=>i.kind==='character')
   .every(i=>i.images.some(x=>x.ready));
  observation.backgroundsReady=observation.items.filter(i=>i.kind==='background')
   .every(i=>i.images[0]?.ready);
  if(observation.charactersReady&&observation.backgroundsReady&&phase.allReadyAt===null)
   phase.allReadyAt=now;
  phase.observations.push(observation);
 }
 requestAnimationFrame(sample);
 window.flowLoading={phases,decodes,images,
  finish:()=>({phases:phases.map(p=>({...p,end:p.end??performance.now()})),decodes,
   resources:performance.getEntriesByType('resource')
    .filter(e=>/\.(png|webp)(\?|$)/.test(e.name))
    .map(e=>({url:e.name,start:e.startTime,end:e.responseEnd,
     transfer:e.transferSize,encoded:e.encodedBodySize}))})};
})();"""


def drag(page, path):
    points = [page.locator(f'[data-cell="{i}"]').bounding_box() for i in path]
    page.mouse.move(
        points[0]["x"] + points[0]["width"] / 2, points[0]["y"] + points[0]["height"] / 2
    )
    page.mouse.down()
    for p in points[1:]:
        page.mouse.move(p["x"] + p["width"] / 2, p["y"] + p["height"] / 2, steps=4)
    page.mouse.up()


def measure_flow(browser, base, version):
    context = browser.new_context(viewport={"width": 390, "height": 844})
    page = context.new_page()
    page.add_init_script(PROBE)
    errors = []
    page.on("pageerror", lambda error: errors.append(str(error)))
    cdp = context.new_cdp_session(page)
    cdp.send("Network.enable")
    # 音楽の開始後に停止しても取得中の音源は残るため、画像測定では両版とも
    # CDPでBGM・声の音源を遮断する。画像だけの比較条件を両版へ同じく適用する。
    # 画像のHTTPキャッシュとゲームの時計は変更しない。
    cdp.send("Network.setBlockedURLs", {"urls": ["*/assets/music/*", "*/assets/voice/*"]})
    cdp.send(
        "Network.emulateNetworkConditions",
        {
            "offline": False,
            "latency": 80,
            "downloadThroughput": 1048576,
            "uploadThroughput": 1048576,
        },
    )
    page.goto(base, wait_until="domcontentloaded")
    page.wait_for_selector("#start")
    # 音源計測と干渉させないため、利用者の音楽停止操作で止める。
    page.click("#start")
    # 遮断が先に失敗表示になった場合は、再試行ボタンの次のクリックで停止する。
    # 同じDOMボタンの処理を同期で呼び、音楽エラーの返答との競合を避ける。
    page.locator("#music").evaluate("e=>{if(e.textContent==='音楽を再試行')e.click();e.click();}")
    assert page.evaluate("!wordGuildState.music.enabled"), "画像計測中は音楽を停止"
    page.click('[data-hero="female"]')
    page.click('[data-ally="water"]')
    page.wait_for_timeout(1000)
    page.click("#depart")
    paths = [[8, 9, 10], [5, 12, 19], [24, 25, 26], [29, 30, 37]]
    for stage in range(6):
        page.wait_for_function(
            "n=>wordGuildState.stage===n&&wordGuildState.state==='battle'", arg=stage
        )
        # 同じ操作間隔。画像準備を待つ条件は一切使用しない。
        page.wait_for_timeout(1500)
        if stage < 4:
            drag(page, paths[stage])
        elif stage == 4:
            drag(page, [8, 9, 10])
            page.wait_for_timeout(400)
            drag(page, [5, 12, 19])
        else:
            page.wait_for_function("wordGuildState.state==='loss'")
    page.click("#return")
    page.wait_for_function("wordGuildState.screen==='home'&&wordGuildState.complete")
    page.wait_for_timeout(1500)
    # 表示・操作の時刻を先に確定し、その後に通信量だけを採取する。
    observed = page.evaluate("flowLoading.finish()")
    page.screenshot(path=str(OUT / f"flow-return-{version}.png"))
    page.wait_for_load_state("networkidle", timeout=90000)
    observed["resources"] = page.evaluate("flowLoading.finish().resources")
    observed["version"] = version
    observed["pageerrors"] = errors
    observed["total_image_bytes"] = sum(r["transfer"] for r in observed["resources"])
    observed["summary"] = []
    for phase in observed["phases"]:
        samples = phase["observations"]
        # 80msは40ms観測周期＋decode観測の余裕。これを超える空白を隠さない。
        gap = next((o["at"] - phase["start"] for o in samples if o["charactersReady"]), None)
        visible = phase["allReadyAt"]
        observed["summary"].append(
            {
                "key": phase["key"],
                "stage": phase["stage"],
                "state": phase["state"],
                "duration_ms": round(phase["end"] - phase["start"]),
                "display_ms": None if visible is None else round(visible - phase["start"]),
                "character_ready_ms": None if gap is None else round(gap),
                "image_bytes_started_here": sum(
                    r["transfer"]
                    for r in observed["resources"]
                    if phase["start"] <= r["start"] < phase["end"]
                ),
            }
        )
    context.close()
    return observed


def verify_flows(before, after):
    checks = []

    def check(value, message):
        assert value, message
        checks.append(message)

    check(not before["pageerrors"] and not after["pageerrors"], "通常操作のJS例外なし")
    check(after["total_image_bytes"] < before["total_image_bytes"], "全攻略の画像転送量を削減")
    for stage in range(6):
        a = next(p for p in before["summary"] if p["stage"] == stage and p["state"] == "battle")
        b = next(p for p in after["summary"] if p["stage"] == stage and p["state"] == "battle")
        check(b["display_ms"] is not None, f"階層{stage}:通常プレイ中に表示完了")
        limit = 1500 if stage == 0 else 80
        check(
            b["character_ready_ms"] is not None and b["character_ready_ms"] <= limit,
            f"階層{stage}:初回{limit}ms以内にキャラが表示済み",
        )
        check(
            a["display_ms"] is None or b["display_ms"] <= a["display_ms"] + 80,
            f"階層{stage}:同じ操作間隔で表示速度が悪化しない",
        )
    returns = [p for p in after["summary"] if p["state"] in ["launch", "fall", "land"]]
    check(len(returns) >= 4, "帰還の四景を通常操作で観測")
    for index, phase in enumerate(returns):
        check(
            phase["display_ms"] is not None and phase["display_ms"] <= 80,
            f"帰還{index}:背景と帰還姿の先読みが間に合う",
        )
    for phase in after["summary"]:
        if phase["stage"] is None or phase["state"] == "battle" and phase["stage"] == 0:
            continue
        check(
            phase["character_ready_ms"] is not None and phase["character_ready_ms"] <= 80,
            f"{phase['key']}:表情・階層・帰還の切替でキャラ空白なし",
        )
    character_urls = [
        r["url"]
        for r in after["resources"]
        if re.search(
            r"/(male|female|fire|water|grass|guide|cat|dog|sun|ant|animal|final)-", r["url"]
        )
    ]
    check(
        character_urls
        and all(
            "-display-v8.webp" in url
            or re.search(r"/walk-v9/(male|female|fire|water|grass)-walk-ne-0[1-4]-v9\.webp$", url)
            for url in character_urls
        ),
        "通常攻略はv8表示用キャラと受領v9歩行だけ取得（原画・旧表示版なし）",
    )
    transfers = [r["url"] for r in after["resources"] if r["transfer"] > 0]
    check(len(transfers) == len(set(transfers)), "先読み済み画像の重複転送なし")
    result = {
        "passed": True,
        "checks": checks,
        "conditions": {
            "latency_ms": 80,
            "bytes_per_second": 1048576,
            "viewport": [390, 844],
            "selection_ms": 1000,
            "battle_before_answer_ms": 1500,
            "boss_between_answers_ms": 400,
            "music": (
                "両版ともCDPで assets/music/* と assets/voice/* を遮断。"
                "開始後に音楽停止を実操作。音声を含む実際の遊びは会話ブラウザー検査で別途検査。"
            ),
        },
        "observer": (
            "表示中CSSと歩行imgのURLだけを観測。製品のdecode済みURLは読み取り専用状態の完了時刻を使い、"
            "それ以外は非同期Image.decode。全画像待機・開発API・時計操作なし。"
            "観測周期40ms、80ms以内は観測の余裕。初回戦闘は初期取得中なので1500msを基準とする。"
        ),
        "before": before,
        "after": after,
    }
    (OUT / "flow-performance.json").write_text(
        json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    return len(checks)
