"""Check declared visual identity coverage; a personal visual review is still required.

Use for every current/future Horizons level: python .../check-visual-spirit.py Horizons/A1
"""
from pathlib import Path
from bs4 import BeautifulSoup
import json,re,sys

def main():
 book=Path(sys.argv[1] if len(sys.argv)>1 else 'Horizons/A1').resolve()
 register=json.loads((book/'Sources/Visual-personality.json').read_text(encoding='utf-8'))
 records={x['lesson']:x for x in register['spreads']};problems=[];panels=0;selectors=0;masters=[]
 for p in (book/'Lessons').glob('*.html'):
  if not re.fullmatch(r'\d+[A-DR]',p.stem):continue
  masters.append(p.stem);doc=BeautifulSoup(p.read_text(encoding='utf-8'),'html.parser');entry=records.get(p.stem)
  if not entry or not entry.get('visual_idea') or not entry.get('protected_elements'):problems.append(p.stem+': missing explicit visual idea/protected elements');continue
  for x in entry.get('selectors',[]):
   if not doc.select(x):problems.append(p.stem+': protected selector missing: '+x)
   selectors+=1
  for x in doc.select('.hz-focus-box'):
   if x.get('data-hz-tool') not in {'grammar','vocabulary','communication','writing','skills','pronunciation'}:problems.append(p.stem+': undeclared functional tool role')
   panels+=1
 if set(records)!=set(masters):problems.append('Visual register does not cover exactly the produced masters')
 assert not problems,'\n'.join(problems)
 print(f'Visual spirit declared for {len(masters)} spreads; {panels} functional tools; {selectors} protected selectors resolve.')
 print('Coverage only. Inspect colour/contrast, adult warmth, display lettering, images, writing space and neighbouring spreads in the saved PDF.')
 return 0

if __name__=='__main__':sys.exit(main())
