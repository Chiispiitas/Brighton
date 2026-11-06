"""Register separately generated Pico streak layers without drawing replacement art.

Native ImageGen files and the approved Pico head/feature originals remain unchanged.
Registration is uniform scale/translation; a deliberately opaque magenta repair can
be keyed only when explicitly disclosed in registration-spec.json. The head and
every inherited facial layer share one affine transform, preserving their anchors.
"""
from pathlib import Path
import argparse
import hashlib
import json
from PIL import Image, ImageDraw, ImageFilter
import numpy as np

APP = Path(__file__).resolve().parents[1]
ROOT = APP / 'assets/art/streak-campfire-v1'
DOC = APP / 'docs/streak-campfire-v1'
W, H = 760, 500


def digest(file):
    return hashlib.sha256(file.read_bytes()).hexdigest()


def read(path):
    return json.loads(path.read_text(encoding='utf-8'))


def write(path, value):
    path.write_text(json.dumps(value, indent=2) + '\n', encoding='utf-8')


def load(spec):
    path = ROOT / spec['source']
    im = Image.open(path).convert('RGBA')
    if spec.get('keyMagenta'):
        a = np.array(im)
        r, g, b, alpha = a.transpose(2, 0, 1).astype(int)
        key = (r > 180) & (b > 150) & (g < 120) & (r - g > 80) & (b - g > 80)
        if key.mean() < .1:
            raise ValueError('Declared opaque magenta intermediate lacks its key: ' + str(path))
        a[:, :, 3] = np.where(key, 0, alpha).astype(np.uint8)
        im = Image.fromarray(a)
    if spec.get('selection'):
        # Source-pixel selection only. The torso-inclusive authored keypose
        # occludes this lower support's waist cut; no new silhouette is drawn.
        rule = spec['selection']
        a = np.array(im)
        yy, xx = np.indices(a.shape[:2])
        if rule.get('satchelOnly'):
            r, g, b, alpha = a.transpose(2, 0, 1).astype(int)
            roi = (xx < 433) & (xx > 226) & (yy > 773) & (yy < 999)
            colored = ((r > 130) & (g < 100) & (b > 40)) | ((r > 200) & (g > 130) & (b < 100))
            keep = np.array(Image.fromarray(np.uint8(roi & colored) * 255).filter(ImageFilter.MaxFilter(3))) > 0
            keep &= roi
        else:
            keep = yy >= rule['minSourceY']
        if rule.get('keepSatchel'):
            bag = rule['keepSatchel']
            keep |= (yy >= bag['minSourceY']) & (xx <= bag['maxSourceX'])
        a[:, :, 3] = np.where(keep, a[:, :, 3], 0)
        im = Image.fromarray(a)
    return im, path


def bounds(im):
    result = im.getchannel('A').point(lambda x: 255 if x > 96 else 0).getbbox()
    if result is None:
        raise ValueError('Native image has no solid alpha')
    return result


def blank():
    return Image.new('RGBA', (W, H))


def place(im, spec):
    source_box = spec.get('sourceBox') or bounds(im)
    crop = im.crop(source_box)
    x, y, width, height = spec['box']
    scale = min(width / crop.width, height / crop.height)
    size = (max(1, round(crop.width * scale)), max(1, round(crop.height * scale)))
    offset = (round(x + (width - size[0]) / 2), round(y + (height - size[1]) / 2))
    out = blank()
    out.alpha_composite(crop.resize(size, Image.Resampling.LANCZOS), offset)
    return out, {'sourceBox': list(source_box), 'targetBox': spec['box'],
                 'uniformScale': scale, 'offset': list(offset), 'size': list(size),
                 'keyMagenta': bool(spec.get('keyMagenta')), 'selection': spec.get('selection')}


def shared_affine(im, scale, offset):
    out = blank()
    size = (round(im.width * scale), round(im.height * scale))
    out.alpha_composite(im.resize(size, Image.Resampling.LANCZOS), tuple(round(n) for n in offset))
    return out


def composite(images, order):
    result = blank()
    for name in order:
        im = images[name]
        if name in ['fireEmber', 'fireSmall', 'fireIgnite', 'fireFull']:
            a = np.array(im).copy()
            a[:, :, 3] = np.minimum(a[:, :, 3], np.array(images['fireMask'])[:, :, 3])
            im = Image.fromarray(a)
        result.alpha_composite(im)
    return result


