import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { test } from 'node:test';

const boards = new URL('../data/work/kamishibai/', import.meta.url);
const story = new URL('../products/word-guild/data/story.json', import.meta.url);
const { letters } = JSON.parse(readFileSync(story, 'utf8'));
const files = readdirSync(boards).filter(name => /^letter-\d{2}\.md$/.test(name)).sort();

function targets(text) {
  return Array.from(text.matchAll(/\{([^{}]+)\}/g), ([, word]) => word.toLowerCase());
}

test('影絵の絵コンテが全通そろっている', () => {
  assert.deepEqual(files, letters.map(({ shelf }) => `letter-${String(shelf).padStart(2, '0')}.md`));
});

for (const file of files) {
  test(`${file} のカードが原文と対象語を保つ`, () => {
    const shelf = Number(file.match(/\d+/)[0]);
    const letter = letters.find(entry => entry.shelf === shelf);
    assert.ok(letter, `手紙${shelf}の原文がない`);
    const original = letter.lines.map(line => line.en).join(' ');
    const markdown = readFileSync(new URL(file, boards), 'utf8');
    const cards = Array.from(markdown.matchAll(/^\|\s*(\d+)\s*\| ([^|]+?) \|/gm));

    assert.deepEqual(cards.map(([, index]) => Number(index)), cards.map((_, index) => index + 1));
    assert.equal(cards.map(([, , text]) => text).join(' '), original);

    const occurrences = cards.flatMap(([, index, text]) => targets(text).map(word => [word, index]));
    for (const word of new Set(targets(original))) {
      const containingCards = new Set(occurrences.filter(([target]) => target === word).map(([, index]) => index));
      assert.equal(containingCards.size, 1, `{${word}} が入るカードは1枚`);
    }
  });
}
