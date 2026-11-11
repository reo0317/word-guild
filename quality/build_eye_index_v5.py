"""旧アトラスを保存したまま目修正v5のベクター索引を追記する。"""
# ruff: noqa: E501

import json
import re
import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
QA = ROOT / "quality/eyes-v5"
ART = ROOT / "atelier-assets/illustrator"


def run():
    svg = ART / "illustration.svg"
    archive = ART / "illustration-before-eyes-v5.svg"
    if not archive.exists():
        shutil.copy2(svg, archive)
        shutil.copy2(ART / "artwork.json", ART / "artwork-before-eyes-v5.json")
    source = archive.read_text(encoding="utf-8")
    source = re.sub(r'viewBox="[^"]*"', 'viewBox="2304 0 768 640"', source, count=1)
    source = source.replace(
        '<title id="sheet-title">', '<title id="sheet-title">目の局所調整v5の素材索引。', 1
    )
    source = source.replace(
        '<desc id="sheet-desc">',
        '<desc id="sheet-desc">現行v5は目の調整素材。全78姿の生成PNGと寸法・変更領域はartwork.json、比較はquality/eyes-v5。以下は保持した旧作品の説明。',
        1,
    )
    names = [
        "リオ",
        "ミナ",
        "ほむら",
        "しずく",
        "こもれび",
        "しるべ",
        "猫",
        "犬",
        "太陽",
        "アリ",
        "けものの番人",
        "ことば喰い",
    ]
    records = json.loads((QA / "asset-records.json").read_text(encoding="utf-8"))
    cards = []
    for index, (key, label) in enumerate(zip(list(records)[:12], names, strict=True)):
        frames = records[key]["frames"]
        size = frames[0]["canvas_size"][0]
        cards.append(
            f'<g transform="translate({28 + index % 3 * 242} {224 + index // 3 * 70})"><rect width="228" height="60" rx="6" fill="#244e4b" stroke="#698477"/><text x="10" y="19" fill="#fff3d6" font-size="14">{label} / {len(frames)}姿</text><text x="10" y="37" fill="#c0d1bf" font-size="11">{key} · {size}×{size}px</text><text x="10" y="52" fill="#f4c66c" font-size="10">目周辺以外のRGBAと余白保持</text></g>'
        )
    index = (
        '<view id="v5-eyes-index" viewBox="2304 0 768 640"/><g id="generated-v5-eyes-index" transform="translate(2304)" font-family="sans-serif"><title>12キャラ78姿の目を内蔵画像生成で修正したv5素材索引</title><rect width="768" height="640" rx="16" fill="#103638"/><rect x="12" y="12" width="744" height="616" rx="12" fill="none" stroke="#c6a467"/><text x="28" y="49" fill="#f4c66c" font-size="25">ことばのギルド / 目の調整 v5</text><text x="28" y="79" fill="#fff3d6" font-size="14">内蔵画像生成で12枚を編集 → 目周辺だけ収録 → 78姿の透明PNG</text><text x="28" y="102" fill="#bfcebd" font-size="12">このSVGは索引。実際のキャラ原画はassetsの版付きPNG。旧索引は文書内に保持。</text><rect x="28" y="124" width="712" height="76" rx="8" fill="#e8d2a5"/><path d="M63 154Q82 128 102 154Q82 184 63 154Z" fill="#fff7e0" stroke="#513827" stroke-width="2"/><ellipse cx="83" cy="155" rx="10" ry="15" fill="#337c7e"/><ellipse cx="84" cy="154" rx="5" ry="11" fill="#133b3d"/><rect x="79" y="142" width="5" height="6" fill="#fffbe8"/><path d="M130 158H172M164 151L172 158 164 165" fill="none" stroke="#4b6654" stroke-width="2"/><path d="M198 156Q213 139 228 156Q213 175 198 156Z" fill="#fff7e0" stroke="#513827" stroke-width="2"/><ellipse cx="214" cy="157" rx="7" ry="10" fill="#337c7e"/><ellipse cx="215" cy="156" rx="3.5" ry="7" fill="#133b3d"/><rect x="211" y="149" width="3" height="3" fill="#fffbe8"/><text x="255" y="150" fill="#29453d" font-size="14">眼球・白目・瞳・光点を顔に合わせて抑える</text><text x="255" y="176" fill="#59634b" font-size="12">上は方針図。縮小率は比較案、ボスは控えめに調整。</text>'
        + "".join(cards)
        + '<path d="M28 517H740" stroke="#668578"/><text x="28" y="543" fill="#f4c66c" font-size="14">ボタン：本・葉・金の縁のRGBを保持し、外側の矩形だけ透過</text><text x="28" y="568" fill="#fff3d6" font-size="12">比較・実寸確認：quality/eyes-v5/preview.html と各画面のスクリーンショット</text><text x="28" y="592" fill="#bfcebd" font-size="12">寸法・余白・切り出し・変更領域・引き継ぎ：artwork.json</text><text x="28" y="616" fill="#bfcebd" font-size="11">背景・爪痕・音楽・ルールは制作対象外 / 本番統合とiPhone実機の最終評価は引き継ぎ</text></g>'
    )
    source = source.replace("</svg>", index + "</svg>")
    svg.write_text(source, encoding="utf-8")
    prior = json.loads((ART / "artwork-before-eyes-v5.json").read_text(encoding="utf-8"))
    artwork = {
        "title": "ことばのギルド：目の調整素材 v5",
        "summary": "内蔵画像生成で12キャラの目を編集。78姿の目周辺だけ収録し、それ以外のRGBAと全アルファ・寸法・余白を完全保持。透過ボタンも追加。",
        "previous": prior,
        "assets": records,
        "generation": "quality/eyes-v5/generation.json",
        "comparison": "quality/eyes-v5/preview.html",
        "integration": {
            "character_url": "assets/{character}-{pose}-generated-v5.png",
            "sheet_url": "assets/{character}-generated-v5.png",
            "canvas_and_padding": "既存v4と同一。CSSの--sizeや背景位置を変更しない。",
            "button": "assets/ui-primary-button-transparent-v5.png",
            "button_css": "background-color:transparent; border:0; box-shadow:none; 背景画像だけv5透過版へ。",
            "production_code_changed": False,
        },
        "scope": "最新assignmentの目修正と条件付き透過ボタンのみ。画像読込と音楽の処理修正は実装担当へ。",
        "human_checks": [
            "iPhone 17 / iOS 26.1 Safari・ホーム画面で実寸の目と表情を確認",
            "生成指示の72～82%は制作案。好みの最終確定ではない。",
        ],
    }
    (ART / "artwork.json").write_text(
        json.dumps(artwork, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    print("v5ベクター索引と素材引き継ぎを保存。旧アトラス・索引を保持。")


if __name__ == "__main__":
    run()
