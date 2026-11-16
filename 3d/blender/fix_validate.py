import json,struct
from pathlib import Path
p=Path('/home/user/word-guild/3d/models/out')
for name in ['tsumugi','hatori','fuurou']:
 with open(p/(name+'.glb'),'rb') as f:
  f.read(12);n,t=struct.unpack('<II',f.read(8));g=json.loads(f.read(n))
 assert all('Icosphere' not in m.get('name','') for m in g['meshes'])
 for m in g['materials']:
  mr=m.get('pbrMetallicRoughness',{});assert mr.get('roughnessFactor',1)==1 and mr.get('metallicFactor',1)==0
 assert g.get('images') and all('bufferView' in i for i in g['images'])
 print(name,'triangles',sum(g['accessors'][q['indices']]['count']//3 for m in g['meshes'] for q in m['primitives']),'bones',len(g['skins'][0]['joints']),'embedded textures',len(g['images']),'matte OK, no accessory mesh')
