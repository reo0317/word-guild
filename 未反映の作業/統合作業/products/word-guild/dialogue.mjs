/**
 * DOM・Game・保存・時計・AudioContextから独立した会話進行。
 *
 * const script = await loadDialogueScript(); // 取得中もゲームは操作可能にする
 * const director = new DialogueDirector(script, {onChange: snapshot => {
 *   // current.playbackIdが変わった時だけ字幕更新・voice.play(current.voiceKey)。
 *   // 盤面のinnerHTMLを書き換えない。snapshot.paused時はvoice.pause()。
 * }});
 * director.dispatch({eventId:'run1:select',screen:'select',hero:'male',ally:'water'});
 * director.dispatch({eventId:'run1:cat',screen:'game',stage:0,state:'battle'});
 * // VoicePlayer開始時に保存したトークン。古い非同期終了通知は無視される。
 * director.onLineEnded(line.playbackId);
 * // 同じ周回の再描画にはdispatchしない。次周回にはreset()する。
 */
const STAGES = Object.freeze(['cat', 'dog', 'sun', 'ant', 'animal', 'final']);
const EXPRESSIONS = new Set(['idle', 'blink', 'joy', 'worried', 'action-1', 'action-2']);
const HEROES = new Set(['male', 'female']);
const ALLIES = new Set(['fire', 'water', 'grass']);
const RESCUE_EVENTS = Object.freeze({escape:'rescue.start',rescue:'rescue.heal',sendoff:'rescue.recovered'});
const ARRIVAL_STATES = new Set(['bossArrival','bossLand']);
const STORY_STATES = new Set(['loss','defeat','escape','rescue','sendoff','launch','fall','land','bossArrival','bossLand','recruited']);

function freezeTree(value) {
  if (value && typeof value === 'object') {
    for (const child of Object.values(value)) freezeTree(child);
    Object.freeze(value);
  }
  return value;
}

function validateScript(script) {
  if (script?.version !== 1 || !Array.isArray(script.events) || !script.speakers) {
    throw new TypeError('会話脚本version=1・events・speakersが必要です');
  }
  const ids = new Set(), events = new Set();
  for (const event of script.events) {
    if (typeof event.event !== 'string' || events.has(event.event)
      || !Number.isFinite(event.priority) || !Array.isArray(event.lines)) {
      throw new TypeError('会話イベントの形式またはIDが不正です');
    }
    events.add(event.event);
    for (const line of event.lines) {
      if (typeof line.id !== 'string' || !line.id || ids.has(line.id)
        || !EXPRESSIONS.has(line.expression) || typeof line.carry !== 'boolean'
        || !Number.isFinite(line.targetSeconds) || line.targetSeconds <= 0) {
        throw new TypeError('発話ID・表情・尺・持ち越し設定が不正です');
      }
      ids.add(line.id);
      const voices = line.speaker === 'hero' ? ['male', 'female'] : [line.speaker];
      for (const speaker of voices) {
        const text = line.speaker === 'hero' ? line.variants?.[speaker] : line;
        if (typeof script.speakers[speaker]?.name !== 'string'
          || typeof text?.text !== 'string' || !text.text
          || typeof text.reading !== 'string' || !text.reading) {
          throw new TypeError(`発話${line.id}の話者・台詞・読みが不正です`);
        }
      }
    }
  }
  // 呼出元のオブジェクトは凍結・変更しない。所有するコピーだけを凍結する。
  return freezeTree(JSON.parse(JSON.stringify(script)));
}

export async function loadDialogueScript(fetcher = globalThis.fetch,
  url = new URL('./dialogue-script.json', import.meta.url)) {
  // 標準fetchはWindowをreceiverにする。注入した取得関数はそのまま使う。
  const request = fetcher === globalThis.fetch ? fetcher.bind(globalThis) : fetcher;
  const response = await request(url);
  if (!response.ok) throw new Error(`会話脚本を取得できません (${response.status})`);
  return validateScript(await response.json());
}

