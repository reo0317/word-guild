"""絵コンテの表から、紙芝居カードの組み立て表を作る。

使い方: python3 tools/kami-layout.py 02 03 …（省略すると部品がそろったもの全部）
        python3 tools/kami-layout.py --color 01 02 …（色つきの場面）
影絵：data/work/kamishibai/letter-NN.md → letter-NN-layout.json、kamishibai.json の letters（英文の字幕）
色つき：data/work/kamishibai/color/scene-NN.md → scene-NN-layout.json、kamishibai.json の scenes
       （背景と人物だけで組む。吹き出し・小絵は重ねない）
       （字幕はゲームが scenes.json の行から付ける）
組み立て表は tools/kami-compose.py が読む。

人物：表の「向き」がシートの絵の向き（library.md の人物表）と逆なら左右反転する。
記号：上段は人物の頭より上。吹き出しの尾・雲の小丸が左下なら左の人物の右上、右下なら右の人物の左上。
      中段は人物の間のいちばん広い空きに、胸の高さで置く。空きが狭ければ上段に回す。
"""
import json
import re
import sys
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / 'data' / 'work' / 'kamishibai'
CUT = ROOT / 'products' / 'word-guild' / 'art' / 'work' / 'kami' / 'parts' / 'cut'
W = 1536
SIZES = {'adult': 560, 'girl': 480, 'teen': 480, 'child': 400, 'bird': 220, 'owl': 300}
HEIGHT = {'puppet-tsumugi': 'girl', 'puppet-riku': 'teen', 'puppet-child': 'child', 'puppet-fuurou': 'bird',
          'cpuppet-tsumugi': 'girl', 'cpuppet-riku': 'child', 'cpuppet-fish-child': 'child', 'cpuppet-fuurou': 'owl'}
KINDS = {
    'shadow': {'dir': DATA, 'board': 'letter', 'first': 2, 'key': 'letters'},
    'color': {'dir': DATA / 'color', 'board': 'scene', 'first': 1, 'key': 'scenes'},
}
KIND = KINDS['shadow']
HEAD_TOP = 900 - 560  # 大人の頭の高さ
TOP_MAX_H = HEAD_TOP - 30  # 上段の記号の高さの上限


def facing():
    """library.md の人物表から、シートの各ポーズの向き（右・左・奥）を読む。"""
    face = {}
    for line in (KIND['dir'] / 'library.md').read_text(encoding='utf-8').splitlines():
        m = re.match(r'\| (c?puppet-[a-z0-9-]+) \|', line)
        if not m:
            continue
        cols = [c.strip() for c in line.strip().strip('|').split('|')]
        for n, c in enumerate(cols[2:8], 1):
            face[f'{m.group(1)}-{n}'] = c.split('／')[0]
    return face


def aspect(part):
    im = Image.open(CUT / f'{part}.png')
    return im.width / im.height


def place_icon(part, desc, people):
    a = aspect(part)
    xs = sorted(p['x'] for p in people)
    mid = '中段' in desc and '上段' not in desc
    if mid:
        edges = [0.02] + xs + [0.98]
        gap, at = max((b - a_ - (0.1 if a_ > 0.02 else 0.04) - (0.1 if b < 0.98 else 0.04), (a_ + b) / 2)
                      for a_, b in zip(edges, edges[1:]))
        w = min(gap * W, 470, 400 * a)
        if w >= 220:
            h = w / a
            return {'part': part, 'x': round(at, 3), 'top': round(max(40, 640 - h / 2)), 'w': round(w)}
    w = round(min(480, TOP_MAX_H * a))
    half = w / 2 / W
    if xs and ('左下' in desc):
        x = xs[0] + half + 0.02
    elif xs and ('右下' in desc):
        x = xs[-1] - half - 0.02
    else:
        x = sum(xs) / len(xs) if xs else 0.5
    x = min(max(x, half + 0.02), 1 - half - 0.02)
    return {"part": part, "x": round(x, 3), "top": 24, "w": w}


