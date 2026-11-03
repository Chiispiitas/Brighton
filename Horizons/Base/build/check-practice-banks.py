"""Validate real Horizons practice destinations and source integration.

Checks links, pagination, source files, topic evidence and keyed master coverage.
Visual quality, response space, diagrams and controlled keys also require the
saved-PDF and editorial reviews recorded in the book audit.
"""
from pathlib import Path
from urllib.parse import unquote
import json,re,sys
from bs4 import BeautifulSoup

def check_compiled_pages(book,compiled):
 pages=compiled.select('.hz-page')
 values=[p.get('data-page','')for p in pages]
 numeric=[int(v)for v in values if v.isdecimal()]
 first=1 if(book/'Frontmatter/manifest.json').is_file()else 5
 assert numeric and numeric==list(range(first,numeric[-1]+1)),'Assembled numbered pages are not consecutive'
 assert len(values)==len(set(values)),'Duplicate assembled page identities'
 allowed={'front-cover','title-page','back-cover'}
 required={'front-cover','back-cover'}
 for page,value in zip(pages,values):
  if value.isdecimal():
   assert page.get('id')==f'page-{value}',f'Wrong assembled numbered page target: {value}'
   footer=page.select_one('.hz-page-number')
   assert footer and footer.get_text(strip=True)==value,f'Wrong assembled printed footer: {value}'
  else:
   assert first==1 and value in allowed,f'Unknown unnumbered page: {value}'
   assert page.get('id')==value and page.get('data-page-label','').strip(),f'Unnumbered page needs its own target and viewer label: {value}'
   assert not any(x.get_text(strip=True)for x in page.select('.hz-page-number')),f'Unnumbered page has a printed number: {value}'
 if first==1:
  assert values[0]=='front-cover','The front cover must be first'
  assert values[-1]=='back-cover','The back cover must be last'
  unnumbered={v for v in values if not v.isdecimal()}
  assert required<=unnumbered<=allowed,'Front and back covers need distinct unnumbered identities; the title may be numbered or unnumbered'

