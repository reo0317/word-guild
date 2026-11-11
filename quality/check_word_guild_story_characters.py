"""人物・物語の独立検査。生成物はstdoutのみ（担当外ファイルへ書かない）。

登録候補: python quality/check_word_guild_story_characters.py (timeout=180)。
--preview SCENE WIDTH は実画面JPEGをbase64でstdoutへ返し、目視検査に使う。
appの物語接続は基本担当: story.mjs冒頭の接続説明を参照。
"""

import argparse
import base64
import hashlib
import json
import subprocess
from pathlib import Path

from browser_server import BrowserServer
from PIL import Image
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
PRODUCT = ROOT / "products/word-guild"
CHECKS = []


def check(value, label):
    assert value, label
    CHECKS.append(label)


def modules():
    result = subprocess.run(
        [
            "node",
            "--input-type=module",
            "-e",
            """import assert from 'node:assert/strict';
import {CHARACTER_ART,CHARACTERS,EXPRESSIONS} from './products/word-guild/character-art.mjs';
import {getStoryBeat} from './products/word-guild/story.mjs';
import {Game} from './products/word-guild/core.mjs';
const contexts=[{screen:'home'}, {screen:'home',returned:true}, {screen:'select'}];
const states=['battle','defeated','travel','arriving','intrusion',
 'counter','loss','launch','fall','land'];
for(let stage=0;stage<6;stage++)for(const state of states)
 contexts.push({screen:'game',stage,state,hero:'female',ally:'water'});
const beats=contexts.map(c=>{
 const before=JSON.stringify(c),b=getStoryBeat(Object.freeze(c));
 assert.equal(JSON.stringify(c),before);
 if(b){assert.ok(Object.isFrozen(b));assert.ok(b.speaker&&b.text);
  assert.ok(EXPRESSIONS.includes(b.expression));assert.ok(b.text.split('\\n').length<=2);
  assert.ok(b.text.length<=52);assert.throws(()=>{b.text='changed';},TypeError);}
 return {context:c,beat:b};
});
for(const state of ['battle','intrusion','counter','arriving']){
 const b=getStoryBeat({screen:'game',stage:5,state});
 assert.deepEqual(b,{speaker:'しるべ',text:'ええっ…！',expression:'action-2'});
}
assert.equal(getStoryBeat({screen:'unknown'}),null);
assert.equal(getStoryBeat({screen:'game',stage:99,state:'battle'}),null);
for(const hero of ['male','female']){
 const b=getStoryBeat({screen:'game',stage:5,state:'fall',hero});
 assert.equal(b.speaker,hero==='male'?'リオ':'ミナ');
}
const game=new Game('water'),before=JSON.stringify({...game,found:[...game.found]});
getStoryBeat({screen:'game',stage:game.stage,state:game.state,hero:'male',ally:game.ally});
assert.equal(JSON.stringify({...game,found:[...game.found]}),before);
assert.ok(Object.isFrozen(CHARACTER_ART));
assert.equal(CHARACTERS.length,12);
for(const art of Object.values(CHARACTER_ART)){
 assert.ok(Object.isFrozen(art)&&Object.isFrozen(art.poses)&&Object.isFrozen(art.frames));
 assert.equal(art.poses.length,['male','female'].includes(art.id)?9:6);
}
console.log(JSON.stringify({art:CHARACTER_ART,beats}));""",
        ],
        cwd=ROOT,
        capture_output=True,
        text=True,
        encoding="utf-8",
        timeout=30,
        check=True,
    )
    data = json.loads(result.stdout)
    check(True, "物語短文・凍結・場面分岐・驚き限定・ゲーム状態不変")
    records = json.loads(
        (ROOT / "quality/characters-v8/asset-records.json").read_text(encoding="utf-8")
    )
    for name, art in data["art"].items():
        check(name in records, f"{name}: 受領素材対応")
        for frame in records[name]["frames"]:
            pose = frame["name"]
            check(
                art["frames"][pose] == "assets/" + Path(frame["display"]).name,
                f"{name}/{pose}: v8表示URL一致",
            )
            for path, key in [(frame["file"], "sha256"), (frame["display"], "webp_sha256")]:
                check(
                    hashlib.sha256((ROOT / path).read_bytes()).hexdigest() == frame[key],
                    f"{name}/{pose}: 受領{key}保持",
                )
            with Image.open(ROOT / frame["display"]) as image:
                check(
                    image.size == (256, 256)
                    and image.mode == "RGBA"
                    and image.getchannel("A").getextrema()[0] == 0
                    and image.getchannel("A").getextrema()[1] > 0,
                    f"{name}/{pose}: 256px透過WebP",
                )
    return data


