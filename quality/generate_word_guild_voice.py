"""Offline CPU production using the isolated workspace generation environment.

No implicit installs/downloads; writes only the nine owned WAVs, manifest,
and owned revision report (including embedded comparison audio).
Run with -B in a prepared isolated environment. --probe never writes files.
See products/word-guild/assets/voice/CREDITS.md for setup and integration.
"""

from __future__ import annotations

import argparse
import base64
import copy
import gc
import hashlib
import importlib.metadata
import io
import json
import math
import os
import sys
import wave
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
VOICE = ROOT / "products/word-guild/assets/voice"
SCRIPT = ROOT / "products/word-guild/dialogue-script.json"
MANIFEST = VOICE / "manifest.json"
REVISION = ROOT / "quality/voice-generation/revision-v2.json"
ROLES = ("male", "female", "guide", "cat", "dog", "sun", "ant", "animal", "final")
MODEL_FILES = {
    "jvnv-F1-jp": "jvnv-F1-jp_e160_s14000.safetensors",
    "jvnv-F2-jp": "jvnv-F2_e166_s20000.safetensors",
    "jvnv-M1-jp": "jvnv-M1-jp_e158_s14000.safetensors",
    "jvnv-M2-jp": "jvnv-M2-jp_e159_s17000.safetensors",
}
# Official HF tree LFS SHA256 and raw config/vector SHA256 at the pinned revision.
# Fetched read-only on 2026-10-08; the generator itself never contacts the registry.
MODEL_SHA256 = {
    "jvnv-F1-jp": {
        "config.json": "d310da5c1e9b095a833591b4bc07209631d6edece263da88e597aaf7f9984d3d",
        MODEL_FILES[
            "jvnv-F1-jp"
        ]: "a90fa6c9444d9235c9ec4db99daf7c5c6a21cc26ca141b4c48455d66a3257d01",
        "style_vectors.npy": "1f959bb45ed0922efc31ff24e9147253814f42cb1d2d1e2bb10391a9df368489",
    },
    "jvnv-F2-jp": {
        "config.json": "b8aff1fcd9a17a744ce4b9e3e8dc066f2d7d8deb16e0adb09edbdeb569777286",
        MODEL_FILES[
            "jvnv-F2-jp"
        ]: "f6289a6f30bb9795744815b9da764a3c8198b18652d9fddef82fff1e14f0e784",
        "style_vectors.npy": "900f8cde3a336d12193fec7b7d8e6c5dc77b3a5d719a9be3f8598389cd88e643",
    },
    "jvnv-M1-jp": {
        "config.json": "1a66da636d8a9f0eed4120c59cb1bf1077b819731cf2c960d799e87d383bc76c",
        MODEL_FILES[
            "jvnv-M1-jp"
        ]: "0d86765f1fe08dbba74cd06283e96b6941b3f232329fabbba9c30e6edc27887a",
        "style_vectors.npy": "7a925435e8c1c9efc8fc8e90e690655ab9a7bae00a790892e13e936510d04f05",
    },
    "jvnv-M2-jp": {
        "config.json": "6c14c32c69e92728ec29c5a8cda8d4938fd59c5d035896c8c4ff836887795835",
        MODEL_FILES[
            "jvnv-M2-jp"
        ]: "8245f39438076d36a3befd8aefb15c38830cef326c1f7c9d9c8e64b647645402",
        "style_vectors.npy": "c965bb63fa4a759d41a8a4a3649333125d6497ae8a705d81b7d5c5bd2854797c",
    },
}
STYLES = {"Neutral", "Angry", "Disgust", "Fear", "Happy", "Sad", "Surprise"}
VERSION = "2.5.0"  # Official PyPI wheel API checked; GitHub 2.7.0 is a different release.
BERT_REVISION = "547b0e8b044fba3f9b84d0ab9f990440bd130c8b"
BERT_WEIGHTS_SHA256 = {
    "pytorch_model.bin": "bf0dab8ad87bd7c22e85ec71e04f2240804fda6d33196157d6b5923af6ea1201",
    "model.safetensors": "2630f547d018524a7b03506a42c700cbac49e29bdc441845b0615bfb3b5d74d2",
}


