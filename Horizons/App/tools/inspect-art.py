from PIL import Image
from pathlib import Path
import numpy as np,json
b=Path(__file__).resolve().parent.parent/'assets/art'
for n in ['pico-rig-v2.png','companions-v1.png','avatar-kit-v1.png','avatar-kit-v2.png']:
 im=Image.open(b/n);a=np.asarray(im)
 print(n,im.mode,im.size,im.getextrema()[-1],{str(p):im.getpixel(p)for p in [(0,0),(im.width//2,0),(0,im.height//2),(im.width//12,im.height//4)]},'transparentFraction',float((a[:,:,3]==0).mean()),'opaqueFraction',float((a[:,:,3]==255).mean()))
