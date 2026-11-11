# ことばのギルド 音源クレジット（道中・乱入差し替え）

無料の公式配布音源を2026-10-07に取得。外部URLの直接再生、動画からの抽出、有料WAV購入は行わない。

|場面|曲名・作者|公式配布元|ループ|
|---|---|---|---|
|ホーム・選択・ギルド帰還後|なんでしょう？／KK|[OpenTracks（旧DOVA-SYNDROME）](https://opentracks.com/bgm/detail/710)|トラック1の公式ループ版、デコード全長|
|道中第1〜4階層・その移動|Breeze3／PeriTune・むつき醒 (Sei Mutsuki)|[曲ページ](https://peritune.com/blog/2020/03/11/breeze3/)・[公式無料ループZIP](https://peritune.com/loop/PerituneMaterial_Breeze3_loop.zip)|公式MP3ループ版、デコード全長、音量0.28|
|通常ボス|Flap2／PeriTune・むつき醒 (Sei Mutsuki)|[曲ページ](https://peritune.com/blog/2019/09/11/flap2/)・[公式無料ループZIP](https://peritune.com/loop/PerituneMaterial_Flap2_loop.zip)|既存MP3・全長・音量0.28を保持|
|乱入ボス|Raid／PeriTune・むつき醒 (Sei Mutsuki)|[曲ページ](https://peritune.com/blog/2015/08/12/raid/)・[公式無料ループZIP](https://peritune.com/loop/PerituneMaterial_Raid_loop.zip)|公式MP3ループ版、デコード全長、音量0.24|
|HP0・敗北・吹き飛び・落下・着地|BGM停止|audio-policy.mjsのmusicScene=null|launch・fallにオリジナル風効果音のみ|

## 追加二曲の取得記録
2026-10-07、上記曲ページと[現行利用条件](https://peritune.com/about/)を再確認。Breeze3は2020-03-11、Raidは2015-08-12公開。2026年2月以前の公開曲にはCC BY 4.0が継続適用される。作者・出典・[CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)を表示し、公式ZIPからMP3だけを無変更で同梱した。再生時は既存Musicによる両端8msフェードと表の音量調整のみ。動画抽出・有料素材・外部サービスへの委託は行っていない。

|ファイル|ZIP内ファイル名|bytes|SHA256|
|---|---|---:|---|
|breeze3-loop.mp3|PerituneMaterial_Breeze3_loop.mp3|2341440|af28f57d01b093111a96a759d55a1a9533cd9d3f2a1de50803f38c3e5eb1ea75|
|raid-loop.mp3|PerituneMaterial_Raid_loop.mp3|2021249|a7cec2bf3d701af2984c1d9c45eef6e012751c2d8af00f0e20d53e82c37cf70c|
|flap2-loop.mp3（変更なし）|PerituneMaterial_Flap2_loop.mp3|4379166|4a48cbdfdc454c46a6996bc2733ffba736d16ea1dae5dba4b8c7288931daadeb|

ループは0秒以上・デコード全長未満。正確なデコード尺とPCMはquality/check_word_guild_music.pyが実ブラウザーで計測する。道中の再描画・階層移動は同じURL・区間を使い、Musicの共有と競合無効化を維持する。

## Flap2
2019年公開曲。曲ページのCC BY 4.0と[PeriTune利用条件](https://peritune.com/about/)の2026年2月以前の曲の継続条項を確認。[Creative Commons Attribution 4.0 International](https://creativecommons.org/licenses/by/4.0/)で使用する。公式MP3は無変更で同梱。音源の利用権利を制限する技術的保護を加えない。再生時のみ音量0.28と両端8msフェードを適用する。曲・作者・出典・ライセンスと加工内容を上記に表示する。

## OpenTracks二曲
[音源利用ライセンス](https://opentracks.com/help/articles/license/)・[規約](https://opentracks.com/help/articles/terms/)・[KK条件](https://opentracks.com/creator/detail/19)・[yuki条件](https://opentracks.com/creator/detail/92)を確認。両作者はサイト条件に準拠。ゲームBGM用途・編集可、クレジットや報告は必須ではないがここに記す。
公式ページの各トラック1ダウンロードボタンを個別操作して取得。容易に音声ファイルとしてアクセス・複製できる原MP3の配布を避け、ゲーム用WGM1データへコンバート（4byteヘッダーとXOR 0xa7）して同梱する。原MP3は配信フォルダーに残さない。これは独自ゲームデータへの変換であり、完全な複製防止や法的保証ではない。Flap2にはこのサイト固有の制限を適用しない。
再生時の音量はホーム0.32。両端8msフェードでサンプル境界の段差を抑える。旧帰還曲「ぐだぐだな感じ／yuki」は元データとクレジットを保持するが、最新の方針では敗北・飛行に使用しない。music-cues.mjsのreturnは旧API互換用で、resolveAudioPolicyはこのsceneを返さない。

## 基本担当への接続手順
app.mjsでresolveAudioPolicy({screen,stage:game?.stage,state:game?.state})を使用する。musicSceneがnullならMusic.stop()を呼び、Music.play(null)は呼ばない（既存Musicは未知sceneをホームへ代替する）。停止時もplayRequestを増やし、古い取得成功が音楽エラーを消さない条件を維持する。

最初の開始タップで既存Music.contextを作成・resumeし、同じcontextをnew FlightSound(music.context)へ渡す。FlightSoundはcontextを作成・resumeしない。enabled && !document.hidden && policy.flightSoundの間だけstart()、それ以外はstop()。launch→fallはstopを挟まず、再描画でもstartは一度だけ。非表示イベントと音楽停止ボタンではBGMと効果音を両方止める。表示復帰・ユーザー再開は現在の方針へ同期する。state getterは凍結スナップショットなのでwordGuildState.flightSoundに公開できる。エラー種類別保持は変更しない。

飛行だけの場面でcontextがsuspendedなら、呼び出し側が既存context.resume()を待つ。await後にplayRequest・enabled・hidden・現在のflightSound方針を再確認してからstartする。Music.playでresumeするためにホーム曲を鳴らしてはいけない。resume待ち中に停止・非表示・着地した場合は風音も開始しない。

この担当コピーではapp.mjsは編集権限外。quality/check_word_guild_music_browser.pyの--components-onlyはモジュールを実AudioContextで検査し、通常実行はappの接続まで検査する。検査の--no-writeは証拠を標準出力へ返し、担当外の結果・画像を上書きしない。

## 音響担当の検証記録（2026-10-07）
担当範囲のためquality/DESIGN.md・REPORT.mdは編集していない。基本担当はこの記録と接続手順を全体報告へ統合する。

|実行コマンド|結果と根拠|
|---|---|
|`python -B quality/check_word_guild_audio.py --components-only --no-write`（PYTHONDONTWRITEBYTECODE=1）|終了0。Node音響5件、公式取得・無改変・実デコード・PCM・ループ62項目、実AudioContext/OfflineAudioContext18項目成功|
|`python -B quality/check_word_guild_music_browser.py --errors-only --no-write`|終了0。390×844・320×568・1280×900の保存失敗＋Breeze3の実HTTP503、素材失敗との併発、再取得・エラー独立保持・全42マスの収まり17項目成功|
|`node --test --test-timeout=10000 --test-skip-pattern='音楽の場面別\|同一曲の取得中' tests/word-guild.test.mjs tests/word-guild-transition.test.mjs`|終了0。既存の入力・HP・保存・状態遷移・素材共有など15件成功。旧音響期待値2件だけ対象外とし、担当外のテストを変更していない。新しい5件で場面差分・共有・競合・解放を検査した|
|`python -B -m ruff check --no-cache quality/check_word_guild_music.py quality/check_word_guild_music_browser.py quality/check_word_guild_audio.py` と同3ファイルの `ruff format --check`|成功（構文・書式調整後）|
|4担当mjsの `node --check`、3担当PythonのUTF-8読込・`ast.parse`|成功|

Chromiumの実デコードは2ch・48000Hz。Breeze3は97.506625秒、Flap2は182.4秒、Raidは84.155833秒。全曲のフェード後境界差は0。出力RMSは道中0.09259、通常ボス0.07203、乱入0.06923で、出力ピークは0.28以下。Breeze3原デコードは128サンプル間隔の抽出検査で4点が1に達したため、原曲のクリップなしとは主張しない。既存原MP3を保持し、再生ゲインで出力に余裕を確保した。

飛行音はlaunch＋fallの2.6秒に合わせて音高とフィルター周波数を下げ、立ち上がり0.14秒・終端0音量へ変化する。44100Hz・2chで実レンダリングした風音のRMSは0.02739、左右差RMSは0.02879、ピーク0.24232、終了後の末尾は0。start重複防止、自然終了後の再描画による復活防止、全ノードdisconnect、明示停止、suspended contextでの再生拒否を検査した。

旧Node音響テスト2件は「全戦闘Flap2」の期待値を持つので、基本担当が新しい3曲対応へ更新する。負のname-patternによる初回試行は旧共有テストで待ち続けたためプロセスを停止し、上記skip-patternで15件を正常再実行した。検査失敗を全成功と扱っていない。

app.mjs接続後のフル音楽ブラウザー検査（飛行中の本番停止・復帰を含む）は未実行。登録済みのquality/check_word_guild_audio.pyをオプションなしで再実行すると、この接続まで検査する。スクリーンショットは担当外パスを保護するため保存しておらず、基本担当の画面検査へ引き継ぐ。iPhone Safari・ホーム画面、聴感、ミームとしての好み、jabo1398指定版の一致も未確認。

## 未確認
jabo1398表記と公式Flap2の指定版の一致。ホームと帰還の二曲は制作側の選曲候補で、利用者の指定曲ではない。ミームとしての選曲の好み・聴き心地・iPhone実機の音量と再生を人が確認する。
取得SHA256・ファイルサイズ・公式取得URLはquality/free-music-download.jsonに記録。