def spread(icons):
    """記号が2つあるときは左右に離す。"""
    if len(icons) == 2:
        icons[0]['x'] = round(max(icons[0]['w'] / 2 / W + 0.02, 0.3 - 0.0), 3)
        icons[1]['x'] = round(min(1 - icons[1]['w'] / 2 / W - 0.02, 0.7), 3)
        for i in icons:
            i['w'] = min(i['w'], 360)
            i['top'] = 50
    return icons


def board(nn):
    return (KIND['dir'] / f"{KIND['board']}-{nn}.md").read_text(encoding='utf-8')


def build(nn, face):
    md = board(nn)
    cards = []
    for line in md.splitlines():
        if not re.match(r'\| \d+ \|', line):
            continue
        cols = [c.strip() for c in line.strip().strip('|').split('|')]
        bg, who_txt, icon_txt = cols[2], cols[3], cols[4]
        if '--' in bg and not (CUT.parent / f'{bg}.png').exists():
            bg = bg.split('--')[0]  # 変化をつけた背景がまだ無ければ元の背景で組む
        who = []
        for w in who_txt.split('<br>'):
            m = re.match(r'(c?puppet-[a-z0-9-]+-\d)、(右|左|奥|正面)向き、x=([0-9.]+)$', w.strip())
            if not m:
                continue
            part, want, x = m.group(1), m.group(2), float(m.group(3))
            sheet = part.rsplit('-', 1)[0]
            p = {'part': part, 'x': x, 'h': HEIGHT.get(sheet, 'adult')}
            have = face.get(part, '右')
            if want in '右左' and have in '右左' and want != have:
                p['flip'] = True
            who.append(p)
        icons = [] if KIND['key'] == 'scenes' else [  # 色つきは吹き出し・小絵を重ねない（絵の破綻が多いため）
            place_icon(i, icon_txt, who) for i in re.findall(r'c?icons-[0-9a-z]+-\d+', icon_txt)]
        cards.append({'bg': bg, 'who': who, 'icon': spread(icons)})
    return {'note': f"tools/kami-layout.py が {KIND['board']}-{nn}.md から作った組み立て表。", 'sizes': SIZES, 'cards': cards}


def ready(nn):
    md = board(nn)
    parts = re.findall(r'c?(?:puppet|icons)-[0-9a-z-]+-\d+', md)
    bgs = re.findall(r'\| (c?bg-[a-z0-9-]+) \|', md)
    return all((CUT / f'{p}.png').exists() for p in parts) and all((CUT.parent / f"{b.split('--')[0]}.png").exists() for b in bgs)


def main(args):
    global KIND
    if args[:1] == ['--color']:
        KIND, args = KINDS['color'], args[1:]
    face = facing()
    done = []
    for nn in args or [f'{n:02d}' for n in range(KIND['first'], 57)]:
        if not ready(nn):
            print('部品待ち', nn)
            continue
        out = DATA / f"{KIND['board']}-{nn}-layout.json"
        out.write_text(json.dumps(build(nn, face), ensure_ascii=False, indent=1) + '\n', encoding='utf-8')
        print(out.relative_to(ROOT))
        done.append(nn)
    captions(done)


def captions(nns):
    """products/word-guild/data/kamishibai.json に、カードの絵の名前（影絵は字幕の英文も）を入れる。"""
    path = ROOT / 'products' / 'word-guild' / 'data' / 'kamishibai.json'
    data = json.loads(path.read_text(encoding='utf-8'))
    key, name = KIND['key'], KIND['board']
    for nn in nns:
        texts = [c.strip().strip('|').split('|')[1].strip() for c in board(nn).splitlines() if re.match(r'\| \d+ \|', c)]
        data[key][str(int(nn))] = [{'pic': f'kami/{name}-{nn}/{i:02d}', **({'text': t} if key == 'letters' else {})}
                                   for i, t in enumerate(texts, 1)]
    data[key] = dict(sorted(data[key].items(), key=lambda kv: int(kv[0])))
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')


if __name__ == '__main__':
    main(sys.argv[1:])
