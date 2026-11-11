import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {DialogueDirector, dialogueEventFor, loadDialogueScript} from '../products/word-guild/dialogue.mjs';
import {getStoryBeat, getDialogueStoryBeat} from '../products/word-guild/story.mjs';
import {Game, Trace, PATHS} from '../products/word-guild/core.mjs';

const script = JSON.parse(await readFile(new URL('../products/word-guild/dialogue-script.json', import.meta.url), 'utf8'));
const enter = (director, stage, extras = {}) => director.dispatch({
  eventId: `enter:${stage}`, screen: 'game', stage, state: 'battle', ...extras
});
const end = director => director.onLineEnded(director.snapshot.current);
const drain = director => {
  const lines = [];
  while (director.snapshot.current) {
    lines.push(director.snapshot.current);
    assert.ok(end(director));
    assert.ok(lines.length < 100, '会話キューが有限');
  }
  return lines;
};

test('脚本の全台詞・男女変種を解決、固有voiceKey・短い字幕・実在表情', () => {
  const keys = new Set(), speakers = new Set();
  for (const hero of ['male', 'female']) {
    const d = new DialogueDirector(script);
    for (const event of script.events) {
      d.reset({hero});
      d.dispatch({eventId: event.event, event: event.event, hero});
      const lines = drain(d);
      assert.equal(lines.length, event.lines.length);
      for (const line of lines) {
        assert.ok(Object.isFrozen(line));
        assert.ok(line.text.length <= 52);
        assert.ok(line.text.split('\n').length <= 2);
        assert.ok(line.reading && line.direction && line.targetSeconds > 0);
        assert.doesNotMatch(line.text+line.reading+line.direction,/\?{2}/,'UTF-8の台詞を保持');
        assert.ok(script.speakers[line.speaker]);
        assert.ok(line.speakerName && line.voiceKey && line.playbackId);
        if (line.speaker === hero || hero === 'male') {
          assert.ok(!keys.has(line.voiceKey), `音声キー重複: ${line.voiceKey}`);
          keys.add(line.voiceKey);
        }
        speakers.add(line.speaker);
      }
    }
  }
  assert.deepEqual([...speakers].sort(), Object.keys(script.speakers).sort());
  assert.equal(script.status, 'production-proposal');
});

test('同じイベント・通常再描画・HP更新では発話もキューも再開しない', () => {
  const d = new DialogueDirector(script);
  enter(d, 0);
  const before = d.snapshot;
  for (let hp = 100; hp > 90; hp--) enter(d, 0, {hp, eventId: `frame:${hp}`});
  assert.deepEqual(d.snapshot.current, before.current);
  assert.deepEqual(d.snapshot.queue, before.queue);
  assert.ok(end(d));
  const next = d.snapshot.current;
  enter(d, 0);
  assert.deepEqual(d.snapshot.current, next);
  assert.equal(d.snapshot.queue.length, 2);
});

test('dispatch(eventId, context)とイベント省略による状態対応', () => {
  const d = new DialogueDirector(script);
  d.dispatch('select:1', {screen: 'select', hero: 'female'});
  assert.equal(d.snapshot.current.id, 'select.guide.welcome');
  assert.equal(dialogueEventFor({screen: 'game', stage: 4, state: 'defeated'}), 'boss.clear');
  assert.equal(dialogueEventFor({screen: 'game', stage: 1, state: 'defeated'}), 'stage.clear');
  assert.equal(dialogueEventFor({screen: 'game', stage: 3, state: 'travel'}), null);
  for(const state of ['returning','freezing','bewildered'])assert.equal(dialogueEventFor({screen:'game',stage:4,state}),`boss.${state}`);
  assert.equal(dialogueEventFor({screen:'game',stage:5,state:'launch'}),'flight.launch');
  for(const state of ['fall','land'])assert.equal(dialogueEventFor({screen:'game',stage:5,state}),null);
  assert.equal(dialogueEventFor({screen: 'game', stage: 99, state: 'battle'}), null);
  assert.equal(dialogueEventFor({screen: 'home', returned: true}), 'guild.return');
});

