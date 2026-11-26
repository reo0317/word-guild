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
const [variantHeader, ...variantRows] = readRows('variants.md');
const variantBackgrounds = new Set(variantRows.map(([id]) => id));
const puppets = new Map(library.filter(([id]) => /^cpuppet-/.test(id)).map(
  ([id, , ...poses]) => [id, poses],
));

test('カラー紙芝居の背景差分は既存の背景を元にする', () => {
  assert.deepEqual(variantHeader, [
    'id', '元の背景', '変えること（英語で、画像編集の指示として具体的に）', '使うカード',
  ]);
  const ids = new Set();
  for (const row of variantRows) {
    assert.equal(row.length, 4);
    const [id, base, instruction, cards] = row;
    assert.ok(backgrounds.has(base), `${id}の未定義の元背景 ${base}`);
    assert.ok(id.startsWith(`${base}--`), `${id}の元背景と接頭辞`);
    assert.match(id.slice(base.length + 2), /^[a-z0-9]+(?:-[a-z0-9]+)*$/);
    assert.ok(!ids.has(id) && !backgrounds.has(id), `背景IDが重複 ${id}`);
    assert.ok(instruction && cards, `${id}の編集指示と使用カード`);
    ids.add(id);
  }
});

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
      assert.ok(
        backgrounds.has(background) || variantBackgrounds.has(background),
        `${label}の未定義背景 ${background}`,
      );
      assert.ok(description, `${label}の絵の説明`);

      if (people !== 'なし') {
        const positions = [];
        for (const person of people.split('<br>')) {
          const match = /^(cpuppet-[a-z0-9-]+)-([1-6])、(?:右|左|奥)向き、x=(0\.\d{2}|1\.00)$/.exec(person);
          assert.ok(match, `${label}の人物指定 ${person}`);
          const [, id, pose, x] = match;
          const poses = puppets.get(id);
          assert.equal(poses?.length, 6, `${label}の人物シート ${id}`);
          assert.match(poses[Number(pose) - 1], /^(?:右|左|奥)／.+$/);
          // Compare hundredths so exactly 0.16 is accepted without rounding error.
          const position = Number(x.replace('.', ''));
          assert.ok(position >= 8 && position <= 92, `${label}の人物位置 ${x} は0.08〜0.92`);
          positions.push(position);
        }
        positions.sort((a, b) => a - b);
        for (let i = 1; i < positions.length; i++) {
          assert.ok(positions[i] - positions[i - 1] >= 16, `${label}の人物間隔は0.16以上`);
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
