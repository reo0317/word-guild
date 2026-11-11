import test from 'node:test';
import assert from 'node:assert/strict';
import {generateBoard, matchWord, spelling, CELLS} from '../products/word-guild/guild/board.mjs';
import {mulberry32} from '../products/word-guild/guild/rng.mjs';
import {Trace, adjacent} from '../products/word-guild/guild/trace.mjs';

function checkBoard(words, board) {
  assert.equal(board.letters.length, CELLS);
  assert.ok(board.letters.every(letter => /^[A-Z]$/.test(letter)));
  const used = new Set();
  for (const word of words) {
    const path = board.paths[word];
    assert.equal(path.length, word.length, `${word} の経路の長さ`);
    path.forEach((cell, i) => {
      assert.ok(cell >= 0 && cell < CELLS, '盤面内');
      assert.equal(board.letters[cell], word[i].toUpperCase(), `${word}[${i}] の文字`);
      assert.ok(!used.has(cell), '語どうしでマスが重ならない');
      used.add(cell);
      if (i > 0) assert.ok(adjacent(path[i - 1], cell), '上下左右の隣接');
    });
    assert.equal(new Set(path).size, path.length, '同じ語の中でも重複なし');
  }
}

test('種1〜500で、3語の経路が盤面内・隣接・重複なし・文字一致', () => {
  const words = ['apple', 'dog', 'window'];
  for (let seed = 1; seed <= 500; seed++) {
    checkBoard(words, generateBoard(words, mulberry32(seed)));
  }
});

test('合計24文字の3語（8+8+8）と、17文字の1語が置ける', () => {
  const three = ['abcdefgh', 'ijklmnop', 'qrstuvwx'];
  const one = ['internationalization'.slice(0, 17)];
  for (let seed = 1; seed <= 200; seed++) {
    checkBoard(three, generateBoard(three, mulberry32(seed)));
    checkBoard(one, generateBoard(one, mulberry32(seed)));
  }
});

test('同じ語でも、種が違えば盤面の配置が変わる', () => {
  const words = ['apple', 'dog', 'window'];
  const layouts = new Set();
  for (let seed = 1; seed <= 20; seed++) {
    layouts.add(JSON.stringify(generateBoard(words, mulberry32(seed)).letters));
  }
  assert.ok(layouts.size >= 15);
});

test('同じ種なら同じ盤面になる', () => {
  const words = ['cat', 'tree'];
  assert.deepEqual(generateBoard(words, mulberry32(7)), generateBoard(words, mulberry32(7)));
});

test('42文字を超える語は置けず、例外を投げる', () => {
  assert.throws(() => generateBoard(['a'.repeat(43)], mulberry32(1)));
});

test('matchWord は未回答の語とだけ一致し、別経路の同じ綴りも正解にする', () => {
  const words = ['book', 'tree', 'door'];
  const board = generateBoard(words, mulberry32(3));
  assert.equal(matchWord('BOOK', words), 'book');
  assert.equal(matchWord('TREE', ['book', 'door']), null, '解決済みの語は返さない');
  assert.equal(matchWord('', words), null);
  assert.equal(matchWord('BOO', words), null);
  // 経路が生成時と違っても、綴りが合えば一致する
  const trace = new Trace(['B', 'O', 'O', 'K']);
  trace.start(1, 0);
  for (const i of [1, 2, 3]) trace.add(1, i);
  assert.equal(matchWord(trace.finish(1), words), 'book');
  assert.ok(board.paths.book);
});

test('Trace は生成した盤面の経路をなぞると語の綴りを返し、一歩戻しで取り消せる', () => {
  const words = ['river', 'milk'];
  const board = generateBoard(words, mulberry32(11));
  const trace = new Trace(board.letters);
  const path = board.paths.river;
  trace.start(1, path[0]);
  path.slice(1).forEach(cell => trace.add(1, cell));
  assert.equal(trace.text, 'RIVER');
  trace.add(1, path.at(-2));
  assert.equal(trace.text, 'RIVE');
  assert.equal(matchWord(trace.finish(1), words), null);
});

test('spelling は英字だけの小文字にする', () => {
  assert.equal(spelling('Ice-Cream'), 'icecream');
  assert.equal(spelling('a lot'), 'alot');
  assert.equal(spelling('résumé'), 'resume');
  assert.equal(spelling('café'), 'cafe');
});
