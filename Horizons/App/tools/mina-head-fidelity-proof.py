"""Independent checks for Mina's source-geometry head repair and neutral anchors.

This is a verification/contact-sheet recipe, not an art generation/editing recipe.
The generated whole-face skin fill is deliberately NOT claimed pixel-identical.
"""
from pathlib import Path
import hashlib
import json
import subprocess
from collections import deque
import numpy as np
from PIL import Image, ImageDraw, ImageFont

APP = Path(__file__).resolve().parents[1]
ROOT = APP / 'assets/art/mina-motion-v1'
DOC = APP / 'docs/mina-motion-v1'
METADATA = json.loads((DOC / 'head-fidelity.json').read_text())
SOURCE = APP / 'assets/art/cast-static-mina-v2.png'
source_bytes = SOURCE.read_bytes()
committed = subprocess.check_output(['git', 'show', 'HEAD:Horizons/App/assets/art/cast-static-mina-v2.png'], cwd=APP)
assert hashlib.sha256(source_bytes).digest() == hashlib.sha256(committed).digest(), 'Accepted source atlas changed'
accepted_manifest = json.loads(subprocess.check_output(['git', 'show', 'HEAD:Horizons/App/assets/art/manifest.json'], cwd=APP))
atlas = Image.open(SOURCE).convert('RGBA')
rigs = json.loads((ROOT / 'rigs.json').read_text())['poses']
production = json.loads((DOC / 'production-record.json').read_text())
native_hashes = []
for item in production['records']:
    if item.get('nativeFile') and item.get('nativeSha256'):
        actual = hashlib.sha256((APP / item['nativeFile']).read_bytes()).hexdigest()
        assert actual == item['nativeSha256'], item['id'] + ': raw native output changed'
        native_hashes.append({'id': item['id'], 'file': item['nativeFile'], 'sha256': actual})
checks = []
board = Image.new('RGB', (1080, 1240), '#fffefa')
draw = ImageDraw.Draw(board)
font = ImageFont.truetype('C:/Windows/Fonts/arial.ttf', 19)


def active_bounds(mask):
    yy, xx = np.where(mask)
    assert len(xx)
    return [int(xx.min()), int(yy.min()), int(xx.max()) + 1, int(yy.max()) + 1]


def largest_component(mask):
    seen = np.zeros(mask.shape, bool)
    best = []
    for y, x in zip(*np.where(mask)):
        if seen[y, x]:
            continue
        pending = deque([(int(x), int(y))])
        seen[y, x] = True
        found = []
        while pending:
            u, v = pending.popleft()
            found.append((u, v))
            for a, b in ((u-1, v), (u+1, v), (u, v-1), (u, v+1)):
                if 0 <= b < mask.shape[0] and 0 <= a < mask.shape[1] and mask[b, a] and not seen[b, a]:
                    seen[b, a] = True
                    pending.append((a, b))
        if len(found) > len(best):
            best = found
    result = np.zeros(mask.shape, bool)
    for x, y in best:
        result[y, x] = True
    return result



def interior_holes(mask):
    outside = np.zeros(mask.shape, bool)
    pending = deque()
    for x in range(mask.shape[1]):
        for y in (0, mask.shape[0]-1):
            if not mask[y,x] and not outside[y,x]:
                outside[y,x] = True
                pending.append((x,y))
    for y in range(mask.shape[0]):
        for x in (0, mask.shape[1]-1):
            if not mask[y,x] and not outside[y,x]:
                outside[y,x] = True
                pending.append((x,y))
    while pending:
        x,y = pending.popleft()
        for u,v in ((x-1,y),(x+1,y),(x,y-1),(x,y+1)):
            if 0<=v<mask.shape[0] and 0<=u<mask.shape[1] and not mask[v,u] and not outside[v,u]:
                outside[v,u]=True
                pending.append((u,v))
    return ~mask & ~outside


def roi_mask(shape, box):
    mask = np.zeros(shape, bool)
    x0, y0, x1, y1 = box
    mask[y0:y1, x0:x1] = True
    return mask


