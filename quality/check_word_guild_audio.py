"""音響ルール・音源・ブラウザー検査を一登録で実行し、失敗を終了コードへ伝える。"""

import json
import subprocess
import sys
from pathlib import Path
from time import monotonic

ROOT = Path(__file__).resolve().parents[1]
CHECKS = [
    {
        "name": "本番AI音声50区間・9WAV・出典",
        "file": "quality/check_word_guild_voice_assets.py",
        "timeout": 30,
    },
    {
        "name": "会話・音声・入力実ブラウザー",
        "file": "quality/check_word_guild_dialogue_browser.py",
        "timeout": 150,
    },
    {
        "name": "音響ルール・競合・解放",
        "file": "tests/word-guild-audio.test.mjs",
        "timeout": 30,
        "argv": ["node", "--test", "tests/word-guild-audio.test.mjs"],
    },
    {"name": "無料音源・PCM・ループ", "file": "quality/check_word_guild_music.py", "timeout": 90},
    {
        "name": "音楽実ブラウザー",
        "file": "quality/check_word_guild_music_browser.py",
        "timeout": 170,
    },
]


def run_group(entries, result_file, runner=subprocess.run):
    records, exit_code = [], 0
    for entry in entries:
        start = monotonic()
        record = dict(entry)
        try:
            argv = entry.get("argv", [sys.executable, entry["file"]])
            if "--no-write" in sys.argv and "argv" not in entry:
                argv = [*argv, "--no-write"]
            if "--components-only" in sys.argv and entry["file"].endswith("music_browser.py"):
                argv = [*argv, "--components-only"]
            proc = runner(
                argv,
                cwd=ROOT,
                capture_output=True,
                text=True,
                encoding="utf-8",
                errors="replace",
                timeout=entry["timeout"],
            )
            record.update(exit_code=proc.returncode, stdout=proc.stdout, stderr=proc.stderr)
        except subprocess.TimeoutExpired:
            record.update(exit_code=124, error="timeout")
        except OSError as error:
            record.update(exit_code=1, error=str(error))
        record.update(passed=record["exit_code"] == 0, seconds=round(monotonic() - start, 3))
        records.append(record)
        if not record["passed"] and not exit_code:
            exit_code = record["exit_code"] if record["exit_code"] > 0 else 1
        print(f"{entry['name']}: {'PASS' if record['passed'] else 'FAIL'}", flush=True)
        print(record.get("stdout", "") + record.get("stderr", record.get("error", "")), flush=True)
    result = json.dumps(
        {"passed": exit_code == 0, "checks": records, "exit_code": exit_code},
        ensure_ascii=False,
        indent=2,
    )
    if "--no-write" in sys.argv:
        print(result)
    else:
        result_file.write_text(result, encoding="utf-8")
    return exit_code


if __name__ == "__main__":
    sys.exit(run_group(CHECKS, ROOT / "quality/audio-suite-results.json"))
