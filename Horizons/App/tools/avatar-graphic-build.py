"""Measure native ImageGen alpha and register cutouts; never repaint artwork."""
from pathlib import Path
from PIL import Image
import numpy as np
import json

APP = Path(__file__).resolve().parent.parent
ART = APP / 'assets/art'
COLS = [0, 278, 523, 769, 1014, 1259, 1536]

def atlas(name):
    image = Image.open(ART / name).convert('RGBA')
    return image, {'src': 'assets/art/' + name, 'atlas': {'width': image.width, 'height': image.height}}

def bounds(image, region):
    x0, y0, x1, y1 = map(int, region)
    alpha = np.asarray(image.getchannel('A'))
    ys, xs = np.where(alpha[y0:y1, x0:x1] > 170)
    if not len(xs):
        return None
    left, top = max(x0, x0 + int(xs.min()) - 2), max(y0, y0 + int(ys.min()) - 2)
    right, bottom = min(x1, x0 + int(xs.max()) + 3), min(y1, y0 + int(ys.max()) + 3)
    return {'x': left, 'y': top, 'w': right-left, 'h': bottom-top}

def segments(mask):
    indices = np.where(mask)[0]
    if not len(indices):
        return []
    return np.split(indices, np.where(np.diff(indices) > 1)[0]+1)

kit, kitmeta = atlas('avatar-graphic-flat-kit-v2.png')
clothing, clothmeta = atlas('avatar-graphic-flat-clothing-v1.png')
limbs, limbmeta = atlas('avatar-graphic-flat-limbs-v2.png')
ka, la = np.asarray(kit), np.asarray(limbs)
avatar = {'skin': [], 'outfit': [], 'hair': [], 'accessory': [{'id':'none','label':'No extra','group':'accessory'}]}
outfits, skins = {}, {}
skin_labels = ['Porcelain','Peach','Honey','Caramel','Chestnut','Deep brown']
outfit_labels = ['Magenta hoodie','Teal summer','Explorer jacket','Orange sweater','Teal overalls','Magenta cardigan']
hair_labels = ['Side part','Short curls','Long straight','Twin puffs','Blonde bob','Soft waves']
accessory_labels = ['Round glasses','Orange cap','Teal headphones','Pico satchel','Orange scarf','Navy backpack']
collars = [145, 133, 125, 135, 128, 120]
head_width, head_top = 122, 66

