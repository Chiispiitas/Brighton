"""Measure native ImageGen atlases without modifying their pixels.

Only rectangular alpha viewports, measured pins and character-specific display
lengths are emitted. The PNG files are used byte-for-byte as generated.
"""
from pathlib import Path
from collections import deque
import hashlib
import json

import numpy as np
from PIL import Image

ART = Path(__file__).resolve().parents[1] / 'assets/art'
NAMES = ['head', 'torso', 'upperLeft', 'lowerLeft', 'upperRight',
         'lowerRight', 'thighLeft', 'shinLeft', 'thighRight', 'shinRight',
         'accessory', 'prop']
DESIGNS = {
    'mina': {'headHeight': 112, 'torsoHeight': 182, 'armLengths': [78, 78],
             'legLengths': [95, 107], 'shoeColor': 'orange',
             'rig': {'head': {'x': 180, 'y': 169}, 'torso': {'x': 180, 'y': 174},
                     'shoulders': {'left': {'x': 137, 'y': 184}, 'right': {'x': 223, 'y': 184}},
                     'hips': {'left': {'x': 158, 'y': 329}, 'right': {'x': 202, 'y': 329}},
                     'study': {'left': {'x': 155, 'y': 264}, 'right': {'x': 212, 'y': 262}},
                     'accessory': {'x': 132, 'y': 246}, 'wheel': {'x': 180, 'y': 264},
                     'dashboard': {'x': 180, 'y': 374}}},
    'alex': {'headHeight': 107, 'torsoHeight': 157, 'armLengths': [72, 75],
             'legLengths': [82, 96], 'shoeColor': 'cream',
             'rig': {'head': {'x': 180, 'y': 177}, 'torso': {'x': 180, 'y': 182},
                     'shoulders': {'left': {'x': 123, 'y': 192}, 'right': {'x': 237, 'y': 192}},
                     'hips': {'left': {'x': 150, 'y': 315}, 'right': {'x': 210, 'y': 315}},
                     'study': {'left': {'x': 155, 'y': 270}, 'right': {'x': 212, 'y': 268}},
                     'accessory': {'x': 180, 'y': 202}, 'wheel': {'x': 180, 'y': 270},
                     'dashboard': {'x': 180, 'y': 368}}},
    'jo': {'headHeight': 111, 'torsoHeight': 174, 'armLengths': [72, 75],
           'legLengths': [71, 83], 'shoeColor': 'cream',
           'rig': {'head': {'x': 180, 'y': 180}, 'torso': {'x': 180, 'y': 185},
                   'shoulders': {'left': {'x': 116, 'y': 195}, 'right': {'x': 244, 'y': 195}},
                   'hips': {'left': {'x': 148, 'y': 332}, 'right': {'x': 212, 'y': 332}},
                   'study': {'left': {'x': 155, 'y': 273}, 'right': {'x': 212, 'y': 271}},
                   'accessory': {'x': 180, 'y': 270}, 'wheel': {'x': 180, 'y': 272},
                   'dashboard': {'x': 180, 'y': 374}}},
}


def component(alpha, column, row):
    height, width = alpha.shape
    # The native generator can place a neck or sleeve a few pixels past the
    # nominal cell border. Search a generous margin and take the one largest
    # connected component, retaining the entire native silhouette.
    margin = 60
    x0, x1 = max(0,int(column*width/4)-margin), min(width,int((column+1)*width/4)+margin)
    y0, y1 = max(0,int(row*height/3)-margin), min(height,int((row+1)*height/3)+margin)
    mask = (alpha[y0:y1, x0:x1] > 170).copy()
    components = []
    for sy, sx in np.argwhere(mask):
        if not mask[sy, sx]:
            continue
        queue = deque([(int(sy), int(sx))])
        mask[sy, sx] = False
        left = right = int(sx)
        top = bottom = int(sy)
        size = 0
        while queue:
            y, x = queue.popleft()
            size += 1
            left, right = min(left, x), max(right, x)
            top, bottom = min(top, y), max(bottom, y)
            for yy, xx in ((y-1,x),(y+1,x),(y,x-1),(y,x+1)):
                if 0 <= yy < mask.shape[0] and 0 <= xx < mask.shape[1] and mask[yy,xx]:
                    mask[yy,xx] = False
                    queue.append((yy,xx))
        components.append((size,left+x0,top+y0,right+x0+1,bottom+y0+1))
    _,left,top,right,bottom = max(components)
    left,top,right,bottom = max(x0,left-2),max(y0,top-2),min(x1,right+2),min(y1,bottom+2)
    return {'x':left,'y':top,'w':right-left,'h':bottom-top}


