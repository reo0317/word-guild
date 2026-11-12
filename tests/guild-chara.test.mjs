import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile, access} from 'node:fs/promises';
import {charaSpec, pageSpecs, stampState, bodyFile, CATEGORIES, PLAIN_SPECIES, PROPS, PATTERNS} from '../products/word-guild/guild/chara.mjs';
import {charaSvg, charaDefs, stampHtml} from '../products/word-guild/guild/chara-svg.mjs';

const words = JSON.parse(await readFile(new URL('../products/word-guild/data/words.json', import.meta.url), 'utf8'));
// S3 は分類を リポジトリ直下の data/ に置いた。配信側の data/ にあればそちらを使う。
const charaUrl = new URL('../products/word-guild/data/chara.json', import.meta.url);
const tags = JSON.parse(await readFile(charaUrl, 'utf8'));
const tagOf = word => tags[word.id] ?? '';

test('chara.json は1,400語すべてを持ち、値は16種か空（空は8語）', () => {
  assert.equal(Object.keys(tags).length, 1400);
  for (const word of words) {
    assert.ok(word.id in tags, `${word.id} の分類がない`);
    assert.ok(tags[word.id] === '' || CATEGORIES.includes(tags[word.id]), `${word.id}: ${tags[word.id]}`);
  }
  assert.equal(Object.values(tags).filter(tag => tag === '').length, 8);
  assert.equal(CATEGORIES.length, 16);
});

test('各分類は20語以上で、全体の40%を超える分類はない', () => {
  const count = {};
  for (const word of words) {
    const tag = tagOf(word);
    if (tag) count[tag] = (count[tag] || 0) + 1;
  }
  for (const category of CATEGORIES) assert.ok(count[category] >= 20, `${category}: ${count[category]}`);
  assert.ok(Math.max(...Object.values(count)) <= words.length * 0.4);
});

test('設計値は語ごとに決まっていて、値の範囲が正しい', () => {
  for (const word of words) {
    const a = charaSpec(word, tagOf(word));
    assert.deepEqual(a, charaSpec(word, tagOf(word)));
    assert.deepEqual(Object.keys(a).sort(), ['flip', 'ink', 'kind', 'pattern', 'prop', 'scale', 'species', 'tilt']);
    assert.ok(PROPS.includes(a.prop));
    assert.ok([0, 1, 2].includes(a.ink));
    assert.ok(a.pattern >= 0 && a.pattern < PATTERNS.length);
    assert.equal(typeof a.flip, 'boolean');
  }
});

test('種族：分類があれば分類、空なら既存5種、13文字以上は oshimi（綴りは英字のみ）', () => {
  for (const word of words) {
    const tag = tagOf(word);
    const spec = charaSpec(word, tag);
    const letters = word.w.replace(/[^a-zA-Z]/g, '').length;
    if (letters >= 13) {
      assert.equal(spec.species, 'oshimi', word.id);
      assert.equal(spec.kind, 'big');
    } else if (tag) {
      assert.equal(spec.species, tag, word.id);
      assert.equal(spec.kind, 'normal');
      assert.notEqual(spec.prop, charaSpec({...word, id: word.id}, tag).species === tag ? undefined : '', word.id);
    } else {
      assert.ok(PLAIN_SPECIES.includes(spec.species), word.id);
    }
  }
  assert.ok(words.some(word => word.w.replace(/[^a-zA-Z]/g, '').length >= 13), '大物の語がある');
});

test('持ち物は分類の小物と重ならない', () => {
  const own = {money: 'coin', work: 'bag', person: 'hat', time: 'watch', place: 'flag', move: 'ticket', food: 'spoon', doc: 'envelope',
    goods: 'tag', tool: 'gear', nature: 'leaf', body: 'bandage', mind: 'bubble', number: 'ruler', action: 'arrow', state: 'star'};
  for (const word of words) {
    const tag = tagOf(word);
    if (tag) assert.notEqual(charaSpec(word, tag).prop, own[tag], word.id);
  }
});

test('ページ（25語）の中で、種族・持ち物・インク・模様の組が重ならず、1,400語に odd と rare がない', () => {
  let pages = 0;
  for (let start = 0; start + 25 <= words.length; start += 25) {
    const page = words.slice(start, start + 25);
    const specs = pageSpecs(page, page.map(tagOf));
    assert.deepEqual(specs, pageSpecs(page, page.map(tagOf)));
    const keys = specs.map(spec => [spec.species, spec.prop, spec.ink, spec.pattern].join('/'));
    assert.equal(new Set(keys).size, 25, `ページ ${start / 25 + 1}`);
    assert.ok(specs.every(spec => ['normal', 'big'].includes(spec.kind)));
    pages += 1;
  }
  assert.equal(pages, 56);
});

test('stampState：出会う前は影、1〜2は仮刷り、3〜4は本刷り、5は金ぶち', () => {
  assert.equal(stampState(undefined), 'shadow');
  assert.equal(stampState({box: 0, due: 0, seen: 0}), 'shadow');
  assert.deepEqual([1, 2, 3, 4, 5].map(box => stampState({box, due: 1, seen: 1})), ['proof', 'proof', 'print', 'print', 'gold']);
});

test('体の絵のファイルが art/ にある（16分類と既存5種と大物）', async () => {
  for (const name of [...CATEGORIES, ...PLAIN_SPECIES, 'oshimi']) {
    await access(new URL(`../products/word-guild/${bodyFile(name)}`, import.meta.url));
  }
});

test('SVG：共有定義は1回、紙魚は状態ごとに作れて、目を重ねない', () => {
  const defs = charaDefs();
  assert.equal(defs, charaDefs());
  assert.ok(defs.includes('id="cg-t-1-0"') && defs.includes('id="cg-m-state"'));
  const word = words[2];
  const spec = {...charaSpec(word, tagOf(word)), kind: 'normal'};
  for (const state of ['shadow', 'proof', 'print', 'gold']) {
    const svg = charaSvg(spec, {state, ward: word.ch});
    assert.ok(svg.startsWith('<svg') && svg.endsWith('</svg>'));
    assert.ok(!svg.includes('<defs'), '定義は共有側だけ');
    assert.ok(!svg.includes('<circle') || state !== 'shadow');
  }
  assert.ok(!charaSvg(spec, {state: 'print'}).includes('stroke-width="5"/><circle'), '目の円を描かない');
  assert.ok(charaSvg({...spec, kind: 'rare'}, {state: 'print'}).includes('cg-t-rare'));
  assert.ok(stampHtml(word, {...spec, kind: 'rare'}, {state: 'print'}).includes(' rare\"'));
  assert.ok(!stampHtml(word, {...spec, kind: 'rare'}, {state: 'shadow'}).includes('✦'));
  const html = stampHtml(word, spec, {state: 'shadow'});
  assert.ok(html.includes('？') && !html.includes(`>${word.w}<`));
  assert.ok(stampHtml(word, spec, {state: 'print', size: 'lg'}).includes(word.ja));
});

test('まれびとの仮刷りが参照するフィルターが共有定義にある', async () => {
  const {charaDefs} = await import('../products/word-guild/guild/chara-svg.mjs');
  assert.ok(charaDefs().includes('id="cg-p-rare"'));
});