def provenance():
    """Refresh records/hashes without rewriting any frozen runtime PNG/manifest."""
    native_roles = {
        'upper-roast': ('rejected', 'User rejected low forelimb attachments below the shirt shoulder line; replaced by separately generated shoulder repair.'),
        'upper-lift': ('rejected', 'User rejected low forelimb attachments below the shirt shoulder line; replaced by separately generated shoulder repair.'),
        'seated-reference': ('reference-only', 'Accepted seated geometry reference; original approved Pico blank head/features are reused.'),
        'arm-roast': ('rejected', 'Broad blurry glow around the isolated cartoon forelimbs/skewer.'),
        'arm-lift': ('rejected', 'Broad blurry glow around the isolated cartoon forelimbs/skewer.'),
        'face-excited': ('rejected', 'Broad exterior semitransparency and red scatter around glyphs.'),
        'arm-lift-clean': ('superseded-unused', 'Clean native group, replaced by coherent clothed upper-body keyposes after interaction alignment review.'),
    }
    snapshots = []
    for identity, filename in [('R01', '01-brand.png'), ('R02', '02-cast.png'), ('R07', '07-scenes-vocabulary-ui.png')]:
        file = DOC / 'inputs' / filename
        snapshots.append({'id': identity, 'file': str(file.relative_to(APP)).replace('\\', '/'), 'sha256': digest(file)})
    records, checks = [], []
    for file in sorted(DOC.glob('*-generation.json')):
        record = read(file)
        part = record['part']
        preflight = read(APP / record['preflight'])
        assert preflight['pass'] and preflight['input_count'] <= 5, part
        assert record['referenced_image_paths'] == preflight['input_paths'], part
        assert {i.get('id') for i in preflight['inputs'] if i['role'] == 'reference'} == {'R01', 'R02', 'R07'}, part
        for item in preflight['inputs']:
            if item['role'] == 'reference':
                frozen = next(r for r in snapshots if r['id'] == item['id'])
                assert frozen['sha256'] == item['sha256'], (part, item['id'])
                item['frozenCopy'] = frozen['file']
            else:
                assert digest(Path(item['path'])) == item['sha256'], (part, item['path'])
        native_file = APP / record['native_path'] if record.get('native_path') else None
        if native_file:
            record['nativeSha256'] = digest(native_file)
            assert digest(Path(record['output_path'])) == record['nativeSha256'], part
            role, reason = native_roles.get(part, ('active-native', 'Native source used by registered final artwork.'))
            record['status'], record['productionRole'] = role, reason
        records.append({'id': part, 'recordFile': str(file.relative_to(APP)).replace('\\', '/'),
                        **record, 'preflightEvidence': preflight})
        checks.append({'id': part, 'mandatoryReferencesAttached': True,
                       'actualPathsMatchPreflight': True, 'exactInputHashesMatch': True,
                       'nativeBytesPreserved': True if native_file else None,
                       'noOutputCreated': not bool(native_file)})
    input_failure = read(DOC / 'arm-roast-down-input-cap-failed.json')
    native_count = sum(bool(r.get('native_path')) for r in records)
    failures = [r for r in records if not r.get('native_path')]
    rejected = [r['id'] for r in records if r['status'] == 'rejected']
    rig_path = ROOT / 'rigs.json'
    rig = read(rig_path)
    startup_still = 'assets/art/streak-campfire-v1/roast-reconstruction.png'
    active = sorted(set(rig['parts'].values()) | {rig['fallback'], startup_still})
    active_bytes = sum((APP / p).stat().st_size for p in active)
    originals = []
    for file in sorted((ROOT / 'baseline').glob('*.png')):
        original = APP / 'assets/art/pico-banner-motion-v1' / file.name
        assert digest(file) == digest(original), file.name
        originals.append({'file': str(file.relative_to(APP)).replace('\\', '/'),
                          'original': str(original.relative_to(APP)).replace('\\', '/'),
                          'sha256': digest(file), 'unchangedBytes': True})
    record = {'date': '2026-11-06', 'tool': 'built-in ImageGen', 'perPartGeneration': True,
              'nativeOutputs': native_count, 'generationAttempts': len(records),
              'generationFailuresWithoutOutput': len(failures), 'toolValidationFailuresBeforeGeneration': 1,
              'rejectedNativeOutputs': rejected, 'records': records,
              'inputLimitFailure': input_failure, 'inheritedApprovedSources': originals,
              'registrations': 'docs/streak-campfire-v1/registrations.json',
              'nativeBytesUnchanged': True, 'activePngBytes': active_bytes,
              'activePngCount': len(active), 'activeManifestBytes': rig_path.stat().st_size,
              'startupStill': startup_still,
              'nativeSourcesPrecached': False,
              'mechanicalDerivatives': [
                  'Uniform crop/scale/translation of separate native sprites onto a760x500canvas.',
                  'Declared magenta key extraction for authored fire frames, new excited glyphs and upper-body keyposes.',
                  'Existing accepted faceless head and all neutral features share one uniform affine transform.',
                  'Source-pixel lower-body/stump crop and separate existing satchel selection preserve fixed support and front occlusion.',
                  'Native navy opening pixels define the flame mask, excluding native crossed logs; no new arch/log geometry is drawn.'
              ],
              'review': {'rootTwoStateReconstructionApproved': True,
                        'board': 'docs/streak-campfire-v1/reconstruction.png',
                        'rootNormalSpeedFramesAndScreensReviewed': True,
                        'motionEvidence': 'reports/streak-motion.json',
                        'cacheEvidence': 'reports/streak-cache.json',
                        'humanAcceptanceClaimed': False,
                        'runtimeAndCacheEvidence': 'See reports/streak-motion.json and reports/streak-cache.json when final QA is complete.'}}
    write(DOC / 'production-record.json', record)
    binding_paths = ['tools/prepare-streak-campfire.py', 'src/streak-celebration.js',
                     'styles/streak-celebration.css', 'assets/art/streak-campfire-v1/rigs.json',
                     'src/app.js', 'index.html', 'service-worker.js',
                     'docs/streak-campfire-v1/registration-spec.json'] + active
    write(DOC / 'reference-manifest.json', {
        'version': 1, 'date': '2026-11-06', 'character': 'pico', 'scene': 'daily-streak-campfire',
        'canvas': {'width': W, 'height': H}, 'keyposes': ['upper-roast', 'upper-lift'],
        'productionRecord': 'docs/streak-campfire-v1/production-record.json',
        'mandatoryReferenceSnapshots': snapshots, 'inheritedApprovedSources': originals,
        'sourceBinding': [{'file': p, 'sha256': digest(APP / p)} for p in binding_paths if (APP / p).exists()],
        'reconstruction': 'docs/streak-campfire-v1/reconstruction.png',
        'notes': ['Native images remain unchanged; active PNGs are disclosed registered derivatives.',
                  'No whole-head expression swap, runtime skin patch, fade, extra wildlife or whole-room environment image.']})
    runtime_evidence = {}
    motion_file = APP / 'reports/streak-motion.json'
    if motion_file.exists():
        motion = read(motion_file)
        for item in motion['sourceBinding']:
            assert digest(APP / item['file']) == item['sha256'], ('motion proof stale', item['file'])
        runtime_evidence['motionSourceBindingExact'] = True
        runtime_evidence['motionReport'] = 'reports/streak-motion.json'
    cache_file = APP / 'reports/streak-cache.json'
    if cache_file.exists():
        cache = read(cache_file)
        assert cache['pass'] and cache['exactBytes'] and cache['offlineNativeRigReady']
        for item in cache['entries']:
            filename = item['file'].split('?')[0].removeprefix('./')
            assert digest(APP / filename) == item['sha256'], ('cache proof stale', filename)
        runtime_evidence['cacheSourceBytesExact'] = True
        runtime_evidence['cacheReport'] = 'reports/streak-cache.json'
        runtime_evidence['cacheName'] = cache['cacheName']
    write(DOC / 'production-check.json', {'pass': True, 'nativeOutputs': native_count,
          'generationAttempts': len(records), 'toolValidationFailures': 1,
          'rejectedNativeOutputs': rejected, 'callChecks': checks,
          'activePngBytes': active_bytes, 'activePngCount': len(active),
          'activeSourceHashesCurrent': True, 'inheritedApprovedBytesExact': True,
          'runtimeEvidence': runtime_evidence})
    print('Refreshed production provenance/hashes only; frozen runtime PNGs and rigs.json untouched.')


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--catalog', action='store_true', help='Report native sizes/bounds only')
    parser.add_argument('--provenance-only', action='store_true', help='Refresh records/hashes without touching frozen runtime art')
    args = parser.parse_args()
    if args.provenance_only:
        provenance()
        return
    if args.catalog:
        for path in sorted((ROOT / 'native').glob('*.png')):
            im = Image.open(path).convert('RGBA')
            print(json.dumps({'file': path.name, 'size': im.size, 'alphaBounds': bounds(im),
                              'sha256': digest(path)}))
        return

    spec_path = DOC / 'registration-spec.json'
    if not spec_path.exists():
        raise SystemExit('Accepted native art and registration-spec.json are required before preparation.')
    spec = read(spec_path)
    images, parts, registrations = {}, {}, []

    def save(name, image):
        filename = name + '.png'
        image.save(ROOT / filename, optimize=True)
        images[name] = image
        parts[name] = 'assets/art/streak-campfire-v1/' + filename

    inherited = {'head': 'head-faceless-registered.png', 'eyes': 'face-neutral-eyes.png',
                 'pupils': 'pupils-native.png', 'browsMouth': 'face-neutral-brows-mouth.png',
                 'nose': 'face-nose.png', 'blink': 'face-blink-eyelids.png'}
    transform = spec['headTransform']
    for name, filename in inherited.items():
        path = ROOT / 'baseline' / filename
        save(name, shared_affine(Image.open(path).convert('RGBA'), transform['scale'], transform['offset']))
        registrations.append({'part': name, 'source': str(path.relative_to(APP)).replace('\\', '/'),
                              'sha256': digest(path), 'sharedHeadTransform': transform})
    # Masks retain image alpha, not gray-channel opacity, for native browser mask-image.
    for name, source in [('eyeMask', images['eyes']), ('faceMask', images['head'])]:
        mask = blank()
        mask.putalpha(source.getchannel('A'))
        save(name, mask)

    for name, item in spec['parts'].items():
        native, path = load(item)
        registered, record = place(native, item)
        save(name, registered)
        registrations.append({'part': name, 'source': str(path.relative_to(APP)).replace('\\', '/'),
                              'sha256': digest(path), **record})

    # The native navy opening itself defines flame containment. Excluding the
    # native brown crossed logs lets them occlude flames, with no new arch/log art.
    hearth = np.array(images['fireplace']).astype(int)
    r, g, b, alpha = hearth.transpose(2, 0, 1)
    navy = (r < 100) & (g < 145) & (b < 200) & (b > r + 15) & (alpha > 0)
    fire_mask = blank()
    fire_mask.putalpha(Image.fromarray(np.where(navy, alpha, 0).astype(np.uint8)))
    save('fireMask', fire_mask)

    # Excited glyphs were separately authored by ImageGen. Each selected connected
    # component is uniformly placed at the accepted eye/brow/mouth anchors; there
    # is no generated whole-head swap or skin-patch expression.
    excited = blank()
    for item in spec.get('excitedGlyphs', []):
        native, path = load(item)
        registered, record = place(native, item)
        excited.alpha_composite(registered)
        registrations.append({'part': 'excited-glyph', 'source': str(path.relative_to(APP)).replace('\\', '/'),
                              'sha256': digest(path), **record})
    if not spec.get('excitedGlyphs'):
        raise ValueError('The separate excited-expression sprite needs reviewed glyph registrations')
    save('excited', excited)

    back = ['fireplace', 'body', 'head']
    face = ['browsMouth', 'eyes', 'pupils', 'nose']
    foreground = ['satchel'] if 'satchel' in images else []
    roast = composite(images, back + ['fireEmber'] + face + ['armRoast'] + foreground)
    lift = composite(images, back + ['fireFull', 'excited', 'nose', 'armLift'] + foreground)
    settled = composite(images, back + ['fireFull'] + face + ['armRoast'] + foreground)
    roast.save(ROOT / 'roast-reconstruction.png', optimize=True)
    lift.save(ROOT / 'lift-reconstruction.png', optimize=True)
    # A visible static final composition is the missing-part/reduced-motion fallback.
    settled.save(ROOT / 'reduced.png', optimize=True)
    manifest = {'width': W, 'height': H, 'parts': parts, 'pivots': spec['pivots'],
                'upperBodyKeyposes': bool(spec.get('upperBodyKeyposes')),
                'fallback': 'assets/art/streak-campfire-v1/reduced.png',
                'faceMask': parts['faceMask'], 'eyeMask': parts['eyeMask'], 'fireMask': parts['fireMask'],
                'keyposes': ['armRoast', 'armLift'],
                'flameFrames': ['fireEmber', 'fireSmall', 'fireIgnite', 'fireFull'],
                'layerOrder': back + ['fireEmber'] + face + ['armRoast'] + foreground}
    write(ROOT / 'rigs.json', manifest)
    write(DOC / 'registrations.json', registrations)
    board = Image.new('RGBA', (W * 2, H + 32), '#fffefa')
    draw = ImageDraw.Draw(board)
    for index, (label, picture) in enumerate([('Roast keypose', roast), ('Ignited / lifted keypose', lift)]):
        board.alpha_composite(picture, (index * W, 32))
        draw.text((index * W + 20, 8), label, fill='#173e5c')
    board.save(DOC / 'reconstruction.png')
    write(DOC / 'asset-hashes.json', {str(p.relative_to(APP)).replace('\\', '/'): digest(p)
                                    for p in sorted(ROOT.rglob('*.png'))})
    print('Prepared 760x500 streak layers. Direct reconstruction and animation-extreme review remain required.')


if __name__ == '__main__':
    main()
