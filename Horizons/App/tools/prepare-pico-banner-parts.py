"""Mechanical masks/registration of ImageGen outputs explicitly requested by user.

No character anatomy, face, clothing or eyelid strokes are drawn here. ImageDraw
is used only for alpha selection masks. Native generated files stay untouched.
"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter, ImageChops
import numpy as np
import json

root=Path(__file__).resolve().parents[1]
folder=root/'assets/art/pico-banner-motion-v1'
parts={
 'head':{'file':'head-v2-masked.png','x':31,'y':3,'scale':.204,'pivot':[120,267]},
 'body':{'file':'body-v2-masked.png','x':7,'y':240,'scale':.2236,'pivot':[124,578],'clipY':253},
 'map':{'file':'map-hands-v2-masked.png','x':8,'y':265,'scale':.1668,'pivot':[126,327]}
}
for name in ['head-v2','body-v2','map-hands-v2']:
 image=Image.open(folder/(name+'.png')).convert('RGBA')
 alpha=np.array(image.getchannel('A'))
 selection=Image.fromarray(np.uint8(alpha>180)*255).filter(ImageFilter.MinFilter(3)).filter(ImageFilter.MaxFilter(3))
 ys,xs=np.where(np.array(selection)>0)
 seed=(int(xs[len(xs)//2]),int(ys[len(ys)//2]))
 ImageDraw.floodfill(selection,seed,128,thresh=0)
 main=Image.fromarray(np.uint8(np.array(selection)==128)*255).filter(ImageFilter.MaxFilter(3))
 derived=image.copy();derived.putalpha(Image.fromarray(np.minimum(alpha,np.array(main))))
 derived.crop(derived.getbbox()).save(folder/(name+'-masked.png'))

neutral=Image.new('RGBA',(248,582))
for name,registration in parts.items():
 image=Image.open(folder/registration['file'])
 image=image.resize((round(image.width*registration['scale']),round(image.height*registration['scale'])),Image.Resampling.LANCZOS)
 layer=Image.new('RGBA',neutral.size)
 layer.alpha_composite(image,(registration['x'],registration['y']))
 if 'clipY' in registration:
  # Omit the generated extra chin/neck above the shirt; the separate head owns it.
  layer.paste((0,0,0,0),(0,0,248,registration['clipY']))
 layer.save(folder/(name+'-registered.png'));neutral.alpha_composite(layer)
neutral.save(folder/'neutral-reconstruction.png')

patch=Image.open(folder/'blink-native-v1.png').convert('RGBA').resize((56,36),Image.Resampling.LANCZOS)
layer=Image.new('RGBA',neutral.size);layer.alpha_composite(patch,(84,154))
selection=Image.new('L',neutral.size)
ImageDraw.Draw(selection).rounded_rectangle((85,154,139,189),radius=3,fill=255)
selection=selection.filter(ImageFilter.GaussianBlur(.65))
layer.putalpha(ImageChops.multiply(layer.getchannel('A'),selection));layer.save(folder/'blink-registered.png')
closed=neutral.copy();closed.alpha_composite(layer);closed.save(folder/'closed-reconstruction.png')
(folder/'registration.json').write_text(json.dumps({'canvas':[248,582],'parts':parts},indent=2)+'\n')
print('Prepared generated-part masks and uniform registrations; native sources unchanged.')
