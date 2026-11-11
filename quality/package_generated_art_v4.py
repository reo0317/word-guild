"""image_gen原画を非破壊で保存し、姿の実境界と透明余白を記録する。"""

import hashlib
import json
import shutil
from pathlib import Path

from inspect_sprite_components_v3 import components
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
QA = ROOT / "quality/generated-v4"
OUT = ROOT / "products/word-guild/assets"
NAMES = "male female fire water grass guide cat dog sun ant animal final".split()
LABELS = ["idle", "blink", "joy", "worried", "action-1", "action-2"]


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def run():
    sources = json.loads((QA / "sources.json").read_text(encoding="utf-8"))
    records = {}
    for name, original in sources.items():
        destination = OUT / f"{name}-generated-v4.png"
        shutil.copy2(original, destination)
        with Image.open(destination) as image:
            item = {
                "file": destination.relative_to(ROOT).as_posix(),
                "size": list(image.size),
                "sha256": digest(destination),
                "frames": [],
                "method": "内蔵image_gen。原画を複製、実境界切り出しと透明余白のみ。",
            }
            if name in NAMES:
                assert image.mode == "RGBA", f"{name}: alpha missing"
                alpha = image.getchannel("A")
                assert alpha.getextrema()[0] == 0, f"{name}: not transparent"
                rows = 3 if name in {"male", "female"} else 2
                labels = LABELS + (["launch", "fall", "land"] if rows == 3 else [])
                found = components(image)
                bodies = found[: len(labels)]
                assert len(bodies) == len(labels), f"{name}: missing bodies"
                width, height = image.size
                bodies.sort(
                    key=lambda c: (
                        int((c["box"][1] + c["box"][3]) / 2 / (height / rows)),
                        c["box"][0] + c["box"][2],
                    )
                )
                boxes = [body["box"].copy() for body in bodies]
                for component in found[len(labels) :]:
                    a, b, c, d = component["box"]
                    px, py = (a + c) / 2, (b + d) / 2

                    def distance(index, px=px, py=py, bodies=bodies):
                        left, top, right, bottom = bodies[index]["box"]
                        return (
                            max(left - px, 0, px - right) ** 2 + max(top - py, 0, py - bottom) ** 2
                        )

                    owner = min(range(len(bodies)), key=distance)
                    box = boxes[owner]
                    box[:] = [min(box[0], a), min(box[1], b), max(box[2], c), max(box[3], d)]
                boxes = [
                    [max(0, a - 3), max(0, b - 3), min(width, c + 3), min(height, d + 3)]
                    for a, b, c, d in boxes
                ]
                size = (max(max(c - a, d - b) for a, b, c, d in boxes) + 47) // 16 * 16
                item["canvas_size"] = [size, size]
                item["component_count"] = len(found)
                for label, (x, y, right, bottom) in zip(labels, boxes, strict=True):
                    crop = image.crop((x, y, right, bottom))
                    padding = [(size - crop.width) // 2, size - 16 - crop.height]
                    frame = Image.new("RGBA", (size, size))
                    frame.paste(crop, tuple(padding))
                    assert frame.getchannel("A").getbbox()
                    filename = OUT / f"{name}-{label}-generated-v4.png"
                    frame.save(filename)
                    item["frames"].append(
                        {
                            "name": label,
                            "file": filename.relative_to(ROOT).as_posix(),
                            "rect": [x, y, right - x, bottom - y],
                            "padding": padding,
                            "canvas_size": [size, size],
                            "alpha_bounds": frame.getchannel("A").getbbox(),
                            "sha256": digest(filename),
                        }
                    )
            elif name == "ui":
                assert image.mode == "RGBA" and image.getchannel("A").getextrema()[0] == 0
                labels = [
                    "panel",
                    "hero-card",
                    "pedestal",
                    "ally-card",
                    "primary-button",
                    "board-frame",
                ]
                width, height = image.size
                parts = components(image)[:6]
                assert len(parts) == 6
                parts.sort(
                    key=lambda c: (
                        int((c["box"][1] + c["box"][3]) / 2 / (height / 3)),
                        c["box"][0] + c["box"][2],
                    )
                )
                for label, part in zip(labels, parts, strict=True):
                    a, b, c, d = part["box"]
                    rect = (max(0, a - 3), max(0, b - 3), min(width, c + 3), min(height, d + 3))
                    crop = image.crop(rect)
                    canvas = Image.new("RGBA", (crop.width + 24, crop.height + 24))
                    canvas.paste(crop, (12, 12))
                    filename = OUT / f"ui-{label}-generated-v4.png"
                    canvas.save(filename)
                    item["frames"].append(
                        {
                            "name": label,
                            "file": filename.relative_to(ROOT).as_posix(),
                            "rect": [
                                rect[0],
                                rect[1],
                                crop.width,
                                crop.height,
                            ],
                            "padding": [12, 12],
                            "alpha_bounds": canvas.getchannel("A").getbbox(),
                            "canvas_size": list(canvas.size),
                            "sha256": digest(filename),
                        }
                    )
            records[name] = item
    (QA / "asset-records.json").write_text(
        json.dumps(records, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    print(
        f"Saved {len(records)} originals and "
        f"{sum(len(v['frames']) for v in records.values())} extracted parts"
    )


if __name__ == "__main__":
    run()
