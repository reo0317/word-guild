import bpy, glob
for f in sorted(glob.glob('/home/user/word-guild/3d/assets/polyhaven/*/*.blend')):
    with bpy.data.libraries.load(f) as (src, dst):
        dst.objects = list(src.objects)
    print("==", f.split('/')[-1])
    for o in dst.objects:
        if o is None: continue
        n = len(o.data.polygons) if o.type == 'MESH' else 0
        print("  ", o.type, o.name, tuple(round(v, 2) for v in o.dimensions), tuple(round(v,2) for v in o.location), n, [m.name for m in getattr(o.data,'materials',[])][:3], o.parent.name if o.parent else None)