def lesson_banks(book,manifest):
 required={t['topic']:t for t in json.loads((book/'Practice/Vocabulary/study-vocabulary.json').read_text(encoding='utf-8'))['topics']}
 topics={};numbers=[];slots=[];lessons=set();refs=0;studies=0;images=0;tasks=0;section_count=0;paired_pages=0
 def owner(node):
  return node if 'lp-section'in node.get('class',[])else node.find_parent(class_='lp-section')or(node if node.name=='article'else node.find_parent('article'))
 for master in manifest['masters']:
  file=book/master['file'];doc=BeautifulSoup(file.read_text(encoding='utf-8'),'html.parser');actual=[];section_codes=[]
  for page in doc.select('article.hz-page'):
   n=int(page['data-page']);actual.append(n);numbers.append(n);assert page['id']==f'page-{n}' and page.select_one('.hz-page-number').get_text(strip=True)==str(n)
   kind=master['kind'];tasks+=len(page.select('.practice-task,.cp-task'))
   if kind in ['grammar','vocabulary']:
    sections=page.select('main > .lp-section')
    if manifest.get('version',1)>=4:assert sections,f'{file}: practice page needs explicit lesson sections'
    sections=sections or[page]
    assert 1<=len(sections)<=2,f'{file}: maximum two lesson sections per page'
    codes=[section.get('data-practice-lesson')for section in sections]
    assert len(set(codes))==len(codes),f'{file}: duplicate lesson sections on one page'
    if page.has_attr('data-practice-lessons'):assert page['data-practice-lessons'].split()==codes,f'{file}: page lesson list mismatch'
    section_count+=len(sections);paired_pages+=len(sections)==2
    for section,code in zip(sections,codes):
     assert re.fullmatch(r'[1-8][A-D]',code or''),f'{file}: section needs one actual lesson code'
     assert int(code[0])==master['unit'],f'{file}: section belongs to another unit'
     source=BeautifulSoup((book/f'Lessons/{code}.html').read_text(encoding='utf-8'),'html.parser')
     headers=section.select('.lp-header');assert len(headers)==1,f'{file}: each section needs its own full lesson header'
     assert headers[0].select_one('.hz-lesson-tab__id').get_text(strip=True)==code,f'{file}: lesson badge mismatch'
     assert headers[0].select_one('.hz-lesson-title').get_text(' ',strip=True)==source.select_one('.hz-lesson-title').get_text(' ',strip=True),f'{file}: main title mismatch'
     assert headers[0].select_one('.hz-objectives').get_text(' ',strip=True)==source.select_one('.hz-objectives').get_text(' ',strip=True),f'{file}: main outcome mismatch'
     lessons.add((kind,code));section_codes.append(code)
     for a in section.select('.practice-topic >h2 small a'):assert a.get_text(strip=True)==code,f'{file}: mixed lesson topic labels'
     if kind=='vocabulary':assert section.select('img[src]'),f'{file}: vocabulary lesson section has no picture'
    assert all(svg.get('data-editorial-labels')=='true'for svg in page.select('svg')),f'{file}: pictorial SVG is not allowed'
    assert not page.select('.gp14-phone,.gp14-tokens,.gp14-tomatoes,.gp58-weather-symbol'),f'{file}: pictorial CSS substitute'
   if kind=='vocabulary':
    assert page.select('img[src]'),f'{file}: vocabulary page has no picture'
    for section in page.select('.vs-topic[id]'):
     key=section['id'];assert key in required,key;studies+=1
     items={x['data-vocab-item']for x in section.select('[data-vocab-item]')};assert not set(required[key]['required_items'])-items,f'{key}: incomplete word bank'
     a=section.select_one('.vs-practice-link');target=doc.find(id=a['href'][1:]);assert target,key
     ap=target.find_parent('article');delta=int(ap['data-page'])-n;code=owner(section).get('data-practice-lesson');assert 0<=delta<=1 and owner(target).get('data-practice-lesson')==code,f'{key}: practice separated from its own lesson'
     assert a.get('data-target-page')==ap['data-page']and('below'in a.get_text().lower()if delta==0 else ap['data-page']in a.get_text()),f'{key}: practice page label mismatch'
   for img in page.select('img[src]'):
    p=(file.parent/unquote(img['src'])).resolve();assert p.is_file()and img.get('alt','').strip(),f'{file}: image missing or undescribed'
    if kind=='vocabulary':assert p.is_relative_to((book/'Practice/Images').resolve()),f'{file}: reused core picture'
    images+=1
   for t in page.select('[id]'):
    key=t['id']
    if re.match(r'^(grammar|vocabulary|communication)-',key):assert key not in topics,key;topics[key]=(master['file'],n,owner(t).get('data-practice-lesson'))
   for slot in page.select('.blooket-slot'):
    assert slot.select_one('.blooket-slot__qr')and not slot.select('img,a[href]');slots.append((slot['data-blooket-bank'],int(slot['data-blooket-unit'])))
  assert actual==master['pages'],file
  assert section_codes==sorted(section_codes),f'{file}: lesson sections are out of source order'
 assert numbers==list(range(manifest['first_printed_page'],manifest['last_printed_page']+1))
 assert sorted(slots)==sorted((k,u)for k in ['grammar','vocabulary']for u in range(1,9))
 assert studies==len(required)==43
 assert sum(k=='grammar'for k,c in lessons)==27 and sum(k=='vocabulary'for k,c in lessons)==32
 for file in (book/'Lessons').glob('*.html'):
  doc=BeautifulSoup(file.read_text(encoding='utf-8'),'html.parser')
  for ref in doc.select('.hz-go-to'):
   key=ref['data-reference-topic'];assert key in topics;target,n,code=topics[key];a=ref.select_one('a');p,fragment=a['href'].split('#',1)
   assert (file.parent/unquote(p)).resolve()==(book/target).resolve()and fragment==key
   assert re.search(r'\bpage\s+'+str(n)+r'\b',ref.get_text()),file
   assert key.startswith('communication-')or code==file.stem,f'{file}: practice goes to another lesson'
   refs+=1
 source_routes=json.loads((book/'Sources/Practice-destinations.json').read_text(encoding='utf-8'))['references']
 assert refs==len(source_routes)==manifest['counts']['forward_references'],'Main/practice reference registry differs from actual links'
 assert tasks==147,'Existing authored practice task count changed; review task/key scope explicitly'
 assert set(topics)==set(manifest['destinations'])
 for key,r in manifest['destinations'].items():assert topics[key][:2]==(r['file'],r['page'])
 compiled=BeautifulSoup((book/"Student's Book.html").read_text(encoding='utf-8'),'html.parser');ids=[n['id']for n in compiled.select('[id]')];assert len(ids)==len(set(ids))
 check_compiled_pages(book,compiled)
 for a in compiled.select('a[href^="#"]'):assert unquote(a['href'][1:])in ids,a['href']
 print(json.dumps({'practice_pages':len(numbers),'lesson_sections':section_count,'paired_pages':paired_pages,'lesson_specific_grammar':27,'lesson_specific_vocabulary':32,'reference_topics':studies,'lesson_references':refs,'activities':tasks,'raster_uses':images,'structural_checks':'passed'}))
 return 0

