"""Register complete native ImageGen puppet parts; never draw replacement anatomy.

Only declared cyan-key extraction, component crop, disclosed whole-component resize and native
texture placement are used. Joint pivots are registered within full overlap caps.
"""
from pathlib import Path
import json, math, hashlib, argparse
import numpy as np
from PIL import Image, ImageDraw, ImageFilter
APP=Path(__file__).resolve().parents[1]
ROOT=APP/'assets/art/streak-campfire-v2'
DOC=APP/'docs/streak-campfire-v2'
W,H=760,560

def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def read(p):return json.loads(p.read_text(encoding='utf-8'))
def write(p,d):p.write_text(json.dumps(d,indent=2)+'\n',encoding='utf-8')
def rgba(p):return Image.open(p).convert('RGBA')
def keyed(im,matte_edges=False):
 a=np.array(im);r,g,b,alpha=a.transpose(2,0,1).astype(int)
 key=(r<130)&(g>165)&(b>165)&(np.minimum(g,b)>r+65)
 if key.mean()<.1:raise ValueError('Declared cyan native lacks its key background')
 if not matte_edges:
  a[:,:,3]=np.where(key,0,alpha).astype('uint8');return Image.fromarray(a)
 # Standard known-cyan matte extraction. Preserve solid native interiors;
 # edge RGB comes only from nearest opaque pixels of the same native image.
 # This removes cyan/white fringe, not joints or anatomy, and draws no covers.
 rgb=a[:,:,:3].astype(float);bg=np.array([0.,255.,255.]);dist=np.linalg.norm(rgb-bg,axis=2)
 approximate=dist>65;core=np.array(Image.fromarray(np.uint8(approximate)*255).filter(ImageFilter.MinFilter(5)))>0
 known=core.copy();colors=rgb.copy()
 for _ in range(8):
  oldknown=known.copy();oldcolors=colors.copy()
  for dy,dx in [(0,1),(0,-1),(1,0),(-1,0),(1,1),(1,-1),(-1,1),(-1,-1)]:
   neighbor=np.roll(oldknown,(dy,dx),(0,1));take=~known&neighbor
   colors[take]=np.roll(oldcolors,(dy,dx),(0,1))[take];known[take]=True
  if np.array_equal(known,oldknown):break
 v=colors-bg;den=np.maximum(1,(v*v).sum(axis=2));coverage=np.clip(((rgb-bg)*v).sum(axis=2)/den,0,1)
 coverage=np.where(core,1,np.where(known,coverage,0));coverage[coverage<.02]=0
 out=a.copy();ring=known&~core;out[:,:,:3][ring]=np.uint8(np.clip(colors[ring],0,255));out[:,:,3]=np.uint8(np.round(coverage*alpha))
 return Image.fromarray(out)
def load_native(name,spec):
 src=ROOT/'native'/spec.get('source',name+'.png')
 im=rgba(src)
 if spec.get('key','cyan')=='cyan':im=keyed(im,spec.get('matteEdges',False))
 elif spec.get('key')=='magenta':
  a=np.array(im);r,g,b,alpha=a.transpose(2,0,1).astype(int);a[:,:,3]=np.where((r>180)&(b>150)&(g<120)&(r-g>80)&(b-g>80),0,alpha).astype('uint8');im=Image.fromarray(a)
 if spec.get('sourceBox'):im=im.crop(spec['sourceBox'])
 box=im.getchannel('A').getbbox()
 if not box:raise ValueError('Empty native '+name)
 im=im.crop(box)
 return im,src,box

def resize_fit(im,size):
 scale=min(size[0]/im.width,size[1]/im.height)
 return im.resize((round(im.width*scale),round(im.height*scale)),Image.Resampling.LANCZOS),scale

