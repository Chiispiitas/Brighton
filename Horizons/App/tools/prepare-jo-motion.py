"""Register native Jo ImageGen components; retain accepted head exterior and feature anchors.
Mechanical alpha/material selection, uniform scaling and placement only; no drawn anatomy.
"""
from pathlib import Path
import json,hashlib,argparse
from PIL import Image,ImageDraw,ImageFilter
import numpy as np
APP=Path(__file__).resolve().parents[1];ROOT=APP/'assets/art/jo-motion-v1';DOC=APP/'docs/jo-motion-v1'
SPECS={
 'offer':{'width':284,'height':556,'body':[0,159,284,397],'gesture':[38,224,221,85],'pivots':{'head':[148,169],'gesture':[148,269]}},
 'read':{'width':286,'height':555,'body':[0,163,286,392],'gesture':[39,195,220,120],'pivots':{'head':[153,175],'gesture':[150,278]}},
 'pour':{'width':294,'height':568,'body':[0,165,294,403],'gesture':[46,209,224,108],'pivots':{'head':[150,171],'gesture':[151,270]}},
 'clap':{'width':256,'height':570,'body':[0,162,256,408],'gesture':[55,197,163,109],'pivots':{'head':[132,173],'gesture':[138,269]}}
}
parser=argparse.ArgumentParser();parser.add_argument('--pose',choices=list(SPECS));args=parser.parse_args();
if args.pose:SPECS={args.pose:SPECS[args.pose]}
registrations=[];fidelity=[];rigs={}
def native(name):
 file=ROOT/'native'/(name+'-opaque.png') if name=='joy' else ROOT/'native'/(name+'-clean.png');file=file if file.exists() and name!='clap-body' else ROOT/'native'/(name+'.png');im=Image.open(file).convert('RGBA')
 if file.stem.endswith(('-clean','-opaque')):
  a=np.array(im).astype(float);r,g,b,alpha=a.transpose(2,0,1);magenta=(r>180)&(b>150)&(g<120)&(r-g>80)&(b-g>80)
  # The deliberately opaque magenta intermediate is keyed mechanically. Native artwork bytes stay unchanged.
  if magenta.mean()>.1:
   a[:,:,3]=np.where(magenta,0,alpha);im=Image.fromarray(np.uint8(a))
 return im
def bounds(im):return im.getchannel('A').point(lambda a:255 if a>96 else 0).getbbox()
def dilate(m):return np.array(Image.fromarray(np.uint8(m)*255).filter(ImageFilter.MaxFilter(3)))>0
def selected(im,mask):
 a=np.array(im).copy();a[:,:,3]=np.where(mask,a[:,:,3],0);return Image.fromarray(a)
def box_of(m):
 y,x=np.where(m);return [int(x.min()),int(y.min()),int(x.max()+1),int(y.max()+1)]
def comps(mask,minimum=8):
 seen=np.zeros(mask.shape,bool);result=[]
 for y,x in zip(*np.where(mask)):
  if seen[y,x]:continue
  stack=[(int(x),int(y))];seen[y,x]=True;pts=[]
  while stack:
   u,v=stack.pop();pts.append((u,v))
   for a,b in [(u-1,v),(u+1,v),(u,v-1),(u,v+1)]:
    if 0<=b<mask.shape[0] and 0<=a<mask.shape[1] and mask[b,a] and not seen[b,a]:seen[b,a]=True;stack.append((a,b))
  if len(pts)>minimum:
   x,y=zip(*pts);m=np.zeros(mask.shape,bool);m[list(y),list(x)]=True;result.append({'area':len(pts),'mask':m,'box':[min(x),min(y),max(x)+1,max(y)+1]})
 return sorted(result,key=lambda c:c['area'],reverse=True)
def filled(m):
 outside=np.zeros(m.shape,bool);h,w=m.shape;stack=[]
 for x in range(w):
  for y in [0,h-1]:
   if not m[y,x]:outside[y,x]=True;stack.append((x,y))
 for y in range(h):
  for x in [0,w-1]:
   if not m[y,x] and not outside[y,x]:outside[y,x]=True;stack.append((x,y))
 while stack:
  x,y=stack.pop()
  for u,v in [(x-1,y),(x+1,y),(x,y-1),(x,y+1)]:
   if 0<=u<w and 0<=v<h and not m[v,u] and not outside[v,u]:outside[v,u]=True;stack.append((u,v))
 return ~outside
