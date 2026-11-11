"""互換表示を保つベクター素材索引。生成PNGの代替絵は描かない。"""

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def run():
    source = (ROOT / "atelier-assets/illustrator/illustration-legacy-v2.svg").read_text(
        encoding="utf-8"
    )
    # 旧claw作例はlegacyファイルに保存済み。実装で使う3つの塗りは維持。
    source = re.sub(r'<symbol id="claw-[^"]+"[\s\S]*?</symbol>', "", source)
    source = source.replace(
        '<title id="sheet-title">',
        '<title id="sheet-title">生成素材v3の索引と旧アトラス互換表示。',
        1,
    )
    source = source.replace(
        '<desc id="sheet-desc">',
        '<desc id="sheet-desc">新しい作品はproducts/word-guild/assetsの'
        "*-generated-v3.png。#v3-indexでベクター索引を表示。"
        "このSVGの旧キャラ表示は互換用であり、今回の生成成果ではない。",
        1,
    )
    names = [
        ("male", "リオ / 男性主人公"),
        ("female", "ミナ / 女性主人公"),
        ("fire", "ほむら / 炎"),
        ("water", "しずく / 水"),
        ("grass", "こもれび / 草"),
        ("guide", "しるべ / 案内役"),
        ("cat", "猫"),
        ("dog", "犬"),
        ("sun", "太陽"),
        ("ant", "アリ"),
        ("animal", "けものの番人"),
        ("final", "ことば喰い"),
    ]
    labels = "".join(
        f'<g transform="translate({28 + (i % 2) * 370} {118 + (i // 2) * 46})">'
        f'<text fill="#fff3d6" font-size="14">{label}</text>'
        f'<text y="18" fill="#aac9bd" font-size="11">{key}-generated-v3.png</text></g>'
        for i, (key, label) in enumerate(names)
    )
    index = f"""<view id="v3-index" viewBox="768 0 768 640"/>
<defs id="generated-v3-vector-guide">
<linearGradient id="v3-depth" x2="0" y2="1"><stop
stop-color="#030306"/>
<stop offset=".5" stop-color="#15070a"/><stop offset="1"
stop-color="#460a0c"/></linearGradient>
<linearGradient id="v3-stone" x2=".2" y2="1"><stop
stop-color="#e1d9cc"/>
<stop offset=".28" stop-color="#716d67"/><stop offset=".65"
stop-color="#27282a"/>
<stop offset="1" stop-color="#8c8277"/></linearGradient>
<linearGradient id="v3-red" x2="0" y2="1"><stop
stop-color="#4c080e"/>
<stop offset=".5" stop-color="#f22c18"/><stop offset="1"
stop-color="#7b0915"/></linearGradient>
<symbol id="v3-single-cut-guide" viewBox="0 0 480 100">
<title>一本の裂傷の断面指針。PNG原画そのものではない。</title>
<path d="M8 53L68 45 84 37 100 43 142 31 160 39 196 28 219
36 254 23 278 31 310 27 329 38 369 36
389 45 438 49 472 53 434 58 407 63 381 61 355 76 338 66 305
78 284 69 258 83 239 72 216 77 193
68 169 73 149 63 119 65 103 56 68 59Z" fill="#0a090b"/>
<path d="M8 53L68 45 84 37 100 43 142 31 160 39 196 28 219
36 254 23 278 31 310 27 329 38 369 36
389 45 438 49 472 53 419 52 384 50 362 46 337 48 307 39 283
43 254 36 230 47 202 41 178 48 144
44 113 51 81 49Z" fill="url(#v3-stone)"/>
<path d="M8 53L81 49 113 51 144 44 178 48 202 41 230 47 254
36 283 43 307 39 337 48 362 46 384
50 472 53 420 57 379 57 352 68 331 60 304 69 281 61 257 74
238 63 215 70 193 61 169 64 149 57
118 60 101 53 68 55Z" fill="url(#v3-depth)"/>
<path d="M8 53L68 55 101 53 118 60 149 57 169 64 193 61 215
70 238 63 257 74 281 61 304 69 331
60 352 68 379 57 420 57 472 53 434 58 407 63 381 61 355 76
338 66 305 78 284 69 258 83 239 72
216 77 193 68 169 73 149 63 119 65 103 56 68 59Z"
fill="url(#v3-stone)"/>
<path d="M42 53L102 52 126 55 142 52 172 55 198 48 212 58
235 51 254 44 276 53 300 48 332 54 355
50 382 54 444 54 398 56 376 57 351 56 333 59 301 53 277 60
256 58 238 61 215 64 197 55 173 61
146 58 126 59 100 54Z" fill="url(#v3-red)" opacity=".83"/>
<path d="M79 53L120 55 143 53 172 56 197 50 213 59 233 55
257 46 277 54 302 50 331 56 355 53 390
55M198 50L202 41M257 46L258 37M277 54L281 63M331 56L337 64"
fill="none" stroke="#ff4930"
stroke-width=".9"/>
<path d="M68 45L84 37 100 43M142 31L160 39M196 28L219 36M254
23L278 31 310 27M329 38L369 36M119
65L149 63 169 73M216 77L239 72M258 83L284 69M305 78L338
66M355 76L381 61" fill="none"
stroke="#eee9dc" stroke-width="1"/>
<path d="M91 40L80 47 96 44ZM158 39L148 45 175 43ZM253
26L242 39 264 33ZM309 30L299 42 325
40ZM337 66L321 73 340 69Z" fill="#393b3b"/>
<path d="M134 28l6 -3 3 7 -5 2ZM286 20l7 4 -4 5 -5 -3ZM177
78l8 2 -4 6 -6 -2ZM390 67l5 -4 5 5 -5
3Z" fill="#6f6a63"/>
</symbol></defs>
<g id="generated-v3-index" transform="translate(768)"
shape-rendering="geometricPrecision"
font-family="sans-serif">
<rect width="768" height="640" rx="14" fill="#103638"/>
<text x="28" y="39" font-size="23" fill="#f4c66c">ことばのギルド /
生成素材 v3</text>
<text x="28" y="67" font-size="14"
fill="#fff3d6">内蔵image_genで制作した透明PNG。座標・切り出しはartwork.json。</text>
<text x="28" y="91" font-size="12" fill="#aac9bd">各6フレーム /
男女は9フレーム。旧原画はlegacy-v2として保存。</text>
{labels}
<path d="M28 399H740" stroke="#467369"/>
<text x="28" y="426" font-size="16"
fill="#f4c66c">claw-generated-v3.png /
claw-elbow-generated-v3.png</text>
<text x="28" y="451" font-size="13"
fill="#fff3d6">一本の溝：黒い深部・赤い内部光・欠けた縁・細い両端</text>
<rect x="28" y="468" width="712" height="101" rx="8"
fill="#c5b58f"/>
<use href="#v3-single-cut-guide" x="51" y="471" width="666"
height="94"/>
<text x="28" y="594" font-size="12"
fill="#aac9bd">上はベクターによる材質指針。実素材の代替ではありません。</text>
<text x="28" y="618" font-size="12" fill="#fff3d6">石 → 一本の傷
→ 文字。240msで経路順に開示 / 動きを減らす時は即時。</text>
</g>"""
    target = ROOT / "atelier-assets/illustrator/illustration.svg"
    target.write_text(source.replace("</svg>", index + "</svg>"), encoding="utf-8")
    print(f"Vector index saved: {target.name}, legacy atlas geometry retained")


if __name__ == "__main__":
    run()
