# 試し：ヘッドレスの Blender で、版画風（べた塗りの陰＋太い紺の線）の1枚を書き出せるか確かめる。
import bpy, sys
bpy.ops.wm.read_factory_settings(use_empty=True)
sc = bpy.context.scene
bpy.ops.mesh.primitive_uv_sphere_add(radius=1, location=(0, 0, 1))
obj = bpy.context.object
bpy.ops.object.shade_smooth()
# 2段のトゥーン陰（Shader to RGB → ColorRamp constant）
mat = bpy.data.materials.new('toon'); mat.use_nodes = True
nt = mat.node_tree; nt.nodes.clear()
bsdf = nt.nodes.new('ShaderNodeBsdfDiffuse'); bsdf.inputs['Color'].default_value = (0.95, 0.9, 0.8, 1)
s2r = nt.nodes.new('ShaderNodeShaderToRGB'); ramp = nt.nodes.new('ShaderNodeValToRGB')
ramp.color_ramp.interpolation = 'CONSTANT'
ramp.color_ramp.elements[0].color = (0.62, 0.70, 0.75, 1); ramp.color_ramp.elements[1].position = .45
ramp.color_ramp.elements[1].color = (0.95, 0.92, 0.85, 1)
emit = nt.nodes.new('ShaderNodeEmission'); out = nt.nodes.new('ShaderNodeOutputMaterial')
nt.links.new(bsdf.outputs[0], s2r.inputs[0]); nt.links.new(s2r.outputs[0], ramp.inputs[0])
nt.links.new(ramp.outputs[0], emit.inputs[0]); nt.links.new(emit.outputs[0], out.inputs[0])
obj.data.materials.append(mat)
# 太い紺の輪郭（裏返しの殻）
line = bpy.data.materials.new('line'); line.use_nodes = True; line.use_backface_culling = True
ln = line.node_tree; ln.nodes.clear(); e = ln.nodes.new('ShaderNodeEmission'); e.inputs[0].default_value = (0.12, 0.16, 0.27, 1)
o = ln.nodes.new('ShaderNodeOutputMaterial'); ln.links.new(e.outputs[0], o.inputs[0])
obj.data.materials.append(line)
sol = obj.modifiers.new('outline', 'SOLIDIFY'); sol.thickness = .05; sol.use_flip_normals = True; sol.material_offset = 1
bpy.ops.object.light_add(type='SUN', rotation=(0.8, 0.2, 0.6))
bpy.ops.object.camera_add(location=(0, -5, 1.6), rotation=(1.45, 0, 0)); sc.camera = bpy.context.object
sc.render.engine = 'BLENDER_EEVEE'; sc.render.resolution_x = sc.render.resolution_y = 400
sc.view_settings.view_transform = 'Standard'  # 色をそのまま出す（版画の色を変えない）
sc.world = bpy.data.worlds.new('w'); sc.world.use_nodes = True
sc.world.node_tree.nodes['Background'].inputs[0].default_value = (0.95, 0.92, 0.85, 1)
sc.render.filepath = sys.argv[-1]; bpy.ops.render.render(write_still=True)