def components(name):
 im=native(name);k=max(im.size)/420;small=im.getchannel('A').resize((round(im.width/k),round(im.height/k)));result=[]
 for c in comps(np.array(small)>96,12):
  x,y,x1,y1=c['box'];box=[max(0,int(x*k)-2),max(0,int(y*k)-2),min(im.width,int(x1*k)+2),min(im.height,int(y1*k)+2)];crop=im.crop(box);crop=crop.crop(bounds(crop));result.append({'crop':crop,'center':((x+x1)/2,(y+y1)/2),'area':c['area']})
 return result

def place(canvas,crop,box,name):
 x,y,w,h=box;k=min(w/crop.width,h/crop.height);size=(max(1,round(crop.width*k)),max(1,round(crop.height*k)));offset=(round(x+(w-size[0])/2),round(y+(h-size[1])/2));canvas.alpha_composite(crop.resize(size,Image.Resampling.LANCZOS),offset);registrations.append({'id':name,'box':list(box),'uniformScale':k,'offset':list(offset),'size':list(size)})
def material(crop,box,size):
 x,y,x1,y1=box;w=x1-x;h=y1-y;k=max(w/crop.width,h/crop.height);scaled=crop.resize((max(w,round(crop.width*k)),max(h,round(crop.height*k))),Image.Resampling.LANCZOS);ox=(scaled.width-w)//2;oy=(scaled.height-h)//2;canvas=Image.new('RGBA',size);canvas.alpha_composite(scaled.crop((ox,oy,ox+w,oy+h)),(x,y));return canvas,k

def choose_skin(im,target):
 a=np.array(im).astype(int);r,g,b,alpha=a.transpose(2,0,1);m=(r>220)&(g>135)&(g<215)&(b>75)&(b<185)&(alpha>250);solid=np.array(Image.fromarray(np.uint8(m)*255).filter(ImageFilter.MinFilter(31)))>250;y,x=np.where(solid);assert len(x),'No opaque generated blank skin';best=None
 for u,v in zip(x[::150],y[::150]):
  crop=im.crop((u-15,v-15,u+16,v+16));mean=np.array(crop)[:,:,:3].mean((0,1));error=float(np.linalg.norm(mean-target))
  if best is None or error<best[0]:best=(error,crop,[int(u-15),int(v-15),int(u+16),int(v+16)])
 return best[1],best[2],best[0]