export function dialogueEventFor({screen, stage, state, returned = false, bossRecruited = false} = {}) {
  if ((screen === 'home' || screen === 'top') && returned) return 'guild.return';
  if ((screen === 'home' || screen === 'top') && bossRecruited) return 'companion.home';
  if (screen === 'select') return 'select.enter';
  if (screen !== 'game') return null;
  if (state === 'loss' || state === 'defeat') return 'defeat';
  if (RESCUE_EVENTS[state]) return RESCUE_EVENTS[state];
  if (ARRIVAL_STATES.has(state)) return 'guild.boss.arrive';
  if (state === 'recruited') return 'guild.boss.join';
  if (state === 'launch') return 'flight.launch';
  if (state === 'fall' || state === 'land') return null;
  if (!Number.isInteger(stage) || stage < 0 || stage >= STAGES.length) return null;
  if (stage === 5 && ['battle', 'intrusion', 'arriving', 'counter'].includes(state)) return 'raid.enter';
  if (stage === 4 && ['returning', 'freezing', 'bewildered'].includes(state)) return `boss.${state}`;
  if (state === 'defeated') return stage === 4 ? 'boss.clear' : 'stage.clear';
  if (state === 'battle') return `stage.${STAGES[stage]}`;
  return null;
}

function scopeOf(context) {
  if (context.screen !== 'game') return context.screen;
  if (['launch', 'fall', 'land'].includes(context.state)) return 'flight';
  if (['loss', 'defeat'].includes(context.state)) return 'loss';
  if (RESCUE_EVENTS[context.state]) return context.state;
  if (ARRIVAL_STATES.has(context.state)) return 'bossArrival';
  if (context.state === 'recruited') return 'recruited';
  if (['returning', 'freezing', 'bewildered'].includes(context.state)) return `stage:${context.stage}:${context.state}`;
  return `stage:${context.stage}`;
}

/**
 * dispatch({...context,eventId,event?}) / dispatch(eventId, context)
 * snapshotは深く凍結したコピー。currentとqueueには再生前に解決した話者IDを出す。
 * onLineEndedはplaybackId又はcurrentオブジェクトを受け取る。台詞idだけでは進めない。
 * pause中の終了通知は保留し、resumeで次へ進む。resetで古い通知を無効化する。
 */
export class DialogueDirector {
  #script;
  #events;
  #context = {screen: 'home', stage: null, state: 'home', hero: 'male', ally: 'fire', returned: false, bossRecruited:false, guideAvailable:true};
  #seen = new Set();
  #semanticSeen = new Set();
  #queue = [];
  #active = null;
  #current = null;
  #paused = false;
  #endedWhilePaused = false;
  #sequence = 0;
  #revision = 0;
  #onChange;
  #maxQueue;
  #notifying = false;
  #notifyAgain = false;

  constructor(script, {onChange = () => {}, maxQueue = 8} = {}) {
    this.#script = validateScript(script);
    this.#events = new Map(this.#script.events.map(event => [event.event, event]));
    if (typeof onChange !== 'function' || !Number.isInteger(maxQueue) || maxQueue < 1) {
      throw new TypeError('onChange関数と正の整数maxQueueが必要です');
    }
    this.#onChange = onChange;
    this.#maxQueue = maxQueue;
  }

  #updateContext(input) {
    const next = {...this.#context};
    for (const key of ['screen', 'state']) {
      if (typeof input[key] === 'string') next[key] = input[key];
    }
    if (input.stage === null || (Number.isInteger(input.stage) && input.stage >= 0 && input.stage < 6)) {
      next.stage = input.stage;
    }
    if (HEROES.has(input.hero)) next.hero = input.hero;
    if (ALLIES.has(input.ally)) next.ally = input.ally;
    // 画面更新で帰還フラグを切り替える。画面を伴わない遅延イベントは
    // 現在の帰還会話のcontextを変えない。
    if (typeof input.screen === 'string' || typeof input.returned === 'boolean') {
      next.returned = input.returned === true;
    }
    for (const key of ['bossRecruited','guideAvailable']) {
      if (typeof input[key] === 'boolean') next[key] = input[key];
    }
    if ((next.screen === 'game' && next.state === 'recruited') || next.returned) next.bossRecruited = true;
    if (next.bossRecruited || (next.screen === 'game' && ['launch','fall','land','bossArrival','bossLand'].includes(next.state))) next.guideAvailable = false;
    this.#context = next;
  }

