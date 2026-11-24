"""影絵の紙芝居カードを、背景・人物・吹き出しの部品から組み立てる。

使い方: python3 tools/kami-compose.py letter-01
入力: data/work/kamishibai/<名前>-layout.json と products/word-guild/art/work/kami/parts/
出力: products/word-guild/art/work/kami/<名前>/NN.png（1536x1024）と art/kami/<名前>/NN.webp（1200x800）
同じ背景・同じ人物の絵を使い回すので、カードごとに背景や顔が変わらない。
"""
import json
import sys
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
PARTS = ROOT / 'products' / 'word-guild' / 'art' / 'work' / 'kami' / 'parts'
GROUND = 900


def part(name):
    return Image.open(PARTS / 'cut' / f'{name}.png').convert('RGBA')


def main(name):
    layout = json.loads((ROOT / 'data' / 'work' / 'kamishibai' / f'{name}-layout.json').read_text(encoding='utf-8'))
    sizes = layout['sizes']
    work = ROOT / 'products' / 'word-guild' / 'art' / 'work' / 'kami' / name
    out = ROOT / 'products' / 'word-guild' / 'art' / 'kami' / name
    work.mkdir(parents=True, exist_ok=True)
    out.mkdir(parents=True, exist_ok=True)
    for n, card in enumerate(layout['cards'], 1):
        canvas = Image.open(PARTS / f"{card['bg']}.png").convert('RGBA').resize((1536, 1024))
        for who in card.get('who', []):
            im = part(who['part'])
            h = sizes[who['h']]
            if who.get('crouch'):
                h = int(h * 0.62)  # しゃがんだ姿は背が低い
            im = im.resize((round(im.width * h / im.height), h), Image.LANCZOS)
            if who.get('flip'):
                im = im.transpose(Image.FLIP_LEFT_RIGHT)
            x = round(who['x'] * 1536 - im.width / 2)
            canvas.alpha_composite(im, (x, GROUND + 8 - im.height))
        for icon in card.get('icon', []):
            im = part(icon['part'])
            w = icon['w']
            im = im.resize((w, round(im.height * w / im.width)), Image.LANCZOS)
            if icon.get('flip'):
                im = im.transpose(Image.FLIP_LEFT_RIGHT)
            canvas.alpha_composite(im, (round(icon['x'] * 1536 - w / 2), icon['top']))
        rgb = canvas.convert('RGB')
        rgb.save(work / f'{n:02d}.png')
        rgb.resize((1200, 800), Image.LANCZOS).save(out / f'{n:02d}.webp', quality=80, method=6)
        print(out / f'{n:02d}.webp')


if __name__ == '__main__':
    main(sys.argv[1] if len(sys.argv) > 1 else 'letter-01')