repair=native('head');whites=sorted(components('eyes')[:2],key=lambda c:c['center'][0]);lids=sorted(components('blink')[:2],key=lambda c:c['center'][0]);expressions={n:components(n) for n in ['focus','joy']}
board=Image.new('RGBA',(1000,2440),'#fffefa');bd=ImageDraw.Draw(board);headboard=Image.new('RGBA',(1500,1240),'#fffefa');hd=ImageDraw.Draw(headboard)
for index,(pose,spec) in enumerate(SPECS.items()):
 W,H=spec['width'],spec['height'];original=Image.open(ROOT/'baseline'/(pose+'.png')).convert('RGBA');a=np.array(original).astype(int);r,g,b,alpha=a.transpose(2,0,1);yy,xx=np.indices((H,W));parts={};images={}
 def empty():return Image.new('RGBA',(W,H))
 def save(name,im,active=True):
  file=pose+'-'+name+'.png';im.save(ROOT/file,optimize=True);images[name]=im
  if active:parts[name]='assets/art/jo-motion-v1/'+file
 skin=(r>225)&(g>130)&(g<210)&(b>75)&(b<185)&(alpha>100)&(yy<190);skin_comp=comps(skin)[0]['mask'];skin_whole=filled(skin_comp)
 eyes=sorted(comps((np.minimum.reduce([r,g,b])>210)&(np.maximum.reduce([r,g,b])-np.minimum.reduce([r,g,b])<35)&(alpha>100)&(yy<130))[:2],key=lambda c:c['box'][0]);assert len(eyes)==2,pose
 dark=(r<100)&(g<85)&(b<65)&(alpha>100)&(yy<160);dark_parts=comps(dark);eye_top=min(c['box'][1] for c in eyes);eye_bottom=max(c['box'][3] for c in eyes)
 brows=sorted([c for c in dark_parts if c['area']>100 and c['box'][1]<eye_top][:2],key=lambda c:c['box'][0]);assert len(brows)==2,pose
 mouth_core=max([c for c in dark_parts if c['box'][1]>eye_bottom+8],key=lambda c:c['area']);mx,my,mx1,my1=mouth_core['box'];mouth_roi=(xx>=mx-2)&(xx<mx1+3)&(yy>=my-3)&(yy<my1+5);mouth_mask=mouth_roi&(r>g+25)&(r>b+15)&(g<150)&(b<145)&(alpha>0)
 browmask=np.zeros((H,W),bool)
 for c in brows:browmask|=dilate(c['mask'])&(r<155)&(g<125)&(b<100)
 glass=(b>r+15)&(g>r+10)&(r<120)&(g<160)&(b<195)&(alpha>0)&(yy<140)
 glass=dilate(glass)&(b>r+8)&(g>r+4)&(r<160)&(g<180)&(b<210)&(yy<140)&(alpha>0)
 nose_roi=(xx>eyes[0]['box'][2]-6)&(xx<eyes[1]['box'][0]+8)&(yy>eye_top+16)&(yy<my+6)
 nosemask=nose_roi&(r>225)&(g<170)&(b<110)&(alpha>0)
 orange=(r>200)&(g<155)&(b<65)&(alpha>0);hair=(r>120)&(r<220)&(g>115)&(g<210)&(b>110)&(b<205)&(np.maximum.reduce([r,g,b])-np.minimum.reduce([r,g,b])<35)&(alpha>0)&(yy<185);headmask=filled(dilate(hair|skin|glass|browmask|mouth_mask|nosemask))&(alpha>0)&(yy<185)
 # Head includes exact original gray-hair/face exterior. Entire facial field is blanked permanently, not per-expression patches.
 facefield=filled(dilate(skin|glass|browmask|mouth_mask|nosemask))&headmask
 target=np.median(a[skin_comp,:3],axis=0);crop,cropbox,error=choose_skin(repair,target);field,k=material(crop,box_of(facefield),(W,H));fa=np.array(field);translation=target-np.median(fa[facefield,:3],axis=0);fa[:,:,:3]=np.clip(fa[:,:,:3].astype(float)+translation,0,255).astype(np.uint8)
 head=np.array(original).copy();head[facefield,:3]=fa[facefield,:3];head[:,:,3]=np.where(headmask,head[:,:,3],0);save('head',Image.fromarray(head));save('head-original',selected(original,headmask),False);save('head-face-mask',Image.fromarray(np.uint8(facefield)*255),False);save('head-structure-mask',Image.fromarray(np.where(headmask&~facefield,alpha,0).astype(np.uint8)),False)
 save('neutral',selected(original,browmask|mouth_mask))
 # Recover original navy frame antialias coverage from the native skin/frame mixture.
 # This selects original frame pixels; it does not change frame shape or draw glasses.
 gp=np.array(original).astype(float);framecolor=np.median(a[glass,:3],axis=0);coverage=np.clip((target[0]-r)/(target[0]-framecolor[0]),0,1);footprint=dilate(dilate(glass));coverage=np.where(footprint,coverage,0)
 for channel in range(3):gp[:,:,channel]=np.clip((gp[:,:,channel]-target[channel]*(1-coverage))/np.maximum(coverage,.001),0,255)
 gp[:,:,3]=coverage*alpha
 # Keep every strong native navy frame pixel fully opaque; skin-unmix alpha must
 # never turn the frame into a transparent window over the eye sprites.
 frame_core=glass&(r<100)&(g<135)&(b<180)&(alpha>200)
 gp[frame_core,:3]=a[frame_core,:3];gp[frame_core,3]=255
 glasses=Image.fromarray(gp.astype(np.uint8));glasses.alpha_composite(selected(original,nosemask));save('nose',glasses)
 # Native Jo's original eye whites extend above the open-topped navy rims.
 # Preserve that accepted extent, but exclude every native frame pixel. This
 # derives containment from original visible eye apertures rather than inventing
 # new eyewear geometry or drawing a top rim that the accepted art lacks.
 lens_mask=np.zeros((H,W),bool)
 for c in eyes:lens_mask|=filled(c['mask'])&~glass
 save('lens-mask',Image.fromarray(np.uint8(lens_mask)*255),False)
 save('frame-core-mask',Image.fromarray(np.uint8(frame_core)*255),False)
 pupils=np.zeros((H,W),bool);eye_canvas=empty()
 for i,c in enumerate(eyes):
  ex,ey,ex1,ey1=c['box'];near=(xx>=ex-2)&(xx<ex1+2)&(yy>=ey-2)&(yy<ey1+2);candidates=[d for d in dark_parts if 20<d['area']<130 and ex<=(d['box'][0]+d['box'][2])/2<ex1 and ey<=(d['box'][1]+d['box'][3])/2<ey1];pupil=max(candidates,key=lambda d:d['area']);pm=dilate(pupil['mask'])&near&(np.minimum.reduce([r,g,b])<248);pupils|=pm
  eye_mask=filled(dilate(c['mask']|pm));eye_mask&=near;white=whites[i]['crop'];cw,ch=white.size;patch=white.crop((cw//3,ch//3,cw*2//3,ch*2//3));field,_=material(patch,box_of(eye_mask),(W,H));f=np.array(field);coverage=np.clip((r-framecolor[0])/(255-framecolor[0]),0,1);coverage[pm]=1;f[:,:,3]=np.where(eye_mask&lens_mask,coverage*255,0).astype(np.uint8);eye_canvas.alpha_composite(Image.fromarray(f))
 save('eyes',eye_canvas);save('pupils',selected(original,pupils&lens_mask));blink=empty()
 for item,c in zip(lids,eyes):
  x,y,x1,y1=c['box'];place(blink,item['crop'],[x,y+(y1-y)*.42,x1-x,max(4,(y1-y)*.3)],pose+'-blink')
 save('blink',selected(blink,lens_mask))
 for name,items in expressions.items():
  canvas=empty();ordered=sorted(items,key=lambda c:c['center'][1]);assert len(ordered)>=5,(name,len(ordered));eb=sorted(ordered[:2],key=lambda c:c['center'][0]);ee=sorted(ordered[2:4],key=lambda c:c['center'][0]);em=ordered[-1]
  for item,c in zip(eb,brows):
   x,y,x1,y1=c['box'];place(canvas,item['crop'],[x,y-2,x1-x,y1-y],pose+'-'+name+'-brow')
  for item,c in zip(ee,eyes):
   x,y,x1,y1=c['box'];hh=(y1-y)*(.68 if name=='focus' else .34);eye_part=empty();place(eye_part,item['crop'],[x,y+(y1-y)*.25,x1-x,hh],pose+'-'+name+'-eye');canvas.alpha_composite(selected(eye_part,lens_mask))
  x,y,x1,y1=box_of(mouth_mask);hh=5 if name=='focus' else y1-y+1;place(canvas,em['crop'],[x,y+(y1-y-hh)/2,x1-x,hh],pose+'-'+name+'-mouth');save(name,canvas)
 for name in ['body','gesture']:
  canvas=empty();im=native(pose+'-'+name);place(canvas,im.crop(bounds(im)),spec[name],pose+'-'+name)
  if name=='body':
   # Permanent source-derived neck support is the same faceless material, never a swapped patch.
   neck=skin_comp&(yy>=spec['body'][1]-10);canvas.alpha_composite(selected(images['head'],neck))

  save(name,canvas)
 assembled=empty()
 for name in ['head','neutral','eyes','pupils','nose','body','gesture']:assembled.alpha_composite(images[name])
 assembled.save(ROOT/(pose+'-reconstructed.png'))
 for col,im in enumerate([original.copy(),assembled.copy()]):
  im.thumbnail((430,550));x=col*500+20;y=index*610+32;board.alpha_composite(im,(x,y));bd.text((x,y-20),pose+(' original' if col==0 else ' reconstructed'),fill='black')
 hb=box_of(headmask)
 for col,(label,im) in enumerate([('original',selected(original,headmask)),('blank',images['head']),('neutral',images['head'].copy())]):
  if label=='neutral':
   for part in ['neutral','eyes','pupils','nose']:im.alpha_composite(images[part])
  im=im.crop(hb);im.thumbnail((450,250));x=col*500+15;y=index*310+35;headboard.alpha_composite(im,(x,y));hd.text((x,y-22),pose+' '+label,fill='black')
 structure=headmask&~facefield;assert np.array_equal(np.array(images['head'])[structure],np.array(original)[structure]),pose
 fidelity.append({'pose':pose,'headExteriorAlphaFromOriginal':True,'structurePixelsExact':True,'faceFillScope':'One permanent whole-face field from native/head.png; exact accepted alpha and gray-hair exterior retained','skinMaterialCrop':cropbox,'uniformMaterialScale':k,'paletteTranslation':translation.tolist(),'materialColorSelectionDistance':error,'eyeBoxes':[c['box'] for c in eyes],'browBoxes':[c['box'] for c in brows],'mouthBox':box_of(mouth_mask),'neutralFeatures':'Exact original brows, mouth, pupils, glasses and nose at accepted anchors; generated white material within eye shape','nosePart':'Shared original glasses and nose; moves with all expressions on face layer','baselineSha256':hashlib.sha256((ROOT/'baseline'/(pose+'.png')).read_bytes()).hexdigest()})
 rigs[pose]={'width':W,'height':H,'parts':parts,'pivots':spec['pivots'],'layerOrder':['head','body','gesture']}
(ROOT/'rigs.json').write_text(json.dumps({'poses':rigs},indent=2)+'\n');(DOC/'registrations.json').write_text(json.dumps(registrations,indent=2)+'\n');(DOC/'head-fidelity.json').write_text(json.dumps(fidelity,indent=2)+'\n');board.save(DOC/'reconstruction.png');headboard.save(DOC/'head-fidelity.png');print('Prepared registered Jo poses; visual reconstruction review remains required.')
