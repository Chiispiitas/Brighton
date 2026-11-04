"""Read native ImageGen alpha; write viewports and measured articulation pins only."""
from pathlib import Path
from PIL import Image
import numpy as np, json, hashlib
app=Path(__file__).resolve().parent.parent; art=app/'assets/art'
def atlas(name):
 im=Image.open(art/name);return im,{'src':'assets/art/'+name,'atlas':{'width':im.width,'height':im.height}}
def frame(im,region):
 x0,y0,x1,y1=map(int,region);a=np.asarray(im.getchannel('A'));ys,xs=np.where(a[y0:y1,x0:x1]>170)
 if not len(xs):return None
 l=max(x0,x0+int(xs.min())-2);t=max(y0,y0+int(ys.min())-2);r=min(x1,x0+int(xs.max())+3);b=min(y1,y0+int(ys.max())+3)
 return {'x':l,'y':t,'w':r-l,'h':b-t}
clothing,cloth=atlas('avatar-clothed-kit-v1.png');sleeves,sleevemeta=atlas('avatar-clothed-kit-v2.png');skin,skinmeta=atlas('avatar-clothed-skin-v1.png');think,thinkmeta=atlas('avatar-clothed-think-v1.png');jacket,jacketmeta=atlas('avatar-clothed-jacket-v1.png')
outfits={};skins={}
collars=[149,151,140,153,151,153]
for i in range(6):
 torso=frame(clothing,(i*256,0,(i+1)*256,360))
 upper,fore=[frame(sleeves,(i*256,y0,(i+1)*256,y1))for y0,y1 in [(360,690),(690,1024)]]
 outfits[f'outfit-{i+1}']={'torso':torso,'collarBottom':collars[i],'sleeveAsset':sleevemeta,'upperSleeve':{'frame':upper,'pin':{'x':upper['x']+upper['w']/2,'y':465},'scale':.35},'foreSleeve':{'frame':fore,'pin':{'x':fore['x']+fore['w']/2,'y':746},'wristY':917}if fore else None}
 sf=[frame(skin,(i*256,y0,(i+1)*256,y1))for y0,y1 in [(0,360),(360,690),(690,1024)]]
 up,fo,ha=sf
 tf=frame(think,(i*think.width/6,0,(i+1)*think.width/6,think.height))
 a=np.asarray(think.getchannel('A'));sub=a[tf['y']+2:tf['y']+15,tf['x']:tf['x']+tf['w']];ys,xs=np.where(sub>170);tx=tf['x']+float(np.median(xs))
 skins[f'skin-{i+1}']={'upper':{'frame':up,'pin':{'x':up['x']+up['w']/2,'y':124.5},'elbowY':309},'fore':{'frame':fo,'pin':{'x':fo['x']+fo['w']/2,'y':436},'wristY':643},'hand':{'frame':ha,'pin':{'x':ha['x']+ha['w']*.55,'y':ha['y']+10},'scale':.22},'thinkHand':{'frame':tf,'pin':{'x':tx,'y':tf['y']+12},'scale':.11}}
jf=frame(jacket,(0,0,jacket.width,jacket.height));ja=np.asarray(jacket.getchannel('A'));jy=int(np.where(ja[:,jacket.width//2]>170)[0][0])
outfits['outfit-3']['torso']=jf;outfits['outfit-3']['torsoAsset']=jacketmeta;outfits['outfit-3']['collarBottom']=jy
result={'version':1,'clothing':{**cloth,'outfits':outfits},'skin':{**skinmeta,'skins':skins},'think':thinkmeta,'registration':{'upperLength':52,'foreLength':56,'rightShoulder':{'x':222,'y':258},'leftShoulder':{'x':98,'y':258}}}
(art/'avatar-clothed-kit-v1.frames.json').write_text(json.dumps(result,indent=2)+'\n',encoding='utf-8')
for filename in ['avatar-clothed-kit-v1','avatar-clothed-kit-v2','avatar-clothed-skin-v1','avatar-clothed-think-v1','avatar-clothed-jacket-v1']:
 p=art/(filename+'.provenance.json');v=json.loads(p.read_text(encoding='utf-8'));v['sha256']=hashlib.sha256((art/(filename+'.png')).read_bytes()).hexdigest();p.write_text(json.dumps(v,indent=2)+'\n',encoding='utf-8')
print(json.dumps({'outfits':len(outfits),'skins':len(skins),'files':[cloth['src'],skinmeta['src'],thinkmeta['src']]}))
