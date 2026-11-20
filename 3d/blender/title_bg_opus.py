"""霧晴れ郵便局 タイトル背景の調整（Opus 版）

元の Kiribare_Hillside.astra.blend を読み、破綻の修正・郵便局の寄せ・空/霧/光を加えて
Kiribare_Hillside.opus.blend に保存する。何度流しても同じ結果になる（元ファイルは読むだけ）。

  blender -b --disable-autoexec 3d/scenes/Kiribare_Hillside.astra.blend \
      -P 3d/blender/title_bg_opus.py -- 3d/scenes/Kiribare_Hillside.opus.blend
"""
import bpy, bmesh, math, sys
from mathutils import Vector, Matrix, Euler

argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
OUT = argv[0] if argv else None

S = bpy.context.scene
VL = S.view_layers[0]
OB = bpy.data.objects
MA = bpy.data.materials
LOG = []


def log(msg):
    LOG.append(msg)
    print('[opus]', msg)


# ---------------------------------------------------------------- helpers
def principled(m):
    for n in m.node_tree.nodes:
        if n.type == 'BSDF_PRINCIPLED':
            return n


def ramp_of(m):
    """Colour ramp feeding Base Color (directly or through one mix)."""
    p = principled(m)
    sock = p.inputs['Base Color']
    for _ in range(3):
        if not sock.is_linked:
            return None
        n = sock.links[0].from_node
        if n.type == 'VALTORGB':
            return n
        sock = n.inputs[1] if len(n.inputs) > 1 else n.inputs[0]
    return None


def set_ramp(m, cols):
    r = ramp_of(m)
    if r is None:
        principled(m).inputs['Base Color'].default_value = (*cols[-1], 1)
        return
    els = r.color_ramp.elements
    for i, e in enumerate(els):
        c = cols[min(i, len(cols) - 1)] if len(cols) == len(els) else \
            [a + (b - a) * (i / max(1, len(els) - 1)) for a, b in zip(cols[0], cols[-1])]
        e.color = (*c, 1)


def set_base(m, col, **kw):
    p = principled(m)
    if p.inputs['Base Color'].is_linked:
        set_ramp(m, [col, col])
    else:
        p.inputs['Base Color'].default_value = (*col, 1)
    for k, v in kw.items():
        p.inputs[k].default_value = v


def nodes(tree):
    def N(kind, loc=(0, 0), **inp):
        n = tree.nodes.new(kind)
        n.location = loc
        for k, v in inp.items():
            if k.startswith('_'):
                setattr(n, k[1:], v)
            else:
                n.inputs[k].default_value = v
        return n

    def L(a, b):
        tree.links.new(a, b)
    return N, L


def mth(N, L, op, a, b=None, loc=(0, 0), clamp=False):
    n = N('ShaderNodeMath', loc, _operation=op, _use_clamp=clamp)
    for i, v in enumerate((a, b)):
        if v is None:
            continue
        if isinstance(v, (int, float)):
            n.inputs[i].default_value = v
        else:
            L(v, n.inputs[i])
    return n.outputs[0]


def local_box(name, parent, lo, hi, mat, pass_index=1):
    """Axis-aligned box in the parent's local space."""
    me = bpy.data.meshes.new(name)
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1.0)
    for v in bm.verts:
        v.co = Vector([lo[i] + (v.co[i] + 0.5) * (hi[i] - lo[i]) for i in range(3)])
    bm.to_mesh(me)
    bm.free()
    me.materials.append(mat)
    o = OB.new(name, me)
    parent.users_collection[0].objects.link(o)
    o.parent = parent
    o.matrix_parent_inverse = Matrix()
    o.pass_index = pass_index
    return o


def link_like(o, ref):
    for c in list(o.users_collection):
        c.objects.unlink(o)
    ref.users_collection[0].objects.link(o)


# ================================================================ 1. 破綻の修正
def fix_normals():
    """閉じた形なのに一部の面が裏返っている物体を外向きにそろえる。"""
    names = ['局舎 | Sorting room and cross gable',
             '局舎 | Coastal eaves gutters and copper downpipes',
             '潮端 | Broken schist ledges at the quay',
             '地層 | Weathered schist combs in the grass',
             'Near escarpment • exposed split schist',
             'Stair garden • slate ledges',
             '07 • Lighthouse keeper’s cottage'] + \
        [o.name for o in OB if o.name.startswith('Village • ')]
    for n in names:
        o = OB.get(n)
        if not o:
            continue
        bm = bmesh.new()
        bm.from_mesh(o.data)
        before = [f.normal.copy() for f in bm.faces]
        bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
        flipped = sum(1 for f, nn in zip(bm.faces, before) if f.normal.dot(nn) < 0)
        bm.to_mesh(o.data)
        bm.free()
        log(f'normals: {n} flipped {flipped}')


TERRAIN = ['05 • Coastal bluff', '潮端 | Continuous graded schist bank and wooded saddle',
           '岬の森 | Woodland footslope', '01 • Stair structure', '02 • Dressed granite treads',
           '広場 | Oyster sandstone flags']


def ground_z(x, y, top=40.0):
    best = None
    for n in TERRAIN:
        o = OB.get(n)
        if not o:
            continue
        inv = o.matrix_world.inverted()
        a = inv @ Vector((x, y, top))
        b = inv @ Vector((x, y, top - 1))
        ok, loc, nor, idx = o.ray_cast(a, (b - a).normalized())
        if ok:
            z = (o.matrix_world @ loc).z
            best = z if best is None else max(best, z)
    return best


def remove_buried_wall_shards():
    """石段の左縁で、地面に埋まった袖石の頭だけが 2〜9 cm 草から突き出て「割れた板」に見える。
    広場の下の袖石も敷石より 1 cm 高く、目地から点々と頭を出して（輪郭線がのって）黒い点列に見えていた。
    地面・敷石からの突き出しが 10 cm 未満の石（＝ほぼ埋没）を取り除く。"""
    o = OB['03 • Sea wall and capstones']
    mw = o.matrix_world
    bm = bmesh.new()
    bm.from_mesh(o.data)
    bm.verts.ensure_lookup_table()
    seen, kill = set(), []
    for v in bm.verts:
        if v.index in seen:
            continue
        st, comp = [v], []
        seen.add(v.index)
        while st:
            x = st.pop()
            comp.append(x)
            for e in x.link_edges:
                y = e.other_vert(x)
                if y.index not in seen:
                    seen.add(y.index)
                    st.append(y)
        prot = []
        for x in comp:
            w = mw @ x.co
            g = ground_z(w.x, w.y)
            prot.append(w.z - g if g is not None else 99)
        if 0.0 < max(prot) < 0.10:
            kill.extend(comp)
    bmesh.ops.delete(bm, geom=kill, context='VERTS')
    bm.to_mesh(o.data)
    bm.free()
    log(f'sea wall: removed {len(kill) // 24} buried capstone shards')


def soften_rocks():
    """多面体のまま光る岩：角を面取りし、浅い角はなめらかに（鋭い割れ目は残す）。"""
    rocks = ['Stair garden • slate ledges', 'Near escarpment • exposed split schist',
             '地層 | Weathered schist combs in the grass', '潮端 | Broken schist ledges at the quay']
    for n in rocks:
        o = OB.get(n)
        if not o:
            continue
        if 'opus_round' not in o.modifiers:
            # 角ばった多面体 → 細分化で丸め、大小 2 段のノイズで割れ肌の凹凸
            sd = o.modifiers.new('opus_round', 'SUBSURF')
            sd.subdivision_type = 'CATMULL_CLARK'
            sd.levels = sd.render_levels = 3
            sd.boundary_smooth = 'PRESERVE_CORNERS'
            big = bpy.data.textures.get('OPUS 岩の起伏') or bpy.data.textures.new('OPUS 岩の起伏', 'CLOUDS')
            big.noise_scale = 0.45
            big.noise_depth = 2
            fine = bpy.data.textures.get('OPUS 岩肌') or bpy.data.textures.new('OPUS 岩肌', 'CLOUDS')
            fine.noise_scale = 0.09
            fine.noise_depth = 3
            fine.noise_basis = 'VORONOI_F2'
            for nm, tex, st in (('opus_lumps', big, 0.12), ('opus_grain', fine, 0.03)):
                dp = o.modifiers.new(nm, 'DISPLACE')
                dp.texture = tex
                dp.texture_coords = 'GLOBAL'
                dp.strength = st
                dp.mid_level = 0.5
        for p in o.data.polygons:
            p.use_smooth = True
        if hasattr(o.data, 'sharp_edge') or 'sharp_edge' in o.data.attributes:
            a = o.data.attributes.get('sharp_edge')
            if a:
                o.data.attributes.remove(a)
    # 椿：低ポリの球が縞に見える → 細分化してなめらかに
    o = OB.get('石段の椿 | Camellia at the margin of the steps')
    if o:
        for p in o.data.polygons:
            p.use_smooth = True
        if 'opus_subd' not in o.modifiers:
            sd = o.modifiers.new('opus_subd', 'SUBSURF')
            sd.levels = sd.render_levels = 1
    log('rocks rounded (Catmull-Clark x3 + two-scale displacement); camellia subdivided')


