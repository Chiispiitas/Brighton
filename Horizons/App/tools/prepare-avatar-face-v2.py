"""Register ImageGen blank heads and separate native feature shapes; never paint anatomy."""
from pathlib import Path
from PIL import Image
import numpy as np
import json, shutil, hashlib

app = Path(__file__).resolve().parents[1]
out = app / 'assets/art/avatar-face-v2'
docs = app / 'docs/avatar-face-v2'
out.mkdir(exist_ok=True)
native = Path('C:/Users/David/.codex/generated_images/01a1a9d5-5815-78c1-981e-ce1309780714')
sources = {'blank': native / 'exec-6f303069-3000-476a-b915-50861bd72ec5.png',
           'features': native / 'exec-543cc76e-8681-4c1f-b43c-8a98a54140e6.png'}
for name, path in sources.items():
    shutil.copy2(path, out / (name + '-native.png'))

def keyed(im):
    a = np.array(im.convert('RGBA'))
    # Native magenta separation; no replacement drawing or backing skin patches.
    keep = np.minimum(a[:,:,0].astype(float), a[:,:,2]) < a[:,:,1] * 1.3 + 15
    a[:,:,3] = np.where(keep, 255, 0).astype('uint8')
    return Image.fromarray(a)

old = Image.open(app / 'assets/art/avatar-round-v3/heads.png').convert('RGBA')
blank = keyed(Image.open(out / 'blank-native.png'))
assert blank.size == old.size == (1536,1024)
a, b = np.array(old), np.array(blank)
b[:,:,3] = np.minimum(b[:,:,3], a[:,:,3])
meta = json.loads((app / 'assets/art/avatar-static-v1.frames.json').read_text())
for base in meta['bases'].values():
    for skin in base['skins'].values():
        f = skin['frame']; x,y,w,h = (f[k] for k in ('x','y','w','h'))
        # Original neck seam only, below the chin, to preserve every existing neckline.
        l,r = x+round(w*.38), x+round(w*.62)
        b[y+h-29:y+h,l:r] = a[y+h-29:y+h,l:r]
Image.fromarray(b).save(out / 'blank-heads.png')

features = Image.open(out / 'features-native.png').convert('RGBA')
regions = {
 'eye-left': (0,0,512,512), 'eye-right': (512,0,1024,512),
 'pupil': (1024,0,1536,512),
 'brow-left': (70,610,235,680), 'brow-right': (280,610,435,680),
 'nose': (225,725,285,827), 'mouth': (170,840,345,910),
 'lid-left': (590,720,760,790), 'lid-right': (790,720,950,790),
}
parts = {}
for name, rect in regions.items():
    part = features.crop(rect)
    key = keyed(part)
    box = key.getbbox(); assert box, name
    keep = np.array(key.crop(box))[:,:,3] > 0
    part = part.crop(box)
    arr = np.array(part)
    # Recover native edge coverage from the flat magenta matte; remove pink
    # contamination while registering the palette, without redrawing shapes.
    if name in ('eye-left','eye-right'):
        coverage = arr[:,:,1].astype(float) / 255
        rgb = (255,255,255)
    else:
        coverage = 1-arr[:,:,2].astype(float)/255 if name=='nose' else np.maximum(1-arr[:,:,0].astype(float)/255,1-arr[:,:,2].astype(float)/255)
        coverage = np.clip(coverage / max(coverage.max(),.01),0,1)
        rgb = (199,105,59) if name=='nose' else (35,36,34)
    coverage[coverage<.025]=0
    coverage[~keep]=0
    arr[:,:,3] = np.round(coverage*255).astype('uint8')
    arr[:,:,:3] = rgb
    part = Image.fromarray(arr)
    # Preserve native shape alpha, register its palette to the accepted face.
    # This is an explicit color derivative, not an untouched-native claim.
    part.save(out / (name + '.png'))
    parts[name] = {'nativeRegion': list(rect), 'trim': list(box), 'size': list(part.size)}

record = {
 'tool':'built-in ImageGen', 'status':'accepted separate-part architecture; root-agent visual review',
 'retired':'avatar-motion-v1 whole-head expression swaps violate the faceless-head process; no longer active',
 'generations': [{
   'asset':name, 'toolOutputPath':str(src), 'savedNative':str((out/(name+'-native.png')).relative_to(app)),
   'sha256':hashlib.sha256(src.read_bytes()).hexdigest(),
   'dimensions':list(Image.open(src).size), 'nativeBackground':'opaque magenta; separated mechanically in derivatives',
   'brief':json.loads((docs/(name+'-brief.json')).read_text()),
   'preflight':json.loads((docs/(name+'-preflight.json')).read_text())
 } for name,src in sources.items()],
 'recipe':'tools/prepare-avatar-face-v2.py', 'parts':parts,
 'derivatives':['magenta alpha key and edge matte removal','crop/trim native features','accepted palette registration of native alpha shapes including clean white eyes',
   'original rounded silhouette intersection','original neck seam below chin retained'],
 'invariants':'All saved IDs and original head/costume/hair/eyewear metadata remain unchanged. No whole-head blink frame.',
 'activeFiles':[{'file':str(p.relative_to(app)), 'sha256':hashlib.sha256(p.read_bytes()).hexdigest(), 'dimensions':list(Image.open(p).size)} for p in sorted(out.glob('*.png')) if not p.name.endswith('-native.png')],
 'limits':'Very similar reconstruction, not pixel identical; generated white-eye proportions differ slightly. No independent human approval claimed.'
}
(docs/'production-record.json').write_text(json.dumps(record,indent=2)+'\n')
print('Prepared blank heads and nine genuinely separate native feature parts')
