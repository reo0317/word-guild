"""登録した検査を同じargvで実行し、時刻・終了コード・ソースSHAを保存。"""

import hashlib
import json
import subprocess
import sys
import time
from datetime import UTC, datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MAX_CHECK_SECONDS = 300


def validate_checks(checks, root=ROOT):
    """製品側の登録条件。外部ハーネスの受理を代行するものではない。"""
    if not isinstance(checks, list) or not 1 <= len(checks) <= 8:
        raise ValueError("登録検査は1〜8件")
    for item in checks:
        if not isinstance(item, dict):
            raise ValueError("検査はオブジェクト")
        name, argv, timeout = (item.get(key) for key in ("name", "argv", "timeout"))
        if not isinstance(name, str) or not name.strip():
            raise ValueError("検査名が必要")
        if not isinstance(argv, list) or len(argv) < 2:
            raise ValueError("コマンドと引数が必要")
        if not all(isinstance(a, str) and a.strip() and "\x00" not in a for a in argv):
            raise ValueError("argvは空でない文字列配列")
        if type(timeout) is not int or not 1 <= timeout <= MAX_CHECK_SECONDS:
            raise ValueError(f"timeoutは1〜{MAX_CHECK_SECONDS}秒の整数")
        command = argv[0]
        if command == "npm":
            if argv[1] not in ("run", "test") or (argv[1] == "run" and len(argv) < 3):
                raise ValueError("npmはrunまたはtestのみ")
            continue
        if command == "python":
            scripts, suffix = argv[1:2], ".py"
        elif command == "node" and argv[1] in ("--test", "--check") and len(argv) >= 3:
            scripts = argv[2:]
            suffix = ".test.mjs" if argv[1] == "--test" else ".mjs"
        else:
            raise ValueError("許可コマンドはpythonスクリプト、node検査、npm run/test")
        for script in scripts:
            path = Path(script)
            resolved = (root / path).resolve()
            if (
                path.is_absolute()
                or not resolved.is_relative_to(root.resolve())
                or not script.endswith(suffix)
                or not resolved.is_file()
            ):
                raise ValueError("検査スクリプトは作業フォルダー内の既存相対パス")
    return checks


def sources():
    files = [ROOT / "ATELIER_CHECKS.json"]
    files += list((ROOT / "products/word-guild").glob("*.mjs"))
    files += [
        ROOT / "products/word-guild/dialogue-script.json",
        ROOT / "products/word-guild/assets/voice/manifest.json",
        ROOT / "products/word-guild/assets/voice/CREDITS.md",
        ROOT / "quality/check_word_guild_voice_assets.py",
        ROOT / "quality/generate_word_guild_voice.py",
    ]
    files += list((ROOT / "products/word-guild/assets/voice").glob("*.wav"))
    files += [ROOT / "products/word-guild/style.css", ROOT / "products/word-guild/index.html"]
    files += list((ROOT / "tests").glob("word-guild*.test.mjs"))
    files += list((ROOT / "quality").glob("check_*browser*.py"))
    files += [
        ROOT / "quality/check_word_guild_story_characters.py",
        ROOT / "quality/check_word_guild_integration_v3.py",
        ROOT / "quality/check_word_guild_music.py",
        ROOT / "quality/check_word_guild_audio.py",
        ROOT / "quality/check_word_guild_loading.py",
        ROOT / "quality/check_word_guild_flow_loading.py",
        ROOT / "quality/check_word_guild_display.py",
        ROOT / "quality/build_ui_assets_v7.py",
        ROOT / "quality/loading-v6/assets.json",
        ROOT / "quality/browser_probe.py",
        ROOT / "quality/browser_server.py",
        ROOT / "quality/run_v4_checks.py",
        ROOT / "quality/check_check_registration.py",
        ROOT / "quality/integration-v8/check_final_hint.py",
        ROOT / "quality/check_word_guild_core.py",
        ROOT / "quality/check_word_guild_story_v9.py",
    ]
    files += list((ROOT / "products/word-guild/assets/walk-v9").glob("*"))
    return {
        str(p.relative_to(ROOT)).replace("\\", "/"): hashlib.sha256(p.read_bytes()).hexdigest()
        for p in files
    }


def main():
    records = []
    before = sources()
    result = {
        "started_utc": datetime.now(UTC).isoformat(),
        "checks": records,
        "source_sha256": before,
        "external_harness_invoked": False,
    }
    checks = json.loads((ROOT / "ATELIER_CHECKS.json").read_text(encoding="utf-8"))["checks"]
    try:
        validate_checks(checks)
    except ValueError as error:
        result.update(registration_valid=False, complete=True, passed=False, error=str(error))
        (ROOT / "quality/v4-checks-results.json").write_text(
            json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8"
        )
        print(f"登録設定: FAIL ({error})", flush=True)
        return 1
    result["registration_valid"] = True
    result["registered_count"] = len(checks)
    result["local_timeout_cap_seconds"] = MAX_CHECK_SECONDS
    for item in checks:
        argv = item["argv"]
        command = [sys.executable, *argv[1:]] if argv[0] == "python" else argv
        started = time.monotonic()
        try:
            p = subprocess.run(
                command,
                cwd=ROOT,
                capture_output=True,
                text=True,
                encoding="utf-8",
                errors="replace",
                timeout=item["timeout"],
            )
            record = {
                **item,
                "exit_code": p.returncode,
                "passed": p.returncode == 0,
                "stdout": p.stdout,
                "stderr": p.stderr,
            }
        except subprocess.TimeoutExpired:
            record = {**item, "passed": False, "error": "timeout"}
        record["seconds"] = round(time.monotonic() - started, 3)
        records.append(record)
        print(
            f"{item['name']}: {'PASS' if record['passed'] else 'FAIL'} ({record['seconds']}s)",
            flush=True,
        )
        if not record["passed"]:
            print(record.get("stderr", record.get("error")), flush=True)
        (ROOT / "quality/v4-checks-results.json").write_text(
            json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8"
        )
    result.update(
        complete=True,
        passed=all(r["passed"] for r in records),
        sources_unchanged_during_execution=before == sources(),
        finished_utc=datetime.now(UTC).isoformat(),
    )
    (ROOT / "quality/v4-checks-results.json").write_text(
        json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    return 0 if result["passed"] else 1


if __name__ == "__main__":
    sys.exit(main())