def math_radians(d):
    return d * math.pi / 180


def fix_plaza_joints():
    """敷石の目地が点線状にちらつく：目地の底が 7 cm 下の暗い面で、細い隙間が途切れて見えていた。
    敷石の上面を写した目地床（0.7 mm 下、各石を 4 cm 広げる）を敷き、目地を一定の石灰色の線にする。"""
    m = MA['海辺の広場 | Lime pointing']
    # 目地は敷石より十分暗い色に（線として読める濃さ）
    set_ramp(m, [(0.15, 0.14, 0.12), (0.20, 0.18, 0.155)])
    src = OB['広場 | Oyster sandstone flags']
    if 'OPUS 広場 | Mortar bed' in OB:
        return
    mw = src.matrix_world
    bm = bmesh.new()
    for p in src.data.polygons:
        if p.normal.z < 0.9:
            continue
        ws = [mw @ src.data.vertices[i].co for i in p.vertices]
        if abs(ws[0].z - 4.47) > 0.003:
            continue
        c = sum(ws, Vector()) / len(ws)
        vs = []
        for w in ws:
            d = (w - c)
            d.z = 0
            grow = d.normalized() * 0.04 if d.length > 1e-6 else Vector()
            vs.append(bm.verts.new((w.x + grow.x, w.y + grow.y, 4.4693)))
        bm.faces.new(vs)
    me = bpy.data.meshes.new('OPUS 広場 | Mortar bed')
    bm.to_mesh(me)
    bm.free()
    me.materials.append(m)
    o = OB.new('OPUS 広場 | Mortar bed', me)
    link_like(o, src)
    # 目地を線として読める幅に：各敷石の上面を 9 mm 内側へ寄せる（角が面取りになり、暗い目地床が 2 cm ほど見える）
    inv = mw.inverted()
    moved = set()
    for p in src.data.polygons:
        if p.normal.z < 0.9:
            continue
        ws = [mw @ src.data.vertices[i].co for i in p.vertices]
        if abs(ws[0].z - 4.47) > 0.003:
            continue
        c = sum(ws, Vector()) / len(ws)
        for i, w in zip(p.vertices, ws):
            if i in moved:
                continue
            d = c - w
            d.z = 0
            if d.length > 0.03:
                src.data.vertices[i].co = inv @ (w + d.normalized() * 0.009)
                moved.add(i)
    log(f'plaza mortar bed: {len(me.polygons)} faces under the flag joints')


def weather(m, moss=0.55, up=0.0, ao=0.0, var=0.18, scale=9.0, bump=0.0):
    """色に揺らぎ・苔（上向き面 / 隅＝AO）を足す。焼き込みの陰色の代わりに実際の光で陰を出す。"""
    t = m.node_tree
    if any(n.name == 'OPUS weather' for n in t.nodes):
        return
    p = principled(m)
    N, L = nodes(t)
    bc = p.inputs['Base Color']
    if bc.is_linked:
        src = bc.links[0].from_socket
    else:
        rgb = N('ShaderNodeRGB', (-900, 400))
        rgb.outputs[0].default_value = bc.default_value
        src = rgb.outputs[0]
    geo = N('ShaderNodeNewGeometry', (-1300, 200))
    noi = N('ShaderNodeTexNoise', (-1100, 200), Scale=scale, Detail=6.0, Roughness=0.6)
    noi.name = 'OPUS weather'
    L(geo.outputs['Position'], noi.inputs['Vector'])
    # 明るさの揺らぎ
    vr = N('ShaderNodeMapRange', (-900, 200), **{'To Min': 1 - var, 'To Max': 1 + var * 0.6})
    L(noi.outputs['Fac'], vr.inputs['Value'])
    mul = N('ShaderNodeMix', (-700, 300), _data_type='RGBA', _blend_type='MULTIPLY')
    mul.inputs['Factor'].default_value = 1.0
    L(src, mul.inputs[6])
    L(vr.outputs[0], mul.inputs[7])
    out = mul.outputs[2]
    # 苔の量
    mask = None
    if up > 0:
        sep = N('ShaderNodeSeparateXYZ', (-1100, -100))
        L(geo.outputs['Normal'], sep.inputs[0])
        u = N('ShaderNodeMapRange', (-900, -100), **{'From Min': 0.45, 'From Max': 0.95, 'To Max': up})
        L(sep.outputs['Z'], u.inputs['Value'])
        mask = u.outputs[0]
    if ao > 0:
        a = N('ShaderNodeAmbientOcclusion', (-1100, -350), Distance=0.35)
        a.samples = 8
        inv = N('ShaderNodeMapRange', (-900, -350), **{'From Min': 0.95, 'From Max': 0.45, 'To Max': ao})
        L(a.outputs['AO'], inv.inputs['Value'])
        mask = inv.outputs[0] if mask is None else mth(N, L, 'MAXIMUM', mask, inv.outputs[0], (-750, -250))
    if mask is not None:
        n2 = N('ShaderNodeTexNoise', (-1100, -600), Scale=scale * 2.3, Detail=4.0, Roughness=0.7)
        L(geo.outputs['Position'], n2.inputs['Vector'])
        bl = N('ShaderNodeMapRange', (-900, -600), **{'From Min': 0.42, 'From Max': 0.62})
        L(n2.outputs['Fac'], bl.inputs['Value'])
        mk = mth(N, L, 'MULTIPLY', mask, bl.outputs[0], (-600, -400), clamp=True)
        mx = N('ShaderNodeMix', (-450, 200), _data_type='RGBA')
        L(mk, mx.inputs['Factor'])
        L(out, mx.inputs[6])
        mx.inputs[7].default_value = (0.085 * moss / 0.55, 0.125, 0.050, 1)
        out = mx.outputs[2]
    L(out, bc)
    if bump > 0 and not p.inputs['Normal'].is_linked:
        b = N('ShaderNodeBump', (-300, -300), Strength=bump, Distance=0.02)
        L(noi.outputs['Fac'], b.inputs['Height'])
        L(b.outputs['Normal'], p.inputs['Normal'])


def naturalize():
    # 椿：葉の「照/陰」を面ごとに塗り分けた焼き込みの陰 → 同系色にして光で陰を出す
    set_base(MA['岬の樹林 | 椿・片照'], (0.075, 0.150, 0.065))
    set_base(MA['岬の樹林 | 椿・葉陰'], (0.055, 0.125, 0.060))
    for n in ('岬の樹林 | 椿・片照', '岬の樹林 | 椿・葉陰'):
        weather(MA[n], var=0.35, scale=22.0, bump=0.6)
    # 石段脇の粘板岩：同じく面ごとの陰色をやめ、苔と揺らぎ
    set_base(MA['Bluff | pale split face'], (0.27, 0.29, 0.26))
    set_base(MA['Bluff | blue slate in shade'], (0.22, 0.25, 0.24))
    for n in ('Bluff | pale split face', 'Bluff | blue slate in shade', '草地 | Windblown stone'):
        if n in MA:
            weather(MA[n], up=0.75, var=0.25, scale=6.0, bump=0.4)
    # 石段：踏み面の隅・蹴上げの付け根に苔、全体に摩耗のむら
    for m in MA:
        if m.name.startswith('Granite • worn face') or m.name.startswith('Granite • split face'):
            weather(m, ao=0.65, up=0.15 if 'split' in m.name else 0.0, var=0.12, scale=7.0)
    log('camellia / slate baked shading removed; moss + wear added to stairs')


