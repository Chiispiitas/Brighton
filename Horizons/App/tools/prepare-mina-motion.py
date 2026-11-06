"""Mechanical registration of native Mina parts. No vector/pixel redrawing."""
from pathlib import Path
import json, hashlib
from PIL import Image, ImageDraw, ImageFilter
import numpy as np

APP=Path(__file__).resolve().parents[1]
ROOT=APP/'assets/art/mina-motion-v1'
DOC=APP/'docs/mina-motion-v1'
record=json.loads((DOC/'production-record.json').read_text())
registrations=[]

def native(name):
    return Image.open(ROOT/'native'/(name+'.png')).convert('RGBA')

def bounds(im):
    return im.getchannel('A').point(lambda a:255 if a>96 else 0).getbbox()

def components(name):
    im=native(name)
    k=max(im.size)/380
    small=im.getchannel('A').resize((round(im.width/k),round(im.height/k)))
    mask=np.array(small)>96
    seen=np.zeros(mask.shape,bool);found=[]
    for y,x in zip(*np.where(mask)):
        if seen[y,x]:continue
        stack=[(x,y)];seen[y,x]=True;xs=[];ys=[]
        while stack:
            u,v=stack.pop();xs.append(u);ys.append(v)
            for a,b in [(u-1,v),(u+1,v),(u,v-1),(u,v+1)]:
                if 0<=b<mask.shape[0] and 0<=a<mask.shape[1] and mask[b,a] and not seen[b,a]:
                    seen[b,a]=True;stack.append((a,b))
        if len(xs)>12:
            box=(max(0,int(min(xs)*k)-2),max(0,int(min(ys)*k)-2),min(im.width,int((max(xs)+1)*k)+2),min(im.height,int((max(ys)+1)*k)+2))
            crop=im.crop(box);tight=bounds(crop)
            found.append({'box':box,'crop':crop.crop(tight),'area':len(xs),'center':((min(xs)+max(xs))/2,(min(ys)+max(ys))/2)})
    return sorted(found,key=lambda c:c['area'],reverse=True)

def placed(canvas,crop,box,ident):
    x,y,w,h=box;k=min(w/crop.width,h/crop.height)
    size=(max(1,round(crop.width*k)),max(1,round(crop.height*k)))
    offset=(round(x+(w-size[0])/2),round(y+(h-size[1])/2))
    canvas.alpha_composite(crop.resize(size,Image.Resampling.LANCZOS),offset)
    registrations.append({'id':ident,'box':list(box),'uniformScale':k,'offset':list(offset),'size':list(size)})


def mask_components(mask):
    seen=np.zeros(mask.shape,bool);result=[]
    for y,x in zip(*np.where(mask)):
        if seen[y,x]:continue
        stack=[(int(x),int(y))];seen[y,x]=True;points=[]
        while stack:
            u,v=stack.pop();points.append((u,v))
            for a,b in [(u-1,v),(u+1,v),(u,v-1),(u,v+1)]:
                if 0<=b<mask.shape[0] and 0<=a<mask.shape[1] and mask[b,a] and not seen[b,a]:seen[b,a]=True;stack.append((a,b))
        if len(points)>4:
            xs,ys=zip(*points);m=np.zeros(mask.shape,bool);m[list(ys),list(xs)]=True
            result.append({'area':len(points),'mask':m,'box':(min(xs),min(ys),max(xs)+1,max(ys)+1)})
    return sorted(result,key=lambda c:c['area'],reverse=True)


def fill_holes(mask):
    outside=np.zeros(mask.shape,bool);stack=[];H,W=mask.shape
    for x in range(W):
        if not mask[0,x]:stack.append((x,0));outside[0,x]=True
        if not mask[H-1,x]:stack.append((x,H-1));outside[H-1,x]=True
    for y in range(H):
        if not mask[y,0]:stack.append((0,y));outside[y,0]=True
        if not mask[y,W-1]:stack.append((W-1,y));outside[y,W-1]=True
    while stack:
        u,v=stack.pop()
        for x,y in [(u-1,v),(u+1,v),(u,v-1),(u,v+1)]:
            if 0<=x<W and 0<=y<H and not mask[y,x] and not outside[y,x]:outside[y,x]=True;stack.append((x,y))
    return ~outside