test('選択中の発話は継続、未再生主人公の声と台詞は最新の男女選択', () => {
  const d = new DialogueDirector(script);
  d.dispatch({eventId: 'select', screen: 'select', hero: 'male', ally: 'fire'});
  const welcome = d.snapshot.current;
  d.dispatch({eventId: 'hero-change', event: 'context', hero: 'female', ally: 'grass'});
  assert.deepEqual(d.snapshot.current, welcome);
  assert.equal(d.snapshot.queue[0].speaker, 'female');
  assert.ok(end(d));
  const mina = d.snapshot.current;
  assert.equal(mina.speaker, 'female');
  assert.equal(mina.voiceKey, 'select.hero.ready.female');
  assert.equal(mina.text, script.events[0].lines[1].variants.female.text);
  d.dispatch({eventId: 'hero-change-again', event: 'context', hero: 'male'});
  assert.deepEqual(d.snapshot.current, mina, '発話中は声を差し替えない');
});

test('出発中も選択導入の現在発話は続き、未再生の選択説明は除去', () => {
  const d = new DialogueDirector(script);
  d.dispatch({eventId: 'select', screen: 'select'});
  const welcome = d.snapshot.current;
  d.dispatch({eventId: 'depart', event: 'depart', screen: 'game', stage: 0, state: 'battle'});
  enter(d, 0);
  assert.deepEqual(d.snapshot.current, welcome);
  assert.ok(d.snapshot.queue.some(line => line.id === 'depart.hero.step'));
  assert.ok(!d.snapshot.queue.some(line => line.id.startsWith('select.')));
});

test('高速攻略で現在発話は通常階層間を継続、古い未再生説明は残らない', () => {
  const d = new DialogueDirector(script);
  enter(d, 0);
  const cat = d.snapshot.current;
  d.dispatch({eventId: 'clear:0', screen: 'game', stage: 0, state: 'defeated'});
  d.dispatch({eventId: 'travel:0', screen: 'game', stage: 0, state: 'travel'});
  assert.deepEqual(d.snapshot.current, cat);
  enter(d, 1);
  assert.deepEqual(d.snapshot.current, cat);
  assert.ok(d.snapshot.queue.every(line => !line.id.startsWith('cat.')));
  assert.ok(d.snapshot.queue.some(line => line.id.startsWith('dog.')));
  enter(d, 2);
  assert.ok(d.snapshot.queue.every(line => !line.id.startsWith('dog.')));
  assert.ok(d.snapshot.queue.some(line => line.id === 'sun.guide.horizontal'));
  assert.ok(!drain(d).some(line => line.id.startsWith('dog.')));
});

test('誤答・重複・発見は声を割り込ませず、連打のキューを増殖させない', () => {
  const d = new DialogueDirector(script);
  enter(d, 4);
  const before = d.snapshot.current;
  for (let n = 0; n < 100; n++) d.dispatch({eventId: `wrong:${n}`, event: 'answer.wrong'});
  assert.deepEqual(d.snapshot.current, before);
  assert.equal(d.snapshot.queue.filter(line => line.event === 'answer.wrong').length, 1);
  d.dispatch({eventId: 'found', event: 'answer.found'});
  d.dispatch({eventId: 'duplicate', event: 'answer.duplicate'});
  d.dispatch({eventId: 'clear:boss', screen: 'game', stage: 4, state: 'defeated'});
  assert.ok(!d.snapshot.queue.some(line => line.event.startsWith('answer.')));
  assert.ok(d.snapshot.queue.some(line => line.speaker === 'animal'));
});

test('撃破後・移動中・到着中の遅い回答通知で古い説明を復活させない', () => {
  for (const state of ['defeated', 'travel', 'arriving']) {
    const d = new DialogueDirector(script);
    enter(d, 4);
    const current = d.snapshot.current;
    d.dispatch({eventId: 'clear', screen: 'game', stage: 4, state: 'defeated'});
    d.dispatch({eventId: `transition:${state}`, screen: 'game', stage: 4, state});
    const queue = d.snapshot.queue;
    for (const event of ['answer.wrong', 'answer.duplicate', 'answer.found']) {
      d.dispatch({eventId: `late:${state}:${event}`, event});
      assert.deepEqual(d.snapshot.current, current, `${state}: 現在の発話は続く`);
      assert.deepEqual(d.snapshot.queue, queue, `${state}: 古い操作説明を追加しない`);
    }
    assert.ok(drain(d).every(line => !line.event.startsWith('answer.')));
  }
});

