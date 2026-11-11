"""受領原画を保持し、表示用WebPだけ追加する。"""

import hashlib
import json
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "products/word-guild/assets"
OUT = ROOT / "quality/loading-v6"


def main():
    records = []
    sources = list(ASSETS.glob("*-generated-v5.png"))
    sources = [p for p in sources if p.stem.rsplit("-generated", 1)[0].count("-") >= 1]
    sources += [ASSETS / "ui-primary-button-transparent-v5.png"]
    sources += [
        p
        for p in ASSETS.glob("*-generated-v4.png")
        if p.name.startswith(("guild-", "floor-", "return-", "ui-"))
        and "primary-button" not in p.name
        and p.name != "ui-generated-v4.png"
    ]
    for source in sources:
        image = Image.open(source).convert("RGBA")
        name = source.stem.replace("-generated-v5", "").replace("-generated-v4", "")
        if "primary-button" in name:
            name = "ui-primary-button"
        target = ASSETS / f"{name}-display-v6.webp"
        environment = name.startswith(("guild", "floor-", "return-"))
        size = image.size
        if environment:
            image.thumbnail((960, 640), Image.Resampling.LANCZOS)
            image = image.convert("RGB")
        image.save(target, "WEBP", lossless=not environment, quality=85, method=6, exact=True)
        decoded = Image.open(target).convert("RGBA")
        if not environment:
            # Invisible RGB may be discarded by WebP. All alpha and visible RGB are exact.
            assert decoded.getchannel("A").tobytes() == image.getchannel("A").tobytes()
            assert all(
                a == b
                for a, b in zip(
                    image.get_flattened_data(), decoded.get_flattened_data(), strict=True
                )
                if a[3]
            )
        records.append(
            {
                "source": source.relative_to(ROOT).as_posix(),
                "file": target.relative_to(ROOT).as_posix(),
                "source_sha256": hashlib.sha256(source.read_bytes()).hexdigest(),
                "source_size": size,
                "display_size": image.size,
                "original_bytes": source.stat().st_size,
                "bytes": target.stat().st_size,
                "lossless": not environment,
                "quality": 85,
            }
        )
    OUT.mkdir(exist_ok=True)
    (OUT / "assets.json").write_text(
        json.dumps(records, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    print(
        f"{len(records)} display assets: {sum(r['original_bytes'] for r in records)}"
        f" -> {sum(r['bytes'] for r in records)} bytes; originals retained"
    )


if __name__ == "__main__":
    main()
