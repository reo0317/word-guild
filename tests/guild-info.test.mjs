import test from 'node:test';
import assert from 'node:assert/strict';
import {bindInfo, infoDialog} from '../products/word-guild/guild/map.mjs';

test('依頼・霧・明日の説明をクリックとキー操作で開き、×で閉じたら元へ戻す', () => {
  const triggers = new Map(['.gq-daily[role="button"]', '.gq-fog-count', '.gq-tomorrow'].map(key => [key, {focus(options) {this.focused = options;}}]));
  let html = '', open = false, removed = 0, onClose;
  const dialog = {
    remove() {removed++;},
    addEventListener(event, callback) {assert.equal(event, 'close'); onClose = callback;},
    showModal() {open = true;},
  };
  const view = {
    querySelector(selector) {return selector === '.gq-fog-intro' ? dialog : triggers.get(selector);},
    insertAdjacentHTML(position, markup) {assert.equal(position, 'beforeend'); html = markup;},
  };
  bindInfo(view, {kind: 'finish', goal: 2, count: 1});
  for (const [selector, trigger] of triggers) {
    trigger.onclick();
    assert.equal(open, true);
    assert.match(html, /class="gq-fog-intro"/);
    assert.match(html, /method="dialog"/);
    assert.match(html, /aria-label="とじる"/);
    if (selector.includes('daily')) {
      assert.match(html, /毎日ひとつ、おまけの依頼/);
      assert.match(html, /配達を2回やりとげる　1\/2/);
    } else if (selector.includes('fog')) assert.match(html, /楕円はあと何回で霧が晴れるか/);
    else assert.match(html, /明日戻ってくる紙魚と、その数/);
    onClose();
    assert.deepEqual(trigger.focused, {preventScroll: true});
    for (const key of ['Enter', ' ']) {
      open = false;
      let prevented = false;
      trigger.onkeydown({key, preventDefault() {prevented = true;}});
      assert.ok(open && prevented);
    }
  }
  assert.equal(removed, 9);
});

test('説明の見出しと本文をHTMLとして解釈しない', () => {
  assert.match(infoDialog('<依頼>', '<script>'), /&lt;依頼&gt;/);
  assert.doesNotMatch(infoDialog('<依頼>', '<script>'), /<script>/);
});
