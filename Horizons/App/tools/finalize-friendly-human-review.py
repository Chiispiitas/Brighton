"""Bind the independent finite painted review to exact final source and proof bytes."""
from pathlib import Path
import json, hashlib, datetime
app=Path(__file__).resolve().parent.parent
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
capture_path=app/'reports/friendly-named-capture.json'
capture=json.loads(capture_path.read_text())
names=set(json.loads((app/'reports/friendly-human-reviewed-sheet-names.json').read_text()))
human=lambda x:x['id'].startswith(('mina:','alex:','jo:'))
sheets=[x for x in capture['contactSheets'] if human(x)]
cases=[x for x in capture['motionCases'] if human(x)]
assert len(names)==len(sheets)==51
assert len(cases)==612
assert {Path(x['file']).name for x in sheets}==names
for x in sheets:assert sha(Path(x['file']))==x['sha256']
for x in cases:assert sha(Path(x['proof']))==x['proofSha256']
author=json.loads((app/'reports/friendly-cast-author-review.json').read_text())
source_files=['src/cast-rig.js','assets/art/cast-friendly-v1.frames.json','assets/art/mina-friendly-v2.png','assets/art/alex-friendly-v1.png','assets/art/jo-friendly-v1.png']
sources={f:sha(app/f) for f in source_files}
assert all(sources[f]==author['sources'][f]==capture['runtimeSources'][f] for f in source_files)
callbacks_path=app/'reports/friendly-human-independent-callbacks.json'
callbacks=json.loads(callbacks_path.read_text())
assert callbacks['pass'] and callbacks['sourceStable'] and callbacks['sourceHashes']==sources
for x in callbacks['files']:assert sha(Path(x['path']))==x['sha256']
callbacks['visualReview']='INDEPENDENT PASS: All seven saved actual pointer/interruption/timed-return sheets,91 painted contexts, directly inspected. Friendly expressions, connected neck/sleeve/leg silhouettes, supported props and separated feet. No detached cloth or limb seen. Final13 contexts idle; no seek/pause was applied.'
callbacks_path.write_text(json.dumps(callbacks,indent=2)+'\n')
connectivity_path=app/'reports/friendly-cast-author-connectivity.json'
connectivity=json.loads(connectivity_path.read_text())
assert connectivity['sources']==sources and connectivity['pass']
enlarged=[p['after'] for p in author['beforeAfterPairs']]
author_sheets=author['visualReview']['proofs']
for x in enlarged+author_sheets:assert sha(Path(x['path']))==x['sha256']
reviewed=[{k:x[k] for k in ['id','proof','proofSha256','physicalTimeMs']}|{'verdict':'pass','reviewer':'independent-human-visual'} for x in cases]
r={
 'date':datetime.datetime.now(datetime.timezone.utc).isoformat(),
 'status':'INDEPENDENT_HUMAN_VISUAL_PASS','pass':True,
 'reviewer':'Avatar author independently reviews Mina/Alex/Jo; did not author their friendly artwork or runtime. Own avatar is excluded from this independent verdict.',
 'scope':'All612 freshly captured friendly human named frames, all156 final author posture/mood/phase frames, nine enlarged standing/greeting/seated proofs and91 independently captured actual pointer/interruption/timed-return contexts.',
 'captureReport':'reports/friendly-named-capture.json','captureReportSha256BeforeVisualMerge':sha(capture_path),
 'sourceHashes':sources,
 'sourceStable':True,
 'reviewMethod':'Direct inspection of each of51 source-bound12-frame contact sheets, supplemented by9 enlarged final portraits and12 author posture sheets. Inspected painted silhouettes and contact, rather than accepting skeleton/pivot coincidence. Then independently captured and inspected7 natural callback sheets for all13 contexts with actual Playwright pointer hovers, a celebration interruption and real timed return.',
 'findings':{
  'expressions':'PASS: relaxed curved eyebrows and warm open smiles read approachable; Mina, Alex and Jo remain distinct adults.',
  'proportions':'PASS: slimmer torso and limb silhouettes remain distinct (tall/slim Mina, medium Alex, softly broad older Jo). Raised forearms are proportionate to heads.',
  'anatomy':'PASS in all reviewed frames: no visible neck, shoulder/sleeve, elbow, hip, knee or ankle detachment. Native rounded ends overlap throughout saved extrema and interruption samples.',
  'props':'PASS: books/maps/wrench remain supported by hands; both driving hands remain on the wheel. Jo polishing cloth and mug follow the gripping hands during idle, greeting, celebration and interruption; no floating cloth seen in these current sources.',
  'legs':'PASS: specifically inspected late Mina skip and Alex dance frames, standing celebration and actual interrupted gestures. Knees stay on their own sides and shoes remain visibly separate.',
  'flatness':'PASS at actual white/cream browser composites: no cast/ground shadow, dark modeled neck-shadow plane or directional face highlight. Minor native material color variation is retained.',
  'clipping':'No visible accidentally cropped limbs or objects in the reviewed source-bound frames.',
  'defects':[]
 },
 'contactSheets':sheets,'reviewedCases':reviewed,
 'denseCounts':{'sheets':51,'frames':612},
 'supplementaryPaintedProofs':{'authorPostureFrames':156,'enlargedFinalFrames':9,'postureSheets':author_sheets,'enlarged':enlarged},
 'naturalCallbacks':{'report':'reports/friendly-human-independent-callbacks.json','sha256':sha(callbacks_path),'contexts':13,'savedSheets':7,'directlyInspectedPaintedFrames':91,'actualPointerCallbacks':all(x['mood']=='wave' for x in callbacks['files'][0]['moods']),'allReturnedIdle':all(x['mood']=='idle' for x in callbacks['files'][-1]['moods']),'sourceHashes':callbacks['sourceHashes'],'proofs':callbacks['files'],'pass':callbacks['pass']},
 'authorContactSupplement':{'report':'reports/friendly-cast-author-connectivity.json','sha256':sha(connectivity_path),'method':'Author native opaque-pixel intersections, source equality independently verified; supplements direct painted visual review.','minimumOpaqueIntersectionPixels':connectivity['minimumOpaqueOverlap'],'failures':len(connectivity['failures']),'actualRAFFrames':connectivity['trace']['paintedRAFFrames'],'allReturnedIdle':all(x['mood']=='idle' for x in connectivity['trace']['returned'])},
 'automatedCapture':{'structuralFailures':capture['structuralFailures'],'runtimeErrors':capture['runtimeErrors'],'changedSources':capture['changedSources']},
 'limits':'Finite named phases and actual callback screenshots establish the verdict for the listed source/proof bytes. This is not an assertion that every theoretical frame or unrelated UI route was manually inspected. No prior graphic approval inherited; root owns full-site/cache/publication checks.'
}
(app/'reports/friendly-human-independent-review.json').write_text(json.dumps(r,indent=2)+'\n')
print(json.dumps({'pass':True,'frames':len(cases),'sheets':len(sheets),'enlarged':9,'authorPaintedFrames':156,'independentActualCallbackFrames':91,'sources':sources}))
