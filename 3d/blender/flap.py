# フウロウの羽の骨（Limb）を上下に回して、羽ばたけるか確かめる。
import bpy, sys, math, mathutils
glb, out = sys.argv[-2], sys.argv[-1]
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=glb)
sc = bpy.context.scene
for o in sc.objects:
    if o.type == 'MESH' and len(o.data.polygons) < 200: o.hide_render = True
arm = next(o for o in sc.objects if o.type == 'ARMATURE')
print('LIMBS', [b.name for b in arm.data.bones if 'Limb' in b.name])
body = max((o for o in sc.objects if o.type == 'MESH'), key=lambda o: len(o.data.polygons))
pts = [body.matrix_world @ mathutils.Vector(c) for c in body.bound_box]
lo = mathutils.Vector([min(p[i] for p in pts) for i in range(3)]); hi = mathutils.Vector([max(p[i] for p in pts) for i in range(3)]); c = (lo + hi) / 2
sc.view_settings.view_transform = 'Standard'
sc.world = bpy.data.worlds.new('w'); sc.world.use_nodes = True; sc.world.node_tree.nodes['Background'].inputs[0].default_value = (0.9, 0.88, 0.84, 1)
sc.render.engine = 'BLENDER_EEVEE'; sc.render.resolution_x = sc.render.resolution_y = 400
cd = bpy.data.cameras.new('c'); cd.type = 'ORTHO'; cd.ortho_scale = max(hi - lo) * 1.5
cam = bpy.data.objects.new('c', cd); sc.collection.objects.link(cam); sc.camera = cam
cam.location = c + mathutils.Vector((0, -10, 0)); cam.rotation_euler = (math.radians(90), 0, 0)
roots = [b for b in arm.pose.bones if b.name.endswith('Limb_0') and ('Left' in b.name or 'Right' in b.name)]
for tag, deg in [('up', 35), ('down', -35)]:
    for b in roots:
        b.rotation_mode = 'QUATERNION'
        side = 1 if 'Left' in b.name else -1
        rest = (arm.matrix_world @ b.bone.matrix_local).to_quaternion()
        axis = rest.inverted() @ mathutils.Vector((0, 1, 0))
        b.rotation_quaternion = mathutils.Quaternion(axis, math.radians(deg * side))
    bpy.context.view_layer.update()
    sc.render.filepath = f'{out}-{tag}.png'; bpy.ops.render.render(write_still=True)
