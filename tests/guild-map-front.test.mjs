import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile, stat} from 'node:fs/promises';
import {mapButton} from '../products/word-guild/guild/dom.mjs';
import {layout, wardAt} from '../products/word-guild/guild/map.mjs';
import {MAP_ART} from '../products/word-guild/art/map-art.mjs';
import {precacheFiles} from '../tools/sw-version.mjs';

test('郵便局・導入の道・地図ボタンは容量内でprecacheに入る', async () => {
  const files = await precacheFiles();
  for (const [name, limit] of [['post-front',40],['road/road-0',45],...['letter','album','settings','title'].map(k=>['btn-'+k,15])]) {
    const path = `art/${name}.webp`;
    assert.ok((await stat(new URL('../products/word-guild/'+path,import.meta.url))).size <= limit*1024, path);
    assert.ok(files.includes('./'+path), path);
  }
  assert.ok(MAP_ART.roads.includes(0));
});

test('4つの地図ボタンは絵・代替SVG・ラベル・おすすめの点を保つ', () => {
  for (const [kind, file] of [['letter','letter'],['album','album'],['gear','settings'],['title','title']]) {
    const html=mapButton({kind,label:'表示名',id:'test',badge:true});
    assert.ok(html.includes(`src="art/btn-${file}.webp"`));
    assert.match(html, /data-map-button-image/);
    assert.match(html, /<svg/);
    assert.match(html, /<small>表示名<\/small>/);
    assert.match(html, /gq-export-dot/);
  }
});

test('郵便局から1区開始までだけ0区の道になり、物語と足元の案内を保つ', async () => {
  const {ranges}=layout({wards:[{ch:1,lamps:[]}]});
  const boundary=ranges.find(r=>r.ch===1).start;
  assert.ok(boundary>14);
  assert.equal(wardAt(ranges,14),0);
  assert.equal(wardAt(ranges,boundary-.01),0);
  assert.equal(wardAt(ranges,boundary),1);
  const source=await readFile(new URL('../products/word-guild/guild/map.mjs',import.meta.url),'utf8');
  assert.match(source,/data-story/);
  assert.match(source,/src="art\/post-front.webp"/);
  assert.match(source,/gq-guide/);
  assert.match(source,/gq-due-badge/);
});
