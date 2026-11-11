"""透明PNGの姿ごとの実境界を調べる。絵を描かない。"""

import json
from collections import deque
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]


def components(image, threshold=64):
    width, height = image.size
    mask = bytearray(v > threshold for v in image.getchannel("A").tobytes())
    found = []
    for start in range(len(mask)):
        if not mask[start]:
            continue
        mask[start] = 0
        queue = deque([start])
        left = right = start % width
        top = bottom = start // width
        area = 0
        while queue:
            index = queue.popleft()
            x, y = index % width, index // width
            area += 1
            left, right = min(left, x), max(right, x)
            top, bottom = min(top, y), max(bottom, y)
            for nx, ny in [(x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1)]:
                if 0 <= nx < width and 0 <= ny < height:
                    neighbour = ny * width + nx
                    if mask[neighbour]:
                        mask[neighbour] = 0
                        queue.append(neighbour)
        if area >= 16:
            found.append({"area": area, "box": [left, top, right + 1, bottom + 1]})
    return sorted(found, key=lambda item: item["area"], reverse=True)


if __name__ == "__main__":
    sources = json.loads((ROOT / "quality/generated-v3/sources.json").read_text(encoding="utf-8"))
    result = {}
    for key, filename in sources.items():
        if key.startswith("claw"):
            continue
        with Image.open(filename) as image:
            result[key] = components(image)
        print(key, result[key][: 9 if key in {"male", "female"} else 6])
    (ROOT / "quality/generated-v3/components.json").write_text(
        json.dumps(result, indent=2), encoding="utf-8"
    )
