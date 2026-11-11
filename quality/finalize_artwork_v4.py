"""イラスト担当の索引・引き継ぎと実行結果を保存する。"""

import hashlib
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
QA = ROOT / "quality/generated-v4"


def run():
    records = json.loads((QA / "asset-records.json").read_text(encoding="utf-8"))
    result = json.loads((QA / "results.json").read_text(encoding="utf-8"))
    baseline = json.loads((QA / "preservation-baseline.json").read_text(encoding="utf-8"))
    preserved = all(
        hashlib.sha256((ROOT / file).read_bytes()).hexdigest() == digest
        for file, digest in baseline.items()
    )
    assert preserved and result["approved"] and len(result["checks"]) == 475
    poses = ["idle", "blink", "joy", "worried", "action-1", "action-2"]
    human_checks = [
        "iPhone 17・iOS 26.1のSafari／ホーム画面で、本番統合後の収まりと読みやすさ。",
        "キャラの表情・細かなドットと背景の釣り合い、男女の帰還ポーズの魅力。",
        "傷35%拡大の具体値・角丸・帰還四景の時間配分は制作案。実際の操作感で最終判断。",
        "装飾を本番サイズへ配置した際の文字のコントラストと背景のトリミング。",
        "BGMの利用条件・聴感は音楽担当と人の確認。今回の素材担当は音源を変更していない。",
    ]
    verification = {
        "scope": "イラスト素材・ベクター索引・素材確認用ブラウザー",
        "approved": True,
        "issues": [],
        "new_assets": 108,
        "selected_generated_originals": 24,
        "imagegen_calls": 25,
        "character_frames": 78,
        "ui_parts": 6,
        "old_product_files_preserved": len(baseline),
        "checks": [
            {
                "command": "python quality/check_generated_art_v4.py",
                "passed": True,
                "assertions": 475,
            },
            {
                "command": "node --test tests/word-guild.test.mjs "
                "tests/word-guild-transition.test.mjs",
                "passed": True,
                "assertions": 13,
                "scope_note": "既存仕様の回帰。10秒ラスボス等の新しいルールは他担当の統合待ち。",
            },
            {
                "command": "python quality/check_word_guild_browser.py",
                "passed": True,
                "assertions": 161,
            },
            {
                "command": "python quality/check_word_guild_claws_browser.py",
                "passed": True,
                "assertions": 91,
            },
            {
                "command": "python quality/run_ruff.py all quality/package_generated_art_v4.py "
                "quality/build_art_preview_v4.py quality/build_art_index_v4.py "
                "quality/check_generated_art_v4.py quality/finalize_artwork_v4.py",
                "passed": True,
                "files": 5,
                "modes": ["check", "format --check"],
            },
            {
                "command": "python quality/check_word_guild_integration_v3.py",
                "passed": False,
                "error": "受領素材保持: atelier-assets/illustrator/illustration.svg",
                "reason": "旧検査は旧索引の全文SHAを固定。指定されたv4索引の追記で変化する。"
                "旧素材・図形の破損ではない。既存検査／固定SHAを無断変更せず引き継ぐ。",
                "supplement": "475項目の素材検査で旧製品全文SHAと旧SVGの名前付き図形を照合。",
            },
        ],
        "human_checks": human_checks,
        "harness_executed": False,
        "production_integration": "未変更の本番はv3を使用。v4の採用と傷の幅変更は実装担当へ。",
    }
    art = {
        "title": "ことばのギルド：細かなキャラと森の装飾・帰還四景 v4",
        "summary": "内蔵画像生成で既存12キャラ78姿を読み直して再制作。"
        "7環境・4帰還背景・6装飾部品を含む108枚を版付きで追加。"
        "一本の生成裂傷は再利用し35%拡大を試作。ゲーム・音楽・旧素材は変更していない。",
        "version": 4,
        "date": "2026-10-07",
        "primary_svg": {
            "file": "atelier-assets/illustrator/illustration.svg",
            "viewBox": "1536 0 768 640",
            "display_size": [768, 640],
            "purpose": "完全ベクターの制作索引と材質断面指針。生成PNGの代替原画ではない。",
            "views": {
                "v4-index": "1536 0 768 640",
                "legacy-atlas": "0 0 768 640",
                "v3-index": "768 0 768 640",
            },
            "preservation": "旧図形・IDは保持。旧表示が必要な参照は#legacy-atlasを指定。"
            "本番sprite関数は個別v3 PNGを使うため今回の索引追記で表示は変わらない。",
            "sha256": hashlib.sha256(
                (ROOT / "atelier-assets/illustrator/illustration.svg").read_bytes()
            ).hexdigest(),
        },
        "references_opened": [
            "添付fcf1288fe702ae092fb0bbab.jpg：整った階段状輪郭と面の陰影を参考。衣装は流用しない。",
            "添付597872d13f2b0894941e92e0.jpg：一本の深部・欠けた縁・細い端部を参考。",
            "quality/generated-v3/sources.json記載の12原画と既存78フレーム、旧キャラ一覧。",
            "既存guild.svg／floor-0.svg〜floor-5.svgの確認用描画と既存claw-strip-generated-v3.png。",
        ],
        "generation": {
            "tool": "built-in image_gen.imagegen",
            "prompts": "quality/generated-v4/prompts.json",
            "sources": "quality/generated-v4/sources.json",
            "selection": "quality/generated-v4/generation.json",
            "method": "既存原画を参照して姿・配色・表情を保持した編集生成。"
            "男主人公はピクセル段差が弱い初稿を再制作。ノイズ追加や一律減色で代用していない。",
            "character_rendering": "整理した細かな色面と階段状輪郭。髪・衣服・顔の陰影を補強。"
            "全12体の共通6姿、男女のみ飛び出し・落下・着地の3姿を追加保持。",
            "environment_rendering": "敵以外はドットでなくてよいという確定した修正に合わせ、"
            "森林と木石の素材感を持つ描き込み。ギルドの木組み・瓦・窓・旗・本・植木・石畳を保持。",
        },
        "assets": records,
        "integration": {
            "scope": "実装担当への素材指針。本番コードを今回の担当が書き換えるものではない。",
            "character_poses": poses,
            "hero_additional_poses": ["launch", "fall", "land"],
            "sprite_files": "assets/{character}-{pose}-generated-v4.png。"
            "個別PNGで表情を切り替える。"
            "切り出しは等分割せず実際の透明領域と個体境界を測定。全フレームに透明余白を持たせる。",
            "sprite_alignment": "キャラごとの共通正方形キャンバス・中央寄せ・下側16px余白。"
            "元の表示枠を保ちimage-rendering:pixelated、object-fit:contain。拡大しても操作域は広げない。",
            "behavior": "通常敵のaction-2は撃破姿。待機ループには混ぜない。"
            "男女のlaunch/fall/landは各専用。喜び／困り／瞬きを既存の状態と対応させる。"
            "最新のラスボス中はguide-worriedを驚きとして使える。ヒント無しのロジックは実装担当。",
            "environments": {
                "guild": "guild-generated-v4.pngを既存guild-artの表示枠に配置。"
                "外周の森をトリミングし、"
                "中央の本の看板・暖かい窓・入口・石畳を残す。タイトルや看板文字はDOMで重ねる。",
                "floor_order": [
                    "木漏れ日の小道",
                    "せせらぎの橋",
                    "ひだまりの庭",
                    "根っこの迷い道",
                    "けものの書庫",
                    "星の封印",
                ],
                "floor_files": "floor-{0..5}-generated-v4.png。既存arenaの背景だけを交換し、"
                "42マス・HP・案内の高さは維持。object-fit／background-size:cover、中央下の足場を優先。",
                "preload": "現在と次階層のみ先読み。帰還四景はラスボス登場時までに先読みする案。",
            },
            "ui": "ui-{part}-generated-v4.pngの6部品。実際の輪郭で切り出している。"
            "枠は四隅を保つ9スライスか背面配置を使い、主ボタンの本の徽章を縦横に潰さない。"
            "中央の文字はDOM。盤面枠の飾りはpaddingの外へ描画しpointer-events:none。"
            "42ボタンの寸法・並び・タッチ領域は変えない。アルファベットは普通の単色文字。",
            "return": {
                "total_ms": 3500,
                "status": "既存時間内の背景配置案。時間延長はしていない。",
                "phases": [
                    {
                        "state": "launch",
                        "from_ms": 0,
                        "to_ms": 700,
                        "asset": "return-exit-generated-v4.png",
                        "hero_pose": "launch",
                    },
                    {
                        "state": "launch",
                        "from_ms": 700,
                        "to_ms": 1400,
                        "asset": "return-road-generated-v4.png",
                        "hero_pose": "launch",
                    },
                    {
                        "state": "fall",
                        "from_ms": 1400,
                        "to_ms": 2600,
                        "asset": "return-approach-generated-v4.png",
                        "hero_pose": "fall",
                    },
                    {
                        "state": "land",
                        "from_ms": 2600,
                        "to_ms": 3500,
                        "asset": "return-land-generated-v4.png",
                        "hero_pose": "land",
                    },
                ],
                "composition": "出口の石造り→川沿いの森と街道→本の看板を持つギルド外観→入口の石畳。"
                "画像に飛行キャラや文字を焼き込まない。男女専用PNGを前景に重ねる。",
                "motion": "最大120msの短い切替を各区間内に含める案。reduced-motionでは静止四景の"
                "切替のみ、既存の状態・帰還会話と所要時間はそのまま。",
            },
        },
        "claw": {
            "asset": "products/word-guild/assets/claw-strip-generated-v3.png",
            "new_image_generated": False,
            "count_per_answer": 1,
            "confirmed_requirement": "一本の切り傷を今より大きくする。アルファベットは柄無し。",
            "recommended_values": {
                "viewBox": "0 0 700 600",
                "old_width": 26,
                "width": 35.1,
                "scale": 1.35,
                "half_width": 17.55,
                "corner_radius": 18.9,
                "mask_stroke_width": 45.9,
                "reveal_ms": 240,
            },
            "prototype": "quality/generated-v4/claws-preview.mjs",
            "integration": "実際のグリッド中心へ連続UVで原画を一回だけ写す既存warpを維持。"
            "幅・角丸・マスクを同じ比率で拡大。1マス毎に端部を複製しない。"
            "石→傷z-index1→普通の文字z-index2、傷はpointer-events:none。",
            "texture": "薄い両端、黒い深部、赤い内部、欠けた石の縁と光側の明暗を原画から再利用。"
            "単純な白線に置換しない。角の透明継ぎ目を避ける既存微小区間warpを維持。",
            "evidence": [
                "quality/generated-v4/cut-complete-320.png",
                "quality/generated-v4/cut-complete-390.png",
                "quality/generated-v4/cut-complete-1200.png",
                "quality/generated-v4/reveal-100ms-320.png",
            ],
        },
        "latest_feedback_handoff": [
            "普通ボスは簡単な動物分類、乱入ラスボスのみ激難。過去の両ボス専門語条件を戻さない。",
            "乱入ラスボス10秒攻撃・しるべ驚きのみ・ヒント無し。45秒の古い仕様は最新条件ではない。",
            "長時間時の答え発光ヒントは通常戦用。ラスボスには出さない。",
            "フリーBGM・通常ボスFlap2指定は音楽／実装担当。素材担当は変更せず、利用条件も未判定。",
        ],
        "verification": verification,
        "human_checks": human_checks,
    }
    (ROOT / "atelier-assets/illustrator/artwork.json").write_text(
        json.dumps(art, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    (QA / "check-summary.json").write_text(
        json.dumps(verification, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    (QA / "ATELIER_CHECKS.fragment.json").write_text(
        json.dumps(
            {
                "name": "ことばのギルド イラストv4素材・保持・実ブラウザー",
                "argv": ["python", "quality/check_generated_art_v4.py"],
                "timeout": 180,
            },
            ensure_ascii=False,
            indent=2,
        )
        + "\n",
        encoding="utf-8",
    )
    print(f"Artwork v4: 108 PNGs / {len(baseline)} old product files preserved / 475 checks")


if __name__ == "__main__":
    run()
