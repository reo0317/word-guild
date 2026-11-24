"""Regenerate the normalized alpha bounds for paper theater characters."""

import json
import re
from pathlib import Path

from PIL import Image

product = Path(__file__).resolve().parents[1] / "products" / "word-guild"
script_path = product / "data" / "kamishibai.json"
script = json.loads(script_path.read_text(encoding="utf-8"))
trim = {}
pending_color = re.compile(
    r"tsumugi-(side-walk|back|read|surprise|ask|worry)"
    r"|hatori-(side|cap|give|stern)|fuurou-(hoot|side|fly)"
)

for art in script["sizes"]:
    path = product / "art" / f"{art}.webp"
    try:
        image = Image.open(path)
    except FileNotFoundError:
        if art.startswith(("shadow-hatori-", "shadow-fuurou-")) or pending_color.fullmatch(art):
            print(f"Awaiting {path.name}")
            continue
        raise
    with image:
        bounds = image.convert("RGBA").getchannel("A").getbbox()
        if bounds is None:
            raise ValueError(f"{path.name} is fully transparent")
        _, top, _, bottom = bounds
        trim[art] = {
            "height": (bottom - top) / image.height,
            "bottom": (image.height - bottom) / image.height,
        }

script["trim"] = trim
script_path.write_text(json.dumps(script, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
