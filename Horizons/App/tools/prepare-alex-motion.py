"""Disclosed mechanical registration of separate native Alex sprite generations.

Original exterior head geometry and neutral feature anchors are immutable. Generated
faceless skin material fills the entire interior face, never runtime feature patches.
No anatomy, facial contours or expression glyphs are drawn by this recipe.
"""
from pathlib import Path
import argparse, hashlib, json
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageOps

APP=Path(__file__).resolve().parents[1]
ROOT=APP/'assets/art/alex-motion-v1'
DOC=APP/'docs/alex-motion-v1'
DOC.mkdir(parents=True,exist_ok=True)
HEADS_ONLY=argparse.ArgumentParser()
HEADS_ONLY.add_argument('--heads-only',action='store_true')
args=HEADS_ONLY.parse_args()
registrations=[]

def native(name):return Image.open(ROOT/'native'/(name+'.png')).convert('RGBA')
def bounds(im):return im.getchannel('A').point(lambda a:255 if a>96 else 0).getbbox()
def box_of(mask):
    yy,xx=np.where(mask)
    return [int(xx.min()),int(yy.min()),int(xx.max()+1),int(yy.max()+1)]
def components_mask(mask,min_area=5):
    seen=np.zeros(mask.shape,bool);found=[]
    for y,x in zip(*np.where(mask)):
        if seen[y,x]:continue
        stack=[(int(x),int(y))];seen[y,x]=True;points=[]
        while stack:
            u,v=stack.pop();points.append((u,v))
            for a,b in [(u-1,v),(u+1,v),(u,v-1),(u,v+1)]:
                if 0<=b<mask.shape[0] and 0<=a<mask.shape[1] and mask[b,a] and not seen[b,a]:seen[b,a]=True;stack.append((a,b))
        if len(points)>=min_area:
            xs,ys=zip(*points);selected=np.zeros(mask.shape,bool);selected[list(ys),list(xs)]=True
            found.append({'area':len(points),'mask':selected,'box':box_of(selected)})
    return sorted(found,key=lambda c:c['area'],reverse=True)
def fill_holes(mask):
    outside=np.zeros(mask.shape,bool);H,W=mask.shape;stack=[]
    for x in range(W):
        for y in [0,H-1]:
            if not mask[y,x]:stack.append((x,y));outside[y,x]=True
    for y in range(H):
        for x in [0,W-1]:
            if not mask[y,x]:stack.append((x,y));outside[y,x]=True
    while stack:
        x,y=stack.pop()
        for u,v in [(x-1,y),(x+1,y),(x,y-1),(x,y+1)]:
            if 0<=v<H and 0<=u<W and not mask[v,u] and not outside[v,u]:outside[v,u]=True;stack.append((u,v))
    return ~outside
def dilate(mask):return np.array(Image.fromarray(np.uint8(mask)*255).filter(ImageFilter.MaxFilter(3)))>0
def erode(mask):return np.array(Image.fromarray(np.uint8(mask)*255).filter(ImageFilter.MinFilter(3)))>0
def selected(original,mask):
    pixels=np.array(original).copy();pixels[:,:,3]=np.where(mask,pixels[:,:,3],0)
    return Image.fromarray(pixels)
def components(name):
    im=native(name);k=max(im.size)/450
    mask=np.array(im.getchannel('A').resize((round(im.width/k),round(im.height/k))))>96
    result=[]
    for c in components_mask(mask,10):
        x0,y0,x1,y1=c['box'];box=[max(0,int(x0*k)-2),max(0,int(y0*k)-2),min(im.width,int(x1*k)+2),min(im.height,int(y1*k)+2)]
        crop=im.crop(box);crop=crop.crop(bounds(crop))
        result.append({'area':c['area'],'crop':crop,'center':((x0+x1)/2,(y0+y1)/2)})
    return sorted(result,key=lambda c:c['area'],reverse=True)
def placed(canvas,crop,box,ident):
    x,y,w,h=box;k=min(w/crop.width,h/crop.height)
    size=(max(1,round(crop.width*k)),max(1,round(crop.height*k)))
    offset=(round(x+(w-size[0])/2),round(y+(h-size[1])/2))
    canvas.alpha_composite(crop.resize(size,Image.Resampling.LANCZOS),offset)
    registrations.append({'id':ident,'box':list(box),'uniformScale':k,'offset':list(offset),'size':list(size)})
