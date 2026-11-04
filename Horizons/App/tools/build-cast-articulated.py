"""Read native ImageGen part bounds and emit viewport/pivot metadata. No pixels edited."""
from pathlib import Path
from PIL import Image
from collections import deque
import json,hashlib,numpy as np
art=Path(__file__).resolve().parents[1]/'assets/art'
names=['head','torso','upperLeft','lowerLeft','upperRight','lowerRight','thighLeft','shinLeft','thighRight','shinRight','accessory','prop']
def component(a,region):
 x0,y0,x1,y1=map(int,region);m=(a[y0:y1,x0:x1]>130).copy();cs=[]
 for sy,sx in np.argwhere(m):
  if not m[sy,sx]:continue
  q=deque([(int(sy),int(sx))]);m[sy,sx]=False;l=r=int(sx);t=b=int(sy);n=0
  while q:
   y,x=q.popleft();n+=1;l=min(l,x);r=max(r,x);t=min(t,y);b=max(b,y)
   for yy,xx in ((y-1,x),(y+1,x),(y,x-1),(y,x+1)):
    if 0<=yy<m.shape[0] and 0<=xx<m.shape[1] and m[yy,xx]:m[yy,xx]=False;q.append((yy,xx))
  cs.append((n,l+x0,t+y0,r+x0+1,b+y0+1))
 _,l,t,r,b=max(cs);return {'x':max(0,l-2),'y':max(0,t-2),'w':r-l+4,'h':b-t+4}
def center(a,box,y):
 yy=int(box['y']+y*box['h']);xs=np.flatnonzero(a[yy,box['x']:box['x']+box['w']]>130)
 return float((xs.min()+xs.max())/2) if len(xs) else box['w']/2
result={'version':4,'kind':'native-articulated-parts','characters':{}}
for char in ['mina','alex','jo']:
 file=f'{char}-articulated-v3.png';im=Image.open(art/file);a=np.asarray(im.getchannel('A'));w,h=im.size;parts={}
 for i,name in enumerate(names):
  c=i%4;r=i//4;pad=30 if name=='head' else 6
  box=component(a,(max(0,c*w/4-pad),max(0,r*h/3-6),min(w,(c+1)*w/4+pad),min(h,(r+1)*h/3+6)))
  if name=='head':pin={'x':center(a,box,.92),'y':box['h']*.92};end=None
  elif name=='torso':pin={'x':center(a,box,.12),'y':box['h']*.12};end=None
  elif name.startswith(('upper','thigh')):
   pin={'x':center(a,box,.14),'y':box['h']*.14};end={'x':center(a,box,.86),'y':box['h']*.86}
  elif name.startswith(('lower','shin')):
   pin={'x':center(a,box,.12),'y':box['h']*.12};end={'x':center(a,box,.71 if name.startswith('lower') else .86),'y':box['h']*(.71 if name.startswith('lower') else .86)}
  else:pin={'x':box['w']/2,'y':box['h']/2};end=None
  parts[name]={'frame':box,'pin':pin,**({'end':end}if end else{})}
 for side in ['Left','Right']:
  original=parts['shin'+side];box=original['frame'];fullH=box['h'];cx=int(box['x']+original['pin']['x']);ankle=box['y']+int(fullH*.72)
  rgb=np.asarray(im)
  for yy in range(box['y']+int(fullH*.58),box['y']+int(fullH*.88)):
   red,green,blue,alpha=map(int,rgb[yy,cx])
   if alpha>170 and red>green*1.15 and red>blue*1.3:ankle=yy;break
  pivotX=center(a,box,(ankle-box['y'])/fullH);ankleY=ankle-box['y']+4
  original['nativeFullHeight']=fullH;original['end']={'x':pivotX,'y':ankleY};original['frame']={**box,'h':ankleY+int(fullH*.025)}
  cropY=max(box['y'],ankle-int(fullH*.025));parts['foot'+side]={'frame':{'x':box['x'],'y':cropY,'w':box['w'],'h':box['y']+fullH-cropY},'pin':{'x':pivotX,'y':box['y']+ankleY-cropY},'nativeFullHeight':fullH}
 if char in ['mina','alex']:
  torsoFile=f'{char}-articulated-v4.png';ti=Image.open(art/torsoFile);ta=np.asarray(ti.getchannel('A'));tw,th=ti.size;box=component(ta,(tw/4-6,0,tw/2+6,th/3+6))
  parts['torso']={'src':'assets/art/'+torsoFile,'atlas':{'width':tw,'height':th},'sha256':hashlib.sha256((art/torsoFile).read_bytes()).hexdigest(),'frame':box,'pin':{'x':center(ta,box,.12),'y':box['h']*.12}}
 result['characters'][char]={'src':'assets/art/'+file,'atlas':{'width':w,'height':h},'sha256':hashlib.sha256((art/file).read_bytes()).hexdigest(),'parts':parts}
(art/'cast-articulated-v4.frames.json').write_text(json.dumps(result,indent=2)+'\n',encoding='utf-8')
print(json.dumps({c:{n:p['frame']for n,p in d['parts'].items()}for c,d in result['characters'].items()}))
