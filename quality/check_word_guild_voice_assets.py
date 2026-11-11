"""Strict voice asset audit, production pipeline self-test, and real WebAudio test.

Default exits nonzero until every approved script line has generated audio.
--self-test/--browser test code only; passing them does NOT certify AI full voice.
All test fixtures stay in memory; no dummy audio is written to product assets.
"""

from __future__ import annotations

import argparse
import hashlib
import importlib.util
import io
import json
import math
import struct
import sys
import threading
import time
import wave
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
VOICE = ROOT / "products/word-guild/assets/voice"
ROLES = {"male", "female", "guide", "cat", "dog", "sun", "ant", "animal", "final"}


def digest(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def generator_module():
    spec = importlib.util.spec_from_file_location(
        "voice_generator", ROOT / "quality/generate_word_guild_voice.py"
    )
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def line_provenance_issues(line: dict, clip: dict, cast: dict, generator) -> list[str]:
    """Audit script-to-clip identity and the exact recorded inference recipe."""
    key = line["voiceKey"]
    issues = []
    if any(clip.get(field) != line[field] for field in ("id", "speaker", "text", "reading")):
        issues.append(f"字幕・読み・配役の不一致: {key}")
    if clip.get("file") != line["speaker"]:
        issues.append(f"話者別WAVの取り違え: {key}")
    try:
        expected = generator.settings(line, cast)
    except (KeyError, TypeError, ValueError) as error:
        issues.append(f"配役・推論条件が不正: {key}: {error}")
    else:
        if clip.get("conditions") != expected:
            issues.append(f"脚本と感情・速度・seed等の生成条件が不一致: {key}")
    if clip.get("direction") != line.get("direction", "") or clip.get("targetSeconds") != line.get(
        "targetSeconds"
    ):
        issues.append(f"演技指示・目標尺の記録が不一致: {key}")
    return issues


def audit(script_source: str | None = None) -> dict:
    issues = []
    manifest = json.loads((VOICE / "manifest.json").read_text(encoding="utf-8"))
    if manifest.get("status") != "complete" or not manifest.get("generator", {}).get("generated"):
        issues.append("AI音声が未完成: " + str(manifest.get("reason") or manifest.get("status")))
    if set(manifest.get("files", {})) != ROLES:
        issues.append("9話者の実音声ファイルが揃っていない")
    cast = manifest.get("cast", {})
    if set(cast) != ROLES:
        issues.append("9話者の配役表が揃っていない")
    generator = generator_module()
    if cast.get("guide", {}).get("model") not in {"jvnv-F1-jp", "jvnv-F2-jp"}:
        issues.append("最新依頼のしるべ女性モデルが反映されていない")
    if cast.get("guide", {}).get("model") == cast.get("female", {}).get("model"):
        issues.append("しるべと女性主人公の声モデルが区別されていない")
    if manifest.get("status") == "complete":
        production = manifest.get("generator", {})
        if (
            production.get("version") != generator.VERSION
            or production.get("device") != "cpu"
            or production.get("language") != "JP"
        ):
            issues.append("生成エンジン・言語・deviceの記録が不正")
        expected_models = {role.get("model") for role in manifest.get("cast", {}).values()}
        hashes = production.get("modelsSha256", {})
        for model in expected_models:
            if hashes.get(model) != generator.MODEL_SHA256.get(model) or model is None:
                issues.append(f"モデルの公式SHAと生成記録が不一致: {model}")
        bert = production.get("bert", {})
        if bert.get("revision") != generator.BERT_REVISION:
            issues.append("日本語BERTの固定リビジョン記録が不一致")
        bert_hashes = bert.get("filesSha256", {})
        weights = set(bert_hashes) & set(generator.BERT_WEIGHTS_SHA256)
        if not weights or any(
            bert_hashes[name] != generator.BERT_WEIGHTS_SHA256[name] for name in weights
        ):
            issues.append("日本語BERTの元重みSHAが公式固定SHAと不一致")
    script = (
        Path(script_source) if script_source else ROOT / "products/word-guild/dialogue-script.json"
    )
    if not script.is_file():
        issues.append("確定脚本dialogue-script.jsonがない")
    else:
        source = script.read_bytes()
        if manifest.get("scriptSha256") != digest(source):
            issues.append("生成時の脚本SHAが現行脚本と違う")
        try:
            script_data = json.loads(source.decode("utf-8"))
            expected = generator.read_lines(script_data)
            issues.extend(generator.latest_script_issues(script_data, cast))
            if {line["voiceKey"] for line in expected} != set(manifest.get("lines", {})):
                issues.append("台詞と音声区間が一対一で対応していない")
            for line in expected:
                clip = manifest.get("lines", {}).get(line["voiceKey"], {})
                issues.extend(line_provenance_issues(line, clip, cast, generator))
        except ValueError as error:
            issues.append(str(error))
    audio = {}
    for role, metadata in manifest.get("files", {}).items():
        if role not in ROLES or metadata.get("url") != f"{role}-v1.wav":
            issues.append(f"担当外の音声ファイル: {role}")
            continue
        path = VOICE / metadata["url"]
        if not path.is_file():
            issues.append(f"実音声がない: {role}")
            continue
        raw = path.read_bytes()
        if len(raw) != metadata.get("bytes"):
            issues.append(f"ファイル容量不一致: {role}")
        if digest(raw) != metadata.get("sha256"):
            issues.append(f"ファイルSHA不一致: {role}")
        try:
            with wave.open(io.BytesIO(raw), "rb") as wav:
                if (wav.getnchannels(), wav.getsampwidth(), wav.getframerate()) != (1, 2, 44100):
                    issues.append(f"PCM形式不一致: {role}")
                if (
                    metadata.get("channels") != wav.getnchannels()
                    or metadata.get("sampleRate") != wav.getframerate()
                ):
                    issues.append(f"PCM形式のmanifest記録不一致: {role}")
                pcm = wav.readframes(wav.getnframes())
                audio[role] = (pcm, wav.getnframes(), wav.getframerate())
                duration = wav.getnframes() / wav.getframerate()
                if abs(duration - metadata.get("duration", -1)) > 1 / wav.getframerate():
                    issues.append(f"ファイル尺不一致: {role}")
        except (wave.Error, EOFError) as error:
            issues.append(f"破損WAV: {role}: {error}")
    intervals = {}
    for key, clip in manifest.get("lines", {}).items():
        role = clip.get("file")
        if role not in audio:
            issues.append(f"区間の実音声がない: {key}")
            continue
        pcm, frames, rate = audio[role]
        start, end = clip.get("startSample"), clip.get("endSample")
        if type(start) is not int or type(end) is not int or not 0 <= start < end <= frames:
            issues.append(f"区間範囲不正: {key}")
            continue
        if (
            abs(clip.get("start", -1) - start / rate) > 1 / rate
            or abs(clip.get("end", -1) - end / rate) > 1 / rate
            or abs(clip.get("duration", -1) - (end - start) / rate) > 1 / rate
        ):
            issues.append(f"区間の秒数不一致: {key}")
        selected = pcm[start * 2 : end * 2]
        if digest(selected) != clip.get("pcmSha256"):
            issues.append(f"区間SHA不一致: {key}")
        samples = [sample[0] / 32768 for sample in struct.iter_unpack("<h", selected)]
        rms = math.sqrt(sum(value * value for value in samples) / len(samples))
        if abs(rms - clip.get("rms", -1)) > 0.000001:
            issues.append(f"区間RMSの記録不一致: {key}")
        if sum(abs(value) >= 32760 / 32768 for value in samples) / len(samples) > 0.01:
            issues.append(f"音声クリッピングが多すぎる: {key}")
        if rms < 0.0001 or (end - start) / rate < 0.15:
            issues.append(f"無音・短すぎる音声: {key}")
        params = clip.get("conditions", {})
        if params.get("language") != "JP" or params.get("text") != clip.get("reading"):
            issues.append(f"推論条件不一致: {key}")
        intervals.setdefault(role, []).append((start, end, key))
    for role, entries in intervals.items():
        ordered = sorted(entries)
        for left, right in zip(ordered, ordered[1:], strict=False):
            if left[1] > right[0]:
                issues.append(f"区間重複: {role}: {left[2]} / {right[2]}")
    return {
        "passed": not issues,
        "scope": "generated-AI-voice-assets",
        "issues": issues,
        "files": len(audio),
        "lines": len(manifest.get("lines", {})),
        "human_checks": ["日本語の読み、声質、演技と漫才の間、iPhoneでの聴感は人が確認する"],
    }


def self_test() -> dict:
    import numpy as np

    generator = generator_module()
    cast = json.loads((VOICE / "manifest.json").read_text(encoding="utf-8"))["cast"]
    lines = generator.read_lines(
        {
            "lines": [
                {
                    "id": "a",
                    "speaker": "hero",
                    "variants": {
                        "male": {"text": "一歩進む", "reading": "いっぽすすむ"},
                        "female": {"text": "進もう", "reading": "すすもう"},
                    },
                },
                {
                    "id": "b",
                    "speaker": "guide",
                    "text": "ええっ",
                    "reading": "ええっ",
                    "style": "Surprise",
                },
            ]
        }
    )
    assert [line["voiceKey"] for line in lines] == ["a.male", "a.female", "b"]
    calls = []

    def infer(role, params):
        calls.append((role, params))
        # Explicit synthetic test fixture, never saved and never counted as AI dialogue.
        return 44100, (np.sin(np.arange(22050) * 0.08) * 3000).astype(np.int16)

    voice, clips = generator.pack_speaker(
        [lines[0], {**lines[0], "voiceKey": "a.second"}], infer, cast
    )
    with wave.open(io.BytesIO(voice), "rb") as wav:
        assert (wav.getframerate(), wav.getnchannels(), wav.getsampwidth()) == (44100, 1, 2)
        pcm = wav.readframes(wav.getnframes())
    assert calls[0][1]["text"] == "いっぽすすむ"
    assert clips["a.male"]["duration"] == 0.5
    assert clips["a.second"]["startSample"] == round(44100 * 0.58)
    for clip in clips.values():
        assert digest(pcm[clip["startSample"] * 2 : clip["endSample"] * 2]) == clip["pcmSha256"]
    original = clips["a.male"]
    assert not line_provenance_issues(lines[0], original, cast, generator)
    for field, value in (
        ("file", "female"),
        ("speaker", "female"),
        ("reading", "べつのよみ"),
        ("direction", "別の演技"),
        ("targetSeconds", 99),
    ):
        assert line_provenance_issues(lines[0], {**original, field: value}, cast, generator)
    for field, value in (
        ("style", "Angry"),
        ("style_weight", 1.9),
        ("length", 1.9),
        ("seed", -1),
    ):
        changed = {**original, "conditions": {**original["conditions"], field: value}}
        assert line_provenance_issues(lines[0], changed, cast, generator)
    assert line_provenance_issues(lines[0], original, {}, generator)
    try:
        generator.pack_speaker(
            [lines[0]], lambda *_: (44100, np.zeros(22050, dtype=np.int16)), cast
        )
        raise AssertionError("無音が拒否されない")
    except ValueError:
        pass
    try:
        generator.read_lines([lines[0], lines[0]])
        raise AssertionError("重複voiceKeyが拒否されない")
    except ValueError:
        pass
    try:
        generator.settings({**lines[0], "style": "Invented"}, cast)
        raise AssertionError("未知styleが拒否されない")
    except ValueError:
        pass
    female_cast = generator.production_cast({"cast": cast})
    assert cast["guide"] != female_cast["guide"] or cast["guide"]["model"] == "jvnv-F2-jp"
    assert female_cast["guide"]["model"] == "jvnv-F2-jp"
    valid = {
        "events": [
            {
                "event": "flight.launch",
                "lines": [
                    {
                        "id": "flight.hero.launch",
                        "speaker": "hero",
                        "variants": {
                            hero: {"text": "うわああああああ", "reading": "うわああああああ"}
                            for hero in ("male", "female")
                        },
                    }
                ],
            }
        ]
    }
    assert not generator.latest_script_issues(valid, female_cast)
    assert generator.latest_script_issues(valid, {**female_cast, "guide": cast["animal"]})
    assert generator.latest_script_issues({"events": []}, female_cast)
    assert generator.latest_script_issues(
        {
            "events": [
                *valid["events"],
                {
                    "event": "flight.land",
                    "lines": [{"id": "old", "speaker": "guide", "text": "着いた"}],
                },
            ]
        },
        female_cast,
    )
    old = json.loads(json.dumps(valid))
    old["events"][0]["lines"][0]["variants"]["male"]["text"] = "森が真横に"
    assert generator.latest_script_issues(old, female_cast)
    return {
        "passed": True,
        "scope": "pipeline-code-only",
        "checks": 27,
        "generatedAI": False,
        "fixture": "in-memory-synthetic-PCM-only",
    }


PRODUCTION_HTML = """<!doctype html><meta charset=utf-8>
<button id=start>同梱音声の再生検査</button><script type=module>
import {VoicePlayer} from '/voice-player.mjs';
window.sources=[];window.ended=[];
document.querySelector('#start').onclick=async()=>{
 window.ctx=new AudioContext({sampleRate:44100});await ctx.resume();
 window.manifest=await (await fetch('/manifest.json')).json();
 const create=ctx.createBufferSource.bind(ctx);
 ctx.createBufferSource=()=>{const s=create();sources.push(s);return s;};
 window.player=new VoicePlayer(ctx,{manifest,baseURL:location.href,
 onEnded:id=>ended.push(id)});
 window.decoded=[];
 for(const [role,file] of Object.entries(manifest.files)){
  const raw=await (await fetch('/'+file.url)).arrayBuffer();
  const b=await ctx.decodeAudioData(raw);
  decoded.push({role,rate:b.sampleRate,channels:b.numberOfChannels,duration:b.duration});
 }
 window.guideKey=Object.keys(manifest.lines).find(k=>manifest.lines[k].speaker==='guide');
 window.firstResult=await player.play({id:'guide-test',voiceKey:guideKey});
};</script>"""


def production_browser_test(script_source: str | None = None) -> dict:
    """Decode the actual nine voice WAVs and operate actual guide/flight clips."""
    from playwright.sync_api import sync_playwright

    verified = audit(script_source)
    if not verified["passed"]:
        return verified
    metadata = json.loads((VOICE / "manifest.json").read_text(encoding="utf-8"))
    requests, errors, checks = [], [], []

    class Handler(BaseHTTPRequestHandler):
        def log_message(self, *_):
            pass

        def do_GET(self):
            requests.append(self.path)
            status = 200
            if self.path == "/":
                body, mime = PRODUCTION_HTML.encode(), "text/html;charset=utf-8"
            elif self.path == "/voice-player.mjs":
                body, mime = (
                    (ROOT / "products/word-guild/voice-player.mjs").read_bytes(),
                    "text/javascript",
                )
            elif self.path == "/manifest.json":
                body, mime = (VOICE / "manifest.json").read_bytes(), "application/json"
            elif self.path[1:] in {file["url"] for file in metadata["files"].values()}:
                body, mime = (VOICE / self.path[1:]).read_bytes(), "audio/wav"
            else:
                body, mime, status = b"not found", "text/plain", 404
            self.send_response(status)
            self.send_header("Content-Type", mime)
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)

    server = ThreadingHTTPServer(("127.0.0.1", 0), Handler)
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    try:
        with sync_playwright() as playwright:
            options = {"headless": True}
            if not Path(playwright.chromium.executable_path).is_file():
                options["channel"] = "chrome"
            browser = playwright.chromium.launch(**options)
            page = browser.new_page()
            page.on("pageerror", lambda error: errors.append(str(error)))
            page.goto(f"http://127.0.0.1:{server.server_port}/")
            page.locator("#start").click()
            page.wait_for_function("window.firstResult?.status==='playing'", timeout=30000)
            decoded = page.evaluate("decoded")
            assert len(decoded) == 9
            for item in decoded:
                assert item["rate"] == 44100 and item["channels"] == 1
                assert (
                    abs(item["duration"] - metadata["files"][item["role"]]["duration"]) < 1 / 44100
                )
                checks.append(item["role"] + ": 実WAVのPCM形式・尺をChromiumでdecode")
            page.wait_for_function("player.snapshot.position>.15")
            # Observe reuse in one JS turn; natural completion cannot race the comparison.
            observed = page.evaluate("""()=>{
              const before={position:player.snapshot.position,sources:sources.length};
              void player.play({id:'guide-test',voiceKey:guideKey});
              return {before,after:{position:player.snapshot.position,sources:sources.length}};
            }""")
            assert observed["before"]["sources"] == observed["after"]["sources"]
            assert observed["after"]["position"] >= observed["before"]["position"]
            checks.append("女性しるべの実区間が再描画で再開しない")
            page.evaluate("player.pause();window.paused=player.snapshot.position")
            page.wait_for_timeout(120)
            assert page.evaluate("player.snapshot.position===paused")
            page.evaluate("player.resume()")
            page.wait_for_function("player.snapshot.position>paused+.1")
            checks.append("女性しるべの実区間を停止・途中から再開")
            page.wait_for_function("ended.includes('guide-test')", timeout=12000)
            assert page.evaluate("ended.filter(id=>id==='guide-test').length") == 1
            checks.append("女性しるべの自然終了通知は一回")
            for hero in ("male", "female"):
                key = f"flight.hero.launch.{hero}"
                result = page.evaluate("key=>player.play({id:key,voiceKey:key})", key)
                assert result["status"] == "playing"
                page.wait_for_function("player.snapshot.position>.08")
                page.evaluate("player.stop()")
                assert page.evaluate("player.snapshot.state") == "idle"
                checks.append(hero + ": 実音声の叫びを一度開始し停止")
            assert not errors
            page.evaluate("player.dispose();ctx.close()")
            browser.close()
    finally:
        server.shutdown()
        server.server_close()
        thread.join(timeout=2)
    return {
        "passed": True,
        "scope": "production-WAV-real-WebAudio",
        "checks": checks,
        "generatedAI": True,
        "decoded": decoded,
        "errors": errors,
        "requests": requests,
        "fullGameIntegration": "not-run",
        "audition": "not-run",
        "iphone": "not-run",
    }