test('乱入は現在発話と全旧キューを切替、しるべは驚きのみ、導入は一回', () => {
  const d = new DialogueDirector(script);
  enter(d, 4);
  const old = d.snapshot.current;
  d.dispatch({eventId: 'raid:intrusion', screen: 'game', stage: 5, state: 'intrusion'});
  assert.equal(d.snapshot.current.id, 'raid.guide.shock');
  assert.notEqual(d.snapshot.current.playbackId, old.playbackId);
  assert.equal(d.onLineEnded(old.playbackId), false);
  const raid = d.snapshot;
  enter(d, 5);
  assert.deepEqual(d.snapshot.current, raid.current);
  assert.deepEqual(d.snapshot.queue, raid.queue);
  for (const event of ['answer.wrong', 'answer.duplicate', 'answer.found']) {
    d.dispatch({eventId: `raid:${event}`, event});
  }
  const lines = drain(d);
  assert.ok(lines.every(line => line.id.startsWith('raid.')));
  assert.deepEqual(lines.filter(line => line.speaker === 'guide').map(line => line.text), ['ええっ…！']);
  assert.ok(!lines.some(line => /cat|dog|ant|雪氷|地形|なぞ|二つ|ふたつ/.test(line.text)));
});

test('敗北は乱入声を無効化、飛行開始は叫び一度だけ。HP説明は帰還後', () => {
 for(const hero of ['male','female']){
  const d = new DialogueDirector(script);
  enter(d, 5,{hero});
  const raid = d.snapshot.current;
  d.dispatch({eventId: 'loss', screen: 'game', stage: 5, state: 'loss'});
  const loss = d.snapshot.current;
  assert.equal(loss, null);
  assert.equal(d.onLineEnded(raid), false);
  d.dispatch({eventId:'launch',screen:'game',stage:5,state:'launch'});
  const scream=d.snapshot.current;
  assert.equal(scream.id,'flight.hero.launch');assert.equal(scream.speaker,hero);
  assert.equal(scream.text,'うわああああああ');assert.equal(scream.reading,scream.text);
  assert.equal(scream.voiceKey,`flight.hero.launch.${hero}`);
  for (const state of ['launch', 'fall', 'land']) {
    d.dispatch({eventId: state, screen: 'game', stage: 5, state});
    assert.deepEqual(d.snapshot.current, scream);
    for(const event of ['flight.launch','flight.fall','flight.land','defeat','raid.enter','stage.cat','answer.wrong']){
      d.dispatch({eventId:`late:${state}:${event}`,event});
      assert.deepEqual(d.snapshot.current,scream);assert.deepEqual(d.snapshot.queue,[]);
    }
  }
  end(d);
  for(const state of ['fall','land']){
    d.dispatch({eventId:`after:${state}`,screen:'game',stage:5,state});
    assert.equal(d.snapshot.current,null);assert.deepEqual(d.snapshot.queue,[]);
  }
  d.dispatch({eventId: 'returned', screen: 'home', returned: true});
  assert.equal(d.onLineEnded(scream), false);
  const returned=drain(d);
  assert.equal(returned.length,4);assert.ok(returned.every(l=>l.event==='guild.return'));
  assert.ok(returned.some(l=>l.id==='defeat.guide.hp'&&l.text.includes('ゼロ')));
 }
});

test('pause/resumeは現在の再生IDを保持し、遅延終了はresumeで一回処理', () => {
  const d = new DialogueDirector(script);
  enter(d, 0);
  const first = d.snapshot.current;
  d.pause();
  assert.ok(d.snapshot.paused);
  assert.deepEqual(d.snapshot.current, first);
  d.resume();
  assert.deepEqual(d.snapshot.current, first);
  d.pause();
  assert.ok(d.onLineEnded(first));
  assert.equal(d.onLineEnded(first), false);
  assert.deepEqual(d.snapshot.current, first);
  assert.ok(d.snapshot.endedWhilePaused);
  d.resume();
  const next = d.snapshot.current;
  assert.equal(next.id, 'cat.enemy.dignity');
  d.resume();
  assert.deepEqual(d.snapshot.current, next);
  assert.equal(d.onLineEnded(first), false);
});