# ================================================================ 2. 郵便局を絵に寄せる
def post_office():
    org = OB['局舎 | Building origin']
    # 色：絵の「紙色の壁・紺の木部・金の飾り」へ
    set_ramp(MA['Post office • Limewash'], [(0.70, 0.64, 0.52), (0.88, 0.81, 0.67)])
    set_ramp(MA['Post office • Blue-green joinery'], [(0.030, 0.048, 0.092), (0.045, 0.066, 0.120)])
    set_ramp(MA['Post office • Midnight blue timber'], [(0.022, 0.034, 0.066), (0.034, 0.050, 0.092)])
    set_base(MA['局舎 | Verdigris sheet copper'], (0.045, 0.062, 0.105), Metallic=0.15, Roughness=0.55)
    set_base(MA['塔時計 | Mineral green timber'], (0.040, 0.058, 0.100))
    set_base(MA['Post office • Aged brass'], (0.80, 0.52, 0.14), Metallic=0.65, Roughness=0.34)
    # 屋根瓦：やや朱寄りに
    for i in range(1, 8):
        m = MA.get(f'Post office • Fired clay {i}')
        r = ramp_of(m) if m else None
        if r:
            for e in r.color_ramp.elements:
                c = e.color
                e.color = (min(1, c[0] * 1.18), c[1] * 1.35, c[2] * 1.1, 1)

    gran = MA['Post office • Foundation course 2']
    # 玄関の踏み石（絵の玄関階段に相当。扉の敷居 9 cm に合わせる）
    if 'OPUS 玄関 | Granite door step' not in OB:
        local_box('OPUS 玄関 | Granite door step', org, (-1.30, -1.00, 0.0), (1.30, 0.02, 0.09), gran)
        local_box('OPUS 玄関 | Granite door step 2', org, (-1.05, -0.62, 0.09), (1.05, 0.02, 0.18), gran)

    # 扉の右にもう一灯（絵では扉の両脇に灯）
    lan = OB['郵便局 | Brass wall lantern']
    if 'OPUS 玄関 | Brass wall lantern R' not in OB:
        o = lan.copy()
        o.name = 'OPUS 玄関 | Brass wall lantern R'
        link_like(o, lan)
        o.parent = org
        o.matrix_world = org.matrix_world @ Matrix.Scale(-1, 4, (1, 0, 0)) @ org.matrix_world.inverted() @ lan.matrix_world

    # 局の旗（朱の旗に紙色の封筒、金の竿）を右手前の角、二階の高さに
    if 'OPUS 局旗 | Postal banner' not in OB:
        make_banner(org)
    log('post office recoloured; door step, 2nd lantern, banner added')


def make_banner(org):
    red = MA.get('OPUS 局旗 | Vermilion wool') or MA['Post office • Postal vermilion'].copy()
    red.name = 'OPUS 局旗 | Vermilion wool'
    set_base(red, (0.60, 0.085, 0.040), Roughness=0.9)
    ivory = MA['Post office • Ivory enamel']
    gold = MA['Post office • Aged brass']
    navy = MA['Post office • Midnight blue timber']
    x0, y0, z0 = 2.98, 0.05, 4.92        # 角柱の位置（局所座標）
    # 竿：壁から +x へ 1.0 m
    pole = bpy.data.meshes.new('OPUS 局旗 | pole')
    bm = bmesh.new()
    bmesh.ops.create_cone(bm, cap_ends=True, segments=12, radius1=0.022, radius2=0.022, depth=1.0)
    bmesh.ops.rotate(bm, verts=bm.verts, cent=(0, 0, 0), matrix=Matrix.Rotation(math.pi / 2, 3, 'Y'))
    bmesh.ops.translate(bm, verts=bm.verts, vec=(x0 + 0.5, y0, z0))
    ball = bmesh.ops.create_uvsphere(bm, u_segments=12, v_segments=8, radius=0.05)
    bmesh.ops.translate(bm, verts=ball['verts'], vec=(x0 + 1.02, y0, z0))
    plate = bmesh.ops.create_cube(bm, size=1)
    for v in plate['verts']:
        v.co = Vector((x0 + 0.01 + v.co.x * 0.03, y0 + v.co.y * 0.16, z0 + v.co.z * 0.16))
    bm.to_mesh(pole)
    bm.free()
    pole.materials.append(gold)
    po = OB.new('OPUS 局旗 | Gilded pole', pole)
    org.users_collection[0].objects.link(po)
    po.parent = org
    po.pass_index = 1
    # 旗：x-z 面、下端は燕尾、少し波打たせる
    me = bpy.data.meshes.new('OPUS 局旗 | cloth')
    bm = bmesh.new()
    w, h, cut = 0.62, 1.15, 0.22
    xa, xb = x0 + 0.25, x0 + 0.25 + w
    cols, rows = 8, 12
    grid = []
    for j in range(rows + 1):
        row = []
        for i in range(cols + 1):
            u, t = i / cols, j / rows
            x = xa + u * w
            z = z0 - 0.03 - t * h
            # 燕尾：中央ほど上がる
            if t == 1.0:
                z += cut * (1 - abs(u - 0.5) * 2)
            y = y0 + 0.035 * math.sin(u * math.pi * 1.5 + t * 2.0) * (0.3 + t)
            row.append(bm.verts.new((x, y, z)))
        grid.append(row)
    for j in range(rows):
        for i in range(cols):
            bm.faces.new((grid[j][i], grid[j][i + 1], grid[j + 1][i + 1], grid[j + 1][i]))
    bm.to_mesh(me)
    bm.free()
    me.materials.append(red)
    fo = OB.new('OPUS 局旗 | Postal banner', me)
    org.users_collection[0].objects.link(fo)
    fo.parent = org
    fo.pass_index = 1
    sol = fo.modifiers.new('opus_thick', 'SOLIDIFY')
    sol.thickness = 0.012
    sol.offset = 0
    # 封筒の印（両面）
    env = bpy.data.meshes.new('OPUS 局旗 | envelope')
    bm = bmesh.new()
    cx, cz = (xa + xb) / 2, z0 - 0.48
    ew, eh = 0.36, 0.24
    for side in (-1, 1):
        yy = y0 + side * 0.03
        a = bm.verts.new((cx - ew / 2, yy, cz - eh / 2))
        b = bm.verts.new((cx + ew / 2, yy, cz - eh / 2))
        c = bm.verts.new((cx + ew / 2, yy, cz + eh / 2))
        d = bm.verts.new((cx - ew / 2, yy, cz + eh / 2))
        bm.faces.new((a, b, c, d))
    bm.to_mesh(env)
    bm.free()
    env.materials.append(ivory)
    eo = OB.new('OPUS 局旗 | Envelope mark', env)
    org.users_collection[0].objects.link(eo)
    eo.parent = org
    eo.pass_index = 1
    # 封筒のふた（紺の V 字）
    flap = bpy.data.meshes.new('OPUS 局旗 | flap')
    bm = bmesh.new()
    for side in (-1, 1):
        yy = y0 + side * 0.034
        t = 0.022
        pts = [(cx - ew / 2 + 0.02, cz + eh / 2 - 0.02), (cx, cz - 0.02), (cx + ew / 2 - 0.02, cz + eh / 2 - 0.02)]
        for (p, q) in ((pts[0], pts[1]), (pts[1], pts[2])):
            d = Vector((q[0] - p[0], q[1] - p[1])).normalized()
            nrm = Vector((-d.y, d.x)) * t / 2
            vs = [bm.verts.new((p[0] + nrm.x, yy, p[1] + nrm.y)), bm.verts.new((q[0] + nrm.x, yy, q[1] + nrm.y)),
                  bm.verts.new((q[0] - nrm.x, yy, q[1] - nrm.y)), bm.verts.new((p[0] - nrm.x, yy, p[1] - nrm.y))]
            bm.faces.new(vs)
    bm.to_mesh(flap)
    bm.free()
    flap.materials.append(navy)
    fl = OB.new('OPUS 局旗 | Envelope flap', flap)
    org.users_collection[0].objects.link(fl)
    fl.parent = org


# ================================================================ 2b. 局舎を石造りの外観へ（post-front.png）
WALL_Y, WALL_X, EAVE_Z, APEX_Z = 0.02, 2.90, 5.46, 7.55     # 既存の壁面・軒・妻の高さ（局所座標で実測）
REAR_Y = 6.40


def face_pt(face, u, d, v):
    """壁ごとの 2D 座標（u=横, v=高さ, d=壁からの出）→ 局舎の局所座標。"""
    if face == 'front':
        return Vector((u, WALL_Y - d, v))
    if face == 'right':
        return Vector((WALL_X + d, u, v))
    if face == 'left':
        return Vector((-WALL_X - d, -u, v))
    raise ValueError(face)


