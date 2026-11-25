import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const directory = new URL('../data/work/kamishibai/color/', import.meta.url);
const { scenes } = JSON.parse(readFileSync(
  new URL('../products/word-guild/data/scenes.json', import.meta.url), 'utf8',
));

function readRows(filename) {
  return readFileSync(new URL(filename, directory), 'utf8')
    .split('\n')
    .filter(line => line.startsWith('| ') && line.endsWith(' |'))
    .map(line => line.slice(2, -2).split(' | '));
}

const library = readRows('library.md');
const backgrounds = new Set(library.filter(([id]) => /^cbg-/.test(id)).map(([id]) => id));
const puppets = new Map(library.filter(([id]) => /^cpuppet-/.test(id)).map(
  ([id, , ...poses]) => [id, poses],
));

for (const { shelf, title, lines } of scenes) {
  const nn = String(shelf).padStart(2, '0');

  test(`カラー紙芝居 ${nn} ${title}`, () => {
    const board = readRows(`scene-${nn}.md`);
    assert.deepEqual(board.shift(), [
      '#', '文', '背景', '人物（シート-ポーズ番号、向き、位置）', '記号', '絵の説明',
    ]);
    assert.deepEqual(board.map(row => row[1]), lines, '文の件数、順序、原文が一致する');

    const sheet = readRows(`cicons-${nn}.md`);
    assert.deepEqual(sheet.shift(), ['#', 'id', '外形・尾', '中に描く絵']);
    assert.equal(sheet.length, 12, '記号シートは空きマスを含めて12マス');
    const usedIcons = new Set();

    for (const [index, cells] of board.entries()) {
      const label = `場面${nn}の${index + 1}行目`;
      assert.equal(cells.length, 6, label);
      const [number, , background, people, icon, description] = cells;
      assert.equal(number, String(index + 1), label);
      assert.ok(backgrounds.has(background), `${label}の未定義背景 ${background}`);
      assert.ok(description, `${label}の絵の説明`);

      if (people !== 'なし') {
        for (const person of people.split('<br>')) {
          const match = /^(cpuppet-[a-z0-9-]+)-([1-6])、(?:右|左|奥)向き、x=(?:0\.\d{2}|1\.00)$/.exec(person);
          assert.ok(match, `${label}の人物指定 ${person}`);
          const [, id, pose] = match;
          const poses = puppets.get(id);
          assert.equal(poses?.length, 6, `${label}の人物シート ${id}`);
          assert.match(poses[Number(pose) - 1], /^(?:右|左|奥)／.+$/);
        }
      }

      const match = /^cicons-(\d{2})-([1-9]|1[0-2])（(.+)、(?:上段|中段(?:の空き)?)）$/.exec(icon);
      assert.ok(match, `${label}の記号指定 ${icon}`);
      const [, scene, slot, shape] = match;
      assert.equal(scene, nn, `${label}の記号は同じ場面のシートに入る`);
      const id = `cicons-${nn}-${slot}`;
      assert.ok(!usedIcons.has(id), `${label}の記号が重複 ${id}`);
      usedIcons.add(id);
      const cell = sheet[Number(slot) - 1];
      assert.deepEqual(cell.slice(0, 3), [slot, id, shape], `${label}の記号セル`);
      assert.ok(cell[3] && cell[3] !== '—', `${id}の作画指示`);
    }

    for (const [index, cell] of sheet.entries()) {
      assert.equal(cell.length, 4);
      assert.equal(cell[0], String(index + 1));
      if (!usedIcons.has(cell[1])) {
        assert.deepEqual(cell.slice(1), ['—', '空き', '—'], '未使用マスは緑地');
      }
    }
  });
}