def main():
 book=Path(sys.argv[1] if len(sys.argv)>1 else 'Horizons/A1').resolve()
 manifest=json.loads((book/'Practice/manifest.json').read_text(encoding='utf-8-sig'))
 if manifest.get('version',1)>=3:return lesson_banks(book,manifest)
 pages=[];topics={};images=0;study_topics=set();study_pages=0
 lexicon=json.loads((book/'Practice/Vocabulary/study-vocabulary.json').read_text(encoding='utf-8'))
 required={t['topic']:t for t in lexicon['topics']}
 for master in manifest['masters']:
  file=book/master['file'];doc=BeautifulSoup(file.read_text(encoding='utf-8'),'html.parser')
  if master['kind']=='vocabulary':
   study=doc.select('.vs-study-page');activity=doc.select('.hz-page:not(.vs-study-page)')
   assert study and activity,f'{file}: vocabulary needs study references before activities'
   assert [int(x['data-page']) for x in study]==master['study_pages'],f'{file}: study pagination differs'
   assert [int(x['data-page']) for x in activity]==master['activity_pages'],f'{file}: activity pagination differs'
   # Each topic reference immediately leads into its own practice group.
   # Units may interleave several word-bank/practice groups.
   assert not doc.select('.vs-study-page .practice-task'),f'{file}: reference pages cannot contain only games'
   study_pages+=len(study)
   for section in doc.select('.vs-study-page .practice-topic[id]'):
    name=section['id'];assert name in required,f'{name}: vocabulary inventory missing'
    nodes=section.select('[data-vocab-item]');items={e['data-vocab-item'].strip() for e in nodes}
    assert nodes and all(e.get_text(' ',strip=True) for e in nodes),f'{name}: study words are empty'
    missing=set(required[name]['required_items'])-items
    assert not missing,f'{name}: missing study vocabulary {sorted(missing)}'
    target=doc.find(id='activity-'+name);assert target and not target.find_parent(class_='vs-study-page'),f'{name}: activity missing'
    link=section.select_one('.vs-practice-link');n=int(target.find_parent('article')['data-page'])
    reference=int(section.find_parent('article')['data-page'])
    assert 1<=n-reference<=2,f'{name}: keep word bank and practice next to each other'
    assert not any(reference<int(p['data-page'])<n for p in study),f'{name}: unrelated word bank separates reference and practice'
    assert link and link.get('href')=='#activity-'+name and re.search(r'\bpage\s+'+str(n)+r'\b',link.get_text()),f'{name}: activity link/page wrong'
    back=target.select_one('h2 a.vs-wordbank-return');assert back and back.get('href')=='#'+name,f'{name}: word-bank return missing'
    study_topics.add(name)
   for page in activity:
    refs={int(doc.find(id=a['href'][1:]).find_parent('article')['data-page']) for a in page.select('.vs-wordbank-return')}
    assert len(refs)==1,f'{file}: each activity page must use one neighbouring word bank'
    n=refs.pop();header=page.select_one('.vs-wordbank-page-link')
    assert header and header.get('href')==f'#page-{n}' and header.get_text(strip=True)==f'Word bank · page {n}',f'{file}: activity header must identify its exact neighbouring word bank'
  actual=[]
  for page in doc.select('.hz-page'):
   n=int(page['data-page']);actual.append(n);pages.append(n)
   assert page.get('id')==f'page-{n}',f'{file}: missing page target'
   assert page.select_one('.hz-page-number').get_text(strip=True)==str(n),f'{file}: wrong footer'
   if master['kind']=='vocabulary':assert page.select('img[src]'),f'{file}: every vocabulary study/activity page needs a meaningful imagegen picture'
   if master['kind'] in ['grammar','vocabulary']:
    assert all(svg.get('data-editorial-labels')=='true' for svg in page.select('svg')),f'{file}: pictorial SVG must be replaced with imagegen artwork'
    assert not page.select('.gp14-phone,.gp14-tokens,.gp14-tomatoes,.gp58-weather-symbol'),f'{file}: CSS/symbol clipart is not permitted in practice'
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
  check_compiled_pages(book,doc)
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
 assert study_topics==set(required),'Study reference coverage differs from the reviewed vocabulary inventory'
 print(json.dumps({'practice_pages':len(pages),'masters':len(manifest['masters']),'authored_topics':len(topics),'resolved_lesson_links':refs,'vocabulary_study_pages':study_pages,'studied_vocabulary_topics':len(study_topics),'required_entry_occurrences':sum(len(t['required_items'])for t in required.values()),'raster_uses':images,'structural_checks':'passed'}))
 return 0
if __name__=='__main__':sys.exit(main())