def prism(bm, face, poly, d0, d1):
    """壁面上の 2D 多角形（反時計回り）を d0〜d1 だけ押し出した柱体。"""
    back = [bm.verts.new(face_pt(face, u, d0, v)) for u, v in poly]
    front = [bm.verts.new(face_pt(face, u, d1, v)) for u, v in poly]
    n = len(poly)
    try:
        bm.faces.new(front)
        bm.faces.new(list(reversed(back)))
    except ValueError:
        pass
    for i in range(n):
        j = (i + 1) % n
        try:
            bm.faces.new((back[i], back[j], front[j], front[i]))
        except ValueError:
            pass


def rect(u0, v0, u1, v1):
    return [(u0, v0), (u1, v0), (u1, v1), (u0, v1)]


def arch_curve(cx, vb, w, hr, off=0.0, n=14):
    """半円アーチの開口の輪郭（左下→左肩→半円→右肩→右下）。off は外側への広がり。"""
    r = w / 2 + off
    pts = [(cx - r, vb), (cx - r, vb + hr)]
    for k in range(1, n):
        a = math.pi - math.pi * k / n
        pts.append((cx + r * math.cos(a), vb + hr + r * math.sin(a)))
    pts += [(cx + r, vb + hr), (cx + r, vb)]
    return pts


def ring(bm, face, cx, vb, w, hr, t, d0, d1, n=14):
    inner = arch_curve(cx, vb, w, hr, 0.0, n)
    outer = arch_curve(cx, vb, w, hr, t, n)
    for i in range(len(inner) - 1):
        prism(bm, face, [inner[i], outer[i], outer[i + 1], inner[i + 1]][::-1] if i < 0 else
              [inner[i], inner[i + 1], outer[i + 1], outer[i]], d0, d1)


class Parts:
    """材質ごとに 1 つのメッシュへまとめて作る。"""

    def __init__(self, org):
        self.org = org
        self.bms = {}

    def __getitem__(self, key):
        if key not in self.bms:
            self.bms[key] = bmesh.new()
        return self.bms[key]

    def build(self, mats):
        for key, bm in self.bms.items():
            name = f'OPUS 石造 | {key}'
            old = OB.get(name)
            if old:
                bpy.data.objects.remove(old)
            bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-5)
            bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
            me = bpy.data.meshes.new(name)
            bm.to_mesh(me)
            bm.free()
            me.materials.append(mats[key])
            o = OB.new(name, me)
            self.org.users_collection[0].objects.link(o)
            o.parent = self.org
            o.matrix_parent_inverse = Matrix()
            o.pass_index = 1
            if key in ('Clock rim', 'Scrolls', 'Swags', 'Sign bracket'):
                for p in me.polygons:
                    p.use_smooth = True


def ashlar(m, c1, c2, mortar, bw=0.46, rh=0.23, bump=0.35):
    """切石積み：局舎の局所座標（壁の横方向 = x+y、縦 = z）に Brick テクスチャ。"""
    t = m.node_tree
    for n in list(t.nodes):
        if n.type not in ('BSDF_PRINCIPLED', 'OUTPUT_MATERIAL') and not n.name.startswith('OPUS fog'):
            t.nodes.remove(n)
    N, L = nodes(t)
    p = principled(m)
    p.inputs['Roughness'].default_value = 0.88
    tc = N('ShaderNodeTexCoord', (-1400, 0))
    sep = N('ShaderNodeSeparateXYZ', (-1200, 0))
    L(tc.outputs['Object'], sep.inputs[0])
    u = mth(N, L, 'ADD', sep.outputs['X'], sep.outputs['Y'], (-1000, 0))
    vec = N('ShaderNodeCombineXYZ', (-850, 0))
    L(u, vec.inputs['X'])
    L(sep.outputs['Z'], vec.inputs['Y'])
    br = N('ShaderNodeTexBrick', (-650, 0), Scale=1.0, **{'Mortar Size': 0.018, 'Mortar Smooth': 0.3,
                                                          'Brick Width': bw, 'Row Height': rh})
    br.offset = 0.5
    br.inputs['Color1'].default_value = (*c1, 1)
    br.inputs['Color2'].default_value = (*c2, 1)
    br.inputs['Mortar'].default_value = (*mortar, 1)
    L(vec.outputs[0], br.inputs['Vector'])
    noi = N('ShaderNodeTexNoise', (-650, -300), Scale=6.0, Detail=6.0, Roughness=0.6)
    L(tc.outputs['Object'], noi.inputs['Vector'])
    vr = N('ShaderNodeMapRange', (-450, -300), **{'To Min': 0.86, 'To Max': 1.08})
    L(noi.outputs['Fac'], vr.inputs['Value'])
    mul = N('ShaderNodeMix', (-250, 0), _data_type='RGBA', _blend_type='MULTIPLY')
    mul.inputs['Factor'].default_value = 1.0
    L(br.outputs['Color'], mul.inputs[6])
    L(vr.outputs[0], mul.inputs[7])
    L(mul.outputs[2], p.inputs['Base Color'])
    inv = mth(N, L, 'SUBTRACT', 1.0, br.outputs['Fac'], (-450, -550))
    hb = mth(N, L, 'ADD', inv, mth(N, L, 'MULTIPLY', noi.outputs['Fac'], 0.25, (-450, -700)), (-300, -600))
    b = N('ShaderNodeBump', (-150, -500), Strength=bump, Distance=0.015)
    L(hb, b.inputs['Height'])
    L(b.outputs['Normal'], p.inputs['Normal'])


def mat_new(name, col, rough=0.8, metal=0.0, emit=None, emit_strength=0.0):
    m = MA.get(name) or MA.new(name)
    m.use_nodes = True
    p = principled(m)
    p.inputs['Base Color'].default_value = (*col, 1)
    p.inputs['Roughness'].default_value = rough
    p.inputs['Metallic'].default_value = metal
    if emit:
        p.inputs['Emission Color'].default_value = (*emit, 1)
        p.inputs['Emission Strength'].default_value = emit_strength
    return m


def torus(bm, face, cu, cv, R, r, d, seg=28, rseg=8, sx=1.0, sv=1.0, a0=0.0, a1=2 * math.pi):
    """壁面に平行な輪（楕円・部分弧も可）。"""
    closed = abs(a1 - a0 - 2 * math.pi) < 1e-6
    n = seg if closed else seg + 1
    rows = []
    for i in range(n):
        a = a0 + (a1 - a0) * i / seg
        c = Vector((cu + R * sx * math.cos(a), cv + R * sv * math.sin(a)))
        dirv = Vector((math.cos(a), math.sin(a)))
        row = []
        for j in range(rseg):
            b = 2 * math.pi * j / rseg
            uv = c + dirv * (r * math.cos(b))
            row.append(bm.verts.new(face_pt(face, uv.x, d + r * math.sin(b), uv.y)))
        rows.append(row)
    for i in range(n if closed else n - 1):
        A, B = rows[i], rows[(i + 1) % n]
        for j in range(rseg):
            k = (j + 1) % rseg
            bm.faces.new((A[j], B[j], B[k], A[k]))


def tube(bm, pts, r, rseg=8, flat=1.0):
    """3D 点列に沿った管（垂れ幕は flat で平たく）。"""
    rows = []
    for i, p in enumerate(pts):
        tng = (pts[min(i + 1, len(pts) - 1)] - pts[max(i - 1, 0)]).normalized()
        side = tng.cross(Vector((0, 1, 0)))
        if side.length < 1e-4:
            side = Vector((1, 0, 0))
        side.normalize()
        up = side.cross(tng).normalized()
        row = []
        for j in range(rseg):
            b = 2 * math.pi * j / rseg
            row.append(bm.verts.new(p + side * (r * math.cos(b)) + up * (r * flat * math.sin(b))))
        rows.append(row)
    for i in range(len(rows) - 1):
        for j in range(rseg):
            k = (j + 1) % rseg
            bm.faces.new((rows[i][j], rows[i + 1][j], rows[i + 1][k], rows[i][k]))


