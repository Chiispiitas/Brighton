"""Read native alpha bounds and write crop metadata; never modify image bytes."""
from pathlib import Path
from PIL import Image
import numpy as np
import hashlib
import json

root = Path(__file__).resolve().parent.parent
art = root / 'assets' / 'art'
sheets = [
    ('jobs-graphic-1-v3.png', [0,252,510,772,983,1209,1463,1659], ['teacher','chef','doctor','office worker','receptionist','salesclerk','taxi driver']),
    ('jobs-graphic-2-v3.png', [0,246,479,716,957,1203,1421,1659], ['waiter','waitress','farmer','nurse','dentist','police officer','actor']),
]
result = {'version':2,'kind':'native-geometric-adult-job-action-cells','source':'Built-in ImageGen native output; original RGBA bytes preserved','atlases':[],'activeRenderedSlots':56,'activeUniqueNativeCells':56,'rejectedUnusedRows':[]}
overrides = {'chef':'chef-graphic-v2.png','police officer':'police-graphic-v2.png'}
crop_left = {('waitress',3):703,('actor',2):469}
for filename, boundaries, terms in sheets:
    file = art / filename
    image = Image.open(file)
    alpha = np.asarray(image.getchannel('A'))
    width, height = image.size
    assert width % 4 == 0 and boundaries[-1] == height
    cell_width = width // 4
    atlas = {'src':'assets/art/'+filename,'atlas':{'width':width,'height':height},'sha256':hashlib.sha256(file.read_bytes()).hexdigest(),'rowBoundaries':boundaries,'rows':[]}
    for row, term in enumerate(terms):
        top, bottom = boundaries[row:row+2]
        frames, bounds = [], []
        for column in range(4):
            left = crop_left.get((term,column), column*cell_width)
            right = left + cell_width
            ys, xs = np.where(alpha[top:bottom,left:right]>170)
            assert len(xs), (filename,term,column)
            frame = {'x':left,'y':top,'w':cell_width,'h':bottom-top}
            content = {'x':int(xs.min()+left),'y':int(ys.min()+top),'w':int(xs.max()-xs.min()+1),'h':int(ys.max()-ys.min()+1)}
            frames.append(frame)
            bounds.append(content)
        entry = {'term':term,'animationId':term.replace(' ','-'),'frames':frames,'nativeAlphaBounds':bounds}
        if term in overrides:
            active_file = art / overrides[term]
            active_image = Image.open(active_file)
            active_alpha = np.asarray(active_image.getchannel('A'))
            assert active_image.width % 4 == 0
            active_width = active_image.width // 4
            active_frames, active_bounds = [], []
            for column in range(4):
                left, right = column*active_width, (column+1)*active_width
                ys, xs = np.where(active_alpha[:,left:right]>170)
                crop_top, crop_height = (126,444) if term == 'police officer' else (0,active_image.height)
                active_frames.append({'x':left,'y':crop_top,'w':active_width,'h':crop_height})
                active_bounds.append({'x':int(xs.min()+left),'y':int(ys.min()),'w':int(xs.max()-xs.min()+1),'h':int(ys.max()-ys.min()+1)})
            result['rejectedUnusedRows'].append({'term':term,'src':'assets/art/'+filename,'reason':'Superseded by four clearer distinct native supported action phases.','frames':frames})
            entry.update({'frames':active_frames,'nativeAlphaBounds':active_bounds,'activeSource':'assets/art/'+overrides[term],'activeAtlas':{'width':active_image.width,'height':active_image.height},'activeSha256':hashlib.sha256(active_file.read_bytes()).hexdigest()})
        atlas['rows'].append(entry)
    result['atlases'].append(atlas)
(art/'jobs-graphic-v2.frames.json').write_text(json.dumps(result,indent=2)+'\n',encoding='utf8')
print(json.dumps({'atlases':[{ 'src':a['src'],'rows':len(a['rows']),'size':a['atlas']} for a in result['atlases']],'slots':56}))
