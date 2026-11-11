// 最新human_feedbackの帰還相談・凍結・困惑と、音声がない時の字幕を対応させる。
// 接続: home(returned)とrenderGame()で取得し、bubbleへtextContentで表示する。
// 本文spanはwhite-space:pre-lineにして改行を保つ。speakerはsmallへ分ける。
// 通常battleではgame.messageがenemy.hintと異なる時（誤答・重複・1語発見）を優先。
// finalのbattle/intrusion/counterは本関数の驚きだけを使う。タイマーはcoreが管理。
// フルボイス接続ではgetDialogueStoryBeat(director.snapshot, context)を会話欄だけへ
// 表示する。Director未読込・字幕完了時もgetStoryBeatの既存返値を維持する。
const beat=(text,expression='idle',speaker='しるべ')=>Object.freeze({speaker,text,expression});
const BEATS=Object.freeze({
 home:beat('言葉を見つけて、森の奥の書庫へ。\n相棒と冒険に出かけよう。'),
 returned:beat('大変だったね…。HPが0になると敗北だよ。\n言葉の探し方はばっちり。まずは休もう。','joy'),
 select:beat('主人公と相棒を選ぼう。\nいっしょに森の書庫へ向かうよ。'),
 cat:beat('書庫への第一歩。猫はcat。\n横になぞろう。一歩戻すと取り消せるよ。'),
 dog:beat('橋の番人だ。犬はdog。\n今度は縦になぞって進もう。'),
 sun:beat('庭に光が差したね。太陽はsun。\n横の三文字を探そう。'),
 ant:beat('根っこの道だ。アリはant。\n途中で曲がってなぞろう。'),
 animal:beat('書庫の番人だ。猫・犬・アリから\n違う言葉を2つ見つけよう。'),
 final:beat('ええっ…！','action-2'),
 defeated:beat('正解！言葉の力で道が開いた。\n書庫の奥へ進もう。','joy'),
 bossDefeated:beat('見事だ。今日の試練は、これで終わりだ。','joy','けものの番人'),
 travel:beat('言葉をたどって、森の奥へ。\n次の階層に進もう。'),
 returning:beat('よし、ギルドに帰ろう。\n帰り道は、こっちだよ。','joy'),
 freezing:beat('待って。道が…ゆがんでる！\n足元も凍ってきた…！','worried'),
 bewildered:beat('なんだ、なんだ！？\n私の庭が凍っておるぞ！','worried','けものの番人'),
 arriving:beat('新しい道にも、言葉の試練。\n次の言葉を探そう。'),
 loss:beat('HPが0になると敗北だよ。\n今回はギルドへ戻ろう。','worried'),
 flight:beat('うわああああああ','worried','主人公')
});
const STAGES=Object.freeze(['cat','dog','sun','ant','animal','final']);
const HERO_NAMES=Object.freeze({male:'リオ',female:'ミナ'});
export function getStoryBeat({screen,stage,state,returned=false,hero,ally}={}){
 // allyは将来の文の選択用の入力。能力や保存へ触れない。
 if(screen==='home'||screen==='top')return returned?BEATS.returned:BEATS.home;
 if(screen==='select')return BEATS.select;
 if(screen!=='game')return null;
 if(['launch','fall','land'].includes(state))return Object.freeze({...BEATS.flight,speaker:HERO_NAMES[hero]||'主人公'});
 if(state==='loss')return BEATS.loss;
 if(!Number.isInteger(stage)||stage<0||stage>=STAGES.length)return null;
 if(stage===5&&['battle','intrusion','counter','arriving'].includes(state))return BEATS.final;
 if(stage===4&&['returning','freezing','bewildered'].includes(state))return BEATS[state];
 if(state==='defeated')return stage===4?BEATS.bossDefeated:BEATS.defeated;
 if(state==='travel')return stage===4?BEATS.returning:BEATS.travel;
 if(state==='arriving')return BEATS.arriving;
 if(state==='battle')return BEATS[STAGES[stage]];
 return null;
}

// 取得失敗・音声停止時にも最新の物語を表示。飛行は遅延snapshotにも叫びだけを返す。
export function getDialogueStoryBeat(snapshot,context={}){
 if(context.screen==='game'&&['launch','fall','land'].includes(context.state))return getStoryBeat(context);
 const line=snapshot?.current;
 if(!line)return getStoryBeat(context);
 return beat(line.text,line.expression,line.speakerName||line.speaker);
}
