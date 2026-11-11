import test from 'node:test';
import assert from 'node:assert/strict';
import {Trace, adjacent} from '../products/word-guild/guild/trace.mjs';

// 旧 tests/word-guild.test.mjs の Trace の検査。盤面は全部 A に CAT を 8,9,10 へ置いたもの。
function catBoard() {
  const board = Array(42).fill('A');
  board[8] = 'C'; board[9] = 'A'; board[10] = 'T';
  return board;
}

test('CATWからTへ戻るとCAT、さらに戻して短縮、滞留無効', () => {
  const board = catBoard();
  board[11] = 'W';
  const t = new Trace(board);
  t.start(1, 8);
  for (const i of [9, 10, 11]) t.add(1, i);
  assert.equal(t.text, 'CATW');
  t.add(1, 10);
  assert.equal(t.text, 'CAT');
  assert.equal(t.add(1, 10), false);
  t.add(1, 9);
  assert.equal(t.text, 'CA');
  t.add(1, 10);
  assert.equal(t.finish(1), 'CAT');
});

test('直前以外の再訪は追加、別指・非隣接・斜め・キャンセル', () => {
  const t = new Trace(catBoard());
  t.start(1, 8);
  assert.equal(t.start(2, 9), false);
  assert.equal(t.add(2, 9), false);
  assert.equal(t.add(1, 16), false);
  assert.equal(t.add(1, 41), false);
  for (const i of [9, 16, 15, 8]) assert.equal(t.add(1, i), true);
  assert.deepEqual(t.path, [8, 9, 16, 15, 8]);
  assert.equal(t.finish(2), null);
  t.cancel();
  assert.equal(t.finish(1), null);
  assert.equal(adjacent(6, 7), false);
});
