"""Mechanical selection of existing ImageGen features; no new feature strokes.

All files share the 248x582 rig canvas. Native sources stay unchanged.
"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageChops, ImageFilter
import numpy as np
f=Path(__file__).resolve().parents[1]/'assets/art/pico-banner-motion-v1'
a=np.array(Image.open(f/'head-registered.png').convert('RGBA'))
def select(name,regions):
 mask=np.zeros(a.shape[:2],bool)
 for box,predicate in regions:
  x0,y0,x1,y1=box
  mask[y0:y1,x0:x1]|=predicate(a[y0:y1,x0:x1,:3])
 out=a.copy();out[:,:,3]=np.where(mask,a[:,:,3],0)
 Image.fromarray(out).save(f/name)
dark=lambda p:p.max(2)<165
eyes=lambda p:(p.max(2)<165)|(p.min(2)>205)
select('face-neutral-eyes.png', [((87,155,113,188),eyes),((115,154,139,187),eyes)])
# Remove pupils from this layer: they remain their own moving native sprite.
im=np.array(Image.open(f/'face-neutral-eyes.png'));black=im[:,:,:3].max(2)<125
im[black,:3]=[250,250,250];Image.fromarray(im).save(f/'face-neutral-eyes.png')
select('face-neutral-brows-mouth.png', [((70,135,146,155),dark),((96,199,139,246),lambda p:p[:,:,1]<165)])
select('face-nose.png',[((132,186,181,219),lambda p:(p[:,:,0]>175)&(p[:,:,1]<160)&(p[:,:,2]<130))])
blink=np.array(Image.open(f/'blink-registered.png').convert('RGBA'))
blink[:,:,3]=np.where(blink[:,:,:3].max(2)<165,blink[:,:,3],0)
Image.fromarray(blink).save(f/'face-blink-eyelids.png')
gen=np.array(Image.open(f/'check-face-native-v2.png').convert('RGBA').resize((130,123),Image.Resampling.LANCZOS))
rgb=gen[:,:,:3];feature=((rgb.max(2)<145)|(rgb.min(2)>220))&(gen[:,:,3]>200)
# Select only the two expression-feature regions; exclude the native black exterior.
regions=np.zeros(feature.shape,bool)
regions[5:65,14:84]=True
regions[75:111,39:79]=True
feature&=regions
gen[:,:,3]=np.where(feature,gen[:,:,3],0)
out=np.zeros_like(a);out[130:253,60:190]=gen
Image.fromarray(out).save(f/'face-inspect-features.png')

# Register the native ImageGen faceless result using uniform scale and alpha selection.
im=Image.open(f/'head-faceless-native-v1.png').convert('RGBA')
alpha=im.getchannel('A')
mask=alpha.point(lambda x:255 if x>180 else 0).filter(ImageFilter.MinFilter(3)).filter(ImageFilter.MaxFilter(3))
ImageDraw.floodfill(mask,(im.width//2,im.height//2),128)
sel=Image.fromarray(np.uint8(np.array(mask)==128)*255).filter(ImageFilter.MaxFilter(3))
im.putalpha(ImageChops.darker(alpha,sel));im=im.crop(im.getbbox())
im=im.resize((round(im.width*279/im.height),279),Image.Resampling.LANCZOS)
layer=Image.new('RGBA',(248,582));layer.alpha_composite(im,(31,3))
layer.save(f/'head-faceless-registered.png')
