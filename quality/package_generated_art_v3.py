"""生成PNGの姿の実境界を切り出す。描画・背景除去・再着色はしない。"""

import hashlib
import json
import shutil
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "products/word-guild/assets"
QA = ROOT / "quality/generated-v3"


def run():
    sources = json.loads((QA / "sources.json").read_text(encoding="utf-8"))
    components = json.loads((QA / "components.json").read_text(encoding="utf-8"))
    records = {}
    for name, source in sources.items():
        destination = OUT / f"{name}-generated-v3.png"
        shutil.copy2(source, destination)
        with Image.open(destination) as image:
            assert image.mode == "RGBA", f"{name}: alpha required"
            width, height = image.size
            alpha = image.getchannel("A")
            assert alpha.getextrema()[0] == 0, f"{name}: transparency required"
            item = {
                "file": destination.relative_to(ROOT).as_posix(),
                "size": [width, height],
                "sha256": hashlib.sha256(destination.read_bytes()).hexdigest(),
                "generation": "built-in image_gen; original generated pixels retained",
                "alpha_extrema": alpha.getextrema(),
                "frames": [],
            }
            if name.startswith("claw"):
                item["alpha_bounds"] = alpha.getbbox()
                item["recommended_display"] = "盤面で中心溝4–7 CSS px、欠けた縁込み8–12px"
                if name == "claw":
                    # 拡大目視した1536×1024原画の裂傷を、透明余白込みで切り出す。
                    assert image.size == (1536, 1024)
                    parts = {
                        "strip": (32, 384, 1504, 640),
                        "start-cap": (32, 384, 326, 640),
                        "middle": (326, 384, 1210, 640),
                        "end-cap": (1210, 384, 1504, 640),
                    }
                    item["parts"] = {}
                    for label, rect in parts.items():
                        filename = f"claw-{label}-generated-v3.png"
                        image.crop(rect).save(OUT / filename)
                        item["parts"][label] = {
                            "rect": list(rect),
                            "file": f"products/word-guild/assets/{filename}",
                        }
            else:
                rows = 3 if name in {"male", "female"} else 2
                labels = ["idle", "blink", "joy", "worried", "action-1", "action-2"]
                if rows == 3:
                    labels += ["launch", "fall", "land"]
                main = components[name][: len(labels)]
                main.sort(
                    key=lambda c: (
                        int((c["box"][1] + c["box"][3]) / 2 / (height / rows)),
                        c["box"][0] + c["box"][2],
                    )
                )
                boxes = [c["box"].copy() for c in main]
                # 本体と分離した星・葉・しずくも最寄りの姿へ含める。
                for part in components[name][len(labels) :]:
                    a, b, c, d = part["box"]
                    px, py = (a + c) / 2, (b + d) / 2

                    def separation(sprite, px=px, py=py):
                        left, top, right, bottom = sprite["box"]
                        return (
                            max(left - px, 0, px - right) ** 2 + max(top - py, 0, py - bottom) ** 2
                        )

                    owner = min(range(len(main)), key=lambda i: separation(main[i]))
                    box = boxes[owner]
                    box[:] = [min(box[0], a), min(box[1], b), max(box[2], c), max(box[3], d)]
                boxes = [
                    [max(0, a - 3), max(0, b - 3), min(width, c + 3), min(height, d + 3)]
                    for a, b, c, d in boxes
                ]
                size = (max(max(c - a, d - b) for a, b, c, d in boxes) + 47) // 16 * 16
                item["frame_size"] = [size, size]
                item["extraction"] = "各姿の透明境界を実測し切り出し。16px以上の透明余白を追加。"
                for label, (x, y, right, bottom) in zip(labels, boxes, strict=True):
                    crop = image.crop((x, y, right, bottom))
                    cell_w, cell_h = crop.size
                    padding = [(size - cell_w) // 2, size - 16 - cell_h]
                    frame = Image.new("RGBA", (size, size))
                    frame.paste(crop, tuple(padding))
                    bounds = frame.getchannel("A").getbbox()
                    assert bounds is not None, f"{name}/{label}: empty frame"
                    filename = f"{name}-{label}-generated-v3.png"
                    frame.save(OUT / filename)
                    item["frames"].append(
                        {
                            "name": label,
                            "rect": [x, y, cell_w, cell_h],
                            "padding": padding,
                            "canvas_size": [size, size],
                            "file": f"products/word-guild/assets/{filename}",
                            "alpha_bounds": bounds,
                        }
                    )
                item["recommended_display"] = (
                    [104, 144]
                    if name in {"male", "female"}
                    else [64, 96]
                    if name == "guide"
                    else [80, 144]
                )
            records[name] = item
    assert len(records) == 14
    (QA / "asset-records.json").write_text(
        json.dumps(records, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    print(
        f"PASS: {len(records)} generated sheets; "
        f"{sum(len(v['frames']) for v in records.values())} RGBA frames"
    )


if __name__ == "__main__":
    run()
