"""Mechanical crop and uniform registration of separate ImageGen parts; never redraw art."""
from pathlib import Path
from PIL import Image,ImageDraw,ImageFilter,ImageChops
import json,hashlib
APP=Path(__file__).resolve().parents[1];ROOT=APP/'assets/art/prop-motion-v1';DOC=APP/'docs/prop-motion-v1';OUT=Path('C:/Users/David/Documents/Codex/2026-11-05/prop-motion')
d=json.loads((DOC/'production-record.json').read_text());records={r['id']:r for r in d['records']};placements={
'cups':('lesson-area-tiles-v1/cafe-cups.png',{'cup-red':[0,0,574,480],'cup-yellow':[480,80,538,446],'coffee-splash':[420,0,200,120]}),
'notebook':('lesson-props-v1/greetings.png',{'pages':[0,0,500,539],'writing':[100,150,250,180],'cover':[0,0,500,539],'pencil':[510,35,230,500]}),
'bag':('lesson-area-tiles-v1/work-bag.png',{'body':[0,160,826,502],'handle-clasp':[200,0,430,290]}),
'chef':('lesson-props-v1/jobs.png',{'hat':[0,0,630,550],'spoon':[504,59,375,576]}),
'map':('lesson-props-v1/countries.png',{'panel-left':[0,0,293,615],'panel-middle':[293,0,294,615],'panel-right':[587,0,293,615],'compass':[510,385,350,339]}),
'globe':('lesson-area-tiles-v1/globe.png',{'stand':[110,0,584,960],'earth':[0,115,625,625],'smear':[0,530,625,210]}),
'keys':('lesson-props-v1/personal.png',{'ring':[3,2,407,413],'key':[171,209,586,578]}),
'postbox':('lesson-area-tiles-v1/postbox.png',{'letter':[145,30,265,170]})}
manifest={};board=Image.new('RGB',(1200,1000),'#fffefa');draw=ImageDraw.Draw(board);checks=[]
for i,(prop,(baseline,parts)) in enumerate(placements.items()):
 base=Image.open(APP/'assets/art'/baseline).convert('RGBA');w,h=base.size;scale=min(1,512/max(w,h));W,H=round(w*scale),round(h*scale);assembled=Image.new('RGBA',(W,H));entries=[]
 if prop=='postbox':
  base.resize((W,H),Image.Resampling.LANCZOS).save(ROOT/'postbox-body.png');assembled.alpha_composite(base.resize((W,H)));entries.append({'id':'body','src':'assets/art/prop-motion-v1/postbox-body.png'})
 for part,rect in parts.items():
  ident=prop+'-'+part;selected=ident+'-v2' if ident+'-v2' in records else ident;r=records[selected];im=Image.open(APP.parent.parent/r['nativeFile']).convert('RGBA')
  mask=im.getchannel('A').point(lambda a:255 if a>96 else 0).filter(ImageFilter.MedianFilter(5));box=mask.getbbox();assert box,ident
  crop=im.crop(box);x,y,bw,bh=rect;k=min(bw/crop.width,bh/crop.height)*scale;size=(max(1,round(crop.width*k)),max(1,round(crop.height*k)));cx=round((x+bw/2)*scale-size[0]/2);cy=round((y+bh/2)*scale-size[1]/2)
  canvas=Image.new('RGBA',(W,H));canvas.alpha_composite(crop.resize(size,Image.Resampling.LANCZOS),(cx,cy));filename=ident+'.png';canvas.save(ROOT/filename)
  special=part in ['coffee-splash','writing','smear','letter'];entry={'id':part,'src':'assets/art/prop-motion-v1/'+filename,'special':special};entries.append(entry)
  if not special:assembled.alpha_composite(canvas)
  r.update(status='accepted',registration={'crop':list(box),'uniformScale':k,'outputSize':[W,H],'placedSize':list(size),'offset':[cx,cy],'targetBox':rect},runtimeFile='assets/art/prop-motion-v1/'+filename)
 target=base.resize((W,H));a=target.getchannel('A').point(lambda v:255 if v>96 else 0);b=assembled.getchannel('A').point(lambda v:255 if v>96 else 0);intersection=ImageChops.multiply(a,b).histogram()[255];union=ImageChops.lighter(a,b).histogram()[255];checks.append({'prop':prop,'silhouetteIoU':round(intersection/max(1,union),3),'limit':'Supporting geometry only; visual reconstruction review required.'})
 manifest[prop]={'width':W,'height':H,'baseline':'assets/art/'+baseline,'parts':entries};assembled.save(OUT/(prop+'-reconstructed.png'))
 for col,im in enumerate([target,assembled]):
  im.thumbnail((260,205));xx=(i%2)*600+col*280+10;yy=(i//2)*250+30;board.paste(im,(xx,yy),im);draw.text((xx,yy-20),prop+(' baseline' if col==0 else ' reconstruction'),fill='black')
(ROOT/'rigs.json').write_text(json.dumps(manifest,indent=2)+'\n');(DOC/'production-record.json').write_text(json.dumps(d,indent=2)+'\n');(DOC/'reconstruction-check.json').write_text(json.dumps(checks,indent=2)+'\n');board.save(OUT/'reconstruction-board.png');print(json.dumps(checks))
