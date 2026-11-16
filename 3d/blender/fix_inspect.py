import bpy,sys,json
from mathutils import Vector
for name in ['tsumugi','hatori','fuurou-3']:
 bpy.ops.wm.read_factory_settings(use_empty=True); bpy.ops.import_scene.gltf(filepath=f'/home/user/word-guild/3d/models/{name}.glb')
 print('MODEL',name)
 for o in bpy.context.scene.objects:
  if o.type=='MESH':
   p=[o.matrix_world@Vector(c) for c in o.bound_box]; print('MESH',o.name,len(o.data.polygons),'bounds',[[round(f(v[i] for v in p),4) for i in range(3)] for f in [min,max]])
  if o.type=='ARMATURE':
   print('ARM',o.name, 'matrix',o.matrix_world[:]); print('BONES',[(b.name,tuple(round(x,4) for x in o.matrix_world@b.head_local),tuple(round(x,4) for x in o.matrix_world@b.tail_local)) for b in o.data.bones])
