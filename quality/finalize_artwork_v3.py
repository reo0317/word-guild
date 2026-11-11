"""イラスト担当の受け渡し情報のみをまとめる。"""

import json
import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "quality/generated-v3"


def run():
    records = json.loads((OUT / "asset-records.json").read_text(encoding="utf-8"))
    prompts = {}
    for filename in ["prompts-first.json", "prompts-characters.json", "prompts-elbow.json"]:
        prompts.update(json.loads((OUT / filename).read_text(encoding="utf-8")))
    art = ROOT / "atelier-assets/illustrator/artwork.json"
    archive = art.with_name("artwork-legacy-v2.json")
    if not archive.exists():
        shutil.copy2(art, archive)
    result = {
        "title": "ことばのギルド：内蔵画像生成によるキャラ・一本の裂傷 v3",
        "summary": "参考画像2枚と既存12キャラを実際に開いて確認。内蔵image_genで"
        "12キャラと裂傷2枚を生成し、78の透明フレームと傷4部品を保存。"
        "SVGはベクター素材索引と旧表示の互換用。素材用ブラウザー218項目、"
        "既存ルール13件・ブラウザー161項目成功。新PNGの本番組み込みは実装担当へ。",
        "version": "generated-v3",
        "method": {
            "tool": "built-in image_gen.imagegen",
            "skill": "C:/Users/reopc/.codex/skills/.system/imagegen/SKILL.md",
            "transparent_background": True,
            "calls": 14,
            "postprocess": "Pillowで原画を複製・実際の姿の境界を切り出し、透明余白を追加。"
            "生成後の描き足し、再着色、背景除去、手続き的ドット描画は行わない。",
            "prompts": prompts,
            "references": [
                {
                    "file": "fcf1288fe702ae092fb0bbab.jpg",
                    "role": "輪郭・髪・衣装の陰影と表情の品質基準。衣装をコピーしない。",
                },
                {
                    "file": "597872d13f2b0894941e92e0.jpg",
                    "role": "一本の裂傷。黒い深部・赤い内部光・欠けた縁と細い両端。",
                },
                {
                    "file": "quality/screenshots/character-atlas.png",
                    "role": "既存12キャラの役割・配色・個性を保持するため確認。",
                },
            ],
        },
        "assets": records,
        "svg": {
            "file": "atelier-assets/illustrator/illustration.svg",
            "index_view": "illustration.svg#v3-index",
            "default_view": "旧アトラス表示。ゲームの帰還素材とアイコン座標を維持。",
            "guide_symbol": "v3-single-cut-guide",
            "note": "PNGをSVGへ埋め込まない。索引のベクター図は材質・重ね順の指針であり"
            "生成したキャラや裂傷の代替成果ではない。",
            "preserved": "illustration-legacy-v2.svgと既存products/word-guild/assets/*.svg",
        },
        "frames": {
            "order": ["idle", "blink", "joy", "worried", "action-1", "action-2"],
            "hero_extra": ["launch", "fall", "land"],
            "grid": "原画は3列、男女は3行、他10キャラは2行。生成された実際の姿の"
            "境界に合わせて切り出し、各キャラで共通の正方形へ透明余白を加えた。"
            "原画の等分割で隣の姿が混じる問題を修正済み。"
            "assetsのrect/padding/canvas_sizeが正。個別PNGを使い、3列の等分割をしない。",
            "display": "選択主人公104–144px、相棒80–96px、敵144–184px、案内役64–96px。"
            "320×568では既存レイアウトの縮小を優先し42マスを押し出さない。",
            "timing_proposal": {
                "blink": "idleを約3–5秒、blinkを110ms、その後idle。",
                "joy": "正解・選択で650ms。",
                "worried": "誤答で400ms。",
                "actions": "動作2フレームを110–180ms程度で切替。追加待ち時間を作らない。",
                "return": "既存launch1400ms/fall1200ms/land900msの区間に3姿を対応。",
                "reduced_motion": "自動揺れ・瞬きを止め、結果表情を静止表示。",
            },
            "special_actions": {
                "male": "本を構え、手を伸ばす。",
                "female": "本を開き、詠唱。",
                "fire": "跳ねて炎がゆらぐ。",
                "water": "水の波・しずくの揺れ。",
                "grass": "葉を振り、身を傾ける。",
                "guide": "本の回復光・帰還の手振り。",
                "cat": "前脚の攻撃・横倒れ。",
                "dog": "跳ぶ吠え攻撃・横倒れ。",
                "sun": "光輪の動き・しぼむ。",
                "ant": "踏みつけ・仰向け。",
                "animal": "本をたたく・座り込む。",
                "final": "赤い力をためる・叩きつける。",
            },
        },
        "claw": {
            "primary": "products/word-guild/assets/claw-strip-generated-v3.png",
            "elbow": "products/word-guild/assets/claw-elbow-generated-v3.png",
            "count": "正解語一件に一本の連続溝。赤い内部亀裂は溝内部の材質。",
            "uv": "直線の切り出しは原画(32,384)から1472×256。"
            "始端294px、中部884px、終端294px。先端素材は経路の最初と最後で各一回。"
            "中部を経路方向へ連続して写し、端部を各マスで繰り返さない。",
            "mask": "実DOMのマス中心から上下左右の経路を作る。"
            "幅4–7 CSS pxの溝、縁込み8–12pxを制作推奨とする。"
            "全素材を一つのテーパー付き経路マスクで切り、両端はゼロ幅へ収束。"
            "角は半径6–10pxで接続し、進行方向と法線でUVを曲げる。"
            "曲がり角PNGは質感の連続性の参照と局所パッチ用。"
            "必要なら回転して使い、同じ角へ複数の傷を重ねない。",
            "elbow_measured_guide": {
                "image_size": [1254, 1254],
                "approx_centerline": [[54, 250], [940, 250], [1034, 332], [1042, 1180]],
                "note": "生成結果を目視した概略。厳密な経路へはUVワープで合わせる。",
            },
            "legibility": "石→傷→文字。文字z-index:2、傷z-index:1、pointer-events:none。"
            "文字に石色の0.7–1px輪郭。黒い深部と赤い内部光を増幅せず文字面を確保。",
            "reveal": "正解時刻から240msで経路順に一つのマスクを開示。"
            "再描画でも開始時刻を保持。誤答・重複・キャンセルで追加しない。"
            "旧傷を再開せず、崩落で消去、新階層には持ち越さない。"
            "reduced-motionは即時表示。",
            "fixture": "quality/generated-v3/preview.html。直線はCSSの左→右240ms開示の"
            "素材試作、角は静止材質作例。本番の任意経路開示は実装担当が組み込む。",
        },
        "validation": {
            "file": "quality/generated-v3/results.json",
            "approved": True,
            "meaning": "担当範囲のコードと自動検査の合否。魅力の最終評価ではない。",
            "checks": [
                ["python", "quality/check_generated_art_v3.py"],
                [
                    "node",
                    "--test",
                    "tests/word-guild.test.mjs",
                    "tests/word-guild-transition.test.mjs",
                ],
                ["python", "quality/check_word_guild_browser.py"],
            ],
            "opened": "生成14枚の原画、12キャラ全ての*-phone.png、"
            "male-390/guide-320/claw-390/claw-320/reveal-100ms-320、"
            "vector-indexをview_imageで実際に開いた。",
        },
        "issues": [],
        "integration_pending": "新しいPNG表示・フレーム切替・任意経路裂傷の統合は実装担当へ。"
        "本番の既存ゲームは維持。音楽と難問ボスの出題は他担当の範囲。",
        "human_checks": [
            "iPhone 17/iOS26.1のSafariとホーム画面で統合後の見やすさ・動作。",
            "細かな生成絵の魅力、案内役の表示寸法、背景へのなじみ。",
            "幅・角丸・フレーム時間は提案。最終の操作感は人が判断。",
            "音楽の聴感と難問ボスの難易度は本担当では未確認。",
        ],
    }
    art.write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8")
    print("artwork.json: 14 generated sheets, 78 frames, full prompts and integration guidance")


if __name__ == "__main__":
    run()
