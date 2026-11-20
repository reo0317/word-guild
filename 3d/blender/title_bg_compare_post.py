"""郵便局だけを絵と並べる比較（Pillow）。

  python3 3d/blender/title_bg_compare_post.py <before_cam3.png> <after_cam3.png> <after_front.png> <out.png>
"""
import sys
from PIL import Image, ImageDraw, ImageFont

before, after, front, out = sys.argv[1:5]
H = 700
GAP = 10
items = [(before, 'BEFORE (Astra) - Post office exterior'), (after, 'AFTER (Opus) - Post office exterior'),
         (front, 'AFTER (Opus) - front close-up'), ('products/word-guild/art/work/post-front.png', 'post-front (target)')]
tiles = []
for p, label in items:
    im = Image.open(p).convert('RGB')
    tiles.append((im.resize((round(im.width * H / im.height), H), Image.LANCZOS), label))
W = sum(t.width for t, _ in tiles) + GAP * (len(tiles) - 1)
sheet = Image.new('RGB', (W, H + 30), (246, 241, 230))
d = ImageDraw.Draw(sheet)
try:
    font = ImageFont.truetype('DejaVuSans.ttf', 20)
except OSError:
    font = ImageFont.load_default()
x = 0
for t, label in tiles:
    d.text((x + 6, 4), label, fill=(30, 40, 70), font=font)
    sheet.paste(t, (x, 30))
    x += t.width + GAP
sheet.save(out)
print('saved', out, sheet.size)
