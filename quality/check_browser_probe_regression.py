"""初期化遅延・実時間の攻撃と演出遷移を伴う観測の回帰検査。"""

import json
import socket
import time
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from urllib.request import urlopen

from browser_probe import DIAGNOSTICS, capture, cut_render, event, navigate, phase, prepare
from browser_server import BrowserServer
from check_word_guild_browser import drag
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]


def hold_requests(pending):
    return lambda route: pending.append(route)


def run(base, server):
    checks = []

    def check(value, label):
        assert value, label
        checks.append(label)

    with sync_playwright() as pw:
        options = {} if Path(pw.chromium.executable_path).is_file() else {"channel": "chrome"}
        browser = pw.chromium.launch(headless=True, **options)
        page = browser.new_page(viewport={"width": 390, "height": 844})
        diagnostic = prepare(page)
        delayed = []

        def delay_module(route):
            delayed.append(page.evaluate("window.wordGuildState === undefined"))
            time.sleep(0.25)
            route.continue_()

        page.route("**/app.mjs*", delay_module)
        navigate(page, base)
        check(delayed == [True], "状態未公開のモジュール読込を遅延させても初期化まで待つ")
        check(page.evaluate("wordGuildState.screen === 'home'"), "通常URLでホームが準備完了")
        page.click("#start")
        page.click('[data-hero="female"]')
        page.click('[data-ally="water"]')
        page.click("#depart")
        page.wait_for_function("wordGuildState.elapsed >= 10100")
        departure = event(page, "click", "depart")["after"]
        live = page.evaluate("wordGuildState")
        check(
            departure["hp"] == 100
            and departure["hero"] == "female"
            and departure["ally"] == "water",
            "10秒攻撃後に読んでも出発イベント内の選択とHP100を検証できる",
        )
        check(live["hp"] < 100, "時計を止めず通常戦闘の攻撃が実際に発生")
        drag(page, [8, 9, 10, 11, 10])
        page.wait_for_timeout(900)
        released = event(page)
        check(
            released["before"]["state"] == "battle"
            and released["before"]["input"] == "CAT"
            and released["after"]["state"] == "defeated"
            and released["after"]["found"] == ["cat"],
            "750msを過ぎて読んでも離指前CATとイベント内の正解結果を失わない",
        )
        travel = phase(page, 0, "travel")
        check(
            travel["road"] and travel["cells"] == travel["disabled"] == 42,
            "自然な道と旧盤面の入力停止",
        )
        arriving = phase(page, 1, "arriving")
        check(arriving["cells"] == arriving["disabled"] == 42, "自然な次階層の落石と入力停止")
        page.wait_for_function("wordGuildState.stage === 1 && wordGuildState.state === 'battle'")
        check(
            page.evaluate("wordGuildState.found.length === 0"),
            "自然な入力再開と発見状態のリセット",
        )
        rendered = cut_render(page, 0, released["before"]["at"])
        check(
            rendered["cuts"] == 1
            and rendered["state"] == "defeated"
            and rendered["cutDetails"][0]["texture"],
            "次盤面まで観測を遅らせても正解時の一本・階層・状態を同時記録で検証",
        )
        capture(page)
        check(
            not diagnostic["pageerrors"] and not diagnostic["requestfailed"],
            "正常系の初期化・操作例外なし",
        )
        page.close()
        # 読込を保留してから本物のHTTP応答を解放する。ゲームの時計は変更しない。
        for delay in [200, 1000]:
            slow = browser.new_page(viewport={"width": 390, "height": 844})
            detail = prepare(slow)
            held = []
            slow.route("**/claw-strip-generated-v3.png", hold_requests(held))
            slow.goto(base + "?dev=1&scene=cat", wait_until="domcontentloaded")
            slow.wait_for_function("window.wordGuildDev && wordGuildState.state==='battle'")
            answer = drag(slow, [8, 9, 10])
            slow.wait_for_timeout(delay)
            check(len(held) == 1, f"素材{delay}ms遅延は実際の画像要求を保留")
            held[0].continue_()
            observed = cut_render(slow, 0, answer["at"])
            check(
                observed["cuts"] == 1
                and observed["state"] == ("defeated" if delay == 200 else "travel"),
                f"素材{delay}ms遅延後のDOM描画を状態と同時に記録",
            )
            if delay == 200:
                slow.screenshot(path=str(ROOT / "quality/screenshots/delayed-cut-390.png"))
            slow.wait_for_function("wordGuildState.stage===1 && wordGuildState.state==='battle'")
            check(
                slow.locator("#status").inner_text() == ""
                and slow.locator(".claw-cut").count() == 0
                and not detail["pageerrors"]
                and not detail["requestfailed"],
                f"素材{delay}ms遅延でも描画エラー・次階層への持越しなし",
            )
            capture(slow)
            slow.close()
        # 稼働中の排他ポートをSO_REUSEADDRでも奪えない。
        contender = socket.socket()
        contender.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        try:
            contender.bind(server.server_address)
        except OSError:
            check(True, "検査配信中の同ポートへの再束縛を拒否")
        else:
            raise AssertionError("検査配信のポートが再束縛できる")
        finally:
            contender.close()

        def fetch_module(_):
            with urlopen(server.url + "/products/word-guild/dev-scenes.mjs", timeout=5) as response:
                return response.status == 200 and b"export function install" in response.read()

        with ThreadPoolExecutor(max_workers=24) as clients:
            check(all(clients.map(fetch_module, range(48))), "同時要求48件でもdev-scenes応答を完了")
        # 動的importが進行中でもサーバーを所有し、止めずに応答する。
        dynamic = browser.new_page()
        dynamic_detail = prepare(dynamic)
        imports = []
        dynamic.route("**/dev-scenes.mjs", lambda route: imports.append(route))
        dynamic.goto(base + "?dev=1&scene=home", wait_until="domcontentloaded")
        dynamic.wait_for_function("window.wordGuildState!==undefined")
        dynamic.wait_for_timeout(300)
        server.assert_running()
        check(len(imports) == 1, "動的import要求の保留中もHTTP応答とスレッド生存")
        imports[0].continue_()
        dynamic.wait_for_function("window.wordGuildDev && document.querySelector('#dev-state')")
        check(not dynamic_detail["requestfailed"], "保留したdev-scenesは同じ生存サーバーで読込成功")
        capture(dynamic)
        dynamic.close()
        # 意図的に早期終了させた場合の接続拒否は、成功扱いや再試行をせず識別する。
        stopped_server = BrowserServer(ROOT)
        refused = browser.new_page()
        refused_detail = prepare(refused)
        refused_detail["expected_failure"] = True
        pending_import = []
        refused.route("**/dev-scenes.mjs", hold_requests(pending_import))
        with stopped_server:
            refused.goto(
                stopped_server.url + "/products/word-guild/index.html?dev=1",
                wait_until="domcontentloaded",
            )
            refused.wait_for_function("window.wordGuildState!==undefined")
            refused.wait_for_timeout(300)
            stopped_server.assert_running()
        check(len(pending_import) == 1, "早期停止の再現は動的importだけを保留")
        pending_import[0].continue_()
        refused.wait_for_timeout(500)
        refused_detail["server"] = stopped_server.snapshot()
        check(
            any(
                "dev-scenes.mjs" in r["url"] and "ERR_CONNECTION_REFUSED" in r["failure"]
                for r in refused_detail["requestfailed"]
            )
            and any(e["kind"] == "closed" for e in stopped_server.events),
            "早期HTTP停止時のdev-scenes接続拒否を要求失敗・停止時刻付きで再現",
        )
        capture(refused)
        refused.close()
        # 読込失敗を成功として待ち流さず、対象URLと失敗理由を出す。
        broken = browser.new_page()
        failure = prepare(broken)
        failure["expected_failure"] = True
        broken.route("**/core.mjs", lambda route: route.abort())
        try:
            navigate(broken, base, timeout=1500)
        except AssertionError as error:
            check(
                "初期化失敗" in str(error)
                and any("core.mjs" in r["url"] for r in failure["requestfailed"]),
                "依存モジュールの読込失敗をURL・requestfailed付きで報告",
            )
        else:
            raise AssertionError("壊れた初期化を成功として扱った")
        browser.close()
    return {"passed": True, "checks": checks, "diagnostics": DIAGNOSTICS}


if __name__ == "__main__":
    server = BrowserServer(ROOT)
    result = {"passed": False, "diagnostics": DIAGNOSTICS}
    try:
        with server:
            result = run(server.url + "/products/word-guild/index.html", server)
            server.assert_running()
        print(f"PASS: {len(result['checks'])} initialization / delayed-observation assertions")
    except Exception as error:
        result.update(passed=False, error=str(error))
        raise
    finally:
        result["server"] = server.snapshot()
        (ROOT / "quality/probe-regression-results.json").write_text(
            json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8"
        )
