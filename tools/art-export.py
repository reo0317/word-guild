"""原画（products/word-guild/art/work/*.png）を、ゲーム用の絵（products/word-guild/art/）に書き出す。

使い方: python3 tools/art-export.py [--word]
- --word は単語の意味の絵だけを緑抜き・正方 256px の webp にする。
- 緑背景（#00ff00 付近）のキャラクターと敵は、緑を抜いて透過にし、正方 512px の webp にする。
- 背景は横 1200×800、オープニングは縦のまま、webp にする。
- アイコンは 512・192・180 の png にする。
Pillow を使う（ゲーム本体には入れない）。
"""
import argparse
from pathlib import Path

from PIL import Image, ImageChops

ROOT = Path(__file__).resolve().parent.parent
WORK = ROOT / 'products' / 'word-guild' / 'art' / 'work'
OUT = ROOT / 'products' / 'word-guild' / 'art'

SPRITES = ['tsumugi-normal', 'tsumugi-joy', 'fuurou-normal', 'fuurou-stamp',
           'hatori-normal', 'hatori-smile',
           'shimi', 'keshikasu', 'nijimi', 'hokoridama', 'atenashi', 'oshimi']
# 紙魚の体（意味の分類16種）
SPRITES += [f'body-{c}' for c in ('money', 'work', 'person', 'time', 'place', 'move', 'food', 'doc',
                                    'goods', 'tool', 'nature', 'body', 'mind', 'number', 'action', 'state')]
HOUSES = [f'house-{i}' for i in range(1, 57)]  # 地図の家（手紙の宛先）。192px の透過 webp
WIDE = ['post-office'] + [f'ward-{i}' for i in range(1, 7)]
TALL = ['open-2', 'open-3']


def key_out_green(im):
    """緑の強さ（g − max(r, b)）から透明度を作り、縁に残る緑を抑える。"""
    rgb = im.convert('RGB')
    r, g, b = rgb.split()
    rb_max = ImageChops.lighter(r, b)
    greenness = ImageChops.subtract(g, rb_max)
    # 緑の強さ 40 以下は不透明、140 以上は透明。その間はなめらかに。
    alpha = greenness.point(lambda v: 255 if v <= 40 else 0 if v >= 140 else int(255 * (140 - v) / 100))
    # 縁の緑かぶり：g を max(r, b) より大きくしない。
    g_fixed = ImageChops.darker(g, ImageChops.add(rb_max, Image.new('L', g.size, 12)))
    out = Image.merge('RGBA', (r, g_fixed, b, alpha))
    return out


