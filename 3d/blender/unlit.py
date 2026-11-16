# 光を使わず、テクスチャの色そのままで4方向を書き出す（白飛びか、本当に色が無いかを見分ける）。
import bpy, sys, math, mathutils
glb, out = sys.argv[-2], sys.argv[-1]
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=glb)
sc = bpy.context.scene
body = max((o for o in sc.objects if o.type == 'MESH'), key=lambda o: len(o.data.polygons))
for o in sc.objects:
    if o.type == 'MESH' and o is not body: o.hide_render = True
for m in bpy.data.materials:
    if not m.use_nodes: continue
    nt = m.node_tree; bsdf = next((n for n in nt.nodes if n.type == 'BSDF_PRINCIPLED'), None); outn = next(n for n in nt.nodes if n.type == 'OUTPUT_MATERIAL')
    link = next((l for l in nt.links if bsdf and l.to_node == bsdf and l.to_socket.name == 'Base Color'), None)
    em = nt.nodes.new('ShaderNodeEmission')
    if link: nt.links.new(link.from_socket, em.inputs[0])
    nt.links.new(em.outputs[0], outn.inputs[0])
pts = [body.matrix_world @ mathutils.Vector(c) for c in body.bound_box]
lo = mathutils.Vector([min(p[i] for p in pts) for i in range(3)]); hi = mathutils.Vector([max(p[i] for p in pts) for i in range(3)]); c = (lo + hi) / 2
sc.view_settings.view_transform = 'Standard'
sc.world = bpy.data.worlds.new('w'); sc.world.use_nodes = True; sc.world.node_tree.nodes['Background'].inputs[0].default_value = (0.9, 0.88, 0.84, 1)
sc.render.engine = 'BLENDER_EEVEE'; sc.render.resolution_x = sc.render.resolution_y = 500
cd = bpy.data.cameras.new('c'); cd.type = 'ORTHO'; cd.ortho_scale = max(hi - lo) * 1.08
cam = bpy.data.objects.new('c', cd); sc.collection.objects.link(cam); sc.camera = cam
for name, ang in [('front', 0), ('q', 40), ('side', 90), ('back', 180)]:
    a = math.radians(ang); cam.location = c + mathutils.Vector((math.sin(a) * 10, -math.cos(a) * 10, 0)); cam.rotation_euler = (math.radians(90), 0, a)
    sc.render.filepath = f'{out}-{name}.png'; bpy.ops.render.render(write_still=True)