for i in range(6):
    x0, x1 = COLS[i:i+2]
    face = bounds(kit, (x0, 0, x1, 320))
    scale = head_width / face['w']
    cx = face['x'] + face['w']/2
    column_alpha = ka[face['y']:face['y']+face['h'], face['x']:face['x']+face['w'], 3]
    wide_rows = np.where((column_alpha > 170).sum(axis=1) > face['w']*.60)[0]
    jaw = face['y'] + int(wide_rows[-1]) + 1
    neck_rows = ka[jaw+3:face['y']+face['h']-2, face['x']:face['x']+face['w'], 3]
    neck_xs = np.where(neck_rows > 170)[1]
    neck_left, neck_right = face['x']+int(neck_xs.min()), face['x']+int(neck_xs.max())+1
    head_frame = {**face, 'h': jaw-face['y']+1}
    neck_frame = {'x': neck_left, 'y': jaw-5, 'w': neck_right-neck_left, 'h': face['y']+face['h']-(jaw-5)}
    eye_region = ka[110:165, x0:x1]
    whites = (eye_region[:,:,3] > 170) & (eye_region[:,:,:3].min(axis=2)>225)
    eye_columns = segments(whites.any(axis=0))
    eye_centres = []
    for columns in eye_columns:
        if len(columns) < 8:
            continue
        ys, xs = np.where(whites[:,columns])
        eye_centres.append((x0+float(columns.mean()), 110+float(ys.mean())))
    blink_frame = bounds(kit, (x0, 860, x1, 1024))
    blink_region = ka[blink_frame['y']:blink_frame['y']+blink_frame['h'], x0:x1]
    dark = (blink_region[:,:,3]>170)&(blink_region[:,:,:3].max(axis=2)<110)
    arcs = [columns for columns in segments(dark.any(axis=0)) if len(columns)>10]
    blinks = []
    for eye, columns in zip(eye_centres, arcs):
        ys, xs = np.where(dark[:,columns])
        arc_centre_y = blink_frame['y']+float(ys.mean())
        box = {'x': x0+int(columns.min())-4, 'y': int(arc_centre_y)-20, 'w': int(columns.max()-columns.min())+9, 'h':40}
        blinks.append({**kitmeta,'frame':box,'rigPosition':{'x':160+(eye[0]-cx)*scale-box['w']*scale/2,'y':head_top+(eye[1]-face['y'])*scale-20*scale,'w':box['w']*scale,'z':4}})
    avatar['skin'].append({'id':f'skin-{i+1}','label':skin_labels[i],'group':'skin',**kitmeta,'frame':face,'headFrame':head_frame,'neckFrame':neck_frame,'blinks':blinks,'position':{'x':.2,'y':.04,'w':.6,'h':.94,'z':1}})

    hair = bounds(kit,(x0,320,x1,595))
    sample_y = [480,470,480,470,480,480][i]
    occupied = ka[sample_y,x0:x1,3]>170
    opening_candidates = [part for part in segments(~occupied) if len(part)>30 and part[0]>0 and part[-1]<x1-x0-1]
    opening = max(opening_candidates,key=len)
    opening_cx=x0+float(opening.mean())
    hair_scale=85/len(opening)
    centre_column=ka[hair['y']:sample_y,int(opening_cx),3]
    fringe=hair['y']+int(np.where(centre_column>170)[0][-1])+1
    hp={'x':160-(opening_cx-hair['x'])*hair_scale,'y':93-(fringe-hair['y'])*hair_scale,'w':hair['w']*hair_scale,'z':5}
    avatar['hair'].append({'id':f'hair-{i+1}','label':hair_labels[i],'group':'hair',**kitmeta,'frame':hair,'rigPosition':hp,'position':{'x':.28,'y':.025,'w':.44,'h':.3,'z':4}})

    accessory = bounds(kit,(x0,595,x1,860))
    positions=[(120,103,80),(85,9,150),(86.5,44,147),(133,208,112),(109,190,102),(151,192,160)]
    ax,ay,aw=positions[i]
    avatar['accessory'].append({'id':f'accessory-{i+1}','label':accessory_labels[i],'group':'accessory',**kitmeta,'frame':accessory,'rigPosition':{'x':ax,'y':ay,'w':aw,'z':0 if i==5 else 6},'position':{'x':.32,'y':.16,'w':.36,'h':.1,'z':6}})

    core=bounds(clothing,(x0,0,x1,360))
    upper=bounds(clothing,(x0,360,x1,690))
    fore=bounds(clothing,(x0,690,x1,1024))
    up_pin={'x':upper['x']+upper['w']/2,'y':upper['y']+upper['w']/2}
    upper_scale=46/((upper['y']+upper['h']-12)-up_pin['y']) if i not in [1,4] else .29
    outfit={'torso':core,'collarBottom':collars[i],'upperSleeve':{'frame':upper,'pin':up_pin,'scale':upper_scale},'foreSleeve':None}
    if fore:
        outfit['foreSleeve']={'frame':fore,'pin':{'x':fore['x']+fore['w']/2,'y':fore['y']+fore['w']/2},'wristY':fore['y']+fore['h']-16}
    outfits[f'outfit-{i+1}']=outfit
    avatar['outfit'].append({'id':f'outfit-{i+1}','label':outfit_labels[i],'group':'outfit',**clothmeta,'frame':core,'position':{'x':.16,'y':.39,'w':.68,'h':.6,'z':2}})

    upper,fore,hand,think=[bounds(limbs,(x0,a,x1,b)) for a,b in [(0,290),(290,550),(550,790),(790,1024)]]
    def hand_spec(box,scale):
        strip=la[box['y']+3:box['y']+15,box['x']:box['x']+box['w'],3]
        xs=np.where(strip>170)[1]
        return {'frame':box,'pin':{'x':box['x']+float(np.median(xs)),'y':box['y']+8},'scale':scale}
    skins[f'skin-{i+1}']={'upper':{'frame':upper,'pin':{'x':upper['x']+upper['w']/2,'y':upper['y']+upper['w']/2},'elbowY':upper['y']+upper['h']-upper['w']/2},'fore':{'frame':fore,'pin':{'x':fore['x']+fore['w']/2,'y':fore['y']+fore['w']/2},'wristY':fore['y']+fore['h']-16},'hand':hand_spec(hand,.22),'thinkHand':hand_spec(think,.20)}

avatar['hair'].append({'id':'none','label':'No hair','group':'hair'})
result={'version':1,'style':'New original adult geometric Horizons avatar system; built-in ImageGen native transparent blocks. All faces, hair, clothing and accessories remade from scratch.','clothing':{**clothmeta,'outfits':outfits},'skin':{**limbmeta,'skins':skins},'think':limbmeta,'registration':{'headWidth':head_width,'headTop':head_top,'torsoWidth':176,'collarY':211,'upperLength':46,'foreLength':50,'rightShoulder':{'x':235,'y':227},'leftShoulder':{'x':85,'y':227}},'avatar':avatar}
(ART/'avatar-graphic-flat-v1.frames.json').write_text(json.dumps(result,indent=2)+'\n',encoding='utf-8')
print(json.dumps({'groups':{key:len(values) for key,values in avatar.items()},'blinkParts':[len(skin['blinks']) for skin in avatar['skin']],'registration':result['registration']}))
