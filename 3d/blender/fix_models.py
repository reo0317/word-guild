import bpy, math, json, os, bmesh
from mathutils import Vector, Quaternion
from mathutils.bvhtree import BVHTree
ROOT='/home/user/word-guild/3d/models'; OUT=ROOT+'/out'
def smooth(a,b,x):
 t=max(0,min(1,(x-a)/(b-a))); return t*t*(3-2*t)
def matte(m):
 if not m.use_nodes:return
 for n in m.node_tree.nodes:
  if n.type=='BSDF_PRINCIPLED':
   for key,val in [('Roughness',1),('Metallic',0),('Specular IOR Level',.1)]:
    for l in list(n.inputs[key].links):m.node_tree.links.remove(l)
    n.inputs[key].default_value=val

def strap(body,arm):
 verts=[body.matrix_world@v.co for v in body.data.vertices]; tree=BVHTree.FromPolygons(verts,[list(p.vertices) for p in body.data.polygons])
 points=[]
 # Shoulder wrap starts on the visible front strap, then follows the back.
 for i in range(17):
  t=i/16; y=-.045+.08*t; x=-.061
  hit,n,_,_=tree.ray_cast(Vector((x,y,.76)),Vector((0,0,-1)))
  points.append(Vector((x,y,max(.685,hit.z+.0035) if hit else .705)))
 for i in range(1,65):
  t=i/64; x=-.061+.202*t; z=points[16].z*(1-t)+.468*t
  hit,n,_,_=tree.ray_cast(Vector((x,.4,z)),Vector((0,-1,0)))
  points.append(Vector((x,hit.y+.004 if hit else .07,z)))
 vv=[]
 for i,p in enumerate(points):
  tangent=points[min(i+1,len(points)-1)]-points[max(0,i-1)]
  normal=Vector((0,1,0)) if i>16 else Vector((0,0,1))
  cross=tangent.cross(normal).normalized()*.010
  for sign in [-1,1]:
   q=p+sign*cross
   if i>16:
    hit,n,_,_=tree.ray_cast(Vector((q.x,.4,q.z)),Vector((0,-1,0)))
    if hit:q.y=hit.y+.004
   vv.append(q)
 faces=[(2*i,2*i+1,2*i+3,2*i+2) for i in range(len(points)-1)]
 me=bpy.data.meshes.new('Back strap ribbon');me.from_pydata(vv,[],faces);me.update()
 ob=bpy.data.objects.new('Hatori_Back_Strap',me);bpy.context.collection.objects.link(ob)
 m=bpy.data.materials.new('Strap vermilion matte');m.use_nodes=True;m.node_tree.nodes.get('Principled BSDF').inputs['Base Color'].default_value=(.58,.105,.035,1);matte(m);me.materials.append(m)
 groups={n:ob.vertex_groups.new(name='mixamorig:'+n) for n in ['Spine1','Spine2','RightShoulder','LeftShoulder']}
 for i,p in enumerate(points):
  upper=smooth(.56,.69,p.z); shoulder=(1-smooth(16,38,i))*.55
  weights={'Spine1':(1-upper)*(1-shoulder),'Spine2':upper*(1-shoulder),'RightShoulder':shoulder*.98,'LeftShoulder':shoulder*.02}
  for n,w in weights.items():
   if w:groups[n].add([i*2,i*2+1],w,'REPLACE')
 bpy.context.view_layer.objects.active=ob;ob.select_set(True)
 sol=ob.modifiers.new('Ribbon thickness','SOLIDIFY');sol.thickness=.0015;bpy.ops.object.modifier_apply(modifier=sol.name)
 mod=ob.modifiers.new('Body armature','ARMATURE');mod.object=arm;ob.parent=arm
 for p in me.polygons:p.use_smooth=True