def window(P, face, cx, vb, w, hr, glass, awning=False, t=0.13, mull=True):
    ring(P['Arch surrounds'], face, cx, vb, w, hr, t, 0.0, 0.10)
    P[glass] and prism(P[glass], face, arch_curve(cx, vb, w, hr, 0.0)[:-1], 0.0, 0.012)
    # 窓の格子（紺）
    if mull:
        top = vb + hr + w / 2
        prism(P['Glazing bars'], face, rect(cx - 0.022, vb, cx + 0.022, top - 0.01), 0.012, 0.04)
        for k in (1, 2):
            vv = vb + hr * k / 3
            prism(P['Glazing bars'], face, rect(cx - w / 2, vv - 0.02, cx + w / 2, vv + 0.02), 0.012, 0.04)
        prism(P['Glazing bars'], face, rect(cx - w / 2, vb + hr - 0.02, cx + w / 2, vb + hr + 0.02), 0.012, 0.04)
    # 要石・迫元（金）と窓台
    kt = vb + hr + w / 2 + t
    prism(P['Gilded trim'], face, [(cx - 0.08, kt - t - 0.02), (cx + 0.08, kt - t - 0.02), (cx + 0.11, kt + 0.10),
                                   (cx - 0.11, kt + 0.10)], 0.0, 0.13)
    for sgn in (-1, 1):
        uu = cx + sgn * (w / 2 + t / 2)
        prism(P['Gilded trim'], face, rect(uu - t / 2 - 0.02, vb + hr - 0.07, uu + t / 2 + 0.02, vb + hr), 0.0, 0.12)
    prism(P['Dressed limestone'], face, rect(cx - w / 2 - t - 0.05, vb - 0.10, cx + w / 2 + t + 0.05, vb), 0.0, 0.14)
    if awning:
        # 絵の白い日よけ（縁が波形）
        bm = P['Awning canvas']
        v0, v1 = vb + hr + 0.05, vb + hr - 0.22
        u0, u1 = cx - w / 2 + 0.01, cx + w / 2 - 0.01
        a = [bm.verts.new(face_pt(face, u0, 0.012, v0)), bm.verts.new(face_pt(face, u1, 0.012, v0)),
             bm.verts.new(face_pt(face, u1, 0.24, v1 + 0.08)), bm.verts.new(face_pt(face, u0, 0.24, v1 + 0.08))]
        bm.faces.new(a)
        edge = []
        k = 5
        for i in range(k * 6 + 1):
            uu = u0 + (u1 - u0) * i / (k * 6)
            ph = (i % 6) / 6
            edge.append((uu, v1 + 0.05 * (1 - math.sin(ph * math.pi))))
        poly = [(u0, v1 + 0.08)] + edge[::-1][::-1] + [(u1, v1 + 0.08)]
        poly = [(u0, v1 + 0.08), (u1, v1 + 0.08)] + edge[::-1]
        prism(bm, face, [(uu, vv) for uu, vv in reversed(poly)], 0.235, 0.245)


