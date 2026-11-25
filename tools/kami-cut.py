"""紙芝居の部品シート（緑背景）を1つずつ切り出す。

使い方: python3 tools/kami-cut.py
入力: products/word-guild/art/work/kami/parts/puppet-*.png, icons-*.png（背景 #00FF00）
出力: products/word-guild/art/work/kami/parts/cut/<シート名>-<番号>.png（透過・余白なし）
番号はマスの順（上の行から、行の中は左から 1, 2, 3…）。空きマスの番号は飛ばす。
人物シートは横6マス×1行、記号シートは横4マス×縦3行。マスの境目は、決まった位置の近くで
いちばん絵の少ない線を選ぶ（絵がマスから少しはみ出しても、隣とくっついていても切れる）。
"""
from pathlib import Path

import sys

import numpy as np
from PIL import Image, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
PARTS = ROOT / 'products' / 'word-guild' / 'art' / 'work' / 'kami' / 'parts'
OUT = PARTS / 'cut'


def key_green(im):
    px = np.asarray(im.convert('RGBA')).astype(np.int32)
    r, g, b = px[..., 0], px[..., 1], px[..., 2]
    m = np.maximum(r, b)
    green = g - m
    k = np.clip((green - 30) / 60, 0, 1)
    out = px.copy()
    edge = (green > 30) & (green <= 90)
    out[..., 1] = np.where(edge, m + (g - m) * 0.2, g)  # 縁の緑かぶりを抜く
    out[..., 3] = np.where(green > 90, 0, np.where(edge, 255 * (1 - k), px[..., 3]))
    return Image.fromarray(out.clip(0, 255).astype(np.uint8), 'RGBA')


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


