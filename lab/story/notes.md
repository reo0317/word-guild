# E2 試作メモ（1区 街灯1・2）

- ファイル：`story-sample.json`（企画の `data/story.json` の形）。`letters` は本番の形（街灯1＝やさしめ案 `tone:"gentle"`、街灯2＝掲示）。
  もう1つの街灯1（物語を濃く `tone:"story"`）は `variants` に置いた。差し替えて比べるときは `variants[0]` を `letters[0]` と入れ替える。
- 対象語の印は `{}`、`ids` は `{}` の出る順。
- 検査（node）：各行の ids＝石段の5語、`{}` の中は見出し語か規則変化、行の語数は 14〜20（1区の上限内）、1文14語まで、
  2通（どちらの案でも）で50語に重複・抜けなし。
- 後の区の語：fog（5区。allow に入っている）、tags（2区・掲示）、drawer（2区・物語案）。どれも1通に3語以内。
- 他の行の対象語の地の文での使用：`asks`（ask は街灯2の対象語）を街灯1の5行目で使っている。
- `story-allow.json`（初版）に無い地の文の語：eat(s), office, stay, desk, twice, map, thing, print(ed), gate, chalk, clear,
  letter(s), slow, fast(er), box(es), path, stall, fade(s), post, blank, gift, winter, anyway, counter, rule, bottom。
  E1 の担当に足してもらうか、言い換えるかを決める。
- 迷った点：point を「meeting point」ではなく「One more point（もう一点）」で `ja:点` に合わせた。late は形容詞で「{Late}?」と掲示ふうに。
