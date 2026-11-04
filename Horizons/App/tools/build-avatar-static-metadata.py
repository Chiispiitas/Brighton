"""Measure native alpha and register static bitmap layers. Never paints artwork."""
import json
from pathlib import Path
from PIL import Image

root=Path(__file__).resolve().parents[1]
art=root/'assets/art'
manifest=json.loads((art/'manifest.json').read_text(encoding='utf-8'))
old=manifest['avatar'].get('groups',manifest['avatar'].get('layers',manifest['avatar']))

def native(name, region):
    src='assets/art/avatar-static-'+name+'.png'
    im=Image.open(root/src)
    x,y,x2,y2=region
    b=im.getchannel('A').crop(region).point(lambda a:255 if a>170 else 0).getbbox()
    frame={'x':x+b[0]-2,'y':y+b[1]-2,'w':b[2]-b[0]+4,'h':b[3]-b[1]+4}
    return {'src':src,'atlas':{'width':im.width,'height':im.height},'frame':frame}

def at(asset,x,y,w,z):
    return {**asset,'position':{'x':round(x,4),'y':round(y,4),'w':round(w,4),'z':z}}

def regions(cols,rows):
    return [(round(i%cols*1536/cols),round(i//cols*1024/rows),round((i%cols+1)*1536/cols),round((i//cols+1)*1024/rows)) for i in range(cols*rows)]

heads=[native('heads-v2',r) for r in regions(4,3)]
bases={}
for bi,body in enumerate(['male','female']):
    skins={}
    for i in range(6):
        a=heads[bi*6+i];f=a['frame'];s=200/f['w']
        pixels=Image.open(root/a['src']);cx=f['x']+f['w']/2
        white=[(x,y) for y in range(f['y'],f['y']+f['h']) for x in range(f['x'],f['x']+f['w']) if min(pixels.getpixel((x,y))[:3])>240 and pixels.getpixel((x,y))[3]>170]
        ey=(min(y for x,y in white)+max(y for x,y in white))/2
        p=at(a,60,232-f['h']*s,200,2);p['eyeY']=round(p['position']['y']+(ey-f['y'])*s,4)
        skins['skin-'+str(i+1)]=p
    bases[body]={'skins':skins}

clothes={}
for i,r in enumerate(regions(3,2)):
    a=native('clothes-v1',r);f=a['frame'];im=Image.open(root/a['src']);cx=round(f['x']+f['w']/2)
    collar=next(y for y in range(f['y'],f['y']+f['h']) if im.getpixel((cx,y))[3]>170)
    clothes['outfit-'+str(i+1)]=at(a,70,227-(collar-f['y'])*180/f['w'],180,3)

hair={}
hair_regions=regions(3,2);hair_regions[4]=(512,512,1000,1024);hair_regions[5]=(1000,512,1536,1024)
widths=[220,232,230,250,230,258]
for i,r in enumerate(hair_regions):
    a=native('hair-v1',r);f=a['frame'];im=Image.open(root/a['src']);cx=round(f['x']+f['w']/2)
    # First solid run on the vertical centreline ends at the fringe.
    seen=False;fringe=None
    for y in range(f['y'],f['y']+f['h']):
        opaque=im.getpixel((cx,y))[3]>170
        if opaque:seen=True
        elif seen:fringe=y;break
    if fringe is None:raise ValueError('Hair fringe could not be measured')
    w=widths[i];s=w/f['w'];hair['hair-'+str(i+1)]=at(a,160-w/2,96-(fringe-f['y'])*s,w,4)

extra=[native('extras-v3',r) for r in regions(3,3)]
positions=[(102,118,116,6),(60,5,200,6),(50,28,220,6),(144,212,96,5),(107.5,205,105,5),(168,205,150,1)]
accessories={'accessory-'+str(i+1):at(a,*positions[i]) for i,a in enumerate(extra[:6])}
badges={}
for i,k in enumerate(['star-pin','trophy-pin','compass-pin']):
    option=next((o for o in old.get('badge',[]) if o['id']==k),None)
    asset={field:option[field] for field in ['src','atlas','frame']} if option and all(field in option for field in ['src','atlas','frame']) else extra[i+6]
    badges[k]=at(asset,204,270,23,7)
data={'version':1,'kind':'native-static-flat-avatar','canvas':{'width':320,'height':320},'static':True,'bases':bases,'clothes':clothes,'hair':hair,'accessories':accessories,'badges':badges}
(art/'avatar-static-v1.frames.json').write_text(json.dumps(data,indent=2)+'\n',encoding='utf-8')
groups={}
for group,options in old.items():
    if not isinstance(options,list):continue
    values=[]
    for oldoption in options:
        o={k:v for k,v in oldoption.items() if k not in ['src','atlas','frame','position','rigPosition','animation','asset','thumbnail']};key=o['id']
        asset= bases[key]['skins']['skin-1'] if group=='body' else bases['male']['skins'][key] if group=='skin' else clothes.get(key) if group=='outfit' else hair.get(key) if group=='hair' else accessories.get(key) if group=='accessory' else badges.get(key)
        if asset:o.update({k:v for k,v in asset.items() if k in ['src','atlas','frame']})
        values.append(o)
    groups[group]=values
(art/'avatar-static-v1.fragment.json').write_text(json.dumps({'avatar':groups,'avatarStatic':{'metadata':'assets/art/avatar-static-v1.frames.json','module':'src/avatar-static.js','static':True}},indent=2)+'\n',encoding='utf-8')
print(json.dumps({'heads':12,'outfits':len(clothes),'hair':len(hair),'accessories':len(accessories),'badges':len(badges),'hairPositions':{k:v['position'] for k,v in hair.items()},'headEyes':{b:[x['eyeY'] for x in v['skins'].values()] for b,v in bases.items()}}))
