# ことばのギルド

工房の最新納品 v10（bd12a6670eda、2026-10-08）から復元した Codex 用の開発フォルダーです。
ゲーム内の元 README には「v9統合版」とあります。

- ゲーム本体と配信用素材は `products/word-guild/`
- 編集用のイラスト・楽曲素材は `atelier-assets/`
- Node の回帰テストは `tests/`
- 制作仕様は `ATELIER_SPEC.md` と `ATELIER_EDITED_SPEC.md`
- 最新納品後の未反映ファイルは `未反映の作業/` に分けて保存

このフォルダーを Codex のプロジェクトとして開きます。
PC で遊ぶには、このフォルダーで `python -m http.server 8000 --bind 127.0.0.1` を実行し、`http://127.0.0.1:8000/products/word-guild/index.html` を開きます。
回帰テストは Node.js 22 以上で `node --test "tests/*.test.mjs"` を実行します。工房で使った検証・素材生成スクリプトも `quality/` にあります。個別の検査には追加依存や過去の比較素材が必要な場合があります。

復元元 ZIP の SHA-256 は `b5946692d0011f9a760582a77b0424e22c04fbf9ae4fe52b89a943d83d7b120f` です。