def stone_post_office():
    org = OB['局舎 | Building origin']
    # --- 木組みの外観を外す（形はスクリプトで作り直す。元の物体は残して非表示）
    hide = ['郵便局 | Limewashed walls and granite footings', '郵便局 | Half-timbered structure and gable truss',
            '郵便局 | Double doors and fanlight', '郵便局 | Amber windows and painted sashes',
            '局舎 | Folded copper porch roof and timber brackets', '局舎 | Carved porch knees and brass entrance hardware',
            '局舎二階 | 海辺の事務室 | Upper walls, rebated casements', '局舎二階 | 三面出窓 | Harbour desk oriel, glazing and frames',
            '局舎二階 | 軒の扁額 | Lacquered entrance nameboard', '局舎 | 霧晴れ郵便局・金文字',
            '局舎 | Ridge saddle and clock cabinet', '局舎 | Seamed copper clock roof and brass finial',
            '局舎 | Four porcelain dials, chapter marks and blued hands',
            '袖看板 | Double-sided vermilion enamel', '袖看板 | Ivory postal marks', '袖看板 | Blackened bronze bracket']
    n_hidden = 0
    for o in OB:
        if any(o.name.startswith(h[:30]) for h in hide):
            o.hide_render = o.hide_viewport = True
            n_hidden += 1

    # --- 材質
    stone = MA['Post office • Limewash']
    ashlar(stone, (0.82, 0.74, 0.58), (0.68, 0.61, 0.48), (0.55, 0.51, 0.44))
    plinth = MA.get('OPUS 石造 | Blue-grey plinth') or MA.new('OPUS 石造 | Blue-grey plinth')
    plinth.use_nodes = True
    ashlar(plinth, (0.27, 0.31, 0.37), (0.22, 0.26, 0.32), (0.15, 0.16, 0.18), bw=0.55, rh=0.22, bump=0.5)
    lime = mat_new('OPUS 石造 | Dressed limestone', (0.86, 0.80, 0.68), 0.8)
    weather(lime, var=0.10, scale=5.0, bump=0.15)
    mats = {
        'Walls': stone, 'Plinth': plinth, 'Dressed limestone': lime, 'Arch surrounds': lime, 'Pilasters': lime,
        'Gilded trim': MA['Post office • Aged brass'], 'Glazing bars': MA['Post office • Midnight blue timber'],
        'Lit glass': MA['Post office • Honey glass 1'],
        'Night glass': mat_new('OPUS 石造 | Night-blue glass', (0.035, 0.055, 0.11), 0.12, 0.0),
        'Door leaves': MA['Post office • Midnight blue timber'],
        'Awning canvas': mat_new('OPUS 石造 | Awning canvas', (0.84, 0.79, 0.67), 0.9),
        'Skirt roof': MA['Post office • Fired clay 3'],
        'Clock face': MA['塔時計 | Porcelain dial'], 'Clock rim': MA['Post office • Aged brass'],
        'Clock hands': MA['Post office • Midnight blue timber'], 'Scrolls': MA['Post office • Aged brass'],
        'Swags': MA.get('OPUS 局旗 | Vermilion wool'), 'Sign face': MA['Post office • Ivory enamel'],
        'Sign bracket': MA['Post office • Aged brass'], 'Sign envelope': MA['Post office • Midnight blue timber'],
    }
    P = Parts(org)

    # --- 壁：石積みの箱＋前後の妻（屋根の下に収まる高さ）
    bm = P['Walls']
    for face_y, rev in ((WALL_Y, False), (REAR_Y, True)):
        pass
    pent = [(-WALL_X, 0.0), (WALL_X, 0.0), (WALL_X, EAVE_Z), (0.0, APEX_Z), (-WALL_X, EAVE_Z)]
    f = [bm.verts.new((u, WALL_Y, v)) for u, v in pent]
    b = [bm.verts.new((u, REAR_Y, v)) for u, v in pent]
    bm.faces.new(list(reversed(f)))
    bm.faces.new(b)
    for i in range(5):
        j = (i + 1) % 5
        bm.faces.new((f[i], f[j], b[j], b[i]))
    # 腰石（青灰）
    prism(P['Plinth'], 'front', rect(-WALL_X - 0.06, 0.0, WALL_X + 0.06, 0.45), -0.02, 0.05)
    for side in ('right', 'left'):
        prism(P['Plinth'], side, rect(-0.05 if side == 'right' else -REAR_Y - 0.05, 0.0,
                                      REAR_Y + 0.05 if side == 'right' else 0.05, 0.45), -0.02, 0.05)
    # 隅の付け柱（切石）と軒の蛇腹、持ち送り（金）
    for sgn in (-1, 1):
        prism(P['Pilasters'], 'front', rect(sgn * WALL_X - 0.30 if sgn > 0 else -WALL_X - 0.05, 0.45,
                                            WALL_X + 0.05 if sgn > 0 else -WALL_X + 0.30, EAVE_Z - 0.16), 0.0, 0.07)
    prism(P['Dressed limestone'], 'front', rect(-WALL_X - 0.08, EAVE_Z - 0.16, WALL_X + 0.08, EAVE_Z + 0.02), 0.0, 0.13)
    # 側面の隅柱（手前と奥）と軒下の帯
    for side, sg in (('right', 1), ('left', -1)):
        for y0_, y1_ in ((-0.05, 0.30), (REAR_Y - 0.30, REAR_Y + 0.05)):
            a, b = sorted((sg * y0_, sg * y1_))
            prism(P['Pilasters'], side, rect(a, 0.45, b, EAVE_Z - 0.16), 0.0, 0.07)
        a, b = sorted((sg * -0.05, sg * (REAR_Y + 0.05)))
        prism(P['Dressed limestone'], side, rect(a, EAVE_Z - 0.16, b, EAVE_Z - 0.02), 0.0, 0.10)
        prism(P['Dressed limestone'], side, rect(a, 3.35, b, 3.47), 0.0, 0.08)
    for uu in (-2.2, -1.1, 0.0, 1.1, 2.2):
        prism(P['Gilded trim'], 'front', rect(uu - 0.06, EAVE_Z - 0.34, uu + 0.06, EAVE_Z - 0.16), 0.0, 0.11)

    # --- 1 階：中央の両開きアーチ扉と左右のアーチ窓（日よけ付き）
    DV, DW, DH = 0.18, 1.40, 1.77          # 扉の下端・幅・肩の高さ → 頂部 2.65
    ring(P['Arch surrounds'], 'front', 0.0, DV, DW, DH, 0.17, 0.0, 0.11)
    torus(P['Gilded trim'], 'front', 0.0, DV + DH, DW / 2 + 0.02, 0.025, 0.11, seg=24, a0=0.0, a1=math.pi)
    prism(P['Door leaves'], 'front', rect(-DW / 2, DV, DW / 2, DV + DH), -0.01, 0.025)
    prism(P['Lit glass'], 'front', arch_curve(0.0, DV + DH - 0.001, DW, 0.0)[1:-1], 0.0, 0.012)
    prism(P['Glazing bars'], 'front', rect(-DW / 2, DV + DH - 0.03, DW / 2, DV + DH + 0.03), 0.01, 0.045)
    for k in range(1, 6):          # 欄間の放射状の桟
        a = math.pi * k / 6
        cu, cv = 0.0, DV + DH
        ex, ev = cu + (DW / 2) * math.cos(a), cv + (DW / 2) * math.sin(a)
        nx, nv = -math.sin(a) * 0.018, math.cos(a) * 0.018
        prism(P['Glazing bars'], 'front', [(cu + nx, cv + nv), (cu - nx, cv - nv), (ex - nx, ev - nv), (ex + nx, ev + nv)][::-1], 0.012, 0.04)
    prism(P['Glazing bars'], 'front', rect(-0.02, DV, 0.02, DV + DH), 0.025, 0.05)
    for sgn in (-1, 1):            # 扉の鏡板と金の把手
        for v0, v1 in ((DV + 0.12, DV + 0.80), (DV + 0.92, DV + DH - 0.10)):
            prism(P['Glazing bars'], 'front', rect(sgn * 0.08 if sgn > 0 else -DW / 2 + 0.09, v0,
                                                    DW / 2 - 0.09 if sgn > 0 else -0.08, v1), 0.025, 0.04)
        prism(P['Gilded trim'], 'front', rect(sgn * 0.05 - 0.025, DV + 0.95, sgn * 0.05 + 0.025, DV + 1.12), 0.025, 0.07)
    for cx in (-1.95, 1.95):
        window(P, 'front', cx, 0.80, 0.95, 1.05, 'Lit glass', awning=True)

    # --- 1 階と 2 階の間の朱瓦の庇（絵の下屋根）
    bm = P['Skirt roof']
    nu, nd = 96, 6
    D0, D1, Z0, Z1 = 0.0, 0.88, 3.48, 3.06
    grid = []
    for j in range(nd + 1):
        row = []
        for i in range(nu + 1):
            u = -WALL_X - 0.15 + (2 * WALL_X + 0.30) * i / nu
            d = D0 + (D1 - D0) * j / nd
            v = Z0 + (Z1 - Z0) * j / nd + 0.035 * abs(math.sin(math.pi * u / 0.24))
            row.append(bm.verts.new(face_pt('front', u, d, v)))
        grid.append(row)
    for j in range(nd):
        for i in range(nu):
            bm.faces.new((grid[j][i], grid[j + 1][i], grid[j + 1][i + 1], grid[j][i + 1]))
    prism(P['Gilded trim'], 'front', rect(-WALL_X - 0.15, Z1 - 0.13, WALL_X + 0.15, Z1 - 0.02), D1 - 0.06, D1 + 0.01)
    for uu in (-2.7, -1.3, 1.3, 2.7):
        prism(P['Gilded trim'], 'front', [(uu - 0.05, Z1 - 0.40), (uu + 0.05, Z1 - 0.40), (uu + 0.05, Z1 - 0.05),
                                          (uu - 0.05, Z1 - 0.05)], 0.0, 0.10)
        prism(P['Gilded trim'], 'front', rect(uu - 0.05, Z1 - 0.13, uu + 0.05, Z1 - 0.02), 0.0, D1 - 0.05)

    # --- 2 階：アーチ窓 3 つ（中央を大きく）
    window(P, 'front', 0.0, 3.80, 0.95, 0.65, 'Night glass')
    for cx in (-1.75, 1.75):
        window(P, 'front', cx, 3.85, 0.75, 0.62, 'Night glass')
    # 側面のアーチ窓（右は仕分け室の下屋を避けて 2 階のみ＋手前 1 階）
    # face_pt の 'left' は u = -y（外から見て左→右）なので y 座標を負にして渡す
    for side, sg in (('right', 1), ('left', -1)):
        for cy in (1.05, 2.95, 4.85):
            window(P, side, sg * cy, 3.95, 0.70, 0.52, 'Night glass')
        window(P, side, sg * 0.95, 0.85, 0.70, 0.95, 'Lit glass')
    window(P, 'left', -2.60, 0.85, 0.70, 0.95, 'Lit glass')

    # --- 妻の丸い時計（飾り輪・渦巻き・朱の垂れ幕）
    CV = 6.30
    prism(P['Dressed limestone'], 'front', [(0.60 * math.cos(a), CV + 0.60 * math.sin(a))
                                            for a in [2 * math.pi * k / 36 for k in range(36)]], 0.0, 0.07)
    prism(P['Clock face'], 'front', [(0.44 * math.cos(a), CV + 0.44 * math.sin(a))
                                     for a in [2 * math.pi * k / 36 for k in range(36)]], 0.07, 0.09)
    torus(P['Clock rim'], 'front', 0.0, CV, 0.46, 0.04, 0.10, seg=40)
    torus(P['Clock rim'], 'front', 0.0, CV, 0.60, 0.025, 0.07, seg=40)
    for k in range(12):
        a = math.pi / 2 - 2 * math.pi * k / 12
        cu, cv = 0.36 * math.cos(a), CV + 0.36 * math.sin(a)
        prism(P['Clock hands'], 'front', rect(cu - 0.018, cv - 0.018, cu + 0.018, cv + 0.018), 0.09, 0.10)
    for ang, ln, wd in ((math.radians(150), 0.22, 0.03), (math.radians(30), 0.33, 0.022)):   # 10 時 10 分
        ex, ev = ln * math.cos(ang), CV + ln * math.sin(ang)
        nx, nv = -math.sin(ang) * wd, math.cos(ang) * wd
        prism(P['Clock hands'], 'front', [(nx, CV + nv), (-nx, CV - nv), (ex - nx * 0.4, ev - nv * 0.4),
                                          (ex + nx * 0.4, ev + nv * 0.4)][::-1], 0.10, 0.115)
    for sgn in (-1, 1):
        torus(P['Scrolls'], 'front', sgn * 0.86, CV + 0.02, 0.15, 0.028, 0.06, seg=20,
              a0=0.0 if sgn > 0 else math.pi * 0.0, a1=2 * math.pi * 0.85)
        torus(P['Scrolls'], 'front', sgn * 0.86, CV + 0.02, 0.07, 0.022, 0.06, seg=14)
        # 垂れ幕：時計の両脇から軒の上へ弧を描いて垂れる
        pts = []
        for i in range(17):
            t = i / 16
            uu = sgn * (0.52 + 1.05 * t)
            vv = 5.86 - 0.32 * math.sin(math.pi * t)
            pts.append(face_pt('front', uu, 0.08, vv))
        tube(P['Swags'], pts, 0.10, rseg=10, flat=0.35)
        for uu in (sgn * 0.52, sgn * 1.57):
            prism(P['Awning canvas'], 'front', rect(uu - 0.035, 5.50, uu + 0.035, 5.86), 0.06, 0.12)
    prism(P['Gilded trim'], 'front', rect(-0.09, APEX_Z + 0.02, 0.09, APEX_Z + 0.28), 0.25, 0.43)

    # --- 右手の封筒の吊り看板（金の渦巻き金具・鎖）
    bm = P['Sign bracket']
    y0 = WALL_Y - 0.18
    tube(bm, [Vector((WALL_X - 0.02 + 1.10 * t, y0, 4.86)) for t in (0, 0.5, 1)], 0.028)
    tube(bm, [Vector((WALL_X - 0.02 + 0.70 * t, y0, 4.40 + 0.46 * t ** 0.7)) for t in (0, 0.25, 0.5, 0.75, 1)], 0.022)
    sb = P['Sign bracket']
    for cxs, rr in ((WALL_X + 0.30, 0.16), (WALL_X + 0.30, 0.08)):
        rows = []
    torus_bm = P['Scrolls']
    for (cu, cv, R) in ((3.20, 4.66, 0.15), (3.20, 4.66, 0.07), (4.02, 4.94, 0.09)):
        verts = []
        for i in range(25):
            a = 2 * math.pi * 0.85 * i / 24
            verts.append(Vector((cu + R * math.cos(a), y0, cv + R * math.sin(a))))
        tube(torus_bm, verts, 0.02)
    prism(P['Sign bracket'], 'front', rect(WALL_X - 0.04, 4.30, WALL_X + 0.04, 4.98), 0.10, 0.26)
    SX, SZ = 3.48, 4.18
    for cu in (SX - 0.28, SX + 0.28):
        tube(P['Sign bracket'], [Vector((cu, y0, 4.85)), Vector((cu, y0, SZ + 0.29))], 0.012, rseg=6)
    ell = [(SX + 0.44 * math.cos(a), SZ + 0.31 * math.sin(a)) for a in [2 * math.pi * k / 40 for k in range(40)]]
    prism(P['Sign face'], 'front', ell, 0.18 - 0.03, 0.18 + 0.03)
    torus(P['Sign bracket'], 'front', SX, SZ, 0.44, 0.03, 0.18, seg=40, sv=0.31 / 0.44)
    for dd, sgn in ((0.18 - 0.032, -1), (0.18 + 0.032, 1)):
        d0, d1 = (dd, dd + 0.006) if sgn > 0 else (dd - 0.006, dd)
        prism(P['Sign envelope'], 'front', rect(SX - 0.21, SZ - 0.14, SX + 0.21, SZ + 0.14), d0, d1)
        prism(P['Sign face'], 'front', rect(SX - 0.18, SZ - 0.11, SX + 0.18, SZ + 0.11),
              d1 if sgn > 0 else d0 - 0.004, (d1 + 0.004) if sgn > 0 else d0)
        for (pu, pv), (qu, qv) in (((SX - 0.17, SZ + 0.10), (SX, SZ - 0.02)), ((SX, SZ - 0.02), (SX + 0.17, SZ + 0.10))):
            dv = Vector((qu - pu, qv - pv)).normalized()
            nn = Vector((-dv.y, dv.x)) * 0.014
            e0, e1 = (d1 + 0.004, d1 + 0.008) if sgn > 0 else (d0 - 0.008, d0 - 0.004)
            prism(P['Sign envelope'], 'front', [(pu + nn.x, pv + nn.y), (pu - nn.x, pv - nn.y),
                                                (qu - nn.x, qv - nn.y), (qu + nn.x, qv + nn.y)][::-1], e0, e1)
    P.build(mats)

    # --- 局旗は絵と同じ左手へ（x を鏡映）
    for o in OB:
        if o.name.startswith('OPUS 局旗') and not o.get('opus_mirrored'):
            # 親（局舎原点）の局所空間で鏡映（matrix_world は作成直後で未更新のため使わない）
            o.matrix_basis = Matrix.Scale(-1, 4, (1, 0, 0)) @ o.matrix_basis
            o['opus_mirrored'] = True
    log(f'post office rebuilt as stone: hid {n_hidden} half-timber parts; arched door/windows, '
        f'skirt roof, gable clock, swags, envelope sign, banner moved left')


