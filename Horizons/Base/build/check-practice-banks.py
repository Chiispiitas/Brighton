"""Validate real Horizons practice destinations and source integration.

Checks links, pagination, source files, topic evidence and keyed master coverage.
Visual quality, response space, diagrams and controlled keys also require the
saved-PDF and editorial reviews recorded in the book audit.
"""
from pathlib import Path
from urllib.parse import unquote
import json,re,sys
from bs4 import BeautifulSoup

def main():
 book=Path(sys.argv[1] if len(sys.argv)>1 else 'Horizons/A1').resolve()
 manifest=json.loads((book/'Practice/manifest.json').read_text(encoding='utf-8-sig'))
 pages=[];topics={};images=0
 for master in manifest['masters']:
  file=book/master['file'];doc=BeautifulSoup(file.read_text(encoding='utf-8'),'html.parser')
  actual=[]
  for page in doc.select('.hz-page'):
   n=int(page['data-page']);actual.append(n);pages.append(n)
   assert page.get('id')==f'page-{n}',f'{file}: missing page target'
   assert page.select_one('.hz-page-number').get_text(strip=True)==str(n),f'{file}: wrong footer'
   if master['kind']=='vocabulary':assert page.select('img,svg,table,[data-practice-resource]'),f'{file}: vocabulary page has no visible teaching evidence'
   for img in page.select('img[src]'):
    image_path=(file.parent/unquote(img['src'])).resolve()
    assert image_path.is_file(),f'{file}: missing {img["src"]}'
    if master['kind']=='vocabulary':assert image_path.is_relative_to((book/'Practice/Images').resolve()),f'{file}: vocabulary recycles a lesson image instead of a unique practice resource'
    assert img.get('alt','').strip(),f'{file}: image lacks description'
    images+=1
   for el in page.select('[id]'):
    k=el['id']
    if not re.match(r'^(grammar|vocabulary|communication)-',k):continue
    assert k not in topics,f'Duplicate topic {k}'
    assert len(el.get_text(' ',strip=True))>=20,f'{k}: destination has no substantive practice'
    topics[k]=(master['file'],n)
  assert actual==master['pages'],f'{file}: manifest pages do not match'
 assert pages==list(range(manifest['first_printed_page'],manifest['first_printed_page']+len(pages))),f'Practice pages are not continuous: {pages}'
 refs=0
 for file in (book/'Lessons').glob('*.html'):
  doc=BeautifulSoup(file.read_text(encoding='utf-8'),'html.parser')
  for ref in doc.select('.hz-go-to'):
   key=ref.get('data-reference-topic');assert key in topics,f'{file}: missing topic {key}'
   anchor=ref.select_one('a[href]');assert anchor,f'{file}: topic has no working link'
   href=anchor['href'];target,fragment=href.split('#',1)
   assert fragment==key,f'{file}: wrong topic fragment'
   path=(file.parent/unquote(target)).resolve();expected,n=topics[key]
   assert path==(book/expected).resolve(),f'{file}: wrong practice file'
   assert re.search(r'\bpage\s+'+str(n)+r'\b',ref.get_text()),f'{file}: wrong printed page'
   refs+=1
 expected=json.loads((book/'Sources/Practice-destinations.json').read_text(encoding='utf-8'))
 assert refs==len(expected['references'])==manifest['counts']['forward_references'],f'Forward reference count changed: {refs}'
 assert set(topics)==set(manifest['destinations']), 'Authored topic manifest out of date'
 for key,record in manifest['destinations'].items():assert topics[key]==(record['file'],record['page']),key
 for key in ['Grammar practice 1-4.md','Grammar practice 5-8.md','Vocabulary practice.md','Practical language practice.md']:
  p=book/'Answer keys'/key;assert p.is_file() and len(p.read_text(encoding='utf-8'))>600,f'Missing key {key}'
 compiled=book/"Student's Book.html"
 if compiled.exists():
  doc=BeautifulSoup(compiled.read_text(encoding='utf-8'),'html.parser');ids=[n['id']for n in doc.select('[id]')];duplicates=sorted(k for k in set(ids)if ids.count(k)>1);assert not duplicates,f'Duplicate assembled targets: {duplicates}'
  nums=[int(x['data-page'])for x in doc.select('.hz-page')];assert nums==list(range(5,nums[-1]+1)), 'Assembled page order is not consecutive'
  for a in doc.select('a[href^="#"]'):
   assert unquote(a['href'][1:])in ids,f'Missing assembled anchor {a["href"]}'
 slots=[]
 for master in manifest['masters']:
  doc=BeautifulSoup((book/master['file']).read_text(encoding='utf-8'),'html.parser')
  for slot in doc.select('.blooket-slot'):
   assert slot.select_one('.blooket-slot__qr') is not None, 'Missing blank QR square'
   assert not slot.select('img,a[href]'), 'Reserved QR slot must not fake a code or enabled link'
   slots.append((slot.get('data-blooket-bank'),int(slot['data-blooket-unit'])))
 assert sorted(slots)==sorted((bank,u)for bank in ['grammar','vocabulary']for u in range(1,9)), 'Expected one reserved grammar and vocabulary QR slot per unit'
 print(json.dumps({'practice_pages':len(pages),'masters':len(manifest['masters']),'authored_topics':len(topics),'resolved_lesson_links':refs,'raster_uses':images,'structural_checks':'passed'}))
 return 0
if __name__=='__main__':sys.exit(main())
