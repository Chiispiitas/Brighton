"""Guard the reviewed lesson-starter / fuller-reference relationship.

This checks source freshness, lexical coverage and recorded exceptions. It does
not infer teaching quality from word counts or replace the editorial/PDF review.
"""
from pathlib import Path
import argparse,hashlib,json,re
from bs4 import BeautifulSoup

def normalized(text):return re.sub(r'\s+',' ',text).strip()
def text_fingerprint(nodes):
 return hashlib.sha256(normalized(' '.join(x.get_text(' ',strip=True)for x in nodes)).encode()).hexdigest()

def check(book):
 register=json.loads((book/'Sources/Vocabulary-reference-scope.json').read_text(encoding='utf-8'))
 inventory=json.loads((book/'Practice/Vocabulary/study-vocabulary.json').read_text(encoding='utf-8'))
 canonical=json.loads((book/'Practice/Vocabulary/canonical-vocabulary.json').read_text(encoding='utf-8'))
 required={x['topic']:x for x in inventory['topics']};records={x['destination_id']:x for x in register['references']}
 assert len(records)==len(register['references'])and set(records)==set(required),'Every actual lesson-specific reference needs one scope judgment'
 assert {x['canonical_topic']for x in records.values()}=={x['topic']for x in canonical['topics']},'Canonical scope coverage differs'
 for topic in canonical['topics']:
  union={word for row in records.values()if row['canonical_topic']==topic['topic']for word in row['bank_items']}
  assert union==set(topic['required_items']),'Canonical full-bank items differ for '+topic['topic']
 docs={};failures=[];exceptions=[];extensions=0;main_files=set()
 def doc(file):
  if file not in docs:docs[file]=BeautifulSoup((book/file).read_text(encoding='utf-8'),'html.parser')
  return docs[file]
 for key,row in records.items():
  try:
   bank=doc(row['bank_file']).select_one('#'+key);assert bank is not None,'Missing actual reference'
   actual={x['data-vocab-item'].strip()for x in bank.select('[data-vocab-item]')};expected=set(row['bank_items'])
   assert actual==expected==set(required[key]['required_items']),'Actual bank / full inventory / reviewed scope differ'
   starters=set(row['starter_items']);extra=set(row['lexical_extension_items'])
   assert starters<=actual,'Starter words missing from their fuller bank'
   assert extra<=actual-starters,'Claimed extension repeats a starter or is absent'
   assert row['meaning_support']and row['pedagogical_judgment'],'Missing real meaning-support/editorial judgment'
   if row['scope_type']=='open-expanded':assert extra,'Open topic merely mirrors its starter list'
   else:
    assert row['exception_rationale'],'Closed/functional-set exception needs a reason';exceptions.append(key)
   if len(starters)>6:assert row.get('starter_size_rationale'),'Larger starter input needs a reviewed contextual reason'
   assert bank.find_parent('article')['data-page']==str(row['study_page']),'Stale scope pagination'
   for evidence in row['main_evidence']:
    nodes=doc(evidence['file']).select(evidence['selector']);assert nodes,'Missing reviewed main introduction'
    assert text_fingerprint(nodes)==evidence['text_sha256'],'Main input changed; recheck starter scope instead of silently migrating the bank list'
    main_files.add(evidence['file'])
   assert row['main_evidence'],'Main starter selection was not inspected'
   extensions+=len(extra)
  except (AssertionError,KeyError)as error:failures.append({'topic':key,'reason':str(error)})
 return {'references_reviewed':len(records),'canonical_topics':len(canonical['topics']),'main_lesson_files':len(main_files),'bank_extension_occurrences':extensions,'justified_closed_or_functional_sets':exceptions,'failures':failures,'limit':'Freshness and declared scope only; meaningful selection, picture evidence and readability require editorial judgment.'}

def main():
 p=argparse.ArgumentParser();p.add_argument('book',nargs='?',default='Horizons/A1');p.add_argument('--report');a=p.parse_args();r=check(Path(a.book).resolve())
 if a.report:Path(a.report).write_text(json.dumps(r,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
 print(json.dumps(r,ensure_ascii=False));return bool(r['failures'])
if __name__=='__main__':raise SystemExit(main())
