"""Optimize a native browser PDF while preserving vector pattern resources.

The source remains unchanged. Images above330dpi are reduced to240dpi at
high photographic quality; live text, vectors and links remain live.
"""
from pathlib import Path
import argparse,json,tempfile,os
import fitz
from pypdf import PdfReader,PdfWriter
from pypdf.generic import DictionaryObject,NameObject

def main():
 p=argparse.ArgumentParser();p.add_argument('source');p.add_argument('output');a=p.parse_args();source=Path(a.source).resolve();out=Path(a.output).resolve();assert source!=out
 handle,tmp=tempfile.mkstemp(prefix='.horizons-pdf-',suffix='.pdf',dir=out.parent);os.close(handle);tmp=Path(tmp)
 try:
  d=fitz.open(source);d.rewrite_images(dpi_threshold=330,dpi_target=240,quality=88);d.save(tmp,garbage=4,deflate=True,deflate_images=True,deflate_fonts=True);d.close()
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
  print(json.dumps({'pages':len(w.pages),'bytes':out.stat().st_size,'restored_vector_patterns':restored}))
 finally:
  if tmp.exists():tmp.unlink()
if __name__=='__main__':main()
