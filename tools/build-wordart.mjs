// 書き出し済みの意味の絵だけを配信用の語 id 表にする。
import {readdir, readFile, writeFile, access} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';

export async function buildWordart(root = new URL('../', import.meta.url)) {
  const source = new URL('data/work/wordart/', root);
  const result = {};
  for (const name of (await readdir(source)).filter(n => /^groups-ch\d+\.json$/.test(n)).sort()) {
    const {groups} = JSON.parse(await readFile(new URL(name, source), 'utf8'));
    for (const {g, words} of groups) {
      if (!/^c[1-9]\d*-\d+$/.test(g)) throw new Error(`Invalid group: ${g}`);
      try { await access(new URL(`products/word-guild/art/word/${g}.webp`, root)); }
      catch (error) { if (error.code === 'ENOENT') continue; throw error; }
      for (const {id, tint} of words) {
        if (!Number.isInteger(tint) || tint < 0 || tint > 3) throw new Error(`Invalid tint: ${id}`);
        if (Object.hasOwn(result, id)) throw new Error(`Duplicate word: ${id}`);
        result[id] = {g, tint};
      }
    }
  }
  await writeFile(new URL('products/word-guild/data/wordart.json', root), JSON.stringify(result, null, 2) + '\n');
  return result;
}
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const result = await buildWordart();
  console.log(`wordart.json: ${Object.keys(result).length} 語`);
}
