"""Mechanical alpha selection/cropping only; native ImageGen files stay unchanged."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter, ImageChops
import numpy as np
import json
folder=Path(__file__).resolve().parents[1]/'assets/art/overworld-unit1-v1'
def component(image):
 image=image.convert('RGBA');alpha=image.getchannel('A')
 selection=alpha.point(lambda a:255 if a>180 else 0).filter(ImageFilter.MinFilter(3)).filter(ImageFilter.MaxFilter(3))
 y,x=np.where(np.array(selection)>0)
 i=np.argmin((x-image.width/2)**2+(y-image.height/2)**2)
 ImageDraw.floodfill(selection,(int(x[i]),int(y[i])),128)
 selection=Image.fromarray(np.uint8(np.array(selection)==128)*255).filter(ImageFilter.MaxFilter(3))
 image.putalpha(ImageChops.darker(alpha,selection))
 return image.crop(image.getbbox())
atlas=Image.open(folder/'landmarks-native.png');w,h=atlas.size
records=[]
for i in range(4):
 x=(i%2)*(w//2);y=(i//2)*(h//2)
 box=(x,y,w if i%2 else w//2,h if i//2 else h//2)
 sprite=component(atlas.crop(box));sprite.save(folder/f'landmark-{i}.png')
 records.append({'file':f'landmark-{i}.png','source':'landmarks-native.png','sourceBox':box,'dimensions':sprite.size,'operation':'Connected alpha selection and crop; no redrawn pixels'})
atlas=Image.open(folder/'wildlife-native.png');w,h=atlas.size
for i,name in enumerate(['bird','butterfly']):
 box=(i*(w//2),0,(i+1)*(w//2) if i==0 else w,h)
 sprite=component(atlas.crop(box));sprite.save(folder/(name+'.png'))
 records.append({'file':name+'.png','source':'wildlife-native.png','sourceBox':box,'dimensions':sprite.size,'operation':'Connected alpha selection and crop; no redrawn pixels'})
(folder/'sprite-registration.json').write_text(json.dumps(records,indent=2)+'\n')
print('Prepared four landmark and two wildlife native cutouts.')
