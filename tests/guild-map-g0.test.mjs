import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile, stat} from 'node:fs/promises';
import {roadRow, projectRoad, mipLevel, wardAt, gateDoorRect, propsFor} from '../products/word-guild/guild/map.mjs';

test('行の逆投影はスマホの縦横とカメラ移動後も元の位置へ戻る', () => {
  for (const [w,h] of [[390,700],[360,500],[844,320]]) {
    for (const camera of [-1000,0,3000,12000]) {
      for (let y=Math.ceil(h*.3); y<h; y+=7) {
        const row=roadRow(w,h,y,camera);
        const p=projectRoad(w,h,row.worldZ,camera);
        assert.ok(Math.abs(p.y-y)<1e-8);
        assert.equal(p.x,row.x);
        const next=roadRow(w,h,y+.001,camera);
        assert.ok(Math.abs((row.worldZ-next.worldZ)/.001-row.dz)<row.dz*.0001);
      }
    }
  }
  assert.equal(roadRow(390,700,0),null);
});

test('遠くほど縮小段階を上げ、門の足元で2区を切り替える', () => {
  let previous=0;
  for(let dz=.1;dz<200;dz+=.1) {
    const level=mipLevel(dz);
    assert.ok(level>=previous && level<=5);
    previous=level;
  }
  const ranges=[{ch:1,start:0,end:1000},{ch:2,start:1000,end:2000},{ch:3,start:2000,end:3000}];
  assert.deepEqual([999,1000,1999,2000,3000].map(z=>wardAt(ranges,z)),[1,2,2,3,null]);
  const r=gateDoorRect(2);
  assert.ok(r.x>0 && r.y>0 && r.x+r.width<1 && r.y+r.height<1);
  for (let ch=1;ch<=6;ch++) { const r=gateDoorRect(ch); assert.ok(r.x>=0 && r.y>=0 && r.x+r.width<=1 && r.y+r.height<=1); }
});

test('G0の道と門だけを書き出し、容量制限に収まる',async()=>{
  for(const [path,kb] of [['road/road-2.webp',45],['gate-2.webp',70],['gate-2-door-l.webp',40],['gate-2-door-r.webp',40]]) {
    assert.ok((await stat(new URL('../products/word-guild/art/'+path,import.meta.url))).size<=kb*1024);
  }
  const source=await readFile(new URL('../products/word-guild/guild/map.mjs',import.meta.url),'utf8');
  assert.match(source,/MAP_ART.gates.includes\(ward.ch\)/);
  assert.doesNotMatch(source,/loading=["']lazy/);
});

 test('小物の並びは再現でき、連続する種類を避ける',()=>{
 const ward={lamps:[1,2,3].map(shelf=>({shelf,steps:[{},{},{},{}]}))};
 const props=propsFor(ward);assert.deepEqual(props,propsFor(ward));
 const small=props.filter(p=>p.kind);for(let i=1;i<small.length;i++) assert.notEqual(small[i].kind,small[i-1].kind);
 });

test('全6区の書き出し画像は容量制限と合計1.2MBを守る',async()=>{
  let total=0;
  for(let ch=1;ch<=6;ch++) {
    for(const [path,kb] of [[`road/road-${ch}`,45],[`road/props-${ch}`,70],[`gate-${ch}`,70],[`gate-${ch}-door`,40],[`gate-${ch}-door-l`,40],[`gate-${ch}-door-r`,40]]) {
      const size=(await stat(new URL(`../products/word-guild/art/${path}.webp`,import.meta.url))).size;
      assert.ok(size<=kb*1024,`${path}: ${size}`); total+=size;
    }
  }
  assert.ok(total<=1200000,`${total} bytes`);
});
