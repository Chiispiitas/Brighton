"""Check native arm/body overlap across the full wave rotation envelope."""
from pathlib import Path
import json
import numpy as np
from PIL import Image
app=Path(__file__).resolve().parents[1]
root=app/'assets/art/mina-motion-v1'
rig=json.loads((root/'rigs.json').read_text())['poses']['skip']
body=Image.open(app/rig['parts']['body']).convert('RGBA')
arm=Image.open(app/rig['parts']['gesture']).convert('RGBA')
fixed=np.array(body)[:,:,3]>220
checks=[]
for angle in range(-12,13):
    rotated=arm.rotate(angle,resample=Image.Resampling.BICUBIC,center=tuple(rig['pivots']['gesture']))
    overlap=int(np.sum(fixed & (np.array(rotated)[:,:,3]>220)))
    assert overlap>=60,(angle,overlap)
    checks.append({'angle':angle,'opaqueOverlapPixels':overlap})
(app/'reports/mina-shoulder.json').write_text(json.dumps({'pass':True,'pose':'skip','checks':checks,'method':'Native body/arm alpha overlap across -12 to +12 degrees, exceeding production -10 to +8 degree wave. Original native PNGs unchanged; registration shifted left18px and shoulder pivot corrected. Actual runtime captures reviewed separately.'},indent=2)+'\n')
print('PASS shoulder overlap throughout wave; minimum',min(c['opaqueOverlapPixels'] for c in checks))