# ================================================================ 3. 空・霧・光
SUN_DIR = Vector((-0.80, -0.42, 0.40)).normalized()     # 太陽の方向（左手前・高度約 24°）


def light():
    sun = OB['夕陽 | Warm coastal sun']
    sun.rotation_euler = (-SUN_DIR).to_track_quat('-Z', 'Y').to_euler()
    sun.data.energy = 3.3
    sun.data.color = (1.0, 0.87, 0.72)
    sun.data.angle = math_radians(4.0)
    e = S.eevee
    e.shadow_ray_count = 2
    e.shadow_step_count = 8
    e.use_fast_gi = True
    e.fast_gi_method = 'GLOBAL_ILLUMINATION'
    e.use_raytracing = True
    e.ray_tracing_method = 'SCREEN'
    log('sun lowered to ~24deg, warm, softer')


def sky():
    w = S.world
    t = w.node_tree
    t.nodes.clear()
    N, L = nodes(t)
    tc = N('ShaderNodeTexCoord', (-1600, 0))
    nrm = N('ShaderNodeVectorMath', (-1400, 0), _operation='NORMALIZE')
    L(tc.outputs['Generated'], nrm.inputs[0])
    sep = N('ShaderNodeSeparateXYZ', (-1200, 0))
    L(nrm.outputs[0], sep.inputs[0])
    z = sep.outputs['Z']
    # 高さのグラデーション（霧色の地平 → 淡い紺の天頂）
    mr = N('ShaderNodeMapRange', (-1000, 300), **{'From Min': -0.05, 'From Max': 0.75})
    L(z, mr.inputs['Value'])
    ramp = N('ShaderNodeValToRGB', (-800, 300))
    el = ramp.color_ramp.elements
    el[0].position, el[0].color = 0.0, (0.60, 0.63, 0.66, 1)
    el[1].position, el[1].color = 1.0, (0.36, 0.45, 0.57, 1)
    for pos, c in ((0.07, (0.70, 0.71, 0.71)), (0.16, (0.64, 0.67, 0.70)), (0.45, (0.47, 0.55, 0.64))):
        e = ramp.color_ramp.elements.new(pos)
        e.color = (*c, 1)
    L(mr.outputs[0], ramp.inputs[0])
    # 太陽まわりの明るみ
    dot = N('ShaderNodeVectorMath', (-1200, -300), _operation='DOT_PRODUCT')
    L(nrm.outputs[0], dot.inputs[0])
    dot.inputs[1].default_value = SUN_DIR
    g1 = mth(N, L, 'MAXIMUM', dot.outputs['Value'], 0.0, (-1000, -300))
    g2 = mth(N, L, 'POWER', g1, 9.0, (-850, -300))
    g3 = mth(N, L, 'MULTIPLY', g2, 0.55, (-700, -300))
    glowc = N('ShaderNodeMix', (-500, 200), _data_type='RGBA', _blend_type='ADD')
    L(g3, glowc.inputs['Factor'])
    L(ramp.outputs[0], glowc.inputs[6])
    glowc.inputs[7].default_value = (0.42, 0.33, 0.22, 1)
    # 淡い層雲：方向を雲の平面へ投影して fBm
    zoff = mth(N, L, 'ADD', z, 0.10, (-1000, -600))
    inv = mth(N, L, 'DIVIDE', 1.0, zoff, (-850, -600))
    proj = N('ShaderNodeVectorMath', (-700, -600), _operation='SCALE')
    L(nrm.outputs[0], proj.inputs[0])
    L(inv, proj.inputs['Scale'])
    stretch = N('ShaderNodeVectorMath', (-550, -600), _operation='MULTIPLY')
    L(proj.outputs[0], stretch.inputs[0])
    stretch.inputs[1].default_value = (0.42, 1.0, 0.0)
    noi = N('ShaderNodeTexNoise', (-400, -600), Scale=0.85, Detail=9.0, Roughness=0.58, Distortion=0.35)
    noi.noise_dimensions = '4D'
    noi.inputs['W'].default_value = 3.7
    L(stretch.outputs[0], noi.inputs['Vector'])
    cm = N('ShaderNodeMapRange', (-200, -600), **{'From Min': 0.46, 'From Max': 0.60})
    cm.interpolation_type = 'SMOOTHSTEP'
    L(noi.outputs['Fac'], cm.inputs['Value'])
    hz = N('ShaderNodeMapRange', (-200, -850), **{'From Min': 0.015, 'From Max': 0.20})
    hz.interpolation_type = 'SMOOTHSTEP'
    L(z, hz.inputs['Value'])
    hi = N('ShaderNodeMapRange', (-200, -1050), **{'From Min': 0.30, 'From Max': 0.85, 'To Min': 1.0, 'To Max': 0.35})
    hi.interpolation_type = 'SMOOTHSTEP'
    L(z, hi.inputs['Value'])
    cov = mth(N, L, 'MULTIPLY', cm.outputs[0], hz.outputs[0], (0, -700))
    cov = mth(N, L, 'MULTIPLY', cov, hi.outputs[0], (75, -700))
    cov = mth(N, L, 'MULTIPLY', cov, 0.85, (150, -700))
    # 雲の色：陰は青灰、日向は紙色
    shade = N('ShaderNodeMapRange', (-200, -400), **{'From Min': 0.47, 'From Max': 0.64})
    L(noi.outputs['Fac'], shade.inputs['Value'])
    ccol = N('ShaderNodeMix', (0, -400), _data_type='RGBA')
    L(shade.outputs[0], ccol.inputs['Factor'])
    ccol.inputs[6].default_value = (0.62, 0.65, 0.70, 1)
    ccol.inputs[7].default_value = (0.92, 0.90, 0.85, 1)
    skyc = N('ShaderNodeMix', (300, 0), _data_type='RGBA')
    L(cov, skyc.inputs['Factor'])
    L(glowc.outputs[2], skyc.inputs[6])
    L(ccol.outputs[2], skyc.inputs[7])
    bg_cam = N('ShaderNodeBackground', (500, 100), Strength=1.0)
    L(skyc.outputs[2], bg_cam.inputs['Color'])
    bg_light = N('ShaderNodeBackground', (500, -100), Strength=0.85)
    L(glowc.outputs[2], bg_light.inputs['Color'])
    lp = N('ShaderNodeLightPath', (300, 300))
    mix = N('ShaderNodeMixShader', (700, 0))
    L(lp.outputs['Is Camera Ray'], mix.inputs['Fac'])
    L(bg_light.outputs[0], mix.inputs[1])
    L(bg_cam.outputs[0], mix.inputs[2])
    out = N('ShaderNodeOutputWorld', (900, 0))
    L(mix.outputs[0], out.inputs['Surface'])
    log('procedural misty sky (gradient + stratus + sun glow) replaces broken panorama')


