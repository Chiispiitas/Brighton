"""Mechanical reference boards from current sprites and hosted-renderer captures.

Run capture-pico-preview.mjs first with HZ_PREVIEW_BASE set to the live app.
No image generation, new anatomy, learner data or runtime changes.
"""
from pathlib import Path
from PIL import Image, ImageDraw
import datetime, hashlib, json, subprocess, sys, urllib.request, time
import imageio_ffmpeg

app=Path(__file__).resolve().parents[1]
capture=Path(sys.argv[1])
art=app/'assets/art/pico-banner-motion-v1'
docs=app/'docs/pico-banner-animation'
review=docs/'review'
runtime='56551e90b35c9219295ce26b74a0084cad82eef6'
repo=app.parents[1]
module=subprocess.check_output(['git','show',runtime+':Horizons/App/src/pico-banner-motion.js'],cwd=repo)
url='https://exams.bebrighton.net/Horizons/App/src/pico-banner-motion.js?audit='+str(time.time())
assert urllib.request.urlopen(url,timeout=30).read()==module,'Hosted runtime differs from reference source'
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()

layers=[('head-faceless-registered.png','Faceless head'),('body-registered.png','Fixed body'),('map-registered.png','Map + gripping paws'),('face-nose.png','Shared nose'),('face-neutral-brows-mouth.png','Neutral brows / mouth'),('face-neutral-eyes.png','Open eye whites'),('pupils-native.png','Moving pupils'),('eyes-mask.png','Pupil containment mask'),('face-blink-eyelids.png','Closed eyelid strokes'),('face-inspect-features.png','Inspection features')]
board=Image.new('RGB',(1240,1260),'#fffefa');draw=ImageDraw.Draw(board)
for i,(file,label) in enumerate(layers):
 x=(i%5)*248;y=(i//5)*630
 draw.text((x+8,y+8),label,fill='black')
 for cy in range(y+30,y+612,16):
  for cx in range(x,x+248,16):draw.rectangle((cx,cy,min(cx+15,x+247),min(cy+15,y+611)),fill='#ddd' if (cx//16+cy//16)%2 else '#fff')
 im=Image.open(art/file).convert('RGBA');board.paste(im,(x,y+30),im)
board.save(review/'current-layers.png')
states=[(art/'baseline-native.png','Original native baseline'),(capture/'state-0.png','Current neutral: 0 ms'),(capture/'state-2351.png','Before blink: 2351 ms'),(capture/'state-2400.png','Closed eyes: 2400 ms'),(capture/'state-2496.png','Reopened: 2496 ms'),(capture/'state-9300.png','Map lift: 9300 ms'),(capture/'state-11000.png','Inspection: 11000 ms'),(capture/'state-14000.png','Loop rest: 14000 ms')]
board=Image.new('RGB',(992,1260),'#fffefa');draw=ImageDraw.Draw(board)
for i,(path,label) in enumerate(states):
 x=(i%4)*248;y=(i//4)*630
 draw.text((x+6,y+8),label,fill='black');draw.rectangle((x,y+30,x+247,y+611),fill='#ad195a')
 im=Image.open(path).convert('RGBA');assert im.size==(248,582),(path,im.size)
 board.paste(im,(x,y+30),im)
board.save(review/'current-states.png')
subprocess.run([imageio_ffmpeg.get_ffmpeg_exe(),'-y','-sseof','-14','-i',str(capture/'pico-reading.webm'),'-t','14','-c:v','libx264','-pix_fmt','yuv420p','-movflags','+faststart',str(review/'current-cycle.mp4')],capture_output=True,check=True)
source_files=['src/pico-banner-motion.js','src/art.js','styles/app.css','service-worker.js']
manifest={'version':1,'updatedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'runtimeRevision':runtime,'sourceCheckoutRevision':subprocess.check_output(['git','rev-parse','HEAD'],cwd=repo,text=True).strip(),'scope':'Unit 1 banner Pico; animation reference supplement, not a replacement for required R01/R02/R07 and exact target','maximumImageInputsTotal':7,'captureBase':'https://exams.bebrighton.net/Horizons/App/','captureMethod':'Hosted module/CSS in isolated preview renderer, no learner API calls; not a fresh full-app interaction matrix','hostedModuleMatchesSource':True,'cycleSeconds':14,'idleSeconds':8,'inspectionSeconds':6,'fadesAllowed':False,'sources':[{'file':p,'sha256':sha(app/p)} for p in source_files],'assets':[{'file':'assets/art/pico-banner-motion-v1/'+p,'role':role,'sha256':sha(art/p),'dimensions':Image.open(art/p).size} for p,role in layers],'references':[{'file':'docs/pico-banner-animation/review/'+p,'sha256':sha(review/p)} for p in ['current-layers.png','current-states.png','current-cycle.mp4']],'historicalPreviews':['pico-reading-v1.mp4','pico-check-v3.mp4','pico-faceless-v4.mp4'],'limits':['Edge/Chromium','Preview uses real hosted renderer in an isolated surface','No independent or human pacing approval claimed']}
(docs/'animation-reference-pack.json').write_text(json.dumps(manifest,indent=2)+'\n',encoding='utf-8')
print(json.dumps({'activeAssets':len(layers),'currentVisuals':3,'hostedModuleMatchesSource':True}))
