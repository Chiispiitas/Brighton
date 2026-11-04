"""Measure unmodified native flat ImageGen parts; emit runtime viewports/pivots."""
from pathlib import Path
from PIL import Image
from collections import deque
import numpy as np
import json, hashlib

art = Path(__file__).resolve().parents[1] / 'assets/art'
names = ['head', 'torso', 'upperLeft', 'lowerLeft', 'upperRight', 'lowerRight', 'thighLeft', 'shinLeft', 'thighRight', 'shinRight', 'accessory', 'prop']

def component(alpha, column, row):
    height, width = alpha.shape
    x0, x1 = int(column * width / 4), int((column + 1) * width / 4)
    y0, y1 = int(row * height / 3), int((row + 1) * height / 3)
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
            left, right, top, bottom = min(left, x), max(right, x), min(top, y), max(bottom, y)
            for yy, xx in ((y-1,x),(y+1,x),(y,x-1),(y,x+1)):
                if 0 <= yy < mask.shape[0] and 0 <= xx < mask.shape[1] and mask[yy, xx]:
                    mask[yy, xx] = False
                    queue.append((yy, xx))
        components.append((size, left+x0, top+y0, right+x0+1, bottom+y0+1))
    _, left, top, right, bottom = max(components)
    left, top, right, bottom = max(x0,left-2), max(y0,top-2), min(x1,right+2), min(y1,bottom+2)
    return dict(x=left,y=top,w=right-left,h=bottom-top)

def center(alpha, box, fraction):
    y = min(alpha.shape[0]-1, int(box['y'] + fraction*box['h']))
    xs = np.flatnonzero(alpha[y, box['x']:box['x']+box['w']] > 170)
    return float((xs.min()+xs.max())/2) if len(xs) else box['w']/2

result = dict(version=5, kind='flat-native-articulated-parts', characters={})
for character in ['mina','alex','jo']:
    filename = character+('-flat-v3.png' if character=='mina' else '-flat-v2.png')
    image = Image.open(art/filename)
    rgba = np.asarray(image)
    alpha = rgba[:,:,3]
    width,height = image.size
    parts = {}
    for index,name in enumerate(names):
        box = component(alpha,index%4,index//4)
        if name == 'head':
            pin,end = dict(x=center(alpha,box,.92),y=box['h']*.92),None
        elif name == 'torso':
            pin,end = dict(x=center(alpha,box,.12),y=box['h']*.12),None
        elif name.startswith(('upper','thigh')):
            pin = dict(x=center(alpha,box,.14),y=box['h']*.14)
            end = dict(x=center(alpha,box,.86),y=box['h']*.86)
        elif name.startswith(('lower','shin')):
            fraction = .71 if name.startswith('lower') else .86
            pin = dict(x=center(alpha,box,.12),y=box['h']*.12)
            end = dict(x=center(alpha,box,fraction),y=box['h']*fraction)
        else:
            pin,end = dict(x=box['w']/2,y=box['h']/2),None
        parts[name] = dict(frame=box,pin=pin,**(dict(end=end) if end else {}))
    for side in ['Left','Right']:
        part = parts['shin'+side]
        box = part['frame']
        full = box['h']
        cx = int(box['x']+part['pin']['x'])
        ankle = box['y']+int(full*.73)
        for yy in range(box['y']+int(full*.55),box['y']+int(full*.9)):
            red,green,blue,a = map(int,rgba[yy,cx])
            shoe = (red>190 and red>green*1.2) if character=='mina' else (red>190 and green>155 and blue>100)
            if a>170 and shoe:
                ankle=yy
                break
        pivot_x = center(alpha,box,(ankle-box['y']-5)/full)
        ankle_y = ankle-box['y']+4
        overlap = max(6,int(full*.025))
        part['nativeFullHeight'] = full
        part['end'] = dict(x=pivot_x,y=ankle_y)
        part['frame'] = {**box,'h':ankle_y+overlap}
        crop_y = ankle-overlap
        parts['foot'+side] = dict(frame=dict(x=box['x'],y=crop_y,w=box['w'],h=box['y']+full-crop_y),pin=dict(x=pivot_x,y=box['y']+ankle_y-crop_y),nativeFullHeight=full)
    result['characters'][character] = dict(src='assets/art/'+filename,atlas=dict(width=width,height=height),sha256=hashlib.sha256((art/filename).read_bytes()).hexdigest(),parts=parts)
(art/'cast-flat-v1.frames.json').write_text(json.dumps(result,indent=2)+'\n',encoding='utf-8')
print(json.dumps({c:{n:p['frame'] for n,p in d['parts'].items()} for c,d in result['characters'].items()}))
