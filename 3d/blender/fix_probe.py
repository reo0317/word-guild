import bpy
bpy.ops.wm.read_factory_settings(use_empty=True);bpy.ops.import_scene.gltf(filepath='/home/user/word-guild/3d/models/out/hatori.glb')
for o in bpy.context.scene.objects:
 if o.type=='MESH':
  print(o.name,len(o.data.polygons),o.matrix_world[:])
  if 'Strap' in o.name:
   print([tuple(round(x,3) for x in v.co) for v in list(o.data.vertices)[::16]])
