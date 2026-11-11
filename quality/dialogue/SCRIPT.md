# ことばのギルド：最新脚本と収録の対応

2026-10-09。本番dialogue-script.jsonの21イベント・38行を、男女差分を含む50キーへ展開する。収録表の本文・読みと対応する。以前の「奥へ進め」や飛行中の実況・着地の冗談は使用しない。

確定条件は、女性声のしるべ、帰還相談→道の異変と凍結→しるべと番人の困惑→乱入、飛行・落下・着地中の「うわああああああ」限定。上下左右、一歩戻し、SUN横、animalのcat・dog・antの異なる2語、合算HPと生存保護は維持する。乱入10秒は操作可能なbattle開始から測り、前の演出では時計・攻撃・回復を進めない。

通常の正解・HP更新・出発・階層移動では現在の発話を継続する。carryは未再生行についての指定。帰還相談で古い勝利・操作説明のキューを整理し、番人の承認を残す。凍結、困惑、乱入では前の会話を割り込んで整理する。defeatでは古い乱入会話を止め、新しい発話はしない。launchで叫びを一度開始し、fall・landで再発火せず、帰還後にHPゼロを説明する。遅い終了通知は開始時のplaybackIdで照合する。

字幕代替もstory.mjsで同じ展開を保つ。会話と声を停止しても物語の時計で進む。取得失敗時は字幕の目標尺で会話だけを進める。音声の正常再生は実尺で次の行へ進み、目標尺で声を切らない。非表示では声・会話・物語時計を止める。帰還相談12秒、凍結6秒、困惑6.5秒は確定音声の尺に合わせた映像の制作値であり、音声完了を進行条件にしない。

女性しるべはF2、女性主人公はF1。声質、英語の発音、日本語の自然さ、掛け合いの間、演技・台詞の好み、候補モデルの採用判断はhuman_checks。本文、読み、配役、表情、演技、具体的な尺は制作案と区別する。より高性能な新サービスを採用済みとは扱わない。

追加イベントはboss.returning/freezing/bewildered。追加6音声キーは帰還案内・道の異変・男女の氷の驚き・しるべと番人の困惑。旧defeat.hero.return、flight.hero.fall、flight.hero.landの男女6キーを削除。defeat.guide.hpはguild.returnへ移動。全しるべ行を女性声で再収録し、修正文と読みを収録表へ一致させた。

以下は本番JSONから生成した全音声キーの提出表。

