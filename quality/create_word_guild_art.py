"""専用のSVG原画を再生成。既存の専門素材は読み取りのみ。外部素材なし。"""

import random
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "products/word-guild/assets"
OUT.mkdir(parents=True, exist_ok=True)


def svg(body, w, h, pixel=False):
    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}"'
        + (' shape-rendering="crispEdges"' if pixel else "")
        + ">"
        + "".join(body)
        + "</svg>"
    )


def rect(b, x, y, w, h, c):
    b.append(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" fill="{c}"/>')


def path(b, d, c, extra=""):
    b.append(f'<path d="{d}" fill="{c}" {extra}/>')


def guild():
    b = []
    rng = random.Random(82)
    rect(b, 0, 0, 240, 170, "#173e40")
    # 遠景：夜明けの森。段差を持った輪郭と葉のまとまり。
    rect(b, 63, 0, 120, 93, "#47776b")
    rect(b, 87, 0, 69, 70, "#70958a")
    for layer, col in [(0, "#28584f"), (1, "#1b4944"), (2, "#123938")]:
        for x in range(-12, 250, 29):
            x += rng.randint(-8, 8)
            y = rng.randint(0, 19) + layer * 7
            rect(b, x + 9, y, 5, 122 - y, "#27443b")
            for j in range(4):
                rect(b, x - j * 3, y + 12 * j, 24 + 6 * j, 15, col)
                rect(
                    b,
                    x + 3 - j * 2,
                    y + 12 * j,
                    12 + 3 * j,
                    3,
                    "#386650" if layer < 2 else "#224e42",
                )
    rect(b, 0, 125, 240, 45, "#244d41")
    for _ in range(150):
        x = rng.randrange(240)
        y = rng.randrange(122, 170)
        rect(b, x, y, rng.randrange(2, 7), 1, rng.choice(["#366b4e", "#47794f", "#173f39"]))
    # 石畳の小道と影。
    path(b, "M108 126H142L184 170H58Z", "#827e63")
    for y in range(129, 170, 7):
        for x in range(65, 182, 14):
            if abs(x - 123) < (y - 120) * 1.35:
                rect(b, x + (y % 3), y, 12, 5, rng.choice(["#a4a086", "#b9b293", "#939981"]))
                rect(b, x + (y % 3), y + 4, 12, 1, "#626e5a")
    rect(b, 40, 130, 162, 4, "#102e2b")
    # 書庫：左右の小棟、厚い軒、石基礎、木組み。
    rect(b, 48, 77, 142, 52, "#714e37")
    rect(b, 53, 82, 132, 47, "#d3ba83")
    rect(b, 58, 86, 122, 36, "#e1c898")
    rect(b, 48, 122, 142, 9, "#687064")
    for x in range(50, 190, 11):
        rect(b, x, 125, 9, 4, "#949887")
    for x in [53, 86, 145, 180]:
        rect(b, x, 82, 4, 41, "#674b35")
        rect(b, x, 83, 1, 38, "#ad8151")
    for y in [89, 116]:
        rect(b, 52, y, 132, 3, "#775334")
    path(b, "M57 91L80 115H74L57 98ZM149 115L180 90V97L156 115Z", "#997044")
    # 瓦屋根の輪郭と段ごとの瓦。平らな多段の森の屋根。
    path(b, "M43 79V71H49V65H55V59H63V53H171V59H180V65H188V72H198V81Z", "#263d3a")
    for row in range(5):
        y = 56 + row * 5
        left = 62 - row * 4
        right = 174 + row * 4
        rect(b, left, y, right - left, 5, "#925e4c")
        for x in range(left, right, 9):
            rect(b, x + (row % 2) * 3, y, 7, 2, "#c58a62")
            rect(b, x + (row % 2) * 3, y + 3, 7, 1, "#69483c")
    rect(b, 44, 79, 154, 4, "#402f2b")
    rect(b, 47, 79, 148, 1, "#d5a16c")
    # 屋根窓付きの小さな書庫塔。
    rect(b, 101, 32, 39, 45, "#5f4935")
    rect(b, 105, 38, 31, 35, "#d4be8f")
    path(b, "M95 38V34H101V29H107V24H132V29H138V34H146V39Z", "#355550")
    for x in range(105, 135, 7):
        rect(b, x, 30, 6, 3, "#67907a")
    rect(b, 100, 37, 43, 3, "#183e39")
    rect(b, 105, 69, 31, 3, "#916638")
    rect(b, 112, 44, 18, 21, "#433f30")
    rect(b, 114, 46, 14, 17, "#f4ca76")
    rect(b, 115, 47, 5, 7, "#fff3b8")
    rect(b, 120, 45, 2, 20, "#6c5536")
    rect(b, 113, 54, 17, 2, "#6c5536")
    # 玄関、本の看板、窓枠と光。
    rect(b, 106, 92, 30, 37, "#563f2e")
    rect(b, 110, 95, 22, 34, "#345750")
    for x in range(111, 131, 5):
        rect(b, x, 97, 1, 30, "#487568")
    rect(b, 125, 111, 3, 3, "#f8d386")
    rect(b, 102, 129, 39, 4, "#d2c7a4")
    rect(b, 105, 133, 33, 3, "#a39b7b")
    for x in [64, 152]:
        rect(b, x - 2, 96, 25, 22, "#6c4b33")
        rect(b, x, 98, 21, 17, "#eab56b")
        rect(b, x + 1, 99, 7, 9, "#ffe7a4")
        rect(b, x + 9, 97, 2, 20, "#775536")
        rect(b, x, 106, 22, 2, "#775536")
        rect(b, x - 4, 118, 28, 3, "#9b744e")
    rect(b, 104, 81, 37, 9, "#64432c")
    rect(b, 106, 82, 33, 6, "#edcf8f")
    path(b, "M117 83H121V87H117ZM123 83H127V87H123ZM121 84H123V88H121Z", "#517064")
    # 本を象った旗、煙突、吊り灯籠。
    rect(b, 170, 26, 2, 31, "#bd9d6a")
    path(b, "M172 27H190V42H172Z", "#d6b66b")
    path(b, "M177 30H181V37H177ZM183 30H187V37H183ZM181 31H183V39H181Z", "#2d5b53")
    rect(b, 72, 37, 9, 21, "#697166")
    rect(b, 69, 35, 15, 4, "#939487")
    for x, y in [(74, 28), (78, 19), (81, 10)]:
        rect(b, x, y, 7, 4, "#afc0a4")
    for x in [100, 140]:
        rect(b, x, 96, 1, 6, "#4e4733")
        rect(b, x - 3, 102, 7, 10, "#554737")
        rect(b, x - 2, 104, 5, 6, "#ffdc8e")
    # 花鉢、蔦、積まれた本、ベンチ、前景の葉。
    for x in [42, 185]:
        rect(b, x, 119, 11, 11, "#a86f4c")
        rect(b, x - 1, 118, 13, 3, "#d59b68")
        for dx, dy in [(0, -8), (5, -12), (9, -6), (-2, -3)]:
            rect(b, x + dx, 119 + dy, 5, 6, "#5b8b57")
            rect(b, x + dx + 1, 118 + dy, 2, 2, "#f1c46b")
    for y in range(89, 114, 6):
        rect(b, 177 + (y % 3), y, 4, 5, "#57794b")
    rect(b, 57, 129, 31, 3, "#a18157")
    rect(b, 59, 132, 3, 6, "#654b33")
    rect(b, 82, 132, 3, 6, "#654b33")
    for i, col in enumerate(["#d1aa65", "#728d78", "#ae6b54"]):
        rect(b, 156 + i * 2, 127 - i * 3, 13, 3, col)
    for x in [0, 12, 210, 224]:
        rect(b, x, 148, 16, 14, "#123832")
        rect(b, x + 3, 144, 13, 5, "#356149")
        rect(b, x + 7, 151, 10, 3, "#5a7e50")
    for x, y in [(30, 48), (202, 92), (18, 116), (213, 29), (155, 19)]:
        rect(b, x, y, 2, 2, "#f9d991")
        rect(b, x - 1, y + 1, 4, 1, "#b8ae6b")
    return svg(b, 240, 170, True)


source = (ROOT / "atelier-assets/illustrator/illustration.svg").read_text(encoding="utf-8")
defs = re.search(r"<defs>(.*?)</defs>", source).group(1)
names = [
    "male",
    "female",
    "fire",
    "water",
    "grass",
    "guide",
    "cat",
    "dog",
    "sun",
    "ant",
    "animal",
    "final",
]
for name in names:
    own_def = re.search(rf'<symbol id="sprite-{name}".*?</symbol>', defs).group(0)
    b = [f"<defs>{own_def}</defs>"]
    for frame in range(4):
        b.append(
            f'<g transform="translate({frame * 64} 0)">'
            f'<use href="#sprite-{name}" width="64" height="64"/>'
        )
        # 狙いを持った一画素の装飾。顔と衣装に輪郭・陰影・表情を描く。
        if name in ["male", "female"]:
            for x, y, w, h, c in [
                (22, 17, 3, 1, "#ffe0ad"),
                (39, 25, 3, 2, "#cc815e"),
                (22, 26, 3, 2, "#cc815e"),
                (25, 29, 3, 1, "#f5cc93"),
                (21, 35, 2, 10, "#25666b"),
                (40, 35, 2, 10, "#216069"),
                (24, 36, 2, 3, "#7bc6b2"),
                (28, 46, 8, 1, "#fff0b0"),
                (27, 47, 3, 3, "#775935"),
                (24, 53, 2, 2, "#86a4b2"),
                (39, 54, 2, 2, "#86a4b2"),
                (44, 40, 3, 1, "#ffd99b"),
            ]:
                rect(b, x, y, w, h, c)
            rect(b, 17, 36, 3, 10, "#775c39")
            rect(b, 17, 36, 3, 2, "#d6b46f")
            rect(b, 30, 17, 2, 2, "#744e38" if name == "male" else "#7b4664")
            eyes = [(27, 20), (38, 20)]
            mouth = (30, 28)
            face = "#efb783"
        elif name == "guide":
            for x, y, w, h, c in [
                (24, 15, 2, 6, "#c9b5d4"),
                (38, 18, 2, 3, "#c9b5d4"),
                (20, 39, 25, 2, "#665678"),
                (24, 45, 2, 5, "#d6c5df"),
                (38, 44, 3, 7, "#685374"),
                (29, 8, 3, 1, "#fff2b8"),
                (51, 33, 2, 2, "#fff3c2"),
            ]:
                rect(b, x, y, w, h, c)
            rect(b, 15, 40, 20, 12, "#493f4c")
            rect(b, 17, 41, 7, 8, "#fff0c8")
            rect(b, 26, 41, 7, 8, "#e0ca9c")
            rect(b, 24, 42, 2, 9, "#9d7b52")
            for x in [18, 27]:
                rect(b, x, 44, 4, 1, "#bfa478")
                rect(b, x, 47, 4, 1, "#bfa478")
            eyes = [(24, 28), (36, 28)]
            mouth = (29, 35)
            face = "#fff0cf"
        else:
            palettes = {
                "fire": ("#ffd773", "#ed794b"),
                "water": ("#bdeaf0", "#67bdd0"),
                "grass": ("#c8d88a", "#7fab63"),
                "cat": ("#f7cda0", "#d78267"),
                "dog": ("#e8e2c5", "#81a5bf"),
                "sun": ("#fff0a1", "#e9c75f"),
                "ant": ("#f7cda0", "#d78267"),
                "animal": ("#e8e2c5", "#728eae"),
                "final": ("#d4abbb", "#544263"),
            }
            hi, face = palettes[name]
            for x, y, w, h in [
                (23, 24, 3, 1),
                (41, 31, 1, 4),
                (23, 48, 3, 1),
                (33, 48, 5, 1),
                (17, 39, 2, 3),
                (44, 41, 2, 2),
            ]:
                rect(b, x, y, w, h, hi)
            if name == "cat":
                for x in [15, 43]:
                    rect(b, x, 19, 3, 4, "#eab193")
                for x in [13, 45]:
                    rect(b, x, 35, 6, 1, "#71463c")
                eyes = [(20, 26), (38, 26)]
                mouth = (30, 37)
            elif name == "dog":
                rect(b, 26, 43, 4, 5, "#d78481")
                eyes = [(22, 24), (38, 24)]
                mouth = (28, 39)
            elif name == "sun":
                eyes = [(20, 30), (38, 30)]
                mouth = (28, 40)
            elif name == "ant":
                eyes = [(27, 24), (36, 24)]
                mouth = (30, 30)
                rect(b, 24, 48, 16, 1, "#f1b789")
            elif name == "animal":
                rect(b, 26, 6, 12, 3, "#f2ce87")
                rect(b, 30, 5, 4, 6, "#f2ce87")
                rect(b, 27, 51, 10, 2, "#cbaa71")
                eyes = [(18, 28), (40, 28)]
                mouth = (29, 45)
            elif name == "final":
                for x, y in [(10, 14), (50, 15), (13, 44), (48, 42)]:
                    rect(b, x, y, 3, 3, "#b788a7")
                eyes = [(20, 28), (40, 28)]
                mouth = (29, 46)
            else:
                eyes = [
                    (20, 40) if name == "water" else (20, 34) if name == "fire" else (20, 40),
                    (40, 40) if name != "fire" else (40, 34),
                ]
                mouth = (30, 48) if name != "fire" else (30, 44)
        # 一画素の縫い目・毛並み・葉脈を、部位に沿って描き込む。
        if name in ["male", "female"]:
            hair = "#bc8050" if name == "male" else "#a16582"
            for x, y in [
                (23, 9),
                (26, 9),
                (29, 10),
                (34, 11),
                (37, 12),
                (40, 14),
                (20, 16),
                (45, 19),
            ]:
                rect(b, x, y, 3, 1, hair)
            for x in range(23, 42, 3):
                rect(b, x, 34, 2, 1, "#8ac4b2")
            path(b, "M23 38h4v4h-4ZM37 38h3v4h-3Z", "#315f61")
            rect(b, 24, 38, 2, 1, "#89bfa7")
            rect(b, 37, 38, 2, 1, "#89bfa7")
            for y in range(37, 46, 3):
                rect(b, 31, y, 1, 1, "#fff0b9")
            for x in [20, 42]:
                rect(b, x, 43, 3, 1, "#81b29f")
            rect(b, 40, 41, 7, 8, "#4d4835")
            rect(b, 41, 42, 5, 5, "#bf9561")
            rect(b, 42, 42, 3, 1, "#edc889")
            rect(b, 43, 46, 1, 1, "#694d31")
            for x in [21, 37]:
                rect(b, x, 56, 7, 2, "#263d3f")
                rect(b, x + 1, 56, 3, 1, "#9c9c81")
            rect(b, 24, 18, 2, 1, "#9a6148")
            rect(b, 38, 18, 2, 1, "#9a6148")
            rect(b, 31, 26, 2, 1, "#d39368")
        elif name == "guide":
            path(b, "M20 22h4v-4h3v-3h9v3h3v4h4v1h-5v-4h-4v-2h-4v2h-5v4h-5Z", "#c3afd3")
            for x, y in [(20, 34), (23, 37), (41, 36), (44, 42), (28, 50), (38, 48)]:
                rect(b, x, y, 2, 1, "#d1bdcc")
            for x, y in [(22, 43), (38, 44), (35, 49)]:
                path(b, f"M{x} {y}h1v-1h1v1h1v1h-1v1h-1v-1h-1Z", "#f3d494")
            rect(b, 51, 39, 1, 16, "#d5b26d")
            rect(b, 49, 30, 9, 2, "#fff1b4")
            rect(b, 52, 29, 2, 7, "#fff1b4")
            rect(b, 23, 34, 2, 1, "#dfb28a")
            rect(b, 38, 34, 2, 1, "#dfb28a")
        elif name == "cat":
            for x, y in [(19, 23), (27, 23), (35, 23), (43, 23), (18, 43), (42, 44)]:
                rect(b, x, y, 2, 3, "#a65748")
            path(b, "M10 28h2v10h4v3h-3v-2h-3Z", "#f0b18a")
            rect(b, 24, 44, 15, 1, "#ffe0b0")
            rect(b, 25, 50, 2, 2, "#c49170")
            rect(b, 38, 50, 2, 2, "#c49170")
            rect(b, 23, 33, 2, 2, "#e9a094")
            rect(b, 41, 33, 2, 2, "#e9a094")
        elif name == "dog":
            for x, y in [
                (22, 20),
                (25, 19),
                (36, 19),
                (39, 20),
                (13, 26),
                (46, 28),
                (12, 33),
                (46, 35),
            ]:
                rect(b, x, y, 2, 1, "#bad3d4")
            rect(b, 22, 46, 20, 3, "#365a67")
            rect(b, 24, 47, 16, 1, "#a6d3c8")
            rect(b, 29, 49, 6, 5, "#cfb97d")
            rect(b, 30, 50, 4, 3, "#fff0bd")
            for x in [24, 36]:
                rect(b, x, 52, 3, 1, "#cdded0")
        elif name == "sun":
            for x, y in [
                (15, 15),
                (46, 15),
                (14, 45),
                (47, 45),
                (6, 30),
                (54, 30),
                (30, 5),
                (30, 54),
            ]:
                rect(b, x, y, 3, 2, "#dbe6a3")
            for x, y in [(23, 23), (26, 21), (29, 21), (35, 22), (40, 24)]:
                rect(b, x, y, 2, 1, "#ffedaa")
            rect(b, 19, 38, 3, 2, "#dfa56b")
            rect(b, 43, 38, 3, 2, "#dfa56b")
            path(b, "M22 45h3v1h14v-1h3v2h-4v1H26v-1h-4Z", "#b39350")
        elif name == "ant":
            for y, w in [(47, 12), (50, 18), (53, 18)]:
                rect(b, 32 - w // 2, y, w, 1, "#ad6253")
            for x, y in [(22, 19), (24, 17), (37, 17), (40, 20)]:
                rect(b, x, y, 2, 1, "#f0bd93")
            for x, y in [(12, 35), (7, 28), (51, 35), (56, 28), (14, 46), (49, 46)]:
                rect(b, x, y, 2, 2, "#946854")
            rect(b, 27, 38, 9, 1, "#ffd79d")
            rect(b, 30, 39, 2, 3, "#9e644e")
        elif name == "animal":
            path(
                b, "M11 36h3v2h2v3h3v5h-3v-4h-3v-3h-2ZM51 36h-3v2h-2v3h-3v5h3v-4h3v-3h2Z", "#a5b6be"
            )
            for x, y in [
                (12, 19),
                (17, 22),
                (46, 22),
                (50, 19),
                (14, 48),
                (46, 48),
                (20, 52),
                (42, 52),
            ]:
                rect(b, x, y, 3, 1, "#b2c1c0")
            rect(b, 24, 42, 16, 2, "#587c88")
            rect(b, 29, 46, 6, 4, "#e6c686")
            rect(b, 30, 46, 4, 2, "#fff0ba")
            rect(b, 14, 13, 3, 5, "#c4a99c")
            rect(b, 47, 13, 3, 5, "#c4a99c")
        elif name == "final":
            path(b, "M8 13h1v5h6v1H8ZM55 13h-1v5h-6v1h7Z", "#ae87a2")
            for x, y in [
                (11, 23),
                (15, 23),
                (46, 23),
                (50, 23),
                (10, 38),
                (49, 38),
                (12, 49),
                (48, 49),
            ]:
                rect(b, x, y, 2, 1, "#b28da7")
            path(b, "M25 17h3v-1h8v1h3v1h-4v1h-6v-1h-4Z", "#b998b5")
            for x in [9, 51]:
                rect(b, x, 40, 4, 10, "#baa8b5")
                for y in [42, 45, 48]:
                    rect(b, x + 1, y, 3, 1, "#6d5b7c")
            rect(b, 28, 54, 8, 1, "#c09db1")
            rect(b, 30, 37, 4, 1, "#d4b1c3")
        elif name == "fire":
            path(b, "M30 15h2v6h3v3h-2v-2h-3ZM19 30h2v8h-2v5h-2v-7h2Z", "#ffc58a")
            rect(b, 42, 39, 2, 7, "#c15b4b")
            rect(b, 26, 47, 4, 1, "#fff2b3")
            rect(b, 34, 48, 4, 1, "#fff2b3")
            for x, y in [(29, 7), (40, 15), (15, 24)]:
                rect(b, x, y, 1, 2, "#f3c875")
        elif name == "water":
            path(b, "M30 18h2v4h4v4h3v3h-2v-2h-3v-3h-4Z", "#9ee0df")
            path(b, "M16 32h1v7h-1v8h4v2h-5V36Z", "#9fe2df")
            for x, y in [(42, 37), (44, 43), (23, 50), (38, 49)]:
                rect(b, x, y, 3, 1, "#a9e4df")
            rect(b, 31, 51, 3, 1, "#3e809c")
        elif name == "grass":
            path(
                b, "M16 14h2v2h4v2h4v2h-2v-1h-5v-2h-3ZM45 12h-2v3h-3v3h-4v2h2v-1h5v-3h2Z", "#c6d98e"
            )
            for x, y in [(22, 31), (26, 30), (31, 31), (18, 36), (44, 37), (24, 49), (36, 50)]:
                rect(b, x, y, 2, 1, "#b6ca80")
            rect(b, 17, 45, 2, 5, "#548457")
            rect(b, 43, 45, 2, 5, "#548457")
        if name in ["male", "female"]:
            eyes = [(24, 20), (38, 20)]
        if name == "ant":
            eyes = [(24, 24), (36, 24)]
        if name == "animal":
            eyes = [(16, 28), (38, 28)]
        if name == "final":
            eyes = [(16, 28), (36, 28)]
        eye_width = 10 if name == "animal" else 12 if name == "final" else 6
        for x, y in eyes:
            if frame == 0:
                rect(b, x + 1, y, 1, 1, "#fff5da")
            else:
                rect(b, x, y, eye_width, 6, face)
                if frame == 1:
                    rect(b, x, y + 2, 5, 1, "#263d3f")
                elif frame == 2:
                    path(b, f"M{x} {y + 2}h1v-1h3v1h1v1h-1v-1h-3v1h-1Z", "#263d3f")
                else:
                    rect(b, x + 1, y + 1, 2, 3, "#263d3f")
                    rect(b, x - 1, y - 1, 4, 1, "#263d3f")
        if frame == 2:
            rect(b, mouth[0], mouth[1], 5, 2, "#91534c")
            rect(b, mouth[0] + 1, mouth[1], 3, 1, "#fff0cf")
        elif frame == 3:
            rect(b, mouth[0], mouth[1], 5, 1, "#5d4b4c")
        b.append("</g>")
    (OUT / f"{name}.svg").write_text(svg(b, 256, 64, True), encoding="utf-8")

(OUT / "guild.svg").write_text(guild(), encoding="utf-8")


def floor(stage):
    b = []
    rng = random.Random(stage + 124)
    sky = ["#84b5a0", "#80b1bb", "#d8bc7f", "#759b7b", "#718b91", "#50506b"][stage]
    rect(b, 0, 0, 480, 260, sky)
    # 奥の森のシルエットを重ねる。敵以外の戦闘背景は滑らかな手描き風。
    for layer, color in enumerate(["#4e7b71", "#355f58", "#244b45"]):
        for x in range(-50, 550, 75):
            y = 35 + layer * 24 + rng.randrange(25)
            path(
                b,
                f"M{x} 210V{y + 30}Q{x - 40} {y + 5} {x} {y - 12}"
                f"Q{x + 35} {y - 55} {x + 70} {y}Q{x + 105} {y + 10} {x + 65} {y + 48}V210Z",
                color,
            )
            path(b, f"M{x + 25} 210L{x + 29} {y + 18}L{x + 34} 210Z", "#36534a")
    path(b, "M0 182Q130 158 240 175T480 166V260H0Z", "#517b57")
    path(b, "M0 214Q100 179 236 205T480 201V260H0Z", "#365c47")
    path(b, "M182 185Q240 163 298 185L372 260H96Z", "#b5ab86")
    for _ in range(38):
        x = rng.randrange(480)
        y = rng.randrange(191, 260)
        path(b, f"M{x} {y}l3 -8l2 8l6 -6l-2 8Z", "#6f9360")
    if stage == 1:
        path(b, "M0 173Q110 140 220 167T480 171L480 209Q330 170 219 194T0 202Z", "#5fa4b2")
        for x, y in [(23, 182), (130, 168), (340, 182), (411, 197)]:
            path(b, f"M{x} {y}h44", "#b7ddd4", 'stroke="#b7ddd4" stroke-width="2"')
        path(b, "M167 185Q238 151 309 185V197Q238 165 167 197Z", "#8e795c")
    if stage == 2:
        b.append('<circle cx="351" cy="54" r="30" fill="#f3d68b"/>')
        for x, y in [(30, 222), (102, 205), (392, 220), (443, 199)]:
            b.append(
                f'<circle cx="{x}" cy="{y}" r="5" fill="#e6c16b"/>'
                f'<circle cx="{x}" cy="{y}" r="2" fill="#876449"/>'
            )
    if stage == 3:
        for x in [0, 370]:
            path(
                b,
                f"M{x} 260Q{x + 48} 203 {x + 20} 116L{x + 65} 114Q{x + 61} 201 {x + 110} 260Z",
                "#675540",
            )
            path(
                b,
                f"M{x} 256Q{x + 85} 207 {x + 145} 235L{x + 140} 245Q{x + 69} 230 {x + 35} 260Z",
                "#7f6847",
            )
        for x in [68, 394]:
            b.append(
                f'<ellipse cx="{x}" cy="215" rx="20" ry="9" fill="#bc8266"/>'
                f'<path d="M{x - 5} 216h10v16h-10Z" fill="#e0c29b"/>'
            )
    if stage == 4:
        for x in [53, 357]:
            rect(b, x, 68, 66, 111, "#798b7d")
            rect(b, x + 8, 77, 50, 102, "#c0c4a2")
            rect(b, x - 6, 63, 78, 12, "#a4b398")
            for y in range(91, 172, 18):
                rect(b, x + 8, y, 50, 3, "#708c75")
            for i in range(7):
                rect(
                    b,
                    x + 12 + i * 6,
                    80 + (i % 2) * 2,
                    4,
                    11,
                    ["#a37a56", "#6b9890", "#d7bc78"][i % 3],
                )
        path(b, "M50 63Q236 -9 428 63L428 74Q236 9 50 74Z", "#536d65")
    if stage == 5:
        rect(b, 0, 0, 480, 260, "#272f4644")
        for x, y in [(57, 177), (405, 190), (81, 215), (376, 233)]:
            path(b, f"M{x} {y}l-9 -25l12 -15l11 15l-5 25Z", "#ae83a2")
            path(b, f"M{x} {y}l3 -35l8 15l-5 20Z", "#e5b6b4")
        for x, y in [(95, 36), (351, 30), (412, 73), (25, 104)]:
            b.append(f'<circle cx="{x}" cy="{y}" r="2" fill="#f4da9a"/>')
    for x in [25, 414]:
        path(b, f"M{x} 260Q{x - 15} 237 {x + 12} 225Q{x + 39} 206 {x + 59} 244V260Z", "#193e38")
        path(b, f"M{x + 8} 245q15 -18 27 -9q-4 18 -27 9Z", "#3b6750")
    return svg(b, 480, 260)


for stage in range(6):
    (OUT / f"floor-{stage}.svg").write_text(floor(stage), encoding="utf-8")
print("森のギルド、12キャラ×4表情、6階層のSVGを制作")