test('pause中の新イベントは再生せず、優先切替と復帰後も旧通知を拒否', () => {
  const d = new DialogueDirector(script);
  d.pause();
  enter(d, 0);
  assert.equal(d.snapshot.current, null);
  d.resume();
  const old = d.snapshot.current;
  d.pause();
  enter(d, 5);
  assert.equal(d.snapshot.current, null);
  assert.equal(d.onLineEnded(old), false);
  d.resume();
  assert.equal(d.snapshot.current.id, 'raid.guide.shock');
});

test('終了通知は再生トークン必須、resetで次周回と古い完了が衝突しない', () => {
  const d = new DialogueDirector(script);
  enter(d, 0);
  const old = d.snapshot.current;
  assert.equal(d.onLineEnded(old.id), false);
  assert.equal(d.onLineEnded(undefined), false);
  d.reset();
  enter(d, 0);
  const next = d.snapshot.current;
  assert.equal(next.id, old.id);
  assert.notEqual(next.playbackId, old.playbackId);
  assert.equal(d.onLineEnded(old), false);
  assert.equal(d.onLineEnded(next), true);
});

test('普通のホームへ戻ると旧音声とキューを無効化し、次の選択はresetで開始', () => {
  const d = new DialogueDirector(script);
  d.dispatch({screen: 'select', eventId: 'select'});
  const old = d.snapshot.current;
  d.dispatch({screen: 'home', eventId: 'back'});
  assert.equal(d.snapshot.current, null);
  assert.equal(d.snapshot.queue.length, 0);
  assert.equal(d.onLineEnded(old), false);
  d.reset({hero: 'female'});
  d.dispatch({screen: 'select', eventId: 'select'});
  assert.equal(d.snapshot.current.id, 'select.guide.welcome');
});

test('入力中も会話進行がGame・Trace・HP・時計・保存内容を変更しない', () => {
  const d = new DialogueDirector(script);
  const game = new Game('grass', () => .3), trace = new Trace(game.board);
  trace.start(12, PATHS[0].cat[0]);
  trace.add(12, PATHS[0].cat[1]);
  const beforeGame = JSON.stringify({...game, found: [...game.found]});
  const beforeTrace = JSON.stringify(trace);
  const input = Object.freeze({eventId: 'cat', screen: 'game', stage: 0, state: 'battle', hero: 'male', ally: game.ally, hp: game.hp});
  d.dispatch(input);
  end(d);
  d.pause();
  d.resume();
  assert.equal(JSON.stringify({...game, found: [...game.found]}), beforeGame);
  assert.equal(JSON.stringify(trace), beforeTrace);
  trace.add(12, PATHS[0].cat[2]);
  assert.equal(game.answer(trace.finish(12)), 'defeated');
  game.next();
  assert.equal(game.state, 'travel');
});

test('スナップショット・発話・キュー・contextは深く凍結、呼出元脚本は非破壊', () => {
  const copy = JSON.parse(JSON.stringify(script)), before = JSON.stringify(copy);
  const d = new DialogueDirector(copy);
  copy.events[0].lines[0].text = '外側だけ変更';
  d.dispatch({screen: 'select'});
  const snapshot = d.snapshot;
  assert.equal(snapshot.current.text, script.events[0].lines[0].text);
  for (const value of [snapshot, snapshot.current, snapshot.queue, ...snapshot.queue, snapshot.context, snapshot.seenEventIds]) {
    assert.ok(Object.isFrozen(value));
  }
  assert.throws(() => { snapshot.context.hero = 'female'; }, TypeError);
  assert.throws(() => snapshot.queue.pop(), TypeError);
  assert.throws(() => { snapshot.current.text = 'changed'; }, TypeError);
  assert.equal(before, JSON.stringify(script));
  assert.equal(Object.isFrozen(copy), false);
});