def wings(body,arm):
 bm=bmesh.new();bm.from_mesh(body.data);bmesh.ops.remove_doubles(bm,verts=list(bm.verts),dist=0.000002);bm.to_mesh(body.data);bm.free();body.data.update()
 bpy.context.view_layer.objects.active=body
 dec=body.modifiers.new('20000 triangle target','DECIMATE');dec.ratio=20000/len(body.data.polygons);dec.use_collapse_triangulate=True
 bpy.ops.object.modifier_apply(modifier=dec.name)
 bpy.context.view_layer.objects.active=arm;bpy.ops.object.mode_set(mode='EDIT');inv=arm.matrix_world.inverted()
 for side,s in [('L',1),('R',-1)]:
  prev=arm.data.edit_bones['bone_2']
  for j,(a,b) in enumerate([(.15,.31),(.31,.48)]):
   bone=arm.data.edit_bones.new(f'Wing_{side}_{j}');bone.head=inv@Vector((s*a,-.035,.376));bone.tail=inv@Vector((s*b,-.035,.376));bone.parent=prev;bone.use_connect=j==1;prev=bone
 bpy.ops.object.mode_set(mode='OBJECT')
 gs={n:body.vertex_groups.new(name=n) for n in ['Wing_L_0','Wing_L_1','Wing_R_0','Wing_R_1']}
 count=0
 for v in body.data.vertices:
  p=body.matrix_world@v.co; x=abs(p.x)
  w=smooth(.165,.245,x)*smooth(.20,.28,p.z)*(1-smooth(.46,.52,p.z))
  if not w:continue
  old=[(g.group,g.weight) for g in v.groups]
  for idx,weight in old:body.vertex_groups[idx].add([v.index],weight*(1-w),'REPLACE')
  side='L' if p.x>0 else 'R'; tip=smooth(.27,.40,x)
  gs[f'Wing_{side}_0'].add([v.index],w*(1-tip),'REPLACE');gs[f'Wing_{side}_1'].add([v.index],w*tip,'REPLACE');count+=1
 print('WING_VERTICES',count)

def render(name):
 sc=bpy.context.scene; bodies=[o for o in sc.objects if o.type=='MESH'];arm=next(o for o in sc.objects if o.type=='ARMATURE')
 pts=[o.matrix_world@v.co for o in bodies for v in o.data.vertices];lo=Vector([min(p[i] for p in pts) for i in range(3)]);hi=Vector([max(p[i] for p in pts) for i in range(3)]);c=(lo+hi)/2;size=max(hi-lo)
 sc.render.engine='CYCLES';sc.cycles.samples=16;sc.cycles.use_denoising=True;sc.render.resolution_x=sc.render.resolution_y=512;sc.render.resolution_percentage=100
 sc.view_settings.view_transform='Standard';sc.world=bpy.data.worlds.new('Studio');sc.world.use_nodes=True;sc.world.node_tree.nodes['Background'].inputs[0].default_value=(.8,.8,.8,1);sc.world.node_tree.nodes['Background'].inputs[1].default_value=.65
 cd=bpy.data.cameras.new('Check camera');cd.type='ORTHO';cd.ortho_scale=size*1.15;cam=bpy.data.objects.new('Check camera',cd);sc.collection.objects.link(cam);sc.camera=cam
 for pos,power in [((-2,-3,4),230),((2,1,3),150)]:
  ld=bpy.data.lights.new('Softbox','AREA');ld.energy=power;ld.shape='DISK';ld.size=3;ob=bpy.data.objects.new('Softbox',ld);sc.collection.objects.link(ob);ob.location=pos;ob.rotation_euler=(c-ob.location).to_track_quat('-Z','Y').to_euler()
 def shoot(tag,angle):
  a=math.radians(angle);cam.location=c+Vector((math.sin(a)*3,-math.cos(a)*3,0));cam.rotation_euler=(c-cam.location).to_track_quat('-Z','Y').to_euler();sc.render.filepath=f'{OUT}/{name}-{tag}.png';bpy.ops.render.render(write_still=True)
 for mode in ['lit','unlit']:
  if mode=='unlit':
   for m in bpy.data.materials:
    if not m.use_nodes:continue
    nt=m.node_tree;bs=next((n for n in nt.nodes if n.type=='BSDF_PRINCIPLED'),None)
    if not bs:continue
    em=nt.nodes.new('ShaderNodeEmission');em.inputs[0].default_value=bs.inputs['Base Color'].default_value
    if bs.inputs['Base Color'].links:nt.links.new(bs.inputs['Base Color'].links[0].from_socket,em.inputs[0])
    nt.links.new(em.outputs[0],next(n for n in nt.nodes if n.type=='OUTPUT_MATERIAL').inputs[0])
  for tag,ang in [('front',0),('side',90),('back',180)]:shoot(mode+'-'+tag,ang)
 if name=='fuurou':
  original={o.name:[o.matrix_world@v.co for v in o.data.vertices] for o in bodies}
  for tag,deg in [('up',35),('down',-35)]:
   for side,s in [('L',1),('R',-1)]:
    b=arm.pose.bones[f'Wing_{side}_0'];b.rotation_mode='QUATERNION';axis=(arm.matrix_world@b.bone.matrix_local).to_quaternion().inverted()@Vector((0,1,0));b.rotation_quaternion=Quaternion(axis,math.radians(-deg*s))
   bpy.context.view_layer.update();shoot('flap-'+tag,0);shoot('flap-'+tag+'-back',180)
   max_center=0
   for o in bodies:
    ev=o.evaluated_get(bpy.context.evaluated_depsgraph_get());me=ev.to_mesh()
    for v in me.vertices:
     p=original[o.name][v.index]
     if abs(p.x)<.165:max_center=max(max_center,(o.matrix_world@v.co-p).length)
    ev.to_mesh_clear()
   print('FLAP_CENTER_DISPLACEMENT',tag,max_center)

