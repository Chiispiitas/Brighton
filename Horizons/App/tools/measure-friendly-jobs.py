"""Read native alpha and propose vocabulary crops without editing shared manifest."""
from pathlib import Path
from PIL import Image
import numpy as np
import hashlib
import json
import os

root = Path(__file__).resolve().parent.parent
art = root / 'assets' / 'art'
version = os.environ.get('HZ_FRIENDLY_JOBS_VERSION', 'v2')
first_version = os.environ.get('HZ_FRIENDLY_JOBS_FIRST_VERSION', 'v4')
sheets = [
    (f'jobs-friendly-1-{first_version}.png',[0,314,627,951,1254],['teacher','chef','doctor','office worker']),
    (f'jobs-friendly-2-{version}.png',[0,360,721,1086],['receptionist','salesclerk','taxi driver']),
    (f'jobs-friendly-3-{version}.png',[0,317,629,942,1254],['waiter','waitress','farmer','nurse']),
    (f'jobs-friendly-4-{version}.png',[0,365,720,1086],['dentist','police officer','actor']),
]
current = json.loads((art/'manifest.json').read_text(encoding='utf8'))
metadata = {'version':1,'kind':'native-friendly-connected-adult-jobs','source':'Built-in ImageGen native RGBA bytes preserved; alpha read only','atlases':[],'activeRenderedSlots':56,'activeUniqueNativeCells':56}
fragment = {'version':1,'kind':'proposed-vocabulary-fragment','sharedManifestUnmodified':True,'vocabulary':{}}
for filename,boundaries,terms in sheets:
    file = art/filename
    image = Image.open(file)
    assert image.height == boundaries[-1]
    alpha = np.asarray(image.getchannel('A'))
    width = image.width/4
    atlas = {'src':'assets/art/'+filename,'atlas':{'width':image.width,'height':image.height},'sha256':hashlib.sha256(file.read_bytes()).hexdigest(),'rowBoundaries':boundaries,'rows':[]}
    for row,term in enumerate(terms):
        top,bottom = boundaries[row:row+2]
        frames,contents = [],[]
        for column in range(4):
            left,right = int(np.ceil(column*width)),int(np.ceil((column+1)*width))
            ys,xs = np.where(alpha[top:bottom,left:right]>170)
            assert len(xs),(filename,term,column)
            frames.append({'x':column*width,'y':top,'w':width,'h':bottom-top})
            contents.append({'x':int(xs.min()+left),'y':int(ys.min()+top),'w':int(xs.max()-xs.min()+1),'h':int(ys.max()-ys.min()+1)})
        animation_id = term.replace(' ','-')
        atlas['rows'].append({'term':term,'animationId':animation_id,'frames':frames,'nativeAlphaBounds':contents})
        fragment['vocabulary'][term]={'src':atlas['src'],'atlas':atlas['atlas'],'frame':frames[0],'animation':{'id':animation_id,'duration':current['vocabulary'][term]['animation']['duration'],'frames':frames}}
    metadata['atlases'].append(atlas)
(art/'jobs-friendly-v1.frames.json').write_text(json.dumps(metadata,indent=2)+'\n',encoding='utf8')
(root/'reports/jobs-friendly-vocabulary-fragment.json').write_text(json.dumps(fragment,indent=2)+'\n',encoding='utf8')
print(json.dumps({'nativeAtlases':len(metadata['atlases']),'slots':56,'fragment':'reports/jobs-friendly-vocabulary-fragment.json','sharedManifestUnmodified':True}))
