"""Measure native ImageGen flat parts and register joints; never repaint pixels."""
from pathlib import Path
import json, hashlib
import numpy as np
from PIL import Image

root = Path(__file__).resolve().parents[1]
source = root / 'assets/art/pico-flat-v1.png'
im = Image.open(source)
alpha = np.asarray(im.getchannel('A'))
rows = [0, 330, 625, 950, im.height]
names = ['head','torso','earLeft','earRight','upperArmLeft','forearmLeft','upperArmRight','forearmRight','thighLeft','lowerLegLeft','thighRight','lowerLegRight','satchel','strap','book','map']
anchors = {
 'head':([157,278],None,.70),'torso':([477,80],None,.46),
 'earLeft':([785,287],None,.48),'earRight':([1060,282],None,.40),
 'upperArmLeft':([221,409],[120,548],.33),'forearmLeft':([458,394],[468,552],.33),
 'upperArmRight':([716,410],[816,548],.33),'forearmRight':([1047,551],[1135,425],.33),
 'thighLeft':([180,695],[145,859],.35),'lowerLegLeft':([482,709],[478,832],.43),
 'thighRight':([722,695],[781,858],.35),'lowerLegRight':([1080,709],[1075,832],.43),
 'satchel':([157,1024],None,.32),'strap':([574,999],None,.28),
 'book':([782,1100],None,.40),'map':([1094,1110],None,.40)}
parts = {}
for i, name in enumerate(names):
 row, col = divmod(i,4)
 x0,x1 = round(col*im.width/4),round((col+1)*im.width/4)
 y0,y1 = rows[row],rows[row+1]
 ys,xs = np.where(alpha[y0:y1,x0:x1]>180)
 l,t=max(x0,int(xs.min())+x0-2),max(y0,int(ys.min())+y0-2)
 r,b=min(x1,int(xs.max())+x0+3),min(y1,int(ys.max())+y0+3)
 pivot,end,scale=anchors[name]
 parts[name]={'frame':{'x':l,'y':t,'w':r-l,'h':b-t},'pivot':pivot,'scale':scale}
 if end: parts[name]['end']=end
# Native ankle pixels overlap the separately pivoting native feet.
parts['lowerLegLeft']['frame']={'x':429,'y':669,'w':111,'h':168}
parts['lowerLegRight']['frame']={'x':1021,'y':671,'w':110,'h':166}
parts['footLeft']={'frame':{'x':330,'y':809,'w':209,'h':104},'pivot':[478,832],'scale':.43}
parts['footRight']={'frame':{'x':1034,'y':814,'w':201,'h':98},'pivot':[1075,832],'scale':.43}
data={'src':'assets/art/pico-flat-v1.png','atlas':{'width':im.width,'height':im.height},'sourceSha256':hashlib.sha256(source.read_bytes()).hexdigest(),'parts':parts}
(root/'assets/art/pico-flat-v1.frames.json').write_text(json.dumps(data,indent=2)+'\n',encoding='utf-8')
print(json.dumps(data))
