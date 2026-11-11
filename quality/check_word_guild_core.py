"""Node全回帰と初期化観測を8登録の枠内で実行。"""

import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
commands = [
    [
        "node",
        "--test",
        *[
            f"tests/word-guild{suffix}.test.mjs"
            for suffix in ["", "-transition", "-dialogue", "-voice", "-conversation", "-audio"]
        ],
    ],
    [sys.executable, "quality/check_browser_probe_regression.py"],
]
for command in commands:
    result = subprocess.run(command, cwd=ROOT, check=False)
    if result.returncode:
        sys.exit(result.returncode)
