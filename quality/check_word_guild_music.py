"""採用無料音源・ローカル同梱・実デコード・PCMとループ境界を確認。"""

import hashlib
import json
import sys
from pathlib import Path

from browser_server import BrowserServer
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]


def run():
    checks = []

    def check(condition, message):
        assert condition, message
        checks.append(message)

    downloads = json.loads((ROOT / "quality/free-music-download.json").read_text(encoding="utf-8"))
    downloads += [
        {
            "name": "Breeze3",
            "file": "products/word-guild/assets/music/breeze3-loop.mp3",
            "sha256": "af28f57d01b093111a96a759d55a1a9533cd9d3f2a1de50803f38c3e5eb1ea75",
        },
        {
            "name": "Raid",
            "file": "products/word-guild/assets/music/raid-loop.mp3",
            "sha256": "a7cec2bf3d701af2984c1d9c45eef6e012751c2d8af00f0e20d53e82c37cf70c",
        },
    ]
    for item in downloads:
        file = ROOT / item["file"]
        check(file.is_file(), f"公式取得ファイル存在: {item['name']}")
        check(
            hashlib.sha256(file.read_bytes()).hexdigest() == item["sha256"],
            f"取得後無改変: {item['name']}",
        )
        if file.suffix == ".wgm":
            check(file.read_bytes()[:4] == b"WGM1", f"独自ゲームデータへ変換: {item['name']}")
    check(
        not list((ROOT / "products/word-guild/assets/music").glob("*gudaguda*.mp3")),
        "帰還用原MP3を配信しない",
    )
    check(
        not list((ROOT / "products/word-guild/assets/music").glob("*nandeshou*.mp3")),
        "ホーム用原MP3を配信しない",
    )
    credits = (ROOT / "products/word-guild/assets/music/CREDITS.md").read_text(encoding="utf-8")
    for term in [
        "Flap2",
        "Breeze3",
        "Raid",
        "SHA256",
        "PeriTune",
        "CC BY 4.0",
        "creativecommons.org/licenses/by/4.0",
        "なんでしょう？",
        "KK",
        "ぐだぐだな感じ",
        "yuki",
        "opentracks.com/help/articles/license",
        "8ms",
    ]:
        check(term in credits, f"クレジットと加工記録: {term}")
    metrics = []
    server = BrowserServer(ROOT)
    with server, sync_playwright() as p:
        options = {} if Path(p.chromium.executable_path).is_file() else {"channel": "chrome"}
        browser = p.chromium.launch(headless=True, **options)
        page = browser.new_page()
        page.goto(server.url + "/products/word-guild/index.html?dev=1&scene=home")
        page.click("#music")
        # 本番Musicのデコード済みbufferとgainを独立インスタンスで検査。
        metrics = page.evaluate("""async()=>{
            const {Music}=await import('./core.mjs'),{MUSIC_CUES}=await import('./music-cues.mjs');
            const ctx=new AudioContext(), m=new Music(()=>ctx), rows=[];
            for(const scene of ['top','battle','boss','final','return']){
                await m.play(scene);const s=m.source,b=s.buffer;
                const l=b.getChannelData(0),r=b.getChannelData(1);
                let energy=0,width=0,peak=0,clipped=0,count=0,quiet=0,longest=0;
                for(let i=0;i<l.length;i+=128){
                    energy+=(l[i]*l[i]+r[i]*r[i])/2;width+=(l[i]-r[i])**2;
                    peak=Math.max(peak,Math.abs(l[i]),Math.abs(r[i]));
                    clipped+=Math.abs(l[i])>=1||Math.abs(r[i])>=1?1:0;count++;
                    if(Math.max(Math.abs(l[i]),Math.abs(r[i]))<.0001){
                        quiet++;longest=Math.max(longest,quiet);
                    }else quiet=0;
                }
                rows.push({scene,track:m.track,duration:b.duration,sampleRate:b.sampleRate,channels:b.numberOfChannels,rms:Math.sqrt(energy/count),stereo:Math.sqrt(width/count),peak,clipped,jump:Math.max(Math.abs(l[0]-l.at(-1)),Math.abs(r[0]-r.at(-1))),longestSilence:longest*128/b.sampleRate,loop:s.loop,start:s.loopStart,end:s.loopEnd,gain:MUSIC_CUES[scene].gain});
            }
            m.stop();await ctx.close();return rows;
        }""")
        browser.close()
    for row in metrics:
        name = row["scene"]
        check(
            row["channels"] == 2 and row["duration"] > 30, f"{name}: 実デコードのステレオ・十分な尺"
        )
        check(
            row["loop"] and row["start"] == 0 and row["end"] == row["duration"],
            f"{name}: 全長の排他的ループ区間",
        )
        check(0.005 < row["rms"] < 0.7 and row["stereo"] > 0.001, f"{name}: 非ゼロPCM・左右の違い")
        check(row["rms"] * row["gain"] < 0.3, f"{name}: 出力RMSに音量余裕")
        check(row["peak"] * row["gain"] < 0.95, f"{name}: 出力ピークに音量余裕")
        check(row["jump"] == 0, f"{name}: フェード後のループ境界段差ゼロ")
        check(row["longestSilence"] < 3, f"{name}: 長い無音混入なし")
    return {
        "passed": True,
        "checks": checks,
        "metrics": metrics,
        "downloads": downloads,
        "server": server.snapshot(),
        "human_checks": [
            "iPhone実機再生",
            "聴き心地と非ループ原曲の周回の自然さ",
            "jabo1398指定版の一致",
        ],
    }


if __name__ == "__main__":
    result = run()
    if "--no-write" not in sys.argv:
        (ROOT / "quality/music-check-results.json").write_text(
            json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8"
        )
    else:
        print(
            json.dumps(
                {"metrics": result["metrics"], "checks": result["checks"]}, ensure_ascii=False
            )
        )
    print(f"PASS: {len(result['checks'])} official music / PCM / loop assertions")
