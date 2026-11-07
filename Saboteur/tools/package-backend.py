"""Create reproducible backend release archives without credentials or local state."""
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED
import hashlib
import json

root = Path(__file__).resolve().parents[1] / 'wix-backend'
for archive, directories in [('build.zip', ['dist', '.wix']), ('source.zip', ['src'])]:
    paths = []
    for directory in directories:
        paths.extend((root / directory).rglob('*'))
    if archive == 'source.zip':
        paths.extend(root / name for name in ['package.json','package-lock.json','astro.config.mjs','wix.config.json','wrangler.json','tsconfig.json','.gitignore','.env.example','DEPLOYMENT.md'])
    with ZipFile(root / archive, 'w', ZIP_DEFLATED) as bundle:
        for path in sorted(paths):
            if path.is_file() and path.suffix != '.log':
                bundle.write(path, path.relative_to(root).as_posix())
    result = root / archive
    print(json.dumps({'archive':archive,'size':result.stat().st_size,'sha256':hashlib.sha256(result.read_bytes()).hexdigest()}))
