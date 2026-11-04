from pathlib import Path
from PIL import Image
import numpy as np,json,hashlib
from collections import deque
root=Path(__file__).resolve().parent.parent;art=root/'assets/art'
def bounds(im,region,union=False):
 x0,y0,x1,y1=map(int,region);a=np.asarray(im.getchannel('A'))[y0:y1,x0:x1];mask=(a>170).copy();comps=[]
 for sy,sx in np.argwhere(mask):
  if not mask[sy,sx]:continue
  q=deque([(int(sy),int(sx))]);mask[sy,sx]=False;n=0;left=right=int(sx);top=bottom=int(sy)
  while q:
   y,x=q.popleft();n+=1;left=min(left,x);right=max(right,x);top=min(top,y);bottom=max(bottom,y)
   for yy,xx in ((y-1,x),(y+1,x),(y,x-1),(y,x+1)):
    if 0<=yy<mask.shape[0]and 0<=xx<mask.shape[1]and mask[yy,xx]:mask[yy,xx]=False;q.append((yy,xx))
  if n>12:comps.append((n,left,top,right,bottom))
 assert comps,region
 comps.sort(reverse=True);selected=[c for c in comps if c[0]>=max(20,comps[0][0]*.015)]if union else comps[:1]
 l=min(c[1]for c in selected)+x0;t=min(c[2]for c in selected)+y0;r=max(c[3]for c in selected)+x0;b=max(c[4]for c in selected)+y0;pad=2
 return {'x':max(x0,l-pad),'y':max(y0,t-pad),'w':min(x1,r+pad+1)-max(x0,l-pad),'h':min(y1,b+pad+1)-max(y0,t-pad)}
def asset(file,frame):
 im=Image.open(art/file)
 return {'src':'assets/art/'+file,'atlas':{'width':im.width,'height':im.height},'frame':frame}
im=Image.open(art/'pico-rig-v2.png');rows=[0,370,620,965,im.height];names=['torso','head','earLeft','earRight','upperArmLeft','forearmLeft','upperArmRight','forearmRight','legLeft','legRight','satchel','strap','eyesOpen','eyesClosed','mouthSmile','mouthO']
pico={}
for i,name in enumerate(names):
 c=i%4;r=i//4;frame=bounds(im,(c*im.width/4,rows[r],(c+1)*im.width/4,rows[r+1]),union=name.startswith('eyes'));pico[name]=asset('pico-rig-v2.png',frame)
im=Image.open(art/'companions-v1.png');companions={}
for col,name in enumerate(['mina','alex','jo']):
 companions[name]={}
 for row,pose in enumerate(['idle','wave','celebrate']):
  frame=bounds(im,(col*im.width/3,row*im.height/3,(col+1)*im.width/3,(row+1)*im.height/3));companions[name][pose]=asset('companions-v1.png',frame)
im=Image.open(art/'avatar-kit-v2.png');rows=[0,330,660,860,im.height]
labels=[['Porcelain','Peach','Honey','Caramel','Chestnut','Deep brown'],['Magenta hoodie','Teal summer','Explorer jacket','Orange sweater','Teal overalls','Magenta cardigan'],['Side part','Short curls','Long straight','Twin puffs','Blonde bob','Soft waves'],['Round glasses','Orange cap','Teal headphones','Pico satchel','Orange scarf','Navy backpack']]
groups=['skin','outfit','hair','accessory'];avatars={g:[]for g in groups}
positions={'skin':{'x':.2,'y':.04,'w':.6,'h':.94,'z':1},'outfit':{'x':.16,'y':.39,'w':.68,'h':.6,'z':2},'hair':{'x':.28,'y':.025,'w':.44,'h':.3,'z':4}}
accessoryPos=[{'x':.32,'y':.16,'w':.36,'h':.1,'z':5},{'x':.27,'y':.015,'w':.46,'h':.19,'z':6},{'x':.26,'y':.09,'w':.48,'h':.24,'z':6},{'x':.33,'y':.35,'w':.42,'h':.39,'z':5},{'x':.36,'y':.28,'w':.3,'h':.28,'z':5},{'x':.22,'y':.32,'w':.56,'h':.48,'z':0}]
for row,group in enumerate(groups):
 for col,label in enumerate(labels[row]):
  frame=bounds(im,(col*im.width/6,rows[row],(col+1)*im.width/6,rows[row+1]),union=group in ['outfit','accessory']);entry={'id':f'{group}-{col+1}','label':label,'group':group,**asset('avatar-kit-v2.png',frame),'position':accessoryPos[col]if group=='accessory'else positions[group]};avatars[group].append(entry)
icons={};im=Image.open(art/'ui-objects-v1.png')
for i,name in enumerate(['home','book','games','profile','flame','star','trophy','satchel','sound','key','calendar','compass','settings','flag','heart','addBook']):
 c=i%4;r=i//4;icons[name]=asset('ui-objects-v1.png',bounds(im,(c*im.width/4,r*im.height/4,(c+1)*im.width/4,(r+1)*im.height/4),union=name=='sound'))
vocab={};im=Image.open(art/'jobs-v1.png')
for i,name in enumerate(['teacher','student','chef','doctor','office worker','receptionist','salesclerk','taxi driver','waiter','waitress','farmer','nurse','dentist','police officer','driver','actor']):
 c=i%4;r=i//4;vocab[name]=asset('jobs-v1.png',bounds(im,(c*im.width/4,r*im.height/4,(c+1)*im.width/4,(r+1)*im.height/4),union=True))
im=Image.open(art/'town-v1.png');scenes={'town':asset('town-v1.png',bounds(im,(0,0,im.width,im.height),union=True))}
avatars['hair'].append({'id':'none','label':'No hair','group':'hair'})
avatars['accessory'].insert(0,{'id':'none','label':'No extra','group':'accessory'})
avatars['badge']=[{'id':'none','label':'No pin','group':'badge'}]
for name,label,xp in [('star','First steps',25),('trophy','Word explorer',100),('compass','New horizons',250)]:
 avatars['badge'].append({'id':name+'-pin','label':label,'group':'badge','unlockXp':xp,**icons[name],'position':{'x':.56,'y':.43,'w':.11,'h':.095,'z':8}})
manifest={'version':1,'pico':{'parts':pico},'companions':companions,'avatar':avatars,'scenes':scenes,'icons':icons,'vocabulary':vocab}
(art/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n',encoding='utf8')
print(json.dumps({'picoParts':len(pico),'companions':len(companions),'avatarLayers':sum(map(len,avatars.values())),'path':str(art/'manifest.json')}))
