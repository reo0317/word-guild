"""Kiribare_Hillside.opus.blend を 4 台のカメラで撮る（EEVEE、任意で Cycles）。

  blender -b --disable-autoexec 3d/scenes/Kiribare_Hillside.opus.blend \
      -P 3d/blender/title_bg_render.py -- <出力プレフィックス> <倍率> <サンプル数> [カメラ番号,..] [eevee|cycles]

カメラ番号 0=撮影カメラ(1080x1920) 1=人物合成(1080x1920) 2=前庭と石段(1600x1100) 3=局舎と袖看板(1440x1080)
本番のタイトル背景: -- 3d/scenes/title-bg 1.0 128 0  → title-bg_cam0.png
"""
import bpy, sys, time

argv = sys.argv[sys.argv.index('--') + 1:]
prefix, scale, samples = argv[0], float(argv[1]), int(argv[2])
cams = [int(c) for c in argv[3].split(',')] if len(argv) > 3 else [0, 1, 2, 3]
engine = argv[4] if len(argv) > 4 else 'eevee'

S = bpy.context.scene
CAMS = ['撮影カメラ | Harbor ascent', '人物合成 | Character portrait',
        '前庭と石段 | Courtyard overview', '局舎と袖看板 | Post office exterior']
SIZES = [(1080, 1920), (1080, 1920), (1600, 1100), (1440, 1080)]

if engine == 'cycles':
    S.render.engine = 'CYCLES'
    S.cycles.samples = samples
    S.cycles.use_denoising = True
    S.cycles.use_adaptive_sampling = True
    S.cycles.device = 'CPU'
else:
    S.render.engine = 'BLENDER_EEVEE'
    S.eevee.taa_render_samples = samples

for i in cams:
    S.camera = bpy.data.objects[CAMS[i]]
    w, h = SIZES[i]
    S.render.resolution_x, S.render.resolution_y = int(w * scale), int(h * scale)
    S.render.resolution_percentage = 100
    S.render.image_settings.file_format = 'PNG'
    S.render.filepath = f'{prefix}_cam{i}.png'
    t = time.time()
    bpy.ops.render.render(write_still=True)
    print('RENDERED', i, round(time.time() - t, 1), S.render.filepath, flush=True)