def dilate(mask):return np.array(Image.fromarray(np.uint8(mask)*255).filter(ImageFilter.MaxFilter(3)))>0


def selected(original,mask):
    a=np.array(original).copy();a[:,:,3]=np.where(mask,a[:,:,3],0);return Image.fromarray(a)


def box_of(mask):
    yy,xx=np.where(mask);return [int(xx.min()),int(yy.min()),int(xx.max()+1),int(yy.max()+1)]


def material_cover(crop,box,canvas_size):
    x0,y0,x1,y1=box;w,h=x1-x0,y1-y0;k=max(w/crop.width,h/crop.height)
    size=(max(w,round(crop.width*k)),max(h,round(crop.height*k)))
    im=crop.resize(size,Image.Resampling.LANCZOS);ox=(im.width-w)//2;oy=(im.height-h)//2
    canvas=Image.new('RGBA',canvas_size);canvas.alpha_composite(im.crop((ox,oy,ox+w,oy+h)),(x0,y0))
    return canvas,k


# Exact source geometry comes from each accepted native pose, not the previous shared-head approximation.
specs={
 'step':{'width':285,'height':552,'body':[0,163,245,389],'gesture':[158,132,127,125],'pivots':{'head':[127,180],'gesture':[180,181]}},
 'read':{'width':202,'height':552,'body':[0,163,202,389],'gesture':[29,187,171,98],'pivots':{'head':[116,180],'gesture':[110,265]}},
 'map':{'width':231,'height':563,'body':[0,159,231,404],'gesture':[10,178,216,118],'pivots':{'head':[119,180],'gesture':[118,269]}},
 'skip':{'width':308,'height':562,'body':[0,160,239,402],'gesture':[193,61,97,151],'pivots':{'head':[172,181],'gesture':[205,180]}}
}
repair=native('head-fidelity-v2')
# An opaque, facial-feature-free skin-material rectangle from the actual ImageGen repair.
# This fills the WHOLE face region. It is not a per-feature skin patch or expression layer.
skin_crop=repair.crop((650,500,850,850));assert skin_crop.getchannel('A').getextrema()[0]>250
white_sources=sorted(components('eyes')[:2],key=lambda c:c['center'][0])
lids=sorted(components('blink')[:2],key=lambda c:c['center'][0])
focus_sources=components('focus');joy_sources=components('joy')
fidelity=[];rigs={};board=Image.new('RGB',(1200,1160),'#fffefa');draw=ImageDraw.Draw(board)
headboard=Image.new('RGB',(1280,580),'#fffefa');hd=ImageDraw.Draw(headboard)
for index,(pose,spec) in enumerate(specs.items()):
    W,H=spec['width'],spec['height'];parts={};images={};original=Image.open(ROOT/'baseline'/(pose+'.png')).convert('RGBA');a=np.array(original).astype(np.int16);r,g,b,alpha=[a[:,:,i] for i in range(4)];yy,xx=np.indices((H,W))
    def empty():return Image.new('RGBA',(W,H))
    def save(name,im,active=True):
        file=pose+'-'+name+'.png';im.save(ROOT/file,optimize=True);images[name]=im
        if active:parts[name]='assets/art/mina-motion-v1/'+file
    skin=(r>185)&(r-g>35)&(g-b>10)&(g>90)&(b>35)&(r-b>65)&(alpha>100)&(yy<205)
    skin_component=mask_components(skin)[0]['mask'];skin_whole=fill_holes(skin_component)
    white=(np.minimum.reduce([r,g,b])>195)&(np.maximum.reduce([r,g,b])-np.minimum.reduce([r,g,b])<50)&(alpha>128)&(yy<150)
    original_eyes=sorted(mask_components(white)[:2],key=lambda c:c['box'][0]);eye_boxes=[list(c['box']) for c in original_eyes]
    dark=(np.maximum.reduce([r,g,b])<105)&(alpha>128)&(yy<150)
    dark_parts=mask_components(dark)
    eye_top=min(c['box'][1] for c in original_eyes);eye_bottom=max(c['box'][3] for c in original_eyes)
    original_brows=sorted([c for c in dark_parts if c['area']>70 and c['box'][1]<eye_top+2 and c['box'][2]-c['box'][0]>14][:2],key=lambda c:c['box'][0])
    assert len(original_brows)==2,pose
    mouth_candidates=[c for c in dark_parts if c['area']>90 and c['box'][1]>eye_bottom+8]
    mouth_core=max(mouth_candidates,key=lambda c:c['area']);mx0,my0,mx1,my1=mouth_core['box'];mouth_roi=(xx>=mx0-2)&(xx<mx1+2)&(yy>=my0-2)&(yy<my1+4)
    mouth_mask=mouth_roi&(r>g+30)&(r>b+15)&(g<140)&(b<170)&(alpha>0)
    brow_mask=np.zeros((H,W),bool)
    for c in original_brows:brow_mask|=dilate(c['mask'])&(r<215)&(g<165)&(b<155)
    neutral_mask=brow_mask|mouth_mask
    # Native connected skin component contains face, ear and neck, without disconnected hands.
    rows=skin_whole.sum(axis=1);mouth_bottom=my1
    neck_rows=[y for y in range(mouth_bottom+7,skin_whole.shape[0]) if rows[y]>0 and rows[y]<rows[:mouth_bottom].max()*.46]
    neck_start=neck_rows[0];neck_mask=skin_component&(yy>=neck_start)
    ear_cut=min(c['box'][0] for c in original_eyes)-18
    ear_mask=skin_component&(xx<ear_cut)&(yy>eye_top)
    face_mask=(skin_whole|brow_mask|mouth_roi)&~neck_mask&~ear_mask
    face_mask&=yy<neck_start
    # Select original hair and earring material; source alpha/contour pixels remain unpainted.
    hair=(r-g>20)&(g-b>5)&(r<210)&(g<150)&(b<135)&(alpha>0)&(yy<190)
    hair_mask=mask_components(hair)[0]['mask']
    yellow=(r>180)&(g>140)&(b<90)&(alpha>0)&(yy<190)
    earring_mask=mask_components(yellow)[0]['mask']
    # Preserve the actual source-derived forehead interface, not an invented boundary.
    # The generated faceless repair has a smooth native boundary. Register it using
    # visible original skin immediately before/after the left eyebrow occlusion.
    reference_eye_span=28.0
    current_eye_span=(sum(eye_boxes[1][::2])-sum(eye_boxes[0][::2]))/2
    boundary_scale=current_eye_span/reference_eye_span
    repair_size=(round(182*boundary_scale),round(180*boundary_scale))
    registered_source=repair.resize(repair_size,Image.Resampling.LANCZOS)
    ra=np.array(registered_source).astype(np.int16);rr,gg,bb,aa=[ra[:,:,i] for i in range(4)]
    repair_skin=(rr>185)&(rr-gg>35)&(gg-bb>10)&(gg>90)&(bb>35)&(rr-bb>65)&(aa>100)
    repair_skin=mask_components(repair_skin)[0]['mask']
    before=original_brows[0]['box'][1]-4;after=original_brows[0]['box'][3]+6
    source_edges=[int(np.where(skin_component[y])[0].min()) for y in [before,after]]
    candidates=[]
    for dy in range(-5,6):
        rows_to_sample=[before-dy,after-dy]
        if not all(0<=y<repair_skin.shape[0] and repair_skin[y].any() for y in rows_to_sample):continue
        generated_edges=[int(np.where(repair_skin[y])[0].min()) for y in rows_to_sample]
        shifts=[a-b for a,b in zip(source_edges,generated_edges)];dx=round(sum(shifts)/2)
        error=sum(abs(dx-shift) for shift in shifts)+abs(dy)*.05
        candidates.append((error,dx,dy))
    _,boundary_x,boundary_y=min(candidates)
    repaired_boundary=empty();repaired_boundary.alpha_composite(registered_source,(boundary_x,boundary_y))
    boundary_pixels=np.array(repaired_boundary)
    assert np.min(boundary_pixels[brow_mask,3])>250
    face_mask&=~brow_mask
    face_mask&=~dilate(earring_mask)
    face_mask&=~(hair_mask&~brow_mask)
    head_mask=dilate(hair_mask|skin_component|earring_mask|face_mask|mouth_roi|brow_mask)&(alpha>0)&(yy<190)
    jacket=(b>g+15)&(r>g+50)&(r>100)
    shirt=(r-g<30)&(g>180)&(yy>=neck_start)
    head_mask&=~(jacket&(yy>=neck_start))&~shirt
    face_mask&=head_mask
    structure_mask=head_mask&~face_mask
    save('head-face-mask',Image.fromarray(np.where(face_mask,a[:,:,3],0).astype(np.uint8)),False)
    save('head-structure-mask',Image.fromarray(np.where(structure_mask,a[:,:,3],0).astype(np.uint8)),False)
    fill,k=material_cover(skin_crop,box_of(face_mask),(W,H));head=np.array(original).copy();fill_array=np.array(fill)
    head[face_mask,:3]=fill_array[face_mask,:3]
    # Only the removed original brow footprint receives this native repair boundary.
    # Neutral restores the original brow pixels; accents reveal a clean faceless edge.
    head[brow_mask,:3]=boundary_pixels[brow_mask,:3]
    # Hair hidden beneath the former brows is a documented generated-material fill too.
    full_fill_mask=face_mask|brow_mask
    structure_mask=head_mask&~full_fill_mask
    save('head-face-mask',Image.fromarray(np.where(full_fill_mask,a[:,:,3],0).astype(np.uint8)),False)
    save('head-structure-mask',Image.fromarray(np.where(structure_mask,a[:,:,3],0).astype(np.uint8)),False)
    save('head-original',selected(original,head_mask),False)
    head[:,:,3]=np.where(head_mask,head[:,:,3],0);head=Image.fromarray(head);save('head',head)
    for part in ['body','gesture']:
        im=native(pose+'-'+part);canvas=empty();placed(canvas,im.crop(bounds(im)),spec[part],pose+'-'+part)
        if part=='body':canvas.alpha_composite(selected(original,neck_mask))
        save(part,canvas)
    save('neutral',selected(original,neutral_mask))
    eye_canvas=empty();pupil_mask=np.zeros((H,W),bool)
    for eye_index,c in enumerate(original_eyes):
        ex0,ey0,ex1,ey1=c['box'];candidates=[d for d in dark_parts if 20<=d['area']<=100 and ex0<=(d['box'][0]+d['box'][2])/2<=ex1 and ey0<=(d['box'][1]+d['box'][3])/2<=ey1];candidate=max(candidates,key=lambda d:d['area']);eye_mask=fill_holes(c['mask']|candidate['mask'])&(alpha>0)
        # Geometry is the accepted eye's alpha, with pupils treated as interior holes.
        ex0,ey0,ex1,ey1=c['box'];near=(xx>=ex0-1)&(xx<ex1+1)&(yy>=ey0-1)&(yy<ey1+1)
        eye_mask=(eye_mask|(white&near))&near
        px0,py0,px1,py1=candidate['box']
        pm=(xx>=px0-1)&(xx<px1+1)&(yy>=py0-1)&(yy<py1+1)&eye_mask&(np.minimum.reduce([r,g,b])<249)
        pupil_mask|=pm
        source=white_sources[eye_index]['crop'];cw,ch=source.size;white_patch=source.crop((cw//3,ch//3,cw*2//3,ch*2//3))
        material,_=material_cover(white_patch,box_of(eye_mask),(W,H));pixels=np.array(material);skin_blue=float(np.median(b[skin_component]));coverage=np.clip((b-skin_blue)/(255-skin_blue),0,1);coverage[pm]=1;pixels[:,:,3]=np.where(eye_mask,coverage*255,0).astype(np.uint8);eye_canvas.alpha_composite(Image.fromarray(pixels))
    save('eyes',eye_canvas);save('pupils',selected(original,pupil_mask))
    blink_canvas=empty()
    for item,box in zip(lids,eye_boxes):
        x0,y0,x1,y1=box;placed(blink_canvas,item['crop'],[x0,y0+(y1-y0)*.4,x1-x0,max(4,(y1-y0)*.35)],pose+'-blink')
    save('blink',blink_canvas)
    # Accent components use the original per-pose eyebrow/eye/mouth anchors.
    for name,source_list in [('focus',focus_sources),('joy',joy_sources)]:
        canvas=empty();by_y=sorted(source_list,key=lambda c:c['center'][1]);src_brows=sorted(by_y[:2],key=lambda c:c['center'][0]);src_eyes=sorted(by_y[2:4],key=lambda c:c['center'][0]);src_mouth=by_y[-1]
        for item,ref in zip(src_brows,original_brows):
            x0,y0,x1,y1=ref['box'];placed(canvas,item['crop'],[x0,y0-2,x1-x0,y1-y0],pose+'-'+name+'-brow')
        for item,box in zip(src_eyes,eye_boxes):
            x0,y0,x1,y1=box;h=(y1-y0)*(.75 if name=='focus' else .4);placed(canvas,item['crop'],[x0,y0+(y1-y0)*.25,x1-x0,h],pose+'-'+name+'-eye')
        box=box_of(mouth_mask);x0,y0,x1,y1=box;h=5 if name=='focus' else y1-y0+2
        placed(canvas,src_mouth['crop'],[x0,y0+(y1-y0-h)/2,x1-x0,h],pose+'-'+name+'-mouth');save(name,canvas)
    assembled=empty()
    for name in ['head','neutral','eyes','pupils','body','gesture']:assembled.alpha_composite(images[name])
    assembled.save(ROOT/(pose+'-reconstructed.png'))
    # Exact geometry/structural verification applies to the derivative head, not generated bodies.
    ha=np.array(head);source=np.array(original);assert np.array_equal(ha[structure_mask],source[structure_mask])
    fidelity.append({'pose':pose,'baselineSha256':hashlib.sha256((ROOT/'baseline'/(pose+'.png')).read_bytes()).hexdigest(),'repairFile':'assets/art/mina-motion-v1/native/head-fidelity-v2.png','skinMaterialCrop':[650,500,850,850],'uniformMaterialScale':k,'headOriginal':pose+'-head-original.png','faceMask':pose+'-head-face-mask.png','browBoundaryRegistration':{'source':'native/head-fidelity-v2.png','uniformCanvasScale':boundary_scale,'sourceSize':[182,180],'offset':[boundary_x,boundary_y],'anchors':{'rows':[before,after],'originalSkinLeft':source_edges}},'browBoundaryMask':'original native brow feature footprint including antialias edge','structureMask':pose+'-head-structure-mask.png','structurePixelsExact':True,'headExteriorAlphaFromOriginal':True,'occludedBrowHairFill':'Actual smooth native boundary from uniformly registered faceless repair; only original brow footprint replaced, no nearest-neighbor or drawn boundary','neckSupport':'Exact original neck pixels alpha-composited into body for stable overlapping joint','neutralBrowsMouth':'Original native pixels selected by feature material masks','neutralPupils':'Original native pixels at original positions','eyes':'Generated white material clipped to original eye-region masks','eyeBoxes':eye_boxes,'browBoxes':[list(c['box']) for c in original_brows],'mouthBox':box_of(mouth_mask),'neckStart':int(neck_start),'nose':'Omitted; no distinct original glyph'})
    for col,im in enumerate([original.copy(),assembled.copy()]):
        im.thumbnail((140,550));x=index*300+col*145;board.paste(im,(x,40),im);draw.text((x,10),pose+(' original' if col==0 else ' assembly'),fill='black')
    head_box=box_of(head_mask)
    for col,im in enumerate([selected(original,head_mask),head]):
        im=im.crop(head_box);im.thumbnail((145,450));x=index*320+col*155;headboard.paste(im,(x,45),im);hd.text((x,10),pose+(' original' if col==0 else ' blank'),fill='black')
    rigs[pose]={'width':W,'height':H,'parts':parts,'pivots':spec['pivots']}
(ROOT/'rigs.json').write_text(json.dumps({'poses':rigs},indent=2)+'\n')
(DOC/'registrations.json').write_text(json.dumps(registrations,indent=2)+'\n')
(DOC/'head-fidelity.json').write_text(json.dumps(fidelity,indent=2)+'\n')
board.save(DOC/'reconstruction.png');headboard.save(DOC/'head-fidelity.png')
print('PASS exact original head structures and per-pose neutral anchors; generated whole-face fill; no nose')
