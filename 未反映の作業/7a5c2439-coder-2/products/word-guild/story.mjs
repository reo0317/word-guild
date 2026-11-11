// 最新human_feedback: HP0後の救出・HP10・別離・通常ボス加入。
// 音声の取得失敗/停止時にも同じ段階を字幕で伝える。Gameや保存は変更しない。
const beat=(text,expression='idle',speaker='しるべ')=>Object.freeze({speaker,text,expression});
const BEATS=Object.freeze({
 home:beat('言葉を見つけて、森の奥の書庫へ。\n相棒と冒険に出かけよう。'),
 returned:beat('大変だったな。まずは、ここで休もう。','idle','通常ボス'),
 companionHome:beat('準備ができたら出発だ。次の案内も私に任せろ。','idle','通常ボス'),
 select:beat('主人公と相棒を選ぼう。\nいっしょに森の書庫へ向かうよ。'),
 companionSelect:beat('主人公と相棒を選ぼう。私は案内役だ。','idle','通常ボス'),
 cat:beat('書庫への第一歩。猫はcat。\n横になぞろう。一歩戻すと取り消せるよ。'),
 dog:beat('犬はdog。\n今度は縦になぞって進もう。'),
 sun:beat('庭に光が差したね。太陽はsun。\n横の三文字を探そう。'),
 ant:beat('根っこの道だ。アリはant。\n途中で曲がってなぞろう。'),
 animal:beat('動物の言葉を\n違う言葉で2つ見つけよう。'),
 final:beat('ええっ…！','action-2'),
 defeated:beat('正解！言葉の力で道が開いた。\n書庫の奥へ進もう。','joy'),
 bossDefeated:beat('見事だ。今日の試練は、これで終わりだ。','joy','通常ボス'),
 travel:beat('言葉をたどって、森の奥へ。\n次の階層に進もう。'),
 returning:beat('よし、ギルドに帰ろう。\n帰り道は、こっちだよ。','joy'),
 freezing:beat('待って。道が…ゆがんでる！\n足元も凍ってきた…！','worried'),
 bewildered:beat('なんだ、なんだ！？\n私の庭が凍っておるぞ！','worried','通常ボス'),
 arriving:beat('新しい道にも、言葉の試練。\n次の言葉を探そう。'),
 loss:beat('HPが0になった…！','worried','主人公'),
 escape:beat('ここから逃します！','action-1'),
 rescue:beat('HPが10に回復した！','joy'),
 sendoff:beat('うまく着地してくださいね！','action-1'),
 flight:beat('うわああああああ','worried','主人公'),
 bossArrival:beat('おおっと！…ここがギルドか。','worried','通常ボス'),
 bossLand:beat('おおっと！…ここがギルドか。','worried','通常ボス'),
 recruited:beat('私も仲間に加えてくれ。これからの案内は任せろ。','joy','通常ボス')
});
const STAGES=Object.freeze(['cat','dog','sun','ant','animal','final']);
const HERO_NAMES=Object.freeze({male:'リオ',female:'ミナ'});
const FLYING=new Set(['launch','fall','land']);
const STRICT_EVENTS=Object.freeze({loss:'defeat',escape:'rescue.start',rescue:'rescue.heal',sendoff:'rescue.recovered',bossArrival:'guild.boss.arrive',bossLand:'guild.boss.arrive',recruited:'guild.boss.join'});
export function getStoryBeat({screen,stage,state,returned=false,hero,bossRecruited=false,guideAvailable=true}={}){
 const joined=bossRecruited||state==='recruited'||returned;
 const narrator=line=>!line?null:line.speaker==='しるべ'&&joined?beat(line.text,line.expression,'通常ボス'):line.speaker==='しるべ'&&!guideAvailable?null:line;
 if(screen==='home'||screen==='top')return returned?BEATS.returned:joined?BEATS.companionHome:narrator(BEATS.home);
 if(screen==='select')return joined?BEATS.companionSelect:narrator(BEATS.select);
 if(screen!=='game')return null;
 if(FLYING.has(state))return beat(BEATS.flight.text,BEATS.flight.expression,HERO_NAMES[hero]||'主人公');
 if(state==='loss')return beat(BEATS.loss.text,BEATS.loss.expression,HERO_NAMES[hero]||'主人公');
 if(STRICT_EVENTS[state])return narrator(BEATS[state]);
 if(!Number.isInteger(stage)||stage<0||stage>=STAGES.length)return null;
 if(stage===5&&['battle','intrusion','counter','arriving'].includes(state))return joined?beat('…！','action-2','通常ボス'):narrator(BEATS.final);
 if(stage===4&&['returning','freezing','bewildered'].includes(state))return narrator(BEATS[state]);
 if(state==='defeated')return narrator(stage===4?BEATS.bossDefeated:BEATS.defeated);
 if(state==='travel')return narrator(stage===4?BEATS.returning:BEATS.travel);
 if(state==='arriving')return narrator(BEATS.arriving);
 if(state==='battle')return narrator(BEATS[STAGES[stage]]);
 return null;
}
export function getDialogueStoryBeat(snapshot,context={}){
 if(context.screen==='game'&&FLYING.has(context.state))return getStoryBeat(context);
 const line=snapshot?.current;
 if(!line)return getStoryBeat(context);
 // 遅い取得/通知の旧会話を救出や加入の代替字幕へ流し込まない。
 const expected=context.screen==='game'?STRICT_EVENTS[context.state]:null;
 if(expected&&line.event!==expected)return getStoryBeat(context);
 const joined=context.bossRecruited||context.state==='recruited'||context.returned;
 if(line.speaker==='guide'&&(joined||context.guideAvailable===false))return getStoryBeat(context);
 return beat(line.text,line.expression,line.speakerName||line.speaker);
}
