"""Read native alpha and save rig viewports/anchors. Does not edit image pixels."""
from pathlib import Path
from collections import deque
import hashlib,json
import numpy as np
from PIL import Image

root=Path(__file__).resolve().parent.parent
file=root/'assets/art/pico-articulated-v3.png'
im=Image.open(file);alpha=np.asarray(im.getchannel('A'));rows=[0,339,625,953,im.height]
names=['head','torso','earLeft','earRight','upperArmLeft','forearmLeft','upperArmRight','forearmRight','thighLeft','lowerLegLeft','thighRight','lowerLegRight','satchel','strap','book','map']
anchors={
 'head':([170,277],None,.62),'torso':([477,68],None,.46),
 'earLeft':([786,287],None,.48),'earRight':([986,281],None,.40),
 'upperArmLeft':([190,397],[116,559],.33),'forearmLeft':([493,395],[451,560],.33),
 'upperArmRight':([724,398],[790,559],.33),'forearmRight':([1025,559],[1134,450],.33),
 'thighLeft':([166,700],[143,881],.35),'lowerLegLeft':([420,689],[422,824],.39),
 'thighRight':([770,701],[789,878],.35),'lowerLegRight':([1096,689],[1047,824],.39),
 'satchel':([156,1024],None,.32),'strap':([574,999],None,.28),
 'book':([779,1111],None,.40),'map':([1092,1114],None,.40)}

def bounds(region):
 x0,y0,x1,y1=region;mask=(alpha[y0:y1,x0:x1]>180).copy();best=[]
 for sy,sx in np.argwhere(mask):
  if not mask[sy,sx]:continue
  q=deque([(int(sy),int(sx))]);mask[sy,sx]=False;points=[]
  while q:
   y,x=q.popleft();points.append((y,x))
   for yy,xx in ((y-1,x),(y+1,x),(y,x-1),(y,x+1)):
    if 0<=yy<mask.shape[0] and 0<=xx<mask.shape[1] and mask[yy,xx]:mask[yy,xx]=False;q.append((yy,xx))
  if len(points)>len(best):best=points
 ys,xs=zip(*best);l=max(x0,min(xs)+x0-2);t=max(y0,min(ys)+y0-2);r=min(x1,max(xs)+x0+3);b=min(y1,max(ys)+y0+3)
 return dict(x=l,y=t,w=r-l,h=b-t)

parts={}
for i,name in enumerate(names):
 row,col=divmod(i,4);region=(round(col*im.width/4),rows[row],round((col+1)*im.width/4),rows[row+1])
 pivot,end,scale=anchors[name];parts[name]={'frame':bounds(region),'pivot':pivot,'scale':scale}
 if end:parts[name]['end']=end
# Split each lower leg at a registered, overlapping ankle. Feet can then stay
# planted while the knee flexes; native raster pixels are never repainted.
parts['lowerLegLeft']['frame']=dict(x=359,y=642,w=118,h=190)
parts['lowerLegLeft']['clip']='polygon(0 0,100% 0,100% 88.4%,85.6% 88.4%,85.6% 100%,0 100%)'
parts['lowerLegRight']['frame']=dict(x=997,y=648,w=129,h=184)
parts['lowerLegRight']['clip']='polygon(0 0,100% 0,100% 88%,72.1% 88%,72.1% 100%,0 100%)'
parts['footLeft']={'frame':dict(x=365,y=812,w=222,h=118),'pivot':[422,824],'scale':.39,'mirror':True}
parts['footRight']={'frame':dict(x=997,y=812,w=236,h=121),'pivot':[1047,824],'scale':.39}
data={'src':'assets/art/pico-articulated-v3.png','atlas':{'width':im.width,'height':im.height},'sourceSha256':hashlib.sha256(file.read_bytes()).hexdigest(),'parts':parts}
(root/'assets/art/pico-articulated-v3.frames.json').write_text(json.dumps(data,indent=2)+'\n',encoding='utf-8')
p=root/'assets/art/pico-articulated-v3.provenance.json';prov=json.loads(p.read_text(encoding='utf-8'));prov['sha256']=data['sourceSha256'];p.write_text(json.dumps(prov,indent=2)+'\n',encoding='utf-8')
print(json.dumps(data))