| voiceKey | event | speaker | text | reading | expression | direction | target(s) | recorded(s) | carry |
| --- | --- | --- | --- | --- | --- | --- | ---: | ---: | --- |
| select.guide.welcome | select.enter | guide | ようこそ。今日は言葉で、森の道を開こう。 | ようこそ。きょうはことばで、もりのみちをひらこう。 | idle | 温かく、後半に期待 | 3.4 | 3.913 | True |
| select.hero.ready.male | select.enter | male | 剣より先に、言葉の出番か！ | けんよりさきに、ことばのでばんか！ | joy | 勢いよく返事、語尾は自然 | 2.4 | 2.902 | False |
| select.hero.ready.female | select.enter | female | まずは言葉で勝負、というわけね。 | まずはことばでしょうぶ、というわけね。 | joy | 勢いよく返事、語尾は自然 | 2.4 | 2.508 | False |
| select.guide.partner | select.enter | guide | その前に、相棒を選ぼう。一緒なら心強いよ。 | そのまえに、あいぼうをえらぼう。いっしょならこころづよいよ。 | joy | 落ち着いた女性声。温かく、性別を強調する語尾は使わない | 3.5 | 4.389 | False |
| depart.hero.step.male | depart | male | よし、森の書庫へ出発だ！ | よし、もりのしょこへしゅっぱつだ！ | idle | 前を向く明るい決意 | 2.3 | 2.438 | True |
| depart.hero.step.female | depart | female | 準備よし。森の書庫へ行こう！ | じゅんびよし。もりのしょこへいこう！ | idle | 前を向く明るい決意 | 2.3 | 2.171 | True |
| cat.guide.trace | stage.cat | guide | 猫はcat。横になぞって、指を離そう。 | ねこはキャット。よこになぞって、ゆびをはなそう。 | idle | ゆっくり明瞭。英語は自然に | 3.2 | 3.796 | False |
| cat.enemy.dignity | stage.cat | cat | なぞるのは文字だ。私のひげではないぞ。 | なぞるのはもじだ。わたしのひげではないぞ。 | idle | 真顔で気高く | 3.0 | 3.286 | False |
| cat.hero.whisker.male | stage.cat | male | ひげにも正解があるのかと思った。 | ひげにもせいかいがあるのかとおもった。 | joy | さらっと切り返す | 2.2 | 2.113 | False |
| cat.hero.whisker.female | stage.cat | female | 文字よりひげのほうが目立つもの。 | もじよりひげのほうがめだつもの。 | joy | さらっと切り返す | 2.2 | 2.183 | False |
| cat.guide.undo | stage.cat | guide | 行きすぎたら、一歩戻して取り消せるよ。 | いきすぎたら、いっぽもどしてとりけせるよ。 | idle | 短い補足、操作を急かさない | 3.0 | 3.216 | False |
| dog.enemy.bridge | stage.dog | dog | この橋は、言葉を知る者だけ通す！ | このはしは、ことばをしるものだけとおす！ | idle | 律儀に宣言 | 2.7 | 3.460 | False |
| dog.guide.vertical | stage.dog | guide | 犬はdog。今度は縦になぞろう。 | いぬはドッグ。こんどはたてになぞろう。 | idle | 縦を少し強調 | 2.7 | 3.111 | False |
| dog.hero.bridge.male | stage.dog | male | 橋は横なのに、文字は縦なんだな。 | はしはよこなのに、もじはたてなんだな。 | joy | 小さく納得して笑う | 2.3 | 3.309 | False |
| dog.hero.bridge.female | stage.dog | female | 橋の向きまで試験に出なくてよかった。 | はしのむきまでしけんにでなくてよかった。 | joy | 小さく納得して笑う | 2.3 | 2.601 | False |
| sun.guide.horizontal | stage.sun | guide | 太陽はsun。横の三文字を探そう。 | たいようはサン。よこのさんもじをさがそう。 | idle | 明るく短い説明 | 2.8 | 3.065 | False |
| sun.enemy.radiance | stage.sun | sun | 私の輝きに、目を奪われたか。 | わたしのかがやきに、めをうばわれたか。 | idle | 少し芝居がかって | 2.4 | 2.995 | False |
| sun.hero.focus.male | stage.sun | male | 今、文字のほうを見てる！ | いま、もじのほうをみてる！ | joy | 落ち着いたツッコミ | 2.0 | 2.020 | False |
| sun.hero.focus.female | stage.sun | female | ごめん、今は三文字に夢中。 | ごめん、いまはさんもじにむちゅう。 | joy | 落ち着いたツッコミ | 2.0 | 2.508 | False |
| ant.enemy.bend | stage.ant | ant | 根っこの道は、まっすぐとは限らん。 | ねっこのみちは、まっすぐとはかぎらん。 | idle | 職人らしく簡潔 | 2.8 | 2.810 | False |
| ant.guide.turn | stage.ant | guide | アリはant。隣のマスへ進んで、途中で曲がろう。 | ありはアント。となりのマスへすすんで、とちゅうでまがろう。 | idle | 曲がるを明瞭に | 3.5 | 4.191 | False |
| ant.hero.turn.male | stage.ant | male | 文字も冒険も、寄り道が大事だな。 | もじもぼうけんも、よりみちがだいじだな。 | joy | 自信がついた軽い冗談 | 2.3 | 3.274 | False |
| ant.hero.turn.female | stage.ant | female | 文字の道も、まっすぐとは限らないね。 | もじのみちも、まっすぐとはかぎらないね。 | joy | 自信がついた軽い冗談 | 2.3 | 3.262 | False |
| animal.enemy.challenge | stage.animal | animal | よく来た。覚えた動物の言葉を示せ。 | よくきた。おぼえたどうぶつのことばをしめせ。 | idle | 低く威厳、威圧しすぎない | 2.8 | 3.680 | False |
| animal.guide.two | stage.animal | guide | cat・dog・antから、違う言葉を二つ。 | キャット、ドッグ、アントから、ちがうことばをふたつ。 | idle | 三語を区切る。二つを明瞭に | 3.3 | 3.924 | False |
| animal.hero.review.male | stage.animal | male | 強そうだけど、ちゃんと復習なんだな！ | つよそうだけど、ちゃんとふくしゅうなんだな！ | joy | 少し緊張から安心へ | 2.4 | 3.158 | False |
| animal.hero.review.female | stage.animal | female | 見た目は迫力満点。でも、ちゃんと復習なのね。 | みためははくりょくまんてん。でも、ちゃんとふくしゅうなのね。 | joy | 少し緊張から安心へ | 2.4 | 4.342 | False |
| retry.guide | answer.wrong | guide | 大丈夫。最初の文字から、もう一度。 | だいじょうぶ。さいしょのもじから、もういちど。 | idle | 安心させる。残念そうにしない | 2.6 | 3.379 | False |
| duplicate.guide | answer.duplicate | guide | それは発見済み。違う言葉を探そう。 | それははっけんずみ。ちがうことばをさがそう。 | idle | 責めず、簡潔 | 2.7 | 3.274 | False |
| found.guide | answer.found | guide | 一つ見つけたね。あと一つ！ | ひとつみつけたね。あとひとつ！ | joy | 小さく祝福 | 2.2 | 2.601 | False |
| clear.hero.male | stage.clear | male | よし、言葉で道が開いた！ | よし、ことばでみちがひらいた！ | joy | 短い勝利の声 | 1.8 | 2.601 | True |
| clear.hero.female | stage.clear | female | 見つけた！次の道が開くよ。 | みつけた！つぎのみちがひらくよ。 | joy | 短い勝利の声 | 1.8 | 2.485 | True |
| animal.enemy.approval | boss.clear | animal | 見事だ。今日の試練は、これで終わりだ。 | みごとだ。きょうのしれんは、これでおわりだ。 | joy | 誇らしく学びを認める。さらに奥へは誘導しない | 2.6 | 3.553 | True |
| returning.guide.guild | boss.returning | guide | よし、ギルドに帰ろう。帰り道は、こっちだよ。 | よし、ギルドにかえろう。かえりみちは、こっちだよ。 | joy | 落ち着いた女性声。冒険を終えてほっとした帰還の案内 | 2.8 | 3.924 | False |
| freezing.guide.terrain | boss.freezing | guide | 待って。道が…ゆがんでる！ | まって。みちが、ゆがんでる！ | worried | 最初に気づいて息をのむ。道の変形に合わせる | 2.6 | 2.461 | False |
| freezing.hero.ice.male | boss.freezing | male | 足元が凍ってきた…！ | あしもとがこおってきた！ | worried | 足元を見て驚く。男女とも同じ状況と読み | 2.1 | 1.440 | False |
| freezing.hero.ice.female | boss.freezing | female | 足元が凍ってきた…！ | あしもとがこおってきた！ | worried | 足元を見て驚く。男女とも同じ状況と読み | 2.1 | 1.463 | False |
| bewildered.guide.what | boss.bewildered | guide | 何が起きてるの…！？ | なにがおきてるの！？ | action-2 | 困惑して周囲を見回す。ヒントや解説はしない | 1.8 | 1.474 | False |
| bewildered.animal.garden | boss.bewildered | animal | なんだ、なんだ！？私の庭が凍っておるぞ！ | なんだ、なんだ！？わたしのにわがこおっておるぞ！ | worried | 倒された番人も起き上がり困惑。威厳を忘れて慌てる | 3.3 | 3.901 | False |
| raid.guide.shock | raid.enter | guide | ええっ…！ | ええっ！ | action-2 | 息をのむ純粋な驚き。説明を足さない | 1.2 | 0.534 | False |
| raid.enemy.threat | raid.enter | final | その小さな言葉で、私に届くと思うか。 | そのちいさなことばで、わたしにとどくとおもうか。 | action-1 | 低く静かに。長い笑いや追加アドリブなし | 3.1 | 3.216 | False |
| raid.hero.alarm.male | raid.enter | male | 書庫に、こんな客も来るのか…！ | しょこに、こんなきゃくもくるのか！ | worried | 強がりに戸惑いが混じる | 2.2 | 2.577 | False |
| raid.hero.alarm.female | raid.enter | female | この気配、番人とは違う…！ | このけはい、ばんにんとはちがう！ | worried | 強がりに戸惑いが混じる | 2.2 | 2.264 | False |
| flight.hero.launch.male | flight.launch | male | うわああああああ | うわああああああ | worried | うわああああああだけを一息で叫ぶ。飛行開始で一度。落下・着地で再開しない | 3.4 | 1.173 | True |
| flight.hero.launch.female | flight.launch | female | うわああああああ | うわああああああ | worried | うわああああああだけを一息で叫ぶ。飛行開始で一度。落下・着地で再開しない | 3.4 | 0.998 | True |
| return.guide.welcome | guild.return | guide | 大変だったね…。でも、言葉探しはばっちり。 | たいへんだったね。でも、ことばさがしはばっちり。 | joy | 柔らかい労いから祝福 | 3.4 | 3.762 | False |
| defeat.guide.hp | guild.return | guide | HPがゼロになると敗北。まずは、ここで休もう。 | エイチピーがゼロになるとはいぼく。まずは、ここでやすもう。 | worried | 帰還後に落ち着いて説明。飛行中には持ち越さない | 3.2 | 4.470 | False |
| return.hero.lesson.male | guild.return | male | 次は言葉と、着地も練習しよう。 | つぎはことばと、ちゃくちもれんしゅうしよう。 | joy | 疲れを笑いに変える | 2.6 | 3.065 | False |
| return.hero.lesson.female | guild.return | female | 次の冒険は、帰り道も予習するわ。 | つぎのぼうけんは、かえりみちもよしゅうするわ。 | joy | 疲れを笑いに変える | 2.6 | 2.961 | False |
| return.guide.rest | guild.return | guide | その前に休憩。冒険の続きは、また一緒に。 | そのまえにきゅうけい。ぼうけんのつづきは、またいっしょに。 | joy | 余韻は温かく、短く締める | 3.0 | 4.365 | False |
