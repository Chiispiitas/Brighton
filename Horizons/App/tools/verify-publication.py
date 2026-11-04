"""Read back the actual hosted runtime and compare it with committed bytes."""
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
import datetime, hashlib, json, re, subprocess, urllib.request, urllib.parse

repo = Path(__file__).resolve().parents[3]
app = repo / 'Horizons/App'
base = 'https://exams.bebrighton.net/Horizons/App/'
revision = subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=repo, text=True).strip()
paths = subprocess.check_output(['git', 'ls-tree', '-r', '--name-only', 'HEAD', '--', 'Horizons/App'], cwd=repo, text=True).splitlines()
selected = []
for path in paths:
    rel = path.removeprefix('Horizons/App/')
    if rel.startswith(('src/', 'content/', 'styles/')) or rel in ('index.html', 'manifest.webmanifest', 'service-worker.js', 'demo-codes.json'):
        selected.append(path)
    elif rel.startswith('assets/') and (rel.endswith(('.woff2', '.mp3', '.png')) or rel in ('assets/art/manifest.json', 'assets/audio/manifest.json')) and 'avatar-kit-v1.png' not in rel:
        selected.append(path)
source = (app / 'content/unit1.mjs').read_text(encoding='utf-8')
audio = sorted(set(re.findall(r"audio:'([^']+\.mp3)'", source)))
for rel in audio:
    selected.append((Path('Horizons/App') / rel).as_posix().replace('App/../', ''))

def verify(path):
    expected = subprocess.check_output(['git', 'show', f'HEAD:{path}'], cwd=repo)
    url = 'https://exams.bebrighton.net/' + urllib.parse.quote(path, safe='/') + '?release=' + revision[:12]
    try:
        with urllib.request.urlopen(urllib.request.Request(url, headers={'Cache-Control': 'no-cache'}), timeout=45) as response:
            received = response.read()
            return {'path': path, 'status': response.status, 'bytes': len(received), 'sha256': hashlib.sha256(received).hexdigest(), 'matchesCommittedBytes': received == expected}
    except Exception as error:
        return {'path': path, 'error': str(error), 'matchesCommittedBytes': False}

with ThreadPoolExecutor(max_workers=10) as pool:
    results = list(pool.map(verify, sorted(set(selected))))
report = {'date': datetime.datetime.now(datetime.timezone.utc).isoformat(), 'url': base, 'revision': revision, 'checkedFiles': len(results), 'bookSourceRecordings': len(audio), 'pass': all(item['matchesCommittedBytes'] for item in results), 'files': results}
(app / 'reports/publication-assets.json').write_text(json.dumps(report, indent=2) + '\n', encoding='utf-8')
print(json.dumps({key: report[key] for key in ('url', 'revision', 'checkedFiles', 'bookSourceRecordings', 'pass')}))
for item in results:
    if not item['matchesCommittedBytes']:
        print(json.dumps(item))
raise SystemExit(0 if report['pass'] else 1)