FOG = dict(dist=170.0, top=3.0, bottom=-2.4, bank=75.0, near0=5.0, near1=22.0, fmax=0.86)


def fog_group():
    g = bpy.data.node_groups.get('OPUS 霧 | Aerial fog')
    if g:
        bpy.data.node_groups.remove(g)
    g = bpy.data.node_groups.new('OPUS 霧 | Aerial fog', 'ShaderNodeTree')
    g.interface.new_socket('Fog', in_out='OUTPUT', socket_type='NodeSocketFloat')
    N, L = nodes(g)
    cam = N('ShaderNodeCameraData', (-900, 0))
    geo = N('ShaderNodeNewGeometry', (-900, -300))
    d = cam.outputs['View Distance']
    sep = N('ShaderNodeSeparateXYZ', (-700, -300))
    L(geo.outputs['Position'], sep.inputs[0])
    # 距離の霧
    a = mth(N, L, 'MULTIPLY', d, -1.0 / FOG['dist'], (-500, 100))
    # 低い霧の帯：海面〜岸の高さほど濃い
    h = N('ShaderNodeMapRange', (-500, -300), **{'From Min': FOG['top'], 'From Max': FOG['bottom']})
    h.interpolation_type = 'SMOOTHSTEP'
    L(sep.outputs['Z'], h.inputs['Value'])
    b = mth(N, L, 'MULTIPLY', d, -1.0 / FOG['bank'], (-300, -200))
    b = mth(N, L, 'MULTIPLY', b, h.outputs[0], (-150, -200))
    s = mth(N, L, 'ADD', a, b, (0, 0))
    tr = mth(N, L, 'EXPONENT', s, None, (150, 0))
    f = mth(N, L, 'SUBTRACT', 1.0, tr, (300, 0))
    near = N('ShaderNodeMapRange', (150, -250), **{'From Min': FOG['near0'], 'From Max': FOG['near1']})
    near.interpolation_type = 'SMOOTHSTEP'
    L(d, near.inputs['Value'])
    f = mth(N, L, 'MULTIPLY', f, near.outputs[0], (450, 0))
    f = mth(N, L, 'MULTIPLY', f, FOG['fmax'], (600, 0), clamp=True)
    out = N('NodeGroupOutput', (800, 0))
    L(f, out.inputs[0])
    return g


def fog():
    g = fog_group()
    for nm in ('fog', 'line'):
        if nm not in [a.name for a in VL.aovs]:
            a = VL.aovs.add()
            a.name = nm
            a.type = 'VALUE'
    n_mat = 0
    for m in MA:
        if not m.use_nodes or not m.node_tree:
            continue
        t = m.node_tree
        for n in [n for n in t.nodes if n.name.startswith('OPUS fog')]:
            t.nodes.remove(n)
        gn = t.nodes.new('ShaderNodeGroup')
        gn.node_tree = g
        gn.name = 'OPUS fog group'
        gn.location = (-600, -900)
        ao = t.nodes.new('ShaderNodeOutputAOV')
        ao.name = 'OPUS fog aov'
        ao.aov_name = 'fog'
        ao.location = (-300, -900)
        t.links.new(gn.outputs[0], ao.inputs['Value'])
        # 輪郭線マスク：元の ID Mask（Object Index パス）は EEVEE では全画面 1 になり、
        # 敷石の目地や草まで線が乗って黒い点列になっていた → pass_index==1 を AOV で書く
        oi = t.nodes.new('ShaderNodeObjectInfo')
        oi.name = 'OPUS fog objinfo'
        oi.location = (-600, -1100)
        cmp_ = t.nodes.new('ShaderNodeMath')
        cmp_.name = 'OPUS fog linecmp'
        cmp_.operation = 'COMPARE'
        cmp_.inputs[1].default_value = 1.0
        cmp_.inputs[2].default_value = 0.5
        cmp_.location = (-450, -1100)
        t.links.new(oi.outputs['Object Index'], cmp_.inputs[0])
        la = t.nodes.new('ShaderNodeOutputAOV')
        la.name = 'OPUS fog lineaov'
        la.aov_name = 'line'
        la.location = (-300, -1100)
        t.links.new(cmp_.outputs[0], la.inputs['Value'])
        n_mat += 1
    # コンポジター：輪郭線 → 霧 → 色調 → 紙肌（題字は HTML 側で重ねるので 0 のまま）
    ct = S.compositing_node_group
    nd = ct.nodes
    rl = nd['Render Layers']
    fogmix = nd['Mix']
    outline = nd['Mix.002']
    for l in list(ct.links):
        if l.to_node in (fogmix, outline) or l.from_node.name in ('Set Alpha', 'Set Alpha.001', 'Math.002'):
            ct.links.remove(l)
    for l in list(ct.links):
        if l.to_node.name == 'RGB Curves':
            ct.links.remove(l)
    ct.links.new(rl.outputs['Image'], outline.inputs[6])
    ct.links.new(nd['Math.005'].outputs[0], outline.inputs['Factor'])
    for l in list(ct.links):
        if l.from_node.name == 'ID Mask':
            ct.links.remove(l)
    ct.links.new(rl.outputs['line'], nd['Math.004'].inputs[1])
    ct.links.new(outline.outputs[2], fogmix.inputs[6])
    ct.links.new(rl.outputs['fog'], fogmix.inputs['Factor'])
    fogmix.inputs[7].default_value = (0.66, 0.69, 0.71, 1)
    ct.links.new(fogmix.outputs[2], nd['RGB Curves'].inputs['Image'])
    nd['タイトル表示'].inputs['Factor'].default_value = 0.0
    log(f'fog AOV added to {n_mat} materials; compositor: outline -> fog -> curves -> paper')


def sea():
    m = MA['Harbour | tidal blue']
    set_ramp(m, [(0.085, 0.150, 0.200), (0.30, 0.39, 0.44)])
    principled(m).inputs['Roughness'].default_value = 0.16
    m2 = MA.get('Harbour | pearl ripples')
    if m2:
        set_base(m2, (0.62, 0.66, 0.66))
    log('sea from turquoise to misty grey-blue')


# ================================================================ run
fix_normals()
remove_buried_wall_shards()
soften_rocks()
fix_plaza_joints()
naturalize()
post_office()
stone_post_office()
light()
sky()
fog()
sea()
S.render.engine = 'BLENDER_EEVEE'
S.eevee.taa_render_samples = 64
S.camera = OB['撮影カメラ | Harbor ascent']
S.render.resolution_x, S.render.resolution_y = 1080, 1920
if OUT:
    bpy.ops.wm.save_as_mainfile(filepath=OUT, compress=True, copy=False)
    log(f'saved {OUT}')
