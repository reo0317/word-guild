# GLB を読み、部品・面の数・骨・大きさを出し、正面・横・後ろ・斜めの4枚をそのままの色で書き出す。
import bpy, sys, math, mathutils
glb, out = sys.argv[-2], sys.argv[-1]
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=glb)
sc = bpy.context.scene
meshes = [o for o in sc.objects if o.type == 'MESH']
arms = [o for o in sc.objects if o.type == 'ARMATURE']
print('MESHES', [(o.name, len(o.data.polygons), len(o.data.vertices)) for o in meshes])
for a in arms:
    print('ARMATURE', a.name, len(a.data.bones)); print('BONES', [b.name for b in a.data.bones])
print('MATERIALS', [m.name for m in bpy.data.materials], 'IMAGES', [(i.name, i.size[:]) for i in bpy.data.images])
pts = [o.matrix_world @ mathutils.Vector(c) for o in meshes for c in o.bound_box]
lo = mathutils.Vector([min(p[i] for p in pts) for i in range(3)]); hi = mathutils.Vector([max(p[i] for p in pts) for i in range(3)])
print('BOUNDS', tuple(round(v,3) for v in lo), tuple(round(v,3) for v in hi))
center = (lo + hi) / 2; size = max(hi - lo)
sc.view_settings.view_transform = 'Standard'
sc.world = bpy.data.worlds.new('w'); sc.world.use_nodes = True
sc.world.node_tree.nodes['Background'].inputs[0].default_value = (0.85, 0.85, 0.85, 1); sc.world.node_tree.nodes['Background'].inputs[1].default_value = 1.0
sc.render.engine = 'BLENDER_EEVEE'; sc.render.resolution_x = sc.render.resolution_y = 600
cam_data = bpy.data.cameras.new('c'); cam_data.type = 'ORTHO'; cam_data.ortho_scale = size * 1.1
cam = bpy.data.objects.new('c', cam_data); sc.collection.objects.link(cam); sc.camera = cam
for name, ang in [('front', 0), ('side', 90), ('back', 180), ('q', 35)]:
    a = math.radians(ang); d = size * 3
    cam.location = center + mathutils.Vector((math.sin(a) * d, -math.cos(a) * d, 0))
    cam.rotation_euler = (math.radians(90), 0, a)
    sc.render.filepath = f'{out}-{name}.png'; bpy.ops.render.render(write_still=True)
