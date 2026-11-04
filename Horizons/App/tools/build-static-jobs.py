"""Measure whole static native PNG illustrations without changing their pixels."""
from pathlib import Path
from PIL import Image
import numpy as np
from scipy.ndimage import label
import json,hashlib
root=Path(__file__).resolve().parents[1]
groups=[['teacher','chef','doctor','office worker'],['receptionist','salesclerk','taxi driver','waiter'],['waitress','farmer','nurse','dentist'],['police officer','actor','student','driver','school']]
fragment={'version':1,'kind':'proposed-static-whole-illustration-vocabulary','sharedManifestUnmodified':True,'vocabulary':{}}
record={'version':1,'kind':'new-native-whole-static-occupation-atlases','method':'Native built-in ImageGen PNG and alpha unchanged; measured rectangular crops only.','atlases':[]}
for i,terms in enumerate(groups,1):
 src=f'assets/art/jobs-static-{i}-v{3 if i==3 else 2}.png';im=Image.open(root/src).convert('RGBA');a=np.array(im);w,h=im.size;cols=3 if i==4 else 2;cw=w/cols;ch=h/2;items=[]
 for cell,term in enumerate(terms):
  x0,x1=round((cell%cols)*cw),round((cell%cols+1)*cw);y0,y1=round((cell//cols)*ch),round((cell//cols+1)*ch)
  lab,n=label(a[y0:y1,x0:x1,3]>128);counts=np.bincount(lab.ravel());keep=np.flatnonzero(counts>100);keep=keep[keep!=0];yy,xx=np.where(np.isin(lab,keep))
  bbox={'x':int(xx.min()+x0),'y':int(yy.min()+y0),'w':int(xx.max()-xx.min()+1),'h':int(yy.max()-yy.min()+1)}
  left=max(x0,bbox['x']-12);top=max(y0,bbox['y']-12);right=min(x1,bbox['x']+bbox['w']+12);bottom=min(y1,bbox['y']+bbox['h']+12)
  frame={'x':left,'y':top,'w':right-left,'h':bottom-top};components=[]
  for k in keep:
   cy,cx=np.where(lab==k);components.append({'area':int(counts[k]),'x':int(cx.min()+x0),'y':int(cy.min()+y0),'w':int(cx.max()-cx.min()+1),'h':int(cy.max()-cy.min()+1)})
  fragment['vocabulary'][term]={'src':src,'atlas':{'width':w,'height':h},'frame':frame,'animation':None}
  items.append({'term':term,'cell':cell,'frame':frame,'nativeOpaqueBounds':bbox,'opaqueComponents':sorted(components,key=lambda v:-v['area'])})
 record['atlases'].append({'src':src,'atlas':{'width':w,'height':h},'sha256':hashlib.sha256((root/src).read_bytes()).hexdigest(),'grid':{'columns':cols,'rows':2},'items':items})
(root/'assets/art/jobs-static-v1.frames.json').write_text(json.dumps(record,indent=2)+'\n',encoding='utf-8')
(root/'reports/static-jobs-fragment.json').write_text(json.dumps(fragment,indent=2)+'\n',encoding='utf-8')
print(json.dumps({t:{'frame':a['frame'],'components':next(j['opaqueComponents'] for s in record['atlases'] for j in s['items'] if j['term']==t)} for t,a in fragment['vocabulary'].items()},indent=2))
