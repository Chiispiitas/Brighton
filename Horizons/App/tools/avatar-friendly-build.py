"""Register native friendly male/female parts without repainting any pixels."""
from pathlib import Path
from PIL import Image
import numpy as np
import json

APP=Path(__file__).resolve().parent.parent
ART=APP/'assets/art'
COLS=[0,278,523,769,1014,1259,1536]

def atlas(name):
    im=Image.open(ART/name).convert('RGBA')
    return im,{'src':'assets/art/'+name,'atlas':{'width':im.width,'height':im.height}}

def bounds(im,region):
    x0,y0,x1,y1=map(int,region)
    a=np.asarray(im.getchannel('A'));ys,xs=np.where(a[y0:y1,x0:x1]>170)
    if not len(xs):return None
    l=max(x0,x0+int(xs.min())-2);t=max(y0,y0+int(ys.min())-2)
    r=min(x1,x0+int(xs.max())+3);b=min(y1,y0+int(ys.max())+3)
    return {'x':l,'y':t,'w':r-l,'h':b-t}

def segments(mask):
    x=np.where(mask)[0]
    return np.split(x,np.where(np.diff(x)>1)[0]+1) if len(x) else []

heads,headmeta=atlas('avatar-friendly-heads-v1.png')
cloth,clothmeta=atlas('avatar-friendly-clothing-v2.png')
limbs,limbmeta=atlas('avatar-friendly-limbs-v2.png')
ha,la=np.asarray(heads),np.asarray(limbs)
prior=json.loads((ART/'avatar-graphic-flat-v1.frames.json').read_text(encoding='utf-8'))
skin_labels=['Porcelain','Peach','Honey','Caramel','Chestnut','Deep brown']
outfit_labels=['Magenta hoodie','Teal summer','Explorer jacket','Orange sweater','Teal overalls','Magenta cardigan']
common={'headTop':66,'collarY':200,'upperLength':43,'foreLength':47}
registrations={
 'male':{**common,'headWidth':116,'torsoWidth':166,'leftShoulder':{'x':92,'y':215},'rightShoulder':{'x':228,'y':215}},
 'female':{**common,'headWidth':110,'torsoWidth':158,'leftShoulder':{'x':96,'y':215},'rightShoulder':{'x':224,'y':215}},
}
bases={base:{'registration':reg,'skins':{}} for base,reg in registrations.items()}
avatar={'body':[],'skin':[],'outfit':[],'hair':prior['avatar']['hair'],'accessory':prior['avatar']['accessory']}
next(item for item in avatar['accessory'] if item['id']=='accessory-4')['rigPosition']['x']=125

for base,row,blink_row in [('male',(0,340),(680,840)),('female',(340,680),(840,1024))]:
    reg=registrations[base]
    for i in range(6):
        x0,x1=COLS[i:i+2];face=bounds(heads,(x0,row[0],x1,row[1]));scale=reg['headWidth']/face['w'];cx=face['x']+face['w']/2
        alpha=ha[face['y']:face['y']+face['h'],face['x']:face['x']+face['w'],3]
        widths=(alpha>170).sum(axis=1);tail=widths[-22:];neck_width=float(np.median(tail[tail>0]));wide=np.where(widths>neck_width*1.35)[0];jaw=face['y']+int(wide[-1])+1
        headframe={**face,'h':jaw-face['y']+3}
        # Twenty-one native rows of the exact same generated skin overlap the
        # face and lower-jaw/neck crops. No translated neck tab or AA-only join.
        neckframe={'x':face['x'],'y':jaw-18,'w':face['w'],'h':face['y']+face['h']-(jaw-18)}
        region=ha[face['y']:face['y']+int(face['h']*.62),x0:x1]
        whites=(region[:,:,3]>170)&(region[:,:,:3].min(axis=2)>225)
        eye_centres=[]
        for columns in segments(whites.any(axis=0)):
            if len(columns)<12:continue
            ys,xs=np.where(whites[:,columns]);eye_centres.append((x0+float(columns.mean()),face['y']+float(ys.mean())))
        eye_centres=eye_centres[:2]
        band=bounds(heads,(x0,blink_row[0],x1,blink_row[1]));br=ha[band['y']:band['y']+band['h'],x0:x1]
        dark=(br[:,:,3]>170)&(br[:,:,:3].max(axis=2)<110);arcs=[c for c in segments(dark.any(axis=0)) if len(c)>10];blinks=[]
        for eye,columns in zip(eye_centres,arcs):
            ys,xs=np.where(dark[:,columns]);cy=band['y']+float(ys.mean());box={'x':x0+int(columns.min())-4,'y':int(cy)-26,'w':int(columns.max()-columns.min())+9,'h':52}
            blinks.append({**headmeta,'frame':box,'rigPosition':{'x':160+(eye[0]-cx)*scale-box['w']*scale/2,'y':reg['headTop']+(eye[1]-face['y'])*scale-26*scale,'w':box['w']*scale,'z':4}})
        spec={**headmeta,'frame':face,'headFrame':headframe,'neckFrame':neckframe,'blinks':blinks,'eyeY':sum(e[1] for e in eye_centres)/2,'eyeStageY':reg['headTop']+(sum(e[1] for e in eye_centres)/2-face['y'])*scale,'jawNeckOverlapPixels':21*scale}
        bases[base]['skins'][f'skin-{i+1}']=spec
        if base=='male':avatar['skin'].append({'id':f'skin-{i+1}','label':skin_labels[i],'group':'skin',**spec,'position':{'x':.2,'y':.04,'w':.6,'h':.94,'z':1}})
    first=bases[base]['skins']['skin-1'];avatar['body'].append({'id':base,'label':base.title(),'group':'body','src':first['src'],'atlas':first['atlas'],'frame':first['frame']})

