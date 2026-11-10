"""Package reproducible build and standalone source without local credentials."""
import pathlib
import os
import sys
import zipfile

root = pathlib.Path(__file__).resolve().parents[1]
destination = pathlib.Path(sys.argv[1]).resolve()
destination.mkdir(parents=True, exist_ok=True)
with zipfile.ZipFile(destination / 'assessment-build.zip', 'w', zipfile.ZIP_DEFLATED) as archive:
    for folder in ('dist', '.wix'):
        files = sorted((root / folder).rglob('*'))
        if not files:
            raise RuntimeError(f'Missing build folder: {folder}')
        for file in files:
            if file.is_file():
                archive.write(file, file.relative_to(root).as_posix())
with zipfile.ZipFile(destination / 'assessment-source.zip', 'w', zipfile.ZIP_DEFLATED) as archive:
    source_files = []
    for directory, folders, names in os.walk(root):
        folders[:] = sorted(name for name in folders if name not in {'node_modules', 'dist', '.wix', '.astro', 'generated', 'canonical'})
        source_files.extend(pathlib.Path(directory) / name for name in sorted(names))
    for file in source_files:
        rel = file.relative_to(root)
        if not file.is_file() or any(part in {'node_modules', 'dist', '.wix', '.astro', 'generated', 'canonical'} for part in rel.parts):
            continue
        if (file.name.startswith('.env') and file.name != '.env.example') or file.suffix == '.zip':
            continue
        archive.write(file, rel.as_posix())
    for folder in ('Placement/wix-backend', 'Placement/YoungLearners/wix-backend'):
        source = root.parent / folder
        if not source.is_dir():
            source = root / 'canonical' / folder
        for file in sorted(source.glob('*.js')):
            archive.write(file, f'canonical/{folder}/{file.name}')
    key_base = root.parent / 'Exams/answer-keys'
    if not key_base.is_dir():
        key_base = root / 'canonical/Exams/answer-keys'
    import json
    version = json.loads((key_base / 'version.json').read_text())['currentVersion']
    archive.write(key_base / 'version.json', 'canonical/Exams/answer-keys/version.json')
    for file in sorted((key_base / 'versions' / version).glob('*.json')):
        archive.write(file, f'canonical/Exams/answer-keys/versions/{version}/{file.name}')
for name in ('assessment-build.zip', 'assessment-source.zip'):
    print(f'{name}: {(destination / name).stat().st_size} bytes')