def to_square(im, size=512, margin=0.04):
    box = im.getchannel('A').point(lambda v: 255 if v > 16 else 0).getbbox()
    if box:
        im = im.crop(box)
    side = int(max(im.size) * (1 + margin * 2))
    canvas = Image.new('RGBA', (side, side), (0, 0, 0, 0))
    canvas.paste(im, ((side - im.width) // 2, side - im.height - int(side * margin)), im)
    return canvas.resize((size, size), Image.LANCZOS)


def save_webp(im, path, limit_kb):
    for quality in (82, 75, 68, 60, 52, 45):
        im.save(path, 'WEBP', quality=quality, method=6)
        if path.stat().st_size <= limit_kb * 1024:
            break
    return path.stat().st_size // 1024


def export_words():
    dest = OUT / 'word'
    dest.mkdir(parents=True, exist_ok=True)
    paths = sorted((WORK / 'word').glob('*.png'))
    for path in paths:
        with Image.open(path) as source:
            im = to_square(key_out_green(source), size=256)
        kb = save_webp(im, dest / f'{path.stem}.webp', 30)
        print(f'{path.stem:16s} {kb:4d} KB')
    total = sum((dest / f'{path.stem}.webp').stat().st_size for path in paths)
    print(f'word: {len(paths)} 枚、{total} bytes ({total / 1024:.1f} KB)')


# 原画1536pxに対する扉の四角。町とアーチは枠に残す。
GATE_DOOR = {2: (500, 700, 1036, 1190)}


def remove_alpha_specks(im, minimum=48):
    """アルファがある連結成分のうち、孤立した小さな点だけを消す。"""
    im = im.convert('RGBA')
    alpha = im.getchannel('A')
    pixels = bytearray(alpha.tobytes())
    w, h = im.size
    seen = bytearray(w * h)
    for start, value in enumerate(pixels):
        if not value or seen[start]:
            continue
        stack, component = [start], []
        seen[start] = 1
        while stack:
            i = stack.pop()
            component.append(i)
            x, y = i % w, i // w
            for j in ((i-1 if x else -1), (i+1 if x+1<w else -1),
                      (i-w if y else -1), (i+w if y+1<h else -1)):
                if j >= 0 and pixels[j] and not seen[j]:
                    seen[j] = 1
                    stack.append(j)
        if len(component) < minimum:
            for i in component:
                pixels[i] = 0
    im.putalpha(Image.frombytes('L', im.size, bytes(pixels)))
    return im


def export_map2():
    dest = OUT / 'road'
    dest.mkdir(parents=True, exist_ok=True)
    with Image.open(WORK / 'road-2.webp') as source:
        road = source.convert('RGBA').crop((0, 0, 256, 558)).resize((256, 512), Image.LANCZOS)
    # 両端の16行を同じ中間色へ連続的に寄せる（端の行は完全に一致）。
    original = road.copy()
    for y in range(16):
        blend = Image.blend(original.crop((0, y, 256, y+1)),
                            original.crop((0, 511-y, 256, 512-y)), .5)
        strength = (1-y/16) ** 2
        for row in (y, 511-y):
            road.paste(Image.blend(original.crop((0, row, 256, row+1)), blend, strength), (0, row))
    # 可逆WebPで最初と最後の行の一致を保つ。版画の限られた色を量子化する。
    target = dest / 'road-2.webp'
    for colors in (128, 64, 32, 16):
        road.quantize(colors).convert('RGBA').save(target, 'WEBP', lossless=True, method=6)
        if target.stat().st_size <= 45 * 1024:
            break
    with Image.open(target) as check:
        assert check.crop((0, 0, 256, 1)).tobytes() == check.crop((0, 511, 256, 512)).tobytes()
    print('road-2', target.stat().st_size // 1024, 'KB（上下端の一致を確認）')
    with Image.open(WORK / 'gate-2.png') as source:
        gate = remove_alpha_specks(source)
    x0, y0, x1, y1 = GATE_DOOR[2]
    middle = (x0+x1)//2
    for name, box in [('door-l', (x0,y0,middle,y1)), ('door-r', (middle,y0,x1,y1))]:
        leaf = gate.crop(box)
        leaf = leaf.resize((round(leaf.width/3), round(leaf.height/3)), Image.LANCZOS)
        print(name, save_webp(leaf, OUT / f'gate-2-{name}.webp', 40), 'KB')
    gate.paste((0,0,0,0), (x0,y0,x1,y1))
    print('gate-2', save_webp(gate.resize((512,512), Image.LANCZOS), OUT / 'gate-2.webp', 70), 'KB')


# 原画に対する割合。2区は承認済みの切り出しを保持する。
GATE_RECTS = {1:(.30,.48,.40,.35), 2:(500/1536,700/1536,536/1536,490/1536),
              3:(.28,.52,.43,.34), 4:(.28,.51,.44,.35),
              5:(.29,.49,.42,.38), 6:(.31,.51,.38,.34)}

def gate_arch(im, n):
    """上端の不透明輪郭を包含する半円。灯・飾りと文字の縁に14pxの間隔。"""
    import math
    alpha = im.resize((512, 512), Image.LANCZOS).getchannel('A')
    cx, cy = {1: (256, 330), 2: (256, 320), 3: (256, 320),
              4: (256, 340), 5: (256, 330)}[n]
    contour = []
    for x in range(512):
        for y in range(cy):
            if alpha.getpixel((x, y)) > 128:
                contour.append(math.hypot(x-cx, y-cy))
                break
    return [cx, cy, math.ceil(max(contour)) + 14]


def export_lighthouse():
    path = WORK / 'lighthouse.png'
    if path.exists():
        with Image.open(path) as source:
            im = to_square(key_out_green(source))
        save_webp(im, OUT / 'lighthouse.webp', 70)
        assert (OUT / 'lighthouse.webp').stat().st_size <= 70 * 1024


def export_map():
    import json
    dest = OUT / 'road'
    dest.mkdir(exist_ok=True)
    available = {'roads': [], 'gates': [], 'props': []}
    arches = {}
    export_lighthouse()
    for n in range(1,7):
        for kind in ('road', 'gate'):  # 道ばたの小物は使わない（依頼者の判断）
            try:
                path = WORK / f'{kind}-{n}.{"webp" if kind == "road" else "png"}'
                with Image.open(path) as source:
                    source.load()
                    im = source.convert('RGBA')
                if kind == 'road':
                    im = im.resize((256,608), Image.LANCZOS)
                    original = im.copy()
                    for y in range(16):
                        blend = Image.blend(original.crop((0,y,256,y+1)), original.crop((0,511-y,256,512-y)), .5)
                        for row in (y,511-y):
                            im.paste(Image.blend(original.crop((0,row,256,row+1)),blend,(1-y/16)**2),(0,row))
                    target = dest / f'road-{n}.webp'
                    for colors in (128,64,32,16):
                        im.quantize(colors).convert('RGBA').save(target,'WEBP',lossless=True,method=6)
                        if target.stat().st_size <= 45*1024: break
                    with Image.open(target) as check:
                        assert check.crop((0,0,256,1)).tobytes() == check.crop((0,511,256,512)).tobytes()
                    available['roads'].append(n)
                elif kind == 'props':
                    source = key_out_green(im)
                    im = Image.new('RGBA',(768,512))
                    for cell in range(6):
                        cw,ch=source.width//3,source.height//2
                        left,top=(cell%3)*cw,(cell//3)*ch
                        sprite=source.crop((left+8,top+8,left+cw-8,top+ch-8))
                        box=sprite.getchannel('A').point(lambda v:255 if v>32 else 0).getbbox()
                        if box:
                            sprite=sprite.crop(box)
                            sprite.thumbnail((240,240),Image.LANCZOS)
                            im.paste(sprite,((cell%3)*256+(256-sprite.width)//2,(cell//3)*256+256-sprite.height))
                    save_webp(im,dest / f'props-{n}.webp',70)
                    available['props'].append(n)
                else:
                    im = remove_alpha_specks(im)
                    if n < 6:
                        arches[n] = gate_arch(im, n)
                    x,y,w,h = GATE_RECTS[n]
                    x0,y0,x1,y1 = round(x*im.width),round(y*im.height),round((x+w)*im.width),round((y+h)*im.height)
                    mid=(x0+x1)//2
                    door=im.crop((x0,y0,x1,y1))
                    save_webp(door.resize((round(w*512),round(h*512)),Image.LANCZOS),OUT / f'gate-{n}-door.webp',40)
                    for side,box in [('l',(x0,y0,mid,y1)),('r',(mid,y0,x1,y1))]:
                        leaf=im.crop(box).resize((round(w*256),round(h*512)),Image.LANCZOS)
                        save_webp(leaf,OUT / f'gate-{n}-door-{side}.webp',40)
                    im.paste((0,0,0,0),(x0,y0,x1,y1))
                    save_webp(im.resize((512,512),Image.LANCZOS),OUT / f'gate-{n}.webp',70)
                    available['gates'].append(n)
                print(kind,n,'OK')
            except (OSError,ValueError,AssertionError) as error:
                print(kind,n,'従来表示:',error)
    (OUT / 'map-art.mjs').write_text('export const MAP_ART = '+json.dumps(available)+';\nexport const GATE_RECTS = '+json.dumps(GATE_RECTS)+';\nexport const GATE_ARCHES = '+json.dumps(arches)+';\n')


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--word', action='store_true', help='単語の意味の絵だけを書き出す')
    parser.add_argument('--map', action='store_true', help='全区の道・門・小物を書き出す')
    parser.add_argument('--map2', action='store_true', help='2区の道と門だけを書き出す')
    args = parser.parse_args()
    if args.map:
        export_map()
        return
    if args.map2:
        export_map2()
        return
    if args.word:
        export_words()
        return
    OUT.mkdir(exist_ok=True)
    report = []
    for name in SPRITES:
        im = to_square(key_out_green(Image.open(WORK / f'{name}.png')))
        report.append((name, save_webp(im, OUT / f'{name}.webp', 60)))
    for name in HOUSES:
        im = to_square(key_out_green(Image.open(WORK / f'{name}.png')), size=192, margin=0.02)
        report.append((name, save_webp(im, OUT / f'{name}.webp', 20)))
    for name in WIDE:
        im = Image.open(WORK / f'{name}.png').convert('RGB').resize((1200, 800), Image.LANCZOS)
        report.append((name, save_webp(im, OUT / f'{name}.webp', 200)))
    for name in TALL:
        im = Image.open(WORK / f'{name}.png').convert('RGB')
        report.append((name, save_webp(im, OUT / f'{name}.webp', 300)))
    icon = Image.open(WORK / 'icon.png').convert('RGB')
    side = min(icon.size)
    icon = icon.crop(((icon.width - side) // 2, (icon.height - side) // 2,
                      (icon.width + side) // 2, (icon.height + side) // 2))
    for size in (512, 192, 180):
        icon.resize((size, size), Image.LANCZOS).save(OUT / f'icon-{size}.png', optimize=True)
    total = sum(p.stat().st_size for p in OUT.glob('*.*')) // 1024
    for name, kb in report:
        print(f'{name:16s} {kb:4d} KB')
    print(f'art/ 合計 {total} KB')
    export_words()


if __name__ == '__main__':
    main()
