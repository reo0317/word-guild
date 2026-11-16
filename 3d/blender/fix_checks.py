from PIL import Image,ImageDraw
from pathlib import Path
p=Path('/home/user/word-guild/3d/models/out')
for name in ['tsumugi','hatori','fuurou']:
 canvas=Image.new('RGB',(1536,1080),'#f2efea');d=ImageDraw.Draw(canvas)
 for row,mode in enumerate(['unlit','lit']):
  for col,view in enumerate(['front','side','back']):
   canvas.paste(Image.open(p/f'{name}-{mode}-{view}.png').convert('RGB'),(512*col,540*row+28));d.text((512*col+15,540*row+8),f'{name} | {mode} | {view}',fill='#202020')
 canvas.save(p/f'check-{name}.png')
canvas=Image.new('RGB',(1024,1080),'#f2efea');d=ImageDraw.Draw(canvas)
for row,view in enumerate(['','-back']):
 for col,pose in enumerate(['up','down']):
  canvas.paste(Image.open(p/f'fuurou-flap-{pose}{view}.png').convert('RGB'),(512*col,540*row+28));d.text((512*col+15,540*row+8),f'{pose} 35 degrees | {"back" if view else "front"}',fill='#202020')
canvas.save(p/'check-fuurou-flap.png')
