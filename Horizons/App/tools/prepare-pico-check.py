"""Separate native pupils and register ImageGen expression, without drawing feature strokes."""
from pathlib import Path
from PIL import Image
import numpy as np
f=Path(__file__).resolve().parents[1]/'assets/art/pico-banner-motion-v1'
a=np.array(Image.open(f/'head-registered.png').convert('RGBA'))
pup=np.zeros_like(a);eye=np.zeros(a.shape[:2],dtype=np.uint8)
for x0,y0,x1,y1 in [(87,155,113,188),(115,154,139,187)]:
 region=a[y0:y1,x0:x1];dark=region[:,:,:3].max(2)<125;white=region[:,:,:3].min(2)>200
 eye[y0:y1,x0:x1]=(dark|white)*255
 pup[y0:y1,x0:x1]=region;pup[y0:y1,x0:x1,3]=dark*255
 region[dark,:3]=[250,250,250]
Image.fromarray(a).save(f/'head-look-base.png')
Image.fromarray(pup).save(f/'pupils-native.png')
Image.fromarray(eye).save(f/'eyes-mask.png')
a=np.array(Image.open(f/'head-registered.png').convert('RGBA'))
orig=a[130:253,60:190].copy()
gen=np.array(Image.open(f/'check-face-native-v2.png').convert('RGBA').resize((130,123),Image.Resampling.LANCZOS))
skin=(orig[:,:,0]>225)&(orig[:,:,1]>165)&(orig[:,:,1]<220)&(orig[:,:,2]>125)&(orig[:,:,2]<205)
patch=orig.copy()
for y in range(123):
 samples=orig[max(0,y-3):min(123,y+4),:,:3][skin[max(0,y-3):min(123,y+4)]]
 color=np.median(samples,axis=0) if len(samples) else [242,191,150]
 patch[y,:,:3]=color
rgb=gen[:,:,:3]
feature=((rgb.max(2)<145)|(rgb.min(2)>220))&(gen[:,:,3]>200)
patch[feature,:3]=rgb[feature]
nose=np.zeros(skin.shape,bool);nose[58:88,74:125]=True
nose&=(orig[:,:,0]>180)&(orig[:,:,1]<155)&(orig[:,:,2]<120)
patch[nose]=orig[nose]
layer=np.zeros_like(a);layer[130:253,60:190]=patch
Image.fromarray(layer).save(f/'check-face-registered.png')
