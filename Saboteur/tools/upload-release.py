"""Send generated release files to short-lived Wix upload URLs supplied via hidden stdin."""
import getpass
import json
from pathlib import Path
from urllib.request import Request, urlopen
from concurrent.futures import ThreadPoolExecutor

job = json.loads(getpass.getpass('Upload JSON (hidden): '))
root = Path(__file__).resolve().parents[1] / 'wix-backend'
def upload(entry):
    data = (root / entry['file']).read_bytes()
    request = Request(entry['url'], data=data, method='PUT', headers={'Content-Type':'application/zip','Content-Length':str(len(data))})
    with urlopen(request, timeout=90) as response:
        print(json.dumps({'file':entry['file'],'status':response.status,'size':len(data)}), flush=True)
with ThreadPoolExecutor(max_workers=2) as pool:
    list(pool.map(upload, job))