BROWSER_HTML = """<!doctype html><meta charset=utf-8><button id=start>再生検査開始</button>
<script type=module>
import {VoicePlayer} from '/voice-player.mjs';
const events=[],sources=[]; window.events=events;window.sources=sources;
const manifest={files:{a:{url:'fixture.wav'},slow:{url:'slow.wav'},bad:{url:'bad.wav'}},
lines:{one:{file:'a',start:1,end:4},two:{file:'a',start:5,end:5.3},
slow:{file:'slow',start:0,end:2},bad:{file:'bad',start:0,end:2}}};
document.querySelector('#start').onclick=async()=>{
 const ctx=new AudioContext();window.ctx=ctx;
 const original=ctx.createBufferSource.bind(ctx);
 ctx.createBufferSource=()=>{const source=original();sources.push(source);return source;};
 const bgm=ctx.createOscillator(),gain=ctx.createGain();
 gain.gain.value=.25;bgm.connect(gain);gain.connect(ctx.destination);bgm.start();
 window.bgm=bgm;window.bgmGain=gain;window.bgmStartedAt=ctx.currentTime;window.bgmStarts=1;
 window.player=new VoicePlayer(ctx,{manifest,baseURL:location.href,
 onEnded:id=>events.push(['ended',id]),
 onSpeaking:v=>{events.push(['speaking',v]);gain.gain.setTargetAtTime(v?.08:.25,ctx.currentTime,.025);},
 onError:e=>events.push(['error',e.code])});
 window.firstResult=await player.play({id:'event-1',voiceKey:'one'});
};
</script>"""


