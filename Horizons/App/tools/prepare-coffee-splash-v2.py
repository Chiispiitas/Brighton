"""Register four separate native ImageGen frames; crop/scale/place only, no drawing."""
from pathlib import Path
import hashlib
import json
from PIL import Image, ImageFilter
import numpy as np

APP = Path(__file__).resolve().parents[1]
ROOT = APP / 'assets/art/coffee-splash-v2'
DOC = APP / 'docs/coffee-splash-v2'
record = json.loads((DOC / 'production-record.json').read_text())
offsets = [.095, .105, .119, .135, .151]
frames = []
for index, item in enumerate(record['records']):
    native = Image.open(APP / item['nativeFile']).convert('RGBA')
    alpha = np.array(native.getchannel('A'))
    solid = Image.fromarray(np.uint8(alpha > 200) * 255)
    nearby = np.array(solid.filter(ImageFilter.MaxFilter(11)))
    assert not np.any((alpha > 10) & (nearby == 0)), 'Visible halo outside contour'
    bounds = native.getchannel('A').point(lambda a: 255 if a > 96 else 0).getbbox()
    crop = native.crop(bounds)
    if item['id'] == 'fall':
        scale = 145 / crop.width
        x, bottom = 247, 188
        y = round(bottom - crop.height * scale)
    else:
        target_height = [48, 120, 106][index]
        scale = target_height / crop.height
        pixels = np.array(crop.getchannel('A'))
        # The actual lower jet/tail anchor, rather than each frame's box center.
        yy, xx = np.where((pixels > 128) & (np.indices(pixels.shape)[0] >= crop.height * .97))
        anchor = float(np.median(xx))
        x, y = round(255 - anchor * scale), 160 - target_height
    size = (round(crop.width * scale), round(crop.height * scale))
    canvas = Image.new('RGBA', (512, 265))
    canvas.alpha_composite(crop.resize(size, Image.Resampling.LANCZOS), (x, y))
    filename = f'frame-{index + 1:02d}-{item["id"]}.png'
    canvas.save(ROOT / filename, optimize=True)
    item['registration'] = {'crop': list(bounds), 'uniformScale': scale, 'placedSize': list(size),
                            'offset': [x, y], 'canvas': [512, 265], 'runtimeTransform': 'translate(-2%,-40%)'}
    item['runtimeFile'] = 'assets/art/coffee-splash-v2/' + filename
    item['runtimeSha256'] = hashlib.sha256((ROOT / filename).read_bytes()).hexdigest()
    frames.append({'src': item['runtimeFile'], 'from': offsets[index], 'to': offsets[index + 1]})

(ROOT / 'sequence.json').write_text(json.dumps({'frames': frames, 'opacity': 1,
    'timing': 'Normalized offsets after the existing cup anticipation starts; impact at .11.',
    'method': 'Discrete frame replacement, no fades or shape interpolation.'}, indent=2) + '\n')
(DOC / 'production-record.json').write_text(json.dumps(record, indent=2) + '\n')
print(json.dumps(frames))