def cover_material(crop,box,size):
    x0,y0,x1,y1=box;w,h=x1-x0,y1-y0;k=max(w/crop.width,h/crop.height)
    scaled=crop.resize((max(w,round(crop.width*k)),max(h,round(crop.height*k))),Image.Resampling.LANCZOS)
    ox=(scaled.width-w)//2;oy=(scaled.height-h)//2
    canvas=Image.new('RGBA',size);canvas.alpha_composite(scaled.crop((ox,oy,ox+w,oy+h)),(x0,y0))
    return canvas,k
def material_patch(im,target):
    a=np.array(im).astype(np.int16);r,g,b,alpha=[a[:,:,i] for i in range(4)]
    skin=(r>170)&(g>80)&(b>25)&(r-g>35)&(g-b>12)&(alpha>250)
    solid=np.array(Image.fromarray(np.uint8(skin)*255).filter(ImageFilter.MinFilter(41)))==255
    yy,xx=np.where(solid);assert len(xx),'No opaque generated faceless skin material'
    best=None
    for x,y in zip(xx[::200],yy[::200]):
        crop=im.crop((x-20,y-20,x+21,y+21));mean=np.array(crop)[:,:,:3].mean(axis=(0,1))
        error=float(np.linalg.norm(mean-target))
        if best is None or error<best[0]:best=(error,crop,[int(x-20),int(y-20),int(x+21),int(y+21)])
    return best[1],best[2],best[0]

