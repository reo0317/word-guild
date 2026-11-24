"""紙芝居の部品シート（緑背景）を1つずつ切り出す。

使い方: python3 tools/kami-cut.py
入力: products/word-guild/art/work/kami/parts/puppet-*.png, icons-*.png（背景 #00FF00）
出力: products/word-guild/art/work/kami/parts/cut/<シート名>-<番号>.png（透過・余白なし）
番号は上の行から、行の中は左から 1, 2, 3…
"""
from pathlib import Path

from PIL import Image, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
PARTS = ROOT / 'products' / 'word-guild' / 'art' / 'work' / 'kami' / 'parts'
OUT = PARTS / 'cut'


def key_green(im):
    im = im.convert('RGBA')
    px = im.load()
    w, h = im.size
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            green = g - max(r, b)
            if green > 90:
                px[x, y] = (r, g, b, 0)
            elif green > 30:
                # 縁の緑かぶりを抜く
                k = (green - 30) / 60
                px[x, y] = (r, int(max(r, b) + (g - max(r, b)) * 0.2), b, int(255 * (1 - k)))
    return im


def components(alpha, merge=9):
    """アルファの塊を、近いもの同士はまとめて、外接矩形のリストで返す。"""
    if alpha.width < 8 or alpha.height < 8:
        return [(0, 0, alpha.width, alpha.height)]
    small = alpha.resize((alpha.width // 4, alpha.height // 4))
    grown = small.point(lambda v: 255 if v > 40 else 0)
    if merge >= 4:
        grown = grown.filter(ImageFilter.MaxFilter(merge // 4 * 2 + 1))
    w, h = grown.size
    px = grown.load()
    seen = set()
    boxes = []
    for y in range(h):
        for x in range(w):
            if px[x, y] and (x, y) not in seen:
                stack = [(x, y)]
                seen.add((x, y))
                x0 = x1 = x
                y0 = y1 = y
                while stack:
                    cx, cy = stack.pop()
                    x0, x1, y0, y1 = min(x0, cx), max(x1, cx), min(y0, cy), max(y1, cy)
                    for nx, ny in ((cx + 1, cy), (cx - 1, cy), (cx, cy + 1), (cx, cy - 1)):
                        if 0 <= nx < w and 0 <= ny < h and px[nx, ny] and (nx, ny) not in seen:
                            seen.add((nx, ny))
                            stack.append((nx, ny))
                if (x1 - x0) * (y1 - y0) > 40:
                    boxes.append((x0 * 4, y0 * 4, (x1 + 1) * 4, (y1 + 1) * 4))
    return boxes


def order(boxes):
    """行ごとに並べる（中心の高さが近いものを同じ行に）。"""
    boxes = sorted(boxes, key=lambda b: (b[1] + b[3]) / 2)
    rows = []
    for b in boxes:
        cy = (b[1] + b[3]) / 2
        if rows and abs(cy - rows[-1][0]) < (b[3] - b[1]) * 0.5:
            rows[-1][1].append(b)
        else:
            rows.append([cy, [b]])
    return [b for _, row in rows for b in sorted(row, key=lambda b: b[0])]


def main():
    OUT.mkdir(exist_ok=True)
    for sheet in sorted(list(PARTS.glob('puppet-*.png')) + list(PARTS.glob('icons-*.png'))):
        im = key_green(Image.open(sheet))
        alpha = im.getchannel('A')
        for n, box in enumerate(order(components(alpha)), 1):
            piece = im.crop(box)
            bbox = piece.getchannel('A').point(lambda v: 255 if v > 20 else 0).getbbox()
            piece = piece.crop(bbox)
            # 隣の絵のかけらなど、本体から離れた小さな点を消す
            parts = components(piece.getchannel('A'), merge=1)
            if parts:
                area = lambda b: (b[2] - b[0]) * (b[3] - b[1])
                biggest = max(map(area, parts))
                keep = Image.new('L', piece.size, 0)
                for b in parts:
                    if area(b) >= biggest * 0.03:
                        keep.paste(255, b)
                piece.putalpha(Image.composite(piece.getchannel('A'), keep, keep))
                piece = piece.crop(piece.getchannel('A').getbbox())
            path = OUT / f'{sheet.stem}-{n}.png'
            piece.save(path)
            print(path.relative_to(ROOT), piece.size)


if __name__ == '__main__':
    main()
