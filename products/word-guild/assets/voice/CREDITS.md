# AI音声の制作・クレジット

## 同梱音声

最新版の確定稿は38発話・21イベント（男女主人公12発話を各2種へ展開して50音声キー）。9役のWAVと既存のfile/start/end/voiceKey契約を維持する。完成条件は `manifest.json` の `status: complete`、実WAV9本、全50区間の素材検査成功。`prototype` は試作であり完成ではない。OSの汎用読み上げ、無音、検査用の合成fixtureを製品音声に使わない。今回の生成・検査の結果は末尾の「女性しるべ・改稿音声 v2」を参照する。

脚本・役名・制作方針は [会話脚本表](../../../../quality/dialogue/SCRIPT.md)。リオ・ミナ、しるべ、猫・犬・太陽・アリ・けものの番人・ことば喰いを、4つのJVNV声質とスタイル・速度で演じ分ける。特定の実在人物や既存作品の声を再現しない。

## 出典・利用条件

- 音声推論: [Style-Bert-VITS2 / litagin02](https://github.com/litagin02/Style-Bert-VITS2)、[公式PyPI 2.5.0](https://pypi.org/project/style-bert-vits2/2.5.0/)。実導入wheelの `licenses/LICENSE` はAGPL-3.0。ライブラリは制作専用venvで使用し、ブラウザーへ同梱・提供しない。
- 音声モデル: [Style-Bert-VITS2 JVNV / litagin](https://huggingface.co/litagin/style_bert_vits2_jvnv)、JP-Extra F1/F2/M1/M2。固定リビジョン `205830ca1d49e666ddfbf2a755f0108e9cade4dd`。学習元は [JVNVコーパス](https://sites.google.com/site/shinnosuketakamichi/research-topics/jvnv_corpus)。[公式モデル利用条件](https://github.com/litagin02/Style-Bert-VITS2/blob/master/docs/TERMS_OF_USE.md)とモデルカードに従い、CC BY-SA 4.0を継承。
- 日本語BERT: [ku-nlp / DeBERTa V2 large Japanese character WWM](https://huggingface.co/ku-nlp/deberta-v2-large-japanese-char-wwm)、CC BY-SA 4.0。固定リビジョン `547b0e8b044fba3f9b84d0ab9f990440bd130c8b`。元重みSHAは公式HF LFSと照合。
- 日本語発音辞書: [Open JTalk v1.11.1 / r9y9](https://github.com/r9y9/open_jtalk/releases/tag/v1.11.1)。生成用環境へ事前取得し、生成中は追加通信しない。

**本フォルダーの生成WAV音声素材は [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/deed.ja)で提供する。** クレジット: 「音声合成: Style-Bert-VITS2、JVNVモデル: litagin / JVNVコーパス、日本語BERT: ku-nlp。台詞・編集: ことばのギルド制作。」配布時はこの出典、ライセンス、変更内容を保持する。ゲームコード全体のライセンスを変更するものではない。

変更内容はオリジナル台詞からの音声合成、感情・速度調整、端点5msフェード、80msの発話間隔、話者別の連結。元の音声モデルは書き換えない。CPUのメモリ節約のため、BERTのLinear層だけを実行時に [PyTorch dynamic qint8](https://docs.pytorch.org/docs/stable/generated/torch.ao.quantization.quantize_dynamic.html)へ変換する。元モデルのSHA、実生成条件と区間SHAはmanifestに記録する。

## 配役・演技

| 役 | JVNV | 基本スタイル・速度 |
|---|---|---|
| リオ | M1 | Neutral / length 0.98 |
| ミナ | F1 | Happy / 0.98 |
| しるべ | F2 | Neutral / 強度0.45 / length 1.04 |
| 猫 | F2 | Happy / 0.94 |
| 犬 | M1 | Neutral / 1.06 |
| 太陽 | F2 | Neutral / 1.05 |
| アリ | F1 | Neutral / 0.94 |
| けものの番人 | M2 | Neutral / 1.12 |
| ことば喰い | M2 | Angry / 1.08 |

喜びの台詞はHappy、主人公・しるべの困りはSad、凍結・困惑・飛行・乱入の驚きはSurprise。乱入中のしるべは「ええっ…！」だけ。答え・分類・経路を話さない。飛行は男女とも「うわああああああ」だけを一度生成し、落下・着地の別台詞を廃止する。各行の実際のstyle・style_weight・length・読み・seedはmanifestのconditionsを参照する。配役・声質・テンポの最終採用は人の試聴で確認する。

## 初版の生成環境（履歴）

製品・通常テストから独立したworkspace内 `.voice-generation/` を使用する。Python 3.11.3、Style-Bert-VITS2 2.5.0、torch 2.3.1+cpu、transformers 4.41.1、numpy 1.26.4。WindowsのMAX_PATHは同じworkspaceの既存8.3パス、workspace内の短い `.vt` TEMP/cacheで解消し、システム設定を変更していない。

```powershell
<生成Python> -B quality/generate_word_guild_voice.py --probe
<生成Python> -B quality/generate_word_guild_voice.py --model-root .voice-generation/models --bert-root .voice-generation/bert --sample --bert-float32
<生成Python> -B quality/generate_word_guild_voice.py --model-root .voice-generation/models --bert-root .voice-generation/bert
python -B quality/check_word_guild_voice_assets.py
node --test tests/word-guild-voice.test.mjs
```

モデル4種、日本語BERTとOpen JTalk辞書を先に取得する。HF_HOME・TORCH_HOME・NLTK_DATA・NUMBA_CACHE_DIR・XDG_CACHE_HOMEは生成プロセスだけでworkspace内へ指定。HF/transformersは生成中オフライン。CPU4threads、interop1。全台詞のPCMを生成・検査してから9WAVとmanifestを書き出す。通常テストへインストール・生成モデルを登録しない。`--bert-float32` で量子化を無効化できる。

## 再生接続

`VoicePlayer` は既存MusicのAudioContextを受け取り、独立したvoice source/gainを所有する。字幕表示はゲーム時計と独立したDirectorが管理し、音声待ちでパズルを止めない。

```javascript
const voice = new VoicePlayer(music.context, {
  manifest,
  onEnded: token => director.onLineEnded(token),
  onSpeaking: active => music.setDucking(active),
  onError: error => setVoiceError(error)
});
const line = director.snapshot.current;
void voice.play({...line, id: line.playbackId});
void voice.prepare(director.snapshot.queue.slice(0, 1));
```

実際のapp接続は `Conversation` を通す。発話終了には毎回固有のplaybackIdを使い、古い終了通知を捨てる。通常の再描画や階層移動では同じsource/位置を維持し、乱入・敗北は特別会話へ切り替える。声の通知は字幕・話者・表情だけ更新し、盤面DOMを再構築しない。

発話中は既存BGM gainだけを80msの時定数で下げ、終了・停止・pauseで戻す。Music.playをダッキング目的で呼び直さない。声停止はVoicePlayerとDirectorをpauseし、ゲームとBGMは続ける。非表示でもpauseし、復帰時に同じ位置からresume。URL取得/decode共有、同時取得最大2、先読み1、cache3。停止・場面変更・disposeは遅延再生を無効化する。voice source/gainだけを解放し、共有AudioContextを閉じない。

声の取得失敗は声専用エラーを表示し、字幕・ゲームを続ける。同じtokenの再試行はresumeし、保存・音楽・画像の別エラーを消さない。個別停止・開始ボタン、実Musicとのダッキング、下側配置はappへ統合済み。

## 人に残る確認

9役の声質、日本語と英単語の読み、漫才の間、BGMとの聴感、iPhone 17/iOS 26.1のSafari・ホーム画面起動での開始/停止/復帰は人が確認する。波形・RMS・再生成功で、読みの自然さや魅力まで合格としない。

最初の担当版では環境・脚本未収録のためWAV未生成だったが、本版では脚本を統合し隔離環境を導入、9役の実CPU試作から全50行の生成と素材監査まで完了した。その旧引き継ぎは現行コードの未実装を示すものではない。最終生成・素材監査の記録はmanifestとqualityの報告を参照。

## 初版の実行結果（履歴）

9役float32試作 374.672秒、全50行qint8生成 580.063秒。9WAV・全50区間の素材監査成功。音声合計 141.351秒、容量 12820396 bytes。9役の共通試作行は元float32との尺比0.8〜1.2、RMS比0.5〜2の確認範囲に収まった。これは読みや聴感の合格ではない。数値とコマンドは [制作検証記録](../../../../quality/voice-generation/results.json) を参照。

## 女性声変更前の修正・再検査（2026-10-08、履歴）

既存の9WAV・50区間は保持し、素材監査を強化した。脚本から再計算した感情スタイル・強度・速度・seed等の条件、演技指示と目標尺を全行のmanifestと照合する。話者と参照WAVの一致、9役の配役表、実WAVとmanifestのサンプルレート・チャンネル数も確認する。話者・読み・演技・速度・seed等をメモリー上で取り違えたケースを自己検査で拒否し、誤った生成記録を完成扱いしない。

| 実行コマンド | この担当コピーでの結果 |
|---|---|
| `python -B quality/check_word_guild_voice_assets.py` | 成功、9WAV・50区間、指摘0。既存SHAと字幕・読み・生成条件の対応を確認 |
| `python -B quality/check_word_guild_voice_assets.py --self-test` | 成功、20項目。fixtureはメモリー内のみで、製品音声の代替にしない |
| `python -B quality/check_word_guild_voice_assets.py --browser` | 成功、10項目。Chromiumの実AudioContextで開始、停止、途中再開、503、遅延取得の無効化、共有BGMの進行とダッキングを確認 |
| `node --test tests/word-guild-voice.test.mjs tests/word-guild-dialogue.test.mjs tests/word-guild-conversation.test.mjs tests/word-guild.test.mjs tests/word-guild-transition.test.mjs tests/word-guild-audio.test.mjs` | 成功、58件（VoicePlayer 15件を含む）。入力・HP・時計・保存・会話・音響の回帰確認 |
| `python -m ruff check .` | 成功、指摘0 |
| `python -m ruff format --check .` | 成功、89ファイル整形済み |
| `python -B quality/generate_word_guild_voice.py --probe` | `ready: false`。このコピーの通常Pythonには生成専用依存がない。今回の音声再生成は未実施 |

過去の生成結果と今回の検査を区別する。このコピーには `.voice-generation/` が含まれず、レビューで指摘されたpip一時展開ソースと生成用補助スクリプトのRuff違反は再現しなかった。元の生成コピーへ適用するときは、基本担当がその一時ファイルの整理と保守対象スクリプトの修正を行い、同じ全体Ruffを実行する。担当外のファイルや共通設定は変更していない。

全体の会話ブラウザー検査で報告された、出発前後の別時刻の音声ID比較と撮影後の話者判定の競合は、基本担当へ修正を引き継ぐ。クリックの同じイベント内の前後状態とsource記録で継続を調べ、自然な発話終了を中断扱いしない。本担当のWebAudio検査は再生モジュールの動作確認であり、今回ゲーム全体の画面撮影・実操作検査を再実行したとは扱わない。画面変更は行っていない。

全体DESIGN・REPORT・READMEと検査登録への統合は基本担当が行う。iPhone Safari・ホーム画面起動、実音声の読み・声質・掛け合いの間とBGMとの聴感は引き続き人の確認事項であり、台詞・配役・演技の採用は制作提案として確認する。

基本担当の統合修正：生成元の作業フォルダーで439件のRuff違反を再現し、不要なpip展開物を隔離仮想環境内へ保管、制作側2スクリプトを修正した。除外設定を変更せず全体コード・書式検査が成功（93ファイル）。出発検査も同click内の音声ID・Source履歴へ変更した。9WAVとmanifestは再生成せず保持し、現行の素材監査で9役50区間の対応を確認した。担当コピーの結果と統合後の記録はquality/REPORT.mdで区別する。

## 女性しるべ・改稿音声 v2（2026-10-09）

最新依頼を優先し、旧しるべのM2男性モデルをF2女性モデルへ変更する。女性主人公F1と同一声質にせず、Neutralの強度を0.45にして落ち着いた案内役を狙う。同じ導入台詞をF1/F2で実生成した比較素材は `quality/voice-generation/revision-v2.json` のcomparison.trialsへWAVのbase64・SHA・尺・条件として保存した。F1は4.040秒、F2は3.913秒。F2採用は配役を分ける制作判断であり、比較試聴・発音改善の合格を意味しない。導入済み2.5.0と固定JVNVモデルを使い、新しいエンジンや有料・外部音声APIは採用していない。

物語担当の確定稿を `--script-source` で読み取る。対象SHA256は `0d56a39f286f410cdba59cd95ba55ce218b9e7e24c58c0bcac2027d5703e4d03`。この担当コピーの台本・app・共通設定は編集しない。帰還相談、地形異変と凍結、しるべと番人の困惑を追加し、ボスの「奥へ進め」と飛行の実況・着地の冗談を除いた稿へ対応する。HPゼロの説明はギルド帰還後の音声として収録する。

全役を同じ確定稿から再生成する。読みは脚本のreadingをそのまま使い、改稿された句切り・平仮名の読み、行別の感情・速度を生成記録へ残す。区間音量はRMS0.12を目安に、増幅上限1.8・下限0.6・ピーク上限0.96のうち安全なgainで調整し、端点5msフェード後の実RMSとPCM SHAを再計測する。native 44100Hz/mono/int16を維持し、サンプルレート変換はしない。字幕との一致は機械検査できるが、英単語の自然な発音やアクセントは人の試聴で確認する。

生成環境は既存 `80355172b32f/.voice-generation` のvenv・モデル・BERT・辞書を読み取りで利用した。依存追加、環境設定ファイル、モデル、担当外フォルダーの変更は行わない。プロセスだけのオフライン設定、`-B`、`NUMBA_DISABLE_JIT=1` で通信・bytecode・JITキャッシュの書き込みを避ける。通常ブラウザーには制作環境や音声推論サービスを要求しない。

```powershell
# <確定稿>は物語担当の読み取り元。統合後は省略して製品の台本を検査する。
<生成Python> -B quality/generate_word_guild_voice.py --model-root <既存models> --bert-root <既存bert> --dictionary-root <既存辞書> --script-source <確定稿> --latest
python -B quality/check_word_guild_voice_assets.py --script-source <確定稿>
python -B quality/check_word_guild_voice_assets.py --production-browser --script-source <確定稿>
python -B quality/check_word_guild_voice_assets.py --self-test
python -B quality/check_word_guild_voice_assets.py --browser
python -m ruff check --no-cache .
python -m ruff format --check --no-cache .
```

実音声検査とfixture検査を分けた。`--production-browser` は同梱9WAVをChromiumでdecodeし、女性しるべと男女の叫びを実AudioSourceで再生する。`--browser` はメモリー内の検査波形で通信失敗・停止・再開・BGM共有などを確認し、製品音声の代用や試聴合格には使わない。全体のゲーム画面・凍結演出の撮影は本担当の実施範囲に含めない。

統合担当は台本とmanifestのSHA一致を確認し、全体DESIGN・REPORT・READMEへ本節とrevision-v2.jsonの結果を反映する。制作音声の実尺を使ってreturning/freezing/bewilderedの映像時間を調整するが、音声取得や再生終了だけをゲーム進行の条件にしない。飛行開始で旧発話を整理し、launchの叫びを一度開始、fall/landで再開しない。10秒の乱入攻撃時計・通常の入力・HP・音楽・保存は音声の都合で変更しない。

### 実生成・最終検査結果

2026-10-09 02:05:42（日本時間）に全50区間のCPU推論が完了し、9本の実WAVとmanifestを保存した。総容量13,280,172 bytes。しるべ18区間はすべてF2、女性主人公12区間はF1。生成途中で中断した処理は完成結果へ含めない。

生成中に物語担当のhandoffだけが更新され、稿のSHAが `e9e85be5ddd21ed7aa5ea9641e830451ac86cd5ae8cb477e6d2085c99dffa5ad` へ変わった。全eventsは同一。最初の素材監査ではSHA差分だけを検出したため、`--align-script <確定稿>` で全PCM・台詞・読み・配役・演技・目標尺・生成条件を照合して整合した。音声変更を含む差分はこの処理で拒否する。実際の生成元SHAはgenerator.synthesizedScriptSha256とrevision.productionに保持し、WAVは変更していない。

| 検査 | 結果 |
|---|---|
| 確定稿指定の素材監査 | 成功、9WAV・50区間、指摘0。字幕・読み・条件・PCM/WAV SHA・RMS・区間範囲・44100Hzモノラルを照合 |
| `--production-browser --script-source <確定稿>` | 成功、実Chromium/WebAudio14項目。9WAVのdecodeと実尺、しるべの継続・停止・途中再開・自然終了一回、男女の叫びの実再生・停止。pageerror 0 |
| `--self-test` | 最終コードで成功、27項目。検査波形はメモリー内のみ |
| `--browser` | 成功、検査用WebAudio10項目。製品音声の代用ではない |
| VoicePlayer・Director・Conversation・ゲーム・遷移・音響のNode回帰 | 成功、担当コピーの既存60件。物語担当の新状態を統合した全体検査とは区別 |
| 全体 `ruff check --no-cache .` | 最終コード変更後も成功、指摘0 |
| 全体 `ruff format --check --no-cache .` | 最終コード変更後も成功、96ファイル整形済み |

台本は所有範囲外のため、この担当コピーの旧稿を編集していない。確定稿を指定した監査が上記結果であり、旧稿に対する通常監査の不一致を隠さない。基本担当が同じ確定稿と音声を同時に統合し、指定を外した通常監査とゲーム全体の実操作検査を実行する。新しいproduction-browser検査のATELIER_CHECKS登録、DESIGN・REPORT・READMEへの反映は基本担当へ引き継ぐ。

### 実尺による映像への引き継ぎ

| 場面 | 新録音声の実尺 | 基本担当への調整点 |
|---|---|---|
| 撃破承認＋帰還相談 | 番人3.553秒＋しるべ3.924秒＝7.477秒 | 現行returning 8.5秒は前の発話が続くと不足しうる。早解きの最大持ち越しとdefeated 0.75秒を含め、returning 12秒を制作提案として渡す |
| 凍結 | しるべ2.461秒＋主人公の長い方1.463秒＝3.924秒 | 現行6秒内に新会話が収まる。前段の未再生会話を整理した状態で同期を確認 |
| 困惑 | しるべ1.474秒＋番人3.901秒＝5.375秒 | 現行6.5秒内に新会話が収まる。乱入で未再生の古い会話を整理 |
| 飛行の叫び | 男性1.173秒、女性0.998秒 | 目標尺3.4秒は制作目安で、実尺とは異なる。launchで一度開始し、fall・landでは繰り返さない。飛行全体3.5秒の字幕保持と叫びの長さは統合・試聴で確認 |

これらは音声を聴き終えるまでゲームを止める実装指示ではない。通常のパズル入力を継続でき、非表示・音声停止・取得失敗時も物語が進む条件を保つ。しるべの女性声の印象、日本語・英語の発音、アクセント、掛け合いの間、BGMとの音量、叫びの長さ、iPhone Safari・ホーム画面での再生は未試聴・未実機確認。再生成功だけで聴感や高性能化の合格を宣言しない。