reports=[]
for name,src in [('tsumugi','tsumugi'),('hatori','hatori'),('fuurou','fuurou-3')]:
 bpy.ops.wm.read_factory_settings(use_empty=True);bpy.ops.import_scene.gltf(filepath=f'{ROOT}/{src}.glb')
 body=max((o for o in bpy.context.scene.objects if o.type=='MESH'),key=lambda o:len(o.data.polygons));arm=next(o for o in bpy.context.scene.objects if o.type=='ARMATURE');oldbones=set(arm.data.bones.keys())
 for o in list(bpy.context.scene.objects):
  if o.type=='MESH' and o!=body:bpy.data.objects.remove(o,do_unlink=True)
 for m in bpy.data.materials:matte(m)
 if name=='hatori':strap(body,arm)
 if name=='fuurou':wings(body,arm)
 bpy.ops.export_scene.gltf(filepath=f'{OUT}/{name}.glb',export_format='GLB',export_animations=False,export_all_influences=True)
 bpy.ops.wm.read_factory_settings(use_empty=True);bpy.ops.import_scene.gltf(filepath=f'{OUT}/{name}.glb')
 
 for o in list(bpy.context.scene.objects):
  if o.type=='MESH' and o.name.startswith('Icosphere'):bpy.data.objects.remove(o,do_unlink=True)
 meshes=[o for o in bpy.context.scene.objects if o.type=='MESH'];a=next(o for o in bpy.context.scene.objects if o.type=='ARMATURE')
 report={'name':name,'triangles':sum(len(o.data.polygons) for o in meshes),'bones':len(a.data.bones),'original_bones_preserved':oldbones.issubset(set(a.data.bones.keys())),'textures':[(i.name,list(i.size)) for i in bpy.data.images if i.type=='IMAGE'],'uv_layers':[len(o.data.uv_layers) for o in meshes]};reports.append(report);print('REIMPORT_CHECK',json.dumps(report))
 render(name)
open(OUT+'/validation.json','w').write(json.dumps(reports,ensure_ascii=False,indent=2))