def browser_checks(browser, base):
    context = browser.new_context()
    page = context.new_page()
    errors = []
    page.on("pageerror", lambda error: errors.append(str(error)))
    page.goto(base + "?dev=1&scene=select")
    page.wait_for_function("window.wordGuildDev")
    mapped = page.evaluate("""async()=>{
        const {CHARACTER_ART}=await import('./character-art.mjs');
        const {assetURL}=await import('./assets-loader.mjs');
        const {frameURL,loadSprite}=await import('./sprites.mjs');
        for(const [id,art] of Object.entries(CHARACTER_ART)){
            for(const pose of art.poses){
                if(frameURL(id,pose)!==art.frames[pose]
                  ||assetURL(`${id}-${pose}`)!==art.frames[pose])throw Error('URL mismatch');
            }
            await loadSprite(id,art.poses);
        }
        return ['guild','floor-0','floor-5','return-exit','return-land',
          'ui-primary-button','ui-board-frame'].map(name=>[name,assetURL(name)]);
    }""")
    for name, url in mapped:
        version = 7 if name.startswith("ui-") else 6
        check(url == f"assets/{name}-display-v{version}.webp", f"{name}: 既存URL保持")
    ready = page.evaluate("wordGuildAssets.filter(e=>e.url.endsWith('display-v8.webp'))")
    check(len(ready) == 78 and all(e["ready"] for e in ready), "全78姿を実decode")
    check(
        page.evaluate("Object.isFrozen(wordGuildAssets)&&wordGuildAssets.every(Object.isFrozen)"),
        "素材状態は凍結スナップショット",
    )
    check(
        not page.evaluate(
            "performance.getEntriesByType('resource').some(e=>/generated-v8\\.png|(?:male|female|guide)-.*display-v6/.test(e.name))"
        ),
        "原画PNGと旧キャラの取得なし",
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
                if scene in ["cat", "dog", "sun", "ant", "animal", "final"]:
                    # appへの物語接続は担当外。既存吹き出し内で新短文の寸法だけ確認。
                    fits = page.evaluate("""async()=>{
                        const {getStoryBeat}=await import('./story.mjs');
                        const b=getStoryBeat(wordGuildState),hint=document.querySelector('#hint');
                        const old=hint.textContent,whiteSpace=hint.style.whiteSpace;
                        hint.textContent=b.text;hint.style.whiteSpace='pre-line';
                        const fits=document.querySelector('#board').getBoundingClientRect()
                          .bottom<=innerHeight;
                        hint.textContent=old;hint.style.whiteSpace=whiteSpace;return fits;
                    }""")
                    check(fits, f"{width}/{motion}/{scene}: 新短文でも盤面画面内（検査内仮接続）")
                check(
                    page.evaluate("document.documentElement.scrollWidth<=innerWidth"),
                    f"{width}/{motion}/{scene}: 横収まり",
                )
                if scene in ["cat", "dog", "sun", "ant", "animal", "final"]:
                    check(
                        page.locator("[data-cell]").count() == 42
                        and page.locator("#board").evaluate(
                            "e=>e.getBoundingClientRect().bottom<=innerHeight"
                        ),
                        f"{width}/{motion}/{scene}: 42マス画面内",
                    )
                check(
                    page.locator(".portrait").evaluate_all(
                        "nodes=>nodes.every(e=>getComputedStyle(e).backgroundImage.includes('display-v8.webp'))"
                    ),
                    f"{width}/{motion}/{scene}: 本番キャラv8",
                )
        page.emulate_media(reduced_motion="no-preference")
        page.goto(base)
        page.click("#start")
        page.click('[data-hero="female"]')
        page.click('[data-ally="water"]')
        page.click("#depart")
        check(
            page.evaluate(
                "wordGuildState.hero==='female'&&wordGuildState.ally==='water'&&wordGuildState.hp===100"
            ),
            f"{width}: 実クリック選択・開始",
        )
        page.wait_for_function(
            "wordGuildAssets.some(e=>e.url.includes('cat-idle-display-v8')&&e.ready)"
        )
        boxes = [page.locator(f'[data-cell="{i}"]').bounding_box() for i in [8, 9, 10]]
        points = [(b["x"] + b["width"] / 2, b["y"] + b["height"] / 2) for b in boxes]
        page.mouse.move(*points[0])
        page.mouse.down()
        for point in points[1:]:
            page.mouse.move(*point, steps=3)
        page.mouse.up()
        # 短い撃破状態を読み逃さない。同じ離指イベントの観測を使う。
        check(
            page.evaluate("wordGuildState.found.includes('cat') || wordGuildState.stage === 1"),
            f"{width}: 実ポインターcat撃破・次階層へ進行",
        )
        check(not page.evaluate("!!window.wordGuildDev"), f"{width}: 通常URLに開発操作なし")
        page.goto(base + "?dev=1&scene=select")
        page.wait_for_function("window.wordGuildDev")
    # 低優先表情をHTTPで保留して、idle表示→decode後の切替を実際に確認。
    slow = context.new_page()
    held = []
    requests = []
    slow.on("request", lambda request: requests.append(request.url))
    slow.route("**/female-joy-display-v8.webp", lambda route: held.append(route))
    slow.goto(base + "?dev=1&scene=select")
    slow.wait_for_function("wordGuildAssets.some(e=>e.url.includes('female-idle')&&e.ready)")
    slow.click('[data-hero="female"]')
    portrait = slow.locator('[data-hero="female"] .portrait')
    check(
        "female-idle-display-v8" in portrait.evaluate("e=>getComputedStyle(e).backgroundImage"),
        "未decode表情はv8待機姿で代替",
    )
    slow.wait_for_function(
        "wordGuildAssets.some(e=>e.url.includes('female-joy')&&e.started!==null)"
    )
    for _ in range(100):
        if held:
            break
        slow.wait_for_timeout(25)
    check(len(held) == 1, "同一表情URLのHTTP要求共有")
    held[0].continue_()
    slow.wait_for_function(
        "getComputedStyle(document.querySelector('[data-hero=\"female\"] .portrait'))"
        ".backgroundImage.includes('female-joy-display-v8')"
    )
    check(True, "decode後にv8喜び姿へ更新")
    check(sum("female-joy-display-v8" in url for url in requests) == 1, "表情再描画でも取得一回")
    check(not errors, f"実ブラウザー例外なし: {errors}")
    context.close()


def preview(browser, base, scene, width):
    height = {320: 568, 390: 844, 1280: 900}[width]
    page = browser.new_page(viewport={"width": width, "height": height})
    page.goto(base + "?dev=1&scene=" + scene)
    page.wait_for_function("window.wordGuildDev")
    # 撮影だけは全姿を待つ。通常の読み込み速度・操作の証拠と混同しない。
    page.evaluate("""async()=>{
        const {CHARACTER_ART}=await import('./character-art.mjs');
        const {loadSprite}=await import('./sprites.mjs');
        await Promise.all(Object.entries(CHARACTER_ART).map(([id,a])=>loadSprite(id,a.poses)));
        await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
    }""")
    # 素材待機中に自動進行したfinal/帰還も、撮影時に指定シーンへ戻す。
    page.evaluate("s=>wordGuildDev.load(s)", scene)
    page.wait_for_timeout(80)
    image = base64.b64encode(page.screenshot(type="jpeg", quality=65)).decode("ascii")
    print(json.dumps({"scene": scene, "width": width, "mime": "image/jpeg", "image": image}))
    page.close()


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--preview", nargs=2, metavar=("SCENE", "WIDTH"))
    parser.add_argument("--verbose", action="store_true")
    args = parser.parse_args()
    with BrowserServer(ROOT) as server, sync_playwright() as playwright:
        options = (
            {} if Path(playwright.chromium.executable_path).is_file() else {"channel": "chrome"}
        )
        browser = playwright.chromium.launch(headless=True, **options)
        base = server.url + "/products/word-guild/"
        if args.preview:
            preview(browser, base, args.preview[0], int(args.preview[1]))
        else:
            modules()
            browser_checks(browser, base)
            print(
                json.dumps(
                    {
                        "passed": True,
                        "assertions": len(CHECKS),
                        "checks": CHECKS
                        if args.verbose
                        else "素材・物語・3画面幅とreduced-motion・実操作・遅延表情",
                    },
                    ensure_ascii=False,
                )
            )
        browser.close()


if __name__ == "__main__":
    main()