def render_pose(manifest,label='rest',fire_override=None):
 out=Image.new('RGBA',(W,H));parts=manifest['parts'];anchors=manifest['anchors'];textures={k:rgba(APP/v['file']) for k,v in parts.items()}
 def put(name,point=None,angle=0):
  p=parts[name];im=textures[name];pivot=p.get('pivot',[0,0]);point=[p.get('x',0),p.get('y',0)] if point is None else point
  layer=Image.new('RGBA',(W,H));layer.alpha_composite(im,(round(point[0]-pivot[0]),round(point[1]-pivot[1])))
  if angle:layer=layer.rotate(-angle,resample=Image.Resampling.BICUBIC,center=tuple(point))
  if name in manifest['fireFrames']:
   mp=parts['fireMask'];mask=Image.new('L',(W,H));mask.paste(textures['fireMask'].getchannel('A'),(mp['x'],mp['y']));aa=np.array(layer);aa[:,:,3]=np.minimum(aa[:,:,3],np.array(mask));layer=Image.fromarray(aa)
  out.alpha_composite(layer)
 def vec(name):
  p=parts[name];v=np.array(p['end'])-p['pivot'];return float(np.linalg.norm(v)),math.degrees(math.atan2(v[1],v[0]))
 def spin(v,deg):
  r=math.radians(deg);return np.array([v[0]*math.cos(r)-v[1]*math.sin(r),v[0]*math.sin(r)+v[1]*math.cos(r)])
 root=np.array(anchors['root'],float);move=np.array([0.,0.]);lean=0
 if label=='recoil':move=np.array([-12.,-36.]);lean=-12
 elif label=='reach':move=np.array([5.,-3.]);lean=7
 def world(key):return root+move+spin(np.array(anchors[key])-root,lean)
 put('fireplace');put('seat')
 fire=fire_override or ('burstPunch' if label=='recoil' else 'fireFull');put(fire,manifest['fireBase'])
 put('leftLeg',world('leftHip'),-12 if label=='recoil' else 0);put('rightLeg',world('rightHip'),18 if label=='recoil' else 0)
 main=world('rightGrip');angle=math.degrees(math.atan2(anchors['skewerTip'][1]-anchors['rightGrip'][1],anchors['skewerTip'][0]-anchors['rightGrip'][0]))+lean
 if label=='recoil':angle-=38;main+=np.array([-8.,-30.])
 sklen,skangle=vec('skewer');tip=main+spin([sklen,0],angle)
 grip2=main+spin([-52,0],angle)
 arms=[]
 for side,grip in [('left',grip2),('right',main)]:
  upper=side+'UpperArm';fore=side+'Forearm';paw=side+'Paw';shoulder=world(side+'Shoulder');p=parts[paw];pawrot=angle
  pawvector=np.array(p['end'])-p['pivot'];pawlength=float(np.linalg.norm(pawvector));pawaxis=math.degrees(math.atan2(pawvector[1],pawvector[0]))
  l1,ua=vec(upper);l2,fa=vec(fore);effective=l2+pawlength;delta=grip-shoulder;distance=max(abs(l1-effective)+.01,min(l1+effective-.01,float(np.linalg.norm(delta))));direction=math.atan2(delta[1],delta[0]);bend=manifest.get('elbowBend',{}).get(side,anchors.get(side+'Bend',1))
  aa=direction+bend*math.acos(max(-1,min(1,(l1*l1+distance*distance-effective*effective)/(2*l1*distance))));elbow=shoulder+np.array([math.cos(aa),math.sin(aa)])*l1;ba=math.atan2(grip[1]-elbow[1],grip[0]-elbow[0]);wrist=elbow+np.array([math.cos(ba),math.sin(ba)])*l2;pawrot=math.degrees(ba)-pawaxis;arms.append((upper,fore,paw,shoulder,elbow,wrist,grip,math.degrees(aa)-ua,math.degrees(ba)-fa,pawrot))
 # Latest user: complete viewer-right arm/held chain behind torso; left front.
 for upper,fore,paw,shoulder,elbow,wrist,grip,aa,ba,pa in arms:
  if upper=='rightUpperArm':
   put(upper,shoulder,aa);put(fore,elbow,ba);put('skewer',main,angle-skangle);put('marshmallow',tip,angle);put(paw,wrist,pa)
 put('torso',root+move,lean)
 for upper,fore,paw,shoulder,elbow,wrist,grip,aa,ba,pa in arms:
  if upper=='leftUpperArm':put(upper,shoulder,aa);put(fore,elbow,ba)
 put('head',world('neck'),lean+(10 if label=='recoil' else 0))
 for feature in (['excited','nose'] if label in ['recoil','settled'] else ['eyes','pupils','browsMouth','nose']):put(feature,world('neck'),lean+(10 if label=='recoil' else 0))
 for upper,fore,paw,shoulder,elbow,wrist,grip,aa,ba,pa in arms:
  if upper=='leftUpperArm':put(paw,wrist,pa)
 put('satchel',world('satchel'),lean)
 return out

