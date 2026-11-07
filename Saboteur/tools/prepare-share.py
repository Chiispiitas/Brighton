"""Lay out the supplied card faces and background as a 1200×630 sharing graphic."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageOps, ImageFilter

assets = Path(__file__).resolve().parents[1] / 'assets'
canvas = ImageOps.fit(Image.open(assets/'mine.webp').convert('RGB'),(1200,630)).convert('RGBA')
draw = ImageDraw.Draw(canvas)
font_root = Path('C:/Windows/Fonts')
title = ImageFont.truetype(str(font_root/'georgiab.ttf'),88)
label = ImageFont.truetype(str(font_root/'arial.ttf'),23)
draw.text((65,170),'BRIGHTON',font=label,fill='#54554e')
draw.text((60,213),'Saboteur',font=title,fill='#29322f')
draw.text((67,338),'3–10 players · 3 rounds',font=label,fill='#53594f')
for name,angle,position in [('miner',8,(660,170)),('saboteur',-8,(875,210))]:
    card=Image.open(assets/'cards'/f'{name}.webp').convert('RGBA').resize((205,320),Image.Resampling.LANCZOS)
    mask=Image.new('L',card.size,0)
    ImageDraw.Draw(mask).rounded_rectangle((0,0,204,319),radius=16,fill=255)
    card.putalpha(mask)
    card=card.rotate(angle,Image.Resampling.BICUBIC,expand=True)
    shadow=Image.new('RGBA',card.size,(25,30,26,85));shadow.putalpha(card.getchannel('A').point(lambda x:int(x*.26)))
    canvas.alpha_composite(shadow.filter(ImageFilter.GaussianBlur(4)),(position[0]+5,position[1]+7))
    canvas.alpha_composite(card,position)
canvas.convert('RGB').save(assets/'saboteur-share-v1.jpg',quality=92)
print('Saved 1200×630 share graphic using the supplied cards.')
