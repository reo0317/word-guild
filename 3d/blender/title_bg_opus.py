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


def soften_rocks():
    """多面体のまま光る岩：角を面取りし、浅い角はなめらかに（鋭い割れ目は残す）。"""
    rocks = ['Stair garden • slate ledges', 'Near escarpment • exposed split schist',
             '地層 | Weathered schist combs in the grass', '潮端 | Broken schist ledges at the quay']
    for n in rocks:
        o = OB.get(n)
        if not o:
            continue
        if 'opus_bevel' not in o.modifiers:
            b = o.modifiers.new('opus_bevel', 'BEVEL')
            b.width = 0.025
            b.segments = 2
            b.limit_method = 'ANGLE'
            b.angle_limit = math_radians(35)
            b.harden_normals = False
        for p in o.data.polygons:
            p.use_smooth = True
        o.data.set_sharp_from_angle(angle=math_radians(48))
    # 椿：低ポリの球が縞に見える → 細分化してなめらかに
    o = OB.get('石段の椿 | Camellia at the margin of the steps')
    if o:
        for p in o.data.polygons:
            p.use_smooth = True
        if 'opus_subd' not in o.modifiers:
            sd = o.modifiers.new('opus_subd', 'SUBSURF')
            sd.levels = sd.render_levels = 1
    log('rocks bevelled + angle-smoothed; camellia subdivided')


def math_radians(d):
    return d * math.pi / 180


def fix_plaza_joints():
    """敷石の目地が点線状にちらつく：目地の底が 7 cm 下の暗い面で、細い隙間が途切れて見えていた。
    敷石の上面を写した目地床（3 mm 下、各石を 1.5 cm 広げる）を敷き、目地を一定の石灰色の線にする。"""
    m = MA['海辺の広場 | Lime pointing']
    set_ramp(m, [(0.33, 0.31, 0.26), (0.40, 0.37, 0.31)])
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
            grow = d.normalized() * 0.015 if d.length > 1e-6 else Vector()
            vs.append(bm.verts.new((w.x + grow.x, w.y + grow.y, 4.467)))
        bm.faces.new(vs)
    me = bpy.data.meshes.new('OPUS 広場 | Mortar bed')
    bm.to_mesh(me)
    bm.free()
    me.materials.append(m)
    o = OB.new('OPUS 広場 | Mortar bed', me)
    link_like(o, src)
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
        local_box('OPUS 玄関 | Granite door step', org, (-1.12, -0.80, 0.0), (1.12, -0.26, 0.09), gran)

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
    stretch.inputs[1].default_value = (0.32, 0.95, 0.0)
    noi = N('ShaderNodeTexNoise', (-400, -600), Scale=1.35, Detail=9.0, Roughness=0.58, Distortion=0.25)
    noi.noise_dimensions = '4D'
    noi.inputs['W'].default_value = 3.7
    L(stretch.outputs[0], noi.inputs['Vector'])
    cm = N('ShaderNodeMapRange', (-200, -600), **{'From Min': 0.43, 'From Max': 0.66})
    cm.interpolation_type = 'SMOOTHSTEP'
    L(noi.outputs['Fac'], cm.inputs['Value'])
    hz = N('ShaderNodeMapRange', (-200, -850), **{'From Min': 0.015, 'From Max': 0.20})
    hz.interpolation_type = 'SMOOTHSTEP'
    L(z, hz.inputs['Value'])
    cov = mth(N, L, 'MULTIPLY', cm.outputs[0], hz.outputs[0], (0, -700))
    cov = mth(N, L, 'MULTIPLY', cov, 0.78, (150, -700))
    # 雲の色：陰は青灰、日向は紙色
    shade = N('ShaderNodeMapRange', (-200, -400), **{'From Min': 0.55, 'From Max': 0.85})
    L(noi.outputs['Fac'], shade.inputs['Value'])
    ccol = N('ShaderNodeMix', (0, -400), _data_type='RGBA')
    L(shade.outputs[0], ccol.inputs['Factor'])
    ccol.inputs[6].default_value = (0.58, 0.61, 0.66, 1)
    ccol.inputs[7].default_value = (0.86, 0.84, 0.80, 1)
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
    if 'fog' not in [a.name for a in VL.aovs]:
        a = VL.aovs.add()
        a.name = 'fog'
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
soften_rocks()
fix_plaza_joints()
naturalize()
post_office()
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