def review(manifest):
 # Production startup/reduced are captured from the actual SVG by capture-streak-v2-stills.mjs.
 for label in ['rest','recoil','reach']:
  render_pose(manifest,label).save(DOC/(label+'-reconstruction.png'),optimize=True)
 board=Image.new('RGBA',(W*3,H+30),'#fffefa');dr=ImageDraw.Draw(board)
 for i,label in enumerate(['rest','recoil','reach']):board.alpha_composite(render_pose(manifest,label),(W*i,30));dr.text((W*i+18,8),label+' native-part reconstruction',fill='#173e5c')
 board.save(DOC/'reconstruction-extremes.png')
 names=[k for k in manifest['parts'] if k not in ['eyes','pupils','browsMouth','nose','blink','excited','faceMask','eyeMask']]
 board=Image.new('RGBA',(1200,math.ceil(len(names)/5)*245),'#fffefa');dr=ImageDraw.Draw(board)
 for i,name in enumerate(names):
  p=manifest['parts'][name];im=rgba(APP/p['file']);im.thumbnail((215,195));x=i%5*240;y=i//5*245;board.alpha_composite(im,(x+(240-im.width)//2,y+32));dr.text((x+8,y+10),name,fill='#173e5c')
 board.save(DOC/'complete-parts-board.png')

def provenance():
 records=[];checks=[]
 frozen={k:sha(DOC/'inputs'/f) for k,f in [('R01','01-brand.png'),('R02','02-cast.png'),('R07','07-scenes-vocabulary-ui.png')]}
 for file in sorted(DOC.glob('*-generation.json')):
  r=read(file);pf=read(APP/r['preflight']);assert pf['pass'] and pf['input_count']<=5
  assert r['referenced_image_paths']==pf['input_paths']
  for item in pf['inputs']:
   if item['role']=='reference':assert item['sha256']==frozen[item['id']]
   else:assert sha(Path(item['path']))==item['sha256']
  src=APP/r['native_path'] if r.get('native_path') else None
  if src:
   assert sha(src)==sha(Path(r['output_path']))
   rejected={'torso':'User rejected peach side/socket ovals overlapping the arms and insufficient lower hem coverage of the upper-thigh cleft.','upper-arm-left-context':'User rejected inflated visible shoulder/elbow balls; superseded by smooth complete segment.','upper-arm-right-context':'User rejected inflated visible shoulder/elbow balls; superseded by smooth complete segment.','forearm-left':'User rejected inflated visible elbow/wrist balls; superseded by smooth complete segment.','forearm-right':'User rejected inflated visible elbow/wrist balls; superseded by smooth complete segment.','upper-arm-left-smooth':'User rejected off-model skimpy arms; superseded by complete native component with measured reference registration.','upper-arm-right-smooth':'User rejected off-model skimpy arms; superseded by complete native component with measured reference registration.','forearm-left-smooth':'User rejected off-model skimpy arms; superseded by complete native component with measured reference registration.','forearm-right-smooth':'User rejected off-model skimpy arms; superseded by complete native component with measured reference registration.'}
   r['status']='user-rejected-superseded' if r['part'] in rejected else 'active-native'
   r['productionRole']=rejected.get(r['part'],'Current complete independent native component; root reviewed latest neutral and extreme assembly; user acceptance is not claimed.')
   write(file,r)
  records.append({'id':r['part'],'recordFile':str(file.relative_to(APP)).replace('\\','/'),**r,'preflightEvidence':pf})
  checks.append({'part':r['part'],'actualPathsMatchPreflight':True,'mandatoryReferencesAttached':{i.get('id') for i in pf['inputs'] if i['role']=='reference'}=={'R01','R02','R07'},'nativeBytesPreserved':True if src else None,'noOutputCreated':src is None})
 rig=read(ROOT/'rigs.json');active=sorted({p['file'] for p in rig['parts'].values()}|{rig['fallback'],rig['startup']});binding=['src/streak-celebration.js','styles/streak-celebration.css','src/app.js','index.html','service-worker.js','assets/art/streak-campfire-v2/rigs.json']+active
 record={'date':'2026-11-06','tool':'built-in ImageGen','userRejectedV1':True,'completeHiddenMaterial':True,'perComponentGeneration':True,'nativeOutputs':sum(bool(r.get('native_path')) for r in records),'userRejectedNativeOutputs':[r['id'] for r in records if r['status']=='user-rejected-superseded'],'generationAttempts':len(records),'generationFailuresWithoutOutput':sum(not r.get('native_path') for r in records),'records':records,'activePngBytes':sum((APP/f).stat().st_size for f in active),'reusedSources':{'headAndFace':'Exact accepted pico-banner-motion-v1 sources, shared crop/scale; no new expression head.','excited':'Previously separately generated native facial glyphs, re-registered to same head.','fixedHearthAndIdleFlames':'Exact v1 native hearth and four native idle-fire sources, separately registered; all new blast frames are distinct ImageGen calls.'},'referenceProportions':read(DOC/'registration-spec.json').get('referenceProportions',{}),'rejectedRegistrations':['Thin arm20–26px shafts; user rejected as skimpy/off-model.','Overwide arm48/42px shafts and oversized paws; user rejected as too thick/off-model. Native component bytes remain reusable.'],'runtimeContract':'Local pivot/end textures with full rounded caps; hierarchical upperarm/forearm/paw chains and independent skewer/marshmallow. No combined torso pose swap or whole-bitmap mesh.'}
 runtime={}
 for name in ['motion','cache']:
  file=APP/'reports'/('streak-v2-'+name+'.json')
  if file.exists():
   report=read(file);assert report.get('pass'),('Final runtime report must pass before provenance freeze',name)
   rows=report.get('sourceBinding',report.get('entries',[]))
   for row in rows:
    target=row['file'].split('?')[0].removeprefix('./');assert sha(APP/target)==row['sha256'],('Runtime proof stale',name,target)
   runtime[name]={'report':str(file.relative_to(APP)).replace('\\','/'),'pass':True,'boundBytesCurrent':True}
 record['runtimeEvidence']=runtime
 write(DOC/'production-record.json',record);write(DOC/'production-check.json',{'pass':all(c['mandatoryReferencesAttached'] for c in checks),'runtimeEvidence':runtime,'nativeOutputs':record['nativeOutputs'],'generationAttempts':len(records),'callChecks':checks,'activePngBytes':record['activePngBytes'],'inheritedHeadIdentity':'Exact source bytes, uniform common crop/scale on every head/face layer; no facial redraw.'})
 write(DOC/'reference-manifest.json',{'canvas':[W,H],'parts':rig['parts'],'anchors':rig['anchors'],'fullHiddenParts':True,'sourceBinding':[{'file':f,'sha256':sha(APP/f)} for f in binding],'reconstruction':'docs/streak-campfire-v2/reconstruction-extremes.png','partsBoard':'docs/streak-campfire-v2/complete-parts-board.png'})
 write(DOC/'asset-hashes.json',{str(p.relative_to(APP)).replace('\\','/'):sha(p) for p in sorted(ROOT.rglob('*.png'))})
 print('Refreshed v2 provenance only; frozen textures and manifest unchanged.')