def sha(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def file_sha(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as source:
        for chunk in iter(lambda: source.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def probe() -> dict:
    packages = {}
    for name in ("style-bert-vits2", "torch", "transformers", "numpy", "pyopenjtalk-dict"):
        try:
            packages[name] = importlib.metadata.version(name)
        except importlib.metadata.PackageNotFoundError:
            packages[name] = None
    return {
        "python": sys.version.split()[0],
        "packages": packages,
        "scriptExists": SCRIPT.is_file(),
        "requiredEngineVersion": VERSION,
        "ready": all(packages.values())
        and packages["style-bert-vits2"] == VERSION
        and SCRIPT.is_file(),
    }


def read_lines(script: dict | list) -> list[dict]:
    """Accept lines[]/lines{} or nested events; explicit voiceKey is preserved.

    A speaker='hero' line expands variants.male/female before generation.
    Variant objects can override text, reading, voiceKey, style, targetSeconds.
    No static fallback dialogue is silently turned into approved full voice.
    """
    result = []

    def visit(value, inherited_id=None):
        if isinstance(value, list):
            for item in value:
                visit(item)
        elif isinstance(value, dict):
            if "speaker" in value and ("text" in value or value.get("speaker") == "hero"):
                line = dict(value)
                line.setdefault("id", inherited_id)
                if line["speaker"] == "hero":
                    for hero in ("male", "female"):
                        variant = line.get("variants", {}).get(hero)
                        if not isinstance(variant, dict):
                            raise ValueError(f"男女別台詞がない: {line.get('id')}")
                        resolved = {**line, **variant, "speaker": hero}
                        resolved.pop("variants", None)
                        resolved["voiceKey"] = variant.get("voiceKey", f"{line['id']}.{hero}")
                        result.append(resolved)
                else:
                    result.append(line)
            else:
                for key, item in value.items():
                    if key not in {"cast", "speakers", "metadata"}:
                        visit(item, key)

    visit(script)
    keys = set()
    for line in result:
        if not isinstance(line.get("id"), str) or not line["id"]:
            raise ValueError("台詞IDが必要")
        line.setdefault("voiceKey", line["id"])
        line.setdefault("reading", line["text"])
        if line["speaker"] not in ROLES or not all(
            isinstance(line.get(key), str) and line[key] for key in ("voiceKey", "reading", "text")
        ):
            raise ValueError(f"話者・本文・読みが不正: {line['id']}")
        if line["voiceKey"] in keys:
            raise ValueError(f"voiceKeyの重複: {line['voiceKey']}")
        keys.add(line["voiceKey"])
    if not result:
        raise ValueError("確定脚本に音声化対象がない")
    return result


def settings(line: dict, cast: dict) -> dict:
    role = cast[line["speaker"]]
    style = line.get("style", role["style"])
    if "style" not in line:
        if line["id"].startswith(("raid.", "freezing.", "bewildered.", "flight.")):
            style = "Surprise"
        elif line.get("expression") == "joy":
            style = "Happy"
        elif line.get("expression") == "worried" and line["speaker"] in {"male", "female", "guide"}:
            style = "Surprise" if line["id"].startswith(("flight.", "raid.")) else "Sad"
    weight = float(line.get("styleWeight", role["styleWeight"]))
    length = float(line.get("length", role["length"]))
    if line["id"] == "flight.hero.launch":
        # A single continuous cry; do not synthesize repeated launch/fall/land lines.
        weight = float(line.get("styleWeight", 0.8))
        length = float(line.get("length", 1.35))
    if style not in STYLES or not math.isfinite(weight) or not 0 <= weight <= 2:
        raise ValueError(f"未知スタイル・強度: {line['voiceKey']}")
    if not math.isfinite(length) or not 0.5 <= length <= 2:
        raise ValueError(f"lengthが不正: {line['voiceKey']}")
    return {
        "text": line["reading"],
        "language": "JP",
        "style": style,
        "style_weight": weight,
        "length": length,
        "line_split": False,
        "seed": int(sha(line["voiceKey"].encode())[:8], 16),
    }


def production_cast(current: dict) -> dict:
    """A separate female voice identity, not a pitch shift of the old male guide."""
    cast = copy.deepcopy(current["cast"])
    cast["guide"].update(model="jvnv-F2-jp", style="Neutral", styleWeight=0.45, length=1.04)
    return cast


def latest_script_issues(script: dict, cast: dict) -> list[str]:
    issues = []
    if cast.get("guide", {}).get("model") not in {"jvnv-F1-jp", "jvnv-F2-jp"}:
        issues.append("しるべは女性モデルで再生成する必要がある")
    if cast.get("guide", {}).get("model") == cast.get("female", {}).get("model"):
        issues.append("しるべと女性主人公の声モデルを区別する必要がある")
    events = script.get("events", [])
    flight = [event for event in events if event.get("event", "").startswith("flight.")]
    launch = [event for event in flight if event["event"] == "flight.launch"]
    if len(launch) != 1 or len(launch[0].get("lines", [])) != 1:
        issues.append("飛行開始は主人公の叫び一行だけにする必要がある")
    for event in flight:
        lines = event.get("lines", [])
        if event["event"] != "flight.launch" and lines:
            issues.append("落下・着地で新しい発話を開始しない: " + event["event"])
        for line in read_lines(lines) if lines else []:
            if line["speaker"] not in {"male", "female"} or any(
                line[field] != "うわああああああ" for field in ("text", "reading")
            ):
                issues.append("飛行中の本文と読みは叫びだけ: " + line["voiceKey"])
    clear = [event for event in events if event.get("event") == "boss.clear"]
    if any("奥へ" in line["text"] for event in clear for line in read_lines(event["lines"])):
        issues.append("通常ボス撃破後に旧稿の『奥へ』が残っている")
    return issues


def pack_speaker(lines: list[dict], infer, cast: dict) -> tuple[bytes, dict]:
    """All clips are generated/validated in memory, then written as one speaker WAV."""
    import numpy as np

    clips, chunks, cursor, sample_rate = {}, [], 0, None
    for line in lines:
        params = settings(line, cast)
        print(f"Generating {line['voiceKey']} ({params['style']})", flush=True, file=sys.stderr)
        rate, audio = infer(line["speaker"], dict(params))
        data = np.asarray(audio)
        if data.ndim != 1 or rate != 44100:
            raise ValueError("JVNV JPの44100HzモノラルPCMが必要")
        if data.dtype != np.int16:
            raise ValueError("TTSModel.inferのint16 PCMが必要。無音の代用品は不可")
        if len(data) < int(rate * 0.15) or not np.any(data) or not np.isfinite(data).all():
            raise ValueError(f"無音・短すぎる音声: {line['voiceKey']}")
        rms = float(np.sqrt(np.mean((data.astype(np.float64) / 32768) ** 2)))
        if rms < 0.0001:
            raise ValueError(f"ほぼ無音の音声: {line['voiceKey']}")
        sample_rate = rate
        data = data.copy()
        original_rms = rms
        peak = float(np.max(np.abs(data.astype(np.float64)))) / 32768
        gain = min(1.8, max(0.6, 0.12 / rms), 0.96 / peak)
        data = np.rint(data.astype(np.float64) * gain).astype(np.int16)
        n = min(round(rate * 0.005), len(data) // 2)
        data[:n] = (data[:n] * np.linspace(0, 1, n)).astype(np.int16)
        data[-n:] = (data[-n:] * np.linspace(1, 0, n)).astype(np.int16)
        pcm = data.astype("<i2").tobytes()
        rms = float(np.sqrt(np.mean((data.astype(np.float64) / 32768) ** 2)))
        duration = len(data) / rate
        print(f"Generated {line['voiceKey']}: {duration:.3f}s", flush=True, file=sys.stderr)
        clips[line["voiceKey"]] = {
            "id": line["id"],
            "speaker": line["speaker"],
            "text": line["text"],
            "reading": line["reading"],
            "file": line["speaker"],
            "start": cursor / rate,
            "end": (cursor + len(data)) / rate,
            "startSample": cursor,
            "endSample": cursor + len(data),
            "duration": duration,
            "pcmSha256": sha(pcm),
            "rms": rms,
            "editing": {
                "sourceSampleRate": rate,
                "sourceRms": original_rms,
                "gain": gain,
                "fadeMilliseconds": 5,
                "gapMilliseconds": 80,
                "resampling": "none-native-44100Hz",
            },
            "conditions": params,
            "direction": line.get("direction", ""),
            "targetSeconds": line.get("targetSeconds"),
        }
        chunks.append(pcm)
        gap = round(rate * 0.08)
        chunks.append(b"\x00\x00" * gap)
        cursor += len(data) + gap
    if not clips:
        raise ValueError("空の話者音源は作らない")
    stream = io.BytesIO()
    with wave.open(stream, "wb") as output:
        output.setnchannels(1)
        output.setsampwidth(2)
        output.setframerate(sample_rate)
        output.writeframes(b"".join(chunks))
    return stream.getvalue(), clips


def generate(args) -> dict:
    environment = probe()
    if not environment["ready"]:
        raise RuntimeError(
            "確定脚本と隔離環境が必要: " + json.dumps(environment, ensure_ascii=False)
        )
    model_root, bert_root = Path(args.model_root).resolve(), Path(args.bert_root).resolve()
    dictionary_root = Path(args.dictionary_root).resolve()
    if not (dictionary_root / "sys.dic").is_file():
        raise ValueError("ダウンロード済みOpen JTalk辞書が必要（生成中に取得しない）")
    if not bert_root.is_dir() or not (bert_root / "config.json").is_file():
        raise ValueError("ダウンロード済みJP BERTのローカルディレクトリが必要")
    if (
        not (bert_root / "pytorch_model.bin").is_file()
        and not (bert_root / "model.safetensors").is_file()
    ):
        raise ValueError("JP BERTの重みがない")
    bert_provenance = {
        path.name: file_sha(path)
        for path in bert_root.iterdir()
        if path.is_file() and path.suffix in {".json", ".txt", ".bin", ".safetensors"}
    }
    for name, expected_sha in BERT_WEIGHTS_SHA256.items():
        if name in bert_provenance and bert_provenance[name] != expected_sha:
            raise ValueError(f"JP BERTの公式固定SHAが不一致: {name}")
    current = json.loads(MANIFEST.read_text(encoding="utf-8"))
    script_source = Path(args.script_source).resolve() if args.script_source else SCRIPT
    script_bytes = script_source.read_bytes()
    script = json.loads(script_bytes.decode("utf-8"))
    lines = read_lines(script)
    cast = production_cast(current)
    if args.latest or not (args.sample or args.compare_guide):
        issues = latest_script_issues(script, cast)
        if issues:
            raise ValueError(" / ".join(issues))
    if args.compare_guide:
        guide = next(line for line in lines if line["speaker"] == "guide")
        lines = [guide]
    if args.sample:
        # Prototype remains explicitly incomplete; it cannot pass production verification.
        lines = [
            next(line for line in lines if line["speaker"] == role)
            for role in ROLES
            if any(line["speaker"] == role for line in lines)
        ]
    elif not args.compare_guide:
        missing = set(ROLES) - {line["speaker"] for line in lines}
        if missing:
            raise ValueError(f"脚本に未配役の話者がある: {sorted(missing)}")
    provenance = {}
    models = {cast[line["speaker"]]["model"] for line in lines}
    if args.compare_guide:
        models.update({"jvnv-F1-jp", "jvnv-F2-jp"})
    for model in models:
        files = [
            model_root / model / name
            for name in (MODEL_FILES[model], "config.json", "style_vectors.npy")
        ]
        if not all(path.is_file() for path in files):
            raise ValueError(f"ローカルモデルがない: {model}")
        config = json.loads(files[1].read_text(encoding="utf-8"))
        available = config["data"]["style2id"]
        if not all(
            settings(line, cast)["style"] in available
            for line in lines
            if cast[line["speaker"]]["model"] == model
        ):
            raise ValueError(f"指定スタイルがモデルにない: {model}")
        if model not in provenance:
            provenance[model] = {path.name: file_sha(path) for path in files}
            if provenance[model] != MODEL_SHA256[model]:
                raise ValueError(f"モデルSHAが公式の固定リビジョンと一致しない: {model}")

    # Process-local offline flags: no external service or hidden model fetch during production.
    os.environ["HF_HUB_OFFLINE"] = "1"
    os.environ["TRANSFORMERS_OFFLINE"] = "1"
    os.environ["OPEN_JTALK_DICT_DIR"] = str(dictionary_root)
    os.environ["OMP_NUM_THREADS"] = str(args.threads)
    os.environ["MKL_NUM_THREADS"] = str(args.threads)
    os.environ["NUMBA_NUM_THREADS"] = str(args.threads)
    sys.dont_write_bytecode = True
    import torch
    from style_bert_vits2.constants import Languages
    from style_bert_vits2.nlp import bert_models
    from style_bert_vits2.tts_model import TTSModel

    torch.set_num_threads(args.threads)
    torch.set_num_interop_threads(1)
    bert_model = bert_models.load_model(Languages.JP, str(bert_root))
    if not args.bert_float32:
        torch.ao.quantization.quantize_dynamic(
            bert_model, {torch.nn.Linear}, dtype=torch.qint8, inplace=True
        )
        gc.collect()
        print("JP BERT Linear layers quantized to dynamic qint8", flush=True, file=sys.stderr)
    quantized_layers = sum(
        isinstance(module, torch.ao.nn.quantized.dynamic.Linear) for module in bert_model.modules()
    )
    bert_models.load_tokenizer(Languages.JP, str(bert_root))
    active = None
    active_name = None

    def infer(role, params):
        nonlocal active, active_name
        model = cast[role]["model"]
        if active_name != model:
            active = None  # Release previous CPU model before loading the next one.
            gc.collect()
            active = TTSModel(
                model_path=model_root / model / MODEL_FILES[model],
                config_path=model_root / model / "config.json",
                style_vec_path=model_root / model / "style_vectors.npy",
                device="cpu",
            )
            active_name = model
        torch.manual_seed(params.pop("seed"))
        return active.infer(**params)

    if args.compare_guide:
        trials = []
        for model in ("jvnv-F1-jp", "jvnv-F2-jp"):
            cast["guide"]["model"] = model
            audio, entries = pack_speaker(lines, infer, cast)
            trials.append(
                {
                    "model": model,
                    "wavSha256": sha(audio),
                    "clips": entries,
                    "wavBase64": base64.b64encode(audio).decode("ascii"),
                }
            )
        previous = json.loads(REVISION.read_text(encoding="utf-8")) if REVISION.is_file() else {}
        previous["comparison"] = {
            "sourceScriptSha256": sha(script_bytes),
            "line": lines[0]["id"],
            "trials": trials,
            "chosen": "jvnv-F2-jp",
            "reason": "主人公F1と別の女性モデル。Neutral、強度0.45、速度1.04を制作案として採用。",
            "audition": "not-run",
            "qualityImprovement": "not-claimed",
            "modelsSha256": provenance,
        }
        REVISION.write_text(
            json.dumps(previous, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
        )
        return {"status": "comparison-generated-not-auditioned", "trials": len(trials)}

    assets, clips, files = {}, {}, {}
    for role in ROLES:
        selected = [line for line in lines if line["speaker"] == role]
        if not selected:
            continue
        audio, entries = pack_speaker(selected, infer, cast)
        assets[role] = audio
        clips.update(entries)
        with wave.open(io.BytesIO(audio), "rb") as wav:
            files[role] = {
                "url": f"{role}-v1.wav",
                "sha256": sha(audio),
                "bytes": len(audio),
                "sampleRate": wav.getframerate(),
                "channels": wav.getnchannels(),
                "duration": wav.getnframes() / wav.getframerate(),
            }
    result = {
        **current,
        "cast": cast,
        "status": "prototype" if args.sample else "complete",
        "reason": None,
        "files": files,
        "lines": clips,
        "scriptSha256": sha(script_bytes),
        "generator": {
            **current["generator"],
            "version": VERSION,
            "generated": True,
            "revision": "female-guide-v2",
            "modelsSha256": provenance,
            "bert": {
                "repository": "ku-nlp/deberta-v2-large-japanese-char-wwm",
                "revision": BERT_REVISION,
                "license": "CC-BY-SA-4.0",
                "linearWeights": "float32" if args.bert_float32 else "torch-dynamic-qint8",
                "quantizedLinearLayers": quantized_layers,
                "filesSha256": bert_provenance,
            },
            "environment": environment,
            "threads": args.threads,
            "interopThreads": 1,
            "dictionary": {
                "source": "https://github.com/r9y9/open_jtalk/releases/tag/v1.11.1",
                "sysDicSha256": file_sha(dictionary_root / "sys.dic"),
            },
        },
        "verification": {
            "generatedAudio": "generated-not-auditioned",
            "audition": "not-run",
            "iphone": "not-run",
        },
    }
    # Only assigned paths are writable. No temp samples/model/cache are created here.
    for role, audio in assets.items():
        (VOICE / f"{role}-v1.wav").write_bytes(audio)
    MANIFEST.write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    revision = json.loads(REVISION.read_text(encoding="utf-8")) if REVISION.is_file() else {}
    revision["production"] = {
        "status": result["status"],
        "scriptSha256": sha(script_bytes),
        "finalizedScript": script,
        "cast": cast,
        "files": files,
        "lines": clips,
        "environment": environment,
        "modelsSha256": provenance,
        "verification": result["verification"],
        "handoff": "統合先dialogue-script.jsonとscriptSha256を一致させて素材監査を実行する。",
    }
    REVISION.write_text(json.dumps(revision, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    return {"status": result["status"], "files": len(files), "lines": len(clips)}


def align_script(source: Path) -> dict:
    """Align non-audio script edits only after strict PCM/line/recipe validation.

    The actual synthesis source and its SHA remain in the revision evidence.
    Never use this to bless changed text, readings, cast, or inference settings.
    """
    from check_word_guild_voice_assets import audit

    verified = audit(str(source))
    allowed = "生成時の脚本SHAが現行脚本と違う"
    if any(issue != allowed for issue in verified["issues"]):
        raise ValueError(
            "音声変更が必要なため脚本SHAを更新できない: " + " / ".join(verified["issues"])
        )
    manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))
    revision = json.loads(REVISION.read_text(encoding="utf-8"))
    old_sha = manifest["scriptSha256"]
    new_sha = sha(source.read_bytes())
    original_sha = revision["production"]["scriptSha256"]
    manifest["generator"]["synthesizedScriptSha256"] = original_sha
    manifest["scriptSha256"] = new_sha
    alignment = {
        "previousSha256": old_sha,
        "integratedScriptSha256": new_sha,
        "synthesizedScriptSha256": original_sha,
        "reason": (
            "全PCM・本文・読み・話者・演技・目標尺・推論条件の一致を監査。"
            "音声以外の脚本変更のみ整合。"
        ),
        "wavChanged": False,
    }
    revision.setdefault("scriptAlignments", []).append(alignment)
    revision["production"]["integratedScript"] = json.loads(source.read_text(encoding="utf-8"))
    revision["production"]["integratedScriptSha256"] = new_sha
    MANIFEST.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    REVISION.write_text(json.dumps(revision, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    return {"status": "script-aligned-with-audio-unchanged", **alignment}


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--probe", action="store_true")
    parser.add_argument("--model-root")
    parser.add_argument("--bert-root")
    parser.add_argument(
        "--align-script", help="Align non-audio script edits after strict existing PCM validation"
    )
    parser.add_argument(
        "--script-source", help="Read-only finalized script path for isolated integration"
    )
    parser.add_argument(
        "--latest", action="store_true", help="Reject the superseded flight/boss script"
    )
    parser.add_argument(
        "--compare-guide",
        action="store_true",
        help="Generate two embedded trials; never replace production",
    )
    parser.add_argument(
        "--dictionary-root",
        default=str(ROOT / ".voice-generation/dictionary/open_jtalk_dic_utf_8-1.11"),
    )
    parser.add_argument("--sample", action="store_true")
    parser.add_argument("--bert-float32", action="store_true")
    parser.add_argument("--threads", type=int, default=4)
    args = parser.parse_args()
    if args.probe:
        result = probe()
        print(json.dumps(result, ensure_ascii=False, indent=2))
        return 0 if result["ready"] else 2
    if args.align_script:
        try:
            print(json.dumps(align_script(Path(args.align_script)), ensure_ascii=False, indent=2))
            return 0
        except (ValueError, KeyError, RuntimeError, OSError) as error:
            print(json.dumps({"status": "incomplete", "error": str(error)}, ensure_ascii=False))
            return 2
    if not args.model_root or not args.bert_root or not 1 <= args.threads <= 32:
        parser.error("--model-root, --bert-rootとthreads 1〜32が必要")
    try:
        print(json.dumps(generate(args), ensure_ascii=False, indent=2))
        return 0
    except (ValueError, RuntimeError, OSError) as error:
        print(json.dumps({"status": "incomplete", "error": str(error)}, ensure_ascii=False))
        return 2


if __name__ == "__main__":
    raise SystemExit(main())
