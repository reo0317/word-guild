"""原画（products/word-guild/art/work/*.png）を、ゲーム用の絵（products/word-guild/art/）に書き出す。

使い方: python3 tools/art-export.py
- 緑背景（#00ff00 付近）のキャラクターと敵は、緑を抜いて透過にし、正方 512px の webp にする。
- 背景は横 1200×800、オープニングは縦のまま、webp にする。
- アイコンは 512・192・180 の png にする。
Pillow を使う（ゲーム本体には入れない）。
"""
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


def main():
    OUT.mkdir(exist_ok=True)
    report = []
    for name in SPRITES:
        im = to_square(key_out_green(Image.open(WORK / f'{name}.png')))
        report.append((name, save_webp(im, OUT / f'{name}.webp', 60)))
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


if __name__ == '__main__':
    main()