def center(alpha, box, fraction):
    y = min(alpha.shape[0]-1,int(box['y']+fraction*box['h']))
    xs = np.flatnonzero(alpha[y,box['x']:box['x']+box['w']] > 170)
    return float((xs.min()+xs.max())/2) if len(xs) else box['w']/2


result = {'version':1,'kind':'native-flat-geometric-adult-parts','characters':{}}
for character,design in DESIGNS.items():
    filename = character+('-geometric-v2.png' if character=='mina' else '-geometric-v1.png')
    image = Image.open(ART/filename).convert('RGBA')
    rgba = np.asarray(image)
    alpha = rgba[:,:,3]
    width,height = image.size
    parts = {}
    for index,name in enumerate(NAMES):
        box = component(alpha,index%4,index//4)
        part = {'frame':box}
        if name == 'head':
            part.update(pin={'x':center(alpha,box,.94),'y':box['h']*.94},displayHeight=design['headHeight'])
        elif name == 'torso':
            part.update(pin={'x':center(alpha,box,.07),'y':box['h']*.07},displayHeight=design['torsoHeight'])
        elif name.startswith(('upper','thigh')):
            part.update(pin={'x':center(alpha,box,.14),'y':box['h']*.14},
                        end={'x':center(alpha,box,.86),'y':box['h']*.86},
                        segmentLength=design['armLengths'][0] if name.startswith('upper') else design['legLengths'][0])
        elif name.startswith(('lower','shin')):
            fraction = .72 if name.startswith('lower') else .79
            part.update(pin={'x':center(alpha,box,.12),'y':box['h']*.12},
                        end={'x':center(alpha,box,fraction),'y':box['h']*fraction},
                        segmentLength=design['armLengths'][1] if name.startswith('lower') else design['legLengths'][1])
        else:
            part['pin'] = {'x':box['w']/2,'y':box['h']/2}
        parts[name] = part
    for side in ['Left','Right']:
        part = parts['shin'+side]
        box = part['frame']
        full = box['h']
        cx = int(box['x']+part['pin']['x'])
        ankle = box['y']+int(full*.79)
        for yy in range(box['y']+int(full*.55),box['y']+int(full*.95)):
            red,green,blue,a = map(int,rgba[yy,cx])
            shoe = (red>185 and red>green*1.2) if design['shoeColor']=='orange' else (red>185 and green>150 and blue>90)
            if a>170 and shoe:
                ankle=yy
                break
        pivot_x = center(alpha,box,(ankle-box['y']-5)/full)
        ankle_y = ankle-box['y']+1
        part['nativeFullHeight'] = full
        part['end'] = {'x':pivot_x,'y':ankle_y}
        # Keep the wide toe pixels out of the independently rotating shin.
        # The shoe crop retains a small navy/olive overlap above the ankle.
        part['frame'] = {**box,'h':ankle_y}
        native_length = np.hypot(part['end']['x']-part['pin']['x'],part['end']['y']-part['pin']['y'])
        foot_scale = part['segmentLength']/native_length
        crop_y = ankle-4
        parts['foot'+side] = {'frame':{'x':box['x'],'y':crop_y,'w':box['w'],'h':box['y']+full-crop_y},
                             'pin':{'x':pivot_x,'y':box['y']+ankle_y-crop_y},'scale':foot_scale}
    result['characters'][character] = {'src':'assets/art/'+filename,'atlas':{'width':width,'height':height},
                                      'sha256':hashlib.sha256((ART/filename).read_bytes()).hexdigest(),
                                      'rig':design['rig'],'parts':parts}
(ART/'cast-geometric-v1.frames.json').write_text(json.dumps(result,indent=2)+'\n',encoding='utf-8')
print(json.dumps({c:{n:p['frame'] for n,p in d['parts'].items()} for c,d in result['characters'].items()}))
