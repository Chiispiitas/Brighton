"""Reject compressed grammar explanation prose in active Horizons masters.

This catches known regressions. It does not replace a print-size content and
visual judgment of charts, word transformations, source facts or models.
"""
from pathlib import Path
import argparse,json,re
from bs4 import BeautifulSoup

def scan(book):
 path=book/'Practice/manifest.json'
 manifest=json.loads(path.read_text(encoding='utf-8'))if path.exists()else{'masters':[]}
 files=sorted((book/'Lessons').glob('[1-9]*.html'))+[book/m['file']for m in manifest['masters']]
 failures=[];inspected=0;charts=0;coverage=[]
 for file in files:
  doc=BeautifulSoup(file.read_text(encoding='utf-8'),'html.parser');coverage.append(file.relative_to(book).as_posix())
  charts+=len(doc.select('table'))
  for p in doc.select('p,li'):
   if p.find_parent('script')or p.find_parent('style'):continue
   topic=p.find_parent(attrs={'data-grammar-visual':True})
   explicit=p.find_parent(attrs={'data-grammar-explanation':True})
   tool=p.find_parent(attrs={'data-hz-tool':True})
   page=p.find_parent(class_='hz-practice-page')
   bank=page is not None and page.get('data-practice-bank')=='grammar'and not p.find_parent(class_='practice-task')
   if not(topic or explicit or tool or bank):continue
   inspected+=1;text=p.get_text(' ',strip=True);reason=[]
   if 'gp58-form-labels'in p.get('class',[]):reason.append('legacy compressed form paragraph')
   if text.count('→')>=2 and any(x in text for x in ['·',' / ',' = ']):reason.append('multiple rule mappings in one paragraph')
   if re.search(r'\bI\s*→\s*am\b',text):reason.append('subject-to-be fragment instead of model chart')
   if re.search(r'^(?:Usually|Now):\s+\S',text):reason.append('inline tense-label/model prose')
   if re.search(r'\b(?:noun|adjective|subject|base form|infinitive)\s*\+|\+\s*(?:noun|adjective|subject|base form|infinitive)\b',text,re.I):reason.append('formula-like rule paragraph')
   if re.search(r'^(?:We use\b|For actions\b|For (?:positive|negative|questions)\b)',text,re.I):reason.append('verbal rule explanation instead of structured models')
   if reason:
    a=p.find_parent(class_='hz-page');failures.append({'file':file.relative_to(book).as_posix(),'page':a.get('data-page')if a else None,'text':text,'reasons':reason})
 return{'files_reviewed':coverage,'file_count':len(files),'core_masters':len([f for f in files if f.parent.name=='Lessons']),'explanatory_paragraphs_checked':inspected,'native_tables':charts,'failures':failures,'scope':'Grammar explanations and grammatical form references only; source readings, tasks and real spatial diagrams retain their own genre.'}

def main():
 p=argparse.ArgumentParser();p.add_argument('book',nargs='?',default='Horizons/A1');p.add_argument('--report');args=p.parse_args();r=scan(Path(args.book).resolve())
 if args.report:Path(args.report).write_text(json.dumps(r,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
 print(json.dumps({k:v for k,v in r.items()if k!='files_reviewed'},ensure_ascii=False));return bool(r['failures'])
if __name__=='__main__':raise SystemExit(main())
