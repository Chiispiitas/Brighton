"""Extract complete registered decoration cells; retain the untouched native source.
No drawing, recoloring or environment compositing. PIL/numpy are build-time only.
"""
from pathlib import Path
from PIL import Image
import numpy as np
import json,hashlib
folder=Path(__file__).resolve().parents[1]/'assets/art/overworld-tiles-v1'
native=Image.open(folder/'plants-native-v2.png').convert('RGBA')
assert native.size==(1536,1024), 'Expected authored 3x2 atlas of 512px cells'
pixels=np.array(native);rgb=pixels[:,:,:3].astype(float)
key=np.minimum(rgb[:,:,0],rgb[:,:,2])>rgb[:,:,1]*1.3+15
pixels[:,:,3]=np.where(key,0,255);atlas=Image.fromarray(pixels)
records=[]
for i,name in enumerate(['tree-round','tree-slender','bush','bush-flowers','flowers','grass']):
 x=(i%3)*512;y=(i//3)*512;cell=atlas.crop((x,y,x+512,y+512));box=cell.getbbox();assert box
 crop=cell.crop(box);crop.save(folder/(name+'.png'))
 records.append({'id':name,'file':name+'.png','sourceCell':[x,y,512,512],'trimBox':box,'dimensions':crop.size,'sha256':hashlib.sha256((folder/(name+'.png')).read_bytes()).hexdigest()})
(folder/'tileset.json').write_text(json.dumps({'nativeSource':'plants-native-v2.png','grid':[3,2],'cellSize':[512,512],'method':'Mechanical magenta-key alpha mask (min(R,B)>1.3*G+15) and per-cell trim. Visible RGB pixels unchanged; original native file unchanged. No drawn/recolored content.','tiles':records},indent=2)+'\n')
print('Prepared six standalone native plant tiles.')
