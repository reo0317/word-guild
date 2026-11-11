"""新素材のベクター索引を追加。旧アトラスの図形を文書内へ保持する。"""
# ruff: noqa: E501
# SVGタグのテンプレート文字列は図形の属性を同じ行に保持する。

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
QA = ROOT / "quality/generated-v4"


def run():
    source = (ROOT / "atelier-assets/illustrator/illustration-before-v4.svg").read_text(
        encoding="utf-8"
    )
    names = [
        ("male", "リオ"),
        ("female", "ミナ"),
        ("fire", "ほむら"),
        ("water", "しずく"),
        ("grass", "こもれび"),
        ("guide", "しるべ"),
        ("cat", "猫"),
        ("dog", "犬"),
        ("sun", "太陽"),
        ("ant", "アリ"),
        ("animal", "けものの番人"),
        ("final", "ことば喰い"),
    ]
    labels = "".join(
        f'<g transform="translate({30 + i % 4 * 182} {124 + i // 4 * 49})"><rect width="166" height="39" rx="5" fill="#234d49" stroke="#6a8373"/><text x="9" y="16" fill="#fff3d6" font-size="13">{label}</text><text x="9" y="31" fill="#bdd1bd" font-size="10">{key} / {9 if i < 2 else 6} frames</text></g>'
        for i, (key, label) in enumerate(names)
    )
    floors = "".join(
        f'<g transform="translate({30 + i * 119} 306)"><rect width="106" height="43" rx="5" fill="{color}" stroke="#94a18a"/><path d="M12 32L36 15 49 26 70 11 94 32" fill="none" stroke="#ead6a4" stroke-width="1.3"/><text x="53" y="14" text-anchor="middle" fill="#fff3d6" font-size="10">{name}</text></g>'
        for i, (name, color) in enumerate(
            [
                ("小道", "#335d45"),
                ("橋", "#285b62"),
                ("庭", "#697044"),
                ("根の道", "#2f4b40"),
                ("書庫", "#6c593c"),
                ("星の封印", "#3d3d5b"),
            ]
        )
    )
    returns = "".join(
        f'<g transform="translate({30 + i * 182} 393)"><rect width="166" height="46" rx="5" fill="#254b47" stroke="#8a977b"/><text x="10" y="18" fill="#f4c66c" font-size="12">{label}</text><text x="10" y="34" fill="#d6dfc6" font-size="10">{time}</text></g>'
        for i, (label, time) in enumerate(
            [
                ("01 ダンジョン出口", "launch 0–700ms"),
                ("02 森と街道", "launch 700–1400ms"),
                ("03 ギルドへ接近", "fall 1200ms"),
                ("04 石畳へ着地", "land 900ms"),
            ]
        )
    )
    index = f"""<view id="legacy-atlas" viewBox="0 0 768 640"/><view id="v4-index" viewBox="1536 0 768 640"/>
<g id="generated-v4-index" transform="translate(1536)" shape-rendering="geometricPrecision" font-family="sans-serif">
<title>森の本のギルドの素材v4索引。12キャラ78姿、6階層、帰還4景、装飾と一本の裂傷。</title>
<rect width="768" height="640" rx="16" fill="#103638"/><rect x="10" y="10" width="748" height="620" rx="12" fill="none" stroke="#b89558"/><path d="M30 26H64M26 30V64M704 26H738M742 30V64M26 576V610M30 614H64M704 614H738M742 576V610" stroke="#f0cc82" fill="none" stroke-width="2"/>
<path d="M31 39Q49 33 63 39Q77 33 95 39V66Q77 61 63 67Q49 61 31 66Z" fill="#f4c66c" stroke="#d4a55a"/><path d="M63 40V65M38 44L56 45M38 50L56 51M70 45L88 44M70 51L88 50" stroke="#48614b" fill="none"/>
<text x="114" y="52" fill="#f4c66c" font-size="24">森の本のギルド / 素材 v4</text>
<text x="30" y="88" fill="#fff3d6" font-size="13">12キャラ78姿 · 6階層 · 帰還4景 · 文字なし装飾6点</text>
<text x="30" y="108" fill="#aec9bd" font-size="11">内蔵画像生成による版付きPNGの索引。実際の絵はassets、寸法と配置はartwork.json。</text>
{labels}<text x="30" y="281" fill="#f4c66c" font-size="14">階層背景 / 敵を置く中央部に余白、42マスの操作領域は維持</text>
{floors}<text x="30" y="375" fill="#f4c66c" font-size="14">帰還 / ダンジョンからギルドへ、既存3500ms内の配置案</text>
{returns}<text x="30" y="466" fill="#f4c66c" font-size="14">一本の裂傷 / 既存生成材質を再利用、幅を35%拡大</text>
<rect x="30" y="479" width="708" height="82" rx="7" fill="#cab993"/><use href="#v3-single-cut-guide" x="41" y="485" width="686" height="70"/>
<text x="30" y="581" fill="#fff3d6" font-size="12">断面指針：黒い深部・赤い内部光・欠けた縁・細い両端。上の図は材質索引。</text>
<text x="30" y="602" fill="#bdd1bd" font-size="11">実素材は一本の生成ストリップ。石 → 傷 → 普通の文字 / 経路順240ms / 動きを減らす時は即時</text>
</g>"""
    source = source.replace('viewBox="0 0 768 640"', 'viewBox="1536 0 768 640"', 1)
    source = source.replace(
        '<title id="sheet-title">', '<title id="sheet-title">素材v4のベクター索引。', 1
    )
    source = source.replace(
        '<desc id="sheet-desc">',
        '<desc id="sheet-desc">現行v4の原画はproducts/word-guild/assetsの'
        "*-generated-v4.png。#v4-indexに今回の索引、artwork.jsonに寸法・配置・根拠を記載。"
        "以下は保持した旧v3と旧アトラスの履歴説明。",
        1,
    )
    source = source.replace("</svg>", index + "</svg>")
    (ROOT / "atelier-assets/illustrator/illustration.svg").write_text(source, encoding="utf-8")
    print("v4-indexを追加。旧アトラス図形はlegacy-atlasとして保持。")


if __name__ == "__main__":
    run()
