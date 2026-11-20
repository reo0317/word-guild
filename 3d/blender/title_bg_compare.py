"""直す前／直した後の 4 カメラと元の絵 2 枚を 1 枚に並べる（Pillow）。

  python3 3d/blender/title_bg_compare.py <before_prefix> <after_prefix> <out.png>
  （<prefix>_cam0.png .. _cam3.png を読む）
"""
import sys
from PIL import Image, ImageDraw, ImageFont

before, after, out = sys.argv[1:4]
ART = 'products/word-guild/art/work/'
H = 640          # 1 段の高さ
GAP = 10
LABELS = ['Harbor ascent', 'Character portrait', 'Courtyard overview', 'Post office exterior']


def fit(path, h):
    im = Image.open(path).convert('RGB')
    return im.resize((round(im.width * h / im.height), h), Image.LANCZOS)


def row(prefix):
    return [fit(f'{prefix}_cam{i}.png', H) for i in range(4)]


rows = [row(before), row(after)]
key = fit(ART + 'key-a4-1.png', 2 * H + GAP + 30)
post = fit(ART + 'post-front.png', H)
W = max(sum(t.width for t in r) + GAP * 3 for r in rows) + GAP + key.width + GAP + post.width
sheet = Image.new('RGB', (W, 2 * (H + 30) + GAP), (246, 241, 230))
d = ImageDraw.Draw(sheet)
try:
    font = ImageFont.truetype('DejaVuSans.ttf', 20)
except OSError:
    font = ImageFont.load_default()
for r, (tiles, tag) in enumerate(zip(rows, ['BEFORE (Astra)', 'AFTER (Opus)'])):
    y = r * (H + 30 + GAP)
    x = 0
    for i, t in enumerate(tiles):
        d.text((x + 6, y + 4), f'{tag} - {LABELS[i]}', fill=(30, 40, 70), font=font)
        sheet.paste(t, (x, y + 30))
        x += t.width + GAP
xk = W - key.width - GAP - post.width
d.text((xk + 6, 4), 'key art (key-a4-1)', fill=(30, 40, 70), font=font)
sheet.paste(key, (xk, 30))
d.text((xk + key.width + GAP + 6, 4), 'post-front', fill=(30, 40, 70), font=font)
sheet.paste(post, (xk + key.width + GAP, 30))
sheet.save(out)
print('saved', out, sheet.size)