def clean(piece, inside=0.01):
    """本体から離れた小さなかけら（隣の人物の手先など）を、画素の塊ごとに消す。"""
    a = np.asarray(piece.getchannel('A'))
    small = a[::2, ::2] > 40
    h, w = small.shape
    label = np.zeros(small.shape, np.int32)
    sizes, boxes = [0], [None]
    for y, x in zip(*np.nonzero(small)):
        if label[y, x]:
            continue
        n = len(sizes)
        label[y, x] = n
        stack, count, x0, x1 = [(y, x)], 0, x, x
        while stack:
            cy, cx = stack.pop()
            count += 1
            x0, x1 = min(x0, cx), max(x1, cx)
            for ny, nx in ((cy + 1, cx), (cy - 1, cx), (cy, cx + 1), (cy, cx - 1)):
                if 0 <= ny < h and 0 <= nx < w and small[ny, nx] and not label[ny, nx]:
                    label[ny, nx] = n
                    stack.append((ny, nx))
        sizes.append(count)
        boxes.append((x0, x1))
    if len(sizes) <= 2:
        return piece
    main = int(np.argmax(sizes))
    m0, m1 = boxes[main]
    keep = np.zeros(len(sizes), bool)
    for n in range(1, len(sizes)):
        apart = boxes[n][1] < m0 or boxes[n][0] > m1
        keep[n] = sizes[n] >= sizes[main] * (0.05 if apart else inside)
    mask = keep[label]
    mask = mask.repeat(2, 0).repeat(2, 1)[:a.shape[0], :a.shape[1]]
    full = np.zeros(a.shape, bool)
    full[:mask.shape[0], :mask.shape[1]] = mask
    m = Image.fromarray((full * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(5))
    piece.putalpha(Image.fromarray(np.minimum(a, np.asarray(m))))
    return piece.crop(piece.getchannel('A').getbbox())


def cut_line(alpha, at, span, axis, lo, hi):
    """at の前後 span の範囲で、絵（不透明の画素）がいちばん少ない線の位置を返す。"""
    a = np.asarray(alpha) > 40
    counts = a[lo:hi, :].sum(axis=0) if axis == 'x' else a[:, lo:hi].sum(axis=1)
    vs = range(max(1, at - span), min(at + span, len(counts) - 1))
    return min(vs, key=lambda v: (counts[v], abs(v - at)))


def gaps(alpha, cols):
    """横一列の人物シート：人物の間の空いた列のうち、広いものから cols-1 本を境目にする。"""
    counts = (np.asarray(alpha) > 40).sum(axis=0)
    filled = np.nonzero(counts)[0]
    runs, start = [], None
    for x in range(filled[0], filled[-1] + 1):
        if counts[x] == 0 and start is None:
            start = x
        elif counts[x] and start is not None:
            runs.append((x - start, (start + x) // 2))
            start = None
    # 等間隔に並べたときの境目に、いちばん近い隙間を選ぶ（腕と手の間などの小さな隙間で切らない）
    span = (filled[-1] - filled[0]) / cols
    cum = np.cumsum(counts) / counts.sum()  # 絵の量で等分した位置（はみ出た手などに引っぱられない）
    ideal = [int(np.searchsorted(cum, k / cols)) for k in range(1, cols)]
    picked = []
    for at in ideal:
        near = [m for n, m in runs if n >= 6 and abs(m - at) < span * 0.45 and m not in picked]
        if not near:
            break
        picked.append(min(near, key=lambda m: abs(m - at)))
    if len(picked) == cols - 1:
        picked.sort()
        for _ in range(cols):
            edges = [0] + picked + [len(counts)]
            mass = [counts[a:b].sum() for a, b in zip(edges, edges[1:])]
            small = min(range(cols), key=lambda i: mass[i])
            if mass[small] >= 0.3 * sorted(mass)[cols // 2]:
                return picked
            # 小さすぎるかけら（離れた手など）は隣とつなぎ、いちばん大きい塊を隙間で二つに分ける
            picked.remove(picked[small - 1] if small == cols - 1 or (small > 0 and mass[small - 1] < mass[small + 1]) else picked[small])
            edges = [0] + picked + [len(counts)]
            mass = [counts[a:b].sum() for a, b in zip(edges, edges[1:])]
            big = max(range(cols - 1), key=lambda i: mass[i])
            a, b = edges[big], edges[big + 1]
            mid = a + int(np.searchsorted(np.cumsum(counts[a:b]), mass[big] / 2))
            inside = [m for n, m in runs if a < m < b and n >= 6]
            if not inside:
                return None
            picked = sorted(picked + [min(inside, key=lambda m: abs(m - mid))])
    # 手や小物が重なって隙間がないときは、絵の量で等分した位置の近くで、いちばん絵の薄い列を選ぶ
    width = int(span * 0.3)
    return [min(range(at - width, at + width), key=lambda x: (counts[x], abs(x - at))) for at in ideal]


def grid(alpha, cols, rows):
    w, h = alpha.size
    if rows == 1:
        xs = gaps(alpha, cols)
        if xs:
            return [(a, 0, b, h) for a, b in zip([0] + xs, xs + [w])]
    ys = [0] + [cut_line(alpha, h * r // rows, h // rows // 6, 'y', 0, w) for r in range(1, rows)] + [h]
    cells = []
    for r in range(rows):
        y0, y1 = ys[r], ys[r + 1]
        xs = [0] + [cut_line(alpha, w * c // cols, w // cols // 4, 'x', y0, y1) for c in range(1, cols)] + [w]
        cells += [(xs[c], y0, xs[c + 1], y1) for c in range(cols)]
    return cells


def main():
    OUT.mkdir(exist_ok=True)
    sheets = [f for pattern in ('puppet-*.png', 'icons-*.png', 'cpuppet-*.png', 'cicons-*.png') for f in PARTS.glob(pattern)]
    only = sys.argv[1:]  # シート名を渡すと、そのシートだけ切り出す
    for sheet in sorted(f for f in sheets if not only or f.stem in only):
        if sheet.stem in ('icons-a', 'icons-b'):
            continue  # 手紙1用の不ぞろいなシート。切り出し済みのものを使う
        im = key_green(Image.open(sheet))
        alpha = im.getchannel('A')
        cols, rows = (6, 1) if 'puppet-' in sheet.stem else (4, 3)
        for old in OUT.glob(f'{sheet.stem}-*.png'):
            if old.stem.rsplit('-', 1)[1].isdigit() and old.stem.rsplit('-', 1)[0] == sheet.stem:
                old.unlink()
        for n, box in enumerate(grid(alpha, cols, rows), 1):
            piece = im.crop(box)
            bbox = piece.getchannel('A').point(lambda v: 255 if v > 20 else 0).getbbox()
            if not bbox or (bbox[2] - bbox[0]) * (bbox[3] - bbox[1]) < 4000:
                continue  # 空きマス
            piece = piece.crop(bbox)
            # 隣の絵のかけらなど、本体から離れた小さな点を消す
            piece = clean(piece, 0.01 if cols == 6 else 0)  # 記号の雲の小丸などは残す
            path = OUT / f'{sheet.stem}-{n}.png'
            piece.save(path)
            print(path.relative_to(ROOT), piece.size)


if __name__ == '__main__':
    main()