def main():
 parser=argparse.ArgumentParser();parser.add_argument('--provenance-only',action='store_true');args=parser.parse_args()
 if args.provenance_only:provenance();return
 spec=read(DOC/'registration-spec.json');parts={};reg=[];textures={}
 for name,s in spec['parts'].items():
  im,src,box=load_native(name,s)
  if s.get('axisResize'):
   ow,oh=s['axisResize'];axis_scale=[ow/im.width,oh/im.height];im=im.resize((ow,oh),Image.Resampling.LANCZOS);scale=None
  else:
   im,scale=resize_fit(im,s['size']);axis_scale=[scale,scale]
  im.save(ROOT/(name+'.png'),optimize=True);textures[name]=im
  part={'file':'assets/art/streak-campfire-v2/'+name+'.png','width':im.width,'height':im.height}
  for key in ['pivot','end']:
   if key in s:part[key]=[round(s[key][0]*im.width,3),round(s[key][1]*im.height,3)]
  if 'palette' in s:part['palette']=s['palette']
  for key in ['x','y']:
   if key in s:part[key]=s[key]
  parts[name]=part;reg.append({'part':name,'source':str(src.relative_to(APP)).replace('\\','/'),'nativeSha256':sha(src),'sourceBox':box,'declaredKey':s.get('key','cyan'),'nativeEdgeMatteDecontamination':s.get('matteEdges',False),'componentContextCrop':s.get('sourceBox'),'uniformScale':scale,'axisScale':axis_scale,'proportionDisclosure':s.get('proportionDisclosure'),'registeredSize':[im.width,im.height],'pivot':part.get('pivot'),'end':part.get('end')})
 # Native navy opening selection excludes masonry and crossed logs; no new firebox is drawn.
 hearth=textures['fireplace'];a=np.array(hearth);r,g,b,alpha=a.transpose(2,0,1).astype(int);keep=(b>g*1.1)&(b>r*1.3)&(r<80)&(g<120)&(alpha>100)
 mask=Image.new('RGBA',hearth.size);mask.putalpha(Image.fromarray(np.uint8(keep)*255));mask.save(ROOT/'fireMask.png',optimize=True);textures['fireMask']=mask
 parts['fireMask']={'file':'assets/art/streak-campfire-v2/fireMask.png','width':hearth.width,'height':hearth.height,'x':parts['fireplace']['x'],'y':parts['fireplace']['y']}
 # The accepted permanent head and every separate facial layer share exactly one crop/scale.
 inherited={'head':'head-faceless-registered.png','eyes':'face-neutral-eyes.png','pupils':'pupils-native.png','browsMouth':'face-neutral-brows-mouth.png','nose':'face-nose.png','blink':'face-blink-eyelids.png'}
 hb=spec.get('headBox',[31,3,209,282]);hs=spec.get('headScale',.8)
 for name,filename in inherited.items():
  src=APP/'assets/art/pico-banner-motion-v1'/filename;im=rgba(src).crop(hb);im=im.resize((round(im.width*hs),round(im.height*hs)),Image.Resampling.LANCZOS);im.save(ROOT/(name+'.png'),optimize=True);textures[name]=im
  parts[name]={'file':'assets/art/streak-campfire-v2/'+name+'.png','width':im.width,'height':im.height,'pivot':[(112-hb[0])*hs,(281-hb[1])*hs]}
  reg.append({'part':name,'source':str(src.relative_to(APP)).replace('\\','/'),'nativeSha256':sha(src),'sharedHeadBox':hb,'sharedHeadScale':hs})
 # Excited expression is inherited native glyphs already separately generated for Pico.
 # Registered v1 global canvas is inversely cropped back to its head texture coordinates.
 src=APP/'assets/art/streak-campfire-v1/excited.png'
 headx=154+31*.86;heady=22+3*.86;headw=178*.86;headh=279*.86
 im=rgba(src).crop((round(headx),round(heady),round(headx+headw),round(heady+headh))).resize(textures['head'].size,Image.Resampling.LANCZOS);im.save(ROOT/'excited.png',optimize=True);textures['excited']=im;parts['excited']={**parts['head'],'file':'assets/art/streak-campfire-v2/excited.png'}
 reg.append({'part':'excited','source':str(src.relative_to(APP)).replace('\\','/'),'nativeSha256':sha(src),'disclosure':'Existing separately generated expression glyphs transformed with the same accepted head anchors; no new face drawing.'})
 for name,source in [('faceMask','head'),('eyeMask','eyes')]:
  im=Image.new('RGBA',textures[source].size);im.putalpha(textures[source].getchannel('A'));im.save(ROOT/(name+'.png'),optimize=True);parts[name]={**parts[source],'file':'assets/art/streak-campfire-v2/'+name+'.png'}
 manifest={'width':W,'height':H,'parts':parts,'anchors':spec['anchors'],'elbowBend':spec.get('elbowBend',{'left':1,'right':1}),'constructionReferenceOnly':spec.get('constructionReferenceOnly',{}),'fireBase':spec['fireBase'],'fireFrames':['fireEmber','fireSmall','fireIgnite','fireFull'],'burstFrames':['burstCompress','burstPunch','burstSplit','burstSettle'],'fallback':'assets/art/streak-campfire-v2/reduced.png','startup':'assets/art/streak-campfire-v2/startup.png','fullHiddenParts':True}
 if 'fireMask' in spec:manifest['fireMask']=spec['fireMask']
 write(ROOT/'rigs.json',manifest);write(DOC/'registrations.json',reg);review(manifest)
 write(DOC/'asset-hashes.json',{str(p.relative_to(APP)).replace('\\','/'):sha(p) for p in sorted(ROOT.rglob('*.png'))})
 print('Registered complete native parts. Inspect construction boards, then capture actual SVG startup/reduced before freeze.')
if __name__=='__main__':main()
