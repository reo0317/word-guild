# 本体だけで画角を決め、Tポーズ・腕を下ろしたポーズ・手を振るポーズを、正面と横から書き出す。骨がちゃんと効くかの確かめ。
import bpy, sys, math, mathutils
glb, out = sys.argv[-2], sys.argv[-1]
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=glb)
sc = bpy.context.scene
body = max((o for o in sc.objects if o.type == 'MESH'), key=lambda o: len(o.data.polygons))
for o in sc.objects:
    if o.type == 'MESH' and o is not body: o.hide_render = True
arm = next(o for o in sc.objects if o.type == 'ARMATURE')
dg = bpy.context.evaluated_depsgraph_get()
def bounds():
    ev = body.evaluated_get(bpy.context.evaluated_depsgraph_get()); m = ev.to_mesh()
    pts = [body.matrix_world @ v.co for v in m.vertices]; ev.to_mesh_clear()
    lo = mathutils.Vector([min(p[i] for p in pts) for i in range(3)]); hi = mathutils.Vector([max(p[i] for p in pts) for i in range(3)]); return lo, hi
sc.view_settings.view_transform = 'Standard'
sc.world = bpy.data.worlds.new('w'); sc.world.use_nodes = True
bg = sc.world.node_tree.nodes['Background']; bg.inputs[0].default_value = (0.9, 0.88, 0.84, 1)
sc.render.engine = 'BLENDER_EEVEE'; sc.render.resolution_x = sc.render.resolution_y = 500
cd = bpy.data.cameras.new('c'); cd.type = 'ORTHO'; cam = bpy.data.objects.new('c', cd); sc.collection.objects.link(cam); sc.camera = cam
def shoot(tag):
    lo, hi = bounds(); c = (lo + hi) / 2; cd.ortho_scale = max(hi - lo) * 1.08
    for name, ang in [('front', 0), ('side', 90)]:
        a = math.radians(ang); cam.location = c + mathutils.Vector((math.sin(a) * 10, -math.cos(a) * 10, 0)); cam.rotation_euler = (math.radians(90), 0, a)
        sc.render.filepath = f'{out}-{tag}-{name}.png'; bpy.ops.render.render(write_still=True)
pb = arm.pose.bones
def rot(name, axis, deg):
    b = pb.get('mixamorig:' + name)
    if b: b.rotation_mode = 'XYZ'; setattr(b.rotation_euler, axis, math.radians(deg))
shoot('t')
# 腕を下ろす（骨のローカル軸の向きは確かめながら：Z と X を試す）
for side, s in [('Left', 1), ('Right', -1)]:
    rot(side + 'Arm', 'z', 0); rot(side + 'Arm', 'x', 0)
for side, s in [('Left', 1), ('Right', -1)]:
    b = pb['mixamorig:' + side + 'Arm']; b.rotation_mode = 'QUATERNION'
    # 腕の骨の向きから、体の前後軸まわりに70度下げる
    axis_world = mathutils.Vector((0, 1, 0)) * (1 if side == 'Left' else -1)
    rest = (arm.matrix_world @ b.bone.matrix_local).to_quaternion()
    local_axis = rest.inverted() @ axis_world
    b.rotation_quaternion = mathutils.Quaternion(local_axis, math.radians(70))
bpy.context.view_layer.update(); shoot('down')
