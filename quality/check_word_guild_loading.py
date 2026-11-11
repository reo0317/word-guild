"""同一回線で変更前後の初期表示・再訪を測定。撮影待機とは分離する。"""

import json
import sys
from functools import partial
from pathlib import Path

from browser_server import BrowserServer, Handler
from check_word_guild_display import verify
from check_word_guild_flow_loading import measure_flow, verify_flows
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "quality/loading-v6"

PROBE = r"""async()=>{
 const urls=new Set([...document.images].map(i=>i.src));
 for(const e of document.querySelectorAll('.portrait,#start,#view')){
  const styles=[getComputedStyle(e),getComputedStyle(e,'::after')];
  for(const s of styles)for(const value of [s.backgroundImage,s.borderImageSource])
   for(const m of value.matchAll(/url\(["']?([^"')]+)["']?\)/g))
    urls.add(new URL(m[1],location.href).href);
 }
 const decoded=await Promise.all([...urls].map(async url=>{
  const i=new Image();i.src=url;await i.decode();return {url,decoded:performance.now()};
 }));
 await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
 return {decoded,displayAt:performance.now()};
}"""


def measure(browser, base, version):
    context = browser.new_context(viewport={"width": 390, "height": 844})
    page = context.new_page()
    cdp = context.new_cdp_session(page)
    cdp.send("Network.enable")
    cdp.send(
        "Network.emulateNetworkConditions",
        {
            "offline": False,
            "latency": 80,
            "downloadThroughput": 1024 * 1024,
            "uploadThroughput": 1024 * 1024,
        },
    )
    records = []
    for visit in ["cold", "revisit"]:
        page.goto(base, wait_until="domcontentloaded")
        page.wait_for_selector("#start")
        visible = page.evaluate(PROBE)
        # 取得量は初期の全要求が終わった時点。表示時刻とは別の値。
        page.wait_for_load_state("networkidle", timeout=90000)
        resources = page.evaluate("""performance.getEntriesByType('resource')
            .filter(e=>/\\.(png|webp)(\\?|$)/.test(e.name))
            .map(e=>({url:e.name,start:e.startTime,end:e.responseEnd,
              transfer:e.transferSize,encoded:e.encodedBodySize}))""")
        records.append(
            {
                "version": version,
                "visit": visit,
                **visible,
                "resources": resources,
                "imageBytes": sum(r["transfer"] for r in resources),
                "requests": len(resources),
            }
        )
    context.close()
    return records


def main():
    OUT.mkdir(exist_ok=True)
    before_only = "--before" in sys.argv

    class VersionHandler(Handler):
        def translate_path(self, path):
            name = path.split("/")[-1].split("?")[0]
            original = OUT / "before" / name
            if (
                self.server.version == "before"
                and "/products/word-guild/" in path
                and original.is_file()
            ):
                return str(original)
            return super().translate_path(path)

    server = BrowserServer(ROOT)
    server.version = "before"
    server.RequestHandlerClass = partial(VersionHandler, directory=str(ROOT))
    with server, sync_playwright() as pw:
        options = {} if Path(pw.chromium.executable_path).is_file() else {"channel": "chrome"}
        browser = pw.chromium.launch(headless=True, **options)
        base = server.url + "/products/word-guild/index.html"
        result = {
            "conditions": {
                "latency_ms": 80,
                "bytes_per_second": 1048576,
                "viewport": [390, 844],
                "display": "visible images decoded + two RAF",
                "before_assets": "変更前v4のPNGと起動時先読み",
                "after_assets": "キャラv8と歩行v9 lossless 256px・背景v6・UI v7・凍結v9",
            },
            "before": measure(browser, base, "before"),
        }
        if not before_only:
            before_flow = measure_flow(browser, base, "before")
            server.version = "after"
            result["after"] = measure(browser, base, "after")
            after_flow = measure_flow(browser, base, "after")
            # 失敗時も実測を残し、空白の問題を撮影待機で隠さない。
            (OUT / "flow-observations.json").write_text(
                json.dumps(
                    {"before": before_flow, "after": after_flow}, ensure_ascii=False, indent=2
                ),
                encoding="utf-8",
            )
            result["flow_checks"] = verify_flows(before_flow, after_flow)
            a, b = result["before"][0], result["after"][0]
            assert b["imageBytes"] < a["imageBytes"] * 0.3, "初期転送量削減"
            assert b["displayAt"] < a["displayAt"], "同一条件で表示が速い"
            assert not any(
                "return-" in r["url"] or "generated-v4.png" in r["url"] for r in b["resources"]
            ), "帰還・旧PNGの初期取得なし"
            assert result["after"][1]["imageBytes"] < b["imageBytes"] * 0.02, "再訪で画像再転送なし"
            (OUT / "performance.json").write_text(
                json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8"
            )
            result["display_checks"] = verify(browser, base)
            result["passed"] = True
        browser.close()
    name = "baseline.json" if before_only else "performance.json"
    (OUT / name).write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8")
    print(
        json.dumps(
            {
                k: [
                    {
                        "visit": r["visit"],
                        "ms": round(r["displayAt"]),
                        "bytes": r["imageBytes"],
                        "requests": r["requests"],
                    }
                    for r in v
                ]
                for k, v in result.items()
                if k in ["before", "after"]
            }
        )
    )


if __name__ == "__main__":
    main()
