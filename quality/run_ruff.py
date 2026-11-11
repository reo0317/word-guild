"""登録検査用。実行中PythonのRuffと実行ファイルを明示的に解決する。"""

import importlib.util
import shutil
import subprocess
import sys
import sysconfig
from pathlib import Path


def command():
    if importlib.util.find_spec("ruff") is not None:
        return [sys.executable, "-m", "ruff"]
    directories = [Path(sys.executable).parent, Path(sysconfig.get_path("scripts"))]
    for directory in directories:
        for name in ("ruff.exe", "ruff"):
            executable = directory / name
            if executable.is_file():
                return [str(executable)]
    executable = shutil.which("ruff")
    return [executable] if executable else None


def main():
    resolved = command()
    if resolved is None:
        print("実行中Pythonのモジュール・Scripts・PATHにRuffがありません。", file=sys.stderr)
        return 127
    arguments = sys.argv[1:]
    if arguments[:1] == ["all"]:
        # 前半が失敗しても書式検査を実行する。最初の非ゼロ終了コードを返す。
        codes = []
        for mode in (["check"], ["format", "--check"]):
            print(f"Ruff {' '.join(mode)}", flush=True)
            codes.append(subprocess.run([*resolved, *mode, *arguments[1:]], check=False).returncode)
        return next((code for code in codes if code != 0), 0)
    # shellやインストール処理を使わず、Ruffの終了コードをそのまま返す。
    return subprocess.run([*resolved, *arguments], check=False).returncode


if __name__ == "__main__":
    sys.exit(main())
