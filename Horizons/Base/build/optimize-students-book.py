"""Optimize a native browser PDF while preserving vector pattern resources.

The source remains unchanged. Images above330dpi are reduced to240dpi at
high photographic quality; live text, vectors and links remain live.
"""
from pathlib import Path
from collections import Counter
import argparse,json,tempfile,os,gc
import fitz
from pypdf import PdfReader,PdfWriter
from pypdf.generic import DictionaryObject,NameObject,EncodedStreamObject,ContentStream

def isolate_repeated_images(source, target):
 """Prevent repeated resampling of a shared image used in CSS crop viewports.

 MuPDF can resize the same shared XObject again for every Do operation,
 progressively quartering its pixels and reusing a mismatched alpha mask.
 Give repeated uses independent original streams before rewriting images.
 """
 r=PdfReader(source);w=PdfWriter();w.clone_document_from_reader(r)
 uses=[];counts=Counter()
 for pi,page in enumerate(w.pages):
  res=page['/Resources'].get_object();xs=res.get('/XObject',DictionaryObject()).get_object();content=page.get_contents()
  if content is None:continue
  for oi,(operands,operator) in enumerate(content.operations):
   if operator!=b'Do':continue
   name=operands[0];ref=xs.raw_get(name);obj=ref.get_object()
   if obj.get('/Subtype')!='/Image':continue
   identity=(getattr(ref,'idnum',id(obj)),getattr(ref,'generation',0))
   uses.append((pi,oi,name,obj,identity));counts[identity]+=1
  page.replace_contents(content)
 def clone_stream(obj):
  new=EncodedStreamObject();new.update(obj);new._data=obj._data
  if '/SMask'in obj:new[NameObject('/SMask')]=w._add_object(clone_stream(obj['/SMask'].get_object()))
  return new
 isolated=0
 bypage={}
 for use in uses:
  if counts[use[4]]>1:bypage.setdefault(use[0],[]).append(use)
 for pi,rows in bypage.items():
  page=w.pages[pi];res=DictionaryObject(page['/Resources'].get_object());xs=DictionaryObject(res.get('/XObject',DictionaryObject()).get_object());content=page.get_contents()
  original_names=set()
  for _,oi,name,obj,_ in rows:
   fresh=NameObject(f'/HZImage{isolated}');xs[fresh]=w._add_object(clone_stream(obj));content.operations[oi][0][0]=fresh;original_names.add(name);isolated+=1
  for name in original_names:del xs[name]
  res[NameObject('/XObject')]=xs;page[NameObject('/Resources')]=w._add_object(res);page.replace_contents(content)
 with target.open('wb')as f:w.write(f)
 return isolated

def main():
 p=argparse.ArgumentParser();p.add_argument('source');p.add_argument('output');a=p.parse_args();source=Path(a.source).resolve();out=Path(a.output).resolve();assert source!=out
 handle,tmp=tempfile.mkstemp(prefix='.horizons-pdf-',suffix='.pdf',dir=out.parent);os.close(handle);tmp=Path(tmp)
 handle,unique=tempfile.mkstemp(prefix='.horizons-images-',suffix='.pdf',dir=out.parent);os.close(handle);unique=Path(unique)
 try:
  isolated=isolate_repeated_images(source,unique);gc.collect()
  d=fitz.open(unique);d.rewrite_images(dpi_threshold=330,dpi_target=240,quality=88);d.save(tmp,garbage=4,deflate=True,deflate_images=True,deflate_fonts=True);d.close()
  original=PdfReader(source);optimized=PdfReader(tmp);w=PdfWriter();w.clone_document_from_reader(optimized);restored=[]
  for i,(raw,page) in enumerate(zip(original.pages,w.pages)):
   before=raw['/Resources'].get('/Pattern',DictionaryObject()).get_object();res=page['/Resources'].get_object();after=res.get('/Pattern',DictionaryObject()).get_object();missing=set(before)-set(after)
   if missing:
    # MuPDF image rewriting can omit tiling patterns used by native CSS
    # graphics. Restore only those vector resources, retaining optimized
    # images, page identity and all original link annotations.
    patterns=DictionaryObject(after)
    for name in sorted(missing):patterns[NameObject(name)]=before.raw_get(name).clone(w)
    res[NameObject('/Pattern')]=patterns;restored.append({'physical_page':i+1,'patterns':sorted(missing)})
  with out.open('wb')as f:w.write(f)
  print(json.dumps({'pages':len(w.pages),'bytes':out.stat().st_size,'isolated_repeated_image_uses':isolated,'restored_vector_patterns':restored}))
 finally:
  if tmp.exists():tmp.unlink()
  if unique.exists():unique.unlink()
if __name__=='__main__':main()