outfits={};skins={};collars=[145,133,126,135,131,130]
for i in range(6):
    x0,x1=COLS[i:i+2];core=bounds(cloth,(x0,0,x1,360));upper=bounds(cloth,(x0,360,x1,690));fore=bounds(cloth,(x0,690,x1,1024));assert upper
    pin={'x':upper['x']+upper['w']/2,'y':upper['y']+upper['w']/2}
    uscale=43/((upper['y']+upper['h']-12)-pin['y']) if i not in [1,4] else .25
    outfits[f'outfit-{i+1}']={'torso':core,'collarBottom':collars[i],'upperSleeve':{'frame':upper,'pin':pin,'scale':uscale},'foreSleeve':{'frame':fore,'pin':{'x':fore['x']+fore['w']/2,'y':fore['y']+fore['w']/2},'wristY':fore['y']+fore['h']-16} if fore else None}
    avatar['outfit'].append({'id':f'outfit-{i+1}','label':outfit_labels[i],'group':'outfit',**clothmeta,'frame':core,'position':{'x':.16,'y':.39,'w':.68,'h':.6,'z':2}})
    upper,fore,hand,think=[bounds(limbs,(x0,a,x1,b)) for a,b in [(0,290),(290,550),(550,790),(790,1024)]]
    def hs(box,s):
        strip=la[box['y']+3:box['y']+15,box['x']:box['x']+box['w'],3];xs=np.where(strip>170)[1]
        return {'frame':box,'pin':{'x':box['x']+float(np.median(xs)),'y':box['y']+8},'scale':s}
    skins[f'skin-{i+1}']={'upper':{'frame':upper,'pin':{'x':upper['x']+upper['w']/2,'y':upper['y']+upper['w']/2},'elbowY':upper['y']+upper['h']-upper['w']/2},'fore':{'frame':fore,'pin':{'x':fore['x']+fore['w']/2,'y':fore['y']+fore['w']/2},'wristY':fore['y']+fore['h']-16},'hand':hs(hand,.20),'thinkHand':hs(think,.19)}

result={'version':1,'kind':'native-friendly-male-female-bust','style':'Friendly adult geometric faces, slim native limbs/clothing, exact overlapping native jaw/neck crops. Male/Female is avatar.body; existing customization IDs remain stable.','bases':bases,'avatar':avatar,'clothing':{**clothmeta,'outfits':outfits},'skin':{**limbmeta,'skins':skins},'think':limbmeta,'registration':registrations['male']}
(ART/'avatar-friendly-v1.frames.json').write_text(json.dumps(result,indent=2)+'\n',encoding='utf-8')
(ART/'avatar-friendly-v1.fragment.json').write_text(json.dumps({'avatar':avatar},indent=2)+'\n',encoding='utf-8')
print(json.dumps({'bases':list(bases),'skinCounts':{base:len(v['skins']) for base,v in bases.items()},'blinks':{base:[len(s['blinks']) for s in v['skins'].values()]for base,v in bases.items()},'minJawNeckOpaqueViewportOverlap':min(s['jawNeckOverlapPixels'] for b in bases.values() for s in b['skins'].values())}))