for index, meta in enumerate(METADATA):
    pose = meta['pose']
    baseline_file = ROOT / 'baseline' / (pose + '.png')
    assert hashlib.sha256(baseline_file.read_bytes()).hexdigest() == meta['baselineSha256']
    baseline = Image.open(baseline_file).convert('RGBA')
    frame = accepted_manifest['postures']['mina'][pose]['frame']
    crop = atlas.crop((frame['x'], frame['y'], frame['x'] + frame['w'], frame['y'] + frame['h']))
    original = np.array(baseline)
    assert np.array_equal(original, np.array(crop)), pose + ': baseline is not exact accepted atlas crop'
    shape = original.shape[:2]
    head_image = Image.open(APP / rigs[pose]['parts']['head']).convert('RGBA')
    head = np.array(head_image)
    face_alpha = np.array(Image.open(ROOT / meta['faceMask']).convert('L'))
    structure_alpha = np.array(Image.open(ROOT / meta['structureMask']).convert('L'))
    assert face_alpha.shape == structure_alpha.shape == shape
    assert not np.any((face_alpha > 0) & (structure_alpha > 0)), pose + ': masks overlap'
    expected_alpha = np.maximum(face_alpha, structure_alpha)
    assert np.array_equal(head[:, :, 3], expected_alpha), pose + ': exterior head alpha changed'
    selected = expected_alpha > 0
    assert np.array_equal(expected_alpha[selected], original[:, :, 3][selected]), pose + ': alpha not retained from original'
    structure = structure_alpha > 0
    assert np.array_equal(head[structure], original[structure]), pose + ': preserved exterior/neck pixels changed'
    # Named facial landmarks were solid in the accepted still: no old-eye/mouth alpha holes.
    feature_union = np.zeros(shape, bool)
    for feature_box in meta['browBoxes'] + meta['eyeBoxes'] + [meta['mouthBox']]:
        feature_union |= roi_mask(shape, feature_box)
    solid_landmarks = feature_union & (original[:, :, 3] > 0)
    assert np.array_equal(head[:, :, 3][solid_landmarks], original[:, :, 3][solid_landmarks]), pose + ': internal facial alpha hole'
    reference_file = ROOT / (pose + '-head-original.png')
    reference = np.array(Image.open(reference_file).convert('RGBA'))
    assert np.array_equal(reference[:, :, 3], expected_alpha), pose + ': head reference silhouette mismatch'
    assert np.array_equal(reference[selected], original[selected]), pose + ': head reference differs from accepted source'
    face_rows = np.indices(shape)[0] < meta['neckStart']
    # Below the neck, deliberate garment removal can enclose a tiny source fringe.
    # The invariant here is a solid face, not retaining shirt pixels in the head.
    holes = interior_holes(head[:, :, 3] > 0) & (original[:, :, 3] > 0) & face_rows
    assert not holes.any(), pose + ': new enclosed alpha holes inside original solid face'
    assert np.any(face_alpha > 0)
    assert np.any(head[face_alpha > 0, :3] != original[face_alpha > 0, :3]), pose + ': no generated whole-face fill present'
    r, g, b, alpha = [original[:, :, c].astype(np.int16) for c in range(4)]
    hair_candidate = (r > 45) & (r < 185) & (g < 120) & (b < 110) & (r > g + 20) & (alpha > 180) & selected
    # A brow can touch the swept hair in the accepted source. Exclude named facial glyph
    # regions before identifying the anatomical hair component, including their antialias fringe.
    feature_regions = np.zeros(shape, bool)
    for glyph_box in meta['browBoxes'] + meta['eyeBoxes'] + [meta['mouthBox']]:
        x0, y0, x1, y1 = glyph_box
        feature_regions |= roi_mask(shape, [max(0, x0-2), max(0, y0-2), min(shape[1], x1+2), min(shape[0], y1+2)])
    hair = largest_component(hair_candidate & ~feature_regions)
    assert hair.sum() > 1000 and np.array_equal(head[hair], original[hair]), pose + ': original hair pixels changed'
    earring = largest_component((r > 215) & (g > 180) & (b < 90) & (alpha > 180) & selected)
    assert earring.sum() > 20 and np.array_equal(head[earring], original[earring]), pose + ': earring changed'
    yy, xx = np.indices(shape)
    neck = structure & (yy >= meta['neckStart']) & (r > 185) & (g > 90) & (b > 35) & (r > g + 35)
    assert neck.sum() > 20 and np.array_equal(head[neck], original[neck]), pose + ': neck changed'
    neutral_image = Image.open(APP / rigs[pose]['parts']['neutral']).convert('RGBA')
    pupil_image = Image.open(APP / rigs[pose]['parts']['pupils']).convert('RGBA')
    neutral, pupils = np.array(neutral_image), np.array(pupil_image)
    for name, part in [('neutral', neutral), ('pupils', pupils)]:
        mask = part[:, :, 3] > 0
        assert mask.any() and np.array_equal(part[mask], original[mask]), pose + ': ' + name + ' translated, resampled or repainted'
    dark = (np.maximum.reduce([r, g, b]) < 105) & (alpha > 128)
    brow_checks = []
    for box in meta['browBoxes']:
        core = dark & roi_mask(shape, box)
        assert core.any() and np.all(neutral[:, :, 3][core] > 0), pose + ': original brow anchor lost'
        brow_checks.append({'box': box, 'nativeCorePixels': int(core.sum())})
    mouth_roi = roi_mask(shape, meta['mouthBox'])
    mouth_core = mouth_roi & (r > g + 30) & (r > b + 15) & (g < 140) & (b < 170) & (alpha > 0)
    assert mouth_core.any() and np.all(neutral[:, :, 3][mouth_core] > 0), pose + ': original mouth anchor lost'
    pupil_checks = []
    eyes_image = Image.open(APP / rigs[pose]['parts']['eyes']).convert('RGBA')
    eyes = np.array(eyes_image)
    for box in meta['eyeBoxes']:
        region = roi_mask(shape, box)
        original_pupil = largest_component(dark & region)
        registered_dark = (np.max(pupils[:, :, :3], axis=2) < 105) & (pupils[:, :, 3] > 128) & region
        assert original_pupil.any() and np.array_equal(original_pupil, registered_dark), pose + ': pupil core moved'
        source_white = region & (np.minimum.reduce([r, g, b]) > 195) & ((np.maximum.reduce([r, g, b]) - np.minimum.reduce([r, g, b])) < 50) & (alpha > 128)
        assert np.all(eyes[:, :, 3][source_white] > 0), pose + ': original white-eye geometry lost'
        y, x = np.where(original_pupil)
        pupil_checks.append({'eyeBox': box, 'pupilCoreBox': active_bounds(original_pupil), 'pupilCoreCentroid': [float(x.mean()), float(y.mean())]})
    assembled = head_image.copy()
    for part in [neutral_image, eyes_image, pupil_image]:
        assembled.alpha_composite(part)
    original_head = original.copy()
    original_head[:, :, 3] = expected_alpha
    box = active_bounds(selected)
    # A generous native-coordinate crop keeps hair/earring/neck visible in all three comparisons.
    x0, y0, x1, y1 = box
    box = (max(0, x0-5), max(0, y0-5), min(shape[1], x1+5), min(shape[0], y1+5))
    for col, (label, image) in enumerate([('Accepted original', Image.fromarray(original_head)), ('Faceless base', head_image), ('Neutral assembly', assembled)]):
        picture = image.crop(box)
        picture.thumbnail((325, 260), Image.Resampling.LANCZOS)
        x = col * 360 + (360 - picture.width)//2
        y = index * 310 + 40
        board.paste(picture, (x, y), picture)
        draw.text((col*360+12, index*310+10), pose + ' / ' + label, fill='#173e5c', font=font)
    checks.append({'pose': pose, 'baselineExactAtlasCrop': True, 'baselineSha256': meta['baselineSha256'], 'headAlphaExactOriginalSelection': True, 'noInternalFaceAlphaHolesAtNativeLandmarks': True, 'newEnclosedFaceAlphaHoles': 0, 'structurePixelsExact': int(structure.sum()), 'hairPixelsExact': int(hair.sum()), 'earringPixelsExact': int(earring.sum()), 'neckPixelsExact': int(neck.sum()), 'wholeFaceFillChanged': True, 'neutralOriginalPixelSelection': True, 'brows': brow_checks, 'mouthBox': meta['mouthBox'], 'mouthCorePixelsExact': int(mouth_core.sum()), 'pupils': pupil_checks})

board.save(DOC / 'head-fidelity-proof.png', optimize=True)
report = {'pass': True, 'acceptedAtlasSha256': hashlib.sha256(source_bytes).hexdigest(), 'sourceAtlasMatchesCommittedBytes': True, 'nativeOutputHashesVerified': native_hashes, 'poses': checks, 'review': 'docs/mina-motion-v1/head-fidelity-proof.png', 'scope': 'Structural/exterior RGBA and selected neutral native feature coordinates are checked against each accepted pose. The face interior and removed-brow footprint use generated faceless material and are explicitly not claimed pixel-identical. Body/gesture reconstruction and animated extrema require the separate runtime/visual review.'}
(APP / 'reports/mina-head-fidelity.json').write_text(json.dumps(report, indent=2) + '\n')
print('PASS exact accepted atlas/baselines, exterior alpha, hair/earring/neck pixels and native neutral feature anchors across four poses')
