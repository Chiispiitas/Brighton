"""Record native artwork and exact prompt provenance for this correction."""
import datetime,hashlib,json
from pathlib import Path
app=Path(__file__).resolve().parents[1]; art=app/'assets/art'
def digest(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def sources(value):
    found=set()
    if isinstance(value,dict):
        if isinstance(value.get('src'),str) and value['src'].endswith('.png'):found.add(value['src'])
        for item in value.values():found|=sources(item)
    elif isinstance(value,list):
        for item in value:found|=sources(item)
    return found
active={'assets/art/app-icon-friendly-v2.png','assets/art/profile-friendly-v2.png'}
metadata=[]
for name in ['avatar-friendly-v1.frames.json','pico-friendly-v1.frames.json','cast-friendly-v1.frames.json','jobs-friendly-v1.frames.json']:
    p=art/name
    if p.exists():
        active|=sources(json.loads(p.read_text()));metadata.append({'path':str(p),'sha256':digest(p)})
manifest=json.loads((art/'manifest.json').read_text())
active|={p for p in sources(manifest.get('vocabulary',{})) if 'friendly' in p}
prompts=[{'path':str(p),'sha256':digest(p),'record':json.loads(p.read_text())} for p in sorted(art.glob('*friendly*.provenance.json'))]
report={'date':datetime.datetime.now(datetime.timezone.utc).isoformat(),'tool':'built-in image_gen','scope':'Friendly faces and balanced proportions; new male/female avatar bases; painted body-part connectivity corrections.','selectedNativeFiles':[{'path':str(app/p),'repositoryPath':'Horizons/App/'+p,'sha256':digest(app/p)} for p in sorted(active)],'metadata':metadata,'promptSets':prompts,'pixelPolicy':'Native generated images retained. Alpha analysis, crop/registration metadata and browser articulation only; no code painting or replacement character vectors.','retainedArt':'Existing native hair/accessories, earned pins and inert town/control props are retained where compatible; active new face and garment parts are selected by friendly frame metadata.'}
(app/'reports/friendly-art-record.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps({'selectedNativeFiles':len(active),'promptSets':len(prompts),'report':'reports/friendly-art-record.json'}))