test('通知内の即時終了は再帰せず、空キューまで安全に進める', () => {
  let d, depth = 0, maxDepth = 0, notifications = 0;
  d = new DialogueDirector(script, {onChange(snapshot) {
    depth++; maxDepth = Math.max(maxDepth, depth); notifications++;
    if (snapshot.current) d.onLineEnded(snapshot.current);
    depth--;
  }});
  enter(d, 0);
  assert.equal(d.snapshot.current, null);
  assert.equal(maxDepth, 1);
  assert.equal(notifications, 5);
});

test('JSON取得のHTTP失敗・形式不正を検出、成功した脚本は凍結', async () => {
  const loaded = await loadDialogueScript(async () => ({ok: true, json: async () => script}));
  assert.ok(Object.isFrozen(loaded.events[0].lines[0]));
  await assert.rejects(loadDialogueScript(async () => ({ok: false, status: 503})), /503/);
  await assert.rejects(loadDialogueScript(async () => ({ok: true, json: async () => ({})})), TypeError);
  assert.throws(() => new DialogueDirector(script, {maxQueue: 0}), TypeError);
  const d = new DialogueDirector(script), before = d.snapshot;
  assert.throws(() => d.dispatch({eventId: '', screen: 'select', hero: 'female'}), TypeError);
  assert.deepEqual(d.snapshot, before, '不正な発火IDでは状態を変更しない');
  const broken = JSON.parse(JSON.stringify(script));
  broken.events[0].lines[1].variants.female.reading = '';
  assert.throws(() => new DialogueDirector(broken), TypeError);
});

test('標準fetchのreceiverをglobalへ結び付け、注入した取得関数も利用できる', async () => {
  const original = globalThis.fetch;
  const url = new URL('https://example.invalid/dialogue-script.json');
  let calls = 0;
  try {
    globalThis.fetch = async function (requested) {
      assert.equal(this, globalThis, 'ブラウザー標準fetchの呼出先');
      assert.equal(requested, url);
      calls++;
      return {ok: true, json: async () => script};
    };
    const loaded = await loadDialogueScript(undefined, url);
    assert.ok(Object.isFrozen(loaded));
    assert.equal(calls, 1);
    await loadDialogueScript(async requested => {
      assert.equal(requested, url);
      return {ok: true, json: async () => script};
    }, url);
    assert.equal(calls, 1, '注入関数では標準fetchを使わない');
  } finally {
    globalThis.fetch = original;
  }
});

test('静的代替の旧API互換と会話字幕、SUN横・乱入驚き限定', () => {
  const context = {screen: 'game', stage: 0, state: 'battle', hero: 'female'};
  assert.deepEqual(getDialogueStoryBeat(null, context), getStoryBeat(context));
  for (const state of ['battle', 'intrusion', 'counter', 'arriving']) {
    assert.deepEqual(getStoryBeat({screen: 'game', stage: 5, state}), {speaker: 'しるべ', text: 'ええっ…！', expression: 'action-2'});
  }
  const d = new DialogueDirector(script);
  d.dispatch({screen: 'select', hero: 'female'});
  end(d);
  const beat = getDialogueStoryBeat(d.snapshot, context);
  assert.equal(beat.speaker, 'ミナ');
  assert.equal(beat.text, d.snapshot.current.text);
  assert.ok(Object.isFrozen(beat));
  const sun = script.events.find(event => event.event === 'stage.sun');
  assert.ok(sun.lines[0].text.includes('横'));
  assert.ok(!JSON.stringify(script.events).includes('斜め'));
});

