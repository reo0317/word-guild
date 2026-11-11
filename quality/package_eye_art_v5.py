"""内蔵画像生成の目の編集領域を既存原画へ非破壊で収録する。"""

import hashlib
import json
import shutil
from pathlib import Path

from PIL import Image, ImageChops, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
QA = ROOT / "quality/eyes-v5"
ASSETS = ROOT / "products/word-guild/assets"
NAMES = "male female fire water grass guide cat dog sun ant animal final".split()
# 原画座標。口・衣装・体の輪郭は収録領域に含めない。
REGIONS = {
    "male": [
        (175, 100, 254, 134),
        (593, 108, 666, 131),
        (1025, 99, 1104, 135),
        (124, 514, 198, 558),
        (558, 525, 641, 561),
        (1064, 515, 1132, 562),
        (142, 909, 221, 947),
        (603, 1080, 676, 1125),
        (1011, 1005, 1099, 1038),
    ],
    "female": [
        (189, 111, 282, 148),
        (587, 118, 686, 146),
        (998, 112, 1094, 146),
        (177, 526, 277, 568),
        (587, 534, 677, 579),
        (1027, 520, 1110, 571),
        (109, 940, 200, 996),
        (616, 1097, 700, 1137),
        (993, 1008, 1090, 1053),
    ],
    "guide": [
        (212, 153, 309, 194),
        (724, 164, 821, 198),
        (1241, 158, 1341, 196),
        (198, 667, 299, 708),
        (707, 674, 808, 706),
        (1215, 658, 1322, 706),
    ],
    "fire": [
        (151, 254, 368, 336),
        (660, 281, 885, 329),
        (1203, 211, 1412, 291),
        (149, 752, 366, 834),
        (685, 647, 891, 731),
        (1158, 748, 1391, 849),
    ],
    "water": [
        (130, 260, 351, 343),
        (655, 290, 881, 338),
        (1216, 204, 1427, 282),
        (127, 774, 348, 851),
        (660, 720, 871, 811),
        (1209, 750, 1402, 849),
    ],
    "grass": [
        (200, 287, 389, 356),
        (700, 309, 885, 348),
        (1215, 245, 1402, 326),
        (195, 791, 386, 850),
        (751, 735, 927, 810),
        (1320, 756, 1484, 847),
    ],
    "cat": [
        (220, 197, 392, 269),
        (728, 210, 908, 265),
        (1225, 122, 1387, 212),
        (211, 648, 380, 726),
        (752, 703, 897, 777),
        (1316, 781, 1500, 906),
    ],
    "dog": [
        (277, 165, 429, 240),
        (775, 201, 941, 240),
        (1273, 145, 1427, 233),
        (278, 706, 432, 769),
        (846, 653, 984, 716),
        (1350, 790, 1486, 859),
    ],
    "sun": [
        (153, 202, 358, 272),
        (664, 224, 873, 266),
        (1180, 184, 1378, 276),
        (145, 703, 339, 775),
        (697, 696, 881, 755),
        (1180, 757, 1373, 795),
    ],
    "ant": [
        (127, 198, 312, 284),
        (626, 237, 822, 286),
        (1211, 165, 1383, 240),
        (126, 752, 289, 839),
        (712, 692, 887, 782),
        (1130, 790, 1276, 885),
    ],
    "animal": [
        (252, 118, 371, 156),
        (756, 124, 882, 159),
        (1243, 123, 1373, 157),
        (219, 636, 338, 675),
        (774, 690, 887, 738),
        (1272, 740, 1404, 776),
    ],
    "final": [
        (183, 160, 313, 193),
        (696, 169, 826, 195),
        (1260, 148, 1383, 196),
        (198, 681, 325, 734),
        (711, 577, 831, 605),
        (1302, 710, 1416, 742),
    ],
}


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def run():
    generation = json.loads((QA / "generation.json").read_text(encoding="utf-8"))
    old = json.loads((ROOT / "quality/generated-v4/asset-records.json").read_text(encoding="utf-8"))
    (QA / "raw").mkdir(exist_ok=True)
    baseline = {
        str(p.relative_to(ROOT)).replace("\\", "/"): digest(p)
        for p in ASSETS.iterdir()
        if p.is_file() and "v5" not in p.name
    }
    records = {}
    for name in NAMES:
        raw = QA / "raw" / f"{name}-imagegen-v5.png"
        shutil.copy2(generation[name]["source"], raw)
        original = Image.open(ASSETS / f"{name}-generated-v4.png").convert("RGBA")
        generated = Image.open(raw).convert("RGBA")
        assert generated.size == original.size, name
        assembled = original.copy()
        mask = Image.new("L", original.size)
        for region in REGIONS[name]:
            # 画像生成で描かれた目周辺だけ収録。手描きや目の機械縮小は行わない。
            patch = generated.crop(region)
            patch.putalpha(original.getchannel("A").crop(region))
            assembled.paste(patch, region[:2])
            ImageDraw.Draw(mask).rectangle(
                (region[0], region[1], region[2] - 1, region[3] - 1), fill=255
            )
        diff = ImageChops.difference(assembled, original)
        assert all(
            ImageChops.multiply(c, ImageChops.invert(mask)).getbbox() is None for c in diff.split()
        ), name
        assert assembled.getchannel("A").tobytes() == original.getchannel("A").tobytes()
        sheet = ASSETS / f"{name}-generated-v5.png"
        assembled.save(sheet, optimize=True)
        item = {
            "file": sheet.relative_to(ROOT).as_posix(),
            "size": list(assembled.size),
            "eye_regions": REGIONS[name],
            "sha256": digest(sheet),
            "frames": [],
            "outside_eye_regions_identical": True,
            "alpha_identical": True,
            "raw": raw.relative_to(ROOT).as_posix(),
        }
        for previous in old[name]["frames"]:
            x, y, width, height = previous["rect"]
            canvas = Image.new("RGBA", tuple(previous["canvas_size"]))
            canvas.paste(assembled.crop((x, y, x + width, y + height)), tuple(previous["padding"]))
            path = ASSETS / f"{name}-{previous['name']}-generated-v5.png"
            canvas.save(path, optimize=True)
            item["frames"].append(
                {
                    **previous,
                    "file": path.relative_to(ROOT).as_posix(),
                    "sha256": digest(path),
                    "alpha_bounds": canvas.getchannel("A").getbbox(),
                }
            )
        records[name] = item
    # 透過版は生成された背景抽出のアルファだけを収録し、絵のRGBを保持する。
    name = "ui-primary-button"
    raw = QA / "raw" / "ui-primary-button-imagegen-v5.png"
    shutil.copy2(generation[name]["source"], raw)
    generated = Image.open(raw).convert("RGBA")
    original = Image.open(ASSETS / "ui-primary-button-generated-v4.png").convert("RGBA")
    silhouette = generated.getchannel("A")
    silhouette = silhouette.point(lambda value: 0 if value < 16 else value)
    silhouette = silhouette.crop(silhouette.getbbox()).resize((790, 230), Image.Resampling.LANCZOS)
    alpha = Image.new("L", original.size)
    alpha.paste(silhouette, (16, 12))
    alpha = ImageChops.multiply(alpha, original.getchannel("A"))
    button = original.copy()
    button.putalpha(alpha)
    destination = ASSETS / "ui-primary-button-transparent-v5.png"
    button.save(destination, optimize=True)
    records[name] = {
        "file": destination.relative_to(ROOT).as_posix(),
        "size": list(button.size),
        "sha256": digest(destination),
        "rgb_identical": True,
        "method": "image_gen透過シルエットを既存RGBへ収録",
        "raw": raw.relative_to(ROOT).as_posix(),
    }
    assert all(digest(ROOT / path) == value for path, value in baseline.items())
    (QA / "preservation-baseline.json").write_text(json.dumps(baseline, indent=2), encoding="utf-8")
    (QA / "asset-records.json").write_text(
        json.dumps(records, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    # 全78姿の確認用コンタクトシート。各原寸キャンバスを同じ比率で展示。
    for version in (4, 5):
        atlas = Image.new("RGB", (1080, 12 * 152), "#173e40")
        draw = ImageDraw.Draw(atlas)
        for row, name in enumerate(NAMES):
            draw.text((3, row * 152 + 3), name, fill="#f4c66c")
            for column, frame in enumerate(records[name]["frames"]):
                path = ROOT / frame["file"].replace("generated-v5", f"generated-v{version}")
                image = (
                    Image.open(path).convert("RGBA").resize((114, 114), Image.Resampling.NEAREST)
                )
                atlas.paste(image, (column * 120 + 2, row * 152 + 20), image)
                draw.text((column * 120 + 2, row * 152 + 136), frame["name"], fill="#fff3d6")
        atlas.save(QA / f"all-78-v{version}.png")
    print("12キャラ78姿と透過ボタンを保存。目以外の画素・全アルファ・既存素材を保持。")


if __name__ == "__main__":
    run()