  #resolve(entry, playbackId = null) {
    const line = entry.line, speaker = line.speaker === 'hero' ? this.#context.hero : line.speaker;
    const variant = line.speaker === 'hero' ? line.variants[speaker] : line;
    return freezeTree({
      id: line.id, speaker, speakerName: this.#script.speakers[speaker].name,
      text: variant.text, reading: variant.reading, expression: line.expression,
      voiceKey: variant.voiceKey || line.voiceKey || (line.speaker === 'hero' ? `${line.id}.${speaker}` : line.id),
      targetSeconds: line.targetSeconds, direction: line.direction || '',
      eventId: entry.eventId, event: entry.event, priority: entry.priority,
      carry: line.carry, playbackId
    });
  }

  #startNext() {
    if (this.#paused || this.#current || !this.#queue.length) return;
    this.#active = this.#queue.shift();
    this.#current = this.#resolve(this.#active, `dialogue:${++this.#sequence}`);
    this.#endedWhilePaused = false;
  }

  #clearActive() {
    this.#active = null;
    this.#current = null;
    this.#endedWhilePaused = false;
  }

  #notify() {
    this.#revision++;
    // 通知中に利用側がonLineEndedを呼んでも再帰せず、最新状態を通知する。
    if (this.#notifying) { this.#notifyAgain = true; return; }
    this.#notifying = true;
    try {
      do {
        this.#notifyAgain = false;
        this.#onChange(this.snapshot);
      } while (this.#notifyAgain);
    } finally { this.#notifying = false; }
  }

  dispatch(eventOrInput, context = {}) {
    const input = typeof eventOrInput === 'string' ? {...context, eventId: eventOrInput} : eventOrInput;
    if (!input || typeof input !== 'object') throw new TypeError('会話イベントの入力が必要です');
    if (input.eventId !== undefined && (typeof input.eventId !== 'string' || !input.eventId)) {
      throw new TypeError('eventIdは空でない文字列です');
    }
    const oldScope = scopeOf(this.#context);
    this.#updateContext(input);
    const scope = scopeOf(this.#context);
    let eventName = input.event || dialogueEventFor(this.#context);
    // 加入後の再開はanimal自身の収録行。guideの声と字幕を代用しない。
    if (this.#context.bossRecruited) {
      const companion = eventName === 'select.enter' ? 'companion.select' : `companion.${eventName}`;
      if (this.#events.has(companion)) eventName = companion;
    }
    // 帰還後のホームに届く旧戦闘・救出通知は、割込みやキュー整理より先に
    // 拒否する。guide以外の乱入ボスや主人公の声も復活させない。
    if (this.#context.bossRecruited && ['home', 'top'].includes(this.#context.screen)
      && eventName && eventName !== 'context' && eventName !== dialogueEventFor(this.#context)) {
      this.#notify();
      return this.snapshot;
    }
    const event = this.#events.get(eventName);
    const eventId = input.eventId ?? `${scope}/${eventName || 'context'}`;
    if (typeof eventId !== 'string' || !eventId) throw new TypeError('eventIdは空でない文字列です');
    // scopeが変わったら未再生の操作説明だけを捨てる。現在の発話は継続。
    if (oldScope !== scope) this.#queue = this.#queue.filter(entry => entry.line.carry);
    if (!this.#context.guideAvailable) {
      this.#queue = this.#queue.filter(entry => entry.line.speaker !== 'guide');
      if (this.#current?.speaker === 'guide') this.#clearActive();
    }
    // 帰還相談には番人の承認だけを残し、早解きで積まれた勝利・操作説明を整理。
    if (this.#context.state === 'returning') {
      this.#queue = this.#queue.filter(entry => ['boss.clear', 'boss.returning', 'companion.boss.returning'].includes(entry.event));
    }
    const flying = this.#context.screen === 'game' && ['launch', 'fall', 'land'].includes(this.#context.state);
    if (flying) {
      this.#queue = this.#queue.filter(entry => entry.event === 'flight.launch');
      if (this.#active?.event !== 'flight.launch') this.#clearActive();
    }
    // 普通のホームへ戻る操作では古い会話・音声を残さない。
    if (['home', 'top'].includes(this.#context.screen) && !this.#context.returned && !['guild.return','companion.home'].includes(eventName)) {
      this.#queue = [];
      this.#clearActive();
    }
    const duplicate = this.#seen.has(eventId);
    // 同じ階層のbattle/intrusion/arriving等は、別IDでも導入を二重に開始しない。
    const semanticKey = `${scope}/${eventName}`;
    const intro = eventName?.startsWith('stage.') || eventName?.startsWith('companion.stage.') || ['raid.enter', 'select.enter', 'companion.select', 'companion.home', 'companion.boss.returning', 'boss.clear', 'boss.returning', 'boss.freezing', 'boss.bewildered', 'flight.launch', 'defeat', 'guild.return', 'rescue.start', 'rescue.heal', 'rescue.recovered', 'guild.boss.arrive', 'guild.boss.join'].includes(eventName);
    const repeatedIntro = intro && this.#semanticSeen.has(semanticKey);
    // 遅延した別場面の導入も、凍結・乱入・飛行に説明を復活させない。
    const sceneOnly = this.#context.screen === 'game' && (STORY_STATES.has(this.#context.state) || this.#context.stage === 5
      || ['returning', 'freezing', 'bewildered'].includes(this.#context.state));
    let sceneEvent = dialogueEventFor(this.#context);
    if (this.#context.bossRecruited) {
      const companion = sceneEvent === 'select.enter' ? 'companion.select' : `companion.${sceneEvent}`;
      if (this.#events.has(companion)) sceneEvent = companion;
    }
    const allowed = !sceneOnly || eventName === sceneEvent;
    if (!duplicate && !repeatedIntro && event && allowed) {
      this.#seen.add(eventId);
      if (intro) this.#semanticSeen.add(semanticKey);
      // 撃破後・移動中の遅延通知や乱入へ、古い回答説明を持ち込まない。
      const feedback = eventName.startsWith('answer.') || eventName.startsWith('companion.answer.');
      const protectedScene = this.#context.stage === 5
        || (this.#context.screen === 'game' && this.#context.state !== 'battle')
        || ['loss', 'defeat', 'launch', 'fall', 'land'].includes(this.#context.state);
      if (!feedback || !protectedScene) {
        if (event.interrupt) { this.#queue = []; this.#clearActive(); }
        if (eventName === 'stage.clear' || eventName === 'boss.clear') {
          this.#queue = this.#queue.filter(entry => entry.line.carry);
        }
        // 誤答連打などの同種の未再生通知は一つだけ。現在の声は変えない。
        const alreadyQueued = feedback && (this.#active?.event === eventName || this.#queue.some(entry => entry.event === eventName));
        if (!alreadyQueued) {
          this.#queue.push(...event.lines.filter(line => this.#context.guideAvailable || line.speaker !== 'guide').map(line => ({line, event: eventName, eventId, priority: event.priority})));
          // 高速攻略時は新しい場面の行を優先。現在発話中の行には触れない。
          if (this.#queue.length > this.#maxQueue) this.#queue.splice(0, this.#queue.length - this.#maxQueue);
        }
      }
    }
    this.#startNext();
    this.#notify();
    return this.snapshot;
  }

  onLineEnded(lineOrPlaybackId) {
    const playbackId = typeof lineOrPlaybackId === 'object' ? lineOrPlaybackId?.playbackId : lineOrPlaybackId;
    if (!this.#current || playbackId !== this.#current.playbackId) return false;
    if (this.#endedWhilePaused) return false;
    if (this.#paused) this.#endedWhilePaused = true;
    else { this.#clearActive(); this.#startNext(); }
    this.#notify();
    return true;
  }

  pause() {
    if (this.#paused) return this.snapshot;
    this.#paused = true;
    this.#notify();
    return this.snapshot;
  }

  resume() {
    if (!this.#paused) return this.snapshot;
    this.#paused = false;
    if (this.#endedWhilePaused) this.#clearActive();
    this.#startNext();
    this.#notify();
    return this.snapshot;
  }

  reset(context = {}) {
    this.#queue = [];
    this.#clearActive();
    this.#seen.clear();
    this.#semanticSeen.clear();
    this.#paused = false;
    this.#context = {screen: 'home', stage: null, state: 'home', hero: 'male', ally: 'fire', returned: false, bossRecruited:false, guideAvailable:true};
    this.#updateContext(context);
    // sequenceは戻さない。前周回の非同期通知と再生IDが衝突しない。
    this.#notify();
    return this.snapshot;
  }

  get snapshot() {
    return freezeTree({
      current: this.#current, queue: this.#queue.map(entry => this.#resolve(entry)),
      paused: this.#paused, endedWhilePaused: this.#endedWhilePaused,
      context: {...this.#context}, seenEventIds: [...this.#seen],
      narrator: this.#context.bossRecruited ? 'animal' : this.#context.guideAvailable ? 'guide' : null,
      revision: this.#revision
    });
  }
}
