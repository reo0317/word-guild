"""装飾だけを原寸・全アルファ保持で圧縮し、原画とv6を保持する。"""

import hashlib
import json
import shutil
from pathlib import Path

from PIL import Image, ImageChops, ImageStat

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "quality/loading-v6"


def main():
    index = OUT / "assets.json"
    baseline = ROOT / "quality/review-v7/assets-before-ui.json"
    if not baseline.exists():
        shutil.copy2(index, baseline)
    records = json.loads(index.read_text(encoding="utf-8"))
    results = []
    for record in records:
        if not Path(record["file"]).name.startswith("ui-"):
            continue
        input_file = record.get("input", record["file"])
        source = ROOT / record["source"]
        assert hashlib.sha256(source.read_bytes()).hexdigest() == record["source_sha256"]
        image = Image.open(ROOT / input_file).convert("RGBA")
        target = ROOT / input_file.replace("display-v6", "display-v7")
        image.save(target, "WEBP", quality=95, method=6, exact=True)
        original = Image.open(source).convert("RGBA")
        decoded = Image.open(target).convert("RGBA")
        assert original.size == decoded.size
        assert original.getchannel("A").tobytes() == decoded.getchannel("A").tobytes()
        mask = original.getchannel("A").point(lambda a: 255 if a else 0)
        difference = ImageChops.difference(original.convert("RGB"), decoded.convert("RGB"))
        means = ImageStat.Stat(difference, mask).mean
        background_errors = {}
        for color in ["#173e40", "#fff3d6"]:
            background = Image.new("RGBA", original.size, color)
            a = Image.alpha_composite(background, original).convert("RGB")
            b = Image.alpha_composite(background, decoded).convert("RGB")
            errors = ImageStat.Stat(ImageChops.difference(a, b), mask).mean
            assert max(errors) < 5, "背景合成後の可視RGB平均色差は各チャンネル5未満"
            background_errors[color] = errors
        record.update(
            input=input_file,
            file=target.relative_to(ROOT).as_posix(),
            lossless=False,
            category="ui",
            quality=95,
            bytes=target.stat().st_size,
            visible_rgb_mean_error=means,
            mean_color_error_on_backgrounds=background_errors,
        )
        results.append(
            {
                "file": record["file"],
                "before_bytes": (ROOT / input_file).stat().st_size,
                "after_bytes": record["bytes"],
                "alpha_exact": True,
                "same_size": True,
                "visible_rgb_mean_error": means,
                "mean_color_error_on_backgrounds": background_errors,
            }
        )
    index.write_text(json.dumps(records, ensure_ascii=False, indent=2), encoding="utf-8")
    (ROOT / "quality/review-v7/ui-compression.json").write_text(
        json.dumps(results, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    print(json.dumps(results, ensure_ascii=False), flush=True)


if __name__ == "__main__":
    main()