SPECS={
 'listen':{'width':367,'height':540,'body':[0,140,280,400],'gesture':[233,163,134,133],'pivots':{'head':[164,181],'gesture':[241,208]}},
 'fix':{'width':376,'height':539,'body':[0,140,278,399],'gesture':[235,89,141,207],'pivots':{'head':[166,181],'gesture':[242,205]}},
 'dance':{'width':352,'height':554,'body':[0,139,352,415],'gesture':[229,82,123,151],'pivots':{'head':[180,182],'gesture':[254,169]}},
 'sit':{'width':453,'height':548,'body':[0,127,453,421],'gesture':[65,196,340,180],'pivots':{'head':[172,179],'gesture':[310,280]}},
}
repair=native('head')
white_sources=sorted(components('eyes')[:2],key=lambda c:c['center'][0]) if not args.heads_only else []
lid_sources=sorted(components('blink')[:2],key=lambda c:c['center'][0]) if not args.heads_only else []
accent_sources={name:components(name) for name in ['focus','joy']} if not args.heads_only else {}
fidelity=[];rigs={};joint_checks=[]
board=Image.new('RGB',(900,2040),'#fffefa');bd=ImageDraw.Draw(board)
upperboard=Image.new('RGB',(900,1480),'#fffefa');ud=ImageDraw.Draw(upperboard)
headboard=Image.new('RGB',(1080,1160),'#fffefa');hd=ImageDraw.Draw(headboard)
for index,(pose,spec) in enumerate(SPECS.items()):
    W,H=spec['width'],spec['height'];original=Image.open(ROOT/'baseline'/(pose+'.png')).convert('RGBA')
    assert original.size==(W,H)
    a=np.array(original).astype(np.int16);r,g,b,alpha=[a[:,:,i] for i in range(4)];yy,xx=np.indices((H,W));parts={};images={}
    def empty():return Image.new('RGBA',(W,H))
    def save(name,im,active=True):
        file=pose+'-'+name+'.png';im.save(ROOT/file,optimize=True);images[name]=im
        if active:parts[name]='assets/art/alex-motion-v1/'+file
    skin=(r>170)&(g>80)&(b>25)&(r-g>35)&(g-b>12)&(alpha>100)&(yy<205)
    skin_component=components_mask(skin)[0]['mask'];skin_whole=fill_holes(skin_component)
    white=(np.minimum.reduce([r,g,b])>195)&(np.maximum.reduce([r,g,b])-np.minimum.reduce([r,g,b])<50)&(alpha>128)&(yy<150)
    original_eyes=sorted(components_mask(white)[:2],key=lambda c:c['box'][0]);assert len(original_eyes)==2,pose
    eye_boxes=[list(c['box']) for c in original_eyes];eye_top=min(c['box'][1] for c in original_eyes);eye_bottom=max(c['box'][3] for c in original_eyes)
    dark=(np.maximum.reduce([r,g,b])<120)&(alpha>128)&(yy<155)
    dark_parts=components_mask(dark)
    original_brows=[]
    for eye_index,(ex0,ey0,ex1,ey1) in enumerate(eye_boxes):
        available=[c for c in dark_parts if 80<c['area']<700 and c['box'][1]<ey0 and 18<c['box'][2]-c['box'][0]<60 and c['box'][3]-c['box'][1]<30 and ex0-15<(c['box'][0]+c['box'][2])/2<ex1+10]
        if available:original_brows.append(max(available,key=lambda c:c['area']))
        else:
            # The right original eyebrow touches the side hair. Isolate its local
            # native glyph footprint relative to the unchanged white-eye anchor.
            roi=(xx>=ex0-8)&(xx<ex1+9)&(yy>=ey0-19)&(yy<ey0-2)
            feature=dark&roi
            original_brows.append({'area':int(feature.sum()),'mask':feature,'box':box_of(feature),'hairOccluded':True})
    assert len(original_brows)==2,pose
    mouth_core=max([c for c in dark_parts if c['area']>90 and c['box'][1]>eye_bottom+8],key=lambda c:c['area'])
    mx0,my0,mx1,my1=mouth_core['box'];mouth_roi=(xx>=mx0-2)&(xx<mx1+2)&(yy>=my0-2)&(yy<my1+4)
    mouth_core_mask=mouth_roi&(r>g+25)&(r>b+20)&(g<105)&(b<120)&(alpha>0)
    mouth_mask=dilate(mouth_core_mask)&mouth_roi&(r>g+25)&(r>b+20)&(g<125)&(b<145)&(alpha>0)
    brow_mask=np.zeros((H,W),bool)
    for c in original_brows:brow_mask|=dilate(c['mask'])&(r<170)&(g<140)&(b<125)
    neutral_mask=brow_mask|mouth_mask
    rows=skin_whole.sum(axis=1);neck_rows=[y for y in range(my1+7,205) if rows[y]>0 and rows[y]<rows[:my1].max()*.58]
    assert neck_rows,pose
    neck_start=neck_rows[0];neck_mask=skin_component&(yy>=neck_start)
    ear_mask=skin_component&((xx<eye_boxes[0][0]-15)|(xx>eye_boxes[1][2]+12))&(yy>eye_top-12)&(yy<neck_start)
    eye_regions=np.zeros((H,W),bool)
    for ex0,ey0,ex1,ey1 in eye_boxes:eye_regions|=(xx>=ex0-1)&(xx<ex1+1)&(yy>=ey0-1)&(yy<ey1+1)
    face_mask=skin_whole|eye_regions|brow_mask|mouth_roi
    hair=(r>g+5)&(g>b)&(r<135)&(g<115)&(b<105)&(alpha>0)&(yy<165)
    hair_mask=components_mask(hair)[0]['mask']
    head_mask=dilate(hair_mask|skin_whole|neutral_mask)&(alpha>0)&(yy<205)
    # Navy headphones belong to the stationary body and must not rotate with the head.
    navy=(b>r+7)&(g>r+3)&(r<130)&(g<160)&(b<190)&(yy>eye_bottom+25)
    shirt=(g>150)&(b<55)&(yy>=neck_start)
    head_mask&=~navy&~shirt
    face_mask&=head_mask&~hair_mask
    # Original brow pixels are disconnected from hair; they are permanently removed from this head.
    face_mask|=brow_mask&head_mask
    structure_mask=head_mask&~face_mask
    target=np.median(a[skin_component&~neck_mask&~ear_mask,:3],axis=0)
    skin_crop,crop_box,color_error=material_patch(repair,target)
    material,k=cover_material(skin_crop,box_of(face_mask),(W,H));material_array=np.array(material)
    # Uniform palette registration is disclosed: every generated skin pixel gets
    # the same RGB translation to the accepted original skin median, without
    # inventing contours or switching per-expression patches.
    generated_median=np.median(material_array[face_mask,:3],axis=0)
    palette_translation=target-generated_median
    material_array[:,:,:3]=np.clip(material_array[:,:,:3].astype(float)+palette_translation,0,255).astype(np.uint8)
    pixels=np.array(original).copy();pixels[face_mask,:3]=material_array[face_mask,:3]
    boundary_registration=None
    if any(c.get('hairOccluded') for c in original_brows):
        # Place the native generated smooth interface only where the original
        # connected brow hid it. This is one permanent derivative, not a patch
        # switched at expression time, nor a code-drawn interpolated contour.
        head_box=box_of(head_mask);source_height=head_box[3]-head_box[1]
        rb=bounds(repair);boundary_scale=source_height/(rb[3]-rb[1])
        registered=repair.resize((round(repair.width*boundary_scale),round(repair.height*boundary_scale)),Image.Resampling.LANCZOS)
        ra=np.array(registered).astype(np.int16);rr,gg,bb,aa=[ra[:,:,i] for i in range(4)]
        candidate_skin=(rr>170)&(gg>80)&(bb>25)&(rr-gg>35)&(gg-bb>12)&(aa>100)
        occluded=next(c for c in original_brows if c.get('hairOccluded'))
        before=occluded['box'][1]-4;after=occluded['box'][3]+4
        source_edges=[int(np.where(skin_component[y])[0].max()) for y in [before,after]]
        choices=[]
        for dy in range(-18,19):
            sample=[before-dy,after-dy]
            if not all(0<=y<candidate_skin.shape[0] and candidate_skin[y].any() for y in sample):continue
            generated_edges=[int(np.where(candidate_skin[y])[0].max()) for y in sample];shifts=[a-b for a,b in zip(source_edges,generated_edges)];dx=round(sum(shifts)/2)
            choices.append((sum(abs(dx-shift) for shift in shifts)+abs(dy)*.05,dx,dy))
        _,dx,dy=min(choices);boundary=empty();boundary.alpha_composite(registered,(dx,dy));ba=np.array(boundary)
        bx0,by0,bx1,by1=occluded['box']
        footprint=(xx>=bx0-2)&(xx<bx1+2)&(yy>=by0-2)&(yy<by1+2)&head_mask
        assert np.min(ba[footprint,3])>245,(pose,'Generated smooth boundary not opaque')
        boundary_skin=(ba[:,:,0].astype(int)-ba[:,:,1].astype(int)>35)&(ba[:,:,1].astype(int)-ba[:,:,2].astype(int)>12)&(ba[:,:,0]>170)
        boundary_skin&=footprint
        pixels[footprint,:3]=ba[footprint,:3]
        pixels[boundary_skin,:3]=material_array[boundary_skin,:3]
        face_mask|=footprint;structure_mask=head_mask&~face_mask
        boundary_registration={'source':'native/head.png','uniformScale':boundary_scale,'offset':[dx,dy],'anchorRows':[before,after],'originalSkinRightEdges':source_edges,'footprint':'Original eye-relative connected right brow glyph ROI plus native antialias edge'}
    pixels[:,:,3]=np.where(head_mask,pixels[:,:,3],0);head=Image.fromarray(pixels)
    save('head',head);save('head-original',selected(original,head_mask),False)
    save('head-face-mask',Image.fromarray(np.where(face_mask,a[:,:,3],0).astype(np.uint8)),False)
    save('head-structure-mask',Image.fromarray(np.where(structure_mask,a[:,:,3],0).astype(np.uint8)),False)
    save('neutral',selected(original,neutral_mask))
    if not args.heads_only:
        for name in ['body','gesture']:
            canvas=empty();im=native(pose+'-'+name);crop=im.crop(bounds(im))
            mirrored=False  # v2 native gestures already face the accepted direction.
            if mirrored:crop=ImageOps.mirror(crop)
            placed(canvas,crop,spec[name],pose+'-'+name)
            if mirrored:registrations[-1]['mirrorX']=True
            if name=='body':
                body_pixels=np.array(canvas).astype(np.int16);br,bg,bb,bal=[body_pixels[:,:,i] for i in range(4)]
                hx0,hy0,hx1,hy1=box_of(skin_component)
                head_region=(xx>=hx0-3)&(xx<hx1+3)&(yy<205)
                generated_skin=(br>170)&(bg>80)&(bg<180)&(bb>25)&(br-bg>35)&(bg-bb>12)&(bal>100)&head_region
                candidates=components_mask(generated_skin)
                if candidates:
                    # Remove every disconnected generated neck/cap fragment.
                    # Selecting only the nearest component left a bright strip
                    # across the seated chin above the stationary headphones.
                    removal=dilate(generated_skin)&(br>bg+20)&(bg>bb+8)&head_region
                    body_pixels[removal,3]=0
                    # Preserve the native headphone alpha. Clearing body pixels
                    # with the head mask would notch its upper edge and reveal
                    # a white crescent when the head rotates.
                    canvas=Image.fromarray(body_pixels.astype(np.uint8))
                    registrations[-1]['generatedNeckRemovedByNativeMaterialComponents']=[list(c['box']) for c in candidates]
                # Transfer the two exact accepted headphone components. The
                # generated cup shapes differ enough to intrude on the face;
                # clipping them with the head alpha instead leaves a crescent.
                original_phone=(g>r+3)&(b>g+5)&(r<70)&(g<70)&(b<110)&(alpha>100)&(yy>110)&(yy<240)
                generated_phone=(bg>br+3)&(bb>bg+5)&(br<70)&(bg<70)&(bb<110)&(bal>100)&(yy>110)&(yy<240)
                original_phone_components=components_mask(original_phone)[:2]
                generated_phone_components=components_mask(generated_phone)[:2]
                original_phone_mask=np.zeros((H,W),bool);generated_phone_mask=np.zeros((H,W),bool)
                for component in original_phone_components:original_phone_mask|=component['mask']
                for component in generated_phone_components:generated_phone_mask|=component['mask']
                accessory_region=dilate(dilate(original_phone_mask|generated_phone_mask))
                body_pixels=np.array(canvas)
                phone_removal=dilate(generated_phone_mask)&(bg>br+3)&(bb>bg+3)&(br<120)&(bg<135)&(bb<180)
                body_pixels[phone_removal,3]=0
                canvas=Image.fromarray(body_pixels)
                # Source support is restored around the cups. Any skin is the
                # permanent faceless field, never baked features or skin patches
                # swapped by the runtime. Rest alpha remains the original alpha.
                accessory_source=np.array(original).copy();head_pixels=np.array(head)
                accessory_source[head_mask]=head_pixels[head_mask]
                canvas.alpha_composite(selected(Image.fromarray(accessory_source),accessory_region))
                save('headphone-support-mask',Image.fromarray(np.where(accessory_region,a[:,:,3],0).astype(np.uint8)),False)
                registrations[-1]['headphones']='Exact accepted original native RGBA cups and native support; generated headphone components replaced'
                registrations[-1]['headphoneSourceBoxes']=[list(c['box']) for c in original_phone_components]
                registrations[-1]['headphoneSupportMask']=pose+'-headphone-support-mask.png'
                # Fixed original-alpha neck overlap below the chin supports the
                # moving head. The preserved cups cover its upper joints.
                support_start=neck_start
                support_mask=dilate(skin_component)&head_mask&(yy>=support_start)
                canvas.alpha_composite(selected(head,support_mask))
                registrations[-1]['nativeJointSupportStart']=int(support_start)
                registrations[-1]['nativeJointSupportBounds']=box_of(support_mask)
            save(name,canvas)
        if pose=='sit':
            # The generated driving group contains two disconnected teal sleeve
            # regions. The rear sleeve is native support behind the torso; the
            # wheel, grips and front sleeve stay together in the moving group.
            # Color-component selection changes layering, never draws anatomy.
            gp=np.array(images['gesture']).astype(np.int16);gr,gg,gb,ga=[gp[:,:,i] for i in range(4)]
            teal=(gg>gr+30)&(gb>gr+30)&(gg>100)&(ga>20)
            sleeves=components_mask(teal)
            front=min([c for c in sleeves if c['area']>1000],key=lambda c:-c['box'][1])
            rear_mask=np.zeros((H,W),bool)
            for c in sleeves:
                if c['area']>100 and c['box'][1]<front['box'][1]:rear_mask|=c['mask']
            rear_mask=dilate(rear_mask)&(gg>gr+15)&(gb>gr+15)&(gg>75)&(ga>0)
            rear=selected(images['gesture'],rear_mask)
            combined=rear.copy();combined.alpha_composite(images['body']);save('body',combined)
            gp[rear_mask,3]=0;save('gesture',Image.fromarray(gp.astype(np.uint8)))
            save('rear-arm-mask',Image.fromarray(np.where(rear_mask,ga,0).astype(np.uint8)),False)
            registrations.append({'id':'sit-native-rear-arm-layering','source':'native/sit-gesture.png','method':'Upper native teal color components plus their antialias fringe selected behind body; foreground wheel, grips and lower/front sleeve remain the animated group','rearMask':'sit-rear-arm-mask.png','rearBounds':box_of(rear_mask),'frontSleeveBounds':list(front['box']),'noDrawnAnatomy':True})
        eye_canvas=empty();pupil_mask=np.zeros((H,W),bool)
        for eye_index,c in enumerate(original_eyes):
            ex0,ey0,ex1,ey1=c['box'];candidates=[d for d in dark_parts if 15<=d['area']<=180 and ex0<=(d['box'][0]+d['box'][2])/2<=ex1 and ey0<=(d['box'][1]+d['box'][3])/2<=ey1];candidate=max(candidates,key=lambda d:d['area'])
            near=(xx>=ex0-2)&(xx<ex1+2)&(yy>=ey0-2)&(yy<ey1+2)
            skin_blue=float(np.median(b[skin_component]));skin_green=float(np.median(g[skin_component]))
            white_signal=(b>skin_blue+8)&(g>skin_green+8)&near
            eye_mask=fill_holes(white_signal|candidate['mask'])&near&(alpha>0)
            px0,py0,px1,py1=candidate['box'];pm=dilate(candidate['mask'])&eye_mask&(np.minimum.reduce([r,g,b])<249);pupil_mask|=pm
            source=white_sources[eye_index]['crop'];cw,ch=source.size;white_patch=source.crop((cw//3,ch//3,cw*2//3,ch*2//3));material,_=cover_material(white_patch,box_of(eye_mask),(W,H));ep=np.array(material)
            coverage=np.clip((b-skin_blue)/(255-skin_blue),0,1);coverage[candidate['mask']]=1
            ep[:,:,3]=np.where(eye_mask,coverage*255,0).astype(np.uint8);eye_canvas.alpha_composite(Image.fromarray(ep))
        save('eyes',eye_canvas);save('pupils',selected(original,pupil_mask))
        blink_canvas=empty()
        for item,box in zip(lid_sources,eye_boxes):
            x0,y0,x1,y1=box;placed(blink_canvas,item['crop'],[x0,y0+(y1-y0)*.4,x1-x0,max(4,(y1-y0)*.35)],pose+'-blink')
        save('blink',blink_canvas)
        for name,items in accent_sources.items():
            canvas=empty();by_y=sorted(items,key=lambda c:c['center'][1]);brows=sorted(by_y[:2],key=lambda c:c['center'][0]);eyes=sorted(by_y[2:4],key=lambda c:c['center'][0]);mouth=by_y[-1]
            for item,ref in zip(brows,original_brows):
                x0,y0,x1,y1=ref['box'];placed(canvas,item['crop'],[x0,y0-2,x1-x0,y1-y0],pose+'-'+name+'-brow')
            for item,box in zip(eyes,eye_boxes):
                x0,y0,x1,y1=box;h=(y1-y0)*(.75 if name=='focus' else .4);placed(canvas,item['crop'],[x0,y0+(y1-y0)*.25,x1-x0,h],pose+'-'+name+'-eye')
            x0,y0,x1,y1=box_of(mouth_mask);h=5 if name=='focus' else y1-y0+2;placed(canvas,mouth['crop'],[x0,y0+(y1-y0-h)/2,x1-x0,h],pose+'-'+name+'-mouth');save(name,canvas)
        assembled=empty()
        layer_order=['body','gesture'] if pose=='sit' else ['gesture','body']
        for name in ['head','neutral','eyes','pupils']+layer_order:assembled.alpha_composite(images[name])
        assembled.save(ROOT/(pose+'-reconstructed.png'))
        for col,im in enumerate([original.copy(),assembled.copy()]):
            im.thumbnail((420,450));x=10+col*450;y=36+index*510;board.paste(im,(x,y),im);bd.text((x,y-26),pose+(' original' if col==0 else ' assembly'),fill='black')
        for col,im in enumerate([original.crop((0,0,W,min(330,H))),assembled.crop((0,0,W,min(330,H)))]):
            im.thumbnail((420,330));x=10+col*450;y=36+index*370;upperboard.paste(im,(x,y),im);ud.text((x,y-26),pose+(' original' if col==0 else ' assembly'),fill='black')
        body_alpha=np.array(images['body'])[:,:,3]>220
        samples=[]
        for angle in range(-5,6):
            transformed=images['gesture'].rotate(angle,resample=Image.Resampling.BICUBIC,center=tuple(spec['pivots']['gesture']))
            for dy in [-3,0,3]:
                shifted=empty();shifted.alpha_composite(transformed,(0,dy))
                overlap=int(np.sum(body_alpha&(np.array(shifted)[:,:,3]>220)))
                samples.append({'angle':angle,'translateY':dy,'opaqueOverlapPixels':overlap})
        minimum=min(c['opaqueOverlapPixels'] for c in samples)
        assert minimum>20,(pose,'Disjoint support',minimum)
        joint_checks.append({'pose':pose,'minimumOpaqueOverlapPixels':minimum,'samples':samples,'limitation':'Alpha overlap supports but does not establish visual anatomical fit; original/rebuilt and actual-motion review required.'})
        rigs[pose]={'width':W,'height':H,'parts':parts,'pivots':spec['pivots'],'layerOrder':['head']+layer_order}
    assert np.array_equal(np.array(head)[structure_mask],np.array(original)[structure_mask]),pose
    fidelity.append({'pose':pose,'baselineSha256':hashlib.sha256((ROOT/'baseline'/(pose+'.png')).read_bytes()).hexdigest(),'repairFile':'assets/art/alex-motion-v1/native/head.png','skinMaterialCrop':crop_box,'materialColorSelectionDistance':color_error,'uniformMaterialScale':k,'skinPaletteTranslation':palette_translation.tolist(),'faceFillScope':'Whole connected face/ears/neck region, original per-pose alpha; one permanent generated-material field','headOriginal':pose+'-head-original.png','faceMask':pose+'-head-face-mask.png','structureMask':pose+'-head-structure-mask.png','browBoundaryRegistration':boundary_registration,'structurePixelsExact':True,'headExteriorAlphaFromOriginal':True,'neckSupport':'Same permanent registered neck derivative overlaps body; generated neck removed; headphones stay on body','neutralBrowsMouth':'Original native pixels at original coordinates','neutralPupils':'Original native pixels at original coordinates','eyes':'Generated white material clipped to original eye regions','eyeBoxes':eye_boxes,'browBoxes':[list(c['box']) for c in original_brows],'mouthBox':box_of(mouth_mask),'neckStart':int(neck_start),'nose':'Omitted; no distinct glyph in original'})
    head_box=box_of(head_mask)
    for col,(label,im) in enumerate([('original',selected(original,head_mask)),('blank',head)]):
        im=im.crop(head_box);im.thumbnail((300,240));x=col*360;y=index*290;headboard.paste(im,(x,y+30),im);hd.text((x+8,y+6),pose+' '+label,fill='black')
    if not args.heads_only:
        im=head.copy()
        for name in ['neutral','eyes','pupils']:im.alpha_composite(images[name])
        im=im.crop(head_box);im.thumbnail((300,240));x=720;y=index*290;headboard.paste(im,(x,y+30),im);hd.text((x+8,y+6),pose+' neutral',fill='black')
if not args.heads_only:
    rigs['drive']={**rigs['sit']}
    (ROOT/'rigs.json').write_text(json.dumps({'poses':rigs},indent=2)+'\n')
    (DOC/'registrations.json').write_text(json.dumps(registrations,indent=2)+'\n');board.save(DOC/'reconstruction.png');upperboard.save(DOC/'upper-body-comparison.png')
    (DOC/'shoulder-overlap.json').write_text(json.dumps({'pass':True,'poses':joint_checks},indent=2)+'\n')
(DOC/'head-fidelity.json').write_text(json.dumps(fidelity,indent=2)+'\n');headboard.save(DOC/'head-fidelity.png')
print('PASS original structural heads/neutral anchors and permanent generated faceless material; no drawn anatomy')
