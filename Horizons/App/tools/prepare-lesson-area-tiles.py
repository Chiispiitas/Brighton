"""Mechanical alpha extraction/crop only; native sources remain untouched."""
from pathlib import Path
from PIL import Image, ImageDraw
import numpy as np
import json, hashlib

app = Path(__file__).resolve().parents[1]
folder = app / 'assets/art/lesson-area-tiles-v1'
records = []
for name in ['cafe-cups', 'work-bag', 'globe', 'postbox']:
    keyed = name in ['cafe-cups', 'globe']
    source = folder / f'{name}-native-v{2 if keyed else 1}.png'
    im = Image.open(source).convert('RGBA')
    pixels = np.array(im)
    if keyed:
        rgb = pixels[:, :, :3].astype(float)
        background = np.minimum(rgb[:, :, 0], rgb[:, :, 2]) > 1.3 * rgb[:, :, 1] + 15
        pixels[:, :, 3] = np.where(background, 0, 255)
        im = Image.fromarray(pixels)
        box = im.getbbox()
        method = 'Established magenta-key extraction: min(R,B)>1.3*G+15; RGB unchanged; alpha bbox crop.'
    else:
        ys, xs = np.where(pixels[:, :, 3] >= 128)
        box = (max(0, int(xs.min())-8), max(0, int(ys.min())-8), min(im.width, int(xs.max())+9), min(im.height, int(ys.max())+9))
        method = 'Geometric crop around visible alpha silhouette (>=128), padded by 8 pixels. Original RGBA inside crop unchanged; excludes distant barely visible margin specks.'
    crop = im.crop(box)
    target = folder / f'{name}.png'
    crop.save(target)
    records.append({'id': name, 'nativeSource': source.name, 'nativeDimensions': list(im.size), 'nativeSha256': hashlib.sha256(source.read_bytes()).hexdigest(), 'file': target.name, 'cropBox': list(box), 'dimensions': list(crop.size), 'sha256': hashlib.sha256(target.read_bytes()).hexdigest(), 'method': method})

(folder / 'tileset.json').write_text(json.dumps({'tiles': records, 'rule': 'Isolated reusable object sprites only. No redrawing, recoloring, scene panels or stretched sprites.'}, indent=2)+'\n', encoding='utf-8')
board = Image.new('RGB', (1200, 660), '#fffefa')
draw = ImageDraw.Draw(board)
for i, record in enumerate(records):
    native = Image.open(folder / record['file']).convert('RGBA')
    for j, background in enumerate(['#ffffff', '#fffefa', '#173e5c']):
        cell = Image.new('RGBA', (300, 200), background)
        preview = native.copy(); preview.thumbnail((128, 128))
        cell.alpha_composite(preview, ((300-preview.width)//2, (200-preview.height)//2))
        small = native.copy(); small.thumbnail((60, 55))
        cell.alpha_composite(small, (120, 140))
        board.paste(cell.convert('RGB'), (i*300, j*220))
        draw.text((i*300+8, j*220+202), record['id']+' / '+background, fill='#173e5c')
board.save(app / 'docs/lesson-area-tiles/alpha-and-size-review.png')
print('Prepared four native object tiles and white/paper/navy review board.')