test('早解きから帰還相談へ旧キューを整理、凍結と困惑を一度ずつ再生',()=>{
 const d=new DialogueDirector(script);enter(d,3);
 const old=d.snapshot.current;
 d.dispatch({eventId:'clear-ant',screen:'game',stage:3,state:'defeated'});
 enter(d,4);d.dispatch({eventId:'clear-boss',screen:'game',stage:4,state:'defeated'});
 d.dispatch({eventId:'returning',screen:'game',stage:4,state:'returning'});
 assert.deepEqual(d.snapshot.current,old,'通常の早解きでは現在の発話を継続');
 assert.deepEqual(d.snapshot.queue.map(l=>l.event),['boss.clear','boss.returning']);
 end(d);const approval=d.snapshot.current;
 end(d);assert.equal(d.snapshot.current.id,'returning.guide.guild');
 assert.match(d.snapshot.current.text,/ギルドに帰ろう/);
 d.dispatch({eventId:'freezing',screen:'game',stage:4,state:'freezing'});
 assert.equal(d.onLineEnded(approval),false);
 for(const state of ['freezing','bewildered']){
  d.dispatch({eventId:state,screen:'game',stage:4,state});const before=d.snapshot;
  for(const event of ['answer.found','stage.animal','boss.clear']){
   d.dispatch({eventId:`stale:${state}:${event}`,event});
   assert.deepEqual(d.snapshot.current,before.current);assert.deepEqual(d.snapshot.queue,before.queue);
  }
  d.dispatch({eventId:`redraw:${state}`,screen:'game',stage:4,state});
  assert.deepEqual(d.snapshot.current,before.current);assert.deepEqual(d.snapshot.queue,before.queue);
  const lines=drain(d);assert.ok(lines.every(l=>l.event===`boss.${state}`));
  if(state==='freezing')assert.deepEqual(lines.map(l=>l.id),['freezing.guide.terrain','freezing.hero.ice']);
  else assert.deepEqual(lines.map(l=>l.speaker),['guide','animal']);
  d.dispatch({eventId:`finished:${state}`,screen:'game',stage:4,state});assert.equal(d.snapshot.current,null);
 }
 d.dispatch({eventId:'raid',screen:'game',stage:5,state:'intrusion'});
 assert.equal(d.snapshot.current.id,'raid.guide.shock');
 assert.ok(!d.snapshot.queue.some(l=>l.event.startsWith('boss.')));
});

test('非表示中の演出切替は復帰後に最新会話だけ、飛行の遅延終了と声停止も再発話しない',()=>{
 const d=new DialogueDirector(script);
 d.dispatch({screen:'game',stage:4,state:'returning'});const returning=d.snapshot.current;
 d.pause();d.dispatch({screen:'game',stage:4,state:'freezing'});
 d.dispatch({screen:'game',stage:4,state:'bewildered'});
 assert.equal(d.snapshot.current,null);assert.equal(d.onLineEnded(returning),false);
 d.resume();assert.equal(d.snapshot.current.id,'bewildered.guide.what');
 const puzzled=d.snapshot.current;d.pause();
 d.dispatch({screen:'game',stage:5,state:'launch',hero:'female'});
 assert.equal(d.snapshot.current,null);assert.equal(d.onLineEnded(puzzled),false);
 d.resume();const scream=d.snapshot.current;assert.equal(scream.text,'うわああああああ');
 d.pause();assert.ok(d.onLineEnded(scream));
 d.dispatch({screen:'game',stage:5,state:'fall'});d.dispatch({screen:'game',stage:5,state:'land'});
 d.resume();assert.equal(d.snapshot.current,null);assert.deepEqual(d.snapshot.queue,[]);
 assert.equal(d.onLineEnded(scream),false);
});

test('飛行を直接開いても古い発話を持ち越さず、字幕代替も男女の叫び限定',()=>{
 for(const hero of ['male','female'])for(const state of ['launch','fall','land']){
  const d=new DialogueDirector(script);enter(d,0,{hero});const stale=d.snapshot;
  const context={screen:'game',stage:5,state,hero};d.dispatch(context);
  assert.ok(!d.snapshot.current||d.snapshot.current.id==='flight.hero.launch');
  for(const snap of [null,stale,d.snapshot]){
   const beat=getDialogueStoryBeat(snap,context);assert.equal(beat.text,'うわああああああ');
   assert.equal(beat.speaker,hero==='male'?'リオ':'ミナ');
  }
 }
 for(const state of ['defeated','returning','freezing','bewildered','travel']){
  const beat=getStoryBeat({screen:'game',stage:4,state});
  assert.doesNotMatch(beat.text,/奥|封印/);
 }
 for(const event of script.events.filter(e=>e.event.startsWith('boss.'))){
  for(const l of event.lines)assert.doesNotMatch(l.text||Object.values(l.variants).map(v=>v.text).join(''),/奥へ|封印/);
 }
});