def browser_test() -> dict:
    from playwright.sync_api import sync_playwright

    # A six-second sine fixture validates real decoding/transport; not a voice substitute.
    stream = io.BytesIO()
    with wave.open(stream, "wb") as wav:
        wav.setnchannels(1)
        wav.setsampwidth(2)
        wav.setframerate(44100)
        wav.writeframes(
            b"".join(
                struct.pack("<h", round(1500 * math.sin(i * 2 * math.pi * 330 / 44100)))
                for i in range(44100 * 6)
            )
        )
    fixture = stream.getvalue()
    requests = []

    class Handler(BaseHTTPRequestHandler):
        def log_message(self, *_):
            pass

        def do_GET(self):
            requests.append(self.path)
            status = 200
            if self.path == "/":
                body, mime = BROWSER_HTML.encode(), "text/html;charset=utf-8"
            elif self.path == "/voice-player.mjs":
                body, mime = (
                    (ROOT / "products/word-guild/voice-player.mjs").read_bytes(),
                    "text/javascript",
                )
            elif self.path in {"/fixture.wav", "/slow.wav"}:
                if self.path == "/slow.wav":
                    time.sleep(0.25)
                body, mime = fixture, "audio/wav"
            else:
                body, mime, status = b"not found", "text/plain", 503
            self.send_response(status)
            self.send_header("Content-Type", mime)
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)

    server = ThreadingHTTPServer(("127.0.0.1", 0), Handler)
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    checks = []
    try:
        with sync_playwright() as playwright:
            launch_options = {"headless": True}
            if not Path(playwright.chromium.executable_path).is_file():
                launch_options["channel"] = "chrome"
            browser = playwright.chromium.launch(**launch_options, timeout=30000)
            page = browser.new_page()
            page.set_default_timeout(8000)
            page.on(
                "pageerror",
                lambda error: print(f"Browser JavaScript error: {error}", file=sys.stderr),
            )
            page.goto(f"http://127.0.0.1:{server.server_port}/", timeout=10000)
            page.locator("#start").click()
            try:
                page.wait_for_function("window.firstResult?.status === 'playing'")
            except Exception:
                print(
                    page.evaluate(
                        "({result:window.firstResult,context:window.ctx?.state,voice:window.player?.snapshot,events:window.events})"
                    ),
                    file=sys.stderr,
                )
                raise
            page.wait_for_function("player.snapshot.position > .15")
            assert page.evaluate("ctx.state") == "running"
            checks.append("実タップでAudioContextを有効化し実WAVをdecode・区間再生")
            before = page.evaluate("player.snapshot.position")
            page.evaluate("player.play({id:'event-1',voiceKey:'one'})")
            assert page.evaluate("sources.length") == 1
            assert page.evaluate("player.snapshot.position") >= before
            checks.append("同じ発話の更新でsourceと進行を保持")
            assert page.evaluate("bgmGain.gain.value") < 0.15
            page.evaluate("player.pause();window.pausedPosition=player.snapshot.position")
            page.wait_for_timeout(120)
            assert page.evaluate("player.snapshot.position===pausedPosition")
            assert page.evaluate("bgmGain.gain.value") > 0.2
            page.evaluate("player.resume()")
            page.wait_for_function("player.snapshot.position > pausedPosition + .1")
            assert page.evaluate("sources.length") == 2
            checks.append("pause/resume位置保持とgainのダッキング・復元")
            bgm_time = page.evaluate("ctx.currentTime-bgmStartedAt")
            page.evaluate("void player.play('slow')")
            page.wait_for_function(
                "player.snapshot.loadingFiles.some(url=>url.endsWith('/slow.wav'))"
            )
            page.evaluate("player.stop()")
            page.wait_for_timeout(350)
            assert page.evaluate("player.snapshot.state") == "idle"
            assert page.evaluate("sources.length") == 2
            checks.append("停止後の取得完了でも復活しない")
            # Ensure a genuinely pending fetch, then invalidate it with pause/resume.
            page.evaluate("window.slow=player.play('slow')")
            page.wait_for_function("player.snapshot.state === 'playing'")
            page.evaluate("player.pause();window.slowPosition=player.snapshot.position")
            page.evaluate("player.resume()")
            page.wait_for_function("player.snapshot.position > slowPosition + .1")
            checks.append("取得と再開で実AudioBufferを共有")
            result = page.evaluate("player.play('bad')")
            assert result["status"] == "error" and result["code"] == "VOICE_FETCH"
            assert page.evaluate("player.snapshot.speaking") is False
            checks.append("503はエラー通知へ渡しBGMは継続")
            page.evaluate("player.play('two')")
            page.wait_for_function("events.some(e=>e[0]==='ended'&&e[1]==='two')")
            assert page.evaluate("events.filter(e=>e[0]==='ended').length") == 1
            checks.append("区間の自然終了だけが終了通知を出す")
            assert page.evaluate("ctx.currentTime-bgmStartedAt") > bgm_time
            assert page.evaluate("bgmStarts") == 1
            checks.append("共有AudioContextのBGM sourceを停止・再生成しない")
            assert requests.count("/fixture.wav") == 1
            assert requests.count("/slow.wav") == 1
            checks.append("実HTTPでURL単位の取得1回")
            assert page.evaluate(
                "Object.isFrozen(player.snapshot)&&Object.isFrozen(player.snapshot.cachedFiles)"
            )
            checks.append("実ブラウザーでsnapshotを凍結")
            page.evaluate("player.dispose();bgm.stop();ctx.close()")
            browser.close()
    finally:
        server.shutdown()
        server.server_close()
        thread.join(timeout=2)
    return {
        "passed": True,
        "scope": "VoicePlayer-real-WebAudio-only",
        "checks": checks,
        "generatedAI": False,
        "fullGameIntegration": "not-run",
        "iphone": "not-run",
    }


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--self-test", action="store_true")
    parser.add_argument("--browser", action="store_true")
    parser.add_argument("--production-browser", action="store_true")
    parser.add_argument(
        "--script-source", help="Read-only finalized script to audit isolated integration"
    )
    args = parser.parse_args()
    sys.dont_write_bytecode = True
    result = (
        self_test()
        if args.self_test
        else browser_test()
        if args.browser
        else production_browser_test(args.script_source)
        if args.production_browser
        else audit(args.script_source)
    )
    print(json.dumps(result, ensure_ascii=False, indent=2))
    return 0 if result["passed"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
